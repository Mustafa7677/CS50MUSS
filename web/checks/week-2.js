// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-person": {
  "title": "Person класы",
  "file": "person.py",
  "starter": "# TODO: Person класын жазыңыз\n# __init__(self, name, age): аты мен жасын сақтайды\n# birthday(self): жасты 1-ге арттырады (ештеңе қайтармайды)\n# greet(self): \"Hi, I'm Harry and I'm 17\" пішімінде жол ҚАЙТАРАДЫ\n",
  "tests": [
   {
    "n": "greet() → Hi, I'm Harry and I'm 17",
    "in": [],
    "append": "p = Person('Harry', 17)\nprint(p.greet())",
    "out": "Hi, I'm Harry and I'm 17"
   },
   {
    "n": "p.name және p.age атрибуттары",
    "in": [],
    "append": "p = Person('Ron', 18)\nprint(p.name, p.age)",
    "out": "Ron 18"
   },
   {
    "n": "birthday() жасты 1-ге арттырады",
    "in": [],
    "append": "p = Person('Ron', 18)\np.birthday()\nprint(p.age)",
    "out": "19"
   },
   {
    "n": "birthday() екі рет",
    "in": [],
    "append": "p = Person('Cho', 16)\np.birthday()\np.birthday()\nprint(p.greet())",
    "out": "Hi, I'm Cho and I'm 18"
   },
   {
    "n": "екі адам бір-біріне әсер етпейді",
    "in": [],
    "append": "a = Person('A', 10)\nb = Person('B', 20)\na.birthday()\nprint(a.age, b.age)",
    "out": "11 20"
   },
   {
    "n": "birthday() ештеңе қайтармайды",
    "in": [],
    "append": "print(Person('A', 10).birthday())",
    "out": "None"
   }
  ],
  "note": "Кластың өзін жазасыз; автотексеруші оны шақырып, нәтижесін салыстырады."
 },
 "py-announce": {
  "title": "announce декораторы",
  "file": "announce.py",
  "starter": "# TODO: announce(f) декораторын жазыңыз\n# wrapper: алдымен \"About to run the function\" жазсын,\n# сосын f-ті аргументтерімен шақырсын, сосын \"Done with the function\" жазсын\n# және f қайтарған мәнді қайтарсын\n",
  "tests": [
   {
    "n": "аргументсіз функция",
    "in": [],
    "append": "@announce\ndef hello():\n    print('Hello, world!')\n\nhello()",
    "out": "About to run the function\nHello, world!\nDone with the function"
   },
   {
    "n": "аргументі бар функция",
    "in": [],
    "append": "@announce\ndef greet(name):\n    print('Hi', name)\n\ngreet('Harry')",
    "out": "About to run the function\nHi Harry\nDone with the function"
   },
   {
    "n": "қайтарылған мән сақталады",
    "in": [],
    "append": "@announce\ndef add(a, b):\n    return a + b\n\nprint(add(2, 3))",
    "out": "About to run the function\nDone with the function\n5"
   },
   {
    "n": "атаулы аргумент",
    "in": [],
    "append": "@announce\ndef f(x, y=1):\n    return x * y\n\nprint(f(4, y=5))",
    "out": "About to run the function\nDone with the function\n20"
   }
  ],
  "note": "Декоратор аргументті функциялармен де жұмыс істеуі керек (*args, **kwargs)."
 },
 "py-count": {
  "title": "Сөздікпен санау",
  "file": "count.py",
  "starter": "def count_words(text):\n    # TODO: мәтіндегі әр сөздің неше рет кездескенін сөздік етіп қайтарыңыз\n    # (регистрге қарамаңыз: The және the бір сөз)\n    pass\n",
  "tests": [
   {
    "n": "a b a → {a: 2, b: 1}",
    "in": [],
    "append": "print(sorted(count_words('a b a').items()))",
    "out": "[('a', 2), ('b', 1)]"
   },
   {
    "n": "регистр: The the THE",
    "in": [],
    "append": "print(sorted(count_words('The the THE cat').items()))",
    "out": "[('cat', 1), ('the', 3)]"
   },
   {
    "n": "бос жол → {}",
    "in": [],
    "append": "print(count_words(''))",
    "out": "{}"
   },
   {
    "n": "бір сөз бірнеше рет",
    "in": [],
    "append": "print(count_words('go go go go'))",
    "out": "{'go': 4}"
   },
   {
    "n": "Harry Ron Harry Hermione ron",
    "in": [],
    "append": "print(sorted(count_words('Harry Ron Harry Hermione ron').items()))",
    "out": "[('harry', 2), ('hermione', 1), ('ron', 2)]"
   }
  ],
  "note": "Сөздік реті маңызды емес: автотексеруші нәтижені сұрыптап салыстырады."
 },
 "py-lambda": {
  "title": "lambda арқылы сұрыптау",
  "file": "people.py",
  "starter": "def sort_people(people):\n    # TODO: people - сөздіктер тізімі ({\"name\": ..., \"age\": ...}).\n    # lambda пен key қолданып, аты бойынша өсу ретімен сұрыпталған ЖАҢА тізім қайтарыңыз\n    pass\n\n\ndef oldest(people):\n    # TODO: ең үлкен адамның атын қайтарыңыз (lambda + key)\n    pass\n",
  "tests": [
   {
    "n": "sort_people аты бойынша",
    "in": [],
    "append": "P = [{'name': 'Harry', 'age': 17}, {'name': 'Cho', 'age': 18}, {'name': 'Draco', 'age': 17}]\nprint([p['name'] for p in sort_people(P)])",
    "out": "['Cho', 'Draco', 'Harry']"
   },
   {
    "n": "sort_people бастапқы тізімді өзгертпейді",
    "in": [],
    "append": "P = [{'name': 'B', 'age': 1}, {'name': 'A', 'age': 2}]\nsort_people(P)\nprint([p['name'] for p in P])",
    "out": "['B', 'A']"
   },
   {
    "n": "oldest",
    "in": [],
    "append": "P = [{'name': 'Harry', 'age': 17}, {'name': 'Cho', 'age': 19}, {'name': 'Draco', 'age': 18}]\nprint(oldest(P))",
    "out": "Cho"
   },
   {
    "n": "oldest: бір адам",
    "in": [],
    "append": "print(oldest([{'name': 'Solo', 'age': 5}]))",
    "out": "Solo"
   },
   {
    "n": "sort_people: бос тізім",
    "in": [],
    "append": "print(sort_people([]))",
    "out": "[]"
   }
  ],
  "note": "sort_people бастапқы тізімді өзгертпеуі керек (sorted қолданыңыз)."
 }
});
