import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import * as XLSX from "xlsx";

// จับคู่ header ภาษาไทย → DB field name
const HEADER_MAP: Record<string, string> = {
  "ID": "ID",
  "วันที่โอน": "PayDate",
  "Batch No.": "BatchNo",
  "งวด/เลขที่เบิกจ่าย": "PayNo",
  "รหัสผังบัญชี สป.สธ.": "CodeAccount",
  "กองทุน": "Fund",
  "กองทุนย่อยเฉพาะด้าน": "Subfund",
  "จำนวนเงิน": "amount",
  "ชะลอการโอน": "delay",
  "รายการหักจากยอดโอนเงิน": "recall",
  "หลักประกันสัญญา": "recall_insure",
  "ภาษี": "tax",
  "คงเหลือ": "total",
  "จำนวนเงินรอหักกลบ": "amount_wait",
  "เงินโอนเข้าบัญชี": "tranfer_account",
};

const DB_FIELDS = [
  "ID", "PayDate", "BatchNo", "PayNo", "CodeAccount",
  "Fund", "Subfund", "amount", "delay", "recall",
  "recall_insure", "tax", "total", "amount_wait", "tranfer_account",
];

const MONEY_FIELDS = new Set(["amount", "delay", "recall", "recall_insure", "tax", "total", "amount_wait", "tranfer_account"]);

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

// แก้ข้อความภาษาไทยที่ garbled จาก encoding ผิด (UTF-8 bytes ถูก decode เป็น Windows-874/TIS-620)
// เช่น "เธ.เธ." → "ธ.ค.", "เธก.เธ„." → "ม.ค."
function fixGarbledThai(text: string): string {
  // ตรวจจับ pattern garbled: มี "เธ" หรือ "เน" ซึ่งเป็น signature ของ double-encoded Thai
  if (!/เธ|เน/.test(text)) return text;

  try {
    // แปลงกลับ: Thai char -> Windows-874 byte value -> decode UTF-8
    const bytes: number[] = [];
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 0x0E01 && code <= 0x0E3A) {
        bytes.push(code - 0x0D60); // Thai consonants/vowels → Win-874 byte
      } else if (code >= 0x0E3F && code <= 0x0E5B) {
        bytes.push(code - 0x0D60); // Thai currency/digits → Win-874 byte
      } else if (code < 0x0100) {
        bytes.push(code); // ASCII + Latin-1 supplement (รวม control chars ที่ซ่อนอยู่)
      } else {
        return text; // พบ char แปลก ไม่ใช่ garbled Thai
      }
    }
    const fixed = Buffer.from(bytes).toString("utf8");
    // ตรวจว่าผลลัพธ์มีภาษาไทยจริง และไม่มี replacement char
    if (/[\u0E01-\u0E5B]/.test(fixed) && !fixed.includes("\uFFFD")) {
      return fixed;
    }
  } catch { /* ignore */ }

  return text;
}

// แปลง Excel serial date หรือวันที่ไม่ถูกต้อง เป็น "วัน เดือนไทยย่อ พ.ศ."
function toThaiDate(value: string): string {
  let trimmed = value.trim();
  if (!trimmed) return trimmed;

  // แก้ garbled Thai encoding ก่อน
  trimmed = fixGarbledThai(trimmed);

  // ถ้าเป็นตัวเลข = Excel serial date
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const serial = parseFloat(trimmed);
    if (serial > 20000 && serial < 100000) {
      // Excel serial date: epoch = 1900-01-01, but Excel has a bug (treats 1900 as leap year)
      const utcDays = serial - 25569; // days since 1970-01-01
      const date = new Date(utcDays * 86400000);
      const day = date.getUTCDate();
      const month = date.getUTCMonth(); // 0-11
      const yearBE = date.getUTCFullYear() + 543; // พ.ศ.
      return `${day} ${THAI_MONTHS_SHORT[month]} ${yearBE}`;
    }
  }
  // ถ้าเป็น format yyyy-mm-dd หรือ dd/mm/yyyy
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

interface RowData {
  [key: string]: string;
}

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

