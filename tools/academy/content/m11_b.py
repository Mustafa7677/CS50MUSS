# © 2026 Sagid Mustafa. All Rights Reserved.
# AO17 CS Universe · Level I · m11 Memory & Pointers · 6-10 сабақтар. Авторлық мазмұн (AO17 үшін жаңадан жазылған).
# C коды build кезінде gcc-мен тексеріледі; жад қателері AddressSanitizer/LeakSanitizer арқылы нақты ұсталады.

REFS = [
    "ISO/IEC 9899:2011 (C11), 6.7.2.1 (құрылымдар), 7.22.3 (жадты басқару).",
    "B. W. Kernighan, D. M. Ritchie, The C Programming Language, 6-тарау (Structures).",
    "Python Software Foundation, Python/C API: Reference Counting; gc модулінің құжаттамасы.",
]
META = {"courseId": "ao17-foundation", "moduleId": "m11", "language": "kk", "academicLevel": "I",
        "license": "ARR", "authorship": "original", "reviewStatus": "author-checked", "version": "1.0.0"}

ASAN = ["-fsanitize=address", "-g"]

L06 = {
    **META, "id": "ao17-foundation.m11.l06", "slug": "l06", "title": "Жады қателері", "difficulty": 4, "minutes": 55,
    "objectives": [
        "Жад қателерінің түрлерін тану: ағып кету, ілулі көрсеткіш (use-after-free), қос босату, шекарадан тыс жазу.",
        "AddressSanitizer есебін оқып, қатенің түрі мен жолын табу.",
        "Қатеден сақтану тәртібін қолдану: free-ден кейін NULL, бір иесі, жұптық бөлу/босату.",
    ],
    "prerequisites": ["ao17-foundation.m11.l05"],
    "concept": "<p>Үйме қуатты, бірақ әр қате үнсіз болуы мүмкін: бағдарлама «жұмыс істей береді», кейін кездейсоқ жерде құлайды. Негізгі төрт қате: <b>ағып кету</b> (free ұмытылды), <b>ілулі көрсеткіш</b> (босатылған жадты пайдалану), <b>қос босату</b>, <b>шекарадан тыс жазу</b> (heap-buffer-overflow).</p>"
               "<p>Бұл сабақтың мысалдары нағыз AddressSanitizer-мен компиляцияланып, іске қосылған - төмендегі stderr үзінділері сол есептерден алынған (мекенжайлар алынып тасталған). Ереже: тестілеу кезінде әрқашан <code>-fsanitize=address</code>.</p>",
    "theory": [
        {"kind": "definition", "title": "Төрт қате", "body": "<ul><li>Leak: бөлінген блокқа ешбір көрсеткіш қалмады, бірақ free болмады.</li><li>Use-after-free: free(p) кейін *p.</li><li>Double free: бір блокты екі рет free.</li><li>Heap overflow: malloc(n) блогынан тыс оқу/жазу.</li></ul>"},
        {"kind": "theorem", "title": "free-ден кейін NULL қою қос босатуды болдырмайды", "body": "<p>Блоктың жалғыз көрсеткіші p болса және әр free(p)-тен кейін бірден p = NULL жазылса, бұл блок екі рет босатылмайды.</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>Блоққа тек p көрсетеді (жалғыз иесі). Бірінші free(p)-тен кейін p = NULL, демек блокқа көрсететін ешбір көрсеткіш қалмады. Блокты тағы босату үшін оның мекенжайы бар көрсеткіш керек - ондай жоқ. Ал free(p) қайта шақырылса, бұл free(NULL), ол стандарт бойынша ештеңе істемейді (C11 7.22.3.3). ∎ Ескерту: блоктың көшірме көрсеткіштері (q = p) болса, теорема шарты бұзылады - сондықтан «бір иесі» ережесі маңызды.</p>"},
        {"kind": "note", "title": "Неге қате үнсіз?", "body": "<p>free жадты операциялық жүйеге бірден қайтармайды - ол аллокатордың «бос» тізіміне түседі. Сондықтан *p оқу көбіне ескі мәнді не келесі malloc-тың деректерін береді. Құлау кейінірек, басқа жерде болады - себебін табу өте қиын.</p>"},
    ],
    "visual": {"lab": "cshow", "code": '#include <stdio.h>\n#include <stdlib.h>\n\nint main(void)\n{\n    int *p = malloc(3 * sizeof *p);\n    if (!p)\n        return 1;\n    p[0] = 7;\n    free(p);\n    printf("%d\\n", p[0]);\n    return 0;\n}', "cflags": ASAN, "output": "", "exit": 1, "warn": True, "stderrHas": "heap-use-after-free",
               "stderrShow": "ERROR: AddressSanitizer: heap-use-after-free ... READ of size 4\n    #0 in main prog.c:11\nfreed by thread T0 here:\n    #1 in main prog.c:10\npreviously allocated by thread T0 here:\n    #1 in main prog.c:6",
               "caption": "ASan үш жолды көрсетті: қай жерде оқылды (11), қай жерде босатылды (10), қай жерде бөлінді (6). gcc 13 бұл қатені компиляция кезінде де байқап ескертеді (-Wuse-after-free)."},
    "derivation": [
        "Ағып кету табу: бағдарламаның соңында LeakSanitizer тірі блоктарды тізімдейді.",
        "«Direct leak of 40 byte(s) ... allocated from: main prog.c:6» - қай malloc босатылмағаны.",
        "Түзету: сол блоктың иесі кім? Иесі біткен жерге free қосу.",
        "Қайта іске қосу: ASan үнсіз - енді таза.",
    ],
    "examples": [
        {"title": "Ағып кету: LeakSanitizer", "lang": "c", "cflags": ASAN, "exit": 1, "stderrHas": "detected memory leaks",
         "code": '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nchar *copy_word(const char *w)\n{\n    char *c = malloc(strlen(w) + 1);\n    if (c)\n        strcpy(c, w);\n    return c;\n}\n\nint main(void)\n{\n    const char *words[] = {"жад", "стек", "үйме"};\n    for (int i = 0; i < 3; i++) {\n        char *c = copy_word(words[i]);\n        if (c && i < 2)\n            printf("%s\\n", c);\n        if (i < 2)\n            free(c);\n    }\n    fflush(stdout);\n    return 0;\n}',
         "output": "жад\nстек", "stderrShow": "ERROR: LeakSanitizer: detected memory leaks\nDirect leak of 9 byte(s) in 1 object(s) allocated from:\n    #1 in copy_word prog.c:7\n    #2 in main prog.c:17",
         "explain": "Үшінші сөздің көшірмесі (i = 2) босатылмады: «үйме» 8 байт + '\\0' = 9 байт. LeakSanitizer бағдарлама соңында тірі блокты тауып, оның қай жерде бөлінгенін көрсетті және шығу кодын 1 етті. (fflush(stdout) - LSan процесті аяқтамас бұрын шығысты жазу үшін.)"},
    ],
    "experiment": {"lab": "cshow", "code": '#include <stdio.h>\n#include <stdlib.h>\n\nint main(void)\n{\n    int *p = malloc(4 * sizeof *p);\n    if (!p)\n        return 1;\n    for (int i = 0; i <= 4; i++)\n        p[i] = i;\n    printf("%d\\n", p[3]);\n    free(p);\n    return 0;\n}', "cflags": ASAN, "output": "", "exit": 1, "stderrHas": "heap-buffer-overflow",
                   "stderrShow": "ERROR: AddressSanitizer: heap-buffer-overflow ... WRITE of size 4\n    #0 in main prog.c:10\n0x... is located 0 bytes after 16-byte region",
                   "task": "i <= 4 - бір артық жазу (m10 l06). ASan оны жазу сәтінде ұстады: «16 байттық аймақтан кейін 0 байт». Санитайзерсіз бұл жазу көрші блоктың ішкі деректерін бүлдіріп, кейінгі free-де құлауы мүмкін еді."},
    "exercises": [
        {"type": "mc", "q": "ASan есебі: «attempting double-free». Қате қандай?", "options": ["Жад жетпеді", "Бір блок екі рет босатылды", "Шекарадан тыс оқу", "Ағып кету"], "answer": 1,
         "why": ["Бұл - malloc NULL.", "Дұрыс.", "Бұл - buffer-overflow.", "Бұл - LeakSanitizer."], "hints": ["double - екі рет."]},
        {"type": "coutput", "q": "Бұл бағдарлама қателерден таза (ASan-мен тексерілген). Не шығарады?", "code": '#include <stdio.h>\n#include <stdlib.h>\n\nint main(void)\n{\n    int *a = malloc(2 * sizeof *a);\n    if (!a)\n        return 1;\n    a[0] = 5;\n    a[1] = 6;\n    int *b = a;\n    free(a);\n    a = NULL;\n    b = NULL;\n    free(a);\n    printf("%d %d\\n", a == NULL, b == NULL);\n    return 0;\n}', "answer": "1 1", "cflags": ASAN,
         "hints": ["free(NULL) - ештеңе істемейді (теорема).", "b да NULL етілді - ілулі көшірме қалмады."]},
        {"type": "pycode", "q": "asan_kind(report) - ASan есебінің мәтінінен қатенің түрін қайтарсын: 'use-after-free', 'double-free', 'overflow', 'leak' не 'unknown'.", "mode": "func", "func": "asan_kind",
         "starter": "def asan_kind(report):\n    return 'unknown'\n",
         "tests": [{"args": ["ERROR: AddressSanitizer: heap-use-after-free on address"], "expect": "use-after-free"}, {"args": ["ERROR: AddressSanitizer: attempting double-free on 0x50"], "expect": "double-free"},
                   {"args": ["ERROR: AddressSanitizer: heap-buffer-overflow on address"], "expect": "overflow"}, {"args": ["ERROR: AddressSanitizer: stack-buffer-overflow"], "expect": "overflow"},
                   {"args": ["ERROR: LeakSanitizer: detected memory leaks"], "expect": "leak"}, {"args": ["Segmentation fault"], "expect": "unknown"}],
         "solution": "def asan_kind(report):\n    if 'use-after-free' in report:\n        return 'use-after-free'\n    if 'double-free' in report:\n        return 'double-free'\n    if 'buffer-overflow' in report:\n        return 'overflow'\n    if 'LeakSanitizer' in report or 'leak' in report:\n        return 'leak'\n    return 'unknown'",
         "hints": ["Кілт сөздер: use-after-free, double-free, buffer-overflow, LeakSanitizer."]},
        {"type": "pycode", "q": "Модель: dangling(ops) - ('malloc', p), ('copy', q, p) (q = p), ('free', p), ('use', p) операцияларынан кейін use-after-free болған көрсеткіштердің атауларын реті бойынша қайтарсын. Көшірмелер бір блокқа көрсетеді.", "mode": "func", "func": "dangling",
         "starter": "def dangling(ops):\n    freed = set()\n    out = []\n    for op in ops:\n        if op[0] == 'free':\n            freed.add(op[1])\n        elif op[0] == 'use' and op[1] in freed:\n            out.append(op[1])\n    return out\n",
         "tests": [{"args": [[["malloc", "p"], ["copy", "q", "p"], ["free", "p"], ["use", "q"]]], "expect": ["q"]},
                   {"args": [[["malloc", "p"], ["use", "p"], ["free", "p"], ["malloc", "p"], ["use", "p"]]], "expect": []},
                   {"args": [[["malloc", "a"], ["copy", "b", "a"], ["copy", "c", "b"], ["free", "c"], ["use", "a"], ["use", "b"]]], "expect": ["a", "b"]}],
         "solution": "def dangling(ops):\n    block, alive, out, nxt = {}, set(), [], 0\n    for op in ops:\n        if op[0] == 'malloc':\n            nxt += 1\n            block[op[1]] = nxt\n            alive.add(nxt)\n        elif op[0] == 'copy':\n            block[op[1]] = block[op[2]]\n        elif op[0] == 'free':\n            alive.discard(block[op[1]])\n        elif op[0] == 'use' and block[op[1]] not in alive:\n            out.append(op[1])\n    return out",
         "hints": ["Бастапқы код атауларды бақылайды, блоктарды емес - көшірмені байқамайды.", "Әр malloc - жаңа блок нөмірі; көрсеткіш → блок сөздігі."]},
    ],
    "reasoning": "<p>Жад қателері - қауіпсіздік осалдықтарының ең үлкен класы: Microsoft пен Google есептері бойынша олардың ~70%-ы жад қауіпсіздігіне қатысты. Сондықтан қазіргі тілдер (Rust, Go, Python) бұл қателерді тіл деңгейінде мүмкін емес етеді. C-да біздің қорғанысымыз - тәртіп пен құралдар.</p>",
    "mistakes": [
        {"mistake": "free(p) кейін p-ны қолдана беру («әлі мән бар ғой»).", "why": "Блок аллокаторға қайтты - кез келген сәтте қайта бөлінеді.", "fix": "free(p); p = NULL;"},
        {"mistake": "Бір блокты екі құрылымның екеуі де «иеленеді» деп, екеуі де босатады.", "why": "Қос босату.", "fix": "Әр блоктың бір ғана иесі; басқалары - тек «қарызға алушы»."},
    ],
    "assessment": [
        {"type": "coutput", "q": "Бағдарлама ASan-мен таза. Не шығарады?", "code": '#include <stdio.h>\n#include <stdlib.h>\n\nint *make(int n)\n{\n    int *a = calloc(n, sizeof *a);\n    if (a)\n        for (int i = 0; i < n; i++)\n            a[i] = i + 1;\n    return a;\n}\n\nint main(void)\n{\n    int total = 0;\n    for (int k = 1; k <= 3; k++) {\n        int *a = make(k);\n        if (!a)\n            return 1;\n        total += a[k - 1];\n        free(a);\n    }\n    printf("%d\\n", total);\n    return 0;\n}', "answer": "6", "cflags": ASAN,
         "hints": ["a[k − 1] = k.", "Әр итерацияда бөлу және босату - ағып кету жоқ."]},
        {"type": "mc", "q": "Неге use-after-free бағдарламасы кейде «дұрыс» жұмыс істейді?", "options": ["Ол қате емес", "free жадты бірден өшірмейді; ескі мән кездейсоқ қалуы мүмкін", "Компилятор түзетеді", "ОЖ жадты қорғайды"], "answer": 1,
         "why": ["Бұл - UB.", "Дұрыс.", "Түзетпейді.", "Блок процесстің өз үймесінде."], "hints": ["Аллокатордың бос тізімі."]},
    ],
    "reflection": ["Сіз жазған C бағдарламаларының бірін -fsanitize=address-пен компиляциялаңыз. Не табылды?"],
    "further": {"honors": ["Valgrind (memcheck) мен AddressSanitizer-ді салыстырыңыз: жылдамдық, табатын қателер, қайта компиляция қажеттілігі."],
                "research": ["Rust-тың иелік (ownership) және қарызға алу (borrowing) жүйесі осы сабақтағы төрт қатенің әрқайсысын компиляция кезінде қалай болдырмайды?"]},
    "references": REFS,
}

