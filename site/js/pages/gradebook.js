import { rpc } from '../api.js';
import { pageHead, setMain, arr, esc, options, downloadCsv } from '../ui.js';

export async function gradebookPage() {
  const scope = await rpc('clean_staff_scope');
  const subjects = arr(scope.subjects);
  setMain(pageHead('Gradebook', 'คำนวณจาก Backend และแยกตามรายวิชา + กลุ่มเรียน เพื่อไม่ให้คะแนนปะปน') + `
    <div class="toolbar"><select id="gradeSubject"><option value="">เลือกรายวิชา</option>${options(subjects, 'id', (s) => `${s.code} ${s.name}`)}</select><select id="gradeGroup"><option value="">เลือกกลุ่มเรียน</option></select><button class="btn primary" id="loadGrade">โหลดคะแนน</button><button class="btn light" id="exportGrade" disabled>Export CSV</button></div>
    <div id="gradeBody" class="empty-state">เลือกรายวิชาและกลุ่มเรียนเพื่อดูคะแนน</div>`);
  let rows = [];
  const drawGroups = () => {
    const subject = subjects.find((s) => s.id === document.querySelector('#gradeSubject').value) || {};
    const seen = new Set();
    const groups = arr(subject.offerings).filter((o) => o.learning_group_id && !seen.has(o.learning_group_id) && seen.add(o.learning_group_id));
    document.querySelector('#gradeGroup').innerHTML = '<option value="">เลือกกลุ่มเรียน</option>' + groups.map((g) => `<option value="${esc(g.learning_group_id)}">${esc(g.plan_code || '-')} • ${g.enrolled_count ?? 0} คน</option>`).join('');
    if (groups.length === 1) document.querySelector('#gradeGroup').value = groups[0].learning_group_id;
  };
  document.querySelector('#gradeSubject').onchange = drawGroups;
  document.querySelector('#loadGrade').onclick = async () => {
    const subjectId = document.querySelector('#gradeSubject').value;
    const groupId = document.querySelector('#gradeGroup').value;
    if (!subjectId || !groupId) return;
    const data = await rpc('clean_gradebook_group', { p_subject_id: subjectId, p_learning_group_id: groupId });
    rows = arr(data.rows || data);
    document.querySelector('#exportGrade').disabled = !rows.length;
    document.querySelector('#gradeBody').innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr><th>รหัส</th><th>ชื่อ</th><th>กลุ่ม</th><th>งาน รับ/ส่ง/ตรวจ</th><th>งาน</th><th>พฤติกรรม</th><th>กลางภาค</th><th>ปลายภาค</th><th>รวม</th><th>เกรด</th><th>ผล</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.student_code || '')}</td><td>${esc(r.full_name || '')}</td><td>${esc(r.group_code || '-')}</td><td>${r.worksheet_assigned ?? 0}/${r.worksheet_submitted ?? 0}/${r.worksheet_graded ?? 0}</td><td>${r.worksheet_score ?? 0}</td><td>${r.behavior_score ?? 0}</td><td>${r.midterm_score ?? 0}</td><td>${r.final_score ?? 0}</td><td><strong>${r.total_score ?? 0}</strong></td><td>${r.grade ?? '-'}</td><td>${esc(r.pass_status || '')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีข้อมูลคะแนนในกลุ่มนี้</div>';
  };
  document.querySelector('#exportGrade').onclick = () => downloadCsv('gradebook-by-learning-group.csv', rows, ['student_code','full_name','group_code','worksheet_assigned','worksheet_submitted','worksheet_graded','worksheet_score','behavior_score','midterm_score','final_score','total_score','grade','pass_status']);
}

export async function gradesPage() {
  setMain(pageHead('สถานะการส่งงาน', 'บัญชีนักศึกษาไม่แสดงคะแนน') + '<div class="empty-state">ดูสถานะใบงานจากแดชบอร์ดและเมนูใบงาน</div>');
}
