// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-fuel": {
  "title": "Fuel Gauge",
  "file": "fuel.py",
  "starter": "def main():\n    # TODO: X/Y пішіміндегі бөлшекті сұраңыз; қате болса (ValueError, ZeroDivisionError,\n    # X > Y, теріс сан) қайта сұраңыз\n    ...\n\n    # TODO: пайызды ең жақын бүтін санға дөңгелектеңіз\n    # TODO: 1% не одан аз болса E, 99% не одан көп болса F, әйтпесе 75% сияқты шығарыңыз\n\n\nmain()\n",
  "tests": [
   {
    "n": "3/4 → 75%",
    "in": [
     "3/4"
    ],
    "out": "75%"
   },
   {
    "n": "2/3 → 67% (дөңгелектеу)",
    "in": [
     "2/3"
    ],
    "out": "67%"
   },
   {
    "n": "0/4 → E",
    "in": [
     "0/4"
    ],
    "out": "E"
   },
   {
    "n": "1/100 → E",
    "in": [
     "1/100"
    ],
    "out": "E"
   },
   {
    "n": "99/100 → F",
    "in": [
     "99/100"
    ],
    "out": "F"
   },
   {
    "n": "4/0 → қайта сұрау, сосын 1/4 → 25%",
    "in": [
     "4/0",
     "1/4"
    ],
    "out": "25%"
   },
   {
    "n": "three/four, 1.5/3 → қайта сұрау, сосын 1/2",
    "in": [
     "three/four",
     "1.5/3",
     "1/2"
    ],
    "out": "50%"
   },
   {
    "n": "-3/4, 5/4 → қайта сұрау, сосын 4/4 → F",
    "in": [
     "-3/4",
     "5/4",
     "4/4"
    ],
    "out": "F"
   }
  ],
  "note": "Сұрақ мәтіні (prompt) тексерілмейді, тек шығарылған нәтиже салыстырылады. Қате кірістен кейін бағдарлама қайта сұрауы керек: тесттің келесі кірісі сол жаңа сұраққа беріледі."
 },
 "py-taqueria": {
  "title": "Felipe's Taqueria",
  "file": "taqueria.py",
  "starter": "menu = {\n    \"Baja Taco\": 4.25,\n    \"Burrito\": 7.50,\n    \"Bowl\": 8.50,\n    \"Nachos\": 11.00,\n    \"Quesadilla\": 8.50,\n    \"Super Burrito\": 8.50,\n    \"Super Quesadilla\": 9.50,\n    \"Taco\": 3.00,\n    \"Tortilla Salad\": 8.00\n}\n\n\ndef main():\n    # TODO: control-d басылғанша (EOFError) тағам атауларын сұрай беріңіз\n    # TODO: регистрді ескермеңіз; мәзірде жоқ тағамды елемеңіз\n    # TODO: әр тағамнан кейін Total: $X.XX шығарыңыз\n    ...\n\n\nmain()\n",
  "tests": [
   {
    "n": "Taco, Taco → Total: $6.00",
    "in": [
     "Taco",
     "Taco"
    ],
    "out": "Total: $3.00\nTotal: $6.00"
   },
   {
    "n": "Baja Taco, Tortilla Salad → $12.25",
    "in": [
     "Baja Taco",
     "Tortilla Salad"
    ],
    "out": "Total: $4.25\nTotal: $12.25"
   },
   {
    "n": "burrito (кіші әріппен) → $7.50",
    "in": [
     "burrito"
    ],
    "out": "Total: $7.50"
   },
   {
    "n": "SUPER QUESADILLA, nachos → $20.50",
    "in": [
     "SUPER QUESADILLA",
     "nachos"
    ],
    "out": "Total: $9.50\nTotal: $20.50"
   },
   {
    "n": "Burger елемейді, сосын Taco → $3.00",
    "in": [
     "Burger",
     "Taco"
    ],
    "out": "Total: $3.00"
   },
   {
    "n": "Бос кіріс (бірден control-d) → ештеңе",
    "in": [],
    "out": ""
   }
  ],
  "note": "Кірістер тізімі таусылған кезде input() EOFError көтереді - бұл дәл control-d басқанмен бірдей. Сұрақ мәтіні (prompt) тексерілмейді. Әр тағамнан кейін «Total: $6.00» пішімінде шығарыңыз."
 },
 "py-grocery": {
  "title": "Grocery List",
  "file": "grocery.py",
  "starter": "def main():\n    # TODO: тауарларды сақтайтын сөздік (dict) жасаңыз\n\n    # TODO: control-d басылғанша (EOFError) тауарларды бір-бірлеп сұраңыз,\n    # әрқайсысының санын регистрді ескермей есептеңіз\n\n    # TODO: тізімді әліпби бойынша сұрыптап, \"2 MILK\" пішімінде шығарыңыз\n    ...\n\n\nmain()\n",
  "tests": [
   {
    "n": "mango, strawberry → 1 MANGO / 1 STRAWBERRY",
    "in": [
     "mango",
     "strawberry"
    ],
    "out": "1 MANGO\n1 STRAWBERRY"
   },
   {
    "n": "milk, milk → 2 MILK",
    "in": [
     "milk",
     "milk"
    ],
    "out": "2 MILK"
   },
   {
    "n": "tortilla, sweet potato → сұрыпталған",
    "in": [
     "tortilla",
     "sweet potato"
    ],
    "out": "1 SWEET POTATO\n1 TORTILLA"
   },
   {
    "n": "Milk, MILK, milk → 3 MILK (регистр)",
    "in": [
     "Milk",
     "MILK",
     "milk"
    ],
    "out": "3 MILK"
   },
   {
    "n": "banana, apple, banana, carrot",
    "in": [
     "banana",
     "apple",
     "banana",
     "carrot"
    ],
    "out": "1 APPLE\n2 BANANA\n1 CARROT"
   }
  ],
  "note": "Кірістер тізімі таусылған кезде input() EOFError көтереді - бұл дәл control-d басқанмен бірдей. Сұрақ мәтіні (prompt) тексерілмейді. Тізімнің алдына бос жол шығармаңыз: мұндағы тексеруші шығысты дәл салыстырады."
 },
 "py-outdated": {
  "title": "Outdated",
  "file": "outdated.py",
  "starter": "months = [\n    \"January\",\n    \"February\",\n    \"March\",\n    \"April\",\n    \"May\",\n    \"June\",\n    \"July\",\n    \"August\",\n    \"September\",\n    \"October\",\n    \"November\",\n    \"December\"\n]\n\n\ndef main():\n    # TODO: 9/8/1636 немесе September 8, 1636 пішіміндегі күнді сұраңыз\n    # TODO: жарамсыз болса (ай 1-12, күн 1-31 емес т.б.) қайта сұраңыз\n    # TODO: YYYY-MM-DD пішімінде шығарыңыз (мысалы, f\"{n:02}\")\n    ...\n\n\nmain()\n",
  "tests": [
   {
    "n": "9/8/1636 → 1636-09-08",
    "in": [
     "9/8/1636"
    ],
    "out": "1636-09-08"
   },
   {
    "n": "September 8, 1636 → 1636-09-08",
    "in": [
     "September 8, 1636"
    ],
    "out": "1636-09-08"
   },
   {
    "n": "10/9/1701 → 1701-10-09",
    "in": [
     "10/9/1701"
    ],
    "out": "1701-10-09"
   },
   {
    "n": "23/6/1912 → қайта сұрау",
    "in": [
     "23/6/1912",
     "1/1/1970"
    ],
    "out": "1970-01-01"
   },
   {
    "n": "December 80, 1980 → қайта сұрау",
    "in": [
     "December 80, 1980",
     "December 8, 1980"
    ],
    "out": "1980-12-08"
   },
   {
    "n": "September 8 1636 (үтірсіз) → қайта сұрау",
    "in": [
     "September 8 1636",
     "October 9, 1701"
    ],
    "out": "1701-10-09"
   },
   {
    "n": "October/9/1701 → қайта сұрау",
    "in": [
     "October/9/1701",
     "3/14/2015"
    ],
    "out": "2015-03-14"
   }
  ],
  "note": "Сұрақ мәтіні (prompt) тексерілмейді, тек шығарылған нәтиже салыстырылады. Жарамсыз күннен кейін бағдарлама қайта сұрауы керек."
 }
});
