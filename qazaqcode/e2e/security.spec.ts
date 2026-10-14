import { test, expect, type Browser } from "@playwright/test";
import pg from "pg";
import { SignJWT } from "jose";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";

// QazaqCode: қауіпсіздік аудитінің шабуыл тесттері (3-кезең). docs/SECURITY-AUDIT.md-мен бірге оқыңыз.
// Іске қосу (production build + seed-demo):
//   DATABASE_URL=... AUTH_JWT_SECRET=... E2E_BASE_URL=http://127.0.0.1:3206 E2E_RL_BASE_URL=http://127.0.0.1:3216 \
//   E2E_DIST=.next-f npx playwright test e2e/security.spec.ts
// 3206: RATE_LIMIT_DISABLED=yes (негізгі), 3216: rate limit ҚОСУЛЫ + COOKIE_SECURE=true (brute force, cookie атрибуттары).
// Сессия токені AUTH_JWT_SECRET-пен қол қойылады (серверге қатысты ортақ құпия), server action-дар манифесттен шақырылады.
const BASE = process.env.E2E_BASE_URL || "http://127.0.0.1:3206";
const RL = process.env.E2E_RL_BASE_URL || "http://127.0.0.1:3216";
const DIST = process.env.E2E_DIST || process.env.NEXT_DIST_DIR || ".next";
const SECRET = process.env.AUTH_JWT_SECRET || "dev-secret-dev-secret-dev-secret-1234";
const SAME = new TextEncoder().encode(SECRET);
const STAMP = Date.now();
const MARK = "ZZBMARK";
const XSS = `"><img src=x onerror="window.__xss=1"><script>window.__xss=1</script>`;
const PASS = "DemoPass123";

let db: pg.Pool;
const sql = async <T = any>(s: string, p: unknown[] = []) => (await db.query(s, p)).rows as T[];
/** Қолданушы атынан (RLS қолданылады) */
async function asUser<T = any>(uid: string, s: string, p: unknown[] = []): Promise<T[]> {
  const c = await db.connect();
  try {
    await c.query("begin"); await c.query("set local role authenticated");
    await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: uid, role: "authenticated" })]);
    const r = await c.query(s, p); await c.query("commit"); return r.rows;
  } catch (e) { await c.query("rollback").catch(() => {}); throw e; } finally { c.release(); }
}
const newUser = async (name: string, email: string) => (await sql("select auth_dev.sign_up($1,$2,$3) as id", [email, PASS, name]))[0].id as string;
const uidOf = async (email: string) => (await sql("select id from auth.users where email=$1", [email]))[0].id as string;

const mint = (sub: string, o: { exp?: number | string; secret?: Uint8Array; alg?: string; noExp?: boolean } = {}) => {
  const j = new SignJWT({ role: "authenticated" }).setProtectedHeader({ alg: o.alg ?? "HS256" }).setSubject(sub).setIssuedAt();
  if (!o.noExp) j.setExpirationTime(o.exp ?? "1h");
  return j.sign(o.secret ?? SAME);
};
const cookieFor = async (uid: string | null) => (uid ? `qc_session=${await mint(uid)}` : "");

type R = { status: number; loc: string | null; text: string; headers: Headers };
async function get(p: string, cookie = "", o: { base?: string; headers?: Record<string, string> } = {}): Promise<R> {
  const r = await fetch((o.base ?? BASE) + p, { redirect: "manual", headers: { ...(cookie ? { cookie } : {}), ...(o.headers ?? {}) } });
  return { status: r.status, loc: r.headers.get("location"), text: await r.text(), headers: r.headers };
}
/** Жауап «рұқсат жоқ» деп саналады: бағыттау/401/403/404, не 200 болса да құпия мәтінсіз */
const leaks = (r: R, needles: string[]) => needles.filter((n) => r.text.includes(n));
const denied = (r: R) => [301, 302, 303, 307, 308, 401, 403, 404].includes(r.status);

// ---- Server action шақыру (манифест бойынша id; React reply пішімі) ----
let ACTIONS: Record<string, string> = {};
function loadActions() {
  const m = JSON.parse(fs.readFileSync(path.join(process.cwd(), DIST, "server", "server-reference-manifest.json"), "utf8")).node as Record<string, { filename: string; exportedName: string }>;
  ACTIONS = {};
  for (const [id, v] of Object.entries(m)) ACTIONS[`${v.filename}#${v.exportedName}`] = id;
}
const has = (name: string) => !!ACTIONS[name];
async function act(name: string, args: unknown[], cookie = "", o: { base?: string; headers?: Record<string, string> } = {}): Promise<R & { ok?: boolean; error?: string }> {
  const id = ACTIONS[name]; if (!id) throw new Error("server action жоқ: " + name);
  const fd = new FormData();
  const enc = args.map((a, i) => {
    if (a instanceof FormData) { for (const [k, v] of a.entries()) fd.append(`_${i + 1}_${k}`, v); return `$K${i + 1}`; }
    return a;
  });
  const headers: Record<string, string> = { "Next-Action": id, Accept: "text/x-component", Origin: o.base ?? BASE, ...(cookie ? { cookie } : {}), ...(o.headers ?? {}) };
  let body: FormData | string;
  if ([...fd.keys()].length) { fd.append("0", JSON.stringify(enc)); body = fd; } else { body = JSON.stringify(enc); headers["content-type"] = "text/plain;charset=UTF-8"; }
  const r = await fetch((o.base ?? BASE) + "/login", { method: "POST", headers, body, redirect: "manual" });
  const text = await r.text();
  const okm = /"ok":(true|false)/.exec(text); const em = /"error":"([^"]*)"/.exec(text);
  return { status: r.status, loc: r.headers.get("x-action-redirect") ?? r.headers.get("location"), text, headers: r.headers, ok: okm ? okm[1] === "true" : undefined, error: em?.[1] };
}
const form = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };

