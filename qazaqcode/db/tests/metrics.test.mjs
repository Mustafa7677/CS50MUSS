// Метрика жүйесі (0013): RLS, құқықтар, touch_activity, DAU/WAU/MAU, воронка, когорттық retention, health score, пилот есебі, purge.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { pool, admin, as, asAnon, fails, newUser, reset, future } from "./helpers.mjs";

const S = {};
after(() => pool.end());

const one = async (sql, p = []) => (await admin(sql, p))[0];
const dayOff = async (n) => (await one("select (public.metrics_today() + $1::int)::text as d", [n])).d;
const today = async () => (await one("select public.metrics_today()::text as d")).d;
/** activity_days-ке тікелей жол (суперпайдаланушы): who = {id}, offset = бүгінге қатысты күн ығысуы (теріс = өткен) */
const act = (u, org, offset, role) => admin("insert into public.activity_days(user_id, org_id, day, role) values ($1, $2, public.metrics_today() + $3::int, $4) on conflict do nothing", [u.id, org, offset, role]);
const clearAct = () => admin("truncate public.activity_days");
const kpis = (uid, args = {}) => as(uid, (q) => q("select public.platform_kpis($1, $2, $3) as r", [args.days ?? 30, args.demo ?? false, args.weeks ?? 12])).then((r) => r[0].r);

async function mkOrg(name, slug, { demo = false } = {}) {
  const r = await as(S.root.id, (q) => q("select public.create_organization($1, $2, 'pro', $3) as r", [name, slug, future()]));
  const org = r[0].r.org_id;
  const adm = await newUser(`Әкімші ${slug}`);
  await as(adm.id, (q) => q("select public.accept_invitation($1)", [r[0].r.admin_invite_token]));
  if (demo) await admin("update organizations set is_demo = true where id = $1", [org]);
  return { org, admin: adm };
}
async function mkTeacher(o, name) {
  const t = await as(o.admin.id, (q) => q("select public.create_invitation($1, 'teacher') as t", [o.org]));
  const u = await newUser(name);
  await as(u.id, (q) => q("select public.accept_invitation($1)", [t[0].t]));
  return u;
}
async function mkClass(o, teacher, name = "9А") {
  const id = (await as(teacher.id, (q) => q("select public.create_classroom($1, $2, '2025-2026', 'Информатика') as id", [o.org, name])))[0].id;
  const code = (await admin("select join_code from classrooms where id = $1", [id]))[0].join_code;
  return { id, code };
}
async function mkStudent(cls, name) {
  const u = await newUser(name);
  await as(u.id, (q) => q("select public.join_classroom($1)", [cls.code]));
  return u;
}
async function mkAssignment(o, teacher, cls, p) {
  const id = (await as(teacher.id, (q) => q("select public.upsert_assignment($1::jsonb) as id", [JSON.stringify({ org_id: o.org, max_score: 10, ...p })])))[0].id;
  await as(teacher.id, (q) => q("select public.set_assignment_targets($1, $2::uuid[])", [id, [cls.id]]));
  await as(teacher.id, (q) => q("select public.set_assignment_status($1, 'published')", [id]));
  return id;
}
const QUIZ = { title: "Метрика тесті", kind: "quiz", questions: [{ prompt: "2+2?", options: ["3", "4"], correct_index: 1, points: 1 }] };
async function submitQuiz(student, aid, correct) {
  const qid = (await admin("select id from assignment_questions where assignment_id = $1", [aid]))[0].id;
  const sid = (await as(student.id, (q) => q("select public.save_draft($1, null, $2::jsonb, 5) as id", [aid, JSON.stringify({ [qid]: correct ? 1 : 0 })])))[0].id;
  await as(student.id, (q) => q("select public.submit_assignment($1)", [sid]));
  return sid;
}
async function submitCode(student, aid) {
  const sid = (await as(student.id, (q) => q("select public.save_draft($1, 'print(1)', '{}'::jsonb, 5) as id", [aid])))[0].id;
  await as(student.id, (q) => q("select public.submit_assignment($1)", [sid]));
  return sid;
}

