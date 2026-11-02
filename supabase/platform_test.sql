-- © 2026 Sagid Mustafa. All Rights Reserved.
-- AO17 платформасының қауіпсіздік тесттері. Жергілікті таза Postgres-те жүреді:
--   psql -v ON_ERROR_STOP=1 -f supabase/platform_test_stub.sql -f supabase/platform.sql -f supabase/platform_test.sql
-- Кез келген сәтсіздік - exception. Пайдаланушы JWT-сі request.jwt.claims GUC арқылы имитацияланады (Supabase-тегідей).

-- ---------- дерек дайындау (service рөлімен) ----------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'mustafa_admin@admin.ao17.local'),
  ('00000000-0000-0000-0000-000000000001', 'aru@example.com'),
  ('00000000-0000-0000-0000-000000000002', 'bek@example.com'),
  ('00000000-0000-0000-0000-000000000003', 'hacker@example.com');

insert into public.ao_pages (path, course, kind, title, sort) values
  ('python/lectures/week-0.html', 'python', 'lecture', 'Python 0', 0),
  ('python/lectures/week-1.html', 'python', 'lecture', 'Python 1', 1),
  ('sql/lectures/week-0.html', 'sql', 'lecture', 'SQL 0', 0);
insert into public.ao_asset_refs (asset, page) values
  ('assets/data/quiz.js', '*'), ('assets/data/sql-db.js', 'sql/lectures/week-0.html'),
  ('assets/data/py-extra.js', 'course:python'), ('assets/data/sql-extra.js', 'course:sql');

-- service_role: бірінші admin
select set_config('request.jwt.claims', '{"role":"service_role"}', false);
set role service_role;
select public.ao_bootstrap_admin('mustafa_admin@admin.ao17.local');
do $$ begin
  begin perform public.ao_bootstrap_admin('aru@example.com'); raise exception 'FAIL: екінші admin жасалды';
  exception when sqlstate '23505' then null; end;
end $$;
reset role;

create or replace function pg_temp.as_user(uid text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, false);
$$;

-- ---------- 1) anon/студент admin функцияларын шақыра алмайды ----------
set role anon;
do $$ begin
  begin perform public.ao_admin_class_create('x'); raise exception 'FAIL: anon класс ашты';
  exception when insufficient_privilege then null; end;
  begin perform public.ao_can_view('python/lectures/week-0.html'); raise exception 'FAIL: anon can_view шақырды';
  exception when insufficient_privilege then null; end;
  begin perform count(*) from public.ao_classes; raise exception 'FAIL: anon classes оқыды';
  exception when insufficient_privilege then null; end;
  perform count(*) from public.ao_pages;   -- каталог жария
end $$;
reset role;

select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
set role authenticated;
do $$ begin
  begin perform public.ao_admin_class_create('Хак'); raise exception 'FAIL: студент класс ашты';
  exception when sqlstate '42501' then null; end;
  begin insert into public.ao_classes (title, join_code, invite_token) values ('Хак', 'ABCDEFGH', repeat('a', 32));
        raise exception 'FAIL: студент classes-қа жазды';
  exception when insufficient_privilege then null; end;
  begin update public.ao_profiles set role = 'admin' where id = auth.uid(); raise exception 'FAIL: студент рөлін өзгертті';
  exception when insufficient_privilege then null; end;
  if public.ao_can_view('python/lectures/week-0.html') then raise exception 'FAIL: класссыз студент бетті көрді'; end if;
  if (select count(*) from public.ao_classes) <> 0 then raise exception 'FAIL: студент кластарды көрді'; end if;
end $$;
reset role;

-- ---------- 2) admin: класс, курс ашу ----------
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
set role authenticated;
create temp table t_class as select * from public.ao_admin_class_create('Python 2026');
reset role;
grant select on t_class to authenticated;
set role authenticated;
insert into public.ao_grants (class_id, scope, target) select id, 'course', 'python' from t_class;
do $$ begin
  if not public.ao_can_view('sql/lectures/week-0.html') then raise exception 'FAIL: admin бәрін көрмеді'; end if;
  if (select count(*) from public.ao_admin_overview()) <> 1 then raise exception 'FAIL: overview'; end if;
end $$;
reset role;

