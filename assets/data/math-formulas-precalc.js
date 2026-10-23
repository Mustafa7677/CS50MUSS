/* © 2026 Sagid Mustafa. All Rights Reserved. Математика курсы, «Жоғары математикаға дайындық» пәні. Формат: docs/MATH-COURSE-GUIDE.md §9.1 (формулалар). */
window.CS50KZ_MATH_FORMULAS = window.CS50KZ_MATH_FORMULAS || {};
window.CS50KZ_MATH_FORMULAS.precalc = [
 {
  "id": "pc-linear",
  "name": "Сызықтық функция",
  "tex": "f(x)=kx+b",
  "note": "Графигі - түзу; k - еңіс, b - Oy осімен қиылысу ординатасы.",
  "tags": [
   "түзу",
   "еңіс",
   "сызықтық функция"
  ],
  "lesson": 1,
  "anchor": "f-1"
 },
 {
  "id": "pc-slope",
  "name": "Түзудің еңісі",
  "tex": "k=\\frac{y_2-y_1}{x_2-x_1}",
  "cond": "x_1\\ne x_2",
  "note": "Түзудегі кез келген екі нүктеден бірдей мән шығады.",
  "tags": [
   "еңіс",
   "түзу"
  ],
  "lesson": 1,
  "anchor": "f-1"
 },
 {
  "id": "pc-line-2pts",
  "name": "Екі нүкте арқылы өтетін түзу",
  "tex": "y-y_1=k(x-x_1)",
  "note": "Алдымен k табылады, содан кейін бір нүкте қойылады.",
  "tags": [
   "түзу",
   "теңдеу"
  ],
  "lesson": 1,
  "anchor": "d-4"
 },
 {
  "id": "pc-even",
  "name": "Жұп функция",
  "tex": "f(-x)=f(x)",
  "note": "Графигі Oy осіне қатысты симметриялы.",
  "tags": [
   "жұп",
   "симметрия"
  ],
  "lesson": 1,
  "anchor": "def-3"
 },
 {
  "id": "pc-odd",
  "name": "Тақ функция",
  "tex": "f(-x)=-f(x)",
  "note": "Графигі координаталар басына қатысты симметриялы.",
  "tags": [
   "тақ",
   "симметрия"
  ],
  "lesson": 1,
  "anchor": "def-3"
 },
 {
  "id": "pc-evenodd",
  "name": "Жұп және тақ бөліктерге жіктеу",
  "tex": "f(x)=\\frac{f(x)+f(-x)}{2}+\\frac{f(x)-f(-x)}{2}",
  "note": "Жіктеу жалғыз: бірінші қосылғыш жұп, екіншісі тақ.",
  "tags": [
   "жұп",
   "тақ",
   "жіктеу"
  ],
  "lesson": 1,
  "anchor": "thm-2"
 },
 {
  "id": "pc-compose",
  "name": "Құрама функция",
  "tex": "(f\\circ g)(x)=f(g(x))",
  "cond": "g(x)\\in D(f)",
  "note": "Алдымен g, содан кейін f қолданылады; реті маңызды.",
  "tags": [
   "құрама функция"
  ],
  "lesson": 1,
  "anchor": "def-4"
 },
 {
  "id": "pc-inverse",
  "name": "Кері функция",
  "tex": "f^{-1}(f(x))=x,\\quad f(f^{-1}(y))=y",
  "note": "Графиктер y=x түзуіне қатысты симметриялы; D(f^{-1})=E(f).",
  "tags": [
   "кері функция"
  ],
  "lesson": 1,
  "anchor": "def-5"
 },
 {
  "id": "pc-quad-vertex",
  "name": "Парабола төбесі",
  "tex": "x_{\\text{в}}=-\\frac{b}{2a},\\quad y_{\\text{в}}=c-\\frac{b^2}{4a}",
  "cond": "a\\ne0",
  "note": "f(x)=ax²+bx+c. a>0 болса төбеде ең кіші, a<0 болса ең үлкен мән.",
  "tags": [
   "парабола",
   "квадраттық функция",
   "төбе"
  ],
  "lesson": 1,
  "anchor": "f-2"
 },
 {
  "id": "pc-vertex-form",
  "name": "Төбелік түр",
  "tex": "f(x)=a(x-m)^2+n",
  "note": "Төбесі (m; n) нүктесінде: m=-b/(2a), n=c-b²/(4a).",
  "tags": [
   "парабола",
   "толық квадрат"
  ],
  "lesson": 1,
  "anchor": "f-3"
 },
 {
  "id": "pc-shift",
  "name": "Графикті жылжыту",
  "tex": "f(x)+c\\ \\uparrow,\\quad f(x+c)\\ \\leftarrow",
  "cond": "c>0",
  "note": "f(x)+c - жоғары; f(x+c) - солға жылжыту.",
  "tags": [
   "түрлендіру",
   "жылжыту"
  ],
  "lesson": 1,
  "anchor": "thm-3"
 },
 {
  "id": "pc-short-mult",
  "name": "Қысқаша көбейту формулалары",
  "tex": "(a\\pm b)^2=a^2\\pm2ab+b^2,\\quad a^2-b^2=(a-b)(a+b)",
  "note": "Квадраттар қосындысы мен айырмасы және оның айырмасын көбейтіндіге жіктеу.",
  "tags": [
   "жіктеу",
   "көбейту формулалары"
  ],
  "lesson": 2,
  "anchor": "f-1"
 },
 {
  "id": "pc-cubes",
  "name": "Текшелердің қосындысы мен айырмасы",
  "tex": "a^3\\pm b^3=(a\\pm b)(a^2\\mp ab+b^2)",
  "note": "Екінші көбейткіш нақты сандар үстінде қосымша жіктелмейді.",
  "tags": [
   "жіктеу",
   "текше"
  ],
  "lesson": 2,
  "anchor": "f-1"
 },
 {
  "id": "pc-disc",
  "name": "Дискриминант",
  "tex": "D=b^2-4ac",
  "cond": "a\\ne0",
  "note": "D>0 - екі түбір, D=0 - бір, D<0 - нақты түбір жоқ.",
  "tags": [
   "квадрат теңдеу",
   "дискриминант"
  ],
  "lesson": 2,
  "anchor": "def-1"
 },
 {
  "id": "pc-quad-roots",
  "name": "Квадрат теңдеудің түбірлері",
  "tex": "x_{1,2}=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}",
  "cond": "a\\ne0,\\ D\\ge0",
  "note": "Толық квадрат бөлуден шығады.",
  "tags": [
   "квадрат теңдеу",
   "түбір"
  ],
  "lesson": 2,
  "anchor": "f-2"
 },
 {
  "id": "pc-vieta",
  "name": "Виет теоремасы",
  "tex": "x_1+x_2=-\\frac ba,\\quad x_1x_2=\\frac ca",
  "cond": "D\\ge0",
  "note": "Түбірлерді табусыз қосындысы мен көбейтіндісін береді.",
  "tags": [
   "Виет",
   "түбір"
  ],
  "lesson": 2,
  "anchor": "thm-3"
 },
 {
  "id": "pc-sq-sum-roots",
  "name": "Түбірлер квадраттарының қосындысы",
  "tex": "x_1^2+x_2^2=(x_1+x_2)^2-2x_1x_2",
  "note": "Симметриялы өрнектерді Виет арқылы жазу.",
  "tags": [
   "Виет",
   "симметриялы өрнек"
  ],
  "lesson": 2,
  "anchor": "f-3"
 },
 {
  "id": "pc-abs-ineq",
  "name": "Модульді теңсіздік",
  "tex": "|u|<a\\iff-a<u<a",
  "cond": "a>0",
  "note": "u қашықтығы a-дан аз. |u|>a үшін u<-a не u>a.",
  "tags": [
   "модуль",
   "теңсіздік"
  ],
  "lesson": 2,
  "anchor": "thm-4"
 },
 {
  "id": "pc-triangle-ineq",
  "name": "Үшбұрыш теңсіздігі",
  "tex": "|u+v|\\le|u|+|v|",
  "note": "Теңдік тек uv≥0 болғанда.",
  "tags": [
   "модуль",
   "теңсіздік"
  ],
  "lesson": 2,
  "anchor": "thm-4"
 },
 {
  "id": "pc-amgm",
  "name": "Орташа мәндер теңсіздігі",
  "tex": "\\frac{a+b}{2}\\ge\\sqrt{ab}",
  "cond": "a,b\\ge0",
  "note": "Теңдік a=b болғанда. Одан x+1/x≥2 (x>0).",
  "tags": [
   "теңсіздік",
   "орташа"
  ],
  "lesson": 2,
  "anchor": "d-5"
 },
 {
  "id": "pc-bezout",
  "name": "Безу теоремасы",
  "tex": "P(x)=(x-a)Q(x)+P(a)",
  "note": "Көпмүшені x-a-ға бөлгендегі қалдық P(a).",
  "tags": [
   "Безу",
   "көпмүшелік",
   "қалдық"
  ],
  "lesson": 3,
  "anchor": "thm-2"
 },
 {
  "id": "pc-horner",
  "name": "Горнер схемасы",
  "tex": "b_{k-1}=a_k+a\\,b_k,\\quad R=a_0+a\\,b_0",
  "note": "x-a-ға бөлудің жылдам тәсілі.",
  "tags": [
   "Горнер",
   "бөлу"
  ],
  "lesson": 3,
  "anchor": "f-1"
 },
 {
  "id": "pc-rational-roots",
  "name": "Рационал түбірлер теоремасы",
  "tex": "\\frac pq:\\ p\\mid a_0,\\ q\\mid a_n",
  "note": "Бүтін коэффициентті көпмүшенің рационал түбірінің үміткерлері.",
  "tags": [
   "түбір",
   "рационал"
  ],
  "lesson": 3,
  "anchor": "thm-5"
 },
 {
  "id": "pc-cubic-vieta",
  "name": "Кубтық Виет",
  "tex": "x_1+x_2+x_3=-\\frac ba,\\ \\ x_1x_2+x_1x_3+x_2x_3=\\frac ca,\\ \\ x_1x_2x_3=-\\frac da",
  "note": "ax^3+bx²+cx+d=0 теңдеуінің түбірлері үшін.",
  "tags": [
   "Виет",
   "көпмүшелік"
  ],
  "lesson": 3,
  "anchor": "f-2"
 },
 {
  "id": "pc-asymptotes",
  "name": "Рационал функцияның асимптоталары",
  "tex": "p<q:\\ y=0;\\ \\ p=q:\\ y=\\frac{a_p}{b_q};\\ \\ p=q+1:\\ \\text{көлбеу}",
  "note": "p, q - алым мен бөлгіш дәрежелері. Тік асимптота - қысқарған бөлгіш нөлі.",
  "tags": [
   "асимптота",
   "рационал функция"
  ],
  "lesson": 3,
  "anchor": "thm-6"
 },
 {
  "id": "pc-partial-fractions",
  "name": "Қарапайым бөлшектерге жіктеу",
  "tex": "\\frac{ux+v}{(x-a)(x-b)}=\\frac A{x-a}+\\frac B{x-b}",
  "cond": "a\\ne b",
  "note": "A=(ua+v)/(a-b), B=(ub+v)/(b-a).",
  "tags": [
   "бөлшек",
   "жіктеу"
  ],
  "lesson": 3,
  "anchor": "f-3"
 },
 {
  "id": "pc-power-laws",
  "name": "Дәреже қасиеттері",
  "tex": "a^ma^n=a^{m+n},\\ (a^m)^n=a^{mn},\\ a^{-n}=\\frac1{a^n}",
  "cond": "a>0",
  "note": "Негіз оң болса, кез келген нақты көрсеткіште.",
  "tags": [
   "дәреже",
   "көрсеткіш"
  ],
  "lesson": 4,
  "anchor": "f-1"
 },
 {
  "id": "pc-log-def",
  "name": "Логарифмнің анықтамасы",
  "tex": "a^x=b\\iff x=\\log_ab",
  "cond": "a>0,\\ a\\ne1,\\ b>0",
  "note": "Негізгі тепе-теңдік: a^{log_ab}=b.",
  "tags": [
   "логарифм"
  ],
  "lesson": 4,
  "anchor": "def-3"
 },
 {
  "id": "pc-log-product",
  "name": "Логарифм қасиеттері",
  "tex": "\\log_a(uv)=\\log_au+\\log_av,\\ \\ \\log_au^r=r\\log_au",
  "cond": "u,v>0",
  "note": "Көбейтінді қосындыға, дәреже көбейтіндіге айналады.",
  "tags": [
   "логарифм",
   "қасиет"
  ],
  "lesson": 4,
  "anchor": "thm-1"
 },
 {
  "id": "pc-log-change",
  "name": "Негізді ауыстыру",
  "tex": "\\log_ab=\\frac{\\ln b}{\\ln a}=\\frac1{\\log_ba}",
  "note": "Кез келген негізде логарифмді натурал логарифм арқылы есептеуге болады.",
  "tags": [
   "логарифм",
   "негіз"
  ],
  "lesson": 4,
  "anchor": "f-2"
 },
 {
  "id": "pc-growth",
  "name": "Өсу және кему моделі",
  "tex": "N(t)=N_0a^{t/T}=N_0e^{kt},\\quad k=\\frac{\\ln a}{T}",
  "note": "Екі еселену не жартылай ыдырау есептері.",
  "tags": [
   "өсу",
   "жартылай ыдырау",
   "экспонента"
  ],
  "lesson": 4,
  "anchor": "f-3"
 },
 {
  "id": "pc-compound",
  "name": "Күрделі пайыз",
  "tex": "A=P\\left(1+\\frac rm\\right)^{mt}\\to Pe^{rt}",
  "note": "m - жылына қосу саны, шегі - үздіксіз қосу.",
  "tags": [
   "пайыз",
   "e саны"
  ],
  "lesson": 4,
  "anchor": "f-4"
 },
 {
  "id": "pc-radian",
  "name": "Радиан, доға және сектор",
  "tex": "\\theta=\\frac lr,\\ \\ l=r\\theta,\\ \\ S=\\frac12r^2\\theta",
  "note": "θ радианмен: 180°=π.",
  "tags": [
   "радиан",
   "доға"
  ],
  "lesson": 5,
  "anchor": "f-1"
 },
 {
  "id": "pc-pyth-id",
  "name": "Негізгі тригонометриялық тепе-теңдік",
  "tex": "\\sin^2\\theta+\\cos^2\\theta=1",
  "note": "Одан 1+tg²θ=1/cos²θ шығады.",
  "tags": [
   "тепе-теңдік",
   "бірлік шеңбер"
  ],
  "lesson": 5,
  "anchor": "thm-1"
 },
 {
  "id": "pc-reduction",
  "name": "Келтіру формулалары",
  "tex": "\\sin(\\pi-\\theta)=\\sin\\theta,\\ \\ \\cos(\\pi-\\theta)=-\\cos\\theta,\\ \\ \\sin\\left(\\tfrac\\pi2-\\theta\\right)=\\cos\\theta",
  "note": "Бірлік шеңбердің симметриясынан шығады.",
  "tags": [
   "келтіру",
   "симметрия"
  ],
  "lesson": 5,
  "anchor": "thm-2"
 },
 {
  "id": "pc-cosine-rule",
  "name": "Косинустар теоремасы",
  "tex": "c^2=a^2+b^2-2ab\\cos C",
  "note": "C=90° болғанда Пифагор теоремасы.",
  "tags": [
   "үшбұрыш",
   "косинус"
  ],
  "lesson": 5,
  "anchor": "thm-3"
 },
 {
  "id": "pc-sine-rule",
  "name": "Синустар теоремасы",
  "tex": "\\frac a{\\sin A}=\\frac b{\\sin B}=\\frac c{\\sin C}",
  "note": "Ауданы S=1/2absin C.",
  "tags": [
   "үшбұрыш",
   "синус"
  ],
  "lesson": 5,
  "anchor": "thm-3"
 },
 {
  "id": "pc-sinusoid",
  "name": "Синусоидалық функция",
  "tex": "y=A\\sin(\\omega x+\\varphi)+D,\\quad T=\\frac{2\\pi}{|\\omega|}",
  "note": "Амплитуда |A|, жылжу -φ/omega, орта сызық y=D.",
  "tags": [
   "синусоида",
   "период",
   "амплитуда"
  ],
  "lesson": 6,
  "anchor": "f-1"
 },
 {
  "id": "pc-addition",
  "name": "Қосу формулалары",
  "tex": "\\sin(\\alpha+\\beta)=\\sin\\alpha\\cos\\beta+\\cos\\alpha\\sin\\beta",
  "note": "cos(α-β)=cosαcosβ+sinαsinβ формуласынан шығады.",
  "tags": [
   "қосу формулалары",
   "синус"
  ],
  "lesson": 6,
  "anchor": "thm-1"
 },
 {
  "id": "pc-double",
  "name": "Қос бұрыш формулалары",
  "tex": "\\sin2\\alpha=2\\sin\\alpha\\cos\\alpha,\\ \\ \\cos2\\alpha=1-2\\sin^2\\alpha=2\\cos^2\\alpha-1",
  "note": "Дәрежені төмендету: sin²α=(1-cos2α)/2.",
  "tags": [
   "қос бұрыш"
  ],
  "lesson": 6,
  "anchor": "thm-2"
 },
 {
  "id": "pc-aux-angle",
  "name": "Көмекші бұрыш",
  "tex": "a\\sin x+b\\cos x=R\\sin(x+\\varphi),\\ \\ R=\\sqrt{a^2+b^2}",
  "note": "Мәндер жиыны [-R;R].",
  "tags": [
   "көмекші бұрыш",
   "амплитуда"
  ],
  "lesson": 6,
  "anchor": "thm-3"
 },
 {
  "id": "pc-inv-trig",
  "name": "Кері тригонометриялық функциялар",
  "tex": "\\arcsin x+\\arccos x=\\frac\\pi2",
  "cond": "|x|\\le1",
  "note": "arcsin: [-π/2;π/2], arccos: [0;π], arctg: (-π/2;π/2).",
  "tags": [
   "арксинус",
   "арккосинус"
  ],
  "lesson": 6,
  "anchor": "thm-4"
 },
 {
  "id": "pc-trig-solutions",
  "name": "Қарапайым тригонометриялық теңдеулер",
  "tex": "\\sin x=a\\iff x=(-1)^k\\arcsin a+\\pi k;\\ \\ \\cos x=a\\iff x=\\pm\\arccos a+2\\pi k",
  "cond": "|a|\\le1",
  "note": "tg x=a: x=arctg a+π k.",
  "tags": [
   "теңдеу",
   "жалпы шешім"
  ],
  "lesson": 6,
  "anchor": "thm-5"
 },
 {
  "id": "pc-ap",
  "name": "Арифметикалық прогрессия",
  "tex": "a_n=a_1+(n-1)d,\\quad S_n=\\frac{n(a_1+a_n)}{2}",
  "note": "Қосындыны Гаусс жұптауымен табады.",
  "tags": [
   "прогрессия",
   "қосынды"
  ],
  "lesson": 7,
  "anchor": "thm-1"
 },
 {
  "id": "pc-gp",
  "name": "Геометриялық прогрессия",
  "tex": "b_n=b_1q^{n-1},\\quad S_n=\\frac{b_1(1-q^n)}{1-q}",
  "note": "qne1.",
  "tags": [
   "прогрессия",
   "қосынды"
  ],
  "lesson": 7,
  "anchor": "thm-2"
 },
 {
  "id": "pc-gp-inf",
  "name": "Шексіз геометриялық қосынды",
  "tex": "S=\\frac{b_1}{1-q}",
  "cond": "|q|<1",
  "note": "Тек |q|<1 болғанда.",
  "tags": [
   "қатар",
   "жинақтылық"
  ],
  "lesson": 7,
  "anchor": "thm-2"
 },
 {
  "id": "pc-sums",
  "name": "Негізгі қосындылар",
  "tex": "\\sum_{k=1}^{n}k=\\frac{n(n+1)}2,\\ \\ \\sum k^2=\\frac{n(n+1)(2n+1)}6,\\ \\ \\sum k^3=\\left(\\frac{n(n+1)}2\\right)^2",
  "note": "Телескоптық қосындыдан немесе индукциядан.",
  "tags": [
   "қосынды",
   "индукция"
  ],
  "lesson": 7,
  "anchor": "thm-3"
 },
 {
  "id": "pc-telescope",
  "name": "Телескоптық қосынды",
  "tex": "\\sum_{k=1}^{n}(a_{k+1}-a_k)=a_{n+1}-a_1",
  "note": "Ішкі мүшелер қысқарады.",
  "tags": [
   "қосынды"
  ],
  "lesson": 7,
  "anchor": "f-1"
 },
 {
  "id": "pc-bernoulli",
  "name": "Бернулли теңсіздігі",
  "tex": "(1+x)^n\\ge1+nx",
  "cond": "x\\ge-1",
  "note": "Индукциямен дәлелденеді.",
  "tags": [
   "индукция",
   "теңсіздік"
  ],
  "lesson": 7,
  "anchor": "thm-4"
 },
 {
  "id": "pc-binet",
  "name": "Бине формуласы",
  "tex": "F_n=\\frac{\\varphi^n-\\psi^n}{\\sqrt5},\\quad \\varphi,\\psi=\\frac{1\\pm\\sqrt5}2",
  "note": "Фибоначчи саны.",
  "tags": [
   "Фибоначчи",
   "рекуррентті"
  ],
  "lesson": 7,
  "anchor": "d-5"
 },
 {
  "id": "pc-annuity",
  "name": "Аннуитет",
  "tex": "FV=P\\frac{(1+r)^n-1}r",
  "note": "Тұрақты жарна жинағы.",
  "tags": [
   "пайыз",
   "қосынды"
  ],
  "lesson": 7,
  "anchor": "f-2"
 }
];
