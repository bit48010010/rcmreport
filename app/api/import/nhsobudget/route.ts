import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import * as XLSX from "xlsx";

// ลำดับ column ตามตำแหน่งใน Excel (เริ่มจากคอลัมน์ที่ 1)
const DB_COLUMNS = [
  "HCode",        // col 1
  "YearBudget",   // col 2
  "BatchNo",      // col 3
  "PayNo",        // col 4
  "Maininscl",    // col 5
  "AccountCode",  // col 6
  "FundGroup",    // col 7
  "Fund",         // col 8
  "SubFund",      // col 9
  "PayDate",      // col 10
  "Amount_Money", // col 11
  "Delay_Money",  // col 12
  "ReMain_Money", // col 13
  "Rest_Money",   // col 14
  "FileName",     // col 15
];

function parseTextLine(line: string, delimiter: string): string[] {
  return line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ""));
}

function detectDelimiter(firstLine: string): string {
  if (firstLine.includes("\t")) return "\t";
  if (firstLine.includes("|")) return "|";
  return ",";
}

function isSummaryRow(values: string[]): boolean {
  return values.some((v) =>
    /^(รวม|รวมทั้งหมด|รวมทั้งสิ้น|Grand\s*Total|Sub\s*Total|Total)$/i.test((v || "").trim())
  );
}

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

// แก้ข้อความภาษาไทยที่ garbled จาก encoding ผิด (UTF-8 bytes ถูก decode เป็น Windows-874/TIS-620)
function fixGarbledThai(text: string): string {
  if (!/เธ|เน/.test(text)) return text;
  try {
    const bytes: number[] = [];
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 0x0E01 && code <= 0x0E3A) {
        bytes.push(code - 0x0D60);
      } else if (code >= 0x0E3F && code <= 0x0E5B) {
        bytes.push(code - 0x0D60);
      } else if (code < 0x0100) {
        bytes.push(code);
      } else {
        return text;
      }
    }
    const fixed = Buffer.from(bytes).toString("utf8");
    if (/[\u0E01-\u0E5B]/.test(fixed) && !fixed.includes("\uFFFD")) {
      return fixed;
    }
  } catch { /* ignore */ }
  return text;
}

