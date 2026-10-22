/* © 2026 Sagid Mustafa. All Rights Reserved. Математика курсы, «Жоғары математикаға дайындық» пәні. Формат: docs/MATH-COURSE-GUIDE.md §9.3 (параметрлік есептер банкі). */
window.CS50KZ_MATH_PROBLEMS = window.CS50KZ_MATH_PROBLEMS || {};
window.CS50KZ_MATH_PROBLEMS.precalc = [
 {
  "id": "pc-p-linval",
  "lvl": "easy",
  "type": "num",
  "params": {
   "k": {
    "int": [
     -5,
     5
    ],
    "nz": true
   },
   "b": {
    "int": [
     -9,
     9
    ],
    "nz": true
   },
   "t": {
    "int": [
     -4,
     4
    ],
    "nz": true
   }
  },
  "q": "$f(x)=#{k}x#{+b}$ болса, $f(#{t})$ неге тең?",
  "a": "k*t+b",
  "v": "k*t+b",
  "hint": "x орнына санды қойыңыз.",
  "sol": {
   "steps": [
    "$f(#{t})=#{k}\\cdot #{p:t}#{+b}$."
   ],
   "ans": "$#{k*t+b}$"
  }
 },
 {
  "id": "pc-p-slope",
  "lvl": "easy",
  "type": "num",
  "params": {
   "m": {
    "int": [
     -4,
     4
    ],
    "nz": true
   },
   "dx": {
    "int": [
     1,
     4
    ]
   },
   "xa": {
    "int": [
     -3,
     3
    ]
   },
   "ya": {
    "int": [
     -5,
     5
    ]
   },
   "xb": {
    "calc": "xa+dx"
   },
   "yb": {
    "calc": "ya+m*dx"
   }
  },
  "q": "$A(#{xa};\\,#{ya})$ және $B(#{xb};\\,#{yb})$ нүктелері арқылы өтетін түзудің еңісі қандай?",
  "a": "m",
  "v": "(yb-ya)/(xb-xa)",
  "hint": "$k=\\frac{y_2-y_1}{x_2-x_1}$ формуласын қолданыңыз.",
  "sol": {
   "steps": [
    "$k=\\dfrac{#{yb}-#{p:ya}}{#{xb}-#{p:xa}}$."
   ],
   "ans": "$k=#{m}$"
  }
 },
 {
  "id": "pc-p-vx",
  "lvl": "medium",
  "type": "num",
  "params": {
   "a": {
    "int": [
     1,
     4
    ]
   },
   "m": {
    "int": [
     -5,
     5
    ],
    "not": [
     0
    ]
   },
   "c": {
    "int": [
     -9,
     9
    ]
   },
   "b": {
    "calc": "-2*a*m"
   }
  },
  "q": "$f(x)=#{a}x^2#{+b}x#{+c}$ параболасы төбесінің абсциссасы неге тең?",
  "a": "m",
  "v": "-b/(2*a)",
  "hint": "$x_{\\text{в}}=-\\dfrac{b}{2a}$ формуласын қолданыңыз.",
  "sol": {
   "steps": [
    "$x_{\\text{в}}=-\\dfrac{#{p:b}}{2\\cdot #{a}}$."
   ],
   "ans": "$x_{\\text{в}}=#{m}$"
  }
 },
 {
  "id": "pc-p-vy",
  "lvl": "medium",
  "type": "num",
  "params": {
   "a": {
    "int": [
     2,
     5
    ]
   },
   "m": {
    "int": [
     -4,
     4
    ],
    "not": [
     0
    ]
   },
   "n": {
    "int": [
     -6,
     6
    ],
    "nz": true
   },
   "b": {
    "calc": "-2*a*m"
   },
   "c": {
    "calc": "a*m^2+n"
   }
  },
  "q": "$f(x)=#{a}x^2#{+b}x#{+c}$ параболасы төбесінің ординатасын табыңыз.",
  "a": "n",
  "v": "c-b**2/(4*a)",
  "hint": "Алдымен абсциссасын табыңыз.",
  "sol": {
   "steps": [
    "$x_{\\text{в}}=-\\dfrac{#{p:b}}{2\\cdot #{a}}=#{m}$.",
    "$f(#{m})=#{a}\\cdot #{p:m}^2#{+b}\\cdot #{p:m}#{+c}$."
   ],
   "ans": "$#{n}$"
  }
 },
 {
  "id": "pc-p-inv",
  "lvl": "medium",
  "type": "expr",
  "params": {
   "a": {
    "int": [
     2,
     6
    ]
   },
   "b": {
    "int": [
     -9,
     9
    ],
    "nz": true
   }
  },
  "q": "$f(x)=#{a}x#{+b}$ функциясының кері функциясын жазыңыз: $f^{-1}(x)=\\ ?$",
  "a": "(x-b)/a",
  "v": "solve(Eq(x,a*t+b),t)[0]",
  "hint": "$y=#{a}x#{+b}$ теңдеуін $x$-ке қатысты шешіңіз.",
  "sol": {
   "steps": [
    "$x=\\dfrac{y#{+(-b)}}{#{a}}$."
   ],
   "ans": "$f^{-1}(x)=\\dfrac{x#{+(-b)}}{#{a}}$"
  }
 },
 {
  "id": "pc-p-comp",
  "lvl": "medium",
  "type": "expr",
  "params": {
   "p": {
    "int": [
     2,
     5
    ]
   },
   "q": {
    "int": [
     -5,
     5
    ],
    "nz": true
   },
   "s": {
    "int": [
     -4,
     4
    ],
    "nz": true
   }
  },
  "q": "$f(x)=#{p}x#{+q}$, $g(x)=x^2#{+s}$. $(f\\circ g)(x)=\\ ?$",
  "a": "p*(x^2+s)+q",
  "v": "p*(x**2+s)+q",
  "hint": "$f(g(x))$: $f$-тегі $x$ орнына $g(x)$ қойыңыз.",
  "sol": {
   "steps": [
    "$f(g(x))=#{p}\\,(x^2#{+s})#{+q}$."
   ],
   "ans": "$#{p}x^2#{+p*s+q}$"
  }
 },
 {
  "id": "pc-p-gf",
  "lvl": "hard",
  "type": "num",
  "params": {
   "u": {
    "int": [
     2,
     4
    ]
   },
   "w": {
    "int": [
     -4,
     4
    ],
    "nz": true
   },
   "r": {
    "int": [
     1,
     3
    ]
   },
   "s": {
    "int": [
     -5,
     5
    ],
    "nz": true
   },
   "k": {
    "int": [
     -3,
     3
    ],
    "nz": true
   }
  },
  "q": "$f(x)=#{u}x#{+w}$, $g(x)=#{r}x^2#{+s}$. $g(f(#{k}))$ мәнін табыңыз.",
  "a": "r*(u*k+w)^2+s",
  "v": "r*(u*k+w)**2+s",
  "hint": "Алдымен ішкі функцияны есептеңіз: $f(#{k})$.",
  "sol": {
   "steps": [
    "$f(#{k})=#{u}\\cdot #{p:k}#{+w}=#{u*k+w}$.",
    "$g(#{u*k+w})=#{r}\\cdot #{p:u*k+w}^2#{+s}$."
   ],
   "ans": "$#{r*(u*k+w)^2+s}$"
  }
 },
 {
  "id": "pc-p-dom",
  "lvl": "hard",
  "type": "interval",
  "params": {
   "c": {
    "int": [
     -3,
     3
    ]
   },
   "d": {
    "int": [
     4,
     8
    ]
   }
  },
  "q": "$f(x)=\\dfrac{\\sqrt{x-#{c}}}{x-#{d}}$ функциясының анықталу облысын аралық түрінде жазыңыз.",
  "a": "[#{c}; #{d}) U (#{d}; oo)",
  "v": "continuous_domain(sqrt(x-c)/(x-d), x, S.Reals)",
  "hint": "Түбір астындағы өрнек теріс емес және бөлгіш нөл емес.",
  "sol": {
   "steps": [
    "$x\\ge #{c}$ және $x\\ne #{d}$."
   ],
   "ans": "$[#{c};\\,#{d})\\cup(#{d};\\,+\\infty)$"
  }
 }
];