-- ---------- 3) студент кодпен қосылады ----------
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
set role authenticated;
do $$ declare code text := (select join_code from t_class); begin
  begin perform public.ao_join('WRONGCOD'); raise exception 'FAIL: қате код өтті';
  exception when sqlstate 'P0002' then null; end;
  perform public.ao_join(lower(code));
  if not public.ao_can_view('python/lectures/week-1.html') then raise exception 'FAIL: ашық курс көрінбеді'; end if;
  if public.ao_can_view('sql/lectures/week-0.html') then raise exception 'FAIL: ашылмаған курс көрінді'; end if;
  if not public.ao_can_view('assets/data/quiz.js') then raise exception 'FAIL: * дерек файлы көрінбеді'; end if;
  if public.ao_can_view('assets/data/sql-db.js') then raise exception 'FAIL: SQL дерегі көрінді'; end if;
  if not public.ao_can_view('assets/data/py-extra.js') then raise exception 'FAIL: course:python дерегі көрінбеді'; end if;
  if public.ao_can_view('assets/data/sql-extra.js') then raise exception 'FAIL: course:sql дерегі көрінді'; end if;
  if public.ao_can_view('assets/data/unknown.js') then raise exception 'FAIL: тіркелмеген файл көрінді'; end if;
  if public.ao_can_view('python/../sql/lectures/week-0.html') then raise exception 'FAIL: жол айла'; end if;
  if (select count(*) from public.ao_my_access()) <> 2 then raise exception 'FAIL: my_access саны'; end if;
  if (select count(*) from public.ao_members) <> 1 then raise exception 'FAIL: студент басқа мүшелерді көрді'; end if;
  insert into public.ao_progress (user_id, snapshot, summary) values (auth.uid(), '{"d":{}}', '{"lectures":2,"exam":80}');
  begin insert into public.ao_progress (user_id, snapshot) values ('00000000-0000-0000-0000-000000000002', '{}');
        raise exception 'FAIL: басқаның прогресін жазды';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- инвайт токенімен екінші студент
select pg_temp.as_user('00000000-0000-0000-0000-000000000002');
set role authenticated;
do $$ begin
  perform public.ao_join((select invite_token from t_class));
  if (select count(*) from public.ao_progress) <> 0 then raise exception 'FAIL: басқаның прогресі көрінді'; end if;
end $$;
reset role;

-- ---------- 4) admin: бетті жабу, мерзім, прогресс, шығару ----------
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
set role authenticated;
insert into public.ao_grants (class_id, scope, target, open) select id, 'page', 'python/lectures/week-1.html', false from t_class;
do $$ begin
  if (select count(*) from public.ao_admin_members((select id from t_class))) <> 2 then raise exception 'FAIL: мүшелер саны'; end if;
  if (select summary->>'exam' from public.ao_admin_members((select id from t_class)) where email = 'aru@example.com') <> '80' then
    raise exception 'FAIL: admin прогресті көрмеді'; end if;
end $$;
reset role;

select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
set role authenticated;
do $$ begin
  if public.ao_can_view('python/lectures/week-1.html') then raise exception 'FAIL: жабылған бет көрінді'; end if;
  if not public.ao_can_view('python/lectures/week-0.html') then raise exception 'FAIL: курстың қалғаны жабылды'; end if;
end $$;
reset role;

-- мерзім: курсты болашақта ашу
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
set role authenticated;
update public.ao_grants set opens_at = now() + interval '1 day' where scope = 'course';
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
set role authenticated;
do $$ begin
  if public.ao_can_view('python/lectures/week-0.html') then raise exception 'FAIL: әлі ашылмаған курс көрінді'; end if;
  if public.ao_can_view('assets/data/quiz.js') then raise exception 'FAIL: белсенді грантсыз * дерек көрінді'; end if;
end $$;
reset role;

-- курсты қайта ашып, студентті шығару
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
set role authenticated;
update public.ao_grants set opens_at = null where scope = 'course';
delete from public.ao_members where user_id = '00000000-0000-0000-0000-000000000001';
update public.ao_classes set join_open = false;
reset role;

select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
set role authenticated;
do $$ begin
  if public.ao_can_view('python/lectures/week-0.html') then raise exception 'FAIL: шығарылған студент көрді'; end if;
  begin perform public.ao_join((select join_code from t_class)); raise exception 'FAIL: жабық класқа қосылды';
  exception when sqlstate '42501' then null; end;
end $$;
reset role;

-- екінші студент әлі көреді; класс мұрағатталса - жоқ
select pg_temp.as_user('00000000-0000-0000-0000-000000000002');
set role authenticated;
do $$ begin
  if not public.ao_can_view('python/lectures/week-0.html') then raise exception 'FAIL: қалған студент көрмеді'; end if;
end $$;
reset role;
update public.ao_classes set archived = true;
set role authenticated;
do $$ begin
  if public.ao_can_view('python/lectures/week-0.html') then raise exception 'FAIL: мұрағат класы ашық'; end if;
end $$;
reset role;

-- ---------- 5) кодтарды жаңарту ескі кодты өшіреді ----------
update public.ao_classes set archived = false, join_open = true;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
set role authenticated;
do $$ declare old text := (select join_code from t_class); n public.ao_classes; begin
  n := public.ao_admin_regen_codes((select id from t_class));
  if n.join_code = old then raise exception 'FAIL: код жаңармады'; end if;
end $$;
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-000000000003');
set role authenticated;
do $$ begin
  begin perform public.ao_join((select join_code from t_class)); raise exception 'FAIL: ескі код жұмыс істеді';
  exception when sqlstate 'P0002' then null; end;
end $$;
reset role;

select 'platform_test: БАРЛЫҒЫ ӨТТІ' as result;
