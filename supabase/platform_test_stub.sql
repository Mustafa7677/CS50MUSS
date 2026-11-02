-- © 2026 Sagid Mustafa. All Rights Reserved.
-- Supabase-сіз таза Postgres-те тест үшін: auth схемасы мен рөлдердің ең аз имитациясы.
-- ӨНДІРІСКЕ ҚОЛДАНБАҢЫЗ (Supabase-те бұлар бұрыннан бар).
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub', '')::uuid $$;
create function auth.role() returns text language sql stable as $$
  select current_setting('request.jwt.claims', true)::jsonb->>'role' $$;
grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
