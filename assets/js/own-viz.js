/* © 2026 Sagid Mustafa. All Rights Reserved.
 * Дербес авторлық интерактивті визуализаторлар (C++ және Java курстары).
 * Vanilla JS, сыртқы кітапхана жоқ. Әр виджет - деректермен басқарылатын «қадамдар» тізімі:
 * код жолдары + әр қадамдағы күй. Беттегі <div class="viz own-viz" data-viz="ID" data-title="..."></div> өздігінен қосылады.
 * ID-лер: cpp-pointers, cpp-vector, cpp-vtable, java-refs, java-hashmap, java-threads.
 */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var UID = 0;
  var DEFS = {};
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  };
  /* қадам жасаушы: l - код жолы (-1: жол жоқ), d - сипаттама, f - күйді өзгертуші, x - қосымша (res, bad) */
  var S = function (l, d, f, x) { var o = { l: l, d: d, f: f || null }; if (x) for (var k in x) o[k] = x[k]; return o; };

  /* ---------- SVG көмекшілері ---------- */
  function arrow(uid, x1, y1, lane, x2, y2, cls) {
    return '<path class="ov-arrow ' + (cls || "") + '" d="M' + x1 + " " + y1 + " H" + lane + " V" + y2 + " H" + x2 + '" marker-end="url(#' + uid + (cls && cls.indexOf("bad") > -1 ? "b" : "a") + ')"/>';
  }
  function defs(uid) {
    return '<defs><marker id="' + uid + 'a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ov-mk" d="M0 0 L10 5 L0 10 z"/></marker>' +
      '<marker id="' + uid + 'b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ov-mk bad" d="M0 0 L10 5 L0 10 z"/></marker></defs>';
  }

  /* =====================================================================
   * 1) cpp-pointers
   * ===================================================================== */
  (function () {
    var A = "0x7ffe3a1c", P = "0x7ffe3a10", Q = "0x7ffe3a08", H = "0x55d0c2a0";
    var init = function () {
      return { a: { d: 0, v: null }, p: { d: 0, ptr: "?" }, r: { d: 0 }, q: { d: 0, ptr: "?" }, h: { ex: 0, v: null, fr: 0 }, chg: "" };
    };
    var common = [
      S(0, "int a = 5; - стекте a ұяшығы жасалды, оған 5 жазылды. Мысал мекенжайы: " + A + ".", function (s) { s.a.d = 1; s.a.v = 5; s.chg = "a"; }),
      S(1, "&a - a-ның мекенжайы. p көрсеткіші сол мекенжайды сақтайды, яғни a-ға «нұсқайды». Сызық көрсеткіштен нысанға барады.", function (s) { s.p.d = 1; s.p.ptr = "a"; s.chg = "p"; }),
      S(2, "*p = 7; - p көрсеткен жерге (a-ға) 7 жазылды. a-ның мәні p арқылы өзгерді, a-ға тікелей тиген жоқпыз.", function (s) { s.a.v = 7; s.chg = "a"; }),
      S(3, "int& r = a; - r жаңа ұяшық емес, a-ның екінші аты (лақап аты). Көрсеткіштен айырмасы: * жазбаймыз, ол өмір бойы a-ға байланған, nullptr бола алмайды.", function (s) { s.r.d = 1; s.chg = "r"; }),
      S(4, "r = 8; - r арқылы жазу a-ға жазумен бірдей. Енді a = 8.", function (s) { s.a.v = 8; s.chg = "a"; }),
      S(5, "new int(9) - үймеде (heap) 4 байт бөлінді, мекенжайы " + H + ". q сол мекенжайды сақтайды. Үйме жадын бағдарламашы өзі босатуы керек.", function (s) { s.q.d = 1; s.q.ptr = "h"; s.h.ex = 1; s.h.v = 9; s.chg = "q"; })
    ];
    var code = ["int a = 5;", "int* p = &a;", "*p = 7;", "int& r = a;", "r = 8;", "int* q = new int(9);"];
    var okRes = { ok: true, t: "a = 8; p мен r - a-ға қарайды, q = nullptr, үйме босатылған. Жад ағуы жоқ." };
    DEFS["cpp-pointers"] = {
      title: "Көрсеткіштер: стек және үйме",
      intro: "Бағдарлама басталды: стек те, үйме де бос. «Алға» батырмасын не → пернесін басыңыз.",
      variants: [
        { label: "delete бар", code: code.concat(["delete q;", "q = nullptr;"]), init: init,
          steps: common.concat([
            S(6, "delete q; - үймедегі жад жүйеге қайтарылды. Бірақ q-дың ішіндегі мекенжай өзгерген жоқ: q енді dangling (жарамсыз) көрсеткіш. Оны оқуға да, оған жазуға да болмайды.", function (s) { s.h.fr = 1; s.chg = "h"; }, { bad: true }),
            S(7, "q = nullptr; - q «ешқайда көрсетпейді» деп белгіленді. Енді қателесіп *q жазсақ, бағдарлама бірден құлайды: қате үнсіз жасырынбайды.", function (s) { s.q.ptr = "null"; s.chg = "q"; }, { res: okRes })
          ]) },
        { label: "delete ұмытылды (ағу)", code: code.concat(["q = nullptr;  // delete жоқ!", "}  // main аяқталады"]), init: init,
          steps: common.concat([
            S(6, "q = nullptr; - үйме жадына апаратын жалғыз көрсеткішті жоғалттық. delete шақырылған жоқ, ал нысанға енді ешкім жете алмайды.", function (s) { s.q.ptr = "null"; s.chg = "q"; }, { bad: true }),
            S(7, "main аяқталды: стектегі a, p, r, q автоматты жойылды, бірақ үймедегі 4 байт қалып қойды. Бұл - жад ағуы (memory leak). Ұзақ жұмыс істейтін бағдарламада мұндай ағулар жадты толтырады.", function (s) { s.a.d = 0; s.p.d = 0; s.r.d = 0; s.q.d = 0; s.chg = ""; },
              { res: { ok: false, t: "үймеде 4 байт қалды, оған ешкім көрсетпейді. Жад ағуы (memory leak)! Шешім: delete q; немесе std::unique_ptr." } })
          ]) },
        { label: "delete-тен кейін қолдану (dangling)", code: code.concat(["delete q;", "*q = 1;  // ⚠"]), init: init,
          steps: common.concat([
            S(6, "delete q; - жад босатылды, бірақ q әлі сол мекенжайды ұстап тұр (dangling).", function (s) { s.h.fr = 1; s.chg = "h"; }, { bad: true }),
            S(7, "*q = 1; - босатылған жадқа жазу. Бұл анықталмаған әрекет (undefined behavior): бағдарлама құлауы, деректі үнсіз бұзуы немесе «дұрыс сияқты» жұмыс істеуі мүмкін.", function (s) { s.chg = "h"; },
              { bad: true, res: { ok: false, t: "use-after-free: анықталмаған әрекет. AddressSanitizer мұны heap-use-after-free деп ұстайды. Шешім: delete-тен кейін q = nullptr; одан да жақсысы - std::unique_ptr." } })
          ]) }
      ],
      render: function (st, m) {
        var uid = m.uid, o = defs(uid);
        o += '<rect class="ov-zone st" x="3" y="3" width="334" height="190" rx="10"/><text class="ov-zt" x="12" y="19">СТЕК (stack)</text>';
        o += '<rect class="ov-zone hp" x="3" y="200" width="334" height="88" rx="10"/><text class="ov-zt" x="12" y="216">ҮЙМЕ (heap)</text>';
        var rows = [["a", "int a", A], ["p", "int* p", P], ["r", "int& r", "a-ның лақап аты"], ["q", "int* q", Q]], Y = {};
        rows.forEach(function (r, i) {
          var k = r[0], v = st[k]; if (!v.d) return;
          var y = 28 + i * 40; Y[k] = y;
          var txt, cls = "";
          if (k === "a") txt = v.v === null ? "?" : String(v.v);
          else if (k === "r") { txt = st.a.v === null ? "?" : String(st.a.v); cls = " alias"; }
          else txt = v.ptr === "a" ? A : v.ptr === "h" ? H : v.ptr === "null" ? "nullptr" : "?";
          var dang = k === "q" && v.ptr === "h" && st.h.fr;
          if (dang) cls += " bad";
          if (st.chg === k) cls += " hl";
          o += '<text class="ov-nm" x="12" y="' + (y + 13) + '">' + r[1] + '</text><text class="ov-ad" x="12" y="' + (y + 26) + '">' + r[2] + "</text>";
          o += '<rect class="ov-box' + cls + '" x="150" y="' + y + '" width="96" height="30" rx="6"/><text class="ov-val' + (dang ? " bad" : "") + '" x="198" y="' + (y + 20) + '" text-anchor="middle">' + (dang ? "⚠ " : "") + txt + "</text>";
        });
        if (st.p.d && st.p.ptr === "a") o += arrow(uid, 246, Y.p + 15, 272, 246, Y.a + 15);
        if (st.r.d) o += arrow(uid, 246, Y.r + 15, 296, 246, Y.a + 15, "dash");
        var leak = st.h.ex && !st.h.fr && !(st.q.d && st.q.ptr === "h");
        if (st.q.d && st.q.ptr === "h") o += arrow(uid, 246, Y.q + 15, 318, 246, 240, st.h.fr ? "bad dash" : "");
        if (st.h.ex) {
          var hc = st.h.fr ? " dead" : leak ? " leak" : "";
          if (st.chg === "h" || st.chg === "q" && !st.h.fr && st.q.ptr === "h") hc += " hl";
          o += '<text class="ov-ad" x="12" y="237">' + H + '</text><text class="ov-nm" x="12" y="251">new int(9)</text>';
          o += '<rect class="ov-box' + hc + '" x="150" y="222" width="96" height="36" rx="6"/><text class="ov-val' + (st.h.fr ? " dim" : "") + '" x="198" y="245" text-anchor="middle">' + st.h.v + "</text>";
          o += '<text class="ov-flag' + (st.h.fr || leak ? " bad" : "") + '" x="198" y="277" text-anchor="middle">' + (st.h.fr ? "босатылды (freed)" : leak ? "⚠ ағу: ешкім көрсетпейді" : "тірі нысан") + "</text>";
        } else o += '<rect class="ov-box ghost" x="150" y="222" width="96" height="36" rx="6"/><text class="ov-ad" x="198" y="245" text-anchor="middle">бос</text>';
        return '<svg class="ov-svg" viewBox="0 0 340 292" aria-hidden="true" focusable="false">' + o + "</svg>";
      },
      sum: function (st) {
        var t = ["Стек:"];
        if (st.a.d) t.push("a = " + st.a.v + ";");
        if (st.p.d) t.push("p " + (st.p.ptr === "a" ? "a-ға көрсетеді;" : "?;"));
        if (st.r.d) t.push("r - a-ның лақап аты;");
        if (st.q.d) t.push("q " + (st.q.ptr === "h" ? (st.h.fr ? "босатылған үймеге көрсетеді (dangling);" : "үймеге көрсетеді;") : st.q.ptr === "null" ? "nullptr;" : "?;"));
        t.push("Үйме: " + (st.h.ex ? (st.h.fr ? "блок босатылған" : "блок тірі, мәні 9") : "бос") + ".");
        return t.join(" ");
      }
    };
  })();

  /* =====================================================================
   * 2) cpp-vector
   * ===================================================================== */
  (function () {
    var ADDR = ["0x55a3c2a0", "0x55a3c2e0", "0x55a3c360", "0x55a3c460", "0x55a3c560"];
    var ID = ["A", "B", "C", "D", "E"];
    var init = function () { return { size: 0, cap: 0, bl: [], it: null, n: 0, fresh: [] }; };
    function build(reserve) {
      var code = ["std::vector<int> v;"], steps = [], L = 0;
      if (reserve) {
        L = code.length; code.push("v.reserve(8);");
        steps.push(S(L, "reserve(8) - 8 элементтік жад алдын ала бөлінді. size әлі 0, бірақ capacity = 8. Енді push_back қайта бөлу жасамайды.",
          function (s) { s.bl.push({ id: "A", ad: ADDR[0], cap: 8, it: [null, null, null, null, null, null, null, null], fr: 0 }); s.cap = 8; s.n = 1; }));
      }
      var sim = { size: 0, cap: reserve ? 8 : 0, n: reserve ? 1 : 0 };
      function addPush(val) {
        var L = code.length; code.push("v.push_back(" + val + ");");
        if (sim.size < sim.cap) {
          var sz = sim.size;
          steps.push(S(L, "push_back(" + val + "): size (" + sz + ") < capacity (" + sim.cap + ") - орын бар. " + val + " [" + sz + "] ұяшығына жазылды, қайта бөлу керек емес.",
            (function (sz, val) { return function (s) { s.bl[s.bl.length - 1].it[sz] = val; s.size = sz + 1; s.fresh = [s.bl[s.bl.length - 1].id + ":" + sz]; }; })(sz, val)));
          sim.size++;
          return;
        }
        var sz2 = sim.size, oc = sim.cap, nc = oc ? oc * 2 : 1, bi = sim.n;
        var nid = ID[bi], ad = ADDR[bi];
        steps.push(S(L, "push_back(" + val + "): size (" + sz2 + ") == capacity (" + oc + ") - орын жоқ! vector үймеде " + nc + " элементтік жаңа блок бөледі (g++ capacity-ді 2 есе өсіреді: 1, 2, 4, 8...).",
          function (s) { var a = []; for (var i = 0; i < nc; i++) a.push(null); s.bl.push({ id: nid, ad: ad, cap: nc, it: a, fr: 0 }); s.n++; s.fresh = []; }));
        steps.push(S(L, "Жаңа " + val + " элементі алдымен жаңа блоктың [" + sz2 + "] ұяшығына жазылады (g++ дәл осылай істейді).",
          function (s) { var b = s.bl[s.bl.length - 1]; b.it[sz2] = val; s.fresh = [nid + ":" + sz2]; }));
        if (sz2 > 0) {
          steps.push(S(L, "Ескі блоктағы " + sz2 + " элемент жаңа блокқа көшіріледі. Әр элементтің мекенжайы өзгереді!",
            function (s) { var o = s.bl[s.bl.length - 2], b = s.bl[s.bl.length - 1]; s.fresh = []; for (var i = 0; i < sz2; i++) { b.it[i] = o.it[i]; s.fresh.push(nid + ":" + i); } }));
        }
        steps.push(S(L, sz2 > 0 ? "Ескі блок босатылды (free). size = " + (sz2 + 1) + ", capacity = " + nc + ". Ескі мекенжайларға сілтеген барлық көрсеткіш, сілтеме және итератор жарамсыз болды." : "size = 1, capacity = 1. Бірінші push_back жад бөлуден басталады.",
          function (s) {
            if (s.bl.length > 1) { s.bl[s.bl.length - 2].fr = 1; }
            s.bl = s.bl.filter(function (b, i) { return i >= s.bl.length - 2 || (s.it && s.it.blk === b.id); });
            s.size = sz2 + 1; s.cap = nc; s.fresh = [];
          }));
        sim.size++; sim.cap = nc; sim.n++;
      }
      addPush(10);
      var Li = code.length; code.push("auto it = v.begin();");
      steps.push(S(Li, "it = v.begin() - 0-ші элементтің мекенжайы. Итератор - сол мекенжайдың «қабығы». Қазір ол жарамды.", function (s) { s.it = { blk: s.bl[s.bl.length - 1].id }; s.fresh = []; }));
      addPush(20); addPush(30); addPush(40); addPush(50);
      var Le = code.length; code.push("std::cout << *it;");
      if (reserve) {
        steps.push(S(Le, "*it оқылды: 10. Блок ауыспады, итератор жарамды.", function (s) { s.out = ["10"]; s.fresh = []; },
          { res: { ok: true, t: "10 шықты. reserve(8) арқасында қайта бөлу болмады, итератор жарамды қалды. Алдын ала мөлшерді білсеңіз, reserve қолданыңыз." } }));
      } else {
        steps.push(S(Le, "*it - ескі, босатылған блоктың 0-ші ұяшығын оқу әрекеті. Бұл - анықталмаған әрекет (undefined behavior).", function (s) { s.fresh = []; },
          { bad: true, res: { ok: false, t: "it босатылған ескі блокқа қарап тұр: *it анықталмаған әрекет (UB). Блок 4 рет ауыстырылды (1 → 2 → 4 → 8). push_back-тан кейін итераторды қайта алыңыз немесе алдын ала reserve шақырыңыз." } }));
      }
      return { code: code, steps: steps, init: init };
    }
    var v1 = build(false), v2 = build(true);
    v1.label = "push_back (қайта бөлу)"; v2.label = "reserve(8) алдын ала";
    DEFS["cpp-vector"] = {
      title: "std::vector өсуі: size және capacity",
      intro: "Бастапқы күй: код әлі орындалған жоқ. «Алға» батырмасын басыңыз.",
      variants: [v1, v2],
      render: function (st) {
        var h = '<div class="ov-stat"><span>size = <b>' + st.size + '</b></span><span>capacity = <b>' + st.cap + '</b></span><span>жад бөлу: <b>' + st.n + "</b></span></div>";
        if (!st.bl.length) return h + '<p class="ov-empty">Үймеде блок жоқ (vector бос, көрсеткіші nullptr).</p>';
        var bl = st.bl.slice().reverse(), newest = st.bl[st.bl.length - 1].id;
        bl.forEach(function (b) {
          h += '<div class="ov-blk' + (b.fr ? " freed" : "") + '"><div class="ov-blk-h"><b>Блок ' + b.id + "</b> <code>" + b.ad + "</code> " +
            (b.fr ? "<em>босатылды (free)</em>" : b.id === newest ? "<em>ағымдағы</em>" : "<em>ескі</em>") + "</div>";
          h += '<div class="ov-cells" style="--n:' + b.cap + '">';
          for (var i = 0; i < b.cap; i++) {
            var v = b.it[i], c = "ov-cell" + (v === null ? " empty" : "") + (st.fresh.indexOf(b.id + ":" + i) > -1 ? " pop" : "") + (b.fr ? " dead" : "");
            h += '<span class="' + c + '"><b>' + (v === null ? "" : v) + '</b><i>' + i + "</i></span>";
          }
          h += "</div>";
          if (st.it && st.it.blk === b.id) h += '<div class="ov-itrow" style="--n:' + b.cap + '"><span class="ov-it' + (b.fr ? " bad" : "") + '">↑ it' + (b.fr ? " (dangling!)" : "") + "</span></div>";
          h += "</div>";
        });
        return h;
      },
      sum: function (st) {
        var t = "size = " + st.size + ", capacity = " + st.cap + ". ";
        st.bl.forEach(function (b) { t += "Блок " + b.id + (b.fr ? " (босатылған)" : "") + ": " + b.it.filter(function (x) { return x !== null; }).join(", ") + " (" + b.cap + " орын). "; });
        if (st.it) { var b2 = st.bl.filter(function (b) { return b.id === st.it.blk; })[0]; t += "Итератор it " + (b2 && b2.fr ? "босатылған блокқа қарайды (жарамсыз)." : "жарамды."); }
        return t;
      }
    };
  })();

  /* =====================================================================
   * 3) cpp-vtable
   * ===================================================================== */
  (function () {
    var FA = "0x401136", FD = "0x401170";
    var init = function () { return { objs: [], ptr: 0, hl: [], tabs: { A: 0, D: 0 }, fns: { A: 0, D: 0 }, layout: "ptr", direct: 0, novt: 0 }; };
    var cls = [
      "struct Aspap {", "    virtual void daus() { cout << \"Aspap: жалпы дыбыс\"; }", "    virtual ~Aspap() = default;", "};",
      "struct Dombyra : Aspap {", "    void daus() override { cout << \"Dombyra: тың-тың!\"; }", "};"
    ];
    var A = S(1, "Aspap класында virtual функция бар, сондықтан компилятор Aspap үшін vtable жасайды: [0] ұяшығында Aspap::daus() мекенжайы (" + FA + ").", function (s) { s.tabs.A = 1; s.fns.A = 1; });
    var D = S(5, "Dombyra daus()-ты override етті: оның өз vtable-ы бар, [0] ұяшығы енді Dombyra::daus() мекенжайын (" + FD + ") көрсетеді.", function (s) { s.tabs.D = 1; s.fns.D = 1; });
    var v1 = {
      label: "virtual (vtable)", code: cls.concat(["Aspap* p = new Dombyra;", "p->daus();", "delete p;"]), init: init,
      steps: [
        S(0, "Класс сипаттамасы: Aspap базалық класы. Оның daus() функциясы virtual.", null),
        A, D,
        S(7, "new Dombyra - үймеде нысан жасалды. Конструктор нысанның ішіне жасырын vptr жазды: ол Dombyra vtable-ына көрсетеді. p көрсеткіші Aspap* түрінде, бірақ нысанның нағыз түрі - Dombyra.",
          function (s) { s.objs = [{ nm: "new Dombyra", kind: "Dombyra", vp: "D" }]; s.ptr = 1; s.hl = ["vpD"]; }),
        S(8, "p->daus(): p түрі Aspap*, ал daus() - virtual. Сондықтан компилятор функцияны бірден таңдамайды, орындалу кезінде нысанның vptr-ін оқуға нұсқау жазады.", function (s) { s.hl = ["obj", "vpD"]; }),
        S(8, "vptr нысанның нағыз түрінің (Dombyra) vtable-ына көрсетеді. Базалық көрсеткіш арқылы да дұрыс кесте табылды.", function (s) { s.hl = ["vpD", "tD"]; }),
        S(8, "vtable-дағы [0] ұяшығы - daus() функциясының мекенжайы: " + FD + ".", function (s) { s.hl = ["eD"]; }),
        S(8, "Басқару Dombyra::daus()-ке өтті. Шықты: «Dombyra: тың-тың!». Дәл осы - динамикалық байлау (dynamic dispatch).", function (s) { s.hl = ["fD"]; s.out = ["Dombyra: тың-тың!"]; }),
        S(9, "delete p; - Aspap-та virtual деструктор бар, сондықтан Dombyra нысаны толық жойылады (vtable-дағы деструктор шақырылады).", function (s) { s.objs = []; s.ptr = 0; s.hl = []; },
          { res: { ok: true, t: "«Dombyra: тың-тың!» - Aspap* көрсеткіші арқылы Dombyra-ның нұсқасы шақырылды. Себебі: virtual + vptr + vtable." } })
      ]
    };
    var v2 = {
      label: "virtual жоқ", code: ["struct Aspap {", "    void daus() { cout << \"Aspap: жалпы дыбыс\"; }", "};", "struct Dombyra : Aspap {", "    void daus() { cout << \"Dombyra: тың-тың!\"; }", "};", "Aspap* p = new Dombyra;", "p->daus();"], init: init,
      steps: [
        S(0, "Класс сипаттамасы: бұл жолы daus() virtual емес.", function (s) { s.novt = 1; s.fns.A = 1; }),
        S(1, "virtual жоқ - vtable де, vptr де жасалмайды. Нысан жеңіл, бірақ функцияны таңдау компиляция кезінде болады.", null),
        S(4, "Dombyra өз daus()-ын жазды, бірақ ол Aspap::daus()-ты тек «жасырады» (override емес).", function (s) { s.fns.D = 1; }),
        S(6, "new Dombyra - нысанда vptr жоқ. p түрі - Aspap*.", function (s) { s.objs = [{ nm: "new Dombyra", kind: "Dombyra", vp: "" }]; s.ptr = 1; }),
        S(7, "p->daus(): компилятор тек p-ның жарияланған түріне қарайды (Aspap*) және Aspap::daus()-ты тікелей шақыруды жазады. Нысанның нағыз түрі ескерілмейді.", function (s) { s.direct = 1; s.hl = ["fA"]; s.out = ["Aspap: жалпы дыбыс"]; },
          { bad: true, res: { ok: false, t: "Нысан Dombyra болса да, «Aspap: жалпы дыбыс» шықты. Полиморфизм үшін базалық класта daus() virtual болуы керек." } })
      ]
    };
    var v3 = {
      label: "Slicing (кесу)", code: cls.slice(0, 4).concat(cls.slice(4)).concat(["Dombyra d;", "Aspap a = d;  // slicing!", "a.daus();"]), init: init,
      steps: [
        S(0, "Класс сипаттамасы: дәл сол Aspap және Dombyra, daus() - virtual.", null),
        A, D,
        S(7, "Dombyra d; - стекте толық Dombyra нысаны. Оның vptr-і Dombyra vtable-ына көрсетеді.", function (s) { s.layout = "two"; s.objs = [{ nm: "d", kind: "Dombyra", vp: "D" }]; s.hl = ["vpD"]; }),
        S(8, "Aspap a = d; - нысан мәні бойынша көшіріледі. Aspap-тың көшірмесінде тек Aspap бөлігі бар: Dombyra-ға тән бөлік кесіліп қалды (slicing). Жаңа нысанның vptr-і Aspap vtable-ына көрсетеді!",
          function (s) { s.objs.push({ nm: "a", kind: "Aspap", vp: "A" }); s.hl = ["obj1", "vpA"]; }, { bad: true }),
        S(9, "a.daus(): a - шынымен Aspap нысаны, оның vptr-і Aspap vtable-ына көрсетеді. [0] ұяшығы - Aspap::daus() (" + FA + ").", function (s) { s.hl = ["vpA", "tA", "eA"]; }),
        S(9, "Шықты: «Aspap: жалпы дыбыс». d-ның Dombyra-лығы a-ға көшпеді.", function (s) { s.hl = ["fA"]; s.out = ["Aspap: жалпы дыбыс"]; },
          { bad: true, res: { ok: false, t: "Slicing: полиморфизм тек көрсеткіш не сілтеме арқылы жұмыс істейді. Aspap& r = d; немесе Aspap* p = &d; болса, «Dombyra: тың-тың!» шығар еді." } })
      ]
    };
    DEFS["cpp-vtable"] = {
      title: "virtual функция: vptr және vtable",
      intro: "Бастапқы күй: код орындалған жоқ. Қадамдап: нысан → vptr → vtable → дұрыс функция.",
      variants: [v1, v2, v3],
      render: function (st, m) {
        var uid = m.uid, o = defs(uid), hl = function (k) { return st.hl.indexOf(k) > -1 ? " hl" : ""; };
        var two = st.layout === "two";
        if (st.ptr) o += '<text class="ov-nm" x="10" y="26">стек</text><rect class="ov-box' + hl("ptr") + '" x="10" y="32" width="72" height="28" rx="6"/><text class="ov-val" x="46" y="51" text-anchor="middle">p</text>';
        st.objs.forEach(function (ob, i) {
          var x = two ? (i ? 180 : 10) : 140, w = two ? 150 : 190, y = 24;
          o += '<rect class="ov-box obj' + (st.hl.indexOf("obj") > -1 || st.hl.indexOf("obj" + i) > -1 ? " hl" : "") + '" x="' + x + '" y="' + y + '" width="' + w + '" height="86" rx="8"/>';
          o += '<text class="ov-nm" x="' + (x + 8) + '" y="' + (y + 14) + '">' + esc(ob.nm) + " (" + ob.kind + ")</text>";
          if (ob.vp) {
            o += '<rect class="ov-cellr' + hl("vp" + ob.vp) + '" x="' + (x + 8) + '" y="' + (y + 22) + '" width="' + (w - 16) + '" height="24" rx="4"/><text class="ov-val" x="' + (x + 14) + '" y="' + (y + 38) + '">vptr → vtable ' + (ob.vp === "D" ? "Dombyra" : "Aspap") + "</text>";
            var ax = x + w - 24, tx = ob.vp === "D" ? 255 : 85;
            o += '<path class="ov-arrow' + (st.hl.indexOf("vp" + ob.vp) > -1 ? " on" : "") + '" d="M' + ax + " " + (y + 46) + " V" + (y + 50) + " V128 H" + (ob.vp === "D" ? 306 : 136) + ' V140" marker-end="url(#' + uid + 'a)"/>';
          } else o += '<rect class="ov-cellr ghost" x="' + (x + 8) + '" y="' + (y + 22) + '" width="' + (w - 16) + '" height="24" rx="4"/><text class="ov-ad" x="' + (x + 14) + '" y="' + (y + 38) + '">vptr жоқ</text>';
          o += '<rect class="ov-cellr" x="' + (x + 8) + '" y="' + (y + 52) + '" width="' + (w - 52) + '" height="24" rx="4"/><text class="ov-ad" x="' + (x + 14) + '" y="' + (y + 68) + '">өрістер</text>';
        });
        if (st.ptr && !two) o += '<path class="ov-arrow" d="M82 46 H140" marker-end="url(#' + uid + 'a)"/>';
        [["A", 10, "Aspap", FA], ["D", 180, "Dombyra", FD]].forEach(function (t) {
          var k = t[0], x = t[1];
          if (st.tabs[k] && !st.novt) {
            o += '<rect class="ov-th' + hl("t" + k) + '" x="' + x + '" y="140" width="150" height="20" rx="4"/><text class="ov-nm" x="' + (x + 75) + '" y="154" text-anchor="middle">vtable: ' + t[2] + "</text>";
            o += '<rect class="ov-cellr' + hl("e" + k) + '" x="' + x + '" y="160" width="150" height="32"/><text class="ov-val" x="' + (x + 8) + '" y="174">[0] daus()</text><text class="ov-ad" x="' + (x + 8) + '" y="187">→ ' + t[3] + "</text>";
            o += '<path class="ov-arrow' + (st.hl.indexOf("e" + k) > -1 || st.hl.indexOf("f" + k) > -1 ? " on" : "") + '" d="M' + (x + 75) + " 192 V216" + '" marker-end="url(#' + uid + 'a)"/>';
          }
          if (st.fns[k]) o += '<rect class="ov-box fn' + hl("f" + k) + '" x="' + x + '" y="218" width="150" height="28" rx="6"/><text class="ov-val" x="' + (x + 75) + '" y="236" text-anchor="middle">' + t[2] + "::daus()</text>";
        });
        if (st.novt) o += '<text class="ov-ad" x="170" y="170" text-anchor="middle">virtual жоқ: vtable да, vptr да жоқ</text>';
        if (st.direct) o += '<path class="ov-arrow bad dash" d="M46 60 V218" marker-end="url(#' + uid + 'b)"/><text class="ov-flag bad" x="54" y="150">компиляция кезінде таңдалды</text>';
        return '<svg class="ov-svg" viewBox="0 0 340 254" aria-hidden="true" focusable="false">' + o + "</svg>";
      },
      sum: function (st) {
        var t = "";
        st.objs.forEach(function (o) { t += o.nm + " (" + o.kind + ") нысаны, " + (o.vp ? "vptr " + (o.vp === "D" ? "Dombyra" : "Aspap") + " vtable-ына көрсетеді. " : "vptr жоқ. "); });
        if (st.tabs.A && !st.novt) t += "Aspap vtable бар. ";
        if (st.tabs.D && !st.novt) t += "Dombyra vtable бар. ";
        return t || "Нысандар әлі жасалған жоқ.";
      }
    };
  })();

  /* =====================================================================
   * 4) java-refs
   * ===================================================================== */
  (function () {
    var init = function () { return { v: {}, o: [], chg: "" }; };
    var kit = function (b) { return { id: 0, t: "Kitap", f: ["atau: \"Абай жолы\"", "baga: " + b], slot: 0 }; };
    var v1 = {
      label: "Kitap нысандары",
      code: ["Kitap a = new Kitap(\"Абай жолы\", 3500);", "Kitap b = a;", "b.baga = 4200;", "System.out.println(a.baga);", "System.out.println(a == b);", "Kitap c = new Kitap(\"Абай жолы\", 4200);", "System.out.println(a == c);", "System.out.println(a.equals(c));", "a = null; b = null;", "// біраз уақыттан кейін GC жұмыс істейді"],
      init: init,
      steps: [
        S(0, "new Kitap(...) - үймеде нысан жасалды. a - стектегі сілтеме (reference): ол нысанның өзін емес, оның мекенжайын сақтайды.", function (s) { s.o.push({ id: 1, t: "Kitap", f: ["atau: \"Абай жолы\"", "baga: 3500"], slot: 0 }); s.v.a = 1; s.chg = "a"; }),
        S(1, "Kitap b = a; - нысан көшірілмейді! Тек сілтеме көшіріледі: енді a да, b да бір нысанды көрсетеді.", function (s) { s.v.b = 1; s.chg = "b"; }),
        S(2, "b.baga = 4200; - b арқылы нысан өзгерді. Нысан біреу болғандықтан, a арқылы да өзгеріс көрінеді.", function (s) { s.o[0].f[1] = "baga: 4200"; s.chg = "o1"; }),
        S(3, "a.baga оқылды: 4200. «b-ны өзгерттім, a-ға тимедім» деген жорамал қате.", function (s) { s.out = ["4200"]; s.chg = ""; }),
        S(4, "a == b: сілтемелер салыстырылады (мекенжай бірдей ме?). Екеуі де 1-нысанға қарайды - true.", function (s) { s.out.push("true"); }),
        S(5, "new Kitap(...) тағы бір нысан жасады: мазмұны бірдей, бірақ жад ұясы басқа. c оған көрсетеді.", function (s) { s.o.push({ id: 2, t: "Kitap", f: ["atau: \"Абай жолы\"", "baga: 4200"], slot: 1 }); s.v.c = 2; s.chg = "c"; }),
        S(6, "a == c: сілтемелер әртүрлі нысанға қарайды - false. == мазмұнды емес, мекенжайды салыстырады.", function (s) { s.out.push("false"); s.chg = ""; }),
        S(7, "a.equals(c): equals() қайта анықталған (өрістер салыстырылады), өрістер бірдей - true.", function (s) { s.out.push("true"); }),
        S(8, "a = null; b = null; - 1-нысанға ешбір сілтеме қалмады. Ол жетім (unreachable) нысан - сұр түске боялды.", function (s) { s.v.a = null; s.v.b = null; s.chg = "a"; }, { bad: true }),
        S(9, "Жинақтаушы (garbage collector, GC) жетім нысанды табады да, жадын босатады. Java-да delete жоқ: бағдарламашы нысанды қолмен жоймайды.", function (s) { s.o = s.o.filter(function (o) { return o.id !== 1; }); s.chg = ""; },
          { res: { ok: true, t: "консоль: 4200, true, false, true. 1-нысан жетім болып, GC жойды; c әлі тірі." } })
      ]
    };
    var v2 = {
      label: "String және ==",
      code: ["String s = \"dombyra\";", "String t = \"dombyra\";", "String u = new String(\"dombyra\");", "System.out.println(s == t);", "System.out.println(s == u);", "System.out.println(s.equals(u));"],
      init: init,
      steps: [
        S(0, "\"dombyra\" - жолдық литерал. Ол үймедегі арнайы String pool аймағына түседі, s сол нысанға көрсетеді.", function (s) { s.o.push({ id: 1, t: "String", f: ["\"dombyra\""], slot: 0, pool: 1 }); s.v.s = 1; s.chg = "s"; }),
        S(1, "Дәл сондай литерал бұрыннан бар: Java жаңа нысан жасамай, pool-дағы нысанды қайта қолданады. s пен t бір нысанға қарайды.", function (s) { s.v.t = 1; s.chg = "t"; }),
        S(2, "new String(...) - әдейі жаңа нысан жасайды (pool-ға емес, жай үймеге). u басқа нысанға көрсетеді, мазмұны сол «dombyra».", function (s) { s.o.push({ id: 2, t: "String", f: ["\"dombyra\""], slot: 1 }); s.v.u = 2; s.chg = "u"; }),
        S(3, "s == t: екеуі бір нысанды көрсетеді - true.", function (s) { s.out = ["true"]; s.chg = ""; }),
        S(4, "s == u: нысандар әртүрлі, мекенжайлары басқа - false, мәтіндері бірдей болса да!", function (s) { s.out.push("false"); }, { bad: true }),
        S(5, "s.equals(u): мәтін символ-символ салыстырылады - true. Жолдарды әрқашан equals() арқылы салыстырыңыз.", function (s) { s.out.push("true"); },
          { res: { ok: true, t: "true, false, true. Жолдардың мазмұнын equals(), мекенжайын == салыстырады." } })
      ]
    };
    DEFS["java-refs"] = {
      title: "Сілтемелер: стек және үйме",
      intro: "Бастапқы күй: стек пен үйме бос. «Алға» батырмасын басыңыз.",
      variants: [v1, v2],
      render: function (st, m) {
        var uid = m.uid, o = defs(uid);
        o += '<rect class="ov-zone st" x="3" y="3" width="124" height="176" rx="10"/><text class="ov-zt" x="12" y="19">СТЕК</text>';
        o += '<rect class="ov-zone hp" x="150" y="3" width="187" height="176" rx="10"/><text class="ov-zt" x="160" y="19">ҮЙМЕ (heap)</text>';
        var refc = {}, ys = {};
        var names = Object.keys(st.v);
        names.forEach(function (n) { if (st.v[n]) refc[st.v[n]] = (refc[st.v[n]] || 0) + 1; });
        st.o.forEach(function (ob) {
          var y = 28 + ob.slot * 78, orphan = !refc[ob.id]; ys[ob.id] = y + 30;
          o += '<rect class="ov-box obj' + (orphan ? " orphan" : "") + (st.chg === "o" + ob.id ? " hl" : "") + '" x="160" y="' + y + '" width="168" height="66" rx="8"/>';
          o += '<text class="ov-nm" x="168" y="' + (y + 15) + '">' + ob.t + (ob.pool ? " · String pool" : "") + "</text>";
          ob.f.forEach(function (f, i) { o += '<text class="ov-val' + (orphan ? " dim" : "") + '" x="168" y="' + (y + 33 + i * 16) + '">' + esc(f) + "</text>"; });
          if (orphan) o += '<text class="ov-flag bad" x="324" y="' + (y + 15) + '" text-anchor="end">жетім · GC</text>';
        });
        names.forEach(function (n, i) {
          var y = 28 + i * 44, t = st.v[n];
          o += '<text class="ov-nm" x="12" y="' + (y + 12) + '">' + (st.o.length && st.o[0].t === "String" ? "String " : "Kitap ") + n + '</text>';
          o += '<rect class="ov-box' + (st.chg === n ? " hl" : "") + '" x="12" y="' + (y + 17) + '" width="104" height="22" rx="5"/>';
          if (t && ys[t] != null) {
            o += '<text class="ov-ad" x="64" y="' + (y + 32) + '" text-anchor="middle">сілтеме</text>';
            o += '<path class="ov-arrow" d="M116 ' + (y + 28) + " C138 " + (y + 28) + " 138 " + ys[t] + " 160 " + ys[t] + '" marker-end="url(#' + uid + 'a)"/>';
          } else o += '<text class="ov-val" x="64" y="' + (y + 32) + '" text-anchor="middle">null</text>';
        });
        return '<svg class="ov-svg" viewBox="0 0 340 184" aria-hidden="true" focusable="false">' + o + "</svg>";
      },
      sum: function (st) {
        var t = "Стек: ";
        Object.keys(st.v).forEach(function (n) { t += n + (st.v[n] ? " → " + st.v[n] + "-нысан; " : " = null; "); });
        t += "Үйме: " + (st.o.length ? st.o.map(function (o) { return o.id + "-нысан (" + o.t + ")"; }).join(", ") : "бос") + ".";
        return t;
      }
    };
  })();

  /* =====================================================================
   * 5) java-hashmap
   * ===================================================================== */
  (function () {
    function jh(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; return h; }
    function sp(h) { return (h ^ (h >>> 16)) | 0; }
    var init = function () { return { n: 0, thr: 0, size: 0, tab: [], calc: null, hi: -1, found: "" }; };
    var code = ["Map<String, Integer> m = new HashMap<>(4);", "m.put(\"Astana\", 1350);", "m.put(\"Almaty\", 2000);", "m.put(\"Atyrau\", 300);", "m.put(\"Qaraghandy\", 500);", "m.put(\"Shymkent\", 1200);", "System.out.println(m.get(\"Shymkent\"));"];
    var steps = [];
    function calc(st, k, extra) { var h = jh(k), s2 = sp(h); st.calc = { k: k, h: h, sp: s2, n: st.n, idx: s2 & (st.n - 1) }; st.hi = st.calc.idx; st.found = ""; st.fresh = []; if (extra) extra(st); }
    steps.push(S(0, "new HashMap<>(4): бастапқы сыйымдылық 4. Кесте (table) әлі құрылмаған, бірінші put кезінде 4 бакет бөлінеді. Шек (threshold) = 4 × 0.75 = 3.", function (s) { s.thr = 3; s.pending = 4; }));
    function put(L, k, v) {
      var st0 = { n: 0 };
      steps.push(S(L, "", function (s) {
        if (!s.n) { s.n = s.pending; s.tab = []; for (var i = 0; i < s.n; i++) s.tab.push([]); }
        calc(s, k);
        s.dsc = 1;
      }, { dyn: function (s) {
        var c = s.calc;
        return "put(\"" + k + "\"): hashCode() = " + c.h + ". Биттерді араластыру: h ^ (h >>> 16) = " + c.sp + ". Бакет индексі = " + c.sp + " & (n-1) = " + c.sp + " & " + (c.n - 1) + " = " + c.idx + "." + (s.size === 0 && s.tab.length === 4 && s.tab.every(function (b) { return !b.length; }) ? " (Бірінші put: кесте жасалды.)" : "");
      } }));
      steps.push(S(L, "", function (s) {
        var b = s.tab[s.calc.idx];
        s.pdsc = b.length ? "coll" : "free";
        b.push({ k: k, v: v, c: "new" }); s.size++; s.fresh = [s.calc.idx + ":" + (b.length - 1)];
      }, { dyn: function (s) {
        var b = s.tab[s.calc.idx];
        return b.length === 1 ? "Бакет " + s.calc.idx + " бос: түйін (\"" + k + "\", " + v + ") тікелей орналасты. size = " + s.size + "."
          : "Коллизия! Бакет " + s.calc.idx + " бос емес. Әр түйінде hash және equals() тексеріледі: кілт табылмады, сондықтан жаңа түйін тізбектің соңына тағылды. size = " + s.size + ".";
      } }));
      return;
    }
    function resizeStep(L) {
      steps.push(S(L, "", function (s) {
        var nn = s.n * 2, nt = []; for (var i = 0; i < nn; i++) nt.push([]);
        s.tab.forEach(function (b) { b.forEach(function (nd) { nt[sp(jh(nd.k)) & (nn - 1)].push({ k: nd.k, v: nd.v, c: "new" }); }); });
        s.tab = nt; s.n = nn; s.thr = Math.floor(nn * 0.75); s.calc = null; s.hi = -1; s.fresh = [];
      }, { dyn: function (s) { return "size (4) > шек (3): resize! Кесте 2 есе үлкейді: n = " + s.n + ", жаңа шек = " + s.thr + ". Әр түйін жаңа индексті (h & " + (s.n - 1) + ") қайта есептейді: түйіндер қайта таратылады (rehash). Коллизия кетті."; } }));
    }
    put(1, "Astana", 1350); put(2, "Almaty", 2000); put(3, "Atyrau", 300); put(4, "Qaraghandy", 500);
    // 4-put-тан кейін size=4 > thr=3 болады: resize қосамыз
    resizeStep(4);
    put(5, "Shymkent", 1200);
    steps.push(S(6, "", function (s) { calc(s, "Shymkent"); s.hi = s.calc.idx; }, { dyn: function (s) { return "get(\"Shymkent\"): сол жолмен hashCode() = " + s.calc.h + " → индекс = " + s.calc.idx + ". Тек осы бакетті қарау жеткілікті: барлық кестені аралаудың керегі жоқ."; } }));
    steps.push(S(6, "", function (s) { s.tab[s.calc.idx].forEach(function (nd, i) { nd.c = i === 0 ? "chk" : ""; }); s.fresh = []; },
      { dyn: function (s) { var f = s.tab[s.calc.idx][0]; return "Тізбектегі 1-түйін: \"" + f.k + "\". hash сәйкес емес (" + sp(jh(f.k)) + " ≠ " + s.calc.sp + "), equals() false: келесі түйінге өтеміз."; } }));
    steps.push(S(6, "", function (s) { s.tab[s.calc.idx].forEach(function (nd) { nd.c = nd.k === "Shymkent" ? "found" : ""; }); s.out = ["1200"]; },
      { dyn: function (s) { return "2-түйін: \"Shymkent\" - hash та, equals() та сәйкес. Мәні 1200 қайтарылды."; },
        res: { ok: true, t: "1200. HashMap кілттен бірден бакетке барады; бакетте 1-2 түйін ғана болса, get() орташа O(1)." } }));
    var variant = { label: "put / get / resize", code: code, init: init, steps: steps };
    DEFS["java-hashmap"] = {
      title: "HashMap: put, get және resize",
      intro: "Бастапқы күй: HashMap әлі жасалған жоқ. «Алға» батырмасын басыңыз.",
      variants: [variant],
      render: function (st) {
        var h = "";
        if (st.calc) {
          var c = st.calc;
          h += '<div class="ov-calc"><div><span>кілт</span><b>"' + esc(c.k) + '"</b></div><div><span>hashCode()</span><b>' + c.h + '</b></div><div><span>h ^ (h &gt;&gt;&gt; 16)</span><b>' + c.sp + '</b></div><div><span>&amp; (n-1) = &amp; ' + (c.n - 1) + '</span><b class="idx">индекс ' + c.idx + "</b></div></div>";
        }
        h += '<div class="ov-stat"><span>size = <b>' + st.size + '</b></span><span>кесте өлшемі n = <b>' + st.n + '</b></span><span>шек = <b>' + st.thr + "</b></span></div>";
        if (!st.n) return h + '<p class="ov-empty">Бакеттер әлі жоқ (table = null).</p>';
        h += '<ol class="ov-buckets" start="0">';
        st.tab.forEach(function (b, i) {
          h += '<li class="' + (st.hi === i ? "hi" : "") + '"><span class="ov-bi">' + i + '</span><span class="ov-chain">';
          if (!b.length) h += '<span class="ov-none">бос</span>';
          b.forEach(function (nd, j) {
            if (j) h += '<span class="ov-ar" aria-hidden="true">→</span>';
            h += '<span class="ov-node ' + (nd.c || "") + (st.fresh.indexOf(i + ":" + j) > -1 ? " pop" : "") + '">' + esc(nd.k) + ": " + nd.v + "</span>";
          });
          h += "</span></li>";
        });
        return h + "</ol>";
      },
      sum: function (st) {
        var t = "size = " + st.size + ", кесте өлшемі " + st.n + ". ";
        st.tab.forEach(function (b, i) { if (b.length) t += "Бакет " + i + ": " + b.map(function (x) { return x.k; }).join(" → ") + ". "; });
        if (st.calc) t += "Соңғы есеп: " + st.calc.k + " үшін индекс " + st.calc.idx + ".";
        return t;
      }
    };
    // dyn сипаттамаларын engine-ге кіріктіру
  })();

  /* =====================================================================
   * 6) java-threads
   * ===================================================================== */
  (function () {
    var init = function () { return { counter: 0, ra: null, rb: null, tl: [], lock: "", ct: 0, started: 0 }; };
    function tick(s, who, txt, cls) { s.ct++; s.tl.push({ t: s.ct, w: who, x: txt, c: cls || "", m: s.counter }); }
    function codeFor(sync) {
      return ["static int counter = 0;", sync ? "static synchronized void arttyr() {" : "static void arttyr() {", "    counter++;   // оқу, қосу, жазу", "}",
        "Thread a = new Thread(Main::arttyr);", "Thread b = new Thread(Main::arttyr);", "a.start(); b.start();", "a.join(); b.join();", "System.out.println(counter);"];
    }
    function head(sync) {
      return [
        S(0, "Ортақ counter айнымалысы: екі ағын да оны көреді. Басында 0.", null),
        S(4, "a ағыны жасалды (әзірше жұмыс істемейді).", null),
        S(5, "b ағыны жасалды.", null),
        S(6, "start(): екі ағын бір мезгілде жұмысқа қосылды. Қайсысы қашан орындалатынын операциялық жүйе (планировщик) шешеді - біз білмейміз." + (sync ? "" : " counter++ - бір қадам емес, үш: оқу, қосу, жазу."), function (s) { s.started = 1; })
      ];
    }
    function tail(res, extra) {
      return [
        S(7, "join(): басты ағын екі ағынның аяқталуын күтті.", null),
        S(8, "counter басылды: " + extra, function (s) { s.out = [String(s.counter)]; }, { res: res, bad: !res.ok })
      ];
    }
    var resBad = { ok: false, t: "counter = 1, ал күтілгені 2. Екі counter++ орындалды, бірақ біреуі жоғалды: race condition (lost update). Қайта іске қосқанда нәтиже өзгеруі мүмкін - қате кездейсоқ байқалады." };
    var race = head(false).concat([
      S(2, "Ағын A: counter-ді оқыды, өз регистріне 0 алды.", function (s) { s.ra = s.counter; tick(s, "A", "оқу: regA = " + s.ra); }),
      S(2, "ОЖ ағынды ауыстырды! Ағын B де counter-ді оқыды - ол әлі 0, себебі A жаңа мәнді жазған жоқ.", function (s) { s.rb = s.counter; tick(s, "B", "оқу: regB = " + s.rb); }, { bad: true }),
      S(2, "Ағын A: regA + 1 = 1 (әзірше тек регистрде).", function (s) { s.ra += 1; tick(s, "A", "қосу: regA = " + s.ra); }),
      S(2, "Ағын B: regB + 1 = 1 (ол да 0-ден есептеді).", function (s) { s.rb += 1; tick(s, "B", "қосу: regB = " + s.rb); }),
      S(2, "Ағын A: counter = 1 деп жазды.", function (s) { s.counter = s.ra; tick(s, "A", "жазу: counter = " + s.ra); }),
      S(2, "Ағын B: ол да counter = 1 деп жазды - A-ның жұмысы үстінен басылды. Бір қосу жоғалды!", function (s) { s.counter = s.rb; tick(s, "B", "жазу: counter = " + s.rb, "lost"); }, { bad: true })
    ]).concat(tail(resBad, "1 (күтілгені 2!)"));
    var lucky = head(false).concat([
      S(2, "Ағын A: counter-ді оқыды (0).", function (s) { s.ra = s.counter; tick(s, "A", "оқу: regA = " + s.ra); }),
      S(2, "Ағын A: 0 + 1 = 1.", function (s) { s.ra += 1; tick(s, "A", "қосу: regA = " + s.ra); }),
      S(2, "Ағын A: counter = 1 деп жазды.", function (s) { s.counter = s.ra; tick(s, "A", "жазу: counter = " + s.ra); }),
      S(2, "Ағын B енді ғана бастады: counter-ді оқыды - 1 (A жазып үлгерді).", function (s) { s.rb = s.counter; tick(s, "B", "оқу: regB = " + s.rb); }),
      S(2, "Ағын B: 1 + 1 = 2.", function (s) { s.rb += 1; tick(s, "B", "қосу: regB = " + s.rb); }),
      S(2, "Ағын B: counter = 2 деп жазды.", function (s) { s.counter = s.rb; tick(s, "B", "жазу: counter = " + s.rb); })
    ]).concat(tail({ ok: "warn", t: "counter = 2: бұл жолы дұрыс, бірақ тек сәтті кезек болғандықтан. Сол код келесі іске қосуда 1 беруі мүмкін. Тест бір рет өтті - қате жоқ дегенді білдірмейді." }, "2 (бұл жолы сәтті)"));
    var sync = head(true).concat([
      S(1, "Ағын A synchronized әдіске кірді: counter нысанының құлпын (monitor) алды.", function (s) { s.lock = "A"; tick(s, "A", "құлыпты алды", "lock"); }),
      S(2, "Ағын A: counter-ді оқыды (0).", function (s) { s.ra = s.counter; tick(s, "A", "оқу: regA = " + s.ra); }),
      S(1, "Ағын B де кіргісі келді, бірақ құлып A-да. B BLOCKED күйінде күтеді: ортақ айнымалыға тек бір ағын тиеді.", function (s) { tick(s, "B", "күтеді (құлып A-да)", "wait"); }),
      S(2, "Ағын A: 0 + 1 = 1.", function (s) { s.ra += 1; tick(s, "A", "қосу: regA = " + s.ra); }),
      S(2, "Ағын A: counter = 1 деп жазды.", function (s) { s.counter = s.ra; tick(s, "A", "жазу: counter = " + s.ra); }),
      S(3, "Ағын A әдістен шықты: құлып босатылды.", function (s) { s.lock = ""; tick(s, "A", "құлыпты босатты", "lock"); }),
      S(1, "Енді B құлыпты алды.", function (s) { s.lock = "B"; tick(s, "B", "құлыпты алды", "lock"); }),
      S(2, "Ағын B: counter-ді оқыды - 1 (A жазып болған).", function (s) { s.rb = s.counter; tick(s, "B", "оқу: regB = " + s.rb); }),
      S(2, "Ағын B: 1 + 1 = 2.", function (s) { s.rb += 1; tick(s, "B", "қосу: regB = " + s.rb); }),
      S(2, "Ағын B: counter = 2 деп жазды.", function (s) { s.counter = s.rb; tick(s, "B", "жазу: counter = " + s.rb); }),
      S(3, "Ағын B құлыпты босатты.", function (s) { s.lock = ""; tick(s, "B", "құлыпты босатты", "lock"); })
    ]).concat(tail({ ok: true, t: "counter = 2 - әр жолы. synchronized әр кезде тек бір ағынды ішке жібереді, сондықтан оқу-қосу-жазу бөлінбейді. Баламасы: AtomicInteger." }, "2"));
    DEFS["java-threads"] = {
      title: "Екі ағын және counter++: race condition",
      intro: "Бастапқы күй: ағындар әлі жоқ. «Алға» батырмасымен екі ағынның әрекеттерін уақыт бойынша қадамдап көріңіз.",
      variants: [
        { label: "Сәтсіз кезек (race)", code: codeFor(false), init: init, steps: race },
        { label: "Сәтті кезек (кездейсоқ)", code: codeFor(false), init: init, steps: lucky },
        { label: "synchronized", code: codeFor(true), init: init, steps: sync }
      ],
      render: function (st) {
        var h = '<div class="ov-stat"><span>ортақ counter = <b class="ov-cnt">' + st.counter + "</b></span><span>құлып: <b>" + (st.lock ? st.lock + " ағыны ұстап тұр" : "бос") + "</b></span></div>";
        h += '<table class="ov-tl"><caption class="sr-only">Уақыт сызығы: ағындардың әрекеттері</caption><thead><tr><th scope="col">t</th><th scope="col">Ағын A</th><th scope="col">Ағын B</th><th scope="col">counter</th></tr></thead><tbody>';
        if (!st.tl.length) h += '<tr><td colspan="4" class="ov-none">Әзірше әрекет жоқ</td></tr>';
        st.tl.forEach(function (r, i) {
          var last = i === st.tl.length - 1 ? " last" : "";
          h += '<tr class="' + last + '"><td>' + r.t + "</td>" + (r.w === "A" ? '<td class="act ' + r.c + '">' + esc(r.x) + "</td><td></td>" : '<td></td><td class="act ' + r.c + '">' + esc(r.x) + "</td>") + "<td>" + r.m + "</td></tr>";
        });
        return h + "</tbody></table>";
      },
      sum: function (st) {
        return "counter = " + st.counter + ". " + (st.tl.length ? "Соңғы әрекет: Ағын " + st.tl[st.tl.length - 1].w + " - " + st.tl[st.tl.length - 1].x + "." : "Әзірше әрекет жоқ.");
      }
    };
  })();

  /* =====================================================================
   * Қозғалтқыш
   * ===================================================================== */
  function mount(root) {
    var def = DEFS[root.getAttribute("data-viz")];
    if (!def || root.getAttribute("data-ov-ready")) return;
    root.setAttribute("data-ov-ready", "1");
    var uid = "ov" + (++UID), title = root.getAttribute("data-title") || def.title;
    var vi = 0, step = 0, timer = null, snaps = [], steps = [], V;
    root.classList.add("ov");
    root.setAttribute("tabindex", "0");
    root.setAttribute("role", "group");
    root.setAttribute("aria-label", title + ": қадамдап көрсету");
    root.innerHTML =
      '<div class="ov-head"><div class="ov-title">' + esc(title) + '</div><div class="ov-variants" role="group" aria-label="Нұсқа таңдау"></div></div>' +
      '<div class="ov-body"><ol class="ov-code" aria-label="Код"></ol><div class="ov-stagewrap"><div class="ov-stage" role="img"></div></div></div>' +
      '<div class="ov-live" aria-live="polite" aria-atomic="true"><p class="ov-desc"></p><p class="ov-result" hidden></p></div>' +
      '<div class="ov-ctrl"><button type="button" class="ov-btn ov-reset"><span aria-hidden="true">⏮ </span>Бастапқы</button>' +
      '<button type="button" class="ov-btn ov-prev"><span aria-hidden="true">◀ </span>Артқа</button>' +
      '<button type="button" class="ov-btn ov-next primary">Алға<span aria-hidden="true"> ▶</span></button>' +
      '<button type="button" class="ov-btn ov-play" aria-pressed="false"><span class="ov-pi" aria-hidden="true">▶ </span>Автоойнату</button></div>' +
      '<div class="ov-slide"><input type="range" class="ov-range" min="0" max="0" value="0" aria-label="Қадам нөмірі"><span class="ov-count"></span></div>' +
      '<p class="ov-hint">Пернетақта: ← Артқа, → Алға, Home - басына.</p>';
    var $ = function (s) { return root.querySelector(s); };
    var elCode = $(".ov-code"), elStage = $(".ov-stage"), elDesc = $(".ov-desc"), elRes = $(".ov-result"), elVar = $(".ov-variants");
    var bPrev = $(".ov-prev"), bNext = $(".ov-next"), bReset = $(".ov-reset"), bPlay = $(".ov-play"), rng = $(".ov-range"), cnt = $(".ov-count");

    function compile(i) {
      vi = i; V = def.variants[i]; steps = [{ l: -1, d: def.intro }].concat(V.steps);
      snaps = []; var st = clone(V.init()), prev = st;
      steps.forEach(function (sp, k) {
        var s = clone(prev); s.fresh = [];
        if (sp.f) sp.f(s);
        snaps.push(s); prev = s;
        if (sp.dyn) sp.d = sp.dyn(s);
      });
      elCode.innerHTML = V.code.map(function (c, k) { return '<li><code>' + esc(c) + "</code></li>"; }).join("");
      rng.max = String(steps.length - 1);
      step = 0;
      if (def.variants.length > 1) {
        elVar.innerHTML = def.variants.map(function (v, k) { return '<button type="button" class="ov-vb' + (k === vi ? " on" : "") + '" data-k="' + k + '" aria-pressed="' + (k === vi) + '">' + esc(v.label) + "</button>"; }).join("");
      } else elVar.hidden = true;
    }
    function paint() {
      var sp = steps[step], st = snaps[step], last = step === steps.length - 1;
      var lis = elCode.children, i;
      for (i = 0; i < lis.length; i++) {
        var on = i === sp.l;
        lis[i].classList.toggle("on", on);
        if (on) lis[i].setAttribute("aria-current", "step"); else lis[i].removeAttribute("aria-current");
      }
      elDesc.textContent = sp.d;
      elDesc.classList.toggle("bad", !!sp.bad);
      if (sp.res && sp.res.t) {
        elRes.hidden = false; elRes.textContent = "Нәтиже: " + sp.res.t;
        elRes.className = "ov-result " + (sp.res.ok === true ? "ok" : sp.res.ok === "warn" ? "warn" : "bad");
      } else { elRes.hidden = true; elRes.textContent = ""; }
      var html = def.render(st, { uid: uid + "v" + vi, step: step });
      if (st.out && st.out.length) html += '<pre class="ov-out" aria-hidden="true"><span class="ov-out-h">консоль</span>' + st.out.map(esc).join("\n") + "</pre>";
      elStage.innerHTML = html;
      elStage.setAttribute("aria-label", "Күй: " + def.sum(st) + (st.out && st.out.length ? " Консольде: " + st.out.join(", ") + "." : ""));
      cnt.textContent = "Қадам " + step + " / " + (steps.length - 1);
      rng.value = String(step);
      bPrev.disabled = bReset.disabled = step === 0;
      bNext.disabled = last;
      if (last) stop();
      root.setAttribute("data-step", String(step));
    }
    function go(n) { n = Math.max(0, Math.min(steps.length - 1, n)); if (n === step) return; step = n; paint(); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } bPlay.setAttribute("aria-pressed", "false"); bPlay.querySelector(".ov-pi").textContent = "▶ "; }
    function play() {
      if (timer) { stop(); return; }
      if (step >= steps.length - 1) { step = 0; paint(); }
      bPlay.setAttribute("aria-pressed", "true"); bPlay.querySelector(".ov-pi").textContent = "⏸ ";
      timer = setInterval(function () { if (step >= steps.length - 1) stop(); else go(step + 1); }, 1500);
    }
    bNext.addEventListener("click", function () { stop(); go(step + 1); });
    bPrev.addEventListener("click", function () { stop(); go(step - 1); });
    bReset.addEventListener("click", function () { stop(); go(0); });
    bPlay.addEventListener("click", play);
    rng.addEventListener("input", function () { stop(); go(+rng.value); });
    elVar.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest(".ov-vb") : null; if (!b) return;
      stop(); compile(+b.getAttribute("data-k")); paint();
    });
    root.addEventListener("keydown", function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target && e.target.tagName === "INPUT") { if (e.key === "ArrowLeft" || e.key === "ArrowRight") e.stopPropagation(); return; } // slider өз көрсеткі пернелерін өңдейді; бет навигациясына жібермейміз
      if (e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); stop(); go(step + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); stop(); go(step - 1); }
      else if (e.key === "Home") { e.preventDefault(); stop(); go(0); }
    });
    compile(0); paint();
  }

  function initAll() { var n = document.querySelectorAll(".own-viz[data-viz]"); for (var i = 0; i < n.length; i++) { try { mount(n[i]); } catch (e) { if (window.console) console.warn("own-viz:", e); } } }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAll); else initAll();
  window.OwnViz = { mount: mount, init: initAll };
})();
