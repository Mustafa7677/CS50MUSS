-- QazaqCode Platform: 0003 - Row Level Security және құқықтар.
-- Принцип: клиент рөлі (authenticated) кестелерді ТЕК ОҚИДЫ (RLS-пен), барлық жазу - 0002-дегі SECURITY DEFINER функциялар.
-- SUPER ADMIN оқушылардың жеке деректерін (сыныптар, жұмыстар, бағалар) көрмейді: тек platform_usage() жиынтығын көреді.

-- ---------- RLS-ке арналған көмекші функциялар ----------
create or replace function public.teacher_has_student(p_org uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.classroom_students cs join public.classrooms c on c.id = cs.classroom_id
                 where c.org_id = p_org and c.teacher_id = auth.uid() and cs.student_id = p_user and cs.status = 'active')
$$;

create or replace function public.can_view_profile(p_target uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select p_target = auth.uid()
    or exists (select 1 from public.organization_members t
               join public.organization_members me on me.org_id = t.org_id and me.user_id = auth.uid() and me.status = 'active' and me.role = 'school_admin'
               where t.user_id = p_target and t.status = 'active')
    or exists (select 1 from public.classroom_students cs join public.classrooms c on c.id = cs.classroom_id
               where cs.student_id = p_target and c.teacher_id = auth.uid())
    or exists (select 1 from public.classroom_students cs join public.classrooms c on c.id = cs.classroom_id
               where c.teacher_id = p_target and cs.student_id = auth.uid() and cs.status = 'active')
$$;

-- Тапсырманы басқара алады: ұйым әкімшісі, жасаушы-ұстаз немесе берілген сыныптың ұстазы
create or replace function public.can_manage_assignment(p_assignment uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.assignments a
    where a.id = p_assignment
      and (public.is_org_admin(a.org_id)
           or (a.created_by = auth.uid() and public.is_org_staff(a.org_id))
           or exists (select 1 from public.assignment_targets t where t.assignment_id = a.id and public.is_class_teacher(t.classroom_id))))
$$;

create or replace function public.can_view_assignment(p_assignment uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.can_manage_assignment(p_assignment) or public.student_sees_assignment(p_assignment)
$$;

create or replace function public.can_manage_question(p_question uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.assignment_questions q where q.id = p_question and public.can_manage_assignment(q.assignment_id))
$$;

create or replace function public.can_view_submission(p_submission uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.submissions s
                 where s.id = p_submission and (s.student_id = auth.uid() or public.is_class_teacher(s.classroom_id) or public.is_org_admin(s.org_id)))
$$;

-- ---------- RLS қосу ----------
alter table public.profiles               enable row level security;
alter table public.platform_admins        enable row level security;
alter table public.organizations          enable row level security;
alter table public.organization_settings  enable row level security;
alter table public.licenses               enable row level security;
alter table public.organization_members   enable row level security;
alter table public.invitations            enable row level security;
alter table public.classrooms             enable row level security;
alter table public.classroom_students     enable row level security;
alter table public.assignments            enable row level security;
alter table public.assignment_targets     enable row level security;
alter table public.assignment_questions   enable row level security;
alter table public.assignment_answer_keys enable row level security;
alter table public.assignment_test_cases  enable row level security;
alter table public.submissions            enable row level security;
alter table public.submission_results     enable row level security;
alter table public.grades                 enable row level security;
alter table public.audit_logs             enable row level security;

-- ---------- Саясаттар (тек SELECT; жазу - функциялар арқылы) ----------
create policy profiles_select on public.profiles for select to authenticated using (public.can_view_profile(id));
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy platform_admins_select on public.platform_admins for select to authenticated using (user_id = auth.uid());

create policy organizations_select on public.organizations for select to authenticated using (public.is_platform_admin() or public.is_org_member(id));
create policy org_settings_select on public.organization_settings for select to authenticated using (public.is_platform_admin() or public.is_org_member(org_id));
create policy licenses_select on public.licenses for select to authenticated using (public.is_platform_admin() or public.is_org_admin(org_id));

create policy members_select on public.organization_members for select to authenticated using (
  user_id = auth.uid() or public.is_org_admin(org_id) or (public.is_org_staff(org_id) and role = 'student' and public.teacher_has_student(org_id, user_id)));
create policy invitations_select on public.invitations for select to authenticated using (public.is_org_admin(org_id) or public.is_platform_admin());

create policy classrooms_select on public.classrooms for select to authenticated using (
  public.is_org_admin(org_id) or teacher_id = auth.uid() or public.is_class_student(id));
create policy classroom_students_select on public.classroom_students for select to authenticated using (
  student_id = auth.uid() or public.is_class_teacher(classroom_id) or public.is_org_admin(org_id));

create policy assignments_select on public.assignments for select to authenticated using (public.can_view_assignment(id));
create policy targets_select on public.assignment_targets for select to authenticated using (public.can_view_assignment(assignment_id));
create policy questions_select on public.assignment_questions for select to authenticated using (public.can_view_assignment(assignment_id));
create policy answer_keys_select on public.assignment_answer_keys for select to authenticated using (public.can_manage_question(question_id));
create policy test_cases_select on public.assignment_test_cases for select to authenticated using (
  public.can_manage_assignment(assignment_id) or (is_hidden = false and public.student_sees_assignment(assignment_id)));

create policy submissions_select on public.submissions for select to authenticated using (
  student_id = auth.uid() or public.is_class_teacher(classroom_id) or public.is_org_admin(org_id));
create policy results_select on public.submission_results for select to authenticated using (public.can_view_submission(submission_id));
create policy grades_select on public.grades for select to authenticated using (public.can_view_submission(submission_id));

create policy audit_select on public.audit_logs for select to authenticated using (
  public.is_platform_admin() or (org_id is not null and public.is_org_admin(org_id)));

-- ---------- Құқықтар: әдепкіні жабамыз, қажеттісін ашамыз ----------
revoke all on all tables in schema public from anon, authenticated, public;
revoke all on all functions in schema public from anon, authenticated, public;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke all on tables from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on public.platform_admins, public.organizations, public.organization_settings, public.licenses,
  public.organization_members, public.classrooms, public.classroom_students, public.assignments, public.assignment_targets,
  public.assignment_questions, public.assignment_answer_keys, public.assignment_test_cases, public.submissions,
  public.submission_results, public.grades, public.audit_logs, public.profiles to authenticated;
-- Шақыру токенінің хэші клиентке берілмейді
grant select (id, org_id, role, email, expires_at, created_by, accepted_by, accepted_at, revoked_at, created_at) on public.invitations to authenticated;
-- Профильде тек өз атын/тілін өзгертеді
grant update (full_name, locale) on public.profiles to authenticated;

-- RLS саясаттары шақыратын көмекшілер
grant execute on function
  public.is_platform_admin(), public.member_role_in(uuid), public.is_org_member(uuid), public.is_org_admin(uuid), public.is_org_staff(uuid),
  public.is_class_teacher(uuid), public.is_class_student(uuid), public.student_sees_assignment(uuid), public.license_state(uuid),
  public.license_ok(uuid), public.teacher_has_student(uuid, uuid), public.can_view_profile(uuid), public.can_manage_assignment(uuid),
  public.can_view_assignment(uuid), public.can_manage_question(uuid), public.can_view_submission(uuid), public.my_context()
  to authenticated;

-- RPC (жазу операциялары)
grant execute on function
  public.create_organization(text, text, public.license_plan, date, integer, integer),
  public.set_license(uuid, public.license_plan, integer, integer, date, text, text),
  public.set_org_status(uuid, text),
  public.update_org_settings(uuid, text, text, text, text, text, text),
  public.create_invitation(uuid, public.member_role, text, integer),
  public.revoke_invitation(uuid),
  public.accept_invitation(text),
  public.set_member_status(uuid, uuid, text),
  public.create_classroom(uuid, text, text, text, text, integer),
  public.regenerate_join_code(uuid),
  public.update_classroom(uuid, text, text, text, text, integer, boolean, boolean),
  public.remove_student(uuid, uuid),
  public.join_classroom(text),
  public.upsert_assignment(jsonb),
  public.set_assignment_targets(uuid, uuid[]),
  public.set_assignment_status(uuid, public.assignment_status),
  public.save_draft(uuid, text, jsonb, integer),
  public.submit_assignment(uuid),
  public.begin_review(uuid),
  public.grade_submission(uuid, numeric, text)
  to authenticated;

-- Аноним (кіру/тіркелу беттері): тек қауіпсіз алдын ала қарау
grant execute on function public.org_branding(text), public.invitation_preview(text), public.classroom_preview(text) to anon, authenticated;
