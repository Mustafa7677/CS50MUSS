# © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама (LICENSE-PROPRIETARY.md, COPYRIGHT.md).
"""«Математика» курсының оқу жолы мен сабақ алғышарттары.

PRE: «slug:k» (k - пән ішіндегі сабақ нөмірі, 1-ден) -> басқа пәндердің сабақтары, оларды алдымен оқу ұсынылады.
     Сол пәннің алдыңғы сабағы (k-1) автоматты түрде қосылады, оны мұнда жазбаймыз.
ROUTE: нөлден университет деңгейіне дейінгі бір реттелген жол (кезеңдер). Әр сабақтың алғышарттары жолда өзінен бұрын тұруы тиіс:
     tools/math_pedagogy.py --check мұны тексереді.
"""

ROUTE = [
    ("Нөлден бастау: арифметика", "Ештеңе білмейтін адамға: сандар, қосу, азайту, көбейту, бөлу, бөлшектер, пайыз, теріс сандар, алғашқы теңдеу.",
     ["arith"]),
    ("Мектеп негізі", "Функция, теңдеу, дәреже, логарифм, тригонометрия. Бұдан кейінгі барлық пән осы тілде жазылған.",
     ["precalc"]),
    ("1-кезең: университеттің 1-курсы", "Сызықтық алгебра, координаталар әдісі, бір айнымалы функцияның анализі және дискретті математика.",
     ["linalg", "analgeo", "diffcalc", "intcalc", "discrete"]),
    ("2-кезең: 2-курс", "Қатарлар, көп айнымалы және векторлық анализ, дифференциалдық теңдеулер, ықтималдық.",
     ["series", "multivar", "veccalc", "ode", "prob"]),
    ("3-кезең: қолданбалы математика", "Статистика, сандық әдістер, оңтайландыру, комплекс анализ, түрлендірулер және дербес туындылы теңдеулер.",
     ["stats", "numerical", "optim", "complex", "transforms", "pde"]),
    ("4-кезең: жоғары курс және магистратура", "Қатаң дәлелдеу тілі: нақты анализ, алгебра, сандар теориясы, топология, геометрия, функционалдық анализ, кездейсоқ процестер.",
     ["real", "numtheory", "abstract", "topology", "diffgeom", "funcanal", "stochastic"]),
]

PRE = {
    # Precalculus арифметикаға сүйенеді
    "precalc:1": ["arith:8"], "precalc:2": ["arith:5", "arith:7", "arith:8"], "precalc:4": ["arith:8"],
    # Linear Algebra
    "linalg:1": ["precalc:2"], "linalg:2": ["precalc:5"], "linalg:8": ["precalc:3"],
    # Analytic Geometry
    "analgeo:1": ["precalc:1", "precalc:2"], "analgeo:5": ["precalc:6"], "analgeo:6": ["linalg:2"],
    # Differential Calculus
    "diffcalc:1": ["precalc:1", "precalc:3"], "diffcalc:2": ["precalc:4", "precalc:6"], "diffcalc:6": ["precalc:4"],
    # Integral Calculus
    "intcalc:1": ["diffcalc:6"], "intcalc:2": ["precalc:7", "diffcalc:3"], "intcalc:6": ["precalc:3", "precalc:6"], "intcalc:7": ["diffcalc:2"],
    # Multivariable Calculus
    "multivar:1": ["diffcalc:4", "analgeo:6"], "multivar:2": ["diffcalc:3"], "multivar:3": ["linalg:2"], "multivar:5": ["diffcalc:8", "linalg:6"],
    "multivar:6": ["intcalc:4"], "multivar:7": ["linalg:6"],
    # Vector Calculus
    "veccalc:1": ["multivar:3"], "veccalc:3": ["intcalc:4"], "veccalc:5": ["multivar:6"], "veccalc:6": ["multivar:7"],
    # Sequences and Series
    "series:1": ["precalc:7", "diffcalc:1"], "series:3": ["intcalc:7"], "series:6": ["diffcalc:7"],
    # ODE
    "ode:1": ["intcalc:1"], "ode:2": ["intcalc:4"], "ode:3": ["intcalc:5"], "ode:4": ["multivar:2"], "ode:5": ["precalc:4"], "ode:7": ["linalg:8"],
    # PDE
    "pde:1": ["multivar:2", "ode:5"], "pde:3": ["transforms:1"], "pde:4": ["veccalc:2"], "pde:5": ["numerical:5"],
    # Complex Analysis
    "complex:1": ["precalc:6"], "complex:2": ["multivar:2"], "complex:3": ["series:5"], "complex:4": ["veccalc:5"], "complex:6": ["intcalc:7"],
    # Fourier & Laplace
    "transforms:1": ["intcalc:5", "series:2"], "transforms:2": ["complex:1"], "transforms:3": ["intcalc:7"], "transforms:4": ["intcalc:7"],
    "transforms:5": ["ode:6", "intcalc:6"], "transforms:6": ["linalg:4"],
    # Probability
    "prob:1": ["precalc:7"], "prob:2": ["discrete:1"], "prob:6": ["intcalc:7"], "prob:7": ["series:1"],
    # Statistics
    "stats:1": ["prob:4"], "stats:2": ["diffcalc:8"], "stats:3": ["prob:7"], "stats:5": ["multivar:5"], "stats:6": ["prob:6"],
    # Discrete
    "discrete:1": ["precalc:1"], "discrete:2": ["precalc:7"],
    # Numerical
    "numerical:1": ["precalc:4"], "numerical:2": ["diffcalc:7"], "numerical:3": ["linalg:5"], "numerical:4": ["precalc:3"],
    "numerical:5": ["intcalc:2", "series:6"], "numerical:6": ["ode:3"],
    # Optimization
    "optim:1": ["multivar:3"], "optim:2": ["linalg:3"], "optim:4": ["multivar:5", "linalg:8"], "optim:6": ["stats:5"],
    # Real Analysis
    "real:1": ["discrete:2"], "real:2": ["series:1"], "real:3": ["diffcalc:3"], "real:4": ["diffcalc:7"], "real:5": ["intcalc:2"],
    "real:6": ["series:5"], "real:7": ["analgeo:1"],
    # Number Theory
    "numtheory:1": ["discrete:2"], "numtheory:3": ["discrete:3"],
    # Abstract Algebra
    "abstract:1": ["discrete:3"], "abstract:2": ["numtheory:1"], "abstract:4": ["discrete:4"], "abstract:5": ["numtheory:3"],
    "abstract:6": ["precalc:3"], "abstract:7": ["linalg:7"],
    # Topology
    "topology:1": ["real:7", "discrete:1"], "topology:2": ["real:3"], "topology:6": ["abstract:1"],
    # Differential Geometry
    "diffgeom:1": ["multivar:3", "intcalc:7"], "diffgeom:2": ["linalg:2"], "diffgeom:3": ["multivar:4"], "diffgeom:4": ["linalg:8"], "diffgeom:5": ["veccalc:5"],
    # Functional Analysis
    "funcanal:1": ["linalg:7", "real:2"], "funcanal:2": ["real:5"], "funcanal:4": ["linalg:4"], "funcanal:6": ["linalg:8"],
    # Stochastic Processes
    "stochastic:1": ["prob:4"], "stochastic:2": ["linalg:4", "prob:3"], "stochastic:3": ["linalg:8"], "stochastic:4": ["prob:5", "prob:6"],
    "stochastic:5": ["prob:7"], "stochastic:6": ["prob:4"],
}
