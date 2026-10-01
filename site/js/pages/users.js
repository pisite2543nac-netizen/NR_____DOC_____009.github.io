import { rpc, edge } from '../api.js';
import { pageHead, setMain, arr, esc, statusPill, modal, options, toast } from '../ui.js';

let master = null;

export async function usersPage() {
  master = await rpc('clean_admin_master_data');
  const pending = arr(master.users).filter((u) => u.role === 'student' && u.approval_status === 'pending');
  setMain(pageHead('ผู้ใช้และการลงทะเบียน', 'ตรวจข้อมูลสมัคร กำหนดห้อง เลขที่ รายวิชา และ Group Code ก่อนอนุมัติ', '<button class="btn light" id="registrationSettings">ตั้งค่ารับสมัคร</button><button class="btn primary" id="createUser">+ สร้างผู้ใช้</button>') + `
    ${pending.length ? `<div class="alert-banner"><strong>มีนักศึกษารออนุมัติ ${pending.length} คน</strong><span>เปิดดูรายละเอียดก่อนกำหนดห้อง รายวิชา และ Group Code</span></div>` : ''}
    <div class="toolbar"><input id="userSearch" class="grow" placeholder="ค้นหาชื่อ / ชื่อเล่น / รหัส / โทรศัพท์"><select id="roleFilter"><option value="">ทุกบทบาท</option><option value="admin">Admin</option><option value="teacher">Teacher</option><option value="student">Student</option></select><select id="approvalFilter"><option value="">ทุกสถานะ</option><option value="pending">รออนุมัติ</option><option value="approved">อนุมัติแล้ว</option><option value="rejected">ไม่อนุมัติ</option></select></div>
    <div id="userTable"></div>`);
  const draw = () => {
    const q = document.querySelector('#userSearch').value.trim().toLowerCase();
    const role = document.querySelector('#roleFilter').value;
    const approval = document.querySelector('#approvalFilter').value;
    const rows = arr(master.users).filter((u) => (!role || u.role === role) && (!approval || u.approval_status === approval) && `${u.full_name || ''} ${u.display_name || ''} ${u.student_code || ''} ${u.username || ''} ${u.phone || ''}`.toLowerCase().includes(q));
    document.querySelector('#userTable').innerHTML = `<div class="table-wrap"><table><thead><tr><th>ผู้ใช้</th><th>ข้อมูลการศึกษา</th><th>ห้องจริง</th><th>สถานะ</th><th>การจัดการ</th></tr></thead><tbody>${rows.map((u) => `<tr><td><strong>${esc(u.full_name)}</strong><small>${esc(u.display_name || '-')} • ${esc(u.student_code || u.username || '')}</small><small>${esc(u.phone || '')}</small></td><td>${u.role === 'student' ? `<strong>${esc(u.grade_level || '-')} ${esc(u.room_label || '')}</strong><small>${esc(u.department || '-')} • ${esc(u.major || '-')}</small>` : '-'}</td><td>${esc(u.classroom_name || '-')}<small>${u.seat_number ? `เลขที่ ${esc(u.seat_number)}` : ''}</small></td><td>${statusPill(u.approval_status)} ${statusPill(u.active ? 'active' : 'inactive')}</td><td class="actions-cell">${u.role === 'student' ? `<button class="btn light sm" data-detail="${u.id}">รายละเอียด</button>` : ''}${u.role === 'student' && u.approval_status === 'pending' ? `<button class="btn primary sm" data-approve="${u.id}">อนุมัติ</button><button class="btn danger sm" data-reject="${u.id}">ไม่อนุมัติ</button>` : ''}${u.role === 'student' && u.approval_status === 'approved' ? `<button class="btn light sm" data-enroll="${u.id}">ลงวิชา</button>` : ''}<button class="btn ${u.active ? 'danger' : 'ok'} sm" data-toggle="${u.id}" data-active="${u.active}">${u.active ? 'ระงับ' : 'เปิดใช้'}</button></td></tr>`).join('')}</tbody></table></div>`;
    document.querySelectorAll('[data-detail]').forEach((b) => b.onclick = () => studentDetail(b.dataset.detail));
    document.querySelectorAll('[data-approve]').forEach((b) => b.onclick = () => approveStudent(b.dataset.approve));
    document.querySelectorAll('[data-reject]').forEach((b) => b.onclick = () => rejectStudent(b.dataset.reject));
    document.querySelectorAll('[data-enroll]').forEach((b) => b.onclick = () => enrollmentModal(b.dataset.enroll));
    document.querySelectorAll('[data-toggle]').forEach((b) => b.onclick = () => toggleUser(b.dataset.toggle, b.dataset.active === 'true'));
  };
  draw();
  document.querySelector('#userSearch').oninput = draw;
  document.querySelector('#roleFilter').onchange = draw;
  document.querySelector('#approvalFilter').onchange = draw;
  document.querySelector('#createUser').onclick = createUserModal;
  document.querySelector('#registrationSettings').onclick = registrationSettingsModal;
}

