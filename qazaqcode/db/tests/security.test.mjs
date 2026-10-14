// QazaqCode: RLS, рөлдер, лицензия және ұйымдар арасындағы оқшаулау тесттері (нақты PostgreSQL).
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { pool, admin, as, asAnon, fails, newUser, reset, future, past } from "./helpers.mjs";

const S = {}; // ортақ күй: A және B мектептері
after(() => pool.end());

describe("негізгі сценарий және оқшаулау", () => {
  before(async () => {
    await reset();
    S.root = await newUser("Платформа Әкімші");
    await admin("insert into platform_admins(user_id) values ($1)", [S.root.id]);
    for (const k of ["A", "B"]) {
      const r = await as(S.root.id, (q) => q("select public.create_organization($1, $2, 'starter', $3) as r", [`Мектеп ${k}`, `school-${k.toLowerCase()}`, future()]));
      S[k] = { org: r[0].r.org_id, adminToken: r[0].r.admin_invite_token };
      S[k].admin = await newUser(`Әкімші ${k}`);
      await as(S[k].admin.id, (q) => q("select public.accept_invitation($1)", [S[k].adminToken]));
      const t = await as(S[k].admin.id, (q) => q("select public.create_invitation($1, 'teacher') as t", [S[k].org]));
      S[k].teacher = await newUser(`Мұғалім ${k}`);
      await as(S[k].teacher.id, (q) => q("select public.accept_invitation($1)", [t[0].t]));
      const c = await as(S[k].teacher.id, (q) => q("select public.create_classroom($1, '9А', '2025-2026', 'Информатика') as id", [S[k].org]));
      S[k].cls = c[0].id;
      S[k].code = (await admin("select join_code from classrooms where id=$1", [S[k].cls]))[0].join_code;
      S[k].student = await newUser(`Оқушы ${k}`);
      await as(S[k].student.id, (q) => q("select public.join_classroom($1)", [S[k].code]));
    }
  });

  it("мектеп әкімшісі, мұғалім, оқушы өз рөлінде тіркелген", async () => {
    const m = await admin("select role, count(*)::int n from organization_members where org_id=$1 group by role order by role::text", [S.A.org]);
    assert.deepEqual(m.map((x) => [x.role, x.n]), [["school_admin", 1], ["student", 1], ["teacher", 1]]);
  });

  it("МЕКТЕП A қолданушылары МЕКТЕП B деректерін ешбір кестеден көрмейді", async () => {
    const tables = ["organizations", "organization_settings", "licenses", "organization_members", "invitations", "classrooms", "classroom_students",
      "assignments", "assignment_targets", "assignment_questions", "assignment_answer_keys", "assignment_test_cases", "submissions", "submission_results", "grades", "audit_logs"];
    // B мектепте тапсырма мен жұмыс жасаймыз, сонда A көре алмайтынын дәлелдейміз
    const aid = await mkQuiz("B");
    await as(S.B.teacher.id, (q) => q("select public.set_assignment_targets($1, array[$2]::uuid[])", [aid, S.B.cls]));
    await as(S.B.teacher.id, (q) => q("select public.set_assignment_status($1, 'published')", [aid]));
    const sid = (await as(S.B.student.id, (q) => q("select public.save_draft($1, null, $2::jsonb, 5) as id", [aid, "{}"])))[0].id;
    await as(S.B.student.id, (q) => q("select public.submit_assignment($1)", [sid]));
    for (const who of ["admin", "teacher", "student"]) {
      for (const t of tables) {
        const rows = await as(S.A[who].id, (q) => q(`select * from ${t} where org_id = $1`.replace("where org_id", t === "organizations" ? "where id" : "where org_id"), [S.B.org]).catch(() => []));
        assert.equal(rows.length, 0, `A.${who} B-ның ${t} деректерін көріп тұр`);
      }
      const prof = await as(S.A[who].id, (q) => q("select id from profiles where id = any($1)", [[S.B.admin.id, S.B.teacher.id, S.B.student.id]]));
      assert.equal(prof.length, 0, `A.${who} B-ның профильдерін көріп тұр`);
    }
  });

  it("B мектептің сыныбына, тапсырмасына, жұмысына A қолданушысы әсер ете алмайды", async () => {
    const aid = (await admin("select id from assignments where org_id=$1", [S.B.org]))[0].id;
    const sub = (await admin("select id from submissions where org_id=$1", [S.B.org]))[0].id;
    await fails(as(S.A.teacher.id, (q) => q("select public.grade_submission($1, 5, 'x')", [sub])), "forbidden");
    await fails(as(S.A.teacher.id, (q) => q("select public.set_assignment_targets($1, array[$2]::uuid[])", [aid, S.A.cls])), "forbidden");
    await fails(as(S.A.admin.id, (q) => q("select public.create_invitation($1, 'teacher')", [S.B.org])), "forbidden");
    await fails(as(S.A.admin.id, (q) => q("select public.org_overview($1)", [S.B.org])), "forbidden");
    await fails(as(S.A.student.id, (q) => q("select public.save_draft($1, 'x', '{}'::jsonb, 1)", [aid])), "not_found");
    await fails(as(S.A.teacher.id, (q) => q("select public.regenerate_join_code($1)", [S.B.cls])), "forbidden");
    await fails(as(S.A.admin.id, (q) => q("select public.set_member_status($1, $2, 'removed')", [S.B.org, S.B.student.id])), "forbidden");
    await fails(as(S.A.admin.id, (q) => q("select public.set_license($1, 'pro', 999, 99, $2)", [S.B.org, future()])), "forbidden");
  });

  it("клиент рөлі кестелерге тікелей жаза алмайды (тек функциялар арқылы)", async () => {
    await fails(as(S.A.teacher.id, (q) => q("insert into classrooms(org_id, teacher_id, name, academic_year, subject, join_code) values ($1,$2,'x','2025-2026','y','AAAAAAAA')", [S.A.org, S.A.teacher.id])), "permission denied");
    await fails(as(S.A.student.id, (q) => q("update grades set score = 100")), "permission denied");
    await fails(as(S.A.student.id, (q) => q("insert into submissions(org_id, assignment_id, classroom_id, student_id, attempt_no) values (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), $1, 1)", [S.A.student.id])), "permission denied");
    await fails(as(S.A.admin.id, (q) => q("update licenses set max_students = 100000")), "permission denied");
    await fails(as(S.A.admin.id, (q) => q("delete from organizations")), "permission denied");
    await fails(as(S.A.admin.id, (q) => q("insert into platform_admins(user_id) values ($1)", [S.A.admin.id])), "permission denied");
    await fails(as(S.A.student.id, (q) => q("insert into organization_members(org_id,user_id,role) values ($1,$2,'school_admin')", [S.A.org, S.A.student.id])), "permission denied");
    // шақыру токенінің хэшін оқи алмайды
    await fails(as(S.A.admin.id, (q) => q("select token_hash from invitations")), "permission denied");
    // анонимге ештеңе жоқ
    await fails(asAnon((q) => q("select * from organizations")), "permission denied");
    await fails(asAnon((q) => q("select * from profiles")), "permission denied");
  });

  it("SUPER ADMIN жеке деректерді (сынып, жұмыс, баға) көрмейді, тек жиынтық санды көреді", async () => {
    for (const t of ["classrooms", "classroom_students", "assignments", "submissions", "grades", "organization_members"]) {
      const r = await as(S.root.id, (q) => q(`select count(*)::int n from ${t}`));
      assert.equal(r[0].n, 0, `SUPER ADMIN ${t} көріп тұр`);
    }
    const u = await as(S.root.id, (q) => q("select * from platform_usage() order by slug"));
    assert.equal(u.length, 2);
    assert.equal(u[0].students, "1");
    await fails(as(S.A.admin.id, (q) => q("select * from platform_usage()")), "forbidden");
    // аудитті көреді
    const logs = await as(S.root.id, (q) => q("select count(*)::int n from audit_logs"));
    assert.ok(logs[0].n > 5);
  });

  it("оқушы тест жауабын және жасырын тест жағдайларын көрмейді; өз жұмысын ғана көреді", async () => {
    const aid = await mkQuiz("A", { code: true });
    await as(S.A.teacher.id, (q) => q("select public.set_assignment_targets($1, array[$2]::uuid[])", [aid, S.A.cls]));
    await as(S.A.teacher.id, (q) => q("select public.set_assignment_status($1, 'published')", [aid]));
    S.A.quiz = aid;
    assert.equal((await as(S.A.student.id, (q) => q("select * from assignment_questions where assignment_id=$1", [aid]))).length, 2);
    assert.equal((await as(S.A.student.id, (q) => q("select * from assignment_answer_keys"))).length, 0);
    assert.equal((await as(S.A.teacher.id, (q) => q("select * from assignment_answer_keys"))).length, 2);
    const tc = await as(S.A.student.id, (q) => q("select is_hidden from assignment_test_cases where assignment_id=$1", [aid]));
    assert.deepEqual(tc.map((r) => r.is_hidden), [false]);
    // қара тақырыпты (draft) тапсырманы оқушы көрмейді
    const d = await mkQuiz("A");
    assert.equal((await as(S.A.student.id, (q) => q("select * from assignments where id=$1", [d]))).length, 0);
    // екінші оқушы біріншінің жұмысын көрмейді
    const s2 = await newUser("Оқушы A2");
    await as(s2.id, (q) => q("select public.join_classroom($1)", [S.A.code]));
    await as(S.A.student.id, (q) => q("select public.save_draft($1, null, '{}'::jsonb, 3)", [aid]));
    assert.equal((await as(s2.id, (q) => q("select * from submissions"))).length, 0);
    assert.equal((await as(S.A.student.id, (q) => q("select * from submissions"))).length, 1);
    // оқушы бірін-бірі профильден көрмейді
    assert.equal((await as(s2.id, (q) => q("select id from profiles where id=$1", [S.A.student.id]))).length, 0);
    S.A.student2 = s2;
  });

  it("тест автоматты бағаланады; қайта тапсыру және мерзім/әрекет шектері жұмыс істейді", async () => {
    const aid = S.A.quiz;
    const qs = await as(S.A.student.id, (q) => q("select id from assignment_questions where assignment_id=$1 order by position", [aid]));
    // 1-сұрақ дұрыс (индекс 1), 2-сұрақ қате
    const answers = { [qs[0].id]: 1, [qs[1].id]: 0 };
    const sid = (await as(S.A.student.id, (q) => q("select public.save_draft($1, null, $2::jsonb, 90) as id", [aid, JSON.stringify(answers)])))[0].id;
    const r = (await as(S.A.student.id, (q) => q("select public.submit_assignment($1) as r", [sid])))[0].r;
    assert.equal(r.status, "graded"); assert.equal(Number(r.score), 50); assert.equal(r.passed, 1); assert.equal(r.total, 2);
    await fails(as(S.A.student.id, (q) => q("select public.submit_assignment($1)", [sid])), "already_submitted");
    const g = await as(S.A.student.id, (q) => q("select score, source from grades"));
    assert.equal(Number(g[0].score), 50); assert.equal(g[0].source, "auto");
    // 2-әрекет (max_attempts=2), 3-ші жоқ
    const sid2 = (await as(S.A.student.id, (q) => q("select public.save_draft($1, null, $2::jsonb, 30) as id", [aid, JSON.stringify({ [qs[0].id]: 1, [qs[1].id]: 2 })])))[0].id;
    const r2 = (await as(S.A.student.id, (q) => q("select public.submit_assignment($1) as r", [sid2])))[0].r;
    assert.equal(Number(r2.score), 100);
    await fails(as(S.A.student.id, (q) => q("select public.save_draft($1, null, '{}'::jsonb, 1)", [aid])), "attempts_exhausted");
    // ең үздік баға көрсетіледі
    const my = await as(S.A.student.id, (q) => q("select status, best_score, attempts_used from my_assignments() where assignment_id=$1", [aid]));
    assert.equal(my[0].status, "graded"); assert.equal(Number(my[0].best_score), 100); assert.equal(my[0].attempts_used, "2");
  });

  it("мерзімі өткен тапсырма қабылданбайды (серверде), allow_late болса қабылданады", async () => {
    const aid = await mkCode("A", { deadline: new Date(Date.now() + 1500).toISOString() });
    await as(S.A.teacher.id, (q) => q("select public.set_assignment_targets($1, array[$2]::uuid[])", [aid, S.A.cls]));
    await as(S.A.teacher.id, (q) => q("select public.set_assignment_status($1, 'published')", [aid]));
    const sid = (await as(S.A.student2.id, (q) => q("select public.save_draft($1, 'print(1)', '{}'::jsonb, 5) as id", [aid])))[0].id;
    await new Promise((r) => setTimeout(r, 1800));
    await fails(as(S.A.student2.id, (q) => q("select public.submit_assignment($1)", [sid])), "deadline_passed");
    await fails(as(S.A.student2.id, (q) => q("select public.save_draft($1, 'print(2)', '{}'::jsonb, 5)", [aid])), "deadline_passed");
    const st = (await as(S.A.student2.id, (q) => q("select status from my_assignments() where assignment_id=$1", [aid])))[0].status;
    assert.equal(st, "overdue");
    await as(S.A.teacher.id, (q) => q("select public.upsert_assignment($1::jsonb)", [JSON.stringify({ id: aid, title: "Мерзімді тапсырма", kind: "python", allow_late: true, deadline: new Date(Date.now() - 1000).toISOString() })]));
    const ok = (await as(S.A.student2.id, (q) => q("select public.submit_assignment($1) as r", [sid])))[0].r;
    assert.equal(ok.status, "submitted");
  });

  it("код тапсырмасын мұғалім қолмен бағалайды; басқа мұғалім/оқушы бағалай алмайды", async () => {
    const aid = (await admin("select id from assignments where title='Мерзімді тапсырма'"))[0].id;
    const sub = (await admin("select id from submissions where assignment_id=$1", [aid]))[0].id;
    await fails(as(S.A.student2.id, (q) => q("select public.grade_submission($1, 90, 'мен өзім')", [sub])), "forbidden");
    const other = await newUser("Мұғалім A2");
    const t = await as(S.A.admin.id, (q) => q("select public.create_invitation($1, 'teacher') as t", [S.A.org]));
    await as(other.id, (q) => q("select public.accept_invitation($1)", [t[0].t]));
    await fails(as(other.id, (q) => q("select public.grade_submission($1, 90, 'бөтен')", [sub])), "forbidden");
    assert.equal((await as(other.id, (q) => q("select * from submissions"))).length, 0, "басқа мұғалім жұмысты көріп тұр");
    await fails(as(S.A.teacher.id, (q) => q("select public.grade_submission($1, 101, 'көп')", [sub])), "invalid_score");
    await as(S.A.teacher.id, (q) => q("select public.begin_review($1)", [sub]));
    assert.equal((await as(S.A.teacher.id, (q) => q("select status from submissions where id=$1", [sub])))[0].status, "under_review");
    await as(S.A.teacher.id, (q) => q("select public.grade_submission($1, 85, 'Жақсы, бірақ түсініктеме жетпейді')", [sub]));
    const g = await as(S.A.student2.id, (q) => q("select score, feedback, source from grades where submission_id=$1", [sub]));
    assert.equal(Number(g[0].score), 85); assert.match(g[0].feedback, /Жақсы/); assert.equal(g[0].source, "manual");
    // жұмыс түскеннен кейін тапсырма құрылымы қатып қалады
    await fails(as(S.A.teacher.id, (q) => q("select public.upsert_assignment($1::jsonb)", [JSON.stringify({ id: aid, title: "Өзгерген атау", kind: "python", test_cases: [] })])), "assignment_locked");
  });

  it("шақыру: жарамсыз токен, қайталау, e-mail сәйкессіздігі, мұғалім лимиті", async () => {
    const u = await newUser("Кездейсоқ");
    await fails(as(u.id, (q) => q("select public.accept_invitation('жалған')")), "invite_invalid");
    const mailed = await newUser("Мұғалім Нұр", "nur@test.kz");
    const tok = (await as(S.A.admin.id, (q) => q("select public.create_invitation($1, 'teacher', 'nur@test.kz') as t", [S.A.org])))[0].t;
    await fails(as(u.id, (q) => q("select public.accept_invitation($1)", [tok])), "invite_email_mismatch");
    await as(mailed.id, (q) => q("select public.accept_invitation($1)", [tok]));
    await fails(as(mailed.id, (q) => q("select public.accept_invitation($1)", [tok])), "invite_invalid");
    // мұғалім шақыра алмайды
    await fails(as(S.A.teacher.id, (q) => q("select public.create_invitation($1, 'teacher')", [S.A.org])), "forbidden");
    // оқушы шақыру арқылы мұғалім бола алмайды (рөл қақтығысы)
    const tok2 = (await as(S.A.admin.id, (q) => q("select public.create_invitation($1, 'teacher') as t", [S.A.org])))[0].t;
    await fails(as(S.A.student.id, (q) => q("select public.accept_invitation($1)", [tok2])), "role_conflict");
    // starter: 5 мұғалімге дейін (қазір 3: A, A2, Нұр) - екеуін қосып, алтыншысы қабылданбайды
    for (let i = 0; i < 2; i++) {
      const x = await newUser(`Қосымша ${i}`);
      const tk = (await as(S.A.admin.id, (q) => q("select public.create_invitation($1, 'teacher') as t", [S.A.org])))[0].t;
      await as(x.id, (q) => q("select public.accept_invitation($1)", [tk]));
    }
    const y = await newUser("Артық");
    const tk = (await as(S.A.admin.id, (q) => q("select public.create_invitation($1, 'teacher') as t", [S.A.org])))[0].t;
    await fails(as(y.id, (q) => q("select public.accept_invitation($1)", [tk])), "teacher_limit_reached");
  });

  it("сыныпқа қосылу: жарамсыз код, лимиттер, қайта қосылу, кодты жаңарту", async () => {
    const u = await newUser("Жаңа оқушы");
    await fails(as(u.id, (q) => q("select public.join_classroom('ZZZZZZZZ')")), "invalid_code");
    // мұғалім өз мектебінің сыныбына оқушы болып қосыла алмайды (рөл қақтығысы)
    await fails(as(S.A.teacher.id, (q) => q("select public.join_classroom($1)", [S.A.code])), "role_conflict");
    // бірақ басқа мектепте оқушы бола алады, және бұл оған өз мектебінде құқық бермейді
    await as(S.A.teacher.id, (q) => q("select public.join_classroom($1)", [S.B.code]));
    assert.equal((await as(S.A.teacher.id, (q) => q("select role from organization_members where user_id=$1 and org_id=$2", [S.A.teacher.id, S.B.org])))[0].role, "student");
    await fails(as(S.A.teacher.id, (q) => q("select public.create_classroom($1,'х','2025-2026','у')", [S.B.org])), "forbidden");
  });
});

