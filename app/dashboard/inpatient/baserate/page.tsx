"use client";

import { useState, useCallback, useEffect } from "react";
import ExportButtons from "@/components/ExportButtons";

interface BaseRateRow {
  ym: string;
  an_count: number;
  hn_count: number;
  sum_income: number;
  sum_rcpt: number;
  sum_adjrw: number;
  base_rate: number;
}

interface Summary {
  total_an: number;
  total_hn: number;
  total_income: number;
  total_rcpt: number;
  total_adjrw: number;
  base_rate: number;
  avg_los: number;
  cmi: number;
  claim_debt: number;
  rep_count: number;
}

interface BaseratedDist {
  baserated: number;
  an_count: number;
  sum_adjrw: number;
  sum_compensated: number;
}

interface MonthlyRepdata {
  ym: string;
  an_count: number;
  avg_baserated: number;
  sum_compensated: number;
  sum_adjrw: number;
}

interface MonthlyEclaim {
  ym: string;
  an_count: number;
  sum_compensated: number;
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

function fmtMoney(v: number) {
  return v?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00";
}

export default function BaseRatePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState<BaseRateRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [baseratedDist, setBaseratedDist] = useState<BaseratedDist[]>([]);
  const [monthlyRepdata, setMonthlyRepdata] = useState<MonthlyRepdata[]>([]);
  const [monthlyEclaim, setMonthlyEclaim] = useState<MonthlyEclaim[]>([]);
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
      const params = new URLSearchParams({ startDate, endDate });
      if (selectedPttypes.length > 0) params.set("pttype", selectedPttypes.join(","));
      const res = await fetch(`/api/ipd/baserate?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data || []);
        setSummary(json.summary || null);
        setBaseratedDist(json.baserated_dist || []);
        setMonthlyRepdata(json.monthly_repdata || []);
        setMonthlyEclaim(json.monthly_eclaim || []);
      } else {
        setError(json.message || "ไม่สามารถดึงข้อมูลได้");
        setData([]);
        setSummary(null);
        setBaseratedDist([]);
        setMonthlyRepdata([]);
        setMonthlyEclaim([]);
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setData([]);
      setSummary(null);
      setBaseratedDist([]);
      setMonthlyRepdata([]);
      setMonthlyEclaim([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedPttypes]);

  // Chart dimensions
  const chartW = 700;
  const chartH = 300;
  const padL = 70;
  const padR = 30;
  const padT = 35;
  const padB = 55;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  // Line chart for base rate
  const rates = data.map((d) => d.base_rate || 0);
  const maxRate = rates.length > 0 ? Math.max(...rates) : 1;
  const minRate = rates.length > 0 ? Math.min(...rates) : 0;
  const rateRange = maxRate - minRate || 1;
  const yMin = Math.max(0, minRate - rateRange * 0.15);
  const yMax = maxRate + rateRange * 0.15;

  const points = data.map((d, i) => {
    const x = padL + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
    const y = padT + innerH - ((d.base_rate - yMin) / (yMax - yMin || 1)) * innerH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = points.length > 0
    ? `${linePath} L${points[points.length - 1].x},${padT + innerH} L${points[0].x},${padT + innerH} Z`
    : "";

  // Bar chart helpers
  const maxIncome = data.length > 0 ? Math.max(...data.map((d) => d.sum_income)) : 1;
  const maxAdjrw = data.length > 0 ? Math.max(...data.map((d) => d.sum_adjrw)) : 1;

  // Monthly eclaim compensated max
  const maxEclaimComp = monthlyEclaim.length > 0 ? Math.max(...monthlyEclaim.map((d) => d.sum_compensated)) : 1;

  // Baserated distribution bar chart dimensions
  const distChartW = 700;
  const distChartH = 350;
  const distPadL = 60;
  const distPadR = 30;
  const distPadT = 40;
  const distPadB = 80;
  const distInnerW = distChartW - distPadL - distPadR;
  const distInnerH = distChartH - distPadT - distPadB;
  const distMaxAN = baseratedDist.length > 0 ? Math.max(...baseratedDist.map((d) => d.an_count)) : 1;
  const distTotalAN = baseratedDist.reduce((sum, d) => sum + d.an_count, 0);

  // Color palette for bars
  const barColors = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#6366f1",
    "#14b8a6", "#e11d48", "#a855f7", "#22c55e", "#eab308",
  ];

  // Monthly baserated (repdata) line chart
  const repRates = monthlyRepdata.map((d) => d.avg_baserated || 0);
  const repMaxRate = repRates.length > 0 ? Math.max(...repRates) : 1;
  const repMinRate = repRates.length > 0 ? Math.min(...repRates) : 0;
  const repRateRange = repMaxRate - repMinRate || 1;
  const repYMin = Math.max(0, repMinRate - repRateRange * 0.15);
  const repYMax = repMaxRate + repRateRange * 0.15;

  const repPoints = monthlyRepdata.map((d, i) => {
    const x = padL + (monthlyRepdata.length > 1 ? (i / (monthlyRepdata.length - 1)) * innerW : innerW / 2);
    const y = padT + innerH - ((d.avg_baserated - repYMin) / (repYMax - repYMin || 1)) * innerH;
    return { x, y, ...d };
  });

  const repLinePath = repPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const repAreaPath = repPoints.length > 0
    ? `${repLinePath} L${repPoints[repPoints.length - 1].x},${padT + innerH} L${repPoints[0].x},${padT + innerH} Z`
    : "";

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
      {summary && data.length > 0 ? (
        <div className="space-y-6">
          {/* Summary Cards - 5 per row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 animate-fade-in-up">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">จำนวน Admit (AN)</p>
              <p className="text-xl font-bold text-blue-600">{summary.total_an?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">จำนวนคน (HN)</p>
              <p className="text-xl font-bold text-emerald-600">{summary.total_hn?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">LOS เฉลี่ย (วัน)</p>
              <p className="text-xl font-bold text-amber-600">{summary.avg_los?.toFixed(2) || "0.00"}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">AdjRW รวม</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{summary.total_adjrw?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">CMI</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{summary.cmi?.toFixed(4) || "0.0000"}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">ค่ารักษา</p>
              <p className="text-xl font-bold text-purple-600">฿{fmtMoney(summary.total_income)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">ชำระเงินสด</p>
              <p className="text-xl font-bold text-amber-500">฿{fmtMoney(summary.total_rcpt)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">ลูกหนี้</p>
              <p className="text-xl font-bold text-rose-600">฿{fmtMoney(summary.claim_debt)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">จำนวน REP</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{summary.rep_count?.toLocaleString() || 0} <span className="text-xs font-normal text-gray-400">รายการ</span></p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">Base Rate</p>
              <p className="text-xl font-bold text-teal-600">{fmtMoney(summary.base_rate)}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">บาท/AdjRW</p>
            </div>
          </div>

          {/* Export */}
          <div className="flex justify-end">
            <ExportButtons
              data={data.map((d) => ({
                เดือน: thaiMonth(d.ym),
                จำนวน_AN: d.an_count,
                จำนวน_HN: d.hn_count,
                ค่ารักษา: d.sum_income,
                เงินรับ: d.sum_rcpt,
                AdjRW: d.sum_adjrw,
                Base_Rate: d.base_rate,
              }))}
              columns={[
                { key: "เดือน", label: "เดือน" },
                { key: "จำนวน_AN", label: "จำนวน AN" },
                { key: "จำนวน_HN", label: "จำนวน HN" },
                { key: "ค่ารักษา", label: "ค่ารักษา (Income)" },
                { key: "เงินรับ", label: "เงินรับ (Receipt)" },
                { key: "AdjRW", label: "AdjRW" },
                { key: "Base_Rate", label: "Base Rate" },
              ]}
              fileName="IPD_Base_Rate"
            />
          </div>

          {/* ============ Baserated Distribution Bar Chart (repdata) ============ */}
          {baseratedDist.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in-up">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">เปรียบเทียบจำนวน AN ตาม Base Rate (จากตาราง repdata)</h3>
              <div className="flex flex-wrap items-center gap-6 mt-2 mb-4">
                <div>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">จำนวน Admit (AN) </span>
                  <span className="text-lg font-bold text-blue-600">{distTotalAN.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">จำนวนคน (HN) </span>
                  <span className="text-lg font-bold text-green-600">{summary.total_hn?.toLocaleString() || 0}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${distChartW} ${distChartH}`} className="w-full max-w-[800px] mx-auto" style={{ minWidth: 400 }}>
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                    const y = distPadT + distInnerH * (1 - frac);
                    const val = distMaxAN * frac;
                    return (
                      <g key={frac}>
                        <line x1={distPadL} y1={y} x2={distPadL + distInnerW} y2={y} stroke="#e5e7eb" strokeWidth={0.5} className="dark:stroke-gray-700" />
                        <text x={distPadL - 8} y={y + 4} textAnchor="end" className="text-[9px] fill-gray-400 dark:fill-gray-500">{Math.round(val).toLocaleString()}</text>
                      </g>
                    );
                  })}

                  {/* Bars */}
                  {baseratedDist.map((d, i) => {
                    const barW = Math.max(20, Math.min(60, (distInnerW / baseratedDist.length) * 0.7));
                    const gap = distInnerW / baseratedDist.length;
                    const x = distPadL + i * gap + (gap - barW) / 2;
                    const barH = (d.an_count / distMaxAN) * distInnerH;
                    const y = distPadT + distInnerH - barH;
                    const color = barColors[i % barColors.length];
                    const pct = distTotalAN > 0 ? ((d.an_count / distTotalAN) * 100).toFixed(1) : "0";

                    return (
                      <g key={i}>
                        <rect x={x} y={y} width={barW} height={barH} rx={4} fill={color} fillOpacity={0.85} />
                        <rect x={x} y={y} width={barW} height={Math.min(6, barH)} rx={4} fill={color} fillOpacity={0.3} />
                        <text x={x + barW / 2} y={y - 14} textAnchor="middle" className="text-[10px] font-bold" fill={color}>
                          {d.an_count.toLocaleString()}
                        </text>
                        <text x={x + barW / 2} y={y - 4} textAnchor="middle" className="text-[8px] fill-gray-400 dark:fill-gray-500">
                          ({pct}%)
                        </text>
                        <text x={x + barW / 2} y={distPadT + distInnerH + 16} textAnchor="middle" className="text-[10px] font-semibold fill-gray-600 dark:fill-gray-300">
                          {d.baserated.toLocaleString()}
                        </text>
                        <text x={x + barW / 2} y={distPadT + distInnerH + 28} textAnchor="middle" className="text-[8px] fill-gray-400 dark:fill-gray-500">
                          บาท
                        </text>
                      </g>
                    );
                  })}

                  {/* Y-axis label */}
                  <text x={14} y={distPadT + distInnerH / 2} textAnchor="middle" transform={`rotate(-90,14,${distPadT + distInnerH / 2})`} className="text-[10px] fill-gray-400 dark:fill-gray-500">จำนวน AN</text>
                  <text x={distPadL + distInnerW / 2} y={distChartH - 5} textAnchor="middle" className="text-[10px] fill-gray-400 dark:fill-gray-500">Base Rate (baserated)</text>
                </svg>
              </div>

              {/* Baserated Distribution Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Base Rate (บาท)</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">จำนวน AN</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">สัดส่วน</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">AdjRW รวม</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">ค่าชดเชยรวม (บาท)</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 w-48">กราฟ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baseratedDist.map((d, i) => {
                      const pct = distTotalAN > 0 ? ((d.an_count / distTotalAN) * 100) : 0;
                      const color = barColors[i % barColors.length];
                      return (
                        <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-4 py-2 font-bold" style={{ color }}>{d.baserated.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right text-blue-600 font-bold">{d.an_count.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right text-gray-500 dark:text-gray-400">{pct.toFixed(1)}%</td>
                          <td className="px-4 py-2 text-right text-purple-600 font-bold">{d.sum_adjrw.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right text-emerald-600 font-bold">{fmtMoney(d.sum_compensated)}</td>
                          <td className="px-4 py-2">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(4, pct)}%`, backgroundColor: color }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-50 dark:bg-gray-700/50 font-bold border-t-2 border-gray-200 dark:border-gray-600">
                      <td className="px-4 py-2 text-gray-800 dark:text-gray-100">รวม</td>
                      <td className="px-4 py-2 text-right text-blue-600">{distTotalAN.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-gray-500 dark:text-gray-400">100%</td>
                      <td className="px-4 py-2 text-right text-purple-600">{baseratedDist.reduce((s, d) => s + d.sum_adjrw, 0).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-emerald-600">{fmtMoney(baseratedDist.reduce((s, d) => s + d.sum_compensated, 0))}</td>
                      <td className="px-4 py-2" />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============ Monthly Baserated Trend from repdata ============ */}
          {monthlyRepdata.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in-up">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">แนวโน้ม Base Rate รายเดือน (จากตาราง repdata)</h3>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4">ค่าเฉลี่ย baserated ที่ได้รับจากไฟล์ตอบกลับ (REP/STM) แยกรายเดือน</p>
              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full max-w-[800px] mx-auto" style={{ minWidth: 400 }}>
                  {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                    const y = padT + innerH * (1 - frac);
                    const val = repYMin + (repYMax - repYMin) * frac;
                    return (
                      <g key={frac}>
                        <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="#e5e7eb" strokeWidth={0.5} className="dark:stroke-gray-700" />
                        <text x={padL - 8} y={y + 4} textAnchor="end" className="text-[9px] fill-gray-400 dark:fill-gray-500">{val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</text>
                      </g>
                    );
                  })}
                  {repAreaPath && <path d={repAreaPath} fill="#6366f1" fillOpacity={0.1} />}
                  {repLinePath && <path d={repLinePath} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
                  {repPoints.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r={5} fill="white" stroke="#6366f1" strokeWidth={2.5} />
                      <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-[9px] font-bold fill-indigo-600 dark:fill-indigo-400">{fmtMoney(p.avg_baserated)}</text>
                      <text x={p.x} y={padT + innerH + 18} textAnchor="middle" className="text-[8px] fill-gray-500 dark:fill-gray-400">{thaiMonth(p.ym)}</text>
                    </g>
                  ))}
                  <text x={14} y={padT + innerH / 2} textAnchor="middle" transform={`rotate(-90,14,${padT + innerH / 2})`} className="text-[10px] fill-gray-400 dark:fill-gray-500">Avg Base Rate (บาท)</text>
                </svg>
              </div>
            </div>
          )}

          {/* Income & AdjRW Horizontal Bars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
            {/* Income */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">ค่ารักษา (Income) รายเดือน</h3>
              <div className="space-y-2">
                {data.map((row, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-24 shrink-0 text-right">{thaiMonth(row.ym)}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 flex items-center justify-end pr-2 transition-all duration-500"
                        style={{ width: `${Math.max(5, (row.sum_income / maxIncome) * 100)}%` }}
                      >
                        <span className="text-[9px] text-white font-bold">{fmtMoney(row.sum_income)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* รายได้ (repeclaim compensated) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">รายได้ (Compensated) รายเดือน</h3>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">จากตาราง repeclaim (Statement)</p>
              <div className="space-y-2">
                {monthlyEclaim.map((row, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-24 shrink-0 text-right">{thaiMonth(row.ym)}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-end pr-2 transition-all duration-500"
                        style={{ width: `${Math.max(5, (row.sum_compensated / maxEclaimComp) * 100)}%` }}
                      >
                        <span className="text-[9px] text-white font-bold">{fmtMoney(row.sum_compensated)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden animate-fade-in-up">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">เดือน</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">AN</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">HN</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">ค่ารักษา</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">เงินรับ</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">AdjRW</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Base Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">{thaiMonth(row.ym)}</td>
                      <td className="px-4 py-3 text-right text-blue-600 font-bold">{row.an_count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-bold">{row.hn_count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-bold">{fmtMoney(row.sum_income)}</td>
                      <td className="px-4 py-3 text-right text-cyan-600 font-bold">{fmtMoney(row.sum_rcpt)}</td>
                      <td className="px-4 py-3 text-right text-purple-600 font-bold">{row.sum_adjrw.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-teal-600 font-bold">{fmtMoney(row.base_rate)}</td>
                    </tr>
                  ))}
                  {/* Summary Row */}
                  <tr className="bg-gray-50 dark:bg-gray-700/50 font-bold">
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-100">รวม</td>
                    <td className="px-4 py-3 text-right text-blue-600">{summary.total_an?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{summary.total_hn?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{fmtMoney(summary.total_income)}</td>
                    <td className="px-4 py-3 text-right text-cyan-600">{fmtMoney(summary.total_rcpt)}</td>
                    <td className="px-4 py-3 text-right text-purple-600">{summary.total_adjrw?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-teal-600">{fmtMoney(summary.base_rate)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : !loading && !error ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in-up">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-gray-500 dark:text-gray-400 font-semibold mb-1">ยังไม่มีข้อมูล</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm">เลือกช่วงวันที่แล้วกด &quot;ค้นหา&quot; เพื่อดูข้อมูล Base Rate</p>
        </div>
      ) : null}
    </>
  );
}
