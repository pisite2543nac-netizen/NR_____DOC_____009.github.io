import {ReactNode,useEffect,useState} from 'react';
export function DesktopGuard({children}:{children:ReactNode}){
  const[ok,setOk]=useState(()=>window.innerWidth>=768);
  useEffect(()=>{const f=()=>setOk(window.innerWidth>=768);window.addEventListener('resize',f);return()=>window.removeEventListener('resize',f)},[]);
  if(!ok)return <div className="unsupported"><div className="unsupported-card"><div className="logo-mark">NR</div><h1>ระบบสำหรับ Tablet / Computer</h1><p>รุ่นนี้ตัดระบบโทรศัพท์ออกตามข้อกำหนด เพื่อให้การทำงานของหน้าจอหลักเสถียรและชัดเจนขึ้น</p><p className="muted">กรุณาเปิดบนแท็บเล็ตแนวนอนหรือคอมพิวเตอร์ที่ความกว้างอย่างน้อย 768px</p></div></div>;
  return <>{children}</>;
}
