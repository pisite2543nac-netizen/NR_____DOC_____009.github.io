# คู่มือ Deploy DOC-FULL-NR V23

V23 ใช้ Repository เดิมที่กำหนดไว้แล้ว:

`pisite2543nac-netizen/NR_____DOC_____009.github.io`

จึง **ไม่ต้องวาง URL GitHub ทุกครั้ง**

## อัปเดตแบบ One-Click

1. แตก ZIP V23
2. ดับเบิลคลิก `00_INSTALL_UPDATE_SYSTEM.cmd`
3. ถ้า Windows/Git Credential Manager ขอ Login GitHub ให้ Login ตามปกติ
4. สคริปต์จะตรวจ remote `main`, commit Source ใหม่ และ Push ด้วย `force-with-lease`
5. หน้า GitHub Actions จะเปิดอัตโนมัติ
6. รอ workflow `Deploy DOC-FULL-NR V23 Desktop Console` เป็นสีเขียว
7. เปิด:
   `https://pisite2543nac-netizen.github.io/NR_____DOC_____009.github.io/`

ห้ามใช้เว็บ root เก่า `https://pisite2543nac-netizen.github.io/` ในการตรวจ V23.

## GitHub Pages

Repository Settings → Pages → Build and deployment → Source ต้องเป็น **GitHub Actions**. Workflow จะตรวจ V23 contract + `node --check site/app.js` ก่อน Upload เฉพาะ `site/` เป็น Pages artifact.

## การยืนยันว่าเปิดถูกชุด

ส่วนหัวต้องแสดง:

`Production Console • V23 Desktop/Tablet`

ถ้ายังเห็น UI เก่า ให้ตรวจ URL ก่อน แล้วปิดแท็บเก่า/เปิด URL V23 ใหม่. เมื่อ V23 ถูกโหลด `app.js` จะยกเลิก service worker และล้าง cache เดิมใน browser เท่าที่ browser อนุญาต.

## ทดสอบในเครื่อง

ดับเบิลคลิก `01_RUN_LOCAL.bat` เพื่อเปิด static server จาก `site/` โดยไม่ต้อง npm build.

รัน `02_BUILD_CHECK.bat` เพื่อตรวจ contract และ JavaScript syntax.
