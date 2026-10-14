-- QazaqCode: ЖЕРГІЛІКТІ ӘЗІРЛЕУ/ТЕСТ ҮШІН ҒАНА. Supabase-те `auth` схемасы дайын, бұл файлды ОНДА ІСКЕ ҚОСПАҢЫЗ.
-- Supabase-тің auth.users / auth.uid() / auth.jwt() интерфейсін қайталайтын шағын шим.
create extension if not exists pgcrypto;
create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  encrypted_password text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')
  )::uuid
$$;

create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
$$;

do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function auth.jwt() to anon, authenticated, service_role;

-- Жергілікті тіркелу/кіру (тек dev): құпиясөз pgcrypto-мен хэштеледі.
create schema if not exists auth_dev;
create or replace function auth_dev.sign_up(p_email text, p_password text, p_name text) returns uuid
language plpgsql security definer set search_path = auth, public as $$
declare v uuid;
begin
  if length(p_password) < 8 then raise exception 'weak_password'; end if;
  insert into auth.users(email, encrypted_password, raw_user_meta_data)
  values (lower(trim(p_email)), crypt(p_password, gen_salt('bf', 10)), jsonb_build_object('full_name', p_name))
  returning id into v;
  return v;
exception when unique_violation then raise exception 'email_taken';
end $$;
create or replace function auth_dev.sign_in(p_email text, p_password text) returns uuid
language sql security definer set search_path = auth, public as $$
  select id from auth.users where email = lower(trim(p_email)) and encrypted_password = crypt(p_password, encrypted_password)
$$;
revoke all on schema auth_dev from public;
revoke all on function auth_dev.sign_up(text, text, text), auth_dev.sign_in(text, text) from public;
