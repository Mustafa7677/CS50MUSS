// CS50 Web: JavaScript автотексерушісінің тесттері. Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_JSCHECKS = Object.assign(window.CS50KZ_JSCHECKS || {}, {
 "js-reducer-counter": {
  "title": "Санауыш редьюсері (сайттың өз жаттығуы)",
  "file": "counter.js",
  "starter": "// TODO: reducer(state, action) - күйдің ЖАҢА көшірмесін қайтарсын (state-ті өзгертпеңіз!).\n// state: {count: 0, label: \"Санауыш\"}\n// action.type:\n//   \"increment\" - count 1-ге артады\n//   \"decrement\" - count 1-ге кемиді\n//   \"add\"       - count action.amount-қа артады\n//   \"reset\"     - count 0 болады\n//   басқа түр   - бұрынғы state-тің өзін қайтарыңыз\nfunction reducer(state, action) {\n    // ...\n}\n",
  "tests": [
   {
    "n": "increment: {count: 0} → {count: 1}",
    "run": "reducer({count: 0, label: \"A\"}, {type: \"increment\"})",
    "out": {
     "count": 1,
     "label": "A"
    }
   },
   {
    "n": "decrement: 5 → 4",
    "run": "reducer({count: 5, label: \"A\"}, {type: \"decrement\"})",
    "out": {
     "count": 4,
     "label": "A"
    }
   },
   {
    "n": "add: 10 + 7",
    "run": "reducer({count: 10, label: \"A\"}, {type: \"add\", amount: 7})",
    "out": {
     "count": 17,
     "label": "A"
    }
   },
   {
    "n": "reset: count → 0, label сақталады",
    "run": "reducer({count: 42, label: \"Санауыш\"}, {type: \"reset\"})",
    "out": {
     "count": 0,
     "label": "Санауыш"
    }
   },
   {
    "n": "белгісіз түр: күй өзгермейді",
    "run": "reducer({count: 3, label: \"A\"}, {type: \"unknown\"})",
    "out": {
     "count": 3,
     "label": "A"
    }
   },
   {
    "n": "бастапқы state өзгермеуі керек",
    "run": "(() => { const s = {count: 1, label: \"A\"}; reducer(s, {type: \"increment\"}); reducer(s, {type: \"add\", amount: 5}); return s; })()",
    "out": {
     "count": 1,
     "label": "A"
    }
   },
   {
    "n": "тізбектеп қолдану: 3 рет increment, 1 decrement",
    "run": "[\"increment\",\"increment\",\"increment\",\"decrement\"].reduce((s, t) => reducer(s, {type: t}), {count: 0, label: \"A\"})",
    "out": {
     "count": 2,
     "label": "A"
    }
   }
  ],
  "note": "Функция атауы reducer болсын. Нәтижені return арқылы қайтарыңыз; state объектісін өзгертпей, жаңа объект жасаңыз (мысалы, {...state, count: ...}); басқа өрістер (label) сақталуы керек."
 },
 "js-reducer-game": {
  "title": "Қосу ойыны: күй редьюсері (сайттың өз жаттығуы)",
  "file": "game.js",
  "starter": "// TODO: reducer(state, action) - лекциядағы қосу ойынының логикасы.\n// state: {num1, num2, response, score}\n// {type: \"respond\", value: \"12\"} - response = value (қалған өрістер сақталады)\n// {type: \"submit\", next: [a, b]}:\n//    жауап дұрыс (parseInt(response) === num1 + num2) болса: score + 1, response = \"\", num1 = a, num2 = b\n//    қате болса: score - 1, response = \"\" (num1 мен num2 өзгермейді)\n// басқа түр: state-тің өзін қайтарыңыз\nfunction reducer(state, action) {\n    // ...\n}\n",
  "tests": [
   {
    "n": "respond: response жаңарады, қалғаны сақталады",
    "run": "reducer({num1: 3, num2: 4, response: \"\", score: 2}, {type: \"respond\", value: \"7\"})",
    "out": {
     "num1": 3,
     "num2": 4,
     "response": "7",
     "score": 2
    }
   },
   {
    "n": "submit: дұрыс жауап",
    "run": "reducer({num1: 3, num2: 4, response: \"7\", score: 2}, {type: \"submit\", next: [9, 1]})",
    "out": {
     "num1": 9,
     "num2": 1,
     "response": "",
     "score": 3
    }
   },
   {
    "n": "submit: қате жауап",
    "run": "reducer({num1: 3, num2: 4, response: \"8\", score: 2}, {type: \"submit\", next: [9, 1]})",
    "out": {
     "num1": 3,
     "num2": 4,
     "response": "",
     "score": 1
    }
   },
   {
    "n": "қате жауап ұпайды теріс қылуы мүмкін",
    "run": "reducer({num1: 1, num2: 1, response: \"\", score: 0}, {type: \"submit\", next: [5, 5]})",
    "out": {
     "num1": 1,
     "num2": 1,
     "response": "",
     "score": -1
    }
   },
   {
    "n": "белгісіз түр",
    "run": "reducer({num1: 1, num2: 1, response: \"x\", score: 0}, {type: \"noop\"})",
    "out": {
     "num1": 1,
     "num2": 1,
     "response": "x",
     "score": 0
    }
   },
   {
    "n": "бастапқы state өзгермейді",
    "run": "(() => { const s = {num1: 3, num2: 4, response: \"7\", score: 2}; reducer(s, {type: \"submit\", next: [1, 2]}); reducer(s, {type: \"respond\", value: \"1\"}); return s; })()",
    "out": {
     "num1": 3,
     "num2": 4,
     "response": "7",
     "score": 2
    }
   },
   {
    "n": "толық ойын: теру, жіберу",
    "run": "[{type:\"respond\",value:\"2\"},{type:\"submit\",next:[4,4]},{type:\"respond\",value:\"8\"},{type:\"submit\",next:[1,1]}].reduce(reducer, {num1: 1, num2: 1, response: \"\", score: 0})",
    "out": {
     "num1": 1,
     "num2": 1,
     "response": "",
     "score": 2
    }
   }
  ],
  "note": "Функция атауы reducer болсын. Жаңа объект қайтарыңыз (...state), бастапқы state өзгермесін. Кездейсоқ сандарды reducer-дің өзі таңдамайды: оларды action.next арқылы береміз."
 },
 "js-posts": {
  "title": "Жазбалар тізімі: массивті өзгертпей жаңарту (сайттың өз жаттығуы)",
  "file": "posts.js",
  "starter": "// Әр жазба: {id, text, likes}. Үш функция да ЖАҢА массив қайтарсын, бастапқы массивті өзгертпесін.\n\n// TODO: addPost(posts, text) - соңына {id, text, likes: 0} қосады; id = бар id-лердің ең үлкені + 1 (массив бос болса 1).\nfunction addPost(posts, text) {\n    // ...\n}\n\n// TODO: likePost(posts, id) - сол id-лі жазбаның likes мәнін 1-ге арттырады, қалғандары өзгермейді.\nfunction likePost(posts, id) {\n    // ...\n}\n\n// TODO: removePost(posts, id) - сол id-лі жазбаны алып тастайды.\nfunction removePost(posts, id) {\n    // ...\n}\n",
  "tests": [
   {
    "n": "addPost: бос массив → id 1",
    "run": "addPost([], \"Сәлем\")",
    "out": [
     {
      "id": 1,
      "text": "Сәлем",
      "likes": 0
     }
    ]
   },
   {
    "n": "addPost: id = ең үлкен id + 1 (қалып қойған id-лермен)",
    "run": "addPost([{id: 2, text: \"a\", likes: 1}, {id: 7, text: \"b\", likes: 0}], \"c\")",
    "out": [
     {
      "id": 2,
      "text": "a",
      "likes": 1
     },
     {
      "id": 7,
      "text": "b",
      "likes": 0
     },
     {
      "id": 8,
      "text": "c",
      "likes": 0
     }
    ]
   },
   {
    "n": "likePost: тек керек жазбаның like-ы артады",
    "run": "likePost([{id: 1, text: \"a\", likes: 0}, {id: 2, text: \"b\", likes: 4}], 2)",
    "out": [
     {
      "id": 1,
      "text": "a",
      "likes": 0
     },
     {
      "id": 2,
      "text": "b",
      "likes": 5
     }
    ]
   },
   {
    "n": "likePost: жоқ id - ештеңе өзгермейді",
    "run": "likePost([{id: 1, text: \"a\", likes: 0}], 99)",
    "out": [
     {
      "id": 1,
      "text": "a",
      "likes": 0
     }
    ]
   },
   {
    "n": "removePost",
    "run": "removePost([{id: 1, text: \"a\", likes: 0}, {id: 2, text: \"b\", likes: 4}, {id: 3, text: \"c\", likes: 1}], 2)",
    "out": [
     {
      "id": 1,
      "text": "a",
      "likes": 0
     },
     {
      "id": 3,
      "text": "c",
      "likes": 1
     }
    ]
   },
   {
    "n": "бастапқы массив өзгермейді",
    "run": "(() => { const p = [{id: 1, text: \"a\", likes: 0}]; addPost(p, \"x\"); likePost(p, 1); removePost(p, 1); return p; })()",
    "out": [
     {
      "id": 1,
      "text": "a",
      "likes": 0
     }
    ]
   },
   {
    "n": "тізбектеп: қосу, like, жою",
    "run": "removePost(likePost(addPost(addPost([], \"a\"), \"b\"), 2), 1)",
    "out": [
     {
      "id": 2,
      "text": "b",
      "likes": 1
     }
    ]
   }
  ],
  "note": "Үш функция атауы: addPost, likePost, removePost. Қолайлы құралдар: оператор ... (spread), map, filter. push, splice немесе posts[i].likes++ қолданбаңыз: ол бастапқы массивті бұзады."
 }
});
