-- DOC-FULL-NR V21.4
-- Completion layer: preserve V21.3.2 safe Room Group -> Classroom sync in source,
-- and provide one scoped Room Group report RPC for Admin/Teacher filtering.

create table if not exists public.admin_room_group_classroom_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.admin_room_groups(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  classroom_membership_id uuid references public.classroom_memberships(id) on delete set null,
  managed_membership boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique(group_id,classroom_id,user_id)
);
create index if not exists admin_room_group_classroom_members_group_idx
  on public.admin_room_group_classroom_members(group_id,active);
create index if not exists admin_room_group_classroom_members_lookup_idx
  on public.admin_room_group_classroom_members(classroom_id,user_id,active);
alter table public.admin_room_group_classroom_members enable row level security;
revoke all on public.admin_room_group_classroom_members from anon,authenticated;
drop policy if exists admin_room_group_classroom_members_rpc_only_deny on public.admin_room_group_classroom_members;
create policy admin_room_group_classroom_members_rpc_only_deny
  on public.admin_room_group_classroom_members for all to authenticated using(false) with check(false);

-- Safe sync semantics:
-- * explicit classroom links never rename/rewrite classroom identity
-- * only classroom memberships created by this Room Group may be auto-deactivated
-- * manual memberships/history are preserved
-- * dynamic subject binding remains authoritative and historical work/exams are preserved
create or replace function private.sync_admin_room_group_v206(p_group_id uuid,p_actor uuid default auth.uid())
returns jsonb language plpgsql security definer set search_path='public','private','pg_temp' as $$
declare
  g public.admin_room_groups%rowtype;
  v_class uuid;
  v_binding record;
  v_user record;
  v_track public.admin_room_group_classroom_members%rowtype;
  v_subject_track record;
  v_se public.subject_enrollments%rowtype;
  v_cmid uuid;
  v_created_membership boolean;
  v_count int:=0;
  v_withdrawn int:=0;
  v_classroom_deactivated int:=0;
