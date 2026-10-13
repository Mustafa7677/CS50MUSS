// CS50 Web 0-апта: HTML/CSS автотексерушісінің тесттері (бетті қорғалған iframe-де жинап, браузерден есептелген стильді сұрайды).
window.CS50KZ_JSCHECKS = Object.assign(window.CS50KZ_JSCHECKS || {}, {
 "js-semantic-page": {
  "title": "Семантикалық бет: HTML құрылымы және CSS (сайттың өз жаттығуы)",
  "file": "const html және const css",
  "starter": "// Бет кодын осы екі жолдың ішіне жазыңыз (кері тырнақша ` ` арасына).\n// Ішінде ${ тіркесі болмасын.\n\nconst html = `\n<!-- TODO: <header> (h1 және nav), <main> (section-дар), <footer> -->\n`;\n\nconst css = `\n/* TODO: body, header, nav a, .class, #id және :hover ережелері */\n`;\n",
  "tests": [
   {
    "n": "Дайындық: html және css айнымалылары толтырылған",
    "run": "chk(\"setup\", html, css)",
    "out": "OK"
   },
   {
    "n": "<header> ішінде бір ғана бос емес <h1> бар",
    "run": "chk(\"header-h1\", html, css)",
    "out": "OK"
   },
   {
    "n": "<nav> ішінде <ul> тізімі және кемінде 3 сілтеме",
    "run": "chk(\"nav-list\", html, css)",
    "out": "OK"
   },
   {
    "n": "Мәзір сілтемелері бет бөлімдеріне апарады (href=\"#id\")",
    "run": "chk(\"nav-anchors\", html, css)",
    "out": "OK"
   },
   {
    "n": "<main> ішінде кемінде 2 <section>, әрқайсысында <h2>",
    "run": "chk(\"main-sections\", html, css)",
    "out": "OK"
   },
   {
    "n": "<main> ішінде <ul> не <ol> тізімі, кемінде 3 <li>",
    "run": "chk(\"main-list\", html, css)",
    "out": "OK"
   },
   {
    "n": "Сурет: <img> src және мағыналы alt-пен",
    "run": "chk(\"img-alt\", html, css)",
    "out": "OK"
   },
   {
    "n": "<footer> бар және бос емес",
    "run": "chk(\"footer\", html, css)",
    "out": "OK"
   },
   {
    "n": "CSS: body шрифті sans-serif тобынан",
    "run": "chk(\"css-font\", html, css)",
    "out": "OK"
   },
   {
    "n": "CSS: header фоны өзгертілген",
    "run": "chk(\"css-header-bg\", html, css)",
    "out": "OK"
   },
   {
    "n": "CSS: header мәтіні мен фонының контрасты жеткілікті (кемінде 4.5)",
    "run": "chk(\"css-contrast\", html, css)",
    "out": "OK"
   },
   {
    "n": "CSS: nav a сілтемелері әдепкі көк емес және асты сызылмаған",
    "run": "chk(\"css-nav-a\", html, css)",
    "out": "OK"
   },
   {
    "n": "CSS: .class селекторы - main ішіндегі элементке padding және border-radius",
    "run": "chk(\"css-class\", html, css)",
    "out": "OK"
   },
   {
    "n": "CSS: #id селекторы бар және бетте элементті таңдайды",
    "run": "chk(\"css-id\", html, css)",
    "out": "OK"
   },
   {
    "n": "CSS: :hover ережесі бар (меңзер үстіне келгенде өзгереді)",
    "run": "chk(\"css-hover\", html, css)",
    "out": "OK"
   }
  ],
  "note": "HTML-ді html жолының, CSS-ті css жолының ішіне (кері тырнақша ` ` арасына) жазыңыз; DOCTYPE, <html>, <head> керек емес, тек <body> мазмұны. Қате болса, «Сіздің нәтижеңіз» жолында не түзету керек екені жазылады.",
  "html": "<script>\n(function () {\n  var $ = function (q) { return document.querySelector(q); };\n  var $$ = function (q) { return Array.prototype.slice.call(document.querySelectorAll(q)); };\n  var cs = function (e) { return getComputedStyle(e); };\n  var rgb = function (c) { return (c.match(/[\\d.]+/g) || []).map(Number); };\n  var lum = function (c) { var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };\n  var contrast = function (a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };\n  var rules = function () { return [].concat.apply([], $$('style').map(function (s) { return [].slice.call(s.sheet.cssRules); })).filter(function (r) { return r.selectorText; }); };\n  var transparent = function (c) { return c.length === 4 && c[3] === 0; };\n  var K = {\n    'header-h1': function () {\n      var hd = $('header'); if (!hd) return '<header> элементі жоқ: беттің жоғарғы бөлігін <header> ішіне салыңыз';\n      var h = $$('h1'); if (h.length !== 1) return '<h1> дәл біреу болуы керек, қазір ' + h.length + ' дана';\n      if (!hd.contains(h[0])) return '<h1> <header> ішінде тұруы керек';\n      if (!h[0].textContent.trim()) return '<h1> бос: бет тақырыбын жазыңыз';\n    },\n    'nav-list': function () {\n      var nav = $('nav'); if (!nav) return '<nav> элементі жоқ: мәзірді <nav> ішіне салыңыз';\n      if (!nav.querySelector('ul')) return '<nav> ішінде <ul> тізімі болуы керек';\n      var a = $$('nav ul li a[href]'); if (a.length < 3) return '<nav><ul><li><a href=...> құрылымымен кемінде 3 сілтеме керек, қазір ' + a.length;\n    },\n    'nav-anchors': function () {\n      var a = $$('nav a[href]'); if (!a.length) return 'nav ішінде сілтеме жоқ';\n      for (var i = 0; i < a.length; i++) { var h = a[i].getAttribute('href');\n        if (h.charAt(0) !== '#' || h.length < 2) return '«' + h + '» сілтемесі бет ішіндегі бөлімге апармайды: href=\"#about\" түрінде жазыңыз';\n        if (!document.getElementById(h.slice(1))) return 'href=\"' + h + '\" сілтемесі үшін id=\"' + h.slice(1) + '\" бар элемент табылмады'; }\n    },\n    'main-sections': function () {\n      var m = $$('main'); if (m.length !== 1) return '<main> дәл біреу болуы керек, қазір ' + m.length;\n      var s = [].slice.call(m[0].querySelectorAll('section')); if (s.length < 2) return '<main> ішінде кемінде 2 <section> керек, қазір ' + s.length;\n      for (var i = 0; i < s.length; i++) if (!s[i].querySelector('h2')) return (i + 1) + '-ші <section> ішінде <h2> тақырыбы жоқ';\n    },\n    'main-list': function () {\n      var l = $$('main ul > li, main ol > li'); if (l.length < 3) return '<main> ішінде <ul>/<ol> тізімі кемінде 3 <li>-мен керек, қазір ' + l.length + ' <li> табылды';\n    },\n    'img-alt': function () {\n      var i = $('img'); if (!i) return '<img> жоқ: бетке сурет қосыңыз';\n      if (!(i.getAttribute('src') || '').trim()) return '<img> элементінде src бос';\n      if ((i.getAttribute('alt') || '').trim().length < 3) return '<img> элементінде alt жоқ не тым қысқа: суретті сөзбен сипаттаңыз (скринридер оқиды)';\n    },\n    'footer': function () {\n      var f = $('footer'); if (!f) return '<footer> жоқ: беттің төменгі бөлігін <footer> ішіне салыңыз';\n      if (!f.textContent.trim()) return '<footer> бос: мәтін жазыңыз (мысалы, автор мен жыл)';\n    },\n    'css-font': function () {\n      var f = cs(document.body).fontFamily; if (!/sans-serif/i.test(f)) return 'body { font-family: ...; } ішінде sans-serif болуы керек, қазір: ' + (f || '(әдепкі)');\n    },\n    'css-header-bg': function () {\n      var hd = $('header'); if (!hd) return '<header> жоқ';\n      if (transparent(rgb(cs(hd).backgroundColor))) return 'header { background-color: ...; } жоқ: фон әлі мөлдір';\n    },\n    'css-contrast': function () {\n      var hd = $('header'), h = $('header h1'); if (!hd || !h) return '<header> ішінде <h1> керек';\n      var bg = rgb(cs(hd).backgroundColor); if (transparent(bg)) return 'алдымен header-ге фон түсін беріңіз';\n      var r = contrast(rgb(cs(h).color), bg); if (r < 4.5) return 'контраст ' + r.toFixed(1) + ':1 - тым әлсіз, кемінде 4.5:1 керек (қою фонға ашық мәтін не керісінше)';\n    },\n    'css-nav-a': function () {\n      var a = $('nav a'); if (!a) return 'nav ішінде сілтеме жоқ'; var s = cs(a);\n      if (s.color === 'rgb(0, 0, 238)') return 'nav a { color: ...; } беріңіз: сілтеме әлі әдепкі көк түсте';\n      if (s.textDecorationLine !== 'none') return 'nav a { text-decoration: none; } жазыңыз, қазір: ' + s.textDecorationLine;\n    },\n    'css-class': function () {\n      var e = $$('main [class]'); if (!e.length) return 'main ішінде class=\"...\" атрибуты бар элемент жоқ';\n      if (!e.some(function (x) { return parseFloat(cs(x).paddingTop) > 0 && parseFloat(cs(x).borderTopLeftRadius) > 0; })) return 'class-ты элементке CSS-те .аты { padding: ...; border-radius: ...; } беріңіз (екеуі де 0-ден үлкен)';\n    },\n    'css-id': function () {\n      var ok = rules().some(function (r) { return r.selectorText.split(',').some(function (p) { p = p.trim(); if (!/#[\\w-]/.test(p)) return false;\n        try { return !!document.querySelector(p.replace(/::?[\\w-]+(\\([^)]*\\))?/g, '')); } catch (e) { return false; } }); });\n      if (!ok) return 'CSS-те #id селекторы жоқ (мысалы #about { ... }) не оған сәйкес id-ы бар элемент бетте жоқ';\n    },\n    'css-hover': function () {\n      if (!rules().some(function (r) { return /:hover/.test(r.selectorText); })) return 'CSS-те :hover ережесі жоқ, мысалы: nav a:hover { ... }';\n    }\n  };\n  window.chk = function (name, html, css) {\n    if (typeof html !== 'string' || typeof css !== 'string') return 'html және css айнымалылары болуы керек: const html = `...`; const css = `...`; (екеуі де кері тырнақша ` ` ішіндегі жол)';\n    if (html.trim().length < 30) return 'html айнымалысы бос көрінеді: беттің кодын кері тырнақшалардың ` ` ішіне жазыңыз';\n    $$('style').forEach(function (s) { s.remove(); });\n    document.body.innerHTML = html;\n    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);\n    if (name === 'setup') return 'OK';\n    return K[name]() || 'OK';\n  };\n})();\n</script>"
 },
 "js-flex-grid": {
  "title": "Flexbox пен Grid: карточкалар беті (сайттың өз жаттығуы)",
  "file": "const css",
  "starter": "// HTML беті дайын. Тек CSS жазыңыз (кері тырнақша ` ` арасына).\n\nconst css = `\n.bar {\n    /* TODO: flex, логотип солда, мәзір оңда, тік ортада */\n}\n\n.menu {\n    /* TODO: flex және сілтемелер арасы */\n}\n\n.grid {\n    /* TODO: 3 бағанды тор, карточкалар арасы */\n}\n\n.card {\n    /* TODO: padding, border-radius */\n}\n\n.foot {\n    /* TODO: flex, мазмұны ортада */\n}\n\n/* TODO: @media (max-width: 600px) - телефонда бір бағана */\n`;\n",
  "tests": [
   {
    "n": "Дайындық: css айнымалысы толтырылған",
    "run": "chk(\"setup\", css)",
    "out": "OK"
   },
   {
    "n": ".bar: display: flex",
    "run": "chk(\"bar-flex\", css)",
    "out": "OK"
   },
   {
    "n": ".bar: justify-content: space-between (логотип солда, мәзір оңда)",
    "run": "chk(\"bar-justify\", css)",
    "out": "OK"
   },
   {
    "n": ".bar: align-items: center (тік ортаға туралау)",
    "run": "chk(\"bar-align\", css)",
    "out": "OK"
   },
   {
    "n": ".menu: flex және сілтемелер арасында gap бар",
    "run": "chk(\"menu-gap\", css)",
    "out": "OK"
   },
   {
    "n": ".grid: display: grid",
    "run": "chk(\"grid-display\", css)",
    "out": "OK"
   },
   {
    "n": ".grid: дәл 3 бағана (grid-template-columns)",
    "run": "chk(\"grid-cols\", css)",
    "out": "OK"
   },
   {
    "n": ".grid: карточкалар арасы кемінде 8px (gap)",
    "run": "chk(\"grid-gap\", css)",
    "out": "OK"
   },
   {
    "n": ".card: padding және border-radius",
    "run": "chk(\"card\", css)",
    "out": "OK"
   },
   {
    "n": ".foot: flex және мазмұны ортада (justify-content: center)",
    "run": "chk(\"foot\", css)",
    "out": "OK"
   },
   {
    "n": "@media (max-width: ...): телефонда .grid бір бағана болады",
    "run": "chk(\"media\", css)",
    "out": "OK"
   }
  ],
  "note": "HTML беті дайын (тапсырма мәтініндегі кодты қараңыз), тек CSS жазасыз: const css = `...`; жолының ішіне. Қате болса, «Сіздің нәтижеңіз» жолында не түзету керек екені жазылады.",
  "html": "<header class=\"bar\"><div class=\"logo\">CS50 Қазақша</div><nav class=\"menu\"><a href=\"#\">Басты</a><a href=\"#\">Курстар</a><a href=\"#\">Байланыс</a></nav></header><main class=\"grid\"><article class=\"card\"><h3>HTML</h3><p>Бет құрылымы</p></article><article class=\"card\"><h3>CSS</h3><p>Стиль мен түс</p></article><article class=\"card\"><h3>Bootstrap</h3><p>Дайын компоненттер</p></article><article class=\"card\"><h3>Flexbox</h3><p>Бір өлшемді орналасу</p></article><article class=\"card\"><h3>Grid</h3><p>Екі өлшемді тор</p></article><article class=\"card\"><h3>Sass</h3><p>Айнымалылар мен ұя</p></article></main><footer class=\"foot\"><span>© 2026 CS50 Қазақша</span><span>Алматы</span></footer><script>\n(function () {\n  var q = function (s) { var e = document.querySelector(s); return e ? getComputedStyle(e) : null; };\n  var px = function (v) { return parseFloat(v) || 0; };\n  var count = function (v) { v = (v || '').trim(); if (!v || v === 'none') return 0; var n = 0, d = 0, t = false;\n    v = v.replace(/repeat\\(\\s*(\\d+)\\s*,\\s*((?:[^()]|\\([^()]*\\))*)\\)/g, function (m, k, b) { return new Array(+k + 1).join(b + ' '); });\n    for (var i = 0; i < v.length; i++) { var ch = v.charAt(i); if (ch === '(') d++; if (ch === ')') d--; if (/\\s/.test(ch) && d === 0) t = false; else if (!t) { t = true; n++; } } return n; };\n  var flex = function (sel) { var s = q(sel); return s.display === 'flex' ? null : sel + ' { display: flex; } жазыңыз, қазір display: ' + s.display; };\n  var grid = function () { var s = q('.grid'); return s.display === 'grid' ? null : '.grid { display: grid; } жазыңыз, қазір display: ' + s.display; };\n  var K = {\n    'bar-flex': function () { return flex('.bar'); },\n    'bar-justify': function () { var s = q('.bar'); return flex('.bar') ? 'алдымен .bar { display: flex; } жазыңыз' : s.justifyContent === 'space-between' ? null : '.bar { justify-content: space-between; } керек, қазір: ' + s.justifyContent; },\n    'bar-align': function () { var s = q('.bar'); return flex('.bar') ? 'алдымен .bar { display: flex; } жазыңыз' : s.alignItems === 'center' ? null : '.bar { align-items: center; } керек, қазір: ' + s.alignItems; },\n    'menu-gap': function () { var s = q('.menu'); return flex('.menu') || (px(s.columnGap) > 0 ? null : '.menu { gap: 16px; } сияқты сілтемелер арасын қосыңыз'); },\n    'grid-display': function () { return grid(); },\n    'grid-cols': function () { var s = q('.grid'); if (grid()) return 'алдымен .grid { display: grid; } жазыңыз';\n      var n = count(s.gridTemplateColumns); return n === 3 ? null : 'үш бағана керек, мысалы grid-template-columns: repeat(3, 1fr); қазір бағандар саны: ' + n + ' (' + (s.gridTemplateColumns || 'none') + ')'; },\n    'grid-gap': function () { var s = q('.grid'); if (grid()) return 'алдымен .grid { display: grid; } жазыңыз';\n      return px(s.rowGap) >= 8 && px(s.columnGap) >= 8 ? null : '.grid { gap: 16px; } сияқты жол мен баған арасын беріңіз, қазір: жол ' + s.rowGap + ', баған ' + s.columnGap; },\n    'card': function () { var s = q('.card'); if (px(s.paddingTop) <= 0) return '.card { padding: ...; } жазыңыз: мәтін жиекке жабысып тұр';\n      if (px(s.borderTopLeftRadius) <= 0) return '.card { border-radius: ...; } жазыңыз: бұрыштар дөңгеленсін'; },\n    'foot': function () { var s = q('.foot'); return flex('.foot') || (s.justifyContent === 'center' ? null : '.foot { justify-content: center; } керек, қазір: ' + s.justifyContent); },\n    'media': function (sh) {\n      var med = [].slice.call(sh.cssRules).filter(function (r) { return r.type === 4 && /max-width/.test(r.conditionText || r.media.mediaText); });\n      if (!med.length) return '@media (max-width: 600px) { ... } ережесі жоқ: телефон үшін мобильді нұсқа жазыңыз';\n      var got = null; med.forEach(function (m) { [].slice.call(m.cssRules).forEach(function (r) { if (r.selectorText && r.selectorText.split(',').some(function (x) { return x.trim() === '.grid'; })) got = r.style.getPropertyValue('grid-template-columns'); }); });\n      if (got === null) return '@media ішінде .grid { grid-template-columns: 1fr; } ережесі жоқ';\n      if (count(got) !== 1) return '@media ішінде .grid бір бағанды болуы керек (grid-template-columns: 1fr), қазір: ' + (got || 'жазылмаған');\n    }\n  };\n  window.chk = function (name, css) {\n    if (typeof css !== 'string') return 'css айнымалысы болуы керек: const css = `...`; (кері тырнақша ` ` ішіндегі жол)';\n    if (css.trim().length < 20) return 'css айнымалысы бос көрінеді: ережелеріңізді кері тырнақшалардың ` ` ішіне жазыңыз';\n    [].slice.call(document.querySelectorAll('head style')).forEach(function (s) { s.remove(); });\n    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);\n    var sh = st.sheet;\n    // iframe-нің өлшемі кішкентай: @media ережелері есептелген стильге әсер етпесін, сондықтан оларды (media-тестінен басқа) өшіреміз\n    if (name !== 'media') for (var i = sh.cssRules.length - 1; i >= 0; i--) if (sh.cssRules[i].type === 4 || sh.cssRules[i].type === 12) sh.deleteRule(i);\n    if (name === 'setup') return 'OK';\n    return K[name](sh) || 'OK';\n  };\n})();\n</script>"
 }
});
