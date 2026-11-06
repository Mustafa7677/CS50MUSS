/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* SAT R&W «Standard English Conventions» талдағышы:
   1) сөйлем диаграммасы - бөліктердің түрін анықта (тәуелсіз / бағыныңқы / тіркес), сосын тыныс белгісін таңда; ереже қозғалтқышы әр белгіні бағалайды;
   2) нақты бастауышты тап - аралық тіркестер қадаммен сызылады (Ойнату/Кідірту/Алдыңғы/Келесі/Басынан/Жылдамдық);
   3) есімдік/тәуелдік және анықтауыштың орны - сілтеме сызығы;
   4) меңгеру тексерісі - құрастырылған жаңа сөйлемдер, көмексіз. */
(() => {
  "use strict";
  const D = window.SAT_RW_GRAMMAR, T = window.AO17Tutor, { h, shuffle, pick, focus } = window.SAT, RW = window.SATRW;
  const $ = (id) => document.getElementById(id);
  if (!D || !$("bd-sent")) return;
  const SK_B = "sat.rw.boundaries", SK_F = "sat.rw.form-structure-and-sense";
  const TYPE = { ic: "Тәуелсіз сөйлем", dc: "Бағыныңқы сөйлем", ph: "Сөйлем емес (тіркес/тізім)" };
  const TSHORT = { ic: "IC · тәуелсіз", dc: "DC · бағыныңқы", ph: "тіркес / тізім" };
  const REL = { add: "қосу", contrast: "қарсы қою", result: "себеп-салдар", explain: "түсіндіру/нақтылау", list: "тізім" };
  const MARKS = [".", ";", ":", ",", "conj", "—", ""];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const markName = (it, m) => ({ ".": ". нүкте", ";": "; нүктелі үтір", ":": ": қос нүкте", ",": ", тек үтір", conj: it.conj + " (үтір + FANBOYS)", "—": "— сызықша", "": "∅ белгісіз" })[m];
  const markSym = (it, m) => (m === "conj" ? it.conj.trim() : m === "" ? "∅" : m);
  const join = (it, m) => {
    const R = it.R.t;
    if (m === ".") return it.L.t + ". " + cap(R) + ".";
    if (m === "conj") return it.L.t + it.conj + " " + R + ".";
    if (m === "—") return it.L.t + "—" + R + ".";
    if (m === "") return it.L.t + " " + R + ".";
    return it.L.t + m + " " + R + ".";
  };

  /* ---------- ереже қозғалтқышы ---------- */
  function judge(it, m) {
    const t = it.L.type + "+" + it.R.type, rel = REL[it.rel], however = /^however\b/.test(it.R.t);
    const ok = (why) => ({ ok: true, why }), bad = (code, why) => ({ ok: false, code, why });
    if (t === "ic+ic") {
      if (m === "." || m === ";") return ok(`Екі бөлік те тәуелсіз сөйлем (әрқайсысында бастауыш + баяндауыш бар, жеке тұра алады). ${m === "." ? "Нүкте" : "Нүктелі үтір"} екі тәуелсіз сөйлемді дұрыс бөледі.`);
      if (m === ",") return bad("splice", "Comma splice: екі тәуелсіз сөйлемді ЖАЛҒЫЗ үтір қоса алмайды. Үтірге FANBOYS жалғаулығын (and, but, so...) қос немесе нүкте/нүктелі үтір қой." + (however ? " «However» - жалғаулық емес, үстеу, сондықтан ол үтірді «құтқармайды»." : ""));
      if (m === "") return bad("runon", "Run-on: екі тәуелсіз сөйлем ешбір белгісіз жабысып кетті. Олардың шекарасы белгіленуі керек.");
      if (m === "conj") {
        if (however) return bad("logic", `«${it.conj.trim()} however» - екі байланыстырғыш қатар: екінші бөлік «however»-мен басталып тұр. Мұнда нүкте не нүктелі үтір керек.`);
        if (it.rel === "explain") return bad("logic", `Грамматика жағынан «${it.conj.trim()}» екі тәуелсіз сөйлемді қоса алады, бірақ мағына сәйкес емес: 2-бөлік 1-бөлікті түсіндіреді, ал «${it.conj.trim()}» басқа қатынасты білдіреді.`);
        return ok(`Үтір + FANBOYS («${it.conj.trim()}») екі тәуелсіз сөйлемді қосады, қатынасы да дұрыс (${rel}).`);
      }
      if (m === ":" || m === "—") return it.rel === "explain" ? ok(`${m === ":" ? "Қос нүкте" : "Сызықша"} алдындағы толық сөйлемді түсіндіретін бөлікті енгізеді: 2-бөлік 1-бөліктегі ойды нақтылайды.`) : bad("colon", `${m === ":" ? "Қос нүкте" : "Сызықша"} 2-бөлік 1-бөлікті түсіндіргенде/нақтылағанда қойылады. Мұнда қатынас - ${rel}, түсіндірме емес.`);
    }
    if (t === "ic+ph") {
      if (m === ":" || m === "—") return ok(`1-бөлік - толық сөйлем, 2-бөлік - оны нақтылайтын ${it.rel === "list" ? "тізім" : "тіркес"}. ${m === ":" ? "Қос нүкте" : "Сызықша"} дәл осындай түсіндірмені енгізеді.`);
      if (m === "." || m === ";") return bad("frag", `2-бөлік - сөйлем емес (бастауыш пен баяндауыш жоқ). ${m === "." ? "Нүктеден" : "Нүктелі үтірден"} кейін толымсыз сөйлем (fragment) қалады: нүктелі үтірдің ЕКІ жағында да тәуелсіз сөйлем болуы керек.`);
      if (m === ",") return bad("comma", "Үтір тізімді алдындағы толық сөйлемнен анық ажыратпайды: тізім ішінде де үтірлер бар, сондықтан оқырман шекараны көрмейді. Түсіндірме/тізімді қос нүкте не сызықша енгізеді.");
      if (m === "") return bad("none", "Белгісіз тізім алдындағы сөзге жабысып қалады: «...tools a hammer». Түсіндірме бөлікті қос нүкте не сызықша енгізеді.");
      if (m === "conj") return bad("conj", `«${it.conj.trim()}»-дан кейін жаңа тәуелсіз сөйлем келуі керек еді; мұнда тек тізім тұр.`);
    }
    if (t === "dc+ic") {
      if (m === ",") return ok(`1-бөлік «${it.L.sub}»-мен басталатын бағыныңқы сөйлем - жеке тұра алмайды. Кіріспе бағыныңқыдан кейін үтір қойылады.`);
      if (m === "." || m === ";" || m === ":" || m === "—") return bad("frag", `«${it.L.t}» - бағыныңқы сөйлем: «${it.L.sub}» оны негізгі сөйлемге тәуелді етеді. ${m === "." ? "Нүкте оны толымсыз сөйлем (fragment) етіп қалдырады." : m === ";" ? "Нүктелі үтірдің екі жағында да тәуелсіз сөйлем болуы керек." : "Бұл белгінің алдында толық сөйлем болуы керек."}`);
      if (m === "") return bad("none", "Кіріспе бағыныңқы сөйлем (when, because, although...) негізгі сөйлемнен үтірмен бөлінеді; онсыз шекара көрінбейді.");
      if (m === "conj") return bad("conj", `«${it.L.sub}» мен «${it.conj.trim()}» қатар келмейді: бағындырғыш сөз байланысты әлдеқашан құрып тұр (мысалы, «Although ..., but ...» - қате).`);
    }
    if (t === "ic+dc") {
      if (m === "") return ok(`2-бөлік «${it.R.sub}»-мен басталатын бағыныңқы сөйлем - негізгі сөйлемнің мағынасын шектейді (себеп/уақыт/мақсат). Ол сөйлемнің соңында тұрғанда белгісіз жалғанады.`);
      if (m === ",") return bad("comma", `«${it.R.sub} ...» бөлігі негізгі ойдың маңызды бөлігі (essential), сондықтан үтір қажет емес. SAT мұндай жағдайда үтірсіз нұсқаны дұрыс деп санайды.`);
      if (m === "." || m === ";") return bad("frag", `«${it.R.t}» - бағыныңқы сөйлем, жеке тұра алмайды: ${m === "." ? "нүктеден кейін толымсыз сөйлем қалады." : "нүктелі үтірдің екі жағында да тәуелсіз сөйлем болуы керек."}`);
      if (m === ":" || m === "—") return bad("colon", `«${it.R.sub} ...» 1-бөлікті түсіндіретін жеке ой емес, сол сөйлемнің ішкі бөлігі; ${m === ":" ? "қос нүкте" : "сызықша"} сөйлемді үзіп тастайды.`);
      if (m === "conj") return bad("conj", `«${it.conj.trim()} ${it.R.sub}» - екі байланыстырғыш қатар; бағыныңқы сөйлемнің өз жалғаулығы бар.`);
    }
    return bad("?", "Бұл белгі мұнда сәйкес емес.");
  }
  const okMarks = (it) => MARKS.filter((m) => judge(it, m).ok);

  /* ---------- генератор ---------- */
  function genBd() {
    const G = D.gen, kind = pick(["pairs", "pairs", "explain", "lists", "dcFirst", "dcLast"]);
    const id = "gen-" + kind + "-" + Math.random().toString(36).slice(2, 7);
    if (kind === "pairs") { const p = pick(G.pairs); return { id, L: { t: p[0], type: "ic", s: p[1], v: p[2] }, R: { t: p[3], type: "ic", s: p[4], v: p[5] }, rel: p[6], conj: p[7] }; }
    if (kind === "explain") { const p = pick(G.explain); return { id, L: { t: p[0], type: "ic", s: p[1], v: p[2] }, R: { t: p[3], type: "ic", s: p[4], v: p[5] }, rel: "explain", conj: ", but" }; }
    if (kind === "lists") { const p = pick(G.lists); return { id, L: { t: p[0], type: "ic", s: p[1], v: p[2] }, R: { t: p[3], type: "ph" }, rel: "list", conj: ", and" }; }
    if (kind === "dcFirst") { const p = pick(G.dcFirst); return { id, L: { t: p[0], type: "dc", s: p[1], v: p[2], sub: p[3] }, R: { t: p[4], type: "ic", s: p[5], v: p[6] }, rel: "add", conj: ", and" }; }
    const p = pick(G.dcLast); return { id, L: { t: p[0], type: "ic", s: p[1], v: p[2] }, R: { t: p[3], type: "dc", s: p[4], v: p[5], sub: p[6] }, rel: "result", conj: ", so" };
  }
  function genSv() {
    const p = pick(D.gen.sv), num = Math.random() < 0.5 ? "sg" : "pl";
    const s = num === "sg" ? p[0] : p[1], pp = num === "sg" ? p[2] : p[3];
    return { id: "gen-sv-" + Math.random().toString(36).slice(2, 7), segs: [{ t: s, r: "s", h: s.split(" ").pop() }, { t: pp + ",", r: "x", k: "предлогтық тіркес" }, { t: p[4] + ",", r: "x", k: "қосымша сөйлем" }, { t: "___", r: "v" }, { t: p[5], r: "o" }], num, opts: p[6], ans: num === "sg" ? 0 : 1 };
  }

  /* ---------- диаграмма ---------- */
  function clauseBox(el, part, show) {
    el.className = "rw-cl rw-anim" + (show ? " " + part.type : "");
    el.innerHTML = "";
    el.append(h("b", { text: show ? TSHORT[part.type] : "? түрі әлі анықталмаған" }));
    if (!show || !part.s) { el.append(document.createTextNode(part.t)); return; }
    // бастауыш (бір сызық) және баяндауыш (қос сызық)
    const t = part.t, si = t.indexOf(part.s), vi = t.indexOf(part.v, si >= 0 ? si + part.s.length : 0);
    const marks = [[si, part.s.length, "s"], [vi, part.v.length, "v"]].filter((x) => x[0] >= 0).sort((a, b) => a[0] - b[0]);
    let pos = 0;
    marks.forEach(([i, n, c]) => { if (i < pos) return; el.append(document.createTextNode(t.slice(pos, i)), h("span", { class: c, text: t.slice(i, i + n) })); pos = i + n; });
    el.append(document.createTextNode(t.slice(pos)));
  }
  function joint(it, m, res) {
    const j = $("bd-joint");
    j.className = "rw-joint rw-anim" + (res ? (res.ok ? " ok" : " no") : "");
    j.textContent = m === undefined ? "?" : markSym(it, m);
    j.append(h("small", { text: m === undefined ? "белгі" : res.ok ? "дұрыс шекара" : ({ splice: "comma splice", runon: "run-on", frag: "fragment", logic: "мағына қате", colon: "қатынас емес", comma: "артық/жеткіліксіз", none: "белгі жоқ", conj: "артық жалғаулық" })[res.code] || "қате" }));
    $("bd-board").setAttribute("aria-label", `Сөйлем диаграммасы: сол жақ - ${TYPE[it.L.type]}, оң жақ - ${TYPE[it.R.type]}, арасында ${m === undefined ? "белгі әлі таңдалмаған" : markName(it, m)}`);
  }

  /* ---------- 1. Сөйлем шекаралары ---------- */
  let queue = D.bd.slice(), qi = 0, it = null, cls = {}, clsOk = null, done = false, bdHints = null, spoiled = false;
  T.badge($("bd-badge"), SK_B, "SAT: Boundaries");
  function bdLoad() {
    it = queue[qi]; cls = {}; clsOk = null; done = false; spoiled = false;
    const gen = it.id.startsWith("gen");
    $("bd-prog").textContent = gen ? "Жаңа құрастырылған сөйлем (генератор)" : `Сөйлем ${qi + 1} / ${D.bd.length}`;
    $("bd-sent").innerHTML = "";
    $("bd-sent").append(h("span", { lang: "en", text: it.L.t }), h("span", { class: "rw-slot", "aria-label": "белгі орны", text: "?" }), " ", h("span", { lang: "en", text: it.R.t + "." }));
    clauseBox($("bd-l"), it.L, false); clauseBox($("bd-r"), it.R, false); joint(it, undefined);
    ["l", "r"].forEach((side) => {
      const g = $("bd-c" + side); g.querySelectorAll("button").forEach((b) => b.remove());
      Object.keys(TYPE).forEach((k) => { const b = h("button", { type: "button", "aria-pressed": "false", "data-t": k }, TYPE[k]); b.addEventListener("click", () => classify(side, k)); g.append(b); });
    });
    RW.clear($("bd-fb1")); RW.clear($("bd-fb2"));
    $("bd-s2").hidden = true; $("bd-next").hidden = true; $("bd-all").textContent = "";
    const mk = $("bd-marks"); mk.innerHTML = "";
    MARKS.forEach((m) => { const b = h("button", { type: "button", "data-m": m === "" ? "none" : m, "aria-pressed": "false", "aria-label": markName(it, m) }, markSym(it, m), h("small", { text: markName(it, m).replace(/^\S+\s/, "") })); b.addEventListener("click", () => choose(m, b)); mk.append(b); });
    const oks = okMarks(it).map((m) => markName(it, m));
    const steps = [
      "Әр бөліктен бастауыш пен баяндауышты ізде. Екеуі де бар және бөлік «when / because / although» сияқты сөзбен басталмаса - ол тәуелсіз сөйлем (IC). Бағындырғыш сөзі болса - бағыныңқы (DC). Етістігі жоқ тізім не тіркес - сөйлем емес.",
      "Ұқсас мысал: «The bus was late ___ we missed the first act.» Екі жақ та толық сөйлем → нүкте, нүктелі үтір немесе «, so». Ал «The kit has two tools ___ a saw and a drill.» - оң жақта етістік жоқ → қос нүкте.",
      `Шешім: сол жақ - ${TYPE[it.L.type]}, оң жақ - ${TYPE[it.R.type]}. Мұнда дұрыс белгілер: ${oks.join("; ")}.`,
    ];
    if (!bdHints) bdHints = T.hints($("bd-h"), steps, { onSolution: () => { spoiled = true; queue.splice(qi + 1, 0, genBd()); T.feedback($("bd-fb2"), "info", "Шешім ашылды.", "Бұл сөйлем меңгеруге саналмайды. Келесіге жаңа (құрастырылған) сөйлем қосылды - соны көмексіз шеш."); } });
    else bdHints.reset(steps);
  }
  function classify(side, k) {
    if (clsOk) return;
    cls[side] = k;
    $("bd-c" + side).querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.t === k)));
    if (!cls.l || !cls.r) return;
    const okL = cls.l === it.L.type, okR = cls.r === it.R.type;
    clsOk = { l: okL, r: okR };
    ["l", "r"].forEach((s) => $("bd-c" + s).querySelectorAll("button").forEach((b) => { b.disabled = true; const part = s === "l" ? it.L : it.R; if (b.dataset.t === part.type) b.classList.add("ok"); else if (b.dataset.t === cls[s]) b.classList.add("no"); }));
    clauseBox($("bd-l"), it.L, true); clauseBox($("bd-r"), it.R, true);
    const ex = (p) => p.type === "ic" ? `бастауыш «${p.s}» + баяндауыш «${p.v}», бағындырғыш сөз жоқ → жеке тұра алады` : p.type === "dc" ? `бастауыш «${p.s}» + баяндауыш «${p.v}» бар, бірақ «${p.sub}» оны тәуелді етеді → жеке тұра алмайды` : "етістігі (баяндауышы) жоқ - бұл сөйлем емес, тізім/тіркес";
    T.feedback($("bd-fb1"), okL && okR ? "ok" : "bad", okL && okR ? "Бөліктердің түрі дұрыс анықталды." : `Түрі қате: ${!okL ? "сол жақ бөлік - " + TYPE[it.L.type] : ""}${!okL && !okR ? "; " : ""}${!okR ? "оң жақ бөлік - " + TYPE[it.R.type] : ""}.`, `Сол жақ: ${ex(it.L)}. Оң жақ: ${ex(it.R)}. Диаграммада бастауыш бір сызықпен, баяндауыш қос сызықпен белгіленді.`);
    $("bd-s2").hidden = false;
    focus($("bd-marks").querySelector("button"));
  }
  function choose(m, b) {
    if (done) return;
    done = true;
    const res = judge(it, m);
    $("bd-marks").querySelectorAll("button").forEach((x) => { x.disabled = true; x.setAttribute("aria-pressed", String(x === b)); const mm = x.dataset.m === "none" ? "" : x.dataset.m; if (judge(it, mm).ok) x.classList.add("ok"); else if (x === b) x.classList.add("no"); });
    joint(it, m, res);
    $("bd-sent").querySelector(".rw-slot").textContent = markSym(it, m);
    T.feedback($("bd-fb2"), res.ok ? "ok" : "bad", res.ok ? `Дұрыс: ${join(it, m)}` : `Қате: ${markName(it, m)}`, res.why);
    $("bd-all").textContent = "Бұл сөйлемде дұрыс болатын барлық белгі: " + okMarks(it).map((x) => markName(it, x)).join("; ") + ". SAT нұсқаларының ішінде олардың біреуі ғана беріледі.";
    const hints = bdHints.used();
    T.record(SK_B, { item: it.id, ok: res.ok && clsOk.l && clsOk.r && !spoiled, hints: spoiled ? 3 : hints, error: res.ok ? (clsOk.l && clsOk.r ? "" : "clause-type") : res.code, note: res.ok ? "" : `${it.L.type}+${it.R.type}: ${markName(it, m)}`, title: "SAT: Boundaries" });
    $("bd-next").hidden = false;
    $("bd-next").textContent = qi >= queue.length - 1 ? "Жаңа құрастырылған сөйлем" : "Келесі сөйлем";
  }
  $("bd-next").addEventListener("click", () => { if (qi >= queue.length - 1) queue.push(genBd()); qi++; bdLoad(); RW.toTop($("bd-lab")); focus($("bd-cl").querySelector("button")); });
  bdLoad();

  /* ---------- 2. Нақты бастауыш ---------- */
  let svQ = D.sv.slice(), si = 0, sv = null, svPred = null, svDone = false, svHints = null, svSpoiled = false;
  T.badge($("sv-badge"), SK_F, "SAT: Form, Structure, and Sense");
  const xs = () => sv.segs.filter((s) => s.r === "x");
  const svStep = RW.stepper($("sv-ctl"), { count: 2, label: "Бастауыш іздеу қадамдары", render: (k) => svPaint(k) });
  function svPaint(k) {
    const box = $("sv-toks"), n = xs().length;
    box.querySelectorAll("[data-seg]").forEach((w) => {
      const s = sv.segs[+w.dataset.seg], xi = xs().indexOf(s);
      w.classList.toggle("x", s.r === "x" && xi < k);
      w.classList.toggle("subj", s.r === "s" && k > n);
      w.classList.toggle("head", s.r === "s" && k > n && w.dataset.w === s.h);
    });
    box.querySelectorAll(".tag").forEach((t) => { t.hidden = +t.dataset.x >= k; });
    const vb = box.querySelector(".blank");
    vb.textContent = k > n ? (sv.num === "sg" ? "← жекеше етістік" : "← көпше етістік") : "___";
    const say = k === 0 ? "Толық сөйлем. Етістікке ең жақын тұрған зат есім бастауыш болмауы мүмкін - аралық тіркестерді біртіндеп сызамыз."
      : k <= n ? `${k}-қадам: «${xs()[k - 1].t.replace(/,$/, "")}» - ${xs()[k - 1].k}. Ол бастауышты сипаттайды, бірақ етістік онымен келіспейді - сызамыз.`
      : `Нәтиже: нақты бастауыш - «${sv.segs.find((s) => s.r === "s").t.replace(/,$/, "")}», басты сөзі «${sv.segs.find((s) => s.r === "s").h}» (${sv.num === "sg" ? "жекеше" : "көпше"}). Етістік соған келіседі.`;
    $("sv-say").textContent = say;
  }
  function svLoad() {
    sv = svQ[si]; svPred = null; svDone = false; svSpoiled = false;
    $("sv-prog").textContent = sv.id.startsWith("gen") ? "Жаңа құрастырылған сөйлем (генератор)" : `Сөйлем ${si + 1} / ${D.sv.length}`;
    const box = $("sv-toks"); box.innerHTML = ""; let xi = 0;
    sv.segs.forEach((s, k) => {
      if (s.r === "v") { box.append(h("span", { class: "blank", text: "___" }), " "); return; }
      if (s.r === "x") box.append(h("span", { class: "tag", "data-x": String(xi++), hidden: "", text: s.k }));
      s.t.split(" ").forEach((w) => {
        const clean = w.replace(/[.,]/g, "");
        const b = h("button", { type: "button", "data-seg": String(k), "data-w": clean, "aria-pressed": "false" }, w);
        b.addEventListener("click", () => svPick(b, s, clean));
        box.append(b, " ");
      });
    });
    svStep.reset(xs().length + 2); svStep.el.hidden = true; $("sv-say").textContent = "";
    RW.clear($("sv-fb1")); RW.clear($("sv-fb2")); $("sv-s2").hidden = true; $("sv-next").hidden = true;
    const o = $("sv-opts"); o.innerHTML = "";
    sv.opts.forEach((w, k) => { const b = h("button", { type: "button", "aria-pressed": "false", "data-k": k, lang: "en" }, w); b.addEventListener("click", () => svVerb(k, b)); o.append(b); });
    const subj = sv.segs.find((s) => s.r === "s");
    const steps = [
      "Етістіктен бұрын тұрған (немесе инверсияда - кейін тұрған) тіркестерді ажырат: «of ...», «along with ...», «which/that ...», «-ing ...» - бұлар бастауыш емес, оны сипаттайтын аралық тіркестер.",
      "Ұқсас мысал: «The box of old letters ___ in the attic.» «of old letters» тіркесін сызсаң - «The box ___» қалады → жекеше «is».",
      `Шешім: аралық тіркестер - ${xs().map((x) => "«" + x.t.replace(/,$/, "") + "»").join(", ")}. Нақты бастауыш - «${subj.t.replace(/,$/, "")}» (${sv.num === "sg" ? "жекеше" : "көпше"}), сондықтан етістік - «${sv.opts[sv.ans]}».`,
    ];
    if (!svHints) svHints = T.hints($("sv-h"), steps, { onSolution: () => { svSpoiled = true; svQ.splice(si + 1, 0, genSv()); T.feedback($("sv-fb2"), "info", "Шешім ашылды.", "Бұл сөйлем меңгеруге саналмайды; келесіге жаңа құрастырылған сөйлем қосылды."); } });
    else svHints.reset(steps);
  }
  function svPick(b, s, w) {
    if (svPred !== null) return;
    const subj = sv.segs.find((x) => x.r === "s");
    svPred = s.r === "s" && w === subj.h;
    b.setAttribute("aria-pressed", "true");
    $("sv-toks").querySelectorAll("button").forEach((x) => { x.disabled = true; });
    const why = svPred ? `«${w}» - бастауыштың басты сөзі (${sv.num === "sg" ? "жекеше" : "көпше"}). Енді қадамдарды ойнатып, аралық тіркестердің неге есептелмейтінін көр.`
      : s.r === "x" ? `«${w}» - «${s.t.replace(/,$/, "")}» ішіндегі сөз (${s.k}). Бұл тіркес бастауышты тек сипаттайды; етістік онымен келіспейді. Нақты бастауыш - «${subj.h}».`
      : s.r === "s" ? `«${w}» бастауыш тіркесінің ішінде, бірақ басты сөз емес. Басты сөз - «${subj.h}».` : `«${w}» - етістіктен кейінгі бөлік. Нақты бастауыш - «${subj.h}».`;
    T.feedback($("sv-fb1"), svPred ? "ok" : "bad", svPred ? "Болжам дұрыс." : "Болжам қате.", why);
    svStep.el.hidden = false; svStep.go(0);
    $("sv-s2").hidden = false;
  }
  function svVerb(k, b) {
    if (svDone) return;
    svDone = true;
    const ok = k === sv.ans, subj = sv.segs.find((x) => x.r === "s"), near = xs().map((x) => x.t).join(" ").match(/\b\w+s\b/);
    $("sv-opts").querySelectorAll("button").forEach((x, j) => { x.disabled = true; x.setAttribute("aria-pressed", String(x === b)); if (j === sv.ans) x.classList.add("ok"); else if (x === b) x.classList.add("no"); });
    svStep.go(svStep.n - 1);
    $("sv-toks").querySelector(".blank").textContent = sv.opts[k];
    T.feedback($("sv-fb2"), ok ? "ok" : "bad", ok ? `Дұрыс: «${sv.opts[k]}».` : `Қате: «${sv.opts[k]}» - ${sv.num === "sg" ? "көпше" : "жекеше"} түр.`, ok ? `Бастауыш «${subj.h}» ${sv.num === "sg" ? "жекеше" : "көпше"}; аралық тіркестер етістікке әсер етпейді.` : `Етістік ${sv.num === "sg" ? "жекеше" : "көпше"} «${subj.h}» сөзімен келісуі керек. ${near && sv.num === "sg" ? `«${near[0]}» сияқты жақын тұрған көпше сөз - қақпан.` : "Етістікке жақын тұрған сөзге алданба."}`);
    T.record(SK_F, { item: sv.id, ok: ok && svPred && !svSpoiled, hints: svSpoiled ? 3 : svHints.used(), error: ok ? (svPred ? "" : "subject-not-found") : "agreement", note: ok ? "" : `${subj.h}: ${sv.opts[k]}`, title: "SAT: Form, Structure, and Sense" });
    $("sv-next").hidden = false;
  }
  $("sv-next").addEventListener("click", () => { if (si >= svQ.length - 1) svQ.push(genSv()); si++; svLoad(); RW.toTop($("sv-lab")); focus($("sv-toks").querySelector("button")); });
  svLoad();

  /* ---------- 3. Есімдік және анықтауыш ---------- */
  const pmQ = D.pm.filter((x) => !x.check).concat(D.pm.filter((x) => x.check));
  let pi = 0, pm = null, pmDone = false, pmHints = null, pmSpoiled = false;
  function pmBoard(k) {
    const l = $("pm-l"), r = $("pm-r"), j = $("pm-j");
    l.className = "rw-cl ic"; r.className = "rw-cl";
    l.innerHTML = ""; r.innerHTML = ""; j.innerHTML = "";
    l.append(h("b", { text: pm.kind === "mod" ? "Анықтауыш (кіріспе тіркес)" : "Антецедент" }), h("span", { lang: "en", text: pm.link }));
    if (k === undefined) { r.append(h("b", { text: pm.kind === "mod" ? "Кімге/неге жабысады?" : "Есімдік" }), "?"); j.className = "rw-joint"; j.textContent = "→"; return; }
    const ok = k === pm.ans;
    r.className = "rw-cl " + (ok ? "ic" : "ph");
    r.append(h("b", { text: pm.kind === "mod" ? "Үтірден кейінгі бірінші зат есім" : "Таңдалған сөз" }), h("span", { lang: "en", text: pm.kind === "mod" ? pm.attach[k] : pm.opts[k] }));
    j.className = "rw-joint " + (ok ? "ok" : "no");
    j.textContent = ok ? "→ ✓" : "→ ✗";
    j.append(h("small", { text: pm.kind === "mod" ? (ok ? "әрекетті сол жасайды" : "қисынсыз жабысу") : (ok ? "сан мен түр сәйкес" : "сәйкес емес") }));
  }
  function pmLoad() {
    pm = pmQ[pi]; pmDone = false; pmSpoiled = false;
    $("pm-prog").textContent = pm.check ? `Меңгеру сұрағы ${pi - pmQ.filter((x) => !x.check).length + 1} / ${pmQ.filter((x) => x.check).length} · көмексіз, сызба жауаптан кейін` : `Сұрақ ${pi + 1} / ${pmQ.filter((x) => !x.check).length}`;
    $("pm-text").textContent = pm.text;
    $("pm-board").hidden = !!pm.check;
    pmBoard();
    RW.options($("pm-opts"), pm.opts, pmPick);
    RW.clear($("pm-fb")); $("pm-why").innerHTML = ""; $("pm-next").hidden = true;
    $("pm-h").hidden = !!pm.check;
    const steps = pm.kind === "mod" ? [
      "Кіріспе тіркестің (үтірге дейінгі бөлік) әрекетін кім жасайтынын сұра. Үтірден кейінгі БІРІНШІ зат есім дәл сол болуы керек.",
      "Ұқсас мысал: «Running to the bus, my phone fell.» - телефон жүгірмейді (қате). «Running to the bus, I dropped my phone.» - жүгірген «I» (дұрыс).",
      `Шешім: «${pm.link}» - «${pm.attach[pm.ans]}» туралы. Сондықтан дұрыс жауап: ${RW.L[pm.ans]}.`,
    ] : [
      "Есімдік неге сілтейтінін тап (антецедент). Жекеше ме, көпше ме? Тәуелдік керек пе (кімнің?), әлде «it is / they are» қысқартуы ма?",
      "Ұқсас мысал: «The team lost ___ first game.» - «team» жекеше, тәуелдік керек → «its» («it's» = it is).",
      `Шешім: антецедент - «${pm.link}». Дұрыс жауап: «${pm.opts[pm.ans]}».`,
    ];
    if (!pmHints) pmHints = T.hints($("pm-h"), steps, { onSolution: () => { pmSpoiled = true; T.feedback($("pm-fb"), "info", "Шешім ашылды.", "Бұл сұрақ меңгеруге саналмайды. Соңындағы меңгеру сұрақтарын көмексіз шеш."); } });
    else pmHints.reset(steps);
  }
  function pmPick(k) {
    if (pmDone) return;
    pmDone = true;
    RW.settle($("pm-opts"), pm.ans, k);
    $("pm-board").hidden = false; pmBoard(k);
    const ok = k === pm.ans;
    T.feedback($("pm-fb"), ok ? "ok" : "bad", ok ? "Дұрыс." : `Қате: ${RW.L[k]}.`, pm.why[k] + (ok ? "" : ` Дұрысы - ${RW.L[pm.ans]}.`));
    RW.whyList($("pm-why"), pm.opts, pm.why, pm.ans);
    T.record(SK_F, { item: pm.id, ok: ok && !pmSpoiled, hints: pm.check ? 0 : pmSpoiled ? 3 : pmHints.used(), error: ok ? "" : pm.kind === "mod" ? "dangling-modifier" : "pronoun", note: ok ? "" : pm.opts[k], title: "SAT: Form, Structure, and Sense" });
    $("pm-next").hidden = pi >= pmQ.length - 1;
  }
  $("pm-next").addEventListener("click", () => { pi++; pmLoad(); RW.toTop($("pm-lab")); });
  pmLoad();

  /* ---------- 4. Меңгеру тексерісі: жаңа сөйлемдер ---------- */
  let mx = [], mi = 0, mxOk = 0, mxDone = false;
  function mcqBd() {
    const g = genBd(), ok = okMarks(g), wrong = MARKS.filter((m) => !ok.includes(m) && !(g.R.type === "dc" && m === ","));
    const right = pick(ok), marks = shuffle([right, ...shuffle(wrong).slice(0, 3)]);
    const lw = g.L.t.split(" "), rw = g.R.t.split(" ");
    const last = lw.pop(), first = rw.shift();
    const opt = (m) => last + (m === "." ? ". " + cap(first) : m === "conj" ? g.conj + " " + first : m === "—" ? "—" + first : m === "" ? " " + first : m + " " + first);
    return { kind: "bd", g, skill: SK_B, passage: lw.join(" ") + " ______ " + rw.join(" ") + ".", choices: marks.map(opt), marks, ans: marks.indexOf(right) };
  }
  function mcqSv() {
    const g = genSv(), sg = g.opts[0], pl = g.opts[1];
    const choices = shuffle([sg, pl, "being", "to be"]), right = g.num === "sg" ? sg : pl;
    return { kind: "sv", g, skill: SK_F, passage: g.segs.map((s) => (s.r === "v" ? "______" : s.t)).join(" "), choices, ans: choices.indexOf(right) };
  }
  function mxNew() { mx = shuffle([mcqBd(), mcqBd(), mcqBd(), mcqSv(), mcqSv(), mcqSv()]); mi = 0; mxOk = 0; $("mx-sum").innerHTML = ""; $("mx-new").hidden = true; mxLoad(); }
  function mxLoad() {
    const q = mx[mi]; mxDone = false;
    $("mx-prog").textContent = `Жаңа сөйлем ${mi + 1} / ${mx.length} · көмексіз`;
    $("mx-pass").textContent = q.passage;
    RW.options($("mx-opts"), q.choices, mxPick);
    RW.clear($("mx-fb")); $("mx-next").hidden = true;
  }
  function mxPick(k) {
    if (mxDone) return;
    mxDone = true;
    const q = mx[mi], ok = k === q.ans;
    RW.settle($("mx-opts"), q.ans, k);
    let why;
    if (q.kind === "bd") why = judge(q.g, q.marks[k]).why + (ok ? "" : ` Дұрысы - ${RW.L[q.ans]}: ${judge(q.g, q.marks[q.ans]).why}`);
    else { const subj = q.g.segs.find((s) => s.r === "s"); why = ok ? `Бастауыш «${subj.h}» ${q.g.num === "sg" ? "жекеше" : "көпше"}; аралық тіркестерді елемедің.` : /being|to be/.test(q.choices[k]) ? `«${q.choices[k]}» - жіктелмеген форма: сөйлемде баяндауыш болмай қалады (fragment). Бастауыш «${subj.h}» → «${q.choices[q.ans]}».` : `Етістік «${subj.h}» сөзімен келісуі керек (${q.g.num === "sg" ? "жекеше" : "көпше"}) → «${q.choices[q.ans]}». Аралық тіркестегі зат есім - қақпан.`; }
    T.feedback($("mx-fb"), ok ? "ok" : "bad", ok ? "Дұрыс." : `Қате: ${RW.L[k]}.`, why);
    T.record(q.skill, { item: q.g.id, ok, hints: 0, error: ok ? "" : q.kind === "bd" ? "mastery-boundary" : "mastery-agreement", note: ok ? "" : q.choices[k], title: q.kind === "bd" ? "SAT: Boundaries" : "SAT: Form, Structure, and Sense" });
    if (ok) mxOk++;
    $("mx-sum").append(h("li", { class: ok ? "ok" : "no", text: `${mi + 1}. ${q.kind === "bd" ? "Boundaries" : "Subject-verb agreement"}: ${ok ? "дұрыс" : "қате"}` }));
    if (mi < mx.length - 1) { $("mx-next").hidden = false; return; }
    const pass = mxOk >= 5;
    T.feedback($("mx-fb"), pass ? "ok" : "info", `${ok ? "Дұрыс. " : ""}Меңгеру тексерісі: ${mxOk} / ${mx.length}`, pass ? "Бұрын көрмеген сөйлемдерде көмексіз дұрыс шештің - дағды қалыптасқан." : "Қателескен сөйлем түрлерін жоғарыдағы диаграммада қайта талда, сосын жаңа жиынтықты байқап көр.");
    $("mx-new").hidden = false;
  }
  $("mx-next").addEventListener("click", () => { mi++; mxLoad(); focus($("mx-opts").querySelector("button")); });
  $("mx-new").addEventListener("click", mxNew);
  $("mx-start").addEventListener("click", () => { $("mx-start").hidden = true; $("mx-body").hidden = false; mxNew(); focus($("mx-opts").querySelector("button")); });

  window.SATRW.grammar = { judge, okMarks, genBd, genSv, state: () => ({ it, sv, pm, mx, mi }) };
})();
