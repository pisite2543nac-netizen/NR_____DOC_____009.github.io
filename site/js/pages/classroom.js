import { rpc, friendlyError } from '../api.js';
import { state } from '../state.js';
import { deviceToken } from '../security.js';
import { pageHead, setMain, arr, esc, statusPill, modal, options, toast, fmt } from '../ui.js';
import { navigate } from '../router.js';

let liveTimer = null;
function stopLive(){ if(liveTimer){clearInterval(liveTimer);liveTimer=null;} }

export async function classroomPage() {
  stopLive();
  if (state.profile.role === 'student') return studentClassroom();
  return staffClassroom();
}

async function staffClassroom() {
  const [scope, sessions] = await Promise.all([rpc('clean_staff_scope'), rpc('clean_class_sessions_staff')]);
  const openCount = arr(sessions).filter((x)=>x.status==='open').length;
  setMain(pageHead('ห้องเรียน', 'เปิดคาบเรียนด้วยรหัส 6 หลักที่เปลี่ยนอัตโนมัติ และใช้เป็นหลักฐานการอยู่ในห้องสำหรับใบงานดิจิทัล', '<button class="btn primary" id="openClass">+ เปิดห้องเรียน</button>') + `
    <div class="metric-grid"><div class="metric"><span>ห้องที่กำลังเปิด</span><strong>${openCount}</strong></div><div class="metric"><span>รูปแบบกลุ่ม</span><strong>1 กลุ่ม → หลายวิชา</strong></div><div class="metric"><span>รหัสเข้าห้อง</span><strong>หมุนอัตโนมัติ</strong></div></div>
    <section class="panel"><div class="panel-head"><h3>คาบเรียนล่าสุด</h3></div><div class="table-wrap"><table><thead><tr><th>รายวิชา</th><th>กลุ่มเรียน</th><th>เริ่ม</th><th>เข้าแล้ว</th><th>สถานะ</th><th></th></tr></thead><tbody>${arr(sessions).map((s)=>`<tr><td><strong>${esc(s.subject_code||'')} ${esc(s.subject_name||'')}</strong><small>${esc(s.title||'คาบเรียน')}</small></td><td>${esc(s.group_code||'-')}</td><td>${fmt(s.started_at)}</td><td>${s.joined_count??0}/${s.roster_count??0}</td><td>${statusPill(s.status)}</td><td><button class="btn ${s.status==='open'?'primary':'light'} sm" data-live="${s.id}">${s.status==='open'?'คุมห้อง':'ดูรายการ'}</button></td></tr>`).join('')}</tbody></table></div></section>`);
  document.querySelector('#openClass').onclick = () => openClassModal(scope);
  document.querySelectorAll('[data-live]').forEach((b)=>b.onclick=()=>classLive(b.dataset.live));
}

function openClassModal(scope) {
  const subjects = arr(scope.subjects).filter((s)=>arr(s.offerings).length);
  modal({title:'เปิดห้องเรียน',body:`<div class="form-grid"><label class="field"><span>รายวิชา</span><select name="subject" id="classSubject">${options(subjects,'id',(s)=>`${s.code} ${s.name}`)}</select></label><label class="field"><span>กลุ่มเรียน</span><select name="offering" id="classOffering"></select></label><label class="field span2"><span>ชื่อคาบ / หมายเหตุ</span><input name="title" placeholder="เช่น หน่วยที่ 5 ฝึกปฏิบัติ"></label><label class="field"><span>ถือว่าเข้าสายหลัง</span><input name="late" type="number" min="0" max="180" value="15"><small>นาที</small></label><label class="field"><span>รหัสเปลี่ยนทุก</span><select name="period"><option value="180">3 นาที</option><option value="300" selected>5 นาที</option><option value="600">10 นาที</option></select></label></div><div class="notice-card"><strong>ไม่สร้างกลุ่มใหม่</strong><p>ห้องเรียนนี้เป็นคาบเรียนชั่วคราวของ “รายวิชา + กลุ่มเรียน” เท่านั้น รายชื่อนักศึกษายังคงมาจากกลุ่มเรียนหลักเดิม</p></div>`,submitLabel:'เปิดห้องเรียน',onSubmit:async(form)=>{
    const r=await rpc('clean_class_session_open',{p_offering_id:form.get('offering'),p_title:form.get('title'),p_late_after_minutes:Number(form.get('late')||15),p_code_period_seconds:Number(form.get('period')||300)});
    toast('เปิดห้องเรียนแล้ว','ok'); await classLive(r.session_id);
  }});
  const subj=document.querySelector('#classSubject'), off=document.querySelector('#classOffering');
  const draw=()=>{const s=subjects.find((x)=>x.id===subj.value)||subjects[0];off.innerHTML=arr(s?.offerings).map((o)=>`<option value="${esc(o.id)}">${esc(o.plan_code||'-')} • ${o.enrolled_count??0} คน</option>`).join('');};
  subj.onchange=draw;draw();
}

