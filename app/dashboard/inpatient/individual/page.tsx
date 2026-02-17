"use client";

import { useState, useCallback, useEffect } from "react";
import ExportButtons from "@/components/ExportButtons";

interface IpdRow {
  hn: string;
  an: string;
  sex: string;
  age: string;
  age_y: number;
  age_m: number;
  age_d: number;
  hometel: string;
  mobile_phone_number: string;
  informtel: string;
  nationality: string;
  regdate: string;
  regtime: string;
  dchdate: string;
  dchtime: string;
  admdate: string;
  ipt_type_name: string;
  referin: string;
  ward: string;
  bedno: string;
  spclty: string;
  prediag: string;
  pdx: string;
  sdx: string;
  diag_text_list: string;
  proc_code: string;
  pttype_check: string;
  hipdata_code: string;
  pttype_eclaim_id: string;
  pttype_eclaim_name: string;
  pttype_hos: string;
  pttypename: string;
  hospmain: string;
  hospsub: string;
  gfmis: string;
  ar_code: string;
  pttypeno: string;
  referout: string;
  income: number;
  discount_money: number;
  rcpt_money: number;
  rcpno: string;
  bill_date_time: string;
  claim_debt: number;
  ovstost_name: string;
  dchstts_name: string;
  dchtype_name: string;
  adjrw: number;
  adjrw_repdata: number;
  adjrw2_repdata: number;
  baserated: number;
  grouper_version: string;
  grouper_err: string;
  grouper_warn: string;
  drg: string;
  mdc: string;
  rw: number;
  wtlos: number;
  ot: number;
  bw: number;
  adm_doctor: string;
  dch_doctor: string;
  incharge_doctor: string;
  compensated: number;
  rep: string;
  TransactionType: string;
  percentpay: string;
  SendDate: string;
  Diff: number;
  Down: number;
  Up: number;
  cc: number;
  bb: number;
  rep_invoice: string;
  re_id: string;
  resource: string;
  compensated_invoice: number;
  diffinvoice: number;
  downinvoice: number;
  upinvoice: number;
  fund: string;
  subfund: string;
  remark: string;
  projectcode: string;
  PaidType: string;
  Bill: string;
  Bill_date: string;
  cipn_billtran_id: string;
  cipn_err_code: string;
  cipn_err_desc: string;
  cipn_confirm_doc_no: string;
  pdx_anstat: string;
  data_exp_date: string;
  daycomplete: number;
  coder: string;
  CODE_NAME: string;
  REMARKDATA: string;
  repfilename: string;
  stmfilename: string;
  ipt_diag_text: string;
  diag_datetime: string;
  doctor_diag_text: string;
  fdh_claim_status_message: string;
  status_eclaim: string;
  fdh_error_code: string;
  error_eclaim: string;
  fdh_error_desc: string;
  ipt_summary_status_name: string;
  data_ok: string;
  AuthenCode: string;
}

