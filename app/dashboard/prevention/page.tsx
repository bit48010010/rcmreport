"use client";

import { useState } from "react";
import ExportButtons from "@/components/ExportButtons";

// === Mock Data: ส่งเสริมป้องกัน (Health Promotion & Prevention) ===
const monthlyPP = [
  { month: "ม.ค.", value: 2450 },
  { month: "ก.พ.", value: 2680 },
  { month: "มี.ค.", value: 2320 },
  { month: "เม.ย.", value: 2890 },
  { month: "พ.ค.", value: 2750 },
  { month: "มิ.ย.", value: 3100 },
  { month: "ก.ค.", value: 2980 },
  { month: "ส.ค.", value: 3250 },
  { month: "ก.ย.", value: 2870 },
  { month: "ต.ค.", value: 3050 },
  { month: "พ.ย.", value: 3400 },
  { month: "ธ.ค.", value: 3580 },
];

const ppData = [
  { code: "PP001", activity: "ฝากครรภ์ครั้งแรก ≤12 สัปดาห์", target: 500, achieved: 465, percent: "93.0%", budget: "฿232,500", status: "ผ่านเกณฑ์" },
  { code: "PP002", activity: "ตรวจหลังคลอด", target: 480, achieved: 452, percent: "94.2%", budget: "฿226,000", status: "ผ่านเกณฑ์" },
  { code: "PP003", activity: "วัคซีน EPI (0-5 ปี)", target: 1200, achieved: 1156, percent: "96.3%", budget: "฿578,000", status: "ผ่านเกณฑ์" },
  { code: "PP004", activity: "คัดกรองมะเร็งปากมดลูก", target: 800, achieved: 620, percent: "77.5%", budget: "฿310,000", status: "ไม่ผ่านเกณฑ์" },
  { code: "PP005", activity: "คัดกรองเบาหวาน/ความดัน", target: 3500, achieved: 3280, percent: "93.7%", budget: "฿1,640,000", status: "ผ่านเกณฑ์" },
  { code: "PP006", activity: "ตรวจสุขภาพผู้สูงอายุ", target: 2000, achieved: 1850, percent: "92.5%", budget: "฿925,000", status: "ผ่านเกณฑ์" },
  { code: "PP007", activity: "คัดกรองพัฒนาการเด็ก", target: 600, achieved: 545, percent: "90.8%", budget: "฿272,500", status: "ผ่านเกณฑ์" },
  { code: "PP008", activity: "ทันตกรรมสร้างเสริม", target: 1500, achieved: 1120, percent: "74.7%", budget: "฿560,000", status: "ไม่ผ่านเกณฑ์" },
  { code: "PP009", activity: "คัดกรองสุขภาพจิต", target: 2500, achieved: 2380, percent: "95.2%", budget: "฿1,190,000", status: "ผ่านเกณฑ์" },
  { code: "PP010", activity: "บริการวางแผนครอบครัว", target: 400, achieved: 378, percent: "94.5%", budget: "฿189,000", status: "ผ่านเกณฑ์" },
];

