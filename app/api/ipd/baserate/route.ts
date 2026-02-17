import { NextRequest, NextResponse } from "next/server";
import hosPool from "@/lib/dbhos";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || new Date().toISOString().slice(0, 10);
    const endDate = searchParams.get("endDate") || startDate;
    const pttypeParam = searchParams.get("pttype") || "";
    const pttypes = pttypeParam ? pttypeParam.split(",").filter(Boolean) : [];

    const pttypeFilter = pttypes.length > 0
      ? `AND ii.pttype IN (${pttypes.map(() => "?").join(",")})`
      : "";

    // Monthly Base Rate breakdown (from an_stat)
    // Base Rate = Total Income / Total AdjRW
    const sqlMonthly = `
    SELECT
      DATE_FORMAT(v.dchdate, '%Y-%m') AS ym,
      COUNT(DISTINCT v.an) AS an_count,
      COUNT(DISTINCT v.hn) AS hn_count,
      ROUND(SUM(IFNULL(v.income, 0)), 2) AS sum_income,
      ROUND(SUM(IFNULL(v.rcpt_money, 0)), 2) AS sum_rcpt,
      ROUND(SUM(IFNULL(ii.adjrw, 0)), 2) AS sum_adjrw,
      ROUND(SUM(IFNULL(v.income, 0)) / NULLIF(SUM(IFNULL(ii.adjrw, 0)), 0), 2) AS base_rate
    FROM an_stat v
      JOIN ipt ii ON ii.an = v.an
    WHERE v.dchdate BETWEEN ? AND ?
      ${pttypeFilter}
    GROUP BY DATE_FORMAT(v.dchdate, '%Y-%m')
    ORDER BY ym
    `;

    const paramsMonthly: (string | number)[] = [startDate, endDate, ...pttypes];
    const [monthlyRows] = await hosPool.execute<RowDataPacket[]>(sqlMonthly, paramsMonthly);

    // Overall summary
    const sqlTotal = `
    SELECT
      COUNT(DISTINCT v.an) AS total_an,
      COUNT(DISTINCT v.hn) AS total_hn,
      ROUND(SUM(IFNULL(v.income, 0)), 2) AS total_income,
      ROUND(SUM(IFNULL(v.rcpt_money, 0)), 2) AS total_rcpt,
      ROUND(SUM(IFNULL(ii.adjrw, 0)), 2) AS total_adjrw,
      ROUND(SUM(IFNULL(v.income, 0)) / NULLIF(SUM(IFNULL(ii.adjrw, 0)), 0), 2) AS base_rate,
      ROUND(AVG(IFNULL(DATEDIFF(ii.dchdate, ii.regdate), 0)), 2) AS avg_los,
      ROUND(SUM(IFNULL(ii.adjrw, 0)) / NULLIF(COUNT(DISTINCT v.an), 0), 4) AS cmi,
      ROUND(SUM(IFNULL(v.income, 0)) - SUM(IFNULL(v.rcpt_money, 0)), 2) AS claim_debt
    FROM an_stat v
      JOIN ipt ii ON ii.an = v.an
    WHERE v.dchdate BETWEEN ? AND ?
      ${pttypeFilter}
    `;

    const paramsTotal: (string | number)[] = [startDate, endDate, ...pttypes];
    const [totalRows] = await hosPool.execute<RowDataPacket[]>(sqlTotal, paramsTotal);

    // REP count from repdata
    const sqlRepCount = `
    SELECT COUNT(DISTINCT rd.an) AS rep_count
    FROM rcmdb.repdata rd
      JOIN ipt ii ON ii.an = rd.an
      JOIN an_stat v ON v.an = rd.an
    WHERE v.dchdate BETWEEN ? AND ?
      ${pttypeFilter}
      AND rd.rep IS NOT NULL AND rd.rep != ''
    `;
    const paramsRepCount: (string | number)[] = [startDate, endDate, ...pttypes];
    const [repCountRows] = await hosPool.execute<RowDataPacket[]>(sqlRepCount, paramsRepCount);

    const summaryObj = {
      ...(totalRows[0] || {}),
      rep_count: (repCountRows[0] as RowDataPacket)?.rep_count || 0,
    };

    // Base Rate distribution from repdata table
    // Group by baserated value, count ANs per each base rate
    const sqlBaseratedDist = `
    SELECT
      IFNULL(rd.baserated, 0) AS baserated,
      COUNT(DISTINCT rd.an) AS an_count,
      ROUND(SUM(IFNULL(rd.adjrw, 0)), 2) AS sum_adjrw,
      ROUND(SUM(IFNULL(rd.compensated, 0)), 2) AS sum_compensated
    FROM rcmdb.repdata rd
      JOIN ipt ii ON ii.an = rd.an
      JOIN an_stat v ON v.an = rd.an
    WHERE v.dchdate BETWEEN ? AND ?
      ${pttypeFilter}
      AND IFNULL(rd.baserated, 0) > 0
    GROUP BY rd.baserated
    ORDER BY rd.baserated
    `;

    const paramsDist: (string | number)[] = [startDate, endDate, ...pttypes];
    const [distRows] = await hosPool.execute<RowDataPacket[]>(sqlBaseratedDist, paramsDist);

    // Monthly Base Rate from repdata (per-AN baserated, averaged per month)
    const sqlMonthlyRepdata = `
    SELECT
      DATE_FORMAT(v.dchdate, '%Y-%m') AS ym,
      COUNT(DISTINCT rd.an) AS an_count,
      ROUND(AVG(IFNULL(rd.baserated, 0)), 2) AS avg_baserated,
      ROUND(SUM(IFNULL(rd.compensated, 0)), 2) AS sum_compensated,
      ROUND(SUM(IFNULL(rd.adjrw, 0)), 2) AS sum_adjrw
    FROM rcmdb.repdata rd
      JOIN ipt ii ON ii.an = rd.an
      JOIN an_stat v ON v.an = rd.an
    WHERE v.dchdate BETWEEN ? AND ?
      ${pttypeFilter}
      AND IFNULL(rd.baserated, 0) > 0
    GROUP BY DATE_FORMAT(v.dchdate, '%Y-%m')
    ORDER BY ym
    `;

    const paramsMonthlyRep: (string | number)[] = [startDate, endDate, ...pttypes];
    const [monthlyRepdataRows] = await hosPool.execute<RowDataPacket[]>(sqlMonthlyRepdata, paramsMonthlyRep);

    // Monthly compensated from repeclaim (รายได้รายเดือนจาก statement)
    const sqlMonthlyEclaim = `
    SELECT
      DATE_FORMAT(v.dchdate, '%Y-%m') AS ym,
      COUNT(DISTINCT re.an) AS an_count,
      ROUND(SUM(IFNULL(re.compensated, 0)), 2) AS sum_compensated
    FROM rcmdb.repeclaim re
      JOIN ipt ii ON ii.an = re.an
      JOIN an_stat v ON v.an = re.an
    WHERE v.dchdate BETWEEN ? AND ?
      ${pttypeFilter}
    GROUP BY DATE_FORMAT(v.dchdate, '%Y-%m')
    ORDER BY ym
    `;

    const paramsEclaim: (string | number)[] = [startDate, endDate, ...pttypes];
    const [monthlyEclaimRows] = await hosPool.execute<RowDataPacket[]>(sqlMonthlyEclaim, paramsEclaim);

    return NextResponse.json({
      success: true,
      data: monthlyRows,
      summary: summaryObj,
      baserated_dist: distRows,
      monthly_repdata: monthlyRepdataRows,
      monthly_eclaim: monthlyEclaimRows,
      total: (monthlyRows as RowDataPacket[]).length,
      startDate,
      endDate,
    });
  } catch (error: unknown) {
    console.error("IPD Base Rate query error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูล";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
