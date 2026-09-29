import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,ReactNode} from 'react';
import type {Session} from '@supabase/supabase-js';
import {supabase} from '../lib/supabase';
import type {Profile} from '../types/domain';

type Ctx={session:Session|null;profile:Profile|null;loading:boolean;error:string;refreshProfile:()=>Promise<void>;signOut:()=>Promise<void>};
const AuthContext=createContext<Ctx|null>(null);

export function AuthProvider({children}:{children:ReactNode}){
  const[session,setSession]=useState<Session|null>(null);
  const[profile,setProfile]=useState<Profile|null>(null);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState('');
  const mounted=useRef(true);

  const loadProfile=useCallback(async(s:Session|null)=>{
    if(!s){if(mounted.current)setProfile(null);return;}
    const {data,error}=await supabase.from('profiles').select('*').eq('id',s.user.id).maybeSingle();
    if(!mounted.current)return;
    if(error){setError(`โหลดสิทธิ์ผู้ใช้ไม่สำเร็จ: ${error.message}`);setProfile(null);return;}
    if(!data){setError('ไม่พบโปรไฟล์ผู้ใช้ในระบบ');setProfile(null);return;}
    setError('');setProfile(data as Profile);
  },[]);

  const refreshProfile=useCallback(async()=>{
    const {data}=await supabase.auth.getSession();
    await loadProfile(data.session);
  },[loadProfile]);

  useEffect(()=>{
    mounted.current=true;
    let alive=true;
    (async()=>{
      const {data,error}=await supabase.auth.getSession();
      if(!alive)return;
      if(error)setError(error.message);
      setSession(data.session);
      await loadProfile(data.session);
      if(alive)setLoading(false);
    })();
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{
      if(!alive)return;
      setSession(next);
      setLoading(true);
      queueMicrotask(()=>loadProfile(next).finally(()=>{if(alive)setLoading(false)}));
    });
    return()=>{alive=false;mounted.current=false;subscription.unsubscribe()};
  },[loadProfile]);

  const value=useMemo<Ctx>(()=>({session,profile,loading,error,refreshProfile,signOut:async()=>{await supabase.auth.signOut()}}),[session,profile,loading,error,refreshProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>{const c=useContext(AuthContext);if(!c)throw new Error('AuthProvider missing');return c};
