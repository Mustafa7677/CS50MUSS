// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-camel": {
  "title": "camelCase",
  "file": "camel.py",
  "starter": "# Қолданушыдан camelCase атауын сұраңыз\ncamel = input(\"camelCase: \")\n\n# TODO: for c in camel: циклімен әр таңбаны қарап шығыңыз\n#       бас әріп болса - алдына _ қойып, кіші әріпке айналдырыңыз\n\n# TODO: snake_case атауын шығарыңыз\n",
  "tests": [
   {
    "n": "name → name",
    "in": [
     "name"
    ],
    "out": "name"
   },
   {
    "n": "firstName → first_name",
    "in": [
     "firstName"
    ],
    "out": "first_name"
   },
   {
    "n": "preferredFirstName → preferred_first_name",
    "in": [
     "preferredFirstName"
    ],
    "out": "preferred_first_name"
   },
   {
    "n": "x → x",
    "in": [
     "x"
    ],
    "out": "x"
   },
   {
    "n": "aBC → a_b_c",
    "in": [
     "aBC"
    ],
    "out": "a_b_c"
   },
   {
    "n": "isValidPlateNumber → is_valid_plate_number",
    "in": [
     "isValidPlateNumber"
    ],
    "out": "is_valid_plate_number"
   }
  ],
  "note": "Сұрақ мәтіні (prompt) тексерілмейді, тек print арқылы шығарылған нәтиже салыстырылады. Тек snake_case атауының өзін шығарыңыз (мысалы, first_name), алдына басқа мәтін қоспаңыз."
 },
 "py-coke": {
  "title": "Coke Machine",
  "file": "coke.py",
  "starter": "# Әлі төленуі тиіс сома (цент)\ndue = 50\n\n# TODO: due 0-ден үлкен болғанша қайталаңыз:\n#       - \"Amount Due: ...\" деп шығарыңыз\n#       - input(\"Insert Coin: \") арқылы тиын сұраңыз\n#       - тиын 25, 10 не 5 болса ғана due-дан алыңыз\n\n# TODO: \"Change Owed: ...\" деп қайтарылатын қалдықты шығарыңыз\n",
  "tests": [
   {
    "n": "25, 25 → Change Owed: 0",
    "in": [
     "25",
     "25"
    ],
    "out": "Amount Due: 50\nAmount Due: 25\nChange Owed: 0"
   },
   {
    "n": "25, 10, 25 → Change Owed: 10",
    "in": [
     "25",
     "10",
     "25"
    ],
    "out": "Amount Due: 50\nAmount Due: 25\nAmount Due: 15\nChange Owed: 10"
   },
   {
    "n": "10, 25, 25 → Change Owed: 10",
    "in": [
     "10",
     "25",
     "25"
    ],
    "out": "Amount Due: 50\nAmount Due: 40\nAmount Due: 15\nChange Owed: 10"
   },
   {
    "n": "5 × 10 → Change Owed: 0",
    "in": [
     "10",
     "10",
     "10",
     "10",
     "10"
    ],
    "out": "Amount Due: 50\nAmount Due: 40\nAmount Due: 30\nAmount Due: 20\nAmount Due: 10\nChange Owed: 0"
   },
   {
    "n": "30 қабылданбайды",
    "in": [
     "30",
     "25",
     "25"
    ],
    "out": "Amount Due: 50\nAmount Due: 50\nAmount Due: 25\nChange Owed: 0"
   },
   {
    "n": "1, 2, 3 қабылданбайды",
    "in": [
     "1",
     "2",
     "3",
     "25",
     "25"
    ],
    "out": "Amount Due: 50\nAmount Due: 50\nAmount Due: 50\nAmount Due: 50\nAmount Due: 25\nChange Owed: 0"
   },
   {
    "n": "5, 25, 25 → Change Owed: 5",
    "in": [
     "5",
     "25",
     "25"
    ],
    "out": "Amount Due: 50\nAmount Due: 45\nAmount Due: 20\nChange Owed: 5"
   }
  ],
  "note": "Сұрақ мәтіні (prompt) тексерілмейді, тек print арқылы шығарылған нәтиже салыстырылады. «Amount Due: …» жолын print арқылы шығарыңыз: input сұрағының ішіне жазсаңыз, браузерде ол көрінбейді."
 },
 "py-twttr": {
  "title": "Just setting up my twttr",
  "file": "twttr.py",
  "starter": "# Қолданушыдан мәтін сұраңыз\ntext = input(\"Input: \")\n\n# TODO: for c in text: циклімен әр таңбаны қарап шығыңыз\n#       дауысты әріп (A, E, I, O, U - бас не кіші) болмаса ғана қалдырыңыз\n\n# TODO: нәтижені шығарыңыз\n",
  "tests": [
   {
    "n": "Twitter → Twttr",
    "in": [
     "Twitter"
    ],
    "contains": "Twttr",
    "out": "Twttr"
   },
   {
    "n": "What's your name? → Wht's yr nm?",
    "in": [
     "What's your name?"
    ],
    "contains": "Wht's yr nm?",
    "out": "Wht's yr nm?"
   },
   {
    "n": "CS50 → CS50",
    "in": [
     "CS50"
    ],
    "contains": "CS50",
    "out": "CS50"
   },
   {
    "n": "TWITTER → TWTTR (бас әріптер)",
    "in": [
     "TWITTER"
    ],
    "contains": "TWTTR",
    "out": "TWTTR"
   },
   {
    "n": "AbEcIdOfUg → bcdfg",
    "in": [
     "AbEcIdOfUg"
    ],
    "contains": "bcdfg",
    "out": "bcdfg"
   },
   {
    "n": "Hello, World! → Hll, Wrld!",
    "in": [
     "Hello, World!"
    ],
    "contains": "Hll, Wrld!",
    "out": "Hll, Wrld!"
   }
  ],
  "note": "Сұрақ мәтіні (prompt) тексерілмейді, тек print арқылы шығарылған нәтиже салыстырылады. Шығыста дұрыс нәтиже болса жеткілікті (алдына «Output:» қойсаңыз да болады)."
 },
 "py-plates": {
  "title": "Vanity Plates",
  "file": "plates.py",
  "starter": "def main():\n    plate = input(\"Plate: \")\n    if is_valid(plate):\n        print(\"Valid\")\n    else:\n        print(\"Invalid\")\n\n\ndef is_valid(s):\n    # TODO: ұзындығы 2-ден 6-ға дейін бе?\n    # TODO: алғашқы екі таңба - әріп пе?\n    # TODO: тек әріптер мен цифрлар ма (нүкте, бос орын жоқ)?\n    # TODO: цифрлар тек соңында ма, ал бірінші цифр 0 емес пе?\n    # Бәрі орындалса True, әйтпесе False қайтарыңыз\n    ...\n\n\nmain()\n",
  "tests": [
   {
    "n": "CS50 → Valid",
    "in": [
     "CS50"
    ],
    "out": "Valid"
   },
   {
    "n": "ECTO88 → Valid",
    "in": [
     "ECTO88"
    ],
    "out": "Valid"
   },
   {
    "n": "CS05 → Invalid (бірінші цифр 0)",
    "in": [
     "CS05"
    ],
    "out": "Invalid"
   },
   {
    "n": "CS50P → Invalid (цифр ортада)",
    "in": [
     "CS50P"
    ],
    "out": "Invalid"
   },
   {
    "n": "PI3.14 → Invalid (нүкте)",
    "in": [
     "PI3.14"
    ],
    "out": "Invalid"
   },
   {
    "n": "H → Invalid (тым қысқа)",
    "in": [
     "H"
    ],
    "out": "Invalid"
   },
   {
    "n": "OUTATIME → Invalid (тым ұзын)",
    "in": [
     "OUTATIME"
    ],
    "out": "Invalid"
   },
   {
    "n": "is_valid(\"AAA222\"), is_valid(\"50\") → True False",
    "in": [
     "CS50"
    ],
    "append": "print(is_valid(\"AAA222\"), is_valid(\"50\"))",
    "out": "Valid\nTrue False"
   }
  ],
  "note": "Сұрақ мәтіні (prompt) тексерілмейді, тек print арқылы шығарылған нәтиже салыстырылады. is_valid функциясы бөлек те тексеріледі, сондықтан ол True не False қайтаруы керек (print емес, return)."
 },
 "py-nutrition": {
  "title": "Nutrition Facts",
  "file": "nutrition.py",
  "starter": "# TODO: жемістерді калорияларымен байланыстыратын dict жасаңыз (20 жеміс)\nfruits = {\n    \"apple\": 130,\n    # ...\n}\n\n# TODO: қолданушыдан жемісті сұрап, кіші әріпке айналдырыңыз\n\n# TODO: жеміс сөздікте болса, \"Calories: ...\" деп шығарыңыз\n",
  "tests": [
   {
    "n": "Apple → Calories: 130",
    "in": [
     "Apple"
    ],
    "out": "Calories: 130"
   },
   {
    "n": "Avocado → Calories: 50",
    "in": [
     "Avocado"
    ],
    "out": "Calories: 50"
   },
   {
    "n": "Sweet Cherries → Calories: 100",
    "in": [
     "Sweet Cherries"
    ],
    "out": "Calories: 100"
   },
   {
    "n": "kiwifruit → Calories: 90",
    "in": [
     "kiwifruit"
    ],
    "out": "Calories: 90"
   },
   {
    "n": "LEMON → Calories: 15",
    "in": [
     "LEMON"
    ],
    "out": "Calories: 15"
   },
   {
    "n": "honeydew melon → Calories: 50",
    "in": [
     "honeydew melon"
    ],
    "out": "Calories: 50"
   },
   {
    "n": "Tomato → ештеңе шықпайды",
    "in": [
     "Tomato"
    ],
    "out": ""
   }
  ],
  "note": "Сұрақ мәтіні (prompt) тексерілмейді, тек print арқылы шығарылған нәтиже салыстырылады. Жеміс тізімде болмаса, ештеңе шығармаңыз."
 }
});
