/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
// AO17 CS тапсырмалары (supabase/platform.sql: ao_assignments; docs/PLATFORM.md): орындалғаны оқушының прогресінен есептеледі.
//  * сабақ (kind "lesson", target - сабақ id, мысалы «ao17-foundation.m01.l02»): «cs50kz:academy».lessons[id].mastered - меңгерілген уақыты;
//  * сынақ (kind "test", target - режим w1…w12, p1, p2, final): «ao17cs:exam»[режим].best ≥ 70 (өту шегі, tools/academy/ao17exam.py).
// Күйі: done - орындады; late - мерзімнен кейін орындады; pending - әлі орындамады; overdue - мерзімі өтті.
// Мұғалімде дерек - класс мүшелерінің бұлттағы снимогы (ao_admin_members), оқушыда - өз браузері. Таза функциялар (DOM жоқ).
(function () {
  "use strict";
  const PASS = 70;
  const TESTS = ["w1", "w2", "w3", "w4", "w5", "w6", "w7", "w8", "w9", "w10", "w11", "w12", "p1", "p2", "final"];
  const STATE = { done: "Орындады", late: "Кешігіп орындады", pending: "Орындалмаған", overdue: "Мерзімі өтті" };
  const testLabel = (m) => (m === "p1" ? "1-бөлім емтиханы" : m === "p2" ? "2-бөлім емтиханы" : m === "final" ? "Қорытынды емтихан" : `${m.slice(1)}-апта сынағы`);
  const LESSON = /^ao17-foundation\.m(0[1-9]|1[0-2])\.l(0[1-9]|10)$/;
  const valid = (a) => !!a && ((a.kind === "lesson" && LESSON.test(a.target)) || (a.kind === "test" && TESTS.includes(a.target)));

  // Сілтеме (сайт түбіріне қатысты): сабақ беті не сынақ режимі; мұғалімге - сабақтың жоспары (ҚМЖ)
  function href(a) {
    if (!valid(a)) return "";
    if (a.kind === "lesson") { const [, m, l] = a.target.split("."); return `academy/${m}/${l}.html`; }
    const m = a.target;
    return m === "final" ? "academy/exam.html" : m === "p1" ? "academy/exam.html?part=1" : m === "p2" ? "academy/exam.html?part=2" : `academy/exam.html?w=${m.slice(1)}`;
  }
  function planHref(a) {
    if (!valid(a) || a.kind !== "lesson") return "";
    const [, m, l] = a.target.split(".");
    return `academy/teach/${m}.html#${l}`;
  }
  const lessonOf = (path) => { const m = /^academy\/(m(?:0[1-9]|1[0-2]))\/(l(?:0[1-9]|10))\.html$/.exec(path || ""); return m ? `ao17-foundation.${m[1]}.${m[2]}` : null; };

  // Дерек: {academy: {id: {mastered, score}}, exam: {режим: {best, at, bestAt, runs}}}
  const obj = (x) => (x && typeof x === "object" && !Array.isArray(x) ? x : {});
  function fromData(d) {
    d = obj(d);
    const acad = obj(d["cs50kz:academy"]);
    return { academy: obj(acad.lessons), exam: obj(d["ao17cs:exam"]) };
  }
  const fromRow = (r) => fromData(r && r.snapshot && r.snapshot.d);
  function fromLocal(storage) {
    const get = (k) => { try { return JSON.parse(storage.getItem(k)); } catch (e) { return null; } };
    return fromData({ "cs50kz:academy": get("cs50kz:academy"), "ao17cs:exam": get("ao17cs:exam") });
  }

  const num = (v) => (v == null || v === "" || !Number.isFinite(+v) ? null : +v);
  const time = (v) => (typeof v === "number" ? v : Date.parse(v) || null);
  function status(a, data, now) {
    data = data || { academy: {}, exam: {} };
    let done = false, at = null, score = null;
    if (valid(a) && a.kind === "lesson") {
      const r = obj(data.academy[a.target]);
      done = !!r.mastered;
      at = done ? time(r.mastered) : null;
      score = num(r.score);
    } else if (valid(a)) {
      const x = obj(data.exam[a.target]);
      score = num(x.best);
      done = score != null && score >= PASS;
      at = done ? time(x.bestAt || x.at) : null;
    }
    const due = a && a.due_at ? Date.parse(a.due_at) : null;
    const state = done ? (due && at && at > due ? "late" : "done") : (due && now > due ? "overdue" : "pending");
    return { state, label: STATE[state], score: score == null ? null : Math.max(0, Math.min(100, Math.round(score))), at };
  }

  function summary(a, rows, now) {
    const out = { total: rows.length, done: 0, late: 0, pending: 0, overdue: 0 };
    rows.forEach((r) => { out[status(a, fromRow(r), now).state]++; });
    return out;
  }

  window.AO17Assign = { PASS, TESTS, STATE, testLabel, valid, href, planHref, lessonOf, fromData, fromRow, fromLocal, status, summary };
})();
