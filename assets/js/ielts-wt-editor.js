/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* AO17 IELTS Writing (2-пакет) - Task 1 Visuals пен GT Letter Studio-ға ортақ құралдар:
   редактор (сөз санағыш, таймер, автосақтау, нұсқалар тарихы, салыстыру, қалпына келтіру), ресми критерий атауларымен
   өзін-өзі тексеру, ереже нәтижесінің тізімі, мұғалімге экспорт (.txt/.json). Writing Studio-ның (ielts-writing.js) редакторынан
   бейімделген көшірме - түпнұсқа файл өзгертілмейді. Деректер тек осы браузерде: localStorage «ao17:ielts:wt:*». Band бағасы жоқ. */
(() => {
  "use strict";
  const I = window.IELTS;
  if (!I) return;
  const { h, store } = I;

  function editor(mount, { key, target, minutes, label, onChange }) {
    const K = "wt:" + key;
    const ta = h("textarea", { class: "lab-editor", id: `wt-ed-${key}`, spellcheck: "true", lang: "en", "aria-describedby": `wt-wc-${key}` });
    const lbl = h("label", { for: ta.id, class: "ie-sr" }, label || "Жауап мәтіні");
    const wc = h("span", { class: "ie-wc", id: `wt-wc-${key}`, "aria-live": "polite" }), meter = h("span", { class: "ie-meter", "aria-hidden": "true" }, h("i"));
    const tEl = h("span", { class: "lab-timer", role: "timer", "aria-label": "Таймер" }, I.fmt(minutes * 60));
    const saved = h("span", { class: "lab-meta", "aria-live": "polite" });
    const tm = I.timer(tEl, { seconds: minutes * 60, lowAt: 180, onEnd: () => { tBtn.textContent = "Қайта бастау"; saved.textContent = `${minutes} минут өтті - емтиханда келесі тапсырмаға көшер едіңіз. Мәтін тарихқа сақталды.`; snapshot("уақыт бітті"); } });
    const tBtn = h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => { if (tm.running()) { tm.stop(); tBtn.textContent = "Жалғастыру"; } else { if (tm.left() <= 0) tm.reset(); tm.start(); tBtn.textContent = "Тоқтата тұру"; } } }, `${minutes} мин таймер`);
    const hist = h("ol", { class: "ie-hist", "aria-label": "Нұсқалар тарихы" }), diff = h("div", { class: "ie-diff", hidden: true, "aria-live": "polite" });
    const H = store.get(K + ":hist", []);
    ta.value = store.get(K + ":draft", "");
    function count() {
      const n = I.words(ta.value), p = Math.min(100, Math.round(100 * n / target));
      wc.textContent = `${n} сөз / кемінде ${target}`; wc.classList.toggle("ok", n >= target);
      meter.style.setProperty("--p", p + "%"); meter.classList.toggle("ok", n >= target);
      return n;
    }
    function snapshot(why) {
      const text = ta.value; if (!text.trim() || (H[0] && H[0].text === text)) return false;
      H.unshift({ t: Date.now(), text, wc: I.words(text), why }); if (H.length > 30) H.length = 30;
      store.set(K + ":hist", H); paintHist(); return true;
    }
    function paintHist() {
      hist.textContent = "";
      if (!H.length) { hist.append(h("li", null, h("span", null, "Әзірге сақталған нұсқа жоқ. «Нұсқа сақтау» не 2 минут сайынғы автосақтау тізімге қосады."))); return; }
      H.forEach((v) => hist.append(h("li", null, h("span", null, `${new Date(v.t).toLocaleString("kk-KZ", { dateStyle: "short", timeStyle: "short" })} · ${v.wc} сөз${v.why ? " · " + v.why : ""}`),
        h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => showDiff(v) }, "Қазіргімен салыстыру"),
        h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => { snapshot("қалпына келтіру алдында"); ta.value = v.text; save(); diff.hidden = true; saved.textContent = "Нұсқа қалпына келтірілді (алдыңғы мәтін тарихқа сақталды)."; } }, "Қалпына келтіру"))));
    }
    function showDiff(v) {
      const a = v.text.split(/\s+/).filter(Boolean), b = ta.value.split(/\s+/).filter(Boolean);
      const n = a.length, m = b.length;
      if (n * m > 1.5e6) { diff.hidden = false; diff.textContent = "Мәтін тым ұзын - салыстыру мүмкін емес."; return; }
      const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
      for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      diff.textContent = ""; diff.hidden = false;
      let i = 0, j = 0, add = 0, del = 0;
      const out = h("p", { lang: "en" });
      while (i < n || j < m) {
        if (i < n && j < m && a[i] === b[j]) { out.append(a[i] + " "); i++; j++; }
        else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) { out.append(h("ins", null, b[j]), " "); j++; add++; }
        else { out.append(h("del", null, a[i]), " "); i++; del++; }
      }
      diff.append(h("p", { class: "lab-meta" }, `Таңдалған нұсқадан қазіргіге: +${add} сөз қосылды, −${del} сөз алынды (сызылған).`), out);
    }
    let tid = 0;
    function save() { store.set(K + ":draft", ta.value); saved.textContent = "Автосақталды " + new Date().toLocaleTimeString("kk-KZ", { hour: "2-digit", minute: "2-digit" }); count(); if (onChange) onChange(ta.value); }
    ta.addEventListener("input", () => { count(); clearTimeout(tid); tid = setTimeout(save, 500); });
    setInterval(() => { if (snapshot("автосақтау")) saved.textContent = "Нұсқа тарихқа автоматты қосылды."; }, 120000);
    mount.append(lbl, ta, h("div", { class: "ie-edbar" }, wc, meter, tEl, tBtn),
      h("div", { class: "ie-edbar" }, h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => { saved.textContent = snapshot("қолмен") ? "Нұсқа сақталды." : "Өзгеріс жоқ - жаңа нұсқа қажет емес."; } }, "Нұсқа сақтау"), saved),
      h("details", { class: "ie-note" }, h("summary", null, "Нұсқалар тарихы және салыстыру"), hist, diff));
    count(); paintHist();
    return { ta, get value() { return ta.value; }, set value(v) { ta.value = v; save(); }, count, snapshot, history: () => H.slice() };
  }

  /** Ресми критерий атауларымен рефлексия (баға қойылмайды). list = [{c, q:[...]}] */
  function checklist(mount, list, key) {
    const K = "wt:" + key + ":chk";
    const S = store.get(K, {});
    const wrap = h("div", { class: "ie-crit" });
    list.forEach((c, ci) => {
      const ul = h("ul", { class: "ie-chk" });
      c.q.forEach((q, qi) => {
        const id = `wt-${key}-c${ci}-${qi}`;
        const cb = h("input", { type: "checkbox", id, checked: !!S[id] });
        cb.addEventListener("change", () => { S[id] = cb.checked; store.set(K, S); });
        ul.append(h("li", null, cb, h("label", { for: id }, q)));
      });
      wrap.append(h("fieldset", null, h("legend", { lang: "en" }, c.c), ul));
    });
    mount.append(wrap);
    return () => Object.fromEntries(list.map((c, ci) => [c.c, c.q.map((q, qi) => ({ q, done: !!S[`wt-${key}-c${ci}-${qi}`] }))]));
  }

  /** Ереже нәтижелері: R = [["ok"|"no"|"info", мәтін], ...] */
  function rules(out, R, title, why) {
    out.textContent = "";
    I.feedback(out, R.some((r) => r[0] === "no") ? "bad" : "ok", title, why);
    out.append(h("ul", { class: "ie-rules" }, ...R.map(([k, x]) => h("li", { class: k }, x))));
  }

  /** Экспорт батырмалары: getBundle() -> объект, toText(b) -> жол */
  function exporter(mount, { name, getBundle, toText }) {
    const msg = h("p", { class: "lab-meta", "aria-live": "polite" });
    const stamp = () => new Date().toISOString().slice(0, 10);
    mount.append(h("div", { class: "lab-row" },
      h("button", { type: "button", class: "btn", onclick: () => { I.download(`ao17-${name}-${stamp()}.txt`, toText(getBundle()), "text/plain"); msg.textContent = "TXT файлы жүктелді. Оны мұғаліміңізге өзіңіз жіберіңіз (пошта, мессенджер)."; } }, "Мұғалімге: .txt жүктеу"),
      h("button", { type: "button", class: "btn secondary", onclick: () => { I.download(`ao17-${name}-${stamp()}.json`, JSON.stringify(getBundle(), null, 2), "application/json"); msg.textContent = "JSON файлы жүктелді (мұғалім құралдарына арналған толық деректер)."; } }, ".json жүктеу")), msg);
  }
  const ckText = (o) => Object.entries(o).map(([c, qs]) => `  ${c}:\n` + qs.map((x) => `    [${x.done ? "x" : " "}] ${x.q}`).join("\n")).join("\n");

  /** Бірнеше нұсқалы таңдау (lab-choice): opts = [{t, ok, why}] → onPick(opt) */
  function choice(opts, label, onPick) {
    const grp = h("div", { class: "lab-choice", role: "group", "aria-label": label });
    opts.forEach((o) => grp.append(h("button", { type: "button", "aria-pressed": "false", lang: "en", onclick: (e) => {
      [...grp.children].forEach((b) => b.setAttribute("aria-pressed", String(b === e.currentTarget)));
      onPick(o, e.currentTarget);
    } }, o.t)));
    return grp;
  }

  window.IELTS_WT = { editor, checklist, rules, exporter, ckText, choice };
})();
