import {supabase} from '../lib/supabase';
import type {Classroom,Grade,Profile,Subject,Submission,Worksheet} from '../types/domain';

async function rpc<T=any>(name:string,args:Record<string,unknown>={}){const{data,error}=await supabase.rpc(name,args);if(error)throw error;return data as T}
export const api={
  rpc,
  async subjects(){const{data,error}=await supabase.from('subjects').select('*').eq('active',true).eq('subject_type','subject').order('code');if(error)throw error;return data as Subject[]},
  async classrooms(){const{data,error}=await supabase.from('classrooms').select('*').eq('active',true).order('name');if(error)throw error;return data as Classroom[]},
  async users(){const{data,error}=await supabase.from('profiles').select('*').order('created_at',{ascending:false});if(error)throw error;return data as Profile[]},
  async worksheets(admin=true){let q=supabase.from('worksheets').select('*,subjects(code,name),classrooms(name)').order('created_at',{ascending:false});if(!admin)q=q.eq('status','published');const{data,error}=await q;if(error)throw error;return data as unknown as Worksheet[]},
  async submissions(){const{data,error}=await supabase.from('submissions').select('*,profiles(full_name,student_code,class_name),worksheets(*)').order('created_at',{ascending:false});if(error)throw error;return data as unknown as Submission[]},
  async grades(){const{data,error}=await supabase.from('submission_grades').select('*,submissions(*,profiles(full_name,student_code,class_name),worksheets(title,subjects(code,name)))').order('graded_at',{ascending:false});if(error)throw error;return data as unknown as Grade[]},
  async roomGroups(){return rpc<any[]>('admin_room_groups_v206')},
  async teacherAssignments(){return rpc<any[]>('my_teacher_assignments_v206')},
  async attendanceSessions(){return rpc<any[]>('staff_attendance_sessions_v206')},
  async examDashboard(){return rpc<{subjects:any[];exams:any[]}>('staff_exam_dashboard_v206')},
  async submissionQueue(){return rpc<any[]>('staff_submission_queue_v206')},
  async gradebook(subjectId:string){return rpc<any>('staff_subject_gradebook_v206',{p_subject_id:subjectId})},
  async teachingPlan(subjectId:string){return rpc<any>('staff_subject_teaching_plan_v220',{p_subject_id:subjectId})},
};
