-- QazaqCode Platform: 0004 - нақты деректерге негізделген аналитика.
-- Функциялар SECURITY INVOKER: RLS автоматты түрде қолданылады, ешкім өзі көре алмайтын деректі есептемейді.

create or replace function public.org_overview(p_org uuid) returns jsonb
language plpgsql stable security invoker set search_path = public, pg_temp as $$
declare r jsonb;
begin
  if not public.is_org_admin(p_org) then raise exception 'forbidden'; end if;
  select jsonb_build_object(
    'students', (select count(*) from public.organization_members where org_id = p_org and role = 'student' and status = 'active'),
    'active_students_30d', (select count(distinct student_id) from public.submissions where org_id = p_org and updated_at > now() - interval '30 days'),
    'teachers', (select count(*) from public.organization_members where org_id = p_org and role = 'teacher' and status = 'active'),
    'classes', (select count(*) from public.classrooms where org_id = p_org and status = 'active'),
    'assignments_published', (select count(*) from public.assignments where org_id = p_org and status = 'published'),
    -- күтілетін орындаулар: жарияланған тапсырма x сыныптағы белсенді оқушы
    'expected_completions', (select count(*) from public.assignments a join public.assignment_targets t on t.assignment_id = a.id
                             join public.classroom_students cs on cs.classroom_id = t.classroom_id and cs.status = 'active'
                             where a.org_id = p_org and a.status = 'published'),
    'completed', (select count(*) from (select distinct s.assignment_id, s.student_id from public.submissions s
                  where s.org_id = p_org and s.status <> 'draft') x),
    'graded', (select count(*) from public.submissions where org_id = p_org and status = 'graded'),
    'pending_review', (select count(*) from public.submissions where org_id = p_org and status in ('submitted', 'under_review')),
    'avg_score_pct', (select round(avg(b.pct), 1) from (
        select distinct on (g.assignment_id, g.student_id) g.score / g.max_score * 100 as pct
        from public.grades g where g.org_id = p_org order by g.assignment_id, g.student_id, g.score desc) b)
  ) into r;
  return r;
end $$;

create or replace function public.activity_series(p_org uuid, p_days integer default 30)
returns table (day date, submissions bigint, active_students bigint)
language plpgsql stable security invoker set search_path = public, pg_temp as $$
begin
  if not public.is_org_admin(p_org) then raise exception 'forbidden'; end if;
  if p_days < 1 or p_days > 366 then raise exception 'invalid_range'; end if;
  return query
  select d::date,
         (select count(*) from public.submissions s where s.org_id = p_org and s.submitted_at::date = d::date),
         (select count(distinct s.student_id) from public.submissions s where s.org_id = p_org and s.updated_at::date = d::date)
  from generate_series(current_date - (p_days - 1), current_date, interval '1 day') d
  order by 1;
end $$;

-- Мұғалімнің сынып бойынша оқушылар кестесі
create or replace function public.class_students_overview(p_class uuid)
returns table (student_id uuid, full_name text, assigned bigint, submitted bigint, graded bigint, avg_pct numeric, attempts bigint, avg_seconds numeric, last_activity timestamptz)
language plpgsql stable security invoker set search_path = public, pg_temp as $$
begin
  if not (public.is_class_teacher(p_class) or exists (select 1 from public.classrooms c where c.id = p_class and public.is_org_admin(c.org_id))) then raise exception 'forbidden'; end if;
  return query
  select cs.student_id, p.full_name,
    (select count(*) from public.assignment_targets t join public.assignments a on a.id = t.assignment_id and a.status = 'published' where t.classroom_id = p_class),
    (select count(distinct s.assignment_id) from public.submissions s where s.classroom_id = p_class and s.student_id = cs.student_id and s.status <> 'draft'),
    (select count(distinct s.assignment_id) from public.submissions s where s.classroom_id = p_class and s.student_id = cs.student_id and s.status = 'graded'),
    (select round(avg(b.pct), 1) from (select distinct on (g.assignment_id) g.score / g.max_score * 100 as pct
       from public.grades g join public.submissions s on s.id = g.submission_id
       where s.classroom_id = p_class and g.student_id = cs.student_id order by g.assignment_id, g.score desc) b),
    (select count(*) from public.submissions s where s.classroom_id = p_class and s.student_id = cs.student_id and s.status <> 'draft'),
    (select round(avg(s.time_spent_seconds), 0) from public.submissions s where s.classroom_id = p_class and s.student_id = cs.student_id and s.status <> 'draft'),
    (select max(s.updated_at) from public.submissions s where s.classroom_id = p_class and s.student_id = cs.student_id)
  from public.classroom_students cs join public.profiles p on p.id = cs.student_id
  where cs.classroom_id = p_class and cs.status = 'active'
  order by p.full_name;
end $$;

