import { rpc, edge } from '../api.js';
import { pageHead, setMain, arr, esc, statusPill, modal, options, toast } from '../ui.js';

let master = null;

export async function usersPage() {
  master = await rpc('clean_admin_master_data');
  const pending = arr(master.users).filter((u) => u.role === 'student' && u.approval_status === 'pending');
  setMain(pageHead('ผู้ใช้และการลงทะเบียน', 'อนุมัติบัญชี กำหนดห้อง ลงรายวิชา กำหนด Group Code และจัดการสถานะ', '<button class="btn primary" id="createUser">+ สร้างผู้ใช้</button>') + `
    ${pending.length ? `<div class="alert-banner"><strong>มีนักศึกษารออนุมัติ ${pending.length} คน</strong><span>ควรอนุมัติพร้อมกำหนดห้องและรายวิชาก่อนให้เข้าใช้งาน</span></div>` : ''}
    <div class="toolbar"><input id="userSearch" class="grow" placeholder="ค้นหาชื่อ / รหัส / username"><select id="roleFilter"><option value="">ทุกบทบาท</option><option value="admin">Admin</option><option value="teacher">Teacher</option><option value="student">Student</option></select><select id="approvalFilter"><option value="">ทุกสถานะ</option><option value="pending">รออนุมัติ</option><option value="approved">อนุมัติแล้ว</option><option value="rejected">ไม่อนุมัติ</option></select></div>
    <div id="userTable"></div>`);
  const draw = () => {
    const q = document.querySelector('#userSearch').value.trim().toLowerCase();
    const role = document.querySelector('#roleFilter').value;
    const approval = document.querySelector('#approvalFilter').value;
    const rows = arr(master.users).filter((u) => (!role || u.role === role) && (!approval || u.approval_status === approval) && `${u.full_name || ''} ${u.student_code || ''} ${u.username || ''}`.toLowerCase().includes(q));
    document.querySelector('#userTable').innerHTML = `<div class="table-wrap"><table><thead><tr><th>ผู้ใช้</th><th>บทบาท</th><th>ห้อง</th><th>สถานะ</th><th>การจัดการ</th></tr></thead><tbody>${rows.map((u) => `<tr><td><strong>${esc(u.full_name)}</strong><small>${esc(u.student_code || u.username || '')}</small></td><td>${statusPill(u.role)}</td><td>${esc(u.classroom_name || '-')}</td><td>${statusPill(u.approval_status)} ${statusPill(u.active ? 'active' : 'inactive')}</td><td class="actions-cell">${u.role === 'student' && u.approval_status === 'pending' ? `<button class="btn primary sm" data-approve="${u.id}">อนุมัติ</button>` : ''}${u.role === 'student' && u.approval_status === 'approved' ? `<button class="btn light sm" data-enroll="${u.id}">ลงวิชา</button>` : ''}<button class="btn ${u.active ? 'danger' : 'ok'} sm" data-toggle="${u.id}" data-active="${u.active}">${u.active ? 'ระงับ' : 'เปิดใช้'}</button></td></tr>`).join('')}</tbody></table></div>`;
    document.querySelectorAll('[data-approve]').forEach((button) => button.onclick = () => approveStudent(button.dataset.approve));
    document.querySelectorAll('[data-enroll]').forEach((button) => button.onclick = () => enrollmentModal(button.dataset.enroll));
    document.querySelectorAll('[data-toggle]').forEach((button) => button.onclick = () => toggleUser(button.dataset.toggle, button.dataset.active === 'true'));
  };
  draw();
  document.querySelector('#userSearch').oninput = draw;
  document.querySelector('#roleFilter').onchange = draw;
  document.querySelector('#approvalFilter').onchange = draw;
  document.querySelector('#createUser').onclick = createUserModal;
}

function approveStudent(userId) {
  const user = arr(master.users).find((u) => u.id === userId);
  modal({ title: `อนุมัตินักศึกษา • ${user?.full_name || ''}`, wide: true, body: `
    <div class="notice-card"><strong>Approval Flow</strong><p>อนุมัติบัญชี + กำหนดห้อง + เลือกรายวิชาในครั้งเดียว วิชาที่มี Group Code เดียวจะถูกกำหนดให้อัตโนมัติ ส่วนวิชาที่มีหลาย Group Code ให้กด “ลงวิชา” เพื่อเลือกกลุ่มหลังอนุมัติ</p></div>
    <div class="form-grid"><label class="field"><span>ห้องเรียน</span><select name="classroom" required><option value="">เลือกห้อง</option>${options(master.classrooms, 'id', (c) => `${c.code || ''} ${c.name}`)}</select></label><label class="field"><span>เลขที่</span><input name="seat" type="number" min="1" max="999"></label><label class="field span2"><span>รายวิชาที่ลงทะเบียน</span><select name="subjects" multiple size="12">${options(master.subjects, 'id', (s) => `${s.code} ${s.name}`)}</select><small>กด Ctrl เพื่อเลือกหลายวิชา</small></label></div>`,
    submitLabel: 'อนุมัติและเปิดใช้งาน',
    onSubmit: async (form) => {
      const select = document.querySelector('#modalForm [name="subjects"]');
      const ids = [...select.selectedOptions].map((o) => o.value);
      await rpc('clean_admin_approve_student', { p_user_id: userId, p_classroom_id: form.get('classroom'), p_subject_ids: ids, p_seat_number: form.get('seat') ? Number(form.get('seat')) : null });
      toast(`อนุมัติแล้ว และลงทะเบียน ${ids.length} วิชา`, 'ok'); await usersPage();
    },
  });
}

