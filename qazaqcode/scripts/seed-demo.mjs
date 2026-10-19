#!/usr/bin/env node
// Демонстрациялық дерек (ТЕК ТЕСТ ДЕРЕГІ, барлығы ойдан құрастырылған):
// 1 мектеп (is_demo), 2 мұғалім, 2 сынып, 20 оқушы, 3 курс (өз мазмұнымыз), 10 тапсырма, әртүрлі нәтижелер, хабарландырулар.
// Қолдану: DATABASE_URL=... node scripts/seed-demo.mjs [--reset]
//   Қайталап іске қосуға қауіпсіз: бар нәрсені (мектеп, адам, сынып, тапсырма, курс) қайта жасамайды, жоқтарын толықтырады.
//   --reset (не DEMO_RESET=1): алдымен демо мектепті және @demo.qazaqcode.kz аккаунттарын толық өшіріп, қайта жасайды.
// Құпиясөз барлығына: DemoPass123
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL керек"); process.exit(1); }
const RESET = process.argv.includes("--reset") || process.env.DEMO_RESET === "1";
const pool = new pg.Pool({ connectionString: url, max: 2 });
const PASS = "DemoPass123";
const SLUG = "demo-mektep";
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
const day = (n) => new Date(Date.now() + n * 864e5).toISOString();
const log = (...a) => console.log("  ·", ...a);

const NAMES = ["Аружан Серікқызы", "Нұрсұлтан Бекұлы", "Дана Қайратқызы", "Ерасыл Мұратұлы", "Томирис Асқарқызы", "Алихан Сәкенұлы", "Айгерім Нұрланқызы", "Темірлан Ержанұлы",
  "Жансая Ерболқызы", "Расул Төлегенұлы", "Мөлдір Бауыржанқызы", "Арман Кенжебекұлы", "Аяулым Талғатқызы", "Диас Нұрбекұлы", "Томирис Қанатқызы", "Ислам Рүстемұлы",
  "Сабина Ермекқызы", "Бекзат Жандосұлы", "Аделина Мейрамқызы", "Мирас Дәулетұлы"];

// ---------- тазалау ----------
if (RESET) {
  const o = await q("select id from organizations where slug=$1", [SLUG]);
  if (o.length) await q("delete from organizations where id=$1", [o[0].id]);
  await q("delete from auth.users where email like '%@demo.qazaqcode.kz'");
  console.log("демо дерек өшірілді (--reset)");
}

// ---------- мектеп, адамдар ----------
const root = await user("root@demo.qazaqcode.kz", "Платформа Әкімшісі (демо)");
await q("insert into platform_admins(user_id) values ($1) on conflict do nothing", [root]);
const valid = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);
let org = (await q("select id from organizations where slug=$1", [SLUG]))[0]?.id;
let adminToken = null;
if (!org) {
  const o = (await as(root, (x) => x("select public.create_organization('ДЕМО: №1 Информатика мектебі',$1,'pro',$2) as r", [SLUG, valid])))[0].r;
  org = o.org_id; adminToken = o.admin_invite_token; log("мектеп жасалды");
} else log("демо мектеп бар: толықтырамыз (жоғы ғана қосылады)");
await q("update organizations set is_demo = true where id=$1", [org]);
await q("update organization_settings set welcome_text = coalesce(welcome_text, 'ДЕМО: бұл сынақ мектебі, барлық дерек ойдан құрастырылған.') where org_id=$1", [org]);

