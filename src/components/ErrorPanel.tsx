export function ErrorPanel({message,onRetry}:{message:string;onRetry?:()=>void}){
  return <div className="error-panel"><b>ทำรายการไม่สำเร็จ</b><div>{message}</div>{onRetry&&<button className="btn" onClick={onRetry}>ลองใหม่</button>}</div>
}
