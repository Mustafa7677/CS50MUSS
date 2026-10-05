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
];
