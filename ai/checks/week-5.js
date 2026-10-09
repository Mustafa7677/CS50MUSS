// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "ai-activations": {
  "title": "Активация функциялары",
  "file": "activations.py",
  "starter": "import math\n\n\ndef step(x):\n    # TODO: x >= 0 болса 1, әйтпесе 0 қайтарыңыз\n    ...\n\n\ndef sigmoid(x):\n    # TODO: 1 / (1 + e^(-x))\n    ...\n\n\ndef relu(x):\n    # TODO: теріс сан болса 0, әйтпесе x-тің өзі\n    ...\n",
  "tests": [
   {
    "n": "step(-2) -> 0",
    "in": [],
    "append": "print(round(float(step(-2)), 4))",
    "out": "0.0"
   },
   {
    "n": "step(0) -> 1 (шекте 1)",
    "in": [],
    "append": "print(round(float(step(0)), 4))",
    "out": "1.0"
   },
   {
    "n": "step(3.5) -> 1",
    "in": [],
    "append": "print(round(float(step(3.5)), 4))",
    "out": "1.0"
   },
   {
    "n": "sigmoid(0) -> 0.5",
    "in": [],
    "append": "print(round(float(sigmoid(0)), 4))",
    "out": "0.5"
   },
   {
    "n": "sigmoid(2)",
    "in": [],
    "append": "print(round(float(sigmoid(2)), 4))",
    "out": "0.8808"
   },
   {
    "n": "sigmoid(-2)",
    "in": [],
    "append": "print(round(float(sigmoid(-2)), 4))",
    "out": "0.1192"
   },
   {
    "n": "relu(-5) -> 0",
    "in": [],
    "append": "print(round(float(relu(-5)), 4))",
    "out": "0.0"
   },
   {
    "n": "relu(0) -> 0",
    "in": [],
    "append": "print(round(float(relu(0)), 4))",
    "out": "0.0"
   },
   {
    "n": "relu(4.5) -> 4.5",
    "in": [],
    "append": "print(round(float(relu(4.5)), 4))",
    "out": "4.5"
   }
  ]
 },
 "ai-neuron": {
  "title": "Бір нейрон және градиенттік қадам",
  "file": "neuron.py",
  "starter": "import math\n\n\ndef sigmoid(z):\n    return 1 / (1 + math.exp(-z))\n\n\ndef neuron(weights, bias, inputs):\n    # TODO: sigmoid(bias + w1*x1 + w2*x2 + ...) қайтарыңыз\n    ...\n\n\ndef train_step(weights, bias, inputs, target, rate):\n    # TODO: error = шығыс - target; әр w_i -= rate * error * x_i; bias -= rate * error\n    # (жаңа_салмақтар тізімі, жаңа_бейс) қайтарыңыз; бастапқы тізімді өзгертпеңіз\n    ...\n",
  "tests": [
   {
    "n": "neuron: нөлдік салмақ -> 0.5",
    "in": [],
    "append": "print(round(float(neuron([0, 0], 0, [1, 1])), 4))",
    "out": "0.5"
   },
   {
    "n": "neuron: бейс есепке алынады",
    "in": [],
    "append": "print(round(float(neuron([1, 1], -1, [0, 0])), 4))",
    "out": "0.2689"
   },
   {
    "n": "neuron([2, -1], 0.5, [1, 3])",
    "in": [],
    "append": "print(round(float(neuron([2, -1], 0.5, [1, 3])), 4))",
    "out": "0.3775"
   },
   {
    "n": "train_step: бір қадам",
    "in": [],
    "append": "w, b = train_step([0.0, 0.0], 0.0, [1, 2], 1, 0.5)\nprint([round(v, 4) for v in w], round(b, 4))",
    "out": "[0.25, 0.5] 0.25"
   },
   {
    "n": "train_step: нәтиже дұрыс болса, салмақ дерлік өзгермейді",
    "in": [],
    "append": "w, b = train_step([10, 10], 0, [1, 1], 1, 0.5)\nprint([round(v, 4) for v in w], round(b, 4))",
    "out": "[10.0, 10.0] 0.0"
   },
   {
    "n": "train_step: бастапқы тізім өзгермейді",
    "in": [],
    "append": "w0 = [1.0, -1.0]\ntrain_step(w0, 0.2, [1, 1], 0, 0.3)\nprint(w0)",
    "out": "[1.0, -1.0]"
   },
   {
    "n": "train_step: теріс нысана (target=0)",
    "in": [],
    "append": "w, b = train_step([1.0, -1.0], 0.2, [1, 1], 0, 0.3)\nprint([round(v, 4) for v in w], round(b, 4))",
    "out": "[0.835, -1.165] 0.035"
   },
   {
    "n": "OR функциясын үйрену",
    "in": [],
    "append": "\ndata = [([0, 0], 0), ([0, 1], 1), ([1, 0], 1), ([1, 1], 1)]\nw, b = [0.0, 0.0], 0.0\nfor _ in range(1500):\n    for x, y in data:\n        w, b = train_step(w, b, x, y, 0.5)\nprint([round(neuron(w, b, x)) for x, _ in data])\n",
    "out": "[0, 1, 1, 1]"
   },
   {
    "n": "AND функциясын үйрену",
    "in": [],
    "append": "\ndata = [([0, 0], 0), ([0, 1], 0), ([1, 0], 0), ([1, 1], 1)]\nw, b = [0.0, 0.0], 0.0\nfor _ in range(1500):\n    for x, y in data:\n        w, b = train_step(w, b, x, y, 0.5)\nprint([round(neuron(w, b, x)) for x, _ in data])\n",
    "out": "[0, 0, 0, 1]"
   }
  ]
 }
});
