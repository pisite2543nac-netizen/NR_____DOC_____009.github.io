import { rpc } from '../api.js';
import { pageHead, setMain, arr, esc, statusPill, modal, options, toast } from '../ui.js';

export async function assignmentsPage() {
  const master = await rpc('clean_admin_master_data');
  const teachers = arr(master.users).filter((u) => u.role === 'teacher' && u.active);
  const subjects = arr(master.subjects);
  setMain(pageHead('มอบหมายครู', 'กำหนดครู → รายวิชา → กลุ่มเรียน', '<button class="btn primary" id="newAssignment">+ มอบหมาย</button>') + `
    ${teachers.length ? '' : '<div class="notice-card"><strong>ยังไม่มีบัญชีครู</strong><p>สร้างบัญชี role=teacher จากเมนูผู้ใช้ก่อน</p></div>'}
    <div class="table-wrap"><table><thead><tr><th>ครู</th><th>วิชา</th><th>กลุ่มเรียน</th><th>สถานะ</th></tr></thead><tbody>${arr(master.teacher_assignments).map((x) => `<tr><td>${esc(x.teacher_name)}</td><td>${esc(x.subject_code)} ${esc(x.subject_name)}</td><td><strong>${esc(x.learning_group_code || '-')}</strong></td><td>${statusPill(x.active ? 'active' : 'inactive')}</td></tr>`).join('')}</tbody></table></div>`);

  document.querySelector('#newAssignment').onclick = () => {
    modal({ title: 'มอบหมายครู', body: `
      <label class="field"><span>ครู</span><select name="teacher">${options(teachers, 'id', (x) => x.full_name)}</select></label>
      <label class="field"><span>รายวิชา</span><select name="subject" id="assignSubject">${options(subjects, 'id', (x) => `${x.code} ${x.name}`)}</select></label>
      <label class="field"><span>กลุ่มเรียน</span><select name="learning_group" id="assignGroup"></select><small>แสดงเฉพาะกลุ่มที่เรียนวิชานี้</small></label>`,
      onSubmit: async (form) => {
        await rpc('clean_admin_set_teacher_assignment_v2', { p_teacher_id: form.get('teacher'), p_subject_id: form.get('subject'), p_learning_group_id: form.get('learning_group'), p_active: true });
        toast('มอบหมายครูแล้ว', 'ok'); await assignmentsPage();
      },
    });
    const subjectSelect = document.querySelector('#assignSubject');
    const groupSelect = document.querySelector('#assignGroup');
    const drawGroups = () => {
      const subject = subjects.find((s) => s.id === subjectSelect.value) || {};
      groupSelect.innerHTML = arr(subject.offerings).map((o) => `<option value="${esc(o.learning_group_id)}">${esc(o.plan_code || '-')}</option>`).join('') || '<option value="">ไม่มีกลุ่มเรียน</option>';
    };
    subjectSelect.onchange = drawGroups; drawGroups();
  };
}