function mapHeaders(fileHeaders: string[]): Map<number, string> {
  const indexToField = new Map<number, string>();
  fileHeaders.forEach((h, idx) => {
    const trimmed = h.trim();
    // ลองจับคู่ตรง
    if (HEADER_MAP[trimmed]) {
      indexToField.set(idx, HEADER_MAP[trimmed]);
      return;
    }
    // ลองจับคู่แบบ case-insensitive + trim
    for (const [key, val] of Object.entries(HEADER_MAP)) {
      if (key.toLowerCase() === trimmed.toLowerCase()) {
        indexToField.set(idx, val);
        return;
      }
    }
    // ถ้า header ตรงกับชื่อ DB field โดยตรง
    if (DB_FIELDS.includes(trimmed)) {
      indexToField.set(idx, trimmed);
    }
  });
  return indexToField;
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

    let fileHeaders: string[] = [];
    const dataRows: string[][] = [];

    const SKIP_ROWS = 4;

    if (isExcel) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const allRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: true });

      if (allRows.length <= SKIP_ROWS) {
        return NextResponse.json({ success: false, message: "ไฟล์ไม่มีข้อมูล (ตรวจสอบว่าข้อมูลเริ่มจากแถวที่ 5)" }, { status: 400 });
      }

      const headerRow = allRows[SKIP_ROWS] as unknown[];
      fileHeaders = headerRow.map((v) => String(v ?? "").trim());

      for (let i = SKIP_ROWS + 1; i < allRows.length; i++) {
        const row = (allRows[i] as unknown[]).map((v) => String(v ?? "").trim());
        if (row.every((v) => v === "")) continue;
        if (!isSummaryRow(row)) dataRows.push(row);
      }
    } else {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");

      if (lines.length <= SKIP_ROWS) {
        return NextResponse.json({ success: false, message: "ไฟล์ไม่มีข้อมูล (ตรวจสอบว่าข้อมูลเริ่มจากแถวที่ 5)" }, { status: 400 });
      }

      const delimiter = detectDelimiter(lines[SKIP_ROWS]);
      fileHeaders = parseTextLine(lines[SKIP_ROWS], delimiter);

      for (let i = SKIP_ROWS + 1; i < lines.length; i++) {
        const cols = parseTextLine(lines[i], delimiter);
        if (!isSummaryRow(cols)) dataRows.push(cols);
      }
    }

    if (dataRows.length === 0) {
      return NextResponse.json({ success: false, message: "ไม่พบข้อมูลในไฟล์" }, { status: 400 });
    }

    // จับคู่ header กับ DB field
    const indexMap = mapHeaders(fileHeaders);

    if (indexMap.size === 0) {
      return NextResponse.json({ success: false, message: "ไม่สามารถจับคู่คอลัมน์ได้ ตรวจสอบ header ในแถวที่ 5" }, { status: 400 });
    }

    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(`
        CREATE TABLE IF NOT EXISTS nhso_budget_smt (
          no INT AUTO_INCREMENT PRIMARY KEY,
          ID VARCHAR(20),
          PayDate VARCHAR(30),
          BatchNo VARCHAR(30),
          PayNo VARCHAR(50),
          CodeAccount VARCHAR(50),
          Fund VARCHAR(50),
          Subfund VARCHAR(100),
          amount DECIMAL(14,2) DEFAULT 0,
          delay DECIMAL(14,2) DEFAULT 0,
          recall DECIMAL(14,2) DEFAULT 0,
          recall_insure DECIMAL(14,2) DEFAULT 0,
          tax DECIMAL(14,2) DEFAULT 0,
          total DECIMAL(14,2) DEFAULT 0,
          amount_wait DECIMAL(14,2) DEFAULT 0,
          tranfer_account DECIMAL(14,2) DEFAULT 0,
          import_file VARCHAR(255),
          import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_paydate (PayDate),
          INDEX idx_batchno (BatchNo),
          INDEX idx_fund (Fund),
          UNIQUE KEY uq_smt_row (PayDate, BatchNo, PayNo, CodeAccount, Fund, Subfund, amount)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      try {
        await conn.query(`ALTER TABLE nhso_budget_smt ADD UNIQUE KEY uq_smt_row (PayDate, BatchNo, PayNo, CodeAccount, Fund, Subfund, amount)`);
      } catch { /* already exists */ }

      try {
        await conn.query(`ALTER TABLE nhso_budget_smt ADD COLUMN import_file VARCHAR(255)`);
      } catch { /* already exists */ }

      // ลบข้อมูลทั้งหมดก่อนนำเข้าใหม่
      const [delResult] = await conn.query<ResultSetHeader>(
        `DELETE FROM nhso_budget_smt`
      );
      const deletedCount = delResult.affectedRows;

      for (let ri = 0; ri < dataRows.length; ri++) {
        const col = dataRows[ri];
        const row: RowData = {};
        indexMap.forEach((dbField, colIdx) => {
          row[dbField] = col[colIdx] || "";
        });

        try {
          const [result] = await conn.query<ResultSetHeader>(
            `INSERT IGNORE INTO nhso_budget_smt (
              ID, PayDate, BatchNo, PayNo, CodeAccount,
              Fund, Subfund, amount, \`delay\`, recall,
              recall_insure, tax, total, amount_wait, tranfer_account, import_file
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              row.ID || "",
              toThaiDate(row.PayDate || ""),
              row.BatchNo || "",
              row.PayNo || "",
              row.CodeAccount || "",
              fixGarbledThai(row.Fund || ""),
              fixGarbledThai(row.Subfund || ""),
              parseFloat(row.amount || "0") || 0,
              parseFloat(row.delay || "0") || 0,
              parseFloat(row.recall || "0") || 0,
              parseFloat(row.recall_insure || "0") || 0,
              parseFloat(row.tax || "0") || 0,
              parseFloat(row.total || "0") || 0,
              parseFloat(row.amount_wait || "0") || 0,
              parseFloat(row.tranfer_account || "0") || 0,
              file.name,
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

      // สรุป field ที่จับคู่ได้
      const mappedFields: string[] = [];
      indexMap.forEach((dbField, colIdx) => {
        mappedFields.push(`${fileHeaders[colIdx]} → ${dbField}`);
      });

      return NextResponse.json({
        success: true,
        message: `นำเข้าไฟล์ ${file.name} สำเร็จ (ลบเดิม ${deletedCount}, เพิ่มใหม่ ${insertedCount} รายการ)`,
        summary: {
          fileName: file.name,
          totalRows: dataRows.length,
          inserted: insertedCount,
          deleted: deletedCount,
          updated: 0,
          skipped: skippedCount,
          errors: errorCount,
          errorDetails: errors.slice(0, 20),
          headers: fileHeaders,
          mappedFields,
        },
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("NHSO Budget SMT import error:", error);
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
        SUM(tranfer_account) AS total_budget, MAX(import_date) AS import_date
      FROM nhso_budget_smt WHERE import_file IS NOT NULL
      GROUP BY import_file ORDER BY MAX(import_date) DESC LIMIT 50`
    );

    return NextResponse.json({ success: true, data: rows });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
