// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-nim": {
  "title": "Nim (NimAI)",
  "file": "nim.py",
  "starter": "import random\n\n\nclass Nim():\n\n    def __init__(self, initial=[1, 3, 5, 7]):\n        self.piles = initial.copy()\n        self.player = 0\n        self.winner = None\n\n    @classmethod\n    def available_actions(cls, piles):\n        actions = set()\n        for i, pile in enumerate(piles):\n            for j in range(1, pile + 1):\n                actions.add((i, j))\n        return actions\n\n    @classmethod\n    def other_player(cls, player):\n        return 0 if player == 1 else 1\n\n    def switch_player(self):\n        self.player = Nim.other_player(self.player)\n\n    def move(self, action):\n        pile, count = action\n        if self.winner is not None:\n            raise Exception(\"Game already won\")\n        elif pile < 0 or pile >= len(self.piles):\n            raise Exception(\"Invalid pile\")\n        elif count < 1 or count > self.piles[pile]:\n            raise Exception(\"Invalid number of objects\")\n        self.piles[pile] -= count\n        self.switch_player()\n        if all(pile == 0 for pile in self.piles):\n            self.winner = self.player\n\n\nclass NimAI():\n\n    def __init__(self, alpha=0.5, epsilon=0.1):\n        self.q = dict()\n        self.alpha = alpha\n        self.epsilon = epsilon\n\n    def update(self, old_state, action, new_state, reward):\n        old = self.get_q_value(old_state, action)\n        best_future = self.best_future_reward(new_state)\n        self.update_q_value(old_state, action, old, reward, best_future)\n\n    def get_q_value(self, state, action):\n        # TODO: self.q кілті (tuple(state), action); жазба жоқ болса 0 қайтарыңыз\n        ...\n\n    def update_q_value(self, state, action, old_q, reward, future_rewards):\n        # TODO: Q(s, a) <- old_q + alpha * ((reward + future_rewards) - old_q)\n        ...\n\n    def best_future_reward(self, state):\n        # TODO: күйдегі барлық қолжетімді әрекеттің ең жоғары Q-мәні (белгісізі = 0, әрекет жоқ болса 0)\n        ...\n\n    def choose_action(self, state, epsilon=True):\n        # TODO: epsilon=False болса - ашкөз (ең жақсы әрекет);\n        #       epsilon=True болса - self.epsilon ықтималдығымен кездейсоқ әрекет\n        ...\n\n\ndef train(n, initial=[1, 2]):\n    player = NimAI()\n    for i in range(n):\n        game = Nim(initial)\n        last = {\n            0: {\"state\": None, \"action\": None},\n            1: {\"state\": None, \"action\": None}\n        }\n        while True:\n            state = game.piles.copy()\n            action = player.choose_action(game.piles)\n            last[game.player][\"state\"] = state\n            last[game.player][\"action\"] = action\n            game.move(action)\n            new_state = game.piles.copy()\n            if game.winner is not None:\n                player.update(state, action, new_state, -1)\n                player.update(last[game.player][\"state\"], last[game.player][\"action\"], new_state, 1)\n                break\n            elif last[game.player][\"state\"] is not None:\n                player.update(last[game.player][\"state\"], last[game.player][\"action\"], new_state, 0)\n    return player\n",
  "tests": [
   {
    "n": "get_q_value: белгісіз жұп үшін 0",
    "in": [],
    "append": "ai = NimAI()\nprint(ai.get_q_value([0, 0, 0, 2], (3, 2)))",
    "out": "0"
   },
   {
    "n": "get_q_value: күй тізім болса да кілт tuple (self.q[(0,0,0,2),(3,2)] = -1)",
    "in": [],
    "append": "ai = NimAI()\nai.q[(0, 0, 0, 2), (3, 2)] = -1\nprint(ai.get_q_value([0, 0, 0, 2], (3, 2)))\nprint(ai.get_q_value([0, 0, 0, 2], (3, 1)))\nprint(ai.get_q_value([0, 0, 1, 2], (3, 2)))",
    "out": "-1\n0\n0"
   },
   {
    "n": "update_q_value: alpha=0.5, old=0, reward=-1, future=0 -> -0.5",
    "in": [],
    "append": "ai = NimAI(alpha=0.5)\nai.update_q_value([0, 0, 0, 2], (3, 2), 0, -1, 0)\nprint(ai.q[(0, 0, 0, 2), (3, 2)])",
    "out": "-0.5"
   },
   {
    "n": "update_q_value: old=0.5, reward=1, future=0.5, alpha=0.4 -> 0.9 (ескі баға ескеріледі)",
    "in": [],
    "append": "ai = NimAI(alpha=0.4)\nai.update_q_value([1, 1], (0, 1), 0.5, 1, 0.5)\nprint(round(ai.q[(1, 1), (0, 1)], 6))",
    "out": "0.9"
   },
   {
    "n": "update_q_value: new = old болса мән өзгермейді",
    "in": [],
    "append": "ai = NimAI(alpha=0.3)\nai.update_q_value([2], (0, 1), 0.8, 0.5, 0.3)\nprint(round(ai.q[(2,), (0, 1)], 6))",
    "out": "0.8"
   },
   {
    "n": "best_future_reward: әрекет жоқ күйде ([0, 0]) -> 0",
    "in": [],
    "append": "ai = NimAI()\nprint(ai.best_future_reward([0, 0]))",
    "out": "0"
   },
   {
    "n": "best_future_reward: белгісіздер 0 деп саналады (бірі -1, қалғаны жоқ -> 0)",
    "in": [],
    "append": "ai = NimAI()\nai.q[(1, 2), (0, 1)] = -1\nprint(ai.best_future_reward([1, 2]))",
    "out": "0"
   },
   {
    "n": "best_future_reward: ең үлкен мәнді табады (0.7)",
    "in": [],
    "append": "ai = NimAI()\nai.q[(1, 2), (0, 1)] = -1\nai.q[(1, 2), (1, 1)] = 0.7\nai.q[(1, 2), (1, 2)] = 0.2\nai.q[(2, 2), (0, 1)] = 5\nprint(ai.best_future_reward([1, 2]))",
    "out": "0.7"
   },
   {
    "n": "best_future_reward: барлығы белгілі әрі теріс (-0.2)",
    "in": [],
    "append": "ai = NimAI()\nai.q[(1, 1), (0, 1)] = -0.5\nai.q[(1, 1), (1, 1)] = -0.2\nprint(ai.best_future_reward([1, 1]))",
    "out": "-0.2"
   },
   {
    "n": "update: екі қадамды Q-жаңарту тізбегі (-0.5, содан кейін -0.25)",
    "in": [],
    "append": "ai = NimAI(alpha=0.5)\nai.update([0, 1], (1, 1), [0, 0], -1)\nai.update([1, 1], (0, 1), [0, 1], 0)\nprint(ai.q[(0, 1), (1, 1)])\nprint(ai.q[(1, 1), (0, 1)])",
    "out": "-0.5\n-0.25"
   },
   {
    "n": "choose_action(epsilon=False): ең жоғары Q-мәні бар әрекет",
    "in": [],
    "append": "ai = NimAI()\nai.q[(1, 2), (0, 1)] = -1\nai.q[(1, 2), (1, 1)] = 0.7\nai.q[(1, 2), (1, 2)] = 0.2\nprint(ai.choose_action([1, 2], epsilon=False))",
    "out": "(1, 1)"
   },
   {
    "n": "choose_action(epsilon=False): белгісіз әрекет (0) теріс білінгеннен жақсы",
    "in": [],
    "append": "ai = NimAI()\nai.q[(1, 2), (0, 1)] = -1\nai.q[(1, 2), (1, 1)] = -1\nprint(ai.choose_action([1, 2], epsilon=False))",
    "out": "(1, 2)"
   },
   {
    "n": "choose_action(epsilon=False) әрқашан бірдей және қолжетімді әрекет қайтарады",
    "in": [],
    "append": "ai = NimAI()\nai.q[(2, 3), (1, 3)] = 1\nres = {ai.choose_action([2, 3], epsilon=False) for _ in range(30)}\nprint(res)",
    "out": "{(1, 3)}"
   },
   {
    "n": "choose_action(epsilon=True, epsilon=0): ашкөз әрекет",
    "in": [],
    "append": "ai = NimAI(epsilon=0)\nai.q[(1, 2), (1, 2)] = 0.9\nprint({ai.choose_action([1, 2]) for _ in range(30)})",
    "out": "{(1, 2)}"
   },
   {
    "n": "choose_action(epsilon=True, epsilon=1): әртүрлі әрекеттер зерттеледі, бәрі қолжетімді",
    "in": [],
    "seed": 1,
    "append": "ai = NimAI(epsilon=1.0)\nai.q[(1, 2), (1, 2)] = 5\nseen = {ai.choose_action([1, 2]) for _ in range(200)}\nprint(len(seen) > 1, seen <= Nim.available_actions([1, 2]))",
    "out": "True True"
   },
   {
    "n": "choose_action(epsilon=False, epsilon=1.0 болса да): кездейсоқтық қолданылмайды",
    "in": [],
    "append": "ai = NimAI(epsilon=1.0)\nai.q[(1, 2), (1, 2)] = 5\nprint({ai.choose_action([1, 2], epsilon=False) for _ in range(100)})",
    "out": "{(1, 2)}"
   },
   {
    "n": "train(150): [1, 2] күйінде жеңімпаз әрекет (1, 2) үйренеді",
    "in": [],
    "seed": 0,
    "append": "import random\nrandom.seed(0)\nai = train(150)\nprint(ai.choose_action([1, 2], epsilon=False))\nprint(ai.q[(1, 2), (1, 2)] > 0)",
    "out": "(1, 2)\nTrue"
   }
  ],
  "note": "Автотексеруші NimAI әдістерін тікелей шақырады. Nim класы мен train функциясы дайын берілген (түпнұсқадағы train(n) орнына мұнда train(n, initial) жеңілдетілген: бастапқы үйінділер қысқа болсын деп). Тек get_q_value, update_q_value, best_future_reward және choose_action әдістерін толтырыңыз."
 }
});
