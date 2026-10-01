import { CONFIG, ROLE_LABEL } from './config.js';
import { state } from './state.js';
import { friendlyError } from './api.js';

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
export const arr = (value) => Array.isArray(value) ? value : [];

export function esc(value = '') {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

export function fmt(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return esc(value);
  return date.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
}

export function dateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 16);
}

export function toast(message, type = 'info') {
  const el = $('#toast');
  if (!el) return;
  el.className = `toast show ${type}`;
  el.textContent = message;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 3000);
}

export function loading(label = 'กำลังโหลดข้อมูล...') {
  return `<div class="state-box"><div class="spinner"></div><strong>${esc(label)}</strong></div>`;
}

export function empty(message = 'ยังไม่มีข้อมูล') {
  return `<div class="empty-state">${esc(message)}</div>`;
}

export function statusPill(status) {
  const raw = String(status || '-');
  const ok = ['approved', 'active', 'published', 'graded', 'accepted', 'submitted', 'final'].includes(raw);
  const warn = ['pending', 'draft', 'open', 'needs_review'].includes(raw);
  const bad = ['rejected', 'inactive', 'suspended', 'failed'].includes(raw);
  const cls = ok ? 'ok' : warn ? 'warn' : bad ? 'bad' : 'info';
  const labels = {
    approved: 'อนุมัติแล้ว', pending: 'รออนุมัติ', rejected: 'ไม่อนุมัติ', active: 'ใช้งาน', inactive: 'ปิดใช้งาน',
    published: 'เผยแพร่', draft: 'ฉบับร่าง', closed: 'ปิดงาน', graded: 'ให้คะแนนแล้ว', submitted: 'ส่งแล้ว',
    needs_review: 'รอตรวจ', accepted: 'รับงาน', checked: 'ตรวจแล้ว', not_submitted: 'ยังไม่ส่ง', overdue_not_submitted: 'เกินกำหนด • ยังไม่ส่ง', paper: 'กระดาษ', digital: 'ดิจิทัล', student: 'นักศึกษา', teacher: 'ครู', admin: 'ผู้ดูแล',
  };
  return `<span class="pill ${cls}">${esc(labels[raw] || raw)}</span>`;
}

export function pageHead(title, description = '', actions = '') {
  return `<div class="page-head"><div><div class="eyebrow">DOC-FULL-NR • ${esc(CONFIG.version)}</div><h1>${esc(title)}</h1>${description ? `<p>${esc(description)}</p>` : ''}</div><div class="page-actions">${actions}</div></div>`;
}

export function setMain(html) {
  const main = $('#main');
  if (main) main.innerHTML = html;
}

export function showPageError(error, retry) {
  setMain(`${pageHead('เกิดข้อผิดพลาด', 'ระบบไม่สามารถโหลดหน้านี้ได้')}<div class="error-card"><strong>${esc(friendlyError(error))}</strong><details><summary>รายละเอียดทางเทคนิค</summary><pre>${esc(error?.message || String(error))}</pre></details>${retry ? '<button class="btn primary" id="retryPage">ลองใหม่</button>' : ''}</div>`);
  if (retry) $('#retryPage').onclick = retry;
}

export function modal({ title, body, submitLabel = 'บันทึก', onSubmit, wide = false, hideSubmit = false, extraFooter = '' }) {
  const root = $('#modalRoot');
  root.innerHTML = `<div class="modal-backdrop"><form class="modal ${wide ? 'wide' : ''}" id="modalForm"><div class="modal-head"><div><span class="eyebrow">DOC-FULL-NR</span><h2>${esc(title)}</h2></div><button class="icon-btn" type="button" data-close aria-label="ปิด">×</button></div><div class="modal-body">${body}<div id="modalError"></div></div><div class="modal-foot">${extraFooter}<button class="btn light" type="button" data-close>ยกเลิก</button>${hideSubmit ? '' : `<button class="btn primary" type="submit">${esc(submitLabel)}</button>`}</div></form></div>`;
  const close = () => { root.innerHTML = ''; };
  $$('[data-close]', root).forEach((button) => button.onclick = close);
  $('#modalForm', root).onsubmit = async (event) => {
    event.preventDefault();
    if (!onSubmit) return close();
    const button = event.currentTarget.querySelector('[type="submit"]');
    if (button) button.disabled = true;
    try {
      const result = await onSubmit(new FormData(event.currentTarget), close);
      if (result !== false) close();
    } catch (error) {
      $('#modalError', root).innerHTML = `<div class="error-inline">${esc(friendlyError(error))}</div>`;
    } finally {
      if (button) button.disabled = false;
    }
  };
  return { root, close };
}

