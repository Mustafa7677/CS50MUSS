/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* IELTS Listening Test - жауап валидаторы (DOM-сыз, таза функциялар; тесттер window.IELTS_LT_VALIDATE арқылы шақырады).
   Ережелер: бас/кіші әріп маңызды емес; емле маңызды (жуық жауап «емле қатесі» деп түсіндіріледі, бірақ дұрыс саналмайды);
   нұсқаудағы сөз шегі тексеріледі (сызықшалы сөз = 1 сөз; цифрмен не сөзбен жазылған сан = сан);
   бос орынның алдындағы/кейінгі сөзді қайталау - сөйлемді бұзады; тізімдегі тұзақтар (бас тартылған нұсқалар) жеке түсіндіріледі. */
(() => {
  "use strict";
  const UNITS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
  const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  const ORD = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15, sixteenth: 16, seventeenth: 17, eighteenth: 18, nineteenth: 19, twentieth: 20, thirtieth: 30, fortieth: 40, fiftieth: 50, sixtieth: 60, seventieth: 70, eightieth: 80, ninetieth: 90 };
  const one = (w) => (w in UNITS ? UNITS[w] : w in ORD && ORD[w] < 20 ? ORD[w] : null);
  /** «thirty-six», «ninth», «twenty-third», «seventy» → сан; әйтпесе null */
  function wordNum(t) {
    if (t in UNITS) return UNITS[t];
    if (t in TENS) return TENS[t];
    if (t in ORD) return ORD[t];
    const m = t.match(/^([a-z]+)-([a-z]+)$/);
    if (m && m[1] in TENS) { const u = one(m[2]); if (u != null && u > 0 && u < 10) return TENS[m[1]] + u; }
    return null;
  }
  const DIGIT = /^£?\d+(?:[.,]\d+)?(?:st|nd|rd|th|%)?$/;
  const isNum = (t) => DIGIT.test(t) || wordNum(t) != null;
  const numVal = (t) => (DIGIT.test(t) ? parseFloat(t.replace(/^£/, "").replace(/(st|nd|rd|th|%)$/, "").replace(",", ".")) : wordNum(t));
  const NUM_EXTRA = new Set(["the", "pounds", "pound", "km", "kilometres", "kilometers", "%"]);

  function norm(s) {
    return String(s == null ? "" : s).toLowerCase().normalize("NFKC")
      .replace(/[’‘`]/g, "'").replace(/[–—]/g, "-")
      .replace(/£\s+/g, "£").replace(/(\d)\s+%/g, "$1%")
      .replace(/[.,;:!?"()]+(?=\s|$)/g, " ").replace(/^[.,;:!?"()]+/, "")
      .replace(/\s*-\s*/g, "-").replace(/\s+/g, " ").trim();
  }
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  const lastWord = (s) => { const m = norm(s).match(/([a-z0-9]+)$/); return m ? m[1] : ""; };
  const firstWord = (s) => { const m = norm(s).match(/^([a-z0-9]+)/); return m ? m[1] : ""; };

  /**
   * Бос орынды тексеру. q: { a:[...], kind:"word"|"num", wrong:{...}, pre, post, why }, lim: { w, n, en, kk }.
   * Қайтарады { ok, code, title, why }; code: ok | blank | word-limit | repeat | distractor | spelling | plural | wrong
   */
  function gap(q, raw, lim) {
    const v = norm(raw);
    if (!v) return { ok: false, code: "blank", title: "Жауап жоқ", why: "Бос орын толтырылмады. IELTS-те қате жауап үшін балл алынбайды, сондықтан бос қалдырмай, болжап болса да жазыңыз." };
    const tk = v.split(" ");
    const nums = tk.filter(isNum), wds = tk.filter((t) => !isNum(t) && t !== "%");
    if (wds.length > lim.w || nums.length > (lim.n ? 1 : 0)) {
      const small = wds.filter((w) => ["the", "a", "an", "of", "to", "per", "cent"].includes(w));
      return { ok: false, code: "word-limit", title: "Сөз шегінен асты",
        why: `Нұсқау: ${lim.en} - яғни ${lim.kk}. Сізде ${wds.length} сөз${nums.length ? " және " + nums.length + " сан" : ""}${small.length ? ` («${small.join("», «")}» сияқты шағын сөздер де саналады)` : ""}. Мағынасы дұрыс болса да, шектен асқан жауап қате саналады.` };
    }
    const pre = lastWord(q.pre || ""), post = firstWord(q.post || "");
    if ((pre && tk[0] === pre && tk.length > 1) || (post && tk[tk.length - 1] === post && tk.length > 1))
      return { ok: false, code: "repeat", title: "Берілген сөз қайталанды",
        why: `Бос орынның ${tk[0] === pre ? `алдында «${pre}»` : `кейін «${post}»`} жазылып тұр. Жауап сөйлемге дәл сыюы керек: қайталанған сөз сөйлемді бұзады, сондықтан мұндай жауап дұрыс саналмауы мүмкін. Тек жетіспейтін бөлігін жазыңыз.` };
    const wrong = q.wrong || {};
    if (q.kind === "num") {
      const extras = wds.filter((w) => !NUM_EXTRA.has(w));
      const val = nums.length === 1 ? numVal(nums[0]) : null;
      if (val != null && !extras.length && q.a.map(Number).includes(val)) return { ok: true, code: "ok" };
      const w = val != null ? wrong[String(val)] : wrong[v];
      if (w) return { ok: false, code: "distractor", title: "Тұзақ: бұл - басқа (бас тартылған не ескі) сан", why: w };
      return { ok: false, code: "wrong", title: "Дұрыс емес", why: q.why };
    }
    const flat = tk.join(" ");
    if (q.a.includes(flat)) return { ok: true, code: "ok" };
    if (wrong[flat]) return { ok: false, code: "distractor", title: "Тұзақ: бұл ақпарат айтылды, бірақ жауап емес", why: wrong[flat] };
    const plural = q.a.find((a) => a === flat + "s" || a + "s" === flat || a === flat + "es");
    if (plural) return { ok: false, code: "plural", title: "Жекеше/көпше түр сәйкес емес", why: `Сіз «${raw.trim()}» деп жаздыңыз, жазбада «${plural}». Сөздің -s жалғауы да емленің бөлігі: оны жоғалту не қосу жауапты қате етуі мүмкін.` };
    const near = q.a.find((a) => a.length >= 4 && lev(flat, a) <= (a.length <= 6 ? 1 : 2));
    if (near) return { ok: false, code: "spelling", title: "Емле қатесі", why: `Сіз «${raw.trim()}» деп жаздыңыз, дұрысы «${near}». Бас/кіші әріп маңызды емес, бірақ емле қатесі бар жауап дұрыс саналмайды.` };
    return { ok: false, code: "wrong", title: "Дұрыс емес", why: q.why };
  }

  /** Таңдау сұрағы (mc - индекс, map/match - әріп). */
  function choice(q, val) {
    if (val == null || val === "" || val === -1) return { ok: false, code: "blank", title: "Жауап таңдалмады", why: "Бос қалдырмаңыз: таңдау сұрағында болжау да мүмкіндік береді." };
    const ok = String(val) === String(q.a);
    if (ok) return { ok: true, code: "ok" };
    const w = q.wrong && q.wrong[val];
    return { ok: false, code: w ? "distractor" : "wrong", title: w ? "Тұзақ нұсқа" : "Дұрыс емес", why: w || q.why };
  }

  window.IELTS_LT_VALIDATE = { gap, choice, norm, wordNum, isNum, lev };
})();
