# © 2026 Sagid Mustafa. All Rights Reserved.
# AO17 CS Universe · Level I · m12 Systems Integration · 1-5 сабақтар. Авторлық мазмұн (AO17 үшін жаңадан жазылған).
# C коды build кезінде gcc-мен, "python-local" мысалдары CPython + gcc-мен (subprocess) тексеріледі.

REFS = [
    "E. S. Raymond, The Art of Unix Programming - модульдік және композиция қағидалары (салыстыру үшін).",
    "RFC 4180 (CSV), RFC 8259 (JSON) - деректер форматтарының сипаттамасы.",
    "Python Software Foundation: subprocess, csv, json, argparse, cProfile, tracemalloc модульдерінің құжаттамасы.",
]
META = {"courseId": "ao17-foundation", "moduleId": "m12", "language": "kk", "academicLevel": "I",
        "license": "ARR", "authorship": "original", "reviewStatus": "author-checked", "version": "1.0.0"}

PIPE = ("def parse(text):\n    \"\"\"'аты,балл' жолдары -> [(аты, балл)]\"\"\"\n    rows = []\n    for line in text.strip().splitlines():\n        name, score = line.split(',')\n        rows.append((name.strip(), int(score)))\n    return rows\n\n"
        "def validate(rows):\n    \"\"\"0..100 сыртындағы баллдарды алып тастайды\"\"\"\n    return [(n, s) for n, s in rows if 0 <= s <= 100]\n\n"
        "def summarize(rows):\n    \"\"\"-> {'count', 'mean', 'best'}\"\"\"\n    scores = [s for _, s in rows]\n    best = max(rows, key=lambda r: r[1])[0] if rows else None\n    return {'count': len(rows), 'mean': round(sum(scores) / len(scores), 1) if rows else 0.0, 'best': best}\n\n"
        "def report(summary):\n    return f\"{summary['count']} оқушы, орташа {summary['mean']}, үздік: {summary['best']}\"\n\n"
        "text = 'Айгүл,92\\nБекзат,78\\nҚате,140\\nДана,85'\nprint(report(summarize(validate(parse(text)))))")

