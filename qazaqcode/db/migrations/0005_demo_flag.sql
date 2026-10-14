-- QazaqCode Platform: 0005 - демонстрациялық ұйымдарды белгілеу.
-- Демо деректер нақты клиент деректері ретінде көрсетілмейді: панельде үнемі ескерту шығады.
alter table public.organizations add column is_demo boolean not null default false;

create or replace function public.my_context() returns jsonb
language sql stable security invoker set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'user_id', auth.uid(),
    'full_name', (select full_name from public.profiles where id = auth.uid()),
    'is_platform_admin', public.is_platform_admin(),
    'memberships', coalesce((
      select jsonb_agg(jsonb_build_object('org_id', m.org_id, 'role', m.role, 'org_name', o.name, 'org_slug', o.slug,
                                          'license_state', public.license_state(m.org_id), 'is_demo', o.is_demo) order by m.joined_at)
      from public.organization_members m join public.organizations o on o.id = m.org_id
      where m.user_id = auth.uid() and m.status = 'active'), '[]'::jsonb))
$$;
grant execute on function public.my_context() to authenticated;
