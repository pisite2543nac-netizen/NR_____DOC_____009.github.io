DOC-FULL-NR CLEAN V1.5.2 — UI FIX
Frontend Build: CLEAN-V1.5.2-EXAM-MODAL-UI-FIX-SEM2-2569
Backend Build: CLEAN-V1.5.1-SCORE-RUBRIC-40-20-20-20-SEM2-2569

1) Extract ZIP.
2) Run 00_INSTALL_UPDATE_SYSTEM.cmd
3) Wait for [SUCCESS] FINAL CLEAN V1.5.2 IS LIVE.
4) Reopen/refresh the website. The CSS/JS URLs are cache-busted to v=1.5.2.

Fixed in this release:
- The “บังคับโหมดเต็มหน้าจอ” option in the Open Exam Room modal no longer collapses into a narrow vertical column.
- The explanatory text stays horizontal, wraps naturally, and does not overlap the “อุปกรณ์เดียวต่อการสอบหนึ่งครั้ง” notice.
- Registration-settings checkbox cards use the same stable form layout.

All V1.5/V1.5.1 functions are preserved:
- Classroom Code + Presence Gate
- Secure Exam + anti-cheat event log
- 50-question midterm/final -> 20 points each
- Score rubric 40 + 20 + 20 + 20
- Behavior 20 = automatic punctuality 10 + teacher judgment 10
- One student -> one learning group -> many subjects
