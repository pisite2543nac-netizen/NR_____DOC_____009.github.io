import { rpc } from '../api.js';
import { state } from '../state.js';
import { pageHead, setMain, arr, esc, options, modal, toast, formLines, linesJson, dateInput } from '../ui.js';

let cachedSubjects = [];
let currentSubjectId = null;

export async function teachingPage() {
  cachedSubjects = state.profile.role === 'student' ? arr(await rpc('clean_my_subjects')) : arr((await rpc('clean_staff_scope')).subjects);
  currentSubjectId = sessionStorage.getItem('docnr.open.subject') || cachedSubjects[0]?.id || null;
  setMain(pageHead(state.profile.role === 'student' ? 'เนื้อหาการเรียน' : 'เนื้อหาการสอน', '13 รายวิชา × 17 หน่วย × 20 สไลด์ต่อหน่วย') + `
    <div class="toolbar"><label class="field grow"><span>รายวิชา</span><select id="teachingSubject">${options(cachedSubjects, 'id', (s) => `${s.code} ${s.name}`, currentSubjectId)}</select></label><button class="btn primary" id="loadUnits">โหลดหน่วย</button></div>
    <div id="teachingBody"></div>`);
  document.querySelector('#loadUnits').onclick = () => loadUnits(document.querySelector('#teachingSubject').value);
  if (currentSubjectId) await loadUnits(currentSubjectId);
}

async function loadUnits(subjectId) {
  currentSubjectId = subjectId;
  sessionStorage.setItem('docnr.open.subject', subjectId);
  const body = document.querySelector('#teachingBody');
  body.innerHTML = '<div class="state-box"><div class="spinner"></div>กำลังโหลด 17 หน่วย...</div>';
  const units = arr(await rpc('clean_teaching_units_list', { p_subject_id: subjectId }));
  const subject = cachedSubjects.find((s) => s.id === subjectId) || {};
  body.innerHTML = `
    <div class="section-title"><div><span class="eyebrow">${esc(subject.code || '')}</span><h2>${esc(subject.name || '')}</h2></div><span class="count-badge">${units.length} หน่วย • ${units.length * 20} สไลด์</span></div>
    <div class="unit-grid">${units.map((u) => `<article class="unit-card"><div class="unit-number">${u.unit_no}</div><div class="unit-content"><h3>${esc(u.title)}</h3><p>${esc(u.summary || '')}</p><div class="meta-row"><span>${u.slide_count || 20} สไลด์</span><span>${u.worksheet_count || 0} ใบงาน</span></div><div class="row-actions"><button class="btn primary sm" data-unit="${u.id}">เปิดหน่วย</button>${state.profile.role !== 'student' ? `<button class="btn light sm" data-issue="${u.id}">สั่งจ่ายใบงาน</button>` : ''}</div></div></article>`).join('')}</div>`;
  document.querySelectorAll('[data-unit]').forEach((button) => button.onclick = () => showUnit(button.dataset.unit));
  document.querySelectorAll('[data-issue]').forEach((button) => button.onclick = () => issueWorksheet(button.dataset.issue));
  const requested = sessionStorage.getItem('docnr.open.unit');
  if (requested && units.some((u) => u.id === requested)) {
    sessionStorage.removeItem('docnr.open.unit');
    await showUnit(requested);
  }
}

