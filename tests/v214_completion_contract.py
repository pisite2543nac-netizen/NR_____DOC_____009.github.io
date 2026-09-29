from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
idx=(ROOT/'site/index.html').read_text(encoding='utf-8')
sw=(ROOT/'site/sw.js').read_text(encoding='utf-8')
meta=(ROOT/'site/release-meta.js').read_text(encoding='utf-8')
js=(ROOT/'site/v21-4-completion.js').read_text(encoding='utf-8')
css=(ROOT/'site/v21-4-completion.css').read_text(encoding='utf-8')
mig=(ROOT/'supabase/migrations/20260929_v21_4_completion_room_group_reporting.sql').read_text(encoding='utf-8')
wf=(ROOT/'.github/workflows/deploy-pages.yml').read_text(encoding='utf-8')

checks={
 'release marker':any(x in idx for x in ['data-docnr-release="v21-4-completion-stable"','data-docnr-release="v22-0-production-recovery"']),
 'v214 css':any(x in idx for x in ['v21-4-completion.css?v=20260929-v21-4','v21-4-completion.css?v=20260929-v22-0']),
 'v214 js':any(x in idx for x in ['v21-4-completion.js?v=20260929-v21-4','v21-4-completion.js?v=20260929-v22-0']),
 'cache marker':any(x in sw for x in ['doc-full-nr-v21-4-completion-stable-20260929','doc-full-nr-v22-0-production-recovery-20260929']),
 'cache asset js':any(x in sw for x in ['./v21-4-completion.js?v=20260929-v21-4','./v21-4-completion.js?v=20260929-v22-0']),
 'cache asset css':any(x in sw for x in ['./v21-4-completion.css?v=20260929-v21-4','./v21-4-completion.css?v=20260929-v22-0']),
 'release meta':any(x in meta for x in ['RELEASE_VERSION="V21.4"','RELEASE_VERSION="V22.0"']),
 'report rpc client':"staff_room_group_report_v214" in js,
 'admin groups rpc':"admin_room_groups_v206" in js,
 'teacher groups rpc':"staff_room_groups_v206" in js,
 'real camera test':'navigator.mediaDevices.getUserMedia' in js,
 'touch acceptance':'onpointerup' in js,
 'pwa diagnostics':'display-mode: standalone' in js,
 'backend diagnostics':"profiles" in js and 'Backend/Profile' in js,
 'code128 diagnostics':'JsBarcode' in js,
 'qr diagnostics':'QRCode' in js,
 'report css':'docnr-v214-modal' in css,
 'tracking table':'admin_room_group_classroom_members' in mig,
 'safe explicit classroom':'preserve_linked_classroom_identity' in mig,
 'room report function':'staff_room_group_report_v214' in mig,
 'room report auth':'grant execute on function public.staff_room_group_report_v214' in mig,
 'workflow static':'python tests/v214_completion_contract.py' in wf,
 'workflow browser':'python tests/v214_completion_browser_contract.py' in wf,
 'workflow node':'node --check site/v21-4-completion.js' in wf,
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(f'{k}: {"PASS" if v else "FAIL"}')
if failed: raise SystemExit('V21.4 completion contract failed: '+', '.join(failed))
print('V21.4 COMPLETION CONTRACT PASS')
