import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface RcmUser extends RowDataPacket {
  UserName: string;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password, name } = await request.json();

    // Validate input
    if (!username || !password || !name) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกข้อมูลให้ครบทุกช่อง" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const [existing] = await pool.execute<RcmUser[]>(
      "SELECT UserName FROM rcmuser WHERE UserName = ?",
      [username]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น" },
        { status: 409 }
      );
    }

    // Insert new user
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO rcmuser (UserName, Passwords, Name) VALUES (?, ?, ?)",
      [username, password, name]
    );

    if (result.affectedRows > 0) {
      return NextResponse.json({
        success: true,
        message: "สมัครสมาชิกสำเร็จ",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล" },
      { status: 500 }
    );
  }
}
