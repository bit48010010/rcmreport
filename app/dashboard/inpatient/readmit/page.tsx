"use client";

import { useState, useCallback, useEffect } from "react";
import ExportButtons from "@/components/ExportButtons";

interface ReadmitRow {
  readmit_an: string;
  hn: string;
  fname: string;
  lname: string;
  prev_dchdate: string;
  readmit_date: string;
  readmit_dchdate: string | null;
  gap_days: number;
  prev_an: string;
  prev_pdx: string;
  prev_pdx_name: string;
  curr_pdx: string;
  curr_pdx_name: string;
  ym: string;
}

interface MonthlyRow {
  ym: string;
  readmit_count: number;
  readmit_hn: number;
}

interface Summary {
  total_an: number;
  total_hn: number;
  readmit_an: number;
  readmit_hn: number;
  readmit_rate: number;
  within_days: number;
}

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

function getFiscalYearRange(fiscalYear: number) {
  const startCE = fiscalYear - 543 - 1;
  return { start: `${startCE}-10-01`, end: `${startCE + 1}-09-30` };
}

function getMonthRange(fiscalYear: number, month: number) {
  const ceYear = month >= 10 ? fiscalYear - 543 - 1 : fiscalYear - 543;
  const mm = String(month).padStart(2, "0");
  const lastDay = new Date(ceYear, month, 0).getDate();
  return { start: `${ceYear}-${mm}-01`, end: `${ceYear}-${mm}-${String(lastDay).padStart(2, "0")}` };
}

function thaiMonth(ym: string) {
  const names = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const [y, m] = ym.split("-");
  return `${names[parseInt(m)]} ${parseInt(y) + 543}`;
}

function gapColor(days: number) {
  if (days <= 3) return "text-red-500 bg-red-50 dark:bg-red-900/30";
  if (days <= 7) return "text-orange-500 bg-orange-50 dark:bg-orange-900/30";
  if (days <= 14) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30";
  return "text-blue-500 bg-blue-50 dark:bg-blue-900/30";
}

