-- DOC-FULL-NR V23.0 - staff worksheet workspace for Desktop/Tablet console
-- Adds scoped SECURITY DEFINER RPCs so teachers do not depend on admin-only table RLS.

create or replace function public.staff_worksheets_v23()
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare v_result jsonb;
begin
  if auth.uid() is null or not (private.is_admin(auth.uid()) or private.is_teacher(auth.uid())) then
    raise exception 'STAFF_REQUIRED';
  end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb)
  into v_result
  from (
    select w.*, s.code subject_code, s.name subject_name, c.name classroom_name
    from public.worksheets w
    join public.subjects s on s.id=w.subject_id
    left join public.classrooms c on c.id=w.classroom_id
    where private.is_admin(auth.uid()) or private.can_teach_subject(w.subject_id,auth.uid())
  ) x;
  return v_result;
end;
$$;

create or replace function public.staff_save_worksheet_v23(
  p_worksheet_id uuid,
  p_subject_id uuid,
  p_classroom_id uuid,
  p_title text,
  p_description text,
  p_instructions text,
  p_mode text,
  p_open_at timestamptz,
  p_due_at timestamptz,
  p_questions jsonb,
  p_allow_draft boolean default true,
  p_allow_late boolean default false,
  p_allow_resubmit boolean default false,
  p_max_attempts integer default 1,
  p_copy_paste_allowed boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_uid uuid:=auth.uid();
  v_old public.worksheets%rowtype;
  v_new public.worksheets%rowtype;
  v_title text:=nullif(trim(coalesce(p_title,'')),'');
begin
  if v_uid is null or not (private.is_admin(v_uid) or private.is_teacher(v_uid)) then raise exception 'STAFF_REQUIRED'; end if;
  if p_subject_id is null or not private.can_teach_subject(p_subject_id,v_uid) then raise exception 'TEACHER_SCOPE_REQUIRED'; end if;
  if v_title is null then raise exception 'WORKSHEET_TITLE_REQUIRED'; end if;
  if p_mode not in ('digital','paper') then raise exception 'INVALID_WORKSHEET_MODE'; end if;
  if coalesce(p_max_attempts,0)<1 then raise exception 'INVALID_MAX_ATTEMPTS'; end if;
  if p_classroom_id is not null and not (private.is_admin(v_uid) or private.can_teach_attendance(p_classroom_id,p_subject_id,v_uid)) then
    raise exception 'CLASSROOM_SCOPE_REQUIRED';
  end if;
  if p_due_at is not null and p_open_at is not null and p_due_at<=p_open_at then raise exception 'INVALID_SCHEDULE'; end if;

  if p_worksheet_id is null then
    insert into public.worksheets(subject_id,classroom_id,title,description,instructions,mode,status,questions,open_at,due_at,
      allow_draft,allow_late,allow_resubmit,max_attempts,copy_paste_allowed,created_by)
    values(p_subject_id,p_classroom_id,v_title,nullif(trim(p_description),''),nullif(trim(p_instructions),''),p_mode::public.worksheet_mode,
      'draft',coalesce(p_questions,'[]'::jsonb),p_open_at,p_due_at,coalesce(p_allow_draft,true),coalesce(p_allow_late,false),
      coalesce(p_allow_resubmit,false),p_max_attempts,coalesce(p_copy_paste_allowed,true),v_uid)
    returning * into v_new;
  else
    select * into v_old from public.worksheets where id=p_worksheet_id for update;
    if not found then raise exception 'WORKSHEET_NOT_FOUND'; end if;
    if not (private.is_admin(v_uid) or private.can_teach_subject(v_old.subject_id,v_uid)) then raise exception 'TEACHER_SCOPE_REQUIRED'; end if;
    update public.worksheets set
      subject_id=p_subject_id,classroom_id=p_classroom_id,title=v_title,description=nullif(trim(p_description),''),
      instructions=nullif(trim(p_instructions),''),mode=p_mode::public.worksheet_mode,questions=coalesce(p_questions,'[]'::jsonb),
      open_at=p_open_at,due_at=p_due_at,allow_draft=coalesce(p_allow_draft,true),allow_late=coalesce(p_allow_late,false),
      allow_resubmit=coalesce(p_allow_resubmit,false),max_attempts=p_max_attempts,copy_paste_allowed=coalesce(p_copy_paste_allowed,true),
      updated_at=clock_timestamp()
    where id=p_worksheet_id returning * into v_new;
  end if;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(v_uid,case when p_worksheet_id is null then 'STAFF_CREATE_WORKSHEET_V23' else 'STAFF_UPDATE_WORKSHEET_V23' end,
    'worksheet',v_new.id::text,jsonb_build_object('subject_id',v_new.subject_id,'classroom_id',v_new.classroom_id,'mode',v_new.mode));
  return jsonb_build_object('ok',true,'worksheet',to_jsonb(v_new));
end;
$$;

create or replace function public.staff_publish_worksheet_v23(
  p_worksheet_id uuid,
  p_open_at timestamptz,
  p_due_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_uid uuid:=auth.uid();
  w public.worksheets%rowtype;
  v_count int:=0;
begin
  if v_uid is null or not (private.is_admin(v_uid) or private.is_teacher(v_uid)) then raise exception 'STAFF_REQUIRED'; end if;
  select * into w from public.worksheets where id=p_worksheet_id for update;
  if not found then raise exception 'WORKSHEET_NOT_FOUND'; end if;
  if not (private.is_admin(v_uid) or private.can_teach_subject(w.subject_id,v_uid)) then raise exception 'TEACHER_SCOPE_REQUIRED'; end if;
  if p_open_at is null or p_due_at is null or p_due_at<=p_open_at then raise exception 'INVALID_SCHEDULE'; end if;

  update public.worksheets set status='published',open_at=p_open_at,due_at=p_due_at,
    published_at=coalesce(published_at,clock_timestamp()),
    reference_code=coalesce(reference_code,upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
    updated_at=clock_timestamp()
  where id=p_worksheet_id returning * into w;

  insert into public.worksheet_assignments(worksheet_id,user_id,assigned_by,assignment_source,subject_enrollment_id)
  select w.id,e.user_id,v_uid,'subject_enrollment',e.id
  from public.subject_enrollments e
  join public.profiles p on p.id=e.user_id
  where e.subject_id=w.subject_id and e.status='approved'
    and p.role='user' and p.active and p.approval_status='approved' and p.academic_status='studying'
    and (private.is_admin(v_uid) or private.can_teach_student_subject(w.subject_id,e.user_id,v_uid))
  on conflict(worksheet_id,user_id) do update
    set assignment_source='subject_enrollment',subject_enrollment_id=excluded.subject_enrollment_id;

  select count(*) into v_count from public.worksheet_assignments where worksheet_id=w.id;
  if v_count=0 then raise exception 'NO_TARGETS'; end if;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(v_uid,'STAFF_PUBLISH_WORKSHEET_V23','worksheet',w.id::text,jsonb_build_object('assigned_count',v_count,'open_at',p_open_at,'due_at',p_due_at));
  return jsonb_build_object('ok',true,'worksheet_id',w.id,'assigned_count',v_count,'open_at',p_open_at,'due_at',p_due_at);
end;
$$;

revoke all on function public.staff_worksheets_v23() from public;
revoke all on function public.staff_save_worksheet_v23(uuid,uuid,uuid,text,text,text,text,timestamptz,timestamptz,jsonb,boolean,boolean,boolean,integer,boolean) from public;
revoke all on function public.staff_publish_worksheet_v23(uuid,timestamptz,timestamptz) from public;
grant execute on function public.staff_worksheets_v23() to authenticated,service_role;
grant execute on function public.staff_save_worksheet_v23(uuid,uuid,uuid,text,text,text,text,timestamptz,timestamptz,jsonb,boolean,boolean,boolean,integer,boolean) to authenticated,service_role;
grant execute on function public.staff_publish_worksheet_v23(uuid,timestamptz,timestamptz) to authenticated,service_role;
notify pgrst,'reload schema';
