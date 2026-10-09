// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-degrees": {
  "title": "Degrees",
  "file": "degrees.py",
  "starter": "import csv\nimport sys\n\n\nclass Node():\n    def __init__(self, state, parent, action):\n        self.state = state\n        self.parent = parent\n        self.action = action\n\n\nclass StackFrontier():\n    def __init__(self):\n        self.frontier = []\n\n    def add(self, node):\n        self.frontier.append(node)\n\n    def contains_state(self, state):\n        return any(node.state == state for node in self.frontier)\n\n    def empty(self):\n        return len(self.frontier) == 0\n\n    def remove(self):\n        if self.empty():\n            raise Exception(\"empty frontier\")\n        else:\n            node = self.frontier[-1]\n            self.frontier = self.frontier[:-1]\n            return node\n\n\nclass QueueFrontier(StackFrontier):\n\n    def remove(self):\n        if self.empty():\n            raise Exception(\"empty frontier\")\n        else:\n            node = self.frontier[0]\n            self.frontier = self.frontier[1:]\n            return node\n\n\n# Maps names to a set of corresponding person_ids\nnames = {}\n\n# Maps person_ids to a dictionary of: name, birth, movies (a set of movie_ids)\npeople = {}\n\n# Maps movie_ids to a dictionary of: title, year, stars (a set of person_ids)\nmovies = {}\n\n\ndef load_data(directory):\n    \"\"\"\n    Load data from CSV files into memory.\n    \"\"\"\n    # Load people\n    with open(f\"{directory}/people.csv\", encoding=\"utf-8\") as f:\n        reader = csv.DictReader(f)\n        for row in reader:\n            people[row[\"id\"]] = {\n                \"name\": row[\"name\"],\n                \"birth\": row[\"birth\"],\n                \"movies\": set()\n            }\n            if row[\"name\"].lower() not in names:\n                names[row[\"name\"].lower()] = {row[\"id\"]}\n            else:\n                names[row[\"name\"].lower()].add(row[\"id\"])\n\n    # Load movies\n    with open(f\"{directory}/movies.csv\", encoding=\"utf-8\") as f:\n        reader = csv.DictReader(f)\n        for row in reader:\n            movies[row[\"id\"]] = {\n                \"title\": row[\"title\"],\n                \"year\": row[\"year\"],\n                \"stars\": set()\n            }\n\n    # Load stars\n    with open(f\"{directory}/stars.csv\", encoding=\"utf-8\") as f:\n        reader = csv.DictReader(f)\n        for row in reader:\n            try:\n                people[row[\"person_id\"]][\"movies\"].add(row[\"movie_id\"])\n                movies[row[\"movie_id\"]][\"stars\"].add(row[\"person_id\"])\n            except KeyError:\n                pass\n\n\ndef main():\n    if len(sys.argv) > 2:\n        sys.exit(\"Usage: python degrees.py [directory]\")\n    directory = sys.argv[1] if len(sys.argv) == 2 else \"large\"\n\n    # Load data from files into memory\n    print(\"Loading data...\")\n    load_data(directory)\n    print(\"Data loaded.\")\n\n    source = person_id_for_name(input(\"Name: \"))\n    if source is None:\n        sys.exit(\"Person not found.\")\n    target = person_id_for_name(input(\"Name: \"))\n    if target is None:\n        sys.exit(\"Person not found.\")\n\n    path = shortest_path(source, target)\n\n    if path is None:\n        print(\"Not connected.\")\n    else:\n        degrees = len(path)\n        print(f\"{degrees} degrees of separation.\")\n        path = [(None, source)] + path\n        for i in range(degrees):\n            person1 = people[path[i][1]][\"name\"]\n            person2 = people[path[i + 1][1]][\"name\"]\n            movie = movies[path[i + 1][0]][\"title\"]\n            print(f\"{i + 1}: {person1} and {person2} starred in {movie}\")\n\n\ndef shortest_path(source, target):\n    \"\"\"\n    Returns the shortest list of (movie_id, person_id) pairs\n    that connect the source to the target.\n\n    If no possible path, returns None.\n    \"\"\"\n\n    # TODO: BFS (QueueFrontier) арқылы shortest_path жазыңыз\n    raise NotImplementedError\n\n\ndef person_id_for_name(name):\n    \"\"\"\n    Returns the IMDB id for a person's name,\n    resolving ambiguities as needed.\n    \"\"\"\n    person_ids = list(names.get(name.lower(), set()))\n    if len(person_ids) == 0:\n        return None\n    elif len(person_ids) > 1:\n        print(f\"Which '{name}'?\")\n        for person_id in person_ids:\n            person = people[person_id]\n            name = person[\"name\"]\n            birth = person[\"birth\"]\n            print(f\"ID: {person_id}, Name: {name}, Birth: {birth}\")\n        try:\n            person_id = input(\"Intended Person ID: \")\n            if person_id in person_ids:\n                return person_id\n        except ValueError:\n            pass\n        return None\n    else:\n        return person_ids[0]\n\n\ndef neighbors_for_person(person_id):\n    \"\"\"\n    Returns (movie_id, person_id) pairs for people\n    who starred with a given person.\n    \"\"\"\n    movie_ids = people[person_id][\"movies\"]\n    neighbors = set()\n    for movie_id in movie_ids:\n        for person_id in movies[movie_id][\"stars\"]:\n            neighbors.add((movie_id, person_id))\n    return neighbors\n\n\nif __name__ == \"__main__\":\n    main()\n",
  "tests": [
   {
    "n": "1 дәреже: Aigerim Sadykova - Dana Kassym",
    "in": [
     "Aigerim Sadykova",
     "Dana Kassym"
    ],
    "argv": [
     "degrees.py",
     "kazakh"
    ],
    "out": "Loading data...\nData loaded.\n1 degrees of separation.\n1: Aigerim Sadykova and Dana Kassym starred in Dala Syry"
   },
   {
    "n": "2 дәреже: Aigerim Sadykova - Farida Zhaksy",
    "in": [
     "Aigerim Sadykova",
     "Farida Zhaksy"
    ],
    "argv": [
     "degrees.py",
     "kazakh"
    ],
    "out": "Loading data...\nData loaded.\n2 degrees of separation.\n1: Aigerim Sadykova and Bauyrzhan Omarov starred in Dala Syry\n2: Bauyrzhan Omarov and Farida Zhaksy starred in Altyn Kerbez"
   },
   {
    "n": "3 дәреже: Aigerim Sadykova - Iliyas Nur",
    "in": [
     "Aigerim Sadykova",
     "Iliyas Nur"
    ],
    "argv": [
     "degrees.py",
     "kazakh"
    ],
    "out": "Loading data...\nData loaded.\n3 degrees of separation.\n1: Aigerim Sadykova and Bauyrzhan Omarov starred in Dala Syry\n2: Bauyrzhan Omarov and Farida Zhaksy starred in Altyn Kerbez\n3: Farida Zhaksy and Iliyas Nur starred in Zhetisu"
   },
   {
    "n": "Кері бағыт: Kamila Aman - Aigerim Sadykova",
    "in": [
     "Kamila Aman",
     "Aigerim Sadykova"
    ],
    "argv": [
     "degrees.py",
     "kazakh"
    ],
    "out": "Loading data...\nData loaded.\n3 degrees of separation.\n1: Kamila Aman and Farida Zhaksy starred in Zhetisu\n2: Farida Zhaksy and Bauyrzhan Omarov starred in Altyn Kerbez\n3: Bauyrzhan Omarov and Aigerim Sadykova starred in Dala Syry"
   },
   {
    "n": "Байланыс жоқ: Aigerim Sadykova - Lazzat Bek",
    "in": [
     "Aigerim Sadykova",
     "Lazzat Bek"
    ],
    "argv": [
     "degrees.py",
     "kazakh"
    ],
    "out": "Loading data...\nData loaded.\nNot connected."
   },
   {
    "n": "Аты-жөні кіші әріппен де табылады",
    "in": [
     "aigerim sadykova",
     "DANA KASSYM"
    ],
    "argv": [
     "degrees.py",
     "kazakh"
    ],
    "out": "Loading data...\nData loaded.\n1 degrees of separation.\n1: Aigerim Sadykova and Dana Kassym starred in Dala Syry"
   },
   {
    "n": "Тең қысқа жолдар (Aigerim - Hamit): кез келгені жарайды",
    "in": [
     "Aigerim Sadykova",
     "Hamit Serik"
    ],
    "argv": [
     "degrees.py",
     "kazakh"
    ],
    "append": "\ndef _bfs_len(a, b):\n    seen = {a}\n    level = [a]\n    d = 0\n    while level:\n        if b in level:\n            return d\n        nxt = []\n        for p in level:\n            for _m, q in neighbors_for_person(p):\n                if q not in seen:\n                    seen.add(q)\n                    nxt.append(q)\n        level = nxt\n        d += 1\n    return None\n\n\ndef _check_pair(a, b):\n    want = _bfs_len(a, b)\n    got = shortest_path(a, b)\n    if want is None:\n        return got is None, \"None күтілген, \" + repr(got) + \" алынды\"\n    if not isinstance(got, list) or not got:\n        return False, \"тізім күтілген, \" + repr(got) + \" алынды\"\n    cur = a\n    for step in got:\n        if not (isinstance(step, tuple) and len(step) == 2 and all(isinstance(x, str) for x in step)):\n            return False, \"әр қадам (movie_id, person_id) жолдардан тұратын tuple болуы тиіс: \" + repr(step)\n        m, p = step\n        if (m, p) not in neighbors_for_person(cur):\n            return False, \"қадам жарамсыз: \" + repr(step) + \" (\" + cur + \" адамынан)\"\n        cur = p\n    if cur != b:\n        return False, \"жол мақсатқа жетпейді\"\n    if len(got) != want:\n        return False, f\"{a}->{b}: ең қысқа жол {want}, ал сіздікі {len(got)}\"\n    return True, \"\"\n\n_ok, _why = _check_pair(\"1\", \"7\")\nprint(\"CHECK OK\" if _ok else \"FAIL: \" + _why)\n",
    "contains": "CHECK OK",
    "out": "Loading data...\nData loaded.\n3 degrees of separation.\n1: Aigerim Sadykova and Dana Kassym starred in Dala Syry\n2: Dana Kassym and Gulnar Abay starred in Tau Zholy\n3: Gulnar Abay and Hamit Serik starred in Kok Bori\nCHECK OK"
   },
   {
    "n": "Тең қысқа жолдар (Dana - Iliyas): кез келгені жарайды",
    "in": [
     "Dana Kassym",
     "Iliyas Nur"
    ],
    "argv": [
     "degrees.py",
     "kazakh"
    ],
    "append": "\ndef _bfs_len(a, b):\n    seen = {a}\n    level = [a]\n    d = 0\n    while level:\n        if b in level:\n            return d\n        nxt = []\n        for p in level:\n            for _m, q in neighbors_for_person(p):\n                if q not in seen:\n                    seen.add(q)\n                    nxt.append(q)\n        level = nxt\n        d += 1\n    return None\n\n\ndef _check_pair(a, b):\n    want = _bfs_len(a, b)\n    got = shortest_path(a, b)\n    if want is None:\n        return got is None, \"None күтілген, \" + repr(got) + \" алынды\"\n    if not isinstance(got, list) or not got:\n        return False, \"тізім күтілген, \" + repr(got) + \" алынды\"\n    cur = a\n    for step in got:\n        if not (isinstance(step, tuple) and len(step) == 2 and all(isinstance(x, str) for x in step)):\n            return False, \"әр қадам (movie_id, person_id) жолдардан тұратын tuple болуы тиіс: \" + repr(step)\n        m, p = step\n        if (m, p) not in neighbors_for_person(cur):\n            return False, \"қадам жарамсыз: \" + repr(step) + \" (\" + cur + \" адамынан)\"\n        cur = p\n    if cur != b:\n        return False, \"жол мақсатқа жетпейді\"\n    if len(got) != want:\n        return False, f\"{a}->{b}: ең қысқа жол {want}, ал сіздікі {len(got)}\"\n    return True, \"\"\n\n_ok, _why = _check_pair(\"3\", \"8\")\nprint(\"CHECK OK\" if _ok else \"FAIL: \" + _why)\n",
    "contains": "CHECK OK",
    "out": "Loading data...\nData loaded.\n3 degrees of separation.\n1: Dana Kassym and Gulnar Abay starred in Tau Zholy\n2: Gulnar Abay and Hamit Serik starred in Kok Bori\n3: Hamit Serik and Iliyas Nur starred in Aksu\nCHECK OK"
   },
   {
    "n": "Барлық жұптар: ең қысқа жол, дұрыс tuple-дер, байланыс жоқ болса None",
    "in": [
     "Aigerim Sadykova",
     "Dana Kassym"
    ],
    "argv": [
     "degrees.py",
     "kazakh"
    ],
    "append": "\ndef _bfs_len(a, b):\n    seen = {a}\n    level = [a]\n    d = 0\n    while level:\n        if b in level:\n            return d\n        nxt = []\n        for p in level:\n            for _m, q in neighbors_for_person(p):\n                if q not in seen:\n                    seen.add(q)\n                    nxt.append(q)\n        level = nxt\n        d += 1\n    return None\n\n\ndef _check_pair(a, b):\n    want = _bfs_len(a, b)\n    got = shortest_path(a, b)\n    if want is None:\n        return got is None, \"None күтілген, \" + repr(got) + \" алынды\"\n    if not isinstance(got, list) or not got:\n        return False, \"тізім күтілген, \" + repr(got) + \" алынды\"\n    cur = a\n    for step in got:\n        if not (isinstance(step, tuple) and len(step) == 2 and all(isinstance(x, str) for x in step)):\n            return False, \"әр қадам (movie_id, person_id) жолдардан тұратын tuple болуы тиіс: \" + repr(step)\n        m, p = step\n        if (m, p) not in neighbors_for_person(cur):\n            return False, \"қадам жарамсыз: \" + repr(step) + \" (\" + cur + \" адамынан)\"\n        cur = p\n    if cur != b:\n        return False, \"жол мақсатқа жетпейді\"\n    if len(got) != want:\n        return False, f\"{a}->{b}: ең қысқа жол {want}, ал сіздікі {len(got)}\"\n    return True, \"\"\n\n_bad = []\nfor _a in people:\n    for _b in people:\n        if _a != _b:\n            _ok, _why = _check_pair(_a, _b)\n            if not _ok:\n                _bad.append(_why)\nprint(\"ALL PAIRS OK\" if not _bad else \"FAIL: \" + _bad[0])\n",
    "contains": "ALL PAIRS OK",
    "out": "Loading data...\nData loaded.\n1 degrees of separation.\n1: Aigerim Sadykova and Dana Kassym starred in Dala Syry\nALL PAIRS OK"
   }
  ],
  "files": {
   "kazakh/people.csv": "id,name,birth\n1,Aigerim Sadykova,1988\n2,Bauyrzhan Omarov,1985\n3,Dana Kassym,1992\n4,Erlan Tleu,1979\n5,Farida Zhaksy,1990\n6,Gulnar Abay,1983\n7,Hamit Serik,1976\n8,Iliyas Nur,1995\n9,Kamila Aman,1998\n10,Lazzat Bek,1987\n11,Marat Yessen,1981\n12,Nurlan Beibit,1993\n",
   "kazakh/movies.csv": "id,title,year\n101,Dala Syry,2015\n102,Altyn Kerbez,2017\n103,Tau Zholy,2018\n104,Kok Bori,2019\n105,Aksu,2020\n106,Zhetisu,2021\n107,Ulytau,2022\n",
   "kazakh/stars.csv": "person_id,movie_id\n1,101\n2,101\n3,101\n2,102\n4,102\n5,102\n3,103\n6,103\n4,104\n6,104\n7,104\n7,105\n8,105\n5,106\n8,106\n9,106\n10,107\n11,107\n12,107\n"
  },
  "note": "Деректер: ойдан шығарылған шағын «Қазақ киносы» (12 адам, 7 фильм), kazakh қалтасында. Тест сіздің толық degrees.py файлыңызды іске қосады: argv = [\"degrees.py\", \"kazakh\"]."
 },
 "py-tictactoe": {
  "title": "Tic-Tac-Toe",
  "file": "tictactoe.py",
  "starter": "\"\"\"\nTic Tac Toe Player\n\"\"\"\n\nimport math\n\nX = \"X\"\nO = \"O\"\nEMPTY = None\n\n\ndef initial_state():\n    \"\"\"Returns starting state of the board.\"\"\"\n    return [[EMPTY, EMPTY, EMPTY],\n            [EMPTY, EMPTY, EMPTY],\n            [EMPTY, EMPTY, EMPTY]]\n\n\ndef player(board):\n    \"\"\"Returns player who has the next turn on a board.\"\"\"\n    # TODO\n    raise NotImplementedError\n\n\ndef actions(board):\n    \"\"\"Returns set of all possible actions (i, j) available on the board.\"\"\"\n    # TODO\n    raise NotImplementedError\n\n\ndef result(board, action):\n    \"\"\"Returns the board that results from making move (i, j) on the board.\"\"\"\n    # TODO\n    raise NotImplementedError\n\n\ndef winner(board):\n    \"\"\"Returns the winner of the game, if there is one.\"\"\"\n    # TODO\n    raise NotImplementedError\n\n\ndef terminal(board):\n    \"\"\"Returns True if game is over, False otherwise.\"\"\"\n    # TODO\n    raise NotImplementedError\n\n\ndef utility(board):\n    \"\"\"Returns 1 if X has won the game, -1 if O has won, 0 otherwise.\"\"\"\n    # TODO\n    raise NotImplementedError\n\n\ndef minimax(board):\n    \"\"\"Returns the optimal action for the current player on the board.\"\"\"\n    # TODO\n    raise NotImplementedError\n",
  "tests": [
   {
    "n": "initial_state: бос 3x3 тақта",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\nb = initial_state()\nprint(_S(b))\nb[0][0] = X\nprint(_S(initial_state()))",
    "out": ".../.../...\n.../.../..."
   },
   {
    "n": "player: бос тақтада X, содан кейін кезекпен",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\nprint(player(_B(\".../.../...\"))) \nprint(player(_B(\"X../.../...\")))\nprint(player(_B(\"X../.O./...\")))",
    "out": "X\nO\nX"
   },
   {
    "n": "player: ортаңғы ойын",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\nprint(player(_B(\"XOX/OXO/O..\")))\nprint(player(_B(\"XOX/.O./X..\")))",
    "out": "O\nO"
   },
   {
    "n": "actions: бос тақтада 9 жүріс, set",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\na = actions(initial_state())\nprint(type(a).__name__, sorted(a))",
    "out": "set [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)]"
   },
   {
    "n": "actions: бос ұяшықтар ғана",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\nprint(sorted(actions(_B(\"XOX/.O./X..\"))))",
    "out": "[(1, 0), (1, 2), (2, 1), (2, 2)]"
   },
   {
    "n": "actions: (i, j) - қатар мен баған",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\nprint(sorted(actions(_B(\"XO./.../..X\"))))",
    "out": "[(0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1)]"
   },
   {
    "n": "result: жаңа тақта, X қояды",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\nb = _B(\"XX./.O./...\")\nn = result(b, (0, 2))\nprint(_S(n))",
    "out": "XXO/.O./..."
   },
   {
    "n": "result: O кезегі, басқа ұяшық",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\nb = _B(\"X../.../...\")\nn = result(b, (1, 1))\nprint(_S(n))",
    "out": "X../.O./..."
   },
   {
    "n": "result: бастапқы тақта өзгермеуі тиіс",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\nb = _B(\"X../.O./...\")\ns = _S(b)\nn = result(b, (2, 2))\nprint(_S(b) == s, n is not b, _S(n))",
    "out": "True True X../.O./..X"
   },
   {
    "n": "result: бос емес ұяшыққа жүріс - қате (exception)",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\nb = _B(\"X../.../...\")\ntry:\n    result(b, (0, 0))\n    print(\"қате көтерілмеді\")\nexcept Exception:\n    print(\"raised\")\nprint(_S(b))",
    "out": "raised\nX../.../..."
   },
   {
    "n": "winner: қатарлар",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\nprint(winner(_B(\"XXX/OO./...\")), winner(_B(\"OO./XXX/...\")), winner(_B(\"X.O/.X./OOO\")))",
    "out": "X X O"
   },
   {
    "n": "winner: бағандар",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\nprint(winner(_B(\"XO./XO./X..\")), winner(_B(\"XOX/.OX/.OX\")), winner(_B(\"OXX/OX./O..\")))",
    "out": "X O O"
   },
   {
    "n": "winner: диагональдар",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\nprint(winner(_B(\"XO./OX./..X\")), winner(_B(\"X.O/.O./OX.\")), winner(_B(\"OXX/XO./..O\")), winner(_B(\"XXO/XO./O..\")))",
    "out": "X O O O"
   },
   {
    "n": "winner: жеңімпаз жоқ (ойын жүріп жатыр / тең)",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\nprint(winner(initial_state()), winner(_B(\"XO./.X./...\")), winner(_B(\"XOX/XOO/OXX\")))",
    "out": "None None None"
   },
   {
    "n": "terminal: ойын біткен (жеңіс және тең)",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\nprint(terminal(_B(\"XXX/OO./...\")), terminal(_B(\"XOX/XOO/OXX\")), terminal(_B(\"OXX/XO./..O\")))",
    "out": "True True True"
   },
   {
    "n": "terminal: ойын жүріп жатыр",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\nprint(terminal(initial_state()), terminal(_B(\"XO./.X./...\")), terminal(_B(\"XOX/XOO/OX.\")))",
    "out": "False False False"
   },
   {
    "n": "utility: X жеңді, O жеңді, тең",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\nprint(utility(_B(\"XXX/OO./...\")), utility(_B(\"XX./OOO/X..\")), utility(_B(\"XOX/XOO/OXX\")))",
    "out": "1 -1 0"
   },
   {
    "n": "minimax: біткен тақтада None",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\nprint(minimax(_B(\"XXX/OO./...\")), minimax(_B(\"XOX/XOO/OXX\")))",
    "out": "None None"
   },
   {
    "n": "minimax: X бірден жеңеді",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\n\ndef _lines():\n    return [[(i, 0), (i, 1), (i, 2)] for i in range(3)] + [[(0, j), (1, j), (2, j)] for j in range(3)] + [[(0, 0), (1, 1), (2, 2)], [(0, 2), (1, 1), (2, 0)]]\n\n\ndef _rw(b):\n    for ln in _lines():\n        a, c, d = (b[i][j] for i, j in ln)\n        if a is not EMPTY and a == c == d:\n            return a\n    return None\n\n\ndef _re(b):\n    return [(i, j) for i in range(3) for j in range(3) if b[i][j] is EMPTY]\n\n\ndef _rt(b):\n    n = sum(1 for r in b for c in r if c is not EMPTY)\n    return X if n % 2 == 0 else O\n\n\n_memo = {}\n\n\ndef _rv(b):\n    key = \"\".join(\".\" if c is EMPTY else c for r in b for c in r)\n    if key in _memo:\n        return _memo[key]\n    v = _rv2(b)\n    _memo[key] = v\n    return v\n\n\ndef _rv2(b):\n    w = _rw(b)\n    if w == X:\n        return 1\n    if w == O:\n        return -1\n    e = _re(b)\n    if not e:\n        return 0\n    t = _rt(b)\n    vals = []\n    for (i, j) in e:\n        nb = [r[:] for r in b]\n        nb[i][j] = t\n        vals.append(_rv(nb))\n    return max(vals) if t == X else min(vals)\n\n\ndef _opt(s):\n    b = _B(s)\n    snap = _S(b)\n    m = minimax(b)\n    if _S(b) != snap:\n        return \"minimax тақтаны өзгертіп жіберді\"\n    if not (isinstance(m, tuple) and len(m) == 2 and m in _re(b)):\n        return \"жарамсыз жүріс: \" + repr(m)\n    t = _rt(b)\n    vals = {}\n    for (i, j) in _re(b):\n        nb = [r[:] for r in b]\n        nb[i][j] = t\n        vals[(i, j)] = _rv(nb)\n    best = max(vals.values()) if t == X else min(vals.values())\n    return \"optimal\" if vals[m] == best else \"оңтайлы емес жүріс: \" + repr(m)\nprint(\"XX./OO./...\", _opt(\"XX./OO./...\"))\n",
    "out": "XX./OO./... optimal"
   },
   {
    "n": "minimax: X жеңіске жетеді (екінші позиция)",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\n\ndef _lines():\n    return [[(i, 0), (i, 1), (i, 2)] for i in range(3)] + [[(0, j), (1, j), (2, j)] for j in range(3)] + [[(0, 0), (1, 1), (2, 2)], [(0, 2), (1, 1), (2, 0)]]\n\n\ndef _rw(b):\n    for ln in _lines():\n        a, c, d = (b[i][j] for i, j in ln)\n        if a is not EMPTY and a == c == d:\n            return a\n    return None\n\n\ndef _re(b):\n    return [(i, j) for i in range(3) for j in range(3) if b[i][j] is EMPTY]\n\n\ndef _rt(b):\n    n = sum(1 for r in b for c in r if c is not EMPTY)\n    return X if n % 2 == 0 else O\n\n\n_memo = {}\n\n\ndef _rv(b):\n    key = \"\".join(\".\" if c is EMPTY else c for r in b for c in r)\n    if key in _memo:\n        return _memo[key]\n    v = _rv2(b)\n    _memo[key] = v\n    return v\n\n\ndef _rv2(b):\n    w = _rw(b)\n    if w == X:\n        return 1\n    if w == O:\n        return -1\n    e = _re(b)\n    if not e:\n        return 0\n    t = _rt(b)\n    vals = []\n    for (i, j) in e:\n        nb = [r[:] for r in b]\n        nb[i][j] = t\n        vals.append(_rv(nb))\n    return max(vals) if t == X else min(vals)\n\n\ndef _opt(s):\n    b = _B(s)\n    snap = _S(b)\n    m = minimax(b)\n    if _S(b) != snap:\n        return \"minimax тақтаны өзгертіп жіберді\"\n    if not (isinstance(m, tuple) and len(m) == 2 and m in _re(b)):\n        return \"жарамсыз жүріс: \" + repr(m)\n    t = _rt(b)\n    vals = {}\n    for (i, j) in _re(b):\n        nb = [r[:] for r in b]\n        nb[i][j] = t\n        vals[(i, j)] = _rv(nb)\n    best = max(vals.values()) if t == X else min(vals.values())\n    return \"optimal\" if vals[m] == best else \"оңтайлы емес жүріс: \" + repr(m)\nprint(\"X.O/XO./...\", _opt(\"X.O/XO./...\"))\n",
    "out": "X.O/XO./... optimal"
   },
   {
    "n": "minimax: O бірден жеңеді (минимайзер)",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\n\ndef _lines():\n    return [[(i, 0), (i, 1), (i, 2)] for i in range(3)] + [[(0, j), (1, j), (2, j)] for j in range(3)] + [[(0, 0), (1, 1), (2, 2)], [(0, 2), (1, 1), (2, 0)]]\n\n\ndef _rw(b):\n    for ln in _lines():\n        a, c, d = (b[i][j] for i, j in ln)\n        if a is not EMPTY and a == c == d:\n            return a\n    return None\n\n\ndef _re(b):\n    return [(i, j) for i in range(3) for j in range(3) if b[i][j] is EMPTY]\n\n\ndef _rt(b):\n    n = sum(1 for r in b for c in r if c is not EMPTY)\n    return X if n % 2 == 0 else O\n\n\n_memo = {}\n\n\ndef _rv(b):\n    key = \"\".join(\".\" if c is EMPTY else c for r in b for c in r)\n    if key in _memo:\n        return _memo[key]\n    v = _rv2(b)\n    _memo[key] = v\n    return v\n\n\ndef _rv2(b):\n    w = _rw(b)\n    if w == X:\n        return 1\n    if w == O:\n        return -1\n    e = _re(b)\n    if not e:\n        return 0\n    t = _rt(b)\n    vals = []\n    for (i, j) in e:\n        nb = [r[:] for r in b]\n        nb[i][j] = t\n        vals.append(_rv(nb))\n    return max(vals) if t == X else min(vals)\n\n\ndef _opt(s):\n    b = _B(s)\n    snap = _S(b)\n    m = minimax(b)\n    if _S(b) != snap:\n        return \"minimax тақтаны өзгертіп жіберді\"\n    if not (isinstance(m, tuple) and len(m) == 2 and m in _re(b)):\n        return \"жарамсыз жүріс: \" + repr(m)\n    t = _rt(b)\n    vals = {}\n    for (i, j) in _re(b):\n        nb = [r[:] for r in b]\n        nb[i][j] = t\n        vals[(i, j)] = _rv(nb)\n    best = max(vals.values()) if t == X else min(vals.values())\n    return \"optimal\" if vals[m] == best else \"оңтайлы емес жүріс: \" + repr(m)\nprint(\"OO./XX./X..\", _opt(\"OO./XX./X..\"))\n",
    "out": "OO./XX./X.. optimal"
   },
   {
    "n": "minimax: O қарсыласты тоқтатуы керек",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\n\ndef _lines():\n    return [[(i, 0), (i, 1), (i, 2)] for i in range(3)] + [[(0, j), (1, j), (2, j)] for j in range(3)] + [[(0, 0), (1, 1), (2, 2)], [(0, 2), (1, 1), (2, 0)]]\n\n\ndef _rw(b):\n    for ln in _lines():\n        a, c, d = (b[i][j] for i, j in ln)\n        if a is not EMPTY and a == c == d:\n            return a\n    return None\n\n\ndef _re(b):\n    return [(i, j) for i in range(3) for j in range(3) if b[i][j] is EMPTY]\n\n\ndef _rt(b):\n    n = sum(1 for r in b for c in r if c is not EMPTY)\n    return X if n % 2 == 0 else O\n\n\n_memo = {}\n\n\ndef _rv(b):\n    key = \"\".join(\".\" if c is EMPTY else c for r in b for c in r)\n    if key in _memo:\n        return _memo[key]\n    v = _rv2(b)\n    _memo[key] = v\n    return v\n\n\ndef _rv2(b):\n    w = _rw(b)\n    if w == X:\n        return 1\n    if w == O:\n        return -1\n    e = _re(b)\n    if not e:\n        return 0\n    t = _rt(b)\n    vals = []\n    for (i, j) in e:\n        nb = [r[:] for r in b]\n        nb[i][j] = t\n        vals.append(_rv(nb))\n    return max(vals) if t == X else min(vals)\n\n\ndef _opt(s):\n    b = _B(s)\n    snap = _S(b)\n    m = minimax(b)\n    if _S(b) != snap:\n        return \"minimax тақтаны өзгертіп жіберді\"\n    if not (isinstance(m, tuple) and len(m) == 2 and m in _re(b)):\n        return \"жарамсыз жүріс: \" + repr(m)\n    t = _rt(b)\n    vals = {}\n    for (i, j) in _re(b):\n        nb = [r[:] for r in b]\n        nb[i][j] = t\n        vals[(i, j)] = _rv(nb)\n    best = max(vals.values()) if t == X else min(vals.values())\n    return \"optimal\" if vals[m] == best else \"оңтайлы емес жүріс: \" + repr(m)\nprint(\"XX./.O./...\", _opt(\"XX./.O./...\"))\n",
    "out": "XX./.O./... optimal"
   },
   {
    "n": "minimax: O диагональды тоқтатуы керек",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\n\ndef _lines():\n    return [[(i, 0), (i, 1), (i, 2)] for i in range(3)] + [[(0, j), (1, j), (2, j)] for j in range(3)] + [[(0, 0), (1, 1), (2, 2)], [(0, 2), (1, 1), (2, 0)]]\n\n\ndef _rw(b):\n    for ln in _lines():\n        a, c, d = (b[i][j] for i, j in ln)\n        if a is not EMPTY and a == c == d:\n            return a\n    return None\n\n\ndef _re(b):\n    return [(i, j) for i in range(3) for j in range(3) if b[i][j] is EMPTY]\n\n\ndef _rt(b):\n    n = sum(1 for r in b for c in r if c is not EMPTY)\n    return X if n % 2 == 0 else O\n\n\n_memo = {}\n\n\ndef _rv(b):\n    key = \"\".join(\".\" if c is EMPTY else c for r in b for c in r)\n    if key in _memo:\n        return _memo[key]\n    v = _rv2(b)\n    _memo[key] = v\n    return v\n\n\ndef _rv2(b):\n    w = _rw(b)\n    if w == X:\n        return 1\n    if w == O:\n        return -1\n    e = _re(b)\n    if not e:\n        return 0\n    t = _rt(b)\n    vals = []\n    for (i, j) in e:\n        nb = [r[:] for r in b]\n        nb[i][j] = t\n        vals.append(_rv(nb))\n    return max(vals) if t == X else min(vals)\n\n\ndef _opt(s):\n    b = _B(s)\n    snap = _S(b)\n    m = minimax(b)\n    if _S(b) != snap:\n        return \"minimax тақтаны өзгертіп жіберді\"\n    if not (isinstance(m, tuple) and len(m) == 2 and m in _re(b)):\n        return \"жарамсыз жүріс: \" + repr(m)\n    t = _rt(b)\n    vals = {}\n    for (i, j) in _re(b):\n        nb = [r[:] for r in b]\n        nb[i][j] = t\n        vals[(i, j)] = _rv(nb)\n    best = max(vals.values()) if t == X else min(vals.values())\n    return \"optimal\" if vals[m] == best else \"оңтайлы емес жүріс: \" + repr(m)\nprint(\"X.O/.X./...\", _opt(\"X.O/.X./...\"))\n",
    "out": "X.O/.X./... optimal"
   },
   {
    "n": "minimax: екі тармақты шабуылдан қашу",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\n\ndef _lines():\n    return [[(i, 0), (i, 1), (i, 2)] for i in range(3)] + [[(0, j), (1, j), (2, j)] for j in range(3)] + [[(0, 0), (1, 1), (2, 2)], [(0, 2), (1, 1), (2, 0)]]\n\n\ndef _rw(b):\n    for ln in _lines():\n        a, c, d = (b[i][j] for i, j in ln)\n        if a is not EMPTY and a == c == d:\n            return a\n    return None\n\n\ndef _re(b):\n    return [(i, j) for i in range(3) for j in range(3) if b[i][j] is EMPTY]\n\n\ndef _rt(b):\n    n = sum(1 for r in b for c in r if c is not EMPTY)\n    return X if n % 2 == 0 else O\n\n\n_memo = {}\n\n\ndef _rv(b):\n    key = \"\".join(\".\" if c is EMPTY else c for r in b for c in r)\n    if key in _memo:\n        return _memo[key]\n    v = _rv2(b)\n    _memo[key] = v\n    return v\n\n\ndef _rv2(b):\n    w = _rw(b)\n    if w == X:\n        return 1\n    if w == O:\n        return -1\n    e = _re(b)\n    if not e:\n        return 0\n    t = _rt(b)\n    vals = []\n    for (i, j) in e:\n        nb = [r[:] for r in b]\n        nb[i][j] = t\n        vals.append(_rv(nb))\n    return max(vals) if t == X else min(vals)\n\n\ndef _opt(s):\n    b = _B(s)\n    snap = _S(b)\n    m = minimax(b)\n    if _S(b) != snap:\n        return \"minimax тақтаны өзгертіп жіберді\"\n    if not (isinstance(m, tuple) and len(m) == 2 and m in _re(b)):\n        return \"жарамсыз жүріс: \" + repr(m)\n    t = _rt(b)\n    vals = {}\n    for (i, j) in _re(b):\n        nb = [r[:] for r in b]\n        nb[i][j] = t\n        vals[(i, j)] = _rv(nb)\n    best = max(vals.values()) if t == X else min(vals.values())\n    return \"optimal\" if vals[m] == best else \"оңтайлы емес жүріс: \" + repr(m)\nprint(\"X../.O./..X\", _opt(\"X../.O./..X\"))\n",
    "out": "X../.O./..X optimal"
   },
   {
    "n": "minimax: X жеңіске жетелейтін жүріс",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\n\ndef _lines():\n    return [[(i, 0), (i, 1), (i, 2)] for i in range(3)] + [[(0, j), (1, j), (2, j)] for j in range(3)] + [[(0, 0), (1, 1), (2, 2)], [(0, 2), (1, 1), (2, 0)]]\n\n\ndef _rw(b):\n    for ln in _lines():\n        a, c, d = (b[i][j] for i, j in ln)\n        if a is not EMPTY and a == c == d:\n            return a\n    return None\n\n\ndef _re(b):\n    return [(i, j) for i in range(3) for j in range(3) if b[i][j] is EMPTY]\n\n\ndef _rt(b):\n    n = sum(1 for r in b for c in r if c is not EMPTY)\n    return X if n % 2 == 0 else O\n\n\n_memo = {}\n\n\ndef _rv(b):\n    key = \"\".join(\".\" if c is EMPTY else c for r in b for c in r)\n    if key in _memo:\n        return _memo[key]\n    v = _rv2(b)\n    _memo[key] = v\n    return v\n\n\ndef _rv2(b):\n    w = _rw(b)\n    if w == X:\n        return 1\n    if w == O:\n        return -1\n    e = _re(b)\n    if not e:\n        return 0\n    t = _rt(b)\n    vals = []\n    for (i, j) in e:\n        nb = [r[:] for r in b]\n        nb[i][j] = t\n        vals.append(_rv(nb))\n    return max(vals) if t == X else min(vals)\n\n\ndef _opt(s):\n    b = _B(s)\n    snap = _S(b)\n    m = minimax(b)\n    if _S(b) != snap:\n        return \"minimax тақтаны өзгертіп жіберді\"\n    if not (isinstance(m, tuple) and len(m) == 2 and m in _re(b)):\n        return \"жарамсыз жүріс: \" + repr(m)\n    t = _rt(b)\n    vals = {}\n    for (i, j) in _re(b):\n        nb = [r[:] for r in b]\n        nb[i][j] = t\n        vals[(i, j)] = _rv(nb)\n    best = max(vals.values()) if t == X else min(vals.values())\n    return \"optimal\" if vals[m] == best else \"оңтайлы емес жүріс: \" + repr(m)\nprint(\"XO./.X./..O\", _opt(\"XO./.X./..O\"))\n",
    "out": "XO./.X./..O optimal"
   },
   {
    "n": "minimax: O кезегі, диагональды қауіп",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\n\ndef _lines():\n    return [[(i, 0), (i, 1), (i, 2)] for i in range(3)] + [[(0, j), (1, j), (2, j)] for j in range(3)] + [[(0, 0), (1, 1), (2, 2)], [(0, 2), (1, 1), (2, 0)]]\n\n\ndef _rw(b):\n    for ln in _lines():\n        a, c, d = (b[i][j] for i, j in ln)\n        if a is not EMPTY and a == c == d:\n            return a\n    return None\n\n\ndef _re(b):\n    return [(i, j) for i in range(3) for j in range(3) if b[i][j] is EMPTY]\n\n\ndef _rt(b):\n    n = sum(1 for r in b for c in r if c is not EMPTY)\n    return X if n % 2 == 0 else O\n\n\n_memo = {}\n\n\ndef _rv(b):\n    key = \"\".join(\".\" if c is EMPTY else c for r in b for c in r)\n    if key in _memo:\n        return _memo[key]\n    v = _rv2(b)\n    _memo[key] = v\n    return v\n\n\ndef _rv2(b):\n    w = _rw(b)\n    if w == X:\n        return 1\n    if w == O:\n        return -1\n    e = _re(b)\n    if not e:\n        return 0\n    t = _rt(b)\n    vals = []\n    for (i, j) in e:\n        nb = [r[:] for r in b]\n        nb[i][j] = t\n        vals.append(_rv(nb))\n    return max(vals) if t == X else min(vals)\n\n\ndef _opt(s):\n    b = _B(s)\n    snap = _S(b)\n    m = minimax(b)\n    if _S(b) != snap:\n        return \"minimax тақтаны өзгертіп жіберді\"\n    if not (isinstance(m, tuple) and len(m) == 2 and m in _re(b)):\n        return \"жарамсыз жүріс: \" + repr(m)\n    t = _rt(b)\n    vals = {}\n    for (i, j) in _re(b):\n        nb = [r[:] for r in b]\n        nb[i][j] = t\n        vals[(i, j)] = _rv(nb)\n    best = max(vals.values()) if t == X else min(vals.values())\n    return \"optimal\" if vals[m] == best else \"оңтайлы емес жүріс: \" + repr(m)\nprint(\"XO./.X./...\", _opt(\"XO./.X./...\"))\n",
    "out": "XO./.X./... optimal"
   },
   {
    "n": "Өзіне-өзі қарсы ойын: оңтайлы ойында тең",
    "in": [],
    "append": "\ndef _B(s):\n    s = s.replace(\"/\", \"\")\n    return [[{\"X\": X, \"O\": O, \".\": EMPTY}[s[3 * i + j]] for j in range(3)] for i in range(3)]\n\n\ndef _S(b):\n    return \"/\".join(\"\".join(\".\" if c is EMPTY else c for c in row) for row in b)\n\n\nb = _B(\"X../.O./..X\")\nwhile not terminal(b):\n    b = result(b, minimax(b))\nprint(\"utility\", utility(b))\n",
    "out": "utility 0"
   }
  ],
  "note": "Тест функцияларыңызды тікелей шақырады. minimax оңтайлы екені тәуелсіз эталонмен тексеріледі (тең оңтайлы жүрістердің кез келгені жарайды)."
 }
});
