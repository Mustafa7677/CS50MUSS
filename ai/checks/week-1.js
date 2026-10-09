// CS50 AI 1-апта тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-knights": {
  "title": "Knights",
  "file": "puzzle.py",
  "starter": "from logic import *\n\nAKnight = Symbol(\"A is a Knight\")\nAKnave = Symbol(\"A is a Knave\")\n\nBKnight = Symbol(\"B is a Knight\")\nBKnave = Symbol(\"B is a Knave\")\n\nCKnight = Symbol(\"C is a Knight\")\nCKnave = Symbol(\"C is a Knave\")\n\n# Puzzle 0\n# A says \"I am both a knight and a knave.\"\nknowledge0 = And(\n    # TODO\n)\n\n# Puzzle 1\n# A says \"We are both knaves.\"\n# B says nothing.\nknowledge1 = And(\n    # TODO\n)\n\n# Puzzle 2\n# A says \"We are the same kind.\"\n# B says \"We are of different kinds.\"\nknowledge2 = And(\n    # TODO\n)\n\n# Puzzle 3\n# A says either \"I am a knight.\" or \"I am a knave.\", but you don't know which.\n# B says \"A said 'I am a knave'.\"\n# B says \"C is a knave.\"\n# C says \"A is a knight.\"\nknowledge3 = And(\n    # TODO\n)\n\n\ndef main():\n    symbols = [AKnight, AKnave, BKnight, BKnave, CKnight, CKnave]\n    puzzles = [\n        (\"Puzzle 0\", knowledge0),\n        (\"Puzzle 1\", knowledge1),\n        (\"Puzzle 2\", knowledge2),\n        (\"Puzzle 3\", knowledge3)\n    ]\n    for puzzle, knowledge in puzzles:\n        print(puzzle)\n        if len(knowledge.conjuncts) == 0:\n            print(\"    Not yet implemented.\")\n        else:\n            for symbol in symbols:\n                if model_check(knowledge, symbol):\n                    print(f\"    {symbol}\")\n\n\nif __name__ == \"__main__\":\n    main()\n",
  "tests": [
   {
    "n": "Puzzle 0: A - Knave",
    "in": [],
    "contains": "Puzzle 0\n    A is a Knave\nPuzzle 1",
    "out": "Puzzle 0\n    A is a Knave\nPuzzle 1\n    A is a Knave\n    B is a Knight\nPuzzle 2\n    A is a Knave\n    B is a Knight\nPuzzle 3\n    A is a Knight\n    B is a Knave\n    C is a Knight"
   },
   {
    "n": "Puzzle 1: A - Knave, B - Knight",
    "in": [],
    "contains": "Puzzle 1\n    A is a Knave\n    B is a Knight\nPuzzle 2",
    "out": "Puzzle 0\n    A is a Knave\nPuzzle 1\n    A is a Knave\n    B is a Knight\nPuzzle 2\n    A is a Knave\n    B is a Knight\nPuzzle 3\n    A is a Knight\n    B is a Knave\n    C is a Knight"
   },
   {
    "n": "Puzzle 2: A - Knave, B - Knight",
    "in": [],
    "contains": "Puzzle 2\n    A is a Knave\n    B is a Knight\nPuzzle 3",
    "out": "Puzzle 0\n    A is a Knave\nPuzzle 1\n    A is a Knave\n    B is a Knight\nPuzzle 2\n    A is a Knave\n    B is a Knight\nPuzzle 3\n    A is a Knight\n    B is a Knave\n    C is a Knight"
   },
   {
    "n": "Puzzle 3: A - Knight, B - Knave, C - Knight",
    "in": [],
    "contains": "Puzzle 3\n    A is a Knight\n    B is a Knave\n    C is a Knight",
    "out": "Puzzle 0\n    A is a Knave\nPuzzle 1\n    A is a Knave\n    B is a Knight\nPuzzle 2\n    A is a Knave\n    B is a Knight\nPuzzle 3\n    A is a Knight\n    B is a Knave\n    C is a Knight"
   },
   {
    "n": "Толық шығыс ресми шығыспен бірдей",
    "in": [],
    "out": "Puzzle 0\n    A is a Knave\nPuzzle 1\n    A is a Knave\n    B is a Knight\nPuzzle 2\n    A is a Knave\n    B is a Knight\nPuzzle 3\n    A is a Knight\n    B is a Knave\n    C is a Knight"
   },
   {
    "n": "knowledge0 жай ғана AKnave емес (AI өзі ойлануы керек)",
    "in": [],
    "append": "print('spirit', isinstance(knowledge0, Symbol))",
    "contains": "spirit False",
    "out": "Puzzle 0\n    A is a Knave\nPuzzle 1\n    A is a Knave\n    B is a Knight\nPuzzle 2\n    A is a Knave\n    B is a Knight\nPuzzle 3\n    A is a Knight\n    B is a Knave\n    C is a Knight\nspirit False"
   },
   {
    "n": "knowledge1 бір ғана символ емес, толық сөйлем",
    "in": [],
    "append": "print('spirit', isinstance(knowledge1, And) and len(knowledge1.conjuncts) >= 3)",
    "contains": "spirit True",
    "out": "Puzzle 0\n    A is a Knave\nPuzzle 1\n    A is a Knave\n    B is a Knight\nPuzzle 2\n    A is a Knave\n    B is a Knight\nPuzzle 3\n    A is a Knight\n    B is a Knave\n    C is a Knight\nspirit True"
   }
  ],
  "files": {
   "logic.py": "class Sentence():\n    def evaluate(self, model):\n        raise Exception(\"nothing to evaluate\")\n\n    def symbols(self):\n        return set()\n\n\nclass Symbol(Sentence):\n    def __init__(self, name):\n        self.name = name\n\n    def __repr__(self):\n        return self.name\n\n    def evaluate(self, model):\n        try:\n            return bool(model[self.name])\n        except KeyError:\n            raise Exception(f\"variable {self.name} not in model\")\n\n    def symbols(self):\n        return {self.name}\n\n\nclass Not(Sentence):\n    def __init__(self, operand):\n        self.operand = operand\n\n    def __repr__(self):\n        return f\"Not({self.operand})\"\n\n    def evaluate(self, model):\n        return not self.operand.evaluate(model)\n\n    def symbols(self):\n        return self.operand.symbols()\n\n\nclass And(Sentence):\n    def __init__(self, *conjuncts):\n        self.conjuncts = list(conjuncts)\n\n    def __repr__(self):\n        return \"And(\" + \", \".join(str(c) for c in self.conjuncts) + \")\"\n\n    def add(self, conjunct):\n        self.conjuncts.append(conjunct)\n\n    def evaluate(self, model):\n        return all(c.evaluate(model) for c in self.conjuncts)\n\n    def symbols(self):\n        return set().union(*[c.symbols() for c in self.conjuncts])\n\n\nclass Or(Sentence):\n    def __init__(self, *disjuncts):\n        self.disjuncts = list(disjuncts)\n\n    def __repr__(self):\n        return \"Or(\" + \", \".join(str(d) for d in self.disjuncts) + \")\"\n\n    def evaluate(self, model):\n        return any(d.evaluate(model) for d in self.disjuncts)\n\n    def symbols(self):\n        return set().union(*[d.symbols() for d in self.disjuncts])\n\n\nclass Implication(Sentence):\n    def __init__(self, antecedent, consequent):\n        self.antecedent = antecedent\n        self.consequent = consequent\n\n    def __repr__(self):\n        return f\"Implication({self.antecedent}, {self.consequent})\"\n\n    def evaluate(self, model):\n        return (not self.antecedent.evaluate(model)) or self.consequent.evaluate(model)\n\n    def symbols(self):\n        return self.antecedent.symbols() | self.consequent.symbols()\n\n\nclass Biconditional(Sentence):\n    def __init__(self, left, right):\n        self.left = left\n        self.right = right\n\n    def __repr__(self):\n        return f\"Biconditional({self.left}, {self.right})\"\n\n    def evaluate(self, model):\n        return self.left.evaluate(model) == self.right.evaluate(model)\n\n    def symbols(self):\n        return self.left.symbols() | self.right.symbols()\n\n\ndef model_check(knowledge, query):\n    \"\"\"KB ⊨ query болса, True қайтарады.\"\"\"\n\n    def check_all(knowledge, query, symbols, model):\n        # Әр символға мән берілген болса:\n        if not symbols:\n            # KB осы модельде ақиқат болса, query де ақиқат болуы керек\n            if knowledge.evaluate(model):\n                return query.evaluate(model)\n            return True\n        else:\n            # Әлі қолданылмаған символдардың бірін аламыз\n            remaining = symbols.copy()\n            p = remaining.pop()\n\n            # Символ True болатын модель\n            model_true = model.copy()\n            model_true[p] = True\n\n            # Символ False болатын модель\n            model_false = model.copy()\n            model_false[p] = False\n\n            # Екі модельде де ілесу орындалуы керек\n            return (check_all(knowledge, query, remaining, model_true) and\n                    check_all(knowledge, query, remaining, model_false))\n\n    # KB мен query-дегі барлық символдар\n    symbols = set.union(knowledge.symbols(), query.symbols())\n\n    # Барлық модельдерді тексереміз\n    return check_all(knowledge, query, symbols, dict())\n"
  },
  "note": "logic.py (And, Or, Not, Implication, Biconditional, model_check) осы сайтта дайын берілген, оған қол тигізбеңіз. Шығыс ресми puzzle.py-дің main функциясымен бірдей."
 },
 "py-minesweeper": {
  "title": "Minesweeper",
  "file": "minesweeper.py",
  "starter": "import itertools\nimport random\n\n\nclass Minesweeper():\n    \"\"\"\n    Minesweeper game representation\n    \"\"\"\n\n    def __init__(self, height=8, width=8, mines=8):\n\n        # Set initial width, height, and number of mines\n        self.height = height\n        self.width = width\n        self.mines = set()\n\n        # Initialize an empty field with no mines\n        self.board = []\n        for i in range(self.height):\n            row = []\n            for j in range(self.width):\n                row.append(False)\n            self.board.append(row)\n\n        # Add mines randomly\n        while len(self.mines) != mines:\n            i = random.randrange(height)\n            j = random.randrange(width)\n            if not self.board[i][j]:\n                self.mines.add((i, j))\n                self.board[i][j] = True\n\n        # At first, player has found no mines\n        self.mines_found = set()\n\n    def print(self):\n        \"\"\"\n        Prints a text-based representation\n        of where mines are located.\n        \"\"\"\n        for i in range(self.height):\n            print(\"--\" * self.width + \"-\")\n\n            for j in range(self.width):\n                if self.board[i][j]:\n                    print(\"|X\", end=\"\")\n                else:\n                    print(\"| \", end=\"\")\n            print(\"|\")\n\n        print(\"--\" * self.width + \"-\")\n\n    def is_mine(self, cell):\n        i, j = cell\n        return self.board[i][j]\n\n    def nearby_mines(self, cell):\n        \"\"\"\n        Returns the number of mines that are\n        within one row and column of a given cell,\n        not including the cell itself.\n        \"\"\"\n\n        # Keep count of nearby mines\n        count = 0\n\n        # Loop over all cells within one row and column\n        for i in range(cell[0] - 1, cell[0] + 2):\n            for j in range(cell[1] - 1, cell[1] + 2):\n\n                # Ignore the cell itself\n                if (i, j) == cell:\n                    continue\n\n                # Update count if cell in bounds and is mine\n                if 0 <= i < self.height and 0 <= j < self.width:\n                    if self.board[i][j]:\n                        count += 1\n\n        return count\n\n    def won(self):\n        \"\"\"\n        Checks if all mines have been flagged.\n        \"\"\"\n        return self.mines_found == self.mines\n\n\nclass Sentence():\n    \"\"\"\n    Logical statement about a Minesweeper game\n    A sentence consists of a set of board cells,\n    and a count of the number of those cells which are mines.\n    \"\"\"\n\n    def __init__(self, cells, count):\n        self.cells = set(cells)\n        self.count = count\n\n    def __eq__(self, other):\n        return self.cells == other.cells and self.count == other.count\n\n    def __str__(self):\n        return f\"{self.cells} = {self.count}\"\n\n    def known_mines(self):\n        \"\"\"\n        Returns the set of all cells in self.cells known to be mines.\n        \"\"\"\n        # TODO: self.cells ішінде мина екені анық ұяшықтар жиыны\n        raise NotImplementedError\n\n    def known_safes(self):\n        \"\"\"\n        Returns the set of all cells in self.cells known to be safe.\n        \"\"\"\n        # TODO: self.cells ішінде қауіпсіз екені анық ұяшықтар жиыны\n        raise NotImplementedError\n\n    def mark_mine(self, cell):\n        \"\"\"\n        Updates internal knowledge representation given the fact that\n        a cell is known to be a mine.\n        \"\"\"\n        # TODO: ұяшықты сөйлемнен алып тастаңыз, count-ты дұрыс жаңартыңыз\n        raise NotImplementedError\n\n    def mark_safe(self, cell):\n        \"\"\"\n        Updates internal knowledge representation given the fact that\n        a cell is known to be safe.\n        \"\"\"\n        # TODO: ұяшықты сөйлемнен алып тастаңыз\n        raise NotImplementedError\n\n\nclass MinesweeperAI():\n    \"\"\"\n    Minesweeper game player\n    \"\"\"\n\n    def __init__(self, height=8, width=8):\n\n        # Set initial height and width\n        self.height = height\n        self.width = width\n\n        # Keep track of which cells have been clicked on\n        self.moves_made = set()\n\n        # Keep track of cells known to be safe or mines\n        self.mines = set()\n        self.safes = set()\n\n        # List of sentences about the game known to be true\n        self.knowledge = []\n\n    def mark_mine(self, cell):\n        \"\"\"\n        Marks a cell as a mine, and updates all knowledge\n        to mark that cell as a mine as well.\n        \"\"\"\n        self.mines.add(cell)\n        for sentence in self.knowledge:\n            sentence.mark_mine(cell)\n\n    def mark_safe(self, cell):\n        \"\"\"\n        Marks a cell as safe, and updates all knowledge\n        to mark that cell as safe as well.\n        \"\"\"\n        self.safes.add(cell)\n        for sentence in self.knowledge:\n            sentence.mark_safe(cell)\n\n    def add_knowledge(self, cell, count):\n        # TODO: қадамды белгілеңіз, ұяшықты қауіпсіз деп белгілеңіз,\n        # жаңа сөйлем қосыңыз, жаңа қорытындылар мен ішкі жиын шығарымдарын жасаңыз\n        raise NotImplementedError\n\n    def make_safe_move(self):\n        # TODO: қауіпсіз екені белгілі, әлі жасалмаған қадамды қайтарыңыз (болмаса None)\n        raise NotImplementedError\n\n    def make_random_move(self):\n        # TODO: жасалмаған әрі мина емес кездейсоқ қадам (болмаса None)\n        raise NotImplementedError\n",
  "tests": [
   {
    "n": "Sentence.known_mines / known_safes",
    "in": [],
    "append": "\ns = Sentence({(0, 0), (0, 1)}, 2)\nprint(sorted(s.known_mines()), sorted(s.known_safes()))\ns = Sentence({(0, 0), (0, 1), (1, 1)}, 0)\nprint(sorted(s.known_mines()), sorted(s.known_safes()))\ns = Sentence({(0, 0), (0, 1), (1, 1)}, 1)\nprint(sorted(s.known_mines()), sorted(s.known_safes()))\n",
    "out": "[(0, 0), (0, 1)] []\n[] [(0, 0), (0, 1), (1, 1)]\n[] []"
   },
   {
    "n": "Sentence.mark_mine / mark_safe",
    "in": [],
    "append": "\ns = Sentence({(0, 0), (0, 1), (0, 2)}, 2)\ns.mark_mine((0, 2))\nprint(sorted(s.cells), s.count)\ns.mark_safe((9, 9))\ns.mark_mine((9, 9))\nprint(sorted(s.cells), s.count)\ns2 = Sentence({(0, 0), (0, 1), (0, 2)}, 2)\ns2.mark_safe((0, 0))\nprint(sorted(s2.cells), s2.count)\n",
    "out": "[(0, 0), (0, 1)] 1\n[(0, 0), (0, 1)] 1\n[(0, 1), (0, 2)] 2"
   },
   {
    "n": "add_knowledge: count 0 көршілерді қауіпсіз етеді",
    "in": [],
    "append": "\nai = MinesweeperAI(3, 3)\nai.add_knowledge((0, 0), 0)\nprint(sorted(ai.moves_made))\nprint(sorted(ai.safes))\nprint(sorted(ai.mines))\n",
    "out": "[(0, 0)]\n[(0, 0), (0, 1), (1, 0), (1, 1)]\n[]"
   },
   {
    "n": "add_knowledge: жаңа сөйлем (белгісіз көршілер = count)",
    "in": [],
    "append": "\nai = MinesweeperAI(3, 3)\nai.add_knowledge((1, 1), 1)\nprint(len(ai.knowledge), [(sorted(s.cells), s.count) for s in ai.knowledge])\n",
    "out": "1 [([(0, 0), (0, 1), (0, 2), (1, 0), (1, 2), (2, 0), (2, 1), (2, 2)], 1)]"
   },
   {
    "n": "add_knowledge: count = көрші саны болса, барлығы мина",
    "in": [],
    "append": "\nai = MinesweeperAI(2, 2)\nai.add_knowledge((0, 0), 3)\nprint(sorted(ai.mines), sorted(ai.safes), sorted(ai.moves_made))\n",
    "out": "[(0, 1), (1, 0), (1, 1)] [(0, 0)] [(0, 0)]"
   },
   {
    "n": "make_safe_move: қауіпсіз, жасалмаған, күйді өзгертпейді",
    "in": [],
    "append": "\nai = MinesweeperAI(3, 3)\nprint(ai.make_safe_move())\nai.add_knowledge((0, 0), 0)\nbefore = (set(ai.moves_made), set(ai.safes), set(ai.mines), len(ai.knowledge))\nm = ai.make_safe_move()\nprint(m in {(0, 1), (1, 0), (1, 1)}, m in ai.moves_made)\nafter = (set(ai.moves_made), set(ai.safes), set(ai.mines), len(ai.knowledge))\nprint(before == after)\nfor _ in range(5):\n    ai.moves_made.add(ai.make_safe_move())\nprint(ai.make_safe_move())\n",
    "out": "None\nTrue False\nTrue\nNone"
   },
   {
    "n": "Ішкі жиын арқылы шығару (subset inference)",
    "in": [],
    "append": "\nai = MinesweeperAI(3, 3)\nai.knowledge.append(Sentence({(0, 0), (0, 1), (0, 2)}, 1))\nai.knowledge.append(Sentence({(0, 0), (0, 1), (0, 2), (1, 0), (1, 1)}, 2))\nai.add_knowledge((2, 2), 0)\nprint(sorted(ai.safes))\nprint(sorted(ai.mines))\n",
    "out": "[(1, 1), (1, 2), (2, 1), (2, 2)]\n[(1, 0)]"
   },
   {
    "n": "3x3 ойын: AI мина баспай, мина орнын табады",
    "in": [],
    "append": "\ngame = Minesweeper(3, 3, 0)\ngame.mines = {(2, 2)}\ngame.board[2][2] = True\nai = MinesweeperAI(3, 3)\nai.add_knowledge((0, 0), game.nearby_mines((0, 0)))\nsteps = 1\nwhile True:\n    move = ai.make_safe_move()\n    if move is None:\n        break\n    assert not game.is_mine(move), \"AI мина басты!\"\n    ai.add_knowledge(move, game.nearby_mines(move))\n    steps += 1\nprint(steps)\nprint(sorted(ai.moves_made))\nprint(sorted(ai.mines))\n",
    "out": "8\n[(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1)]\n[(2, 2)]"
   },
   {
    "n": "4x4 ойын: екі мина, тізбекті шығарым",
    "in": [],
    "append": "\ngame = Minesweeper(4, 4, 0)\ngame.mines = {(0, 3), (3, 0)}\ngame.board[0][3] = True\ngame.board[3][0] = True\nai = MinesweeperAI(4, 4)\nai.add_knowledge((1, 1), game.nearby_mines((1, 1)))\nai.add_knowledge((2, 2), game.nearby_mines((2, 2)))\nai.add_knowledge((1, 2), game.nearby_mines((1, 2)))\nwhile True:\n    move = ai.make_safe_move()\n    if move is None:\n        break\n    assert not game.is_mine(move), \"AI мина басты!\"\n    ai.add_knowledge(move, game.nearby_mines(move))\nprint(len(ai.moves_made), sorted(ai.mines))\n",
    "out": "14 [(0, 3), (3, 0)]"
   },
   {
    "n": "make_random_move: жасалған қадам мен мина таңдалмайды",
    "in": [],
    "append": "\nimport random\nrandom.seed(5)\nai = MinesweeperAI(2, 2)\nai.moves_made = {(0, 0), (0, 1)}\nai.mines = {(1, 0)}\nres = {ai.make_random_move() for _ in range(40)}\nprint(sorted(res))\nai.moves_made = {(0, 0), (0, 1), (1, 1)}\nprint(ai.make_random_move())\n",
    "out": "[(1, 1)]\nNone"
   }
  ],
  "note": "Тест ойын ережесін кішкентай тақтада қайта ойнатады. pygame/runner.py қажет емес: тек minesweeper.py. make_random_move кездейсоқ болғандықтан, оған тек шарттар тексеріледі."
 }
});