const admin = await user("admin@demo.qazaqcode.kz", "Гүлнар Әкімші (демо)");
const isMember = async (uid) => (await q("select 1 from organization_members where org_id=$1 and user_id=$2 and status='active'", [org, uid])).length > 0;
if (!(await isMember(admin))) {
  const tok = adminToken ?? (await as(root, (x) => x("select public.create_invitation($1,'school_admin') as t", [org])))[0].t;
  await as(admin, (x) => x("select public.accept_invitation($1)", [tok]));
}
const teachers = [];
for (const [email, name] of [["teacher1@demo.qazaqcode.kz", "Айдос Мұғалім (демо)"], ["teacher2@demo.qazaqcode.kz", "Салтанат Мұғалім (демо)"]]) {
  const id = await user(email, name);
  if (!(await isMember(id))) {
    const t = (await as(admin, (x) => x("select public.create_invitation($1,'teacher') as t", [org])))[0].t;
    await as(id, (x) => x("select public.accept_invitation($1)", [t]));
  }
  teachers.push(id);
}
const classes = [];
for (const [i, t] of teachers.entries()) {
  const name = i ? "10Ә" : "9А";
  const ex = await q("select id from classrooms where org_id=$1 and name=$2 and teacher_id=$3", [org, name, t]);
  classes.push(ex[0]?.id ?? (await as(t, (x) => x("select public.create_classroom($1,$2,'2025-2026','Информатика','Демо сынып') as id", [org, name])))[0].id);
}
const students = [];
for (const [i, n] of NAMES.entries()) {
  const id = await user(`student${i + 1}@demo.qazaqcode.kz`, `${n} (демо)`);
  const cls = i % 2;
  const inCls = await q("select 1 from classroom_students where classroom_id=$1 and student_id=$2 and status='active'", [classes[cls], id]);
  if (!inCls.length) {
    const code = (await q("select join_code from classrooms where id=$1", [classes[cls]]))[0].join_code;
    await as(id, (x) => x("select public.join_classroom($1)", [code]));
  }
  students.push({ id, cls, i });
}

// ---------- тапсырмалар ----------
const mk = async (teacher, p, cls) => {
  const id = (await as(teacher, (x) => x("select public.upsert_assignment($1::jsonb) as id", [JSON.stringify({ org_id: org, ...p })])))[0].id;
  await as(teacher, (x) => x("select public.set_assignment_targets($1,$2::uuid[])", [id, [cls]]));
  await as(teacher, (x) => x("select public.set_assignment_status($1,'published')", [id]));
  return id;
};
// детерминді "кездейсоқтық": бір оқушы әр жүгіруде бірдей нәтиже алады
const h = (i, k) => ((i * 7 + k * 13 + 3) % 10) / 10;
const secs = (i, k) => 90 + ((i * 37 + k * 71) % 600);

async function workOn(a, teacher, cls, { kind, rate, gradeRate, k, answers, code, feedback, scores }) {
  const qs = kind === "quiz" ? await q("select id from assignment_questions where assignment_id=$1 order by position", [a]) : [];
  for (const s of students.filter((x) => x.cls === cls)) {
    if (s.i % 4 === 3) continue;                 // student4, 8, 12, 16, 20: ешқашан ештеңе тапсырмаған (шынайы: белсенді емес оқушылар)
    if (h(s.i, k) >= rate) continue;             // бұл тапсырманы жібермеген
    let sid;
    if (kind === "quiz") {
      const ans = {}; qs.forEach((r, j) => (ans[r.id] = answers(s.i, j)));
      sid = (await as(s.id, (x) => x("select public.save_draft($1,null,$2::jsonb,$3) as id", [a, JSON.stringify(ans), secs(s.i, k)])))[0].id;
    } else {
      sid = (await as(s.id, (x) => x("select public.save_draft($1,$2,'{}'::jsonb,$3) as id", [a, code(s.i), secs(s.i, k) * 2])))[0].id;
    }
    await as(s.id, (x) => x("select public.submit_assignment($1)", [sid]));
    if (kind !== "quiz" && h(s.i * 3 + 1, k + 2) < gradeRate) {
      await as(teacher, (x) => x("select public.grade_submission($1,$2,$3)", [sid, scores(s.i), feedback]));
    }
  }
}

const findA = async (title, teacher) => (await q("select id from assignments where org_id=$1 and title=$2 and created_by=$3", [org, title, teacher]))[0]?.id;
const D = { soon: day(7), week2: day(14), d3: day(3) };
const pastDeadline = async (a, days) => q("update assignments set deadline = $2 where id=$1", [a, day(-days)]);

