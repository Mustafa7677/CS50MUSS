# © 2026 Sagid Mustafa. All Rights Reserved.
# AO17 CS Universe · Level I · m11 Memory & Pointers · 1-5 сабақтар. Авторлық мазмұн (AO17 үшін жаңадан жазылған).
# C коды build кезінде gcc-мен тексеріледі. Мекенжайлар әр іске қосуда өзгереді (ASLR), сондықтан тек айырмалар мен салыстырулар шығарылады.

REFS = [
    "ISO/IEC 9899:2011 (C11), 6.5.3.2 (& және *), 6.5.6 (көрсеткіш арифметикасы), 7.22.3 (жадты басқару функциялары).",
    "B. W. Kernighan, D. M. Ritchie, The C Programming Language, 5-тарау (Pointers and Arrays).",
    "R. E. Bryant, D. R. O'Hallaron, Computer Systems: A Programmer's Perspective, 3, 9 тараулар (салыстыру үшін).",
]
META = {"courseId": "ao17-foundation", "moduleId": "m11", "language": "kk", "academicLevel": "I",
        "license": "ARR", "authorship": "original", "reviewStatus": "author-checked", "version": "1.0.0"}

MEM_MODEL = ("mem = bytearray(16)          # 16 байттық «жад»; индекс = мекенжай\n\ndef store_int(addr, value):\n    mem[addr:addr + 4] = value.to_bytes(4, 'little', signed=True)\n\n"
             "def load_int(addr):\n    return int.from_bytes(mem[addr:addr + 4], 'little', signed=True)\n\n"
             "store_int(0, 258)            # int x = 258;  &x == 0\nstore_int(4, -1)             # int y = -1;   &y == 4\nprint(list(mem[:8]))\nprint(load_int(0), load_int(4))\nprint(load_int(1))           # «қате» мекенжайдан оқу - мағынасыз сан")

L01 = {
    **META, "id": "ao17-foundation.m11.l01", "slug": "l01", "title": "Жады моделі", "difficulty": 3, "minutes": 50,
    "objectives": [
        "Жадты нөмірленген байттар тізбегі (мекенжай → байт) ретінде модельдеу.",
        "Көп байтты мәндердің жадта орналасуын (little-endian) және sizeof-ты түсіндіру.",
        "Бағдарлама жадының аймақтарын (код, глобал, стек, үйме) атау.",
    ],
    "prerequisites": ["ao17-foundation.m10.l10"],
    "concept": "<p>Компьютер жады - өте ұзын <b>байттар тізбегі</b>. Әр байттың нөмірі бар - <b>мекенжай</b>. <code>int x = 258;</code> жазсақ, компилятор x үшін 4 қатар байт бөледі, ал x-тің мекенжайы - бірінші байттың нөмірі. 258 = 0x00000102, ал x86 процессорлары кіші байтты бірінші сақтайды (<b>little-endian</b>): 02 01 00 00.</p>"
               "<p>Бұл сабақтағы зертханада жадты Python-ның bytearray-імен модельдейміз: индекс - мекенжай. Модель шын жадтың маңызды қасиетін көрсетеді: байттардың өзінде тип жоқ, оларды int, char не float деп «оқитын» - бағдарлама.</p>",
    "theory": [
        {"kind": "definition", "title": "Жад аймақтары", "body": "<ul><li>Код (text) - машиналық командалар, тек оқуға.</li><li>Глобал/статикалық деректер - бағдарлама бойы өмір сүреді.</li><li>Стек - функция шақыруларының жергілікті айнымалылары (4-сабақ).</li><li>Үйме (heap) - malloc арқылы сұралатын жад (5-сабақ).</li></ul>"},
        {"kind": "theorem", "title": "Little-endian орналасу", "body": "<p>Little-endian машинада n байтты таңбасыз v мәнінің мекенжайы a болса, a + i мекенжайындағы байт ⌊v / 256ⁱ⌋ mod 256 (i = 0..n − 1).</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>v-ның 256 негізіндегі жазылуы: v = Σ bᵢ·256ⁱ, 0 ≤ bᵢ < 256 (m05 l02 санау жүйелері, бірегей). Little-endian анықтамасы бойынша bᵢ (i-ші «цифр») a + i мекенжайына жазылады. bᵢ-ді шығару: v-ны 256ⁱ-ге бөлгенде кіші i цифр қиылады, ал mod 256 келесі цифрларды алып тастайды: bᵢ = ⌊v / 256ⁱ⌋ mod 256. ∎ Мысал: 258 = 2 + 1·256 → байттар 2, 1, 0, 0.</p>"},
        {"kind": "note", "title": "Мекенжайлар неге өзгереді", "body": "<p>Қазіргі ОЖ қауіпсіздік үшін әр іске қосуда стек пен үйменің орнын кездейсоқ таңдайды (ASLR). Сондықтан бұл модульдің бағдарламалары мекенжайдың өзін емес, айырмаларын шығарады - олар тұрақты.</p>"},
    ],
    "visual": {"lab": "pyrun", "code": MEM_MODEL, "stdin": "",
               "caption": "258 → [2, 1, 0, 0], −1 → [255, 255, 255, 255] (қосымша код). 1-мекенжайдан оқу екі айнымалының байттарын араластырды - тип жадта емес, оқу тәсілінде."},
    "derivation": [
        "int x = 258; - 4 байт, мекенжайы &x.",
        "258 = 1·256 + 2 → байттар (кішіден): 02 01 00 00.",
        "Байттарды unsigned char ретінде оқу: ((unsigned char *)&x)[0] = 2.",
        "Big-endian машинада (кейбір желі протоколдары) реті керісінше: 00 00 01 02.",
    ],
    "examples": [
        {"title": "Байттарды көру", "lang": "c",
         "code": '#include <stdio.h>\n\nint main(void)\n{\n    int x = 258;\n    unsigned char *b = (unsigned char *)&x;\n    for (size_t i = 0; i < sizeof x; i++)\n        printf("%d ", b[i]);\n    printf("\\n");\n    int arr[3];\n    printf("%td %td\\n", (char *)&arr[1] - (char *)&arr[0], (char *)&arr[2] - (char *)&arr[0]);\n    double d = 1.0;\n    unsigned char *db = (unsigned char *)&d;\n    printf("%02x %02x\\n", db[7], db[6]);\n    return 0;\n}',
         "output": "2 1 0 0 \n4 8\n3f f0",
         "explain": "x86-64 - little-endian. Массив элементтері 4 байт сайын. 1.0 double-ның ең жоғарғы екі байты 3f f0 (IEEE 754: таңба 0, экспонента 1023 - m05 l05)."},
    ],
    "experiment": {"lab": "pyrun", "code": "def to_bytes_le(v, n):\n    return [(v // 256 ** i) % 256 for i in range(n)]\n\nfor v in [258, 65535, 2026, 16909060]:\n    print(v, to_bytes_le(v, 4), list(v.to_bytes(4, 'little')))", "stdin": "",
                   "task": "Теорема формуласы Python-ның to_bytes нәтижесімен бірдей ме? 16909060 = 0x01020304 - байттар қай ретпен шықты? 'big' деп өзгертіп көріңіз."},
    "exercises": [
        {"type": "pycode", "q": "le_bytes(v, n) - теріс емес v санының n байтты little-endian байттар тізімін қайтарсын (to_bytes-сыз, теорема формуласымен).", "mode": "func", "func": "le_bytes",
         "starter": "def le_bytes(v, n):\n    return [v % 256] * n\n",
         "tests": [{"args": [258, 4], "expect": [2, 1, 0, 0]}, {"args": [0, 2], "expect": [0, 0]}, {"args": [16909060, 4], "expect": [4, 3, 2, 1]}, {"args": [65535, 3], "expect": [255, 255, 0]}],
         "solution": "def le_bytes(v, n):\n    out = []\n    for _ in range(n):\n        out.append(v % 256)\n        v //= 256\n    return out",
         "hints": ["Әр қадамда v % 256 - кіші байт, сосын v //= 256."]},
        {"type": "coutput", "q": "Бағдарлама не шығарады (x86-64, little-endian)?", "code": '#include <stdio.h>\n\nint main(void)\n{\n    unsigned int v = 0x11223344;\n    unsigned char *p = (unsigned char *)&v;\n    printf("%x %x\\n", p[0], p[3]);\n    short s[4];\n    printf("%td\\n", (char *)&s[3] - (char *)&s[0]);\n    return 0;\n}', "answer": "44 11\n6",
         "hints": ["Кіші байт бірінші.", "short - 2 байт: 3 · 2."]},
        {"type": "number", "q": "int (4 байт) мәні 1000 = 0x000003E8. Little-endian-да оның бірінші (ең кіші мекенжайдағы) байтының ондық мәні:", "answer": 232, "check": "1000 % 256", "hints": ["0xE8."]},
        {"type": "mc", "q": "malloc арқылы бөлінген жад қай аймақта?", "options": ["Стек", "Үйме (heap)", "Код", "Регистр"], "answer": 1,
         "why": ["Стекте - жергілікті айнымалылар.", "Дұрыс.", "Код аймағы тек оқуға.", "Регистрлер - процессорда."], "hints": ["5-сабақ."]},
    ],
    "reasoning": "<p>«Айнымалы - мәні бар қорап» (m06) метафорасы енді нақтыланады: қорап - мекенжайдағы байттар, ал оның типі - байттарды қалай түсіндіру ережесі. Бұл модель көрсеткіштерді (2-сабақ), массивтерді (3-сабақ) және жад қателерін (6-сабақ) түсінуге кілт.</p>",
    "mistakes": [
        {"mistake": "Мекенжай әрқашан бірдей болады деп ойлау.", "why": "ASLR әр іске қосуда орындарды өзгертеді.", "fix": "Айырмаларға және салыстыруларға сүйену."},
        {"mistake": "Байттардың реті барлық машинада бірдей деп ойлау.", "why": "Big-endian жүйелер де бар (желі реті).", "fix": "Деректерді файлға/желіге жазғанда байт ретін анық белгілеу."},
    ],
    "assessment": [
        {"type": "pycode", "q": "from_le(bs) - little-endian байттар тізімінен таңбасыз санды қалпына келтірсін.", "mode": "func", "func": "from_le",
         "starter": "def from_le(bs):\n    v = 0\n    for b in bs:\n        v = v * 256 + b\n    return v\n",
         "tests": [{"args": [[2, 1, 0, 0]], "expect": 258}, {"args": [[4, 3, 2, 1]], "expect": 16909060}, {"args": [[]], "expect": 0}, {"args": [[255]], "expect": 255}],
         "solution": "def from_le(bs):\n    v = 0\n    for i, b in enumerate(bs):\n        v += b * 256 ** i\n    return v",
         "hints": ["Бастапқы код big-endian оқиды.", "v = Σ bᵢ · 256ⁱ."]},
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint main(void)\n{\n    int a = -2;\n    unsigned char *p = (unsigned char *)&a;\n    printf("%d %d %d %d\\n", p[0], p[1], p[2], p[3]);\n    return 0;\n}', "answer": "254 255 255 255",
         "hints": ["−2 қосымша кодта: 0xFFFFFFFE.", "Кіші байт бірінші: FE."]},
    ],
    "reflection": ["Python-да айнымалының мекенжайын id() көрсетеді. Ол C мекенжайымен қалай байланысты деп ойлайсыз (10-сабақ)?"],
    "further": {"honors": ["Big-endian/little-endian анықтайтын C бағдарламасын жазыңыз (int x = 1; бірінші байт 1 ме?)."],
                "research": ["«Endianness» термині «Гулливердің саяхаттарынан» шыққан. Желі протоколдарында (TCP/IP) неге big-endian қабылданды?"]},
    "references": REFS,
}

