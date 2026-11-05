# © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
"""CS Universe: Python Execution Visualizer үшін трассалаушы (academy/labs/python.html).

cslab_trace(code) оқушы кодын НАҚТЫ орындайды (Pyodide-те не CPython-да) және sys.settrace арқылы әр орындалатын жолдың
алдындағы күйді жазады:
  {"ev": "line" | "return", "line": жол, "stack": [{"fn", "line", "vars": [[атау, repr, сілтеме-белгі | None]]}, ...], "out": stdout}
  stack - сыртқыдан (модуль) ішкіге (ағымдағы жақтау) қарай.
Тізім/сөздік/жиын сияқты өзгермелі нысандарға «#1», «#2» белгісі беріледі: екі атауда бір белгі - бір нысан (aliasing).
Шектеу: STEP_LIMIT жолдан кейін тоқтаймыз (шексіз цикл бетті қатырмас үшін). Код оқушының өз браузерінде орындалады.
"""
import builtins
import io
import json
import sys
import types

FILE = "<оқушы коды>"
STEP_LIMIT = 1000
OUT_LIMIT = 5000

MSG = {
    "SyntaxError": "Синтаксис қатесі: Python бұл жолды оқи алмады. Жақша, қос нүкте (:) не тырнақша жетіспеуі мүмкін.",
    "IndentationError": "Шегініс қатесі: блок ішіндегі жолдар бірдей шегініспен (әдетте 4 бос орын) жазылуы керек; if/for/def жолынан кейін шегініс міндетті.",
    "TabError": "Шегіністе Tab пен бос орын араласқан. Тек бос орын қолданыңыз.",
    "NameError": "Анықталмаған атау: бұл айнымалыға не функцияға әлі мән берілмеген, не аты қате жазылған (бас/кіші әріп маңызды).",
    "TypeError": "Түр қатесі: амал бұл түрге жарамайды - мысалы, жол мен санды қосу (str + int) не функцияға аргументтерді қате саны беру.",
    "ValueError": "Мән қатесі: түрі дұрыс, бірақ мәні жарамсыз - мысалы, int('abc').",
    "IndexError": "Индекс шекарадан тыс: n элементті тізімде индекс 0-ден n − 1-ге дейін ғана.",
    "KeyError": "Сөздікте мұндай кілт жоқ.",
    "ZeroDivisionError": "Нөлге бөлу: бөлгіштің мәні 0 болды.",
    "RecursionError": "Рекурсия тым терең: базалық жағдай жоқ не оған жетпейді.",
    "AttributeError": "Нысанда мұндай әдіс не қасиет жоқ (мысалы, санда .append жоқ).",
    "UnboundLocalError": "Функция ішінде айнымалыға мән бермей тұрып оны қолдандыңыз.",
    "InputError": "input() бұл визуализаторда жоқ: мәнді кодқа тікелей жазыңыз (мысалы, n = 5).",
}


class _StepLimit(BaseException):
    pass


class _NoInput(Exception):
    pass


def _short(v, n=60):
    try:
        r = repr(v)
    except Exception:  # noqa: BLE001
        r = "<?>"
    return r if len(r) <= n else r[: n - 3] + "..."


