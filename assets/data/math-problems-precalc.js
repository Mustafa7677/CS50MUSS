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
 },
 {
  "id": "pc-p-vieta-sum",
  "lvl": "easy",
  "type": "num",
  "params": {
   "r": {
    "int": [
     -4,
     4
    ]
   },
   "d": {
    "int": [
     1,
     5
    ]
   },
   "s": {
    "calc": "r+d"
   },
   "b": {
    "calc": "-(r+s)"
   },
   "c": {
    "calc": "r*s"
   }
  },
  "q": "$x^2#{+b}x#{+c}=0$ теңдеуі түбірлерінің қосындысы қандай?",
  "a": "-b",
  "v": "sum(solve(x**2+b*x+c,x))",
  "hint": "Виет: $x_1+x_2=-\\frac ba$.",
  "sol": {
   "steps": [
    "$a=1$, $b=#{b}$."
   ],
   "ans": "$#{-b}$"
  }
 },
 {
  "id": "pc-p-disc",
  "lvl": "easy",
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
     -7,
     7
    ],
    "nz": true
   },
   "c": {
    "int": [
     -5,
     5
    ],
    "nz": true
   }
  },
  "q": "$#{a}x^2#{+b}x#{+c}=0$ теңдеуінің дискриминанты неге тең?",
  "a": "b^2-4*a*c",
  "v": "b**2-4*a*c",
  "hint": "$D=b^2-4ac$.",
  "sol": {
   "steps": [
    "$D=#{p:b}^2-4\\cdot #{a}\\cdot #{p:c}$."
   ],
   "ans": "$D=#{b^2-4*a*c}$"
  }
 },
 {
  "id": "pc-p-sqsum",
  "lvl": "medium",
  "type": "num",
  "params": {
   "r": {
    "int": [
     -4,
     4
    ],
    "nz": true
   },
   "d": {
    "int": [
     1,
     5
    ]
   },
   "s": {
    "calc": "r+d"
   },
   "b": {
    "calc": "-(r+s)"
   },
   "c": {
    "calc": "r*s"
   }
  },
  "q": "$x^2#{+b}x#{+c}=0$ түбірлері $x_1,x_2$. $x_1^2+x_2^2=\\ ?$",
  "a": "b^2-2*c",
  "v": "sum([t**2 for t in solve(x**2+b*x+c,x)])",
  "hint": "$(x_1+x_2)^2-2x_1x_2$.",
  "sol": {
   "steps": [
    "$(#{-b})^2-2\\cdot #{p:c}$."
   ],
   "ans": "$#{b^2-2*c}$"
  }
 },
 {
  "id": "pc-p-rem",
  "lvl": "easy",
  "type": "num",
  "params": {
   "b": {
    "int": [
     -5,
     5
    ],
    "nz": true
   },
   "c": {
    "int": [
     -5,
     5
    ],
    "nz": true
   },
   "t": {
    "int": [
     -3,
     3
    ],
    "nz": true
   }
  },
  "q": "$x^2#{+b}x#{+c}$ көпмүшесін $x-#{p:t}$ екімүшесіне бөлгендегі қалдық?",
  "a": "t^2+b*t+c",
  "v": "Poly(x**2+b*x+c,x).rem(Poly(x-t,x)).as_expr()",
  "hint": "Безу: қалдық - көпмүшенің мәні.",
  "sol": {
   "steps": [
    "$P(#{t})$ есептейміз."
   ],
   "ans": "$#{t^2+b*t+c}$"
  }
 },
 {
  "id": "pc-p-vieta3",
  "lvl": "hard",
  "type": "num",
  "params": {
   "r": {
    "int": [
     -3,
     3
    ],
    "nz": true
   },
   "s": {
    "int": [
     -3,
     3
    ],
    "nz": true
   },
   "t": {
    "int": [
     -3,
     3
    ],
    "nz": true
   },
   "b": {
    "calc": "-(r+s+t)"
   },
   "c": {
    "calc": "r*s+r*t+s*t"
   },
   "d": {
    "calc": "-r*s*t"
   }
  },
  "require": [
   "r != s",
   "s != t",
   "r != t"
  ],
  "q": "$x^3#{+b}x^2#{+c}x#{+d}=0$ түбірлерінің квадраттарының қосындысы?",
  "a": "b^2-2*c",
  "v": "sum([q**2 for q in solve(x**3+b*x**2+c*x+d,x)])",
  "hint": "Кубтық Виет.",
  "sol": {
   "steps": [
    "$(x_1+x_2+x_3)^2-2(x_1x_2+x_1x_3+x_2x_3)$."
   ],
   "ans": "$#{b^2-2*c}$"
  }
 },
 {
  "id": "pc-p-exp",
  "lvl": "easy",
  "type": "num",
  "params": {
   "a": {
    "pick": [
     2,
     3,
     5
    ]
   },
   "k": {
    "int": [
     3,
     6
    ]
   },
   "m": {
    "int": [
     1,
     2
    ]
   },
   "n": {
    "calc": "a^k"
   }
  },
  "q": "$#{a}^{x+#{m}}=#{n}$ теңдеуін шешіңіз: $x=\\ ?$",
  "a": "k-m",
  "v": "solve(Eq(a**(x+m),n),x)[0]",
  "hint": "$#{n}=#{a}^{#{k}}$.",
  "sol": {
   "steps": [
    "$x+#{m}=#{k}$."
   ],
   "ans": "$#{k-m}$"
  }
 },
 {
  "id": "pc-p-logeq",
  "lvl": "medium",
  "type": "num",
  "params": {
   "b": {
    "pick": [
     2,
     3,
     5
    ]
   },
   "k": {
    "int": [
     2,
     4
    ]
   },
   "m": {
    "int": [
     1,
     6
    ]
   }
  },
  "q": "$\\log_{#{b}}(x+#{m})=#{k}$ теңдеуін шешіңіз: $x=\\ ?$",
  "a": "b^k-m",
  "v": "solve(Eq(x+m,b**k),x)[0]",
  "hint": "Логарифм анықтамасы.",
  "sol": {
   "steps": [
    "$x+#{m}=#{b}^{#{k}}$."
   ],
   "ans": "$#{b^k-m}$"
  }
 },
 {
  "id": "pc-p-halflife",
  "lvl": "medium",
  "type": "num",
  "params": {
   "m": {
    "pick": [
     64,
     80,
     96,
     160
    ]
   },
   "T": {
    "int": [
     2,
     5
    ]
   },
   "j": {
    "int": [
     1,
     4
    ]
   },
   "t": {
    "calc": "T*j"
   }
  },
  "q": "Жартылай ыдырау периоды #{T} тәулік. Басында #{m} г. #{t} тәуліктен кейін қанша грамм қалады?",
  "a": "m/2^j",
  "v": "m*Rational(1,2)**(t/T)",
  "hint": "Периодтар санын табыңыз.",
  "sol": {
   "steps": [
    "$#{m}\\cdot\\left(\\frac12\\right)^{#{j}}$."
   ],
   "ans": "$#{m/2^j}$"
  }
 },
 {
  "id": "pc-p-sector",
  "lvl": "medium",
  "type": "num",
  "params": {
   "r": {
    "int": [
     2,
     8
    ]
   },
   "k": {
    "int": [
     1,
     5
    ]
   }
  },
  "q": "Радиусы #{r} шеңбердің $\\theta=\\dfrac{#{k}\\pi}{3}$ рад бұрышына сәйкес сектор ауданы қанша?",
  "a": "r^2*k*pi/6",
  "v": "Rational(1,2)*r**2*(k*pi/3)",
  "hint": "$S=\\frac12r^2\\theta$.",
  "sol": {
   "steps": [
    "$\\frac12\\cdot #{r}^2\\cdot\\frac{#{k}\\pi}{3}$."
   ],
   "ans": "$\\frac{#{r*r*k}\\pi}{6}$"
  }
 },
 {
  "id": "pc-p-cos",
  "lvl": "hard",
  "type": "num",
  "params": {
   "m": {
    "int": [
     2,
     5
    ]
   },
   "n": {
    "int": [
     1,
     4
    ]
   }
  },
  "require": [
   "m > n"
  ],
  "q": "$\\theta$ - I ширек, $\\tan\\theta=\\dfrac{#{2*m*n}}{#{m^2-n^2}}$. $\\cos\\theta=\\ ?$",
  "a": "(m^2-n^2)/(m^2+n^2)",
  "v": "1/sqrt(1+(2*m*n/(m**2-n**2))**2)",
  "hint": "$1+\\tan^2\\theta=\\frac1{\\cos^2\\theta}$.",
  "sol": {
   "steps": [
    "Гипотенуза $#{m^2+n^2}$."
   ],
   "ans": "$#{f:(m^2-n^2)/(m^2+n^2)}$"
  }
 },
 {
  "id": "pc-p-amp",
  "lvl": "medium",
  "type": "num",
  "params": {
   "m": {
    "int": [
     2,
     5
    ]
   },
   "n": {
    "int": [
     1,
     4
    ]
   },
   "a": {
    "calc": "m^2-n^2"
   },
   "b": {
    "calc": "2*m*n"
   }
  },
  "require": [
   "m > n"
  ],
  "q": "$y=#{a}\\sin x#{+b}\\cos x$ функциясының ең үлкен мәні?",
  "a": "m^2+n^2",
  "v": "sqrt((m**2-n**2)**2+(2*m*n)**2)",
  "hint": "$R=\\sqrt{a^2+b^2}$.",
  "sol": {
   "steps": [
    "$\\sqrt{#{a^2+b^2}}$."
   ],
   "ans": "$#{m^2+n^2}$"
  }
 },
 {
  "id": "pc-p-shift",
  "lvl": "hard",
  "type": "num",
  "params": {
   "b": {
    "pick": [
     2,
     3,
     4,
     5
    ]
   },
   "c": {
    "int": [
     1,
     7
    ]
   }
  },
  "q": "$y=\\sin(#{b}x-#{c})$ графигі $y=\\sin(#{b}x)$ графигінен қанша оңға жылжыған?",
  "a": "c/b",
  "v": "solve(Eq(b*x-c,0),x)[0]",
  "hint": "Жақша сыртына шығарыңыз.",
  "sol": {
   "steps": [
    "$\\sin\\left(#{b}\\left(x-\\frac{#{c}}{#{b}}\\right)\\right)$."
   ],
   "ans": "$#{f:c/b}$"
  }
 },
 {
  "id": "pc-p-ap",
  "lvl": "easy",
  "type": "num",
  "params": {
   "a": {
    "int": [
     -5,
     9
    ]
   },
   "d": {
    "int": [
     2,
     6
    ]
   },
   "n": {
    "int": [
     8,
     25
    ]
   }
  },
  "q": "Арифметикалық прогрессияда $a_1=#{a}$, $d=#{d}$. $a_{#{n}}=\\ ?$",
  "a": "a+(n-1)*d",
  "v": "a+d*(n-1)",
  "hint": "$a_n=a_1+(n-1)d$.",
  "sol": {
   "steps": [
    "$#{a}+#{n-1}\\cdot #{d}$."
   ],
   "ans": "$#{a+(n-1)*d}$"
  }
 },
 {
  "id": "pc-p-apsum",
  "lvl": "medium",
  "type": "num",
  "params": {
   "a": {
    "int": [
     1,
     8
    ]
   },
   "d": {
    "int": [
     2,
     5
    ]
   },
   "n": {
    "int": [
     10,
     30
    ]
   }
  },
  "q": "$a_1=#{a}$, $d=#{d}$ арифметикалық прогрессияның алғашқы #{n} мүшесінің қосындысы?",
  "a": "n*(2*a+(n-1)*d)/2",
  "v": "summation(a+d*(k-1),(k,1,n))",
  "hint": "$S_n=\\frac{n(2a_1+(n-1)d)}2$.",
  "sol": {
   "steps": [
    "Формулаға қоямыз."
   ],
   "ans": "$#{n*(2*a+(n-1)*d)/2}$"
  }
 },
 {
  "id": "pc-p-gpinf",
  "lvl": "hard",
  "type": "num",
  "params": {
   "a": {
    "int": [
     2,
     12
    ]
   },
   "m": {
    "pick": [
     2,
     3,
     4,
     5
    ]
   }
  },
  "q": "$#{a}+\\dfrac{#{a}}{#{m}}+\\dfrac{#{a}}{#{m}^2}+\\dots$ шексіз қосындысы?",
  "a": "a*m/(m-1)",
  "v": "summation(a*Rational(1,m)**k,(k,0,oo))",
  "hint": "$\\frac{b_1}{1-q}$, $q=\\frac1{#{m}}$.",
  "sol": {
   "steps": [
    "$\\frac{#{a}}{1-1/#{m}}$."
   ],
   "ans": "$#{f:a*m/(m-1)}$"
  }
 },
 {
  "id": "pc-p-sumlin",
  "lvl": "medium",
  "type": "num",
  "params": {
   "a": {
    "int": [
     2,
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
   "n": {
    "int": [
     10,
     40
    ]
   }
  },
  "q": "$\\sum_{k=1}^{#{n}}(#{a}k#{+b})=\\ ?$",
  "a": "a*n*(n+1)/2+b*n",
  "v": "summation(a*k+b,(k,1,n))",
  "hint": "$\\sum k=\\frac{n(n+1)}2$.",
  "sol": {
   "steps": [
    "$#{a}\\sum k+#{b}\\cdot #{n}$."
   ],
   "ans": "$#{a*n*(n+1)/2+b*n}$"
  }
 },
 {
  "id": "pc-p-qineq",
  "lvl": "medium",
  "type": "interval",
  "params": {
   "r": {
    "int": [
     -5,
     2
    ]
   },
   "d": {
    "int": [
     1,
     6
    ]
   },
   "s": {
    "calc": "r+d"
   },
   "b": {
    "calc": "-(r+s)"
   },
   "c": {
    "calc": "r*s"
   }
  },
  "q": "$x^2#{+b}x#{+c}&lt;0$ теңсіздігін шешіңіз.",
  "a": "(#{r}; #{s})",
  "v": "solveset(x**2+b*x+c<0, x, S.Reals)",
  "hint": "Түбірлерін тауып, параболаның тармақтарын қараңыз.",
  "sol": {
   "steps": [
    "Түбірлер $#{r}$ және $#{s}$."
   ],
   "ans": "$(#{r};#{s})$"
  }
 },
 {
  "id": "pc-p-expand",
  "lvl": "medium",
  "type": "expr",
  "params": {
   "u": {
    "int": [
     1,
     5
    ]
   },
   "w": {
    "int": [
     1,
     5
    ]
   }
  },
  "q": "$(x+#{u})^2-(x-#{w})^2$ өрнегін ықшамдаңыз.",
  "a": "2*(u+w)*x+u^2-w^2",
  "v": "(x+u)**2-(x-w)**2",
  "hint": "Квадраттар айырмасы не жақшаны ашу.",
  "sol": {
   "steps": [
    "$(x+#{u}-x+#{w})(x+#{u}+x-#{w})$."
   ],
   "ans": "$#{2*(u+w)}x#{+(u^2-w^2)}$"
  }
 }
];
