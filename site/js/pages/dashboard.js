import { rpc } from '../api.js';
import { state } from '../state.js';
import { pageHead, setMain, statusPill, arr, esc } from '../ui.js';

export async function dashboardPage() {
  if (state.profile.role === 'student') {
    const [subjects, overview] = await Promise.all([
      rpc('clean_my_subjects'), rpc('clean_my_submission_overview'),
    ]);
    const items = arr(overview?.items);
    const label = (status) => ({
      submitted: 'ส่งแล้ว', checked: 'ตรวจแล้ว', draft: 'บันทึกร่าง',
      not_submitted: 'ยังไม่ส่ง', overdue_not_submitted: 'เกินกำหนด • ยังไม่ส่ง',
    }[status] || status || 'ยังไม่ส่ง');
    const pillClass = (status) => ['submitted','checked'].includes(status) ? 'ok' : status === 'draft' ? 'warn' : status === 'overdue_not_submitted' ? 'bad' : 'info';
    setMain(pageHead('ติดตามการส่งใบงาน', 'ดูเฉพาะว่าใบงานใดส่งแล้วหรือยังไม่ส่ง โดยไม่แสดงคะแนน') + `
      <div class="metric-grid compact">
        <div class="metric-card"><span>รายวิชา</span><strong>${arr(subjects).length}</strong><small>ภาคเรียน 2/2569</small></div>
        <div class="metric-card"><span>ใบงานทั้งหมด</span><strong>${overview?.total ?? items.length}</strong><small>รายการที่ได้รับมอบหมาย</small></div>
        <div class="metric-card"><span>ส่งแล้ว</span><strong>${overview?.submitted ?? 0}</strong><small>รวมงานที่ตรวจแล้ว</small></div>
        <div class="metric-card"><span>ยังไม่ส่ง</span><strong>${overview?.not_submitted ?? 0}</strong><small>เกินกำหนด ${overview?.overdue_not_submitted ?? 0}</small></div>
      </div>
      <section class="panel" style="margin-top:18px">
        <div class="panel-head"><div><h3>สถานะใบงานของฉัน</h3><small>ไม่มีการแสดงคะแนนในบัญชีนักศึกษา</small></div></div>
        ${items.length ? `<div class="table-wrap"><table><thead><tr><th>ใบงาน</th><th>วิชา / Group</th><th>กำหนดส่ง</th><th>สถานะ</th></tr></thead><tbody>${items.map((w) => `<tr><td><strong>${esc(w.title || '')}</strong><small>${esc(w.mode || '')}</small></td><td>${esc(w.subject_code || '')}<small>${esc(w.subject_name || '')}${w.group_code ? ` • ${esc(w.group_code)}` : ''}</small></td><td>${w.due_at ? new Date(w.due_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td><td><span class="pill ${pillClass(w.status)}">${esc(label(w.status))}</span></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีใบงานที่ได้รับมอบหมาย</div>'}
      </section>`);
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
