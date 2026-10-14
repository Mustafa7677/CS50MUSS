#!/usr/bin/env node
// Демонстрациялық дерек (ТЕК ТЕСТ ДЕРЕГІ): 1 мектеп, 2 мұғалім, 2 сынып, 20 оқушы, тапсырмалар, жұмыстар, бағалар.
// Қолдану: DATABASE_URL=... node scripts/seed-demo.mjs   (auth_dev шимі бар жергілікті дерекқорға)
// Ұйым is_demo=true болып белгіленеді; құпиясөз барлығына: DemoPass123
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL керек"); process.exit(1); }
const pool = new pg.Pool({ connectionString: url, max: 2 });
const PASS = "DemoPass123";
const q = (s, p = []) => pool.query(s, p).then((r) => r.rows);
async function as(uid, fn) {
  const c = await pool.connect();
  try {
    await c.query("begin"); await c.query("set local role authenticated");
    await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: uid, role: "authenticated" })]);
    const r = await fn((s, p = []) => c.query(s, p).then((x) => x.rows));
    await c.query("commit"); return r;
  } catch (e) { await c.query("rollback").catch(() => {}); throw e; } finally { c.release(); }
}
async function user(email, name) {
  const ex = await q("select id from auth.users where email=$1", [email]);
  if (ex.length) return ex[0].id;
  return (await q("select auth_dev.sign_up($1,$2,$3) as id", [email, PASS, name]))[0].id;
}

const NAMES = ["Аружан Серікқызы", "Нұрсұлтан Бекұлы", "Дана Қайратқызы", "Ерасыл Мұратұлы", "Томирис Асқарқызы", "Алихан Сәкенұлы", "Айгерім Нұрланқызы", "Темірлан Ержанұлы",
  "Жансая Ерболқызы", "Расул Төлегенұлы", "Мөлдір Бауыржанқызы", "Арман Кенжебекұлы", "Аяулым Талғатқызы", "Диас Нұрбекұлы", "Томирис Қанатқызы", "Ислам Рүстемұлы",
  "Сабина Ермекқызы", "Бекзат Жандосұлы", "Аделина Мейрамқызы", "Мирас Дәулетұлы"];

const root = await user("root@demo.qazaqcode.kz", "Платформа Әкімшісі (демо)");
await q("insert into platform_admins(user_id) values ($1) on conflict do nothing", [root]);
const exists = await q("select id from organizations where slug='demo-mektep'");
if (exists.length) { console.log("демо мектеп бар: өзгерту жоқ"); await pool.end(); process.exit(0); }
const valid = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);
const o = (await as(root, (x) => x("select public.create_organization('ДЕМО: №1 Информатика мектебі','demo-mektep','pro',$1) as r", [valid])))[0].r;
await q("update organizations set is_demo = true where id=$1", [o.org_id]);
const admin = await user("admin@demo.qazaqcode.kz", "Гүлнар Әкімші (демо)");
await as(admin, (x) => x("select public.accept_invitation($1)", [o.admin_invite_token]));
const teachers = [];
for (const [email, name] of [["teacher1@demo.qazaqcode.kz", "Айдос Мұғалім (демо)"], ["teacher2@demo.qazaqcode.kz", "Салтанат Мұғалім (демо)"]]) {
  const t = (await as(admin, (x) => x("select public.create_invitation($1,'teacher') as t", [o.org_id])))[0].t;
  const id = await user(email, name); await as(id, (x) => x("select public.accept_invitation($1)", [t])); teachers.push(id);
}
const classes = [];
for (const [i, t] of teachers.entries()) {
  classes.push((await as(t, (x) => x("select public.create_classroom($1,$2,'2025-2026','Информатика','Демо сынып') as id", [o.org_id, i ? "10Ә" : "9А"])))[0].id);
}
const students = [];
for (const [i, n] of NAMES.entries()) {
  const id = await user(`student${i + 1}@demo.qazaqcode.kz`, `${n} (демо)`);
  const code = (await q("select join_code from classrooms where id=$1", [classes[i % 2]]))[0].join_code;
  await as(id, (x) => x("select public.join_classroom($1)", [code])); students.push({ id, cls: i % 2 });
}
const quiz = (t, qs) => ({ org_id: o.org_id, title: t, description: "Демо тест", kind: "quiz", max_score: 100, max_attempts: 3, questions: qs });
const mk = async (teacher, p, cls) => {
  const id = (await as(teacher, (x) => x("select public.upsert_assignment($1::jsonb) as id", [JSON.stringify(p)])))[0].id;
  await as(teacher, (x) => x("select public.set_assignment_targets($1,$2::uuid[])", [id, cls]));
  await as(teacher, (x) => x("select public.set_assignment_status($1,'published')", [id]));
  return id;
};
const q1 = quiz("Айнымалылар: қысқа тест", [
  { prompt: "Python-да x = 5 деген не?", options: ["Салыстыру", "Мән меншіктеу", "Функция"], correct_index: 1, points: 1 },
  { prompt: "type(3.14) нәтижесі?", options: ["int", "str", "float"], correct_index: 2, points: 1 },
  { prompt: "Қайсысы дұрыс айнымалы аты?", options: ["1ат", "my_name", "my-name"], correct_index: 1, points: 1 }]);
