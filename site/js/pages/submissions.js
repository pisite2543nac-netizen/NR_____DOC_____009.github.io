import { rpc, getMobileFileUrl } from '../api.js';
import { pageHead, setMain, arr, esc, statusPill, modal, toast, fmt } from '../ui.js';
import { openStudentProfile } from '../student-profile.js';

export async function submissionsPage() {
  const [digital, mobile] = await Promise.all([rpc('clean_staff_submission_queue'), rpc('clean_staff_mobile_copy_queue')]);
  const digitalRows = arr(digital), mobileRows = arr(mobile);
  setMain(pageHead('ตรวจงาน', 'ตรวจงาน Digital และรับสำเนา Paper ที่ส่งย้อนหลังจากมือถือ') + `
    <div class="tabbar"><button class="tab active" data-tab="digital">Digital (${digitalRows.length})</button><button class="tab" data-tab="mobile">ย้อนหลังมือถือ (${mobileRows.length})</button></div>
    <div id="submissionBody"></div>`);
  const drawDigital = () => {
    document.querySelector('#submissionBody').innerHTML = digitalRows.length ? `<div class="table-wrap"><table><thead><tr><th>นักศึกษา</th><th>วิชา</th><th>ใบงาน</th><th>สถานะ</th><th>ส่งเมื่อ</th><th></th></tr></thead><tbody>${digitalRows.map((r) => `<tr><td><strong>${esc(r.student_code || '')} ${esc(r.full_name || '')}</strong><small><button class="link-btn" data-student-profile="${r.student_id}">ดูโปรไฟล์</button></small></td><td>${esc(r.subject_code || '')}</td><td>${esc(r.worksheet_title || r.title || '')}</td><td>${statusPill(r.submission_status || r.status)}</td><td>${fmt(r.submitted_at)}</td><td><button class="btn primary sm" data-review="${r.id || r.submission_id}">ตรวจ</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีงาน Digital รอตรวจ</div>';
    document.querySelectorAll('[data-review]').forEach((b) => b.onclick = () => reviewDigital(b.dataset.review));
    document.querySelectorAll('[data-student-profile]').forEach((b) => b.onclick = () => openStudentProfile(b.dataset.studentProfile));
  };
  const drawMobile = () => {
    document.querySelector('#submissionBody').innerHTML = mobileRows.length ? `<div class="table-wrap"><table><thead><tr><th>นักศึกษา</th><th>วิชา</th><th>ใบงาน</th><th>ครั้ง</th><th>สถานะ</th><th>ส่งเมื่อ</th><th></th></tr></thead><tbody>${mobileRows.map((r) => `<tr><td><strong>${esc(r.student_code || '')} ${esc(r.full_name || '')}</strong><small><button class="link-btn" data-student-profile="${r.student_id}">ดูโปรไฟล์</button></small></td><td>${esc(r.subject_code || '')}</td><td>${esc(r.worksheet_title || '')}</td><td>${r.attempt_no ?? '-'}</td><td>${statusPill(r.status)}</td><td>${fmt(r.submitted_at)}</td><td><button class="btn light sm" data-mobile-review="${r.id}">ดูภาพ/ตรวจรับ</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">ยังไม่มีสำเนางานย้อนหลัง</div>';
    document.querySelectorAll('[data-mobile-review]').forEach((b) => b.onclick = () => reviewMobile(mobileRows.find((r) => r.id === b.dataset.mobileReview)));
    document.querySelectorAll('[data-student-profile]').forEach((b) => b.onclick = () => openStudentProfile(b.dataset.studentProfile));
  };
  drawDigital();
  document.querySelectorAll('[data-tab]').forEach((button) => button.onclick = () => {
    document.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('active', x === button));
    if (button.dataset.tab === 'digital') drawDigital(); else drawMobile();
  });
}

