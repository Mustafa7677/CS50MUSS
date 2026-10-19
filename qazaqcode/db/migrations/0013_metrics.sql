-- QazaqCode Platform: 0013 - инвесторға көрсетуге болатын НАҚТЫ метрика жүйесі.
-- 1) activity_days: жеке деректі МИНИМУМДА ұстайтын белсенділік журналы (қолданушы, ұйым, күн, рөл). Мазмұн/IP/UA/уақыт сақталмайды.
--    Бір қолданушыға тәулігіне ең көп 1 жол (PK user_id+day). Күн - Asia/Almaty күні.
-- 2) touch_activity(): SECURITY DEFINER, тек authenticated (anon шақыра алмайды); жазбаны сервер қана жасайды (кестеге тікелей жазу жабық).
-- 3) purge_activity(days): сақтау мерзімі (әдепкі 400 күн).
-- 4) Аналитика (SECURITY DEFINER, тек жиынтық сандар): platform_kpis, platform_org_health (SUPER ADMIN); org_health (мектеп әкімшісі өз ұйымы үшін
--    не SUPER ADMIN); pilot_report (пилот есебіне жиынтық дерек). SUPER ADMIN-ге жеке оқушы/мұғалім деректері БЕРІЛМЕЙДІ (аттар, id-лер жоқ).
-- Баға/кіріс жорамалы ЖОҚ. Формулалар: docs/METRICS.md.

-- ---------- Көмекшілер (клиентке берілмейді) ----------
create or replace function public.metrics_today() returns date
language sql stable set search_path = public, pg_temp as $$ select (now() at time zone 'Asia/Almaty')::date $$;

-- Есепке кіретін ұйымдар: әдепкіде ДЕМО ұйымдары (is_demo) КІРМЕЙДІ
create or replace function public.metrics_orgs(p_include_demo boolean) returns setof uuid
language sql stable set search_path = public, pg_temp as $$ select o.id from public.organizations o where coalesce(p_include_demo, false) or not o.is_demo $$;

-- ISO аптасының дүйсенбісі (сессия уақыт белдеуінен тәуелсіз)
create or replace function public.week_start(d date) returns date
language sql immutable set search_path = public, pg_temp as $$ select d - (extract(isodow from d)::int - 1) $$;

-- ---------- Белсенділік журналы ----------
create table public.activity_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  org_id  uuid not null references public.organizations (id) on delete cascade,
  day     date not null,
  role    public.member_role not null,
  primary key (user_id, day)
);
create index activity_days_org_day on public.activity_days (org_id, day);
create index activity_days_day on public.activity_days (day);

alter table public.activity_days enable row level security;
-- қолданушы тек ӨЗ жолдарын көреді (ашықтық); басқа ешкім (SUPER ADMIN да) кесте арқылы көрмейді: тек жиынтық функциялар
create policy activity_days_select_own on public.activity_days for select to authenticated using (user_id = auth.uid());
revoke all on public.activity_days from public, anon, authenticated;
grant select on public.activity_days to authenticated;

-- Қолданушы бүгін жүйеде белсенді болды деп белгілейді. Қайтарады: true = жаңа жол жазылды, false = бүгін бар/ұйымы жоқ.
-- p_org берілсе, қолданушы сол ұйымның белсенді мүшесі болуы тиіс (болмаса 'forbidden'); берілмесе - ертерек қосылған ұйым.
-- Қорғаныс: PK бір тәулікте бір жолға ғана жол береді; бар болса дереу шығады (қосымша сұраусыз); app қабаты жадта да кэштейді.
create or replace function public.touch_activity(p_org uuid default null)
returns boolean language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_day date := public.metrics_today();
  v_org uuid; v_role public.member_role; v_n int;
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;
  if exists (select 1 from public.activity_days where user_id = v_uid and day = v_day) then return false; end if;
  if p_org is not null then
    select m.org_id, m.role into v_org, v_role from public.organization_members m
     where m.user_id = v_uid and m.org_id = p_org and m.status = 'active';
    if v_org is null then raise exception 'forbidden'; end if;
  else
    select m.org_id, m.role into v_org, v_role from public.organization_members m
     where m.user_id = v_uid and m.status = 'active' order by m.joined_at, m.id limit 1;
    if v_org is null then return false; end if;   -- мүшелігі жоқ (мысалы, тек платформа әкімшісі): жазылмайды
  end if;
  insert into public.activity_days (user_id, org_id, day, role) values (v_uid, v_org, v_day, v_role) on conflict (user_id, day) do nothing;
  get diagnostics v_n = row_count;
  return v_n > 0;