const deadline = new Date(Date.now() + 7 * 864e5).toISOString();
const a1 = await mk(teachers[0], { ...q1, deadline }, [classes[0]]);
const a2 = await mk(teachers[1], { ...q1, deadline }, [classes[1]]);
const a3 = await mk(teachers[0], { org_id: o.org_id, title: "Факториал функциясы", description: "factorial(n) функциясын жазыңыз: n! қайтарсын.", kind: "python", max_score: 100,
  starter_code: "def factorial(n):\n    pass\n", deadline, test_cases: [{ input: "5", expected_output: "120" }, { input: "0", expected_output: "1" }, { input: "7", expected_output: "5040", is_hidden: true }] }, [classes[0]]);
const a4 = await mk(teachers[1], { org_id: o.org_id, title: "SELECT сұрауы", description: "Кестеден жасы 15-тен үлкен оқушыларды таңдаңыз.", kind: "sql", max_score: 100, deadline }, [classes[1]]);
// оқушылардың жұмыстары (жартысы тапсырған, бір бөлігі бағаланған)
for (const [i, s] of students.entries()) {
  const qa = s.cls ? a2 : a1;
  if (i % 4 === 3) continue; // кейбіреулер бастамаған
  const qs = await as(s.id, (x) => x("select id from assignment_questions where assignment_id=$1 order by position", [qa]));
  const ans = {}; qs.forEach((r, j) => (ans[r.id] = i % 3 === 0 && j === 0 ? 0 : [1, 2, 1][j]));
  const sid = (await as(s.id, (x) => x("select public.save_draft($1,null,$2::jsonb,$3) as id", [qa, JSON.stringify(ans), 120 + i * 7])))[0].id;
  await as(s.id, (x) => x("select public.submit_assignment($1)", [sid]));
  if (!s.cls && i % 2 === 0) {
    const code = `def factorial(n):\n    r = 1\n    for k in range(2, n + 1):\n        r *= k\n    return r\n`;
    const cid = (await as(s.id, (x) => x("select public.save_draft($1,$2,'{}'::jsonb,$3) as id", [a3, code, 300 + i * 11])))[0].id;
    await as(s.id, (x) => x("select public.submit_assignment($1)", [cid]));
    if (i % 4 === 0) await as(teachers[0], (x) => x("select public.grade_submission($1,$2,$3)", [cid, 80 + (i % 20), "Жақсы шешім. Бос жолдарды үйреніңіз."]));
  }
}
console.log("демо дерек дайын. Кіру (құпиясөз DemoPass123): root@demo.qazaqcode.kz, admin@, teacher1@, teacher2@, student1@ ... @demo.qazaqcode.kz");
await pool.end();