function studentDetail(userId) {
  const u = arr(master.users).find((x) => x.id === userId) || {};
  const value = (label, v) => `<div><span>${label}</span><strong>${esc(v || '-')}</strong></div>`;
  modal({ title: `รายละเอียดนักศึกษา • ${u.full_name || ''}`, wide: true, hideSubmit: true, body: `
    <div class="registration-detail-grid">
      ${value('ชื่อ-สกุล', u.full_name)}${value('ชื่อเล่น', u.display_name)}${value('รหัสนักศึกษา', u.student_code)}${value('Username', u.username)}
      ${value('วันเกิด', u.birth_date)}${value('เบอร์โทร', u.phone)}${value('Email', u.contact_email)}${value('แหล่งลงทะเบียน', u.registration_source === 'self' ? 'สมัครด้วยตนเอง' : (u.registration_source || 'Admin'))}
      ${value('ระดับที่แจ้ง', u.grade_level)}${value('ห้องที่แจ้ง', u.room_label)}${value('แผนก', u.department)}${value('สาขา', u.major)}
      ${value('ห้องจริงในระบบ', u.classroom_name)}${value('เลขที่', u.seat_number)}${value('ขออนุมัติเมื่อ', u.approval_requested_at ? new Date(u.approval_requested_at).toLocaleString('th-TH') : '-')}${value('ตรวจเมื่อ', u.reviewed_at ? new Date(u.reviewed_at).toLocaleString('th-TH') : '-')}
    </div>
    ${u.rejection_reason ? `<div class="error-inline"><strong>เหตุผลไม่อนุมัติ:</strong> ${esc(u.rejection_reason)}</div>` : ''}
    <div class="notice-card"><strong>หลักการของ CLEAN</strong><p>ข้อมูลที่นักศึกษากรอกใช้ประกอบการตรวจสอบเท่านั้น ห้องเรียนจริง รายวิชา และ Group Code มีผลเมื่อ Admin ยืนยัน</p></div>` });
}

function suggestedClassroom(user) {
  return arr(master.classrooms).find((c) =>
    (!user.grade_level || c.level === user.grade_level) &&
    (!user.room_label || c.room_label === user.room_label) &&
    (!user.department || c.department === user.department) &&
    (!user.major || c.major === user.major)
  ) || arr(master.classrooms).find((c) => (!user.grade_level || c.level === user.grade_level) && (!user.room_label || c.room_label === user.room_label));
}

function approveStudent(userId) {
  const user = arr(master.users).find((u) => u.id === userId) || {};
  const suggested = suggestedClassroom(user);
  const rows = arr(master.subjects).map((s) => `<div class="enrollment-row" data-enrollment-row data-subject="${s.id}"><label class="check-card"><input type="checkbox" data-use-subject><span><b>${esc(s.code)} ${esc(s.name)}</b><small>${arr(s.offerings).length} Group Code</small></span></label><label class="field"><span>Group Code</span><select data-offering><option value="">${arr(s.offerings).length > 1 ? 'กรุณาเลือกกลุ่ม' : 'อัตโนมัติ'}</option>${arr(s.offerings).map((o) => `<option value="${esc(o.id)}">${esc(o.plan_code || '-')} • ${o.weekly_hours ?? 0} ชม./สัปดาห์</option>`).join('')}</select></label><button class="btn light sm" type="button" data-select-one>เลือก</button></div>`).join('');
  modal({ title: `ตรวจและอนุมัตินักศึกษา • ${user.full_name || ''}`, wide: true, body: `
    <div class="registration-detail-grid"><div><span>ชื่อเล่น</span><strong>${esc(user.display_name || '-')}</strong></div><div><span>รหัส</span><strong>${esc(user.student_code || '-')}</strong></div><div><span>วันเกิด</span><strong>${esc(user.birth_date || '-')}</strong></div><div><span>โทรศัพท์</span><strong>${esc(user.phone || '-')}</strong></div><div><span>ระดับ/ห้องที่แจ้ง</span><strong>${esc((user.grade_level || '-') + ' ' + (user.room_label || ''))}</strong></div><div><span>แผนก</span><strong>${esc(user.department || '-')}</strong></div><div><span>สาขา</span><strong>${esc(user.major || '-')}</strong></div><div><span>สถานะ</span><strong>${statusPill(user.approval_status)}</strong></div></div>
    <div class="form-grid"><label class="field"><span>ห้องเรียนจริง</span><select name="classroom" required><option value="">เลือกห้อง</option>${options(master.classrooms, 'id', (c) => `${c.code || ''} ${c.name}`, suggested?.id || '')}</select></label><label class="field"><span>เลขที่</span><input name="seat" type="number" min="1" max="999"></label></div>
    <div class="section-title"><div><span class="eyebrow">Enrollment</span><h2>รายวิชาและ Group Code</h2></div><span class="count-badge">เลือกเฉพาะวิชาที่เรียนจริง</span></div><div class="enrollment-builder">${rows}</div>`,
    submitLabel: 'ยืนยันอนุมัติ',
    onSubmit: async (form) => {
      const enrollments = [...document.querySelectorAll('[data-enrollment-row]')].filter((row) => row.querySelector('[data-use-subject]').checked).map((row) => ({ subject_id: row.dataset.subject, offering_id: row.querySelector('[data-offering]').value || null }));
      await rpc('clean_admin_approve_student_v2', { p_user_id: userId, p_classroom_id: form.get('classroom'), p_seat_number: form.get('seat') ? Number(form.get('seat')) : null, p_enrollments: enrollments });
      toast(`อนุมัติแล้ว • ${enrollments.length} รายวิชา`, 'ok'); await usersPage();
    },
  });
  document.querySelectorAll('[data-enrollment-row]').forEach((row) => {
    const use = row.querySelector('[data-use-subject]'); const sel = row.querySelector('[data-offering]'); const subject = arr(master.subjects).find((s) => s.id === row.dataset.subject);
    if (arr(subject?.offerings).length === 1) sel.value = subject.offerings[0].id;
    row.querySelector('[data-select-one]').onclick = () => { use.checked = true; };
  });
}