end $$;

-- Сақтау мерзімі. SUPER ADMIN не тікелей DB қосылымы (scripts/activity-purge.mjs, рөл ауыстырылмаған).
create or replace function public.purge_activity(p_days int default 400)
returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare v_n int;
begin
  if not (public.is_platform_admin() or (auth.uid() is null and current_setting('role', true) in ('none', ''))) then raise exception 'forbidden'; end if;
  if p_days is null or p_days not between 1 and 3650 then raise exception 'invalid_range'; end if;
  delete from public.activity_days where day < public.metrics_today() - p_days;
  get diagnostics v_n = row_count;
  perform public.audit_log(null, 'activity.purge', 'activity', null, jsonb_build_object('days', p_days, 'count', v_n));
  return v_n;
end $$;

-- ---------- Ұйым денсаулығы (ішкі есептеу; клиентке берілмейді) ----------
-- Кезең [p_from, p_to] (Asia/Almaty күндері). Формула (docs/METRICS.md):
--   белсенді үлес  = кезеңде кіріп шыққан белсенді оқушы / белсенді оқушылар                     (салмақ 35)
--   орындау үлесі  = мерзімі кезеңде өткен тапсырмалар бойынша жұмыс жіберген (тапсырма, оқушы) / күтілетін (тапсырма, оқушы) (салмақ 30)
--   уақтылылық     = мерзімі бар тапсырмалар бойынша мерзімінде жіберілгені / жіберілгені                (салмақ 15)
--   лимит қолдану  = min(1, (оқушы / лицензиядағы max_students) / 0.5)                              (салмақ 20)
--   ұпай = round(100 * Σ(салмақ*құрамдас) / Σ(салмақ)), тек есептеуге болатын құрамдастар бойынша; белсенді оқушы жоқ болса - ұпай жоқ.
create or replace function public.org_health_calc(p_org uuid, p_from date, p_to date, p_daily boolean default false)
returns jsonb language plpgsql stable security invoker set search_path = public, pg_temp as $$
declare
  v_name text; v_demo boolean; v_created timestamptz;
  v_students int; v_teachers int; v_act_s int; v_act_t int;
  v_expected int; v_completed int; v_cd int; v_ontime int; v_max int;
  c_active numeric; c_compl numeric; c_time numeric; c_seats numeric;
  v_w numeric := 0; v_sum numeric := 0; v_score int; v_band text; v_daily jsonb;
