/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* CS Universe: Таралған жүйелер зертханасы (academy/labs/distributed.html).
   1) Кворум, ең нашар жағдай: жазу алғашқы W қолжетімді репликаға жетіп сәтті болады (k ≥ W), қалғандары ескі;
      сәтсіз жазу ешбір репликаға жазылмайды. Оқу R репликадан жауап алып, ең үлкен нұсқаны таңдайды (k ≥ R болса).
      Ескі оқу мүмкін ⇔ жазу сәтті, оқу сәтті және k − W ≥ R (бөлінусіз k = N: R + W ≤ N).
   2) Raft тәрізді сайлау (толық Raft емес: журнал жоқ): дискретті оқиғалар (мс), кешігу = 10 × сақинадағы қашықтық,
      heartbeat әр 50 мс. Бір уақыттағы реті: хабар жетуі (жіберілу ретімен) → heartbeat кезегі → таймауттар (A..E).
      Таймер қайта басталғанда түйіннің тізіміндегі келесі мән алынады: [t1, t2, t2 + 40, t2 + 40, ...].
      Көпшілік = ⌊N/2⌋ + 1, N - кластердегі БАРЛЫҚ түйін (құлағандар да). */
(() => {
  "use strict";
  const C = window.CSB, T = () => window.AO17Tutor;
  if (!C) return;
  const { el, rng, pick } = C;
  const SVGNS = "http://www.w3.org/2000/svg";
  const sv = (tag, a = {}, text) => { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); if (text != null) e.textContent = text; return e; };
  const arrow = (g, x1, y1, x2, y2, cls, cut) => {
    const k = cut ? 0.5 : 1, xe = x1 + (x2 - x1) * k, ye = y1 + (y2 - y1) * k;
    g.append(sv("line", { class: "ds-m " + cls, x1, y1, x2: xe, y2: ye }));
    if (cut) { g.append(sv("text", { x: xe, y: ye + 6, "text-anchor": "middle", class: "nw-x2", style: "fill:#ff8a80;font:700 18px var(--font)" }, "✕")); return; }
    const a = Math.atan2(ye - y1, xe - x1), L = 10;
    g.append(sv("path", { class: "ds-mh " + cls, d: `M${xe},${ye} L${xe - L * Math.cos(a - 0.4)},${ye - L * Math.sin(a - 0.4)} L${xe - L * Math.cos(a + 0.4)},${ye - L * Math.sin(a + 0.4)} Z` }));
  };

  // ================================================================ кворум моделі
  function quorum({ N, W, R, k, rset }) {
    k = k == null ? N : k;
    const reach = Array.from({ length: k }, (_, i) => i + 1);
    const writeOk = k >= W, wset = writeOk ? reach.slice(0, W) : [];
    let rs = rset && rset.length === R && rset.every((x) => x <= k) ? rset.slice().sort((a, b) => a - b) : null, worst = !rs;
    if (!rs) rs = [...reach.filter((x) => !wset.includes(x)), ...wset].slice(0, R);
    const readOk = k >= R;
    const overlap = rs.filter((x) => wset.includes(x)).length;
    const value = readOk ? (overlap ? 2 : 1) : null;
    const stalePossible = writeOk && readOk && k - W >= R;
    return { N, W, R, k, reach, writeOk, wset, rs, readOk, overlap, value, stalePossible, minOverlap: Math.max(0, R + W - k), worst };
  }
  window.CSLabDist = { quorum };

  (() => {
    const root = document.querySelector("[data-cslab=quorum]");
    if (!root) return;
    const $ = (s) => root.querySelector(s), svg = $("svg");
    let Q = null, frames = [], picked = [];
    const val = (k) => +$(`[data-k=${k}]`).value;
    function syncSliders() {
      const N = val("N");
      ["W", "R"].forEach((k) => { const s = $(`[data-k=${k}]`); s.max = N; if (+s.value > N) s.value = N; $(`[data-k=${k}o]`).textContent = s.value; });
      $("[data-k=No]").textContent = N;
      const ks = $("[data-k=k]"), prev = +ks.value || Math.ceil(N / 2);
      ks.innerHTML = ""; for (let i = 1; i < N; i++) ks.append(el("option", { value: String(i), text: `${i} реплика` }));
      ks.value = String(Math.min(prev, N - 1)); ks.disabled = !$("[data-k=part]").checked;
    }
    function fillPick() {
      const N = val("N"), k = $("[data-k=part]").checked ? +$("[data-k=k]").value : N, box = $("[data-k=rpick]");
      picked = picked.filter((x) => x <= k);
      box.innerHTML = "";
      for (let i = 1; i <= N; i++) box.append(el("button", { type: "button", "aria-pressed": String(picked.includes(i)), disabled: i > k ? true : null, "aria-label": `R${i} оқу жиынына${i > k ? " (бөлінудің арғы жағында)" : ""}`, text: `R${i}`, onclick: () => { picked = picked.includes(i) ? picked.filter((x) => x !== i) : [...picked, i]; fillPick(); build(); st.reload(); } }));
      box.append(el("button", { type: "button", class: "csb-skip", text: "ең нашар жағдай", onclick: () => { picked = []; fillPick(); build(); st.reload(); } }));
    }
    function build() {
      const N = val("N"), W = val("W"), R = val("R"), part = $("[data-k=part]").checked, k = part ? +$("[data-k=k]").value : N;
      Q = quorum({ N, W, R, k, rset: picked.length ? picked : null });
      const ineq = $("[data-k=ineq]"), sum = R + W;
      ineq.textContent = `R + W = ${R} + ${W} = ${sum} ${sum > N ? ">" : "≤"} N = ${N}` + (sum > N ? ` → кез келген оқу жиынында кемінде ${sum - N} жаңа реплика` : " → барлық жаңа репликаны айналып өтетін оқу жиыны бар") + (part ? `; бөлінуде клиентке ${k} реплика қолжетімді` : "");
      ineq.className = "ds-ineq" + (sum > N ? "" : " bad");
      const note = picked.length && picked.length !== R ? ` (Сіз ${picked.length} реплика таңдадыңыз, ал R = ${R} - ең нашар жағдай қолданылды.)` : "";
      const names = (a) => a.map((x) => "R" + x).join(", ");
      const F = [];
      F.push({ ph: 0, msg: `Бастапқыда барлық ${N} репликада x = 1 (нұсқа v1). Жазу W = ${W} растау, оқу R = ${R} жауап күтеді.${part ? ` Желі бөлінген: клиент пен үйлестіруші тек R1-R${k}-ге жете алады.` : ""}${note}` });
      F.push({ ph: 1, msg: `Клиент x = 2 жазады. Үйлестіруші (coordinator) жазуды барлық репликаға жібереді (жаңа нұсқа v2).${part ? ` R${k + 1}-R${N}-ге хабар бөліну арқылы өтпейді (✕).` : ""}` });
      F.push({ ph: 2, msg: Q.writeOk ? `${W} растау жиналды (${names(Q.wset)}) → жазу сәтті, клиентке «OK». ${N - W > 0 ? `Қалған ${names(Array.from({ length: N - W }, (_, i) => W + i + 1))} әлі v1 (хабар кешігуде не жетпеді) - бұл ең нашар жағдай.` : "Барлық реплика жаңарды."}` : `Тек ${k} реплика қолжетімді, ал W = ${W} растау керек → жазу сәтсіз, клиентке қате. (Модельде ешбір реплика v2-ні сақтамайды.) Жүйе ескі мәнді «жаңа» деп көрсетпеу үшін жазудан бас тартты.` });
      const stAns = !Q.readOk ? "fail" : Q.stalePossible ? "stale" : "fresh";
      F.push({ ph: 3, ask: Q.writeOk ? {
        q: `Енді клиент x-ті оқиды (R = ${R}). Кез келген ${R} реплика таңдалуы мүмкін болса, оқу ескі мән қайтаруы мүмкін бе?`, skill: "cs.dist.quorum", title: "Кворум: ескі оқу мүмкін бе", item: "stale",
        opts: [{ id: "stale", label: "Иә, x = 1 оралуы мүмкін" }, { id: "fresh", label: "Жоқ, міндетті түрде x = 2" }, { id: "fail", label: "Оқу мүлде орындалмайды" }], answer: stAns,
        okWhy: stAns === "fail" ? `Қолжетімді ${k} реплика < R = ${R}: жауап жиналмайды.` : stAns === "stale" ? `Жазуды көрмеген ${k - W} реплика бар, ал R = ${R} ≤ ${k - W}: оқу тек соларға түсуі мүмкін.` : `R + W = ${sum} > ${k}: кез келген ${R} реплика жазу жиынымен кемінде ${sum - k} репликада қиылысады.`,
        why: (x) => {
          if (stAns === "fail") return ["Кворум жиналмайды", `Бөлінуде клиент тек ${k} репликаға жетеді, ал оқу ${R} жауап күтеді. R > k болғанда оқу қате қайтарады - бұл жүйенің консистенттік үшін қолжетімділікті құрбан етуі.`, "quorum-unreachable"];
          if (x === "fail") return ["Оқу кворумы жиналады", `Қолжетімді ${k} реплика ≥ R = ${R} - оқу орындалады. Сұрақ - нәтижесінің жаңа-ескілігі.`, "fail-wrong"];
          if (stAns === "stale") return ["Қиылысу кепілденбейді", `R + W = ${R} + ${W} = ${sum} ≤ ${k}: жазуды көрмеген ${k - W} реплика бар, ал оқуға ${R} жетеді. Оқу тек соларға түссе, ең үлкен нұсқа v1 болады. Кепіл үшін R + W > N керек.`, "rw-le-n"];
          return ["Кворумдар міндетті түрде қиылысады", `Жазу ${W}, оқу ${R} реплика; барлығы ${k} реплика. ${W} + ${R} = ${sum} > ${k} - екі жиынның ортақ мүшесі болмауы мүмкін емес (көгершін ұясы принципі): кемінде ${sum - k} оқу репликасы v2-ні көрген. Үйлестіруші ең үлкен нұсқаны таңдайды.`, "rw-gt-n"];
        } } : null,
        msg: Q.readOk ? `Клиент x-ті оқиды: үйлестіруші ${R} репликадан сұрайды: ${names(Q.rs)}${Q.worst ? " (ең нашар жағдай: алдымен ескілер)" : " (сіз таңдаған жиын)"}.` : `Оқу ${R} жауап күтеді, бірақ тек ${k} реплика қолжетімді → оқу сәтсіз (қате).` });
      if (Q.readOk) F.push({ ph: 4, ask: Q.writeOk ? { q: `Оқу жиынындағы (${names(Q.rs)}) неше реплика v2 қайтарады?`, num: true, label: "Реплика саны", skill: "cs.dist.quorum", title: "Кворум: қиылысу", item: "overlap", answer: Q.overlap,
          okWhy: `Жазу жиыны ${names(Q.wset)}, оқу жиыны ${names(Q.rs)}: ортақ ${Q.overlap}.`, why: (x) => [x === Q.minOverlap ? "Бұл кепілді ең аз сан" : "Қиылысуды санаңыз", `Жазу жиыны ${names(Q.wset)}, оқу жиыны ${names(Q.rs)}: ортақ реплика саны ${Q.overlap}. (Кез келген жиын үшін кепілді ең азы - max(0, R + W − ${k === N ? "N" : "k"}) = ${Q.minOverlap}.)`, "overlap"] } : null,
        msg: `Жауаптар: ${Q.rs.map((x) => `R${x}: ${Q.wset.includes(x) ? "v2 (x = 2)" : "v1 (x = 1)"}`).join(", ")}. Жазу жиынымен ортақ: ${Q.overlap}.` });
      F.push({ ph: 5, msg: !Q.readOk ? `Нәтиже: оқу сәтсіз. Бөліну жойылмайынша R = ${R} кворумы жиналмайды.` : `Үйлестіруші ең үлкен нұсқаны таңдайды → x = ${Q.value}. ${Q.value === 1 && Q.writeOk ? "Ескі оқу! Клиент жаңа ғана сәтті жазған мәнді көрмеді." : Q.writeOk ? "Жаңа мән оқылды." : "Жазу сәтсіз болған, сондықтан x = 1 - дұрыс мән."} ${sum > N ? `R + W > N: кез келген оқу жиыны кемінде ${sum - N} жаңа репликаны қамтиды.` : "R + W ≤ N: ескі оқудан кепіл жоқ."}` });
      frames = F;
    }
    function render(F) {
      svg.innerHTML = "";
      const N = Q.N, k = Q.k, part = k < N, xs = Array.from({ length: N }, (_, i) => 60 + (i * 480) / Math.max(1, N - 1));
      const side = xs.slice(0, k), cx = part ? (side[0] + side[side.length - 1]) / 2 : 300;
      const co = [cx, 150], cl = [cx, 46];
      if (part) { const xc = (xs[k - 1] + xs[k]) / 2; svg.append(sv("line", { class: "ds-cut", x1: xc, y1: 14, x2: xc, y2: 392 }), sv("text", { class: "ds-cut-t", x: xc + 6, y: 30 }, "бөліну")); }
      const g = sv("g"); svg.append(g);
      const ry = 300;
      if (F.ph === 1) xs.forEach((x, i) => arrow(g, co[0], co[1] + 18, x, ry - 34, "", i >= k));
      if (F.ph === 2 && Q.writeOk) Q.wset.forEach((r) => arrow(g, xs[r - 1], ry - 34, co[0], co[1] + 18, "vote"));
      if (F.ph === 3 && Q.readOk) Q.rs.forEach((r) => arrow(g, co[0], co[1] + 18, xs[r - 1], ry - 34, "hb"));
      if (F.ph === 4) Q.rs.forEach((r) => arrow(g, xs[r - 1], ry - 34, co[0], co[1] + 18, Q.wset.includes(r) ? "vote" : ""));
      if (F.ph >= 1) arrow(g, cl[0], cl[1] + 16, co[0], co[1] - 18, "");
      const box = (x, y, label, sub, cls) => { const b = sv("g", { class: "ds-rep " + cls }); b.append(sv("rect", { x: x - 52, y: y - 18, width: 104, height: 36, rx: 8 }), sv("text", { x, y: y + 5, "text-anchor": "middle", class: "sm" }, label)); svg.append(b); if (sub) svg.append(sv("text", { x: x + 58, y: y + 5, class: "ds-lab" }, sub)); };
      box(cl[0], cl[1], "клиент", null, "");
      box(co[0], co[1], "үйлестіруші", F.ph === 5 && Q.readOk ? `→ x = ${Q.value}` : F.ph === 2 ? (Q.writeOk ? "жазу OK" : "жазу: қате") : null, "");
      xs.forEach((x, i) => {
        const r = i + 1, fresh = F.ph >= 2 && Q.wset.includes(r), inR = F.ph >= 3 && Q.readOk && Q.rs.includes(r);
        const gg = sv("g", { class: "ds-rep" + (fresh ? " fresh" : "") + (inR ? " rd" : "") + (F.ph === 2 && fresh ? " wr" : "") + (i >= k ? " off" : "") });
        gg.append(sv("rect", { x: x - 30, y: ry - 30, width: 60, height: 60, rx: 10 }), sv("text", { x, y: ry - 6, "text-anchor": "middle" }, `R${r}`), sv("text", { x, y: ry + 16, "text-anchor": "middle", class: "sm" }, fresh ? "x=2 v2" : "x=1 v1"));
        svg.append(gg);
        if (fresh && F.ph >= 2) svg.append(sv("text", { x, y: ry + 50, "text-anchor": "middle", class: "ds-lab" }, "W"));
        if (inR) svg.append(sv("text", { x, y: ry + 68, "text-anchor": "middle", class: "ds-big" }, "R"));
      });
      svg.setAttribute("aria-label", `${N} реплика. ` + xs.map((_, i) => `R${i + 1}: ${F.ph >= 2 && Q.wset.includes(i + 1) ? "x = 2" : "x = 1"}${F.ph >= 3 && Q.readOk && Q.rs.includes(i + 1) ? ", оқу жиынында" : ""}${i >= k ? ", қолжетімсіз" : ""}`).join("; "));
    }
    syncSliders(); fillPick(); build();
    const st = C.stepper(root, { frames: () => frames, render, delay: 1700 });
    const rebuild = () => { syncSliders(); fillPick(); build(); st.reload(); };
    ["N", "W", "R"].forEach((k) => $(`[data-k=${k}]`).addEventListener("input", rebuild));
    $("[data-k=part]").addEventListener("change", rebuild);
    $("[data-k=k]").addEventListener("change", rebuild);
    st.paint();
  })();

  // ================================================================ сайлау моделі
  const NODES = ["A", "B", "C", "D", "E"], MAJ = Math.floor(NODES.length / 2) + 1, HB = 50;
  const ringD = (a, b) => { const d = Math.abs(NODES.indexOf(a) - NODES.indexOf(b)); return Math.min(d, NODES.length - d); };
  const delay = (a, b) => 10 * ringD(a, b);
  /** cfg: { crashed: [..], t1: {A:..}, t2: {A:..}, leader0, part: { side: [..], heal } | null, limit } */
  function elect(cfg) {
    const crashed = new Set(cfg.crashed || []), limit = cfg.limit || 1000;
    const S = {}; NODES.forEach((n) => { S[n] = { role: "follower", term: cfg.leader0 ? 1 : 0, voted: cfg.leader0 || null, votes: new Set(), leader: cfg.leader0 || null, idx: 0, dl: null, dead: crashed.has(n) }; });
    const nextTo = (n) => { const L = [cfg.t1[n], cfg.t2[n], cfg.t2[n] + 40]; const v = L[Math.min(S[n].idx, 2)]; S[n].idx++; return v; };
    const ev = []; let seq = 0;
    const cut = (a, b, t) => cfg.part && t < cfg.part.heal && cfg.part.side.includes(a) !== cfg.part.side.includes(b);
    let cur = null; // ағымдағы кадр
    const send = (t, from, to, type, term, extra = {}) => {
      const dropped = S[to].dead || cut(from, to, t);
      cur.msgs.push({ from, to, type, term, dropped, granted: extra.granted });
      if (!dropped) ev.push({ t: t + delay(from, to), ord: 0, seq: seq++, type, from, to, term, ...extra });
    };
    const frames = [];
    const snap = () => Object.fromEntries(NODES.map((n) => [n, { role: S[n].dead ? "dead" : S[n].role, term: S[n].term, voted: S[n].voted, votes: S[n].votes.size, dl: S[n].dl, leader: S[n].leader }]));
    NODES.forEach((n) => { if (!S[n].dead && n !== cfg.leader0) S[n].dl = nextTo(n); });
    let leaderEvents = [];
    if (cfg.leader0 && !crashed.has(cfg.leader0)) { S[cfg.leader0].role = "leader"; S[cfg.leader0].dl = null; ev.push({ t: 0, ord: 1, seq: seq++, type: "tick", from: cfg.leader0, term: 1 }); }
    frames.push({ t: 0, msgs: [], lines: [], st: snap(), init: true });
    const becomeLeader = (n, t) => {
      S[n].role = "leader"; S[n].leader = n; S[n].dl = null; leaderEvents.push({ n, t, term: S[n].term });
      cur.lines.push(`${n} ${S[n].votes.size} дауыс жинады (көпшілік ${MAJ}) → ${S[n].term}-мерзімнің көшбасшысы. Барлығына heartbeat жібереді.`);
      cur.elected = { n, term: S[n].term };
      NODES.forEach((m) => m !== n && send(t, n, m, "hb", S[n].term));
      ev.push({ t: t + HB, ord: 1, seq: seq++, type: "tick", from: n, term: S[n].term });
    };
    const stepDown = (n, term, t) => { S[n].term = term; if (S[n].role !== "follower") { S[n].role = "follower"; if (S[n].dl == null) S[n].dl = t + nextTo(n); } S[n].voted = null; S[n].leader = null; S[n].votes = new Set(); };
    let stable = false, t = 0, guard = 0;
    while (guard++ < 400) {
      const dls = NODES.filter((n) => !S[n].dead && S[n].dl != null).map((n) => S[n].dl);
      const tn = Math.min(...ev.map((e) => e.t), ...dls);
      if (!isFinite(tn) || tn > limit) break;
      t = tn; cur = { t, msgs: [], lines: [] };
      const now = ev.filter((e) => e.t === t).sort((a, b) => a.ord - b.ord || a.seq - b.seq);
      now.forEach((e) => ev.splice(ev.indexOf(e), 1));
      for (const e of now) {
        const n = S[e.to];
        if (e.type === "tick") {
          if (S[e.from].role === "leader" && S[e.from].term === e.term && !S[e.from].dead) { cur.lines.push(`${e.from} (көшбасшы, ${e.term}-мерзім): кезекті heartbeat.`); NODES.forEach((m) => m !== e.from && send(t, e.from, m, "hb", e.term)); ev.push({ t: t + HB, ord: 1, seq: seq++, type: "tick", from: e.from, term: e.term }); cur.hb = true; }
          continue;
        }
        if (n.dead) continue;
        if (e.type === "rv") {
          if (e.term > n.term) { if (n.role !== "follower") cur.lines.push(`${e.to} ${e.term}-мерзімді көрді → ізбасар болды.`); stepDown(e.to, e.term, t); }
          const grant = e.term === n.term && (n.voted == null || n.voted === e.from);
          if (grant) { n.voted = e.from; n.dl = t + nextTo(e.to); }
          cur.lines.push(`${e.to} ${e.from}-ның сұрауын алды (${e.term}-мерзім): ${grant ? `дауыс берді (таймер қайта: ${n.dl} мс-та)` : n.voted ? `бас тартты - бұл мерзімде дауысын ${n.voted}-ге берген` : "бас тартты - мерзімі ескі"}.`);
          send(t, e.to, e.from, "vote", n.term, { granted: grant });
        } else if (e.type === "vote") {
          if (e.term > n.term) { stepDown(e.to, e.term, t); continue; }
          if (n.role === "candidate" && e.term === n.term && e.granted) {
            n.votes.add(e.from);
            if (n.votes.size >= MAJ) becomeLeader(e.to, t); else cur.lines.push(`${e.to} ${e.from}-дан дауыс алды: ${n.votes.size} / ${MAJ}.`);
          } else if (!e.granted) cur.lines.push(`${e.to}: ${e.from} дауыс бермеді.`);
        } else if (e.type === "hb") {
          if (e.term >= n.term) {
            const was = n.role; if (e.term > n.term) n.voted = null;
            n.term = e.term; n.role = "follower"; n.votes = new Set(); n.leader = e.from; n.dl = t + nextTo(e.to);
            cur.lines.push(`${e.to} ${e.from}-дан heartbeat алды (${e.term}-мерзім)${was !== "follower" ? ` - ${was === "leader" ? "көшбасшылықтан түсті" : "кандидаттықтан бас тартты"}` : ""}; таймер қайта басталды.`);
          } else { cur.lines.push(`${e.to} ${e.from}-ның ескі мерзімдегі (${e.term} < ${n.term}) heartbeat-ін қабылдамады, жаңа мерзімін хабарлайды.`); send(t, e.to, e.from, "rej", n.term); }
        } else if (e.type === "rej") {
          if (e.term > n.term) { cur.lines.push(`${e.to} жоғары мерзімді (${e.term}) көрді → көшбасшылықтан түсіп, ізбасар болды.`); stepDown(e.to, e.term, t); }
        }
      }
      NODES.forEach((m) => {
        const n = S[m];
        if (n.dead || n.dl == null || n.dl !== t || n.role === "leader") return;
        n.term++; n.role = "candidate"; n.voted = m; n.votes = new Set([m]); n.leader = null; n.dl = t + nextTo(m);
        cur.lines.push(`${m}: таймаут бітті → ${n.term}-мерзімге кандидат, өзіне дауыс берді, басқаларға RequestVote жібереді (келесі таймаут ${n.dl} мс-та).`);
        (cur.cands = cur.cands || []).push(m);
        NODES.forEach((o) => o !== m && send(t, m, o, "rv", n.term));
      });
      cur.st = snap(); frames.push(cur);
      if (!cfg.part || t >= cfg.part.heal) {
        const L = NODES.filter((n) => !S[n].dead && S[n].role === "leader");
        if (L.length === 1 && NODES.every((n) => S[n].dead || n === L[0] || (S[n].leader === L[0] && S[n].term === S[L[0]].term))) { stable = true; break; }
      }
    }
    const L = NODES.find((n) => !S[n].dead && S[n].role === "leader") || null;
    const finalLeader = stable ? { n: L, term: S[L].term } : null;
    return { frames, stable, leader: finalLeader, leaderEvents, majority: MAJ };
  }
  window.CSLabDist.elect = elect;
  const SECOND = { A: 260, B: 240, C: 280, D: 170, E: 220 };
  const PRE = {
    crash: { crashed: ["C"], leader0: "C", t1: { A: 230, B: 160, C: 200, D: 200, E: 270 }, t2: SECOND, part: null },
    split: { crashed: ["C"], leader0: "C", t1: { A: 260, B: 150, C: 200, D: 150, E: 280 }, t2: SECOND, part: null },
    part: { crashed: [], leader0: "A", t1: { A: 250, B: 230, C: 170, D: 210, E: 260 }, t2: SECOND, part: { side: ["A", "B"], heal: 420 } },
  };

  (() => {
    const root = document.querySelector("[data-cslab=elect]");
    if (!root) return;
    const $ = (s) => root.querySelector(s), svg = $("svg");
    const POS = {}; NODES.forEach((n, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / NODES.length; POS[n] = [300 + 150 * Math.cos(a), 205 + 150 * Math.sin(a)]; });
    let cfg = JSON.parse(JSON.stringify(PRE.crash)), run = null, frames = [];
    function settings() {
      const box = $("[data-k=tset]"); box.innerHTML = "";
      const custom = $("[data-k=preset]").value === "custom";
      NODES.forEach((n) => {
        const id = "el-t-" + n, s = el("select", { id, "data-t": n, disabled: custom ? null : true });
        for (let v = 150; v <= 300; v += 10) s.append(el("option", { value: String(v), text: `${v} мс`, selected: v === cfg.t1[n] ? true : null }));
        const cb = el("input", { type: "checkbox", "data-crash": n, checked: cfg.crashed.includes(n) ? true : null, disabled: custom ? null : true });
        box.append(el("div", { class: "cs-field" }, el("label", { for: id, text: `${n}: алғашқы таймаут (кейінгісі ${cfg.t2[n]})` }), s, el("label", { class: "cs-check" }, cb, " құлаған")));
        s.addEventListener("change", () => { cfg.t1[n] = +s.value; rebuild(); });
        cb.addEventListener("change", () => { cfg.crashed = NODES.filter((m) => box.querySelector(`[data-crash=${m}]`).checked); rebuild(); });
      });
    }
    const optsNodes = (alive) => alive.map((n) => ({ id: n, label: n }));
    function build() {
      run = elect(cfg);
      const alive = NODES.filter((n) => !cfg.crashed.includes(n));
      frames = run.frames.map((f, i) => {
        let msg = f.init ? `t = 0. ${cfg.leader0 && cfg.crashed.includes(cfg.leader0) ? `1-мерзімнің көшбасшысы ${cfg.leader0} құлады. Ізбасарлар оның heartbeat-ін күтеді; әрқайсысының таймауты өзгеше.` : cfg.leader0 ? `${cfg.leader0} - 1-мерзімнің көшбасшысы.${cfg.part ? ` Желі бөлінген: {${cfg.part.side.join(", ")}} | {${NODES.filter((n) => !cfg.part.side.includes(n)).join(", ")}}; бөліну ${cfg.part.heal} мс-та жойылады.` : ""}` : "Кластер жаңа іске қосылды, көшбасшы жоқ."} Көпшілік: ${MAJ} / ${NODES.length}.` : `t = ${f.t} мс. ` + f.lines.join(" ");
        if (i === run.frames.length - 1) msg += run.stable ? ` Тұрақты: ${run.leader.n} - ${run.leader.term}-мерзімнің жалғыз көшбасшысы, барлық тірі түйін оны таниды.` : " Уақыт шегі: тұрақты көшбасшы жоқ.";
        return { ...f, msg };
      });
      // болжау сұрақтары
      const fc = frames.findIndex((f) => f.cands);
      if (fc > 0) {
        const c = frames[fc].cands, two = c.length > 1, ans = two ? c.join("+") : c[0];
        const opts = optsNodes(alive.filter((n) => n !== cfg.leader0 || cfg.crashed.includes(n))); if (two) opts.push({ id: ans, label: `${c.join(" мен ")} бір мезгілде` });
        const firstT = Math.min(...alive.filter((n) => n !== cfg.leader0).map((n) => cfg.t1[n]));
        frames[fc].ask = { q: "Қай ізбасардың таймауты бірінші бітеді - кім кандидат болады?", skill: "cs.dist.election", title: "Сайлау: бірінші кандидат", item: "first-cand", opts, answer: ans,
          okWhy: `${c.join(" мен ")}: алғашқы таймаут ${firstT} мс - ең қысқасы.`,
          why: (x) => cfg.crashed.includes(x) ? ["Құлаған түйін", `${x} құлаған - оның таймері жұмыс істемейді.`, "dead-node"] : two && c.includes(x) ? ["Екеуі бірдей", `${c.join(" мен ")} таймауты бірдей (${firstT} мс) - екеуі бір мезгілде кандидат болады. Бөлінген дауыстың себебі осы.`, "tie"] : ["Таймауттарды салыстырыңыз", `${x}: ${cfg.t1[x]} мс, ал ${c.join(", ")}: ${firstT} мс. Ең қысқа таймаут бірінші бітеді.`, "timeout-order"] };
      }
      const fv = frames.findIndex((f, i) => i > 0 && f.lines.some((l) => /дауыс берді \(/.test(l)));
      if (fv > 0 && !frames[fv].ask) frames[fv].ask = { q: `Кандидат көшбасшы болу үшін неше дауыс (өзінікін қоса) жинауы керек? Кластерде ${NODES.length} түйін${cfg.crashed.length ? `, оның ${cfg.crashed.length}-і құлаған` : ""}.`, num: true, label: "Дауыс саны", skill: "cs.dist.election", title: "Сайлау: көпшілік", item: "majority", answer: MAJ,
        okWhy: `⌊${NODES.length}/2⌋ + 1 = ${MAJ}. Құлаған түйіндер де N-ге кіреді: кластердің құрамы өзгерген жоқ.`,
        why: (x) => { const al = NODES.length - cfg.crashed.length; return x === Math.floor(al / 2) + 1 && x !== MAJ ? ["Құлағандар да саналады", `Көпшілік тірі түйіндерден емес, бүкіл кластерден (${NODES.length}) есептеледі: ⌊${NODES.length}/2⌋ + 1 = ${MAJ}. Әйтпесе бөлінудің екі жағы да «көпшілік» жинап, екі көшбасшы сайланар еді.`, "alive-majority"] : x === NODES.length / 2 || x === Math.floor(NODES.length / 2) ? ["Жартысы жетпейді", `Қатаң көпшілік керек (жартысынан көп): ${MAJ}. Екі кандидат 2-ден жинаса, екеуі де көшбасшы болып кетпеуі үшін.`, "half"] : ["Қатаң көпшілік", `⌊N/2⌋ + 1 = ${MAJ}.`, "majority"]; } };
      const fl = frames.findIndex((f) => f.elected && f.elected.term > (cfg.leader0 ? 1 : 0));
      if (fl > 0 && !frames[fl].ask) {
        const L = frames[fl].elected, splitHappened = frames.slice(0, fl).some((f) => f.cands && f.cands.length > 1);
        frames[fl].ask = { q: "Кім көшбасшы болады?", skill: "cs.dist.election", title: "Сайлау: кім көшбасшы", item: "leader", opts: optsNodes(alive), answer: L.n,
          okWhy: `${L.n} ${L.term}-мерзімде ${MAJ} дауыс жинады.`,
          why: (x) => splitHappened ? ["Дауыс бөлінді", `Алғашқы мерзімде екі кандидат дауысты бөліп алды - ешкім ${MAJ} жинай алмады. Келесі таймаут ${L.n}-де қысқа болды (${cfg.t2[L.n]} мс), сондықтан ${L.term}-мерзімде ол бірінші кандидат болып, жеңді.`, "split-vote"]
            : cfg.part && cfg.part.side.includes(x) ? ["Азшылық жағы", `${x} бөлінудің азшылық жағында (${cfg.part.side.length} түйін < ${MAJ}) - ол көпшілік дауыс жинай алмайды. Көпшілік жағындағы ${L.n} бірінші оянып, жеңді.`, "minority"]
            : ["Бірінші оянған жеңеді", `${L.n}-нің таймауты бірінші бітті, ол бірден RequestVote жіберді. Басқалар бұл мерзімде дауысын соған берді - бір мерзімде бір дауыс.`, "first-wins"] };
      }
    }
    function render(F) {
      svg.innerHTML = "";
      if (cfg.part && F.t < cfg.part.heal) svg.append(sv("line", { class: "ds-cut", x1: 395, y1: 8, x2: 230, y2: 392 }), sv("text", { class: "ds-cut-t", x: 404, y: 24 }, `бөліну (${cfg.part.heal} мс дейін)`));
      const g = sv("g"); svg.append(g);
      (F.msgs || []).forEach((m) => {
        const [x1, y1] = POS[m.from], [x2, y2] = POS[m.to], dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy), ox = (dx / d) * 38, oy = (dy / d) * 38;
        const cls = m.type === "rv" ? "" : m.type === "vote" ? (m.granted ? "vote" : "no") : m.type === "hb" ? "hb" : "no";
        arrow(g, x1 + ox, y1 + oy, x2 - ox, y2 - oy, cls, m.dropped);
      });
      NODES.forEach((n) => {
        const s = F.st[n], [x, y] = POS[n];
        const gg = sv("g", { class: "ds-rep" + (s.role === "leader" ? " lead" : s.role === "candidate" ? " cand" : s.role === "dead" ? " dead" : "") });
        gg.append(sv("circle", { cx: x, cy: y, r: 36 }), sv("text", { x, y: y + 1, "text-anchor": "middle" }, n), sv("text", { x, y: y + 18, "text-anchor": "middle", class: "sm" }, s.role === "dead" ? "құлады" : `мерзім ${s.term}`));
        svg.append(gg);
        const lbl = s.role === "dead" ? "" : s.role === "leader" ? "көшбасшы" : s.role === "candidate" ? `кандидат ${s.votes}/${MAJ}` : s.voted ? `дауыс → ${s.voted}` : "";
        if (lbl) svg.append(sv("text", { x, y: y + (y > 205 ? 54 : -46), "text-anchor": "middle", class: s.role === "leader" || s.role === "candidate" ? "ds-big" : "ds-lab" }, lbl));
      });
      svg.append(sv("text", { x: 12, y: 390, class: "ds-lab" }, `t = ${F.t} мс`));
      svg.setAttribute("aria-label", `t = ${F.t} мс. ` + NODES.map((n) => { const s = F.st[n]; return `${n}: ${s.role === "dead" ? "құлаған" : s.role === "leader" ? "көшбасшы" : s.role === "candidate" ? "кандидат" : "ізбасар"}, мерзім ${s.term}`; }).join("; "));
      const tm = $("[data-k=timers]"); tm.innerHTML = "";
      NODES.forEach((n) => {
        const s = F.st[n], left = s.dl != null ? s.dl - F.t : null;
        tm.append(el("div", { class: "ds-tm" + (s.role === "leader" ? " lead" : "") + (s.role === "dead" ? " dead" : "") }, el("b", { text: n }), el("i", { "aria-hidden": "true" }, el("s", { style: `width:${s.role === "leader" ? 100 : left != null ? Math.max(0, Math.min(100, (left / 300) * 100)) : 0}%` })), el("span", { text: s.role === "dead" ? "құлаған" : s.role === "leader" ? "көшбасшы" : `оянуға ${left} мс` })));
      });
      const log = $("[data-k=log]"); log.innerHTML = "";
      const k = frames.indexOf(F);
      frames.slice(1, k + 1).forEach((f, i) => log.append(el("li", { class: i === k - 1 ? "cur" : null, text: `t=${f.t}: ` + f.lines.join(" ") })));
      const curLi = log.querySelector(".cur"); if (curLi) log.scrollTop = curLi.offsetTop - log.clientHeight + curLi.offsetHeight + 8;
    }
    function rebuild() { build(); st.reload(); }
    settings(); build();
    const st = C.stepper(root, { frames: () => frames, render, delay: 1500 });
    $("[data-k=preset]").addEventListener("change", (e) => { const v = e.target.value; if (v !== "custom") cfg = JSON.parse(JSON.stringify(PRE[v])); else { cfg = JSON.parse(JSON.stringify(cfg)); cfg.part = null; } settings(); rebuild(); });
    st.paint();
  })();

  // ================================================================ қорытынды тапсырма
  (() => {
    const root = document.querySelector("[data-cslab=dist-task]");
    if (!root) return;
    const $ = (s) => root.querySelector(s), R = rng(C.seed()), kindSel = $("[data-k=kind]");
    let choice = null;
    const QO = [{ id: "wfail", label: "Жазу сәтсіз - W растау жиналмайды" }, { id: "rfail", label: "Жазу сәтті, бірақ оқу сәтсіз" }, { id: "stale", label: "Оқу ескі мәнді қайтаруы мүмкін" }, { id: "fresh", label: "Оқу міндетті түрде жаңа мәнді қайтарады" }];
    function choices(opts) {
      const box = el("div", { class: "lab-choice", role: "group", "aria-label": "Жауап нұсқалары" });
      opts.forEach((o) => box.append(el("button", { type: "button", "aria-pressed": "false", "data-a": o.id, text: o.label, onclick: (e) => { choice = o.id; box.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === e.currentTarget))); } })));
      $("[data-k=ansbox]").innerHTML = ""; $("[data-k=ansbox]").append(box);
    }
    function make() {
      choice = null; const q = $("[data-k=q]"); q.innerHTML = "";
      if (kindSel.value === "quorum") {
        const N = 3 + Math.floor(R() * 5), W = 1 + Math.floor(R() * N), Rr = 1 + Math.floor(R() * N), part = R() < 0.4, k = part ? 1 + Math.floor(R() * (N - 1)) : N;
        const Q = quorum({ N, W, R: Rr, k });
        const answer = !Q.writeOk ? "wfail" : !Q.readOk ? "rfail" : Q.stalePossible ? "stale" : "fresh";
        q.append(el("p", null, `Кластерде N = ${N} реплика, жазу кворумы W = ${W}, оқу кворумы R = ${Rr}. `, part ? el("b", { text: `Желі бөлінген: клиент тек ${k} репликаға жетеді. ` }) : "Желі бөлінбеген. ", "Клиент x = 2 жазады (бұрын x = 1), содан кейін бірден x-ті оқиды. Оқу кез келген R қолжетімді репликаға түсуі мүмкін. Не болады?"));
        choices(QO);
        return { kind: "quorum", N, W, R: Rr, k, part, Q, answer };
      }
      for (let tries = 0; tries < 60; tries++) {
        const dead = pick(R, NODES), t1 = {}, t2 = {};
        NODES.forEach((n) => { t1[n] = 150 + 10 * Math.floor(R() * 16); t2[n] = 150 + 10 * Math.floor(R() * 16); });
        if (R() < 0.35) { const al = NODES.filter((n) => n !== dead); const a = pick(R, al), b = pick(R, al.filter((n) => n !== a && ringD(n, a) === 2)); if (b) { const m = Math.min(...al.map((n) => t1[n])); t1[a] = m; t1[b] = m; } }
        const cfg = { crashed: [dead], leader0: dead, t1, t2, part: null };
        const r = elect(cfg);
        if (!r.stable) continue;
        const terms = [...new Set([2, 3, r.leader.term])].sort();
        q.append(el("p", { text: `Бес түйін A-B-C-D-E сақинада (A–E көрші); хабар кешігуі = 10 мс × сақинадағы қашықтық (көршіге 10, арғысына 20). 1-мерзімнің көшбасшысы ${dead} t = 0-да құлады. Ізбасарлардың таймауттары (алғашқы → кейінгі):` }));
        const tb = el("table", { class: "csb-table" }, el("thead", null, el("tr", null, el("th", { scope: "col", text: "Түйін" }), el("th", { scope: "col", text: "алғашқы, мс" }), el("th", { scope: "col", text: "кейінгі, мс" }))));
        const body = el("tbody"); NODES.filter((n) => n !== dead).forEach((n) => body.append(el("tr", null, el("td", { text: n }), el("td", { text: String(t1[n]) }), el("td", { text: String(t2[n]) })))); tb.append(body);
        q.append(el("div", { class: "csb-scroll" }, tb), el("p", { text: "Ереже: бір мерзімде бір дауыс, бірінші жеткен сұрауға; көпшілік - 5-тің 3-і; дауыс бергенде таймер қайта басталады (кейінгі мәнмен). Кім және қай мерзімде көшбасшы болады?" }));
        const opts = []; NODES.filter((n) => n !== dead).forEach((n) => terms.forEach((tm) => opts.push({ id: `${n}-${tm}`, label: `${n}, ${tm}-мерзім` })));
        choices(opts);
        const split = r.frames.some((f) => f.cands && f.cands.length > 1);
        return { kind: "elect", cfg, r, dead, answer: `${r.leader.n}-${r.leader.term}`, split };
      }
      return make();
    }
    function hints(P) {
      if (P.kind === "quorum") return ["Ретімен тексеріңіз: (1) қолжетімді k реплика ≥ W ме? Жоқ болса - жазу сәтсіз. (2) k ≥ R ме? Жоқ болса - оқу сәтсіз. (3) Жазуды көрмеген k − W реплика оқу жиынын (R) толық сыйғыза ала ма? Сыйса - ескі оқу мүмкін.",
        "Мысал: N = 5, W = 2, R = 3, бөліну жоқ: 5 ≥ 2, 5 ≥ 3; жазуды көрмегендер 3 ≥ R = 3 → ескі оқу мүмкін (R + W = 5 ≤ N). W = 3 болса: 2 < 3 → кепілді жаңа.",
        `k = ${P.k}: ${P.k} ${P.k >= P.W ? "≥" : "<"} W = ${P.W}${P.k >= P.W ? `; ${P.k} ${P.k >= P.R ? "≥" : "<"} R = ${P.R}${P.k >= P.R ? `; жазуды көрмеген ${P.k - P.W} ${P.k - P.W >= P.R ? "≥" : "<"} R = ${P.R}` : ""}` : ""}. Жауап: ${QO.find((o) => o.id === P.answer).label}.`];
      const r = P.r, lines = r.frames.slice(1).filter((f) => f.cands || f.elected).map((f) => `t=${f.t}: ${f.cands ? f.cands.join(", ") + " кандидат" : ""}${f.elected ? ` ${f.elected.n} көшбасшы (${f.elected.term}-мерзім)` : ""}`);
      return ["Ең қысқа алғашқы таймауты бар ізбасар бірінші оянып, мерзімді 1-ден 2-ге көтереді. Оның сұрауы басқаларға кешігумен жетеді; олар әлі дауыс бермеген болса - соған береді. Екі түйін бір мезгілде оянса, дауыстар бөлінуі мүмкін - сонда кейінгі таймауты қысқасы 3-мерзімде жеңеді.",
        "Мысал: C құлады; B 160, A 230, D 200, E 270 мс. B t = 160-та 2-мерзімге кандидат; A 170-те, D мен E 180-де дауыс береді; 200-де B-де 4 дауыс → B, 2-мерзім.",
        lines.join("; ") + `. Жауап: ${r.leader.n}, ${r.leader.term}-мерзім.`];
    }
    function check(P) {
      if (!choice) return { empty: true, title: "Нұсқа таңдаңыз", why: "Батырмалардың бірін басып, «Тексеру»." };
      const ok = choice === P.answer;
      if (P.kind === "quorum") {
        const A = P.answer, k = P.k, W = P.W, Rr = P.R;
        const WHY = { wfail: `Қолжетімді ${k} реплика < W = ${W}: жазу растау жинай алмайды.`, rfail: `${k} ≥ W = ${W} - жазу сәтті, бірақ ${k} < R = ${Rr} - оқу жауап жинай алмайды.`, stale: `Жазуды көрмеген ${k - W} реплика ≥ R = ${Rr}: оқу тек ескілерге түсуі мүмкін (R + W = ${Rr + W} ≤ ${k}).`, fresh: `R + W = ${Rr + W} > ${k}: кез келген оқу жиынында кемінде ${Rr + W - k} жаңа реплика бар.` };
        if (ok) return { ok, title: "Дұрыс", why: WHY[A], skillTitle: "Кворум: нәтижені болжау" };
        const code = A === "stale" && choice === "fresh" ? "rw-le-n" : A === "fresh" && choice === "stale" ? "rw-gt-n" : A.endsWith("fail") || choice.endsWith("fail") ? "partition" : "quorum";
        const extra = code === "rw-le-n" ? " Кепіл үшін R + W > N (бөлінуде - k) керек; теңдік жеткіліксіз." : code === "rw-gt-n" ? " Екі кворум қатаң көпшілік емес болса да, қосындысы N-нен асса, олар міндетті түрде қиылысады." : P.part ? " Бөлінуде кворумды тек қолжетімді k репликадан жинауға болады." : "";
        return { ok, code, title: "Қате", why: WHY[A] + extra, skillTitle: "Кворум: нәтижені болжау" };
      }
      const [n, tm] = choice.split("-"), L = P.r.leader, cfg = P.cfg;
      if (ok) return { ok, title: "Дұрыс", why: `${L.n} ${L.term}-мерзімде көпшілік (3) жинады.${P.split ? " Алғашқы мерзімде дауыс бөлінген еді." : ""}`, skillTitle: "Сайлау: көшбасшыны болжау" };
      if (n === L.n) return { ok, code: "term", title: "Түйін дұрыс, мерзім қате", why: P.split ? `Алғашқы сайлауда (2-мерзім) дауыс бөлінді, сондықтан ${L.n} келесі таймаутта мерзімді тағы көтерді: ${L.term}. Әр сайлау әрекеті мерзімді 1-ге арттырады.` : `Сайлау бір-ақ рет өтті: ескі мерзім 1 + 1 = ${L.term}.`, skillTitle: "Сайлау: көшбасшыны болжау" };
      const al = NODES.filter((x) => x !== P.dead), first = Math.min(...al.map((x) => cfg.t1[x]));
      if (P.split && cfg.t1[n] === first) return { ok, code: "split-vote", title: "Дауыс бөлінді", why: `${n} шынымен бірінші оянды, бірақ ${al.filter((x) => cfg.t1[x] === first).join(" мен ")} бір мезгілде кандидат болып, дауысты бөлді. Кейінгі таймауты қысқа ${L.n} ${L.term}-мерзімде жеңді.`, skillTitle: "Сайлау: көшбасшыны болжау" };
      return { ok, code: "timeout-order", title: "Бірінші оянған жеңеді", why: `${n}-нің алғашқы таймауты ${cfg.t1[n]} мс; ${L.n} ертерек оянып (${cfg.t1[L.n]} мс${P.split ? `, кейін ${cfg.t2[L.n]}` : ""}), бірінші дауыс жинады. Дұрысы: ${L.n}, ${L.term}-мерзім.`, skillTitle: "Сайлау: көшбасшыны болжау" };
    }
    const tk = C.task(root, { make, check: (P) => check(P), hints, skill: (P) => (P.kind === "quorum" ? "cs.dist.quorum" : "cs.dist.election") });
    $("[data-c=check]").addEventListener("click", () => tk.run());
    $("[data-c=new]").addEventListener("click", () => tk.fresh());
    kindSel.addEventListener("change", () => tk.fresh());
    tk.fresh();
    window.CSLabDist.task = () => tk.P;
  })();

  C.badges();
})();
