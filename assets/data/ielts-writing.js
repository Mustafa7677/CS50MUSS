/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* IELTS Writing Studio - авторлық тапсырмалар. Task 1 деректері ойдан шығарылған (Lakeford - қиял қала), бірақ іштей үйлесімді:
   барлық салыстыру тұжырымдарының ақиқаттығы осы сандардан бағдарлама арқылы есептеледі (ielts-writing.js). */
window.IELTS_WRITING = {
  task1: {
    prompt: "The graph below shows the number of visitors to three attractions in the city of Lakeford between 2004 and 2024. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
    unit: "thousand visitors",
    years: [2004, 2008, 2012, 2016, 2020, 2024],
    series: [
      { id: "museum", name: "Science Museum", short: "the museum", v: [220, 200, 185, 160, 140, 130] },
      { id: "garden", name: "Botanical Garden", short: "the garden", v: [80, 95, 120, 150, 190, 240] },
      { id: "aquarium", name: "City Aquarium", short: "the aquarium", v: [150, 155, 150, 160, 155, 150] },
    ],
    // Шолу (overview) нұсқалары: kind = overview (дұрыс шолу) | detail (дұрыс, бірақ бөлшек) | false (деректерге қайшы)
    overview: [
      { t: "Overall, visits to the botanical garden rose sharply, while the museum became less popular and the aquarium's figures hardly changed.", kind: "overview", why: "Үш нысанның басты тенденциясын бір сөйлеммен береді - нақты сансыз. Бұл - шолу." },
      { t: "By the end of the period, the botanical garden had become the most visited attraction, having been the least visited in 2004.", kind: "overview", why: "Ең маңызды өзгеріс: орындардың алмасуы. 2004 жылы бақ ең аз (80), 2024 жылы ең көп (240)." },
      { t: "In 2008, the science museum received 200,000 visitors.", kind: "detail", why: "Дерек дұрыс, бірақ бұл - бір жылдың бір саны. Шолуда бөлшек емес, үлкен сурет болуы керек; бұл сан негізгі абзацқа барады." },
      { t: "Overall, all three attractions became more popular over the twenty years.", kind: "false", why: "Қате: мұражайға келушілер 220-дан 130 мыңға азайды, аквариум өзгермеді." },
      { t: "The aquarium was the most popular attraction throughout the period.", kind: "false", why: "Қате: 2004-2012 жылдары мұражай аквариумнан көп болды (мыс. 2004: 220 > 150), 2020-2024 жылдары - бақ." },
    ],
    model: "The line graph compares how many people visited three attractions in Lakeford - a science museum, a botanical garden and an aquarium - over a twenty-year period from 2004.",
  },
  task2: {
    prompt: "Some people believe that every university student should be required to take at least one course outside their main subject. To what extent do you agree or disagree? Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.",
    topicWords: ["course", "courses", "subject", "subjects", "student", "students", "university", "universities", "outside", "field", "required", "compulsory"],
    stances: [
      { id: "agree", t: "Келісемін", en: "agree" },
      { id: "disagree", t: "Келіспеймін", en: "disagree" },
      { id: "partly", t: "Ішінара келісемін", en: "partly agree" },
    ],
    // Тезис құрылымдары: үлгі емес, бастама. Оқушы кез келгенін өзгерте алады не мүлде өзі жазады.
    patterns: [
      { t: "Тікелей", f: (s, r1, r2) => s === "partly" ? `I partly agree that every student should take a course outside their main subject: it can ${r1 || "…"}, although ${r2 || "…"}.` : `I strongly ${s === "agree" ? "agree" : "disagree"} that every university student should be required to take a course outside their main subject, because ${r1 || "…"} and ${r2 || "…"}.` },
      { t: "Қарсы ойдан бастау", f: (s, r1, r2) => s === "disagree" ? `Although a course outside one's main subject can broaden the mind, I believe it should not be compulsory, since ${r1 || "…"} and ${r2 || "…"}.` : `Although some students may see it as a distraction, I believe ${s === "partly" ? "a limited requirement of this kind" : "a compulsory course outside the main subject"} is worthwhile, as ${r1 || "…"} and ${r2 || "…"}.` },
      { t: "Шарт қою", f: (s, r1, r2) => `In my view, such a requirement ${s === "disagree" ? "would do more harm than good" : s === "partly" ? "is useful only if students can choose the course freely" : "benefits students"}: ${r1 || "…"}, and ${r2 || "…"}.` },
    ],
  },
  linkers: ["however", "moreover", "furthermore", "in addition", "therefore", "as a result", "for example", "for instance", "on the other hand", "in contrast", "although", "while", "whereas", "consequently", "firstly", "secondly", "finally", "in conclusion", "overall", "this means", "because", "since"],
  checklist: {
    task1: [
      { c: "Task Achievement", q: ["Кіріспеде тапсырманы өз сөзіммен (көшірмей) бердім.", "Жеке шолу (overview) бар: басты тенденциялар, нақты сансыз.", "Маңызды ерекшеліктерді сандармен дәлелдедім, бәрін тізбедім.", "Өз пікірімді не графикте жоқ себептерді қоспадым."] },
      { c: "Coherence and Cohesion", q: ["Әр негізгі абзацтың өз тобы бар (мыс. өзгергендер / өзгермегендер).", "Байланыстырғыштар (while, whereas, by contrast) орынды, шамадан тыс емес.", "it / this / the former сияқты сілтемелер кімге қатысты екені анық."] },
      { c: "Lexical Resource", q: ["Өзгеріс сөздерін алмастырдым (rose, climbed, fell, declined, remained stable).", "Бір сөзді қайталай бермедім (visitors / visits / attendance).", "Емлені тексердім."] },
      { c: "Grammatical Range and Accuracy", q: ["Өткен шақ (2004-2024 - өткен кезең) дұрыс қолданылды.", "Салыстыру құрылымдары бар (twice as many as, higher than).", "Күрделі сөйлемдер де бар, бірақ түсінікті."] },
    ],
    task2: [
      { c: "Task Response", q: ["Сұрақтың барлық бөлігіне жауап бердім (To what extent...?).", "Позициям кіріспеден қорытындыға дейін анық әрі бірдей.", "Әр негізгі идеяны түсіндіріп, мысалмен дамыттым."] },
      { c: "Coherence and Cohesion", q: ["Әр абзацта бір басты ой бар.", "Абзацтар қисынды ретпен жүреді.", "Байланыстырғыштар әртүрлі және орынды."] },
      { c: "Lexical Resource", q: ["Тақырыпқа сай сөздер қолдандым (curriculum, specialise, broaden...).", "Тапсырманың сөздерін көшірмей, басқаша айттым.", "Емле мен сөз тіркестерін тексердім."] },
      { c: "Grammatical Range and Accuracy", q: ["Қарапайым және күрделі сөйлемдер аралас.", "Етістік пен бастауыш үйлесімін, артикльдерді тексердім.", "Тыныс белгілері сөйлем шекарасын дұрыс көрсетеді."] },
    ],
  },
};
