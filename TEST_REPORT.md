# FINAL CLEAN V1.3.2 Test Report

## Static Release Gate — PASS
- Build marker V1.3.2 ถูกต้อง
- 19 JavaScript modules
- JavaScript syntax PASS
- ไม่มี Attendance / QR / PWA runtime
- มี group digital preview/open flow
- มี Group Code enrollment flow

## Browser Smoke — PASS
- Admin Desktop 11 เมนู
- Teacher Desktop 9 เมนู
- Student Desktop 7 เมนู
- Teaching: เลือก Group Code PASS
- Unit → 20 Slides PASS
- Slide 20 → ปุ่ม `จบสไลด์ • เปิดใบงานอิเล็กทรอนิกส์` PASS
- Digital Worksheet Preview ตาม Group Code PASS
- Admin → ลงวิชา → Group Code selector PASS
- Student Mobile มีฟังก์ชันส่งย้อนหลังเพียงรายการเดียว PASS

## Backend Transactional E2E — PASS
ทดสอบใน transaction แล้ว rollback:
- Admin ผูก Student → Subject → Group Code `ส.ทส.12`
- `clean_teaching_digital_preview` พบผู้รับ 1 คน
- เปิด Digital Worksheet จาก Unit + Group Code
- Assigned count = 1
- Worksheet เก็บ `offering_id` และ `teaching_unit_id` ถูกต้อง
- Student เห็นเฉพาะงาน Group ของตนเอง
- Student Submit Digital Worksheet สำเร็จ

Result:
`status=PASS, group_code=ส.ทส.12, preview_count=1, assigned_count=1, student_visible=true, digital_submit=true`

## Backend Acceptance — PASS
- Group Codes 14
- 221 Units / 4,420 Slides
- 221 Unit Worksheets / 221 Unit Exams
- 13 Midterm / 13 Final
- anon Clean RPC = 0
- ungrouped approved enrollment = 0 ณ เวลาตรวจล่าสุด
