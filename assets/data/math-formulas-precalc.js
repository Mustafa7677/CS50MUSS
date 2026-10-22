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
 }
];