const quizQs = (list) => list.map(([prompt, options, correct_index, explanation]) => ({ prompt, options, correct_index, explanation, points: 1 }));
const q1 = quizQs([
  ["Python-да x = 5 деген не?", ["Салыстыру", "Мән меншіктеу", "Функция"], 1],
  ["type(3.14) нәтижесі?", ["int", "str", "float"], 2],
  ["Қайсысы дұрыс айнымалы аты?", ["1ат", "my_name", "my-name"], 1]]);
const q1ans = (i, j) => (i % 3 === 0 && j === 0 ? 0 : [1, 2, 1][j]);
const q2 = quizQs([
  ["for k in range(3): print(k) қанша жол шығарады?", ["2", "3", "4"], 1, "range(3) мәндері 0, 1, 2: үш қайталау."],
  ["while циклі қашан тоқтайды?", ["Шарт жалған болғанда", "Әрдайым", "Бір рет орындалған соң"], 0, "Шарт әр айналым алдында тексеріледі."],
  ["Циклді мерзімінен бұрын тоқтататын сөз?", ["stop", "break", "exit"], 1, "break ағымдағы циклден шығады."],
  ["range(2, 10, 3) қандай мәндер береді?", ["2, 5, 8", "2, 3, 4", "3, 6, 9"], 0, "Бастапқы мән 2, қадам 3, 10-ға жетпейді."]]);
const q2ans = (i, j) => { const ok = [1, 0, 1, 0][j]; return h(i, j + 20) < 0.3 ? (ok + 1) % 3 : ok; };

const defs = [];
// 9А - teacher1 (5), 10Ә - teacher2 (5)
defs.push({ t: 0, title: "Айнымалылар: қысқа тест", p: { title: "Айнымалылар: қысқа тест", description: "Демо тест", kind: "quiz", max_score: 100, max_attempts: 3, questions: q1, deadline: D.soon }, cls: 0,
  w: { kind: "quiz", rate: 0.8, k: 1, answers: q1ans } });
defs.push({ t: 1, title: "Айнымалылар: қысқа тест", p: { title: "Айнымалылар: қысқа тест", description: "Демо тест", kind: "quiz", max_score: 100, max_attempts: 3, questions: q1, deadline: D.soon }, cls: 1,
  w: { kind: "quiz", rate: 0.8, k: 1, answers: q1ans } });
defs.push({ t: 0, title: "Факториал функциясы", p: { title: "Факториал функциясы", description: "factorial(n) функциясын жазыңыз: n! қайтарсын.", kind: "python", max_score: 100,
  starter_code: "def factorial(n):\n    pass\n", deadline: D.soon, test_cases: [{ input: "5", expected_output: "120" }, { input: "0", expected_output: "1" }, { input: "7", expected_output: "5040", is_hidden: true }] }, cls: 0,
  w: { kind: "python", rate: 0.5, gradeRate: 0.5, k: 2, feedback: "Жақсы шешім. Бос жолдарды үйреніңіз.", scores: (i) => 80 + (i % 20),
    code: () => "def factorial(n):\n    r = 1\n    for k in range(2, n + 1):\n        r *= k\n    return r\n" } });
defs.push({ t: 1, title: "SELECT сұрауы", p: { title: "SELECT сұрауы", description: "Кестеден жасы 15-тен үлкен оқушыларды таңдаңыз.", kind: "sql", max_score: 100, deadline: D.soon }, cls: 1,
  w: { kind: "sql", rate: 0.3, gradeRate: 0.5, k: 3, feedback: "Сұрау дұрыс, бағандарды атап жазған жақсы.", scores: (i) => 70 + (i % 25),
    code: () => "SELECT * FROM оқушылар WHERE жасы > 15;" } });
defs.push({ t: 0, title: "Циклдер: тест", p: { title: "Циклдер: тест", description: "for және while циклдері бойынша 4 сұрақ.", kind: "quiz", max_score: 100, max_attempts: 2, questions: q2, deadline: D.d3 }, cls: 0,
  w: { kind: "quiz", rate: 0.7, k: 4, answers: q2ans }, overdue: 2 });
