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

function getFiscalYearRange(fiscalYear: number) {
  const startCE = fiscalYear - 543 - 1;
  return {
    start: `${startCE}-10-01`,
    end: `${startCE + 1}-09-30`,
  };
}

interface MonthSummary {
  month: number;
  label: string;
  hn: number;
  vn: number;
  income: number;
  rcpt_money: number;
  balance: number;
  compensated: number;
  fdh_act_amt: number;
}

export default function OutpatientSummaryPage() {
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
        const res = await fetch(`/api/opd?${params.toString()}`);
        const json = await res.json();

        if (json.success) {
          const rows = json.data || [];
          const hnSet = new Set<string>();
          let income = 0, rcpt = 0, comp = 0, fdh = 0;
          rows.forEach((r: Record<string, unknown>) => {
            if (r.hn) hnSet.add(String(r.hn));
            income += Number(r.income) || 0;
            rcpt += Number(r.rcpt_money) || 0;
            comp += Number(r.compensated) || 0;
            fdh += Number(r.fdh_act_amt) || 0;
          });

          const entry: MonthSummary = {
            month: fm.month,
            label: fm.label,
            hn: hnSet.size,
            vn: rows.length,
            income,
            rcpt_money: rcpt,
            balance: income - rcpt,
            compensated: comp,
            fdh_act_amt: fdh,
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

      // Sort results by fiscal month order
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

  // Totals
  const totalVn = monthData.reduce((s, r) => s + r.vn, 0);
  const totalHn = (() => { /* approximate from per-month unique — show sum */ return monthData.reduce((s, r) => s + r.hn, 0); })();
  const totalIncome = monthData.reduce((s, r) => s + r.income, 0);
  const totalRcpt = monthData.reduce((s, r) => s + r.rcpt_money, 0);
  const totalBalance = totalIncome - totalRcpt;
  const totalComp = monthData.reduce((s, r) => s + r.compensated, 0);
  const totalFdh = monthData.reduce((s, r) => s + r.fdh_act_amt, 0);

  const maxVn = Math.max(...monthData.map((d) => d.vn), 1);
  const maxHn = Math.max(...monthData.map((d) => d.hn), 1);
  const maxBar = Math.max(maxVn, maxHn, 1);

  const tableColumns = [
    { key: "label", label: "เดือน" },
    { key: "vn", label: "จำนวนครั้ง (VN)" },
    { key: "hn", label: "จำนวนคน (HN)" },
    { key: "income", label: "ค่ารักษา" },
    { key: "rcpt_money", label: "ชำระเงินสด" },
    { key: "balance", label: "คงเหลือ" },
    { key: "compensated", label: "ชดเชย REP" },
    { key: "fdh_act_amt", label: "FDH จ่าย" },
  ];

  return (
    <>
      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">ปีงบประมาณ (พ.ศ.)</label>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 min-w-[130px]"
            >
              {getFiscalYearOptions().map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <label className="block text-xs text-gray-500 mb-1">สิทธิ์การรักษา</label>
            <button
              onClick={() => setShowPttypePicker(!showPttypePicker)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 min-w-[200px] text-left flex items-center justify-between gap-2"
            >
              <span className="truncate">
                {selectedPttypes.length === 0 ? "ทั้งหมด" : `เลือก ${selectedPttypes.length} สิทธิ์`}
              </span>
              <svg className={`w-4 h-4 shrink-0 transition-transform ${showPttypePicker ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showPttypePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-80 max-h-72 flex flex-col">
                <div className="p-2 border-b border-gray-100">
                  <input type="text" placeholder="ค้นหาสิทธิ์..." value={pttypeSearch} onChange={(e) => setPttypeSearch(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-700" />
                </div>
                <div className="p-2 border-b border-gray-100 flex gap-2">
                  <button onClick={() => setSelectedPttypes(pttypeOptions.map(p => p.pttype))} className="text-[10px] text-blue-500 hover:text-blue-700">เลือกทั้งหมด</button>
                  <button onClick={() => setSelectedPttypes([])} className="text-[10px] text-gray-500 hover:text-gray-700">ล้าง</button>
                </div>
                <div className="overflow-y-auto flex-1 p-1">
                  {pttypeOptions.filter((p) => !pttypeSearch || p.label.toLowerCase().includes(pttypeSearch.toLowerCase())).map((p) => (
                    <label key={p.pttype} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer text-xs text-gray-700">
                      <input type="checkbox" checked={selectedPttypes.includes(p.pttype)}
                        onChange={() => setSelectedPttypes((prev) => prev.includes(p.pttype) ? prev.filter((x) => x !== p.pttype) : [...prev, p.pttype])}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-400" />
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
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>
      )}

      {/* Summary Stats */}
      {monthData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">จำนวนครั้ง (VN)</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{totalVn.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">จำนวนคน (HN)</p>
            <p className="text-2xl font-bold text-cyan-600 mt-1">{totalHn.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">ค่ารักษา</p>
            <p className="text-xl font-bold text-blue-600 mt-1">฿{formatNum(totalIncome)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">ชำระเงินสด</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">฿{formatNum(totalRcpt)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">คงเหลือ</p>
            <p className="text-xl font-bold text-red-600 mt-1">฿{formatNum(Math.abs(totalBalance))}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">ชดเชย REP</p>
            <p className="text-xl font-bold text-purple-600 mt-1">฿{formatNum(totalComp)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">FDH จ่าย</p>
            <p className="text-xl font-bold text-amber-600 mt-1">฿{formatNum(totalFdh)}</p>
          </div>
        </div>
      )}

      {/* Comparison Chart */}
      {monthData.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">เปรียบเทียบจำนวนคน (HN) และจำนวนครั้ง (VN) รายเดือน</h3>
              <p className="text-xs text-gray-400 mt-1">ปีงบประมาณ {fiscalYear} (ต.ค. {fiscalYear - 1} — ก.ย. {fiscalYear})</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-blue-500 to-cyan-400" />
                <span className="text-xs text-gray-600">VN {totalVn.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-emerald-500 to-teal-400" />
                <span className="text-xs text-gray-600">HN {totalHn.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-end gap-2 h-56">
            {monthData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-0.5 h-48">
                  {/* VN bar */}
                  <div className="flex-1 relative group">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      VN: {d.vn.toLocaleString()} ครั้ง
                    </div>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-cyan-400 transition-all duration-500 hover:from-blue-400 hover:to-cyan-300 cursor-pointer"
                      style={{ height: `${(d.vn / maxBar) * 180}px`, animation: `bar-grow 1s ease forwards`, animationDelay: `${i * 0.05}s` }}
                    />
                  </div>
                  {/* HN bar */}
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
                <span className="text-[10px] text-gray-500">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Table */}
      {monthData.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">สรุปรายเดือน ปีงบประมาณ {fiscalYear}</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{monthData.length} เดือน</span>
              <ExportButtons data={monthData} columns={tableColumns} fileName={`OPD_Summary_${fiscalYear}`} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">เดือน</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">จำนวนครั้ง (VN)</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">จำนวนคน (HN)</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">ค่ารักษา</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">ชำระเงินสด</th>
                  <th className="text-right py-3 px-3 text-red-500 font-medium">คงเหลือ</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">ชดเชย REP</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">FDH จ่าย</th>
                  <th className="text-center py-3 px-3 text-gray-500 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {monthData.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 text-gray-800 font-medium">{row.label}</td>
                    <td className="py-3 px-3 text-right font-mono text-blue-600">{row.vn.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600">{row.hn.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-mono text-gray-700">฿{formatNum(row.income)}</td>
                    <td className="py-3 px-3 text-right font-mono text-gray-700">฿{formatNum(row.rcpt_money)}</td>
                    <td className="py-3 px-3 text-right font-mono text-red-600">฿{formatNum(Math.abs(row.income - row.rcpt_money))}</td>
                    <td className="py-3 px-3 text-right font-mono text-purple-600">฿{formatNum(row.compensated)}</td>
                    <td className="py-3 px-3 text-right font-mono text-amber-600">฿{formatNum(row.fdh_act_amt)}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => fetchMonthData(fiscalYear, i)}
                        disabled={loadingMonth === row.month}
                        className="text-[10px] px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        {loadingMonth === row.month ? "..." : "รีเฟรช"}
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                  <td className="py-3 px-3 text-gray-800">รวม</td>
                  <td className="py-3 px-3 text-right font-mono text-blue-700">{totalVn.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-700">{totalHn.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono text-gray-800">฿{formatNum(totalIncome)}</td>
                  <td className="py-3 px-3 text-right font-mono text-gray-800">฿{formatNum(totalRcpt)}</td>
                  <td className="py-3 px-3 text-right font-mono text-red-700">฿{formatNum(Math.abs(totalBalance))}</td>
                  <td className="py-3 px-3 text-right font-mono text-purple-700">฿{formatNum(totalComp)}</td>
                  <td className="py-3 px-3 text-right font-mono text-amber-700">฿{formatNum(totalFdh)}</td>
                  <td className="py-3 px-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && monthData.length === 0 && !error && (
        <div className="bg-white rounded-2xl p-16 border border-gray-100 shadow-sm text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-500">เลือกปีงบประมาณแล้วกดดึงข้อมูล</h3>
          <p className="text-sm text-gray-400 mt-1">ระบบจะดึงข้อมูลสรุปรายเดือน ต.ค. — ก.ย.</p>
        </div>
      )}
    </>
  );
}
