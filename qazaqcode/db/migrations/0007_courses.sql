-- QazaqCode Platform: 0007 - курс конструкторы, сабақ прогресі, хабарландырулар, оқушы/курс аналитикасы.
-- Принцип сол: клиент кестелерді тек RLS арқылы ОҚИДЫ, барлық жазу SECURITY DEFINER RPC арқылы.
-- Курс мазмұны тек өз авторлығымыздағы материал (үшінші тарап оқу материалы мұнда қосылмайды - NOTICE.md).

create type public.course_status as enum ('draft', 'published', 'archived');

create table public.courses (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  created_by   uuid not null references auth.users (id) on delete restrict,
  title        text not null check (char_length(title) between 1 and 160),
  description  text check (char_length(description) <= 2000),
  status       public.course_status not null default 'draft',
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index courses_org on public.courses (org_id);
create index courses_creator on public.courses (created_by);

create table public.course_modules (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  course_id  uuid not null references public.courses (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 160),
  position   integer not null check (position >= 0)
);
create index course_modules_course on public.course_modules (course_id, position);

create table public.lessons (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  course_id     uuid not null references public.courses (id) on delete cascade,
  module_id     uuid not null references public.course_modules (id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 160),
  position      integer not null check (position >= 0),
  blocks        jsonb not null default '[]'::jsonb check (jsonb_typeof(blocks) = 'array'),
  assignment_id uuid references public.assignments (id) on delete set null
);
create index lessons_module on public.lessons (module_id, position);
create index lessons_course on public.lessons (course_id);

create table public.course_targets (
  course_id    uuid not null references public.courses (id) on delete cascade,
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  org_id       uuid not null references public.organizations (id) on delete cascade,
  primary key (course_id, classroom_id)
);
create index course_targets_class on public.course_targets (classroom_id);

create table public.lesson_progress (
  lesson_id    uuid not null references public.lessons (id) on delete cascade,
  student_id   uuid not null references auth.users (id) on delete cascade,
  org_id       uuid not null references public.organizations (id) on delete cascade,
  course_id    uuid not null references public.courses (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (lesson_id, student_id)
);
create index lesson_progress_course on public.lesson_progress (course_id, student_id);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid references public.organizations (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (char_length(kind) <= 40),
  title      text not null check (char_length(title) <= 200),
  body       text check (char_length(body) <= 500),
  link       text check (link is null or link ~ '^/[A-Za-z0-9/_?=&.-]*$'),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user on public.notifications (user_id, created_at desc);

-- ---------- Құқық көмекшілері ----------
create or replace function public.can_manage_course(p_course uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.courses c where c.id = p_course
    and ((c.created_by = auth.uid() and public.is_org_staff(c.org_id)) or public.is_org_admin(c.org_id)))
$$;

create or replace function public.student_sees_course(p_course uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.courses c
    join public.course_targets t on t.course_id = c.id
    join public.classroom_students cs on cs.classroom_id = t.classroom_id and cs.student_id = auth.uid() and cs.status = 'active'
    where c.id = p_course and c.status = 'published')
$$;

create or replace function public.can_view_course(p_course uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.can_manage_course(p_course) or public.student_sees_course(p_course)
$$;

-- ---------- RLS ----------
alter table public.courses         enable row level security;
alter table public.course_modules  enable row level security;
alter table public.lessons         enable row level security;
alter table public.course_targets  enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.notifications   enable row level security;

create policy courses_select on public.courses for select to authenticated using (public.can_view_course(id));
create policy modules_select on public.course_modules for select to authenticated using (public.can_view_course(course_id));
create policy lessons_select on public.lessons for select to authenticated using (public.can_view_course(course_id));
create policy course_targets_select on public.course_targets for select to authenticated using (public.can_view_course(course_id));
create policy lesson_progress_select on public.lesson_progress for select to authenticated using (student_id = auth.uid() or public.can_manage_course(course_id));
create policy notifications_select on public.notifications for select to authenticated using (user_id = auth.uid());

grant select on public.courses, public.course_modules, public.lessons, public.course_targets, public.lesson_progress, public.notifications to authenticated;

-- ---------- Ішкі: хабарландыру жасау (клиентке берілмейді) ----------
create or replace function public.notify(p_user uuid, p_org uuid, p_kind text, p_title text, p_body text default null, p_link text default null)
returns void language sql security definer set search_path = public, pg_temp as $$
  insert into public.notifications (org_id, user_id, kind, title, body, link) values (p_org, p_user, p_kind, left(p_title, 200), left(p_body, 500), p_link)
$$;
revoke all on function public.notify(uuid, uuid, text, text, text, text) from public, anon, authenticated;

-- ---------- Курс RPC ----------
create or replace function public.create_course(p_org uuid, p_title text, p_description text default null) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_mod uuid;
begin
  if not public.is_org_staff(p_org) then raise exception 'forbidden'; end if;
  if not public.license_ok(p_org) then raise exception 'license_expired'; end if;
  if p_title is null or char_length(trim(p_title)) = 0 then raise exception 'invalid_input'; end if;
  insert into public.courses (org_id, created_by, title, description) values (p_org, auth.uid(), trim(p_title), nullif(trim(p_description), '')) returning id into v_id;
  insert into public.course_modules (org_id, course_id, title, position) values (p_org, v_id, '1-модуль', 0) returning id into v_mod;
  perform public.audit_log(p_org, 'course.create', 'course', v_id::text, '{}');
  return v_id;
end $$;

create or replace function public.update_course_info(p_course uuid, p_title text, p_description text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.can_manage_course(p_course) then raise exception 'forbidden'; end if;
  if p_title is null or char_length(trim(p_title)) = 0 then raise exception 'invalid_input'; end if;
  update public.courses set title = trim(p_title), description = nullif(trim(p_description), ''), updated_at = now() where id = p_course;
end $$;

-- Құрылым: {"modules":[{"id"?,"title","lessons":[{"id"?,"title","assignment_id"?,"blocks":[...]}]}]}
-- Блок түрлері: text, code, image, video, note. Тізімде жоқ модуль/сабақ жойылады (прогресімен).
create or replace function public.save_course_structure(p_course uuid, p jsonb) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare c public.courses; m jsonb; l jsonb; b jsonb; mi int := 0; li int; v_mid uuid; v_lid uuid; v_aid uuid;
  keep_m uuid[] := '{}'; keep_l uuid[] := '{}'; v_type text; v_text text; v_blocks jsonb; v_nl int := 0;
begin
  select * into c from public.courses where id = p_course for update;
  if not found then raise exception 'not_found'; end if;
  if not public.can_manage_course(p_course) then raise exception 'forbidden'; end if;
  if jsonb_typeof(p -> 'modules') is distinct from 'array' then raise exception 'invalid_input'; end if;
  if jsonb_array_length(p -> 'modules') > 50 then raise exception 'too_large'; end if;

  for m in select * from jsonb_array_elements(p -> 'modules') loop
    if char_length(trim(coalesce(m ->> 'title', ''))) not between 1 and 160 then raise exception 'invalid_input'; end if;
    v_mid := null;
    if (m ->> 'id') ~* '^[0-9a-f-]{36}$' then
      select id into v_mid from public.course_modules where id = (m ->> 'id')::uuid and course_id = p_course;
    end if;
    if v_mid is null then
      insert into public.course_modules (org_id, course_id, title, position) values (c.org_id, p_course, trim(m ->> 'title'), mi) returning id into v_mid;
    else
      update public.course_modules set title = trim(m ->> 'title'), position = mi where id = v_mid;
    end if;
    keep_m := keep_m || v_mid; mi := mi + 1; li := 0;

    if jsonb_typeof(m -> 'lessons') is distinct from 'array' then continue; end if;
    for l in select * from jsonb_array_elements(m -> 'lessons') loop
      v_nl := v_nl + 1; if v_nl > 500 then raise exception 'too_large'; end if;
      if char_length(trim(coalesce(l ->> 'title', ''))) not between 1 and 160 then raise exception 'invalid_input'; end if;
      v_blocks := '[]'::jsonb;
      if jsonb_typeof(l -> 'blocks') = 'array' then
        if jsonb_array_length(l -> 'blocks') > 60 then raise exception 'too_large'; end if;
        for b in select * from jsonb_array_elements(l -> 'blocks') loop
          v_type := b ->> 'type'; v_text := coalesce(b ->> 'content', '');
          if v_type not in ('text', 'code', 'image', 'video', 'note') then raise exception 'invalid_block'; end if;
          if char_length(v_text) > 20000 then raise exception 'too_large'; end if;
          if v_type in ('image', 'video') and v_text !~* '^https://[^\s<>"'']+$' then raise exception 'invalid_block'; end if;
          if v_type = 'code' and coalesce(b ->> 'language', 'python') not in ('python', 'sql', 'javascript', 'html', 'css', 'text') then raise exception 'invalid_block'; end if;
          v_blocks := v_blocks || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
            'type', v_type, 'content', v_text,
            'language', case when v_type = 'code' then coalesce(b ->> 'language', 'python') end,
            'caption', case when v_type in ('image', 'video') then left(b ->> 'caption', 200) end)));
        end loop;
      end if;
      v_aid := null;
      if (l ->> 'assignment_id') ~* '^[0-9a-f-]{36}$' then
        select id into v_aid from public.assignments where id = (l ->> 'assignment_id')::uuid and org_id = c.org_id;
        if v_aid is null then raise exception 'not_found'; end if;
        if not public.can_manage_assignment(v_aid) then raise exception 'forbidden'; end if;
      end if;
      v_lid := null;
      if (l ->> 'id') ~* '^[0-9a-f-]{36}$' then
        select id into v_lid from public.lessons where id = (l ->> 'id')::uuid and course_id = p_course;
      end if;
      if v_lid is null then
        insert into public.lessons (org_id, course_id, module_id, title, position, blocks, assignment_id)
        values (c.org_id, p_course, v_mid, trim(l ->> 'title'), li, v_blocks, v_aid) returning id into v_lid;
      else
        update public.lessons set module_id = v_mid, title = trim(l ->> 'title'), position = li, blocks = v_blocks, assignment_id = v_aid where id = v_lid;
      end if;
      keep_l := keep_l || v_lid; li := li + 1;
    end loop;
  end loop;

  delete from public.lessons where course_id = p_course and not (id = any (keep_l));
  delete from public.course_modules where course_id = p_course and not (id = any (keep_m));
  update public.courses set updated_at = now() where id = p_course;
  perform public.audit_log(c.org_id, 'course.structure', 'course', p_course::text, jsonb_build_object('modules', mi, 'lessons', v_nl));
end $$;

create or replace function public.set_course_targets(p_course uuid, p_classes uuid[]) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare c public.courses; k uuid;
begin
  select * into c from public.courses where id = p_course;
  if not found then raise exception 'not_found'; end if;
  if not public.can_manage_course(p_course) then raise exception 'forbidden'; end if;
  foreach k in array coalesce(p_classes, '{}') loop
    if not exists (select 1 from public.classrooms z where z.id = k and z.org_id = c.org_id) then raise exception 'not_found'; end if;
    if not (public.is_class_teacher(k) or public.is_org_admin(c.org_id)) then raise exception 'forbidden'; end if;
  end loop;
  delete from public.course_targets where course_id = p_course and not (classroom_id = any (coalesce(p_classes, '{}')));
  insert into public.course_targets (course_id, classroom_id, org_id) select p_course, x, c.org_id from unnest(coalesce(p_classes, '{}')) x on conflict do nothing;
end $$;

create or replace function public.set_course_status(p_course uuid, p_status public.course_status) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare c public.courses;
begin
  select * into c from public.courses where id = p_course;
  if not found then raise exception 'not_found'; end if;
  if not public.can_manage_course(p_course) then raise exception 'forbidden'; end if;
  if p_status = 'published' then
    if not public.license_ok(c.org_id) then raise exception 'license_expired'; end if;
    if not exists (select 1 from public.lessons where course_id = p_course) then raise exception 'course_empty'; end if;
    if not exists (select 1 from public.course_targets where course_id = p_course) then raise exception 'no_targets'; end if;
  end if;
  update public.courses set status = p_status, updated_at = now(),
    published_at = case when p_status = 'published' then coalesce(published_at, now()) else published_at end where id = p_course;
  perform public.audit_log(c.org_id, 'course.status', 'course', p_course::text, jsonb_build_object('status', p_status));
end $$;

-- Көшірме: үнемі жоба (draft), бірақ сыныптарға бекітілмейді; прогресс көшірілмейді
create or replace function public.duplicate_course(p_course uuid) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare c public.courses; v_new uuid; m record; v_mid uuid;
begin
  select * into c from public.courses where id = p_course;
  if not found then raise exception 'not_found'; end if;
  if not public.can_manage_course(p_course) then raise exception 'forbidden'; end if;
  if not public.license_ok(c.org_id) then raise exception 'license_expired'; end if;
  insert into public.courses (org_id, created_by, title, description) values (c.org_id, auth.uid(), left(c.title || ' (көшірме)', 160), c.description) returning id into v_new;
  for m in select * from public.course_modules where course_id = p_course order by position loop
    insert into public.course_modules (org_id, course_id, title, position) values (c.org_id, v_new, m.title, m.position) returning id into v_mid;
    insert into public.lessons (org_id, course_id, module_id, title, position, blocks, assignment_id)
    select c.org_id, v_new, v_mid, l.title, l.position, l.blocks, l.assignment_id from public.lessons l where l.module_id = m.id;
  end loop;
  perform public.audit_log(c.org_id, 'course.duplicate', 'course', v_new::text, jsonb_build_object('from', p_course));
  return v_new;
end $$;

-- Оқушы сабақты аяқтады деп белгілейді
create or replace function public.complete_lesson(p_lesson uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := public.require_user(); l public.lessons;
begin
  select * into l from public.lessons where id = p_lesson;
  if not found or not public.student_sees_course(l.course_id) then raise exception 'not_found'; end if;
  if exists (select 1 from public.organizations where id = l.org_id and status <> 'active') then raise exception 'org_suspended'; end if;
  insert into public.lesson_progress (lesson_id, student_id, org_id, course_id) values (p_lesson, u, l.org_id, l.course_id) on conflict do nothing;
end $$;

create or replace function public.mark_notifications_read(p_ids uuid[] default null) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := public.require_user();
begin
  update public.notifications set read_at = now() where user_id = u and read_at is null and (p_ids is null or id = any (p_ids));
end $$;

-- ---------- Хабарландыру триггерлері (бизнес-логикаға тимей) ----------
create or replace function public.trg_notify_grade() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_title text;
begin
  select title into v_title from public.assignments where id = new.assignment_id;
  perform public.notify(new.student_id, new.org_id, 'grade', 'Баға қойылды: ' || coalesce(v_title, ''),
    new.score::text || ' / ' || new.max_score::text, '/student/assignments/' || new.assignment_id::text);
  return new;
end $$;
create trigger grades_notify after insert or update of score on public.grades for each row execute function public.trg_notify_grade();

create or replace function public.trg_notify_submission() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_title text; v_teacher uuid; v_name text;
begin
  if new.status = 'submitted' and old.status = 'draft' then
    select title into v_title from public.assignments where id = new.assignment_id;
    select teacher_id into v_teacher from public.classrooms where id = new.classroom_id;
    select full_name into v_name from public.profiles where id = new.student_id;
    if v_teacher is not null then
      perform public.notify(v_teacher, new.org_id, 'submission', 'Жаңа тапсырма жіберілді',
        coalesce(v_name, 'Оқушы') || ': ' || coalesce(v_title, ''), '/teacher/review');
    end if;
  end if;
  return new;
end $$;
create trigger submissions_notify after update of status on public.submissions for each row execute function public.trg_notify_submission();

create or replace function public.trg_notify_assignment() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status = 'published' and old.status <> 'published' then
    insert into public.notifications (org_id, user_id, kind, title, body, link)
    select distinct new.org_id, cs.student_id, 'assignment', 'Жаңа тапсырма: ' || left(new.title, 150),
      case when new.deadline is not null then 'Мерзімі: ' || to_char(new.deadline at time zone 'Asia/Almaty', 'DD.MM.YYYY HH24:MI') end,
      '/student/assignments/' || new.id::text
    from public.assignment_targets t join public.classroom_students cs on cs.classroom_id = t.classroom_id and cs.status = 'active'
    where t.assignment_id = new.id;
  end if;
  return new;
end $$;
create trigger assignments_notify after update of status on public.assignments for each row execute function public.trg_notify_assignment();

create or replace function public.trg_notify_course() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status = 'published' and old.status <> 'published' then
    insert into public.notifications (org_id, user_id, kind, title, body, link)
    select distinct new.org_id, cs.student_id, 'course', 'Жаңа курс: ' || left(new.title, 150), null, '/student/courses/' || new.id::text
    from public.course_targets t join public.classroom_students cs on cs.classroom_id = t.classroom_id and cs.status = 'active'
    where t.course_id = new.id;
  end if;
  return new;
end $$;
create trigger courses_notify after update of status on public.courses for each row execute function public.trg_notify_course();

-- ---------- Аналитика (SECURITY INVOKER, RLS қолданылады) ----------
-- Оқушы карточкасы: мұғалім өз сыныбындағы, әкімші өз ұйымындағы оқушыны көреді
create or replace function public.student_progress(p_student uuid)
returns table (assignment_id uuid, title text, kind public.assignment_kind, classroom_name text, deadline timestamptz,
               status text, best_pct numeric, attempts bigint, time_spent bigint, last_activity timestamptz)
language plpgsql stable security invoker set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.organization_members m where m.user_id = p_student and m.role = 'student'
      and (public.is_org_admin(m.org_id) or public.teacher_has_student(m.org_id, p_student))) then
    raise exception 'forbidden';
  end if;
  return query
  select a.id, a.title, a.kind, c.name, a.deadline,
    case when exists (select 1 from public.submissions s where s.assignment_id = a.id and s.student_id = p_student and s.status = 'graded') then 'graded'
         when exists (select 1 from public.submissions s where s.assignment_id = a.id and s.student_id = p_student and s.status in ('submitted', 'under_review')) then 'submitted'
         when exists (select 1 from public.submissions s where s.assignment_id = a.id and s.student_id = p_student and s.status = 'draft') then 'in_progress'
         when a.deadline < now() then 'overdue' else 'not_started' end,
    (select max(g.score / g.max_score * 100) from public.grades g where g.assignment_id = a.id and g.student_id = p_student),
    (select count(*) from public.submissions s where s.assignment_id = a.id and s.student_id = p_student and s.status <> 'draft'),
    (select coalesce(sum(s.time_spent_seconds), 0) from public.submissions s where s.assignment_id = a.id and s.student_id = p_student),
    (select max(s.updated_at) from public.submissions s where s.assignment_id = a.id and s.student_id = p_student)
  from public.assignments a
  join public.assignment_targets t on t.assignment_id = a.id
  join public.classrooms c on c.id = t.classroom_id
  join public.classroom_students cs on cs.classroom_id = c.id and cs.student_id = p_student and cs.status = 'active'
  where a.status = 'published'
  order by a.deadline nulls last, a.title;
end $$;

-- Сынып белсенділігі (күн сайын)
create or replace function public.class_activity_series(p_class uuid, p_days integer default 30)
returns table (day date, submissions bigint, active_students bigint)
language plpgsql stable security invoker set search_path = public, pg_temp as $$
begin
  if not (public.is_class_teacher(p_class) or exists (select 1 from public.classrooms c where c.id = p_class and public.is_org_admin(c.org_id))) then raise exception 'forbidden'; end if;
  if p_days < 1 or p_days > 366 then raise exception 'invalid_range'; end if;
  return query
  select d::date,
    (select count(*) from public.submissions s where s.classroom_id = p_class and s.submitted_at::date = d::date),
    (select count(distinct s.student_id) from public.submissions s where s.classroom_id = p_class and s.updated_at::date = d::date)
  from generate_series(current_date - (p_days - 1), current_date, interval '1 day') d order by 1;
end $$;

-- Қиын тақырыптар: тесттегі сұрақтар бойынша дұрыс жауап үлесі (ең төменгісі бірінші)
create or replace function public.difficult_questions(p_class uuid)
returns table (assignment_id uuid, assignment_title text, question_id uuid, prompt text, answered bigint, correct bigint, correct_pct numeric)
language plpgsql stable security invoker set search_path = public, pg_temp as $$
begin
  if not (public.is_class_teacher(p_class) or exists (select 1 from public.classrooms c where c.id = p_class and public.is_org_admin(c.org_id))) then raise exception 'forbidden'; end if;
  return query
  with d as (
    select s.assignment_id, (e ->> 'question_id')::uuid as qid, (e ->> 'correct')::boolean as ok
    from public.submissions s
    join public.submission_results r on r.submission_id = s.id and r.kind = 'quiz_auto'
    cross join lateral jsonb_array_elements(r.details) e
    where s.classroom_id = p_class)
  select a.id, a.title, q.id, q.prompt, count(*), count(*) filter (where d.ok), round(100.0 * count(*) filter (where d.ok) / count(*), 1)
  from d join public.assignment_questions q on q.id = d.qid join public.assignments a on a.id = d.assignment_id
  group by a.id, a.title, q.id, q.prompt, q.position order by 7, q.position;
end $$;

-- Курс прогресі: мақсатты сыныптардағы оқушылар бойынша
create or replace function public.course_progress(p_course uuid)
returns table (student_id uuid, full_name text, completed bigint, total bigint)
language plpgsql stable security invoker set search_path = public, pg_temp as $$
begin
  if not public.can_manage_course(p_course) then raise exception 'forbidden'; end if;
  return query
  select p.id, p.full_name,
    (select count(*) from public.lesson_progress lp where lp.course_id = p_course and lp.student_id = p.id),
    (select count(*) from public.lessons l where l.course_id = p_course)
  from (select distinct cs.student_id from public.course_targets t
        join public.classroom_students cs on cs.classroom_id = t.classroom_id and cs.status = 'active' where t.course_id = p_course) x
  join public.profiles p on p.id = x.student_id order by p.full_name;
end $$;

-- Оқушының курстары
create or replace function public.my_courses()
returns table (course_id uuid, title text, description text, total bigint, completed bigint)
language sql stable security invoker set search_path = public, pg_temp as $$
  select c.id, c.title, c.description,
    (select count(*) from public.lessons l where l.course_id = c.id),
    (select count(*) from public.lesson_progress lp where lp.course_id = c.id and lp.student_id = auth.uid())
  from public.courses c
  where c.status = 'published' and public.student_sees_course(c.id)
  order by c.published_at desc nulls last
$$;

revoke all on function public.can_manage_course(uuid), public.student_sees_course(uuid), public.can_view_course(uuid) from public, anon;
grant execute on function public.can_manage_course(uuid), public.student_sees_course(uuid), public.can_view_course(uuid) to authenticated;
grant execute on function
  public.create_course(uuid, text, text), public.update_course_info(uuid, text, text), public.save_course_structure(uuid, jsonb),
  public.set_course_targets(uuid, uuid[]), public.set_course_status(uuid, public.course_status), public.duplicate_course(uuid),
  public.complete_lesson(uuid), public.mark_notifications_read(uuid[]),
  public.student_progress(uuid), public.class_activity_series(uuid, integer), public.difficult_questions(uuid),
  public.course_progress(uuid), public.my_courses()
  to authenticated;
