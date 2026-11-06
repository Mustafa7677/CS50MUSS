/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* CS Universe: ДҚ сұрау жоспарлаушысы (academy/labs/database.html).
   ОҚУ МОДЕЛІ (нағыз ДҚБЖ оптимизаторы емес - бетте де айтылады):
   - B+ ағаш: жапырақта 4 жазба, ішкі түйінде 4 бала; кілттер (мән, rowid) бойынша сұрыпталып, төменнен жоғары тығыз құрылады.
   - Кесте өзі - id бойынша B+ ағаш (SQLite-тағы rowid кестесі сияқты): id бойынша іздегенде жол жапырақта тұр.
   - Құн = сканерленген жолдар + барылған B-ағаш түйіндері. Толық сканерлеу: N. Қосымша индекс: индекс түйіндері +
     әр табылған жол үшін кесте ағашымен түсу (h_кесте түйін). id бойынша: тек түйіндер.
   - JOIN: nested loop = сыртқы құн + |сыртқы| × N_ішкі; hash = сыртқы құн + N_ішкі (хэш құру) + |сыртқы| (зондтар);
     index join = сыртқы құн + Σ ішкі индекс іздеуі. ORDER BY барлық жоспарға бірдей k·⌈log2 k⌉ қосады.
   - Мәтін кілттері Unicode кодтық нүкте ретімен салыстырылады. Парсер - өзіміздің токенизатор мен рекурсивті түсу (eval жоқ). */