defs.push({ t: 0, title: "Тізімдер мен сөздіктер", p: { title: "Тізімдер мен сөздіктер", description: "Тізімнен ең үлкен санды табатын функция жазыңыз; сөздікте сөздердің санын есептеңіз.", kind: "python", max_score: 100,
  starter_code: "def max_of(items):\n    pass\n", deadline: D.d3 }, cls: 0,
  w: { kind: "python", rate: 0.6, gradeRate: 0.8, k: 5, feedback: "Тізім әдістерін қайталаңыз.", scores: (i) => 55 + ((i * 11) % 45),
    code: (i) => i % 3 === 0 ? "def max_of(items):\n    return items[0]\n" : "def max_of(items):\n    m = items[0]\n    for x in items:\n        if x > m:\n            m = x\n    return m\n" }, overdue: 5 });
defs.push({ t: 1, title: "HTML бет жасау", p: { title: "HTML бет жасау", description: "Өзіңіз туралы бет жасаңыз: тақырып, абзац, сурет және тізім.", kind: "html_css", max_score: 100,
  starter_code: "<!doctype html>\n<html lang=\"kk\">\n<body>\n\n</body>\n</html>\n", deadline: day(5) }, cls: 1,
  w: { kind: "html_css", rate: 0.5, gradeRate: 0.4, k: 6, feedback: "Құрылым дұрыс, түстерді CSS-пен қосыңыз.", scores: (i) => 70 + (i % 25),
    code: (i) => `<!doctype html>\n<html lang="kk">\n<body>\n<h1>Менің бетім ${i}</h1>\n<p>Мен информатиканы жақсы көремін.</p>\n<ul><li>Python</li><li>HTML</li></ul>\n</body>\n</html>\n` } });
defs.push({ t: 1, title: "Жоба: мектеп кітапханасы", p: { title: "Жоба: мектеп кітапханасы", description: "Кітаптар кестесін жобалаңыз (атауы, авторы, жылы) және 3 сұрау жазыңыз. Қысқаша есеп қосыңыз.", kind: "project", max_score: 100, deadline: D.week2 }, cls: 1,
  w: { kind: "project", rate: 0.3, gradeRate: 0.3, k: 7, feedback: "Кесте құрылымы жақсы.", scores: (i) => 75 + (i % 20), code: (i) => `Жоба есебі #${i}: кесте books(id, title, author, year); сұраулар: ...` } });
defs.push({ t: 0, title: "JavaScript: батырма оқиғасы", p: { title: "JavaScript: батырма оқиғасы", description: "Батырманы басқанда санауышты 1-ге арттыратын код жазыңыз.", kind: "javascript", max_score: 100,
  starter_code: "let n = 0;\n// батырма оқиғасын осында жазыңыз\n", deadline: day(10) }, cls: 0,
  w: { kind: "javascript", rate: 0.35, gradeRate: 0.5, k: 8, feedback: "addEventListener дұрыс қолданылған.", scores: (i) => 65 + (i % 30),
    code: () => "let n = 0;\ndocument.querySelector('button').addEventListener('click', () => { n += 1; });\n" } });
defs.push({ t: 1, title: "Алгоритм блок-схемасы", p: { title: "Алгоритм блок-схемасы", description: "Сан жұп па, тақ па екенін анықтайтын алгоритмнің блок-схемасын сызып, файл не сипаттама жіберіңіз.", kind: "file", max_score: 100, deadline: D.d3 }, cls: 1,
  w: { kind: "file", rate: 0.55, gradeRate: 0.6, k: 9, feedback: "Схема түсінікті.", scores: (i) => 60 + ((i * 7) % 40), code: () => "Басы -> n енгізу -> n mod 2 = 0? -> иә: жұп / жоқ: тақ -> Соңы" }, overdue: 3 });

