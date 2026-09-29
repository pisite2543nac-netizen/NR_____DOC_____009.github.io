-- DOC-FULL-NR V22.0 Production Recovery
-- Fixes production HTTP 403 on public.classrooms / attendance_sessions caused by
-- classrooms_read directly querying RPC-only teacher_teaching_assignments.
create or replace function private.can_read_classroom(
  p_classroom_id uuid,
  p_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select
    private.is_admin(p_user)
    or exists (
      select 1
      from public.teacher_teaching_assignments t
      where t.teacher_id = p_user
        and t.classroom_id = p_classroom_id
        and t.active
    )
    or (
      private.is_active_user(p_user)
      and exists (
        select 1
        from public.classroom_memberships m
        where m.classroom_id = p_classroom_id
          and m.user_id = p_user
          and m.active
      )
    );
$$;
revoke all on function private.can_read_classroom(uuid, uuid) from public;
grant execute on function private.can_read_classroom(uuid, uuid) to authenticated, service_role;
drop policy if exists classrooms_read on public.classrooms;
create policy classrooms_read on public.classrooms for select to authenticated
using (private.can_read_classroom(id, auth.uid()));
comment on function private.can_read_classroom(uuid, uuid)
is 'V22.0 classroom read authorization without direct RLS dependency on RPC-only teacher_teaching_assignments.';
notify pgrst, 'reload schema';
