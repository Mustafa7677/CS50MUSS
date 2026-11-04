# © 2026 Sagid Mustafa. All Rights Reserved.
# AO17 CS Universe · Level I · m10 C Programming Foundations · 1-5 сабақтар. Авторлық мазмұн (AO17 үшін жаңадан жазылған).
# Барлық C коды build кезінде нағыз gcc (-std=c11 -Wall -Wextra -Werror) арқылы компиляцияланып, шығысы тексеріледі.

REFS = [
    "ISO/IEC 9899:2011 (C11) стандарты - тілдің ресми анықтамасы (салыстыру үшін).",
    "B. W. Kernighan, D. M. Ritchie, The C Programming Language, 2-басылым.",
    "GCC құжаттамасы: Invoking GCC, Warning Options.",
]
META = {"courseId": "ao17-foundation", "moduleId": "m10", "language": "kk", "academicLevel": "I",
        "license": "ARR", "authorship": "original", "reviewStatus": "author-checked", "version": "1.0.0"}

HELLO = '#include <stdio.h>\n\nint main(void)\n{\n    printf("Сәлем, C!\\n");\n    printf("2 + 3 = %d\\n", 2 + 3);\n    return 0;\n}'

L01 = {
    **META, "id": "ao17-foundation.m10.l01", "slug": "l01", "title": "C және компиляция", "difficulty": 2, "minutes": 45,
    "objectives": [
        "Бастапқы код, компилятор, объект файл, орындалатын файл ұғымдарын ажырату.",
        "Компиляция кезеңдерін (препроцессор, компиляция, ассемблер, байланыстырушы) ретімен атау.",
        "Қарапайым C бағдарламасын жазып, gcc-мен компиляциялап, іске қосу; ескертулерді (-Wall) оқу.",
    ],
    "prerequisites": ["ao17-foundation.m06.l10", "ao17-foundation.m05.l10"],
    "concept": "<p>Python бағдарламаны <b>интерпретатор</b> жол-жолмен орындайды. C-да алдымен <b>компилятор</b> бүкіл бастапқы кодты процессордың машиналық кодына аударады, сосын дайын <b>орындалатын файл</b> іске қосылады. Сондықтан C бағдарламалары жылдам, бірақ қателердің көбі компиляция кезінде (не одан да жаман - орындау кезінде үнсіз) шығады.</p>"
               "<p>Браузерде нағыз C компиляторы жоқ, сондықтан бұл модульде C кодын <b>оқимыз, болжаймыз және талдаймыз</b>. Әр мысал мен «шығысты болжа» тапсырмасының жауабы сайтты құрастыру кезінде нағыз <code>gcc -std=c11 -Wall -Wextra -Werror</code> арқылы алынған. Өз компьютеріңізде: <code>gcc -Wall -o hello hello.c && ./hello</code>.</p>",
    "theory": [
        {"kind": "definition", "title": "Компиляция кезеңдері", "body": "<ol><li>Препроцессор: #include файлдарын қою, #define алмастыру (gcc -E).</li><li>Компиляция: C → ассемблер коды (gcc -S).</li><li>Ассемблер: → объект файл .o (gcc -c).</li><li>Байланыстырушы (linker): объект файлдар + кітапханалар (printf) → орындалатын файл.</li></ol>"},
        {"kind": "theorem", "title": "main-нің қайтару мәні", "body": "<p>main-нен return k бағдарламаның шығу кодын k етеді (0 - сәтті). C99/C11-де main соңына return жазылмаса, return 0 деп есептеледі (тек main үшін).</p>"},
        {"kind": "proof", "title": "Негіздеу (стандарт бойынша)", "body": "<p>C11 5.1.2.2.3: «main функциясынан қайту - exit функциясын main қайтарған мәнмен шақырумен бірдей; main-нің соңғы } белгісіне жету 0 қайтарады». exit(k) операциялық жүйеге k күйін береді, оны shell-де echo $? көрсетеді. Демек return k ⇒ шығу коды k (0..255 аралығына келтіріліп). ∎</p>"},
        {"kind": "note", "title": "Ескертулер - досыңыз", "body": "<p>-Wall -Wextra ескертулері көп қатені бағдарламаны іске қоспай-ақ табады: пайдаланылмаған айнымалы, printf форматы мен типтің сәйкессіздігі, мәні берілмеген айнымалы. Бұл курста барлық мысал -Werror-мен (ескерту = қате) өтеді.</p>"},
    ],
    "visual": {"lab": "cshow", "code": HELLO, "output": "Сәлем, C!\n2 + 3 = 5",
               "caption": "#include <stdio.h> printf функциясын жариялайды; %d - бүтін санды шығару орны; \\n - жаңа жол (C өзі қоспайды)."},
    "derivation": [
        "hello.c файлына код жазамыз.",
        "gcc -E hello.c | tail - препроцессор stdio.h-ты қосқанын көреміз (мыңдаған жол).",
        "gcc -c hello.c → hello.o (машиналық код, бірақ printf әлі «сыртқы сілтеме»).",
        "gcc hello.o -o hello → байланыстыру; ./hello - іске қосу; echo $? - шығу коды 0.",
    ],
    "examples": [
        {"title": "Бірінші бағдарлама және шығу коды", "lang": "c",
         "code": '#include <stdio.h>\n\nint main(void)\n{\n    int students = 25;\n    int groups = 4;\n    printf("Оқушылар: %d\\n", students);\n    printf("Әр топта: %d, артық: %d\\n", students / groups, students % groups);\n    return 3;\n}',
         "output": "Оқушылар: 25\nӘр топта: 6, артық: 1", "exit": 3,
         "explain": "25 / 4 бүтін сандарда 6 (бөлшек бөлігі тасталады). Бағдарлама 3 кодымен аяқталды - shell-де echo $? 3 көрсетеді."},
    ],
    "experiment": {"lab": "cshow", "code": '#include <stdio.h>\n\nint main(void)\n{\n    printf("бір");\n    printf("екі\\n");\n    printf("үш\\tтөрт\\n");\n    return 0;\n}', "output": "бірекі\nүш\tтөрт",
                   "task": "Бірінші printf-те \\n жоқ - «бір» мен «екі» бір жолда. \\t - табуляция. Шығысты болжап, сосын көрсетіңіз."},
    "exercises": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint main(void)\n{\n    int a = 7, b = 2;\n    printf("%d %d\\n", a / b, a % b);\n    printf("%d\\n", a * b - 1);\n    return 0;\n}', "answer": "3 1\n13",
         "hints": ["int / int - бүтін бөлу.", "7 = 3 · 2 + 1."]},
        {"type": "order", "q": "gcc hello.c -o hello командасының ішкі кезеңдерін ретке қойыңыз.", "steps": ["Препроцессор: #include және #define өңдеу.", "Компиляция: C кодын ассемблерге аудару.", "Ассемблер: объект файл (.o) жасау.", "Байланыстырушы: объект файлды кітапханамен біріктіріп, орындалатын файл жасау."],
         "hints": ["#include ең бірінші өңделеді.", "printf-тің коды соңғы кезеңде қосылады."]},
        {"type": "mc", "q": "Python мен C-ның басты айырмашылығы:", "options": ["C-да айнымалы жоқ", "C коды алдымен машиналық кодқа толық аударылады, сосын орындалады", "Python-да функция жоқ", "C тек Windows-та жұмыс істейді"], "answer": 1,
         "why": ["Бар.", "Дұрыс: компиляция мен интерпретация.", "Бар.", "C - ең тасымалды тілдердің бірі."], "hints": ["Компилятор не істейді?"]},
        {"type": "coutput", "q": "Шығысты жазыңыз (әр printf-тің \\n-іне назар аударыңыз).", "code": '#include <stdio.h>\n\nint main(void)\n{\n    printf("А");\n    printf("Б\\n\\n");\n    printf("%d%d\\n", 1, 2);\n    return 0;\n}', "answer": "АБ\n\n12",
         "hints": ["\\n\\n - бос жол.", "%d%d арасында бос орын жоқ."]},
    ],
    "reasoning": "<p>C - «машинаға жақын» тіл: ол жадты, типтердің өлшемін, тіпті қателерді де бағдарламашыға тапсырады. Сондықтан C үйрену - компьютердің шын жұмысын (m05 биттер, m11 жады) түсіну. Python-да жасырылған нәрсенің бәрі мұнда ашық.</p>",
    "mistakes": [
        {"mistake": "printf-те \\n-ді ұмыту.", "why": "C жаңа жолды өзі қоспайды (Python print-тен айырмашылығы).", "fix": "printf(\"...\\n\")."},
        {"mistake": "Ескертулерді елемеу.", "why": "Ескерту көбіне нақты қате (мысалы, %d орнына double берілген).", "fix": "Әрқашан -Wall -Wextra, ал оқу кезінде -Werror."},
    ],
    "assessment": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint main(void)\n{\n    int x = 10;\n    x = x + 5;\n    x = x / 4;\n    printf("x = %d\\n", x);\n    printf("%d\\n", x * x);\n    return 0;\n}', "answer": "x = 3\n9",
         "hints": ["15 / 4 = 3 (бүтін)."]},
        {"type": "mc", "q": "printf функциясының машиналық коды орындалатын файлға қай кезеңде қосылады?", "options": ["Препроцессор", "Компиляция", "Ассемблер", "Байланыстыру (linking)"], "answer": 3,
         "why": ["Препроцессор тек жариялауды (stdio.h) қосады.", "Компилятор шақыруды ғана жазады.", "Объект файлда printf - ашық сілтеме.", "Дұрыс: стандартты кітапханамен байланыстыру."], "hints": ["stdio.h-та printf-тің денесі жоқ."]},
    ],
    "reflection": ["Python-да ешқашан ойламаған, ал C-да бірден маңызды болған нәрсе не (мысалы, \\n, бүтін бөлу)?"],
    "further": {"honors": ["gcc -S hello.c жасап, hello.s файлындағы ассемблер кодын ашыңыз. printf шақыруын табыңыз (call printf не puts) - неге кейде puts?"],
                "research": ["Интерпретатор, компилятор және JIT (PyPy, JavaScript V8) - айырмашылықтары мен артықшылықтары қандай?"]},
    "references": REFS,
}

