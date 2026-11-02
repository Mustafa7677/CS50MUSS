-- © 2026 Sagid Mustafa. All Rights Reserved.
-- AO17 Academy — жабық оқу платформасы (Supabase / Postgres).
--
-- Орнату: Supabase → SQL Editor → осы файлды толық қойып, Run. Қайта іске қосуға болады (идемпотентті).
-- Ескі бұлттық синхрондауға (schema.sql, cs50kz_*) тиіспейді.
--
-- Рөлдер:
--   * admin   - жалғыз Super Admin. Рөлді тек service_role кілтімен ao_bootstrap_admin() береді,
--               және ол тек әлі бірде-бір admin жоқ кезде жұмыс істейді. Клиент рөлді өзгерте алмайды.
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

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ======================================================================== кестелер
create table if not exists public.ao_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  display_name  text not null default '' check (length(display_name) <= 80),
  role          text not null default 'student' check (role in ('admin', 'student')),
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

-- ======================================================================== көмекшілер
create or replace function public.ao_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ao_profiles where id = auth.uid() and role = 'admin');
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
  if public.ao_is_admin() then return true; end if;
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

revoke all on public.ao_profiles, public.ao_classes, public.ao_members, public.ao_pages,
              public.ao_grants, public.ao_asset_refs, public.ao_progress from anon, authenticated;

grant select on public.ao_pages to anon, authenticated;                      -- каталог жария (атаулар)
grant select on public.ao_profiles to authenticated;
grant update (display_name) on public.ao_profiles to authenticated;
grant select, insert, update, delete on public.ao_classes, public.ao_grants to authenticated;   -- RLS: тек admin
grant select, delete on public.ao_members to authenticated;                                     -- RLS: admin не өзі
grant select, insert, update on public.ao_progress to authenticated;
grant usage, select on sequence public.ao_grants_id_seq to authenticated;

drop policy if exists ao_pages_read on public.ao_pages;
create policy ao_pages_read on public.ao_pages for select using (true);

drop policy if exists ao_profiles_self on public.ao_profiles;
create policy ao_profiles_self on public.ao_profiles for select using (id = auth.uid() or public.ao_is_admin());
drop policy if exists ao_profiles_name on public.ao_profiles;
create policy ao_profiles_name on public.ao_profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists ao_classes_admin on public.ao_classes;
create policy ao_classes_admin on public.ao_classes for all using (public.ao_is_admin()) with check (public.ao_is_admin());

drop policy if exists ao_grants_admin on public.ao_grants;
create policy ao_grants_admin on public.ao_grants for all using (public.ao_is_admin()) with check (public.ao_is_admin());

drop policy if exists ao_members_read on public.ao_members;
create policy ao_members_read on public.ao_members for select using (user_id = auth.uid() or public.ao_is_admin());
drop policy if exists ao_members_delete on public.ao_members;
create policy ao_members_delete on public.ao_members for delete using (user_id = auth.uid() or public.ao_is_admin());

drop policy if exists ao_progress_read on public.ao_progress;
create policy ao_progress_read on public.ao_progress for select using (user_id = auth.uid() or public.ao_is_admin());
drop policy if exists ao_progress_ins on public.ao_progress;
create policy ao_progress_ins on public.ao_progress for insert with check (user_id = auth.uid());
drop policy if exists ao_progress_upd on public.ao_progress;
create policy ao_progress_upd on public.ao_progress for update using (user_id = auth.uid()) with check (user_id = auth.uid());

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

create or replace function public.ao_admin_class_create(p_title text)
returns public.ao_classes language plpgsql security definer set search_path = public as $$
declare r public.ao_classes;
begin
  perform public.ao_require_admin();
  for i in 1..10 loop
    begin
      insert into public.ao_classes (title, join_code, invite_token)
      values (btrim(p_title), public.ao_rand_code(8), public.ao_rand_token()) returning * into r;
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
  perform public.ao_require_admin();
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
  perform public.ao_require_admin();
  return query
    select c.id, c.title, c.join_code, c.invite_token, c.join_open, c.archived, c.created_at,
           (select count(*) from public.ao_members m where m.class_id = c.id),
           (select count(*) from public.ao_grants g where g.class_id = c.id and public.ao_grant_active(g))
    from public.ao_classes c order by c.archived, c.created_at desc;
end $$;

create or replace function public.ao_admin_members(p_class uuid)
returns table (user_id uuid, email text, display_name text, joined_at timestamptz,
               summary jsonb, snapshot jsonb, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.ao_require_admin();
  return query
    select p.id, p.email, p.display_name, m.joined_at, coalesce(pr.summary, '{}'::jsonb),
           coalesce(pr.snapshot, '{}'::jsonb), pr.updated_at
    from public.ao_members m join public.ao_profiles p on p.id = m.user_id
    left join public.ao_progress pr on pr.user_id = p.id
    where m.class_id = p_class order by p.display_name, p.email;
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

grant execute on function public.ao_is_admin(), public.ao_can_view(text), public.ao_join(text),
  public.ao_my_classes(), public.ao_my_access(), public.ao_password_changed(),
  public.ao_admin_class_create(text), public.ao_admin_regen_codes(uuid), public.ao_admin_overview(),
  public.ao_admin_members(uuid) to authenticated;
-- ao_grant_active, ao_class_allows, ao_rand_*: тек ішкі (SECURITY DEFINER функциялар иесінің құқығымен шақырады)
grant execute on function public.ao_bootstrap_admin(text) to service_role;