describe("metrics: журнал, құқықтар, touch_activity", () => {
  before(async () => {
    await reset();
    await admin("truncate public.leads");
    S.root = await newUser("Платформа Әкімші");
    await admin("insert into platform_admins(user_id) values ($1)", [S.root.id]);
    S.A = await mkOrg("Мектеп A", "metric-a");
    S.B = await mkOrg("Мектеп B", "metric-b");
    S.teacher = await mkTeacher(S.A, "Мұғалім A");
    S.cls = await mkClass(S.A, S.teacher);
    S.s = [];
    for (let i = 1; i <= 5; i++) S.s.push(await mkStudent(S.cls, `Оқушы ${i}`));
    S.teacherB = await mkTeacher(S.B, "Мұғалім B");
    S.clsB = await mkClass(S.B, S.teacherB, "10Ә");
    S.sB = await mkStudent(S.clsB, "Оқушы B1");
    S.stranger = await newUser("Бөтен Қолданушы");     // ешбір ұйымда жоқ
  });

  it("touch_activity: бір тәулікте бір жол; екінші шақыру false; рөл мен ұйым жазылады, басқа ештеңе жоқ", async () => {
    assert.equal((await as(S.s[0].id, (q) => q("select public.touch_activity() as r")))[0].r, true);
    assert.equal((await as(S.s[0].id, (q) => q("select public.touch_activity() as r")))[0].r, false);
    assert.equal((await as(S.s[0].id, (q) => q("select public.touch_activity($1) as r", [S.A.org])))[0].r, false);
    const rows = await admin("select * from public.activity_days where user_id = $1", [S.s[0].id]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].role, "student");
    assert.equal(rows[0].org_id, S.A.org);
    assert.deepEqual(Object.keys(rows[0]).sort(), ["day", "org_id", "role", "user_id"], "кестеде қосымша баған (IP/UA/уақыт) жоқ");
    assert.equal(rows[0].day.toISOString().slice(0, 10), await today());
  });

  it("параллель 20 шақыру де бір ғана жол қалдырады", async () => {
    await Promise.all(Array.from({ length: 20 }, () => as(S.teacher.id, (q) => q("select public.touch_activity()"))));
    assert.equal(Number((await one("select count(*) n from public.activity_days where user_id = $1", [S.teacher.id])).n), 1);
    assert.equal((await one("select role from public.activity_days where user_id = $1", [S.teacher.id])).role, "teacher");
  });

  it("p_org: өз ұйымы - жазылады; бөтен ұйым - forbidden; мүшелігі жоқ қолданушы - false және жол жоқ", async () => {
    assert.equal((await as(S.s[1].id, (q) => q("select public.touch_activity($1) as r", [S.A.org])))[0].r, true);
    await fails(as(S.s[2].id, (q) => q("select public.touch_activity($1)", [S.B.org])), "forbidden");
    assert.equal((await as(S.stranger.id, (q) => q("select public.touch_activity() as r")))[0].r, false);
    assert.equal((await as(S.root.id, (q) => q("select public.touch_activity() as r")))[0].r, false);
    assert.equal(Number((await one("select count(*) n from public.activity_days where user_id = any ($1)", [[S.stranger.id, S.root.id, S.s[2].id]])).n), 0);
  });

  it("anon touch_activity-ді шақыра алмайды, кестеге де тимейді", async () => {
    await fails(asAnon((q) => q("select public.touch_activity()")), "permission denied");
    await fails(asAnon((q) => q("select * from public.activity_days")), "permission denied");
    await fails(asAnon((q) => q("select public.platform_kpis()")), "permission denied");
    await fails(asAnon((q) => q("select public.org_health($1)", [S.A.org])), "permission denied");
    await fails(asAnon((q) => q("select public.pilot_report($1, current_date - 7, current_date)", [S.A.org])), "permission denied");
  });

  it("RLS: қолданушы тек өз жолын көреді; SUPER ADMIN да кесте арқылы жеке жолдарды көрмейді; жазу/өзгерту/өшіру жабық", async () => {
    await act(S.s[3], S.A.org, 0, "student");
    assert.equal((await as(S.s[3].id, (q) => q("select user_id from public.activity_days"))).length, 1);
    assert.equal((await as(S.s[4].id, (q) => q("select user_id from public.activity_days"))).length, 0);
    assert.equal((await as(S.root.id, (q) => q("select user_id from public.activity_days"))).length, 0, "SUPER ADMIN жеке жолды көрмейді");
    assert.equal((await as(S.A.admin.id, (q) => q("select user_id from public.activity_days"))).length, 0);
    for (const sql of ["insert into public.activity_days(user_id, org_id, day, role) values (auth.uid(), null, current_date, 'student')",
      "update public.activity_days set day = current_date", "delete from public.activity_days", "truncate public.activity_days"]) {
      await fails(as(S.s[3].id, (q) => q(sql)), "permission denied");
    }
  });

  it("каталог: activity_days-те RLS бар; функциялар PUBLIC/anon-ға ашық емес, search_path бекітілген", async () => {
    assert.equal((await one("select relrowsecurity from pg_class where oid = 'public.activity_days'::regclass")).relrowsecurity, true);
    const names = ["touch_activity", "purge_activity", "org_health", "platform_org_health", "platform_kpis", "pilot_report", "audit_metrics_export", "org_health_calc", "metrics_orgs", "metrics_today", "week_start"];
    const rows = await admin(`select p.proname, p.prosecdef, p.proconfig, has_function_privilege('anon', p.oid, 'execute') anon, has_function_privilege('public', p.oid, 'execute') pub,
      has_function_privilege('authenticated', p.oid, 'execute') auth from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = any ($1)`, [names]);
    assert.equal(rows.length, names.length);
    for (const r of rows) {
      assert.equal(r.anon, false, r.proname); assert.equal(r.pub, false, r.proname);
      if (["org_health_calc", "metrics_orgs", "metrics_today", "week_start"].includes(r.proname)) assert.equal(r.auth, false, `${r.proname} ішкі`);
      else assert.equal(r.auth, true, r.proname);
      if (r.prosecdef) assert.ok((r.proconfig || []).some((c) => /^search_path=.*pg_temp\s*$/.test(c)), `${r.proname}: search_path`);
    }
  });

  it("аналитика құқықтары: platform_kpis тек SUPER ADMIN; org_health өз мектеп әкімшісіне; бөтен ұйым/оқушы/мұғалім - forbidden", async () => {
    for (const u of [S.A.admin, S.teacher, S.s[0], S.stranger]) {
      await fails(as(u.id, (q) => q("select public.platform_kpis()")), "forbidden");
      await fails(as(u.id, (q) => q("select public.platform_org_health()")), "forbidden");
      await fails(as(u.id, (q) => q("select public.purge_activity(400)")), "forbidden");
    }
    assert.equal((await as(S.A.admin.id, (q) => q("select public.org_health($1) as r", [S.A.org])))[0].r.org_id, S.A.org);
    await fails(as(S.A.admin.id, (q) => q("select public.org_health($1)", [S.B.org])), "forbidden");
    await fails(as(S.teacher.id, (q) => q("select public.org_health($1)", [S.A.org])), "forbidden");
    await fails(as(S.s[0].id, (q) => q("select public.org_health($1)", [S.A.org])), "forbidden");
    assert.equal((await as(S.root.id, (q) => q("select public.org_health($1) as r", [S.B.org])))[0].r.org_id, S.B.org);
    await fails(as(S.A.admin.id, (q) => q("select public.org_health($1, 3)", [S.A.org])), "invalid_range");
    await fails(as(S.root.id, (q) => q("select public.platform_kpis(3)")), "invalid_range");
    await fails(as(S.root.id, (q) => q("select public.platform_kpis(30, false, 1)")), "invalid_range");
    await fails(as(S.A.admin.id, (q) => q("select public.pilot_report($1, current_date - 3, current_date - 9)", [S.A.org])), "invalid_range");
    await fails(as(S.teacher.id, (q) => q("select public.pilot_report($1, current_date - 3, current_date)", [S.A.org])), "forbidden");
    await fails(as(S.A.admin.id, (q) => q("select public.pilot_report($1, current_date - 3, current_date)", [S.B.org])), "forbidden");
  });

  it("audit_metrics_export: құқық және түр тексерісі", async () => {
    await as(S.A.admin.id, (q) => q("select public.audit_metrics_export($1, 'pilot_pdf')", [S.A.org]));
    await as(S.root.id, (q) => q("select public.audit_metrics_export(null, 'platform_csv')"));
    await fails(as(S.A.admin.id, (q) => q("select public.audit_metrics_export(null, 'platform_csv')")), "forbidden");
    await fails(as(S.A.admin.id, (q) => q("select public.audit_metrics_export($1, 'pilot_pdf')", [S.B.org])), "forbidden");
    await fails(as(S.A.admin.id, (q) => q("select public.audit_metrics_export($1, 'bogus')", [S.A.org])), "invalid_input");
    assert.ok(Number((await one("select count(*) n from audit_logs where action in ('export.pilot_pdf','export.platform_csv')")).n) >= 2);
  });

  it("purge_activity: 400 күннен ескі жолдар ғана өшеді; құқық пен аралық тексеріледі", async () => {
    await clearAct();
    for (const off of [-500, -401, -400, -399, -1]) await act(S.s[0], S.A.org, off, "student");
    await fails(as(S.A.admin.id, (q) => q("select public.purge_activity(400)")), "forbidden");
    await fails(as(S.root.id, (q) => q("select public.purge_activity(0)")), "invalid_range");
    await fails(as(S.root.id, (q) => q("select public.purge_activity(null)")), "invalid_range");
    const n = (await as(S.root.id, (q) => q("select public.purge_activity() as n")))[0].n;
    assert.equal(n, 2, "-500 және -401 өшеді; -400 қалады");
    const left = await admin("select (day - public.metrics_today()) as off from public.activity_days order by day");
    assert.deepEqual(left.map((r) => r.off), [-400, -399, -1]);
    assert.equal((await one("select count(*)::int n from audit_logs where action = 'activity.purge'")).n >= 1, true);
    // тікелей DB қосылымы (рөл ауыстырусыз) - scripts/activity-purge.mjs жолы
    assert.equal((await one("select public.purge_activity(30) as n")).n, 2);
    await clearAct();
  });
});

