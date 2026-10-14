import { withUser, type Q } from "@/lib/db";
import { KIND_LABEL, STATUS_LABEL } from "@/lib/format";
import type { Cell, DateRange, Report } from "./types";

// Күн шекаралары Қазақстан уақытымен (Asia/Almaty) есептеледі; уақыт мәтін ретінде беріледі.
const TZ = "Asia/Almaty";
const TS_FMT = "DD.MM.YYYY HH24:MI";
const inSub = (a: string) => `($2::date is null or (coalesce(${a}.submitted_at, ${a}.updated_at) at time zone '${TZ}')::date between $2::date and $3::date)`;
const inGr = (a: string) => `($2::date is null or (${a}.graded_at at time zone '${TZ}')::date between $2::date and $3::date)`;
const ts = (expr: string) => `to_char(${expr} at time zone '${TZ}', '${TS_FMT}')`;
const rangeParams = (r: DateRange | null) => [r?.from ?? null, r?.to ?? null];
const label = (m: Record<string, string>, k: string | null) => (k == null ? "" : m[k] ?? k);
const pctCell = (v: number | null): Cell => ({ v, t: "pct" });
const num = (v: number | null): Cell => ({ v, t: "dec" });
const ratio = (a: number, b: number): Cell => (b > 0 ? pctCell(Math.round((a / b) * 1000) / 10) : null);

const BUCKETS: [string, number, number][] = [["0-49%", 0, 50], ["50-69%", 50, 70], ["70-84%", 70, 85], ["85-100%", 85, 101]];

