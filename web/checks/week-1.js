// CS50 Web: JavaScript автотексерушісінің тесттері. Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_JSCHECKS = Object.assign(window.CS50KZ_JSCHECKS || {}, {
 "js-gitsim": {
  "title": "Мини-Git симуляторы: тармақ пен merge (сайттың өз жаттығуы)",
  "file": "gitsim.js",
  "starter": "// TODO: gitSim(commands) функциясын жазыңыз - Git-тің ең кішкентай үлгісі.\n//\n// Бастапқы күй (git init + бірінші коммит): бір коммит \"c1\" (ата-анасы жоқ),\n// \"main\" тармағы c1-ге қарайды, HEAD - \"main\" тармағында.\n//\n// commands - жолдар тізімі, олар ретімен орындалады:\n//   \"commit\"           жаңа коммит (\"c2\", \"c3\", ... ретімен). Оның ата-анасы - ағымдағы тармақтың\n//                      қазіргі коммиті. Ағымдағы тармақ жаңа коммитке жылжиды.\n//   \"branch NAME\"      NAME тармағын ағымдағы коммитте жасайды (HEAD ауыспайды)\n//   \"checkout NAME\"    HEAD-ті NAME тармағына ауыстырады\n//   \"checkout -b NAME\" тармақ жасап, сонда ауысады\n//   \"merge NAME\"       NAME тармағын ағымдағы тармаққа біріктіреді:\n//        - NAME коммиті ағымдағы тарихта бұрыннан бар болса - ештеңе өзгермейді;\n//        - ағымдағы коммит NAME тарихында жатса - fast-forward: ағымдағы тармақ\n//          жай ғана NAME коммитіне жылжиды, жаңа коммит ЖАСАЛМАЙДЫ;\n//        - әйтпесе жаңа merge коммиті жасалады, оның ата-аналары [ағымдағы коммит, NAME коммиті].\n//\n// Қайтару мәні: { head: \"main\", branches: { main: \"c3\", ... }, parents: { c1: [], c2: [\"c1\"], ... } }\n// (конфликттер жоқ деп есептеңіз)\n\nfunction gitSim(commands) {\n  const parents = { c1: [] };\n  const branches = { main: \"c1\" };\n  let head = \"main\";\n  // ...\n  return { head, branches, parents };\n}\n",
  "tests": [
   {
    "n": "git init-тен кейінгі күй: тек main тармағы, бір коммит c1",
    "run": "((r)=>[r.head, Object.entries(r.branches).sort()])(gitSim([]))",
    "out": [
     "main",
     [
      [
       "main",
       "c1"
      ]
     ]
    ]
   },
   {
    "n": "commit: main тармағы алға жылжиды (c1 → c2 → c3)",
    "run": "((r)=>[r.head, Object.entries(r.branches).sort()])(gitSim([\"commit\", \"commit\"]))",
    "out": [
     "main",
     [
      [
       "main",
       "c3"
      ]
     ]
    ]
   },
   {
    "n": "commit: әр жаңа коммит алдыңғысын «ата-ана» етіп сақтайды",
    "run": "((r)=>Object.entries(r.parents).sort())(gitSim([\"commit\", \"commit\"]))",
    "out": [
     [
      "c1",
      []
     ],
     [
      "c2",
      [
       "c1"
      ]
     ],
     [
      "c3",
      [
       "c2"
      ]
     ]
    ]
   },
   {
    "n": "branch: жаңа тармақ жасалады, бірақ коммит қосылмайды және HEAD өзгермейді",
    "run": "((r)=>[r.head, Object.entries(r.branches).sort(), Object.entries(r.parents).sort()])(gitSim([\"branch dev\"]))",
    "out": [
     "main",
     [
      [
       "dev",
       "c1"
      ],
      [
       "main",
       "c1"
      ]
     ],
     [
      [
       "c1",
       []
      ]
     ]
    ]
   },
   {
    "n": "checkout -b: тармақ жасап, сонда ауысады; commit тек жаңа тармақты жылжытады",
    "run": "((r)=>[r.head, Object.entries(r.branches).sort()])(gitSim([\"checkout -b feature\", \"commit\"]))",
    "out": [
     "feature",
     [
      [
       "feature",
       "c2"
      ],
      [
       "main",
       "c1"
      ]
     ]
    ]
   },
   {
    "n": "checkout: main-ге қайта ауысқанда feature-дің көрсеткіші орнында қалады",
    "run": "((r)=>[r.head, Object.entries(r.branches).sort(), Object.entries(r.parents).sort()])(gitSim([\"checkout -b feature\", \"commit\", \"checkout main\", \"commit\"]))",
    "out": [
     "main",
     [
      [
       "feature",
       "c2"
      ],
      [
       "main",
       "c3"
      ]
     ],
     [
      [
       "c1",
       []
      ],
      [
       "c2",
       [
        "c1"
       ]
      ],
      [
       "c3",
       [
        "c1"
       ]
      ]
     ]
    ]
   },
   {
    "n": "fast-forward: main feature-ге жетіп алады, жаңа коммит ЖАСАЛМАЙДЫ",
    "run": "((r)=>[r.head, Object.entries(r.branches).sort(), Object.entries(r.parents).sort()])(gitSim([\"checkout -b feature\", \"commit\", \"commit\", \"checkout main\", \"merge feature\"]))",
    "out": [
     "main",
     [
      [
       "feature",
       "c3"
      ],
      [
       "main",
       "c3"
      ]
     ],
     [
      [
       "c1",
       []
      ],
      [
       "c2",
       [
        "c1"
       ]
      ],
      [
       "c3",
       [
        "c2"
       ]
      ]
     ]
    ]
   },
   {
    "n": "екі тармақ айырылған: merge коммиті (ата-аналары [ағымдағы, біріктірілетін]) жасалады",
    "run": "((r)=>[r.head, Object.entries(r.branches).sort(), Object.entries(r.parents).sort()])(gitSim([\"checkout -b feature\", \"commit\", \"checkout main\", \"commit\", \"merge feature\"]))",
    "out": [
     "main",
     [
      [
       "feature",
       "c2"
      ],
      [
       "main",
       "c4"
      ]
     ],
     [
      [
       "c1",
       []
      ],
      [
       "c2",
       [
        "c1"
       ]
      ],
      [
       "c3",
       [
        "c1"
       ]
      ],
      [
       "c4",
       [
        "c3",
        "c2"
       ]
      ]
     ]
    ]
   },
   {
    "n": "merge-ті қайталасақ - ештеңе өзгермейді (Already up to date)",
    "run": "((r)=>[Object.entries(r.branches).sort(), Object.entries(r.parents).sort()])(gitSim([\"checkout -b feature\", \"commit\", \"checkout main\", \"merge feature\", \"merge feature\"]))",
    "out": [
     [
      [
       "feature",
       "c2"
      ],
      [
       "main",
       "c2"
      ]
     ],
     [
      [
       "c1",
       []
      ],
      [
       "c2",
       [
        "c1"
       ]
      ]
     ]
    ]
   },
   {
    "n": "feature-ге main-ді біріктіру (main бұрыннан feature тарихында) - ештеңе өзгермейді",
    "run": "((r)=>[r.head, Object.entries(r.branches).sort(), Object.entries(r.parents).sort()])(gitSim([\"checkout -b feature\", \"commit\", \"merge main\"]))",
    "out": [
     "feature",
     [
      [
       "feature",
       "c2"
      ],
      [
       "main",
       "c1"
      ]
     ],
     [
      [
       "c1",
       []
      ],
      [
       "c2",
       [
        "c1"
       ]
      ]
     ]
    ]
   },
   {
    "n": "merge коммитінен кейін екінші жақтан біріктіру - fast-forward",
    "run": "((r)=>[r.head, Object.entries(r.branches).sort(), Object.entries(r.parents).sort()])(gitSim([\"checkout -b feature\", \"commit\", \"checkout main\", \"commit\", \"merge feature\", \"checkout feature\", \"merge main\"]))",
    "out": [
     "feature",
     [
      [
       "feature",
       "c4"
      ],
      [
       "main",
       "c4"
      ]
     ],
     [
      [
       "c1",
       []
      ],
      [
       "c2",
       [
        "c1"
       ]
      ],
      [
       "c3",
       [
        "c1"
       ]
      ],
      [
       "c4",
       [
        "c3",
        "c2"
       ]
      ]
     ]
    ]
   },
   {
    "n": "үлкен сценарий: екі тармақ, екі merge",
    "run": "((r)=>[Object.entries(r.branches).sort(), Object.entries(r.parents).sort()])(gitSim([\"checkout -b a\", \"commit\", \"checkout main\", \"checkout -b b\", \"commit\", \"commit\", \"checkout main\", \"commit\", \"merge a\", \"merge b\"]))",
    "out": [
     [
      [
       "a",
       "c2"
      ],
      [
       "b",
       "c4"
      ],
      [
       "main",
       "c7"
      ]
     ],
     [
      [
       "c1",
       []
      ],
      [
       "c2",
       [
        "c1"
       ]
      ],
      [
       "c3",
       [
        "c1"
       ]
      ],
      [
       "c4",
       [
        "c3"
       ]
      ],
      [
       "c5",
       [
        "c1"
       ]
      ],
      [
       "c6",
       [
        "c5",
        "c2"
       ]
      ],
      [
       "c7",
       [
        "c6",
        "c4"
       ]
      ]
     ]
    ]
   }
  ],
  "note": "Тесттер нәтижені тармақтар мен ата-ана байланыстары бойынша салыстырады (кілттердің реті маңызды емес). Тұспалдау: merge-те «a коммиті b-ның ата-тегі ме?» деген көмекші функция жазыңыз."
 },
 "js-merge3": {
  "title": "Үш жақты біріктіру және қайшылық (сайттың өз жаттығуы)",
  "file": "merge3.js",
  "starter": "// TODO: merge3(base, ours, theirs, branch) - Git қайшылықты қалай табатынының кішкентай үлгісі.\n//\n// Үш нұсқа - бірдей ұзындықтағы жолдар массивтері:\n//   base   - екі тармақ айырылған кездегі ортақ нұсқа\n//   ours   - сіздің (HEAD) тармақтағы нұсқа\n//   theirs - біріктірілетін тармақтағы нұсқа (аты - branch)\n//\n// Әр жол үшін бөлек шешіңіз:\n//   - екі жақта бірдей болса - сол жолды алыңыз;\n//   - тек бір жақ базадан өзгерсе - өзгерген жақтікін алыңыз;\n//   - екі жақ та базадан ӘРТҮРЛІ өзгерсе - қайшылық: нәтижеге 5 жол қосыңыз:\n//       \"<<<<<<< HEAD\", ours-жол, \"=======\", theirs-жол, \">>>>>>> \" + branch\n//\n// Кіріс массивтерін өзгертпей, жаңа массив қайтарыңыз.\n\nfunction merge3(base, ours, theirs, branch) {\n  const result = [];\n  // ...\n  return result;\n}\n",
  "tests": [
   {
    "n": "ешкім ештеңе өзгертпеді - нәтиже базамен бірдей",
    "run": "merge3([\"<h1>\\u0421\\u0430\\u0439\\u0442</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2024</footer>\"], [\"<h1>\\u0421\\u0430\\u0439\\u0442</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2024</footer>\"], [\"<h1>\\u0421\\u0430\\u0439\\u0442</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2024</footer>\"], \"feature\")",
    "out": [
     "<h1>Сайт</h1>",
     "<p>Сәлем</p>",
     "<footer>2024</footer>"
    ]
   },
   {
    "n": "тек сіздің тармақ (ours) бір жолды өзгертті - сіздікі алынады",
    "run": "merge3([\"<h1>\\u0421\\u0430\\u0439\\u0442</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2024</footer>\"], [\"<h1>\\u0421\\u0430\\u0439\\u0442</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c, \\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2024</footer>\"], [\"<h1>\\u0421\\u0430\\u0439\\u0442</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2024</footer>\"], \"feature\")",
    "out": [
     "<h1>Сайт</h1>",
     "<p>Сәлем, әлем</p>",
     "<footer>2024</footer>"
    ]
   },
   {
    "n": "тек feature (theirs) өзгертті - олардікі алынады",
    "run": "merge3([\"<h1>\\u0421\\u0430\\u0439\\u0442</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2024</footer>\"], [\"<h1>\\u0421\\u0430\\u0439\\u0442</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2024</footer>\"], [\"<h1>\\u0421\\u0430\\u0439\\u0442</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2025</footer>\"], \"feature\")",
    "out": [
     "<h1>Сайт</h1>",
     "<p>Сәлем</p>",
     "<footer>2025</footer>"
    ]
   },
   {
    "n": "екі жақ БІРДЕЙ өзгертті - қайшылық жоқ",
    "run": "merge3([\"<h1>\\u0421\\u0430\\u0439\\u0442</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2024</footer>\"], [\"<h1>\\u0416\\u0430\\u04a3\\u0430</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2024</footer>\"], [\"<h1>\\u0416\\u0430\\u04a3\\u0430</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2024</footer>\"], \"feature\")",
    "out": [
     "<h1>Жаңа</h1>",
     "<p>Сәлем</p>",
     "<footer>2024</footer>"
    ]
   },
   {
    "n": "екі жақ әртүрлі өзгертті - қайшылық белгілері",
    "run": "merge3([\"<h1>\\u0421\\u0430\\u0439\\u0442</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2024</footer>\"], [\"<h1>\\u041c\\u0435\\u043d\\u0456\\u04a3 \\u0441\\u0430\\u0439\\u0442\\u044b\\u043c</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2024</footer>\"], [\"<h1>\\u0411\\u0456\\u0437\\u0434\\u0456\\u04a3 \\u0441\\u0430\\u0439\\u0442</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2024</footer>\"], \"feature\")",
    "out": [
     "<<<<<<< HEAD",
     "<h1>Менің сайтым</h1>",
     "=======",
     "<h1>Біздің сайт</h1>",
     ">>>>>>> feature",
     "<p>Сәлем</p>",
     "<footer>2024</footer>"
    ]
   },
   {
    "n": "әр түрлі жолдардағы өзгерістер автоматты қосылады",
    "run": "merge3([\"<h1>\\u0421\\u0430\\u0439\\u0442</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2024</footer>\"], [\"<h1>A</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2024</footer>\"], [\"<h1>\\u0421\\u0430\\u0439\\u0442</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2025</footer>\"], \"feature\")",
    "out": [
     "<h1>A</h1>",
     "<p>Сәлем</p>",
     "<footer>2025</footer>"
    ]
   },
   {
    "n": "аралас: бір жол қосылады, бір жол қайшылық",
    "run": "merge3([\"<h1>\\u0421\\u0430\\u0439\\u0442</h1>\", \"<p>\\u0421\\u04d9\\u043b\\u0435\\u043c</p>\", \"<footer>2024</footer>\"], [\"<h1>A</h1>\", \"<p>\\u041c\\u0435\\u043d\\u0456\\u043a\\u0456</p>\", \"<footer>2024</footer>\"], [\"<h1>\\u0421\\u0430\\u0439\\u0442</h1>\", \"<p>\\u041e\\u043b\\u0430\\u0440\\u0434\\u0456\\u043a\\u0456</p>\", \"<footer>2025</footer>\"], \"dizain\")",
    "out": [
     "<h1>A</h1>",
     "<<<<<<< HEAD",
     "<p>Менікі</p>",
     "=======",
     "<p>Олардікі</p>",
     ">>>>>>> dizain",
     "<footer>2025</footer>"
    ]
   },
   {
    "n": "тармақтың аты қайшылық белгісінде болады (>>>>>>> dizain)",
    "run": "merge3([\"x\"], [\"a\"], [\"b\"], \"dizain\")",
    "out": [
     "<<<<<<< HEAD",
     "a",
     "=======",
     "b",
     ">>>>>>> dizain"
    ]
   },
   {
    "n": "бос файл",
    "run": "merge3([], [], [], \"feature\")",
    "out": []
   },
   {
    "n": "кіріс массивтерін өзгертпеу керек",
    "run": "(()=>{const b=[\"a\",\"b\"],o=[\"a\",\"X\"],t=[\"Y\",\"b\"];merge3(b,o,t,\"f\");return [b,o,t]})()",
    "out": [
     [
      "a",
      "b"
     ],
     [
      "a",
      "X"
     ],
     [
      "Y",
      "b"
     ]
    ]
   }
  ],
  "note": "Қайшылықтағы әр жол үшін жеке блок жасаңыз (шынайы Git көрші жолдарды бір блокқа біріктіреді, біз қарапайымдатамыз)."
 }
});