describe("metrics: DAU/WAU/MAU", () => {
  before(async () => {
    await clearAct();
    const [s1, s2, s3, s4, s5] = S.s;
    for (const [u, role, offs] of [[s1, "student", [0, -1]], [s2, "student", [0, -7]], [s3, "student", [-1, -29]], [s4, "student", [-6]], [s5, "student", [-29]], [S.teacher, "teacher", [0]], [S.A.admin, "school_admin", [-2]]]) {
      for (const o of offs) await act(u, S.A.org, o, role);
    }
    await act(S.sB, S.B.org, 0, "student");
    await act(S.sB, S.B.org, -40, "student");   // 30 күн терезесінен тыс
  });

  it("бүгінгі DAU/WAU/MAU рөл бойынша дәл (WAU = 7 күн, MAU = 30 күн, шекара ішіне кіреді)", async () => {
    const r = await kpis(S.root.id);
    assert.deepEqual(r.current.dau, { total: 4, student: 3, teacher: 1, school_admin: 0 });   // s1, s2, sB + teacher
    // WAU (-6..0): s1, s2, s3, s4, sB, teacher, admin(-2) = 7; оқушы 5
    assert.deepEqual(r.current.wau, { total: 7, student: 5, teacher: 1, school_admin: 1 });
    // MAU (-29..0): + s5 (-29); s3 (-29) қайталанбайды
    assert.deepEqual(r.current.mau, { total: 8, student: 6, teacher: 1, school_admin: 1 });
    assert.equal(r.has_activity, true);
  });

  it("күн сайынғы қатар: ұзындық, бүгінгі және кешегі DAU, жылжымалы WAU/MAU", async () => {
    const r = await kpis(S.root.id, { days: 7 });
    assert.equal(r.daily.length, 7);
    const last = r.daily.at(-1), prev = r.daily.at(-2);
    assert.equal(last.day, await today());
    assert.deepEqual([last.dau, last.student, last.teacher, last.wau, last.mau], [4, 3, 1, 7, 8]);
    assert.equal(prev.dau, 2);   // s1, s3 кеше
    assert.equal(r.daily[0].mau >= r.daily[0].wau, true);
  });

  it("ДЕМО ұйымдары әдепкіде есепке кірмейді; include_demo=true болса кіреді", async () => {
    const D = await mkOrg("ДЕМО мектеп", "metric-demo", { demo: true });
    const dt = await mkTeacher(D, "Демо Мұғалім");
    await act(dt, D.org, 0, "teacher");
    assert.equal((await kpis(S.root.id)).current.dau.teacher, 1);
    assert.equal((await kpis(S.root.id, { demo: true })).current.dau.teacher, 2);
    assert.equal((await kpis(S.root.id)).totals.orgs, 2);
    assert.equal((await kpis(S.root.id, { demo: true })).totals.orgs, 3);
    await admin("delete from organizations where id = $1", [D.org]);
  });

  it("деректер жоқ болса has_activity=false, сандар 0 (жалған дерек жоқ)", async () => {
    await clearAct();
    const r = await kpis(S.root.id);
    assert.equal(r.has_activity, false);
    assert.equal(r.data_since, null);
    assert.equal(r.current.dau.total, 0);
    assert.ok(r.daily.every((d) => d.dau === 0 && d.mau === 0));
  });
});