function rejectStudent(userId) {
  const user = arr(master.users).find((u) => u.id === userId) || {};
  modal({ title: `ไม่อนุมัติ • ${user.full_name || ''}`, body: `<label class="field"><span>เหตุผล</span><textarea name="reason" rows="5" minlength="3" required placeholder="ระบุเหตุผลเพื่อเก็บเป็นประวัติและให้ Admin ตรวจสอบย้อนหลัง"></textarea></label>`, submitLabel: 'ยืนยันไม่อนุมัติ', onSubmit: async (form) => { await rpc('clean_admin_reject_student', { p_user_id: userId, p_reason: form.get('reason') }); toast('บันทึกผลไม่อนุมัติแล้ว', 'ok'); await usersPage(); } });
}

async function registrationSettingsModal() {
  const cfg = await rpc('clean_admin_registration_settings');
  modal({ title: 'ตั้งค่าการลงทะเบียนนักศึกษา', body: `<label class="check-card"><input type="checkbox" name="enabled" ${cfg.enabled ? 'checked' : ''}><span><b>เปิดรับลงทะเบียน</b><small>ปิดได้เมื่อไม่ต้องการรับบัญชีใหม่</small></span></label><label class="check-card"><input type="checkbox" name="code_required" ${cfg.code_required ? 'checked' : ''}><span><b>บังคับ Registration Code</b><small>${cfg.code_set ? 'มีรหัสตั้งไว้แล้ว' : 'ยังไม่ได้ตั้งรหัส'}</small></span></label><label class="field"><span>ตั้ง/เปลี่ยน Registration Code</span><input name="registration_code" minlength="6" placeholder="เว้นว่างเพื่อใช้รหัสเดิม"><small>อย่างน้อย 6 ตัวอักษร ระบบเก็บเฉพาะ SHA-256 ไม่เก็บรหัสจริง</small></label>`, submitLabel: 'บันทึกการตั้งค่า', onSubmit: async (form) => { await rpc('clean_admin_set_registration_settings', { p_enabled: form.has('enabled'), p_code_required: form.has('code_required'), p_registration_code: form.get('registration_code') || null }); toast('บันทึกการตั้งค่ารับสมัครแล้ว', 'ok'); } });
}