L01 = {
    **META, "id": "ao17-foundation.m12.l01", "slug": "l01", "title": "Бағдарлама жүйе ретінде", "difficulty": 3, "minutes": 45,
    "objectives": [
        "Бағдарламаны компоненттер мен олардың интерфейстеріне (кіріс, шығыс, келісімшарт) бөлу.",
        "Компоненттер композициясының дұрыстығын келісімшарттар арқылы негіздеу.",
        "Конвейер (pipeline) архитектурасын Python-да құру және оның бөліктерін бөлек тестілеу.",
    ],
    "prerequisites": ["ao17-foundation.m11.l10", "ao17-foundation.m09.l10"],
    "concept": "<p>Level I бойы жеке функциялар мен алгоритмдер жаздық. Нақты бағдарлама - олардың <b>жүйесі</b>: деректі оқитын, тексеретін, есептейтін, нәтижені шығаратын компоненттер. Әр компоненттің <b>интерфейсі</b> бар: не қабылдайды, не қайтарады, қандай шарттарды талап етеді және кепілдейді (m07 l03 келісімшарт).</p>"
               "<p>Жақсы жүйеде компоненттер <b>әлсіз байланысты</b>: біреуін ауыстыру (мысалы, CSV орнына JSON оқу) басқаларын өзгертпейді. Unix философиясы: «әр бағдарлама бір нәрсені жақсы істесін, ал бағдарламалар бір-бірімен мәтін арқылы байланыссын». Бұл модуль осы идеяны Python, C және командалық жол арқылы жүзеге асырады.</p>",
    "theory": [
        {"kind": "definition", "title": "Компонент және келісімшарт", "body": "<p>Компонент C: алғышарт Pre_C (кіріс туралы талап) және соңғышарт Post_C (шығыс туралы кепілдік). C дұрыс ⇔ Pre_C орындалғанда шығыс әрқашан Post_C-ны қанағаттандырады.</p>"},
        {"kind": "theorem", "title": "Композиция ережесі", "body": "<p>A мен B дұрыс компоненттер болсын және Post_A ⇒ Pre_B. Онда B ∘ A (A-ның шығысын B-ге беру) Pre_A-дан Post_B-ге дейін дұрыс.</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>x Pre_A-ны қанағаттандырсын. A дұрыс болғандықтан y = A(x) Post_A-ны қанағаттандырады. Post_A ⇒ Pre_B, демек y Pre_B-ні қанағаттандырады. B дұрыс болғандықтан B(y) Post_B-ні қанағаттандырады. Сонымен кез келген Pre_A кірісі үшін B(A(x)) ∈ Post_B. ∎ Конвейердегі әр «түйіспе» (Post_A ⇒ Pre_B) - тексерілетін интерфейс: интеграциялық қателердің көбі осы импликацияның бұзылуы (9-сабақ).</p>"},
        {"kind": "note", "title": "Әлсіз байланыс", "body": "<p>Компоненттер тек интерфейс арқылы сөйлессе (ортақ жаһандық айнымалысыз), әрқайсысын бөлек тестілеп, бөлек ауыстыруға болады. Бұл m07 l09 абстракция қабаттарының жүйелік деңгейдегі нұсқасы.</p>"},
    ],
    "visual": {"lab": "pyrun", "code": PIPE, "stdin": "",
               "caption": "Төрт компонент: parse → validate → summarize → report. validate-тің Post-шарты (0 ≤ балл ≤ 100) summarize-дің Pre-шартын қамтамасыз етеді. 'Қате,140' жазбасы өтпеді."},
    "derivation": [
        "Есеп: бағалар файлынан есеп шығару.",
        "Компоненттер: оқу (мәтін → жазбалар), тексеру (жазбалар → жарамды жазбалар), есептеу (→ статистика), шығару (→ мәтін).",
        "Әр интерфейсті жазу: parse: str → list[tuple[str, int]]; summarize-дің алғышарты: баллдар 0..100.",
        "Әр компонентке бөлек тест; сосын тұтас конвейерге бір тест (интеграция).",
    ],
    "examples": [
        {"title": "Компонентті ауыстыру: CSV орнына JSON", "lang": "python",
         "code": "import json\n\n" + PIPE.split("text = ")[0] + "def parse_json(text):\n    return [(r['name'], int(r['score'])) for r in json.loads(text)]\n\ncsv_text = 'Айгүл,92\\nБекзат,78'\njson_text = '[{\"name\": \"Айгүл\", \"score\": 92}, {\"name\": \"Бекзат\", \"score\": 78}]'\nfor reader, data in [(parse, csv_text), (parse_json, json_text)]:\n    print(report(summarize(validate(reader(data)))))",
         "output": "2 оқушы, орташа 85.0, үздік: Айгүл\n2 оқушы, орташа 85.0, үздік: Айгүл",
         "explain": "parse_json дәл сол интерфейсті (list[tuple[str, int]]) береді, сондықтан қалған үш компонент өзгерген жоқ. Әлсіз байланыстың практикалық пайдасы."},
    ],
    "experiment": {"lab": "pyrun", "code": PIPE.replace("text = 'Айгүл,92\\nБекзат,78\\nҚате,140\\nДана,85'", "text = 'Айгүл,92\\nҚате,140'").replace("print(report(summarize(validate(parse(text)))))", "print(report(summarize(parse(text))))  # validate өткізіліп кетті"), "stdin": "",
                   "task": "validate алынып тасталды: summarize-дің алғышарты бұзылды, «орташа 116.0» - мағынасыз нәтиже, бірақ қате жоқ. Композиция ережесінің бұзылуы көбіне үнсіз. Шартты тексеретін assert қосыңыз (m08 l08)."},
    "exercises": [
        {"type": "pycode", "q": "pipeline(*funcs) - функциялар тізбегін бір функцияға біріктірсін: pipeline(f, g, h)(x) = h(g(f(x))). Бос тізбек - тепе-теңдік функция.", "mode": "io",
         "suffix": "inc = lambda x: x + 1\ndbl = lambda x: x * 2\nprint(pipeline(inc, dbl)(5), pipeline(dbl, inc)(5), pipeline()(7))\nprint(pipeline(str.strip, str.upper, len)('  ата '))",
         "starter": "def pipeline(*funcs):\n    return funcs[-1]\n",
         "tests": [{"stdin": "", "stdout": "12 11 7\n3"}],
         "solution": "def pipeline(*funcs):\n    def run(x):\n        for f in funcs:\n            x = f(x)\n        return x\n    return run",
         "hints": ["Ішкі функция x-ті әр f арқылы өткізеді (m07 l07).", "Реті: бірінші берілген - бірінші орындалады."]},
        {"type": "pycode", "q": "check_interface(rows) - parse-тің Post-шартын тексерсін: тізім, әр элемент (жол, бүтін сан) жұбы (кортеж не тізім); бұзылса бірінші бұзылған элементтің индексін, бәрі дұрыс болса -1 қайтарсын.", "mode": "func", "func": "check_interface",
         "starter": "def check_interface(rows):\n    return -1\n",
         "tests": [{"args": [[["Айгүл", 92], ["Бек", 78]]], "expect": -1}, {"args": [[["Айгүл", 92], ["Бек", "78"]]], "expect": 1}, {"args": [[[5, 1]]], "expect": 0}, {"args": [[]], "expect": -1}, {"args": [[["a", 1, 2]]], "expect": 0}, {"args": [[["a", True]]], "expect": 0}],
         "solution": "def check_interface(rows):\n    for i, r in enumerate(rows):\n        ok = isinstance(r, (list, tuple)) and len(r) == 2 and isinstance(r[0], str) and isinstance(r[1], int) and not isinstance(r[1], bool)\n        if not ok:\n            return i\n    return -1",
         "hints": ["Ұзындық 2, бірінші - str, екінші - int (bool емес, m08 l10)."]},
        {"type": "mc", "q": "Композиция ережесінде B ∘ A дұрыс болуы үшін қай шарт қажет?", "options": ["Pre_A ⇒ Pre_B", "Post_A ⇒ Pre_B", "Post_B ⇒ Pre_A", "A мен B бір файлда"], "answer": 1,
         "why": ["B A-ның шығысын алады, кірісін емес.", "Дұрыс.", "Бағыт керісінше.", "Қатысы жоқ."], "hints": ["A-ның кепілдігі B-нің талабын жабуы керек."]},
        {"type": "order", "q": "Жүйені жобалау қадамдарын ретке қойыңыз.", "steps": ["Есепті компоненттерге бөлу.", "Әр компоненттің интерфейсін (кіріс, шығыс, шарттар) жазу.", "Компоненттерді жеке іске асырып, бірлік тесттермен тексеру.", "Компоненттерді біріктіріп, интеграциялық тестпен тексеру."],
         "hints": ["Интерфейс іске асырудан бұрын."]},
    ],
    "reasoning": "<p>Жүйелік ойлау - Level I-дің қорытындысы: логика (m01) келісімшарттарды жазуға, дәлелдеу (m02) композицияны негіздеуге, деректер құрылымдары (m08) интерфейстерді таңдауға, тестілеу (m08) әр түйіспені тексеруге көмектеседі. Үлкен бағдарламалар «ақылды кодпен» емес, анық шекаралармен сенімді болады.</p>",
    "mistakes": [
        {"mistake": "Компоненттер жаһандық айнымалылар арқылы сөйлеседі.", "why": "Жасырын тәуелділік: біреуін өзгерту басқасын сындырады.", "fix": "Деректі тек аргумент пен қайтару мәні арқылы беру."},
        {"mistake": "Интерфейсті құжатсыз қалдыру («түсінікті ғой»).", "why": "Келесі адам (не 3 айдан кейінгі сіз) Pre/Post шарттарын білмейді.", "fix": "Docstring-те кіріс, шығыс, шарттар (8-сабақ)."},
    ],
    "assessment": [
        {"type": "pycode", "q": "Конвейердің parse компонентін қате жазбаларға төзімді етіңіз: parse_safe(text) - (жарамды жазбалар тізімі, қате жолдардың нөмірлері (1-ден)) кортежін қайтарсын. Жарамды жол: 'аты,бүтін_сан'.", "mode": "func", "func": "parse_safe",
         "starter": "def parse_safe(text):\n    rows = []\n    for line in text.strip().splitlines():\n        name, score = line.split(',')\n        rows.append((name.strip(), int(score)))\n    return rows, []\n",
         "tests": [{"args": ["Айгүл,92\nБекзат\nДана,8x\nЕрлан,70"], "expect": [[["Айгүл", 92], ["Ерлан", 70]], [2, 3]]}, {"args": [""], "expect": [[], []]}, {"args": ["a,1,2\nb, 5"], "expect": [[["b", 5]], [1]]}],
         "solution": "def parse_safe(text):\n    rows, bad = [], []\n    for i, line in enumerate(text.splitlines(), 1):\n        parts = line.split(',')\n        if len(parts) != 2:\n            bad.append(i)\n            continue\n        try:\n            rows.append((parts[0].strip(), int(parts[1])))\n        except ValueError:\n            bad.append(i)\n    return rows, bad",
         "hints": ["enumerate(..., 1) - жол нөмірлері 1-ден.", "split(',') ұзындығы 2 емес - қате; int() ValueError - қате (m08 l07).", "int(' 5') бос орынды кешіреді."]},
        {"type": "mc", "q": "Әлсіз байланысқан жүйенің басты пайдасы:", "options": ["Код қысқа", "Компонентті басқаларын өзгертпей ауыстыруға және бөлек тестілеуге болады", "Жылдамдық", "Жад аз"], "answer": 1,
         "why": ["Міндетті емес.", "Дұрыс (мысал: parse → parse_json).", "Тікелей әсері жоқ.", "Тікелей әсері жоқ."], "hints": ["Мысал."]},
    ],
    "reflection": ["Өзіңіз жазған ең үлкен бағдарламаны компоненттерге бөліңіз. Қай түйіспеде интерфейс анық емес?"],
    "further": {"honors": ["m08 p08 жобаңызды (Data Validation Toolkit) конвейер ретінде қайта құрып, әр түйіспеге (Post ⇒ Pre) assert қосыңыз."],
                "research": ["Микросервистер мен монолит архитектурасы: «әлсіз байланыс» қағидасы желі арқылы қалай жүзеге асырылады және оның бағасы қандай?"]},
    "references": REFS,
}

ARGS_C = '#include <stdio.h>\n#include <stdlib.h>\n\nint main(int argc, char *argv[])\n{\n    printf("argc = %d\\n", argc);\n    for (int i = 0; i < argc; i++)\n        printf("argv[%d] = %s\\n", i, i == 0 ? "./prog" : argv[i]);\n    if (argc < 2) {\n        fprintf(stderr, "қолданылуы: %s N...\\n", argv[0]);\n        return 2;\n    }\n    long sum = 0;\n    for (int i = 1; i < argc; i++)\n        sum += strtol(argv[i], NULL, 10);\n    printf("қосынды = %ld\\n", sum);\n    return argv[argc] == NULL ? 0 : 1;\n}'

