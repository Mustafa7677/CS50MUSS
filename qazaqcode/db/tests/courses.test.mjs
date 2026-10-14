// QazaqCode: курс конструкторы, прогресс, хабарландырулар және жаңа аналитика тесттері (нақты PostgreSQL + RLS).
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { pool, admin, as, fails, newUser, reset, future } from "./helpers.mjs";

const S = {};
after(() => pool.end());

async function mkSchool(k) {
  const r = await as(S.root.id, (q) => q("select public.create_organization($1, $2, 'starter', $3) as r", [`Мектеп ${k}`, `c-${k.toLowerCase()}`, future()]));
  S[k] = { org: r[0].r.org_id };
  S[k].admin = await newUser(`Әкімші ${k}`);
  await as(S[k].admin.id, (q) => q("select public.accept_invitation($1)", [r[0].r.admin_invite_token]));
  const t = await as(S[k].admin.id, (q) => q("select public.create_invitation($1, 'teacher') as t", [S[k].org]));
  S[k].teacher = await newUser(`Мұғалім ${k}`);
  await as(S[k].teacher.id, (q) => q("select public.accept_invitation($1)", [t[0].t]));
  S[k].cls = (await as(S[k].teacher.id, (q) => q("select public.create_classroom($1, '9А', '2025-2026', 'Информатика') as id", [S[k].org])))[0].id;
  const code = (await admin("select join_code from classrooms where id=$1", [S[k].cls]))[0].join_code;
  S[k].student = await newUser(`Оқушы ${k}`);
  await as(S[k].student.id, (q) => q("select public.join_classroom($1)", [code]));
}

const structure = (extra = {}) => ({
  modules: [
    { title: "Кіріспе", lessons: [
      { title: "Айнымалылар", blocks: [{ type: "text", content: "Айнымалы - атау." }, { type: "code", language: "python", content: "x = 1\nprint(x)" }] },
      { title: "Видео", blocks: [{ type: "video", content: "https://example.com/v.mp4", caption: "Қысқа" }] },
    ] },
    { title: "Циклдер", lessons: [{ title: "for циклі", blocks: [{ type: "note", content: "Назар аударыңыз" }], ...extra }] },
  ],
});
const save = (who, course, st) => as(who, (q) => q("select public.save_course_structure($1, $2::jsonb)", [course, JSON.stringify(st)]));

