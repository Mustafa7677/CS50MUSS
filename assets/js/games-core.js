/* CS50 қазақша: ойындар орталығы. Ойын тіркеу (register), хаб, рекорд/XP сақтау.
   Барлық ойын ӨЗ жазған, интернетсіз, AI API-сіз жұмыс істейді. Деректер тек құрылғыда (localStorage "cs50kz:games"). */
(function () {
  "use strict";
  const KEY = "cs50kz:games";
  const defs = [];
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } };
  const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const sample = (a, n) => shuffle(a).slice(0, n);
  const level = (xp) => Math.floor(Math.sqrt(xp / 40)) + 1;

  function totals() {
    const s = read();
    let xp = 0, plays = 0;
    Object.values(s).forEach((g) => { xp += g.xp || 0; plays += g.plays || 0; });
    return { xp, plays, level: level(xp), games: s };
  }

  /** Ойынды тіркеу: {id, title, icon, color, blurb, how, start(root, ctx)} */
  function register(def) { if (!defs.find((d) => d.id === def.id)) defs.push(def); render(); }

  function record(def, res) {
    const s = read();
    const g = s[def.id] || { best: 0, plays: 0, xp: 0 };
    const score = Math.max(0, Math.round(res.score || 0));
    const isBest = score > (g.best || 0);
    const xp = Math.max(0, Math.min(100, Math.round(res.xp != null ? res.xp : score / 2)));
    g.best = Math.max(g.best || 0, score); g.plays = (g.plays || 0) + 1; g.xp = (g.xp || 0) + xp; g.last = Date.now();
    s[def.id] = g; write(s);
    const K = window.CS50KZ;
    if (K) { try { K.bump("trainer", 1); K.mark("games"); K.mark("game-" + def.id); K.check && K.check(); } catch (e) {} }
    document.dispatchEvent(new CustomEvent("cs50kz:games"));
    return { score, xp, isBest, best: g.best };
  }

  let root = null, current = null;
  function hub() {
    const t = totals();
    const cards = defs.map((d) => {
      const g = t.games[d.id] || {};
      return `<a class="game-card" href="#${d.id}" style="--gc:${d.color || "#087a96"}">
        <span class="gc-ico" aria-hidden="true">${d.icon}</span>
        <span class="gc-title">${esc(d.title)}</span>
        <span class="gc-blurb">${esc(d.blurb)}</span>
        <span class="gc-meta">${g.plays ? `Рекорд: <b>${g.best}</b> · ${g.plays} ойын` : "Әлі ойнамадың"}</span></a>`;
    }).join("");
    root.innerHTML = `<div class="games-stats" role="status"><span>⭐ Деңгей <b>${t.level}</b></span><span>✨ <b>${t.xp}</b> XP</span><span>🎮 <b>${t.plays}</b> ойын</span>
      <a href="profile.html#cabinet">Менің кабинетім →</a></div>
      <div class="games-grid">${cards || "<p>Ойындар жүктелуде…</p>"}</div>
      <p class="games-note">Барлық ойын интернетсіз, тіркелусіз, ақысыз жұмыс істейді. Нәтижелер тек осы құрылғыда сақталады.</p>`;
  }

  function open(id) {
    const def = defs.find((d) => d.id === id);
    if (!def) return hub();
    current = def;
    const t = totals().games[id] || {};
    root.innerHTML = `<div class="game-shell" style="--gc:${def.color || "#087a96"}">
      <div class="game-bar"><a class="game-back" href="#" aria-label="Ойындар тізіміне оралу">← Ойындар</a><h2>${def.icon} ${esc(def.title)}</h2><span class="game-best">Рекорд: <b>${t.best || 0}</b></span></div>
      <div class="game-stage" id="game-stage" tabindex="-1"></div></div>`;
    const stage = root.querySelector("#game-stage");
    const ctx = {
      esc, shuffle, sample, stage,
      /** Ойын аяқталды: {score, xp?, title?, lines?: [string]} */
      finish(res) {
        const r = record(def, res);
        stage.innerHTML = `<div class="game-result"><p class="gr-big">${esc(res.title || "Ойын аяқталды!")}</p>
          <p class="gr-score">Ұпай: <b>${r.score}</b>${r.isBest ? ' <span class="gr-new">🏆 Жаңа рекорд!</span>' : ` · рекорд: ${r.best}`}</p>
          <p class="gr-xp">+${r.xp} XP</p>${(res.lines || []).map((l) => `<p class="gr-line">${esc(l)}</p>`).join("")}
          <div class="gr-actions"><button class="btn gr-again" type="button">Қайта ойнау</button><a class="btn ghost" href="#">Басқа ойын</a></div></div>`;
        stage.querySelector(".gr-again").onclick = () => open(id);
        stage.focus();
        if (r.isBest && window.CS50KZ && window.CS50KZ.celebrate) { try { window.CS50KZ.celebrate(); } catch (e) {} }
        const b = root.querySelector(".game-best b"); if (b) b.textContent = r.best;
      },
    };
    stage.focus();
    try { def.start(stage, ctx); } catch (e) { stage.innerHTML = '<p class="game-err">Ойынды іске қосу мүмкін болмады. Бетті жаңартып көріңіз.</p>'; }
  }

  function route() { if (!root) return; const id = location.hash.replace("#", ""); if (id) open(id); else { current = null; hub(); } }
  function render() { if (!root) return; if (!current) route(); }

  document.addEventListener("DOMContentLoaded", () => {
    root = document.querySelector(".games-root");
    if (!root) return;
    window.addEventListener("hashchange", route);
    route();
  });
  window.CS50Games = { register, totals, esc, shuffle, sample };
})();
