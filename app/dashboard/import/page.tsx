"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ImportResult {
  fileName: string;
  fileType: string;
  tableName: string;
  totalRows: number;
  inserted: number;
  updated: number;
  errors: number;
  errorDetails: string[];
  headers: string[];
}

interface HistoryRow {
  type: string;
  filename: string;
  total_rows: number;
  total_compensated: number;
  import_date: string;
}

export default function ImportPage() {
  const [fileType, setFileType] = useState<"rep" | "statement">("rep");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/import");
      const json = await res.json();
      if (json.success) setHistory(json.data || []);
    } catch { /* ignore */ }
    setLoadingHistory(false);
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setError("");
    // Preview first 10 rows
    try {
      const fileName = file.name.toLowerCase();
      const isExcel = fileName.endsWith(".xls") || fileName.endsWith(".xlsx");

      if (isExcel) {
        const XLSX = (await import("xlsx"));
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
        if (jsonData.length > 0) {
          setPreviewHeaders(Object.keys(jsonData[0]));
          const rows: string[][] = [];
          for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
            rows.push(Object.values(jsonData[i]).map((v) => String(v)));
          }
          setPreviewData(rows);
        }
      } else {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
        if (lines.length > 0) {
          const delim = lines[0].includes("\t") ? "\t" : lines[0].includes("|") ? "|" : ",";
          const headers = lines[0].split(delim).map((v) => v.trim().replace(/^"|"$/g, ""));
          setPreviewHeaders(headers);
          const rows: string[][] = [];
          for (let i = 1; i < Math.min(lines.length, 11); i++) {
            rows.push(lines[i].split(delim).map((v) => v.trim().replace(/^"|"$/g, "")));
          }
          setPreviewData(rows);
        }
      }
    } catch {
      setPreviewData([]);
      setPreviewHeaders([]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("fileType", fileType);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) {
        setResult(json.summary);
        fetchHistory();
      } else {
        setError(json.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
    setUploading(false);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setError("");
    setPreviewData([]);
    setPreviewHeaders([]);
    if (fileInput.current) fileInput.current.value = "";
  };

  const formatNum = (n: number) =>
    n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      {/* File Type Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">เลือกประเภทไฟล์นำเข้า</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => { setFileType("rep"); resetForm(); }}
            className={`p-5 rounded-xl border-2 transition-all text-left ${
              fileType === "rep"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm"
                : "border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50/50"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                fileType === "rep" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className={`font-semibold ${fileType === "rep" ? "text-blue-700" : "text-gray-700 dark:text-gray-300"}`}>ไฟล์ REP (ตอบกลับ)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">นำเข้าข้อมูล DRG, AdjRW, เงินชดเชย จาก สปสช.</p>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 ml-13">ตาราง: repdata</p>
          </button>
          <button
            onClick={() => { setFileType("statement"); resetForm(); }}
            className={`p-5 rounded-xl border-2 transition-all text-left ${
              fileType === "statement"
                ? "border-purple-500 bg-purple-50 shadow-sm"
                : "border-gray-200 dark:border-gray-600 hover:border-purple-300 hover:bg-purple-50/50"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                fileType === "statement" ? "bg-purple-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className={`font-semibold ${fileType === "statement" ? "text-purple-700" : "text-gray-700 dark:text-gray-300"}`}>ไฟล์ Statement (Invoice)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">นำเข้าข้อมูลโอนเงิน, กองทุน, ใบแจ้งหนี้</p>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 ml-13">ตาราง: repeclaim</p>
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          อัปโหลดไฟล์ {fileType === "rep" ? "REP" : "Statement"}
        </h3>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInput.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            dragOver
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30"
              : selectedFile
                ? "border-green-300 bg-green-50 dark:bg-green-900/30"
                : "border-gray-300 dark:border-gray-600 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <input
            ref={fileInput}
            type="file"
            accept=".txt,.csv,.tsv,.dat,.xls,.xlsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
          />
          {selectedFile ? (
            <div className="animate-fade-in-up">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{selectedFile.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                ขนาด: {(selectedFile.size / 1024).toFixed(1)} KB
                {previewData.length > 0 && ` · ตัวอย่าง ${previewData.length} แถว · ${previewHeaders.length} คอลัมน์`}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); resetForm(); }}
                className="mt-3 text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                เปลี่ยนไฟล์
              </button>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">รองรับไฟล์ .txt, .csv, .tsv, .dat, .xls, .xlsx</p>
            </div>
          )}
        </div>

        {/* Preview Table */}
        {previewData.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              ตัวอย่างข้อมูล (แสดง {previewData.length} แถวแรก จากทั้งหมด)
            </h4>
            <div className="overflow-x-auto max-h-[250px] overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-xl">
              <table className="text-xs border-collapse" style={{ width: "max-content" }}>
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="py-2 px-2 text-gray-800 dark:text-gray-100 font-bold text-center border-b border-gray-200 dark:border-gray-600">#</th>
                    {previewHeaders.map((h, i) => (
                      <th key={i} className="py-2 px-2 text-gray-800 dark:text-gray-100 font-bold whitespace-nowrap text-left border-b border-gray-200 dark:border-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-700 hover:bg-blue-50/50 dark:hover:bg-gray-700">
                      <td className="py-1.5 px-2 text-center text-gray-400 dark:text-gray-500">{i + 1}</td>
                      {row.map((val, j) => (
                        <td key={j} className="py-1.5 px-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {selectedFile && !result && (
          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={`px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all shadow-sm ${
                fileType === "rep"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  กำลังนำเข้า...
                </span>
              ) : (
                `นำเข้าไฟล์ ${fileType === "rep" ? "REP" : "Statement"}`
              )}
            </button>
            <button onClick={resetForm} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">ยกเลิก</button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 rounded-xl p-4 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Import Result */}
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">นำเข้าข้อมูลสำเร็จ</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">{result.fileName} &rarr; {result.tableName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-600 mb-1">ข้อมูลทั้งหมด</p>
              <p className="text-2xl font-bold text-blue-700">{result.totalRows.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 text-center">
              <p className="text-xs text-green-600 mb-1">เพิ่มใหม่</p>
              <p className="text-2xl font-bold text-green-700">{result.inserted.toLocaleString()}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-xs text-amber-600 mb-1">อัปเดต</p>
              <p className="text-2xl font-bold text-amber-700">{result.updated.toLocaleString()}</p>
            </div>
            <div className={`${result.errors > 0 ? "bg-red-50 dark:bg-red-900/30" : "bg-gray-50 dark:bg-gray-700"} rounded-xl p-4 text-center`}>
              <p className={`text-xs mb-1 ${result.errors > 0 ? "text-red-600" : "text-gray-500 dark:text-gray-400"}`}>ข้อผิดพลาด</p>
              <p className={`text-2xl font-bold ${result.errors > 0 ? "text-red-700" : "text-gray-400 dark:text-gray-500"}`}>{result.errors.toLocaleString()}</p>
            </div>
          </div>

          {/* Success progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-500 dark:text-gray-400">สำเร็จ {((result.inserted + result.updated) / result.totalRows * 100).toFixed(1)}%</span>
              <span className="text-gray-400 dark:text-gray-500">{result.inserted + result.updated} / {result.totalRows}</span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000"
                style={{ width: `${((result.inserted + result.updated) / result.totalRows) * 100}%` }}
              />
            </div>
          </div>

          {/* Error Details */}
          {result.errorDetails.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-xl p-4">
              <p className="text-sm font-medium text-red-600 mb-2">รายละเอียดข้อผิดพลาด</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {result.errorDetails.map((e, i) => (
                  <p key={i} className="text-xs text-red-500 font-mono">{e}</p>
                ))}
              </div>
            </div>
          )}

          {/* Columns detected */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">คอลัมน์ที่ตรวจพบ ({result.headers.length}):</p>
            <div className="flex flex-wrap gap-1.5">
              {result.headers.map((h, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-[10px] font-mono">{h}</span>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={resetForm}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
              นำเข้าไฟล์ถัดไป
            </button>
          </div>
        </div>
      )}

      {/* Import History */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">ประวัติการนำเข้า</h3>
          <button onClick={fetchHistory} className="text-xs text-blue-500 hover:text-blue-700 transition-colors">
            รีเฟรช
          </button>
        </div>

        {loadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  <th className="text-left py-3 px-3 text-gray-800 dark:text-gray-100 font-bold">ประเภท</th>
                  <th className="text-left py-3 px-3 text-gray-800 dark:text-gray-100 font-bold">ชื่อไฟล์</th>
                  <th className="text-right py-3 px-3 text-gray-800 dark:text-gray-100 font-bold">จำนวนรายการ</th>
                  <th className="text-right py-3 px-3 text-gray-800 dark:text-gray-100 font-bold">ยอดชดเชยรวม</th>
                  <th className="text-left py-3 px-3 text-gray-800 dark:text-gray-100 font-bold">วันที่นำเข้า</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        row.type === "REP" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "bg-purple-50 text-purple-600"
                      }`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 font-mono text-xs">{row.filename}</td>
                    <td className="py-2.5 px-3 text-right text-gray-600 dark:text-gray-300">{Number(row.total_rows).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 font-medium">
                      ฿{formatNum(Number(row.total_compensated) || 0)}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400 text-xs">
                      {row.import_date ? new Date(row.import_date).toLocaleString("th-TH") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <svg className="w-14 h-14 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-sm text-gray-400 dark:text-gray-500">ยังไม่มีประวัติการนำเข้าไฟล์</p>
          </div>
        )}
      </div>
    </>
  );
}