begin
  select o.name, o.is_demo, o.created_at into v_name, v_demo, v_created from public.organizations o where o.id = p_org;
  if not found then raise exception 'not_found'; end if;

  select count(*) filter (where role = 'student'), count(*) filter (where role = 'teacher') into v_students, v_teachers
    from public.organization_members where org_id = p_org and status = 'active';
  select count(distinct ad.user_id) filter (where ad.role = 'student'), count(distinct ad.user_id) filter (where ad.role = 'teacher') into v_act_s, v_act_t
    from public.activity_days ad
    join public.organization_members m on m.org_id = ad.org_id and m.user_id = ad.user_id and m.status = 'active' and m.role = ad.role
   where ad.org_id = p_org and ad.day between p_from and p_to;

  with due as (
    select a.id, a.deadline from public.assignments a
     where a.org_id = p_org and a.status <> 'draft'
       and (a.deadline is null or a.deadline <= now())
       and (coalesce(a.deadline, a.created_at) at time zone 'Asia/Almaty')::date between p_from and p_to
  ), pairs as (
    select distinct d.id as aid, d.deadline, cs.student_id
      from due d join public.assignment_targets t on t.assignment_id = d.id
      join public.classroom_students cs on cs.classroom_id = t.classroom_id and cs.status = 'active'
  ), pf as (
    select p.deadline, (select min(coalesce(s.submitted_at, s.updated_at)) from public.submissions s
                         where s.assignment_id = p.aid and s.student_id = p.student_id and s.status <> 'draft') as fs
      from pairs p
  )
  select count(*), count(fs), count(fs) filter (where deadline is not null), count(fs) filter (where deadline is not null and fs <= deadline)
    into v_expected, v_completed, v_cd, v_ontime from pf;

  select l.max_students into v_max from public.licenses l where l.org_id = p_org;

  c_active := case when v_students > 0 then v_act_s::numeric / v_students end;
  c_compl  := case when v_expected > 0 then v_completed::numeric / v_expected end;
  c_time   := case when v_cd > 0 then v_ontime::numeric / v_cd end;
  c_seats  := case when coalesce(v_max, 0) > 0 then least(1::numeric, (v_students::numeric / v_max) / 0.5) end;

  if c_active is not null then
    v_w := 35 + (case when c_compl is not null then 30 else 0 end) + (case when c_time is not null then 15 else 0 end) + (case when c_seats is not null then 20 else 0 end);
    v_sum := 35 * c_active + coalesce(30 * c_compl, 0) + coalesce(15 * c_time, 0) + coalesce(20 * c_seats, 0);
    v_score := round(100 * v_sum / v_w)::int;
  end if;
  v_band := case when v_score is null then 'no_data' when v_score >= 70 then 'good' when v_score >= 40 then 'watch' else 'risk' end;

  if p_daily then
    select coalesce(jsonb_agg(jsonb_build_object('day', g.d::date, 'students', x.s, 'teachers', x.t) order by g.d), '[]'::jsonb) into v_daily
      from generate_series(p_from, p_to, interval '1 day') as g(d)
      cross join lateral (
        select count(*) filter (where ad.role = 'student') as s, count(*) filter (where ad.role = 'teacher') as t
          from public.activity_days ad where ad.org_id = p_org and ad.day = g.d::date) x;
  end if;

  return jsonb_build_object(
    'org_id', p_org, 'org_name', v_name, 'is_demo', v_demo, 'org_created', v_created, 'license_state', public.license_state(p_org),
    'from', p_from, 'to', p_to,
    'students', v_students, 'teachers', v_teachers, 'active_students', v_act_s, 'active_teachers', v_act_t,
    'expected', v_expected, 'completed', v_completed, 'completed_with_deadline', v_cd, 'on_time', v_ontime, 'max_students', v_max,
    'components', jsonb_build_object('active_share', round(c_active, 4), 'completion', round(c_compl, 4), 'timeliness', round(c_time, 4), 'seats', round(c_seats, 4)),
    'score', v_score, 'band', v_band, 'small_n', v_students < 10, 'daily', v_daily);
end $$;

-- Мектеп әкімшісі (өз ұйымы) не SUPER ADMIN
create or replace function public.org_health(p_org uuid, p_days int default 28)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if p_org is null or not (public.is_org_admin(p_org) or public.is_platform_admin()) then raise exception 'forbidden'; end if;
  if p_days is null or p_days not between 7 and 366 then raise exception 'invalid_range'; end if;
  return public.org_health_calc(p_org, public.metrics_today() - (p_days - 1), public.metrics_today(), true);
end $$;

create or replace function public.platform_org_health(p_days int default 28, p_include_demo boolean default false)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_today date := public.metrics_today();
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if p_days is null or p_days not between 7 and 366 then raise exception 'invalid_range'; end if;
  return coalesce((select jsonb_agg(public.org_health_calc(o.id, v_today - (p_days - 1), v_today, false) order by o.created_at desc)
                     from public.organizations o where coalesce(p_include_demo, false) or not o.is_demo), '[]'::jsonb);
end $$;

