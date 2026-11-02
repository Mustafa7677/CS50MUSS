# © 2026 Sagid Mustafa. All Rights Reserved.
# Java 3-апта: кластар, инкапсуляция, static, Object әдістері, пакеттер, қоқыс жинау - жолма-жол талдау.

CX = {
    2: dict(
        lines=[("private final String iesi;", "<code>private</code> - сырттан көрінбейді; <code>final</code> - конструкторда бір рет беріліп, кейін өзгермейді."),
               ("this.qaldyq = Math.max(0, bastapqy);", "конструктор теріс бастапқы соманы 0-ге түзетеді - нысан басынан дұрыс күйде."),
               ("boolean aluy(long soma) {", "ақша алу тексерумен: сәттілігін <code>boolean</code>-мен хабарлайды."),
               ("if (soma <= 0 || soma > qaldyq) {", "теріс сома не қалдықтан көп - бас тартамыз, қалдық өзгермейді."),
               ("class Hamyan {", "бір файлда бірнеше класс болуы мүмкін, бірақ <code>public</code> - тек біреуі, файл атымен аттас.")],
        out="10000 + 5000 = 15000; 20000 алу сәтсіз (жетпейді); 3500 алынды - қалдық 11500. Қалдыққа тек әдістер арқылы ғана әсер еттік.",
        err="Өрісті <code>public long qaldyq;</code> қылу: кез келген код <code>h.qaldyq = -1000000;</code> жаза алады, тексеру айналып өтіледі. Әр жабық өріске автоматты сеттер жазу да сол қате - тек мағыналы әрекеттер (<code>salu</code>, <code>aluy</code>) ашыңыз.",
        expect=["Нұрлан: 10000", "Қалдық: 11500"]),
    4: dict(
        lines=[("static int sany = 0;                       // барлық оқушыға ортақ", "<code>static</code> өріс - класқа біреу, нысандарға ортақ санағыш."),
               ('static final String MEKTEP = "№12 мектеп"; // тұрақты', "<code>static final</code> - класс тұрақтысы."),
               ("this.nomer = sany;", "әр нысан ортақ санағыштың сол сәттегі мәнін өз нөміріне жазады."),
               ("static String statistika() {", "<code>static</code> әдіс - нысансыз шақырылады: <code>Oqushy.statistika()</code>."),
               ("Math.sqrt(144)", "<code>Math</code> әдістері де <code>static</code>: нысан жасамаймыз.")],
        out="Нысан жасалмай тұрып санағыш 0; Дана - үшінші, нөмірі 3. <code>Math.sqrt</code> әрқашан <code>double</code> қайтарады - 12.0.",
        err="<code>static</code> әдісте нысан өрісіне (<code>ataui</code>) жүгіну: «non-static variable cannot be referenced from a static context». <code>static</code> әдіс қай нысан екенін білмейді.",
        expect=["Барлығы: 0 оқушы", "3. Дана (№12 мектеп)", "12.0 8 4.5"]),
    5: dict(
        lines=[("System.out.println(a);", "<code>toString</code> жазылмаған - <code>Object</code>-тің әдепкі нұсқасы қолданылады.")],
        err="Әдепкі <code>toString</code> <code>Aspap@1b6d3586</code> сияқты «класс аты + хэш» шығарады; хэш әр іске қосуда өзгереді, сондықтан біз нәтижені бекітіп көрсетпейміз. Деректер класына әрқашан <code>toString</code> жазыңыз (келесі мысал) не <code>record</code> қолданыңыз."),
    6: dict(
        lines=[("@Override", "аннотация: «бұл - базалық класс әдісін ауыстыру»; қате сигнатурада компилятор ескертеді."),
               ("public String toString() {", "<code>Object</code>-тегі <code>public</code> әдісті ауыстырамыз - қолжетімділігін тарылтуға болмайды."),
               ('System.out.println("Таңдалған: " + a);     // + мәтінмен де toString шақырады', "нысанды жолға жалғау да автоматты түрде <code>toString</code>-ті шақырады.")],
        out="Екі жолда да біздің мәтін шықты - <code>println</code> да, жолға жалғау да <code>toString</code>-ті қолданады.",
        err="<code>tostring</code> (кіші әріппен) не <code>public</code>-сыз жазу: бірінші жағдайда жаңа әдіс пайда болып, ауыстыру болмайды (<code>@Override</code> мұны ұстайды), екіншісінде компиляция қатесі.",
        expect=["Aspap{Домбыра, 45000 тг}", "Таңдалған: Aspap{Домбыра, 45000 тг}"]),
    7: dict(
        lines=[("return o instanceof Jaman j && Objects.equals(ataui, j.ataui);", "үлгімен <code>instanceof</code> (Java 16): тексеріп, бірден <code>j</code> айнымалысына айналдырады."),
               ("public int hashCode() {", "<code>equals</code> ауыстырылса, <code>hashCode</code> да міндетті - тең нысандардың хэші тең болуы керек."),
               ("return Objects.hash(ataui);", "өрістерден хэш құрайтын дайын әдіс."),
               ("a.contains(j2)", "<code>HashSet</code> алдымен хэш бойынша «қорапты» табады, содан кейін ғана <code>equals</code>-ты шақырады.")],
        out="<code>Jaman</code> нысандары <code>equals</code> бойынша тең, бірақ хэштері әртүрлі - <code>HashSet</code> екіншісін басқа «қораптан» іздеп, таппады. <code>Jaksy</code>-де хэштер тең - табылды.",
        err="Тек <code>equals</code>-ты ауыстыру - ең қиын табылатын қателердің бірі: <code>HashMap</code>/<code>HashSet</code> «кездейсоқ» жұмыс істемейді. IDE-нің генераторын не <code>record</code>-ты қолданыңыз.",
        expect=["true false", "hashCode бар: true"]),
    9: dict(
        lines=[("package kz.dukan;", "пакет - кластардың аттар кеңістігі; файл <code>kz/dukan/Kitap.java</code> жолында тұруы керек."),
               ("public class Kitap {", "<code>public</code> класс басқа пакеттерден көрінеді."),
               ("public Kitap(String atau, double baga) {", "конструктор да <code>public</code> - әйтпесе басқа пакеттен нысан жасау мүмкін емес.")],
        err="Пакетті жариялап, файлды қалтаға салмау: <code>javac</code> бәрібір компиляциялайды, бірақ <code>java</code> класты таба алмайды. Қалта құрылымы пакет атымен дәл сәйкес болуы керек (лекциядағы <code>-d out</code> мысалы)."),
    11: dict(
        lines=[("Kitap(String atau) { }      // public емес: package-private", "модификаторсыз - тек сол пакет ішінде көрінеді.")],
        err="Басқа пакеттен <code>new Kitap(\"...\")</code> шақыру: «Kitap(String) is not public in Kitap; cannot be accessed from outside package». Класс <code>public</code> болса да, конструкторға да модификатор керек."),
    14: dict(
        lines=[("a = new Uaqytsha();            // ескі нысанға сілтеме қалмады", "бірінші нысан енді қолжетімсіз - қоқыс жинаушы оны босата алады."),
               ("Uaqytsha t = new Uaqytsha();   // әр айналымда ~4 КБ, бірақ ешкім сақтамайды", "5 миллион нысан × 4 КБ ≈ 20 ГБ - бірақ әрқайсысы айналым соңында қолжетімсіз болады."),
               ("sany += t.buf.length;", "1000 × 5 000 000 = 5 миллиард - <code>long</code> керек."),
               ("a = null;                       // соңғы нысан да қолжетімсіз", "<code>null</code> - сілтемені үзу; әдетте мұны жазудың қажеті жоқ, айнымалы аймақтан шыққанда да сол болады.")],
        out="20 ГБ-тан астам жад «бөлінді», бірақ бағдарлама әдепкі жадта аяқталды: қоқыс жинаушы қолжетімсіз нысандарды үздіксіз босатып отырды.",
        err="Қоқыс жинаушы «жадтың ағуын» толық болдырмайды деп ойлау: нысанға сілтемені статикалық тізімде не кэште ұмытып қалдырсаңыз, ол ешқашан босатылмайды - Java-да да <code>OutOfMemoryError</code> болады.",
        expect=["5000000000"]),
}