// ---------------- Мектеп есебі ----------------
export async function loadSchoolReport(userId: string, org: { org_id: string; org_name: string }, range: DateRange | null): Promise<Report> {
  const rp = rangeParams(range);
  const d = await withUser(userId, async (q: Q) => {
    const ov = (await q<{ r: Record<string, number | null> }>("select public.org_overview($1) as r", [org.org_id]))[0].r;
    const inPeriod = (await q<{ subs: number; graded: number }>(
      `select (select count(*)::int from public.submissions s where s.org_id = $1 and s.status <> 'draft' and ${inSub("s")}) as subs,
              (select count(*)::int from public.grades g where g.org_id = $1 and ${inGr("g")}) as graded`, [org.org_id, ...rp]))[0];
    const classes = await q<any>(
      `select c.name, c.subject, c.academic_year, p.full_name as teacher,
         (select count(*)::int from public.classroom_students cs where cs.classroom_id = c.id and cs.status = 'active') as students,
         (select count(*)::int from public.assignment_targets t join public.assignments a on a.id = t.assignment_id and a.status = 'published' where t.classroom_id = c.id) as assignments,
         (select count(*)::int from public.submissions s where s.classroom_id = c.id and s.status <> 'draft' and ${inSub("s")}) as subs,
         (select count(*)::int from public.grades g join public.submissions s on s.id = g.submission_id where s.classroom_id = c.id and ${inGr("g")}) as graded,
         (select round(avg(b.pct)::numeric, 1)::float8 from (select distinct on (g.assignment_id, g.student_id) g.score / g.max_score * 100 as pct
            from public.grades g join public.submissions s on s.id = g.submission_id where s.classroom_id = c.id and ${inGr("g")}
            order by g.assignment_id, g.student_id, g.score desc) b) as avg_pct
       from public.classrooms c left join public.profiles p on p.id = c.teacher_id
       where c.org_id = $1 and c.status = 'active' order by c.name`, [org.org_id, ...rp]);
    const assignments = await q<any>(
      `select a.title, a.kind::text as kind, a.status::text as status, p.full_name as author, ${ts("a.deadline")} as deadline,
         (select count(*)::int from public.assignment_targets t where t.assignment_id = a.id) as classes,
         (select count(distinct s.student_id)::int from public.submissions s where s.assignment_id = a.id and s.status <> 'draft' and ${inSub("s")}) as submitters,
         (select count(distinct g.student_id)::int from public.grades g where g.assignment_id = a.id and ${inGr("g")}) as graded,
         (select round(avg(b.pct)::numeric, 1)::float8 from (select distinct on (g.student_id) g.score / g.max_score * 100 as pct
            from public.grades g where g.assignment_id = a.id and ${inGr("g")} order by g.student_id, g.score desc) b) as avg_pct
       from public.assignments a left join public.profiles p on p.id = a.created_by
       where a.org_id = $1 and a.status <> 'draft' order by a.created_at desc`, [org.org_id, ...rp]);
    return { ov, inPeriod, classes, assignments };
  });
  const { ov, inPeriod } = d;
  const n = (k: string) => Number(ov[k] ?? 0);
  const expected = n("expected_completions");
  const overview: Cell[][] = [
    ["Оқушылар (белсенді)", n("students")], ["Мұғалімдер (белсенді)", n("teachers")], ["Сыныптар (белсенді)", n("classes")],
    ["Жарияланған тапсырмалар", n("assignments_published")], ["Соңғы 30 күнде белсенді оқушылар", n("active_students_30d")],
    ["Күтілетін орындаулар", expected], ["Орындалған жұмыстар", n("completed")], ["Орындалу үлесі", ratio(n("completed"), expected)],
    ["Бағаланған жұмыстар", n("graded")], ["Тексеруді күтетіндер", n("pending_review")],
    ["Орташа үлгерім", pctCell(ov.avg_score_pct == null ? null : Number(ov.avg_score_pct))],
    ...(range ? [["Таңдалған кезеңде жіберілген жұмыс", inPeriod.subs], ["Таңдалған кезеңде қойылған баға", inPeriod.graded]] as Cell[][] : []),
  ];
  return {
    title: "Мектеп жалпы есебі", orgName: org.org_name, generatedAt: new Date(), range, fileBase: "mektep-esebi",
    sheets: [
      { name: "Жалпы", title: "Жалпы көрсеткіштер", columns: [{ header: "Көрсеткіш", type: "text", width: 44 }, { header: "Мән", type: "dec", width: 16 }], rows: overview },
      {
        name: "Сыныптар", title: "Сыныптар", emptyNote: "Белсенді сынып жоқ.",
        columns: [{ header: "Сынып", type: "text", width: 18 }, { header: "Пән", type: "text", width: 22 }, { header: "Оқу жылы", type: "text", width: 12 }, { header: "Мұғалім", type: "text", width: 26 },
          { header: "Оқушы", type: "int", width: 10 }, { header: "Тапсырма", type: "int", width: 11 }, { header: "Жіберілген жұмыс", type: "int", width: 14 }, { header: "Бағаланған", type: "int", width: 12 }, { header: "Орташа %", type: "pct", width: 12 }],
        rows: d.classes.map((c: any) => [c.name, c.subject, c.academic_year, c.teacher ?? "", c.students, c.assignments, c.subs, c.graded, pctCell(c.avg_pct)]),
      },
      {
        name: "Тапсырмалар", title: "Тапсырмалар", emptyNote: "Жарияланған тапсырма жоқ.",
        columns: [{ header: "Тапсырма", type: "text", width: 34 }, { header: "Түрі", type: "text", width: 14 }, { header: "Күйі", type: "text", width: 14 }, { header: "Автор", type: "text", width: 24 },
          { header: "Мерзімі", type: "text", width: 18 }, { header: "Сынып саны", type: "int", width: 11 }, { header: "Жіберген оқушы", type: "int", width: 14 }, { header: "Бағаланған оқушы", type: "int", width: 15 }, { header: "Орташа %", type: "pct", width: 12 }],
        rows: d.assignments.map((a: any) => [a.title, label(KIND_LABEL, a.kind), label(STATUS_LABEL, a.status), a.author ?? "", a.deadline ?? "", a.classes, a.submitters, a.graded, pctCell(a.avg_pct)]),
      },
    ],
  };
}

// ---------------- Сынып есебі ----------------
export type ClassReportResult = { status: "ok"; report: Report } | { status: "not_found" } | { status: "forbidden" };