export function options(rows, valueKey = 'id', label = (row) => row.name, selected = '') {
  return arr(rows).map((row) => `<option value="${esc(row[valueKey])}" ${String(row[valueKey]) === String(selected) ? 'selected' : ''}>${esc(label(row))}</option>`).join('');
}

export function renderShell(menus, onNavigate, onLogout) {
  document.body.innerHTML = `<div id="app"></div><div id="toast" class="toast"></div><div id="modalRoot"></div>`;
  const role = state.profile?.role || 'student';
  const displayName = state.profile?.display_name || state.profile?.full_name || '';
  $('#app').innerHTML = `<div class="app-shell"><header class="topbar"><div class="brand"><div class="brand-mark">NR</div><div><strong>DOC-FULL-NR FINAL CLEAN</strong><small>Semester ${CONFIG.semester}/${CONFIG.academicYear} • ${CONFIG.version}</small></div></div><nav id="nav" class="nav">${menus.map(([route, label]) => `<button data-route="${route}">${esc(label)}</button>`).join('')}</nav><div class="userbox"><span class="role-badge">${esc(ROLE_LABEL[role] || role)}</span><span class="user-name">${esc(displayName)}</span><button class="btn light sm" id="logoutBtn">ออก</button></div></header><main id="main" class="main">${loading()}</main><footer class="footer"><span>${esc(CONFIG.build)}</span><span>Desktop / Tablet Core • Mobile: ส่งใบงานย้อนหลังเท่านั้น</span></footer></div>`;
  $('#nav').onclick = (event) => {
    const button = event.target.closest('[data-route]');
    if (button) onNavigate(button.dataset.route);
  };
  $('#logoutBtn').onclick = onLogout;
}

export function markActiveRoute(route) {
  $$('#nav [data-route]').forEach((button) => button.classList.toggle('active', button.dataset.route === route));
}

export function renderLogin({ onLogin, onRegister }) {
  document.body.innerHTML = `<div id="app"></div><div id="toast" class="toast"></div><div id="modalRoot"></div>`;
  $('#app').innerHTML = `<div class="auth-shell"><section class="auth-hero"><span class="hero-chip">FINAL CLEAN • Semester ${CONFIG.semester}/${CONFIG.academicYear}</span><div class="hero-logo">NR</div><h1>DOC-FULL-NR</h1><h2>ระบบงานการเรียนการสอน</h2><p>Frontend ใหม่ทั้งชุดสำหรับ Desktop/Tablet และ Mobile Companion ที่เหลือเฉพาะการส่งสำเนาใบงานย้อนหลัง</p><div class="hero-features"><span>✓ 13 รายวิชา</span><span>✓ 221 หน่วยการสอน</span><span>✓ 4,420 สไลด์</span><span>✓ Paper / Digital Worksheet</span></div></section><section class="auth-panel"><form class="auth-card" id="loginForm"><div class="eyebrow">เข้าสู่ระบบ</div><h2>ยินดีต้อนรับ</h2><p>ใช้ Username, รหัสนักศึกษา หรือ Email</p><label class="field"><span>บัญชีผู้ใช้</span><input name="identifier" autocomplete="username" required></label><label class="field"><span>รหัสผ่าน</span><input name="password" type="password" autocomplete="current-password" required></label><button class="btn primary full" type="submit">เข้าสู่ระบบ</button><button class="btn light full" id="registerBtn" type="button">ลงทะเบียนนักศึกษา</button><div id="loginError"></div><div class="build-note">Build: ${esc(CONFIG.build)}</div></form></section></div>`;
  $('#registerBtn').onclick = onRegister;
  $('#loginForm').onsubmit = async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('[type="submit"]');
    button.disabled = true;
    button.textContent = 'กำลังเข้าสู่ระบบ...';
    $('#loginError').innerHTML = '';
    try {
      await onLogin(event.currentTarget.identifier.value, event.currentTarget.password.value);
    } catch (error) {
      $('#loginError').innerHTML = `<div class="error-inline">${esc(friendlyError(error))}</div>`;
    } finally {
      button.disabled = false;
      button.textContent = 'เข้าสู่ระบบ';
    }
  };
}

