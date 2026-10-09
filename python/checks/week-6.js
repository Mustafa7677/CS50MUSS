// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-lines": {
  "title": "Lines of Code",
  "file": "lines.py",
  "starter": "import sys\n\n\ndef main():\n    # TODO: командалық жол аргументі дәл біреу екенін тексеріңіз\n    #       (Too few command-line arguments / Too many command-line arguments)\n    # TODO: файл аты .py-мен аяқталмаса - Not a Python file\n    # TODO: файлды ашыңыз; ол жоқ болса - File does not exist\n    # TODO: бос жолдар мен түсініктемелерден басқа жолдарды санап, шығарыңыз\n    ...\n\n\nmain()\n",
  "tests": [
   {
    "n": "Аргументсіз → Too few command-line arguments",
    "in": [],
    "argv": [
     "lines.py"
    ],
    "out": "Too few command-line arguments"
   },
   {
    "n": "Екі аргумент → Too many command-line arguments",
    "in": [],
    "argv": [
     "lines.py",
     "hello.py",
     "goodbye.py"
    ],
    "files": {
     "hello.py": "# Say hello\n\nname = input(\"What's your name? \")\nprint(f\"hello, {name}\")\n",
     "goodbye.py": "print(\"goodbye\")\n"
    },
    "out": "Too many command-line arguments"
   },
   {
    "n": ".txt файл → Not a Python file",
    "in": [],
    "argv": [
     "lines.py",
     "invalid_extension.txt"
    ],
    "files": {
     "invalid_extension.txt": "hello, world\n"
    },
    "out": "Not a Python file"
   },
   {
    "n": "Жоқ файл → File does not exist",
    "in": [],
    "argv": [
     "lines.py",
     "non_existent_file.py"
    ],
    "out": "File does not exist"
   },
   {
    "n": "hello.py (түсініктеме мен бос жол) → 2",
    "in": [],
    "argv": [
     "lines.py",
     "hello.py"
    ],
    "files": {
     "hello.py": "# Say hello\n\nname = input(\"What's your name? \")\nprint(f\"hello, {name}\")\n"
    },
    "out": "2"
   },
   {
    "n": "is_even (5 жол код) → 5",
    "in": [],
    "argv": [
     "lines.py",
     "is_even.py"
    ],
    "files": {
     "is_even.py": "def is_even(n):\n    if n % 2 == 0:\n        return True\n    else:\n        return False\n"
    },
    "out": "5"
   },
   {
    "n": "Шегіністі түсініктемелер мен тек бос орыны бар жолдар есептелмейді",
    "in": [],
    "argv": [
     "lines.py",
     "messy.py"
    ],
    "files": {
     "messy.py": "# Бұл бағдарлама сәлем береді\nimport sys\n\n    \ndef main():\n    # Атын сұраймыз\n    name = input(\"Name: \")\n        # тереңірек шегіністегі түсініктеме\n\t\n    print(f\"hello, {name}\")  # жол соңындағы түсініктеме - бұл код\n\n\nmain()"
    },
    "out": "5"
   },
   {
    "n": "Docstring түсініктеме емес, код ретінде саналады",
    "in": [],
    "argv": [
     "lines.py",
     "docs.py"
    ],
    "files": {
     "docs.py": "\"\"\"\nA program that greets the user.\n\"\"\"\n\n\ndef main():\n    \"\"\"Greet the user.\"\"\"\n    print(\"hello\")\n\n\nmain()\n"
    },
    "out": "7"
   }
  ],
  "note": "Бағдарлама командалық жол аргументтерімен іске қосылады (мысалы, python lines.py hello.py). Қате хабарлары «Қалай тексеруге болады» бөліміндегідей болуы керек. Әр тест өзінің .py файлдарын жасайды."
 },
 "py-pizza": {
  "title": "Pizza Py",
  "file": "pizza.py",
  "starter": "import csv\nimport sys\n\nfrom tabulate import tabulate\n\n\ndef main():\n    # TODO: командалық жол аргументі дәл біреу екенін тексеріңіз\n    # TODO: файл аты .csv-мен аяқталмаса - Not a CSV file\n    # TODO: файлды csv модулімен оқыңыз; ол жоқ болса - File does not exist\n    # TODO: tabulate(..., tablefmt=\"grid\") арқылы кестені шығарыңыз\n    ...\n\n\nmain()\n",
  "tests": [
   {
    "n": "Аргументсіз → Too few command-line arguments",
    "in": [],
    "argv": [
     "pizza.py"
    ],
    "out": "Too few command-line arguments"
   },
   {
    "n": "Екі аргумент → Too many command-line arguments",
    "in": [],
    "argv": [
     "pizza.py",
     "regular.csv",
     "sicilian.csv"
    ],
    "out": "Too many command-line arguments"
   },
   {
    "n": "sicilian.txt → Not a CSV file",
    "in": [],
    "argv": [
     "pizza.py",
     "sicilian.txt"
    ],
    "out": "Not a CSV file"
   },
   {
    "n": "Жоқ файл → File does not exist",
    "in": [],
    "argv": [
     "pizza.py",
     "invalid_file.csv"
    ],
    "out": "File does not exist"
   },
   {
    "n": "regular.csv → grid кестесі",
    "in": [],
    "argv": [
     "pizza.py",
     "regular.csv"
    ],
    "out": "+-----------------+---------+---------+\n| Regular Pizza   | Small   | Large   |\n+=================+=========+=========+\n| Cheese          | $13.50  | $18.95  |\n+-----------------+---------+---------+\n| 1 topping       | $14.75  | $20.95  |\n+-----------------+---------+---------+\n| 2 toppings      | $15.95  | $22.95  |\n+-----------------+---------+---------+\n| 3 toppings      | $16.95  | $24.95  |\n+-----------------+---------+---------+\n| Special         | $18.50  | $26.95  |\n+-----------------+---------+---------+"
   },
   {
    "n": "sicilian.csv → grid кестесі",
    "in": [],
    "argv": [
     "pizza.py",
     "sicilian.csv"
    ],
    "out": "+------------------+---------+---------+\n| Sicilian Pizza   | Small   | Large   |\n+==================+=========+=========+\n| Cheese           | $25.50  | $39.95  |\n+------------------+---------+---------+\n| 1 item           | $27.50  | $41.95  |\n+------------------+---------+---------+\n| 2 items          | $29.50  | $43.95  |\n+------------------+---------+---------+\n| 3 items          | $31.50  | $45.95  |\n+------------------+---------+---------+\n| Special          | $33.50  | $47.95  |\n+------------------+---------+---------+"
   },
   {
    "n": "Басқа мәзір (menu.csv) → grid кестесі",
    "in": [],
    "argv": [
     "pizza.py",
     "menu.csv"
    ],
    "out": "+----------------+---------+\n| Noch's Pizza   | Price   |\n+================+=========+\n| Pepperoni      | $9.99   |\n+----------------+---------+\n| Veggie Supreme | $11.25  |\n+----------------+---------+"
   }
  ],
  "files": {
   "tabulate.py": "\"\"\"Браузерге арналған tabulate-тің шағын көшірмесі (тек tablefmt=\"grid\").\"\"\"\n\n\ndef _num(s):\n    try:\n        float(str(s).replace(\",\", \"\"))\n        return True\n    except ValueError:\n        return False\n\n\ndef tabulate(tabular_data, headers=(), tablefmt=\"simple\", **kwargs):\n    rows = list(tabular_data)\n    if rows and isinstance(rows[0], dict):\n        keys = []\n        for r in rows:\n            for k in r:\n                if k not in keys:\n                    keys.append(k)\n        if headers == \"keys\":\n            headers = keys\n        rows = [[r.get(k, \"\") for k in keys] for r in rows]\n    else:\n        rows = [list(r) for r in rows]\n        if headers == \"firstrow\":\n            headers, rows = (rows[0], rows[1:]) if rows else ([], [])\n        elif headers == \"keys\":\n            headers = [str(i) for i in range(len(rows[0]))] if rows else []\n    headers = [str(h) for h in headers]\n    rows = [[\"\" if c is None else str(c) for c in r] for r in rows]\n    n = max([len(headers)] + [len(r) for r in rows]) if (rows or headers) else 0\n    for r in rows:\n        r += [\"\"] * (n - len(r))\n    if headers and len(headers) < n:\n        headers = [\"\"] * (n - len(headers)) + headers\n    widths = []\n    right = []\n    for i in range(n):\n        col = [r[i] for r in rows]\n        w = max([len(c) for c in col] + [0])\n        if headers:\n            w = max(w, len(headers[i]) + 2)\n        widths.append(w)\n        right.append(bool(col) and all(_num(c) for c in col if c != \"\"))\n\n    def cell(s, i):\n        return s.rjust(widths[i]) if right[i] else s.ljust(widths[i])\n\n    def line(ch):\n        return \"+\" + \"+\".join(ch * (w + 2) for w in widths) + \"+\"\n\n    def row(r):\n        return \"| \" + \" | \".join(cell(c, i) for i, c in enumerate(r)) + \" |\"\n\n    if tablefmt != \"grid\":\n        out = []\n        if headers:\n            out.append(\"  \".join(cell(h, i) for i, h in enumerate(headers)))\n            out.append(\"  \".join(\"-\" * w for w in widths))\n        out += [\"  \".join(cell(c, i) for i, c in enumerate(r)) for r in rows]\n        return \"\\n\".join(out)\n    out = [line(\"-\")]\n    if headers:\n        out += [row(headers), line(\"=\")]\n    for r in rows:\n        out += [row(r), line(\"-\")]\n    if not headers and not rows:\n        return \"\"\n    return \"\\n\".join(out)\n",
   "sicilian.csv": "Sicilian Pizza,Small,Large\nCheese,$25.50,$39.95\n1 item,$27.50,$41.95\n2 items,$29.50,$43.95\n3 items,$31.50,$45.95\nSpecial,$33.50,$47.95\n",
   "regular.csv": "Regular Pizza,Small,Large\nCheese,$13.50,$18.95\n1 topping,$14.75,$20.95\n2 toppings,$15.95,$22.95\n3 toppings,$16.95,$24.95\nSpecial,$18.50,$26.95\n",
   "sicilian.txt": "Sicilian Pizza,Small,Large\nCheese,$25.50,$39.95\n1 item,$27.50,$41.95\n2 items,$29.50,$43.95\n3 items,$31.50,$45.95\nSpecial,$33.50,$47.95\n",
   "menu.csv": "Noch's Pizza,Price\nPepperoni,$9.99\nVeggie Supreme,$11.25\n"
  },
  "note": "Браузерде tabulate пакетінің орнына оның grid пішімін ғана білетін шағын көшірмесі (tabulate.py) тұр; толық тексеру - cs50.dev-тегі check50. Қолжетімді файлдар: sicilian.csv, regular.csv, sicilian.txt, menu.csv."
 },
 "py-scourgify": {
  "title": "Scourgify",
  "file": "scourgify.py",
  "starter": "import csv\nimport sys\n\n\ndef main():\n    # TODO: командалық жол аргументі дәл екеу екенін тексеріңіз\n    # TODO: бірінші файлды csv.DictReader-мен оқыңыз;\n    #       оқу мүмкін болмаса - Could not read <файл аты>\n    # TODO: екінші файлға csv.DictWriter арқылы first, last, house бағандарын жазыңыз\n    #       (алдымен writeheader)\n    ...\n\n\nmain()\n",
  "tests": [
   {
    "n": "Аргументсіз → Too few command-line arguments",
    "in": [],
    "argv": [
     "scourgify.py"
    ],
    "out": "Too few command-line arguments"
   },
   {
    "n": "Үш аргумент → Too many command-line arguments",
    "in": [],
    "argv": [
     "scourgify.py",
     "1.csv",
     "2.csv",
     "3.csv"
    ],
    "files": {
     "1.csv": "",
     "2.csv": "",
     "3.csv": ""
    },
    "out": "Too many command-line arguments"
   },
   {
    "n": "Жоқ файл → Could not read invalid_file.csv",
    "in": [],
    "argv": [
     "scourgify.py",
     "invalid_file.csv",
     "output.csv"
    ],
    "out": "Could not read invalid_file.csv"
   },
   {
    "n": "Үш оқушы → after.csv дұрыс жазылды",
    "in": [],
    "argv": [
     "scourgify.py",
     "before.csv",
     "after.csv"
    ],
    "files": {
     "before.csv": "name,house\n\"Abbott, Hannah\",Hufflepuff\n\"Bell, Katie\",Gryffindor\n\"Potter, Harry\",Gryffindor\n"
    },
    "append": "import os as _os\nprint(open('after.csv').read(), end='')\n_os.remove('after.csv')",
    "out": "first,last,house\nHannah,Abbott,Hufflepuff\nKatie,Bell,Gryffindor\nHarry,Potter,Gryffindor"
   },
   {
    "n": "Он екі оқушы → басқа атпен (clean.csv) жазылды",
    "in": [],
    "argv": [
     "scourgify.py",
     "before.csv",
     "clean.csv"
    ],
    "files": {
     "before.csv": "name,house\n\"Abbott, Hannah\",Hufflepuff\n\"Bell, Katie\",Gryffindor\n\"Bones, Susan\",Hufflepuff\n\"Boot, Terry\",Ravenclaw\n\"Chang, Cho\",Ravenclaw\n\"Finch-Fletchley, Justin\",Hufflepuff\n\"Granger, Hermione\",Gryffindor\n\"Lovegood, Luna\",Ravenclaw\n\"Malfoy, Draco\",Slytherin\n\"McGonagall, Minerva\",Gryffindor\n\"Weasley, Ron\",Gryffindor\n\"Zabini, Blaise\",Slytherin\n"
    },
    "append": "import os as _os\nprint(open('clean.csv').read(), end='')\n_os.remove('clean.csv')",
    "out": "first,last,house\nHannah,Abbott,Hufflepuff\nKatie,Bell,Gryffindor\nSusan,Bones,Hufflepuff\nTerry,Boot,Ravenclaw\nCho,Chang,Ravenclaw\nJustin,Finch-Fletchley,Hufflepuff\nHermione,Granger,Gryffindor\nLuna,Lovegood,Ravenclaw\nDraco,Malfoy,Slytherin\nMinerva,McGonagall,Gryffindor\nRon,Weasley,Gryffindor\nBlaise,Zabini,Slytherin"
   }
  ],
  "note": "Тексеруші сіз жазған CSV файлын оқып шығарады, сондықтан сәтті аяқталғанда sys.exit шақырмаңыз. Әр тест өзінің before.csv файлын жасайды."
 }
});
