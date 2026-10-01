import { rpc } from '../api.js';
import { state } from '../state.js';
import { pageHead, setMain, arr, esc, statusPill, modal, options, toast, fmt, dateInput, saveLocalDraft, loadLocalDraft, clearLocalDraft } from '../ui.js';
import { navigate } from '../router.js';

export async function examsPage() {
  if (state.profile.role === 'student') return studentExams();
  const [scope, rows] = await Promise.all([rpc('clean_staff_scope'), rpc('clean_exam_dashboard')]);
  setMain(pageHead('ข้อสอบ', '221 แบบทดสอบประจำหน่วย + กลางภาค 13 ชุด + ปลายภาค 13 ชุด', '<button class="btn primary" id="newExam">+ สร้างข้อสอบ</button>') + `
    <div class="toolbar"><input id="examSearch" class="grow" placeholder="ค้นหาข้อสอบ / หน่วย / วิชา"><select id="examSubject"><option value="">ทุกวิชา</option>${options(scope.subjects, 'id', (s) => `${s.code} ${s.name}`)}</select><select id="examType"><option value="">ทุกประเภท</option><option value="practice">practice</option><option value="midterm">midterm</option><option value="final">final</option></select></div><div id="examTable"></div>`);
  const draw = () => {
    const q = (document.querySelector('#examSearch').value || '').toLowerCase();
    const subject = document.querySelector('#examSubject').value;
    const type = document.querySelector('#examType').value;
    const filtered = arr(rows).filter((e) => (!subject || e.subject_id === subject) && (!type || e.exam_type === type) && (`${e.title} ${e.subject_code || ''} ${e.subject_name || ''} ${e.unit_title || ''}`.toLowerCase().includes(q)));
    document.querySelector('#examTable').innerHTML = `<div class="table-wrap"><table><thead><tr><th>ข้อสอบ</th><th>วิชา/หน่วย</th><th>ประเภท</th><th>สถานะ</th><th>ช่วงเวลา</th><th>จัดการ</th></tr></thead><tbody>${filtered.map((e) => `<tr><td><strong>${esc(e.title)}</strong><small>${e.is_unit_template ? 'แม่แบบประจำหน่วย • ' : ''}${esc(e.description || '')}</small></td><td>${esc(e.subject_code || '')} ${esc(e.subject_name || '')}<small>${e.unit_no ? `หน่วย ${e.unit_no}: ${esc(e.unit_title || '')}` : '-'}</small></td><td>${statusPill(e.exam_type)}</td><td>${statusPill(e.status)}</td><td>${fmt(e.open_at)} → ${fmt(e.due_at)}</td><td class="actions-cell"><button class="btn light sm" data-detail="${e.id}">รายละเอียด</button>${e.status === 'draft' ? `<button class="btn primary sm" data-publish="${e.id}">Publish</button>` : ''}<button class="btn light sm" data-attempts="${e.id}">Attempts</button></td></tr>`).join('')}</tbody></table></div>`;
    document.querySelectorAll('[data-detail]').forEach((b) => b.onclick = () => showExamDetailStaff(b.dataset.detail));
    document.querySelectorAll('[data-publish]').forEach((b) => b.onclick = () => publishExam(b.dataset.publish));
    document.querySelectorAll('[data-attempts]').forEach((b) => b.onclick = () => examAttempts(b.dataset.attempts));
  };
  document.querySelector('#newExam').onclick = () => createExamModal(scope);
  document.querySelector('#examSearch').oninput = draw; document.querySelector('#examSubject').onchange = draw; document.querySelector('#examType').onchange = draw; draw();
  const focus = sessionStorage.getItem('docnr.focus.exam');
  if (focus) { sessionStorage.removeItem('docnr.focus.exam'); await showExamDetailStaff(focus); }
}

async function showExamDetailStaff(id) {
  const data = await rpc('clean_exam_detail_staff', { p_exam_id: id });
  const e = data.exam || {};
  setMain(pageHead('รายละเอียดข้อสอบ', e.title || '', '<button class="btn light" id="backExamDetail">← กลับ</button>' + (e.status === 'draft' ? '<button class="btn primary" id="publishFromDetail">Publish</button>' : '') + '<button class="btn light" id="attemptsFromDetail">Attempts</button>') + `
    <div class="content-grid two"><section class="panel"><div class="detail-grid"><div><span>ประเภท</span><strong>${statusPill(e.exam_type)}</strong></div><div><span>สถานะ</span><strong>${statusPill(e.status)}</strong></div><div><span>เวลา</span><strong>${e.duration_minutes ?? '-'} นาที</strong></div><div><span>คะแนนเต็ม</span><strong>${e.full_score ?? '-'}</strong></div><div><span>เปิด</span><strong>${fmt(e.open_at)}</strong></div><div><span>ปิด</span><strong>${fmt(e.due_at)}</strong></div></div></section><section class="panel"><div class="panel-head"><h3>รายละเอียด</h3></div><p>${esc(e.description || '-')}</p>${e.is_unit_template ? '<div class="notice-card"><strong>แม่แบบประจำหน่วย</strong><p>ตรวจแก้โจทย์ได้ก่อน Publish เมื่อพร้อมจึงกำหนดเวลาและมอบหมายให้นักศึกษา</p></div>' : ''}</section></div>
    <section class="panel" style="margin-top:18px"><div class="panel-head"><h3>คำถาม ${arr(e.questions).length} ข้อ</h3></div>${renderQuestions(e.questions || [], {})}</section>`);
  document.querySelector('#backExamDetail').onclick = () => examsPage();
  document.querySelector('#attemptsFromDetail').onclick = () => examAttempts(id);
  if (document.querySelector('#publishFromDetail')) document.querySelector('#publishFromDetail').onclick = () => publishExam(id);
}

