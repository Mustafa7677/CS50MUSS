-- QazaqCode Platform: 0015 - E-mail инфрақұрылымы (outbox).
-- ПРИНЦИП: дерекқордан/RPC-ден сыртқы желіге ешқашан шықпаймыз. RPC тек `email_outbox`-қа жол қосады, бөлек worker
-- (scripts/send-emails.mjs) жолдарды `claim_emails` арқылы алып, SMTP арқылы жібереді және `mark_email_result` арқылы нәтижесін жазады.
-- Құпиялылық:
--  * Кестелерге клиент рөлдерінің (anon/authenticated) ешқандай құқығы жоқ және RLS саясаты жоқ: жеке письмоны ешкім клиентпен оқымайды.
--    SUPER ADMIN тек жиынтық санақты көреді (email_stats()). Жазу/оқу тек SECURITY DEFINER функциялар арқылы.
--  * payload құпиясыз: шақыру токені ТЕК шақыру хатында (бір реттік, expires_at бойынша қысқа мерзім) және жіберілген/сәтсіз/мерзімі өткен соң
--    payload толық тазаланады ('{}'). Unsubscribe токені outbox-та жіберілгенге дейін ғана, ұзақ мерзімде тек хэш (email_unsub_tokens).
--  * Бас тартқан/қайтарған мекенжайлар email_suppressions-те тек хэшпен (sha256) сақталады.
--  * Rate limit: бір алушыға тәулігіне ≤5, жалпы сағатына ≤1000 (асса enqueue_email null қайтарады, қате шығармайды).

create table public.email_outbox (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  to_email        text not null check (char_length(to_email) <= 160 and to_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  email_hash      text not null,
  template        text not null check (template in ('teacher_invite', 'student_join_info', 'licence_expiry', 'lead_ack', 'order_status', 'pilot_report_ready', 'generic')),
  locale          text not null default 'kk' check (locale in ('kk', 'ru', 'en')),
  payload         jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 8192),
  status          text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed', 'suppressed')),
  attempts        int not null default 0,
  last_error      text check (last_error is null or char_length(last_error) <= 200),
  sent_at         timestamptz,
  next_attempt_at timestamptz not null default now(),
  locked_at       timestamptz,
  expires_at      timestamptz not null,
  dedupe_key      text unique check (dedupe_key is null or char_length(dedupe_key) <= 200),
  unsub_token     text
);
create index email_outbox_queue_idx on public.email_outbox (next_attempt_at) where status in ('queued', 'sending');
create index email_outbox_rcpt_idx on public.email_outbox (email_hash, created_at desc);
create index email_outbox_created_idx on public.email_outbox (created_at);

create table public.email_suppressions (
  email_hash text primary key,
  reason     text not null check (reason in ('unsubscribed', 'bounce', 'complaint', 'manual')),
  created_at timestamptz not null default now()
);

-- Unsubscribe токендері: тек хэш -> алушы хэші (хат жіберілгеннен кейін де сілтеме жұмыс істейді)
create table public.email_unsub_tokens (
  token_hash text primary key,
  email_hash text not null,
  created_at timestamptz not null default now()
);
create index email_unsub_tokens_created_idx on public.email_unsub_tokens (created_at);

alter table public.email_outbox enable row level security;
alter table public.email_suppressions enable row level security;
alter table public.email_unsub_tokens enable row level security;
-- Саясат ЖОҚ (әдейі): RLS барлық клиент рөлдері үшін жабық. Иесі/service рөлдері не definer функциялар ғана.
revoke all on public.email_outbox, public.email_suppressions, public.email_unsub_tokens from public, anon, authenticated;

create or replace function public.email_hash_of(p_email text) returns text
language sql immutable set search_path = public, pg_temp as $$
  select encode(digest(lower(btrim(coalesce(p_email, ''))), 'sha256'), 'hex')
$$;