L02 = {
    **META, "id": "ao17-foundation.m11.l02", "slug": "l02", "title": "Көрсеткіштер", "difficulty": 4, "minutes": 55,
    "objectives": [
        "Көрсеткішті «мекенжайды сақтайтын айнымалы» ретінде анықтау; & және * амалдарын қолдану.",
        "Көрсеткіш арқылы функцияда шақырушының айнымалысын өзгерту (swap).",
        "NULL көрсеткішін және оны тексеру қажеттілігін түсіндіру.",
    ],
    "prerequisites": ["ao17-foundation.m11.l01"],
    "concept": "<p><b>Көрсеткіш</b> (pointer) - мекенжайды сақтайтын айнымалы. <code>int *p = &amp;x;</code> - p «x-ке көрсетеді». <code>*p</code> - p көрсетіп тұрған орындағы мән (<b>сілтемені ашу</b>, dereference): <code>*p = 7;</code> x-ті өзгертеді.</p>"
               "<p>m10 l05-те swap(int a, int b) жұмыс істемеді - көшірмелер. Енді <code>swap(int *a, int *b)</code> мекенжайларды алады да, <code>*a</code> арқылы шақырушының айнымалыларының өзін өзгертеді. scanf(\"%d\", &amp;x)-тегі &amp; да дәл осы себептен (m10 l08).</p>",
    "theory": [
        {"kind": "definition", "title": "& және *", "body": "<p>&x - x-тің мекенжайы (типі: T* , егер x - T). *p - p мекенжайындағы T типті нысан. *&x ≡ x. NULL - «ешқайда көрсетпейді» мәні; *NULL - анықталмаған әрекет (әдетте құлау).</p>"},
        {"kind": "theorem", "title": "Көрсеткіш арқылы swap", "body": "<p>void swap(int *a, int *b) { int t = *a; *a = *b; *b = t; } шақыруынан кейін swap(&x, &y) x пен y мәндерін айырбастайды.</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>Параметрлер a = &x, b = &y (мекенжайлардың көшірмелері - мәнмен беру сақталды, бірақ көшірілгені мекенжай). Бастапқы мәндер x = X, y = Y. t = *a = X. *a = *b: a мекенжайындағы нысан, яғни x-тің өзі, Y-ке тең болады. *b = t: y = X. Функциядан кейін x = Y, y = X. ∎ (x пен y бір айнымалы болса - swap(&x, &x) - мән өзгермейді, бұл да дұрыс.)</p>"},
        {"kind": "note", "title": "Типтің мәні", "body": "<p>int * пен char * бірдей мекенжай сақтай алады, бірақ *p қанша байт оқитынын тип анықтайды (l01 - тип оқу тәсілінде). Сондықтан көрсеткіштің типі маңызды.</p>"},
    ],
    "visual": {"lab": "cshow", "code": '#include <stdio.h>\n\nvoid swap(int *a, int *b)\n{\n    int t = *a;\n    *a = *b;\n    *b = t;\n}\n\nint main(void)\n{\n    int x = 1, y = 2;\n    int *p = &x;\n    *p = 10;\n    printf("x = %d, *p = %d\\n", x, *p);\n    p = &y;\n    *p += 5;\n    printf("y = %d\\n", y);\n    swap(&x, &y);\n    printf("%d %d %d\\n", x, y, p == &y);\n    return 0;\n}', "output": "x = 10, *p = 10\ny = 7\n7 10 1",
               "caption": "*p = 10 x-ті өзгертті. p енді y-ке көрсетеді. swap көрсеткіштермен жұмыс істеді (m10 l05-тегі қатені түзеттік)."},
    "derivation": [
        "Есеп: функция бір шақырумен екі нәтиже қайтарсын (бөлінді мен қалдық).",
        "C-да return тек бір мән береді.",
        "void divmod(int a, int b, int *q, int *r) { *q = a / b; *r = a % b; }",
        "Шақыру: int q, r; divmod(17, 5, &q, &r); - нәтижелер шақырушының айнымалыларына жазылды.",
    ],
    "examples": [
        {"title": "Шығыс параметрлер және NULL", "lang": "c",
         "code": '#include <stdio.h>\n#include <stddef.h>\n\nvoid divmod(int a, int b, int *q, int *r)\n{\n    *q = a / b;\n    *r = a % b;\n}\n\nint find(const int *a, int n, int x, int **where)\n{\n    for (int i = 0; i < n; i++)\n        if (a[i] == x) {\n            *where = (int *)&a[i];\n            return i;\n        }\n    *where = NULL;\n    return -1;\n}\n\nint main(void)\n{\n    int q, r;\n    divmod(17, 5, &q, &r);\n    printf("%d %d\\n", q, r);\n    int data[] = {4, 8, 15, 16};\n    int *w;\n    int i = find(data, 4, 15, &w);\n    printf("%d %d %d\\n", i, w != NULL, w ? *w : -1);\n    i = find(data, 4, 42, &w);\n    printf("%d %d\\n", i, w == NULL);\n    return 0;\n}',
         "output": "3 2\n2 1 15\n-1 1",
         "explain": "divmod шақырушының q мен r-іне жазды. find табылған элементтің мекенжайын қайтарды, табылмаса NULL - оны пайдаланбас бұрын тексереміз (w ? *w : -1)."},
    ],
    "experiment": {"lab": "pyrun", "code": "mem = [0] * 8          # модель: 8 ұяшық, индекс = мекенжай\nX, Y, P = 0, 1, 2      # x, y, p айнымалыларының мекенжайлары\nmem[X], mem[Y] = 1, 2  # int x = 1, y = 2;\nmem[P] = X             # int *p = &x;   (p-ның мәні - мекенжай)\nmem[mem[P]] = 10       # *p = 10;\nprint('x =', mem[X], ' p =', mem[P])\nmem[P] = Y             # p = &y;\nmem[mem[P]] += 5       # *p += 5;\nprint('y =', mem[Y], ' жад:', mem)", "stdin": "",
                   "task": "Көрсеткіш - мәні мекенжай болатын жай ұяшық. *p ≡ mem[mem[P]] - екі қадамдық қатынас. Модельде int **pp (көрсеткішке көрсеткіш) қосып көріңіз."},
    "exercises": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint main(void)\n{\n    int a = 3, b = 8;\n    int *p = &a, *q = &b;\n    *p = *q + 1;\n    q = p;\n    *q *= 2;\n    printf("%d %d %d\\n", a, b, *p == *q);\n    return 0;\n}', "answer": "18 8 1",
         "hints": ["a = 8 + 1 = 9.", "q енді a-ға көрсетеді: a = 18."]},
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nvoid min_max(const int *a, int n, int *lo, int *hi)\n{\n    *lo = *hi = a[0];\n    for (int i = 1; i < n; i++) {\n        if (a[i] < *lo)\n            *lo = a[i];\n        if (a[i] > *hi)\n            *hi = a[i];\n    }\n}\n\nint main(void)\n{\n    int v[] = {7, -2, 9, 4};\n    int lo, hi;\n    min_max(v, 4, &lo, &hi);\n    printf("%d %d\\n", lo, hi);\n    return 0;\n}', "answer": "-2 9",
         "hints": ["Екі нәтиже - екі шығыс параметр."]},
        {"type": "pycode", "q": "Жад моделі: deref(mem, p, steps) - mem тізімінде p мекенжайынан бастап сілтемені steps рет ашсын (*p, **p, ...) және соңғы мәнді қайтарсын. steps = 0 болса - p-ның өзі.", "mode": "func", "func": "deref",
         "starter": "def deref(mem, p, steps):\n    return mem[p]\n",
         "tests": [{"args": [[5, 0, 1, 2], 3, 1], "expect": 2}, {"args": [[5, 0, 1, 2], 3, 2], "expect": 1}, {"args": [[5, 0, 1, 2], 3, 3], "expect": 0}, {"args": [[5, 0, 1, 2], 3, 4], "expect": 5}, {"args": [[9], 0, 0], "expect": 0}],
         "solution": "def deref(mem, p, steps):\n    for _ in range(steps):\n        p = mem[p]\n    return p",
         "hints": ["Әр ашу: p = mem[p].", "steps = 0 - ешқандай ашу жоқ."]},
        {"type": "mc", "q": "int *p = NULL; printf(\"%d\", *p); не болады?", "options": ["0 шығады", "Анықталмаған әрекет (әдетте Segmentation fault)", "Компиляция қатесі", "NULL шығады"], "answer": 1,
         "why": ["NULL мекенжайында мән жоқ.", "Дұрыс.", "Компилятор қабылдайды.", "*p - int, бірақ оқу мүмкін емес."], "hints": ["NULL - «ешқайда»."]},
    ],
    "reasoning": "<p>Көрсеткіш - «қайда» мен «не» ұғымдарын ажырату. Python-да әр айнымалы іс жүзінде сілтеме (m08 l02 бүркеншік аттар), бірақ ол жасырын. C бұл механизмді ашады: сіз мекенжаймен тікелей жұмыс істейсіз. Бұл - қуат (шығыс параметрлер, деректер құрылымдары) және қауіп (NULL, ілулі көрсеткіштер - 6-сабақ).</p>",
    "mistakes": [
        {"mistake": "int *p; *p = 5; (p инициализацияланбаған).", "why": "p кез келген мекенжайды сақтауы мүмкін - жадты бүлдіру.", "fix": "Көрсеткішті әрқашан инициализациялау (&x, malloc не NULL)."},
        {"mistake": "int* a, b; - b-ны да көрсеткіш деп ойлау.", "why": "* тек a-ға қатысты: b - int.", "fix": "int *a, *b; не бөлек жолдарда."},
    ],
    "assessment": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nvoid rotate3(int *a, int *b, int *c)\n{\n    int t = *a;\n    *a = *b;\n    *b = *c;\n    *c = t;\n}\n\nint main(void)\n{\n    int x = 1, y = 2, z = 3;\n    rotate3(&x, &y, &z);\n    rotate3(&x, &y, &z);\n    printf("%d %d %d\\n", x, y, z);\n    int **pp;\n    int *p = &z;\n    pp = &p;\n    **pp = 100;\n    printf("%d\\n", z);\n    return 0;\n}', "answer": "3 1 2\n100",
         "hints": ["Бір айналу: (2, 3, 1); екінші: (3, 1, 2).", "**pp - z."]},
        {"type": "mc", "q": "scanf(\"%d\", &x) жолында & не үшін керек?", "options": ["Әдемілік үшін", "scanf x-ке жаза алуы үшін оның мекенжайы керек (мәнмен беру)", "x-ті нөлдеу үшін", "Тек ескі компиляторларға"], "answer": 1,
         "why": ["Міндетті.", "Дұрыс (теорема - swap сияқты).", "Жоқ.", "C11-де де міндетті."], "hints": ["Функция шақырушының айнымалысын қалай өзгертеді?"]},
    ],
    "reflection": ["Көрсеткішті күнделікті өмірдегі қандай нәрсемен салыстырар едіңіз (мекенжай жазылған қағаз, сілтеме)? Метафораның шегі қайда?"],
    "further": {"honors": ["Функцияға көрсеткіш (int (*f)(int)) - функцияны аргумент ретінде беру. Оны m07 l07 жоғары ретті функциялармен салыстырыңыз."],
                "research": ["Тони Хоар NULL-ды «миллиард долларлық қате» деп атады (2009). Неге? Rust-тың Option<T> түрі мұны қалай шешеді?"]},
    "references": REFS,
}

