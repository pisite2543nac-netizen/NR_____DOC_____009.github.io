import { rpc } from '../api.js';
import { state } from '../state.js';
import { pageHead, setMain, statusPill, arr, esc } from '../ui.js';

export async function dashboardPage() {
  if (state.profile.role === 'student') {
    const [subjects, worksheets, exams, grades] = await Promise.all([
      rpc('clean_my_subjects'), rpc('clean_my_worksheets'), rpc('clean_my_exams'), rpc('clean_my_grades'),
    ]);
    const pendingWorks = arr(worksheets).filter((x) => !['submitted', 'graded'].includes(x.submission_status));
    setMain(pageHead('แดชบอร์ดนักศึกษา', 'สรุปงาน การเรียน และคะแนนของคุณ') + `
      <div class="metric-grid">
        <div class="metric-card"><span>รายวิชา</span><strong>${arr(subjects).length}</strong><small>ภาคเรียน 2/2569</small></div>
        <div class="metric-card"><span>ใบงานทั้งหมด</span><strong>${arr(worksheets).length}</strong><small>ค้าง ${pendingWorks.length} รายการ</small></div>
        <div class="metric-card"><span>ข้อสอบ</span><strong>${arr(exams).length}</strong><small>รายการที่ได้รับมอบหมาย</small></div>
        <div class="metric-card"><span>ผลการเรียน</span><strong>${arr(grades).length}</strong><small>รายวิชาที่มีคะแนน</small></div>
      </div>
      <div class="content-grid two" style="margin-top:18px">
        <section class="panel"><div class="panel-head"><h3>งานที่ต้องทำ</h3></div>${pendingWorks.length ? `<div class="list">${pendingWorks.slice(0,8).map((w) => `<div class="list-row"><div><strong>${esc(w.title)}</strong><small>${esc(w.subject_code || '')} • กำหนด ${w.due_at ? new Date(w.due_at).toLocaleDateString('th-TH') : '-'}</small></div>${statusPill(w.mode)}</div>`).join('')}</div>` : '<div class="empty-state">ไม่มีงานค้าง</div>'}</section>
        <section class="panel"><div class="panel-head"><h3>คะแนนล่าสุด</h3></div>${arr(grades).length ? `<div class="table-wrap"><table><thead><tr><th>วิชา</th><th>รวม</th><th>เกรด</th></tr></thead><tbody>${arr(grades).slice(0,8).map((g) => `<tr><td>${esc(g.code)} ${esc(g.name)}</td><td>${g.total_score ?? '-'}</td><td><strong>${g.grade ?? '-'}</strong></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีคะแนน</div>'}</section>
      </div>`);
    return;
  }

  const [scope, worksheets, exams, groups] = await Promise.all([
    rpc('clean_staff_scope'), rpc('clean_staff_worksheets'), rpc('clean_exam_dashboard'), rpc('clean_room_groups_list'),
  ]);
  const subjects = arr(scope?.subjects);
  const classrooms = arr(scope?.classrooms);
  const totalHours = subjects.flatMap((s) => arr(s.offerings)).reduce((sum, o) => sum + Number(o.weekly_hours || 0), 0);
  setMain(pageHead('แดชบอร์ด', 'ศูนย์ควบคุมระบบการเรียนการสอน FINAL CLEAN') + `
    <div class="metric-grid">
      <div class="metric-card"><span>รายวิชา</span><strong>${subjects.length}</strong><small>ที่คุณเข้าถึงได้</small></div>
      <div class="metric-card"><span>ห้องเรียน</span><strong>${classrooms.length}</strong><small>ในขอบเขตสิทธิ์</small></div>
      <div class="metric-card"><span>ชั่วโมง/สัปดาห์</span><strong>${totalHours}</strong><small>รวมจากภาระสอน</small></div>
      <div class="metric-card"><span>ใบงาน</span><strong>${arr(worksheets).length}</strong><small>Digital + Paper</small></div>
      <div class="metric-card"><span>ข้อสอบ</span><strong>${arr(exams).length}</strong><small>Practice / Midterm / Final</small></div>
      <div class="metric-card"><span>กลุ่มห้อง</span><strong>${arr(groups).length}</strong><small>จัดกลุ่มโดย Admin</small></div>
    </div>
    <div class="notice-card" style="margin-top:18px"><strong>FINAL CLEAN Runtime</strong><p>ไม่มีระบบเช็กชื่อ ไม่มี QR ไม่มี PWA และมือถือใช้เฉพาะส่งสำเนาใบงานกระดาษย้อนหลังเท่านั้น</p></div>`);
}
