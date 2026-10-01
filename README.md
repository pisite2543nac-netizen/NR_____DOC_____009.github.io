# DOC-FULL-NR FINAL CLEAN V1.3.3

Production frontend rebuilt from scratch as ES modules.

Build marker: `CLEAN-V1.3.3-DETAILED-REGISTRATION-SEM2-2569`

Desktop/Tablet: full academic workflow. Student Mobile: retrospective Paper worksheet submission only. Attendance, QR, PWA and Service Worker runtime are not part of the application.


## V1.3.3 — Detailed Registration

ระบบลงทะเบียนนำรายละเอียดที่มีประโยชน์จากระบบเดิมกลับมา โดยไม่เอา Camera/QR/PWA กลับมา:
- ชื่อ-สกุล / ชื่อเล่น
- รหัสนักศึกษา (ใช้เป็น Username)
- วันเกิด
- เบอร์โทรศัพท์
- Email (ไม่บังคับ)
- ระดับ / ห้องที่แจ้ง / แผนก / สาขา
- Password + Confirm Password
- Registration Code (เปิด/ปิดและตั้งค่าได้โดย Admin)

Flow: Student Register -> Pending -> Admin ดูรายละเอียด -> ยืนยันห้องจริง/เลขที่ -> เลือกรายวิชา + Group Code รายวิชา -> Approve.
หากไม่อนุมัติ ระบบเก็บเหตุผลและประวัติการตรวจไว้. ข้อมูลห้อง/กลุ่มที่ผู้สมัครกรอกไม่มีผลกับการสั่งจ่ายงานจนกว่า Admin จะยืนยัน.
