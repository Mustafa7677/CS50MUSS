// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-deep": {
  "title": "Deep Thought",
  "file": "deep.py",
  "starter": "# Қолданушыдан Ұлы Сұрақтың жауабын сұраңыз\nanswer = input(\"What is the Answer to the Great Question of Life, the Universe, and Everything? \")\n\n# TODO: бос орындарды алып тастап, кіші әріпке айналдырыңыз\n\n# TODO: 42, forty-two немесе forty two болса - Yes, әйтпесе - No\n",
  "tests": [
   {
    "n": "42 → Yes",
    "in": [
     "42"
    ],
    "out": "Yes"
   },
   {
    "n": "forty-two → Yes",
    "in": [
     "forty-two"
    ],
    "out": "Yes"
   },
   {
    "n": "forty two → Yes",
    "in": [
     "forty two"
    ],
    "out": "Yes"
   },
   {
    "n": "FoRty TwO → Yes",
    "in": [
     "FoRty TwO"
    ],
    "out": "Yes"
   },
   {
    "n": "«  42  » (бос орынмен) → Yes",
    "in": [
     "  42  "
    ],
    "out": "Yes"
   },
   {
    "n": "50 → No",
    "in": [
     "50"
    ],
    "out": "No"
   },
   {
    "n": "fortytwo → No",
    "in": [
     "fortytwo"
    ],
    "out": "No"
   }
  ],
  "note": "Сұрақ мәтіні (prompt) тексерілмейді, тек шығарылған нәтиже салыстырылады."
 },
 "py-bank": {
  "title": "Home Federal Savings Bank",
  "file": "bank.py",
  "starter": "# Қолданушыдан сәлемдесуді сұраңыз\ngreeting = input(\"Greeting: \")\n\n# TODO: басындағы бос орындарды алып, кіші әріпке айналдырыңыз\n\n# TODO: hello-дан басталса $0, h-тан басталса $20, әйтпесе $100\n",
  "tests": [
   {
    "n": "Hello → $0",
    "in": [
     "Hello"
    ],
    "out": "$0"
   },
   {
    "n": "«  hello  » → $0",
    "in": [
     "  hello  "
    ],
    "out": "$0"
   },
   {
    "n": "Hello, Newman → $0",
    "in": [
     "Hello, Newman"
    ],
    "out": "$0"
   },
   {
    "n": "How you doing? → $20",
    "in": [
     "How you doing?"
    ],
    "out": "$20"
   },
   {
    "n": "hey → $20",
    "in": [
     "hey"
    ],
    "out": "$20"
   },
   {
    "n": "What's happening? → $100",
    "in": [
     "What's happening?"
    ],
    "out": "$100"
   },
   {
    "n": "Good morning → $100",
    "in": [
     "Good morning"
    ],
    "out": "$100"
   }
  ],
  "note": "Сұрақ мәтіні (prompt) тексерілмейді, тек шығарылған нәтиже салыстырылады."
 },
 "py-extensions": {
  "title": "File Extensions",
  "file": "extensions.py",
  "starter": "# Қолданушыдан файл атын сұраңыз\nname = input(\"File name: \")\n\n# TODO: бос орындарды алып, кіші әріпке айналдырыңыз\n\n# TODO: файл атының соңына қарап (.gif, .jpg, .jpeg, .png, .pdf, .txt, .zip)\n#       медиа типін шығарыңыз, әйтпесе application/octet-stream\n",
  "tests": [
   {
    "n": "happy.gif → image/gif",
    "in": [
     "happy.gif"
    ],
    "out": "image/gif"
   },
   {
    "n": "happy.jpg → image/jpeg",
    "in": [
     "happy.jpg"
    ],
    "out": "image/jpeg"
   },
   {
    "n": "happy.JPEG → image/jpeg",
    "in": [
     "happy.JPEG"
    ],
    "out": "image/jpeg"
   },
   {
    "n": "happy.png → image/png",
    "in": [
     "happy.png"
    ],
    "out": "image/png"
   },
   {
    "n": "«  document.PDF  » → application/pdf",
    "in": [
     "  document.PDF  "
    ],
    "out": "application/pdf"
   },
   {
    "n": "plain.txt → text/plain",
    "in": [
     "plain.txt"
    ],
    "out": "text/plain"
   },
   {
    "n": "files.zip → application/zip",
    "in": [
     "files.zip"
    ],
    "out": "application/zip"
   },
   {
    "n": "cat (кеңейтімсіз) → application/octet-stream",
    "in": [
     "cat"
    ],
    "out": "application/octet-stream"
   }
  ],
  "note": "Сұрақ мәтіні (prompt) тексерілмейді, тек шығарылған нәтиже салыстырылады."
 },
 "py-interpreter": {
  "title": "Math Interpreter",
  "file": "interpreter.py",
  "starter": "# Қолданушыдан өрнекті сұраңыз, мысалы: 1 + 1\nexpression = input(\"Expression: \")\n\n# TODO: өрнекті split арқылы x, y, z-ке бөліңіз\n\n# TODO: y-ке қарап (+, -, *, /) есептеңіз\n\n# TODO: нәтижені бір ондық таңбамен float етіп шығарыңыз\n",
  "tests": [
   {
    "n": "1 + 1 → 2.0",
    "in": [
     "1 + 1"
    ],
    "out": "2.0"
   },
   {
    "n": "2 - 3 → -1.0",
    "in": [
     "2 - 3"
    ],
    "out": "-1.0"
   },
   {
    "n": "2 * 2 → 4.0",
    "in": [
     "2 * 2"
    ],
    "out": "4.0"
   },
   {
    "n": "50 / 5 → 10.0",
    "in": [
     "50 / 5"
    ],
    "out": "10.0"
   },
   {
    "n": "3 / 2 → 1.5",
    "in": [
     "3 / 2"
    ],
    "out": "1.5"
   },
   {
    "n": "1 / 3 → 0.3",
    "in": [
     "1 / 3"
    ],
    "out": "0.3"
   }
  ],
  "note": "Сұрақ мәтіні (prompt) тексерілмейді, тек шығарылған нәтиже салыстырылады."
 },
 "py-meal": {
  "title": "Meal Time",
  "file": "meal.py",
  "starter": "def main():\n    # TODO: уақытты сұрап, convert арқылы сағатқа айналдырыңыз\n    # TODO: таңғы, түскі немесе кешкі ас уақыты болса, соны шығарыңыз\n    ...\n\n\ndef convert(time):\n    # TODO: \"7:30\" сияқты жолды 7.5 сияқты float санға айналдырып, қайтарыңыз\n    ...\n\n\nif __name__ == \"__main__\":\n    main()\n",
  "tests": [
   {
    "n": "7:00 → breakfast time",
    "in": [
     "7:00"
    ],
    "out": "breakfast time"
   },
   {
    "n": "8:00 → breakfast time (шекара)",
    "in": [
     "8:00"
    ],
    "out": "breakfast time"
   },
   {
    "n": "12:42 → lunch time",
    "in": [
     "12:42"
    ],
    "out": "lunch time"
   },
   {
    "n": "13:00 → lunch time (шекара)",
    "in": [
     "13:00"
    ],
    "out": "lunch time"
   },
   {
    "n": "18:32 → dinner time",
    "in": [
     "18:32"
    ],
    "out": "dinner time"
   },
   {
    "n": "11:11 → ештеңе шықпайды",
    "in": [
     "11:11"
    ],
    "out": ""
   },
   {
    "n": "convert(\"7:30\") → 7.5",
    "in": [
     "11:11"
    ],
    "append": "print(convert(\"7:30\"))",
    "out": "7.5"
   },
   {
    "n": "convert(\"18:45\") → 18.75",
    "in": [
     "11:11"
    ],
    "append": "print(convert(\"18:45\"))",
    "out": "18.75"
   }
  ],
  "note": "Сұрақ мәтіні (prompt) тексерілмейді, тек шығарылған нәтиже салыстырылады. convert функциясы бөлек тексеріледі, сондықтан ол float қайтаруы керек (print емес, return)."
 }
});
