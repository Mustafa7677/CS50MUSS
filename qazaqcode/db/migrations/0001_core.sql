-- QazaqCode Platform: 0001 - негізгі кестелер.
-- Талап: PostgreSQL 15+, `auth.users` және `auth.uid()` (Supabase немесе db/dev/auth_shim.sql).
-- Әр ұйымға тиесілі кестеде organization_id (org_id) бар. RLS - 0003, функциялар - 0002.

create extension if not exists pgcrypto;

create type public.member_role      as enum ('school_admin', 'teacher', 'student');
create type public.assignment_kind  as enum ('python', 'sql', 'javascript', 'html_css', 'quiz', 'file', 'project');
create type public.difficulty_level as enum ('easy', 'medium', 'hard');
create type public.assignment_status as enum ('draft', 'published', 'archived');
create type public.submission_status as enum ('draft', 'submitted', 'under_review', 'graded');
create type public.license_plan     as enum ('starter', 'pro', 'enterprise');

-- ---------- Қолданушылар ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null check (char_length(full_name) between 2 and 120),
  locale      text not null default 'kk' check (locale in ('kk', 'ru', 'en')),
  created_at  timestamptz not null default now()
);

create table public.platform_admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ---------- Ұйымдар ----------
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  name        text not null check (char_length(name) between 2 and 160),
  status      text not null default 'active' check (status in ('active', 'suspended')),
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.organization_settings (
  org_id          uuid primary key references public.organizations (id) on delete cascade,
  logo_url        text check (logo_url is null or logo_url ~ '^https?://'),
  primary_color   text not null default '#0e7490' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  secondary_color text not null default '#f2b705' check (secondary_color ~ '^#[0-9a-fA-F]{6}$'),
  welcome_text    text check (char_length(welcome_text) <= 600),
  contact_email   text check (char_length(contact_email) <= 160),
  contact_phone   text check (char_length(contact_phone) <= 40),
  custom_domain   text unique check (custom_domain is null or custom_domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$'),
  updated_at      timestamptz not null default now()
);

create table public.licenses (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  plan          public.license_plan not null,
  max_students  integer not null check (max_students >= 0),
  max_teachers  integer not null check (max_teachers >= 0),
  valid_from    date not null default current_date,
  valid_until   date not null,
  status        text not null default 'active' check (status in ('active', 'suspended')),
  features      jsonb not null default '{}'::jsonb,
  notes         text,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  check (valid_until >= valid_from)
);
-- Ұйымның бір ғана белсенді лицензиясы (мерзімі өтсе де жазба қалады: оқу/экспорт сақталады)
create unique index licenses_one_per_org on public.licenses (org_id);

create table public.organization_members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.member_role not null,
  status      text not null default 'active' check (status in ('active', 'removed')),
  joined_at   timestamptz not null default now(),
  unique (org_id, user_id)
);
create index organization_members_user on public.organization_members (user_id) where status = 'active';
create index organization_members_org_role on public.organization_members (org_id, role) where status = 'active';

create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  role         public.member_role not null check (role in ('school_admin', 'teacher')),
  email        text check (email is null or email = lower(email)),
  token_hash   text not null unique,
  expires_at   timestamptz not null,
  created_by   uuid references auth.users (id) on delete set null,
  accepted_by  uuid references auth.users (id) on delete set null,
  accepted_at  timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index invitations_org on public.invitations (org_id);

