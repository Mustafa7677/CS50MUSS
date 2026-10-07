-- CS50 қазақша — бұлттық синхрондау (Supabase / Postgres)
--
-- Қалай орнатылады: Supabase → SQL Editor → осы файлды толық қойып, Run.
-- Қайта іске қосуға болады (идемпотентті).
--
-- Қауіпсіздік моделі:
--   * Клиент кестелерге тікелей қол жеткізе алмайды (RLS қосулы, саясат жоқ, құқықтар алынған).
--   * Барлық әрекет SECURITY DEFINER функциялары арқылы ғана жүреді.
--   * Әр функция құпияны алдымен тексереді (NULL/бос құпия қабылданбайды), салыстыру IS DISTINCT FROM арқылы.
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

-- Мұғалімнің сыныпқа берген тапсырмасы: {"lecture": "week-3", "due": "2026-10-10", "note": "..."}
alter table public.cs50kz_classes add column if not exists task jsonb;

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
    if r.secret_hash is distinct from crypt(p_secret, r.secret_hash) then
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
    'class_title', (select title from public.cs50kz_classes where code = r.class_code),
    'class_task', (select task from public.cs50kz_classes where code = r.class_code));
end $$;

-- ---------- Оқушы: прогресті алу (басқа құрылғыда кіру) ----------
create or replace function public.cs50kz_pull(p_id text, p_secret text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare r public.cs50kz_students;
begin
  perform public.cs50kz_check_secret(p_secret, 8);
  select * into r from public.cs50kz_students where id = p_id;
  if not found or r.secret_hash is distinct from crypt(p_secret, r.secret_hash) then
    perform pg_sleep(0.5); -- құпияны теріп табуды баяулату
    raise exception 'not found or wrong secret' using errcode = '28000';
  end if;
  return jsonb_build_object('id', r.id, 'name', r.name, 'class_code', r.class_code,
    'class_title', (select title from public.cs50kz_classes where code = r.class_code),
    'class_task', (select task from public.cs50kz_classes where code = r.class_code),
    'data', r.data, 'updated_at', r.updated_at);
end $$;

-- ---------- Оқушы: сыныптан шығу ----------
create or replace function public.cs50kz_leave_class(p_id text, p_secret text)
returns void
language plpgsql security definer set search_path = public, extensions as $$
declare r public.cs50kz_students;
begin
  perform public.cs50kz_check_secret(p_secret, 8);
  select * into r from public.cs50kz_students where id = p_id;
  if not found or r.secret_hash is distinct from crypt(p_secret, r.secret_hash) then
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
  perform public.cs50kz_check_secret(p_teacher_secret, 6);
  select * into k from public.cs50kz_classes where code = upper(trim(p_code));
  if not found or k.teacher_hash is distinct from crypt(p_teacher_secret, k.teacher_hash) then
    perform pg_sleep(0.5);
    raise exception 'wrong class or password' using errcode = '28000';
  end if;
  return jsonb_build_object('code', k.code, 'title', k.title, 'task', k.task, 'students', coalesce((
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
  perform public.cs50kz_check_secret(p_teacher_secret, 6);
  select * into k from public.cs50kz_classes where code = upper(trim(p_code));
  if not found or k.teacher_hash is distinct from crypt(p_teacher_secret, k.teacher_hash) then
    raise exception 'wrong class or password' using errcode = '28000';
  end if;
  update public.cs50kz_students set class_code = null where id = p_id and class_code = k.code;
end $$;

-- ---------- Мұғалім: сыныпқа тапсырма беру (p_lecture бос болса — тапсырманы алып тастау) ----------
create or replace function public.cs50kz_class_set_task(p_code text, p_teacher_secret text, p_lecture text, p_due date, p_note text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare k public.cs50kz_classes; t jsonb;
begin
  perform public.cs50kz_check_secret(p_teacher_secret, 6);
  select * into k from public.cs50kz_classes where code = upper(trim(p_code));
  if not found or k.teacher_hash is distinct from crypt(p_teacher_secret, k.teacher_hash) then
    perform pg_sleep(0.5);
    raise exception 'wrong class or password' using errcode = '28000';
  end if;
  if coalesce(p_lecture, '') = '' then
    t := null;
  elsif p_lecture !~ '^(week-([0-9]|10)|ai)$' then
    raise exception 'bad lecture' using errcode = '22023';
  else
    t := jsonb_build_object('lecture', p_lecture, 'due', p_due, 'note', left(coalesce(trim(p_note), ''), 200), 'set', now());
  end if;
  update public.cs50kz_classes set task = t where code = k.code;
  return coalesce(t, 'null'::jsonb);
end $$;

revoke all on function public.cs50kz_check_secret(text, int) from public, anon, authenticated;
grant execute on function
  public.cs50kz_push(text, text, text, text, jsonb, jsonb),
  public.cs50kz_pull(text, text),
  public.cs50kz_leave_class(text, text),
  public.cs50kz_class_info(text),
  public.cs50kz_class_create(text, text),
  public.cs50kz_class_view(text, text),
  public.cs50kz_class_remove(text, text, text),
  public.cs50kz_class_set_task(text, text, text, date, text)
to anon, authenticated;

-- ---------- Кері байланыс: аударма қатесі, түсініксіз жер, ұсыныс ----------
-- Тек қосуға болады; оқу — Supabase панелінен (Table Editor → cs50kz_feedback).
create table if not exists public.cs50kz_feedback (
  id         bigserial primary key,
  kind       text not null check (kind in ('translation', 'code', 'unclear', 'idea', 'other')),
  page       text not null check (length(page) <= 200),
  section    text not null default '' check (length(section) <= 200),
  quote      text not null default '' check (length(quote) <= 600),
  message    text not null check (length(message) between 1 and 2000),
  student_id text,
  status     text not null default 'new' check (status in ('new', 'fixed', 'wontfix')),
  created_at timestamptz not null default now()
);
alter table public.cs50kz_feedback enable row level security;
revoke all on public.cs50kz_feedback from anon, authenticated;

create or replace function public.cs50kz_feedback_send(
  p_kind text, p_page text, p_section text, p_quote text, p_message text, p_student text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare new_id bigint;
begin
  if coalesce(trim(p_message), '') = '' then
    raise exception 'empty message' using errcode = '22023';
  end if;
  -- Қарапайым шектеу: соңғы минутта барлығы 30-дан көп хабар қабылданбайды
  if (select count(*) from public.cs50kz_feedback where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'too many messages, try later' using errcode = '54000';
  end if;
  insert into public.cs50kz_feedback(kind, page, section, quote, message, student_id)
  values (coalesce(nullif(p_kind, ''), 'other'), left(coalesce(p_page, ''), 200), left(coalesce(p_section, ''), 200),
          left(coalesce(p_quote, ''), 600), left(trim(p_message), 2000),
          case when p_student ~ '^KZ-[0-9A-Z]{4}-[0-9A-Z]{4}$' then p_student end)
  returning id into new_id;
  return jsonb_build_object('id', new_id);
end $$;

grant execute on function public.cs50kz_feedback_send(text, text, text, text, text, text) to anon, authenticated;

-- Supabase API (PostgREST) жаңа функцияларды бірден көруі үшін кэшті жаңарту
notify pgrst, 'reload schema';
