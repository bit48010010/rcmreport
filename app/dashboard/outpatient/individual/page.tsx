"use client";

import { useState, useCallback, useEffect } from "react";
import ExportButtons from "@/components/ExportButtons";

interface OpdRow {
  hn: string;
  vn: string;
  an: string;
  sex: string;
  age_y: number;
  age_m: number;
  age_d: number;
  age: string;
  hometel: string;
  mobile_phone_number: string;
  informtel: string;
  auth_code: string;
  authen_endpoint: string;
  nationality: string;
  vstdate: string;
  vsttime: string;
  pt_subtype: string;
  ovstist: string;
  referin: string;
  department: string;
  spclty: string;
  bpd: string;
  bps: string;
  bw: string;
  hr: string;
  pulse: string;
  rr: string;
  temperature: string;
  height: string;
  bmi: string;
  waist: string;
  pe: string;
  hpi: string;
  hpi_text: string;
  pmh: string;
  cc: string;
  symptom: string;
  pdx: string;
  sdx: string;
  diag_text: string;
  diag_text_2: string;
  diag_text_detail: string;
  proc_code: string;
  pttype_check: string;
  hipdata_code: string;
  pttype_eclaim: string;
  pttypename: string;
  hospmain: string;
  hospsub: string;
  gf_opd: string;
  ar_opd: string;
  ovst_ca: string;
  referout: string;
  income: number;
  discount_money: number;
  rcpt_money: number;
  rcpno: string;
  bill_date_time: string;
  nee: number;
  ApprovalCode: string;
  terminalid: string;
  kt_amount: number;
  ovstost_name: string;
  rd_id: string;
  rep: string;
  compensated: number;
  percentpay: string;
  SendDate: string;
  Diff: number;
  Down: number;
  Up: number;
  TransactionType: string;
  rep_invoice: string;
  compensated_invoice: number;
  diffinvoice: number;
  downinvoice: number;
  upinvoice: number;
  Bill: string;
  Bill_date: string;
  resource: string;
  fund: string;
  subfund: string;
  remark: string;
  projectcode: string;
  PaidType: string;
  repfilename_invoice: string;
  doctorname: string;
  address: string;
  ovstost: string;
  nhso_ucae_type_code: string;
  nhso_ucae_type_name: string;
  count_in_day: number;
  count_in_month: number;
  count_in_year: number;
  occupation: string;
  CODE_NAME: string;
  REMARKDATA: string;
  repfilename: string;
  stmfilename: string;
  fdh_claim_status_message: string;
  status_eclaim: string;
  fdh_act_amt: number;
  fdh_settle_at: string;
  fdh_stm_period: string;
  fdh_error_code: string;
  fdh_error_desc: string;
  error_eclaim: string;
  fdh_reservation_status: string;
  invoice_number: string;
  confirm_and_locked: string;
  request_funds: string;
}

