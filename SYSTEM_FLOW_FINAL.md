# DOC-FULL-NR FINAL CLEAN V1.3 — System Flow

## Architecture
Browser → Clean Login/Auth → Role/Profile → clean_* RPC → RLS → clean_* Database

Frontend ใหม่ถูกแยกเป็น modules: core API/UI/router, role pages, teaching, worksheets, exams, gradebook และ mobile submission. ไม่มี runtime ของ Attendance/QR/PWA.

## Registration
นักศึกษา → ลงทะเบียน → status=pending → Admin > ผู้ใช้ → อนุมัติ → กำหนดห้อง → เลือกรายวิชา → status=approved → Login ใช้งาน

## Teaching
รายวิชา 13 วิชา → วิชาละ 17 หน่วย → หน่วยละ 20 สไลด์ → เนื้อหา/ผลลัพธ์/Key Concepts/กรณีศึกษา/ข้อผิดพลาด/ความปลอดภัย/ใบงาน → ครูสามารถแก้หน่วยและมี Version History

รวม 221 หน่วย และ 4,420 สไลด์

## Worksheet Issuing
### จากหน่วยการสอน
ครูเปิดหน่วย → สั่งจ่ายใบงาน Paper → เลือกห้อง → วันเปิด → กำหนดส่ง → ถ้าต้องการเปิด Mobile Retrospective ให้กำหนดวันรับย้อนหลัง → Backend สร้าง Published Paper Worksheet และ Assignment ให้ผู้เรียนที่มี enrollment=approved ตามวิชา/ห้อง

### ใบงานทั่วไป
ครูสร้าง Draft → Preview ก่อน Publish → ระบบแสดงวิชา ห้อง และจำนวน/รายชื่อนักศึกษาที่จะได้รับ → ยืนยันวันเปิด/กำหนดส่ง → Publish

## Paper Retrospective Mobile
เฉพาะ Paper Worksheet เท่านั้น
ครูต้องเปิด allow_mobile_copy และช่วงเวลายังไม่หมด → นักศึกษาใช้มือถือ → เลือกใบงาน → ถ่าย 1–6 รูป → Private Storage → ส่ง → ครูเปิด "ตรวจงาน > ย้อนหลังมือถือ" → ดูภาพผ่าน Signed URL → รับ/ไม่รับ → ถ้ารับ ระบบสร้าง Submission เพื่อให้คะแนนต่อ

## Digital Worksheet
Publish → นักศึกษาตอบในระบบ → Save Draft / Submit → ครูตรวจ → คะแนนเข้า Gradebook

## Exams
ครูสร้าง Draft → Questions + Answer Key → Publish → Assignment → นักศึกษา Start/Save/Submit → Auto grade สำหรับคำถามเลือกตอบ → Written answer เข้าคิวตรวจ → Gradebook

## Gradebook
Backend authoritative; worksheet + behavior + midterm + final → total → grade → pass/fail. Export CSV ได้

## Admin
Dashboard / วิชา-ห้อง / เนื้อหาการสอน / ผู้ใช้ / มอบหมายครู / ใบงาน / ตรวจงาน / ข้อสอบ / คะแนน / กลุ่มห้อง / ตรวจระบบ

## Teacher
Dashboard / รายวิชา / เนื้อหาการสอน / ใบงาน / ตรวจงาน / ข้อสอบ / คะแนน / กลุ่มห้อง / ตรวจระบบ

## Student Desktop/Tablet
Dashboard / วิชาของฉัน / เนื้อหาการเรียน / ใบงาน / ข้อสอบ / คะแนน / โปรไฟล์

## Student Mobile
ส่งใบงานย้อนหลังเพียงฟังก์ชันเดียว
