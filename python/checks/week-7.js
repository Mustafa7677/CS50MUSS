// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-numb3rs": {
  "title": "NUMB3RS",
  "file": "numb3rs.py",
  "starter": "import re\nimport sys\n\n\ndef main():\n    print(validate(input(\"IPv4 Address: \")))\n\n\ndef validate(ip):\n    # TODO: ip #.#.#.# пішімінде ме? (тұрақты өрнекпен тексеріңіз)\n    # TODO: әр сан 0-ден 255-ке дейін бе? Алдыңғы нөлдер (001) жарамсыз\n    # TODO: True немесе False қайтарыңыз\n    ...\n\n\nif __name__ == \"__main__\":\n    main()\n",
  "tests": [
   {
    "n": "127.0.0.1 → True",
    "in": [
     "127.0.0.1"
    ],
    "out": "True"
   },
   {
    "n": "255.255.255.255 → True",
    "in": [
     "255.255.255.255"
    ],
    "out": "True"
   },
   {
    "n": "0.0.0.0 → True",
    "in": [
     "0.0.0.0"
    ],
    "out": "True"
   },
   {
    "n": "512.512.512.512 → False",
    "in": [
     "512.512.512.512"
    ],
    "out": "False"
   },
   {
    "n": "1.2.3.1000 → False",
    "in": [
     "1.2.3.1000"
    ],
    "out": "False"
   },
   {
    "n": "255.256.1.1 (екінші байт) → False",
    "in": [
     "255.256.1.1"
    ],
    "out": "False"
   },
   {
    "n": "192.168.001.1 (алдыңғы нөл) → False",
    "in": [
     "192.168.001.1"
    ],
    "out": "False"
   },
   {
    "n": "1.2.3 (үш бөлік) → False",
    "in": [
     "1.2.3"
    ],
    "out": "False"
   },
   {
    "n": "cat → False",
    "in": [
     "cat"
    ],
    "out": "False"
   },
   {
    "n": "validate(\"IP 1.2.3.4\") тікелей → False",
    "in": [
     "1.2.3.4"
    ],
    "append": "print('validate(\"IP 1.2.3.4\") =', validate(\"IP 1.2.3.4\"))",
    "contains": "validate(\"IP 1.2.3.4\") = False",
    "out": "True\nvalidate(\"IP 1.2.3.4\") = False"
   },
   {
    "n": "validate(\"10.0.0.255\") тікелей → True",
    "in": [
     "1.2.3.4"
    ],
    "append": "print('validate(\"10.0.0.255\") =', validate(\"10.0.0.255\"))",
    "contains": "validate(\"10.0.0.255\") = True",
    "out": "True\nvalidate(\"10.0.0.255\") = True"
   }
  ],
  "note": "Сұрақ мәтіні (prompt) тексерілмейді, тек шығарылған нәтиже салыстырылады. Кейбір тесттер функцияңызды тікелей шақырады, сондықтан функция атауы мен параметрлері тапсырмадағыдай болуы керек."
 },
 "py-watch": {
  "title": "Watch on YouTube",
  "file": "watch.py",
  "starter": "import re\nimport sys\n\n\ndef main():\n    print(parse(input(\"HTML: \")))\n\n\ndef parse(s):\n    # TODO: iframe-тің src атрибутындағы YouTube URL-ін тұрақты өрнекпен табыңыз\n    # TODO: табылса, https://youtu.be/<ID> жолын қайтарыңыз, әйтпесе None\n    ...\n\n\nif __name__ == \"__main__\":\n    main()\n",
  "tests": [
   {
    "n": "http://youtube.com/embed/...",
    "in": [
     "<iframe src=\"http://youtube.com/embed/xvFZjo5PgG0\"></iframe>"
    ],
    "out": "https://youtu.be/xvFZjo5PgG0"
   },
   {
    "n": "https://youtube.com/embed/...",
    "in": [
     "<iframe src=\"https://youtube.com/embed/xvFZjo5PgG0\"></iframe>"
    ],
    "out": "https://youtu.be/xvFZjo5PgG0"
   },
   {
    "n": "https://www.youtube.com/embed/...",
    "in": [
     "<iframe src=\"https://www.youtube.com/embed/xvFZjo5PgG0\"></iframe>"
    ],
    "out": "https://youtu.be/xvFZjo5PgG0"
   },
   {
    "n": "http://www.youtube.com/embed/...",
    "in": [
     "<iframe src=\"http://www.youtube.com/embed/xvFZjo5PgG0\"></iframe>"
    ],
    "out": "https://youtu.be/xvFZjo5PgG0"
   },
   {
    "n": "Барлық атрибуттары бар iframe",
    "in": [
     "<iframe width=\"560\" height=\"315\" src=\"https://www.youtube.com/embed/xvFZjo5PgG0\" title=\"YouTube video player\" frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen></iframe>"
    ],
    "out": "https://youtu.be/xvFZjo5PgG0"
   },
   {
    "n": "Басқа ID: 9bZkp7q19f0",
    "in": [
     "<p>Look:</p><iframe src=\"https://youtube.com/embed/9bZkp7q19f0\" width=\"560\"></iframe>"
    ],
    "out": "https://youtu.be/9bZkp7q19f0"
   },
   {
    "n": "YouTube емес src → None",
    "in": [
     "<iframe width=\"560\" height=\"315\" src=\"https://cs50.harvard.edu/python\"></iframe>"
    ],
    "out": "None"
   },
   {
    "n": "iframe-сіз жай сілтеме → None",
    "in": [
     "<a href=\"https://www.youtube.com/embed/xvFZjo5PgG0\">video</a>"
    ],
    "out": "None"
   },
   {
    "n": "parse(\"hello\") тікелей → None",
    "in": [
     "hello"
    ],
    "append": "print('parse(\"hello\") =', parse(\"hello\"))",
    "contains": "parse(\"hello\") = None",
    "out": "None\nparse(\"hello\") = None"
   }
  ],
  "note": "Сұрақ мәтіні (prompt) тексерілмейді, тек шығарылған нәтиже салыстырылады. Кейбір тесттер функцияңызды тікелей шақырады, сондықтан функция атауы мен параметрлері тапсырмадағыдай болуы керек."
 },
 "py-working": {
  "title": "Working 9 to 5",
  "file": "working.py",
  "starter": "import re\nimport sys\n\n\ndef main():\n    print(convert(input(\"Hours: \")))\n\n\ndef convert(s):\n    # TODO: s пішімін тұрақты өрнекпен тексеріңіз (9 AM to 5 PM, 9:00 AM to 5:00 PM, ...)\n    # TODO: пішім не уақыт жарамсыз болса, raise ValueError\n    # TODO: екі уақытты да 24 сағаттық пішімге (09:00) айналдырып, \"09:00 to 17:00\" түрінде қайтарыңыз\n    ...\n\n\nif __name__ == \"__main__\":\n    main()\n",
  "tests": [
   {
    "n": "9 AM to 5 PM → 09:00 to 17:00",
    "in": [
     "9 AM to 5 PM"
    ],
    "out": "09:00 to 17:00"
   },
   {
    "n": "9:00 AM to 5:00 PM → 09:00 to 17:00",
    "in": [
     "9:00 AM to 5:00 PM"
    ],
    "out": "09:00 to 17:00"
   },
   {
    "n": "10 AM to 8:50 PM → 10:00 to 20:50",
    "in": [
     "10 AM to 8:50 PM"
    ],
    "out": "10:00 to 20:50"
   },
   {
    "n": "10:30 PM to 8 AM → 22:30 to 08:00",
    "in": [
     "10:30 PM to 8 AM"
    ],
    "out": "22:30 to 08:00"
   },
   {
    "n": "12 AM to 12 PM → 00:00 to 12:00",
    "in": [
     "12 AM to 12 PM"
    ],
    "out": "00:00 to 12:00"
   },
   {
    "n": "12:30 PM to 12:45 AM → 12:30 to 00:45",
    "in": [
     "12:30 PM to 12:45 AM"
    ],
    "out": "12:30 to 00:45"
   },
   {
    "n": "9:60 AM to 5:60 PM → ValueError",
    "in": [
     "9:60 AM to 5:60 PM"
    ],
    "raises": "ValueError",
    "out": "ValueError (тест құлауы керек)"
   },
   {
    "n": "9 AM - 5 PM → ValueError",
    "in": [
     "9 AM - 5 PM"
    ],
    "raises": "ValueError",
    "out": "ValueError (тест құлауы керек)"
   },
   {
    "n": "09:00 AM - 17:00 PM → ValueError",
    "in": [
     "09:00 AM - 17:00 PM"
    ],
    "raises": "ValueError",
    "out": "ValueError (тест құлауы керек)"
   },
   {
    "n": "13:00 PM to 5 PM → ValueError",
    "in": [
     "13:00 PM to 5 PM"
    ],
    "raises": "ValueError",
    "out": "ValueError (тест құлауы керек)"
   },
   {
    "n": "convert(\"5:00 PM to 9:00 AM\") тікелей",
    "in": [
     "9 AM to 5 PM"
    ],
    "append": "print('convert(\"5:00 PM to 9:00 AM\") =', convert(\"5:00 PM to 9:00 AM\"))",
    "contains": "convert(\"5:00 PM to 9:00 AM\") = 17:00 to 09:00",
    "out": "09:00 to 17:00\nconvert(\"5:00 PM to 9:00 AM\") = 17:00 to 09:00"
   }
  ],
  "note": "Сұрақ мәтіні (prompt) тексерілмейді, тек шығарылған нәтиже салыстырылады. Кейбір тесттер функцияңызды тікелей шақырады, сондықтан функция атауы мен параметрлері тапсырмадағыдай болуы керек. ValueError күтілетін тесттерде бағдарлама қатемен аяқталуы керек."
 },
 "py-um": {
  "title": "Regular, um, Expressions",
  "file": "um.py",
  "starter": "import re\nimport sys\n\n\ndef main():\n    print(count(input(\"Text: \")))\n\n\ndef count(s):\n    # TODO: «um» жеке сөз ретінде неше рет кездеседі? (бас/кіші әріп маңызды емес)\n    # TODO: yummy, album сияқты сөздердің ішіндегі um саналмайды; санды int етіп қайтарыңыз\n    ...\n\n\nif __name__ == \"__main__\":\n    main()\n",
  "tests": [
   {
    "n": "um → 1",
    "in": [
     "um"
    ],
    "out": "1"
   },
   {
    "n": "um? → 1",
    "in": [
     "um?"
    ],
    "out": "1"
   },
   {
    "n": "hello, um, world → 1",
    "in": [
     "hello, um, world"
    ],
    "out": "1"
   },
   {
    "n": "Um, thanks for the album. → 1",
    "in": [
     "Um, thanks for the album."
    ],
    "out": "1"
   },
   {
    "n": "Um, thanks, um... → 2",
    "in": [
     "Um, thanks, um..."
    ],
    "out": "2"
   },
   {
    "n": "UM um Um uM → 4",
    "in": [
     "UM um Um uM"
    ],
    "out": "4"
   },
   {
    "n": "yummy → 0",
    "in": [
     "yummy"
    ],
    "out": "0"
   },
   {
    "n": "count(\"um, yummy umbrella, um\") тікелей → 2",
    "in": [
     "um"
    ],
    "append": "print('count(\"um, yummy umbrella, um\") =', count(\"um, yummy umbrella, um\"))",
    "contains": "count(\"um, yummy umbrella, um\") = 2",
    "out": "1\ncount(\"um, yummy umbrella, um\") = 2"
   }
  ],
  "note": "Сұрақ мәтіні (prompt) тексерілмейді, тек шығарылған нәтиже салыстырылады. Кейбір тесттер функцияңызды тікелей шақырады, сондықтан функция атауы мен параметрлері тапсырмадағыдай болуы керек."
 }
});
