// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-jar": {
  "title": "Cookie Jar",
  "file": "jar.py",
  "starter": "class Jar:\n    def __init__(self, capacity=12):\n        # TODO: capacity теріс емес int болмаса - ValueError\n        # TODO: сыйымдылық пен печенье санын (басында 0) сақтаңыз\n        ...\n\n    def __str__(self):\n        # TODO: банкадағы печенье санындай 🍪 жолын қайтарыңыз\n        ...\n\n    def deposit(self, n):\n        # TODO: n печенье қосыңыз; сыйымдылықтан асса - ValueError\n        ...\n\n    def withdraw(self, n):\n        # TODO: n печенье алыңыз; банкада жетпесе - ValueError\n        ...\n\n    @property\n    def capacity(self):\n        # TODO: банканың сыйымдылығын қайтарыңыз\n        ...\n\n    @property\n    def size(self):\n        # TODO: банкадағы печенье санын қайтарыңыз\n        ...\n",
  "tests": [
   {
    "n": "Jar() - сыйымдылығы 12, бос",
    "in": [],
    "append": "jar = Jar()\nprint(jar.capacity, jar.size, repr(str(jar)))",
    "out": "12 0 ''"
   },
   {
    "n": "Jar(3) - сыйымдылығы 3",
    "in": [],
    "append": "jar = Jar(3)\nprint(jar.capacity, jar.size)",
    "out": "3 0"
   },
   {
    "n": "Jar(0) - нөл сыйымдылық рұқсат етіледі",
    "in": [],
    "append": "jar = Jar(0)\nprint(jar.capacity, jar.size)",
    "out": "0 0"
   },
   {
    "n": "Jar(-1) → ValueError",
    "in": [],
    "append": "Jar(-1)",
    "raises": "ValueError",
    "out": "ValueError (тест құлауы керек)"
   },
   {
    "n": "Jar(\"cat\") → ValueError",
    "in": [],
    "append": "Jar(\"cat\")",
    "raises": "ValueError",
    "out": "ValueError (тест құлауы керек)"
   },
   {
    "n": "deposit(3) → size 3, str = 🍪🍪🍪",
    "in": [],
    "append": "jar = Jar()\njar.deposit(3)\nprint(jar.size, str(jar))",
    "out": "3 🍪🍪🍪"
   },
   {
    "n": "deposit(1) + deposit(11) → толық банка (12)",
    "in": [],
    "append": "jar = Jar()\njar.deposit(1)\njar.deposit(11)\nprint(jar.size, str(jar))",
    "out": "12 🍪🍪🍪🍪🍪🍪🍪🍪🍪🍪🍪🍪"
   },
   {
    "n": "deposit(13) → ValueError",
    "in": [],
    "append": "jar = Jar()\njar.deposit(13)",
    "raises": "ValueError",
    "out": "ValueError (тест құлауы керек)"
   },
   {
    "n": "Jar(5): deposit(3), deposit(3) → ValueError",
    "in": [],
    "append": "jar = Jar(5)\njar.deposit(3)\njar.deposit(3)",
    "raises": "ValueError",
    "out": "ValueError (тест құлауы керек)"
   },
   {
    "n": "deposit(5), withdraw(2) → size 3",
    "in": [],
    "append": "jar = Jar()\njar.deposit(5)\njar.withdraw(2)\nprint(jar.size, str(jar))",
    "out": "3 🍪🍪🍪"
   },
   {
    "n": "deposit(4), withdraw(4) → бос банка",
    "in": [],
    "append": "jar = Jar()\njar.deposit(4)\njar.withdraw(4)\nprint(jar.size, repr(str(jar)))",
    "out": "0 ''"
   },
   {
    "n": "deposit(2), withdraw(3) → ValueError",
    "in": [],
    "append": "jar = Jar()\njar.deposit(2)\njar.withdraw(3)",
    "raises": "ValueError",
    "out": "ValueError (тест құлауы керек)"
   }
  ],
  "note": "Файлда тек Jar класы болсын: тексеруші өз кодын соңына қосып, класты өзі шақырады. main() жазсаңыз, оны браузерде шақырмаңыз (if __name__ == \"__main__\" ішінде де шақырмаңыз), әйтпесе ол кіріс күтіп, тест құлайды."
 }
});