SIZES = '#include <stdio.h>\n#include <limits.h>\n\nint main(void)\n{\n    printf("char: %zu байт, %d..%d\\n", sizeof(char), CHAR_MIN, CHAR_MAX);\n    printf("short: %zu байт, %d..%d\\n", sizeof(short), SHRT_MIN, SHRT_MAX);\n    printf("int: %zu байт, %d..%d\\n", sizeof(int), INT_MIN, INT_MAX);\n    printf("long long: %zu байт\\n", sizeof(long long));\n    printf("double: %zu байт\\n", sizeof(double));\n    printf("unsigned char: 0..%d\\n", UCHAR_MAX);\n    return 0;\n}'

L02 = {
    **META, "id": "ao17-foundation.m10.l02", "slug": "l02", "title": "Типтер және өлшемдер", "difficulty": 3, "minutes": 50,
    "objectives": [
        "char, short, int, long long, double, unsigned типтерінің өлшемі мен шектерін (sizeof, limits.h) білу.",
        "n биттік таңбалы және таңбасыз типтердің ауқымын есептеп, дәлелдеу.",
        "Таңбасыз типтегі «айналып кету» (модуль 2ⁿ арифметикасы) мен таңбалы асып кетудің айырмасын ажырату.",
    ],
    "prerequisites": ["ao17-foundation.m10.l01", "ao17-foundation.m05.l04"],
    "concept": "<p>Python-да int шексіз үлкен бола алады. C-да әр типтің <b>тұрақты өлшемі</b> бар: int әдетте 4 байт (32 бит), сондықтан ол тек −2 147 483 648 .. 2 147 483 647 аралығын сақтайды. Өлшемді <code>sizeof</code> береді, шектерді <code>&lt;limits.h&gt;</code>.</p>"
               "<p>Стандарт тек ең аз өлшемдерді кепілдейді (int ≥ 16 бит, long long ≥ 64 бит). Бұл бетте көрсетілген сандар - кәдімгі 64 биттік Linux/gcc жүйесінікі. Таңбасыз (unsigned) типте асып кету <b>анықталған</b>: мән 2ⁿ модулі бойынша айналады. Ал таңбалы int асып кетсе - <b>анықталмаған әрекет</b> (9-сабақ).</p>",
    "theory": [
        {"kind": "definition", "title": "Ауқымдар", "body": "<p>n биттік таңбасыз: 0 .. 2ⁿ − 1. n биттік таңбалы (қосымша код, m05 l04): −2ⁿ⁻¹ .. 2ⁿ⁻¹ − 1.</p>"},
        {"kind": "theorem", "title": "Таңбалы ауқымның асимметриясы", "body": "<p>n биттік қосымша кодта ең кіші мән −2ⁿ⁻¹, ең үлкен мән 2ⁿ⁻¹ − 1; теріс мәндер оң мәндерден бір артық.</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>n бит 2ⁿ әр түрлі үлгі береді. Қосымша кодта жоғарғы бит 0 болатын 2ⁿ⁻¹ үлгі - 0, 1, ..., 2ⁿ⁻¹ − 1 (0 және оң сандар), жоғарғы бит 1 болатын 2ⁿ⁻¹ үлгі - −2ⁿ⁻¹, ..., −1 (теріс сандар; үлгінің мәні = таңбасыз мәні − 2ⁿ). Нөл «оң» жартыда тұрғандықтан, оң сандар 2ⁿ⁻¹ − 1, теріс сандар 2ⁿ⁻¹. ∎ Сондықтан −INT_MIN int-ке сыймайды.</p>"},
        {"kind": "note", "title": "Келтіру (conversion)", "body": "<p>Үлкен мәнді таңбасыз типке меншіктеу модуль 2ⁿ бойынша келтіреді: unsigned char c = 300; → c = 300 − 256 = 44. Бұл анықталған. Ал таңбалы типке сыймайтын мәнді меншіктеу нәтижесі іске асыруға тәуелді.</p>"},
    ],
    "visual": {"lab": "cshow", "code": SIZES, "output": "char: 1 байт, -128..127\nshort: 2 байт, -32768..32767\nint: 4 байт, -2147483648..2147483647\nlong long: 8 байт\ndouble: 8 байт\nunsigned char: 0..255",
               "caption": "%zu - sizeof нәтижесі (size_t) үшін формат. Шектер теоремадағы формулаға сәйкес: 2⁷ − 1 = 127, 2¹⁵ − 1 = 32767, 2³¹ − 1."},
    "derivation": [
        "int 32 бит (sizeof(int) = 4, 1 байт = 8 бит).",
        "Таңбасыз: 2³² = 4 294 967 296 мән, 0 .. 4 294 967 295 (UINT_MAX).",
        "Таңбалы: −2³¹ .. 2³¹ − 1 = −2 147 483 648 .. 2 147 483 647.",
        "UINT_MAX + 1u = 0 (модуль 2³²) - анықталған айналу.",
    ],
    "examples": [
        {"title": "Таңбасыз айналу", "lang": "c",
         "code": '#include <stdio.h>\n#include <limits.h>\n\nint main(void)\n{\n    unsigned int u = UINT_MAX;\n    unsigned char c = 250;\n    printf("%u %u\\n", u, u + 1u);\n    c = c + 10;\n    printf("%d\\n", c);\n    unsigned int small = 3, big = 5;\n    printf("%u\\n", small - big);\n    long long wide = 2147483647LL + 1;\n    printf("%lld\\n", wide);\n    return 0;\n}',
         "output": "4294967295 0\n4\n4294967294\n2147483648",
         "explain": "260 mod 256 = 4; 3 − 5 таңбасызда 2³² − 2. long long-та 2³¹ сыяды - типті кеңейту асып кетуден сақтайды."},
    ],
    "experiment": {"lab": "bitpanel", "a": "250", "op": "+", "b": "10", "width": 8,
                   "task": "8 биттік қосу: 250 + 10 = 260, бірақ 8 битке тек 260 − 256 = 4 сыяды. Бұл - C-дағы unsigned char-дың дәл мінезі. Енді ені 16 бит етіп көріңіз."},
    "exercises": [
        {"type": "number", "q": "unsigned short (16 бит) типінің ең үлкен мәні:", "answer": 65535, "check": "2 ** 16 - 1", "hints": ["2ⁿ − 1."]},
        {"type": "number", "q": "32 биттік таңбалы int-тің ең кіші мәні (теріс сан):", "answer": -2147483648, "check": "-(2 ** 31)", "hints": ["−2ⁿ⁻¹."]},
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint main(void)\n{\n    unsigned char a = 200;\n    unsigned char b = 100;\n    unsigned char s = a + b;\n    printf("%d\\n", s);\n    printf("%d\\n", a + b);\n    return 0;\n}', "answer": "44\n300",
         "hints": ["s-ке меншіктегенде 300 mod 256.", "a + b өрнегі int-те есептеледі (бүтін сандарды көтеру) - 300."]},
        {"type": "pycode", "q": "to_uint8(x) - Python-да C-дағы unsigned char-ға меншіктеуді модельдесін: кез келген бүтін x үшін x mod 256 (теріс сандар да).", "mode": "func", "func": "to_uint8",
         "starter": "def to_uint8(x):\n    return x\n",
         "tests": [{"args": [300], "expect": 44}, {"args": [255], "expect": 255}, {"args": [256], "expect": 0}, {"args": [-1], "expect": 255}, {"args": [-300], "expect": 212}],
         "solution": "def to_uint8(x):\n    return x % 256",
         "hints": ["Python-да % нәтижесі бөлгіш таңбасымен: -1 % 256 = 255.", "Немесе x & 0xFF (m05 l07)."]},
    ],
    "reasoning": "<p>Тұрақты өлшем - жылдамдықтың бағасы: процессор 64 биттік сандарды бір командамен қосады, ал Python-ның шексіз int-і бірнеше командамен. C бағдарламашысы әр айнымалыға «бұл мән қаншалықты үлкен бола алады?» деп сұрақ қояды - бұл Python-да жоқ жаңа жауапкершілік.</p>",
    "mistakes": [
        {"mistake": "Сомма/көбейтінді int-ке сыяды деп ойлау (мысалы, 50 000 · 50 000).", "why": "2.5·10⁹ > INT_MAX - таңбалы асып кету (анықталмаған).", "fix": "long long және 50000LL * 50000."},
        {"mistake": "unsigned айнымалыда кері санау: for (unsigned i = n - 1; i >= 0; i--).", "why": "i >= 0 әрқашан ақиқат: 0-ден кейін 4294967295.", "fix": "int i не for (unsigned i = n; i-- > 0; )."},
    ],
    "assessment": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint main(void)\n{\n    unsigned int x = 0;\n    x = x - 1;\n    printf("%u\\n", x);\n    printf("%u\\n", x / 2);\n    printf("%zu\\n", sizeof(x) * 8);\n    return 0;\n}', "answer": "4294967295\n2147483647\n32",
         "hints": ["0 − 1 таңбасызда 2³² − 1.", "sizeof · 8 - бит саны."]},
        {"type": "pycode", "q": "to_int8(x) - C-дағы 8 биттік таңбалы типке (қосымша код) келтіруді модельдесін: нәтиже −128..127 аралығында, x-пен 256 модулі бойынша салыстырымды.", "mode": "func", "func": "to_int8",
         "starter": "def to_int8(x):\n    return x % 256\n",
         "tests": [{"args": [127], "expect": 127}, {"args": [128], "expect": -128}, {"args": [255], "expect": -1}, {"args": [300], "expect": 44}, {"args": [-129], "expect": 127}],
         "solution": "def to_int8(x):\n    v = x % 256\n    return v - 256 if v >= 128 else v",
         "hints": ["Алдымен 0..255-ке келтіріңіз.", "128 және одан жоғары - теріс: v − 256 (теорема)."]},
    ],
    "reflection": ["Сіздің бағдарламаңызда қай айнымалы int-тің шегіне жетуі мүмкін (мысалы, миллисекундтардағы уақыт)?"],
    "further": {"honors": ["<stdint.h>: int32_t, uint8_t, int64_t - нақты өлшемді типтер. Неге олар int пен long-тан тасымалдырақ?"],
                "research": ["2038 жыл мәселесі: 32 биттік time_t қашан және неге асып кетеді? Ол Y2K-мен қалай салыстырылады?"]},
    "references": REFS,
}