const columnGroups = [
  {
    label: "ข้อมูลผู้ป่วย",
    columns: [
      { key: "an", label: "AN" },
      { key: "hn", label: "HN" },
      { key: "sex", label: "เพศ" },
      { key: "age", label: "อายุ" },
      { key: "nationality", label: "สัญชาติ" },
      { key: "hometel", label: "เบอร์บ้าน" },
      { key: "mobile_phone_number", label: "เบอร์มือถือ" },
      { key: "informtel", label: "เบอร์ผู้ติดต่อ" },
    ],
  },
  {
    label: "ข้อมูลการรักษา",
    columns: [
      { key: "regdate", label: "วันที่รักษา" },
      { key: "regtime", label: "เวลา" },
      { key: "dchdate", label: "วันที่จำหน่าย" },
      { key: "dchtime", label: "เวลาจำหน่าย" },
      { key: "admdate", label: "วันนอน", numeric: true },
      { key: "ipt_type_name", label: "ประเภทผู้ป่วย" },
      { key: "ward", label: "หอผู้ป่วย" },
      { key: "bedno", label: "เตียง" },
      { key: "spclty", label: "แผนก" },
      { key: "referin", label: "Refer In" },
      { key: "referout", label: "Refer Out" },
      { key: "ovstost_name", label: "สถานะหลังตรวจ" },
      { key: "dchstts_name", label: "วิธีการจำหน่าย" },
      { key: "dchtype_name", label: "สถานะการจำหน่าย" },
    ],
  },
  {
    label: "การวินิจฉัย",
    columns: [
      { key: "prediag", label: "อาการสำคัญ" },
      { key: "pdx", label: "PDx" },
      { key: "sdx", label: "SDx" },
      { key: "diag_text_list", label: "Diag Text" },
      { key: "proc_code", label: "หัตถการ" },
      { key: "ipt_diag_text", label: "IPT Diag Text" },
      { key: "diag_datetime", label: "วันที่ลง Diag" },
      { key: "doctor_diag_text", label: "แพทย์ลง Diag" },
      { key: "pdx_anstat", label: "PDx (an_stat)" },
    ],
  },
  {
    label: "DRG/Grouper",
    columns: [
      { key: "drg", label: "DRG" },
      { key: "mdc", label: "MDC" },
      { key: "adjrw", label: "AdjRW", numeric: true },
      { key: "rw", label: "RW", numeric: true },
      { key: "wtlos", label: "WTLOS", numeric: true },
      { key: "ot", label: "OT", numeric: true },
      { key: "bw", label: "BW", numeric: true },
      { key: "adjrw_repdata", label: "AdjRW REP", numeric: true },
      { key: "adjrw2_repdata", label: "AdjRW2 REP", numeric: true },
      { key: "baserated", label: "Base Rate", numeric: true },
      { key: "grouper_version", label: "Grouper Ver" },
      { key: "grouper_err", label: "Grouper Err" },
      { key: "grouper_warn", label: "Grouper Warn" },
    ],
  },
  {
    label: "สิทธิ์การรักษา",
    columns: [
      { key: "pttype_hos", label: "รหัสสิทธิ์ HOSxP" },
      { key: "pttypename", label: "ชื่อสิทธิ์ HOSxP" },
      { key: "pttype_eclaim_id", label: "รหัสสิทธิ์การเงิน" },
      { key: "pttype_eclaim_name", label: "ชื่อสิทธิ์การเงิน" },
      { key: "hipdata_code", label: "Hipdata" },
      { key: "pttype_check", label: "สถานะตรวจสอบสิทธิ์" },
      { key: "hospmain", label: "สถานบริการหลัก" },
      { key: "hospsub", label: "สถานบริการรอง" },
      { key: "gfmis", label: "GFMIS" },
      { key: "ar_code", label: "รหัสผังบัญชี" },
      { key: "pttypeno", label: "เลขที่สิทธิ์" },
      { key: "AuthenCode", label: "Authen Code" },
    ],
  },
  {
    label: "การเงิน",
    columns: [
      { key: "income", label: "ค่าใช้จ่าย", numeric: true },
      { key: "discount_money", label: "ส่วนลด", numeric: true },
      { key: "rcpt_money", label: "ชำระเงิน", numeric: true },
      { key: "claim_debt", label: "ลูกหนี้เคลม", numeric: true },
      { key: "rcpno", label: "เลขที่ใบเสร็จ" },
      { key: "bill_date_time", label: "วันที่ออกใบเสร็จ" },
    ],
  },
  {
    label: "แพทย์",
    columns: [
      { key: "adm_doctor", label: "แพทย์ Admit" },
      { key: "dch_doctor", label: "แพทย์จำหน่าย" },
      { key: "incharge_doctor", label: "แพทย์เจ้าของไข้" },
      { key: "coder", label: "ผู้ลงรหัส" },
    ],
  },
  {
    label: "REP/Statement",
    columns: [
      { key: "rep", label: "REP" },
      { key: "compensated", label: "ชดเชย", numeric: true },
      { key: "percentpay", label: "%Pay" },
      { key: "SendDate", label: "วันที่ส่ง" },
      { key: "cc", label: "วัน D/C-ส่ง", numeric: true },
      { key: "bb", label: "วัน D/C-Diag", numeric: true },
      { key: "Diff", label: "Diff", numeric: true },
      { key: "Down", label: "Down", numeric: true },
      { key: "Up", label: "Up", numeric: true },
      { key: "TransactionType", label: "Transaction" },
      { key: "fund", label: "กองทุนใหญ่" },
      { key: "subfund", label: "กองทุนย่อย" },
      { key: "remark", label: "Remark" },
      { key: "projectcode", label: "Project Code" },
      { key: "stmfilename", label: "STM File" },
      { key: "error_eclaim", label: "Error Code Eclaim" },
      { key: "CODE_NAME", label: "Validate Name" },
      { key: "REMARKDATA", label: "Validate Remark" },
    ],
  },
  {
    label: "Invoice/Eclaim",
    columns: [
      { key: "status_eclaim", label: "REP No." },
      { key: "rep_invoice", label: "REP Invoice" },
      { key: "compensated_invoice", label: "ชดเชย Invoice", numeric: true },
      { key: "diffinvoice", label: "Diff Invoice", numeric: true },
      { key: "downinvoice", label: "Down Invoice", numeric: true },
      { key: "upinvoice", label: "Up Invoice", numeric: true },
      { key: "PaidType", label: "Paid Type" },
      { key: "Bill", label: "Bill" },
      { key: "Bill_date", label: "Bill Date" },
      { key: "resource", label: "Resource" },
      { key: "repfilename", label: "REP File" },
    ],
  },
  {
    label: "CIPN",
    columns: [
      { key: "cipn_billtran_id", label: "CIPN Bill ID" },
      { key: "cipn_err_code", label: "CIPN Err Code" },
      { key: "cipn_err_desc", label: "CIPN Err Desc" },
      { key: "cipn_confirm_doc_no", label: "CIPN Confirm" },
    ],
  },
  {
    label: "FDH/สถานะ",
    columns: [
      { key: "fdh_claim_status_message", label: "สถานะเคลม FDH" },
      { key: "fdh_error_code", label: "FDH Error Code" },
      { key: "fdh_error_desc", label: "FDH Error Desc" },
      { key: "ipt_summary_status_name", label: "สถานะจอง Claim" },
      { key: "data_ok", label: "ข้อมูลพร้อมส่ง Claim" },
      { key: "data_exp_date", label: "วันหมดอายุข้อมูล" },
      { key: "daycomplete", label: "วัน D/C-Expire", numeric: true },
    ],
  },
];