// ---- Деректер ----
const S: any = { A: {}, B: {} };
const A = S.A, B = S.B;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  db = new pg.Pool({ connectionString: process.env.DATABASE_URL!, max: 4 });
  loadActions();
  // --- A мектебі (демо) ---
  A.org = (await sql("select id from organizations where slug='demo-mektep'"))[0].id;
  A.root = await uidOf("root@demo.qazaqcode.kz"); A.admin = await uidOf("admin@demo.qazaqcode.kz");
  A.t1 = await uidOf("teacher1@demo.qazaqcode.kz"); A.t2 = await uidOf("teacher2@demo.qazaqcode.kz");
  A.s1 = await uidOf("student1@demo.qazaqcode.kz"); A.s2 = await uidOf("student2@demo.qazaqcode.kz"); A.s3 = await uidOf("student3@demo.qazaqcode.kz");
  A.c1 = (await sql("select id from classrooms where org_id=$1 and teacher_id=$2", [A.org, A.t1]))[0].id;
  A.c2 = (await sql("select id from classrooms where org_id=$1 and teacher_id=$2", [A.org, A.t2]))[0].id;
  A.s2name = (await sql("select full_name from profiles where id=$1", [A.s2]))[0].full_name;
  A.quiz1 = (await sql("select id from assignments where org_id=$1 and kind='quiz' and created_by=$2 limit 1", [A.org, A.t1]))[0].id;
  A.quiz2 = (await sql("select id from assignments where org_id=$1 and kind='quiz' and created_by=$2 limit 1", [A.org, A.t2]))[0].id;
  A.py = (await sql("select id from assignments where org_id=$1 and kind='python' limit 1", [A.org]))[0].id;
  A.sub2 = (await sql("select id from submissions where student_id=$1 and status<>'draft' limit 1", [A.s2]))[0].id;
  A.pySub = (await sql("select s.id from submissions s where s.assignment_id=$1 and s.status='submitted' limit 1", [A.py]))[0]?.id;

  // --- B мектебі: барлық мәтін MARK және XSS жүктемесін қамтиды ---
  await sql("delete from auth.users where email like '%@sec.test'");
  const o = (await asUser(A.root, "select public.create_organization($1,$2,'pro',(now()+interval '300 days')::date) as r", [`${MARK} Мектеп ${XSS}`, `zzb-${STAMP}`]))[0].r;
  B.org = o.org_id;
  B.admin = await newUser(`${MARK} Әкімші`, `b.admin.${STAMP}@sec.test`);
  await asUser(B.admin, "select public.accept_invitation($1)", [o.admin_invite_token]);
  const ti = (await asUser(B.admin, "select public.create_invitation($1,'teacher') as t", [B.org]))[0].t;
  B.teacher = await newUser(`${MARK} Мұғалім ${XSS}`, `b.teacher.${STAMP}@sec.test`);
  await asUser(B.teacher, "select public.accept_invitation($1)", [ti]);
  B.cls = (await asUser(B.teacher, "select public.create_classroom($1,$2,'2025-2026',$3,$4) as id", [B.org, `${MARK} Сынып ${XSS}`, `${MARK} Пән ${XSS}`, `${MARK} сипаттама ${XSS}`]))[0].id;
  B.code = (await sql("select join_code from classrooms where id=$1", [B.cls]))[0].join_code;
  B.student = await newUser(`${MARK} Оқушы ${XSS}`, `b.student.${STAMP}@sec.test`);
  B.student2 = await newUser(`${MARK} =HYPERLINK("http://evil.example","x")`, `b.student2.${STAMP}@sec.test`);
  for (const s of [B.student, B.student2]) await asUser(s, "select public.join_classroom($1)", [B.code]);
  const quiz = { org_id: B.org, title: `${MARK} Тест ${XSS}`, description: `${MARK} сипаттама ${XSS}`, kind: "quiz", max_score: 10, max_attempts: 5,
    questions: [{ prompt: `${MARK} Сұрақ ${XSS}`, options: [`жауап А ${XSS}`, "жауап Б"], correct_index: 1, points: 1, explanation: `${MARK}-EXPL-${STAMP}` }] };
  B.quiz = (await asUser(B.teacher, "select public.upsert_assignment($1::jsonb) as id", [JSON.stringify(quiz)]))[0].id;
  const code = { org_id: B.org, title: `${MARK} Код ${XSS}`, description: XSS, kind: "python", max_score: 10, starter_code: XSS,
    test_cases: [{ input: "1", expected_output: "HIDDEN-OUT-" + STAMP, is_hidden: true, points: 1 }] };
  B.py = (await asUser(B.teacher, "select public.upsert_assignment($1::jsonb) as id", [JSON.stringify(code)]))[0].id;
  for (const a of [B.quiz, B.py]) {
    await asUser(B.teacher, "select public.set_assignment_targets($1,$2::uuid[])", [a, [B.cls]]);
    await asUser(B.teacher, "select public.set_assignment_status($1,'published')", [a]);
  }
  const qid = (await sql("select id from assignment_questions where assignment_id=$1", [B.quiz]))[0].id;
  B.sub = (await asUser(B.student, "select public.save_draft($1,null,$2::jsonb,5) as id", [B.quiz, JSON.stringify({ [qid]: 1 })]))[0].id;
  await asUser(B.student, "select public.submit_assignment($1)", [B.sub]);
  B.pySub = (await asUser(B.student, "select public.save_draft($1,$2,'{}'::jsonb,5) as id", [B.py, XSS]))[0].id;
  await asUser(B.student, "select public.submit_assignment($1)", [B.pySub]);
  await asUser(B.teacher, "select public.grade_submission($1, 5, $2)", [B.pySub, `${MARK} пікір ${XSS}`]);
  B.course = (await asUser(B.teacher, "select public.create_course($1,$2,$3) as id", [B.org, `${MARK} Курс ${XSS}`, `${MARK} ${XSS}`]))[0].id;
  await asUser(B.teacher, "select public.save_course_structure($1,$2::jsonb)", [B.course, JSON.stringify({ modules: [{ title: `${MARK} Модуль ${XSS}`, lessons: [{ title: `${MARK} Сабақ ${XSS}`, blocks: [
    { type: "text", content: XSS }, { type: "note", content: XSS }, { type: "code", content: XSS, language: "html" },
    { type: "image", content: "https://example.com/a.png", caption: XSS }, { type: "video", content: "https://example.com/v.mp4", caption: XSS }] }] }] })]);
  await asUser(B.teacher, "select public.set_course_targets($1,$2::uuid[])", [B.course, [B.cls]]);
  await asUser(B.teacher, "select public.set_course_status($1,'published')", [B.course]);
  B.lesson = (await sql("select id from lessons where course_id=$1", [B.course]))[0].id;
});
test.afterAll(async () => {
  await sql("delete from organizations where id=$1", [B.org]).catch(() => {});
  await sql("delete from auth.users where email like '%@sec.test'").catch(() => {});
  await db.end();
});

const bUrls = () => [
  `/teacher/classes/${B.cls}`, `/teacher/classes/${B.cls}?tab=students`, `/teacher/classes/${B.cls}/students/${B.student}`, `/teacher/classes/${B.cls}/export`,
  `/teacher/assignments/${B.quiz}/edit`, `/teacher/assignments/${B.py}/edit`, `/teacher/courses/${B.course}`, `/teacher/submissions/${B.sub}`, `/teacher/submissions/${B.pySub}`,
  `/school/classes/${B.cls}`, `/school/classes/${B.cls}/export`, `/school/students/${B.student}`, `/school/courses/${B.course}`,
  `/student/assignments/${B.quiz}`, `/student/assignments/${B.py}`, `/student/courses/${B.course}`,
  `/api/reports/class/${B.cls}`, `/api/reports/class/${B.cls}?format=pdf`, `/api/reports/class/${B.cls}?format=xlsx`,
];

