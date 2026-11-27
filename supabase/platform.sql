-- © 2026 AO17 командасы. All Rights Reserved.
-- AO17 Academy — жабық оқу платформасы (Supabase / Postgres).
--
-- Орнату: Supabase → SQL Editor → осы файлды толық қойып, Run. Қайта іске қосуға болады (идемпотентті).
-- Ескі бұлттық синхрондауға (schema.sql, cs50kz_*) тиіспейді.
--
-- Рөлдер:
--   * admin   - жалғыз Super Admin. Рөлді тек service_role кілтімен ao_bootstrap_admin() береді,
--               және ол тек әлі бірде-бір admin жоқ кезде жұмыс істейді. Клиент рөлді өзгерте алмайды.
--   * teacher - мұғалім. Рөлді тек Super Admin береді (ao_admin_set_role). Өзі ашқан кластарды ғана басқарады
--               (ao_classes.owner): мазмұн ашу, оқушылар, нәтижелер; жабық мазмұнның бәрін көреді (сабаққа дайындалу үшін).
--   * student - Supabase Auth арқылы тіркелген кез келген адам (email + құпиясөз).
--
-- Рұқсат моделі:
--   * ao_pages        - жабық беттердің каталогы (жол, курс, атауы). tools/gate.py толтырады. Атаулар жария.
--   * ao_classes      - класс, қосылу коды (8 таңба) және шақыру токені (сілтеме үшін).
--   * ao_members      - класс мүшелері.
--   * ao_grants       - класқа не ашылғаны: бүкіл курс (scope=course) не жеке бет (scope=page),
--                       ашық/жабық және мерзімі (opens_at / closes_at). Бет деңгейіндегі жазба курс жазбасынан басым.
--   * ao_asset_refs   - жабық дерек файлдары (assets/data/*.js) қай беттерге керек ('*' - кез келген ашық бетке).
--   * ao_can_view()   - бір ғана шешуші функция: Edge Function (ao-content) мазмұнды тек осы true болғанда береді.
--   * ao_progress     - оқушының прогресі мен тест нәтижелері (өзі жазады, admin оқиды).
--   * ao_assignments  - класқа берілген тапсырма (AO17 CS сабағы не сынағы, мерзімі): мұғалім береді, мүше көреді;
--                       орындалғаны оқушы прогресінен есептеледі (assets/js/ao17-assign.js).

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ======================================================================== кестелер
create table if not exists public.ao_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  display_name  text not null default '' check (length(display_name) <= 80),
  role          text not null default 'student' check (role in ('admin', 'teacher', 'student')),
  must_change_password boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists public.ao_classes (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (length(btrim(title)) between 1 and 80),
  join_code     text not null unique check (join_code ~ '^[2-9A-HJ-NP-Z]{8}$'),
  invite_token  text not null unique check (length(invite_token) = 32),
  join_open     boolean not null default true,      -- жаңа оқушылар қосыла ала ма
  archived      boolean not null default false,     -- мұрағатталған класс мүшелеріне ештеңе ашылмайды
  created_at    timestamptz not null default now()
);

create table if not exists public.ao_members (
  class_id   uuid not null references public.ao_classes(id) on delete cascade,
  user_id    uuid not null references public.ao_profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (class_id, user_id)
);
create index if not exists ao_members_user_idx on public.ao_members(user_id);

create table if not exists public.ao_pages (
  path    text primary key check (path ~ '^[a-z0-9][a-z0-9_./-]*\.html$' and position('..' in path) = 0),
  course  text not null check (course ~ '^[a-z0-9-]{1,32}$'),
  kind    text not null default 'lecture' check (kind in ('lecture', 'task', 'test', 'game', 'page')),
  title   text not null default '',
  sort    integer not null default 0
);
create index if not exists ao_pages_course_idx on public.ao_pages(course);

create table if not exists public.ao_grants (
  id         bigserial primary key,
  class_id   uuid not null references public.ao_classes(id) on delete cascade,
  scope      text not null check (scope in ('course', 'page')),
  target     text not null,
  open       boolean not null default true,
  opens_at   timestamptz,
  closes_at  timestamptz,
  updated_at timestamptz not null default now(),
  unique (class_id, scope, target),
  check (opens_at is null or closes_at is null or opens_at < closes_at)
);

create table if not exists public.ao_asset_refs (
  asset  text not null check (asset ~ '^assets/data/[A-Za-z0-9_.-]+\.js$'),
  page   text not null,                               -- ao_pages.path, 'course:<id>' (курстың кез келген ашық беті) не '*'
  primary key (asset, page)
);

create table if not exists public.ao_progress (
  user_id     uuid primary key references public.ao_profiles(id) on delete cascade,
  snapshot    jsonb not null default '{}'::jsonb check (octet_length(snapshot::text) <= 2000000),
  summary     jsonb not null default '{}'::jsonb check (octet_length(summary::text) <= 20000),
  updated_at  timestamptz not null default now()
);

-- ---------- мұғалім рөлі (2026-11): бұрыннан бар дерекқорда да осы жолдар жаңартады (идемпотентті)
alter table public.ao_profiles drop constraint if exists ao_profiles_role_check;
alter table public.ao_profiles add constraint ao_profiles_role_check check (role in ('admin', 'teacher', 'student'));
alter table public.ao_classes add column if not exists owner uuid references public.ao_profiles(id) on delete set null;   -- класты ашқан мұғалім
create index if not exists ao_classes_owner_idx on public.ao_classes(owner);

-- ---------- тапсырмалар (2026-11): AO17 CS сабағы (сабақ id) не сынағы (режимі), мерзімімен
create table if not exists public.ao_assignments (
  id          bigserial primary key,
  class_id    uuid not null references public.ao_classes(id) on delete cascade,
  kind        text not null check (kind in ('lesson', 'test')),
  target      text not null,
  title       text not null check (length(btrim(title)) between 1 and 160),
  due_at      timestamptz,
  created_by  uuid references public.ao_profiles(id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  unique (class_id, kind, target),
  check ((kind = 'lesson' and target ~ '^ao17-foundation\.m(0[1-9]|1[0-2])\.l(0[1-9]|10)$')
      or (kind = 'test' and target ~ '^(w([1-9]|1[0-2])|p1|p2|final)$'))
);
create index if not exists ao_assignments_class_idx on public.ao_assignments(class_id);

-- ======================================================================== жаңа пайдаланушы → профиль
create or replace function public.ao_on_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.ao_profiles (id, email, display_name)
  values (new.id, new.email, coalesce(left(new.raw_user_meta_data->>'display_name', 80), ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;

drop trigger if exists ao_on_auth_user on auth.users;
create trigger ao_on_auth_user after insert or update of email on auth.users
  for each row execute function public.ao_on_auth_user();

-- Скрипттен бұрын ашылған аккаунттар (мысалы, Dashboard-та алдын ала жасалған әкімші): профильсіз қалмасын
insert into public.ao_profiles (id, email, display_name)
select u.id, u.email, coalesce(left(u.raw_user_meta_data->>'display_name', 80), '') from auth.users u
on conflict (id) do nothing;

-- ======================================================================== көмекшілер
create or replace function public.ao_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ao_profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.ao_is_teacher()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ao_profiles where id = auth.uid() and role = 'teacher');
$$;

-- Класты басқара ала ма: Super Admin - кез келгенін, мұғалім - тек өзі ашқанын (рөлі teacher болып тұрғанда)
create or replace function public.ao_can_manage(p_class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.ao_is_admin()
      or (public.ao_is_teacher() and exists (select 1 from public.ao_classes where id = p_class and owner = auth.uid()));
$$;

-- Ағымдағы пайдаланушы осы кластың мүшесі ме (мұрағатталмаған класс). SECURITY DEFINER: оқушы ao_classes-ті RLS бойынша оқи алмайды
create or replace function public.ao_is_member(p_class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ao_members m join public.ao_classes c on c.id = m.class_id
                 where m.class_id = p_class and m.user_id = auth.uid() and not c.archived);
$$;

-- 8 таңбалы код: адам шатастыратын 0/O, 1/I/L жоқ
create or replace function public.ao_rand_code(n int)
returns text language plpgsql volatile set search_path = public, extensions as $$
declare abc constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; b bytea := extensions.gen_random_bytes(n); s text := '';
begin
  for i in 0..n - 1 loop s := s || substr(abc, 1 + get_byte(b, i) % length(abc), 1); end loop;
  return s;
end $$;

create or replace function public.ao_rand_token()
returns text language sql volatile set search_path = public, extensions as $$
  select encode(extensions.gen_random_bytes(16), 'hex');
$$;

create or replace function public.ao_grant_active(g public.ao_grants)
returns boolean language sql stable as $$
  select g.open and (g.opens_at is null or now() >= g.opens_at) and (g.closes_at is null or now() < g.closes_at);
$$;

-- Бір класс үшін бет ашық па: бет жазбасы бар болса - сол, әйтпесе курс жазбасы, әйтпесе жабық.
create or replace function public.ao_class_allows(p_class uuid, p_path text, p_course text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select public.ao_grant_active(g) from public.ao_grants g where g.class_id = p_class and g.scope = 'page' and g.target = p_path),
    (select public.ao_grant_active(g) from public.ao_grants g where g.class_id = p_class and g.scope = 'course' and g.target = p_course),
    false);
$$;

-- ЖАЛҒЫЗ ШЕШУШІ ФУНКЦИЯ: ағымдағы пайдаланушы осы жабық файлды көре ала ма.
create or replace function public.ao_can_view(p_path text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); pg public.ao_pages;
begin
  if uid is null or p_path is null then return false; end if;
  if public.ao_is_admin() or public.ao_is_teacher() then return true; end if;
  select * into pg from public.ao_pages where path = p_path;
  if found then
    return exists (
      select 1 from public.ao_members m join public.ao_classes c on c.id = m.class_id
      where m.user_id = uid and not c.archived and public.ao_class_allows(c.id, pg.path, pg.course));
  end if;
  -- дерек файлы: оны қолданатын беттің бірі ашық болса
  return exists (
    select 1 from public.ao_asset_refs r
    where r.asset = p_path and (
      (r.page = '*' and exists (
         select 1 from public.ao_members m join public.ao_classes c on c.id = m.class_id
         join public.ao_grants g on g.class_id = c.id
         where m.user_id = uid and not c.archived and public.ao_grant_active(g)))
      or (r.page like 'course:%' and exists (
         select 1 from public.ao_pages p where p.course = substr(r.page, 8) and public.ao_can_view(p.path)))
      or (r.page <> '*' and r.page not like 'course:%' and public.ao_can_view(r.page))));
end $$;

-- ======================================================================== RLS
alter table public.ao_profiles   enable row level security;
alter table public.ao_classes    enable row level security;
alter table public.ao_members    enable row level security;
alter table public.ao_pages      enable row level security;
alter table public.ao_grants     enable row level security;
alter table public.ao_asset_refs enable row level security;
alter table public.ao_progress   enable row level security;
alter table public.ao_assignments enable row level security;

revoke all on public.ao_profiles, public.ao_classes, public.ao_members, public.ao_pages,
              public.ao_grants, public.ao_asset_refs, public.ao_progress, public.ao_assignments from anon, authenticated;

grant select on public.ao_pages to anon, authenticated;                      -- каталог жария (атаулар)
grant select on public.ao_profiles to authenticated;
grant update (display_name) on public.ao_profiles to authenticated;
grant select, insert, update, delete on public.ao_classes, public.ao_grants to authenticated;   -- RLS: тек admin
grant select, delete on public.ao_members to authenticated;                                     -- RLS: admin не өзі
grant select, insert, update on public.ao_progress to authenticated;
grant usage, select on sequence public.ao_grants_id_seq to authenticated;
grant select, insert, update, delete on public.ao_assignments to authenticated;   -- RLS: басқарушы жазады, мүше оқиды
grant usage, select on sequence public.ao_assignments_id_seq to authenticated;

drop policy if exists ao_pages_read on public.ao_pages;
create policy ao_pages_read on public.ao_pages for select using (true);

drop policy if exists ao_profiles_self on public.ao_profiles;
create policy ao_profiles_self on public.ao_profiles for select using (id = auth.uid() or public.ao_is_admin());
drop policy if exists ao_profiles_name on public.ao_profiles;
create policy ao_profiles_name on public.ao_profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Класс: Super Admin - бәрі; мұғалім - өз класы. Мұғалім класты басқа біреуге бере алмайды (with check: owner - өзі)
drop policy if exists ao_classes_admin on public.ao_classes;
create policy ao_classes_admin on public.ao_classes for all using (public.ao_can_manage(id))
  with check (public.ao_is_admin() or (public.ao_is_teacher() and owner = auth.uid()));

drop policy if exists ao_grants_admin on public.ao_grants;
create policy ao_grants_admin on public.ao_grants for all using (public.ao_can_manage(class_id)) with check (public.ao_can_manage(class_id));

drop policy if exists ao_members_read on public.ao_members;
create policy ao_members_read on public.ao_members for select using (user_id = auth.uid() or public.ao_can_manage(class_id));
drop policy if exists ao_members_delete on public.ao_members;
create policy ao_members_delete on public.ao_members for delete using (user_id = auth.uid() or public.ao_can_manage(class_id));

drop policy if exists ao_progress_read on public.ao_progress;
create policy ao_progress_read on public.ao_progress for select using (user_id = auth.uid() or public.ao_is_admin()
  or exists (select 1 from public.ao_members m where m.user_id = ao_progress.user_id and public.ao_can_manage(m.class_id)));
drop policy if exists ao_progress_ins on public.ao_progress;
create policy ao_progress_ins on public.ao_progress for insert with check (user_id = auth.uid());
drop policy if exists ao_progress_upd on public.ao_progress;
create policy ao_progress_upd on public.ao_progress for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Тапсырма: класты басқаратын адам (Super Admin не класс иесі - мұғалім) береді, өзгертеді, өшіреді; класс мүшесі оқиды
drop policy if exists ao_assignments_manage on public.ao_assignments;
create policy ao_assignments_manage on public.ao_assignments for all using (public.ao_can_manage(class_id)) with check (public.ao_can_manage(class_id));
drop policy if exists ao_assignments_member on public.ao_assignments;
create policy ao_assignments_member on public.ao_assignments for select using (public.ao_is_member(class_id));

-- ======================================================================== оқушы функциялары
-- Класқа қосылу: 8 таңбалы код не шақыру токені.
create or replace function public.ao_join(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); c public.ao_classes;
begin
  if uid is null then raise exception 'кіру қажет' using errcode = '28000'; end if;
  if p_code is null or length(p_code) not in (8, 32) then raise exception 'код қате' using errcode = '22023'; end if;
  select * into c from public.ao_classes
   where (join_code = upper(p_code) or invite_token = lower(p_code)) and not archived;
  if not found then raise exception 'код қате' using errcode = 'P0002'; end if;
  if exists (select 1 from public.ao_members where class_id = c.id and user_id = uid) then
    return jsonb_build_object('class_id', c.id, 'title', c.title, 'already', true);
  end if;
  if not c.join_open then raise exception 'класқа қосылу жабық' using errcode = '42501'; end if;
  insert into public.ao_members (class_id, user_id) values (c.id, uid);
  return jsonb_build_object('class_id', c.id, 'title', c.title, 'already', false);
end $$;

create or replace function public.ao_my_classes()
returns table (class_id uuid, title text, joined_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.id, c.title, m.joined_at from public.ao_members m join public.ao_classes c on c.id = m.class_id
  where m.user_id = auth.uid() and not c.archived order by m.joined_at;
$$;

-- Оқушыға қазір ашық беттер (кабинетте тізім үшін; мазмұнды бермейді)
create or replace function public.ao_my_access()
returns table (path text, course text, kind text, title text, sort integer)
language sql stable security definer set search_path = public as $$
  select p.path, p.course, p.kind, p.title, p.sort from public.ao_pages p
  where public.ao_can_view(p.path) order by p.course, p.sort, p.path;
$$;

-- Оқушының тапсырмалары: мүшесі болып тұрған, мұрағатталмаған кластардан (класс атауымен)
create or replace function public.ao_my_assignments()
returns table (id bigint, class_id uuid, class_title text, kind text, target text, title text, due_at timestamptz, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.id, a.class_id, c.title, a.kind, a.target, a.title, a.due_at, a.created_at
  from public.ao_assignments a
  join public.ao_classes c on c.id = a.class_id
  join public.ao_members m on m.class_id = a.class_id and m.user_id = auth.uid()
  where not c.archived
  order by a.due_at nulls last, a.created_at;
$$;

create or replace function public.ao_password_changed()
returns void language sql security definer set search_path = public as $$
  update public.ao_profiles set must_change_password = false where id = auth.uid();
$$;

-- ======================================================================== admin функциялары
create or replace function public.ao_require_admin()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if not public.ao_is_admin() then raise exception 'тек әкімші' using errcode = '42501'; end if;
end $$;

create or replace function public.ao_require_staff()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.ao_is_admin() or public.ao_is_teacher()) then raise exception 'тек мұғалім не әкімші' using errcode = '42501'; end if;
end $$;

create or replace function public.ao_require_manage(p_class uuid)
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if not public.ao_can_manage(p_class) then raise exception 'бұл класты басқаруға рұқсат жоқ' using errcode = '42501'; end if;
end $$;

-- Класс ашу: Super Admin не мұғалім; иесі - ашқан адам
create or replace function public.ao_admin_class_create(p_title text)
returns public.ao_classes language plpgsql security definer set search_path = public as $$
declare r public.ao_classes;
begin
  perform public.ao_require_staff();
  for i in 1..10 loop
    begin
      insert into public.ao_classes (title, join_code, invite_token, owner)
      values (btrim(p_title), public.ao_rand_code(8), public.ao_rand_token(), auth.uid()) returning * into r;
      return r;
    exception when unique_violation then null;  -- сирек код қақтығысы: қайталаймыз
    end;
  end loop;
  raise exception 'код жасалмады';
end $$;

create or replace function public.ao_admin_regen_codes(p_class uuid)
returns public.ao_classes language plpgsql security definer set search_path = public as $$
declare r public.ao_classes;
begin
  perform public.ao_require_manage(p_class);
  update public.ao_classes set join_code = public.ao_rand_code(8), invite_token = public.ao_rand_token()
   where id = p_class returning * into r;
  if not found then raise exception 'класс жоқ' using errcode = 'P0002'; end if;
  return r;
end $$;

create or replace function public.ao_admin_overview()
returns table (id uuid, title text, join_code text, invite_token text, join_open boolean, archived boolean,
               created_at timestamptz, members bigint, grants bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.ao_require_staff();
  return query
    select c.id, c.title, c.join_code, c.invite_token, c.join_open, c.archived, c.created_at,
           (select count(*) from public.ao_members m where m.class_id = c.id),
           (select count(*) from public.ao_grants g where g.class_id = c.id and public.ao_grant_active(g))
    from public.ao_classes c
    where public.ao_is_admin() or c.owner = auth.uid()   -- мұғалім: тек өз кластары
    order by c.archived, c.created_at desc;
end $$;

create or replace function public.ao_admin_members(p_class uuid)
returns table (user_id uuid, email text, display_name text, joined_at timestamptz,
               summary jsonb, snapshot jsonb, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.ao_require_manage(p_class);
  return query
    select p.id, p.email, p.display_name, m.joined_at, coalesce(pr.summary, '{}'::jsonb),
           coalesce(pr.snapshot, '{}'::jsonb), pr.updated_at
    from public.ao_members m join public.ao_profiles p on p.id = m.user_id
    left join public.ao_progress pr on pr.user_id = p.id
    where m.class_id = p_class order by p.display_name, p.email;
end $$;

-- Super Admin мұғалім тағайындайды не мұғалімдікті алады (teacher <-> student). Admin рөлін бұл функция бермейді және алмайды.
create or replace function public.ao_admin_set_role(p_email text, p_role text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.ao_profiles;
begin
  perform public.ao_require_admin();
  if p_role is null or p_role not in ('teacher', 'student') then raise exception 'рөл қате' using errcode = '22023'; end if;
  update public.ao_profiles set role = p_role where lower(email) = lower(btrim(p_email)) and role <> 'admin' returning * into r;
  if not found then raise exception 'пайдаланушы жоқ' using errcode = 'P0002'; end if;
  return jsonb_build_object('id', r.id, 'email', r.email, 'display_name', r.display_name, 'role', r.role);
end $$;

create or replace function public.ao_admin_teachers()
returns table (id uuid, email text, display_name text, classes bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.ao_require_admin();
  return query
    select p.id, p.email, p.display_name, (select count(*) from public.ao_classes c where c.owner = p.id)
    from public.ao_profiles p where p.role = 'teacher' order by p.display_name, p.email;
end $$;

-- Бірінші Super Admin: тек service_role, тек admin әлі жоқ кезде.
create or replace function public.ao_bootstrap_admin(p_email text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and current_user not in ('postgres', 'supabase_admin', 'service_role') then
    raise exception 'тек service_role' using errcode = '42501';
  end if;
  if exists (select 1 from public.ao_profiles where role = 'admin') then
    raise exception 'admin бұрыннан бар' using errcode = '23505';
  end if;
  update public.ao_profiles set role = 'admin', must_change_password = true where lower(email) = lower(p_email);
  if not found then raise exception 'пайдаланушы жоқ' using errcode = 'P0002'; end if;
end $$;

-- ======================================================================== функция құқықтары
-- Әдепкіде Postgres функцияны PUBLIC-қа ашады: ao_* функцияларының бәрінен алып, тек керегін қайта береміз.
do $$
declare f text;
begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'ao\_%' loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
  end loop;
end $$;

grant execute on function public.ao_is_admin(), public.ao_is_teacher(), public.ao_can_manage(uuid), public.ao_is_member(uuid), public.ao_can_view(text), public.ao_join(text),
  public.ao_my_classes(), public.ao_my_access(), public.ao_my_assignments(), public.ao_password_changed(),
  public.ao_admin_class_create(text), public.ao_admin_regen_codes(uuid), public.ao_admin_overview(),
  public.ao_admin_members(uuid), public.ao_admin_set_role(text, text), public.ao_admin_teachers() to authenticated;
-- ao_grant_active, ao_class_allows, ao_rand_*, ao_require_*: тек ішкі (SECURITY DEFINER функциялар иесінің құқығымен шақырады)
grant execute on function public.ao_bootstrap_admin(text) to service_role;
