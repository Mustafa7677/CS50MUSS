// CS50 Web: JavaScript автотексерушісінің тесттері. Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_JSCHECKS = Object.assign(window.CS50KZ_JSCHECKS || {}, {
 "js-capitalize": {
  "title": "capitalize: бас әріппен бастау (сайттың өз жаттығуы)",
  "file": "capitalize.js",
  "starter": "// TODO: capitalize(word) функциясын жазыңыз.\n// Бірінші әріпті бас әріпке, қалғандарын кіші әріпке айналдырып, жаңа жолды қайтарсын.\n// Бос жол берілсе, бос жол қайтсын.\nfunction capitalize(word) {\n    // ...\n}\n",
  "tests": [
   {
    "n": "capitalize(\"kazakhstan\") → \"Kazakhstan\"",
    "run": "capitalize(\"kazakhstan\")",
    "out": "Kazakhstan"
   },
   {
    "n": "бастапқы жол бас әріппен жазылған",
    "run": "capitalize(\"Almaty\")",
    "out": "Almaty"
   },
   {
    "n": "қалған әріптер кіші болады: \"jAVAsCRIPT\"",
    "run": "capitalize(\"jAVAsCRIPT\")",
    "out": "Javascript"
   },
   {
    "n": "бір әріп: \"x\"",
    "run": "capitalize(\"x\")",
    "out": "X"
   },
   {
    "n": "бос жол",
    "run": "capitalize(\"\")",
    "out": ""
   }
  ],
  "note": "Функция атауы capitalize болсын, нәтижені console.log емес, return арқылы қайтарыңыз."
 },
 "js-sum": {
  "title": "sum және average: массивпен жұмыс (сайттың өз жаттығуы)",
  "file": "sum.js",
  "starter": "// TODO: sum(numbers) массивтегі сандардың қосындысын қайтарсын.\nfunction sum(numbers) {\n    // ...\n}\n\n// TODO: average(numbers) орташа мәнді қайтарсын; бос массив үшін 0.\nfunction average(numbers) {\n    // ...\n}\n",
  "tests": [
   {
    "n": "sum([1, 2, 3]) → 6",
    "run": "sum([1, 2, 3])",
    "out": 6
   },
   {
    "n": "sum([10]) → 10 (бір элемент)",
    "run": "sum([10])",
    "out": 10
   },
   {
    "n": "sum([]) → 0",
    "run": "sum([])",
    "out": 0
   },
   {
    "n": "sum: теріс сандар",
    "run": "sum([5, -2, -3, 4])",
    "out": 4
   },
   {
    "n": "average([2, 4, 9]) → 5",
    "run": "average([2, 4, 9])",
    "out": 5
   },
   {
    "n": "average([]) → 0",
    "run": "average([])",
    "out": 0
   }
  ],
  "note": "Екі функция да return арқылы нәтиже қайтарсын. average бос массив үшін 0 қайтарады."
 },
 "js-wordcount": {
  "title": "countWords: сөздерді санау (сайттың өз жаттығуы)",
  "file": "wordcount.js",
  "starter": "// TODO: countWords(text) жолдағы әр сөздің неше рет кездескенін санап, объект қайтарсын.\n// Сөздер бос орын арқылы бөлінеді, бас/кіші әріп ескерілмейді (барлығы кіші әріпке келтіріледі).\n// Мысалы: countWords(\"to be or not to be\") -> {to: 2, be: 2, or: 1, not: 1}\nfunction countWords(text) {\n    // ...\n}\n",
  "tests": [
   {
    "n": "\"to be or not to be\"",
    "run": "countWords(\"to be or not to be\")",
    "out": {
     "to": 2,
     "be": 2,
     "or": 1,
     "not": 1
    }
   },
   {
    "n": "регистр ескерілмейді: Hello hello HELLO",
    "run": "countWords(\"Hello hello HELLO\")",
    "out": {
     "hello": 3
    }
   },
   {
    "n": "бір сөз",
    "run": "countWords(\"salem\")",
    "out": {
     "salem": 1
    }
   },
   {
    "n": "бос жол → {}",
    "run": "countWords(\"\")",
    "out": {}
   },
   {
    "n": "артық бос орындар",
    "run": "countWords(\"a  b a\")",
    "out": {
     "a": 2,
     "b": 1
    }
   }
  ],
  "note": "Объект қайтарыңыз: кілт - кіші әріппен жазылған сөз, мән - неше рет кездескені. Бос жол үшін {} қайтарыңыз."
 },
 "js-palindrome": {
  "title": "isPalindrome: палиндром (сайттың өз жаттығуы)",
  "file": "palindrome.js",
  "starter": "// TODO: isPalindrome(text) жол солдан оңға да, оңнан солға да бірдей оқылса true қайтарсын.\n// Регистр мен әріп емес таңбалар (бос орын, үтір т.б.) ескерілмейді.\nfunction isPalindrome(text) {\n    // ...\n}\n",
  "tests": [
   {
    "n": "\"level\" → true",
    "run": "isPalindrome(\"level\")",
    "out": true
   },
   {
    "n": "\"hello\" → false",
    "run": "isPalindrome(\"hello\")",
    "out": false
   },
   {
    "n": "регистр: \"Racecar\"",
    "run": "isPalindrome(\"Racecar\")",
    "out": true
   },
   {
    "n": "бос орын мен тыныс белгісі: \"A man, a plan, a canal: Panama\"",
    "run": "isPalindrome(\"A man, a plan, a canal: Panama\")",
    "out": true
   },
   {
    "n": "бір әріп \"a\"",
    "run": "isPalindrome(\"a\")",
    "out": true
   },
   {
    "n": "\"ab\" → false",
    "run": "isPalindrome(\"ab\")",
    "out": false
   }
  ],
  "note": "true немесе false қайтарыңыз. Әріп пен цифрдан басқа таңбаларды алып тастаңыз (мысалы, регулярлы өрнек арқылы) және кіші әріпке келтіріңіз."
 },
 "js-people": {
  "title": "Объектілер массиві: oldest және byCity (сайттың өз жаттығуы)",
  "file": "people.js",
  "starter": "// Әр адам - объект: {name: \"Aigerim\", age: 19, city: \"Almaty\"}\n\n// TODO: oldest(people) ең үлкен адамның атын (name) қайтарсын; массив бос болса null.\nfunction oldest(people) {\n    // ...\n}\n\n// TODO: byCity(people) қала бойынша топтасын:\n// {Almaty: [\"Aigerim\", \"Dana\"], Astana: [\"Bauyrzhan\"]}\nfunction byCity(people) {\n    // ...\n}\n",
  "tests": [
   {
    "n": "oldest: үш адам",
    "run": "oldest([{\"name\": \"Aigerim\", \"age\": 19, \"city\": \"Almaty\"}, {\"name\": \"Bauyrzhan\", \"age\": 23, \"city\": \"Astana\"}, {\"name\": \"Dana\", \"age\": 21, \"city\": \"Almaty\"}])",
    "out": "Bauyrzhan"
   },
   {
    "n": "oldest: бір адам",
    "run": "oldest([{\"name\":\"Yerzhan\",\"age\":30,\"city\":\"Shymkent\"}])",
    "out": "Yerzhan"
   },
   {
    "n": "oldest: бос массив → null",
    "run": "oldest([])",
    "out": null
   },
   {
    "n": "byCity: топтау",
    "run": "byCity([{\"name\": \"Aigerim\", \"age\": 19, \"city\": \"Almaty\"}, {\"name\": \"Bauyrzhan\", \"age\": 23, \"city\": \"Astana\"}, {\"name\": \"Dana\", \"age\": 21, \"city\": \"Almaty\"}])",
    "out": {
     "Almaty": [
      "Aigerim",
      "Dana"
     ],
     "Astana": [
      "Bauyrzhan"
     ]
    }
   },
   {
    "n": "byCity: бос массив → {}",
    "run": "byCity([])",
    "out": {}
   }
  ],
  "note": "Екі функция да return арқылы нәтиже қайтарады. Топтағы аттар массивтегі ретпен жүреді."
 },
 "js-countdown": {
  "title": "countdown: console.log және цикл (сайттың өз жаттығуы)",
  "file": "countdown.js",
  "starter": "// TODO: countdown(n) n-нен 1-ге дейін кері санасын (әр сан жеке console.log жолында),\n// ең соңында \"Start!\" деп шығарсын.\nfunction countdown(n) {\n    // ...\n}\n\ncountdown(3);\n",
  "tests": [
   {
    "n": "console.log шығысы: 3, 2, 1, Start!",
    "logs": [
     "3",
     "2",
     "1",
     "Start!"
    ]
   },
   {
    "n": "countdown(2) → 2, 1, Start!",
    "run": "(() => { const out = []; const old = console.log; console.log = (x) => out.push(x); countdown(2); console.log = old; return out; })()",
    "out": [
     2,
     1,
     "Start!"
    ]
   }
  ],
  "note": "Файл соңында countdown(3) шақырылуы керек: тексеруші console.log шығысын салыстырады: 3, 2, 1, Start!"
 }
});
