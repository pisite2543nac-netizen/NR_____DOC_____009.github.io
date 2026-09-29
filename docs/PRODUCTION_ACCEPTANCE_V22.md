# DOC-FULL-NR V22.0 Production Recovery — Acceptance Record

Date: 2026-09-29

## Why V22.0 exists
V21.4 R2 passed static/mock browser contracts but did not prove the deployed production flows. Production logs later showed real HTTP 403 responses while the app was reading `classrooms` and `attendance_sessions`. PostgreSQL logs identified the concrete cause: the `classrooms_read` RLS policy queried `teacher_teaching_assignments` directly after that table had intentionally been hardened to RPC-only access.

## Observed production evidence
In the production log window inspected before the fix, the only HTTP 4xx/5xx application endpoints observed were:
- `GET /rest/v1/classrooms` → HTTP 403 (4 requests)
- `GET /rest/v1/attendance_sessions` → HTTP 403 (2 requests)

PostgreSQL logs identified the common error as `permission denied for table teacher_teaching_assignments`. The affected authenticated session was an approved active Admin account, which confirms the failure came from policy evaluation rather than missing UI role assignment.

## Production backend correction
V22.0 adds `private.can_read_classroom(uuid, uuid)` as a `SECURITY DEFINER` authorization helper and rewrites `classrooms_read` to call that helper. The RPC-only protection on `teacher_teaching_assignments` is retained; the fix does **not** grant direct SELECT access to that table.

Migration: `supabase/migrations/20260929_v22_0_fix_classroom_teacher_rls_dependency.sql`

The migration has also been applied to Supabase project `DOC-FULL-NR-UNIVERSAL` (`thjscmfqunlaqxlievna`).

## Frontend recovery changes
- New V22.0 adaptive visual layer and release identity.
- All active shell/exam assets use a V22.0 cache-bust key.
- Service worker uses a new V22.0 cache and removes stale DOC-FULL-NR caches.
- Profile loading now fails closed: a valid Auth session can no longer silently fall back to a generic student/user role when profile loading fails.
- Notification badge requests are de-duplicated/throttled to avoid repeated HEAD traffic during rapid DOM refreshes.
- Route watchdog provides Retry/Home recovery instead of leaving a page indefinitely stuck in a loading state.
- GitHub push `.bat` files are UTF-8 without BOM and accept both raw GitHub URLs and Markdown-style copied links.
- Exam Center now shares the V22.0 runtime/cache/design layer.

## Verification meaning
CI/static/browser contracts prove source integrity, route/runtime integration, responsive behavior contracts, and backward compatibility. Live Supabase inspection additionally proves that the production project, migrations, buckets, Edge Functions and referenced RPC surface are present. These checks do not claim that every destructive role action was manually clicked with every real user account; production acceptance should continue to use the built-in real-device diagnostics and server logs after deployment.


## Verification performed for V22.0
- Full static regression contracts for historical releases through V22.0 pass.
- JavaScript syntax checks for all active runtime files pass.
- Browser contracts pass for core routing, course code, real-use shell, exam, print, programming activity, slides, phone/tablet/desktop adaptive UI, camera flow, late-attendance barcode, Room Group, V21.4 completion and V22.0 recovery runtime.
- Supabase migration list includes `v22_0_fix_classroom_teacher_rls_dependency`.
- `authenticated` can execute the private classroom authorization helper while direct SELECT on `teacher_teaching_assignments` remains disabled.
- Production Edge Functions are active and required Storage buckets remain private.