def cslab_trace(code, limit=STEP_LIMIT):
    steps = []
    out = io.StringIO()
    refs = {}
    keep = []  # белгі берілген нысандарды тірі ұстаймыз: id() қайта қолданылмасын

    def ref(v):
        if isinstance(v, (list, dict, set)):
            k = id(v)
            if k not in refs:
                refs[k] = "#%d" % (len(refs) + 1)
                keep.append(v)
            return refs[k]
        return None

    def vars_of(frame):
        return vars_dict(frame.f_locals)

    def vars_dict(d):
        res = []
        for k, v in list(d.items()):
            if k.startswith("__") or isinstance(v, types.ModuleType):
                continue
            if isinstance(v, types.FunctionType):
                res.append([k, "функция " + v.__name__ + "()", None])
                continue
            if isinstance(v, type) or callable(v) and not isinstance(v, (list, dict, set, tuple)):
                continue
            res.append([k, _short(v), ref(v)])
        return res

    def stack_of(frame):
        st = []
        f = frame
        while f is not None and f.f_code.co_filename == FILE:
            st.append({"fn": f.f_code.co_name, "line": f.f_lineno, "vars": vars_of(f)})
            f = f.f_back
        st.reverse()
        return st

    def text():
        s = out.getvalue()
        return s if len(s) <= OUT_LIMIT else "...\n" + s[-OUT_LIMIT:]

    count = [0]

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != FILE:
            return None
        if event == "line":
            count[0] += 1
            if count[0] > limit:
                raise _StepLimit()
            steps.append({"ev": "line", "line": frame.f_lineno, "stack": stack_of(frame), "out": text()})
        elif event == "return" and frame.f_code.co_name != "<module>":
            steps.append({"ev": "return", "line": frame.f_lineno, "stack": stack_of(frame), "out": text(), "ret": _short(arg)})
        return tracer

    def no_input(prompt=""):
        raise _NoInput("input()")

    result = {"ok": True, "truncated": False, "limit": limit}
    try:
        compiled = compile(code, FILE, "exec")
    except SyntaxError as e:  # IndentationError, TabError - SyntaxError ұрпақтары
        name = type(e).__name__
        result.update({"ok": False, "error": name, "line": e.lineno or 0, "detail": e.msg or "", "hint": MSG.get(name, MSG["SyntaxError"]), "steps": [], "out": ""})
        return json.dumps(result, ensure_ascii=False)

    old_in, old_out, old_trace = builtins.input, sys.stdout, sys.gettrace()
    old_rec = sys.getrecursionlimit()
    builtins.input, sys.stdout = no_input, out
    ns = {"__name__": "__main__", "__builtins__": builtins}
    try:
        try:
            sys.setrecursionlimit(min(old_rec, 250))
        except Exception:  # noqa: BLE001
            pass
        sys.settrace(tracer)
        exec(compiled, ns)
        sys.settrace(None)
        steps.append({"ev": "end", "line": 0, "stack": [{"fn": "<module>", "line": 0, "vars": vars_dict(ns)}], "out": text()})
    except _StepLimit:
        result["truncated"] = True
    except BaseException as e:  # noqa: BLE001 - SystemExit, KeyboardInterrupt де оқушы кодынан
        sys.settrace(None)
        tb, line, fr = e.__traceback__, 0, None
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == FILE:
                line, fr = tb.tb_lineno, tb.tb_frame
            tb = tb.tb_next
        name = "InputError" if isinstance(e, _NoInput) else type(e).__name__
        result.update({"ok": False, "error": "input()" if name == "InputError" else name, "line": line, "detail": "" if name == "InputError" else str(e),
                       "hint": MSG.get(name, "Орындау кезінде қате шықты.")})
        if fr is not None:
            result["errStack"] = stack_of(fr)
            result["errStack"][-1]["line"] = line
    finally:
        sys.settrace(old_trace)
        sys.setrecursionlimit(old_rec)
        builtins.input, sys.stdout = old_in, old_out
    if count[0] > limit:  # оқушы коды «except BaseException» арқылы тоқтатуды жұтып қойса да, шектен асқанын айтамыз
        result["truncated"] = True
    result["steps"] = steps
    result["out"] = text()
    return json.dumps(result, ensure_ascii=False)


if __name__ == "__main__":  # CPython-да тез тексеру: python3 assets/py/cslab_trace.py
    r = json.loads(cslab_trace("a = [1]\nb = a\nb.append(2)\nprint(a)\n"))
    print(r["ok"], len(r["steps"]), r["out"].strip(), [s["stack"][-1]["vars"] for s in r["steps"]][-1])