-- ---------- Платформа KPI (тек SUPER ADMIN, тек жиынтық) ----------
create or replace function public.platform_kpis(p_days int default 30, p_include_demo boolean default false, p_weeks int default 12)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_today date := public.metrics_today();
  v_cur date := public.week_start(public.metrics_today());
  v_demo boolean := coalesce(p_include_demo, false);
  v_tot jsonb; v_cur_act jsonb; v_daily jsonb; v_funnel jsonb; v_ret_org jsonb; v_ret_stu jsonb; v_since date;
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if p_days is null or p_days not between 7 and 366 or p_weeks is null or p_weeks not between 2 and 26 then raise exception 'invalid_range'; end if;

  select min(ad.day) into v_since from public.activity_days ad where ad.org_id in (select m.id from public.metrics_orgs(v_demo) as m(id));

  select jsonb_build_object(
    'orgs', (select count(*) from public.metrics_orgs(v_demo) as m(id)),
    'students', (select count(*) from public.organization_members m where m.org_id in (select m.id from public.metrics_orgs(v_demo) as m(id)) and m.role = 'student' and m.status = 'active'),
    'teachers', (select count(*) from public.organization_members m where m.org_id in (select m.id from public.metrics_orgs(v_demo) as m(id)) and m.role = 'teacher' and m.status = 'active'),
    'leads', (select count(*) from public.leads)) into v_tot;

  -- DAU/WAU/MAU бүгін (рөл бойынша)
  select jsonb_build_object(
    'dau', jsonb_build_object('total', count(distinct user_id) filter (where day = v_today),
       'student', count(distinct user_id) filter (where day = v_today and role = 'student'), 'teacher', count(distinct user_id) filter (where day = v_today and role = 'teacher'),
       'school_admin', count(distinct user_id) filter (where day = v_today and role = 'school_admin')),
    'wau', jsonb_build_object('total', count(distinct user_id) filter (where day > v_today - 7),
       'student', count(distinct user_id) filter (where day > v_today - 7 and role = 'student'), 'teacher', count(distinct user_id) filter (where day > v_today - 7 and role = 'teacher'),
       'school_admin', count(distinct user_id) filter (where day > v_today - 7 and role = 'school_admin')),
    'mau', jsonb_build_object('total', count(distinct user_id),
       'student', count(distinct user_id) filter (where role = 'student'), 'teacher', count(distinct user_id) filter (where role = 'teacher'),
       'school_admin', count(distinct user_id) filter (where role = 'school_admin')))
    into v_cur_act
    from public.activity_days where org_id in (select m.id from public.metrics_orgs(v_demo) as m(id)) and day > v_today - 30;

  -- күн сайынғы қатар: DAU (рөл бойынша), жылжымалы WAU және MAU
  select coalesce(jsonb_agg(jsonb_build_object('day', g.d::date, 'dau', x.dau, 'student', x.ds, 'teacher', x.dt, 'school_admin', x.da, 'wau', x.wau, 'mau', x.mau) order by g.d), '[]'::jsonb)
    into v_daily
    from generate_series(v_today - (p_days - 1), v_today, interval '1 day') as g(d)
    cross join lateral (
      select count(distinct user_id) filter (where day = g.d::date) as dau,
             count(distinct user_id) filter (where day = g.d::date and role = 'student') as ds,
             count(distinct user_id) filter (where day = g.d::date and role = 'teacher') as dt,
             count(distinct user_id) filter (where day = g.d::date and role = 'school_admin') as da,
             count(distinct user_id) filter (where day > g.d::date - 7) as wau,
             count(distinct user_id) as mau
        from public.activity_days where org_id in (select m.id from public.metrics_orgs(v_demo) as m(id)) and day between g.d::date - 29 and g.d::date) x;

  -- Activation воронкасы (ұйымдар бойынша, кірістірілген: әр қадам алдыңғысын қамтиды)
  with s2 as (select m.id from public.metrics_orgs(v_demo) as m(id)),
  s3 as (select id from s2 where exists (select 1 from public.classrooms c where c.org_id = s2.id and c.status = 'active')),
  s4 as (select id from s3 where exists (select 1 from public.assignments a where a.org_id = s3.id and a.status = 'published')),
  s5 as (select id from s4 where exists (select 1 from public.submissions s where s.org_id = s4.id and s.status <> 'draft')),
  ow as (select distinct ad.org_id, public.week_start(ad.day) as wk from public.activity_days ad where ad.org_id in (select id from s5)),
  isl as (select org_id, wk - (row_number() over (partition by org_id order by wk) * 7)::int as grp from ow),
  s6 as (select distinct org_id as id from isl group by org_id, grp having count(*) >= 4)
  select jsonb_build_array(
    jsonb_build_object('key', 'leads', 'count', (select count(*) from public.leads)),
    jsonb_build_object('key', 'org', 'count', (select count(*) from s2)),
    jsonb_build_object('key', 'class', 'count', (select count(*) from s3)),
    jsonb_build_object('key', 'assignment', 'count', (select count(*) from s4)),
    jsonb_build_object('key', 'submission', 'count', (select count(*) from s5)),
    jsonb_build_object('key', 'streak4', 'count', (select count(*) from s6))) into v_funnel;

  -- Когорттық retention: ұйымдар (құрылған апта) - ұйымда кемінде 1 белсенділік болған апталар
  with oc as (
    select o.id, public.week_start((o.created_at at time zone 'Asia/Almaty')::date) as cw from public.organizations o
     where (v_demo or not o.is_demo) and public.week_start((o.created_at at time zone 'Asia/Almaty')::date) >= v_cur - 7 * (p_weeks - 1)),
  ow as (select distinct ad.org_id, public.week_start(ad.day) as wk from public.activity_days ad where ad.org_id in (select id from oc))
  select coalesce(jsonb_agg(jsonb_build_object('cohort', x.cw, 'size', x.size, 'active', x.act) order by x.cw), '[]'::jsonb) into v_ret_org
    from (select c.cw, count(*)::int as size,
            (select jsonb_agg(case when c.cw + 7 * n <= v_cur then (select count(*) from oc c2 join ow w on w.org_id = c2.id and w.wk = c2.cw + 7 * n where c2.cw = c.cw) end order by n)
               from generate_series(0, p_weeks - 1) as n) as act
            from oc c group by c.cw) x;

  -- Оқушылар: бірінші тіркелген белсенділік аптасы бойынша когорт (журнал басталғаннан бастап; бұрынғы тарих жоқ)
  with sf as (
    select ad.user_id, public.week_start(min(ad.day)) as cw from public.activity_days ad
     where ad.role = 'student' and ad.org_id in (select m.id from public.metrics_orgs(v_demo) as m(id)) group by ad.user_id),
  sc as (select * from sf where cw >= v_cur - 7 * (p_weeks - 1)),
  sw as (select distinct ad.user_id, public.week_start(ad.day) as wk from public.activity_days ad where ad.role = 'student' and ad.user_id in (select user_id from sc))
  select coalesce(jsonb_agg(jsonb_build_object('cohort', x.cw, 'size', x.size, 'active', x.act) order by x.cw), '[]'::jsonb) into v_ret_stu
    from (select c.cw, count(*)::int as size,
            (select jsonb_agg(case when c.cw + 7 * n <= v_cur then (select count(*) from sc c2 join sw w on w.user_id = c2.user_id and w.wk = c2.cw + 7 * n where c2.cw = c.cw) end order by n)
               from generate_series(0, p_weeks - 1) as n) as act
            from sc c group by c.cw) x;

  return jsonb_build_object('generated_for', v_today, 'days', p_days, 'weeks', p_weeks, 'include_demo', v_demo, 'data_since', v_since,
    'has_activity', v_since is not null, 'totals', v_tot, 'current', v_cur_act, 'daily', v_daily, 'funnel', v_funnel,
    'retention_orgs', v_ret_org, 'retention_students', v_ret_stu);
