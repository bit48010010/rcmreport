"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ImportResult {
  fileName: string;
  totalRows: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
  headers: string[];
}

interface HistoryRow {
  filename: string;
  total_rows: number;
  total_budget: number;
  import_date: string;
}

interface FilePreview {
  file: File;
  headers: string[];
  rows: string[][];
}


export default function NhsoBudgetPage() {
  const importType = "smt";
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const fileInput = useRef<HTMLInputElement>(null);

  const apiUrl = "/api/import/nhsobudget-smt";

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const url = "/api/import/nhsobudget-smt";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setHistory(json.data || []);
    } catch { /* ignore */ }
    setLoadingHistory(false);
  }, [importType]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const parseFile = async (file: File): Promise<FilePreview> => {
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith(".xls") || fileName.endsWith(".xlsx");
    const SKIP_ROWS = 4;
    let headers: string[] = [];
    let rows: string[][] = [];

    const isSummaryRow = (values: string[]) =>
      values.some((v) => /^(รวม|รวมทั้งหมด|รวมทั้งสิ้น|Grand\s*Total|Sub\s*Total|Total)$/i.test(v.trim()));

    try {
      if (isExcel) {
        const XLSX = await import("xlsx");
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "", range: SKIP_ROWS });
        if (jsonData.length > 0) {
          headers = Object.keys(jsonData[0]);
          rows = jsonData
            .map((r) => Object.values(r).map((v) => String(v)))
            .filter((r) => !isSummaryRow(r));
        }
      } else {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
        if (lines.length > SKIP_ROWS) {
          const headerLine = lines[SKIP_ROWS];
          const delim = headerLine.includes("\t") ? "\t" : headerLine.includes("|") ? "|" : ",";
          headers = headerLine.split(delim).map((v) => v.trim().replace(/^"|"$/g, ""));
          for (let i = SKIP_ROWS + 1; i < lines.length; i++) {
            const cols = lines[i].split(delim).map((v) => v.trim().replace(/^"|"$/g, ""));
            if (!isSummaryRow(cols)) rows.push(cols);
          }
        }
      }
    } catch { /* ignore */ }
    return { file, headers, rows };
  };

  const handleFilesSelect = async (files: FileList) => {
    setResults([]);
    setError("");
    const newPreviews: FilePreview[] = [];
    for (let i = 0; i < files.length; i++) {
      const preview = await parseFile(files[i]);
      newPreviews.push(preview);
    }
    setSelectedFiles((prev) => [...prev, ...newPreviews]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFilesSelect(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setError("");
    setResults([]);
    setUploadProgress(0);
    const allResults: ImportResult[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      setUploadProgress(i + 1);
      try {
        const formData = new FormData();
        formData.append("file", selectedFiles[i].file);
        const res = await fetch(apiUrl, { method: "POST", body: formData });
        const json = await res.json();
        if (json.success) {
          allResults.push(json.summary);
        } else {
          allResults.push({
            fileName: selectedFiles[i].file.name,
            totalRows: 0, inserted: 0, updated: 0, skipped: 0, errors: 1,
            errorDetails: [json.message || "เกิดข้อผิดพลาด"], headers: [],
          });
        }
      } catch {
        allResults.push({
          fileName: selectedFiles[i].file.name,
          totalRows: 0, inserted: 0, updated: 0, skipped: 0, errors: 1,
          errorDetails: ["เกิดข้อผิดพลาดในการเชื่อมต่อ"], headers: [],
        });
      }
    }
    setResults(allResults);
    fetchHistory();
    setUploading(false);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setSelectedFiles([]);
    setResults([]);
    setError("");
    if (fileInput.current) fileInput.current.value = "";
  };

  const formatNum = (n: number) =>
    n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-600 text-white rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold">นำเข้า NHSO Budget</h2>
            <p className="text-sm text-teal-100 mt-0.5">นำเข้าข้อมูลงบประมาณจาก สปสช. (กองทุน UC)</p>
          </div>
        </div>
      </div>



      {/* Upload Area */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          อัปโหลดไฟล์ NHSO Budget SMT (เลือกได้หลายไฟล์)
        </h3>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInput.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            dragOver
              ? "border-teal-400 bg-teal-50 dark:bg-teal-900/30"
              : selectedFiles.length > 0
                ? "border-green-300 bg-green-50 dark:bg-green-900/30"
                : "border-gray-300 dark:border-gray-600 hover:border-teal-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <input
            ref={fileInput}
            type="file"
            accept=".txt,.csv,.tsv,.dat,.xls,.xlsx"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFilesSelect(e.target.files);
                e.target.value = "";
              }
            }}
          />
          {selectedFiles.length > 0 ? (
            <div className="animate-fade-in-up">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">เลือกแล้ว {selectedFiles.length} ไฟล์</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                รวม {selectedFiles.reduce((s, f) => s + f.rows.length, 0).toLocaleString()} แถว
              </p>
              <p className="mt-2 text-xs text-teal-500 hover:text-teal-700">คลิกเพื่อเพิ่มไฟล์</p>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์ (เลือกได้หลายไฟล์)</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">รองรับไฟล์ .txt, .csv, .tsv, .dat, .xls, .xlsx</p>
            </div>
          )}
        </div>

        {/* File List */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {selectedFiles.map((fp, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{fp.file.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {(fp.file.size / 1024).toFixed(1)} KB · {fp.rows.length.toLocaleString()} แถว · {fp.headers.length} คอลัมน์
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                  className="text-red-400 hover:text-red-600 transition-colors shrink-0 ml-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Preview Table (first file) */}
        {selectedFiles.length > 0 && selectedFiles[0].rows.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              ตัวอย่างข้อมูล: {selectedFiles[0].file.name} (ข้ามแถว 1-4, แสดงทั้งหมด {selectedFiles[0].rows.length.toLocaleString()} แถว)
              {selectedFiles.length > 1 && (
                <span className="ml-2 text-teal-600 font-normal">
                  · รวมทุกไฟล์ {selectedFiles.reduce((s, f) => s + f.rows.length, 0).toLocaleString()} แถว ({selectedFiles.length} ไฟล์)
                </span>
              )}
            </h4>
            <div className="overflow-x-auto max-h-[250px] overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-xl">
              <table className="text-xs border-collapse" style={{ width: "max-content" }}>
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="py-2 px-2 text-gray-800 dark:text-gray-100 font-bold text-center border-b border-gray-200 dark:border-gray-600">#</th>
                    {selectedFiles[0].headers.map((h, i) => (
                      <th key={i} className="py-2 px-2 text-gray-800 dark:text-gray-100 font-bold whitespace-nowrap text-left border-b border-gray-200 dark:border-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedFiles[0].rows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-700 hover:bg-teal-50/50 dark:hover:bg-gray-700">
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
        {selectedFiles.length > 0 && results.length === 0 && (
          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all shadow-sm bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  กำลังนำเข้า ({uploadProgress}/{selectedFiles.length})...
                </span>
              ) : (
                `นำเข้า ${selectedFiles.length} ไฟล์`
              )}
            </button>
            <button onClick={resetForm} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">ยกเลิกทั้งหมด</button>
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
      {results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">นำเข้าข้อมูลเสร็จสิ้น ({results.length} ไฟล์)</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                เพิ่มใหม่ {results.reduce((s, r) => s + r.inserted, 0).toLocaleString()} · 
                ข้ามซ้ำ {results.reduce((s, r) => s + r.skipped, 0).toLocaleString()} · 
                ข้อผิดพลาด {results.reduce((s, r) => s + r.errors, 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-teal-50 dark:bg-teal-900/30 rounded-xl p-4 text-center">
              <p className="text-xs text-teal-600 mb-1">ข้อมูลทั้งหมด</p>
              <p className="text-2xl font-bold text-teal-700">{results.reduce((s, r) => s + r.totalRows, 0).toLocaleString()}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 text-center">
              <p className="text-xs text-green-600 mb-1">เพิ่มใหม่</p>
              <p className="text-2xl font-bold text-green-700">{results.reduce((s, r) => s + r.inserted, 0).toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-600 mb-1">ข้ามซ้ำ</p>
              <p className="text-2xl font-bold text-blue-700">{results.reduce((s, r) => s + r.skipped, 0).toLocaleString()}</p>
            </div>
            <div className={`${results.reduce((s, r) => s + r.errors, 0) > 0 ? "bg-red-50 dark:bg-red-900/30" : "bg-gray-50 dark:bg-gray-700"} rounded-xl p-4 text-center`}>
              <p className={`text-xs mb-1 ${results.reduce((s, r) => s + r.errors, 0) > 0 ? "text-red-600" : "text-gray-500 dark:text-gray-400"}`}>ข้อผิดพลาด</p>
              <p className={`text-2xl font-bold ${results.reduce((s, r) => s + r.errors, 0) > 0 ? "text-red-700" : "text-gray-400 dark:text-gray-500"}`}>{results.reduce((s, r) => s + r.errors, 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Per-file results */}
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className={`rounded-xl p-4 border ${
                r.errors > 0 && r.inserted === 0 ? "bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800" : "bg-gray-50 dark:bg-gray-700 border-gray-100 dark:border-gray-600"
              }`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{r.fileName}</p>
                  <div className="flex gap-3 text-xs">
                    <span className="text-teal-600">{r.totalRows} แถว</span>
                    <span className="text-green-600">+{r.inserted}</span>
                    {r.skipped > 0 && <span className="text-blue-600">ข้ามซ้ำ {r.skipped}</span>}
                    {r.errors > 0 && <span className="text-red-500">ผิดพลาด {r.errors}</span>}
                  </div>
                </div>
                {r.errorDetails.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {r.errorDetails.slice(0, 5).map((e, ei) => (
                      <p key={ei} className="text-xs text-red-500 font-mono">{e}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button onClick={resetForm}
              className="px-6 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors">
              นำเข้าไฟล์ถัดไป
            </button>
          </div>
        </div>
      )}

      {/* Import History */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">ประวัติการนำเข้า NHSO Budget SMT</h3>
          <button onClick={fetchHistory} className="text-xs text-teal-500 hover:text-teal-700 transition-colors">รีเฟรช</button>
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
                  <th className="text-left py-3 px-3 text-gray-800 dark:text-gray-100 font-bold">ชื่อไฟล์</th>
                  <th className="text-right py-3 px-3 text-gray-800 dark:text-gray-100 font-bold">จำนวนรายการ</th>
                  <th className="text-right py-3 px-3 text-gray-800 dark:text-gray-100 font-bold">ยอดเงินรวม</th>
                  <th className="text-left py-3 px-3 text-gray-800 dark:text-gray-100 font-bold">วันที่นำเข้า</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 font-mono text-xs">{row.filename}</td>
                    <td className="py-2.5 px-3 text-right text-gray-600 dark:text-gray-300">{Number(row.total_rows).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-teal-600 font-medium">฿{formatNum(Number(row.total_budget) || 0)}</td>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm text-gray-400 dark:text-gray-500">ยังไม่มีประวัติการนำเข้า NHSO Budget SMT</p>
          </div>
        )}
      </div>
    </>
  );
}