L03 = {
    **META, "id": "ao17-foundation.m11.l03", "slug": "l03", "title": "Көрсеткіш арифметикасы", "difficulty": 4, "minutes": 55,
    "objectives": [
        "p + k өрнегінің мағынасын (k элементке жылжу, k · sizeof(T) байт) түсіндіру.",
        "a[i] ≡ *(a + i) тепе-теңдігін және массив атауының бірінші элемент мекенжайына айналуын дәлелдеу.",
        "Көрсеткіштермен массив пен жолды аралау; көрсеткіштер айырмасын (ptrdiff_t) қолдану.",
    ],
    "prerequisites": ["ao17-foundation.m11.l02", "ao17-foundation.m10.l06"],
    "concept": "<p>p - int-ке көрсеткіш болса, <code>p + 1</code> - келесі int-тің мекенжайы, яғни 4 байт кейін (1 байт емес!). Көрсеткіш арифметикасы элементтермен өлшенеді. Массив атауы өрнекте бірінші элементтің мекенжайына айналады: <code>a</code> ≡ <code>&amp;a[0]</code>.</p>"
               "<p>Сондықтан <code>a[i]</code> - жай «синтаксистік қант»: стандарт оны <code>*(a + i)</code> деп анықтайды. Функцияға массив берілгенде (m10 l06) шын мәнінде көрсеткіш беріледі - sizeof жоғалуының себебі осы.</p>",
    "theory": [
        {"kind": "definition", "title": "Ережелер", "body": "<p>p + k (T *p): мекенжай + k · sizeof(T). q − p (бір массивтің көрсеткіштері): элементтер саны (ptrdiff_t). p &lt; q - бір массив ішінде салыстыру. Массивтен тыс (соңынан кейінгі шекарадан басқа) көрсеткіш жасау - UB.</p>"},
        {"kind": "theorem", "title": "a[i] ≡ *(a + i) ≡ i[a]", "body": "<p>a массив не көрсеткіш, i бүтін болса, a[i], *(a + i) және i[a] бір нысанды білдіреді.</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>C11 6.5.2.1/2: «E1[E2] өрнегі (*((E1)+(E2))) өрнегімен бірдей». a[i] = *(a + i) - анықтама. Қосу коммутативті: a + i = i + a (көрсеткіш пен бүтін санды қосу екі ретте де анықталған, 6.5.6). Демек i[a] = *(i + a) = *(a + i) = a[i]. ∎ (i[a] жазылуы - тек анықтаманың қызық салдары, оны кодта қолданбаймыз.)</p>"},
        {"kind": "note", "title": "Жолдарды көрсеткішпен аралау", "body": "<p>for (const char *s = str; *s; s++) - '\\0'-ге дейін жылжу. Индекс айнымалысы жоқ: көрсеткіштің өзі «курсор».</p>"},
    ],
    "visual": {"lab": "cshow", "code": '#include <stdio.h>\n\nint main(void)\n{\n    int a[5] = {10, 20, 30, 40, 50};\n    int *p = a;\n    printf("%d %d %d\\n", *p, *(p + 2), p[4]);\n    printf("%td %td\\n", (char *)(p + 1) - (char *)p, &a[4] - p);\n    p += 3;\n    printf("%d %d\\n", *p, p[-1]);\n    printf("%d\\n", 2[a]);\n    double d[3];\n    printf("%td\\n", (char *)(d + 1) - (char *)d);\n    return 0;\n}', "output": "10 30 50\n4 4\n40 30\n30\n8",
               "caption": "p + 1 - 4 байт кейін (int), d + 1 - 8 байт кейін (double). &a[4] − p = 4 элемент. 2[a] ≡ a[2] (теорема)."},
    "derivation": [
        "Есеп: жолдың ұзындығын көрсеткіштермен есептеу.",
        "const char *end = s; while (*end) end++;",
        "end '\\0'-де тоқтады; ұзындық = end − s (көрсеткіштер айырмасы).",
        "Индекссіз нұсқа - бірдей O(n), бірақ «курсорды жылжыту» ойлауы.",
    ],
    "examples": [
        {"title": "Көрсеткіштермен аралау", "lang": "c",
         "code": '#include <stdio.h>\n\nsize_t ptr_strlen(const char *s)\n{\n    const char *end = s;\n    while (*end)\n        end++;\n    return (size_t)(end - s);\n}\n\nint sum(const int *begin, const int *end)\n{\n    int s = 0;\n    for (const int *p = begin; p != end; p++)\n        s += *p;\n    return s;\n}\n\nvoid reverse(int *lo, int *hi)\n{\n    while (lo < --hi) {\n        int t = *lo;\n        *lo++ = *hi;\n        *hi = t;\n    }\n}\n\nint main(void)\n{\n    printf("%zu\\n", ptr_strlen("pointer"));\n    int v[] = {1, 2, 3, 4, 5, 6};\n    printf("%d %d\\n", sum(v, v + 6), sum(v + 2, v + 4));\n    reverse(v, v + 6);\n    for (int *p = v; p < v + 6; p++)\n        printf("%d ", *p);\n    printf("\\n");\n    return 0;\n}',
         "output": "7\n21 7\n6 5 4 3 2 1",
         "explain": "[begin, end) жарты ашық аралық (m09 l02): end - соңғы элементтен КЕЙІНГІ мекенжай, оны оқымаймыз. sum(v + 2, v + 4) = 3 + 4. *lo++ - алдымен *lo, сосын lo жылжиды."},
    ],
    "experiment": {"lab": "pyrun", "code": "SIZE = {'char': 1, 'short': 2, 'int': 4, 'double': 8}\nbase = 1000   # модельдік мекенжай\nfor t, s in SIZE.items():\n    addrs = [base + k * s for k in range(4)]\n    print(f'{t:6} p, p+1, p+2, p+3 ->', addrs)", "stdin": "",
                   "task": "Көрсеткіш арифметикасының ережесі: p + k = p + k · sizeof(T). Бір мекенжайдан басталған әр тип үшін «келесі элемент» әр жерде. Модельге struct (12 байт) қосып көріңіз."},
    "exercises": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint main(void)\n{\n    int a[] = {5, 10, 15, 20, 25};\n    int *p = a + 1;\n    int *q = &a[4];\n    printf("%d %d %td\\n", *p, *q, q - p);\n    printf("%d\\n", *(q - 2) + p[2]);\n    return 0;\n}', "answer": "10 25 3\n35",
         "hints": ["q − p = 4 − 1 элемент.", "*(q − 2) = a[2] = 15; p[2] = a[3] = 20."]},
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint main(void)\n{\n    const char *s = "algorithm";\n    const char *p = s + 3;\n    printf("%s\\n", p);\n    printf("%c%c\\n", *s, *(p + 2));\n    int count = 0;\n    for (const char *c = s; *c; c++)\n        if (*c == \'o\' || *c == \'i\')\n            count++;\n    printf("%d\\n", count);\n    return 0;\n}', "answer": "orithm\nai\n2",
         "hints": ["s + 3 - 'o'-дан басталатын жол.", "p + 2 - 'i'."]},
        {"type": "number", "q": "double *p мекенжайы 2000 болса, p + 5 мекенжайы (double - 8 байт):", "answer": 2040, "check": "2000 + 5 * 8", "hints": ["p + k · sizeof(T)."]},
        {"type": "mc", "q": "int a[10]; int *p = a + 10; дұрыс па?", "options": ["Иә, және *p оқуға болады", "Көрсеткіш жасауға болады (соңынан кейінгі шекара), бірақ *p - UB", "Компиляция қатесі", "Әрқашан құлайды"], "answer": 1,
         "why": ["a[10] массивтен тыс.", "Дұрыс: end көрсеткіші - [begin, end) аралығы үшін рұқсат.", "Қатесіз.", "Оқымаса - құламайды."], "hints": ["Жарты ашық аралық."]},
    ],
    "reasoning": "<p>Көрсеткіш арифметикасы C-ның массивтерінің «шын бет-бейнесін» ашады: массив - мекенжай мен ұзындық, ал индекстеу - қосу мен ашу. C++ STL итераторлары ([begin, end)) мен Python кесінділері (a[i:j]) дәл осы жарты ашық аралық идеясын мұраға алған.</p>",
    "mistakes": [
        {"mistake": "Көрсеткішті байт санымен жылжыту: p + 4 (int-тің келесі элементі деп).", "why": "p + 4 - 4 ЭЛЕМЕНТ (16 байт).", "fix": "p + 1 - келесі элемент; байт керек болса (char *) түрлендіру."},
        {"mistake": "Екі әр түрлі массивтің көрсеткіштерін азайту/салыстыру.", "why": "Тек бір массив ішінде анықталған (UB).", "fix": "Бір массивтің элементтерімен ғана."},
    ],
    "assessment": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint *find_max(int *begin, int *end)\n{\n    int *best = begin;\n    for (int *p = begin + 1; p < end; p++)\n        if (*p > *best)\n            best = p;\n    return best;\n}\n\nint main(void)\n{\n    int v[] = {3, 9, 2, 9, 7};\n    int *m = find_max(v, v + 5);\n    printf("%td %d\\n", m - v, *m);\n    *m = 0;\n    m = find_max(v, v + 5);\n    printf("%td %d\\n", m - v, *m);\n    return 0;\n}', "answer": "1 9\n3 9",
         "hints": ["> қатаң: бірінші 9 (индекс 1).", "Оны 0 етсек, келесі 9 - индекс 3."]},
        {"type": "pycode", "q": "Модель: ptr_add(addr, k, size) - T типті көрсеткішке k қосқандағы мекенжай; ptr_diff(p, q, size) - (q − p) элементтер саны. Python-да жазыңыз.", "mode": "io",
         "suffix": "print(ptr_add(1000, 3, 4), ptr_add(2000, -2, 8), ptr_add(50, 7, 1))\nprint(ptr_diff(1000, 1016, 4), ptr_diff(2000, 2040, 8), ptr_diff(1016, 1000, 4))",
         "starter": "def ptr_add(addr, k, size):\n    return addr + k\n\ndef ptr_diff(p, q, size):\n    return q - p\n",
         "tests": [{"stdin": "", "stdout": "1012 1984 57\n4 5 -4"}],
         "solution": "def ptr_add(addr, k, size):\n    return addr + k * size\n\ndef ptr_diff(p, q, size):\n    return (q - p) // size",
         "hints": ["Мекенжайға k · size қосылады.", "Айырма байтта, бөлу size-ке."]},
    ],
    "reflection": ["a[i] ≡ *(a + i) - қай сабақтағы ұғымдарды (m10 l06, m11 l01) біріктіреді? Сіз үшін қайсысы түсінікті жазылу?"],
    "further": {"honors": ["Көп өлшемді массив int m[3][4]: m[i][j] ≡ *(*(m + i) + j). m + 1 неше байтқа жылжиды (16)?"],
                "research": ["C++ итераторлары мен Python итераторлары көрсеткіш идеясын қалай жалпылайды?"]},
    "references": REFS,
}

