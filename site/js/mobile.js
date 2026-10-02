import { state } from './state.js';
import { CONFIG } from './config.js';
import { rpc, uploadMobileImage, logout, friendlyError } from './api.js';
import { $, esc, arr, toast, loading } from './ui.js';
import { deviceToken } from './security.js';

export function renderMobileShell(onLoggedOut) {
  document.body.innerHTML = `<div id="app"></div><div id="toast" class="toast"></div>`;
  $('#app').innerHTML = `<div class="mobile-shell"><header class="mobile-header"><div><strong>DOC-FULL-NR</strong><small>เข้าห้องเรียน + ส่งใบงานย้อนหลัง • ${CONFIG.version}</small></div><button class="btn light sm" id="mobileLogout">ออก</button></header><main class="mobile-main" id="mobileMain"></main><footer class="mobile-footer"><span>${esc(state.profile.student_code || '')}</span><span>เข้าห้องเรียน + ส่งสำเนาใบงาน</span></footer></div>`;
  $('#mobileLogout').onclick = async () => { await logout(); onLoggedOut(); };
  renderMobileHome();
}

async function renderMobileHome() {
  state.mobileFiles = [];
  const main = $('#mobileMain'); main.innerHTML = loading();
  let targets = [];
  try { targets = arr(await rpc('clean_my_mobile_copy_targets')); }
  catch { targets = []; }
  main.innerHTML = `<section class="mobile-welcome"><span>นักศึกษา</span><h1>${esc(state.profile.display_name || state.profile.full_name || '')}</h1><p>${esc(state.profile.student_code || '')}</p></section>
    <button class="mobile-primary-action" id="openClassJoin"><span>🏫</span><strong>เข้าห้องเรียนด้วยรหัส</strong><small>กรอกรหัส 6 หลักที่ครูแสดงในคาบเรียน</small></button>
    <button class="mobile-primary-action secondary" id="openCopy"><span>📄</span><strong>ส่งใบงานย้อนหลัง</strong><small>ถ่ายรูปสำเนาใบงานกระดาษที่ครูเปิดรับ</small></button>
    <div class="mobile-stat"><strong>${targets.length}</strong><span>ใบงานที่เปิดรับย้อนหลัง</span></div>
    <div class="mobile-rule"><strong>มือถือใช้ทำอะไรได้?</strong><p>ใช้เข้าห้องเรียนด้วยรหัส และส่งสำเนาใบงานกระดาษย้อนหลังเท่านั้น การทำข้อสอบปลอดภัยและงานหลักให้ใช้คอมพิวเตอร์หรือแท็บเล็ต</p></div>`;
  $('#openClassJoin').onclick = renderClassJoin;
  $('#openCopy').onclick = () => renderCopy(targets);
}

function renderClassJoin() {
  const main = $('#mobileMain');
  main.innerHTML = `<div class="mobile-page-title"><button class="icon-btn" id="backMobile">←</button><div><h1>เข้าห้องเรียน</h1><p>รหัส 6 หลักเปลี่ยนอัตโนมัติตามเวลาที่ครูกำหนด</p></div></div><section class="mobile-card"><div class="rule-icon">🏫</div><h2>กรอกรหัสห้องเรียน</h2><p>ต้องเข้าสู่ระบบด้วยบัญชีของตนเอง ระบบจะตรวจรายวิชาและกลุ่มเรียนก่อนบันทึกการเข้าเรียน</p><label class="field"><span>รหัสห้องเรียน</span><input id="mobileClassCode" class="code-input" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" placeholder="000000"></label><button class="btn primary full" id="joinClass">ยืนยันเข้าห้องเรียน</button><div id="classJoinResult"></div></section>`;
  $('#backMobile').onclick = renderMobileHome;
  $('#joinClass').onclick = async () => {
    const code = String($('#mobileClassCode').value || '').trim();
    const out = $('#classJoinResult');
    if (!/^\d{6}$/.test(code)) { out.innerHTML = '<div class="error-inline">กรุณากรอกรหัส 6 หลัก</div>'; return; }
    const btn = $('#joinClass'); btn.disabled = true;
    try {
      const r = await rpc('clean_class_join', { p_code: code, p_device_token: deviceToken() });
      out.innerHTML = `<div class="success-inline">เข้าห้องเรียนสำเร็จ • ${r.status === 'late' ? 'เข้าสาย' : 'มาเรียน'} • ${esc(r.subject_code || '')}</div>`;
      toast('เข้าห้องเรียนสำเร็จ', 'ok');
    } catch (error) {
      out.innerHTML = `<div class="error-inline">${esc(friendlyError(error))}</div>`;
    } finally { btn.disabled = false; }
  };
}

