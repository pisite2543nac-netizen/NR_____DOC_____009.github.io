import { rpc, edge } from '../api.js';
import { pageHead, setMain, arr, esc, statusPill, modal, options, toast } from '../ui.js';
import { openStudentProfile } from '../student-profile.js';

let master = null;
const groups = () => arr(master?.learning_groups);

function suggestedClassroom(user) {
  return arr(master.classrooms).find((c) =>
    (!user.grade_level || c.level === user.grade_level) &&
    (!user.room_label || c.room_label === user.room_label) &&
    (!user.department || !c.department || c.department === user.department) &&
    (!user.major || !c.major || c.major === user.major)
  ) || arr(master.classrooms).find((c) => (!user.grade_level || c.level === user.grade_level) && (!user.room_label || c.room_label === user.room_label));
}

function groupInfo(groupId) {
  return groups().find((g) => g.id === groupId) || null;
}

function groupPreviewHtml(groupId) {
  const g = groupInfo(groupId);
  if (!g) return '<div class="empty-state">เลือกกลุ่มเรียนเพื่อดูรายวิชา</div>';
  const subjects = arr(g.subjects);
  return `<div class="notice-card"><strong>กลุ่มเรียน ${esc(g.code)}</strong><p>ระบบจะลงทะเบียนรายวิชาในกลุ่มนี้ให้อัตโนมัติ ${subjects.length} วิชา และใช้กลุ่มเดียวกันในการแจกใบงาน/ข้อสอบ/Gradebook</p></div>
    <div class="table-wrap compact"><table><thead><tr><th>รหัสวิชา</th><th>รายวิชา</th><th>ชม./สัปดาห์</th></tr></thead><tbody>${subjects.map((s) => `<tr><td>${esc(s.subject_code || '')}</td><td>${esc(s.subject_name || '')}</td><td>${s.weekly_hours ?? 0}</td></tr>`).join('')}</tbody></table></div>`;
}

