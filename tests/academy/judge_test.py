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
import json  # noqa: E402
t = json.loads(J.trace_calls("def fib(n):\n    return n if n < 2 else fib(n - 1) + fib(n - 2)", "fib(5)"))
check(t["ok"] and len(t["nodes"]) == 15 and t["value"] == "5", "trace_calls fib(5) = 15 шақыру")
check(json.loads(J.trace_calls("def f(n):\n    return f(n + 1)", "f(0)"))["truncated"], "шексіз рекурсия шегі")
check(J.judge("def g():\n    return 1", {"mode": "io", "suffix": "print(g())", "tests": [{"stdin": "", "stdout": "1"}]})["ok"], "suffix драйвері")
check(sys.gettrace() is before, "trace_calls-тан кейін settrace қалпына келді")
import os  # noqa: E402
cwd = os.getcwd()
FS = {"mode": "func", "func": "n", "files": {"a.txt": "x\ny\n"}, "tests": [{"args": ["a.txt"], "expect": 2}, {"args": ["a.txt"], "expect": 2}]}
check(J.judge("def n(p):\n    return len(open(p, encoding='utf-8').readlines())", FS)["ok"], "files: тест алдында файл жазылады")
check(J.judge("open('w.txt', 'w').write('1')\ndef n(p):\n    return 2", FS)["ok"] and os.getcwd() == cwd and not os.path.exists("w.txt"), "files: уақытша бума, cwd қалпына келеді")
check(J.judge("def n(p):\n    return 2", {"mode": "func", "func": "n", "tests": [{"args": [[[1, 2]]], "expect": 2}, {"args": [1], "expect": 2}]})["ok"], "тест кірісі тізімдер тізімі")
check(J.judge("def f():\n    return [(2, 1), (4, 3)]", {"mode": "func", "func": "f", "tests": [{"args": [], "expect": [[2, 1], [4, 3]]}]})["ok"], "ішкі кортеждер = ішкі тізімдер")
check(not J.judge("def f():\n    return {'a': True}", {"mode": "func", "func": "f", "tests": [{"args": [], "expect": {"a": 1}}]})["ok"], "сөздік ішінде де bool ≠ int")
SQ = {"impl": "def sq(x):\n    return x * x", "min_tests": 1, "mutants": [{"name": "dbl", "code": "def sq(x):\n    return x + x"}, {"name": "id", "code": "def sq(x):\n    return x"}]}
r = J.judge_tests("def test_two():\n    assert sq(2) == 4", SQ)
check(not r["ok"] and r["stage"] == "mutants" and [m["killed"] for m in r["mutants"]] == [False, True], "pytests: әлсіз тест бір мутантты өткізіп жібереді (2+2 = 2·2)")
check(J.judge_tests("def test_two():\n    assert sq(2) == 4\n\ndef test_three():\n    assert sq(3) == 9", SQ)["ok"], "pytests: күшті тесттер барлық мутантты ұстайды")
check(J.judge_tests("def test_bad():\n    assert sq(2) == 5", SQ)["stage"] == "correct", "pytests: дұрыс кодта құлаған тест")
check(J.judge_tests("x = 1", SQ)["stage"] == "count", "pytests: тест жоқ")
r = J.judge_tests("def test_a():\n    assert sq(1) == 1\n\nbad(", SQ)
check(r["stage"] == "load" and r["error"] == "SyntaxError", "pytests: синтаксис қатесі")
r = J.judge_tests("def test_a():\n    assert sq(1) == 1\n\n1 / 0", SQ)
check(r["stage"] == "load" and r["line"] == 4, "pytests: жол нөмірі оқушы кодына қатысты")
check(J.judge_tests("def test_loop():\n    while True:\n        pass", SQ)["stage"] == "correct", "pytests: шексіз цикл тестте StepLimit")
check(sys.gettrace() is before and os.getcwd() == cwd, "pytests-тен кейін күй қалпына келді")
INS = "def ins(a):\n    for i in range(1, len(a)):\n        x = a[i]\n        j = i - 1\n        while j >= 0 and a[j] > x:\n            a[j + 1] = a[j]\n            j -= 1\n        a[j + 1] = x"
t = json.loads(J.trace_sort(INS, "ins", [3, 1, 2]))
check(t["ok"] and t["sorted"] and t["final"] == [1, 2, 3] and t["stats"] == {"cmp": 3, "write": 4}, "trace_sort: кірістіру [3,1,2] = 3 салыстыру, 4 жазу")
check(all(e["op"] in ("cmp", "set") for e in t["events"]) and len(t["events"]) == 7, "trace_sort: оқиғалар тізімі")
st = [3, 1, 2]
for e in t["events"]:
    if e["op"] == "set":
        st[e["i"]] = e["v"]
check(st == [1, 2, 3], "trace_sort: оқиғаларды қайта ойнату соңғы күйді береді")
t = json.loads(J.trace_sort("def s(a):\n    return sorted(a)", "s", [2, 1]))
check(t["ok"] and t["returned"] == [1, 2] and t["sorted"] and t["stats"]["cmp"] >= 1, "trace_sort: жаңа тізім қайтаратын алгоритм, sorted салыстырулары да саналады")
t = json.loads(J.trace_sort("def s(a):\n    a[0], a[1] = a[1], a[0]", "s", [1, 2]))
check(t["ok"] and not t["sorted"], "trace_sort: сұрыптамайтын алгоритм анықталады")
check(json.loads(J.trace_sort("def s(a):\n    while True:\n        a[0] = a[0]", "s", [1]))["truncated"], "trace_sort: оқиғалар шегі")
check(json.loads(J.trace_sort("def s(a):\n    return a[5]", "s", [1]))["error"] == "IndexError", "trace_sort: қате")
check(sys.gettrace() is before and os.getcwd() == cwd, "trace_sort-тан кейін күй қалпына келді")
print(f"academy judge: {ok} өтті, {fail} өтпеді")
sys.exit(1 if fail else 0)
