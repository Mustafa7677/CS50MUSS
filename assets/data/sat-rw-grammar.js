/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* SAT R&W «Standard English Conventions» зертханасының деректері (AO17 авторлық сөйлемдері).
   bd - сөйлем шекаралары: L/R бөліктері, түрі (ic - тәуелсіз сөйлем, dc - бағыныңқы сөйлем, ph - сөйлем емес тіркес/тізім),
        s/v - бастауыш пен баяндауыш (диаграммада сызылады), rel - қатынас (add|contrast|result|explain|list), conj - FANBOYS нұсқасы.
   gen - жаңа сөйлемдерді құрастыруға арналған бөлшектер (меңгеру тексерісі осыдан жасалады).
   sv - бастауыш-баяндауыш келісімі: segs (r: s - бастауыш, x - аралық тіркес, v - етістік орны, o - қалғаны), h - бастауыштың басты сөзі.
   pm - есімдік/тәуелдік және анықтауыштың орны: link - есімдік неге сілтейді / анықтауыш нені сипаттайды. */
window.SAT_RW_GRAMMAR = {
  bd: [
    { id: "bd1", L: { t: "The museum's new wing opened in May", type: "ic", s: "The museum's new wing", v: "opened" }, R: { t: "it already attracts thousands of visitors each week", type: "ic", s: "it", v: "attracts" }, rel: "add", conj: ", and" },
    { id: "bd2", L: { t: "Although the trail was steep and muddy", type: "dc", s: "the trail", v: "was", sub: "Although" }, R: { t: "the children reached the summit before noon", type: "ic", s: "the children", v: "reached" }, rel: "contrast", conj: ", but" },
    { id: "bd3", L: { t: "The chef has one firm rule", type: "ic", s: "The chef", v: "has" }, R: { t: "every dish must include at least one local ingredient", type: "ic", s: "every dish", v: "must include" }, rel: "explain", conj: ", but" },
    { id: "bd4", L: { t: "The repair kit contains three tools", type: "ic", s: "The repair kit", v: "contains" }, R: { t: "a hammer, a level, and a tape measure", type: "ph" }, rel: "list", conj: ", and" },
    { id: "bd5", L: { t: "The final match was postponed", type: "ic", s: "The final match", v: "was postponed" }, R: { t: "because the field was flooded", type: "dc", s: "the field", v: "was flooded", sub: "because" }, rel: "result", conj: ", so" },
    { id: "bd6", L: { t: "Most of the seeds sprouted within a week", type: "ic", s: "Most of the seeds", v: "sprouted" }, R: { t: "a few did not appear until the following month", type: "ic", s: "a few", v: "did not appear" }, rel: "contrast", conj: ", but" },
    { id: "bd7", L: { t: "When the power finally returned", type: "dc", s: "the power", v: "returned", sub: "When" }, R: { t: "the bakers lit the ovens again", type: "ic", s: "the bakers", v: "lit" }, rel: "add", conj: ", and" },
    { id: "bd8", L: { t: "The storm ended before midnight", type: "ic", s: "The storm", v: "ended" }, R: { t: "however, the roads stayed closed until noon", type: "ic", s: "the roads", v: "stayed" }, rel: "contrast", conj: ", and" },
  ],
  gen: {
    pairs: [
      ["The bus was late", "The bus", "was", "we missed the first act of the play", "we", "missed", "result", ", so"],
      ["The river rose quickly", "The river", "rose", "the farmers moved their sheep to higher ground", "the farmers", "moved", "result", ", so"],
      ["The lake looks calm", "The lake", "looks", "strong currents run beneath its surface", "strong currents", "run", "contrast", ", but"],
      ["Arman painted the fence", "Arman", "painted", "his sister repaired the gate", "his sister", "repaired", "add", ", and"],
      ["The library extended its hours", "The library", "extended", "more students began studying there in the evening", "more students", "began", "result", ", so"],
      ["The recipe looked simple", "The recipe", "looked", "it took the whole afternoon to prepare", "it", "took", "contrast", ", but"],
    ],
    explain: [
      ["The plan had one weakness", "The plan", "had", "nobody had checked the weather forecast", "nobody", "had checked"],
      ["The answer surprised everyone", "The answer", "surprised", "the oldest tree in the park was only eighty years old", "the oldest tree", "was"],
      ["Dana finally understood the problem", "Dana", "understood", "the map she had been using was twenty years out of date", "the map", "was"],
    ],
    lists: [
      ["The garden grows three kinds of herbs", "The garden", "grows", "basil, mint, and dill"],
      ["The team needed two things", "The team", "needed", "more time and a larger budget"],
      ["The festival offers something for everyone", "The festival", "offers", "concerts, crafts, and food from twelve countries"],
    ],
    dcFirst: [
      ["Because the road was icy", "the road", "was", "Because", "the school opened two hours late", "the school", "opened"],
      ["After the rain stopped", "the rain", "stopped", "After", "the players returned to the field", "the players", "returned"],
      ["Although the museum is small", "the museum", "is", "Although", "its collection is famous around the world", "its collection", "is"],
      ["When the lights went out", "the lights", "went", "When", "the audience waited quietly in the dark", "the audience", "waited"],
    ],
    dcLast: [
      ["The concert was moved indoors", "The concert", "was moved", "because thunderstorms were expected", "thunderstorms", "were expected", "because"],
      ["The students cheered loudly", "The students", "cheered", "when the results were announced", "the results", "were announced", "when"],
      ["The bakery stays open late", "The bakery", "stays", "so that night-shift workers can buy fresh bread", "night-shift workers", "can buy", "so that"],
    ],
    // бастауыш-баяндауыш: [жекеше бастауыш, көпше бастауыш, жекешеге кедергі (көпше зат есім), көпшеге кедергі (жекеше зат есім), аралық сөйлем, қалғаны, [жекеше, көпше етістік]]
    sv: [
      ["The box", "The boxes", "of old letters", "of an old letter", "which the students found in the attic", "now stored in the school archive.", ["is", "are"]],
      ["The report", "The reports", "on the city's bridges", "on the city's oldest bridge", "which engineers completed in March", "expected to influence next year's budget.", ["is", "are"]],
      ["The painting", "The paintings", "of the two sisters", "of the youngest sister", "which hung in the hallway for decades", "now being restored.", ["is", "are"]],
      ["The coach", "The coaches", "of the girls' volleyball teams", "of the girls' volleyball team", "who arrived at the school this fall", "planning a summer training camp.", ["is", "are"]],
      ["The path", "The paths", "through the pine forests", "through the pine forest", "which volunteers cleared last spring", "open to hikers again.", ["is", "are"]],
      ["The recording", "The recordings", "of traditional songs", "of a traditional song", "which a local historian made in the 1970s", "available in the library's digital collection.", ["is", "are"]],
    ],
  },
  sv: [
    { id: "sv1", segs: [{ t: "The collection", r: "s", h: "collection" }, { t: "of rare maps", r: "x", k: "of-тіркес" }, { t: "that the library bought last year", r: "x", k: "қосымша сөйлем" }, { t: "___", r: "v" }, { t: "now on display in the main hall.", r: "o" }], num: "sg", opts: ["is", "are"], ans: 0 },
    { id: "sv2", segs: [{ t: "The engineers", r: "s", h: "engineers" }, { t: "working on the old bridge", r: "x", k: "-ing тіркес" }, { t: "___", r: "v" }, { t: "careful measurements every morning.", r: "o" }], num: "pl", opts: ["take", "takes"], ans: 0 },
    { id: "sv3", segs: [{ t: "Each", r: "s", h: "Each" }, { t: "of the paintings in the exhibition", r: "x", k: "of-тіркес" }, { t: "___", r: "v" }, { t: "a small label written in two languages.", r: "o" }], num: "sg", opts: ["have", "has"], ans: 1 },
    { id: "sv4", segs: [{ t: "The teacher,", r: "s", h: "teacher" }, { t: "along with her twenty students,", r: "x", k: "along with қосымшасы" }, { t: "___", r: "v" }, { t: "planting trees in the park today.", r: "o" }], num: "sg", opts: ["are", "is"], ans: 1 },
    { id: "sv5", segs: [{ t: "The results", r: "s", h: "results" }, { t: "of the survey,", r: "x", k: "of-тіркес" }, { t: "which included more than a thousand residents,", r: "x", k: "қосымша сөйлем" }, { t: "___", r: "v" }, { t: "surprising to the city council.", r: "o" }], num: "pl", opts: ["was", "were"], ans: 1 },
    { id: "sv6", segs: [{ t: "On the shelf above the old desk", r: "x", k: "орын пысықтауышы (инверсия)" }, { t: "___", r: "v" }, { t: "two glass jars", r: "s", h: "jars" }, { t: "of buttons.", r: "x", k: "of-тіркес" }], num: "pl", opts: ["sits", "sit"], ans: 1 },
  ],
  pm: [
    { id: "pm1", kind: "pron", text: "After a meeting that lasted nearly four hours, the committee finally announced ______ decision.", link: "the committee", opts: ["its", "it's", "their", "they're"], ans: 0,
      why: ["Дұрыс: «the committee» - бір ұйым, SAT-та жекеше саналады; тәуелдік есімдік - «its».", "«It's» = «it is»: «it is decision» мағынасыз.", "«Their» - көпше; антецедент «the committee» жекеше зат есім.", "«They're» = «they are»; тәуелдік емес."] },
    { id: "pm2", kind: "pron", text: "The two rivers meet just outside the city, where ______ waters mix in a swirl of brown and blue.", link: "The two rivers", opts: ["its", "there", "their", "they're"], ans: 2,
      why: ["«Its» - жекеше, ал «The two rivers» - көпше.", "«There» - орын үстеуі («сонда»), тәуелдік емес.", "Дұрыс: «their» - «өзендердің» (көпше тәуелдік).", "«They're» = «they are»: «they are waters» мағынасыз."] },
    { id: "pm3", kind: "pron", text: "The writer ______ first novel won the national prize grew up in a small village near the lake.", link: "The writer", opts: ["who's", "whose", "which", "whom"], ans: 1,
      why: ["«Who's» = «who is»: «who is first novel» мағынасыз.", "Дұрыс: «whose» - адамға қатысты тәуелдік («оның романы»).", "«Which» адамға емес, затқа қолданылады және тәуелдікті білдірмейді.", "«Whom» - толықтауыш; мұнда тәуелдік керек."] },
    { id: "pm4", kind: "pron", text: "Both ______ reports were submitted on time, but only one included the raw data.", link: "Both", opts: ["scientist's", "scientists", "scientists'", "scientists's"], ans: 2,
      why: ["«Scientist's» - бір ғалымның; «Both» - екеуі.", "Апострофсыз тәуелдік жоқ: «scientists reports» - екі зат есім қатар тұр.", "Дұрыс: «scientists'» - көпше тәуелдік (екі ғалымның баяндамалары).", "«-s's» көпше тәуелдікте қолданылмайды."] },
    { id: "pm5", kind: "mod", text: "Walking along the beach at sunset, ______", link: "Walking along the beach at sunset", opts: ["the sky turned a deep orange.", "Aliya noticed that the sky had turned a deep orange.", "the orange sky caught Aliya's attention.", "a deep orange color filled the sky above Aliya."], attach: ["the sky", "Aliya", "the orange sky", "a deep orange color"], ans: 1,
      why: ["Аспан жағажаймен серуендемейді - ілініп тұрған анықтауыш.", "Дұрыс: үтірден кейінгі бірінші зат есім - «Aliya»; серуендеген - сол.", "«The orange sky» серуендей алмайды.", "Түс серуендемейді; анықтауыш қате нысанға жабысқан."] },
    { id: "pm6", kind: "mod", text: "Built in the twelfth century, ______", link: "Built in the twelfth century", opts: ["tourists still visit the tower at the edge of the old town.", "the tower still stands at the edge of the old town.", "the old town's visitors still admire the tower.", "people still photograph the tower every day."], attach: ["tourists", "the tower", "the old town's visitors", "people"], ans: 1,
      why: ["Туристер XII ғасырда салынбаған.", "Дұрыс: салынған - мұнара; ол үтірден кейін бірден тұр.", "Қонақтар салынбаған - анықтауыш қате нысанда.", "Адамдар салынбаған - ілініп тұрған анықтауыш."] },
    { id: "pm7", kind: "mod", text: "Known for its brilliant red feathers, ______", link: "Known for its brilliant red feathers", opts: ["wildlife photographers often choose the scarlet macaw as a subject.", "photographs of the scarlet macaw are popular online.", "the scarlet macaw is a favorite subject of wildlife photographers.", "many people admire the scarlet macaw."], attach: ["wildlife photographers", "photographs", "the scarlet macaw", "many people"], ans: 2,
      why: ["Фотографтардың қызыл қауырсыны жоқ.", "Фотосуреттер қауырсынымен танымал емес.", "Дұрыс: қауырсынымен танымал - тотықұс (scarlet macaw), ол үтірден кейін бірден тұр.", "Адамдар қауырсынымен танымал емес."] },
    { id: "pm8", kind: "pron", check: true, text: "The company redesigned ______ website so that customers could track their orders more easily.", link: "The company", opts: ["their", "it's", "its", "its'"], ans: 2,
      why: ["«Their» - көпше; «The company» - жекеше.", "«It's» = «it is».", "Дұрыс: «its» - компанияның (жекеше тәуелдік).", "«Its'» деген форма жоқ."] },
    { id: "pm9", kind: "mod", check: true, text: "After finishing the final exam, ______", link: "After finishing the final exam", opts: ["the courtyard filled with celebrating students.", "a celebration was held in the courtyard.", "the teachers' praise made the students happy.", "the students celebrated in the courtyard."], attach: ["the courtyard", "a celebration", "the teachers' praise", "the students"], ans: 3,
      why: ["Аула емтихан тапсырмайды.", "Мереке емтихан тапсырмайды - ілініп тұрған анықтауыш.", "Мұғалімдердің мақтауы емтихан тапсырмайды.", "Дұрыс: емтиханды аяқтаған - оқушылар; олар үтірден кейін бірден тұр."] },
  ],
};