async function enrollmentModal(userId) {
  const user = arr(master.users).find((u) => u.id === userId);
  const current = arr(await rpc('clean_admin_student_enrollments', { p_student_id: userId }));
  modal({ title: `ลงทะเบียนรายวิชา / Group Code • ${user?.full_name || ''}`, wide: true, body: `
    ${current.length ? `<div class="table-wrap compact"><table><thead><tr><th>วิชา</th><th>Group Code</th><th>ห้อง</th><th>สถานะ</th></tr></thead><tbody>${current.map((e) => `<tr><td>${esc(e.subject_code)} ${esc(e.subject_name)}</td><td><strong>${esc(e.group_code || 'ยังไม่กำหนด')}</strong></td><td>${esc(e.classroom_name || '-')}</td><td>${statusPill(e.status)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีรายวิชาที่ลงทะเบียน</div>'}
    <div class="form-grid" style="margin-top:16px"><label class="field"><span>รายวิชา</span><select name="subject" id="enrollSubject">${options(master.subjects, 'id', (s) => `${s.code} ${s.name}`)}</select></label>
    <label class="field"><span>Group Code</span><select name="offering" id="enrollOffering"></select><small>ใช้ Code นี้แยกกลุ่มสอนและแยกการสั่งจ่ายใบงาน</small></label>
    <label class="field"><span>ห้องเรียน</span><select name="classroom">${options(master.classrooms, 'id', (c) => `${c.code || ''} ${c.name}`)}</select></label>
    <label class="field"><span>สถานะ</span><select name="status"><option value="approved">approved</option><option value="pending">pending</option><option value="withdrawn">withdrawn</option></select></label></div>`,
    onSubmit: async (form) => {
      await rpc('clean_admin_set_enrollment_v2', { p_student_id: userId, p_subject_id: form.get('subject'), p_classroom_id: form.get('classroom'), p_offering_id: form.get('offering') || null, p_status: form.get('status') });
      toast('อัปเดตวิชาและ Group Code แล้ว', 'ok');
      await usersPage();
    },
  });
  const subjectSelect = document.querySelector('#enrollSubject');
  const offeringSelect = document.querySelector('#enrollOffering');
  const drawGroups = () => {
    const subject = arr(master.subjects).find((s) => s.id === subjectSelect.value) || {};
    const groups = arr(subject.offerings);
    offeringSelect.innerHTML = groups.length
      ? groups.map((o) => `<option value="${esc(o.id)}">${esc(o.plan_code || 'ไม่ระบุ')} • ${o.weekly_hours ?? 0} ชม./สัปดาห์</option>`).join('')
      : '<option value="">ไม่มี Group Code</option>';
  };
  subjectSelect.onchange = drawGroups;
  drawGroups();
}

async function toggleUser(userId, active) {
  const user = arr(master.users).find((u) => u.id === userId);
  await rpc('clean_admin_set_user_status', { p_user_id: userId, p_active: !active, p_approval_status: user.approval_status || 'approved', p_academic_status: active ? 'suspended' : 'studying' });
  toast(active ? 'ระงับผู้ใช้แล้ว' : 'เปิดใช้งานผู้ใช้แล้ว', 'ok'); await usersPage();
}

function createUserModal() {
  modal({ title: 'สร้างผู้ใช้โดย Admin', wide: true, body: `
    <div class="form-grid"><label class="field"><span>บทบาท</span><select name="role"><option value="student">student</option><option value="teacher">teacher</option><option value="admin">admin</option></select></label><label class="field"><span>ชื่อ-สกุล</span><input name="full_name" required></label><label class="field"><span>Username</span><input name="username" required></label><label class="field"><span>รหัสผ่าน</span><input name="password" type="password" minlength="8" required></label><label class="field"><span>รหัสนักศึกษา</span><input name="student_code"></label><label class="field"><span>Email</span><input name="email" type="email"></label><label class="field"><span>ห้องเรียน</span><select name="classroom"><option value="">-</option>${options(master.classrooms, 'id', (c) => `${c.code || ''} ${c.name}`)}</select></label><label class="field"><span>เลขที่</span><input name="seat" type="number" min="1"></label><label class="field span2"><span>รายวิชา</span><select name="subjects" multiple size="9">${options(master.subjects, 'id', (s) => `${s.code} ${s.name}`)}</select><small>วิชาที่มีหลาย Group Code ให้กำหนดกลุ่มภายหลังจากปุ่ม “ลงวิชา”</small></label></div>`,
    submitLabel: 'สร้างผู้ใช้',
    onSubmit: async (form) => {
      const ids = [...document.querySelector('#modalForm [name="subjects"]').selectedOptions].map((o) => o.value);
      await edge('clean-admin-create-user', { role: form.get('role'), full_name: form.get('full_name'), username: form.get('username'), password: form.get('password'), student_code: form.get('student_code'), email: form.get('email'), classroom_id: form.get('classroom') || null, seat_number: form.get('seat') ? Number(form.get('seat')) : null, subject_ids: ids });
      toast('สร้างผู้ใช้สำเร็จ', 'ok'); await usersPage();
    },
  });
}