L03 = {
    **META, "id": "ao17-foundation.m10.l03", "slug": "l03", "title": "Операторлар және өрнектер", "difficulty": 3, "minutes": 50,
    "objectives": [
        "Бүтін бөлу мен қалдықтың C ережесін (нөлге қарай қию) Python-мен (төменге қарай) салыстыру.",
        "Айқын (cast) және айқын емес түрлендірулерді, бүтін сандарды көтеруді қолдану.",
        "Операторлардың басымдығы мен ++/-- , +=, тернарлы ?: операторын дұрыс оқу.",
    ],
    "prerequisites": ["ao17-foundation.m10.l02"],
    "concept": "<p>C-да <code>7 / 2</code> - 3, ал <code>7.0 / 2</code> - 3.5: нәтиже типі операндтардың типінен анықталады. Бір операнд double болса, екіншісі де double-ға түрленеді. Айқын түрлендіру: <code>(double)a / b</code>.</p>"
               "<p>Назар аударыңыз: теріс сандарда C мен Python әртүрлі! C-да <code>-7 / 2 = -3</code>, <code>-7 % 2 = -1</code> (нөлге қарай қию), ал Python-да <code>-7 // 2 = -4</code>, <code>-7 % 2 = 1</code> (төменге қарай). Бір алгоритмді екі тілге аударғанда бұл жасырын қате көзі.</p>",
    "theory": [
        {"kind": "definition", "title": "C11 бөлу ережесі", "body": "<p>Бүтін a / b - нақты бөліндінің бөлшек бөлігі тасталады (нөлге қарай). a % b анықтамасы: (a / b) * b + a % b == a (b ≠ 0).</p>"},
        {"kind": "theorem", "title": "Қалдықтың таңбасы", "body": "<p>C-да b ≠ 0 үшін a % b-ның таңбасы a-ның таңбасымен бірдей (не нөл), және |a % b| < |b|.</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>q = a / b - нөлге қарай қиылған: |q| ≤ |a/b| және q пен a/b таңбалас (не q = 0). r = a − q·b. Егер a ≥ 0, b > 0: q = ⌊a/b⌋, 0 ≤ r < b. Жалпы жағдайда |q·b| ≤ |a| және q·b пен a таңбалас, демек r = a − q·b да a-мен таңбалас (не 0). Қию 1-ден кем бөлшекті тастайды: |a/b − q| < 1 ⇒ |r| = |b|·|a/b − q| < |b|. ∎ Мысалы, −7 = (−3)·2 + (−1).</p>"},
        {"kind": "note", "title": "Басымдық", "body": "<p>Жоғарыдан төменге: ++ -- (постфикс) → унарлы - ! (type) → * / % → + - → &lt;&lt; &gt;&gt; → &lt; &lt;= → == != → &amp; → ^ → | → &amp;&amp; → || → ?: → = += ... Күмән болса - жақша.</p>"},
    ],
    "visual": {"lab": "cshow", "code": '#include <stdio.h>\n\nint main(void)\n{\n    printf("%d %d\\n", 7 / 2, 7 % 2);\n    printf("%d %d\\n", -7 / 2, -7 % 2);\n    printf("%d %d\\n", 7 / -2, 7 % -2);\n    printf("%.2f %.2f\\n", 7 / 2.0, (double)7 / 2);\n    printf("%.2f\\n", (double)(7 / 2));\n    return 0;\n}', "output": "3 1\n-3 -1\n-3 1\n3.50 3.50\n3.00",
               "caption": "Соңғы жол: жақша ішіндегі бүтін бөлу бірінші орындалады - (double)3 = 3.00. Қалдықтың таңбасы бөлінгіштікі (теорема)."},
    "derivation": [
        "Орташа баллды есептеу: int sum = 17, n = 4.",
        "sum / n = 4 - бөлшек жоғалды.",
        "(double)sum / n = 4.25 - sum алдымен double-ға, сосын бөлу.",
        "(double)(sum / n) = 4.00 - қате: бөлу бүтін сандарда бұрын болды.",
    ],
    "examples": [
        {"title": "++, +=, ?: және көтеру", "lang": "c",
         "code": '#include <stdio.h>\n\nint main(void)\n{\n    int i = 5;\n    int a = i++;\n    int b = ++i;\n    printf("%d %d %d\\n", a, b, i);\n    int x = 10;\n    x += 3;\n    x *= 2;\n    x %= 7;\n    printf("%d\\n", x);\n    int score = 73;\n    printf("%s\\n", score >= 60 ? "өтті" : "өтпеді");\n    char c = \'A\';\n    printf("%d %c\\n", c + 1, c + 1);\n    return 0;\n}',
         "output": "5 7 7\n5\nөтті\n66 B",
         "explain": "i++ ескі мәнді береді, ++i - жаңасын. (10 + 3)·2 = 26, 26 % 7 = 5. char арифметикада int-ке көтеріледі: 'A' = 65."},
    ],
    "experiment": {"lab": "pyrun", "code": "for a, b in [(7, 2), (-7, 2), (7, -2), (-7, -2)]:\n    q_py, r_py = a // b, a % b\n    q_c = int(a / b)          # нөлге қарай қию - C ережесі\n    r_c = a - q_c * b\n    print(f'{a:3} {b:3} | Python: {q_py:3} {r_py:3} | C: {q_c:3} {r_c:3}')", "stdin": "",
                   "task": "Python-да C бөлуін модельдедік: int(a / b) нөлге қарай қияды. Қай жағдайларда нәтижелер ерекшеленеді? (Үлкен сандарда a / b float дәлдігін жоғалтады - тапсырмада бүтін сандармен жасаймыз.)"},
    "exercises": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint main(void)\n{\n    int sum = 17, n = 4;\n    printf("%d\\n", sum / n);\n    printf("%.2f\\n", (double)sum / n);\n    printf("%.2f\\n", (double)(sum / n));\n    printf("%d\\n", -sum % n);\n    return 0;\n}', "answer": "4\n4.25\n4.00\n-1",
         "hints": ["Жақшадағы бүтін бөлу бірінші.", "−17 % 4: таңба бөлінгіштікі."]},
        {"type": "pycode", "q": "c_div(a, b) және c_mod(a, b) - C ережесімен (нөлге қарай қию) бүтін бөлу мен қалдықты float-сыз қайтарсын. Тест үлкен сандарды да тексереді.", "mode": "io",
         "suffix": "for a, b in [(7, 2), (-7, 2), (7, -2), (-7, -2), (6, 3), (-6, 4)]:\n    print(c_div(a, b), c_mod(a, b), c_div(a, b) * b + c_mod(a, b) == a)\nprint(c_div(-10**17 - 1, 10))",
         "starter": "def c_div(a, b):\n    return a // b\n\ndef c_mod(a, b):\n    return a % b\n",
         "tests": [{"stdin": "", "stdout": "3 1 True\n-3 -1 True\n-3 1 True\n3 -1 True\n2 0 True\n-1 -2 True\n-10000000000000000"}],
         "solution": "def c_div(a, b):\n    q = abs(a) // abs(b)\n    return q if (a >= 0) == (b >= 0) else -q\n\ndef c_mod(a, b):\n    return a - c_div(a, b) * b",
         "hints": ["Модульдерді бөліп, таңбаны бөлек қойыңыз.", "int(a / b) үлкен сандарда float дәлдігін жоғалтады.", "c_mod = a − c_div(a, b) · b (анықтама)."]},
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint main(void)\n{\n    int a = 3, b = 4;\n    int c = a++ + b;\n    int d = a * 2 > b ? a : b;\n    printf("%d %d %d\\n", a, c, d);\n    printf("%d\\n", 1 + 2 * 3 % 4);\n    return 0;\n}', "answer": "4 7 4\n3",
         "hints": ["a++ алдымен 3-ті береді, сосын a = 4.", "* мен % бір деңгейде, солдан оңға: (2 · 3) % 4 = 2."]},
        {"type": "mc", "q": "double avg = sum / n; (sum, n - int) жолындағы қате:", "options": ["Қате жоқ", "Бөлу бүтін сандарда орындалып, бөлшек жоғалады", "double-ға меншіктеу мүмкін емес", "Компиляция қатесі"], "answer": 1,
         "why": ["17 / 4 = 4, сосын 4.0.", "Дұрыс: (double)sum / n керек.", "Мүмкін - түрлендіріледі.", "Компилятор қабылдайды (ескертусіз)."], "hints": ["Өрнектің типі операндтардан анықталады."]},
    ],
    "reasoning": "<p>C өрнектерінің мағынасы типтерге байланысты - бұл Python-дан негізгі айырмашылық. «Бұл өрнектің типі қандай?» деген сұрақ әр бөлу мен әр меншіктеуде қойылуы керек. Ал теріс сандардағы бөлу айырмашылығы - бір тілден екіншісіне аударғанда тест жазудың (m08) неге маңызды екенін көрсетеді.</p>",
    "mistakes": [
        {"mistake": "x = x++ сияқты өрнектер.", "why": "Бір айнымалыны бір өрнекте екі рет өзгерту - анықталмаған әрекет (9-сабақ).", "fix": "Бөлек жолдарға бөліңіз."},
        {"mistake": "Теріс санның жұптығын x % 2 == 1 арқылы тексеру.", "why": "C-да −3 % 2 = −1, сондықтан теріс тақ сан «жұп емес, тақ та емес».", "fix": "x % 2 != 0."},
    ],
    "assessment": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint main(void)\n{\n    int minutes = 135;\n    printf("%d сағ %d мин\\n", minutes / 60, minutes % 60);\n    double ratio = minutes / 60;\n    printf("%.1f\\n", ratio);\n    printf("%.1f\\n", minutes / 60.0);\n    printf("%d\\n", -minutes / 60);\n    return 0;\n}', "answer": "2 сағ 15 мин\n2.0\n2.2\n-2",
         "hints": ["135 / 60 бүтін - 2, сосын double.", "−2.25 нөлге қарай - −2.", "2.25 → %.1f: 2.2 (екілік жуықтау)."]},
        {"type": "mc", "q": "C-да −9 % 4 тең:", "options": ["3", "−1", "1", "−3"], "answer": 1,
         "why": ["Бұл Python-ның нәтижесі.", "Дұрыс: −9 / 4 = −2, −9 − (−2)·4 = −1.", "Таңба бөлінгіштікі.", "|r| < |b| және −9 = −2·4 − 1."], "hints": ["Теорема: таңба бөлінгіштікі."]},
    ],
    "reflection": ["Python-ның // және % ережесі мен C ережесінің қайсысы математикаға (m03 модуль арифметикасына) жақын? Неге?"],
    "further": {"honors": ["(a % b + b) % b формуласы C-да әрқашан 0..b−1 нәтижесін береді (b > 0). Дәлелдеңіз."],
                "research": ["Неге C89 теріс бөлуді іске асыруға қалдырды, ал C99 нөлге қарай қиюды міндеттеді? (Fortran және процессор командалары.)"]},
    "references": REFS,
}