test.describe("a) IDOR: басқа мектептің ресурстары", () => {
  test("позитивті бақылау: иелері өз деректерін көреді (тест бос емес)", async () => {
    const ct = await cookieFor(B.teacher), ca = await cookieFor(B.admin), cs = await cookieFor(B.student);
    for (const [p, c] of [[`/teacher/classes/${B.cls}`, ct], [`/teacher/courses/${B.course}`, ct], [`/teacher/submissions/${B.sub}`, ct],
      [`/school/classes/${B.cls}`, ca], [`/school/students/${B.student}`, ca], [`/student/assignments/${B.quiz}`, cs], [`/student/courses/${B.course}?lesson=${B.lesson}`, cs]] as const) {
      const r = await get(p, c);
      expect(r.status, p).toBe(200);
      expect(r.text, p).toContain(MARK);
    }
    expect((await get(`/api/reports/class/${B.cls}?format=xlsx`, ct)).status).toBe(200);
  });

  for (const who of ["s1", "t1", "admin", "root"] as const) {
    test(`A.${who} B мектебінің ешбір бетіне/API-іне кіре алмайды және ештеңе ағып кетпейді`, async () => {
      const c = await cookieFor(A[who]);
      for (const p of bUrls()) {
        const r = await get(p, c);
        expect(leaks(r, [MARK, "ZZB"]), `${who} ${p} → ${r.status}`).toEqual([]);
        expect(r.status < 500, `${who} ${p} → ${r.status}`).toBe(true);
        if (p.startsWith("/api/") || p.endsWith("/export")) expect([401, 403, 404].includes(r.status) || denied(r), `${who} ${p} ${r.status}`).toBe(true);
      }
    });
  }

  test("A мектебінің ішінде: мұғалім басқа мұғалімнің сыныбын/оқушысын/жұмысын көрмейді; оқушы басқа сыныптың тапсырмасын", async () => {
    const c = await cookieFor(A.t1);
    for (const p of [`/teacher/classes/${A.c2}`, `/teacher/classes/${A.c2}/students/${A.s2}`, `/teacher/submissions/${A.sub2}`, `/teacher/assignments/${A.quiz2}/edit`, `/api/reports/class/${A.c2}`, `/teacher/classes/${A.c2}/export`]) {
      const r = await get(p, c);
      expect(r.text.includes(A.s2name), `t1 ${p} ${r.status}`).toBe(false);
      expect(denied(r) || r.status === 200, p).toBe(true);
      if (p.startsWith("/api") || p.endsWith("/export")) expect([401, 403, 404]).toContain(r.status);
    }
    const own = await get(`/teacher/classes/${A.c1}`, c);
    expect(own.status).toBe(200);
    const s = await get(`/student/assignments/${A.quiz2}`, await cookieFor(A.s1)); // s1 - 9А, quiz2 - 10Ә
    expect(s.text).not.toContain("Айнымалылар: қысқа тест" + "ZZ");
    expect([200, 404].includes(s.status) || denied(s)).toBe(true);
    const sub = await asUser(A.s1, "select count(*)::int n from submissions where student_id <> $1", [A.s1]);
    expect(sub[0].n).toBe(0);
  });

  test("ID өзгерту: жарамсыз/зиянды идентификаторлар 404, 500 емес, ішкі ақпарат жоқ", async () => {
    const c = await cookieFor(A.t1); const cs = await cookieFor(A.s1); const ca = await cookieFor(A.admin);
    const bad = ["not-a-uuid", "00000000-0000-0000-0000-000000000000", "../../etc/passwd", "'%3B%20drop%20table%20classrooms--", "%00", "a".repeat(400), "0".repeat(8) + "-0000-0000-0000-" + "f".repeat(12)];
    for (const id of bad) {
      for (const [p, ck] of [[`/teacher/classes/${id}`, c], [`/teacher/submissions/${id}`, c], [`/teacher/assignments/${id}/edit`, c], [`/teacher/courses/${id}`, c], [`/student/assignments/${id}`, cs],
        [`/student/courses/${id}`, cs], [`/school/classes/${id}`, ca], [`/school/students/${id}`, ca], [`/api/reports/class/${id}`, c], [`/teacher/classes/${id}/export`, c]] as const) {
        const r = await get(p, ck);
        expect(r.status, `${p} → ${r.status}`).toBeLessThan(500);
        expect(r.text).not.toMatch(/invalid input syntax|PostgresError|node_modules|at \w+ \(/i);
      }
    }
  });

  test("тіркелмеген қолданушы барлық қорғалған бетті/API-ді көре алмайды", async () => {
    for (const p of ["/teacher", "/student", "/school", "/admin", "/admin/audit", "/notifications", "/app", "/school/export/csv", "/school/settings", "/student/grades", ...bUrls()]) {
      const r = await get(p);
      expect(leaks(r, [MARK]), p).toEqual([]);
      if (p.startsWith("/api/") || p.endsWith("/export") || p.endsWith("/csv")) expect([401, 403, 404], p).toContain(r.status);
      else expect(r.status === 404 || (r.status >= 300 && r.status < 400 && /\/login/.test(r.loc ?? "")), `${p} → ${r.status} ${r.loc}`).toBe(true);
    }
  });
});

test.describe("b) Рөл эскалациясы", () => {
  const areaOf = (who: string) => ({
    s1: ["/teacher", `/teacher/classes/${"A.c1"}`, "/school", "/school/settings", "/school/teachers", "/admin", "/admin/audit", "/api/reports/school"],
    t1: ["/school", "/school/settings", "/school/students", "/school/teachers", "/school/export/csv", "/admin", "/admin/audit", "/api/reports/school"],
    admin: ["/admin", "/admin/audit"],
  } as Record<string, string[]>)[who];
  for (const who of ["s1", "t1", "admin"] as const) {
    test(`URL бойынша: ${who} жоғары рөл беттеріне өте алмайды`, async () => {
      const c = await cookieFor(A[who]);
      for (const p0 of areaOf(who)) {
        const p = p0.replace("A.c1", A.c1);
        const r = await get(p, c);
        expect(denied(r) && !(r.status === 200), `${who} ${p} → ${r.status}`).toBe(true);
        if (p.startsWith("/api")) expect([401, 403]).toContain(r.status);
      }
    });
  }
  test("оқушы мұғалім/әкімші API-ін: /api/reports/class/<өз сыныбы> да 403", async () => {
    const r = await get(`/api/reports/class/${A.c1}`, await cookieFor(A.s1));
    expect([401, 403, 404]).toContain(r.status);
  });
  test("мұғалім өзінің сыныбының есебін ала алады (позитивті бақылау), басқа мұғалімдікін алмайды", async () => {
    expect((await get(`/api/reports/class/${A.c1}?format=xlsx`, await cookieFor(A.t1))).status).toBe(200);
    expect([403, 404]).toContain((await get(`/api/reports/class/${A.c2}?format=xlsx`, await cookieFor(A.t1))).status);
  });

  test("server action тікелей POST: позитивті бақылау (мұғалім сынып жасайды) және құқықсыз шақырулар әсер етпейді", async () => {
    const nm = `ZZ-CTRL-${STAMP}`;
    const ct = await cookieFor(A.t1);
    const ok = await act("app/teacher/actions.ts#createClassAction", [null, form({ name: nm, year: "2025-2026", subject: "Информатика", description: "", limit: "" })], ct);
    expect((await sql("select count(*)::int n from classrooms where name=$1", [nm]))[0].n, ok.text.slice(0, 200)).toBe(1);
    await sql("delete from classrooms where name=$1", [nm]);

    const hack = `ZZ-HACK-${STAMP}`;
    const cs = await cookieFor(A.s1);
    await act("app/teacher/actions.ts#createClassAction", [null, form({ name: hack, year: "2025-2026", subject: "x", description: "", limit: "" })], cs);
    await act("app/courses-actions.ts#createCourseAction", [null, form({ area: "teacher", title: hack, description: "" })], cs);
    await act("app/teacher/actions.ts#regenerateCodeAction", [form({ class_id: A.c1 })], cs);
    if (A.pySub) await act("app/teacher/actions.ts#gradeSubmissionAction", [null, form({ submission_id: A.pySub, score: "100", feedback: hack })], cs);
    await act("app/school/actions.ts#inviteTeacherAction", [null, form({ email: `${hack}@x.kz`, ttl: "24" })], cs);
    await act("app/school/actions.ts#inviteTeacherAction", [null, form({ email: `${hack}@x.kz`, ttl: "24" })], ct);
    await act("app/admin/actions.ts#createOrganizationAction", [null, form({ name: hack, slug: `zz-hack-${STAMP}`, plan: "pro", valid_until: "2030-01-01" })], await cookieFor(A.admin));
    await act("app/admin/actions.ts#createOrganizationAction", [null, form({ name: hack, slug: `zz-hack2-${STAMP}`, plan: "pro", valid_until: "2030-01-01" })], ct);
    await act("app/admin/actions.ts#setOrgStatusAction", [form({ org: A.org, status: "suspended" })], await cookieFor(A.admin));
    await act("app/admin/actions.ts#setOrgStatusAction", [form({ org: A.org, status: "suspended" })], ct);
    await act("app/admin/actions.ts#setLicenseAction", [null, form({ org: A.org, plan: "starter", valid_until: "2020-01-01", status: "suspended", max_students: "1", max_teachers: "1" })], await cookieFor(A.admin));
    await act("app/admin/actions.ts#inviteSchoolAdminAction", [null, form({ org: A.org, email: `${hack}@x.kz` })], await cookieFor(A.admin));
    if (has("app/school/actions.ts#setTeacherStatusAction")) await act("app/school/actions.ts#setTeacherStatusAction", [form({ user_id: A.t2, status: "removed" })], ct);

    expect((await sql("select count(*)::int n from classrooms where name=$1", [hack]))[0].n).toBe(0);
    expect((await sql("select count(*)::int n from courses where title=$1", [hack]))[0].n).toBe(0);
    expect((await sql("select count(*)::int n from invitations where email=$1", [`${hack}@x.kz`]))[0].n).toBe(0);
    expect((await sql("select count(*)::int n from organizations where slug like $1", [`zz-hack%-${STAMP}`]))[0].n).toBe(0);
    expect((await sql("select count(*)::int n from grades where feedback=$1", [hack]))[0].n).toBe(0);
    expect((await sql("select status from organizations where id=$1", [A.org]))[0].status).toBe("active");
    expect((await sql("select status, valid_until::text from licenses where org_id=$1", [A.org]))[0].status).toBe("active");
    expect((await sql("select status from organization_members where org_id=$1 and user_id=$2", [A.org, A.t2]))[0].status).toBe("active");
  });

  test("server action: бір мектеп екіншісінің ресурсына әсер ете алмайды (A мұғалімі → B)", async () => {
    const ct = await cookieFor(A.t1), cs = await cookieFor(A.s1), ca = await cookieFor(A.admin);
    const before = await sql("select name, join_code, join_enabled from classrooms where id=$1", [B.cls]);
    await act("app/teacher/actions.ts#updateClassAction", [null, form({ class_id: B.cls, name: "HACKED", year: "2025-2026", subject: "x", description: "", limit: "" })], ct);
    await act("app/teacher/actions.ts#regenerateCodeAction", [form({ class_id: B.cls })], ct);
    await act("app/teacher/actions.ts#toggleJoinAction", [form({ class_id: B.cls, enable: "false" })], ct);
    await act("app/teacher/actions.ts#removeStudentAction", [form({ class_id: B.cls, student_id: B.student })], ct);
    await act("app/teacher/actions.ts#gradeSubmissionAction", [null, form({ submission_id: B.pySub, score: "1", feedback: "HACKED" })], ct);
    await act("app/teacher/actions.ts#beginReviewAction", [form({ submission_id: B.pySub })], ct);
    await act("app/teacher/actions.ts#archiveAssignmentAction", [form({ assignment_id: B.quiz })], ct);
    await act("app/teacher/actions.ts#duplicateAssignmentAction", [form({ assignment_id: B.quiz })], ct);
    await act("app/courses-actions.ts#setCourseStatusAction", [form({ area: "teacher", course_id: B.course, status: "archived" })], ct);
    await act("app/courses-actions.ts#updateCourseInfoAction", [null, form({ area: "teacher", course_id: B.course, title: "HACKED", description: "" })], ct);
    await act("app/courses-actions.ts#duplicateCourseAction", [form({ area: "teacher", course_id: B.course })], ct);
    const r = await act("app/courses-actions.ts#saveCourseStructureAction", [B.course, "teacher", { modules: [] }], ct);
    expect(r.ok).not.toBe(true);
    await act("app/teacher/actions.ts#removeStudentAction", [form({ class_id: B.cls, student_id: B.student })], ca);
    await act("app/student/actions.ts#submitAssignmentAction", [B.sub, B.quiz], cs);
    await act("app/student/actions.ts#saveDraftAction", [{ assignmentId: B.quiz, code: "x", answers: {}, seconds: 1 }], cs);
    await act("app/student/actions.ts#completeLessonAction", [null, form({ lessonId: B.lesson, courseId: B.course })], cs);

    const after = await sql("select name, join_code, join_enabled from classrooms where id=$1", [B.cls]);
    expect(after).toEqual(before);
    expect((await sql("select status from classroom_students where classroom_id=$1 and student_id=$2", [B.cls, B.student]))[0].status).toBe("active");
    expect((await sql("select feedback from grades where submission_id=$1", [B.pySub]))[0].feedback).toContain(MARK);
    expect((await sql("select status from assignments where id=$1", [B.quiz]))[0].status).toBe("published");
    expect((await sql("select count(*)::int n from assignments where org_id=$1", [B.org]))[0].n).toBe(2);
    expect((await sql("select title, status from courses where id=$1", [B.course]))[0].status).toBe("published");
    expect((await sql("select count(*)::int n from courses where org_id=$1", [B.org]))[0].n).toBe(1);
    expect((await sql("select count(*)::int n from lessons where course_id=$1", [B.course]))[0].n).toBe(1);
    expect((await sql("select count(*)::int n from submissions where assignment_id=$1 and student_id=$2", [B.quiz, A.s1]))[0].n).toBe(0);
    expect((await sql("select count(*)::int n from lesson_progress where student_id=$1 and lesson_id=$2", [A.s1, B.lesson]))[0].n).toBe(0);
    expect((await sql("select status from submissions where id=$1", [B.pySub]))[0].status).toBe("graded");
  });

  test("тіркелмеген қолданушы server action-ды шақыра алмайды", async () => {
    const r = await act("app/student/actions.ts#saveDraftAction", [{ assignmentId: B.quiz, code: "x", answers: {}, seconds: 1 }], "");
    expect(r.ok).toBe(false);
    const r2 = await act("app/student/actions.ts#submitAssignmentAction", [B.sub, B.quiz], "");
    expect(r2.ok).toBe(false);
    const nm = `ZZ-ANON-${STAMP}`;
    await act("app/teacher/actions.ts#createClassAction", [null, form({ name: nm, year: "2025-2026", subject: "x", description: "", limit: "" })], "");
    expect((await sql("select count(*)::int n from classrooms where name=$1", [nm]))[0].n).toBe(0);
  });

  test("рөл ауыстыру cookie (qc_org) бөтен ұйымға құқық бермейді", async () => {
    const r = await get("/teacher", `${await cookieFor(A.t1)}; qc_org=${B.org}`);
    expect(leaks(r, [MARK])).toEqual([]);
    const r2 = await get(`/teacher/classes/${B.cls}`, `${await cookieFor(A.t1)}; qc_org=${B.org}`);
    expect(leaks(r2, [MARK])).toEqual([]);
  });
});

test.describe("c) XSS және шығыс кодтау", () => {
  async function tour(browser: Browser, uid: string, urls: string[]) {
    const ctx = await browser.newContext({ baseURL: BASE, locale: "kk-KZ" });
    await ctx.addCookies([{ name: "qc_session", value: await mint(uid), url: BASE }]);
    const page = await ctx.newPage();
    const dialogs: string[] = []; const csp: string[] = [];
    page.on("dialog", (d) => { dialogs.push(d.message()); d.dismiss().catch(() => {}); });
    page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) csp.push(m.text()); });
    for (const u of urls) {
      const resp = await page.goto(u, { waitUntil: "networkidle" });
      expect(resp?.status(), u).toBeLessThan(400);
      expect(await page.evaluate(() => (window as any).__xss), `XSS орындалды: ${u}`).toBeUndefined();
      expect(await page.locator("img[src='x']").count(), `${u}: инъекцияланған <img>`).toBe(0);
      expect(await page.locator("script:not([src])", { hasText: "__xss" }).count(), u).toBe(0);
    }
    expect(dialogs, "alert/confirm").toEqual([]);
    expect(csp, "CSP бұзылу хабарлары (қолданба өз ресурстарын бұғаттамауы тиіс)").toEqual([]);
    await ctx.close();
  }
  test("мектеп әкімшісінің беттері: аттар, сипаттамалар, баптаулар", async ({ browser }) => {
    await tour(browser, B.admin, ["/school", "/school/classes", `/school/classes/${B.cls}`, "/school/students", `/school/students/${B.student}`, "/school/teachers", "/school/courses", `/school/courses/${B.course}`, "/school/settings", "/school/export", "/notifications"]);
  });
  test("мұғалімнің беттері: сынып/тапсырма/жұмыс/пікір/курс блоктары", async ({ browser }) => {
    await tour(browser, B.teacher, ["/teacher", `/teacher/classes/${B.cls}`, `/teacher/classes/${B.cls}?tab=students`, `/teacher/classes/${B.cls}?tab=assignments`, `/teacher/classes/${B.cls}?tab=join`,
      `/teacher/classes/${B.cls}/students/${B.student}`, "/teacher/assignments", `/teacher/assignments/${B.quiz}/edit`, `/teacher/assignments/${B.py}/edit`, "/teacher/review",
      `/teacher/submissions/${B.sub}`, `/teacher/submissions/${B.pySub}`, "/teacher/courses", `/teacher/courses/${B.course}`, `/teacher/courses/${B.course}?tab=settings`, "/notifications"]);
  });
  test("оқушының беттері: тапсырма, курс блоктары (text/note/code/image/video), баға пікірі, хабарландыру", async ({ browser }) => {
    await tour(browser, B.student, ["/student", "/student/assignments", `/student/assignments/${B.quiz}`, `/student/assignments/${B.py}`, "/student/courses", `/student/courses/${B.course}`,
      `/student/courses/${B.course}?lesson=${B.lesson}`, "/student/grades", "/student/projects", "/notifications"]);
  });
  test("URL/query параметрлері (err, ok, q, tab, next) арқылы инъекция болмайды", async ({ browser }) => {
    const e = encodeURIComponent(XSS);
    await tour(browser, B.teacher, [`/teacher/classes/${B.cls}?err=${e}&ok=${e}&tab=${e}`, `/teacher/assignments?err=${e}`, `/teacher/courses?err=${e}`, `/teacher/review?class=${e}`]);
    await tour(browser, B.admin, [`/school/students?q=${e}`, `/school/teachers?err=${e}&ok=${e}`, `/school/classes?err=${e}`]);
    const r = await get(`/login?next=${e}&e=${e}`);
    expect(r.text).not.toContain(`<img src=x onerror`);
    expect(r.text).not.toContain("<script>window.__xss");
  });
  test("шикі HTML-де жүктеме экрандалған (тек &quot;/&lt; түрінде)", async () => {
    for (const [p, c] of [[`/teacher/classes/${B.cls}`, await cookieFor(B.teacher)], [`/student/courses/${B.course}?lesson=${B.lesson}`, await cookieFor(B.student)], [`/school/students/${B.student}`, await cookieFor(B.admin)]] as const) {
      const r = await get(p, c);
      expect(r.text, p).toContain(MARK);
      expect(r.text, p).not.toContain("<img src=x onerror");
      expect(r.text, p).not.toMatch(/<script>window\.__xss/);
    }
  });
  test("сурет/видео URL: javascript:, data:, http:, // , тырнақшалы - серверде де, дерекқорда да қабылданбайды", async () => {
    const ct = await cookieFor(B.teacher);
    const mk = (type: string, content: string) => ({ modules: [{ title: "m", lessons: [{ title: "l", blocks: [{ type, content }] }] }] });
    for (const t of ["image", "video"]) {
      for (const u of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<script>alert(1)</script>", "http://example.com/a.png", "//evil.example/a.png", "https://ok.example/a.png\"onerror=\"alert(1)", "https://ok.example/a b.png", "https://", "vbscript:x", " https://example.com/a.png"]) {
        const r = await act("app/courses-actions.ts#saveCourseStructureAction", [B.course, "teacher", mk(t, u)], ct);
        expect(r.ok, `${t} ${u}`).toBe(false);
        await expect(asUser(B.teacher, "select public.save_course_structure($1,$2::jsonb)", [B.course, JSON.stringify(mk(t, u))])).rejects.toThrow(/invalid_block/);
      }
    }
    const good = await act("app/courses-actions.ts#saveCourseStructureAction", [B.course, "teacher", mk("image", "https://example.com/ok.png")], ct);
    expect(good.ok, good.text.slice(0, 300)).toBe(true);
    // құрылымды бастапқы күйге қайтару (кейінгі тесттер үшін)
    await asUser(B.teacher, "select public.save_course_structure($1,$2::jsonb)", [B.course, JSON.stringify({ modules: [{ title: `${MARK} Модуль`, lessons: [{ title: `${MARK} Сабақ`, blocks: [{ type: "text", content: XSS }] }] }] })]);
    B.lesson = (await sql("select id from lessons where course_id=$1 limit 1", [B.course]))[0].id;
  });
  test("логотип/түс: javascript: және CSS инъекциясы дерекқорда да тоқтатылады (RPC тікелей)", async () => {
    await expect(asUser(B.admin, "select public.update_org_settings($1,'javascript:alert(1)','#0e7490','#f2b705','', '', '')", [B.org])).rejects.toThrow();
    await expect(asUser(B.admin, "select public.update_org_settings($1,'','red;}</style><script>x</script>','#f2b705','', '', '')", [B.org])).rejects.toThrow();
    await expect(asUser(B.admin, "select public.update_org_settings($1,'http://x.example/l.png','#0e7490','#f2b705','', '', '')", [B.org])).rejects.toThrow();
  });
  test("CSV/XLSX формула инъекциясы: =, +, -, @ алдымен ' белгісін алады; Content-Disposition қауіпсіз", async () => {
    await sql("update profiles set full_name=$2 where id=$1", [B.student2, `=HYPERLINK("http://evil.example","x")`]);
    const ct = await cookieFor(B.teacher);
    // CSV (мұғалім) - жұмыс жіберген оқушы болуы үшін student2 де жібереді
    const sid = (await asUser(B.student2, "select public.save_draft($1,$2,'{}'::jsonb,1) as id", [B.py, "x"]))[0].id;
    await asUser(B.student2, "select public.submit_assignment($1)", [sid]);
    const csv = await get(`/teacher/classes/${B.cls}/export`, ct);
    expect(csv.status).toBe(200);
    expect(csv.headers.get("content-disposition")).toMatch(/^attachment; filename="[A-Za-z0-9._-]+"$/);
    for (const line of csv.text.split(/\r?\n/)) for (const cell of line.split(",")) expect(cell.replace(/^"/, "")).not.toMatch(/^[=+\-@]/);
    expect(csv.text).toContain(`'=HYPERLINK`);
    for (const fmt of ["xlsx", "pdf"]) {
      const res = await fetch(`${BASE}/api/reports/class/${B.cls}?format=${fmt}`, { headers: { cookie: ct } });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-disposition")).toMatch(/^attachment; filename="[A-Za-z0-9._-]+\.(xlsx|pdf)"$/);
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      const buf = Buffer.from(await res.arrayBuffer());
      if (fmt === "pdf") { expect(buf.subarray(0, 5).toString()).toBe("%PDF-"); continue; }
      const wb = new ExcelJS.Workbook(); await wb.xlsx.load(buf as any);
      let strings = 0;
      wb.eachSheet((ws) => ws.eachRow((row) => row.eachCell((cell) => {
        const v: any = cell.value;
        expect(typeof v === "object" && v !== null && ("formula" in v || "sharedFormula" in v), `формула ұяшығы: ${cell.address}`).toBe(false);
        if (typeof v === "string") { strings++; expect(v, cell.address).not.toMatch(/^[=+\-@\t\r]/); }
      })));
      expect(strings).toBeGreaterThan(3);
    }
    const school = await fetch(`${BASE}/api/reports/school?format=xlsx`, { headers: { cookie: await cookieFor(B.admin) } });
    expect(school.status).toBe(200);
    expect(school.headers.get("content-disposition")).toMatch(/^attachment; filename="[A-Za-z0-9._-]+"$/);
  });
  test("ILIKE іздеу: % және _ және \\ әріптік мәнде экрандалады, SQL инъекциясы жұмыс істемейді", async () => {
    const c = await cookieFor(A.admin);
    const base = await get("/school/students", c);
    const names = (await sql("select count(*)::int n from organization_members where org_id=$1 and role='student' and status='active'", [A.org]))[0].n;
    expect(names).toBeGreaterThan(5);
    for (const q of ["%", "_", "%25", "\\", "%_%", "_____", "' or 1=1 --", "'; drop table profiles; --", "Аружан%' or '1'='1"]) {
      const r = await get(`/school/students?q=${encodeURIComponent(q)}`, c);
      expect(r.status, q).toBe(200);
      expect(r.text.includes(A.s2name), `q=${q} барлық оқушыны қайтарды`).toBe(false);
    }
    expect((await get(`/school/students?q=${encodeURIComponent("Аружан")}`, c)).text).toContain("Аружан");
    expect(base.text).toContain(A.s2name);
    expect((await sql("select count(*)::int n from profiles"))[0].n).toBeGreaterThan(20);
  });
});

