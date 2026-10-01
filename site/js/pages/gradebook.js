import { rpc } from '../api.js';
import { state } from '../state.js';
import { pageHead, setMain, arr, esc, options, downloadCsv } from '../ui.js';

export async function gradebookPage() {
  const scope = await rpc('clean_staff_scope');
  setMain(pageHead('Gradebook', 'คะแนนคำนวณจาก Backend เท่านั้น') + `
    <div class="toolbar"><select id="gradeSubject"><option value="">เลือกรายวิชา</option>${options(scope.subjects, 'id', (s) => `${s.code} ${s.name}`)}</select><button class="btn primary" id="loadGrade">โหลดคะแนน</button><button class="btn light" id="exportGrade" disabled>Export CSV</button></div>
    <div id="gradeBody" class="empty-state">เลือกรายวิชาเพื่อดูคะแนน</div>`);
  let rows = [];
  document.querySelector('#loadGrade').onclick = async () => {
    const id = document.querySelector('#gradeSubject').value;
    if (!id) return;
    const data = await rpc('clean_gradebook', { p_subject_id: id });
    rows = arr(data.rows || data);
    document.querySelector('#exportGrade').disabled = !rows.length;
    document.querySelector('#gradeBody').innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr><th>รหัส</th><th>ชื่อ</th><th>งาน</th><th>พฤติกรรม</th><th>กลางภาค</th><th>ปลายภาค</th><th>รวม</th><th>เกรด</th><th>ผล</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.student_code || '')}</td><td>${esc(r.full_name || '')}</td><td>${r.worksheet_score ?? 0}</td><td>${r.behavior_score ?? 0}</td><td>${r.midterm_score ?? 0}</td><td>${r.final_score ?? 0}</td><td><strong>${r.total_score ?? 0}</strong></td><td>${r.grade ?? '-'}</td><td>${esc(r.pass_status || '')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีข้อมูลคะแนน</div>';
  };
  document.querySelector('#exportGrade').onclick = () => downloadCsv('gradebook.csv', rows, ['student_code','full_name','worksheet_score','behavior_score','midterm_score','final_score','total_score','grade','pass_status']);
}

export async function gradesPage() {
  const rows = arr(await rpc('clean_my_grades'));
  setMain(pageHead('คะแนนของฉัน', 'ผลรวมจากใบงาน พฤติกรรม กลางภาค และปลายภาค') + (rows.length ? `<div class="table-wrap"><table><thead><tr><th>วิชา</th><th>งาน</th><th>พฤติกรรม</th><th>กลางภาค</th><th>ปลายภาค</th><th>รวม</th><th>เกรด</th><th>ผล</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.code)} ${esc(r.name)}</td><td>${r.worksheet_score ?? 0}</td><td>${r.behavior_score ?? 0}</td><td>${r.midterm_score ?? 0}</td><td>${r.final_score ?? 0}</td><td><strong>${r.total_score ?? 0}</strong></td><td>${r.grade ?? '-'}</td><td>${esc(r.pass_status || '')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีคะแนน</div>'));
}
