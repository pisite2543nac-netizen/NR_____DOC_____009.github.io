import {Navigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {Loading} from './Loading';
import {ErrorPanel} from './ErrorPanel';
export function ProtectedRoute({roles,children}:{roles?:string[];children:JSX.Element}){
  const{loading,session,profile,error,refreshProfile}=useAuth();
  if(loading)return <Loading/>;
  if(!session)return <Navigate to="/login" replace/>;
  if(error||!profile)return <div className="center-page"><ErrorPanel message={error||'ไม่พบโปรไฟล์'} onRetry={()=>void refreshProfile()}/></div>;
  if(roles&&!roles.includes(String(profile.role)))return <Navigate to="/" replace/>;
  return children;
}