test.describe("d) Сессия, токен, Origin/CSRF", () => {
  test("жарамсыз токендер: alg=none, басқа құпия, мерзімі өткен, HS512, exp жоқ, sub жалған, өзгертілген payload", async () => {
    const uid = A.s1;
    const good = await mint(uid);
    expect((await get("/student", `qc_session=${good}`)).status).toBe(200);
    const [h, p, s] = good.split(".");
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const forgedP = b64({ ...JSON.parse(Buffer.from(p, "base64url").toString()), sub: A.t1 });
    const tokens: Record<string, string> = {
      none: `${b64({ alg: "none", typ: "JWT" })}.${b64({ sub: uid, exp: Math.floor(Date.now() / 1000) + 3600 })}.`,
      none2: `${b64({ alg: "none" })}.${b64({ sub: uid, exp: Math.floor(Date.now() / 1000) + 3600 })}.${s}`,
      None: `${b64({ alg: "None" })}.${b64({ sub: uid })}.`,
      wrongSecret: await mint(uid, { secret: new TextEncoder().encode("x".repeat(40)) }),
      expired: await mint(uid, { exp: Math.floor(Date.now() / 1000) - 60 }),
      hs512: await mint(uid, { alg: "HS512" }),
      noExp: await mint(uid, { noExp: true }),
      badSub: await mint("not-a-uuid' or 1=1--"),
      tamperedPayload: `${h}.${forgedP}.${s}`,
      garbage: "abc.def.ghi", empty: "", dots: "..", huge: "a".repeat(8000),
    };
    for (const [k, t] of Object.entries(tokens)) {
      const r = await get("/student", `qc_session=${t}`);
      expect(r.status >= 300 && r.status < 400 && /\/login/.test(r.loc ?? ""), `${k}: ${r.status} ${r.loc}`).toBe(true);
      const a = await get(`/api/reports/class/${A.c1}`, `qc_session=${t}`);
      expect(a.status, k).toBe(401);
    }
  });
  test("ұйымнан шығарылған/ 'removed' қолданушының әлі жарамды токені деректерге қол жеткізбейді", async () => {
    const u = await newUser(`${MARK} Уақытша`, `b.temp.${STAMP}@sec.test`);
    await asUser(u, "select public.join_classroom($1)", [B.code]);
    const c = await cookieFor(u);
    expect((await get("/student", c)).status).toBe(200);
    await asUser(B.admin, "select public.set_member_status($1,$2,'removed')", [B.org, u]);
    const r = await get(`/student/assignments/${B.quiz}`, c);
    expect(leaks(r, [MARK, "Сұрақ"]).filter((x) => x === "Сұрақ" || x === MARK).length === 0 || denied(r)).toBe(true);
    expect(leaks(await get("/student", c), [MARK])).toEqual([]);
  });
  test("Origin тексеруі: басқа origin-нен server action POST істемейді (CSRF)", async () => {
    const nm = `ZZ-CSRF-${STAMP}`;
    const ct = await cookieFor(A.t1);
    const fdata = () => form({ name: nm, year: "2025-2026", subject: "x", description: "", limit: "" });
    for (const origin of ["https://evil.example", "null", "http://127.0.0.1:9999", "http://127.0.0.1.evil.example"]) {
      const r = await act("app/teacher/actions.ts#createClassAction", [null, fdata()], ct, { headers: { Origin: origin } });
      expect(r.status, origin).not.toBe(303);
    }
    expect((await sql("select count(*)::int n from classrooms where name=$1", [nm]))[0].n).toBe(0);
    // Ескерту: Next Origin-ді X-Forwarded-Host-пен де салыстырады; браузер cross-site формадан бұл тақырыпты қоя алмайды,
    // бірақ proxy X-Forwarded-Host-ты қайта жазуы тиіс (docs/DEPLOY.md, SECURITY-AUDIT.md: «қабылданған»).
  });
  test("cookie атрибуттары: HttpOnly, SameSite=Lax, Path=/, өндірісте Secure", async () => {
    for (const [base, secure] of [[BASE, false], [RL, true]] as const) {
      const r = await act("app/actions.ts#loginAction", [null, form({ email: "student5@demo.qazaqcode.kz", password: PASS })], "", { base, headers: { "X-Forwarded-For": `10.${STAMP % 250}.${Math.floor(Math.random() * 250)}.1` } });
      const sc = (r.headers as any).getSetCookie?.() as string[] ?? [];
      const ses = sc.find((x) => x.startsWith("qc_session="))!;
      expect(ses, `cookie жоқ (${base}): ${r.text.slice(0, 200)}`).toBeTruthy();
      expect(ses).toMatch(/HttpOnly/i); expect(ses).toMatch(/SameSite=lax/i); expect(ses).toMatch(/Path=\//);
      expect(/;\s*Secure/i.test(ses), base).toBe(secure);
      expect(ses).toMatch(/Max-Age=\d+/);
    }
  });
  test("жалған/ескі server action id және бұзылған дене ішкі ақпарат ағызбайды", async () => {
    const ct = await cookieFor(A.t1);
    const bodies: [string, Record<string, string>, string][] = [
      ["unknown-action-id", { "Next-Action": "deadbeef".repeat(5), "content-type": "text/plain" }, "[]"],
      ["bad json", { "Next-Action": Object.values(ACTIONS)[0], "content-type": "text/plain" }, "{not json"],
      ["huge", { "Next-Action": Object.values(ACTIONS)[0], "content-type": "text/plain" }, "[" + "1,".repeat(100000) + "1]"],
    ];
    for (const [k, h, b] of bodies) {
      const r = await fetch(BASE + "/login", { method: "POST", headers: { ...h, cookie: ct, Origin: BASE }, body: b });
      const t = await r.text();
      expect(r.status, k).toBeLessThan(600);
      expect(t, k).not.toMatch(/node_modules|\/home\/|\.ts:\d+|at \w+ \(|PostgresError|ZodError|stack/i);
    }
    const z = await act("app/admin/actions.ts#setOrgStatusAction", [form({ org: "x", status: "y" })], await cookieFor(A.root));
    expect(z.text).not.toMatch(/ZodError|invalid_|node_modules|\/home\/|at \w+ \(/i);
  });
});

test.describe("e) Аутентификация: brute force және энтропия (rate limit қосулы сервер)", () => {
  const ip = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
  test.describe.configure({ timeout: 240_000 }); // bcrypt (cost 10) әр кіру әрекетін баяулатады
  const login = (email: string, pw: string, xff?: string) => act("app/actions.ts#loginAction", [null, form({ email, password: pw })], "", { base: RL, headers: { "X-Forwarded-For": xff ?? ip() } });
  test("кіру: бір IP+e-mail үшін 10 әрекеттен кейін бұғатталады (дұрыс құпиясөз де өтпейді)", async () => {
    const email = `b.login.${STAMP}@sec.test`; await newUser("Brute", email);
    const xff = ip(); let limited = -1;
    for (let i = 1; i <= 14; i++) { const r = await login(email, "wrong-password-" + i, xff); if (/Тым жиі/.test(r.text) && limited < 0) limited = i; }
    expect(limited).toBeGreaterThan(0); expect(limited).toBeLessThanOrEqual(11);
    const good = await login(email, PASS, xff);
    expect(good.text).toMatch(/Тым жиі/); expect(good.headers.get("set-cookie") ?? "").not.toContain("qc_session");
  });
  test("X-Forwarded-For алмастыру шабуылы: бір аккаунтқа таратылған брутфорс e-mail бойынша бұғатталады", async () => {
    const email = `b.spray.${STAMP}@sec.test`; await newUser("Spray", email);
    let limited = -1;
    for (let i = 1; i <= 40; i++) { const r = await login(email, "nope-" + i); if (/Тым жиі/.test(r.text)) { limited = i; break; } }
    expect(limited, "әр сұраныста жаңа IP-мен де бұғатталуы тиіс").toBeGreaterThan(0);
    expect(limited).toBeLessThanOrEqual(35);
    expect((await login(email, PASS)).headers.get("set-cookie") ?? "").not.toContain("qc_session");
  });
  test("X-Forwarded-For сол жағын жалғандау rate limit айналып өтпейді (оңнан санау)", async () => {
    const email = `b.xff.${STAMP}@sec.test`; await newUser("XFF", email);
    const real = ip(); let limited = -1;
    for (let i = 1; i <= 14; i++) { const r = await login(email, "x" + i, `1.2.3.${i}, ${real}`); if (/Тым жиі/.test(r.text)) { limited = i; break; } }
    expect(limited).toBeGreaterThan(0); expect(limited).toBeLessThanOrEqual(11);
  });
  test("тіркелу (сынып коды) және шақыру: көп жалған әрекет бұғатталады", async () => {
    const xff = ip(); let limited = -1;
    for (let i = 1; i <= 12; i++) {
      const r = await act("app/actions.ts#registerWithCodeAction", [null, form({ code: "AAAAAAAA", name: "Spam User", email: `spam${i}.${STAMP}@sec.test`, password: PASS })], "", { base: RL, headers: { "X-Forwarded-For": xff } });
      if (/Тым жиі/.test(r.text)) { limited = i; break; }
    }
    expect(limited).toBeGreaterThan(0); expect(limited).toBeLessThanOrEqual(9);
    expect((await sql("select count(*)::int n from auth.users where email like $1", [`spam%.${STAMP}@sec.test`]))[0].n).toBe(0);
    const xff2 = ip(); limited = -1;
    for (let i = 1; i <= 12; i++) {
      const r = await act("app/actions.ts#registerWithInviteAction", [null, form({ token: "0".repeat(48), name: "Spam User", email: `spami${i}.${STAMP}@sec.test`, password: PASS })], "", { base: RL, headers: { "X-Forwarded-For": xff2 } });
      if (/Тым жиі/.test(r.text)) { limited = i; break; }
    }
    expect(limited).toBeGreaterThan(0); expect(limited).toBeLessThanOrEqual(9);
  });
  test("сынып кодын тауып алу (join) және шақыру токенін болжау: қолданушыға 15/10 әрекет", async () => {
    const email = `b.join.${STAMP}@sec.test`; await newUser("Joiner", email);
    const lg = await login(email, PASS);
    const ck = ((lg.headers as any).getSetCookie() as string[]).find((x) => x.startsWith("qc_session="))!.split(";")[0];
    let limited = -1;
    for (let i = 1; i <= 20; i++) { const r = await act("app/actions.ts#joinClassAction", [null, form({ code: "ZZZZZZZ" + (i % 9 + 2) })], ck, { base: RL, headers: { "X-Forwarded-For": ip() } }); if (/Тым жиі/.test(r.text)) { limited = i; break; } }
    expect(limited).toBeGreaterThan(0); expect(limited).toBeLessThanOrEqual(16);
    limited = -1;
    for (let i = 1; i <= 14; i++) { const r = await act("app/actions.ts#acceptInviteAction", [null, form({ token: String(i).repeat(48).slice(0, 48) })], ck, { base: RL, headers: { "X-Forwarded-For": ip() } }); if (/Тым жиі/.test(r.text)) { limited = i; break; } }
    expect(limited).toBeGreaterThan(0); expect(limited).toBeLessThanOrEqual(11);
  });
  test("есеп жүктеу API-інде rate limit бар (429)", async () => {
    const c = await cookieFor(B.teacher);
    let got429 = false;
    for (let i = 0; i < 24 && !got429; i++) got429 = (await get(`/api/reports/class/${B.cls}?format=xlsx`, c, { base: RL, headers: { "X-Forwarded-For": "10.9.9.9" } })).status === 429;
    expect(got429).toBe(true);
  });
  test("шақыру токені/сынып коды энтропиясы: 24 байт hex, хэш сақталады, коды 8 символ (32^8)", async () => {
    const t = (await asUser(B.admin, "select public.create_invitation($1,'teacher') as t", [B.org]))[0].t as string;
    expect(t).toMatch(/^[0-9a-f]{48}$/);
    expect((await sql("select count(*)::int n from invitations where token_hash = $1", [t]))[0].n).toBe(0);
    expect(B.code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    const codes = await sql("select public.new_join_code() c from generate_series(1,300)");
    expect(new Set(codes.map((x) => x.c)).size).toBe(300);
    const chars = new Set(codes.flatMap((x) => [...x.c])); expect(chars.size).toBeGreaterThan(28);
  });
});

test.describe("g) HTTP тақырыптары, қателер, health", () => {
  test("қауіпсіздік тақырыптары: CSP (nonce, unsafe-inline скриптте жоқ), frame-ancestors, HSTS, Referrer-Policy, Permissions-Policy", async () => {
    for (const [p, c] of [["/login", ""], ["/student", await cookieFor(A.s1)], ["/teacher", await cookieFor(A.t1)], ["/no-such-page", ""], ["/api/health", ""]] as const) {
      const r = await get(p, c);
      const h = r.headers;
      const csp = h.get("content-security-policy") ?? "";
      expect(csp, p).toContain("default-src 'self'");
      const script = /script-src ([^;]*)/.exec(csp)?.[1] ?? "";
      expect(script, p).toMatch(/'nonce-[A-Za-z0-9+/=]+'/); expect(script, p).not.toContain("'unsafe-inline'"); expect(script, p).not.toContain("'unsafe-eval'");
      expect(csp).toContain("frame-ancestors 'none'"); expect(csp).toContain("object-src 'none'"); expect(csp).toContain("base-uri 'self'"); expect(csp).toContain("form-action 'self'");
      expect(h.get("x-frame-options")).toBe("DENY"); expect(h.get("x-content-type-options")).toBe("nosniff");
      expect(h.get("strict-transport-security")).toMatch(/max-age=\d{7,}/); expect(h.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
      expect(h.get("permissions-policy")).toMatch(/camera=\(\)/); expect(h.get("x-powered-by")).toBeNull();
      if (r.text.includes("<script")) {
        const nonce = /'nonce-([^']+)'/.exec(csp)![1];
        const scripts = [...r.text.matchAll(/<script\b([^>]*)>/g)].map((m) => m[1]);
        expect(scripts.length).toBeGreaterThan(0);
        for (const a of scripts) if (!a.includes(`nonce="${nonce}"`)) expect(a, `${p}: nonce-сыз script`).toMatch(/type="(application\/json|application\/ld\+json)"/);
      }
    }
  });
  test("регрессия: CSP nonce THEME_INIT скриптін бұғаттамайды - қараңғы режим автоматты қосылады, консольде CSP қатесі жоқ", async ({ browser }) => {
    for (const [uid, url] of [[null, "/login"], [A.s1, "/student"], [A.t1, "/teacher"], [A.admin, "/school"], [A.root, "/admin"]] as const) {
      const ctx = await browser.newContext({ baseURL: BASE, locale: "kk-KZ" });
      await ctx.addInitScript(() => { try { localStorage.setItem("qc:theme", "dark"); } catch {} });
      if (uid) await ctx.addCookies([{ name: "qc_session", value: await mint(uid), url: BASE }]);
      const page = await ctx.newPage(); const csp: string[] = [];
      page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) csp.push(m.text()); });
      page.on("pageerror", (e) => { if (/hydrat/i.test(e.message)) csp.push(e.message); });
      await page.goto(url, { waitUntil: "networkidle" });
      expect(await page.evaluate(() => document.documentElement.classList.contains("dark")), `${url}: html.dark жоқ`).toBe(true);
      expect(csp, url).toEqual([]);
      await ctx.close();
    }
  });
  test("авторизацияланған беттер кэштелмейді (private/no-store)", async () => {
    for (const p of ["/student", "/teacher/classes/" + A.c1]) {
      const cc = (await get(p, await cookieFor(p.startsWith("/s") ? A.s1 : A.t1))).headers.get("cache-control") ?? "";
      expect(cc).toMatch(/no-store|private/);
    }
  });
  test("/api/health: 200, тек күй, құпиясыз; кэшсіз", async () => {
    const r = await get("/api/health");
    expect(r.status).toBe(200);
    expect(JSON.parse(r.text)).toEqual({ status: "ok", db: "ok" });
    expect(r.headers.get("cache-control")).toContain("no-store");
    expect(r.text).not.toMatch(/postgres|DATABASE|secret|password|host/i);
  });
  test("қателер: 404/500 беттері мен API ішкі ақпарат (stack, SQL, жол) ағызбайды", async () => {
    const c = await cookieFor(A.t1);
    for (const p of ["/no-such-page", "/api/nope", "/teacher/classes/%ZZ", "/teacher/classes/" + "9".repeat(5000), `/api/reports/class/${A.c1}?format=exe`, `/api/reports/class/${A.c1}?from=2020-13-45`, `/api/reports/class/${A.c1}?from=%00`, "/invite/%27%20or%201=1--", "/join?code=%27%20or%201=1--"]) {
      const r = await get(p, c);
      expect(r.text, p).not.toMatch(/node_modules|\/home\/user|PostgresError|syntax error at|invalid input syntax|Error: |\.tsx?:\d+|stack/i);
      expect(r.status < 500 || r.status === 500 && !/at /.test(r.text), `${p} ${r.status}`).toBe(true);
    }
  });
  test("клиент бумасында құпия жоқ (JWT құпиясы, DATABASE_URL, service_role) және NEXT_PUBLIC_ құпия емес", async () => {
    const html = (await get("/login")).text;
    const files = [...new Set([...html.matchAll(/\/_next\/static\/[^"']+\.js/g)].map((m) => m[0]))];
    expect(files.length).toBeGreaterThan(2);
    for (const f of files) {
      const t = (await get(f)).text;
      for (const s of [SECRET, process.env.DATABASE_URL ?? "@@none@@", "service_role", "SUPABASE_JWT_SECRET", "AUTH_JWT_SECRET", "postgresql://"]) expect(t.includes(s), `${f} құрамында ${s.slice(0, 12)}…`).toBe(false);
    }
    const out = execSync("grep -rn NEXT_PUBLIC_ src .env.example next.config.mjs Dockerfile docker-compose.yml || true", { encoding: "utf8" });
    expect(out.trim(), "NEXT_PUBLIC_ айнымалылары браузерге беріледі: құпия қоспаңыз").toBe("");
  });
});

test.describe("h) Құпиялар және i) жасырын жауаптар және l) файл жүктеу", () => {
  test("git-те құпия жоқ; .env* .gitignore-да; тек .env.example бақыланады", async () => {
    const root = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
    const prefix = path.relative(root, process.cwd());
    const files = execSync("git ls-files", { cwd: process.cwd(), encoding: "utf8" }).split("\n").filter(Boolean).filter((f) => !/package-lock\.json|\.ttf$|\.png$|\.ico$/.test(f));
    expect(files.filter((f) => /(^|\/)\.env(\..*)?$/.test(f) && !f.endsWith(".env.example")), "бақыланатын .env файлдары").toEqual([]);
    const gi = fs.readFileSync(path.join(process.cwd(), ".gitignore"), "utf8");
    expect(gi).toMatch(/^\.env\*?$|^\.env$/m); expect(gi).toMatch(/\.env\.local|\.env\*/);
    const pats: [string, RegExp][] = [["private key", /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/], ["AWS", /AKIA[0-9A-Z]{16}/], ["JWT", /eyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/],
      ["GitHub token", /gh[pousr]_[A-Za-z0-9]{30,}/], ["Slack", /xox[abpr]-[A-Za-z0-9-]{10,}/], ["Stripe/sk", /sk_(live|test)_[A-Za-z0-9]{16,}/], ["URL with password", /postgres(ql)?:\/\/[^:\s@/]+:(?!password@|change-me|pass@|\$|\{|<|\*)[^@\s]{6,}@/]];
    const hits: string[] = [];
    for (const f of files) { const t = fs.readFileSync(path.join(process.cwd(), f), "utf8"); for (const [n, re] of pats) if (re.test(t)) hits.push(`${f}: ${n}`); }
    expect(hits, "табылған құпиялар").toEqual([]);
    void prefix;
  });
  test("жасырын жауап кілттері/тест жағдайлары оқушыға жететін HTML/RSC жауабында жоқ", async () => {
    const needles = ["correct_index", "correctIndex", `${MARK}-EXPL-${STAMP}`, "HIDDEN-OUT-" + STAMP, "is_hidden", "isHidden", "answer_key", "assignment_answer_keys", "expected_output"];
    const cs = await cookieFor(B.student);
    for (const p of ["/student", "/student/assignments", `/student/assignments/${B.quiz}`, `/student/assignments/${B.py}`, "/student/courses", `/student/courses/${B.course}`, "/student/grades", "/student/projects", "/notifications"]) {
      for (const h of [{}, { RSC: "1" }, { RSC: "1", "Next-Router-State-Tree": "%5B%22%22%5D" }]) {
        const r = await get(p, cs, { headers: h as Record<string, string> });
        expect(r.status, p).toBe(200);
        expect(leaks(r, needles), `${p} ${JSON.stringify(h)}`).toEqual([]);
      }
    }
    const a = await cookieFor(A.s3);
    for (const p of [`/student/assignments/${A.py}`, `/student/assignments/${A.quiz1}`, "/student"]) {
      const r = await get(p, a);
      expect(leaks(r, ["correct_index", "correctIndex", "5040", "is_hidden", "expected_output"]), p).toEqual([]);
    }
    const keys = await asUser(B.student, "select * from assignment_answer_keys");
    const tcs = await asUser(B.student, "select * from assignment_test_cases where is_hidden");
    expect(keys.length + tcs.length).toBe(0);
  });
  test("файл жүктеу жоқ: <input type=file>, multipart маршрут, Storage жоқ", async () => {
    const out = execSync(`grep -rnE "type=\\"file\\"|type='file'|instanceof File|formidable|multer|busboy|storage\\.from|createWriteStream|writeFile" src || true`, { encoding: "utf8" });
    expect(out.trim(), "файл жүктеу коды табылды").toBe("");
  });
  test("аудит журналы: экспорт және маңызды әрекеттер жазылады", async () => {
    await get(`/teacher/classes/${B.cls}/export`, await cookieFor(B.teacher));
    await get(`/api/reports/class/${B.cls}?format=xlsx`, await cookieFor(B.teacher));
    await get(`/api/reports/school?format=xlsx`, await cookieFor(B.admin));
    await asUser(B.teacher, "select public.regenerate_join_code($1)", [B.cls]);
    const a = (await sql("select action from audit_logs where org_id=$1", [B.org])).map((x) => x.action);
    for (const x of ["export.class_csv", "export.class_report", "export.school_report", "classroom.join_code_regenerated", "organization.create", "grades.insert", "invitation.create", "invitation.accept"]) expect(a, x).toContain(x);
    await expect(sql("delete from audit_logs where org_id=$1", [B.org])).rejects.toThrow(/audit_immutable/);
  });
});
