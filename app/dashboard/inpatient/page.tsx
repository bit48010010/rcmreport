"use client";

import ExportButtons from "@/components/ExportButtons";

// === Mock Data: ผู้ป่วยใน (Inpatient) ===
const monthlyIPD = [
  { month: "ม.ค.", value: 320 },
  { month: "ก.พ.", value: 345 },
  { month: "มี.ค.", value: 290 },
  { month: "เม.ย.", value: 380 },
  { month: "พ.ค.", value: 350 },
  { month: "มิ.ย.", value: 410 },
  { month: "ก.ค.", value: 395 },
  { month: "ส.ค.", value: 430 },
  { month: "ก.ย.", value: 370 },
  { month: "ต.ค.", value: 400 },
  { month: "พ.ย.", value: 450 },
  { month: "ธ.ค.", value: 480 },
];

const ipdData = [
  { an: "AN650001", hn: "HN001234", name: "สมชาย ใจดี", admitDate: "10/06/2569", dchDate: "15/06/2569", ward: "อายุรกรรมชาย", drg: "DRG 0391", adjrw: "1.2500", charge: "฿45,200", right: "UC", status: "ส่งเรียบร้อย" },
  { an: "AN650002", hn: "HN002345", name: "สมหญิง รักดี", admitDate: "08/06/2569", dchDate: "14/06/2569", ward: "ศัลยกรรมหญิง", drg: "DRG 0540", adjrw: "2.3400", charge: "฿78,500", right: "ประกันสังคม", status: "รอตรวจสอบ" },
  { an: "AN650003", hn: "HN003456", name: "วิชัย สุขสันต์", admitDate: "11/06/2569", dchDate: "13/06/2569", ward: "กุมารเวช", drg: "DRG 1501", adjrw: "0.8900", charge: "฿23,100", right: "UC", status: "ส่งเรียบร้อย" },
  { an: "AN650004", hn: "HN004567", name: "อรุณ แสงทอง", admitDate: "05/06/2569", dchDate: "12/06/2569", ward: "อายุรกรรมหญิง", drg: "DRG 0100", adjrw: "3.5600", charge: "฿125,800", right: "ข้าราชการ", status: "ส่งเรียบร้อย" },
  { an: "AN650005", hn: "HN005678", name: "นภา ฟ้าใส", admitDate: "09/06/2569", dchDate: "11/06/2569", ward: "สูตินรีเวช", drg: "DRG 0300", adjrw: "1.7800", charge: "฿56,700", right: "UC", status: "ปฏิเสธ" },
  { an: "AN650006", hn: "HN006789", name: "ประสิทธิ์ พัฒนา", admitDate: "07/06/2569", dchDate: "10/06/2569", ward: "ออร์โธปิดิกส์", drg: "DRG 0491", adjrw: "4.1200", charge: "฿189,300", right: "UC", status: "ส่งเรียบร้อย" },
  { an: "AN650007", hn: "HN007890", name: "มานี จันทร์ศรี", admitDate: "12/06/2569", dchDate: "14/06/2569", ward: "สูตินรีเวช", drg: "DRG 0540", adjrw: "1.0000", charge: "฿32,400", right: "ประกันสังคม", status: "รอตรวจสอบ" },
  { an: "AN650008", hn: "HN008901", name: "สุวิทย์ เก่งดี", admitDate: "06/06/2569", dchDate: "13/06/2569", ward: "ICU", drg: "DRG 0100", adjrw: "5.8900", charge: "฿245,600", right: "ข้าราชการ", status: "ส่งเรียบร้อย" },
  { an: "AN650009", hn: "HN009012", name: "รัตนา ดีงาม", admitDate: "10/06/2569", dchDate: "12/06/2569", ward: "อายุรกรรมหญิง", drg: "DRG 0391", adjrw: "0.9500", charge: "฿28,900", right: "UC", status: "ส่งเรียบร้อย" },
  { an: "AN650010", hn: "HN010123", name: "ธนากร วงษ์สุข", admitDate: "11/06/2569", dchDate: "15/06/2569", ward: "ศัลยกรรมชาย", drg: "DRG 0300", adjrw: "2.6700", charge: "฿98,500", right: "ประกันสังคม", status: "ส่งเรียบร้อย" },
];

export default function InpatientPage() {
  const maxBar = Math.max(...monthlyIPD.map((d) => d.value));
  const totalAdmissions = monthlyIPD.reduce((sum, d) => sum + d.value, 0);

  return (
    <>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Admit ทั้งหมด</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totalAdmissions.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">ส่งเรียบร้อย</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">3,845</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">รอตรวจสอบ</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">520</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">ค่า AdjRW เฉลี่ย</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">2.4500</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">จำนวน Admit รายเดือน</h3>
            <p className="text-xs text-gray-400 mt-1">ข้อมูลปี 2569</p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-purple-50 text-purple-600 text-xs font-medium">IPD Admit</span>
        </div>
        <div className="flex items-end gap-2 h-52">
          {monthlyIPD.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full relative group">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {d.value.toLocaleString()} ราย
                </div>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-purple-500 to-pink-400 transition-all duration-500 hover:from-purple-400 hover:to-pink-300 cursor-pointer"
                  style={{
                    height: `${(d.value / maxBar) * 180}px`,
                    animation: `bar-grow 1s ease forwards`,
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-500">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">รายงานผู้ป่วยใน</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">แสดง {ipdData.length} รายการ</span>
            <ExportButtons
              data={ipdData}
              columns={[
                { key: "an", label: "AN" },
                { key: "hn", label: "HN" },
                { key: "name", label: "ชื่อ-สกุล" },
                { key: "admitDate", label: "วันที่ Admit" },
                { key: "dchDate", label: "วันที่ D/C" },
                { key: "ward", label: "หอผู้ป่วย" },
                { key: "drg", label: "DRG" },
                { key: "adjrw", label: "AdjRW" },
                { key: "charge", label: "ค่าใช้จ่าย" },
                { key: "right", label: "สิทธิ์" },
                { key: "status", label: "สถานะ" },
              ]}
              fileName="IPD_Report"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-gray-500 font-medium">AN</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">ชื่อ-สกุล</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Admit</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">D/C</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">หอผู้ป่วย</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">DRG</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">AdjRW</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">ค่าใช้จ่าย</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">สิทธิ์</th>
                <th className="text-center py-3 px-2 text-gray-500 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {ipdData.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-2 font-mono text-purple-600 text-xs">{row.an}</td>
                  <td className="py-3 px-2 text-gray-800">{row.name}</td>
                  <td className="py-3 px-2 text-gray-500 text-xs">{row.admitDate}</td>
                  <td className="py-3 px-2 text-gray-500 text-xs">{row.dchDate}</td>
                  <td className="py-3 px-2 text-gray-700 text-xs">{row.ward}</td>
                  <td className="py-3 px-2 text-blue-600 font-mono text-xs">{row.drg}</td>
                  <td className="py-3 px-2 text-right text-gray-600 font-mono text-xs">{row.adjrw}</td>
                  <td className="py-3 px-2 text-right text-gray-800 font-medium">{row.charge}</td>
                  <td className="py-3 px-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      row.right === "UC" ? "bg-blue-50 text-blue-600" :
                      row.right === "ประกันสังคม" ? "bg-purple-50 text-purple-600" :
                      "bg-amber-50 text-amber-600"
                    }`}>
                      {row.right}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      row.status === "ส่งเรียบร้อย" ? "bg-emerald-50 text-emerald-600" :
                      row.status === "ปฏิเสธ" ? "bg-red-50 text-red-600" :
                      "bg-amber-50 text-amber-600"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
