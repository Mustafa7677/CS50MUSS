/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* IELTS General Training Writing Task 1 - Letter Studio: авторлық хат тапсырмалары (компания мен адамдар ойдан шығарылған),
   регистр зертханасы (ашылу, мақсат, өтініш, аяқталу) және жаңа жағдайлар генераторы. reg: formal | semi | informal. */
window.IELTS_WTL = {
  regNames: { formal: "Ресми (адресат аты белгісіз)", semi: "Жартылай ресми (аты белгілі, жақын емес)", informal: "Бейресми (дос, туыс)" },
  tasks: [
    {
      id: "formal", reg: "formal", title: "Ресми хат: жоғалған сөмке",
      prompt: "You recently travelled on a coach run by Northline Coaches and left a bag on the coach when you got off. Write a letter to the company. In your letter:\n• describe the journey and the bag\n• explain why the bag is important to you\n• say what you would like the company to do\nWrite at least 150 words. You do NOT need to write any addresses. Begin your letter as follows: Dear ............,",
      note: "Northline Coaches - ойдан шығарылған компания. Адресат - компанияның аты белгісіз қызметкері.",
      bullets: [
        { t: "describe the journey and the bag", key: ["journey", "coach", "travelled", "route", "seat", "left", "bag", "rucksack", "suitcase", "colour", "black", "blue", "brown", "red", "leather", "small", "large"] },
        { t: "explain why the bag is important to you", key: ["important", "because", "contains", "inside", "documents", "passport", "laptop", "gift", "need", "valuable", "medicine", "notes", "sentimental"] },
        { t: "say what you would like the company to do", key: ["would like", "could you", "please", "contact", "return", "send", "check", "grateful", "appreciate", "let me know", "lost property", "inform"] },
      ],
      lab: [
        { q: "Ашылу (salutation)", opts: [
          ["Dear Sir or Madam,", 1, "Дұрыс: адресаттың аты белгісіз ресми хат."],
          ["Dear Northline Coaches,", 0, "Ұйымның атымен амандаспайды: хатты адам оқиды. Аты белгісіз болса - Dear Sir or Madam."],
          ["Hi there!", 0, "Тым бейресми: компанияға шағым/өтініш хатында қолданылмайды."],
          ["Dear Mr Northline,", 0, "Мұндай адам жоқ - компания атауы тегі емес. Аты белгісіз: Dear Sir or Madam."]] },
        { q: "Мақсатты айтатын бірінші сөйлем", opts: [
          ["I am writing to ask for your help in finding a bag that I left on one of your coaches last Friday.", 1, "Дұрыс: мақсат бірінші сөйлемде, ресми әрі нақты (не, қайда, қашан)."],
          ["Guess what - I've lost my bag on your bus!", 0, "Тым бейресми: «Guess what», леп белгісі, қысқартулар ресми хатқа сай емес."],
          ["Coaches are a very popular way to travel these days.", 0, "Мақсат жоқ - оқырман хаттың неге жазылғанын білмейді. Task Achievement үшін мақсат бірден айтылуы керек."],
          ["I demand that you find my bag immediately.", 0, "Ресми, бірақ дөрекі тон: «I demand» - өтініш емес, талап. Сыпайы өтініш: I would be grateful if…"]] },
        { q: "Өтініш сөйлемі (3-тармақ)", opts: [
          ["I would be grateful if you could check your lost property office and contact me on the number below.", 1, "Дұрыс: сыпайы ресми өтініш (I would be grateful if you could…)."],
          ["Can you just send it back ASAP?", 0, "Бейресми: «just», «ASAP» - досқа жазылатын тіл."],
          ["Send my bag to my address.", 0, "Бұйрық рай - ресми хатта дөрекі естіледі."],
          ["It would be cool if you found it.", 0, "«cool» - бейресми сөз."]] },
        { q: "Аяқталу (closing)", opts: [
          ["Yours faithfully,", 1, "Дұрыс: Dear Sir or Madam → Yours faithfully (британ ережесі)."],
          ["Yours sincerely,", 0, "Yours sincerely адресаттың аты аталғанда (Dear Mr Hart) қолданылады. Dear Sir or Madam-мен - Yours faithfully."],
          ["Lots of love,", 0, "Тек жақын адамға (отбасы, жақын дос)."],
          ["See you soon,", 0, "Бейресми және мағынасы сай емес: компаниямен кездеспейсіз."]] },
      ],
    },
    {
      id: "semi", reg: "semi", title: "Жартылай ресми хат: демалыс сұрау",
      prompt: "You need to take two days off work next month. Write a letter to your manager, Ms Elena Ruiz. In your letter:\n• explain why you need to take the time off\n• suggest how your work could be covered while you are away\n• say how you can be contacted if necessary\nWrite at least 150 words. You do NOT need to write any addresses. Begin your letter as follows: Dear ............,",
      note: "Ms Elena Ruiz - ойдан шығарылған адам. Адресат - атын білетін, бірақ жақын емес адам (басшы).",
      bullets: [
        { t: "explain why you need to take the time off", key: ["because", "reason", "wedding", "family", "sister", "brother", "appointment", "move", "moving", "graduation", "need", "attend", "exam", "ceremony"] },
        { t: "suggest how your work could be covered", key: ["cover", "colleague", "team", "finish", "before", "complete", "hand over", "handover", "deadline", "report", "arrange", "suggest", "could"] },
        { t: "say how you can be contacted if necessary", key: ["contact", "phone", "email", "e-mail", "call", "reach", "available", "number", "message", "mobile"] },
      ],
      lab: [
        { q: "Ашылу (salutation)", opts: [
          ["Dear Ms Ruiz,", 1, "Дұрыс: аты белгілі, бірақ жақын емес адам - Dear + Ms/Mr + тегі."],
          ["Dear Sir or Madam,", 0, "Адресаттың аты белгілі (Ms Elena Ruiz) - атын қолданыңыз."],
          ["Dear Ms Elena,", 0, "Қате тіркес: Ms/Mr тегімен (Ruiz) қолданылады, атпен (Elena) емес."],
          ["Hey Elena!", 0, "Басшыға тым бейресми."]] },
        { q: "Мақсатты айтатын бірінші сөйлем", opts: [
          ["I am writing to ask whether I could take two days off on 14 and 15 May.", 1, "Дұрыс: мақсат бірінші сөйлемде, сыпайы сұрақ (whether I could…), нақты күндер."],
          ["I'm off for two days next month, just so you know.", 0, "Бейресми әрі сұрау емес - хабарлау. Басшыдан рұқсат сұралады."],
          ["I hope you are well and that the weather is nice where you are.", 0, "Сыпайы, бірақ мақсат жоқ; ресмилеу хатта бірден мақсатқа көшіңіз."],
          ["Hereby I formally request a leave of absence of forty-eight hours.", 0, "Тым ресми әрі табиғи емес (hereby, forty-eight hours) - жартылай ресми хатқа ауыр."]] },
        { q: "Ұсыныс сөйлемі (2-тармақ)", opts: [
          ["I will finish the monthly report before I leave, and my colleague Daniyar has kindly agreed to answer my emails.", 1, "Дұрыс: нақты ұсыныс, сыпайы әрі кәсіби тон."],
          ["Don't worry, the others can do my stuff.", 0, "«stuff», «Don't worry» - бейресми; ұсыныс бұлыңғыр."],
          ["Work will be covered.", 0, "Тым қысқа әрі бұлыңғыр: кім, қалай? Тармақ дамытылмаған."],
          ["It is not my responsibility to organise cover.", 0, "Тон қате: тапсырма ұсыныс жасауды сұрайды."]] },
        { q: "Аяқталу (closing)", opts: [
          ["Yours sincerely,", 1, "Дұрыс: Dear Ms Ruiz → Yours sincerely (Kind regards да жарайды)."],
          ["Yours faithfully,", 0, "Yours faithfully - тек Dear Sir or Madam-мен."],
          ["Love,", 0, "Басшыға мүлде сай емес."],
          ["Cheers,", 0, "Бейресми: досқа ғана."]] },
      ],
    },
    {
      id: "informal", reg: "informal", title: "Бейресми хат: досқа",
      prompt: "A friend, Sam, has invited you to stay at their home next month, but you are not able to go. Write a letter to your friend. In your letter:\n• thank Sam and explain why you cannot come\n• suggest another time when you could visit\n• tell Sam about something new in your life\nWrite at least 150 words. You do NOT need to write any addresses. Begin your letter as follows: Dear ............,",
      note: "Sam - ойдан шығарылған дос.",
      bullets: [
        { t: "thank Sam and explain why you cannot come", key: ["thank", "thanks", "invitation", "invite", "sorry", "can't", "cannot", "because", "exam", "work", "busy", "unfortunately"] },
        { t: "suggest another time when you could visit", key: ["how about", "what about", "could", "maybe", "perhaps", "summer", "winter", "autumn", "spring", "next", "month", "weekend", "holiday", "later"] },
        { t: "tell Sam about something new in your life", key: ["new", "started", "job", "course", "moved", "flat", "puppy", "dog", "learning", "news", "bought", "joined", "guess"] },
      ],
      lab: [
        { q: "Ашылу (salutation)", opts: [
          ["Dear Sam,", 1, "Дұрыс: досқа - Dear + аты (Hi Sam де жарайды, бірақ тапсырма «Dear» деп бастауды сұрайды)."],
          ["Dear Sir or Madam,", 0, "Досыңызға мүлде сай емес - тым ресми әрі адамсыз."],
          ["Dear Mr Sam,", 0, "Mr тегімен ғана, және досқа Mr қолданылмайды."],
          ["To whom it may concern,", 0, "Ең ресми, адресатсыз формула - досқа жазылмайды."]] },
        { q: "Бірінші сөйлем", opts: [
          ["Thanks so much for inviting me to stay next month - it was really kind of you.", 1, "Дұрыс: жылы, табиғи бейресми тон және 1-тармақ бірден басталады."],
          ["I am writing to inform you that I am unable to accept your invitation.", 0, "Тым ресми: досқа жазған хат іскерлік хат сияқты естіледі. Регистр адресатқа сай болуы керек."],
          ["Your invitation was received.", 0, "Ырықсыз етіс пен құрғақ тон - досқа суық естіледі."],
          ["Yo Sam what's up", 0, "Тым сленг, тыныс белгісіз: бейресми хат та сауатты болуы керек."]] },
        { q: "Ұсыныс сөйлемі (2-тармақ)", opts: [
          ["How about I come over in July, once my exams are finished?", 1, "Дұрыс: бейресми ұсыныс (How about…?) нақты уақытпен."],
          ["I would be grateful if you could propose an alternative date.", 0, "Ресми формула - досқа тым салқын."],
          ["Maybe some other time.", 0, "Тым бұлыңғыр: тармақ «suggest another time» дейді - нақты уақыт керек."],
          ["Kindly advise me of your availability.", 0, "Іскерлік хат тілі (kindly advise) - досқа сай емес."]] },
        { q: "Аяқталу (closing)", opts: [
          ["Best wishes,", 1, "Дұрыс: досқа (Take care, All the best, Love да жарайды)."],
          ["Yours faithfully,", 0, "Ресми хатқа ғана (Dear Sir or Madam)."],
          ["Yours sincerely,", 0, "Атын білетін, бірақ жақын емес адамға; досқа тым ресми."],
          ["Regards from the applicant,", 0, "Ресми және табиғи емес тіркес."]] },
      ],
    },
  ],
  // Жаңа жағдайлар (меңгеру): адресат → дұрыс ашылу/аяқталу ережемен шығарылады
  scenarios: [
    { who: "the manager of a hotel where you stayed last week (you do not know their name)", reg: "formal" },
    { who: "the customer service department of an online shop", reg: "formal" },
    { who: "your local council, about noise from road works near your home", reg: "formal" },
    { who: "your college tutor, Dr Amina Bekova", reg: "semi", title: "Dr", first: "Amina", last: "Bekova" },
    { who: "your landlord, Mr Timur Akhmetov, whom you have met twice", reg: "semi", title: "Mr", first: "Timur", last: "Akhmetov" },
    { who: "the director of a language school, Ms Laura Chen", reg: "semi", title: "Ms", first: "Laura", last: "Chen" },
    { who: "your cousin, Dana", reg: "informal", first: "Dana" },
    { who: "Ali, a friend from school whom you know well", reg: "informal", first: "Ali" },
    { who: "your neighbour and close friend, Kate", reg: "informal", first: "Kate" },
  ],
  purposeRe: { formal: "\\b(i am writing|i'm writing|i write|the purpose|the reason (i am|i'm) writing|i would like to (ask|request|inform|complain|apply|report))\\b", semi: "\\b(i am writing|i'm writing|i would like to|i wanted to ask|i was wondering|could i)\\b", informal: "\\b(thank|thanks|sorry|just wanted|writing to|i'm writing|i am writing|guess what|it was (so|really) (kind|nice|great))\\b" },
  closings: { formal: ["yours faithfully"], semi: ["yours sincerely", "kind regards", "best regards"], informal: ["best wishes", "take care", "all the best", "love", "lots of love", "see you soon", "cheers", "warm wishes"] },
  checklist: [
    { c: "Task Achievement", q: ["Хаттың мақсаты бірінші абзацта анық айтылды.", "Үш тармақтың әрқайсысы толық дамытылды (тек аталып қана қоймады).", "Тон (регистр) адресатқа сай және хат бойы бірдей.", "Ашылу мен аяқталу бір-біріне сай (Sir or Madam → faithfully)."] },
    { c: "Coherence and Cohesion", q: ["Әр тармаққа жеке абзац (не анық бөлік) бар.", "Байланыстырғыштар регистрге сай (However / But anyway).", "Хат қисынды аяқталады (келесі қадам, жауап күту)."] },
    { c: "Lexical Resource", q: ["Ресми хатта бейресми сөз (stuff, guys, ASAP) жоқ; досқа хатта іскерлік формулалар жоқ.", "Тапсырма сөздерін көшірмей, өзгертіп айттым.", "Емлені тексердім."] },
    { c: "Grammatical Range and Accuracy", q: ["Сыпайы құрылымдар: I would be grateful if…, Could you…?, How about…?", "Шақтар дұрыс (өткен оқиға - past, жоспар - future).", "Қарапайым және күрделі сөйлемдер аралас."] },
  ],
};
