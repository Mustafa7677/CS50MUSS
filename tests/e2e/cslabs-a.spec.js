// © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// CS Universe зертханалары, A тобы: Дейкстра, ОЖ жоспарлаушысы, CPU кэші мен конвейері (academy/labs/).
// Беттің нәтижелері осы файлдағы ТӘУЕЛСІЗ эталондармен салыстырылады: массивті Дейкстра (O(V²)), Беллман-Форд,
// әр жоспарлау алгоритмінің бөлек іске асырылуы, Map негізіндегі LRU кэш, «регистр дайындығы» әдісімен конвейер.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

// Тесттер көп басуды қажет етеді (әр алгоритм, әр баптау): параллель жүктемеде 90 с жетпеуі мүмкін
test.describe.configure({ timeout: 240_000 });

async function open(page, url) { await blockFonts(page.context()); const errs = collectErrors(page); await page.goto(url); return errs; }
const skills = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("ao17:tutor:v1") || "{}").skills || {});
const kz = (x) => String(Math.round(x * 100) / 100).replace(".", ",");
async function toEnd(lab) { const n = lab.locator("[data-c=next]"); for (let i = 0; i < 80 && (await n.isEnabled()); i++) await n.click(); }

// ================================================================ эталондар
// Граф: «1–2 (7)» не «3→2 (−4)»
function parseG(txt) {
  const E = []; let dir = false;
  for (const m of txt.matchAll(/(\d+)(–|→)(\d+) \(([−-]?\d+)\)/g)) { if (m[2] === "→") dir = true; E.push([+m[1], +m[3], +m[4].replace("−", "-")]); }
  const V = [...new Set(E.flatMap(([a, b]) => [a, b]))].sort((a, b) => a - b);
  const arcs = E.flatMap(([a, b, w]) => (dir ? [[a, b, w]] : [[a, b, w], [b, a, w]]));
  return { E, V, arcs, dir };
}
function refDijkstra(g, s) {
  const d = {}, done = {}, prev = {}, order = [];
  g.V.forEach((v) => { d[v] = Infinity; prev[v] = null; }); d[s] = 0;
  for (;;) {
    let u = null; for (const v of g.V) if (!done[v] && d[v] < Infinity && (u === null || d[v] < d[u])) u = v;   // тең болса кіші нөмір (V өсу ретімен)
    if (u === null) break;
    done[u] = true; order.push(u);
    for (const [a, b, w] of g.arcs) if (a === u && !done[b] && d[u] + w < d[b]) { d[b] = d[u] + w; prev[b] = u; }
  }
  return { d, prev, order };
}
function refBF(g, s) { const d = {}; g.V.forEach((v) => (d[v] = Infinity)); d[s] = 0; for (let i = 1; i < g.V.length; i++) for (const [a, b, w] of g.arcs) if (d[a] + w < d[b]) d[b] = d[a] + w; return d; }
const fdist = (x) => (x === Infinity ? "∞" : x < 0 ? "−" + -x : String(x));

// Жоспарлау: ps = [{a, b, pr}], P1.. ретімен
function refSched(ps, algo, q = 2) {
  const n = ps.length, rem = ps.map((p) => p.b), C = Array(n), S = Array(n).fill(null), tl = [];
  const better = (i, j, key) => { const x = key(i), y = key(j); for (let k = 0; k < x.length; k++) if (x[k] !== y[k]) return x[k] < y[k]; return false; };
  if (algo === "fcfs" || algo === "sjf" || algo === "prio") {
    const key = algo === "fcfs" ? (i) => [ps[i].a, i] : algo === "sjf" ? (i) => [ps[i].b, ps[i].a, i] : (i) => [ps[i].pr, ps[i].a, i];
    let t = 0; const left = new Set(ps.map((_, i) => i));
    while (left.size) {
      const av = [...left].filter((i) => ps[i].a <= t);
      if (!av.length) { const nt = Math.min(...[...left].map((i) => ps[i].a)); while (t < nt) { tl.push(null); t++; } continue; }
      const c = av.reduce((m, i) => (better(i, m, key) ? i : m));
      S[c] = t; for (let k = 0; k < ps[c].b; k++) tl.push(c); t += ps[c].b; C[c] = t; left.delete(c);
    }
  } else if (algo === "srtf") {
    let t = 0, cur = null, done = 0;
    while (done < n) {
      const av = ps.map((_, i) => i).filter((i) => ps[i].a <= t && rem[i] > 0);
      if (!av.length) { tl.push(null); t++; cur = null; continue; }
      let c = av.reduce((m, i) => (better(i, m, (k) => [rem[k], ps[k].a, k]) ? i : m));
      if (cur !== null && rem[cur] > 0 && rem[cur] === rem[c]) c = cur;   // тең болса ағымдағы жалғастырады
      if (S[c] === null) S[c] = t;
      tl.push(c); rem[c]--; t++; cur = c;
      if (rem[c] === 0) { C[c] = t; done++; cur = null; }
    }
  } else {
    let t = 0, done = 0; const Q = []; const added = new Set();
    const admit = () => ps.forEach((p, i) => { if (p.a <= t && !added.has(i)) { added.add(i); Q.push(i); } });
    admit();
    while (done < n) {
      if (!Q.length) { tl.push(null); t++; admit(); continue; }
      const c = Q.shift(); if (S[c] === null) S[c] = t;
      const run = Math.min(q, rem[c]);
      for (let k = 0; k < run; k++) { tl.push(c); t++; admit(); }   // жаңа келгендер бірінші кіреді
      rem[c] -= run;
      if (rem[c] === 0) { C[c] = t; done++; } else Q.push(c);
    }
  }
  const segs = []; tl.forEach((p, t) => { const L = segs[segs.length - 1]; if (L && L.p === p) L.e = t + 1; else segs.push({ p, s: t, e: t + 1 }); });
  const wt = ps.map((p, i) => C[i] - p.a - p.b), tat = ps.map((p, i) => C[i] - p.a), rt = ps.map((p, i) => S[i] - p.a);
  const avg = (a) => a.reduce((x, y) => x + y, 0) / n;
  return { segs, order: segs.filter((x) => x.p !== null).map((x) => "P" + (x.p + 1)), text: segs.map((x) => `${x.p === null ? "бос" : "P" + (x.p + 1)} [${x.s}–${x.e}]`).join(" → "), wt: avg(wt), tat: avg(tat), rt: avg(rt) };
}

