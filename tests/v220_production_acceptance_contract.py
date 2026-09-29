from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
idx=(ROOT/'site/index.html').read_text(encoding='utf-8')
exam=(ROOT/'site/exam.html').read_text(encoding='utf-8')
sw=(ROOT/'site/sw.js').read_text(encoding='utf-8')
meta=(ROOT/'site/release-meta.js').read_text(encoding='utf-8')
app=(ROOT/'site/app.js').read_text(encoding='utf-8')
platform=(ROOT/'site/v16-platform.js').read_text(encoding='utf-8')
runtime=(ROOT/'site/v22-runtime.js').read_text(encoding='utf-8')
css=(ROOT/'site/v22-production.css').read_text(encoding='utf-8')
mig=(ROOT/'supabase/migrations/20260929_v22_0_fix_classroom_teacher_rls_dependency.sql').read_text(encoding='utf-8')
push=(ROOT/'00_PUSH_NEW_GITHUB.bat').read_bytes()
update=(ROOT/'00_UPDATE_EXISTING_GITHUB.bat').read_bytes()
build=(ROOT/'site/RELEASE_BUILD.txt').read_text(encoding='utf-8')
readme=(ROOT/'README_START_HERE.txt').read_text(encoding='utf-8')

checks={
 'release html':'data-docnr-release="v22-0-production-recovery"' in idx,
 'release meta':'RELEASE_VERSION="V22.0"' in meta and 'RELEASE_CACHE="20260929-v22-0"' in meta,
 'v22 css loaded':'v22-production.css?v=20260929-v22-0' in idx,
 'v22 runtime loaded':'v22-runtime.js?v=20260929-v22-0' in idx,
 'exam v22':'data-docnr-release="v22-0-production-recovery"' in exam and 'v22-runtime.js?v=20260929-v22-0' in exam,
 'cache v22':'doc-full-nr-v22-0-production-recovery-20260929' in sw,
 'cache bust current':'?v=20260929-v22-0' in idx and '?v=20260929-v22-0' in exam,
 'profile fail closed':'renderProfileLoadFailure' in app and 'if(!S.profile){renderProfileLoadFailure();return}' in app,
 'fullscreen v22 alias':'DOCNR_V22||window.DOCNR_V21' in app,
 'notification de-dupe':'notificationBadgePromise' in platform and 'now-state.notificationBadgeAt<5000' in platform,
 'runtime route watchdog':'data-v22-retry' in runtime and '12000' in runtime,
 'runtime cache refresh':'safeSwRefresh' in runtime and "k.startsWith('doc-full-nr-')" in runtime,
 'visible redesign':'docnr-v22-release-chip' in css and 'docnr-v22-mobile-nav' in css,
 'backend helper':'create or replace function private.can_read_classroom' in mig.lower(),
 'backend policy helper':'using (private.can_read_classroom(id, auth.uid()))' in mig.lower(),
 'rpc-only preserved':'grant select on public.teacher_teaching_assignments' not in mig.lower(),
 'bat no bom':not push.startswith(b'\xef\xbb\xbf'),
 'bat url sanitizer':b'Markdown copied from chat' in push and b'git ls-remote' in push,
 'existing repo updater no bom':not update.startswith(b'\xef\xbb\xbf'),
 'existing repo safe replace':b'force-with-lease' in update and b'git ls-remote' in update,
 'release build v22':'DOC-FULL-NR|V22.0|2026-09-29|PRODUCTION_RECOVERY_COMPLETE_FULL|FINAL' in build,
 'readme update path':'00_UPDATE_EXISTING_GITHUB.bat' in readme,
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(f'{k}: {"PASS" if v else "FAIL"}')
if failed: raise SystemExit('V22.0 production acceptance contract failed: '+', '.join(failed))
print('V22.0 PRODUCTION ACCEPTANCE CONTRACT PASS')
