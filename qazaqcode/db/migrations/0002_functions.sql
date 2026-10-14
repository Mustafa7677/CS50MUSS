-- QazaqCode Platform: 0002 - көмекші функциялар және RPC (SECURITY DEFINER).
-- Барлық жазу операциялары (қосу, баптау, бағалау) осы функциялар арқылы жүреді: құқық серверде (дерекқорда) тексеріледі.
-- Қате коды - exception хабарының мәтіні (мысалы 'forbidden', 'license_expired'): қосымша оны қазақшаға аударады.

-- ---------- Көмекші ----------
create or replace function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid())
$$;

create or replace function public.member_role_in(p_org uuid) returns public.member_role
language sql stable security definer set search_path = public, pg_temp as $$
  select role from public.organization_members where org_id = p_org and user_id = auth.uid() and status = 'active'
$$;

create or replace function public.is_org_member(p_org uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.organization_members where org_id = p_org and user_id = auth.uid() and status = 'active')
$$;

create or replace function public.is_org_admin(p_org uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.organization_members
                 where org_id = p_org and user_id = auth.uid() and status = 'active' and role = 'school_admin')
$$;

create or replace function public.is_org_staff(p_org uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.organization_members
                 where org_id = p_org and user_id = auth.uid() and status = 'active' and role in ('school_admin', 'teacher'))
$$;

create or replace function public.is_class_teacher(p_class uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.classrooms c
                 join public.organization_members m on m.org_id = c.org_id and m.user_id = auth.uid() and m.status = 'active'
                 where c.id = p_class and c.teacher_id = auth.uid())
$$;

create or replace function public.is_class_student(p_class uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.classroom_students where classroom_id = p_class and student_id = auth.uid() and status = 'active')
$$;

-- Оқушы осы тапсырманы көре ала ма (жарияланған және оның сыныбына берілген)
create or replace function public.student_sees_assignment(p_assignment uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.assignments a
    join public.assignment_targets t on t.assignment_id = a.id
    join public.classroom_students cs on cs.classroom_id = t.classroom_id and cs.student_id = auth.uid() and cs.status = 'active'
    where a.id = p_assignment and a.status = 'published')
$$;

-- Лицензия күйі: none | active | expired | suspended | org_suspended
create or replace function public.license_state(p_org uuid) returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select case
    when o.status <> 'active' then 'org_suspended'
    when l.id is null then 'none'
    when l.status <> 'active' then 'suspended'
    when current_date > l.valid_until then 'expired'
    else 'active' end
  from public.organizations o left join public.licenses l on l.org_id = o.id
  where o.id = p_org
$$;

create or replace function public.license_ok(p_org uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(public.license_state(p_org) = 'active', false)
$$;

create or replace function public.plan_limits(p_plan public.license_plan, out max_students integer, out max_teachers integer)
language sql immutable as $$
  select case p_plan when 'starter' then 100 when 'pro' then 500 else 2000 end,
         case p_plan when 'starter' then 5   when 'pro' then 25  else 100 end
$$;

-- Аудит: клиентке берілмейді, тек басқа функциялар мен триггерлер шақырады
create or replace function public.audit_log(p_org uuid, p_action text, p_entity text, p_entity_id text, p_meta jsonb default '{}')
returns void language sql security definer set search_path = public, pg_temp as $$
  insert into public.audit_logs (org_id, actor_id, action, entity, entity_id, meta)
  values (p_org, auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_meta, '{}'::jsonb))
$$;

create or replace function public.require_user() returns uuid
language plpgsql stable as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'unauthenticated'; end if;
  return u;
end $$;

-- Ұйымның жария брендингі (кіру беті үшін, white-label): тек қауіпсіз бағандар
create or replace function public.org_branding(p_slug text)
returns table (name text, slug text, logo_url text, primary_color text, secondary_color text, welcome_text text, contact_email text, contact_phone text)
language sql stable security definer set search_path = public, pg_temp as $$
  select o.name, o.slug, s.logo_url, s.primary_color, s.secondary_color, s.welcome_text, s.contact_email, s.contact_phone
  from public.organizations o join public.organization_settings s on s.org_id = o.id
  where o.slug = lower(p_slug) and o.status = 'active'
