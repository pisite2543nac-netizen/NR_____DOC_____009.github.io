# DOC-FULL-NR FINAL CLEAN V1.3.5

Production frontend rebuilt from scratch as ES modules.

Build marker: `CLEAN-V1.3.5-STUDENT-SUBMISSION-TRACKER-SEM2-2569`

Desktop/Tablet: full academic workflow. Student Mobile: retrospective Paper worksheet submission only. Attendance, QR, PWA and Service Worker runtime are not part of the application.

## V1.3.5 — Registration Camera + Student Profile

Detailed Registration keeps the useful detail of the legacy system and restores the live registration camera without restoring legacy QR/scanner runtime.

Registration data:
- full name / nickname
- student code (also used as Username)
- birth date
- phone
- optional Email
- level / requested room / department / major
- live camera photo
- password + confirmation
- optional Registration Code controlled by Admin

Flow:
Student Register → Camera Photo → Pending → Admin opens Student Profile → Confirm actual classroom/seat → Select subjects + Group Codes → Approve.

Student Profile includes private registration photo, student/academic data, actual classroom, seat number, subjects + Group Codes, worksheet/exam summary and account management history. Teachers may open profiles only for students inside their teaching scope.

Group Code correction: `ทธ.11` is the valid code for subject `21910-2018`; the old `พธ.11` value was removed.


## V1.3.5 Student Submission Tracker
- Student ไม่เห็นเมนูคะแนนหรือคะแนนรายวิชา
- Dashboard นักศึกษาแสดงเฉพาะสถานะใบงาน: ยังไม่ส่ง / บันทึกร่าง / ส่งแล้ว / ตรวจแล้ว
- โปรไฟล์นักศึกษาไม่แสดงคะแนนเฉลี่ย
- หลังส่งข้อสอบไม่แสดงคะแนน แม้ Backend ตรวจอัตโนมัติ
- คะแนนยังคงอยู่ใน Teacher/Admin Gradebook ตามเดิม
- Registration layout hardened สำหรับ checkbox/ปุ่มบนจอ 1366/1600/มือถือ
