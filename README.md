# Revenue Claim Manager (RCM Report)

ระบบศูนย์ข้อมูลจัดเก็บรายได้หน่วยบริการ สำหรับโรงพยาบาล — พัฒนาด้วย Next.js 16, React 19 และ Tailwind CSS 4

---

## ความสามารถของระบบ

### ระบบยืนยันตัวตน (Authentication)
- เข้าสู่ระบบผ่านฐานข้อมูล HIS (`hos.officer`) โดยใช้ `officer_login_name` / `officer_login_password_md5` (MD5 Hash)
- แสดงชื่อผู้ใช้บน Dashboard หลังจาก login สำเร็จ

### หน้า Dashboard
- Sidebar เมนูหลัก พร้อมรองรับ Sub-menu แบบ Expand/Collapse
- รองรับ 4 หมวดหมู่: Dashboard, ผู้ป่วยนอก, ผู้ป่วยใน, ส่งเสริมป้องกัน

### รายงานผู้ป่วยนอก (OPD)

#### สรุปภาพรวม
- สรุปข้อมูลรายเดือนตามปีงบประมาณ (ต.ค. – ก.ย.)
- แสดงจำนวน VN, HN, ค่ารักษา, ชำระเงินสด, คงเหลือ, ชดเชย REP, FDH จ่าย
- กราฟเปรียบเทียบ VN vs HN รายเดือน
- เลือกปีงบประมาณ และกรองตามสิทธิ์ (pttype)

#### รายบุคคล
- ดึงข้อมูลจากฐานข้อมูล HIS จริง (ตาราง `ovst` + JOIN กว่า 30 ตาราง)
- เลือกช่วงวันที่ หรือเลือกรายเดือนตามปีงบประมาณ
- กรองตามสิทธิ์การรักษา (pttype)
- Column Picker — เลือกแสดง/ซ่อนคอลัมน์ได้มากกว่า 100 ฟิลด์ (แบ่ง 9 กลุ่ม)
- ค้นหาข้อความ (Search) ภายในตาราง
- สรุปสถิติ: จำนวน VN, HN, ค่ารักษา, ชำระเงินสด, คงเหลือ
- กราฟเปรียบเทียบ VN vs HN รายวัน
- สรุปรหัส PDx — แสดงจำนวนรายการที่มี/ไม่มีรหัส PDx พร้อม Progress Bar

### ส่งออกข้อมูล (Export)
- รองรับ 5 รูปแบบ: **Excel (.xlsx)**, **CSV**, **TXT**, **JSON**, **PDF**
- ใช้งานได้ทุกหน้ารายงาน

---

## เทคโนโลยีที่ใช้

| เทคโนโลยี | เวอร์ชัน |
|---|---|
| Next.js | 16.1.6 |
| React | 19.2.3 |
| TypeScript | 5 |
| Tailwind CSS | 4 |
| MySQL (mysql2) | 3.17.x |
| xlsx | 0.18.5 |
| jsPDF + AutoTable | 4.x / 5.x |

---

## การติดตั้งและรันระบบ

### 1. ติดตั้ง Node.js

ต้องมี **Node.js 18.18** ขึ้นไป — ดาวน์โหลดจาก [https://nodejs.org](https://nodejs.org)

### 2. Clone หรือคัดลอกโปรเจกต์

```bash
cd path/to/project
```

### 3. ติดตั้ง Dependencies

```bash
npm install
```

### 4. ตั้งค่าฐานข้อมูล

สร้างไฟล์ `.env.local` ที่ root ของโปรเจกต์:

```env
# Port ของเว็บแอปพลิเคชัน (ค่าเริ่มต้น: 3000)
PORT=3000

# การเชื่อมต่อฐานข้อมูล
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=sa
DB_PASSWORD=sa
DB_NAME=rcmdb
HOS_DB_NAME=hos
```

> **หมายเหตุ:** ฐานข้อมูลที่ต้องมี
> - `hos` — ฐานข้อมูล HIS หลัก (ตาราง `officer`, `ovst`, `patient`, `pttype` ฯลฯ)
> - `rcmdb` — ฐานข้อมูลของระบบ RCM
>
> **เปลี่ยน Port:** แก้ไขค่า `PORT` ใน `.env.local` เป็นหมายเลขที่ต้องการ เช่น `PORT=4000`

### 5. รันระบบในโหมด Development

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:<PORT>` (ค่าเริ่มต้น [http://localhost:3000](http://localhost:3000))

### 6. Build สำหรับ Production

```bash
npm run build
npm start
```

---

## โครงสร้างโปรเจกต์

```
rcmreport/
├── app/
│   ├── page.tsx                          # หน้า Login
│   ├── layout.tsx                        # Root Layout
│   ├── globals.css                       # Global Styles
│   ├── register/page.tsx                 # หน้าลงทะเบียน
│   ├── dashboard/
│   │   ├── layout.tsx                    # Sidebar Layout
│   │   ├── page.tsx                      # หน้า Dashboard
│   │   ├── outpatient/
│   │   │   ├── page.tsx                  # สรุปภาพรวม OPD
│   │   │   └── individual/page.tsx       # รายบุคคล OPD
│   │   ├── inpatient/page.tsx            # ผู้ป่วยใน
│   │   └── prevention/page.tsx           # ส่งเสริมป้องกัน
│   └── api/
│       ├── auth/login/route.ts           # API Login (hos.officer + MD5)
│       ├── auth/register/route.ts        # API Register
│       ├── opd/route.ts                  # API ดึงข้อมูล OPD
│       └── pttype/route.ts              # API สิทธิ์การรักษา
├── components/
│   └── ExportButtons.tsx                 # ปุ่มส่งออกข้อมูล
├── lib/
│   ├── db.ts                             # MySQL Pool (rcmdb)
│   └── dbhos.ts                          # MySQL Pool (hos)
├── public/
│   ├── logorcm.png                       # โลโก้ระบบ
│   └── vdointrologin.mp4                # วิดีโอหน้า Login
└── package.json
```
