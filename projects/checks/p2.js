// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-pj2-tag": {
  "title": "Жоба 2: HTML тегін жасау",
  "file": "site.py",
  "starter": "# site.py - сайт генераторы, 1-қадам: HTML тегін жасайтын көмекші\nimport html\n\nVOID = {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}   # жабылмайтын тегтер\n\n\ndef tag(element, inner=\"\", **attrs):\n    \"\"\"tag(\"a\", \"Сілтеме\", href=\"/x\") -> '<a href=\"/x\">Сілтеме</a>'\"\"\"\n    # TODO: attrs сөздігін аралап, әр атрибутты ' аты=\"мәні\"' түрінде жинаңыз\n    # TODO: аты \"class_\" болса \"class\" болсын (Python-да class - тыйым салынған сөз); \"data_id\" -> \"data-id\"\n    # TODO: мәнді html.escape(str(мән), quote=True) арқылы қорғаңыз (тырнақша бұзбасын)\n    # TODO: ашатын тегті жасаңыз: <element атрибуттар>\n    # TODO: element VOID ішінде болса, тек ашатын тегті қайтарыңыз (br, img, meta)\n    # TODO: әйтпесе ашатын тег + inner (ішкі мазмұн) + жабатын тег </element>\n    ...\n",
  "tests": [
   {
    "n": "Қарапайым тег",
    "in": [],
    "append": "print(tag(\"p\", \"Сәлем\"))",
    "out": "<p>Сәлем</p>"
   },
   {
    "n": "Атрибутты тег",
    "in": [],
    "append": "print(tag(\"a\", \"Сілтеме\", href=\"https://example.kz\"))",
    "out": "<a href=\"https://example.kz\">Сілтеме</a>"
   },
   {
    "n": "class_ -> class, атрибуттар ретімен",
    "in": [],
    "append": "print(tag(\"div\", \"x\", class_=\"card\", id=\"a1\"))",
    "out": "<div class=\"card\" id=\"a1\">x</div>"
   },
   {
    "n": "data_id -> data-id",
    "in": [],
    "append": "print(tag(\"li\", \"x\", data_id=7))",
    "out": "<li data-id=\"7\">x</li>"
   },
   {
    "n": "Жабылмайтын тег: <br>",
    "in": [],
    "append": "print(tag(\"br\"))",
    "out": "<br>"
   },
   {
    "n": "Жабылмайтын тег атрибутпен: <img>",
    "in": [],
    "append": "print(tag(\"img\", src=\"a.png\", alt=\"Сурет\"))",
    "out": "<img src=\"a.png\" alt=\"Сурет\">"
   },
   {
    "n": "Мәндегі тырнақша қорғалады",
    "in": [],
    "append": "print(tag(\"a\", \"x\", href='a\"b&c'))",
    "out": "<a href=\"a&quot;b&amp;c\">x</a>"
   },
   {
    "n": "Атрибуттың аты content болуы мүмкін: <meta>",
    "in": [],
    "append": "print(tag(\"meta\", name=\"viewport\", content=\"width=device-width\"))",
    "out": "<meta name=\"viewport\" content=\"width=device-width\">"
   },
   {
    "n": "Бос мазмұн: <li></li>",
    "in": [],
    "append": "print(tag(\"li\"))",
    "out": "<li></li>"
   },
   {
    "n": "Ішке салынған тегтер",
    "in": [],
    "append": "print(tag(\"ul\", tag(\"li\", \"1\") + tag(\"li\", \"2\")))",
    "out": "<ul><li>1</li><li>2</li></ul>"
   }
  ]
 },
 "py-pj2-body": {
  "title": "Жоба 2: беттің мазмұны",
  "file": "site.py",
  "starter": "import html\n\nVOID = {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}\n\n\ndef tag(element, inner=\"\", **attrs):\n    parts = []\n    for key, value in attrs.items():\n        key = key.rstrip(\"_\").replace(\"_\", \"-\")\n        parts.append(f' {key}=\"{html.escape(str(value), quote=True)}\"')\n    opening = f\"<{element}{''.join(parts)}>\"\n    if element in VOID:\n        return opening\n    return f\"{opening}{inner}</{element}>\"\n\n\ndef build_body(profile):\n    \"\"\"profile сөздігінен беттің <body> мазмұнын жасайды.\n    Құрылым:\n      <header><h1>аты</h1><p class=\"role\">рөлі</p></header>\n      <main>\n        <h2>Дағдылар</h2><ul class=\"skills\"><li>...</li></ul>\n        <h2>Жобалар</h2>\n        <section class=\"cards\">\n          <article class=\"card\"><h3><a href=\"url\">атауы</a></h3><p>мәтіні</p></article> ...\n        </section>\n      </main>\n    Адам енгізген мәтіндердің бәрі html.escape арқылы қорғалсын.\"\"\"\n    # TODO: header жасаңыз (tag көмегімен)\n    # TODO: дағдылар тізімі: әр дағды үшін <li>\n    # TODO: әр жоба үшін <article class=\"card\">; сілтеменің href мәнін tag өзі қорғайды\n    # TODO: <main> ішіне жинап, header + main қайтарыңыз\n    ...\n",
  "tests": [
   {
    "n": "<h1> ішінде аты",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\np = scan(build_body(profile))\nprint(p.text[\"h1\"])",
    "out": "['Аружан Сәрсенбай']"
   },
   {
    "n": "Рөлі <p class=\"role\"> ішінде",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\np = scan(build_body(profile))\nprint([a for t, a in p.attrs if t == \"p\" and a.get(\"class\") == \"role\"], p.text[\"p\"][0])",
    "out": "[{'class': 'role'}] Жас веб-әзірлеуші"
   },
   {
    "n": "Әр дағды үшін <li>",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\np = scan(build_body(profile))\nprint(p.tags.count(\"li\"), p.text[\"li\"])",
    "out": "3 ['Python', 'HTML', 'CSS']"
   },
   {
    "n": "Әр жоба үшін <article class=card>",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\np = scan(build_body(profile))\nprint([a for t, a in p.attrs if t == \"article\"])",
    "out": "[{'class': 'card'}, {'class': 'card'}]"
   },
   {
    "n": "Жоба сілтемелері дұрыс (& таңбасымен де)",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\np = scan(build_body(profile))\nprint([a[\"href\"] for t, a in p.attrs if t == \"a\"])",
    "out": "['https://example.kz/flask?a=1&b=2', 'https://example.kz/ai']"
   },
   {
    "n": "Жоба атаулары <h3> ішінде",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\np = scan(build_body(profile))\nprint(p.tags.count(\"h3\"), p.text[\"a\"])",
    "out": "2 ['Мини-Flask', 'Классификатор']"
   },
   {
    "n": "Тегтер дұрыс жабылған",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\np = scan(build_body(profile))\nprint(p.errors, p.stack)",
    "out": "[] []"
   },
   {
    "n": "Қауіпсіздік: аты мен дағдыдағы тегтер орындалмайды",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\nout = build_body(evil)\nprint(\"<script>\" in out, \"<b>\" in out)\nprint(scan(out).text[\"h1\"])",
    "out": "False False\n['<script>alert(1)</script>']"
   },
   {
    "n": "Жобалар жоқ болса, <article> жоқ",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\np = scan(build_body(dict(profile, projects=[])))\nprint(p.tags.count(\"article\"), p.errors)",
    "out": "0 []"
   }
  ]
 },
 "py-pj2-css": {
  "title": "Жоба 2: CSS генераторы",
  "file": "site.py",
  "starter": "# site.py - 3-қадам: CSS генераторы\nBASE_CSS = \"\"\"* { box-sizing: border-box; }\nbody { margin: 0; font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }\nheader { padding: 3rem 1.5rem; background: var(--accent); color: #fff; text-align: center; }\nheader h1 { margin: 0; font-size: 2.2rem; }\n.role { margin: .4rem 0 0; opacity: .9; }\nmain { max-width: 760px; margin: 0 auto; padding: 1.5rem; }\n.skills { display: flex; flex-wrap: wrap; gap: .5rem; padding: 0; list-style: none; }\n.skills li { padding: .25rem .8rem; border-radius: 999px; border: 2px solid var(--accent); }\n.cards { display: grid; gap: 1rem; }\n.card { padding: 1rem 1.25rem; border-radius: 12px; background: #fff; box-shadow: 0 2px 8px rgb(0 0 0 / .08); }\n.card h3 { margin: 0 0 .3rem; }\n.card a { color: var(--accent); }\n\"\"\"\n\n\ndef rule(selector, props):\n    \"\"\"rule(\"h1\", {\"font_size\": \"2rem\"}) ->\n    h1 {\n      font-size: 2rem;\n    }\n    (әр қасиет жаңа жолда, 2 бос орын шегініспен, соңында нүктелі үтір; жол сонында \\n)\"\"\"\n    # TODO: әр (аты, мәні) үшін \"  аты: мәні;\\n\" жолын жасаңыз; аттағы \"_\" таңбасы \"-\" болсын\n    # TODO: selector + \" {\\n\" + қасиеттер + \"}\\n\" қайтарыңыз\n    ...\n\n\ndef make_css(theme, base=\"\"):\n    \"\"\"theme = {\"accent\": \"#0a7c6e\"} -> ':root' ішінде --accent: #0a7c6e; айнымалысын жасап, соңына base қосады.\"\"\"\n    # TODO: rule(\":root\", ...) шақырыңыз: әр кілт \"--\" префиксімен (--accent) айнымалы атына айналсын\n    # TODO: нәтижеге base жолын қосып қайтарыңыз\n    ...\n",
  "tests": [
   {
    "n": "rule: бір қасиет",
    "in": [],
    "append": "print(repr(rule(\"h1\", {\"color\": \"red\"})))",
    "out": "'h1 {\\n  color: red;\\n}\\n'"
   },
   {
    "n": "rule: бірнеше қасиет, _ -> -",
    "in": [],
    "append": "print(repr(rule(\".card\", {\"border_radius\": \"12px\", \"padding\": \"1rem\"})))",
    "out": "'.card {\\n  border-radius: 12px;\\n  padding: 1rem;\\n}\\n'"
   },
   {
    "n": "rule: қасиет жоқ",
    "in": [],
    "append": "print(repr(rule(\"p\", {})))",
    "out": "'p {\\n}\\n'"
   },
   {
    "n": "make_css: :root айнымалылары",
    "in": [],
    "append": "print(repr(make_css({\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\"})))",
    "out": "':root {\\n  --accent: #0a7c6e;\\n  --bg: #f4f1ea;\\n}\\n'"
   },
   {
    "n": "make_css: base соңына қосылады",
    "in": [],
    "append": "print(repr(make_css({\"accent\": \"#123\"}, \"body { color: var(--accent); }\\n\")))",
    "out": "':root {\\n  --accent: #123;\\n}\\nbody { color: var(--accent); }\\n'"
   },
   {
    "n": "make_css: кілттегі _ -> - (bg_soft -> --bg-soft)",
    "in": [],
    "append": "print(repr(make_css({\"bg_soft\": \"#eee\"})))",
    "out": "':root {\\n  --bg-soft: #eee;\\n}\\n'"
   },
   {
    "n": "make_css: бос тақырып",
    "in": [],
    "append": "print(repr(make_css({}, \"\")))",
    "out": "':root {\\n}\\n'"
   },
   {
    "n": "BASE_CSS-пен жұмыс",
    "in": [],
    "append": "css = make_css({\"accent\": \"#0a7c6e\", \"bg\": \"#fff\", \"text\": \"#000\"}, BASE_CSS)\nprint(css.startswith(\":root {\\n  --accent: #0a7c6e;\"), \"var(--accent)\" in css, css.count(\"{\") == css.count(\"}\"))",
    "out": "True True True"
   }
  ]
 },
 "py-pj2-page": {
  "title": "Жоба 2: толық сайт",
  "file": "site.py",
  "starter": "# site.py - 4-қадам: бәрін біріктіреміз\nimport html\n\nVOID = {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}\n\n\ndef tag(element, inner=\"\", **attrs):\n    parts = []\n    for key, value in attrs.items():\n        key = key.rstrip(\"_\").replace(\"_\", \"-\")\n        parts.append(f' {key}=\"{html.escape(str(value), quote=True)}\"')\n    opening = f\"<{element}{''.join(parts)}>\"\n    if element in VOID:\n        return opening\n    return f\"{opening}{inner}</{element}>\"\n\n\ndef build_body(profile):\n    name = html.escape(profile[\"name\"])\n    header = tag(\"header\", tag(\"h1\", name) + tag(\"p\", html.escape(profile[\"role\"]), class_=\"role\"))\n    skills = \"\".join(tag(\"li\", html.escape(s)) for s in profile[\"skills\"])\n    cards = \"\"\n    for p in profile[\"projects\"]:\n        link = tag(\"a\", html.escape(p[\"title\"]), href=p[\"url\"])\n        cards += tag(\"article\", tag(\"h3\", link) + tag(\"p\", html.escape(p[\"text\"])), class_=\"card\")\n    main = tag(\"main\", tag(\"h2\", \"Дағдылар\") + tag(\"ul\", skills, class_=\"skills\")\n               + tag(\"h2\", \"Жобалар\") + tag(\"section\", cards, class_=\"cards\"))\n    return header + main\n\n\nBASE_CSS = \"\"\"* { box-sizing: border-box; }\nbody { margin: 0; font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }\nheader { padding: 3rem 1.5rem; background: var(--accent); color: #fff; text-align: center; }\nheader h1 { margin: 0; font-size: 2.2rem; }\n.role { margin: .4rem 0 0; opacity: .9; }\nmain { max-width: 760px; margin: 0 auto; padding: 1.5rem; }\n.skills { display: flex; flex-wrap: wrap; gap: .5rem; padding: 0; list-style: none; }\n.skills li { padding: .25rem .8rem; border-radius: 999px; border: 2px solid var(--accent); }\n.cards { display: grid; gap: 1rem; }\n.card { padding: 1rem 1.25rem; border-radius: 12px; background: #fff; box-shadow: 0 2px 8px rgb(0 0 0 / .08); }\n.card h3 { margin: 0 0 .3rem; }\n.card a { color: var(--accent); }\n\"\"\"\n\n\ndef rule(selector, props):\n    lines = \"\".join(f\"  {name.replace('_', '-')}: {value};\\n\" for name, value in props.items())\n    return f\"{selector} {{\\n{lines}}}\\n\"\n\n\ndef make_css(theme, base=\"\"):\n    return rule(\":root\", {f\"--{key}\": value for key, value in theme.items()}) + base\n\n\ndef page(title, body, css):\n    \"\"\"Толық HTML құжат жасайды.\"\"\"\n    # TODO: \"<!DOCTYPE html>\\n\" жолымен бастаңыз\n    # TODO: <html lang=\"kk\"> ішінде <head> және <body>\n    # TODO: <head>: <meta charset=\"utf-8\">, viewport meta (name=\"viewport\", content=\"width=device-width, initial-scale=1\"),\n    #       <title> (title html.escape-пен), <style> (ішінде css)\n    # TODO: <body> ішіне body қойыңыз; соңында \"\\n\"\n    ...\n\n\ndef generate(profile, theme):\n    \"\"\"profile мен theme-ден дайын сайттың HTML жолын жасайды (BASE_CSS-ті қолданыңыз).\"\"\"\n    # TODO: page(атау, build_body(...), make_css(..., BASE_CSS)) шақырыңыз\n    ...\n\n\ndef save(path, text):\n    \"\"\"Мәтінді UTF-8 файлға жазып, path қайтарады.\"\"\"\n    # TODO: open(path, \"w\", encoding=\"utf-8\") арқылы жазыңыз\n    ...\n",
  "tests": [
   {
    "n": "page: құжат <!DOCTYPE html> жолымен басталады",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\nout = page(\"Тақырып\", \"<p>Сынақ</p>\", \"p { color: red; }\")\nprint(repr(out[:16]))",
    "out": "'<!DOCTYPE html>\\n'"
   },
   {
    "n": "page: тегтер ретімен (html, head, meta, meta, title, style, body)",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\np = scan(page(\"Т\", \"<p>Сынақ</p>\", \"p { color: red; }\"))\nprint(p.tags)",
    "out": "['html', 'head', 'meta', 'meta', 'title', 'style', 'body', 'p']"
   },
   {
    "n": "page: <html lang=kk> және meta charset",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\np = scan(page(\"Т\", \"<p>x</p>\", \"\"))\nprint([a for t, a in p.attrs if t in (\"html\", \"meta\")])",
    "out": "[{'lang': 'kk'}, {'charset': 'utf-8'}, {'name': 'viewport', 'content': 'width=device-width, initial-scale=1'}]"
   },
   {
    "n": "page: title мәтіні және <style> ішіндегі CSS",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\np = scan(page(\"Менің сайтым\", \"<p>x</p>\", \"p { color: red; }\"))\nprint(p.text[\"title\"], p.text[\"style\"])",
    "out": "['Менің сайтым'] ['p { color: red; }']"
   },
   {
    "n": "page: title қорғалады",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\np = scan(page(\"<b>Т</b>\", \"<p>x</p>\", \"\"))\nprint(p.text[\"title\"], p.errors)",
    "out": "['<b>Т</b>'] []"
   },
   {
    "n": "generate: тақырып = профиль аты",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\np = scan(generate(profile, theme))\nprint(p.text[\"title\"], p.text[\"h1\"])",
    "out": "['Аружан Сәрсенбай'] ['Аружан Сәрсенбай']"
   },
   {
    "n": "generate: тақырып айнымалылары <style> ішінде",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\np = scan(generate(profile, theme))\nsty = p.text[\"style\"][0]\nprint(\"--accent: #0a7c6e;\" in sty, \"var(--accent)\" in sty)",
    "out": "True True"
   },
   {
    "n": "generate: тегтер дұрыс жабылған, 2 карточка",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\np = scan(generate(profile, theme))\nprint(p.errors, p.stack, p.tags.count(\"article\"), p.tags.count(\"li\"))",
    "out": "[] [] 2 3"
   },
   {
    "n": "generate: қауіпсіздік",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\nout = generate(evil, theme)\nprint(\"<script>\" in out, out.count(\"</html>\"))",
    "out": "False 1"
   },
   {
    "n": "save: файлға UTF-8 жазады және path қайтарады",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\nprint(save(\"site.html\", \"<p>Қазақша: ә ғ ү</p>\"))\nprint(open(\"site.html\", encoding=\"utf-8\").read())",
    "out": "site.html\n<p>Қазақша: ә ғ ү</p>"
   },
   {
    "n": "Бүкіл сайтты файлға сақтау",
    "in": [],
    "append": "\nfrom html.parser import HTMLParser\n\nclass Scan(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.stack, self.tags, self.attrs, self.text, self.errors = [], [], [], {}, []\n    def handle_starttag(self, name, attrs):\n        self.tags.append(name)\n        self.attrs.append((name, dict(attrs)))\n        if name not in {\"br\", \"hr\", \"img\", \"meta\", \"input\", \"link\"}:\n            self.stack.append(name)\n    def handle_endtag(self, name):\n        if self.stack and self.stack[-1] == name:\n            self.stack.pop()\n        else:\n            self.errors.append(name)\n    def handle_data(self, data):\n        if self.stack and data.strip():\n            self.text.setdefault(self.stack[-1], []).append(data.strip())\n\ndef scan(s):\n    p = Scan()\n    p.feed(s)\n    p.close()\n    return p\n\nprofile = {\n    \"name\": \"Аружан Сәрсенбай\",\n    \"role\": \"Жас веб-әзірлеуші\",\n    \"skills\": [\"Python\", \"HTML\", \"CSS\"],\n    \"projects\": [\n        {\"title\": \"Мини-Flask\", \"text\": \"Өз маршрутизаторым\", \"url\": \"https://example.kz/flask?a=1&b=2\"},\n        {\"title\": \"Классификатор\", \"text\": \"Пікірлерді талдайды\", \"url\": \"https://example.kz/ai\"},\n    ],\n}\ntheme = {\"accent\": \"#0a7c6e\", \"bg\": \"#f4f1ea\", \"text\": \"#14213d\"}\nevil = dict(profile, name=\"<script>alert(1)</script>\", skills=[\"<b>x</b>\"])\npath = save(\"my.html\", generate(profile, theme))\nprint(path, open(path, encoding=\"utf-8\").read().startswith(\"<!DOCTYPE html>\"))",
    "out": "my.html True"
   }
  ]
 }
});
