# FINAL FLOW — CLEAN V1.5

## Canonical organization
`Student -> 1 Learning Group -> Many Subjects`

Classroom and Exam are **temporary sessions**, not new groups. This avoids nested group logic and keeps enrollment, assignment and Gradebook consistent.

## Registration
Student registers + live camera photo -> Pending -> Admin reviews profile -> confirms classroom/seat -> selects ONE learning group -> system enrolls the active subjects of that group -> Approved.

## Classroom
Teacher/Admin -> Subject + Learning Group -> Open Class Session -> rotating 6-digit code.
Student -> Login -> enter class code -> backend verifies account + offering + learning group -> Present/Late.
Teacher sees live roster and can close the session.

## Teaching + guarded Digital Worksheet
Subject -> Learning Group -> Unit -> 20 slides -> Digital Worksheet.
Teacher may enable **เฉพาะในห้องเรียน** on an active class session.
Student must have class presence and enter the current class code again on the device used for the worksheet -> temporary access grant -> save/submit.
Closing the class session revokes the grants, so a new remote start/save/submit cannot continue through the secure flow.

## Secure Midterm / Final
Teacher/Admin -> Exam -> Learning Group/Offering -> Open Secure Exam Session -> rotating exam code.
Student -> Login -> enter exam code -> read rules -> fullscreen (when required) -> secure attempt.

Term exam structure:
- Q1-25: content based on taught units.
- Q26-50: analysis/application, difficulty `ยากมาก`.
- Raw score: 0-50.
- Gradebook score: raw/50*20.
- Midterm contributes 20 points; Final contributes 20 points.

## Anti-cheat / exam integrity
- One active device token per attempt.
- Question order shuffled per attempt.
- Choice order shuffled per attempt.
- Answer key remains server-side.
- Server-side timer/expiry; autosave on client.
- Fullscreen exit, hidden tab, window blur, copy, paste and context-menu attempts are recorded.
- Repeated events change attempt integrity status to warning/flagged for teacher review.
- Teacher may explicitly unlock a device after a legitimate failure; the action is audited.
- No automatic mark deduction based solely on one browser event.

## Grading
Teacher/Admin -> Subject + Learning Group -> Gradebook.
Worksheet 40 + Behavior 20 + Midterm 20 + Final 20 = 100 under current grade settings.
Student sees submission/exam status but not scores.

## Mobile
Student phone supports:
1. Classroom code join.
2. Retrospective Paper worksheet copy submission.
Secure exams and main Digital Worksheet work remain Desktop/Tablet oriented.

## Server expiry and second-device enforcement
- Secure attempts autosave from the browser, but expiry enforcement does not depend on the browser: production `pg_cron` finalizes expired attempts every minute using the latest saved answers.
- A second device cannot take over an active attempt. The server retains the original device binding, flags the attempt, and stores a severity-3 integrity event.
- Correct answer IDs are diversified across A/B/C/D when the term exam is built, then the question and choice order are shuffled again per attempt.