function renderCopy(targets) {
  const main = $('#mobileMain'); state.mobileFiles = [];
  main.innerHTML = `<div class="mobile-page-title"><button class="icon-btn" id="backMobile">←</button><div><h1>ส่งใบงานย้อนหลัง</h1><p>สูงสุด ${CONFIG.maxMobileFiles} รูปต่อครั้ง</p></div></div>${targets.length ? `<section class="mobile-card"><label class="field"><span>เลือกใบงาน</span><select id="mobileWorksheet">${targets.map((w) => `<option value="${w.id}">${esc(w.subject_code || '')} • ${esc(w.title)}</option>`).join('')}</select></label><label class="camera-picker"><span>📷</span><strong>ถ่ายรูป / เพิ่มรูป</strong><small>ถ่ายให้เห็นกระดาษเต็มหน้าและอ่านชัด</small><input id="mobileCamera" type="file" accept="image/*" capture="environment"></label><div id="mobileFiles"></div><label class="field"><span>หมายเหตุ</span><textarea id="mobileNote" placeholder="เช่น ส่งย้อนหลังตามที่ครูอนุญาต"></textarea></label><button class="btn primary full" id="submitCopy">ส่งสำเนางาน</button><div id="mobileProgress"></div></section>` : '<div class="mobile-empty"><div class="mobile-emoji">📭</div><h2>ยังไม่มีใบงานที่เปิดรับ</h2><p>ใบงานจะปรากฏเมื่อครูเปิดรับ “ส่งย้อนหลังมือถือ” สำหรับ Paper Worksheet</p></div>'}`;
  $('#backMobile').onclick = renderMobileHome;
  if (!targets.length) return;
  $('#mobileCamera').onchange = (event) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (state.mobileFiles.length >= CONFIG.maxMobileFiles) return toast(`เพิ่มได้สูงสุด ${CONFIG.maxMobileFiles} รูป`, 'bad');
    state.mobileFiles.push(file); drawFiles();
  };
  $('#submitCopy').onclick = submitCopy;
  drawFiles();
}

function drawFiles() {
  const box = $('#mobileFiles'); if (!box) return;
  box.innerHTML = state.mobileFiles.length ? `<div class="mobile-file-list">${state.mobileFiles.map((f, i) => `<div class="mobile-file"><div><strong>ภาพ ${i + 1}</strong><small>${esc(f.name)} • ${(f.size/1024/1024).toFixed(1)} MB</small></div><button class="btn danger sm" data-remove="${i}">ลบ</button></div>`).join('')}</div>` : '<div class="empty-state compact">ยังไม่ได้ถ่ายรูป</div>';
  box.querySelectorAll('[data-remove]').forEach((b) => b.onclick = () => { state.mobileFiles.splice(Number(b.dataset.remove), 1); drawFiles(); });
}

async function submitCopy() {
  const progress = $('#mobileProgress');
  if (!state.mobileFiles.length) { progress.innerHTML = '<div class="error-inline">กรุณาถ่ายอย่างน้อย 1 รูป</div>'; return; }
  const worksheetId = $('#mobileWorksheet').value;
  const button = $('#submitCopy'); button.disabled = true;
  const paths = [];
  try {
    for (let i = 0; i < state.mobileFiles.length; i += 1) {
      progress.innerHTML = `<div class="notice-card">กำลังอัปโหลดภาพ ${i + 1}/${state.mobileFiles.length}...</div>`;
      paths.push(await uploadMobileImage(state.mobileFiles[i], worksheetId, i + 1));
    }
    progress.innerHTML = '<div class="notice-card">กำลังบันทึกการส่งงาน...</div>';
    await rpc('clean_mobile_copy_submit', { p_worksheet_id: worksheetId, p_files: paths, p_note: $('#mobileNote').value });
    state.mobileFiles = []; drawFiles();
    progress.innerHTML = '<div class="success-inline">ส่งสำเนางานเรียบร้อยแล้ว รอครูตรวจรับ</div>';
    toast('ส่งงานย้อนหลังสำเร็จ', 'ok');
  } catch (error) {
    progress.innerHTML = `<div class="error-inline">${esc(friendlyError(error))}</div>`;
  } finally { button.disabled = false; }
}
