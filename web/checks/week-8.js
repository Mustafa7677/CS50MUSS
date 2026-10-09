// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-passwd": {
  "title": "Парольді хэштеу және тексеру (сайттың өз жаттығуы)",
  "file": "passwd.py",
  "starter": "import hashlib\n\n\ndef hash_password(password, salt):\n    # TODO: salt + password жолының SHA-256 хэшін 16-лық жол (hexdigest) ретінде қайтарыңыз\n    ...\n\n\ndef verify(password, salt, stored):\n    # TODO: енгізілген парольді хэштеп, сақталған хэшпен салыстырыңыз (True/False)\n    ...\n",
  "tests": [
   {
    "n": "hash_password('qwerty', 'a1') - нақты хэш",
    "in": [],
    "append": "print(hash_password('qwerty', 'a1'))",
    "out": "63c8840c6a7f80615936fb0081bd6e1f5d0f6b123f345adf9b883e1d0fde09a9"
   },
   {
    "n": "хэш ұзындығы 64 символ",
    "in": [],
    "append": "print(len(hash_password('x', 'y')))",
    "out": "64"
   },
   {
    "n": "тұз (salt) хэшке әсер етеді",
    "in": [],
    "append": "print(hash_password('qwerty', 's1') != hash_password('qwerty', 's2'))",
    "out": "True"
   },
   {
    "n": "бірдей кіріс - бірдей хэш",
    "in": [],
    "append": "print(hash_password('abc', 'z') == hash_password('abc', 'z'))",
    "out": "True"
   },
   {
    "n": "verify: дұрыс пароль",
    "in": [],
    "append": "h = hash_password('Almaty2024', 'k9')\nprint(verify('Almaty2024', 'k9', h))",
    "out": "True"
   },
   {
    "n": "verify: қате пароль",
    "in": [],
    "append": "h = hash_password('Almaty2024', 'k9')\nprint(verify('almaty2024', 'k9', h))",
    "out": "False"
   },
   {
    "n": "verify: басқа тұзбен",
    "in": [],
    "append": "h = hash_password('pw', 'one')\nprint(verify('pw', 'two', h))",
    "out": "False"
   },
   {
    "n": "verify: Қазақша пароль",
    "in": [],
    "append": "h = hash_password('Қазақстан', 'q')\nprint(verify('Қазақстан', 'q', h))",
    "out": "True"
   }
  ],
  "note": "Функциялардың аттары hash_password және verify болсын; нәтижені print емес, return арқылы қайтарыңыз."
 },
 "py-escape": {
  "title": "escape_html: XSS-тен қорғану (сайттың өз жаттығуы)",
  "file": "escape.py",
  "starter": "def escape_html(text):\n    # TODO: & < > \" ' таңбаларын HTML-мнемоникаларына ауыстырыңыз:\n    # & -> &amp;   < -> &lt;   > -> &gt;   \" -> &quot;   ' -> &#x27;\n    # Назар аударыңыз: & таңбасын БІРІНШІ ауыстыру керек\n    ...\n",
  "tests": [
   {
    "n": "қарапайым мәтін өзгермейді",
    "in": [],
    "append": "print(escape_html('Hello, Almaty'))",
    "out": "Hello, Almaty"
   },
   {
    "n": "<script> белгілері",
    "in": [],
    "append": "print(escape_html('<script>alert(1)</script>'))",
    "out": "&lt;script&gt;alert(1)&lt;/script&gt;"
   },
   {
    "n": "тырнақшалар",
    "in": [],
    "append": "print(escape_html('say \"hi\" and it\\'s ok'))",
    "out": "say &quot;hi&quot; and it&#x27;s ok"
   },
   {
    "n": "& таңбасы",
    "in": [],
    "append": "print(escape_html('Tom & Jerry'))",
    "out": "Tom &amp; Jerry"
   },
   {
    "n": "& екі рет ауыспауы керек (&lt; -> &amp;lt;)",
    "in": [],
    "append": "print(escape_html('<b>&</b>'))",
    "out": "&lt;b&gt;&amp;&lt;/b&gt;"
   },
   {
    "n": "атрибутқа шабуыл",
    "in": [],
    "append": "print(escape_html('\" onmouseover=\"x()'))",
    "out": "&quot; onmouseover=&quot;x()"
   },
   {
    "n": "бос жол",
    "in": [],
    "append": "print(repr(escape_html('')))",
    "out": "''"
   }
  ],
  "note": "Жаңа жолды return арқылы қайтарыңыз. Ескерту: бұл оқу жаттығуы, нағыз жобада Django шаблоны мұны өзі істейді."
 }
});