// Кэш: Map-пен LRU
function refCache(trace, B, L, W) {
  const S = L / W, sets = [...Array(S)].map(() => []);   // әр жиын: блоктар, соңғы қолданылған - соңында
  return trace.map((a) => {
    const blk = Math.floor(a / B), set = sets[blk % S], k = set.indexOf(blk);
    if (k >= 0) { set.splice(k, 1); set.push(blk); return "H"; }
    if (set.length === W) set.shift(); set.push(blk); return "M";
  });
}
// Конвейер: «регистр қай EX циклынан бастап қолжетімді»
function refPipe(prog, fwd) {
  const ready = {}; let ex = 2;
  for (const ins of prog) {
    ex = Math.max(ex + 1, ...ins.src.map((r) => ready[r] || 0));
    ready[ins.rd] = ex + (fwd ? (ins.op === "lw" ? 2 : 1) : 3);
  }
  return ex + 2;
}
function parseAsm(txt) {
  return txt.trim().split("\n").map((l) => {
    let m = l.match(/lw\s+r(\d+), 0\(r(\d+)\)/); if (m) return { op: "lw", rd: +m[1], src: [+m[2]] };
    m = l.match(/(add|sub|and|or)\s+r(\d+), r(\d+), r(\d+)/); return { op: m[1], rd: +m[2], src: [+m[3], +m[4]] };
  });
}

// ================================================================ Дейкстра
test("Дейкстра: әр граф пен бастапқы төбеде d, prev және бекіту реті эталонмен бірдей; салмақты өңдеу", async ({ page }) => {
  const errs = await open(page, "academy/labs/dijkstra.html");
  const lab = page.locator("[data-cslab=dijkstra]");
  const verify = async (s) => {
    const g = parseG(await lab.locator(".cg-edges").textContent()), r = refDijkstra(g, s);
    await toEnd(lab);
    await expect(lab.locator("[data-k=order]")).toHaveText(r.order.join(" → "));
    const rows = await lab.locator("[data-k=tab] tr").evaluateAll((tr) => tr.map((x) => [+x.querySelector("th").textContent, x.querySelectorAll("td")[0].textContent]));
    for (const [v, d] of rows) expect(d, `d[${v}]`).toBe(fdist(r.d[v]));
    await expect(lab.locator(".cs-say")).toContainText("Кезек бос - алгоритм аяқталды");
  };
  for (const preset of ["city", "trap", "ties"]) {
    await lab.locator("[data-k=preset]").selectOption(preset);
    const vs = await lab.locator("[data-k=src] option").evaluateAll((o) => o.map((x) => +x.value));
    for (const s of [vs[0], vs[vs.length - 1]]) { await lab.locator("[data-k=src]").selectOption(String(s)); await verify(s); }
  }
  // релаксация формуласы: «Қала жолдары», 3-төбеден 2-ге
  await lab.locator("[data-k=preset]").selectOption("city");
  for (let i = 0; i < 5; i++) await lab.locator("[data-c=next]").click();
  await expect(lab.locator("[data-k=formula]")).toHaveText("d[2] = min(7, 2 + 3) = 5");
  await expect(lab.locator(".cs-say")).toContainText("5 < 7 - қысқарақ жол табылды: prev[2] = 3");
  await expect(lab.locator("[data-k=pq] b.dead")).toHaveText(["(7, 2)"]);   // (7, 2) енді ескірген
  for (let i = 0; i < 4; i++) await lab.locator("[data-c=next]").click();
  await expect(lab.locator(".cs-say")).toContainText("(7, 2) - ескірген жазба");
  await lab.locator("[data-c=prev]").click();
  await expect(lab.locator(".cs-say")).not.toContainText("ескірген жазба");
  // салмақты өңдеу (пернетақта баламасы) - 1–2 = 1 болса, d[2] = 1
  await lab.locator("[data-k=edit]").check();
  await lab.locator("[data-k=edge]").selectOption("0");
  await lab.locator("[data-k=w]").fill("1");
  await lab.locator("[data-c=setw]").click();
  await expect(lab.locator(".cg-edges")).toContainText("1–2 (1)");
  await verify(1);
  await lab.locator("[data-k=w]").fill("-3");
  await lab.locator("[data-c=setw]").click();
  await expect(lab.locator("[data-k=wmsg]")).toContainText("теріс цикл");
  // салмақ белгісін басу қабырғаны таңдайды
  await lab.locator(".dj-w").nth(3).click();
  await expect(lab.locator("[data-k=edge]")).toHaveValue("3");
  // ойнату / кідірту
  await lab.locator("[data-c=reset]").click();
  await lab.locator("[data-c=speed]").selectOption("2");
  await lab.locator("[data-c=play]").click();
  await expect(lab.locator("[data-c=pause]")).toBeEnabled();
  await lab.locator("[data-c=pause]").click();
  await expect(lab.locator("[data-c=play]")).toBeEnabled();
  expect(errs).toEqual([]);
});