function createExamModal(scope) {
  const draft = loadLocalDraft('exam.new')?.value || {};
  modal({ title: 'สร้างข้อสอบ', wide: true, body: `
    <div class="form-grid"><label class="field"><span>รายวิชา</span><select name="subject">${options(scope.subjects, 'id', (s) => `${s.code} ${s.name}`, draft.subject)}</select></label><label class="field"><span>ประเภท</span><select name="type"><option value="practice">practice</option><option value="midterm">midterm</option><option value="final">final</option></select></label><label class="field span2"><span>ชื่อข้อสอบ</span><input name="title" value="${esc(draft.title || '')}" required></label><label class="field span2"><span>รายละเอียด</span><textarea name="description">${esc(draft.description || '')}</textarea></label><label class="field"><span>เวลา (นาที)</span><input name="duration" type="number" min="1" value="${draft.duration || 60}"></label><label class="field"><span>จำนวนครั้ง</span><input name="attempts" type="number" min="1" value="${draft.attempts || 1}"></label><label class="field"><span>คะแนนเต็ม</span><input name="full_score" type="number" min="1" value="${draft.full_score || 100}"></label><label class="field span2"><span>Questions JSON</span><textarea name="questions" rows="10">${esc(draft.questions || '[{"id":"q001","type":"mcq","prompt":"เลือกคำตอบที่ถูกต้อง","options":["A","B","C","D"],"points":1}]')}</textarea></label><label class="field span2"><span>Answer Key JSON</span><textarea name="answer_key" rows="5">${esc(draft.answer_key || '{"q001":"A"}')}</textarea></label></div><div class="autosave-note" id="examAutosave">บันทึกร่างอัตโนมัติในเครื่อง</div>`,
    submitLabel: 'บันทึก Draft',
    onSubmit: async (form) => {
      await rpc('clean_exam_save', { p_id: null, p_subject_id: form.get('subject'), p_title: form.get('title'), p_description: form.get('description'), p_exam_type: form.get('type'), p_questions: JSON.parse(form.get('questions') || '[]'), p_answer_key: JSON.parse(form.get('answer_key') || '{}'), p_open_at: null, p_due_at: null, p_duration_minutes: Number(form.get('duration') || 60), p_attempt_limit: Number(form.get('attempts') || 1), p_full_score: Number(form.get('full_score') || 100) });
      clearLocalDraft('exam.new'); toast('สร้างข้อสอบ Draft แล้ว', 'ok'); await examsPage();
    },
  });
  const form = document.querySelector('#modalForm');
  form.addEventListener('input', () => {
    saveLocalDraft('exam.new', Object.fromEntries(new FormData(form).entries()));
    const note = document.querySelector('#examAutosave'); if (note) note.textContent = `บันทึกร่างล่าสุด ${new Date().toLocaleTimeString('th-TH')}`;
  });
}

function publishExam(id) {
  const now = new Date(); const due = new Date(Date.now() + 2 * 86400000);
  modal({ title: 'Publish ข้อสอบ', body: `<div class="form-grid"><label class="field"><span>เปิด</span><input name="open" type="datetime-local" value="${dateInput(now)}" required></label><label class="field"><span>ปิด</span><input name="due" type="datetime-local" value="${dateInput(due)}" required></label></div>`, submitLabel: 'Publish', onSubmit: async (form) => { const result = await rpc('clean_exam_publish', { p_exam_id: id, p_open_at: new Date(form.get('open')).toISOString(), p_due_at: new Date(form.get('due')).toISOString() }); toast(`Publish แล้ว ${result.assigned_count ?? 0} คน`, 'ok'); await examsPage(); } });
}

