import { rpc } from '../api.js';
import { state } from '../state.js';
import { pageHead, setMain, arr, esc, options, modal, toast, formLines, linesJson, dateInput, statusPill, fmt } from '../ui.js';
import { navigate } from '../router.js';

let cachedSubjects = [];
let currentSubjectId = null;
let currentOfferingId = null;

const isStaff = () => state.profile.role !== 'student';
const subjectById = (id) => cachedSubjects.find((s) => s.id === id) || {};
const offeringsOf = (subjectId) => arr(subjectById(subjectId).offerings);
const offeringById = (subjectId, offeringId) => offeringsOf(subjectId).find((o) => o.id === offeringId) || null;

function preferredOffering(subjectId) {
  const subject = subjectById(subjectId);
  if (!isStaff()) return subject.offering || (subject.offering_id ? { id: subject.offering_id, plan_code: subject.group_code } : null);
  const offerings = offeringsOf(subjectId);
  const saved = sessionStorage.getItem(`docnr.open.offering.${subjectId}`);
  return offerings.find((o) => o.id === saved) || offerings[0] || null;
}

function syncGroupSelect(subjectId) {
  if (!isStaff()) return;
  const select = document.querySelector('#teachingGroup');
  if (!select) return;
  const offerings = offeringsOf(subjectId);
  const preferred = preferredOffering(subjectId);
  select.innerHTML = offerings.length
    ? offerings.map((o) => `<option value="${esc(o.id)}" ${preferred?.id === o.id ? 'selected' : ''}>${esc(o.plan_code || 'ไม่ระบุ')} • ${o.weekly_hours ?? 0} ชม./สัปดาห์ • ${o.enrolled_count ?? 0} คน</option>`).join('')
    : '<option value="">ยังไม่มี Group Code</option>';
  currentOfferingId = select.value || null;
}

export async function teachingPage() {
  cachedSubjects = state.profile.role === 'student' ? arr(await rpc('clean_my_subjects')) : arr((await rpc('clean_staff_scope')).subjects);
  currentSubjectId = sessionStorage.getItem('docnr.open.subject') || cachedSubjects[0]?.id || null;
  const selectedSubject = subjectById(currentSubjectId);
  const studentGroup = !isStaff() ? (selectedSubject.group_code || '-') : null;

  setMain(pageHead(state.profile.role === 'student' ? 'เนื้อหาการเรียน' : 'เนื้อหาการสอน', 'รายวิชา → Group Code → 17 หน่วย → 20 สไลด์ → ใบงานอิเล็กทรอนิกส์') + `
    <div class="toolbar">
      <label class="field grow"><span>รายวิชา</span><select id="teachingSubject">${options(cachedSubjects, 'id', (s) => `${s.code} ${s.name}`, currentSubjectId)}</select></label>
      ${isStaff() ? '<label class="field"><span>Group Code</span><select id="teachingGroup"></select></label>' : `<div class="group-summary"><span>กลุ่มเรียน</span><strong>${esc(studentGroup)}</strong></div>`}
      <button class="btn primary" id="loadUnits">โหลดหน่วย</button>
    </div>
    <div id="teachingBody"></div>`);

  if (isStaff()) syncGroupSelect(currentSubjectId);
  document.querySelector('#teachingSubject').onchange = () => {
    currentSubjectId = document.querySelector('#teachingSubject').value;
    if (isStaff()) syncGroupSelect(currentSubjectId);
  };
  if (isStaff()) document.querySelector('#teachingGroup').onchange = (event) => {
    currentOfferingId = event.target.value || null;
    if (currentOfferingId) sessionStorage.setItem(`docnr.open.offering.${currentSubjectId}`, currentOfferingId);
  };
  document.querySelector('#loadUnits').onclick = () => loadUnits(document.querySelector('#teachingSubject').value);
  if (currentSubjectId) await loadUnits(currentSubjectId);
}