describe("metrics: activation воронкасы", () => {
  const F = {};
  before(async () => {
    await clearAct();
    await admin("truncate public.leads");
    for (const e of ["a@x.kz", "b@x.kz", "c@x.kz"]) {
      await asAnon((q) => q("select public.submit_lead('Мектеп','Байланыс Адам',$1,null,'director','school',100,null,true,'t')", [e]));
    }
    // C: тек ұйым; D: ұйым + сынып; E: сынып + тапсырма + жұмыс, бірақ апталық қатар үзілген; F: толық, 4 апта қатарынан
    F.C = await mkOrg("Ұйым C", "metric-c");
    F.D = await mkOrg("Ұйым D", "metric-d");
    await mkClass(F.D, await mkTeacher(F.D, "Мұғалім D"));
    for (const k of ["E", "F"]) {
      const o = (F[k] = await mkOrg(`Ұйым ${k}`, `metric-${k.toLowerCase()}`));
      o.t = await mkTeacher(o, `Мұғалім ${k}`);
      o.cls = await mkClass(o, o.t);
      o.st = await mkStudent(o.cls, `Оқушы ${k}`);
      const aid = await mkAssignment(o, o.t, o.cls, { ...QUIZ });
      await submitQuiz(o.st, aid, true);
    }
    // тек сынып+тапсырма (жұмыссыз) ұйымы G
    F.G = await mkOrg("Ұйым G", "metric-g");
    F.G.t = await mkTeacher(F.G, "Мұғалім G");
    F.G.cls = await mkClass(F.G, F.G.t);
    await mkAssignment(F.G, F.G.t, F.G.cls, { ...QUIZ });
    for (const off of [0, -7, -14, -21]) await act(F.F.t, F.F.org, off, "teacher");        // 4 апта қатарынан
    for (const off of [0, -7, -21, -28]) await act(F.E.t, F.E.org, off, "teacher");        // -14 апта үзілген
  });

  it("қадамдар дәл: лид 3, ұйым 7 (S.A,S.B қоса), сынып, тапсырма, жұмыс, 4 апта қатары", async () => {
    const r = await kpis(S.root.id);
    const f = Object.fromEntries(r.funnel.map((x) => [x.key, x.count]));
    // ұйымдар: A, B (бұрынғы describe-тан), C, D, E, F, G = 7; сыныбы бар: A, B, D, E, F, G = 6; тапсырмасы бар: E, F, G = 3; жұмысы бар: E, F = 2; қатар: F = 1
    assert.deepEqual(f, { leads: 3, org: 7, class: 6, assignment: 3, submission: 2, streak4: 1 });
    assert.deepEqual(r.funnel.map((x) => x.key), ["leads", "org", "class", "assignment", "submission", "streak4"]);
    for (let i = 2; i < r.funnel.length; i++) assert.ok(r.funnel[i].count <= r.funnel[i - 1].count, "воронка кемімелі");
  });

  it("ДЕМО ұйымы воронкаға әдепкіде кірмейді", async () => {
    await admin("update organizations set is_demo = true where id = $1", [F.F.org]);
    const f1 = Object.fromEntries((await kpis(S.root.id)).funnel.map((x) => [x.key, x.count]));
    assert.deepEqual([f1.org, f1.submission, f1.streak4], [6, 1, 0]);
    const f2 = Object.fromEntries((await kpis(S.root.id, { demo: true })).funnel.map((x) => [x.key, x.count]));
    assert.deepEqual([f2.org, f2.submission, f2.streak4], [7, 2, 1]);
    await admin("update organizations set is_demo = false where id = $1", [F.F.org]);
  });
});

