# DOC-FULL-NR CLEAN V1.3.6 — Backend Status

Build: `CLEAN-V1.3.6-REGISTER-LAYOUT-FIX-SEM2-2569`

## Verified production backend
- Supabase project: `thjscmfqunlaqxlievna`
- RLS: 30/30 CLEAN tables enabled
- Subjects: 13
- Group Codes: 14
- Corrected Group Code: `21910-2018` uses `ทธ.11` (old `พธ.11` removed)
- Teaching Units: 221
- Slides: 4,420
- Unit worksheet templates: 221
- Unit practice exams: 221
- Midterm templates: 13
- Final templates: 13
- Attendance runtime: disabled
- QR runtime: disabled
- Mobile scope: retrospective Paper copy submission only

## Detailed Registration V1.3.6
Registration stores: full name, nickname, student code, birth date, phone, email, level, room label, department, major, and a live camera photo.

Registration photos are stored in the private bucket `clean-registration-photos` with a 1 MB JPEG limit. Photos are not public. Authorized profile viewing uses a short-lived signed URL.

## Student Profile
RPC: `clean_student_profile_detail(uuid)`
- Admin: full student profile + enrollments + Group Code + learning summary + account history
- Teacher: only students inside teaching scope; personal fields are reduced
- Student: own full profile

Profile photo URL: Edge Function `clean-registration-photo-url` (JWT required).

## Acceptance
`clean_system_acceptance()` currently reports PASS for registration camera, private photo storage, student profile detail, Group Code correction, teaching content, assessments, RLS, and disabled Attendance/QR runtime.


## V1.3.6 Student Submission Tracker
- Student ไม่เห็นเมนูคะแนนหรือคะแนนรายวิชา
- Dashboard นักศึกษาแสดงเฉพาะสถานะใบงาน: ยังไม่ส่ง / บันทึกร่าง / ส่งแล้ว / ตรวจแล้ว
- โปรไฟล์นักศึกษาไม่แสดงคะแนนเฉลี่ย
- หลังส่งข้อสอบไม่แสดงคะแนน แม้ Backend ตรวจอัตโนมัติ
- คะแนนยังคงอยู่ใน Teacher/Admin Gradebook ตามเดิม
- Registration layout hardened สำหรับ checkbox/ปุ่มบนจอ 1366/1600/มือถือ
