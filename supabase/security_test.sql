-- Қауіпсіздік регрессия тесттері (CI-де anon рөлімен жүреді). Кез келген сәтсіздік — exception.
set role anon;

do $$
declare c text;
begin
  c := public.cs50kz_class_create('CI қауіпсіздік', 'mugalim9')->>'code';
  perform public.cs50kz_push('KZ-CISE-CTST', 'secret12', 'Тест', c, '{}'::jsonb, '{}'::jsonb);

  -- 1) NULL / бос / қате құпиялар өтпеуі керек
  begin perform public.cs50kz_class_view(c, null); raise exception 'FAIL: class_view NULL өтті'; exception when sqlstate '22023' then null; end;
  begin perform public.cs50kz_class_view(c, ''); raise exception 'FAIL: class_view бос өтті'; exception when sqlstate '22023' then null; end;
  begin perform public.cs50kz_class_view(c, 'wrongpass'); raise exception 'FAIL: class_view қате пароль өтті'; exception when sqlstate '28000' then null; end;
  begin perform public.cs50kz_class_remove(c, null, 'KZ-CISE-CTST'); raise exception 'FAIL: class_remove NULL өтті'; exception when sqlstate '22023' then null; end;
  begin perform public.cs50kz_leave_class('KZ-CISE-CTST', null); raise exception 'FAIL: leave_class NULL өтті'; exception when sqlstate '22023' then null; end;
  begin perform public.cs50kz_pull('KZ-CISE-CTST', null); raise exception 'FAIL: pull NULL өтті'; exception when sqlstate '22023' then null; end;
  begin perform public.cs50kz_pull('KZ-CISE-CTST', 'wrongwrong'); raise exception 'FAIL: pull қате құпия өтті'; exception when sqlstate '28000' then null; end;
  begin perform public.cs50kz_push('KZ-CISE-CTST', 'wrongwrong', 'X', null, '{}'::jsonb, '{}'::jsonb); raise exception 'FAIL: push қате құпия өтті'; exception when sqlstate '28000' then null; end;

  -- 2) Кестелерді тікелей оқу жабық
  begin perform count(*) from public.cs50kz_students; raise exception 'FAIL: students кестесі ашық'; exception when insufficient_privilege then null; end;
  begin perform count(*) from public.cs50kz_classes; raise exception 'FAIL: classes кестесі ашық'; exception when insufficient_privilege then null; end;
  begin perform count(*) from public.cs50kz_feedback; raise exception 'FAIL: feedback кестесі ашық'; exception when insufficient_privilege then null; end;

  -- 3) Оқушы әлі сыныпта (жоғарыдағы шабуылдар ештеңе өзгертпеді)
  if jsonb_array_length(public.cs50kz_class_view(c, 'mugalim9')->'students') <> 1 then
    raise exception 'FAIL: оқушы сыныптан жоғалды';
  end if;

  -- 4) Мұғалім шығарса, оқушының p_class=null push-ы оны қайта қоспайды
  perform public.cs50kz_class_remove(c, 'mugalim9', 'KZ-CISE-CTST');
  perform public.cs50kz_push('KZ-CISE-CTST', 'secret12', 'Тест', null, '{}'::jsonb, '{}'::jsonb);
  if jsonb_array_length(public.cs50kz_class_view(c, 'mugalim9')->'students') <> 0 then
    raise exception 'FAIL: шығарылған оқушы қайта қосылды';
  end if;
  -- 5) Тапсырманы тек мұғалім қоя алады; лекция атауы тексеріледі
  begin perform public.cs50kz_class_set_task(c, null, 'week-3', null, 'x'); raise exception 'FAIL: set_task NULL өтті'; exception when sqlstate '22023' then null; end;
  begin perform public.cs50kz_class_set_task(c, 'wrongpass', 'week-3', null, 'x'); raise exception 'FAIL: set_task қате пароль өтті'; exception when sqlstate '28000' then null; end;
  begin perform public.cs50kz_class_set_task(c, 'mugalim9', 'week-99', null, 'x'); raise exception 'FAIL: set_task жоқ лекция өтті'; exception when sqlstate '22023' then null; end;
  perform public.cs50kz_class_set_task(c, 'mugalim9', 'week-3', '2026-10-10', 'Жұмаға дейін');
  if (public.cs50kz_class_view(c, 'mugalim9')->'task'->>'lecture') <> 'week-3' then raise exception 'FAIL: тапсырма сақталмады'; end if;
  raise notice 'Қауіпсіздік тесттері: бәрі өтті ✓';
end $$;
