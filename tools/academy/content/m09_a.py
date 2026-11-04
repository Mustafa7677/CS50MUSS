# © 2026 Sagid Mustafa. All Rights Reserved.
# AO17 CS Universe · Level I · m09 Algorithms with Python · 1-5 сабақтар. Авторлық мазмұн (AO17 үшін жаңадан жазылған).

REFS = [
    "T. H. Cormen және т.б., Introduction to Algorithms (CLRS), 2-бөлім - сұрыптау және іздеу (салыстыру үшін).",
    "J. Kleinberg, É. Tardos, Algorithm Design, 2-5 тараулар.",
    "Python Software Foundation, bisect модулінің құжаттамасы; Sorting HOW TO.",
]
META = {"courseId": "ao17-foundation", "moduleId": "m09", "language": "kk", "academicLevel": "I",
        "license": "ARR", "authorship": "original", "reviewStatus": "author-checked", "version": "1.0.0"}

# Тест драйверлеріне ортақ: салыстыруларды санайтын сан (Python-ның өз in/index/sort амалдары да санауға түседі)
K = ("class K:\n    n = 0\n    def __init__(s, v):\n        s.v = v\n    def _c(s, o):\n        K.n += 1\n        return o.v if isinstance(o, K) else o\n"
     "    def __eq__(s, o):\n        return s.v == s._c(o)\n    def __lt__(s, o):\n        return s.v < s._c(o)\n    def __le__(s, o):\n        return s.v <= s._c(o)\n"
     "    def __gt__(s, o):\n        return s.v > s._c(o)\n    def __ge__(s, o):\n        return s.v >= s._c(o)\n    def __hash__(s):\n        return hash(s.v)\n    def __repr__(s):\n        return repr(s.v)\n")

INSERTION = "def insertion_sort(a):\n    for i in range(1, len(a)):\n        x = a[i]\n        j = i - 1\n        while j >= 0 and a[j] > x:\n            a[j + 1] = a[j]\n            j -= 1\n        a[j + 1] = x"
SELECTION = "def selection_sort(a):\n    n = len(a)\n    for i in range(n - 1):\n        m = i\n        for j in range(i + 1, n):\n            if a[j] < a[m]:\n                m = j\n        a[i], a[m] = a[m], a[i]"
MERGE_INPLACE = ("def merge_sort(a, lo=0, hi=None):\n    if hi is None:\n        hi = len(a)\n    if hi - lo <= 1:\n        return\n    mid = (lo + hi) // 2\n    merge_sort(a, lo, mid)\n    merge_sort(a, mid, hi)\n"
                 "    left, right = a[lo:mid], a[mid:hi]\n    i = j = 0\n    for k in range(lo, hi):\n        if j >= len(right) or (i < len(left) and left[i] <= right[j]):\n            a[k] = left[i]\n            i += 1\n        else:\n            a[k] = right[j]\n            j += 1")
QUICK = ("def quick_sort(a, lo=0, hi=None):\n    if hi is None:\n        hi = len(a) - 1\n    if lo >= hi:\n        return\n    pivot = a[hi]\n    i = lo\n    for j in range(lo, hi):\n        if a[j] < pivot:\n            a[i], a[j] = a[j], a[i]\n            i += 1\n"
         "    a[i], a[hi] = a[hi], a[i]\n    quick_sort(a, lo, i - 1)\n    quick_sort(a, i + 1, hi)")