// แปลง Excel serial date หรือวันที่ต่างๆ เป็น "วัน เดือนไทยย่อ พ.ศ."
function toThaiDate(value: string): string {
  let trimmed = value.trim();
  if (!trimmed) return trimmed;
  trimmed = fixGarbledThai(trimmed);
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const serial = parseFloat(trimmed);
    if (serial > 20000 && serial < 100000) {
      const utcDays = serial - 25569;
      const date = new Date(utcDays * 86400000);
      const day = date.getUTCDate();
      const month = date.getUTCMonth();
      const yearBE = date.getUTCFullYear() + 543;
      return `${day} ${THAI_MONTHS_SHORT[month]} ${yearBE}`;
    }
  }
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1]);
    const m = parseInt(isoMatch[2]) - 1;
    const d = parseInt(isoMatch[3]);
    const yearBE = y < 2400 ? y + 543 : y;
    return `${d} ${THAI_MONTHS_SHORT[m]} ${yearBE}`;
  }
  const slashMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slashMatch) {
    const d = parseInt(slashMatch[1]);
    const m = parseInt(slashMatch[2]) - 1;
    const y = parseInt(slashMatch[3]);
    const yearBE = y < 2400 ? y + 543 : y;
    return `${d} ${THAI_MONTHS_SHORT[m]} ${yearBE}`;
  }
  return trimmed;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "ไม่ได้เลือกไฟล์" }, { status: 400 });
    }

    const fileNameLower = file.name.toLowerCase();
    const isExcel = fileNameLower.endsWith(".xls") || fileNameLower.endsWith(".xlsx");

    let headers: string[] = [];
    const dataRows: string[][] = []; // เก็บเป็น array of values ตามลำดับ column

    // NHSO Budget: ข้อมูลเริ่มตั้งแต่แถวที่ 5 (แถว 1-4 เป็น header/metadata)
    const SKIP_ROWS = 4;

    if (isExcel) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      // อ่านเป็น array of arrays เพื่อจับคู่ตามลำดับ column
      const allRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: true });

      if (allRows.length <= SKIP_ROWS) {
        return NextResponse.json({ success: false, message: "ไฟล์ไม่มีข้อมูล (ตรวจสอบว่าข้อมูลเริ่มจากแถวที่ 5)" }, { status: 400 });
      }

      // แถวที่ 5 (index 4) = header row จากไฟล์
      const headerRow = allRows[SKIP_ROWS] as unknown[];
      headers = headerRow.map((v) => String(v ?? "").trim());

      // แถวที่ 6+ = data
      for (let i = SKIP_ROWS + 1; i < allRows.length; i++) {
        const row = (allRows[i] as unknown[]).map((v) => String(v ?? "").trim());
        if (row.every((v) => v === "")) continue; // ข้ามแถวว่าง
        if (!isSummaryRow(row)) dataRows.push(row);
      }
    } else {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");

      if (lines.length <= SKIP_ROWS) {
        return NextResponse.json({ success: false, message: "ไฟล์ไม่มีข้อมูล (ตรวจสอบว่าข้อมูลเริ่มจากแถวที่ 5)" }, { status: 400 });
      }

      const delimiter = detectDelimiter(lines[SKIP_ROWS]);
      headers = parseTextLine(lines[SKIP_ROWS], delimiter);

      for (let i = SKIP_ROWS + 1; i < lines.length; i++) {
        const cols = parseTextLine(lines[i], delimiter);
        if (!isSummaryRow(cols)) dataRows.push(cols);
      }
    }

    if (dataRows.length === 0) {
      return NextResponse.json({ success: false, message: "ไม่พบข้อมูลในไฟล์" }, { status: 400 });
    }

    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // สร้างตารางตามโครงสร้างจริงของไฟล์ NHSO
      await conn.query(`
        CREATE TABLE IF NOT EXISTS nhso_budget (
          id INT AUTO_INCREMENT PRIMARY KEY,
          HCode VARCHAR(10),
          YearBudget VARCHAR(10),
          BatchNo VARCHAR(20),
          PayNo VARCHAR(20),
          Maininscl VARCHAR(10),
          AccountCode VARCHAR(50),
          FundGroup VARCHAR(50),
          Fund VARCHAR(100),
          SubFund VARCHAR(100),
          PayDate VARCHAR(20),
          Amount_Money DECIMAL(14,2) DEFAULT 0,
          Delay_Money DECIMAL(14,2) DEFAULT 0,
          ReMain_Money DECIMAL(14,2) DEFAULT 0,
          Rest_Money DECIMAL(14,2) DEFAULT 0,
          FileName VARCHAR(255),
          import_file VARCHAR(255),
          import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_hcode (HCode),
          INDEX idx_year (YearBudget),
          INDEX idx_maininscl (Maininscl),
          INDEX idx_paydate (PayDate),
          UNIQUE KEY uq_nhso_row (HCode, YearBudget, BatchNo, PayNo, Maininscl, AccountCode, Fund, SubFund, Amount_Money)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      // เพิ่ม unique key ถ้าตารางมีอยู่แล้วแต่ยังไม่มี key
      try {
        await conn.query(`ALTER TABLE nhso_budget ADD UNIQUE KEY uq_nhso_row (HCode, YearBudget, BatchNo, PayNo, Maininscl, AccountCode, Fund, SubFund, Amount_Money)`);
      } catch { /* already exists, ignore */ }

      // จับคู่ตามลำดับ column: col[0]=HCode, col[1]=YearBudget, ..., col[14]=FileName
      for (let ri = 0; ri < dataRows.length; ri++) {
        const col = dataRows[ri];
        try {
          const [result] = await conn.query<ResultSetHeader>(
            `INSERT IGNORE INTO nhso_budget (
              HCode, YearBudget, BatchNo, PayNo, Maininscl,
              AccountCode, FundGroup, Fund, SubFund, PayDate,
              Amount_Money, Delay_Money, ReMain_Money, Rest_Money, FileName, import_file
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              col[0] || "",   // HCode
              col[1] || "",   // YearBudget
              col[2] || "",   // BatchNo
              col[3] || "",   // PayNo
              col[4] || "",   // Maininscl
              col[5] || "",   // AccountCode
              col[6] || "",   // FundGroup
              col[7] || "",   // Fund
              col[8] || "",   // SubFund
              toThaiDate(col[9] || ""),   // PayDate
              parseFloat(col[10] || "0") || 0, // Amount_Money
              parseFloat(col[11] || "0") || 0, // Delay_Money
              parseFloat(col[12] || "0") || 0, // ReMain_Money
              parseFloat(col[13] || "0") || 0, // Rest_Money
              col[14] || "",  // FileName (จากไฟล์)
              file.name,       // import_file (ชื่อไฟล์ที่ upload)
            ]
          );
          if (result.affectedRows > 0) {
            insertedCount++;
          } else {
            skippedCount++;
          }
        } catch (err) {
          errorCount++;
          errors.push(`Row ${ri + 1}: ${err instanceof Error ? err.message : "Error"}`);
        }
      }

      await conn.commit();

      return NextResponse.json({
        success: true,
        message: `นำเข้าไฟล์ ${file.name} สำเร็จ (เพิ่ม ${insertedCount}, ข้ามซ้ำ ${skippedCount})`,
        summary: {
          fileName: file.name,
          totalRows: dataRows.length,
          inserted: insertedCount,
          updated: 0,
          skipped: skippedCount,
          errors: errorCount,
          errorDetails: errors.slice(0, 20),
          headers,
        },
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("NHSO Budget import error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการนำเข้า" },
      { status: 500 }
    );
  }
}

// GET - fetch import history
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT import_file AS filename, COUNT(*) AS total_rows,
        SUM(Amount_Money) AS total_budget, MAX(import_date) AS import_date
      FROM nhso_budget WHERE import_file IS NOT NULL
      GROUP BY import_file ORDER BY MAX(import_date) DESC LIMIT 50`
    );

    return NextResponse.json({ success: true, data: rows });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