L04 = {
    **META, "id": "ao17-foundation.m10.l04", "slug": "l04", "title": "Басқару құрылымдары", "difficulty": 3, "minutes": 50,
    "objectives": [
        "if/else, while, do-while, for және switch құрылымдарын жазу және оқу.",
        "C-дағы ақиқат ұғымын (0 - жалған, қалғаны - ақиқат) және = мен == айырмасын түсіндіру.",
        "Цикл итерацияларын санау (m04 l08) және break/continue әсерін болжау.",
    ],
    "prerequisites": ["ao17-foundation.m10.l03"],
    "concept": "<p>C-ның басқару құрылымдары Python-ға ұқсас, бірақ синтаксисі басқа: шарт жақшада, блок <code>{ }</code> ішінде (шегініс - тек оқырманға). <code>for (int i = 0; i &lt; n; i++)</code> - бастау; шарт; қадам.</p>"
               "<p>C-да bool типі болмаған (C99-да stdbool.h): шарт - сан, 0 жалған, қалғаны ақиқат. Сондықтан <code>if (x = 5)</code> қате емес, ол x-ке 5 меншіктеп, әрқашан ақиқат! -Wall бұл туралы ескертеді.</p>",
    "theory": [
        {"kind": "definition", "title": "for және while", "body": "<p>for (A; B; C) S; ≡ A; while (B) { S; C; } (continue-сіз). do S while (B); - S кемінде бір рет орындалады.</p>"},
        {"kind": "theorem", "title": "for циклының итерация саны", "body": "<p>for (int i = a; i &lt; b; i += s) (s > 0, a ≤ b, асып кетусіз) денесі ⌈(b − a)/s⌉ рет орындалады.</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>k-шы итерацияда (k = 0, 1, ...) i = a + k·s. Дене орындалады ⇔ a + k·s < b ⇔ k < (b − a)/s. Мұндай теріс емес бүтін k-лар: 0, 1, ..., ⌈(b − a)/s⌉ − 1, яғни ⌈(b − a)/s⌉ дана. i бір сарынды өсетіндіктен, шарт бір рет жалған болған соң цикл тоқтайды. ∎ Мысалы, a = 0, b = 10, s = 3: i = 0, 3, 6, 9 - ⌈10/3⌉ = 4.</p>"},
        {"kind": "note", "title": "switch және break", "body": "<p>switch-те case-тен кейін break болмаса, орындау келесі case-ке «құлап өтеді» (fall-through). Бұл кейде әдейі, бірақ көбіне қате. gcc -Wextra -Wimplicit-fallthrough ескертеді.</p>"},
    ],
    "visual": {"lab": "cshow", "code": '#include <stdio.h>\n\nint main(void)\n{\n    for (int i = 0; i < 10; i += 3)\n        printf("%d ", i);\n    printf("\\n");\n    int n = 0;\n    while (n * n < 50)\n        n++;\n    printf("n = %d\\n", n);\n    int k = 100;\n    do {\n        printf("do: %d\\n", k);\n    } while (k < 10);\n    return 0;\n}', "output": "0 3 6 9 \nn = 8\ndo: 100",
               "caption": "for: ⌈10/3⌉ = 4 итерация (теорема). do-while шарт жалған болса да бір рет орындалды."},
    "derivation": [
        "Есеп: 1-ден n-ге дейінгі 3-ке не 5-ке бөлінетін сандардың қосындысы.",
        "for (int i = 1; i <= n; i++) - n итерация.",
        "if (i % 3 == 0 || i % 5 == 0) sum += i; - || қысқа тұйықталады (m01 l03).",
        "sum типі: n = 100 000 үшін қосынды ≈ 2.3·10⁹ > INT_MAX - long long керек.",
    ],
    "examples": [
        {"title": "switch, break, continue", "lang": "c",
         "code": '#include <stdio.h>\n\nint main(void)\n{\n    for (int day = 1; day <= 7; day++) {\n        if (day == 4)\n            continue;\n        switch (day) {\n        case 6:\n        case 7:\n            printf("%d: демалыс\\n", day);\n            break;\n        default:\n            printf("%d: сабақ\\n", day);\n        }\n        if (day == 6)\n            break;\n    }\n    long long sum = 0;\n    for (int i = 1; i <= 100000; i++)\n        if (i % 3 == 0 || i % 5 == 0)\n            sum += i;\n    printf("%lld\\n", sum);\n    return 0;\n}',
         "output": "1: сабақ\n2: сабақ\n3: сабақ\n5: сабақ\n6: демалыс\n2333416668",
         "explain": "continue 4-ті өткізді; case 6 және 7 бір блокты бөліседі (әдейі құлап өту, бос case); break 6-да циклды тоқтатты. Қосынды INT_MAX-тан үлкен - long long дұрыс таңдау."},
    ],
    "experiment": {"lab": "cshow", "code": '#include <stdio.h>\n\nint main(void)\n{\n    int grade = 2;\n    switch (grade) {\n    case 1:\n        printf("бір\\n");\n        /* fall through */\n    case 2:\n        printf("екі\\n");\n        /* fall through */\n    case 3:\n        printf("үш\\n");\n        break;\n    case 4:\n        printf("төрт\\n");\n    }\n    return 0;\n}', "output": "екі\nүш",
                   "task": "break жоқ case 2 case 3-ке «құлап өтті». /* fall through */ түсіндірмесі gcc-ге бұл әдейі екенін айтады (әйтпесе -Wextra ескертеді)."},
    "exercises": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint main(void)\n{\n    int count = 0;\n    for (int i = 2; i < 20; i += 4)\n        count++;\n    printf("%d\\n", count);\n    int x = 1;\n    while (x < 100)\n        x *= 3;\n    printf("%d\\n", x);\n    return 0;\n}', "answer": "5\n243",
         "hints": ["⌈(20 − 2)/4⌉.", "1, 3, 9, 27, 81, 243."]},
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint main(void)\n{\n    for (int i = 1; i <= 10; i++) {\n        if (i % 2 == 0)\n            continue;\n        if (i > 7)\n            break;\n        printf("%d ", i);\n    }\n    printf("\\n");\n    return 0;\n}', "answer": "1 3 5 7",
         "hints": ["Жұптар өткізіледі.", "9 > 7 - тоқтау. Соңғы бос орын еленбейді."]},
        {"type": "number", "q": "for (int i = 5; i < 100; i += 7) циклының денесі неше рет орындалады?", "answer": 14, "check": "len(range(5, 100, 7))", "hints": ["⌈95/7⌉."]},
        {"type": "mc", "q": "if (x = 0) printf(\"нөл\"); не істейді?", "options": ["x нөл болса шығарады", "x-ке 0 меншіктейді және ештеңе шығармайды", "Компиляция қатесі", "x нөл болмаса шығарады"], "answer": 1,
         "why": ["Бұл == болар еді.", "Дұрыс: = меншіктеу, өрнек мәні 0 - жалған.", "Синтаксис дұрыс (-Wall ескертеді).", "Мәні әрқашан 0."], "hints": ["= мен == айырмасы."]},
    ],
    "reasoning": "<p>Басқару құрылымдары - m04-тегі псевдокодтың нақты синтаксисі. Логика өзгермеді: инвариант, аяқталу, итерация саны. Тілдің ерекшеліктері (0 - жалған, fall-through, = мен ==) - жаңа қате көздері, және оларды компилятордың ескертулері ұстайды.</p>",
    "mistakes": [
        {"mistake": "if (x = 5) деп жазу.", "why": "Меншіктеу - әрқашан ақиқат.", "fix": "if (x == 5); -Wall ескертуін оқу."},
        {"mistake": "for (...); { ... } - жақшадан кейін нүктелі үтір.", "why": "Цикл денесі - бос нұсқау; блок бір рет орындалады.", "fix": "; қоймаңыз; -Wextra -Wempty-body."},
    ],
    "assessment": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint main(void)\n{\n    int n = 27, steps = 0;\n    while (n != 1) {\n        n = n % 2 == 0 ? n / 2 : 3 * n + 1;\n        steps++;\n    }\n    printf("%d\\n", steps);\n    int total = 0;\n    for (int i = 0; i < 4; i++)\n        for (int j = i; j < 4; j++)\n            total++;\n    printf("%d\\n", total);\n    return 0;\n}', "answer": "111\n10",
         "hints": ["Коллатц тізбегі (m04 l06): 27 - белгілі ұзын тізбек.", "4 + 3 + 2 + 1."]},
        {"type": "mc", "q": "do { ... } while (0); денесі неше рет орындалады?", "options": ["0", "1", "Шексіз", "Компиляция қатесі"], "answer": 1,
         "why": ["do-while кемінде бір рет.", "Дұрыс.", "Шарт жалған.", "Дұрыс синтаксис."], "hints": ["Шарт соңында тексеріледі."]},
    ],
    "reflection": ["Python-да шегініс құрылымды анықтайды, C-да - жақшалар. Қайсысы қатеге жақын? Неге?"],
    "further": {"honors": ["Duff's device - switch пен do-while-ның әйгілі араласуы. Ол заңды C ма? Не үшін ойлап табылған?"],
                "research": ["goto операторы: Дейкстраның «Go To Statement Considered Harmful» (1968) мақаласы. C-да goto қай жағдайда әлі қолданылады (Linux ядросындағы қателерді өңдеу)?"]},
    "references": REFS,
}

