// QazaqCode: лицензия басқару, white-label және демо бөліктерінің дерекқор тесттері (нақты PostgreSQL + RLS).
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { pool, admin, as, fails, newUser, reset, future, past } from "./helpers.mjs";

const S = {};
after(() => pool.end());

async function mkSchool(k, plan = "starter") {
  const r = await as(S.root.id, (q) => q("select public.create_organization($1, $2, $3::license_plan, $4) as r", [`Мектеп ${k}`, `lu-${k.toLowerCase()}`, plan, future()]));
  const o = { org: r[0].r.org_id };
  o.admin = await newUser(`Әкімші ${k}`);
  await as(o.admin.id, (q) => q("select public.accept_invitation($1)", [r[0].r.admin_invite_token]));
  const t = await as(o.admin.id, (q) => q("select public.create_invitation($1, 'teacher') as t", [o.org]));
  o.teacher = await newUser(`Мұғалім ${k}`);
  await as(o.teacher.id, (q) => q("select public.accept_invitation($1)", [t[0].t]));
  o.cls = (await as(o.teacher.id, (q) => q("select public.create_classroom($1, '9А', '2025-2026', 'Информатика') as id", [o.org])))[0].id;
  o.code = (await admin("select join_code from classrooms where id=$1", [o.cls]))[0].join_code;
  o.student = await newUser(`Оқушы ${k}`);
  await as(o.student.id, (q) => q("select public.join_classroom($1)", [o.code]));
  // жарияланған тапсырма (мерзім біткенде де тапсыруға болуы тексеріледі)
  o.asg = (await as(o.teacher.id, (q) => q("select public.upsert_assignment($1::jsonb) as id", [JSON.stringify({ org_id: o.org, title: "Тест тапсырма", kind: "python", max_score: 100 })])))[0].id;
  await as(o.teacher.id, (q) => q("select public.set_assignment_targets($1, $2::uuid[])", [o.asg, [o.cls]]));
  await as(o.teacher.id, (q) => q("select public.set_assignment_status($1, 'published')", [o.asg]));
  S[k] = o;
}
const expire = (org) => admin("update licenses set valid_from = current_date - 60, valid_until = current_date - 2 where org_id = $1", [org]);

describe("лицензия: пайдалану және ескерту функциялары", () => {
  before(async () => {
    await reset();
    S.root = await newUser("Платформа Әкімші");
    await admin("insert into platform_admins(user_id) values ($1)", [S.root.id]);
    await mkSchool("A"); await mkSchool("B", "pro");
  });

  it("licence_usage: мектеп әкімшісі өз лицензиясы мен санын көреді", async () => {
    const [u] = await as(S.A.admin.id, (q) => q("select * from public.licence_usage($1)", [S.A.org]));
    assert.equal(u.plan, "starter"); assert.equal(u.state, "active");
    assert.equal(u.max_students, 100); assert.equal(u.max_teachers, 5);
    assert.equal(Number(u.students), 1); assert.equal(Number(u.teachers), 1);
    assert.ok(u.days_left >= 364 && u.days_left <= 366);
    const [b] = await as(S.B.admin.id, (q) => q("select * from public.licence_usage($1)", [S.B.org]));
    assert.equal(b.plan, "pro"); assert.equal(b.max_students, 500); assert.equal(b.max_teachers, 25);
  });
  it("licence_usage: мұғалім, оқушы, басқа мектеп әкімшісі және SUPER ADMIN-ге жабық", async () => {
    for (const who of [S.A.teacher, S.A.student, S.B.admin, S.root]) {
      await fails(as(who.id, (q) => q("select * from public.licence_usage($1)", [S.A.org])), "forbidden");
    }
    await assert.rejects(as(null, (q) => q("select * from public.licence_usage($1)", [S.A.org])));
  });
  it("licence_notice: мүше күйі мен күнді көреді, лимит/пакет жоқ; бөтен ұйымға жабық", async () => {
    for (const who of [S.A.admin, S.A.teacher, S.A.student]) {
      const rows = await as(who.id, (q) => q("select * from public.licence_notice($1)", [S.A.org]));
      assert.equal(rows.length, 1);
      assert.deepEqual(Object.keys(rows[0]).sort(), ["days_left", "state", "valid_until"]);
      assert.equal(rows[0].state, "active");
    }
    await fails(as(S.B.student.id, (q) => q("select * from public.licence_notice($1)", [S.A.org])), "forbidden");
    // оқушы licenses кестесін тікелей оқи алмайды
    assert.equal((await as(S.A.student.id, (q) => q("select count(*)::int n from licenses")))[0].n, 0);
  });
  it("мерзімі жақындағанда days_left дұрыс (<=30)", async () => {
    await admin("update licenses set valid_until = current_date + 12 where org_id = $1", [S.A.org]);
    const [n] = await as(S.A.student.id, (q) => q("select * from public.licence_notice($1)", [S.A.org]));
    assert.equal(n.days_left, 12); assert.equal(n.state, "active");
    await admin("update licenses set valid_until = $2 where org_id = $1", [S.A.org, future()]);
  });
});

