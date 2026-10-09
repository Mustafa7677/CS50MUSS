// CS50P тапсырмаларының браузердегі тесттері (check50-ге ұқсас). Күтілетін нәтижелер эталон шешіммен есептелген.
window.CS50KZ_CHECKS = Object.assign(window.CS50KZ_CHECKS || {}, {
 "py-resolve": {
  "title": "Мини URL-маршрутизатор (resolve)",
  "file": "resolve.py",
  "starter": "def resolve(path, urlpatterns):\n    # TODO: path-ты (мысалы \"harry\" не \"posts/7\") бөлшектерге бөліңіз\n    # TODO: urlpatterns тізімін ретімен аралап, бірінші сәйкес келгенін табыңыз\n    # TODO: <str:аты> кез келген бос емес бөлікті, <int:аты> тек цифрларды қабылдайды (мәні int болады)\n    # TODO: сәйкес келсе (name, {параметрлер}) қайтарыңыз, әйтпесе None\n    ...\n",
  "tests": [
   {
    "n": "Бос жол -> index",
    "in": [],
    "append": "pats = [(\"\", \"index\"), (\"brian\", \"brian\"), (\"david\", \"david\"), (\"posts/<int:id>\", \"post\"), (\"<str:name>\", \"greet\")]\nprint(repr(resolve('', pats)))",
    "out": "('index', {})"
   },
   {
    "n": "brian нақты маршрут",
    "in": [],
    "append": "pats = [(\"\", \"index\"), (\"brian\", \"brian\"), (\"david\", \"david\"), (\"posts/<int:id>\", \"post\"), (\"<str:name>\", \"greet\")]\nprint(repr(resolve('brian', pats)))",
    "out": "('brian', {})"
   },
   {
    "n": "Алдымен нақты маршрут, сосын <str:name>",
    "in": [],
    "append": "pats = [(\"\", \"index\"), (\"brian\", \"brian\"), (\"david\", \"david\"), (\"posts/<int:id>\", \"post\"), (\"<str:name>\", \"greet\")]\nprint(repr(resolve('david', pats)))",
    "out": "('david', {})"
   },
   {
    "n": "<str:name> кез келген атты алады",
    "in": [],
    "append": "pats = [(\"\", \"index\"), (\"brian\", \"brian\"), (\"david\", \"david\"), (\"posts/<int:id>\", \"post\"), (\"<str:name>\", \"greet\")]\nprint(repr(resolve('harry', pats)))",
    "out": "('greet', {'name': 'harry'})"
   },
   {
    "n": "Жол басындағы / ескерілмейді",
    "in": [],
    "append": "pats = [(\"\", \"index\"), (\"brian\", \"brian\"), (\"david\", \"david\"), (\"posts/<int:id>\", \"post\"), (\"<str:name>\", \"greet\")]\nprint(repr(resolve('/connor/', pats)))",
    "out": "('greet', {'name': 'connor'})"
   },
   {
    "n": "<int:id> санды int қылады",
    "in": [],
    "append": "pats = [(\"\", \"index\"), (\"brian\", \"brian\"), (\"david\", \"david\"), (\"posts/<int:id>\", \"post\"), (\"<str:name>\", \"greet\")]\nprint(repr(resolve('posts/7', pats)))",
    "out": "('post', {'id': 7})"
   },
   {
    "n": "<int:id> әріпті қабылдамайды",
    "in": [],
    "append": "pats = [(\"\", \"index\"), (\"brian\", \"brian\"), (\"david\", \"david\"), (\"posts/<int:id>\", \"post\"), (\"<str:name>\", \"greet\")]\nprint(repr(resolve('posts/abc', pats)))",
    "out": "None"
   },
   {
    "n": "Сәйкес келмейтін жол -> None",
    "in": [],
    "append": "pats = [(\"\", \"index\"), (\"brian\", \"brian\"), (\"david\", \"david\"), (\"posts/<int:id>\", \"post\"), (\"<str:name>\", \"greet\")]\nprint(repr(resolve('a/b/c', pats)))",
    "out": "None"
   }
  ]
 },
 "py-search": {
  "title": "Wiki іздеуі (search)",
  "file": "search.py",
  "starter": "def search(query, entries):\n    # TODO: аты query-ге (регистрге қарамай) толық тең жазба болса: (\"redirect\", сол жазбаның аты)\n    # TODO: әйтпесе: (\"results\", query ішкі жол болатын барлық атаулар тізімі, entries ретімен)\n    ...\n",
  "tests": [
   {
    "n": "Дәл сәйкестік -> redirect",
    "in": [],
    "append": "entries = [\"CSS\", \"Django\", \"Git\", \"HTML\", \"Python\"]\nprint(repr(search('Django', entries)))",
    "out": "('redirect', 'Django')"
   },
   {
    "n": "Регистрге қарамайды: python",
    "in": [],
    "append": "entries = [\"CSS\", \"Django\", \"Git\", \"HTML\", \"Python\"]\nprint(repr(search('python', entries)))",
    "out": "('redirect', 'Python')"
   },
   {
    "n": "Ішкі жол: ytho -> Python",
    "in": [],
    "append": "entries = [\"CSS\", \"Django\", \"Git\", \"HTML\", \"Python\"]\nprint(repr(search('ytho', entries)))",
    "out": "('results', ['Python'])"
   },
   {
    "n": "Бірнеше нәтиже: t",
    "in": [],
    "append": "entries = [\"CSS\", \"Django\", \"Git\", \"HTML\", \"Python\"]\nprint(repr(search('t', entries)))",
    "out": "('results', ['Git', 'HTML', 'Python'])"
   },
   {
    "n": "Ештеңе табылмаса бос тізім",
    "in": [],
    "append": "entries = [\"CSS\", \"Django\", \"Git\", \"HTML\", \"Python\"]\nprint(repr(search('java', entries)))",
    "out": "('results', [])"
   },
   {
    "n": "Ішкі жол ортасынан да: it",
    "in": [],
    "append": "entries = [\"CSS\", \"Django\", \"Git\", \"HTML\", \"Python\"]\nprint(repr(search('it', entries)))",
    "out": "('results', ['Git'])"
   }
  ]
 }
});
