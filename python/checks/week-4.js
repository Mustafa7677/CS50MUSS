// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-adieu": {
  "title": "Adieu, Adieu",
  "file": "adieu.py",
  "starter": "names = []\n\n# TODO: control-d (EOFError) басылғанша аттарды бір-бірден сұраңыз\nwhile True:\n    try:\n        name = input(\"Name: \")\n        # TODO: атты тізімге қосыңыз\n    except EOFError:\n        break\n\n# TODO: аттарды үтір мен and арқылы біріктіріңіз (Оксфорд үтірі!)\n# TODO: \"Adieu, adieu, to ...\" деп шығарыңыз\n",
  "tests": [
   {
    "n": "1 ат: Liesl",
    "in": [
     "Liesl"
    ],
    "contains": "Adieu, adieu, to Liesl",
    "out": "Adieu, adieu, to Liesl"
   },
   {
    "n": "2 ат: Liesl, Friedrich",
    "in": [
     "Liesl",
     "Friedrich"
    ],
    "contains": "Adieu, adieu, to Liesl and Friedrich",
    "out": "Adieu, adieu, to Liesl and Friedrich"
   },
   {
    "n": "3 ат: Оксфорд үтірі",
    "in": [
     "Liesl",
     "Friedrich",
     "Louisa"
    ],
    "contains": "Adieu, adieu, to Liesl, Friedrich, and Louisa",
    "out": "Adieu, adieu, to Liesl, Friedrich, and Louisa"
   },
   {
    "n": "4 ат",
    "in": [
     "Liesl",
     "Friedrich",
     "Louisa",
     "Kurt"
    ],
    "contains": "Adieu, adieu, to Liesl, Friedrich, Louisa, and Kurt",
    "out": "Adieu, adieu, to Liesl, Friedrich, Louisa, and Kurt"
   },
   {
    "n": "5 ат",
    "in": [
     "Liesl",
     "Friedrich",
     "Louisa",
     "Kurt",
     "Brigitta"
    ],
    "contains": "Adieu, adieu, to Liesl, Friedrich, Louisa, Kurt, and Brigitta",
    "out": "Adieu, adieu, to Liesl, Friedrich, Louisa, Kurt, and Brigitta"
   },
   {
    "n": "7 ат",
    "in": [
     "Liesl",
     "Friedrich",
     "Louisa",
     "Kurt",
     "Brigitta",
     "Marta",
     "Gretl"
    ],
    "contains": "Adieu, adieu, to Liesl, Friedrich, Louisa, Kurt, Brigitta, Marta, and Gretl",
    "out": "Adieu, adieu, to Liesl, Friedrich, Louisa, Kurt, Brigitta, Marta, and Gretl"
   }
  ],
  "note": "Браузерде inflect кітапханасы жоқ, сондықтан мұнда біріктіру логикасын өзіңіз жазыңыз (cs50.dev-те тапсырма талабы бойынша inflect қолданыңыз). Кіріс таусылғанда input() EOFError көтереді - бұл control-d басқанмен бірдей. Сұрақ мәтіні (prompt) тексерілмейді, тек шығарылған нәтиже салыстырылады."
 },
 "py-game": {
  "title": "Guessing Game",
  "file": "game.py",
  "starter": "import random\n\n\ndef main():\n    # TODO: оң бүтін сан болғанша деңгейді (Level) сұраңыз\n\n    # TODO: random.randint(1, level) арқылы 1 мен level аралығындағы сан жасырыңыз\n\n    # TODO: оң бүтін сан болғанша болжамды (Guess) сұраңыз\n    # кіші болса - Too small!, үлкен болса - Too large!, тең болса - Just right! және шығу\n    ...\n\n\nmain()\n",
  "tests": [
   {
    "n": "Level 1, Guess 1 → Just right!",
    "in": [
     "1",
     "1"
    ],
    "seed": 1,
    "out": "Just right!"
   },
   {
    "n": "Level: cat, -1, 0 → қайта сұрайды",
    "in": [
     "cat",
     "-1",
     "0",
     "1",
     "1"
    ],
    "seed": 1,
    "out": "Just right!"
   },
   {
    "n": "Guess: cat, -1, 0 → қайта сұрайды",
    "in": [
     "10",
     "cat",
     "-1",
     "0",
     "4"
    ],
    "seed": 3,
    "out": "Just right!"
   },
   {
    "n": "Level 10, Guess 100 → Too large!",
    "in": [
     "10",
     "100",
     "4"
    ],
    "seed": 3,
    "out": "Too large!\nJust right!"
   },
   {
    "n": "Level 10000, Guess 1 → Too small!",
    "in": [
     "10000",
     "1",
     "7412"
    ],
    "seed": 11,
    "out": "Too small!\nJust right!"
   },
   {
    "n": "Level 100: кіші, үлкен, дәл",
    "in": [
     "100",
     "41",
     "43",
     "42"
    ],
    "seed": 7,
    "out": "Too small!\nToo large!\nJust right!"
   }
  ],
  "note": "Тест кездейсоқ сандарды тұрақты seed арқылы жасайды, сондықтан санды дәл бір рет random.randint(1, level) (немесе random.randrange(1, level + 1)) арқылы жасаңыз және random-ды басқа жерде шақырмаңыз. Сұрақ мәтіні (prompt) тексерілмейді, тек шығарылған нәтиже салыстырылады."
 },
 "py-professor": {
  "title": "Little Professor",
  "file": "professor.py",
  "starter": "import random\n\n\ndef main():\n    # TODO: get_level() арқылы деңгейді алыңыз\n    # TODO: 10 есеп: әрқайсысы үшін x, y = generate_integer(level) (алдымен x, сосын y)\n    # TODO: «X + Y = » деп сұраңыз; қате болса EEE, ең көбі 3 рет;\n    #       3 рет қате болса, дұрыс жауапты «X + Y = Z» деп шығарыңыз\n    # TODO: соңында ұпайды шығарыңыз: Score: N\n    ...\n\n\ndef get_level():\n    # TODO: 1, 2 немесе 3 енгізілгенше сұрап, соны қайтарыңыз\n    ...\n\n\ndef generate_integer(level):\n    # TODO: level таңбалы теріс емес кездейсоқ бүтін сан қайтарыңыз\n    # (1 → 0..9, 2 → 10..99, 3 → 100..999), басқа level болса raise ValueError\n    ...\n\n\nif __name__ == \"__main__\":\n    main()\n",
  "tests": [
   {
    "n": "Level: -1, 4, cat → қайта сұрайды; 10/10",
    "in": [
     "-1",
     "4",
     "cat",
     "1",
     "11",
     "5",
     "8",
     "14",
     "9",
     "8",
     "6",
     "15",
     "7",
     "7"
    ],
    "seed": 1,
    "out": "Score: 10"
   },
   {
    "n": "1-деңгей, бәрі дұрыс → Score: 10",
    "in": [
     "1",
     "11",
     "5",
     "8",
     "14",
     "9",
     "8",
     "6",
     "15",
     "7",
     "7"
    ],
    "seed": 1,
    "out": "Score: 10"
   },
   {
    "n": "Бір қате жауап → EEE",
    "in": [
     "1",
     "12",
     "11",
     "5",
     "8",
     "14",
     "9",
     "8",
     "6",
     "15",
     "7",
     "7"
    ],
    "seed": 1,
    "contains": "EEE",
    "out": "EEE\nScore: 10"
   },
   {
    "n": "3 рет қате → дұрыс жауап шығады",
    "in": [
     "2",
     "cat",
     "39",
     "37",
     "76",
     "126",
     "91",
     "124",
     "101",
     "181",
     "95",
     "151",
     "132"
    ],
    "seed": 2,
    "contains": "17 + 21 = 38",
    "out": "EEE\nEEE\nEEE\n17 + 21 = 38\nScore: 9"
   },
   {
    "n": "3 рет қате → Score: 9",
    "in": [
     "2",
     "cat",
     "39",
     "37",
     "76",
     "126",
     "91",
     "124",
     "101",
     "181",
     "95",
     "151",
     "132"
    ],
    "seed": 2,
    "contains": "Score: 9",
    "out": "EEE\nEEE\nEEE\n17 + 21 = 38\nScore: 9"
   },
   {
    "n": "3-деңгей, бәрі дұрыс",
    "in": [
     "3",
     "1049",
     "890",
     "1196",
     "1325",
     "861",
     "833",
     "1537",
     "1029",
     "635",
     "1415"
    ],
    "seed": 3,
    "out": "Score: 10"
   },
   {
    "n": "generate_integer(4) → ValueError",
    "in": [
     "3",
     "1049",
     "890",
     "1196",
     "1325",
     "861",
     "833",
     "1537",
     "1029",
     "635",
     "1415"
    ],
    "seed": 3,
    "append": "generate_integer(4)",
    "raises": "ValueError",
    "out": "ValueError (тест құлауы керек)"
   },
   {
    "n": "generate_integer: ауқымдар дұрыс",
    "in": [
     "1",
     "11",
     "5",
     "8",
     "14",
     "9",
     "8",
     "6",
     "15",
     "7",
     "7"
    ],
    "seed": 1,
    "append": "random.seed(5)\nprint(all(0 <= generate_integer(1) <= 9 for _ in range(300)))\nprint(all(10 <= generate_integer(2) <= 99 for _ in range(300)))\nprint(all(100 <= generate_integer(3) <= 999 for _ in range(300)))\n",
    "out": "Score: 10\nTrue\nTrue\nTrue"
   }
  ],
  "note": "Тест кездейсоқ сандарды тұрақты seed арқылы жасайды: generate_integer ішінде random.randint(0, 9) / (10, 99) / (100, 999) қолданыңыз және сандарды x, y жұбымен жасаңыз. Ұпай «Score: N» түрінде шығады. Сұрақ мәтіні (prompt) тексерілмейді, тек шығарылған нәтиже салыстырылады."
 }
});