-- ---------- Сыныптар ----------
create table public.classrooms (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations (id) on delete cascade,
  teacher_id     uuid not null references auth.users (id) on delete restrict,
  name           text not null check (char_length(name) between 1 and 120),
  academic_year  text not null check (char_length(academic_year) between 4 and 20),
  subject        text not null check (char_length(subject) between 1 and 120),
  description    text check (char_length(description) <= 1000),
  student_limit  integer check (student_limit is null or student_limit between 1 and 500),
  join_code      text not null unique check (join_code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  join_enabled   boolean not null default true,
  status         text not null default 'active' check (status in ('active', 'archived')),
  created_at     timestamptz not null default now()
);
create index classrooms_org on public.classrooms (org_id);
create index classrooms_teacher on public.classrooms (teacher_id);

create table public.classroom_students (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  classroom_id  uuid not null references public.classrooms (id) on delete cascade,
  student_id    uuid not null references auth.users (id) on delete cascade,
  status        text not null default 'active' check (status in ('active', 'removed')),
  joined_at     timestamptz not null default now(),
  unique (classroom_id, student_id)
);
create index classroom_students_student on public.classroom_students (student_id) where status = 'active';
create index classroom_students_class on public.classroom_students (classroom_id) where status = 'active';

-- ---------- Тапсырмалар ----------
create table public.assignments (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  created_by    uuid not null references auth.users (id) on delete restrict,
  title         text not null check (char_length(title) between 2 and 200),
  description   text not null default '' check (char_length(description) <= 20000),
  kind          public.assignment_kind not null,
  difficulty    public.difficulty_level not null default 'easy',
  max_score     numeric(7, 2) not null default 100 check (max_score > 0 and max_score <= 1000),
  starter_code  text check (char_length(starter_code) <= 20000),
  max_attempts  integer check (max_attempts is null or max_attempts between 1 and 100),
  deadline      timestamptz,
  allow_late    boolean not null default false,
  hints         jsonb not null default '[]'::jsonb,
  status        public.assignment_status not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index assignments_org on public.assignments (org_id, status);
create index assignments_creator on public.assignments (created_by);

create table public.assignment_targets (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  classroom_id  uuid not null references public.classrooms (id) on delete cascade,
  assigned_at   timestamptz not null default now(),
  unique (assignment_id, classroom_id)
);
create index assignment_targets_class on public.assignment_targets (classroom_id);

-- Тест (quiz) сұрақтары. Дұрыс жауап БӨЛЕК кестеде: оқушыға ешқашан көрінбейді.
create table public.assignment_questions (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  position      integer not null check (position >= 0),
  prompt        text not null check (char_length(prompt) between 1 and 2000),
  options       jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 8),
  points        numeric(7, 2) not null default 1 check (points > 0),
  unique (assignment_id, position)
);
create table public.assignment_answer_keys (
  question_id   uuid primary key references public.assignment_questions (id) on delete cascade,
  org_id        uuid not null references public.organizations (id) on delete cascade,
  correct_index integer not null check (correct_index >= 0),
  explanation   text check (char_length(explanation) <= 2000)
);

-- Код тапсырмасының тест жағдайлары. is_hidden = true болса, оқушыға көрінбейді.
-- (Автоматты қауіпсіз тексеру - 3-кезең; қазір ашық мысалдар оқушыға көрінеді, жасырындар сақталады.)
create table public.assignment_test_cases (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations (id) on delete cascade,
  assignment_id    uuid not null references public.assignments (id) on delete cascade,
  position         integer not null check (position >= 0),
  input            text not null default '' check (char_length(input) <= 5000),
  expected_output  text not null default '' check (char_length(expected_output) <= 5000),
  is_hidden        boolean not null default false,
  points           numeric(7, 2) not null default 1 check (points >= 0),
  unique (assignment_id, position)
);

-- ---------- Жұмыстар мен бағалар ----------
create table public.submissions (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  classroom_id  uuid not null references public.classrooms (id) on delete cascade,
  student_id    uuid not null references auth.users (id) on delete cascade,
  attempt_no    integer not null check (attempt_no >= 1),
  status        public.submission_status not null default 'draft',
  code          text check (char_length(code) <= 100000),
  answers       jsonb not null default '{}'::jsonb,
  time_spent_seconds integer not null default 0 check (time_spent_seconds >= 0),
  started_at    timestamptz not null default now(),
  submitted_at  timestamptz,
  updated_at    timestamptz not null default now(),
  unique (assignment_id, student_id, attempt_no)
);
create index submissions_student on public.submissions (student_id, assignment_id);
create index submissions_class on public.submissions (classroom_id, status);
create index submissions_assignment on public.submissions (assignment_id, status);
-- Бір оқушының бір тапсырмада бір ғана жоба (draft) жұмысы болады
create unique index submissions_one_draft on public.submissions (assignment_id, student_id) where status = 'draft';

create table public.submission_results (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  submission_id uuid not null references public.submissions (id) on delete cascade,
  kind          text not null check (kind in ('quiz_auto', 'sandbox')),
  passed        integer not null default 0 check (passed >= 0),
  total         integer not null default 0 check (total >= 0),
  score         numeric(7, 2) not null default 0,
  details       jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);
create index submission_results_sub on public.submission_results (submission_id);

create table public.grades (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  submission_id uuid not null unique references public.submissions (id) on delete cascade,
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id    uuid not null references auth.users (id) on delete cascade,
  score         numeric(7, 2) not null check (score >= 0),
  max_score     numeric(7, 2) not null check (max_score > 0),
  feedback      text check (char_length(feedback) <= 4000),
  source        text not null check (source in ('auto', 'manual')),
  graded_by     uuid references auth.users (id) on delete set null,
  graded_at     timestamptz not null default now(),
  check (score <= max_score)
);
create index grades_student on public.grades (student_id, assignment_id);
create index grades_assignment on public.grades (assignment_id);

-- ---------- Аудит журналы ----------
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  org_id      uuid references public.organizations (id) on delete set null,
  actor_id    uuid,
  action      text not null,
  entity      text not null,
  entity_id   text,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_org on public.audit_logs (org_id, created_at desc);
