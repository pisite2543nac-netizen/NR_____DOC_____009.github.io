import { CONFIG } from './config.js';
import { state, resetState } from './state.js';

const ERROR_MESSAGES = Object.freeze({
  AUTH_REQUIRED: 'กรุณาเข้าสู่ระบบใหม่',
  ADMIN_REQUIRED: 'เมนูนี้ใช้ได้เฉพาะผู้ดูแลระบบ',
  STAFF_REQUIRED: 'เมนูนี้ใช้ได้เฉพาะครูหรือผู้ดูแลระบบ',
  TEACHER_SCOPE_REQUIRED: 'คุณยังไม่ได้รับมอบหมายให้จัดการรายวิชานี้',
  CLASSROOM_SCOPE_REQUIRED: 'คุณยังไม่ได้รับมอบหมายให้จัดการห้องเรียนนี้',
  SUBJECT_ACCESS_DENIED: 'คุณไม่มีสิทธิ์เข้าถึงรายวิชานี้',
  WORKSHEET_ACCESS_DENIED: 'คุณไม่มีสิทธิ์เข้าถึงใบงานนี้',
  WORKSHEET_NOT_FOUND: 'ไม่พบใบงานที่ต้องการ',
  WORKSHEET_NOT_ASSIGNED: 'ใบงานนี้ไม่ได้ถูกมอบหมายให้คุณ',
  MOBILE_COPY_PAPER_ONLY: 'ส่งย้อนหลังจากมือถือได้เฉพาะใบงานกระดาษเท่านั้น',
  MOBILE_COPY_NOT_ALLOWED: 'ครูยังไม่ได้เปิดรับการส่งย้อนหลังสำหรับใบงานนี้',
  MOBILE_COPY_WINDOW_CLOSED: 'หมดเวลารับส่งงานย้อนหลังแล้ว',
  INVALID_FILE_COUNT: 'ต้องแนบรูปอย่างน้อย 1 รูป และไม่เกิน 6 รูป',
  STORAGE_OBJECT_NOT_FOUND: 'ไม่พบรูปที่อัปโหลด กรุณาลองส่งใหม่',
  USERNAME_OR_STUDENT_CODE_EXISTS: 'Username หรือรหัสนักศึกษานี้ถูกใช้แล้ว',
  PASSWORD_MIN_8: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
  INVALID_STUDENT_CODE: 'รูปแบบรหัสนักศึกษาไม่ถูกต้อง',
  INVALID_USERNAME: 'Username ใช้ได้เฉพาะตัวอักษร ตัวเลข จุด ขีด และขีดล่าง',
  PROFILE_NOT_FOUND: 'ไม่พบข้อมูลผู้ใช้ในระบบ Clean',
  UNIT_NOT_FOUND: 'ไม่พบหน่วยการสอน',
  UNIT_ACCESS_DENIED: 'คุณไม่มีสิทธิ์เข้าถึงหน่วยการสอนนี้',
  EXAM_NOT_FOUND: 'ไม่พบข้อสอบ',
  INVALID_SCHEDULE: 'วันและเวลาเปิด-ปิดไม่ถูกต้อง',
  OFFERING_REQUIRED: 'กรุณาเลือก Group Code ก่อน',
  OFFERING_NOT_FOUND: 'ไม่พบ Group Code นี้ในรายวิชา',
  OFFERING_SUBJECT_MISMATCH: 'Group Code ไม่ตรงกับรายวิชาที่เลือก',
  GROUP_HAS_NO_STUDENTS: 'Group Code นี้ยังไม่มีนักศึกษาที่ลงทะเบียน',
  UNIT_TEMPLATE_USE_TEACHING_FLOW: 'แม่แบบใบงานประจำหน่วยต้องเปิดจากหน้าเนื้อหาการสอน',
  UNIT_WORKSHEET_TEMPLATE_NOT_FOUND: 'ไม่พบแม่แบบใบงานของหน่วยนี้',
  QR_INVALID_OR_EXPIRED: 'QR นี้ไม่ถูกต้องหรือหมดอายุ',
  'permission denied': 'ไม่มีสิทธิ์ใช้งานฟังก์ชันนี้',
});

export function friendlyError(error) {
  const raw = String(error?.message || error?.error || error || 'UNKNOWN_ERROR');
  const key = Object.keys(ERROR_MESSAGES).find((k) => raw.includes(k));
  return key ? ERROR_MESSAGES[key] : raw.replace(/^Error:\s*/i, '');
}

export function setSession(session) {
  state.session = session || null;
  if (session) localStorage.setItem(CONFIG.sessionKey, JSON.stringify(session));
  else localStorage.removeItem(CONFIG.sessionKey);
}