L02 = {
    **META, "id": "ao17-foundation.m12.l02", "slug": "l02", "title": "Командалық жол", "difficulty": 3, "minutes": 50,
    "objectives": [
        "C-да argc/argv және Python-да sys.argv арқылы аргументтерді оқу.",
        "Шығу кодын (0 - сәтті, ≠ 0 - қате) жүйелік интерфейс ретінде қолдану.",
        "Аргументтерді тексеру: strtol-дың endptr-і, қолдану туралы хабар (usage) stderr-ге.",
    ],
    "prerequisites": ["ao17-foundation.m12.l01", "ao17-foundation.m10.l08"],
    "concept": "<p>Командалық жол бағдарламасының интерфейсі үш бөлік: <b>аргументтер</b> (./prog 3 5 7), <b>стандартты ағындар</b> (stdin, stdout, stderr) және <b>шығу коды</b>. C-да <code>int main(int argc, char *argv[])</code>: argc - аргументтер саны (бағдарлама атауымен бірге), argv - жолдар массиві. Python-да <code>sys.argv</code> тізімі.</p>"
               "<p>Жақсы командалық жол бағдарламасы: нәтижені stdout-қа, қате хабарларын stderr-ге жазады (сонда құбыр | арқылы тек нәтиже беріледі), және қате кезінде нөлдік емес код қайтарады - сонда басқа бағдарламалар (shell, Python, CI) сәттілікті тексере алады.</p>",
    "theory": [
        {"kind": "definition", "title": "argc және argv", "body": "<p>argv[0] - бағдарлама атауы (не бос жол), argv[1..argc−1] - аргументтер, бәрі жол. Сандарды strtol/atoi арқылы түрлендіру керек. Shell бос орындар бойынша бөледі; тырнақшалар \"бір аргумент\" жасайды.</p>"},
        {"kind": "theorem", "title": "argv массивінің құрылымы", "body": "<p>C11 бойынша argc ≥ 0 және argv[argc] == NULL; демек argv массивін NULL-ға дейін аралау (for (char **p = argv; *p; p++)) argc-ты білмей-ақ барлық аргументті береді.</p>"},
        {"kind": "proof", "title": "Негіздеу", "body": "<p>C11 5.1.2.2.1/2: «argc мәні теріс емес; argv[argc] нөлдік көрсеткіш болуы керек; argv[0]..argv[argc−1] жолдарға көрсетеді». Демек argv - argc жол көрсеткішінен кейін NULL-мен аяқталатын тізбек. *p == NULL тексерісі дәл argc қадамнан кейін ақиқат болады (бұрынғылары жолдарға көрсетеді, яғни NULL емес), сондықтан цикл барлық аргументті аралап, массивтен шықпай тоқтайды. ∎ (Бұл - жолдардың '\\0'-мен аяқталуының (m10 l07) көрсеткіштер деңгейіндегі ұқсасы.)</p>"},
        {"kind": "note", "title": "strtol-ды дұрыс қолдану", "body": "<p>atoi(\"12x\") = 12 - қате байқалмайды. strtol(s, &amp;end, 10): end - бірінші түрленбеген таңба; *end != '\\0' не end == s болса - жол толық сан емес.</p>"},
    ],
    "visual": {"lab": "cshow", "code": ARGS_C, "args": ["3", "5", "7"], "output": "argc = 4\nargv[0] = ./prog\nargv[1] = 3\nargv[2] = 5\nargv[3] = 7\nқосынды = 15",
               "caption": "argc = 4 (бағдарлама атауы да саналады). Соңғы тексеріс argv[argc] == NULL - шығу коды 0 (теорема). argv[0] нақты жолы build ортасына тәуелді болғандықтан ./prog деп шығарылды."},
    "derivation": [
        "Есеп: ./stats 3 5 x командасы - x сан емес.",
        "for i in 1..argc−1: long v = strtol(argv[i], &end, 10);",
        "if (end == argv[i] || *end != '\\0') { fprintf(stderr, \"сан емес: %s\\n\", argv[i]); return 2; }",
        "Shell-де: ./stats 3 5 x; echo $? → 2. Python-да: subprocess.run(...).returncode == 2.",
    ],
    "examples": [
        {"title": "Тексерілген аргументтер және шығу коды", "lang": "c", "args": ["10", "-4", "x7"], "exit": 2,
         "code": '#include <stdio.h>\n#include <stdlib.h>\n\nint parse_long(const char *s, long *out)\n{\n    char *end;\n    long v = strtol(s, &end, 10);\n    if (end == s || *end != \'\\0\')\n        return 0;\n    *out = v;\n    return 1;\n}\n\nint main(int argc, char *argv[])\n{\n    long sum = 0;\n    int bad = 0;\n    for (char **p = argv + 1; *p; p++) {\n        long v;\n        if (parse_long(*p, &v))\n            sum += v;\n        else {\n            fprintf(stderr, "сан емес: %s\\n", *p);\n            bad++;\n        }\n    }\n    printf("%ld\\n", sum);\n    printf("аргумент: %d, қате: %d\\n", argc - 1, bad);\n    return bad ? 2 : 0;\n}',
         "output": "6\nаргумент: 3, қате: 1",
         "explain": "argv-ді NULL-ға дейін көрсеткішпен араладық (теорема). 'x7' strtol-дан өтпеді: end == s. Нәтиже stdout-та, қате stderr-де, шығу коды 2 - build оны тексерді."},
    ],
    "experiment": {"lab": "pyrun", "code": "import sys\n\ndef main(argv):\n    if len(argv) < 2:\n        print(f'қолданылуы: {argv[0]} N...', file=sys.stderr)\n        return 2\n    try:\n        nums = [int(a) for a in argv[1:]]\n    except ValueError as e:\n        print('қате:', e, file=sys.stderr)\n        return 2\n    print(sum(nums))\n    return 0\n\nfor args in [['stats.py', '3', '5', '7'], ['stats.py'], ['stats.py', '4', 'x']]:\n    code = main(args)\n    print('  шығу коды:', code)", "stdin": "",
                   "task": "Python нұсқасы: main(argv) функциясы sys.argv-ті параметр ретінде алады - сондықтан оны тесттен шақыруға болады. Нақты скриптте соңында: sys.exit(main(sys.argv)). Зертхана stderr-ді бөлек көрсетеді - қате хабарлары нәтижеден (stdout) ажыратылғанын көресіз."},
    "exercises": [
        {"type": "coutput", "q": "Бағдарлама ./prog алма 42 \"а б\" командасымен іске қосылды (тырнақшадағы - бір аргумент). Не шығарады?", "code": '#include <stdio.h>\n#include <string.h>\n\nint main(int argc, char *argv[])\n{\n    printf("%d\\n", argc);\n    size_t total = 0;\n    for (int i = 1; i < argc; i++)\n        total += strlen(argv[i]);\n    printf("%zu %s\\n", total, argv[argc - 1]);\n    return 0;\n}', "args": ["алма", "42", "а б"], "answer": "4\n15 а б",
         "hints": ["argc = 1 + 3.", "strlen - байттар (m10 l07): алма 8, 42 - 2, «а б» - 2 + 1 + 2."]},
        {"type": "pycode", "q": "parse_args(argv) - ['prog', '--name', 'Айгүл', '-v', 'file.txt'] сияқты тізімнен сөздік қайтарсын: {'name': 'Айгүл', 'v': True, 'files': ['file.txt']}. '--key value' - мән, '-x' - жалауша (True), қалғаны - files.", "mode": "func", "func": "parse_args",
         "starter": "def parse_args(argv):\n    return {'files': argv[1:]}\n",
         "tests": [{"args": [["prog", "--name", "Айгүл", "-v", "file.txt"]], "expect": {"name": "Айгүл", "v": True, "files": ["file.txt"]}}, {"args": [["prog"]], "expect": {"files": []}}, {"args": [["prog", "a", "-q", "b", "--out", "r.csv"]], "expect": {"q": True, "out": "r.csv", "files": ["a", "b"]}}],
         "solution": "def parse_args(argv):\n    out, files, i = {}, [], 1\n    while i < len(argv):\n        a = argv[i]\n        if a.startswith('--'):\n            out[a[2:]] = argv[i + 1]\n            i += 2\n            continue\n        if a.startswith('-'):\n            out[a[1:]] = True\n        else:\n            files.append(a)\n        i += 1\n    out['files'] = files\n    return out",
         "hints": ["argv[0] - бағдарлама атауы, өткізіңіз.", "'--' мәнді келесі элементтен алады - i += 2."]},
        {"type": "mc", "q": "Неге қате хабарын stdout-қа емес, stderr-ге жазу керек?", "options": ["stderr жылдам", "./prog | next құбырында нәтиже ғана келесі бағдарламаға барады, ал қате экранда қалады", "stdout қатені көрсете алмайды", "Талап жоқ"], "answer": 1,
         "why": ["Жылдамдық себеп емес.", "Дұрыс.", "Көрсете алады, бірақ деректі бүлдіреді.", "Бұл - конвенция, бірақ маңызды."], "hints": ["Құбыр (pipe)."]},
        {"type": "coutput", "q": "Бағдарлама ./prog 12 3x \"\" 007 командасымен іске қосылды. Не шығарады?", "code": '#include <stdio.h>\n#include <stdlib.h>\n\nint main(int argc, char *argv[])\n{\n    for (int i = 1; i < argc; i++) {\n        char *end;\n        long v = strtol(argv[i], &end, 10);\n        int ok = end != argv[i] && *end == \'\\0\';\n        printf("%ld:%d atoi=%d\\n", v, ok, atoi(argv[i]));\n    }\n    return 0;\n}', "args": ["12", "3x", "", "007"], "answer": "12:1 atoi=12\n3:0 atoi=3\n0:0 atoi=0\n7:1 atoi=7",
         "hints": ["'3x' - 3 оқылды, бірақ end 'x'-те.", "Бос жол: end == s.", "atoi қатені ажырата алмайды."]},
    ],
    "reasoning": "<p>Командалық жол - бағдарламалар арасындағы ең көне және ең тұрақты интерфейс: 50 жылдан бері өзгерген жоқ. Аргументтер + ағындар + шығу коды - кез келген тілде жазылған бағдарламаларды біріктіруге жеткілікті (4-сабақ). CI жүйелері (GitHub Actions) дәл осы шығу кодтарына сүйенеді.</p>",
    "mistakes": [
        {"mistake": "atoi арқылы түрлендіріп, қатені тексермеу.", "why": "'12x' → 12, 'abc' → 0 - қате үнсіз.", "fix": "strtol + endptr не Python-да int() + try."},
        {"mistake": "Қате болса да 0 қайтару.", "why": "Shell, CI, Python бағдарлама сәтті деп ойлайды.", "fix": "return 1/2 не exit(EXIT_FAILURE)."},
    ],
    "assessment": [
        {"type": "pycode", "q": "Python командалық жол бағдарламасының ядросы: run(argv) - (stdout мәтіні, шығу коды) кортежін қайтарсын. argv[1:] - сандар; бәрі бүтін болса - қосындысы, код 0; аргумент жоқ - ('', 2); қате сан болса - ('', 1).", "mode": "func", "func": "run",
         "starter": "def run(argv):\n    return str(sum(int(a) for a in argv[1:])), 0\n",
         "tests": [{"args": [["p", "3", "5"]], "expect": ["8", 0]}, {"args": [["p"]], "expect": ["", 2]}, {"args": [["p", "4", "x"]], "expect": ["", 1]}, {"args": [["p", "-2", "2"]], "expect": ["0", 0]}],
         "solution": "def run(argv):\n    if len(argv) < 2:\n        return '', 2\n    try:\n        return str(sum(int(a) for a in argv[1:])), 0\n    except ValueError:\n        return '', 1",
         "hints": ["Алдымен аргументтер санын тексеру.", "int() ValueError."]},
        {"type": "mc", "q": "./prog a b c үшін argv[argc] неге тең?", "options": ["\"c\"", "NULL", "Анықталмаған", "\"\""], "answer": 1,
         "why": ["Бұл argv[3] = argv[argc − 1].", "Дұрыс (теорема).", "Стандарт анықтайды.", "Бос жол емес."], "hints": ["argc = 4."]},
    ],
    "reflection": ["Сіз күнделікті қолданатын командалық жол бағдарламалары (git, python, gcc) қандай аргументтер мен шығу кодтарын қолданады?"],
    "further": {"honors": ["Python argparse модулімен parse_args тапсырмасын қайта жазыңыз: --help автоматты жасалады. Сіздің қолмен жазғаныңыздан не артық?"],
                "research": ["POSIX getopt және GNU getopt_long: қысқа (-v) және ұзын (--verbose) опциялардың тарихы мен конвенциялары."]},
    "references": REFS,
}

