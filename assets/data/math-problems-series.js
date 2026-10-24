/* © 2026 Sagid Mustafa. All Rights Reserved. Математика курсы, «Тізбектер және қатарлар» пәні. Формат: §9.3 (параметрлік есептер банкі). */
window.CS50KZ_MATH_PROBLEMS = window.CS50KZ_MATH_PROBLEMS || {};
window.CS50KZ_MATH_PROBLEMS.series = [
 {
  "id": "sr-p-ratio-lim",
  "lvl": "easy",
  "type": "num",
  "params": {
   "a": {
    "int": [
     1,
     6
    ]
   },
   "b": {
    "int": [
     -5,
     5
    ],
    "nz": true
   },
   "c": {
    "int": [
     1,
     6
    ]
   },
   "d": {
    "int": [
     -5,
     5
    ],
    "nz": true
   }
  },
  "q": "$\\displaystyle\\lim_{n\\to\\infty}\\frac{#{a}n#{+b}}{#{c}n#{+d}}$ неге тең?",
  "a": "a/c",
  "v": "limit((a*n+b)/(c*n+d), n, oo)",
  "hint": "Алым мен бөлгішті $n$-ге бөліңіз.",
  "sol": {
   "steps": [
    "$\\dfrac{#{a}+#{b}/n}{#{c}+#{d}/n}\\to\\dfrac{#{a}}{#{c}}$."
   ],
   "ans": "$#{f:a/c}$"
  }
 },
 {
  "id": "sr-p-geo-term",
  "lvl": "easy",
  "type": "num",
  "params": {
   "A": {
    "int": [
     1,
     5
    ]
   },
   "r": {
    "pick": [
     2,
     3
    ]
   },
   "k": {
    "int": [
     4,
     6
    ]
   }
  },
  "q": "$a_1=#{A}$, $a_{n+1}=#{r}a_n$ болса, $a_{#{k}}$ неге тең?",
  "a": "A*r^(k-1)",
  "v": "A*r**(k-1)",
  "hint": "$a_n=a_1r^{n-1}$.",
  "sol": {
   "steps": [
    "$a_{#{k}}=#{A}\\cdot #{r}^{#{k-1}}$."
   ],
   "ans": "$#{A*r^(k-1)}$"
  }
 },
 {
  "id": "sr-p-geo-sum",
  "lvl": "easy",
  "type": "num",
  "params": {
   "A": {
    "int": [
     1,
     9
    ]
   },
   "m": {
    "int": [
     2,
     6
    ]
   }
  },
  "q": "$\\displaystyle\\sum_{n=0}^\\infty #{A}\\left(\\frac1{#{m}}\\right)^n$ қосындысы?",
  "a": "A*m/(m-1)",
  "v": "summation(A*Rational(1, m)**k, (k, 0, oo))",
  "hint": "$\\frac a{1-q}$.",
  "sol": {
   "steps": [
    "$S=\\dfrac{#{A}}{1-1/#{m}}$."
   ],
   "ans": "$#{f:A*m/(m-1)}$"
  }
 },
 {
  "id": "sr-p-tele",
  "lvl": "medium",
  "type": "num",
  "params": {
   "s": {
    "int": [
     0,
     6
    ]
   }
  },
  "q": "$\\displaystyle\\sum_{n=1}^\\infty\\frac1{(n+#{s})(n+#{s+1})}$ қосындысы?",
  "a": "1/(s+1)",
  "v": "summation(1/((k+s)*(k+s+1)), (k, 1, oo))",
  "hint": "Қарапайым бөлшектерге жіктеңіз.",
  "sol": {
   "steps": [
    "Қысқарып, бірінші мүше қалады: $\\frac1{#{s+1}}$."
   ],
   "ans": "$#{f:1/(s+1)}$"
  }
 },
 {
  "id": "sr-p-tail",
  "lvl": "medium",
  "type": "num",
  "params": {
   "k": {
    "int": [
     1,
     6
    ]
   }
  },
  "q": "$\\displaystyle\\sum_{n=#{k}}^\\infty\\left(\\frac12\\right)^n$ қосындысы?",
  "a": "2^(1-k)",
  "v": "summation(Rational(1, 2)**n, (n, k, oo))",
  "hint": "Бірінші мүше $2^{-#{k}}$.",
  "sol": {
   "steps": [
    "$S=\\dfrac{2^{-#{k}}}{1/2}$."
   ],
   "ans": "$#{f:2^(1-k)}$"
  }
 },
 {
  "id": "sr-p-nxn",
  "lvl": "medium",
  "type": "num",
  "params": {
   "m": {
    "int": [
     2,
     6
    ]
   }
  },
  "q": "$\\displaystyle\\sum_{n=1}^\\infty\\frac n{#{m}^n}$ қосындысы?",
  "a": "m/(m-1)^2",
  "v": "summation(k*Rational(1, m)**k, (k, 1, oo))",
  "hint": "$\\sum nx^n=\\frac x{(1-x)^2}$.",
  "sol": {
   "steps": [
    "$x=\\frac1{#{m}}$."
   ],
   "ans": "$#{f:m/(m-1)^2}$"
  }
 },
 {
  "id": "sr-p-p-int",
  "lvl": "easy",
  "type": "num",
  "params": {
   "p": {
    "int": [
     2,
     6
    ]
   }
  },
  "q": "$\\displaystyle\\int_1^\\infty\\frac{dx}{x^{#{p}}}$ неге тең?",
  "a": "1/(p-1)",
  "v": "integrate(x**(-p), (x, 1, oo))",
  "hint": "$\\int_1^Mx^{-p}dx$ есептеңіз.",
  "sol": {
   "steps": [
    "$\\left[\\frac{x^{1-p}}{1-p}\\right]_1^\\infty=\\frac1{p-1}$."
   ],
   "ans": "$#{f:1/(p-1)}$"
  }
 },
 {
  "id": "sr-p-ratio-d",
  "lvl": "medium",
  "type": "num",
  "params": {
   "c": {
    "int": [
     1,
     5
    ]
   },
   "e": {
    "int": [
     1,
     4
    ]
   },
   "d": {
    "calc": "c+e"
   }
  },
  "q": "$a_n=\\dfrac{n^2\\cdot #{c}^n}{#{d}^n}$ үшін $\\displaystyle\\lim\\frac{a_{n+1}}{a_n}$?",
  "a": "c/d",
  "v": "limit(((n+1)**2*c**(n+1)/d**(n+1))/(n**2*c**n/d**n), n, oo)",
  "hint": "$\\left(\\frac{n+1}n\\right)^2\\to1$.",
  "sol": {
   "steps": [
    "$D=\\frac{#{c}}{#{d}}$."
   ],
   "ans": "$#{f:c/d}$"
  }
 },
 {
  "id": "sr-p-root-e",
  "lvl": "hard",
  "type": "num",
  "params": {
   "a": {
    "int": [
     1,
     4
    ]
   },
   "b": {
    "int": [
     1,
     4
    ]
   }
  },
  "q": "$\\displaystyle\\lim\\left(\\frac{#{a}n}{#{a}n+#{b}}\\right)^n$ (ондық, допуск $0{,}01$)?",
  "a": "exp(-b/a)",
  "v": "limit((a*n/(a*n+b))**n, n, oo)",
  "hint": "$e$ санына келтіріңіз.",
  "sol": {
   "steps": [
    "$\\left(1+\\frac{#{b}/#{a}}n\\right)^{-n}\\to e^{-#{b}/#{a}}$."
   ],
   "ans": "$e^{-#{b}/#{a}}$"
  },
  "tol": 0.01
 },
 {
  "id": "sr-p-alt-geo",
  "lvl": "medium",
  "type": "num",
  "params": {
   "k": {
    "int": [
     2,
     6
    ]
   }
  },
  "q": "$\\displaystyle\\sum_{n=0}^\\infty\\left(-\\frac1{#{k}}\\right)^n$ қосындысы?",
  "a": "k/(k+1)",
  "v": "summation(Rational(-1, k)**n, (n, 0, oo))",
  "hint": "$q=-\\frac1{#{k}}$.",
  "sol": {
   "steps": [
    "$S=\\dfrac1{1+1/#{k}}$."
   ],
   "ans": "$#{f:k/(k+1)}$"
  }
 },
 {
  "id": "sr-p-alt-err",
  "lvl": "hard",
  "type": "num",
  "params": {
   "s": {
    "int": [
     7,
     20
    ]
   },
   "m": {
    "calc": "s^2"
   }
  },
  "q": "$\\sum\\frac{(-1)^{n+1}}{n^2}$ қатарын $\\frac1{#{m}}$-нен кіші қателікпен жуықтау үшін Лейбниц бағасы бойынша ең кіші $N$?",
  "a": "s",
  "v": "min([N for N in range(1, 500) if Rational(1, (N+1)**2) < Rational(1, m)])",
  "hint": "$(N+1)^2>#{m}$.",
  "sol": {
   "steps": [
    "$N+1>#{s}$, $N=#{s}$."
   ],
   "ans": "$#{s}$"
  }
 },
 {
  "id": "sr-p-radius",
  "lvl": "medium",
  "type": "num",
  "params": {
   "a": {
    "int": [
     2,
     6
    ]
   }
  },
  "q": "$\\displaystyle\\sum\\frac{#{a}^n}nx^n$ қатарының радиусы $R$?",
  "a": "1/a",
  "v": "limit(abs((a**n/n)/(a**(n+1)/(n+1))), n, oo)",
  "hint": "$\\frac{a_n}{a_{n+1}}\\to\\frac1{#{a}}$.",
  "sol": {
   "steps": [
    "$R=\\frac1{#{a}}$."
   ],
   "ans": "$#{f:1/a}$"
  }
 },
 {
  "id": "sr-p-pow-sum",
  "lvl": "medium",
  "type": "num",
  "params": {
   "m": {
    "int": [
     3,
     7
    ]
   },
   "p": {
    "int": [
     1,
     2
    ]
   }
  },
  "q": "$\\displaystyle\\sum_{n=0}^\\infty\\left(\\frac x{#{m}}\\right)^n$ қосындысын $x=#{p}$ нүктесінде табыңыз.",
  "a": "m/(m-p)",
  "v": "summation(Rational(p, m)**n, (n, 0, oo))",
  "hint": "$q=\\frac{#{p}}{#{m}}$.",
  "sol": {
   "steps": [
    "$S=\\frac{#{m}}{#{m}-#{p}}$."
   ],
   "ans": "$#{f:m/(m-p)}$"
  }
 },
 {
  "id": "sr-p-exp-deriv",
  "lvl": "medium",
  "type": "num",
  "params": {
   "a": {
    "int": [
     2,
     4
    ]
   },
   "k": {
    "int": [
     3,
     5
    ]
   }
  },
  "q": "$f(x)=e^{#{a}x}$ болса, $f^{(#{k})}(0)$ неге тең?",
  "a": "a^k",
  "v": "diff(exp(a*x), x, k).subs(x, 0)",
  "hint": "$e^{#{a}x}=\\sum\\frac{(#{a}x)^n}{n!}$.",
  "sol": {
   "steps": [
    "$f^{(#{k})}(0)=#{a}^{#{k}}$."
   ],
   "ans": "$#{a^k}$"
  }
 },
 {
  "id": "sr-p-coef-x3",
  "lvl": "medium",
  "type": "num",
  "params": {
   "a": {
    "int": [
     1,
     4
    ]
   }
  },
  "q": "$e^{#{a}x}$ қатарындағы $x^3$ коэффициенті?",
  "a": "a^3/6",
  "v": "series(exp(a*x), x, 0, 4).removeO().coeff(x, 3)",
  "hint": "$\\frac{(#{a}x)^3}{3!}$.",
  "sol": {
   "steps": [
    "$\\frac{#{a}^3}6$."
   ],
   "ans": "$#{f:a^3/6}$"
  }
 },
 {
  "id": "sr-p-geo-coef",
  "lvl": "hard",
  "type": "num",
  "params": {
   "a": {
    "int": [
     2,
     5
    ]
   },
   "n": {
    "int": [
     3,
     5
    ]
   }
  },
  "q": "$\\dfrac1{1-#{a}x}$ қатарындағы $x^{#{n}}$ коэффициенті?",
  "a": "a^n",
  "v": "series(1/(1-a*x), x, 0, n+1).removeO().coeff(x, n)",
  "hint": "$\\sum(#{a}x)^k$.",
  "sol": {
   "steps": [
    "$#{a}^{#{n}}$."
   ],
   "ans": "$#{a^n}$"
  }
 }
];
