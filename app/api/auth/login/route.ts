import { NextRequest, NextResponse } from "next/server";
import hosPool from "@/lib/dbhos";
import { RowDataPacket } from "mysql2";
import crypto from "crypto";

interface OfficerUser extends RowDataPacket {
  officer_login_name: string;
  officer_login_password_md5: string;
  officer_name: string;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 }
      );
    }

    // Hash password with MD5
    const md5Password = crypto.createHash("md5").update(password).digest("hex");

    // Query hos.officer table
    const [rows] = await hosPool.execute<OfficerUser[]>(
      "SELECT officer_login_name, officer_login_password_md5, officer_name FROM officer WHERE officer_login_name = ? AND officer_login_password_md5 = ?",
      [username, md5Password]
    );

    if (rows.length > 0) {
      const user = rows[0];
      return NextResponse.json({
        success: true,
        message: "เข้าสู่ระบบสำเร็จ",
        user: {
          username: user.officer_login_name,
          name: user.officer_name,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล" },
      { status: 500 }
    );
  }
}
