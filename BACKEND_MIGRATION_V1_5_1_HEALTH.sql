-- CLEAN V1.5.1 health/acceptance metadata
-- Production migration name: clean_v15_1_health_score_rubric
-- Recreates health metadata for the fixed 100-point rubric.

create or replace function public.clean_health()
returns jsonb
language plpgsql
security definer
set search_path to 'public','private','pg_temp'
as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  return jsonb_build_object(
    'ok',true,
    'version','1.5.1',
    'build','CLEAN-V1.5.1-SCORE-RUBRIC-40-20-20-20-SEM2-2569',
    'user_id',auth.uid(),
    'role',private.clean_profile_role(),
    'server_time',clock_timestamp(),
    'attendance_runtime',false,
    'qr_runtime',false,
    'classroom_presence_runtime',true,
    'worksheet_presence_gate',true,
    'secure_exam_runtime',true,
    'term_exam_questions',50,
    'term_exam_content_questions',25,
    'term_exam_analysis_questions',25,
    'term_exam_score',20,
    'grade_total',100,
    'worksheet_grade_weight',40,
    'midterm_grade_weight',20,
    'final_grade_weight',20,
    'behavior_grade_weight',20,
    'behavior_punctuality_weight',10,
    'behavior_teacher_weight',10,
    'behavior_punctuality_rule','all-assigned-worksheets-submitted-on-or-before-due-date',
    'learning_group_model','one-student-one-group-many-subjects',
    'student_score_visibility',false,
    'teacher_behavior_manual_scoring',true
  );
end $$;

-- The complete production clean_system_acceptance() keeps all V1.5 checks and adds:
-- 1) 13/13 clean_grade_settings rows fixed to 40/20/20/20 with default_behavior_score=0
-- 2) teacher_score/teacher_note/teacher_scored_at columns
-- 3) clean_behavior_teacher_set RPC presence
-- 4) build marker CLEAN-V1.5.1-SCORE-RUBRIC-40-20-20-20-SEM2-2569
