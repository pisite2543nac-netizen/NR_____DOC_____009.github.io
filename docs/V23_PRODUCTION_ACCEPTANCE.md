# DOC-FULL-NR V23 Production Acceptance

V23 replaces the deployed presentation/runtime layer instead of layering more patches on the legacy site.

## Runtime architecture
- GitHub Pages deploys only `site/`.
- Deployed runtime is exactly `index.html`, `styles.css`, `app.js`.
- Routing uses hash routes so GitHub Pages subpath navigation does not require server rewrites.
- No mobile camera runtime.
- No PWA service worker registration.
- No legacy stacked V16-V22 UI runtime scripts.
- Startup removes old DOC-FULL-NR service-worker registrations/caches when V23 loads.

## Supported device policy
- Tablet/Computer: supported.
- Phone (<768px): intentionally blocked in V23 by product decision.

## Core operational flows in the V23 console
- Authentication with email, student code, or local username identity.
- Admin/Teacher dashboard.
- Attendance session create/close, roster, manual status update.
- Teaching plan by subject.
- Teacher/Admin worksheet workspace through V23 scoped RPCs: list/create/edit/publish/print.
- Exam preset create/publish/delete, attempts, and manual grading.
- Submission queue/detail/grading.
- Gradebook + CSV export.
- Admin users, classrooms, subjects.
- Teacher assignment management by subject/classroom.
- Admin room groups: member replace, subject bind, numbering, sync.
- Student published worksheets, digital submission, and paper printing.
- Student exam start/save/submit.
- Profile display is read-only for ordinary users to avoid RLS-blocked fake save actions.

## Production backend recovery
- V22 RLS fix prevents classroom reads from directly depending on RPC-only `teacher_teaching_assignments`.
- V23 staff worksheet RPCs provide teacher/admin worksheet operations without bypassing teacher subject/classroom scope.

## Acceptance limitation
This package is statically validated and JavaScript syntax-checked. Production Supabase migrations are applied and grants verified. Final acceptance still requires a real browser/user-account pass after GitHub Pages deploy; the build is not labeled 100% complete before that real-device check.
