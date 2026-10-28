/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. Harvard CS50 материалдары мен үшінші тарап компоненттері өз лицензияларымен қалады. */
/* AO17: ойындар орталығы, 1-жинақ: Code Runner, Bug Hunter, Code Battle, Algorithm Race.
   Барлық сұрақ пен код үзіндісі осы жерде жазылған (өз мазмұны), интернетсіз, AI API-сіз. */
(function () {
  "use strict";
  const G = window.CS50Games;
  if (!G) return;
  const FAST = /[?&]fast\b/.test(location.search); // тест үшін: таймерлер қысқарады
  const reduced = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
  const $ = (s, r) => (r || document).querySelector(s);

  /* =========================================================
     1) CODE RUNNER: Python үзінділері
     [түрі, нәтиже/сипаттама, алдын ала код (контекст), дұрыс код, [қате нұсқалар]]
     түрі "o": контекст + код орындалғанда stdout == нәтиже;
     түрі "s": дұрыс код синтаксисі дұрыс, қате нұсқаларда SyntaxError бар.
     ========================================================= */
  const RUN = [
    ["o", "8", "", "print(2 + 3 * 2)", ["print((2 + 3) * 2)", "print(2 + 3 + 2)"]],
    ["o", "3", "", "print(7 // 2)", ["print(7 / 2)", "print(7 % 2)"]],
    ["o", "1", "", "print(10 % 3)", ["print(10 // 3)", "print(10 - 3)"]],
    ["o", "32", "", "print(2 ** 5)", ["print(2 * 5)", "print(5 ** 2)"]],
    ["o", "ababab", "", "print('ab' * 3)", ["print('ab' + '3')", "print('ab' * 2)"]],
    ["o", "5", "", "print(len('salem'))", ["print(len('sal'))", "print(len('salem!'))"]],
    ["o", "20", "x = [10, 20, 30]", "print(x[1])", ["print(x[0])", "print(x[-1])"]],
    ["o", "6", "x = [4, 5, 6]", "print(x[-1])", ["print(x[1])", "print(x[0])"]],
    ["o", "0\n1\n2", "", "for i in range(3):\n    print(i)", ["for i in range(1, 3):\n    print(i)", "for i in range(4):\n    print(i)"]],
    ["o", "6", "s = 0", "for i in range(1, 4):\n    s += i\nprint(s)", ["for i in range(1, 3):\n    s += i\nprint(s)", "for i in range(2, 5):\n    s += i\nprint(s)"]],
    ["o", "Сәлем, Aru!", "name = 'Aru'", "print(f'Сәлем, {name}!')", ["print('Сәлем, {name}!')", "print(f'Сәлем, name!')"]],
    ["o", "8", "def f(x):\n    return x * 2", "print(f(4))", ["print(f(4) + 1)", "print(f(2))"]],
    ["o", "үлкен", "x = 7", "print('үлкен' if x > 5 else 'кіші')", ["print('үлкен' if x < 5 else 'кіші')", "print('үлкен' if x == 5 else 'кіші')"]],
    ["o", "жұп", "n = 10", "if n % 2 == 0:\n    print('жұп')\nelse:\n    print('тақ')", ["if n % 2 == 1:\n    print('жұп')\nelse:\n    print('тақ')", "if n // 2 == 0:\n    print('жұп')\nelse:\n    print('тақ')"]],
    ["o", "3", "x = [5, 3, 9, 1]", "print(x.index(1))", ["print(x.index(3))", "print(x.index(5))"]],
    ["o", "4", "x = [5, 3, 9, 1]", "print(len(x))", ["print(len(x) - 1)", "print(max(x))"]],
    ["o", "9", "x = [5, 3, 9, 1]", "print(max(x))", ["print(min(x))", "print(sum(x))"]],
    ["o", "[1, 2, 3]", "x = [3, 1, 2]", "x.sort()\nprint(x)", ["x.reverse()\nprint(x)", "print(x)"]],
    ["o", "KAZ", "", "print('kaz'.upper())", ["print('KAZ'.lower())", "print('kaz'.title())"]],
    ["o", "3", "", "print(len('a,b,c'.split(',')))", ["print('a,b,c'.count(','))", "print(len('a,b,c'))"]],
    ["o", "olleh", "", "print('hello'[::-1])", ["print('hello'[1:])", "print('hello'[:3])"]],
    ["o", "ell", "", "print('hello'[1:4])", ["print('hello'[1:3])", "print('hello'[0:4])"]],
    ["o", "10", "", "print(sum(range(5)))", ["print(sum(range(4)))", "print(sum(range(1, 5)) + 1)"]],
    ["o", "3.5", "", "print(7 / 2)", ["print(7 // 2)", "print(int(7 / 2))"]],
    ["o", "True", "", "print(3 in [1, 2, 3])", ["print(4 in [1, 2, 3])", "print(3 not in [1, 2, 3])"]],
    ["o", "15", "", "print(int('12') + 3)", ["print('12' + '3')", "print(int('12') + int('3') * 2)"]],
    ["o", "123", "", "print('12' + '3')", ["print(12 + 3)", "print(int('12') + 3)"]],
    ["o", "2", "d = {'a': 1, 'b': 2}", "print(d['b'])", ["print(d['a'])", "print(len(d) + 1)"]],
    ["o", "0\n2\n4", "", "for i in range(0, 6, 2):\n    print(i)", ["for i in range(0, 6, 3):\n    print(i)", "for i in range(2, 6, 2):\n    print(i)"]],
    ["o", "x\nx", "", "for _ in range(2):\n    print('x')", ["for _ in range(3):\n    print('x')", "for _ in range(1):\n    print('x')"]],
    ["o", "3", "n = 0", "while n < 3:\n    n += 1\nprint(n)", ["while n < 2:\n    n += 1\nprint(n)", "while n < 4:\n    n += 1\nprint(n)"]],
    ["o", "12", "def add(a, b):\n    return a + b", "print(add(5, 7))", ["print(add(5, 7) - 1)", "print(add(5, 7) * 2)"]],
    ["o", "a\nNone", "def f():\n    print('a')", "print(f())", ["f()", "print(f)"]],
    ["o", "a b c", "", "print('a', 'b', 'c')", ["print('a' + 'b' + 'c')", "print('a', 'b', 'c', sep='')"]],
    ["o", "abc", "", "print('a' + 'b' + 'c')", ["print('a', 'b', 'c')", "print('abc' * 2)"]],
    ["o", "4", "x = 10", "x -= 6\nprint(x)", ["x += 6\nprint(x)", "x //= 6\nprint(x)"]],
    ["o", "25", "", "print(abs(-5) ** 2)", ["print(-5 ** 2)", "print(abs(-5) * 2)"]],
    ["o", "[2, 4, 6]", "", "print([i * 2 for i in range(1, 4)])", ["print([i * 2 for i in range(3)])", "print([i + 2 for i in range(1, 4)])"]],
    ["o", "[2, 3]", "x = [1, 2, 3, 4]", "print(x[1:3])", ["print(x[1:2])", "print(x[2:])"]],
    ["o", "True", "", "print(5 > 3 and 2 < 4)", ["print(5 > 3 and 2 > 4)", "print(5 < 3 or 2 > 4)"]],
    ["o", "False", "", "print(not (1 == 1))", ["print(not (1 == 2))", "print(1 == 1 and 2 == 2)"]],
    ["o", "10", "", "print(round(9.6))", ["print(round(9.4))", "print(int(9.6))"]],
    ["o", "жас", "age = 15", "print('жас' if 12 <= age < 18 else 'басқа')", ["print('жас' if age > 18 else 'басқа')", "print('жас' if age < 12 else 'басқа')"]],
    ["o", "Python", "words = ['C', 'Python', 'SQL']", "print(max(words, key=len))", ["print(min(words, key=len))", "print(words[0])"]],
    ["o", "3", "t = (1, 2, 3)", "print(t[-1])", ["print(t[0])", "print(t[1])"]],
    ["s", "Қатесіз жазылған шарт", "", "if x == 5:\n    print(x)", ["if x = 5:\n    print(x)", "if x == 5\n    print(x)"]],
    ["s", "Қатесіз жазылған цикл", "", "for i in range(3):\n    print(i)", ["for i in range(3)\n    print(i)", "for i range(3):\n    print(i)"]],
    ["s", "Қатесіз жазылған функция", "", "def kosu(a, b):\n    return a + b", ["def kosu(a, b)\n    return a + b", "def kosu(a, b):\nreturn a + b"]],
    ["s", "Жолы дұрыс жабылған print", "", "print('Сәлем')", ["print('Сәлем)", "print('Сәлем'"]],
    ["s", "Қатесіз тізім", "", "x = [1, 2, 3]", ["x = [1, 2, 3", "x = (1, 2, 3]"]],
    ["s", "Қатесіз while циклі", "", "while n < 3:\n    n += 1", ["while n < 3\n    n += 1", "while n < 3:\nn += 1"]],
    ["s", "Қатесіз сөздік", "", "d = {'a': 1}", ["d = {'a' 1}", "d = {'a': 1"]],
    ["s", "Қатесіз f-string", "", "print(f'{x} + {y}')", ["print(f'{x + {y}')", "print(f'{x} + {y})"]],
    ["s", "Қатесіз try/except", "", "try:\n    x = 1\nexcept ValueError:\n    x = 0", ["try:\n    x = 1\nexcept ValueError\n    x = 0", "try:\n    x = 1\nx = 0"]],
    ["s", "Қатесіз импорт", "", "from math import sqrt", ["from math import", "import from math sqrt"]],
    ["s", "Қатесіз тізім құрастыру", "", "x = [i for i in range(3)]", ["x = [i for i in range(3)", "x = [for i in range(3)]"]],
    ["s", "Қатесіз логикалық шарт", "", "if a and b:\n    pass", ["if a && b:\n    pass", "if a and b\n    pass"]],
    ["s", "Қатесіз класс", "", "class Ayu:\n    pass", ["class Ayu\n    pass", "clas Ayu:\n    pass"]],
  ];

  /* =========================================================
     2) BUG HUNTER: {l: тіл, t: атауы, c: жолдар, b: қате жол индексі (0-ден),
                     w: түсіндірме, f: дұрыс жол, s: true болса қате код компиляцияланбайды}
     ========================================================= */
  const BUGS = [
    // ---------- Python ----------
    { l: "Python", t: "Тізім қосындысы", c: ["nums = [3, 5, 8]", "total = 0", "for n in nums:", "    total = n", "print(total)"], b: 3, w: "Логикалық қате: «=» әр қадамда total-ды соңғы санмен ауыстырады, қосынды жиналмайды. Нәтиже 16 емес, 8 болады.", f: "    total += n" },
    { l: "Python", t: "Шарттағы қос нүкте", c: ["age = 16", "if age >= 18", "    print('ересек')", "else:", "    print('бала')"], b: 1, w: "Синтаксистік қате: if жолының соңында «:» жоқ. Python SyntaxError шығарады.", f: "if age >= 18:", s: true },
    { l: "Python", t: "Меншіктеу мен салыстыру", c: ["x = 4", "if x = 4:", "    print('төрт')"], b: 1, w: "Шартта салыстыру «==» болуы керек. Бір «=» мән меншіктейді, оны if шартында қолдануға болмайды (SyntaxError).", f: "if x == 4:", s: true },
    { l: "Python", t: "Индекс ауқымы", c: ["items = ['a', 'b', 'c']", "for i in range(len(items) + 1):", "    print(items[i])"], b: 1, w: "Индекс қатесі: тізімде 3 элемент (индекстер 0, 1, 2), ал цикл i = 3 дейін барады, items[3] IndexError береді.", f: "for i in range(len(items)):" },
    { l: "Python", t: "Шексіз цикл", c: ["n = 5", "while n != 0:", "    print(n)", "    n -= 2"], b: 1, w: "n = 5, 3, 1, -1, -3 ... болып азаяды, ешқашан 0 болмайды, сондықтан шарт әрдайым ақиқат: шексіз цикл.", f: "while n > 0:" },
    { l: "Python", t: "input() мәтін қайтарады", c: ["a = input('Бірінші сан: ')", "b = input('Екінші сан: ')", "print(a + b)"], b: 2, w: "input() әрдайым str қайтарады, сондықтан «+» сандарды қоспай, мәтіндерді жалғайды: 2 және 3 үшін 5 емес, 23 шығады.", f: "print(int(a) + int(b))" },
    { l: "Python", t: "Факториал", c: ["def fact(n):", "    r = 1", "    for i in range(1, n):", "        r *= i", "    return r"], b: 2, w: "range(1, n) соңғы санды (n) қоспайды, сондықтан fact(5) 120 емес, 24 болады.", f: "    for i in range(1, n + 1):" },
    { l: "Python", t: "Ерте return", c: ["def has_neg(xs):", "    for x in xs:", "        if x < 0:", "            return True", "        return False"], b: 4, w: "return False цикл ішінде тұр: функция тек бірінші элементті тексеріп шығып кетеді. Ол циклден кейін болуы керек.", f: "    return False" },
    { l: "Python", t: "Жол өзгермейді", c: ["s = 'salem'", "s[0] = 'S'", "print(s)"], b: 1, w: "Python-да жолдар өзгермейтін (immutable): s[0] = ... TypeError береді. Жаңа жол жасау керек.", f: "s = 'S' + s[1:]" },
    { l: "Python", t: "Мәтінді санмен салыстыру", c: ["age = input('Жасың: ')", "if age >= 18:", "    print('ересек')"], b: 1, w: "age мәтін (str), оны санмен «>=» салыстыруға болмайды: TypeError. Алдымен int(age) жасау керек.", f: "if int(age) >= 18:" },
    { l: "Python", t: "return ұмытылды", c: ["def square(x):", "    x * x", "", "print(square(4))"], b: 1, w: "Функция мәнді есептейді, бірақ қайтармайды, сондықтан square(4) None береді. return керек.", f: "    return x * x" },
    { l: "Python", t: "Айнымалы аты қате", c: ["count = 0", "for ch in 'banana':", "    if ch == 'a':", "        cnt += 1", "print(count)"], b: 3, w: "NameError: cnt деген айнымалы жасалмаған. Дұрыс аты count.", f: "        count += 1" },

    // ---------- JavaScript ----------
    { l: "JavaScript", t: "if ішіндегі меншіктеу", c: ["let x = 5;", "if (x = 10) {", "  console.log('он');", "}"], b: 1, w: "«x = 10» шартта мән меншіктейді (және ақиқат қайтарады), x өзгеріп кетеді. Салыстыру үшін «===» керек.", f: "if (x === 10) {" },
    { l: "JavaScript", t: "Жабылмаған жақша", c: ["function add(a, b) {", "  return a + b", "}", "console.log(add(2, 3);"], b: 3, w: "Синтаксистік қате: console.log( жақшасы жабылмаған, үшінші «)» жетіспейді.", f: "console.log(add(2, 3));", s: true },
    { l: "JavaScript", t: "NaN шықты", c: ["const price = '12 тг';", "const total = price * 2;", "console.log(total);"], b: 1, w: "'12 тг' таза сан емес, көбейткенде NaN шығады. Алдымен parseInt арқылы санды бөліп алу керек.", f: "const total = parseInt(price) * 2;" },
    { l: "JavaScript", t: "undefined шықты", c: ["const user = { name: 'Aru', age: 17 };", "console.log(user.nam);"], b: 1, w: "Объектте nam қасиеті жоқ, сондықтан undefined шығады. Дұрыс аты name.", f: "console.log(user.name);" },
    { l: "JavaScript", t: "Массив шегі", c: ["const a = [1, 2, 3];", "for (let i = 0; i <= a.length; i++) {", "  console.log(a[i]);", "}"], b: 1, w: "i <= a.length соңғы қадамда a[3] алады, ол жоқ, undefined шығады. Шарт i < a.length болуы керек.", f: "for (let i = 0; i < a.length; i++) {" },
    { l: "JavaScript", t: "Шексіз for", c: ["for (let i = 0; i < 3; i--) {", "  console.log(i);", "}"], b: 0, w: "i азаяды (i--), сондықтан i < 3 шарты әрдайым ақиқат: шексіз цикл. i++ керек.", f: "for (let i = 0; i < 3; i++) {" },
    { l: "JavaScript", t: "Қосу мен жалғау", c: ["const x = '5';", "const y = 3;", "console.log('Қосынды: ' + x + y);"], b: 2, w: "«+» мәтінмен жалғау болады: 'Қосынды: 53' шығады, 8 емес. Санды жақшада есептеп, Number(x) қолдану керек.", f: "console.log('Қосынды: ' + (Number(x) + y));" },
    { l: "JavaScript", t: "Массивтерді салыстыру", c: ["const a = [1, 2];", "const b = [1, 2];", "console.log(a === b ? 'тең' : 'тең емес');"], b: 2, w: "=== массивтерді мәні бойынша емес, сілтемесі бойынша салыстырады: бұл екеуі әртүрлі объект, нәтиже 'тең емес'.", f: "console.log(JSON.stringify(a) === JSON.stringify(b) ? 'тең' : 'тең емес');" },
    { l: "JavaScript", t: "Жебелі функция", c: ["const double = (n) => { n * 2 };", "console.log(double(4));"], b: 0, w: "Фигуралы жақшалы денеде return керек, әйтпесе функция undefined қайтарады.", f: "const double = (n) => { return n * 2; };" },
    { l: "JavaScript", t: "sort() сандарды мәтін ретінде сұрыптайды", c: ["const nums = [10, 9, 1, 100];", "nums.sort();", "console.log(nums);"], b: 1, w: "Әдепкі sort() элементтерді мәтін ретінде салыстырады: [1, 10, 100, 9] шығады. Сандар үшін салыстыру функциясы керек.", f: "nums.sort((a, b) => a - b);" },
    { l: "JavaScript", t: "Қосынды жиналмайды", c: ["let sum = 0;", "for (let i = 1; i <= 5; i++) {", "  sum + i;", "}", "console.log(sum);"], b: 2, w: "«sum + i» мәнді есептейді, бірақ ешқайда сақтамайды, sum 0 күйінде қалады. «+=» керек.", f: "  sum += i;" },
    { l: "JavaScript", t: "Жол өзгермейді", c: ["let s = 'salem';", "s.toUpperCase();", "console.log(s);"], b: 1, w: "Жол әдістері бастапқы жолды өзгертпейді, жаңасын қайтарады. Нәтижені айнымалыға сақтау керек.", f: "s = s.toUpperCase();" },

    // ---------- C ----------
    { l: "C", t: "Нүктелі үтір ұмытылды", c: ['#include <stdio.h>', 'int main(void) {', '    int x = 5', '    printf("%d\\n", x);', '    return 0;', '}'], b: 2, w: "Синтаксистік қате: өрнек соңында «;» жоқ. Компилятор келесі жолға дейін «expected \';\'» дейді.", f: "    int x = 5;", s: true },
    { l: "C", t: "if ішіндегі меншіктеу", c: ['#include <stdio.h>', 'int main(void) {', '    int n = 3;', '    if (n = 5) printf("бес\\n");', '    return 0;', '}'], b: 3, w: "n = 5 мән меншіктейді (n өзгереді де, шарт ақиқат болады). Салыстыру үшін «==» керек.", f: '    if (n == 5) printf("бес\\n");' },
    { l: "C", t: "Массив шегінен шығу", c: ['#include <stdio.h>', 'int main(void) {', '    int a[3] = {1, 2, 3};', '    for (int i = 0; i <= 3; i++) printf("%d\\n", a[i]);', '    return 0;', '}'], b: 3, w: "a[3] массив ауқымынан тыс (дұрыс индекстер 0..2): анықталмаған әрекет, кездейсоқ мән немесе құлау.", f: '    for (int i = 0; i < 3; i++) printf("%d\\n", a[i]);' },
    { l: "C", t: "Жад ағып кетуі", c: ['#include <stdlib.h>', 'int main(void) {', '    int *p = malloc(10 * sizeof(int));', '    p[0] = 1;', '    return 0;', '}'], b: 4, w: "malloc бөлген жад босатылмаған (memory leak). Шығар алдында free(p) шақыру керек.", f: "    free(p);\n    return 0;" },
    { l: "C", t: "scanf-те & жоқ", c: ['#include <stdio.h>', 'int main(void) {', '    int n;', '    scanf("%d", n);', '    printf("%d\\n", n);', '    return 0;', '}'], b: 3, w: "scanf айнымалының адресін сұрайды. «n» орнына «&n» жазылмаса, бағдарлама кездейсоқ жадқа жазып, құлайды.", f: '    scanf("%d", &n);' },
    { l: "C", t: "Буфердің толуы", c: ['#include <string.h>', 'int main(void) {', '    char s[4];', '    strcpy(s, "salem");', '    return 0;', '}'], b: 2, w: "«salem» + '\\0' = 6 байт, ал массив 4 байт: буфер толып, көрші жадты бүлдіреді.", f: "    char s[6];" },
    { l: "C", t: "Бүтін бөлу", c: ['#include <stdio.h>', 'int main(void) {', '    int a = 7, b = 2;', '    float r = a / b;', '    printf("%.1f\\n", r);', '    return 0;', '}'], b: 3, w: "a / b екеуі де int, сондықтан бөлшек кесіледі: 7 / 2 = 3, r = 3.0 болады (3.5 емес). Кем дегенде біреуін float-қа түрлендіру керек.", f: "    float r = (float) a / b;" },
    { l: "C", t: "Жолдарды == арқылы салыстыру", c: ['#include <stdio.h>', '#include <string.h>', 'int main(void) {', '    char a[] = "kz";', '    if (a == "kz") printf("тең\\n");', '    return 0;', '}'], b: 4, w: "== жол мәнін емес, жад адрестерін салыстырады. Жолдарды strcmp арқылы салыстыру керек (0 қайтарса, тең).", f: '    if (strcmp(a, "kz") == 0) printf("тең\\n");' },
    { l: "C", t: "switch-те break жоқ", c: ['#include <stdio.h>', 'int main(void) {', '    int d = 1;', '    switch (d) {', '        case 1: printf("Дүйсенбі\\n");', '        case 2: printf("Сейсенбі\\n"); break;', '    }', '    return 0;', '}'], b: 4, w: "case 1 соңында break жоқ, сондықтан бағдарлама case 2-ге «құлап» кетеді: екі жол да шығады.", f: '        case 1: printf("Дүйсенбі\\n"); break;' },
    { l: "C", t: "Инициализацияланбаған айнымалы", c: ['#include <stdio.h>', 'int main(void) {', '    int sum;', '    for (int i = 1; i <= 3; i++) sum += i;', '    printf("%d\\n", sum);', '    return 0;', '}'], b: 2, w: "sum-ға бастапқы мән берілмеген, онда кездейсоқ «қоқыс» мән жатыр. Қосындыны 0-ден бастау керек.", f: "    int sum = 0;" },
    { l: "C", t: "malloc көлемі қате", c: ['#include <stdlib.h>', 'int main(void) {', '    int *a = malloc(10);', '    for (int i = 0; i < 10; i++) a[i] = i;', '    free(a);', '    return 0;', '}'], b: 2, w: "malloc(10) тек 10 байт береді, ал 10 int үшін 40 байт (10 * sizeof(int)) керек. Жазу бөлінген жадтан асып кетеді.", f: "    int *a = malloc(10 * sizeof(int));" },
    { l: "C", t: "Қос free", c: ['#include <stdlib.h>', 'int main(void) {', '    int *p = malloc(sizeof(int));', '    free(p);', '    free(p);', '    return 0;', '}'], b: 4, w: "Бір жадты екі рет босату (double free) бағдарламаны құлатады. Қайталанған free(p) жолын алып тастау керек.", f: "" },

    // ---------- C++ ----------
    { l: "C++", t: "Нүктелі үтір ұмытылды", c: ["#include <iostream>","using namespace std;","int main() {","    int age = 17","    cout << age << \"\\n\";","    return 0;","}"], b: 3, w: "Синтаксистік қате: «int age = 17» жолының соңында «;» жоқ. g++ «expected ',' or ';' before 'cout'» деп хабарлайды, бағдарлама компиляцияланбайды.", f: "    int age = 17;", s: true },
    { l: "C++", t: "struct соңындағы нүктелі үтір", c: ["#include <iostream>","using namespace std;","struct Nuqta {","    int x, y;","}","int main() {","    Nuqta p{3, 4};","    cout << p.x + p.y << \"\\n\";","}"], b: 4, w: "Синтаксистік қате: struct (және class) анықтамасының жабылатын «}» жақшасынан кейін «;» міндетті. Онсыз компилятор келесі жолдағы «int main» бөлігін struct-тың жалғасы деп оқиды.", f: "};", s: true },
    { l: "C++", t: "Шарттағы меншіктеу", c: ["#include <iostream>","using namespace std;","int main() {","    int price = 500;","    if (price = 1000) cout << \"қымбат\\n\";","    else cout << \"арзан\\n\";","    cout << price << \"\\n\";","}"], b: 4, w: "Логикалық қате: «price = 1000» мән меншіктейді (price өзгереді де, 0-ден өзге мән шарт ретінде ақиқат болады). Бағдарлама «қымбат» басады және price-ты 1000 етіп жібереді. Салыстыру үшін «==» керек.", f: "    if (price == 1000) cout << \"қымбат\\n\";" },
    { l: "C++", t: "vector индексінің шекарасы", c: ["#include <iostream>","#include <vector>","using namespace std;","int main() {","    vector<int> sandar = {4, 8, 15};","    int s = 0;","    for (size_t i = 0; i <= sandar.size(); i++) s += sandar[i];","    cout << s << \"\\n\";","}"], b: 6, w: "Шекара қатесі: 3 элементтің индекстері 0, 1, 2. «i <= size()» соңғы қадамда sandar[3] оқиды. operator[] шекті тексермейді, сондықтан қате үнсіз өтіп, нәтиже кездейсоқ болады (анықталмаған әрекет). Шарт «i < size()» болуы керек.", f: "    for (size_t i = 0; i < sandar.size(); i++) s += sandar[i];" },
    { l: "C++", t: "Бүтін бөлу", c: ["#include <iostream>","using namespace std;","int main() {","    int a = 7, b = 8;","    double orta = (a + b) / 2;","    cout << orta << \"\\n\";","}"], b: 4, w: "Логикалық қате: (a + b) және 2 екеуі де int, сондықтан бөлу бүтін сандармен орындалып, 15 / 2 = 7 болады, нәтиже double-ға 7 болып түседі (7.5 емес). Бөлгіштердің бірін 2.0 ету керек.", f: "    double orta = (a + b) / 2.0;" },
    { l: "C++", t: "Тоқтамайтын цикл", c: ["#include <iostream>","using namespace std;","int main() {","    int n = 20;","    while (n != 0) {","        cout << n << \" \";","        n -= 3;","    }","}"], b: 4, w: "Шексіз цикл: n = 20, 17, 14, ... 2, -1, -4 ... болып азаяды, ешқашан дәл 0 болмайды. «!= 0» шарты әрдайым ақиқат. Шартты «n > 0» етіп жазу керек.", f: "    while (n > 0) {" },
    { l: "C++", t: "new[] және delete", c: ["#include <iostream>","using namespace std;","int main() {","    int* a = new int[5]{1, 2, 3, 4, 5};","    cout << a[4] << \"\\n\";","    delete a;","    return 0;","}"], b: 5, w: "Жадты босату қатесі: new[] арқылы алынған массивті delete[] арқылы босату керек. Жай delete қолдану анықталмаған әрекет (alloc-dealloc-mismatch): жад менеджері бүлінуі мүмкін.", f: "    delete[] a;" },
    { l: "C++", t: "Жад ағып кетуі", c: ["#include <iostream>","using namespace std;","int* jasa(int v) {","    return new int(v);","}","int main() {","    int* p = jasa(5);","    cout << *p << \"\\n\";","    p = jasa(7);","    cout << *p << \"\\n\";","    delete p;","}"], b: 8, w: "Жад ағып кетеді (memory leak): p-ға жаңа адрес берілген сәтте бірінші блоктың (5) жалғыз адресі жоғалады, оны енді delete ету мүмкін емес. Жаңа мән беру алдында ескі блокты босату керек.", f: "    delete p;\n    p = jasa(7);" },
    { l: "C++", t: "Босатылған жадты оқу", c: ["#include <iostream>","using namespace std;","int main() {","    int* p = new int(42);","    delete p;","    cout << \"Мән: \" << *p << \"\\n\";","    return 0;","}"], b: 5, w: "Dangling pointer: delete p орындалғаннан кейін p босатылған жадты көрсетіп тұр, оны оқу анықталмаған әрекет (use-after-free). Кейде 42 шығады, кейде қоқыс немесе құлау. Мәнді босатудан бұрын оқу керек.", f: "" },
    { l: "C++", t: "nullptr арқылы өту", c: ["#include <iostream>","using namespace std;","struct Tugin { int mani; Tugin* kelesi; };","int main() {","    Tugin a{1, nullptr};","    Tugin* p = &a;","    cout << p->mani << \"\\n\";","    p = p->kelesi;","    cout << p->mani << \"\\n\";","}"], b: 8, w: "Нөлдік көрсеткішті оқу: a.kelesi == nullptr, сондықтан p = p->kelesi соң p ештеңеге көрсетпейді, p->mani бағдарламаны құлатады (segmentation fault). Алдымен p-ның nullptr емесін тексеру керек.", f: "    if (p) cout << p->mani << \"\\n\";" },
    { l: "C++", t: "Инициализацияланбаған айнымалы", c: ["#include <iostream>","using namespace std;","int main() {","    int sum;","    for (int i = 1; i <= 4; i++) sum += i;","    cout << sum << \"\\n\";","}"], b: 3, w: "Логикалық қате: sum-ға бастапқы мән берілмеген, онда алдыңғы бағдарламадан қалған кездейсоқ «қоқыс» жатыр. Қосындыны әрдайым 0-ден бастау керек. Компилятор -Wall кезінде «may be used uninitialized» деп ескертеді.", f: "    int sum = 0;" },
    { l: "C++", t: "Жолдарды + арқылы қосу", c: ["#include <iostream>","#include <string>","using namespace std;","int main() {","    string at = \"Aru\";","    string sozder = \"Сәлем, \" + \"Aru\" + \"!\";","    cout << sozder << \" \" << at << \"\\n\";","}"], b: 5, w: "Синтаксис/түр қатесі: екі жол литералын (const char[]) «+» арқылы қосуға болмайды, «+» тек std::string-ке қолданылады. Біреуін std::string-ке айналдыру керек.", f: "    string sozder = string(\"Сәлем, \") + at + \"!\";", s: true },
    { l: "C++", t: "Көшірмені өзгерту", c: ["#include <iostream>","#include <vector>","using namespace std;","int main() {","    vector<int> baga = {100, 200, 300};","    for (auto b : baga) b += 50;","    for (int b : baga) cout << b << \" \";","}"], b: 5, w: "Логикалық қате: «auto b» әр элементтің КӨШІРМЕСІН алады, көшірмені өзгерту векторға әсер етпейді. Нәтиже 100 200 300 күйінде қалады. Түпнұсқаны өзгерту үшін сілтеме керек: auto&.", f: "    for (auto& b : baga) b += 50;" },
    { l: "C++", t: "swap көшірмемен жұмыс істейді", c: ["#include <iostream>","using namespace std;","void ayyr(int a, int b) {","    int t = a; a = b; b = t;","}","int main() {","    int x = 1, y = 2;","    ayyr(x, y);","    cout << x << \" \" << y << \"\\n\";","}"], b: 2, w: "Логикалық қате: параметрлер мән бойынша беріледі, ayyr ішінде a мен b — x пен y-тің көшірмелері. Орын ауыстыру нәтижесі main-ге жетпейді: 1 2 болып қалады. Параметрлерді сілтеме (int&) ету керек.", f: "void ayyr(int& a, int& b) {" },

    // ---------- Java ----------
    { l: "Java", t: "Нүктелі үтір ұмытылды", c: ["public class Main {","    public static void main(String[] args) {","        String city = \"Астана\"","        System.out.println(city);","    }","}"], b: 2, w: "Синтаксистік қате: «String city = ...» жолының соңында «;» жоқ. javac «';' expected» деп хабарлайды, бағдарлама компиляцияланбайды.", f: "        String city = \"Астана\";", s: true },
    { l: "Java", t: "return жоқ", c: ["public class Main {","    static int kvadrat(int n) {","        int r = n * n;","    }","    public static void main(String[] args) {","        System.out.println(kvadrat(6));","    }","}"], b: 3, w: "Компиляция қатесі: kvadrat әдісі int қайтаруға уәде берген, бірақ return жоқ. javac «missing return statement» дейді. Нәтижені қайтару керек.", f: "        return r;\n    }", s: true },
    { l: "Java", t: "Шарттағы меншіктеу", c: ["public class Main {","    public static void main(String[] args) {","        int x = 3;","        if (x = 5) {","            System.out.println(\"бес\");","        }","    }","}"], b: 3, w: "Түр қатесі: Java-да if шарты тек boolean болуы керек, ал «x = 5» int береді. javac «incompatible types: int cannot be converted to boolean» дейді (C++-тен айырмасы). Салыстыру үшін «==» керек.", f: "        if (x == 5) {", s: true },
    { l: "Java", t: "Жолдарды == арқылы салыстыру", c: ["public class Main {","    public static void main(String[] args) {","        String a = new String(\"қазақ\");","        String b = \"қазақ\";","        if (a == b) System.out.println(\"тең\");","        else System.out.println(\"тең емес\");","    }","}"], b: 4, w: "Логикалық қате: объектілер үшін == мәнді емес, сілтемені (жадтағы орынды) салыстырады. new String(...) жаңа объект жасайды, сондықтан a == b жалған, 'тең емес' шығады. Мазмұнды салыстыру үшін equals() керек.", f: "        if (a.equals(b)) System.out.println(\"тең\");" },
    { l: "Java", t: "Map-тен null алу", c: ["import java.util.*;","public class Main {","    public static void main(String[] args) {","        Map<String, Integer> baga = new HashMap<>();","        baga.put(\"алма\", 300);","        int s = baga.get(\"өрік\");","        System.out.println(s);","    }","}"], b: 5, w: "NullPointerException: кілт «өрік» картада жоқ, get() null қайтарады, ал null-ды int-ке автоматты ашу (unboxing) NPE тудырады. getOrDefault арқылы әдепкі мән беру керек.", f: "        int s = baga.getOrDefault(\"өрік\", 0);" },
    { l: "Java", t: "Массив шекарасы", c: ["public class Main {","    public static void main(String[] args) {","        int[] a = {5, 10, 15};","        int s = 0;","        for (int i = 0; i <= a.length; i++) s += a[i];","        System.out.println(s);","    }","}"], b: 4, w: "ArrayIndexOutOfBoundsException: 3 элементтің индекстері 0..2, ал «i <= a.length» i = 3 болғанда a[3] оқиды. Java C++-тен өзгеше шекті тексеріп, бағдарламаны ерекше жағдаймен тоқтатады. Шарт «i < a.length» болуы керек.", f: "        for (int i = 0; i < a.length; i++) s += a[i];" },
    { l: "Java", t: "Айналу кезінде жою", c: ["import java.util.*;","public class Main {","    public static void main(String[] args) {","        List<Integer> baga = new ArrayList<>(List.of(5, 2, 4, 2, 5));","        for (Integer b : baga) {","            if (b < 3) baga.remove(b);","        }","        System.out.println(baga);","    }","}"], b: 5, w: "ConcurrentModificationException: for-each циклі тізімді аралап жүргенде тізімнің өзін өзгертуге (remove) болмайды. Мұндайда removeIf немесе Iterator.remove() қолданылады (бұл түзету бүкіл for циклін ауыстырады).", f: "        baga.removeIf(b -> b < 3);" },
    { l: "Java", t: "Бүтін бөлу", c: ["public class Main {","    public static void main(String[] args) {","        int m1 = 4, m2 = 5;","        double orta = (m1 + m2) / 2;","        System.out.println(orta);","    }","}"], b: 3, w: "Логикалық қате: (m1 + m2) / 2 екеуі де int, сондықтан бөлу бүтін: 9 / 2 = 4, ол тек соңынан double-ға 4.0 болып түседі (4.5 емес). Бөлгіш 2.0 болуы керек.", f: "        double orta = (m1 + m2) / 2.0;" },
    { l: "Java", t: "i = i++", c: ["public class Main {","    public static void main(String[] args) {","        int i = 0;","        while (i < 3) {","            System.out.println(\"Қадам \" + i);","            i = i++;","        }","    }","}"], b: 5, w: "Шексіз цикл: «i = i++» алдымен ескі i мәнін (0) есте сақтайды, i-ны 1 етеді, сосын ескі мәнді (0) i-ға қайта жазады. i ешқашан өспейді. Жай «i++;» жазу керек.", f: "            i++;" },
    { l: "Java", t: "Integer-ді == арқылы салыстыру", c: ["public class Main {","    public static void main(String[] args) {","        Integer a = 1000, b = 1000;","        if (a == b) System.out.println(\"тең\");","        else System.out.println(\"тең емес\");","    }","}"], b: 3, w: "Логикалық қате: Integer — объект. == сілтемені салыстырады, ал Java тек -128..127 аралығындағы мәндерді қайта қолданады, 1000 үшін екі бөлек объект жасалады. Нәтиже 'тең емес'. equals() қолдану керек.", f: "        if (a.equals(b)) System.out.println(\"тең\");" },
    { l: "Java", t: "Жол өзгермейді", c: ["public class Main {","    public static void main(String[] args) {","        String ism = \"aruzhan\";","        ism.toUpperCase();","        System.out.println(ism);","    }","}"], b: 3, w: "Логикалық қате: String өзгермейтін (immutable) объект. toUpperCase() жаңа жол қайтарады, ал ism өзгермейді; нәтиже жоғалып кетеді. Нәтижені айнымалыға сақтау керек.", f: "        ism = ism.toUpperCase();" },
    { l: "Java", t: "switch-те break жоқ", c: ["public class Main {","    public static void main(String[] args) {","        int kun = 1;","        switch (kun) {","            case 1: System.out.println(\"Дүйсенбі\");","            case 2: System.out.println(\"Сейсенбі\"); break;","            default: System.out.println(\"?\");","        }","    }","}"], b: 4, w: "Логикалық қате: case 1 соңында break жоқ, сондықтан орындалу келесі case 2-ге «құлап» түседі: екі жол да шығады. Әр case соңында break керек.", f: "            case 1: System.out.println(\"Дүйсенбі\"); break;" },
    { l: "Java", t: "Инициализацияланбаған айнымалы", c: ["public class Main {","    public static void main(String[] args) {","        int jinaq;","        for (int i = 1; i <= 4; i++) jinaq += i;","        System.out.println(jinaq);","    }","}"], b: 2, w: "Компиляция қатесі: Java жергілікті айнымалыға әдепкі мән бермейді. javac «variable jinaq might not have been initialized» дейді (C++-те бұл тек ескерту). Алдымен 0 беру керек.", f: "        int jinaq = 0;", s: true },
    { l: "Java", t: "remove(int) пен remove(Object)", c: ["import java.util.*;","public class Main {","    public static void main(String[] args) {","        List<Integer> sandar = new ArrayList<>(List.of(10, 20, 30, 1));","        sandar.remove(1);","        System.out.println(sandar);","    }","}"], b: 4, w: "Логикалық қате: List<Integer> үшін remove(1) санды емес, 1-ИНДЕКСТЕГІ элементті (20) жояды: [10, 30, 1]. Мәні 1 элементті жою үшін remove(Integer.valueOf(1)) керек.", f: "        sandar.remove(Integer.valueOf(1));" },
  ];

  /* =========================================================
     3) CODE BATTLE: [тақырып, сұрақ, код, [4 нұсқа], дұрыс индекс, run?]
     run: "py" | "js" | "c" | "cpp" | "java" - код орындалып, нәтижесі дұрыс жауапқа тең екені тексеріледі.
     ========================================================= */
  const QUIZ = [
    // Python
    ["Python", "Python-да тізімнің ұзындығын қай функция қайтарады?", "", ["len()", "size()", "count()", "length()"], 0],
    ["Python", "Нәтижесі қандай?", "print(type(3.0))", ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'double'>"], 1, "py"],
    ["Python", "Нәтижесі қандай?", "print(10 // 3)", ["3", "3.33", "4", "1"], 0, "py"],
    ["Python", "Нәтижесі қандай?", "print('a' * 3)", ["aaa", "a3", "a a a", "Қате"], 0, "py"],
    ["Python", "Нәтижесі қандай?", "x = [1, 2, 3]\nx.append(4)\nprint(len(x))", ["3", "4", "5", "Қате"], 1, "py"],
    ["Python", "Python-да түсініктеме (комментарий) қалай басталады?", "", ["#", "//", "--", "/*"], 0],
    ["Python", "Нәтижесі қандай?", "print(bool(''))", ["True", "False", "None", "Қате"], 1, "py"],
    ["Python", "Нәтижесі қандай?", "print('Python'[0])", ["P", "y", "n", "Python"], 0, "py"],
    ["Python", "Нәтижесі қандай?", "print(2 ** 3 ** 2)", ["64", "512", "36", "256"], 1, "py"],
    ["Python", "Қай деректер түрі өзгермейтін (immutable)?", "", ["tuple", "list", "dict", "set"], 0],
    ["Python", "Нәтижесі қандай?", "for i in range(2, 8, 2):\n    print(i, end=' ')", ["2 4 6", "2 4 6 8", "0 2 4 6", "2 3 4 5 6 7"], 0, "py"],
    ["Python", "Нәтижесі қандай?", "d = {'a': 1}\nprint(d.get('b', 0))", ["0", "None", "KeyError", "b"], 0, "py"],
    ["Python", "Нәтижесі қандай?", "print('a-b-c'.split('-'))", ["['a', 'b', 'c']", "['a-b-c']", "a b c", "('a', 'b', 'c')"], 0, "py"],
    ["Python", "Python-да «==» операторы не істейді?", "", ["Мәндерді салыстырады", "Мән меншіктейді", "Жадты тазартады", "Түрді өзгертеді"], 0],
    ["Python", "Нәтижесі қандай?", "print(len({1, 2, 2, 3}))", ["4", "3", "2", "Қате"], 1, "py"],
    ["Python", "Нәтижесі қандай?", "print(not True or True)", ["True", "False", "None", "Қате"], 0, "py"],
    ["Python", "Функцияны жариялайтын кілт сөз қайсы?", "", ["def", "func", "function", "define"], 0],
    ["Python", "Нәтижесі қандай?", "print([1, 2, 3][-2])", ["1", "2", "3", "Қате"], 1, "py"],
    ["Python", "Нәтижесі қандай?", "s = 'abc'\nprint(s[1:])", ["bc", "ab", "abc", "b"], 0, "py"],
    // C
    ["C", "C-де бүтін сан типі қалай аталады?", "", ["int", "integer", "number", "num"], 0],
    ["C", "printf-те бүтін санға арналған форматтауыш қайсы?", "", ["%d", "%s", "%f", "%c"], 0],
    ["C", "Нәтижесі қандай?", 'printf("%d", 7 / 2);', ["3", "3.5", "4", "3.0"], 0, "c"],
    ["C", "C-де жол (string) қай символмен аяқталады?", "", ["'\\0'", "'\\n'", "бос орын", "EOF"], 0],
    ["C", "Айнымалының адресін алатын оператор қайсы?", "", ["&", "*", "->", "#"], 0],
    ["C", "Нәтижесі қандай?", 'int a[] = {4, 5, 6};\nprintf("%d", a[2]);', ["4", "5", "6", "Қате"], 2, "c"],
    ["C", "malloc жадты қайдан бөледі?", "", ["Үйме (heap)", "Стек", "Процессор регистрі", "Дискіден"], 0],
    ["C", "«#include <stdio.h>» не үшін керек?", "", ["printf сияқты кіріс-шығыс функциялары үшін", "malloc және free үшін", "strcpy, strlen үшін", "sqrt, pow үшін"], 0],
    ["C", "Нәтижесі қандай?", 'int x = 5;\nint *p = &x;\n*p = 9;\nprintf("%d", x);', ["5", "9", "x-тің адресі", "Қате"], 1, "c"],
    ["C", "Нәтижесі қандай?", 'printf("%d", 5 % 3);', ["1", "2", "1.66", "0"], 1, "c"],
    ["C", "C-де массив индексі қайдан басталады?", "", ["0-ден", "1-ден", "-1-ден", "Өзің таңдайсың"], 0],
    ["C", "Нәтижесі қандай?", 'for (int i = 0; i < 3; i++) printf("%d", i);', ["012", "123", "0123", "12"], 0, "c"],
    ["C", "malloc бөлген жадты босату үшін не қолданылады?", "", ["free()", "delete", "release()", "clear()"], 0],
    ["C", "Нәтижесі қандай?", 'char s[] = "hi";\nprintf("%d", (int) sizeof(s));', ["2", "3", "4", "8"], 1, "c"],
    ["C", "Нәтижесі қандай?", "printf(\"%c\", 'a' + 1);", ["a", "b", "98", "Қате"], 1, "c"],
    // JavaScript
    ["JavaScript", "JavaScript-те мәні өзгермейтін айнымалы қалай жарияланады?", "", ["const", "final", "let", "static"], 0],
    ["JavaScript", "Нәтижесі қандай?", "console.log(typeof null)", ["object", "null", "undefined", "number"], 0, "js"],
    ["JavaScript", "Нәтижесі қандай?", "console.log(0.1 + 0.2 === 0.3)", ["true", "false", "undefined", "Қате"], 1, "js"],
    ["JavaScript", "Нәтижесі қандай?", "console.log('5' + 3)", ["8", "53", "5 3", "Қате"], 1, "js"],
    ["JavaScript", "Нәтижесі қандай?", "console.log('5' - 3)", ["2", "53", "NaN", "Қате"], 0, "js"],
    ["JavaScript", "Нәтижесі қандай?", "console.log([1, 2, 3].map(x => x * 2))", ["[ 2, 4, 6 ]", "[ 1, 2, 3 ]", "6", "[ 2, 4 ]"], 0, "js"],
    ["JavaScript", "«===» мен «==» айырмашылығы неде?", "", ["=== мәнмен бірге түрін де салыстырады", "=== түрін түрлендіріп салыстырады", "Айырмашылық жоқ", "=== тек сандарға жұмыс істейді"], 0],
    ["JavaScript", "Нәтижесі қандай?", "console.log(typeof undefined)", ["undefined", "object", "null", "string"], 0, "js"],
    ["JavaScript", "id бойынша элементті табатын DOM әдісі қайсы?", "", ["document.getElementById", "document.findId", "document.byId", "window.id"], 0],
    ["JavaScript", "Нәтижесі қандай?", "console.log([10, 9, 1].sort())", ["[ 1, 9, 10 ]", "[ 1, 10, 9 ]", "[ 10, 9, 1 ]", "[ 9, 10, 1 ]"], 1, "js"],
    ["JavaScript", "Нәтижесі қандай?", "console.log(Boolean('0'))", ["true", "false", "0", "Қате"], 0, "js"],
    ["JavaScript", "Массивтің соңына элемент қосатын әдіс қайсы?", "", ["push", "pop", "shift", "add"], 0],
    ["JavaScript", "Нәтижесі қандай?", "console.log(parseInt('42px'))", ["42", "NaN", "42px", "0"], 0, "js"],
    ["JavaScript", "Нәтижесі қандай?", "const o = { a: 1 };\nconsole.log(o.b)", ["undefined", "null", "0", "Қате"], 0, "js"],
    ["JavaScript", "Нәтижесі қандай?", "console.log(Number('abc'))", ["NaN", "0", "undefined", "null"], 0, "js"],
    // HTML/CSS
    ["HTML/CSS", "HTML-де ең үлкен тақырып тегі қайсы?", "", ["<h1>", "<h6>", "<head>", "<header>"], 0],
    ["HTML/CSS", "Сілтеме жасайтын HTML тегі қайсы?", "", ["<a>", "<link>", "<href>", "<url>"], 0],
    ["HTML/CSS", "Суретті бетке шығаратын тег қайсы?", "", ["<img>", "<image>", "<pic>", "<src>"], 0],
    ["HTML/CSS", "CSS-те мәтін түсін өзгертетін қасиет қайсы?", "", ["color", "text-color", "font-color", "fgcolor"], 0],
    ["HTML/CSS", "Flexbox-та элементтерді көлденең ортаға қоятын қасиет қайсы?", "", ["justify-content: center", "text-align: flex", "float: center", "position: middle"], 0],
    ["HTML/CSS", "CSS-те класс селекторы қалай жазылады?", "", [".name", "#name", "*name", "@name"], 0],
    ["HTML/CSS", "CSS-те padding не білдіреді?", "", ["Элемент мазмұны мен шекара арасындағы ішкі бос орын", "Элементтен тыс бос орын", "Шекара қалыңдығы", "Фон түсі"], 0],
    ["HTML/CSS", "CSS-те «#main» нені таңдайды?", "", ["id=\"main\" элементін", "class=\"main\" элементтерін", "<main> тегін", "Барлық элементті"], 0],
    ["HTML/CSS", "Нөмірленбеген тізімнің тегі қайсы?", "", ["<ul>", "<ol>", "<dl>", "<li>"], 0],
    ["HTML/CSS", "Мобильді құрылғыға бейімдеу үшін <head> ішіне қай тегті қосады?", "", ["<meta name=\"viewport\" ...>", "<meta name=\"mobile\" ...>", "<meta charset=\"utf-8\">", "<link rel=\"mobile\">"], 0],
    ["HTML/CSS", "Пайдаланушы деректерін жинайтын HTML тегі қайсы?", "", ["<form>", "<send>", "<table>", "<span>"], 0],
    ["HTML/CSS", "«display: none» не істейді?", "", ["Элементті көрсетпейді және орын алмайды", "Тек мөлдір етеді, орны қалады", "Қызыл түске бояйды", "Ортаға қояды"], 0],
    ["HTML/CSS", "«<a target=\"_blank\">» не істейді?", "", ["Сілтемені жаңа бетте ашады", "Сілтемені өшіреді", "Бетті жаңартады", "Мәтінді қарайтады"], 0],
    // SQL
    ["SQL", "Кестеден барлық жолды таңдау үшін қай жазба дұрыс?", "", ["SELECT * FROM t;", "GET ALL t;", "SHOW t;", "PICK * FROM t;"], 0],
    ["SQL", "Нәтижені шартпен сүзетін кілт сөз қайсы?", "", ["WHERE", "FILTER", "IF", "ONLY"], 0],
    ["SQL", "Нәтижені өсу ретімен сұрыптау қалай жазылады?", "", ["ORDER BY x ASC", "SORT BY x", "GROUP BY x", "ARRANGE x"], 0],
    ["SQL", "COUNT(*) нені қайтарады?", "", ["Жолдар санын", "Бағандар санын", "Ең үлкен мәнді", "Қосындыны"], 0],
    ["SQL", "Кестеге жаңа жол қосатын команда қайсы?", "", ["INSERT INTO", "ADD ROW", "APPEND", "PUT"], 0],
    ["SQL", "Екі кестені байланыстыратын кілт сөз қайсы?", "", ["JOIN", "LINK", "CONNECT", "MERGE"], 0],
    ["SQL", "WHERE шартынсыз UPDATE жазсаң не болады?", "", ["Барлық жолдар жаңарады", "Ештеңе болмайды", "Тек бірінші жол жаңарады", "Тек соңғы жол жаңарады"], 0],
    ["SQL", "Қайталанатын мәндерді алып тастайтын кілт сөз қайсы?", "", ["DISTINCT", "UNIQUEONLY", "SINGLE", "DIFF"], 0],
    ["SQL", "Жолдарды топтау үшін не қолданылады?", "", ["GROUP BY", "SPLIT BY", "CLUSTER", "SORT BY"], 0],
    ["SQL", "PRIMARY KEY не үшін қажет?", "", ["Әр жолды бірегей анықтау үшін", "Жолды жасыру үшін", "Кестені өшіру үшін", "Мәтінді қысқарту үшін"], 0],
    ["SQL", "LIKE 'A%' нені табады?", "", ["A әрпінен басталатын мәндерді", "A әрпімен аяқталатын мәндерді", "Тек «A» мәнін", "A әрпі жоқ мәндерді"], 0],
    ["SQL", "Кестені құрылымымен бірге толық жоятын команда қайсы?", "", ["DROP TABLE t;", "DELETE FROM t;", "CLEAR TABLE t;", "REMOVE t;"], 0],
    ["SQL", "AVG(price) нені есептейді?", "", ["price бағанының орташа мәнін", "Ең жоғары бағаны", "Жолдар санын", "Бағаның қосындысын"], 0],
    // Алгоритмдер
    ["Алгоритм", "Екілік іздеудің уақыт күрделілігі қандай?", "", ["O(log n)", "O(n)", "O(n²)", "O(1)"], 0],
    ["Алгоритм", "Екілік іздеу қолданылу үшін массив қандай болуы керек?", "", ["Сұрыпталған", "Тек сандардан тұратын", "Ұзындығы жұп", "Қайталанбайтын"], 0],
    ["Алгоритм", "Сызықтық іздеудің ең нашар жағдайындағы күрделілігі?", "", ["O(n)", "O(log n)", "O(1)", "O(n²)"], 0],
    ["Алгоритм", "Қарапайым «көпіршікті» сұрыптаудың ең нашар күрделілігі?", "", ["O(n²)", "O(n)", "O(log n)", "O(1)"], 0],
    ["Алгоритм", "Стек қандай қағидамен жұмыс істейді?", "", ["LIFO: соңғы кірген бірінші шығады", "FIFO: бірінші кірген бірінші шығады", "Кездейсоқ тәртіппен", "Өсу ретімен"], 0],
    ["Алгоритм", "Кезек (queue) қандай қағидамен жұмыс істейді?", "", ["FIFO: бірінші кірген бірінші шығады", "LIFO: соңғы кірген бірінші шығады", "Кездейсоқ тәртіппен", "Кему ретімен"], 0],
    ["Алгоритм", "Рекурсиядағы базалық жағдай (base case) не үшін қажет?", "", ["Рекурсияны тоқтату үшін", "Жылдамдату үшін", "Жадты босату үшін", "Қатені жасыру үшін"], 0],
    ["Алгоритм", "Массивтегі ең үлкен санды табудың күрделілігі?", "", ["O(n)", "O(1)", "O(log n)", "O(n²)"], 0],
    ["Алгоритм", "Хэш-кестеде элементті іздеудің орташа күрделілігі?", "", ["O(1)", "O(n)", "O(log n)", "O(n²)"], 0],
    ["Алгоритм", "Фибоначчи тізбегі 0, 1, 1, 2, 3, 5, ... болса, 8-ші мүше (бірінші мүше 0) нешеге тең?", "", ["8", "13", "21", "11"], 1],
    ["Алгоритм", "Біріктіру арқылы сұрыптаудың (merge sort) күрделілігі?", "", ["O(n log n)", "O(n²)", "O(n)", "O(log n)"], 0],
    ["Алгоритм", "Графты тереңдікке (DFS) бірінші аралау үшін қандай құрылым қолданылады?", "", ["Стек (немесе рекурсия)", "Кезек", "Хэш-кесте", "Екілік жиым"], 0],
    // Терминология
    ["Терминология", "Компилятор не істейді?", "", ["Бастапқы кодты машиналық кодқа аударады", "Кодты жолма-жол интерпретациялайды", "Кодты тек сақтайды", "Интернетке жібереді"], 0],
    ["Терминология", "Бағдарламалау тілінде «баг» (bug) деген не?", "", ["Бағдарламадағы қате", "Жаңа функция", "Компилятор түрі", "Айнымалы түрі"], 0],
    ["Терминология", "API деген не?", "", ["Бағдарламалар бір-бірімен сөйлесетін интерфейс", "Бағдарламалау тілі", "Операциялық жүйе", "Деректер қоры түрі"], 0],
    ["Терминология", "Git-те commit не?", "", ["Өзгерістердің сақталған суреті (нұсқасы)", "Репозиторийді өшіру", "Желіге қосылу", "Тармақты жою"], 0],
    ["Терминология", "1 байт неше битке тең?", "", ["8", "4", "16", "10"], 0],
    ["Терминология", "Екілік 101 санының ондық мәні қандай?", "", ["5", "3", "6", "7"], 0],
    ["Терминология", "HTTP 404 коды нені білдіреді?", "", ["Бет табылмады", "Сәтті жауап", "Сервер қатесі", "Рұқсат жоқ"], 0],
    ["Терминология", "RAM нені білдіреді?", "", ["Бағдарлама жұмыс кезінде қолданатын жедел жады", "Тұрақты сақтау диск", "Процессордың түрі", "Желі картасы"], 0],
    ["Терминология", "Debugger не үшін қажет?", "", ["Бағдарламаны қадамдап орындап, қатені табу үшін", "Кодты бояу үшін", "Желіні жылдамдату үшін", "Файлдарды қысу үшін"], 0],
    ["Терминология", "Ашық бастапқы код (open source) дегеніміз не?", "", ["Коды барлығына ашық, оқуға болатын бағдарлама", "Тек тегін ойын", "Интернетсіз бағдарлама", "Қорғалған бағдарлама"], 0],
    ["Терминология", "Шифрлау (encryption) не үшін қолданылады?", "", ["Деректерді рұқсатсыз оқудан қорғау үшін", "Файлды жылдамдату үшін", "Суретті үлкейту үшін", "Кодты қысқарту үшін"], 0],
    ["Терминология", "Айнымалы (variable) деген не?", "", ["Мәнді сақтайтын аты бар жад орны", "Қайталанатын цикл", "Функцияның аты", "Түсініктеме"], 0],
    // C++
    ["C++", "C++ консольге мәтін шығаратын стандартты ағын қайсы?", "", ["std::cout","std::cin","std::endl","std::string"], 0],
    ["C++", "Көрсеткіштің ештеңеге бағытталмағанын көрсететін заманауи (C++11) мән қайсы?", "", ["nullptr","null","None","void"], 0],
    ["C++", "new int(5) арқылы жасалған жадты қалай босатады?", "", ["delete p;","delete[] p;","free(p);","p = nullptr;"], 0],
    ["C++", "new int[10] арқылы алынған массивті қалай дұрыс босатады?", "", ["delete[] a;","delete a;","a = nullptr;","free(a);"], 0],
    ["C++", "Сілтеме (int& r = x) мен көрсеткіштің (int* p = &x) басты айырмасы қандай?", "", ["Сілтеме міндетті түрде бастапқы мәнмен жасалады, кейін басқа нысанға бұрылмайды және nullptr бола алмайды","Сілтеме жадта орын алмайды, көрсеткіш алады","Көрсеткішті бұруға болмайды, сілтемені бұруға болады","Екеуінің арасында айырма жоқ"], 0],
    ["C++", "std::vector<int> v-ға соңынан жаңа сан қосатын әдіс қайсы?", "", ["v.push_back(x)","v.append(x)","v.add(x)","v.insert_end(x)"], 0],
    ["C++", "RAII деген не?", "", ["Ресурсты объект құрылғанда алып, жойылғанда (деструкторда) автоматты қайтару принципі","Жадты қолмен тазалау әдісі","Жылдам сұрыптау алгоритмі","Көп ағынды бағдарлама стилі"], 0],
    ["C++", "std::unique_ptr-дың негізгі қасиеті қандай?", "", ["Нысанның жалғыз иесі бар, көшірілмейді, иесі жойылғанда delete автоматты шақырылады","Нысанды ешқашан жоймайды","Көптеген иелері болуы мүмкін","Тек массивтермен жұмыс істейді"], 0],
    ["C++", "«int* const p = &x;» жазуы нені білдіреді?", "", ["Көрсеткіштің өзі тұрақты (басқа адреске бұруға болмайды), бірақ *p арқылы мәнді өзгертуге болады","Көрсеткіш көрсететін мән тұрақты, көрсеткішті бұруға болады","Екеуі де тұрақты емес","Бұл жазу қате"], 0],
    ["C++", "Үлкен std::string-ті функцияға көшірмей, тек оқу үшін беру қалай жазылады?", "", ["void f(const std::string& s)","void f(std::string s)","void f(std::string* s)","void f(const std::string s)"], 0],
    ["C++", "Конструктор дегеніміз не?", "", ["Объект жасалғанда автоматты шақырылатын, аты класпен бірдей әдіс","Объектті жоятын әдіс","Класты көшіретін оператор","Тек статик өрістерді өзгертетін функция"], 0],
    ["C++", "#include <vector> жолы не істейді?", "", ["std::vector қолдануға қажет тақырып файлын қосады","vector айнымалысын жасайды","Бағдарламаны вектор түріне компиляциялайды","Жадты тазалайды"], 0],
    ["C++", "Нәтижесі қандай?", "int a = 7, b = 2;\ncout << a / b;", ["3","3.5","4","2"], 0, "cpp"],
    ["C++", "Нәтижесі қандай?", "cout << 7 % 3 << \" \" << -7 / 2;", ["1 -3","1 -4","2 -3","1 -3.5"], 0, "cpp"],
    ["C++", "Нәтижесі қандай?", "vector<int> v = {1, 2, 3};\nv.push_back(4);\ncout << v.size() << \" \" << v[3];", ["4 4","3 4","4 3","4 0"], 0, "cpp"],
    ["C++", "Нәтижесі қандай?", "int x = 5;\nint& r = x;\nr += 3;\ncout << x;", ["8","5","3","Компиляция қатесі"], 0, "cpp"],
    ["C++", "Нәтижесі қандай?", "string s = \"Almaty\";\ncout << s.substr(1, 3);", ["lma","Alm","lmat","Alma"], 0, "cpp"],
    ["C++", "Нәтижесі қандай?", "int a[] = {2, 4, 6, 8};\ncout << sizeof(a) / sizeof(a[0]);", ["4","16","8","2"], 0, "cpp"],
    ["C++", "Нәтижесі қандай?", "int x = 10;\nint* p = &x;\n*p *= 2;\ncout << x;", ["20","10","x-тің адресі","2"], 0, "cpp"],
    ["C++", "Нәтижесі қандай?", "for (int i = 0; i < 3; i++) cout << i * i << \" \";", ["0 1 4 ","1 4 9 ","0 1 2 ","0 2 4 "], 0, "cpp"],
    ["C++", "Нәтижесі қандай?", "cout << (5 > 3 && 2 > 4) << (5 > 3 || 2 > 4);", ["01","10","11","00"], 0, "cpp"],
    ["C++", "Нәтижесі қандай?", "auto x = 3 / 2.0;\ncout << x;", ["1.5","1","2","Компиляция қатесі"], 0, "cpp"],
    // Java
    ["Java", "Java бағдарламасы қай әдістен басталады?", "", ["public static void main(String[] args)","void start()","public void run()","static int main()"], 0],
    ["Java", "javac компиляторы .java файлынан нені жасайды?", "", ["JVM орындайтын байт-код (.class)","Машиналық код (.exe)","HTML бет","Мәтіндік журнал"], 0],
    ["Java", "JVM (Java Virtual Machine) не істейді?", "", ["Байт-кодты нақты компьютерде орындайды, сондықтан код платформаға тәуелсіз","Кодты қатесіз етіп түзетеді","Интернет қосылымын басқарады","Тек жадты тазартады"], 0],
    ["Java", "Екі String объектісінің мазмұнын салыстыру үшін не қолданылады?", "", ["a.equals(b)","a == b","a.same(b)","a = b"], 0],
    ["Java", "Айнымалыға final жазылса не болады?", "", ["Оған екінші рет мән меншіктеуге болмайды","Ол жадтан өшіріледі","Ол тек static болады","Ол null болады"], 0],
    ["Java", "Массив пен ArrayList-тің басты айырмасы қандай?", "", ["Массивтің өлшемі құрылғанда бекиді, ArrayList өлшемі өзгереді","ArrayList-те индекс жоқ","Массивте тек String болады","Айырмасы жоқ"], 0],
    ["Java", "Java-дағы барлық сыныптардың ортақ ата-бабасы қайсы?", "", ["Object","Main","Class","Base"], 0],
    ["Java", "static әдісті қалай шақырады?", "", ["Сынып аты арқылы, объект жасамай: Sinip.adis()","Тек new арқылы жасалған объектпен","Тек main ішінде","Оны шақыруға болмайды"], 0],
    ["Java", "Қай жиын (Set) қайталанатын элементтерді қабылдамайды?", "", ["HashSet","ArrayList","LinkedList","int[]"], 0],
    ["Java", "NullPointerException қашан шығады?", "", ["null сілтеме арқылы әдісті шақырғанда немесе өрісіне қолжеткізгенде","Массив шегінен шыққанда","Санды нөлге бөлгенде","Файл табылмағанда"], 0],
    ["Java", "try-catch блогы не үшін қажет?", "", ["Ерекше жағдайды (exception) ұстап, бағдарламаны құлатпай өңдеу үшін","Циклді жылдамдату үшін","Айнымалыны жариялау үшін","Класты жасыру үшін"], 0],
    ["Java", "Интерфейс (interface) дегеніміз не?", "", ["Сынып орындауға тиіс әдістер келісімі, сынып оны implements арқылы іске асырады","Графикалық терезе","Айнымалылар жинағы","Жадты басқару құралы"], 0],
    ["Java", "Нәтижесі қандай?", "int a = 7, b = 2;\nSystem.out.println(a / b);", ["3","3.5","4","2"], 0, "java"],
    ["Java", "Нәтижесі қандай?", "System.out.println(7 % 3 + \" \" + (-7 / 2));", ["1 -3","1 -4","2 -3","1 -3.5"], 0, "java"],
    ["Java", "Нәтижесі қандай?", "String a = \"kz\";\nString b = new String(\"kz\");\nSystem.out.println((a == b) + \" \" + a.equals(b));", ["false true","true true","true false","false false"], 0, "java"],
    ["Java", "Нәтижесі қандай?", "List<Integer> l = new ArrayList<>(List.of(5, 6, 7));\nl.remove(1);\nSystem.out.println(l);", ["[5, 7]","[5, 6, 7]","[6, 7]","[5, 6]"], 0, "java"],
    ["Java", "Нәтижесі қандай?", "String s = \"Astana\";\nSystem.out.println(s.charAt(2) + s.length());", ["122","t6","Astana6","8"], 0, "java"],
    ["Java", "Нәтижесі қандай?", "int[] a = {3, 1, 2};\nArrays.sort(a);\nSystem.out.println(Arrays.toString(a));", ["[1, 2, 3]","[3, 1, 2]","[3, 2, 1]","[1, 3, 2]"], 0, "java"],
    ["Java", "Нәтижесі қандай?", "StringBuilder sb = new StringBuilder(\"abc\");\nsb.reverse();\nSystem.out.println(sb);", ["cba","abc","bca","Компиляция қатесі"], 0, "java"],
    ["Java", "Нәтижесі қандай?", "int x = 5;\nx += x++ + ++x;\nSystem.out.println(x);", ["17","15","16","12"], 0, "java"],
    ["Java", "Нәтижесі қандай?", "System.out.println(1 + 2 + \"3\" + 4 + 5);", ["3345","12345","15","3 3 4 5"], 0, "java"],
    ["Java", "Нәтижесі қандай?", "double d = 10 / 4;\nSystem.out.println(d);", ["2.0","2.5","2","3.0"], 0, "java"],
  ];

  /* =========================================================
     4) ALGORITHM RACE: [атауы, [қадамдар дұрыс ретімен]]
     ========================================================= */
  const ALGO = [
    ["Екілік іздеу", ["Сұрыпталған массивті алып, low = 0 және high = соңғы индекс деп қой", "low ≤ high болғанда циклді қайтала", "mid = (low + high) / 2 орта индексін есепте", "Егер a[mid] ізделген санға тең болса, mid индексін қайтар", "Егер a[mid] ізделгеннен кіші болса, low = mid + 1, әйтпесе high = mid - 1 жаса", "Цикл біткенде сан табылмады деп -1 қайтар"]],
    ["Көпіршікті сұрыптау", ["Массивтің ұзындығын n деп ал", "Сыртқы цикл: n - 1 рет қайтала", "Ішкі цикл: көрші жұптарды басынан аяғына дейін қарап шық", "Егер сол жақ элемент оң жақтан үлкен болса, оларды ауыстыр", "Әр өткелде ең үлкен элемент соңына орналасады", "Сыртқы цикл біткенде массив сұрыпталған"]],
    ["Ең үлкен санды табу", ["Тізімнің бірінші элементін max деп белгіле", "Екінші элементтен бастап тізімді аралай бастаймыз", "Әр элементті ағымдағы max-пен салыстыр", "Егер элемент max-тан үлкен болса, max-ты жаңарт", "Тізім біткенше қайтала", "max мәнін нәтиже ретінде қайтар"]],
    ["Фибоначчи сандары", ["Осы n үшін a = 0 және b = 1 бастапқы мәндерін қой", "Қанша сан керек екенін n деп ал", "Цикл ішінде a мәнін шығар", "Келесі санды есепте: c = a + b", "a = b, содан кейін b = c деп жылжыт", "n рет қайталағанда тоқта"]],
    ["Жай санды тексеру", ["Егер n < 2 болса, жай емес деп қайтар", "Әйтпесе d = 2 деп бөлгішті бастап қой", "d * d ≤ n болғанда циклді қайтала", "Егер n % d == 0 болса, жай емес деп қайтар", "Әйтпесе d-ны 1-ге арттыр", "Цикл біткенде жай сан деп қайтар"]],
    ["Палиндромды тексеру", ["Жолды алып, бос орындарды алып таста", "Содан кейін алынған жолды кіші әріпке түрлендір", "Жолдың кері айналдырылған көшірмесін жаса", "Бастапқы жолды кері көшірмемен салыстыр", "Тең болса, палиндром деп қайтар", "Әйтпесе, палиндром емес деп қайтар"]],
    ["Факториал", ["n теріс емес бүтін сан екенін тексер", "result = 1 деп бастапқы мән қой", "i = 2 мәнінен бастап n-ге дейін циклді қайтала", "Әр қадамда result = result * i жаса", "Цикл біткенше жалғастыр", "result мәнін қайтар"]],
    ["Сызықтық іздеу", ["Ізделетін санды және тізімді ал", "i = 0 деп бірінші индексті қой", "Тізім біткенше қайтала", "Егер a[i] ізделген санға тең болса, i индексін қайтар", "Тең болмаса, i-ді 1-ге арттыр", "Тізім біткенде сан жоқ деп -1 қайтар"]],
    ["Стек: push және pop", ["Бос стек жаса", "push(1) жаса: стекте 1 тұр", "push(2) жаса: үстінде 2 тұр", "pop() шақыр: ең соңғы қосылған 2 алынады", "pop() тағы шақыр: 1 алынады", "Стек қайтадан бос"]],
    ["Кезек: enqueue және dequeue", ["Бос кезек жаса", "enqueue(A) жаса: кезекте A тұр", "enqueue(B) жаса: A-дан кейін B тұр", "dequeue() шақыр: ең алғашқы қосылған A алынады", "dequeue() тағы шақыр: B алынады", "Кезек қайтадан бос"]],
    ["Тізім қосындысы", ["Тізімді алып, sum = 0 деп бастапқы мән қой", "Тізімнің әр элементін ретімен аралап шық", "Әр x үшін sum = sum + x жаса", "Барлық элемент біткенше қайтала", "sum мәнін қайтар"]],
    ["Ең үлкен ортақ бөлгіш (Евклид)", ["a және b екі санын ал", "b ≠ 0 болғанда циклді қайтала", "t = b деп уақытша сақта", "b = a % b деп жаңа қалдықты есепте", "a = t деп жаңарт", "b = 0 болғанда a мәнін GCD ретінде қайтар"]],
    ["Санды цифрларға бөлу", ["Санды n деп ал, цифрлар тізімін бос қой", "n > 0 болғанда циклді қайтала", "Соңғы цифрды ал: d = n % 10", "d цифрын тізімге қос", "n = n // 10 жасап, соңғы цифрды алып таста", "Цикл біткенде тізімде цифрлар тұрады"]],
    ["Жолды кері айналдыру", ["Бастапқы жолды ал, нәтижені бос жол етіп қой", "i = жол ұзындығы - 1 деп соңғы индексті қой", "i ≥ 0 болғанда циклді қайтала", "Нәтижеге s[i] символын қос", "i-ді 1-ге азайт", "Цикл біткенде нәтижені қайтар"]],
    ["Жұп және тақ сандарды санау", ["even = 0 және odd = 0 деп екі санауыш қой", "Тізімнің әр санын ретімен аралап шық", "Егер x % 2 == 0 болса, even-ді 1-ге арттыр", "Әйтпесе odd-ты 1-ге арттыр", "Барлық сан біткенше қайтала", "even және odd мәндерін шығар"]],
  ];

  window.CS50GamesA = { RUN, BUGS, QUIZ, ALGO };
  // hl (синтаксис бояу) games-b.js үшін төменде тіркеледі // тексеру/тест үшін деректер

  /* ---------- ортақ көмекшілер ---------- */
  function alive(stage) { return stage.isConnected; }
  const hearts = (n, max) => "❤️".repeat(Math.max(0, n)) + "🖤".repeat(Math.max(0, (max || 3) - n));
  const wait = (ms, f) => setTimeout(f, ms);

  /* =========================================================
     1) CODE RUNNER
     ========================================================= */
  function runner(stage, ctx) {
    const E = ctx.esc, step = reduced();
    const MAXQ = 25;
    const qs = ctx.shuffle(RUN).slice(0, MAXQ);
    let lives = 3, score = 0, streak = 0, okN = 0, qi = -1, lane = 1, busy = true, lanes = [], dur = 9000, t0 = 0, raf = 0, nl = 3, cur = null, stopped = false;
    const keyH = (e) => {
      if (!alive(stage)) { document.removeEventListener("keydown", keyH); stopped = true; cancelAnimationFrame(raf); return; }
      if (busy) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowDown") { e.preventDefault(); commit(); }
      else if ((e.key === "Enter" || e.key === " ") && !(e.target && e.target.tagName === "BUTTON")) { e.preventDefault(); commit(); }
      else if (/^[1-3]$/.test(e.key) && +e.key <= nl) { select(+e.key - 1); }
    };
    document.addEventListener("keydown", keyH);

    const goBtn = ctx.intro({
      lead: "Кейіпкер жолмен жүгіреді. Тапсырмаға сәйкес <b>дұрыс кодтың жолына</b> өт.",
      rules: [["⬅️➡️", "← → пернелері немесе жолды бас: жол таңдау"], ["✔", "Enter, ↓ немесе «Бекіту»: ерте бекіту"], ["❤️", "3 жан. Әр дұрыс жауаптан кейін жылдамдық артады"]],
      extra: step ? '<p class="ga-note">Қозғалысты азайту режимі қосулы: анимациясыз, уақыт шектеусіз қадамдық ойын. Жолды таңдап, «Бекіту» батырмасын бас.</p>' : "",
    });
    goBtn.onclick = () => { ctx.sfx("tick"); buildUI(); next(); };

    let hud, qEl, ctxEl, track, fb, ctlGo, road;
    function buildUI() {
      stage.innerHTML = `<div class="g-hud"><span class="ga-lives" aria-label="Жан"></span><span>Ұпай: <b class="ga-score">0</b></span><span>Жылдамдық: <b class="ga-spd">×1.0</b></span><span class="gx-combo" hidden></span><span class="g-time ga-qn"></span></div>
        <p class="g-q ga-prompt"></p><pre class="g-code ga-ctx" hidden></pre>
        <div class="gx-road" style="--lane:1;--n:3"><div class="ga-track" role="group" aria-label="Жолдар"></div><span class="gx-runner" aria-hidden="true"><i>🏃</i></span></div>
        <div class="ga-ctl"><button class="btn ghost ga-l" type="button" aria-label="Солға жылжу">◀ Солға</button><button class="btn ga-ok" type="button">✔ Бекіту</button><button class="btn ghost ga-r" type="button" aria-label="Оңға жылжу">Оңға ▶</button></div>
        <div class="g-fb" role="status" aria-live="polite"></div>`;
      road = $(".gx-road", stage); hud = stage; qEl = $(".ga-prompt", stage); ctxEl = $(".ga-ctx", stage); track = $(".ga-track", stage); fb = $(".g-fb", stage);
      $(".ga-l", stage).onclick = () => !busy && move(-1);
      $(".ga-r", stage).onclick = () => !busy && move(1);
      $(".ga-ok", stage).onclick = () => !busy && commit();
    }
    function hudUpdate() {
      $(".ga-lives", stage).textContent = hearts(lives);
      $(".ga-score", stage).textContent = score;
      $(".ga-spd", stage).textContent = "×" + (9000 / dur).toFixed(1);
      $(".ga-qn", stage).textContent = `Сұрақ ${Math.min(qi + 1, qs.length)}/${qs.length}`;
      const cb = $(".gx-combo", stage); cb.hidden = streak < 2; cb.textContent = `🔥 Комбо ×${streak}`;
    }
    function next() {
      if (stopped || !alive(stage)) return;
      qi++;
      if (qi >= qs.length || lives <= 0) return end();
      cur = qs[qi];
      dur = Math.max(4200, 9000 - 300 * okN);
      const wr = ctx.shuffle(cur[4]);
      const longest = Math.max(...[cur[3], wr[0], wr[1]].map((c) => Math.max(...c.split("\n").map((l) => l.length))));
      nl = longest > 24 ? 2 : 3;
      const arr = ctx.shuffle([{ c: cur[3], ok: true }, ...wr.slice(0, nl - 1).map((c) => ({ c, ok: false }))]);
      lane = Math.floor(nl / 2);
      qEl.innerHTML = cur[0] === "o"
        ? `Мына нәтиже шығаратын кодтың жолына өт:${cur[1].split("\n").length > 1 ? `<pre class="g-code ga-target">${E(cur[1])}</pre>` : ` <code class="ga-target-i">${E(cur[1])}</code>`}`
        : `Тапсырма: <b>${E(cur[1])}</b>. Қатесіз кодтың жолына өт.`;
      if (cur[2]) { ctxEl.hidden = false; ctxEl.textContent = cur[2]; } else { ctxEl.hidden = true; }
      track.style.setProperty("--n", nl); road.style.setProperty("--n", nl);
      track.innerHTML = arr.map((a, i) => `<button type="button" class="ga-lane" data-i="${i}" aria-label="${i + 1}-жол"><span class="ga-card"><code>${E(a.c)}</code></span></button>`).join("");
      lanes = [...track.children];
      lanes.forEach((b, i) => { b._ok = arr[i].ok; b._code = arr[i].c; b.onclick = () => !busy && select(i); });
      select(lane, true);
      fb.textContent = "";
      busy = false; hudUpdate();
      t0 = performance.now();
      if (step) place(0.45); else { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }
      $(".ga-ok", stage).disabled = false;
    }
    function place(p) {
      lanes.forEach((b) => {
        const h = b.clientHeight, c = b.firstChild.offsetHeight;
        b.firstChild.style.transform = `translateY(${Math.round(p * Math.max(0, h - c - 62))}px)`;
      });
    }
    function tick(now) {
      if (busy || stopped || !alive(stage)) return;
      const p = Math.min(1, (now - t0) / dur);
      place(p);
      if (p >= 1) commit(); else raf = requestAnimationFrame(tick);
    }
    function select(i, quiet) {
      lane = Math.max(0, Math.min(nl - 1, i));
      if (road) road.style.setProperty("--lane", lane);
      if (!quiet) ctx.sfx("tick");
      lanes.forEach((b, k) => { b.classList.toggle("on", k === lane); b.setAttribute("aria-pressed", k === lane ? "true" : "false"); });
      if (!quiet) fb.textContent = "";
    }
    function move(d) { select(lane + d); }
    function commit() {
      if (busy) return;
      busy = true; cancelAnimationFrame(raf);
      $(".ga-ok", stage).disabled = true;
      place(0.9);
      const right = lanes[lane]._ok;
      lanes.forEach((b) => { if (b._ok) b.classList.add("ok"); else if (b === lanes[lane]) b.classList.add("bad"); });
      let delay;
      if (right) {
        okN++; streak++;
        const gain = 10 + Math.min(10, (streak - 1) * 2);
        score += gain;
        fb.innerHTML = `✅ Дұрыс! +${gain} ұпай${streak > 1 ? ` · серия ${streak}` : ""}. Жылдамдық артты.`;
        ctx.sfx("ok");
        delay = step ? 1200 : 700;
      } else {
        lives--; streak = 0;
        const good = lanes.find((b) => b._ok)._code;
        fb.innerHTML = `❌ Қате. Дұрыс код: <code>${E(good.replace(/\n/g, " ⏎ "))}</code>. Қалған жан: ${lives}`;
        ctx.sfx("bad");
        delay = 2000;
      }
      hudUpdate();
      wait(delay, next);
    }
    function end() {
      stopped = true; document.removeEventListener("keydown", keyH);
      const won = lives > 0;
      ctx.finish({ score, max: 350, xp: Math.min(100, Math.round(score / 4)), title: won ? "Финишке жеттің! 🏁" : "Жандар таусылды", lines: [`Дұрыс жауап: ${okN} / ${Math.min(qi, qs.length)}`, `Қалған жан: ${Math.max(0, lives)}`, "Қателескен сұрақтарды қайталап көр, жылдамдық әр дұрыс жауаппен артады."] });
    }
  }

  /* =========================================================
     2) BUG HUNTER
     ========================================================= */
  /* ---- Жаңа көрініс (games-ui2.css): жеңіл синтаксис бояу және раунд нүктелері ---- */
  const KW = {
    C: "int char float double void long short unsigned signed const static struct typedef enum return if else for while do switch case break continue sizeof NULL include define bool true false",
    Python: "def class return if elif else for while in not and or is import from as pass break continue lambda with try except finally raise None True False print del global yield",
    "C++": "int char float double void long short unsigned signed const static struct class public private protected typedef enum return if else for while do switch case break continue sizeof nullptr NULL include define bool true false new delete using namespace auto template typename virtual override try catch throw this operator constexpr std",
    Java: "public private protected static final void int long short byte char float double boolean class interface extends implements new return if else for while do switch case break continue this super null true false import package try catch finally throw throws instanceof var abstract enum default",
    JavaScript: "function const let var return if else for while do switch case break continue new this class extends import export from async await try catch finally throw typeof null undefined true false of in",
  };
  const KWSET = {};
  Object.keys(KW).forEach((k) => (KWSET[k] = new Set(KW[k].split(" "))));
  const TOKEN = /(\/\/.*|#(?:include|define)\b.*|#.*$)|("(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])*'?|`(?:\\.|[^`\\])*`?)|(\b\d[\d.]*\b)|([A-Za-z_]\w*)|([\s\S])/g;
  function hl(line, lang) {
    const kws = KWSET[lang] || KWSET.C;
    const esc = (t) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    let out = "", m, last = 0;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(line))) {
      if (m[1] != null) {
        // "#" Python-да түсініктеме, C-да препроцессор
        const isPy = lang === "Python", c = m[1];
        const cls = c.startsWith("//") || (isPy && c[0] === "#") ? "t-c" : c[0] === "#" ? "t-pp" : "t-c";
        out += `<span class="${cls}">${esc(c)}</span>`;
      } else if (m[2] != null) out += `<span class="t-s">${esc(m[2])}</span>`;
      else if (m[3] != null) out += `<span class="t-n">${esc(m[3])}</span>`;
      else if (m[4] != null) {
        const w = m[4], nx = line.slice(TOKEN.lastIndex).match(/^\s*\(/);
        out += kws.has(w) ? `<span class="t-k">${esc(w)}</span>` : nx ? `<span class="t-f">${esc(w)}</span>` : esc(w);
      } else out += esc(m[5]);
      last = TOKEN.lastIndex;
    }
    return out;
  }
  window.CS50GamesA.hl = hl;
  const LANG_FILE = { C: ["main.c", "C"], "C++": ["main.cpp", "cpp"], Java: ["Main.java", "java"], Python: ["app.py", "Py"], JavaScript: ["script.js", "JS"] };
  /** Раунд нүктелері: states[i] = "ok" | "bad" | "" ; cur - ағымдағы */
  function dotsHtml(n, cur, states, label) {
    let h = `<span class="gy-dots" role="img" aria-label="${label}">`;
    for (let i = 0; i < n; i++) h += `<i class="${states[i] || ""}${i === cur ? " cur" : ""}"></i>`;
    return h + "</span>";
  }

  function bughunt(stage, ctx) {
    const E = ctx.esc;
    const ROUNDS = 12, TIME = FAST ? 6 : 40;
    const byLang = {};
    BUGS.forEach((b) => (byLang[b.l] = byLang[b.l] || []).push(b));
    /* 5 тіл араласады: әр тілден 2 раунд, қалған 2 раундты кездейсоқ тілдер алады */
    const langs = Object.keys(byLang), per = Math.floor(ROUNDS / langs.length), extra = new Set(ctx.sample(langs, ROUNDS % langs.length));
    const rounds = ctx.shuffle(langs.flatMap((l) => ctx.sample(byLang[l], per + (extra.has(l) ? 1 : 0))));
    let ri = -1, score = 0, hit = 0, useTimer = false, left = 0, tm = 0, busy = false;
    const results = [];
    stage.innerHTML = `<div class="gy gy-bh"><div class="ga-intro gy-intro"><div class="gy-intro-ico" aria-hidden="true">🐛</div>
      <p>Әр раундта C, C++, Java, Python немесе JavaScript кодында <b>бір қате</b> бар. Қате жолды бас, содан кейін қатенің сипаттамасы мен түзетуін көресің. Барлығы ${ROUNDS} раунд.</p>
      <div class="gy-chips" aria-hidden="true"><span class="gy-lang gy-lang-c">C</span><span class="gy-lang gy-lang-cpp">C++</span><span class="gy-lang gy-lang-java">Java</span><span class="gy-lang gy-lang-py">Py</span><span class="gy-lang gy-lang-js">JS</span></div>
      <label class="ga-check"><input type="checkbox" class="ga-timer"> Таймермен ойнау (әр раундқа ${TIME} секунд, жылдам жауап қосымша ұпай береді)</label>
      <button class="btn ga-go gy-go" type="button">▶ Бастау</button></div></div>`;
    $(".ga-go", stage).onclick = () => { useTimer = $(".ga-timer", stage).checked; next(); };
    $(".ga-go", stage).focus();

    function next() {
      clearInterval(tm);
      if (!alive(stage)) return;
      ri++;
      if (ri >= rounds.length) return end();
      const r = rounds[ri];
      busy = false;
      const lf = LANG_FILE[r.l] || ["code", r.l];
      stage.innerHTML = `<div class="gy gy-bh"><div class="g-hud gy-hud"><span class="gy-round">Раунд <b>${ri + 1}</b>/${rounds.length}</span>${dotsHtml(rounds.length, ri, results, `Раунд ${ri + 1} / ${rounds.length}`)}<span class="gy-score">Ұпай: <b>${score}</b></span>${useTimer ? `<span class="g-time ga-clock" aria-hidden="true">⏱ ${TIME}</span>` : ""}</div>
        ${useTimer ? `<div class="gy-timebar" aria-hidden="true"><i></i></div>` : ""}
        <p class="g-q gy-q"><b>${E(r.t)}</b>. Қате бар жолды тап (жолды бас):</p>
        <div class="gy-editor"><div class="gy-etitle"><span class="gy-lights" aria-hidden="true"><i></i><i></i><i></i></span><span class="gy-file">${lf[0]}</span><span class="ga-lang gy-lang gy-lang-${lf[1].toLowerCase()}">${E(r.l)}</span></div>
        <ol class="ga-lines" aria-label="Код жолдары">${r.c.map((l, i) => l.trim() === "" ? '<li class="ga-blank" aria-hidden="true"></li>' : `<li><button type="button" class="ga-line" data-i="${i}" aria-label="${i + 1}-жол: ${E(l.trim())}"><span class="ga-ln" aria-hidden="true">${i + 1}</span><code>${hl(l, r.l)}</code></button></li>`).join("")}</ol></div>
        <div class="ga-explain" hidden></div><div class="g-fb" role="status" aria-live="polite"></div></div>`;
      const btns = [...stage.querySelectorAll(".ga-line")];
      btns.forEach((b) => (b.onclick = () => answer(+b.dataset.i, r)));
      if (useTimer) {
        left = TIME; const t0 = Date.now();
        tm = setInterval(() => {
          if (!alive(stage)) return clearInterval(tm);
          left = Math.max(0, TIME - (Date.now() - t0) / 1000);
          const c = $(".ga-clock", stage); if (c) { c.textContent = "⏱ " + Math.ceil(left); c.classList.toggle("low", left <= 8); }
          const tb = $(".gy-timebar i", stage); if (tb) tb.style.width = (left / TIME * 100) + "%";
          if (left <= 0) answer(-1, r);
        }, 200);
      }
    }
    function answer(i, r) {
      if (busy) return; busy = true; clearInterval(tm);
      const good = i === r.b;
      results[ri] = good ? "ok" : "bad";
      const ed = $(".gy-editor", stage); if (ed) ed.classList.add(good ? "flash-ok" : "flash-bad");
      if (ctx.sfx) { try { ctx.sfx(good ? "ok" : "bad"); } catch (e) {} }
      let gain = 0;
      if (good) { hit++; gain = 10 + (useTimer ? Math.round((left / TIME) * 5) : 0); score += gain; }
      stage.querySelectorAll(".ga-line").forEach((b) => {
        b.disabled = true;
        const k = +b.dataset.i;
        if (k === r.b) { b.classList.add("ok"); b.insertAdjacentHTML("beforeend", '<span class="ga-mark ok">✓ қате осы жерде</span>'); }
        else if (k === i) { b.classList.add("bad"); b.insertAdjacentHTML("beforeend", '<span class="ga-mark bad">✗ дұрыс емес</span>'); }
      });
      const ex = $(".ga-explain", stage); ex.hidden = false;
      ex.innerHTML = `<p class="gy-why"><b>Қатенің сипаттамасы:</b> ${E(r.w)}</p><p class="gy-fixh"><b>Түзету:</b></p>${r.f === "" ? "<p>Бұл жолды алып тастау керек.</p>" : `<pre class="g-code gy-fix"><code>${r.f.split("\n").map((x) => hl(x, r.l)).join("\n")}</code></pre>`}<button class="btn ga-next" type="button">${ri + 1 >= rounds.length ? "Нәтижені көру" : "Келесі раунд →"}</button>`;
      $(".g-fb", stage).textContent = good ? `✅ Дұрыс! +${gain} ұпай` : i < 0 ? `⌛ Уақыт бітті. Қате ${r.b + 1}-жолда еді.` : `❌ Қате. Дұрыс жауап: ${r.b + 1}-жол.`;
      const nb = $(".ga-next", stage); nb.onclick = next; nb.focus();
    }
    function end() {
      ctx.finish({ score, title: hit >= 10 ? "Керемет қате іздеуші! 🐛" : hit >= 6 ? "Жақсы нәтиже!" : "Қайталап көр!", lines: [`Қатені дұрыс тапқан раунд: ${hit} / ${rounds.length}`, "Қателерді жиі жіберетін орындар: ; ұмыту, «=» мен «==», индекс шегі, шексіз цикл, free/delete ұмыту, Java-да null мен equals."] });
    }
  }

  /* =========================================================
     3) CODE BATTLE
     ========================================================= */
  function battle(stage, ctx) {
    const E = ctx.esc, TOTAL = FAST ? 8 : 60;
    const pool = ctx.shuffle(QUIZ);
    let qi = -1, score = 0, streak = 0, best = 0, ans = 0, good = 0, tm = 0, t0 = 0, locked = true, cur = null, ended = false, opts = [];
    const keyH = (e) => {
      if (!alive(stage)) { document.removeEventListener("keydown", keyH); clearInterval(tm); return; }
      if (locked || !/^[1-4]$/.test(e.key) || e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault(); pick(+e.key - 1);
    };
    ctx.intro({
      lead: `<b>${TOTAL} секунд</b> ішінде мүмкіндігінше көп сұраққа жауап бер.`,
      rules: [["⏱", `${TOTAL} секунд: уақыт бітсе, ойын аяқталады`], ["🔥", "Әр дұрыс жауап +10 ұпай; қатарынан 3+ дұрыс жауап серия бонусын береді"], ["⌨️", "Қате жауап сериясын үзеді. Жауап: 1-4 пернелері немесе батырмалар"]],
    }).onclick = start;

    function start() {
      ctx.sfx("tick");
      document.addEventListener("keydown", keyH);
      stage.innerHTML = `<div class="g-hud gx-bhud"><span>Ұпай: <b class="ga-score">0</b></span><span>Серия: <b class="ga-streak">0</b></span><span class="ga-topic"></span><span class="gx-combo" hidden></span><span class="g-time ga-clock gx-ring" role="timer" aria-live="off" style="--p:100">⏱ ${TOTAL}</span></div>
        <div class="g-bar" aria-hidden="true"><i class="ga-tbar"></i></div>
        <div class="ga-qbox"></div><div class="g-fb" role="status" aria-live="polite"></div>
        <p class="ga-hint">1-4 пернелері жауап береді</p>`;
      t0 = Date.now();
      tm = setInterval(tick, 100);
      nextQ();
    }
    function left() { return Math.max(0, TOTAL - (Date.now() - t0) / 1000); }
    let lastShown = TOTAL + 1;
    function tick() {
      if (!alive(stage)) return clearInterval(tm);
      const l = left(), s = Math.ceil(l);
      $(".ga-tbar", stage).style.width = (l / TOTAL * 100) + "%";
      $(".ga-clock", stage).style.setProperty("--p", (l / TOTAL * 100).toFixed(1));
      if (s !== lastShown) { lastShown = s; $(".ga-clock", stage).textContent = "⏱ " + s; if (s === 10 || s === 5) $(".g-fb", stage).textContent = `Қалды ${s} секунд!`; }
      $(".ga-clock", stage).classList.toggle("low", l <= 10);
      if (l <= 0) finish();
    }
    function nextQ() {
      if (ended) return;
      qi++;
      if (qi >= pool.length) { qi = 0; }
      cur = pool[qi];
      const order = ctx.shuffle([0, 1, 2, 3]);
      opts = order.map((k) => ({ t: cur[3][k], ok: k === cur[4] }));
      $(".ga-topic", stage).textContent = cur[0];
      $(".ga-qbox", stage).innerHTML = `<p class="g-q">${E(cur[1])}</p>${cur[2] ? `<pre class="g-code">${E(cur[2])}</pre>` : ""}
        <div class="g-opts">${opts.map((o, i) => `<button type="button" class="g-opt" data-i="${i}" data-k="${"ABCD"[i]}"><b>${i + 1}.</b> ${E(o.t)}</button>`).join("")}</div>`;
      $(".ga-qbox", stage).querySelectorAll(".g-opt").forEach((b) => (b.onclick = () => pick(+b.dataset.i)));
      locked = false;
    }
    function pick(i) {
      if (locked || ended) return; locked = true; ans++;
      const o = opts[i], btns = [...stage.querySelectorAll(".g-opt")];
      btns.forEach((b, k) => { b.disabled = true; if (opts[k].ok) b.classList.add("ok"); else if (k === i) b.classList.add("bad"); });
      const fb = $(".g-fb", stage);
      let d;
      if (o.ok) {
        good++; streak++; best = Math.max(best, streak);
        const bonus = streak >= 3 ? Math.min(10, (streak - 2) * 2) : 0;
        score += 10 + bonus;
        fb.textContent = `✅ +${10 + bonus}${bonus ? ` (серия бонусы +${bonus})` : ""}`;
        ctx.sfx("ok"); d = 350;
      } else { streak = 0; fb.textContent = "❌ Қате. Дұрыс жауап жасыл түспен көрсетілген."; ctx.sfx("bad"); d = 900; }
      $(".ga-score", stage).textContent = score; $(".ga-streak", stage).textContent = streak;
      const cb = $(".gx-combo", stage); cb.hidden = streak < 3; cb.textContent = `🔥 Комбо ×${streak}`;
      const qb = $(".ga-qbox", stage); qb.classList.remove("flash-ok", "flash-bad"); void qb.offsetWidth; qb.classList.add(o.ok ? "flash-ok" : "flash-bad");
      wait(d, nextQ);
    }
    function finish() {
      if (ended) return; ended = true; clearInterval(tm); document.removeEventListener("keydown", keyH);
      ctx.finish({ score, max: 300, title: "Уақыт бітті! ⏱", lines: [`Жауап берілген сұрақ: ${ans}, дұрыс: ${good}`, `Ең ұзақ серия: ${best}`, ans ? `Дәлдік: ${Math.round((good / ans) * 100)}%` : "Жауап берілмеді"] });
    }
  }

  /* =========================================================
     4) ALGORITHM RACE
     ========================================================= */
  function algo(stage, ctx) {
    const E = ctx.esc, ROUNDS = 5;
    const picks = ctx.sample(ALGO, ROUNDS);
    const results = [];
    let ri = -1, total = 0, solved = 0, order = [], steps = [], tries = 0, t0 = 0, done = false, dragId = null, marks = null;
    stage.innerHTML = `<div class="gy gy-algo"><div class="ga-intro gy-intro"><div class="gy-intro-ico" aria-hidden="true">🧠</div><p>Алгоритм қадамдары араласып берілген. Оларды <b>дұрыс ретке</b> келтір: «↑ / ↓» батырмалары, сүйреу (тышқанмен) немесе пернетақта: қадамға фокус қойып, <kbd>Shift</kbd> + <kbd>↑</kbd>/<kbd>↓</kbd>. ${ROUNDS} раунд, әр раундта 2 тексеру мүмкіндігі бар. Қанша дұрыс және қаншалықты жылдам екені ұпайға әсер етеді.</p>
      <button class="btn ga-go gy-go" type="button">▶ Бастау</button></div></div>`;
    $(".ga-go", stage).onclick = next;
    $(".ga-go", stage).focus();

    function next() {
      if (!alive(stage)) return;
      ri++;
      if (ri >= ROUNDS) return end();
      const a = picks[ri];
      steps = a[1].map((t, i) => ({ id: i, t }));
      do { order = ctx.shuffle(steps.map((s) => s.id)); } while (order.every((v, i) => v === i));
      tries = 0; done = false; marks = null; t0 = Date.now();
      stage.innerHTML = `<div class="gy gy-algo"><div class="g-hud gy-hud"><span class="gy-round">Раунд <b>${ri + 1}</b>/${ROUNDS}</span>${dotsHtml(ROUNDS, ri, results, `Раунд ${ri + 1} / ${ROUNDS}`)}<span class="gy-score">Ұпай: <b>${total}</b></span><span class="gy-tries" aria-hidden="true" title="Тексеру мүмкіндіктері"><i></i><i></i></span></div>
        <div class="gy-prog" role="progressbar" aria-label="Орындалу" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i><b>тексеру күтілуде</b></div>
        <p class="g-q gy-q"><b>${E(a[0])}</b>: қадамдарды дұрыс ретке келтір (жоғарыдан төменге).</p>
        <ol class="ga-steps" aria-label="Алгоритм қадамдары"></ol>
        <div class="ga-ctl"><button class="btn ga-check-btn" type="button">✔ Тексеру</button></div>
        <div class="g-fb" role="status" aria-live="polite"></div></div>`;
      $(".ga-check-btn", stage).onclick = check;
      draw();
    }
    function draw(focus) {
      const ol = $(".ga-steps", stage);
      const old = {};
      if (!reduced()) ol.querySelectorAll(".ga-step").forEach((el) => { old[el.dataset.id] = el.getBoundingClientRect().top; });
      ol.innerHTML = order.map((id, pos) => {
        const m = marks ? (marks[pos] ? "ok" : "bad") : "";
        return `<li class="ga-step ${m}" draggable="${done ? "false" : "true"}" data-id="${id}" data-pos="${pos}" tabindex="0" aria-label="${pos + 1}-орын: ${E(steps[id].t)}${m ? (m === "ok" ? ". Дұрыс орын" : ". Қате орын") : ""}">
          <span class="gy-grip" aria-hidden="true"></span><span class="ga-num" aria-hidden="true">${pos + 1}</span><span class="ga-txt">${E(steps[id].t)}</span>
          <span class="ga-state" aria-hidden="true">${m === "ok" ? "✓" : m === "bad" ? "✗" : ""}</span>
          <span class="ga-btns"><button type="button" class="ga-up" aria-label="Жоғары жылжыту: ${E(steps[id].t)}"${done || pos === 0 ? " disabled" : ""}>↑</button><button type="button" class="ga-dn" aria-label="Төмен жылжыту: ${E(steps[id].t)}"${done || pos === order.length - 1 ? " disabled" : ""}>↓</button></span></li>`;
      }).join("");
      ol.querySelectorAll(".ga-step").forEach((li) => {
        const pos = +li.dataset.pos, id = +li.dataset.id;
        if (old[id] != null) {
          const dy = old[id] - li.getBoundingClientRect().top;
          if (dy) { li.style.transition = "none"; li.style.transform = `translateY(${dy}px)`; li.classList.add("moving"); requestAnimationFrame(() => requestAnimationFrame(() => { li.style.transition = ""; li.style.transform = ""; setTimeout(() => li.classList.remove("moving"), 320); })); }
        }
        $(".ga-up", li).onclick = () => mv(pos, pos - 1, id, "up");
        $(".ga-dn", li).onclick = () => mv(pos, pos + 1, id, "dn");
        li.onkeydown = (e) => {
          if (e.target !== li || done) return;
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const d = e.key === "ArrowUp" ? -1 : 1;
            if (e.shiftKey) mv(pos, pos + d, id, "li"); else { const t = ol.children[pos + d]; if (t) t.focus(); }
          }
        };
        li.ondragstart = (e) => { dragId = id; li.classList.add("drag"); try { e.dataTransfer.setData("text/plain", String(id)); e.dataTransfer.effectAllowed = "move"; } catch (x) {} };
        li.ondragend = () => { li.classList.remove("drag"); ol.querySelectorAll(".over").forEach((x) => x.classList.remove("over")); };
        li.ondragover = (e) => { if (dragId == null) return; e.preventDefault(); li.classList.add("over"); };
        li.ondragleave = () => li.classList.remove("over");
        li.ondrop = (e) => {
          e.preventDefault(); li.classList.remove("over");
          if (dragId == null || done) return;
          const from = order.indexOf(dragId); dragId = null;
          mv(from, pos, order[from], "li");
        };
      });
      const okN = marks ? marks.filter(Boolean).length : 0; // тек тексеруден кейін (құпия ақпарат бермейді)
      const pg = $(".gy-prog", stage);
      if (pg) { pg.setAttribute("aria-valuenow", Math.round(okN / order.length * 100)); $("i", pg).style.width = (okN / order.length * 100) + "%"; $("b", pg).textContent = marks ? `${okN} / ${order.length} дұрыс` : "тексеру күтілуде"; }
      if (focus) {
        const li = ol.querySelector(`[data-id="${focus.id}"]`);
        if (li) { let t = focus.kind === "up" ? $(".ga-up", li) : focus.kind === "dn" ? $(".ga-dn", li) : li; if (t && t.disabled) t = focus.kind === "up" ? $(".ga-dn", li) : $(".ga-up", li); (t || li).focus(); }
      }
    }
    function mv(from, to, id, kind) {
      if (done || to < 0 || to >= order.length || from < 0 || from === to) return;
      order.splice(from, 1); order.splice(to, 0, id);
      marks = null; // өзгерген соң белгілер өшеді
      $(".g-fb", stage).textContent = `«${steps[id].t.slice(0, 40)}» ${to + 1}-орынға көшті`;
      draw({ id, kind });
    }
    function check() {
      if (done) return;
      tries++;
      marks = order.map((id, pos) => id === pos);
      const pips = stage.querySelectorAll(".gy-tries i"); if (pips[tries - 1]) pips[tries - 1].className = "used";
      const okC = marks.filter(Boolean).length, n = order.length, sec = (Date.now() - t0) / 1000;
      const all = okC === n;
      const fb = $(".g-fb", stage);
      if (all || tries >= 2) {
        done = true;
        let pts = Math.round((okC / n) * 70);
        if (all) { pts += Math.max(0, Math.min(30, 30 - Math.floor(Math.max(0, sec - 10) / 2))); if (tries > 1) pts -= 10; }
        pts = Math.max(0, pts);
        total += pts; if (all) solved++;
        if (!all) { order = steps.map((s) => s.id); marks = order.map(() => true); }
        fb.innerHTML = all ? `✅ Бәрі дұрыс! ${Math.round(sec)} секунд · +${pts} ұпай` : `❌ ${okC}/${n} орын дұрыс болды (+${pts} ұпай). Төменде дұрыс реті көрсетілген.`;
        draw();
        $(".ga-check-btn", stage).outerHTML = `<button class="btn ga-nx" type="button">${ri + 1 >= ROUNDS ? "Нәтижені көру" : "Келесі раунд →"}</button>`;
        const nb = $(".ga-nx", stage); nb.onclick = next; nb.focus();
        $(".gy-score b", stage).textContent = total;
        results[ri] = all ? "ok" : "bad";
        const dd = stage.querySelectorAll(".gy-dots i")[ri]; if (dd) dd.className = "cur " + results[ri];
        if (ctx.sfx) { try { ctx.sfx(all ? "win" : "bad"); } catch (e) {} }
      } else {
        fb.textContent = `${okC}/${n} орын дұрыс. Қате орындар ✗ белгісімен көрсетілген. Түзетіп, қайта тексер (соңғы мүмкіндік).`;
        draw();
      }
    }
    function end() {
      ctx.finish({ score: total, xp: Math.min(100, Math.round(total / 5)), title: solved === ROUNDS ? "Алгоритм шебері! 🧠" : "Раундтар аяқталды", lines: [`Толық дұрыс шешілген алгоритм: ${solved} / ${ROUNDS}`, "Әр раундтың ең жоғарғы ұпайы 100: дұрыстық үшін 70 және жылдамдық үшін 30."] });
    }
  }

  G.register({ id: "runner", title: "Code Runner", icon: "🎮", color: "#2563eb", blurb: "Жүгір және дұрыс Python кодының жолына өт. Әр жауаптан кейін жылдамырақ.", start: runner });
  G.register({ id: "bughunt", title: "Bug Hunter", icon: "🐛", color: "#d9480f", blurb: "C, C++, Java, Python, JavaScript кодындағы қате жолды тап, түзетуін оқы.", start: bughunt });
  G.register({ id: "battle", title: "Code Battle", icon: "⚔️", color: "#c2255c", blurb: "60 секунд: мүмкіндігінше көп сұраққа жауап бер, серия бонусын жина.", start: battle });
  G.register({ id: "algo", title: "Algorithm Race", icon: "🧠", color: "#0f766e", blurb: "Араласқан алгоритм қадамдарын дұрыс ретке келтір.", start: algo });
})();