-- ---------- Ішкі: кезекке қосу (клиентке берілмейді; тек басқа definer функциялар/иесі рөлі) ----------
-- null қайтарады = rate limit (қате шығармайды: шақырушы функция бұзылмасын). Бас тартқан алушыға 'suppressed' жол жазылады.
create or replace function public.enqueue_email(
  p_to text, p_template text, p_locale text default 'kk', p_payload jsonb default '{}'::jsonb,
  p_dedupe_key text default null, p_ttl_hours int default 72)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_to text := lower(btrim(coalesce(p_to, '')));
  v_hash text;
  v_id uuid;
  v_status text := 'queued';
  v_tok text;
  v_ttl int := coalesce(p_ttl_hours, 72);
begin
  if char_length(v_to) > 160 or v_to !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'invalid_input'; end if;
  if p_template is null or p_template not in ('teacher_invite', 'student_join_info', 'licence_expiry', 'lead_ack', 'order_status', 'pilot_report_ready', 'generic') then raise exception 'invalid_input'; end if;
  if p_locale is null or p_locale not in ('kk', 'ru', 'en') then raise exception 'invalid_input'; end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' or pg_column_size(p_payload) > 8192 then raise exception 'invalid_input'; end if;
  if v_ttl not between 1 and 24 * 30 then raise exception 'invalid_ttl'; end if;
  v_hash := public.email_hash_of(v_to);

  perform pg_advisory_xact_lock(hashtextextended('email:' || v_hash, 0));
  if p_dedupe_key is not null then
    select id into v_id from public.email_outbox where dedupe_key = p_dedupe_key;
    if found then return v_id; end if;   -- идемпотентті: бірдей кілтпен екінші хат жасалмайды
  end if;
  if exists (select 1 from public.email_suppressions where email_hash = v_hash) then v_status := 'suppressed'; end if;
  if v_status = 'queued' then
    if (select count(*) from public.email_outbox where email_hash = v_hash and status <> 'suppressed' and created_at > now() - interval '24 hours') >= 5 then return null; end if;
    if (select count(*) from public.email_outbox where status <> 'suppressed' and created_at > now() - interval '1 hour') >= 1000 then return null; end if;
  end if;

  v_tok := encode(gen_random_bytes(18), 'hex');
  insert into public.email_outbox (to_email, email_hash, template, locale, payload, status, expires_at, dedupe_key, unsub_token)
  values (v_to, v_hash, p_template, p_locale, case when v_status = 'suppressed' then '{}'::jsonb else p_payload end, v_status,
          now() + make_interval(hours => v_ttl), p_dedupe_key, case when v_status = 'suppressed' then null else v_tok end)
  returning id into v_id;
  if v_status = 'queued' then
    insert into public.email_unsub_tokens (token_hash, email_hash) values (encode(digest(v_tok, 'sha256'), 'hex'), v_hash);
  end if;
  return v_id;
end $$;

-- ---------- Worker: хаттарды алу (бір жол тек бір worker-ге) ----------
create or replace function public.claim_emails(p_n int default 10)
returns table (id uuid, to_email text, template text, locale text, payload jsonb, attempts int, unsub_token text)
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null then raise exception 'forbidden'; end if;
  if p_n is null or p_n not between 1 and 100 then raise exception 'invalid_range'; end if;
  -- мерзімі өткендер жіберілмейді (ескірген шақыру токені), payload тазаланады
  update public.email_outbox o set status = 'failed', last_error = 'expired', payload = '{}'::jsonb, unsub_token = null, locked_at = null
   where o.status in ('queued', 'sending') and o.expires_at < now() and (o.status = 'queued' or o.locked_at < now() - interval '10 minutes');
  -- кезек кезінде бас тартқандар
  update public.email_outbox o set status = 'suppressed', payload = '{}'::jsonb, unsub_token = null, locked_at = null
   where o.status = 'queued' and exists (select 1 from public.email_suppressions s where s.email_hash = o.email_hash);
  return query
    update public.email_outbox o set status = 'sending', attempts = o.attempts + 1, locked_at = now()
     where o.id in (
       select x.id from public.email_outbox x
        where ((x.status = 'queued' and x.next_attempt_at <= now()) or (x.status = 'sending' and x.locked_at < now() - interval '10 minutes'))
          and x.expires_at >= now()
        order by x.next_attempt_at, x.created_at
        for update skip locked
        limit p_n)
    returning o.id, o.to_email, o.template, o.locale, o.payload, o.attempts, o.unsub_token;
