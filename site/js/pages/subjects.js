import { rpc } from '../api.js';
import { state } from '../state.js';
import { pageHead, setMain, arr, esc, options, modal, toast, statusPill } from '../ui.js';
import { navigate } from '../router.js';

function subjectCards(rows) {
  return `<div class="card-grid">${arr(rows).map((s) => `
    <article class="subject-card">
      <div class="subject-code">${esc(s.code)}</div>
      <h3>${esc(s.name)}</h3>
      <p>${esc(s.description || 'ยังไม่มีคำอธิบายรายวิชา')}</p>
      <div class="meta-row"><span>ท ${s.theory_hours ?? '-'}</span><span>ป ${s.practice_hours ?? '-'}</span><span>น ${s.credits ?? '-'}</span></div>
      ${arr(s.offerings).map((o) => `<div class="offering"><span>${esc(o.plan_code || 'ไม่ระบุกลุ่ม')}</span><strong>${o.weekly_hours ?? 0} ชม./สัปดาห์</strong></div>`).join('')}
      <button class="btn light full" data-subject-detail="${s.id}">ดูรายละเอียดวิชา</button>
    </article>`).join('')}</div>`;
}

export async function subjectsPage() {
  if (state.profile.role === 'student') {
    const rows = await rpc('clean_my_subjects');
    setMain(pageHead('วิชาของฉัน', 'รายวิชาที่ลงทะเบียนและได้รับอนุมัติแล้ว') + subjectCards(rows));
    bindSubjectDetails();
    return;
  }
  const scope = await rpc('clean_staff_scope');
  const actions = state.profile.role === 'admin' ? '<button class="btn primary" id="addSubject">+ วิชา</button><button class="btn light" id="addClassroom">+ ห้องเรียน</button>' : '';
  setMain(pageHead('รายวิชาและห้องเรียน', 'ภาคเรียน 2/2569', actions) + subjectCards(scope.subjects) + `
    <section class="panel" style="margin-top:18px"><div class="panel-head"><h3>ห้องเรียน</h3></div>
    <div class="table-wrap"><table><thead><tr><th>รหัส</th><th>ชื่อห้อง</th><th>ระดับ</th><th>แผนก/สาขา</th><th>สถานะ</th></tr></thead><tbody>${arr(scope.classrooms).map((c) => `<tr><td>${esc(c.code)}</td><td>${esc(c.name)}</td><td>${esc(c.level || '-')}</td><td>${esc([c.department,c.major].filter(Boolean).join(' / ') || '-')}</td><td>${statusPill(c.active === false ? 'inactive' : 'active')}</td></tr>`).join('')}</tbody></table></div></section>`);
  bindSubjectDetails();
  if (state.profile.role === 'admin') {
    document.querySelector('#addSubject').onclick = addSubjectModal;
    document.querySelector('#addClassroom').onclick = addClassroomModal;
  }
}

function bindSubjectDetails() {
  document.querySelectorAll('[data-subject-detail]').forEach((button) => button.onclick = () => showSubjectDetail(button.dataset.subjectDetail));
}