const defaultVisibleKeys = [
  "an", "hn", "regdate", "dchdate", "admdate", "sex", "age",
  "ward", "pttypename", "pdx", "sdx", "drg", "adjrw",
  "income", "rcpt_money", "claim_debt",
  "compensated", "status_eclaim", "fdh_claim_status_message",
];

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

export default function InpatientIndividualPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState<IpdRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fiscalYear, setFiscalYear] = useState<number | "">("");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(defaultVisibleKeys);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
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
      const res = await fetch(`/api/ipd?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data || []);
        setTotal(json.total);
      } else {
        setError(json.message || "ไม่สามารถดึงข้อมูลได้");
        setData([]);
        setTotal(0);
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedPttypes]);

  const toggleColumn = (key: string) => {
    setVisibleKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const allColumns = columnGroups.flatMap((g) => g.columns);
  const activeColumns = allColumns.filter((c) => visibleKeys.includes(c.key));

  const filteredData = (() => {
    let result = data;
    // Global search
    if (searchText) {
      const s = searchText.toLowerCase();
      result = result.filter((row) =>
        (row.hn && row.hn.toLowerCase().includes(s)) ||
        (row.an && row.an.toLowerCase().includes(s)) ||
        (row.pdx && row.pdx.toLowerCase().includes(s)) ||
        (row.pttypename && row.pttypename.toLowerCase().includes(s)) ||
        (row.ward && row.ward.toLowerCase().includes(s)) ||
        (row.drg && row.drg.toLowerCase().includes(s))
      );
    }
    // Column filters
    for (const [key, val] of Object.entries(columnFilters)) {
      if (!val) continue;
      const s = val.toLowerCase();
      result = result.filter((row) => {
        const cellVal = row[key as keyof IpdRow];
        return cellVal != null && String(cellVal).toLowerCase().includes(s);
      });
    }
    // Sort
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const va = a[sortKey as keyof IpdRow];
        const vb = b[sortKey as keyof IpdRow];
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

  const totalIncome = data.reduce((s, r) => s + (Number(r.income) || 0), 0);
  const totalRcpt = data.reduce((s, r) => s + (Number(r.rcpt_money) || 0), 0);
  const totalCompensated = data.filter((r) => r.rep != null && String(r.rep).trim() !== "").length;
  const totalAdjrw = data.reduce((s, r) => s + (Number(r.adjrw) || 0), 0);
  const totalUniqueHn = new Set(data.filter((r) => r.hn).map((r) => r.hn)).size;

  const formatNum = (n: number) =>
    n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">ปีงบประมาณ (พ.ศ.)</label>
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
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-gray-200 dark:bg-gray-700 min-w-[130px]"
            >
              <option value="">-- เลือก --</option>
              {getFiscalYearOptions().map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">วันที่จำหน่ายเริ่มต้น</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setFiscalYear(""); setSelectedMonth(null); }}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-gray-200 dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">วันที่จำหน่ายสิ้นสุด</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setFiscalYear(""); setSelectedMonth(null); }}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-gray-200 dark:bg-gray-700"
            />
          </div>
          <div className="relative">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">สิทธิ์การรักษา</label>
            <button
              onClick={() => setShowPttypePicker(!showPttypePicker)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-gray-200 dark:bg-gray-700 min-w-[200px] text-left flex items-center justify-between gap-2"
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
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 text-gray-700 dark:text-gray-200 dark:bg-gray-700" />
                </div>
                <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex gap-2">
                  <button onClick={() => setSelectedPttypes(pttypeOptions.map(p => p.pttype))} className="text-[10px] text-purple-500 hover:text-purple-700">เลือกทั้งหมด</button>
                  <button onClick={() => setSelectedPttypes([])} className="text-[10px] text-gray-500 dark:text-gray-400 hover:text-gray-700">ล้าง</button>
                </div>
                <div className="overflow-y-auto flex-1 p-1">
                  {pttypeOptions.filter((p) => !pttypeSearch || p.label.toLowerCase().includes(pttypeSearch.toLowerCase())).map((p) => (
                    <label key={p.pttype} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                      <input type="checkbox" checked={selectedPttypes.includes(p.pttype)}
                        onChange={() => setSelectedPttypes((prev) => prev.includes(p.pttype) ? prev.filter((x) => x !== p.pttype) : [...prev, p.pttype])}
                        className="rounded border-gray-300 text-purple-500 focus:ring-purple-400" />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                กำลังค้นหา...
              </span>
            ) : (
              "ค้นหา"
            )}
          </button>
          <button
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            เลือกคอลัมน์
          </button>
          {data.length > 0 && (
            <div className="ml-auto">
              <input
                type="text"
                placeholder="ค้นหา HN, AN, PDx, DRG..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 w-56 text-gray-700 dark:text-gray-200 dark:bg-gray-700"
              />
            </div>
          )}
        </div>

        {/* Column Picker */}
        {showColumnPicker && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">เลือกคอลัมน์ที่ต้องการแสดง</h4>
              <div className="flex gap-2">
                <button onClick={() => setVisibleKeys(allColumns.map((c) => c.key))} className="text-xs text-purple-500 hover:text-purple-700">เลือกทั้งหมด</button>
                <button onClick={() => setVisibleKeys(defaultVisibleKeys)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700">ค่าเริ่มต้น</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {columnGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">{group.label}</p>
                  <div className="space-y-1">
                    {group.columns.map((col) => (
                      <label key={col.key} className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-300 hover:text-gray-800">
                        <input type="checkbox" checked={visibleKeys.includes(col.key)} onChange={() => toggleColumn(col.key)}
                          className="rounded border-gray-300 text-purple-500 focus:ring-purple-400" />
                        {col.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fiscal Year Month Buttons */}
        {fiscalYear && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">เดือนในปีงบประมาณ {fiscalYear}</h4>
              <button
                onClick={() => {
                  setSelectedMonth(null);
                  const range = getFiscalYearRange(fiscalYear as number);
                  setStartDate(range.start);
                  setEndDate(range.end);
                }}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                  selectedMonth === null ? "bg-purple-500 text-white" : "text-purple-500 hover:bg-purple-50"
                }`}
              >
                ทั้งปี
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {fiscalMonths.map((fm) => {
                const isActive = selectedMonth === fm.month;
                return (
                  <button
                    key={fm.month}
                    onClick={() => {
                      setSelectedMonth(fm.month);
                      const range = getMonthRange(fiscalYear as number, fm.month);
                      setStartDate(range.start);
                      setEndDate(range.end);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-purple-500 text-white shadow-sm"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600"
                    }`}
                  >
                    {fm.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>
      )}

      {/* Summary Stats */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">จำนวนคน (HN)</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{totalUniqueHn.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">จำนวน Admit (AN)</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{total.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">จำนวน REP</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">{totalCompensated.toLocaleString()} รายการ</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">AdjRW รวม</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">{formatNum(totalAdjrw)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">CMI รวม</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">{total > 0 ? (totalAdjrw / total).toFixed(4) : "0"}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">ค่ารักษารวม</p>
            <p className="text-xl font-bold text-purple-600 mt-1">฿{formatNum(totalIncome)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">ชำระเงินรวม</p>
            <p className="text-xl font-bold text-amber-500 mt-1">฿{formatNum(totalRcpt)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">ลูกหนี้</p>
            <p className="text-xl font-bold text-red-600 mt-1">฿{formatNum(Math.abs(totalIncome - totalRcpt))}</p>
          </div>
        </div>
      )}

      {/* Comparison Chart - AN vs HN by dchdate */}
      {data.length > 0 && (() => {
        const anMap: Record<string, number> = {};
        const hnMap: Record<string, Set<string>> = {};
        data.forEach((row) => {
          const d = row.dchdate || "N/A";
          anMap[d] = (anMap[d] || 0) + 1;
          if (!hnMap[d]) hnMap[d] = new Set();
          if (row.hn) hnMap[d].add(row.hn);
        });
        const dates = Object.keys(anMap).sort();
        const chartData = dates.map((date) => ({
          date,
          an: anMap[date],
          hn: hnMap[date]?.size || 0,
        }));
        const maxVal = Math.max(...chartData.map((c) => Math.max(c.an, c.hn)), 1);
        const totalAn = chartData.reduce((s, c) => s + c.an, 0);
        const totalHnSet = new Set<string>();
        data.forEach((row) => { if (row.hn) totalHnSet.add(row.hn); });
        const totalHn = totalHnSet.size;

        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">เปรียบเทียบจำนวนคน (HN) และจำนวน Admit (AN) รายวัน</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{startDate} ถึง {endDate}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-blue-600 to-sky-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-300">AN จำนวน Admit <span className="font-bold text-blue-600">{totalAn.toLocaleString()}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-emerald-500 to-teal-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-300">HN จำนวนคน <span className="font-bold text-emerald-600">{totalHn.toLocaleString()}</span></span>
                </div>
              </div>
            </div>
            <div className="flex items-end gap-1 h-52 overflow-x-auto pb-1">
              {chartData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1" style={{ minWidth: chartData.length > 15 ? 56 : 72, flex: chartData.length <= 15 ? 1 : undefined }}>
                  <div className="w-full flex items-end justify-center gap-0.5">
                    <div className="flex-1 relative group">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        AN: {d.an.toLocaleString()} ราย
                      </div>
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-sky-400 transition-all duration-500 hover:from-blue-500 hover:to-sky-300 cursor-pointer"
                        style={{ height: `${(d.an / maxVal) * 180}px`, animation: `bar-grow 1s ease forwards`, animationDelay: `${i * 0.05}s` }}
                      />
                    </div>
                    <div className="flex-1 relative group">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        HN: {d.hn.toLocaleString()} คน
                      </div>
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-teal-400 transition-all duration-500 hover:from-emerald-400 hover:to-teal-300 cursor-pointer"
                        style={{ height: `${(d.hn / maxVal) * 180}px`, animation: `bar-grow 1s ease forwards`, animationDelay: `${i * 0.05 + 0.02}s` }}
                      />
                    </div>
                  </div>
                  <span className="text-[9px] text-gray-500 dark:text-gray-400 whitespace-nowrap" style={{ writingMode: "vertical-rl" }}>{d.date.split("T")[0]}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Claim Summary */}
      {data.length > 0 && (() => {
        const totalClaimed = data.filter((r) => r.rep != null && String(r.rep).trim() !== "").length;
        const totalNotClaimed = data.length - totalClaimed;
        const claimedPct = (totalClaimed / data.length) * 100;
        const notClaimedPct = (totalNotClaimed / data.length) * 100;

        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">สรุปการเคลม</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{startDate} ถึง {endDate} · ทั้งหมด {data.length.toLocaleString()} รายการ</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 border border-green-100">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center text-white shrink-0">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-green-600 font-medium">เคลมแล้ว</p>
                  <p className="text-3xl font-bold text-green-700">{totalClaimed.toLocaleString()}</p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-green-500">{claimedPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000" style={{ width: `${claimedPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-100">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-rose-400 flex items-center justify-center text-white shrink-0">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-red-600 font-medium">ยังไม่เคลม</p>
                  <p className="text-3xl font-bold text-red-700">{totalNotClaimed.toLocaleString()}</p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-red-500">{notClaimedPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-1000" style={{ width: `${notClaimedPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Data Table */}
      {data.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">รายงานผู้ป่วยใน</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {searchText ? `${filteredData.length} จาก ` : ""}
                {total.toLocaleString()} รายการ
              </span>
              <ExportButtons data={filteredData} columns={activeColumns} fileName="IPD_Report" />
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="text-xs border-collapse" style={{ width: "max-content" }}>
              <thead className="sticky top-0 z-5 bg-gray-50 dark:bg-gray-700">
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  <th className="text-center py-2.5 px-1.5 text-gray-800 dark:text-gray-100 font-bold">#</th>
                  {activeColumns.map((col) => {
                    const isSorted = sortKey === col.key;
                    return (
                      <th
                        key={col.key}
                        className={`py-1 px-1.5 text-gray-800 dark:text-gray-100 font-bold whitespace-nowrap ${"numeric" in col && col.numeric ? "text-right" : "text-left"}`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => {
                              if (sortKey === col.key) {
                                setSortDir(sortDir === "asc" ? "desc" : "asc");
                              } else {
                                setSortKey(col.key);
                                setSortDir("asc");
                              }
                            }}
                            className="flex items-center gap-1 hover:text-blue-600 transition-colors text-left"
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
                            className="w-full min-w-[50px] border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5 text-[10px] text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white dark:bg-gray-700"
                          />
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, i) => (
                  <tr key={row.an || i} className="border-b border-gray-50 dark:border-gray-700 hover:bg-purple-50/50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-1.5 px-1.5 text-center text-gray-400 dark:text-gray-500">{i + 1}</td>
                    {activeColumns.map((col) => {
                      const val = row[col.key as keyof IpdRow];
                      const isNumeric = "numeric" in col && col.numeric;
                      return (
                        <td
                          key={col.key}
                          className={`py-1.5 px-1.5 whitespace-nowrap ${isNumeric ? "text-right font-mono" : "text-left"} ${
                            col.key === "an" ? "text-blue-600 font-mono" :
                            col.key === "hn" ? "text-emerald-600 font-mono" :
                            col.key === "pdx" ? "text-gray-800 dark:text-gray-100 font-mono font-medium" :
                            col.key === "drg" ? "text-indigo-600 font-mono" :
                            col.key === "claim_debt" ? "text-red-600 font-mono" :
                            col.key === "status_eclaim" ? "" :
                            "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {col.key === "age" ? (
                            `${row.age_y ?? 0} ปี ${row.age_m ?? 0} เดือน ${row.age_d ?? 0} วัน`
                          ) : (col.key === "regdate" || col.key === "dchdate") && val ? (
                            String(val).split("T")[0]
                          ) : col.key === "status_eclaim" ? (
                            row.rep != null && String(row.rep).trim() !== "" ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
                                {String(row.rep)}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-50 dark:bg-red-900/30 text-red-500">
                                ยังไม่เคลม
                              </span>
                            )
                          ) : col.key === "admdate" && val != null ? (
                            Math.round(Number(val)).toLocaleString("th-TH")
                          ) : isNumeric && val != null ? (
                            Number(val).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          ) : (
                            val != null ? String(val) : ""
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredData.length === 0 && data.length > 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">ไม่พบข้อมูลที่ตรงกับการค้นหา</div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && data.length === 0 && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-16 border border-gray-100 dark:border-gray-700 shadow-sm text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">เลือกวันที่จำหน่ายแล้วกดค้นหา</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">ระบบจะดึงข้อมูลผู้ป่วยในจากฐานข้อมูล HOS</p>
        </div>
      )}
    </>
  );
}
