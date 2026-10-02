# TEST REPORT — CLEAN V1.5.2 UI FIX

Frontend Build: `CLEAN-V1.5.2-EXAM-MODAL-UI-FIX-SEM2-2569`
Backend Build: `CLEAN-V1.5.1-SCORE-RUBRIC-40-20-20-20-SEM2-2569`

## Scope
V1.5.2 changes frontend layout only. No backend schema/RPC changes were applied.

## UI defect fixed
PASS
- Open Exam Room modal fullscreen checkbox text stays horizontal.
- Checkbox content width is no longer forced to the 30px status-icon size.
- One-device notice renders below the fullscreen option without overlap.
- Registration settings checkbox cards use the same dedicated form layout.
- CSS and JS URLs use `v=1.5.2` cache-busting.

## Browser layout test
PASS at 992 × 823
- `.form-check-card > span` width > 500px.
- computed `writing-mode = horizontal-tb`.
- one-device notice Y position is below the checkbox-card bottom edge.

## Release checks
PASS
- Python release gate
- JavaScript syntax checks
- Admin browser smoke
- Teacher browser smoke
- Student browser smoke
- Student mobile smoke
- Existing Classroom / Worksheet Presence / Secure Exam / Gradebook flows retained.

## Backend
Unchanged from V1.5.1:
- score rubric 40 + 20 + 20 + 20
- behavior 10 automatic + 10 teacher
- secure exam anti-cheat runtime
- classroom presence and worksheet gate
