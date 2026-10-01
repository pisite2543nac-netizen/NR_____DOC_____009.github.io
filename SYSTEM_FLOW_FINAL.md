# DOC-FULL-NR FINAL CLEAN V1.3.2 — System Flow

## Architecture
Browser → Clean Login/Auth → Role/Profile → clean_* RPC → RLS → clean_* Database

Frontend แยกเป็น modules และไม่มี Attendance / QR / PWA runtime.

## Registration + Group Code
นักศึกษา → ลงทะเบียน → pending → Admin อนุมัติ → กำหนดห้อง/วิชา → approved

การแยกกลุ่มสอนใช้ `clean_subject_offerings.plan_code` เช่น `ส.ทส.12`, `ส.ทส.21`, `ส.ทส.22`.

- วิชาที่มี Group Code เดียว: ระบบกำหนดให้ Enrollment อัตโนมัติ
- วิชาที่มีหลาย Group Code: Admin ไปที่ **ผู้ใช้ → ลงวิชา** แล้วเลือก Group Code ให้ผู้เรียน
- `clean_subject_enrollments.offering_id` เป็นตัวผูกนักศึกษากับ Group Code จริง

## Teaching Flow
`รายวิชา → Group Code → หน่วย 1–17 → 20 สไลด์ → จบสไลด์ → เปิดใบงานอิเล็กทรอนิกส์`

ครูเลือก Group Code ก่อนเริ่มสอน เมื่อถึงสไลด์ที่ 20 ปุ่มถัดไปเปลี่ยนเป็น **จบสไลด์ • เปิดใบงานอิเล็กทรอนิกส์**.

ระบบแสดง Preview:
- รายวิชา
- หน่วย
- Group Code
- จำนวนนักศึกษาที่จะได้รับงาน
- รายชื่อนักศึกษา
- จำนวนข้อ
- เวลาเปิด
- เวลาส่ง

เมื่อยืนยัน Backend สร้าง Digital Worksheet จากแม่แบบของหน่วย และ Assign เฉพาะ Enrollment ที่ `offering_id` ตรงกับ Group Code.

## Unit Content
13 วิชา × 17 หน่วย = 221 หน่วย
221 × 20 slides = 4,420 สไลด์

แต่ละหน่วยมี:
- ผลลัพธ์การเรียนรู้
- Key Concepts
- กรณีศึกษา
- งานปฏิบัติ
- Common Mistakes / Troubleshooting
- Safety / Ethics
- ใบงานแม่แบบ
- แบบทดสอบประจำหน่วย

## Worksheets
### Unit Digital Worksheet
แม่แบบประจำหน่วยเป็น Draft/Template และไม่ Publish ตรงจากหน้ารวมใบงาน
ต้องเปิดจากหน้า **เนื้อหาการสอน** เพื่อให้ผูก Group Code ถูกต้อง

### General Worksheet
ครูยังสร้าง Digital/Paper Worksheet ทั่วไปได้จากเมนูใบงาน

### Student Digital Flow
Publish → นักศึกษาเห็นงาน → ทำในระบบ → Save Draft → Submit → ครูตรวจ → Gradebook

## Paper Retrospective Mobile
มือถือใช้เฉพาะใบงาน Paper ที่ครูเปิดรับย้อนหลัง:
Paper → ถ่าย 1–6 รูป → Private Storage → ครูรับ/ไม่รับ → ถ้ารับเข้าสู่ Submission Queue

## Exams
221 Practice templates + 13 Midterm + 13 Final
นักศึกษาเห็นเฉพาะข้อสอบที่ Publish และถูก Assign ให้ตนเอง

## Gradebook
Backend authoritative: Worksheet + Behavior + Midterm + Final → Total → Grade