L01 = {
    **META, "id": "ao17-foundation.m09.l01", "slug": "l01", "title": "Сызықтық іздеу", "difficulty": 2, "minutes": 40,
    "objectives": [
        "Сызықтық іздеуді жазу: бірінші кездесу индексі, барлық индекстер, табылмаса -1.",
        "Ең нашар, ең жақсы және орташа жағдайдағы салыстыру санын есептеу.",
        "Салыстыруларды санайтын «өлшеуіш» арқылы теорияны тәжірибемен тексеру.",
    ],
    "prerequisites": ["ao17-foundation.m08.l10"],
    "concept": "<p>m04 l07-де іздеуді псевдокодпен қарадық. Енді Python-да жазып, оның құнын <b>өлшейміз</b>. Сызықтық іздеу тізімді басынан аяғына дейін қарайды: x-ті тапса - тоқтайды, таппаса - соңына дейін барады.</p>"
               "<p>Бұл модульдің тапсырмаларында тест драйвері элементтерді <code>K</code> класына орайды: әр салыстыру (==, &lt;, ...) санағышты бір арттырады. Сондықтан Python-ның <code>x in a</code> не <code>a.index(x)</code> амалдары да «тегін» емес - олар да сол салыстыруларды жасайды, тек C тілінде.</p>",
    "theory": [
        {"kind": "definition", "title": "Салыстыру моделі", "body": "<p>Алгоритмнің құны - элементтерді салыстыру саны. Бұл модель компьютерге тәуелсіз: салыстыру саны екі есе өссе, уақыт та шамамен екі есе өседі.</p>"},
        {"kind": "theorem", "title": "Төменгі шекара", "body": "<p>Ретсіз тізімде x бар-жоғын салыстыру арқылы анықтайтын кез келген алгоритм ең нашар жағдайда n салыстыру жасайды.</p>"},
        {"kind": "proof", "title": "Дәлелдеу (қарсылас әдісі)", "body": "<p>Алгоритм n − 1 немесе одан аз салыстыру жасап, «жоқ» деп жауап берді делік. Онда кем дегенде бір a[i] позициясы x-пен салыстырылмаған. Қарсылас a[i] = x деп қояды: алгоритм көрген барлық салыстыру нәтижесі өзгермейді (a[i] ешқайсысына қатыспаған), сондықтан алгоритм бәрібір «жоқ» дейді - бірақ x бар. Қайшылық. Демек кез келген дұрыс алгоритм ең нашар жағдайда n салыстыру жасайды. ∎</p>"},
        {"kind": "note", "title": "Орташа жағдай", "body": "<p>x тізімде бар және кез келген орында бірдей ықтималдықпен тұрса, салыстырулардың орташа саны (1 + 2 + ... + n) / n = (n + 1) / 2.</p>"},
    ],
    "visual": {"lab": "pyrun", "code": K + "\ndef linear_search(a, x):\n    for i in range(len(a)):\n        if a[i] == x:\n            return i\n    return -1\n\na = [K(v) for v in [8, 3, 5, 1, 9, 2]]\nfor x in [8, 9, 7]:\n    K.n = 0\n    print('x =', x, 'индекс', linear_search(a, x), 'салыстыру', K.n)\nK.n = 0\nprint(7 in a, 'in салыстырды:', K.n)", "stdin": "",
               "caption": "Ең жақсы жағдай - 1 салыстыру, табылмаса - n = 6. Python-ның in амалы да дәл 6 салыстыру жасады."},
    "derivation": [
        "Кіріс: тізім a, мән x. Шығыс: x-тің бірінші индексі, жоқ болса -1.",
        "Инвариант: i-ші қадамның басында a[0..i-1] ішінде x жоқ.",
        "a[i] == x болса - i қайтару (бірінші кездесу, өйткені алдында жоқ).",
        "Цикл біткенде инвариант бойынша a[0..n-1] ішінде x жоқ - -1 қайтару.",
    ],
    "examples": [
        {"title": "Салыстыру санын өлшеу", "lang": "python",
         "code": K + "\ndef linear_search(a, x):\n    for i, v in enumerate(a):\n        if v == x:\n            return i\n    return -1\n\nn = 1000\na = [K(v) for v in range(n)]\ntotal = 0\nfor x in range(n):\n    K.n = 0\n    linear_search(a, x)\n    total += K.n\nprint('орташа:', total / n, 'теория (n+1)/2:', (n + 1) / 2)\nK.n = 0\nlinear_search(a, -5)\nprint('табылмаса:', K.n)",
         "output": "орташа: 500.5 теория (n+1)/2: 500.5\nтабылмаса: 1000",
         "explain": "Тәжірибе мен теория дәл сәйкес келді: барлық орынды бір-бірден іздегенде орташа (n + 1) / 2, табылмаса n."},
    ],
    "experiment": {"lab": "pyrun", "code": "a = [4, 2, 7]\nprint(a.index(7))\nprint(a.index(5))", "stdin": "", "expectError": True,
                   "task": "a.index табылмаған мәнде ValueError береді. Өз linear_search функцияңыз -1 қайтарады - қайсысы қай жағдайда ыңғайлы?"},
    "exercises": [
        {"type": "pycode", "q": "linear_search(a, x) - x-тің бірінші кездесу индексін, жоқ болса -1 қайтарсын.", "mode": "func", "func": "linear_search",
         "starter": "def linear_search(a, x):\n    return a.index(x)\n",
         "tests": [{"args": [[4, 2, 7, 2], 2], "expect": 1}, {"args": [[4, 2, 7], 5], "expect": -1}, {"args": [[], 1], "expect": -1}, {"args": [[9], 9], "expect": 0}],
         "solution": "def linear_search(a, x):\n    for i in range(len(a)):\n        if a[i] == x:\n            return i\n    return -1",
         "hints": ["index табылмаса ValueError береді.", "for i in range(len(a)): ... return -1."]},
        {"type": "pycode", "q": "find_all(a, x) - x кездесетін барлық индекстер тізімін қайтарсын.", "mode": "func", "func": "find_all",
         "starter": "def find_all(a, x):\n    return [a.index(x)]\n",
         "tests": [{"args": [[1, 3, 1, 1], 1], "expect": [0, 2, 3]}, {"args": [[1, 2], 5], "expect": []}, {"args": [["а", "б", "а"], "а"], "expect": [0, 2]}],
         "solution": "def find_all(a, x):\n    return [i for i, v in enumerate(a) if v == x]",
         "hints": ["enumerate(a) - (индекс, мән) жұптары."]},
        {"type": "pycode", "q": "Тоқтайтын іздеу: find_first_negative(a) - бірінші теріс санның индексін (жоқ болса -1) қайтарсын және ТАПҚАН ЖЕРДЕ тоқтасын. Тест салыстыру санын тексереді.", "mode": "io",
         "suffix": K + "a = [K(v) for v in [5, 3, -2] + list(range(1000))]\nK.n = 0\nprint(find_first_negative(a), K.n <= 3)\nprint(find_first_negative([K(1), K(2)]))",
         "starter": "def find_first_negative(a):\n    found = -1\n    for i in range(len(a)):\n        if a[i] < 0 and found == -1:\n            found = i\n    return found\n",
         "tests": [{"stdin": "", "stdout": "2 True\n-1"}],
         "solution": "def find_first_negative(a):\n    for i in range(len(a)):\n        if a[i] < 0:\n            return i\n    return -1",
         "hints": ["Тапқан бойда return - қалған 1000 элементті қарамау.", "Бастапқы код әр элементті салыстырады."]},
        {"type": "mc", "q": "1 000 000 элементті ретсіз тізімде жоқ мәнді іздегенде сызықтық іздеу неше салыстыру жасайды?", "options": ["20", "1000", "500 000", "1 000 000"], "answer": 3,
         "why": ["Бұл екілік іздеу (сұрыпталған тізімде).", "√n - қатысы жоқ.", "Бұл бар мәнді орташа іздеу.", "Дұрыс: жоқ екенін білу үшін бәрін қарау керек (теорема)."], "hints": ["Ең нашар жағдай."]},
    ],
    "reasoning": "<p>Сызықтық іздеу «жаман» алгоритм емес: ретсіз деректе ол оңтайлы (теорема). Жылдамырақ іздеу үшін деректің өзі туралы қосымша білім керек - мысалы, оның сұрыпталғаны (келесі сабақ) не хэш-кесте (m08 l04). Алгоритмнің жылдамдығы деректің құрылымынан келеді.</p>",
    "mistakes": [
        {"mistake": "Цикл ішінде else: return -1 жазу.", "why": "Бірінші элемент сәйкес келмесе бірден -1 қайтарады.", "fix": "return -1 циклдан кейін."},
        {"mistake": "Тапқаннан кейін де циклды жалғастыру.", "why": "Ең жақсы жағдай да n салыстыруға айналады.", "fix": "Тапқан бойда return."},
    ],
    "assessment": [
        {"type": "pycode", "q": "last_index(a, x) - x-тің СОҢҒЫ кездесу индексін (жоқ болса -1) қайтарсын; тізімді соңынан бастап қарап, тапқанда тоқтасын.", "mode": "func", "func": "last_index",
         "starter": "def last_index(a, x):\n    for i in range(len(a)):\n        if a[i] == x:\n            return i\n    return -1\n",
         "tests": [{"args": [[1, 2, 1, 3], 1], "expect": 2}, {"args": [[1, 2], 5], "expect": -1}, {"args": [[7], 7], "expect": 0}],
         "solution": "def last_index(a, x):\n    for i in range(len(a) - 1, -1, -1):\n        if a[i] == x:\n            return i\n    return -1",
         "hints": ["range(len(a) - 1, -1, -1)."]},
        {"type": "mc", "q": "x тізімде бар және кез келген орында бірдей ықтималдықпен тұрса, n = 99 үшін салыстырулардың орташа саны:", "options": ["49", "50", "99", "7"], "answer": 1,
         "why": ["(n + 1) / 2 = 50.", "Дұрыс: (99 + 1) / 2.", "Бұл ең нашар жағдай.", "Бұл log₂ n."], "hints": ["(1 + ... + n) / n."]},
    ],
    "reflection": ["Күнделікті өмірде қашан «сызықтық іздейсіз» (мысалы, кілтті сөмкеден)? Оны қалай жылдамдатар едіңіз?"],
    "further": {"honors": ["«Күзетші» (sentinel) әдісі: тізім соңына x қосып, i < n тексерісін алып тастау. Салыстырулар саны қалай өзгереді?"],
                "research": ["Ақпарат іздеу жүйелері миллиардтаған құжатты сызықтық іздемейді - кері индекс (inverted index) қалай жұмыс істейді?"]},
    "references": REFS,
}

BS = "def binary_search(a, x):\n    lo, hi = 0, len(a) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if a[mid] == x:\n            return mid\n        if a[mid] < x:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1"

