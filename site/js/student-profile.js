import { rpc, edge } from './api.js';
import { arr, esc, fmt, modal, statusPill } from './ui.js';

function value(label, value) {
  const display = value === null || value === undefined || value === '' ? '-' : value;
  return `<div class="profile-value"><span>${esc(label)}</span><strong>${esc(display)}</strong></div>`;
}

function percent(value) {
  if (value === null || value === undefined || value === '') return '-';
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(2)}%` : '-';
}

export async function openStudentProfile(studentId) {
  const data = await rpc('clean_student_profile_detail', { p_student_id: studentId });
  const p = data.profile || {};
  let photoUrl = '';
  if (p.registration_photo_path) {
    try {
      const photo = await edge('clean-registration-photo-url', { user_id: studentId });
      photoUrl = photo?.url || '';
    } catch {}
  }
  const classroom = data.classroom || {};
  const summary = data.summary || {};
  const enrollments = arr(data.enrollments);
  const history = arr(data.history);
  const isDetailed = data.viewer_role === 'admin' || data.viewer_role === 'student';

  modal({
    title: `โปรไฟล์นักศึกษา • ${p.full_name || ''}`,
    wide: true,
    hideSubmit: true,
    body: `
      <div class="student-profile-hero">
        <div class="student-photo-wrap">
          ${photoUrl ? `<img class="student-photo" src="${esc(photoUrl)}" alt="รูปนักศึกษา">` : '<div class="student-photo placeholder">ไม่มีรูป</div>'}
          <small>${p.registration_photo_captured_at ? `ถ่ายเมื่อ ${fmt(p.registration_photo_captured_at)}` : 'รูปสมัครนักศึกษา'}</small>
        </div>
        <div class="student-profile-main">
          <div class="eyebrow">Student Profile</div>
          <h2>${esc(p.full_name || '-')}</h2>
          <p>${esc(p.display_name || '')}${p.student_code ? ` • ${esc(p.student_code)}` : ''}</p>
          <div class="profile-pills">${statusPill(p.approval_status)} ${statusPill(p.active ? 'active' : 'inactive')} ${statusPill(p.academic_status || '-')}</div>
        </div>
      </div>

      <div class="section-title"><div><span class="eyebrow">ข้อมูลนักศึกษา</span><h2>ข้อมูลส่วนตัวและการศึกษา</h2></div></div>
      <div class="registration-detail-grid">
        ${value('ชื่อ-สกุล', p.full_name)}
        ${value('ชื่อเล่น', p.display_name)}
        ${value('รหัสนักศึกษา', p.student_code)}
        ${isDetailed ? value('Username', p.username) : ''}
        ${isDetailed ? value('วันเกิด', p.birth_date) : ''}
        ${isDetailed ? value('เบอร์โทรศัพท์', p.phone) : ''}
        ${isDetailed ? value('Email', p.contact_email) : ''}
        ${value('ระดับที่แจ้ง', p.grade_level)}
        ${value('ห้องที่แจ้ง', p.room_label)}
        ${value('แผนก', p.department)}
        ${value('สาขา', p.major)}
        ${value('ห้องจริงในระบบ', classroom.name || classroom.code)}
        ${value('เลขที่', classroom.seat_number)}
        ${isDetailed ? value('แหล่งลงทะเบียน', p.registration_source === 'self' ? 'สมัครด้วยตนเอง' : p.registration_source) : ''}
        ${isDetailed ? value('ส่งคำขอเมื่อ', p.approval_requested_at ? fmt(p.approval_requested_at) : '-') : ''}
        ${isDetailed ? value('อนุมัติเมื่อ', p.approved_at ? fmt(p.approved_at) : '-') : ''}
      </div>
      ${p.rejection_reason ? `<div class="error-inline"><strong>เหตุผลไม่อนุมัติ:</strong> ${esc(p.rejection_reason)}</div>` : ''}

      <div class="section-title"><div><span class="eyebrow">Enrollment</span><h2>รายวิชาและ Group Code</h2></div><span class="count-badge">${enrollments.length} รายวิชา</span></div>
      ${enrollments.length ? `<div class="table-wrap"><table><thead><tr><th>รายวิชา</th><th>Group Code</th><th>ห้อง</th><th>สถานะ</th></tr></thead><tbody>${enrollments.map((e) => `<tr><td><strong>${esc(e.subject_code || '')}</strong><small>${esc(e.subject_name || '')}</small></td><td>${esc(e.group_code || '-')}<small>${e.weekly_hours ?? '-'} ชม./สัปดาห์</small></td><td>${esc(e.classroom_name || e.classroom_code || '-')}</td><td>${statusPill(e.status)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีรายวิชา</div>'}

      <div class="section-title"><div><span class="eyebrow">Learning Summary</span><h2>ภาพรวมการเรียน</h2></div></div>
      <div class="student-summary-grid">
        <div class="metric-card"><span>ใบงานที่ได้รับ</span><strong>${summary.worksheet_assigned ?? 0}</strong></div>
        <div class="metric-card"><span>ใบงานที่ส่ง</span><strong>${summary.worksheet_submitted ?? 0}</strong></div>
        <div class="metric-card"><span>ใบงานที่ตรวจแล้ว</span><strong>${summary.worksheet_graded ?? 0}</strong></div>
        <div class="metric-card"><span>เฉลี่ยใบงาน</span><strong>${percent(summary.worksheet_average_percent)}</strong></div>
        <div class="metric-card"><span>ข้อสอบที่ได้รับ</span><strong>${summary.exam_assigned ?? 0}</strong></div>
        <div class="metric-card"><span>ข้อสอบที่ทำแล้ว</span><strong>${summary.exam_attempted ?? 0}</strong></div>
        <div class="metric-card"><span>ข้อสอบที่ตรวจแล้ว</span><strong>${summary.exam_graded ?? 0}</strong></div>
        <div class="metric-card"><span>เฉลี่ยข้อสอบ</span><strong>${percent(summary.exam_average_percent)}</strong></div>
      </div>

      ${history.length ? `<div class="section-title"><div><span class="eyebrow">History</span><h2>ประวัติการจัดการบัญชี</h2></div></div><div class="profile-history">${history.map((h) => `<div><span>${fmt(h.created_at)}</span><strong>${esc(h.action || '-')}</strong><small>${esc(h.actor_name || h.actor_username || 'ระบบ')}</small></div>`).join('')}</div>` : ''}
    `,
  });
}
