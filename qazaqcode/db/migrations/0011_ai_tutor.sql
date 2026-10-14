-- QazaqCode Platform: 0011 - қазақша AI көмекші (мұғалім-бот).
-- ШЫНАЙЫЛЫҚ: біз өз тіл моделімізді оқытпаймыз; бот сыртқы тіл моделін API арқылы қолданады (docs/AI-TUTOR.md).
-- Принциптер:
--  * ұйым деңгейінде AI әдепкіде ӨШІРУЛІ; тек мектеп әкімшісі қосады (ai_org_settings);
--  * барлық лицензия жоспарында қол жетімді (starter-де де), бірақ күндік лимитпен; лицензия белсенді емес болса жаңа сұраныс жоқ;
--  * чат мазмұнын ТЕК иесі (оқушы) көреді: мұғалім, мектеп әкімшісі және платформа әкімшісі оқымайды (RLS);
--    әкімші тек жиынтық санды көреді (ai_usage), мазмұнсыз;
--  * мазмұн 90 күннен кейін өшіріледі (ai_purge_old), оқушы өз чатын кез келген уақытта өшіре алады;
--  * күндік лимитті санау мазмұннан бөлек кестеде (ai_usage_daily), сондықтан чатты өшіру лимитті айналып өтпейді.

-- ---------- Кестелер ----------
create table public.ai_org_settings (
  org_id                uuid primary key references public.organizations (id) on delete cascade,
  enabled               boolean not null default false,
  daily_limit_per_student integer not null default 20 check (daily_limit_per_student between 1 and 200),
  -- 'резеңке үйрек' режимі: дайын шешім ЕШҚАШАН берілмейді; әкімші өзгерте алмайды ('full' режимі алынып тасталды)
  mode                  text not null default 'hint_only' check (mode = 'hint_only'),
  updated_by            uuid references auth.users (id) on delete set null,
  updated_at            timestamptz not null default now()
);

create table public.ai_conversations (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  assignment_id uuid references public.assignments (id) on delete set null,
  lesson_id     uuid references public.lessons (id) on delete set null,
  title         text not null default '' check (char_length(title) <= 80),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index ai_conversations_user on public.ai_conversations (user_id, updated_at desc);
create index ai_conversations_purge on public.ai_conversations (updated_at);

create table public.ai_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null check (char_length(content) between 1 and 20000),
  tokens_in       integer check (tokens_in is null or tokens_in >= 0),
  tokens_out      integer check (tokens_out is null or tokens_out >= 0),
  created_at      timestamptz not null default now()
);
create index ai_messages_conv on public.ai_messages (conversation_id, created_at);

-- Қолдану санауышы: МАЗМҰНСЫЗ (тек сан). Клиентке тікелей берілмейді.
create table public.ai_usage_daily (
  org_id     uuid not null references public.organizations (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  day        date not null,
  requests   integer not null default 0 check (requests >= 0),
  tokens_in  bigint not null default 0,
  tokens_out bigint not null default 0,
  primary key (org_id, user_id, day)
);
create index ai_usage_daily_day on public.ai_usage_daily (org_id, day);

-- ---------- RLS ----------
alter table public.ai_org_settings  enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages      enable row level security;
alter table public.ai_usage_daily   enable row level security;  -- саясат жоқ: тек SECURITY DEFINER функциялар

create policy ai_settings_select on public.ai_org_settings for select to authenticated using (public.is_org_admin(org_id));
-- Чат тек иесіне: мұғалім/әкімші/платформа әкімшісі үшін саясат ЖОҚ (жеке өмірді қорғау)
create policy ai_conv_select on public.ai_conversations for select to authenticated using (user_id = auth.uid());
create policy ai_msg_select on public.ai_messages for select to authenticated using (
  exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()));

grant select on public.ai_org_settings, public.ai_conversations, public.ai_messages to authenticated;

-- ---------- Көмекші ----------
create or replace function public.ai_today() returns date language sql stable as $$
  select (now() at time zone 'Asia/Almaty')::date
$$;