L02 = {
    **META, "id": "ao17-foundation.m09.l02", "slug": "l02", "title": "Екілік іздеу", "difficulty": 3, "minutes": 55,
    "objectives": [
        "Екілік іздеуді lo/hi инвариантымен дұрыс жазу және «бір кем/бір артық» қателерінен сақтану.",
        "Қадам санының ⌊log₂ n⌋ + 1-ден аспайтынын дәлелдеу.",
        "Екілік іздеуді жауап кеңістігінде қолдану (бүтін түбір, бірінші сәйкес позиция).",
    ],
    "prerequisites": ["ao17-foundation.m09.l01"],
    "concept": "<p>Тізім <b>сұрыпталған</b> болса, ортасындағы элемент көп нәрсе айтады: a[mid] &lt; x болса, x тек оң жақта болуы мүмкін - сол жақ жартыны бір салыстырумен лақтырамыз. Әр қадам іздеу аймағын екі есе қысқартады.</p>"
               "<p>Екілік іздеу қарапайым көрінеді, бірақ оны қатесіз жазу қиын: шекаралар (≤ мен &lt;, mid ± 1) дұрыс болмаса, цикл шексіз айналады не элемент өткізіліп кетеді. Құтқарушы - <b>инвариант</b> (m04 l05): «x бар болса, ол a[lo..hi] ішінде».</p>",
    "theory": [
        {"kind": "definition", "title": "Инвариант", "body": "<p>I: x тізімде бар болса, оның индексі lo ≤ i ≤ hi аралығында. Бастапқыда lo = 0, hi = n − 1 - I ақиқат.</p>"},
        {"kind": "theorem", "title": "Дұрыстық және қадам саны", "body": "<p>binary_search дұрыс нәтиже береді және цикл ең көбі ⌊log₂ n⌋ + 1 рет орындалады.</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p><b>Сақталу:</b> a[mid] &lt; x болса, сұрыпталғандықтан барлық i ≤ mid үшін a[i] ≤ a[mid] &lt; x, демек x (бар болса) mid-тен оңда: lo = mid + 1 I-ді сақтайды. a[mid] &gt; x жағдайы симметриялы. <b>Аяқталу:</b> аралық ұзындығы L = hi − lo + 1 әр қадамда кемінде ⌊L/2⌋-ге дейін қысқарады (mid алынып тасталады, қалған екі бөліктің үлкені ≤ ⌊L/2⌋). L = n-нен бастап k қадамнан кейін L ≤ ⌊n/2ᵏ⌋; k = ⌊log₂ n⌋ + 1 болғанда L = 0, цикл тоқтайды. <b>Нәтиже:</b> L = 0 болғанда I бойынша x жоқ - -1 дұрыс. ∎</p>"},
        {"kind": "note", "title": "bisect", "body": "<p>Python-ның bisect.bisect_left(a, x) x-ті кірістіруге болатын бірінші позицияны қайтарады - төменгі шекара (lower bound). Ол да екілік іздеу.</p>"},
    ],
    "visual": {"lab": "pyrun", "code": "def binary_search(a, x):\n    lo, hi = 0, len(a) - 1\n    step = 0\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        step += 1\n        print(f'{step}-қадам: lo={lo} hi={hi} mid={mid} a[mid]={a[mid]}')\n        if a[mid] == x:\n            return mid\n        if a[mid] < x:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1\n\na = list(range(0, 200, 3))\nprint('нәтиже:', binary_search(a, 117), 'ұзындық:', len(a))", "stdin": "",
               "caption": "67 элементтен 117-ні табу үшін бірнеше қадам жетеді: әр қадамда lo..hi аралығы екі есе қысқарады."},
    "derivation": [
        "lo = 0, hi = n - 1 (жабық аралық [lo, hi]).",
        "Цикл шарты lo <= hi: аралық бос емес.",
        "mid = (lo + hi) // 2; a[mid] == x - табылды.",
        "a[mid] < x - lo = mid + 1 (mid енді керек емес); әйтпесе hi = mid - 1. mid ± 1 болмаса, lo = hi жағдайында цикл шексіз айналуы мүмкін.",
    ],
    "examples": [
        {"title": "Сызықтық және екілік іздеу салыстырулары", "lang": "python",
         "code": K + "\n" + BS + "\n\nimport math\nfor n in [10, 1000, 100000]:\n    a = [K(v) for v in range(n)]\n    worst = 0\n    for x in [0, n // 3, n - 1, n]:\n        K.n = 0\n        binary_search(a, x)\n        worst = max(worst, K.n)\n    print(n, 'салыстыру ≤', worst, ' log2 n ≈', round(math.log2(n), 1))",
         "output": "10 салыстыру ≤ 8  log2 n ≈ 3.3\n1000 салыстыру ≤ 20  log2 n ≈ 10.0\n100000 салыстыру ≤ 34  log2 n ≈ 16.6",
         "explain": "Әр итерацияда екі салыстыру (== және <) бар, сондықтан ≈ 2·log₂ n. n 100 есе өскенде салыстыру саны 100 есе емес, бірнеше бірлікке ғана өсті."},
    ],
    "experiment": {"lab": "pyrun", "code": "def bad_search(a, x):\n    lo, hi = 0, len(a) - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if a[mid] < x:\n            lo = mid\n        else:\n            hi = mid\n    return lo if a[lo] == x else -1\n\nprint(bad_search([1, 3, 5, 7], 3))\nprint(bad_search([1, 3, 5, 7], 7))", "stdin": "", "expectError": True,
                   "task": "Бірінші шақыру жұмыс істеді, екіншісі шексіз циклға түсіп, қадам шегіне жетті. lo = 2, hi = 3 болғанда не болады? lo = mid + 1 деп түзетіңіз."},
    "exercises": [
        {"type": "pycode", "q": "binary_search(a, x) - сұрыпталған тізімде x-тің индексін (жоқ болса -1) қайтарсын. Тест 10 000 элементте салыстыру санын тексереді (≤ 30).", "mode": "io",
         "suffix": K + "a = [K(v) for v in range(0, 20000, 2)]\nok = True\nfor x in [0, 7776, 19998, 5, -1, 30000]:\n    K.n = 0\n    r = binary_search(a, x)\n    ok = ok and K.n <= 30 and r == (x // 2 if x % 2 == 0 and 0 <= x < 20000 else -1)\nprint(ok)\nprint(binary_search([], 3), binary_search([K(4)], 4))",
         "starter": "def binary_search(a, x):\n    if x in a:\n        return a.index(x)\n    return -1\n",
         "tests": [{"stdin": "", "stdout": "True\n-1 0"}],
         "solution": BS,
         "hints": ["in мен index - сызықтық: 10 000 салыстыруға дейін.", "lo, hi = 0, len(a) - 1; while lo <= hi."]},
        {"type": "pycode", "q": "lower_bound(a, x) - сұрыпталған тізімде a[i] ≥ x болатын ЕҢ КІШІ i-ді қайтарсын (ондай жоқ болса len(a)). Екілік іздеумен.", "mode": "io",
         "suffix": K + "a = [K(v) for v in [1, 3, 3, 3, 8]]\nprint([lower_bound(a, x) for x in [0, 1, 3, 4, 8, 9]])\nb = [K(v) for v in range(10000)]\nK.n = 0\nprint(lower_bound(b, 5432), K.n <= 30)\nprint(lower_bound([], 5))",
         "starter": "def lower_bound(a, x):\n    for i in range(len(a)):\n        if a[i] >= x:\n            return i\n    return len(a)\n",
         "tests": [{"stdin": "", "stdout": "[0, 0, 1, 4, 4, 5]\n5432 True\n0"}],
         "solution": "def lower_bound(a, x):\n    lo, hi = 0, len(a)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if a[mid] < x:\n            lo = mid + 1\n        else:\n            hi = mid\n    return lo",
         "hints": ["Жарты ашық аралық [lo, hi): hi = len(a).", "a[mid] < x болса lo = mid + 1, әйтпесе hi = mid (mid жауап болуы мүмкін)."]},
        {"type": "mc", "q": "Екілік іздеудің алғышарты:", "options": ["Тізімде қайталанбайтын мәндер", "Тізім сұрыпталған", "Тізім ұзындығы 2-нің дәрежесі", "Мәндер бүтін сан"], "answer": 1,
         "why": ["Қайталанулар болса да жұмыс істейді.", "Дұрыс: әйтпесе жартыны лақтыру негізсіз.", "Кез келген ұзындық.", "Салыстыруға болатын кез келген мән."], "hints": ["Инварианттың сақталу дәлелі неге сүйенді?"]},
        {"type": "order", "q": "Екілік іздеудің бір итерациясын ретке қойыңыз.", "steps": ["lo <= hi екенін тексеру.", "mid = (lo + hi) // 2 есептеу.", "a[mid]-ті x-пен салыстыру.", "Аралықтың тиісті жартысын қалдыру (lo = mid + 1 не hi = mid - 1)."],
         "hints": ["Алдымен аралық бос емес пе?"]},
    ],
    "reasoning": "<p>Екілік іздеудің мәні тек тізімде емес: «жауап кеңістігінде» де қолданылады. Монотонды шарт (бір жерден бастап әрқашан ақиқат) бар кез келген есепте шекараны log₂ қадаммен табуға болады: бүтін түбір, ең аз сыйымдылық, бірінші қате нұсқа (git bisect).</p>",
    "mistakes": [
        {"mistake": "lo = mid (не hi = mid) жабық аралықта.", "why": "lo = hi − 1 болғанда mid = lo, аралық қысқармайды - шексіз цикл.", "fix": "Жабық аралықта mid ± 1; жарты ашық аралықта hi = mid, бірақ шарт lo < hi."},
        {"mistake": "Сұрыпталмаған тізімде екілік іздеу.", "why": "Инвариант бұзылады - бар элемент «жоқ» болып шығады.", "fix": "Алдымен сұрыптау (бір рет) не сызықтық іздеу."},
    ],
    "assessment": [
        {"type": "pycode", "q": "isqrt(n) - n ≥ 0 үшін ⌊√n⌋-ді math модулінсіз, жауап кеңістігінде екілік іздеумен қайтарсын (n 10¹² дейін).", "mode": "func", "func": "isqrt",
         "starter": "def isqrt(n):\n    r = 0\n    while (r + 1) * (r + 1) <= n:\n        r += 1\n    return r\n",
         "tests": [{"args": [0], "expect": 0}, {"args": [15], "expect": 3}, {"args": [16], "expect": 4}, {"args": [999999999999], "expect": 999999}, {"args": [1000000000000], "expect": 1000000}],
         "solution": "def isqrt(n):\n    lo, hi = 0, n\n    while lo < hi:\n        mid = (lo + hi + 1) // 2\n        if mid * mid <= n:\n            lo = mid\n        else:\n            hi = mid - 1\n    return lo",
         "hints": ["Шарт mid * mid <= n монотонды: бір жерге дейін ақиқат, сосын жалған.", "Ең үлкен ақиқат mid: mid = (lo + hi + 1) // 2, lo = mid не hi = mid - 1.", "Бастапқы код 10⁶ қадам жасайды - қадам шегі."]},
        {"type": "mc", "q": "Сұрыпталған 1 000 000 элементті тізімде екілік іздеу итерацияларының ең көп саны:", "options": ["10", "20", "1000", "500 000"], "answer": 1,
         "why": ["2¹⁰ = 1024 < 10⁶.", "Дұрыс: ⌊log₂ 10⁶⌋ + 1 = 19 + 1 = 20.", "Бұл √n.", "Бұл сызықтық іздеудің орташасы."], "hints": ["2²⁰ ≈ 10⁶."]},
    ],
    "reflection": ["«Бір кем» қатесін өз кодыңызда қашан кездестірдіңіз? Инвариантты алдын ала жазу оған қалай көмектеседі?"],
    "further": {"honors": ["mid = (lo + hi) // 2 Python-да қауіпсіз, ал C/Java-да lo + hi асып кетуі мүмкін (m05 l04). mid = lo + (hi - lo) // 2 неге дұрыс?"],
                "research": ["git bisect қалай жұмыс істейді? 1000 коммиттің ішінен қатені енгізгенін неше қадаммен табуға болады?"]},
    "references": REFS,
}