describe("metrics: когорттық retention", () => {
  it("ұйымдар мен оқушылар когорттары белгілі деректермен дәл", async () => {
    await clearAct();
    // барлық ұйымдарды ескі (когорттан тыс) етіп, A, B, C-ны нақты апталарға қоямыз
    await admin("update organizations set created_at = now() - interval '300 days'");
    const ws = (await one("select public.week_start(public.metrics_today())::text as w")).w;
    const wk = (n) => `(${`'${ws}'::date`} + ${7 * n})`;
    const C = await one("select id from organizations where slug = 'metric-c'");
    await admin(`update organizations set created_at = ${wk(-3)}::timestamp + interval '12 hours' where slug in ('metric-a', 'metric-b')`);
    await admin(`update organizations set created_at = ${wk(-1)}::timestamp + interval '12 hours' where id = $1`, [C.id]);
    const [s1, s2, s3, s4] = S.s;
    const rowAt = (u, org, n, role = "student") => admin(`insert into public.activity_days(user_id, org_id, day, role) values ($1, $2, ${wk(n)}, $3) on conflict do nothing`, [u.id, org, role]);
    // A: апта -3, -2, 0 (білек; ұйым деңгейі үшін мұғалім/оқушы кез келген) ; B: тек -3 ; C: -1
    await rowAt(S.teacher, S.A.org, -3, "teacher"); await rowAt(S.teacher, S.A.org, -2, "teacher"); await rowAt(S.teacher, S.A.org, 0, "teacher");
    await rowAt(S.teacherB, S.B.org, -3, "teacher");
    // оқушылар (A): s1 -2,-1,0 ; s2 -2 ; s3 -1,0 ; s4 0
    await rowAt(s1, S.A.org, -2); await rowAt(s1, S.A.org, -1); await rowAt(s1, S.A.org, 0);
    await rowAt(s2, S.A.org, -2);
    await rowAt(s3, S.A.org, -1); await rowAt(s3, S.A.org, 0);
    await rowAt(s4, S.A.org, 0);
    // C ұйымының -1 аптадағы белсенділігі: оның әкімшісі арқылы
    const cmem = (await one("select user_id from organization_members where org_id = $1 limit 1", [C.id])).user_id;
    await admin(`insert into public.activity_days(user_id, org_id, day, role) values ($1, $2, ${wk(-1)}, 'school_admin') on conflict do nothing`, [cmem, C.id]);

    const r = await kpis(S.root.id, { weeks: 12 });
    const co = Object.fromEntries(r.retention_orgs.map((c) => [c.cohort, c]));
    assert.equal(r.retention_orgs.length, 2);
    const a3 = co[(await one(`select ${wk(-3)}::text as d`)).d];
    assert.equal(a3.size, 2);
    assert.deepEqual(a3.active.slice(0, 5), [2, 1, 1, 1, null]);   // B тек 0-аптада; A (оқушылары арқылы) -1-аптада да белсенді
    assert.equal(a3.active.length, 12);
    assert.ok(a3.active.slice(4).every((x) => x === null), "болашақ апталар null");
    const c1 = co[(await one(`select ${wk(-1)}::text as d`)).d];
    assert.equal(c1.size, 1);
    assert.deepEqual(c1.active.slice(0, 3), [1, 0, null]);

    const st = Object.fromEntries(r.retention_students.map((c) => [c.cohort, c]));
    assert.equal(r.retention_students.length, 3);
    const k = async (n) => st[(await one(`select ${wk(n)}::text as d`)).d];
    assert.equal((await k(-2)).size, 2); assert.deepEqual((await k(-2)).active.slice(0, 4), [2, 1, 1, null]);
    assert.equal((await k(-1)).size, 1); assert.deepEqual((await k(-1)).active.slice(0, 3), [1, 1, null]);
    assert.equal((await k(0)).size, 1); assert.deepEqual((await k(0)).active.slice(0, 2), [1, null]);
  });
});

