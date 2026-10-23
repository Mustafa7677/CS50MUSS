/* © 2026 Sagid Mustafa. All Rights Reserved. Математика курсы, «Аналитикалық геометрия» пәні. Формат: docs/MATH-COURSE-GUIDE.md §9.1 (формулалар). */
window.CS50KZ_MATH_FORMULAS = window.CS50KZ_MATH_FORMULAS || {};
window.CS50KZ_MATH_FORMULAS.analgeo = [
 {
  "id": "ag-dist",
  "name": "Екі нүкте арасындағы қашықтық",
  "tex": "|AB|=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}",
  "note": "Пифагор теоремасының координаталық түрі.",
  "tags": [
   "қашықтық",
   "Пифагор"
  ],
  "lesson": 1,
  "anchor": "f-1"
 },
 {
  "id": "ag-section",
  "name": "Кесіндіні берілген қатынаста бөлу",
  "tex": "C=\\frac{A+\\lambda B}{1+\\lambda}",
  "cond": "\\lambda\\ne-1",
  "note": "λ = AC : CB; λ > 0 ішкі, λ < 0 сыртқы бөлу.",
  "tags": [
   "бөлу",
   "қатынас",
   "интерполяция"
  ],
  "lesson": 1,
  "anchor": "f-2"
 },
 {
  "id": "ag-midpoint",
  "name": "Кесіндінің ортасы",
  "tex": "M\\left(\\frac{x_1+x_2}{2};\\frac{y_1+y_2}{2}\\right)",
  "note": "Бөлу формуласының λ = 1 жағдайы; ұшы B = 2M - A.",
  "tags": [
   "орта",
   "кесінді"
  ],
  "lesson": 1,
  "anchor": "f-3"
 },
 {
  "id": "ag-centroid",
  "name": "Үшбұрыштың центроиды",
  "tex": "G\\left(\\frac{x_1+x_2+x_3}{3};\\frac{y_1+y_2+y_3}{3}\\right)",
  "note": "Медианалар төбеден 2 : 1 қатынасында бөлінеді.",
  "tags": [
   "центроид",
   "медиана"
  ],
  "lesson": 1,
  "anchor": "thm-3"
 },
 {
  "id": "ag-triarea",
  "name": "Үшбұрыштың ауданы",
  "tex": "S=\\frac12\\left|(x_2-x_1)(y_3-y_1)-(x_3-x_1)(y_2-y_1)\\right|",
  "note": "Екі вектордың анықтауышының жартысы; S = 0 болса нүктелер бір түзуде.",
  "tags": [
   "аудан",
   "коллинеарлық"
  ],
  "lesson": 1,
  "anchor": "f-4"
 },
 {
  "id": "ag-polyarea",
  "name": "Көпбұрыш ауданы (Гаусс)",
  "tex": "S=\\frac12\\left|\\sum_{i=1}^{n}(x_iy_{i+1}-x_{i+1}y_i)\\right|",
  "note": "Төбелер контур бойымен ретімен жазылады.",
  "tags": [
   "аудан",
   "көпбұрыш",
   "Гаусс"
  ],
  "lesson": 1,
  "anchor": "f-5"
 },
 {
  "id": "ag-polar",
  "name": "Полярлық және декарттық координаталар",
  "tex": "x=r\\cos\\theta,\\ y=r\\sin\\theta",
  "cond": "r\\ge0",
  "note": "Нүктені қашықтық пен бұрыш арқылы беру.",
  "tags": [
   "полярлық координаталар"
  ],
  "lesson": 1,
  "anchor": "f-6"
 },
 {
  "id": "ag-bisector-pts",
  "name": "Екі нүктеден тең қашықтықтағы нүктелер",
  "tex": "2(x_2-x_1)x+2(y_2-y_1)y=x_2^2+y_2^2-x_1^2-y_1^2",
  "cond": "A\\ne B",
  "note": "Орта перпендикуляр теңдеуі.",
  "tags": [
   "орта перпендикуляр",
   "геометриялық орын"
  ],
  "lesson": 1,
  "anchor": "d-5"
 },
 {
  "id": "ag-line-forms",
  "name": "Түзудің теңдеулері",
  "tex": "y=kx+b,\\ \\ y-y_1=k(x-x_1),\\ \\ \\frac xa+\\frac yb=1,\\ \\ Ax+By+C=0",
  "note": "Еңісті, нүкте-еңіс, кесінділік және жалпы түр.",
  "tags": [
   "түзу",
   "еңіс",
   "теңдеу"
  ],
  "lesson": 2,
  "anchor": "f-1"
 },
 {
  "id": "ag-line-param",
  "name": "Түзудің параметрлік теңдеуі",
  "tex": "x=x_0+lt,\\ y=y_0+mt",
  "note": "(l; m) - бағыттаушы вектор.",
  "tags": [
   "параметрлік",
   "бағыттаушы вектор"
  ],
  "lesson": 2,
  "anchor": "f-2"
 },
 {
  "id": "ag-line-normal",
  "name": "Нормаль вектор және еңіс",
  "tex": "\\vec n=(A;B),\\quad k=-\\frac AB",
  "cond": "B\\ne0",
  "note": "Ax + By + C = 0 түзуінің нормалы (A; B).",
  "tags": [
   "нормаль",
   "жалпы теңдеу"
  ],
  "lesson": 2,
  "anchor": "thm-1"
 },
 {
  "id": "ag-line-pos",
  "name": "Түзулердің өзара орналасуы",
  "tex": "A_1B_2-A_2B_1=0\\ \\text{(пар.)},\\ \\ A_1A_2+B_1B_2=0\\ \\text{(перп.)}",
  "note": "Қиылысу: Δ ≠ 0 болса жалғыз нүкте.",
  "tags": [
   "параллель",
   "перпендикуляр",
   "қиылысу"
  ],
  "lesson": 2,
  "anchor": "thm-2"
 },
 {
  "id": "ag-line-angle",
  "name": "Түзулер арасындағы бұрыш",
  "tex": "\\tan\\varphi=\\left|\\frac{k_2-k_1}{1+k_1k_2}\\right|",
  "cond": "1+k_1k_2\\ne0",
  "note": "1 + k₁k₂ = 0 болса бұрыш 90°.",
  "tags": [
   "бұрыш",
   "еңіс"
  ],
  "lesson": 2,
  "anchor": "thm-3"
 },
 {
  "id": "ag-point-line",
  "name": "Нүктеден түзуге дейінгі қашықтық",
  "tex": "d=\\frac{|Ax_0+By_0+C|}{\\sqrt{A^2+B^2}}",
  "note": "Нормаль бағытымен өлшенген қашықтық.",
  "tags": [
   "қашықтық",
   "түзу"
  ],
  "lesson": 2,
  "anchor": "f-3"
 },
 {
  "id": "ag-par-lines",
  "name": "Параллель түзулер арақашықтығы",
  "tex": "d=\\frac{|C_1-C_2|}{\\sqrt{A^2+B^2}}",
  "note": "Коэффициенттер бірдей болуы керек.",
  "tags": [
   "қашықтық",
   "параллель"
  ],
  "lesson": 2,
  "anchor": "thm-4"
 },
 {
  "id": "ag-bisectors",
  "name": "Бұрыш биссектрисалары",
  "tex": "\\frac{A_1x+B_1y+C_1}{N_1}=\\pm\\frac{A_2x+B_2y+C_2}{N_2}",
  "note": "N_i = √(A_i²+B_i²); екі биссектриса перпендикуляр.",
  "tags": [
   "биссектриса"
  ],
  "lesson": 2,
  "anchor": "d-5"
 },
 {
  "id": "ag-circle",
  "name": "Шеңбердің теңдеуі",
  "tex": "(x-a)^2+(y-b)^2=R^2",
  "cond": "R>0",
  "note": "Центр (a; b), радиус R.",
  "tags": [
   "шеңбер",
   "центр",
   "радиус"
  ],
  "lesson": 3,
  "anchor": "f-1"
 },
 {
  "id": "ag-circle-gen",
  "name": "Шеңбердің жалпы теңдеуі",
  "tex": "x^2+y^2+Dx+Ey+F=0,\\ C\\left(-\\tfrac D2;-\\tfrac E2\\right)",
  "cond": "D^2+E^2-4F>0",
  "note": "Нақты шеңбер: D² + E² - 4F > 0.",
  "tags": [
   "шеңбер",
   "толық квадрат"
  ],
  "lesson": 3,
  "anchor": "thm-1"
 },
 {
  "id": "ag-circle-tan",
  "name": "Шеңберге жанама",
  "tex": "(x_0-a)(x-a)+(y_0-b)(y-b)=R^2",
  "note": "Нүкте шеңберде жатуы керек.",
  "tags": [
   "жанама",
   "шеңбер"
  ],
  "lesson": 3,
  "anchor": "f-2"
 },
 {
  "id": "ag-line-circle",
  "name": "Түзу мен шеңбер",
  "tex": "d<R:\\text{ қиюшы},\\ d=R:\\text{ жанама},\\ m^2=R^2(1+k^2)",
  "note": "Хорда ұзындығы 2√(R² - d²).",
  "tags": [
   "жанасу шарты",
   "хорда"
  ],
  "lesson": 3,
  "anchor": "thm-2"
 },
 {
  "id": "ag-ellipse",
  "name": "Эллипстің канондық теңдеуі",
  "tex": "\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1,\\ c^2=a^2-b^2",
  "cond": "a>b>0",
  "note": "|MF₁| + |MF₂| = 2a.",
  "tags": [
   "эллипс",
   "фокус"
  ],
  "lesson": 3,
  "anchor": "thm-4"
 },
 {
  "id": "ag-ellipse-e",
  "name": "Эллипстің эксцентриситеті",
  "tex": "e=\\frac ca\\in[0;1)",
  "note": "e = 0 шеңбер; e → 1 жалпақ эллипс.",
  "tags": [
   "эксцентриситет"
  ],
  "lesson": 3,
  "anchor": "f-3"
 },
 {
  "id": "ag-ellipse-focal",
  "name": "Эллипстің фокалды радиустары",
  "tex": "r_{1,2}=a\\pm ex,\\ x=\\pm\\frac ae",
  "note": "r₁ + r₂ = 2a; директрисалар x = ±a/e.",
  "tags": [
   "фокалды радиус",
   "директриса"
  ],
  "lesson": 3,
  "anchor": "f-4"
 },
 {
  "id": "ag-ellipse-tan",
  "name": "Эллипске жанама және ауданы",
  "tex": "\\frac{x_0x}{a^2}+\\frac{y_0y}{b^2}=1,\\ S=\\pi ab",
  "note": "Параметрлеу: (a cos t; b sin t).",
  "tags": [
   "жанама",
   "аудан",
   "эллипс"
  ],
  "lesson": 3,
  "anchor": "f-5"
 },
 {
  "id": "ag-hyperbola",
  "name": "Гиперболаның канондық теңдеуі",
  "tex": "\\frac{x^2}{a^2}-\\frac{y^2}{b^2}=1,\\ c^2=a^2+b^2",
  "note": "||MF₁| - |MF₂|| = 2a.",
  "tags": [
   "гипербола",
   "фокус"
  ],
  "lesson": 4,
  "anchor": "thm-1"
 },
 {
  "id": "ag-hyp-elem",
  "name": "Гиперболаның элементтері",
  "tex": "e=\\frac ca>1,\\ y=\\pm\\frac bax,\\ x=\\pm\\frac ae",
  "note": "Асимптоталар мен директрисалар.",
  "tags": [
   "асимптота",
   "эксцентриситет"
  ],
  "lesson": 4,
  "anchor": "f-1"
 },
 {
  "id": "ag-hyp-focal",
  "name": "Гиперболаның фокалды радиустары",
  "tex": "r_{1,2}=|ex\\pm a|",
  "note": "|r₁ - r₂| = 2a.",
  "tags": [
   "фокалды радиус"
  ],
  "lesson": 4,
  "anchor": "f-2"
 },
 {
  "id": "ag-parabola",
  "name": "Параболаның канондық теңдеуі",
  "tex": "y^2=2px,\\ F\\left(\\tfrac p2;0\\right),\\ x=-\\tfrac p2",
  "cond": "p>0",
  "note": "Фокус пен директрисадан тең қашықтық.",
  "tags": [
   "парабола",
   "фокус",
   "директриса"
  ],
  "lesson": 4,
  "anchor": "thm-2"
 },
 {
  "id": "ag-par-types",
  "name": "Параболалардың түрлері",
  "tex": "x^2=2py,\\ r=x+\\tfrac p2,\\ y=ax^2:\\ p=\\tfrac{1}{2|a|}",
  "note": "y = ax² графигі де парабола.",
  "tags": [
   "парабола",
   "квадраттық функция"
  ],
  "lesson": 4,
  "anchor": "f-3"
 },
 {
  "id": "ag-tang-cond",
  "name": "Жанасу шарттары",
  "tex": "\\text{эллипс: }m^2=a^2k^2+b^2;\\ \\text{гипербола: }m^2=a^2k^2-b^2;\\ \\text{парабола: }2km=p",
  "note": "y = kx + m түзуі үшін (дискриминант = 0).",
  "tags": [
   "жанасу шарты",
   "дискриминант"
  ],
  "lesson": 4,
  "anchor": "thm-3"
 },
 {
  "id": "ag-par-tan",
  "name": "Параболаға және гиперболаға жанама",
  "tex": "y_0y=p(x+x_0),\\ \\ \\frac{x_0x}{a^2}-\\frac{y_0y}{b^2}=1",
  "note": "(x₀; y₀) қисықта жатады.",
  "tags": [
   "жанама"
  ],
  "lesson": 4,
  "anchor": "thm-3"
 },
 {
  "id": "ag-focus-dir",
  "name": "Фокус-директриса қасиеті",
  "tex": "\\frac{|MF|}{\\operatorname{dist}(M,d)}=e",
  "note": "e < 1 эллипс, e = 1 парабола, e > 1 гипербола.",
  "tags": [
   "эксцентриситет",
   "конус қимасы"
  ],
  "lesson": 4,
  "anchor": "thm-5"
 },
 {
  "id": "ag-translate",
  "name": "Параллель көшіру",
  "tex": "x=x'+x_0,\\ y=y'+y_0",
  "note": "Жаңа бас нүкте (x₀; y₀).",
  "tags": [
   "көшіру",
   "координаталар"
  ],
  "lesson": 5,
  "anchor": "f-1"
 },
 {
  "id": "ag-rotate",
  "name": "Осьтерді бұру",
  "tex": "x=x'\\cos\\varphi-y'\\sin\\varphi,\\ y=x'\\sin\\varphi+y'\\cos\\varphi",
  "note": "φ - қарсы сағат бағытымен бұрыш.",
  "tags": [
   "бұру",
   "координаталар"
  ],
  "lesson": 5,
  "anchor": "f-1"
 },
 {
  "id": "ag-xy-removal",
  "name": "xy мүшесін жою",
  "tex": "\\tan2\\varphi=\\frac{B}{A-C}",
  "cond": "A\\ne C",
  "note": "A = C болса φ = 45°.",
  "tags": [
   "бұру",
   "xy мүшесі"
  ],
  "lesson": 5,
  "anchor": "thm-1"
 },
 {
  "id": "ag-invariants",
  "name": "Инварианттар",
  "tex": "A'+C'=A+C,\\ B'^2-4A'C'=B^2-4AC",
  "note": "Бұру кезінде өзгермейді.",
  "tags": [
   "инвариант",
   "дискриминант"
  ],
  "lesson": 5,
  "anchor": "thm-2"
 },
 {
  "id": "ag-center",
  "name": "Орталық нүкте",
  "tex": "2Ax_0+By_0+D=0,\\ Bx_0+2Cy_0+E=0,\\ F'=F+\\tfrac12(Dx_0+Ey_0)",
  "note": "4AC - B² ≠ 0 болғанда жалғыз орталық.",
  "tags": [
   "орталық",
   "көшіру"
  ],
  "lesson": 5,
  "anchor": "f-2"
 },
 {
  "id": "ag-classify",
  "name": "Қисықты жіктеу",
  "tex": "\\delta=B^2-4AC:\\ \\delta<0\\ \\text{эллипс};\\ \\delta=0\\ \\text{парабола};\\ \\delta>0\\ \\text{гипербола}",
  "note": "Δ = 0 болса қисық азғындалған.",
  "tags": [
   "жіктеу",
   "дискриминант"
  ],
  "lesson": 5,
  "anchor": "thm-3"
 },
 {
  "id": "ag-dist3",
  "name": "Кеңістіктегі қашықтық",
  "tex": "|AB|=\\sqrt{\\Delta x^2+\\Delta y^2+\\Delta z^2}",
  "note": "Үш координата айырмасы.",
  "tags": [
   "қашықтық",
   "кеңістік"
  ],
  "lesson": 6,
  "anchor": "def-1"
 },
 {
  "id": "ag-cross",
  "name": "Векторлық көбейтінді",
  "tex": "\\vec a\\times\\vec b=(a_2b_3-a_3b_2;\\,a_3b_1-a_1b_3;\\,a_1b_2-a_2b_1)",
  "note": "Екі векторға перпендикуляр; ұзындығы параллелограмм ауданы.",
  "tags": [
   "векторлық көбейтінді"
  ],
  "lesson": 6,
  "anchor": "def-2"
 },
 {
  "id": "ag-plane",
  "name": "Жазықтықтың теңдеуі",
  "tex": "Ax+By+Cz+D=0,\\ \\vec n=(A;B;C)",
  "note": "Үш нүкте бойынша: n = AB × AC.",
  "tags": [
   "жазықтық",
   "нормаль"
  ],
  "lesson": 6,
  "anchor": "thm-2"
 },
 {
  "id": "ag-plane-dist",
  "name": "Нүктеден жазықтыққа қашықтық",
  "tex": "d=\\frac{|Ax_0+By_0+Cz_0+D|}{\\sqrt{A^2+B^2+C^2}}",
  "note": "Параллель жазықтықтар: |D₁ - D₂|/|n|.",
  "tags": [
   "қашықтық",
   "жазықтық"
  ],
  "lesson": 6,
  "anchor": "thm-3"
 },
 {
  "id": "ag-plane-angle",
  "name": "Жазықтықтар арасындағы бұрыш",
  "tex": "\\cos\\varphi=\\frac{|\\vec n_1\\cdot\\vec n_2|}{|\\vec n_1||\\vec n_2|}",
  "note": "Нормальдар арасындағы сүйір бұрыш.",
  "tags": [
   "бұрыш",
   "жазықтық"
  ],
  "lesson": 6,
  "anchor": "thm-3"
 },
 {
  "id": "ag-line3",
  "name": "Кеңістіктегі түзу",
  "tex": "\\frac{x-x_0}{l}=\\frac{y-y_0}{m}=\\frac{z-z_0}{n},\\ \\vec s=\\vec n_1\\times\\vec n_2",
  "note": "Екі жазықтықтың қиылысуы.",
  "tags": [
   "түзу",
   "бағыттаушы вектор"
  ],
  "lesson": 6,
  "anchor": "thm-4"
 },
 {
  "id": "ag-line-plane",
  "name": "Түзу мен жазықтық",
  "tex": "\\sin\\psi=\\frac{|\\vec n\\cdot\\vec s|}{|\\vec n||\\vec s|},\\ \\ t=-\\frac{\\vec n\\cdot M_0+D}{\\vec n\\cdot\\vec s}",
  "cond": "\\vec n\\cdot\\vec s\\ne0",
  "note": "Бұрыш пен қиылысу параметрі.",
  "tags": [
   "бұрыш",
   "қиылысу"
  ],
  "lesson": 6,
  "anchor": "thm-4"
 },
 {
  "id": "ag-skew",
  "name": "Айқас түзулердің арақашықтығы",
  "tex": "d=\\frac{|\\overrightarrow{M_1M_2}\\cdot(\\vec s_1\\times\\vec s_2)|}{|\\vec s_1\\times\\vec s_2|}",
  "note": "Ортақ перпендикуляр ұзындығы.",
  "tags": [
   "айқас түзулер"
  ],
  "lesson": 6,
  "anchor": "thm-4"
 },
 {
  "id": "ag-sphere",
  "name": "Сфераның теңдеуі",
  "tex": "(x-a)^2+(y-b)^2+(z-c)^2=R^2",
  "note": "Жазықтықпен қима: ρ = √(R² - d²).",
  "tags": [
   "сфера",
   "қима"
  ],
  "lesson": 6,
  "anchor": "def-4"
 },
 {
  "id": "ag-quadrics",
  "name": "Квадрикалар",
  "tex": "\\frac{x^2}{a^2}+\\frac{y^2}{b^2}+\\frac{z^2}{c^2}=1,\\ z=\\frac{x^2}{a^2}\\pm\\frac{y^2}{b^2}",
  "note": "Эллипсоид, гиперболоидтар, параболоидтар, конус.",
  "tags": [
   "квадрика",
   "бет"
  ],
  "lesson": 6,
  "anchor": "f-2"
 }
];