export async function usersPage() {
  master = await rpc('clean_admin_master_data');
  const pending = arr(master.users).filter((u) => u.role === 'student' && u.approval_status === 'pending');
  setMain(pageHead('ผู้ใช้และการลงทะเบียน', 'นักศึกษาอยู่กลุ่มเรียนหลักเพียง 1 กลุ่ม และกลุ่มนั้นผูกหลายวิชาอัตโนมัติ', '<button class="btn light" id="registrationSettings">ตั้งค่ารับสมัคร</button><button class="btn primary" id="createUser">+ สร้างผู้ใช้</button>') + `
    ${pending.length ? `<div class="alert-banner"><strong>มีนักศึกษารออนุมัติ ${pending.length} คน</strong><span>ตรวจโปรไฟล์ → ยืนยันห้อง/เลขที่ → เลือกกลุ่มเรียนหลักเพียงครั้งเดียว</span></div>` : ''}
    <div class="toolbar"><input id="userSearch" class="grow" placeholder="ค้นหาชื่อ / ชื่อเล่น / รหัส / โทรศัพท์ / กลุ่มเรียน"><select id="roleFilter"><option value="">ทุกบทบาท</option><option value="admin">Admin</option><option value="teacher">Teacher</option><option value="student">Student</option></select><select id="approvalFilter"><option value="">ทุกสถานะ</option><option value="pending">รออนุมัติ</option><option value="approved">อนุมัติแล้ว</option><option value="rejected">ไม่อนุมัติ</option></select></div>
    <div id="userTable"></div>`);

  const draw = () => {
    const q = document.querySelector('#userSearch').value.trim().toLowerCase();
    const role = document.querySelector('#roleFilter').value;
    const approval = document.querySelector('#approvalFilter').value;
    const rows = arr(master.users).filter((u) => (!role || u.role === role) && (!approval || u.approval_status === approval) && `${u.full_name || ''} ${u.display_name || ''} ${u.student_code || ''} ${u.username || ''} ${u.phone || ''} ${u.learning_group_code || ''}`.toLowerCase().includes(q));
    document.querySelector('#userTable').innerHTML = `<div class="table-wrap"><table><thead><tr><th>ผู้ใช้</th><th>ข้อมูลการศึกษา</th><th>กลุ่มเรียนหลัก</th><th>ห้องจริง</th><th>สถานะ</th><th>การจัดการ</th></tr></thead><tbody>${rows.map((u) => `<tr><td><strong>${esc(u.full_name)}</strong><small>${esc(u.display_name || '-')} • ${esc(u.student_code || u.username || '')}</small><small>${esc(u.phone || '')}</small></td><td>${u.role === 'student' ? `<strong>${esc(u.grade_level || '-')} ${esc(u.room_label || '')}</strong><small>${esc(u.department || '-')} • ${esc(u.major || '-')}</small>` : '-'}</td><td>${u.role === 'student' ? `<strong>${esc(u.learning_group_code || 'ยังไม่กำหนด')}</strong>` : '-'}</td><td>${esc(u.classroom_name || '-')}<small>${u.seat_number ? `เลขที่ ${esc(u.seat_number)}` : ''}</small></td><td>${statusPill(u.approval_status)} ${statusPill(u.active ? 'active' : 'inactive')}</td><td class="actions-cell">${u.role === 'student' ? `<button class="btn light sm" data-detail="${u.id}">โปรไฟล์</button>` : ''}${u.role === 'student' && u.approval_status === 'pending' ? `<button class="btn primary sm" data-approve="${u.id}">อนุมัติ</button><button class="btn danger sm" data-reject="${u.id}">ไม่อนุมัติ</button>` : ''}${u.role === 'student' && u.approval_status === 'approved' ? `<button class="btn light sm" data-group="${u.id}">จัดกลุ่มเรียน</button>` : ''}<button class="btn ${u.active ? 'danger' : 'ok'} sm" data-toggle="${u.id}" data-active="${u.active}">${u.active ? 'ระงับ' : 'เปิดใช้'}</button></td></tr>`).join('')}</tbody></table></div>`;
    document.querySelectorAll('[data-detail]').forEach((b) => b.onclick = () => openStudentProfile(b.dataset.detail));
    document.querySelectorAll('[data-approve]').forEach((b) => b.onclick = () => approveStudent(b.dataset.approve));
    document.querySelectorAll('[data-reject]').forEach((b) => b.onclick = () => rejectStudent(b.dataset.reject));
    document.querySelectorAll('[data-group]').forEach((b) => b.onclick = () => learningGroupModal(b.dataset.group));
    document.querySelectorAll('[data-toggle]').forEach((b) => b.onclick = () => toggleUser(b.dataset.toggle, b.dataset.active === 'true'));
  };

  draw();
  document.querySelector('#userSearch').oninput = draw;
  document.querySelector('#roleFilter').onchange = draw;
  document.querySelector('#approvalFilter').onchange = draw;
  document.querySelector('#createUser').onclick = createUserModal;
  document.querySelector('#registrationSettings').onclick = registrationSettingsModal;
}

function approveStudent(userId) {
  const user = arr(master.users).find((u) => u.id === userId) || {};
  const suggested = suggestedClassroom(user);
  const firstGroup = groups()[0]?.id || '';
  const view = modal({ title: `อนุมัตินักศึกษา • ${user.full_name || ''}`, wide: true, body: `
    <div class="notice-card"><strong>รูปแบบใหม่ที่ลดความซับซ้อน</strong><p>เลือกกลุ่มเรียนหลักเพียง 1 กลุ่ม ระบบจะลงวิชาทั้งหมดของกลุ่มนั้นให้อัตโนมัติ ไม่ต้องกำหนด Group Code ทีละวิชา</p></div>
    <div class="form-grid"><label class="field"><span>ห้องเรียนจริง</span><select name="classroom" required>${options(master.classrooms, 'id', (c) => `${c.name}${c.level ? ` • ${c.level}` : ''}`, suggested?.id)}</select></label><label class="field"><span>เลขที่</span><input name="seat" type="number" min="1" max="999"></label><label class="field span2"><span>กลุ่มเรียนหลัก</span><select name="learning_group" id="approveLearningGroup" required>${options(groups(), 'id', (g) => `${g.code} • ${g.subject_count ?? arr(g.subjects).length} วิชา`, firstGroup)}</select><small>นักศึกษาหนึ่งคนอยู่กลุ่มเรียนหลักเดียว กลุ่มนั้นเรียนหลายวิชา</small></label></div>
    <div id="approveGroupPreview">${groupPreviewHtml(firstGroup)}</div>`, submitLabel: 'อนุมัติและลงวิชาอัตโนมัติ',
    onSubmit: async (form) => {
      await rpc('clean_admin_approve_student_v4', { p_user_id: userId, p_learning_group_id: form.get('learning_group'), p_classroom_id: form.get('classroom'), p_seat_number: form.get('seat') ? Number(form.get('seat')) : null });
      toast('อนุมัติและจัดกลุ่มเรียนแล้ว', 'ok'); await usersPage();
    },
  });
  const select = document.querySelector('#approveLearningGroup');
  select.onchange = () => { document.querySelector('#approveGroupPreview').innerHTML = groupPreviewHtml(select.value); };
  return view;
}

