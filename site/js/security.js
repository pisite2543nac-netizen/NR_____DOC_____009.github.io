const DEVICE_KEY = 'docnr.secure.device.v150';

export function deviceToken() {
  let token = sessionStorage.getItem(DEVICE_KEY);
  if (!token) {
    token = crypto.randomUUID ? crypto.randomUUID() : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12,'0').slice(-12)}`;
    sessionStorage.setItem(DEVICE_KEY, token);
  }
  return token;
}

export function clientFingerprint() {
  const s = window.screen || {};
  return [navigator.userAgent, navigator.language, navigator.platform, s.width, s.height, window.devicePixelRatio || 1].join('|').slice(0, 240);
}

export async function requestExamFullscreen() {
  if (document.fullscreenElement) return true;
  const target = document.documentElement;
  if (!target.requestFullscreen) throw new Error('เบราว์เซอร์นี้ไม่รองรับโหมดเต็มหน้าจอสำหรับการสอบ');
  await target.requestFullscreen();
  return Boolean(document.fullscreenElement);
}

export async function leaveFullscreen() {
  try { if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen(); } catch {}
}

export function secondsLeft(iso) {
  const t = new Date(iso).getTime();
  return Math.max(0, Math.floor((t - Date.now()) / 1000));
}

export function thaiDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
}
