import { NextRequest, NextResponse } from "next/server";
import hosPool from "@/lib/dbhos";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || new Date().toISOString().slice(0, 10);
    const endDate = searchParams.get("endDate") || startDate;
    const totalBeds = parseInt(searchParams.get("beds") || "60", 10);
    const pttypeParam = searchParams.get("pttype") || "";
    const pttypes = pttypeParam ? pttypeParam.split(",").filter(Boolean) : [];

    // Monthly bed occupancy breakdown
    // patient_days = SUM of DATEDIFF for each admission clipped to each month
    const sqlMonthly = `
    SELECT
      ym,
      COUNT(DISTINCT an) AS admit_count,
      COUNT(DISTINCT hn) AS patient_count,
      SUM(patient_days) AS total_patient_days,
      days_in_month,
      ROUND(SUM(patient_days) / (? * days_in_month) * 100, 2) AS occupancy_rate
    FROM (
      SELECT
        ii.an,
        ii.hn,
        DATE_FORMAT(d.dt, '%Y-%m') AS ym,
        COUNT(DISTINCT d.dt) AS patient_days,
        DAY(LAST_DAY(d.dt)) AS days_in_month
      FROM ipt ii
      JOIN (
        SELECT DATE_ADD(?, INTERVAL seq DAY) AS dt
        FROM (
          SELECT @row := @row + 1 AS seq
          FROM information_schema.columns a
          CROSS JOIN information_schema.columns b
          CROSS JOIN (SELECT @row := -1) r
          LIMIT 3660
        ) nums
        WHERE DATE_ADD(?, INTERVAL seq DAY) <= ?
      ) d ON d.dt >= DATE(ii.regdate)
            AND d.dt < IFNULL(DATE(ii.dchdate), DATE_ADD(?, INTERVAL 1 DAY))
      WHERE ii.regdate <= ?
        AND (ii.dchdate IS NULL OR ii.dchdate >= ?)
        ${pttypes.length > 0 ? `AND ii.pttype IN (${pttypes.map(() => "?").join(",")})` : ""}
      GROUP BY ii.an, ii.hn, DATE_FORMAT(d.dt, '%Y-%m'), DAY(LAST_DAY(d.dt))
    ) sub
    GROUP BY ym, days_in_month
    ORDER BY ym
    `;

    const paramsMonthly: (string | number)[] = [
      totalBeds,
      startDate, startDate, endDate, endDate,
      endDate, startDate,
      ...pttypes,
    ];
    const [monthlyRows] = await hosPool.execute<RowDataPacket[]>(sqlMonthly, paramsMonthly);

    // Overall summary
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    let totalPatientDays = 0;
    let totalAdmit = 0;
    let totalPatient = 0;
    for (const row of monthlyRows as RowDataPacket[]) {
      totalPatientDays += Number(row.total_patient_days) || 0;
      totalAdmit += Number(row.admit_count) || 0;
      totalPatient += Number(row.patient_count) || 0;
    }

    const overallRate = totalBeds > 0 && totalDays > 0
      ? Math.round((totalPatientDays / (totalBeds * totalDays)) * 10000) / 100
      : 0;

    return NextResponse.json({
      success: true,
      data: monthlyRows,
      summary: {
        total_patient_days: totalPatientDays,
        total_admit: totalAdmit,
        total_patient: totalPatient,
        total_beds: totalBeds,
        total_days: totalDays,
        occupancy_rate: overallRate,
      },
      startDate,
      endDate,
    });
  } catch (error: unknown) {
    console.error("IPD bed occupancy query error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูล";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
