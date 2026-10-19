-- QazaqCode Platform: 0014 - табыс арнасы: лицензияға тапсырыс -> баға -> шот -> қолмен төлем белгісі -> активтендіру + жаңарту еске салғыштары.
-- Шешімдер:
--  * Онлайн-төлем шлюзі ЖОҚ. Төлем банк аударымымен, SUPER ADMIN «төленді» деп қолмен белгілейді (mark_paid).
--  * Баға КОДТА/МИГРАЦИЯДА ЖОҚ: platform_prices кестесін SUPER ADMIN өзі баптайды. Баға жоқ болса - «баға келісім бойынша».
--  * Сатушы мен сатып алушы реквизиттерін иелері өздері енгізеді (platform_seller_profile, org_billing_profile): әдепкі мән жоқ.
--  * Ақша - тиынмен (bigint), ҚҚС есебі бүтін сандарда (ауытқусыз), дөңгелектеу - жартысынан жоғары (half up).
--  * Жазу ТЕК SECURITY DEFINER RPC арқылы. Мектеп әкімшісі тек өз ұйымының тапсырысын көреді; SUPER ADMIN барлығын (оқушы деректерін емес).
--  * Аудитке қаржылық мазмұн (сома, реквизит) жазылмайды: тек күй/пакет метадеректері.

-- ---------- Кестелер ----------
create table public.platform_prices (
  id            uuid primary key default gen_random_uuid(),
  plan          public.license_plan not null,
  months        integer not null check (months between 1 and 60),
  student_limit integer not null check (student_limit between 1 and 100000),   -- осы санға дейінгі оқушыға арналған бағасы
  price_tiyn    bigint not null check (price_tiyn between 1 and 1000000000000),
  currency      text not null check (currency in ('KZT', 'USD', 'EUR', 'RUB')),
  vat_mode      text not null check (vat_mode in ('none', 'included', 'added')),  -- ҚҚС жоқ | баға ҚҚС-пен | ҚҚС үстіне қосылады
  vat_rate_bp   integer not null check (vat_rate_bp between 0 and 5000),          -- ставка % x 100 (1200 = 12,00%)
  valid_from    date not null,
  valid_until   date,
  active        boolean not null default true,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (valid_until is null or valid_until >= valid_from),
  check ((vat_mode = 'none' and vat_rate_bp = 0) or (vat_mode <> 'none' and vat_rate_bp > 0))
);
create index platform_prices_lookup on public.platform_prices (plan, months, student_limit) where active;

