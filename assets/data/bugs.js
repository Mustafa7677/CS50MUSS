// «Қатені тап» тренажерінің жаттығулары. bug — қате жолдың нөмірі (0-ден), fix — түзетілген жол.
window.CS50KZ_BUGS = [
  { w: "1-апта", t: "Сәлемдесу", lang: "c", code: [
    "#include <stdio.h>", "", "int main(void)", "{", "    string name = get_string(\"What's your name? \");", "    printf(\"hello, %s\\n\", name);", "}"],
    bug: 0, fix: "#include <cs50.h>\n#include <stdio.h>",
    why: "<code>string</code> мен <code>get_string</code> CS50 кітапханасында анықталған. <code>#include &lt;cs50.h&gt;</code> болмаса, компилятор оларды танымайды: «use of undeclared identifier»." },
  { w: "1-апта", t: "Салыстыру", lang: "c", code: [
    "int x = get_int(\"x: \");", "int y = get_int(\"y: \");", "if (x = y)", "{", "    printf(\"x is equal to y\\n\");", "}"],
    bug: 2, fix: "if (x == y)",
    why: "<code>=</code> — меншіктеу, <code>==</code> — салыстыру. <code>x = y</code> x-ке y-ті жазып жібереді, ал шарт y нөл болмаса әрқашан ақиқат." },
  { w: "1-апта", t: "Мысық үш рет", lang: "c", code: [
    "#include <stdio.h>", "", "int main(void)", "{", "    for (int i = 0; i <= 3; i++)", "    {", "        printf(\"meow\\n\");", "    }", "}"],
    bug: 4, fix: "    for (int i = 0; i < 3; i++)",
    why: "0-ден бастап <code>&lt;= 3</code> дегенде цикл 4 рет қайталанады: 0, 1, 2, 3. Бұл — «бірге қателесу» (off-by-one)." },
  { w: "1-апта", t: "Бөлу", lang: "c", code: [
    "int x = get_int(\"x: \");", "int y = get_int(\"y: \");", "float z = x / y;", "printf(\"%f\\n\", z);"],
    bug: 2, fix: "float z = (float) x / y;",
    why: "Екі <code>int</code>-ті бөлсе, нәтиже де <code>int</code>: бөлшек бөлігі қиылып тасталады (1 / 3 = 0). Біреуін <code>float</code>-қа айналдыру керек." },
  { w: "1-апта", t: "Нүктелі үтір", lang: "c", code: [
    "#include <stdio.h>", "", "int main(void)", "{", "    printf(\"hello, world\\n\")", "}"],
    bug: 4, fix: "    printf(\"hello, world\\n\");",
    why: "C-да әр нұсқаулық нүктелі үтірмен аяқталады. Компилятор «expected ';' after expression» дейді." },
  { w: "1-апта", t: "Формат", lang: "c", code: [
    "int n = get_int(\"n: \");", "printf(\"n is %s\\n\", n);"],
    bug: 1, fix: "printf(\"n is %i\\n\", n);",
    why: "<code>%s</code> жолға (string) арналған, ал бүтін сан үшін <code>%i</code> керек." },
  { w: "2-апта", t: "Массив шегі", lang: "c", code: [
    "int scores[3];", "scores[0] = 72;", "scores[1] = 73;", "scores[2] = 33;", "scores[3] = 100;"],
    bug: 4, fix: "// scores[3] жоқ: массивте тек 0, 1, 2 индекстері бар",
    why: "3 элементті массивтің индекстері 0, 1, 2. <code>scores[3]</code> басқа біреудің жадына жазады: бұл сегментация қатесіне не жасырын бүлінуге әкеледі." },
  { w: "2-апта", t: "Жол ұзындығы", lang: "c", code: [
    "string s = get_string(\"Input: \");", "for (int i = 0; i < strlen(s); i++)", "{", "    printf(\"%c\", s[i]);", "}", "printf(\"\\n\");"],
    bug: 1, fix: "for (int i = 0, n = strlen(s); i < n; i++)",
    why: "Бұл жұмыс істейді, бірақ дизайны нашар: <code>strlen</code> әр айналымда қайта шақырылып, бүкіл жолды қайта санайды. Ұзындықты бір рет есептеп, <code>n</code>-ге сақтаңыз." },
  { w: "3-апта", t: "Рекурсия", lang: "c", code: [
    "void draw(int n)", "{", "    draw(n - 1);", "    for (int i = 0; i < n; i++)", "    {", "        printf(\"#\");", "    }", "    printf(\"\\n\");", "}"],
    bug: 2, fix: "    if (n <= 0)\n    {\n        return;\n    }\n    draw(n - 1);",
    why: "Базалық жағдай жоқ! <code>draw</code> өзін шексіз шақырып, стек толып кетеді (stack overflow). Әр рекурсияға тоқтау шарты керек." },
  { w: "4-апта", t: "Жолдарды салыстыру", lang: "c", code: [
    "char *s = get_string(\"s: \");", "char *t = get_string(\"t: \");", "if (s == t)", "{", "    printf(\"Same\\n\");", "}"],
    bug: 2, fix: "if (strcmp(s, t) == 0)",
    why: "<code>s</code> мен <code>t</code> — көрсеткіштер. <code>==</code> мекенжайларды салыстырады, ал олар әрқашан әртүрлі. Мазмұнды салыстыру үшін <code>strcmp</code> (string.h)." },
  { w: "4-апта", t: "Жолды көшіру", lang: "c", code: [
    "char *s = get_string(\"s: \");", "char *t = s;", "t[0] = toupper(t[0]);", "printf(\"s: %s\\n\", s);"],
    bug: 1, fix: "char *t = malloc(strlen(s) + 1);\nstrcpy(t, s);",
    why: "<code>t = s</code> жолды емес, мекенжайды көшіреді: екеуі бір жолға қарайды, сондықтан <code>s</code> да өзгереді. <code>malloc</code> + <code>strcpy</code> керек (+1 — <code>\\0</code> үшін)." },
  { w: "4-апта", t: "malloc тексерісі", lang: "c", code: [
    "int *list = malloc(3 * sizeof(int));", "list[0] = 1;", "list[1] = 2;", "list[2] = 3;", "free(list);"],
    bug: 0, fix: "int *list = malloc(3 * sizeof(int));\nif (list == NULL)\n{\n    return 1;\n}",
    why: "Жад жетпесе, <code>malloc</code> <code>NULL</code> қайтарады. Оны тексермей <code>list[0]</code>-ге жазсаңыз, сегментация қатесі болады." },
  { w: "4-апта", t: "scanf", lang: "c", code: [
    "int x;", "printf(\"x: \");", "scanf(\"%i\", x);", "printf(\"x: %i\\n\", x);"],
    bug: 2, fix: "scanf(\"%i\", &x);",
    why: "<code>scanf</code> мәнді жазу үшін айнымалының <strong>мекенжайын</strong> білуі керек: <code>&amp;x</code>. Әйтпесе ол x-тің (қоқыс) мәнін мекенжай деп қабылдайды." },
  { w: "4-апта", t: "Жадтың ағуы", lang: "c", code: [
    "for (int i = 0; i < 1000; i++)", "{", "    char *buffer = malloc(64);", "    sprintf(buffer, \"line %i\", i);", "    printf(\"%s\\n\", buffer);", "}"],
    bug: 4, fix: "    printf(\"%s\\n\", buffer);\n    free(buffer);",
    why: "Әр айналымда 64 байт бөлінеді, бірақ ешқашан босатылмайды: 64 000 байт ағып кетеді. Valgrind мұны «definitely lost» деп көрсетеді." },
  { w: "5-апта", t: "Тізімді босату", lang: "c", code: [
    "node *ptr = list;", "while (ptr != NULL)", "{", "    free(ptr);", "    ptr = ptr->next;", "}"],
    bug: 3, fix: "    node *next = ptr->next;\n    free(ptr);\n    ptr = next;",
    why: "<code>free(ptr)</code>-тен кейін <code>ptr-&gt;next</code>-ке қарау — босатылған жадқа қатынау. Алдымен келесі түйінді уақытша айнымалыға сақтаңыз." },
  { w: "6-апта", t: "input() және сан", lang: "python", code: [
    "x = input(\"x: \")", "y = input(\"y: \")", "print(x + y)"],
    bug: 0, fix: "x = int(input(\"x: \"))\ny = int(input(\"y: \"))",
    why: "<code>input</code> әрқашан жол қайтарады: \"1\" + \"2\" = \"12\". Санға айналдыру үшін <code>int()</code>." },
  { w: "6-апта", t: "Шегініс", lang: "python", code: [
    "for i in range(3):", "print(\"meow\")"],
    bug: 1, fix: "    print(\"meow\")",
    why: "Python-да фигуралы жақша жоқ: цикл денесі шегініспен анықталады. Шегініссіз <code>IndentationError</code> шығады." },
  { w: "7-апта", t: "SQL инъекциясы", lang: "python", code: [
    "username = input(\"Username: \")", "rows = db.execute(f\"SELECT * FROM users WHERE username = '{username}'\")", "if rows:", "    print(\"Welcome!\")"],
    bug: 1, fix: "rows = db.execute(\"SELECT * FROM users WHERE username = ?\", username)",
    why: "Пайдаланушы енгізгені тікелей сұрауға қойылды. <code>admin'--</code> деп жазса, сұраудың қалғаны түсініктемеге айналады. Әрқашан <code>?</code> орын толтырғышын қолданыңыз." },
  { w: "1-апта", t: "do-while", lang: "c", code: [
    "int n;", "do", "{", "    n = get_int(\"Height: \");", "}", "while (n < 1)", "printf(\"Stored: %i\\n\", n);"],
    bug: 5, fix: "while (n < 1);",
    why: "<code>do-while</code> циклі нүктелі үтірмен аяқталады. Онсыз компилятор «expected ';' after do/while statement» дейді." },
  { w: "1-апта", t: "Айнымалының аясы", lang: "c", code: [
    "for (int i = 0; i < 3; i++)", "{", "    int total = i * 2;", "}", "printf(\"%i\\n\", total);"],
    bug: 4, fix: "int total = 0;\nfor (int i = 0; i < 3; i++)\n{\n    total = i * 2;\n}\nprintf(\"%i\\n\", total);",
    why: "<code>total</code> фигуралы жақшалардың ішінде жарияланды, сондықтан цикл аяқталғанда «жоғалады». Айнымалыны ол керек болатын ең сыртқы аяда жариялаңыз." },
  { w: "1-апта", t: "Шарттар тізбегі", lang: "c", code: [
    "int score = get_int(\"Score: \");", "if (score >= 50)", "{", "    printf(\"Pass\\n\");", "}", "if (score >= 90)", "{", "    printf(\"Excellent\\n\");", "}"],
    bug: 5, fix: "if (score >= 90) { ... }\nelse if (score >= 50) { ... }",
    why: "Логикалық қате: 95 ұпай болса, екі хабар да шығады. Шарттарды ең қатаңынан бастап <code>if / else if</code> тізбегімен жазыңыз." },
  { w: "1-апта", t: "Функция прототипі", lang: "c", code: [
    "#include <stdio.h>", "", "int main(void)", "{", "    meow(3);", "}", "", "void meow(int n)", "{", "    for (int i = 0; i < n; i++) printf(\"meow\\n\");", "}"],
    bug: 1, fix: "void meow(int n);",
    why: "C файлды жоғарыдан төменге оқиды: <code>main</code> ішінде <code>meow</code> әлі белгісіз. Файлдың басына прототип (функцияның «уәдесі») жазыңыз." },
  { w: "2-апта", t: "Командалық жол", lang: "c", code: [
    "int main(int argc, string argv[])", "{", "    printf(\"hello, %s\\n\", argv[1]);", "}"],
    bug: 2, fix: "if (argc != 2)\n{\n    printf(\"Usage: ./greet name\\n\");\n    return 1;\n}\nprintf(\"hello, %s\\n\", argv[1]);",
    why: "Пайдаланушы аргумент бермесе, <code>argv[1]</code> жоқ (NULL), бағдарлама құлайды. Алдымен <code>argc</code>-ті тексеріңіз." },
  { w: "2-апта", t: "Жолдың соңы", lang: "c", code: [
    "char word[3];", "word[0] = 'H';", "word[1] = 'I';", "word[2] = '!';", "printf(\"%s\\n\", word);"],
    bug: 0, fix: "char word[4];\n...\nword[3] = '\\0';",
    why: "C жолы <code>\\0</code> (NUL) таңбасымен аяқталуы керек. Онсыз <code>printf</code> жадта әрі қарай не жатса, соны да шығарады. 3 әріпке 4 байт керек." },
  { w: "2-апта", t: "Цезарь шифры", lang: "c", code: [
    "char c = 'z';", "int key = 3;", "char shifted = c + key;", "printf(\"%c\\n\", shifted);"],
    bug: 2, fix: "char shifted = 'a' + (c - 'a' + key) % 26;",
    why: "'z' + 3 әліпбиден шығып кетеді ('}' таңбасы). Әріптің индексін (0–25) алып, 26-ға бөлгендегі қалдықты (<code>%</code>) қолданыңыз." },
  { w: "3-апта", t: "Екілік іздеу", lang: "c", code: [
    "int low = 0, high = n - 1;", "while (low <= high)", "{", "    int mid = (low + high) / 2;", "    if (a[mid] == x) return true;", "    else if (a[mid] < x) low = mid;", "    else high = mid - 1;", "}"],
    bug: 5, fix: "    else if (a[mid] < x) low = mid + 1;",
    why: "<code>low = mid</code> болса, кейде аралық кішіреймейді (мысалы, low = 2, high = 3), цикл мәңгі жүреді. Ортаңғы элемент тексерілді, оны тастаңыз: <code>mid + 1</code>." },
  { w: "3-апта", t: "Ауыстыру", lang: "c", code: [
    "if (a[j] > a[j + 1])", "{", "    a[j] = a[j + 1];", "    a[j + 1] = a[j];", "}"],
    bug: 2, fix: "    int tmp = a[j];\n    a[j] = a[j + 1];\n    a[j + 1] = tmp;",
    why: "Бірінші жолдан кейін <code>a[j]</code>-дің ескі мәні жоғалады, екі ұяшықта да бірдей сан қалады. Уақытша айнымалы керек." },
  { w: "3-апта", t: "Құрылым", lang: "c", code: [
    "typedef struct", "{", "    string name;", "    string number;", "}", "person;", "", "person p;", "p->name = \"David\";"],
    bug: 8, fix: "p.name = \"David\";",
    why: "<code>p</code> — көрсеткіш емес, құрылымның өзі. Өріске нүктемен қатынасамыз: <code>p.name</code>. Көрсетігі (<code>-&gt;</code>) көрсеткіштер үшін." },
  { w: "4-апта", t: "Бос көрсеткіш", lang: "c", code: [
    "int *x;", "*x = 42;", "printf(\"%i\\n\", *x);"],
    bug: 1, fix: "int *x = malloc(sizeof(int));\n*x = 42;",
    why: "<code>x</code>-те қоқыс мекенжай тұр (Binky есіңізде ме?). Оған жазу — белгісіз жадқа жазу. Алдымен көрсеткішке нақты жад беріңіз." },
  { w: "4-апта", t: "sizeof", lang: "c", code: [
    "int *numbers = malloc(10);", "for (int i = 0; i < 10; i++)", "{", "    numbers[i] = i;", "}"],
    bug: 0, fix: "int *numbers = malloc(10 * sizeof(int));",
    why: "<code>malloc(10)</code> — 10 <strong>байт</strong>, ал 10 int-ке 40 байт керек. Valgrind «invalid write» деп көрсетеді." },
  { w: "4-апта", t: "fopen тексерісі", lang: "c", code: [
    "FILE *file = fopen(\"phonebook.csv\", \"a\");", "fprintf(file, \"%s,%s\\n\", name, number);", "fclose(file);"],
    bug: 0, fix: "FILE *file = fopen(\"phonebook.csv\", \"a\");\nif (file == NULL)\n{\n    return 1;\n}",
    why: "Файл ашылмаса, <code>fopen</code> <code>NULL</code> қайтарады. Тексермей <code>fprintf</code> шақырсаңыз, бағдарлама құлайды." },
  { w: "5-апта", t: "Тізімнің басы", lang: "c", code: [
    "node *n = malloc(sizeof(node));", "n->number = 5;", "list = n;", "n->next = list;"],
    bug: 2, fix: "n->next = list;\nlist = n;",
    why: "Рет маңызды! Алдымен <code>list = n</code> болса, ескі тізім жоғалады (жад ағады), ал <code>n-&gt;next</code> өзіне сілтейді. Алдымен жаңа түйінді ескі басқа қосыңыз." },
  { w: "5-апта", t: "Хэш-функция", lang: "c", code: [
    "unsigned int hash(const char *word)", "{", "    return word[0] - 'A';", "}"],
    bug: 2, fix: "    return toupper(word[0]) - 'A';",
    why: "Сөз кіші әріптен басталса ('a' = 97), нәтиже 32 болады: 26 шелектен тыс! <code>toupper</code> қолданыңыз." },
  { w: "6-апта", t: "Сөздіктің кілті", lang: "python", code: [
    "people = {\"Carter\": \"617-495-1000\", \"David\": \"949-468-2750\"}", "name = input(\"Name: \")", "print(people[name])"],
    bug: 2, fix: "if name in people:\n    print(people[name])\nelse:\n    print(\"Not found\")",
    why: "Кілт жоқ болса, Python <code>KeyError</code> береді. Алдымен <code>in</code> арқылы тексеріңіз (не <code>people.get(name)</code>)." },
  { w: "6-апта", t: "range", lang: "python", code: [
    "names = [\"Aigerim\", \"Arman\", \"Dana\"]", "for i in range(len(names) + 1):", "    print(names[i])"],
    bug: 1, fix: "for name in names:\n    print(name)",
    why: "<code>range(len(names) + 1)</code> соңында 3-индексті береді: <code>IndexError</code>. Python-да тізімді тікелей аралау оңай әрі қауіпсіз." },
  { w: "6-апта", t: "Әдепкі тізім", lang: "python", code: [
    "def add_item(item, items=[]):", "    items.append(item)", "    return items", "", "print(add_item(\"a\"))", "print(add_item(\"b\"))"],
    bug: 0, fix: "def add_item(item, items=None):\n    if items is None:\n        items = []",
    why: "Әдепкі мән функция анықталғанда бір рет жасалады. Екінші шақыру <code>['a', 'b']</code> қайтарады! Өзгермелі әдепкі мәндерден сақ болыңыз." },
  { w: "7-апта", t: "WHERE-сіз DELETE", lang: "sql", code: [
    "-- Тек Scratch-ты таңдағандарды өшіру керек", "DELETE FROM favorites;"],
    bug: 1, fix: "DELETE FROM favorites WHERE language = 'Scratch';",
    why: "<code>WHERE</code>-сіз <code>DELETE</code> кестедегі <strong>барлық</strong> жолды өшіреді. <code>UPDATE</code> мен <code>DELETE</code>-те әрқашан <code>WHERE</code>-ді тексеріңіз." },
  { w: "7-апта", t: "NULL-мен салыстыру", lang: "sql", code: [
    "SELECT COUNT(*) FROM shows", "WHERE year = NULL;"],
    bug: 1, fix: "WHERE year IS NULL;",
    why: "<code>NULL</code> «белгісіз» дегенді білдіреді, оны <code>=</code>-мен салыстыруға болмайды. <code>IS NULL</code> не <code>IS NOT NULL</code> қолданыңыз." },
  { w: "8-апта", t: "Сілтеме", lang: "html", code: [
    "<p>", "    Visit <a src=\"https://www.harvard.edu/\">Harvard</a>.", "</p>"],
    bug: 1, fix: "    Visit <a href=\"https://www.harvard.edu/\">Harvard</a>.",
    why: "Сілтеменің мекенжайы <code>href</code> атрибутында. <code>src</code> суреттер мен скрипттерге арналған." },
  { w: "8-апта", t: "querySelector", lang: "javascript", code: [
    "<input id=\"name\" type=\"text\">", "<script>", "    let name = document.querySelector('name').value;", "</script>"],
    bug: 2, fix: "    let name = document.querySelector('#name').value;",
    why: "<code>querySelector</code> CSS селекторын қабылдайды: ID үшін <code>#</code> керек. <code>'name'</code> <code>&lt;name&gt;</code> тегін іздейді, нәтиже <code>null</code>." },
  { w: "9-апта", t: "POST маршруты", lang: "python", code: [
    "@app.route(\"/register\")", "def register():", "    name = request.form.get(\"name\")", "    ...", "", "# HTML: <form action=\"/register\" method=\"post\">"],
    bug: 0, fix: "@app.route(\"/register\", methods=[\"POST\"])",
    why: "Flask маршруттары әдепкіде тек <code>GET</code>-ті қабылдайды. Форма <code>POST</code> жіберсе, «405 Method Not Allowed» шығады." },
  { w: "9-апта", t: "args пен form", lang: "python", code: [
    "# HTML: <form action=\"/greet\" method=\"post\">", "", "@app.route(\"/greet\", methods=[\"POST\"])", "def greet():", "    name = request.args.get(\"name\")", "    return render_template(\"greet.html\", name=name)"],
    bug: 4, fix: "    name = request.form.get(\"name\")",
    why: "<code>request.args</code> — URL параметрлері (GET). POST деректері <code>request.form</code>-да. Әйтпесе <code>name</code> әрқашан <code>None</code>." },
];