end $$;

-- ---------- Пилот есебі: жиынтық дерек (жеке оқушы/мұғалім аттары ЖОҚ) ----------
create or replace function public.pilot_report(p_org uuid, p_from date, p_to date)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_base jsonb; v_asg int; v_quiz int; v_subs int; v_avg numeric; v_avg_n int; v_days jsonb; v_hard jsonb; v_low jsonb; v_below int; v_stu_n int;
begin
  if p_org is null or not (public.is_org_admin(p_org) or public.is_platform_admin()) then raise exception 'forbidden'; end if;
  if p_from is null or p_to is null or p_from > p_to or p_to - p_from > 365 then raise exception 'invalid_range'; end if;
  v_base := public.org_health_calc(p_org, p_from, p_to, false) - 'daily';

  select count(*) filter (where a.status <> 'draft'), count(*) filter (where a.status <> 'draft' and a.kind = 'quiz') into v_asg, v_quiz
    from public.assignments a where a.org_id = p_org and (a.created_at at time zone 'Asia/Almaty')::date between p_from and p_to;
  select count(*) into v_subs from public.submissions s
   where s.org_id = p_org and s.status <> 'draft' and (coalesce(s.submitted_at, s.updated_at) at time zone 'Asia/Almaty')::date between p_from and p_to;

  with best as (
    select distinct on (g.assignment_id, g.student_id) g.assignment_id, g.student_id, g.score / g.max_score * 100 as pct
      from public.grades g where g.org_id = p_org and (g.graded_at at time zone 'Asia/Almaty')::date between p_from and p_to
     order by g.assignment_id, g.student_id, g.score desc)
  select round(avg(pct), 1), count(*) into v_avg, v_avg_n from best;

  select coalesce(jsonb_agg(jsonb_build_object('day', t.day, 'users', t.n) order by t.n desc, t.day), '[]'::jsonb) into v_days
    from (select ad.day, count(*)::int as n from public.activity_days ad where ad.org_id = p_org and ad.day between p_from and p_to
           group by ad.day order by count(*) desc, ad.day limit 5) t;

  -- қиын тапсырмалар: ≥3 оқушы бағаланған, орташа нәтиже ең төмен 3 (атаусыз оқушы)
  with best as (
    select distinct on (g.assignment_id, g.student_id) g.assignment_id, g.student_id, g.score / g.max_score * 100 as pct
      from public.grades g where g.org_id = p_org and (g.graded_at at time zone 'Asia/Almaty')::date between p_from and p_to
     order by g.assignment_id, g.student_id, g.score desc),
  agg as (select b.assignment_id, round(avg(b.pct), 1) as avg_pct, count(*)::int as n from best b group by b.assignment_id having count(*) >= 3 and avg(b.pct) < 70)
  select coalesce(jsonb_agg(jsonb_build_object('title', a.title, 'avg_pct', agg.avg_pct, 'n', agg.n) order by agg.avg_pct, a.title), '[]'::jsonb) into v_hard
    from (select * from agg order by avg_pct limit 3) agg join public.assignments a on a.id = agg.assignment_id;

  -- орындалуы төмен тапсырмалар (мерзімі кезеңде өткен, күтілетін ≥3)
  with due as (
    select a.id, a.title from public.assignments a
     where a.org_id = p_org and a.status <> 'draft' and (a.deadline is null or a.deadline <= now())
       and (coalesce(a.deadline, a.created_at) at time zone 'Asia/Almaty')::date between p_from and p_to),
  pairs as (select distinct d.id as aid, d.title, cs.student_id from due d join public.assignment_targets t on t.assignment_id = d.id
            join public.classroom_students cs on cs.classroom_id = t.classroom_id and cs.status = 'active'),
  pr as (select p.aid, p.title, exists (select 1 from public.submissions s where s.assignment_id = p.aid and s.student_id = p.student_id and s.status <> 'draft') as done from pairs p),
  agg as (select aid, title, count(*)::int as expected, count(*) filter (where done)::int as completed from pr group by aid, title
          having count(*) >= 3 and count(*) filter (where done)::numeric / count(*) < 0.5)
  select coalesce(jsonb_agg(jsonb_build_object('title', t.title, 'expected', t.expected, 'completed', t.completed) order by t.completed::numeric / t.expected, t.title), '[]'::jsonb) into v_low
    from (select * from agg order by completed::numeric / expected limit 3) t;

  -- орташа нәтижесі 50%-дан төмен оқушылар САНЫ (аттарсыз)
  with best as (
    select distinct on (g.assignment_id, g.student_id) g.student_id, g.score / g.max_score * 100 as pct
      from public.grades g where g.org_id = p_org and (g.graded_at at time zone 'Asia/Almaty')::date between p_from and p_to
     order by g.assignment_id, g.student_id, g.score desc),
  per as (select student_id, avg(pct) as a from best group by student_id)
  select count(*) filter (where a < 50)::int, count(*)::int into v_below, v_stu_n from per;

  return v_base || jsonb_build_object('assignments', v_asg, 'quizzes', v_quiz, 'submissions', v_subs, 'avg_grade_pct', v_avg, 'avg_grade_n', v_avg_n,
    'top_days', v_days, 'hard_assignments', v_hard, 'low_completion', v_low, 'students_below_50', v_below, 'graded_students', v_stu_n,
    'has_activity', exists (select 1 from public.activity_days ad where ad.org_id = p_org and ad.day between p_from and p_to));