async function loadUnits(subjectId) {
  currentSubjectId = subjectId;
  sessionStorage.setItem('docnr.open.subject', subjectId);
  if (isStaff()) {
    const select = document.querySelector('#teachingGroup');
    currentOfferingId = select?.value || preferredOffering(subjectId)?.id || null;
    if (currentOfferingId) sessionStorage.setItem(`docnr.open.offering.${subjectId}`, currentOfferingId);
  } else {
    currentOfferingId = subjectById(subjectId).offering_id || null;
  }

  const body = document.querySelector('#teachingBody');
  body.innerHTML = '<div class="state-box"><div class="spinner"></div>กำลังโหลด 17 หน่วย...</div>';
  const units = arr(await rpc('clean_teaching_units_list', { p_subject_id: subjectId }));
  const subject = subjectById(subjectId);
  const group = isStaff() ? offeringById(subjectId, currentOfferingId) : (subject.offering || null);
  const groupText = group?.plan_code || subject.group_code || 'ยังไม่กำหนด';

  body.innerHTML = `
    <div class="section-title"><div><span class="eyebrow">${esc(subject.code || '')} • กลุ่ม ${esc(groupText)}</span><h2>${esc(subject.name || '')}</h2></div><span class="count-badge">${units.length} หน่วย • ${units.length * 20} สไลด์</span></div>
    ${isStaff() && !currentOfferingId ? '<div class="alert-banner"><strong>ยังไม่ได้เลือก Group Code</strong><span>เลือกกลุ่มก่อนเปิดใบงานอิเล็กทรอนิกส์ เพื่อป้องกันการจ่ายงานผิดกลุ่ม</span></div>' : ''}
    <div class="unit-grid">${units.map((u) => `<article class="unit-card"><div class="unit-number">${u.unit_no}</div><div class="unit-content"><h3>${esc(u.title)}</h3><p>${esc(u.summary || '')}</p><div class="meta-row"><span>${u.slide_count || 20} สไลด์</span><span>${u.worksheet_count || 0} ใบงาน</span><span>${u.exam_count || 0} แบบทดสอบ</span></div><div class="row-actions"><button class="btn primary sm" data-unit="${u.id}">เปิดหน่วย</button>${isStaff() ? `<button class="btn secondary sm" data-digital="${u.id}">เปิดใบงานอิเล็กทรอนิกส์</button>` : ''}</div></div></article>`).join('')}</div>`;

  document.querySelectorAll('[data-unit]').forEach((button) => button.onclick = () => showUnit(button.dataset.unit));
  document.querySelectorAll('[data-digital]').forEach((button) => button.onclick = () => issueDigitalWorksheet(button.dataset.digital));
  const requested = sessionStorage.getItem('docnr.open.unit');
  if (requested && units.some((u) => u.id === requested)) {
    sessionStorage.removeItem('docnr.open.unit');
    await showUnit(requested);
  }
}

