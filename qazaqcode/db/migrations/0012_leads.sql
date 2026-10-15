-- QazaqCode Platform: 0012 - «Пилот сұрауы» воронкасы (leads).
-- Жария беттен (anon) келген нақты сұраулар. Жеке деректі МИНИМУМДА сақтаймыз: ұйым, байланыс адамы, e-mail, (ерікті) телефон, хабар.
-- Құпиялылық: деректер тек пилот туралы байланысу үшін; 365 күннен кейін өшіріледі (purge_old_leads, scripts/leads-purge.mjs);
-- үшінші тарапқа берілмейді; тек платформа әкімшісі (SUPER ADMIN) көреді. Келісім (consent) міндетті және уақыты жазылады.
-- Жазу: ТЕК төмендегі SECURITY DEFINER RPC. Кестеге тікелей INSERT/UPDATE/DELETE жабық (anon-да ештеңе жоқ).

create table public.leads (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  org_name          text not null check (char_length(org_name) between 2 and 160),
  contact_name      text not null check (char_length(contact_name) between 2 and 120),
  email             text not null check (char_length(email) <= 160 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone             text check (phone is null or char_length(phone) between 5 and 40),
  role              text not null check (role in ('director', 'deputy', 'teacher', 'it', 'other')),
  org_type          text not null check (org_type in ('school', 'college', 'academy', 'other')),
  students_estimate int check (students_estimate is null or students_estimate between 1 and 100000),
  message           text check (message is null or char_length(message) <= 1000),
  consent           boolean not null check (consent),
  consent_at        timestamptz not null default now(),
  status            text not null default 'new' check (status in ('new', 'contacted', 'demo', 'pilot', 'won', 'lost')),
  notes             text check (notes is null or char_length(notes) <= 2000),
  source            text check (source is null or char_length(source) <= 60)
);
create index leads_created_idx on public.leads (created_at desc);
create index leads_email_created_idx on public.leads (email, created_at desc);

alter table public.leads enable row level security;
create policy leads_select on public.leads for select to authenticated using (public.is_platform_admin());
revoke all on public.leads from public, anon, authenticated;
grant select on public.leads to authenticated;   -- RLS: тек платформа әкімшісі; жазу құқығы жоқ

-- ---------- Қабылдау (anon + authenticated) ----------
-- Бір e-mail-ден 24 сағатта 1 ғана жаңа жол. Қайталанса да «сәтті» (true) қайтарады: e-mail бар-жоғы ағып кетпейді.
-- Жалпы қорғаныс: сағатына 200-ден көп сұрау келсе 'rate_limited' (қосымша IP лимитінен тыс соңғы қабат).
create or replace function public.submit_lead(
  p_org_name text, p_contact_name text, p_email text, p_phone text, p_role text, p_org_type text,
  p_students int, p_message text, p_consent boolean, p_source text default null)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_org text := btrim(coalesce(p_org_name, ''));
  v_contact text := btrim(coalesce(p_contact_name, ''));
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_msg text := nullif(btrim(coalesce(p_message, '')), '');
  v_src text := nullif(btrim(coalesce(p_source, '')), '');
begin
  if p_consent is distinct from true then raise exception 'invalid_input'; end if;
  if char_length(v_org) not between 2 and 160 or char_length(v_contact) not between 2 and 120 then raise exception 'invalid_input'; end if;
  if char_length(v_email) > 160 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'invalid_input'; end if;
  if v_phone is not null and char_length(v_phone) not between 5 and 40 then raise exception 'invalid_input'; end if;
  if p_role is null or p_role not in ('director', 'deputy', 'teacher', 'it', 'other') then raise exception 'invalid_input'; end if;
  if p_org_type is null or p_org_type not in ('school', 'college', 'academy', 'other') then raise exception 'invalid_input'; end if;
  if p_students is not null and p_students not between 1 and 100000 then raise exception 'invalid_input'; end if;
  if v_msg is not null and char_length(v_msg) > 1000 then raise exception 'invalid_input'; end if;
  if v_src is not null and char_length(v_src) > 60 then raise exception 'invalid_input'; end if;

  perform pg_advisory_xact_lock(hashtextextended('lead:' || v_email, 0));   -- бір e-mail-ден параллель сұрау қосарланбасын
  if exists (select 1 from public.leads where email = v_email and created_at > now() - interval '24 hours') then
    return true;
  end if;
  if (select count(*) from public.leads where created_at > now() - interval '1 hour') >= 200 then raise exception 'rate_limited'; end if;

  insert into public.leads (org_name, contact_name, email, phone, role, org_type, students_estimate, message, consent, consent_at, source)
  values (v_org, v_contact, v_email, v_phone, p_role, p_org_type, p_students, v_msg, true, now(), v_src);
  return true;
end $$;

-- ---------- SUPER ADMIN ----------
create or replace function public.set_lead_status(p_id uuid, p_status text, p_notes text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_notes text := nullif(btrim(coalesce(p_notes, '')), '');
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if p_status is null or p_status not in ('new', 'contacted', 'demo', 'pilot', 'won', 'lost') then raise exception 'invalid_status'; end if;
  if v_notes is not null and char_length(v_notes) > 2000 then raise exception 'invalid_input'; end if;
  update public.leads set status = p_status, notes = v_notes where id = p_id;
  if not found then raise exception 'not_found'; end if;
  -- аудит: мазмұнсыз, e-mail-сіз (тек id мен жаңа күй)
  perform public.audit_log(null, 'lead.status', 'lead', p_id::text, jsonb_build_object('status', p_status));
end $$;

create or replace function public.delete_lead(p_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  delete from public.leads where id = p_id;
  if not found then raise exception 'not_found'; end if;
  perform public.audit_log(null, 'lead.delete', 'lead', p_id::text, '{}');
end $$;

-- Воронка: әр күй бойынша барлығы және соңғы 30 күнде түскені (нөлдерімен)
create or replace function public.lead_funnel()
returns table (status text, total bigint, last_30d bigint)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  return query
    select s.st, count(l.id), count(l.id) filter (where l.created_at > now() - interval '30 days')
      from unnest(array['new', 'contacted', 'demo', 'pilot', 'won', 'lost']) with ordinality as s(st, ord)
      left join public.leads l on l.status = s.st
     group by s.st, s.ord order by s.ord;
end $$;

-- Сақтау мерзімі: p_days күннен ескі сұрауларды (кез келген күй) жояды. SUPER ADMIN не тікелей DB қосылымы (scripts/leads-purge.mjs, рөл ауыстырылмаған).
create or replace function public.purge_old_leads(p_days int default 365)
returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare v_n int;
begin
  if not (public.is_platform_admin() or (auth.uid() is null and current_setting('role', true) in ('none', ''))) then raise exception 'forbidden'; end if;
  if p_days is null or p_days not between 1 and 3650 then raise exception 'invalid_range'; end if;
  delete from public.leads where created_at < now() - make_interval(days => p_days);
  get diagnostics v_n = row_count;
  perform public.audit_log(null, 'lead.purge', 'lead', null, jsonb_build_object('days', p_days, 'count', v_n));
  return v_n;
end $$;

-- CSV экспорты жеке деректің шығуы: журналға жазылады (тек саны)
create or replace function public.audit_leads_export(p_count int)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  perform public.audit_log(null, 'lead.export', 'lead', null, jsonb_build_object('count', coalesce(p_count, 0)));
end $$;

revoke all on function public.submit_lead(text, text, text, text, text, text, int, text, boolean, text) from public, anon, authenticated;
grant execute on function public.submit_lead(text, text, text, text, text, text, int, text, boolean, text) to anon, authenticated;
revoke all on function public.set_lead_status(uuid, text, text), public.delete_lead(uuid), public.lead_funnel(),
  public.purge_old_leads(int), public.audit_leads_export(int) from public, anon, authenticated;
grant execute on function public.set_lead_status(uuid, text, text), public.delete_lead(uuid), public.lead_funnel(),
  public.purge_old_leads(int), public.audit_leads_export(int) to authenticated;