export function renderRegister({ meta = {}, onSubmit, onBack }) {
  document.body.innerHTML = `<div id="app"></div><div id="toast" class="toast"></div><div id="modalRoot"></div>`;
  const opt = (items) => arr(items).map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  const enabled = meta.enabled !== false;
  const photoRequired = meta.photo_required !== false;
  let cameraStream = null;
  let photoDataUrl = '';

  $('#app').innerHTML = `<div class="auth-shell register-shell"><section class="auth-hero register"><span class="hero-chip">Student Registration • Semester ${esc(meta.semester || CONFIG.semester)}/${esc(meta.academic_year || CONFIG.academicYear)}</span><h1>ลงทะเบียนนักศึกษา</h1><p>กรอกข้อมูลส่วนตัว ถ่ายรูปสมัคร และระบุข้อมูลการศึกษาให้ครบ ระบบจะส่งคำขอไปยัง Admin เพื่อตรวจสอบห้อง เลขที่ รายวิชา และ Group Code ก่อนเปิดใช้งาน</p><div class="hero-features"><span>✓ ถ่ายรูปผู้สมัครจากกล้อง</span><span>✓ ตรวจข้อมูลก่อนอนุมัติ</span><span>✓ แยกห้อง/สาขา</span><span>✓ ผูก Group Code ภายหลัง</span></div></section><section class="auth-panel register-panel"><form class="auth-card register-card" id="registerForm"><div class="row-between"><div><div class="eyebrow">Detailed Registration</div><h2>ข้อมูลลงทะเบียน</h2></div><span class="pill ${enabled ? 'ok' : 'bad'}">${enabled ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}</span></div>${meta.load_error ? `<div class="error-inline">${esc(meta.load_error)}</div>` : ''}${!enabled ? '<div class="error-inline">ขณะนี้ผู้ดูแลระบบปิดรับการลงทะเบียนใหม่</div>' : ''}

    <div class="registration-section"><h3>1. ข้อมูลประจำตัว</h3><div class="form-grid"><label class="field"><span>ชื่อ-สกุล</span><input name="full_name" maxlength="160" required></label><label class="field"><span>ชื่อเล่น</span><input name="nickname" maxlength="60" required></label><label class="field"><span>รหัสนักศึกษา</span><input name="student_code" inputmode="numeric" pattern="[0-9]{5,15}" required><small>ใช้เป็น Username สำหรับเข้าสู่ระบบ</small></label><label class="field"><span>วันเกิด</span><input name="birth_date" type="date" required></label><label class="field"><span>เบอร์โทรศัพท์</span><input name="phone" inputmode="tel" placeholder="08xxxxxxxx" required></label><label class="field"><span>Email (ถ้ามี)</span><input name="email" type="email"></label></div></div>

    <div class="registration-section"><h3>2. รูปถ่ายผู้สมัคร</h3><div class="registration-camera"><div class="camera-frame"><div class="camera-placeholder" id="cameraPlaceholder"><div>📷</div><strong>ยังไม่ได้เปิดกล้อง</strong><small>จัดใบหน้าให้อยู่กึ่งกลาง มองตรง และมีแสงเพียงพอ</small></div><video id="registrationVideo" autoplay muted playsinline hidden></video><img id="registrationPreview" alt="ตัวอย่างรูปสมัคร" hidden><canvas id="registrationCanvas" hidden></canvas></div><div class="camera-actions"><button class="btn primary" id="startRegistrationCamera" type="button">เปิดกล้อง</button><button class="btn ok" id="captureRegistrationPhoto" type="button" hidden>ถ่ายรูป</button><button class="btn light" id="retakeRegistrationPhoto" type="button" hidden>ถ่ายใหม่</button></div><div id="cameraStatus" class="camera-status">${photoRequired ? 'ต้องถ่ายรูปก่อนส่งคำขอลงทะเบียน' : 'รูปถ่ายไม่บังคับ'}</div></div></div>

    <div class="registration-section"><h3>3. ข้อมูลการศึกษา</h3><div class="form-grid"><label class="field"><span>ระดับ</span><select name="grade_level" required><option value="">เลือกระดับ</option>${opt(meta.grade_levels)}</select></label><label class="field"><span>ห้อง</span><select name="room_label" required><option value="">เลือกห้อง</option>${opt(meta.room_labels)}</select></label><label class="field"><span>แผนก</span><select name="department" required><option value="">เลือกแผนก</option>${opt(meta.departments)}</select></label><label class="field"><span>สาขา</span><select name="major" required><option value="">เลือกสาขา</option>${opt(meta.majors)}</select></label></div><div class="notice-card"><strong>หมายเหตุ</strong><p>ข้อมูลระดับ/ห้อง/แผนก/สาขาที่กรอกเป็นข้อมูลประกอบการสมัคร Admin จะเป็นผู้ยืนยันห้องเรียนจริง รายวิชา และ Group Code อีกครั้งก่อนอนุมัติ</p></div></div>

    <div class="registration-section"><h3>4. ความปลอดภัยบัญชี</h3><div class="form-grid"><label class="field"><span>รหัสผ่าน</span><input name="password" type="password" minlength="8" autocomplete="new-password" required></label><label class="field"><span>ยืนยันรหัสผ่าน</span><input name="password_confirm" type="password" minlength="8" autocomplete="new-password" required></label>${meta.code_required ? '<label class="field span2"><span>Registration Code</span><input name="registration_code" minlength="6" required><small>รับรหัสจากครูหรือผู้ดูแลระบบ</small></label>' : ''}</div></div>

    <label class="check-card registration-confirm"><input type="checkbox" name="confirm_accuracy" required><span><b>ยืนยันข้อมูล</b><small>ข้าพเจ้ายืนยันว่าข้อมูลและรูปถ่ายเป็นของตนเองและถูกต้อง และยินยอมให้ผู้ดูแลระบบใช้เพื่อจัดห้อง รายวิชา และ Group Code</small></span></label><button class="btn primary full" type="submit" ${enabled ? '' : 'disabled'}>ส่งคำขอลงทะเบียน</button><button class="btn light full" id="backLogin" type="button">กลับเข้าสู่ระบบ</button><div id="registerResult"></div></form></section></div>`;

  const video = $('#registrationVideo');
  const preview = $('#registrationPreview');
  const placeholder = $('#cameraPlaceholder');
  const startButton = $('#startRegistrationCamera');
  const captureButton = $('#captureRegistrationPhoto');
  const retakeButton = $('#retakeRegistrationPhoto');
  const cameraStatus = $('#cameraStatus');

  const stopCamera = () => {
    if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    if (video) video.srcObject = null;
  };

  const resetCameraUi = () => {
    stopCamera();
    photoDataUrl = '';
    preview.hidden = true;
    preview.removeAttribute('src');
    video.hidden = true;
    placeholder.hidden = false;
    startButton.hidden = false;
    captureButton.hidden = true;
    retakeButton.hidden = true;
    cameraStatus.textContent = photoRequired ? 'ต้องถ่ายรูปก่อนส่งคำขอลงทะเบียน' : 'รูปถ่ายไม่บังคับ';
    cameraStatus.className = 'camera-status';
  };

  const startCamera = async () => {
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraStatus.textContent = 'อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการเปิดกล้อง';
      cameraStatus.className = 'camera-status bad';
      return;
    }
    try {
      cameraStatus.textContent = 'กำลังขอสิทธิ์ใช้งานกล้อง...';
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } }, audio: false });
      video.srcObject = cameraStream;
      await video.play();
      placeholder.hidden = true;
      preview.hidden = true;
      video.hidden = false;
      startButton.hidden = true;
      captureButton.hidden = false;
      retakeButton.hidden = true;
      cameraStatus.textContent = 'จัดใบหน้าให้อยู่ในกรอบ แล้วกด “ถ่ายรูป”';
      cameraStatus.className = 'camera-status ok';
    } catch (error) {
      cameraStatus.textContent = 'เปิดกล้องไม่ได้ กรุณาอนุญาตสิทธิ์ Camera ในเบราว์เซอร์แล้วลองใหม่';
      cameraStatus.className = 'camera-status bad';
    }
  };

  const capturePhoto = () => {
    if (!video.videoWidth || !video.videoHeight) return;
    const canvas = $('#registrationCanvas');
    const targetW = 600, targetH = 800, targetRatio = targetW / targetH;
    const sourceRatio = video.videoWidth / video.videoHeight;
    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
    if (sourceRatio > targetRatio) {
      sw = Math.round(video.videoHeight * targetRatio);
      sx = Math.round((video.videoWidth - sw) / 2);
    } else {
      sh = Math.round(video.videoWidth / targetRatio);
      sy = Math.round((video.videoHeight - sh) / 2);
    }
    canvas.width = targetW; canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetW, targetH);
    photoDataUrl = canvas.toDataURL('image/jpeg', 0.78);
    if (photoDataUrl.length > 1_350_000) photoDataUrl = canvas.toDataURL('image/jpeg', 0.68);
    preview.src = photoDataUrl;
    preview.hidden = false;
    video.hidden = true;
    placeholder.hidden = true;
    captureButton.hidden = true;
    retakeButton.hidden = false;
    startButton.hidden = true;
    stopCamera();
    cameraStatus.textContent = 'ถ่ายรูปแล้ว ✓ หากไม่พอใจสามารถกด “ถ่ายใหม่”';
    cameraStatus.className = 'camera-status ok';
  };

  startButton.onclick = startCamera;
  captureButton.onclick = capturePhoto;
  retakeButton.onclick = async () => { photoDataUrl = ''; await startCamera(); };
  $('#backLogin').onclick = () => { stopCamera(); onBack(); };

  $('#registerForm').onsubmit = async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('[type="submit"]');
    const form = new FormData(event.currentTarget);
    if (String(form.get('password')) !== String(form.get('password_confirm'))) {
      $('#registerResult').innerHTML = '<div class="error-inline">รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน</div>';
      return;
    }
    if (photoRequired && !photoDataUrl) {
      $('#registerResult').innerHTML = '<div class="error-inline">กรุณาเปิดกล้องและถ่ายรูปผู้สมัครก่อนส่งคำขอ</div>';
      document.querySelector('.registration-camera')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    button.disabled = true;
    try {
      const result = await onSubmit({
        full_name: form.get('full_name'), nickname: form.get('nickname'), student_code: form.get('student_code'),
        birth_date: form.get('birth_date'), phone: form.get('phone'), email: form.get('email'),
        grade_level: form.get('grade_level'), room_label: form.get('room_label'), department: form.get('department'), major: form.get('major'),
        password: form.get('password'), registration_code: form.get('registration_code') || '', photo_data_url: photoDataUrl,
      });
      $('#registerResult').innerHTML = `<div class="success-inline">${esc(result.message || 'ลงทะเบียนสำเร็จ รอผู้ดูแลระบบอนุมัติ')}</div>`;
      event.currentTarget.reset();
      resetCameraUi();
    } catch (error) {
      $('#registerResult').innerHTML = `<div class="error-inline">${esc(friendlyError(error))}</div>`;
    } finally {
      button.disabled = false;
    }
  };
}