async function showUnit(unitId) {
  const data = await rpc('clean_teaching_unit_bundle', { p_unit_id: unitId });
  const u = data.unit || {};
  const subject = data.subject || {};
  const slides = arr(data.slides);
  const worksheets = arr(data.worksheets);
  const exams = arr(data.exams);
  const selectedGroup = isStaff() ? offeringById(currentSubjectId, currentOfferingId) : (subjectById(currentSubjectId).offering || null);
  const groupCode = selectedGroup?.plan_code || subjectById(currentSubjectId).group_code || '-';
  const template = worksheets.find((w) => w.is_unit_template);
  const issued = worksheets.filter((w) => !w.is_unit_template);
  const issuedForGroup = isStaff() && currentOfferingId ? issued.filter((w) => w.offering_id === currentOfferingId) : issued;
  const body = document.querySelector('#teachingBody');

  body.innerHTML = `
    <div class="page-actions inline"><button class="btn light" id="backUnits">← 17 หน่วย</button>${isStaff() ? '<button class="btn light" id="editUnit">แก้เนื้อหาหน่วย</button><button class="btn light" id="unitHistory">Version History</button><button class="btn primary" id="openDigital">เปิดใบงานอิเล็กทรอนิกส์</button>' : ''}<button class="btn secondary" id="presentSlides">นำเสนอ 20 สไลด์</button></div>
    <section class="unit-hero"><span>หน่วยที่ ${u.unit_no} • Group ${esc(groupCode)}</span><h2>${esc(u.title)}</h2><p>${esc(u.summary || '')}</p></section>
    <div class="content-grid two">
      <section class="panel"><div class="panel-head"><h3>ผลลัพธ์การเรียนรู้</h3></div><ol class="clean-list">${arr(u.objectives).map((x) => `<li>${esc(x)}</li>`).join('')}</ol><h4>Key Concepts</h4><div class="chip-row">${arr(u.key_concepts).map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div></section>
      <section class="panel"><div class="panel-head"><h3>ใบงานอิเล็กทรอนิกส์ประจำหน่วย</h3><span class="count-badge">${issuedForGroup.length} รอบที่เปิด</span></div><strong>${esc(template?.title || u.worksheet_title || '')}</strong><p>${esc(u.worksheet_brief || '')}</p>${issuedForGroup.length ? `<div class="assessment-list">${issuedForGroup.map((w) => `<div class="assessment-row"><div><strong>${esc(w.title)}</strong><small>${statusPill(w.status)} • ${statusPill(w.mode)} • Group ${esc(w.group_code || '-')} • ${fmt(w.open_at)} → ${fmt(w.due_at)}</small></div><button class="btn light sm" data-open-ws="${w.id}">เปิดใบงาน</button></div>`).join('')}</div>` : `<div class="empty-state">${isStaff() ? `ยังไม่เปิดใบงาน Digital ให้ Group ${esc(groupCode)}` : 'ครูยังไม่เปิดใบงานอิเล็กทรอนิกส์ในหน่วยนี้'}</div>`}${isStaff() ? '<div class="notice-card"><strong>Teaching Flow</strong><p>สอนด้วยสไลด์ให้จบ แล้วกด “จบสไลด์ • เปิดใบงานอิเล็กทรอนิกส์” เพื่อกำหนดเวลาเปิดและเวลาส่งให้ Group Code ที่เลือก</p></div>' : ''}</section>
    </div>
    <div class="content-grid two" style="margin-top:18px">
      <section class="panel"><div class="panel-head"><h3>แบบทดสอบประจำหน่วย</h3><span class="count-badge">${exams.length} ชุด</span></div>${exams.length ? `<div class="assessment-list">${exams.map((e) => `<div class="assessment-row"><div><strong>${esc(e.title)}</strong><small>${statusPill(e.status)} • ${esc(e.exam_type)} • ${e.duration_minutes ?? 30} นาที • ${e.full_score ?? 100} คะแนน</small></div>${isStaff() ? `<button class="btn light sm" data-open-exam="${e.id}">เปิดข้อสอบ</button>` : ''}</div>`).join('')}</div>` : '<div class="empty-state">ยังไม่มีแบบทดสอบที่เปิดในหน่วยนี้</div>'}</section>
      <section class="panel"><div class="panel-head"><h3>การแยกกลุ่มเรียน</h3></div><div class="notice-card"><strong>Group Code: ${esc(groupCode)}</strong><p>ใบงาน Digital ที่เปิดจากหน้าสอนจะมอบหมายเฉพาะนักศึกษาที่ลงทะเบียนวิชานี้และถูกกำหนด Group Code ตรงกันเท่านั้น</p></div><div class="notice-card"><strong>มือถือ</strong><p>มือถือยังคงใช้เฉพาะการส่งสำเนาใบงาน Paper ย้อนหลัง ไม่ใช้ทำใบงาน Digital</p></div></section>
    </div>
    <section class="panel" style="margin-top:18px"><div class="panel-head"><h3>20 สไลด์</h3><span class="count-badge">จบสไลด์ → เปิดใบงาน Digital</span></div><div class="slide-list">${slides.map((s) => `<button class="slide-row" data-slide-no="${s.no}"><span>${s.no}</span><div><strong>${esc(s.title)}</strong><small>${esc(s.body)}</small></div></button>`).join('')}</div></section>`;

  document.querySelector('#backUnits').onclick = () => loadUnits(currentSubjectId);
  document.querySelector('#presentSlides').onclick = () => presentSlides(subject, u, slides, 0);
  document.querySelectorAll('[data-slide-no]').forEach((button) => button.onclick = () => presentSlides(subject, u, slides, Math.max(0, Number(button.dataset.slideNo) - 1)));
  document.querySelectorAll('[data-open-ws]').forEach((button) => button.onclick = () => { sessionStorage.setItem('docnr.focus.worksheet', button.dataset.openWs); navigate('worksheets'); });
  document.querySelectorAll('[data-open-exam]').forEach((button) => button.onclick = () => { sessionStorage.setItem('docnr.focus.exam', button.dataset.openExam); navigate('exams'); });
  if (isStaff()) {
    document.querySelector('#editUnit').onclick = () => editUnit(data);
    document.querySelector('#unitHistory').onclick = () => showHistory('teaching_unit', unitId, `หน่วย ${u.unit_no}: ${u.title}`);
    document.querySelector('#openDigital').onclick = () => issueDigitalWorksheet(unitId);
  }
}

