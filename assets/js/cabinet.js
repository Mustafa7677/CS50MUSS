/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. Harvard CS50 материалдары мен үшінші тарап компоненттері өз лицензияларымен қалады. */
/* CS50 қазақша: «Менің кабинетім» - прогресс, статистика, жетістіктер, жеке рекордтар.
   Барлық сан - осы құрылғыдағы нақты деректен (localStorage). Басқа адамдармен рейтинг ЖОҚ (сервер жоқ): жеке рекордтар ғана. */
(function () {
  /* main.js window.CS50KZ-ді DOMContentLoaded ішінде жасайды: defer-скрипт одан ерте жүреді, сондықтан іске қосуды күтеміз */
  const start = function () {
  const K = window.CS50KZ;
  const box = document.querySelector(".cabinet");
  if (!K || !box) return;
  const esc = K.escapeHtml;
  const GAMES = { runner: ["🎮", "Code Runner"], bughunt: ["🐛", "Bug Hunter"], battle: ["⚔️", "Code Battle"], algo: ["🧠", "Algorithm Race"], sqlescape: ["🗄️", "SQL Escape Room"], memory: ["💻", "Memory Master"], webbuilder: ["🌐", "Web Builder"], binary: ["🔢", "Binary Challenge"], oracle: ["🔮", "Output Oracle"], enmatch: ["🔗", "Word Match"], enspell: ["🔤", "Spell It"], enbuild: ["🧱", "Sentence Builder"], enarticle: ["🅰️", "Article Rush"], enbugfix: ["🛠️", "Bug Report Fixer"] };
  const level = (xp) => Math.floor(Math.sqrt(xp / 40)) + 1;

  function draw() {
    const s = K.summary();
    const g = K.readJson("cs50kz:games", {});
    const xp = Object.values(g).reduce((n, x) => n + (x.xp || 0), 0);
    const plays = Object.values(g).reduce((n, x) => n + (x.plays || 0), 0);
    const lv = level(xp), base = 40 * (lv - 1) ** 2, next = 40 * lv ** 2;
    const pct = Math.round(((xp - base) / (next - base)) * 100);
    const ach = K.achievements();
    const done = ach.filter((a) => a.done);
    const read = (s.r || "").split("").filter((c) => c === "1").length;
    const rows = Object.keys(GAMES).map((id) => {
      const x = g[id] || {};
      return `<tr><td>${GAMES[id][0]} ${esc(GAMES[id][1])}</td><td>${x.best || "-"}</td><td>${x.plays || 0}</td></tr>`;
    }).join("");
    box.innerHTML = `
      <div class="cab-hero"><div class="cab-level" aria-label="Деңгей ${lv}"><b>${lv}</b><span>деңгей</span></div>
        <div class="cab-xp"><p><b>${xp}</b> XP · келесі деңгейге ${Math.max(0, next - xp)} XP қалды</p>
          <div class="g-bar" role="progressbar" aria-label="Келесі деңгейге дейінгі прогресс" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%;background:var(--c1,#087a96)"></i></div></div></div>
      <div class="cab-stats">
        <div><b>${read}</b><span>лекция оқылды</span></div><div><b>${s.t || 0}</b><span>тапсырма орындалды</span></div>
        <div><b>🔥 ${s.s || 0}</b><span>күн қатарынан</span></div><div><b>${done.length}/${ach.length}</b><span>жетістік</span></div>
        <div><b>${plays}</b><span>ойын ойналды</span></div><div><b>${s.e == null ? "-" : s.e + "%"}</b><span>емтихан рекорды</span></div></div>
      <h2>Жетістіктер</h2>
      <ul class="cab-ach">${ach.map((a) => `<li class="${a.done ? "done" : ""}" title="${esc(a.desc)}"><span aria-hidden="true">${a.ico}</span><b>${esc(a.name)}</b><small>${a.done ? "алынды" : a.cur + "/" + a.goal}</small></li>`).join("")}</ul>
      <h2>Ойындардағы жеке рекордтарым</h2>
      <div class="table-wrap"><table class="cab-table"><thead><tr><th>Ойын</th><th>Рекорд</th><th>Ойын саны</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="cab-note">Бұл құрылғыдағы нақты деректер. Басқа құрылғыға көшіру үшін төмендегі «профиль» бөлімін қолданыңыз. <a href="games.html">Ойындарға өту →</a></p>`;
  }
  draw();
  document.addEventListener("cs50kz:games", draw);
};
  if (window.CS50KZ) start(); else document.addEventListener("DOMContentLoaded", start);
})();
