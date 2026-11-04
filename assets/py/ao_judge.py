# © 2026 Sagid Mustafa. All Rights Reserved.
"""AO17 Judge: оқушы Python кодын ашық тесттермен тексеру.

Бір файл екі жерде жұмыс істейді:
  * браузерде - Pyodide (assets/js/academy.js оны жүктеп, judge() шақырады);
  * build кезінде - CPython (tools/academy_build.py эталон шешімдерді осы функциямен тексереді).

Шектеулер (адал сипаттама):
  * Тесттер АШЫҚ: олар бет деректерінде тұр. Бұл - оқу тексерісі, емтихан емес.
  * Қадам шегі sys.settrace арқылы: шексіз цикл бетті қатырмас үшін STEP_LIMIT жолдан кейін тоқтатамыз.
  * Код оқшауланбаған құмсалғышта емес, оқушының өз браузерінде орындалады - бұл қауіпсіз, өйткені тек өзіне әсер етеді.
"""
import io
import json
import sys
import traceback

STEP_LIMIT = 200000

MESSAGES = {
    "SyntaxError": "Синтаксис қатесі: жақша, қос нүкте (:) не тырнақша жетіспеуі мүмкін.",
    "IndentationError": "Шегініс қатесі: блок ішіндегі жолдар бірдей шегініспен (4 бос орын) жазылуы керек.",
    "TabError": "Шегіністе Tab пен бос орын араласқан. Тек бос орын қолданыңыз.",
    "NameError": "Анықталмаған атау: айнымалы не функция атын тексеріңіз (бас/кіші әріп маңызды).",
    "TypeError": "Түр қатесі: мысалы, жол мен санды қосу (str + int) не функцияға аргументтерді қате беру.",
    "ValueError": "Мән қатесі: мысалы, int('abc') - санға айналмайтын жол.",
    "IndexError": "Индекс шекарадан тыс: тізім ұзындығын тексеріңіз (индекс 0-ден len − 1-ге дейін).",
    "KeyError": "Сөздікте мұндай кілт жоқ.",
    "ZeroDivisionError": "Нөлге бөлу.",
    "RecursionError": "Рекурсия тым терең: базалық жағдай жетіспеуі мүмкін.",
    "AttributeError": "Нысанда мұндай әдіс не қасиет жоқ.",
    "UnboundLocalError": "Функция ішінде айнымалыға мән бермей тұрып қолдандыңыз.",
    "StepLimit": f"Орындау {STEP_LIMIT} қадамнан асты - шексіз цикл болуы мүмкін.",
    "EOFError": "input() тест бергеннен көп рет шақырылды.",
}


class StepLimit(Exception):
    pass


def _tracer():
    count = [0]

    def trace(frame, event, arg):
        if event == "line":
            count[0] += 1
            if count[0] > STEP_LIMIT:
                raise StepLimit()
        return trace
    return trace


def _describe(exc):
    name = type(exc).__name__
    line = None
    if isinstance(exc, SyntaxError):
        line = exc.lineno
    else:
        for fr in traceback.extract_tb(exc.__traceback__):
            if fr.filename == "<оқушы коды>":
                line = fr.lineno
    return {"error": name, "line": line, "detail": str(exc)[:300], "hint": MESSAGES.get(name, "Орындау кезінде қате шықты.")}


def _with_files(files):
    """Тест алдында уақытша бумаға файлдар жазып, сонда өту; (ескі_бума, жаңа_бума) қайтарады."""
    import os
    import tempfile
    old = os.getcwd()
    d = tempfile.mkdtemp(prefix="ao17_")
    for name, text in (files or {}).items():
        with open(os.path.join(d, name), "w", encoding="utf-8") as f:
            f.write(text)
    os.chdir(d)
    return old, d


def _restore_dir(old, d):
    import os
    import shutil
    os.chdir(old)
    shutil.rmtree(d, ignore_errors=True)


def _run(code, stdin_lines, call=None, files=None):
    """Кодты оқшау аттар кеңістігінде орындау; stdout ұсталады."""
    old_dir, tmp_dir = _with_files(files)
    try:
        return _run_inner(code, stdin_lines, call)
    finally:
        _restore_dir(old_dir, tmp_dir)


