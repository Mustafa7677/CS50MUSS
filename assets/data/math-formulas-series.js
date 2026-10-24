/* © 2026 Sagid Mustafa. All Rights Reserved. Математика курсы, «Тізбектер және қатарлар» пәні. Формат: docs/MATH-COURSE-GUIDE.md §9.1 (формулалар). */
window.CS50KZ_MATH_FORMULAS = window.CS50KZ_MATH_FORMULAS || {};
window.CS50KZ_MATH_FORMULAS.series = [
 {
  "id": "sr-lim-def",
  "name": "Тізбек шегінің анықтамасы",
  "tex": "\\forall\\varepsilon>0\\ \\exists N\\ \\forall n>N:\\ |a_n-A|<\\varepsilon",
  "note": "N-нен кейінгі барлық мүше A-ның ε-маңайында жатады.",
  "tags": [
   "тізбек",
   "шек",
   "ε-N"
  ],
  "lesson": 1,
  "anchor": "f-1"
 },
 {
  "id": "sr-lim-basic",
  "name": "Негізгі шектер",
  "tex": "q^n\\to0,\\ \\sqrt[n]{n}\\to1,\\ \\sqrt[n]{a}\\to1",
  "cond": "|q|<1,\\ a>0",
  "note": "Қысу теоремасы мен бином теңсіздігімен дәлелденеді.",
  "tags": [
   "шек",
   "геометриялық тізбек"
  ],
  "lesson": 1,
  "anchor": "f-2"
 },
 {
  "id": "sr-e-limit",
  "name": "e саны",
  "tex": "\\lim_{n\\to\\infty}\\left(1+\\frac kn\\right)^n=e^k",
  "note": "k=1 болғанда e санының анықтамасы; k тұрақты.",
  "tags": [
   "e саны",
   "шек"
  ],
  "lesson": 1,
  "anchor": "f-3"
 },
 {
  "id": "sr-sum-def",
  "name": "Қатар қосындысы",
  "tex": "S=\\lim_{N\\to\\infty}S_N,\\ S_N=\\sum_{n=1}^Na_n",
  "note": "Қатардың қосындысы - дербес қосындылар тізбегінің шегі.",
  "tags": [
   "қатар",
   "дербес қосынды"
  ],
  "lesson": 2,
  "anchor": "f-1"
 },
 {
  "id": "sr-geo",
  "name": "Геометриялық қатар",
  "tex": "\\sum_{n=0}^\\infty aq^n=\\frac a{1-q}",
  "cond": "|q|<1",
  "note": "Қосынды = бірінші мүше / (1 − еселік).",
  "tags": [
   "геометриялық қатар",
   "қосынды"
  ],
  "lesson": 2,
  "anchor": "f-2"
 },
 {
  "id": "sr-telescope",
  "name": "Телескоптық қосынды",
  "tex": "\\sum_{n=1}^\\infty(b_n-b_{n+1})=b_1-\\lim b_n",
  "cond": "\\lim b_n\\ \\text{бар}",
  "note": "Көрші мүшелер қысқарады, тек шеткілері қалады.",
  "tags": [
   "телескоптық",
   "қатар"
  ],
  "lesson": 2,
  "anchor": "f-3"
 },
 {
  "id": "sr-harm",
  "name": "Гармоникалық қосындының өсуі",
  "tex": "H_{2^k}\\ge1+\\frac k2",
  "note": "Топтау әдісі: гармоникалық қатар жинақталмайды.",
  "tags": [
   "гармоникалық қатар",
   "жинақталмау"
  ],
  "lesson": 2,
  "anchor": "f-4"
 },
 {
  "id": "sr-pseries",
  "name": "p-қатар",
  "tex": "\\sum_{n=1}^\\infty\\frac1{n^p}\\ \\text{жинақталады}\\iff p>1",
  "note": "Интегралдық белгі арқылы шығады.",
  "tags": [
   "p-қатар",
   "жинақталу"
  ],
  "lesson": 3,
  "anchor": "f-1"
 },
 {
  "id": "sr-bertrand",
  "name": "Бертран қатары",
  "tex": "\\sum_{n=2}^\\infty\\frac1{n(\\ln n)^p}\\ \\text{жинақталады}\\iff p>1",
  "note": "u = ln x алмастыруы.",
  "tags": [
   "интегралдық белгі",
   "логарифм"
  ],
  "lesson": 3,
  "anchor": "f-2"
 },
 {
  "id": "sr-leibniz-rem",
  "name": "Лейбниц қатарының қалдығы",
  "tex": "|S-S_N|\\le a_{N+1}",
  "cond": "a_n\\downarrow0",
  "note": "Бірінші тасталған мүше қателікті бағалайды.",
  "tags": [
   "Лейбниц",
   "қалдық"
  ],
  "lesson": 4,
  "anchor": "f-1"
 },
 {
  "id": "sr-alt-sums",
  "name": "Таңбасы ауыспалы негізгі қосындылар",
  "tex": "\\sum\\frac{(-1)^{n+1}}n=\\ln2,\\ \\sum_{n\\ge0}\\frac{(-1)^n}{2n+1}=\\frac\\pi4",
  "note": "Лейбниц белгісі жинақталуды береді, қосындыны интегралдау арқылы табамыз.",
  "tags": [
   "ln 2",
   "π/4",
   "таңбасы ауыспалы"
  ],
  "lesson": 4,
  "anchor": "f-2"
 },
 {
  "id": "sr-alt-p",
  "name": "(−1)ⁿ/nᵖ қатарының жіктелуі",
  "tex": "p>1\\ \\text{абсолют},\\ 0<p\\le1\\ \\text{шартты}",
  "note": "p ≤ 0 болса қатар жинақталмайды.",
  "tags": [
   "абсолют жинақталу",
   "шартты жинақталу"
  ],
  "lesson": 4,
  "anchor": "f-3"
 },
 {
  "id": "sr-radius",
  "name": "Жинақталу радиусы",
  "tex": "R=\\lim\\left|\\frac{a_n}{a_{n+1}}\\right|",
  "cond": "\\text{шек бар}",
  "note": "Дәрежелік қатар |x − x₀| < R аймағында абсолют жинақталады.",
  "tags": [
   "дәрежелік қатар",
   "радиус"
  ],
  "lesson": 5,
  "anchor": "f-1"
 },
 {
  "id": "sr-pow-basic",
  "name": "Негізгі дәрежелік қатарлар",
  "tex": "\\frac1{1-x}=\\sum x^n,\\ \\ln(1+x)=\\sum\\frac{(-1)^{n+1}x^n}n,\\ \\arctan x=\\sum\\frac{(-1)^nx^{2n+1}}{2n+1}",
  "note": "Радиусы 1; қатарларды геометриялық қатарды интегралдау арқылы алуға болады.",
  "tags": [
   "дәрежелік қатар",
   "ln",
   "arctan"
  ],
  "lesson": 5,
  "anchor": "f-2"
 },
 {
  "id": "sr-nxn",
  "name": "Σ n xⁿ қосындысы",
  "tex": "\\sum_{n=1}^\\infty nx^n=\\frac x{(1-x)^2}",
  "cond": "|x|<1",
  "note": "Геометриялық қатарды дифференциалдау арқылы.",
  "tags": [
   "дәрежелік қатар",
   "қосынды"
  ],
  "lesson": 5,
  "anchor": "f-3"
 },
 {
  "id": "sr-taylor-series",
  "name": "Тейлор қатары",
  "tex": "\\sum_{n=0}^\\infty\\frac{f^{(n)}(a)}{n!}(x-a)^n",
  "note": "a=0 болғанда Маклорен қатары.",
  "tags": [
   "Тейлор",
   "Маклорен"
  ],
  "lesson": 6,
  "anchor": "def-1"
 },
 {
  "id": "sr-exp-sin-cos",
  "name": "e^x, sin x, cos x жіктелулері",
  "tex": "e^x=\\sum\\frac{x^n}{n!},\\ \\sin x=\\sum\\frac{(-1)^nx^{2n+1}}{(2n+1)!},\\ \\cos x=\\sum\\frac{(-1)^nx^{2n}}{(2n)!}",
  "note": "Үшеуі де барлық нақты x үшін жинақталады.",
  "tags": [
   "Маклорен",
   "sin",
   "cos",
   "exp"
  ],
  "lesson": 6,
  "anchor": "f-1"
 },
 {
  "id": "sr-ln-geo-atan",
  "name": "ln, геометриялық, arctan жіктелулері",
  "tex": "\\ln(1+x),\\ \\frac1{1-x},\\ \\arctan x",
  "note": "Қолдану аймағы шектеулі: |x| ≤ 1 (ln үшін x > −1).",
  "tags": [
   "Маклорен",
   "ln"
  ],
  "lesson": 6,
  "anchor": "f-2"
 },
 {
  "id": "sr-binom-series",
  "name": "Биномдық қатар",
  "tex": "(1+x)^\\alpha=\\sum\\binom\\alpha nx^n",
  "cond": "|x|<1",
  "note": "α - кез келген нақты сан.",
  "tags": [
   "биномдық қатар",
   "Маклорен"
  ],
  "lesson": 6,
  "anchor": "f-3"
 },
 {
  "id": "sr-lagrange",
  "name": "Лагранж қалдығы",
  "tex": "R_n(x)=\\frac{f^{(n+1)}(\\xi)}{(n+1)!}(x-a)^{n+1}",
  "note": "ξ нүктесі a мен x арасында жатады.",
  "tags": [
   "қалдық мүше",
   "Тейлор"
  ],
  "lesson": 6,
  "anchor": "f-4"
 }
];
