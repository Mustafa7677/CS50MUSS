-- QazaqCode Platform: 0006 - мектеп әкімшісі өшірілген (removed) мүшелердің де атын көреді.
create or replace function public.can_view_profile(p_target uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select p_target = auth.uid()
    or exists (select 1 from public.organization_members t
               join public.organization_members me on me.org_id = t.org_id and me.user_id = auth.uid() and me.status = 'active' and me.role = 'school_admin'
               where t.user_id = p_target)
    or exists (select 1 from public.classroom_students cs join public.classrooms c on c.id = cs.classroom_id
               where cs.student_id = p_target and c.teacher_id = auth.uid())
    or exists (select 1 from public.classroom_students cs join public.classrooms c on c.id = cs.classroom_id
               where c.teacher_id = p_target and cs.student_id = auth.uid() and cs.status = 'active')
$$;
grant execute on function public.can_view_profile(uuid) to authenticated;