async function rejectStudent(userId) {
  const user = arr(master.users).find((u) => u.id === userId) || {};
  modal({ title: `ไม่อนุมัติ • ${user.full_name || ''}`, body: '<label class="field"><span>เหตุผล</span><textarea name="reason" rows="5" required placeholder="ระบุเหตุผลให้นักศึกษาทราบ"></textarea></label>', submitLabel: 'ยืนยันไม่อนุมัติ', onSubmit: async (form) => { await rpc('clean_admin_reject_student', { p_user_id: userId, p_reason: form.get('reason') }); toast('บันทึกสถานะไม่อนุมัติแล้ว', 'ok'); await usersPage(); } });
}

function learningGroupModal(userId) {
  const user = arr(master.users).find((u) => u.id === userId) || {};
  const suggested = user.classroom_id || suggestedClassroom(user)?.id || arr(master.classrooms)[0]?.id || '';
  const selected = user.learning_group_id || groups()[0]?.id || '';
  modal({ title: `จัดกลุ่มเรียน • ${user.full_name || ''}`, wide: true, body: `
    <div class="notice-card"><strong>เปลี่ยนกลุ่มเรียนหลัก</strong><p>เมื่อเปลี่ยนกลุ่ม ระบบจะถอนวิชาที่ไม่อยู่ในกลุ่มเดิมและลงวิชาของกลุ่มใหม่ให้อัตโนมัติ การแจกใบงานและ Gradebook จะอ้างกลุ่มหลักนี้</p></div>
    <div class="form-grid"><label class="field"><span>กลุ่มเรียนหลัก</span><select name="learning_group" id="manageLearningGroup" required>${options(groups(), 'id', (g) => `${g.code} • ${g.subject_count ?? arr(g.subjects).length} วิชา`, selected)}</select></label><label class="field"><span>ห้องเรียนจริง</span><select name="classroom"><option value="">คงห้องเดิม</option>${options(master.classrooms, 'id', (c) => c.name, suggested)}</select></label><label class="field"><span>เลขที่</span><input name="seat" type="number" min="1" max="999" value="${esc(user.seat_number || '')}"></label></div>
    <div id="manageGroupPreview">${groupPreviewHtml(selected)}</div>`, submitLabel: 'บันทึกกลุ่มเรียน',
    onSubmit: async (form) => {
      await rpc('clean_admin_assign_learning_group', { p_student_ids: [userId], p_learning_group_id: form.get('learning_group'), p_classroom_id: form.get('classroom') || null, p_seat_start: form.get('seat') ? Number(form.get('seat')) : null });
      toast('อัปเดตกลุ่มเรียนและรายวิชาแล้ว', 'ok'); await usersPage();
    },
  });
  const select = document.querySelector('#manageLearningGroup');
  select.onchange = () => { document.querySelector('#manageGroupPreview').innerHTML = groupPreviewHtml(select.value); };
}

async function toggleUser(userId, active) {
  const user = arr(master.users).find((u) => u.id === userId);
  await rpc('clean_admin_set_user_status', { p_user_id: userId, p_active: !active, p_approval_status: user.approval_status || 'approved', p_academic_status: active ? 'suspended' : 'studying' });
  toast(active ? 'ระงับผู้ใช้แล้ว' : 'เปิดใช้งานผู้ใช้แล้ว', 'ok'); await usersPage();
}

