/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. Harvard CS50 материалдары мен үшінші тарап компоненттері өз лицензияларымен қалады. */
/* CS50 қазақша: ойындар, «Ағылшын» тобы: Word Match, Spell It, Sentence Builder, Article Rush, Bug Report Fixer.
   Дерек: assets/data/en-vocab-*.js, en-grammar-*.js (ойын ашылғанда ғана жүктеледі). Бос/аз болса, осы файлдағы өз жазған орнатылған қор қолданылады.
   Деңгей A0-C1 таңдалады (cs50kz:en:glevel). Пайдаланушы мәтіні тек textContent/DOM арқылы шығады. Дыбыстау: тек браузердің speechSynthesis (бар болса). */
(function () {
  "use strict";
  const G = window.CS50Games;
  if (!G) return;
  const { shuffle, sample } = G;
  const FAST = /[?&]fast\b/.test(location.search); // тест үшін: таймерлер қысқарады
  const LV = ["a0", "a1", "a2", "b1", "b2", "c1"], LVN = ["A0", "A1", "A2", "B1", "B2", "C1"];
  const arr = (x) => (Array.isArray(x) ? x : []);

  function h(tag, a, ...kids) {
    const e = document.createElement(tag);
    if (a) for (const k in a) {
      const v = a[k];
      if (v == null || v === false) continue;
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    }
    const add = (c) => { if (c == null || c === false) return; if (Array.isArray(c)) c.forEach(add); else e.appendChild(typeof c === "object" ? c : document.createTextNode(String(c))); };
    kids.forEach(add);
    return e;
  }
  const norm = (s) => String(s).toLowerCase().replace(/[‘’ʼ`´]/g, "'").replace(/[.,!?;:"“”]+/g, " ").replace(/\s+/g, " ").trim();

  /* ---------- деңгей таңдау ---------- */
  const LKEY = "cs50kz:en:glevel";
  const getLevel = () => { try { const v = parseInt(localStorage.getItem(LKEY), 10); return v >= 0 && v < 6 ? v : 0; } catch (e) { return 0; } };
  const setLevel = (v) => { try { localStorage.setItem(LKEY, String(v)); } catch (e) { /* жеке режим */ } };
  function levelPicker() {
    let cur = getLevel();
    const box = h("div", { class: "gen-lvl", role: "radiogroup", "aria-label": "Ойын деңгейі" });
    LVN.forEach((n, i) => {
      const b = h("button", { type: "button", role: "radio", "aria-checked": String(i === cur), "data-l": i, class: "gen-lvl-b" + (i === cur ? " on" : ""), text: n });
      b.onclick = () => { cur = i; setLevel(i); box.querySelectorAll("button").forEach((x) => { const on = +x.dataset.l === i; x.classList.toggle("on", on); x.setAttribute("aria-checked", String(on)); }); };
      box.append(b);
    });
    return { el: h("div", { class: "gen-lvl-wrap" }, h("p", { class: "gen-lvl-t", text: "Деңгей (CEFR-ге шамамен):" }), box), get: () => cur };
  }
  /* бастау экраны: ережелер + деңгей таңдау. start(level) - дерек жүктелген соң шақырылады */
  function intro(ctx, stage, opts, start) {
    const pick = levelPicker();
    const go = ctx.intro({ lead: opts.lead, rules: opts.rules });
    go.parentNode.insertBefore(pick.el, go);
    go.onclick = () => {
      ctx.sfx("tick");
      go.disabled = true; go.textContent = "Жүктелуде...";
      loadData().then(() => { if (stage.isConnected) start(pick.get()); });
    };
    return go;
  }

  /* ---------- дерек: курс файлдары, жүктелмесе немесе аз болса - орнатылған қор ---------- */
  let loadP = null;
  function loadData() {
    if (loadP) return loadP;
    const files = [];
    LV.forEach((l) => {
      if (!(window.CS50KZ_EN_VOCAB || {})[l]) files.push("assets/data/en-vocab-" + l + ".js");
      if (!(window.CS50KZ_EN_GRAMMAR || {})[l]) files.push("assets/data/en-grammar-" + l + ".js");
    });
    loadP = new Promise((resolve) => {
      let left = files.length;
      if (!left) return resolve();
      const done = () => { if (--left <= 0) resolve(); };
      files.forEach((src) => { const s = document.createElement("script"); s.src = src; s.onload = s.onerror = done; document.head.appendChild(s); });
      setTimeout(resolve, 5000);
    });
    return loadP;
  }

  /* Орнатылған қор: өз жазған 48 сөз (деңгейіне 8): [ағылшынша, қазақша, мысал, мысал аудармасы] */
  const FB_RAW = [
    [["file", "файл", "Open the file.", "Файлды ашыңыз."], ["screen", "экран", "The screen is big.", "Экран үлкен."], ["keyboard", "пернетақта", "My keyboard is new.", "Менің пернетақтам жаңа."], ["mouse", "тінтуір", "I use a mouse.", "Мен тінтуірді қолданамын."], ["password", "құпиясөз", "Write your password.", "Құпиясөзіңізді жазыңыз."], ["button", "батырма", "Click the button.", "Батырманы басыңыз."], ["teacher", "мұғалім", "My teacher is kind.", "Менің мұғалімім мейірімді."], ["friend", "дос", "She is my friend.", "Ол менің досым."]],
    [["bug", "қате (бағдарламадағы)", "I fixed a bug today.", "Мен бүгін қатені түзеттім."], ["website", "сайт", "This website is fast.", "Бұл сайт жылдам."], ["meeting", "кездесу", "We have a meeting at ten.", "Бізде сағат онда кездесу бар."], ["deadline", "мерзім", "The deadline is on Friday.", "Мерзім жұмада."], ["update", "жаңарту", "Please update the app.", "Қолданбаны жаңартыңызшы."], ["folder", "папка", "Save it in this folder.", "Оны осы папкаға сақтаңыз."], ["message", "хабарлама", "I sent you a message.", "Мен саған хабарлама жібердім."], ["weekend", "демалыс күндері", "I rest on the weekend.", "Мен демалыс күндері демаламын."]],
    [["feature", "мүмкіндік, функция", "We added a new feature.", "Біз жаңа функция қостық."], ["improve", "жақсарту", "I want to improve my English.", "Мен ағылшынымды жақсартқым келеді."], ["during", "кезінде", "He called during the meeting.", "Ол кездесу кезінде қоңырау шалды."], ["mistake", "қателік", "Everyone makes a mistake.", "Әркім қателеседі."], ["request", "сұраныс", "She sent a request yesterday.", "Ол кеше сұраныс жіберді."], ["invite", "шақыру", "They invite me to lunch.", "Олар мені түскі асқа шақырады."], ["notice", "байқау", "I noticed a small error.", "Мен кішкентай қатені байқадым."], ["prepare", "дайындау", "We prepare the demo today.", "Біз бүгін демоны дайындаймыз."]],
    [["deploy", "орналастыру (серверге)", "Developers deploy the code every week.", "Әзірлеушілер кодты апта сайын орналастырады."], ["review", "тексеру", "Could you review my code?", "Кодымды тексеріп бере аласыз ба?"], ["requirement", "талап", "The requirement changed again.", "Талап тағы өзгерді."], ["responsible", "жауапты", "She is responsible for testing.", "Ол тестілеуге жауапты."], ["although", "дегенмен", "Although it was late, we finished.", "Кеш болса да, біз аяқтадық."], ["suggest", "ұсыну", "I suggest a short break.", "Мен қысқа үзіліс ұсынамын."], ["schedule", "кесте", "Check the schedule first.", "Алдымен кестені тексеріңіз."], ["achieve", "қол жеткізу", "We achieved our goal.", "Біз мақсатымызға жеттік."]],
    [["reliable", "сенімді", "This tool is very reliable.", "Бұл құрал өте сенімді."], ["approach", "тәсіл", "We need a different approach.", "Бізге басқа тәсіл керек."], ["deliver", "жеткізу", "The team delivered on time.", "Команда уақытында тапсырды."], ["consequence", "салдар", "Every choice has a consequence.", "Әр таңдаудың салдары бар."], ["negotiate", "келіссөз жүргізу", "They negotiated a better price.", "Олар жақсырақ баға келісті."], ["overcome", "еңсеру", "She overcame many difficulties.", "Ол көп қиындықты еңсерді."], ["maintain", "қолдау көрсету, ұстап тұру", "We maintain the old system.", "Біз ескі жүйені қолдап тұрамыз."], ["resolve", "шешу", "We resolved the conflict quickly.", "Біз қақтығысты тез шештік."]],
    [["nuance", "реңк", "Translation often loses a nuance.", "Аударма көбіне реңкті жоғалтады."], ["mitigate", "жеңілдету, азайту", "We should mitigate the risk.", "Біз тәуекелді азайтуымыз керек."], ["comprehensive", "жан-жақты", "He wrote a comprehensive report.", "Ол жан-жақты есеп жазды."], ["inevitable", "сөзсіз болатын", "Some delay was inevitable.", "Біраз кешігу сөзсіз еді."], ["scrutiny", "мұқият тексеру", "The plan faced close scrutiny.", "Жоспар мұқият тексеруден өтті."], ["compelling", "иландыратын", "She gave a compelling argument.", "Ол иландыратын дәлел келтірді."], ["ambiguity", "екіұштылық", "Avoid ambiguity in requirements.", "Талаптарда екіұштылықтан сақтаныңыз."], ["leverage", "тиімді пайдалану", "We leverage existing tools.", "Біз бар құралдарды тиімді пайдаланамыз."]],
  ];
  const FB_VOCAB = [];
  FB_RAW.forEach((lv, i) => lv.forEach((r, k) => FB_VOCAB.push({ id: "gen-" + i + "-" + k, w: r[0], kz: r[1], ex: r[2], exkz: r[3], lvl: i, pos: "", p: "" })));

  function realVocab() {
    const D = window.CS50KZ_EN_VOCAB || {}, out = [];
    LV.forEach((l, i) => arr(D[l]).forEach((w) => { if (w && w.id && w.w && w.kz) out.push({ id: w.id, w: String(w.w), kz: String(w.kz), ex: String(w.ex || ""), exkz: String(w.exkz || ""), p: w.p || "", pos: w.pos || "", lvl: i }); }));
    return out;
  }
  /* n-нен кем емес сөз: алдымен таңдалған деңгей, сосын төменгі деңгейлер, сосын орнатылған қор */
  function vocabPool(level, min) {
    const real = realVocab(), seen = new Set(), pool = [];
    let usedFallback = false;
    const add = (list) => list.forEach((x) => { const k = x.w.toLowerCase(); if (!seen.has(k)) { seen.add(k); pool.push(x); } });
    add(real.filter((x) => x.lvl === level));
    for (let l = level - 1; l >= 0 && pool.length < min; l--) add(real.filter((x) => x.lvl === l));
    if (pool.length < min) { usedFallback = true; add(FB_VOCAB.filter((x) => x.lvl === level)); }
    if (pool.length < min) add(FB_VOCAB.filter((x) => x.lvl < level));
    if (pool.length < min) add(FB_VOCAB);
    return { pool, usedFallback };
  }
  const shortKz = (kz) => String(kz).split(/[,;(]/)[0].trim() || String(kz);

  /* сөйлемдер: курс сөздігінің мысалдары + грамматика мысалдары + орнатылған қор */
  const FB_SENT = [
    ["I am a student.", "Мен студентпін.", 0], ["She has a new laptop.", "Оның жаңа ноутбугі бар.", 0], ["Open the door, please.", "Есікті ашыңызшы.", 0], ["We are in the office.", "Біз кеңседеміз.", 0],
    ["He works every day.", "Ол күн сайын жұмыс істейді.", 1], ["I am writing a test now.", "Мен қазір тест жазып жатырмын.", 1], ["There is a bug on this page.", "Бұл бетте қате бар.", 1], ["We usually meet on Monday.", "Біз әдетте дүйсенбіде кездесеміз.", 1],
    ["I fixed the bug yesterday.", "Мен қатені кеше түзеттім.", 2], ["She is going to call the client.", "Ол клиентке қоңырау шалмақшы.", 2], ["This tool is faster than the old one.", "Бұл құрал ескісінен жылдамырақ.", 2], ["You should save your work often.", "Жұмысыңызды жиі сақтауыңыз керек.", 2],
    ["I have worked here for three years.", "Мен мұнда үш жыл жұмыс істеп келемін.", 3], ["If it rains, we will stay inside.", "Жаңбыр жауса, біз ішке қаламыз.", 3], ["The code was reviewed by the team.", "Кодты команда тексерді.", 3], ["He asked me where I lived.", "Ол менен қайда тұратынымды сұрады.", 3],
    ["If I had more time, I would learn Japanese.", "Уақытым көп болса, жапон тілін үйренер едім.", 4], ["I wish I had started earlier.", "Ертерек бастағанымды қалар едім.", 4], ["She suggested using a different approach.", "Ол басқа тәсілді қолдануды ұсынды.", 4], ["The project had been delayed before we joined.", "Біз қосылғанға дейін жоба кешіктіріліп қойған еді.", 4],
    ["Not only did we finish early, but we also saved money.", "Біз ерте бітіріп қана қоймай, ақша да үнемдедік.", 5], ["It is the design that causes most of the confusion.", "Шатасудың көбін тудыратын - дизайн.", 5], ["Had we known, we would have acted sooner.", "Білгенімізде, ертерек әрекет етер едік.", 5], ["The results seem to suggest a clear trend.", "Нәтижелер айқын үрдісті меңзейтін сияқты.", 5],
  ].map((r, i) => ({ en: r[0], kz: r[1], lvl: r[2], id: "gens-" + i }));
  function sentencePool(level) {
    const out = [], seen = new Set();
    const push = (en, kz, lvl) => {
      en = String(en || "").trim();
      const n = en.replace(/[.!?]+$/, "").split(/\s+/).length;
      if (!en || !kz || n < 3 || n > 11 || /[…_]/.test(en)) return;
      const k = norm(en); if (seen.has(k)) return; seen.add(k); out.push({ en, kz: String(kz), lvl });
    };
    realVocab().forEach((w) => push(w.ex, w.exkz, w.lvl));
    const D = window.CS50KZ_EN_GRAMMAR || {};
    LV.forEach((l, i) => arr(D[l]).forEach((g) => arr(g && g.examples).forEach((x) => x && push(x.en, x.kz, i))));
    FB_SENT.forEach((s) => push(s.en, s.kz, s.lvl));
    let pool = out.filter((s) => s.lvl === level);
    let l = level - 1;
    while (pool.length < 8 && l >= 0) { pool = pool.concat(out.filter((s) => s.lvl === l)); l--; }
    if (pool.length < 8) pool = pool.concat(out.filter((s) => s.lvl > level));
    return pool;
  }

  /* грамматикадан «қате -> дұрыс» жұптары */
  const FB_FIX = [
    // [қате, дұрыс, 3 дұрыс емес нұсқа, түсіндірме, деңгей, түрі]
    ["I am work on the login page today.", "I am working on the login page today.", ["I am worked on the login page today.", "I working on the login page today.", "I am works on the login page today."], "am/is/are + етістік-ing: қазіргі ұзақ шақ.", 1, "Stand-up"],
    ["She don't know about the bug.", "She doesn't know about the bug.", ["She not know about the bug.", "She don't knows about the bug.", "She doesn't knows about the bug."], "he/she/it + doesn't + етістіктің түбірі.", 1, "Баг-репорт"],
    ["I have two file in this folder.", "I have two files in this folder.", ["I have two filed in this folder.", "I have two file's in this folder.", "I have two of file in this folder."], "Екіден көп зат есім көпше жалғауын (-s) алады.", 1, "Код түсініктемесі"],
    ["The app crash when I click the button.", "The app crashes when I click the button.", ["The app crashing when I click the button.", "The app crash when I clicks the button.", "The app is crash when I click the button."], "Present Simple, 3-жақ бірлік: етістікке -es/-s жалғанады.", 1, "Баг-репорт"],
    ["It is depend on the configuration.", "It depends on the configuration.", ["It is depends on the configuration.", "It depend on the configuration.", "It depends of the configuration."], "depend өзі етістік, is керек емес; depend + on.", 2, "Code review"],
    ["Please explain me the error.", "Please explain the error to me.", ["Please explain to the error me.", "Please explain me about the error.", "Please explain for me the error."], "explain + не + to + кім: «маған» to me болады.", 2, "E-mail"],
    ["We discussed about the deadline yesterday.", "We discussed the deadline yesterday.", ["We discussed on the deadline yesterday.", "We discussing about the deadline yesterday.", "We did discuss about the deadline yesterday."], "discuss тікелей толықтауыш алады, about керек емес.", 2, "Кездесу"],
    ["He ran the tests and finded two bugs.", "He ran the tests and found two bugs.", ["He ran the tests and founded two bugs.", "He runned the tests and found two bugs.", "He ran the tests and find two bugs."], "find қате етістік: find - found - found.", 2, "Баг-репорт"],
    ["I'm agree with your comment.", "I agree with your comment.", ["I'm agreeing with your comment.", "I am agreed with your comment.", "I agree to your comment."], "agree өзі етістік; am керек емес.", 2, "Code review"],
    ["The server is down since Monday.", "The server has been down since Monday.", ["The server was down since Monday.", "The server is being down since Monday.", "The server have been down since Monday."], "since + нүкте: Present Perfect (has been).", 3, "Баг-репорт"],
    ["If I will have time, I will check the logs.", "If I have time, I will check the logs.", ["If I would have time, I will check the logs.", "If I will have time, I check the logs.", "If I had time, I will check the logs."], "if-сөйлемінде will қолданылмайды: if + Present Simple.", 3, "Code review"],
    ["Could you tell me where is the report?", "Could you tell me where the report is?", ["Could you tell me where does the report is?", "Could you tell me where the report be?", "Could you tell me where is the report be?"], "Жанама сұрақта сөз реті тура: where + зат + етістік.", 3, "E-mail"],
    ["The data show that the results is reliable.", "The data show that the results are reliable.", ["The data shows that the results is reliable.", "The data show that the results be reliable.", "The data show that the result are reliable."], "results көпше, сондықтан are.", 3, "Есеп"],
    ["I look forward to hear from you.", "I look forward to hearing from you.", ["I look forward to heard from you.", "I look forward hear from you.", "I look forward for hearing from you."], "look forward to + етістік-ing.", 4, "E-mail"],
    ["Despite of the delay, we released on time.", "Despite the delay, we released on time.", ["Despite the delay, we release on time.", "In despite of the delay, we released on time.", "Despite from the delay, we released on time."], "despite өзінен кейін of алмайды (in spite of болса, of бар).", 4, "Есеп"],
    ["Thanks for your reply, I will to check it tomorrow.", "Thanks for your reply, I will check it tomorrow.", ["Thanks for your reply, I will checking it tomorrow.", "Thanks for your reply, I will checks it tomorrow.", "Thanks for your reply, I'll to check it tomorrow."], "will + етістіктің түбірі (to жоқ).", 2, "E-mail"],
    ["Had I known about the bug, I would fixed it earlier.", "Had I known about the bug, I would have fixed it earlier.", ["Had I known about the bug, I would fix it earlier.", "If I had known about the bug, I would fixed it earlier.", "Had I knew about the bug, I would have fixed it earlier."], "3-типті шарт: would have + V3.", 5, "Post-mortem"],
    ["Hardly we had deployed when the alerts started.", "Hardly had we deployed when the alerts started.", ["Hardly we deployed when the alerts started.", "Hardly had we deploy when the alerts started.", "Hardly did we had deployed when the alerts started."], "Hardly басында тұрса, көмекші етістік алға шығады (инверсия).", 5, "Post-mortem"],
    ["Fix the bug in login page.", "Fix the bug in the login page.", ["Fixing the bug in login page.", "Fix bug the in login page.", "Fixed the bug in login page."], "Commit: бұйрық рай + артикль: the login page.", 1, "Commit"],
    ["Update README, add the instalation steps.", "Update README and add the installation steps.", ["Updated README, adding the instalation steps.", "Update README and add the instalation steps.", "Update README and adding the installation steps."], "Емле: installation (in-stal-la-tion); командаларды and арқылы жалғайды.", 2, "Commit"],
  ].map((r, i) => ({ bad: r[0], ok: r[1], dis: r[2], why: r[3], lvl: r[4], kind: r[5], id: "genf-" + i }));

  /* Article Rush қоры: [сөйлем, жауап, деңгей, түсіндірме, мәтінмән белгісі] */
  const ART = [
    ["I have ___ laptop.", "a", 0, "laptop дауыссыз дыбыстан басталады: a.", "бір зат"],
    ["She is ___ engineer.", "an", 0, "engineer дауыстыдан басталады: an.", "мамандық"],
    ["Open ___ door, please.", "the", 0, "қай есік екені екі жаққа да белгілі: the.", "белгілі зат"],
    ["This is ___ apple.", "an", 0, "apple дауысты дыбыс: an.", "бір зат"],
    ["He is ___ student.", "a", 0, "student дауыссыздан басталады: a.", "мамандық"],
    ["I need ___ umbrella.", "an", 0, "umbrella дауысты дыбыс [а]: an.", "бір зат"],
    ["___ sun is hot today.", "the", 0, "Күн жалғыз: the.", "жалғыз нәрсе"],
    ["We have ___ new teacher.", "a", 0, "new дауыссыз дыбыс: a.", "бір адам"],
    ["Close ___ window, please.", "the", 0, "Қай терезе екені белгілі: the.", "белгілі зат"],
    ["It is ___ orange.", "an", 0, "orange дауыстыдан басталады: an.", "бір зат"],
    ["I saw ___ error on the screen.", "an", 1, "error дауыстыдан басталады: an.", "жаңа зат"],
    ["Where is ___ mouse I gave you?", "the", 1, "«I gave you» нақтылайды: the.", "белгілі зат"],
    ["She works for ___ international company.", "an", 1, "international дауысты дыбыс: an.", "бір компания"],
    ["He has ___ idea.", "an", 1, "idea дауысты дыбыс: an.", "бір зат"],
    ["I read ___ article about Python yesterday.", "an", 1, "article дауыстыдан басталады: an.", "жаңа зат"],
    ["Can you send me ___ link?", "a", 1, "Кез келген бір сілтеме: a.", "кез келген бір"],
    ["___ Moon goes around the Earth.", "the", 1, "Ай жалғыз: the.", "жалғыз нәрсе"],
    ["It takes ___ hour to install it.", "an", 1, "hour-да h дыбысталмайды, дауыстыдан басталады: an.", "бір"],
    ["He is ___ university student.", "a", 1, "university [ю] дауыссыз дыбыстан басталады: a.", "мамандық"],
    ["He is ___ best developer here.", "the", 1, "ең жоғарғы шара (best): the.", "ең жақсы"],
    ["I'm looking for ___ job in IT.", "a", 2, "Нақты емес бір жұмыс: a.", "нақты емес"],
    ["We moved to ___ city centre last year.", "the", 2, "Орталық белгілі: the.", "белгілі орын"],
    ["She asked ___ interesting question.", "an", 2, "interesting дауыстыдан басталады: an.", "бір сұрақ"],
    ["Can I ask you ___ favour?", "a", 2, "favour дауыссыздан басталады: a.", "бір өтініш"],
    ["This is ___ first time I use this tool.", "the", 2, "first реттік сан: the.", "реттік сан"],
    ["It was ___ unusual bug.", "an", 2, "unusual дауыстыдан басталады: an.", "бір қате"],
    ["He plays ___ guitar very well.", "the", 2, "аспап атымен play the...: the.", "аспап"],
    ["I want to be ___ useful member of the team.", "a", 2, "useful [ю] дыбысы дауыссыз: a.", "бір мүше"],
    ["After ___ meeting, we wrote the report.", "the", 3, "Нақты бір кездесу екені белгілі: the.", "белгілі зат"],
    ["She gave me ___ honest answer.", "an", 3, "honest-те h дыбысталмайды: an.", "бір жауап"],
    ["___ Internet is down again.", "the", 3, "Бірегей жүйе: the Internet.", "жалғыз нәрсе"],
    ["He has ___ one-year contract.", "a", 3, "one [уан] дауыссыз дыбыс: a.", "бір келісімшарт"],
    ["I will call you in ___ hour.", "an", 3, "hour: an.", "бір"],
    ["Who is ___ person in charge here?", "the", 3, "Жауапты адам нақты: the.", "белгілі адам"],
    ["That was ___ unexpected result.", "an", 3, "unexpected дауыстыдан басталады: an.", "бір нәтиже"],
    ["We need ___ European partner.", "a", 3, "European [ю] дауыссыз дыбыс: a.", "бір серіктес"],
    ["He took ___ unique approach.", "a", 4, "unique [ю] дауыссыз дыбыс: a.", "бір тәсіл"],
    ["Please read ___ documentation before you ask.", "the", 4, "Белгілі құжаттама: the.", "белгілі зат"],
    ["That is ___ honour for us.", "an", 4, "honour-да h дыбысталмайды: an.", "бір"],
    ["Is this ___ only option we have?", "the", 4, "only: the.", "жалғыз"],
    ["It is ___ ongoing debate.", "an", 5, "ongoing дауыстыдан басталады: an.", "бір"],
    ["___ more we tested, the fewer bugs we found.", "the", 5, "the + салыстырмалы шырай ... the: екі жақты қатынас.", "құрылым"],
    ["She became ___ unlikely leader.", "an", 5, "unlikely дауысты: an.", "бір"],
    ["This is ___ one-of-a-kind solution.", "a", 5, "one [уан] дауыссыз дыбыс: a.", "бір"],
  ].map((r, i) => ({ s: r[0], a: r[1], lvl: r[2], why: r[3], cue: r[4], id: "gena-" + i }));

  /* ---------- ортақ UI ---------- */
  function hud(parts) { return h("div", { class: "gen-hud g-hud" }, parts); }
  const sayOK = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  function mutedNow() { try { return localStorage.getItem("cs50kz:games:mute") !== "0"; } catch (e) { return true; } }
  function say(text) {
    if (!sayOK) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = "en-US";
      try { const v = (speechSynthesis.getVoices() || []).filter((x) => /^en/i.test(x.lang))[0]; if (v) u.voice = v; } catch (e) { /* дауыс жоқ */ }
      speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }
  function timer(stage, ms, onTick, onEnd) {
    const t0 = Date.now();
    const id = setInterval(() => {
      if (!stage.isConnected) return clearInterval(id);
      const left = Math.max(0, ms - (Date.now() - t0));
      onTick(left);
      if (left <= 0) { clearInterval(id); onEnd(); }
    }, 200);
    return () => clearInterval(id);
  }
  const srcLine = (fb) => "Дерек көзі: " + (fb ? "орнатылған шағын қор (курс сөздігі әзірше аз)" : "курс сөздігі");

  /* =====================================================================
   * 1. Word Match: ағылшынша сөз бен қазақша мағынаны жұптастыр
   * ===================================================================== */
  G.register({
    id: "enmatch", title: "Word Match", icon: "🔗", color: "#0f766e",
    blurb: "Ағылшынша сөз бен қазақша мағынаның жұбын тап. 3 тақта, уақытқа қарсы.",
    start(stage, ctx) {
      intro(ctx, stage, {
        lead: "Сол жақта <b>ағылшынша сөз</b>, оң жақта <b>қазақша мағына</b>. Біреуін, сосын жұбын бас.",
        rules: [["🔗", "3 тақта, әр тақтада 5 жұп"], ["⏱", FAST ? "20 секунд" : "90 секунд: жылдам болсаң, қосымша ұпай"], ["❌", "Қате жұп 3 ұпай алып тастайды"], ["🔊", "Сөзді тыңдау үшін 🔊 басыңыз (браузерде дыбыс болса)"]],
      }, run);

      function run(level) {
        const { pool, usedFallback } = vocabPool(level, 15);
        const useWords = shuffle(pool.filter((w) => !/\s/.test(w.w)).length >= 15 ? pool.filter((w) => !/\s/.test(w.w)) : pool);
        const boards = [];
        for (let i = 0; i < 3; i++) {
          const b = [], seenKz = new Set();
          while (b.length < 5 && useWords.length) { const w = useWords.pop(); const k = shortKz(w.kz).toLowerCase(); if (seenKz.has(k)) continue; seenKz.add(k); b.push(w); }
          if (b.length >= 3) boards.push(b);
        }
        const TOTAL = FAST ? 20000 : 90000;
        let bi = 0, score = 0, matched = 0, wrong = 0, left = TOTAL, selL = null, lock = false, stop = () => {};
        const cur = h("div", { class: "gen-wrap" });
        stage.textContent = "";
        const timeEl = h("span", { class: "g-time ga-clock", "aria-hidden": "true", text: "⏱ " + Math.ceil(TOTAL / 1000) });
        const scoreEl = h("span", { class: "gen-score", "aria-live": "off" }, "Ұпай: ", h("b", { text: "0" }));
        const boardEl = h("span", { class: "gen-board" });
        const bar = h("div", { class: "gy-timebar", "aria-hidden": "true" }, h("i"));
        const fb = h("p", { class: "g-fb", role: "status", "aria-live": "polite" });
        stage.append(h("div", { class: "gen" }, hud([boardEl, scoreEl, timeEl]), bar, cur, fb));
        stop = timer(stage, TOTAL, (l) => { left = l; timeEl.textContent = "⏱ " + Math.ceil(l / 1000); timeEl.classList.toggle("low", l <= 15000 && !FAST); const i = bar.firstChild; if (i) i.style.width = (l / TOTAL * 100) + "%"; }, () => end(false));
        draw();

        function upd() { scoreEl.lastChild.textContent = score; }
        function draw() {
          selL = null; lock = false;
          const b = boards[bi], rows = b.length;
          boardEl.textContent = "Тақта " + (bi + 1) + " / " + boards.length;
          const L = shuffle(b.map((w, i) => i)), R = shuffle(b.map((w, i) => i));
          const mk = (idx, side) => {
            const w = b[idx];
            const btn = h("button", { type: "button", class: "g-opt gen-card gen-" + side, "data-i": idx, "aria-pressed": "false", lang: side === "l" ? "en" : "kk", text: side === "l" ? w.w : shortKz(w.kz) });
            btn.onclick = () => pick(btn, idx, side);
            return btn;
          };
          const lc = h("div", { class: "gen-col", role: "group", "aria-label": "Ағылшынша сөздер" }, L.map((i) => mk(i, "l")));
          const rc = h("div", { class: "gen-col", role: "group", "aria-label": "Қазақша мағыналар" }, R.map((i) => mk(i, "r")));
          cur.replaceChildren(h("div", { class: "gen-cols" }, lc, rc));
          cur.dataset.left = String(rows);
        }
        function pick(btn, idx, side) {
          if (lock || btn.disabled) return;
          if (side === "l") {
            if (sayOK && !mutedNow()) say(boards[bi][idx].w);
            cur.querySelectorAll(".gen-l").forEach((x) => { x.classList.remove("sel"); x.setAttribute("aria-pressed", "false"); });
            btn.classList.add("sel"); btn.setAttribute("aria-pressed", "true"); selL = { btn, idx }; return;
          }
          if (!selL) { fb.className = "g-fb gen-fb"; fb.textContent = "Алдымен сол жақтан ағылшынша сөзді таңда."; return; }
          if (selL.idx === idx) {
            [selL.btn, btn].forEach((x) => { x.classList.remove("sel"); x.classList.add("ok"); x.disabled = true; x.setAttribute("aria-pressed", "false"); });
            const bonus = FAST ? 0 : Math.round(left / 15000);
            score += 10 + bonus; matched++; ctx.sfx("ok"); upd();
            fb.className = "g-fb gen-fb gb-ok"; fb.textContent = "✓ " + boards[bi][idx].w + " = " + shortKz(boards[bi][idx].kz);
            selL = null;
            if (!cur.querySelector(".gen-l:not([disabled])")) {
              score += 20; upd(); ctx.sfx("win"); lock = true;
              setTimeout(() => { if (!stage.isConnected) return; bi++; if (bi >= boards.length) end(true); else draw(); }, 500);
            }
          } else {
            wrong++; score = Math.max(0, score - 3); upd(); ctx.sfx("bad");
            const a = selL.btn; a.classList.remove("sel"); a.setAttribute("aria-pressed", "false"); a.classList.add("bad"); btn.classList.add("bad");
            fb.className = "g-fb gen-fb gb-no"; fb.textContent = "✗ Бұл жұп емес. Қайта көр.";
            selL = null; lock = true;
            setTimeout(() => { a.classList.remove("bad"); btn.classList.remove("bad"); lock = false; }, 450);
          }
        }
        function end(done) {
          stop();
          if (done) score += FAST ? 0 : Math.round(left / 3000);
          ctx.finish({ score, max: boards.length * 70 + 30, title: done ? "Барлық тақта бітті! 🔗" : "Уақыт бітті", lines: ["Дұрыс жұп: " + matched + ", қате: " + wrong, "Деңгей: " + LVN[level], srcLine(usedFallback)] });
        }
      }
    },
  });

  /* =====================================================================
   * 2. Spell It: дыбыстауды тыңдап (не мағынасын оқып) сөзді дұрыс жаз
   * ===================================================================== */
  G.register({
    id: "enspell", title: "Spell It", icon: "🔤", color: "#7c3aed",
    blurb: "Сөзді тыңда, мағынасын оқы да, ағылшынша дұрыс жаз. 10 сөз.",
    start(stage, ctx) {
      intro(ctx, stage, {
        lead: "10 сөз: қазақша мағынасы көрсетіледі, ағылшынша жазылуын теру керек." + (sayOK ? "" : " <b>Бұл браузерде дыбыстау жоқ</b>, сондықтан тек мағына бойынша жазасыз."),
        rules: [["🔊", sayOK ? "Дыбыстау батырмасын қанша рет басуға болады" : "Дыбыстау қолжетімсіз: мағына мен мысал көмектеседі"], ["⌨️", "Enter - тексеру"], ["💡", "Кеңес: бірінші әріп (−4 ұпай)"], ["✅", "Дұрыс жауап 10 ұпай, қатарынан дұрыс болса қосымша"]],
      }, run);

      function run(level) {
        const { pool, usedFallback } = vocabPool(level, 10);
        const single = pool.filter((w) => /^[A-Za-z'-]{2,16}$/.test(w.w));
        const words = shuffle(single.length >= 10 ? single : pool).slice(0, 10);
        let i = 0, score = 0, ok = 0, streak = 0, hinted = false, locked = false;
        const miss = [];
        round();
        function round() {
          const w = words[i]; hinted = false; locked = false;
          stage.textContent = "";
          const input = h("input", { type: "text", class: "gen-input", autocomplete: "off", autocapitalize: "none", spellcheck: "false", "aria-label": "Ағылшынша жазылуы", enterkeyhint: "done" });
          const fb = h("div", { class: "g-fb gen-fb", role: "status", "aria-live": "polite" });
          const playBtn = h("button", { type: "button", class: "btn secondary gen-say", "aria-label": "Сөзді дыбыстау", text: "🔊 Тыңдау" });
          playBtn.disabled = !sayOK;
          playBtn.onclick = () => say(w.w);
          const hintBtn = h("button", { type: "button", class: "btn secondary", text: "💡 Кеңес" });
          const chk = h("button", { type: "button", class: "btn gen-check", text: "Тексеру" });
          const nxt = h("button", { type: "button", class: "btn gen-next gb-next", text: i + 1 >= words.length ? "Нәтижені көру" : "Келесі ▸", hidden: true });
          hintBtn.onclick = () => { if (locked) return; hinted = true; fb.className = "g-fb gen-fb"; fb.textContent = "Бірінші әріп: " + w.w[0].toUpperCase() + " · әріп саны: " + w.w.length; input.focus(); };
          const submit = () => {
            if (locked) return;
            const v = norm(input.value);
            if (!v) { fb.className = "g-fb gen-fb gb-no"; fb.textContent = "Жауабыңызды жазыңыз."; input.focus(); return; }
            locked = true;
            const good = v === norm(w.w);
            input.disabled = true; chk.hidden = true; hintBtn.hidden = true;
            if (good) { streak++; ok++; const gain = 10 + Math.min(streak - 1, 3) * 2 - (hinted ? 4 : 0); score += Math.max(3, gain); fb.className = "g-fb gen-fb gb-ok"; fb.textContent = "✓ Дұрыс! +" + Math.max(3, gain); input.classList.add("ok"); ctx.sfx("ok"); }
            else { streak = 0; miss.push(w.w); fb.className = "g-fb gen-fb gb-no"; fb.textContent = ""; fb.append("✗ Дұрыс жазылуы: ", h("b", { lang: "en", text: w.w }), "."); input.classList.add("bad"); ctx.sfx("bad"); }
            if (w.ex) fb.append(h("span", { class: "gen-ex", lang: "en" }, " " + w.ex));
            const sc = stage.querySelector(".gen-score b"); if (sc) sc.textContent = score;
            nxt.hidden = false; nxt.focus();
          };
          chk.onclick = submit;
          input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } });
          nxt.onclick = () => { if (i + 1 >= words.length) fin(); else { i++; round(); } };
          stage.append(h("div", { class: "gen" },
            hud([h("span", { class: "gen-board", text: "Сөз " + (i + 1) + " / " + words.length }), h("span", { class: "gen-score" }, "Ұпай: ", h("b", { text: String(score) }))]),
            h("div", { class: "gen-prompt" }, h("p", { class: "gen-kz", lang: "kk", text: w.kz }), w.p ? h("p", { class: "gen-pron", text: "Оқылуы: " + w.p }) : null, w.exkz ? h("p", { class: "gen-hint", text: "Мысал: " + w.exkz }) : null),
            h("div", { class: "gen-row" }, playBtn, hintBtn),
            input, h("div", { class: "gen-row" }, chk, nxt), fb));
          input.focus({ preventScroll: true });
          if (sayOK && !mutedNow()) say(w.w);
        }
        function fin() {
          ctx.finish({ score, max: 130, title: ok >= 9 ? "Емле шебері! 🔤" : ok >= 6 ? "Жақсы нәтиже!" : "Жаттығуды жалғастыр", lines: ["Дұрыс: " + ok + " / " + words.length, miss.length ? "Қайталайтын сөздер: " + miss.join(", ") : "Қатесіз!", "Деңгей: " + LVN[level], srcLine(usedFallback)] });
        }
      }
    },
  });

  /* =====================================================================
   * 3. Sentence Builder: сөздерден сөйлем құрау
   * ===================================================================== */
  G.register({
    id: "enbuild", title: "Sentence Builder", icon: "🧱", color: "#c2410c",
    blurb: "Араласқан сөздерден дұрыс ағылшын сөйлемін құра. Қазақша аудармасы көмектеседі.",
    start(stage, ctx) {
      intro(ctx, stage, {
        lead: "Қазақша аударманы оқып, сөздерді дұрыс ретпен басыңыз. Қате сөзді жауап жолағынан басып алып тастауға болады.",
        rules: [["🧱", "8 сөйлем"], ["✅", "Әр сөйлемге 15 ұпайға дейін"], ["💡", "Кеңес келесі сөзді қояды (−3)"], ["🔁", "Бір сөйлемге 3 әрекет"]],
      }, run);

      function run(level) {
        const all = sentencePool(level);
        const usedFallback = !realVocab().length && !arr(Object.values(window.CS50KZ_EN_GRAMMAR || {})).length;
        const rounds = shuffle(all).slice(0, 8);
        let ri = 0, score = 0, perfect = 0;
        round();
        function round() {
          const s = rounds[ri], target = s.en.replace(/[.!?]+$/, "").split(/\s+/), endP = (s.en.match(/[.!?]+$/) || [""])[0];
          let order;
          do { order = shuffle(target.map((_, k) => k)); } while (target.length > 2 && order.every((v, k) => v === k));
          const placed = []; let tries = 0, hints = 0, done = false;
          stage.textContent = "";
          const ans = h("div", { class: "gen-ans", "aria-label": "Сіздің сөйлеміңіз", "aria-live": "polite" });
          const poolEl = h("div", { class: "gen-pool", role: "group", "aria-label": "Сөздер" });
          const fb = h("div", { class: "g-fb gen-fb", role: "status", "aria-live": "polite" });
          const chk = h("button", { type: "button", class: "btn gen-check", text: "Тексеру" });
          const reset = h("button", { type: "button", class: "btn secondary", text: "Тазалау" });
          const hintB = h("button", { type: "button", class: "btn secondary", text: "💡 Кеңес" });
          const nxt = h("button", { type: "button", class: "btn gb-next gen-next", text: ri + 1 >= rounds.length ? "Нәтижені көру" : "Келесі ▸", hidden: true });
          const chips = order.map((k) => { const b = h("button", { type: "button", class: "g-opt gen-chip", "data-k": k, lang: "en", text: target[k] }); b.onclick = () => put(k); return b; });
          function redraw() {
            ans.replaceChildren(...placed.map((k, pos) => { const b = h("button", { type: "button", class: "g-opt gen-chip in", lang: "en", "aria-label": "Алып тастау: " + target[k], text: target[k] }); b.onclick = () => { if (done) return; placed.splice(pos, 1); redraw(); }; return b; }));
            if (!placed.length) ans.append(h("span", { class: "gen-ph", text: "Сөздерді осы жерге жинаңыз" }));
            chips.forEach((c) => { c.hidden = placed.includes(+c.dataset.k); });
          }
          function put(k) { if (done || placed.includes(k)) return; placed.push(k); redraw(); }
          function finishRound(good, gain) {
            done = true; chk.hidden = reset.hidden = hintB.hidden = true; nxt.hidden = false;
            if (good) { score += gain; perfect += tries === 0 && hints === 0 ? 1 : 0; ctx.sfx("ok"); fb.className = "g-fb gen-fb gb-ok"; fb.textContent = "✓ Дұрыс! +" + gain; }
            else { ctx.sfx("bad"); fb.className = "g-fb gen-fb gb-no"; fb.textContent = ""; fb.append("Дұрыс сөйлем: ", h("b", { lang: "en", text: s.en })); }
            const sc = stage.querySelector(".gen-score b"); if (sc) sc.textContent = score;
            nxt.focus();
          }
          chk.onclick = () => {
            if (done) return;
            if (placed.length < target.length) { fb.className = "g-fb gen-fb gb-no"; fb.textContent = "Барлық сөзді орналастырыңыз (" + placed.length + " / " + target.length + ")."; return; }
            const mine = norm(placed.map((k) => target[k]).join(" ")), want = norm(target.join(" "));
            if (mine === want) return finishRound(true, Math.max(2, 15 - tries * 5 - hints * 3));
            tries++; ctx.sfx("bad");
            if (tries >= 3) return finishRound(false, 0);
            fb.className = "g-fb gen-fb gb-no"; fb.textContent = "Әлі дұрыс емес. Қалған әрекет: " + (3 - tries) + ".";
          };
          reset.onclick = () => { if (done) return; placed.length = 0; redraw(); fb.textContent = ""; };
          hintB.onclick = () => {
            if (done) return;
            let p = 0; while (p < placed.length && placed[p] === p) p++;
            placed.length = p;
            placed.push(p); hints++; redraw(); fb.className = "g-fb gen-fb"; fb.textContent = "Кеңес: келесі сөз қойылды (−3).";
          };
          nxt.onclick = () => { if (ri + 1 >= rounds.length) ctx.finish({ score, max: rounds.length * 15, title: score >= rounds.length * 12 ? "Сөйлем шебері! 🧱" : "Жақсы жұмыс!", lines: ["Қатесіз сөйлем: " + perfect + " / " + rounds.length, "Деңгей: " + LVN[level], srcLine(usedFallback)] }); else { ri++; round(); } };
          poolEl.append(...chips);
          stage.append(h("div", { class: "gen" },
            hud([h("span", { class: "gen-board", text: "Сөйлем " + (ri + 1) + " / " + rounds.length }), h("span", { class: "gen-score" }, "Ұпай: ", h("b", { text: String(score) }))]),
            h("p", { class: "gen-kz", lang: "kk", text: s.kz }), ans, poolEl, (endP ? h("p", { class: "gen-end", text: "Сөйлем соңына «" + endP + "» белгісі қойылады." }) : null),
            h("div", { class: "gen-row" }, chk, reset, hintB, nxt), fb));
          redraw();
        }
      }
    },
  });

  /* =====================================================================
   * 4. Article Rush: a / an / the жылдамдықпен
   * ===================================================================== */
  G.register({
    id: "enarticle", title: "Article Rush", icon: "🅰️", color: "#2563eb",
    blurb: "Бос орынға a, an немесе the қой. 45 секунд, 3 жан, комбо бонусы.",
    start(stage, ctx) {
      intro(ctx, stage, {
        lead: "Қазақ тілінде артикль жоқ, сондықтан ең жиі қателесетін тақырып. Сөйлемдегі бос орынға <b>a</b>, <b>an</b> не <b>the</b> таңда.",
        rules: [["⏱", FAST ? "12 секунд" : "45 секунд"], ["❤️", "3 жан: қате жауап бір жанды алады"], ["🔥", "Қатарынан 3 дұрыс жауап - бонус"], ["⌨️", "1, 2, 3 пернелері: a, an, the"]],
      }, run);

      function run(level) {
        const near = ART.filter((x) => x.lvl <= level), main = near.filter((x) => x.lvl >= level - 1);
        const bank = shuffle(main.length >= 12 ? main : near);
        const extra = shuffle(near.filter((x) => !bank.includes(x)));
        const queue = bank.concat(extra);
        const TOTAL = FAST ? 12000 : 45000, LIVES = 3;
        let qi = 0, score = 0, lives = LIVES, combo = 0, best = 0, hit = 0, total = 0, locked = false, stop = () => {}, ended = false, advance = 0;
        const keyH = (e) => {
          if (!stage.isConnected) return document.removeEventListener("keydown", keyH);
          if (locked || ended || !/^[1-3]$/.test(e.key) || e.ctrlKey || e.metaKey || e.altKey) return;
          if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
          e.preventDefault(); answer(["a", "an", "the"][+e.key - 1]);
        };
        document.addEventListener("keydown", keyH);
        stage.textContent = "";
        const timeEl = h("span", { class: "g-time ga-clock", "aria-hidden": "true", text: "⏱ " + Math.ceil(TOTAL / 1000) });
        const heartsEl = h("span", { class: "gen-hearts", role: "img", "aria-label": "Жан: " + LIVES + " / " + LIVES });
        const scoreEl = h("span", { class: "gen-score" }, "Ұпай: ", h("b", { text: "0" }));
        const bar = h("div", { class: "gy-timebar", "aria-hidden": "true" }, h("i"));
        const body = h("div", { class: "gen-body" });
        stage.append(h("div", { class: "gen" }, hud([heartsEl, scoreEl, h("span", { class: "gen-combo", "aria-live": "off" }), timeEl]), bar, body));
        const hearts = () => { heartsEl.textContent = "♥".repeat(lives) + "♡".repeat(LIVES - lives); heartsEl.setAttribute("aria-label", "Жан: " + lives + " / " + LIVES); };
        hearts();
        stop = timer(stage, TOTAL, (l) => { timeEl.textContent = "⏱ " + Math.ceil(l / 1000); timeEl.classList.toggle("low", l <= 10000 && !FAST); const i = bar.firstChild; if (i) i.style.width = (l / TOTAL * 100) + "%"; }, () => end());
        show();
        function show() {
          if (qi >= queue.length) qi = 0;
          const q = queue[qi]; locked = false;
          const parts = q.s.split("___");
          const line = h("p", { class: "gen-sent", lang: "en" }, parts[0], h("span", { class: "gen-blank", "aria-label": "бос орын" }, "___"), parts[1] || "");
          const opts = h("div", { class: "gen-art", role: "group", "aria-label": "Артикль таңдау" }, ["a", "an", "the"].map((a, k) => { const b = h("button", { type: "button", class: "g-opt gen-artb", "data-a": a, lang: "en" }, h("b", { class: "gen-k", "aria-hidden": "true", text: (k + 1) + "." }), a); b.onclick = () => answer(a); return b; }));
          body.replaceChildren(line, h("p", { class: "gen-cue", text: "Мәтінмән: " + q.cue }), opts, h("p", { class: "g-fb gen-fb", role: "status", "aria-live": "polite" }));
        }
        function answer(a) {
          if (locked || ended) return; locked = true;
          const q = queue[qi], good = a === q.a; total++;
          const fb = body.querySelector(".gen-fb");
          body.querySelectorAll(".gen-artb").forEach((b) => { b.disabled = true; if (b.dataset.a === q.a) b.classList.add("ok"); else if (b.dataset.a === a) b.classList.add("bad"); });
          const blank = body.querySelector(".gen-blank"); if (blank) blank.textContent = q.a;
          if (good) { combo++; best = Math.max(best, combo); hit++; const gain = 10 + (combo >= 3 ? 5 : 0); score += gain; fb.className = "g-fb gen-fb gb-ok"; fb.textContent = "✓ +" + gain + (combo >= 3 ? " (комбо x" + combo + ")" : ""); ctx.sfx("ok"); }
          else { combo = 0; lives--; fb.className = "g-fb gen-fb gb-no"; fb.textContent = "✗ " + q.why; ctx.sfx("bad"); hearts(); }
          scoreEl.lastChild.textContent = score;
          const cb = stage.querySelector(".gen-combo"); if (cb) cb.textContent = combo >= 2 ? "🔥 x" + combo : "";
          qi++;
          if (lives <= 0) { advance = setTimeout(end, 900); return; }
          advance = setTimeout(() => { if (stage.isConnected && !ended) show(); }, good ? 450 : 1500);
        }
        function end() {
          if (ended) return; ended = true; stop(); clearTimeout(advance); document.removeEventListener("keydown", keyH);
          ctx.finish({ score, max: 300, title: lives <= 0 ? "Жандар таусылды 💔" : hit >= 20 ? "Артикль шебері! 🅰️" : "Уақыт бітті", lines: ["Дұрыс жауап: " + hit + " / " + total, "Ең ұзақ комбо: " + best, "Деңгей: " + LVN[level], "Дерек көзі: орнатылған артикль қоры (" + ART.length + " сөйлем)"] });
        }
      }
    },
  });

  /* =====================================================================
   * 5. Bug Report Fixer: қате commit / e-mail / баг-репорт мәтінін түзет
   * ===================================================================== */
  G.register({
    id: "enbugfix", title: "Bug Report Fixer", icon: "🛠️", color: "#b91c1c",
    blurb: "Қателі ағылшын commit, e-mail және баг-репорт мәтінін оқы да, дұрыс түзетуді таңда.",
    start(stage, ctx) {
      intro(ctx, stage, {
        lead: "Әр раундта қазақ тілді оқушылар жиі жіберетін қатесі бар IT-мәтін. Төрт нұсқадан <b>дұрыс түзетілгенін</b> таңда.",
        rules: [["🛠️", "8 мәтін: commit, e-mail, баг-репорт, code review"], ["✅", "Әр дұрыс жауап 15 ұпай"], ["📖", "Әр жауаптан кейін қазақша түсіндірме"], ["⌨️", "1-4 пернелері"]],
      }, run);

      function run(level) {
        const ok0 = FB_FIX.filter((x) => x.lvl <= level), near = ok0.filter((x) => x.lvl >= level - 1);
        // грамматика файлдарындағы mistakes: 2 нұсқалы жылдам раунд
        const gm = [];
        const D = window.CS50KZ_EN_GRAMMAR || {};
        LV.forEach((l, i) => {
          if (i > level) return;
          arr(D[l]).forEach((g) => {
            arr(g && g.mistakes).forEach((m) => {
              if (m && m.bad && m.good && norm(m.bad) !== norm(m.good) && String(m.bad).length < 80) gm.push({ bad: String(m.bad), ok: String(m.good), dis: [], why: String(m.why || ""), lvl: i, kind: "Грамматика", id: "gg-" + g.id + "-" + gm.length });
            });
          });
        });
        const pickMain = shuffle(near.length >= 5 ? near : ok0).slice(0, gm.length >= 3 ? 5 : 8);
        const pickG = shuffle(gm.filter((x) => x.lvl >= level - 1).concat(gm)).filter((v, i, a) => a.indexOf(v) === i).slice(0, 8 - pickMain.length);
        const rounds = shuffle(pickMain.concat(pickG));
        let ri = 0, score = 0, hit = 0, locked = false, opts = [];
        const keyH = (e) => {
          if (!stage.isConnected) return document.removeEventListener("keydown", keyH);
          if (locked || !/^[1-4]$/.test(e.key) || e.ctrlKey || e.metaKey || e.altKey) return;
          if (+e.key > opts.length) return;
          e.preventDefault(); answer(+e.key - 1);
        };
        document.addEventListener("keydown", keyH);
        round();
        function round() {
          const r = rounds[ri]; locked = false;
          opts = shuffle([{ t: r.ok, ok: true }].concat(r.dis.length ? r.dis.map((t) => ({ t, ok: false })) : [{ t: r.bad, ok: false }]));
          stage.textContent = "";
          const box = h("div", { class: "g-opts gen-opts", role: "group", "aria-labelledby": "gen-q" }, opts.map((o, i) => { const b = h("button", { type: "button", class: "g-opt gen-opt", lang: "en", "data-i": i }, h("b", { class: "gen-k", "aria-hidden": "true", text: (i + 1) + "." }), h("span", { text: o.t })); b.onclick = () => answer(i); return b; }));
          stage.append(h("div", { class: "gen" },
            hud([h("span", { class: "gen-board", text: "Мәтін " + (ri + 1) + " / " + rounds.length }), h("span", { class: "gen-tag", text: r.kind }), h("span", { class: "gen-score" }, "Ұпай: ", h("b", { text: String(score) }))]),
            h("div", { class: "gen-card-bad" }, h("span", { class: "gen-card-t", text: r.dis.length ? "Қатесі бар мәтін" : "Жиі кездесетін қате не табиғи емес нұсқа" }), h("p", { lang: "en", text: r.bad })),
            h("p", { class: "g-q", id: "gen-q", text: r.dis.length ? "Қайсысы дұрыс түзетілген?" : "Қайсысы дұрыс (табиғи) нұсқа?" }), box,
            h("div", { class: "g-fb gen-fb", role: "status", "aria-live": "polite" }), h("div", { class: "gb-after" })));
        }
        function answer(i) {
          if (locked) return; locked = true;
          const r = rounds[ri], good = opts[i].ok;
          stage.querySelectorAll(".gen-opt").forEach((b, k) => { b.disabled = true; if (opts[k].ok) b.classList.add("ok"); else if (k === i) b.classList.add("bad"); });
          if (good) { score += 15; hit++; }
          ctx.sfx(good ? "ok" : "bad");
          const fb = stage.querySelector(".gen-fb"); fb.className = "g-fb gen-fb " + (good ? "gb-ok" : "gb-no");
          fb.textContent = good ? "✓ Дұрыс! +15" : "✗ Қате. Дұрыс нұсқа жасылмен көрсетілді.";
          if (r.why) stage.querySelector(".gb-after").append(h("p", { class: "gb-expl" }, h("b", { text: "Түсіндірме: " }), r.why));
          const last = ri + 1 >= rounds.length;
          const nb = h("button", { type: "button", class: "btn gb-next gen-next", text: last ? "Нәтижені көру" : "Келесі ▸" });
          nb.onclick = () => { if (last) { document.removeEventListener("keydown", keyH); ctx.finish({ score, max: rounds.length * 15, title: hit >= 7 ? "Тамаша редактор! 🛠️" : hit >= 4 ? "Жақсы нәтиже!" : "Қайталап көр!", lines: ["Дұрыс: " + hit + " / " + rounds.length, "Деңгей: " + LVN[level], "Дерек көзі: орнатылған IT-мәтін қоры" + (gm.length ? " және курстың грамматика жазбалары" : "")] }); } else { ri++; round(); } };
          stage.querySelector(".gb-after").append(nb); nb.focus();
          const sc = stage.querySelector(".gen-score b"); if (sc) sc.textContent = score;
        }
      }
    },
  });

  window.CS50GamesEn = { counts: { vocab: FB_VOCAB.length, sentences: FB_SENT.length, articles: ART.length, fixes: FB_FIX.length }, vocabPool, sentencePool, ART, FB_FIX };
})();