export async function loadClassReport(
  ctx: { userId: string; memberships: { org_id: string; role: string; org_name: string }[] }, classId: string, range: DateRange | null,
): Promise<ClassReportResult> {
  const rp = rangeParams(range);
  const out = await withUser(ctx.userId, async (q: Q) => {
    const c = (await q<{ id: string; org_id: string; teacher_id: string; name: string; subject: string; academic_year: string; teacher_name: string | null }>(
      `select c.id, c.org_id, c.teacher_id, c.name, c.subject, c.academic_year, p.full_name as teacher_name
         from public.classrooms c left join public.profiles p on p.id = c.teacher_id where c.id = $1`, [classId]))[0];
    if (!c) return { status: "not_found" as const };
    const admin = ctx.memberships.some((m) => m.org_id === c.org_id && m.role === "school_admin");
    if (c.teacher_id !== ctx.userId && !admin) return { status: "forbidden" as const };
    const p = [classId, ...rp];
    const students = await q<any>(
      `select p.full_name,
         (select count(*)::int from public.assignment_targets t join public.assignments a on a.id = t.assignment_id and a.status = 'published' where t.classroom_id = $1) as assigned,
         (select count(distinct s.assignment_id)::int from public.submissions s where s.classroom_id = $1 and s.student_id = cs.student_id and s.status <> 'draft' and ${inSub("s")}) as submitted,
         (select count(distinct s.assignment_id)::int from public.submissions s where s.classroom_id = $1 and s.student_id = cs.student_id and s.status = 'graded' and ${inSub("s")}) as graded,
         (select round(avg(b.pct)::numeric, 1)::float8 from (select distinct on (g.assignment_id) g.score / g.max_score * 100 as pct
            from public.grades g join public.submissions s on s.id = g.submission_id
            where s.classroom_id = $1 and g.student_id = cs.student_id and ${inGr("g")} order by g.assignment_id, g.score desc) b) as avg_pct,
         (select count(*)::int from public.submissions s where s.classroom_id = $1 and s.student_id = cs.student_id and s.status <> 'draft' and ${inSub("s")}) as attempts,
         (select coalesce(round(sum(s.time_spent_seconds) / 60.0), 0)::int from public.submissions s where s.classroom_id = $1 and s.student_id = cs.student_id and s.status <> 'draft' and ${inSub("s")}) as minutes,
         (select ${ts("max(s.updated_at)")} from public.submissions s where s.classroom_id = $1 and s.student_id = cs.student_id) as last_activity
       from public.classroom_students cs join public.profiles p on p.id = cs.student_id
       where cs.classroom_id = $1 and cs.status = 'active' order by p.full_name`, p);
    const assignments = await q<any>(
      `select a.title, a.kind::text as kind, a.status::text as status, ${ts("a.deadline")} as deadline,
         (select count(*)::int from public.classroom_students cs where cs.classroom_id = $1 and cs.status = 'active') as assigned,
         (select count(distinct s.student_id)::int from public.submissions s where s.assignment_id = a.id and s.classroom_id = $1 and s.status <> 'draft' and ${inSub("s")}) as submitted,
         (select count(distinct g.student_id)::int from public.grades g join public.submissions s on s.id = g.submission_id where g.assignment_id = a.id and s.classroom_id = $1 and ${inGr("g")}) as graded,
         (select round(avg(b.pct)::numeric, 1)::float8 from (select distinct on (g.student_id) g.score / g.max_score * 100 as pct
            from public.grades g join public.submissions s on s.id = g.submission_id
            where g.assignment_id = a.id and s.classroom_id = $1 and ${inGr("g")} order by g.student_id, g.score desc) b) as avg_pct
       from public.assignment_targets t join public.assignments a on a.id = t.assignment_id
       where t.classroom_id = $1 and a.status <> 'draft' order by a.created_at desc`, p);
    const grades = await q<any>(
      `select p.full_name, a.title, s.attempt_no, g.score::float8 as score, g.max_score::float8 as max_score,
              round(g.score / g.max_score * 100, 1)::float8 as pct, g.source, ${ts("g.graded_at")} as graded_at
         from public.grades g join public.submissions s on s.id = g.submission_id
         join public.assignments a on a.id = g.assignment_id join public.profiles p on p.id = g.student_id
        where s.classroom_id = $1 and ${inGr("g")} order by p.full_name, a.title, s.attempt_no`, p);
    return { status: "ok" as const, c, students, assignments, grades };
  });
  if (out.status !== "ok") return out;
  const { c, students, assignments, grades } = out;
  const orgName = ctx.memberships.find((m) => m.org_id === c.org_id)?.org_name ?? "";
  const avgs = students.map((s: any) => s.avg_pct).filter((v: number | null) => v != null) as number[];
  const classAvg = avgs.length ? Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 10) / 10 : null;
  const totalSubs = students.reduce((a: number, s: any) => a + s.attempts, 0);
  return {
    status: "ok",
    report: {
      title: `Сынып есебі: ${c.name}`, orgName, generatedAt: new Date(), range, fileBase: "synyp-esebi",
      sheets: [
        {
          name: "Қорытынды", title: "Сынып туралы",
          columns: [{ header: "Көрсеткіш", type: "text", width: 36 }, { header: "Мән", type: "dec", width: 28 }],
          rows: [
            ["Сынып", c.name], ["Пән", c.subject], ["Оқу жылы", c.academic_year], ["Мұғалім", c.teacher_name ?? ""],
            ["Оқушылар", students.length], ["Берілген тапсырмалар", assignments.length],
            ["Кезеңдегі жіберілген жұмыс", totalSubs], ["Кезеңдегі бағалар", grades.length],
            ["Оқушылардың орташа нәтижесі", pctCell(classAvg)],
          ],
        },
        {
          name: "Оқушылар", title: "Оқушылар", emptyNote: "Сыныпта оқушы жоқ.",
          columns: [{ header: "Оқушы", type: "text", width: 28 }, { header: "Берілген", type: "int", width: 10 }, { header: "Жіберген", type: "int", width: 10 }, { header: "Бағаланған", type: "int", width: 12 },
            { header: "Орындау %", type: "pct", width: 12 }, { header: "Орташа %", type: "pct", width: 12 }, { header: "Әрекет", type: "int", width: 9 }, { header: "Уақыт (мин)", type: "int", width: 12 }, { header: "Соңғы белсенділік", type: "text", width: 19 }],
          rows: students.map((s: any) => [s.full_name, s.assigned, s.submitted, s.graded, ratio(s.submitted, s.assigned), pctCell(s.avg_pct), s.attempts, s.minutes, s.last_activity ?? ""]),
        },
        {
          name: "Тапсырмалар", title: "Тапсырмалар", emptyNote: "Сыныпқа жарияланған тапсырма берілмеген.",
          columns: [{ header: "Тапсырма", type: "text", width: 34 }, { header: "Түрі", type: "text", width: 14 }, { header: "Күйі", type: "text", width: 14 }, { header: "Мерзімі", type: "text", width: 18 },
            { header: "Оқушы", type: "int", width: 9 }, { header: "Жіберген", type: "int", width: 10 }, { header: "Бағаланған", type: "int", width: 12 }, { header: "Орташа %", type: "pct", width: 12 }],
          rows: assignments.map((a: any) => [a.title, label(KIND_LABEL, a.kind), label(STATUS_LABEL, a.status), a.deadline ?? "", a.assigned, a.submitted, a.graded, pctCell(a.avg_pct)]),
        },
        {
          name: "Бағалар", title: "Бағалар", emptyNote: "Таңдалған кезеңде баға жоқ.",
          columns: [{ header: "Оқушы", type: "text", width: 28 }, { header: "Тапсырма", type: "text", width: 34 }, { header: "Әрекет", type: "int", width: 9 }, { header: "Балл", type: "dec", width: 9 },
            { header: "Максимум", type: "dec", width: 10 }, { header: "%", type: "pct", width: 9 }, { header: "Қалай қойылды", type: "text", width: 14 }, { header: "Күні", type: "text", width: 18 }],
          rows: grades.map((g: any) => [g.full_name, g.title, g.attempt_no, num(g.score), num(g.max_score), pctCell(g.pct), g.source === "auto" ? "Автоматты" : "Қолмен", g.graded_at]),
        },
        {
          name: "Бағалар таралуы", title: "Бағалар таралуы (оқушылардың орташа нәтижесі бойынша)", emptyNote: "Бағаланған оқушы жоқ.",
          columns: [{ header: "Аралық", type: "text", width: 16 }, { header: "Оқушы саны", type: "int", width: 14 }, { header: "Үлесі %", type: "pct", width: 12 }],
          rows: avgs.length === 0 ? [] : BUCKETS.map(([name, lo, hi]) => {
            const k = avgs.filter((v) => v >= lo && v < hi).length;
            return [name, k, pctCell(Math.round((k / avgs.length) * 1000) / 10)];
          }),
        },
      ],
    },
  };
}
