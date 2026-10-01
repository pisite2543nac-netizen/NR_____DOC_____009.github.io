import { rpc } from '../api.js';
import { state } from '../state.js';
import { pageHead, setMain, arr, esc, statusPill, modal, options, toast, fmt, dateInput, saveLocalDraft, loadLocalDraft, clearLocalDraft } from '../ui.js';
import { navigate } from '../router.js';

let staffScope = null;
let staffRows = [];

export async function worksheetsPage() {
  if (state.profile.role === 'student') return studentWorksheets();
  [staffScope, staffRows] = await Promise.all([rpc('clean_staff_scope'), rpc('clean_staff_worksheets')]);
  setMain(pageHead('ใบงาน', 'Digital และ Paper Worksheet • มี Preview ก่อน Publish', '<button class="btn primary" id="newWorksheet">+ สร้างใบงาน</button>') + `
    <div class="table-wrap"><table><thead><tr><th>ใบงาน</th><th>วิชา/ห้อง</th><th>ประเภท</th><th>สถานะ</th><th>มอบหมาย/ส่ง</th><th>จัดการ</th></tr></thead><tbody>${arr(staffRows).map((w) => `<tr><td><strong>${esc(w.title)}</strong><small>${esc(w.instructions || '')}</small></td><td>${esc(w.subject_code)} ${esc(w.subject_name)}<small>${esc(w.classroom_name || 'ทุกห้อง')}</small></td><td>${statusPill(w.mode)}</td><td>${statusPill(w.status)}<small>${fmt(w.open_at)} → ${fmt(w.due_at)}</small></td><td>${w.assigned_count ?? 0} / ${w.submitted_count ?? 0}</td><td class="actions-cell"><button class="btn light sm" data-detail="${w.id}">รายละเอียด</button>${w.status === 'draft' ? `<button class="btn primary sm" data-publish="${w.id}">Publish</button>` : ''}${w.mode === 'paper' && ['published','closed'].includes(w.status) ? `<button class="btn light sm" data-paper="${w.id}">ลงคะแนน Paper</button><button class="btn ${w.allow_mobile_copy ? 'ok' : 'light'} sm" data-mobile="${w.id}" data-enabled="${w.allow_mobile_copy}">${w.allow_mobile_copy ? 'มือถือ: เปิด' : 'เปิดส่งย้อนหลัง'}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`);
  document.querySelector('#newWorksheet').onclick = createWorksheetModal;
  document.querySelectorAll('[data-detail]').forEach((b) => b.onclick = () => showWorksheetDetail(b.dataset.detail, true));
  document.querySelectorAll('[data-publish]').forEach((b) => b.onclick = () => publishPreview(b.dataset.publish));
  document.querySelectorAll('[data-paper]').forEach((b) => b.onclick = () => paperRoster(b.dataset.paper));
  document.querySelectorAll('[data-mobile]').forEach((b) => b.onclick = () => mobileSetting(b.dataset.mobile, b.dataset.enabled === 'true'));
}

function createWorksheetModal() {
  const draft = loadLocalDraft('worksheet.new')?.value || {};
  const view = modal({ title: 'สร้างใบงาน', wide: true, body: `
    <div class="form-grid"><label class="field"><span>รายวิชา</span><select name="subject">${options(staffScope.subjects, 'id', (x) => `${x.code} ${x.name}`, draft.subject)}</select></label><label class="field"><span>ห้องเรียน</span><select name="classroom"><option value="">ทุกห้องในวิชา</option>${options(staffScope.classrooms, 'id', (x) => `${x.code || ''} ${x.name}`, draft.classroom)}</select></label><label class="field span2"><span>ชื่อใบงาน</span><input name="title" value="${esc(draft.title || '')}" required></label><label class="field"><span>ประเภท</span><select name="mode"><option value="digital" ${draft.mode === 'digital' ? 'selected' : ''}>Digital</option><option value="paper" ${draft.mode === 'paper' ? 'selected' : ''}>Paper</option></select></label><label class="field"><span>จำนวนครั้งสูงสุด</span><input name="attempts" type="number" min="1" max="20" value="${draft.attempts || 1}"></label><label class="field span2"><span>คำสั่ง</span><textarea name="instructions" rows="3">${esc(draft.instructions || '')}</textarea></label><label class="field span2"><span>Questions JSON</span><textarea name="questions" rows="10">${esc(draft.questions || '[{"id":"q001","type":"short","prompt":"อธิบายคำตอบของคุณ","points":10}]')}</textarea></label></div><div class="autosave-note" id="autosaveNote">บันทึกร่างอัตโนมัติในเครื่องเมื่อกรอกข้อมูล</div>`,
    submitLabel: 'บันทึก Draft',
    onSubmit: async (form) => {
      const questions = JSON.parse(form.get('questions') || '[]');
      await rpc('clean_worksheet_save', { p_id: null, p_subject_id: form.get('subject'), p_classroom_id: form.get('classroom') || null, p_title: form.get('title'), p_description: null, p_instructions: form.get('instructions'), p_mode: form.get('mode'), p_questions: questions, p_open_at: null, p_due_at: null, p_allow_late: false, p_allow_resubmit: false, p_max_attempts: Number(form.get('attempts') || 1) });
      clearLocalDraft('worksheet.new'); toast('สร้างใบงาน Draft แล้ว', 'ok'); await worksheetsPage();
    },
  });
  const form = document.querySelector('#modalForm');
  form.addEventListener('input', () => {
    const fd = new FormData(form);
    saveLocalDraft('worksheet.new', Object.fromEntries(fd.entries()));
    const note = document.querySelector('#autosaveNote'); if (note) note.textContent = `บันทึกร่างในเครื่องล่าสุด ${new Date().toLocaleTimeString('th-TH')}`;
  });
  return view;
}

async function publishPreview(id) {
  const preview = await rpc('clean_worksheet_publish_preview', { p_worksheet_id: id });
  const students = arr(preview.students);
  const now = new Date(); const due = new Date(Date.now() + 7 * 86400000);
  modal({ title: 'ตรวจสอบก่อน Publish', wide: true, body: `
    <div class="confirm-summary"><div><span>ใบงาน</span><strong>${esc(preview.worksheet?.title || '')}</strong></div><div><span>วิชา</span><strong>${esc(preview.subject?.code || '')} ${esc(preview.subject?.name || '')}</strong></div><div><span>ห้อง</span><strong>${esc(preview.classroom?.name || 'ทุกห้อง')}</strong></div><div><span>ผู้มีสิทธิ์ได้รับงาน</span><strong>${preview.eligible_count ?? 0} คน</strong></div></div>
    <div class="student-preview">${students.slice(0,30).map((s) => `<span>${esc(s.student_code || '')} ${esc(s.full_name || '')}</span>`).join('')}${students.length > 30 ? `<strong>และอีก ${students.length - 30} คน</strong>` : ''}</div>
    <div class="form-grid"><label class="field"><span>เปิดงาน</span><input name="open" type="datetime-local" value="${dateInput(now)}" required></label><label class="field"><span>กำหนดส่ง</span><input name="due" type="datetime-local" value="${dateInput(due)}" required></label></div>`,
    submitLabel: 'ยืนยัน Publish',
    onSubmit: async (form) => {
      const result = await rpc('clean_worksheet_publish', { p_worksheet_id: id, p_open_at: new Date(form.get('open')).toISOString(), p_due_at: new Date(form.get('due')).toISOString() });
      toast(`Publish สำเร็จ ${result.assigned_count ?? 0} คน`, 'ok'); await worksheetsPage();
    },
  });
}

export async function showWorksheetDetail(id, staff = false) {
  const data = await rpc('clean_worksheet_detail', { p_worksheet_id: id });
  const w = data.worksheet || {}, s = data.subject || {};
  setMain(pageHead('รายละเอียดใบงาน', w.title || '', '<button class="btn light" id="backWorksheet">← กลับ</button>' + (staff ? '<button class="btn light" id="worksheetHistory">Version History</button>' : '') + (w.mode === 'paper' ? '<button class="btn primary" id="printWorksheet">พิมพ์ / PDF</button>' : '')) + `
    <div class="content-grid two"><section class="panel"><div class="detail-grid"><div><span>วิชา</span><strong>${esc(s.code || '')} ${esc(s.name || '')}</strong></div><div><span>ประเภท</span><strong>${statusPill(w.mode)}</strong></div><div><span>สถานะ</span><strong>${statusPill(w.status)}</strong></div><div><span>มอบหมาย/ส่ง</span><strong>${data.assigned_count ?? 0} / ${data.submitted_count ?? 0}</strong></div><div><span>เปิด</span><strong>${fmt(w.open_at)}</strong></div><div><span>กำหนดส่ง</span><strong>${fmt(w.due_at)}</strong></div></div></section><section class="panel"><div class="panel-head"><h3>คำสั่ง</h3></div><p>${esc(w.instructions || '-')}</p>${w.mode === 'paper' ? `<div class="notice-card"><strong>Paper Workflow</strong><p>พิมพ์จากคอม/แท็บเล็ต → ทำลงกระดาษ → ถ้าครูเปิดรับย้อนหลัง นักศึกษาจึงใช้มือถือถ่ายสำเนาส่งได้</p></div>` : ''}</section></div>
    <section class="panel print-area" style="margin-top:18px"><div class="paper-header"><h2>${esc(w.title)}</h2><p>${esc(s.code || '')} ${esc(s.name || '')}</p><div class="paper-student-line">ชื่อ ______________________________ รหัส __________________ ห้อง __________ เลขที่ ____</div></div>${renderQuestions(w.questions || [])}</section>`);
  document.querySelector('#backWorksheet').onclick = () => navigate('worksheets');
  if (document.querySelector('#printWorksheet')) document.querySelector('#printWorksheet').onclick = () => window.print();
  if (staff && document.querySelector('#worksheetHistory')) document.querySelector('#worksheetHistory').onclick = async () => { const rows = arr(await rpc('clean_document_history', { p_entity_type: 'worksheet', p_entity_id: id })); modal({ title: `Version History • ${w.title}`, wide: true, hideSubmit: true, body: rows.length ? `<div class="table-wrap"><table><thead><tr><th>Version</th><th>Action</th><th>เวลา</th><th>ผู้แก้</th></tr></thead><tbody>${rows.map((r) => `<tr><td>v${r.version_no}</td><td>${esc(r.action)}</td><td>${fmt(r.created_at)}</td><td>${esc(r.changed_by || '-')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีประวัติการแก้ไข</div>' }); };
}

async function studentWorksheets() {
  const rows = arr(await rpc('clean_my_worksheets'));
  setMain(pageHead('ใบงานของฉัน', 'Digital ทำในระบบ • Paper พิมพ์จากคอม/แท็บเล็ต') + `<div class="card-grid">${rows.map((w) => `<article class="subject-card"><div class="subject-code">${esc(w.subject_code || '')}</div><h3>${esc(w.title)}</h3><p>${esc(w.instructions || '')}</p><div class="meta-row">${statusPill(w.mode)} ${statusPill(w.submission_status || 'ยังไม่ส่ง')}</div><div class="row-actions"><button class="btn light" data-detail="${w.id}">รายละเอียด</button>${w.mode === 'digital' ? `<button class="btn primary" data-do="${w.id}">ทำใบงาน</button>` : `<button class="btn primary" data-print="${w.id}">พิมพ์ใบงาน</button>`}</div></article>`).join('')}</div>`);
  document.querySelectorAll('[data-detail]').forEach((b) => b.onclick = () => showWorksheetDetail(b.dataset.detail));
  document.querySelectorAll('[data-do]').forEach((b) => b.onclick = () => doWorksheet(rows.find((x) => x.id === b.dataset.do)));
  document.querySelectorAll('[data-print]').forEach((b) => b.onclick = () => showWorksheetDetail(b.dataset.print));
}

function renderQuestions(questions, answers = {}) {
  return `<div class="question-list">${arr(questions).map((q, i) => {
    const id = q.id || `q${i + 1}`, prompt = q.prompt || q.text || `ข้อ ${i + 1}`, type = q.type || 'short', opts = arr(q.options);
    const input = ['mcq','truefalse','singleChoice'].includes(type) && opts.length ? opts.map((o) => { const value = typeof o === 'object' ? (o.id ?? o.value ?? o.text) : o; const text = typeof o === 'object' ? (o.text ?? o.label ?? value) : o; return `<label class="choice"><input type="radio" name="ans_${esc(id)}" value="${esc(value)}" ${String(answers[id] ?? '') === String(value) ? 'checked' : ''}> <span>${esc(text)}</span></label>`; }).join('') : `<textarea name="ans_${esc(id)}" class="answer-box">${esc(answers[id] ?? '')}</textarea>`;
    return `<div class="question" data-qid="${esc(id)}"><div class="question-title"><span>${i + 1}</span><strong>${esc(prompt)}</strong><small>${q.points ? `${q.points} คะแนน` : ''}</small></div>${input}</div>`;
  }).join('')}</div>`;
}

function collectAnswers(root) {
  const out = {};
  root.querySelectorAll('.question').forEach((q) => { const checked = q.querySelector('input[type="radio"]:checked'); const textarea = q.querySelector('textarea'); out[q.dataset.qid] = checked ? checked.value : (textarea?.value ?? ''); });
  return out;
}

function doWorksheet(w) {
  modal({ title: `ใบงาน • ${w.title}`, wide: true, body: `<div class="notice-card"><strong>${esc(w.subject_code || '')}</strong><p>กำหนดส่ง ${fmt(w.due_at)}</p></div><div id="answerForm">${renderQuestions(w.questions || [], w.answers || {})}</div>`, submitLabel: 'ส่งใบงาน', extraFooter: '<button class="btn light" type="button" id="saveWorksheetDraft">บันทึกร่าง</button>', onSubmit: async () => { await rpc('clean_submission_save', { p_worksheet_id: w.id, p_answers: collectAnswers(document.querySelector('#answerForm')), p_submit: true }); toast('ส่งใบงานแล้ว', 'ok'); await worksheetsPage(); } });
  document.querySelector('#saveWorksheetDraft').onclick = async () => { await rpc('clean_submission_save', { p_worksheet_id: w.id, p_answers: collectAnswers(document.querySelector('#answerForm')), p_submit: false }); toast('บันทึกร่างแล้ว', 'ok'); };
}

async function paperRoster(id) {
  const rows = arr(await rpc('clean_paper_roster', { p_worksheet_id: id }));
  setMain(pageHead('ลงคะแนนใบงานกระดาษ', 'กรอกคะแนนรายคน', '<button class="btn light" id="backPaper">← กลับ</button>') + `<div class="table-wrap"><table><thead><tr><th>นักศึกษา</th><th>คะแนน</th><th>เต็ม</th><th></th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.student_code || '')} ${esc(r.full_name)}</td><td>${r.score ?? '-'}</td><td>${r.max_score ?? '-'}</td><td><button class="btn primary sm" data-grade="${r.student_id}">ลงคะแนน</button></td></tr>`).join('')}</tbody></table></div>`);
  document.querySelector('#backPaper').onclick = () => navigate('worksheets');
  document.querySelectorAll('[data-grade]').forEach((b) => b.onclick = () => modal({ title: 'ลงคะแนน Paper', body: '<label class="field"><span>คะแนน</span><input name="score" type="number" step="0.01" min="0" required></label><label class="field"><span>คะแนนเต็ม</span><input name="max" type="number" step="0.01" min="1" value="100" required></label><label class="field"><span>ความเห็น</span><textarea name="comment"></textarea></label>', onSubmit: async (form) => { await rpc('clean_paper_grade', { p_worksheet_id: id, p_student_id: b.dataset.grade, p_score: Number(form.get('score')), p_max_score: Number(form.get('max')), p_comment: form.get('comment') }); toast('บันทึกคะแนนแล้ว', 'ok'); await paperRoster(id); } }));
}

function mobileSetting(id, enabled) {
  const defaultUntil = new Date(Date.now() + 7 * 86400000);
  modal({ title: 'ส่งใบงานย้อนหลังด้วยมือถือ', body: `<div class="notice-card"><strong>Paper Only</strong><p>เปิดได้เฉพาะใบงานกระดาษ นักศึกษาจะเห็นใบงานนี้บนมือถือเฉพาะช่วงเวลาที่กำหนด</p></div><label class="field"><span>สถานะ</span><select name="enabled"><option value="true" ${enabled ? 'selected' : ''}>เปิดรับ</option><option value="false" ${!enabled ? 'selected' : ''}>ปิดรับ</option></select></label><label class="field"><span>รับถึง</span><input name="until" type="datetime-local" value="${enabled ? '' : dateInput(defaultUntil)}"><small>เว้นว่างได้ หากไม่กำหนดวันสิ้นสุด</small></label>`, onSubmit: async (form) => { const on = form.get('enabled') === 'true'; await rpc('clean_worksheet_mobile_copy_setting', { p_worksheet_id: id, p_enabled: on, p_until: on && form.get('until') ? new Date(form.get('until')).toISOString() : null }); toast(on ? 'เปิดรับส่งย้อนหลังแล้ว' : 'ปิดรับส่งย้อนหลังแล้ว', 'ok'); await worksheetsPage(); } });
}
