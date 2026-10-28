/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
// Ашық метрикалар (metrics.html): cs50kz_metrics_public жиынтығын көрсетеді. Санақтың өзі: main.js track().

(function () {
  const K = window.CS50KZ;
  const root = document.querySelector(".om");
  if (!root) return;
  const API = "https://fuzkjjfpknnpauykzfip.supabase.co/rest/v1/rpc/cs50kz_metrics_public";
  const KEY = "sb_publishable_Pc_d_L6MuzJI8_Ugs3QZ1Q_LqnRfzk_";
  const AC = { code: "Бағдарламалау", en: "Ағылшын тілі", math: "Математика", site: "Жалпы беттер" };
  const MON = ["қаң", "ақп", "нау", "сәу", "мам", "мау", "шіл", "там", "қыр", "қаз", "қар", "жел"];
  const esc = K.escapeHtml;
  const state = root.querySelector(".om-state");
  const nf = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const iso = (d) => d.toISOString().slice(0, 10);
  const human = (s) => { const [, m, d] = s.split("-"); return `${+d} ${MON[+m - 1]}`; };

  // ---------- Санақты өшіру/қосу (тек осы құрылғыда) ----------
  const toggle = root.querySelector(".om-toggle"), optState = root.querySelector(".om-opt-state");
  function paintOpt() {
    let off = false;
    try { off = localStorage.getItem("cs50kz:noanalytics") === "1"; } catch (e) { off = true; }
    optState.textContent = off ? "Бұл құрылғыда санақ өшірулі." : K.trackingOff() ? "Бұл құрылғыда санақ жүрмейді (браузер баптауы не сайттың көшірмесі)." : "Бұл құрылғыда санақ қосулы.";
    toggle.textContent = off ? "Бұл құрылғыда санақты қосу" : "Бұл құрылғыда санақты өшіру";
  }
  toggle.addEventListener("click", () => {
    try {
      if (localStorage.getItem("cs50kz:noanalytics") === "1") localStorage.removeItem("cs50kz:noanalytics");
      else localStorage.setItem("cs50kz:noanalytics", "1");
    } catch (e) { /* жад жоқ */ }
    paintOpt();
  });
  paintOpt();

  // ---------- Деректер ----------
  function render(rows) {
    const today = new Date(), days = [];
    for (let i = 29; i >= 0; i--) days.push(iso(new Date(today.getTime() - i * 86400000)));
    const sum = (kind, key, from) => rows.filter((r) => r.kind === kind && (key == null || r.key === key) && (!from || r.day >= from)).reduce((a, r) => a + r.n, 0);
    const d7 = days[days.length - 7], d30 = days[0], td = days[days.length - 1];
    const allVisits = sum("visit", "all", d30);
    if (!rows.length || !allVisits) {
      state.innerHTML = "<p><b>Санақ енді басталды.</b> Алғашқы сандар келушілер пайда болғанда осында шығады.</p>";
      return;
    }
    state.hidden = true;
    const set = (m, v) => { root.querySelector(`[data-m="${m}"]`).textContent = v; };
    set("dau", nf(sum("visit", "all", td)));
    set("wau", nf(sum("visit", "all", d7)));
    set("lessons", nf(sum("lesson", null, d30)));
    set("done", nf(sum("done", null, d30)));
    set("ret", Math.round((100 * sum("return", null, d30)) / allVisits) + "%");
    root.querySelector(".om-tiles").hidden = false;

    // Күнделікті бағандар: бір қатар, бір түс; дәл сан - тінтуір/фокус кеңесінде және кестеде
    const per = days.map((d) => ({ d, v: 0, l: 0, o: 0 }));
    per.forEach((p) => {
      p.v = rows.filter((r) => r.day === p.d && r.kind === "visit" && r.key === "all").reduce((a, r) => a + r.n, 0);
      p.l = rows.filter((r) => r.day === p.d && r.kind === "lesson").reduce((a, r) => a + r.n, 0);
      p.o = rows.filter((r) => r.day === p.d && r.kind === "done").reduce((a, r) => a + r.n, 0);
    });
    const max = Math.max(1, ...per.map((p) => p.v));
    root.querySelector(".om-bars").innerHTML = per.map((p) =>
      `<span class="om-bar" style="--h:${Math.max(p.v ? 3 : 0, (100 * p.v) / max)}%" data-tip="${human(p.d)}: ${nf(p.v)}"></span>`).join("");
    root.querySelector(".om-from").textContent = human(days[0]);
    root.querySelector(".om-to").textContent = human(td);
    root.querySelector(".om-table tbody").innerHTML = per.slice().reverse().map((p) =>
      `<tr><td>${human(p.d)}</td><td>${nf(p.v)}</td><td>${nf(p.l)}</td><td>${nf(p.o)}</td></tr>`).join("");
    root.querySelector(".om-chart").hidden = false;

    const ac = Object.keys(AC).map((k) => ({ k, v: sum("visit", k, d30) }));
    const amax = Math.max(1, ...ac.map((a) => a.v));
    root.querySelector(".om-hbars").innerHTML = ac.map((a) =>
      `<li><span class="om-hl">${AC[a.k]}</span><span class="om-ht"><i style="--w:${(100 * a.v) / amax}%"></i></span><b>${nf(a.v)}</b></li>`).join("");
    const top = {};
    rows.filter((r) => r.kind === "lesson" && r.day >= d30).forEach((r) => { top[r.key] = (top[r.key] || 0) + r.n; });
    const list = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 8);
    root.querySelector(".om-top").innerHTML = list.length ? list.map(([k, v]) =>
      `<li><a href="${K.ROOT_URL + esc(k)}">${esc(k)}</a> <span>${nf(v)}</span></li>`).join("") : "<li>Әзірге дерек жоқ.</li>";
    root.querySelector(".om-split").hidden = false;
  }

  if (location.hostname !== "mustafa7677.github.io") {
    state.innerHTML = "<p>Метрикалар сайттың түпнұсқа мекенжайында ғана жүктеледі: <a href=\"https://mustafa7677.github.io/CS50MUSS/metrics.html\">mustafa7677.github.io/CS50MUSS/metrics.html</a>.</p>";
    return;
  }
  fetch(API, { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify({ p_days: 31 }) })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((rows) => render(Array.isArray(rows) ? rows : []))
    .catch(() => { state.innerHTML = "<p><b>Санақ жақында басталады.</b> Бұлттағы метрикалар қызметі әлі қосылмаған.</p>"; });
})();