async function showUnit(unitId) {
  const data = await rpc('clean_teaching_unit_detail', { p_unit_id: unitId });
  const u = data.unit || {};
  const subject = data.subject || {};
  const slides = arr(data.slides);
  const body = document.querySelector('#teachingBody');
  body.innerHTML = `
    <div class="page-actions inline"><button class="btn light" id="backUnits">← 17 หน่วย</button>${state.profile.role !== 'student' ? '<button class="btn light" id="editUnit">แก้เนื้อหาหน่วย</button><button class="btn light" id="unitHistory">Version History</button><button class="btn primary" id="issueFromUnit">สั่งจ่ายใบงาน Paper</button>' : ''}<button class="btn secondary" id="presentSlides">นำเสนอ 20 สไลด์</button></div>
    <section class="unit-hero"><span>หน่วยที่ ${u.unit_no}</span><h2>${esc(u.title)}</h2><p>${esc(u.summary || '')}</p></section>
    <div class="content-grid two">
      <section class="panel"><div class="panel-head"><h3>ผลลัพธ์การเรียนรู้</h3></div><ol class="clean-list">${arr(u.objectives).map((x) => `<li>${esc(x)}</li>`).join('')}</ol><h4>Key Concepts</h4><div class="chip-row">${arr(u.key_concepts).map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div></section>
      <section class="panel"><div class="panel-head"><h3>ใบงานประจำหน่วย</h3></div><strong>${esc(u.worksheet_title || '')}</strong><p>${esc(u.worksheet_brief || '')}</p><div class="notice-card"><strong>Mobile Rule</strong><p>มือถือส่งย้อนหลังได้เฉพาะใบงาน Paper ที่ครูเปิดรับเท่านั้น</p></div></section>
    </div>
    <section class="panel" style="margin-top:18px"><div class="panel-head"><h3>20 สไลด์</h3></div><div class="slide-list">${slides.map((s) => `<button class="slide-row" data-slide-no="${s.no}"><span>${s.no}</span><div><strong>${esc(s.title)}</strong><small>${esc(s.body)}</small></div></button>`).join('')}</div></section>`;
  document.querySelector('#backUnits').onclick = () => loadUnits(currentSubjectId);
  document.querySelector('#presentSlides').onclick = () => presentSlides(subject, u, slides, 0);
  document.querySelectorAll('[data-slide-no]').forEach((button) => button.onclick = () => presentSlides(subject, u, slides, Math.max(0, Number(button.dataset.slideNo) - 1)));
  if (state.profile.role !== 'student') {
    document.querySelector('#editUnit').onclick = () => editUnit(data);
    document.querySelector('#unitHistory').onclick = () => showHistory('teaching_unit', unitId, `หน่วย ${u.unit_no}: ${u.title}`);
    document.querySelector('#issueFromUnit').onclick = () => issueWorksheet(unitId);
  }
}

function presentSlides(subject, unit, slides, startIndex = 0) {
  let index = startIndex;
  const view = modal({ title: `${subject.code || ''} • หน่วย ${unit.unit_no}`, body: '<div id="presentation"></div>', hideSubmit: true, wide: true, extraFooter: '<button class="btn light" type="button" id="prevSlide">← ก่อนหน้า</button><button class="btn primary" type="button" id="nextSlide">ถัดไป →</button>' });
  const draw = () => {
    const slide = slides[index] || {};
    const area = document.querySelector('#presentation');
    area.innerHTML = `<div class="presentation-slide"><div class="presentation-top"><span>${esc(subject.code || '')}</span><span>${index + 1} / ${slides.length}</span></div><h1>${esc(slide.title || '')}</h1><p>${esc(slide.body || '')}</p>${slide.review_question ? `<div class="review-question"><strong>คำถามคิดวิเคราะห์</strong><p>${esc(slide.review_question)}</p></div>` : ''}<div class="teacher-note"><strong>Teacher Note</strong><p>${esc(slide.teacher_note || 'เชื่อมโยงตัวอย่างกับงานจริงและตรวจความเข้าใจของผู้เรียน')}</p></div></div>`;
    document.querySelector('#prevSlide').disabled = index <= 0;
    document.querySelector('#nextSlide').disabled = index >= slides.length - 1;
  };
  document.querySelector('#prevSlide').onclick = () => { if (index > 0) { index -= 1; draw(); } };
  document.querySelector('#nextSlide').onclick = () => { if (index < slides.length - 1) { index += 1; draw(); } };
  draw();
  return view;
}