L04 = {
    **META, "id": "ao17-foundation.m11.l04", "slug": "l04", "title": "Стек және шақырулар", "difficulty": 4, "minutes": 50,
    "objectives": [
        "Шақыру стегін жақтаулар (frame) тізбегі ретінде модельдеу: параметрлер, жергілікті айнымалылар, қайту орны.",
        "Жергілікті айнымалының өмір сүру уақытын және оның мекенжайын қайтарудың қаупін түсіндіру.",
        "Рекурсия тереңдігі мен стек жадының байланысын (Stack overflow) көрсету.",
    ],
    "prerequisites": ["ao17-foundation.m11.l03", "ao17-foundation.m09.l06"],
    "concept": "<p>Әр функция шақыруы <b>стекке</b> бір <b>жақтау</b> қосады: параметрлер, жергілікті айнымалылар және «қайда қайту керек» мекенжайы. Функция аяқталғанда жақтау алынады - оның жергілікті айнымалылары <b>жойылады</b>. m09 l06-да айқын стек жасағанымыз - компьютердің өзі осылай жұмыс істейді.</p>"
               "<p>Салдар: жергілікті айнымалының мекенжайын қайтару - қате. <code>int *f(void) { int x = 5; return &amp;x; }</code> - f біткенде x жоқ, көрсеткіш «ілулі» қалады. gcc мұны -Wreturn-local-addr ескертуімен ұстайды.</p>",
    "theory": [
        {"kind": "definition", "title": "Автоматты сақтау ұзақтығы", "body": "<p>Функция ішінде (static-сіз) жарияланған айнымалы - автоматты: оның өмірі блокқа кіргенде басталып, блоктан шыққанда бітеді (C11 6.2.4). Жадының орны - әдетте стек.</p>"},
        {"kind": "theorem", "title": "Стек тереңдігі", "body": "<p>Рекурсивті функция әр шақыруда кемінде F байттық жақтау қолданса, тереңдігі d рекурсия кемінде d · F байт стек жадын қажет етеді; стек өлшемі S болса, d > S / F болғанда стек толады.</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>Тереңдігі d рекурсияда ең терең нүктеде d шақыру бір мезгілде белсенді: әрқайсысы әлі аяқталмаған (оның ішіндегі шақыру жалғасып жатыр), сондықтан олардың жақтаулары стекте қатар тұр (жақтау тек функция аяқталғанда алынады). Жақтаулар қиылыспайды, әрқайсысы ≥ F байт, барлығы ≥ d · F. Стек S байттан аспайды, демек d · F > S болса, сыймайды. ∎ Linux-та әдепкі стек ≈ 8 МБ; жақтауы 100 байт рекурсия ≈ 80 000 тереңдікте құлайды.</p>"},
        {"kind": "note", "title": "Стек төмен қарай өседі", "body": "<p>x86-64-те стек жоғары мекенжайлардан төменге өседі: шақырылған функцияның жергілікті айнымалылары әдетте шақырушынікінен кіші мекенжайда. Бұл - іске асыру ерекшелігі, стандарт талабы емес.</p>"},
    ],
    "visual": {"lab": "calltree", "code": "def depth_sum(n):\n    if n == 0:\n        return 0\n    return n + depth_sum(n - 1)", "call": "depth_sum(5)",
               "caption": "Әр түйін - стектегі бір жақтау. Ең терең нүктеде 6 жақтау қатар тұр (n = 5..0); әрқайсысы өз n-ін сақтайды."},
    "derivation": [
        "main шақырады f(3): стекке f-тің жақтауы (n = 3, қайту мекенжайы).",
        "f(3) шақырады f(2): тағы бір жақтау үстіне.",
        "f(0) қайтады: жақтау алынады, басқару f(1)-дегі сақталған қайту орнына.",
        "Бәрі қайтқанда стек main-нің жақтауына қайта оралады.",
    ],
    "examples": [
        {"title": "Жақтаулар: мекенжайлар айырмасы мен тереңдік", "lang": "c",
         "code": '#include <stdio.h>\n#include <stdint.h>\n\nstatic uintptr_t top;\n\nint probe(int n)\n{\n    int local = n;\n    if (n == 0)\n        return 0;\n    if (n == 3)\n        top = (uintptr_t)&local;\n    int r = probe(n - 1);\n    if (n == 2) {\n        uintptr_t mine = (uintptr_t)&local;\n        printf("стек төмен өседі: %d\\n", mine < top);\n    }\n    return r + local;\n}\n\nint main(void)\n{\n    printf("%d\\n", probe(3));\n    return 0;\n}',
         "output": "стек төмен өседі: 1\n6",
         "explain": "probe(2)-нің local-ы probe(3)-тікінен кіші мекенжайда - x86-64-те стек төмен өседі. Нақты мекенжайлар ASLR-мен өзгереді, бірақ салыстыру нәтижесі тұрақты. Әр жақтаудың өз local-ы бар."},
    ],
    "experiment": {"lab": "cshow", "code": '#include <stdio.h>\n\nint *bad(void)\n{\n    static int keep = 42;\n    return &keep;\n}\n\nint main(void)\n{\n    int *p = bad();\n    printf("%d\\n", *p);\n    *p = 7;\n    printf("%d\\n", *bad());\n    return 0;\n}', "output": "42\n7",
                   "task": "static айнымалы стекте емес, бағдарлама бойы өмір сүреді - оның мекенжайын қайтару қауіпсіз. static-ті алып тастасаңыз, gcc «function returns address of local variable» деп ескертеді (бұл курс оны қате деп есептейді)."},
    "exercises": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint depth = 0, max_depth = 0;\n\nint f(int n)\n{\n    depth++;\n    if (depth > max_depth)\n        max_depth = depth;\n    int r = n < 2 ? n : f(n - 1) + f(n - 2);\n    depth--;\n    return r;\n}\n\nint main(void)\n{\n    int r = f(6);\n    printf("%d %d %d\\n", r, max_depth, depth);\n    return 0;\n}', "answer": "8 6 0",
         "hints": ["Ең терең тізбек: f(6) → f(5) → ... → f(1) - 6 жақтау.", "Соңында барлық жақтау алынды."]},
        {"type": "pycode", "q": "Стек моделі: max_stack(events) - 'call' / 'return' оқиғаларының тізбегіндегі стектің ең үлкен тереңдігін қайтарсын; бос стектен return болса - -1 (қате тізбек).", "mode": "func", "func": "max_stack",
         "starter": "def max_stack(events):\n    return events.count('call')\n",
         "tests": [{"args": [["call", "call", "return", "call", "return", "return"]], "expect": 2}, {"args": [[]], "expect": 0}, {"args": [["call", "return", "return"]], "expect": -1}, {"args": [["call", "call", "call", "return", "return", "return", "call"]], "expect": 3}],
         "solution": "def max_stack(events):\n    depth = best = 0\n    for e in events:\n        if e == 'call':\n            depth += 1\n            best = max(best, depth)\n        else:\n            if depth == 0:\n                return -1\n            depth -= 1\n    return best",
         "hints": ["Ағымдағы тереңдік пен максимумды бөлек сақтаңыз.", "Бос стектен return - қате."]},
        {"type": "number", "q": "Рекурсивті функцияның жақтауы 64 байт, стек 8 МБ (8 · 2²⁰ байт). Теорема бойынша ең үлкен қауіпсіз тереңдік (шамамен, бүтін бөлу):", "answer": 131072, "check": "8 * 2 ** 20 // 64", "hints": ["S / F."]},
        {"type": "mc", "q": "int *f(void) { int x = 5; return &x; } - мәселе неде?", "options": ["Мәселе жоқ", "f біткенде x жойылады - қайтарылған көрсеткіш ілулі", "x тым кіші", "int көрсеткішін қайтаруға болмайды"], "answer": 1,
         "why": ["Мәселе бар.", "Дұрыс: автоматты сақтау ұзақтығы.", "Өлшемге қатысы жоқ.", "Болады, бірақ жарамды нысанға."], "hints": ["Жақтау қашан алынады?"]},
    ],
    "reasoning": "<p>Стек - ең жылдам және ең қарапайым жад басқаруы: бөлу мен босату - бір регистрді жылжыту. Бірақ оның шегі бар: өлшемі шектеулі және нысан функциядан «аман шыға» алмайды. Функциядан ұзақ өмір сүруі керек деректер үшін - келесі сабақтағы үйме.</p>",
    "mistakes": [
        {"mistake": "Жергілікті массивтің мекенжайын қайтару (char buf[64]; return buf;).", "why": "Функциядан кейін buf жоқ.", "fix": "Шақырушының буферін параметр етіп алу не malloc."},
        {"mistake": "Стекте өте үлкен массив (int big[10000000];).", "why": "40 МБ стекке сыймайды - құлау.", "fix": "static не malloc (үйме)."},
        {"mistake": "printf(\"%d %d\", f(), global) - f() global-ды өзгертеді деп күту.", "why": "Аргументтердің есептелу реті анықталмаған: gcc бұл модульді тексергенде global-ды f()-тен БҰРЫН оқыды.", "fix": "Алдымен int r = f(); сосын printf."},
    ],
    "assessment": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nvoid fill(int *out, int n)\n{\n    for (int i = 0; i < n; i++)\n        out[i] = i * i;\n}\n\nint main(void)\n{\n    int buf[5];\n    fill(buf, 5);\n    int s = 0;\n    for (int i = 0; i < 5; i++)\n        s += buf[i];\n    printf("%d %d\\n", buf[4], s);\n    return 0;\n}', "answer": "16 30",
         "hints": ["Шақырушының буфері - қауіпсіз үлгі.", "0 + 1 + 4 + 9 + 16."]},
        {"type": "mc", "q": "Неге рекурсия тереңдігі шектеулі, ал цикл - жоқ?", "options": ["Цикл жылдамырақ", "Әр рекурсивті шақыру стекке жақтау қосады; цикл стек жадын көбейтпейді", "Компилятор рекурсияны тыяды", "Цикл үйме қолданады"], "answer": 1,
         "why": ["Жылдамдық себеп емес.", "Дұрыс (теорема).", "Тыймайды.", "Цикл қосымша жад қолданбайды."], "hints": ["Жақтаулар."]},
    ],
    "reflection": ["m09 l06-да рекурсияны циклға аудардыңыз. Енді оның «шын себебін» стек тұрғысынан түсіндіріңіз."],
    "further": {"honors": ["ulimit -s командасымен стек өлшемін өзгертіп, рекурсия тереңдігінің шегі қалай өзгеретінін тексеріңіз."],
                "research": ["Стек буферінің толуы (stack smashing) және оған қарсы қорғаулар: canary, ASLR, NX бит. -fstack-protector не істейді?"]},
    "references": REFS,
}

