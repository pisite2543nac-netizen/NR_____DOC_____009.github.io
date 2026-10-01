import { rpc } from '../api.js';
import { pageHead, setMain, esc, statusPill } from '../ui.js';

export async function profilePage() {
  const p = await rpc('clean_my_profile');
  setMain(pageHead('โปรไฟล์', 'ข้อมูลบัญชีและข้อมูลการศึกษาที่ใช้ในระบบ') + `<section class="panel"><div class="profile-grid"><div><span>ชื่อ-สกุล</span><strong>${esc(p.full_name || '')}</strong></div><div><span>ชื่อเล่น</span><strong>${esc(p.display_name || '-')}</strong></div><div><span>รหัสนักศึกษา</span><strong>${esc(p.student_code || '-')}</strong></div><div><span>วันเกิด</span><strong>${esc(p.birth_date || '-')}</strong></div><div><span>เบอร์โทร</span><strong>${esc(p.phone || '-')}</strong></div><div><span>Email</span><strong>${esc(p.contact_email || '-')}</strong></div><div><span>ระดับ</span><strong>${esc(p.grade_level || '-')}</strong></div><div><span>ห้องที่แจ้ง</span><strong>${esc(p.room_label || '-')}</strong></div><div><span>แผนก</span><strong>${esc(p.department || '-')}</strong></div><div><span>สาขา</span><strong>${esc(p.major || '-')}</strong></div><div><span>บทบาท</span><strong>${statusPill(p.role)}</strong></div><div><span>สถานะบัญชี</span><strong>${statusPill(p.active ? 'active' : 'inactive')} ${statusPill(p.approval_status)}</strong></div></div>${p.rejection_reason ? `<div class="error-inline">เหตุผลไม่อนุมัติ: ${esc(p.rejection_reason)}</div>` : ''}</section>`);
}