test("Дейкстра: болжау режимі, теріс салмақ (Беллман-Форд эталоны) және себеп сұрағы", async ({ page }) => {
  const errs = await open(page, "academy/labs/dijkstra.html");
  const lab = page.locator("[data-cslab=dijkstra]");
  await lab.locator("[data-k=predict]").check();
  await expect(lab.locator("[data-c=play]")).toBeDisabled();
  await lab.locator('.cg-node[data-v="1"]').click();
  await expect(lab.locator("[data-fb=pred]")).toHaveClass(/tt-ok/);
  await lab.locator("[data-yn='1']").click();   // 1→2: ∞ → 7, жаңарады
  await expect(lab.locator("[data-fb=pred]")).toHaveClass(/tt-ok/);
  await lab.locator("[data-yn='0']").click();   // 1→3: жаңарады, «жоқ» - қате
  await expect(lab.locator("[data-fb=pred]")).toHaveClass(/tt-bad/);
  await expect(lab.locator("[data-fb=pred]")).toContainText("∞-ден кез келген сан кіші");
  await lab.locator('.cg-node[data-v="2"]').click();   // кезекте 2 (7) мен 3 (2): 2 - ең кішісі емес
  await expect(lab.locator("[data-fb=pred]")).toContainText("ең кішісі емес");
  await expect(lab.locator("[data-fb=pred]")).toContainText("d[2] = 7 > d[3] = 2");
  await expect(lab.locator(".cs-score")).toHaveText("Болжам: 2 / 4 дұрыс");
  const sk = await skills(page);
  expect(sk["cs.dijkstra.predict"].n).toBe(4);
  // теріс салмақ: беттегі кесте эталонмен
  await lab.locator("[data-k=predict]").uncheck();
  await lab.locator("[data-k=preset]").selectOption("neg");
  const g = parseG(await lab.locator(".cg-edges").textContent());
  expect(g.dir).toBe(true);
  const D = refDijkstra(g, 1), BF = refBF(g, 1);
  const neg = page.locator("[data-cslab=dijkstra-neg]");
  const rows = await neg.locator("[data-k=negtab] tr").evaluateAll((tr) => tr.map((x) => [+x.querySelector("th").textContent, ...[...x.querySelectorAll("td")].map((t) => t.textContent)]));
  for (const [v, dj, bf] of rows) { expect(dj).toBe(fdist(D.d[v])); expect(bf).toBe(fdist(BF[v])); }
  expect(rows.filter((r) => r[1] !== r[2]).length).toBeGreaterThan(0);   // Дейкстра шынымен қателеседі
  await toEnd(lab);
  const tab = await lab.locator("[data-k=tab] tr td:nth-of-type(1)").allTextContents();
  expect(tab).toEqual(g.V.map((v) => fdist(D.d[v])));
  // қадамдардың бірінде «бекітілген төбе қайта ашылмайды»
  await expect(lab.locator("[data-k=steps] li", { hasText: "бекітіліп қойған" })).toHaveCount(1);
  await neg.locator("[data-why=pq]").click();
  await expect(neg.locator("[data-fb=neg]")).toHaveClass(/tt-bad/);
  await expect(neg.locator("[data-fb=neg]")).toContainText("Кезек дұрыс жұмыс істеді");
  await neg.locator("[data-why=fin]").click();
  await expect(neg.locator("[data-fb=neg]")).toHaveClass(/tt-ok/);
  await neg.locator("[data-c=show]").click();
  await expect(lab.locator("[data-k=preset]")).toHaveValue("neg");
  expect(errs).toEqual([]);
});

