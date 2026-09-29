import {FormEvent,useState} from 'react';
import {Navigate} from 'react-router-dom';
import {supabase} from '../lib/supabase';
import {useAuth} from '../contexts/AuthContext';
export function LoginPage(){
  const{session}=useAuth();const[msg,setMsg]=useState('');const[busy,setBusy]=useState(false);
  if(session)return <Navigate to="/" replace/>;
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMsg('');const f=new FormData(e.currentTarget);const email=String(f.get('email')||'').trim();const password=String(f.get('password')||'');const{error}=await supabase.auth.signInWithPassword({email,password});setBusy(false);if(error)setMsg(error.message)}
  return <div className="login-page"><section className="login-hero"><div className="hero-badge">NR</div><h1>DOC-FULL-NR</h1><h2>ระบบใบงานและการจัดการชั้นเรียน</h2><p>Production Console รุ่น Desktop / Tablet เน้นเสถียรภาพและการทำงานจริง ไม่ใช้ Mobile Runtime รุ่นเดิม</p><div className="hero-points"><span>✓ Dashboard</span><span>✓ Attendance</span><span>✓ Worksheets</span><span>✓ Exams & Grades</span></div></section><section className="login-panel"><div className="login-card"><div className="eyebrow">เข้าสู่ระบบ</div><h2>ยินดีต้อนรับกลับ</h2><p className="muted">ใช้บัญชีที่มีอยู่ในระบบ</p>{msg&&<div className="error-panel">{msg}</div>}<form onSubmit={submit}><label>อีเมล<input name="email" type="email" autoComplete="username" required/></label><label>รหัสผ่าน<input name="password" type="password" autoComplete="current-password" minLength={8} required/></label><button className="btn primary wide" disabled={busy}>{busy?'กำลังเข้าสู่ระบบ...':'เข้าสู่ระบบ'}</button></form><div className="login-foot">DOC-FULL-NR V23 • Desktop/Tablet only</div></div></section></div>
}