L07 = {
    **META, "id": "ao17-foundation.m11.l07", "slug": "l07", "title": "Құрылымдар (struct)", "difficulty": 3, "minutes": 50,
    "objectives": [
        "struct-ты жариялау, инициализациялау және өрістерге . мен -> арқылы қатынау.",
        "Құрылымның жадтағы орналасуын (туралау, толтыру байттары) түсіндіру және sizeof-ты болжау.",
        "Құрылымды функцияға мәнмен және көрсеткішпен беру айырмасын қолдану.",
    ],
    "prerequisites": ["ao17-foundation.m11.l06", "ao17-foundation.m08.l05"],
    "concept": "<p><b>struct</b> - әр түрлі типті өрістерді бір атпен біріктіру: <code>struct student { char name[32]; int age; double gpa; };</code>. Бұл Python-дағы сөздікке (m08 l03) не класқа ұқсайды, бірақ өрістер жиыны компиляция кезінде бекітілген және жадта қатар орналасады.</p>"
               "<p>Өріске қатынау: <code>s.age</code>; көрсеткіш арқылы: <code>p-&gt;age</code> ≡ <code>(*p).age</code>. Үлкен құрылымды функцияға мәнмен беру оны толық көшіреді; сондықтан әдетте <code>const struct student *</code> беріледі.</p>",
    "theory": [
        {"kind": "definition", "title": "Туралау (alignment)", "body": "<p>Процессор T типті мәнді мекенжайы alignof(T)-ға еселік болғанда тиімді оқиды (int - 4, double - 8). Сондықтан компилятор өрістер арасына толтыру (padding) байттарын қояды, ал құрылымның соңына - жалпы өлшем ең үлкен туралауға еселік болатындай толтыру.</p>"},
        {"kind": "theorem", "title": "sizeof(struct) ≥ өрістер өлшемдерінің қосындысы", "body": "<p>Кез келген құрылым үшін sizeof(struct S) ≥ Σ sizeof(өріс), ал өрістерді туралауы кемитін ретпен орналастыру толтыруды азайтады.</p>"},
        {"kind": "proof", "title": "Негіздеу", "body": "<p>Өрістер жадта қиылыспай, жарияланған ретпен орналасады (C11 6.7.2.1/15); толтыру байттары тек қосылады, ешқашан алынбайды - демек өлшем ≥ қосынды. Мысал: {char c; double d; char e;} - c (1) + 7 толтыру (d 8-ге еселік мекенжайда басталуы үшін) + d (8) + e (1) + 7 соңғы толтыру = 24. Ал {double d; char c; char e;} - 8 + 1 + 1 + 6 = 16. Туралауы үлкен өрістер алдымен тұрса, кейінгі кіші өрістер үшін толтыру қажет болмайды, тек соңғы толтыру қалады. ∎</p>"},
        {"kind": "note", "title": "typedef", "body": "<p>typedef struct { ... } Student; - енді struct сөзінсіз Student s; деп жазуға болады. Бұл - тек атау, жаңа мінез емес.</p>"},
    ],
    "visual": {"lab": "cshow", "code": '#include <stdio.h>\n#include <stddef.h>\n\nstruct bad { char c; double d; char e; };\nstruct good { double d; char c; char e; };\n\nint main(void)\n{\n    printf("bad: %zu, good: %zu\\n", sizeof(struct bad), sizeof(struct good));\n    printf("bad.d offset: %zu, bad.e offset: %zu\\n", offsetof(struct bad, d), offsetof(struct bad, e));\n    printf("good.c offset: %zu\\n", offsetof(struct good, c));\n    return 0;\n}', "output": "bad: 24, good: 16\nbad.d offset: 8, bad.e offset: 16\ngood.c offset: 8",
               "caption": "Бірдей өрістер, әртүрлі рет - 24 және 16 байт (теорема). offsetof өрістің құрылым басынан қашықтығын береді."},
    "derivation": [
        "Модель: оқушы = аты, жасы, орташа баллы.",
        "typedef struct { char name[32]; int age; double gpa; } Student;",
        "Student s = {\"Айгүл\", 15, 4.8}; - инициализация өрістер ретімен.",
        "Функция: void print_student(const Student *s) - көшірмесіз, өзгертусіз; ішінде s->name.",
    ],
    "examples": [
        {"title": "Құрылымдар массиві және ->", "lang": "c",
         "code": '#include <stdio.h>\n#include <string.h>\n\ntypedef struct {\n    char name[32];\n    int age;\n    double gpa;\n} Student;\n\nconst Student *best(const Student *a, int n)\n{\n    const Student *b = &a[0];\n    for (int i = 1; i < n; i++)\n        if (a[i].gpa > b->gpa)\n            b = &a[i];\n    return b;\n}\n\nvoid birthday(Student *s)\n{\n    s->age++;\n}\n\nint main(void)\n{\n    Student cls[] = {{"Айгүл", 15, 4.8}, {"Бекзат", 16, 4.5}, {"Дана", 15, 4.9}};\n    int n = sizeof cls / sizeof cls[0];\n    const Student *b = best(cls, n);\n    printf("%s %.1f\\n", b->name, b->gpa);\n    birthday(&cls[0]);\n    Student copy = cls[1];\n    copy.age = 99;\n    printf("%d %d %d\\n", cls[0].age, cls[1].age, copy.age);\n    printf("%zu %d\\n", sizeof(Student), strcmp(cls[2].name, "Дана") == 0);\n    return 0;\n}',
         "output": "Дана 4.9\n16 16 99\n48 1",
         "explain": "birthday көрсеткіш арқылы түпнұсқаны өзгертті; copy = cls[1] - толық көшірме (copy.age өзгерісі cls[1]-ге әсер етпейді). 32 + 4 + 4 (толтыру) + 8 = 48."},
    ],
    "experiment": {"lab": "pyrun", "code": "def layout(fields):\n    \"\"\"fields: [(аты, өлшемі, туралауы)] - C ережесімен offset пен sizeof\"\"\"\n    offset, max_align, out = 0, 1, []\n    for name, size, align in fields:\n        offset = (offset + align - 1) // align * align\n        out.append((name, offset))\n        offset += size\n        max_align = max(max_align, align)\n    total = (offset + max_align - 1) // max_align * max_align\n    return out, total\n\nprint(layout([('c', 1, 1), ('d', 8, 8), ('e', 1, 1)]))\nprint(layout([('d', 8, 8), ('c', 1, 1), ('e', 1, 1)]))\nprint(layout([('name', 32, 1), ('age', 4, 4), ('gpa', 8, 8)]))", "stdin": "",
                   "task": "Python моделі gcc нәтижелерімен (24, 16, 48) сәйкес пе? Өз құрылымыңызды қосып, оның өлшемін болжаңыз."},
    "exercises": [
        {"type": "number", "q": "struct { char a; int b; char c; } құрылымының sizeof мәні (int - 4 байт, туралауы 4):", "answer": 12, "check": "1 + 3 + 4 + 1 + 3", "hints": ["a, 3 толтыру, b, c, соңғы толтыру 4-ке еселікке дейін."]},
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nstruct point { int x, y; };\n\nvoid move(struct point p, int dx)\n{\n    p.x += dx;\n}\n\nvoid move_ptr(struct point *p, int dx)\n{\n    p->x += dx;\n}\n\nint main(void)\n{\n    struct point a = {1, 2};\n    move(a, 10);\n    printf("%d\\n", a.x);\n    move_ptr(&a, 10);\n    struct point b = a;\n    b.y = 0;\n    printf("%d %d %d %d\\n", a.x, a.y, b.x, b.y);\n    return 0;\n}', "answer": "1\n11 2 11 0",
         "hints": ["Құрылым мәнмен беріледі - көшірме.", "b = a - толық көшірме."]},
        {"type": "pycode", "q": "struct_size(fields) - [(өлшем, туралау)] тізімі бойынша C құрылымының sizeof-ын есептесін (өрістер берілген ретпен, туралау ережесімен).", "mode": "func", "func": "struct_size",
         "starter": "def struct_size(fields):\n    return sum(size for size, align in fields)\n",
         "tests": [{"args": [[[1, 1], [8, 8], [1, 1]]], "expect": 24}, {"args": [[[8, 8], [1, 1], [1, 1]]], "expect": 16}, {"args": [[[1, 1], [4, 4], [1, 1]]], "expect": 12}, {"args": [[[1, 1], [1, 1], [1, 1]]], "expect": 3}, {"args": [[[32, 1], [4, 4], [8, 8]]], "expect": 48}],
         "solution": "def struct_size(fields):\n    offset, max_align = 0, 1\n    for size, align in fields:\n        offset = (offset + align - 1) // align * align\n        offset += size\n        max_align = max(max_align, align)\n    return (offset + max_align - 1) // max_align * max_align",
         "hints": ["Әр өріс алдында offset-ті туралауға дейін көтеру.", "Соңында ең үлкен туралауға еселікке дейін."]},
        {"type": "mc", "q": "p - struct student * болса, p->age неге тең?", "options": ["*p.age", "(*p).age", "&p.age", "p.age"], "answer": 1,
         "why": [". басымдығы * -тен жоғары: *(p.age) - қате.", "Дұрыс.", "Мекенжай алу.", "p - көрсеткіш, құрылым емес."], "hints": ["Басымдық."]},
    ],
    "reasoning": "<p>struct - деректерді мағыналы бірліктерге топтау: m08-дегі «жазба» (сөздік) енді типке айналды, және компилятор әр өріске қатынасты тексереді. Жадтағы орналасуды білу - файл форматтары, желі пакеттері, аппаратура регистрлерімен жұмыс істеудің негізі.</p>",
    "mistakes": [
        {"mistake": "sizeof(struct) өрістер қосындысына тең деп ойлау.", "why": "Толтыру байттары бар.", "fix": "sizeof пен offsetof-қа сену; өрістерді үлкеннен кішіге реттеу."},
        {"mistake": "Үлкен құрылымды мәнмен беру.", "why": "Әр шақыруда толық көшірме.", "fix": "const S * - оқу үшін, S * - өзгерту үшін."},
    ],
    "assessment": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\ntypedef struct {\n    const char *item;\n    int qty;\n    int price;\n} Line;\n\nint total(const Line *lines, int n)\n{\n    int t = 0;\n    for (const Line *p = lines; p < lines + n; p++)\n        t += p->qty * p->price;\n    return t;\n}\n\nint main(void)\n{\n    Line cart[] = {{"нан", 2, 250}, {"сүт", 1, 480}, {"алма", 3, 300}};\n    printf("%d\\n", total(cart, 3));\n    cart[1].qty = 0;\n    printf("%d %s\\n", total(cart, 3), cart[2].item);\n    return 0;\n}', "answer": "1880\n1400 алма",
         "hints": ["500 + 480 + 900.", "Сүт алынды: 1880 − 480."]},
        {"type": "number", "q": "struct { double a; int b; } құрылымының sizeof мәні:", "answer": 16, "check": "8 + 4 + 4", "hints": ["Соңғы толтыру 8-ге еселікке дейін."]},
    ],
    "reflection": ["Python сөздігі мен C құрылымын салыстырыңыз: икемділік, жылдамдық, қате тексеру."],
    "further": {"honors": ["Биттік өрістер (unsigned flag : 1;) және union - бір жадта бірнеше түсіндіру. Олар қай жерде қолданылады (протокол тақырыптары)?"],
                "research": ["Python-ның ctypes және struct модульдері C құрылымдарымен (екілік файлдармен) қалай жұмыс істейді?"]},
    "references": REFS,
}

