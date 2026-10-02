import { rpc } from '../api.js';
import { state } from '../state.js';
import { pageHead, setMain, arr, esc } from '../ui.js';

export async function dashboardPage() {
  if (state.profile.role === 'student') {
    const [subjects, overview] = await Promise.all([rpc('clean_my_subjects'), rpc('clean_my_submission_overview')]);
    const items = arr(overview?.items);
    const label = (status) => ({ submitted: 'ส่งแล้ว', checked: 'ตรวจแล้ว', draft: 'บันทึกร่าง', not_submitted: 'ยังไม่ส่ง', overdue_not_submitted: 'เกินกำหนด • ยังไม่ส่ง' }[status] || status || 'ยังไม่ส่ง');
    const pillClass = (status) => ['submitted','checked'].includes(status) ? 'ok' : status === 'draft' ? 'warn' : status === 'overdue_not_submitted' ? 'bad' : 'info';
    const groupCode = arr(subjects)[0]?.learning_group_code || arr(subjects)[0]?.group_code || '-';
    setMain(pageHead('ติดตามการส่งใบงาน', `กลุ่มเรียน ${groupCode} • ดูเฉพาะว่าส่งแล้วหรือยังไม่ส่ง โดยไม่แสดงคะแนน`) + `
      <div class="metric-grid compact"><div class="metric-card"><span>รายวิชา</span><strong>${arr(subjects).length}</strong></div><div class="metric-card"><span>ใบงานทั้งหมด</span><strong>${overview?.total ?? items.length}</strong></div><div class="metric-card"><span>ส่งแล้ว</span><strong>${overview?.submitted ?? 0}</strong></div><div class="metric-card"><span>ยังไม่ส่ง</span><strong>${overview?.not_submitted ?? 0}</strong><small>เกินกำหนด ${overview?.overdue_not_submitted ?? 0}</small></div></div>
      <section class="panel" style="margin-top:18px"><div class="panel-head"><div><h3>สถานะใบงานของฉัน</h3><small>ไม่มีการแสดงคะแนนในบัญชีนักศึกษา</small></div></div>${items.length ? `<div class="table-wrap"><table><thead><tr><th>ใบงาน</th><th>วิชา</th><th>กำหนดส่ง</th><th>สถานะ</th></tr></thead><tbody>${items.map((w) => `<tr><td><strong>${esc(w.title || '')}</strong><small>${esc(w.mode || '')}</small></td><td>${esc(w.subject_code || '')}<small>${esc(w.subject_name || '')}</small></td><td>${w.due_at ? new Date(w.due_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td><td><span class="pill ${pillClass(w.status)}">${esc(label(w.status))}</span></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีใบงานที่ได้รับมอบหมาย</div>'}</section>`);
    return;
  }

  const [scope, worksheets, exams, queue] = await Promise.all([rpc('clean_staff_scope'), rpc('clean_staff_worksheets'), rpc('clean_exam_dashboard'), rpc('clean_staff_work_queue_summary')]);
  const subjects = arr(scope?.subjects);
  const learningGroups = arr(scope?.learning_groups);
  const totalHours = subjects.flatMap((s) => arr(s.offerings)).reduce((sum, o) => sum + Number(o.weekly_hours || 0), 0);
  const pendingReview = arr(queue).reduce((sum, x) => sum + Number(x.waiting_review_count || 0), 0);
  setMain(pageHead('แดชบอร์ด', 'ศูนย์ควบคุมระบบการเรียนการสอน') + `
    <div class="metric-grid"><div class="metric-card"><span>รายวิชา</span><strong>${subjects.length}</strong><small>ที่คุณเข้าถึงได้</small></div><div class="metric-card"><span>กลุ่มเรียน</span><strong>${learningGroups.length}</strong><small>หนึ่งกลุ่มเรียนหลายวิชา</small></div><div class="metric-card"><span>ชั่วโมง/สัปดาห์</span><strong>${totalHours}</strong></div><div class="metric-card"><span>ใบงาน</span><strong>${arr(worksheets).length}</strong></div><div class="metric-card"><span>งานรอตรวจ</span><strong>${pendingReview}</strong></div><div class="metric-card"><span>ข้อสอบ</span><strong>${arr(exams).length}</strong></div></div>
    <div class="notice-card" style="margin-top:18px"><strong>โครงกลุ่มแบบเรียบง่าย</strong><p>นักศึกษาอยู่กลุ่มเรียนหลักเดียว รายวิชา/ใบงาน/ข้อสอบ/Gradebook ใช้กลุ่มเดียวกัน ส่วนกลุ่มย่อยมีไว้แบ่งทีมเท่านั้น</p></div>`);
}
