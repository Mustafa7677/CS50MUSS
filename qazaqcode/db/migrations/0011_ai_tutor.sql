-- QazaqCode Platform: 0011 - қазақша «Көмекші» (ережелі кеңесші).
-- ШЫНАЙЫЛЫҚ: бұл жасанды интеллект МОДЕЛІ емес. Көмекші - платформада алдын ала жазылған кеңестер базасына (src/lib/ai/knowledge.ts)
-- негізделген ережелі кеңесші; ешқандай сыртқы API шақырылмайды, деректер сыртқа шықпайды (docs/AI-TUTOR.md).
-- Деректі азайту принципі: әңгіме/хабар тарихы дерекқорда САҚТАЛМАЙДЫ, қолдану жазылмайды.
-- Дерекқорда тек бір баптау бар: мектеп әкімшісі Көмекшіні өз ұйымында қосады/өшіреді (әдепкіде ӨШІРУЛІ).
-- Лицензия: шығыны жоқ болғандықтан барлық жоспарда қол жетімді; лицензия мерзімі біткенде де оқу мүмкіндігі сияқты сақталады.

create table public.ai_org_settings (
  org_id     uuid primary key references public.organizations (id) on delete cascade,
  enabled    boolean not null default false,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.ai_org_settings enable row level security;
create policy ai_settings_select on public.ai_org_settings for select to authenticated using (public.is_org_admin(org_id));
grant select on public.ai_org_settings to authenticated;

-- Ұйымның кез келген мүшесіне: Көмекші қосулы ма
create or replace function public.ai_status(p_org uuid)
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_org_member(p_org) then raise exception 'forbidden'; end if;
  return coalesce((select enabled from public.ai_org_settings where org_id = p_org), false);
end $$;

-- Тек мектеп әкімшісі
create or replace function public.set_ai_settings(p_org uuid, p_enabled boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_org_admin(p_org) then raise exception 'forbidden'; end if;
  if p_enabled is null then raise exception 'invalid_input'; end if;
  insert into public.ai_org_settings (org_id, enabled, updated_by) values (p_org, p_enabled, auth.uid())
  on conflict (org_id) do update set enabled = excluded.enabled, updated_by = auth.uid(), updated_at = now();
  perform public.audit_log(p_org, 'ai.settings', 'organization', p_org::text, jsonb_build_object('enabled', p_enabled));
end $$;

revoke all on function public.ai_status(uuid), public.set_ai_settings(uuid, boolean) from public, anon, authenticated;
grant execute on function public.ai_status(uuid), public.set_ai_settings(uuid, boolean) to authenticated;
