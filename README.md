# DOC-FULL-NR V23 — Desktop/Tablet Production Console

V23 เปลี่ยน **Production UI ใหม่ทั้งหมด** โดยไม่ใช้หน้าตาและ runtime แบบซ้อนชั้นของ V16–V22 ในการ Deploy จริง เป้าหมายคือให้ flow หลักทำงานตรงกับ Supabase Production ก่อน และตัดระบบโทรศัพท์/กล้อง/PWA เดิมออกจาก runtime ที่ผู้ใช้เปิดใช้งาน

## เริ่มใช้งาน

1. อ่าน `README_START_HERE.txt`
2. แตก ZIP ทั้งชุด
3. ดับเบิลคลิก `00_INSTALL_UPDATE_SYSTEM.cmd`
4. ไม่ต้องกรอก GitHub URL — Repository ถูกกำหนดไว้แล้ว
5. รอ GitHub Actions `Deploy DOC-FULL-NR V23 Desktop Console` เป็นสีเขียว
6. เปิดเฉพาะ URL นี้:
   `https://pisite2543nac-netizen.github.io/NR_____DOC_____009.github.io/`

## Production runtime

GitHub Pages Deploy เฉพาะโฟลเดอร์ `site/` ซึ่งมีเพียง:

- `site/index.html`
- `site/styles.css`
- `site/app.js`

ไม่มี Mobile Runtime, Camera Runtime หรือ Service Worker registration ใน V23 production UI. โทรศัพท์ที่หน้าจอกว้างต่ำกว่า 768px ถูกปิดตามข้อกำหนดล่าสุด; รองรับ Tablet / Computer.

## Flow หลักใน UI ใหม่

- Login ตามบัญชีเดิม
- Admin/Teacher Dashboard
- เช็กชื่อ: เปิด session, ดูรายชื่อ, ปรับ มา/สาย/ขาด/ลา, ปิด session
- การสอน: ดูหน่วยและแผนการสอน
- ใบงาน: Teacher/Admin ดู/สร้าง/แก้/Publish/พิมพ์ผ่าน RPC V23
- ข้อสอบ: สร้าง preset, Publish, ดู Attempts, ให้คะแนน
- ตรวจงาน: Submission queue, ดูรายละเอียด, ให้คะแนน
- คะแนน/รายงาน: Gradebook + CSV
- Admin: สร้างผู้ใช้, กำหนด Teacher → Subject → Classroom, ห้องเรียน, รายวิชา, Room Group
- Student: ใบงาน Digital, พิมพ์ใบงาน Paper, ข้อสอบ Start/Save/Submit
- Profile: แสดงข้อมูลแบบ read-only เพื่อไม่ให้มีปุ่มที่ถูก RLS ปฏิเสธ

## Backend Production

ใช้ Supabase เดิม `DOC-FULL-NR-UNIVERSAL` (`thjscmfqunlaqxlievna`) เพื่อรักษาข้อมูลเดิมทั้งหมด

Production migrations ที่เกี่ยวข้องกับ recovery รุ่นนี้:

- `v22_0_fix_classroom_teacher_rls_dependency`
- `v23_0_staff_worksheet_workspace`

V22 แก้ 403 ที่ `classrooms` / `attendance_sessions` โดยไม่เปิด direct SELECT ของตาราง teacher assignment. V23 เพิ่ม scoped RPC สำหรับ Teacher/Admin worksheet workspace เพื่อให้การสร้าง/แก้/Publish ใบงานไม่ชน admin-only table RLS.

## Validation

รัน `02_BUILD_CHECK.bat` เพื่อเช็ก V23 contract และ JavaScript syntax. รายงานล่าสุดอยู่ที่ `V23_FINAL_VALIDATION.txt` และ `docs/V23_PRODUCTION_ACCEPTANCE.md`.

V23 จะยังไม่ถูกเรียกว่า 100% production accepted จนกว่าจะทดสอบด้วยบัญชีจริงหลัง Deploy บน browser จริงครบ flow ที่ใช้งาน.