test("Дейкстра: қорытынды тапсырма - кездейсоқ граф, диагноз, үш деңгейлі көмек", async ({ page }) => {
  const errs = await open(page, "academy/labs/dijkstra.html");
  const t = page.locator("[data-cslab=dijkstra-task]");
  for (let k = 0; k < 4; k++) {
    const g = parseG(await t.locator("[data-k=tedges]").textContent());
    const [s, tg] = ((await t.locator("[data-k=q]").textContent()).match(/\d+/g) || []).map(Number);
    const r = refDijkstra(g, s), path = []; for (let v = tg; v != null; v = r.prev[v]) path.unshift(v);
    const direct = g.E.find(([a, b]) => (a === s && b === tg) || (a === tg && b === s));
    // ең аз қабырғалы жолдардың ең жеңілі (эталон)
    const hop = { [s]: 0 }, best = { [s]: 0 }, Q = [s];
    while (Q.length) { const u = Q.shift(); for (const [a, b, w] of g.arcs) if (a === u) { if (hop[b] == null) { hop[b] = hop[u] + 1; best[b] = best[u] + w; Q.push(b); } else if (hop[b] === hop[u] + 1) best[b] = Math.min(best[b], best[u] + w); } }
    expect(path.length).toBeGreaterThanOrEqual(3);
    if (direct && direct[2] > r.d[tg]) {
      await t.locator("[data-k=dist]").fill(String(direct[2])); await t.locator("[data-k=path]").fill(`${s} ${tg}`);
      await t.locator("[data-c=check]").click();
      await expect(t.locator("[data-fb=task]")).toContainText("Тікелей қабырға ең қысқа жол емес");
    } else {
      expect(best[tg]).toBeGreaterThan(r.d[tg]);
      await t.locator("[data-k=dist]").fill(String(best[tg])); await t.locator("[data-c=check]").click();
      await expect(t.locator("[data-fb=task]")).toContainText("Аз қабырға ≠ аз салмақ");
    }
    await expect(t.locator("[data-fb=task]")).toHaveClass(/tt-bad/);
    await t.locator("[data-k=dist]").fill(String(r.d[tg]));
    await t.locator("[data-k=path]").fill(path.slice(0, -1).join(" "));
    await t.locator("[data-c=check]").click();
    await expect(t.locator("[data-fb=task]")).toContainText("Жол басы не соңы қате");
    await t.locator("[data-k=path]").fill(path.join(" "));
    await t.locator("[data-c=check]").click();
    await expect(t.locator("[data-fb=task]")).toHaveClass(/tt-ok/);
    if (k === 3) {
      for (let i = 0; i < 3; i++) await t.locator(".tt-hbtn").click();
      await expect(t.locator(".tt-hlist li").nth(2)).toContainText(`Жауап: ұзындығы ${r.d[tg]}`);
      await expect(t.locator("[data-fb=task]")).toContainText("меңгеруге саналмайды");
    }
    await t.locator("[data-c=new]").click();
  }
  const sk = await skills(page);
  expect(sk["cs.dijkstra"].n).toBe(12);
  expect(errs).toEqual([]);
});

// ================================================================ ОЖ жоспарлаушысы
const readProcs = (lab) => lab.locator("[data-k=ptab] tr").evaluateAll((tr) => tr.map((r) => ({ a: +r.querySelector("[data-f=a]").value, b: +r.querySelector("[data-f=b]").value, pr: +r.querySelector("[data-f=pr]").value })));
test("Жоспарлаушы: әр алгоритм мен жиында Гант пен метрикалар эталонмен бірдей; кестені өңдеу, квант", async ({ page }) => {
  const errs = await open(page, "academy/labs/scheduler.html");
  const lab = page.locator("[data-cslab=sched]");
  const verify = async (algo, q) => {
    const ps = await readProcs(lab), r = refSched(ps, algo, q);
    await toEnd(lab);
    await expect(lab.locator("[data-k=gtext]")).toHaveText(r.text);
    const foot = await lab.locator("[data-k=mfoot] td").allTextContents();
    expect(foot).toEqual([kz(r.tat), kz(r.wt), kz(r.rt)]);
    return r;
  };
  for (const preset of ["basic", "convoy", "starve", "rr"]) {
    await lab.locator("[data-k=preset]").selectOption(preset);
    for (const algo of ["fcfs", "sjf", "srtf", "rr", "prio"]) { await lab.locator(`[data-algo=${algo}]`).click(); await verify(algo, 2); }
  }
  // классикалық мәндер (оқулықтағы мысал): SJF 4, SRTF 3
  await lab.locator("[data-k=preset]").selectOption("basic");
  const cmp = await lab.locator("[data-k=cmp] tr").evaluateAll((tr) => tr.map((x) => [...x.querySelectorAll("td")].map((t) => t.textContent)));
  const ps = await readProcs(lab);
  ["fcfs", "sjf", "srtf", "rr", "prio"].forEach((a, i) => { const r = refSched(ps, a, 2); expect(cmp[i][0]).toBe(kz(r.wt)); expect(cmp[i][4]).toBe(r.order.join(" ")); });
  expect(cmp[1][0]).toBe("4"); expect(cmp[2][0]).toBe("3");
  // квант
  await lab.locator("[data-algo=rr]").click();
  for (const q of [1, 3, 20]) { await lab.locator("[data-k=q]").fill(String(q)); await lab.locator("[data-k=q]").dispatchEvent("change"); await verify("rr", q); }
  // кестені өңдеу: бос аралық (idle) пайда болады
  await lab.locator("[data-k=q]").fill("2"); await lab.locator("[data-k=q]").dispatchEvent("change");
  await lab.locator("[data-c=add]").click();
  const last = lab.locator("[data-k=ptab] tr").last();
  await last.locator("[data-f=a]").fill("30"); await last.locator("[data-f=a]").dispatchEvent("change");
  for (const algo of ["fcfs", "srtf", "rr"]) { await lab.locator(`[data-algo=${algo}]`).click(); const r = await verify(algo, 2); expect(r.text).toContain("бос"); }
  await last.locator("[data-f=b]").fill("0"); await last.locator("[data-f=b]").dispatchEvent("change");
  await expect(lab.locator("[data-k=pmsg]")).toContainText("орындалу 1…20");
  // ойнату / кідірту
  await lab.locator("[data-c=reset]").click();
  await lab.locator("[data-c=play]").click();
  await expect(lab.locator("[data-c=pause]")).toBeEnabled();
  await lab.locator("[data-c=pause]").click();
  expect(errs).toEqual([]);
});