L03 = {
    **META, "id": "ao17-foundation.m12.l03", "slug": "l03", "title": "Деректер форматтары", "difficulty": 3, "minutes": 50,
    "objectives": [
        "CSV форматын (RFC 4180: тырнақша, үтір, жаңа жол өріс ішінде) дұрыс оқу және жазу.",
        "JSON-ның типтер жүйесін Python-мен салыстыру және сериализация/десериализация жасау.",
        "Форматтың «айналып келу» (round-trip) қасиетін тексеру.",
    ],
    "prerequisites": ["ao17-foundation.m12.l02", "ao17-foundation.m08.l05"],
    "concept": "<p>Бағдарламалар арасындағы деректің ортақ тілі - <b>мәтіндік форматтар</b>. CSV - кестелер үшін: жол - жазба, үтір - өріс бөлгіш. Бірақ өріс ішінде үтір болса («Алматы, Қазақстан») - өріс тырнақшаға алынады, ал ішіндегі тырнақша екі еселенеді (\"\"). split(',') бұл ережелерді білмейді (m08 l06 ескертуі).</p>"
               "<p>JSON - ішкі құрылымдар үшін (m08 l05): нысан, массив, жол, сан, true/false, null. Негізгі сапа өлшемі - <b>айналып келу</b>: дерек → мәтін → дерек өзгеріссіз қайтуы керек. Бұл қасиетті тесттермен тексереміз.</p>",
    "theory": [
        {"kind": "definition", "title": "CSV тырнақша ережесі", "body": "<p>Өрісте үтір, тырнақша не жаңа жол болса, ол \"...\" ішіне алынады; ішіндегі әр \" таңбасы \"\" болып жазылады. Мысал: Ол \"жақсы\" деді → \"Ол \"\"жақсы\"\" деді\".</p>"},
        {"kind": "theorem", "title": "Тырнақшаны екі еселеу қайтымды", "body": "<p>escape(s) = '\"' + s.replace('\"', '\"\"') + '\"' болса, кез келген s жолы үшін unescape(escape(s)) = s, мұнда unescape сыртқы тырнақшаларды алып, \"\" жұптарын \" етеді.</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>escape нәтижесінің ішкі бөлігі t = s.replace('\"', '\"\"'). t-да \" таңбалары тек жұп-жұбымен кездеседі: әр жұп s-тегі бір \"-тан шыққан, ал s-тің басқа таңбалары өзгермеді. unescape t-ны солдан оңға оқып, әр \"\" жұбын бір \"-ке ауыстырады; жұптар қиылыспайды (әрқайсысы s-тің бір таңбасына сәйкес), сондықтан әр жұп дәл бір рет ауыстырылып, басқа таңбалар өзгермейді. Нәтиже - s. ∎ Сондай-ақ escape(s) ішінде «жалғыз» тырнақша жоқ - сол себепті оқырман өрістің соңын (жалғыз \" + үтір) қатесіз табады.</p>"},
        {"kind": "note", "title": "JSON шектеулері", "body": "<p>JSON-да кортеж жоқ (тізімге айналады), кілттер тек жол (m08 l05: {1: 'a'} → {\"1\": \"a\"}), NaN/Infinity стандартта жоқ, үлкен бүтін сандар JavaScript-те 2⁵³-тен кейін дәлдігін жоғалтады (AO17 Judge ережесі, m07). Айналып келу әрқашан бола бермейді!</p>"},
    ],
    "visual": {"lab": "pyrun", "code": "import csv, io, json\n\nrows = [['қала', 'ескерту'], ['Алматы, Қазақстан', 'Ол \"жақсы\" деді'], ['Астана', 'көп\\nжолды']]\nbuf = io.StringIO()\ncsv.writer(buf).writerows(rows)\ntext = buf.getvalue()\nprint(text)\nback = list(csv.reader(io.StringIO(text)))\nprint('csv айналып келді:', back == rows)\nprint('split қатесі:', text.splitlines()[1].split(','))\n\ndata = {'id': 7, 'tags': ('a', 'b'), 1: None}\ns = json.dumps(data, ensure_ascii=False)\nprint(s, '| айналып келді:', json.loads(s) == data)", "stdin": "",
               "caption": "csv модулі тырнақша ережесін өзі қолданды (теорема). JSON-да кортеж тізімге, 1 кілті '1' жолына айналды - айналып келмеді."},
    "derivation": [
        "Есеп: CSV жолын өрістерге бөлу (тырнақшаны ескеріп).",
        "Күй: in_quotes (тырнақша ішіндеміз бе), ағымдағы өріс.",
        "Таңба \": тырнақша ішінде және келесісі де \" - бір \" қосу (екі еселенген); әйтпесе in_quotes-ті ауыстыру.",
        "Таңба , және in_quotes жалған - өріс бітті. Бұл - соңғы автомат (Level II-де толық қарастырылады).",
    ],
    "examples": [
        {"title": "CSV ↔ JSON түрлендіргіш", "lang": "python",
         "code": "import csv, io, json\n\ncsv_text = 'name,score,city\\nАйгүл,92,\"Алматы, ҚР\"\\nБекзат,78,Астана\\n'\nrecords = list(csv.DictReader(io.StringIO(csv_text)))\nfor r in records:\n    r['score'] = int(r['score'])\njs = json.dumps(records, ensure_ascii=False, indent=1)\nprint(js)\nback = json.loads(js)\nout = io.StringIO()\nw = csv.DictWriter(out, fieldnames=['name', 'score', 'city'], lineterminator='\\n')\nw.writeheader()\nw.writerows(back)\nprint(out.getvalue() == csv_text)",
         "output": "[\n {\n  \"name\": \"Айгүл\",\n  \"score\": 92,\n  \"city\": \"Алматы, ҚР\"\n },\n {\n  \"name\": \"Бекзат\",\n  \"score\": 78,\n  \"city\": \"Астана\"\n }\n]\nTrue",
         "explain": "CSV-да бәрі жол - score-ды int-ке аудардық (типтер JSON-да сақталады). CSV → JSON → CSV айналымы бастапқы мәтінді дәл қайтарды."},
    ],
    "experiment": {"lab": "pyrun", "code": "import json\n\nfor value in [2 ** 53, 2 ** 53 + 1, 0.1 + 0.2, float('nan')]:\n    s = json.dumps(value)\n    back = json.loads(s)\n    same = back == value\n    print(f'{s:22} айналып келді: {same}')", "stdin": "",
                   "task": "Python-да 2⁵³ + 1 айналып келеді, бірақ JavaScript оқыса - 2⁵³ болады (m07 ережесі). NaN JSON стандартында жоқ (Python NaN деп жазады - басқа тілдер оқымауы мүмкін), ал NaN ≠ NaN. Деректі алмасқанда осы шектерді біліңіз."},
    "exercises": [
        {"type": "pycode", "q": "split_csv_line(line) - бір CSV жолын өрістерге бөлсін (RFC 4180: тырнақшалы өрістер, ішіндегі \"\" → \"). csv модулінсіз.", "mode": "func", "func": "split_csv_line",
         "starter": "def split_csv_line(line):\n    return line.split(',')\n",
         "tests": [{"args": ["a,b,c"], "expect": ["a", "b", "c"]}, {"args": ["\"Алматы, ҚР\",5"], "expect": ["Алматы, ҚР", "5"]}, {"args": ["\"Ол \"\"иә\"\" деді\",x"], "expect": ["Ол \"иә\" деді", "x"]}, {"args": ["a,,\"\""], "expect": ["a", "", ""]}, {"args": [""], "expect": [""]}],
         "solution": "def split_csv_line(line):\n    fields, cur, i, q = [], [], 0, False\n    while i < len(line):\n        ch = line[i]\n        if q:\n            if ch == '\"' and i + 1 < len(line) and line[i + 1] == '\"':\n                cur.append('\"')\n                i += 1\n            elif ch == '\"':\n                q = False\n            else:\n                cur.append(ch)\n        elif ch == '\"':\n            q = True\n        elif ch == ',':\n            fields.append(''.join(cur))\n            cur = []\n        else:\n            cur.append(ch)\n        i += 1\n    fields.append(''.join(cur))\n    return fields",
         "hints": ["Күй: тырнақша ішіндеміз бе (q).", "q кезінде \"\" - бір \"; жалғыз \" - q бітті.", "q жоқ кезде үтір - өріс шекарасы."]},
        {"type": "pycode", "q": "csv_escape(s) - өрісті CSV-ға жазу: үтір, тырнақша не жаңа жол болса тырнақшаға алып, ішкі \"-ты екі еселесін; әйтпесе өзгеріссіз.", "mode": "func", "func": "csv_escape",
         "starter": "def csv_escape(s):\n    return '\"' + s + '\"'\n",
         "tests": [{"args": ["Астана"], "expect": "Астана"}, {"args": ["Алматы, ҚР"], "expect": "\"Алматы, ҚР\""}, {"args": ["Ол \"иә\""], "expect": "\"Ол \"\"иә\"\"\""}, {"args": ["a\nb"], "expect": "\"a\nb\""}],
         "solution": "def csv_escape(s):\n    if any(c in s for c in ',\"\\n'):\n        return '\"' + s.replace('\"', '\"\"') + '\"'\n    return s",
         "hints": ["Тек қажет болғанда тырнақша.", "Теорема: replace('\"', '\"\"')."]},
        {"type": "mc", "q": "json.loads(json.dumps({'a': (1, 2)})) нәтижесі:", "options": ["{'a': (1, 2)}", "{'a': [1, 2]}", "Қате", "{'a': '(1, 2)'}"], "answer": 1,
         "why": ["JSON-да кортеж жоқ.", "Дұрыс: массив → тізім.", "dumps кортежді қабылдайды.", "Жолға айналмайды."], "hints": ["JSON типтері."]},
        {"type": "mc", "q": "Қай жағдайда CSV емес, JSON таңдау орынды?", "options": ["Қарапайым кесте (Excel)", "Ішкі құрылымдар: оқушының бағалар тізімі және мекенжайы (нысан)", "Миллион жол сандар", "Ешқашан"], "answer": 1,
         "why": ["CSV ыңғайлы.", "Дұрыс: иерархия.", "CSV ықшамырақ.", "Екеуінің де орны бар."], "hints": ["Кесте мен ағаш."]},
    ],
    "reasoning": "<p>Формат - келісімшарт (1-сабақ) мәтін деңгейінде: жазушы мен оқушы бірдей ережелерді ұстануы керек. Өз «жеңіл» форматыңызды ойлап табудың орнына стандартқа (RFC) сүйеніңіз - шеткі жағдайларды (тырнақша, кодтау, үлкен сандар) басқалар сіз үшін ойлап қойған.</p>",
    "mistakes": [
        {"mistake": "CSV-ды split(',') арқылы оқу.", "why": "Тырнақшадағы үтір өрісті бөліп жібереді.", "fix": "csv модулі не толық автомат."},
        {"mistake": "JSON айналымы әрқашан дәл деп ойлау.", "why": "Кортеж, сан кілттер, NaN, үлкен сандар өзгереді.", "fix": "Айналым тестін жазу; шектерді құжаттау."},
    ],
    "assessment": [
        {"type": "pycode", "q": "to_csv(rows) - жолдар тізімдерінің тізімін CSV мәтініне айналдырсын (әр өріс csv_escape ережесімен, жолдар '\\n'-мен бітеді). split_csv_line-мен айналым тексеріледі.", "mode": "io",
         "suffix": "rows = [['a', 'b, c'], ['Ол \"иә\"', ''], ['x', 'y']]\ntext = to_csv(rows)\nprint(repr(text))\nprint([l for l in text.split('\\n') if l] == ['a,\"b, c\"', '\"Ол \"\"иә\"\"\",', 'x,y'])",
         "starter": "def to_csv(rows):\n    return '\\n'.join(','.join(r) for r in rows)\n",
         "tests": [{"stdin": "", "stdout": "'a,\"b, c\"\\n\"Ол \"\"иә\"\"\",\\nx,y\\n'\nTrue"}],
         "solution": "def csv_escape(s):\n    if any(c in s for c in ',\"\\n'):\n        return '\"' + s.replace('\"', '\"\"') + '\"'\n    return s\n\ndef to_csv(rows):\n    return ''.join(','.join(csv_escape(f) for f in r) + '\\n' for r in rows)",
         "hints": ["Әр өріске csv_escape.", "Әр жол соңында '\\n'."]},
        {"type": "mc", "q": "«Айналып келу» тесті нені тексереді?", "options": ["Жылдамдықты", "deserialize(serialize(x)) == x - формат ақпаратты жоғалтпайтынын", "Файл өлшемін", "Кодтауды"], "answer": 1,
         "why": ["Жылдамдыққа қатысы жоқ.", "Дұрыс.", "Жоқ.", "Тек бір бөлігі."], "hints": ["Барып, қайту."]},
    ],
    "reflection": ["Сіздің деректеріңіз (сабақ кестесі, бағалар) үшін CSV пе, JSON ба? Айналымда не жоғалуы мүмкін?"],
    "further": {"honors": ["CSV-да жаңа жолы бар өрісті (\"көп\\nжолды\") қолдайтын толық оқырман жазыңыз: жол бойынша емес, таңба бойынша оқу керек."],
                "research": ["Екілік форматтар (Protocol Buffers, MessagePack) мәтіндік JSON-нан немен ерекшеленеді? Қашан қолданылады?"]},
    "references": REFS,
}

