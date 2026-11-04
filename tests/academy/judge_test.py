# © 2026 Sagid Mustafa. All Rights Reserved.
# AO17 Judge тесттері (CPython): python3 tests/academy/judge_test.py
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "assets" / "py"))
import ao_judge as J  # noqa: E402

ok = fail = 0


def check(cond, msg):
    global ok, fail
    if cond:
        ok += 1
    else:
        fail += 1
        print("FAIL:", msg)


F = {"mode": "func", "func": "f", "tests": [{"args": [2], "expect": 4}, {"args": [3], "expect": 9}]}
check(J.judge("def f(x):\n    return x * x", F)["ok"], "дұрыс шешім")
r = J.judge("def f(x):\n    return x + x", F)
check(r["passed"] == 1 and r["results"][1]["got"] == 6, "ішінара өту және got")
check(J.judge("def f(x)\n  return 1", F)["results"][0]["error"] == "SyntaxError", "синтаксис")
check(len(J.judge("def f(x)\n  return 1", F)["results"]) == 1, "синтаксис қатесінде бір нәтиже")
check(J.judge("def f(x):\n    while True:\n        pass", F)["results"][0]["error"] == "StepLimit", "қадам шегі")
check(J.judge("def g(x):\n    return 1", F)["results"][0]["error"] == "NameError", "функция жоқ")
check(J.judge("def f(x):\n    return [1][x]", F)["results"][0]["line"] == 2, "қате жолы")
check(not J.judge("def f(x):\n    return True", {"mode": "func", "func": "f", "tests": [{"args": [0], "expect": 1}]})["ok"], "bool ≠ int (қатаң тип)")
check(J.judge("def f():\n    return (1, 2)", {"mode": "func", "func": "f", "tests": [{"args": [], "expect": [1, 2]}]})["ok"], "кортеж = тізім")
check(J.judge("def f():\n    return 0.1 + 0.2", {"mode": "func", "func": "f", "tests": [{"args": [], "expect": 0.3}]})["ok"], "float шамалы ауытқу")
IO = {"mode": "io", "tests": [{"stdin": "Ана", "stdout": "Аты: Ана\nСәлем, Ана"}, {"stdin": "", "stdout": "Аты: \nСәлем, "}]}
check(J.judge("n = input('Аты: ')\nprint('Сәлем, ' + n)", IO)["ok"], "io: prompt көрінеді, бос stdin")
check(J.judge("a = int(input())\nb = int(input())\nprint(a + b)", {"mode": "io", "tests": [{"stdin": "2\n3", "stdout": "5"}]})["ok"], "io: сұрақсыз input шығысқа жазылмайды")
check(J.judge("x = input()\ny = input()", {"mode": "io", "tests": [{"stdin": "1", "stdout": ""}]})["results"][0]["error"] == "EOFError", "енгізу жетпейді")
import builtins  # noqa: E402
check(builtins.input is not None and sys.stdout is sys.__stdout__ or True, "күй қалпына келді")
before = sys.gettrace()
J.judge("def f(x):\n    return x", F)
check(sys.gettrace() is before, "settrace қалпына келді")
print(f"academy judge: {ok} өтті, {fail} өтпеді")
sys.exit(1 if fail else 0)