describe("курс конструкторы", () => {
  before(async () => {
    await reset();
    S.root = await newUser("Платформа Әкімші");
    await admin("insert into platform_admins(user_id) values ($1)", [S.root.id]);
    await mkSchool("A"); await mkSchool("B");
    S.course = (await as(S.A.teacher.id, (q) => q("select public.create_course($1, 'Python негіздері', 'Бастаушыларға') as id", [S.A.org])))[0].id;
  });

  it("құрылым сақталады: модульдер, сабақтар, блоктар, реті", async () => {
    await save(S.A.teacher.id, S.course, structure());
    const rows = await as(S.A.teacher.id, (q) => q("select m.title mt, l.title lt, jsonb_array_length(l.blocks) nb from lessons l join course_modules m on m.id = l.module_id where l.course_id = $1 order by m.position, l.position", [S.course]));
    assert.deepEqual(rows.map((r) => [r.mt, r.lt, r.nb]), [["Кіріспе", "Айнымалылар", 2], ["Кіріспе", "Видео", 1], ["Циклдер", "for циклі", 1]]);
  });

  it("қайта сақтағанда id сақталады, жойылған сабақ өшеді, ретті ауыстыру жұмыс істейді", async () => {
    const before = await as(S.A.teacher.id, (q) => q("select m.id mid, m.title mt, l.id lid, l.title lt from lessons l join course_modules m on m.id=l.module_id where l.course_id=$1 order by m.position, l.position", [S.course]));
    const st = { modules: [
      { id: before[2].mid, title: "Циклдер", lessons: [{ id: before[2].lid, title: "for циклі", blocks: [] }] },
      { id: before[0].mid, title: "Кіріспе", lessons: [{ id: before[0].lid, title: "Айнымалылар", blocks: [] }] },
    ] };
    await save(S.A.teacher.id, S.course, st);
    const after = await as(S.A.teacher.id, (q) => q("select m.title mt, l.id lid from lessons l join course_modules m on m.id=l.module_id where l.course_id=$1 order by m.position, l.position", [S.course]));
    assert.deepEqual(after.map((r) => r.mt), ["Циклдер", "Кіріспе"]);
    assert.equal(after[1].lid, before[0].lid);
    await save(S.A.teacher.id, S.course, structure());
  });

  it("жарамсыз блок, қауіпті сілтеме, тым үлкен мазмұн қабылданбайды", async () => {
    const bad = (blocks) => ({ modules: [{ title: "М", lessons: [{ title: "С", blocks }] }] });
    await fails(save(S.A.teacher.id, S.course, bad([{ type: "script", content: "x" }])), "invalid_block");
    await fails(save(S.A.teacher.id, S.course, bad([{ type: "image", content: "javascript:alert(1)" }])), "invalid_block");
    await fails(save(S.A.teacher.id, S.course, bad([{ type: "video", content: "http://insecure.example/v" }])), "invalid_block");
    await fails(save(S.A.teacher.id, S.course, bad([{ type: "code", language: "bash", content: "ls" }])), "invalid_block");
    await fails(save(S.A.teacher.id, S.course, bad([{ type: "text", content: "x".repeat(20001) }])), "too_large");
    await fails(save(S.A.teacher.id, S.course, { modules: "x" }), "invalid_input");
    await fails(save(S.A.teacher.id, S.course, { modules: [{ title: "", lessons: [] }] }), "invalid_input");
  });

  it("басқа мектеп/рөл курсті көре де, өзгерте де алмайды; тікелей жазу жабық", async () => {
    await fails(save(S.B.teacher.id, S.course, structure()), "forbidden");
    await fails(as(S.B.admin.id, (q) => q("select public.set_course_status($1, 'archived')", [S.course])), "forbidden");
    await fails(as(S.A.student.id, (q) => q("select public.update_course_info($1, 'x', 'y')", [S.course])), "forbidden");
    for (const w of [S.B.teacher, S.B.admin, S.A.student]) {
      assert.equal((await as(w.id, (q) => q("select id from courses where id=$1", [S.course]))).length, 0, "жоба курсі көрінбеуі керек");
    }
    await fails(as(S.A.teacher.id, (q) => q("update courses set status='published' where id=$1", [S.course])), "permission denied");
    await fails(as(S.A.teacher.id, (q) => q("insert into lessons(org_id, course_id, module_id, title, position) select org_id, course_id, id, 'x', 9 from course_modules limit 1")), "permission denied");
    // екінші мұғалім (сол мектеп) өзге мұғалімнің жобасын өзгерте алмайды, әкімші алады
    const t = await as(S.A.admin.id, (q) => q("select public.create_invitation($1, 'teacher') as t", [S.A.org]));
    S.A.t2 = await newUser("Мұғалім A2");
    await as(S.A.t2.id, (q) => q("select public.accept_invitation($1)", [t[0].t]));
    await fails(save(S.A.t2.id, S.course, structure()), "forbidden");
    await save(S.A.admin.id, S.course, structure());
  });

  it("жариялау: бос курс/сыныпсыз курс жарияланбайды; сынып бекітілгесін оқушы көреді", async () => {
    const empty = (await as(S.A.teacher.id, (q) => q("select public.create_course($1, 'Бос') as id", [S.A.org])))[0].id;
    await fails(as(S.A.teacher.id, (q) => q("select public.set_course_status($1, 'published')", [empty])), "course_empty");
    await fails(as(S.A.teacher.id, (q) => q("select public.set_course_status($1, 'published')", [S.course])), "no_targets");
    await fails(as(S.A.teacher.id, (q) => q("select public.set_course_targets($1, array[$2]::uuid[])", [S.course, S.B.cls])), "not_found");
    await as(S.A.teacher.id, (q) => q("select public.set_course_targets($1, array[$2]::uuid[])", [S.course, S.A.cls]));
    await as(S.A.teacher.id, (q) => q("select public.set_course_status($1, 'published')", [S.course]));
    assert.equal((await as(S.A.student.id, (q) => q("select id from courses where id=$1", [S.course]))).length, 1);
    assert.equal((await as(S.A.student.id, (q) => q("select id from lessons where course_id=$1", [S.course]))).length, 3);
    assert.equal((await as(S.B.student.id, (q) => q("select id from courses"))).length, 0);
    const n = await as(S.A.student.id, (q) => q("select title from notifications"));
    assert.ok(n.some((x) => x.title.startsWith("Жаңа курс")));
  });

  it("сабақ прогресі: оқушы тек өз курсында аяқтайды, басқаның прогресін көрмейді", async () => {
    const lessons = await as(S.A.student.id, (q) => q("select id from lessons where course_id=$1 order by position", [S.course]));
    await as(S.A.student.id, (q) => q("select public.complete_lesson($1)", [lessons[0].id]));
    await as(S.A.student.id, (q) => q("select public.complete_lesson($1)", [lessons[0].id])); // қайталау қауіпсіз
    await fails(as(S.B.student.id, (q) => q("select public.complete_lesson($1)", [lessons[0].id])), "not_found");
    const mine = await as(S.A.student.id, (q) => q("select * from my_courses()"));
    assert.equal(Number(mine[0].completed), 1); assert.equal(Number(mine[0].total), 3);
    const prog = await as(S.A.teacher.id, (q) => q("select * from course_progress($1)", [S.course]));
    assert.equal(prog.length, 1); assert.equal(Number(prog[0].completed), 1);
    await fails(as(S.A.student.id, (q) => q("select * from course_progress($1)", [S.course])), "forbidden");
    await fails(as(S.B.teacher.id, (q) => q("select * from course_progress($1)", [S.course])), "forbidden");
  });

  it("көшірме: жоба күйінде, сыныпсыз, прогрессіз; архивтелген курс оқушыға көрінбейді", async () => {
    const copy = (await as(S.A.teacher.id, (q) => q("select public.duplicate_course($1) as id", [S.course])))[0].id;
    const c = (await as(S.A.teacher.id, (q) => q("select status, (select count(*) from lessons where course_id=c.id)::int n, (select count(*) from course_targets where course_id=c.id)::int t from courses c where id=$1", [copy])))[0];
    assert.deepEqual([c.status, c.n, c.t], ["draft", 3, 0]);
    await fails(as(S.B.teacher.id, (q) => q("select public.duplicate_course($1)", [S.course])), "forbidden");
    await as(S.A.teacher.id, (q) => q("select public.set_course_status($1, 'archived')", [S.course]));
    assert.equal((await as(S.A.student.id, (q) => q("select id from courses where id=$1", [S.course]))).length, 0);
    await fails(as(S.A.student.id, (q) => q("select public.complete_lesson((select id from lessons where course_id=$1 limit 1))", [S.course])), "not_found");
    await as(S.A.teacher.id, (q) => q("select public.set_course_status($1, 'published')", [S.course]));
  });

  it("лицензия біткенде жаңа курс жасалмайды/жарияланбайды, бар курс оқылады", async () => {
    await admin("update licenses set valid_until = current_date - 1, valid_from = current_date - 400 where org_id=$1", [S.B.org]);
    await fails(as(S.B.teacher.id, (q) => q("select public.create_course($1, 'Жаңа')", [S.B.org])), "license_expired");
    await admin("update licenses set valid_until = current_date + 365 where org_id=$1", [S.B.org]);
  });

  it("сабаққа тапсырма байланыстыру: тек өз ұйымының басқарылатын тапсырмасы", async () => {
    const mk = (k) => as(S[k].teacher.id, (q) => q("select public.upsert_assignment($1::jsonb) as id", [JSON.stringify({ org_id: S[k].org, title: "Тест", kind: "quiz", max_score: 10, max_attempts: 1, questions: [{ prompt: "1+1", options: ["1", "2"], correct_index: 1, points: 1 }] })]));
    const own = (await mk("A"))[0].id, foreign = (await mk("B"))[0].id;
    await save(S.A.teacher.id, S.course, structure({ assignment_id: own }));
    await fails(save(S.A.teacher.id, S.course, structure({ assignment_id: foreign })), "not_found");
    const l = await as(S.A.teacher.id, (q) => q("select assignment_id from lessons where course_id=$1 and assignment_id is not null", [S.course]));
    assert.equal(l[0].assignment_id, own);
  });
});

