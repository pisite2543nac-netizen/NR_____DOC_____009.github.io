-- CLEAN V1.5.1 — Fixed 100-point rubric
-- งาน 40 + กลางภาค 20 + ปลายภาค 20 + จิตพิสัย 20
-- จิตพิสัย = ส่งงานครบตรงเวลาอัตโนมัติ 10 + ครูประเมิน 10

alter table public.clean_behavior_scores
  add column if not exists teacher_score numeric not null default 0,
  add column if not exists teacher_note text,
  add column if not exists teacher_scored_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.clean_behavior_scores'::regclass
      and conname='clean_behavior_scores_teacher_score_check'
  ) then
    alter table public.clean_behavior_scores
      add constraint clean_behavior_scores_teacher_score_check
      check (teacher_score >= 0 and teacher_score <= 10);
  end if;
end $$;

alter table public.clean_behavior_scores alter column score set default 0;

update public.clean_grade_settings
set worksheet_weight=40,
    behavior_weight=20,
    midterm_weight=20,
    final_weight=20,
    default_behavior_score=0,
    updated_at=clock_timestamp();

alter table public.clean_grade_settings alter column worksheet_weight set default 40;
alter table public.clean_grade_settings alter column behavior_weight set default 20;
alter table public.clean_grade_settings alter column midterm_weight set default 20;
alter table public.clean_grade_settings alter column final_weight set default 20;
alter table public.clean_grade_settings alter column default_behavior_score set default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.clean_grade_settings'::regclass
      and conname='clean_grade_settings_fixed_40_20_20_20'
  ) then
    alter table public.clean_grade_settings
      add constraint clean_grade_settings_fixed_40_20_20_20
      check (
        worksheet_weight=40 and behavior_weight=20 and
        midterm_weight=20 and final_weight=20
      );
  end if;
end $$;

create or replace function public.clean_behavior_teacher_set(
  p_subject_id uuid,
  p_student_id uuid,
  p_score numeric,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','private','pg_temp'
as $$
declare
  v_row public.clean_behavior_scores%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not private.clean_can_teach_student(p_subject_id,p_student_id) then
    raise exception 'TEACHER_SCOPE_REQUIRED';
  end if;
  if p_score is null or p_score < 0 or p_score > 10 then
    raise exception 'TEACHER_BEHAVIOR_SCORE_0_TO_10';
  end if;

  insert into public.clean_behavior_scores(
    subject_id,student_id,score,teacher_score,teacher_note,
    teacher_scored_at,updated_by,updated_at
  ) values (
    p_subject_id,p_student_id,p_score,p_score,nullif(trim(p_note),''),
    clock_timestamp(),auth.uid(),clock_timestamp()
  )
  on conflict(subject_id,student_id) do update
  set score=excluded.score,
      teacher_score=excluded.teacher_score,
      teacher_note=excluded.teacher_note,
      teacher_scored_at=excluded.teacher_scored_at,
      updated_by=excluded.updated_by,
      updated_at=excluded.updated_at
  returning * into v_row;

  insert into public.clean_audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    auth.uid(),'BEHAVIOR_TEACHER_SCORE','student_subject',p_student_id::text,
    jsonb_build_object(
      'subject_id',p_subject_id,
      'student_id',p_student_id,
      'teacher_score',p_score,
      'teacher_note',nullif(trim(p_note),'')
    )
  );

  return jsonb_build_object(
    'ok',true,
    'subject_id',v_row.subject_id,
    'student_id',v_row.student_id,
    'teacher_score',v_row.teacher_score,
    'teacher_note',v_row.teacher_note,
    'teacher_scored_at',v_row.teacher_scored_at
  );
end $$;

revoke all on function public.clean_behavior_teacher_set(uuid,uuid,numeric,text) from public;
revoke all on function public.clean_behavior_teacher_set(uuid,uuid,numeric,text) from anon;
grant execute on function public.clean_behavior_teacher_set(uuid,uuid,numeric,text) to authenticated, service_role;

