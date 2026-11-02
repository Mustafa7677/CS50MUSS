# © 2026 Sagid Mustafa. All Rights Reserved.
# Java 7-апта: ағындар, синхрондау, JUnit, қорытынды жоба - код мысалдарының жолма-жол талдауы.

CX = {
    1: dict(
        lines=[("long[] bolik = new long[2];", "әр ағын массивтің өз ұяшығына жазады - ортақ айнымалыға таласпайды."),
               ("Thread a = new Thread(() -> bolik[0] = qosyndy(1, n / 2));", "ағынға орындалатын жұмысты lambda ретінде береміз."),
               ("a.start();", "<code>start</code> жаңа ағынды іске қосады; <code>run()</code> шақырсақ, бәрі сол ағында орындалар еді."),
               ("a.join();", "<code>main</code> осы ағын біткенше күтеді - нәтижені тек содан кейін оқимыз."),
               ('System.out.println("Формула: " + (long) n * (n + 1) / 2);', "тексеру: n(n+1)/2; <code>(long)</code> көбейтуден бұрын - <code>int</code> толып кетпейді.")],
        out="Екі жартының қосындысы Гаусс формуласымен дәл сәйкес: 500 000 500 000. Ағындар бір-бірінің деректеріне тимегендіктен, нәтиже әр іске қосуда бірдей.",
        err="<code>join</code>-сыз нәтижені оқу: <code>main</code> ағындар бітпей тұрып <code>bolik</code>-ті оқып, 0 не жартылай мән шығаруы мүмкін - тек кейде, сондықтан байқау қиын.",
        expect=["Қосынды: 500000500000", "Формула: 500000500000"]),
    2: dict(
        lines=[("Thread.sleep(100);", "ағынды 100 мс тоқтатады; ол <code>InterruptedException</code> лақтыруы мүмкін, сондықтан <code>try</code> ішінде."),
               ("t.getState()", "ағын күйі: <code>join</code>-нен кейін - <code>TERMINATED</code>."),
               ("Thread.sleep(10_000);", "10 секунд ұйқы - бірақ оны күтпейміз."),
               ("uzu.interrupt();", "ағынға «тоқта» сигналын жібереміз; ұйықтап жатқан ағын бірден оянып, ерекше жағдай алады.")],
        out="Бірінші ағын үш жұмысты орындап аяқталды. Екіншісі 10 секунд ұйықтаудың орнына бірден «оянды» - бағдарлама 0,3 секундта бітті.",
        err="<code>InterruptedException</code>-ды бос <code>catch</code>-пен жұтып қою: үзу сигналы жоғалып, ағынды сыпайы тоқтату мүмкін болмай қалады. Ең болмаса <code>Thread.currentThread().interrupt();</code> арқылы белгіні қалпына келтіріңіз.",
        expect=["Жұмыс 3", "Күй: TERMINATED, тірі ме: false", "Ұйқыдан оянды (interrupt)"]),
    3: dict(
        lines=[("sanagysh++;                            // oqu -> +1 -> jazu: 3 қадам!", "<code>++</code> атомарлы емес: екі ағын бір мәнді бір мезгілде оқып, екеуі де +1 жазса, бір арттыру жоғалады."),
               ("Thread a = new Thread(Main::arttyr);", "әдіске сілтеме - lambda-ның қысқа түрі."),
               ("sanagysh = 0;", "әр сынама алдында санағышты нөлдейміз.")],
        err="Бұл - жарыс жағдайы (race condition): нәтиже 200 000-нан кем және әр іске қосуда әртүрлі, сондықтан біз оны бекітіп көрсетпейміз. Емі - <code>synchronized</code>, <code>AtomicInteger</code> не жұмысты бөліп, нәтижелерді соңында біріктіру (алдыңғы мысалдағыдай)."),
    7: dict(
        lines=[("@BeforeEach", "әр тест алдында орындалады: әр тест жаңа, таза журналмен басталады."),
               ("assertEquals(4.5, orta.getAsDouble(), 0.0001);", "бөлшек сандарды рұқсат етілген айырмамен салыстырамыз."),
               ("assertThrows(ZhurnalQateligi.class, () -> zhurnal.oqushyQosu(\"Дана Нұрбекқызы\", \"7А\"));", "қате болуы күтілген жағдай да тест: дәл осы ерекше жағдай лақтырылуы керек."),
               ('@Disabled("TODO: oqushyJoyu жазылғаннан кейін қосыңыз")', "әзірге өшірілген тест - жобаны аяқтағанда қосасыз.")],
        err="Тестер бір-біріне тәуелді болуы (бірі қосқан оқушыны екіншісі күтуі): JUnit тестерді кез келген ретпен орындайды. <code>@BeforeEach</code> әр тестке тәуелсіз бастапқы күй береді."),
    8: dict(
        lines=[("public enum Pan {", "<code>enum</code> - мәндер тізімі жабық тип: пәндер тек осылар."),
               ('MATEMATIKA("Математика"),', "әр тұрақты өз конструкторымен жасалады - қазақша атауын сақтайды."),
               ("private final String atau;", "enum-да да өрістер мен әдістер болуы мүмкін.")],
        err="Пәндерді жай <code>String</code> ретінде сақтау: «Математика» мен «математика» екі түрлі пән болып кетеді, ал қате жазуды компилятор ұстамайды. <code>enum</code> мұндай қателерді мүмкін емес етеді."),
    9: dict(
        lines=[("public class ZhurnalQateligi extends RuntimeException {", "өз ерекше жағдайымыз; <code>RuntimeException</code>-нан - <code>throws</code> жазуды талап етпейді."),
               ("super(habar);", "хабарды базалық класқа береміз - <code>getMessage()</code> оны қайтарады.")],
        err="Барлық қатеге <code>RuntimeException</code>-ның өзін лақтыру: шақырушы бизнес-ереже бұзылуын басқа қателерден ажырата алмайды. Өз класыңыз нақты <code>catch</code> жазуға мүмкіндік береді."),
    10: dict(
        lines=[("public record Baga(Pan pan, int baga) {", "record - өзгермейтін деректер: өрістер, конструктор, <code>equals</code> автоматты."),
               ("public Baga {", "ықшам конструктор: параметрлер автоматты, тек тексеруді жазамыз."),
               ("if (baga < 1 || baga > 5) {", "дұрыс емес баға бар нысан мүлдем жасалмайды.")],
        err="Тексеруді нысанды қолданатын жерге (журналға) қою: онда дұрыс емес <code>Baga</code> басқа жерден жасалып кетуі мүмкін. Инварианттарды нысан өзі сақтауы керек - ықшам конструктор дәл соған арналған."),
    11: dict(
        lines=[("private final List<Baga> bagalar = new ArrayList<>();", "<code>final</code> - сілтеме өзгермейді, бірақ тізімнің мазмұны өзгереді."),
               ("return Collections.unmodifiableList(bagalar);", "сыртқа тек оқуға арналған көрініс береміз - бағаларды тек <code>bagaQosu</code> арқылы қосуға болады."),
               ("return bagalar.stream().mapToInt(Baga::baga).average();", "Stream: бағаларды санға айналдырып, орташасын табамыз; бос болса - <code>OptionalDouble.empty()</code>.")],
        err="Ішкі тізімді тікелей қайтару (<code>return bagalar;</code>): сыртқы код <code>getBagalar().clear()</code> жазып, нысанның күйін бұза алады. Инкапсуляция қайтарылған коллекцияларға да қатысты."),
    12: dict(
        lines=[("private final Map<String, Oqushy> oqushylar = new LinkedHashMap<>();", "<code>LinkedHashMap</code> - қосылу ретін сақтайды: тізім әрқашан бірдей ретпен шығады."),
               ("return Optional.ofNullable(oqushylar.get(aty.trim()));", "табылмаса <code>null</code> емес, бос <code>Optional</code> - шақырушы оны тексеруге мәжбүр."),
               ('Oqushy o = tap(aty).orElseThrow(() -> new ZhurnalQateligi("Оқушы табылмады: " + aty));', "бар болса - оқушы, жоқ болса - түсінікті ерекше жағдай."),
               ('throw new UnsupportedOperationException("TODO");', "жазылмаған әдіс айқын қате береді - <code>@Disabled</code> тесттері оларды кейін тексереді.")],
        err="<code>Optional</code>-ды <code>.get()</code>-пен тексерусіз ашу: бос болса <code>NoSuchElementException</code>. <code>orElseThrow</code>, <code>orElse</code> не <code>ifPresent</code> қолданыңыз."),
    13: dict(
        lines=[("StringBuilder sb = new StringBuilder();", "жолды бөлшектеп құру: әр <code>+</code> жаңа жол жасамайды."),
               ("sb.append(b.pan().name()).append(':').append(b.baga());", "<code>name()</code> - enum тұрақтысының аты (<code>MATEMATIKA</code>): файлдан оқығанда <code>Pan.valueOf</code> оны қайтарады."),
               ("Files.write(jol, joldar);", "барлық жолды бір әрекетпен UTF-8 кодтауында жазады.")],
        err="Пішімге бөлгіш таңба кіретін деректер: оқушы атында <code>;</code> болса, файл бұзылады. Нақты жобада бөлгішті экрандау не CSV/JSON кітапханасын қолдану керек."),
}