test("Жоспарлаушы: болжау - критерий шатасуына нақты түсіндірме", async ({ page }) => {
  const errs = await open(page, "academy/labs/scheduler.html");
  const lab = page.locator("[data-cslab=sched]"), fb = lab.locator("[data-fb=pred]");
  await lab.locator("[data-k=predict]").check();
  // FCFS: t=0 P1; t=7 - P3 ең қысқа, бірақ FCFS
  await lab.locator("[data-p='0']").click(); await expect(fb).toHaveClass(/tt-ok/);
  await lab.locator("[data-p='2']").click(); await expect(fb).toContainText("Бұл SJF ойы");
  // SRTF: t=2 P2 келді, P1 жалғастырады деу - қате
  await lab.locator("[data-algo=srtf]").click();
  await lab.locator("[data-p='0']").click();
  await lab.locator("[data-p='0']").click(); await expect(fb).toContainText("SRTF кесіп алады");
  // SJF: t=0-де P3 әлі келмеген
  await lab.locator("[data-algo=sjf]").click();
  await lab.locator("[data-p='2']").click(); await expect(fb).toContainText("әлі келген жоқ");
  // Priority: t=7 дайын P2 (1), P3 (4), P4 (2): P3 - үлкен сан
  await lab.locator("[data-algo=prio]").click();
  await lab.locator("[data-p='0']").click();
  await lab.locator("[data-p='2']").click(); await expect(fb).toContainText("Кіші сан = жоғары басымдық");
  // RR: t=2 P1 кванты бітті, P2 келді: P1 - кезектің соңында
  await lab.locator("[data-algo=rr]").click();
  await lab.locator("[data-p='0']").click();
  await lab.locator("[data-p='0']").click(); await expect(fb).toContainText("Кванты біткен процесс кезектің соңында");
  await lab.locator("[data-p='idle']").click(); await expect(fb).toContainText("CPU бос емес");
  const sk = await skills(page);
  expect(sk["cs.sched.predict"].n).toBe(10);
  expect(sk["cs.sched.predict"].ok).toBe(4);
  expect(errs).toEqual([]);
});

test("Жоспарлаушы: қорытынды тапсырма - Гант реті мен орташа WT, диагноз, көмек", async ({ page }) => {
  const errs = await open(page, "academy/labs/scheduler.html");
  const t = page.locator("[data-cslab=sched-task]");
  const MAP = { FCFS: "fcfs", "SJF": "sjf", "SRTF": "srtf", "Round Robin": "rr", "Priority": "prio" };
  for (let k = 0; k < 6; k++) {
    const ps = await t.locator("[data-k=tproc] tr").evaluateAll((tr) => tr.map((r) => { const [a, b, pr] = [...r.querySelectorAll("td")].map((x) => +x.textContent); return { a, b, pr }; }));
    const qt = await t.locator("[data-k=q]").textContent();
    const algo = MAP[qt.match(/^Алгоритм: (FCFS|SJF|SRTF|Round Robin|Priority)/)[1]], q = +(qt.match(/квант q = (\d+)/) || [0, 2])[1];
    const r = refSched(ps, algo, q);
    expect(r.text).not.toContain("бос");
    if (algo !== "fcfs") {
      await t.locator("[data-k=ord]").fill(refSched(ps, "fcfs").order.join(" ")); await t.locator("[data-k=wt]").fill(kz(r.wt));
      await t.locator("[data-c=check]").click();
      await expect(t.locator("[data-fb=task]")).toContainText("Бұл FCFS реті");
    }
    await t.locator("[data-k=ord]").fill(r.order.join(" ")); await t.locator("[data-k=wt]").fill(kz(r.tat));
    await t.locator("[data-c=check]").click();
    await expect(t.locator("[data-fb=task]")).toHaveClass(/tt-bad/);
    await expect(t.locator("[data-fb=task]")).toContainText("АЙНАЛЫМ");
    await t.locator("[data-k=wt]").fill(String(Math.round(r.wt * 100) / 100));   // нүктемен де қабылданады
    await t.locator("[data-c=check]").click();
    await expect(t.locator("[data-fb=task]")).toHaveClass(/tt-ok/);
    if (k === 5) {
      for (let i = 0; i < 3; i++) await t.locator(".tt-hbtn").click();
      await expect(t.locator(".tt-hlist li").nth(2)).toContainText(`Жауап: ${r.order.join(" ")}; ${kz(r.wt)}.`);
      await expect(t.locator("[data-fb=task]")).toContainText("меңгеруге саналмайды");
    }
    await t.locator("[data-c=new]").click();
  }
  expect(errs).toEqual([]);
});

