import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {api} from '../services/api';
import {ErrorPanel} from '../components/ErrorPanel';
import {Loading} from '../components/Loading';

export function DashboardPage(){
  const{profile}=useAuth();const[data,setData]=useState<any>(null);const[err,setErr]=useState('');
  async function load(){setErr('');try{
    const role=String(profile?.role||'user');
    if(role==='admin'){
      const [subjects,classrooms,users,works,queue,groups,att,exams]=await Promise.all([api.subjects(),api.classrooms(),api.users(),api.worksheets(),api.submissionQueue(),api.roomGroups(),api.attendanceSessions(),api.examDashboard()]);
      setData({stats:[['ผู้ใช้',users.length],['ห้องเรียน',classrooms.length],['รายวิชา',subjects.length],['ใบงาน',works.length],['งานรอตรวจ',queue.filter((x:any)=>x.status!=='graded').length],['กลุ่มห้อง',groups.length],['ครั้งเช็กชื่อ',att.length],['ข้อสอบ',exams.exams?.length||0]]});
    }else if(role==='teacher'){
      const [assign,queue,att,exams]=await Promise.all([api.teacherAssignments(),api.submissionQueue(),api.attendanceSessions(),api.examDashboard()]);
      setData({stats:[['วิชาที่สอน',new Set(assign.map((x:any)=>x.subject_id)).size],['ห้องที่สอน',new Set(assign.map((x:any)=>x.classroom_id)).size],['งานรอตรวจ',queue.filter((x:any)=>x.status!=='graded').length],['ครั้งเช็กชื่อ',att.length],['ข้อสอบ',exams.exams?.length||0]]});
    }else{
      const works=await api.worksheets(false);setData({works:works.slice(0,12)});
    }
  }catch(e:any){setErr(e?.message||String(e))}}
  useEffect(()=>{if(profile)void load()},[profile]);
  if(!data&&!err)return <Loading/>;
  if(err)return <ErrorPanel message={err} onRetry={()=>void load()}/>;
  const staff=profile?.role==='admin'||profile?.role==='teacher';
  return <><div className="page-head"><div><div className="eyebrow">ภาพรวมระบบ</div><h1>สวัสดี {profile?.full_name||profile?.username||''}</h1><p>ระบบหลักเชื่อมต่อ Supabase โดยตรงและตัด Mobile Runtime เดิมออกแล้ว</p></div><div className="status-chip ok">SYSTEM ONLINE</div></div>
    {staff?<><div className="stat-grid">{data.stats.map(([label,value]:any)=><div className="metric" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="quick-grid"><Link to="/attendance" className="quick"><b>เช็กชื่อ</b><span>เปิด/ปิด session และจัดการสถานะรายคน</span></Link><Link to="/worksheets" className="quick"><b>ใบงาน</b><span>สร้าง เผยแพร่ และจัดการใบงาน</span></Link><Link to="/exams" className="quick"><b>ข้อสอบ</b><span>สร้างชุดสอบและติดตามการสอบ</span></Link><Link to="/grading" className="quick"><b>ตรวจงาน</b><span>ตรวจคะแนนจากคิวงานจริง</span></Link><Link to="/teaching" className="quick"><b>แผนการสอน</b><span>ดูหน่วยการเรียนและสื่อรายวิชา</span></Link><Link to="/reports" className="quick"><b>รายงาน</b><span>Gradebook และ CSV</span></Link></div></>:<div className="card-grid">{(data.works||[]).map((w:any)=><div className="panel" key={w.id}><div className="eyebrow">{w.subjects?.code}</div><h3>{w.title}</h3><p>{w.subjects?.name}</p><Link className="btn primary" to={`/submit/${w.id}`}>เปิดใบงาน</Link></div>)}</div>}
  </>
}