end $$;

-- Нәтиже: ok -> sent (payload/токендер тазаланады); қате -> backoff-пен қайта кезекке, 5 әрекеттен кейін (не p_permanent) failed.
-- p_suppress ('bounce'/'complaint') берілсе алушы бас тартқандар тізіміне қосылады.
create or replace function public.mark_email_result(p_id uuid, p_ok boolean, p_error text default null, p_permanent boolean default false, p_suppress text default null)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r public.email_outbox;
  v_err text := nullif(left(regexp_replace(coalesce(p_error, ''), '[[:space:]]+', ' ', 'g'), 200), '');
  v_delay int;
begin
  if auth.uid() is not null then raise exception 'forbidden'; end if;
  select * into r from public.email_outbox where id = p_id for update;
  if not found then raise exception 'not_found'; end if;
  if r.status <> 'sending' then return r.status; end if;   -- қайталанған қоңырау зиян келтірмейді
  if p_suppress is not null then
    if p_suppress not in ('bounce', 'complaint') then raise exception 'invalid_input'; end if;
    insert into public.email_suppressions (email_hash, reason) values (r.email_hash, p_suppress) on conflict do nothing;
  end if;
  if p_ok then
    update public.email_outbox set status = 'sent', sent_at = now(), last_error = null, payload = '{}'::jsonb, unsub_token = null, locked_at = null where id = p_id;
    return 'sent';
  end if;
  if p_permanent or r.attempts >= 5 then
    update public.email_outbox set status = 'failed', last_error = coalesce(v_err, 'error'), payload = '{}'::jsonb, unsub_token = null, locked_at = null where id = p_id;
    return 'failed';
  end if;
  v_delay := least(3600, 30 * (2 ^ (r.attempts - 1))::int);   -- 30с, 60с, 120с, 240с
  update public.email_outbox set status = 'queued', last_error = coalesce(v_err, 'error'), locked_at = null,
         next_attempt_at = now() + make_interval(secs => v_delay) where id = p_id;
  return 'queued';
end $$;

-- Сақтау мерзімі: аяқталған (sent/failed/suppressed) жолдар p_days күннен кейін, кезекте қалғандар 14 күннен кейін өшеді. Unsubscribe хэштері - 2 жыл.
create or replace function public.purge_old_emails(p_days int default 30)
returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare v_n int; v_m int;
begin
  if not (public.is_platform_admin() or (auth.uid() is null and current_setting('role', true) in ('none', ''))) then raise exception 'forbidden'; end if;
  if p_days is null or p_days not between 1 and 3650 then raise exception 'invalid_range'; end if;
  delete from public.email_outbox
   where (status in ('sent', 'failed', 'suppressed') and created_at < now() - make_interval(days => p_days))
      or (status in ('queued', 'sending') and created_at < now() - interval '14 days');
  get diagnostics v_n = row_count;
  delete from public.email_unsub_tokens where created_at < now() - interval '730 days';
  get diagnostics v_m = row_count;
  perform public.audit_log(null, 'email.purge', 'email', null, jsonb_build_object('days', p_days, 'count', v_n));
  return v_n;
end $$;