// ================================================================ CPU: кэш және конвейер
const cfgOf = async (lab) => ({ B: +(await lab.locator("[data-k=B]").inputValue()), L: +(await lab.locator("[data-k=L]").inputValue()), W: +(await lab.locator("[data-k=W]").inputValue()) });
const pctKz = (h, n) => `${h}/${n} = ${String(Math.round((h / n) * 1000) / 10).replace(".", ",")}%`;
test("Кэш: тізбектер мен баптаулар бойынша hit/miss эталонмен бірдей; адресті бөлу; салыстыру кестесі", async ({ page }) => {
  const errs = await open(page, "academy/labs/cpu.html");
  const lab = page.locator("[data-cslab=cache]");
  const runTrace = async () => {
    const c = await cfgOf(lab);
    await toEnd(lab);
    const items = await lab.locator("[data-k=trace] li").allTextContents();
    const tr = items.map((x) => +x.split(" ")[0]), marks = items.map((x) => x.split(" ")[1]);
    const ref = refCache(tr, c.B, c.L, c.W);
    expect(marks).toEqual(ref);
    const h = ref.filter((x) => x === "H").length;
    await expect(lab.locator("[data-k=stat]")).toContainText(`Hit rate: ${pctKz(h, tr.length)}`);
    return { tr, ref, h };
  };
  for (const [B, L, W] of [[16, 4, 1], [16, 4, 2], [8, 8, 1], [4, 4, 2]]) {
    await lab.locator("[data-k=B]").selectOption(String(B)); await lab.locator("[data-k=L]").selectOption(String(L)); await lab.locator("[data-k=W]").selectOption(String(W));
    for (const tk of ["seq", "conflict", "col"]) { await lab.locator("[data-k=tsel]").selectOption(tk); await runTrace(); }
    // салыстыру кестесі (барлық дайын тізбек, екі ассоциативтілік)
    const rows = await lab.locator("[data-k=cmp] tr").evaluateAll((tr) => tr.map((x) => [...x.querySelectorAll("td")].map((t) => t.textContent)));
    const names = ["seq", "stride", "row", "col", "conflict"];
    const traces = { seq: [...Array(16)].map((_, i) => i * 4), stride: [...Array(16)].map((_, i) => (i % 8) * 16), row: [...Array(32)].map((_, i) => i * 4), col: [...Array(32)].map((_, i) => (i % 4) * 32 + Math.floor(i / 4) * 4), conflict: [0, 64, 0, 64, 0, 64, 4, 68] };
    names.forEach((n, i) => [1, 2].forEach((w, j) => { const r = refCache(traces[n], B, L, w); expect(rows[i][j]).toBe(pctKz(r.filter((x) => x === "H").length, r.length)); }));
  }
  // локальдылық туралы нақты тұжырымдар (B = 16, L = 4)
  await page.locator("[data-demo='row:16:4:1']").click(); expect((await runTrace()).h).toBe(24);
  await page.locator("[data-demo='col:16:4:1']").click(); expect((await runTrace()).h).toBe(0);
  await page.locator("[data-demo='conflict:16:4:1']").click(); expect((await runTrace()).h).toBe(0);
  await page.locator("[data-demo='conflict:16:4:2']").click(); expect((await runTrace()).h).toBe(6);
  // өз тізбегім
  await lab.locator("[data-k=tsel]").selectOption("custom");
  await lab.locator("[data-k=tin]").fill("0x10 17 300");
  await lab.locator("[data-c=tapply]").click();
  await expect(lab.locator("[data-k=tmsg]")).toContainText("«300»");
  await lab.locator("[data-k=tin]").fill("0x10 17 0x31 16 48 200 16");
  await lab.locator("[data-c=tapply]").click();
  const { tr } = await runTrace();
  expect(tr).toEqual([16, 17, 49, 16, 48, 200, 16]);
  // адресті бөлу
  await lab.locator("[data-k=B]").selectOption("8"); await lab.locator("[data-k=L]").selectOption("8"); await lab.locator("[data-k=W]").selectOption("2");
  await lab.locator("[data-k=addr]").fill("0x5C");
  await expect(lab.locator("[data-k=amsg]")).toContainText("Ығысу = 92 mod 8 = 4; блок = ⌊92 / 8⌋ = 11; индекс = 11 mod 4 = 3; тег = ⌊11 / 4⌋ = 2");
  await expect(lab.locator("[data-k=abits] i")).toHaveText(["0", "1", "0", "1", "1", "1", "0", "0"]);
  const qz = page.locator("[data-cslab=cache-addr]");
  for (let i = 0; i < 3; i++) {
    const a = +(await qz.locator("[data-k=qq]").textContent()).match(/Адрес (\d+)/)[1];
    const blk = Math.floor(a / 8), idx = blk % 4, tag = Math.floor(blk / 4), off = a % 8;
    // 2 жолды кэште индексті 8 жиынмен есептеу - нақты диагноз
    await qz.locator("[data-k=tag]").fill(String(Math.floor(blk / 8))); await qz.locator("[data-k=idx]").fill(String(blk % 8)); await qz.locator("[data-k=off]").fill(String(off));
    await qz.locator("[data-c=qcheck]").click();
    if (Math.floor(blk / 8) !== tag || blk % 8 !== idx) await expect(qz.locator("[data-fb=addr]")).toContainText("Индекс жол санымен есептелді");
    await qz.locator("[data-k=tag]").fill(String(tag)); await qz.locator("[data-k=idx]").fill(String(idx));
    await qz.locator("[data-c=qcheck]").click();
    await expect(qz.locator("[data-fb=addr]")).toHaveClass(/tt-ok/);
    await qz.locator("[data-c=qnew]").click();
  }
  expect(errs).toEqual([]);
});

