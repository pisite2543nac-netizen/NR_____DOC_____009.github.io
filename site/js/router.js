import { state } from './state.js';
import { markActiveRoute, setMain, loading, showPageError } from './ui.js';

export const MENUS = Object.freeze({
  admin: [
    ['dashboard', 'แดชบอร์ด'], ['subjects', 'วิชา/ห้อง'], ['teaching', 'เนื้อหาการสอน'], ['users', 'ผู้ใช้'],
    ['assignments', 'มอบหมายครู'], ['worksheets', 'ใบงาน'], ['submissions', 'ตรวจงาน'], ['exams', 'ข้อสอบ'],
    ['gradebook', 'คะแนน'], ['groups', 'กลุ่มเรียน'], ['diagnostics', 'ตรวจระบบ'],
  ],
  teacher: [
    ['dashboard', 'แดชบอร์ด'], ['subjects', 'รายวิชา'], ['teaching', 'เนื้อหาการสอน'], ['worksheets', 'ใบงาน'],
    ['submissions', 'ตรวจงาน'], ['exams', 'ข้อสอบ'], ['gradebook', 'คะแนน'], ['groups', 'กลุ่มเรียน'], ['diagnostics', 'ตรวจระบบ'],
  ],
  student: [
    ['dashboard', 'แดชบอร์ด'], ['subjects', 'วิชาของฉัน'], ['teaching', 'เนื้อหาการเรียน'], ['worksheets', 'ใบงาน'],
    ['exams', 'ข้อสอบ'], ['profile', 'โปรไฟล์'],
  ],
});

const pages = new Map();
export function registerPage(name, renderer) { pages.set(name, renderer); }

export async function navigate(route, push = true) {
  const allowed = (MENUS[state.profile?.role] || []).map(([name]) => name);
  if (!allowed.includes(route)) route = 'dashboard';
  state.route = route;
  if (push) history.replaceState(null, '', `#/${route}`);
  markActiveRoute(route);
  setMain(loading());
  const renderer = pages.get(route) || pages.get('dashboard');
  try { await renderer(); }
  catch (error) { showPageError(error, () => navigate(route, false)); }
}

export function bindHashRouting() {
  window.onhashchange = () => {
    const route = location.hash.replace('#/', '');
    if (route && route !== state.route) navigate(route, false);
  };
}
