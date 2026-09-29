import {FormEvent,useEffect,useState} from 'react';
import {api} from '../services/api';
import {supabase} from '../lib/supabase';
import {Modal} from '../components/Modal';
import {ErrorPanel} from '../components/ErrorPanel';
import type {Classroom} from '../types/domain';
export function ClassroomsPage(){
 const[items,setItems]=useState<Classroom[]>([]);const[open,setOpen]=useState(false);const[err,setErr]=useState('');const[busy,setBusy]=useState(false);
 async function load(){setErr('');try{setItems(await api.classrooms())}catch(e:any){setErr(e.message||String(e))}}
 useEffect(()=>{void load()},[]);
 async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setErr('');const f=new FormData(e.currentTarget);const{error}=await supabase.from('classrooms').insert({name:String(f.get('name')||'').trim(),level:String(f.get('level')||'').trim()||null,academic_year:String(f.get('academic_year')||'').trim()||null,semester:String(f.get('semester')||'').trim()||null,active:true});setBusy(false);if(error){setErr(error.message);return}setOpen(false);await load()}
 return <><div className="page-head"><div><div className="eyebrow">โครงสร้างชั้นเรียน</div><h1>ห้องเรียน</h1><p>รายการห้องที่เปิดใช้งานในระบบ</p></div><button className="btn primary" onClick={()=>setOpen(true)}>+ เพิ่มห้องเรียน</button></div>{err&&<ErrorPanel message={err} onRetry={()=>void load()}/>}<div className="data-card"><table><thead><tr><th>ชื่อห้อง</th><th>ระดับ</th><th>ปีการศึกษา</th><th>ภาคเรียน</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td><b>{x.name}</b></td><td>{x.level||'-'}</td><td>{x.academic_year||'-'}</td><td>{x.semester||'-'}</td></tr>)}</tbody></table>{!items.length&&!err&&<div className="empty">ยังไม่มีห้องเรียน</div>}</div>{open&&<Modal title="เพิ่มห้องเรียน" onClose={()=>setOpen(false)}><form onSubmit={save}><div className="form-grid"><label>ชื่อห้อง<input name="name" required autoFocus/></label><label>ระดับชั้น<input name="level"/></label><label>ปีการศึกษา<input name="academic_year"/></label><label>ภาคเรียน<input name="semester"/></label></div><div className="modal-actions"><button type="button" className="btn" onClick={()=>setOpen(false)}>ยกเลิก</button><button className="btn primary" disabled={busy}>{busy?'กำลังบันทึก...':'บันทึก'}</button></div></form></Modal>}</>
}
