import { rpc, getRegistrationPhotoUrl } from '../api.js';
import { pageHead, setMain, arr, esc, statusPill, fmt } from '../ui.js';
import { state } from '../state.js';

export async function profilePage() {
  const data = await rpc('clean_student_profile_detail', { p_student_id: state.profile.id });
  const p = data.profile || {};
  const classroom = data.classroom || {};
  const summary = data.summary || {};
  const enrollments = arr(data.enrollments);
  let photoUrl = '';
  if (p.registration_photo_path) {
    try { photoUrl = await getRegistrationPhotoUrl(p.id); } catch {}
  }
  setMain(pageHead('โปรไฟล์นักศึกษา', 'ข้อมูลส่วนตัว กลุ่มเรียนหลัก ห้องเรียน และสถานะการส่งงาน') + `
    <section class="panel">
      <div class="student-profile-hero">
        <div class="student-photo-wrap">${photoUrl ? `<img class="student-photo" src="${esc(photoUrl)}" alt="รูปนักศึกษา">` : '<div class="student-photo placeholder">ไม่มีรูป</div>'}<small>รูปสมัครนักศึกษา</small></div>
        <div class="student-profile-main"><div class="eyebrow">My Profile</div><h2>${esc(p.full_name || '')}</h2><p>${esc(p.display_name || '')} • ${esc(p.student_code || '')}</p><div class="profile-pills">${statusPill(p.approval_status)} ${statusPill(p.active ? 'active' : 'inactive')} ${statusPill(p.academic_status)}</div></div>
      </div>
      <div class="section-title"><div><span class="eyebrow">ข้อมูลส่วนตัว</span><h2>ข้อมูลบัญชีและการศึกษา</h2></div></div>
      <div class="profile-grid">
        <div><span>ชื่อ-สกุล</span><strong>${esc(p.full_name || '-')}</strong></div><div><span>ชื่อเล่น</span><strong>${esc(p.display_name || '-')}</strong></div><div><span>รหัสนักศึกษา</span><strong>${esc(p.student_code || '-')}</strong></div>
        <div><span>วันเกิด</span><strong>${esc(p.birth_date || '-')}</strong></div><div><span>เบอร์โทร</span><strong>${esc(p.phone || '-')}</strong></div><div><span>Email</span><strong>${esc(p.contact_email || '-')}</strong></div>
        <div><span>ระดับที่แจ้ง</span><strong>${esc(p.grade_level || '-')}</strong></div><div><span>ห้องที่แจ้ง</span><strong>${esc(p.room_label || '-')}</strong></div><div><span>แผนก</span><strong>${esc(p.department || '-')}</strong></div>
        <div><span>สาขา</span><strong>${esc(p.major || '-')}</strong></div><div><span>กลุ่มเรียนหลัก</span><strong>${esc(p.learning_group_code || data.learning_group?.code || '-')}</strong></div><div><span>ห้องจริง</span><strong>${esc(classroom.name || classroom.code || '-')}</strong></div><div><span>เลขที่</span><strong>${esc(classroom.seat_number || '-')}</strong></div>
      </div>
      ${p.rejection_reason ? `<div class="error-inline">เหตุผลไม่อนุมัติ: ${esc(p.rejection_reason)}</div>` : ''}
    </section>

    <div class="section-title"><div><span class="eyebrow">Enrollment</span><h2>รายวิชาของกลุ่มเรียน</h2></div><span class="count-badge">${enrollments.length} รายวิชา</span></div>
    ${enrollments.length ? `<div class="table-wrap"><table><thead><tr><th>รายวิชา</th><th>กลุ่มเรียน</th><th>ห้อง</th><th>สถานะ</th></tr></thead><tbody>${enrollments.map((e) => `<tr><td><strong>${esc(e.subject_code || '')}</strong><small>${esc(e.subject_name || '')}</small></td><td><strong>${esc(e.group_code || '-')}</strong><small>${e.weekly_hours ?? '-'} ชม./สัปดาห์</small></td><td>${esc(e.classroom_name || '-')}</td><td>${statusPill(e.status)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีรายวิชา</div>'}

    <div class="section-title"><div><span class="eyebrow">Submission Tracker</span><h2>สถานะการส่งใบงาน</h2></div><span class="count-badge">ไม่แสดงคะแนน</span></div>
    <div class="student-summary-grid">
      <div class="metric-card"><span>ใบงานที่ได้รับ</span><strong>${summary.worksheet_assigned ?? 0}</strong></div>
      <div class="metric-card"><span>ส่งแล้ว</span><strong>${summary.worksheet_submitted ?? 0}</strong></div>
      <div class="metric-card"><span>บันทึกร่าง</span><strong>${summary.worksheet_draft ?? 0}</strong></div>
      <div class="metric-card"><span>ยังไม่ส่ง</span><strong>${summary.worksheet_not_submitted ?? 0}</strong></div>
    </div>
    <div class="notice-card" style="margin-top:12px"><strong>ข้อมูลคะแนน</strong><p>บัญชีนักศึกษาใช้ตรวจสถานะการส่งงานเท่านั้น คะแนนและ Gradebook แสดงเฉพาะครูผู้สอนและผู้ดูแลระบบ</p></div>
    ${arr(data.history).length ? `<div class="section-title"><div><span class="eyebrow">History</span><h2>ประวัติบัญชี</h2></div></div><div class="profile-history">${arr(data.history).map((h) => `<div><span>${fmt(h.created_at)}</span><strong>${esc(h.action || '-')}</strong><small>${esc(h.actor_name || h.actor_username || 'ระบบ')}</small></div>`).join('')}</div>` : ''}`);
}