function editUnit(data) {
  const u = data.unit || {};
  modal({ title: `แก้หน่วย ${u.unit_no}: ${u.title}`, wide: true, body: `
    <div class="form-grid"><label class="field span2"><span>ชื่อหน่วย</span><input name="title" value="${esc(u.title)}" required></label><label class="field span2"><span>สรุปหน่วย</span><textarea name="summary" rows="4">${esc(u.summary)}</textarea></label><label class="field"><span>ผลลัพธ์การเรียนรู้ (1 บรรทัด/ข้อ)</span><textarea name="objectives" rows="7">${esc(formLines(u.objectives))}</textarea></label><label class="field"><span>Key Concepts (1 บรรทัด/ข้อ)</span><textarea name="concepts" rows="7">${esc(formLines(u.key_concepts))}</textarea></label><label class="field span2"><span>ภารกิจปฏิบัติ</span><textarea name="practice" rows="3">${esc(u.practice_task)}</textarea></label><label class="field span2"><span>กรณีศึกษา</span><textarea name="case" rows="3">${esc(u.case_study)}</textarea></label><label class="field"><span>ข้อผิดพลาดที่พบบ่อย</span><textarea name="mistakes" rows="5">${esc(formLines(u.common_mistakes))}</textarea></label><label class="field"><span>ความปลอดภัย/จริยธรรม</span><textarea name="safety" rows="5">${esc(u.safety_note)}</textarea></label><label class="field span2"><span>ชื่อใบงาน</span><input name="worksheet_title" value="${esc(u.worksheet_title)}"></label><label class="field span2"><span>คำสั่งใบงาน</span><textarea name="worksheet_brief" rows="3">${esc(u.worksheet_brief)}</textarea></label></div>`,
    onSubmit: async (form) => {
      await rpc('clean_teaching_unit_save', { p_unit_id: u.id, p_title: form.get('title'), p_summary: form.get('summary'), p_objectives: linesJson(form.get('objectives')), p_key_concepts: linesJson(form.get('concepts')), p_practice_task: form.get('practice'), p_case_study: form.get('case'), p_common_mistakes: linesJson(form.get('mistakes')), p_safety_note: form.get('safety'), p_worksheet_title: form.get('worksheet_title'), p_worksheet_brief: form.get('worksheet_brief') });
      toast('บันทึกเนื้อหาหน่วยและเก็บ Version History แล้ว', 'ok'); await showUnit(u.id);
    },
  });
}


async function showHistory(entityType, entityId, title) {
  const rows = arr(await rpc('clean_document_history', { p_entity_type: entityType, p_entity_id: entityId }));
  modal({ title: `Version History • ${title}`, wide: true, hideSubmit: true, body: rows.length ? `<div class="table-wrap"><table><thead><tr><th>Version</th><th>Action</th><th>เวลา</th><th>ผู้แก้</th></tr></thead><tbody>${rows.map((r) => `<tr><td>v${r.version_no}</td><td>${esc(r.action)}</td><td>${new Date(r.created_at).toLocaleString('th-TH')}</td><td>${esc(r.changed_by || '-')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีประวัติการแก้ไข</div>' });
}
async function issueWorksheet(unitId) {
  const scope = await rpc('clean_staff_scope');
  const now = new Date();
  const due = new Date(Date.now() + 7 * 86400000);
  const copyUntil = new Date(Date.now() + 14 * 86400000);
  modal({ title: 'สั่งจ่ายใบงาน Paper จากหน่วยการสอน', body: `
    <div class="notice-card"><strong>เงื่อนไข</strong><p>ระบบจะสร้าง Paper Worksheet และมอบหมายให้เฉพาะนักศึกษาที่ลงทะเบียนวิชาและอยู่ในห้องที่เลือก สถานะจะเป็น Published ทันที</p></div>
    <label class="field"><span>ห้องเรียน</span><select name="classroom"><option value="">ทุกห้องในวิชา</option>${options(scope.classrooms, 'id', (c) => `${c.code || ''} ${c.name}`)}</select></label>
    <div class="form-grid"><label class="field"><span>เปิดงาน</span><input name="open" type="datetime-local" value="${dateInput(now)}" required></label><label class="field"><span>กำหนดส่ง</span><input name="due" type="datetime-local" value="${dateInput(due)}" required></label></div>
    <label class="field"><span>เปิดส่งย้อนหลังผ่านมือถือถึง</span><input name="mobile_until" type="datetime-local" value="${dateInput(copyUntil)}"><small>เว้นว่าง = ไม่เปิดส่งย้อนหลัง</small></label>`,
    submitLabel: 'ยืนยันสั่งจ่าย',
    onSubmit: async (form) => {
      const result = await rpc('clean_issue_unit_paper_worksheet', { p_unit_id: unitId, p_classroom_id: form.get('classroom') || null, p_open_at: new Date(form.get('open')).toISOString(), p_due_at: new Date(form.get('due')).toISOString(), p_mobile_copy_until: form.get('mobile_until') ? new Date(form.get('mobile_until')).toISOString() : null });
      toast(`สั่งจ่ายแล้ว ${result.assigned_count ?? 0} คน`, 'ok'); await showUnit(unitId);
    },
  });
}