CPROG = '#include <stdio.h>\n#include <stdlib.h>\n\nint main(int argc, char *argv[])\n{\n    long n = argc > 1 ? strtol(argv[1], NULL, 10) : 10;\n    double x = 0.0;\n    long long sq = 0;\n    for (long i = 1; i <= n; i++) {\n        x += 0.1;\n        sq += (long long)i * i;\n    }\n    printf("n=%ld\\nsum=%.17g\\nsquares=%lld\\n", n, x, sq);\n    return 0;\n}'

L04 = {
    **META, "id": "ao17-foundation.m12.l04", "slug": "l04", "title": "Python мен C бірге", "difficulty": 4, "minutes": 60,
    "objectives": [
        "Python-дан C бағдарламасын subprocess арқылы компиляциялап, іске қосып, шығысын өңдеу.",
        "Бағдарламалар арасындағы мәтіндік протоколды (кілт=мән жолдары) жобалау.",
        "Сандарды мәтін арқылы дәл беру шартын (%.17g) түсіндіру.",
    ],
    "prerequisites": ["ao17-foundation.m12.l03", "ao17-foundation.m10.l10"],
    "concept": "<p>Python - «желім» тілі: ол басқа бағдарламаларды іске қосып, нәтижелерін біріктіреді. <code>subprocess.run([...], capture_output=True, text=True)</code> бағдарламаны орындап, stdout, stderr және шығу кодын қайтарады. Ауыр есептеу C-да, ал басқару, талдау және есеп - Python-да.</p>"
               "<p>Екі бағдарлама келісуі керек: <b>протокол</b>. Ең қарапайымы - <code>кілт=мән</code> жолдары. Маңызды нәзіктік: double санын мәтінге жазып, қайта оқығанда дәлдік жоғалмауы үшін <code>%.17g</code> керек (%.6f жеткіліксіз). Браузерде subprocess жоқ, сондықтан бұл сабақтың мысалдары build кезінде нағыз CPython + gcc арқылы орындалған.</p>",
    "theory": [
        {"kind": "definition", "title": "subprocess.run", "body": "<p>r = subprocess.run(cmd, input=..., capture_output=True, text=True, timeout=...); r.returncode, r.stdout, r.stderr. cmd - тізім (shell=True емес - қауіпсіз, аргументтер бөлінеді). check=True - нөлдік емес кодта ерекшелік.</p>"},
        {"kind": "theorem", "title": "17 мәнді цифр жеткілікті", "body": "<p>Кез келген IEEE 754 double x үшін оны 17 мәнді ондық цифрмен (%.17g) жазып, қайта оқу (strtod, float()) дәл сол x-ті береді.</p>"},
        {"kind": "proof", "title": "Негіздеу (схема)", "body": "<p>double-ның мантиссасы 53 бит; бір екілік ретте (бірдей экспонента) көрші double-лар арасындағы салыстырмалы қашықтық ≥ 2⁻⁵³ ≈ 1.1·10⁻¹⁶. 17 мәнді ондық цифр дөңгелектеуінің салыстырмалы қатесі ≤ ½·10⁻¹⁶ = 5·10⁻¹⁷, бұл көрші double-лар арасының жартысынан кіші. Демек жазылған ондық сан x-ке ең жақын double болып қалады, ал дұрыс дөңгелектейтін оқу (IEEE 754 талабы) дәл x-ті таңдайды. ∎ (Толық дәлел экспонента шекараларындағы жағдайларды қарайды; 17 - ең аз жарамды сан, 16 кейбір x үшін жеткіліксіз.)</p>"},
        {"kind": "note", "title": "Қауіпсіздік", "body": "<p>shell=True және пайдаланушы мәтінін командаға қосу - команда енгізу (command injection) қаупі: «; rm -rf ~». Әрқашан тізім форматы: ['./prog', user_value].</p>"},
    ],
    "visual": {"lab": "cshow", "code": CPROG, "args": ["10"], "output": "n=10\nsum=0.99999999999999989\nsquares=385",
               "caption": "C бағдарламасы протокол бойынша кілт=мән жолдарын шығарады. 0.1-ді 10 рет қосу 1.0 бермейді (m05 l05) - %.17g мұны көрсетеді, %.6f «1.000000» деп жасырар еді."},
    "derivation": [
        "C бағдарламасын temp бумада жазу және gcc-мен компиляциялау: subprocess.run(['gcc', ..., '-o', exe, src], check=True).",
        "Іске қосу: r = subprocess.run([exe, '1000'], capture_output=True, text=True, timeout=5).",
        "r.returncode тексеру; протоколды талдау: dict(line.split('=', 1) for line in r.stdout.splitlines()).",
        "Python-да тәуелсіз есептеп, салыстыру (differential testing, 10-сабақ).",
    ],
    "examples": [
        {"title": "Python C-ны компиляциялап, іске қосып, тексереді", "lang": "python-local",
         "code": "import os, subprocess, tempfile\n\nC_SRC = r'''" + CPROG + "'''\n\ndef parse(stdout):\n    return dict(line.split('=', 1) for line in stdout.splitlines())\n\nwith tempfile.TemporaryDirectory() as d:\n    src, exe = os.path.join(d, 'prog.c'), os.path.join(d, 'prog')\n    with open(src, 'w') as f:\n        f.write(C_SRC)\n    subprocess.run(['gcc', '-std=c11', '-O2', '-Wall', '-o', exe, src], check=True)\n    for n in [10, 1000]:\n        r = subprocess.run([exe, str(n)], capture_output=True, text=True, timeout=5)\n        out = parse(r.stdout)\n        x = 0.0\n        for _ in range(n):\n            x += 0.1\n        same_float = float(out['sum']) == x\n        same_int = int(out['squares']) == n * (n + 1) * (2 * n + 1) // 6\n        print(n, r.returncode, out['sum'], same_float, same_int)",
         "output": "10 0 0.99999999999999989 True True\n1000 0 99.999999999998593 True True",
         "explain": "Python C бағдарламасын компиляциялап, екі рет іске қосты және нәтижені тәуелсіз есеппен салыстырды: double %.17g арқылы бит-бит дәл қайтты (теорема), ал квадраттар қосындысы формуламен (m02) сәйкес."},
    ],
    "experiment": {"lab": "pyrun", "code": "x = 0.1 + 0.2\nfor fmt in ['%.6f', '%.15g', '%.16g', '%.17g', '%r']:\n    s = fmt % x\n    print(f'{fmt:6} -> {s:22} қайта оқу дәл: {float(s) == x}')", "stdin": "",
                   "task": "%.6f және %.15g дәлдікті жоғалтты, %.17g - жоқ (теорема). Python-ның repr(x) ең қысқа дәл жазуды таңдайды. Басқа x мәндерімен (1/3, 2**0.5) тексеріңіз - 16 цифр әрқашан жеткілікті ме?"},
    "exercises": [
        {"type": "pycode", "q": "parse_protocol(stdout) - 'кілт=мән' жолдарын сөздікке айналдырсын: бос жолдарды өткізсін, мәнде '=' болуы мүмкін (тек бірінші = бөледі), '=' жоқ жол болса ValueError көтерсін.", "mode": "io",
         "suffix": "print(parse_protocol('n=10\\nsum=0.99\\n\\nexpr=a=b'))\ntry:\n    parse_protocol('n=1\\nқате жол')\nexcept ValueError as e:\n    print('ValueError:', e)",
         "starter": "def parse_protocol(stdout):\n    return dict(line.split('=') for line in stdout.splitlines())\n",
         "tests": [{"stdin": "", "stdout": "{'n': '10', 'sum': '0.99', 'expr': 'a=b'}\nValueError: 2-жол: '=' жоқ"}],
         "solution": "def parse_protocol(stdout):\n    out = {}\n    for i, line in enumerate(stdout.splitlines(), 1):\n        if not line:\n            continue\n        if '=' not in line:\n            raise ValueError(f\"{i}-жол: '=' жоқ\")\n        k, v = line.split('=', 1)\n        out[k] = v\n    return out",
         "hints": ["split('=', 1).", "Хабар: f\"{i}-жол: '=' жоқ\"."]},
        {"type": "coutput", "q": "C бағдарламасы ./prog 4 командасымен іске қосылды. Не шығарады?", "code": CPROG, "args": ["4"], "answer": "n=4\nsum=0.40000000000000002\nsquares=30",
         "hints": ["1 + 4 + 9 + 16.", "0.1 + 0.1 + 0.1 + 0.1 екілікте 0.4-ке ең жақын double-ға тең, ол %.17g-да ...02."]},
        {"type": "mc", "q": "subprocess.run(f'./prog {name}', shell=True) неге қауіпті?", "options": ["Баяу", "name ішінде ; не && болса, shell қосымша командаларды орындайды (command injection)", "Шығыс жоғалады", "Windows-та жұмыс істемейді"], "answer": 1,
         "why": ["Себеп емес.", "Дұрыс.", "Жоғалмайды.", "Бұл басты мәселе емес."], "hints": ["name = 'x; rm -rf ~'."]},
        {"type": "mc", "q": "C бағдарламасы double-ды printf(\"%.6f\") арқылы жазса, Python float() оқығанда:", "options": ["Әрқашан дәл сол сан", "Дәлдік жоғалуы мүмкін - 17 мәнді цифр керек", "Қате шығады", "Сан бүтінге айналады"], "answer": 1,
         "why": ["6 ондық таңба жеткіліксіз.", "Дұрыс (теорема).", "Қате жоқ.", "Жоқ."], "hints": ["Эксперимент."]},
    ],
    "reasoning": "<p>«Екі тілдің ең жақсысы» - нақты өндірістің үлгісі: NumPy, Pandas, PyTorch ішінде C/C++ ядросы, сыртында Python. Бұл сабақта олардың ең қарапайым нұсқасын - процестер мен мәтіндік протоколды - жасадық. Ал сапаның кепілі - тәуелсіз есеппен салыстыру: егер C мен Python бір нәтиже берсе, екеуінде бір қате болу ықтималдығы аз.</p>",
    "mistakes": [
        {"mistake": "returncode-ты тексермей stdout-ты талдау.", "why": "Бағдарлама құласа, жартылай шығыс «дұрыс» болып көрінеді.", "fix": "check=True не returncode == 0 тексеру."},
        {"mistake": "timeout бермеу.", "why": "C бағдарламасы шексіз циклға түссе, Python мәңгі күтеді.", "fix": "timeout=... және subprocess.TimeoutExpired өңдеу."},
    ],
    "assessment": [
        {"type": "pycode", "q": "compare_runs(c_out, py_values) - C-ның 'кілт=мән' шығысын (мәтін) Python есептеген сөздікпен салыстырсын: сәйкес келмейтін кілттердің сұрыпталған тізімін қайтарсын. Сандар float ретінде дәл салыстырылады; C-да жоқ кілт те сәйкессіз.", "mode": "func", "func": "compare_runs",
         "starter": "def compare_runs(c_out, py_values):\n    return []\n",
         "tests": [{"args": ["n=10\nsum=0.99999999999999989\nsquares=385", {"n": 10, "sum": 0.9999999999999999, "squares": 385}], "expect": []},
                   {"args": ["n=10\nsum=1.000000", {"n": 10, "sum": 0.9999999999999999}], "expect": ["sum"]},
                   {"args": ["a=1", {"a": 1, "b": 2}], "expect": ["b"]}],
         "solution": "def compare_runs(c_out, py_values):\n    got = dict(line.split('=', 1) for line in c_out.splitlines() if line)\n    bad = []\n    for k, v in py_values.items():\n        if k not in got or float(got[k]) != float(v):\n            bad.append(k)\n    return sorted(bad)",
         "hints": ["Алдымен протоколды талдау.", "float(мәтін) == float(мән)."]},
        {"type": "mc", "q": "Бұл сабақтағы Python + gcc мысалы браузерде неге іске қосылмайды?", "options": ["Python қате", "Браузердегі Pyodide-та subprocess (басқа процестерді іске қосу) және gcc жоқ", "C коды қате", "Интернет керек"], "answer": 1,
         "why": ["Python дұрыс.", "Дұрыс: браузер құмсалғышы.", "gcc-мен тексерілген.", "Себеп ол емес."], "hints": ["Браузер шектеулері."]},
    ],
    "reflection": ["Сіздің есебіңізде қай бөлікті C-ға, қай бөлікті Python-ға берер едіңіз? Протоколды қалай жобалайсыз?"],
    "further": {"honors": ["ctypes арқылы C функциясын (shared library, gcc -shared -fPIC) процесс іске қоспай-ақ Python-дан шақырыңыз. subprocess-тен немен ерекшеленеді?"],
                "research": ["Python C кеңейтулері (CPython C API), Cython және pybind11 - жылдам кітапханалар қалай жасалады?"]},
    "references": REFS,
}