def _run_inner(code, stdin_lines, call=None):
    out = io.StringIO()
    lines = list(stdin_lines)

    def fake_input(prompt=""):
        # Терминалдағыдай: сұрақ болса, сұрақ пен енгізілген мән шығыста көрінеді; сұрақсыз input() шығысқа ештеңе жазбайды
        if not lines:
            raise EOFError()
        v = lines.pop(0)
        if prompt:
            out.write(str(prompt) + v + "\n")
        return v

    ns = {"__name__": "__main__", "__builtins__": __builtins__}
    old_out, old_in = sys.stdout, None
    import builtins
    old_in = builtins.input
    builtins.input = fake_input
    sys.stdout = out
    old_trace = sys.gettrace()
    try:
        compiled = compile(code, "<оқушы коды>", "exec")
        sys.settrace(_tracer())
        exec(compiled, ns)
        result = call(ns) if call else None
        return {"ok": True, "out": out.getvalue(), "result": result}
    except StepLimit:
        return {"ok": False, "out": out.getvalue(), "error": "StepLimit", "line": None, "detail": "", "hint": MESSAGES["StepLimit"]}
    except (Exception, SystemExit) as e:  # noqa: BLE001 - оқушы кодының кез келген қатесі есепке жатады
        d = _describe(e)
        d.update({"ok": False, "out": out.getvalue()})
        return d
    finally:
        sys.settrace(old_trace)
        sys.stdout = old_out
        builtins.input = old_in