// Column groups for organized display
const columnGroups = [
  {
    label: "ข้อมูลผู้ป่วย",
    columns: [
      { key: "vn", label: "VN" },
      { key: "hn", label: "HN" },
      { key: "an", label: "AN" },
      { key: "vstdate", label: "วันที่" },
      { key: "vsttime", label: "เวลา" },
      { key: "sex", label: "เพศ" },
      { key: "age", label: "อายุ" },
      { key: "nationality", label: "สัญชาติ" },
      { key: "occupation", label: "อาชีพ" },
      { key: "address", label: "ที่อยู่" },
      { key: "hometel", label: "โทรบ้าน" },
      { key: "mobile_phone_number", label: "มือถือ" },
      { key: "informtel", label: "โทรติดต่อ" },
    ],
  },
  {
    label: "ข้อมูลการตรวจ",
    columns: [
      { key: "pt_subtype", label: "ประเภทผู้ป่วย" },
      { key: "ovstist", label: "สถานะ Visit" },
      { key: "ovstost_name", label: "สถานะจำหน่าย" },
      { key: "ovstost", label: "รหัส Ovstost" },
      { key: "department", label: "แผนก" },
      { key: "spclty", label: "สาขา" },
      { key: "doctorname", label: "แพทย์" },
      { key: "referin", label: "Refer In" },
      { key: "referout", label: "Refer Out" },
      { key: "count_in_day", label: "ครั้ง/วัน", numeric: true },
      { key: "count_in_month", label: "ครั้ง/เดือน", numeric: true },
      { key: "count_in_year", label: "ครั้ง/ปี", numeric: true },
    ],
  },
  {
    label: "สัญญาณชีพ",
    columns: [
      { key: "bps", label: "BPs" },
      { key: "bpd", label: "BPd" },
      { key: "hr", label: "HR" },
      { key: "pulse", label: "Pulse" },
      { key: "rr", label: "RR" },
      { key: "temperature", label: "Temp" },
      { key: "bw", label: "BW" },
      { key: "height", label: "Height" },
      { key: "bmi", label: "BMI" },
      { key: "waist", label: "Waist" },
    ],
  },
  {
    label: "การวินิจฉัย",
    columns: [
      { key: "cc", label: "CC" },
      { key: "symptom", label: "Symptom" },
      { key: "hpi", label: "HPI" },
      { key: "hpi_text", label: "HPI Text" },
      { key: "pe", label: "PE" },
      { key: "pmh", label: "PMH" },
      { key: "pdx", label: "PDx" },
      { key: "sdx", label: "SDx" },
      { key: "diag_text", label: "Diag Text" },
      { key: "diag_text_2", label: "Diag Text 2" },
      { key: "diag_text_detail", label: "Diag Detail" },
      { key: "proc_code", label: "Procedure" },
    ],
  },
  {
    label: "สิทธิ์การรักษา",
    columns: [
      { key: "pttypename", label: "สิทธิ์" },
      { key: "pttype_eclaim", label: "Eclaim Type" },
      { key: "hipdata_code", label: "Hipdata Code" },
      { key: "pttype_check", label: "Pttype Check" },
      { key: "hospmain", label: "หน่วยบริการหลัก" },
      { key: "hospsub", label: "หน่วยบริการรอง" },
      { key: "auth_code", label: "Auth Code" },
      { key: "authen_endpoint", label: "Authen" },
      { key: "nhso_ucae_type_code", label: "UCAE Code" },
      { key: "nhso_ucae_type_name", label: "UCAE Name" },
      { key: "gf_opd", label: "GF OPD" },
      { key: "ar_opd", label: "AR OPD" },
      { key: "ovst_ca", label: "บัญชี" },
      { key: "confirm_and_locked", label: "Confirm Lock" },
      { key: "request_funds", label: "Request Funds" },
    ],
  },
  {
    label: "การเงิน",
    columns: [
      { key: "income", label: "รายรับ", numeric: true },
      { key: "discount_money", label: "ส่วนลด", numeric: true },
      { key: "rcpt_money", label: "รับชำระ", numeric: true },
      { key: "nee", label: "ค้างชำระ", numeric: true },
      { key: "rcpno", label: "เลขใบเสร็จ" },
      { key: "bill_date_time", label: "วันที่ใบเสร็จ" },
      { key: "ApprovalCode", label: "KTB Approval" },
      { key: "terminalid", label: "Terminal ID" },
      { key: "kt_amount", label: "KTB Amount", numeric: true },
    ],
  },
  {
    label: "REP/Statement",
    columns: [
      { key: "rd_id", label: "RD ID" },
      { key: "rep", label: "REP" },
      { key: "compensated", label: "ชดเชย", numeric: true },
      { key: "percentpay", label: "%Pay" },
      { key: "SendDate", label: "วันที่ส่ง" },
      { key: "Diff", label: "Diff", numeric: true },
      { key: "Down", label: "Down", numeric: true },
      { key: "Up", label: "Up", numeric: true },
      { key: "TransactionType", label: "Transaction" },
      { key: "fund", label: "Fund" },
      { key: "subfund", label: "SubFund" },
      { key: "remark", label: "Remark" },
      { key: "projectcode", label: "Project Code" },
      { key: "stmfilename", label: "STM File" },
      { key: "error_eclaim", label: "Error Code" },
      { key: "CODE_NAME", label: "Validate Name" },
      { key: "REMARKDATA", label: "Validate Remark" },
    ],
  },
  {
    label: "Invoice/Eclaim",
    columns: [
      { key: "status_eclaim", label: "สถานะ Eclaim" },
      { key: "rep_invoice", label: "REP Invoice" },
      { key: "compensated_invoice", label: "ชดเชย Invoice", numeric: true },
      { key: "diffinvoice", label: "Diff Invoice", numeric: true },
      { key: "downinvoice", label: "Down Invoice", numeric: true },
      { key: "upinvoice", label: "Up Invoice", numeric: true },
      { key: "Bill", label: "Bill" },
      { key: "Bill_date", label: "Bill Date" },
      { key: "resource", label: "Resource" },
      { key: "PaidType", label: "Paid Type" },
      { key: "repfilename", label: "REP File" },
      { key: "invoice_number", label: "Invoice No." },
    ],
  },
  {
    label: "FDH",
    columns: [
      { key: "fdh_claim_status_message", label: "FDH Status" },
      { key: "fdh_act_amt", label: "FDH จ่าย", numeric: true },
      { key: "fdh_settle_at", label: "FDH Settle" },
      { key: "fdh_stm_period", label: "FDH STM Period" },
      { key: "fdh_reservation_status", label: "FDH Reservation" },
      { key: "fdh_error_code", label: "FDH Error Code" },
      { key: "fdh_error_desc", label: "FDH Error Desc" },
    ],
  },
];

