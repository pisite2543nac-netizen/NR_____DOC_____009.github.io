# System Flow — CLEAN V1.3.6

## Registration
Register details → Live camera photo → Pending → Admin profile review → Confirm classroom/seat → Select subjects + Group Codes → Approve → Login enabled

## Student Profile
Student list / Submission queue / Room group → Student Profile → Photo + personal/academic data + classroom + subjects/Group Codes + worksheet/exam summary + audit history (where authorized)

## Teaching
Subject → Group Code → Teaching Unit → 20 Slides → Digital Worksheet release → Open/Due time → Group-only assignment → Submission → Review → Gradebook

## Paper Retrospective Mobile
Paper Worksheet → Teacher enables retrospective window → Student phone takes 1–6 copy images → Private Storage → Teacher accepts/rejects → Accepted item becomes normal Submission

## Removed runtimes
Attendance, Attendance QR, Late QR, Identity QR, PWA and Service Worker remain disabled.


## V1.3.6 Student Submission Tracker
- Student ไม่เห็นเมนูคะแนนหรือคะแนนรายวิชา
- Dashboard นักศึกษาแสดงเฉพาะสถานะใบงาน: ยังไม่ส่ง / บันทึกร่าง / ส่งแล้ว / ตรวจแล้ว
- โปรไฟล์นักศึกษาไม่แสดงคะแนนเฉลี่ย
- หลังส่งข้อสอบไม่แสดงคะแนน แม้ Backend ตรวจอัตโนมัติ
- คะแนนยังคงอยู่ใน Teacher/Admin Gradebook ตามเดิม
- Registration layout hardened สำหรับ checkbox/ปุ่มบนจอ 1366/1600/มือถือ
