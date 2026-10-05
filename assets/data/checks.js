// Python тапсырмаларына арналған браузердегі тесттер (check50-ге ұқсас).
// Мәтіндер өзіміз құрастырған; күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = {
 "hello": {
  "title": "Sentimental: Hello",
  "file": "hello.py",
  "starter": "name = input(\"What is your name? \")\n# hello, ... деп шығарыңыз\n",
  "tests": [
   {
    "n": "«David» → hello, David",
    "in": [
     "David"
    ],
    "out": "hello, David"
   },
   {
    "n": "«Aigerim» → hello, Aigerim",
    "in": [
     "Aigerim"
    ],
    "out": "hello, Aigerim"
   }
  ]
 },
 "mario-less": {
  "title": "Sentimental: Mario (less)",
  "file": "mario.py",
  "starter": "# 1-ден 8-ге дейінгі биіктік сұраңыз, сосын оңға тураланған пирамида салыңыз\n",
  "tests": [
   {
    "n": "Биіктігі 1",
    "in": [
     "1"
    ],
    "out": "#"
   },
   {
    "n": "Биіктігі 3",
    "in": [
     "3"
    ],
    "out": "  #\n ##\n###"
   },
   {
    "n": "Биіктігі 8",
    "in": [
     "8"
    ],
    "out": "       #\n      ##\n     ###\n    ####\n   #####\n  ######\n #######\n########"
   },
   {
    "n": "0 мен 9-ды қабылдамайды",
    "in": [
     "0",
     "9",
     "2"
    ],
    "out": " #\n##"
   },
   {
    "n": "Сан емес «foo»-ны қабылдамайды",
    "in": [
     "foo",
     "-1",
     "1"
    ],
    "out": "#"
   }
  ]
 },
 "mario-more": {
  "title": "Sentimental: Mario (more)",
  "file": "mario.py",
  "starter": "# Екі пирамида: арасында екі бос орын, соңында бос орын жоқ\n",
  "tests": [
   {
    "n": "Биіктігі 1",
    "in": [
     "1"
    ],
    "out": "#  #"
   },
   {
    "n": "Биіктігі 2",
    "in": [
     "2"
    ],
    "out": " #  #\n##  ##"
   },
   {
    "n": "Биіктігі 8",
    "in": [
     "8"
    ],
    "out": "       #  #\n      ##  ##\n     ###  ###\n    ####  ####\n   #####  #####\n  ######  ######\n #######  #######\n########  ########"
   },
   {
    "n": "0 мен 9-ды қабылдамайды",
    "in": [
     "0",
     "9",
     "3"
    ],
    "out": "  #  #\n ##  ##\n###  ###"
   }
  ]
 },
 "cash": {
  "title": "Sentimental: Cash",
  "file": "cash.py",
  "starter": "# Қайтарым соммасын доллармен сұраңыз (мысалы, 0.41), ең аз тиын санын шығарыңыз\n",
  "tests": [
   {
    "n": "0.41 → 4",
    "in": [
     "0.41"
    ],
    "out": "4"
   },
   {
    "n": "0.01 → 1",
    "in": [
     "0.01"
    ],
    "out": "1"
   },
   {
    "n": "0.15 → 2",
    "in": [
     "0.15"
    ],
    "out": "2"
   },
   {
    "n": "1.6 → 7",
    "in": [
     "1.6"
    ],
    "out": "7"
   },
   {
    "n": "23 → 92",
    "in": [
     "23"
    ],
    "out": "92"
   },
   {
    "n": "0.29 → 5 (float дәлдігі: int() емес, round() керек!)",
    "in": [
     "0.29"
    ],
    "out": "5"
   },
   {
    "n": "4.2 → 18",
    "in": [
     "4.2"
    ],
    "out": "18"
   },
   {
    "n": "Теріс санды қабылдамайды",
    "in": [
     "-1",
     "0.41"
    ],
    "out": "4"
   },
   {
    "n": "Сан еместі қабылдамайды",
    "in": [
     "foo",
     "0.41"
    ],
    "out": "4"
   }
  ]
 },
 "readability": {
  "title": "Sentimental: Readability",
  "file": "readability.py",
  "starter": "text = input(\"Text: \")\n# Коулман–Лиау индексін есептеңіз\n",
  "tests": [
   {
    "n": "Қарапайым мәтін → Before Grade 1",
    "in": [
     "I am Bota. I like to run. I can jump."
    ],
    "out": "Before Grade 1"
   },
   {
    "n": "→ Grade 4",
    "in": [
     "Aruzhan has a red ball. She throws it to her little brother, and he catches it with both hands."
    ],
    "out": "Grade 4"
   },
   {
    "n": "→ Grade 6",
    "in": [
     "Every summer we visit our grandparents in the village. We swim in the river and help with the animals."
    ],
    "out": "Grade 6"
   },
   {
    "n": "→ Grade 11",
    "in": [
     "My grandmother bakes bread every morning, and the whole house smells warm and sweet."
    ],
    "out": "Grade 11"
   },
   {
    "n": "→ Grade 15",
    "in": [
     "Computer science teaches us how to think carefully about problems and how to describe solutions precisely."
    ],
    "out": "Grade 15"
   },
   {
    "n": "Күрделі мәтін → Grade 16+",
    "in": [
     "Computational thinking, algorithmic reasoning, and abstraction constitute fundamental intellectual competencies underpinning contemporary scientific investigation."
    ],
    "out": "Grade 16+"
   }
  ]
 }
};
