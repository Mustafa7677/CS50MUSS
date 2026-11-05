/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
   AO17 Smart Tutor - ережеге негізделген (AI емес) ортақ ядро: CS Universe, IELTS, SAT зертханаларының бәрі осыны қолданады.
   - Mastery Engine: дағды бойынша соңғы әрекеттер. «Меңгерілді» = соңғы 3 әрекет көмексіз дұрыс және жалпы дәлдік ≥ 80%.
   - Үш деңгейлі көмек: 1) бағыт, 2) ұқсас мысал, 3) қадамдық шешім. Шешімді көрген соң бұл есеп меңгеруге саналмайды -
     зертхана жаңа есеп береді (onSolution).
   - Қателер дәптері: қате түрімен (errorType) және түсіндірмемен сақталады.
   - Аралықпен қайталау: Лейтнер қораптары 1, 2, 4, 8, 16 күн. Көмексіз дұрыс -> келесі қорап; қате -> 1-қорап.
   - Деректер тек осы браузерде (localStorage «ao17:tutor:v1»); экспорт/импорт JSON арқылы.
   Бұл модуль ешқандай сыртқы қызметке жүгінбейді және өзін «жасанды интеллект» деп сипаттамайды. */
(() => {
  "use strict";
  const KEY = "ao17:tutor:v1", DAY = 86400000, BOX = [1, 2, 4, 8, 16];
  const empty = () => ({ v: 1, skills: {}, mistakes: [], review: {}, log: [] });
  let mem = null;
  function load() {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY)) || empty(); } catch (e) { mem = empty(); }
    if (!mem.skills) mem = empty();
    return mem;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* жеке режим: жадта қалады */ } emit(); }
  const subs = new Set();
  function emit() { subs.forEach((f) => { try { f(mem); } catch (e) { /* тыңдаушы қатесі */ } }); }

  /** Әрекетті тіркеу. skill - «sat.math.quadratic.vertex» сияқты id; ok - дұрыс па; hints - қолданылған көмек саны (0-3);
      error - қате түрінің коды (мыс. «sign-h»); note - оқушыға көрсетілген түсіндірме. */
  function record(skill, { item = "", ok, hints = 0, error = "", note = "", title = "", url = "" } = {}) {
    const S = load(), now = Date.now();
    const sk = S.skills[skill] || (S.skills[skill] = { title: title || skill, tries: [], n: 0, ok: 0 });
    if (title) sk.title = title;
    if (url) sk.url = url;
    else if (!sk.url && typeof location !== "undefined" && location.pathname) sk.url = location.pathname.replace(/^.*?\/academy\//, "");
    const unaided = ok && hints === 0;
    sk.tries.push(ok ? (hints ? "h" : "1") : "0");
    if (sk.tries.length > 20) sk.tries.shift();
    sk.n++; if (ok) sk.ok++;
    sk.last = now;
    if (!ok && error) S.mistakes.unshift({ skill, item, error, note, t: now });
    if (S.mistakes.length > 200) S.mistakes.length = 200;
    const key = skill + "|" + item;
    const r = S.review[key] || { box: 0 };
    r.box = unaided ? Math.min(BOX.length - 1, r.box + (r.seen ? 1 : 0)) : 0;
    r.seen = true; r.skill = skill; r.item = item; r.due = now + BOX[r.box] * DAY;
    S.review[key] = r;
    S.log.unshift({ skill, ok, hints, t: now });
    if (S.log.length > 300) S.log.length = 300;
    save();
    return mastery(skill);
  }
  function mastery(skill) {
    const sk = load().skills[skill];
    if (!sk) return { level: "жаңа", acc: 0, n: 0, streak: 0 };
    const last3 = sk.tries.slice(-3), acc = sk.ok / sk.n;
    let streak = 0;
    for (let i = sk.tries.length - 1; i >= 0 && sk.tries[i] === "1"; i--) streak++;
    const level = last3.length === 3 && last3.every((x) => x === "1") && acc >= 0.8 ? "меңгерілді" : sk.n ? "үйренуде" : "жаңа";
    return { level, acc, n: sk.n, streak, title: sk.title, url: sk.url || "" };
  }
  const due = (now = Date.now()) => Object.values(load().review).filter((r) => r.due <= now).sort((a, b) => a.due - b.due);
  const notebook = () => load().mistakes.slice();
  const skills = () => Object.entries(load().skills).map(([id, s]) => ({ id, ...mastery(id) }));

  /** Үш деңгейлі көмек батырмасы. hints = [бағыт, ұқсас мысал, қадамдық шешім] (HTML рұқсат етілмейді - мәтін).
      Қайтарады: { used(), reset() }. Үшінші деңгейден кейін onSolution шақырылады (жаңа есеп беру үшін). */
  function hints(el, list, { onSolution } = {}) {
    const NAMES = ["1-көмек: бағыт", "2-көмек: ұқсас мысал", "3-көмек: қадамдық шешім"];
    let k = 0;
    el.classList.add("tt-hints");
    el.innerHTML = `<button type="button" class="tt-hbtn">Көмек керек</button><ol class="tt-hlist" aria-live="polite"></ol>`;
    const btn = el.querySelector("button"), ol = el.querySelector("ol");
    const paint = () => {
      ol.innerHTML = "";
      list.slice(0, k).forEach((h, i) => { const li = document.createElement("li"); li.className = "tt-h" + (i + 1); const b = document.createElement("b"); b.textContent = NAMES[i] + ". "; li.append(b, document.createTextNode(h)); ol.append(li); });
      btn.textContent = k >= list.length ? "Көмектің бәрі ашылды" : k ? `Келесі көмек (${k + 1}/${list.length})` : "Көмек керек";
      btn.disabled = k >= list.length;
    };
    btn.addEventListener("click", () => { if (k < list.length) { k++; paint(); if (k === list.length && onSolution) onSolution(); } });
    paint();
    return { used: () => k, reset(next) { if (next) list = next; k = 0; paint(); } };
  }

  /** Жауапқа кері байланыс: «қате» деп қана емес, себебін айтады. kind: ok | bad | info */
  function feedback(el, kind, title, why) {
    el.className = "tt-fb tt-" + kind;
    el.setAttribute("role", "status");
    el.innerHTML = "";
    const b = document.createElement("b"); b.textContent = title;
    el.append(b);
    if (why) { const p = document.createElement("p"); p.textContent = why; el.append(p); }
  }

  /** Меңгеру белгісі (дағды деңгейі) - зертхананың басындағы шағын жолақ. */
  function badge(el, skill, title) {
    const paint = () => {
      const m = mastery(skill);
      el.className = "tt-badge tt-" + (m.level === "меңгерілді" ? "ok" : m.level === "үйренуде" ? "mid" : "new");
      el.textContent = `${title || m.title || skill}: ${m.level}` + (m.n ? ` · ${m.n} әрекет, дәлдік ${Math.round(m.acc * 100)}%` : "");
    };
    paint(); subs.add(paint);
    return paint;
  }

  const exportJSON = () => JSON.stringify(load(), null, 1);
  function importJSON(text) {
    const d = JSON.parse(text);
    if (!d || d.v !== 1 || typeof d.skills !== "object") throw new Error("Файл AO17 Tutor форматында емес");
    mem = { ...empty(), ...d }; save();
  }
  function clear() { mem = empty(); save(); }

  window.AO17Tutor = { record, mastery, due, notebook, skills, hints, feedback, badge, exportJSON, importJSON, clear, onChange: (f) => subs.add(f), _key: KEY };
})();
