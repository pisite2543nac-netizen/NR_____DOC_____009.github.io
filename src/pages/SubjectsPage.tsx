import {FormEvent,useEffect,useState} from 'react';
import {api} from '../services/api';
import {supabase} from '../lib/supabase';
import {Modal} from '../components/Modal';
import {ErrorPanel} from '../components/ErrorPanel';
import type {Subject} from '../types/domain';
export function SubjectsPage(){
 const[items,setItems]=useState<Subject[]>([]);const[open,setOpen]=useState(false);const[err,setErr]=useState('');const[busy,setBusy]=useState(false);
 async function load(){setErr('');try{setItems(await api.subjects())}catch(e:any){setErr(e.message||String(e))}}
 useEffect(()=>{void load()},[]);
 async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);const f=new FormData(e.currentTarget);const{error}=await supabase.from('subjects').insert({code:String(f.get('code')||'').trim(),name:String(f.get('name')||'').trim(),description:String(f.get('description')||'').trim()||null,semester:String(f.get('semester')||'').trim()||null,academic_year:String(f.get('academic_year')||'').trim()||null,subject_type:'subject',active:true});setBusy(false);if(error){setErr(error.message);return}setOpen(false);await load()}
 return <><div className="page-head"><div><div className="eyebrow">หลักสูตร</div><h1>รายวิชา</h1><p>ข้อมูลรายวิชาที่ใช้ร่วมกับใบงาน การสอน คะแนน และข้อสอบ</p></div><button className="btn primary" onClick={()=>setOpen(true)}>+ เพิ่มรายวิชา</button></div>{err&&<ErrorPanel message={err} onRetry={()=>void load()}/>}<div className="data-card"><table><thead><tr><th>รหัส</th><th>รายวิชา</th><th>ปี/ภาค</th><th>สถานะ</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td><span className="code-pill">{x.code}</span></td><td><b>{x.name}</b><small>{x.description||''}</small></td><td>{x.academic_year||'-'} / {x.semester||'-'}</td><td><span className="status-chip ok">ใช้งาน</span></td></tr>)}</tbody></table></div>{open&&<Modal title="เพิ่มรายวิชา" onClose={()=>setOpen(false)}><form onSubmit={save}><div className="form-grid"><label>รหัสวิชา<input name="code" required autoFocus/></label><label>ชื่อวิชา<input name="name" required/></label><label>ปีการศึกษา<input name="academic_year"/></label><label>ภาคเรียน<input name="semester"/></label><label className="span2">คำอธิบาย<textarea name="description"/></label></div><div className="modal-actions"><button type="button" className="btn" onClick={()=>setOpen(false)}>ยกเลิก</button><button className="btn primary" disabled={busy}>{busy?'กำลังบันทึก...':'บันทึก'}</button></div></form></Modal>}</>
}
