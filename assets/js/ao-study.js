/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
   AO17 «Менің оқуым»: үш академияның (CS Universe, IELTS, SAT) ортақ оқушы кабинеті.
   Деректер көзі: CS Universe сабақтары - localStorage «cs50kz:academy» (academy.js), зертханалар - AO17Tutor («ao17:tutor:v1»).
   Сабақтар каталогы build кезінде бетке енгізіледі (#study-data). Бәрі осы браузерде; экспорт/импорт - JSON файл. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const T = window.AO17Tutor;
  const CAT = JSON.parse($("#study-data").textContent);
  const ACAD = { cs: "CS Universe", ielts: "IELTS", sat: "Digital SAT" };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const when = (t) => { const d = Math.round((t - Date.now()) / 86400000); return d <= 0 ? "бүгін" : d === 1 ? "ертең" : `${d} күннен кейін`; };
  const ago = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 60 ? `${Math.max(1, m)} мин бұрын` : m < 1440 ? `${Math.round(m / 60)} сағ бұрын` : `${Math.round(m / 1440)} күн бұрын`; };

  function lessons() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem("cs50kz:academy") || "null"); } catch (e) { d = null; }
    return (d && d.lessons) || {};
  }

  function render() {
    const L = lessons(), ids = Object.keys(CAT);
    const started = ids.filter((id) => L[id]), mastered = started.filter((id) => L[id].mastered);
    const last = started.slice().sort((a, b) => (L[b].seen || 0) - (L[a].seen || 0))[0];
    const next = ids.find((id) => !(L[id] && L[id].mastered));
    const dueLessons = started.filter((id) => L[id].review && Date.now() >= L[id].review.due);
    const sk = T.skills();
    const dueItems = T.due();
    const hard = sk.filter((s) => s.n >= 3 && s.acc < 0.6);
    const byAcad = { cs: [], ielts: [], sat: [] };
    sk.forEach((s) => (byAcad[s.id.split(".")[0]] || byAcad.cs).push(s));
    const title = (id) => (sk.find((x) => x.id === id) || {}).title || id;
    const link = (id) => `<a href="${esc(CAT[id][1])}">${esc(CAT[id][0])}</a>`;
    const skLink = (s) => s.url ? `<a href="${esc(s.url)}">${esc(s.title || s.id)}</a>` : esc(s.title || s.id);

    $("#st-today").innerHTML = (last ? `<p>Соңғы тоқтаған жеріңіз: ${link(last)} <small>(${ago(L[last].seen)})</small></p>` : "<p>Әлі бірде-бір сабақ ашылған жоқ.</p>")
      + (next ? `<p class="st-next">Келесі сабақ: ${link(next)}</p>` : "<p>Барлық дайын сабақ меңгерілді.</p>")
      + `<ul class="st-kpi"><li><b>${mastered.length}</b><span>меңгерілген сабақ / ${ids.length}</span></li><li><b>${started.length - mastered.length}</b><span>басталған</span></li><li><b>${dueLessons.length + dueItems.length}</b><span>бүгін қайталау</span></li><li><b>${T.notebook().length}</b><span>дәптердегі қате</span></li></ul>`;

    const rev = dueLessons.map((id) => `<li>${link(id)} <small>сабақ, мерзімі келді</small></li>`)
      .concat(dueItems.slice(0, 20).map((r) => { const s = sk.find((x) => x.id === r.skill) || { id: r.skill }; return `<li>${skLink(s)} <small>${esc(r.item || "")} · ${when(r.due)}</small></li>`; }));
    const soon = Object.values(JSON.parse(T.exportJSON()).review || {}).filter((r) => r.due > Date.now()).sort((a, b) => a.due - b.due).slice(0, 8);
    $("#st-review").innerHTML = (rev.length ? `<ul class="st-list">${rev.join("")}</ul>` : "<p>Бүгін қайталайтын ештеңе жоқ.</p>")
      + (soon.length ? `<p class="ac-note">Алдағы қайталау: ${soon.map((r) => `${esc(title(r.skill))} - ${when(r.due)}`).join("; ")}.</p>` : "");

    $("#st-skills").innerHTML = Object.entries(byAcad).map(([k, list]) => `<div class="st-acad"><h3>${ACAD[k]}</h3>${list.length
      ? `<ul class="st-list">${list.sort((a, b) => a.acc - b.acc).map((s) => `<li class="st-${s.level === "меңгерілді" ? "ok" : "mid"}">${skLink(s)} <small>${s.level} · ${s.n} әрекет · ${Math.round(s.acc * 100)}%</small></li>`).join("")}</ul>`
      : '<p class="ac-note">Бұл академияның зертханаларында әлі әрекет жоқ.</p>'}</div>`).join("");

    $("#st-hard").innerHTML = hard.length ? `<ul class="st-list">${hard.map((s) => `<li>${skLink(s)} <small>дәлдік ${Math.round(s.acc * 100)}% (${s.n} әрекет)</small></li>`).join("")}</ul>` : "<p>Қиындық тудыратын ұғым әзірге жоқ (кемінде 3 әрекет және дәлдік 60%-дан төмен болса, осында шығады).</p>";

    const nb = T.notebook().slice(0, 40);
    $("#st-notebook").innerHTML = nb.length ? `<ol class="st-nb">${nb.map((m) => { const s = sk.find((x) => x.id === m.skill) || { id: m.skill }; return `<li><p>${skLink(s)} <small>${ago(m.t)}${m.item ? " · " + esc(m.item) : ""}</small></p>${m.note ? `<p>${esc(m.note)}</p>` : ""}<p class="st-err">қате түрі: <code>${esc(m.error)}</code></p></li>`; }).join("")}</ol>` : "<p>Қателер дәптері бос. Зертханаларда қате жауап берсеңіз, оның себебі осында сақталады - кейін қайта қарауға.</p>";

    const hist = JSON.parse(T.exportJSON()).log.slice(0, 15);
    $("#st-history").innerHTML = hist.length ? `<ol class="st-list">${hist.map((h) => `<li>${esc(title(h.skill))} <small>${h.ok ? (h.hints ? "дұрыс, көмекпен" : "дұрыс") : "қате"} · ${ago(h.t)}</small></li>`).join("")}</ol>` : "<p>Тарих бос.</p>";
  }

  // ---------- экспорт / импорт ----------
  $("#st-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ ao17: 1, academy: localStorage.getItem("cs50kz:academy"), tutor: T.exportJSON(), at: new Date().toISOString() })], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "ao17-progress.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $("#st-import").addEventListener("change", async (e) => {
    const f = e.target.files[0], msg = $("#st-msg");
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (d.ao17 !== 1) throw new Error("бұл AO17 прогресс файлы емес");
      if (d.tutor) T.importJSON(d.tutor);
      if (d.academy) localStorage.setItem("cs50kz:academy", d.academy);
      msg.textContent = "Прогресс жүктелді."; render();
    } catch (err) { msg.textContent = "Файл жүктелмеді: " + err.message; }
    e.target.value = "";
  });
  $("#st-clear").addEventListener("click", () => {
    if (!confirm("Зертханалардағы прогресс пен қателер дәптері өшірілсін бе? (CS Universe сабақтарының прогресі сақталады.) Алдымен экспорт жасауды ұсынамыз.")) return;
    T.clear(); render();
  });
  T.onChange(render);
  render();
})();
