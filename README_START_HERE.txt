DOC-FULL-NR FINAL CLEAN V1.3.3
Build: CLEAN-V1.3.3-DETAILED-REGISTRATION-SEM2-2569

วิธีติดตั้ง / อัปเดต
1) แตก ZIP ทั้งหมดก่อน
2) ดับเบิลคลิก 00_INSTALL_UPDATE_SYSTEM.cmd
   หรือ 00_FIX_AND_DEPLOY_FINAL_CLEAN_V1_3_3.cmd
3) รอจนขึ้น:
   [SUCCESS] FINAL CLEAN V1.3.3 IS LIVE
   Build: CLEAN-V1.3.3-DETAILED-REGISTRATION-SEM2-2569
4) เว็บจะเปิด Production ให้อัตโนมัติ

จุดสำคัญ V1.3.3
- รายวิชา 13 วิชา / 221 หน่วย / 4,420 สไลด์
- 221 ใบงานแม่แบบประจำหน่วย
- 221 แบบทดสอบประจำหน่วย + กลางภาค 13 + ปลายภาค 13
- Group Code 14 กลุ่มจากตารางมอบหมายสอน
- หน้าสอน: เลือกวิชา → Group Code → หน่วย → สไลด์ → จบสไลด์ → เปิดใบงาน Digital
- ใบงาน Digital จ่ายเฉพาะนักศึกษาที่ Group Code ตรงกัน
- Admin กำหนด Group Code ให้ Enrollment ได้จาก ผู้ใช้ → ลงวิชา
- มือถือ: ส่งสำเนาใบงาน Paper ย้อนหลังเท่านั้น
- Attendance / QR / PWA / Service Worker runtime ไม่มีในระบบใหม่

ไฟล์หลัก
- 00_INSTALL_UPDATE_SYSTEM.cmd : ใช้งานง่ายสุด
- 00_FIX_AND_DEPLOY_FINAL_CLEAN_V1_3_3.cmd : Deploy แบบเต็มพร้อม Release Gate
- 02_LOCAL_RELEASE_GATE.cmd : ตรวจไฟล์ในเครื่อง
- USER_GUIDE_FINAL.md : วิธีใช้งาน
- SYSTEM_FLOW_FINAL.md : Flow ระบบ
- TEST_REPORT.md : ผลทดสอบ


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
