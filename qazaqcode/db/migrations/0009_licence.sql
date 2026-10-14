-- QazaqCode Platform: 0009 - лицензия басқару UI-ына арналған функциялар.
-- 1) set_license: өткен мерзім қойылғанда valid_from тексерісі құламайды, аудитке лимиттер жазылады
-- 2) extend_license: мерзімді ұзарту (қолданыстағы мерзімнен не бүгіннен, қайсысы кеш)
-- 3) licence_usage: мектеп әкімшісіне лицензия мен қолданылу (SECURITY INVOKER, тек әкімші)
-- 4) licence_notice: барлық мүшеге банер үшін мерзім (тек күй мен күн, лимиттерсіз)
-- 5) update_org_settings: логотип тек https, түстер дұрыс пішімде (DB деңгейінде де)

-- ---------- 1) set_license ----------
create or replace function public.set_license(
  p_org uuid, p_plan public.license_plan, p_max_students integer, p_max_teachers integer,
  p_valid_until date, p_status text default 'active', p_notes text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('active', 'suspended') then raise exception 'invalid_status'; end if;
  if p_max_students is null or p_max_teachers is null or p_max_students < 0 or p_max_teachers < 0 or p_valid_until is null then raise exception 'invalid_input'; end if;
  if not exists (select 1 from public.organizations where id = p_org) then raise exception 'not_found'; end if;
  insert into public.licenses (org_id, plan, max_students, max_teachers, valid_from, valid_until, status, notes, created_by)
  values (p_org, p_plan, p_max_students, p_max_teachers, least(current_date, p_valid_until), p_valid_until, p_status, nullif(trim(p_notes), ''), auth.uid())
  on conflict (org_id) do update set plan = excluded.plan, max_students = excluded.max_students, max_teachers = excluded.max_teachers,
    valid_from = least(public.licenses.valid_from, excluded.valid_until),
    valid_until = excluded.valid_until, status = excluded.status, notes = excluded.notes;
  perform public.audit_log(p_org, 'license.set', 'license', p_org::text, jsonb_build_object(
    'plan', p_plan, 'max_students', p_max_students, 'max_teachers', p_max_teachers, 'valid_until', p_valid_until, 'status', p_status));
end $$;

-- лицензия өзгерісін енді тек осы функциялар аудитке жазады (қайталанбау үшін триггер алынады)
drop trigger if exists audit_licenses on public.licenses;

-- ---------- 2) extend_license ----------
create or replace function public.extend_license(p_org uuid, p_months integer)
returns date language plpgsql security definer set search_path = public, pg_temp as $$
declare l public.licenses; v_new date;
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if p_months is null or p_months < 1 or p_months > 60 then raise exception 'invalid_input'; end if;
  select * into l from public.licenses where org_id = p_org for update;
  if not found then raise exception 'not_found'; end if;
  v_new := (greatest(l.valid_until, current_date) + make_interval(months => p_months))::date;
  update public.licenses set valid_until = v_new where org_id = p_org;
  perform public.audit_log(p_org, 'license.extend', 'license', p_org::text,
    jsonb_build_object('months', p_months, 'from', l.valid_until, 'valid_until', v_new));
  return v_new;
end $$;

-- ---------- 3) licence_usage: тек мектеп әкімшісі, RLS арқылы ----------
create or replace function public.licence_usage(p_org uuid)
returns table (plan public.license_plan, state text, status text, valid_from date, valid_until date, days_left integer,
               max_students integer, max_teachers integer, students bigint, teachers bigint, notes text)
language plpgsql stable security invoker set search_path = public, pg_temp as $$
begin
  if not public.is_org_admin(p_org) then raise exception 'forbidden'; end if;
  return query
  select l.plan, public.license_state(p_org), l.status, l.valid_from, l.valid_until, (l.valid_until - current_date)::integer,
    l.max_students, l.max_teachers,
    (select count(*) from public.organization_members m where m.org_id = p_org and m.role = 'student' and m.status = 'active'),
    (select count(*) from public.organization_members m where m.org_id = p_org and m.role = 'teacher' and m.status = 'active'),
    l.notes
  from public.licenses l where l.org_id = p_org;
end $$;

-- ---------- 4) licence_notice: ұйымның кез келген мүшесіне банер үшін ----------
create or replace function public.licence_notice(p_org uuid)
returns table (state text, valid_until date, days_left integer)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_org_member(p_org) then raise exception 'forbidden'; end if;
  return query
  select public.license_state(p_org), l.valid_until, (l.valid_until - current_date)::integer
  from public.licenses l where l.org_id = p_org;
end $$;

-- ---------- 5) update_org_settings: қатаң тексеру ----------
create or replace function public.update_org_settings(
  p_org uuid, p_logo_url text, p_primary text, p_secondary text, p_welcome text, p_email text, p_phone text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not (public.is_org_admin(p_org) or public.is_platform_admin()) then raise exception 'forbidden'; end if;
  if nullif(trim(p_logo_url), '') is not null and (trim(p_logo_url) !~* '^https://[^\s<>"'']+$' or char_length(trim(p_logo_url)) > 500) then raise exception 'invalid_input'; end if;
  if nullif(p_primary, '') is not null and p_primary !~ '^#[0-9a-fA-F]{6}$' then raise exception 'invalid_input'; end if;
  if nullif(p_secondary, '') is not null and p_secondary !~ '^#[0-9a-fA-F]{6}$' then raise exception 'invalid_input'; end if;
  update public.organization_settings set
    logo_url = nullif(trim(p_logo_url), ''), primary_color = coalesce(nullif(p_primary, ''), primary_color),
    secondary_color = coalesce(nullif(p_secondary, ''), secondary_color), welcome_text = nullif(trim(p_welcome), ''),
    contact_email = nullif(trim(p_email), ''), contact_phone = nullif(trim(p_phone), ''), updated_at = now()
  where org_id = p_org;
  if not found then raise exception 'not_found'; end if;
  perform public.audit_log(p_org, 'organization.settings', 'organization', p_org::text, '{}');
end $$;

grant execute on function public.extend_license(uuid, integer), public.licence_usage(uuid), public.licence_notice(uuid) to authenticated;