async function classLive(id) {
  stopLive();
  const load=async()=>{
    const data=await rpc('clean_class_session_live',{p_session_id:id});
    const s=data.session||{}, students=arr(data.students);
    if (!document.querySelector('#classLiveRoot')) {
      const worksheets=arr(await rpc('clean_staff_worksheets')).filter((w)=>w.mode==='digital'&&w.status==='published'&&w.offering_id===s.offering_id);
      setMain(pageHead('คุมห้องเรียน','รหัสจะเปลี่ยนอัตโนมัติตามช่วงเวลา','<button class="btn light" id="backClass">← กลับ</button>'+(s.status==='open'?'<button class="btn danger" id="closeClass">ปิดห้องเรียน</button>':''))+`<div id="classLiveRoot"></div><section class="panel" style="margin-top:18px"><div class="panel-head"><h3>ใบงานดิจิทัลของคาบนี้</h3></div>${worksheets.length?`<div class="assessment-list">${worksheets.map((w)=>`<div class="assessment-row"><div><strong>${esc(w.title)}</strong><small>${w.requires_class_presence&&w.presence_session_id===s.id?'ล็อกเฉพาะห้องเรียนนี้':'ยังไม่ล็อกกับห้องเรียน'}</small></div><button class="btn ${w.requires_class_presence&&w.presence_session_id===s.id?'ok':'primary'} sm" data-gate="${w.id}" data-on="${w.requires_class_presence&&w.presence_session_id===s.id}">${w.requires_class_presence&&w.presence_session_id===s.id?'เปิดในห้องแล้ว':'เปิดทำเฉพาะในห้อง'}</button></div>`).join('')}</div>`:'<div class="empty-state">ยังไม่มีใบงานดิจิทัลที่เผยแพร่สำหรับกลุ่มนี้</div>'}</section>`);
      document.querySelector('#backClass').onclick=()=>navigate('classroom');
      if(document.querySelector('#closeClass')) document.querySelector('#closeClass').onclick=async()=>{if(!confirm('ยืนยันปิดห้องเรียน? สิทธิ์ทำใบงานของคาบนี้จะถูกยกเลิก'))return;await rpc('clean_class_session_close',{p_session_id:id});toast('ปิดห้องเรียนแล้ว','ok');navigate('classroom');};
      document.querySelectorAll('[data-gate]').forEach((b)=>b.onclick=async()=>{const on=b.dataset.on==='true';await rpc('clean_worksheet_presence_setting',{p_worksheet_id:b.dataset.gate,p_required:!on,p_session_id:!on?id:null});toast(!on?'เปิดระบบกันทำใบงานทางไกลแล้ว':'ยกเลิกการล็อกห้องเรียนแล้ว','ok');await classLive(id);});
    }
    const box=document.querySelector('#classLiveRoot'); if(!box)return;
    box.innerHTML=`<div class="content-grid two"><section class="panel class-code-card"><span>รหัสเข้าห้องเรียน</span><strong>${esc(data.code||'------')}</strong><small>เปลี่ยนรหัสอัตโนมัติ • หมดรอบ ${fmt(data.code_expires_at)}</small></section><section class="panel"><div class="detail-grid"><div><span>รายวิชา</span><strong>${esc(`${data.subject_code||''} ${data.subject_name||''}`.trim()||'-')}</strong></div><div><span>เข้าแล้ว</span><strong>${students.filter((x)=>x.status!=='absent').length}/${students.length}</strong></div><div><span>ตรงเวลา</span><strong>${students.filter((x)=>x.status==='present').length}</strong></div><div><span>เข้าสาย</span><strong>${students.filter((x)=>x.status==='late').length}</strong></div></div></section></div><section class="panel" style="margin-top:18px"><div class="panel-head"><h3>รายชื่อนักศึกษา</h3><small>อัปเดตอัตโนมัติ</small></div><div class="table-wrap"><table><thead><tr><th>รหัส</th><th>ชื่อ</th><th>สถานะ</th><th>เวลาเข้า</th><th>สัญญาณล่าสุด</th></tr></thead><tbody>${students.map((x)=>`<tr><td>${esc(x.student_code||'')}</td><td>${esc(x.full_name||'')}</td><td>${statusPill(x.status)}</td><td>${fmt(x.joined_at)}</td><td>${fmt(x.last_seen_at)}</td></tr>`).join('')}</tbody></table></div></section>`;
  };
  await load();
  liveTimer=setInterval(async()=>{if(state.route!=='classroom'){stopLive();return;}try{await load();}catch{}},5000);
}

async function studentClassroom() {
  setMain(pageHead('เข้าห้องเรียน','กรอกรหัส 6 หลักที่ครูแสดงในห้อง รหัสจะเปลี่ยนอัตโนมัติ')+`<div class="class-join-wrap"><section class="panel class-join-card"><div class="join-icon">⌨️</div><h2>รหัสเข้าห้องเรียน</h2><p>ต้องเข้าสู่ระบบด้วยบัญชีของตนเองและอยู่ในกลุ่มเรียนของรายวิชานั้น</p><form id="joinClassForm"><input class="code-input" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="000000" required><button class="btn primary full" type="submit">เข้าห้องเรียน</button></form><div id="joinClassResult"></div></section></div>`);
  document.querySelector('#joinClassForm').onsubmit=async(e)=>{e.preventDefault();const btn=e.currentTarget.querySelector('button');btn.disabled=true;try{const r=await rpc('clean_class_join',{p_code:e.currentTarget.code.value,p_device_token:deviceToken()});const subjects=arr(await rpc('clean_my_subjects'));const s=subjects.find((x)=>x.id===r.subject_id);document.querySelector('#joinClassResult').innerHTML=`<div class="success-inline"><strong>เข้าห้องเรียนสำเร็จ</strong><br>${esc(s?`${s.code} ${s.name}`:'รายวิชาของคุณ')} • ${r.status==='late'?'เข้าสาย':'ตรงเวลา'}</div>`;toast('เข้าห้องเรียนสำเร็จ','ok');}catch(err){document.querySelector('#joinClassResult').innerHTML=`<div class="error-inline">${esc(friendlyError(err))}</div>`;}finally{btn.disabled=false;}};
}
