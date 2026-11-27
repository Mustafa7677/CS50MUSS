/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
// AO17 CS нәтижелері және пилот есебі: оқушылардың бұлттағы снимогынан (ao_progress.snapshot.d, ao_admin_members) есептеу.
//  * «ao17cs:exam» (assets/js/ao17-exam.js): {режим: {best, last, at, bestAt, runs, first, firstAt}}; режимдер w1…w12, p1, p2, final.
//  * «cs50kz:academy» (assets/js/academy.js): меңгерілген сабақтар (AO17 CS 1-бөлімі - «ao17-foundation.»).
// Пилот есебі (docs/BUSINESS-PLAN.md, 6-бөлім; docs/AO17-CS-PILOT.md): бастапқы деңгей - сынақтың алғашқы әрекеті, қорытынды -
// ең соңғы әрекеті (кемінде екі әрекет болса). Сынып бойынша екеуі де бар оқушылар алынады: орташа айырма және нормаланған өсім
// g = (қорытындының орташасы − бастапқының орташасы) / (100 − бастапқының орташасы).
// Таза функциялар (DOM жоқ): ao-ui.js қолданады, tests/e2e/ao17-results.spec.js тексереді.
(function () {
  "use strict";
  const MODES = ["w1", "w2", "w3", "w4", "w5", "w6", "w7", "w8", "w9", "w10", "w11", "w12", "p1", "p2", "final"];
  const label = (m) => (m === "p1" ? "1-бөлім емтиханы" : m === "p2" ? "2-бөлім емтиханы" : m === "final" ? "Қорытынды емтихан" : `${m.slice(1)}-апта сынағы`);
  const short = (m) => (m === "p1" ? "1-бөлім" : m === "p2" ? "2-бөлім" : m === "final" ? "Қорыт." : `${m.slice(1)}-апта`);
  // Снимок оқушыдан келеді: әр санды қатаң тексереміз
  const pct = (v) => (v == null || v === "" || !Number.isFinite(+v) ? null : Math.max(0, Math.min(100, Math.round(+v))));
  const round1 = (v) => Math.round(v * 10) / 10;

  function ofRow(r) {
    const d = (r && r.snapshot && r.snapshot.d) || {};
    const raw = d["ao17cs:exam"];
    const ex = {};
    if (raw && typeof raw === "object") {
      MODES.forEach((m) => {
        const x = raw[m];
        if (!x || typeof x !== "object") return;
        ex[m] = { best: pct(x.best), last: pct(x.last), first: pct(x.first), runs: Math.max(0, Math.round(+x.runs || 0)) };
      });
    }
    const acad = d["cs50kz:academy"];
    const ls = acad && typeof acad === "object" && acad.lessons && typeof acad.lessons === "object" ? acad.lessons : {};
    const mastered = Object.keys(ls).filter((id) => /^ao17-foundation\./.test(id) && ls[id] && ls[id].mastered).length;
    return { name: String((r && (r.display_name || r.email)) || "").slice(0, 80), ex, mastered };
  }

  function used(rows) {
    const S = rows.map(ofRow);
    return MODES.filter((m) => S.some((s) => s.ex[m]));
  }

  function active(rows, now, days) {
    return rows.filter((r) => r && r.updated_at && now - Date.parse(r.updated_at) < days * 86400000).length;
  }

  function pilot(rows, mode) {
    const per = rows.map(ofRow).map((s) => {
      const x = s.ex[mode];
      const pre = x ? x.first : null;
      const post = x && x.runs >= 2 ? x.last : null;
      return { name: s.name, pre, post, runs: x ? x.runs : 0, delta: pre != null && post != null ? post - pre : null };
    });
    const both = per.filter((p) => p.delta != null);
    const mean = (a) => (a.length ? a.reduce((n, v) => n + v, 0) / a.length : null);
    const pre = mean(both.map((p) => p.pre)), post = mean(both.map((p) => p.post));
    return {
      mode, per, n: rows.length, took: per.filter((p) => p.runs > 0).length, both: both.length,
      pre: pre == null ? null : round1(pre), post: post == null ? null : round1(post),
      delta: pre == null ? null : round1(post - pre),
      g: pre == null || pre >= 100 ? null : Math.round(((post - pre) / (100 - pre)) * 100) / 100,
    };
  }

  // CSV (Excel үшін «;» және UTF-8 BOM). Ұяшық «=», «+», «-», «@» белгісімен басталса - алдына «'»: Excel формула ретінде орындамайды
  const cell = (v) => {
    let s = String(v == null ? "" : v);
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return /[";\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  function csv(rows) {
    const ms = used(rows);
    const head = ["Оқушы", "Меңгерілген сабақ"].concat(...ms.map((m) => [`${label(m)}: алғашқы, %`, `${label(m)}: соңғы, %`, `${label(m)}: ең жақсы, %`, `${label(m)}: әрекет`]));
    const lines = [head.map(cell).join(";")].concat(rows.map(ofRow).map((s) =>
      [s.name, s.mastered].concat(...ms.map((m) => { const x = s.ex[m]; return x ? [x.first, x.last, x.best, x.runs] : ["", "", "", ""]; })).map(cell).join(";")));
    return "﻿" + lines.join("\r\n") + "\r\n";
  }

  window.AO17Results = { MODES, label, short, ofRow, used, active, pilot, csv };
})();