L03 = {
    **META, "id": "ao17-foundation.m09.l03", "slug": "l03", "title": "Таңдау және кірістіру сұрыптауы", "difficulty": 3, "minutes": 55,
    "objectives": [
        "Таңдау (selection) және кірістіру (insertion) сұрыптауларын тізімді орнында өзгертіп іске асыру.",
        "Олардың салыстыру санын талдау: таңдау - әрқашан n(n−1)/2; кірістіру - n−1-ден n(n−1)/2-ге дейін.",
        "Algorithm Arena-да алгоритмдердің нақты жұмысын қадамдап бақылау.",
    ],
    "prerequisites": ["ao17-foundation.m09.l02"],
    "concept": "<p><b>Таңдау сұрыптауы</b>: қалған бөліктің ең кішісін тауып, оны келесі орынға қоямыз. <b>Кірістіру сұрыптауы</b>: карталарды қолға алғандай - әр жаңа элементті сол жақтағы сұрыпталған бөлікке өз орнына «кірістіреміз».</p>"
               "<p>Екеуі де O(n²), бірақ мінездері әртүрлі. Algorithm Arena зертханасы Python-да алгоритмді нақты орындап, әр салыстыру мен әр жазуды тіркейді: бағандар - тізімнің сол сәттегі шын күйі, анимация емес.</p>",
    "theory": [
        {"kind": "definition", "title": "Орнында және тұрақты", "body": "<p>Орнында (in-place) - қосымша жадсыз, тізімнің өзін өзгертеді. Тұрақты (stable) - тең элементтердің бастапқы реті сақталады. Кірістіру сұрыптауы - орнында және тұрақты; таңдау сұрыптауы - орнында, бірақ тұрақты емес.</p>"},
        {"kind": "theorem", "title": "Кірістіру сұрыптауының дұрыстығы", "body": "<p>Сыртқы циклдың i-ші қадамының басында a[0..i−1] - бастапқы a[0..i−1] элементтерінің сұрыпталған нұсқасы. Демек соңында бүкіл тізім сұрыпталған.</p>"},
        {"kind": "proof", "title": "Дәлелдеу (индукция, m02 l07)", "body": "<p><b>Негіз:</b> i = 1 - бір элементті a[0..0] сұрыпталған. <b>Қадам:</b> a[0..i−1] сұрыпталған делік. Ішкі цикл x = a[i]-ден үлкен элементтерді бір орын оңға жылжытады және x-тен үлкен емес бірінші элементте (не басында) тоқтайды. x сол орынға қойылады: сол жағында ≤ x, оң жағында > x элементтер, екеуі де сұрыпталған - a[0..i] сұрыпталған. Элементтер жиыны өзгермеді (тек жылжу). <b>Қорытынды:</b> i = n болғанда a[0..n−1] сұрыпталған. ∎</p>"},
        {"kind": "note", "title": "Салыстыру сандары", "body": "<p>Таңдау: (n−1) + (n−2) + ... + 1 = n(n−1)/2 - кіріске тәуелсіз. Кірістіру: сұрыпталған кірісте n−1 (ішкі цикл бірден тоқтайды), кері сұрыпталғанда n(n−1)/2. «Дерлік сұрыпталған» деректе кірістіру өте жылдам.</p>"},
    ],
    "visual": {"lab": "arena", "code": INSERTION, "func": "insertion_sort", "data": [7, 3, 9, 1, 6, 2, 8, 4],
               "caption": "Сары - салыстыру, қызыл - жазу. Үлкен элементтер оңға жылжиды, x өз орнына түседі."},
    "derivation": [
        "Таңдау: i = 0..n−2 үшін a[i..n−1] ішіндегі ең кішінің индексі m.",
        "a[i] мен a[m]-ді айырбастау: a[i], a[m] = a[m], a[i].",
        "Инвариант: a[0..i−1] - ең кіші i элемент, сұрыпталған.",
        "Ішкі цикл кіріске тәуелсіз толық жүреді - сондықтан салыстыру саны әрқашан n(n−1)/2.",
    ],
    "examples": [
        {"title": "Кіріс түріне тәуелділік", "lang": "python",
         "code": K + "\n" + SELECTION + "\n\n" + INSERTION + "\n\nimport random\nrandom.seed(17)\nn = 200\ncases = {'сұрыпталған': list(range(n)), 'кері': list(range(n, 0, -1)), 'кездейсоқ': random.sample(range(n), n)}\nfor name, data in cases.items():\n    row = []\n    for sort in [selection_sort, insertion_sort]:\n        a = [K(v) for v in data]\n        K.n = 0\n        sort(a)\n        assert [k.v for k in a] == sorted(data)\n        row.append(K.n)\n    print(f'{name:12} таңдау {row[0]:6}  кірістіру {row[1]:6}')\nprint('n(n-1)/2 =', n * (n - 1) // 2)",
         "output": "сұрыпталған  таңдау  19900  кірістіру    199\nкері         таңдау  19900  кірістіру  19900\nкездейсоқ    таңдау  19900  кірістіру   9793\nn(n-1)/2 = 19900",
         "explain": "Таңдау сұрыптауы кез келген кірісте 19900 салыстыру жасайды; кірістіру сұрыпталған кірісте 199-ға дейін түседі, кездейсоқ кірісте шамамен жартысы (n²/4)."},
    ],
    "experiment": {"lab": "arena", "code": SELECTION, "func": "selection_sort", "data": [5, 1, 4, 2, 8, 3, 7, 6],
                   "task": "Таңдау сұрыптауын бақылаңыз: жазулар аз (әр қадамда бір айырбас), бірақ салыстырулар көп. Кірісті 1, 2, 3, ..., 8 етіп өзгертіңіз - салыстыру саны өзгере ме?"},
    "exercises": [
        {"type": "pycode", "q": "selection_sort(a) - тізімді ОРНЫНДА (жаңа тізім жасамай) өсу ретімен сұрыптасын. Тест a-ның өзін тексереді.", "mode": "io",
         "suffix": "a = [5, 1, 4, 2, 8]\nr = selection_sort(a)\nprint(a, r)\nb = []\nselection_sort(b)\nc = [3, 3, 1]\nselection_sort(c)\nprint(b, c)",
         "starter": "def selection_sort(a):\n    return sorted(a)\n",
         "tests": [{"stdin": "", "stdout": "[1, 2, 4, 5, 8] None\n[] [1, 3, 3]"}],
         "solution": SELECTION,
         "hints": ["sorted жаңа тізім қайтарады - a өзгермейді.", "Ең кішінің индексі m; a[i], a[m] = a[m], a[i]."]},
        {"type": "pycode", "q": "insertion_sort(a) - кірістіру сұрыптауы (орнында). Тест сұрыпталған 2000 элементті тізімде салыстыру саны < 2·n екенін тексереді.", "mode": "io",
         "suffix": K + "a = [K(v) for v in [7, 3, 9, 1, 3]]\ninsertion_sort(a)\nprint(a)\nb = [K(v) for v in range(2000)]\nK.n = 0\ninsertion_sort(b)\nprint(K.n < 4000, [k.v for k in b] == list(range(2000)))",
         "starter": SELECTION.replace("selection_sort", "insertion_sort") + "\n",
         "tests": [{"stdin": "", "stdout": "[1, 3, 3, 7, 9]\nTrue True"}],
         "solution": INSERTION,
         "hints": ["Бастапқы код - таңдау сұрыптауы: әрқашан n(n−1)/2 ≈ 2 000 000 салыстыру.", "while j >= 0 and a[j] > x: a[j + 1] = a[j]; j -= 1."]},
        {"type": "number", "q": "Таңдау сұрыптауы 10 элементті тізімде неше салыстыру жасайды?", "answer": 45, "check": "10 * 9 // 2", "hints": ["(n−1) + ... + 1."]},
        {"type": "mc", "q": "Қай кірісте кірістіру сұрыптауы ең жылдам?", "options": ["Кері сұрыпталған", "Сұрыпталған не дерлік сұрыпталған", "Кездейсоқ", "Барлығында бірдей"], "answer": 1,
         "why": ["Бұл - ең нашар жағдай.", "Дұрыс: ішкі цикл бірден тоқтайды, n−1 салыстыру.", "Орташа ≈ n²/4.", "Бұл таңдау сұрыптауына тән."], "hints": ["Ішкі цикл қашан бірден тоқтайды?"]},
    ],
    "reasoning": "<p>Асимптотика бірдей (O(n²)) алгоритмдер тәжірибеде қатты ерекшеленуі мүмкін. Сондықтан Python-ның сұрыптауы (Timsort) кіші бөліктерде кірістіру сұрыптауын қолданады: кішкентай не дерлік сұрыпталған деректе ол ең жылдам.</p>",
    "mistakes": [
        {"mistake": "sorted(a)-ны «орнында сұрыптау» деп ойлау.", "why": "Жаңа тізім жасайды, a өзгермейді.", "fix": "a.sort() не өз алгоритміңіз тізімнің ұяшықтарына жазады."},
        {"mistake": "Ішкі циклда j >= 0 тексерісін ұмыту.", "why": "a[-1] - соңғы элемент (m08 l01), қате жасырын болады.", "fix": "while j >= 0 and a[j] > x."},
    ],
    "assessment": [
        {"type": "pycode", "q": "count_shifts(a) - кірістіру сұрыптауы кезінде элементтер неше рет оңға жылжитынын (a[j + 1] = a[j] саны) қайтарсын. Тізім өзгермесін.", "mode": "func", "func": "count_shifts",
         "starter": "def count_shifts(a):\n    return 0\n",
         "tests": [{"args": [[1, 2, 3]], "expect": 0}, {"args": [[3, 2, 1]], "expect": 3}, {"args": [[2, 4, 1, 3]], "expect": 3}, {"args": [[]], "expect": 0}],
         "solution": "def count_shifts(a):\n    a = list(a)\n    shifts = 0\n    for i in range(1, len(a)):\n        x = a[i]\n        j = i - 1\n        while j >= 0 and a[j] > x:\n            a[j + 1] = a[j]\n            shifts += 1\n            j -= 1\n        a[j + 1] = x\n    return shifts",
         "hints": ["Жылжу саны = инверсиялар саны (i < j, a[i] > a[j] жұптары).", "Тізімнің көшірмесімен жұмыс істеңіз: a = list(a)."]},
        {"type": "mc", "q": "Таңдау сұрыптауы неге тұрақты емес?", "options": ["Салыстырулары көп", "Алыс айырбас тең элементтің алдынан секіріп өтуі мүмкін", "Рекурсия қолданады", "Жаңа тізім жасайды"], "answer": 1,
         "why": ["Тұрақтылыққа қатысы жоқ.", "Дұрыс: мысалы [2а, 2б, 1] - бірінші айырбаста 2а соңына кетеді.", "Рекурсия жоқ.", "Орнында жұмыс істейді."], "hints": ["[2а, 2б, 1] сұрыптап көріңіз."]},
    ],
    "reflection": ["Arena-да екі алгоритмді бірдей кіріспен іске қосыңыз. Қайсысының жұмысы «түсінікті» көрінді? Неге?"],
    "further": {"honors": ["Кірістіру сұрыптауында орынды екілік іздеумен табу (binary insertion sort): салыстыру саны O(n log n)-ге түседі, бірақ уақыт неге бәрібір O(n²)?"],
                "research": ["Timsort алгоритмі (Python, Java): ол кірістіру сұрыптауы мен біріктіруді қалай үйлестіреді?"]},
    "references": REFS,
}

