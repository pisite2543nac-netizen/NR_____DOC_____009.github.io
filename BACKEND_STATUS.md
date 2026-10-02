# Backend Status — CLEAN V1.5

Build: `CLEAN-V1.5-CLASSROOM-SECURE-EXAM-SEM2-2569`

- Clean tables: 37 / RLS enabled: 37
- Anonymous Clean RPC executable: 0
- Subjects: 13
- Teaching units: 221
- Virtual slides: 4,420
- Unit worksheet templates: 221
- Unit exam templates: 221
- Midterm templates: 13 / all 50 questions / 20 points
- Final templates: 13 / all 50 questions / 20 points
- Canonical learning groups: 6
- Learning model: one student -> one learning group -> many subjects
- Registration camera: private storage
- Student score visibility: disabled
- Legacy Attendance / QR runtime: disabled
- Classroom Presence runtime: enabled
- Secure Exam runtime: enabled
- Worksheet Presence Gate: enabled

## New production tables
- `clean_class_sessions`
- `clean_class_presence`
- `clean_worksheet_access_grants`
- `clean_exam_sessions`
- `clean_exam_entry_grants`
- `clean_exam_integrity_events`

All new exposed-schema tables have RLS enabled and direct client table privileges are revoked. Access is through authenticated RPCs with server-side role/scope checks.

## Secure runtime
- Rotating classroom/exam code is derived server-side from a private session secret and time bucket.
- Secure term exam attempts are one-device and use persisted randomized question/option payloads.
- Raw exam score 0-50 is stored separately from the scaled gradebook score 0-20.
- Integrity events record fullscreen/focus/copy/paste/context-menu events for teacher review.
- Gated Digital Worksheets require class presence + current class code + active class session.
- Legacy non-secure RPCs reject attempts to bypass secure term exams or gated worksheets.

## Security audit
- Production verification: 37/37 Clean tables RLS.
- Production verification: anonymous Clean RPC count = 0.
- Legacy anonymous `staff_*_v23` worksheet SECURITY DEFINER RPC access found by advisor was revoked.
- Supabase advisor still reports informational RLS-without-policy notices for RPC-only tables; direct table privileges are intentionally revoked so those tables default-deny through RLS.

## V1.5 final hardening
- Correct choice IDs are diversified among `A/B/C/D` when term exams are built; the correct option is not a fixed client-visible position.
- Each secure attempt still receives an independently shuffled question and option order persisted to `question_payload`.
- A server-side `pg_cron` job (`clean-v15-secure-exam-expiry`) checks every minute and submits the latest saved answers when an attempt/session has expired.
- Second-device attempts are blocked and persist a severity-3 `second_device` integrity event instead of silently rolling the evidence back.
- Teacher device unlock remains explicit and audited; integrity events are evidence for review, not an automatic cheating verdict.
