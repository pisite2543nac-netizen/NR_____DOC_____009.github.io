# DOC-FULL-NR FINAL CLEAN V1.5

Build marker: `CLEAN-V1.5-CLASSROOM-SECURE-EXAM-SEM2-2569`

V1.5 extends the V1.4 canonical academic model without creating nested student groups:

`Student -> 1 Learning Group -> Many Subjects -> Class/Exam Sessions`

## Classroom Presence
- Teacher/Admin opens a temporary class session for **Subject + Learning Group**.
- System shows a rotating 6-digit classroom code (3/5/10 minute interval selectable).
- Student must be signed in and enrolled in that exact offering before the code is accepted.
- The session records present/late status and gives the teacher a live roster.
- Mobile student companion supports classroom-code join.

## Remote Digital Worksheet Guard
- A teacher can lock a published Digital Worksheet to the active class session.
- Student must first have class presence and then confirm the current classroom code before the worksheet device receives an access grant.
- Grant is bound to the worksheet device and expires; closing the class session revokes active grants.
- Secure worksheet saves/submissions use `clean_submission_save_v2`; the legacy save RPC cannot bypass a gated worksheet.

## Secure Exam
- Midterm and final exams use a **Secure Exam Session** with a rotating 6-digit code.
- Student must be in the correct offering and enter the current code before an attempt can start.
- One active device per attempt; teacher can explicitly unlock a device after a legitimate device failure.
- Questions and answer options are shuffled per attempt and persisted for that attempt.
- Server controls exam expiry, autosave is supported, and late final edits are rejected.
- Fullscreen exit, tab/window focus loss, copy, paste and context-menu attempts are logged as integrity events. Events flag an attempt for teacher review; they do not automatically deduct marks.
- Students do not see exam scores after submission.

## Midterm / Final format
Every one of the 13 subjects now has:
- Midterm: 50 questions -> 20 gradebook points.
- Final: 50 questions -> 20 gradebook points.
- Q1-25: content/understanding grounded in the teaching units.
- Q26-50: analytical/application scenarios, marked `คิดวิเคราะห์` and `ยากมาก`.
- Raw result is retained as 0-50 while the exam score is scaled to 0-20 (`raw × 0.4`).

Existing V1.4 features remain: registration camera/private photo, one learning group per student, subject/group-scoped teaching, one-attempt teaching worksheets by default, group-scoped gradebook, student submission tracker, and registration major `ทธ เทคโนโลยีธุรกิจดิจิทัล`.

Legacy Attendance/QR/PWA runtime remains disabled; V1.5 Classroom Presence is a separate session layer designed for the canonical learning-group model.

## Final hardening
- Correct option IDs are diversified across A/B/C/D at term-exam build time; the correct answer is not a fixed position in source data.
- Production runs `clean-v15-secure-exam-expiry` every minute to finalize expired secure attempts from their latest saved answers even if the browser closes.
- A second device is blocked from taking over an active attempt and produces a persisted severity-3 integrity event for teacher review.