test("Кэш: болжау режимі және қорытынды трасса тапсырмасы (диагноз, көмек)", async ({ page }) => {
  const errs = await open(page, "academy/labs/cpu.html");
  const lab = page.locator("[data-cslab=cache]"), fb = lab.locator("[data-fb=pred]");
  await lab.locator("[data-k=predict]").check();
  await expect(lab.locator("[data-c=play]")).toBeDisabled();
  await lab.locator("[data-hm=h]").click(); await expect(fb).toContainText("міндетті");
  await lab.locator("[data-hm=m]").click(); await expect(fb).toContainText("БЛОКТЫ сақтайды");
  await lab.locator("[data-hm=h]").click(); await expect(fb).toHaveClass(/tt-ok/);
  await page.locator("[data-demo='conflict:16:4:1']").click();
  await lab.locator("[data-hm=m]").click(); await lab.locator("[data-hm=m]").click();
  await lab.locator("[data-hm=h]").click(); await expect(fb).toContainText("ығыстырды");
  expect((await skills(page))["cs.cache.predict"].n).toBe(6);
  const t = page.locator("[data-cslab=cache-task]");
  let n = 0;
  for (let k = 0; k < 6; k++) {
    const q = await t.locator("[data-k=q]").textContent();
    const [, L, B] = q.match(/Кэш: (\d+) жол × (\d+) байт/).map(Number), W = q.includes("2 жолды") ? 2 : 1;
    const tr = q.match(/Адрестер \(8 бит\): ([\d, ]+)\./)[1].split(", ").map(Number);
    expect(tr).toHaveLength(8);
    const ref = refCache(tr, B, L, W), other = refCache(tr, B, L, 3 - W), h = ref.filter((x) => x === "H").length;
    expect(other.join("")).not.toBe(ref.join(""));
    await t.locator("[data-k=cls]").fill(other.join(" ")); await t.locator("[data-k=rate]").fill(`${h}/8`);
    await t.locator("[data-c=check]").click();
    await expect(t.locator("[data-fb=task]")).toContainText(W === 1 ? "Бұл 2 жолды кэштің жауабы" : "Бұл тікелей сәйкестік кэштің жауабы");
    if (h !== 4) {
      await t.locator("[data-k=cls]").fill(ref.join(" ")); await t.locator("[data-k=rate]").fill(`${8 - h}/8`);
      await t.locator("[data-c=check]").click();
      await expect(t.locator("[data-fb=task]")).toContainText("miss rate"); n += 1;
    } else await t.locator("[data-k=cls]").fill(ref.join(" "));
    await t.locator("[data-k=rate]").fill(String(Math.round((h / 8) * 1000) / 10).replace(".", ",") + "%");
    await t.locator("[data-c=check]").click();
    await expect(t.locator("[data-fb=task]")).toHaveClass(/tt-ok/); n += 2;
    if (k === 5) {
      for (let i = 0; i < 3; i++) await t.locator(".tt-hbtn").click();
      await expect(t.locator(".tt-hlist li").nth(2)).toContainText(`Жауап: ${ref.join(" ")}; ${h}/8`);
    }
    await t.locator("[data-c=new]").click();
  }
  expect((await skills(page))["cs.cache"].n).toBe(n);
  expect(errs).toEqual([]);
});

