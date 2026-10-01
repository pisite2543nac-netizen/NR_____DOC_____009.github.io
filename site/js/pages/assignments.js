import { rpc } from '../api.js';
import { pageHead, setMain, arr, esc, statusPill, modal, options, toast } from '../ui.js';

export async function assignmentsPage() {
  const master = await rpc('clean_admin_master_data');
  const teachers = arr(master.users).filter((u) => u.role === 'teacher' && u.active);
  setMain(pageHead('มอบหมายครู', 'กำหนดครู → รายวิชา → ห้องเรียน', '<button class="btn primary" id="newAssignment">+ มอบหมาย</button>') + `
    ${teachers.length ? '' : '<div class="notice-card"><strong>ยังไม่มีบัญชีครู</strong><p>สร้างบัญชี role=teacher จากเมนูผู้ใช้ก่อน</p></div>'}
    <div class="table-wrap"><table><thead><tr><th>ครู</th><th>วิชา</th><th>ห้อง</th><th>สถานะ</th></tr></thead><tbody>${arr(master.teacher_assignments).map((x) => `<tr><td>${esc(x.teacher_name)}</td><td>${esc(x.subject_code)} ${esc(x.subject_name)}</td><td>${esc(x.classroom_name)}</td><td>${statusPill(x.active ? 'active' : 'inactive')}</td></tr>`).join('')}</tbody></table></div>`);
  document.querySelector('#newAssignment').onclick = () => modal({ title: 'มอบหมายครู', body: `
    <label class="field"><span>ครู</span><select name="teacher">${options(teachers, 'id', (x) => x.full_name)}</select></label>
    <label class="field"><span>รายวิชา</span><select name="subject">${options(master.subjects, 'id', (x) => `${x.code} ${x.name}`)}</select></label>
    <label class="field"><span>ห้องเรียน</span><select name="classroom">${options(master.classrooms, 'id', (x) => `${x.code || ''} ${x.name}`)}</select></label>`,
    onSubmit: async (form) => {
      await rpc('clean_admin_set_teacher_assignment', { p_teacher_id: form.get('teacher'), p_subject_id: form.get('subject'), p_classroom_id: form.get('classroom'), p_active: true });
      toast('มอบหมายครูแล้ว', 'ok'); await assignmentsPage();
    },
  });
}