L05 = {
    **META, "id": "ao17-foundation.m12.l05", "slug": "l05", "title": "Өнімділікті өлшеу", "difficulty": 3, "minutes": 55,
    "objectives": [
        "Профилдеу (cProfile) арқылы бағдарламаның «тар жерін» (bottleneck) табу.",
        "Амдал заңын дәлелдеп, оңтайландырудың шегін бағалау.",
        "Жад өлшеу (tracemalloc) және уақыт пен жадтың алмасуын талдау.",
    ],
    "prerequisites": ["ao17-foundation.m12.l04", "ao17-foundation.m09.l10"],
    "concept": "<p>«Ерте оңтайландыру - бар зұлымдықтың тамыры» (Д. Кнут). Алдымен <b>өлшеу</b>: бағдарлама уақытының қай бөлігі қайда жұмсалады? <b>Профилдеуші</b> (cProfile) әр функцияның шақырулар санын және уақытын көрсетеді. Көбіне уақыттың 90%-ы кодтың 10%-ында.</p>"
               "<p><b>Амдал заңы</b> оңтайландырудың шегін береді: бағдарлама уақытының тек p үлесін s есе жылдамдатсақ, жалпы жылдамдау 1 / ((1 − p) + p/s). p = 0.5 болса, s шексіз болса да, тек 2 есе. Сондықтан тар жерді табу - бірінші қадам.</p>",
    "theory": [
        {"kind": "definition", "title": "Жылдамдау", "body": "<p>S = T_ескі / T_жаңа. Бағдарлама екі бөліктен: оңтайландырылмайтын (1 − p)·T және оңтайландырылатын p·T; соңғысы s есе жылдамдайды.</p>"},
        {"kind": "theorem", "title": "Амдал заңы", "body": "<p>S = 1 / ((1 − p) + p/s), және кез келген s үшін S < 1 / (1 − p) (p < 1).</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>T_жаңа = (1 − p)·T + p·T/s (бірінші бөлік өзгермейді, екіншісі s есе жылдамырақ). S = T / T_жаңа = 1 / ((1 − p) + p/s). p/s > 0 (p > 0, s шекті), сондықтан бөлім > 1 − p, демек S < 1/(1 − p). s → ∞ кезінде p/s → 0 және S → 1/(1 − p) - бұл шекке жетуге болмайды, тек жақындауға. ∎ Мысал: p = 0.9, s = 10 → S = 1/(0.1 + 0.09) ≈ 5.26; шек - 10.</p>"},
        {"kind": "note", "title": "Уақыт пен жад", "body": "<p>Көп оңтайландыру уақытты жадқа айырбастайды: мемоизация (m09 l08), кэш, индекс. tracemalloc бағдарламаның ең көп жад бөлген жолдарын көрсетеді. Шешім - өлшемдерге негізделген, болжамға емес.</p>"},
    ],
    "visual": {"lab": "pyrun", "code": "import cProfile, pstats, io\n\ndef slow_unique(items):\n    out = []\n    for x in items:\n        if x not in out:\n            out.append(x)\n    return out\n\ndef parse(n):\n    return [i % 500 for i in range(n)]\n\ndef report(xs):\n    return len(slow_unique(xs))\n\ndef main():\n    return report(parse(20000))\n\npr = cProfile.Profile()\npr.enable()\nresult = main()\npr.disable()\ns = io.StringIO()\npstats.Stats(pr, stream=s).sort_stats('cumulative').print_stats(5)\nprint('нәтиже:', result)\nprint('\\n'.join(l for l in s.getvalue().splitlines() if 'slow_unique' in l or 'parse' in l or 'ncalls' in l))", "stdin": "",
               "caption": "Профиль slow_unique-те уақыттың көбі жұмсалатынын көрсетеді (x not in out - O(n), m08 l04). parse - арзан. Оңтайландыру қайда керек екені енді анық. (Браузерде трасса уақытты өзгертеді - тек салыстырмалы үлестерге қараңыз.)"},
    "derivation": [
        "Өлшеу: cProfile - slow_unique уақыттың ~95%-ы (p ≈ 0.95).",
        "Оңтайландыру: тізім орнына set (m08 l04) - бұл бөлік, мысалы, 50 есе жылдамдайды (s = 50).",
        "Амдал: S = 1/(0.05 + 0.95/50) = 1/0.069 ≈ 14.5 есе.",
        "Қайта өлшеу: енді тар жер басқа жерде - цикл қайталанады.",
    ],
    "examples": [
        {"title": "Амдал заңының кестесі", "lang": "python",
         "code": "def amdahl(p, s):\n    return 1 / ((1 - p) + p / s)\n\nprint('p \\\\ s   2      10     100    шек')\nfor p in [0.5, 0.9, 0.99]:\n    row = [amdahl(p, s) for s in [2, 10, 100]]\n    print(f'{p:<5}', ' '.join(f'{x:6.2f}' for x in row), f'{1 / (1 - p):6.1f}')",
         "output": "p \\ s   2      10     100    шек\n0.5     1.33   1.82   1.98    2.0\n0.9     1.82   5.26   9.17   10.0\n0.99    1.98   9.17  50.25  100.0",
         "explain": "Бағдарламаның жартысын 100 есе жылдамдатсақ та - тек 1.98 есе. Тар жер бағдарламаның 99%-ы болса ғана үлкен жылдамдау мүмкін. Сондықтан алдымен профилдеу."},
    ],
    "experiment": {"lab": "pyrun", "code": "import tracemalloc\n\ntracemalloc.start()\nsquares_list = [i * i for i in range(20000)]\nsize_list = tracemalloc.get_traced_memory()[0]\ndel squares_list\ntracemalloc.reset_peak()\nbase = tracemalloc.get_traced_memory()[0]\ntotal = sum(i * i for i in range(20000))\npeak_gen = tracemalloc.get_traced_memory()[1] - base\ntracemalloc.stop()\nprint(f'тізім: ~{size_list // 1024} КБ')\nprint(f'генератор: ~{peak_gen // 1024} КБ (шың)')\nprint('қосынды:', total)", "stdin": "",
                   "task": "Тізім барлық 20 000 санды жадта сақтайды, генератор - бір-бірден. Бір нәтиже, жадтағы айырма ондаған-жүздеген есе. Уақыт пен жадтың айырбасы - өлшеммен шешіледі."},
    "exercises": [
        {"type": "pycode", "q": "amdahl(p, s) - Амдал заңы бойынша жылдамдауды 2 таңбаға дейін дөңгелектеп қайтарсын.", "mode": "func", "func": "amdahl",
         "starter": "def amdahl(p, s):\n    return round(s * p, 2)\n",
         "tests": [{"args": [0.9, 10], "expect": 5.26}, {"args": [0.5, 2], "expect": 1.33}, {"args": [0, 100], "expect": 1.0}, {"args": [1, 8], "expect": 8.0}],
         "solution": "def amdahl(p, s):\n    return round(1 / ((1 - p) + p / s), 2)",
         "hints": ["S = 1 / ((1 − p) + p/s)."]},
        {"type": "pycode", "q": "hotspot(profile) - {функция: уақыт_секунд} сөздігінен уақыттың ең үлкен үлесін алатын функцияны және оның үлесін (2 таңба) кортеж ретінде қайтарсын.", "mode": "func", "func": "hotspot",
         "starter": "def hotspot(profile):\n    name = list(profile)[0]\n    return name, 1.0\n",
         "tests": [{"args": [{"parse": 0.2, "unique": 3.6, "report": 0.2}], "expect": ["unique", 0.9]}, {"args": [{"a": 1, "b": 3}], "expect": ["b", 0.75]}, {"args": [{"only": 2.5}], "expect": ["only", 1.0]}],
         "solution": "def hotspot(profile):\n    total = sum(profile.values())\n    name = max(profile, key=profile.get)\n    return name, round(profile[name] / total, 2)",
         "hints": ["max(profile, key=profile.get).", "Үлес = уақыт / жалпы."]},
        {"type": "number", "q": "Бағдарламаның 80%-ы (p = 0.8) шексіз жылдамдатылса, ең көп жылдамдау неше есе?", "answer": 5, "check": "round(1 / (1 - 0.8))", "hints": ["Шек 1/(1 − p)."]},
        {"type": "mc", "q": "Оңтайландыруды неден бастау керек?", "options": ["Ең ұзын функцияны C-ға аудару", "Профилдеп, уақыттың көбі жұмсалатын жерді табу", "Барлық циклды қайта жазу", "Компьютерді жаңарту"], "answer": 1,
         "why": ["Ұзын функция тар жер болмауы мүмкін.", "Дұрыс.", "Көбі әсер етпейді (Амдал).", "Бұл - соңғы амал."], "hints": ["Өлшеу."]},
    ],
    "reasoning": "<p>Өнімділік - сезім емес, өлшем. m09 l10 бір алгоритмді өлшеді; мұнда бүкіл жүйені өлшейміз және Амдал заңы қайда күш жұмсау керектігін айтады. Көп жағдайда ең үлкен жылдамдау - алгоритмді ауыстыру (O(n²) → O(n)), тілді ауыстыру емес.</p>",
    "mistakes": [
        {"mistake": "Болжам бойынша оңтайландыру («бұл цикл баяу болуы керек»).", "why": "Интуиция тар жерді жиі қате табады.", "fix": "cProfile, perf_counter (m09 l10)."},
        {"mistake": "Микро-оңтайландыру (x * 2 орнына x << 1) - оқылуды бұзу.", "why": "Ұтыс болмашы, компилятор/интерпретатор өзі жасайды.", "fix": "Алгоритм мен деректер құрылымына назар."},
    ],
    "assessment": [
        {"type": "pycode", "q": "needed_speedup(p, target) - жалпы жылдамдау target болуы үшін p үлесті неше есе (s) жылдамдату керек? Мүмкін болмаса (target ≥ 1/(1 − p)) None қайтарсын; әйтпесе s-ті 2 таңбаға дөңгелектеп.", "mode": "func", "func": "needed_speedup",
         "starter": "def needed_speedup(p, target):\n    return target\n",
         "tests": [{"args": [0.9, 5], "expect": 9.0}, {"args": [0.5, 2], "expect": None}, {"args": [0.5, 1.5], "expect": 3.0}, {"args": [0.99, 50], "expect": 99.0}],
         "solution": "def needed_speedup(p, target):\n    rest = 1 / target - (1 - p)\n    if rest <= 0:\n        return None\n    return round(p / rest, 2)",
         "hints": ["Амдал формуласынан s-ті шығарыңыз: p/s = 1/S − (1 − p).", "Оң жақ ≤ 0 болса - мүмкін емес."]},
        {"type": "mc", "q": "Мемоизация қай ресурсты қайсысына айырбастайды?", "options": ["Уақытты жадқа: көбірек жад, азырақ уақыт", "Жадты уақытқа", "Ештеңе", "Дәлдікті жылдамдыққа"], "answer": 0,
         "why": ["Дұрыс (m09 l08).", "Керісінше.", "Айырбас бар.", "Нәтиже дәл."], "hints": ["Кэш жад алады."]},
    ],
    "reflection": ["m09 p09 жобаңыздың ең баяу бөлігі қайсы? Амдал заңы бойынша оны жылдамдатудың шегі қандай?"],
    "further": {"honors": ["Густафсон заңы: есептің өлшемі процессорлармен бірге өссе, Амдал шегі қалай өзгереді?"],
                "research": ["perf (Linux) және flame graph арқылы C бағдарламасын профилдеу. Python-да py-spy қалай жұмыс істейді?"]},
    "references": REFS,
}

LESSONS = [L01, L02, L03, L04, L05]
