# CLEAN V1.3.6 Test Report

## Backend Acceptance
PASS
- RLS 30/30
- Subjects 13
- Group Codes 14
- `ทธ.11` correction PASS
- Units 221
- Slides 4,420
- Unit worksheets 221
- Unit exams 221
- Registration camera/private photo storage PASS
- Student profile detail PASS
- Anon CLEAN RPC = 0
- Attendance disabled
- QR disabled

## Student Profile RPC
PASS
- profile object returned
- enrollment array returned
- learning summary returned
- account history returned for Admin
- RPC authenticated=true / anon=false

## Browser Smoke
PASS
- Detailed registration form
- Camera controls present
- Admin navigation
- Admin student profile dialog
- Teacher navigation
- Student navigation/profile
- Group-scoped teaching flow
- Student mobile remains single-purpose

## Frontend Gate
PASS
- Modular frontend
- JavaScript syntax/import smoke
- no Attendance runtime reference
- no QR runtime reference
- student profile flow present
- registration camera flow present


## V1.3.6 Student Submission Tracker
- Student ไม่เห็นเมนูคะแนนหรือคะแนนรายวิชา
- Dashboard นักศึกษาแสดงเฉพาะสถานะใบงาน: ยังไม่ส่ง / บันทึกร่าง / ส่งแล้ว / ตรวจแล้ว
- โปรไฟล์นักศึกษาไม่แสดงคะแนนเฉลี่ย
- หลังส่งข้อสอบไม่แสดงคะแนน แม้ Backend ตรวจอัตโนมัติ
- คะแนนยังคงอยู่ใน Teacher/Admin Gradebook ตามเดิม
- Registration layout hardened สำหรับ checkbox/ปุ่มบนจอ 1366/1600/มือถือ

## Final V1.3.6 verification
- Backend acceptance: PASS
- Student grades RPC: returns []
- Student profile numeric score leakage: NONE
- Student submission tracker score leakage: NONE
- Student exam list score leakage: NONE
- Student exam start score leakage: NONE
- Student exam submit score leakage: NONE
- Teacher/Admin stored exam score remains available: PASS
- Browser smoke Admin: PASS
- Browser smoke Teacher: PASS
- Browser smoke Student: PASS
- Student Grade menu removed: PASS
- Registration layout hardening: PASS

## V1.3.6 Registration consent layout regression test
- Desktop 1440px: consent container > 600px and consent text > 500px: PASS
- Mobile 390px: consent container > 300px and consent text > 240px: PASS
- CSS writing-mode is horizontal-tb: PASS
- Root cause fixed: generic `.check-card > span` 30x30 icon rule no longer constrains `.registration-confirm > span`.
