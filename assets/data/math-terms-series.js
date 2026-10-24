/* © 2026 Sagid Mustafa. All Rights Reserved. Математика курсы, «Тізбектер және қатарлар» пәні. Формат: §9.2 (терминдер). */
window.CS50KZ_MATH_TERMS = window.CS50KZ_MATH_TERMS || {};
window.CS50KZ_MATH_TERMS.series = [
 {
  "id": "sr-sequence",
  "kz": "сандық тізбек",
  "en": "sequence",
  "def": "Натурал сандар жиынында анықталған функция: a₁, a₂, a₃, ...",
  "lesson": 1
 },
 {
  "id": "sr-limit",
  "kz": "тізбектің шегі",
  "en": "limit",
  "def": "Нөмір өскенде мүшелер жақындайтын сан.",
  "lesson": 1
 },
 {
  "id": "sr-converges",
  "kz": "жинақталады",
  "en": "converges",
  "def": "Тізбектің не қатардың ақырлы шегі бар.",
  "lesson": 1
 },
 {
  "id": "sr-diverges",
  "kz": "жинақталмайды",
  "en": "diverges",
  "def": "Ақырлы шек жоқ: шексіздікке кетеді немесе тербеледі.",
  "lesson": 1
 },
 {
  "id": "sr-bounded",
  "kz": "шектелген тізбек",
  "en": "bounded sequence",
  "def": "Барлық мүшесі |a_n| ≤ M теңсіздігін қанақаттандыратын тізбек.",
  "lesson": 1
 },
 {
  "id": "sr-monotone",
  "kz": "монотонды тізбек",
  "en": "monotone sequence",
  "def": "Өспелі не кемімелі тізбек.",
  "lesson": 1
 },
 {
  "id": "sr-cauchy",
  "kz": "Коши тізбегі",
  "en": "Cauchy sequence",
  "def": "Алыс мүшелері бір-біріне өздері жақындайтын тізбек.",
  "lesson": 1
 },
 {
  "id": "sr-subsequence",
  "kz": "ішкі тізбек",
  "en": "subsequence",
  "def": "Кейбір мүшелерді нөмірлерінің өсу ретімен таңдап алған тізбек.",
  "lesson": 1
 },
 {
  "id": "sr-series",
  "kz": "сан қатары",
  "en": "series",
  "def": "Шексіз қосынды a₁ + a₂ + a₃ + ...",
  "lesson": 2
 },
 {
  "id": "sr-partial-sum",
  "kz": "дербес қосынды",
  "en": "partial sum",
  "def": "Қатардың алғашқы N мүшесінің қосындысы S_N.",
  "lesson": 2
 },
 {
  "id": "sr-sum",
  "kz": "қатардың қосындысы",
  "en": "sum of a series",
  "def": "Дербес қосындылар тізбегінің шегі.",
  "lesson": 2
 },
 {
  "id": "sr-remainder",
  "kz": "қалдық",
  "en": "remainder",
  "def": "Қатар қосындысы мен дербес қосындының айырмасы.",
  "lesson": 2
 },
 {
  "id": "sr-positive-series",
  "kz": "оң мүшелі қатар",
  "en": "positive-term series",
  "def": "Барлық мүшесі теріс емес қатар.",
  "lesson": 3
 },
 {
  "id": "sr-comparison",
  "kz": "салыстыру белгісі",
  "en": "comparison test",
  "def": "Қатарды жинақталуы белгілі қатармен салыстыратын белгі.",
  "lesson": 3
 },
 {
  "id": "sr-ratio-test",
  "kz": "Даламбер белгісі",
  "en": "ratio test",
  "def": "Көрші мүшелер қатынасының шегі бойынша жинақталуды анықтайтын белгі.",
  "lesson": 3
 },
 {
  "id": "sr-root-test",
  "kz": "Коши белгісі",
  "en": "root test",
  "def": "n-ші түбір шегі бойынша жинақталуды анықтайтын белгі.",
  "lesson": 3
 },
 {
  "id": "sr-integral-test",
  "kz": "интегралдық белгі",
  "en": "integral test",
  "def": "Қатар мен меншіксіз интегралдың бір мезгілде жинақталуы.",
  "lesson": 3
 },
 {
  "id": "sr-alternating",
  "kz": "таңбасы ауыспалы қатар",
  "en": "alternating series",
  "def": "Көрші мүшелері қарама-қарсы таңбалы қатар.",
  "lesson": 4
 },
 {
  "id": "sr-abs-conv",
  "kz": "абсолют жинақталу",
  "en": "absolute convergence",
  "def": "Модульдерден құралған қатар жинақталады.",
  "lesson": 4
 },
 {
  "id": "sr-cond-conv",
  "kz": "шартты жинақталу",
  "en": "conditional convergence",
  "def": "Қатар жинақталады, бірақ модульдер қатары жинақталмайды.",
  "lesson": 4
 },
 {
  "id": "sr-power-series",
  "kz": "дәрежелік қатар",
  "en": "power series",
  "def": "Σ aₙ(x − x₀)ⁿ түріндегі қатар.",
  "lesson": 5
 },
 {
  "id": "sr-radius",
  "kz": "жинақталу радиусы",
  "en": "radius of convergence",
  "def": "Қатар абсолют жинақталатын |x − x₀| < R аймағының радиусы.",
  "lesson": 5
 },
 {
  "id": "sr-center",
  "kz": "центр",
  "en": "center",
  "def": "Дәрежелік қатардағы x₀ нүктесі.",
  "lesson": 5
 },
 {
  "id": "sr-taylor-series",
  "kz": "Тейлор қатары",
  "en": "Taylor series",
  "def": "Σ f⁽ⁿ⁾(a)/n! · (x − a)ⁿ қатары.",
  "lesson": 6
 },
 {
  "id": "sr-maclaurin",
  "kz": "Маклорен қатары",
  "en": "Maclaurin series",
  "def": "Центрі a = 0 болатын Тейлор қатары.",
  "lesson": 6
 },
 {
  "id": "sr-taylor-poly",
  "kz": "Тейлор көпмүшелігі",
  "en": "Taylor polynomial",
  "def": "Тейлор қатарының алғашқы n + 1 мүшесінен құралған көпмүшелік.",
  "lesson": 6
 },
 {
  "id": "sr-remainder-term",
  "kz": "қалдық мүше",
  "en": "remainder term",
  "def": "f(x) пен Тейлор көпмүшелігінің айырмасы.",
  "lesson": 6
 }
];
