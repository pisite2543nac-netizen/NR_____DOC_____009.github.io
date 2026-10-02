# TEST REPORT — CLEAN V1.5

## Backend production verification — PASS
- Clean tables RLS: 37/37.
- Anonymous Clean RPC executable: 0.
- Midterm: 13/13 have 50 questions, full score 20, one attempt.
- Final: 13/13 have 50 questions, full score 20, one attempt.
- Q1 category = เนื้อหา; Q26 category = คิดวิเคราะห์ / ยากมาก in sampled term exams.
- New Classroom / Worksheet Gate / Secure Exam tables exist.
- Legacy anonymous `staff_*_v23` worksheet RPC access revoked.

## Backend transactional E2E — PASS / ROLLBACK
A production transaction created temporary test state and rolled it back after assertions:
- assign one existing student to a test offering/group
- Admin opens class session -> receives 6-digit rotating code
- Student joins -> Present/Late accepted
- create temporary Digital Worksheet -> enable class-presence gate
- Student receives secure worksheet grant -> submits successfully
- Admin opens Secure Midterm session -> receives 6-digit rotating exam code
- Student enters code -> starts one-device secure attempt
- attempt receives 50 randomized questions
- integrity event is accepted
- secure submit stores raw max 50 and scaled max 20
- transaction rolled back; no test records retained

## Frontend — PASS
- `tests/release_gate.py`: RELEASE_GATE_PASS
- JavaScript syntax gate: PASS
- Admin desktop browser smoke: PASS
- Teacher desktop browser smoke: PASS
- Student desktop browser smoke: PASS
- Mobile student browser smoke: PASS
- Classroom menu/routes: PASS
- Secure Exam page/routes: PASS
- Registration camera/consent layout: PASS
- Learning group + Gradebook regression checks: PASS

## Security / limitations
- Browser integrity controls deter and document common in-browser actions but cannot guarantee prevention of photographing the screen with another device.
- Integrity events are evidence for teacher review and are not treated as automatic proof of cheating.
- New RPC-only security tables intentionally have RLS enabled without direct row policies; client table privileges are revoked and access is through scoped authenticated RPCs.

## Final anti-cheat transactional tests — PASS / ROLLBACK
- Second-device test: device 1 starts the attempt; device 2 is blocked; original device remains bound; violation count increments; `second_device` severity-3 event persists; transaction rolled back.
- Server-expiry test: one correct answer was autosaved, attempt expiry was forced, server finalizer submitted it, stored raw `1/50` and scaled `0.40/20`, wrote `SECURE_EXAM_AUTO_SUBMIT_EXPIRED`, then the transaction was rolled back.
- Correct-answer IDs were sampled after rebuild and are distributed among A/B/C/D; all 50 questions keep four unique option IDs.
- Production cron verified active: `clean-v15-secure-exam-expiry`, every minute.
