"use client";

import ExportButtons from "@/components/ExportButtons";

// === Mock Data ===
const summaryCards = [
  { title: "รายได้รวม", value: "฿12,485,230", change: "+12.5%", up: true, icon: "revenue" },
  { title: "จำนวนเคส", value: "3,842", change: "+8.2%", up: true, icon: "cases" },
  { title: "ค่าเฉลี่ย/เคส", value: "฿3,250", change: "-2.1%", up: false, icon: "average" },
  { title: "อัตราเรียกเก็บสำเร็จ", value: "94.7%", change: "+3.4%", up: true, icon: "success" },
];

const monthlyData = [
  { month: "ม.ค.", value: 65 },
  { month: "ก.พ.", value: 72 },
  { month: "มี.ค.", value: 58 },
  { month: "เม.ย.", value: 80 },
  { month: "พ.ค.", value: 74 },
  { month: "มิ.ย.", value: 90 },
  { month: "ก.ค.", value: 85 },
  { month: "ส.ค.", value: 92 },
  { month: "ก.ย.", value: 78 },
  { month: "ต.ค.", value: 88 },
  { month: "พ.ย.", value: 95 },
  { month: "ธ.ค.", value: 100 },
];

const departmentData = [
  { name: "อายุรกรรม", value: 35, color: "from-blue-500 to-cyan-400" },
  { name: "ศัลยกรรม", value: 28, color: "from-purple-500 to-pink-400" },
  { name: "สูตินรีเวช", value: 18, color: "from-amber-500 to-orange-400" },
  { name: "กุมารเวช", value: 12, color: "from-emerald-500 to-teal-400" },
  { name: "ออร์โธปิดิกส์", value: 7, color: "from-rose-500 to-red-400" },
];

const recentActivities = [
  { action: "เรียกเก็บค่ารักษา", patient: "สมชาย ใจดี", amount: "฿45,200", status: "สำเร็จ", time: "5 นาทีที่แล้ว" },
  { action: "ตรวจสอบสิทธิ์", patient: "สมหญิง รักดี", amount: "฿12,800", status: "รอดำเนินการ", time: "12 นาทีที่แล้ว" },
  { action: "ส่งเคลม", patient: "วิชัย สุขสันต์", amount: "฿78,500", status: "สำเร็จ", time: "25 นาทีที่แล้ว" },
  { action: "ปฏิเสธเคลม", patient: "อรุณ แสงทอง", amount: "฿23,100", status: "ปฏิเสธ", time: "1 ชม.ที่แล้ว" },
  { action: "เรียกเก็บค่ารักษา", patient: "นภา ฟ้าใส", amount: "฿56,700", status: "สำเร็จ", time: "2 ชม.ที่แล้ว" },
];

const topDRGs = [
  { code: "DRG 0391", desc: "ทารกแรกเกิดปกติ", cases: 245, revenue: "฿1,225,000" },
  { code: "DRG 0540", desc: "คลอดปกติ", cases: 198, revenue: "฿990,000" },
  { code: "DRG 1501", desc: "ไตวายเรื้อรัง", cases: 156, revenue: "฿1,560,000" },
  { code: "DRG 0100", desc: "หลอดเลือดสมอง", cases: 134, revenue: "฿2,010,000" },
  { code: "DRG 0300", desc: "โรคหัวใจขาดเลือด", cases: 112, revenue: "฿1,680,000" },
];

function CardIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    revenue: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    cases: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    average: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    success: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };
  return <>{icons[type]}</>;
}