-- Сатушы (платформа иесі) реквизиттері: бір жол. Бос болса шот берілмейді.
create table public.platform_seller_profile (
  id                 boolean primary key default true check (id),
  legal_name         text not null check (char_length(legal_name) between 2 and 200),
  bin_iin            text not null check (bin_iin ~ '^[0-9]{12}$'),
  address            text not null check (char_length(address) between 5 and 300),
  bank_name          text not null check (char_length(bank_name) between 2 and 160),
  bik                text not null check (bik ~ '^[A-Z0-9]{8,11}$'),
  iik                text not null check (iik ~ '^KZ[0-9]{2}[0-9A-Z]{16}$'),
  kbe                text not null check (kbe ~ '^[0-9]{2}$'),
  vat_payer          boolean not null,
  vat_cert           text check (vat_cert is null or char_length(vat_cert) between 2 and 80),
  director_name      text not null check (char_length(director_name) between 2 and 160),
  contact_email      text check (contact_email is null or (char_length(contact_email) <= 160 and contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  contact_phone      text check (contact_phone is null or char_length(contact_phone) between 5 and 40),
  payment_terms_days integer not null check (payment_terms_days between 1 and 90),
  updated_by         uuid references auth.users (id) on delete set null,
  updated_at         timestamptz not null default now(),
  check (not vat_payer or vat_cert is not null)
);

-- Сатып алушы (мектеп) реквизиттері: ұйымның өзі енгізеді.
create table public.org_billing_profile (
  org_id        uuid primary key references public.organizations (id) on delete cascade,
  legal_name    text not null check (char_length(legal_name) between 2 and 200),
  bin_iin       text not null check (bin_iin ~ '^[0-9]{12}$'),
  address       text not null check (char_length(address) between 5 and 300),
  bank_name     text not null check (char_length(bank_name) between 2 and 160),
  bik           text not null check (bik ~ '^[A-Z0-9]{8,11}$'),
  iik           text not null check (iik ~ '^KZ[0-9]{2}[0-9A-Z]{16}$'),
  kbe           text not null check (kbe ~ '^[0-9]{2}$'),
  contact_name  text check (contact_name is null or char_length(contact_name) between 2 and 160),
  contact_email text check (contact_email is null or (char_length(contact_email) <= 160 and contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  contact_phone text check (contact_phone is null or char_length(contact_phone) between 5 and 40),
  updated_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now()
);

-- Жылдық дәйекті шот нөмірі (қатарсыз, транзакциямен бірге қайтарылады)
create table public.invoice_counters (
  year    integer primary key,
  last_no integer not null check (last_no > 0)
);

create table public.licence_orders (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations (id) on delete cascade,
  requested_by      uuid references auth.users (id) on delete set null,
  plan              public.license_plan not null,
  months            integer not null check (months between 1 and 60),
  students          integer not null check (students between 1 and 100000),
  teachers          integer not null check (teachers between 1 and 10000),
  status            text not null default 'requested' check (status in ('requested', 'quoted', 'invoiced', 'paid', 'activated', 'rejected', 'cancelled')),
  note              text check (note is null or char_length(note) <= 1000),
  admin_note        text check (admin_note is null or char_length(admin_note) <= 1000),
  -- баға снапшоты (ұсыныс берілгенде жазылады; шот берілген соң өзгермейді)
  price_id          uuid references public.platform_prices (id) on delete set null,
  price_source      text check (price_source in ('price_list', 'negotiated')),
  currency          text check (currency in ('KZT', 'USD', 'EUR', 'RUB')),
  vat_mode          text check (vat_mode in ('none', 'included', 'added')),
  vat_rate_bp       integer check (vat_rate_bp between 0 and 5000),
  price_tiyn        bigint check (price_tiyn between 1 and 1000000000000),
  net_tiyn          bigint,
  vat_tiyn          bigint,
  total_tiyn        bigint,
  -- реквизиттер снапшоты
  buyer_snapshot    jsonb,
  seller_snapshot   jsonb,
  invoice_no        text,
  invoice_date      date,
  due_date          date,
  paid_ref          text check (paid_ref is null or char_length(paid_ref) between 1 and 100),
  paid_date         date,
  paid_marked_by    uuid references auth.users (id) on delete set null,
  activated_at      timestamptz,
  activated_by      uuid references auth.users (id) on delete set null,
  result_valid_until date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (price_tiyn is null or (net_tiyn is not null and vat_tiyn is not null and total_tiyn is not null))
);
create unique index licence_orders_invoice_no on public.licence_orders (invoice_no) where invoice_no is not null;
create index licence_orders_org on public.licence_orders (org_id, created_at desc);
create index licence_orders_status on public.licence_orders (status, created_at desc);

-- Еске салу журналы: бір ұйым/мерзім/босағаға бір рет қана
create table public.licence_reminder_log (
  org_id      uuid not null references public.organizations (id) on delete cascade,
  valid_until date not null,
  threshold   integer not null check (threshold in (1, 7, 14, 30)),
  sent_at     timestamptz not null default now(),
  primary key (org_id, valid_until, threshold)
);

-- ---------- RLS ----------
alter table public.platform_prices         enable row level security;
alter table public.platform_seller_profile enable row level security;
alter table public.org_billing_profile     enable row level security;
alter table public.invoice_counters        enable row level security;
alter table public.licence_orders          enable row level security;
alter table public.licence_reminder_log    enable row level security;

create policy prices_select on public.platform_prices for select to authenticated using (public.is_platform_admin());
create policy seller_select on public.platform_seller_profile for select to authenticated using (public.is_platform_admin());
create policy billing_select on public.org_billing_profile for select to authenticated using (public.is_platform_admin() or public.is_org_admin(org_id));
create policy orders_select on public.licence_orders for select to authenticated using (public.is_platform_admin() or public.is_org_admin(org_id));
-- invoice_counters, licence_reminder_log: саясат жоқ = клиентке жабық

revoke all on public.platform_prices, public.platform_seller_profile, public.org_billing_profile, public.invoice_counters,
  public.licence_orders, public.licence_reminder_log from public, anon, authenticated;
grant select on public.platform_prices, public.platform_seller_profile, public.org_billing_profile, public.licence_orders to authenticated;

-- ---------- Ішкі көмекшілер ----------
-- ҚҚС бөлу: бүтін тиынмен, жартысынан жоғары дөңгелектеу (half up).
--   none:     net = P,        vat = 0,                         total = P
--   added:    net = P,        vat = round(P * r),              total = net + vat
--   included: total = P,      vat = round(P * r / (1 + r)),    net = total - vat       (r = bp / 10000)
create or replace function public.vat_split(p_price bigint, p_mode text, p_bp integer)
returns table (net bigint, vat bigint, total bigint)
language plpgsql immutable set search_path = public, pg_temp as $$
declare v bigint;
begin
  if p_price is null or p_price < 0 or p_bp is null or p_bp < 0 then raise exception 'invalid_input'; end if;
  if p_mode = 'none' then
    return query select p_price, 0::bigint, p_price;
  elsif p_mode = 'added' then
    v := (p_price * p_bp * 2 + 10000) / 20000;
    return query select p_price, v, p_price + v;
  elsif p_mode = 'included' then
    v := (p_price * p_bp * 2 + (10000 + p_bp)) / (2 * (10000 + p_bp));
    return query select p_price - v, v, p_price;
  else
    raise exception 'invalid_input';
  end if;
end $$;

create or replace function public.order_transition_ok(p_from text, p_to text) returns boolean
language sql immutable set search_path = public, pg_temp as $$
  select (p_from, p_to) in (
    ('requested', 'quoted'), ('requested', 'rejected'), ('requested', 'cancelled'),
    ('quoted', 'quoted'), ('quoted', 'invoiced'), ('quoted', 'rejected'), ('quoted', 'cancelled'),
    ('invoiced', 'paid'), ('invoiced', 'rejected'), ('invoiced', 'cancelled'),
    ('paid', 'activated'))
$$;

create or replace function public.order_notify_admins(p_org uuid, p_title text, p_body text)
returns void language sql security definer set search_path = public, pg_temp as $$
  select public.notify(m.user_id, p_org, 'licence', p_title, p_body, '/school/licence/order')
    from public.organization_members m where m.org_id = p_org and m.role = 'school_admin' and m.status = 'active'
$$;

-- Қорғаныс: шот берілген соң снапшот бағандары өзгермейді; күй ауысуы тек рұқсат етілген жолмен
create or replace function public.trg_licence_orders_guard() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if new.status is distinct from old.status and not public.order_transition_ok(old.status, new.status) then raise exception 'order_invalid_state'; end if;
  if old.invoice_no is not null and (
       new.org_id is distinct from old.org_id or new.requested_by is distinct from old.requested_by or new.plan is distinct from old.plan
    or new.months is distinct from old.months or new.students is distinct from old.students or new.teachers is distinct from old.teachers
    or new.price_id is distinct from old.price_id and new.price_id is not null
    or new.price_source is distinct from old.price_source or new.currency is distinct from old.currency or new.vat_mode is distinct from old.vat_mode
    or new.vat_rate_bp is distinct from old.vat_rate_bp or new.price_tiyn is distinct from old.price_tiyn or new.net_tiyn is distinct from old.net_tiyn
    or new.vat_tiyn is distinct from old.vat_tiyn or new.total_tiyn is distinct from old.total_tiyn or new.buyer_snapshot is distinct from old.buyer_snapshot
    or new.seller_snapshot is distinct from old.seller_snapshot or new.invoice_no is distinct from old.invoice_no
    or new.invoice_date is distinct from old.invoice_date or new.due_date is distinct from old.due_date or new.created_at is distinct from old.created_at) then
    raise exception 'order_snapshot_locked';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger licence_orders_guard before update on public.licence_orders for each row execute function public.trg_licence_orders_guard();

-- ---------- Мектеп әкімшісі: реквизиттер ----------
create or replace function public.set_billing_profile(
  p_org uuid, p_legal_name text, p_bin_iin text, p_address text, p_bank_name text, p_bik text, p_iik text, p_kbe text,
  p_contact_name text default null, p_contact_email text default null, p_contact_phone text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.require_user();
  if not public.is_org_admin(p_org) then raise exception 'forbidden'; end if;
  begin
    insert into public.org_billing_profile (org_id, legal_name, bin_iin, address, bank_name, bik, iik, kbe, contact_name, contact_email, contact_phone, updated_by)
    values (p_org, btrim(coalesce(p_legal_name, '')), btrim(coalesce(p_bin_iin, '')), btrim(coalesce(p_address, '')), btrim(coalesce(p_bank_name, '')),
            upper(btrim(coalesce(p_bik, ''))), upper(replace(btrim(coalesce(p_iik, '')), ' ', '')), btrim(coalesce(p_kbe, '')),
            nullif(btrim(coalesce(p_contact_name, '')), ''), nullif(btrim(coalesce(p_contact_email, '')), ''), nullif(btrim(coalesce(p_contact_phone, '')), ''), auth.uid())
    on conflict (org_id) do update set legal_name = excluded.legal_name, bin_iin = excluded.bin_iin, address = excluded.address, bank_name = excluded.bank_name,
      bik = excluded.bik, iik = excluded.iik, kbe = excluded.kbe, contact_name = excluded.contact_name, contact_email = excluded.contact_email,
      contact_phone = excluded.contact_phone, updated_by = excluded.updated_by, updated_at = now();
  exception when check_violation then raise exception 'invalid_input';
  end;
  perform public.audit_log(p_org, 'billing.profile', 'organization', p_org::text, '{}');
end $$;

-- ---------- SUPER ADMIN: сатушы профилі мен баға ----------
create or replace function public.set_seller_profile(
  p_legal_name text, p_bin_iin text, p_address text, p_bank_name text, p_bik text, p_iik text, p_kbe text, p_vat_payer boolean,
  p_vat_cert text, p_director_name text, p_payment_terms_days integer, p_contact_email text default null, p_contact_phone text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if p_vat_payer is null then raise exception 'invalid_input'; end if;
  begin
    insert into public.platform_seller_profile (id, legal_name, bin_iin, address, bank_name, bik, iik, kbe, vat_payer, vat_cert, director_name,
      contact_email, contact_phone, payment_terms_days, updated_by)
    values (true, btrim(coalesce(p_legal_name, '')), btrim(coalesce(p_bin_iin, '')), btrim(coalesce(p_address, '')), btrim(coalesce(p_bank_name, '')),
            upper(btrim(coalesce(p_bik, ''))), upper(replace(btrim(coalesce(p_iik, '')), ' ', '')), btrim(coalesce(p_kbe, '')), p_vat_payer,
            case when p_vat_payer then nullif(btrim(coalesce(p_vat_cert, '')), '') end, btrim(coalesce(p_director_name, '')),
            nullif(btrim(coalesce(p_contact_email, '')), ''), nullif(btrim(coalesce(p_contact_phone, '')), ''), p_payment_terms_days, auth.uid())
    on conflict (id) do update set legal_name = excluded.legal_name, bin_iin = excluded.bin_iin, address = excluded.address, bank_name = excluded.bank_name,
      bik = excluded.bik, iik = excluded.iik, kbe = excluded.kbe, vat_payer = excluded.vat_payer, vat_cert = excluded.vat_cert,
      director_name = excluded.director_name, contact_email = excluded.contact_email, contact_phone = excluded.contact_phone,
      payment_terms_days = excluded.payment_terms_days, updated_by = excluded.updated_by, updated_at = now();
  exception when check_violation then raise exception 'invalid_input';
  end;
  perform public.audit_log(null, 'seller.profile', 'platform', null, '{}');
end $$;

create or replace function public.set_price(
  p_id uuid, p_plan public.license_plan, p_months integer, p_student_limit integer, p_price_tiyn bigint, p_currency text,
  p_vat_mode text, p_vat_rate_bp integer, p_valid_from date, p_valid_until date, p_active boolean default true)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid := p_id;
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  begin
    if p_id is null then
      insert into public.platform_prices (plan, months, student_limit, price_tiyn, currency, vat_mode, vat_rate_bp, valid_from, valid_until, active, created_by)
      values (p_plan, p_months, p_student_limit, p_price_tiyn, p_currency, p_vat_mode, p_vat_rate_bp, p_valid_from, p_valid_until, coalesce(p_active, true), auth.uid())
      returning id into v_id;
    else
      update public.platform_prices set plan = p_plan, months = p_months, student_limit = p_student_limit, price_tiyn = p_price_tiyn, currency = p_currency,
        vat_mode = p_vat_mode, vat_rate_bp = p_vat_rate_bp, valid_from = p_valid_from, valid_until = p_valid_until, active = coalesce(p_active, true), updated_at = now()
       where id = p_id;
      if not found then raise exception 'not_found'; end if;
    end if;
  exception when check_violation or not_null_violation then raise exception 'invalid_input';
  end;
  perform public.audit_log(null, 'price.set', 'platform_price', v_id::text, jsonb_build_object('plan', p_plan, 'months', p_months, 'active', coalesce(p_active, true)));
  return v_id;
end $$;

create or replace function public.delete_price(p_id uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  delete from public.platform_prices where id = p_id;
  if not found then raise exception 'not_found'; end if;
  perform public.audit_log(null, 'price.delete', 'platform_price', p_id::text, '{}');
end $$;

-- Бағаны іздеу: белсенді, мерзімі жарамды, пакет пен мерзім сәйкес, лимиті жететін ең кіші саты
create or replace function public.price_lookup(p_plan public.license_plan, p_months integer, p_students integer)
returns public.platform_prices language sql stable security definer set search_path = public, pg_temp as $$
  select p.* from public.platform_prices p
   where p.active and p.plan = p_plan and p.months = p_months and p.student_limit >= p_students
     and p.valid_from <= current_date and (p.valid_until is null or p.valid_until >= current_date)
   order by p.student_limit asc, p.valid_from desc limit 1
$$;

-- Мектеп әкімшісіне/SUPER ADMIN-ге: қазір жарамды баға тізімі (ҚҚС есебімен). Тізім бос = «баға келісім бойынша».
create or replace function public.price_list()
returns table (plan public.license_plan, months integer, student_limit integer, currency text, vat_mode text, vat_rate_bp integer,
               price_tiyn bigint, net_tiyn bigint, vat_tiyn bigint, total_tiyn bigint, valid_until date)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not (public.is_platform_admin() or exists (select 1 from public.organization_members m where m.user_id = auth.uid() and m.role = 'school_admin' and m.status = 'active')) then
    raise exception 'forbidden';
  end if;
  return query
    select p.plan, p.months, p.student_limit, p.currency, p.vat_mode, p.vat_rate_bp, p.price_tiyn, s.net, s.vat, s.total, p.valid_until
      from public.platform_prices p cross join lateral public.vat_split(p.price_tiyn, p.vat_mode, p.vat_rate_bp) s
     where p.active and p.valid_from <= current_date and (p.valid_until is null or p.valid_until >= current_date)
     order by p.plan, p.months, p.student_limit;
end $$;

-- ---------- Тапсырыс ағыны ----------
create or replace function public.request_licence(
  p_org uuid, p_plan public.license_plan, p_months integer, p_students integer, p_teachers integer, p_note text default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_prof public.org_billing_profile; v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  perform public.require_user();
  if not public.is_org_admin(p_org) then raise exception 'forbidden'; end if;
  if not exists (select 1 from public.organizations where id = p_org and status = 'active') then raise exception 'org_suspended'; end if;
  if p_months is null or p_months < 1 or p_months > 60 or p_students is null or p_students < 1 or p_students > 100000
     or p_teachers is null or p_teachers < 1 or p_teachers > 10000 or p_plan is null then raise exception 'invalid_input'; end if;
  if v_note is not null and char_length(v_note) > 1000 then raise exception 'invalid_input'; end if;
  select * into v_prof from public.org_billing_profile where org_id = p_org;
  if not found then raise exception 'billing_profile_missing'; end if;
  perform pg_advisory_xact_lock(hashtextextended('order:' || p_org::text, 0));
  if (select count(*) from public.licence_orders where org_id = p_org and status in ('requested', 'quoted', 'invoiced')) >= 5 then raise exception 'order_limit'; end if;
  insert into public.licence_orders (org_id, requested_by, plan, months, students, teachers, note, buyer_snapshot)
  values (p_org, auth.uid(), p_plan, p_months, p_students, p_teachers, v_note, to_jsonb(v_prof) - 'org_id' - 'updated_by' - 'updated_at')
  returning id into v_id;
  perform public.audit_log(p_org, 'order.request', 'licence_order', v_id::text, jsonb_build_object('plan', p_plan, 'months', p_months));
  perform public.notify(a.user_id, null, 'licence', 'Жаңа лицензия тапсырысы', 'Мектептен лицензияға тапсырыс түсті.', '/admin/orders') from public.platform_admins a;
  return v_id;
end $$;

-- Баға ұсынысы: p_price_tiyn бос болса баға тізімінен; толтырылса келісім бойынша (валюта, ҚҚС ашық көрсетіледі)
create or replace function public.quote_order(
  p_order uuid, p_price_tiyn bigint default null, p_currency text default null, p_vat_mode text default null, p_vat_rate_bp integer default null, p_note text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.licence_orders; pr public.platform_prices; s record; v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_price bigint; v_cur text; v_mode text; v_bp integer; v_src text; v_pid uuid;
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if v_note is not null and char_length(v_note) > 1000 then raise exception 'invalid_input'; end if;
  select * into o from public.licence_orders where id = p_order for update;
  if not found then raise exception 'not_found'; end if;
  if o.status not in ('requested', 'quoted') then raise exception 'order_invalid_state'; end if;
  if p_price_tiyn is null then
    select * into pr from public.price_lookup(o.plan, o.months, o.students);
    if pr.id is null then raise exception 'price_not_set'; end if;
    v_price := pr.price_tiyn; v_cur := pr.currency; v_mode := pr.vat_mode; v_bp := pr.vat_rate_bp; v_src := 'price_list'; v_pid := pr.id;
  else
    if p_price_tiyn < 1 or p_price_tiyn > 1000000000000 or p_currency is null or p_vat_mode is null or p_vat_rate_bp is null
       or p_currency not in ('KZT', 'USD', 'EUR', 'RUB') or p_vat_mode not in ('none', 'included', 'added') or p_vat_rate_bp not between 0 and 5000
       or (p_vat_mode = 'none' and p_vat_rate_bp <> 0) or (p_vat_mode <> 'none' and p_vat_rate_bp = 0) then raise exception 'invalid_input'; end if;
    v_price := p_price_tiyn; v_cur := p_currency; v_mode := p_vat_mode; v_bp := p_vat_rate_bp; v_src := 'negotiated'; v_pid := null;
  end if;
  select * into s from public.vat_split(v_price, v_mode, v_bp);
  update public.licence_orders set status = 'quoted', price_id = v_pid, price_source = v_src, currency = v_cur, vat_mode = v_mode, vat_rate_bp = v_bp,
    price_tiyn = v_price, net_tiyn = s.net, vat_tiyn = s.vat, total_tiyn = s.total, admin_note = v_note where id = p_order;
  perform public.audit_log(o.org_id, 'order.quote', 'licence_order', p_order::text, jsonb_build_object('source', v_src));
  perform public.order_notify_admins(o.org_id, 'Лицензия бағасы ұсынылды', 'Тапсырысыңызға баға ұсынылды. Шот жақында берілетін болады.');
end $$;

create or replace function public.issue_invoice(p_order uuid) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.licence_orders; sp public.platform_seller_profile; bp public.org_billing_profile; s record;
  v_today date := (now() at time zone 'Asia/Almaty')::date; v_year integer := extract(year from (now() at time zone 'Asia/Almaty'))::integer; v_n integer; v_no text;
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  select * into o from public.licence_orders where id = p_order for update;
  if not found then raise exception 'not_found'; end if;
  if o.status <> 'quoted' then raise exception 'order_invalid_state'; end if;
  if o.price_tiyn is null then raise exception 'price_not_set'; end if;
  select * into sp from public.platform_seller_profile;
  if not found then raise exception 'seller_profile_missing'; end if;
  if o.vat_mode <> 'none' and not sp.vat_payer then raise exception 'vat_mismatch'; end if;
  select * into bp from public.org_billing_profile where org_id = o.org_id;
  if not found then raise exception 'billing_profile_missing'; end if;
  select * into s from public.vat_split(o.price_tiyn, o.vat_mode, o.vat_rate_bp);
  insert into public.invoice_counters (year, last_no) values (v_year, 1)
  on conflict (year) do update set last_no = public.invoice_counters.last_no + 1 returning last_no into v_n;
  v_no := v_year::text || '-' || lpad(v_n::text, 5, '0');
  update public.licence_orders set status = 'invoiced', invoice_no = v_no, invoice_date = v_today, due_date = v_today + sp.payment_terms_days,
    net_tiyn = s.net, vat_tiyn = s.vat, total_tiyn = s.total,
    seller_snapshot = to_jsonb(sp) - 'id' - 'updated_by' - 'updated_at',
    buyer_snapshot = to_jsonb(bp) - 'org_id' - 'updated_by' - 'updated_at'
   where id = p_order;
  perform public.audit_log(o.org_id, 'order.invoice', 'licence_order', p_order::text, jsonb_build_object('invoice_no', v_no));
  perform public.order_notify_admins(o.org_id, 'Төлем шоты дайын', 'Шот № ' || v_no || ' берілді. Оны лицензия бетінен жүктеп алыңыз.');
  return v_no;
end $$;

create or replace function public.mark_paid(p_order uuid, p_ref text, p_date date) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.licence_orders; v_ref text := btrim(coalesce(p_ref, '')); v_today date := (now() at time zone 'Asia/Almaty')::date;
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if char_length(v_ref) not between 1 and 100 or p_date is null then raise exception 'invalid_input'; end if;
  select * into o from public.licence_orders where id = p_order for update;
  if not found then raise exception 'not_found'; end if;
  if o.status <> 'invoiced' then raise exception 'order_invalid_state'; end if;
  if p_date > v_today or p_date < o.invoice_date then raise exception 'invalid_payment_date'; end if;
  update public.licence_orders set status = 'paid', paid_ref = v_ref, paid_date = p_date, paid_marked_by = auth.uid() where id = p_order;
  perform public.audit_log(o.org_id, 'order.paid', 'licence_order', p_order::text, jsonb_build_object('invoice_no', o.invoice_no));
  perform public.order_notify_admins(o.org_id, 'Төлем расталды', 'Шот № ' || o.invoice_no || ' бойынша төлем расталды. Лицензия жақында белсендіріледі.');
end $$;

-- Активтендіру: лицензияны жаңартады/береді. Тоқтатылған лицензия не ұйымды өздігінен қайта қоспайды.
create or replace function public.activate_order(p_order uuid) returns date
language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.licence_orders; l public.licenses; v_until date;
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  select * into o from public.licence_orders where id = p_order for update;
  if not found then raise exception 'not_found'; end if;
  if o.status <> 'paid' then raise exception 'order_invalid_state'; end if;
  if not exists (select 1 from public.organizations where id = o.org_id and status = 'active') then raise exception 'org_suspended'; end if;
  select * into l from public.licenses where org_id = o.org_id for update;
  if found and l.status <> 'active' then raise exception 'license_suspended'; end if;
  if found and l.plan = o.plan and l.max_students = o.students and l.max_teachers = o.teachers then
    v_until := public.extend_license(o.org_id, o.months);
  else
    v_until := (greatest(coalesce(l.valid_until, current_date), current_date) + make_interval(months => o.months))::date;
    perform public.set_license(o.org_id, o.plan, o.students, o.teachers, v_until, 'active', l.notes);
  end if;
  update public.licence_orders set status = 'activated', activated_at = now(), activated_by = auth.uid(), result_valid_until = v_until where id = p_order;
  perform public.audit_log(o.org_id, 'order.activate', 'licence_order', p_order::text, jsonb_build_object('invoice_no', o.invoice_no, 'valid_until', v_until));
  perform public.order_notify_admins(o.org_id, 'Лицензия жаңартылды', 'Лицензия мерзімі жаңартылды. Рақмет!');
  return v_until;
end $$;

create or replace function public.reject_order(p_order uuid, p_note text default null) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.licence_orders; v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if v_note is not null and char_length(v_note) > 1000 then raise exception 'invalid_input'; end if;
  select * into o from public.licence_orders where id = p_order for update;
  if not found then raise exception 'not_found'; end if;
  if not public.order_transition_ok(o.status, 'rejected') then raise exception 'order_invalid_state'; end if;
  update public.licence_orders set status = 'rejected', admin_note = coalesce(v_note, admin_note) where id = p_order;
  perform public.audit_log(o.org_id, 'order.reject', 'licence_order', p_order::text, jsonb_build_object('from', o.status));
  perform public.order_notify_admins(o.org_id, 'Тапсырыс қабылданбады', 'Лицензия тапсырысы қабылданбады. Толығырақ тапсырыс бетінде.');
end $$;

create or replace function public.cancel_order(p_order uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.licence_orders;
begin
  perform public.require_user();
  select * into o from public.licence_orders where id = p_order for update;
  if not found then raise exception 'not_found'; end if;
  if not (public.is_platform_admin() or public.is_org_admin(o.org_id)) then raise exception 'not_found'; end if;   -- басқа ұйымның тапсырысының барын білдірмейді
  if not public.order_transition_ok(o.status, 'cancelled') then raise exception 'order_invalid_state'; end if;
  update public.licence_orders set status = 'cancelled' where id = p_order;
  perform public.audit_log(o.org_id, 'order.cancel', 'licence_order', p_order::text, jsonb_build_object('from', o.status));
end $$;

-- SUPER ADMIN тізімі: ұйым атымен және сұраушы (мектеп әкімшісі) атымен; оқушы деректері жоқ
create or replace function public.admin_list_orders(p_status text default null)
returns table (id uuid, created_at timestamptz, org_id uuid, org_name text, requester text, plan public.license_plan, months integer, students integer,
               teachers integer, status text, note text, admin_note text, currency text, vat_mode text, vat_rate_bp integer, price_source text,
               net_tiyn bigint, vat_tiyn bigint, total_tiyn bigint, invoice_no text, invoice_date date, due_date date, paid_ref text, paid_date date,
               activated_at timestamptz, result_valid_until date, buyer_legal_name text, buyer_bin_iin text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if p_status is not null and p_status not in ('requested', 'quoted', 'invoiced', 'paid', 'activated', 'rejected', 'cancelled') then raise exception 'invalid_status'; end if;
  return query
    select o.id, o.created_at, o.org_id, g.name, pr.full_name, o.plan, o.months, o.students, o.teachers, o.status, o.note, o.admin_note, o.currency, o.vat_mode,
           o.vat_rate_bp, o.price_source, o.net_tiyn, o.vat_tiyn, o.total_tiyn, o.invoice_no, o.invoice_date, o.due_date, o.paid_ref, o.paid_date,
           o.activated_at, o.result_valid_until, o.buyer_snapshot ->> 'legal_name', o.buyer_snapshot ->> 'bin_iin'
      from public.licence_orders o join public.organizations g on g.id = o.org_id left join public.profiles pr on pr.id = o.requested_by
     where p_status is null or o.status = p_status
     order by o.created_at desc;
end $$;

create or replace function public.audit_orders_export(p_count integer) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  perform public.audit_log(null, 'order.export', 'licence_order', null, jsonb_build_object('count', coalesce(p_count, 0)));
end $$;

-- ---------- Жаңарту еске салғыштары ----------
-- Мерзімі аяқталуға 0..30 күн қалған белсенді лицензиялар үшін: бір ұйым/мерзім/босағаға (30, 14, 7, 1) ТЕК бір рет.
-- Босаға = күн санынан кем емес ең кіші мән (cron бір күнді өткізіп алса, келесі іске қосуда жеткізіледі). Мерзім ұзарса цикл жаңадан басталады.
-- SUPER ADMIN не тікелей DB қосылымы (scripts/licence-reminders.mjs). Қайтарады: жіберілген хабарландыру саны.
create or replace function public.licence_reminders() returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare r record; v_th integer; v_n integer := 0; v_ins integer; v_cnt integer;
begin
  if not (public.is_platform_admin() or (auth.uid() is null and current_setting('role', true) in ('none', ''))) then raise exception 'forbidden'; end if;
  for r in
    select l.org_id, l.valid_until, (l.valid_until - current_date) as d
      from public.licenses l join public.organizations o on o.id = l.org_id
     where l.status = 'active' and o.status = 'active' and l.valid_until >= current_date and l.valid_until - current_date <= 30
  loop
    v_th := case when r.d <= 1 then 1 when r.d <= 7 then 7 when r.d <= 14 then 14 else 30 end;
    insert into public.licence_reminder_log (org_id, valid_until, threshold) values (r.org_id, r.valid_until, v_th) on conflict do nothing;
    get diagnostics v_ins = row_count;
    if v_ins = 1 then
      with sent as (
        select public.notify(m.user_id, r.org_id, 'licence',
          case when r.d = 0 then 'Лицензия бүгін аяқталады' else 'Лицензия ' || r.d || ' күннен кейін аяқталады' end,
          'Үзіліссіз жұмыс үшін лицензияны жаңартыңыз: тапсырыс беріңіз.', '/school/licence/order') as x
          from public.organization_members m where m.org_id = r.org_id and m.role = 'school_admin' and m.status = 'active')
      select count(*) into v_cnt from sent;
      v_n := v_n + v_cnt;
    end if;
  end loop;
  return v_n;
end $$;

-- ---------- Құқықтар ----------
revoke all on function
  public.vat_split(bigint, text, integer), public.order_transition_ok(text, text), public.order_notify_admins(uuid, text, text),
  public.trg_licence_orders_guard(),
  public.set_billing_profile(uuid, text, text, text, text, text, text, text, text, text, text),
  public.set_seller_profile(text, text, text, text, text, text, text, boolean, text, text, integer, text, text),
  public.set_price(uuid, public.license_plan, integer, integer, bigint, text, text, integer, date, date, boolean), public.delete_price(uuid),
  public.price_lookup(public.license_plan, integer, integer), public.price_list(),
  public.request_licence(uuid, public.license_plan, integer, integer, integer, text),
  public.quote_order(uuid, bigint, text, text, integer, text), public.issue_invoice(uuid), public.mark_paid(uuid, text, date),
  public.activate_order(uuid), public.reject_order(uuid, text), public.cancel_order(uuid), public.admin_list_orders(text),
  public.audit_orders_export(integer), public.licence_reminders()
  from public, anon, authenticated;

grant execute on function
  public.set_billing_profile(uuid, text, text, text, text, text, text, text, text, text, text),
  public.set_seller_profile(text, text, text, text, text, text, text, boolean, text, text, integer, text, text),
  public.set_price(uuid, public.license_plan, integer, integer, bigint, text, text, integer, date, date, boolean), public.delete_price(uuid),
  public.price_list(), public.request_licence(uuid, public.license_plan, integer, integer, integer, text),
  public.quote_order(uuid, bigint, text, text, integer, text), public.issue_invoice(uuid), public.mark_paid(uuid, text, date),
  public.activate_order(uuid), public.reject_order(uuid, text), public.cancel_order(uuid), public.admin_list_orders(text),
  public.audit_orders_export(integer), public.licence_reminders()
  to authenticated;
