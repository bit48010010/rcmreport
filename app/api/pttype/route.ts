import { NextResponse } from "next/server";
import hosPool from "@/lib/dbhos";
import { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const [rows] = await hosPool.execute<RowDataPacket[]>(
      `SELECT pttype, name, CONCAT(pttype, ':', name) AS label 
       FROM pttype 
       ORDER BY pttype`
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error: unknown) {
    console.error("Pttype fetch error:", error);
    const message = error instanceof Error ? error.message : "ไม่สามารถดึงข้อมูลสิทธิ์ได้";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