describe("мерзімі біткен лицензия: жазу бұғатталады, оқу мен тапсыру сақталады", () => {
  before(async () => { await expire(S.A.org); });
  after(async () => { await admin("update licenses set valid_until = $2 where org_id = $1", [S.A.org, future()]); });

  it("күйі expired, банер деректері дұрыс", async () => {
    const [n] = await as(S.A.teacher.id, (q) => q("select * from public.licence_notice($1)", [S.A.org]));
    assert.equal(n.state, "expired"); assert.ok(n.days_left < 0);
    const [m] = await as(S.A.teacher.id, (q) => q("select public.my_context() as c"));
    assert.equal(m.c.memberships[0].license_state, "expired");
  });
  it("жаңа сынып, курс, мұғалім шақыру, тапсырманы жариялау, оқушы қосылуы - license_expired", async () => {
    await fails(as(S.A.teacher.id, (q) => q("select public.create_classroom($1, '10Ә', '2025-2026', 'Информатика')", [S.A.org])), "license_expired");
    await fails(as(S.A.teacher.id, (q) => q("select public.create_course($1, 'Жаңа курс')", [S.A.org])), "license_expired");
    await fails(as(S.A.admin.id, (q) => q("select public.create_invitation($1, 'teacher')", [S.A.org])), "license_expired");
    const draft = (await as(S.A.teacher.id, (q) => q("select public.upsert_assignment($1::jsonb) as id", [JSON.stringify({ org_id: S.A.org, title: "Жаңа", kind: "python", max_score: 100 })])).catch((e) => e));
    if (draft instanceof Error) assert.match(draft.message, /license_expired/);
    else {
      await as(S.A.teacher.id, (q) => q("select public.set_assignment_targets($1, $2::uuid[])", [draft[0].id, [S.A.cls]]));
      await fails(as(S.A.teacher.id, (q) => q("select public.set_assignment_status($1, 'published')", [draft[0].id])), "license_expired");
    }
    const late = await newUser("Кеш оқушы");
    await fails(as(late.id, (q) => q("select public.join_classroom($1)", [S.A.code])), "license_expired");
  });
  it("деректер сақталған және оқылады (сынып, оқушы, тапсырма, жұмыс, аналитика)", async () => {
    assert.equal((await as(S.A.teacher.id, (q) => q("select count(*)::int n from classrooms")))[0].n, 1);
    assert.equal((await as(S.A.admin.id, (q) => q("select count(*)::int n from classroom_students")))[0].n, 1);
    assert.equal((await as(S.A.teacher.id, (q) => q("select count(*)::int n from assignments where status = 'published'")))[0].n, 1);
    assert.equal((await as(S.A.student.id, (q) => q("select count(*)::int n from public.my_assignments()")))[0].n, 1);
    assert.equal((await as(S.A.admin.id, (q) => q("select count(*)::int n from public.class_students_overview($1)", [S.A.cls])))[0].n, 1);
    assert.equal((await admin("select count(*)::int n from organizations where id = $1", [S.A.org]))[0].n, 1);
  });
  it("оқушы бұрын берілген тапсырманы тапсыра алады (деректі жоғалтпайды)", async () => {
    const sid = (await as(S.A.student.id, (q) => q("select public.save_draft($1, 'print(1)', '{}'::jsonb, 30) as id", [S.A.asg])))[0].id;
    const r = await as(S.A.student.id, (q) => q("select public.submit_assignment($1) as r", [sid]));
    assert.ok(r[0].r);
    assert.equal((await admin("select status from submissions where id=$1", [sid]))[0].status, "submitted");
  });
  it("ұзарту: SUPER ADMIN extend_license -> шектеу бірден алынады", async () => {
    const [d] = await as(S.root.id, (q) => q("select public.extend_license($1, 12) as d", [S.A.org]));
    // мерзімі өткен болса, есептеу бүгіннен
    const expected = (await admin("select (current_date + interval '12 months')::date::text as d"))[0].d;
    assert.equal(String(d.d.toISOString ? d.d.toISOString().slice(0, 10) : d.d).slice(0, 10), expected);
    assert.equal((await as(S.A.teacher.id, (q) => q("select * from public.licence_notice($1)", [S.A.org])))[0].state, "active");
    const id = await as(S.A.teacher.id, (q) => q("select public.create_classroom($1, '10Ә', '2025-2026', 'Информатика') as id", [S.A.org]));
    assert.ok(id[0].id);
  });
});