let made = 0;
for (const d of defs) {
  const teacher = teachers[d.t];
  if (await findA(d.title, teacher)) continue;
  const a = await mk(teacher, d.p, classes[d.cls]);
  if (d.w.rate > 0) await workOn(a, teacher, d.cls, d.w);
  if (d.overdue) await pastDeadline(a, d.overdue);
  made++;
}
log(`тапсырма: ${made} жаңа (барлығы ${defs.length})`);

// ---------- курстар (өз мазмұнымыз) ----------
const code = (language, content) => ({ type: "code", language, content });
const text = (content) => ({ type: "text", content });
const note = (content) => ({ type: "note", content });
const COURSES = [
  { title: "Python негіздері", by: 0, cls: [0], description: "Бағдарламалауға алғашқы қадам: айнымалылар, шарттар, циклдер және функциялар.", modules: [
    { title: "Бастау: деректер мен шарттар", lessons: [
      { title: "Бірінші бағдарлама", blocks: [text("Бағдарлама - компьютерге берілетін қадамдар тізбегі. Python тілінде ең қарапайым бағдарлама экранға мәтін шығарады."), code("python", "print(\"Сәлем, әлем!\")"), note("Мәтін тырнақшаның ішінде жазылады. Тырнақшаны ұмытсаңыз, қате шығады.")] },
      { title: "Айнымалылар және түрлері", blocks: [text("Айнымалы - мәнді сақтайтын атау. Мән меншіктеу үшін = белгісі қолданылады."), code("python", "ат = \"Дана\"\nжас = 15\nбой = 1.62\nprint(ат, жас, бой)"), text("Негізгі түрлер: int (бүтін), float (бөлшек), str (мәтін), bool (рас/жалған).")] },
      { title: "Шарттар: if және else", blocks: [text("Шарт бағдарламаға таңдау жасауға мүмкіндік береді."), code("python", "балл = 72\nif балл >= 85:\n    print(\"өте жақсы\")\nelif балл >= 60:\n    print(\"жақсы\")\nelse:\n    print(\"қайталау керек\")"), note("Шарттан кейін қос нүкте қойылады, ішкі жолдар шегініспен жазылады.")] }] },
    { title: "Циклдер және функциялар", lessons: [
      { title: "for циклі", blocks: [text("Цикл бірдей әрекетті бірнеше рет орындайды."), code("python", "for k in range(1, 6):\n    print(k, \"x 2 =\", k * 2)")] },
      { title: "while циклі", blocks: [text("while шарт ақиқат болғанша қайталайды. Шарттың бір кезде жалған болуын қамтамасыз етіңіз, әйтпесе цикл шексіз болады."), code("python", "n = 10\nwhile n > 0:\n    n -= 3\nprint(n)")] },
      { title: "Функциялар", blocks: [text("Функция - атау берілген қайта қолданылатын код бөлігі."), code("python", "def квадрат(x):\n    return x * x\n\nprint(квадрат(7))"), note("Функция нәтижені return арқылы қайтарады.")] }] }] },
  { title: "SQL бастамасы", by: 1, cls: [1], description: "Деректер базасы және кестелерден ақпарат алатын алғашқы сұраулар.", modules: [
    { title: "Кестелер мен таңдау", lessons: [
      { title: "Деректер базасы дегеніміз не", blocks: [text("Деректер базасы - ақпаратты кестелерде реттеп сақтайтын жүйе. Кесте жолдардан (жазбалар) және бағандардан (өрістер) тұрады."), note("Мысал: оқушылар кестесінде бағандар - id, аты, жасы, сынып.")] },
      { title: "SELECT және WHERE", blocks: [text("SELECT қандай бағандарды алатынымызды, WHERE қандай жолдарды сүзетінімізді көрсетеді."), code("sql", "SELECT аты, жасы\nFROM оқушылар\nWHERE жасы > 15;")] },
      { title: "Сұрыптау және шектеу", blocks: [text("ORDER BY нәтижені реттейді, LIMIT жолдар санын шектейді."), code("sql", "SELECT аты, балл\nFROM нәтижелер\nORDER BY балл DESC\nLIMIT 5;")] }] },
    { title: "Жинақтау және байланыс", lessons: [
      { title: "COUNT, AVG, GROUP BY", blocks: [text("Жинақтау функциялары көп жолдан бір мән есептейді."), code("sql", "SELECT сынып, COUNT(*) AS саны, AVG(балл) AS орташа\nFROM нәтижелер\nGROUP BY сынып;")] },
      { title: "Кестелерді JOIN арқылы біріктіру", blocks: [text("JOIN екі кестені ортақ баған бойынша біріктіреді."), code("sql", "SELECT о.аты, н.балл\nFROM оқушылар о\nJOIN нәтижелер н ON н.оқушы_id = о.id;"), note("Байланыс бағаны (оқушы_id) екі кестеде де болуы керек.")] }] }] },
  { title: "Веб негіздері", by: -1, cls: [0, 1], description: "Қарапайым веб-бет: HTML құрылымы, CSS безендіруі және JavaScript әрекеті.", modules: [
    { title: "HTML және CSS", lessons: [
      { title: "HTML құрылымы", blocks: [text("HTML бет мазмұнын тегтер арқылы сипаттайды: тақырып, абзац, тізім, сурет, сілтеме."), code("html", "<h1>Менің бетім</h1>\n<p>Бұл бірінші абзац.</p>\n<ul>\n  <li>Бір</li>\n  <li>Екі</li>\n</ul>")] },
      { title: "CSS: түс және өлшем", blocks: [text("CSS тегтердің көрінісін басқарады."), code("css", "h1 {\n  color: #0e7490;\n  font-size: 32px;\n}\np { line-height: 1.6; }"), note("Мәтін мен фон түстерінің контрастына назар аударыңыз: мәтін оңай оқылуы тиіс.")] },
      { title: "Макет: блоктар мен бағандар", blocks: [text("Flexbox элементтерді жолға не бағанға ыңғайлы орналастырады."), code("css", ".қатар {\n  display: flex;\n  gap: 16px;\n}")] }] },
    { title: "JavaScript бастамасы", lessons: [
      { title: "Айнымалылар мен функциялар", blocks: [text("JavaScript бетті «жандандырады». let айнымалы жариялайды, function әрекетті сипаттайды."), code("javascript", "let n = 0;\nfunction арттыр() {\n  n = n + 1;\n  return n;\n}\nconsole.log(арттыр());")] },
      { title: "Оқиғалар: батырманы басу", blocks: [text("Оқиға - пайдаланушы әрекеті (басу, теру). Оны addEventListener ұстайды."), code("javascript", "const b = document.querySelector('button');\nb.addEventListener('click', () => {\n  alert('Басылды!');\n});")] },
      { title: "Бетті өзгерту (DOM)", blocks: [text("DOM - беттің код түріндегі көрінісі. Оның мәтінін өзгертуге болады."), code("javascript", "document.querySelector('h1').textContent = 'Жаңа тақырып';"), note("Бұл код батырма не оқиға ішінде де жұмыс істей береді.")] }] }] },
];
let cmade = 0;
for (const c of COURSES) {
  if ((await q("select 1 from courses where org_id=$1 and title=$2", [org, c.title])).length) continue;
  const who = c.by < 0 ? admin : teachers[c.by];
  const id = (await as(who, (x) => x("select public.create_course($1,$2,$3) as id", [org, c.title, c.description])))[0].id;
  const st = { modules: c.modules.map((m) => ({ title: m.title, lessons: m.lessons.map((l) => ({ title: l.title, blocks: l.blocks })) })) };
  await as(who, (x) => x("select public.save_course_structure($1,$2::jsonb)", [id, JSON.stringify(st)]));
  await as(who, (x) => x("select public.set_course_targets($1,$2::uuid[])", [id, c.cls.map((k) => classes[k])]));
  await as(who, (x) => x("select public.set_course_status($1,'published')", [id]));
  // кейбір оқушылар сабақты аяқтаған (прогресс)
  const les = await q("select l.id from lessons l join course_modules m on m.id = l.module_id where l.course_id=$1 order by m.position, l.position", [id]);
  for (const s of students.filter((z) => c.cls.includes(z.cls) && z.i % 4 !== 3)) {
    const n = Math.floor(h(s.i, 11) * (les.length + 1));
    for (const l of les.slice(0, n)) await as(s.id, (x) => x("select public.complete_lesson($1)", [l.id]));
  }
  cmade++;
}
log(`курс: ${cmade} жаңа (барлығы ${COURSES.length})`);