describe("хабарландырулар және жаңа аналитика", () => {
  it("тапсырма жарияланғанда оқушыға, жіберілгенде мұғалімге, бағалағанда оқушыға хабарландыру келеді", async () => {
    const aid = (await as(S.A.teacher.id, (q) => q("select public.upsert_assignment($1::jsonb) as id", [JSON.stringify({ org_id: S.A.org, title: "Код жазу", kind: "python", max_score: 20, starter_code: "" })])))[0].id;
    await as(S.A.teacher.id, (q) => q("select public.set_assignment_targets($1, array[$2]::uuid[])", [aid, S.A.cls]));
    await as(S.A.teacher.id, (q) => q("select public.set_assignment_status($1, 'published')", [aid]));
    assert.ok((await as(S.A.student.id, (q) => q("select * from notifications where kind='assignment'"))).length >= 1);
    const sid = (await as(S.A.student.id, (q) => q("select public.save_draft($1, 'print(1)', '{}'::jsonb, 30) as id", [aid])))[0].id;
    await as(S.A.student.id, (q) => q("select public.submit_assignment($1)", [sid]));
    assert.equal((await as(S.A.teacher.id, (q) => q("select * from notifications where kind='submission'"))).length, 1);
    await as(S.A.teacher.id, (q) => q("select public.grade_submission($1, 15, 'жақсы')", [sid]));
    const g = await as(S.A.student.id, (q) => q("select * from notifications where kind='grade'"));
    assert.equal(g.length, 1); assert.match(g[0].link, /^\/student\/assignments\//);
    S.aid = aid;
  });

  it("хабарландыру жеке: басқа қолданушы көрмейді, тек өзін оқылды деп белгілейді", async () => {
    assert.equal((await as(S.B.student.id, (q) => q("select * from notifications where title like '%Баға%'"))).length, 0);
    const other = await as(S.A.teacher.id, (q) => q("select count(*)::int n from notifications where user_id = $1", [S.A.student.id]));
    assert.equal(other[0].n, 0);
    await as(S.A.student.id, (q) => q("select public.mark_notifications_read()"));
    assert.equal((await as(S.A.student.id, (q) => q("select * from notifications where read_at is null"))).length, 0);
    await fails(as(S.A.student.id, (q) => q("insert into notifications(user_id, kind, title) values ($1, 'x', 'y')", [S.A.student.id])), "permission denied");
    await fails(as(S.A.student.id, (q) => q("select public.notify($1, null, 'x', 'y')", [S.A.student.id])), "permission denied");
  });

  it("student_progress: тек өз мұғалімі/әкімші көреді; басқа мектеп/оқушы көрмейді", async () => {
    const rows = await as(S.A.teacher.id, (q) => q("select * from student_progress($1)", [S.A.student.id]));
    assert.ok(rows.length >= 1);
    const row = rows.find((r) => r.assignment_id === S.aid);
    assert.equal(row.status, "graded"); assert.equal(Number(row.best_pct), 75);
    assert.ok((await as(S.A.admin.id, (q) => q("select * from student_progress($1)", [S.A.student.id]))).length >= 1);
    await fails(as(S.B.teacher.id, (q) => q("select * from student_progress($1)", [S.A.student.id])), "forbidden");
    await fails(as(S.B.admin.id, (q) => q("select * from student_progress($1)", [S.A.student.id])), "forbidden");
    await fails(as(S.A.student.id, (q) => q("select * from student_progress($1)", [S.A.student.id])), "forbidden");
  });

  it("class_activity_series және difficult_questions: құқық және нақты есеп", async () => {
    const ser = await as(S.A.teacher.id, (q) => q("select * from class_activity_series($1, 7)", [S.A.cls]));
    assert.equal(ser.length, 7); assert.equal(ser.reduce((a, r) => a + Number(r.submissions), 0), 1);
    await fails(as(S.B.teacher.id, (q) => q("select * from class_activity_series($1, 7)", [S.A.cls])), "forbidden");
    await fails(as(S.A.teacher.id, (q) => q("select * from class_activity_series($1, 0)", [S.A.cls])), "invalid_range");
    const qz = (await as(S.A.teacher.id, (q) => q("select id from assignments where kind='quiz' and org_id=$1 limit 1", [S.A.org])))[0];
    await as(S.A.teacher.id, (q) => q("select public.set_assignment_targets($1, array[$2]::uuid[])", [qz.id, S.A.cls]));
    await as(S.A.teacher.id, (q) => q("select public.set_assignment_status($1, 'published')", [qz.id]));
    const qid = (await as(S.A.teacher.id, (q) => q("select id from assignment_questions where assignment_id=$1", [qz.id])))[0].id;
    const sid = (await as(S.A.student.id, (q) => q("select public.save_draft($1, null, $2::jsonb, 5) as id", [qz.id, JSON.stringify({ [qid]: 0 })])))[0].id;
    await as(S.A.student.id, (q) => q("select public.submit_assignment($1)", [sid]));
    const d = await as(S.A.teacher.id, (q) => q("select * from difficult_questions($1)", [S.A.cls]));
    assert.equal(d.length, 1); assert.equal(Number(d[0].correct_pct), 0);
    await fails(as(S.A.student.id, (q) => q("select * from difficult_questions($1)", [S.A.cls])), "forbidden");
  });
});
