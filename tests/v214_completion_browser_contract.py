import os, sys, tempfile, threading
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

if os.environ.get('DOCNR_RUN_BROWSER_CONTRACT')!='1':
    print('V21.4 COMPLETION BROWSER CONTRACT SKIP (set DOCNR_RUN_BROWSER_CONTRACT=1)')
    raise SystemExit(0)
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    raise SystemExit(f'playwright required: {e}')

ROOT=Path(__file__).resolve().parents[1]
script=(ROOT/'site/v21-4-completion.js').read_text(encoding='utf-8')
css=(ROOT/'site/v21-4-completion.css').read_text(encoding='utf-8')

html=f'''<!doctype html><html data-app-route="dashboard" data-role="admin"><head><meta charset="utf-8"><style>{css}</style></head><body>
<div class="v1610-dashboard-hero"><h1>Dashboard</h1></div><main id="content"></main>
<script>
const fakeSession={{user:{{id:'11111111-1111-1111-1111-111111111111'}}}};
const fakeGroup={{id:'g1',code:'A1',name:'กลุ่ม A',classroom_id:'c1',classroom_name:'ห้อง 1',member_count:1}};
const fakeBindings=[{{subject_id:'s1',subject_code:'S01',subject_name:'วิชา 1',active:true}}];
const fakeReport={{ok:true,group:fakeGroup,bindings:fakeBindings,members:[{{user_id:'u1',student_code:'001',full_name:'Student One',seat_number:1}}],subject_id:'s1',grade_rows:[{{user_id:'u1',student_code:'001',full_name:'Student One',completed_work_count:17,work_score:40,behavior_score:20,midterm_score:20,final_score:20,total_score:100,grade_value:4,pass_status:'ผ่าน'}}],attendance_rows:[{{user_id:'u1',student_code:'001',full_name:'Student One',total_sessions:2,present_count:1,late_count:1,absent_count:0,excused_count:0,attendance_percent:100}}],exams:[]}};
function result(data,error=null){{return Promise.resolve({{data,error}})}}
window.DOCNR_SUPABASE_SINGLETON={{
 auth:{{getSession:()=>Promise.resolve({{data:{{session:fakeSession}}}})}},
 from:(t)=>({{select:()=>({{eq:()=>({{maybeSingle:()=>result({{role:'admin',active:true,approval_status:'approved'}})}})}})}}),
 rpc:(name,args)=>{{
  if(name==='admin_room_groups_v206') return result([fakeGroup]);
  if(name==='admin_room_group_bindings_v206') return result(fakeBindings);
  if(name==='staff_room_group_report_v214') return result(fakeReport);
  if(name==='my_teacher_assignments_v206') return result([]);
  return result(null,{{message:'unexpected rpc '+name}});
 }}
}};
window.DOCNR_DEVICE_RUNTIME={{classify:()=> 'phone'}};
window.QRCode=function(){{}};window.JsBarcode=function(){{}};window.jsQR=function(){{}};
</script><script>{script}</script></body></html>'''

with sync_playwright() as p:
    exe='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None
    b=p.chromium.launch(headless=True,executable_path=exe)
    page=b.new_page(viewport={'width':390,'height':844})
    errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='load');page.wait_for_timeout(250)
    assert page.locator('[data-v214-diagnostics]').count()==1, 'diagnostic button missing'
    page.locator('[data-v214-diagnostics]').click();page.wait_for_timeout(150)
    assert page.locator('#docnr-v214-overlay').count()==1, 'diagnostic overlay missing'
    assert 'ทดสอบอุปกรณ์จริง' in page.locator('#docnr-v214-overlay').inner_text()
    page.locator('[data-v214-close]').click();page.wait_for_timeout(80)
    assert page.locator('#docnr-v214-overlay').count()==0, 'diagnostic overlay did not close'

    page.evaluate("document.documentElement.dataset.appRoute='roomgroups'; document.querySelector('#content').innerHTML='<article class=\"v205-group-card\"><div class=\"docnr-card-actions\"><button data-v205-group-roster=\"g1\">สมาชิก</button></div></article>'")
    page.wait_for_timeout(250)
    assert page.locator('[data-v214-group-report="g1"]').count()==1, 'group report action missing'
    page.locator('[data-v214-group-report="g1"]').click();page.wait_for_timeout(300)
    assert 'รายงานและตัวกรองกลุ่มห้อง' in page.locator('#docnr-v214-overlay').inner_text()
    assert page.locator('#v214-group').input_value()=='g1'
    assert page.locator('#v214-subject option').count()>=2
    assert not errors, 'page errors: '+str(errors)
    b.close()
print('V21.4 COMPLETION BROWSER CONTRACT PASS')