-- Сыныптың тапсырмалар бойынша қысқаша статистикасы
create or replace function public.class_assignments_overview(p_class uuid)
returns table (assignment_id uuid, title text, kind public.assignment_kind, status public.assignment_status, deadline timestamptz, assigned bigint, submitted bigint, graded bigint, avg_pct numeric)
language plpgsql stable security invoker set search_path = public, pg_temp as $$
begin
  if not (public.is_class_teacher(p_class) or exists (select 1 from public.classrooms c where c.id = p_class and public.is_org_admin(c.org_id))) then raise exception 'forbidden'; end if;
  return query
  select a.id, a.title, a.kind, a.status, a.deadline,
    (select count(*) from public.classroom_students cs where cs.classroom_id = p_class and cs.status = 'active'),
    (select count(distinct s.student_id) from public.submissions s where s.assignment_id = a.id and s.classroom_id = p_class and s.status <> 'draft'),
    (select count(distinct s.student_id) from public.submissions s where s.assignment_id = a.id and s.classroom_id = p_class and s.status = 'graded'),
    (select round(avg(b.pct), 1) from (select distinct on (g.student_id) g.score / g.max_score * 100 as pct
       from public.grades g join public.submissions s on s.id = g.submission_id
       where g.assignment_id = a.id and s.classroom_id = p_class order by g.student_id, g.score desc) b)
  from public.assignment_targets t join public.assignments a on a.id = t.assignment_id
  where t.classroom_id = p_class order by a.created_at desc;
end $$;

-- Бағалар таралуы (4 аралық)
create or replace function public.class_grade_distribution(p_class uuid)
returns table (bucket text, students bigint)
language plpgsql stable security invoker set search_path = public, pg_temp as $$
begin
  if not (public.is_class_teacher(p_class) or exists (select 1 from public.classrooms c where c.id = p_class and public.is_org_admin(c.org_id))) then raise exception 'forbidden'; end if;
  return query
  with per as (select o.student_id, avg(o.pct) pct from (
      select distinct on (g.assignment_id, g.student_id) g.student_id, g.score / g.max_score * 100 as pct
      from public.grades g join public.submissions s on s.id = g.submission_id
      where s.classroom_id = p_class order by g.assignment_id, g.student_id, g.score desc) o group by o.student_id)
  select b.label, count(per.student_id) from (values ('0-49', 0, 50), ('50-69', 50, 70), ('70-84', 70, 85), ('85-100', 85, 101)) as b(label, lo, hi)
  left join per on per.pct >= b.lo and per.pct < b.hi group by b.label, b.lo order by b.lo;
end $$;

-- Оқушының өз тапсырмалары (күйі серверде есептеледі)
create or replace function public.my_assignments()
returns table (assignment_id uuid, title text, kind public.assignment_kind, difficulty public.difficulty_level, max_score numeric, deadline timestamptz,
               classroom_id uuid, classroom_name text, status text, best_score numeric, attempts_used bigint, max_attempts integer)
language sql stable security invoker set search_path = public, pg_temp as $$
  select a.id, a.title, a.kind, a.difficulty, a.max_score, a.deadline, c.id, c.name,
    case
      when a.deadline < now() and not a.allow_late and not exists (select 1 from public.submissions s where s.assignment_id = a.id and s.student_id = auth.uid() and s.status <> 'draft')
        then 'overdue'
      when exists (select 1 from public.submissions s where s.assignment_id = a.id and s.student_id = auth.uid() and s.status = 'graded') then 'graded'
      when exists (select 1 from public.submissions s where s.assignment_id = a.id and s.student_id = auth.uid() and s.status = 'under_review') then 'under_review'
      when exists (select 1 from public.submissions s where s.assignment_id = a.id and s.student_id = auth.uid() and s.status = 'submitted') then 'submitted'
      when exists (select 1 from public.submissions s where s.assignment_id = a.id and s.student_id = auth.uid() and s.status = 'draft') then 'in_progress'
      else 'not_started' end,
    (select max(g.score) from public.grades g where g.assignment_id = a.id and g.student_id = auth.uid()),
    (select count(*) from public.submissions s where s.assignment_id = a.id and s.student_id = auth.uid() and s.status <> 'draft'),
    a.max_attempts
  from public.assignments a
  join public.assignment_targets t on t.assignment_id = a.id
  join public.classrooms c on c.id = t.classroom_id
  join public.classroom_students cs on cs.classroom_id = c.id and cs.student_id = auth.uid() and cs.status = 'active'
  where a.status = 'published'
  order by a.deadline nulls last, a.created_at desc
$$;

-- Платформа әкімшісіне ұйымдар бойынша ТЕК жиынтық сандар (жеке деректерсіз)
create or replace function public.platform_usage()
returns table (org_id uuid, name text, slug text, status text, license_state text, plan public.license_plan, valid_until date,
               students bigint, max_students integer, teachers bigint, max_teachers integer, classes bigint, assignments bigint, submissions_30d bigint)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  return query
  select o.id, o.name, o.slug, o.status, public.license_state(o.id), l.plan, l.valid_until,
    (select count(*) from public.organization_members m where m.org_id = o.id and m.role = 'student' and m.status = 'active'), l.max_students,
    (select count(*) from public.organization_members m where m.org_id = o.id and m.role = 'teacher' and m.status = 'active'), l.max_teachers,
    (select count(*) from public.classrooms c where c.org_id = o.id and c.status = 'active'),
    (select count(*) from public.assignments a where a.org_id = o.id and a.status = 'published'),
    (select count(*) from public.submissions s where s.org_id = o.id and s.submitted_at > now() - interval '30 days')
  from public.organizations o left join public.licenses l on l.org_id = o.id order by o.created_at desc;
end $$;

grant execute on function
  public.org_overview(uuid), public.activity_series(uuid, integer), public.class_students_overview(uuid), public.class_assignments_overview(uuid),
  public.class_grade_distribution(uuid), public.my_assignments(), public.platform_usage() to authenticated;