test("Конвейер: циклдар саны эталонмен (форвардингпен/сыз), қадамдау, тапсырма", async ({ page }) => {
  const errs = await open(page, "academy/labs/cpu.html");
  const lab = page.locator("[data-cslab=pipe]");
  for (const p of ["loaduse", "alu", "indep"]) {
    await lab.locator("[data-k=psel]").selectOption(p);
    for (const fwd of [false, true]) {
      await lab.locator("[data-k=fwd]").setChecked(fwd);
      const total = refPipe(parseAsm(await lab.locator("[data-k=asm]").textContent()), fwd);
      await expect(lab.locator("[data-k=pstat]")).toContainText(`Барлығы: ${total} цикл`);
      await toEnd(lab);
      await expect(lab.locator(".cs-n")).toHaveText(`${total} / ${total}`);
      await expect(lab.locator("[data-k=grid] tbody tr").last().locator("td").nth(total - 1)).toHaveText("WB");
    }
  }
  // оқулықтағы мәндер: lw → add (load-use) форвардингсіз 14, форвардингпен 9
  await lab.locator("[data-k=psel]").selectOption("loaduse");
  await lab.locator("[data-k=fwd]").setChecked(false);
  await expect(lab.locator("[data-k=pstat]")).toContainText("Барлығы: 14 цикл");
  await lab.locator("[data-k=fwd]").setChecked(true);
  await expect(lab.locator("[data-k=pstat]")).toContainText("Барлығы: 9 цикл");
  await expect(lab.locator("[data-k=pstat]")).toContainText("Тоқтау: 1");
  for (let i = 0; i < 4; i++) await lab.locator("[data-c=next]").click();
  await expect(lab.locator(".cs-say")).toContainText("ID-да күтеді (тоқтау): r1");
  await lab.locator("[data-c=next]").click();
  await expect(lab.locator(".cs-say")).toContainText("MEM/WB → EX форвардингі");
  const t = page.locator("[data-cslab=pipe-task]");
  for (let k = 0; k < 5; k++) {
    const prog = parseAsm(await t.locator("[data-k=pasm]").textContent()), fwd = (await t.locator("[data-k=pq]").textContent()).includes("ҚОСУЛЫ");
    const total = refPipe(prog, fwd);
    expect(total).not.toBe(prog.length + 4);
    await t.locator("[data-k=pans]").fill(String(prog.length + 4)); await t.locator("[data-c=pcheck]").click();
    if (refPipe(prog, !fwd) !== prog.length + 4) await expect(t.locator("[data-fb=pipe]")).toContainText("Қауіптер ескерілмеді");
    await t.locator("[data-k=pans]").fill(String(refPipe(prog, !fwd))); await t.locator("[data-c=pcheck]").click();
    await expect(t.locator("[data-fb=pipe]")).toContainText(fwd ? "Бұл форвардингсіз жауап" : "Бұл форвардингпен жауап");
    await t.locator("[data-k=pans]").fill(String(total)); await t.locator("[data-c=pcheck]").click();
    await expect(t.locator("[data-fb=pipe]")).toHaveClass(/tt-ok/);
    if (k === 4) { for (let i = 0; i < 3; i++) await t.locator(".tt-hbtn").click(); await expect(t.locator(".tt-hlist li").nth(2)).toContainText(`Жауап: ${total}.`); }
    await t.locator("[data-c=pnew]").click();
  }
  await t.locator("[data-c=pload]").click();
  await expect(lab.locator("[data-k=asm]")).toHaveText(await t.locator("[data-k=pasm]").textContent());
  expect((await skills(page))["cs.pipeline"].n).toBe(15);
  expect(errs).toEqual([]);
});

// ================================================================ телефон, a11y, reduced motion
for (const scheme of ["light", "dark"]) {
  test(`A тобы зертханалары (${scheme}): 360px жылжу жоқ, a11y, reduced motion`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    const errs = collectErrors(p);
    const problems = [];
    for (const url of ["academy/labs/dijkstra.html", "academy/labs/scheduler.html", "academy/labs/cpu.html"]) {
      await p.goto(url);
      await expect(p.locator("details.ca-steps").first()).toHaveAttribute("open", "");   // анимацияның статикалық баламасы ашық
      if (url.includes("dijkstra")) { await p.locator("[data-k=predict]").check(); await p.locator("[data-k=edit]").check(); await p.locator('.cg-node[data-v="2"]').click(); await p.locator("[data-cslab=dijkstra-task] [data-c=check]").click(); await p.locator("[data-cslab=dijkstra-task] .tt-hbtn").click(); }
      if (url.includes("scheduler")) { await p.locator("[data-algo=rr]").click(); await p.locator("[data-k=predict]").check(); await p.locator("[data-p='1']").click(); await p.locator("[data-cslab=sched-task] .tt-hbtn").click(); }
      if (url.includes("cpu")) { await p.locator("[data-k=predict]").check(); await p.locator("[data-hm=h]").click(); await p.locator("[data-cslab=pipe] [data-c=next]").click(); await p.locator("[data-cslab=cache-task] [data-c=check]").click(); }
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), url).toBe(true);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run(document.querySelector("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0].target.join(" ")} ${x.nodes[0].failureSummary}`));
      v.forEach((x) => problems.push(`${url}: ${x}`));
    }
    expect(problems, problems.join("\n")).toEqual([]);
    expect(errs).toEqual([]);
    await c.close();
  });
}
