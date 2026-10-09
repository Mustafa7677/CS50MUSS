// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-scores": {
  "title": "Passing Scores",
  "file": "scores.py",
  "starter": "def main():\n    # TODO: бос орынмен бөлінген ұпайларды сұрап, тізімдік өрнекпен int тізіміне айналдырыңыз\n    # TODO: өткен ұпайларды \", \" арқылы, сосын Passed: k/n жолын шығарыңыз\n    ...\n\n\ndef passing(scores):\n    # TODO: 50 және одан жоғары ұпайлардың тізімін бастапқы ретімен қайтарыңыз\n    ...\n\n\nif __name__ == \"__main__\":\n    main()\n",
  "tests": [
   {
    "n": "45 50 99 12 → 50, 99 және Passed: 2/4",
    "in": [
     "45 50 99 12"
    ],
    "out": "50, 99\nPassed: 2/4"
   },
   {
    "n": "100 → 100 және Passed: 1/1",
    "in": [
     "100"
    ],
    "out": "100\nPassed: 1/1"
   },
   {
    "n": "70 60 90 → ретін өзгертпейді",
    "in": [
     "70 60 90"
    ],
    "out": "70, 60, 90\nPassed: 3/3"
   },
   {
    "n": "10 20 49 → бос жол және Passed: 0/3",
    "in": [
     "10 20 49"
    ],
    "out": "\nPassed: 0/3"
   },
   {
    "n": "passing([10, 50, 99]) → [50, 99]",
    "in": [
     "1"
    ],
    "append": "print(passing([10, 50, 99]))",
    "out": "\nPassed: 0/1\n[50, 99]"
   },
   {
    "n": "passing([]) → []",
    "in": [
     "1"
    ],
    "append": "print(passing([]))",
    "out": "\nPassed: 0/1\n[]"
   }
  ],
  "note": "Сұрақ мәтіні (prompt) тексерілмейді, тек шығарылған нәтиже салыстырылады. passing функциясы бөлек тексеріледі, сондықтан ол тізім қайтаруы керек."
 },
 "py-squares": {
  "title": "Square Generator",
  "file": "squares.py",
  "starter": "def main():\n    n = int(input(\"What's n? \"))\n    for square in squares(n):\n        print(square)\n\n\ndef squares(n):\n    # TODO: 1*1, 2*2, ..., n*n мәндерін yield арқылы бір-бірлеп беріңіз\n    ...\n\n\nif __name__ == \"__main__\":\n    main()\n",
  "tests": [
   {
    "n": "3 → 1, 4, 9",
    "in": [
     "3"
    ],
    "out": "1\n4\n9"
   },
   {
    "n": "1 → 1",
    "in": [
     "1"
    ],
    "out": "1"
   },
   {
    "n": "0 → ештеңе шықпайды",
    "in": [
     "0"
    ],
    "out": ""
   },
   {
    "n": "6 → 1 ... 36",
    "in": [
     "6"
    ],
    "out": "1\n4\n9\n16\n25\n36"
   },
   {
    "n": "squares - генератор (yield қолданылған)",
    "in": [
     "0"
    ],
    "append": "import types\nprint(isinstance(squares(3), types.GeneratorType))",
    "out": "True"
   },
   {
    "n": "next(squares(10**12)) → 1 (жадқа бәрін салмайды)",
    "in": [
     "0"
    ],
    "append": "print(next(iter(squares(10**12))))",
    "out": "1"
   }
  ],
  "note": "Сұрақ мәтіні (prompt) тексерілмейді, тек шығарылған нәтиже салыстырылады. squares тізім емес, генератор болуы керек (yield)."
 }
});