create or replace function private.clean_gradebook_core(
  p_subject_id uuid,
  p_learning_group_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','private','pg_temp'
as $$
declare
  gs public.clean_grade_settings%rowtype;
  v jsonb;
begin
  if not private.clean_can_teach_subject(p_subject_id) then
    raise exception 'TEACHER_SCOPE_REQUIRED';
  end if;

  select * into gs from public.clean_grade_settings where subject_id=p_subject_id;
  if not found then
    insert into public.clean_grade_settings(
      subject_id,worksheet_weight,behavior_weight,midterm_weight,final_weight,default_behavior_score
    ) values (p_subject_id,40,20,20,20,0)
    returning * into gs;
  end if;

  with students as (
    select e.student_id,p.student_code,p.full_name,o.plan_code group_code
    from public.clean_subject_enrollments e
    join public.clean_profiles p on p.id=e.student_id
    left join public.clean_subject_offerings o on o.id=e.offering_id
    where e.subject_id=p_subject_id and e.status='approved'
      and (p_learning_group_id is null or o.learning_group_id=p_learning_group_id)
  ), assigned_items as (
    select distinct st.student_id,a.worksheet_id,w.due_at
    from students st
    join public.clean_worksheet_assignments a on a.student_id=st.student_id
    join public.clean_worksheets w on w.id=a.worksheet_id
      and w.subject_id=p_subject_id
      and not w.is_unit_template
  ), assigned as (
    select st.student_id,count(ai.worksheet_id) worksheet_assigned
    from students st
    left join assigned_items ai on ai.student_id=st.student_id
    group by st.student_id
  ), latest_graded as (
    select distinct on (z.student_id,z.worksheet_id)
           z.student_id,z.worksheet_id,g.score,g.max_score
    from public.clean_submissions z
    join public.clean_worksheets w on w.id=z.worksheet_id
      and w.subject_id=p_subject_id
      and not w.is_unit_template
    join public.clean_submission_grades g on g.submission_id=z.id
    join students st on st.student_id=z.student_id
    order by z.student_id,z.worksheet_id,z.attempt_no desc,g.graded_at desc
  ), ws as (
    select st.student_id,
      case when count(ai.worksheet_id)>0 then
        coalesce(sum(
          case when lg.max_score>0 then least(1,greatest(0,lg.score/lg.max_score)) else 0 end
        ),0) / count(ai.worksheet_id)::numeric * 100
      else 0 end pct,
      count(lg.worksheet_id) worksheet_graded
    from students st
    left join assigned_items ai on ai.student_id=st.student_id
    left join latest_graded lg on lg.student_id=ai.student_id and lg.worksheet_id=ai.worksheet_id
    group by st.student_id
  ), submitted as (
    select st.student_id,
      count(ai.worksheet_id) filter (
        where exists (
          select 1 from public.clean_submissions z
          where z.student_id=st.student_id
            and z.worksheet_id=ai.worksheet_id
            and z.status in ('submitted','graded')
            and z.submitted_at is not null
        )
      ) worksheet_submitted,
      count(ai.worksheet_id) filter (
        where ai.due_at is not null
          and exists (
            select 1 from public.clean_submissions z
            where z.student_id=st.student_id
              and z.worksheet_id=ai.worksheet_id
              and z.status in ('submitted','graded')
              and z.submitted_at is not null
              and z.submitted_at <= ai.due_at
          )
      ) worksheet_ontime
    from students st
    left join assigned_items ai on ai.student_id=st.student_id
    group by st.student_id
  ), ex as (
    select st.student_id,
      coalesce(max(case when e.exam_type='midterm' and a.grading_status='final' and a.max_score>0 then a.score/a.max_score*100 end),0) mid_pct,
      coalesce(max(case when e.exam_type='final' and a.grading_status='final' and a.max_score>0 then a.score/a.max_score*100 end),0) final_pct
    from students st
    left join public.clean_exam_attempts a on a.student_id=st.student_id
    left join public.clean_exams e on e.id=a.exam_id and e.subject_id=p_subject_id
    group by st.student_id
  ), rows as (
    select st.student_id,st.student_code,st.full_name,st.group_code,
      coalesce(a.worksheet_assigned,0) worksheet_assigned,
      coalesce(sub.worksheet_submitted,0) worksheet_submitted,
      coalesce(sub.worksheet_ontime,0) worksheet_ontime,
      coalesce(ws.worksheet_graded,0) worksheet_graded,
      round(coalesce(ws.pct,0)*40/100,2) worksheet_score,
      case
        when coalesce(a.worksheet_assigned,0)>0
         and coalesce(sub.worksheet_ontime,0)=coalesce(a.worksheet_assigned,0)
        then 10::numeric else 0::numeric
      end punctuality_score,
      round(least(10,greatest(0,coalesce(bs.teacher_score,0))),2) teacher_behavior_score,
      bs.teacher_note teacher_behavior_note,
      bs.teacher_scored_at,
      round(coalesce(ex.mid_pct,0)*20/100,2) midterm_score,
      round(coalesce(ex.final_pct,0)*20/100,2) final_score
    from students st
    left join assigned a on a.student_id=st.student_id
    left join submitted sub on sub.student_id=st.student_id
    left join ws on ws.student_id=st.student_id
    left join ex on ex.student_id=st.student_id
    left join public.clean_behavior_scores bs on bs.subject_id=p_subject_id and bs.student_id=st.student_id
  ), behavior_rows as (
    select r.*,
      round(r.punctuality_score+r.teacher_behavior_score,2) behavior_score
    from rows r
  ), totals as (
    select r.*,
      round(r.worksheet_score+r.behavior_score+r.midterm_score+r.final_score,2) total_score
    from behavior_rows r
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'student_id',student_id,
    'student_code',student_code,
    'full_name',full_name,
    'group_code',group_code,
    'worksheet_assigned',worksheet_assigned,
    'worksheet_submitted',worksheet_submitted,
    'worksheet_ontime',worksheet_ontime,
    'worksheet_graded',worksheet_graded,
    'worksheet_score',worksheet_score,
    'punctuality_score',punctuality_score,
    'teacher_behavior_score',teacher_behavior_score,
    'teacher_behavior_note',teacher_behavior_note,
    'teacher_scored_at',teacher_scored_at,
    'behavior_score',behavior_score,
    'midterm_score',midterm_score,
    'final_score',final_score,
    'total_score',total_score,
    'grade',case when total_score>=80 then '4.0' when total_score>=75 then '3.5' when total_score>=70 then '3.0'
                 when total_score>=65 then '2.5' when total_score>=60 then '2.0' when total_score>=55 then '1.5'
                 when total_score>=50 then '1.0' else '0' end,
    'pass_status',case when total_score>=50 then 'ผ่าน' else 'ไม่ผ่าน' end
  ) order by student_code nulls last,full_name),'[]'::jsonb)
  into v from totals;

  return jsonb_build_object(
    'rows',v,
    'settings',jsonb_build_object(
      'worksheet_weight',40,
      'midterm_weight',20,
      'final_weight',20,
      'behavior_weight',20,
      'punctuality_weight',10,
      'teacher_behavior_weight',10,
      'punctuality_rule','ส่งงานที่ได้รับครบทุกชิ้นและไม่เกินกำหนดทุกชิ้นจึงได้ 10 คะแนน'
    )
  );
end $$;

-- Students must not read behavior scores directly. Staff access remains through scoped RPCs.
drop policy if exists clean_behavior_read on public.clean_behavior_scores;
create policy clean_behavior_staff_read on public.clean_behavior_scores
for select to authenticated
using (private.clean_is_admin() or private.clean_can_teach_student(subject_id,student_id));

comment on column public.clean_behavior_scores.teacher_score is 'คะแนนจิตพิสัยส่วนครูประเมิน 0-10';
comment on column public.clean_behavior_scores.teacher_note is 'หมายเหตุประกอบคะแนนจิตพิสัยจากครู';
comment on function public.clean_behavior_teacher_set(uuid,uuid,numeric,text) is 'ครู/Admin ให้คะแนนจิตพิสัยส่วนครู 0-10 ตามขอบเขตรายวิชา';