end $$;

-- Экспортты аудит журналына жазу (мазмұнсыз): pilot_pdf | pilot_xlsx (ұйым бойынша), platform_csv (ұйымсыз, тек SUPER ADMIN)
create or replace function public.audit_metrics_export(p_org uuid, p_kind text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_kind is null or p_kind not in ('pilot_pdf', 'pilot_xlsx', 'platform_csv') then raise exception 'invalid_input'; end if;
  if p_kind = 'platform_csv' then
    if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  elsif p_org is null or not (public.is_org_admin(p_org) or public.is_platform_admin()) then
    raise exception 'forbidden';
  end if;
  perform public.audit_log(p_org, 'export.' || p_kind, 'export', null, '{}');
end $$;

-- ---------- Құқықтар ----------
revoke all on function public.metrics_orgs(boolean), public.metrics_today(), public.week_start(date), public.org_health_calc(uuid, date, date, boolean) from public, anon, authenticated;
revoke all on function public.touch_activity(uuid), public.purge_activity(int), public.org_health(uuid, int), public.platform_org_health(int, boolean),
  public.platform_kpis(int, boolean, int), public.pilot_report(uuid, date, date), public.audit_metrics_export(uuid, text) from public, anon, authenticated;
grant execute on function public.touch_activity(uuid), public.purge_activity(int), public.org_health(uuid, int), public.platform_org_health(int, boolean),
  public.platform_kpis(int, boolean, int), public.pilot_report(uuid, date, date), public.audit_metrics_export(uuid, text) to authenticated;
