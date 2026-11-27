/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* «Есте сақтау карточкалары» (academy/cards.html, tools/academy/inside_pages.py): Лейтнердің бес жәшігі.
   Білсең - карточка келесі жәшікке өтіп, сол жәшіктің аралығынан кейін қайтады (1, 3, 7, 14 күн); білмесең - 1-жәшікке, бүгін.
   Сессия INSIDE TECH-тегідей: басталған кездегі мерзімі жеткен карточкалар (төменгі жәшік бірінші); «қайталаймын» дегендер
   келесі сессияда қайта шығады. Жәшіктер INSIDE TECH-пен ортақ кілтте: «inside-tech:cards» = {id: {box, due}}.
   Мәтін тек textContent арқылы қойылады. */
(function () {
  "use strict";
  var KEY = "inside-tech:cards", DAY = 86400000, BOXES = 5;
  var root = document.querySelector(".cd");
  if (!root) return;
  var data;
  try { data = JSON.parse(root.querySelector(".cd-data").textContent); } catch (e) { return; }
  var C = data.cards, G = data.gaps;
  function sanitize(raw, now) {
    var deck = {};
    C.forEach(function (c) { deck[c.id] = { box: 1, due: now }; });
    if (!raw || typeof raw !== "object") return deck;
    C.forEach(function (c) {
      var s = raw[c.id];
      if (!s || typeof s !== "object") return;
      var box = s.box === Math.floor(s.box) && s.box >= 1 && s.box <= BOXES ? s.box : 1;
      var due = typeof s.due === "number" && isFinite(s.due) ? Math.min(s.due, now + 30 * DAY) : now;
      deck[c.id] = { box: box, due: due };
    });
    return deck;
  }
  var deck;
  try { deck = sanitize(JSON.parse(localStorage.getItem(KEY) || "null"), Date.now()); } catch (e) { deck = sanitize(null, Date.now()); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(deck)); } catch (e) { /* сақтау қолжетімсіз */ } }
  function dueNow() {
    var t = Date.now();
    return C.filter(function (c) { return deck[c.id].due <= t; }).sort(function (a, b) { return deck[a.id].box - deck[b.id].box; });
  }

  var rev = root.querySelector(".cd-review"), dueP = rev.querySelector(".cd-due"), card = rev.querySelector(".cd-card");
  var lab = rev.querySelector(".cd-lab"), front = rev.querySelector(".cd-front"), back = rev.querySelector(".cd-back");
  var flip = rev.querySelector(".cd-flip"), no = rev.querySelector(".cd-no"), yes = rev.querySelector(".cd-yes"), done = rev.querySelector(".cd-done");
  var queue = [], i = 0, knew = 0, again = 0;

  function paintBoxes() {
    Array.prototype.forEach.call(root.querySelectorAll(".cd-box-list li"), function (li) {
      var b = +li.getAttribute("data-box");
      li.querySelector("b").textContent = String(C.filter(function (c) { return deck[c.id].box === b; }).length);
    });
  }
  function show() {
    var c = queue[i];
    if (!c) { end(); return; }
    card.hidden = false;
    done.hidden = true;
    lab.textContent = c.lab + " · " + deck[c.id].box + "-жәшік";
    front.textContent = c.front;
    back.textContent = c.back;
    back.hidden = true;
    flip.hidden = false;
    no.hidden = yes.hidden = true;
    dueP.textContent = "Бүгін қалды: " + (queue.length - i) + " · білдім: " + knew + " · қайталаймын: " + again;
  }
  function end() {
    card.hidden = true;
    flip.hidden = no.hidden = yes.hidden = true;
    done.hidden = false;
    done.textContent = "";
    var left = dueNow();
    if (left.length) {
      done.appendChild(document.createTextNode("Сессия бітті: білдім " + knew + ", қайталаймын " + again + ". Қайталайтын " + left.length + " карточка қазір дайын. "));
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn secondary cd-again";
      b.textContent = "Тағы бір айналым";
      b.addEventListener("click", start);
      done.appendChild(b);
    } else {
      var next = Math.min.apply(null, C.map(function (c) { return deck[c.id].due; })), days = Math.max(1, Math.ceil((next - Date.now()) / DAY));
      var d = new Date(next);
      done.textContent = (knew + again ? "Бүгінге бітті: білдім " + knew + ", қайталаймын " + again + ". " : "Бүгін қайталайтын карточка жоқ. ") +
        "Келесі карточка " + ("0" + d.getDate()).slice(-2) + "." + ("0" + (d.getMonth() + 1)).slice(-2) + " күні қайтады (" + days + " күннен соң).";
    }
    dueP.textContent = "Бүгін қалды: 0 · білдім: " + knew + " · қайталаймын: " + again;
  }
  function grade(k) {
    var c = queue[i], s = deck[c.id], box = k ? Math.min(BOXES, s.box + 1) : 1;
    deck[c.id] = { box: box, due: k ? Date.now() + G[box] * DAY : Date.now() };
    save();
    if (k) knew++; else again++;
    i++;
    paintBoxes();
    show();
    (i < queue.length ? flip : done).focus();
  }
  function start() { queue = dueNow(); i = 0; knew = 0; again = 0; show(); flip.focus(); }   // әр айналымның өз есебі
  flip.addEventListener("click", function () { back.hidden = false; flip.hidden = true; no.hidden = yes.hidden = false; yes.focus(); });
  no.addEventListener("click", function () { grade(false); });
  yes.addEventListener("click", function () { grade(true); });
  done.tabIndex = -1;
  rev.hidden = false;
  paintBoxes();
  queue = dueNow();
  show();
})();