export default function ReadmitPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [withinDays, setWithinDays] = useState(28);
  const [data, setData] = useState<ReadmitRow[]>([]);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fiscalYear, setFiscalYear] = useState<number | "">("");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  // Pttype picker
  const [pttypeOptions, setPttypeOptions] = useState<{ pttype: string; name: string; label: string }[]>([]);
  const [selectedPttypes, setSelectedPttypes] = useState<string[]>([]);
  const [showPttypePicker, setShowPttypePicker] = useState(false);
  const [pttypeSearch, setPttypeSearch] = useState("");

  useEffect(() => {
    fetch("/api/pttype")
      .then((res) => res.json())
      .then((json) => { if (json.success) setPttypeOptions(json.data); })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ startDate, endDate, days: String(withinDays) });
      if (selectedPttypes.length > 0) params.set("pttype", selectedPttypes.join(","));
      const res = await fetch(`/api/ipd/readmit?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data || []);
        setMonthly(json.monthly || []);
        setSummary(json.summary || null);
      } else {
        setError(json.message || "ไม่สามารถดึงข้อมูลได้");
        setData([]);
        setMonthly([]);
        setSummary(null);
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setData([]);
      setMonthly([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, withinDays, selectedPttypes]);

  // Chart dimensions
  const chartW = 700;
  const chartH = 280;
  const padL = 55;
  const padR = 30;
  const padT = 30;
  const padB = 55;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const maxCount = monthly.length > 0 ? Math.max(...monthly.map((d) => d.readmit_count)) : 1;
  const barWidth = monthly.length > 0 ? Math.min(40, (innerW / monthly.length) * 0.6) : 40;
  const barGap = monthly.length > 0 ? innerW / monthly.length : innerW;

  // Gap distribution
  const gapBuckets = [
    { label: "1-3 วัน", min: 1, max: 3, color: "#ef4444" },
    { label: "4-7 วัน", min: 4, max: 7, color: "#f97316" },
    { label: "8-14 วัน", min: 8, max: 14, color: "#eab308" },
    { label: "15-28 วัน", min: 15, max: 28, color: "#3b82f6" },
  ];

  const gapDist = gapBuckets.map((b) => ({
    ...b,
    count: data.filter((d) => d.gap_days >= b.min && d.gap_days <= b.max).length,
  }));
  const maxGap = Math.max(...gapDist.map((g) => g.count), 1);

  return (
    <>
      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in-up">
        <div className="flex flex-wrap items-end gap-4">
          {/* Fiscal Year */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">ปีงบประมาณ</label>
            <select
              value={fiscalYear}
              onChange={(e) => {
                const fy = e.target.value ? Number(e.target.value) : "";
                setFiscalYear(fy);
                setSelectedMonth(null);
                if (fy) {
                  const range = getFiscalYearRange(fy as number);
                  setStartDate(range.start);
                  setEndDate(range.end);
                }
              }}
              className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">-- เลือกปีงบ --</option>
              {getFiscalYearOptions().map((y) => (
                <option key={y} value={y}>ปีงบ {y}</option>
              ))}
            </select>
          </div>

          {/* Date Inputs */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">วันที่เริ่มต้น</label>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setFiscalYear(""); setSelectedMonth(null); }} className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">วันที่สิ้นสุด</label>
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setFiscalYear(""); setSelectedMonth(null); }} className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          {/* Within Days */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">ภายใน (วัน)</label>
            <select
              value={withinDays}
              onChange={(e) => setWithinDays(Number(e.target.value))}
              className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value={7}>7 วัน</option>
              <option value={14}>14 วัน</option>
              <option value={28}>28 วัน</option>
              <option value={30}>30 วัน</option>
              <option value={60}>60 วัน</option>
              <option value={90}>90 วัน</option>
            </select>
          </div>

          {/* Pttype Picker */}
          <div className="relative">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">สิทธิ์</label>
            <button
              type="button"
              onClick={() => setShowPttypePicker(!showPttypePicker)}
              className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 min-w-[120px] text-left focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {selectedPttypes.length > 0 ? `เลือกแล้ว ${selectedPttypes.length} สิทธิ์` : "ทั้งหมด"}
            </button>
            {showPttypePicker && (
              <div className="absolute z-50 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg p-3 w-72 max-h-60 overflow-auto">
                <input type="text" placeholder="ค้นหาสิทธิ์..." value={pttypeSearch} onChange={(e) => setPttypeSearch(e.target.value)} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-xs mb-2 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 focus:outline-none" />
                <div className="flex gap-2 mb-2">
                  <button onClick={() => setSelectedPttypes(pttypeOptions.map((p) => p.pttype))} className="text-[10px] text-blue-500 hover:underline">เลือกทั้งหมด</button>
                  <button onClick={() => setSelectedPttypes([])} className="text-[10px] text-red-500 hover:underline">ล้าง</button>
                  <button onClick={() => setShowPttypePicker(false)} className="text-[10px] text-gray-500 hover:underline ml-auto">ปิด</button>
                </div>
                {pttypeOptions
                  .filter((p) => !pttypeSearch || p.pttype.includes(pttypeSearch) || p.name.includes(pttypeSearch))
                  .map((p) => (
                    <label key={p.pttype} className="flex items-center gap-2 text-xs py-0.5 cursor-pointer text-gray-700 dark:text-gray-200">
                      <input type="checkbox" checked={selectedPttypes.includes(p.pttype)} onChange={(e) => { if (e.target.checked) setSelectedPttypes([...selectedPttypes, p.pttype]); else setSelectedPttypes(selectedPttypes.filter((x) => x !== p.pttype)); }} className="rounded" />
                      <span className="font-mono text-blue-600 dark:text-blue-400">{p.pttype}</span>
                      <span className="truncate">{p.name}</span>
                    </label>
                  ))}
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            )}
            ค้นหา
          </button>
        </div>

        {/* Fiscal Month Pills */}
        {fiscalYear && (
          <div className="flex flex-wrap gap-2 mt-4">
            {fiscalMonths.map((fm) => (
              <button
                key={fm.month}
                onClick={() => {
                  setSelectedMonth(fm.month);
                  const range = getMonthRange(fiscalYear as number, fm.month);
                  setStartDate(range.start);
                  setEndDate(range.end);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedMonth === fm.month
                    ? "bg-blue-500 text-white shadow"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-600"
                }`}
              >
                {fm.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 rounded-2xl p-4 text-sm animate-fade-in-up">
          {error}
        </div>
      )}

      {/* Results */}
      {summary ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in-up">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">อัตรา Re-admit</p>
              <p className={`text-3xl font-bold ${summary.readmit_rate > 5 ? "text-red-500" : summary.readmit_rate > 2 ? "text-orange-500" : "text-emerald-500"}`}>
                {summary.readmit_rate}%
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">ภายใน {summary.within_days} วัน</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Re-admit (AN)</p>
              <p className="text-3xl font-bold text-red-500">{summary.readmit_an?.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">ครั้งที่ Admit ซ้ำ</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Re-admit (HN)</p>
              <p className="text-3xl font-bold text-orange-500">{summary.readmit_hn?.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">ผู้ป่วยไม่ซ้ำ</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Admit ทั้งหมด</p>
              <p className="text-3xl font-bold text-blue-600">{summary.total_an?.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">AN ในช่วง</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ผู้ป่วยทั้งหมด</p>
              <p className="text-3xl font-bold text-emerald-600">{summary.total_hn?.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">HN ในช่วง</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
            {/* Monthly Bar Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Re-admit รายเดือน</h3>
              {monthly.length > 0 ? (
                <div className="overflow-x-auto">
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full max-w-[700px] mx-auto" style={{ minWidth: 350 }}>
                    {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                      const y = padT + innerH * (1 - frac);
                      const val = Math.round(maxCount * frac);
                      return (
                        <g key={frac}>
                          <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="#e5e7eb" strokeWidth={0.5} className="dark:stroke-gray-700" />
                          <text x={padL - 8} y={y + 4} textAnchor="end" className="text-[9px] fill-gray-400 dark:fill-gray-500">{val}</text>
                        </g>
                      );
                    })}
                    {monthly.map((row, i) => {
                      const x = padL + i * barGap + (barGap - barWidth) / 2;
                      const h = Math.max(2, (row.readmit_count / maxCount) * innerH);
                      const y = padT + innerH - h;
                      return (
                        <g key={i}>
                          <defs>
                            <linearGradient id={`ra-${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f87171" />
                              <stop offset="100%" stopColor="#dc2626" />
                            </linearGradient>
                          </defs>
                          <rect x={x} y={y} width={barWidth} height={h} rx={4} fill={`url(#ra-${i})`} opacity={0.9} />
                          <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className="text-[9px] font-bold fill-red-500">{row.readmit_count}</text>
                          <text x={x + barWidth / 2} y={padT + innerH + 16} textAnchor="middle" className="text-[8px] fill-gray-500 dark:fill-gray-400">{thaiMonth(row.ym)}</text>
                        </g>
                      );
                    })}
                    <text x={14} y={padT + innerH / 2} textAnchor="middle" transform={`rotate(-90,14,${padT + innerH / 2})`} className="text-[10px] fill-gray-400 dark:fill-gray-500">จำนวน Re-admit</text>
                  </svg>
                </div>
              ) : (
                <p className="text-center text-sm text-gray-400 py-8">ไม่มีข้อมูล Re-admit รายเดือน</p>
              )}
            </div>

            {/* Gap Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">การกระจายระยะห่าง (วัน)</h3>
              <div className="space-y-3">
                {gapDist.map((b, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-300">{b.label}</span>
                      <span className="font-bold" style={{ color: b.color }}>{b.count} ราย</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(5, (b.count / maxGap) * 100)}%`, backgroundColor: b.color }}
                      >
                        {b.count > 0 && <span className="text-[9px] text-white font-bold">{Math.round((b.count / (data.length || 1)) * 100)}%</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {data.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">ระยะห่างเฉลี่ย: <span className="font-bold text-gray-700 dark:text-gray-200">{(data.reduce((s, d) => s + d.gap_days, 0) / data.length).toFixed(1)} วัน</span></p>
                </div>
              )}
            </div>
          </div>

          {/* Export */}
          <div className="flex justify-end">
            <ExportButtons
              data={data.map((d) => ({
                HN: d.hn,
                AN: d.readmit_an,
                AN_ครั้งก่อน: d.prev_an,
                วันจำหน่ายก่อน: d.prev_dchdate,
                PDx_ก่อน: d.prev_pdx,
                ชื่อโรคก่อน: d.prev_pdx_name || "-",
                AN_Readmit: d.readmit_an,
                วัน_Readmit: d.readmit_date,
                PDx_Readmit: d.curr_pdx,
                ชื่อโรค_Readmit: d.curr_pdx_name || "-",
                ระยะห่าง_วัน: d.gap_days,
              }))}
              columns={[
                { key: "HN", label: "HN" },
                { key: "AN", label: "AN" },
                { key: "AN_ครั้งก่อน", label: "AN ครั้งก่อน" },
                { key: "วันจำหน่ายก่อน", label: "วันจำหน่ายก่อน" },
                { key: "PDx_ก่อน", label: "PDx ก่อน" },
                { key: "ชื่อโรคก่อน", label: "ชื่อโรคก่อน" },
                { key: "AN_Readmit", label: "AN Readmit" },
                { key: "วัน_Readmit", label: "วัน Readmit" },
                { key: "PDx_Readmit", label: "PDx Readmit" },
                { key: "ชื่อโรค_Readmit", label: "ชื่อโรค Readmit" },
                { key: "ระยะห่าง_วัน", label: "ระยะห่าง (วัน)" },
              ]}
              fileName="IPD_Readmit"
            />
          </div>

          {/* Detail Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden animate-fade-in-up">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">#</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">HN</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">AN</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">ครั้งก่อน (PDx)</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">จำหน่าย</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Re-admit (PDx)</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">วัน Admit</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">ห่าง</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => {
                    const samePdx = row.prev_pdx && row.curr_pdx && row.prev_pdx === row.curr_pdx;
                    return (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-3 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-3 py-2.5 font-mono text-emerald-600 dark:text-emerald-400 text-xs">{row.hn}</td>
                        <td className="px-3 py-2.5 font-mono text-blue-600 dark:text-blue-400 text-xs">{row.readmit_an}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-xs font-mono text-purple-600 dark:text-purple-400">{row.prev_pdx || "-"}</span>
                          {row.prev_pdx_name && <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[150px]">{row.prev_pdx_name}</p>}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-500 dark:text-gray-400">{row.prev_dchdate}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`text-xs font-mono ${samePdx ? "text-red-500 font-bold" : "text-orange-500"}`}>{row.curr_pdx || "-"}</span>
                          {samePdx && <span className="ml-1 text-[9px] bg-red-100 dark:bg-red-900/40 text-red-500 px-1 rounded">ซ้ำ</span>}
                          {row.curr_pdx_name && <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[150px]">{row.curr_pdx_name}</p>}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-500 dark:text-gray-400">{row.readmit_date}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${gapColor(row.gap_days)}`}>
                            {row.gap_days} วัน
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {data.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">ไม่พบข้อมูล Re-admit ในช่วงที่เลือก</div>
              )}
            </div>
          </div>
        </div>
      ) : !loading && !error ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in-up">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-gray-500 dark:text-gray-400 font-semibold mb-1">ยังไม่มีข้อมูล</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm">เลือกช่วงวันที่แล้วกด &quot;ค้นหา&quot; เพื่อดูข้อมูล Re-admit</p>
        </div>
      ) : null}
    </>
  );
}