def _same(a, b):
    if isinstance(a, float) or isinstance(b, float):
        try:
            return abs(float(a) - float(b)) <= 1e-9 * max(1.0, abs(float(b)))
        except (TypeError, ValueError):
            return False
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):  # JSON-да кортеж жоқ: (2, 1) == [2, 1]
        return len(a) == len(b) and all(_same(x, y) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(_same(a[k], b[k]) for k in a)
    return a == b and type(a) is type(b)


def judge(code, spec):
    """spec: {"mode": "func", "func": "f", "tests": [{"args": [...], "expect": ...}]}
       не   {"mode": "io", "tests": [{"stdin": "...", "stdout": "..."}]}. Нәтиже - JSON сөздік."""
    if isinstance(spec, str):
        spec = json.loads(spec)
    results = []
    for i, t in enumerate(spec["tests"]):
        if spec["mode"] == "func":
            fname = spec["func"]

            def call(ns, t=t):
                if fname not in ns or not callable(ns[fname]):
                    raise NameError(f"«{fname}» функциясы анықталмаған")
                return ns[fname](*t["args"])
            r = _run(code, [], call, spec.get("files"))
            if r["ok"]:
                passed = _same(r["result"], t["expect"])
                results.append({"i": i, "passed": passed, "args": t["args"], "expect": t["expect"], "got": r["result"] if _jsonable(r["result"]) else repr(r["result"])})
            else:
                results.append({"i": i, "passed": False, "args": t["args"], **{k: r[k] for k in ("error", "line", "detail", "hint")}})
        else:
            r = _run(code + ("\n" + spec["suffix"] if spec.get("suffix") else ""), t.get("stdin", "").split("\n"), None, spec.get("files"))
            got = r["out"].rstrip("\n")
            if r["ok"]:
                results.append({"i": i, "passed": got == t["stdout"].rstrip("\n"), "stdin": t.get("stdin", ""), "expect": t["stdout"], "got": got})
            else:
                results.append({"i": i, "passed": False, "stdin": t.get("stdin", ""), "got": got, **{k: r[k] for k in ("error", "line", "detail", "hint")}})
        if results[-1].get("error") in ("SyntaxError", "IndentationError", "TabError"):
            break   # синтаксис қатесі барлық тестте бірдей
    passed = sum(1 for r in results if r["passed"])
    return {"passed": passed, "total": len(spec["tests"]), "ok": passed == len(spec["tests"]) and len(results) == len(spec["tests"]), "results": results}


def _jsonable(v):
    try:
        json.dumps(v)
        return True
    except (TypeError, ValueError):
        return False


def judge_json(code, spec_json):
    return json.dumps(judge(code, spec_json), ensure_ascii=False)


def run_json(code, stdin=""):
    """Еркін іске қосу (зертхана): шығыс және қате (бар болса)."""
    r = _run(code, stdin.split("\n") if stdin else [])
    return json.dumps({k: r.get(k) for k in ("ok", "out", "error", "line", "detail", "hint")}, ensure_ascii=False)


def trace_calls(code, call_src, limit=400):
    """Рекурсия ағашы (Code X-Ray): оқушы кодындағы функция шақырулары мен қайтарулары.
    Нәтиже: [{"id", "parent", "func", "args", "ret"}]; limit-тен көп шақыру болса, тоқтатылады."""
    ns = {"__name__": "__main__", "__builtins__": __builtins__}
    nodes, stack = [], []
    state = {"over": False}

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != "<оқушы коды>" or frame.f_code.co_name == "<module>":
            return tracer
        if event == "call":
            if len(nodes) >= limit:
                state["over"] = True
                raise StepLimit()
            co = frame.f_code
            args = {n: repr(frame.f_locals.get(n))[:40] for n in co.co_varnames[:co.co_argcount]}
            node = {"id": len(nodes), "parent": stack[-1] if stack else None, "func": co.co_name, "args": args, "ret": None}
            nodes.append(node)
            stack.append(node["id"])
        elif event == "return" and stack:
            nodes[stack.pop()]["ret"] = repr(arg)[:60]
        return tracer

    old = sys.gettrace()
    try:
        exec(compile(code, "<оқушы коды>", "exec"), ns)
        sys.settrace(tracer)
        value = eval(compile(call_src, "<оқушы коды>", "eval"), ns)
        sys.settrace(old)
        return json.dumps({"ok": True, "nodes": nodes, "value": repr(value)[:80], "truncated": False}, ensure_ascii=False)
    except StepLimit:
        sys.settrace(old)
        return json.dumps({"ok": True, "nodes": nodes, "value": None, "truncated": True}, ensure_ascii=False)
    except (Exception, SystemExit) as e:  # noqa: BLE001
        sys.settrace(old)
        d = _describe(e)
        d.update({"ok": False, "nodes": nodes})
        return json.dumps(d, ensure_ascii=False)


def _run_tests(impl, tests_code, files=None):
    """impl (іске асыру) + оқушы тесттері бір кеңістікте; әр test_* функциясының нәтижесі."""
    def call(ns):
        names = sorted(n for n, v in ns.items() if n.startswith("test_") and callable(v))
        res = []
        for n in names:
            try:
                sys.settrace(_tracer())
                ns[n]()
                sys.settrace(None)
                res.append({"name": n, "ok": True})
            except StepLimit:
                sys.settrace(None)
                res.append({"name": n, "ok": False, "error": "StepLimit"})
            except AssertionError as e:
                sys.settrace(None)
                res.append({"name": n, "ok": False, "error": "AssertionError", "detail": str(e)[:200]})
            except Exception as e:  # noqa: BLE001
                sys.settrace(None)
                res.append({"name": n, "ok": False, "error": type(e).__name__, "detail": str(e)[:200]})
        return res
    r = _run(impl + "\n\n" + tests_code, [], call, files)
    if r.get("line"):  # жол нөмірі оқушы тест кодына қатысты болсын
        r["line"] = r["line"] - impl.count("\n") - 2 if r["line"] > impl.count("\n") + 2 else None
    return r


def judge_tests(tests_code, spec):
    """Оқушы ТЕСТ жазады. spec: {"impl": дұрыс код, "mutants": [{"name", "code"}], "min_tests": n}.
    Талап: (1) кемінде min_tests тест; (2) дұрыс кодта бәрі өтеді; (3) әр мутантта кемінде бір тест құлайды."""
    if isinstance(spec, str):
        spec = json.loads(spec)
    base = _run_tests(spec["impl"], tests_code, spec.get("files"))
    if not base["ok"]:
        return {"ok": False, "stage": "load", **{k: base.get(k) for k in ("error", "line", "detail", "hint")}}
    tests = base["result"]
    report = {"count": len(tests), "on_correct": tests, "mutants": []}
    if len(tests) < spec.get("min_tests", 1):
        report.update({"ok": False, "stage": "count"})
        return report
    if not all(t["ok"] for t in tests):
        report.update({"ok": False, "stage": "correct"})
        return report
    for m in spec["mutants"]:
        r = _run_tests(m["code"], tests_code, spec.get("files"))
        killed = (not r["ok"]) or any(not t["ok"] for t in r["result"])
        report["mutants"].append({"name": m["name"], "killed": killed})
    report["ok"] = all(m["killed"] for m in report["mutants"])
    report["stage"] = "mutants"
    return report


def judge_tests_json(tests_code, spec_json):
    return json.dumps(judge_tests(tests_code, spec_json), ensure_ascii=False)
