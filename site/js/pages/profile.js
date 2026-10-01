import { rpc } from '../api.js';
import { pageHead, setMain, esc, statusPill } from '../ui.js';

export async function profilePage() {
  const p = await rpc('clean_my_profile');
  setMain(pageHead('โปรไฟล์', 'ข้อมูลบัญชีใน FINAL CLEAN') + `<section class="panel"><div class="profile-grid"><div><span>ชื่อ</span><strong>${esc(p.full_name || '')}</strong></div><div><span>บทบาท</span><strong>${statusPill(p.role)}</strong></div><div><span>Username</span><strong>${esc(p.username || '-')}</strong></div><div><span>รหัสนักศึกษา</span><strong>${esc(p.student_code || '-')}</strong></div><div><span>สถานะบัญชี</span><strong>${statusPill(p.active ? 'active' : 'inactive')} ${statusPill(p.approval_status)}</strong></div><div><span>สถานะการศึกษา</span><strong>${esc(p.academic_status || '-')}</strong></div></div></section>`);
}
