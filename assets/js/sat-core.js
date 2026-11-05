/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* Digital SAT Academy: зертханаларға ортақ шағын көмекшілер (сан пішімі, SVG, кездейсоқтық, бөлшектер). */
(() => {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  /** Санды математикалық белгімен жазу: −2, 0.5, 1/2 емес. */
  const num = (n) => {
    if (Object.is(n, -0)) n = 0;
    const r = Math.round(n * 1000) / 1000;
    return (r < 0 ? "−" : "") + String(Math.abs(r));
  };
  const svg = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.append(e);
    return e;
  };
  const h = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
    }
    kids.flat().forEach((c) => c != null && e.append(c));
    return e;
  };
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Бөлшектер: {n, d}, d > 0, қысқартылған. Теңдеулерді дәл шешу үшін (жүзбелі нүктенің қатесінсіз). */
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const F = (n, d = 1) => { if (d === 0) throw new Error("нөлге бөлу"); if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
  const fr = {
    add: (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d),
    sub: (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d),
    mul: (a, b) => F(a.n * b.n, a.d * b.d),
    div: (a, b) => F(a.n * b.d, a.d * b.n),
    eq: (a, b) => a.n === b.n && a.d === b.d,
    zero: (a) => a.n === 0,
    int: (a) => a.d === 1,
    val: (a) => a.n / a.d,
    str: (a) => (a.n < 0 ? "−" : "") + (a.d === 1 ? Math.abs(a.n) : Math.abs(a.n) + "/" + a.d),
    /** «3», «-2», «1/2», «0.5», «−3/4» мәтінін бөлшекке айналдыру; қате болса null. */
    parse(s) {
      s = String(s).trim().replace(/−/g, "-").replace(",", ".");
      let m = s.match(/^(-?)(\d+)\/(\d+)$/);
      if (m) return +m[3] === 0 ? null : F((m[1] ? -1 : 1) * +m[2], +m[3]);
      m = s.match(/^(-?)(\d*)(?:\.(\d+))?$/);
      if (!m || (m[2] === "" && !m[3])) return null;
      const dec = m[3] || "", d = 10 ** dec.length;
      return F((m[1] ? -1 : 1) * (+(m[2] || 0) * d + +(dec || 0)), d);
    },
  };
  /** Фокус + лезде жылжу: сайттың «scroll-behavior: smooth» әсерінен бет фокус кезінде жылжып кетпесін. */
  const focus = (el) => {
    if (!el) return;
    el.focus({ preventScroll: true });
    const r = el.getBoundingClientRect();
    if (r.top < 70 || r.bottom > innerHeight) el.scrollIntoView({ block: "center", behavior: "instant" });
  };
  window.SAT = { num, svg, h, rnd, pick, shuffle, reduced, F, fr, focus };
})();
