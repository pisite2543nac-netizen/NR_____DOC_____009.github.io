import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

async function clearLegacyRuntime(){
  try{
    if('serviceWorker' in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
    }
    if('caches' in window){
      const names=await caches.keys();
      await Promise.all(names.map(n=>caches.delete(n)));
    }
  }catch(e){ console.warn('legacy cleanup skipped',e); }
}
void clearLegacyRuntime();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App/></React.StrictMode>
);
