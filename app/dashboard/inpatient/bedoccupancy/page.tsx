"use client";

import { useState, useCallback, useEffect } from "react";
import ExportButtons from "@/components/ExportButtons";

interface OccupancyRow {
  ym: string;
  admit_count: number;
  patient_count: number;
  total_patient_days: number;
  days_in_month: number;
  occupancy_rate: number;
}

interface Summary {
  total_patient_days: number;
  total_admit: number;
  total_patient: number;
  total_beds: number;
  total_days: number;
  occupancy_rate: number;
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

function rateColor(rate: number) {
  if (rate >= 85) return "text-red-500";
  if (rate >= 70) return "text-orange-500";
  if (rate >= 50) return "text-yellow-500";
  return "text-emerald-500";
}

function rateBg(rate: number) {
  if (rate >= 85) return "from-red-400 to-red-600";
  if (rate >= 70) return "from-orange-400 to-orange-500";
  if (rate >= 50) return "from-yellow-400 to-yellow-500";
  return "from-emerald-400 to-emerald-500";
}

export default function BedOccupancyPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [totalBeds, setTotalBeds] = useState(60);
  const [data, setData] = useState<OccupancyRow[]>([]);
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
      const params = new URLSearchParams({ startDate, endDate, beds: String(totalBeds) });
      if (selectedPttypes.length > 0) params.set("pttype", selectedPttypes.join(","));
      const res = await fetch(`/api/ipd/bedoccupancy?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data || []);
        setSummary(json.summary || null);
      } else {
        setError(json.message || "ไม่สามารถดึงข้อมูลได้");
        setData([]);
        setSummary(null);
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, totalBeds, selectedPttypes]);

  // Chart
  const chartW = 700;
  const chartH = 300;
  const padL = 55;
  const padR = 30;
  const padT = 35;
  const padB = 55;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const maxRate = Math.min(100, Math.max(...data.map((d) => d.occupancy_rate || 0), 10));

  const barWidth = data.length > 0 ? Math.min(40, (innerW / data.length) * 0.6) : 40;
  const barGap = data.length > 0 ? innerW / data.length : innerW;

  // Gauge helper
  const gaugeRate = summary?.occupancy_rate || 0;
  const gaugeAngle = (gaugeRate / 100) * 180;

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

          {/* Total Beds */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">จำนวนเตียง</label>
            <input
              type="number"
              min={1}
              value={totalBeds}
              onChange={(e) => setTotalBeds(Math.max(1, parseInt(e.target.value) || 1))}
              className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 w-24 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
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
          {/* Summary Cards + Gauge */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
            {/* Gauge */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">อัตราครองเตียงรวม</p>
              <svg viewBox="0 0 200 120" className="w-48">
                {/* Background arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth={14}
                  strokeLinecap="round"
                  className="dark:stroke-gray-700"
                />
                {/* Value arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke={gaugeRate >= 85 ? "#ef4444" : gaugeRate >= 70 ? "#f97316" : gaugeRate >= 50 ? "#eab308" : "#22c55e"}
                  strokeWidth={14}
                  strokeLinecap="round"
                  strokeDasharray={`${(gaugeAngle / 180) * 251.2} 251.2`}
                />
                {/* Needle */}
                {(() => {
                  const angle = Math.PI - (gaugeAngle * Math.PI) / 180;
                  const nx = 100 + 60 * Math.cos(angle);
                  const ny = 100 - 60 * Math.sin(angle);
                  return <line x1={100} y1={100} x2={nx} y2={ny} stroke="#374151" strokeWidth={2.5} strokeLinecap="round" className="dark:stroke-gray-300" />;
                })()}
                <circle cx={100} cy={100} r={4} fill="#374151" className="dark:fill-gray-300" />
                <text x={20} y={116} textAnchor="middle" className="text-[10px] fill-gray-400">0%</text>
                <text x={180} y={116} textAnchor="middle" className="text-[10px] fill-gray-400">100%</text>
              </svg>
              <p className={`text-4xl font-bold mt-2 ${rateColor(gaugeRate)}`}>{gaugeRate}%</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">เตียง {summary.total_beds} เตียง · {summary.total_days} วัน</p>
            </div>

            {/* Info Cards */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">วันนอนรวม</p>
                <p className="text-2xl font-bold text-blue-600">{summary.total_patient_days?.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Patient Days</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">จำนวน Admit</p>
                <p className="text-2xl font-bold text-blue-600">{summary.total_admit?.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">ครั้งที่ Admit</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ผู้ป่วยไม่ซ้ำ</p>
                <p className="text-2xl font-bold text-emerald-600">{summary.total_patient?.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">HN</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">เฉลี่ยวันนอน</p>
                <p className="text-2xl font-bold text-orange-500">
                  {summary.total_admit > 0 ? (summary.total_patient_days / summary.total_admit).toFixed(1) : "0"}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">วัน/ครั้ง</p>
              </div>
            </div>
          </div>

          {/* Export */}
          <div className="flex justify-end">
            <ExportButtons
              data={data.map((d) => ({
                เดือน: thaiMonth(d.ym),
                จำนวน_Admit: d.admit_count,
                ผู้ป่วยไม่ซ้ำ: d.patient_count,
                วันนอน: d.total_patient_days,
                วันในเดือน: d.days_in_month,
                อัตราครองเตียง: d.occupancy_rate,
              }))}
              columns={[
                { key: "เดือน", label: "เดือน" },
                { key: "จำนวน_Admit", label: "จำนวน Admit" },
                { key: "ผู้ป่วยไม่ซ้ำ", label: "ผู้ป่วยไม่ซ้ำ (HN)" },
                { key: "วันนอน", label: "วันนอน" },
                { key: "วันในเดือน", label: "วันในเดือน" },
                { key: "อัตราครองเตียง", label: "อัตราครองเตียง (%)" },
              ]}
              fileName="IPD_Bed_Occupancy"
            />
          </div>

          {/* Bar Chart - Occupancy Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in-up">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">อัตราครองเตียงรายเดือน (%)</h3>
            <div className="overflow-x-auto">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full max-w-[800px] mx-auto" style={{ minWidth: 400 }}>
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((val) => {
                  const y = padT + innerH * (1 - val / maxRate);
                  return (
                    <g key={val}>
                      <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="#e5e7eb" strokeWidth={0.5} className="dark:stroke-gray-700" />
                      <text x={padL - 8} y={y + 4} textAnchor="end" className="text-[9px] fill-gray-400 dark:fill-gray-500">{val}%</text>
                    </g>
                  );
                })}

                {/* 80% reference line */}
                {(() => {
                  const y80 = padT + innerH * (1 - 80 / maxRate);
                  return (
                    <g>
                      <line x1={padL} y1={y80} x2={padL + innerW} y2={y80} stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
                      <text x={padL + innerW + 4} y={y80 + 4} className="text-[8px] fill-red-400">เป้า 80%</text>
                    </g>
                  );
                })()}

                {/* Bars */}
                {data.map((row, i) => {
                  const x = padL + i * barGap + (barGap - barWidth) / 2;
                  const rate = row.occupancy_rate || 0;
                  const h = Math.max(2, (rate / maxRate) * innerH);
                  const y = padT + innerH - h;
                  return (
                    <g key={i}>
                      <defs>
                        <linearGradient id={`occ-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={rate >= 85 ? "#f87171" : rate >= 70 ? "#fb923c" : rate >= 50 ? "#facc15" : "#34d399"} />
                          <stop offset="100%" stopColor={rate >= 85 ? "#dc2626" : rate >= 70 ? "#ea580c" : rate >= 50 ? "#ca8a04" : "#059669"} />
                        </linearGradient>
                      </defs>
                      <rect x={x} y={y} width={barWidth} height={h} rx={4} fill={`url(#occ-${i})`} opacity={0.9} />
                      <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className={`text-[9px] font-bold ${rate >= 85 ? "fill-red-500" : rate >= 70 ? "fill-orange-500" : rate >= 50 ? "fill-yellow-600" : "fill-emerald-600"}`}>
                        {rate}%
                      </text>
                      <text x={x + barWidth / 2} y={padT + innerH + 16} textAnchor="middle" className="text-[8px] fill-gray-500 dark:fill-gray-400">
                        {thaiMonth(row.ym)}
                      </text>
                    </g>
                  );
                })}

                {/* Y-axis label */}
                <text x={14} y={padT + innerH / 2} textAnchor="middle" transform={`rotate(-90,14,${padT + innerH / 2})`} className="text-[10px] fill-gray-400 dark:fill-gray-500">อัตราครองเตียง (%)</text>
              </svg>
            </div>
          </div>

          {/* Patient Days & Admit Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">วันนอนรายเดือน</h3>
              <div className="space-y-2">
                {(() => {
                  const maxPd = Math.max(...data.map((d) => d.total_patient_days), 1);
                  return data.map((row, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-24 shrink-0 text-right">{thaiMonth(row.ym)}</span>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-end pr-2 transition-all duration-500"
                          style={{ width: `${Math.max(5, (row.total_patient_days / maxPd) * 100)}%` }}
                        >
                          <span className="text-[10px] text-white font-bold">{row.total_patient_days.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">จำนวน Admit รายเดือน</h3>
              <div className="space-y-2">
                {(() => {
                  const maxAd = Math.max(...data.map((d) => d.admit_count), 1);
                  return data.map((row, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-24 shrink-0 text-right">{thaiMonth(row.ym)}</span>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-end pr-2 transition-all duration-500"
                          style={{ width: `${Math.max(5, (row.admit_count / maxAd) * 100)}%` }}
                        >
                          <span className="text-[10px] text-white font-bold">{row.admit_count.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
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
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Admit</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">HN</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">วันนอน</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">วันในเดือน</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">อัตราครองเตียง</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">{thaiMonth(row.ym)}</td>
                      <td className="px-4 py-3 text-right text-purple-600 font-bold">{row.admit_count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-bold">{row.patient_count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-blue-600 font-bold">{row.total_patient_days.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{row.days_in_month}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${rateColor(row.occupancy_rate)}`}>{row.occupancy_rate}%</span>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                          <div className={`h-full rounded-full bg-gradient-to-r ${rateBg(row.occupancy_rate)}`} style={{ width: `${Math.min(100, row.occupancy_rate)}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 dark:bg-gray-700/50 font-bold">
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-100">รวม</td>
                    <td className="px-4 py-3 text-right text-purple-600">{summary.total_admit?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{summary.total_patient?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{summary.total_patient_days?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{summary.total_days}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${rateColor(summary.occupancy_rate)}`}>{summary.occupancy_rate}%</span>
                    </td>
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
          <p className="text-gray-400 dark:text-gray-500 text-sm">เลือกช่วงวันที่แล้วกด &quot;ค้นหา&quot; เพื่อดูอัตราครองเตียง</p>
        </div>
      ) : null}
    </>
  );
}