describe("SUPER ADMIN: лицензия басқару және аудит", () => {
  it("set_license: өткен мерзім қойылады (valid_from түзеледі), лимиттер мен күй өзгереді, аудитке жазылады", async () => {
    await as(S.root.id, (q) => q("select public.set_license($1, 'enterprise', 750, 40, $2, 'active', 'Келісімшарт №7')", [S.B.org, past(10)]));
    const [l] = await admin("select plan, max_students, max_teachers, status, notes, valid_from <= valid_until ok, valid_until < current_date exp from licenses where org_id=$1", [S.B.org]);
    assert.deepEqual([l.plan, l.max_students, l.max_teachers, l.status, l.notes, l.ok, l.exp], ["enterprise", 750, 40, "active", "Келісімшарт №7", true, true]);
    assert.equal((await as(S.B.teacher.id, (q) => q("select public.license_state($1) as s", [S.B.org])))[0].s, "expired");
    const [a] = await admin("select meta, actor_id from audit_logs where org_id=$1 and action='license.set' order by id desc limit 1", [S.B.org]);
    assert.equal(a.actor_id, S.root.id);
    assert.equal(a.meta.plan, "enterprise"); assert.equal(a.meta.max_students, 750); assert.equal(a.meta.max_teachers, 40);
    await as(S.root.id, (q) => q("select public.set_license($1, 'pro', 500, 25, $2, 'active', null)", [S.B.org, future()]));
  });
  it("extend_license: қолданыстағы мерзімнен ұзартады және аудитке жазады", async () => {
    await admin("update licenses set valid_until = current_date + 10 where org_id=$1", [S.B.org]);
    await as(S.root.id, (q) => q("select public.extend_license($1, 12)", [S.B.org]));
    const [l] = await admin("select (valid_until - current_date) d from licenses where org_id=$1", [S.B.org]);
    assert.ok(l.d >= 375 && l.d <= 376);
    const [a] = await admin("select meta from audit_logs where org_id=$1 and action='license.extend' order by id desc limit 1", [S.B.org]);
    assert.equal(a.meta.months, 12);
  });
  it("extend_license/set_license: SUPER ADMIN емес және дұрыс емес енгізу қабылданбайды", async () => {
    for (const who of [S.B.admin, S.B.teacher, S.B.student]) {
      await fails(as(who.id, (q) => q("select public.extend_license($1, 12)", [S.B.org])), "forbidden");
      await fails(as(who.id, (q) => q("select public.set_license($1, 'pro', 999, 99, $2, 'active', null)", [S.B.org, future()])), "forbidden");
    }
    await fails(as(S.root.id, (q) => q("select public.extend_license($1, 0)", [S.B.org])), "invalid_input");
    await fails(as(S.root.id, (q) => q("select public.extend_license($1, 61)", [S.B.org])), "invalid_input");
    await fails(as(S.root.id, (q) => q("select public.set_license($1, 'pro', -1, 5, $2, 'active', null)", [S.B.org, future()])), "invalid_input");
    await fails(as(S.root.id, (q) => q("select public.extend_license('00000000-0000-4000-8000-000000000000', 12)")), "not_found");
  });
  it("лицензия тоқтатылса: күйі suspended; ұйымды тоқтату/қосу (set_org_status) аудитке жазылады", async () => {
    await as(S.root.id, (q) => q("select public.set_license($1, 'pro', 500, 25, $2, 'suspended', null)", [S.B.org, future()]));
    assert.equal((await as(S.B.admin.id, (q) => q("select state from public.licence_notice($1)", [S.B.org])))[0].state, "suspended");
    await fails(as(S.B.teacher.id, (q) => q("select public.create_classroom($1,'X','2025','Y')", [S.B.org])), "license_expired");
    await as(S.root.id, (q) => q("select public.set_license($1, 'pro', 500, 25, $2, 'active', null)", [S.B.org, future()]));
    await as(S.root.id, (q) => q("select public.set_org_status($1, 'suspended')", [S.B.org]));
    assert.equal((await as(S.B.admin.id, (q) => q("select state from public.licence_notice($1)", [S.B.org])))[0].state, "org_suspended");
    await as(S.root.id, (q) => q("select public.set_org_status($1, 'active')", [S.B.org]));
    assert.equal((await as(S.B.admin.id, (q) => q("select state from public.licence_notice($1)", [S.B.org])))[0].state, "active");
    const acts = (await admin("select action from audit_logs where org_id=$1 and action like 'organization.status'", [S.B.org])).length;
    assert.equal(acts, 2);
  });
  it("SUPER ADMIN жеке деректі көрмейді: жұмыс, баға, сынып құрамы; тек жиынтық", async () => {
    for (const t of ["submissions", "grades", "classroom_students", "organization_members", "submission_results"]) {
      assert.equal((await as(S.root.id, (q) => q(`select count(*)::int n from ${t}`)))[0].n, 0, t);
    }
    const u = (await as(S.root.id, (q) => q("select * from public.platform_usage()"))).find((x) => x.org_id === S.A.org);
    assert.ok(Number(u.students) >= 1);
    assert.ok(!("full_name" in u) && !("email" in u));
  });
});