LIST_C = '''#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;

Node *push_front(Node *head, int v)
{
    Node *n = malloc(sizeof *n);
    if (!n)
        return head;
    n->value = v;
    n->next = head;
    return n;
}

void print_list(const Node *head)
{
    for (const Node *p = head; p != NULL; p = p->next)
        printf("%d -> ", p->value);
    printf("NULL\\n");
}

void free_list(Node *head)
{
    while (head) {
        Node *next = head->next;
        free(head);
        head = next;
    }
}'''

L08 = {
    **META, "id": "ao17-foundation.m11.l08", "slug": "l08", "title": "Байланысқан тізім", "difficulty": 4, "minutes": 60,
    "objectives": [
        "Бір байланысты тізімнің түйінін (мән + келесіге көрсеткіш) struct ретінде анықтау.",
        "Басына қосу, аралау, іздеу, жою және бүкіл тізімді босату амалдарын жазу.",
        "Байланысқан тізім мен массивтің амалдар құнын салыстыру.",
    ],
    "prerequisites": ["ao17-foundation.m11.l07"],
    "concept": "<p><b>Байланысқан тізім</b> - түйіндер тізбегі: әр түйінде мән және келесі түйіннің мекенжайы. Соңғы түйіннің <code>next</code>-і NULL. Массивтен айырмашылығы: түйіндер жадта кез келген жерде (үймеде) болуы мүмкін, басына қосу O(1) (ешнәрсе жылжымайды), бірақ i-ші элементке жету O(i) - тізбек бойымен жүру керек.</p>"
               "<p>Мұнда m11-дің барлық ұғымы бірігеді: struct (7), malloc/free (5), көрсеткіштер (2) және жад қателері (6) - free_list дұрыс жазылмаса, ағып кету не use-after-free пайда болады.</p>",
    "theory": [
        {"kind": "definition", "title": "Амалдар құны", "body": "<table class=\"ac-tt ac-left\"><tbody><tr><th>Амал</th><th>Массив</th><th>Байланысқан тізім</th></tr><tr><td>i-ші элемент</td><td>O(1)</td><td>O(i)</td></tr><tr><td>Басына қосу</td><td>O(n)</td><td>O(1)</td></tr><tr><td>Іздеу</td><td>O(n)</td><td>O(n)</td></tr><tr><td>Белгілі түйіннен кейін қосу/жою</td><td>O(n)</td><td>O(1)</td></tr></tbody></table>"},
        {"kind": "theorem", "title": "free_list дұрыстығы", "body": "<p>while (head) { next = head->next; free(head); head = next; } циклы n түйінді тізімнің барлық түйінін дәл бір рет босатады және босатылған түйінді ешқашан оқымайды.</p>"},
        {"kind": "proof", "title": "Дәлелдеу (инвариант)", "body": "<p>Инвариант: циклдың әр итерациясының басында head - әлі босатылмаған түйіндердің тізімінің басы (не NULL), ал бұрынғы түйіндердің бәрі дәл бір рет босатылған. Негіз: басында ешнәрсе босатылмаған, head - бүкіл тізім. Сақталу: head->next оқылады free-ден БҰРЫН (босатылмаған түйін - заңды оқу), сосын head босатылады (бірінші рет - ол әлі босатылмаған жиында еді), head = next - қалған тізімнің басы. Аяқталу: әр итерация бір түйінді алып тастайды, n итерациядан кейін head = NULL. ∎ Егер free(head); head = head->next; деп жазсақ - босатылған түйінді оқимыз (use-after-free).</p>"},
        {"kind": "note", "title": "Python-да", "body": "<p>Python list - динамикалық массив (9-сабақ), байланысқан тізім емес. collections.deque - блоктардан тұратын қос байланысты тізім: екі шетінен қосу O(1).</p>"},
    ],
    "visual": {"lab": "cshow", "code": LIST_C + '\n\nint main(void)\n{\n    Node *head = NULL;\n    for (int v = 1; v <= 4; v++)\n        head = push_front(head, v * 10);\n    print_list(head);\n    free_list(head);\n    return 0;\n}', "cflags": ASAN, "output": "40 -> 30 -> 20 -> 10 -> NULL",
               "caption": "Басына қосу кері ретті береді. ASan-мен тексерілді: free_list барлық 4 түйінді босатты, ағып кету жоқ (теорема)."},
    "derivation": [
        "Түйінді жою (мәні x бірінші түйін): алдыңғы түйінді білу керек.",
        "Node **pp = &head; - «келесі түйінге апаратын көрсеткіштің» мекенжайы.",
        "while (*pp && (*pp)->value != x) pp = &(*pp)->next;",
        "Табылса: Node *dead = *pp; *pp = dead->next; free(dead); - басы да, ортасы да бірдей өңделеді.",
    ],
    "examples": [
        {"title": "Іздеу, жою, аудару", "lang": "c", "cflags": ASAN,
         "code": LIST_C + '\n\nint remove_value(Node **head, int x)\n{\n    Node **pp = head;\n    while (*pp && (*pp)->value != x)\n        pp = &(*pp)->next;\n    if (!*pp)\n        return 0;\n    Node *dead = *pp;\n    *pp = dead->next;\n    free(dead);\n    return 1;\n}\n\nNode *reverse(Node *head)\n{\n    Node *prev = NULL;\n    while (head) {\n        Node *next = head->next;\n        head->next = prev;\n        prev = head;\n        head = next;\n    }\n    return prev;\n}\n\nint main(void)\n{\n    Node *head = NULL;\n    for (int v = 5; v >= 1; v--)\n        head = push_front(head, v);\n    print_list(head);\n    printf("%d %d %d\\n", remove_value(&head, 1), remove_value(&head, 4), remove_value(&head, 9));\n    print_list(head);\n    head = reverse(head);\n    print_list(head);\n    free_list(head);\n    return 0;\n}',
         "output": "1 -> 2 -> 3 -> 4 -> 5 -> NULL\n1 1 0\n2 -> 3 -> 5 -> NULL\n5 -> 3 -> 2 -> NULL",
         "explain": "Node ** «көрсеткішке көрсеткіш» басын жоюды (1) және ортасын жоюды (4) бір кодпен өңдейді. reverse - үш көрсеткішпен орнында аудару, O(n), қосымша жадсыз. Барлығы ASan-мен таза."},
    ],
    "experiment": {"lab": "pyrun", "code": "class Node:\n    def __init__(self, value, next=None):\n        self.value, self.next = value, next\n\nhead = None\nfor v in [3, 2, 1]:\n    head = Node(v, head)      # push_front\n\np, items = head, []\nwhile p is not None:          # print_list\n    items.append(p.value)\n    p = p.next\nprint(' -> '.join(map(str, items)), '-> None')\nprint('id-лер (мекенжайға ұқсас):', [hex(id(n))[-4:] for n in [head, head.next, head.next.next]])", "stdin": "",
                   "task": "Python-да да байланысқан тізім жасауға болады: next - сілтеме. free жоқ - қоқыс жинаушы (10-сабақ) соңғы сілтеме жоғалғанда түйінді өзі жояды. id мәндері жадта ретсіз екенін көрсетеді."},
    "exercises": [
        {"type": "coutput", "q": "Бағдарлама не шығарады? (LIST_C функциялары: push_front, print_list, free_list.)", "code": LIST_C + '\n\nint length(const Node *h)\n{\n    int n = 0;\n    for (; h; h = h->next)\n        n++;\n    return n;\n}\n\nint main(void)\n{\n    Node *h = NULL;\n    h = push_front(h, 7);\n    h = push_front(h, 8);\n    h = push_front(h, 9);\n    h->next->value = 0;\n    print_list(h);\n    printf("%d\\n", length(h->next));\n    free_list(h);\n    return 0;\n}', "answer": "9 -> 0 -> 7 -> NULL\n2", "cflags": ASAN,
         "hints": ["Басына қосу: 9, 8, 7.", "Екінші түйіннің мәні 0 болды."]},
        {"type": "pycode", "q": "Python-дағы түйіндермен (класс Node: value, next) insert_sorted(head, v) - сұрыпталған тізімге v-ны өз орнына қосып, жаңа басты қайтарсын.", "mode": "io",
         "suffix": "def build(xs):\n    h = None\n    for x in reversed(xs):\n        h = Node(x, h)\n    return h\n\ndef show(h):\n    out = []\n    while h:\n        out.append(h.value)\n        h = h.next\n    return out\n\nprint(show(insert_sorted(build([1, 3, 5]), 4)))\nprint(show(insert_sorted(build([1, 3, 5]), 0)), show(insert_sorted(build([1, 3, 5]), 9)))\nprint(show(insert_sorted(None, 2)), show(insert_sorted(build([2, 2]), 2)))",
         "starter": "class Node:\n    def __init__(self, value, next=None):\n        self.value, self.next = value, next\n\ndef insert_sorted(head, v):\n    return Node(v, head)\n",
         "tests": [{"stdin": "", "stdout": "[1, 3, 4, 5]\n[0, 1, 3, 5] [1, 3, 5, 9]\n[2] [2, 2, 2]"}],
         "solution": "class Node:\n    def __init__(self, value, next=None):\n        self.value, self.next = value, next\n\ndef insert_sorted(head, v):\n    if head is None or v <= head.value:\n        return Node(v, head)\n    p = head\n    while p.next is not None and p.next.value < v:\n        p = p.next\n    p.next = Node(v, p.next)\n    return head",
         "hints": ["Басына қосу жағдайы бөлек: бос тізім не v ≤ бірінші.", "v-дан кіші соңғы түйінді тауып, одан кейін қосыңыз."]},
        {"type": "mc", "q": "Байланысқан тізімнің массивтен басты артықшылығы:", "options": ["i-ші элементке O(1)", "Белгілі орынға (басына) қосу/жою O(1), жылжытусыз", "Аз жад", "Кэшке ыңғайлы"], "answer": 1,
         "why": ["Керісінше - O(i).", "Дұрыс.", "Әр түйінге көрсеткіш - артық жад.", "Түйіндер шашыраңқы - кэшке нашар."], "hints": ["Кесте."]},
        {"type": "order", "q": "Тізімнің бірінші түйінін жою қадамдарын ретке қойыңыз.", "steps": ["Node *dead = head;", "head = head->next;", "free(dead);", "dead = NULL; (ілулі көшірме қалмасын)"],
         "hints": ["free-ден БҰРЫН next-ті сақтау."]},
    ],
    "reasoning": "<p>Байланысқан тізім - «мекенжаймен ойлаудың» классикалық жаттығуы. Ол өздігінен сирек қолданылады (массив кэшке ыңғайлы), бірақ оның идеясы барлық жерде: хэш-кестенің тізбектері, графтың көршілер тізімі, ОЖ-дегі процестер кезегі, ағаштар (Level II).</p>",
    "mistakes": [
        {"mistake": "free(head); head = head->next;", "why": "Босатылған түйінді оқу (use-after-free).", "fix": "Алдымен next сақтау (теорема)."},
        {"mistake": "Басын жоюды ұмыту: тек p->next-ті тексеру.", "why": "Бірінші түйін ешқашан жойылмайды.", "fix": "Node ** әдісі не бас үшін бөлек жағдай."},
    ],
    "assessment": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": LIST_C + '\n\nint sum_even(const Node *h)\n{\n    int s = 0;\n    for (; h; h = h->next)\n        if (h->value % 2 == 0)\n            s += h->value;\n    return s;\n}\n\nint main(void)\n{\n    Node *h = NULL;\n    for (int i = 1; i <= 6; i++)\n        h = push_front(h, i * 3);\n    printf("%d %d\\n", h->value, sum_even(h));\n    free_list(h);\n    return 0;\n}', "answer": "18 36", "cflags": ASAN,
         "hints": ["Мәндер: 3, 6, 9, 12, 15, 18; бас - соңғы қосылған.", "6 + 12 + 18."]},
        {"type": "pycode", "q": "Python түйіндерімен (Node: value, next) middle(head) - бос емес тізімнің ортаңғы түйінінің мәнін бір аралаумен («баяу/жылдам көрсеткіш») қайтарсын; жұп ұзындықта - екінші ортаңғы.", "mode": "io",
         "suffix": "def build(xs):\n    h = None\n    for x in reversed(xs):\n        h = Node(x, h)\n    return h\n\nprint(middle(build([1, 2, 3, 4, 5])), middle(build([1, 2, 3, 4])), middle(build([7])))",
         "starter": "class Node:\n    def __init__(self, value, next=None):\n        self.value, self.next = value, next\n\ndef middle(head):\n    return head.value\n",
         "tests": [{"stdin": "", "stdout": "3 3 7"}],
         "solution": "class Node:\n    def __init__(self, value, next=None):\n        self.value, self.next = value, next\n\ndef middle(head):\n    slow = fast = head\n    while fast is not None and fast.next is not None:\n        slow = slow.next\n        fast = fast.next.next\n    return slow.value",
         "hints": ["slow бір қадам, fast екі қадам.", "fast соңына жеткенде slow - ортада."]},
    ],
    "reflection": ["Python list орнына байланысқан тізім қолдану қай жағдайда мағыналы болар еді?"],
    "further": {"honors": ["Флойд алгоритмі («тасбақа мен қоян»): тізімде цикл бар-жоғын O(1) жадпен анықтаңыз және оның дұрыстығын дәлелдеңіз."],
                "research": ["Linux ядросының «интрузивті» тізімдері (list_head) кәдімгі тізімнен немен ерекшеленеді?"]},
    "references": REFS,
}