// Flat list of visible columns (default selection)
const defaultVisibleKeys = [
  "vn", "hn", "vstdate", "vsttime", "sex", "age",
  "pttypename", "pdx", "sdx", "department", "doctorname",
  "income", "rcpt_money", "nee",
  "status_eclaim", "compensated", "fdh_claim_status_message", "fdh_act_amt",
];

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
  // fiscalYear is BE. Oct-Dec belong to previous CE year, Jan-Sep belong to current CE year
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

export default function OutpatientPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState<OpdRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fiscalYear, setFiscalYear] = useState<number | "">("")
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(defaultVisibleKeys);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pttypeOptions, setPttypeOptions] = useState<{ pttype: string; name: string; label: string }[]>([]);
  const [selectedPttypes, setSelectedPttypes] = useState<string[]>([]);
  const [showPttypePicker, setShowPttypePicker] = useState(false);
  const [pttypeSearch, setPttypeSearch] = useState("");

  // Fetch pttype options on mount
  useEffect(() => {
    fetch("/api/pttype")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setPttypeOptions(json.data);
      })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (selectedPttypes.length > 0) params.set("pttype", selectedPttypes.join(","));
      const res = await fetch(`/api/opd?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        const rows = json.data.map((r: OpdRow) => ({
          ...r,
          age: `${r.age_y ?? 0} ปี ${r.age_m ?? 0} เดือน ${r.age_d ?? 0} วัน`,
        }));
        setData(rows);
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

  // Filter rows by search text
  const filteredData = searchText
    ? data.filter((row) => {
        const s = searchText.toLowerCase();
        return (
          (row.hn && row.hn.toLowerCase().includes(s)) ||
          (row.vn && row.vn.toLowerCase().includes(s)) ||
          (row.pdx && row.pdx.toLowerCase().includes(s)) ||
          (row.pttypename && row.pttypename.toLowerCase().includes(s)) ||
          (row.doctorname && row.doctorname.toLowerCase().includes(s))
        );
      })
    : data;

  // Compute summary stats
  const totalIncome = data.reduce((s, r) => s + (Number(r.income) || 0), 0);
  const totalRcpt = data.reduce((s, r) => s + (Number(r.rcpt_money) || 0), 0);
  const totalCompensated = data.reduce((s, r) => s + (Number(r.compensated) || 0), 0);
  const totalFdhAmt = data.reduce((s, r) => s + (Number(r.fdh_act_amt) || 0), 0);

  const formatNum = (n: number) =>
    n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          {/* Fiscal Year Selector */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">ปีงบประมาณ (พ.ศ.)</label>
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
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 min-w-[130px]"
            >
              <option value="">-- เลือก --</option>
              {getFiscalYearOptions().map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">วันที่เริ่มต้น</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setFiscalYear(""); setSelectedMonth(null); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">วันที่สิ้นสุด</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setFiscalYear(""); setSelectedMonth(null); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
            />
          </div>
          <div className="relative">
            <label className="block text-xs text-gray-500 mb-1">สิทธิ์การรักษา</label>
            <button
              onClick={() => setShowPttypePicker(!showPttypePicker)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 min-w-[200px] text-left flex items-center justify-between gap-2"
            >
              <span className="truncate">
                {selectedPttypes.length === 0
                  ? "ทั้งหมด"
                  : `เลือก ${selectedPttypes.length} สิทธิ์`}
              </span>
              <svg className={`w-4 h-4 shrink-0 transition-transform ${showPttypePicker ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showPttypePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-80 max-h-72 flex flex-col">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="ค้นหาสิทธิ์..."
                    value={pttypeSearch}
                    onChange={(e) => setPttypeSearch(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-700"
                  />
                </div>
                <div className="p-2 border-b border-gray-100 flex gap-2">
                  <button onClick={() => setSelectedPttypes(pttypeOptions.map(p => p.pttype))} className="text-[10px] text-blue-500 hover:text-blue-700">เลือกทั้งหมด</button>
                  <button onClick={() => setSelectedPttypes([])} className="text-[10px] text-gray-500 hover:text-gray-700">ล้าง</button>
                </div>
                <div className="overflow-y-auto flex-1 p-1">
                  {pttypeOptions
                    .filter((p) => !pttypeSearch || p.label.toLowerCase().includes(pttypeSearch.toLowerCase()))
                    .map((p) => (
                      <label key={p.pttype} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer text-xs text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedPttypes.includes(p.pttype)}
                          onChange={() =>
                            setSelectedPttypes((prev) =>
                              prev.includes(p.pttype) ? prev.filter((x) => x !== p.pttype) : [...prev, p.pttype]
                            )
                          }
                          className="rounded border-gray-300 text-blue-500 focus:ring-blue-400"
                        />
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
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-1"
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
                placeholder="ค้นหา HN, VN, PDx..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-56 text-gray-700"
              />
            </div>
          )}
        </div>

        {/* Column Picker */}
        {showColumnPicker && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">เลือกคอลัมน์ที่ต้องการแสดง</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setVisibleKeys(allColumns.map((c) => c.key))}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  เลือกทั้งหมด
                </button>
                <button
                  onClick={() => setVisibleKeys(defaultVisibleKeys)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  ค่าเริ่มต้น
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {columnGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">{group.label}</p>
                  <div className="space-y-1">
                    {group.columns.map((col) => (
                      <label key={col.key} className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 hover:text-gray-800">
                        <input
                          type="checkbox"
                          checked={visibleKeys.includes(col.key)}
                          onChange={() => toggleColumn(col.key)}
                          className="rounded border-gray-300 text-blue-500 focus:ring-blue-400"
                        />
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
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-sm font-semibold text-gray-700">เดือนในปีงบประมาณ {fiscalYear}</h4>
              <button
                onClick={() => {
                  setSelectedMonth(null);
                  const range = getFiscalYearRange(fiscalYear as number);
                  setStartDate(range.start);
                  setEndDate(range.end);
                }}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                  selectedMonth === null
                    ? "bg-blue-500 text-white"
                    : "text-blue-500 hover:bg-blue-50"
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
                        ? "bg-blue-500 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
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
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Summary Stats */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">จำนวน Visit</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{total.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">รายรับรวม</p>
            <p className="text-xl font-bold text-blue-600 mt-1">฿{formatNum(totalIncome)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">รับชำระรวม</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">฿{formatNum(totalRcpt)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">ชดเชย REP</p>
            <p className="text-xl font-bold text-purple-600 mt-1">฿{formatNum(totalCompensated)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">FDH จ่าย</p>
            <p className="text-xl font-bold text-amber-600 mt-1">฿{formatNum(totalFdhAmt)}</p>
          </div>
        </div>
      )}

      {/* Comparison Chart - HN (จำนวนคน) vs VN (จำนวนครั้ง) grouped by date */}
      {data.length > 0 && (() => {
        const vnMap: Record<string, number> = {};
        const hnMap: Record<string, Set<string>> = {};
        data.forEach((row) => {
          const d = row.vstdate || "N/A";
          vnMap[d] = (vnMap[d] || 0) + 1;
          if (!hnMap[d]) hnMap[d] = new Set();
          if (row.hn) hnMap[d].add(row.hn);
        });
        const dates = Object.keys(vnMap).sort();
        const chartData = dates.map((date) => ({
          date,
          vn: vnMap[date],
          hn: hnMap[date]?.size || 0,
        }));
        const maxVal = Math.max(...chartData.map((c) => Math.max(c.vn, c.hn)), 1);
        const totalVn = chartData.reduce((s, c) => s + c.vn, 0);
        const totalHnSet = new Set<string>();
        data.forEach((row) => { if (row.hn) totalHnSet.add(row.hn); });
        const totalHn = totalHnSet.size;

        return (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">เปรียบเทียบจำนวนคน (HN) และจำนวนครั้ง (VN) รายวัน</h3>
                <p className="text-xs text-gray-400 mt-1">{startDate} ถึง {endDate}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-blue-500 to-cyan-400" />
                  <span className="text-xs text-gray-600">VN จำนวนครั้ง <span className="font-bold text-blue-600">{totalVn.toLocaleString()}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-emerald-500 to-teal-400" />
                  <span className="text-xs text-gray-600">HN จำนวนคน <span className="font-bold text-emerald-600">{totalHn.toLocaleString()}</span></span>
                </div>
              </div>
            </div>
            <div className="flex items-end gap-1 h-52 overflow-x-auto pb-1">
              {chartData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1" style={{ minWidth: chartData.length > 15 ? 56 : 72, flex: chartData.length <= 15 ? 1 : undefined }}>
                  <div className="w-full flex items-end justify-center gap-0.5">
                    {/* VN bar */}
                    <div className="flex-1 relative group">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        VN: {d.vn.toLocaleString()} ครั้ง
                      </div>
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-cyan-400 transition-all duration-500 hover:from-blue-400 hover:to-cyan-300 cursor-pointer"
                        style={{
                          height: `${(d.vn / maxVal) * 180}px`,
                          animation: `bar-grow 1s ease forwards`,
                          animationDelay: `${i * 0.05}s`,
                        }}
                      />
                    </div>
                    {/* HN bar */}
                    <div className="flex-1 relative group">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        HN: {d.hn.toLocaleString()} คน
                      </div>
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-teal-400 transition-all duration-500 hover:from-emerald-400 hover:to-teal-300 cursor-pointer"
                        style={{
                          height: `${(d.hn / maxVal) * 180}px`,
                          animation: `bar-grow 1s ease forwards`,
                          animationDelay: `${i * 0.05 + 0.02}s`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[9px] text-gray-500 whitespace-nowrap">{d.date}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* PDX Empty Summary - นับรวมจำนวน PDx ที่เป็นค่าว่าง */}
      {data.length > 0 && (() => {
        const totalEmpty = data.filter((r) => !r.pdx || r.pdx.trim() === "").length;
        const totalFilled = data.length - totalEmpty;
        const emptyPct = (totalEmpty / data.length) * 100;
        const filledPct = (totalFilled / data.length) * 100;

        return (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">สรุปรหัส PDx</h3>
                <p className="text-xs text-gray-400 mt-1">{startDate} ถึง {endDate} · ทั้งหมด {data.length.toLocaleString()} รายการ</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* PDx ว่าง */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-rose-400 flex items-center justify-center text-white shrink-0">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-red-600 font-medium">PDx ว่าง</p>
                  <p className="text-3xl font-bold text-red-700">{totalEmpty.toLocaleString()}</p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-red-500">{emptyPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-1000" style={{ width: `${emptyPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
              {/* มี PDx */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 border border-green-100">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center text-white shrink-0">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-green-600 font-medium">มี PDx</p>
                  <p className="text-3xl font-bold text-green-700">{totalFilled.toLocaleString()}</p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-green-500">{filledPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000" style={{ width: `${filledPct}%` }} />
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
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">รายงานผู้ป่วยนอก</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                {searchText ? `${filteredData.length} จาก ` : ""}
                {total.toLocaleString()} รายการ
              </span>
              <ExportButtons data={filteredData} columns={activeColumns} fileName="OPD_Report" />
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="text-xs border-collapse" style={{ width: 'max-content' }}>
              <thead className="sticky top-0 z-5 bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-center py-2.5 px-1.5 text-gray-500 font-medium">#</th>
                  {activeColumns.map((col) => (
                    <th
                      key={col.key}
                      className={`py-2.5 px-1.5 text-gray-500 font-medium whitespace-nowrap ${"numeric" in col && col.numeric ? "text-right" : "text-left"}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, i) => (
                  <tr key={row.vn || i} className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors">
                    <td className="py-1.5 px-1.5 text-center text-gray-400">{i + 1}</td>
                    {activeColumns.map((col) => {
                      const val = row[col.key as keyof OpdRow];
                      const isNumeric = "numeric" in col && col.numeric;
                      return (
                        <td
                          key={col.key}
                          className={`py-1.5 px-1.5 whitespace-nowrap ${isNumeric ? "text-right font-mono" : "text-left"} ${
                            col.key === "vn" ? "text-blue-600 font-mono" :
                            col.key === "hn" ? "text-purple-600 font-mono" :
                            col.key === "pdx" ? "text-red-600 font-mono font-medium" :
                            col.key === "status_eclaim" ? "" :
                            "text-gray-700"
                          }`}
                        >
                          {col.key === "status_eclaim" && val ? (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                              String(val).includes("สำเร็จ") || String(val).includes("Success") ? "bg-emerald-50 text-emerald-600" :
                              String(val).includes("ปฏิเสธ") || String(val).includes("Error") ? "bg-red-50 text-red-600" :
                              "bg-amber-50 text-amber-600"
                            }`}>
                              {String(val)}
                            </span>
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
            <div className="text-center py-8 text-gray-400 text-sm">ไม่พบข้อมูลที่ตรงกับการค้นหา</div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && data.length === 0 && !error && (
        <div className="bg-white rounded-2xl p-16 border border-gray-100 shadow-sm text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-500">เลือกวันที่แล้วกดค้นหา</h3>
          <p className="text-sm text-gray-400 mt-1">ระบบจะดึงข้อมูลผู้ป่วยนอกจากฐานข้อมูล HOS</p>
        </div>
      )}
    </>
  );
}