begin
  select * into g from public.admin_room_groups where id=p_group_id for update;
  if not found then raise exception 'ROOM_GROUP_NOT_FOUND'; end if;

  if g.classroom_id is null and g.active then
    select c.id into v_class
    from public.classrooms c
    where c.name=g.name
      and coalesce(c.academic_year,'')=coalesce(g.academic_year,'')
      and coalesce(c.semester,'')=coalesce(g.semester,'')
    limit 1;
    if v_class is null then
      insert into public.classrooms(name,level,academic_year,semester,active,description)
      values(g.name,g.level,g.academic_year,g.semester,true,'สร้างจาก Admin Room Group '||g.code||' • V21.4')
      returning id into v_class;
    end if;
    update public.admin_room_groups set classroom_id=v_class,updated_at=clock_timestamp() where id=g.id;
    g.classroom_id:=v_class;
  end if;

  if g.classroom_id is not null then
    if not exists(select 1 from public.classrooms where id=g.classroom_id) then
      raise exception 'LINKED_CLASSROOM_NOT_FOUND';
    end if;

    for v_track in
      select * from public.admin_room_group_classroom_members
      where group_id=g.id and active and classroom_id<>g.classroom_id
      for update
    loop
      update public.admin_room_group_classroom_members
      set active=false,updated_at=clock_timestamp() where id=v_track.id;
      if v_track.managed_membership and v_track.classroom_membership_id is not null
         and not exists(
           select 1 from public.admin_room_group_classroom_members other_t
           where other_t.classroom_id=v_track.classroom_id and other_t.user_id=v_track.user_id
             and other_t.active and other_t.id<>v_track.id
         ) then
        update public.classroom_memberships set active=false where id=v_track.classroom_membership_id;
        v_classroom_deactivated:=v_classroom_deactivated+1;
      end if;
    end loop;

    if g.active then
      for v_user in
        select m.user_id,m.seat_number from public.admin_room_group_members m
        where m.group_id=g.id and m.active
      loop
        v_cmid:=null;v_created_membership:=false;
        select cm.id into v_cmid from public.classroom_memberships cm
        where cm.classroom_id=g.classroom_id and cm.user_id=v_user.user_id limit 1 for update;
        if v_cmid is null then
          insert into public.classroom_memberships(classroom_id,user_id,seat_number,active)
          values(g.classroom_id,v_user.user_id,v_user.seat_number,true) returning id into v_cmid;
          v_created_membership:=true;
        else
          update public.classroom_memberships set active=true,seat_number=v_user.seat_number where id=v_cmid;
        end if;
        insert into public.admin_room_group_classroom_members(
          group_id,classroom_id,user_id,classroom_membership_id,managed_membership,active
        ) values(g.id,g.classroom_id,v_user.user_id,v_cmid,v_created_membership,true)
        on conflict(group_id,classroom_id,user_id) do update
        set classroom_membership_id=excluded.classroom_membership_id,
            managed_membership=public.admin_room_group_classroom_members.managed_membership or excluded.managed_membership,
            active=true,updated_at=clock_timestamp();
        v_count:=v_count+1;
      end loop;
    end if;

    for v_track in
      select * from public.admin_room_group_classroom_members t
      where t.group_id=g.id and t.classroom_id=g.classroom_id and t.active
        and (not g.active or not exists(
          select 1 from public.admin_room_group_members m
          where m.group_id=g.id and m.user_id=t.user_id and m.active
        )) for update
    loop
      update public.admin_room_group_classroom_members set active=false,updated_at=clock_timestamp() where id=v_track.id;
      if v_track.managed_membership and v_track.classroom_membership_id is not null
         and not exists(
           select 1 from public.admin_room_group_classroom_members other_t
           where other_t.classroom_id=v_track.classroom_id and other_t.user_id=v_track.user_id
             and other_t.active and other_t.id<>v_track.id
         ) then
        update public.classroom_memberships set active=false where id=v_track.classroom_membership_id;
        v_classroom_deactivated:=v_classroom_deactivated+1;
      end if;
    end loop;
  end if;

  for v_binding in select b.* from public.admin_room_group_subjects b where b.group_id=g.id loop
    if v_binding.active and g.active then
      for v_user in
        select m.user_id from public.admin_room_group_members m
        join public.profiles p on p.id=m.user_id
        where m.group_id=g.id and m.active and p.role='user' and p.active and p.approval_status='approved'
      loop
        select * into v_se from public.subject_enrollments
        where subject_id=v_binding.subject_id and user_id=v_user.user_id for update;
        if v_se.id is null then
          insert into public.subject_enrollments(subject_id,user_id,status,requested_at,decided_at,decided_by,note,updated_at)
          values(v_binding.subject_id,v_user.user_id,'approved',clock_timestamp(),clock_timestamp(),p_actor,'V20.6 room-group managed enrollment',clock_timestamp())
          returning * into v_se;
          insert into public.admin_room_group_subject_members(binding_id,user_id,enrollment_id,managed_enrollment,active)
          values(v_binding.id,v_user.user_id,v_se.id,true,true)
          on conflict(binding_id,user_id) do update
          set enrollment_id=excluded.enrollment_id,managed_enrollment=true,active=true,updated_at=clock_timestamp();
        else
          if v_se.status<>'approved' then
            update public.subject_enrollments set status='approved',decided_at=clock_timestamp(),decided_by=p_actor,updated_at=clock_timestamp()
            where id=v_se.id returning * into v_se;
          end if;
          insert into public.admin_room_group_subject_members(binding_id,user_id,enrollment_id,managed_enrollment,active)
          values(v_binding.id,v_user.user_id,v_se.id,false,true)
          on conflict(binding_id,user_id) do update
          set enrollment_id=excluded.enrollment_id,active=true,updated_at=clock_timestamp();
        end if;
        insert into public.worksheet_assignments(worksheet_id,user_id,assigned_by,assignment_source,subject_enrollment_id)
        select w.id,v_user.user_id,p_actor,'subject_enrollment',v_se.id
        from public.worksheets w where w.subject_id=v_binding.subject_id and w.status='published'
        on conflict(worksheet_id,user_id) do update
        set assignment_source='subject_enrollment',subject_enrollment_id=excluded.subject_enrollment_id;
        insert into public.exam_assignments(exam_id,user_id,assigned_by,assignment_source,subject_enrollment_id)
        select e.id,v_user.user_id,p_actor,'subject_enrollment',v_se.id
        from public.exams e where e.subject_id=v_binding.subject_id and e.status='published'
        on conflict(exam_id,user_id) do update
        set assignment_source='subject_enrollment',subject_enrollment_id=excluded.subject_enrollment_id;
      end loop;
    end if;

    for v_subject_track in
      select sm.* from public.admin_room_group_subject_members sm
      where sm.binding_id=v_binding.id and sm.active
        and (not g.active or not v_binding.active or not exists(
          select 1 from public.admin_room_group_members m
          where m.group_id=g.id and m.user_id=sm.user_id and m.active
        )) for update
    loop
      update public.admin_room_group_subject_members set active=false,updated_at=clock_timestamp() where id=v_subject_track.id;
      if v_subject_track.managed_enrollment and v_subject_track.enrollment_id is not null
         and not exists(
           select 1 from public.admin_room_group_subject_members other_sm
           join public.admin_room_group_subjects other_b on other_b.id=other_sm.binding_id
           join public.admin_room_groups other_g on other_g.id=other_b.group_id
           where other_sm.enrollment_id=v_subject_track.enrollment_id and other_sm.user_id=v_subject_track.user_id
             and other_sm.active and other_b.active and other_g.active and other_sm.id<>v_subject_track.id
         )
         and exists(
           select 1 from public.subject_enrollments se where se.id=v_subject_track.enrollment_id
             and se.status='approved' and coalesce(se.note,'') like 'V20.6 room-group managed enrollment%'
         ) then
        update public.subject_enrollments
        set status='withdrawn',decided_at=clock_timestamp(),decided_by=p_actor,
            note='V21.4 room-group auto-withdrawn (membership/binding/group inactive)',updated_at=clock_timestamp()
        where id=v_subject_track.enrollment_id;
        delete from public.worksheet_assignments a using public.worksheets w
        where a.worksheet_id=w.id and w.subject_id=v_binding.subject_id and a.user_id=v_subject_track.user_id
          and a.subject_enrollment_id=v_subject_track.enrollment_id
          and not exists(select 1 from public.submissions s where s.worksheet_id=a.worksheet_id and s.user_id=v_subject_track.user_id);
        update public.worksheet_assignments a set assignment_source='subject_history',subject_enrollment_id=null
        from public.worksheets w where a.worksheet_id=w.id and w.subject_id=v_binding.subject_id
          and a.user_id=v_subject_track.user_id and a.subject_enrollment_id=v_subject_track.enrollment_id;
        delete from public.exam_assignments a using public.exams e
        where a.exam_id=e.id and e.subject_id=v_binding.subject_id and a.user_id=v_subject_track.user_id
          and a.subject_enrollment_id=v_subject_track.enrollment_id
          and not exists(select 1 from public.exam_attempts t where t.exam_id=a.exam_id and t.user_id=v_subject_track.user_id);
        update public.exam_assignments a set assignment_source='subject_history',subject_enrollment_id=null
        from public.exams e where a.exam_id=e.id and e.subject_id=v_binding.subject_id
          and a.user_id=v_subject_track.user_id and a.subject_enrollment_id=v_subject_track.enrollment_id;
        v_withdrawn:=v_withdrawn+1;
      end if;
    end loop;
  end loop;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(p_actor,'SYNC_ADMIN_ROOM_GROUP_V214','admin_room_group',g.id::text,
    jsonb_build_object('classroom_id',g.classroom_id,'group_active',g.active,'synced_members',v_count,
      'auto_withdrawn',v_withdrawn,'classroom_memberships_deactivated',v_classroom_deactivated,
      'preserve_linked_classroom_identity',true));
  return jsonb_build_object('ok',true,'group_id',g.id,'classroom_id',g.classroom_id,'group_active',g.active,
    'synced_members',v_count,'auto_withdrawn',v_withdrawn,'classroom_memberships_deactivated',v_classroom_deactivated,
    'preserve_linked_classroom_identity',true);