export default function DashboardPage() {
  const maxBar = Math.max(...monthlyData.map((d) => d.value));

  return (
    <>
      {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {summaryCards.map((card, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 animate-fade-in-up border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{card.value}</p>
                    <div className={`flex items-center gap-1 mt-2 text-sm ${card.up ? "text-emerald-500" : "text-red-500"}`}>
                      <svg className={`w-4 h-4 ${card.up ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      {card.change}
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    i === 0 ? "bg-blue-50 text-blue-500" :
                    i === 1 ? "bg-purple-50 text-purple-500" :
                    i === 2 ? "bg-amber-50 text-amber-500" :
                    "bg-emerald-50 text-emerald-500"
                  }`}>
                    <CardIcon type={card.icon} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 animate-fade-in-up border border-gray-100 shadow-sm" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">รายได้รายเดือน</h3>
                  <p className="text-xs text-gray-400 mt-1">ข้อมูลปี 2569</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium">รายเดือน</span>
                </div>
              </div>
              <div className="flex items-end gap-2 h-48">
                {monthlyData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full relative group">
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {d.value}%
                      </div>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-300 transition-all duration-500 hover:from-blue-400 hover:to-blue-200 cursor-pointer"
                        style={{
                          height: `${(d.value / maxBar) * 160}px`,
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

            {/* Donut/Department Chart */}
            <div className="bg-white rounded-2xl p-6 animate-fade-in-up border border-gray-100 shadow-sm" style={{ animationDelay: "0.5s" }}>
              <h3 className="text-lg font-semibold text-gray-800 mb-6">สัดส่วนแผนก</h3>
              <div className="space-y-4">
                {departmentData.map((dept, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{dept.name}</span>
                      <span className="text-gray-500 font-mono">{dept.value}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${dept.color} transition-all duration-1000`}
                        style={{
                          width: `${dept.value}%`,
                          animation: "bar-grow 1.5s ease forwards",
                          animationDelay: `${0.6 + i * 0.15}s`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Total Center */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">3,842</p>
                  <p className="text-xs text-gray-500 mt-1">เคสทั้งหมด</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <div className="bg-white rounded-2xl p-6 animate-fade-in-up border border-gray-100 shadow-sm" style={{ animationDelay: "0.6s" }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">กิจกรรมล่าสุด</h3>
                <div className="flex items-center gap-2">
                  <ExportButtons
                    data={recentActivities}
                    columns={[
                      { key: "action", label: "กิจกรรม" },
                      { key: "patient", label: "ผู้ป่วย" },
                      { key: "amount", label: "จำนวนเงิน" },
                      { key: "status", label: "สถานะ" },
                      { key: "time", label: "เวลา" },
                    ]}
                    fileName="Dashboard_Activity"
                  />
                  <button className="text-xs text-blue-500 hover:text-blue-600 transition-colors">ดูทั้งหมด →</button>
                </div>
              </div>
              <div className="space-y-3">
                {recentActivities.map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors animate-slide-in-left"
                    style={{ animationDelay: `${0.7 + i * 0.1}s` }}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      activity.status === "สำเร็จ" ? "bg-emerald-50 text-emerald-500" :
                      activity.status === "ปฏิเสธ" ? "bg-red-50 text-red-500" :
                      "bg-amber-50 text-amber-500"
                    }`}>
                      {activity.status === "สำเร็จ" ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : activity.status === "ปฏิเสธ" ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{activity.action}</p>
                      <p className="text-xs text-gray-400">{activity.patient} · {activity.time}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-gray-800">{activity.amount}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        activity.status === "สำเร็จ" ? "bg-emerald-50 text-emerald-600" :
                        activity.status === "ปฏิเสธ" ? "bg-red-50 text-red-600" :
                        "bg-amber-50 text-amber-600"
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top DRGs */}
            <div className="bg-white rounded-2xl p-6 animate-fade-in-up border border-gray-100 shadow-sm" style={{ animationDelay: "0.7s" }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Top DRG</h3>
                <div className="flex items-center gap-2">
                  <ExportButtons
                    data={topDRGs}
                    columns={[
                      { key: "code", label: "รหัส DRG" },
                      { key: "desc", label: "รายละเอียด" },
                      { key: "cases", label: "จำนวนเคส" },
                      { key: "revenue", label: "รายได้" },
                    ]}
                    fileName="Dashboard_TopDRG"
                  />
                  <button className="text-xs text-blue-500 hover:text-blue-600 transition-colors">ดูทั้งหมด →</button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-12 text-xs text-gray-500 px-3 pb-2 border-b border-gray-100">
                  <span className="col-span-3">รหัส DRG</span>
                  <span className="col-span-4">รายละเอียด</span>
                  <span className="col-span-2 text-right">เคส</span>
                  <span className="col-span-3 text-right">รายได้</span>
                </div>
                {topDRGs.map((drg, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 items-center text-sm px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors animate-slide-in-left"
                    style={{ animationDelay: `${0.8 + i * 0.1}s` }}
                  >
                    <span className="col-span-3 text-blue-600 font-mono text-xs">{drg.code}</span>
                    <span className="col-span-4 text-gray-700 truncate">{drg.desc}</span>
                    <span className="col-span-2 text-right text-gray-500 font-mono">{drg.cases}</span>
                    <span className="col-span-3 text-right text-emerald-600 font-medium">{drg.revenue}</span>
                  </div>
                ))}
              </div>
              {/* Summary Bar */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">รวมทั้งหมด</span>
                <span className="text-gray-800 font-bold">฿7,465,000</span>
              </div>
            </div>
          </div>
    </>
  );
}
