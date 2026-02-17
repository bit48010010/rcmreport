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

    // Monthly AdjRW breakdown
    const sqlMonthly = `
    SELECT
      DATE_FORMAT(v.dchdate, '%Y-%m') AS ym,
      COUNT(DISTINCT v.an) AS an_count,
      COUNT(DISTINCT v.hn) AS hn_count,
      ROUND(SUM(IFNULL(ii.adjrw, 0)), 2) AS sum_adjrw,
      ROUND(AVG(IFNULL(ii.adjrw, 0)), 4) AS avg_adjrw,
      ROUND(MIN(IFNULL(ii.adjrw, 0)), 4) AS min_adjrw,
      ROUND(MAX(IFNULL(ii.adjrw, 0)), 4) AS max_adjrw
    FROM an_stat v
      JOIN ipt ii ON ii.an = v.an
    WHERE v.dchdate BETWEEN ? AND ?
      ${pttypes.length > 0 ? `AND ii.pttype IN (${pttypes.map(() => "?").join(",")})` : ""}
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
      ROUND(SUM(IFNULL(ii.adjrw, 0)), 2) AS total_adjrw,
      ROUND(AVG(IFNULL(ii.adjrw, 0)), 4) AS avg_adjrw,
      ROUND(MIN(IFNULL(ii.adjrw, 0)), 4) AS min_adjrw,
      ROUND(MAX(IFNULL(ii.adjrw, 0)), 4) AS max_adjrw
    FROM an_stat v
      JOIN ipt ii ON ii.an = v.an
    WHERE v.dchdate BETWEEN ? AND ?
      ${pttypes.length > 0 ? `AND ii.pttype IN (${pttypes.map(() => "?").join(",")})` : ""}
    `;

    const paramsTotal: (string | number)[] = [startDate, endDate, ...pttypes];
    const [totalRows] = await hosPool.execute<RowDataPacket[]>(sqlTotal, paramsTotal);

    return NextResponse.json({
      success: true,
      data: monthlyRows,
      summary: totalRows[0] || {},
      total: (monthlyRows as RowDataPacket[]).length,
      startDate,
      endDate,
    });
  } catch (error: unknown) {
    console.error("IPD AdjRW query error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูล";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
