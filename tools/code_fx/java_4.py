# © 2026 Sagid Mustafa. All Rights Reserved.
# Java 4-апта: мұрагерлік, абстракт кластар, интерфейстер, композиция, sealed - жолма-жол талдау.

CX = {
    3: dict(
        lines=[("if (this == o) return true;", "өзімен салыстыру - бірден ақиқат (жылдам жол)."),
               ("if (!(o instanceof Qala q)) return false;", "басқа типтегі нысан не <code>null</code> - тең емес; <code>instanceof</code> <code>null</code>-ға <code>false</code> береді."),
               ("return atau.equals(q.atau);", "тек атауы бойынша салыстырамыз: халық саны теңдікке әсер етпейді - бұл біздің шешім."),
               ("return Objects.hash(atau);", "хэш <code>equals</code>-та қолданылған өрістерден ғана құрылады."),
               ('System.out.println(c.toString().startsWith("java.lang.Object@"));', "әдепкі <code>toString</code> «класс@хэш» түрінде - хэш өзгергіш, сондықтан тек басын тексереміз.")],
        out="<code>a == b</code> жалған - екі бөлек нысан; <code>equals</code> ақиқат - атаулары бірдей. Хэштер де тең, демек бұл класс <code>HashSet</code>-те дұрыс жұмыс істейді.",
        err="<code>equals</code>-та бір өрісті, <code>hashCode</code>-та басқа өрісті қолдану (мысалы, хэшке <code>halyq</code>-ты қосу): тең нысандардың хэштері әртүрлі болып, келісім бұзылады.",
        expect=["Қарағанды (500 мың)\nfalse\ntrue\ntrue\ntrue"]),
    4: dict(
        lines=[("abstract class Aspap {", "абстракт класс - тек мұрагерлік үшін; одан тікелей нысан жасалмайды."),
               ("abstract String dybys();", "денесі жоқ әдіс: әр нақты аспап өзі жазуға міндетті."),
               ("void ojna() {", "ортақ логика базада бір рет жазылды; ол абстракт әдісті шақырады - нақты нұсқасы жұмыс кезінде таңдалады."),
               ('Dombyra() { super("Домбыра"); }', "<code>super(...)</code> - базалық конструкторды шақыру; ол бірінші жол болуы керек."),
               ("Aspap a = new Dombyra();", "базалық тип айнымалысы туынды нысанды ұстайды - полиморфизм.")],
        out="<code>ojna</code> бір рет жазылған, бірақ екі аспап өз дыбысын шығарды: <code>dybys()</code> шақыруы нысанның нақты класына барды.",
        err="Абстракт әдісті ауыстырмай, туынды класты <code>abstract</code> деп белгілемеу: «Dombyra is not abstract and does not override abstract method dybys()» - компилятор ұмытуға жол бермейді.",
        expect=["Домбыра ойналуда -> тық-тық-тық", "Сыбызғы ойналуда -> ыңылдаған жұмсақ үн"]),
    5: dict(
        lines=[("Aspap a = new Aspap();", "абстракт класстан нысан жасау - «Aspap is abstract; cannot be instantiated».")],
        err="Бұл мысал әдейі компиляцияланбайды. Абстракт класс - «жартылай дайын» жоба: оның нысанын тек нақты туынды арқылы жасаймыз (<code>new Dombyra()</code>) не анонимді класспен."),
    9: dict(
        lines=[("private final Shanyrak shanyrak;", "композиция: киіз үй шаңыраққа «ие» (has-a), ол шаңырақтың «түрі» емес (is-a)."),
               ("private final Kerege[] kereger;", "нысандар массиві - әр қанат бөлек нысан."),
               ("kereger[i] = new Kerege(i + 1);", "<code>new Kerege[n]</code> тек <code>null</code>-дармен толы орындар жасайды; әр нысанды өзіміз жасаймыз."),
               ("new KiizUy(6, 60).sipattau();", "нысанды айнымалысыз жасап, бірден әдісін шақыруға болады.")],
        out="6 қанат және 60 уық - киіз үй өз бөліктерінің санын біледі, ал сыртқы код бөліктерге тікелей жүгінбейді.",
        err="«Қайта қолдану үшін» мұрагерлік жасау (<code>class KiizUy extends Shanyrak</code>): онда киіз үй шаңырақтың барлық әдістерін мұралап, мағынасыз «шаңырақ түрі» болады. «Бөлігі ме?» - композиция; «түрі ме?» - мұрагерлік.",
        expect=["Киіз үй: 6 қанат, шаңырақта 60 уық"]),
    11: dict(
        lines=[("sealed interface Tulga permits Shanyrak, Tortburysh, Ushburysh {}", "<code>sealed</code> - тек аталған кластар іске асыра алады: түрлер тізімі жабық."),
               ("record Shanyrak(double radius) implements Tulga {}", "<code>record</code> - деректер класы: конструктор, <code>radius()</code>, <code>equals</code>, <code>toString</code> автоматты."),
               ("if (t instanceof Shanyrak s) {", "үлгімен <code>instanceof</code>: тип тексеріліп, <code>s</code> бірден дайын."),
               ('throw new IllegalStateException("мүмкін емес");', "барлық түр өңделді - бұл жолға жетпеуі керек."),
               ('System.out.printf("%s -> %.2f%n", t, audan(t));', "<code>%s</code> record-тың автоматты <code>toString</code>-ін шығарады.")],
        out="π·1,5² ≈ 7,07; 4·3 = 12; ½·6·5 = 15. Record-тың <code>toString</code>-і өрістерді атауымен көрсетті - <code>Tortburysh[a=4.0, b=3.0]</code>.",
        err="Жаңа фигура қосып, <code>audan</code>-ды жаңартуды ұмыту: <code>if-else</code> тізбегінде компилятор үндемейді. Java 21-дің <code>switch</code> үлгілерімен <code>sealed</code> түрлер толық қамтылмаса, компиляция қатесі шығады.",
        expect=["Shanyrak[radius=1.5] -> 7.07", "Ushburysh[negiz=6.0, biiktik=5.0] -> 15.00"]),
}