async function reviewDigital(id) {
  const data = await rpc('clean_submission_detail', { p_submission_id: id });
  const submission = data.submission || data;
  const answers = submission.answers || data.answers || {};
  modal({ title: `ตรวจใบงาน • ${submission.full_name || data.full_name || ''}`, wide: true, body: `
    <div class="detail-grid"><div><span>ใบงาน</span><strong>${esc(submission.worksheet_title || data.worksheet_title || '-')}</strong></div><div><span>สถานะ</span><strong>${statusPill(submission.status || data.status)}</strong></div><div><span>ส่งเมื่อ</span><strong>${fmt(submission.submitted_at || data.submitted_at)}</strong></div></div>
    <div class="answer-review">${Object.entries(answers).map(([key, value]) => `<div><span>${esc(key)}</span><p>${esc(typeof value === 'object' ? JSON.stringify(value) : value)}</p></div>`).join('') || '<div class="empty-state">ไม่มีคำตอบ</div>'}</div>
    <div class="form-grid"><label class="field"><span>คะแนน</span><input name="score" type="number" step="0.01" min="0" required></label><label class="field"><span>คะแนนเต็ม</span><input name="max" type="number" step="0.01" min="1" value="100" required></label><label class="field"><span>เกรด/ผลย่อย</span><input name="grade"></label><label class="field span2"><span>ความเห็น</span><textarea name="comment"></textarea></label></div>`,
    submitLabel: 'บันทึกคะแนน',
    onSubmit: async (form) => {
      await rpc('clean_submission_grade', { p_submission_id: id, p_score: Number(form.get('score')), p_max_score: Number(form.get('max')), p_grade: form.get('grade'), p_comment: form.get('comment') });
      toast('บันทึกคะแนนแล้ว', 'ok'); await submissionsPage();
    },
  });
}

async function reviewMobile(row) {
  const files = arr(row.files);
  modal({ title: `สำเนางานย้อนหลัง • ${row.full_name || ''}`, wide: true, body: `
    <div class="confirm-summary"><div><span>วิชา</span><strong>${esc(row.subject_code || '')}</strong></div><div><span>ใบงาน</span><strong>${esc(row.worksheet_title || '')}</strong></div><div><span>ครั้งที่</span><strong>${row.attempt_no ?? '-'}</strong></div><div><span>สถานะ</span><strong>${statusPill(row.status)}</strong></div></div>
    <div class="mobile-image-grid" id="mobileImages">${files.map((_, i) => `<div class="image-loader" data-img="${i}">กำลังโหลดภาพ ${i + 1}...</div>`).join('')}</div>
    <div class="notice-card"><strong>หมายเหตุนักศึกษา</strong><p>${esc(row.note || '-')}</p></div>
    <label class="field"><span>ความเห็นผู้ตรวจ</span><textarea name="review_note"></textarea></label>`,
    submitLabel: 'รับงานและส่งเข้าคิวให้คะแนน',
    extraFooter: '<button class="btn danger" type="button" id="rejectMobile">ไม่รับงาน</button>',
    onSubmit: async (form) => {
      await rpc('clean_mobile_copy_review', { p_submission_id: row.id, p_decision: 'accepted', p_note: form.get('review_note') });
      toast('รับงานแล้ว และสร้าง Submission สำหรับให้คะแนน', 'ok'); await submissionsPage();
    },
  });
  files.forEach(async (path, index) => {
    const box = document.querySelector(`[data-img="${index}"]`);
    try {
      const url = await getMobileFileUrl(path);
      box.className = 'mobile-image'; box.innerHTML = `<a href="${esc(url)}" target="_blank" rel="noopener"><img src="${esc(url)}" alt="สำเนางาน ${index + 1}"></a>`;
    } catch (error) {
      box.className = 'error-inline'; box.textContent = error.message;
    }
  });
  document.querySelector('#rejectMobile').onclick = async () => {
    const note = document.querySelector('#modalForm [name="review_note"]').value;
    await rpc('clean_mobile_copy_review', { p_submission_id: row.id, p_decision: 'rejected', p_note: note });
    document.querySelector('#modalRoot').innerHTML = ''; toast('บันทึกว่าไม่รับงานแล้ว', 'ok'); await submissionsPage();
  };
}
