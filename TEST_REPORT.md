# TEST REPORT — CLEAN V1.5.1 SCORE RUBRIC

Build: `CLEAN-V1.5.1-SCORE-RUBRIC-40-20-20-20-SEM2-2569`

## Backend Production
PASS
- `clean_health()` = version 1.5.1 / grade_total 100
- `clean_system_acceptance()` = PASS
- Clean tables RLS = 37/37
- Grade settings fixed 40/20/20/20 = 13/13 subjects
- Midterm = 13 exams × 50 questions × 20 points
- Final = 13 exams × 50 questions × 20 points
- Behavior split = automatic punctuality 10 + teacher judgment 10
- Teacher behavior columns present: teacher_score / teacher_note / teacher_scored_at
- `clean_behavior_teacher_set` executable by authenticated/service roles only; anon revoked
- Student direct behavior-score RLS read removed
- Behavior score FK indexes added

## Gradebook Rules
PASS
- Worksheet score max = 40
- Assigned worksheets are the denominator; missing/ungraded work contributes 0
- Automatic behavior 10 = only when ALL assigned worksheets are submitted on/before due_at
- Teacher behavior = 0–10 with note and audit log
- Behavior total max = 20
- Midterm max = 20
- Final max = 20
- Total max = 100

## Frontend
PASS
- Release Gate
- JavaScript syntax gate
- Admin browser smoke
- Teacher browser smoke
- Student browser smoke
- Gradebook shows worksheet / punctuality / teacher behavior / behavior total / midterm / final / total
- Teacher behavior scoring modal present
- Student score visibility remains disabled

## Preserved V1.5 Functions
PASS
- Classroom rotating code
- Classroom Presence Gate for Digital Worksheets
- Secure Exam room code
- One-device exam attempt
- Question/option shuffle
- Exam integrity events
- Server expiry auto-submit
- One Student -> One Learning Group -> Many Subjects
