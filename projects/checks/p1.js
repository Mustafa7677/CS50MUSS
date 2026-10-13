// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-pj1-router": {
  "title": "Жоба 1: маршрутизатор",
  "file": "app.py",
  "starter": "# app.py - кішкентай веб-фреймворк, 1-қадам: маршрутизатор\nROUTES = {}\n\n\ndef route(path):\n    \"\"\"Декоратор: функцияны path мекенжайына тіркейді.\"\"\"\n    # TODO: ішінде register(func) функциясын жазыңыз: ол ROUTES[path] = func жасасын\n    # TODO: register func-тың өзін қайтарсын (әйтпесе функция жоғалып кетеді!)\n    # TODO: route(path) өзі register-ді қайтарсын\n    ...\n\n\ndef handle(path):\n    \"\"\"Мекенжайға тіркелген функцияны шақырып, нәтижесін қайтарады.\"\"\"\n    # TODO: path ROUTES-та болса, сол функцияны шақырып, нәтижесін қайтарыңыз\n    # TODO: болмаса, \"404 Not Found\" жолын қайтарыңыз\n    ...\n",
  "tests": [
   {
    "n": "handle('/') басты бетті қайтарады",
    "in": [],
    "append": "ROUTES.clear()\n\n\n@route(\"/\")\ndef home():\n    return \"Басты бет\"\n\n\n@route(\"/about\")\ndef about():\n    return \"Біз туралы\"\n\nprint(handle(\"/\"))",
    "out": "Басты бет"
   },
   {
    "n": "handle('/about') басқа функцияны шақырады",
    "in": [],
    "append": "ROUTES.clear()\n\n\n@route(\"/\")\ndef home():\n    return \"Басты бет\"\n\n\n@route(\"/about\")\ndef about():\n    return \"Біз туралы\"\n\nprint(handle(\"/about\"))",
    "out": "Біз туралы"
   },
   {
    "n": "Белгісіз мекенжай: 404 Not Found",
    "in": [],
    "append": "ROUTES.clear()\n\n\n@route(\"/\")\ndef home():\n    return \"Басты бет\"\n\n\n@route(\"/about\")\ndef about():\n    return \"Біз туралы\"\n\nprint(handle(\"/missing\"))",
    "out": "404 Not Found"
   },
   {
    "n": "Декоратор функцияны жоғалтпайды (home() әлі шақырылады)",
    "in": [],
    "append": "ROUTES.clear()\n\n\n@route(\"/\")\ndef home():\n    return \"Басты бет\"\n\n\n@route(\"/about\")\ndef about():\n    return \"Біз туралы\"\n\nprint(home())",
    "out": "Басты бет"
   },
   {
    "n": "ROUTES сөздігінде мекенжайлар тұр",
    "in": [],
    "append": "ROUTES.clear()\n\n\n@route(\"/\")\ndef home():\n    return \"Басты бет\"\n\n\n@route(\"/about\")\ndef about():\n    return \"Біз туралы\"\n\nprint(sorted(ROUTES))",
    "out": "['/', '/about']"
   },
   {
    "n": "Тіркелмеген кезде де 404",
    "in": [],
    "append": "ROUTES.clear()\nprint(handle(\"/\"))",
    "out": "404 Not Found"
   }
  ]
 },
 "py-pj1-params": {
  "title": "Жоба 1: параметрлі мекенжайлар",
  "file": "app.py",
  "starter": "# app.py - 2-қадам: мекенжайдағы параметрлер (/user/<name>)\nROUTES = {}\n\n\ndef route(path):\n    def register(func):\n        ROUTES[path] = func\n        return func\n    return register\n\n\ndef match(pattern, path):\n    \"\"\"'/user/<name>' үлгісін '/user/Aru' мекенжайымен салыстырады.\n    Сәйкес келсе - параметрлер сөздігін ({'name': 'Aru'}), әйтпесе None қайтарады.\"\"\"\n    # TODO: екеуін де бастапқы/соңғы \"/\" белгілерінен тазалап, \"/\" бойынша бөліңіз\n    # TODO: бөлік саны әр түрлі болса, None қайтарыңыз\n    # TODO: үлгідегі <...> бөлігі параметр: params[атауы] = мекенжайдағы бөлік\n    # TODO: қалған бөліктер дәл тең болуы керек, әйтпесе None\n    ...\n\n\ndef handle(path):\n    \"\"\"Барлық үлгілерді ретімен тексеріп, біріншісінің функциясын параметрлерімен шақырады.\"\"\"\n    # TODO: for pattern, func in ROUTES.items(): match(pattern, path) шақырыңыз\n    # TODO: None емес болса, func(**params) нәтижесін қайтарыңыз\n    # TODO: ешқайсысы сәйкес келмесе, \"404 Not Found\"\n    ...\n",
  "tests": [
   {
    "n": "match: /user/<name> + /user/Aru",
    "in": [],
    "append": "print(match(\"/user/<name>\", \"/user/Aru\"))",
    "out": "{'name': 'Aru'}"
   },
   {
    "n": "match: екі параметр",
    "in": [],
    "append": "print(match(\"/post/<year>/<slug>\", \"/post/2026/hello\"))",
    "out": "{'year': '2026', 'slug': 'hello'}"
   },
   {
    "n": "match: параметрсіз дәл сәйкестік бос сөздік береді",
    "in": [],
    "append": "print(match(\"/about\", \"/about\"))",
    "out": "{}"
   },
   {
    "n": "match: басқа сөз -> None",
    "in": [],
    "append": "print(match(\"/user/<name>\", \"/admin/Aru\"))",
    "out": "None"
   },
   {
    "n": "match: бөлік саны басқа -> None (артық бөлік)",
    "in": [],
    "append": "print(match(\"/user/<name>\", \"/user/Aru/edit\"))",
    "out": "None"
   },
   {
    "n": "match: бөлік саны басқа -> None (кем бөлік)",
    "in": [],
    "append": "print(match(\"/user/<name>\", \"/user\"))",
    "out": "None"
   },
   {
    "n": "match: соңғы / ескерілмейді",
    "in": [],
    "append": "print(match(\"/user/<name>\", \"/user/Aru/\"))",
    "out": "{'name': 'Aru'}"
   },
   {
    "n": "match: түбір мекенжай '/'",
    "in": [],
    "append": "print(match(\"/\", \"/\"), match(\"/\", \"/x\"))",
    "out": "{} None"
   },
   {
    "n": "handle параметрді функцияға береді",
    "in": [],
    "append": "ROUTES.clear()\n\n\n@route(\"/user/<name>\")\ndef user(name):\n    return f\"Сәлем, {name}!\"\n\n\n@route(\"/post/<year>/<slug>\")\ndef post(year, slug):\n    return f\"{slug} ({year})\"\n\n\n@route(\"/about\")\ndef about():\n    return \"Біз туралы\"\n\nprint(handle(\"/user/Aigerim\"))",
    "out": "Сәлем, Aigerim!"
   },
   {
    "n": "handle екі параметр",
    "in": [],
    "append": "ROUTES.clear()\n\n\n@route(\"/user/<name>\")\ndef user(name):\n    return f\"Сәлем, {name}!\"\n\n\n@route(\"/post/<year>/<slug>\")\ndef post(year, slug):\n    return f\"{slug} ({year})\"\n\n\n@route(\"/about\")\ndef about():\n    return \"Біз туралы\"\n\nprint(handle(\"/post/2026/mini-flask\"))",
    "out": "mini-flask (2026)"
   },
   {
    "n": "handle: параметрсіз маршрут және 404",
    "in": [],
    "append": "ROUTES.clear()\n\n\n@route(\"/user/<name>\")\ndef user(name):\n    return f\"Сәлем, {name}!\"\n\n\n@route(\"/post/<year>/<slug>\")\ndef post(year, slug):\n    return f\"{slug} ({year})\"\n\n\n@route(\"/about\")\ndef about():\n    return \"Біз туралы\"\n\nprint(handle(\"/about\"))\nprint(handle(\"/user\"))\nprint(handle(\"/zzz/1/2/3\"))",
    "out": "Біз туралы\n404 Not Found\n404 Not Found"
   }
  ]
 },
 "py-pj1-render": {
  "title": "Жоба 1: шаблон",
  "file": "app.py",
  "starter": "# app.py - 3-қадам: шаблон\nimport html\nimport re\n\n\ndef render(template, **context):\n    \"\"\"Шаблондағы {{ аты }} белгілерін context мәндерімен ауыстырады.\"\"\"\n    # TODO: re.sub арқылы {{ аты }} өрнегін табыңыз (жақшалар ішіндегі бос орын болса да, болмаса да)\n    # TODO: мәнді str(...) қылып, html.escape арқылы қорғаңыз (XSS-ке жол бермеңіз!)\n    # TODO: context-те жоқ айнымалы болса, бос жол қойыңыз (қате шығармаңыз)\n    ...\n",
  "tests": [
   {
    "n": "Бір айнымалы",
    "in": [],
    "append": "print(render(\"Сәлем, {{ name }}!\", name=\"Аружан\"))",
    "out": "Сәлем, Аружан!"
   },
   {
    "n": "Бос орынсыз {{name}} және артық бос орын {{   name   }}",
    "in": [],
    "append": "print(render(\"{{name}} | {{   name   }}\", name=\"Нұр\"))",
    "out": "Нұр | Нұр"
   },
   {
    "n": "Бірнеше айнымалы",
    "in": [],
    "append": "print(render(\"<h1>{{ title }}</h1><p>{{ text }}</p>\", title=\"Тақырып\", text=\"Мәтін\"))",
    "out": "<h1>Тақырып</h1><p>Мәтін</p>"
   },
   {
    "n": "Бір айнымалы қайталанады",
    "in": [],
    "append": "print(render(\"{{ x }}{{ x }}{{ x }}\", x=\"ha\"))",
    "out": "hahaha"
   },
   {
    "n": "Сан мәні жолға айналады",
    "in": [],
    "append": "print(render(\"Жасы: {{ age }}\", age=17))",
    "out": "Жасы: 17"
   },
   {
    "n": "Белгісіз айнымалы бос жолға ауысады",
    "in": [],
    "append": "print(repr(render(\"Сәлем, {{ name }}!\")))",
    "out": "'Сәлем, !'"
   },
   {
    "n": "Қауіпсіздік: <script> HTML-ге айналмайды",
    "in": [],
    "append": "print(render(\"<p>{{ c }}</p>\", c=\"<script>alert(1)</script>\"))",
    "out": "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>"
   },
   {
    "n": "Қауіпсіздік: тырнақша мен & таңбасы",
    "in": [],
    "append": "print(render(\"{{ c }}\", c='\"Тау\" & <Көл>'))",
    "out": "&quot;Тау&quot; &amp; &lt;Көл&gt;"
   },
   {
    "n": "Шаблонда айнымалы жоқ: өзгеріссіз",
    "in": [],
    "append": "print(render(\"Жай мәтін\"))",
    "out": "Жай мәтін"
   }
  ]
 },
 "py-pj1-loop": {
  "title": "Жоба 1: шаблондағы цикл және толық қосымша",
  "file": "app.py",
  "starter": "# app.py - 4-қадам: шаблонға цикл қосамыз ({% for x in xs %} ... {% endfor %})\nimport html\nimport re\n\nROUTES = {}\nLOOP = re.compile(r\"\\{%\\s*for\\s+(\\w+)\\s+in\\s+(\\w+)\\s*%\\}(.*?)\\{%\\s*endfor\\s*%\\}\", re.S)\n\n\ndef route(path):\n    def register(func):\n        ROUTES[path] = func\n        return func\n    return register\n\n\ndef match(pattern, path):\n    p = pattern.strip(\"/\").split(\"/\")\n    q = path.strip(\"/\").split(\"/\")\n    if len(p) != len(q):\n        return None\n    params = {}\n    for a, b in zip(p, q):\n        if a.startswith(\"<\") and a.endswith(\">\"):\n            params[a[1:-1]] = b\n        elif a != b:\n            return None\n    return params\n\n\ndef handle(path):\n    for pattern, func in ROUTES.items():\n        params = match(pattern, path)\n        if params is not None:\n            return func(**params)\n    return \"404 Not Found\"\n\n\ndef fill(text, context):\n    \"\"\"3-қадамдағы render осыған айналды: тек {{ аты }} ауыстырады.\"\"\"\n    def sub(m):\n        return html.escape(str(context.get(m.group(1), \"\")))\n    return re.sub(r\"\\{\\{\\s*(\\w+)\\s*\\}\\}\", sub, text)\n\n\ndef render(template, **context):\n    \"\"\"{% for %} блоктарын ашып, қалған жерді fill арқылы толтырады.\"\"\"\n    # TODO: шаблонды LOOP.finditer(template) арқылы аралаңыз; блоктан бұрынғы мәтінді fill-мен толтырып жинаңыз\n    # TODO: әр блок үшін context[тізім_аты] элементтерін аралап, дене мәтінін fill-мен толтырыңыз\n    #       (цикл айнымалысы мен сыртқы айнымалылар бірге: {**context, айнымалы: элемент})\n    # TODO: тізім жоқ не бос болса, блок ештеңе бермейді\n    # TODO: соңғы блоктан кейінгі мәтінді де ұмытпаңыз; бәрін біріктіріп қайтарыңыз\n    ...\n",
  "tests": [
   {
    "n": "for: екі элемент",
    "in": [],
    "append": "print(render(\"<ul>{% for x in items %}<li>{{ x }}</li>{% endfor %}</ul>\", items=[\"a\", \"b\"]))",
    "out": "<ul><li>a</li><li>b</li></ul>"
   },
   {
    "n": "for: бос тізім ештеңе шығармайды",
    "in": [],
    "append": "print(render(\"<ul>{% for x in items %}<li>{{ x }}</li>{% endfor %}</ul>\", items=[]))",
    "out": "<ul></ul>"
   },
   {
    "n": "for: тізім берілмесе де қате жоқ",
    "in": [],
    "append": "print(render(\"<ul>{% for x in items %}<li>{{ x }}</li>{% endfor %}</ul>\"))",
    "out": "<ul></ul>"
   },
   {
    "n": "Цикл ішінде сыртқы айнымалы да көрінеді",
    "in": [],
    "append": "print(render(\"{% for x in xs %}{{ x }}-{{ tag }} {% endfor %}\", xs=[1, 2, 3], tag=\"k\"))",
    "out": "1-k 2-k 3-k"
   },
   {
    "n": "Циклдің сыртындағы мәтін және айнымалылар сақталады",
    "in": [],
    "append": "print(render(\"{{ title }}: {% for x in xs %}[{{ x }}]{% endfor %}!\", title=\"Тізім\", xs=[\"а\", \"ә\"]))",
    "out": "Тізім: [а][ә]!"
   },
   {
    "n": "Екі цикл бір шаблонда",
    "in": [],
    "append": "print(render(\"{% for a in xs %}{{ a }}{% endfor %}|{% for b in ys %}{{ b }}{% endfor %}\", xs=[1, 2], ys=[\"x\", \"y\"]))",
    "out": "12|xy"
   },
   {
    "n": "Бос орынсыз жазылған {%for x in xs%}",
    "in": [],
    "append": "print(render(\"{%for x in xs%}<{{x}}>{%endfor%}\", xs=[1, 2]))",
    "out": "<1><2>"
   },
   {
    "n": "Көп жолды цикл денесі",
    "in": [],
    "append": "print(render(\"{% for x in xs %}\\n- {{ x }}\\n{% endfor %}\", xs=[\"бір\", \"екі\"]))",
    "out": "\n- бір\n\n- екі"
   },
   {
    "n": "Қауіпсіздік: цикл элементі HTML-ден қорғалады",
    "in": [],
    "append": "print(render(\"{% for x in xs %}{{ x }};{% endfor %}\", xs=[\"<b>\", \"a&b\"]))",
    "out": "&lt;b&gt;;a&amp;b;"
   },
   {
    "n": "Қауіпсіздік: деректегі {{ secret }} шаблон ретінде орындалмайды",
    "in": [],
    "append": "print(render(\"{% for x in xs %}{{ x }}{% endfor %}\", xs=[\"{{ secret }}\"], secret=\"ПАРОЛЬ\"))",
    "out": "{{ secret }}"
   },
   {
    "n": "Бүкіл қосымша: route + render + handle",
    "in": [],
    "append": "ROUTES.clear()\nPAGE = \"<h1>{{ name }}</h1><ul>{% for l in langs %}<li>{{ l }}</li>{% endfor %}</ul>\"\n\n\n@route(\"/user/<name>\")\ndef user(name):\n    return render(PAGE, name=name, langs=[\"Python\", \"JavaScript\", \"SQL\"])\n\n\nprint(handle(\"/user/Aigerim\"))\nprint(handle(\"/user/<b>Nur\"))\nprint(handle(\"/nope\"))",
    "out": "<h1>Aigerim</h1><ul><li>Python</li><li>JavaScript</li><li>SQL</li></ul>\n<h1>&lt;b&gt;Nur</h1><ul><li>Python</li><li>JavaScript</li><li>SQL</li></ul>\n404 Not Found"
   }
  ]
 }
});
