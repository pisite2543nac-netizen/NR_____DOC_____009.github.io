# Backend Status — FINAL CLEAN V1.3.2

Build: `CLEAN-V1.3.2-GROUP-DIGITAL-TEACHING-SEM2-2569`

Production Acceptance:
- RLS: 29/29 PASS
- Subjects: 13 PASS
- Group Codes / Subject Offerings: 14 PASS
- Teaching Units: 221 PASS
- Slides: 4,420 PASS
- Unit Worksheet Templates: 221 PASS
- Unit Practice Exams: 221 PASS
- Midterm Templates: 13 PASS
- Final Templates: 13 PASS
- Clean RPC executable by anon: 0 PASS
- Private Mobile Storage: PASS
- Attendance runtime: disabled
- QR runtime: disabled
- Mobile scope: paper-retrospective-only
- Digital-after-slides group flow: enabled

## Group Code Backend
เพิ่ม `offering_id` ใน Subject Enrollment, Worksheet และ Exam พร้อม trigger ป้องกัน Group Code ข้ามวิชา

RPC สำคัญ:
- `clean_admin_student_enrollments(student_id)`
- `clean_admin_set_enrollment_v2(...)`
- `clean_teaching_digital_preview(unit_id, offering_id)`
- `clean_teaching_open_digital_worksheet(unit_id, offering_id, open_at, due_at)`

วิชาที่มี Offering เดียวจะ auto-group เมื่อ Admin อนุมัติ/สร้างนักศึกษา