L05 = {
    **META, "id": "ao17-foundation.m11.l05", "slug": "l05", "title": "Үйме (heap)", "difficulty": 4, "minutes": 55,
    "objectives": [
        "malloc, calloc, realloc және free арқылы динамикалық жад бөлу және босату.",
        "malloc нәтижесін (NULL) тексеру және өлшемді sizeof арқылы дұрыс есептеу.",
        "«Бөлдің бе - босат» ережесін және иелік (ownership) ұғымын қолдану.",
    ],
    "prerequisites": ["ao17-foundation.m11.l04"],
    "concept": "<p><b>Үйме</b> (heap) - бағдарлама орындау кезінде сұрайтын жад. <code>int *a = malloc(n * sizeof *a);</code> n int-ке орын береді; ол функциядан кейін де өмір сүреді, бірақ <code>free(a)</code> шақырылғанша. Стектен айырмашылығы: өлшемі орындау кезінде анықталады, өмірін бағдарламашы басқарады.</p>"
               "<p>malloc жад таппаса NULL қайтарады - оны тексеру міндетті. malloc берген жад инициализацияланбаған («қоқыс»); calloc нөлдейді. Әр malloc-қа дәл бір free керек: босатылмаса - <b>ағып кету</b> (leak), екі рет босатылса - <b>қос босату</b> (6-сабақ).</p>",
    "theory": [
        {"kind": "definition", "title": "Функциялар (stdlib.h)", "body": "<p>malloc(bytes) - бөлу (инициализациясыз). calloc(n, size) - n · size байт, нөлдермен. realloc(p, new_bytes) - өлшемді өзгерту (мазмұн сақталады, мекенжай өзгеруі мүмкін). free(p) - босату; free(NULL) - ештеңе істемейді.</p>"},
        {"kind": "theorem", "title": "Өлшемді дұрыс есептеу", "body": "<p>T *p = malloc(n * sizeof *p); жазылуы p-ның типі қандай болса да n элементке дәл жеткілікті жад сұрайды.</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>sizeof *p - өрнектің типінің өлшемі; *p-ның типі T (p - T*), сондықтан sizeof *p = sizeof(T), ал sizeof есептелмейді (тек тип қаралады) - p әлі инициализацияланбаса да қауіпсіз. n элементке n · sizeof(T) байт керек (m10 l06 теоремасы). Кейін p-ның типін, мысалы, double-ға өзгертсек, sizeof *p өзі 8-ге өзгереді - sizeof(int) жазылуындай «ескірген» тип қатесі мүмкін емес. ∎ (n · sizeof *p асып кетпеуі үшін n-нің шегін тексеру не calloc.)</p>"},
        {"kind": "note", "title": "Иелік", "body": "<p>Жадты кім босатады? Ереже: функция жадты бөліп қайтарса, оны босату - шақырушының міндеті, және бұл құжатта (docstring сияқты түсініктемеде) айтылуы керек. Python-да бұл мәселені қоқыс жинаушы шешеді (10-сабақ).</p>"},
    ],
    "visual": {"lab": "cshow", "code": '#include <stdio.h>\n#include <stdlib.h>\n\nint main(void)\n{\n    int n = 5;\n    int *a = malloc(n * sizeof *a);\n    if (a == NULL)\n        return 1;\n    for (int i = 0; i < n; i++)\n        a[i] = (i + 1) * 10;\n    int *z = calloc(3, sizeof *z);\n    if (z == NULL) {\n        free(a);\n        return 1;\n    }\n    printf("%d %d | %d %d %d\\n", a[0], a[4], z[0], z[1], z[2]);\n    free(a);\n    free(z);\n    return 0;\n}', "output": "10 50 | 0 0 0", "cflags": ["-fsanitize=address"],
               "caption": "Бұл бағдарлама AddressSanitizer-мен (ағып кетуді де тексереді) таза өтті: әр бөлуге бір free. calloc нөлдеді."},
    "derivation": [
        "Есеп: n санды оқып, оларды кері ретпен шығару; n орындау кезінде белгілі.",
        "int *a = malloc(n * sizeof *a); if (!a) { fprintf(stderr, ...); return 1; }",
        "Оқу: for (i ...) scanf(\"%d\", &a[i]);",
        "Шығару: for (i = n - 1; i >= 0; i--) ...; соңында free(a).",
    ],
    "examples": [
        {"title": "Функция жад бөліп қайтарады", "lang": "c", "cflags": ["-fsanitize=address"], "stdin": "4\n7 3 9 1\n",
         "code": '#include <stdio.h>\n#include <stdlib.h>\n\n/* Жаңа массив қайтарады: a-ның префикстік қосындылары.\n   Босату - шақырушының міндеті. Жад жетпесе NULL. */\nlong long *prefix_sums(const int *a, int n)\n{\n    long long *ps = malloc((size_t)(n + 1) * sizeof *ps);\n    if (ps == NULL)\n        return NULL;\n    ps[0] = 0;\n    for (int i = 0; i < n; i++)\n        ps[i + 1] = ps[i] + a[i];\n    return ps;\n}\n\nint main(void)\n{\n    int n;\n    if (scanf("%d", &n) != 1 || n <= 0)\n        return 1;\n    int *a = malloc((size_t)n * sizeof *a);\n    if (a == NULL)\n        return 1;\n    for (int i = 0; i < n; i++)\n        if (scanf("%d", &a[i]) != 1) {\n            free(a);\n            return 1;\n        }\n    long long *ps = prefix_sums(a, n);\n    if (ps == NULL) {\n        free(a);\n        return 1;\n    }\n    printf("%lld %lld\\n", ps[n], ps[3] - ps[1]);\n    free(ps);\n    free(a);\n    return 0;\n}',
         "output": "20 12",
         "explain": "prefix_sums жадты үймеден бөлді - ол функциядан кейін де бар (стектен айырмашылығы). Әр қате жолында бұрын бөлінгенді босатамыз. ASan ағып кету таппады. ps[3] − ps[1] = 3 + 9."},
    ],
    "experiment": {"lab": "cshow", "code": '#include <stdio.h>\n#include <stdlib.h>\n\nint main(void)\n{\n    int cap = 2, n = 0;\n    int *a = malloc(cap * sizeof *a);\n    if (!a)\n        return 1;\n    for (int v = 1; v <= 9; v++) {\n        if (n == cap) {\n            cap *= 2;\n            int *bigger = realloc(a, cap * sizeof *a);\n            if (!bigger) {\n                free(a);\n                return 1;\n            }\n            a = bigger;\n            printf("сыйымдылық -> %d\\n", cap);\n        }\n        a[n++] = v * v;\n    }\n    printf("n=%d соңғы=%d\\n", n, a[n - 1]);\n    free(a);\n    return 0;\n}', "output": "сыйымдылық -> 4\nсыйымдылық -> 8\nсыйымдылық -> 16\nn=9 соңғы=81", "cflags": ["-fsanitize=address"],
                   "task": "realloc нәтижесін бөлек айнымалыға аламыз: NULL болса, ескі a жоғалмауы керек. Бұл - 9-сабақтағы динамикалық массивтің ядросы."},
    "exercises": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n#include <stdlib.h>\n\nint main(void)\n{\n    int *p = malloc(4 * sizeof *p);\n    if (!p)\n        return 1;\n    for (int i = 0; i < 4; i++)\n        p[i] = 4 - i;\n    int *q = p + 1;\n    q[1] = 100;\n    printf("%d %d %d %d\\n", p[0], p[1], p[2], p[3]);\n    free(p);\n    return 0;\n}', "answer": "4 3 100 1", "cflags": ["-fsanitize=address"],
         "hints": ["q[1] ≡ p[2].", "free(p) - q емес (q бөлінген блоктың басы емес)."]},
        {"type": "mc", "q": "malloc(n * sizeof(int)) нәтижесін тексермеу қаупі:", "options": ["Жоқ, malloc ешқашан қателеспейді", "Жад жетпесе NULL қайтады; *NULL - анықталмаған әрекет", "Бағдарлама баяулайды", "Жад екі есе бөлінеді"], "answer": 1,
         "why": ["Жад шектеулі, үлкен сұраныс сәтсіз болуы мүмкін.", "Дұрыс.", "Қатысы жоқ.", "Жоқ."], "hints": ["Қайтару мәні."]},
        {"type": "pycode", "q": "Үйме моделі: allocator(ops) - ('malloc', id) және ('free', id) операциялар тізбегін өңдеп, ['leak', ...] не қателер тізімін қайтарсын: босатылмаған id-лер (сұрыпталған) үшін 'leak:id', жоқ id-ді босату - 'bad-free:id', қос босату - 'double-free:id' (оқиға ретімен). Қате жоқ болса - бос тізім.", "mode": "func", "func": "allocator",
         "starter": "def allocator(ops):\n    return []\n",
         "tests": [{"args": [[["malloc", "a"], ["free", "a"]]], "expect": []}, {"args": [[["malloc", "a"], ["malloc", "b"], ["free", "a"]]], "expect": ["leak:b"]},
                   {"args": [[["malloc", "a"], ["free", "a"], ["free", "a"]]], "expect": ["double-free:a"]}, {"args": [[["free", "x"], ["malloc", "c"], ["malloc", "b"]]], "expect": ["bad-free:x", "leak:b", "leak:c"]}],
         "solution": "def allocator(ops):\n    live, freed, errors = set(), set(), []\n    for op, k in ops:\n        if op == 'malloc':\n            live.add(k)\n            freed.discard(k)\n        elif k in live:\n            live.remove(k)\n            freed.add(k)\n        elif k in freed:\n            errors.append(f'double-free:{k}')\n        else:\n            errors.append(f'bad-free:{k}')\n    return errors + [f'leak:{k}' for k in sorted(live)]",
         "hints": ["Тірі блоктар (live) және босатылғандар (freed) жиындары.", "Соңында live-та қалғандар - ағып кету."]},
        {"type": "number", "q": "int *p = malloc(n * sizeof *p); - n = 250 болса, неше байт сұралады (int - 4 байт)?", "answer": 1000, "check": "250 * 4", "hints": ["Теорема."]},
    ],
    "reasoning": "<p>Үйме бағдарламашыға толық бақылау береді: деректер қанша керек болса сонша, қанша уақыт керек болса сонша. Бағасы - жауапкершілік: әр бөлудің иесі болуы керек. Бұл - C-ның ең көп қате туатын жері, сондықтан келесі сабақ толығымен жад қателеріне арналған.</p>",
    "mistakes": [
        {"mistake": "malloc(n) - элемент санын байт деп беру.", "why": "n int-ке n · 4 байт керек.", "fix": "malloc(n * sizeof *p)."},
        {"mistake": "p = realloc(p, ...);", "why": "realloc NULL қайтарса, ескі p жоғалады - ағып кету.", "fix": "Уақытша айнымалыға алып, тексеру."},
    ],
    "assessment": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nchar *repeat(const char *s, int k)\n{\n    size_t len = strlen(s);\n    char *out = malloc(len * k + 1);\n    if (!out)\n        return NULL;\n    for (int i = 0; i < k; i++)\n        memcpy(out + i * len, s, len);\n    out[len * k] = \'\\0\';\n    return out;\n}\n\nint main(void)\n{\n    char *r = repeat("ab", 3);\n    if (!r)\n        return 1;\n    printf("%s %zu\\n", r, strlen(r));\n    free(r);\n    return 0;\n}', "answer": "ababab 6", "cflags": ["-fsanitize=address"],
         "hints": ["len · k + 1 байт - терминатор үшін +1 (m10 l07).", "Шақырушы босатады."]},
        {"type": "mc", "q": "malloc мен calloc айырмасы:", "options": ["Айырма жоқ", "calloc жадты нөлдейді және n, size екі аргументін алады", "malloc үйме емес, стек", "calloc жадты босатады"], "answer": 1,
         "why": ["Бар.", "Дұрыс.", "Екеуі де үйме.", "Босату - free."], "hints": ["c - cleared."]},
    ],
    "reflection": ["Python-да list.append жасағанда жад қайдан келеді деп ойлайсыз? (9 және 10-сабақтар.)"],
    "further": {"honors": ["malloc-тың қарапайым іске асыруын (бос блоктар тізімі, first-fit) Python-да модельдеңіз: бөлу, босату, фрагментация."],
                "research": ["glibc malloc (ptmalloc) пен jemalloc, tcmalloc айырмашылықтары. Неге браузерлер мен деректер базалары өз аллокаторларын қолданады?"]},
    "references": REFS,
}

LESSONS = [L01, L02, L03, L04, L05]