-- ---------- Unsubscribe (жария бет /unsubscribe/[token]; токен 144 бит, қолжетімсіз болжау) ----------
create or replace function public.email_unsubscribe(p_token text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare v_hash text;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{36}$' then return false; end if;
  select email_hash into v_hash from public.email_unsub_tokens where token_hash = encode(digest(p_token, 'sha256'), 'hex');
  if v_hash is null then return false; end if;
  insert into public.email_suppressions (email_hash, reason) values (v_hash, 'unsubscribed') on conflict do nothing;
  -- кезекте тұрған хаттар да тоқтатылады
  update public.email_outbox set status = 'suppressed', payload = '{}'::jsonb, unsub_token = null where email_hash = v_hash and status = 'queued';
  return true;
end $$;

-- ---------- Мұғалімді e-mail арқылы шақыру (мектеп әкімшісі): токен тек осы хатқа, қысқа мерзімді ----------
create or replace function public.queue_invitation_email(p_token text, p_email text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_inv public.invitations; v_org text; v_to text := lower(btrim(coalesce(p_email, ''))); v_id uuid;
begin
  select * into v_inv from public.invitations where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if not found then raise exception 'not_found'; end if;
  if not (public.is_org_admin(v_inv.org_id) or public.is_platform_admin()) then raise exception 'forbidden'; end if;
  if v_inv.role <> 'teacher' then raise exception 'invalid_role'; end if;
  if v_inv.revoked_at is not null or v_inv.accepted_at is not null or v_inv.expires_at < now() then raise exception 'invite_invalid'; end if;
  if v_to !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or char_length(v_to) > 160 then raise exception 'invalid_input'; end if;
  if v_inv.email is not null and v_inv.email <> v_to then raise exception 'invite_email_mismatch'; end if;
  select name into v_org from public.organizations where id = v_inv.org_id;
  v_id := public.enqueue_email(v_to, 'teacher_invite', 'kk',
    jsonb_build_object('org_name', v_org, 'token', p_token, 'expires_at', v_inv.expires_at),
    null, greatest(1, least(72, ceil(extract(epoch from (v_inv.expires_at - now())) / 3600)::int)));
  if v_id is null then raise exception 'rate_limited'; end if;
  perform public.audit_log(v_inv.org_id, 'invitation.email', 'invitation', v_inv.id::text, '{}');   -- e-mail-сіз
  return true;
end $$;

-- ---------- Пилот сұрауына автожауап: submit_lead-ті өзгертпей, leads INSERT триггері ----------
-- Тек жаңа жол қосылғанда (дубликат 24 сағатта жол қоспайды -> хат та жоқ, ал жауап клиентке бірдей). Қате лидті бұзбайды.
create or replace function public.trg_lead_ack() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  begin
    perform public.enqueue_email(new.email, 'lead_ack', 'kk', jsonb_build_object('org_name', new.org_name), 'lead_ack:' || new.id::text, 72);
  exception when others then
    null;   -- e-mail мәселесі сұрауды қабылдауға кедергі болмауы тиіс
  end;
  return new;
end $$;
create trigger leads_ack_email after insert on public.leads for each row execute function public.trg_lead_ack();

-- ---------- SUPER ADMIN: тек жиынтық ----------
create or replace function public.email_stats()
returns table (status text, total bigint, last_24h bigint)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  return query
    select s.st, count(o.id), count(o.id) filter (where o.created_at > now() - interval '24 hours')
      from unnest(array['queued', 'sending', 'sent', 'failed', 'suppressed']) with ordinality as s(st, ord)
      left join public.email_outbox o on o.status = s.st
     group by s.st, s.ord order by s.ord;
end $$;

-- ---------- Құқықтар ----------
revoke all on function public.email_hash_of(text), public.enqueue_email(text, text, text, jsonb, text, int), public.claim_emails(int),
  public.mark_email_result(uuid, boolean, text, boolean, text), public.purge_old_emails(int), public.trg_lead_ack(),
  public.email_unsubscribe(text), public.queue_invitation_email(text, text), public.email_stats() from public, anon, authenticated;
grant execute on function public.email_unsubscribe(text) to anon, authenticated;
grant execute on function public.queue_invitation_email(text, text), public.purge_old_emails(int), public.email_stats() to authenticated;