L04 = {
    **META, "id": "ao17-foundation.m09.l04", "slug": "l04", "title": "Біріктіру сұрыптауы", "difficulty": 3, "minutes": 60,
    "objectives": [
        "«Бөліп ал да билей» әдісін сипаттау: бөлу, рекурсивті шешу, біріктіру.",
        "Екі сұрыпталған тізімді O(n) уақытта біріктіру және біріктіру сұрыптауын іске асыру.",
        "T(n) = 2T(n/2) + n рекуррентінен O(n log n) бағасын шығару.",
    ],
    "prerequisites": ["ao17-foundation.m09.l03"],
    "concept": "<p>O(n²)-тан құтылу идеясы: тізімді екіге бөліп, әр жартысын <b>рекурсивті</b> сұрыптаймыз (m07 l05), сосын екі сұрыпталған жартыны «тігеміз». Біріктіру оңай: екі тізімнің басындағы кішісін алып отырамыз - әр салыстыру бір элементті орнына қояды.</p>"
               "<p>Рекурсия тереңдігі log₂ n, әр деңгейде барлығы n элемент біріктіріледі: n · log₂ n. n = 10⁶ үшін бұл ≈ 2·10⁷ - ал n² = 10¹².</p>",
    "theory": [
        {"kind": "definition", "title": "Бөліп ал да билей", "body": "<p>1) Есепті бірнеше кіші ішкі есепке бөлу. 2) Әрқайсысын рекурсивті шешу (база - тривиал есеп). 3) Шешімдерді біріктіру.</p>"},
        {"kind": "theorem", "title": "Салыстыру санының шекарасы", "body": "<p>n = 2ᵏ болғанда біріктіру сұрыптауы ең көбі n·log₂ n салыстыру жасайды: T(1) = 0, T(n) ≤ 2T(n/2) + n.</p>"},
        {"kind": "proof", "title": "Дәлелдеу (k бойынша индукция)", "body": "<p>Ұзындықтары p және q тізімдерді біріктіру ≤ p + q − 1 салыстыру жасайды (әр салыстыру бір элементті шығарады, соңғысы салыстырусыз). Сондықтан T(n) ≤ 2T(n/2) + n. <b>Негіз:</b> k = 0, n = 1: T(1) = 0 = 1·0. <b>Қадам:</b> T(2ᵏ) ≤ 2ᵏ·k делік. T(2ᵏ⁺¹) ≤ 2T(2ᵏ) + 2ᵏ⁺¹ ≤ 2·2ᵏ·k + 2ᵏ⁺¹ = 2ᵏ⁺¹(k + 1) = n·log₂ n. ∎</p>"},
        {"kind": "note", "title": "Бағасы - жад", "body": "<p>Біріктіру қосымша O(n) жад қолданады (жартылардың көшірмесі). Ол тұрақты: тең элементтерде сол жақтағысы бірінші алынады (left[i] <= right[j]).</p>"},
    ],
    "visual": {"lab": "arena", "code": MERGE_INPLACE, "func": "merge_sort", "data": [6, 2, 9, 4, 1, 8, 3, 7, 5, 0],
               "caption": "Бұл нұсқа біріктірілген нәтижені бастапқы тізімге қайта жазады: кіші бөліктер алдымен реттеледі, сосын үлкен бөліктер."},
    "derivation": [
        "База: len(a) <= 1 - тізім сұрыпталған.",
        "Бөлу: mid = len(a) // 2; left = merge_sort(a[:mid]), right = merge_sort(a[mid:]).",
        "Біріктіру: i = j = 0; кішісін out-қа қосып, сол индексті арттыру.",
        "Бір тізім біткенде, екіншісінің қалғанын тұтас қосу: out + left[i:] + right[j:].",
    ],
    "examples": [
        {"title": "n log n мен n² салыстыру", "lang": "python",
         "code": K + "\ndef merge(left, right):\n    out, i, j = [], 0, 0\n    while i < len(left) and j < len(right):\n        if left[i] <= right[j]:\n            out.append(left[i])\n            i += 1\n        else:\n            out.append(right[j])\n            j += 1\n    return out + left[i:] + right[j:]\n\ndef merge_sort(a):\n    if len(a) <= 1:\n        return a\n    mid = len(a) // 2\n    return merge(merge_sort(a[:mid]), merge_sort(a[mid:]))\n\nimport math, random\nrandom.seed(9)\nfor n in [64, 256, 1024]:\n    a = [K(v) for v in random.sample(range(10 * n), n)]\n    K.n = 0\n    s = merge_sort(a)\n    print(n, 'салыстыру', K.n, '≤ n·log2 n =', int(n * math.log2(n)), ' n²/4 =', n * n // 4)",
         "output": "64 салыстыру 299 ≤ n·log2 n = 384  n²/4 = 1024\n256 салыстыру 1718 ≤ n·log2 n = 2048  n²/4 = 16384\n1024 салыстыру 8952 ≤ n·log2 n = 10240  n²/4 = 262144",
         "explain": "Салыстыру саны теорема шекарасынан аспайды. n = 1024-те кірістіру сұрыптауы орташа ≈ 262 000, біріктіру ≈ 9 000 салыстыру жасайды."},
    ],
    "experiment": {"lab": "calltree", "code": "def merge_sort(a):\n    if len(a) <= 1:\n        return a\n    mid = len(a) // 2\n    left = merge_sort(a[:mid])\n    right = merge_sort(a[mid:])\n    return sorted(left + right)", "call": "merge_sort([5, 2, 7, 1, 9, 3, 8, 6])",
                   "task": "Рекурсия ағашы: тереңдік неше? Әр деңгейде барлығы неше элемент бар? (Біріктіруді бұл жерде sorted жасап тұр - тапсырмада өзіңіз жазасыз.)"},
    "exercises": [
        {"type": "pycode", "q": "merge(left, right) - екі сұрыпталған тізімді бір сұрыпталған тізімге біріктірсін. sorted/sort қолданбаңыз; тест салыстыру санын тексереді (≤ p + q − 1).", "mode": "io",
         "suffix": K + "l = [K(v) for v in [1, 4, 6, 9]]\nr = [K(v) for v in [2, 3, 7]]\nK.n = 0\nprint(merge(l, r), K.n <= 6)\nprint(merge([], [K(1)]), merge([K(2)], []))",
         "starter": "def merge(left, right):\n    return sorted(left + right)\n",
         "tests": [{"stdin": "", "stdout": "[1, 2, 3, 4, 6, 7, 9] True\n[1] [2]"}],
         "solution": "def merge(left, right):\n    out, i, j = [], 0, 0\n    while i < len(left) and j < len(right):\n        if left[i] <= right[j]:\n            out.append(left[i])\n            i += 1\n        else:\n            out.append(right[j])\n            j += 1\n    return out + left[i:] + right[j:]",
         "hints": ["sorted O(n log n) салыстыру жасайды, ал біріктіру - O(n).", "Екі көрсеткіш i және j."]},
        {"type": "pycode", "q": "merge_sort(a) - біріктіру сұрыптауы: ЖАҢА сұрыпталған тізім қайтарсын (кіріс өзгермесін). Өз merge функцияңызды да жазыңыз.", "mode": "io",
         "suffix": K + "import random\nrandom.seed(5)\ndata = random.sample(range(5000), 2000)\na = [K(v) for v in data]\nK.n = 0\ns = merge_sort(a)\nprint([k.v for k in s] == sorted(data), K.n <= 2000 * 11, [k.v for k in a] == data)\nprint(merge_sort([]), merge_sort([K(3), K(1), K(2)]))",
         "starter": "def merge_sort(a):\n    a = list(a)\n    for i in range(1, len(a)):\n        x = a[i]\n        j = i - 1\n        while j >= 0 and a[j] > x:\n            a[j + 1] = a[j]\n            j -= 1\n        a[j + 1] = x\n    return a\n",
         "tests": [{"stdin": "", "stdout": "True True True\n[] [1, 2, 3]"}],
         "solution": "def merge(left, right):\n    out, i, j = [], 0, 0\n    while i < len(left) and j < len(right):\n        if left[i] <= right[j]:\n            out.append(left[i])\n            i += 1\n        else:\n            out.append(right[j])\n            j += 1\n    return out + left[i:] + right[j:]\n\ndef merge_sort(a):\n    if len(a) <= 1:\n        return list(a)\n    mid = len(a) // 2\n    return merge(merge_sort(a[:mid]), merge_sort(a[mid:]))",
         "hints": ["Бастапқы код - кірістіру сұрыптауы: ≈ n²/4 = 1 000 000 салыстыру, шек - 22 000.", "База: len(a) <= 1."]},
        {"type": "recurrence", "q": "Біріктіру сұрыптауының салыстыру санына ұқсас рекуррент: a(1) = 0, a(n) = 2·a(n−1) + 2ⁿ⁻¹ (мұнда n - деңгей, тізім ұзындығы 2ⁿ⁻¹). Жабық формуласын табыңыз.", "start": 1, "first": "0", "rule": "2*a + 2^(n-1)",
         "solution": "(n-1)*2^(n-1)", "hints": ["Ұзындық N = 2ⁿ⁻¹ болса, жауап N·log₂ N.", "a(n) = (n − 1)·2ⁿ⁻¹."]},
        {"type": "mc", "q": "T(n) = 2T(n/2) + n рекурренті нені білдіреді?", "options": ["Екі ішкі есеп, әрқайсысы n/2, біріктіру n", "n ішкі есеп", "Бір ішкі есеп n/2", "Біріктіру тегін"], "answer": 0,
         "why": ["Дұрыс.", "Екі ішкі есеп.", "Бұл - екілік іздеу: T(n) = T(n/2) + 1.", "Біріктіру n жұмыс."], "hints": ["2T(n/2) - не? n - не?"]},
    ],
    "reasoning": "<p>Салыстыру арқылы сұрыптайтын кез келген алгоритм ең нашар жағдайда кемінде log₂(n!) ≈ n log₂ n салыстыру жасайды (n! ретті ажырату үшін әр салыстыру тек 2 жауап береді). Демек біріктіру сұрыптауы асимптотикалық тұрғыдан оңтайлы - бұдан жақсырақ салыстыру алгоритмі жоқ.</p>",
    "mistakes": [
        {"mistake": "Біріктіруден кейін қалған бөлікті ұмыту.", "why": "Бір тізім біткенде екіншісінің соңы жоғалады.", "fix": "return out + left[i:] + right[j:]."},
        {"mistake": "left[i] < right[j] (қатаң) қолдану.", "why": "Тұрақтылық бұзылады: тең элементтерде оң жақтағысы бірінші кетеді.", "fix": "left[i] <= right[j]."},
    ],
    "assessment": [
        {"type": "pycode", "q": "count_inversions(a) - i < j және a[i] > a[j] болатын жұптар санын O(n log n) уақытта қайтарсын (біріктіру кезінде санау). Тест ұзындығы 3000 кері тізімде өтеді.", "mode": "func", "func": "count_inversions",
         "starter": "def count_inversions(a):\n    c = 0\n    for i in range(len(a)):\n        for j in range(i + 1, len(a)):\n            if a[i] > a[j]:\n                c += 1\n    return c\n",
         "tests": [{"args": [[1, 2, 3]], "expect": 0}, {"args": [[3, 1, 2]], "expect": 2}, {"args": [[2, 4, 1, 3, 5]], "expect": 3}, {"args": [list(range(3000, 0, -1))], "expect": 4498500}],
         "solution": "def count_inversions(a):\n    def sort(xs):\n        if len(xs) <= 1:\n            return xs, 0\n        mid = len(xs) // 2\n        left, a1 = sort(xs[:mid])\n        right, a2 = sort(xs[mid:])\n        out, i, j, c = [], 0, 0, a1 + a2\n        while i < len(left) and j < len(right):\n            if left[i] <= right[j]:\n                out.append(left[i])\n                i += 1\n            else:\n                out.append(right[j])\n                c += len(left) - i\n                j += 1\n        return out + left[i:] + right[j:], c\n    return sort(list(a))[1]",
         "hints": ["right[j] сол жақтан бұрын алынса, left[i:]-дегі БАРЛЫҚ элемент одан үлкен.", "c += len(left) - i.", "Функция (тізім, инверсия саны) жұбын қайтарсын."]},
        {"type": "mc", "q": "Біріктіру сұрыптауының қосымша жадысы:", "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"], "answer": 2,
         "why": ["Бұл таңдау/кірістіру сұрыптауы.", "Тек рекурсия стегі - бірақ көшірмелер бар.", "Дұрыс: жартылардың көшірмелері.", "Тым көп."], "hints": ["left мен right көшірмелері."]},
    ],
    "reflection": ["Бөліп ал да билей идеясын күнделікті өмірдегі қандай есепте көресіз (мысалы, 1000 емтихан жұмысын әліпби бойынша реттеу)?"],
    "further": {"honors": ["Төменнен жоғары (bottom-up) біріктіру сұрыптауын рекурсиясыз жазыңыз: ұзындығы 1, 2, 4, ... бөліктерді біріктіру."],
                "research": ["Сыртқы сұрыптау (external sort): жадқа сыймайтын 100 ГБ файлды біріктіру идеясымен қалай сұрыптайды?"]},
    "references": REFS,
}

