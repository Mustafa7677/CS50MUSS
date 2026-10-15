// Пилот сұрауы воронкасы (0012): RLS, submit_lead валидациясы, дубликат, consent, SUPER ADMIN, purge, тікелей жазу тыйымы.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { pool, admin, as, asAnon, fails, newUser, reset, future } from "./helpers.mjs";

const S = {};
after(() => pool.end());

const lead = (o = {}) => ({
  org: "Мектеп-гимназия №5", contact: "Айгүл Сәрсенбай", email: "aigul@example.kz", phone: "+7 701 000 00 00", role: "director", type: "school",
  students: 450, message: "Пилот сұраймыз", consent: true, source: "test", ...o,
});
const submit = (run, o = {}) => {
  const l = lead(o);
  return run((q) => q("select public.submit_lead($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) as r", [l.org, l.contact, l.email, l.phone, l.role, l.type, l.students, l.message, l.consent, l.source]));
};
const count = async (where = "true", p = []) => Number((await admin(`select count(*)::int n from public.leads where ${where}`, p))[0].n);

describe("leads: құқықтар, валидация, воронка", () => {
  before(async () => {
    await reset();
    await admin("truncate public.leads");
    S.root = await newUser("Платформа Әкімші");
    await admin("insert into platform_admins(user_id) values ($1)", [S.root.id]);
    const r = await as(S.root.id, (q) => q("select public.create_organization('Мектеп L', 'school-l', 'starter', $1) as r", [future()]));
    S.org = r[0].r.org_id;
    S.admin = await newUser("Әкімші L");
    await as(S.admin.id, (q) => q("select public.accept_invitation($1)", [r[0].r.admin_invite_token]));
    const t = await as(S.admin.id, (q) => q("select public.create_invitation($1, 'teacher') as t", [S.org]));
    S.teacher = await newUser("Мұғалім L");
    await as(S.teacher.id, (q) => q("select public.accept_invitation($1)", [t[0].t]));
    S.cls = (await as(S.teacher.id, (q) => q("select public.create_classroom($1, '9А', '2025-2026', 'Информатика') as id", [S.org])))[0].id;
    const code = (await admin("select join_code from classrooms where id=$1", [S.cls]))[0].join_code;
    S.student = await newUser("Оқушы L");
    await as(S.student.id, (q) => q("select public.join_classroom($1)", [code]));
  });

  it("anon дұрыс сұрауды жібере алады; e-mail кіші әріпке келтіріледі, consent_at жазылады", async () => {
    const r = await submit(asAnon, { email: "  AiGuL@Example.KZ " });
    assert.equal(r[0].r, true);
    const [row] = await admin("select * from public.leads");
    assert.equal(row.email, "aigul@example.kz");
    assert.equal(row.status, "new");
    assert.equal(row.consent, true);
    assert.ok(row.consent_at);
    assert.equal(row.org_name, "Мектеп-гимназия №5");
  });

  it("дубликат: 24 сағатта бір e-mail-ден екінші жол ашылмайды, бірақ жауап сәтті (e-mail ағып кетпейді)", async () => {
    const r = await submit(asAnon, { org: "Басқа ұйым", email: "AIGUL@example.kz" });
    assert.equal(r[0].r, true);
    assert.equal(await count(), 1);
    assert.equal((await admin("select org_name from public.leads"))[0].org_name, "Мектеп-гимназия №5");
    // 24 сағаттан кейін қайта қабылданады
    await admin("update public.leads set created_at = now() - interval '25 hours'");
    await submit(asAnon, { org: "Екінші жіберу", email: "aigul@example.kz" });
    assert.equal(await count(), 2);
  });

  it("валидация: e-mail пішімі, ұзындықтар, рөл/түр, оқушы саны, consent", async () => {
    const bad = [
      { email: "жоқ" }, { email: "a@b" }, { email: "a b@c.kz" }, { email: "x".repeat(160) + "@a.kz" },
      { org: "А" }, { org: "а".repeat(161) }, { contact: "" }, { contact: "б".repeat(121) },
      { role: "hacker" }, { type: "bank" }, { students: 0 }, { students: 100001 }, { message: "м".repeat(1001) },
      { phone: "123" }, { phone: "1".repeat(41) }, { source: "s".repeat(61) },
    ];
    for (const [i, o] of bad.entries()) {
      await fails(submit(asAnon, { email: `v${i}@example.kz`, ...o }), "invalid_input");
    }
    await fails(submit(asAnon, { email: "c1@example.kz", consent: false }), "invalid_input");
    await fails(submit(asAnon, { email: "c2@example.kz", consent: null }), "invalid_input");
    assert.equal(await count("email like 'v%' or email like 'c%'"), 0);
  });

  it("ерікті өрістер null болуы мүмкін; бос жол null-ға айналады", async () => {
    await submit(asAnon, { email: "opt@example.kz", phone: "  ", students: null, message: "" });
    const [r] = await admin("select phone, students_estimate, message from public.leads where email='opt@example.kz'");
    assert.deepEqual(r, { phone: null, students_estimate: null, message: null });
  });

  it("кестеге тікелей INSERT/UPDATE/DELETE/SELECT жабық: anon, оқушы, мұғалім, мектеп әкімшісі, тіпті SUPER ADMIN", async () => {
    const ins = "insert into public.leads (org_name, contact_name, email, role, org_type, consent) values ('Хак','Хак','h@x.kz','other','other',true)";
    await fails(asAnon((q) => q(ins)), "permission denied");
    await fails(asAnon((q) => q("select * from public.leads")), "permission denied");
    for (const u of [S.student, S.teacher, S.admin, S.root]) {
      await fails(as(u.id, (q) => q(ins)), "permission denied");
      await fails(as(u.id, (q) => q("update public.leads set status = 'won'")), "permission denied");
      await fails(as(u.id, (q) => q("delete from public.leads")), "permission denied");
    }
    assert.equal(await count("org_name = 'Хак'"), 0);
    assert.equal(await count("status = 'won'"), 0);
  });

  it("RLS: оқушы, мұғалім, мектеп әкімшісі тізімді көрмейді (0 жол); SUPER ADMIN көреді", async () => {
    const total = await count();
    assert.ok(total >= 3);
    for (const u of [S.student, S.teacher, S.admin]) {
      assert.equal((await as(u.id, (q) => q("select * from public.leads"))).length, 0, "жеке дерек ағып кетті");
    }
    const rows = await as(S.root.id, (q) => q("select * from public.leads"));
    assert.equal(rows.length, total);
  });

  it("set_lead_status / delete_lead / lead_funnel / purge / audit_leads_export: тек SUPER ADMIN; anon-да EXECUTE жоқ", async () => {
    const [{ id }] = await admin("select id from public.leads where email='opt@example.kz'");
    for (const u of [S.student, S.teacher, S.admin]) {
      await fails(as(u.id, (q) => q("select public.set_lead_status($1,'won','x')", [id])), "forbidden");
      await fails(as(u.id, (q) => q("select public.delete_lead($1)", [id])), "forbidden");
      await fails(as(u.id, (q) => q("select * from public.lead_funnel()")), "forbidden");
      await fails(as(u.id, (q) => q("select public.purge_old_leads(1)")), "forbidden");
      await fails(as(u.id, (q) => q("select public.audit_leads_export(1)")), "forbidden");
    }
    await fails(asAnon((q) => q("select public.set_lead_status($1,'won','x')", [id])), "permission denied");
    await fails(asAnon((q) => q("select * from public.lead_funnel()")), "permission denied");
    await fails(asAnon((q) => q("select public.purge_old_leads(1)")), "permission denied");
    assert.equal((await admin("select status from public.leads where id=$1", [id]))[0].status, "new");
  });

  it("SUPER ADMIN статусты ауыстырады, жазба сақталады, аудитте мазмұн мен e-mail жоқ", async () => {
    const [{ id }] = await admin("select id from public.leads where email='opt@example.kz'");
    await as(S.root.id, (q) => q("select public.set_lead_status($1,'demo','  Сейсенбіде қоңырау  ')", [id]));
    const [r] = await admin("select status, notes from public.leads where id=$1", [id]);
    assert.deepEqual(r, { status: "demo", notes: "Сейсенбіде қоңырау" });
    await fails(as(S.root.id, (q) => q("select public.set_lead_status($1,'bogus',null)", [id])), "invalid_status");
    await fails(as(S.root.id, (q) => q("select public.set_lead_status(gen_random_uuid(),'won',null)")), "not_found");
    await fails(as(S.root.id, (q) => q("select public.set_lead_status($1,'won',$2)", [id, "н".repeat(2001)])), "invalid_input");
    const [a] = await admin("select * from audit_logs where action = 'lead.status' order by id desc limit 1");
    assert.equal(a.entity_id, id);
    assert.deepEqual(a.meta, { status: "demo" });
    assert.ok(!JSON.stringify(a).includes("example.kz") && !JSON.stringify(a).includes("қоңырау"));
  });

  it("lead_funnel: статус бойынша нақты санақ (нөлдерімен) және соңғы 30 күн", async () => {
    await admin("truncate public.leads");
    for (const [i, st] of ["new", "new", "contacted", "pilot", "lost"].entries()) {
      await submit(asAnon, { email: `f${i}@example.kz` });
      await admin("update public.leads set status=$1 where email=$2", [st, `f${i}@example.kz`]);
    }
    await admin("update public.leads set created_at = now() - interval '40 days' where email in ('f0@example.kz','f4@example.kz')");
    const f = await as(S.root.id, (q) => q("select status, total::int, last_30d::int from public.lead_funnel()"));
    assert.deepEqual(f, [
      { status: "new", total: 2, last_30d: 1 }, { status: "contacted", total: 1, last_30d: 1 }, { status: "demo", total: 0, last_30d: 0 },
      { status: "pilot", total: 1, last_30d: 1 }, { status: "won", total: 0, last_30d: 0 }, { status: "lost", total: 1, last_30d: 0 },
    ]);
  });

  it("purge_old_leads: ескі жазбаларды жояды (SUPER ADMIN не рөлі ауыстырылмаған иесі қосылымы), аудитте тек саны", async () => {
    await admin("truncate public.leads");
    for (const [i, d] of [10, 200, 400, 800].entries()) {
      await submit(asAnon, { email: `p${i}@example.kz` });
      await admin("update public.leads set created_at = now() - make_interval(days => $1) where email=$2", [d, `p${i}@example.kz`]);
    }
    await fails(as(S.root.id, (q) => q("select public.purge_old_leads(0)")), "invalid_range");
    const n = (await as(S.root.id, (q) => q("select public.purge_old_leads(365) as n")))[0].n;
    assert.equal(n, 2);
    assert.equal(await count(), 2);
    const n2 = (await admin("select public.purge_old_leads(100) as n"))[0].n;   // scripts/leads-purge.mjs жолы
    assert.equal(n2, 1);
    assert.equal(await count(), 1);
    const [a] = await admin("select meta from audit_logs where action = 'lead.purge' order by id desc limit 1");
    assert.deepEqual(a.meta, { days: 100, count: 1 });
  });

  it("delete_lead жояды және аудит жазады", async () => {
    const [{ id }] = await admin("select id from public.leads limit 1");
    await as(S.root.id, (q) => q("select public.delete_lead($1)", [id]));
    assert.equal(await count(), 0);
    await fails(as(S.root.id, (q) => q("select public.delete_lead($1)", [id])), "not_found");
    assert.equal((await admin("select count(*)::int n from audit_logs where action='lead.delete' and entity_id=$1", [id]))[0].n, 1);
  });

  it("қауіпсіздік каталогы: leads-те RLS бар, PUBLIC-те EXECUTE жоқ, anon тек submit_lead", async () => {
    const [t] = await admin("select relrowsecurity rls from pg_class where oid = 'public.leads'::regclass");
    assert.equal(t.rls, true);
    const pub = await admin(`select p.proname from pg_proc p where p.proname in ('submit_lead','set_lead_status','delete_lead','lead_funnel','purge_old_leads','audit_leads_export')
      and has_function_privilege('public', p.oid, 'execute')`);
    assert.deepEqual(pub, []);
    const anon = await admin(`select p.proname from pg_proc p where p.proname in ('submit_lead','set_lead_status','delete_lead','lead_funnel','purge_old_leads','audit_leads_export')
      and has_function_privilege('anon', p.oid, 'execute')`);
    assert.deepEqual(anon.map((r) => r.proname), ["submit_lead"]);
    const g = await admin("select has_table_privilege('anon','public.leads','select') a, has_table_privilege('authenticated','public.leads','insert') i, has_table_privilege('authenticated','public.leads','update') u, has_table_privilege('authenticated','public.leads','delete') d");
    assert.deepEqual(g[0], { a: false, i: false, u: false, d: false });
  });
});
