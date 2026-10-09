// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-pagerank": {
  "title": "PageRank",
  "file": "pagerank.py",
  "starter": "import random\n\nDAMPING = 0.85\nSAMPLES = 10000\n\n\ndef transition_model(corpus, page, damping_factor):\n    # TODO: келесі бетке өту ықтималдықтарының сөздігін қайтарыңыз\n    raise NotImplementedError\n\n\ndef sample_pagerank(corpus, damping_factor, n):\n    # TODO: Марков тізбегінен n үлгі алып, PageRank-ті бағалаңыз\n    raise NotImplementedError\n\n\ndef iterate_pagerank(corpus, damping_factor):\n    # TODO: PageRank формуласын 0.001 дәлдікке дейін қайталаңыз\n    raise NotImplementedError\n",
  "tests": [
   {
    "n": "transition_model: ресми мысал (1.html)",
    "in": [],
    "append": "corpus_o = {\"1.html\": {\"2.html\", \"3.html\"}, \"2.html\": {\"3.html\"}, \"3.html\": {\"2.html\"}}\nprint({k: round(v, 4) for k, v in sorted(transition_model(corpus_o, '1.html', 0.85).items())})",
    "out": "{'1.html': 0.05, '2.html': 0.475, '3.html': 0.475}"
   },
   {
    "n": "transition_model: corpus0, 2.html, d = 0.85",
    "in": [],
    "append": "corpus0 = {\n    \"1.html\": {\"2.html\"},\n    \"2.html\": {\"1.html\", \"3.html\"},\n    \"3.html\": {\"2.html\", \"4.html\"},\n    \"4.html\": {\"2.html\"},\n}\nprint({k: round(v, 4) for k, v in sorted(transition_model(corpus0, '2.html', 0.85).items())})",
    "out": "{'1.html': 0.4625, '2.html': 0.0375, '3.html': 0.4625, '4.html': 0.0375}"
   },
   {
    "n": "transition_model: сілтемесі жоқ бет",
    "in": [],
    "append": "corpus_g = {\n    \"a.html\": {\"b.html\"},\n    \"b.html\": {\"c.html\"},\n    \"c.html\": set(),\n}\nprint({k: round(v, 4) for k, v in sorted(transition_model(corpus_g, 'c.html', 0.85).items())})",
    "out": "{'a.html': 0.3333, 'b.html': 0.3333, 'c.html': 0.3333}"
   },
   {
    "n": "transition_model: қосынды 1",
    "in": [],
    "append": "corpus0 = {\n    \"1.html\": {\"2.html\"},\n    \"2.html\": {\"1.html\", \"3.html\"},\n    \"3.html\": {\"2.html\", \"4.html\"},\n    \"4.html\": {\"2.html\"},\n}\nprint(round(sum(transition_model(corpus0, '3.html', 0.6).values()), 6))",
    "out": "1.0"
   },
   {
    "n": "sample_pagerank: corpus0, n = 5000",
    "in": [],
    "seed": 1,
    "append": "corpus0 = {\n    \"1.html\": {\"2.html\"},\n    \"2.html\": {\"1.html\", \"3.html\"},\n    \"3.html\": {\"2.html\", \"4.html\"},\n    \"4.html\": {\"2.html\"},\n}\ncorpus_d = {\n    \"5.html\": {\"6.html\"},\n    \"6.html\": {\"5.html\"},\n    \"1.html\": {\"2.html\"},\n    \"2.html\": {\"1.html\"},\n}\ncorpus_g = {\n    \"a.html\": {\"b.html\"},\n    \"b.html\": {\"c.html\"},\n    \"c.html\": set(),\n}\n\ndef close(res, exp, tol):\n    if not isinstance(res, dict) or set(res) != set(exp):\n        return \"bad keys: \" + str(sorted(res) if isinstance(res, dict) else res)\n    if abs(sum(res.values()) - 1) > 0.01:\n        return \"sum is \" + str(round(sum(res.values()), 3))\n    for p in sorted(exp):\n        if abs(res[p] - exp[p]) > tol:\n            return \"bad \" + p + \": \" + str(round(res[p], 3))\n    return \"ok\"\nprint(close(sample_pagerank(corpus0, 0.85, 5000), {'1.html': 0.219914, '2.html': 0.429209, '3.html': 0.219914, '4.html': 0.130963}, 0.05))",
    "out": "ok"
   },
   {
    "n": "sample_pagerank: corpus_d, n = 5000",
    "in": [],
    "seed": 2,
    "append": "corpus0 = {\n    \"1.html\": {\"2.html\"},\n    \"2.html\": {\"1.html\", \"3.html\"},\n    \"3.html\": {\"2.html\", \"4.html\"},\n    \"4.html\": {\"2.html\"},\n}\ncorpus_d = {\n    \"5.html\": {\"6.html\"},\n    \"6.html\": {\"5.html\"},\n    \"1.html\": {\"2.html\"},\n    \"2.html\": {\"1.html\"},\n}\ncorpus_g = {\n    \"a.html\": {\"b.html\"},\n    \"b.html\": {\"c.html\"},\n    \"c.html\": set(),\n}\n\ndef close(res, exp, tol):\n    if not isinstance(res, dict) or set(res) != set(exp):\n        return \"bad keys: \" + str(sorted(res) if isinstance(res, dict) else res)\n    if abs(sum(res.values()) - 1) > 0.01:\n        return \"sum is \" + str(round(sum(res.values()), 3))\n    for p in sorted(exp):\n        if abs(res[p] - exp[p]) > tol:\n            return \"bad \" + p + \": \" + str(round(res[p], 3))\n    return \"ok\"\nprint(close(sample_pagerank(corpus_d, 0.85, 5000), {'5.html': 0.25, '6.html': 0.25, '1.html': 0.25, '2.html': 0.25}, 0.05))",
    "out": "ok"
   },
   {
    "n": "sample_pagerank: corpus_g, n = 5000",
    "in": [],
    "seed": 3,
    "append": "corpus0 = {\n    \"1.html\": {\"2.html\"},\n    \"2.html\": {\"1.html\", \"3.html\"},\n    \"3.html\": {\"2.html\", \"4.html\"},\n    \"4.html\": {\"2.html\"},\n}\ncorpus_d = {\n    \"5.html\": {\"6.html\"},\n    \"6.html\": {\"5.html\"},\n    \"1.html\": {\"2.html\"},\n    \"2.html\": {\"1.html\"},\n}\ncorpus_g = {\n    \"a.html\": {\"b.html\"},\n    \"b.html\": {\"c.html\"},\n    \"c.html\": set(),\n}\n\ndef close(res, exp, tol):\n    if not isinstance(res, dict) or set(res) != set(exp):\n        return \"bad keys: \" + str(sorted(res) if isinstance(res, dict) else res)\n    if abs(sum(res.values()) - 1) > 0.01:\n        return \"sum is \" + str(round(sum(res.values()), 3))\n    for p in sorted(exp):\n        if abs(res[p] - exp[p]) > tol:\n            return \"bad \" + p + \": \" + str(round(res[p], 3))\n    return \"ok\"\nprint(close(sample_pagerank(corpus_g, 0.85, 5000), {'a.html': 0.184417, 'b.html': 0.341171, 'c.html': 0.474412}, 0.05))",
    "out": "ok"
   },
   {
    "n": "iterate_pagerank: corpus0",
    "in": [],
    "append": "corpus0 = {\n    \"1.html\": {\"2.html\"},\n    \"2.html\": {\"1.html\", \"3.html\"},\n    \"3.html\": {\"2.html\", \"4.html\"},\n    \"4.html\": {\"2.html\"},\n}\ncorpus_d = {\n    \"5.html\": {\"6.html\"},\n    \"6.html\": {\"5.html\"},\n    \"1.html\": {\"2.html\"},\n    \"2.html\": {\"1.html\"},\n}\ncorpus_g = {\n    \"a.html\": {\"b.html\"},\n    \"b.html\": {\"c.html\"},\n    \"c.html\": set(),\n}\n\ndef close(res, exp, tol):\n    if not isinstance(res, dict) or set(res) != set(exp):\n        return \"bad keys: \" + str(sorted(res) if isinstance(res, dict) else res)\n    if abs(sum(res.values()) - 1) > 0.01:\n        return \"sum is \" + str(round(sum(res.values()), 3))\n    for p in sorted(exp):\n        if abs(res[p] - exp[p]) > tol:\n            return \"bad \" + p + \": \" + str(round(res[p], 3))\n    return \"ok\"\nprint(close(iterate_pagerank(corpus0, 0.85), {'1.html': 0.219914, '2.html': 0.429209, '3.html': 0.219914, '4.html': 0.130963}, 0.002))",
    "out": "ok"
   },
   {
    "n": "iterate_pagerank: corpus_d",
    "in": [],
    "append": "corpus0 = {\n    \"1.html\": {\"2.html\"},\n    \"2.html\": {\"1.html\", \"3.html\"},\n    \"3.html\": {\"2.html\", \"4.html\"},\n    \"4.html\": {\"2.html\"},\n}\ncorpus_d = {\n    \"5.html\": {\"6.html\"},\n    \"6.html\": {\"5.html\"},\n    \"1.html\": {\"2.html\"},\n    \"2.html\": {\"1.html\"},\n}\ncorpus_g = {\n    \"a.html\": {\"b.html\"},\n    \"b.html\": {\"c.html\"},\n    \"c.html\": set(),\n}\n\ndef close(res, exp, tol):\n    if not isinstance(res, dict) or set(res) != set(exp):\n        return \"bad keys: \" + str(sorted(res) if isinstance(res, dict) else res)\n    if abs(sum(res.values()) - 1) > 0.01:\n        return \"sum is \" + str(round(sum(res.values()), 3))\n    for p in sorted(exp):\n        if abs(res[p] - exp[p]) > tol:\n            return \"bad \" + p + \": \" + str(round(res[p], 3))\n    return \"ok\"\nprint(close(iterate_pagerank(corpus_d, 0.85), {'5.html': 0.25, '6.html': 0.25, '1.html': 0.25, '2.html': 0.25}, 0.002))",
    "out": "ok"
   },
   {
    "n": "iterate_pagerank: corpus_g",
    "in": [],
    "append": "corpus0 = {\n    \"1.html\": {\"2.html\"},\n    \"2.html\": {\"1.html\", \"3.html\"},\n    \"3.html\": {\"2.html\", \"4.html\"},\n    \"4.html\": {\"2.html\"},\n}\ncorpus_d = {\n    \"5.html\": {\"6.html\"},\n    \"6.html\": {\"5.html\"},\n    \"1.html\": {\"2.html\"},\n    \"2.html\": {\"1.html\"},\n}\ncorpus_g = {\n    \"a.html\": {\"b.html\"},\n    \"b.html\": {\"c.html\"},\n    \"c.html\": set(),\n}\n\ndef close(res, exp, tol):\n    if not isinstance(res, dict) or set(res) != set(exp):\n        return \"bad keys: \" + str(sorted(res) if isinstance(res, dict) else res)\n    if abs(sum(res.values()) - 1) > 0.01:\n        return \"sum is \" + str(round(sum(res.values()), 3))\n    for p in sorted(exp):\n        if abs(res[p] - exp[p]) > tol:\n            return \"bad \" + p + \": \" + str(round(res[p], 3))\n    return \"ok\"\nprint(close(iterate_pagerank(corpus_g, 0.85), {'a.html': 0.184417, 'b.html': 0.341171, 'c.html': 0.474412}, 0.002))",
    "out": "ok"
   }
  ],
  "note": "Мұнда тек үш функцияны (және import, DAMPING, SAMPLES) жазасыз: main мен crawl компьютерде. Семплдеу тесті кездейсоқ нәтижемен жұмыс істейді, сондықтан ол 0.05 қателікті кешіреді."
 },
 "py-heredity": {
  "title": "Heredity",
  "file": "heredity.py",
  "starter": "PROBS = {\n    \"gene\": {2: 0.01, 1: 0.03, 0: 0.96},\n    \"trait\": {\n        2: {True: 0.65, False: 0.35},\n        1: {True: 0.56, False: 0.44},\n        0: {True: 0.01, False: 0.99},\n    },\n    \"mutation\": 0.01,\n}\n\n\ndef joint_probability(people, one_gene, two_genes, have_trait):\n    # TODO: барлық оқиғалардың бірлескен ықтималдығын қайтарыңыз\n    raise NotImplementedError\n\n\ndef update(probabilities, one_gene, two_genes, have_trait, p):\n    # TODO: p мәнін gene және trait үлестірімдеріне қосыңыз\n    raise NotImplementedError\n\n\ndef normalize(probabilities):\n    # TODO: әр үлестірімді қосындысы 1 болатындай нормалаңыз\n    raise NotImplementedError\n",
  "tests": [
   {
    "n": "joint_probability: ресми мысал (Harry 1, James 2)",
    "in": [],
    "append": "PROBS = {\n    \"gene\": {2: 0.01, 1: 0.03, 0: 0.96},\n    \"trait\": {\n        2: {True: 0.65, False: 0.35},\n        1: {True: 0.56, False: 0.44},\n        0: {True: 0.01, False: 0.99},\n    },\n    \"mutation\": 0.01,\n}\npeople = {\n    \"Harry\": {\"name\": \"Harry\", \"mother\": \"Lily\", \"father\": \"James\", \"trait\": None},\n    \"James\": {\"name\": \"James\", \"mother\": None, \"father\": None, \"trait\": True},\n    \"Lily\": {\"name\": \"Lily\", \"mother\": None, \"father\": None, \"trait\": False},\n}\npeople2 = {\n    \"Ana\": {\"name\": \"Ana\", \"mother\": None, \"father\": None, \"trait\": None},\n    \"Bek\": {\"name\": \"Bek\", \"mother\": None, \"father\": None, \"trait\": None},\n    \"Cem\": {\"name\": \"Cem\", \"mother\": \"Ana\", \"father\": \"Bek\", \"trait\": None},\n    \"Dan\": {\"name\": \"Dan\", \"mother\": \"Cem\", \"father\": \"Bek\", \"trait\": None},\n}\ndef empty(names):\n    return {n: {\"gene\": {2: 0, 1: 0, 0: 0}, \"trait\": {True: 0, False: 0}} for n in names}\ndef show(pr):\n    for n in sorted(pr):\n        print(n, [round(pr[n][\"gene\"][g], 4) for g in (2, 1, 0)], [round(pr[n][\"trait\"][t], 4) for t in (True, False)])\nprint('%.6g' % joint_probability(people, {'Harry'}, {'James'}, {'James'}))",
    "out": "0.00266432"
   },
   {
    "n": "joint_probability: ешкімде ген жоқ, белгі жоқ",
    "in": [],
    "append": "PROBS = {\n    \"gene\": {2: 0.01, 1: 0.03, 0: 0.96},\n    \"trait\": {\n        2: {True: 0.65, False: 0.35},\n        1: {True: 0.56, False: 0.44},\n        0: {True: 0.01, False: 0.99},\n    },\n    \"mutation\": 0.01,\n}\npeople = {\n    \"Harry\": {\"name\": \"Harry\", \"mother\": \"Lily\", \"father\": \"James\", \"trait\": None},\n    \"James\": {\"name\": \"James\", \"mother\": None, \"father\": None, \"trait\": True},\n    \"Lily\": {\"name\": \"Lily\", \"mother\": None, \"father\": None, \"trait\": False},\n}\npeople2 = {\n    \"Ana\": {\"name\": \"Ana\", \"mother\": None, \"father\": None, \"trait\": None},\n    \"Bek\": {\"name\": \"Bek\", \"mother\": None, \"father\": None, \"trait\": None},\n    \"Cem\": {\"name\": \"Cem\", \"mother\": \"Ana\", \"father\": \"Bek\", \"trait\": None},\n    \"Dan\": {\"name\": \"Dan\", \"mother\": \"Cem\", \"father\": \"Bek\", \"trait\": None},\n}\ndef empty(names):\n    return {n: {\"gene\": {2: 0, 1: 0, 0: 0}, \"trait\": {True: 0, False: 0}} for n in names}\ndef show(pr):\n    for n in sorted(pr):\n        print(n, [round(pr[n][\"gene\"][g], 4) for g in (2, 1, 0)], [round(pr[n][\"trait\"][t], 4) for t in (True, False)])\nprint('%.6g' % joint_probability(people, set(), set(), set()))",
    "out": "0.876432"
   },
   {
    "n": "joint_probability: Harry-де 2 ген",
    "in": [],
    "append": "PROBS = {\n    \"gene\": {2: 0.01, 1: 0.03, 0: 0.96},\n    \"trait\": {\n        2: {True: 0.65, False: 0.35},\n        1: {True: 0.56, False: 0.44},\n        0: {True: 0.01, False: 0.99},\n    },\n    \"mutation\": 0.01,\n}\npeople = {\n    \"Harry\": {\"name\": \"Harry\", \"mother\": \"Lily\", \"father\": \"James\", \"trait\": None},\n    \"James\": {\"name\": \"James\", \"mother\": None, \"father\": None, \"trait\": True},\n    \"Lily\": {\"name\": \"Lily\", \"mother\": None, \"father\": None, \"trait\": False},\n}\npeople2 = {\n    \"Ana\": {\"name\": \"Ana\", \"mother\": None, \"father\": None, \"trait\": None},\n    \"Bek\": {\"name\": \"Bek\", \"mother\": None, \"father\": None, \"trait\": None},\n    \"Cem\": {\"name\": \"Cem\", \"mother\": \"Ana\", \"father\": \"Bek\", \"trait\": None},\n    \"Dan\": {\"name\": \"Dan\", \"mother\": \"Cem\", \"father\": \"Bek\", \"trait\": None},\n}\ndef empty(names):\n    return {n: {\"gene\": {2: 0, 1: 0, 0: 0}, \"trait\": {True: 0, False: 0}} for n in names}\ndef show(pr):\n    for n in sorted(pr):\n        print(n, [round(pr[n][\"gene\"][g], 4) for g in (2, 1, 0)], [round(pr[n][\"trait\"][t], 4) for t in (True, False)])\nprint('%.6g' % joint_probability(people, {'Lily'}, {'Harry', 'James'}, {'Harry'}))",
    "out": "1.48648e-05"
   },
   {
    "n": "joint_probability: 0 ген, ата-анада 1 ген",
    "in": [],
    "append": "PROBS = {\n    \"gene\": {2: 0.01, 1: 0.03, 0: 0.96},\n    \"trait\": {\n        2: {True: 0.65, False: 0.35},\n        1: {True: 0.56, False: 0.44},\n        0: {True: 0.01, False: 0.99},\n    },\n    \"mutation\": 0.01,\n}\npeople = {\n    \"Harry\": {\"name\": \"Harry\", \"mother\": \"Lily\", \"father\": \"James\", \"trait\": None},\n    \"James\": {\"name\": \"James\", \"mother\": None, \"father\": None, \"trait\": True},\n    \"Lily\": {\"name\": \"Lily\", \"mother\": None, \"father\": None, \"trait\": False},\n}\npeople2 = {\n    \"Ana\": {\"name\": \"Ana\", \"mother\": None, \"father\": None, \"trait\": None},\n    \"Bek\": {\"name\": \"Bek\", \"mother\": None, \"father\": None, \"trait\": None},\n    \"Cem\": {\"name\": \"Cem\", \"mother\": \"Ana\", \"father\": \"Bek\", \"trait\": None},\n    \"Dan\": {\"name\": \"Dan\", \"mother\": \"Cem\", \"father\": \"Bek\", \"trait\": None},\n}\ndef empty(names):\n    return {n: {\"gene\": {2: 0, 1: 0, 0: 0}, \"trait\": {True: 0, False: 0}} for n in names}\ndef show(pr):\n    for n in sorted(pr):\n        print(n, [round(pr[n][\"gene\"][g], 4) for g in (2, 1, 0)], [round(pr[n][\"trait\"][t], 4) for t in (True, False)])\nprint('%.6g' % joint_probability(people, {'Lily', 'James'}, set(), {'James'}))",
    "out": "5.48856e-05"
   },
   {
    "n": "joint_probability: екі ұрпақ",
    "in": [],
    "append": "PROBS = {\n    \"gene\": {2: 0.01, 1: 0.03, 0: 0.96},\n    \"trait\": {\n        2: {True: 0.65, False: 0.35},\n        1: {True: 0.56, False: 0.44},\n        0: {True: 0.01, False: 0.99},\n    },\n    \"mutation\": 0.01,\n}\npeople = {\n    \"Harry\": {\"name\": \"Harry\", \"mother\": \"Lily\", \"father\": \"James\", \"trait\": None},\n    \"James\": {\"name\": \"James\", \"mother\": None, \"father\": None, \"trait\": True},\n    \"Lily\": {\"name\": \"Lily\", \"mother\": None, \"father\": None, \"trait\": False},\n}\npeople2 = {\n    \"Ana\": {\"name\": \"Ana\", \"mother\": None, \"father\": None, \"trait\": None},\n    \"Bek\": {\"name\": \"Bek\", \"mother\": None, \"father\": None, \"trait\": None},\n    \"Cem\": {\"name\": \"Cem\", \"mother\": \"Ana\", \"father\": \"Bek\", \"trait\": None},\n    \"Dan\": {\"name\": \"Dan\", \"mother\": \"Cem\", \"father\": \"Bek\", \"trait\": None},\n}\ndef empty(names):\n    return {n: {\"gene\": {2: 0, 1: 0, 0: 0}, \"trait\": {True: 0, False: 0}} for n in names}\ndef show(pr):\n    for n in sorted(pr):\n        print(n, [round(pr[n][\"gene\"][g], 4) for g in (2, 1, 0)], [round(pr[n][\"trait\"][t], 4) for t in (True, False)])\nprint('%.6g' % joint_probability(people2, {'Cem'}, {'Ana'}, {'Dan', 'Bek'}))",
    "out": "7.17318e-08"
   },
   {
    "n": "update: gene мен trait жаңарады",
    "in": [],
    "append": "PROBS = {\n    \"gene\": {2: 0.01, 1: 0.03, 0: 0.96},\n    \"trait\": {\n        2: {True: 0.65, False: 0.35},\n        1: {True: 0.56, False: 0.44},\n        0: {True: 0.01, False: 0.99},\n    },\n    \"mutation\": 0.01,\n}\npeople = {\n    \"Harry\": {\"name\": \"Harry\", \"mother\": \"Lily\", \"father\": \"James\", \"trait\": None},\n    \"James\": {\"name\": \"James\", \"mother\": None, \"father\": None, \"trait\": True},\n    \"Lily\": {\"name\": \"Lily\", \"mother\": None, \"father\": None, \"trait\": False},\n}\npeople2 = {\n    \"Ana\": {\"name\": \"Ana\", \"mother\": None, \"father\": None, \"trait\": None},\n    \"Bek\": {\"name\": \"Bek\", \"mother\": None, \"father\": None, \"trait\": None},\n    \"Cem\": {\"name\": \"Cem\", \"mother\": \"Ana\", \"father\": \"Bek\", \"trait\": None},\n    \"Dan\": {\"name\": \"Dan\", \"mother\": \"Cem\", \"father\": \"Bek\", \"trait\": None},\n}\ndef empty(names):\n    return {n: {\"gene\": {2: 0, 1: 0, 0: 0}, \"trait\": {True: 0, False: 0}} for n in names}\ndef show(pr):\n    for n in sorted(pr):\n        print(n, [round(pr[n][\"gene\"][g], 4) for g in (2, 1, 0)], [round(pr[n][\"trait\"][t], 4) for t in (True, False)])\npr = empty(people)\nupdate(pr, {'Harry'}, {'James'}, {'James'}, 0.1)\nupdate(pr, {'Lily'}, set(), {'Lily', 'Harry'}, 0.2)\nshow(pr)",
    "out": "Harry [0, 0.1, 0.2] [0.2, 0.1]\nJames [0.1, 0, 0.2] [0.1, 0.2]\nLily [0, 0.2, 0.1] [0.2, 0.1]"
   },
   {
    "n": "normalize: ықтималдықтар 1-ге келеді",
    "in": [],
    "append": "PROBS = {\n    \"gene\": {2: 0.01, 1: 0.03, 0: 0.96},\n    \"trait\": {\n        2: {True: 0.65, False: 0.35},\n        1: {True: 0.56, False: 0.44},\n        0: {True: 0.01, False: 0.99},\n    },\n    \"mutation\": 0.01,\n}\npeople = {\n    \"Harry\": {\"name\": \"Harry\", \"mother\": \"Lily\", \"father\": \"James\", \"trait\": None},\n    \"James\": {\"name\": \"James\", \"mother\": None, \"father\": None, \"trait\": True},\n    \"Lily\": {\"name\": \"Lily\", \"mother\": None, \"father\": None, \"trait\": False},\n}\npeople2 = {\n    \"Ana\": {\"name\": \"Ana\", \"mother\": None, \"father\": None, \"trait\": None},\n    \"Bek\": {\"name\": \"Bek\", \"mother\": None, \"father\": None, \"trait\": None},\n    \"Cem\": {\"name\": \"Cem\", \"mother\": \"Ana\", \"father\": \"Bek\", \"trait\": None},\n    \"Dan\": {\"name\": \"Dan\", \"mother\": \"Cem\", \"father\": \"Bek\", \"trait\": None},\n}\ndef empty(names):\n    return {n: {\"gene\": {2: 0, 1: 0, 0: 0}, \"trait\": {True: 0, False: 0}} for n in names}\ndef show(pr):\n    for n in sorted(pr):\n        print(n, [round(pr[n][\"gene\"][g], 4) for g in (2, 1, 0)], [round(pr[n][\"trait\"][t], 4) for t in (True, False)])\npr = empty(['Harry', 'Lily'])\npr['Harry']['gene'] = {2: 0.1, 1: 0.3, 0: 0.6}\npr['Harry']['trait'] = {True: 0.1, False: 0.3}\npr['Lily']['gene'] = {2: 1, 1: 1, 0: 2}\npr['Lily']['trait'] = {True: 3, False: 1}\nnormalize(pr)\nshow(pr)",
    "out": "Harry [0.1, 0.3, 0.6] [0.25, 0.75]\nLily [0.25, 0.25, 0.5] [0.75, 0.25]"
   },
   {
    "n": "update + normalize: толық жүйе",
    "in": [],
    "append": "PROBS = {\n    \"gene\": {2: 0.01, 1: 0.03, 0: 0.96},\n    \"trait\": {\n        2: {True: 0.65, False: 0.35},\n        1: {True: 0.56, False: 0.44},\n        0: {True: 0.01, False: 0.99},\n    },\n    \"mutation\": 0.01,\n}\npeople = {\n    \"Harry\": {\"name\": \"Harry\", \"mother\": \"Lily\", \"father\": \"James\", \"trait\": None},\n    \"James\": {\"name\": \"James\", \"mother\": None, \"father\": None, \"trait\": True},\n    \"Lily\": {\"name\": \"Lily\", \"mother\": None, \"father\": None, \"trait\": False},\n}\npeople2 = {\n    \"Ana\": {\"name\": \"Ana\", \"mother\": None, \"father\": None, \"trait\": None},\n    \"Bek\": {\"name\": \"Bek\", \"mother\": None, \"father\": None, \"trait\": None},\n    \"Cem\": {\"name\": \"Cem\", \"mother\": \"Ana\", \"father\": \"Bek\", \"trait\": None},\n    \"Dan\": {\"name\": \"Dan\", \"mother\": \"Cem\", \"father\": \"Bek\", \"trait\": None},\n}\ndef empty(names):\n    return {n: {\"gene\": {2: 0, 1: 0, 0: 0}, \"trait\": {True: 0, False: 0}} for n in names}\ndef show(pr):\n    for n in sorted(pr):\n        print(n, [round(pr[n][\"gene\"][g], 4) for g in (2, 1, 0)], [round(pr[n][\"trait\"][t], 4) for t in (True, False)])\npr = empty(people)\nupdate(pr, {'Harry'}, {'James'}, {'James'}, 0.0026643)\nupdate(pr, set(), set(), {'James'}, 0.5)\nnormalize(pr)\nshow(pr)",
    "out": "Harry [0.0, 0.0053, 0.9947] [0.0, 1.0]\nJames [0.0053, 0.0, 0.9947] [1.0, 0.0]\nLily [0.0, 0.0, 1.0] [0.0, 1.0]"
   }
  ],
  "note": "Мұнда PROBS пен үш функцияны жазасыз: main, load_data, powerset компьютерде. Тесттер өз people сөздіктерін береді."
 }
});