L05 = {
    **META, "id": "ao17-foundation.m10.l05", "slug": "l05", "title": "Функциялар және прототиптер", "difficulty": 3, "minutes": 50,
    "objectives": [
        "Функцияның жариялауы (прототип) мен анықтамасын ажырату.",
        "Мәнмен беру (call by value) ережесін дәлелдеу: функция шақырушының айнымалысын өзгерте алмайды.",
        "static жергілікті айнымалыны және рекурсияны C-да қолдану.",
    ],
    "prerequisites": ["ao17-foundation.m10.l04", "ao17-foundation.m07.l02"],
    "concept": "<p>C функциясының <b>типі</b> бар: <code>int max(int a, int b)</code> - екі int қабылдап, int қайтарады; мән қайтармайтын функция - <code>void</code>. Компилятор кодты жоғарыдан төменге оқиды, сондықтан функцияны шақырмас бұрын оны білуі керек: не анықтаманы жоғары қою керек, не <b>прототип</b> (жариялау) жазу керек: <code>int max(int a, int b);</code>.</p>"
               "<p>C-да аргументтер әрқашан <b>мәнімен</b> беріледі: функция көшірмені алады. Python-да тізімді функция өзгерте алатын (m07 l04), ал C-да int айнымалыны функция өзгерте алмайды - ол үшін көрсеткіш керек (m11).</p>",
    "theory": [
        {"kind": "definition", "title": "Жариялау және анықтама", "body": "<p>Жариялау (прототип) - аты, қайтару типі, параметр типтері; денесі жоқ. Анықтама - денесімен бірге; бағдарламада бір рет. Жариялау көп рет болуы мүмкін (тақырып файлдары .h).</p>"},
        {"kind": "theorem", "title": "Мәнмен беру", "body": "<p>f(int x) функциясы x-ке не меншіктесе де, f(v) шақыруынан кейін шақырушының v айнымалысы өзгермейді.</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>C11 6.5.2.2: шақыру кезінде әр аргумент есептеліп, оның мәні сәйкес параметрге меншіктеледі; параметр - функцияның жергілікті айнымалысы, өз жады ұяшығы бар (шақыру жақтауында, m09 l06). f ішіндегі x = ... тек сол ұяшықты өзгертеді. v - басқа ұяшық; оған f-тің ешбір нұсқауы сілтемейді (v-ның мекенжайы берілмеген). Демек v өзгермейді. ∎ Мекенжай берілсе (f(&v)) - басқа әңгіме (m11 l02).</p>"},
        {"kind": "note", "title": "static жергілікті айнымалы", "body": "<p>static int calls = 0; функция ішінде бір рет инициализацияланады және шақырулар арасында мәнін сақтайды (бағдарлама бойы өмір сүреді, бірақ тек функция ішінде көрінеді).</p>"},
    ],
    "visual": {"lab": "cshow", "code": '#include <stdio.h>\n\nvoid try_change(int x);\n\nint main(void)\n{\n    int v = 10;\n    try_change(v);\n    printf("main: v = %d\\n", v);\n    return 0;\n}\n\nvoid try_change(int x)\n{\n    x = 99;\n    printf("функция: x = %d\\n", x);\n}', "output": "функция: x = 99\nmain: v = 10",
               "caption": "Прототип (3-жол) main-ге try_change туралы алдын ала айтады. Функция көшірмені өзгертті - v сол күйі (теорема)."},
    "derivation": [
        "Есеп: екі санның ЕҮОБ-ын (m03, Евклид алгоритмі) функция етіп шығару.",
        "Прототип: int gcd(int a, int b);",
        "Анықтама: while (b != 0) { int t = a % b; a = b; b = t; } return a;",
        "a мен b - көшірмелер: функция оларды еркін өзгертеді, шақырушының айнымалылары қауіпсіз.",
    ],
    "examples": [
        {"title": "Прототиптер, рекурсия, static", "lang": "c",
         "code": '#include <stdio.h>\n\nint gcd(int a, int b);\nlong long fact(int n);\nint next_id(void);\n\nint main(void)\n{\n    printf("%d %d\\n", gcd(84, 36), gcd(17, 5));\n    printf("%lld\\n", fact(20));\n    for (int i = 0; i < 3; i++)\n        printf("id %d\\n", next_id());\n    return 0;\n}\n\nint gcd(int a, int b)\n{\n    while (b != 0) {\n        int t = a % b;\n        a = b;\n        b = t;\n    }\n    return a;\n}\n\nlong long fact(int n)\n{\n    return n <= 1 ? 1 : n * fact(n - 1);\n}\n\nint next_id(void)\n{\n    static int counter = 100;\n    return counter++;\n}',
         "output": "12 1\n2432902008176640000\nid 100\nid 101\nid 102",
         "explain": "20! long long-қа сыяды (≈ 2.4·10¹⁸ < 9.2·10¹⁸), ал int-ке сыймас еді. static counter шақырулар арасында сақталды."},
    ],
    "experiment": {"lab": "cshow", "code": '#include <stdio.h>\n\nvoid swap(int a, int b)\n{\n    int t = a;\n    a = b;\n    b = t;\n}\n\nint main(void)\n{\n    int x = 1, y = 2;\n    swap(x, y);\n    printf("%d %d\\n", x, y);\n    return 0;\n}', "output": "1 2",
                   "task": "swap жұмыс істемеді - неге? (Теорема.) m11 l02-де көрсеткіштермен дұрыс swap жазамыз: void swap(int *a, int *b)."},
    "exercises": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint twice(int n)\n{\n    n = n * 2;\n    return n;\n}\n\nint main(void)\n{\n    int a = 5;\n    int b = twice(a);\n    printf("%d %d\\n", a, b);\n    printf("%d\\n", twice(twice(a)));\n    return 0;\n}', "answer": "5 10\n20",
         "hints": ["Мәнмен беру: a өзгермейді.", "twice(10)."]},
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint visit(void)\n{\n    static int n = 0;\n    int local = 0;\n    n++;\n    local++;\n    return n * 10 + local;\n}\n\nint main(void)\n{\n    visit();\n    visit();\n    printf("%d\\n", visit());\n    return 0;\n}', "answer": "31",
         "hints": ["static n шақырулар арасында сақталады.", "local әр шақыруда жаңадан 0."]},
        {"type": "mc", "q": "Функция прототипі не үшін керек?", "options": ["Функцияны жылдамдату үшін", "Компиляторға функцияны анықтамасынан бұрын шақыруға мүмкіндік беру (типтерді тексеру)", "Функцияның денесін жасыру үшін", "Рекурсияға тыйым салу"], "answer": 1,
         "why": ["Жылдамдыққа әсері жоқ.", "Дұрыс.", "Дене басқа жерде, бірақ жасыру мақсат емес.", "Керісінше, өзара рекурсияға көмектеседі."], "hints": ["Компилятор жоғарыдан төменге оқиды."]},
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint f(int n)\n{\n    if (n == 0)\n        return 0;\n    return n % 10 + f(n / 10);\n}\n\nint main(void)\n{\n    printf("%d %d\\n", f(2026), f(9));\n    return 0;\n}', "answer": "10 9",
         "hints": ["Цифрлар қосындысы (m09 l06)."]},
    ],
    "reasoning": "<p>Типтелген прототиптер - келісімшарттың (m07 l03) компилятор тексеретін бөлігі: f(\"мәтін\") шақыруы int f(int) үшін компиляцияда ұсталады. Мәнмен беру - таза функция (m07 l04) идеясының тілдік кепілдігі: функция шақырушының айнымалыларын жасырын өзгерте алмайды.</p>",
    "mistakes": [
        {"mistake": "Прототипсіз, анықтамадан бұрын шақыру.", "why": "C11-де бұл қате (айқын емес жариялау жоқ); ескі компиляторлар int f() деп болжаған.", "fix": "Прототип не анықтаманы жоғары қою."},
        {"mistake": "int функциясының бір тармағында return-ді ұмыту.", "why": "Қайтарылған мәнді пайдалану - анықталмаған әрекет.", "fix": "-Wall (-Wreturn-type) ескертуі; әр жолда return."},
    ],
    "assessment": [
        {"type": "coutput", "q": "Бағдарлама не шығарады?", "code": '#include <stdio.h>\n\nint calls = 0;\n\nint fib(int n)\n{\n    calls++;\n    return n < 2 ? n : fib(n - 1) + fib(n - 2);\n}\n\nint main(void)\n{\n    printf("%d\\n", fib(10));\n    printf("%d\\n", calls);\n    return 0;\n}', "answer": "55\n177",
         "hints": ["F(10) = 55.", "Шақырулар саны 2F(n+1) − 1 (m07 l07): 2 · 89 − 1."]},
        {"type": "mc", "q": "void inc(int x) { x++; } және int a = 1; inc(a); - a неге тең?", "options": ["2", "1", "0", "Анықталмаған"], "answer": 1,
         "why": ["Көшірме өзгерді.", "Дұрыс: мәнмен беру.", "Ешнәрсе нөлдемейді.", "Анықталған."], "hints": ["Теорема."]},
    ],
    "reflection": ["Python-да функцияның «тізімді өзгертуі» қай кезде пайдалы, қай кезде қауіпті болды? C-ның мәнмен беру ережесі не береді?"],
    "further": {"honors": ["Тақырып файлын (.h) және бірнеше .c файлды жобаны құрыңыз: mathutil.h (прототиптер), mathutil.c (анықтамалар), main.c. gcc main.c mathutil.c -o app."],
                "research": ["inline функциялар және компилятордың «функцияны орнына қою» оңтайландыруы: шақырудың құны қанша?"]},
    "references": REFS,
}

LESSONS = [L01, L02, L03, L04, L05]