(() => {
  "use strict";
  const C = window.CSB, T = () => window.AO17Tutor;
  if (!C) return;
  const { el, rng, pick } = C;
  const SVGNS = "http://www.w3.org/2000/svg";
  const sv = (tag, a = {}, text) => { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); if (text != null) e.textContent = text; return e; };

  // ================================================================ деректер
  const ST = [
    [1, "Айгерім", "Алматы", 9, 1, 87], [2, "Нұрлан", "Астана", 9, 1, 64], [3, "Дана", "Шымкент", 9, 1, 92], [4, "Ерасыл", "Алматы", 9, 1, 71],
    [5, "Аружан", "Алматы", 9, 2, 58], [6, "Темірлан", "Астана", 9, 2, 95], [7, "Мадина", "Алматы", 9, 2, 77], [8, "Санжар", "Шымкент", 9, 2, 49],
    [9, "Әсем", "Астана", 10, 3, 83], [10, "Бауыржан", "Алматы", 10, 3, 66], [11, "Жанель", "Алматы", 10, 3, 90], [12, "Қуаныш", "Шымкент", 10, 3, 55],
    [13, "Томирис", "Астана", 10, 3, 73], [14, "Ержан", "Алматы", 10, 4, 61], [15, "Айгерім", "Шымкент", 10, 4, 98], [16, "Ислам", "Астана", 10, 4, 69],
    [17, "Зарина", "Алматы", 10, 4, 80], [18, "Арман", "Астана", 11, 5, 52], [19, "Нұрсұлтан", "Шымкент", 11, 5, 88], [20, "Інжу", "Алматы", 11, 5, 75],
    [21, "Ақбота", "Астана", 11, 5, 93], [22, "Дәулет", "Шымкент", 11, 6, 46], [23, "Камила", "Алматы", 11, 6, 84], [24, "Алихан", "Астана", 11, 6, 67],
  ];
  const CL = [[1, "9А", "Сапарова"], [2, "9Ә", "Омаров"], [3, "10А", "Бекова"], [4, "10Ә", "Жақсылықов"], [5, "11А", "Тұрсынова"], [6, "11Ә", "Омаров"]];
  const SCHEMA = {
    students: { cols: ["id", "name", "city", "year", "class_id", "score"], num: { id: 1, year: 1, class_id: 1, score: 1 }, rows: ST.map((r) => ({ id: r[0], name: r[1], city: r[2], year: r[3], class_id: r[4], score: r[5] })) },
    classes: { cols: ["id", "title", "teacher"], num: { id: 1 }, rows: CL.map((r) => ({ id: r[0], title: r[1], teacher: r[2] })) },
  };
  const LEAF = 4, FAN = 4;
  const cmp = (a, b) => (typeof a === "number" && typeof b === "number" ? a - b : String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0);

  // ================================================================ B+ ағаш
  const TREES = {};
  function tree(table, col) {
    const key = table + "." + col; if (TREES[key]) return TREES[key];
    const ents = SCHEMA[table].rows.map((r) => ({ k: r[col], rid: r.id })).sort((a, b) => cmp(a.k, b.k) || a.rid - b.rid);
    let level = []; let id = 0;
    for (let i = 0; i < ents.length; i += LEAF) level.push({ id: id++, leaf: true, ents: ents.slice(i, i + LEAF), min: ents[i].k });
    const leaves = level.slice(); leaves.forEach((l, i) => (l.next = leaves[i + 1] || null));
    const levels = [level];
    while (level.length > 1) {
      const up = [];
      for (let i = 0; i < level.length; i += FAN) { const ch = level.slice(i, i + FAN); up.push({ id: id++, leaf: false, ch, seps: ch.slice(1).map((c) => c.min), min: ch[0].min }); }
      level = up; levels.unshift(level);
    }
    const t = { table, col, levels, leaves, root: levels[0][0], h: levels.length, pk: col === "id" };
    TREES[key] = t; return t;
  }
  /** Аралық бойынша іздеу. iv = { lo, loInc, hi, hiInc } (undefined - шексіз). Қайтарады: { path, extra, visited, matches } */
  function lookup(t, iv) {
    const below = (k) => iv.lo !== undefined && (cmp(k, iv.lo) < 0 || (cmp(k, iv.lo) === 0 && !iv.loInc));
    const above = (k) => iv.hi !== undefined && (cmp(k, iv.hi) > 0 || (cmp(k, iv.hi) === 0 && !iv.hiInc));
    const path = []; let n = t.root;
    while (true) {
      path.push(n);
      if (n.leaf) break;
      let i = 0;
      if (iv.lo !== undefined) i = n.seps.filter((s) => (iv.loInc ? cmp(s, iv.lo) < 0 : cmp(s, iv.lo) <= 0)).length;
      n = n.ch[i];
    }
    const matches = [], extra = [], hitsBy = new Map();
    let leaf = n, stop = false;
    while (leaf && !stop) {
      for (const e of leaf.ents) { if (below(e.k)) continue; if (above(e.k)) { stop = true; break; } matches.push(e.rid); hitsBy.set(leaf.id, (hitsBy.get(leaf.id) || 0) + 1); }
      if (!stop && leaf.next) { leaf = leaf.next; extra.push(leaf); } else break;
    }
    return { path, extra, visited: path.length + extra.length, matches, hitsBy };
  }

  // ================================================================ парсер
  const KW = new Set(["SELECT", "FROM", "WHERE", "AND", "JOIN", "INNER", "ON", "ORDER", "BY", "ASC", "DESC", "AS"]);
  class SqlErr extends Error { constructor(msg, pos) { super(msg); this.pos = pos; } }
  function lex(src) {
    const out = []; let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === "'") { let j = i + 1, s = ""; while (j < src.length && src[j] !== "'") s += src[j++]; if (j >= src.length) throw new SqlErr("Жолдық мән жабылмаған: тырнақша ' жетіспейді.", i); out.push({ t: "str", v: s, pos: i }); i = j + 1; continue; }
      if (/[0-9]/.test(c)) { let j = i; while (j < src.length && /[0-9]/.test(src[j])) j++; out.push({ t: "num", v: +src.slice(i, j), pos: i }); i = j; continue; }
      if (/[A-Za-z_]/.test(c)) { let j = i; while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++; const w = src.slice(i, j); out.push(KW.has(w.toUpperCase()) ? { t: "kw", v: w.toUpperCase(), pos: i } : { t: "id", v: w.toLowerCase(), pos: i }); i = j; continue; }
      const two = src.slice(i, i + 2);
      if (["<=", ">=", "!=", "<>"].includes(two)) { out.push({ t: "op", v: two === "<>" ? "!=" : two, pos: i }); i += 2; continue; }
      if ("=<>".includes(c)) { out.push({ t: "op", v: c, pos: i }); i++; continue; }
      if (",.*;".includes(c)) { out.push({ t: c, v: c, pos: i }); i++; continue; }
      if (c === '"') throw new SqlErr("Мәтін мәндері SQL-де жалғыз тырнақшамен жазылады: 'Алматы' (\" емес).", i);
      if (/[А-Яа-яӘәІіҢңҒғҮүҰұҚқӨөҺһЁё]/.test(c)) throw new SqlErr("Кириллица тек мәтін мәнінің ішінде болады: 'Алматы'. Кесте мен баған аттары латынша (students, city).", i);
      throw new SqlErr(`Танылмаған таңба «${c}». Бұл шағын SQL тек SELECT, FROM, WHERE, AND, JOIN ... ON, ORDER BY қолдайды.`, i);
    }
    out.push({ t: "eof", pos: src.length });
    return out;
  }
  function parse(src) {
    const tk = lex(src); let p = 0;
    const peek = () => tk[p], next = () => tk[p++];
    const isKw = (v) => peek().t === "kw" && peek().v === v;
    const need = (v, msg) => { if (!isKw(v)) throw new SqlErr(msg || `Мұнда ${v} күтілді.`, peek().pos); next(); };
    const ident = (what) => { const t = next(); if (t.t !== "id") throw new SqlErr(`Мұнда ${what} аты күтілді${t.t === "kw" ? ` (${t.v} - кілт сөз)` : ""}.`, t.pos); return t; };
    const colRef = () => { const a = ident("баған"); if (peek().t === ".") { next(); const b = ident("баған"); return { q: a.v, c: b.v, pos: a.pos }; } return { q: null, c: a.v, pos: a.pos }; };
    need("SELECT", "Сұрау SELECT сөзінен басталуы керек.");
    const sel = [];
    if (peek().t === "*") { next(); sel.push("*"); } else { do { if (sel.length) next(); sel.push(colRef()); } while (peek().t === ","); }
    need("FROM", "Бағандардан кейін FROM және кесте аты күтілді.");
    const tref = () => { const t = ident("кесте"); let alias = t.v; if (isKw("AS")) { next(); alias = ident("бүркеншік ат").v; } else if (peek().t === "id") alias = next().v; return { table: t.v, alias, pos: t.pos }; };
    const from = tref(); let join = null;
    if (isKw("INNER")) { next(); if (!isKw("JOIN")) throw new SqlErr("INNER-ден кейін JOIN күтілді.", peek().pos); }
    if (isKw("JOIN")) {
      next(); const t2 = tref(); need("ON", "JOIN-нан кейін ON және біріктіру шарты күтілді (мысалы ON s.class_id = c.id).");
      const l = colRef(); const o = next(); if (o.t !== "op" || o.v !== "=") throw new SqlErr("Бұл модельде ON шарты тек теңдік: a.x = b.y.", o.pos);
      const r = colRef(); join = { ...t2, l, r };
    }
    const where = [];
    if (isKw("WHERE")) {
      next();
      do {
        if (where.length) next();
        const c = colRef(), o = next();
        if (o.t !== "op") throw new SqlErr("Бағаннан кейін салыстыру белгісі күтілді: =, !=, <, >, <=, >=.", o.pos);
        const v = next();
        if (v.t === "id") throw new SqlErr(`«${v.v}» - баған аты сияқты. Мәтін мәнін тырнақшаға алыңыз: '${v.v}'. (Екі бағанды салыстыру бұл модельде тек JOIN ... ON-да.)`, v.pos);
        if (v.t !== "num" && v.t !== "str") throw new SqlErr("Салыстыру белгісінен кейін сан не 'мәтін' күтілді.", v.pos);
        where.push({ col: c, op: o.v, val: v.v, vt: v.t, pos: c.pos });
      } while (isKw("AND"));
    }
    let order = null;
    if (isKw("ORDER")) { next(); need("BY", "ORDER-ден кейін BY күтілді."); const c = colRef(); let dir = "ASC"; if (isKw("ASC") || isKw("DESC")) dir = next().v; order = { col: c, dir }; }
    if (peek().t === ";") next();
    if (peek().t !== "eof") { const t = peek(); throw new SqlErr(t.t === "id" && t.v === "or" ? "OR бұл модельде қолданылмайды - тек AND." : `Артық бөлік: «${src.slice(t.pos, t.pos + 12)}». Бұл шағын SQL тек SELECT ... FROM ... [JOIN ... ON ...] [WHERE ... AND ...] [ORDER BY ...] қолдайды.`, t.pos); }
    // атауларды шешу
    const tabs = [from, join].filter(Boolean);
    tabs.forEach((t) => { if (!SCHEMA[t.table]) throw new SqlErr(`«${t.table}» деген кесте жоқ. Бар кестелер: students, classes.`, t.pos); });
    if (join && join.table === from.table) throw new SqlErr("Бұл модель кестені өзімен біріктіруді (self-join) қолдамайды.", join.pos);
    const res = (c) => {
      if (c.q) { const t = tabs.find((x) => x.alias === c.q || x.table === c.q); if (!t) throw new SqlErr(`«${c.q}» - белгісіз кесте не бүркеншік ат.`, c.pos); if (!SCHEMA[t.table].cols.includes(c.c)) throw new SqlErr(`${t.table} кестесінде «${c.c}» бағаны жоқ. Бағандары: ${SCHEMA[t.table].cols.join(", ")}.`, c.pos); return { t: t.table, c: c.c }; }
      const hit = tabs.filter((t) => SCHEMA[t.table].cols.includes(c.c));
      if (!hit.length) throw new SqlErr(`«${c.c}» бағаны жоқ. Бағандар: ${tabs.map((t) => `${t.table}(${SCHEMA[t.table].cols.join(", ")})`).join("; ")}.`, c.pos);
      if (hit.length > 1) throw new SqlErr(`«${c.c}» екі кестеде де бар - қайсысы екенін жазыңыз: ${hit.map((t) => t.alias + "." + c.c).join(" не ")}.`, c.pos);
      return { t: hit[0].table, c: c.c };
    };
    const q = { from: from.table, join: null, sel: sel.map((s) => (s === "*" ? "*" : res(s))), where: [], order: order ? { ...res(order.col), dir: order.dir } : null };
    if (join) {
      const l = res(join.l), r = res(join.r);
      if (l.t === r.t) throw new SqlErr("ON шарты екі түрлі кестенің бағандарын байланыстыруы керек.", join.l.pos);
      q.join = { table: join.table, on: l.t === from.table ? { o: l.c, i: r.c } : { o: r.c, i: l.c } };
    }
    where.forEach((w) => {
      const r = res(w.col), isNum = !!SCHEMA[r.t].num[r.c];
      if (isNum && w.vt !== "num") throw new SqlErr(`${r.c} - сан баған; мәнді тырнақшасыз жазыңыз (мысалы ${r.c} = 10).`, w.pos);
      if (!isNum && w.vt !== "str") throw new SqlErr(`${r.c} - мәтін баған; мәнді тырнақшаға алыңыз: ${r.c} = '${w.val}'.`, w.pos);
      if (!isNum && w.op !== "=" && w.op !== "!=") throw new SqlErr(`Бұл модельде мәтін бағанмен тек = не != салыстырылады.`, w.pos);
      q.where.push({ t: r.t, c: r.c, op: w.op, v: w.val });
    });
    return q;
  }

  // ================================================================ орындау және жоспарлар
  const test = (row, w) => { const d = cmp(row[w.c], w.v); return w.op === "=" ? d === 0 : w.op === "!=" ? d !== 0 : w.op === "<" ? d < 0 : w.op === ">" ? d > 0 : w.op === "<=" ? d <= 0 : d >= 0; };
  const byId = (t, id) => SCHEMA[t].rows.find((r) => r.id === id);
  function interval(conds) {
    const iv = {};
    conds.forEach((w) => {
      if (w.op === "=") { iv.lo = w.v; iv.hi = w.v; iv.loInc = iv.hiInc = true; }
      else if (w.op === ">" || w.op === ">=") { if (iv.lo === undefined || cmp(w.v, iv.lo) > 0 || (cmp(w.v, iv.lo) === 0 && w.op === ">")) { iv.lo = w.v; iv.loInc = w.op === ">="; } }
      else if (w.op === "<" || w.op === "<=") { if (iv.hi === undefined || cmp(w.v, iv.hi) < 0 || (cmp(w.v, iv.hi) === 0 && w.op === "<")) { iv.hi = w.v; iv.hiInc = w.op === "<="; } }
    });
    return iv;
  }
  const ivTxt = (c, iv) => iv.lo !== undefined && iv.hi !== undefined && cmp(iv.lo, iv.hi) === 0 && iv.loInc && iv.hiInc ? `${c} = ${fmtV(iv.lo)}` : [iv.lo !== undefined ? `${c} ${iv.loInc ? ">=" : ">"} ${fmtV(iv.lo)}` : null, iv.hi !== undefined ? `${c} ${iv.hiInc ? "<=" : "<"} ${fmtV(iv.hi)}` : null].filter(Boolean).join(" AND ");
  const fmtV = (v) => (typeof v === "number" ? String(v) : `'${v}'`);
  /** Бір кестеге қол жеткізу жоспарлары. idx - қосымша индекстер жиыны ("students.city"). */
  function accessPlans(table, conds, idx) {
    const N = SCHEMA[table].rows.length, ht = tree(table, "id").h, plans = [];
    const out = SCHEMA[table].rows.filter((r) => conds.every((w) => test(r, w)));
    plans.push({ kind: "scan", table, label: `${table}: толық сканерлеу (SCAN)`, cost: N, nodes: 0, rows: N, out: out.map((r) => r.id), order: SCHEMA[table].rows.map((r) => r.id) });
    const cols = [...new Set(conds.filter((w) => w.op !== "!=").map((w) => w.c))];
    cols.forEach((c) => {
      const pk = c === "id"; if (!pk && !idx.has(table + "." + c)) return;
      const t = tree(table, c), iv = interval(conds.filter((w) => w.c === c && w.op !== "!=")), L = lookup(t, iv);
      const m = L.matches.length, cost = L.visited + (pk ? 0 : m * ht);
      const keep = L.matches.filter((rid) => conds.every((w) => test(byId(table, rid), w)));
      plans.push({ kind: pk ? "pk" : "index", table, col: c, iv, L, label: pk ? `${table}: id бойынша іздеу (SEARCH USING PRIMARY KEY)` : `${table}: индекс ${c} (SEARCH USING INDEX)`, cost, nodes: L.visited + (pk ? 0 : m * ht), idxNodes: L.visited, rows: m, m, ht, out: keep });
    });
    return plans;
  }
  const bestOf = (plans) => plans.reduce((b, p) => (!b || p.cost < b.cost ? p : b), null);
  const sortCost = (k) => (k > 1 ? k * Math.ceil(Math.log2(k)) : 0);
  function planQuery(q, idx) {
    const condsOf = (t) => q.where.filter((w) => w.t === t);
    if (!q.join) {
      const plans = accessPlans(q.from, condsOf(q.from), idx);
      const best = bestOf(plans), rows = best.out.map((id) => ({ [q.from]: byId(q.from, id) }));
      return finish(q, plans, best, rows);
    }
    const A = q.from, B = q.join.table, plans = [];
    for (const [o, i, oc, ic] of [[A, B, q.join.on.o, q.join.on.i], [B, A, q.join.on.i, q.join.on.o]]) {
      const op = bestOf(accessPlans(o, condsOf(o), idx)), Ni = SCHEMA[i].rows.length, icond = condsOf(i);
      const outerRows = op.out.map((id) => byId(o, id));
      const pairs = []; outerRows.forEach((r) => SCHEMA[i].rows.forEach((s) => { if (cmp(r[oc], s[ic]) === 0 && icond.every((w) => test(s, w))) pairs.push([r, s]); }));
      const rowsOut = pairs.map(([r, s]) => ({ [o]: r, [i]: s }));
      const base = { outer: o, inner: i, oc, ic, op, outerRows, rowsOut };
      plans.push({ ...base, kind: "nlj", label: `${o} → ${i}: nested loop`, cost: op.cost + outerRows.length * Ni, rows: op.rows + outerRows.length * Ni, nodes: op.nodes });
      plans.push({ ...base, kind: "hash", label: `${o} → ${i}: hash join`, cost: op.cost + Ni + outerRows.length, rows: op.rows + Ni, nodes: op.nodes, probes: outerRows.length });
      if (ic === "id" || idx.has(i + "." + ic)) {
        const t = tree(i, ic), ht = tree(i, "id").h, pk = ic === "id";
        let c = 0, rr = 0; const per = outerRows.map((r) => { const L = lookup(t, { lo: r[oc], hi: r[oc], loInc: true, hiInc: true }); const k = L.visited + (pk ? 0 : L.matches.length * ht); c += k; rr += L.matches.length; return { L, k }; });
        plans.push({ ...base, kind: "inlj", label: `${o} → ${i}: index join (${pk ? "id" : "индекс " + ic})`, cost: op.cost + c, rows: op.rows + rr, nodes: op.nodes + c, per, itree: t });
      }
    }
    const best = bestOf(plans);
    return finish(q, plans, best, best.rowsOut);
  }
  function finish(q, plans, best, rows) {
    if (q.order) rows = rows.slice().sort((a, b) => { const d = cmp(a[q.order.t][q.order.c], b[q.order.t][q.order.c]); return q.order.dir === "DESC" ? -d : d; });
    const sc = q.order ? sortCost(rows.length) : 0;
    return { q, plans, best, rows, sortCost: sc };
  }
  function project(q, rows) {
    const cols = q.sel[0] === "*" ? [q.from, q.join && q.join.table].filter(Boolean).flatMap((t) => SCHEMA[t].cols.map((c) => ({ t, c }))) : q.sel;
    return { head: cols.map((c) => (q.join ? `${c.t}.${c.c}` : c.c)), body: rows.map((r) => cols.map((c) => r[c.t][c.c])) };
  }
  window.CSLabDB = { SCHEMA, tree, lookup, parse, planQuery, accessPlans, interval, cmp, SqlErr };

  // ================================================================ көрсету көмекшілері
  function drawTree(svg, t, hl = {}) {
    svg.innerHTML = "";
    const W = 600, LH = 92, LW = Math.min(96, (W - 20) / t.leaves.length - 8), top = 30;
    const H = top + (t.h - 1) * 70 + LH + 16;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.append(sv("text", { x: 8, y: 18, class: "db-tt" }, t.pk ? `${t.table}: кесте ағашы (id), биіктігі ${t.h}` : `Индекс ${t.table}(${t.col}), биіктігі ${t.h}`));
    const pos = new Map();
    t.leaves.forEach((l, i) => { const step = (W - 20) / t.leaves.length; pos.set(l.id, [10 + step * i + step / 2, top + (t.h - 1) * 70]); });
    for (let lv = t.h - 2; lv >= 0; lv--) t.levels[lv].forEach((n) => { const xs = n.ch.map((c) => pos.get(c.id)[0]); pos.set(n.id, [(Math.min(...xs) + Math.max(...xs)) / 2, top + lv * 70]); });
    const vis = hl.vis || new Set(), now = hl.now;
    t.levels.slice(0, -1).forEach((lvl) => lvl.forEach((n) => n.ch.forEach((c) => { const [x1, y1] = pos.get(n.id), [x2, y2] = pos.get(c.id); svg.append(sv("line", { class: "db-te" + (vis.has(n.id) && vis.has(c.id) ? " vis" : ""), x1, y1: y1 + 26, x2, y2 })); })));
    t.leaves.forEach((l) => { if (l.next) { const [x1, y1] = pos.get(l.id), [x2] = pos.get(l.next.id); svg.append(sv("line", { class: "db-sib", x1: x1 + LW / 2, y1: y1 + LH / 2, x2: x2 - LW / 2, y2: y1 + LH / 2 })); } });
    const short = (v) => { const s = String(v); return s.length > 9 ? s.slice(0, 8) + "…" : s; };
    t.levels.forEach((lvl) => lvl.forEach((n) => {
      const [x, y] = pos.get(n.id), g = sv("g", { class: "db-tn" + (vis.has(n.id) ? " vis" : "") + (now === n.id ? " now" : "") });
      if (n.leaf) {
        g.append(sv("rect", { x: x - LW / 2, y, width: LW, height: LH, rx: 6 }));
        n.ents.forEach((e, i) => g.append(sv("text", { x: x - LW / 2 + 6, y: y + 18 + i * 20, class: hl.hits && hl.hits.has(e.rid) ? "hit" : "" }, short(e.k) + (t.pk ? "" : ""))));
      } else {
        const txt = n.seps.map(short).join(" | "), w = Math.max(60, txt.length * 7.4 + 16);
        g.append(sv("rect", { x: x - w / 2, y, width: w, height: 26, rx: 6 }));
        g.append(sv("text", { x, y: y + 18, "text-anchor": "middle" }, txt));
      }
      svg.append(g);
    }));
    svg.setAttribute("aria-label", `${t.pk ? "Кесте" : "Индекс"} ағашы ${t.table}(${t.col}): ${t.h} деңгей, ${t.leaves.length} жапырақ. ` + t.leaves.map((l, i) => `${i + 1}-жапырақ: ${l.ents.map((e) => e.k).join(", ")}`).join("; "));
  }
  function tableView(box, table, hl = {}) {
    const S = SCHEMA[table], wrap = el("div", null, el("h3", { text: `${table} (${S.rows.length} жол)` }));
    const t = el("table", { class: "csb-table" }, el("thead", null, el("tr", null, S.cols.map((c) => el("th", { scope: "col", text: c })))));
    const tb = el("tbody");
    S.rows.forEach((r) => tb.append(el("tr", { class: [hl.rd && hl.rd.has(r.id) ? "rd" : "", hl.hit && hl.hit.has(r.id) ? "hit" : "", hl.now === r.id ? "now" : ""].join(" ").trim() || null }, S.cols.map((c) => el("td", { text: String(r[c]) })))));
    t.append(tb); wrap.append(el("div", { class: "csb-scroll", tabindex: "0", role: "region", "aria-label": `${table} кестесі` }, t)); box.append(wrap);
  }

  // ================================================================ анимация кадрлары
  function framesFor(P, R) {
    const F = [], q = R.q;
    const fr = (o) => F.push({ rd: new Set(), hit: new Set(), ird: new Set(), ihit: new Set(), vis: new Set(), cost: 0, nodes: 0, rows: 0, ...o });
    if (P.kind === "scan") {
      fr({ tree: null, msg: `${P.label}: ${P.table} кестесінің барлық ${P.cost} жолын ретімен оқып, әрқайсысын WHERE шартымен тексереміз.` });
      const rd = new Set(), hit = new Set(), outS = new Set(P.out);
      P.order.forEach((id, i) => { rd.add(id); if (outS.has(id)) hit.add(id); fr({ now: id, rd: new Set(rd), hit: new Set(hit), rows: i + 1, cost: i + 1, msg: `${i + 1}-жол (id = ${id}) оқылды: ${outS.has(id) ? "шартқа сай - нәтижеге" : "шартқа сай емес - тасталды"}.` }); });
      fr({ rd, hit, rows: P.cost, cost: P.cost, msg: `Аяқталды: ${P.cost} жол оқылды, ${P.out.length} жол сай келді. Құн = ${P.cost}.` });
      return F;
    }
    if (P.kind === "index" || P.kind === "pk") {
      const t = tree(P.table, P.col), vis = new Set(); let nodes = 0;
      fr({ tree: t, msg: `${P.label}: ${ivTxt(P.col, P.iv)} шартын ағаштың түбірінен бастап іздейміз.` });
      P.L.path.forEach((n, i) => { vis.add(n.id); nodes++; fr({ tree: t, vis: new Set(vis), tnow: n.id, nodes, cost: nodes, msg: n.leaf ? `${i + 1}-түйін - жапырақ: [${n.ents.map((e) => e.k).join(", ")}]. Осы жерден бастап сай жазбаларды оқимыз.` : `${i + 1}-түйін (${i === 0 ? "түбір" : "ішкі"}): бөлгіштер [${n.seps.join(" | ")}] → тиісті балаға түсеміз.` }); });
      const hits = new Set(P.L.matches);
      P.L.extra.forEach((n) => { vis.add(n.id); nodes++; fr({ tree: t, vis: new Set(vis), tnow: n.id, hits, nodes, cost: nodes, msg: `Жапырақ соңына дейін сай жазбалар бітпеді → көрші жапыраққа өтеміз (+1 түйін): [${n.ents.map((e) => e.k).join(", ")}].` }); });
      const ird = new Set(), outS = new Set(P.out); let cost = nodes, rows = 0;
      if (P.kind === "pk") { P.L.matches.forEach((rid) => { ird.add(rid); rows++; }); fr({ tree: t, vis, hits, rd: new Set(ird), hit: new Set(P.out), nodes, rows, cost, msg: `id - кестенің өз ағашы: жолдар жапырақта тұр, қосымша түсу керек емес. ${rows} жол оқылды.` }); }
      else P.L.matches.forEach((rid) => { ird.add(rid); rows++; cost += P.ht; fr({ tree: t, vis, hits, rd: new Set(ird), hit: new Set([...ird].filter((x) => outS.has(x))), nodes: cost, rows, cost, msg: `Индекс жазбасы rowid = ${rid} → жолды кестеден аламыз: кесте ағашымен түбірден жапыраққа түсу = ${P.ht} түйін (+${P.ht}). ${outS.has(rid) ? "" : "Басқа шартқа сай емес - тасталады."}` }); });
      fr({ tree: t, vis, hits, rd: ird, hit: new Set(P.out), nodes: P.nodes, rows: P.rows, cost: P.cost, msg: P.kind === "pk" ? `Аяқталды: ${P.idxNodes} түйін = құн ${P.cost}.` : `Аяқталды: индекс ${P.idxNodes} түйін + ${P.m} жол × ${P.ht} = ${P.cost}. Салыстыру: толық сканерлеу ${SCHEMA[P.table].rows.length}.` });
      return F;
    }
    // JOIN
    const o = P.outer, i = P.inner, Ni = SCHEMA[i].rows.length;
    const ap = P.op;
    fr({ tree: P.kind === "inlj" ? P.itree : null, msg: `${P.label}. Алдымен сыртқы кесте ${o}: ${ap.label} (құн ${ap.cost}, ${P.outerRows.length} жол шығады).` });
    let cost = ap.cost, rows = ap.rows; const rd = new Set(ap.out), ird = new Set(), ihit = new Set();
    if (P.kind === "hash") { cost += Ni; rows += Ni; SCHEMA[i].rows.forEach((r) => ird.add(r.id)); fr({ rd: new Set(rd), ird: new Set(ird), cost, rows, msg: `Хэш құру: ${i} кестесінің барлық ${Ni} жолы бір рет оқылып, ${P.ic} мәні бойынша хэш-кестеге салынады (+${Ni}).` }); }
    P.outerRows.forEach((r, k) => {
      const matched = P.rowsOut.filter((x) => x[o] === r).map((x) => x[i].id); matched.forEach((x) => ihit.add(x));
      let m;
      if (P.kind === "nlj") { cost += Ni; rows += Ni; m = `${i} кестесін басынан аяғына сканерлейміз (+${Ni}), ${P.ic} = ${fmtV(r[P.oc])} іздеп.`; SCHEMA[i].rows.forEach((x) => ird.add(x.id)); }
      else if (P.kind === "hash") { cost += 1; m = `хэш-кестеден ${fmtV(r[P.oc])} кілтін бір зондпен табамыз (+1).`; }
      else { const pr = P.per[k]; cost += pr.k; rows += pr.L.matches.length; pr.L.matches.forEach((x) => ird.add(x)); m = `${i} ағашынан ${P.ic} = ${fmtV(r[P.oc])} іздейміз: +${pr.k} (${pr.L.visited} түйін${P.ic === "id" ? "" : ` + ${pr.L.matches.length} × ${tree(i, "id").h}`}).`; }
      fr({ tree: P.kind === "inlj" ? P.itree : null, now: r.id, onow: o, rd: new Set(rd), ird: new Set(ird), ihit: new Set(ihit), cost, rows, msg: `Сыртқы жол ${k + 1}/${P.outerRows.length} (${o}.id = ${r.id}): ${m} Жұп: ${matched.length}.` });
    });
    fr({ rd, ird, ihit, cost: P.cost, rows: P.rows, msg: `Аяқталды: ${P.rowsOut.length} жұп. Құн = ${P.cost}.` });
    return F;
  }

  // ================================================================ жоспарлаушы компоненті
  function mount(root, presets, opt = {}) {
    const $ = (s) => root.querySelector(s);
    const sql = $("[data-k=sql]"), sel = $("[data-k=preset]"), err = $(".db-err");
    presets.forEach(([v, l], i) => sel.append(el("option", { value: String(i), text: l })));
    sql.value = presets[0][0];
    const idxBox = $(".db-idx");
    (opt.idx || []).forEach(([k, on]) => idxBox.append(el("label", { class: "cs-check" }, el("input", { type: "checkbox", "data-idx": k, checked: on ? true : null }), ` ${k.replace(".", "(")})`)));
    let R = null, frames = [{ msg: "Сұрауды жазып, «Жоспарларды есептеу» басыңыз." }], P = null, revealed = true;
    const idxSet = () => new Set([...root.querySelectorAll("[data-idx]")].filter((x) => x.checked).map((x) => x.dataset.idx));
    function bars() {
      const box = $(".db-bars"); box.innerHTML = "";
      if (!R) return;
      if (!revealed) { box.append(el("p", { class: "cs-small", text: "Құндар жасырын - алдымен болжаңыз." })); return; }
      const mx = Math.max(...R.plans.map((p) => p.cost));
      R.plans.forEach((p) => box.append(el("div", { class: "db-bar" + (p === R.best ? " best" : "") }, el("span", { text: p.label + (p === R.best ? " ← таңдалады" : "") }), el("i", { "aria-hidden": "true" }, el("s", { style: `width:${(100 * p.cost) / mx}%` })), el("b", { text: String(p.cost) }))));
      if (R.sortCost) box.append(el("p", { class: "cs-small", text: `ORDER BY: + ${R.sortCost} (${R.rows.length} жолды сұрыптау, k·⌈log₂k⌉ - барлық жоспарға бірдей).` }));
    }
    function planText() {
      if (!R) return "";
      const b = R.best, lines = [];
      if (!R.q.join) lines.push(b.kind === "scan" ? `SCAN ${b.table}` : b.kind === "pk" ? `SEARCH ${b.table} USING PRIMARY KEY (${ivTxt("id", b.iv)})` : `SEARCH ${b.table} USING INDEX idx_${b.col} (${ivTxt(b.col, b.iv)})`);
      else { const op = b.op; lines.push(op.kind === "scan" ? `SCAN ${op.table}` : `SEARCH ${op.table} USING ${op.kind === "pk" ? "PRIMARY KEY" : "INDEX idx_" + op.col} (${ivTxt(op.col, op.iv)})`); lines.push(b.kind === "nlj" ? `  NESTED LOOP: әр жолға SCAN ${b.inner}` : b.kind === "hash" ? `  HASH JOIN: ${b.inner} бойынша хэш-кесте (${b.ic})` : `  INDEX JOIN: SEARCH ${b.inner} USING ${b.ic === "id" ? "PRIMARY KEY" : "INDEX idx_" + b.ic} (${b.ic}=?)`); }
      if (R.q.order) lines.push(`USE TEMP B-TREE FOR ORDER BY (${R.q.order.c} ${R.q.order.dir})`);
      return lines.join("\n") + `\n-- құн: ${b.cost}${R.sortCost ? " + " + R.sortCost : ""}, нәтиже: ${R.rows.length} жол`;
    }
    function result() {
      const box = $(".db-res"); box.innerHTML = ""; if (!R) return;
      const pr = project(R.q, R.rows);
      const t = el("table", { class: "csb-table" }, el("thead", null, el("tr", null, pr.head.map((h) => el("th", { scope: "col", text: h })))));
      const tb = el("tbody"); pr.body.slice(0, 8).forEach((r) => tb.append(el("tr", null, r.map((v) => el("td", { text: String(v) }))))); t.append(tb);
      box.append(el("p", { class: "cs-small", text: `Нәтиже: ${R.rows.length} жол${R.rows.length > 8 ? " (алғашқы 8-і)" : ""}.` }), el("div", { class: "csb-scroll" }, t));
    }
    function fillPlanSel() { const ps = $("[data-k=plan]"); ps.innerHTML = ""; if (!R) return; R.plans.forEach((p, i) => ps.append(el("option", { value: String(i), text: p.label + (revealed ? ` (құн ${p.cost})` : "") }))); ps.value = String(R.plans.indexOf(R.best)); }
    function render(F) {
      const tb = $(".db-tables"); tb.innerHTML = "";
      const q = R ? R.q : { from: opt.tables[0], join: opt.tables[1] ? { table: opt.tables[1] } : null };
      const tabs = [q.from, q.join && q.join.table].filter(Boolean);
      tabs.forEach((t) => { const isInner = P && P.inner === t; tableView(tb, t, isInner ? { rd: F.ird, hit: F.ihit } : (P && P.outer && P.outer !== t) ? {} : { rd: F.rd, hit: F.hit, now: F.now }); });
      const svg = $(".db-tree svg"), t = F.tree || (P && (P.kind === "index" || P.kind === "pk") ? tree(P.table, P.col) : null);
      $(".db-tree").hidden = !t;
      if (t) drawTree(svg, t, { vis: F.vis, now: F.tnow, hits: F.hits });
      const cnt = $(".db-cnt"); cnt.innerHTML = "";
      [["оқылған жолдар", F.rows || 0], ["B-ағаш түйіндері", F.nodes || 0], ["құн (жиыны)", F.cost || 0]].forEach(([a, b]) => cnt.append(el("div", null, el("b", { text: String(b) }), el("span", { text: a }))));
    }
    const st = C.stepper(root, { frames: () => frames, render, delay: 700 });
    function analyze() {
      err.hidden = true; R = null; P = null;
      let q;
      try { q = parse(sql.value); } catch (e) {
        if (!(e instanceof SqlErr)) throw e;
        const pos = e.pos || 0, ln = sql.value.slice(0, pos).split("\n").length;
        err.hidden = false; err.innerHTML = ""; err.append(el("b", { text: `Сұрау қатесі (${ln}-жол, ${pos + 1}-таңба): ` }), e.message);
        frames = [{ msg: "Сұрау талданбады - қатені түзетіңіз." }]; st.reload(); bars(); result(); $(".db-plan").textContent = ""; fillPlanSel(); return;
      }
      if (opt.tables.length === 1 && q.join) { err.hidden = false; err.textContent = "Бұл бөлім бір кестеге арналған; JOIN сұрауларын келесі бөлімде көріңіз."; return; }
      R = planQuery(q, idxSet());
      revealed = !$("[data-k=dbpredict]").checked;
      fillPlanSel(); choosePlan(); bars(); result(); $(".db-plan").textContent = revealed ? planText() : "";
      if (!revealed) askPredict(); else $(".db-pred").innerHTML = "";
      if (opt.onAnalyze) opt.onAnalyze(R);
    }
    function choosePlan() { P = R.plans[+$("[data-k=plan]").value] || R.best; frames = framesFor(P, R); st.reload(); }
    function askPredict() {
      const box = $(".db-pred"); box.innerHTML = ""; const fb = el("div", { "data-fb": "dbp", "aria-live": "polite" });
      const idxP = R.plans.find((p) => p.kind === "index" || p.kind === "pk" || p.kind === "inlj");
      box.append(el("p", null, el("b", { text: "Болжа: " }), "қай жоспар ең арзан болады?"));
      const ch = el("div", { class: "lab-choice" });
      R.plans.forEach((p, i) => ch.append(el("button", { type: "button", "data-a": String(i), text: p.label, onclick: () => {
        const ok = p.cost === R.best.cost;
        const scan = R.plans.find((x) => x.kind === "scan");
        let why;
        if (ok) why = `${p.label}: құн ${p.cost} - ең азы.`;
        else if (p.kind === "index" && scan && scan.cost < p.cost) why = `Индекс бұл жерде қымбат: ${p.col} = мәні ${p.m} жолға сай (селективтілік ${p.m}/${SCHEMA[p.table].rows.length} = ${Math.round((100 * p.m) / SCHEMA[p.table].rows.length)}%). Әр табылған жол үшін кестеге бөлек түсу керек (${p.ht} түйін): ${p.idxNodes} + ${p.m} × ${p.ht} = ${p.cost} > сканерлеу ${scan.cost}.`;
        else if (p.kind === "scan") why = `Сканерлеу барлық ${p.cost} жолды оқиды, ал ${R.best.label} - ${R.best.cost}: сай жолдар аз болғанда индекс тек солардың жанынан өтеді.`;
        else if (p.kind === "nlj") why = `Nested loop әр сыртқы жол үшін ішкі кестені түгел сканерлейді: ${p.op.cost} + ${p.outerRows.length} × ${SCHEMA[p.inner].rows.length} = ${p.cost}. Ең арзаны - ${R.best.label} (${R.best.cost}).`;
        else why = `${p.label}: ${p.cost}, ал ${R.best.label}: ${R.best.cost}.`;
        T().feedback(fb, ok ? "ok" : "bad", ok ? "Дұрыс" : `Дұрысы: ${R.best.label}`, why);
        T().record("cs.db.plan", { item: "cheapest", ok, error: ok ? "" : p.kind === "index" ? "low-selectivity" : p.kind, note: why, title: "ДҚ: арзан жоспарды болжау" });
        ch.querySelectorAll("button").forEach((b) => (b.disabled = true));
        if (idxP) askRows(box, idxP); else reveal();
      } })));
      box.append(ch, fb);
      const sk = el("button", { type: "button", class: "btn secondary csb-skip", text: "Болжамсыз көрсету", onclick: reveal }); box.append(el("p", null, sk));
    }
    function askRows(box, p) {
      const isJ = p.kind === "inlj", want = isJ ? p.rows - p.op.rows : p.rows;
      const id = "dbq-" + Math.random().toString(36).slice(2, 7);
      const inp = el("input", { class: "cs-in", id, inputmode: "numeric", autocomplete: "off" }), fb = el("div", { "aria-live": "polite" });
      const go = () => {
        if (!/^\s*\d+\s*$/.test(inp.value)) { T().feedback(fb, "info", "Сан жазыңыз", "Бір бүтін сан."); return; }
        const x = +inp.value, ok = x === want, N = SCHEMA[isJ ? p.inner : p.table].rows.length;
        const why = ok ? `Дұрыс: ${want}.` : x === N ? `${N} - толық сканерлеудің саны. Индекс тек шартқа сай жазбалардың жолдарын оқиды: ${want}.` : x === p.cost ? `${x} - құн (түйіндер де кіреді). Сұрақ - кестеден оқылған жолдар саны: ${want}.` : `Шартқа сай жолдарды кестеден санаңыз: ${want}.`;
        T().feedback(fb, ok ? "ok" : "bad", ok ? "Дұрыс" : "Қате", why);
        T().record("cs.db.plan", { item: "rows", ok, error: ok ? "" : x === N ? "rows-scan" : x === p.cost ? "rows-cost" : "rows", note: why, title: "ДҚ: оқылатын жолдар" });
        reveal(true);
      };
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
      box.append(el("p", null, el("b", { text: "Болжа: " }), isJ ? `«${p.label}» ішкі кестенің (${p.inner}) неше жолын оқиды?` : `«${p.label}» кестенің неше жолын оқиды (rows touched)?`),
        el("div", { class: "lab-row" }, el("label", { class: "cs-field", for: id }, el("span", { text: "Жолдар саны" })), inp, el("button", { type: "button", class: "btn gold", "data-c": "rows", text: "Тексеру", onclick: go })), fb);
      inp.focus({ preventScroll: true });
    }
    function reveal(keep) { revealed = true; if (keep !== true) $(".db-pred").innerHTML = ""; bars(); fillPlanSel(); $(".db-plan").textContent = planText(); }
    $("[data-c=run]").addEventListener("click", analyze);
    sel.addEventListener("change", () => { sql.value = presets[+sel.value][0]; analyze(); });
    root.querySelectorAll("[data-idx]").forEach((x) => x.addEventListener("change", analyze));
    $("[data-k=plan]").addEventListener("change", choosePlan);
    $("[data-k=dbpredict]").addEventListener("change", analyze);
    sql.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) analyze(); });
    analyze();
    return { analyze, get R() { return R; } };
  }

  const r1 = document.querySelector("[data-cslab=db-single]");
  if (r1) mount(r1, [
    ["SELECT name, score FROM students WHERE name = 'Дана'", "name = 'Дана' (бір жол)"],
    ["SELECT * FROM students WHERE city = 'Алматы'", "city = 'Алматы' (көп жол)"],
    ["SELECT name FROM students WHERE class_id = 3", "class_id = 3"],
    ["SELECT name, score FROM students WHERE score >= 90 ORDER BY score DESC", "score >= 90, ORDER BY"],
    ["SELECT * FROM students WHERE id = 17", "id = 17 (бастапқы кілт)"],
    ["SELECT name FROM students WHERE year = 10 AND city = 'Шымкент'", "year = 10 AND city = 'Шымкент'"],
  ], { tables: ["students"], idx: [["students.name", true], ["students.city", true], ["students.class_id", false], ["students.score", true], ["students.year", false]] });
  const r2 = document.querySelector("[data-cslab=db-join]");
  if (r2) mount(r2, [
    ["SELECT s.name, c.title FROM students s JOIN classes c ON s.class_id = c.id WHERE s.name = 'Дана'", "бір оқушы + сыныбы"],
    ["SELECT s.name, c.title FROM students s JOIN classes c ON s.class_id = c.id WHERE s.city = 'Алматы'", "Алматы оқушылары + сыныбы"],
    ["SELECT s.name, c.teacher FROM students s JOIN classes c ON s.class_id = c.id", "барлық оқушы + мұғалімі"],
    ["SELECT s.name FROM classes c JOIN students s ON c.id = s.class_id WHERE c.teacher = 'Бекова'", "Бекованың сыныбындағылар"],
  ], { tables: ["students", "classes"], idx: [["students.name", true], ["students.city", false], ["students.class_id", false], ["classes.teacher", false]] });

  // ================================================================ селективтілік графигі
  (() => {
    const root = document.querySelector("[data-cslab=db-sel]");
    if (!root) return;
    const $ = (s) => root.querySelector(s), svg = $("svg"), N = 24, ht = tree("students", "id").h, h = tree("students", "city").h;
    const W = 600, H = 300, x0 = 50, y0 = 260, sx = (W - x0 - 20) / N, maxC = h + N + N * ht, sy = (y0 - 20) / maxC;
    const X = (m) => x0 + m * sx, Y = (c) => y0 - c * sy;
    function draw() {
      const m = +$("[data-k=m]").value; $("[data-k=mo]").textContent = String(m);
      svg.innerHTML = "";
      svg.append(sv("line", { class: "lb-axis", x1: x0, y1: y0, x2: W - 10, y2: y0 }), sv("line", { class: "lb-axis", x1: x0, y1: y0, x2: x0, y2: 10 }));
      for (let c = 0; c <= maxC; c += 20) svg.append(sv("text", { x: x0 - 6, y: Y(c) + 4, "text-anchor": "end", "font-size": 12 }, String(c)));
      for (let k = 0; k <= N; k += 4) svg.append(sv("text", { x: X(k), y: y0 + 18, "text-anchor": "middle", "font-size": 12 }, String(k)));
      svg.append(sv("text", { x: W - 12, y: y0 - 8, "text-anchor": "end", "font-size": 13 }, "сай жолдар m"));
      svg.append(sv("line", { class: "lb-ghost", x1: X(0), y1: Y(N), x2: X(N), y2: Y(N) }));
      svg.append(sv("text", { x: X(1), y: Y(N) - 8, "font-size": 13 }, `сканерлеу = ${N}`));
      // индекс: шамамен h + m·h_t (қосымша жапырақтарды есепке алмай - түсінікті болу үшін)
      svg.append(sv("line", { class: "lb-curve", x1: X(0), y1: Y(h), x2: X(N), y2: Y(h + N * ht) }));
      svg.append(sv("text", { x: X(13), y: Y(h + 13 * ht) - 10, "font-size": 13, fill: "var(--lab-gold)" }, `индекс ≈ ${h} + ${ht}·m`));
      const be = (N - h) / ht;
      svg.append(sv("line", { class: "lb-grid", x1: X(be), y1: y0, x2: X(be), y2: 10 }));
      svg.append(sv("circle", { cx: X(m), cy: Y(h + m * ht), r: 7, fill: "var(--lab-gold)" }), sv("circle", { cx: X(m), cy: Y(N), r: 6, fill: "var(--lab-chalk)" }));
      const ic = h + m * ht, win = ic < N;
      svg.setAttribute("aria-label", `График: m = ${m} болғанда индекс ≈ ${ic}, сканерлеу ${N}.`);
      $("[data-k=selmsg]").textContent = `m = ${m} (селективтілік ${Math.round((100 * m) / N)}%): индекс ≈ ${h} + ${ht} × ${m} = ${ic}, сканерлеу = ${N} → ${win ? "индекс арзан" : ic === N ? "тең" : "сканерлеу арзан"}. Шекара: m < (${N} − ${h}) / ${ht} ≈ ${be.toFixed(1)}, яғни шамамен ${Math.round((100 * be) / N)}%-дан аз жол сай келгенде ғана индекс ұтады.`;
    }
    $("[data-k=m]").addEventListener("input", draw); draw();
  })();

  // ================================================================ қорытынды тапсырма: ең тиімді индекс
  (() => {
    const root = document.querySelector("[data-cslab=db-task]");
    if (!root) return;
    const $ = (s) => root.querySelector(s);
    const R = rng(C.seed());
    const OPTS = ["students.name", "students.city", "students.year", "students.class_id", "students.score", "classes.teacher"];
    let choice = null;
    const S = SCHEMA.students.rows;
    function genQuery() {
      const k = pick(R, ["name", "class", "score", "lowsel", "two", "join", "join2"]);
      const r = pick(R, S);
      if (k === "name") return `SELECT * FROM students WHERE name = '${r.name}'`;
      if (k === "class") return `SELECT name FROM students WHERE class_id = ${r.class_id}`;
      if (k === "score") { const v = pick(R, [85, 88, 90, 93, 95]); return `SELECT name, score FROM students WHERE score > ${v}`; }
      if (k === "lowsel") return pick(R, [`SELECT name FROM students WHERE city = '${r.city}'`, `SELECT name FROM students WHERE year = ${r.year}`]);
      if (k === "two") return pick(R, [`SELECT name FROM students WHERE city = '${r.city}' AND score > ${pick(R, [88, 90, 92])}`, `SELECT name FROM students WHERE year = ${r.year} AND class_id = ${r.class_id}`, `SELECT name FROM students WHERE city = '${r.city}' AND name = '${r.name}'`]);
      if (k === "join") return `SELECT s.name, c.title FROM students s JOIN classes c ON s.class_id = c.id WHERE c.teacher = '${pick(R, CL)[2]}'`;
      return `SELECT s.name, c.title FROM students s JOIN classes c ON s.class_id = c.id WHERE s.city = '${r.city}'`;
    }
    function make() {
      choice = null;
      const sqlTxt = genQuery(), q = parse(sqlTxt);
      const base = planQuery(q, new Set());
      const costs = OPTS.map((o) => ({ o, R: planQuery(q, new Set([o])) })).map((x) => ({ ...x, cost: x.R.best.cost }));
      const min = Math.min(...costs.map((x) => x.cost));
      const answers = min < base.best.cost ? costs.filter((x) => x.cost === min).map((x) => x.o) : ["none"];
      const P = { kind: "index", sqlTxt, q, base, costs, min, answers };
      const qb = $("[data-k=q]"); qb.innerHTML = "";
      qb.append(el("p", { text: "Кестелерде тек бастапқы кілт (id) индекстері бар. Мына сұрауды ең арзан ететін БІР қосымша индексті таңдаңыз (модельдің құн есебі бойынша). Ешқайсысы көмектеспесе - соны таңдаңыз." }), el("pre", { class: "db-plan", text: sqlTxt }));
      const box = el("div", { class: "lab-choice", role: "group", "aria-label": "Индекс нұсқалары" });
      [...OPTS.map((o) => ({ id: o, label: `${o.split(".")[0]}(${o.split(".")[1]})` })), { id: "none", label: "Ешбір индекс көмектеспейді" }].forEach((o) => box.append(el("button", { type: "button", "aria-pressed": "false", "data-a": o.id, text: o.label, onclick: (e) => { choice = o.id; box.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === e.currentTarget))); } })));
      const ab = $("[data-k=ansbox]"); ab.innerHTML = ""; ab.append(box);
      return P;
    }
    const used = (P, o) => { const [t, c] = o.split("."); return P.q.where.some((w) => w.t === t && w.c === c) || (P.q.join && ((t === P.q.from && c === P.q.join.on.o) || (t === P.q.join.table && c === P.q.join.on.i))); };
    function costLine(P) { return P.costs.map((x) => `${x.o}: ${x.cost}`).join("; ") + ` (индекссіз: ${P.base.best.cost})`; }
    function hints(P) {
      return ["Тек WHERE не JOIN ... ON-да кездесетін бағандағы индекс пайдалы. Әрқайсысы үшін: шартқа неше жол сай (m)? Индекс құны ≈ биіктік + m × 3 (кестеге түсу). 24 жолды сканерлеуден аз ба? JOIN-да сыртқы жол сайын ішкі кестеге индекспен түсуге болатынын ескеріңіз.",
        "Мысал: WHERE city = 'Алматы' - 10 жол сай: 3 + 10 × 3 ≈ 33-36 > 24, индекс қолданылмайды. WHERE class_id = 3 - 5 жол: 3 + 5 × 3 = 18 < 24, индекс ұтады. WHERE name = 'Дана' - 1 жол: 3 + 3 = 6.",
        `Модельдің есебі: ${costLine(P)}. Ең арзаны: ${P.answers[0] === "none" ? "ешбір индекс базалық жоспардан арзан емес" : P.answers.join(" не ")}. Жауап: ${P.answers[0] === "none" ? "Ешбір индекс көмектеспейді" : P.answers.join(" не ")}.`];
    }
    function check(P) {
      if (!choice) return { empty: true, title: "Нұсқа таңдаңыз", why: "Индекстердің бірін басып, «Тексеру»." };
      const ok = P.answers.includes(choice), base = P.base.best.cost;
      if (ok) return { ok, title: "Дұрыс", why: choice === "none" ? `Ешбір қосымша индекс құнды ${base}-тен төмендетпейді: ${costLine(P)}.` : `${choice} индексімен құн ${P.min} (индекссіз ${base}). ${costLine(P)}.`, skillTitle: "ДҚ: индекс таңдау" };
      if (choice === "none") return { ok, code: "none-wrong", title: "Көмектесетін индекс бар", why: `${P.answers.join(" не ")} құнды ${base}-тен ${P.min}-ге түсіреді. ${costLine(P)}.`, skillTitle: "ДҚ: индекс таңдау" };
      const c = P.costs.find((x) => x.o === choice);
      if (!used(P, choice)) return { ok, code: "unused-col", title: "Бұл баған сұрауда жоқ", why: `${choice} бағаны WHERE-де де, ON-да да жоқ - жоспарлаушы оны пайдалана алмайды (құн ${c.cost} = индекссіз ${base}). Ең жақсысы: ${P.answers.join(" не ")} (${P.min}).`, skillTitle: "ДҚ: индекс таңдау" };
      if (c.cost >= base) {
        const [t, col] = choice.split("."), w = P.q.where.find((x) => x.t === t && x.c === col);
        const m = w ? SCHEMA[t].rows.filter((r) => test(r, w)).length : null;
        return { ok, code: "low-selectivity", title: "Селективтілігі төмен - жоспарлаушы қолданбайды", why: `${choice} бойынша ${m != null ? `${m} жол сай келеді (${Math.round((100 * m) / SCHEMA[t].rows.length)}%)` : "индекс табатын жолдар көп"}; әр жол үшін кестеге бөлек түсу керек, сондықтан индекспен оқу сканерлеуден қымбат - құн өзгермейді (${base}). Ең жақсысы: ${P.answers.join(" не ")} (${P.min}).`, skillTitle: "ДҚ: индекс таңдау" };
      }
      return { ok, code: "not-best", title: "Көмектеседі, бірақ ең жақсысы емес", why: `${choice} құнды ${c.cost}-ге түсіреді, ал ${P.answers.join(" не ")} - ${P.min}-ге: ${costLine(P)}.`, skillTitle: "ДҚ: индекс таңдау" };
    }
    const tk = C.task(root, { make, check: (P) => check(P), hints, skill: "cs.db.index" });
    $("[data-c=check]").addEventListener("click", () => tk.run());
    $("[data-c=new]").addEventListener("click", () => tk.fresh());
    tk.fresh();
    window.CSLabDB.task = () => tk.P;
  })();

  C.badges();
})();
