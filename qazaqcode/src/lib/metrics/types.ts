// platform_kpis / org_health / pilot_report JSON пішімдері (db/migrations/0013_metrics.sql)
export type RoleCounts = { total: number; student: number; teacher: number; school_admin: number };
export type DailyPoint = { day: string; dau: number; student: number; teacher: number; school_admin: number; wau: number; mau: number };
export type FunnelStep = { key: "leads" | "org" | "class" | "assignment" | "submission" | "streak4"; count: number };
export type Cohort = { cohort: string; size: number; active: (number | null)[] };
export type PlatformKpis = {
  generated_for: string; days: number; weeks: number; include_demo: boolean; data_since: string | null; has_activity: boolean;
  totals: { orgs: number; students: number; teachers: number; leads: number };
  current: { dau: RoleCounts; wau: RoleCounts; mau: RoleCounts };
  daily: DailyPoint[]; funnel: FunnelStep[]; retention_orgs: Cohort[]; retention_students: Cohort[];
};
export type OrgHealth = {
  org_id: string; org_name: string; is_demo: boolean; org_created: string; license_state: string; from: string; to: string;
  students: number; teachers: number; active_students: number; active_teachers: number;
  expected: number; completed: number; completed_with_deadline: number; on_time: number; max_students: number | null;
  components: { active_share: number | null; completion: number | null; timeliness: number | null; seats: number | null };
  score: number | null; band: "good" | "watch" | "risk" | "no_data"; small_n: boolean;
  daily: { day: string; students: number; teachers: number }[] | null;
};
export type PilotData = OrgHealth & {
  assignments: number; quizzes: number; submissions: number; avg_grade_pct: number | null; avg_grade_n: number;
  top_days: { day: string; users: number }[];
  hard_assignments: { title: string; avg_pct: number; n: number }[];
  low_completion: { title: string; expected: number; completed: number }[];
  students_below_50: number; graded_students: number; has_activity: boolean;
};
