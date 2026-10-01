import { rpc } from '../api.js';
import { state } from '../state.js';
import { pageHead, setMain, arr, esc, modal, options, toast } from '../ui.js';
import { navigate } from '../router.js';
import { openStudentProfile } from '../student-profile.js';

export async function groupsPage() {
  const rows = arr(await rpc('clean_room_groups_list'));
  const admin = state.profile.role === 'admin';
  setMain(pageHead('กลุ่มห้อง', 'จัดกลุ่มนักศึกษาและผูกกับรายวิชา', admin ? '<button class="btn primary" id="newGroup">+ สร้างกลุ่ม</button>' : '') + (rows.length ? `<div class="table-wrap"><table><thead><tr><th>กลุ่ม</th><th>ห้อง</th><th>สมาชิก</th><th>วิชา</th><th></th></tr></thead><tbody>${rows.map((g) => `<tr><td><strong>${esc(g.code)} • ${esc(g.name)}</strong></td><td>${esc(g.classroom_name || '-')}</td><td>${g.member_count ?? 0}</td><td>${g.subject_count ?? 0}</td><td><button class="btn light sm" data-group="${g.id}">เปิด</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีกลุ่มห้อง</div>'));
  document.querySelectorAll('[data-group]').forEach((b) => b.onclick = () => showGroup(b.dataset.group));
  if (admin) document.querySelector('#newGroup').onclick = async () => {
    const master = await rpc('clean_admin_master_data');
    modal({ title: 'สร้างกลุ่มห้อง', body: `<label class="field"><span>รหัสกลุ่ม</span><input name="code" required></label><label class="field"><span>ชื่อกลุ่ม</span><input name="name" required></label><label class="field"><span>ห้อง</span><select name="classroom"><option value="">-</option>${options(master.classrooms, 'id', (c) => `${c.code || ''} ${c.name}`)}</select></label><label class="field"><span>รายละเอียด</span><textarea name="description"></textarea></label>`, onSubmit: async (form) => { await rpc('clean_room_group_upsert', { p_id: null, p_code: form.get('code'), p_name: form.get('name'), p_classroom_id: form.get('classroom') || null, p_description: form.get('description'), p_active: true }); toast('สร้างกลุ่มแล้ว', 'ok'); await groupsPage(); } });
  };
}

async function showGroup(id) {
  const [members, scope] = await Promise.all([rpc('clean_room_group_members', { p_group_id: id }), rpc('clean_staff_scope')]);
  const rows = arr(members);
  setMain(pageHead('รายละเอียดกลุ่มห้อง', 'สมาชิกและรายวิชา', '<button class="btn light" id="backGroups">← กลับ</button>' + (state.profile.role === 'admin' ? '<button class="btn primary" id="manageMembers">จัดสมาชิก</button><button class="btn light" id="bindSubject">ผูกวิชา</button>' : '')) + `<div class="table-wrap"><table><thead><tr><th>เลขที่</th><th>รหัส</th><th>ชื่อ</th><th></th></tr></thead><tbody>${rows.map((m) => `<tr><td>${m.seat_number ?? '-'}</td><td>${esc(m.student_code || '')}</td><td>${esc(m.full_name || '')}</td><td><button class="btn light sm" data-student-profile="${m.student_id}">โปรไฟล์</button></td></tr>`).join('')}</tbody></table></div>`);
  document.querySelector('#backGroups').onclick = () => navigate('groups');
  document.querySelectorAll('[data-student-profile]').forEach((b) => b.onclick = () => openStudentProfile(b.dataset.studentProfile));
  if (state.profile.role !== 'admin') return;
  const master = await rpc('clean_admin_master_data');
  document.querySelector('#manageMembers').onclick = () => {
    const students = arr(master.users).filter((u) => u.role === 'student' && u.approval_status === 'approved');
    modal({ title: 'จัดสมาชิกกลุ่ม', wide: true, body: `<div class="check-list">${students.map((s) => `<label><input type="checkbox" name="student" value="${s.id}" ${rows.some((m) => m.student_id === s.id) ? 'checked' : ''}> <span>${esc(s.student_code || '')} ${esc(s.full_name)}</span></label>`).join('')}</div>`, onSubmit: async () => { const list = [...document.querySelectorAll('#modalForm [name="student"]:checked')].map((x, i) => ({ student_id: x.value, seat_number: i + 1, active: true })); await rpc('clean_room_group_replace_members', { p_group_id: id, p_members: list }); toast('อัปเดตสมาชิกแล้ว', 'ok'); await showGroup(id); } });
  };
  document.querySelector('#bindSubject').onclick = () => modal({ title: 'ผูกรายวิชา', body: `<label class="field"><span>รายวิชา</span><select name="subject">${options(scope.subjects, 'id', (s) => `${s.code} ${s.name}`)}</select></label>`, onSubmit: async (form) => { await rpc('clean_room_group_bind_subject', { p_group_id: id, p_subject_id: form.get('subject'), p_active: true }); toast('ผูกรายวิชาแล้ว', 'ok'); } });
}
