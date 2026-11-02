# © 2026 Sagid Mustafa. All Rights Reserved.
# Java 5-апта: Collections Framework, дженериктер - код мысалдарының жолма-жол талдауы.

CX = {
    1: dict(
        lines=[("List<String> kezek = new LinkedList<>();", "айнымалы типі - интерфейс (<code>List</code>), нысан - нақты іске асыру; кейін <code>ArrayList</code>-ке бір сөзбен ауыстыруға болады."),
               ("kezek.get(1)", "индекс бойынша алу <code>LinkedList</code>-те O(n): тізімді басынан жүріп өтеді."),
               ("LinkedList<String> ll = new LinkedList<>(kezek);", "көшіру конструкторы: жаңа тізім, элементтері сол."),
               ('ll.addFirst("Асылбек");', "<code>addFirst</code>/<code>addLast</code> - <code>LinkedList</code>-ке тән, екеуі де O(1)."),
               ("ll.removeFirst()", "бірінші элементті жойып, оны қайтарады.")],
        out="<code>ll</code> - <code>kezek</code>-тің көшірмесі, сондықтан екі шетінен қосу/жою <code>kezek</code>-ке әсер етпеді. Соңында тізім бастапқы үш атауға оралды.",
        err="Әр жерде <code>LinkedList</code> таңдау: <code>get(i)</code>-ді циклде шақырсақ, O(n²) болады. Көп жағдайда <code>ArrayList</code> (не кезек үшін <code>ArrayDeque</code>) жылдамырақ.",
        expect=["[Асылбек, Айгерім, Бауыржан, Дана, Ернар]", "Асылбек және Ернар шығарылды"]),
    8: dict(
        lines=[("static double jiny(List<? extends Number> san) {", "«<code>Number</code>-дің кез келген ұрпағының тізімі» - <code>List&lt;Integer&gt;</code> да, <code>List&lt;Double&gt;</code> да жарайды; одан тек оқимыз."),
               ("s += n.doubleValue();", "әр <code>Number</code>-ды <code>double</code>-ға айналдырамыз."),
               ("static void toltyr(List<? super Integer> tizim) {", "«<code>Integer</code> сыятын кез келген тізім» - <code>List&lt;Number&gt;</code> не <code>List&lt;Object&gt;</code>; оған жазамыз."),
               ("List<Integer> a = List.of(1, 2, 3);", "<code>List.of</code> өзгермейтін тізім жасайды.")],
        out="1+2+3 = 6,0 және 1,5+2,5 = 4,0 - бір әдіс екі түрлі тізімді қабылдады. Екінші әдіс <code>Number</code> және <code>Object</code> тізімдеріне бірдей жазды.",
        err="<code>List&lt;Number&gt;</code> параметріне <code>List&lt;Integer&gt;</code> беру: дженериктер инвариантты, компилятор қабылдамайды. Ереже PECS: тек оқысаңыз - <code>extends</code>, тек жазсаңыз - <code>super</code>.",
        expect=["6.0 4.0", "[10, 20, 30] [10, 20, 30]"]),
}