describe("лицензия", () => {
  it("мерзімі өткен лицензия: жаңа сынып/тапсырма/қосылу бұғатталады, оқу және жұмыс тапсыру сақталады", async () => {
    await admin("update licenses set valid_from = $3, valid_until = $1 where org_id=$2", [past(), S.B.org, past(30)]);
    await fails(as(S.B.teacher.id, (q) => q("select public.create_classroom($1,'Жаңа','2025-2026','Пән')", [S.B.org])), "license_expired");
    await fails(as(S.B.teacher.id, (q) => q("select public.upsert_assignment($1::jsonb)", [JSON.stringify({ org_id: S.B.org, title: "Жаңа", kind: "python" })])), "license_expired");
    const nu = await newUser("Мерзімі өткен оқушы");
    await fails(as(nu.id, (q) => q("select public.join_classroom($1)", [S.B.code])), "license_expired");
    // дерек оқылады, ештеңе өшпейді
    assert.equal((await as(S.B.admin.id, (q) => q("select count(*)::int n from classrooms")))[0].n, 1);
    assert.equal((await as(S.B.admin.id, (q) => q("select public.org_overview($1) as o", [S.B.org])))[0].o.students, 2); // B оқушысы + A мұғалімі (ол B-де оқушы болып қосылған)
    const st = await as(S.B.teacher.id, (q) => q("select public.license_state($1) as s", [S.B.org]));
    assert.equal(st[0].s, "expired");
    // оқушы бұрын берілген тапсырманы әлі тапсыра алады (құрметті кезең)
    const aid = (await admin("select id from assignments where org_id=$1", [S.B.org]))[0].id;
    await as(S.B.student.id, (q) => q("select public.save_draft($1, null, '{}'::jsonb, 5)", [aid])).catch((e) => assert.match(e.message, /attempts|not_found/));
  });

  it("лицензия тоқтатылса/ұйым тоқтатылса: тапсыру да бұғатталады; SUPER ADMIN қайта белсендіреді", async () => {
    await admin("update licenses set valid_until = $1 where org_id=$2", [future(), S.A.org]);
    await as(S.root.id, (q) => q("select public.set_org_status($1, 'suspended')", [S.A.org]));
    const aid = await mkCode("A", {}).catch((e) => e.message);
    assert.equal(aid, "license_expired"); // org_suspended -> license_ok false
    await fails(as(S.A.student.id, (q) => q("select public.join_classroom($1)", [S.A.code])), "license_expired");
    await as(S.root.id, (q) => q("select public.set_org_status($1, 'active')", [S.A.org]));
    assert.equal((await as(S.A.teacher.id, (q) => q("select public.license_state($1) as s", [S.A.org])))[0].s, "active");
    await fails(as(S.A.admin.id, (q) => q("select public.set_org_status($1, 'suspended')", [S.A.org])), "forbidden");
  });

  it("оқушы лимиті: STARTER 100 (тест үшін 2-ге түсіреміз)", async () => {
    await as(S.root.id, (q) => q("select public.set_license($1, 'starter', 2, 5, $2)", [S.A.org, future()]));
    const x = await newUser("Үшінші оқушы");
    await fails(as(x.id, (q) => q("select public.join_classroom($1)", [S.A.code])), "student_limit_reached");
    await as(S.root.id, (q) => q("select public.set_license($1, 'starter', 100, 5, $2)", [S.A.org, future()]));
    await as(x.id, (q) => q("select public.join_classroom($1)", [S.A.code]));
    // сынып лимиті
    await as(S.A.teacher.id, (q) => q("select public.update_classroom($1,'9А','2025-2026','Информатика',null,3,true,false)", [S.A.cls]));
    const y = await newUser("Төртінші оқушы");
    await fails(as(y.id, (q) => q("select public.join_classroom($1)", [S.A.code])), "class_full");
    // кодты өшіру/жаңарту
    await as(S.A.teacher.id, (q) => q("select public.update_classroom($1,'9А','2025-2026','Информатика',null,null,false,false)", [S.A.cls]));
    await fails(as(y.id, (q) => q("select public.join_classroom($1)", [S.A.code])), "invalid_code");
    const nc = (await as(S.A.teacher.id, (q) => q("select public.regenerate_join_code($1) as c", [S.A.cls])))[0].c;
    assert.match(nc, /^[A-HJ-NP-Z2-9]{8}$/); assert.notEqual(nc, S.A.code);
  });
});