describe("white-label: бренд оқшаулауы және тексеру", () => {
  it("әкімші өз ұйымының брендін өзгертеді; басқа ұйымға жаза алмайды", async () => {
    await as(S.A.admin.id, (q) => q("select public.update_org_settings($1, 'https://a.example/logo.png', '#aa1111', '#11aa11', 'А мектебіне қош келдіңіз', 'a@a.kz', '+7 700 000')", [S.A.org]));
    await fails(as(S.B.admin.id, (q) => q("select public.update_org_settings($1, null, '#000000', '#ffffff', 'Бұзу', null, null)", [S.A.org])), "forbidden");
    await fails(as(S.A.teacher.id, (q) => q("select public.update_org_settings($1, null, '#000000', '#ffffff', 'Бұзу', null, null)", [S.A.org])), "forbidden");
    await fails(as(S.A.student.id, (q) => q("select public.update_org_settings($1, null, '#000000', '#ffffff', 'Бұзу', null, null)", [S.A.org])), "forbidden");
    const [a] = await admin("select primary_color, welcome_text, logo_url from organization_settings where org_id=$1", [S.A.org]);
    assert.deepEqual(a, { primary_color: "#aa1111", welcome_text: "А мектебіне қош келдіңіз", logo_url: "https://a.example/logo.png" });
  });
  it("B ұйымының мүшесі тек өз брендін көреді, A брендіне жол жоқ", async () => {
    await as(S.B.admin.id, (q) => q("select public.update_org_settings($1, null, '#2222cc', '#cc2222', 'В мектебі', null, null)", [S.B.org]));
    const rows = await as(S.B.student.id, (q) => q("select org_id, primary_color, welcome_text from organization_settings"));
    assert.equal(rows.length, 1); assert.equal(rows[0].org_id, S.B.org); assert.equal(rows[0].primary_color, "#2222cc");
    const [a] = await admin("select primary_color from organization_settings where org_id=$1", [S.A.org]);
    assert.equal(a.primary_color, "#aa1111");
  });
  it("org_branding (кіру беті, аноним): slug бойынша тек сол ұйымның жария өрістері; тоқтатылған ұйымға бренд жоқ", async () => {
    const a = await as(null, (q) => q("select * from public.org_branding('lu-a')"));
    assert.equal(a.length, 1); assert.equal(a[0].primary_color, "#aa1111"); assert.equal(a[0].welcome_text, "А мектебіне қош келдіңіз");
    assert.ok(!("org_id" in a[0]));
    const b = await as(null, (q) => q("select * from public.org_branding('LU-B')"));
    assert.equal(b[0].primary_color, "#2222cc"); assert.notEqual(b[0].welcome_text, a[0].welcome_text);
    assert.equal((await as(null, (q) => q("select * from public.org_branding('joq-mektep')"))).length, 0);
    await as(S.root.id, (q) => q("select public.set_org_status($1, 'suspended')", [S.A.org]));
    assert.equal((await as(null, (q) => q("select * from public.org_branding('lu-a')"))).length, 0);
    await as(S.root.id, (q) => q("select public.set_org_status($1, 'active')", [S.A.org]));
    await assert.rejects(as(null, (q) => q("select * from organization_settings")));
  });
  it("логотип тек https, түс #rrggbb: DB деңгейінде тексеріледі", async () => {
    for (const bad of ["http://x.kz/l.png", "javascript:alert(1)", "data:image/png;base64,AAAA", "https://x.kz/a b.png", "ftp://x.kz/a.png"]) {
      await fails(as(S.A.admin.id, (q) => q("select public.update_org_settings($1, $2, '#aa1111', '#11aa11', null, null, null)", [S.A.org, bad])), "invalid_input");
    }
    await fails(as(S.A.admin.id, (q) => q("select public.update_org_settings($1, null, 'red', '#11aa11', null, null, null)", [S.A.org])), "invalid_input");
    await fails(as(S.A.admin.id, (q) => q("select public.update_org_settings($1, null, '#aa1111', '#12', null, null, null)", [S.A.org])), "invalid_input");
    await as(S.A.admin.id, (q) => q("select public.update_org_settings($1, '', '#aa1111', '#11aa11', null, null, null)", [S.A.org]));
    assert.equal((await admin("select logo_url from organization_settings where org_id=$1", [S.A.org]))[0].logo_url, null);
  });
});

describe("демо белгісі", () => {
  it("is_demo тек белгіленген ұйымда; my_context мүшелікте оны көрсетеді", async () => {
    await admin("update organizations set is_demo = true where id = $1", [S.A.org]);
    const a = (await as(S.A.student.id, (q) => q("select public.my_context() as c")))[0].c.memberships[0];
    const b = (await as(S.B.student.id, (q) => q("select public.my_context() as c")))[0].c.memberships[0];
    assert.equal(a.is_demo, true); assert.equal(b.is_demo, false);
  });
});
