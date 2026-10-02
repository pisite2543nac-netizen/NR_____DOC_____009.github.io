import { rpc } from '../api.js';
import { state } from '../state.js';
import { pageHead, setMain, arr, esc, modal, options, toast } from '../ui.js';
import { openStudentProfile } from '../student-profile.js';

export async function groupsPage() {
  const [groups, scope] = await Promise.all([rpc('clean_learning_groups_list'), rpc('clean_staff_scope')]);
  const rows = arr(groups);
  const admin = state.profile.role === 'admin';
  setMain(pageHead('กลุ่มเรียน', 'โครงหลัก: นักศึกษา 1 คน → กลุ่มเรียนหลัก 1 กลุ่ม → หลายรายวิชา') + `
    <div class="notice-card"><strong>กลุ่มห้องย่อยเป็นฟังก์ชันเสริมเท่านั้น</strong><p>ใช้แบ่งทีม/โครงงานได้ แต่ไม่ใช้เป็นเงื่อนไขแจกใบงาน ข้อสอบ หรือ Gradebook เพื่อป้องกัน Logic ซ้อนกัน</p></div>
    <div class="card-grid">${rows.map((g) => `<article class="info-card"><div class="row-between"><div><div class="eyebrow">Learning Group</div><h3>${esc(g.code)}</h3></div><span class="count-badge">${g.student_count ?? 0} คน</span></div><p>${g.subject_count ?? arr(g.subjects).length} รายวิชา</p><div class="chip-row">${arr(g.subjects).slice(0,6).map((s) => `<span class="chip">${esc(s.subject_code)}</span>`).join('')}</div><button class="btn primary full" data-learning-group="${g.id}">เปิดกลุ่ม</button></article>`).join('')}</div>
    ${admin ? '<div class="section-title"><div><span class="eyebrow">Optional</span><h2>กลุ่มย่อย / กลุ่มโครงงาน</h2></div><button class="btn light" id="showSubgroups">ดูระบบกลุ่มย่อยเดิม</button></div><div id="subgroupArea"></div>' : ''}`);
  document.querySelectorAll('[data-learning-group]').forEach((b) => b.onclick = () => showLearningGroup(b.dataset.learningGroup));
  if (admin) document.querySelector('#showSubgroups').onclick = showOptionalSubgroups;
}

async function showLearningGroup(id) {
  const [data, master] = await Promise.all([rpc('clean_learning_group_detail', { p_group_id: id }), state.profile.role === 'admin' ? rpc('clean_admin_master_data') : Promise.resolve(null)]);
  const g = data.group || {};
  const subjects = arr(data.subjects);
  const members = arr(data.members);
  setMain(pageHead(`กลุ่มเรียน ${g.code || ''}`, 'รายวิชาของกลุ่มและสมาชิก', '<button class="btn light" id="backGroups">← กลับ</button>' + (state.profile.role === 'admin' ? '<button class="btn primary" id="bulkAssign">จัดนักศึกษาหลายคน</button>' : '')) + `
    <div class="metric-grid compact"><div class="metric-card"><span>นักศึกษา</span><strong>${members.length}</strong></div><div class="metric-card"><span>รายวิชา</span><strong>${subjects.length}</strong></div></div>
    <div class="section-title"><div><span class="eyebrow">Curriculum</span><h2>รายวิชาของกลุ่ม</h2></div></div>
    <div class="table-wrap"><table><thead><tr><th>รหัสวิชา</th><th>รายวิชา</th><th>ชม./สัปดาห์</th></tr></thead><tbody>${subjects.map((s) => `<tr><td><strong>${esc(s.subject_code || '')}</strong></td><td>${esc(s.subject_name || '')}</td><td>${s.weekly_hours ?? 0}</td></tr>`).join('')}</tbody></table></div>
    <div class="section-title"><div><span class="eyebrow">Members</span><h2>นักศึกษา</h2></div></div>
    ${members.length ? `<div class="table-wrap"><table><thead><tr><th>เลขที่</th><th>รหัส</th><th>ชื่อ</th><th>ห้อง</th><th></th></tr></thead><tbody>${members.map((m) => `<tr><td>${m.seat_number ?? '-'}</td><td>${esc(m.student_code || '')}</td><td>${esc(m.full_name || '')}</td><td>${esc(m.classroom_name || '-')}</td><td><button class="btn light sm" data-student-profile="${m.student_id}">โปรไฟล์</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีนักศึกษาในกลุ่มนี้</div>'}`);
  document.querySelector('#backGroups').onclick = groupsPage;
  document.querySelectorAll('[data-student-profile]').forEach((b) => b.onclick = () => openStudentProfile(b.dataset.studentProfile));
  if (state.profile.role !== 'admin') return;
  document.querySelector('#bulkAssign').onclick = () => {
    const students = arr(master.users).filter((u) => u.role === 'student' && u.approval_status === 'approved');
    modal({ title: `จัดนักศึกษาหลายคน → ${g.code}`, wide: true, body: `
      <div class="notice-card"><strong>Bulk Assign</strong><p>นักศึกษาที่เลือกจะถูกย้ายมาอยู่กลุ่ม ${esc(g.code)} และระบบจะลงทะเบียน ${subjects.length} รายวิชาของกลุ่มให้อัตโนมัติ</p></div>
      <div class="form-grid"><label class="field"><span>ห้องเรียนจริง (ถ้าต้องการเปลี่ยน)</span><select name="classroom"><option value="">คงห้องเดิม</option>${options(master.classrooms, 'id', (c) => c.name)}</select></label><label class="field"><span>เลขที่เริ่มต้น (ไม่บังคับ)</span><input name="seat_start" type="number" min="1"></label></div>
      <div class="check-list">${students.map((s) => `<label><input type="checkbox" name="student" value="${s.id}" ${s.learning_group_id === g.id ? 'checked' : ''}><span>${esc(s.student_code || '')} ${esc(s.full_name)}${s.learning_group_code ? ` • ปัจจุบัน ${esc(s.learning_group_code)}` : ''}</span></label>`).join('')}</div>`, submitLabel: 'จัดกลุ่มนักศึกษา', onSubmit: async (form) => {
        const ids = [...document.querySelectorAll('#modalForm [name="student"]:checked')].map((x) => x.value);
        if (!ids.length) throw new Error('กรุณาเลือกนักศึกษาอย่างน้อย 1 คน');
        await rpc('clean_admin_assign_learning_group', { p_student_ids: ids, p_learning_group_id: g.id, p_classroom_id: form.get('classroom') || null, p_seat_start: form.get('seat_start') ? Number(form.get('seat_start')) : null });
        toast(`จัดกลุ่ม ${ids.length} คนแล้ว`, 'ok'); await showLearningGroup(g.id);
      } });
  };
}

async function showOptionalSubgroups() {
  const rows = arr(await rpc('clean_room_groups_list'));
  document.querySelector('#subgroupArea').innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr><th>รหัส</th><th>ชื่อกลุ่มย่อย</th><th>ห้อง</th><th>สมาชิก</th><th>วิชาที่ผูก</th></tr></thead><tbody>${rows.map((g) => `<tr><td>${esc(g.code)}</td><td>${esc(g.name)}</td><td>${esc(g.classroom_name || '-')}</td><td>${g.member_count ?? 0}</td><td>${g.subject_count ?? 0}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีกลุ่มย่อย และไม่จำเป็นต้องสร้างหากไม่ได้ใช้แบ่งทีม/โครงงาน</div>';
}
