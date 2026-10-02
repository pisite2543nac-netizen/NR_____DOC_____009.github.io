import { rpc } from '../api.js';
import { pageHead, setMain, arr, esc, options, downloadCsv, modal, toast } from '../ui.js';

const scoreText = (value, max) => `${Number(value || 0).toFixed(2).replace(/\.00$/, '')}/${max}`;

export async function gradebookPage() {
  const scope = await rpc('clean_staff_scope');
  const subjects = arr(scope.subjects);
  setMain(pageHead('สมุดคะแนน', 'คะแนนเต็ม 100: งาน 40 + กลางภาค 20 + ปลายภาค 20 + จิตพิสัย 20') + `
    <div class="metric-grid grade-rubric">
      <div class="metric-card"><span>คะแนนงาน</span><strong>40</strong><small>คิดจากงานที่ได้รับทั้งหมด งานที่ขาด/ยังไม่มีคะแนนเป็น 0 ในส่วนนั้น</small></div>
      <div class="metric-card"><span>สอบกลางภาค</span><strong>20</strong><small>ข้อสอบ 50 ข้อ คิดเป็น 20 คะแนน</small></div>
      <div class="metric-card"><span>สอบปลายภาค</span><strong>20</strong><small>ข้อสอบ 50 ข้อ คิดเป็น 20 คะแนน</small></div>
      <div class="metric-card"><span>จิตพิสัย</span><strong>20</strong><small>ส่งงานครบตรงเวลา 10 + ครูประเมิน 10</small></div>
    </div>
    <div class="notice-card"><strong>เกณฑ์จิตพิสัยอัตโนมัติ 10 คะแนน</strong><p>นักศึกษาต้องส่งงานที่ได้รับในรายวิชานี้ครบทุกชิ้นและไม่เกินกำหนดทุกชิ้นจึงได้ 10 คะแนน ส่วนอีก 10 คะแนนเป็นดุลยพินิจของครูผู้สอนและบันทึกพร้อมหมายเหตุได้</p></div>
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

  const renderRows = () => {
    document.querySelector('#exportGrade').disabled = !rows.length;
    document.querySelector('#gradeBody').innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr>
      <th>รหัส</th><th>ชื่อ</th><th>กลุ่ม</th><th>งาน รับ/ส่ง/ตรงเวลา/ตรวจ</th><th>งาน (40)</th>
      <th>จิต: ตรงเวลา (10)</th><th>จิต: ครูประเมิน (10)</th><th>จิตรวม (20)</th>
      <th>กลางภาค (20)</th><th>ปลายภาค (20)</th><th>รวม (100)</th><th>เกรด</th><th>ผล</th>
    </tr></thead><tbody>${rows.map((r) => `<tr>
      <td>${esc(r.student_code || '')}</td><td>${esc(r.full_name || '')}</td><td>${esc(r.group_code || '-')}</td>
      <td>${r.worksheet_assigned ?? 0}/${r.worksheet_submitted ?? 0}/${r.worksheet_ontime ?? 0}/${r.worksheet_graded ?? 0}</td>
      <td>${scoreText(r.worksheet_score, 40)}</td>
      <td>${scoreText(r.punctuality_score, 10)}</td>
      <td><button class="btn light sm" data-behavior="${esc(r.student_id)}">${scoreText(r.teacher_behavior_score, 10)}</button>${r.teacher_behavior_note ? `<small>${esc(r.teacher_behavior_note)}</small>` : '<small>ครูยังไม่บันทึกหมายเหตุ</small>'}</td>
      <td><strong>${scoreText(r.behavior_score, 20)}</strong></td>
      <td>${scoreText(r.midterm_score, 20)}</td><td>${scoreText(r.final_score, 20)}</td>
      <td><strong>${scoreText(r.total_score, 100)}</strong></td><td>${r.grade ?? '-'}</td><td>${esc(r.pass_status || '')}</td>
    </tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีข้อมูลคะแนนในกลุ่มนี้</div>';

    document.querySelectorAll('[data-behavior]').forEach((button) => {
      button.onclick = () => {
        const row = rows.find((x) => String(x.student_id) === String(button.dataset.behavior));
        if (!row) return;
        modal({
          title: `จิตพิสัยส่วนครู • ${row.full_name || row.student_code || ''}`,
          body: `<div class="notice-card"><strong>คะแนนส่วนนี้เต็ม 10 คะแนน</strong><p>อีก 10 คะแนนมาจากระบบอัตโนมัติเมื่อส่งงานครบและตรงเวลาทุกชิ้น ปัจจุบันได้ ${scoreText(row.punctuality_score, 10)}</p></div><div class="form-grid"><label class="field"><span>คะแนนครูประเมิน (0–10)</span><input name="score" type="number" min="0" max="10" step="0.5" value="${esc(row.teacher_behavior_score ?? 0)}" required></label><label class="field span2"><span>หมายเหตุ / เหตุผลประกอบ</span><textarea name="note" rows="4">${esc(row.teacher_behavior_note || '')}</textarea></label></div>`,
          submitLabel: 'บันทึกคะแนนจิตพิสัย',
          onSubmit: async (form) => {
            const subjectId = document.querySelector('#gradeSubject').value;
            const score = Number(form.get('score'));
            if (!Number.isFinite(score) || score < 0 || score > 10) throw new Error('คะแนนครูประเมินต้องอยู่ระหว่าง 0 ถึง 10');
            await rpc('clean_behavior_teacher_set', { p_subject_id: subjectId, p_student_id: row.student_id, p_score: score, p_note: form.get('note') || null });
            toast('บันทึกคะแนนจิตพิสัยแล้ว', 'ok');
            await loadRows();
          }
        });
      };
    });
  };

  const loadRows = async () => {
    const subjectId = document.querySelector('#gradeSubject').value;
    const groupId = document.querySelector('#gradeGroup').value;
    if (!subjectId || !groupId) return;
    const data = await rpc('clean_gradebook_group', { p_subject_id: subjectId, p_learning_group_id: groupId });
    rows = arr(data.rows || data);
    renderRows();
  };

  document.querySelector('#gradeSubject').onchange = drawGroups;
  document.querySelector('#loadGrade').onclick = loadRows;
  document.querySelector('#exportGrade').onclick = () => downloadCsv('gradebook-100-points.csv', rows, [
    'student_code','full_name','group_code','worksheet_assigned','worksheet_submitted','worksheet_ontime','worksheet_graded',
    'worksheet_score','punctuality_score','teacher_behavior_score','behavior_score','midterm_score','final_score','total_score','grade','pass_status','teacher_behavior_note'
  ]);
}

export async function gradesPage() {
  setMain(pageHead('สถานะการส่งงาน', 'บัญชีนักศึกษาไม่แสดงคะแนน') + '<div class="empty-state">ดูสถานะใบงานจากแดชบอร์ดและเมนูใบงาน</div>');
}
