/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* CS Universe: ОЖ процессорын жоспарлау зертханасы (academy/labs/scheduler.html).
   Симуляция бүтін уақыт бірліктерімен жүреді; кадр - жоспарлаушы шешім қабылдаған сәт.
   Келісімдер (UI-да айтылады, тестте тәуелсіз эталонмен тексеріледі):
   - тең жағдайда: ерте келгені, сосын кіші нөмір (P1 < P2 ...);
   - SJF және Priority - үзбейтін (non-preemptive); Priority-де КІШІ сан = ЖОҒАРЫ басымдық;
   - SRTF: жаңа процесс келгенде, оның қалған уақыты ағымдағынікінен ҚАТАҢ кіші болса ғана ауысады;
   - Round Robin: t сәтінде келгендер кезекке кванты біткен процестен БҰРЫН тұрады; кезекте басқа ешкім болмаса, сол процесс жалғастырады;
   - метрикалар: TAT = C − A, WT = TAT − B, RT = (алғаш CPU алған сәт) − A. */
(() => {
  "use strict";
  const T = window.AO17Tutor, A = window.CSLabA;
  const NAMES = { fcfs: "FCFS", sjf: "SJF (үзбейтін)", srtf: "SRTF (үзетін SJF)", rr: "Round Robin", prio: "Priority (үзбейтін)" };
  const ORDER = ["fcfs", "sjf", "srtf", "rr", "prio"];
  const PRESETS = {
    basic: { name: "Негізгі мысал (4 процесс)", procs: [[0, 7, 3], [2, 4, 1], [4, 1, 4], [5, 4, 2]] },
    convoy: { name: "Конвой әсері", procs: [[0, 20, 3], [1, 2, 1], [1, 3, 2], [2, 2, 2]] },
    starve: { name: "Аштық (басымдық)", procs: [[0, 4, 1], [1, 3, 5], [2, 4, 1], [5, 4, 2], [8, 3, 1]] },
    rr: { name: "Квант тәжірибесі (RR)", procs: [[0, 5, 2], [1, 3, 1], [2, 1, 3], [3, 2, 2]] },
  };
  const mk = (arr) => arr.map(([a, b, pr], i) => ({ id: "P" + (i + 1), a, b, pr }));
  const sum = (a) => a.reduce((x, y) => x + y, 0);

  // ---------------------------------------------------------------- симуляция
  function simulate(ps, algo, q = 2, opt = {}) {
    const n = ps.length, rem = ps.map((p) => p.b), first = Array(n).fill(null), comp = Array(n).fill(null);
    const tl = [], F = []; let ready = [], run = null, ql = 0, t = 0, done = 0;
    const keyOf = (i) => (algo === "fcfs" ? [ps[i].a] : algo === "sjf" ? [ps[i].b, ps[i].a] : algo === "srtf" ? [rem[i], ps[i].a] : algo === "prio" ? [opt.prioMax ? -ps[i].pr : ps[i].pr, ps[i].a] : [0]).concat([i]);
    const cmp = (x, y) => { const kx = keyOf(x), ky = keyOf(y); for (let j = 0; j < kx.length; j++) if (kx[j] !== ky[j]) return kx[j] - ky[j]; return 0; };
    const best = () => (algo === "rr" ? ready[0] : ready.slice().sort(cmp)[0]);
    const nm = (i) => ps[i].id;
    const lst = (a) => a.map(nm).join(", ");
    F.push({ t: 0, kind: "init", run: null, cands: [], ready: [], rem: rem.slice(), msg: `Бастау. Алгоритм: ${NAMES[algo]}${algo === "rr" ? `, квант q = ${q}` : ""}. Жоспарлаушы CPU босағанда` + (algo === "srtf" ? " немесе жаңа процесс келгенде" : algo === "rr" ? " немесе квант біткенде" : "") + " шешім қабылдайды." });
    let guard = 0;
    while (done < n && guard++ < 2000) {
      const ev = [];
      const arr = opt.ignoreArrival ? [] : ps.map((p, i) => i).filter((i) => ps[i].a === t);
      (opt.ignoreArrival ? (t === 0 ? ps.map((p, i) => i) : []) : arr).forEach((i) => ready.push(i));
      if (run != null && rem[run] === 0) { comp[run] = t; done++; ev.push(`${nm(run)} аяқталды (C = ${t})`); run = null; }
      if (done === n) break;
      if (arr.length) ev.push(`${lst(arr)} келді`);
      let kind = null, prevRun = run, expired = null;
      if (algo === "rr" && run != null && ql === 0) {
        if (opt.rrOld) { ready = ready.filter((i) => !arr.includes(i)); ready.push(run); arr.forEach((i) => ready.push(i)); } else ready.push(run);
        expired = run; ev.push(`${nm(run)} кванты (q = ${q}) бітті - кезектің соңына тұрды`); run = null;
      }
      let cands = null;
      if (algo === "srtf" && run != null && arr.length) {
        const c = best();
        if (c != null && rem[c] < rem[run]) { cands = ready.concat([run]); ready.push(run); kind = "preempt"; run = null; }
        else { cands = ready.concat([run]); kind = "keep"; }
      }
      if (run == null) {
        if (ready.length) {
          if (!cands) cands = ready.slice();
          const c = best(); ready.splice(ready.indexOf(c), 1); run = c; ql = q; if (first[c] == null) first[c] = t;
          kind = kind || "pick";
        } else if (t === 0 || tl[t - 1] !== null) { kind = "idle"; cands = []; }
      }
      if (kind) {
        const why = reason(kind, run, cands, prevRun, expired);
        F.push({ t, kind, run, prev: prevRun, expired, cands: cands.slice(), ready: ready.slice(), rem: rem.slice(), msg: `t = ${t}: ` + (ev.length ? ev.join("; ") + ". " : "") + why });
      }
      tl.push(run);
      if (run != null) { rem[run]--; ql--; }
      t++;
    }
    function reason(kind, r, cands, prev, expired) {
      const cs = cands.filter((i) => i !== r);
      if (kind === "idle") { const nx = ps.filter((p, i) => comp[i] == null && p.a > t).map((p) => p.a); return `Дайын процесс жоқ - CPU бос${nx.length ? `, келесі келу t = ${Math.min(...nx)}` : ""}.`; }
      if (kind === "keep") return `SRTF салыстырады: ${cs.map((i) => `${nm(i)} қалды ${rem[i]}`).join(", ")}; ағымдағы ${nm(r)} қалды ${rem[r]}. Қатаң кіші емес - ауыстыру жоқ, ${nm(r)} жалғастырады.`;
      const R = nm(r), dq = `Дайын: ${lst(cands)}. `;
      if (kind === "preempt") return `${dq}${R} қалды ${rem[r]} < ${nm(prev)} қалды ${rem[prev]} - SRTF ${nm(prev)} процесін кесіп алып (preemption), CPU-ды ${R} процесіне береді.`;
      if (algo === "fcfs") return `${dq}FCFS - ең ерте келгені: ${R} (A = ${ps[r].a}). Соңына дейін орындалады.`;
      if (algo === "sjf") return `${dq}SJF - орындалу уақыты (B) ең қысқасы: ${R} (B = ${ps[r].b})${cs.length ? "; " + cs.map((i) => `${nm(i)}: ${ps[i].b}`).join(", ") : ""}. Үзілмейді.`;
      if (algo === "srtf") return `${dq}SRTF - қалған уақыты ең азы: ${R} (қалды ${rem[r]})${cs.length ? "; " + cs.map((i) => `${nm(i)}: ${rem[i]}`).join(", ") : ""}.`;
      if (algo === "prio") return `${dq}Басымдық саны ең кішісі (кіші сан = жоғары басымдық): ${R} (басымдық ${ps[r].pr})${cs.length ? "; " + cs.map((i) => `${nm(i)}: ${ps[i].pr}`).join(", ") : ""}. Үзілмейді.`;
      return `Кезек (басынан): ${lst(cands)}. RR - кезектің басындағы ${R}; ол ең көбі q = ${q} бірлік орындалады (қалды ${rem[r]}).` + (expired === r ? " Кезекте басқа ешкім жоқ - сол процесс жалғастырады." : "");
    }
    const segs = segments(tl, tl.length);
    const m = ps.map((p, i) => ({ id: p.id, a: p.a, b: p.b, pr: p.pr, s: first[i], c: comp[i], tat: comp[i] - p.a, wt: comp[i] - p.a - p.b, rt: first[i] - p.a }));
    const avg = { wt: sum(m.map((x) => x.wt)) / n, tat: sum(m.map((x) => x.tat)) / n, rt: sum(m.map((x) => x.rt)) / n };
    const busy = segs.filter((s) => s.p != null);
    F.push({ t: tl.length, kind: "end", run: null, cands: [], ready: [], rem: rem.slice(), msg: `t = ${tl.length}: барлық процесс аяқталды. Гант реті: ${busy.map((s) => ps[s.p].id).join(" → ")}. Орташа күту уақыты ${A.num(avg.wt)}, орташа айналым ${A.num(avg.tat)}, орташа жауап ${A.num(avg.rt)}.` });
    return { frames: F, tl, segs, m, avg, order: busy.map((s) => ps[s.p].id), switches: Math.max(0, busy.length - 1), T: tl.length };
  }
  function segments(tl, upto) {
    const out = [];
    for (let t = 0; t < upto; t++) { const p = tl[t], L = out[out.length - 1]; if (L && L.p === p) L.e = t + 1; else out.push({ p, s: t, e: t + 1 }); }
    return out;
  }
  window.CSLabSched = { simulate, PRESETS };

  // ---------------------------------------------------------------- Гант диаграммасы
  function gantt(host, ps, segs, T, opt = {}) {
    const W = Math.max(T, 1), pct = (x) => (x / W) * 100;
    const bar = segs.map((s, i) => `<span class="sc-seg ${s.p == null ? "idle" : "c" + (s.p % 6 + 1)}${opt.newFrom != null && s.e > opt.newFrom && i === segs.length - 1 ? " new" : ""}" style="left:${pct(s.s)}%;width:${pct(s.e - s.s)}%">${s.p == null ? "бос" : ps[s.p].id}</span>`).join("");
    const ticks = [...new Set([0, ...segs.map((s) => s.e)])];
    const now = opt.now != null ? `<i class="sc-now" style="left:${pct(opt.now)}%" aria-hidden="true"></i>` : "";
    host.innerHTML = `<div class="sc-bar">${bar}${now}</div><div class="sc-ticks">${ticks.map((x) => `<span style="left:${pct(x)}%"${x === opt.now ? ' class="now"' : ""}>${x}</span>`).join("")}</div>`;
  }
  const gtext = (ps, segs) => segs.map((s) => `${s.p == null ? "бос" : ps[s.p].id} [${s.s}–${s.e}]`).join(" → ");

  // ---------------------------------------------------------------- 1-4. негізгі зертхана
  const root = document.querySelector("[data-cslab=sched]");
  if (root) (() => {
    const $ = (s) => root.querySelector(s);
    let ps = mk(PRESETS.basic.procs), algo = "fcfs", q = 2, run = null, predict = false, score = { ok: 0, n: 0 };
    const say = $(".cs-say"), ask = $(".cs-ask"), fb = $("[data-fb=pred]"), det = $("[data-k=steps]");
    A.initSteps(det);
    const P = A.player($(".cs-ctl"), {
      len: () => run.frames.length, draw, blocked: () => predict, ms: 1700,
      onNext: () => { if (pending()) T.feedback(fb, "info", "Болжамсыз көрсетілді", "Бұл қадам болжам есебіне кірмейді."); return false; },
      onReset: () => { fb.className = ""; fb.textContent = ""; },
    });
    const pending = () => predict && P.k < run.frames.length - 1 && run.frames[P.k + 1].kind !== "end";

    function readTable() {
      const rows = [...root.querySelectorAll("[data-k=ptab] tr")];
      return rows.map((r, i) => ({ id: "P" + (i + 1), a: +r.querySelector("[data-f=a]").value, b: +r.querySelector("[data-f=b]").value, pr: +r.querySelector("[data-f=pr]").value }));
    }
    function buildTable() {
      $("[data-k=ptab]").innerHTML = ps.map((p) => `<tr><th scope="row">${p.id}</th>` +
        [["a", "Келу уақыты", 0, 30], ["b", "Орындалу уақыты", 1, 20], ["pr", "Басымдық", 1, 9]].map(([f, l, mn, mx]) => `<td><input type="number" data-f="${f}" min="${mn}" max="${mx}" step="1" value="${p[f]}" aria-label="${p.id}: ${l}"></td>`).join("") + "</tr>").join("");
      $("[data-c=add]").disabled = ps.length >= 6; $("[data-c=del]").disabled = ps.length <= 2;
    }
    function onEdit() {
      const nps = readTable(), out = $("[data-k=pmsg]");
      const bad = nps.find((p) => !Number.isInteger(p.a) || p.a < 0 || p.a > 30 || !Number.isInteger(p.b) || p.b < 1 || p.b > 20 || !Number.isInteger(p.pr) || p.pr < 1 || p.pr > 9);
      if (bad) { out.textContent = `${bad.id}: келу 0…30, орындалу 1…20, басымдық 1…9 аралығындағы бүтін сандар болуы керек.`; return; }
      out.textContent = ""; ps = nps; recompute();
    }
    function recompute() { P.stop(); run = simulate(ps, algo, q); score = { ok: 0, n: 0 }; fb.className = ""; fb.textContent = ""; P.restart(); compare(); }

    function draw(k) {
      const F = run.frames[k], nx = run.frames[k + 1], upto = F.kind === "end" ? run.T : nx ? nx.t : run.T;
      const segs = F.kind === "init" ? [] : segments(run.tl, upto);
      gantt($("[data-k=gantt]"), ps, segs, run.T, { newFrom: F.kind === "init" ? null : F.t, now: F.kind === "end" ? null : F.t });
      $("[data-k=gantt]").setAttribute("aria-label", "Гант диаграммасы: " + (segs.length ? gtext(ps, segs) : "әлі бос"));
      $("[data-k=gtext]").textContent = segs.length ? gtext(ps, segs) : "Гант әлі бос.";
      // дайын кезек пен CPU
      const r = F.kind === "end" || F.kind === "init" ? null : F.run;
      const ready = F.kind === "init" ? [] : F.ready;
      $("[data-k=ready]").innerHTML = ready.length ? ready.map((i) => `<b>${ps[i].id}<small>қалды ${F.rem[i]}</small></b>`).join("") : "<em>бос</em>";
      $("[data-k=ready]").setAttribute("aria-label", (algo === "rr" ? "Дайын кезек, басынан: " : "Дайын процестер: ") + (ready.length ? ready.map((i) => `${ps[i].id} (қалды ${F.rem[i]})`).join(", ") : "бос"));
      $("[data-k=cpu]").textContent = r == null ? (F.kind === "idle" ? "бос" : "-") : ps[r].id;
      $("[data-k=time]").textContent = `t = ${F.kind === "end" ? run.T : F.t}`;
      say.innerHTML = ""; const b = document.createElement("b"); b.textContent = `${k}-қадам. `; say.append(b, document.createTextNode(F.msg));
      A.stepList(det, run.frames.map((x, i) => `${i}-қадам. ${x.msg}`), k);
      metrics(F.kind === "end" ? run.T : F.t, F.kind === "end", F.kind === "init");
      ask.hidden = !pending();
      if (pending()) {
        $("[data-k=askq]").textContent = `t = ${nx.t}: CPU-ды қай процесс алады?` + (nx.cands.length ? ` Осы сәтте ${nx.kind === "keep" ? "CPU-да " + ps[nx.run].id + ", дайындар" : "дайын"}: ` + nx.cands.filter((i) => !(nx.kind === "keep" && i === nx.run)).map((i) => `${ps[i].id} (A ${ps[i].a}, B ${ps[i].b}, қалды ${nx.rem[i]}, басымдық ${ps[i].pr})`).join(", ") + "." : "") + (algo === "rr" ? " RR-да тізім - кезек реті." : "");
        $("[data-k=pick]").innerHTML = ps.map((p, i) => `<button type="button" data-p="${i}">${p.id}</button>`).join("") + `<button type="button" data-p="idle">CPU бос</button>`;
      }
      $(".cs-score").textContent = predict ? `Болжам: ${score.ok} / ${score.n} дұрыс` : "";
    }
    function metrics(now, end, init) {
      const rows = run.m.map((x) => { const d = x.c <= now, st = !init && x.s <= now; return `<tr><th scope="row">${x.id}</th><td>${x.a}</td><td>${x.b}</td><td>${x.pr}</td><td>${st ? x.s : "…"}</td><td>${d ? x.c : "…"}</td><td>${d ? x.tat : "…"}</td><td>${d ? x.wt : "…"}</td><td>${st ? x.rt : "…"}</td></tr>`; }).join("");
      $("[data-k=mtab]").innerHTML = rows;
      const n = run.m.length;
      $("[data-k=mfoot]").innerHTML = end ? `<tr><th scope="row" colspan="6">Орташа</th><td>${A.num(run.avg.tat)}</td><td>${A.num(run.avg.wt)}</td><td>${A.num(run.avg.rt)}</td></tr>` : `<tr><th scope="row" colspan="6">Орташа</th><td colspan="3">барлығы аяқталғанда</td></tr>`;
      $("[data-k=mform]").textContent = end ? `Орташа WT = (${run.m.map((x) => x.wt).join(" + ")}) / ${n} = ${A.num(run.avg.wt)}; орташа TAT = (${run.m.map((x) => x.tat).join(" + ")}) / ${n} = ${A.num(run.avg.tat)}; орташа RT = (${run.m.map((x) => x.rt).join(" + ")}) / ${n} = ${A.num(run.avg.rt)}.` : "Есеп соңғы қадамда толық шығады.";
    }
    function compare() {
      const rs = ORDER.map((a) => [a, simulate(ps, a, q)]);
      const best = Math.min(...rs.map(([, r]) => r.avg.wt));
      $("[data-k=cmp]").innerHTML = rs.map(([a, r]) => `<tr class="${Math.abs(r.avg.wt - best) < 1e-9 ? "best" : ""}${a === algo ? " cur" : ""}"><th scope="row">${NAMES[a]}${a === "rr" ? ` (q = ${q})` : ""}</th><td>${A.num(r.avg.wt)}</td><td>${A.num(r.avg.tat)}</td><td>${A.num(r.avg.rt)}</td><td>${r.switches}</td><td>${r.order.join(" ")}</td></tr>`).join("");
      // конвой мен аштық түсіндірмесі ағымдағы деректерден
      const f = rs.find(([a]) => a === "fcfs")[1], s = rs.find(([a]) => a === "sjf")[1], pr = rs.find(([a]) => a === "prio")[1];
      const worst = pr.m.slice().sort((x, y) => y.wt - x.wt)[0];
      $("[data-k=cmpnote]").textContent = `Осы деректерде: FCFS орташа күтуі ${A.num(f.avg.wt)}, SJF - ${A.num(s.avg.wt)}. Priority-де ең ұзақ күткен - ${worst.id} (${worst.wt} бірлік, басымдығы ${worst.pr}). SRTF әрқашан орташа күту бойынша ең үздік, бірақ ол процестердің орындалу уақытын алдын ала білуді талап етеді - нағыз ОЖ оны тек болжайды.`;
    }

    function explainPick(x, nx) {
      const c = nx.run, cs = nx.cands, nm = (i) => ps[i].id, rem = nx.rem;
      if (x === "idle") return ["CPU бос емес", `t = ${nx.t} сәтінде дайын процесс бар: ${cs.map(nm).join(", ")}. Жоспарлаушы дайын процесс болса, CPU-ды бос қалдырмайды.`, "idle"];
      if (c == null) return ["Бұл сәтте CPU бос", ps[x].a > nx.t ? `${nm(x)} тек t = ${ps[x].a} сәтінде келеді. Келмеген процесті жоспарлау мүмкін емес - келу уақытын (A) ескеріңіз.` : `${nm(x)} аяқталып қойған.`, "arrival"];
      if (!cs.includes(x)) {
        if (run.m[x].c != null && run.m[x].c <= nx.t) return [`${nm(x)} аяқталған`, `${nm(x)} t = ${run.m[x].c} сәтінде аяқталды, ол енді кезекте жоқ.`, "finished"];
        if (ps[x].a > nx.t) return [`${nm(x)} әлі келген жоқ`, `${nm(x)} тек t = ${ps[x].a} сәтінде келеді (A = ${ps[x].a}), ал қазір t = ${nx.t}. Келу уақытын елемеу - жиі қате: жоспарлаушы тек дайын процестерді көреді.`, "arrival"];
        return ["Бұл процесс кезекте жоқ", `${nm(x)} қазір дайын кезекте емес.`, "queue"];
      }
      const by = (f) => cs.slice().sort((i, j) => f(i) - f(j) || ps[i].a - ps[j].a || i - j)[0];
      if (algo === "fcfs") return x === by((i) => ps[i].b) ? ["Бұл SJF ойы", `${nm(x)} ең қысқа, бірақ FCFS орындалу уақытына қарамайды - тек келу реті. Ең ерте келген ${nm(c)} (A = ${ps[c].a}).`, "criterion"] : ["FCFS - келу реті", `${nm(c)} ерте келді (A = ${ps[c].a}), ${nm(x)} - A = ${ps[x].a}.`, "criterion"];
      if (algo === "sjf") return x === by((i) => ps[i].a) ? ["Бұл FCFS ойы", `${nm(x)} ерте келді, бірақ SJF дайын процестердің ішінен орындалу уақыты (B) ең қысқасын алады: ${nm(c)} (B = ${ps[c].b}), ${nm(x)} - B = ${ps[x].b}.`, "criterion"] : ["Ең қысқасы басқа", `${nm(c)}: B = ${ps[c].b}, ${nm(x)}: B = ${ps[x].b}. SJF ең кіші B-ны таңдайды (тең болса - ерте келгенін).`, "criterion"];
      if (algo === "srtf") {
        if (nx.kind === "keep") return ["Қатаң кіші емес - ауыстыру жоқ", `${nm(x)} қалды ${rem[x]}, ал ағымдағы ${nm(c)} қалды ${rem[c]}. SRTF тек жаңа процестің қалған уақыты ҚАТАҢ кіші болса ғана кесіп алады.`, "tie"];
        if (x === nx.prev && nx.kind === "preempt") return ["SRTF кесіп алады", `${nm(x)} орындалып жатыр (қалды ${rem[x]}), бірақ ${nm(c)} қалды ${rem[c]} - кішірек. SRTF - үзетін (preemptive) алгоритм: SJF сияқты аяқталуды күтпейді.`, "no-preempt"];
        if (x === by((i) => ps[i].b) && rem[x] !== ps[x].b) return ["Бастапқы B емес, ҚАЛҒАН уақыт", `${nm(x)} бастапқы B = ${ps[x].b} ең кіші көрінеді, бірақ SRTF қалған уақытты салыстырады: ${nm(x)} қалды ${rem[x]}, ${nm(c)} қалды ${rem[c]}.`, "remaining"];
        return ["Қалған уақыт кішісі басқа", `${nm(c)} қалды ${rem[c]}, ${nm(x)} қалды ${rem[x]}.`, "criterion"];
      }
      if (algo === "rr") {
        if (x === nx.expired) return ["Кванты біткен процесс кезектің соңында", `${nm(x)} кванты бітіп, кезектің СОҢЫНА тұрды. Кезектің басында ${nm(c)}. (Келісім: t сәтінде келгендер кванты біткен процестен бұрын тұрады.)`, "rr-order"];
        if (x === by((i) => rem[i])) return ["RR қысқасын іздемейді", `${nm(x)} қысқарақ, бірақ Round Robin уақытқа қарамайды: кезектің басындағы ${nm(c)} q = ${q} бірлік алады.`, "criterion"];
        return ["Кезек реті", `RR кезектің басынан алады: ${cs.map(nm).join(", ")} - басында ${nm(c)}.`, "rr-order"];
      }
      const prmax = cs.slice().sort((i, j) => ps[j].pr - ps[i].pr)[0];
      if (x === prmax && ps[x].pr > ps[c].pr) return ["Кіші сан = жоғары басымдық", `${nm(x)} басымдығы ${ps[x].pr}, ${nm(c)} - ${ps[c].pr}. Бұл зертханада (Linux nice сияқты) кіші сан маңыздырақ.`, "prio-dir"];
      return ["Басымдығы жоғарырақ басқа", `${nm(c)} басымдығы ${ps[c].pr}, ${nm(x)} - ${ps[x].pr}. Priority орындалу уақытына емес, басымдық санына қарайды.`, "criterion"];
    }
    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-p]"); if (!b || !pending()) return;
      const nx = run.frames[P.k + 1], x = b.dataset.p === "idle" ? "idle" : +b.dataset.p, c = nx.run;
      const ok = x === "idle" ? c == null : x === c;
      score.n++; if (ok) score.ok++;
      if (ok) T.feedback(fb, "ok", `Дұрыс: ${c == null ? "CPU бос" : ps[c].id}`, nx.msg.replace(/^t = \d+: /, ""));
      else { const [ttl, why] = explainPick(x, nx); T.feedback(fb, "bad", `${ttl}. Дұрысы: ${c == null ? "CPU бос" : ps[c].id}`, why); }
      T.record("cs.sched.predict", { item: algo, ok, error: ok ? "" : explainPick(x, nx)[2], note: ok ? "" : explainPick(x, nx)[1], title: "Жоспарлаушы: келесі процесті болжау" });
      P.go(P.k + 1);
    });

    root.querySelectorAll("[data-algo]").forEach((b) => b.addEventListener("click", () => setAlgo(b.dataset.algo)));
    function setAlgo(a) { algo = a; root.querySelectorAll("[data-algo]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.algo === a))); $("[data-k=qbox]").hidden = a !== "rr"; recompute(); }
    $("[data-k=q]").addEventListener("change", (e) => { const v = +e.target.value; if (Number.isInteger(v) && v >= 1 && v <= 20) { q = v; recompute(); } else e.target.value = q; });
    $("[data-k=ptab]").addEventListener("change", onEdit);
    $("[data-c=add]").addEventListener("click", () => { if (ps.length >= 6) return; const L = ps[ps.length - 1]; ps.push({ id: "P" + (ps.length + 1), a: L.a + 1, b: 3, pr: 2 }); buildTable(); recompute(); });
    $("[data-c=del]").addEventListener("click", () => { if (ps.length <= 2) return; ps.pop(); buildTable(); recompute(); });
    $("[data-k=preset]").innerHTML = Object.entries(PRESETS).map(([id, p]) => `<option value="${id}">${p.name}</option>`).join("");
    function setPreset(k, a) { $("[data-k=preset]").value = k; ps = mk(PRESETS[k].procs); buildTable(); if (a) setAlgo(a); else recompute(); }
    $("[data-k=preset]").addEventListener("change", (e) => setPreset(e.target.value));
    $("[data-k=predict]").addEventListener("change", (e) => { predict = e.target.checked; recompute(); if (predict) say.textContent = "Болжау режимі: әр шешім алдында CPU-ды қай процесс алатынын таңдаңыз."; });
    document.querySelectorAll("[data-demo]").forEach((b) => b.addEventListener("click", () => {
      const [k, a, qq] = b.dataset.demo.split(":"); if (qq) { q = +qq; $("[data-k=q]").value = qq; }
      setPreset(k, a); document.getElementById("h-run").scrollIntoView({ block: "start" });
    }));
    buildTable(); setAlgo("fcfs");
  })();

  // ---------------------------------------------------------------- 5. қорытынды тапсырма
  const task = document.querySelector("[data-cslab=sched-task]");
  if (!task) return;
  const tq = (s) => task.querySelector(s);
  let Z = null, HN = null, helped = false;
  function gen() {
    for (let g = 0; g < 3000; g++) {
      const algo = A.pick(ORDER), q = algo === "rr" ? 2 + A.rnd(2) : 2;
      const arr = [0, ...[0, 0, 0].map(() => A.rnd(7))].sort((x, y) => x - y);
      const ps = arr.map((a, i) => ({ id: "P" + (i + 1), a, b: 1 + A.rnd(7), pr: 1 + A.rnd(5) }));
      const R = simulate(ps, algo, q);
      if (R.tl.includes(null)) continue;
      const f = simulate(ps, "fcfs", q);
      if (algo === "fcfs" ? f.order.join() === simulate(ps, "sjf").order.join() : R.order.join() === f.order.join()) continue;
      if (algo === "srtf" && R.order.join() === simulate(ps, "sjf").order.join()) continue;
      if (algo === "rr" && R.order.length > 9) continue;
      if (Math.abs(R.avg.wt - R.avg.rt) < 1e-9 && algo !== "fcfs" && algo !== "sjf" && algo !== "prio") continue;
      return { ps, algo, q, R };
    }
    return null;
  }
  const RULE = {
    fcfs: "FCFS: келу реті бойынша, әр процесс соңына дейін.",
    sjf: "SJF (үзбейтін): CPU босаған сайын дайын процестердің ішінен B ең қысқасы; бастаған процесс аяқталғанша үзілмейді.",
    srtf: "SRTF: әр келу сәтінде және аяқталғанда қалған уақыты ең азы; жаңа процестің қалғаны ҚАТАҢ кіші болса, ағымдағысы кесіледі.",
    rr: "Round Robin: кезектің басы q бірлік орындалады; бітпесе кезектің соңына тұрады (сол сәтте келгендерден кейін).",
    prio: "Priority (үзбейтін): CPU босағанда басымдық саны ең кіші процесс; үзілмейді.",
  };
  function newTask() {
    Z = gen(); helped = false;
    const { ps, algo, q } = Z;
    tq("[data-k=tproc]").innerHTML = ps.map((p) => `<tr><th scope="row">${p.id}</th><td>${p.a}</td><td>${p.b}</td><td>${p.pr}</td></tr>`).join("");
    tq("[data-k=q]").textContent = `Алгоритм: ${NAMES[algo]}${algo === "rr" ? `, квант q = ${q}` : ""}. ${RULE[algo]} Гант ретін (мысалы: P1 P2 P1 P3) жазып, орташа күту уақытын есептеңіз.`;
    tq("[data-k=ord]").value = ""; tq("[data-k=wt]").value = "";
    tq("[data-fb=task]").className = ""; tq("[data-fb=task]").textContent = "";
    HN = T.hints(tq("[data-k=hints]"), hintList(), { onSolution: () => { helped = true; T.feedback(tq("[data-fb=task]"), "info", "Шешімді көрдіңіз", "Бұл есеп меңгеруге саналмайды. Шешімді түсінген соң «Жаңа есеп» басып, келесісін көмексіз шығарыңыз."); } });
  }
  function hintList() {
    const { ps, algo, q, R } = Z;
    const ex = mk([[0, 3, 2], [1, 2, 3], [2, 1, 1]]), E = simulate(ex, algo, 2);
    return [
      `${RULE[algo]} Уақыт сызығын 0-ден бастап сызыңыз: әр шешім сәтінде тек КЕЛГЕН процестерді қараңыз. Сосын әр процесс үшін C (аяқталу), TAT = C − A, WT = TAT − B.`,
      `Мысал: P1 (A 0, B 3, басымдық 2), P2 (A 1, B 2, басымдық 3), P3 (A 2, B 1, басымдық 1)${algo === "rr" ? ", q = 2" : ""}. ${NAMES[algo]}: ${gtext(ex, E.segs)}. WT: ${E.m.map((x) => `${x.id} = ${x.c} − ${x.a} − ${x.b} = ${x.wt}`).join("; ")}. Орташа = ${A.num(E.avg.wt)}.`,
      `Шешім: ${gtext(ps, R.segs)}. ` + R.m.map((x) => `${x.id}: C = ${x.c}, TAT = ${x.c} − ${x.a} = ${x.tat}, WT = ${x.tat} − ${x.b} = ${x.wt}`).join("; ") + `. Орташа WT = (${R.m.map((x) => x.wt).join(" + ")}) / ${ps.length} = ${A.num(R.avg.wt)}. Жауап: ${R.order.join(" ")}; ${A.num(R.avg.wt)}.`,
    ];
  }
  function check() {
    const { ps, algo, q, R } = Z, out = tq("[data-fb=task]");
    const ord = (tq("[data-k=ord]").value.match(/\d+/g) || []).map((x) => "P" + +x), wt = A.parseNum(tq("[data-k=wt]").value);
    if (!ord.length || !Number.isFinite(wt)) { T.feedback(out, "info", "Екі жауап та керек", "Гант ретін (P1 P2 ...) және орташа күту уақытын (мысалы 3,25) жазыңыз."); return; }
    const want = R.order.join(" "), got = ord.join(" ");
    const alt = (a, o = {}, qq = q) => simulate(ps, a, qq, o).order.join(" ");
    let ordOk = got === want, ttl = "", why = "", code = "";
    if (!ordOk) {
      if (algo !== "fcfs" && got === alt("fcfs")) { code = "fcfs"; ttl = "Бұл FCFS реті"; why = `Процестерді жай келу ретімен жаздыңыз. ${NAMES[algo]} басқа критерийге қарайды: ${RULE[algo]}`; }
      else if (got === alt(algo, { ignoreArrival: true })) { code = "arrival"; ttl = "Келу уақыты ескерілмеді"; why = "Барлық процесс t = 0-де дайын тұрғандай шештіңіз. Жоспарлаушы әр сәтте тек КЕЛГЕН процестерді көреді: A уақыты келмегенін таңдауға болмайды."; }
      else if (algo === "srtf" && got === alt("sjf")) { code = "no-preempt"; ttl = "Кесіп алу (preemption) ұмытылды"; why = "Бұл - үзбейтін SJF реті. SRTF жаңа процесс келген сайын салыстырады: оның қалған уақыты ағымдағынікінен қатаң кіші болса, ағымдағысы үзіліп, кезекке қайтады."; }
      else if (algo === "sjf" && got === alt("srtf")) { code = "preempt"; ttl = "SJF үзбейді"; why = "Бұл - SRTF реті. Үзбейтін SJF басталған процесті аяқталғанша орындайды; шешім тек CPU босағанда қабылданады."; }
      else if (algo === "rr" && [1, 2, 3, 4].filter((x) => x !== q).some((x) => got === alt("rr", {}, x))) { const x = [1, 2, 3, 4].find((y) => y !== q && got === alt("rr", {}, y)); code = "quantum"; ttl = "Квант басқа"; why = `Бұл q = ${x} болғандағы рет. Тапсырмада q = ${q}: әр процесс бір кезекте ең көбі ${q} бірлік орындалады, бітпесе кезектің соңына тұрады.`; }
      else if (algo === "rr" && got === alt("rr", { rrOld: true })) { code = "rr-order"; ttl = "Кезекке тұру реті"; why = "Кванты біткен процесті сол сәтте келген процестердің АЛДЫНА қойдыңыз. Біздің келісім: t сәтінде келгендер кезекке бірінші тұрады, кванты біткен процесс - олардан кейін."; }
      else if (algo === "rr" && got === alt("fcfs")) { code = "quantum"; ttl = "Квант қолданылмады"; why = `Әр процесті соңына дейін орындадыңыз - бұл q өте үлкен болғандағы RR (= FCFS). q = ${q} бірліктен кейін процесс кезектің соңына тұруы керек.`; }
      else if (algo === "prio" && got === alt("prio", { prioMax: true })) { code = "prio-dir"; ttl = "Басымдық бағыты кері"; why = "Үлкен санды маңыздырақ деп алдыңыз. Бұл зертханада кіші сан = жоғары басымдық (1 - ең маңызды)."; }
      else { const i = ord.findIndex((x, j) => x !== R.order[j]); code = "order"; ttl = i < 0 ? "Рет толық емес" : `${i + 1}-кесіндіде қате`; why = i < 0 ? `Алғашқы ${ord.length} кесінді дұрыс, жалғастырыңыз: барлығы ${R.order.length} кесінді.` : `Алғашқы ${i} кесінді дұрыс. ${R.segs[i].s} сәтінде CPU-ды ${R.order[i]} алады. Ереже: ${RULE[algo]}`; }
    }
    const near = (x, y) => Math.abs(x - y) < 0.006;
    let wtOk = near(wt, R.avg.wt), wwhy = "";
    if (!wtOk) {
      const avg = (f) => sum(R.m.map(f)) / R.m.length;
      if (near(wt, R.avg.tat)) { code = code || "tat"; wwhy = `${A.num(wt)} - орташа АЙНАЛЫМ уақыты (TAT = C − A). Күту уақыты одан орындалу уақытын шегереді: WT = TAT − B.`; }
      else if (near(wt, R.avg.rt)) { code = code || "response"; wwhy = `${A.num(wt)} - орташа ЖАУАП уақыты (алғаш CPU алған сәт − A). Үзілетін алгоритмде процесс бірнеше рет күтеді: WT = C − A − B барлық күтуді қосады.`; }
      else if (near(wt, avg((x) => x.c - x.b))) { code = code || "formula-arrival"; wwhy = "WT = C − B деп есептедіңіз, келу уақыты шегерілмеді. Дұрысы: WT = C − A − B."; }
      else if (near(wt, avg((x) => x.c))) { code = code || "completion"; wwhy = "Бұл аяқталу уақыттарының орташасы. WT = C − A − B."; }
      else wwhy = `Әр процесс үшін WT = C − A − B есептеп, қосындысын ${R.m.length}-ке бөліңіз.` + (ordOk ? "" : " Алдымен Гант ретін түзетіңіз - C мәндері содан шығады.");
      code = code || "wt";
    }
    const ok = ordOk && wtOk, hints = HN.used();
    if (ok) T.feedback(out, "ok", "Дұрыс" + (hints ? ` (${hints} көмекпен)` : ""), `${gtext(ps, R.segs)}. Орташа WT = ${A.num(R.avg.wt)}. «Жаңа есеп» - келесі жиын.`);
    else T.feedback(out, "bad", ordOk ? "Рет дұрыс, күту уақыты қате" : wtOk ? `${ttl} (орташа WT дұрыс)` : ttl, (ordOk ? "" : why + " ") + (wtOk ? "" : wwhy));
    T.record("cs.sched", { item: algo, ok, hints: helped ? 3 : hints, error: ok ? "" : code, note: ok ? "" : why + " " + wwhy, title: "Жоспарлаушы: Гант және күту уақыты" });
  }
  tq("[data-c=check]").addEventListener("click", check);
  task.querySelectorAll("input").forEach((i) => i.addEventListener("keydown", (e) => { if (e.key === "Enter") check(); }));
  tq("[data-c=new]").addEventListener("click", newTask);
  newTask();
  document.querySelectorAll("[data-badge]").forEach((el) => T.badge(el, el.dataset.badge, el.dataset.title));
})();
