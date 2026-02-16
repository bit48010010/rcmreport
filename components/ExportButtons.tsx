"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Register THSarabunNew font for PDF (Base64 would be huge, so we use built-in Helvetica with Unicode workaround)
// For Thai text in PDF we'll use a simpler approach

interface ExportColumn {
  key: string;
  label: string;
}

interface ExportButtonsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  columns: ExportColumn[];
  fileName?: string;
}

export default function ExportButtons({ data, columns, fileName = "report" }: ExportButtonsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getExportRows = () =>
    data.map((row) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col) => {
        obj[col.label] = row[col.key] ?? "";
      });
      return obj;
    });

  const exportExcel = () => {
    const rows = getExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    // Auto-width columns
    const colWidths = columns.map((col) => {
      const maxLen = Math.max(
        col.label.length,
        ...data.map((r) => String(r[col.key] ?? "").length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 8), 40) };
    });
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${fileName}.xlsx`);
    setOpen(false);
  };

  const exportCSV = () => {
    const BOM = "\uFEFF";
    const header = columns.map((c) => `"${c.label}"`).join(",");
    const rows = data.map((row) =>
      columns.map((col) => {
        const v = row[col.key];
        const s = v != null ? String(v) : "";
        return `"${s.replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csv = BOM + [header, ...rows].join("\r\n");
    saveAs(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${fileName}.csv`);
    setOpen(false);
  };

  const exportTXT = () => {
    const BOM = "\uFEFF";
    const header = columns.map((c) => c.label).join("\t");
    const rows = data.map((row) =>
      columns.map((col) => {
        const v = row[col.key];
        return v != null ? String(v) : "";
      }).join("\t")
    );
    const txt = BOM + [header, ...rows].join("\r\n");
    saveAs(new Blob([txt], { type: "text/plain;charset=utf-8" }), `${fileName}.txt`);
    setOpen(false);
  };

  const exportJSON = () => {
    const rows = getExportRows();
    const json = JSON.stringify(rows, null, 2);
    saveAs(new Blob([json], { type: "application/json;charset=utf-8" }), `${fileName}.json`);
    setOpen(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    // Use Helvetica (built-in, no Thai support — labels will show as-is)
    doc.setFontSize(8);

    const headers = columns.map((c) => c.label);
    const body = data.map((row) =>
      columns.map((col) => {
        const v = row[col.key];
        return v != null ? String(v) : "";
      })
    );

    autoTable(doc, {
      head: [headers],
      body,
      startY: 10,
      styles: { fontSize: 6, cellPadding: 1.5, overflow: "linebreak" },
      headStyles: { fillColor: [59, 130, 246], fontSize: 6, halign: "center" },
      margin: { top: 10, left: 5, right: 5 },
      theme: "grid",
    });

    doc.save(`${fileName}.pdf`);
    setOpen(false);
  };

  const formats = [
    { label: "Excel (.xlsx)", icon: "📊", action: exportExcel, color: "text-green-600 hover:bg-green-50" },
    { label: "CSV (.csv)", icon: "📋", action: exportCSV, color: "text-blue-600 hover:bg-blue-50" },
    { label: "Text (.txt)", icon: "📄", action: exportTXT, color: "text-gray-600 hover:bg-gray-50" },
    { label: "JSON (.json)", icon: "🔧", action: exportJSON, color: "text-amber-600 hover:bg-amber-50" },
    { label: "PDF (.pdf)", icon: "📕", action: exportPDF, color: "text-red-600 hover:bg-red-50" },
  ];

  if (data.length === 0) return null;

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-teal-600 transition-all shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-52 py-1 animate-fade-in-up">
          {formats.map((f, i) => (
            <button
              key={i}
              onClick={f.action}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${f.color}`}
            >
              <span className="text-base">{f.icon}</span>
              {f.label}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1 px-4 py-1.5">
            <span className="text-[10px] text-gray-400">{data.length.toLocaleString()} รายการ</span>
          </div>
        </div>
      )}
    </div>
  );
}