// ---------- қосымша хабарландырулар (жүйелік) ----------
const hasWelcome = (await q("select 1 from notifications where org_id=$1 and kind='system' limit 1", [org])).length > 0;
if (!hasWelcome) {
  const everyone = [admin, ...teachers, ...students.map((s) => s.id)];
  for (const u of everyone) {
    await q("select public.notify($1,$2,'system','Қош келдіңіз! Бұл - демо режим', 'Бұл мектептегі барлық дерек ойдан құрастырылған, тек танысу үшін.', null)", [u, org]);
  }
  log("жүйелік хабарландырулар қосылды");
}

// ---------- ДЕМО белсенділік журналы (метрика бетін көрсету үшін) ----------
// ТЕК is_demo ұйымға жазылады: нақты ұйымға ешқашан. Дерек ойдан құрастырылған (детерминді), «ДЕМО» ұйымы метрикада әдепкіде есепке кірмейді
// (/admin/metrics: «ДЕМО ұйымдарын қосу» белгісімен ғана көрінеді). Қайталап іске қосу қауіпсіз (on conflict do nothing).
const hasActivity = (await q("select to_regclass('public.activity_days') as t"))[0].t;
const demoOrg = (await q("select is_demo from organizations where id=$1", [org]))[0]?.is_demo;
if (hasActivity && demoOrg) {
  const cal = await q("select d, extract(isodow from d)::int as dow from (select public.metrics_today() - g as d, g from generate_series(0, 41) g) x order by g");
  const rows = [];
  cal.forEach((c, g) => {
    if (c.dow > 5) return;                                      // демалыс күндері белсенділік жоқ
    const thr = 0.25 + 0.4 * (1 - g / 42);                      // уақыт өте белсенділік артады
    for (const s of students) if (s.i % 4 !== 3 && h(s.i, g + 20) < thr) rows.push([s.id, c.d, "student"]);
    teachers.forEach((t, k) => { if (h(k + 1, g) < 0.85) rows.push([t, c.d, "teacher"]); });
    if (h(5, g) < 0.4) rows.push([admin, c.d, "school_admin"]);
  });
  await q(`insert into public.activity_days (user_id, org_id, day, role)
           select u, $1, d, r::public.member_role from unnest($2::uuid[], $3::date[], $4::text[]) as t(u, d, r) on conflict do nothing`,
    [org, rows.map((r) => r[0]), rows.map((r) => r[1]), rows.map((r) => r[2])]);
  log(`ДЕМО белсенділік журналы: ${rows.length} жол (ойдан құрастырылған, тек демо ұйымда)`);
}

const cnt = (await q(`select (select count(*) from organization_members where org_id=$1 and role='student' and status='active') st,
  (select count(*) from organization_members where org_id=$1 and role='teacher' and status='active') te,
  (select count(*) from classrooms where org_id=$1) cl, (select count(*) from assignments where org_id=$1) a,
  (select count(*) from courses where org_id=$1) co, (select count(*) from submissions where org_id=$1 and status<>'draft') su,
  (select count(*) from notifications where org_id=$1) no`, [org]))[0];
console.log(`демо дерек дайын: оқушы ${cnt.st}, мұғалім ${cnt.te}, сынып ${cnt.cl}, тапсырма ${cnt.a}, курс ${cnt.co}, жұмыс ${cnt.su}, хабарландыру ${cnt.no}.`);
console.log("Кіру (құпиясөз DemoPass123): root@demo.qazaqcode.kz, admin@, teacher1@, teacher2@, student1@ ... student20@ @demo.qazaqcode.kz");
await pool.end();
