-- 0010: қауіпсіздік аудитінен кейінгі қатаңдату (docs/SECURITY-AUDIT.md).
-- 1) schema_migrations: RLS + клиент рөлдеріне құқық жоқ (Supabase PostgREST арқылы көрінбеуі тиіс)
-- 2) әдепкі құқықтар (default privileges): болашақ кесте/функция/тізбектер anon/authenticated/PUBLIC-ке автоматты ашылмайды
-- 3) кестелерде артық грант (INSERT/DELETE/TRUNCATE/...) жоқ; anon-да кесте құқығы жоқ
-- 4) функциялар: PUBLIC EXECUTE алынады; authenticated тек қолданыстағы тізім; ішкі функциялар жабық; anon тек 3 алдын ала қарау
-- 5) audit_logs өзгермейді (append-only); қосымша маңызды әрекеттер жазылады; экспортты жазатын audit_export()

-- ---------- 1) schema_migrations ----------
alter table public.schema_migrations enable row level security;
revoke all on public.schema_migrations from public, anon, authenticated;

-- ---------- 2) әдепкі құқықтар ----------
alter default privileges revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- ---------- 3) кесте құқықтары ----------
do $$
declare r record;
begin
  for r in select c.oid::regclass as t, c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f') loop
    execute format('revoke all on %s from anon', r.t);
    execute format('revoke insert, delete, truncate, references, trigger on %s from authenticated', r.t);
    -- UPDATE: тек бағандық грант бар кестелер (profiles.full_name/locale) қалады
    if r.relname <> 'profiles' then
      execute format('revoke update on %s from authenticated', r.t);
    end if;
  end loop;
end $$;
revoke all on all sequences in schema public from public, anon, authenticated;

-- ---------- 4) функциялар ----------
do $$
declare
  r record;
  keep oid[] := '{}';
  -- клиентке ешқашан берілмейтін ішкі функциялар
  internal text[] := array['notify', 'audit_log', 'new_join_code', 'handle_new_user', 'audit_trigger', 'audit_event_trigger',
                           'audit_logs_guard', 'require_user', 'plan_limits'];
begin
  for r in
    select p.oid, p.proname, p.prorettype
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')   -- кеңейту (pgcrypto) функциялары емес
  loop
    if r.proname = any (internal) or r.proname like 'trg\_%' or r.prorettype = 'pg_catalog.trigger'::regtype then continue; end if;
    -- қазіргі уақытта authenticated орындай алатындар сақталады (бұрын PUBLIC не тікелей грант арқылы)
    if has_function_privilege('authenticated', r.oid, 'execute') then keep := keep || r.oid; end if;
  end loop;

  for r in
    select p.oid, p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    if r.oid = any (keep) then execute format('grant execute on function %s to authenticated', r.sig); end if;
  end loop;
end $$;
-- Аноним (кіру/тіркелу беттері): тек қауіпсіз алдын ала қарау
grant execute on function public.org_branding(text), public.invitation_preview(text), public.classroom_preview(text) to anon;

-- ---------- 5) аудит журналы ----------
-- Өзгермейді: UPDATE/DELETE тыйым (ұйым өшкенде FK `org_id := null` ғана рұқсат)
create or replace function public.audit_logs_guard() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE' and new.org_id is null
     and (to_jsonb(new) - 'org_id') = (to_jsonb(old) - 'org_id') then
    return new;
  end if;
  raise exception 'audit_immutable';
end $$;
drop trigger if exists audit_logs_immutable on public.audit_logs;
create trigger audit_logs_immutable before update or delete on public.audit_logs
  for each row execute function public.audit_logs_guard();

-- Қосымша маңызды әрекеттер (қолданыстағы функцияларды өзгертпей, триггер арқылы)
create or replace function public.audit_event_trigger() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_table_name = 'classrooms' and tg_op = 'UPDATE' then
    if new.join_code is distinct from old.join_code then
      perform public.audit_log(new.org_id, 'classroom.join_code_regenerated', 'classroom', new.id::text, '{}');
    end if;
    if new.join_enabled is distinct from old.join_enabled then
      perform public.audit_log(new.org_id, 'classroom.join_toggle', 'classroom', new.id::text, jsonb_build_object('enabled', new.join_enabled));
    end if;
    if new.status is distinct from old.status then
      perform public.audit_log(new.org_id, 'classroom.status', 'classroom', new.id::text, jsonb_build_object('status', new.status));
    end if;
  elsif tg_table_name = 'classroom_students' and tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      perform public.audit_log(new.org_id, 'classroom.student_' || new.status, 'classroom', new.classroom_id::text, jsonb_build_object('student_id', new.student_id));
    end if;
  elsif tg_table_name = 'invitations' and tg_op = 'UPDATE' then
    if old.revoked_at is null and new.revoked_at is not null then
      perform public.audit_log(new.org_id, 'invitation.revoke', 'invitation', new.id::text, '{}');
    end if;
  end if;
  return new;
end $$;
drop trigger if exists audit_classrooms_events on public.classrooms;
create trigger audit_classrooms_events after update on public.classrooms for each row execute function public.audit_event_trigger();
drop trigger if exists audit_classroom_students_events on public.classroom_students;
create trigger audit_classroom_students_events after update on public.classroom_students for each row execute function public.audit_event_trigger();
drop trigger if exists audit_invitations_events on public.invitations;
create trigger audit_invitations_events after update on public.invitations for each row execute function public.audit_event_trigger();

-- Деректерді экспорттау (CSV/XLSX/PDF) - жеке деректің шығуы: журналға жазылады
create or replace function public.audit_export(p_org uuid, p_kind text, p_entity_id text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_kind not in ('school_report', 'class_report', 'class_csv', 'school_csv') then raise exception 'invalid_input'; end if;
  if not public.is_org_staff(p_org) then raise exception 'forbidden'; end if;
  perform public.audit_log(p_org, 'export.' || p_kind, 'export', p_entity_id, '{}');
end $$;
revoke all on function public.audit_export(uuid, text, text) from public, anon;
grant execute on function public.audit_export(uuid, text, text) to authenticated;
