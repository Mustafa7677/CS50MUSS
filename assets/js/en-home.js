/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
 * «Ағылшын тілі A0-C1» курс беті (en/index.html): «Бүгін не істеймін» тақтасы, A0 -> C1 деңгей жолы, жалпы прогресс, нәтижелер.
 * Тек осы құрылғының localStorage деректері оқылады (cs50kz:progress, cs50kz:en:ex, cs50kz:en:vocab, cs50kz:en:vstats, cs50kz:en:placement, cs50kz:games).
 * Сабақ карточкалары (.week-card) build.py жасайды; бұл файл оларды өзгертпейді, тек оқиды. Дерек жоқ болса да қате бермейді.
 */
(function () {
  "use strict";
  var LV = ["a0", "a1", "a2", "b1", "b2", "c1"], LVN = ["A0", "A1", "A2", "B1", "B2", "C1"];
  var LVT = ["Бастау", "Негіз", "Қарапайым қарым-қатынас", "Өз бетінше қолдану", "Еркін жұмыс", "Кәсіби деңгей"];
  var LVI = ["🌱", "🌿", "🍀", "🌳", "🚀", "🏔️"];
  var GAMES = [["enmatch", "Word Match"], ["enspell", "Spell It"], ["enbuild", "Sentence Builder"], ["enarticle", "Article Rush"], ["enbugfix", "Bug Report Fixer"]];

  function get(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function obj(x) { return x && typeof x === "object" && !Array.isArray(x) ? x : {}; }
  function h(tag, attrs) {
    var e = document.createElement(tag), kids = Array.prototype.slice.call(arguments, 2);
    for (var k in attrs || {}) {
      var v = attrs[k];
      if (v === false || v == null) continue;
      if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else e.setAttribute(k, v === true ? "" : v);
    }
    (function add(list) { list.forEach(function (c) { if (c == null || c === false) return; if (Array.isArray(c)) add(c); else e.append(c.nodeType ? c : document.createTextNode(c)); }); })(kids);
    return e;
  }
  function dkey(t) { var d = new Date(t); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }

  function collect() {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".week-card[data-id]")), lessons = [];
    cards.forEach(function (c) {
      var m = /^week-(\d+)$/.exec(c.getAttribute("data-id") || ""); if (!m) return;
      var n = +m[1], num = c.querySelector(".num"), t = c.querySelector("h3");
      lessons[n] = { n: n, ready: !c.classList.contains("soon"), num: num ? num.textContent : "", title: t ? t.textContent : "", href: "lectures/week-" + n + ".html" };
    });
    for (var i = 0; i < 24; i++) if (!lessons[i]) lessons[i] = { n: i, ready: false, num: LVN[Math.floor(i / 4)] + " · " + (i % 4 + 1) + "-сабақ", title: "", href: "lectures/week-" + i + ".html" };
    var p = obj(get("cs50kz:progress", {})), read = obj(p.read), quiz = obj(p.quiz), ex = obj(get("cs50kz:en:ex", {}));
    var exDone = {};
    Object.keys(ex).forEach(function (k) { var m = /^week-(\d+):/.exec(k); if (m && ex[k] && ex[k].ok) exDone[+m[1]] = (exDone[+m[1]] || 0) + 1; });
    lessons.forEach(function (l) { l.read = !!read["en:week-" + l.n]; l.quiz = quiz["en:week-" + l.n] || null; l.ex = exDone[l.n] || 0; });
    var vocab = obj(get("cs50kz:en:vocab", {})), now = Date.now(), due = 0, learned = 0;
    Object.keys(vocab).forEach(function (k) { var e = vocab[k]; if (!e) return; if (e.m === 1 || e.b >= 4) learned++; if ((e.due || 0) <= now) due++; });
    var vs = obj(get("cs50kz:en:vstats", {})), days = obj(vs.days), goal = vs.goal > 0 ? vs.goal : 10;
    var today = days[dkey(now)] ? days[dkey(now)].n || 0 : 0, t = now, streak = 0;
    if (!(days[dkey(t)] && days[dkey(t)].n > 0)) t -= 86400000;
    while (days[dkey(t)] && days[dkey(t)].n > 0 && streak < 400) { streak++; t -= 86400000; }
    var pl = get("cs50kz:en:placement", null);
    var games = obj(get("cs50kz:games", {})), gp = 0, gbest = 0;
    GAMES.forEach(function (g) { var x = games[g[0]]; if (x) { gp += x.plays || 0; gbest = Math.max(gbest, x.best || 0); } });
    return { lessons: lessons, vocab: { due: due, learned: learned, tracked: Object.keys(vocab).length }, goal: goal, today: today, streak: streak, placement: pl && typeof pl.est === "number" ? pl : null, games: { plays: gp, best: gbest }, last: get("cs50kz:last:en", null) };
  }
  function levelOf(n) { return Math.floor(n / 4); }
  function describePl(r) { return "шамамен " + (r.below ? "A0 (бастау деңгейі)" : LVN[r.est] + (r.upper > r.est ? "-" + LVN[r.upper] : "")); }

  function build(root, D) {
    var L = D.lessons, ready = L.filter(function (l) { return l.ready; }), read = L.filter(function (l) { return l.read; }).length;
    var nextL = L.filter(function (l) { return l.ready && !l.read; })[0] || null;
    if (D.placement && D.placement.rec != null) {
      var rec = ready.filter(function (l) { return !l.read && levelOf(l.n) >= D.placement.rec; })[0];
      if (rec && !read) nextL = rec;
    }
    if (D.last && D.last.id && /^en:week-(\d+)$/.test(D.last.id)) {
      var ln = +D.last.id.split("week-")[1], ll = L[ln];
      if (ll && ll.ready && !ll.read) nextL = ll;
    }

    /* ---- Бүгін не істеймін ---- */
    var next = h("div", { class: "en-tcard en-t-next" },
      h("span", { class: "en-t-k", text: "1 · Келесі сабақ" }),
      nextL ? h("b", { class: "en-t-v", text: nextL.num }) : h("b", { class: "en-t-v", text: ready.length ? "Дайын сабақтардың бәрі оқылды ✓" : "Сабақтар жақында" }),
      h("span", { class: "en-t-s", text: nextL ? nextL.title : ready.length ? "Жаңа сабақтар қосылған сайын осында шығады. Қайталауға сөздікті ашыңыз." : "Әзірше сөздікпен, грамматикамен және ойындармен жаттығуға болады." }),
      nextL ? h("a", { class: "btn gold en-t-go", href: nextL.href }, read ? "Жалғастыру" : "Бастау", h("span", { "aria-hidden": "true", text: " →" })) : h("a", { class: "btn secondary en-t-go", href: "grammar.html", text: "Грамматика" }));
    var due = D.vocab.due;
    var words = h("div", { class: "en-tcard en-t-words" },
      h("span", { class: "en-t-k", text: "2 · Қайталауға келген сөздер" }),
      h("b", { class: "en-t-v", text: due ? due + " сөз" : "Бүгін қайталайтын сөз жоқ" }),
      h("span", { class: "en-t-s", text: "Бүгін: " + D.today + " / " + D.goal + " · серия: 🔥 " + D.streak + " күн" + (D.vocab.learned ? " · жатталған: " + D.vocab.learned : "") }),
      h("div", { class: "en-meter", role: "progressbar", "aria-label": "Бүгінгі сөз мақсаты", "aria-valuemin": "0", "aria-valuemax": String(D.goal), "aria-valuenow": String(Math.min(D.today, D.goal)) }, h("i", { style: "width:" + Math.min(100, Math.round(D.today / D.goal * 100)) + "%" })),
      h("a", { class: "btn en-t-go", href: "vocab.html" }, due ? "Қайталауды бастау" : "Жаңа сөздерді үйрену", h("span", { "aria-hidden": "true", text: " →" })));
    var pl = D.placement;
    var place = h("div", { class: "en-tcard en-t-place" },
      h("span", { class: "en-t-k", text: "3 · Деңгей анықтау тесті" }),
      h("b", { class: "en-t-v", text: pl ? "Алдыңғы нәтиже: " + describePl(pl) : "Деңгейіңізді білмейсіз бе?" }),
      h("span", { class: "en-t-s", text: pl ? "Бұл болжам, ресми деңгей емес. Қайта тапсыруға болады." : "Қысқа тест қай сабақтан бастау керегін болжап береді (болжамды құрал)." }),
      h("a", { class: "btn secondary en-t-go", href: "placement.html" }, pl ? "Қайта тапсыру" : "Тестті бастау", h("span", { "aria-hidden": "true", text: " →" })));
    var today = h("section", { class: "en-today", "aria-labelledby": "en-today-h" }, h("h2", { id: "en-today-h", text: "Бүгін не істеймін?" }), h("div", { class: "en-today-grid" }, next, words, place));

    /* ---- Деңгей жолы ---- */
    var path = h("ol", { class: "en-path-list" });
    for (var lv = 0; lv < 6; lv++) {
      var ls = L.slice(lv * 4, lv * 4 + 4), r = ls.filter(function (l) { return l.ready; }).length, rd = ls.filter(function (l) { return l.read; }).length;
      var exs = ls.reduce(function (n, l) { return n + l.ex; }, 0);
      var status = r === 4 ? "Толық дайын" : r > 0 ? "Дайын: " + r + " / 4" : "Жоспарда";
      var recd = pl && pl.rec === lv;
      var li = h("li", { class: "en-node lv-" + LV[lv] + (r === 4 ? " is-full" : r > 0 ? " is-part" : " is-plan") + (rd === 4 ? " is-read" : "") });
      var a = h("a", { class: "en-node-a", href: "#level-" + LV[lv], "aria-label": LVN[lv] + " " + LVT[lv] + ": " + status + ", оқылған " + rd + " / 4" },
        h("span", { class: "en-node-dot", "aria-hidden": "true" }, h("span", { class: "en-node-ico", text: LVI[lv] }), h("b", { text: LVN[lv] })),
        h("span", { class: "en-node-name", text: LVT[lv] }),
        h("span", { class: "en-node-st", text: status }),
        h("span", { class: "en-node-bar", "aria-hidden": "true" }, h("i", { class: "r", style: "width:" + r * 25 + "%" }), h("i", { class: "d", style: "width:" + rd * 25 + "%" })),
        h("span", { class: "en-node-meta", text: "Оқылған: " + rd + " / 4" + (exs ? " · жаттығу: " + exs : "") }),
        recd ? h("span", { class: "en-node-rec", text: "Тест ұсынысы" }) : null);
      li.append(a); path.append(li);
    }
    var total = L.length, readPct = Math.round(read / total * 100), readyPct = Math.round(ready.length / total * 100);
    var overall = h("div", { class: "en-overall" },
      h("p", { class: "en-overall-t" }, h("b", { text: "Жалпы прогресс: " }), h("span", { text: read + " / " + total + " сабақ оқылды · " + ready.length + " сабақ дайын" })),
      h("div", { class: "en-meter en-meter-big", role: "progressbar", "aria-label": "Курс бойынша оқылған сабақтар", "aria-valuemin": "0", "aria-valuemax": String(total), "aria-valuenow": String(read) }, h("i", { class: "r", style: "width:" + readyPct + "%" }), h("i", { style: "width:" + readPct + "%" })),
      h("p", { class: "en-legend" }, h("span", { class: "k1" }), " оқылған  ", h("span", { class: "k2" }), " дайын (оқылмаған)  ", h("span", { class: "k3" }), " жоспарда"));
    var pathSec = h("section", { class: "en-path", "aria-labelledby": "en-path-h" }, h("h2", { id: "en-path-h", text: "Жол: A0 → C1" }),
      h("p", { class: "en-path-note", text: "6 деңгей, әр деңгейде 4 сабақ. Деңгей белгілері CEFR-ге тек шамамен сәйкес келеді: бұл ресми емтихан немесе куәлік емес." }), path, overall);

    /* ---- Нәтижелер ---- */
    var quizzes = L.filter(function (l) { return l.quiz; }), qs = quizzes.reduce(function (n, l) { return n + (l.quiz.best || 0); }, 0), qt = quizzes.reduce(function (n, l) { return n + (l.quiz.total || 0); }, 0);
    var exAll = L.reduce(function (n, l) { return n + l.ex; }, 0);
    function stat(v, t) { return h("li", null, h("b", { text: String(v) }), h("span", { text: t })); }
    var results = h("section", { class: "en-results", "aria-labelledby": "en-res-h" }, h("h2", { id: "en-res-h", text: "Менің нәтижелерім" }),
      h("ul", { class: "en-res-grid" },
        stat(read + " / " + ready.length, "сабақ оқылды"), stat(exAll, "жаттығу орындалды"), stat(qt ? qs + " / " + qt : "-", "қорытынды тест (үздік)"),
        stat(D.vocab.learned, "сөз жатталды"), stat("🔥 " + D.streak, "күн қатарынан"), stat(D.games.plays ? D.games.best : "-", "ойындағы рекорд")),
      h("p", { class: "en-res-note" }, "Деректер тек осы құрылғыда сақталады. ", h("a", { href: "../profile.html#cabinet", text: "Кабинет" }), " · ", h("a", { href: "../games.html", text: "Ойындар" })),
      h("div", { class: "en-games-row", role: "group", "aria-label": "Ағылшын ойындары" }, h("span", { class: "en-games-t", text: "Ағылшын ойындары:" }),
        GAMES.map(function (g) { return h("a", { class: "en-gchip", href: "../games.html#" + g[0], text: g[1] }); })));
    return [today, pathSec, results];
  }

  function init() {
    var anchor = document.querySelector(".course-progress") || document.getElementById("ai-note");
    if (!anchor || document.getElementById("en-home")) return;
    var root = h("div", { class: "en-home", id: "en-home" });
    anchor.after(root);
    function draw() {
      try { root.replaceChildren.apply(root, build(root, collect())); } catch (e) { if (window.console) console.warn("en-home:", e); }
    }
    draw();
    /* сабақ оқылғаннан кейін (басқа қойындыда) қайта сызу */
    window.addEventListener("storage", draw);
    window.addEventListener("pageshow", function (e) { if (e.persisted) draw(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