describe("аналитика және аудит", () => {
  it("мектеп статистикасы нақты деректерден есептеледі, мұғалім мектеп статистикасын шақыра алмайды", async () => {
    const o = (await as(S.A.admin.id, (q) => q("select public.org_overview($1) as o", [S.A.org])))[0].o;
    assert.equal(o.teachers, 5); // starter лимиті: 5 assert.ok(o.students >= 3);
    assert.ok(o.completed >= 2); assert.ok(o.graded >= 2);
    assert.equal(Number(o.avg_score_pct) > 0, true);
    await fails(as(S.A.teacher.id, (q) => q("select public.org_overview($1)", [S.A.org])), "forbidden");
    const act = await as(S.A.admin.id, (q) => q("select * from activity_series($1, 7)", [S.A.org]));
    assert.equal(act.length, 7);
    assert.ok(act.some((r) => Number(r.submissions) > 0));
    const cs = await as(S.A.teacher.id, (q) => q("select * from class_students_overview($1)", [S.A.cls]));
    assert.ok(cs.length >= 2); assert.ok(cs.some((r) => Number(r.avg_pct) === 100));
    await fails(as(S.A.student.id, (q) => q("select * from class_students_overview($1)", [S.A.cls])), "forbidden");
    const dist = await as(S.A.teacher.id, (q) => q("select * from class_grade_distribution($1)", [S.A.cls]));
    assert.equal(dist.length, 4);
  });

  it("аудит журналын тек мектеп әкімшісі (өз мектебі) және SUPER ADMIN көреді", async () => {
    assert.ok((await as(S.A.admin.id, (q) => q("select count(*)::int n from audit_logs")))[0].n > 5);
    assert.equal((await as(S.A.teacher.id, (q) => q("select count(*)::int n from audit_logs")))[0].n, 0);
    assert.equal((await as(S.A.student.id, (q) => q("select count(*)::int n from audit_logs")))[0].n, 0);
    const own = await as(S.A.admin.id, (q) => q("select distinct org_id from audit_logs"));
    assert.ok(own.every((r) => r.org_id === S.A.org));
  });
});

// ---------- құрал-саймандар ----------
async function mkQuiz(k, { code = false } = {}) {
  const p = {
    org_id: S[k].org, title: "Қысқа тест", description: "2 сұрақ", kind: "quiz", max_score: 100, max_attempts: 2,
    questions: [
      { prompt: "2 + 2 = ?", options: ["3", "4", "5"], correct_index: 1, explanation: "Төрт", points: 1 },
      { prompt: "Python-да тізім:", options: ["{}", "()", "[]"], correct_index: 2, points: 1 },
    ],
  };
  if (code) p.test_cases = [{ input: "1", expected_output: "1", is_hidden: false }, { input: "2", expected_output: "4", is_hidden: true }];
  return (await as(S[k].teacher.id, (q) => q("select public.upsert_assignment($1::jsonb) as id", [JSON.stringify(p)])))[0].id;
}
async function mkCode(k, extra = {}) {
  return (await as(S[k].teacher.id, (q) => q("select public.upsert_assignment($1::jsonb) as id", [JSON.stringify({ org_id: S[k].org, title: "Код тапсырмасы", kind: "python", starter_code: "# сіздің кодыңыз", ...extra })])))[0].id;
}
