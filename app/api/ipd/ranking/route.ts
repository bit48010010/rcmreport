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
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const sql = `
    SELECT
      dx.icd10 AS pdx,
      ic.name AS pdx_name,
      COUNT(DISTINCT v.an) AS an_count,
      COUNT(DISTINCT v.hn) AS hn_count,
      ROUND(SUM(IFNULL(ii.adjrw, 0)), 2) AS sum_adjrw
    FROM an_stat v
      JOIN ipt ii ON ii.an = v.an
      JOIN iptdiag dx ON dx.an = v.an AND dx.diagtype = 1
      LEFT JOIN icd101 ic ON ic.code = dx.icd10
    WHERE v.dchdate BETWEEN ? AND ?
      AND dx.icd10 NOT REGEXP '^[0-9]'
      ${pttypes.length > 0 ? `AND ii.pttype IN (${pttypes.map(() => "?").join(",")})` : ""}
    GROUP BY dx.icd10, ic.name
    ORDER BY an_count DESC
    LIMIT ?
    `;

    const params: (string | number)[] = [startDate, endDate, ...pttypes, limit];
    const [rows] = await hosPool.execute<RowDataPacket[]>(sql, params);

    // Also get total summary
    const sqlTotal = `
    SELECT
      COUNT(DISTINCT v.an) AS total_an,
      COUNT(DISTINCT v.hn) AS total_hn,
      ROUND(SUM(IFNULL(ii.adjrw, 0)), 2) AS total_adjrw,
      COUNT(DISTINCT dx.icd10) AS total_pdx_codes
    FROM an_stat v
      JOIN ipt ii ON ii.an = v.an
      JOIN iptdiag dx ON dx.an = v.an AND dx.diagtype = 1
    WHERE v.dchdate BETWEEN ? AND ?
      AND dx.icd10 NOT REGEXP '^[0-9]'
      ${pttypes.length > 0 ? `AND ii.pttype IN (${pttypes.map(() => "?").join(",")})` : ""}
    `;

    const paramsTotal: (string | number)[] = [startDate, endDate, ...pttypes];
    const [totalRows] = await hosPool.execute<RowDataPacket[]>(sqlTotal, paramsTotal);

    return NextResponse.json({
      success: true,
      data: rows,
      summary: totalRows[0] || {},
      total: rows.length,
      startDate,
      endDate,
    });
  } catch (error: unknown) {
    console.error("IPD ranking query error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูล";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