describe("metrics: ұйым денсаулығы және пилот есебі (белгілі деректермен)", () => {
  const H = {};
  before(async () => {
    await clearAct();
    const [s1, s2, s3, s4] = S.s;
    // A мектебі: 5 оқушы. a1 - тест (мерзімі 2 күн бұрын), a2 - python (мерзімсіз, 3 күн бұрын құрылған)
    H.a1 = await mkAssignment(S.A, S.teacher, S.cls, { ...QUIZ, title: "Тест-1 (мерзімді)" });
    H.a2 = await mkAssignment(S.A, S.teacher, S.cls, { title: "Python-1", kind: "python", starter_code: "x=1" });
    const subs = [[s1, true], [s2, true], [s3, false]];
    H.sub = [];
    for (const [u, ok] of subs) H.sub.push(await submitQuiz(u, H.a1, ok));
    H.py = [await submitCode(s1, H.a2), await submitCode(s4, H.a2)];
    await admin("update assignments set deadline = now() - interval '2 days' where id = $1", [H.a1]);
    await admin("update assignments set created_at = now() - interval '3 days' where id = $1", [H.a2]);
    // s1, s2 - мерзімінен бұрын; s3 - кешікті
    await admin("update submissions set submitted_at = (select deadline from assignments where id = $1) - interval '3 hours' where id = any ($2)", [H.a1, [H.sub[0], H.sub[1]]]);
    await admin("update submissions set submitted_at = (select deadline from assignments where id = $1) + interval '3 hours' where id = $2", [H.a1, H.sub[2]]);
    for (const [u, off] of [[s1, 0], [s2, -1], [s3, -5], [s4, -27]]) await act(u, S.A.org, off, "student");     // s5 - белсенді емес; s4: терезенің шетінде
    await act(S.teacher, S.A.org, 0, "teacher");
    await act(s1, S.A.org, -40, "student");  // терезеден тыс
  });

  it("org_health: компоненттер мен ұпай қолмен есептелген мәнмен сәйкес (53)", async () => {
    const r = (await as(S.A.admin.id, (q) => q("select public.org_health($1) as r", [S.A.org])))[0].r;
    assert.equal(r.students, 5); assert.equal(r.active_students, 4); assert.equal(r.active_teachers, 1);
    assert.equal(r.expected, 10, "2 тапсырма x 5 оқушы"); assert.equal(r.completed, 5);
    assert.equal(r.completed_with_deadline, 3); assert.equal(r.on_time, 2);
    assert.equal(r.max_students, 500);
    assert.deepEqual(r.components, { active_share: 0.8, completion: 0.5, timeliness: 0.6667, seats: 0.02 });
    // (35*0.8 + 30*0.5 + 15*(2/3) + 20*0.02) / 100 = 0.534 -> 53
    assert.equal(r.score, 53); assert.equal(r.band, "watch"); assert.equal(r.small_n, true);
    assert.equal(r.daily.length, 28);
    assert.equal(r.daily.at(-1).students, 1); assert.equal(r.daily.at(-1).teachers, 1);
    assert.equal(r.daily.reduce((a, d) => a + d.students, 0), 4);
  });

  it("жеке дерексіз: org_health JSON-да аттар да, id-лер де жоқ (ұйым id-інен басқа)", async () => {
    const txt = JSON.stringify((await as(S.root.id, (q) => q("select public.org_health($1) as r", [S.A.org])))[0].r);
    for (const u of [...S.s, S.teacher, S.A.admin]) { assert.ok(!txt.includes(u.id)); assert.ok(!txt.includes(u.name)); }
  });

  it("қысқа терезе: s4 (-27 күн) 7 күндік терезеге кірмейді -> белсенді оқушы 3", async () => {
    const r = (await as(S.A.admin.id, (q) => q("select public.org_health($1, 7) as r", [S.A.org])))[0].r;
    assert.equal(r.active_students, 3);   // s1 (0), s2 (-1), s3 (-5); s4 (-27) тыс
    assert.equal(r.daily.length, 7);
  });

  it("платформа тізімі: ДЕМО-сыз, жиынтық; SUPER ADMIN ұйым атын көреді, адам атын емес", async () => {
    const list = (await as(S.root.id, (q) => q("select public.platform_org_health() as r")))[0].r;
    assert.ok(list.length >= 2 && list.every((o) => o.is_demo === false));
    const a = list.find((o) => o.org_id === S.A.org);
    assert.equal(a.score, 53);
    assert.equal(a.daily, null);
    assert.ok(!JSON.stringify(list).includes("Оқушы 1"));
  });

  it("score: белсенді оқушы жоқ болса null / no_data (жалған 0 емес)", async () => {
    const C = await one("select id from organizations where slug = 'metric-c'");
    const r = (await as(S.root.id, (q) => q("select public.org_health($1) as r", [C.id])))[0].r;
    assert.equal(r.score, null); assert.equal(r.band, "no_data"); assert.equal(r.components.active_share, null);
  });

  it("pilot_report: кезеңдік жиынтық сандар дәл, жеке деректі қамтымайды", async () => {
    const [d0, d27] = [await dayOff(0), await dayOff(-27)];
    const r = (await as(S.A.admin.id, (q) => q("select public.pilot_report($1, $2::date, $3::date) as r", [S.A.org, d27, d0])))[0].r;
    assert.equal(r.assignments, 2); assert.equal(r.quizzes, 1); assert.equal(r.submissions, 5);
    assert.equal(r.active_students, 4); assert.equal(r.students, 5);
    assert.equal(r.avg_grade_pct, 66.7); assert.equal(r.avg_grade_n, 3);
    assert.equal(r.score, 53);
    assert.deepEqual(r.hard_assignments, [{ title: "Тест-1 (мерзімді)", avg_pct: 66.7, n: 3 }]);
    assert.deepEqual(r.low_completion, [{ title: "Python-1", expected: 5, completed: 2 }]);
    assert.equal(r.students_below_50, 1); assert.equal(r.graded_students, 3);
    assert.equal(r.has_activity, true);
    assert.equal(r.top_days[0].users, 2, "ең белсенді күн: бүгін s1 + мұғалім");
    assert.equal(r.top_days.length, 4);
    const txt = JSON.stringify(r);
    for (const u of [...S.s, S.teacher, S.A.admin]) { assert.ok(!txt.includes(u.id), "id ағып кетті"); assert.ok(!txt.includes(u.name), "ат ағып кетті"); }
    assert.equal((await as(S.root.id, (q) => q("select public.pilot_report($1, $2::date, $3::date) as r", [S.A.org, d27, d0])))[0].r.submissions, 5);
  });

  it("pilot_report: деректі кезең бос болса нөлдер және has_activity=false", async () => {
    const [d0, d6, d400] = [await dayOff(0), await dayOff(-6), await dayOff(-400)];
    const r = (await as(S.B.admin.id, (q) => q("select public.pilot_report($1, $2::date, $3::date) as r", [S.B.org, d6, d0])))[0].r;
    assert.equal(r.has_activity, false); assert.equal(r.submissions, 0); assert.equal(r.avg_grade_pct, null);
    assert.deepEqual(r.top_days, []); assert.deepEqual(r.hard_assignments, []);
    await fails(as(S.B.admin.id, (q) => q("select public.pilot_report($1, $2::date, $3::date)", [S.B.org, d400, d0])), "invalid_range");
  });
});
