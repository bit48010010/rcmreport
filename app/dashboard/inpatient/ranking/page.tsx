"use client";

import { useState, useCallback, useEffect } from "react";
import ExportButtons from "@/components/ExportButtons";

interface RankingRow {
  pdx: string;
  pdx_name: string;
  an_count: number;
  hn_count: number;
  sum_adjrw: number;
}

interface Summary {
  total_an: number;
  total_hn: number;
  total_adjrw: number;
  total_pdx_codes: number;
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

function getMonthRange(fiscalYear: number, month: number) {
  const ceYear = month >= 10 ? fiscalYear - 543 - 1 : fiscalYear - 543;
  const mm = String(month).padStart(2, "0");
  const lastDay = new Date(ceYear, month, 0).getDate();
  return {
    start: `${ceYear}-${mm}-01`,
    end: `${ceYear}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
}

function getFiscalYearRange(fiscalYear: number) {
  const startCE = fiscalYear - 543 - 1;
  return {
    start: `${startCE}-10-01`,
    end: `${startCE + 1}-09-30`,
  };
}

const MEDAL_COLORS = [
  "from-yellow-400 to-amber-500", // gold
  "from-gray-300 to-gray-400",    // silver
  "from-amber-600 to-amber-700",  // bronze
];

const PIE_COLORS = [
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#14b8a6", "#06b6d4", "#0ea5e9", "#2563eb",
  "#7c3aed", "#c026d3", "#e11d48", "#ea580c", "#ca8a04",
];

export default function InpatientRankingPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState<RankingRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fiscalYear, setFiscalYear] = useState<number | "">("");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [limit, setLimit] = useState(10);

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
      const params = new URLSearchParams({ startDate, endDate, limit: String(limit) });
      if (selectedPttypes.length > 0) params.set("pttype", selectedPttypes.join(","));
      const res = await fetch(`/api/ipd/ranking?${params.toString()}`);
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
  }, [startDate, endDate, selectedPttypes, limit]);

  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.an_count)) : 1;

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
                  const range = getFiscalYearRange(fy);
                  setStartDate(range.start);
                  setEndDate(range.end);
                }
              }}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option value="">-- เลือกปี --</option>
              {getFiscalYearOptions().map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">จากวันที่</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">ถึงวันที่</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>

          {/* Pttype Picker */}
          <div className="relative">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">สิทธิ์การรักษา</label>
            <button
              onClick={() => setShowPttypePicker(!showPttypePicker)}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 min-w-[160px] text-left"
            >
              {selectedPttypes.length > 0 ? `เลือกแล้ว ${selectedPttypes.length} สิทธิ์` : "ทั้งหมด"}
            </button>
            {showPttypePicker && (
              <div className="absolute z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg p-3 w-72 max-h-64 overflow-auto">
                <input
                  type="text"
                  value={pttypeSearch}
                  onChange={(e) => setPttypeSearch(e.target.value)}
                  placeholder="ค้นหาสิทธิ์..."
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm mb-2"
                />
                <div className="flex gap-2 mb-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                  <button onClick={() => setSelectedPttypes(pttypeOptions.map((p) => p.pttype))} className="text-xs text-blue-500">เลือกทั้งหมด</button>
                  <button onClick={() => { setSelectedPttypes([]); setShowPttypePicker(false); }} className="text-xs text-gray-400 dark:text-gray-500">ล้าง</button>
                </div>
                {pttypeOptions
                  .filter((p) => !pttypeSearch || p.label.toLowerCase().includes(pttypeSearch.toLowerCase()))
                  .map((p) => (
                    <label key={p.pttype} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={selectedPttypes.includes(p.pttype)}
                        onChange={() => {
                          setSelectedPttypes((prev) =>
                            prev.includes(p.pttype) ? prev.filter((x) => x !== p.pttype) : [...prev, p.pttype]
                          );
                        }}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      {p.label}
                    </label>
                  ))}
              </div>
            )}
          </div>

          {/* Limit */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">จำนวนอันดับ</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option value={10}>10 อันดับ</option>
              <option value={20}>20 อันดับ</option>
              <option value={30}>30 อันดับ</option>
              <option value={50}>50 อันดับ</option>
            </select>
          </div>

          {/* Search button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                กำลังค้นหา...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                ค้นหา
              </span>
            )}
          </button>
        </div>

        {/* Fiscal month pills */}
        {fiscalYear && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => {
                setSelectedMonth(null);
                const range = getFiscalYearRange(fiscalYear as number);
                setStartDate(range.start);
                setEndDate(range.end);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedMonth === null
                  ? "bg-purple-500 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              }`}
            >
              ทั้งปี
            </button>
            {fiscalMonths.map((fm) => {
              const fy = fiscalYear as number;
              return (
                <button
                  key={fm.month}
                  onClick={() => {
                    setSelectedMonth(fm.month);
                    const range = getMonthRange(fy, fm.month);
                    setStartDate(range.start);
                    setEndDate(range.end);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedMonth === fm.month
                      ? "bg-purple-500 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  }`}
                >
                  {`${fm.label}${String(fm.month >= 10 ? fy - 1 : fy).slice(-2)}`}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-4 text-sm flex items-center gap-2 animate-fade-in-up">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Summary cards */}
      {summary && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in-up">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">จำนวนรหัส PDx ทั้งหมด</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{summary.total_pdx_codes?.toLocaleString() || 0}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">รหัสวินิจฉัยหลัก</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">จำนวน AN ทั้งหมด</p>
            <p className="text-2xl font-bold text-blue-600">{summary.total_an?.toLocaleString() || 0}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">ครั้งที่เข้ารักษา</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">จำนวน HN ทั้งหมด</p>
            <p className="text-2xl font-bold text-emerald-600">{summary.total_hn?.toLocaleString() || 0}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">ผู้ป่วยไม่ซ้ำ</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">AdjRW รวม</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{summary.total_adjrw?.toLocaleString() || 0}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">ค่าถ่วงน้ำหนัก</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">CMI</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{summary.total_an ? (summary.total_adjrw / summary.total_an).toFixed(4) : "0"}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Case Mix Index</p>
          </div>
        </div>
      )}

      {/* Main content */}
      {data.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">จัดอันดับโรค {limit} อันดับ</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">จำนวน AN ต่อรหัสวินิจฉัยหลัก (PDx)</p>
              </div>
              <ExportButtons
                data={data.map((d, i) => ({ rank: i + 1, ...d, cmi: d.an_count > 0 ? (d.sum_adjrw / d.an_count).toFixed(4) : "0" }))}
                columns={[
                  { key: "rank", label: "อันดับ" },
                  { key: "pdx", label: "รหัส PDx" },
                  { key: "pdx_name", label: "ชื่อโรค" },
                  { key: "an_count", label: "จำนวน AN" },
                  { key: "hn_count", label: "จำนวน HN" },
                  { key: "sum_adjrw", label: "AdjRW รวม" },
                  { key: "cmi", label: "CMI" },
                ]}
                fileName="IPD_Top_PDx_Ranking"
              />
            </div>

            <div className="space-y-3">
              {data.map((row, i) => {
                const pct = (row.an_count / maxCount) * 100;
                return (
                  <div key={i} className="group">
                    <div className="flex items-center gap-3">
                      {/* Rank badge */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        i < 3
                          ? `bg-gradient-to-br ${MEDAL_COLORS[i]} text-white shadow-sm`
                          : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      }`}>
                        {i + 1}
                      </div>

                      {/* Bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 shrink-0">{row.pdx}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{row.pdx_name || "-"}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              AN: <span className="font-bold text-blue-600">{row.an_count.toLocaleString()}</span>
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              HN: <span className="font-bold text-emerald-600">{row.hn_count.toLocaleString()}</span>
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              AdjRW: <span className="font-bold text-purple-600">{row.sum_adjrw.toLocaleString()}</span>
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              CMI: <span className="font-bold text-orange-500">{row.an_count > 0 ? (row.sum_adjrw / row.an_count).toFixed(4) : "0"}</span>
                            </span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              i === 0 ? "bg-gradient-to-r from-blue-500 to-indigo-500" :
                              i === 1 ? "bg-gradient-to-r from-blue-400 to-cyan-500" :
                              i === 2 ? "bg-gradient-to-r from-sky-400 to-blue-400" :
                              "bg-gradient-to-r from-blue-300 to-blue-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">สัดส่วน AN ตามรหัสโรค</h3>
            {(() => {
              const totalAn = data.reduce((s, r) => s + r.an_count, 0);
              const size = 220;
              const cx = size / 2;
              const cy = size / 2;
              const radius = 85;
              const innerRadius = 50;
              let cumAngle = -90;

              const slices = data.map((row, i) => {
                const pct = totalAn > 0 ? (row.an_count / totalAn) * 100 : 0;
                const angle = (pct / 100) * 360;
                const startAngle = cumAngle;
                cumAngle += angle;
                const endAngle = cumAngle;

                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;

                const x1 = cx + radius * Math.cos(startRad);
                const y1 = cy + radius * Math.sin(startRad);
                const x2 = cx + radius * Math.cos(endRad);
                const y2 = cy + radius * Math.sin(endRad);

                const ix1 = cx + innerRadius * Math.cos(startRad);
                const iy1 = cy + innerRadius * Math.sin(startRad);
                const ix2 = cx + innerRadius * Math.cos(endRad);
                const iy2 = cy + innerRadius * Math.sin(endRad);

                const largeArc = angle > 180 ? 1 : 0;

                const d = [
                  `M ${x1} ${y1}`,
                  `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                  `L ${ix2} ${iy2}`,
                  `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
                  "Z",
                ].join(" ");

                return { d, color: PIE_COLORS[i % PIE_COLORS.length], pct, row, index: i };
              });

              return (
                <div className="flex flex-col items-center">
                  <svg width={size} height={size} className="mb-4">
                    {slices.map((s, i) => (
                      <path
                        key={i}
                        d={s.d}
                        fill={s.color}
                        className="transition-opacity hover:opacity-80 cursor-pointer"
                        stroke="white"
                        strokeWidth={1.5}
                      >
                        <title>{`${s.row.pdx} - ${s.row.pdx_name || "-"}\nAN: ${s.row.an_count.toLocaleString()} (${s.pct.toFixed(1)}%)`}</title>
                      </path>
                    ))}
                    <text x={cx} y={cy - 6} textAnchor="middle" className="fill-gray-800 dark:fill-gray-100 text-lg font-bold">{totalAn.toLocaleString()}</text>
                    <text x={cx} y={cy + 12} textAnchor="middle" className="fill-gray-400 dark:fill-gray-500 text-[10px]">AN ทั้งหมด</text>
                  </svg>

                  {/* Legend */}
                  <div className="w-full space-y-1.5 max-h-[250px] overflow-auto">
                    {data.map((row, i) => {
                      const pct = totalAn > 0 ? (row.an_count / totalAn) * 100 : 0;
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span
                            className="w-3 h-3 rounded-sm shrink-0"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="text-blue-600 dark:text-blue-400 font-semibold shrink-0">{row.pdx}</span>
                          <span className="text-gray-500 dark:text-gray-400 truncate flex-1">{row.pdx_name || "-"}</span>
                          <span className="text-gray-800 dark:text-gray-100 font-bold shrink-0">{row.an_count.toLocaleString()}</span>
                          <span className="text-gray-400 dark:text-gray-500 shrink-0">({pct.toFixed(1)}%)</span>
                          <span className="text-orange-500 font-semibold shrink-0">CMI {row.an_count > 0 ? (row.sum_adjrw / row.an_count).toFixed(4) : "0"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : !loading && !error ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in-up">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-gray-500 dark:text-gray-400 font-semibold mb-1">ยังไม่มีข้อมูล</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm">เลือกช่วงวันที่แล้วกด &quot;ค้นหา&quot; เพื่อดูจัดอันดับโรค</p>
        </div>
      ) : null}
    </>
  );
}
