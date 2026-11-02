/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
// AO17 жабық бет қабығы (тек dist нұсқасында, tools/gate.py жасайды).
// GitHub Pages-те жабық беттің орнында тек осы қабық тұрады: мазмұнның өзі жабық Storage-та.
// Қабық ao-content функциясынан бетті сұрайды; функция рұқсатты дерекқордан (ao_can_view) тексереді.
// Бұл файлды өзгерту ештеңе ашпайды: рұқсатсыз сұраққа сервер 401/403 қайтарады.
(function () {
  const me = document.currentScript;
  const path = me && me.dataset.path;
  const ROOT = me ? me.src.replace(/assets\/js\/ao-gate\.js.*$/, "") : new URL(".", location.href).href;
  const GATED = window.AO_GATED || [];
  const box = () => document.querySelector(".ao-gate-msg");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function say(html) { const b = box(); if (b) b.innerHTML = html; }

  // Бет ішіндегі жабық дерек файлдарының <script src> сілтемелерін blob URL-ға ауыстыру
  async function inlineGated(html) {
    const re = /<script\b([^>]*?)\ssrc="([^"]+)"([^>]*)><\/script>/g;
    const jobs = [];
    html.replace(re, (all, a, src) => {
      let rel;
      try { const u = new URL(src, location.href); rel = u.href.startsWith(ROOT) ? u.href.slice(ROOT.length).split(/[?#]/)[0] : null; } catch (e) { rel = null; }
      if (rel && GATED.indexOf(rel) >= 0) jobs.push([src, window.AO.gatedScriptUrl(rel)]);
      return all;
    });
    const urls = await Promise.all(jobs.map((j) => j[1]));
    const map = {}; jobs.forEach((j, i) => (map[j[0]] = urls[i]));
    return html.replace(re, (all, a, src, b) => (map[src] ? `<script${a} src="${map[src]}"${b}></script>` : all));
  }

  async function run() {
    if (!path || !window.AO) return say("<p>Бет жүктелмеді.</p>");
    if (!window.AO.hasSession()) return toLogin();
    let html;
    try { html = await window.AO.fetchGated(path); }
    catch (e) {
      if (e.status === 401) return toLogin();
      if (e.status === 403) return say(`<h1>Бұл бет әлі ашылмаған</h1><p>Мұғалім бұл сабақты сіздің класыңызға ашқан кезде осы жерде көрінеді.</p><p><a class="btn" href="${ROOT}student.html">Менің кабинетім</a></p>`);
      return say(`<h1>Бет жүктелмеді</h1><p>${esc(e.message || e)}</p><p><button class="btn" type="button" onclick="location.reload()">Қайталау</button></p>`);
    }
    try { html = await inlineGated(html); }
    catch (e) { return say("<h1>Бет толық жүктелмеді</h1><p>Беттің кейбір бөлігі сізге әлі ашылмаған.</p>"); }
    document.open();
    document.write(html);
    document.close();
  }
  function toLogin() {
    location.replace(ROOT + "login.html?next=" + encodeURIComponent(path + location.search + location.hash));
  }
  run();
})();