export default function PreventionPage() {
  const maxBar = Math.max(...monthlyPP.map((d) => d.value));
  const totalServices = monthlyPP.reduce((sum, d) => sum + d.value, 0);
  const passCount = ppData.filter((d) => d.status === "ผ่านเกณฑ์").length;
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const ppColumns: { key: string; label: string; align: string }[] = [
    { key: "code", label: "รหัส", align: "text-left" },
    { key: "activity", label: "กิจกรรม", align: "text-left" },
    { key: "target", label: "เป้าหมาย", align: "text-right" },
    { key: "achieved", label: "ดำเนินการ", align: "text-right" },
    { key: "percent", label: "ร้อยละ", align: "text-right" },
    { key: "budget", label: "งบประมาณ", align: "text-right" },
    { key: "status", label: "สถานะ", align: "text-center" },
  ];

  const sortedPpData = (() => {
    let result = [...ppData];
    for (const [key, val] of Object.entries(columnFilters)) {
      if (!val) continue;
      const s = val.toLowerCase();
      result = result.filter((row) => {
        const cellVal = row[key as keyof typeof row];
        return cellVal != null && String(cellVal).toLowerCase().includes(s);
      });
    }
    if (sortKey) {
      result.sort((a, b) => {
        const va = a[sortKey as keyof typeof a];
        const vb = b[sortKey as keyof typeof b];
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        const na = Number(va), nb = Number(vb);
        if (!isNaN(na) && !isNaN(nb)) return sortDir === "asc" ? na - nb : nb - na;
        return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
      });
    }
    return result;
  })();

  return (
    <>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">บริการทั้งหมด</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{totalServices.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">ผ่านเกณฑ์</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{passCount}/{ppData.length} ตัวชี้วัด</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">ไม่ผ่านเกณฑ์</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{ppData.length - passCount}/{ppData.length} ตัวชี้วัด</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">งบประมาณรวม</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">฿6.12M</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">จำนวนบริการส่งเสริมป้องกันรายเดือน</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">ข้อมูลปี 2569</p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 text-xs font-medium">PP Service</span>
        </div>
        <div className="flex items-end gap-2 h-52">
          {monthlyPP.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full relative group">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {d.value.toLocaleString()} ราย
                </div>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-teal-400 transition-all duration-500 hover:from-emerald-400 hover:to-teal-300 cursor-pointer"
                  style={{
                    height: `${(d.value / maxBar) * 180}px`,
                    animation: `bar-grow 1s ease forwards`,
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">รายงานส่งเสริมสุขภาพและป้องกันโรค</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 dark:text-gray-500">แสดง {ppData.length} กิจกรรม</span>
            <ExportButtons
              data={ppData}
              columns={[
                { key: "code", label: "รหัส" },
                { key: "activity", label: "กิจกรรม" },
                { key: "target", label: "เป้าหมาย" },
                { key: "achieved", label: "ดำเนินการ" },
                { key: "percent", label: "ร้อยละ" },
                { key: "budget", label: "งบประมาณ" },
                { key: "status", label: "สถานะ" },
              ]}
              fileName="PP_Report"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                {ppColumns.map((col) => {
                  const isSorted = sortKey === col.key;
                  return (
                    <th key={col.key} className={`${col.align} py-1 px-3 text-gray-800 dark:text-gray-100 font-bold`}>
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => {
                            if (sortKey === col.key) setSortDir(sortDir === "asc" ? "desc" : "asc");
                            else { setSortKey(col.key); setSortDir("asc"); }
                          }}
                          className={`flex items-center gap-1 hover:text-blue-600 transition-colors ${col.align === "text-right" || col.align === "text-center" ? "justify-end" : ""}`}
                        >
                          {col.label}
                          {isSorted ? (
                            <svg className="w-3 h-3 shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortDir === "asc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 shrink-0 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </button>
                        <input
                          type="text"
                          placeholder="กรอง..."
                          value={columnFilters[col.key] || ""}
                          onChange={(e) => setColumnFilters((prev) => ({ ...prev, [col.key]: e.target.value }))}
                          className="w-full border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5 text-[10px] text-gray-600 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white dark:bg-gray-700"
                        />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedPpData.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="py-3 px-3 font-mono text-emerald-600 text-xs">{row.code}</td>
                  <td className="py-3 px-3 text-gray-800 dark:text-gray-100">{row.activity}</td>
                  <td className="py-3 px-3 text-right text-gray-500 dark:text-gray-400 font-mono">{row.target.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-gray-800 dark:text-gray-100 font-mono">{row.achieved.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right">
                    <span className={`font-medium ${
                      parseFloat(row.percent) >= 80 ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {row.percent}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-gray-700 dark:text-gray-300 font-medium">{row.budget}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      row.status === "ผ่านเกณฑ์" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600" : "bg-red-50 dark:bg-red-900/30 text-red-600"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Progress bar summary */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500 dark:text-gray-400">ภาพรวมผ่านเกณฑ์</span>
            <span className="font-bold text-gray-800 dark:text-gray-100">{passCount}/{ppData.length} ({((passCount / ppData.length) * 100).toFixed(0)}%)</span>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
              style={{ width: `${(passCount / ppData.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
