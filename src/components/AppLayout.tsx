import {NavLink,Outlet} from 'react-router-dom';
import {BookOpen,ClipboardCheck,FileBarChart2,GraduationCap,Home,LogOut,School,Users,UserRound,CalendarCheck,Layers3,FileQuestion,Presentation,ShieldCheck} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';

type Item=[string,string,any];
export function AppLayout(){
  const{profile,signOut}=useAuth();
  const role=String(profile?.role||'user');
  const staff=role==='admin'||role==='teacher';
  const admin=role==='admin';
  const nav:Item[]=[['/','ภาพรวม',Home]];
  if(staff)nav.push(['/attendance','เช็กชื่อ',CalendarCheck],['/teaching','การสอน',Presentation],['/worksheets','ใบงาน',ClipboardCheck],['/exams','ข้อสอบ',FileQuestion],['/grading','ตรวจงาน',ShieldCheck],['/reports','คะแนน/รายงาน',FileBarChart2]);
  if(admin)nav.push(['/users','ผู้ใช้',Users],['/classrooms','ห้องเรียน',School],['/room-groups','กลุ่มห้อง',Layers3],['/subjects','รายวิชา',BookOpen]);
  if(!staff)nav.push(['/my-worksheets','ใบงานของฉัน',ClipboardCheck]);
  nav.push(['/profile','โปรไฟล์',UserRound]);
  return <div className="shell">
    <header className="app-header">
      <div className="identity"><div className="logo-mark">NR</div><div><strong>DOC-FULL-NR</strong><small>Production Console • V23 Desktop/Tablet</small></div></div>
      <div className="account"><div><b>{profile?.full_name||profile?.username||'ผู้ใช้'}</b><small>{role.toUpperCase()}</small></div><button className="btn ghost" onClick={()=>void signOut()}><LogOut size={17}/>ออกจากระบบ</button></div>
    </header>
    <nav className="topnav">{nav.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==='/' }><Icon size={17}/><span>{label}</span></NavLink>)}</nav>
    <main className="workspace"><Outlet/></main>
  </div>
}
