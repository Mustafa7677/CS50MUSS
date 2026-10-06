-- CS50 қазақша — бұлттық синхрондау (Supabase / Postgres)
--
-- Қалай орнатылады: Supabase → SQL Editor → осы файлды толық қойып, Run.
-- Қайта іске қосуға болады (идемпотентті).
--
-- Қауіпсіздік моделі:
--   * Клиент кестелерге тікелей қол жеткізе алмайды (RLS қосулы, саясат жоқ, құқықтар алынған).
--   * Барлық әрекет SECURITY DEFINER функциялары арқылы ғана жүреді.
--   * Оқушы: жария ID (KZ-XXXX-XXXX) + құпия код. Құпия тек bcrypt-хэш түрінде сақталады.
--   * Мұғалім: сынып коды + мұғалім құпиясөзі (bcrypt). Сынып тізімін тек сол көреді.
--   * Сақталатыны: аты, сынып коды, прогресс (JSON). Электрондық пошта, телефон т.б. жоқ.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.cs50kz_classes (
  code        text primary key check (code ~ '^[2-9A-HJ-NP-Z]{6}$'),
  title       text not null check (length(title) between 1 and 80),
  teacher_hash text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.cs50kz_students (
  id          text primary key check (id ~ '^KZ-[0-9A-Z]{4}-[0-9A-Z]{4}$'),
  secret_hash text not null,
  name        text not null default '' check (length(name) <= 60),
  class_code  text references public.cs50kz_classes(code) on delete set null,
  data        jsonb not null default '{}'::jsonb,
  summary     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists cs50kz_students_class_idx on public.cs50kz_students(class_code);

alter table public.cs50kz_classes enable row level security;
alter table public.cs50kz_students enable row level security;
revoke all on public.cs50kz_classes, public.cs50kz_students from anon, authenticated;

-- Құпиялардың форматы: 8 таңба (оқушы), 6+ таңба (мұғалім)
create or replace function public.cs50kz_check_secret(p text, min_len int)
returns void language plpgsql immutable as $$
begin
  if p is null or length(p) < min_len or length(p) > 64 then
    raise exception 'bad secret' using errcode = '22023';
  end if;
end $$;

-- ---------- Оқушы: прогресті жіберу (жоқ болса — тіркеу) ----------
create or replace function public.cs50kz_push(
  p_id text, p_secret text, p_name text, p_class text, p_data jsonb, p_summary jsonb)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  r public.cs50kz_students;
  cls text := nullif(upper(trim(coalesce(p_class, ''))), '');
begin
  perform public.cs50kz_check_secret(p_secret, 8);
  if pg_column_size(p_data) > 150000 or pg_column_size(p_summary) > 4000 then
    raise exception 'too large' using errcode = '22023';
  end if;
  if cls is not null and not exists (select 1 from public.cs50kz_classes where code = cls) then
    cls := null;
  end if;
  select * into r from public.cs50kz_students where id = p_id for update;
  if not found then
    insert into public.cs50kz_students(id, secret_hash, name, class_code, data, summary)
    values (p_id, crypt(p_secret, gen_salt('bf', 8)), left(coalesce(p_name, ''), 60), cls,
            coalesce(p_data, '{}'::jsonb), coalesce(p_summary, '{}'::jsonb))
    returning * into r;
  else
    if r.secret_hash <> crypt(p_secret, r.secret_hash) then
      raise exception 'wrong secret' using errcode = '28000';
    end if;
    update public.cs50kz_students
       set name = left(coalesce(nullif(p_name, ''), name), 60),
           class_code = coalesce(cls, class_code),
           data = coalesce(p_data, data),
           summary = coalesce(p_summary, summary),
           updated_at = now()
     where id = p_id
     returning * into r;
  end if;
  return jsonb_build_object('updated_at', r.updated_at, 'class_code', r.class_code,
    'class_title', (select title from public.cs50kz_classes where code = r.class_code));
end $$;

-- ---------- Оқушы: прогресті алу (басқа құрылғыда кіру) ----------
create or replace function public.cs50kz_pull(p_id text, p_secret text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare r public.cs50kz_students;
begin
  perform public.cs50kz_check_secret(p_secret, 8);
  select * into r from public.cs50kz_students where id = p_id;
  if not found or r.secret_hash <> crypt(p_secret, r.secret_hash) then
    perform pg_sleep(0.5); -- құпияны теріп табуды баяулату
    raise exception 'not found or wrong secret' using errcode = '28000';
  end if;
  return jsonb_build_object('id', r.id, 'name', r.name, 'class_code', r.class_code,
    'class_title', (select title from public.cs50kz_classes where code = r.class_code),
    'data', r.data, 'updated_at', r.updated_at);
end $$;

-- ---------- Оқушы: сыныптан шығу ----------
create or replace function public.cs50kz_leave_class(p_id text, p_secret text)
returns void
language plpgsql security definer set search_path = public, extensions as $$
declare r public.cs50kz_students;
begin
  select * into r from public.cs50kz_students where id = p_id;
  if not found or r.secret_hash <> crypt(p_secret, r.secret_hash) then
    raise exception 'wrong secret' using errcode = '28000';
  end if;
  update public.cs50kz_students set class_code = null, updated_at = now() where id = p_id;
end $$;

-- ---------- Сынып атауы (оқушы қосылар алдында тексереді) ----------
create or replace function public.cs50kz_class_info(p_code text)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('code', code, 'title', title)
    from public.cs50kz_classes where code = upper(trim(p_code));
$$;

-- ---------- Мұғалім: сынып ашу ----------
create or replace function public.cs50kz_class_create(p_title text, p_teacher_secret text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  abc constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  c text; i int;
begin
  perform public.cs50kz_check_secret(p_teacher_secret, 6);
  loop
    c := '';
    for i in 1..6 loop
      c := c || substr(abc, 1 + (get_byte(gen_random_bytes(1), 0) % length(abc)), 1);
    end loop;
    exit when not exists (select 1 from public.cs50kz_classes where code = c);
  end loop;
  insert into public.cs50kz_classes(code, title, teacher_hash)
  values (c, left(trim(p_title), 80), crypt(p_teacher_secret, gen_salt('bf', 8)));
  return jsonb_build_object('code', c, 'title', left(trim(p_title), 80));
end $$;

-- ---------- Мұғалім: сынып кестесі ----------
create or replace function public.cs50kz_class_view(p_code text, p_teacher_secret text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare k public.cs50kz_classes;
begin
  select * into k from public.cs50kz_classes where code = upper(trim(p_code));
  if not found or k.teacher_hash <> crypt(p_teacher_secret, k.teacher_hash) then
    perform pg_sleep(0.5);
    raise exception 'wrong class or password' using errcode = '28000';
  end if;
  return jsonb_build_object('code', k.code, 'title', k.title, 'students', coalesce((
    select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'summary', s.summary, 'updated_at', s.updated_at)
                     order by s.name)
      from public.cs50kz_students s where s.class_code = k.code), '[]'::jsonb));
end $$;

-- ---------- Мұғалім: оқушыны сыныптан шығару ----------
create or replace function public.cs50kz_class_remove(p_code text, p_teacher_secret text, p_id text)
returns void
language plpgsql security definer set search_path = public, extensions as $$
declare k public.cs50kz_classes;
begin
  select * into k from public.cs50kz_classes where code = upper(trim(p_code));
  if not found or k.teacher_hash <> crypt(p_teacher_secret, k.teacher_hash) then
    raise exception 'wrong class or password' using errcode = '28000';
  end if;
  update public.cs50kz_students set class_code = null where id = p_id and class_code = k.code;
end $$;

revoke all on function public.cs50kz_check_secret(text, int) from public, anon, authenticated;
grant execute on function
  public.cs50kz_push(text, text, text, text, jsonb, jsonb),
  public.cs50kz_pull(text, text),
  public.cs50kz_leave_class(text, text),
  public.cs50kz_class_info(text),
  public.cs50kz_class_create(text, text),
  public.cs50kz_class_view(text, text),
  public.cs50kz_class_remove(text, text, text)
to anon, authenticated;