VEC_C = '''#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int *data;
    size_t len, cap;
} Vec;

int vec_push(Vec *v, int x)
{
    if (v->len == v->cap) {
        size_t new_cap = v->cap ? v->cap * 2 : 1;
        int *bigger = realloc(v->data, new_cap * sizeof *bigger);
        if (!bigger)
            return 0;
        v->data = bigger;
        v->cap = new_cap;
    }
    v->data[v->len++] = x;
    return 1;
}

void vec_free(Vec *v)
{
    free(v->data);
    v->data = NULL;
    v->len = v->cap = 0;
}'''

L09 = {
    **META, "id": "ao17-foundation.m11.l09", "slug": "l09", "title": "Динамикалық массив", "difficulty": 4, "minutes": 55,
    "objectives": [
        "Өлшемі өсетін массивті (len, cap, data) struct және realloc арқылы іске асыру.",
        "Сыйымдылықты еселеу стратегиясының амортизацияланған O(1) құнын дәлелдеу.",
        "Python list.append-тің ішкі жұмысын осы модельмен түсіндіру.",
    ],
    "prerequisites": ["ao17-foundation.m11.l08"],
    "concept": "<p>Массивтің артықшылығы (i-ші элементке O(1)) мен тізімнің икемділігін біріктіру: <b>динамикалық массив</b>. Ол үш өрісті сақтайды: data (үймедегі массив), len (элементтер саны), cap (сыйымдылық). Орын бітсе - realloc арқылы <b>екі есе</b> үлкен массив сұраймыз.</p>"
               "<p>Бір қосу кейде қымбат (барлық элементті көшіру - O(n)), бірақ бұл сирек болады. Орташа алғанда әр append тұрақты уақыт алады - бұл <b>амортизациялық талдау</b>. Python list, C++ vector, Java ArrayList - бәрі осылай жұмыс істейді.</p>",
    "theory": [
        {"kind": "definition", "title": "Амортизацияланған құн", "body": "<p>n амалдың жалпы құны T(n) болса, бір амалдың амортизацияланған құны T(n) / n. Жеке амал қымбат болуы мүмкін, бірақ тізбектің орташасы кіші.</p>"},
        {"kind": "theorem", "title": "Еселеу - амортизацияланған O(1)", "body": "<p>Сыйымдылық 1-ден басталып, толғанда екі есе өссе, n рет push жасағанда барлық көшірулер саны 2n-нен кем; демек бір push-тың амортизацияланған құны O(1).</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>Көшіру тек сыйымдылық 1, 2, 4, ..., 2ᵏ толғанда болады, мұнда 2ᵏ < n (n-ші push-қа дейін). 2ʲ-ден 2ʲ⁺¹-ге өскенде 2ʲ элемент көшіріледі. Барлығы: 1 + 2 + 4 + ... + 2ᵏ = 2ᵏ⁺¹ − 1 < 2n (өйткені 2ᵏ < n). Көшірусіз жазулар - n. Жалпы жұмыс < 3n, бір push-қа < 3. ∎ Ал сыйымдылықты тұрақты c-ға арттырсақ (cap += 10), көшірулер ≈ n²/(2c) - квадраттық.</p>"},
        {"kind": "note", "title": "Python list", "body": "<p>CPython list сыйымдылықты шамамен 1.125 есе (+ кішкене тұрақты) өсіреді - жадты үнемдейді, бірақ амортизацияланған құн бәрібір O(1) (кез келген тұрақты еселік > 1 жеткілікті). sys.getsizeof(lst) сыйымдылықтың секірістерін көрсетеді.</p>"},
    ],
    "visual": {"lab": "cshow", "code": VEC_C + '\n\nint main(void)\n{\n    Vec v = {0};\n    size_t last_cap = 0;\n    for (int i = 0; i < 20; i++) {\n        if (!vec_push(&v, i * i)) {\n            vec_free(&v);\n            return 1;\n        }\n        if (v.cap != last_cap) {\n            printf("len=%zu cap=%zu\\n", v.len, v.cap);\n            last_cap = v.cap;\n        }\n    }\n    printf("data[19]=%d\\n", v.data[19]);\n    vec_free(&v);\n    return 0;\n}', "cflags": ASAN,
               "output": "len=1 cap=1\nlen=2 cap=2\nlen=3 cap=4\nlen=5 cap=8\nlen=9 cap=16\nlen=17 cap=32\ndata[19]=361",
               "caption": "20 push - тек 6 рет қайта бөлу (1, 2, 4, 8, 16, 32). ASan-мен таза."},
    "derivation": [
        "Vec v = {0}; - data = NULL, len = cap = 0. realloc(NULL, ...) ≡ malloc.",
        "push: len == cap болса - new_cap = cap ? 2·cap : 1; realloc.",
        "realloc сәтсіз болса - ескі data сақталады (l05: уақытша айнымалы), 0 қайтарамыз.",
        "data[len++] = x. Соңында vec_free.",
    ],
    "examples": [
        {"title": "Көшірулерді санау: еселеу және +10", "lang": "c",
         "code": '#include <stdio.h>\n\nlong long copies(long long n, int doubling)\n{\n    long long cap = 0, len = 0, total = 0;\n    for (long long i = 0; i < n; i++) {\n        if (len == cap) {\n            total += len;\n            cap = doubling ? (cap ? cap * 2 : 1) : cap + 10;\n        }\n        len++;\n    }\n    return total;\n}\n\nint main(void)\n{\n    for (long long n = 1000; n <= 100000; n *= 10)\n        printf("n=%-7lld еселеу: %-7lld +10: %lld\\n", n, copies(n, 1), copies(n, 0));\n    return 0;\n}',
         "output": "n=1000    еселеу: 1023    +10: 49500\nn=10000   еселеу: 16383   +10: 4995000\nn=100000  еселеу: 131071  +10: 499950000",
         "explain": "Еселеуде көшірулер < 2n (теорема), ал «+10» стратегиясында ≈ n²/20 - n 10 есе өскенде 100 есе өсті (m09 l10 еселеу тәжірибесі)."},
    ],
    "experiment": {"lab": "pyrun", "code": "import sys\nlst, last = [], sys.getsizeof([])\nprint('бос:', last, 'байт')\nfor i in range(40):\n    lst.append(i)\n    size = sys.getsizeof(lst)\n    if size != last:\n        print(f'len={len(lst):3}  өлшем={size} байт  (+{size - last})')\n        last = size", "stdin": "",
                   "task": "Python list-тің өлшемі секірістермен өседі - бұл сыйымдылықтың артуы (бір көрсеткіш - 8 байт). Секірістер арасы біртіндеп ұлғаяды ма? (Нақты сандар Python нұсқасына байланысты.)"},
    "exercises": [
        {"type": "coutput", "q": "Бағдарлама не шығарады? (VEC_C: vec_push, vec_free.)", "code": VEC_C + '\n\nint main(void)\n{\n    Vec v = {0};\n    int reallocs = 0;\n    for (int i = 1; i <= 100; i++) {\n        size_t before = v.cap;\n        if (!vec_push(&v, i))\n            return 1;\n        if (v.cap != before)\n            reallocs++;\n    }\n    long long s = 0;\n    for (size_t i = 0; i < v.len; i++)\n        s += v.data[i];\n    printf("%zu %zu %d %lld\\n", v.len, v.cap, reallocs, s);\n    vec_free(&v);\n    return 0;\n}', "answer": "100 128 8 5050", "cflags": ASAN,
         "hints": ["Сыйымдылықтар: 1, 2, 4, ..., 128 - 8 рет.", "1 + ... + 100."]},
        {"type": "pycode", "q": "total_copies(n, factor) - сыйымдылық 1-ден басталып, толғанда ceil(cap · factor) болатын динамикалық массивке n push жасағанда барлық көшірілген элементтер санын қайтарсын (factor > 1).", "mode": "func", "func": "total_copies",
         "starter": "def total_copies(n, factor):\n    return n\n",
         "tests": [{"args": [1000, 2], "expect": 1023}, {"args": [1, 2], "expect": 0}, {"args": [20000, 2], "expect": 32767}, {"args": [10, 1.5], "expect": 19}],
         "solution": "import math\n\ndef total_copies(n, factor):\n    cap, length, total = 0, 0, 0\n    for _ in range(n):\n        if length == cap:\n            total += length\n            cap = 1 if cap == 0 else math.ceil(cap * factor)\n        length += 1\n    return total",
         "hints": ["Толғанда барлық len элемент көшіріледі.", "Бастапқы cap = 0, бірінші push-та 1."]},
        {"type": "number", "q": "Еселеу стратегиясында n = 1000 push кезінде барлық көшірулер саны (1 + 2 + 4 + ... + 512):", "answer": 1023, "check": "sum(2 ** j for j in range(10))", "hints": ["2¹⁰ − 1."]},
        {"type": "mc", "q": "Неге сыйымдылықты 10-ға емес, 2 есе арттырады?", "options": ["2 әдемірек сан", "Тұрақты қосымшада көшірулер O(n²), еселеуде O(n) (амортизацияланған O(1))", "Жад аз жұмсалады", "realloc тек 2 еселігін қабылдайды"], "answer": 1,
         "why": ["Себеп - асимптотика.", "Дұрыс (теорема).", "Еселеу көбірек бос орын қалдыруы мүмкін.", "Кез келген өлшем."], "hints": ["Мысалдағы кесте."]},
    ],
    "reasoning": "<p>Амортизациялық талдау - «кейде қымбат, орташа арзан» құрылымдарды бағалаудың құралы. Ол m09 l10-дағы өлшеу мен m04-тегі O-белгілеуін біріктіреді: еселеу тәжірибесі (кестедегі 100 есе өсу) теорияны растайды. Python list.append-тің «O(1)» деген сөзі енді дәлелденген факт.</p>",
    "mistakes": [
        {"mistake": "v->data = realloc(v->data, ...);", "why": "NULL қайтса, ескі массив жоғалады (ағып кету).", "fix": "Уақытша айнымалы + тексеру."},
        {"mistake": "data массивіне сақталған көрсеткішті push-тан кейін қолдану.", "why": "realloc массивті басқа жерге көшіруі мүмкін - ескі көрсеткіш ілулі.", "fix": "Индекс сақтау, көрсеткіш емес."},
    ],
    "assessment": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": VEC_C + '\n\nint vec_pop(Vec *v, int *out)\n{\n    if (v->len == 0)\n        return 0;\n    *out = v->data[--v->len];\n    return 1;\n}\n\nint main(void)\n{\n    Vec v = {0};\n    for (int i = 1; i <= 5; i++)\n        if (!vec_push(&v, i * 10))\n            return 1;\n    int x, s = 0;\n    while (vec_pop(&v, &x) && x > 20)\n        s += x;\n    printf("%d %zu %zu\\n", s, v.len, v.cap);\n    vec_free(&v);\n    return 0;\n}', "answer": "120 1 8", "cflags": ASAN,
         "hints": ["50 + 40 + 30; 20 шығарылды, бірақ қосылмады.", "pop сыйымдылықты азайтпайды."]},
        {"type": "mc", "q": "Еселеу стратегиясында бір push-тың ЕҢ НАШАР (жеке) құны:", "options": ["O(1)", "O(log n)", "O(n) - қайта бөлу кезінде", "O(n²)"], "answer": 2,
         "why": ["Бұл - амортизацияланған құн.", "Жоқ.", "Дұрыс: барлық элемент көшіріледі.", "Тым көп."], "hints": ["Жеке және амортизацияланған."]},
    ],
    "reflection": ["Нақты уақыт жүйелерінде (ойын кадры, ұшақ басқаруы) амортизацияланған O(1) неге жеткіліксіз болуы мүмкін?"],
    "further": {"honors": ["Сыйымдылықты кішірейту: len < cap/4 болғанда cap/2-ге азайту. Неге cap/2 шегінде емес, cap/4-те (тербелісті болдырмау)?"],
                "research": ["CPython-ның list_resize (Objects/listobject.c) формуласын оқыңыз: new_allocated = ... Ол неге 1.125 еселікке жақын?"]},
    "references": REFS,
}