function presentSlides(subject, unit, slides, startIndex = 0) {
  let index = startIndex;
  const group = isStaff() ? offeringById(currentSubjectId, currentOfferingId) : null;
  const view = modal({
    title: `${subject.code || ''} • หน่วย ${unit.unit_no}${group?.plan_code ? ` • ${group.plan_code}` : ''}`,
    body: '<div id="presentation"></div>', hideSubmit: true, wide: true,
    extraFooter: '<button class="btn light" type="button" id="prevSlide">← ก่อนหน้า</button><button class="btn primary" type="button" id="nextSlide">ถัดไป →</button>',
  });
  const draw = () => {
    const slide = slides[index] || {};
    const area = document.querySelector('#presentation');
    const last = index >= slides.length - 1;
    area.innerHTML = `<div class="presentation-slide"><div class="presentation-top"><span>${esc(subject.code || '')}${group?.plan_code ? ` • ${esc(group.plan_code)}` : ''}</span><span>${index + 1} / ${slides.length}</span></div><h1>${esc(slide.title || '')}</h1><p>${esc(slide.body || '')}</p>${slide.review_question ? `<div class="review-question"><strong>คำถามคิดวิเคราะห์</strong><p>${esc(slide.review_question)}</p></div>` : ''}<div class="teacher-note"><strong>Teacher Note</strong><p>${esc(slide.teacher_note || 'เชื่อมโยงตัวอย่างกับงานจริงและตรวจความเข้าใจของผู้เรียน')}</p></div>${last && isStaff() ? '<div class="notice-card"><strong>จบเนื้อหาหน่วย</strong><p>ขั้นถัดไปคือเปิดใบงานอิเล็กทรอนิกส์ให้ Group Code ที่เลือก พร้อมกำหนดวันและเวลาส่ง</p></div>' : ''}</div>`;
    document.querySelector('#prevSlide').disabled = index <= 0;
    const next = document.querySelector('#nextSlide');
    next.disabled = false;
    next.textContent = last ? (isStaff() ? 'จบสไลด์ • เปิดใบงานอิเล็กทรอนิกส์' : 'จบสไลด์') : 'ถัดไป →';
  };
  document.querySelector('#prevSlide').onclick = () => { if (index > 0) { index -= 1; draw(); } };
  document.querySelector('#nextSlide').onclick = async () => {
    if (index < slides.length - 1) { index += 1; draw(); return; }
    view.close();
    if (isStaff()) await issueDigitalWorksheet(unit.id);
  };
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

async function issueDigitalWorksheet(unitId) {
  if (!currentOfferingId) {
    modal({ title: 'ยังไม่ได้เลือก Group Code', hideSubmit: true, body: '<div class="error-card"><strong>กรุณากลับไปเลือก Group Code ก่อนเปิดใบงานอิเล็กทรอนิกส์</strong><p>ระบบไม่อนุญาตให้จ่ายใบงานจากหน้าสอนแบบรวมทุกกลุ่ม เพื่อป้องกันการจ่ายงานผิดกลุ่ม</p></div>' });
    return;
  }

  const preview = await rpc('clean_teaching_digital_preview', { p_unit_id: unitId, p_offering_id: currentOfferingId });
  const students = arr(preview.students);
  const now = new Date();
  const due = new Date(Date.now() + 7 * 86400000);
  const groupCode = preview.offering?.plan_code || '-';

  if ((preview.eligible_count ?? 0) < 1) {
    modal({ title: `Group ${groupCode} ยังไม่มีนักศึกษา`, hideSubmit: true, body: `<div class="error-card"><strong>ไม่สามารถเปิดใบงานได้</strong><p>ยังไม่มีนักศึกษาที่ลงทะเบียนวิชา ${esc(preview.subject?.code || '')} และถูกกำหนด Group Code ${esc(groupCode)}</p><p>ให้ Admin ไปที่ ผู้ใช้ → ลงวิชา → กำหนด Group Code ก่อน</p></div>` });
    return;
  }

  modal({ title: `เปิดใบงานอิเล็กทรอนิกส์ • ${groupCode}`, wide: true, body: `
    <div class="confirm-summary"><div><span>หน่วย</span><strong>${preview.unit?.unit_no ?? '-'} • ${esc(preview.unit?.title || '')}</strong></div><div><span>รายวิชา</span><strong>${esc(preview.subject?.code || '')} ${esc(preview.subject?.name || '')}</strong></div><div><span>Group Code</span><strong>${esc(groupCode)}</strong></div><div><span>ผู้ได้รับงาน</span><strong>${preview.eligible_count ?? 0} คน</strong></div><div><span>คำถาม</span><strong>${preview.template?.question_count ?? 0} ข้อ</strong></div></div>
    <div class="student-preview">${students.slice(0, 40).map((s) => `<span>${esc(s.student_code || '')} ${esc(s.full_name || '')}</span>`).join('')}${students.length > 40 ? `<strong>และอีก ${students.length - 40} คน</strong>` : ''}</div>
    <div class="notice-card"><strong>Digital Worksheet</strong><p>หลังยืนยัน ระบบจะ Publish ใบงานดิจิทัลทันทีให้เฉพาะ Group ${esc(groupCode)} นักศึกษาสามารถบันทึกร่างและส่งงานผ่านคอม/แท็บเล็ตได้</p></div>
    <div class="form-grid"><label class="field"><span>วัน/เวลาเปิด</span><input name="open" type="datetime-local" value="${dateInput(now)}" required></label><label class="field"><span>วัน/เวลาส่ง</span><input name="due" type="datetime-local" value="${dateInput(due)}" required></label></div>`,
    submitLabel: 'เปิดใบงานอิเล็กทรอนิกส์',
    onSubmit: async (form) => {
      const result = await rpc('clean_teaching_open_digital_worksheet', {
        p_unit_id: unitId,
        p_offering_id: currentOfferingId,
        p_open_at: new Date(form.get('open')).toISOString(),
        p_due_at: new Date(form.get('due')).toISOString(),
      });
      toast(`เปิดใบงานให้ Group ${result.group?.plan_code || groupCode} แล้ว ${result.assigned_count ?? 0} คน`, 'ok');
      await showUnit(unitId);
    },
  });
}