L05 = {
    **META, "id": "ao17-foundation.m09.l05", "slug": "l05", "title": "Жылдам сұрыптау", "difficulty": 4, "minutes": 60,
    "objectives": [
        "Бөлу (partition) процедурасын инвариантпен жазу (Ломуто схемасы).",
        "Тірек таңдаудың әсерін көрсету: ең нашар жағдай n(n−1)/2, орташа ≈ 1.39·n log₂ n.",
        "Кездейсоқ тірек және quickselect (k-шы ең кіші элемент) идеясын қолдану.",
    ],
    "prerequisites": ["ao17-foundation.m09.l04"],
    "concept": "<p>Жылдам сұрыптау да «бөліп ал да билей», бірақ жұмыс <b>бөлуде</b>: тірек (pivot) таңдап, тізімді «тіректен кіші | тірек | тіректен үлкен» етіп орнында қайта реттейміз. Сосын екі бөлікті рекурсивті сұрыптаймыз - біріктіру керек емес.</p>"
               "<p>Бөліктер тең болса - n log n. Бірақ тірек әрқашан ең үлкен элемент болса (мысалы, сұрыпталған кірісте соңғы элемент), бір бөлік бос, екіншісі n − 1: n(n−1)/2 салыстыру. Кездейсоқ тірек мұндай «жаман кірісті» іс жүзінде мүмкін емес етеді.</p>",
    "theory": [
        {"kind": "definition", "title": "Ломуто бөлуі", "body": "<p>pivot = a[hi]; i = lo. j = lo..hi−1 үшін: a[j] &lt; pivot болса, a[i] мен a[j]-ді айырбастап, i += 1. Соңында a[i] мен a[hi]-ді айырбастау. Инвариант: a[lo..i−1] &lt; pivot, a[i..j−1] ≥ pivot.</p>"},
        {"kind": "theorem", "title": "Ең нашар жағдай", "body": "<p>Әр бөлуде тірек бөліктегі ең үлкен (не ең кіші) элемент болса, жылдам сұрыптау n(n−1)/2 салыстыру жасайды.</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>Ұзындығы m бөлікті бөлу m − 1 салыстыру жасайды (тіректен басқа әр элемент бір рет). Тірек ең үлкен болса, бөліктер m − 1 және 0 болады. Сондықтан ұзындықтар n, n − 1, ..., 2 болып кемиді, салыстырулар: (n − 1) + (n − 2) + ... + 1 = n(n−1)/2 (m02 l07). ∎ Ломуто схемасында сұрыпталған кіріс дәл осы жағдай: a[hi] әрқашан ең үлкен.</p>"},
        {"kind": "note", "title": "Неге бәрібір «жылдам»?", "body": "<p>Орташа жағдайда (кездейсоқ тірек) ≈ 2n ln n ≈ 1.39·n log₂ n салыстыру, қосымша жадсыз (орнында) және кэшке ыңғайлы. Тәжірибеде жиі ең жылдам. Кемшілігі - тұрақты емес.</p>"},
    ],
    "visual": {"lab": "arena", "code": QUICK, "func": "quick_sort", "data": [6, 2, 9, 4, 1, 8, 3, 7, 5],
               "caption": "Тірек - бөліктің соңғы элементі. Әр бөлуден кейін тірек өз соңғы орнына түседі."},
    "derivation": [
        "quick_sort(a, lo, hi): lo >= hi болса - тоқтау (0 не 1 элемент).",
        "p = partition(a, lo, hi) - тіректің соңғы орны.",
        "quick_sort(a, lo, p - 1); quick_sort(a, p + 1, hi).",
        "Тірек p-де тұр және енді ешқашан жылжымайды: солында кішілер, оңында үлкендер.",
    ],
    "examples": [
        {"title": "Тірек таңдау маңызды", "lang": "python",
         "code": K + "\nimport random\n\ndef quick_sort(a, lo, hi, rnd):\n    while lo < hi:\n        if rnd:\n            r = random.randint(lo, hi)\n            a[r], a[hi] = a[hi], a[r]\n        pivot, i = a[hi], lo\n        for j in range(lo, hi):\n            if a[j] < pivot:\n                a[i], a[j] = a[j], a[i]\n                i += 1\n        a[i], a[hi] = a[hi], a[i]\n        if i - lo < hi - i:\n            quick_sort(a, lo, i - 1, rnd)\n            lo = i + 1\n        else:\n            quick_sort(a, i + 1, hi, rnd)\n            hi = i - 1\n\nrandom.seed(3)\nn = 400\nfor name, data in [('сұрыпталған', list(range(n))), ('кездейсоқ', random.sample(range(n), n))]:\n    for rnd in [False, True]:\n        a = [K(v) for v in data]\n        K.n = 0\n        quick_sort(a, 0, n - 1, rnd)\n        print(f'{name:12} кездейсоқ тірек={rnd!s:5} салыстыру {K.n}')\nprint('n(n-1)/2 =', n * (n - 1) // 2)",
         "output": "сұрыпталған  кездейсоқ тірек=False салыстыру 79800\nсұрыпталған  кездейсоқ тірек=True  салыстыру 3657\nкездейсоқ    кездейсоқ тірек=False салыстыру 3181\nкездейсоқ    кездейсоқ тірек=True  салыстыру 3618\nn(n-1)/2 = 79800",
         "explain": "Сұрыпталған кірісте соңғы элементті тірек ету теореманың ең нашар жағдайын береді (79800). Кездейсоқ тірек оны ≈ 3600-ге түсірді (n log₂ n ≈ 3460). (Кіші бөлікке рекурсия - стек тереңдігін log n-де ұстайды.)"},
    ],
    "experiment": {"lab": "arena", "code": QUICK, "func": "quick_sort", "data": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                   "task": "Сұрыпталған кірісте салыстыру саны n(n−1)/2 = 66 болады - тексеріңіз. Кодқа кездейсоқ тірек қосыңыз (import random; r = random.randint(lo, hi); a[r], a[hi] = a[hi], a[r]) және қайта іске қосыңыз."},
    "exercises": [
        {"type": "pycode", "q": "partition(a, lo, hi) - Ломуто бөлуі: pivot = a[hi]; a[lo..hi]-ді орнында қайта реттеп, тіректің соңғы индексін қайтарсын.", "mode": "io",
         "suffix": "a = [7, 2, 9, 4, 1, 5]\np = partition(a, 0, 5)\nprint(p, a[p], all(x < a[p] for x in a[:p]), all(x >= a[p] for x in a[p + 1:]), sorted(a) == [1, 2, 4, 5, 7, 9])\nb = [3, 8, 1, 9, 5, 2]\nq = partition(b, 1, 4)\nprint(q, b)",
         "starter": "def partition(a, lo, hi):\n    pivot = a[hi]\n    left = [x for x in a[lo:hi] if x < pivot]\n    right = [x for x in a[lo:hi] if x >= pivot]\n    return len(left)\n",
         "tests": [{"stdin": "", "stdout": "3 5 True True True\n2 [3, 1, 5, 9, 8, 2]"}],
         "solution": "def partition(a, lo, hi):\n    pivot = a[hi]\n    i = lo\n    for j in range(lo, hi):\n        if a[j] < pivot:\n            a[i], a[j] = a[j], a[i]\n            i += 1\n    a[i], a[hi] = a[hi], a[i]\n    return i",
         "hints": ["Бастапқы код a-ны өзгертпейді және lo-ны ескермейді.", "i - келесі «кіші» элементтің орны; соңында a[i], a[hi] айырбасы."]},
        {"type": "pycode", "q": "quick_sort(a) - тізімді орнында жылдам сұрыптасын (кез келген тірек схемасы). Тест сұрыпталған 1500 элементті кірісте салыстыру санын тексереді - кездейсоқ не ортаңғы тірек қолданыңыз.", "mode": "io",
         "suffix": K + "import random\nrandom.seed(1)\nb = [K(v) for v in range(1500)]\nK.n = 0\nquick_sort(b)\nprint([k.v for k in b] == list(range(1500)), K.n < 60000)\na = [K(v) for v in [5, 3, 8, 3, 1]]\nquick_sort(a)\nprint(a)",
         "starter": QUICK.replace("def quick_sort(a, lo=0, hi=None):", "def quick_sort(a, lo=0, hi=None):") + "\n",
         "tests": [{"stdin": "", "stdout": "True True\n[1, 3, 3, 5, 8]"}],
         "solution": "import random\n\ndef quick_sort(a, lo=0, hi=None):\n    if hi is None:\n        hi = len(a) - 1\n    if lo >= hi:\n        return\n    r = random.randint(lo, hi)\n    a[r], a[hi] = a[hi], a[r]\n    pivot = a[hi]\n    i = lo\n    for j in range(lo, hi):\n        if a[j] < pivot:\n            a[i], a[j] = a[j], a[i]\n            i += 1\n    a[i], a[hi] = a[hi], a[i]\n    quick_sort(a, lo, i - 1)\n    quick_sort(a, i + 1, hi)",
         "hints": ["Бастапқы код сұрыпталған кірісте n(n−1)/2 ≈ 1 100 000 салыстыру жасайды (және рекурсия тым терең).", "Бөлуден бұрын кездейсоқ элементті a[hi]-мен айырбастаңыз."]},
        {"type": "mc", "q": "Ломуто схемасында (тірек - соңғы элемент) ең нашар кіріс:", "options": ["Кездейсоқ тізім", "Сұрыпталған тізім", "Барлық элемент әр түрлі", "Ұзындығы тақ тізім"], "answer": 1,
         "why": ["Орташа n log n.", "Дұрыс: тірек әрқашан ең үлкен - бөліктер n−1 және 0.", "Бұл маңызды емес.", "Маңызды емес."], "hints": ["Тірек қашан әрқашан ең үлкен?"]},
        {"type": "number", "q": "Ломуто жылдам сұрыптауы сұрыпталған 20 элементті тізімде неше салыстыру жасайды?", "answer": 190, "check": "20 * 19 // 2", "hints": ["Теорема: n(n−1)/2."]},
    ],
    "reasoning": "<p>Жылдам сұрыптау - «ықтималдық алгоритмге қалай көмектеседі?» сұрағының классикалық жауабы. Кездейсоқ тірек ең нашар жағдайды жоймайды, бірақ оны кез келген кіріс үшін болмашы ықтималдыққа айналдырады: ешбір «жаман» кірісті алдын ала құрастыру мүмкін емес.</p>",
    "mistakes": [
        {"mistake": "Тіректі бөліктердің біріне қосып рекурсия жасау.", "why": "Барлық элемент тең болса, бөлік кішірейемей шексіз рекурсия.", "fix": "Тірек өз орнында қалады: (lo, p − 1) және (p + 1, hi)."},
        {"mistake": "Жылдам сұрыптауды тұрақты деп ойлау.", "why": "Алыс айырбастар тең элементтердің ретін бұзады.", "fix": "Тұрақтылық керек болса - біріктіру сұрыптауы не Python-ның sorted."},
    ],
    "assessment": [
        {"type": "pycode", "q": "kth_smallest(a, k) - k-шы ең кіші элементті (k = 1 - ең кішісі) quickselect арқылы, ТОЛЫҚ сұрыптаусыз қайтарсын. Кіріс тізімі өзгермесін.", "mode": "io",
         "suffix": K + "import random\nrandom.seed(2)\ndata = random.sample(range(100000), 3000)\na = [K(v) for v in data]\nK.n = 0\nprint(kth_smallest(a, 1500) == sorted(data)[1499], K.n < 30000, [x.v for x in a] == data)\nprint(kth_smallest([K(4), K(1), K(3)], 1), kth_smallest([K(4), K(1), K(3)], 3))",
         "starter": "def kth_smallest(a, k):\n    b = list(a)\n    for i in range(len(b)):\n        m = i\n        for j in range(i + 1, len(b)):\n            if b[j] < b[m]:\n                m = j\n        b[i], b[m] = b[m], b[i]\n    return b[k - 1]\n",
         "tests": [{"stdin": "", "stdout": "True True True\n1 4"}],
         "solution": "import random\n\ndef kth_smallest(a, k):\n    b = list(a)\n    lo, hi = 0, len(b) - 1\n    while True:\n        r = random.randint(lo, hi)\n        b[r], b[hi] = b[hi], b[r]\n        pivot, i = b[hi], lo\n        for j in range(lo, hi):\n            if b[j] < pivot:\n                b[i], b[j] = b[j], b[i]\n                i += 1\n        b[i], b[hi] = b[hi], b[i]\n        if i == k - 1:\n            return b[i]\n        if i < k - 1:\n            lo = i + 1\n        else:\n            hi = i - 1",
         "hints": ["Бөлуден кейін тірек i-де: i == k − 1 болса - жауап.", "Тек k жатқан бөлікке ғана жалғастырыңыз - орташа O(n).", "Бастапқы код - таңдау сұрыптауы: ≈ 4 500 000 салыстыру."]},
        {"type": "mc", "q": "Кездейсоқ тірек не береді?", "options": ["Ең нашар жағдайды толық жояды", "Кез келген кіріс үшін күтілетін уақыт O(n log n) болады", "Алгоритмді тұрақты етеді", "Жадты азайтады"], "answer": 1,
         "why": ["Ең нашар жағдай мүмкін, бірақ ықтималдығы болмашы.", "Дұрыс.", "Тұрақтылыққа әсері жоқ.", "Жадқа әсері жоқ."], "hints": ["«Күтілетін» сөзі."]},
    ],
    "reflection": ["Сіз білетін алгоритмдердің қайсысына кездейсоқтық қосу пайдалы болар еді? Неге?"],
    "further": {"honors": ["Хоар бөлуі (екі көрсеткіш екі жақтан) Ломутодан неге аз айырбас жасайды? Arena-да салыстырыңыз."],
                "research": ["Introsort (C++ std::sort): жылдам сұрыптау тым терең кеткенде үйме сұрыптауына (heapsort) ауысады. Неге?"]},
    "references": REFS,
}

LESSONS = [L01, L02, L03, L04, L05]
