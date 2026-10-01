import { rpc } from '../api.js';
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { pageHead, setMain, arr, esc, statusPill, downloadJson, toast } from '../ui.js';

export async function diagnosticsPage() {
  const health = await rpc('clean_health');
  let build = state.build;
  try { build = await fetch('./BUILD.json', { cache: 'no-store' }).then((r) => r.json()); } catch {}
  let acceptance = null;
  if (state.profile.role === 'admin') acceptance = await rpc('clean_system_acceptance');
  setMain(pageHead('System Diagnostics', 'ตรวจ Frontend / Backend / Release Gate / API Trace', state.profile.role === 'admin' ? '<button class="btn primary" id="runAcceptance">ตรวจซ้ำ</button><button class="btn light" id="downloadBackup">Backup Master Data</button>' : '<button class="btn light" id="refreshDiag">Refresh</button>') + `
    <div class="metric-grid compact"><div class="metric-card"><span>Frontend</span><strong>${esc(build?.version || CONFIG.version)}</strong><small>${esc(build?.build || CONFIG.build)}</small></div><div class="metric-card"><span>Backend</span><strong>${esc(health.version || '-')}</strong><small>${esc(health.build || '-')}</small></div><div class="metric-card"><span>Role</span><strong>${esc(health.role || state.profile.role)}</strong><small>${esc(health.user_id || '')}</small></div><div class="metric-card"><span>Mobile</span><strong>Paper Only</strong><small>${esc(health.mobile_scope || 'paper-retrospective-only')}</small></div></div>
    ${acceptance ? `<section class="panel" style="margin-top:18px"><div class="panel-head"><h3>Production Acceptance</h3>${acceptance.ok ? '<span class="gate pass">PASS</span>' : '<span class="gate fail">FAIL</span>'}</div><div class="check-grid">${arr(acceptance.checks).map((c) => `<div class="check-card ${c.pass ? 'pass' : 'fail'}"><span>${c.pass ? '✓' : '!'}</span><div><strong>${esc(c.label)}</strong><small>${esc(c.detail)}</small></div></div>`).join('')}</div><div class="notice-card"><strong>Pending Registration</strong><p>${acceptance.pending_registrations ?? 0} บัญชี</p></div></section>` : ''}
    <section class="panel" style="margin-top:18px"><div class="panel-head"><h3>API Trace ล่าสุด</h3></div><div class="trace-box">${state.trace.length ? state.trace.map((t) => `<div class="trace-row ${t.ok ? 'ok' : 'bad'}"><strong>${esc(t.method)} ${esc(t.status)}</strong><span>${t.ms}ms</span><small>${esc(t.url)}</small>${t.error ? `<pre>${esc(t.error)}</pre>` : ''}</div>`).join('') : '<div class="empty-state">ยังไม่มีรายการ</div>'}</div></section>`);
  if (document.querySelector('#refreshDiag')) document.querySelector('#refreshDiag').onclick = diagnosticsPage;
  if (document.querySelector('#runAcceptance')) document.querySelector('#runAcceptance').onclick = diagnosticsPage;
  if (document.querySelector('#downloadBackup')) document.querySelector('#downloadBackup').onclick = async () => { const snapshot = await rpc('clean_admin_backup_snapshot'); downloadJson(`DOC_FULL_NR_BACKUP_${new Date().toISOString().slice(0,10)}.json`, snapshot); toast('สร้าง Backup Master Data แล้ว', 'ok'); };
}
