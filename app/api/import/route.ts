import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import * as XLSX from "xlsx";

interface RepRow {
  HN: string;
  AN: string;
  // Dates
  DATETIME_ADMIT?: string;
  DATETIME_DISCH?: string;
  // DRG
  DRG?: string;
  RW?: string;
  ADJRW?: string;
  // Finance
  ERROR?: string;
  STATUS?: string;
  PAID?: string;
  TOTAL_PAY?: string;
  // File info
  REPNO?: string;
  [key: string]: string | undefined;
}

function parseTextLine(line: string, delimiter: string): string[] {
  return line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ""));
}

function detectDelimiter(firstLine: string): string {
  if (firstLine.includes("\t")) return "\t";
  if (firstLine.includes("|")) return "|";
  return ",";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileType = formData.get("fileType") as string || "rep";

    if (!file) {
      return NextResponse.json({ success: false, message: "ไม่ได้เลือกไฟล์" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith(".xls") || fileName.endsWith(".xlsx");

    let headers: string[] = [];
    const rows: RepRow[] = [];

    if (isExcel) {
      // Parse Excel file
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

      if (jsonData.length === 0) {
        return NextResponse.json({ success: false, message: "ไฟล์ไม่มีข้อมูล" }, { status: 400 });
      }

      headers = Object.keys(jsonData[0]);
      for (const record of jsonData) {
        const obj: RepRow = { HN: "", AN: "" };
        for (const [key, value] of Object.entries(record)) {
          obj[key.toUpperCase()] = String(value ?? "");
        }
        if (obj.AN || obj.HN) rows.push(obj);
      }
    } else {
      // Parse text file (CSV/TSV/TXT)
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");

      if (lines.length < 2) {
        return NextResponse.json({ success: false, message: "ไฟล์ไม่มีข้อมูล" }, { status: 400 });
      }

      const delimiter = detectDelimiter(lines[0]);
      headers = parseTextLine(lines[0], delimiter);

      for (let i = 1; i < lines.length; i++) {
        const cols = parseTextLine(lines[i], delimiter);
        const obj: RepRow = { HN: "", AN: "" };
        headers.forEach((h, idx) => {
          obj[h.toUpperCase()] = cols[idx] || "";
        });
        if (obj.AN || obj.HN) rows.push(obj);
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "ไม่พบข้อมูลในไฟล์" }, { status: 400 });
    }

    // Determine table and process based on fileType
    let tableName: string;
    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      if (fileType === "rep") {
        tableName = "repdata";
        // Ensure table exists
        await conn.query(`
          CREATE TABLE IF NOT EXISTS repdata (
            id INT AUTO_INCREMENT PRIMARY KEY,
            hn VARCHAR(20),
            an VARCHAR(20),
            rep VARCHAR(100),
            drg VARCHAR(20),
            rw DECIMAL(10,4) DEFAULT 0,
            adjrw DECIMAL(10,4) DEFAULT 0,
            adjrw2 DECIMAL(10,4) DEFAULT 0,
            compensated DECIMAL(12,2) DEFAULT 0,
            error_code VARCHAR(100),
            status_text VARCHAR(255),
            send_date DATE,
            paid_date DATE,
            filename VARCHAR(255),
            import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY idx_an (an)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        for (const row of rows) {
          try {
            const an = row.AN || "";
            if (!an) { errorCount++; continue; }

            const [existing] = await conn.query<RowDataPacket[]>(
              "SELECT id FROM repdata WHERE an = ?", [an]
            );

            if (existing.length > 0) {
              await conn.query<ResultSetHeader>(
                `UPDATE repdata SET 
                  hn = ?, rep = ?, drg = ?, rw = ?, adjrw = ?, adjrw2 = ?,
                  compensated = ?, error_code = ?, status_text = ?,
                  filename = ?, import_date = NOW()
                WHERE an = ?`,
                [
                  row.HN || "",
                  row.REPNO || row.REP || "",
                  row.DRG || "",
                  parseFloat(row.RW || "0") || 0,
                  parseFloat(row.ADJRW || "0") || 0,
                  parseFloat(row.ADJRW2 || "0") || 0,
                  parseFloat(row.PAID || row.TOTAL_PAY || row.COMPENSATED || "0") || 0,
                  row.ERROR || row.ERROR_CODE || "",
                  row.STATUS || row.STATUS_TEXT || "",
                  file.name,
                  an,
                ]
              );
              updatedCount++;
            } else {
              await conn.query<ResultSetHeader>(
                `INSERT INTO repdata (hn, an, rep, drg, rw, adjrw, adjrw2, compensated, error_code, status_text, filename)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  row.HN || "",
                  an,
                  row.REPNO || row.REP || "",
                  row.DRG || "",
                  parseFloat(row.RW || "0") || 0,
                  parseFloat(row.ADJRW || "0") || 0,
                  parseFloat(row.ADJRW2 || "0") || 0,
                  parseFloat(row.PAID || row.TOTAL_PAY || row.COMPENSATED || "0") || 0,
                  row.ERROR || row.ERROR_CODE || "",
                  row.STATUS || row.STATUS_TEXT || "",
                  file.name,
                ]
              );
              insertedCount++;
            }
          } catch (err) {
            errorCount++;
            errors.push(`AN: ${row.AN} - ${err instanceof Error ? err.message : "Error"}`);
          }
        }
      } else if (fileType === "statement") {
        tableName = "repeclaim";
        await conn.query(`
          CREATE TABLE IF NOT EXISTS repeclaim (
            id INT AUTO_INCREMENT PRIMARY KEY,
            hn VARCHAR(20),
            an VARCHAR(20),
            rep VARCHAR(100),
            compensated DECIMAL(12,2) DEFAULT 0,
            diff DECIMAL(12,2) DEFAULT 0,
            down_amount DECIMAL(12,2) DEFAULT 0,
            up_amount DECIMAL(12,2) DEFAULT 0,
            fund VARCHAR(100),
            subfund VARCHAR(100),
            paid_type VARCHAR(100),
            bill VARCHAR(100),
            bill_date DATE,
            filename VARCHAR(255),
            import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY idx_an (an)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        for (const row of rows) {
          try {
            const an = row.AN || "";
            if (!an) { errorCount++; continue; }

            const [existing] = await conn.query<RowDataPacket[]>(
              "SELECT id FROM repeclaim WHERE an = ?", [an]
            );

            if (existing.length > 0) {
              await conn.query<ResultSetHeader>(
                `UPDATE repeclaim SET 
                  hn = ?, rep = ?, compensated = ?, diff = ?, down_amount = ?, up_amount = ?,
                  fund = ?, subfund = ?, paid_type = ?, bill = ?, bill_date = ?,
                  filename = ?, import_date = NOW()
                WHERE an = ?`,
                [
                  row.HN || "",
                  row.REPNO || row.REP || "",
                  parseFloat(row.COMPENSATED || row.PAID || row.TOTAL_PAY || "0") || 0,
                  parseFloat(row.DIFF || "0") || 0,
                  parseFloat(row.DOWN || row.DOWN_AMOUNT || "0") || 0,
                  parseFloat(row.UP || row.UP_AMOUNT || "0") || 0,
                  row.FUND || "",
                  row.SUBFUND || "",
                  row.PAIDTYPE || row.PAID_TYPE || "",
                  row.BILL || "",
                  row.BILL_DATE || null,
                  file.name,
                  an,
                ]
              );
              updatedCount++;
            } else {
              await conn.query<ResultSetHeader>(
                `INSERT INTO repeclaim (hn, an, rep, compensated, diff, down_amount, up_amount, fund, subfund, paid_type, bill, bill_date, filename)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  row.HN || "",
                  an,
                  row.REPNO || row.REP || "",
                  parseFloat(row.COMPENSATED || row.PAID || row.TOTAL_PAY || "0") || 0,
                  parseFloat(row.DIFF || "0") || 0,
                  parseFloat(row.DOWN || row.DOWN_AMOUNT || "0") || 0,
                  parseFloat(row.UP || row.UP_AMOUNT || "0") || 0,
                  row.FUND || "",
                  row.SUBFUND || "",
                  row.PAIDTYPE || row.PAID_TYPE || "",
                  row.BILL || "",
                  row.BILL_DATE || null,
                  file.name,
                ]
              );
              insertedCount++;
            }
          } catch (err) {
            errorCount++;
            errors.push(`AN: ${row.AN} - ${err instanceof Error ? err.message : "Error"}`);
          }
        }
      } else {
        tableName = "custom_import";
      }

      await conn.commit();

      return NextResponse.json({
        success: true,
        message: `นำเข้าไฟล์ ${file.name} สำเร็จ`,
        summary: {
          fileName: file.name,
          fileType,
          tableName,
          totalRows: rows.length,
          inserted: insertedCount,
          updated: updatedCount,
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
    console.error("Import error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการนำเข้า" },
      { status: 500 }
    );
  }
}

// GET - fetch import history
export async function GET() {
  try {
    const [repRows] = await pool.query<RowDataPacket[]>(
      `SELECT 'REP' AS type, filename, COUNT(*) AS total_rows, 
        SUM(compensated) AS total_compensated, MAX(import_date) AS import_date
      FROM repdata WHERE filename IS NOT NULL
      GROUP BY filename ORDER BY MAX(import_date) DESC LIMIT 50`
    );
    const [stmRows] = await pool.query<RowDataPacket[]>(
      `SELECT 'Statement' AS type, filename, COUNT(*) AS total_rows, 
        SUM(compensated) AS total_compensated, MAX(import_date) AS import_date
      FROM repeclaim WHERE filename IS NOT NULL
      GROUP BY filename ORDER BY MAX(import_date) DESC LIMIT 50`
    );

    return NextResponse.json({
      success: true,
      data: [...repRows, ...stmRows].sort(
        (a, b) => new Date(b.import_date).getTime() - new Date(a.import_date).getTime()
      ),
    });
  } catch (error) {
    console.error("Import history error:", error);
    return NextResponse.json({
      success: true,
      data: [],
    });
  }
}
