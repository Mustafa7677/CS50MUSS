/* CS50 қазақша: ойындар, 2-топ: SQL Escape Room, Memory Master, Web Builder, Binary Challenge.
   Барлық мазмұн ӨЗ жазған, интернетсіз, AI/API-сіз. Пайдаланушы мәтіні тек textContent/DOM арқылы шығады (innerHTML-ге қойылмайды). */
(function () {
  "use strict";
  const G = window.CS50Games;
  if (!G) return;
  const { shuffle, sample } = G;

  /** Шағын DOM көмекшісі: h("div", {class, text, onclick, aria-*}, ...балалар). Мәтін әрқашан textContent. */
  function h(tag, a, ...kids) {
    const e = document.createElement(tag);
    if (a) for (const k in a) {
      const v = a[k];
      if (v == null || v === false) continue;
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k === "value") e.value = v;
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    }
    const add = (c) => { if (c == null || c === false) return; if (Array.isArray(c)) c.forEach(add); else e.appendChild(typeof c === "object" ? c : document.createTextNode(String(c))); };
    kids.forEach(add);
    return e;
  }
  const clear = (e) => { while (e.firstChild) e.removeChild(e.firstChild); return e; };
  let uid = 0;
  const nid = (p) => "gb-" + p + "-" + (++uid);

  function dataTable(cols, rows, cap) {
    const max = cap || 50;
    return h("div", { class: "gb-tablewrap" }, h("table", { class: "gb-table" },
      h("thead", null, h("tr", null, cols.map((c) => h("th", { scope: "col", text: c })))),
      h("tbody", null, rows.slice(0, max).map((r) => h("tr", null, r.map((v) => h("td", null, v === null ? h("span", { class: "gb-null", text: "NULL" }) : String(v))))))));
  }

  /* ============================================================
     1) SQL ESCAPE ROOM
     ============================================================ */
  const ROOMS = [
    {
      title: "1-бөлме: Кітапхана", topic: "SELECT",
      story: "Есік артында ескі кітапхана. Құлып тек кітаптар тізімін көрсең ашылады.",
      task: "Барлық кітаптың атауын (title) және авторын (author) көрсет.",
      sql: `CREATE TABLE books (id INTEGER, title TEXT, author TEXT, year INTEGER);
INSERT INTO books VALUES (1,'Абай жолы','М. Әуезов',1942),(2,'Көшпенділер','І. Есенберлин',1971),(3,'Ақ боз ат','Т. Ахтанов',1964),(4,'Менің атым Қожа','Б. Соқпақбаев',1957),(5,'Қан мен тер','А. Нұрпейісов',1970);`,
      ref: "SELECT title, author FROM books", ordered: false,
      hints: ["SELECT пәрмені кестеден бағандарды таңдайды. Қай бағандар керек екенін тапсырмадан ақтар.", "Құрылым: SELECT бағанА, бағанБ FROM кесте_аты. Бағандар үтірмен бөлінеді.", "Кесте аты books. Екі баған керек: біріншісі атау, екіншісі автор. Жолдың соңына нүктелі үтір қоюға болады."],
    },
    {
      title: "2-бөлме: Асыл тастар қоймасы", topic: "WHERE",
      story: "Қоймада асыл тастар жатыр. Сейфтің кодын қызыл және қымбат тастар ғана ашады.",
      task: "Түсі «қызыл» және бағасы 500-ден жоғары асыл тастардың атауын (name) көрсет.",
      sql: `CREATE TABLE gems (id INTEGER, name TEXT, color TEXT, weight INTEGER, price INTEGER);
INSERT INTO gems VALUES (1,'Рубин','қызыл',5,900),(2,'Сапфир','көк',7,1200),(3,'Изумруд','жасыл',4,1500),(4,'Топаз','сары',9,300),(5,'Гранат','қызыл',6,150),(6,'Аметист','күлгін',8,250),(7,'Жақұт','қызыл',3,2000);`,
      ref: "SELECT name FROM gems WHERE color = 'қызыл' AND price > 500", ordered: false,
      hints: ["Жолдарды сүзу үшін WHERE қолданылады. Екі шартты AND біріктіреді.", "Құрылым: SELECT баған FROM кесте WHERE шарт1 AND шарт2. Мәтін тырнақшада жазылады: 'мәтін'.", "Бір шарт color бағанын мәтінмен салыстырады (=), екіншісі price бағанын санмен (>). Тырнақша бір тырнақ: ' '."],
    },
    {
      title: "3-бөлме: Базар", topic: "ORDER BY / LIMIT",
      story: "Базардағы сатушы жұмбақ айтты: «Ең қымбат екі затымның аты мен бағасын айтсаң, есікті ашамын».",
      task: "Ең қымбат 2 тауардың атын (name) және бағасын (price) көрсет. Қымбатынан арзанына қарай тәртіппен.",
      sql: `CREATE TABLE products (id INTEGER, name TEXT, price INTEGER);
INSERT INTO products VALUES (1,'Қола қылыш',320),(2,'Алтын тәж',950),(3,'Күміс айна',410),(4,'Жібек шарф',180),(5,'Інжу алқа',780),(6,'Мыс шам',60);`,
      ref: "SELECT name, price FROM products ORDER BY price DESC LIMIT 2", ordered: true,
      hints: ["Реттеу үшін ORDER BY, жол санын шектеу үшін LIMIT керек.", "Құрылым: SELECT ... FROM ... ORDER BY баған DESC LIMIT сан. DESC - кему бойынша, ASC - өсу бойынша.", "Реттейтін баған - price, бағыты - кему (DESC), ал LIMIT-тен кейін 2 жазылады. Реті маңызды!"],
    },
    {
      title: "4-бөлме: Мектеп журналы", topic: "GROUP BY / COUNT",
      story: "Директордың кабинетінің құлпы сынып бойынша есептеуді күтеді.",
      task: "Әр сыныпты (class) және ондағы оқушы санын көрсет, бірақ тек оқушысы 2-ден көп сыныптарды.",
      sql: `CREATE TABLE students (id INTEGER, name TEXT, class TEXT);
INSERT INTO students VALUES (1,'Аян','9A'),(2,'Бота','9A'),(3,'Гүлнар','9A'),(4,'Дәурен','9B'),(5,'Еркебұлан','9B'),(6,'Жібек','10A'),(7,'Зере','10A'),(8,'Икемкүл','10A'),(9,'Кәрім','10A');`,
      ref: "SELECT class, COUNT(*) FROM students GROUP BY class HAVING COUNT(*) > 2", ordered: false,
      hints: ["Топтап санау үшін GROUP BY және COUNT(*) қолданылады. Топтардың өзін сүзу WHERE-мен емес, HAVING-пен жасалады.", "Құрылым: SELECT баған, COUNT(*) FROM кесте GROUP BY баған HAVING COUNT(*) > сан.", "Топтайтын баған - class. COUNT(*) әр сыныптағы жол санын береді. Шарт: 2-ден көп."],
    },
    {
      title: "5-бөлме: Дүкен мұрағаты", topic: "JOIN",
      story: "Мұрағатта екі кесте бар: тұтынушылар және тапсырыстар. Құлып екеуін біріктіруді талап етеді.",
      task: "Сомасы (amount) 1000-нан асатын тапсырыстар үшін тұтынушының атын (customers.name) және зат атауын (orders.item) көрсет.",
      sql: `CREATE TABLE customers (id INTEGER, name TEXT, city TEXT);
CREATE TABLE orders (id INTEGER, customer_id INTEGER, item TEXT, amount INTEGER);
INSERT INTO customers VALUES (1,'Айгүл','Алматы'),(2,'Бауыржан','Астана'),(3,'Дана','Шымкент'),(4,'Ерлан','Алматы');
INSERT INTO orders VALUES (1,1,'Кітап',1500),(2,2,'Дәптер',400),(3,1,'Қалам',250),(4,3,'Рюкзак',9000),(5,3,'Жарық',3000),(6,2,'Бояу',1200);`,
      ref: "SELECT c.name, o.item FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.amount > 1000", ordered: false,
      hints: ["Екі кестені JOIN ... ON біріктіреді. Байланыс: orders.customer_id = customers.id.", "Құрылым: SELECT a.баған, b.баған FROM кестеА a JOIN кестеБ b ON b.сілтеме = a.id WHERE шарт.", "customers және orders-ты біріктір, ON-да orders.customer_id мен customers.id теңестір, ал WHERE-де amount > 1000 деп сүз."],
    },
    {
      title: "6-бөлме: Емтихан сейфі", topic: "Ішкі сұраныс",
      story: "Соңғы бөлме! Сейф «орташа баллдан жоғары» деген шартты күтіп тұр.",
      task: "Орташа баллдан (score) жоғары алған оқушылардың атын (name) көрсет. Балл бойынша жоғарыдан төменге қарай.",
      sql: `CREATE TABLE exam (id INTEGER, name TEXT, score INTEGER);
INSERT INTO exam VALUES (1,'Асхат',72),(2,'Балнұр',88),(3,'Дәурен',55),(4,'Ержан',91),(5,'Жанар',64),(6,'Зере',79);`,
      ref: "SELECT name FROM exam WHERE score > (SELECT AVG(score) FROM exam) ORDER BY score DESC", ordered: true,
      hints: ["Орташа мәнді AVG(...) есептейді. Оны WHERE ішіндегі жақшада жазылған ішкі SELECT ретінде қолдан.", "Құрылым: SELECT name FROM exam WHERE score > (SELECT AVG(score) FROM exam) ORDER BY ...", "Негізгі сұраныс score бағанын ішкі сұраныстың нәтижесімен салыстырады (>). Соңына ORDER BY score DESC қос."],
    },
  ];

  const SQL_MAXLEN = 400;
  const SQL_BLOCK = /\b(insert|update|delete|drop|alter|create|attach|detach|pragma|replace|vacuum|reindex|truncate|begin|commit|rollback|savepoint|release|analyze|explain|with|recursive|load_extension|randomblob|zeroblob)\b/;

  /** Сұранысты тексеру: {ok, sql} не {ok:false, msg} */
  function vetSql(raw) {
    const src = String(raw || "").trim();
    if (!src) return { ok: false, msg: "Алдымен SQL сұранысын жаз." };
    if (src.length > SQL_MAXLEN) return { ok: false, msg: `Сұраныс тым ұзын (${src.length} таңба). ${SQL_MAXLEN} таңбадан аспауы керек.` };
    // тырнақ ішіндегі мәтіндер мен түсініктемелерді алып тастап, құрылымды тексереміз
    const bare = src.replace(/'(?:[^']|'')*'/g, "''").replace(/"(?:[^"]|"")*"/g, '""').replace(/--[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ").toLowerCase().trim();
    if (!bare) return { ok: false, msg: "Сұраныс бос көрінеді (тек түсініктеме)." };
    const first = (bare.match(/^[a-z_]+/) || [""])[0];
    if (first && first !== "select" && SQL_BLOCK.test(first)) return { ok: false, msg: `«${first.toUpperCase()}» командасына рұқсат жоқ: бұл ойында деректерді өзгертуге болмайды, тек SELECT.` };
    if (/^select\b/.test(bare) === false) return { ok: false, msg: `Бұл бөлмеде тек SELECT сұраныстарына рұқсат етілген (деректерді оқу). Сұраныс SELECT сөзімен басталуы керек${first ? `, ал сенікі «${first}» деп басталды: әріп қатесі болмасын` : ""}.` };
    const body = bare.replace(/;\s*$/, "");
    if (body.indexOf(";") >= 0) return { ok: false, msg: "Бір мезетте тек бір сұраныс жіберуге болады. Ортадағы нүктелі үтірді алып тастап көр." };
    const bad = body.match(SQL_BLOCK);
    if (bad) return { ok: false, msg: `«${bad[1].toUpperCase()}» командасына рұқсат жоқ: бұл ойында деректерді өзгертуге болмайды, тек SELECT.` };
    // жүйені қорғау: кесте байланыстарының саны шектеулі (декарттық көбейтіндінің жарылуына жол бермейміз)
    const refs = (body.match(/\b(from|join)\b/g) || []).length;
    const commas = (body.match(/\bfrom\b([^()]*?)(?=\bwhere\b|\bgroup\b|\border\b|\bhaving\b|\blimit\b|\bjoin\b|\bon\b|\)|$)/g) || []).reduce((c, seg) => c + (seg.match(/,/g) || []).length, 0);
    if (refs + commas > 5) return { ok: false, msg: "Сұранысыңда кестелер тым көп біріктірілген (ең көбі 5). Қарапайымырақ жаз." };
    return { ok: true, sql: src.replace(/;\s*$/, "") };
  }

  function explainSqlError(m) {
    const msg = String(m && m.message ? m.message : m);
    let r;
    if ((r = msg.match(/no such table: (.+)/))) return `«${r[1]}» деген кесте жоқ. Сол жақтағы схемадан кесте атауын тексер: әріп қатесі болмауы керек.`;
    if ((r = msg.match(/no such column: (.+)/))) return `«${r[1]}» деген баған табылмады. Баған атауын схемадан тексер. Мәтін мәндері бір тырнақ ішінде жазылады: 'мәтін'.`;
    if ((r = msg.match(/ambiguous column name: (.+)/))) return `«${r[1]}» бағаны екі кестеде бар, қайсысы екені түсініксіз. Алдына кесте аты не бүркеншік атын қой: кесте.${r[1]}.`;
    if ((r = msg.match(/near "([^"]*)": syntax error/))) return `Синтаксис қатесі «${r[1]}» дегеннің жанында. Үтірлерді, жақшаларды және кілт сөздердің (FROM, WHERE, ORDER BY...) орнын тексер.`;
    if (/incomplete input/.test(msg)) return "Сұраныс аяқталмай қалған сияқты: жабылмаған жақша не тырнақша, не жетіспейтін бөлік бар.";
    if (/unrecognized token/.test(msg)) return "Танылмайтын таңба бар. Жабылмаған тырнақшаны немесе бөтен таңбаны іздеп көр.";
    if (/misuse of aggregate/.test(msg)) return "COUNT/AVG сияқты агрегат функцияны WHERE ішінде тікелей қолдануға болмайды. Топ шартын HAVING-ке немесе ішкі сұранысқа ауыстыр.";
    if (/syntax error/.test(msg)) return "Синтаксис қатесі: сұраныстың жазылу құрылымы дұрыс емес. Кілт сөздердің реті мен үтірлерді тексер.";
    if (/wrong number of arguments|no such function/.test(msg)) return "Функция аты қате не аргумент саны сәйкес емес. COUNT(*), AVG(баған) түрінде жаз.";
    if (/no tables specified/.test(msg)) return "FROM жетіспейді: қай кестеден оқитыныңды көрсет.";
    return "SQL механизмі сұранысты түсінбеді. Төмендегі техникалық хабарды оқып, қатені іздеп көр.";
  }

  let sqlLib = null;
  function loadSqlLib() {
    if (sqlLib) return sqlLib;
    const K = window.CS50KZ;
    if (!K || !K.loadScript) return Promise.reject(new Error("CS50KZ.loadScript жоқ"));
    const wasm = /^https?:/.test(location.protocol) && typeof WebAssembly === "object";
    sqlLib = K.loadScript("assets/vendor/sqljs/" + (wasm ? "sql-wasm.js" : "sql-asm.js"))
      .then(() => window.initSqlJs({ locateFile: (f) => K.ROOT_URL + "assets/vendor/sqljs/" + f }))
      .catch((e) => { sqlLib = null; throw e; });
    return sqlLib;
  }

  const cellKey = (v) => (v === null || v === undefined ? "\u0000NULL" : typeof v === "number" ? String(Math.round(v * 1e6) / 1e6) : String(v));
  /** Нәтижелерді салыстыру (бағандар аты емес, мәндер). Қайтарады: null (сәйкес) не себеп мәтіні */
  function compareResults(got, want, ordered) {
    if (!got.values.length) return "Сұраныс бірде-бір жол қайтармады. Шартыңды тексер.";
    if (got.columns.length !== want.columns.length) return `Бағандар саны сәйкес емес: ${want.columns.length} баған керек, сенікінде ${got.columns.length}.`;
    if (got.values.length !== want.values.length) return `Жол саны сәйкес емес: ${want.values.length} жол керек, сенікінде ${got.values.length}.`;
    const rk = (r) => r.map(cellKey).join("\u0001");
    const a = got.values.map(rk), b = want.values.map(rk);
    if (ordered) {
      if (a.every((x, i) => x === b[i])) return null;
      const sa = a.slice().sort(), sb = b.slice().sort();
      return sa.every((x, i) => x === sb[i]) ? "Мәндер дұрыс, бірақ жолдардың реті басқа. ORDER BY бағытын (ASC/DESC) тексер." : "Мәндер күтілгенге сәйкес емес.";
    }
    const sa = a.slice().sort(), sb = b.slice().sort();
    return sa.every((x, i) => x === sb[i]) ? null : "Жол саны дұрыс, бірақ мәндер күтілгенге сәйкес емес. Шартты не бағандарды тексер.";
  }

  G.register({
    id: "sqlescape", title: "SQL Escape Room", icon: "🗄️", color: "#0e7490",
    blurb: "6 құлыпталған бөлме: SQL сұранысын жазып, есіктерді ашып шық.",
    start(stage, ctx) {
      let idx = 0, solved = 0, clean = 0, db = null, SQLlib = null, hints = 0, totalHints = 0, done = false;
      const locks = [];

      function status(text, cls) { fb.className = "g-fb gb-fb" + (cls ? " " + cls : ""); fb.textContent = text; }
      const fb = h("div", { class: "g-fb gb-fb", role: "status", "aria-live": "polite" });

      function openRoom() {
        const room = ROOMS[idx];
        hints = 0;
        if (db) { try { db.close(); } catch (e) {} }
        db = new SQLlib.Database();
        db.run(room.sql);
        const want = db.exec(room.ref)[0];
        const tableNames = db.exec("SELECT name FROM sqlite_master WHERE type='table'")[0].values.map((r) => r[0]);
        const sqlId = nid("sql");
        const hintBox = h("ol", { class: "gb-hints", "aria-label": "Кеңестер" });
        const hintBtn = h("button", { class: "btn secondary gb-hint-btn gy-lamp", type: "button" }, "💡 Кеңес (0/3)");
        const out = h("div", { class: "gb-out" });
        const gutter = h("div", { class: "gy-gutter", "aria-hidden": "true" });
        const ta = h("textarea", { id: sqlId, class: "gb-sql", rows: 5, maxlength: SQL_MAXLEN, spellcheck: "false", autocomplete: "off", autocapitalize: "off", placeholder: "SELECT ... FROM ..." });
        const runBtn = h("button", { class: "btn gb-run", type: "button" }, "▶ Іске қосу");
        const door = h("div", { class: "gy-door", "aria-hidden": "true" }, h("span", { class: "gy-door-l" }), h("span", { class: "gy-door-r" }), h("span", { class: "gy-door-lock", text: "🔒" }));
        const cmp = h("div", { class: "gy-cmp", hidden: true });
        const lines = () => { const n = Math.max(5, ta.value.split("\n").length); gutter.textContent = Array.from({ length: n }, (_, i) => i + 1).join("\n"); gutter.scrollTop = ta.scrollTop; };
        ta.addEventListener("input", lines); ta.addEventListener("scroll", () => { gutter.scrollTop = ta.scrollTop; }); lines();
        const nextBtn = h("button", { class: "btn gb-next", type: "button", hidden: true }, idx === ROOMS.length - 1 ? "Шығу ▸" : "Келесі бөлме ▸");
        status("");

        const schema = h("div", { class: "gb-schema" }, tableNames.map((t) => {
          const r = db.exec("SELECT * FROM " + t)[0];
          return h("details", { class: "gb-tbl", open: true },
            h("summary", null, h("code", { text: t }), ` (${r.columns.join(", ")}) - ${r.values.length} жол`),
            dataTable(r.columns, r.values, 20));
        }));

        function run() {
          if (done || nextBtn.hidden === false) return;
          clear(out); cmp.hidden = true;
          const v = vetSql(ta.value);
          if (!v.ok) { status("⛔ " + v.msg, "bad"); return; }
          let got;
          try {
            const res = db.exec(v.sql);
            got = res.length ? res[0] : { columns: [], values: [] };
          } catch (e) {
            status("⚠ " + explainSqlError(e), "bad");
            out.appendChild(h("p", { class: "gb-raw" }, "Техникалық хабар: ", h("code", { text: String(e && e.message || e) })));
            return;
          }
          if (got.columns.length) out.appendChild(dataTable(got.columns, got.values, 30));
          const why = compareResults(got, want, room.ordered);
          const chip = (lbl, a, b) => h("span", { class: "gy-chip " + (a === b ? "ok" : "bad") }, lbl + ": ", h("b", { text: String(a) }), a === b ? " ✓" : " / күтілетін " + b);
          clear(cmp).appendChild(chip("Бағандар", got.columns.length, want.columns.length));
          cmp.appendChild(chip("Жолдар", got.values.length, want.values.length));
          cmp.appendChild(h("span", { class: "gy-chip " + (why ? "bad" : "ok") }, why ? "мәндер сәйкес емес" : "мәндер сәйкес ✓"));
          cmp.hidden = false;
          if (why) { ctx.sfx && ctx.sfx("bad"); roomEl.classList.remove("shake"); void roomEl.offsetWidth; roomEl.classList.add("shake"); status("🔒 Құлып жабық. " + why, "bad"); return; }
          ctx.sfx && ctx.sfx("win"); door.classList.add("open"); door.lastChild.textContent = "🔓";
          solved++; if (!hints) clean++;
          locks[idx] = true; renderHud();
          status("🔓 Құлып ашылды! " + (hints ? "" : "Кеңессіз шештің: бонус +5."), "ok");
          ta.readOnly = true; runBtn.disabled = true; hintBtn.disabled = true;
          nextBtn.hidden = false; nextBtn.focus();
        }

        runBtn.onclick = run;
        ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); } });
        hintBtn.onclick = () => {
          if (hints >= 3) return;
          hintBox.appendChild(h("li", null, h("strong", { text: `Кеңес ${hints + 1}: ` }), room.hints[hints]));
          hints++; totalHints++;
          hintBtn.textContent = `💡 Кеңес (${hints}/3)`;
          if (hints >= 3) hintBtn.disabled = true;
          status(`Кеңес ${hints} ашылды (бұл бөлмедегі бонус жоғалады).`);
        };
        nextBtn.onclick = () => { idx++; if (idx >= ROOMS.length) return end(); openRoom(); };

        const roomEl = h("div", { class: "gb-room gy-room" },
          h("div", { class: "gy-roomhead" }, door,
            h("div", { class: "gy-roomtxt" },
              h("h3", { class: "gb-title", text: room.title }), h("p", { class: "gb-topic" }, "Тақырып: ", h("b", { class: "gy-topic", text: room.topic })))),
          h("p", { class: "gb-story gy-story", text: room.story }),
          h("p", { class: "g-q gb-task gy-task" }, h("b", { text: "Тапсырма: " }), room.task),
          h("div", { class: "gb-cols" },
            h("div", { class: "gb-col" }, h("h4", { text: "Дерекқор схемасы" }), schema),
            h("div", { class: "gb-col" },
              h("label", { for: sqlId, class: "gb-label" }, "SQL сұранысың ", h("small", { class: "gy-kbd", text: "(Ctrl+Enter - іске қосу)" })),
              h("div", { class: "gy-sqled" }, h("div", { class: "gy-etitle" }, h("span", { class: "gy-lights", "aria-hidden": "true" }, h("i"), h("i"), h("i")), h("span", { class: "gy-file", text: "query.sql" }), h("span", { class: "gy-kbdchip", "aria-hidden": "true", text: "Ctrl ⏎" })), h("div", { class: "gy-edbody" }, gutter, ta)),
              h("div", { class: "gb-btns" }, runBtn, hintBtn, nextBtn), fb, cmp, hintBox, out)));
        stage.replaceChildren(h("div", { class: "gy gy-sql" }, hud, roomEl));
        ta.focus();
      }

      const hud = h("div", { class: "g-hud" });
      function renderHud() {
        clear(hud); hud.classList.add("gy-hud");
        hud.appendChild(h("span", { class: "gy-round", text: `Бөлме ${Math.min(idx + 1, ROOMS.length)}/${ROOMS.length}` }));
        hud.appendChild(h("span", { class: "gb-locks gy-map", role: "img", "aria-label": `Ашылған құлып: ${solved} / ${ROOMS.length}` },
          ROOMS.map((_, i) => h("i", { class: "gy-node" + (locks[i] ? " open" : "") + (i === idx && !locks[i] ? " cur" : ""), "aria-hidden": "true", text: locks[i] ? "🔓" : "🔒" }))));
        hud.appendChild(h("span", { class: "gy-score", text: `Кеңес: ${totalHints}` }));
      }

      function end() {
        done = true;
        const score = solved * 10 + clean * 5;
        ctx.finish({ score, xp: Math.round(score / 2), title: solved === ROOMS.length ? "Барлық бөлмеден шықтың! 🗝️" : "Ойын аяқталды", lines: [`Ашылған бөлме: ${solved} / ${ROOMS.length}`, `Кеңессіз шешілген бөлме: ${clean}`] });
      }

      stage.appendChild(h("p", { text: "SQL механизмі жүктелуде…", role: "status" }));
      loadSqlLib().then((S) => { SQLlib = S; renderHud(); openRoom(); })
        .catch(() => { stage.replaceChildren(h("p", { class: "game-err", text: "SQL механизмін (sql.js) жүктеу мүмкін болмады. Бетті жаңартып көр." })); });
    },
  });

  /* ============================================================
     2) MEMORY MASTER
     ============================================================ */
  // Жад торы ұяшықтары: I - int, C - char, P - көрсеткіш, A - массив
  const I = (n, v, o) => Object.assign({ n, t: "int", v: String(v) }, o);
  const C = (n, v, o) => Object.assign({ n, t: "char", v: String(v) }, o);
  const P = (n, to, t, o) => Object.assign({ n, t: t || "int *", ptr: to }, o);
  const A = (n, vals, t, o) => vals.map((v, i) => Object.assign({ n: n + "[" + i + "]", t: t || "int", v: String(v) }, o && o[i]));
  const S0 = "\\0";

  // o[0] - дұрыс жауап (көрсетілгенде араласады); f - толтыру жауаптары
  const MEM = [
    // ---- 1-деңгей: көрсеткіш негіздері ----
    { l: 1, code: "int x = 5;\nint *p = &x;\n*p = 7;", q: "Соңында x-тің мәні қандай?", o: ["7", "5", "x-тің адресі", "Компиляция қатесі"], mem: { stack: [I("x", 7), P("p", "x")] }, e: "p айнымалысы x-тің адресін сақтайды. *p = 7 «p көрсететін жадқа 7 жаз» дегенді білдіреді, сондықтан x-тің өзі өзгереді." },
    { l: 1, code: "int a = 3;\nint b = a;\nint *p = &a;\n*p = 9;", q: "Соңында b-ның мәні қандай?", o: ["3", "9", "a-ның адресі", "Анықталмаған"], mem: { stack: [I("a", 9), I("b", 3), P("p", "a")] }, e: "b = a мәнді КӨШІРЕДІ. Кейін a өзгерсе де, b өз жадында 3 болып қалады." },
    { l: 1, code: "int x = 10;\nint *p = &x;\nint *q = p;\n*q = *q + 1;", q: "Нәтиже қандай?", o: ["x = 11, p мен q екеуі де x-ті көрсетеді", "x = 10, q жаңа жадты көрсетеді", "x = 11, бірақ p өзгерді", "x = 12"], mem: { stack: [I("x", 11), P("p", "x"), P("q", "x")] }, e: "q = p көрсеткіштің мәнін (адресті) көшіреді, сондықтан екеуі де x-ті көрсетеді. *q арқылы жазсақ, x өзгереді." },
    { l: 1, code: 'int n = 4;\nint *p = &n;\nprintf("%d", *p * 2);', q: "Экранға не шығады?", f: ["8"], mem: { stack: [I("n", 4), P("p", "n")] }, e: "*p - p көрсететін жадтағы мән, яғни 4. 4 * 2 = 8. n өзгермейді." },
    { l: 1, code: "int x = 2, y = 8;\nint *p = &x;\np = &y;\n*p = 0;", q: "Соңында x және y қандай?", o: ["x = 2, y = 0", "x = 0, y = 8", "x = 0, y = 0", "x = 2, y = 8"], mem: { stack: [I("x", 2), I("y", 0), P("p", "y")] }, e: "p = &y көрсеткішті y-ке бұрады. Кейінгі *p = 0 енді y-ті өзгертеді, x-ке тиіспейді." },
    { l: 1, code: "int x = 42;\nint *p = &x;", q: "p айнымалысының ІШІНДЕ не сақталады?", o: ["x-тің жадтағы адресі", "42 саны", "x айнымалысының аты", "x-тің өлшемі"], mem: { stack: [I("x", 42), P("p", "x")] }, e: "Көрсеткіш мәні - адрес. Кестедегі p ұяшығының мәні x ұяшығының адресіне тең." },
    { l: 1, code: "int x = 1;\nint *p = &x;\nint **pp = &p;\n**pp = 6;", q: "x-тің мәні қандай?", o: ["6", "1", "p-ның адресі", "Белгісіз"], mem: { stack: [I("x", 6), P("p", "x"), P("pp", "p", "int **")] }, e: "pp көрсеткішке көрсетеді: *pp = p, ал **pp = *p = x. Екі қадам арқылы барып, x-ке 6 жазамыз." },
    { l: 1, code: "void swap(int *a, int *b) {\n    int t = *a; *a = *b; *b = t;\n}\n\nint x = 1, y = 2;\nswap(&x, &y);", q: "swap-тан кейін x және y қандай?", o: ["x = 2, y = 1", "x = 1, y = 2", "x = 2, y = 2", "x = 1, y = 1"], mem: { stack: [I("x", 2), I("y", 1)] }, e: "Функцияға x пен y-тің АДРЕСТЕРІ берілді, сондықтан swap түпнұсқа жадты өзгертеді." },
    { l: 1, code: "void bad(int a, int b) {\n    int t = a; a = b; b = t;\n}\n\nint x = 1, y = 2;\nbad(x, y);", q: "bad(x, y)-тен кейін x және y қандай?", o: ["x = 1, y = 2 (өзгермейді)", "x = 2, y = 1", "x = 2, y = 2", "Қате шығады"], mem: { stack: [I("x", 1), I("y", 2)] }, e: "C-да аргумент мәні КӨШІРІЛЕДІ. bad ішіндегі a мен b - көшірмелер, функция біткенде жоғалады. Сондықтан swap-қа көрсеткіш керек." },
    { l: 1, code: "int *p = NULL;\nprintf(\"%d\", *p);", q: "Бұл код іске қосылғанда не болады?", o: ["Segmentation fault: NULL адресін оқуға болмайды", "0 басып шығарады", "NULL деп жазады", "Компиляция қатесі"], mem: { stack: [P("p", null)] }, e: "NULL - ешқайда көрсетпейтін көрсеткіш (адрес 0). Оны *-пен ашу программаны құлатады. Қолданбас бұрын p != NULL тексер." },
    { l: 1, code: 'int x = 3;\nint *p = &x;\n(*p)++;\nprintf("%d", x);', q: "Экранға не шығады?", f: ["4"], mem: { stack: [I("x", 4), P("p", "x")] }, e: "(*p)++ p көрсететін мәнді (x-ті) 1-ге арттырады: 3 → 4." },

    // ---- 2-деңгей: malloc / free, массивтер ----
    { l: 2, code: "int *p = malloc(sizeof(int));\n*p = 42;\nfree(p);", q: "Жад ағып кете ме?", o: ["Жоқ: әр malloc-қа free жұп", "Иә: p жойылады", "Иә: 42 өшпейді", "Анықтау мүмкін емес"], mem: { stack: [P("p", "h1")], heap: [I("h1", 42, { freed: true })] }, e: "malloc алған блок free арқылы қайтарылды, ағу жоқ. Бірақ p әлі ескі адресті сақтайды, сондықтан оны енді қолданбаған жөн." },
    { l: 2, code: "int *p = malloc(4 * sizeof(int));\np[0] = 1;\nreturn 0;   // free жоқ", q: "Не болды?", o: ["Иә, 16 байт жад ағып кетті (free жоқ)", "Жоқ: функция біткенде жад өзі босайды", "Жоқ: p стекте болғандықтан", "Тек 4 байт ағып кетті"], mem: { stack: [P("p", "h[0]")], heap: [].concat(A("h", [1, "?", "?", "?"], "int", [{ leak: true }, { leak: true }, { leak: true }, { leak: true }])) }, e: "Көрсеткіш p стекте, ол жоғалады. Ал үймедегі блок free жасалмайынша қалады. 4 * sizeof(int) = 16 байт ағып кетті (Valgrind мұны көрсетеді)." },
    { l: 2, code: "int *p = malloc(sizeof(int));\n*p = 5;\np = NULL;\nfree(p);", q: "Жад ағып кетті ме?", o: ["Иә: malloc адресі жоғалды, free(NULL) ештеңе істемейді", "Жоқ: free(p) блокты босатады", "Жоқ: p = NULL жадты өшіреді", "Компиляция қатесі"], mem: { stack: [P("p", null)], heap: [I("h1", 5, { leak: true })] }, e: "p = NULL болғанда блоктың жалғыз адресі жоғалды. free(NULL) қауіпсіз, бірақ ештеңе босатпайды. Ең алдымен free, содан кейін NULL." },
    { l: 2, code: "int *p = malloc(sizeof(int));\n*p = 1;\nfree(p);\n*p = 5;", q: "Соңғы жолда не болып тұр?", o: ["Use-after-free: босатылған жадқа жазу, қате (undefined behavior)", "Дұрыс: p әлі жарамды", "Дұрыс: жаңа жад автоматты бөлінеді", "Компилятор міндетті түрде қате береді"], mem: { stack: [P("p", "h1")], heap: [I("h1", "?", { freed: true, bad: true })] }, e: "free-ден кейін жад енді саған тиесілі емес. Оған жазу программаны құлатуы немесе басқа деректі бүлдіруі мүмкін." },
    { l: 2, code: "int *p = malloc(sizeof(int));\nfree(p);\nfree(p);", q: "Екінші free туралы не айтасың?", o: ["Double free: бір блокты екі рет босату қате", "Қауіпсіз: екінші free еленбейді", "Жад екі есе тазарады", "Тек ескерту, қате емес"], mem: { stack: [P("p", "h1")], heap: [I("h1", "?", { freed: true, bad: true })] }, e: "Блокты екі рет босату үйме құрылымын бұзады. Қауіпсіз әдет: free(p); p = NULL; (free(NULL) зиянсыз)." },
    { l: 2, code: "int *a = malloc(3 * sizeof(int));\na[0] = 1; a[1] = 2; a[2] = 3;\na[3] = 4;", q: "Қай жол қате?", o: ["a[3] = 4: индекс 0..2 аралығында болуы керек", "a[0] = 1", "malloc жолы", "Қате жоқ"], mem: { stack: [P("a", "a[0]")], heap: [].concat(A("a", [1, 2, 3, 4], "int", [null, null, null, { bad: true }])) }, e: "3 элементті массивтің жарамды индекстері 0, 1, 2. a[3] блоктан тыс жадқа жазады (buffer overflow)." },
    { l: 2, code: 'int a[4] = {10, 20, 30, 40};\nint *p = a;\nprintf("%d", *(p + 2));', q: "Экранға не шығады?", f: ["30"], mem: { stack: [].concat(A("a", [10, 20, 30, 40]), [P("p", "a[0]")]) }, e: "p + 2 екі int алға жылжиды, a[2]-ге жетеді. *(p + 2) тең a[2] = 30." },
    { l: 2, code: 'int a[3] = {1, 2, 3};\nint *p = a + 1;\nprintf("%d", p[1]);', q: "Экранға не шығады?", f: ["3"], mem: { stack: [].concat(A("a", [1, 2, 3]), [P("p", "a[1]")]) }, e: "p = a + 1 - a[1]-ді көрсетеді. p[1] тең *(p + 1), яғни a[2] = 3." },
    { l: 2, code: 'int a[5];\nprintf("%zu", sizeof(a) / sizeof(a[0]));', q: "Экранға не шығады?", f: ["5"], mem: { stack: A("a", ["?", "?", "?", "?", "?"]) }, e: "sizeof(a) = 5 * 4 = 20 байт, sizeof(a[0]) = 4 байт. 20 / 4 = 5 элемент." },
    { l: 2, code: "int *p = malloc(sizeof(int));\n*p = 3;\nint *q = p;\nfree(q);", q: "Осыдан кейін p туралы не айтуға болады?", o: ["p - dangling pointer: босатылған жадты көрсетеді, қолдануға болмайды", "p автоматты NULL болды", "p әлі жарамды: free тек q-ды босатады", "p жаңа жадты көрсетеді"], mem: { stack: [P("p", "h1"), P("q", "h1")], heap: [I("h1", "?", { freed: true })] }, e: "p мен q БІР блокты көрсетеді. free(q) блокты босатты, p дәл сол адресті сақтап тұр, бірақ ол жарамсыз." },
    { l: 2, code: "int *p = malloc(1000000000 * sizeof(int));\nif (p == NULL) {\n    return 1;\n}", q: "NULL-ға тексерудің мәні қандай?", o: ["malloc жад таба алмаса NULL қайтарады, қолданар алдында тексеру керек", "NULL тек free-ден кейін пайда болады", "Тексеру керек емес: malloc ешқашан сәтсіз болмайды", "NULL - 0 мәнді int"], mem: { stack: [P("p", null)] }, e: "Үйме шектеулі. Үлкен сұрау сәтсіз болса malloc NULL береді, ал NULL-ды ашу программаны құлатады." },
    { l: 2, code: "for (int i = 0; i < 3; i++) {\n    int *p = malloc(sizeof(int));\n    *p = i;\n}", q: "Цикл біткенде free жасалмаған неше блок ағып кетті?", f: ["3"], mem: { stack: [], heap: [I("h1", 0, { leak: true }), I("h2", 1, { leak: true }), I("h3", 2, { leak: true })] }, e: "Әр итерацияда жаңа блок бөлінеді, p-ны цикл соңында жоғалтамыз. 3 блок ағады. free(p) цикл ішінде болуы керек еді." },

    // ---- 3-деңгей: жолдар, стек пен үйме, қақпандар ----
    { l: 3, code: 'char s[] = "hi";\nprintf("%zu", sizeof(s));', q: "Экранға не шығады?", f: ["3"], mem: { stack: [C("s[0]", "h"), C("s[1]", "i"), C("s[2]", S0)] }, e: 'Жол соңында жасырын \\0 болады: "h", "i", \\0 = 3 байт.' },
    { l: 3, code: 'char s[] = "cat";\nprintf("%zu", strlen(s) + sizeof(s));', q: "Экранға не шығады?", f: ["7"], mem: { stack: [C("s[0]", "c"), C("s[1]", "a"), C("s[2]", "t"), C("s[3]", S0)] }, e: "strlen \\0-ге дейін санайды: 3. sizeof(s) \\0-ді қоса: 4. Қосындысы 7." },
    { l: 3, code: 'char s[3];\ns[0] = \'o\'; s[1] = \'k\';\nprintf("%s", s);', q: "Не болады?", o: ["Нәтиже кепілдік емес: жол соңында \\0 жоқ, printf қоқысты да оқиды", "\"ok\" шығады", "\"ok\\0\" шығады", "Компиляция қатесі"], mem: { stack: [C("s[0]", "o"), C("s[1]", "k"), C("s[2]", "?", { bad: true })] }, e: "%s \\0 кездескенше оқиды. s[2] инициализацияланбаған, ол кез келген мән болуы мүмкін. Әр жолдың соңына '\\0' жаз." },
    { l: 3, code: 'char *s = "hello";\ns[0] = \'J\';', q: "Не болады?", o: ["Қате: жол литералы тек оқуға арналған жадта (көбіне segfault)", "s \"Jello\" болады", "Жаңа жол жасалады", "Компиляция қатесі міндетті түрде"], mem: { stack: [P("s", "L[0]", "char *")], ro: [C("L[0]", "h"), C("L[1]", "e"), C("L[2]", "l"), C("L[3]", "l"), C("L[4]", "o"), C("L[5]", S0)] }, e: 'char *s = "..." литералға көрсетеді, ал литерал тек оқу жадында. Өзгерту керек болса char s[] = "hello"; жаз.' },
    { l: 3, code: 'char s[] = "hello";\ns[0] = \'J\';\nprintf("%s", s);', q: "Экранға не шығады?", o: ["Jello", "hello", "Segmentation fault", "J"], mem: { stack: [C("s[0]", "J"), C("s[1]", "e"), C("s[2]", "l"), C("s[3]", "l"), C("s[4]", "o"), C("s[5]", S0)] }, e: "char s[] = \"hello\" литералды стектегі массивке КӨШІРЕДІ, сондықтан оны өзгертуге болады." },
    { l: 3, code: "int *f(void) {\n    int x = 5;\n    return &x;\n}", q: "Бұл функцияда қандай қате бар?", o: ["Қайтарылған адрес f біткенде жойылатын стек жадын көрсетеді (dangling)", "x үймеде тұр", "int * қайтаруға болмайды", "Қате жоқ"], mem: { stack: [I("x", 5, { dead: true })] }, e: "Локал айнымалылар стекте, функция аяқталғанда ол жад қайта қолданылады. Ұзақ өмір керек болса malloc қолдан." },
    { l: 3, code: "int *f(void) {\n    int *p = malloc(sizeof(int));\n    *p = 5;\n    return p;\n}", q: "Бұл код дұрыс па? free-ді кім шақыруы керек?", o: ["Дұрыс: үйме жады f біткенде де сақталады, free-ді f-ті шақырған код жасайды", "Қате: функция ішінде malloc қолдануға болмайды", "Дұрыс, free керек емес", "Қате: p стекте жойылып, мәні жоғалады"], mem: { stack: [P("p", "h1")], heap: [I("h1", 5)] }, e: "Қайтарылатын нәрсе - адрестің көшірмесі, ал блок үймеде тірі. Иесі енді шақырушы: бір кезде free(...) шақыруы керек." },
    { l: 3, code: 'int a[3] = {1, 2, 3};\nint *p = a;\nint v = *p++;\nprintf("%d", v);', q: "Экранға не шығады?", f: ["1"], mem: { stack: [].concat(A("a", [1, 2, 3]), [I("v", 1), P("p", "a[1]")]) }, e: "*p++ алдымен ескі *p мәнін (1) алады, содан кейін p-ны келесі элементке жылжытады. Енді p → a[1]." },
    { l: 3, code: "int a[3] = {5, 6, 7};\nint *p = a;\np++;\n*p = 0;", q: "Соңында a массиві қандай?", o: ["{5, 0, 7}", "{0, 6, 7}", "{5, 6, 0}", "{0, 0, 0}"], mem: { stack: [].concat(A("a", [5, 0, 7]), [P("p", "a[1]")]) }, e: "p++ көрсеткішті a[0]-ден a[1]-ге жылжытады. *p = 0 дәл a[1]-ді нөлге айналдырады." },
    { l: 3, code: 'char s[] = "abc";\nchar *t = malloc(strlen(s));\nstrcpy(t, s);', q: "Қате қайда?", o: ["malloc strlen(s) байт ғана береді, \\0 үшін +1 керек", "strcpy-ды қолдануға болмайды", "t - char * емес", "Қате жоқ"], mem: { stack: [C("s[0]", "a"), C("s[1]", "b"), C("s[2]", "c"), C("s[3]", S0), P("t", "t[0]", "char *")], heap: [C("t[0]", "a"), C("t[1]", "b"), C("t[2]", "c"), C("t[3]", S0, { bad: true })] }, e: 'strlen \\0-ді санамайды: 3. Көшірмеге 4 байт керек. Дұрысы: malloc(strlen(s) + 1). Қызыл ұяшық - блоктан тыс жазылған \\0.' },
    { l: 3, code: 'int a[] = {2, 4, 6, 8};\nint *p = &a[3];\nint *q = &a[1];\nprintf("%ld", p - q);', q: "Экранға не шығады?", f: ["2"], mem: { stack: [].concat(A("a", [2, 4, 6, 8]), [P("p", "a[3]"), P("q", "a[1]")]) }, e: "Көрсеткіштерді азайтқанда байт емес ЭЛЕМЕНТ саны шығады: индекстер айырмасы 3 - 1 = 2." },
    { l: 3, code: 'char s[] = "ab";\nchar *p = s;\nwhile (*p) p++;\nprintf("%ld", p - s);', q: "Экранға не шығады?", f: ["2"], mem: { stack: [C("s[0]", "a"), C("s[1]", "b"), C("s[2]", S0), P("p", "s[2]", "char *")] }, e: "Цикл \\0-ге жеткенде тоқтайды (\\0 жалған). p s[2]-де тұр, айырмасы 2: бұл жолдың ұзындығы (strlen)." },
    { l: 3, code: "int a = 1;\nint *b = malloc(sizeof(int));", q: "a және *b қайда сақталады?", o: ["a - стекте, *b - үймеде (heap)", "екеуі де стекте", "екеуі де үймеде", "a - үймеде, *b - стекте"], mem: { stack: [I("a", 1), P("b", "h1")], heap: [I("h1", "?")] }, e: "Локал айнымалылар (a, көрсеткіш b) стекте. malloc көрсететін блок үймеде, оны free жасағанға дейін өмір сүреді." },
  ];

  function codeBlock(code) {
    const hl = window.CS50GamesA && window.CS50GamesA.hl;
    const pre = h("pre", { class: "g-code gy-code", tabindex: "0", "aria-label": "C коды" });
    const wrap = h("code");
    code.split("\n").forEach((ln, i) => {
      const row = h("span", { class: "gy-cl" }, h("i", { "aria-hidden": "true", text: String(i + 1) }));
      const txt = h("span", { class: "gy-ct" });
      if (hl) txt.innerHTML = hl(ln, "C") || "&nbsp;"; else txt.textContent = ln || " ";
      row.appendChild(txt); wrap.appendChild(row);
    });
    pre.appendChild(wrap);
    return h("div", { class: "gy-editor gy-snip" }, h("div", { class: "gy-etitle" }, h("span", { class: "gy-lights", "aria-hidden": "true" }, h("i"), h("i"), h("i")), h("span", { class: "gy-file", text: "main.c" }), h("span", { class: "gy-lang gy-lang-c", "aria-hidden": "true", text: "C" })), pre);
  }

  function buildMem(mem) {
    // адрестерді бөлу
    const addr = {};
    const regions = [["stack", "Стек (локал айнымалылар)", 0x1000], ["heap", "Үйме (malloc)", 0x5000], ["ro", "Тек оқу жады (жол литералдары)", 0x9000]];
    const sizeOf = (c) => (c.ptr !== undefined || /\*/.test(c.t) ? 8 : c.t === "char" ? 1 : 4);
    regions.forEach(([k, , base]) => { let a = base; (mem[k] || []).forEach((c) => { c.a = a; addr[c.n] = a; a += sizeOf(c); }); });
    const hex = (n) => "0x" + n.toString(16);
    const box = h("div", { class: "gb-mem gy-mem", role: "group", "aria-label": "Жад торы" });
    const RCLS = { stack: "gy-stack", heap: "gy-heap", ro: "gy-ro" };
    const arrows = [];
    let ci = 0;
    regions.forEach(([k, title]) => {
      const cells = mem[k] || [];
      if (!cells.length && k !== "stack") return;
      const reg = h("section", { class: "gy-reg " + RCLS[k] }, h("div", { class: "gb-region", text: title }));
      const grid = h("div", { class: "gy-cells" });
      if (!cells.length) grid.appendChild(h("div", { class: "gb-empty", text: "(локал айнымалы жоқ)" }));
      cells.forEach((c) => {
        const isP = c.ptr !== undefined;
        let val = c.v;
        let note = "";
        if (isP) {
          if (c.ptr === null) { val = "NULL"; note = "ешқайда көрсетпейді"; }
          else { val = hex(addr[c.ptr] !== undefined ? addr[c.ptr] : 0); note = "→ " + c.ptr; }
        }
        const cls = "gb-cell" + (isP ? " ptr" : "") + (c.freed ? " freed" : "") + (c.leak ? " leak" : "") + (c.bad ? " bad" : "") + (c.dead ? " dead" : "") + (c.t === "char" ? " chr" : "");
        const flag = c.freed ? "босатылған" : c.leak ? "ағып кеткен" : c.bad ? "қате" : c.dead ? "жарамсыз" : "";
        const cell = h("div", { class: cls, "data-n": c.n, style: `--i:${ci++}` },
          h("div", { class: "gb-addr gy-addr", text: hex(c.a) }),
          h("div", { class: "gb-name" }, h("code", { text: c.n }), h("span", { text: " " + c.t })),
          h("div", { class: "gb-val", text: val }),
          (note || flag) ? h("div", { class: "gb-note", text: [note, flag].filter(Boolean).join(" · ") }) : null);
        grid.appendChild(cell);
        if (isP && c.ptr !== null && addr[c.ptr] !== undefined) arrows.push([c.n, c.ptr]);
      });
      reg.appendChild(grid);
      box.appendChild(reg);
    });
    // көрсеткіш → нысана сызықтары (SVG), орналасу өзгергенде қайта сызылады
    if (arrows.length) {
      const NS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("class", "gy-arrows"); svg.setAttribute("aria-hidden", "true");
      svg.innerHTML = '<defs><marker id="gy-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#5eead4"/></marker></defs>';
      box.appendChild(svg);
      const find = (n) => [...box.querySelectorAll(".gb-cell")].find((e) => e.dataset.n === n);
      const draw = () => {
        if (!box.isConnected) return;
        svg.querySelectorAll("path.ln").forEach((x) => x.remove());
        const br = box.getBoundingClientRect();
        svg.setAttribute("viewBox", `0 0 ${br.width} ${br.height}`);
        arrows.forEach(([from, to]) => {
          const A = find(from), B = find(to); if (!A || !B) return;
          const a = A.getBoundingClientRect(), b = B.getBoundingClientRect();
          const ax = a.left - br.left, ay = a.top - br.top, bx = b.left - br.left, by = b.top - br.top;
          let d;
          if (Math.abs(ay - by) < a.height / 2) { // бір қатар: үстінен доға
            const x1 = ax + a.width / 2, x2 = bx + b.width / 2, y = Math.min(ay, by);
            d = `M${x1} ${y} C${x1} ${y - 26} ${x2} ${y - 26} ${x2} ${y - 2}`;
          } else if (by > ay) { const x1 = ax + a.width / 2, y1 = ay + a.height, x2 = bx + b.width / 2, y2 = by; const m = (y1 + y2) / 2; d = `M${x1} ${y1} C${x1} ${m} ${x2} ${m} ${x2} ${y2 - 2}`; }
          else { const x1 = ax + a.width / 2, y1 = ay, x2 = bx + b.width / 2, y2 = by + b.height; const m = (y1 + y2) / 2; d = `M${x1} ${y1} C${x1} ${m} ${x2} ${m} ${x2} ${y2 + 2}`; }
          const p = document.createElementNS(NS, "path");
          p.setAttribute("class", "ln"); p.setAttribute("d", d); p.setAttribute("marker-end", "url(#gy-ah)");
          svg.appendChild(p);
        });
      };
      box.gyDraw = draw;
      requestAnimationFrame(() => requestAnimationFrame(draw));
      if (window.ResizeObserver) { const ro = new ResizeObserver(() => draw()); ro.observe(box); }
      else window.addEventListener("resize", draw);
    }
    return box;
  }

  G.register({
    id: "memory", title: "Memory Master", icon: "💻", color: "#b45309",
    blurb: "C тілінде көрсеткіштер мен жадты көрнекі жад торы арқылы үйрен.",
    start(stage, ctx) {
      const pick = [].concat(sample(MEM.filter((t) => t.l === 1), 4), sample(MEM.filter((t) => t.l === 2), 4), sample(MEM.filter((t) => t.l === 3), 4));
      let i = 0, ok = 0, answered = false;
      const hud = h("div", { class: "g-hud gy-hud" });
      const body = h("div", { class: "gb-mbody" });
      const res = [];

      function show() {
        const t = pick[i];
        answered = false;
        clear(hud);
        hud.append(h("span", { class: "gy-round", text: `Сұрақ ${i + 1}/${pick.length}` }),
          h("span", { class: "gy-dots", role: "img", "aria-label": `Сұрақ ${i + 1} / ${pick.length}` }, pick.map((_, k) => h("i", { class: (res[k] || "") + (k === i ? " cur" : "") }))),
          h("span", { class: "gy-lvl gy-lv" + t.l, text: `Деңгей ${t.l}` }), h("span", { class: "gy-score", text: `Дұрыс: ${ok}` }));
        const fb = h("div", { class: "g-fb", role: "status", "aria-live": "polite" });
        const after = h("div", { class: "gb-after" });
        const qid = nid("q");

        function resolve(good, given) {
          if (answered) return;
          answered = true;
          if (good) ok++;
          res[i] = good ? "ok" : "bad";
          ctx.sfx && ctx.sfx(good ? "ok" : "bad");
          fb.className = "g-fb " + (good ? "gb-ok" : "gb-no");
          fb.textContent = good ? "✓ Дұрыс!" : "✗ Қате. Дұрыс жауап: " + (t.f ? t.f[0] : t.o[0]);
          after.append(buildMem(t.mem), h("p", { class: "gb-expl" }, h("b", { text: "Түсіндірме: " }), t.e));
          const nb = h("button", { class: "btn gb-next", type: "button" }, i === pick.length - 1 ? "Нәтижені көру" : "Келесі ▸");
          nb.onclick = () => { i++; if (i >= pick.length) fin(); else show(); };
          after.appendChild(nb);
          nb.focus();
        }

        let input;
        if (t.o) {
          const labels = shuffle(t.o);
          input = h("div", { class: "g-opts", role: "group", "aria-labelledby": qid }, labels.map((txt) => {
            const b = h("button", { class: "g-opt", type: "button" }, txt);
            b.onclick = () => {
              if (answered) return;
              const good = txt === t.o[0];
              input.querySelectorAll(".g-opt").forEach((x) => { x.disabled = true; if (x.textContent === t.o[0]) x.classList.add("ok"); });
              if (!good) b.classList.add("bad");
              resolve(good);
            };
            return b;
          }));
        } else {
          const inId = nid("in");
          const inp = h("input", { id: inId, class: "gb-input", type: "text", inputmode: "numeric", autocomplete: "off", maxlength: 8 });
          const go = h("button", { class: "btn", type: "submit" }, "Жауап беру");
          input = h("form", { class: "gb-fill", novalidate: true, onsubmit: (e) => {
            e.preventDefault();
            if (answered || !inp.value.trim()) return;
            const good = t.f.indexOf(inp.value.trim()) >= 0;
            inp.disabled = true; go.disabled = true;
            resolve(good);
          } }, h("label", { for: inId, text: "Жауабың (сан):" }), inp, go);
        }
        clear(body).append(
          codeBlock(t.code),
          h("p", { class: "g-q", id: qid, text: t.q }), input, fb, after);
        if (!t.o) body.querySelector("input").focus();
      }

      function fin() {
        const score = ok * 10 + (ok === pick.length ? 10 : 0);
        ctx.finish({ score, xp: Math.round(score / 2), title: ok === pick.length ? "Жад шебері! 🧠" : "Раунд аяқталды", lines: [`Дұрыс жауап: ${ok} / ${pick.length}`] });
      }
      stage.append(h("div", { class: "gy gy-memory" }, hud, body));
      show();
    },
  });

  /* ============================================================
     3) WEB BUILDER
     ============================================================ */
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const hexRgb = (c) => { const m = HEX.test(c) ? c : "#000000"; return [parseInt(m.slice(1, 3), 16), parseInt(m.slice(3, 5), 16), parseInt(m.slice(5, 7), 16)]; };
  const luma = (c) => { const [r, g, b] = hexRgb(c); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const clampN = (v, a, b, d) => { v = Number(v); return Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : d; };
  const escH = G.esc;

  const WTYPES = {
    h1: { label: "Тақырып", ico: "H1", def: { text: "Менің тақырыбым", fontSize: 32, color: "#14213d", bg: "", align: "left", pad: 4, radius: 0, rotate: 0, w: 0 } },
    p: { label: "Абзац", ico: "¶", def: { text: "Осы жерге абзац мәтінін жаз.", fontSize: 16, color: "#14213d", bg: "", align: "left", pad: 4, radius: 0, rotate: 0, w: 0 } },
    img: { label: "Сурет", ico: "🖼", def: { text: "Сурет", fontSize: 16, color: "#334155", bg: "#cbd5e1", align: "left", pad: 20, radius: 8, rotate: 0, w: 200 } },
    button: { label: "Батырма", ico: "▭", def: { text: "Басу", fontSize: 16, color: "#ffffff", bg: "#00718a", align: "left", pad: 10, radius: 6, rotate: 0, w: 0 } },
    list: { label: "Тізім", ico: "☰", def: { text: "Бірінші\nЕкінші\nҮшінші", fontSize: 16, color: "#14213d", bg: "", align: "left", pad: 4, radius: 0, rotate: 0, w: 0 } },
    link: { label: "Сілтеме", ico: "🔗", def: { text: "Сілтеме мәтіні", fontSize: 16, color: "#0b5ed7", bg: "", align: "left", pad: 4, radius: 0, rotate: 0, w: 0, href: "https://cs50.harvard.edu" } },
    card: { label: "Карточка", ico: "🗂", def: { title: "Карточка атауы", text: "Карточка сипаттамасы.", fontSize: 16, color: "#14213d", bg: "#ffffff", align: "left", pad: 14, radius: 10, rotate: 0, w: 260 } },
  };

  function nodeCss(n, extra) {
    const s = [];
    if (HEX.test(n.color)) s.push("color:" + n.color);
    if (HEX.test(n.bg)) s.push("background:" + n.bg);
    s.push("font-size:" + clampN(n.fontSize, 10, 64, 16) + "px");
    s.push("padding:" + clampN(n.pad, 0, 60, 0) + "px");
    s.push("border-radius:" + clampN(n.radius, 0, 60, 0) + "px");
    const rot = clampN(n.rotate, -30, 30, 0);
    if (rot) s.push("transform:rotate(" + rot + "deg)");
    const w = clampN(n.w, 0, 600, 0);
    if (w) s.push("width:" + w + "px;max-width:100%;box-sizing:border-box");
    return s.join(";") + (extra ? ";" + extra : "");
  }
  function nodeHtml(n) {
    const al = ["left", "center", "right"].indexOf(n.align) >= 0 ? n.align : "left";
    let inner;
    switch (n.type) {
      case "h1": inner = `<h1 style="${nodeCss(n, "margin:0")}">${escH(n.text)}</h1>`; break;
      case "p": inner = `<p style="${nodeCss(n, "margin:0")}">${escH(n.text)}</p>`; break;
      case "img": inner = `<div role="img" aria-label="${escH(n.text)}" style="${nodeCss(n, "display:inline-block;text-align:center")}">${escH(n.text)}</div>`; break;
      case "button": inner = `<button type="button" style="${nodeCss(n, "border:0;font-family:inherit;cursor:pointer")}">${escH(n.text)}</button>`; break;
      case "list": inner = `<ul style="${nodeCss(n, "display:inline-block;text-align:left;margin:0;padding-left:34px")}">${String(n.text).split("\n").filter((x) => x.trim()).map((x) => `<li>${escH(x)}</li>`).join("")}</ul>`; break;
      case "link": inner = `<a href="${/^https?:\/\//i.test(n.href || "") ? escH(n.href) : "#"}" style="${nodeCss(n, "display:inline-block")}">${escH(n.text)}</a>`; break;
      default: inner = `<div style="${nodeCss(n, "display:inline-block;text-align:left;border:1px solid #cbd5e1")}"><strong style="display:block;margin-bottom:6px">${escH(n.title)}</strong>${escH(n.text)}</div>`;
    }
    return `<div style="text-align:${al};margin:8px 0">${inner}</div>`;
  }
  function buildPage(nodes, pageBg) {
    return `<!DOCTYPE html>\n<html lang="kk">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Менің бетім</title>\n<style>body{font-family:system-ui,sans-serif;margin:0;padding:16px;background:${HEX.test(pageBg) ? pageBg : "#ffffff"};color:#14213d}</style>\n</head>\n<body>\n${nodes.map(nodeHtml).join("\n")}\n</body>\n</html>\n`;
  }

  const WTASKS = [
    { title: "Қызыл тақырып", goal: "Бетке қызыл түсті тақырып (H1) қос.", reqs: [
      ["Тақырып (H1) бар", (m) => m.some((n) => n.type === "h1")],
      ["Тақырыптың түсі қызыл", (m) => m.some((n) => n.type === "h1" && (([r, g, b]) => r >= 170 && g <= 100 && b <= 100)(hexRgb(n.color)))]] },
    { title: "Ортадағы батырма", goal: "Бетке батырма қос және оны ортаға орналастыр (туралау: ортасы).", reqs: [
      ["Батырма бар", (m) => m.some((n) => n.type === "button")],
      ["Батырма ортасында", (m) => m.some((n) => n.type === "button" && n.align === "center")]] },
    { title: "Тізім", goal: "Кемінде 3 жолдан тұратын тізім жаса (әр жол жаңа жолдан).", reqs: [
      ["Тізім бар", (m) => m.some((n) => n.type === "list")],
      ["Тізімде 3 немесе одан көп тармақ бар", (m) => m.some((n) => n.type === "list" && String(n.text).split("\n").filter((x) => x.trim()).length >= 3)]] },
    { title: "Көк карточка", goal: "Фоны көк, ал мәтіні ашық (ақ) түсті карточка жаса.", reqs: [
      ["Карточка бар", (m) => m.some((n) => n.type === "card")],
      ["Карточка фоны көк", (m) => m.some((n) => n.type === "card" && (([r, g, b]) => b >= 140 && b > r + 50 && b > g + 20)(hexRgb(n.bg)))],
      ["Карточка мәтіні ашық түсті", (m) => m.some((n) => n.type === "card" && luma(n.color) >= 190)]] },
    { title: "Профиль беті", goal: "Тақырып (өлшемі кемінде 32), сурет, абзац және бұрыштары дөңгеленген (кемінде 12) батырмасы бар бет құрастыр.", reqs: [
      ["Тақырып бар, өлшемі ≥ 32", (m) => m.some((n) => n.type === "h1" && n.fontSize >= 32)],
      ["Сурет бар", (m) => m.some((n) => n.type === "img")],
      ["Абзац бар", (m) => m.some((n) => n.type === "p")],
      ["Батырма бар, бұрыш радиусы ≥ 12", (m) => m.some((n) => n.type === "button" && n.radius >= 12)]] },
  ];

  G.register({
    id: "webbuilder", title: "Web Builder", icon: "🌐", color: "#7c3aed",
    blurb: "HTML/CSS элементтерінен бет құрастыр: 5 мақсат және еркін режим.",
    start(stage, ctx) {
      const modes = WTASKS.map((_, i) => "t" + i).concat("free");
      const models = {}; const sel = {}; const pageBg = {};
      modes.forEach((m) => { models[m] = []; sel[m] = -1; pageBg[m] = "#ffffff"; });
      const solvedSet = new Set();
      let mode = "t0", seq = 0, dragKind = "";
      const tabs = h("div", { class: "gb-tabs", role: "group", "aria-label": "Тапсырма таңдау" });
      const goal = h("div", { class: "gb-goal" });
      const palette = h("div", { class: "gb-palette", role: "group", "aria-label": "Элементтер палитрасы" });
      const outline = h("ul", { class: "gb-outline", "aria-label": "Беттегі элементтер" });
      const props = h("div", { class: "gb-props" });
      const frame = h("iframe", { class: "gb-frame", sandbox: "", title: "Бетті алдын ала көру", loading: "eager" });
      const src = h("textarea", { class: "gb-src", readonly: true, rows: 8, "aria-label": "Жасалған HTML коды", spellcheck: "false" });
      const checkFb = h("div", { class: "g-fb", role: "status", "aria-live": "polite" });
      const reqList = h("ul", { class: "gb-reqs", "aria-label": "Талаптар" });
      const live = h("div", { class: "gb-sr", role: "status", "aria-live": "polite" });

      const cur = () => models[mode];
      const selNode = () => cur()[sel[mode]] || null;

      function refreshPreview() {
        const html = buildPage(cur(), pageBg[mode]);
        frame.srcdoc = html;
        src.value = html;
      }
      function add(type) {
        const d = Object.assign({}, WTYPES[type].def);
        d.type = type; d.id = ++seq;
        cur().push(d); sel[mode] = cur().length - 1;
        live.textContent = WTYPES[type].label + " қосылды.";
        renderOutline(); renderProps(); refreshPreview();
      }
      function renderPalette() {
        clear(palette);
        Object.keys(WTYPES).forEach((k) => {
          const b = h("div", { class: "gb-pal gy-pal", role: "button", tabindex: "0", draggable: "true", "aria-label": WTYPES[k].label + " қосу" },
            h("span", { class: "gb-pal-ico", "aria-hidden": "true", text: WTYPES[k].ico }), h("span", { class: "gy-pal-lbl", text: WTYPES[k].label }));
          b.dataset.type = k;
          b.onclick = () => add(k);
          b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); add(k); } });
          b.addEventListener("dragstart", (e) => { dragKind = k; try { e.dataTransfer.setData("text/plain", "gb:" + k); e.dataTransfer.effectAllowed = "copy"; } catch (x) {} });
          palette.appendChild(b);
        });
      }
      function shortText(n) { return (n.type === "card" ? n.title : String(n.text).split("\n")[0]).slice(0, 24); }
      function renderOutline() {
        clear(outline);
        const m = cur();
        if (!m.length) outline.appendChild(h("li", { class: "gb-hint-empty", text: "Бет бос. Палитрадан элемент қос немесе осы жерге сүйреп әкел." }));
        m.forEach((n, i) => {
          const on = i === sel[mode];
          outline.appendChild(h("li", { class: "gb-row" + (on ? " on" : "") },
            h("button", { class: "gb-sel", type: "button", "aria-pressed": on ? "true" : "false", onclick: () => { sel[mode] = i; renderOutline(); renderProps(); } },
              h("b", { text: WTYPES[n.type].label }), " ", h("span", { class: "gb-short", text: shortText(n) })),
            h("button", { class: "gb-mini", type: "button", "aria-label": "Жоғары жылжыту", disabled: i === 0, onclick: () => mv(i, -1) }, "↑"),
            h("button", { class: "gb-mini", type: "button", "aria-label": "Төмен жылжыту", disabled: i === m.length - 1, onclick: () => mv(i, 1) }, "↓"),
            h("button", { class: "gb-mini gb-del", type: "button", "aria-label": WTYPES[n.type].label + " жою", onclick: () => rm(i) }, "✕")));
        });
      }
      function mv(i, d) { const m = cur(); const j = i + d; if (j < 0 || j >= m.length) return; [m[i], m[j]] = [m[j], m[i]]; sel[mode] = j; renderOutline(); refreshPreview(); }
      function rm(i) { const m = cur(); m.splice(i, 1); sel[mode] = Math.min(sel[mode], m.length - 1); renderOutline(); renderProps(); refreshPreview(); }

      function field(label, control) { const id = nid("f"); control.id = id; return h("div", { class: "gb-field" }, h("label", { for: id, text: label }), control); }
      function range(label, key, min, max, unit) {
        const n = selNode();
        const out = h("output", { class: "gb-out-v", text: n[key] + unit });
        const r = h("input", { type: "range", min, max, step: 1, value: n[key] });
        const fill = () => r.style.setProperty("--p", ((Number(r.value) - min) / (max - min) * 100) + "%");
        fill();
        r.addEventListener("input", () => { n[key] = Number(r.value); out.textContent = r.value + unit; fill(); refreshPreview(); });
        const f = field(label, r); f.appendChild(out); return f;
      }
      function renderProps() {
        clear(props);
        const n = selNode();
        props.appendChild(h("h4", { class: "gy-ph", text: "Қасиеттері" }));
        if (!n) { props.appendChild(h("p", { class: "gb-muted gy-pempty" }, h("span", { "aria-hidden": "true", text: "👆" }), " Өзгерту үшін элементті таңда немесе палитрадан жаңасын қос.")); return; }
        props.appendChild(h("div", { class: "gy-sel-chip" }, h("span", { class: "gy-sel-ico", "aria-hidden": "true", text: WTYPES[n.type].ico }), h("b", { text: WTYPES[n.type].label })));
        const upd = () => { renderOutline(); refreshPreview(); };
        if (n.type === "card") { const t = h("input", { type: "text", maxlength: 60, value: n.title }); t.addEventListener("input", () => { n.title = t.value; upd(); }); props.appendChild(field("Карточка атауы", t)); }
        const txt = (n.type === "list" || n.type === "card" || n.type === "p") ? h("textarea", { rows: n.type === "list" ? 4 : 3, maxlength: 400 }) : h("input", { type: "text", maxlength: 80 });
        txt.value = n.text; txt.addEventListener("input", () => { n.text = txt.value; upd(); });
        props.appendChild(field(n.type === "list" ? "Тізім тармақтары (әр жол - бір тармақ)" : "Мәтін", txt));
        if (n.type === "link") { const u = h("input", { type: "url", maxlength: 120, value: n.href }); u.addEventListener("input", () => { n.href = u.value; refreshPreview(); }); props.appendChild(field("Сілтеме мекенжайы (https://...)", u)); }
        const col = (label, key, allowEmpty) => {
          const c = h("input", { type: "color", value: HEX.test(n[key]) ? n[key] : "#ffffff" });
          c.addEventListener("input", () => { n[key] = c.value; refreshPreview(); });
          const f = field(label, c);
          if (allowEmpty) { const x = h("button", { class: "gb-mini", type: "button", "aria-label": label + " өшіру", onclick: () => { n[key] = ""; refreshPreview(); } }, "∅"); f.appendChild(x); }
          return f;
        };
        props.appendChild(h("div", { class: "gy-grp", text: "Түстер" }));
        props.append(col("Мәтін түсі", "color"), col("Фон түсі", "bg", true));
        props.appendChild(h("div", { class: "gy-grp", text: "Өлшем және пішін" }));
        props.appendChild(range("Шрифт өлшемі", "fontSize", 10, 64, "px"));
        const al = h("select", null, [["left", "Сол жақ"], ["center", "Ортасы"], ["right", "Оң жақ"]].map(([v, t]) => h("option", { value: v, selected: n.align === v, text: t })));
        al.addEventListener("change", () => { n.align = al.value; refreshPreview(); });
        props.appendChild(field("Туралау", al));
        props.append(range("Ішкі шет (padding)", "pad", 0, 60, "px"), range("Бұрыш радиусы", "radius", 0, 60, "px"), range("Айналдыру", "rotate", -30, 30, "°"));
        if (n.type !== "h1" && n.type !== "p") props.appendChild(range("Ені (0 = авто)", "w", 0, 600, "px"));
      }

      const bar = h("div", { class: "gy-wbprog", role: "progressbar", "aria-label": "Мақсат орындалуы", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "0" }, h("i"), h("b"));
      function reqBar(a, n) { const pc = n ? Math.round(a / n * 100) : 0; bar.setAttribute("aria-valuenow", pc); bar.firstChild.style.width = pc + "%"; bar.lastChild.textContent = `${a} / ${n} талап`; }
      function renderTabs() {
        clear(tabs);
        modes.forEach((m, i) => {
          const isFree = m === "free";
          const b = h("button", { class: "gb-tab" + (m === mode ? " on" : ""), type: "button", "aria-pressed": m === mode ? "true" : "false", onclick: () => { mode = m; renderAll(); } },
            isFree ? "Еркін режим" : `${i + 1}. ${WTASKS[i].title}`, solvedSet.has(m) ? " ✓" : "");
          tabs.appendChild(b);
        });
      }
      function renderGoal() {
        clear(goal); clear(reqList); clear(checkFb); checkFb.className = "g-fb";
        if (mode === "free") { goal.append(h("p", { class: "g-q", text: "Еркін режим: ойыңдағы бетті құрастыр. Тексеру жоқ, бірақ HTML кодын көшіріп не жүктеп ала аласың." })); return; }
        const t = WTASKS[+mode.slice(1)];
        goal.append(h("p", { class: "g-q gy-goalq" }, h("b", { text: "Мақсат: " }), t.goal));
        t.reqs.forEach(([txt]) => reqList.appendChild(h("li", { class: "gb-req", text: "○ " + txt })));
        reqBar(0, t.reqs.length);
      }
      function check() {
        if (mode === "free") return;
        const t = WTASKS[+mode.slice(1)];
        clear(reqList);
        let all = true;
        let nOk = 0;
        t.reqs.forEach(([txt, fn]) => { const ok = !!fn(cur()); if (!ok) all = false; else nOk++; reqList.appendChild(h("li", { class: "gb-req " + (ok ? "ok" : "no"), text: (ok ? "✓ " : "✗ ") + txt })); });
        reqBar(nOk, t.reqs.length);
        ctx.sfx && ctx.sfx(all ? "win" : "bad");
        if (all) { solvedSet.add(mode); checkFb.className = "g-fb gb-ok"; checkFb.textContent = "🎉 Мақсат орындалды!"; renderTabs(); }
        else { checkFb.className = "g-fb gb-no"; checkFb.textContent = "Әлі толық емес: ✗ белгіленген талаптарды орында."; }
      }
      function copyHtml() {
        const html = src.value;
        const done = () => { live.textContent = "HTML коды көшірілді."; checkFb.className = "g-fb gb-ok"; checkFb.textContent = "📋 HTML коды көшірілді."; };
        const fallback = () => { src.removeAttribute("readonly"); src.select(); try { document.execCommand("copy"); done(); } catch (e) { checkFb.textContent = "Көшіру мүмкін болмады: кодты өзің белгілеп көшір."; } src.setAttribute("readonly", ""); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(html).then(done, fallback); else fallback();
      }
      function download() {
        const blob = new Blob([src.value], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = h("a", { href: url, download: "my-page.html" });
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        live.textContent = "my-page.html жүктелді.";
      }
      function renderAll() { renderTabs(); renderGoal(); renderOutline(); renderProps(); refreshPreview(); bgInput.value = pageBg[mode]; }

      const bgInput = h("input", { type: "color", value: "#ffffff", id: nid("bg"), "aria-label": "Бет фоны" });
      bgInput.addEventListener("input", () => { pageBg[mode] = bgInput.value; refreshPreview(); });

      outline.addEventListener("dragover", (e) => { e.preventDefault(); outline.classList.add("drop"); });
      outline.addEventListener("dragleave", () => outline.classList.remove("drop"));
      outline.addEventListener("drop", (e) => {
        e.preventDefault(); outline.classList.remove("drop");
        let d = ""; try { d = e.dataTransfer.getData("text/plain"); } catch (x) {}
        const k = d.indexOf("gb:") === 0 ? d.slice(3) : dragKind;
        dragKind = "";
        if (WTYPES[k]) add(k);
      });

      const finishBtn = h("button", { class: "btn", type: "button", onclick: () => {
        const n = solvedSet.size;
        ctx.finish({ score: n * 20, xp: n * 10, title: n === 5 ? "Барлық мақсат орындалды! 🌐" : "Сессия аяқталды", lines: [`Орындалған мақсат: ${n} / 5`] });
      } }, "Аяқтау және ұпай алу");

      renderPalette();
      const panelTabs = h("div", { class: "gy-ptabs", role: "group", "aria-label": "Панельдер" });
      const wb = h("div", { class: "gy gy-wb", "data-panel": "pal" });
      [["pal", "🧩 Палитра"], ["out", "📑 Элементтер"], ["prop", "🎛 Қасиеттер"]].forEach(([k, lbl]) => {
        const b = h("button", { type: "button", class: "gy-ptab", "aria-pressed": k === "pal" ? "true" : "false", onclick: () => { wb.dataset.panel = k; panelTabs.querySelectorAll(".gy-ptab").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false")); } }, lbl);
        panelTabs.appendChild(b);
      });
      wb.append(
        tabs, goal, bar,
        h("div", { class: "gb-layout gy-layout" },
          h("div", { class: "gb-left gy-col gy-col-l" },
            h("div", { class: "gy-panel", "data-p": "pal" }, h("h4", { text: "Палитра" }), palette),
            h("div", { class: "gy-panel", "data-p": "out" }, h("h4", { text: "Бет элементтері" }), outline,
              h("div", { class: "gb-field gy-bgf" }, h("label", { for: bgInput.id, text: "Бет фоны" }), bgInput))),
          h("div", { class: "gb-right gy-col gy-col-m" },
            h("div", { class: "gy-browser" },
              h("div", { class: "gy-etitle" }, h("span", { class: "gy-lights", "aria-hidden": "true" }, h("i"), h("i"), h("i")), h("span", { class: "gy-url" }, h("span", { "aria-hidden": "true", text: "🔒" }), " https://менің-бетім.kz/index.html")),
              frame),
            h("div", { class: "gb-btns" },
              h("button", { class: "btn", type: "button", onclick: check }, "✔ Тексеру"),
              h("button", { class: "btn secondary gb-copy", type: "button", onclick: copyHtml }, "📋 HTML көшіру"),
              h("button", { class: "btn secondary gb-dl", type: "button", onclick: download }, "⬇ Жүктеу"),
              finishBtn),
            reqList, checkFb,
            h("details", { class: "gb-code" }, h("summary", { text: "HTML кодын көрсету" }), src)),
          h("div", { class: "gy-col gy-col-r" }, h("div", { class: "gy-panel", "data-p": "prop" }, props))),
        live);
      stage.append(wb);
      wb.insertBefore(panelTabs, wb.querySelector(".gy-layout"));
      renderAll();
    },
  });

  /* ============================================================
     4) BINARY CHALLENGE
     ============================================================ */
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const toBin = (n, w) => n.toString(2).padStart(w, "0");
  const grp = (s) => (s.length > 4 ? s.slice(0, s.length - 4) + " " + s.slice(-4) : s);
  const pBin = (s) => (/^[01]{1,16}$/.test(s) ? parseInt(s, 2) : NaN);
  const pDec = (s) => (/^\d{1,5}$/.test(s) ? parseInt(s, 10) : NaN);
  const pHex = (s) => { s = s.replace(/^0x/, ""); return /^[0-9a-f]{1,4}$/.test(s) ? parseInt(s, 16) : NaN; };
  const norm = (s) => String(s).trim().toLowerCase().replace(/[\s_]/g, "");

  /** Сұрақ генераторы: деңгей 1..3. Қайтарады {kind, prompt, mode, ans, check(str|number)} */
  function genBinary(level) {
    const kinds = level === 1 ? ["b2d", "d2b", "h2d", "bits", "op"] : level === 2 ? ["b2d", "d2b", "h2d", "d2h", "bits", "op"] : ["b2d", "d2b", "d2h", "b2h", "h2b", "bits", "op", "shift"];
    const kind = kinds[rnd(0, kinds.length - 1)];
    const max = level === 1 ? 15 : 255;
    let n, a, b;
    switch (kind) {
      case "b2d": n = rnd(level === 1 ? 1 : 16, max); return { kind, mode: "text", prompt: `${grp(toBin(n, level === 1 ? 4 : 8))}₂ = ? (ондық)`, ans: String(n), check: (s) => pDec(norm(s)) === n };
      case "d2b": n = rnd(level === 1 ? 1 : 16, max); return { kind, mode: "text", prompt: `${n}₁₀ = ? (екілік${level === 1 ? "" : ", 8 бит"})`, ans: toBin(n, level === 1 ? 4 : 8), check: (s) => pBin(norm(s)) === n };
      case "h2d": n = rnd(level === 1 ? 1 : 16, level === 1 ? 15 : 255); return { kind, mode: "text", prompt: `0x${n.toString(16).toUpperCase()} = ? (ондық)`, ans: String(n), check: (s) => pDec(norm(s)) === n };
      case "d2h": n = rnd(16, 255); return { kind, mode: "text", prompt: `${n}₁₀ = ? (он алтылық, 0x-сіз)`, ans: n.toString(16).toUpperCase(), check: (s) => pHex(norm(s)) === n };
      case "b2h": n = rnd(16, 255); return { kind, mode: "text", prompt: `${grp(toBin(n, 8))}₂ = ? (он алтылық)`, ans: n.toString(16).toUpperCase(), check: (s) => pHex(norm(s)) === n };
      case "h2b": n = rnd(16, 255); return { kind, mode: "text", prompt: `0x${n.toString(16).toUpperCase()} = ? (екілік, 8 бит)`, ans: toBin(n, 8), check: (s) => pBin(norm(s)) === n };
      case "bits": n = rnd(1, max); return { kind, mode: "bits", width: level === 1 ? 4 : 8, prompt: `Биттерді басып ${n} санын жина`, ans: n, check: (v) => v === n };
      case "shift": a = rnd(1, 15); { const k = rnd(1, 3); n = a << k; return { kind, mode: "text", prompt: `${a} << ${k} = ? (ондық)`, ans: String(n), check: (s) => pDec(norm(s)) === n }; }
      default: {
        const w = level === 3 ? 8 : 4, op = level === 1 ? ["AND", "OR"][rnd(0, 1)] : ["AND", "OR", "XOR"][rnd(0, 2)];
        a = rnd(1, (1 << w) - 1); b = rnd(1, (1 << w) - 1);
        n = op === "AND" ? a & b : op === "OR" ? a | b : a ^ b;
        return { kind: "op", mode: "text", prompt: `${grp(toBin(a, w))} ${op} ${grp(toBin(b, w))} = ? (ондық)`, ans: String(n), check: (s) => pDec(norm(s)) === n };
      }
    }
  }

  let binCurrent = null;
  G.register({
    id: "binary", title: "Binary Challenge", icon: "🔢", color: "#16a34a",
    blurb: "60 секунд: екілік, ондық, он алтылық және биттік амалдар. Серия жина!",
    start(stage, ctx) {
      ctx.intro({
        lead: "<b>60 секунд</b>: екілік, ондық және он алтылық сандар, биттік амалдар.",
        rules: [["💡", "Биттер сұрағында лампаларды басып санды жина"], ["⌨️", "Басқа сұрақтарда жауапты жазып, Enter бас"], ["🔥", "Қатарынан дұрыс жауап = серия бонусы, деңгей өседі"]],
      }).onclick = () => { ctx.sfx("tick"); play(stage, ctx); };
    },
  });
  function play(stage, ctx) {
    {
      const DUR = 60000;
      let correct = 0, total = 0, score = 0, streak = 0, bestStreak = 0, over = false, q = null, bits = [];
      const t0 = Date.now();
      stage.textContent = "";
      const hud = h("div", { class: "g-hud" });
      const sc = h("span", { text: "Ұпай: 0" }), st = h("span", { text: "Серия: 0" }), lv = h("span", { text: "Деңгей 1" }), tm = h("span", { class: "g-time", text: "60 с" });
      hud.append(sc, st, lv, tm);
      const barI = h("i"), bar = h("div", { class: "g-bar", "aria-hidden": "true" }, barI);
      const fb = h("div", { class: "g-fb", role: "status", "aria-live": "polite" });
      const qEl = h("p", { class: "g-q gb-bq", id: nid("bq") });
      const area = h("div", { class: "gb-barea" });
      const form = h("form", { class: "gb-bform", novalidate: true });
      const level = () => Math.min(3, 1 + Math.floor(correct / 4));

      function next() {
        q = genBinary(level()); binCurrent = q;
        bits = q.mode === "bits" ? new Array(q.width).fill(0) : [];
        qEl.textContent = q.prompt;
        clear(area);
        if (q.mode === "bits") {
          const row = h("div", { class: "gb-bits", role: "group", "aria-label": "Биттер" });
          row.style.setProperty("--w", q.width); row.style.setProperty("--wm", Math.min(4, q.width));
          const sum = h("div", { class: "gb-sum", "aria-live": "off", text: "Қазіргі мән: 0" });
          bits.forEach((_, i) => {
            const wgt = 1 << (q.width - 1 - i);
            const b = h("button", { class: "gb-bit", type: "button", "aria-pressed": "false", "aria-label": `${wgt} биті` }, h("span", { class: "gb-lamp", "aria-hidden": "true" }), h("small", { text: String(wgt) }), h("b", { text: "0" }));
            b.onclick = () => { ctx.sfx("tick"); bits[i] ^= 1; b.setAttribute("aria-pressed", bits[i] ? "true" : "false"); b.querySelector("b").textContent = bits[i]; sum.textContent = "Қазіргі мән: " + val(); };
            row.appendChild(b);
          });
          area.append(row, sum);
          area.appendChild(h("button", { class: "btn gb-send", type: "submit" }, "Жіберу"));
        } else {
          const id = nid("ans");
          const inp = h("input", { id, class: "gb-input gb-answer", type: "text", inputmode: /^(b2d|h2d|op|shift)$/.test(q.kind) ? "numeric" : "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", maxlength: 12, "aria-describedby": qEl.id });
          area.append(h("label", { for: id, text: "Жауабың (Enter - жіберу):" }), h("div", { class: "gb-row2" }, inp, h("button", { class: "btn gb-send", type: "submit" }, "Жіберу")));
          setTimeout(() => inp.focus(), 0);
        }
      }
      const val = () => bits.reduce((s, b) => s * 2 + b, 0);

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (over) return;
        const lvl = level();
        const given = q.mode === "bits" ? val() : (form.querySelector(".gb-answer").value || "");
        if (q.mode === "text" && !String(given).trim()) return;
        total++;
        if (q.check(given)) {
          const gain = 10 * lvl + Math.min(streak, 10) * 2;
          correct++; streak++; score += gain; bestStreak = Math.max(bestStreak, streak);
          fb.className = "g-fb gb-ok"; fb.textContent = `✓ Дұрыс! +${gain}` + (streak >= 3 ? ` (серия ×${streak})` : ""); ctx.sfx("ok");
        } else {
          streak = 0;
          fb.className = "g-fb gb-no"; fb.textContent = `✗ Дұрыс жауап: ${q.ans}`; ctx.sfx("bad");
        }
        sc.textContent = "Ұпай: " + score; st.textContent = "Серия: " + streak; lv.textContent = "Деңгей " + level();
        next();
      });
      form.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.classList && e.target.classList.contains("gb-bit")) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true })); } });

      const timer = setInterval(() => {
        if (!stage.isConnected) { clearInterval(timer); over = true; return; }
        const left = Math.max(0, DUR - (Date.now() - t0));
        barI.style.width = (left / DUR * 100) + "%";
        tm.textContent = Math.ceil(left / 1000) + " с";
        if (left <= 0) {
          clearInterval(timer); over = true;
          ctx.finish({ score, max: 350, xp: Math.min(100, Math.round(score / 3)), title: "Уақыт бітті! ⏱", lines: [`Дұрыс жауап: ${correct} / ${total}`, `Ең ұзақ серия: ${bestStreak}`, `Жеткен деңгей: ${level()}`] });
        }
      }, 200);

      form.append(qEl, area);
      stage.append(hud, bar, form, fb);
      next();
    }
  }

  window.CS50GamesB = {
    counts: { sqlRooms: ROOMS.length, memoryTasks: MEM.length, webTasks: WTASKS.length },
    memory: MEM,
    binary: { gen: genBinary, current: () => binCurrent },
    sql: { rooms: ROOMS, vet: vetSql, explain: explainSqlError },
    web: { build: buildPage },
  };
})();
