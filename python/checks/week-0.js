// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-indoor": {
  "title": "Indoor Voice",
  "file": "indoor.py",
  "starter": "# Енгізілген мәтінді кіші әріптермен шығарыңыз\n",
  "tests": [
   {
    "n": "HELLO → hello",
    "in": [
     "HELLO"
    ],
    "out": "hello"
   },
   {
    "n": "THIS IS CS50 → this is cs50",
    "in": [
     "THIS IS CS50"
    ],
    "out": "this is cs50"
   },
   {
    "n": "50 → 50",
    "in": [
     "50"
    ],
    "out": "50"
   },
   {
    "n": "Тыныс белгілері өзгермейді",
    "in": [
     "Hello, World!"
    ],
    "out": "hello, world!"
   },
   {
    "n": "Қазақша әріптер де кішірейеді",
    "in": [
     "САЛЕМ, ӘЛЕМ!"
    ],
    "out": "салем, әлем!"
   }
  ]
 },
 "py-playback": {
  "title": "Playback Speed",
  "file": "playback.py",
  "starter": "# Әр бос орынды ... (үш нүкте) етіп шығарыңыз\n",
  "tests": [
   {
    "n": "This is CS50",
    "in": [
     "This is CS50"
    ],
    "out": "This...is...CS50"
   },
   {
    "n": "This is our week on functions",
    "in": [
     "This is our week on functions"
    ],
    "out": "This...is...our...week...on...functions"
   },
   {
    "n": "Let's implement a function called hello",
    "in": [
     "Let's implement a function called hello"
    ],
    "out": "Let's...implement...a...function...called...hello"
   },
   {
    "n": "Бір сөз - өзгеріссіз",
    "in": [
     "hello"
    ],
    "out": "hello"
   }
  ]
 },
 "py-faces": {
  "title": "Making Faces",
  "file": "faces.py",
  "starter": "def main():\n    ...\n\n\ndef convert(text):\n    ...\n\n\nmain()\n",
  "tests": [
   {
    "n": ":) → 🙂",
    "in": [
     "Hello :)"
    ],
    "out": "Hello 🙂"
   },
   {
    "n": ":( → 🙁",
    "in": [
     "Goodbye :("
    ],
    "out": "Goodbye 🙁"
   },
   {
    "n": "Екеуі бірге",
    "in": [
     "Hello :) Goodbye :("
    ],
    "out": "Hello 🙂 Goodbye 🙁"
   },
   {
    "n": "Эмотикон жоқ - өзгеріссіз",
    "in": [
     "Hello"
    ],
    "out": "Hello"
   }
  ]
 },
 "py-einstein": {
  "title": "Einstein",
  "file": "einstein.py",
  "starter": "# Массаны (кг) сұрап, E = mc² Джоульді бүтін сан етіп шығарыңыз\n",
  "tests": [
   {
    "n": "1 → 90000000000000000",
    "in": [
     "1"
    ],
    "out": "90000000000000000"
   },
   {
    "n": "14",
    "in": [
     "14"
    ],
    "out": "1260000000000000000"
   },
   {
    "n": "50",
    "in": [
     "50"
    ],
    "out": "4500000000000000000"
   }
  ]
 },
 "py-tip": {
  "title": "Tip Calculator",
  "file": "tip.py",
  "starter": "def main():\n    dollars = dollars_to_float(input(\"How much was the meal? \"))\n    percent = percent_to_float(input(\"What percentage would you like to tip? \"))\n    tip = dollars * percent\n    print(f\"Leave ${tip:.2f}\")\n\n\ndef dollars_to_float(d):\n    # TODO\n    ...\n\n\ndef percent_to_float(p):\n    # TODO\n    ...\n\n\nmain()\n",
  "tests": [
   {
    "n": "$50.00 және 15% → Leave $7.50",
    "in": [
     "$50.00",
     "15%"
    ],
    "out": "Leave $7.50"
   },
   {
    "n": "$100.00 және 18% → Leave $18.00",
    "in": [
     "$100.00",
     "18%"
    ],
    "out": "Leave $18.00"
   },
   {
    "n": "$15.00 және 25% → Leave $3.75",
    "in": [
     "$15.00",
     "25%"
    ],
    "out": "Leave $3.75"
   }
  ]
 }
});