L10 = {
    **META, "id": "ao17-foundation.m11.l10", "slug": "l10", "title": "Python-да жады қалай басқарылады", "difficulty": 3, "minutes": 55,
    "objectives": [
        "Python нысандарының сілтемелер санағышы (reference counting) арқылы жойылуын түсіндіру.",
        "Циклдық сілтемелер мен қоқыс жинаушының (gc) рөлін көрсету.",
        "C-ның қолмен басқаруы мен Python-ның автоматты басқаруын салыстыру; модуль жобасын (p11) жоспарлау.",
    ],
    "prerequisites": ["ao17-foundation.m11.l09", "ao17-foundation.m08.l02"],
    "concept": "<p>Python-да free жоқ - бірақ жад бәрібір босатылады. CPython-да әр нысанның <b>сілтемелер санағышы</b> бар: жаңа айнымалы не тізім элементі оған сілтесе +1, сілтеме жоғалса −1. Санағыш 0 болғанда нысан <b>бірден</b> жойылады (C-дағы free автоматты түрде шақырылады).</p>"
               "<p>Бір мәселе: <b>циклдар</b>. a.next = b, b.next = a болса, сыртқы сілтемелер жоғалса да әрқайсысының санағышы 1 - олар ешқашан 0-ге жетпейді. Бұл үшін Python-да қосымша <b>қоқыс жинаушы</b> (gc модулі) бар: ол мезгіл-мезгіл жетуге болмайтын циклдарды тауып, жояды.</p>",
    "theory": [
        {"kind": "definition", "title": "Сілтемелер санағышы", "body": "<p>refcount(x) = x-ке сілтейтін орындардың саны (айнымалылар, контейнер элементтері, атрибуттар, функция стегі). sys.getrefcount(x) - бұл сан + 1 (аргумент ретінде берілгені үшін).</p>"},
        {"kind": "theorem", "title": "Санағыш циклды жоя алмайды", "body": "<p>Нысандар циклы (әрқайсысына циклдағы басқасы сілтейді) сыртқы сілтемелер жойылғаннан кейін де тек санағыш арқылы жойылмайды.</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>Цикл x₁ → x₂ → ... → xₖ → x₁ болсын. Сыртқы сілтемелер жоқ болғанда әр xᵢ-ге циклдағы алдыңғы элемент сілтейді, демек refcount(xᵢ) ≥ 1 барлық i үшін. Санағыш әдісі нысанды тек refcount = 0 болғанда жояды. Бірде-бір xᵢ жойылмағандықтан, ешбір сілтеме жоғалмайды да, санағыштар азаймайды - ешбір xᵢ ешқашан 0-ге жетпейді. ∎ gc бұл жағдайды «қол жетімділік» арқылы шешеді: тамырлардан (айнымалылардан) жетуге болмайтын нысандар - қоқыс.</p>"},
        {"kind": "note", "title": "id() және мекенжай", "body": "<p>CPython-да id(x) - нысанның жадтағы мекенжайы. Python айнымалысы - нысанға сілтеме (C көрсеткішіне ұқсас), бірақ көрсеткіш арифметикасы, NULL-ды ашу, use-after-free мүмкін емес.</p>"},
    ],
    "visual": {"lab": "pyrun", "code": "import sys, gc\n\nclass Node:\n    def __init__(self, name):\n        self.name, self.next = name, None\n    def __del__(self):\n        print('  жойылды:', self.name)\n\nprint('1) санағыш:')\na = Node('A')\nb = a\nprint('  refcount:', sys.getrefcount(a) - 1)\ndel a\nprint('  a жойылды, бірақ b бар')\ndel b\nprint('2) цикл:')\nx, y = Node('X'), Node('Y')\nx.next, y.next = y, x\ndel x, y\nprint('  del-ден кейін - ештеңе жойылмады')\nprint('  gc тапқан нысандар:', gc.collect() >= 2)", "stdin": "",
               "caption": "A соңғы сілтеме (b) жойылғанда бірден жойылды. X↔Y циклы тек gc.collect() кезінде жойылды (теорема)."},
    "derivation": [
        "x = [1, 2, 3] - тізім нысаны, refcount = 1 (x).",
        "y = x - refcount = 2 (бүркеншік ат, m08 l02).",
        "del x - refcount = 1; тізім әлі тірі (y).",
        "y = None - refcount = 0 - тізім бірден жойылады (C-да free(...)-ке тең).",
    ],
    "examples": [
        {"title": "Сілтемелер мен көшірмелер", "lang": "python",
         "code": "import sys\n\ndata = [0] * 1000\nalias = data\ncopy = list(data)\nprint(alias is data, copy is data)\nprint(sys.getrefcount(data) - 1, sys.getrefcount(copy) - 1)\nholder = {'items': data}\nprint(sys.getrefcount(data) - 1)\ndel holder\nprint(sys.getrefcount(data) - 1)\nnested = [data, data, data]\nprint(sys.getrefcount(data) - 1, len(nested))",
         "output": "True False\n2 1\n3\n2\n5 3",
         "explain": "data-ға data және alias сілтейді (2). Сөздік элементі +1, сөздік жойылғанда −1. Тізімнің үш элементі - үш сілтеме: 2 + 3 = 5. copy - бөлек нысан, өз санағышы бар."},
    ],
    "experiment": {"lab": "pyrun", "code": "import gc\n\nclass Big:\n    def __init__(self):\n        self.payload = bytearray(10**6)   # 1 МБ\n        self.me = self                      # өзіне сілтеме - цикл!\n\ngc.disable()\nfor _ in range(5):\n    Big()\nprint('gc өшірулі - жиналмаған циклдар:', gc.collect())\ngc.enable()", "stdin": "",
                   "task": "gc өшірулі кезде әр Big нысаны (1 МБ) өзіне сілтегендіктен жойылмады - бұл Python-дағы «ағып кету». gc.collect() оларды тапты. self.me = self жолын алып тастап, қайта іске қосыңыз."},
    "exercises": [
        {"type": "pycode", "q": "refcounts(ops) - ('new', x), ('ref', x), ('unref', x) оқиғаларын өңдеп, жойылған нысандардың атауларын жойылу ретімен қайтарсын (санағыш 0-ге жеткенде). 'new' - санағыш 1.", "mode": "func", "func": "refcounts",
         "starter": "def refcounts(ops):\n    return [x for op, x in ops if op == 'unref']\n",
         "tests": [{"args": [[["new", "a"], ["unref", "a"]]], "expect": ["a"]}, {"args": [[["new", "a"], ["ref", "a"], ["unref", "a"]]], "expect": []},
                   {"args": [[["new", "a"], ["new", "b"], ["ref", "a"], ["unref", "b"], ["unref", "a"], ["unref", "a"]]], "expect": ["b", "a"]}],
         "solution": "def refcounts(ops):\n    count, gone = {}, []\n    for op, x in ops:\n        if op == 'new':\n            count[x] = 1\n        elif op == 'ref':\n            count[x] += 1\n        else:\n            count[x] -= 1\n            if count[x] == 0:\n                gone.append(x)\n    return gone",
         "hints": ["Сөздік: атау → санағыш.", "0-ге жеткенде - жойылды."]},
        {"type": "pycode", "q": "Қол жетімділік: garbage(graph, roots) - сілтемелер графы (нысан → сілтейтін нысандар) мен тамырлар тізімінен жетуге БОЛМАЙТЫН нысандарды (сұрыпталған) қайтарсын - gc-тің идеясы.", "mode": "func", "func": "garbage",
         "starter": "def garbage(graph, roots):\n    return sorted(x for x in graph if x not in roots)\n",
         "tests": [{"args": [{"a": ["b"], "b": [], "c": ["d"], "d": ["c"]}, ["a"]], "expect": ["c", "d"]}, {"args": [{"x": ["y"], "y": ["x"]}, []], "expect": ["x", "y"]}, {"args": [{"r": ["s"], "s": ["t"], "t": ["r"]}, ["s"]], "expect": []}],
         "solution": "def garbage(graph, roots):\n    seen, stack = set(roots), list(roots)\n    while stack:\n        u = stack.pop()\n        for v in graph.get(u, []):\n            if v not in seen:\n                seen.add(v)\n                stack.append(v)\n    return sorted(x for x in graph if x not in seen)",
         "hints": ["m09 l09 - графты аралау (DFS) тамырлардан.", "Жетілмеген - қоқыс."]},
        {"type": "mc", "q": "a = [1]; b = [a]; a.append(b); del a, b - не болады?", "options": ["Тізімдер бірден жойылады", "Цикл: санағыштар 0-ге жетпейді, тізімдерді gc кейін жинайды", "Қате шығады", "Жад мәңгі жоғалады"], "answer": 1,
         "why": ["Цикл - санағыш 1-ден төмен түспейді.", "Дұрыс (теорема).", "Қате жоқ.", "gc жинайды."], "hints": ["a → b → a."]},
        {"type": "mc", "q": "C мен Python жадты басқаруының дұрыс салыстыруы:", "options": ["Python-да жад қателері мүлде болмайды", "C - қолмен (malloc/free), Python - автоматты (санағыш + gc); Python-да use-after-free жоқ, бірақ ұзақ сілтемелер «ағып кету» береді", "C-да gc бар", "Python free-ді талап етеді"], "answer": 1,
         "why": ["Логикалық ағып кету бар (қажетсіз сілтемелер).", "Дұрыс.", "Стандартты C-да жоқ.", "free жоқ."], "hints": ["Эксперимент."]},
    ],
    "reasoning": "<p>m11-нің қорытындысы: жадты басқару - әр тілдің негізгі дизайн шешімі. C жылдамдық пен бақылауды береді, бірақ қателерді бағдарламашыға жүктейді. Python қауіпсіздік береді, бірақ санағыш пен gc уақыты бар. Rust үшінші жолды ұсынады - компилятор иелікті тексереді. Бұларды салыстыра алу - жүйелік ойлаудың белгісі (m12).</p>",
    "mistakes": [
        {"mistake": "«Python-да жад туралы ойлаудың қажеті жоқ».", "why": "Үлкен кэш-сөздіктер, жабылмаған циклдар жадты толтыра береді.", "fix": "Қажет емес сілтемелерді жою, weakref, tracemalloc арқылы өлшеу."},
        {"mistake": "__del__-ге сүйеніп ресурстарды (файлды) жабу.", "why": "Цикл болса, __del__ кешігеді не шақырылмауы мүмкін.", "fix": "with (m08 l06) - детерминистік жабу."},
    ],
    "assessment": [
        {"type": "pycode", "q": "count_refs(graph, target) - сілтемелер графында target нысанына сілтейтін сілтемелердің жалпы санын (бір нысаннан бірнеше рет сілтесе - бәрі) қайтарсын.", "mode": "func", "func": "count_refs",
         "starter": "def count_refs(graph, target):\n    return sum(1 for k in graph if target in graph[k])\n",
         "tests": [{"args": [{"a": ["t", "t"], "b": ["t"], "c": []}, "t"], "expect": 3}, {"args": [{"x": []}, "x"], "expect": 0}, {"args": [{"t": ["t"]}, "t"], "expect": 1}],
         "solution": "def count_refs(graph, target):\n    return sum(refs.count(target) for refs in graph.values())",
         "hints": ["Бір тізімде target бірнеше рет болуы мүмкін (nested = [data, data, data])."]},
        {"type": "mc", "q": "sys.getrefcount(x) неге күтілгеннен 1 артық?", "options": ["Python қатесі", "Функцияға аргумент ретінде берілгенде уақытша сілтеме қосылады", "id() сілтеме жасайды", "gc сілтемесі"], "answer": 1,
         "why": ["Қате емес.", "Дұрыс.", "Қатысы жоқ.", "gc сілтеме қоспайды."], "hints": ["Шақыру кезінде аргумент."]},
    ],
    "reflection": ["C-да жазған байланысқан тізім мен Python-дағы Node класын салыстырыңыз: free_list-тің Python-дағы баламасы не?"],
    "further": {"honors": ["Модуль жобасы - Memory Address Explorer (тапсырма төменде): C-дағы жадты зерттейтін және Python моделімен салыстыратын құрал."],
                "research": ["CPython 3.12+ «immortal objects» (PEP 683): кейбір нысандардың санағышы неге өзгермейді? Бұл көп ағынды орындауға қалай көмектеседі?"]},
    "references": REFS,
    "project": {"id": "p11", "title": "Memory Address Explorer",
                "statement": "C бағдарламасының жадын зерттейтін құрал жасаңыз: айнымалылардың, массивтердің, құрылымдардың, стек жақтауларының және үйме блоктарының мекенжайлары мен өлшемдерін (салыстырмалы түрде) шығарып, нәтижені Python моделі болжамымен салыстырыңыз. Құрал динамикалық массив пен байланысқан тізімнің іске асыруын да қамтиды және AddressSanitizer-мен таза өтеді.",
                "requirements": ["C бөлігі: sizeof/offsetof кестесі (кемінде 5 құрылым), массив элементтерінің мекенжай айырмалары, стек тереңдігі мен бағыты (рекурсия), үйме блоктары (malloc ретімен).",
                                 "Динамикалық массив (Vec) және байланысқан тізім: push, pop/remove, free; әрқайсысына тесттер.",
                                 "Python бөлігі: құрылым өлшемін болжайтын модель (туралау ережесі) және C шығысымен автоматты салыстыру (C бағдарламасын subprocess арқылы іске қосу).",
                                 "gcc -Wall -Wextra -Werror -fsanitize=address,undefined-пен таза; ағып кету жоқ.",
                                 "README: little-endian, туралау, стек/үйме айырмасы, Python-дағы сілтемелер санағышымен салыстыру."],
                "milestones": ["1. sizeof/offsetof кестесі.", "2. Стек пен үйме зерттеуі.", "3. Vec және тізім + тесттер.", "4. Python моделі және салыстыру скрипті.", "5. Санитайзерлер, README."],
                "acceptance": ["Python моделі барлық 5 құрылымның өлшемін gcc нәтижесімен дәл болжайды.", "Vec-ке 10⁶ push: қайта бөлулер саны ⌈log₂ 10⁶⌉ + 1 = 21.", "ASan/LSan бірде-бір қате таппайды.", "README-де кемінде 3 эксперимент нәтижесі түсіндірілген."],
                "rubric": ["C бөлігінің дұрыстығы мен қауіпсіздігі - 35%", "Python моделі және салыстыру - 25%", "Деректер құрылымдары мен тесттер - 20%", "Түсіндіру сапасы (README) - 20%"]},
}

LESSONS = [L06, L07, L08, L09, L10]
