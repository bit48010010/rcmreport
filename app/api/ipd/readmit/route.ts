import { NextRequest, NextResponse } from "next/server";
import hosPool from "@/lib/dbhos";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || new Date().toISOString().slice(0, 10);
    const endDate = searchParams.get("endDate") || startDate;
    const withinDays = parseInt(searchParams.get("days") || "28", 10);
    const pttypeParam = searchParams.get("pttype") || "";
    const pttypes = pttypeParam ? pttypeParam.split(",").filter(Boolean) : [];

    // Find re-admissions: same HN admitted again within N days of previous discharge
    // curr = current admission, prev = previous admission
    const sqlReadmit = `
    SELECT
      curr.an AS readmit_an,
      curr.hn,
      p.fname,
      p.lname,
      DATE_FORMAT(prev.dchdate, '%Y-%m-%d') AS prev_dchdate,
      DATE_FORMAT(curr.regdate, '%Y-%m-%d') AS readmit_date,
      DATE_FORMAT(curr.dchdate, '%Y-%m-%d') AS readmit_dchdate,
      DATEDIFF(curr.regdate, prev.dchdate) AS gap_days,
      prev.an AS prev_an,
      dx_prev.icd10 AS prev_pdx,
      ic_prev.name AS prev_pdx_name,
      dx_curr.icd10 AS curr_pdx,
      ic_curr.name AS curr_pdx_name,
      DATE_FORMAT(curr.regdate, '%Y-%m') AS ym
    FROM ipt curr
      JOIN ipt prev ON prev.hn = curr.hn
        AND prev.an <> curr.an
        AND prev.dchdate IS NOT NULL
        AND curr.regdate > prev.dchdate
        AND DATEDIFF(curr.regdate, prev.dchdate) <= ?
        AND DATEDIFF(curr.regdate, prev.dchdate) > 0
      JOIN patient p ON p.hn = curr.hn
      LEFT JOIN iptdiag dx_prev ON dx_prev.an = prev.an AND dx_prev.diagtype = 1
      LEFT JOIN icd101 ic_prev ON ic_prev.code = dx_prev.icd10
      LEFT JOIN iptdiag dx_curr ON dx_curr.an = curr.an AND dx_curr.diagtype = 1
      LEFT JOIN icd101 ic_curr ON ic_curr.code = dx_curr.icd10
    WHERE curr.regdate BETWEEN ? AND ?
      ${pttypes.length > 0 ? `AND curr.pttype IN (${pttypes.map(() => "?").join(",")})` : ""}
    GROUP BY curr.an, curr.hn, prev.an
    ORDER BY curr.regdate DESC, gap_days ASC
    `;

    const paramsReadmit: (string | number)[] = [withinDays, startDate, endDate, ...pttypes];
    const [readmitRows] = await hosPool.execute<RowDataPacket[]>(sqlReadmit, paramsReadmit);

    // Monthly summary of re-admissions
    const sqlMonthly = `
    SELECT
      DATE_FORMAT(curr.regdate, '%Y-%m') AS ym,
      COUNT(DISTINCT curr.an) AS readmit_count,
      COUNT(DISTINCT curr.hn) AS readmit_hn
    FROM ipt curr
      JOIN ipt prev ON prev.hn = curr.hn
        AND prev.an <> curr.an
        AND prev.dchdate IS NOT NULL
        AND curr.regdate > prev.dchdate
        AND DATEDIFF(curr.regdate, prev.dchdate) <= ?
        AND DATEDIFF(curr.regdate, prev.dchdate) > 0
    WHERE curr.regdate BETWEEN ? AND ?
      ${pttypes.length > 0 ? `AND curr.pttype IN (${pttypes.map(() => "?").join(",")})` : ""}
    GROUP BY DATE_FORMAT(curr.regdate, '%Y-%m')
    ORDER BY ym
    `;

    const paramsMonthly: (string | number)[] = [withinDays, startDate, endDate, ...pttypes];
    const [monthlyRows] = await hosPool.execute<RowDataPacket[]>(sqlMonthly, paramsMonthly);

    // Total admissions in the same period (for rate calculation)
    const sqlTotal = `
    SELECT
      COUNT(DISTINCT an) AS total_an,
      COUNT(DISTINCT hn) AS total_hn
    FROM ipt
    WHERE regdate BETWEEN ? AND ?
      ${pttypes.length > 0 ? `AND pttype IN (${pttypes.map(() => "?").join(",")})` : ""}
    `;

    const paramsTotal: (string | number)[] = [startDate, endDate, ...pttypes];
    const [totalRows] = await hosPool.execute<RowDataPacket[]>(sqlTotal, paramsTotal);

    const totalAn = Number(totalRows[0]?.total_an) || 0;
    const readmitAns = new Set((readmitRows as RowDataPacket[]).map((r) => r.readmit_an));
    const readmitHns = new Set((readmitRows as RowDataPacket[]).map((r) => r.hn));
    const readmitCount = readmitAns.size;
    const readmitRate = totalAn > 0 ? Math.round((readmitCount / totalAn) * 10000) / 100 : 0;

    return NextResponse.json({
      success: true,
      data: readmitRows,
      monthly: monthlyRows,
      summary: {
        total_an: totalAn,
        total_hn: Number(totalRows[0]?.total_hn) || 0,
        readmit_an: readmitCount,
        readmit_hn: readmitHns.size,
        readmit_rate: readmitRate,
        within_days: withinDays,
      },
      startDate,
      endDate,
    });
  } catch (error: unknown) {
    console.error("IPD Re-admit query error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูล";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