function createUserModal() {
  modal({ title: 'สร้างผู้ใช้โดย Admin', wide: true, body: `<div class="form-grid"><label class="field"><span>บทบาท</span><select name="role"><option value="student">student</option><option value="teacher">teacher</option><option value="admin">admin</option></select></label><label class="field"><span>ชื่อ-สกุล</span><input name="full_name" required></label><label class="field"><span>ชื่อเล่น/ชื่อแสดง</span><input name="display_name"></label><label class="field"><span>Username</span><input name="username" required></label><label class="field"><span>รหัสผ่าน</span><input name="password" type="password" minlength="8" required></label><label class="field"><span>รหัสนักศึกษา</span><input name="student_code"></label><label class="field"><span>Email</span><input name="email" type="email"></label><label class="field"><span>โทรศัพท์</span><input name="phone"></label><label class="field"><span>ห้องเรียน</span><select name="classroom"><option value="">-</option>${options(master.classrooms, 'id', (c) => `${c.name}`)}</select></label><label class="field"><span>เลขที่</span><input name="seat" type="number" min="1"></label><label class="field span2"><span>กลุ่มเรียนหลัก (เฉพาะ Student)</span><select name="learning_group"><option value="">กำหนดภายหลัง</option>${options(groups(), 'id', (g) => `${g.code} • ${g.subject_count ?? arr(g.subjects).length} วิชา`)}</select><small>เลือกครั้งเดียว ระบบจะลงวิชาของกลุ่มให้อัตโนมัติ</small></label></div>`, submitLabel: 'สร้างผู้ใช้', onSubmit: async (form) => {
    const result = await edge('clean-admin-create-user', { role: form.get('role'), full_name: form.get('full_name'), display_name: form.get('display_name'), username: form.get('username'), password: form.get('password'), student_code: form.get('student_code'), email: form.get('email'), phone: form.get('phone'), classroom_id: form.get('classroom') || null, seat_number: form.get('seat') ? Number(form.get('seat')) : null, subject_ids: [] });
    if (form.get('role') === 'student' && form.get('learning_group') && result?.id) {
      await rpc('clean_admin_assign_learning_group', { p_student_ids: [result.id], p_learning_group_id: form.get('learning_group'), p_classroom_id: form.get('classroom') || null, p_seat_start: form.get('seat') ? Number(form.get('seat')) : null });
    }
    toast('สร้างผู้ใช้สำเร็จ', 'ok'); await usersPage();
  } });
}

async function registrationSettingsModal() {
  const cfg = await rpc('clean_admin_registration_settings');
  modal({ title: 'ตั้งค่าการลงทะเบียนนักศึกษา', body: `<label class="check-card form-check-card"><input type="checkbox" name="enabled" ${cfg.enabled ? 'checked' : ''}><span><b>เปิดรับลงทะเบียน</b><small>ปิดได้เมื่อไม่ต้องการรับบัญชีใหม่</small></span></label><label class="check-card form-check-card"><input type="checkbox" name="code_required" ${cfg.code_required ? 'checked' : ''}><span><b>บังคับ Registration Code</b><small>${cfg.code_set ? 'มีรหัสตั้งไว้แล้ว' : 'ยังไม่ได้ตั้งรหัส'}</small></span></label><label class="field"><span>ตั้ง/เปลี่ยน Registration Code</span><input name="registration_code" minlength="6" placeholder="เว้นว่างเพื่อใช้รหัสเดิม"><small>อย่างน้อย 6 ตัวอักษร ระบบเก็บเฉพาะ SHA-256 ไม่เก็บรหัสจริง</small></label>`, submitLabel: 'บันทึกการตั้งค่า', onSubmit: async (form) => { await rpc('clean_admin_set_registration_settings', { p_enabled: form.has('enabled'), p_code_required: form.has('code_required'), p_registration_code: form.get('registration_code') || null }); toast('บันทึกการตั้งค่ารับสมัครแล้ว', 'ok'); } });
}