export async function showSubjectDetail(id) {
  const detail = await rpc('clean_subject_detail', { p_subject_id: id });
  const s = detail.subject || {};
  setMain(pageHead('รายละเอียดวิชา', `${s.code || ''} ${s.name || ''}`, '<button class="btn light" id="backSubjects">← กลับ</button>') + `
    <div class="metric-grid compact"><div class="metric-card"><span>ทฤษฎี</span><strong>${s.theory_hours ?? 0}</strong></div><div class="metric-card"><span>ปฏิบัติ</span><strong>${s.practice_hours ?? 0}</strong></div><div class="metric-card"><span>หน่วยกิต</span><strong>${s.credits ?? 0}</strong></div><div class="metric-card"><span>หน่วยการสอน</span><strong>${arr(detail.teaching_units).length}</strong></div></div>
    <div class="content-grid two" style="margin-top:18px">
      <section class="panel"><div class="panel-head"><h3>คำอธิบายรายวิชา</h3></div><p>${esc(s.description || 'ยังไม่มีรายละเอียด')}</p><h4>กลุ่ม/ภาระสอน</h4>${arr(detail.offerings).length ? arr(detail.offerings).map((o) => `<div class="offering"><span>${esc(o.plan_code || '-')}</span><strong>${o.weekly_hours ?? 0} ชม./สัปดาห์</strong></div>`).join('') : '<div class="empty-state">ยังไม่มีกลุ่ม</div>'}</section>
      <section class="panel"><div class="panel-head"><h3>ห้องที่มีนักศึกษาลงทะเบียน</h3></div>${arr(detail.classrooms).length ? arr(detail.classrooms).map((c) => `<div class="list-row"><div><strong>${esc(c.code)} ${esc(c.name)}</strong><small>${esc(c.department || '')}</small></div></div>`).join('') : '<div class="empty-state">ยังไม่มีข้อมูล</div>'}</section>
    </div>
    <section class="panel" style="margin-top:18px"><div class="panel-head"><h3>17 หน่วยการสอน</h3><button class="btn primary" id="openTeaching">เปิดเนื้อหาการสอน</button></div><div class="unit-mini-grid">${arr(detail.teaching_units).map((u) => `<button class="unit-mini" data-open-unit="${u.id}"><span>หน่วย ${u.unit_no}</span><strong>${esc(u.title)}</strong><small>${u.slide_count || 20} สไลด์ • ใบงาน ${u.worksheet_count || 0}</small></button>`).join('')}</div></section>
    <section class="panel" style="margin-top:18px"><div class="panel-head"><h3>ใบงานของวิชา</h3></div>${arr(detail.worksheets).length ? `<div class="table-wrap"><table><thead><tr><th>ใบงาน</th><th>ประเภท</th><th>สถานะ</th><th>มอบหมาย</th><th>ส่งแล้ว</th></tr></thead><tbody>${arr(detail.worksheets).map((w) => `<tr><td>${esc(w.title)}</td><td>${statusPill(w.mode)}</td><td>${statusPill(w.status)}</td><td>${w.assigned_count ?? 0}</td><td>${w.submitted_count ?? 0}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีใบงาน</div>'}</section>`);
  document.querySelector('#backSubjects').onclick = () => navigate('subjects');
  document.querySelector('#openTeaching').onclick = () => { sessionStorage.setItem('docnr.open.subject', id); navigate('teaching'); };
  document.querySelectorAll('[data-open-unit]').forEach((button) => button.onclick = () => { sessionStorage.setItem('docnr.open.subject', id); sessionStorage.setItem('docnr.open.unit', button.dataset.openUnit); navigate('teaching'); });
}

async function addSubjectModal() {
  modal({ title: 'เพิ่มรายวิชา', body: `
    <div class="form-grid"><label class="field"><span>รหัสวิชา</span><input name="code" required></label><label class="field"><span>ชื่อวิชา</span><input name="name" required></label><label class="field"><span>ทฤษฎี</span><input name="theory" type="number" min="0" value="1"></label><label class="field"><span>ปฏิบัติ</span><input name="practice" type="number" min="0" value="2"></label><label class="field"><span>หน่วยกิต</span><input name="credits" type="number" min="0" value="2"></label><label class="field span2"><span>รายละเอียด</span><textarea name="description"></textarea></label></div>`,
    onSubmit: async (form) => {
      await rpc('clean_admin_save_subject_v2', { p_id: null, p_code: form.get('code'), p_name: form.get('name'), p_description: form.get('description'), p_active: true, p_theory_hours: +form.get('theory'), p_practice_hours: +form.get('practice'), p_credits: +form.get('credits') });
      toast('เพิ่มรายวิชาแล้ว', 'ok'); await subjectsPage();
    },
  });
}

async function addClassroomModal() {
  modal({ title: 'เพิ่มห้องเรียน', body: `
    <div class="form-grid"><label class="field"><span>รหัสห้อง</span><input name="code" required></label><label class="field"><span>ชื่อห้อง</span><input name="name" required></label><label class="field"><span>ระดับ</span><input name="level"></label><label class="field"><span>ห้อง/กลุ่ม</span><input name="room_label"></label><label class="field"><span>แผนก</span><input name="department"></label><label class="field"><span>สาขา</span><input name="major"></label></div>`,
    onSubmit: async (form) => {
      await rpc('clean_admin_save_classroom', { p_id: null, p_code: form.get('code'), p_name: form.get('name'), p_level: form.get('level'), p_room_label: form.get('room_label'), p_department: form.get('department'), p_major: form.get('major'), p_active: true });
      toast('เพิ่มห้องเรียนแล้ว', 'ok'); await subjectsPage();
    },
  });
}
