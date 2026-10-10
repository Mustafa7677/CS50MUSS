// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-test-twttr": {
  "title": "Testing my twttr",
  "file": "test_twttr.py",
  "starter": "from twttr import shorten\n\n\ndef test_twttr():\n    # TODO: assert арқылы дұрыс жағдайларды тексеріңіз\n    # TODO: шекаралық жағдайларды да ұмытпаңыз\n    ...\n",
  "tests": [
   {
    "n": "Дұрыс twttr.py: барлық тестіңіз өтуі керек",
    "in": [],
    "files": {
     "twttr.py": "def main():\n    word = input(\"Input: \")\n    print(\"Output:\", shorten(word))\n\n\ndef shorten(word):\n    return \"\".join(c for c in word if c.lower() not in \"aeiou\")\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "out": "ok"
   },
   {
    "n": "Қате twttr.py (бас әріпті дауыстылар өшірілмейді): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "twttr.py": "def main():\n    word = input(\"Input: \")\n    print(\"Output:\", shorten(word))\n\n\ndef shorten(word):\n    return \"\".join(c for c in word if c not in \"aeiou\")\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате twttr.py (кіші әріпті дауыстылар өшірілмейді): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "twttr.py": "def main():\n    word = input(\"Input: \")\n    print(\"Output:\", shorten(word))\n\n\ndef shorten(word):\n    return \"\".join(c for c in word if c not in \"AEIOU\")\n\n\nif __name__ == \"__main__\":\n    main()\n\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате twttr.py (цифрларды да өшіреді): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "twttr.py": "def main():\n    word = input(\"Input: \")\n    print(\"Output:\", shorten(word))\n\n\ndef shorten(word):\n    return \"\".join(c for c in word if c.lower() not in \"aeiou0123456789\")\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате twttr.py (тыныс белгілерін де өшіреді): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "twttr.py": "def main():\n    word = input(\"Input: \")\n    print(\"Output:\", shorten(word))\n\n\ndef shorten(word):\n    return \"\".join(c for c in word if c.lower() not in \"aeiou\" and c not in \".,!?;:'\")\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате twttr.py (нәтижені бас әріппен қайтарады): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "twttr.py": "def main():\n    word = input(\"Input: \")\n    print(\"Output:\", shorten(word))\n\n\ndef shorten(word):\n    return \"\".join(c for c in word if c.lower() not in \"aeiou\").upper()\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   }
  ],
  "append": "_tests = [(_n, _f) for _n, _f in list(globals().items()) if _n.startswith(\"test_\") and callable(_f)]\n_failed = []\nfor _n, _f in _tests:\n    try:\n        _f()\n    except Exception as _e:\n        _failed.append(f\"{_n} ({type(_e).__name__})\")\nif _failed:\n    raise AssertionError(\"құлаған тесттер: \" + \", \".join(_failed))\nif len(_tests) < 1:\n    print(f\"test_ функциялары тым аз: {len(_tests)} (кемінде 1 керек)\")\nelse:\n    print(\"ok\")",
  "note": "Мұнда twttr.py емес, тест файлыңызды (test_twttr.py) қойыңыз. Тексеруші оны дұрыс twttr.py-мен, сосын әдейі қате жазылған бірнеше twttr.py-мен іске қосады: дұрысында барлық тестіңіз өтуі, ал әр қате нұсқада кемінде біреуі құлауы керек. test_ деп басталатын функцияларыңыздың бәрі шақырылады, тек кәдімгі assert қолданыңыз. Браузерде нағыз pytest жоқ: import pytest жұмыс істейді, бірақ одан тек «with pytest.raises(...)» бар."
 },
 "py-test-bank": {
  "title": "Back to the Bank",
  "file": "test_bank.py",
  "starter": "from bank import value\n\n\ndef test_bank():\n    # TODO: assert арқылы дұрыс жағдайларды тексеріңіз\n    # TODO: шекаралық жағдайларды да ұмытпаңыз\n    ...\n",
  "tests": [
   {
    "n": "Дұрыс bank.py: барлық тестіңіз өтуі керек",
    "in": [],
    "files": {
     "bank.py": "def main():\n    greeting = input(\"Greeting: \")\n    print(f\"${value(greeting)}\")\n\n\ndef value(greeting):\n    greeting = greeting.strip().lower()\n    if greeting.startswith(\"hello\"):\n        return 0\n    elif greeting.startswith(\"h\"):\n        return 20\n    else:\n        return 100\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "out": "ok"
   },
   {
    "n": "Қате bank.py (мәндер ауысып кеткен): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "bank.py": "def main():\n    greeting = input(\"Greeting: \")\n    print(f\"${value(greeting)}\")\n\n\ndef value(greeting):\n    greeting = greeting.strip().lower()\n    if greeting.startswith(\"hello\"):\n        return 100\n    elif greeting.startswith(\"h\"):\n        return 20\n    else:\n        return 0\n\n\nif __name__ == \"__main__\":\n    main()\n\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате bank.py (үлкен-кіші әріпті ажыратады): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "bank.py": "def main():\n    greeting = input(\"Greeting: \")\n    print(f\"${value(greeting)}\")\n\n\ndef value(greeting):\n    greeting = greeting.strip()\n    if greeting.startswith(\"hello\"):\n        return 0\n    elif greeting.startswith(\"h\"):\n        return 20\n    else:\n        return 100\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате bank.py (тек жалғыз «hello» сөзін таниды): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "bank.py": "def main():\n    greeting = input(\"Greeting: \")\n    print(f\"${value(greeting)}\")\n\n\ndef value(greeting):\n    greeting = greeting.strip().lower()\n    if greeting == \"hello\":\n        return 0\n    elif greeting.startswith(\"h\"):\n        return 20\n    else:\n        return 100\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате bank.py (h-ға $20 бермейді): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "bank.py": "def main():\n    greeting = input(\"Greeting: \")\n    print(f\"${value(greeting)}\")\n\n\ndef value(greeting):\n    greeting = greeting.strip().lower()\n    if greeting.startswith(\"hello\"):\n        return 0\n    elif greeting.startswith(\"h\"):\n        return 100 \n    else:\n        return 100\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   }
  ],
  "append": "_tests = [(_n, _f) for _n, _f in list(globals().items()) if _n.startswith(\"test_\") and callable(_f)]\n_failed = []\nfor _n, _f in _tests:\n    try:\n        _f()\n    except Exception as _e:\n        _failed.append(f\"{_n} ({type(_e).__name__})\")\nif _failed:\n    raise AssertionError(\"құлаған тесттер: \" + \", \".join(_failed))\nif len(_tests) < 3:\n    print(f\"test_ функциялары тым аз: {len(_tests)} (кемінде 3 керек)\")\nelse:\n    print(\"ok\")",
  "note": "Мұнда bank.py емес, тест файлыңызды (test_bank.py) қойыңыз. Тексеруші оны дұрыс bank.py-мен, сосын әдейі қате жазылған бірнеше bank.py-мен іске қосады: дұрысында барлық тестіңіз өтуі, ал әр қате нұсқада кемінде біреуі құлауы керек. test_ деп басталатын функцияларыңыздың бәрі шақырылады, тек кәдімгі assert қолданыңыз. Браузерде нағыз pytest жоқ: import pytest жұмыс істейді, бірақ одан тек «with pytest.raises(...)» бар."
 },
 "py-test-plates": {
  "title": "Re-requesting a Vanity Plate",
  "file": "test_plates.py",
  "starter": "from plates import is_valid\n\n\ndef test_plates():\n    # TODO: assert арқылы дұрыс жағдайларды тексеріңіз\n    # TODO: шекаралық жағдайларды да ұмытпаңыз\n    ...\n",
  "tests": [
   {
    "n": "Дұрыс plates.py: барлық тестіңіз өтуі керек",
    "in": [],
    "files": {
     "plates.py": "def main():\n    plate = input(\"Plate: \")\n    if is_valid(plate):\n        print(\"Valid\")\n    else:\n        print(\"Invalid\")\n\n\ndef is_valid(s):\n    if not 2 <= len(s) <= 6:\n        return False\n    if not s.isalnum():\n        return False\n    if not s[:2].isalpha():\n        return False\n    seen_digit = False\n    for c in s:\n        if c.isdigit():\n            if not seen_digit and c == \"0\":\n                return False\n            seen_digit = True\n        elif seen_digit:\n            return False\n    return True\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "out": "ok"
   },
   {
    "n": "Қате plates.py (ұзындықты тексермейді): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "plates.py": "def main():\n    plate = input(\"Plate: \")\n    if is_valid(plate):\n        print(\"Valid\")\n    else:\n        print(\"Invalid\")\n\n\ndef is_valid(s):\n    if not s.isalnum():\n        return False\n    if not s[:2].isalpha():\n        return False\n    seen_digit = False\n    for c in s:\n        if c.isdigit():\n            if not seen_digit and c == \"0\":\n                return False\n            seen_digit = True\n        elif seen_digit:\n            return False\n    return True\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате plates.py (алғашқы екі әріпті тексермейді): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "plates.py": "def main():\n    plate = input(\"Plate: \")\n    if is_valid(plate):\n        print(\"Valid\")\n    else:\n        print(\"Invalid\")\n\n\ndef is_valid(s):\n    if not 2 <= len(s) <= 6:\n        return False\n    if not s.isalnum():\n        return False\n    seen_digit = False\n    for c in s:\n        if c.isdigit():\n            if not seen_digit and c == \"0\":\n                return False\n            seen_digit = True\n        elif seen_digit:\n            return False\n    return True\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате plates.py (алғашқы цифр 0 болуын тексермейді): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "plates.py": "def main():\n    plate = input(\"Plate: \")\n    if is_valid(plate):\n        print(\"Valid\")\n    else:\n        print(\"Invalid\")\n\n\ndef is_valid(s):\n    if not 2 <= len(s) <= 6:\n        return False\n    if not s.isalnum():\n        return False\n    if not s[:2].isalpha():\n        return False\n    seen_digit = False\n    for c in s:\n        if c.isdigit():\n            if not seen_digit and c == \"\":\n                return False\n            seen_digit = True\n        elif seen_digit:\n            return False\n    return True\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате plates.py (цифрдан кейінгі әріпке рұқсат етеді): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "plates.py": "def main():\n    plate = input(\"Plate: \")\n    if is_valid(plate):\n        print(\"Valid\")\n    else:\n        print(\"Invalid\")\n\n\ndef is_valid(s):\n    if not 2 <= len(s) <= 6:\n        return False\n    if not s.isalnum():\n        return False\n    if not s[:2].isalpha():\n        return False\n    seen_digit = False\n    for c in s:\n        if c.isdigit():\n            if not seen_digit and c == \"0\":\n                return False\n            seen_digit = True\n    return True\n\n\nif __name__ == \"__main__\":\n    main()\n\n\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате plates.py (тыныс белгілері мен бос орынға рұқсат етеді): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "plates.py": "def main():\n    plate = input(\"Plate: \")\n    if is_valid(plate):\n        print(\"Valid\")\n    else:\n        print(\"Invalid\")\n\n\ndef is_valid(s):\n    if not 2 <= len(s) <= 6:\n        return False\n    if not s[:2].isalpha():\n        return False\n    seen_digit = False\n    for c in s:\n        if c.isdigit():\n            if not seen_digit and c == \"0\":\n                return False\n            seen_digit = True\n        elif seen_digit:\n            return False\n    return True\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   }
  ],
  "append": "_tests = [(_n, _f) for _n, _f in list(globals().items()) if _n.startswith(\"test_\") and callable(_f)]\n_failed = []\nfor _n, _f in _tests:\n    try:\n        _f()\n    except Exception as _e:\n        _failed.append(f\"{_n} ({type(_e).__name__})\")\nif _failed:\n    raise AssertionError(\"құлаған тесттер: \" + \", \".join(_failed))\nif len(_tests) < 4:\n    print(f\"test_ функциялары тым аз: {len(_tests)} (кемінде 4 керек)\")\nelse:\n    print(\"ok\")",
  "note": "Мұнда plates.py емес, тест файлыңызды (test_plates.py) қойыңыз. Тексеруші оны дұрыс plates.py-мен, сосын әдейі қате жазылған бірнеше plates.py-мен іске қосады: дұрысында барлық тестіңіз өтуі, ал әр қате нұсқада кемінде біреуі құлауы керек. test_ деп басталатын функцияларыңыздың бәрі шақырылады, тек кәдімгі assert қолданыңыз. Браузерде нағыз pytest жоқ: import pytest жұмыс істейді, бірақ одан тек «with pytest.raises(...)» бар."
 },
 "py-test-fuel": {
  "title": "Refueling",
  "file": "test_fuel.py",
  "starter": "from fuel import convert, gauge\n\n\ndef test_fuel():\n    # TODO: assert арқылы дұрыс жағдайларды тексеріңіз\n    # TODO: шекаралық жағдайларды да ұмытпаңыз\n    ...\n",
  "tests": [
   {
    "n": "Дұрыс fuel.py: барлық тестіңіз өтуі керек",
    "in": [],
    "files": {
     "fuel.py": "def main():\n    while True:\n        try:\n            percentage = convert(input(\"Fraction: \"))\n            break\n        except (ValueError, ZeroDivisionError):\n            pass\n    print(gauge(percentage))\n\n\ndef convert(fraction):\n    x, y = fraction.split(\"/\")\n    x, y = int(x), int(y)\n    if y == 0:\n        raise ZeroDivisionError\n    if x < 0 or y < 0 or x > y:\n        raise ValueError\n    return round(x / y * 100)\n\n\ndef gauge(percentage):\n    if percentage <= 1:\n        return \"E\"\n    elif percentage >= 99:\n        return \"F\"\n    else:\n        return f\"{percentage}%\"\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "out": "ok"
   },
   {
    "n": "Қате fuel.py (convert пайыз емес, бөлшек қайтарады): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "fuel.py": "def main():\n    while True:\n        try:\n            percentage = convert(input(\"Fraction: \"))\n            break\n        except (ValueError, ZeroDivisionError):\n            pass\n    print(gauge(percentage))\n\n\ndef convert(fraction):\n    x, y = fraction.split(\"/\")\n    x, y = int(x), int(y)\n    if y == 0:\n        raise ZeroDivisionError\n    if x < 0 or y < 0 or x > y:\n        raise ValueError\n    return round(x / y)\n\n\ndef gauge(percentage):\n    if percentage <= 1:\n        return \"E\"\n    elif percentage >= 99:\n        return \"F\"\n    else:\n        return f\"{percentage}%\"\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате fuel.py (convert int емес, str қайтарады): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "fuel.py": "def main():\n    while True:\n        try:\n            percentage = convert(input(\"Fraction: \"))\n            break\n        except (ValueError, ZeroDivisionError):\n            pass\n    print(gauge(percentage))\n\n\ndef convert(fraction):\n    x, y = fraction.split(\"/\")\n    x, y = int(x), int(y)\n    if y == 0:\n        raise ZeroDivisionError\n    if x < 0 or y < 0 or x > y:\n        raise ValueError\n    return str(round(x / y * 100))\n\n\ndef gauge(percentage):\n    if percentage <= 1:\n        return \"E\"\n    elif percentage >= 99:\n        return \"F\"\n    else:\n        return f\"{percentage}%\"\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате fuel.py (X > Y болғанда ValueError жоқ): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "fuel.py": "def main():\n    while True:\n        try:\n            percentage = convert(input(\"Fraction: \"))\n            break\n        except (ValueError, ZeroDivisionError):\n            pass\n    print(gauge(percentage))\n\n\ndef convert(fraction):\n    x, y = fraction.split(\"/\")\n    x, y = int(x), int(y)\n    if y == 0:\n        raise ZeroDivisionError\n    if x < 0 or y < 0:\n        raise ValueError\n    return round(x / y * 100)\n\n\ndef gauge(percentage):\n    if percentage <= 1:\n        return \"E\"\n    elif percentage >= 99:\n        return \"F\"\n    else:\n        return f\"{percentage}%\"\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате fuel.py (теріс бөлшекте ValueError жоқ): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "fuel.py": "def main():\n    while True:\n        try:\n            percentage = convert(input(\"Fraction: \"))\n            break\n        except (ValueError, ZeroDivisionError):\n            pass\n    print(gauge(percentage))\n\n\ndef convert(fraction):\n    x, y = fraction.split(\"/\")\n    x, y = int(x), int(y)\n    if y == 0:\n        raise ZeroDivisionError\n    if x > y:\n        raise ValueError\n    return round(x / y * 100)\n\n\ndef gauge(percentage):\n    if percentage <= 1:\n        return \"E\"\n    elif percentage >= 99:\n        return \"F\"\n    else:\n        return f\"{percentage}%\"\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате fuel.py (Y = 0 болғанда ZeroDivisionError жоқ): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "fuel.py": "def main():\n    while True:\n        try:\n            percentage = convert(input(\"Fraction: \"))\n            break\n        except (ValueError, ZeroDivisionError):\n            pass\n    print(gauge(percentage))\n\n\ndef convert(fraction):\n    x, y = fraction.split(\"/\")\n    x, y = int(x), int(y)\n    if y == 0 or x < 0 or y < 0 or x > y:\n        raise ValueError\n    return round(x / y * 100)\n\n\ndef gauge(percentage):\n    if percentage <= 1:\n        return \"E\"\n    elif percentage >= 99:\n        return \"F\"\n    else:\n        return f\"{percentage}%\"\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате fuel.py (gauge 1%-ды E демейді): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "fuel.py": "def main():\n    while True:\n        try:\n            percentage = convert(input(\"Fraction: \"))\n            break\n        except (ValueError, ZeroDivisionError):\n            pass\n    print(gauge(percentage))\n\n\ndef convert(fraction):\n    x, y = fraction.split(\"/\")\n    x, y = int(x), int(y)\n    if y == 0:\n        raise ZeroDivisionError\n    if x < 0 or y < 0 or x > y:\n        raise ValueError\n    return round(x / y * 100)\n\n\ndef gauge(percentage):\n    if percentage < 1:\n        return \"E\"\n    elif percentage >= 99:\n        return \"F\"\n    else:\n        return f\"{percentage}%\"\n\n\nif __name__ == \"__main__\":\n    main()\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате fuel.py (gauge 99%-ды F демейді): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "fuel.py": "def main():\n    while True:\n        try:\n            percentage = convert(input(\"Fraction: \"))\n            break\n        except (ValueError, ZeroDivisionError):\n            pass\n    print(gauge(percentage))\n\n\ndef convert(fraction):\n    x, y = fraction.split(\"/\")\n    x, y = int(x), int(y)\n    if y == 0:\n        raise ZeroDivisionError\n    if x < 0 or y < 0 or x > y:\n        raise ValueError\n    return round(x / y * 100)\n\n\ndef gauge(percentage):\n    if percentage <= 1:\n        return \"E\"\n    elif percentage > 99:\n        return \"F\"\n    else:\n        return f\"{percentage}%\"\n\n\nif __name__ == \"__main__\":\n    main()\n\n\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате fuel.py (gauge % белгісін қоймайды): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "fuel.py": "def main():\n    while True:\n        try:\n            percentage = convert(input(\"Fraction: \"))\n            break\n        except (ValueError, ZeroDivisionError):\n            pass\n    print(gauge(percentage))\n\n\ndef convert(fraction):\n    x, y = fraction.split(\"/\")\n    x, y = int(x), int(y)\n    if y == 0:\n        raise ZeroDivisionError\n    if x < 0 or y < 0 or x > y:\n        raise ValueError\n    return round(x / y * 100)\n\n\ndef gauge(percentage):\n    if percentage <= 1:\n        return \"E\"\n    elif percentage >= 99:\n        return \"F\"\n    else:\n        return f\"{percentage}\"\n\n\nif __name__ == \"__main__\":\n    main()\n\n\n\n",
     "pytest.py": "\"\"\"CS50 қазақша: браузерге арналған шағын pytest алмастырғышы (тек raises).\"\"\"\nimport re as _re\n\n\nclass _Raises:\n    def __init__(self, expected, match=None):\n        self.expected = expected\n        self.match = match\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, t, v, tb):\n        if t is None:\n            name = getattr(self.expected, \"__name__\", str(self.expected))\n            raise AssertionError(f\"DID NOT RAISE {name}\")\n        if not issubclass(t, self.expected):\n            return False\n        if self.match is not None and not _re.search(self.match, str(v)):\n            raise AssertionError(f\"Regex {self.match!r} did not match {str(v)!r}\")\n        self.value = v\n        return True\n\n\ndef raises(expected, *args, match=None, **kwargs):\n    if args:\n        with _Raises(expected, match):\n            args[0](*args[1:], **kwargs)\n        return None\n    return _Raises(expected, match)\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   }
  ],
  "append": "_tests = [(_n, _f) for _n, _f in list(globals().items()) if _n.startswith(\"test_\") and callable(_f)]\n_failed = []\nfor _n, _f in _tests:\n    try:\n        _f()\n    except Exception as _e:\n        _failed.append(f\"{_n} ({type(_e).__name__})\")\nif _failed:\n    raise AssertionError(\"құлаған тесттер: \" + \", \".join(_failed))\nif len(_tests) < 2:\n    print(f\"test_ функциялары тым аз: {len(_tests)} (кемінде 2 керек)\")\nelse:\n    print(\"ok\")",
  "note": "Мұнда fuel.py емес, тест файлыңызды (test_fuel.py) қойыңыз. Тексеруші оны дұрыс fuel.py-мен, сосын әдейі қате жазылған бірнеше fuel.py-мен іске қосады: дұрысында барлық тестіңіз өтуі, ал әр қате нұсқада кемінде біреуі құлауы керек. test_ деп басталатын функцияларыңыздың бәрі шақырылады, тек кәдімгі assert қолданыңыз. Браузерде нағыз pytest жоқ: import pytest жұмыс істейді, бірақ одан тек «with pytest.raises(...)» бар. Қате түрін try/except арқылы да тексеруге болады: try ішінде convert-ті шақырып, except ValueError: pass, ал else бөлігінде assert False деп жазыңыз."
 },
 "py-twttr-fn": {
  "title": "twttr.py (shorten)",
  "file": "twttr.py",
  "starter": "def main():\n    # TODO: қолданушыдан мәтін сұрап, shorten нәтижесін шығарыңыз\n    ...\n\n\ndef shorten(word):\n    # TODO: дауыстыларды алып тастап, жаңа жолды return етіңіз\n    ...\n\n\nif __name__ == \"__main__\":\n    main()\n",
  "tests": [
   {
    "n": "main: Twitter → Twttr",
    "in": [
     "Twitter"
    ],
    "contains": "Twttr",
    "out": "Output: Twttr"
   },
   {
    "n": "shorten(\"Twitter\") → \"Twttr\"",
    "in": [
     "x"
    ],
    "append": "print(\"shorten ->\", repr(shorten(\"Twitter\")))",
    "contains": "shorten -> 'Twttr'",
    "out": "Output: x\nshorten -> 'Twttr'"
   },
   {
    "n": "shorten(\"AEIOU aeiou\") → \" \"",
    "in": [
     "x"
    ],
    "append": "print(\"shorten ->\", repr(shorten(\"AEIOU aeiou\")))",
    "contains": "shorten -> ' '",
    "out": "Output: x\nshorten -> ' '"
   },
   {
    "n": "shorten(\"CS50\") → \"CS50\" (цифрлар қалады)",
    "in": [
     "x"
    ],
    "append": "print(\"shorten ->\", repr(shorten(\"CS50\")))",
    "contains": "shorten -> 'CS50'",
    "out": "Output: x\nshorten -> 'CS50'"
   },
   {
    "n": "shorten(\"What's your name?\") → \"Wht's yr nm?\"",
    "in": [
     "x"
    ],
    "append": "print(\"shorten ->\", repr(shorten(\"What's your name?\")))",
    "contains": "shorten -> \"Wht's yr nm?\"",
    "out": "Output: x\nshorten -> \"Wht's yr nm?\""
   }
  ],
  "note": "Мұнда twttr.py бағдарламасының өзін қойыңыз. Алдымен main бір кіріспен іске қосылады, сосын тексеруші shorten функция(лар)ын тікелей шақырып, қайтарылған мәнді (print емес!) тексереді."
 },
 "py-bank-fn": {
  "title": "bank.py (value)",
  "file": "bank.py",
  "starter": "def main():\n    # TODO: сәлемдесуді сұрап, $ белгісімен соманы шығарыңыз\n    ...\n\n\ndef value(greeting):\n    # TODO: 0, 20 немесе 100 санын (int) return етіңіз\n    ...\n\n\nif __name__ == \"__main__\":\n    main()\n",
  "tests": [
   {
    "n": "main: Hello → $0",
    "in": [
     "Hello"
    ],
    "out": "$0"
   },
   {
    "n": "main: How you doing? → $20",
    "in": [
     "How you doing?"
    ],
    "out": "$20"
   },
   {
    "n": "main: What's happening? → $100",
    "in": [
     "What's happening?"
    ],
    "out": "$100"
   },
   {
    "n": "value: hello-мен басталатындар → [0, 0, 0]",
    "in": [
     "x"
    ],
    "append": "print(\"value ->\", [value(\"hello\"), value(\"Hello, Newman\"), value(\"HELLO there\")])",
    "contains": "value -> [0, 0, 0]",
    "out": "$100\nvalue -> [0, 0, 0]"
   },
   {
    "n": "value: h-мен басталатындар → [20, 20]",
    "in": [
     "x"
    ],
    "append": "print(\"value ->\", [value(\"hey\"), value(\"How you doing?\")])",
    "contains": "value -> [20, 20]",
    "out": "$100\nvalue -> [20, 20]"
   },
   {
    "n": "value: басқалары → [100, 100]",
    "in": [
     "x"
    ],
    "append": "print(\"value ->\", [value(\"What's up\"), value(\"good morning\")])",
    "contains": "value -> [100, 100]",
    "out": "$100\nvalue -> [100, 100]"
   }
  ],
  "note": "Мұнда bank.py бағдарламасының өзін қойыңыз. Алдымен main бір кіріспен іске қосылады, сосын тексеруші value функция(лар)ын тікелей шақырып, қайтарылған мәнді (print емес!) тексереді."
 },
 "py-plates-fn": {
  "title": "plates.py (is_valid)",
  "file": "plates.py",
  "starter": "def main():\n    plate = input(\"Plate: \")\n    if is_valid(plate):\n        print(\"Valid\")\n    else:\n        print(\"Invalid\")\n\n\ndef is_valid(s):\n    # TODO: барлық талап орындалса True, әйтпесе False қайтарыңыз\n    ...\n\n\nif __name__ == \"__main__\":\n    main()\n",
  "tests": [
   {
    "n": "main: CS50 → Valid",
    "in": [
     "CS50"
    ],
    "out": "Valid"
   },
   {
    "n": "main: CS05 → Invalid",
    "in": [
     "CS05"
    ],
    "out": "Invalid"
   },
   {
    "n": "is_valid: CS50, HELLO, AB → True",
    "in": [
     "x"
    ],
    "append": "print(\"is_valid ->\", [is_valid(\"CS50\"), is_valid(\"HELLO\"), is_valid(\"AB\")])",
    "contains": "is_valid -> [True, True, True]",
    "out": "Invalid\nis_valid -> [True, True, True]"
   },
   {
    "n": "is_valid: A, OUTATIME (ұзындық) → False",
    "in": [
     "x"
    ],
    "append": "print(\"is_valid ->\", [is_valid(\"A\"), is_valid(\"OUTATIME\")])",
    "contains": "is_valid -> [False, False]",
    "out": "Invalid\nis_valid -> [False, False]"
   },
   {
    "n": "is_valid: 50, C50 (басы әріп емес) → False",
    "in": [
     "x"
    ],
    "append": "print(\"is_valid ->\", [is_valid(\"50\"), is_valid(\"C50\")])",
    "contains": "is_valid -> [False, False]",
    "out": "Invalid\nis_valid -> [False, False]"
   },
   {
    "n": "is_valid: CS50P, AAA22A, CS05 (цифрлар) → False",
    "in": [
     "x"
    ],
    "append": "print(\"is_valid ->\", [is_valid(\"CS50P\"), is_valid(\"AAA22A\"), is_valid(\"CS05\")])",
    "contains": "is_valid -> [False, False, False]",
    "out": "Invalid\nis_valid -> [False, False, False]"
   },
   {
    "n": "is_valid: PI3.14, CS 50 (тыныс белгісі) → False",
    "in": [
     "x"
    ],
    "append": "print(\"is_valid ->\", [is_valid(\"PI3.14\"), is_valid(\"CS 50\")])",
    "contains": "is_valid -> [False, False]",
    "out": "Invalid\nis_valid -> [False, False]"
   }
  ],
  "note": "Мұнда plates.py бағдарламасының өзін қойыңыз. Алдымен main бір кіріспен іске қосылады, сосын тексеруші is_valid функция(лар)ын тікелей шақырып, қайтарылған мәнді (print емес!) тексереді."
 },
 "py-fuel-fn": {
  "title": "fuel.py (convert, gauge)",
  "file": "fuel.py",
  "starter": "def main():\n    # TODO: бөлшекті дұрыс енгізілгенше сұраңыз, сосын gauge нәтижесін шығарыңыз\n    ...\n\n\ndef convert(fraction):\n    # TODO: X/Y-ті 0..100 аралығындағы int пайызға айналдырыңыз\n    # (қате болса ValueError, Y = 0 болса ZeroDivisionError)\n    ...\n\n\ndef gauge(percentage):\n    # TODO: \"E\", \"F\" немесе \"Z%\" қайтарыңыз\n    ...\n\n\nif __name__ == \"__main__\":\n    main()\n",
  "tests": [
   {
    "n": "main: 3/4 → 75%",
    "in": [
     "3/4"
    ],
    "out": "75%"
   },
   {
    "n": "main: cat/dog, 3/2, 1/0, сосын 1/100 → E",
    "in": [
     "cat/dog",
     "3/2",
     "1/0",
     "1/100"
    ],
    "out": "E"
   },
   {
    "n": "convert: 1/4, 1/2, 2/3, 1/1 → [25, 50, 67, 100]",
    "in": [
     "1/2"
    ],
    "append": "print(\"convert ->\", [convert(\"1/4\"), convert(\"1/2\"), convert(\"2/3\"), convert(\"1/1\")])",
    "contains": "convert -> [25, 50, 67, 100]",
    "out": "50%\nconvert -> [25, 50, 67, 100]"
   },
   {
    "n": "convert(\"3/2\") → ValueError",
    "in": [
     "1/2"
    ],
    "append": "convert(\"3/2\")",
    "raises": "ValueError",
    "out": "ValueError (тест құлауы керек)"
   },
   {
    "n": "convert(\"cat/dog\") → ValueError",
    "in": [
     "1/2"
    ],
    "append": "convert(\"cat/dog\")",
    "raises": "ValueError",
    "out": "ValueError (тест құлауы керек)"
   },
   {
    "n": "convert(\"1/0\") → ZeroDivisionError",
    "in": [
     "1/2"
    ],
    "append": "convert(\"1/0\")",
    "raises": "ZeroDivisionError",
    "out": "ZeroDivisionError (тест құлауы керек)"
   },
   {
    "n": "gauge: 0, 1, 99, 100 → [E, E, F, F]",
    "in": [
     "1/2"
    ],
    "append": "print(\"gauge ->\", [gauge(0), gauge(1), gauge(99), gauge(100)])",
    "contains": "gauge -> ['E', 'E', 'F', 'F']",
    "out": "50%\ngauge -> ['E', 'E', 'F', 'F']"
   },
   {
    "n": "gauge(2), gauge(50), gauge(98) → 2%, 50%, 98%",
    "in": [
     "1/2"
    ],
    "append": "print(\"gauge ->\", [gauge(2), gauge(50), gauge(98)])",
    "contains": "gauge -> ['2%', '50%', '98%']",
    "out": "50%\ngauge -> ['2%', '50%', '98%']"
   }
  ],
  "note": "Мұнда fuel.py бағдарламасының өзін қойыңыз. Алдымен main бір кіріспен іске қосылады, сосын тексеруші convert пен gauge функция(лар)ын тікелей шақырып, қайтарылған мәнді (print емес!) тексереді."
 }
});