-- ---------- ai_status: ұйымның кез келген мүшесіне (күйі + өз қалған сұрағы) ----------
create or replace function public.ai_status(p_org uuid)
returns table (enabled boolean, mode text, daily_limit integer, used integer, quota_left integer, licence_state text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare s public.ai_org_settings; v_used integer; v_state text;
begin
  if not public.is_org_member(p_org) then raise exception 'forbidden'; end if;
  select * into s from public.ai_org_settings where org_id = p_org;
  select coalesce(sum(requests), 0)::integer into v_used from public.ai_usage_daily where org_id = p_org and user_id = auth.uid() and day = public.ai_today();
  v_state := public.license_state(p_org);
  return query select coalesce(s.enabled, false), coalesce(s.mode, 'hint_only'), coalesce(s.daily_limit_per_student, 20), v_used,
    greatest(coalesce(s.daily_limit_per_student, 20) - v_used, 0), coalesce(v_state, 'none');
end $$;

-- ---------- set_ai_settings: тек мектеп әкімшісі ----------
create or replace function public.set_ai_settings(p_org uuid, p_enabled boolean, p_daily_limit integer)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_org_admin(p_org) then raise exception 'forbidden'; end if;
  if p_enabled is null or p_daily_limit is null or p_daily_limit < 1 or p_daily_limit > 200 then raise exception 'invalid_input'; end if;
  insert into public.ai_org_settings (org_id, enabled, daily_limit_per_student, updated_by)
  values (p_org, p_enabled, p_daily_limit, auth.uid())
  on conflict (org_id) do update set enabled = excluded.enabled, daily_limit_per_student = excluded.daily_limit_per_student,
    updated_by = auth.uid(), updated_at = now();
  perform public.audit_log(p_org, 'ai.settings', 'organization', p_org::text,
    jsonb_build_object('enabled', p_enabled, 'daily_limit', p_daily_limit));
end $$;

-- ---------- ai_begin_turn ----------
-- Оқушының хабарын жазады және күндік санауышты арттырады (бір транзакцияда). Қателер: not_found, forbidden, ai_disabled,
-- license_expired, ai_quota, ai_too_long, invalid_input.
create or replace function public.ai_begin_turn(p_assignment uuid, p_lesson uuid, p_text text, p_conversation uuid default null, p_org uuid default null)
returns table (conversation_id uuid, quota_left integer, mode text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  u uuid := public.require_user(); v_org uuid := p_org; v_assignment uuid := p_assignment; v_lesson uuid := p_lesson;
  conv public.ai_conversations; s public.ai_org_settings; v_text text := btrim(coalesce(p_text, '')); v_conv uuid; v_req integer; v_course uuid;
begin
  if v_text = '' then raise exception 'invalid_input'; end if;
  if char_length(v_text) > 4000 then raise exception 'ai_too_long'; end if;

  if p_conversation is not null then
    select * into conv from public.ai_conversations where id = p_conversation and user_id = u;
    if not found then raise exception 'not_found'; end if;
    v_org := conv.org_id; v_assignment := conv.assignment_id; v_lesson := conv.lesson_id; v_conv := conv.id;
  else
    if v_assignment is not null then
      select a.org_id into v_org from public.assignments a where a.id = v_assignment;
    elsif v_lesson is not null then
      select l.org_id, l.course_id into v_org, v_course from public.lessons l where l.id = v_lesson;
    end if;
  end if;
  if v_org is null then raise exception 'not_found'; end if;

  -- тек осы ұйымның белсенді ОҚУШЫСЫ
  if not exists (select 1 from public.organization_members m where m.org_id = v_org and m.user_id = u and m.status = 'active' and m.role = 'student') then
    raise exception 'forbidden';
  end if;
  -- контекст құқығы: оқушы осы тапсырманы/сабақты көре ала ма
  if v_assignment is not null and not public.student_sees_assignment(v_assignment) then raise exception 'not_found'; end if;
  if v_lesson is not null then
    select l.course_id into v_course from public.lessons l where l.id = v_lesson and l.org_id = v_org;
    if v_course is null or not public.student_sees_course(v_course) then raise exception 'not_found'; end if;
  end if;
  if v_assignment is not null and not exists (select 1 from public.assignments a where a.id = v_assignment and a.org_id = v_org) then raise exception 'not_found'; end if;

  select * into s from public.ai_org_settings where org_id = v_org;
  if not found or not s.enabled then raise exception 'ai_disabled'; end if;
  if public.license_state(v_org) is distinct from 'active' then raise exception 'license_expired'; end if;

  -- күндік лимит (атомарлы): лимитке жеткен болса жол жаңартылмайды
  insert into public.ai_usage_daily (org_id, user_id, day, requests) values (v_org, u, public.ai_today(), 1)
  on conflict (org_id, user_id, day) do update set requests = public.ai_usage_daily.requests + 1
    where public.ai_usage_daily.requests < s.daily_limit_per_student
  returning requests into v_req;
  if v_req is null then raise exception 'ai_quota'; end if;

  if v_conv is null then
    insert into public.ai_conversations (org_id, user_id, assignment_id, lesson_id, title)
    values (v_org, u, v_assignment, v_lesson, left(regexp_replace(v_text, '\s+', ' ', 'g'), 60))
    returning id into v_conv;
  end if;
  insert into public.ai_messages (conversation_id, role, content) values (v_conv, 'user', v_text);
  update public.ai_conversations set updated_at = now() where id = v_conv;

  return query select v_conv, greatest(s.daily_limit_per_student - v_req, 0), s.mode;
end $$;

-- ---------- ai_record_reply ----------
create or replace function public.ai_record_reply(p_conversation uuid, p_content text, p_tokens_in integer default null, p_tokens_out integer default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := public.require_user(); conv public.ai_conversations; v_last text; v_content text := left(btrim(coalesce(p_content, '')), 20000);
begin
  select * into conv from public.ai_conversations where id = p_conversation and user_id = u;
  if not found then raise exception 'not_found'; end if;
  if v_content = '' then raise exception 'invalid_input'; end if;
  select role into v_last from public.ai_messages where conversation_id = conv.id order by created_at desc, id desc limit 1;
  if v_last is distinct from 'user' then raise exception 'invalid_input'; end if;
  insert into public.ai_messages (conversation_id, role, content, tokens_in, tokens_out)
  values (conv.id, 'assistant', v_content, greatest(p_tokens_in, 0), greatest(p_tokens_out, 0));
  update public.ai_conversations set updated_at = now() where id = conv.id;
  update public.ai_usage_daily set tokens_in = tokens_in + coalesce(greatest(p_tokens_in, 0), 0), tokens_out = tokens_out + coalesce(greatest(p_tokens_out, 0), 0)
   where org_id = conv.org_id and user_id = u and day = public.ai_today();
end $$;

-- ---------- ai_abort_turn: провайдер қатесі болса, соңғы жауапсыз хабарды алып тастайды және лимитті қайтарады ----------
create or replace function public.ai_abort_turn(p_conversation uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := public.require_user(); conv public.ai_conversations; m public.ai_messages;
begin
  select * into conv from public.ai_conversations where id = p_conversation and user_id = u;
  if not found then raise exception 'not_found'; end if;
  select * into m from public.ai_messages where conversation_id = conv.id order by created_at desc, id desc limit 1;
  if not found or m.role <> 'user' then return; end if;
  delete from public.ai_messages where id = m.id;
  update public.ai_usage_daily set requests = greatest(requests - 1, 0) where org_id = conv.org_id and user_id = u and day = public.ai_today();
  -- хабарсыз қалған жаңа әңгіме қалмасын
  if not exists (select 1 from public.ai_messages where conversation_id = conv.id) then delete from public.ai_conversations where id = conv.id; end if;
end $$;

-- ---------- ai_delete_conversation: оқушы өз чатын өшіреді ----------
create or replace function public.ai_delete_conversation(p_conversation uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := public.require_user();
begin
  delete from public.ai_conversations where id = p_conversation and user_id = u;
  if not found then raise exception 'not_found'; end if;
end $$;

-- ---------- ai_usage: тек мектеп әкімшісіне, жиынтық (мазмұнсыз) ----------
create or replace function public.ai_usage(p_org uuid, p_days integer default 30)
returns table (day date, active_students integer, requests integer, tokens_in bigint, tokens_out bigint)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_org_admin(p_org) then raise exception 'forbidden'; end if;
  if p_days is null or p_days < 1 or p_days > 366 then raise exception 'invalid_range'; end if;
  return query
  select d::date, coalesce(count(u.user_id) filter (where u.requests > 0), 0)::integer, coalesce(sum(u.requests), 0)::integer,
         coalesce(sum(u.tokens_in), 0)::bigint, coalesce(sum(u.tokens_out), 0)::bigint
  from generate_series(public.ai_today() - (p_days - 1), public.ai_today(), interval '1 day') d
  left join public.ai_usage_daily u on u.org_id = p_org and u.day = d::date
  group by d order by d;
end $$;

-- ---------- ai_purge_old: сақтау мерзімі (әдепкі 90 күн). Клиентке БЕРІЛМЕЙДІ: scripts/ai-purge.mjs иесі рөлімен шақырады ----------
create or replace function public.ai_purge_old(p_days integer default 90)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  if p_days is null or p_days < 1 then raise exception 'invalid_range'; end if;
  delete from public.ai_conversations where updated_at < now() - make_interval(days => p_days);
  get diagnostics n = row_count;
  -- сан-санауыштар (мазмұнсыз) 1 жылдан кейін
  delete from public.ai_usage_daily where day < public.ai_today() - 365;
  insert into public.audit_logs (org_id, actor_id, action, entity, entity_id, meta)
  values (null, null, 'ai.purge', 'ai_conversations', null, jsonb_build_object('days', p_days, 'deleted', n));
  return n;
end $$;

-- ---------- Құқықтар ----------
revoke all on function public.ai_today(), public.ai_status(uuid), public.set_ai_settings(uuid, boolean, integer),
  public.ai_begin_turn(uuid, uuid, text, uuid, uuid), public.ai_record_reply(uuid, text, integer, integer), public.ai_abort_turn(uuid),
  public.ai_delete_conversation(uuid), public.ai_usage(uuid, integer), public.ai_purge_old(integer) from public, anon, authenticated;
grant execute on function public.ai_today(), public.ai_status(uuid), public.set_ai_settings(uuid, boolean, integer),
  public.ai_begin_turn(uuid, uuid, text, uuid, uuid), public.ai_record_reply(uuid, text, integer, integer), public.ai_abort_turn(uuid),
  public.ai_delete_conversation(uuid), public.ai_usage(uuid, integer) to authenticated;
-- ai_purge_old: authenticated-ке берілмейді (тек иесі/жоба рөлі)
