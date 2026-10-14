-- QazaqCode Platform: 0009 - лицензия басқару UI-ына арналған функциялар.
-- 1) set_license: өткен мерзім қойылғанда valid_from тексерісі құламайды, аудитке лимиттер жазылады
-- 2) extend_license: мерзімді ұзарту (қолданыстағы мерзімнен не бүгіннен, қайсысы кеш)
-- 3) licence_usage: мектеп әкімшісіне лицензия мен қолданылу (SECURITY INVOKER, тек әкімші)
-- 4) licence_notice: барлық мүшеге банер үшін мерзім (тек күй мен күн, лимиттерсіз)
-- 5) update_org_settings: логотип тек https, түстер дұрыс пішімде (DB деңгейінде де)
-- 6) create_invitation/accept_invitation: мұғалім шақыру лицензия мерзімі өткенде бұғатталады

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

-- ---------- 6) мұғалім шақыру/қабылдау: лицензия мерзімі өтсе бұғатталады (әкімші шақыруы - платформа әкімшісіне ашық) ----------
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
  if p_role <> 'school_admin' and not public.license_ok(p_org) then raise exception 'license_expired'; end if;
  if p_ttl_hours < 1 or p_ttl_hours > 24 * 30 then raise exception 'invalid_ttl'; end if;
  insert into public.invitations (org_id, role, email, token_hash, expires_at, created_by)
  values (p_org, p_role, nullif(lower(trim(p_email)), ''), encode(digest(v_token, 'sha256'), 'hex'), now() + make_interval(hours => p_ttl_hours), auth.uid());
  perform public.audit_log(p_org, 'invitation.create', 'invitation', null, jsonb_build_object('role', p_role));
  return v_token;
end $$;

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
  if v_inv.role = 'teacher' and not public.license_ok(v_inv.org_id) then raise exception 'license_expired'; end if;
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

grant execute on function public.extend_license(uuid, integer), public.licence_usage(uuid), public.licence_notice(uuid) to authenticated;