async function examAttempts(id) {
  const rows = arr(await rpc('clean_exam_attempts_staff', { p_exam_id: id }));
  setMain(pageHead('Exam Attempts', 'รายการการทำข้อสอบและการให้คะแนน', '<button class="btn light" id="backExam">← กลับ</button>') + `<div class="table-wrap"><table><thead><tr><th>นักศึกษา</th><th>ครั้ง</th><th>สถานะ</th><th>คะแนน</th><th></th></tr></thead><tbody>${rows.map((a) => `<tr><td>${esc(a.student_code || '')} ${esc(a.full_name || '')}</td><td>${a.attempt_no ?? '-'}</td><td>${statusPill(a.grading_status || a.status)}</td><td>${a.score ?? '-'} / ${a.max_score ?? '-'}</td><td>${(a.grading_status === 'needs_review' || a.status === 'submitted') ? `<button class="btn primary sm" data-grade="${a.id}">ให้คะแนน</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`);
  document.querySelector('#backExam').onclick = () => navigate('exams');
  document.querySelectorAll('[data-grade]').forEach((b) => b.onclick = () => modal({ title: 'ให้คะแนนข้อสอบ', body: '<label class="field"><span>คะแนน</span><input name="score" type="number" step="0.01" min="0" required></label><label class="field"><span>ความเห็น</span><textarea name="comment"></textarea></label>', onSubmit: async (form) => { await rpc('clean_exam_grade', { p_attempt_id: b.dataset.grade, p_score: Number(form.get('score')), p_comment: form.get('comment') }); toast('บันทึกคะแนนแล้ว', 'ok'); await examAttempts(id); } }));
}

async function studentExams() {
  const rows = arr(await rpc('clean_my_exams'));
  setMain(pageHead('ข้อสอบของฉัน', 'ข้อสอบที่ได้รับมอบหมาย') + `<div class="card-grid">${rows.map((e) => `<article class="subject-card"><div class="subject-code">${esc(e.subject_code || '')}</div><h3>${esc(e.title)}</h3><p>${esc(e.exam_type || '')} • ${e.duration_minutes ?? '-'} นาที • เต็ม ${e.full_score ?? '-'}</p><div class="meta-row">${statusPill(e.latest_status || 'ยังไม่เริ่ม')}<span>ใช้ ${e.attempts_used ?? 0}/${e.attempt_limit ?? 1} ครั้ง</span></div><button class="btn primary full" data-start="${e.id}">เริ่ม/ทำต่อ</button></article>`).join('')}</div>`);
  document.querySelectorAll('[data-start]').forEach((b) => b.onclick = () => startExam(b.dataset.start));
}

async function startExam(id) {
  const data = await rpc('clean_exam_start', { p_exam_id: id });
  const attempt = data.attempt || {}, exam = data.exam || {};
  setMain(pageHead(exam.title || 'ข้อสอบ', `หมดเวลา ${fmt(attempt.expires_at)}`, '<button class="btn light" id="backMyExam">← กลับ</button><button class="btn light" id="saveExam">บันทึก</button><button class="btn primary" id="submitExam">ส่งข้อสอบ</button>') + `<section class="panel" id="examForm">${renderQuestions(exam.questions || [], attempt.answers || {})}</section>`);
  document.querySelector('#backMyExam').onclick = () => navigate('exams');
  document.querySelector('#saveExam').onclick = async () => { await rpc('clean_exam_save_answers', { p_attempt_id: attempt.id, p_answers: collectAnswers(document.querySelector('#examForm')) }); toast('บันทึกคำตอบแล้ว', 'ok'); };
  document.querySelector('#submitExam').onclick = async () => { if (!confirm('ยืนยันส่งข้อสอบ?')) return; const result = await rpc('clean_exam_submit', { p_attempt_id: attempt.id, p_answers: collectAnswers(document.querySelector('#examForm')) }); toast(`ส่งข้อสอบแล้ว ${result.attempt?.score != null ? `คะแนน ${result.attempt.score}` : 'รอตรวจ'}`, 'ok'); navigate('exams'); };
}

function renderQuestions(questions, answers = {}) {
  return `<div class="question-list">${arr(questions).map((q, i) => { const id = q.id || `q${i + 1}`, prompt = q.prompt || q.text || `ข้อ ${i + 1}`, type = q.type || 'short', opts = arr(q.options); const input = ['mcq','truefalse','singleChoice'].includes(type) && opts.length ? opts.map((o) => { const value = typeof o === 'object' ? (o.id ?? o.value ?? o.text) : o; const text = typeof o === 'object' ? (o.text ?? o.label ?? value) : o; return `<label class="choice"><input type="radio" name="ans_${esc(id)}" value="${esc(value)}" ${String(answers[id] ?? '') === String(value) ? 'checked' : ''}><span>${esc(text)}</span></label>`; }).join('') : `<textarea name="ans_${esc(id)}" class="answer-box">${esc(answers[id] ?? '')}</textarea>`; return `<div class="question" data-qid="${esc(id)}"><div class="question-title"><span>${i + 1}</span><strong>${esc(prompt)}</strong></div>${input}</div>`; }).join('')}</div>`;
}

function collectAnswers(root) {
  const out = {};
  root.querySelectorAll('.question').forEach((q) => { const checked = q.querySelector('input[type="radio"]:checked'); const textarea = q.querySelector('textarea'); out[q.dataset.qid] = checked ? checked.value : (textarea?.value ?? ''); });
  return out;
}