export function restoreSession() {
  try {
    const value = JSON.parse(localStorage.getItem(CONFIG.sessionKey) || 'null');
    if (value?.access_token) setSession(value);
  } catch {
    localStorage.removeItem(CONFIG.sessionKey);
  }
  return state.session;
}

function trace(entry) {
  state.trace.unshift({ ...entry, at: new Date().toISOString() });
  state.trace = state.trace.slice(0, 120);
}

export async function request(url, options = {}, refreshAllowed = true) {
  const started = performance.now();
  const headers = { apikey: CONFIG.publishableKey, ...(options.headers || {}) };
  if (state.session?.access_token) headers.Authorization = `Bearer ${state.session.access_token}`;
  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (error) {
    trace({ method: options.method || 'GET', url, status: 'NETWORK', ok: false, ms: Math.round(performance.now() - started), error: friendlyError(error) });
    throw error;
  }
  if (response.status === 401 && refreshAllowed && state.session?.refresh_token) {
    if (await refreshSession()) return request(url, options, false);
  }
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  const message = response.ok ? '' : (data?.message || data?.error || raw || response.statusText);
  trace({ method: options.method || 'GET', url, status: response.status, ok: response.ok, ms: Math.round(performance.now() - started), error: message });
  if (!response.ok) {
    const error = new Error(message || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function rpc(name, args = {}) {
  return request(`${CONFIG.supabaseUrl}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
}

export async function edge(name, args = {}, auth = true) {
  return request(`${CONFIG.supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  }, auth);
}

export async function login(identifier, password) {
  const response = await fetch(`${CONFIG.supabaseUrl}/functions/v1/clean-login`, {
    method: 'POST',
    headers: { apikey: CONFIG.publishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await response.json().catch(() => ({}));
  trace({ method: 'POST', url: '/functions/v1/clean-login', status: response.status, ok: response.ok, ms: 0, error: response.ok ? '' : data.error });
  if (!response.ok) throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
  setSession(data.session);
  state.profile = data.profile;
  return data;
}

export async function registerStudent(payload) {
  const response = await fetch(`${CONFIG.supabaseUrl}/functions/v1/clean-register-student`, {
    method: 'POST',
    headers: { apikey: CONFIG.publishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'ลงทะเบียนไม่สำเร็จ');
  return data;
}

export async function refreshSession() {
  if (!state.session?.refresh_token) return false;
  try {
    const data = await request(`${CONFIG.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: state.session.refresh_token }),
    }, false);
    setSession(data);
    return Boolean(data?.access_token);
  } catch {
    setSession(null);
    state.profile = null;
    return false;
  }
}

export async function logout() {
  try {
    if (state.session?.access_token) await request(`${CONFIG.supabaseUrl}/auth/v1/logout`, { method: 'POST' }, false);
  } catch {}
  setSession(null);
  resetState();
}

export async function loadProfile() {
  state.profile = await rpc('clean_my_profile');
  return state.profile;
}

export async function uploadMobileImage(file, worksheetId, index) {
  const prepared = await compressMobileImage(file);
  if (prepared.size > CONFIG.maxMobileUploadBytes) throw new Error('รูปหลังย่อยังใหญ่เกิน 12 MB');
  const extension = prepared.type === 'image/png' ? 'png' : prepared.type === 'image/webp' ? 'webp' : 'jpg';
  const uuid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const path = `${state.profile.id}/${worksheetId}/${Date.now()}-${index}-${uuid}.${extension}`;
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  await request(`${CONFIG.supabaseUrl}/storage/v1/object/clean-mobile-submissions/${encoded}`, {
    method: 'POST',
    headers: { 'Content-Type': prepared.type || 'image/jpeg', 'x-upsert': 'false' },
    body: prepared,
  });
  return path;
}

async function compressMobileImage(file) {
  if (!String(file.type || '').startsWith('image/')) throw new Error('รองรับเฉพาะไฟล์รูปภาพ');
  if (file.size > CONFIG.maxMobileSourceBytes) throw new Error('รูปต้นฉบับใหญ่เกิน 20 MB');
  if (file.size <= 2.5 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 1920;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve, reject) => canvas.toBlob((v) => v ? resolve(v) : reject(new Error('IMAGE_COMPRESS_FAILED')), 'image/jpeg', 0.82));
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`, { type: 'image/jpeg' });
  } catch (error) {
    if (file.size <= CONFIG.maxMobileUploadBytes) return file;
    throw error;
  }
}

export async function getMobileFileUrl(path) {
  const data = await edge('clean-mobile-file-url', { path });
  return data.url;
}
