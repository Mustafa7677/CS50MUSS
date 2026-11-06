/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* IELTS Listening Laboratory - Section 1 үлгісіндегі авторлық диалог (курсқа жазылу). AO17 үшін жазылған; ешбір емтихан жинағынан алынбаған.
   t - экрандағы мәтін, say - синтезаторға арналған оқылу нұсқасы (сандар мен әріптерді британша оқыту үшін).
   Телефон нөмірі 07700 900xxx - Ұлыбританияда фильмдер мен оқу материалдарына арнайы бөлінген, нақты абонентке тиесілі емес ауқым. */
window.IELTS_LISTENING = {
  title: "Riverside Community Centre: course booking",
  speakers: { R: { name: "Receptionist", kk: "Тіркеуші", pitch: 1.15, rate: 1 }, C: { name: "Daniel", kk: "Қоңырау шалушы", pitch: 0.8, rate: 0.98 } },
  segments: [
    { lines: [
      { w: "R", t: "Good morning, Riverside Community Centre. How can I help you?" },
      { w: "C", t: "Oh, hello. I'm calling about the photography classes I saw advertised. Are there still places on the beginners' course?" },
      { w: "R", t: "Let me have a look. We run the beginners' course on two evenings, Tuesdays and Thursdays. I'm afraid Tuesday is fully booked now, but there are still a few places on Thursday." },
      { w: "C", t: "Thursday's fine, actually. That suits me better anyway." },
    ] },
    { lines: [
      { w: "C", t: "And when does it start?" },
      { w: "R", t: "The next course begins on the 15th of October - oh, sorry, I was reading the wrong line. It's the 16th. Thursday the 16th of October.", say: "The next course begins on the fifteenth of October. Oh, sorry, I was reading the wrong line. It's the sixteenth. Thursday the sixteenth of October." },
      { w: "C", t: "Great. And how long is each class?" },
      { w: "R", t: "Two hours, from seven until nine. For the first session, though, we ask everyone to come fifteen minutes early so they can fill in a registration form." },
    ] },
    { lines: [
      { w: "R", t: "Can I take your name, please?" },
      { w: "C", t: "Yes, it's Daniel Whitlock." },
      { w: "R", t: "Could you spell your surname for me?" },
      { w: "C", t: "Sure. W-H-I-T-L-O-C-K.", say: "Sure. W. H. I. T. L. O. C. K." },
      { w: "R", t: "Thank you. And a contact number?" },
      { w: "C", t: "It's 07700 900461.", say: "It's oh seven seven, double oh. Nine double oh, four six one." },
      { w: "R", t: "So that's 07700 900461.", say: "So that's oh seven seven double oh, nine double oh four six one." },
      { w: "C", t: "That's right." },
    ] },
    { lines: [
      { w: "C", t: "How much does the course cost?" },
      { w: "R", t: "The full price is £95 for the ten weeks, but members of the centre get a discount, so they pay £85. Are you a member?", say: "The full price is ninety-five pounds for the ten weeks, but members of the centre get a discount, so they pay eighty-five. Are you a member?" },
      { w: "C", t: "Yes, I joined the gym here last year." },
      { w: "R", t: "Then it's £85 for you. You can pay on the first evening.", say: "Then it's eighty-five pounds for you. You can pay on the first evening." },
    ] },
    { lines: [
      { w: "C", t: "Do I need to buy any equipment? I've only got a fairly basic camera." },
      { w: "R", t: "A basic camera is perfect - even a phone camera is fine for the first few weeks. You don't need a tripod; we lend those out. Just bring a notebook, because the tutor gives a lot of tips you'll want to write down." },
    ] },
    { lines: [
      { w: "R", t: "Can I ask why you're interested in the course? It helps the tutor to plan." },
      { w: "C", t: "Well, it's not for work, although my manager keeps saying I should take the photos for our company newsletter. Really, I just want to take better pictures of the birds in the park near my flat." },
      { w: "R", t: "Then you'll enjoy week four - that's when the group goes outdoors to practise in the park." },
    ] },
    { lines: [
      { w: "R", t: "And one last question: how did you hear about us?" },
      { w: "C", t: "I think it was on your website... no, actually, it was an advert in the local newspaper." },
      { w: "R", t: "Lovely. I'll email you a receipt for your booking today. The timetable is on our website if you want to check it." },
      { w: "C", t: "Perfect. Thanks very much for your help." },
      { w: "R", t: "You're welcome. See you on the 16th!", say: "You're welcome. See you on the sixteenth!" },
    ] },
  ],
  // Форма: NO MORE THAN TWO WORDS AND/OR A NUMBER. key = [сегмент, жол] - дұрыс (соңғы) ақпарат тұрған жол
  form: [
    { n: 1, label: "Day of course", pre: "", post: "evening", kind: "word", a: ["thursday", "thursdays"], key: [0, 2],
      why: "Тіркеуші екі күнді атайды, бірақ «Tuesday is fully booked» - сейсенбі толы. Бос орын тек бейсенбіде (Thursday).",
      wrong: { tuesday: "Tuesday аталды, бірақ ол «fully booked» - орын жоқ. Бірінші естілген жауап әрдайым соңғы ақпарат емес.", tuesdays: "Tuesdays толып қалған (fully booked)." } },
    { n: 2, label: "Start date", pre: "", post: "October", kind: "date", a: ["16", "16th", "sixteenth", "16 october", "16th october", "sixteenth october", "october 16", "october 16th"], key: [1, 1],
      why: "Алдымен «the 15th» дейді, бірақ бірден түзетеді: «oh, sorry... It's the 16th». Дұрысы - түзетілген соңғы ақпарат: 16.",
      wrong: { "15": "15 - тіркеушінің қателігі; ол бірден «sorry... It's the 16th» деп түзетті. Сөйлеуші өзін түзетсе, соңғы нұсқа есептеледі.", "15th": "15th - түзетілген қате. Соңғы нұсқа - 16th.", fifteenth: "Fifteenth - түзетілген қате. Соңғы нұсқа - sixteenth (16th)." } },
    { n: 3, label: "Surname", pre: "Daniel", post: "", kind: "name", a: ["whitlock"], key: [2, 3],
      why: "Тегі әріппен айтылды: W-H-I-T-L-O-C-K. Әріптеп айтылған атауды дәл жазу керек: бір әріп қате болса, жауап қате." },
    { n: 4, label: "Phone number", pre: "", post: "", kind: "phone", a: ["07700900461"], key: [2, 5],
      why: "Нөмір: 07700 900461. Британдықтар 0-ді «oh», 00-ді «double oh» деп айтады. Бүтін телефон нөмірі бір «сан» болып саналады." },
    { n: 5, label: "Fee (members)", pre: "£", post: "", kind: "money", a: ["85", "£85", "85 pounds", "eighty-five", "eighty five", "£85.00", "85.00"], key: [3, 3],
      why: "Толық баға £95, бірақ мүшелерге £85. Daniel - мүше («I joined the gym here last year»), сондықтан £85.",
      wrong: { "95": "£95 - толық баға (full price). Daniel орталықтың мүшесі, мүшелер £85 төлейді.", "£95": "£95 - мүше еместердің бағасы. Daniel мүше, сондықтан £85.", "ninety-five": "Ninety-five - толық баға; мүшелерге 85." } },
    { n: 6, label: "Bring", pre: "a camera and a", post: "", kind: "word", a: ["notebook", "note book", "a notebook"], key: [4, 1],
      why: "«You don't need a tripod; we lend those out. Just bring a notebook» - штатив керек емес, дәптер әкелу керек.",
      wrong: { tripod: "Tripod керек емес - орталық береді («we lend those out»). Сөз естілгенімен, ол жауап емес: «You don't need...».", "a tripod": "Tripod - орталық береді, оны әкелудің қажеті жоқ." } },
    { n: 7, label: "Heard about course from", pre: "", post: "", kind: "word", a: ["local newspaper", "newspaper", "the local newspaper", "a local newspaper", "local paper"], key: [6, 1],
      why: "Daniel алдымен «website» дейді, сосын түзетеді: «no, actually, it was an advert in the local newspaper».",
      wrong: { website: "Website - Daniel бірден түзетті: «no, actually... the local newspaper». «Actually», «sorry», «I mean» - түзету сигналдары.", "your website": "Website - түзетілген ақпарат; дұрысы local newspaper." } },
  ],
  mc: [
    { n: 8, q: "What are students asked to do at the first session?", opts: ["bring a tripod", "arrive early to complete a form", "go outdoors to the park"], a: 1, key: [1, 3],
      why: "«For the first session... come fifteen minutes early so they can fill in a registration form».",
      wrong: { 0: "Tripod қажет емес - орталық береді (5-бөлік).", 2: "Саябаққа шығу - төртінші аптада (week four), бірінші сабақта емес." } },
    { n: 9, q: "Why does Daniel want to take the course?", opts: ["to photograph birds", "to take photos for his company", "to sell his pictures"], a: 0, key: [5, 1],
      why: "«it's not for work... Really, I just want to take better pictures of the birds in the park».",
      wrong: { 1: "Компания газеті - менеджерінің ойы. Daniel тікелей айтады: «it's not for work».", 2: "Суретті сату туралы ешкім айтпады." } },
    { n: 10, q: "What will the receptionist send to Daniel?", opts: ["a printed timetable", "a receipt by email", "a map of the centre"], a: 1, key: [6, 2],
      why: "«I'll email you a receipt for your booking today».",
      wrong: { 0: "Кесте (timetable) жіберілмейді - ол сайтта: «The timetable is on our website».", 2: "Карта туралы айтылған жоқ." } },
  ],
  predict: [
    { n: 1, a: "word", t: "күн атауы (сөз)" }, { n: 2, a: "number", t: "сан (күн)" }, { n: 3, a: "name", t: "атау (әріптеп)" },
    { n: 4, a: "number", t: "сан (телефон)" }, { n: 5, a: "number", t: "сан (баға)" },
  ],
  vocab: [
    { w: "fully booked", kk: "орын қалмаған, толық жазылған", s: "I'm afraid Tuesday is ___ now." },
    { w: "discount", kk: "жеңілдік", s: "Members of the centre get a ___, so they pay £85." },
    { w: "registration form", kk: "тіркеу парағы", s: "Come fifteen minutes early to fill in a ___." },
    { w: "lend", kk: "уақытша беру", s: "You don't need a tripod; we ___ those out." },
    { w: "receipt", kk: "түбіртек, төлем құжаты", s: "I'll email you a ___ for your booking today." },
    { w: "advert", kk: "жарнама", s: "It was an ___ in the local newspaper." },
  ],
};
