// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-test-prime-assert": {
  "title": "Testing is_prime with assert",
  "file": "test_prime.py",
  "starter": "from prime import is_prime\n\n\ndef test_small():\n    # TODO: assert арқылы 1, 2, 3 сандарын тексеріңіз\n    ...\n\n\ndef test_composites():\n    # TODO: құрама сандар (4, 9, 25 ...) жай емес екенін тексеріңіз\n    ...\n\n\ndef test_primes():\n    # TODO: бірнеше жай санды тексеріңіз\n    ...\n",
  "tests": [
   {
    "n": "Дұрыс prime.py: барлық тестіңіз өтуі керек",
    "in": [],
    "files": {
     "prime.py": "import unittest as _kz_u\n_kz_u.main = lambda *a, **k: None\n\nimport math\n\n\ndef is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(math.sqrt(n)) + 1):\n        if n % i == 0:\n            return False\n    return True\n"
    },
    "out": "ok"
   },
   {
    "n": "Қате prime.py (квадрат түбірді қоспай, диапазон бір санға қысқа (4, 8, 9, 25 «жай» болып кетеді)): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "prime.py": "import unittest as _kz_u\n_kz_u.main = lambda *a, **k: None\n\nimport math\n\n\ndef is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(math.sqrt(n))):\n        if n % i == 0:\n            return False\n    return True\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате prime.py (1 санын жай деп санайды): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "prime.py": "import unittest as _kz_u\n_kz_u.main = lambda *a, **k: None\n\nimport math\n\n\ndef is_prime(n):\n    if n < 1:\n        return False\n    for i in range(2, int(math.sqrt(n)) + 1):\n        if n % i == 0:\n            return False\n    return True\n\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате prime.py (2 санын жай емес деп санайды): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "prime.py": "import unittest as _kz_u\n_kz_u.main = lambda *a, **k: None\n\nimport math\n\n\ndef is_prime(n):\n    if n <= 2:\n        return False\n    for i in range(2, int(math.sqrt(n)) + 1):\n        if n % i == 0:\n            return False\n    return True\n\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате prime.py (2-ге бөлінуін тексермейді (4, 6, 100 «жай» болып кетеді)): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "prime.py": "import unittest as _kz_u\n_kz_u.main = lambda *a, **k: None\n\nimport math\n\n\ndef is_prime(n):\n    if n < 2:\n        return False\n    for i in range(3, int(math.sqrt(n)) + 1):\n        if n % i == 0:\n            return False\n    return True\n\n\n\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   }
  ],
  "append": "import types as _ty, io as _io, unittest as _un\n_funcs = [(_n, _f) for _n, _f in list(globals().items()) if _n.startswith(\"test_\") and isinstance(_f, _ty.FunctionType)]\n_failed = []\nfor _n, _f in _funcs:\n    try:\n        _f()\n    except BaseException as _e:\n        _failed.append(f\"{_n} ({type(_e).__name__})\")\n_classes = [_c for _c in list(globals().values()) if isinstance(_c, type) and issubclass(_c, _un.TestCase) and _c is not _un.TestCase]\n_ran = 0\nfor _c in _classes:\n    _r = _un.TextTestRunner(stream=_io.StringIO(), verbosity=0).run(_un.TestLoader().loadTestsFromTestCase(_c))\n    _ran += _r.testsRun\n    for _case, _tb in _r.failures + _r.errors:\n        _failed.append(_case.id().split('.')[-1])\nif _failed:\n    raise AssertionError(\"құлаған тесттер: \" + \", \".join(_failed))\nif len(_funcs) < 3:\n    print(f\"test_ функциялары тым аз: {len(_funcs)} (кемінде 3 керек)\")\nelif _ran < 0:\n    print(f\"unittest тесттері тым аз: {_ran} (кемінде 0 керек)\")\nelse:\n    print(\"ok\")",
  "note": "Мұнда prime.py емес, тест файлыңызды (test_prime.py) қойыңыз. Тексеруші оны дұрыс prime.py-мен, сосын әдейі қате жазылған бірнеше prime.py-мен іске қосады: дұрысында барлық тестіңіз өтуі, ал әр қате нұсқада кемінде біреуі құлауы керек. test_ деп басталатын функциялардың бәрі шақырылады, кемінде 3 функция керек; кәдімгі assert қолданыңыз. Тесттің ішінде from prime import is_prime деп әкелу жеткілікті; if __name__ == \"__main__\" қорғанысы болса да, болмаса да жұмыс істейді."
 },
 "py-test-prime-unittest": {
  "title": "Testing is_prime with unittest",
  "file": "test_prime.py",
  "starter": "import unittest\nfrom prime import is_prime\n\n\nclass Tests(unittest.TestCase):\n\n    def test_1(self):\n        \"\"\"1 жай емес.\"\"\"\n        # TODO: self.assertFalse(...)\n        ...\n\n    # TODO: кемінде 5 тест әдісін жазыңыз (0 мен теріс сандарды да ұмытпаңыз)\n\n\nif __name__ == \"__main__\":\n    unittest.main()\n",
  "tests": [
   {
    "n": "Дұрыс prime.py: барлық тестіңіз өтуі керек",
    "in": [],
    "files": {
     "prime.py": "import unittest as _kz_u\n_kz_u.main = lambda *a, **k: None\n\nimport math\n\n\ndef is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(math.sqrt(n)) + 1):\n        if n % i == 0:\n            return False\n    return True\n"
    },
    "out": "ok"
   },
   {
    "n": "Қате prime.py (квадрат түбірді қоспай, диапазон бір санға қысқа (4, 8, 9, 25 «жай» болып кетеді)): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "prime.py": "import unittest as _kz_u\n_kz_u.main = lambda *a, **k: None\n\nimport math\n\n\ndef is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(math.sqrt(n))):\n        if n % i == 0:\n            return False\n    return True\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате prime.py (1 санын жай деп санайды): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "prime.py": "import unittest as _kz_u\n_kz_u.main = lambda *a, **k: None\n\nimport math\n\n\ndef is_prime(n):\n    if n < 1:\n        return False\n    for i in range(2, int(math.sqrt(n)) + 1):\n        if n % i == 0:\n            return False\n    return True\n\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате prime.py (2 санын жай емес деп санайды): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "prime.py": "import unittest as _kz_u\n_kz_u.main = lambda *a, **k: None\n\nimport math\n\n\ndef is_prime(n):\n    if n <= 2:\n        return False\n    for i in range(2, int(math.sqrt(n)) + 1):\n        if n % i == 0:\n            return False\n    return True\n\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате prime.py (2-ге бөлінуін тексермейді (4, 6, 100 «жай» болып кетеді)): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "prime.py": "import unittest as _kz_u\n_kz_u.main = lambda *a, **k: None\n\nimport math\n\n\ndef is_prime(n):\n    if n < 2:\n        return False\n    for i in range(3, int(math.sqrt(n)) + 1):\n        if n % i == 0:\n            return False\n    return True\n\n\n\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате prime.py (0 мен теріс сандарды дұрыс өңдемейді): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "prime.py": "import unittest as _kz_u\n_kz_u.main = lambda *a, **k: None\n\nimport math\n\n\ndef is_prime(n):\n    if n == 1:\n        return False\n    for i in range(2, int(math.sqrt(n)) + 1):\n        if n % i == 0:\n            return False\n    return True\n\n\n\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   },
   {
    "n": "Қате prime.py (тек кіші бөлгіштерді (7-ден аз) тексереді (49, 121, 143 «жай» болып кетеді)): тестіңіз құлауы керек",
    "in": [],
    "files": {
     "prime.py": "import unittest as _kz_u\n_kz_u.main = lambda *a, **k: None\n\nimport math\n\n\ndef is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, min(int(math.sqrt(n)) + 1, 7)):\n        if n % i == 0:\n            return False\n    return True\n"
    },
    "raises": "AssertionError",
    "out": "AssertionError (бұл қатені тестіңіз ұстауы керек еді)"
   }
  ],
  "append": "import types as _ty, io as _io, unittest as _un\n_funcs = [(_n, _f) for _n, _f in list(globals().items()) if _n.startswith(\"test_\") and isinstance(_f, _ty.FunctionType)]\n_failed = []\nfor _n, _f in _funcs:\n    try:\n        _f()\n    except BaseException as _e:\n        _failed.append(f\"{_n} ({type(_e).__name__})\")\n_classes = [_c for _c in list(globals().values()) if isinstance(_c, type) and issubclass(_c, _un.TestCase) and _c is not _un.TestCase]\n_ran = 0\nfor _c in _classes:\n    _r = _un.TextTestRunner(stream=_io.StringIO(), verbosity=0).run(_un.TestLoader().loadTestsFromTestCase(_c))\n    _ran += _r.testsRun\n    for _case, _tb in _r.failures + _r.errors:\n        _failed.append(_case.id().split('.')[-1])\nif _failed:\n    raise AssertionError(\"құлаған тесттер: \" + \", \".join(_failed))\nif len(_funcs) < 0:\n    print(f\"test_ функциялары тым аз: {len(_funcs)} (кемінде 0 керек)\")\nelif _ran < 5:\n    print(f\"unittest тесттері тым аз: {_ran} (кемінде 5 керек)\")\nelse:\n    print(\"ok\")",
  "note": "Мұнда prime.py емес, тест файлыңызды (test_prime.py) қойыңыз. Тексеруші оны дұрыс prime.py-мен, сосын әдейі қате жазылған бірнеше prime.py-мен іске қосады: дұрысында барлық тестіңіз өтуі, ал әр қате нұсқада кемінде біреуі құлауы керек. unittest.TestCase класын жазыңыз: кемінде 5 тест әдісі керек (test_ деп басталатын жай функциялар санатқа кірмейді). Тесттің ішінде from prime import is_prime деп әкелу жеткілікті; if __name__ == \"__main__\" қорғанысы болса да, болмаса да жұмыс істейді."
 },
 "py-prime": {
  "title": "prime.py (is_prime)",
  "file": "prime.py",
  "starter": "import math\n\n\ndef main():\n    n = int(input(\"n: \"))\n    if is_prime(n):\n        print(f\"{n} is prime\")\n    else:\n        print(f\"{n} is not prime\")\n\n\ndef is_prime(n):\n    # TODO: бұл нұсқада қате бар: 4, 8, 9, 25 сандарын жай деп жіберіп алады.\n    # Қатені тауып түзетіңіз (кеңес: range-тің соңғы шекарасына қараңыз).\n    if n < 2:\n        return False\n    for i in range(2, int(math.sqrt(n))):\n        if n % i == 0:\n            return False\n    return True\n\n\nif __name__ == \"__main__\":\n    main()\n",
  "tests": [
   {
    "n": "main: 7 → «7 is prime»",
    "in": [
     "7"
    ],
    "contains": "7 is prime",
    "out": "7 is prime"
   },
   {
    "n": "main: 25 → «25 is not prime»",
    "in": [
     "25"
    ],
    "contains": "25 is not prime",
    "out": "25 is not prime"
   },
   {
    "n": "main: 1 → «1 is not prime»",
    "in": [
     "1"
    ],
    "contains": "1 is not prime",
    "out": "1 is not prime"
   },
   {
    "n": "is_prime: 2, 3, 5, 7, 11, 13, 97 → True",
    "in": [
     "1"
    ],
    "append": "print(\"primes ->\", [is_prime(n) for n in (2, 3, 5, 7, 11, 13, 97)])",
    "contains": "primes -> [True, True, True, True, True, True, True]",
    "out": "1 is not prime\nprimes -> [True, True, True, True, True, True, True]"
   },
   {
    "n": "is_prime: 4, 8, 9, 25, 49, 121 → False",
    "in": [
     "1"
    ],
    "append": "print(\"composites ->\", [is_prime(n) for n in (4, 8, 9, 25, 49, 121)])",
    "contains": "composites -> [False, False, False, False, False, False]",
    "out": "1 is not prime\ncomposites -> [False, False, False, False, False, False]"
   },
   {
    "n": "is_prime: 0, 1, -7 → False",
    "in": [
     "1"
    ],
    "append": "print(\"small ->\", [is_prime(n) for n in (0, 1, -7)])",
    "contains": "small -> [False, False, False]",
    "out": "1 is not prime\nsmall -> [False, False, False]"
   }
  ],
  "note": "Мұнда prime.py бағдарламасының өзін қойыңыз. Алдымен main бір кіріспен іске қосылады, сосын тексеруші is_prime функциясын тікелей шақырып, қайтарылған мәнді тексереді."
 }
});
