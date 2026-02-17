"use client";

import { useState, useCallback, useEffect } from "react";
import ExportButtons from "@/components/ExportButtons";

// Thai fiscal year months (Oct - Sep)
const fiscalMonths = [
  { label: "ต.ค.", month: 10 },
  { label: "พ.ย.", month: 11 },
  { label: "ธ.ค.", month: 12 },
  { label: "ม.ค.", month: 1 },
  { label: "ก.พ.", month: 2 },
  { label: "มี.ค.", month: 3 },
  { label: "เม.ย.", month: 4 },
  { label: "พ.ค.", month: 5 },
  { label: "มิ.ย.", month: 6 },
  { label: "ก.ค.", month: 7 },
  { label: "ส.ค.", month: 8 },
  { label: "ก.ย.", month: 9 },
];

function getFiscalYearOptions() {
  const currentBE = new Date().getFullYear() + 543;
  const years: number[] = [];
  for (let y = currentBE; y >= currentBE - 5; y--) years.push(y);
  return years;
}

function getMonthRange(fiscalYear: number, month: number) {
  const ceYear = month >= 10 ? fiscalYear - 543 - 1 : fiscalYear - 543;
  const mm = String(month).padStart(2, "0");
  const lastDay = new Date(ceYear, month, 0).getDate();
  return {
    start: `${ceYear}-${mm}-01`,
    end: `${ceYear}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
}

interface MonthSummary {
  month: number;
  label: string;
  hn: number;
  an: number;
  los_total: number;
  los_avg: number;
  cmi: number;
  income: number;
  rcpt_money: number;
  balance: number;
  compensated: number;
  adjrw_total: number;
}

export default function InpatientSummaryPage() {
  const currentBE = new Date().getFullYear() + 543;
  const [fiscalYear, setFiscalYear] = useState<number>(currentBE);
  const [monthData, setMonthData] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMonth, setLoadingMonth] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pttypeOptions, setPttypeOptions] = useState<{ pttype: string; name: string; label: string }[]>([]);
  const [selectedPttypes, setSelectedPttypes] = useState<string[]>([]);
  const [showPttypePicker, setShowPttypePicker] = useState(false);
  const [pttypeSearch, setPttypeSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/pttype")
      .then((res) => res.json())
      .then((json) => { if (json.success) setPttypeOptions(json.data); })
      .catch(() => {});
  }, []);

  const fetchMonthData = useCallback(async (fy: number, monthIdx?: number) => {
    const months = monthIdx != null ? [fiscalMonths[monthIdx]] : fiscalMonths;
    if (monthIdx != null) {
      setLoadingMonth(months[0].month);
    } else {
      setLoading(true);
    }
    setError("");

    const results: MonthSummary[] = monthIdx != null ? [...monthData] : [];

    try {
      for (const fm of months) {
        const range = getMonthRange(fy, fm.month);
        const params = new URLSearchParams({ startDate: range.start, endDate: range.end });
        if (selectedPttypes.length > 0) params.set("pttype", selectedPttypes.join(","));
        const res = await fetch(`/api/ipd?${params.toString()}`);
        const json = await res.json();

        if (json.success) {
          const rows = json.data || [];
          const hnSet = new Set<string>();
          let income = 0, rcpt = 0, comp = 0, adjrw = 0, losTotal = 0;
          rows.forEach((r: Record<string, unknown>) => {
            if (r.hn) hnSet.add(String(r.hn));
            income += Number(r.income) || 0;
            rcpt += Number(r.rcpt_money) || 0;
            // นับจำนวน rep ที่ไม่ใช่ null
            if (r.rep != null && String(r.rep).trim() !== "") comp++;
            adjrw += Number(r.adjrw) || 0;
            // คำนวณ LOS จาก regdate - dchdate
            if (r.regdate && r.dchdate) {
              const reg = new Date(String(r.regdate));
              const dch = new Date(String(r.dchdate));
              const days = Math.max(1, Math.round((dch.getTime() - reg.getTime()) / 86400000));
              if (!isNaN(days) && days > 0 && days < 999) losTotal += days;
            }
          });

          const anCount = rows.length;
          const losAvg = anCount > 0 ? losTotal / anCount : 0;
          const cmi = anCount > 0 ? adjrw / anCount : 0;

          const entry: MonthSummary = {
            month: fm.month,
            label: `${fm.label}${String(fm.month >= 10 ? fy - 1 : fy).slice(-2)}`,
            hn: hnSet.size,
            an: anCount,
            los_total: losTotal,
            los_avg: losAvg,
            cmi,
            income,
            rcpt_money: rcpt,
            balance: income - rcpt,
            compensated: comp,
            adjrw_total: adjrw,
          };

          if (monthIdx != null) {
            const existIdx = results.findIndex((r) => r.month === fm.month);
            if (existIdx >= 0) results[existIdx] = entry;
            else results.push(entry);
          } else {
            results.push(entry);
          }
        }
      }

      const fmOrder = fiscalMonths.map((f) => f.month);
      results.sort((a, b) => fmOrder.indexOf(a.month) - fmOrder.indexOf(b.month));
      setMonthData(results);
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
      setLoadingMonth(null);
    }
  }, [monthData, selectedPttypes]);

  const formatNum = (n: number) =>
    n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalAn = monthData.reduce((s, r) => s + r.an, 0);
  const totalHn = monthData.reduce((s, r) => s + r.hn, 0);
  const totalIncome = monthData.reduce((s, r) => s + r.income, 0);
  const totalRcpt = monthData.reduce((s, r) => s + r.rcpt_money, 0);
  const totalBalance = totalIncome - totalRcpt;
  const totalComp = monthData.reduce((s, r) => s + r.compensated, 0);
  const totalAdjrw = monthData.reduce((s, r) => s + r.adjrw_total, 0);
  const totalLos = monthData.reduce((s, r) => s + r.los_total, 0);
  const avgLos = totalAn > 0 ? totalLos / totalAn : 0;
  const totalCmi = totalAn > 0 ? totalAdjrw / totalAn : 0;

  const maxBar = Math.max(...monthData.map((d) => Math.max(d.an, d.hn)), 1);

  const tableColumns: { key: string; label: string; align: string }[] = [
    { key: "label", label: "เดือน", align: "text-left" },
    { key: "an", label: "จำนวน AN", align: "text-right" },
    { key: "hn", label: "จำนวน HN", align: "text-right" },
    { key: "compensated", label: "จำนวน REP", align: "text-right" },
    { key: "los_avg", label: "LOS เฉลี่ย", align: "text-right" },
    { key: "adjrw_total", label: "AdjRW รวม", align: "text-right" },
    { key: "cmi", label: "CMI", align: "text-right" },
    { key: "income", label: "ค่ารักษา", align: "text-right" },
    { key: "rcpt_money", label: "ชำระเงินสด", align: "text-right" },
    { key: "balance", label: "ลูกหนี้", align: "text-right" },
  ];

  const sortedMonthData = (() => {
    let result = [...monthData];
    for (const [key, val] of Object.entries(columnFilters)) {
      if (!val) continue;
      const s = val.toLowerCase();
      result = result.filter((row) => {
        const cellVal = row[key as keyof MonthSummary];
        return cellVal != null && String(cellVal).toLowerCase().includes(s);
      });
    }
    if (sortKey) {
      result.sort((a, b) => {
        const va = a[sortKey as keyof MonthSummary];
        const vb = b[sortKey as keyof MonthSummary];
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
      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">ปีงบประมาณ (พ.ศ.)</label>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-gray-200 dark:bg-gray-700 min-w-[130px]"
            >
              {getFiscalYearOptions().map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">สิทธิ์การรักษา</label>
            <button
              onClick={() => setShowPttypePicker(!showPttypePicker)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-gray-200 dark:bg-gray-700 min-w-[200px] text-left flex items-center justify-between gap-2"
            >
              <span className="truncate">
                {selectedPttypes.length === 0 ? "ทั้งหมด" : `เลือก ${selectedPttypes.length} สิทธิ์`}
              </span>
              <svg className={`w-4 h-4 shrink-0 transition-transform ${showPttypePicker ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showPttypePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50 w-80 max-h-72 flex flex-col">
                <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                  <input type="text" placeholder="ค้นหาสิทธิ์..." value={pttypeSearch} onChange={(e) => setPttypeSearch(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-700 dark:text-gray-200 dark:bg-gray-700" />
                </div>
                <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex gap-2">
                  <button onClick={() => setSelectedPttypes(pttypeOptions.map(p => p.pttype))} className="text-[10px] text-blue-500 hover:text-blue-700">เลือกทั้งหมด</button>
                  <button onClick={() => setSelectedPttypes([])} className="text-[10px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">ล้าง</button>
                </div>
                <div className="overflow-y-auto flex-1 p-1">
                  {pttypeOptions.filter((p) => !pttypeSearch || p.label.toLowerCase().includes(pttypeSearch.toLowerCase())).map((p) => (
                    <label key={p.pttype} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                      <input type="checkbox" checked={selectedPttypes.includes(p.pttype)}
                        onChange={() => setSelectedPttypes((prev) => prev.includes(p.pttype) ? prev.filter((x) => x !== p.pttype) : [...prev, p.pttype])}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-400" />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => fetchMonthData(fiscalYear)}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                กำลังดึงข้อมูล...
              </span>
            ) : (
              "ดึงข้อมูลทั้งปี"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-700 dark:text-red-400 rounded-xl p-4 text-sm">{error}</div>
      )}

      {/* Summary Stats */}
      {monthData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">จำนวน Admit (AN)</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{totalAn.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">จำนวนคน (HN)</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{totalHn.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">LOS เฉลี่ย (วัน)</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{avgLos.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">AdjRW รวม</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">{formatNum(totalAdjrw)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">CMI</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{totalCmi.toFixed(4)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">ค่ารักษา</p>
            <p className="text-xl font-bold text-purple-600 mt-1">฿{formatNum(totalIncome)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">ชำระเงินสด</p>
            <p className="text-xl font-bold text-amber-500 mt-1">฿{formatNum(totalRcpt)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">ลูกหนี้</p>
            <p className="text-xl font-bold text-red-600 mt-1">฿{formatNum(Math.abs(totalBalance))}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">จำนวน REP</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">{totalComp.toLocaleString()} รายการ</p>
          </div>
        </div>
      )}

      {/* Comparison Chart */}
      {monthData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">กราฟเปรียบเทียบจำนวนคน (HN) และจำนวน Admit (AN) รายเดือน</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">ปีงบประมาณ {fiscalYear} (ต.ค. {fiscalYear - 1} — ก.ย. {fiscalYear})</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-blue-600 to-sky-400" />
                <span className="text-xs text-gray-600 dark:text-gray-300">AN {totalAn.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-emerald-500 to-teal-400" />
                <span className="text-xs text-gray-600 dark:text-gray-300">HN {totalHn.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-end gap-2 h-56">
            {monthData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-0.5 h-48">
                  <div className="flex-1 relative group">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      AN: {d.an.toLocaleString()} ราย
                    </div>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-sky-400 transition-all duration-500 hover:from-blue-500 hover:to-sky-300 cursor-pointer"
                      style={{ height: `${(d.an / maxBar) * 180}px`, animation: `bar-grow 1s ease forwards`, animationDelay: `${i * 0.05}s` }}
                    />
                  </div>
                  <div className="flex-1 relative group">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      HN: {d.hn.toLocaleString()} คน
                    </div>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-teal-400 transition-all duration-500 hover:from-emerald-400 hover:to-teal-300 cursor-pointer"
                      style={{ height: `${(d.hn / maxBar) * 180}px`, animation: `bar-grow 1s ease forwards`, animationDelay: `${i * 0.05 + 0.02}s` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Table */}
      {monthData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">สรุปรายเดือน ปีงบประมาณ {fiscalYear}</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 dark:text-gray-500">{monthData.length} เดือน</span>
              <ExportButtons data={monthData} columns={tableColumns} fileName={`IPD_Summary_${fiscalYear}`} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  {tableColumns.map((col) => {
                    const isSorted = sortKey === col.key;
                    return (
                      <th key={col.key} className={`${col.align} py-1 px-3 text-gray-800 dark:text-gray-100 font-bold`}>
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => {
                              if (sortKey === col.key) setSortDir(sortDir === "asc" ? "desc" : "asc");
                              else { setSortKey(col.key); setSortDir("asc"); }
                            }}
                            className={`flex items-center gap-1 hover:text-blue-600 transition-colors ${col.align === "text-right" ? "justify-end" : ""}`}
                          >
                            {col.label}
                            {isSorted ? (
                              <svg className="w-3 h-3 shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortDir === "asc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3 shrink-0 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                              </svg>
                            )}
                          </button>
                          <input
                            type="text"
                            placeholder="กรอง..."
                            value={columnFilters[col.key] || ""}
                            onChange={(e) => setColumnFilters((prev) => ({ ...prev, [col.key]: e.target.value }))}
                            className="w-full border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5 text-[10px] text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white dark:bg-gray-700"
                          />
                        </div>
                      </th>
                    );
                  })}
                  <th className="text-center py-1 px-3 text-gray-800 dark:text-gray-100 font-bold"></th>
                </tr>
              </thead>
              <tbody>
                {sortedMonthData.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-3 px-3 text-gray-800 dark:text-gray-100 font-medium">{row.label}</td>
                    <td className="py-3 px-3 text-right font-mono text-blue-700">{row.an.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600">{row.hn.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-mono text-gray-800 dark:text-gray-100">{row.compensated.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-mono text-gray-800 dark:text-gray-100">{row.los_avg.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono text-gray-800 dark:text-gray-100">{formatNum(row.adjrw_total)}</td>
                    <td className="py-3 px-3 text-right font-mono text-gray-800 dark:text-gray-100">{row.cmi.toFixed(4)}</td>
                    <td className="py-3 px-3 text-right font-mono text-gray-800 dark:text-gray-100">฿{formatNum(row.income)}</td>
                    <td className="py-3 px-3 text-right font-mono text-gray-800 dark:text-gray-100">฿{formatNum(row.rcpt_money)}</td>
                    <td className="py-3 px-3 text-right font-mono text-red-600">฿{formatNum(Math.abs(row.income - row.rcpt_money))}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => fetchMonthData(fiscalYear, i)}
                        disabled={loadingMonth === row.month}
                        className="text-[10px] px-2 py-1 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-800/40 transition-colors disabled:opacity-50"
                      >
                        {loadingMonth === row.month ? "..." : "รีเฟรช"}
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 font-bold">
                  <td className="py-3 px-3 text-gray-800 dark:text-gray-100">รวม</td>
                  <td className="py-3 px-3 text-right font-mono text-blue-800">{totalAn.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-700">{totalHn.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono text-gray-800 dark:text-gray-100">{totalComp.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono text-gray-800 dark:text-gray-100">{avgLos.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono text-gray-800 dark:text-gray-100">{formatNum(totalAdjrw)}</td>
                  <td className="py-3 px-3 text-right font-mono text-gray-800 dark:text-gray-100">{totalCmi.toFixed(4)}</td>
                  <td className="py-3 px-3 text-right font-mono text-gray-800 dark:text-gray-100">฿{formatNum(totalIncome)}</td>
                  <td className="py-3 px-3 text-right font-mono text-gray-800 dark:text-gray-100">฿{formatNum(totalRcpt)}</td>
                  <td className="py-3 px-3 text-right font-mono text-red-700">฿{formatNum(Math.abs(totalBalance))}</td>
                  <td className="py-3 px-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && monthData.length === 0 && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-16 border border-gray-100 dark:border-gray-700 shadow-sm text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">เลือกปีงบประมาณแล้วกดดึงข้อมูล</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">ระบบจะดึงข้อมูลสรุปผู้ป่วยในรายเดือน ต.ค. — ก.ย.</p>
        </div>
      )}
    </>
  );
}