$$;

-- ---------- Профиль: жаңа қолданушыға автоматты ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, 'user'), '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- Ұйымдар және лицензия (SUPER ADMIN) ----------
create or replace function public.create_organization(
  p_name text, p_slug text, p_plan public.license_plan, p_valid_until date,
  p_max_students integer default null, p_max_teachers integer default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_org uuid; v_lim record; v_token text;
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if p_valid_until < current_date then raise exception 'invalid_license_date'; end if;
  select * into v_lim from public.plan_limits(p_plan);
  insert into public.organizations (name, slug, created_by) values (trim(p_name), lower(trim(p_slug)), auth.uid()) returning id into v_org;
  insert into public.organization_settings (org_id) values (v_org);
  insert into public.licenses (org_id, plan, max_students, max_teachers, valid_until, created_by)
  values (v_org, p_plan, coalesce(p_max_students, v_lim.max_students), coalesce(p_max_teachers, v_lim.max_teachers), p_valid_until, auth.uid());
  v_token := public.create_invitation(v_org, 'school_admin', null, 336);
  perform public.audit_log(v_org, 'organization.create', 'organization', v_org::text, jsonb_build_object('plan', p_plan));
  return jsonb_build_object('org_id', v_org, 'admin_invite_token', v_token);
exception when unique_violation then raise exception 'slug_taken';
end $$;

create or replace function public.set_license(
  p_org uuid, p_plan public.license_plan, p_max_students integer, p_max_teachers integer,
  p_valid_until date, p_status text default 'active', p_notes text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('active', 'suspended') then raise exception 'invalid_status'; end if;
  insert into public.licenses (org_id, plan, max_students, max_teachers, valid_until, status, notes, created_by)
  values (p_org, p_plan, p_max_students, p_max_teachers, p_valid_until, p_status, p_notes, auth.uid())
  on conflict (org_id) do update set plan = excluded.plan, max_students = excluded.max_students, max_teachers = excluded.max_teachers,
    valid_until = excluded.valid_until, status = excluded.status, notes = excluded.notes;
end $$;

create or replace function public.set_org_status(p_org uuid, p_status text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('active', 'suspended') then raise exception 'invalid_status'; end if;
  update public.organizations set status = p_status where id = p_org;
  if not found then raise exception 'not_found'; end if;
  perform public.audit_log(p_org, 'organization.status', 'organization', p_org::text, jsonb_build_object('status', p_status));
end $$;

create or replace function public.update_org_settings(
  p_org uuid, p_logo_url text, p_primary text, p_secondary text, p_welcome text, p_email text, p_phone text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not (public.is_org_admin(p_org) or public.is_platform_admin()) then raise exception 'forbidden'; end if;
  update public.organization_settings set
    logo_url = nullif(trim(p_logo_url), ''), primary_color = coalesce(nullif(p_primary, ''), primary_color),
    secondary_color = coalesce(nullif(p_secondary, ''), secondary_color), welcome_text = nullif(trim(p_welcome), ''),
    contact_email = nullif(trim(p_email), ''), contact_phone = nullif(trim(p_phone), ''), updated_at = now()
  where org_id = p_org;
  perform public.audit_log(p_org, 'organization.settings', 'organization', p_org::text, '{}');
end $$;

-- ---------- Шақырулар ----------
create or replace function public.create_invitation(p_org uuid, p_role public.member_role, p_email text default null, p_ttl_hours integer default 168)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_token text := encode(gen_random_bytes(24), 'hex');
begin
  if p_role = 'student' then raise exception 'invalid_role'; end if;
  if p_role = 'school_admin' then
    if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  else
    if not (public.is_org_admin(p_org) or public.is_platform_admin()) then raise exception 'forbidden'; end if;
  end if;
  if not exists (select 1 from public.organizations where id = p_org and status = 'active') then raise exception 'org_suspended'; end if;
  if p_ttl_hours < 1 or p_ttl_hours > 24 * 30 then raise exception 'invalid_ttl'; end if;
  insert into public.invitations (org_id, role, email, token_hash, expires_at, created_by)
  values (p_org, p_role, nullif(lower(trim(p_email)), ''), encode(digest(v_token, 'sha256'), 'hex'), now() + make_interval(hours => p_ttl_hours), auth.uid());
  perform public.audit_log(p_org, 'invitation.create', 'invitation', null, jsonb_build_object('role', p_role));
  return v_token;
end $$;

create or replace function public.revoke_invitation(p_id uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_org uuid;
begin
  select org_id into v_org from public.invitations where id = p_id;
  if v_org is null then raise exception 'not_found'; end if;
  if not (public.is_org_admin(v_org) or public.is_platform_admin()) then raise exception 'forbidden'; end if;
  update public.invitations set revoked_at = now() where id = p_id and accepted_at is null;
end $$;

-- Шақыру туралы қысқаша ақпарат (тіркелу бетінде көрсету үшін); анонимге рұқсат, токен қажет
create or replace function public.invitation_preview(p_token text)
returns table (org_name text, role public.member_role, email text, expired boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  select o.name, i.role, i.email, (i.expires_at < now() or i.accepted_at is not null or i.revoked_at is not null)
  from public.invitations i join public.organizations o on o.id = i.org_id
  where i.token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
$$;

create or replace function public.accept_invitation(p_token text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := public.require_user(); v_inv public.invitations; v_email text; v_lim public.licenses; v_existing public.organization_members;
begin
  select * into v_inv from public.invitations where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex') for update;
  if not found then raise exception 'invite_invalid'; end if;
  if v_inv.revoked_at is not null or v_inv.accepted_at is not null or v_inv.expires_at < now() then raise exception 'invite_invalid'; end if;
  if v_inv.email is not null then
    select lower(email) into v_email from auth.users where id = u;
    if v_email is distinct from v_inv.email then raise exception 'invite_email_mismatch'; end if;
  end if;
  if not exists (select 1 from public.organizations where id = v_inv.org_id and status = 'active') then raise exception 'org_suspended'; end if;
  select * into v_existing from public.organization_members where org_id = v_inv.org_id and user_id = u;
  if found and v_existing.status = 'active' and v_existing.role <> v_inv.role then raise exception 'role_conflict'; end if;
  if v_inv.role = 'teacher' and not (found and v_existing.status = 'active') then
    select * into v_lim from public.licenses where org_id = v_inv.org_id;
    if v_lim.id is not null and (select count(*) from public.organization_members where org_id = v_inv.org_id and role = 'teacher' and status = 'active') >= v_lim.max_teachers then
      raise exception 'teacher_limit_reached';
    end if;
  end if;
  insert into public.organization_members (org_id, user_id, role) values (v_inv.org_id, u, v_inv.role)
  on conflict (org_id, user_id) do update set status = 'active', role = excluded.role;
  update public.invitations set accepted_by = u, accepted_at = now() where id = v_inv.id;
  perform public.audit_log(v_inv.org_id, 'invitation.accept', 'invitation', v_inv.id::text, jsonb_build_object('role', v_inv.role));
  return jsonb_build_object('org_id', v_inv.org_id, 'role', v_inv.role);
end $$;

create or replace function public.set_member_status(p_org uuid, p_user uuid, p_status text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not (public.is_org_admin(p_org) or public.is_platform_admin()) then raise exception 'forbidden'; end if;
  if p_status not in ('active', 'removed') then raise exception 'invalid_status'; end if;
  if p_user = auth.uid() and p_status = 'removed' then raise exception 'cannot_remove_self'; end if;
  update public.organization_members set status = p_status where org_id = p_org and user_id = p_user;
  if not found then raise exception 'not_found'; end if;
  if p_status = 'removed' then
    update public.classroom_students set status = 'removed' where org_id = p_org and student_id = p_user;
  end if;
end $$;

-- ---------- Сыныптар ----------
create or replace function public.new_join_code() returns text
language plpgsql volatile as $$
declare alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; code text; i int; b bytea;
begin
  loop
    b := gen_random_bytes(8); code := '';
    for i in 0..7 loop code := code || substr(alphabet, (get_byte(b, i) % 32) + 1, 1); end loop;
    exit when not exists (select 1 from public.classrooms where join_code = code);
  end loop;
  return code;
end $$;

create or replace function public.create_classroom(p_org uuid, p_name text, p_year text, p_subject text, p_description text default null, p_limit integer default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if not public.is_org_staff(p_org) then raise exception 'forbidden'; end if;
  if not public.license_ok(p_org) then raise exception 'license_expired'; end if;
  insert into public.classrooms (org_id, teacher_id, name, academic_year, subject, description, student_limit, join_code)
  values (p_org, auth.uid(), trim(p_name), trim(p_year), trim(p_subject), nullif(trim(p_description), ''), p_limit, public.new_join_code())
  returning id into v_id;
  perform public.audit_log(p_org, 'classroom.create', 'classroom', v_id::text, '{}');
  return v_id;
end $$;

create or replace function public.regenerate_join_code(p_class uuid) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_code text;
begin
  if not (public.is_class_teacher(p_class) or exists (select 1 from public.classrooms c where c.id = p_class and public.is_org_admin(c.org_id))) then raise exception 'forbidden'; end if;
  v_code := public.new_join_code();
  update public.classrooms set join_code = v_code where id = p_class;
  return v_code;
end $$;

create or replace function public.update_classroom(p_class uuid, p_name text, p_year text, p_subject text, p_description text, p_limit integer, p_join_enabled boolean, p_archived boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not (public.is_class_teacher(p_class) or exists (select 1 from public.classrooms c where c.id = p_class and public.is_org_admin(c.org_id))) then raise exception 'forbidden'; end if;
  update public.classrooms set name = trim(p_name), academic_year = trim(p_year), subject = trim(p_subject),
    description = nullif(trim(p_description), ''), student_limit = p_limit, join_enabled = p_join_enabled,
    status = case when p_archived then 'archived' else 'active' end
  where id = p_class;
end $$;

create or replace function public.remove_student(p_class uuid, p_student uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not (public.is_class_teacher(p_class) or exists (select 1 from public.classrooms c where c.id = p_class and public.is_org_admin(c.org_id))) then raise exception 'forbidden'; end if;
  update public.classroom_students set status = 'removed' where classroom_id = p_class and student_id = p_student;
  if not found then raise exception 'not_found'; end if;
end $$;

-- Сыныпқа қосылу алдындағы қысқаша ақпарат (аноним; код ұзын және кездейсоқ)
create or replace function public.classroom_preview(p_code text)
returns table (classroom_name text, subject text, org_name text, org_slug text, teacher_name text)
language sql stable security definer set search_path = public, pg_temp as $$
  select c.name, c.subject, o.name, o.slug, p.full_name
  from public.classrooms c
  join public.organizations o on o.id = c.org_id and o.status = 'active'
  left join public.profiles p on p.id = c.teacher_id
  where c.join_code = upper(trim(coalesce(p_code, ''))) and c.join_enabled and c.status = 'active'
$$;

create or replace function public.join_classroom(p_code text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := public.require_user(); c public.classrooms; v_lim public.licenses; v_member public.organization_members;
begin
  select * into c from public.classrooms where join_code = upper(trim(coalesce(p_code, ''))) and join_enabled and status = 'active';
  if not found then raise exception 'invalid_code'; end if;
  if not public.license_ok(c.org_id) then raise exception 'license_expired'; end if;
  select * into v_member from public.organization_members where org_id = c.org_id and user_id = u;
  if found and v_member.role <> 'student' then raise exception 'role_conflict'; end if;
  if c.student_limit is not null
     and (select count(*) from public.classroom_students where classroom_id = c.id and status = 'active' and student_id <> u) >= c.student_limit then
    raise exception 'class_full';
  end if;
  if not (found and v_member.status = 'active') then
    select * into v_lim from public.licenses where org_id = c.org_id;
    if (select count(*) from public.organization_members where org_id = c.org_id and role = 'student' and status = 'active') >= v_lim.max_students then
      raise exception 'student_limit_reached';
    end if;
  end if;
  insert into public.organization_members (org_id, user_id, role) values (c.org_id, u, 'student')
  on conflict (org_id, user_id) do update set status = 'active';
  insert into public.classroom_students (org_id, classroom_id, student_id) values (c.org_id, c.id, u)
  on conflict (classroom_id, student_id) do update set status = 'active';
  perform public.audit_log(c.org_id, 'classroom.join', 'classroom', c.id::text, '{}');
  return jsonb_build_object('classroom_id', c.id, 'org_id', c.org_id);
end $$;

-- ---------- Тапсырмалар ----------
create or replace function public.upsert_assignment(p jsonb) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid; v_org uuid; v_old public.assignments; v_kind public.assignment_kind;
  q jsonb; t jsonb; i int; v_qid uuid;
begin
  if v_id is null then
    v_org := (p ->> 'org_id')::uuid;
    if not public.is_org_staff(v_org) then raise exception 'forbidden'; end if;
    if not public.license_ok(v_org) then raise exception 'license_expired'; end if;
  else
    select * into v_old from public.assignments where id = v_id;
    if not found then raise exception 'not_found'; end if;
    v_org := v_old.org_id;
    if not (v_old.created_by = auth.uid() and public.is_org_staff(v_org)) and not public.is_org_admin(v_org) then raise exception 'forbidden'; end if;
  end if;
  v_kind := (p ->> 'kind')::public.assignment_kind;

  if v_id is null then
    insert into public.assignments (org_id, created_by, title, description, kind, difficulty, max_score, starter_code, max_attempts, deadline, allow_late, hints)
    values (v_org, auth.uid(), trim(p ->> 'title'), coalesce(p ->> 'description', ''), v_kind,
            coalesce(nullif(p ->> 'difficulty', ''), 'easy')::public.difficulty_level, coalesce(nullif(p ->> 'max_score', '')::numeric, 100),
            nullif(p ->> 'starter_code', ''), nullif(p ->> 'max_attempts', '')::int, nullif(p ->> 'deadline', '')::timestamptz,
            coalesce((p ->> 'allow_late')::boolean, false), coalesce(p -> 'hints', '[]'::jsonb))
    returning id into v_id;
  else
    update public.assignments set title = trim(p ->> 'title'), description = coalesce(p ->> 'description', ''), kind = v_kind,
      difficulty = coalesce(nullif(p ->> 'difficulty', ''), 'easy')::public.difficulty_level,
      max_score = coalesce(nullif(p ->> 'max_score', '')::numeric, 100), starter_code = nullif(p ->> 'starter_code', ''),
      max_attempts = nullif(p ->> 'max_attempts', '')::int, deadline = nullif(p ->> 'deadline', '')::timestamptz,
      allow_late = coalesce((p ->> 'allow_late')::boolean, false), hints = coalesce(p -> 'hints', '[]'::jsonb), updated_at = now()
    where id = v_id;
  end if;

  -- Сұрақтар мен тест жағдайлары: жұмыстар түскен тапсырмада құрылымы өзгермейді (әділдік үшін)
  if p ? 'questions' or p ? 'test_cases' then
    if exists (select 1 from public.submissions where assignment_id = v_id) then raise exception 'assignment_locked'; end if;
  end if;
  if p ? 'questions' then
    delete from public.assignment_questions where assignment_id = v_id;
    if v_kind = 'quiz' then
      i := 0;
      for q in select * from jsonb_array_elements(p -> 'questions') loop
        if jsonb_typeof(q -> 'options') <> 'array' or (q ->> 'correct_index')::int < 0 or (q ->> 'correct_index')::int >= jsonb_array_length(q -> 'options') then
          raise exception 'invalid_question';
        end if;
        insert into public.assignment_questions (org_id, assignment_id, position, prompt, options, points)
        values (v_org, v_id, i, trim(q ->> 'prompt'), q -> 'options', coalesce(nullif(q ->> 'points', '')::numeric, 1)) returning id into v_qid;
        insert into public.assignment_answer_keys (question_id, org_id, correct_index, explanation)
        values (v_qid, v_org, (q ->> 'correct_index')::int, nullif(trim(q ->> 'explanation'), ''));
        i := i + 1;
      end loop;
    end if;
  end if;
  if p ? 'test_cases' then
    delete from public.assignment_test_cases where assignment_id = v_id;
    i := 0;
    for t in select * from jsonb_array_elements(p -> 'test_cases') loop
      insert into public.assignment_test_cases (org_id, assignment_id, position, input, expected_output, is_hidden, points)
      values (v_org, v_id, i, coalesce(t ->> 'input', ''), coalesce(t ->> 'expected_output', ''), coalesce((t ->> 'is_hidden')::boolean, false), coalesce(nullif(t ->> 'points', '')::numeric, 1));
      i := i + 1;
    end loop;
  end if;
  perform public.audit_log(v_org, 'assignment.save', 'assignment', v_id::text, jsonb_build_object('kind', v_kind));
  return v_id;
end $$;

create or replace function public.set_assignment_targets(p_assignment uuid, p_classes uuid[]) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.assignments; c uuid;
begin
  select * into a from public.assignments where id = p_assignment;
  if not found then raise exception 'not_found'; end if;
  if not ((a.created_by = auth.uid() and public.is_org_staff(a.org_id)) or public.is_org_admin(a.org_id)) then raise exception 'forbidden'; end if;
  foreach c in array coalesce(p_classes, '{}') loop
    if not exists (select 1 from public.classrooms k where k.id = c and k.org_id = a.org_id) then raise exception 'not_found'; end if;
    if not (public.is_class_teacher(c) or public.is_org_admin(a.org_id)) then raise exception 'forbidden'; end if;
  end loop;
  delete from public.assignment_targets where assignment_id = p_assignment and not (classroom_id = any (coalesce(p_classes, '{}')));
  insert into public.assignment_targets (org_id, assignment_id, classroom_id)
  select a.org_id, p_assignment, x from unnest(coalesce(p_classes, '{}')) x on conflict (assignment_id, classroom_id) do nothing;
end $$;

create or replace function public.set_assignment_status(p_assignment uuid, p_status public.assignment_status) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.assignments;
begin
  select * into a from public.assignments where id = p_assignment;
  if not found then raise exception 'not_found'; end if;
  if not ((a.created_by = auth.uid() and public.is_org_staff(a.org_id)) or public.is_org_admin(a.org_id)) then raise exception 'forbidden'; end if;
  if p_status = 'published' then
    if not public.license_ok(a.org_id) then raise exception 'license_expired'; end if;
    if a.kind = 'quiz' and not exists (select 1 from public.assignment_questions where assignment_id = a.id) then raise exception 'quiz_empty'; end if;
    if not exists (select 1 from public.assignment_targets where assignment_id = a.id) then raise exception 'no_targets'; end if;
  end if;
  update public.assignments set status = p_status, updated_at = now() where id = p_assignment;
  perform public.audit_log(a.org_id, 'assignment.status', 'assignment', a.id::text, jsonb_build_object('status', p_status));
end $$;

-- ---------- Оқушының жұмысы ----------
create or replace function public.save_draft(p_assignment uuid, p_code text, p_answers jsonb, p_seconds integer default 0)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := public.require_user(); a public.assignments; v_class uuid; v_sub public.submissions; v_used integer;
begin
  select * into a from public.assignments where id = p_assignment;
  if not found or not public.student_sees_assignment(p_assignment) then raise exception 'not_found'; end if;
  if exists (select 1 from public.organizations where id = a.org_id and status <> 'active') then raise exception 'org_suspended'; end if;
  if a.deadline is not null and now() > a.deadline and not a.allow_late then raise exception 'deadline_passed'; end if;
  if p_answers is not null and jsonb_typeof(p_answers) <> 'object' then raise exception 'invalid_answers'; end if;
  select t.classroom_id into v_class from public.assignment_targets t
    join public.classroom_students cs on cs.classroom_id = t.classroom_id and cs.student_id = u and cs.status = 'active'
    where t.assignment_id = p_assignment order by cs.joined_at limit 1;

  select * into v_sub from public.submissions where assignment_id = p_assignment and student_id = u and status = 'draft';
  if found then
    update public.submissions set code = p_code, answers = coalesce(p_answers, answers),
      time_spent_seconds = greatest(time_spent_seconds, least(coalesce(p_seconds, 0), time_spent_seconds + 3600)), updated_at = now()
    where id = v_sub.id;
    return v_sub.id;
  end if;
  select count(*) into v_used from public.submissions where assignment_id = p_assignment and student_id = u and status <> 'draft';
  if a.max_attempts is not null and v_used >= a.max_attempts then raise exception 'attempts_exhausted'; end if;
  insert into public.submissions (org_id, assignment_id, classroom_id, student_id, attempt_no, code, answers, time_spent_seconds)
  values (a.org_id, p_assignment, v_class, u, (select coalesce(max(attempt_no), 0) + 1 from public.submissions where assignment_id = p_assignment and student_id = u),
          p_code, coalesce(p_answers, '{}'::jsonb), greatest(0, least(coalesce(p_seconds, 0), 3600)))
  returning id into v_sub.id;
  return v_sub.id;
end $$;

create or replace function public.submit_assignment(p_submission uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := public.require_user(); s public.submissions; a public.assignments;
  v_total numeric := 0; v_got numeric := 0; v_n int := 0; v_ok int := 0; v_details jsonb := '[]'::jsonb; r record; v_ans int; v_score numeric;
begin
  select * into s from public.submissions where id = p_submission and student_id = u for update;
  if not found then raise exception 'not_found'; end if;
  if s.status <> 'draft' then raise exception 'already_submitted'; end if;
  select * into a from public.assignments where id = s.assignment_id;
  if a.status <> 'published' or not public.student_sees_assignment(a.id) then raise exception 'not_found'; end if;
  if exists (select 1 from public.organizations where id = a.org_id and status <> 'active') then raise exception 'org_suspended'; end if;
  if a.deadline is not null and now() > a.deadline and not a.allow_late then raise exception 'deadline_passed'; end if;

  if a.kind = 'quiz' then
    for r in select q.id, q.points, k.correct_index from public.assignment_questions q join public.assignment_answer_keys k on k.question_id = q.id
             where q.assignment_id = a.id order by q.position loop
      v_total := v_total + r.points; v_n := v_n + 1;
      v_ans := case when (s.answers ->> r.id::text) ~ '^[0-9]+$' then (s.answers ->> r.id::text)::int else null end;
      if v_ans is not null and v_ans = r.correct_index then v_got := v_got + r.points; v_ok := v_ok + 1; end if;
      v_details := v_details || jsonb_build_array(jsonb_build_object('question_id', r.id, 'correct', v_ans is not null and v_ans = r.correct_index));
    end loop;
    v_score := case when v_total = 0 then 0 else round(v_got / v_total * a.max_score, 2) end;
    update public.submissions set status = 'graded', submitted_at = now(), updated_at = now() where id = s.id;
    insert into public.submission_results (org_id, submission_id, kind, passed, total, score, details) values (a.org_id, s.id, 'quiz_auto', v_ok, v_n, v_score, v_details);
    insert into public.grades (org_id, submission_id, assignment_id, student_id, score, max_score, source) values (a.org_id, s.id, a.id, u, v_score, a.max_score, 'auto');
    return jsonb_build_object('status', 'graded', 'score', v_score, 'max_score', a.max_score, 'passed', v_ok, 'total', v_n);
  end if;
  update public.submissions set status = 'submitted', submitted_at = now(), updated_at = now() where id = s.id;
  return jsonb_build_object('status', 'submitted');
end $$;

-- ---------- Мұғалімнің бағалауы ----------
create or replace function public.begin_review(p_submission uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.submissions;
begin
  select * into s from public.submissions where id = p_submission;
  if not found then raise exception 'not_found'; end if;
  if not (public.is_class_teacher(s.classroom_id) or public.is_org_admin(s.org_id)) then raise exception 'forbidden'; end if;
  update public.submissions set status = 'under_review', updated_at = now() where id = p_submission and status = 'submitted';
end $$;

create or replace function public.grade_submission(p_submission uuid, p_score numeric, p_feedback text default null) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.submissions; a public.assignments;
begin
  select * into s from public.submissions where id = p_submission for update;
  if not found then raise exception 'not_found'; end if;
  if not (public.is_class_teacher(s.classroom_id) or public.is_org_admin(s.org_id)) then raise exception 'forbidden'; end if;
  if s.status = 'draft' then raise exception 'not_submitted'; end if;
  select * into a from public.assignments where id = s.assignment_id;
  if p_score is null or p_score < 0 or p_score > a.max_score then raise exception 'invalid_score'; end if;
  insert into public.grades (org_id, submission_id, assignment_id, student_id, score, max_score, feedback, source, graded_by)
  values (s.org_id, s.id, a.id, s.student_id, p_score, a.max_score, nullif(trim(p_feedback), ''), 'manual', auth.uid())
  on conflict (submission_id) do update set score = excluded.score, feedback = excluded.feedback, source = 'manual', graded_by = excluded.graded_by, graded_at = now();
  update public.submissions set status = 'graded', updated_at = now() where id = s.id;
end $$;

-- ---------- Контекст: кім кіріп тұр ----------
create or replace function public.my_context() returns jsonb
language sql stable security invoker set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'user_id', auth.uid(),
    'full_name', (select full_name from public.profiles where id = auth.uid()),
    'is_platform_admin', public.is_platform_admin(),
    'memberships', coalesce((
      select jsonb_agg(jsonb_build_object('org_id', m.org_id, 'role', m.role, 'org_name', o.name, 'org_slug', o.slug,
                                          'license_state', public.license_state(m.org_id)) order by m.joined_at)
      from public.organization_members m join public.organizations o on o.id = m.org_id
      where m.user_id = auth.uid() and m.status = 'active'), '[]'::jsonb))
$$;

-- ---------- Аудит триггерлері ----------
create or replace function public.audit_trigger() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare j jsonb := to_jsonb(new); v_org uuid; v_meta jsonb;
begin
  v_org := coalesce((j ->> 'org_id')::uuid, case when tg_table_name = 'organizations' then (j ->> 'id')::uuid end);
  v_meta := case tg_table_name
    when 'licenses' then jsonb_build_object('plan', j ->> 'plan', 'valid_until', j ->> 'valid_until', 'status', j ->> 'status')
    when 'organization_members' then jsonb_build_object('user_id', j ->> 'user_id', 'role', j ->> 'role', 'status', j ->> 'status')
    when 'grades' then jsonb_build_object('score', j ->> 'score', 'source', j ->> 'source')
    else '{}'::jsonb end;
  insert into public.audit_logs (org_id, actor_id, action, entity, entity_id, meta)
  values (v_org, auth.uid(), tg_table_name || '.' || lower(tg_op), tg_table_name, coalesce(j ->> 'id', j ->> 'submission_id'), v_meta);
  return new;
end $$;
create trigger audit_licenses after insert or update on public.licenses for each row execute function public.audit_trigger();
create trigger audit_members after insert or update on public.organization_members for each row execute function public.audit_trigger();
create trigger audit_grades after insert or update on public.grades for each row execute function public.audit_trigger();