end $$;

create or replace function public.staff_room_group_report_v214(p_group_id uuid,p_subject_id uuid default null)
returns jsonb language plpgsql security definer set search_path='public','private','pg_temp' as $$
declare
  v_uid uuid:=auth.uid();
  g public.admin_room_groups%rowtype;
  v_members jsonb:='[]'::jsonb;
  v_bindings jsonb:='[]'::jsonb;
  v_grade jsonb:='{}'::jsonb;
  v_grade_rows jsonb:='[]'::jsonb;
  v_attendance jsonb:='[]'::jsonb;
  v_exams jsonb:='[]'::jsonb;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not(private.is_admin(v_uid) or private.is_teacher(v_uid)) then raise exception 'STAFF_REQUIRED'; end if;
  select * into g from public.admin_room_groups where id=p_group_id and active;
  if not found then raise exception 'ROOM_GROUP_NOT_FOUND'; end if;

  if private.is_teacher(v_uid) then
    if g.classroom_id is null then raise exception 'ROOM_GROUP_CLASSROOM_REQUIRED'; end if;
    if p_subject_id is not null and not private.can_teach_attendance(g.classroom_id,p_subject_id,v_uid) then
      raise exception 'TEACHER_SCOPE_REQUIRED';
    end if;
    if p_subject_id is null and not exists(
      select 1 from public.teacher_teaching_assignments t
      where t.teacher_id=v_uid and t.classroom_id=g.classroom_id and t.active
    ) then raise exception 'TEACHER_SCOPE_REQUIRED'; end if;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id',p.id,'student_code',p.student_code,'full_name',p.full_name,'display_name',p.display_name,
    'grade_level',p.grade_level,'room_label',p.room_label,'class_name',p.class_name,
    'department',p.department,'major',p.major,'seat_number',m.seat_number
  ) order by m.seat_number nulls last,p.student_code,p.full_name),'[]'::jsonb)
  into v_members
  from public.admin_room_group_members m join public.profiles p on p.id=m.user_id
  where m.group_id=g.id and m.active and p.active and p.role='user';

  select coalesce(jsonb_agg(jsonb_build_object(
    'subject_id',s.id,'subject_code',s.code,'subject_name',s.name,'active',b.active
  ) order by s.code),'[]'::jsonb)
  into v_bindings
  from public.admin_room_group_subjects b join public.subjects s on s.id=b.subject_id
  where b.group_id=g.id and b.active
    and (private.is_admin(v_uid) or exists(
      select 1 from public.teacher_teaching_assignments t
      where t.teacher_id=v_uid and t.subject_id=s.id and t.classroom_id=g.classroom_id and t.active
    ));

  if p_subject_id is not null then
    if not exists(select 1 from public.subjects where id=p_subject_id and active and subject_type='subject') then
      raise exception 'SUBJECT_NOT_FOUND';
    end if;
    if not private.is_admin(v_uid) and not private.can_teach_subject(p_subject_id,v_uid) then raise exception 'TEACHER_SCOPE_REQUIRED'; end if;

    v_grade:=public.staff_subject_gradebook_v206(p_subject_id);
    select coalesce(jsonb_agg(x.value),'[]'::jsonb) into v_grade_rows
    from jsonb_array_elements(coalesce(v_grade->'rows','[]'::jsonb)) x
    where exists(
      select 1 from public.admin_room_group_members m
      where m.group_id=g.id and m.active and m.user_id=(x.value->>'user_id')::uuid
    );

    select coalesce(jsonb_agg(to_jsonb(a) order by a.seat_number nulls last,a.student_code),'[]'::jsonb)
    into v_attendance
    from (
      select p.id user_id,p.student_code,p.full_name,m.seat_number,
        count(distinct s.id) total_sessions,
        count(r.id) filter(where r.status='present') present_count,
        count(r.id) filter(where r.status='late') late_count,
        count(r.id) filter(where r.status='absent') absent_count,
        count(r.id) filter(where r.status='excused') excused_count,
        round(case when count(distinct s.id)=0 then 0 else
          (100.0*(count(r.id) filter(where r.status in ('present','late','excused')))/count(distinct s.id)) end,2) attendance_percent
      from public.admin_room_group_members m
      join public.profiles p on p.id=m.user_id
      left join public.attendance_sessions s on s.classroom_id=g.classroom_id and s.subject_id=p_subject_id and s.status='closed'
      left join public.attendance_records r on r.session_id=s.id and r.user_id=m.user_id
      where m.group_id=g.id and m.active
      group by p.id,p.student_code,p.full_name,m.seat_number
    ) a;

    select coalesce(jsonb_agg(jsonb_build_object(
      'exam_id',e.id,'title',e.title,'exam_kind',e.exam_kind,'status',e.status,'full_score',e.full_score,
      'attempt_count',(select count(*) from public.exam_attempts t where t.exam_id=e.id and exists(
        select 1 from public.admin_room_group_members m where m.group_id=g.id and m.active and m.user_id=t.user_id
      )),
      'submitted_count',(select count(*) from public.exam_attempts t where t.exam_id=e.id and t.status in ('submitted','graded') and exists(
        select 1 from public.admin_room_group_members m where m.group_id=g.id and m.active and m.user_id=t.user_id
      ))
    ) order by e.created_at desc),'[]'::jsonb)
    into v_exams
    from public.exams e where e.subject_id=p_subject_id;
  end if;

  return jsonb_build_object(
    'ok',true,
    'group',jsonb_build_object('id',g.id,'code',g.code,'name',g.name,'classroom_id',g.classroom_id,
      'academic_year',g.academic_year,'semester',g.semester,'level',g.level,'department',g.department,'major',g.major),
    'bindings',v_bindings,'members',v_members,
    'subject_id',p_subject_id,'grade_rows',v_grade_rows,'attendance_rows',v_attendance,'exams',v_exams,
    'server_time',clock_timestamp()
  );
end $$;

revoke all on function public.staff_room_group_report_v214(uuid,uuid) from public,anon;
grant execute on function public.staff_room_group_report_v214(uuid,uuid) to authenticated;

comment on function public.staff_room_group_report_v214(uuid,uuid) is
'V21.4 scoped Room Group report: members, gradebook subset, attendance and exam summary for Admin/assigned Teacher.';