async function enrollmentModal(userId) {
  const user = arr(master.users).find((u) => u.id === userId);
  const current = arr(await rpc('clean_admin_student_enrollments', { p_student_id: userId }));
  modal({ title: `ลงทะเบียนรายวิชา / Group Code • ${user?.full_name || ''}`, wide: true, body: `
    ${current.length ? `<div class="table-wrap compact"><table><thead><tr><th>วิชา</th><th>Group Code</th><th>ห้อง</th><th>สถานะ</th></tr></thead><tbody>${current.map((e) => `<tr><td>${esc(e.subject_code)} ${esc(e.subject_name)}</td><td><strong>${esc(e.group_code || 'ยังไม่กำหนด')}</strong></td><td>${esc(e.classroom_name || '-')}</td><td>${statusPill(e.status)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีรายวิชาที่ลงทะเบียน</div>'}
    <div class="form-grid" style="margin-top:16px"><label class="field"><span>รายวิชา</span><select name="subject" id="enrollSubject">${options(master.subjects, 'id', (s) => `${s.code} ${s.name}`)}</select></label><label class="field"><span>Group Code</span><select name="offering" id="enrollOffering"></select><small>ใช้ Code นี้แยกกลุ่มสอนและแยกการสั่งจ่ายใบงาน</small></label><label class="field"><span>ห้องเรียน</span><select name="classroom">${options(master.classrooms, 'id', (c) => `${c.code || ''} ${c.name}`)}</select></label><label class="field"><span>สถานะ</span><select name="status"><option value="approved">approved</option><option value="pending">pending</option><option value="withdrawn">withdrawn</option></select></label></div>`,
    onSubmit: async (form) => { await rpc('clean_admin_set_enrollment_v2', { p_student_id: userId, p_subject_id: form.get('subject'), p_classroom_id: form.get('classroom'), p_offering_id: form.get('offering') || null, p_status: form.get('status') }); toast('อัปเดตวิชาและ Group Code แล้ว', 'ok'); await usersPage(); },
  });
  const subjectSelect = document.querySelector('#enrollSubject'); const offeringSelect = document.querySelector('#enrollOffering');
  const drawGroups = () => { const subject = arr(master.subjects).find((s) => s.id === subjectSelect.value) || {}; const groups = arr(subject.offerings); offeringSelect.innerHTML = groups.length ? groups.map((o) => `<option value="${esc(o.id)}">${esc(o.plan_code || 'ไม่ระบุ')} • ${o.weekly_hours ?? 0} ชม./สัปดาห์</option>`).join('') : '<option value="">ไม่มี Group Code</option>'; };
  subjectSelect.onchange = drawGroups; drawGroups();
}

async function toggleUser(userId, active) {
  const user = arr(master.users).find((u) => u.id === userId);
  await rpc('clean_admin_set_user_status', { p_user_id: userId, p_active: !active, p_approval_status: user.approval_status || 'approved', p_academic_status: active ? 'suspended' : 'studying' });
  toast(active ? 'ระงับผู้ใช้แล้ว' : 'เปิดใช้งานผู้ใช้แล้ว', 'ok'); await usersPage();
}

function createUserModal() {
  modal({ title: 'สร้างผู้ใช้โดย Admin', wide: true, body: `<div class="form-grid"><label class="field"><span>บทบาท</span><select name="role"><option value="student">student</option><option value="teacher">teacher</option><option value="admin">admin</option></select></label><label class="field"><span>ชื่อ-สกุล</span><input name="full_name" required></label><label class="field"><span>ชื่อเล่น/ชื่อแสดง</span><input name="display_name"></label><label class="field"><span>Username</span><input name="username" required></label><label class="field"><span>รหัสผ่าน</span><input name="password" type="password" minlength="8" required></label><label class="field"><span>รหัสนักศึกษา</span><input name="student_code"></label><label class="field"><span>Email</span><input name="email" type="email"></label><label class="field"><span>โทรศัพท์</span><input name="phone"></label><label class="field"><span>ห้องเรียน</span><select name="classroom"><option value="">-</option>${options(master.classrooms, 'id', (c) => `${c.code || ''} ${c.name}`)}</select></label><label class="field"><span>เลขที่</span><input name="seat" type="number" min="1"></label><label class="field span2"><span>รายวิชา</span><select name="subjects" multiple size="9">${options(master.subjects, 'id', (s) => `${s.code} ${s.name}`)}</select><small>วิชาที่มีหลาย Group Code ให้กำหนดกลุ่มภายหลังจากปุ่ม “ลงวิชา”</small></label></div>`, submitLabel: 'สร้างผู้ใช้', onSubmit: async (form) => { const ids = [...document.querySelector('#modalForm [name="subjects"]').selectedOptions].map((o) => o.value); await edge('clean-admin-create-user', { role: form.get('role'), full_name: form.get('full_name'), display_name: form.get('display_name'), username: form.get('username'), password: form.get('password'), student_code: form.get('student_code'), email: form.get('email'), phone: form.get('phone'), classroom_id: form.get('classroom') || null, seat_number: form.get('seat') ? Number(form.get('seat')) : null, subject_ids: ids }); toast('สร้างผู้ใช้สำเร็จ', 'ok'); await usersPage(); } });
}
