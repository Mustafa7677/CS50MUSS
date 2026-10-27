/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық оқу материалы (LICENSE-PROPRIETARY.md, COPYRIGHT.md). */
// English Academy - дағдылар зертханасы (en/skills.html, assets/js/en-skills.js).
// Әр деңгейде: тыңдау (диктант + қысқа монолог), айту (көлеңкелеу фразалары), оқу (мәтін + сұрақтар), жазу (тапсырма + тексеру тізімі).
// Мәтіндер өз сөзімізбен жазылған. Оқу мәтініндегі [[сөз|аударма]] - басқанда аудармасы шығатын сөз.
// Жазу тексерісіндегі re - JavaScript тұрақты өрнегі (бас-кіші әріп ескерілмейді).
window.CS50KZ_EN_SKILLS = {
  A0: {
    name: "Бастау",
    listen: {
      dictation: ["Hello, my name is Aru.", "This is my computer.", "I am a student.", "Open the file, please."],
      talk: {
        title: "Dana",
        text: "Hi! I am Dana. I am from Almaty. I am a student. I have a laptop. My laptop is black. I like Python.",
        qs: [
          { q: "Where is Dana from?", o: ["Astana", "Almaty", "London"], a: 1, e: "«I am from Almaty» - мен Алматыданмын." },
          { q: "What colour is her laptop?", o: ["white", "black", "red"], a: 1, e: "«My laptop is black» - ноутбугім қара." }
        ]
      }
    },
    speak: [
      { en: "Hello! How are you?", kz: "Сәлем! Қалайсың?", tip: "How [хау] - «х» жұмсақ, «у»-мен аяқталады." },
      { en: "Nice to meet you.", kz: "Танысқаныма қуаныштымын.", tip: "meet [миит] - созылыңқы «и»." },
      { en: "Thank you very much.", kz: "Көп рақмет.", tip: "th - тілдің ұшы тістердің арасында." },
      { en: "Can you help me, please?", kz: "Маған көмектесе аласыз ба?", tip: "Сұрақтың соңында дауыс сәл көтеріледі." }
    ],
    read: {
      title: "My first day",
      text: [
        "My name is Timur. I am twenty years old. I am a student in Shymkent. [[Today|бүгін]] is my [[first|бірінші]] day in a computer class.",
        "The [[room|бөлме]] is big. There are ten computers. My computer is [[new|жаңа]]. The [[teacher|мұғалім]] is nice. Her name is Ms Aliya. I am [[happy|қуанышты]]."
      ],
      qs: [
        { q: "How old is Timur?", o: ["18", "20", "25"], a: 1, e: "«I am twenty years old» - мен жиырма жастамын." },
        { q: "How many computers are there?", o: ["five", "ten", "twenty"], a: 1, e: "«There are ten computers»." },
        { q: "Who is Ms Aliya?", o: ["a student", "the teacher", "Timur's sister"], a: 1, e: "«The teacher is nice. Her name is Ms Aliya»." },
        { q: "Is Timur happy?", o: ["Yes, he is.", "No, he isn't."], a: 0, e: "Соңғы сөйлем: «I am happy»." }
      ]
    },
    write: {
      prompt: "Write about yourself: your name, age, city and what you like.",
      kz: "Өзің туралы 4-6 сөйлем жаз: атың, жасың, қалаң және не ұнайды.",
      min: 20, max: 70,
      must: [
        { re: "\\bmy name is\\b", label: "My name is ..." },
        { re: "\\bI am\\b|\\bI'm\\b", label: "I am / I'm ..." },
        { re: "\\bI like\\b", label: "I like ..." }
      ],
      model: "Hello! My name is Aidos. I am nineteen years old. I am from Taraz. I am a student. I like music and computers. I like Python too."
    }
  },

  A1: {
    name: "Негіз",
    listen: {
      dictation: ["She works in a big office.", "We start at nine o'clock.", "There is a printer next to the door.", "I can't open this file."],
      talk: {
        title: "Marat's week",
        text: "Hi, I'm Marat. I'm a junior developer. I work from home on Mondays and Fridays. On other days I go to the office by bus. Our team has a meeting every morning at ten. I usually drink tea, not coffee.",
        qs: [
          { q: "When does Marat work from home?", o: ["every day", "on Mondays and Fridays", "on Tuesdays"], a: 1, e: "«I work from home on Mondays and Fridays»." },
          { q: "When is the team meeting?", o: ["at nine", "at ten", "at noon"], a: 1, e: "«every morning at ten» - күн сайын таңғы онда." },
          { q: "How does he go to the office?", o: ["by car", "by bus", "on foot"], a: 1, e: "«I go to the office by bus»." }
        ]
      }
    },
    speak: [
      { en: "I work in a small team.", kz: "Мен шағын командада жұмыс істеймін.", tip: "work [уөрк] - ортасында «ө»-ге жақын дыбыс." },
      { en: "What time is the meeting?", kz: "Жиналыс қай уақытта?", tip: "What time - «t» екі рет айтылмайды: «уот-тайм»." },
      { en: "Where is the printer?", kz: "Принтер қайда?", tip: "Where [уэа] - «h» айтылмайды." },
      { en: "I'm working on the login page.", kz: "Мен кіру бетімен жұмыс істеп жатырмын.", tip: "-ing соңындағы «ң» - мұрын дыбысы, «г» естілмейді." }
    ],
    read: {
      title: "A day at the office",
      text: [
        "Asel is a tester. She works at a small IT company in Astana. She [[gets up|тұрады, оянады]] at seven o'clock and has breakfast with her family. She goes to work by bus.",
        "Work starts at nine. In the morning she reads the bug reports and tests new [[features|мүмкіндіктер]]. At one o'clock she has lunch with her [[colleagues|әріптестер]]. In the [[afternoon|түстен кейін]] she writes test cases.",
        "She [[finishes|аяқтайды]] work at six. In the evening she [[often|жиі]] reads books or goes to the gym."
      ],
      qs: [
        { q: "What is Asel's job?", o: ["developer", "tester", "manager"], a: 1, e: "«Asel is a tester»." },
        { q: "What does she do in the morning?", o: ["She writes test cases.", "She reads bug reports and tests features.", "She has lunch."], a: 1, e: "«In the morning she reads the bug reports and tests new features»." },
        { q: "When does she finish work?", o: ["at five", "at six", "at seven"], a: 1, e: "«She finishes work at six»." },
        { q: "What does she often do in the evening?", o: ["She works late.", "She reads books or goes to the gym.", "She sleeps."], a: 1, e: "«In the evening she often reads books or goes to the gym»." }
      ]
    },
    write: {
      prompt: "Describe your typical day. Use the present simple and time words.",
      kz: "Әдеттегі күніңді сипатта: Present Simple, уақыт және жиілік сөздері.",
      min: 35, max: 100,
      must: [
        { re: "\\b(usually|always|often|sometimes|never)\\b", label: "жиілік сөзі: usually, often, sometimes ..." },
        { re: "\\bat (\\d|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\\b", label: "уақыт: at 8, at nine ..." },
        { re: "\\b(then|after that|in the (morning|afternoon|evening))\\b", label: "реттілік: then, in the morning ..." }
      ],
      model: "I usually get up at seven. Then I have breakfast and check my messages. I go to university by bus. In the morning I have lectures. At one o'clock I have lunch with my friends. In the afternoon I study Python in the library. In the evening I sometimes play football."
    }
  },

  A2: {
    name: "Қарапайым қарым-қатынас",
    listen: {
      dictation: ["Yesterday I fixed two bugs.", "We are going to release the app next week.", "This laptop is faster than my old one.", "You should save your work more often."],
      talk: {
        title: "A slow website",
        text: "Last week our team had a problem. The website was very slow, and many users couldn't log in. On Monday we found the reason: the database was too small. On Tuesday we moved it to a bigger server. Now the website is fast again. Next month we're going to add a cache.",
        qs: [
          { q: "What was the problem?", o: ["The website was slow.", "The website was closed.", "The phone app crashed."], a: 0, e: "«The website was very slow, and many users couldn't log in»." },
          { q: "What did they do on Tuesday?", o: ["They deleted the database.", "They moved the database to a bigger server.", "They bought new laptops."], a: 1, e: "«On Tuesday we moved it to a bigger server»." },
          { q: "What are they going to add next month?", o: ["a cache", "a new team", "a mobile app"], a: 0, e: "«Next month we're going to add a cache»." }
        ]
      }
    },
    speak: [
      { en: "I fixed the bug yesterday.", kz: "Мен қатені кеше түзеттім.", tip: "fixed [фикст] - -ed бұл жерде «т» болып айтылады." },
      { en: "I'm going to finish it tomorrow.", kz: "Мен оны ертең аяқтаймын.", tip: "Ауызекі тілде going to көбіне «гона» болып естіледі." },
      { en: "This version is better than the old one.", kz: "Бұл нұсқа ескісінен жақсырақ.", tip: "than [зэн] - «th» жұмсақ, дауысты." },
      { en: "Could you send me the link?", kz: "Сілтемені жібере аласыз ба?", tip: "Could you - «куджу» болып қосылып айтылады." }
    ],
    read: {
      title: "Problem with the login page",
      text: [
        "Subject: Problem with the login page",
        "Hi Daniyar,",
        "I tried to log in to the test site this morning, but it didn't work. I [[entered|енгіздім]] my email and password and clicked «Sign in». Then the page showed an error: «Something went wrong». I tried again in a [[different|басқа]] browser, but I got the [[same|сондай, бірдей]] message.",
        "I think the problem started after yesterday's [[update|жаңарту]]. Could you check it, please? I need the site for a [[demo|көрсетілім]] on Friday.",
        "Thanks, Zhanar"
      ],
      qs: [
        { q: "What did Zhanar try to do?", o: ["log in to the test site", "buy something", "update the site"], a: 0, e: "«I tried to log in to the test site this morning»." },
        { q: "What did she do after the first error?", o: ["She called Daniyar.", "She tried a different browser.", "She restarted her computer."], a: 1, e: "«I tried again in a different browser»." },
        { q: "When does she think the problem started?", o: ["last week", "after yesterday's update", "this morning"], a: 1, e: "«I think the problem started after yesterday's update»." },
        { q: "Why does she need the site?", o: ["for a demo on Friday", "for a test on Monday", "for a meeting today"], a: 0, e: "«I need the site for a demo on Friday»." }
      ]
    },
    write: {
      prompt: "Write a short bug report email to a colleague: what happened, what you did, and what you need.",
      kz: "Әріптесіңе қысқа баг-репорт хат жаз: не болды, сен не істедің, саған не керек.",
      min: 50, max: 140,
      must: [
        { re: "^\\s*(hi|hello|dear)\\b", label: "амандасу: Hi / Hello / Dear ..." },
        { re: "\\b\\w+ed\\b|\\b(was|were|got|went|saw|tried)\\b", label: "өткен шақ: tried, clicked, was ..." },
        { re: "\\b(could you|can you|please)\\b", label: "өтініш: Could you ... ? / please" },
        { re: "\\b(thanks|thank you|best|regards)\\b", label: "қоштасу: Thanks / Best regards" }
      ],
      model: "Hi Arman,\n\nI have a problem with the report page. This morning I opened it, but the table was empty. I refreshed the page and logged in again, but nothing changed. Yesterday it worked fine, so I think the problem started after the last update. Could you check it, please? I need the report for my manager today.\n\nThanks,\nAida"
    }
  },

  B1: {
    name: "Өз бетінше қолдану",
    listen: {
      dictation: ["I have already pushed my changes to the repository.", "If the tests fail, the build will stop.", "The bug was reported by a customer last night.", "She told me that the server had been restarted."],
      talk: {
        title: "Sprint retrospective",
        text: "In this sprint we have finished most of our tasks, but not all of them. The new search feature has been released, and users like it. However, the export function hasn't been tested yet, so we've moved it to the next sprint. One problem was that we had too many meetings. If we reduce them, we'll have more time for coding. Let's try shorter stand-ups next sprint.",
        qs: [
          { q: "What has been released?", o: ["the export function", "the search feature", "a new design"], a: 1, e: "«The new search feature has been released»." },
          { q: "Why was the export function moved to the next sprint?", o: ["It hasn't been tested yet.", "Users didn't like it.", "The server crashed."], a: 0, e: "«the export function hasn't been tested yet, so we've moved it»." },
          { q: "What does the speaker suggest?", o: ["more meetings", "shorter stand-ups", "working at weekends"], a: 1, e: "«Let's try shorter stand-ups next sprint»." }
        ]
      }
    },
    speak: [
      { en: "I've already reviewed your pull request.", kz: "Мен сенің pull request-іңді қарап шықтым.", tip: "I've - «айв», қысқа әрі жұмсақ." },
      { en: "If you have time, could you take a look at this?", kz: "Уақытың болса, мынаны қарап бере аласың ба?", tip: "Үтірде қысқа кідіріс, сосын сұрақ интонациясы." },
      { en: "The issue has been fixed in the latest version.", kz: "Мәселе соңғы нұсқада түзетілді.", tip: "has been - екпінсіз, «хэз-бин» болып тез айтылады." },
      { en: "I'm not sure I understand. Could you explain it again?", kz: "Түсінгеніме сенімді емеспін. Қайта түсіндіріп бере аласыз ба?", tip: "Түсінбесеңіз, осылай сұрау - кәсіби әдет." }
    ],
    read: {
      title: "Getting started with the API",
      text: [
        "Before you can use our API, you need an API key. You can create one in your account settings. Each key is [[linked|байланысты]] to one project, and it should never be shared [[publicly|жария түрде]].",
        "If a key has been [[leaked|тарап кетсе]], delete it [[immediately|дереу]] and create a new one. All requests are sent over HTTPS. Requests without a valid key are [[rejected|қабылданбайды]] with the error code 401.",
        "Free accounts are limited to 1,000 requests per day. If you [[exceed|асып кетсеңіз]] this limit, you will receive the error code 429 until the next day."
      ],
      qs: [
        { q: "Where can you create an API key?", o: ["in your account settings", "in an email", "on the forum"], a: 0, e: "«You can create one in your account settings»." },
        { q: "What should you do if a key has been leaked?", o: ["share it with the team", "delete it and create a new one", "wait one day"], a: 1, e: "«delete it immediately and create a new one»." },
        { q: "What does error 401 mean here?", o: ["too many requests", "the key is missing or invalid", "the server is down"], a: 1, e: "«Requests without a valid key are rejected with the error code 401»." },
        { q: "What happens after 1,000 requests on a free account?", o: ["You get error 429 until the next day.", "The account is deleted.", "You pay automatically."], a: 0, e: "«you will receive the error code 429 until the next day»." }
      ]
    },
    write: {
      prompt: "Write a code review comment to a teammate: say what is good, what should be changed, and why.",
      kz: "Әріптесіңнің кодына пікір жаз: не жақсы, нені өзгерту керек және неге. Present Perfect пен бір шартты сөйлем қолдан.",
      min: 60, max: 160,
      must: [
        { re: "\\b(have|has|'ve|'s)\\s+(been|done|made|written|added|fixed|changed|moved|\\w+ed)\\b", label: "Present Perfect: you've added, it has been ..." },
        { re: "\\bif\\b", label: "шарт: If ..." },
        { re: "\\b(could you|would you|I'd suggest|I suggest|maybe|you might)\\b", label: "сыпайы ұсыныс: Could you ... / I'd suggest ..." },
        { re: "\\b(because|so|however)\\b", label: "себеп не қарсы қою: because / so / however" }
      ],
      model: "Nice work! You've added clear tests for the parser, and the function names are easy to read. However, the loop in save_user() opens the database connection on every iteration, so it will be slow with many users. Could you open the connection once before the loop? If you move it, the tests should still pass. Also, I'd suggest adding a short comment about the retry logic because it isn't obvious."
    }
  },

  B2: {
    name: "Еркін жұмыс",
    listen: {
      dictation: ["The migration should have been tested before it was deployed.", "Unless we set up monitoring, we won't notice the outage.", "Could you look into why the build keeps failing?", "Although the feature works, the code is hard to maintain."],
      talk: {
        title: "Interview: a mistake I made",
        text: "In my previous job, I once deployed a change on a Friday evening without running the full test suite. I assumed it was a small fix, but it broke the payment page for about two hours. As soon as I noticed it, I rolled back the release and informed my manager. Afterwards, I wrote a short post-mortem and suggested a rule: no deployments after four p.m. on Fridays unless all tests pass. Since then, the team hasn't had a similar incident. What I learned is that small changes deserve the same care as big ones.",
        qs: [
          { q: "What did the speaker skip before deploying?", o: ["running the full test suite", "code review", "the morning meeting"], a: 0, e: "«without running the full test suite»." },
          { q: "What did they do first after noticing the problem?", o: ["They rolled back the release.", "They wrote a post-mortem.", "They went home."], a: 0, e: "«As soon as I noticed it, I rolled back the release»." },
          { q: "What rule did they suggest?", o: ["never deploy on Fridays", "no deployments after 4 p.m. on Fridays unless all tests pass", "deploy only on Mondays"], a: 1, e: "«no deployments after four p.m. on Fridays unless all tests pass»." },
          { q: "What is the main lesson?", o: ["Small changes deserve the same care as big ones.", "Managers should deploy code.", "Tests are not necessary for small fixes."], a: 0, e: "Соңғы сөйлем - негізгі ой." }
        ]
      }
    },
    speak: [
      { en: "I should have checked the logs earlier.", kz: "Логтарды ертерек тексеруім керек еді.", tip: "should have - «шуд-ов» болып қысқарып айтылады." },
      { en: "Would you mind if we postponed the release until Monday?", kz: "Шығаруды дүйсенбіге қалдырсақ, қарсы емессіз бе?", tip: "Would you mind - өте сыпайы өтініш." },
      { en: "What I'm trying to say is that the current approach doesn't scale.", kz: "Айтайын дегенім: қазіргі тәсіл масштабталмайды.", tip: "Ойды нақтылаудың пайдалы тіркесі." },
      { en: "Let me walk you through the main changes.", kz: "Негізгі өзгерістерді бірге қарап шығайық.", tip: "walk [уок] - «l» айтылмайды." }
    ],
    read: {
      title: "Why code reviews matter",
      text: [
        "Code review is often seen as a way to catch bugs, but its real value [[lies elsewhere|басқа жерде жатыр]]. Research at several large companies suggests that reviews find fewer defects than people expect; many bugs are found by tests or, unfortunately, by users.",
        "What reviews do extremely well is spread knowledge. When a developer reads a teammate's change, they learn how another part of the system works, which reduces the risk that only one person understands a [[critical|аса маңызды]] module. Reviews also keep a codebase [[consistent|біркелкі]]: naming, structure and error handling start to look the same across the project.",
        "However, reviews can slow a team down if they are too large or arrive too late. A change of 2,000 lines rarely gets a careful review; reviewers simply [[skim|көз жүгіртіп шығады]] it. That is why many teams limit pull requests to a few hundred lines and agree to respond within one working day."
      ],
      qs: [
        { q: "According to the text, what do reviews do extremely well?", o: ["catch most bugs", "spread knowledge", "replace tests"], a: 1, e: "«What reviews do extremely well is spread knowledge»." },
        { q: "Why are very large pull requests a problem?", o: ["Reviewers only skim them.", "They can't be merged.", "Tests always fail."], a: 0, e: "«A change of 2,000 lines rarely gets a careful review; reviewers simply skim it»." },
        { q: "What does «consistent» mean in the text?", o: ["the same style across the project", "very fast", "full of bugs"], a: 0, e: "Атау, құрылым, қате өңдеу бәр жерде бірдей көрінеді." },
        { q: "Which practice does the text mention?", o: ["limiting pull requests to a few hundred lines", "banning code reviews", "reviewing code only on Fridays"], a: 0, e: "«many teams limit pull requests to a few hundred lines»." }
      ]
    },
    write: {
      prompt: "Write a formal email to a client explaining a delay: the reason, the new date, and what you will do to prevent it.",
      kz: "Клиентке ресми хат жаз: кешігудің себебі, жаңа мерзім және мұның қайталанбауы үшін не істейсіз.",
      min: 90, max: 200,
      must: [
        { re: "^\\s*dear\\b", label: "ресми амандасу: Dear ..." },
        { re: "\\b(apologi[sz]e|apologies|sorry|regret)\\b", label: "кешірім: We apologise ... / We regret ..." },
        { re: "\\b(however|therefore|although|as a result|due to)\\b", label: "байланыстырғыш: due to / however / therefore ..." },
        { re: "\\b(will|by (monday|tuesday|wednesday|thursday|friday|the end))\\b", label: "жаңа мерзім: will ... / by Friday ..." },
        { re: "\\b(kind regards|best regards|sincerely|yours faithfully)\\b", label: "ресми қоштасу: Kind regards / Sincerely" }
      ],
      model: "Dear Ms Johnson,\n\nI am writing to let you know that the release of the mobile app will be delayed by one week. During final testing we found a problem with payments on older Android devices, and we do not want to release a version that could charge customers incorrectly. We sincerely apologise for the inconvenience.\n\nThe fix is already in progress, and the app will be ready by Friday, 14 March. As a result of this incident, we have added older devices to our automated tests, so similar problems will be detected much earlier in the future.\n\nPlease let me know if you have any questions.\n\nKind regards,\nAsel Nurlanovna\nProject Manager"
    }
  },

  C1: {
    name: "Кәсіби деңгей",
    listen: {
      dictation: ["Had we known about the dependency, we would have planned the rollout differently.", "Not only does the new architecture reduce latency, but it also simplifies deployment.", "It's worth bearing in mind that the estimates are rough at best.", "The proposal, while ambitious, glosses over several operational risks."],
      talk: {
        title: "Monolith or microservices?",
        text: "I'd like to push back slightly on the idea of splitting the monolith right now. Microservices would certainly give us independent deployments, but they come at a cost: network calls instead of function calls, distributed tracing, and a lot more infrastructure to maintain. Given that our team is only six people, I suspect the overhead would outweigh the benefits, at least for the next year. What I'd propose instead is a modular monolith: we enforce clear boundaries between modules inside one codebase, and if one module genuinely needs to scale on its own, we extract it then. That way we keep our options open without paying the full price up front.",
        qs: [
          { q: "What is the speaker's overall position?", o: ["strongly in favour of microservices now", "cautiously against splitting the monolith now", "against any change at all"], a: 1, e: "«push back slightly», «at least for the next year» - сақ қарсылық." },
          { q: "Which cost of microservices is NOT mentioned?", o: ["network calls", "distributed tracing", "higher licence fees"], a: 2, e: "Лицензия туралы айтылмады." },
          { q: "What does «outweigh» mean here?", o: ["be greater than", "be equal to", "be smaller than"], a: 0, e: "the overhead would outweigh the benefits - шығын пайдадан асып түседі." },
          { q: "What does the speaker propose?", o: ["a modular monolith, extracting modules later if needed", "rewriting everything from scratch", "hiring more people"], a: 0, e: "«What I'd propose instead is a modular monolith»." }
        ]
      }
    },
    speak: [
      { en: "I see your point, but I'd argue that the risks outweigh the benefits.", kz: "Ойыңызды түсінемін, бірақ менің ойымша тәуекел пайдадан басым.", tip: "Келіспеуді сыпайы бастау: I see your point, but ..." },
      { en: "To put it another way, we're optimising for the wrong metric.", kz: "Басқаша айтқанда, біз дұрыс емес көрсеткішті жақсартып жатырмыз.", tip: "Екпін: WRONG metric - негізгі ойды дауыспен бөліңіз." },
      { en: "Could we take a step back and look at the bigger picture?", kz: "Бір қадам шегініп, жалпы көрініске қарасақ қайтеді?", tip: "Талқылауды бағыттаудың табиғи тәсілі." },
      { en: "Let's agree on the scope before we commit to a deadline.", kz: "Мерзімге келіспес бұрын, жұмыс көлемін анықтайық.", tip: "commit [кәмит] - екпін екінші буында." }
    ],
    read: {
      title: "Technical debt, revisited",
      text: [
        "The metaphor of technical debt, introduced by Ward Cunningham in the early 1990s, is often misunderstood. Cunningham did not mean that messy code is acceptable as long as you «pay it back later». His point was [[subtler|нәзігірек]]: when a team ships software, its understanding of the problem is necessarily incomplete, and the code reflects that partial understanding.",
        "As the team learns more, the gap between what the code says and what the team now knows grows, and that gap is the debt. Interest is paid every time a developer has to work around the outdated design. Seen this way, debt is not a sign of carelessness but an [[inevitable|сөзсіз, болмай қоймайтын]] [[by-product|жанама нәтиже]] of learning.",
        "The danger lies in ignoring it. Teams that never refactor find that every new feature takes longer than the last, until progress [[grinds to a halt|мүлде тоқтап қалады]]. [[Conversely|керісінше]], teams that try to eliminate all debt before shipping rarely ship at all. The pragmatic middle ground is to make debt visible, in tickets, reviews and planning, and to repay it [[deliberately|саналы түрде]], starting with the parts of the system that change most often."
      ],
      qs: [
        { q: "What did Cunningham originally mean by technical debt?", o: ["Messy code is fine if you fix it later.", "The gap between the code and the team's improved understanding.", "Money borrowed to build software."], a: 1, e: "«that gap is the debt»." },
        { q: "What is the «interest» in this metaphor?", o: ["the extra effort of working around an outdated design", "money paid to a bank", "time spent in meetings"], a: 0, e: "«Interest is paid every time a developer has to work around the outdated design»." },
        { q: "What happens to teams that never refactor?", o: ["Each feature takes longer than the last.", "They ship faster.", "They have no bugs."], a: 0, e: "«every new feature takes longer than the last»." },
        { q: "What does the author recommend?", o: ["Eliminate all debt before shipping.", "Make debt visible and repay it deliberately, starting with frequently changed parts.", "Ignore debt until the system fails."], a: 1, e: "Соңғы сөйлемдегі «pragmatic middle ground»." }
      ]
    },
    write: {
      prompt: "Write a short design proposal arguing for or against a technical decision (for example, rewriting a service). Acknowledge the opposite view and conclude clearly.",
      kz: "Техникалық шешім туралы қысқа ұсыныс жаз (мысалы, сервисті қайта жазу): дәлел келтір, қарсы пікірді мойында және нақты қорытынды жаса.",
      min: 120, max: 260,
      must: [
        { re: "\\b(arguably|it seems|likely|might|may|I suspect|tend to)\\b", label: "жұмсарту (hedging): arguably, likely, might ..." },
        { re: "\\b(while|although|admittedly|granted|even though)\\b", label: "қарсы пікірді мойындау: while / admittedly ..." },
        { re: "\\b(therefore|consequently|thus|hence|as a result)\\b", label: "салдар: therefore / consequently ..." },
        { re: "\\b(in conclusion|overall|on balance|to sum up|all things considered)\\b", label: "қорытынды: On balance / Overall ..." }
      ],
      model: "Proposal: keep the billing service, but refactor it in stages.\n\nThe billing service is arguably the oldest part of our system, and a full rewrite is tempting: the code is hard to read, and tests cover less than half of it. Admittedly, a rewrite would let us adopt a cleaner design from day one. However, rewrites of business-critical systems tend to take far longer than planned, and during that time we would have to maintain two versions in parallel. Moreover, much of the existing complexity likely reflects real edge cases that are documented nowhere else.\n\nI therefore suggest an incremental approach: first increase test coverage around invoicing, then extract the tax calculation into a separate module, and only then reconsider the remaining parts.\n\nOn balance, staged refactoring gives us most of the benefits of a rewrite at a fraction of the risk."
    }
  }
};