export function renderMobileStaffNotice(onLogout) {
  document.body.innerHTML = `<div id="app"></div><div id="toast" class="toast"></div>`;
  $('#app').innerHTML = `<div class="mobile-shell"><header class="mobile-header"><div><strong>DOC-FULL-NR</strong><small>Mobile Companion</small></div><button id="mobileLogout" class="btn light sm">ออก</button></header><main class="mobile-main"><div class="mobile-empty"><div class="mobile-emoji">💻</div><h1>กรุณาใช้คอมพิวเตอร์หรือแท็บเล็ต</h1><p>บัญชีครูและผู้ดูแลระบบไม่เปิดเมนูงานหลักบนโทรศัพท์ เพื่อรักษาความเรียบง่ายและความเสถียรของระบบ</p></div></main></div>`;
  $('#mobileLogout').onclick = onLogout;
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function downloadCsv(filename, rows, columns) {
  const safe = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = '\ufeff' + [columns.join(','), ...arr(rows).map((row) => columns.map((column) => safe(row[column])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function formLines(value) {
  return arr(value).join('\n');
}

export function linesJson(text) {
  return String(text || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
}

export function saveLocalDraft(key, value) {
  localStorage.setItem(`docnr.draft.${key}`, JSON.stringify({ saved_at: new Date().toISOString(), value }));
}

export function loadLocalDraft(key) {
  try { return JSON.parse(localStorage.getItem(`docnr.draft.${key}`) || 'null'); } catch { return null; }
}

export function clearLocalDraft(key) {
  localStorage.removeItem(`docnr.draft.${key}`);
}
