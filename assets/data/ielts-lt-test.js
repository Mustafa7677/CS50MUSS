/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* IELTS Listening Test (AO17) - 4 бөлім, 40 сұрақ. Барлық сценарий, сұрақ, жауап және түсіндірме AO17 үшін жазылған;
   ешбір ресми емтихан жинағынан алынбаған. Адамдар, клуб, саябақ, университет зерттеуі - ойдан шығарылған.
   t - экрандағы мәтін, say - синтезаторға арналған оқылу нұсқасы (сандар мен әріптерді британша оқыту үшін).
   key: [бөлік, жол] - жауаптың дәлелі тұрған жол (транскриптте белгіленеді); trap: [бөлік, жол] - тұзақ айтылған жол.
   lim: { w: ең көп сөз, n: сан рұқсат па } - нұсқаудағы сөз шегі. a - қабылданатын нұсқалар (кіші әріппен), wrong - тұзақтар. */
window.IELTS_LT = {
  limits: {
    L2N: { w: 2, n: true, en: "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", kk: "ең көбі екі сөз және/немесе бір сан" },
    L1N: { w: 1, n: true, en: "Write ONE WORD AND/OR A NUMBER for each answer.", kk: "бір сөз және/немесе бір сан" },
  },
  parts: [
    /* ============================ PART 1 ============================ */
    {
      n: 1, title: "Greenway Cycling Club", kk: "Әлеуметтік диалог: велоклубқа мүшелікке жазылу (телефон)",
      intro: "Part 1. You will hear a telephone conversation between a man who works for a cycling club and a woman who would like to join it. First, you have some time to look at questions 1 to 10.",
      speakers: { M: { name: "Martin", kk: "клуб хатшысы", g: "m", pitch: 0.85, rate: 1 }, L: { name: "Lucy", kk: "қоңырау шалушы", g: "f", pitch: 1.12, rate: 1 } },
      segs: [
        { lines: [
          { w: "M", t: "Good evening, Greenway Cycling Club, Martin speaking." },
          { w: "L", t: "Hi. I'd like to join the club, and the website said I should phone you to fill in the membership form." },
          { w: "M", t: "That's right, I can do that for you now. Could I have your name?" },
          { w: "L", t: "It's Lucy Fenwick." },
          { w: "M", t: "Fenwich - is that W-I-C-H at the end?", say: "Fenwich. Is that W. I. C. H. at the end?" },
          { w: "L", t: "No, it's K at the end: F-E-N-W-I-C-K.", say: "No, it's K at the end. F. E. N. W. I. C. K." },
        ] },
        { lines: [
          { w: "M", t: "Thanks. And your address?" },
          { w: "L", t: "14 Mill Street, in Ashton.", say: "Fourteen, Mill Street, in Ashton." },
          { w: "M", t: "Mill Lane? I know Mill Lane." },
          { w: "L", t: "No, Mill Street. Mill Lane's on the other side of town - people mix them up all the time." },
        ] },
        { lines: [
          { w: "M", t: "Now, we ride on Saturdays and Sundays. Which would suit you?" },
          { w: "L", t: "Saturdays would be lovely, but I work in a bookshop and Saturday's our busiest day. So it'll have to be Sundays." },
          { w: "M", t: "No problem. And which group are you interested in? We've got a fast road group, a leisure group and a mountain-bike group." },
          { w: "L", t: "I was going to say mountain biking, but actually my bike's a hybrid, so it isn't really built for rough tracks. The leisure group, I think." },
          { w: "M", t: "Good choice. The leisure rides used to be about 40 kilometres, but members said that was a bit much, so these days they're about 30.", say: "Good choice. The leisure rides used to be about forty kilometres, but members said that was a bit much, so these days they're about thirty." },
        ] },
        { lines: [
          { w: "L", t: "And where do the rides start from?" },
          { w: "M", t: "We used to meet at the railway station, but since they closed the car park there, we've moved. We now meet outside the library on Bridge Road." },
          { w: "L", t: "Great, that's near me. And how much is membership?" },
          { w: "M", t: "Adult membership is £48 a year. But if you're under 25, it's £36.", say: "Adult membership is forty-eight pounds a year. But if you're under twenty-five, it's thirty-six." },
          { w: "L", t: "I'm 23, so I'll get the cheaper one.", say: "I'm twenty-three, so I'll get the cheaper one." },
          { w: "M", t: "Then £36 it is.", say: "Then thirty-six pounds it is." },
        ] },
        { lines: [
          { w: "L", t: "Is there any equipment I have to bring?" },
          { w: "M", t: "A helmet, obviously - nobody rides without one. And because it gets dark early from October, lights are compulsory on every ride. Lots of people bring a water bottle, but you don't really need one, as we always stop at a café halfway." },
          { w: "L", t: "OK. When could I come on my first ride?" },
          { w: "M", t: "The ride on the 2nd of March is already full, I'm afraid - we limit groups to twelve. But there's space on the 9th.", say: "The ride on the second of March is already full, I'm afraid. We limit groups to twelve. But there's space on the ninth." },
          { w: "L", t: "The 9th is perfect.", say: "The ninth is perfect." },
        ] },
        { lines: [
          { w: "M", t: "Last question: how did you hear about us? We're trying to find out whether our posters work." },
          { w: "L", t: "Well, I did see a poster in the sports centre, but it was a colleague who told me about you first - she's been a member for years." },
          { w: "M", t: "Lovely. Well, that's everything. We'll see you on the 9th, then.", say: "Lovely. Well, that's everything. We'll see you on the ninth, then." },
        ] },
      ],
      groups: [
        { type: "form", from: 1, to: 10, lim: "L2N", head: "GREENWAY CYCLING CLUB - NEW MEMBER FORM", instr: "Complete the form below.",
          qs: [
            { n: 1, label: "Name", pre: "Lucy", post: "", kind: "word", a: ["fenwick"], wrong: { fenwich: "«Fenwich» - хатшының қате болжамы. Люси оны бірден түзетеді: «No, it's K at the end» және әріптейді: F-E-N-W-I-C-K." }, key: [0, 5], trap: [0, 4], why: "Хатшы «W-I-C-H» деп сұрайды, Люси «No, it's K at the end» деп түзетеді. Әріптелген атауды әріп-әріппен жазыңыз." },
            { n: 2, label: "Address", pre: "14", post: ", Ashton", kind: "word", a: ["mill street", "mill st"], wrong: { "mill lane": "«Mill Lane» - хатшының сұрағы ғана. Люси: «No, Mill Street. Mill Lane's on the other side of town»." , mill: "Тек «Mill» жеткіліксіз: формада «Street» жазылмаған, ал Mill Lane деген басқа көше бар - Люси дәл осы екеуін ажыратады." }, key: [1, 3], trap: [1, 2], why: "Тұзақ: ұқсас атау (Mill Lane). Сөйлеуші «No, Mill Street» деп түзетеді." },
            { n: 3, label: "Ride day", pre: "", post: "", kind: "word", a: ["sunday", "sundays"], wrong: { saturday: "Сенбі айтылды, бірақ бас тартылды: «Saturday's our busiest day. So it'll have to be Sundays».", saturdays: "Сенбі айтылды, бірақ бас тартылды: «Saturday's our busiest day. So it'll have to be Sundays»." }, key: [2, 1], trap: [2, 1], why: "Алдымен ұнайтын нұсқа (Saturdays would be lovely), содан кейін «but» - нақты таңдау Sundays." },
            { n: 4, label: "Group", pre: "", post: "group", kind: "word", a: ["leisure"], wrong: { "mountain bike": "Люси «I was going to say mountain biking, but actually...» дейді - бұл бас тартылған нұсқа.", "mountain-bike": "Люси «I was going to say mountain biking, but actually...» дейді - бұл бас тартылған нұсқа.", "mountain biking": "Люси «I was going to say mountain biking, but actually...» дейді - бұл бас тартылған нұсқа.", "fast road": "Fast road тобы тек тізімде аталды; Люси оны таңдамады.", road: "Fast road тобы тек тізімде аталды; Люси оны таңдамады.", "leisure group": "Мағынасы дұрыс, бірақ формада «group» сөзі бос орыннан кейін жазылып тұр: «leisure group group» болып қалады. Тек «leisure» жазыңыз." }, key: [2, 3], trap: [2, 3], why: "«I was going to say..., but actually» - сөйлеуші ойын өзгертеді. Соңғы шешім: «The leisure group»." },
            { n: 5, label: "Usual ride length", pre: "about", post: "km", kind: "num", a: ["30"], wrong: { "40": "40 км - бұрынғы ұзындық («used to be about 40»). Қазір: «these days they're about 30»." }, key: [2, 4], trap: [2, 4], why: "«used to be» - өткен жағдай; «these days» - қазіргі. Формада қазіргі ақпарат сұралады." },
            { n: 6, label: "Meeting place", pre: "outside the", post: "(Bridge Road)", kind: "word", a: ["library"], wrong: { station: "Станция - бұрынғы орын: «We used to meet at the railway station... we've moved».", "railway station": "Станция - бұрынғы орын: «We used to meet at the railway station... we've moved»." }, key: [3, 1], trap: [3, 1], why: "Тағы да «used to» → «now»: «We now meet outside the library on Bridge Road»." },
            { n: 7, label: "Annual fee", pre: "£", post: "", kind: "num", a: ["36"], wrong: { "48": "£48 - ересектердің толық бағасы. Люси 23 жаста, сондықтан 25 жасқа дейінгілердің бағасы: £36.", "25": "25 - жас шегі (under 25), баға емес." }, key: [3, 5], trap: [3, 3], why: "Екі баға айтылды; сөйлеушінің жасы (23) қайсысы қолданылатынын шешеді: under 25 → £36." },
            { n: 8, label: "Must bring", pre: "a helmet and", post: "", kind: "word", a: ["lights", "bike lights", "bicycle lights"], wrong: { "water bottle": "Су бөтелкесі міндетті емес: «you don't really need one, as we always stop at a café».", bottle: "Су бөтелкесі міндетті емес: «you don't really need one»." }, key: [4, 1], trap: [4, 1], why: "«compulsory» = must bring. Water bottle аталды, бірақ «you don't really need one» - тұзақ." },
            { n: 9, label: "First ride", pre: "", post: "March", kind: "num", a: ["9"], wrong: { "2": "2 наурыздағы сапарда орын жоқ: «already full». Бос орын - 9-ында." }, key: [4, 3], trap: [4, 3], why: "Бірінші аталған күн толып қалған; «But there's space on the 9th»." },
            { n: 10, label: "Heard about club from", pre: "a", post: "", kind: "word", a: ["colleague", "work colleague"], wrong: { poster: "Постерді көрді, бірақ «it was a colleague who told me about you first» - алғаш естіген көзі әріптес.", "sports centre": "Спорт орталығы - постер тұрған орын ғана." }, key: [5, 1], trap: [5, 1], why: "«I did see a poster..., but it was a colleague who told me first» - сұрақ клуб туралы алғаш қайдан естігенін сұрайды." },
          ] },
      ],
    },
    /* ============================ PART 2 ============================ */
    {
      n: 2, title: "Westmoor Country Park", kk: "Әлеуметтік монолог: саябақ қызметкерінің келушілерге нұсқауы және карта",
      intro: "Part 2. You will hear a park ranger talking to a group of visitors at Westmoor Country Park. First, you have some time to look at questions 11 to 20.",
      speakers: { G: { name: "Claire", kk: "саябақ рейнджері", g: "f", pitch: 1.02, rate: 0.98 } },
      segs: [
        { lines: [
          { w: "G", t: "Good morning, everyone, and welcome to Westmoor Country Park. My name's Claire, and I'm one of the rangers here. Before you set off, I'll tell you a little about the park and then show you where things are on the map." },
          { w: "G", t: "First, some history. A lot of visitors assume this land was once farmland, and some think the lake is natural. In fact, the whole area was a gravel quarry. Gravel was dug here until 1974, and when the digging stopped, the pits filled with water and became the lake you see today.", say: "First, some history. A lot of visitors assume this land was once farmland, and some think the lake is natural. In fact, the whole area was a gravel quarry. Gravel was dug here until nineteen seventy-four, and when the digging stopped, the pits filled with water and became the lake you see today." },
        ] },
        { lines: [
          { w: "G", t: "A few rules about the lake. Swimming isn't allowed at any time of year - the water is deep and very cold, even in August. We used to hire out rowing boats at weekends, but we stopped doing that two years ago. Fishing is allowed, but only with a permit, which you can get from the visitor centre." },
        ] },
        { lines: [
          { w: "G", t: "We rely a lot on volunteers. Tree-planting days are always popular - we never have trouble finding people for those - and the paths are looked after by our own staff. What we're really short of is people to take school groups around the park. If you enjoy working with children, please have a word with me." },
        ] },
        { lines: [
          { w: "G", t: "This Saturday there's a guided bat walk. It's free for children, although adults pay £3, and there's no need to book - just come to the visitor centre. We start at half past eight, once it's getting dark.", say: "This Saturday there's a guided bat walk. It's free for children, although adults pay three pounds, and there's no need to book. Just come to the visitor centre. We start at half past eight, once it's getting dark." },
        ] },
        { lines: [
          { w: "G", t: "One more thing: dogs. You're welcome to let your dog off the lead in the woods, but please keep it on a lead near the lake, because birds are nesting along the shore at this time of year." },
        ] },
        { lines: [
          { w: "G", t: "Now, let's look at the map. We're here, in the visitor centre, at the south entrance. Some of you may remember that the café used to be right next to us, on the right as you go out. That building is now the first-aid point; the café has moved, and I'll tell you where in a moment." },
          { w: "G", t: "When you leave the visitor centre, the main path goes straight ahead, north, towards the lake. Before you reach the crossroads, you'll see the children's play area on your left, right next to the path." },
        ] },
        { lines: [
          { w: "G", t: "At the crossroads, a path running from east to west crosses the main path. If you turn left there and follow that path all the way to the end, you'll come to the bike hire, where you can rent bikes by the hour." },
          { w: "G", t: "If you turn right at the crossroads instead, keep going until the path ends, just south of the lake. That's where you'll find our new café. It has a terrace looking out over the water." },
        ] },
        { lines: [
          { w: "G", t: "If you go straight over the crossroads and carry on north, you'll soon see a smaller path on your left that leads into the woods. Follow it, and the picnic area is in a clearing among the trees." },
          { w: "G", t: "The main path ends at the old iron gate at the top of the map. Please don't go through it - the land beyond is private." },
          { w: "G", t: "Bird-watchers should head for the bird hide. Some people stop at the wooden viewing platform on the west side of the lake and think that's it, but the hide is further on: it's on the north shore, on the far side of the lake from here. Right - enjoy your visit!" },
        ] },
      ],
      groups: [
        { type: "mc", from: 11, to: 15, instr: "Choose the correct letter, A, B or C.",
          qs: [
            { n: 11, q: "What was the park area used for in the past?", opts: ["farming", "digging gravel", "the gardens of a large house"], a: 1, key: [0, 1], trap: [0, 1], wrong: { 0: "«A lot of visitors assume this land was once farmland» - бұл жұрттың қате пікірі, ал «In fact» одан кейін шындық келеді.", 2: "Үлкен үй мен бақ туралы мүлде айтылған жоқ." }, why: "«In fact, the whole area was a gravel quarry» - quarry = digging gravel (парафраз)." },
            { n: 12, q: "What does the speaker say about the lake?", opts: ["Swimming is permitted in summer.", "Boats can be hired at weekends.", "A permit is needed for fishing."], a: 2, key: [1, 0], trap: [1, 0], wrong: { 0: "«Swimming isn't allowed at any time of year» - тамызда да.", 1: "Қайық жалдау екі жыл бұрын тоқтатылды: «we used to... but we stopped»." }, why: "«Fishing is allowed, but only with a permit». Үш нұсқаның үшеуі де аталады - тек біреуі қазіргі ережеге сай." },
            { n: 13, q: "The park mainly needs volunteers to", opts: ["plant trees.", "take school groups around the park.", "repair the paths."], a: 1, key: [2, 0], trap: [2, 0], wrong: { 0: "Ағаш отырғызуға адам жеткілікті: «we never have trouble finding people for those».", 2: "Жолдарды өз қызметкерлері күтеді: «the paths are looked after by our own staff»." }, why: "«What we're really short of» = ең керегі. Мектеп топтарын саябақта аралату." },
            { n: 14, q: "What is true about the bat walk?", opts: ["It is free for everyone.", "It starts in the evening.", "Visitors must book a place."], a: 1, key: [3, 0], trap: [3, 0], wrong: { 0: "Тек балаларға тегін: «although adults pay £3».", 2: "«there's no need to book - just come»." }, why: "«We start at half past eight, once it's getting dark» = кешке басталады (парафраз)." },
            { n: 15, q: "Dogs must be kept on a lead", opts: ["everywhere in the park.", "in the woods.", "near the lake."], a: 2, key: [4, 0], trap: [4, 0], wrong: { 0: "Барлық жерде емес: орманда босатуға болады.", 1: "Керісінше: «You're welcome to let your dog off the lead in the woods»." }, why: "«please keep it on a lead near the lake, because birds are nesting»." },
          ] },
        { type: "map", from: 16, to: 20, instr: "Label the map below. Choose the correct letter, A-H, next to questions 16-20.",
          qs: [
            { n: 16, label: "Children's play area", a: "B", key: [5, 1], trap: [5, 0], wrong: { A: "A - басты жолдың оң жағы, орталықтың дәл жанында: бұл бұрынғы кафе, қазір алғашқы көмек пункті.", C: "C - қиылыстан солға бұрылғанда жолдың соңы: велосипед прокаты." }, why: "«Before you reach the crossroads... on your left, right next to the path». Солтүстікке қарап жүргенде сол жақ = батыс. Қиылысқа дейін, жолдың батыс жағы - B." },
            { n: 17, label: "Bike hire", a: "C", key: [6, 0], trap: [6, 0], wrong: { D: "D - қиылыстан ОҢҒА бұрылғанда. Велосипед прокаты - СОЛҒА бұрылып, жолдың соңында.", B: "B - қиылысқа жетпей, жолдың сол жағы: ойын алаңы." }, why: "«turn left there and follow that path all the way to the end» - солтүстікке бет алғанда сол = батыс, көлденең жолдың батыс шеті - C." },
            { n: 18, label: "Café", a: "D", key: [6, 1], trap: [5, 0], wrong: { A: "Тұзақ: кафе бұрын осында болған («used to be right next to us»), қазір A - алғашқы көмек пункті.", E: "E - көлдің батыс жағалауындағы бақылау алаңы." }, why: "«turn right at the crossroads... until the path ends, just south of the lake» - көлденең жолдың шығыс шеті, көлдің оңтүстігі - D." },
            { n: 19, label: "Picnic area", a: "G", key: [7, 0], trap: [7, 0], wrong: { H: "H - басты жолдың соңындағы ескі темір қақпа.", C: "C қиылыстан солға бұрылғанда; пикник алаңына қиылыстан ӨТІП, кейінгі кіші жолмен орманға кіресіз." }, why: "«go straight over the crossroads... a smaller path on your left that leads into the woods... a clearing» - G." },
            { n: 20, label: "Bird hide", a: "F", key: [7, 2], trap: [7, 2], wrong: { E: "Тұзақ: E - көлдің батыс жағындағы бақылау алаңы. «Some people stop at the wooden viewing platform... and think that's it, but the hide is further on».", H: "H - ескі қақпа; ары қарай жеке жер." }, why: "«on the north shore, on the far side of the lake from here» - көлдің солтүстік жағалауы - F." },
          ] },
      ],
    },
    /* ============================ PART 3 ============================ */
    {
      n: 3, title: "Food waste project", kk: "Оқу талқылауы: екі студент пен оқытушы (3 сөйлеуші)",
      intro: "Part 3. You will hear two students, Maya and Josh, talking to their tutor, Dr Price, about a research project on food waste. First, you have some time to look at questions 21 to 30.",
      speakers: { P: { name: "Dr Price", kk: "оқытушы", g: "m", pitch: 0.72, rate: 0.95 }, Y: { name: "Maya", kk: "студент", g: "f", pitch: 1.2, rate: 1.03 }, J: { name: "Josh", kk: "студент", g: "m", pitch: 1.0, rate: 1.04 } },
      segs: [
        { lines: [
          { w: "P", t: "Come in, Maya, Josh. So, you wanted to talk about your project on food waste in the student canteen. Remind me why you chose it - I seem to remember suggesting a topic on transport." },
          { w: "J", t: "You did, and we looked at transport for a while, but it had been done so many times already." },
          { w: "Y", t: "And then, in my part-time job in the canteen, I kept noticing how much food went into the bins at the end of each lunch. That's really what made us switch." },
          { w: "J", t: "The student newspaper ran a story about it later, actually, but by then we'd already started." },
        ] },
        { lines: [
          { w: "P", t: "Good. And how did your first questionnaire go?" },
          { w: "J", t: "Well, the response was fine - we got 140 replies, which was more than we needed.", say: "Well, the response was fine. We got a hundred and forty replies, which was more than we needed." },
          { w: "Y", t: "And it was short; it only took about five minutes. The trouble was the wording. We asked people how much food they wasted, but some people included packaging and others only counted what they left on their plate. So the answers couldn't really be compared." },
        ] },
        { lines: [
          { w: "P", t: "So how did you measure the waste in the end?" },
          { w: "Y", t: "We thought about photographing every tray, but the canteen manager wasn't happy about cameras in the dining room." },
          { w: "J", t: "And asking the kitchen staff to guess wouldn't have been reliable. So instead we weighed the food that was left on plates when they came back to the kitchen. We did that every lunchtime for a week." },
          { w: "J", t: "I was sure bread would be the worst, because people take two rolls and eat one." },
          { w: "Y", t: "But it wasn't. Vegetables came top - mostly side salads that people took and didn't touch. Bread was second, and rice, surprisingly, hardly appeared at all." },
        ] },
        { lines: [
          { w: "P", t: "That's interesting. Now, comparing your figures with another university would be fascinating, but realistically you don't have time this term. What I would ask is that you collect data for a second week. Your week was just before the exams, and students may not eat normally then." },
        ] },
        { lines: [
          { w: "P", t: "Now, solutions. What are you going to recommend?" },
          { w: "Y", t: "I think the canteen should offer smaller portions at a lower price. A lot of students simply can't finish a full plate." },
          { w: "J", t: "I'm not sure about portion size, honestly - I think people would just buy two small portions. What I'm convinced about is price. If leftovers were sold off cheaply at the end of the day, that would make the biggest difference." },
          { w: "Y", t: "We also talked about putting up posters about waste." },
          { w: "J", t: "Posters? Nobody reads them. Students walk past them every day without looking." },
          { w: "P", t: "Whatever you recommend, I'd want to see the canteen manager's view in the report. She knows what's practical, and it would make your conclusions stronger." },
          { w: "Y", t: "Should we say our results would apply to other universities too?" },
          { w: "P", t: "I'd be careful there. Your canteen is quite unusual - most of our students live on campus. Your findings may not be true elsewhere." },
        ] },
      ],
      groups: [
        { type: "mc", from: 21, to: 25, instr: "Choose the correct letter, A, B or C.",
          qs: [
            { n: 21, q: "Why did the students choose food waste as their topic?", opts: ["Their tutor recommended it.", "One of them works in the canteen.", "They read about it in the student newspaper."], a: 1, key: [0, 2], trap: [0, 0], wrong: { 0: "Оқытушы транспорт тақырыбын ұсынған: «I seem to remember suggesting a topic on transport».", 2: "Газет мақаласы кейін шықты: «later... by then we'd already started»." }, why: "Мая: «in my part-time job in the canteen, I kept noticing... That's really what made us switch»." },
            { n: 22, q: "What was the main problem with the first questionnaire?", opts: ["It took too long to complete.", "Students understood a question in different ways.", "Too few students replied."], a: 1, key: [1, 2], trap: [1, 1], wrong: { 0: "Қысқа болған: «it only took about five minutes».", 2: "Жауап жеткілікті: 140, «more than we needed»." }, why: "«The trouble was the wording... some people included packaging and others only counted what they left» = сұрақ әртүрлі түсінілген." },
            { n: 23, q: "How did the students measure the food waste?", opts: ["by weighing what was left on plates", "by photographing trays", "by asking kitchen staff for estimates"], a: 0, key: [2, 2], trap: [2, 1], wrong: { 1: "Суретке түсіру ойланылды, бірақ менеджер келіспеді.", 2: "«asking the kitchen staff to guess wouldn't have been reliable» - бас тартылды." }, why: "«we weighed the food that was left on plates»." },
            { n: 24, q: "Which type of food was wasted most?", opts: ["bread", "vegetables", "rice"], a: 1, key: [2, 4], trap: [2, 3], wrong: { 0: "Джош нанды күткен еді («I was sure bread would be the worst»), бірақ Мая: «But it wasn't... Bread was second».", 2: "Күріш «hardly appeared at all»." }, why: "«Vegetables came top» - бірінші орын = ең көп." },
            { n: 25, q: "What does Dr Price advise the students to do?", opts: ["compare their results with another university", "collect data over a longer period", "focus on one type of food only"], a: 1, key: [3, 0], trap: [3, 0], wrong: { 0: "«would be fascinating, but realistically you don't have time» - мақтады, бірақ кеңес бермеді.", 2: "Бір тағам түрі туралы ештеңе айтылған жоқ." }, why: "«What I would ask is that you collect data for a second week» = ұзағырақ кезең." },
          ] },
        { type: "match", from: 26, to: 30, instr: "Who expresses each of the following opinions? Choose the correct letter, A, B or C. You may use any letter more than once.",
          opts: { A: "Maya", B: "Josh", C: "Dr Price" },
          qs: [
            { n: 26, s: "Smaller portions should be offered.", a: "A", key: [4, 1], trap: [4, 2], wrong: { B: "Джош «portion size» туралы айтады, бірақ келіспейді: «I'm not sure about portion size»." }, why: "Мая: «the canteen should offer smaller portions at a lower price»." },
            { n: 27, s: "Cheap prices for leftovers would be the most effective measure.", a: "B", key: [4, 2], trap: [4, 1], wrong: { A: "Мая «lower price» дейді, бірақ кіші порцияның бағасы туралы. «biggest difference» деген пікір - Джоштікі." }, why: "Джош: «What I'm convinced about is price... that would make the biggest difference»." },
            { n: 28, s: "Students are unlikely to pay attention to posters.", a: "B", key: [4, 4], trap: [4, 3], wrong: { A: "Постерлерді Мая ұсынды - бірақ «ешкім оқымайды» деген Джош." }, why: "Джош: «Posters? Nobody reads them»." },
            { n: 29, s: "The canteen manager's view should be included in the report.", a: "C", key: [4, 5], trap: [2, 1], wrong: { A: "Менеджерді Мая бұрын атады (камера туралы), бірақ бұл пікір емес." }, why: "Доктор Прайс: «I'd want to see the canteen manager's view in the report»." },
            { n: 30, s: "The findings may not apply to other universities.", a: "C", key: [4, 7], trap: [4, 6], wrong: { A: "Мая тек сұрақ қояды («Should we say...?»), пікір білдірмейді." }, why: "Доктор Прайс: «Your findings may not be true elsewhere»." },
          ] },
      ],
    },
    /* ============================ PART 4 ============================ */
    {
      n: 4, title: "Green roofs", kk: "Академиялық дәріс: жасыл шатырлар",
      intro: "Part 4. You will hear part of a lecture about green roofs. First, you have some time to look at questions 31 to 40.",
      speakers: { E: { name: "Lecturer", kk: "дәріскер", g: "f", pitch: 0.95, rate: 0.97 } },
      segs: [
        { lines: [
          { w: "E", t: "Today I'm going to talk about green roofs - that is, roofs which are partly or completely covered with plants. I'll start with the two main types, then look at their benefits, and finish with some results from a study we've been running here, on the roof of the university library." },
        ] },
        { lines: [
          { w: "E", t: "The first type is the extensive roof. These have a thin layer of soil, usually less than 15 centimetres deep, and they need very little care. They're planted mainly with succulents - plants that store water in their leaves - although mosses are sometimes added too.", say: "The first type is the extensive roof. These have a thin layer of soil, usually less than fifteen centimetres deep, and they need very little care. They're planted mainly with succulents. Plants that store water in their leaves. Although mosses are sometimes added too." },
          { w: "E", t: "The second type, the intensive roof, is really a garden on top of a building, with deep soil, shrubs and even small trees. All that soil and water is extremely heavy, so before one can be installed, the structure of the building often has to be strengthened." },
        ] },
        { lines: [
          { w: "E", t: "So why build them? The first benefit is water. In our study, the roof held back as much as 70 per cent of the rain that fell in summer. In winter, when the plants grow slowly and the soil is already wet, the figure was only about 25 per cent.", say: "So why build them? The first benefit is water. In our study, the roof held back as much as seventy per cent of the rain that fell in summer. In winter, when the plants grow slowly and the soil is already wet, the figure was only about twenty-five per cent." },
          { w: "E", t: "The second benefit is temperature. Dark roofs absorb heat during the day and release it at night, which is part of what we call the urban heat island effect. Plants cool the air around them, so green roofs help to reduce it." },
          { w: "E", t: "Third, wildlife. Green roofs provide a habitat, especially for insects such as bees and beetles. People often expect to see lots of birds, but in fact birds mostly just visit to feed." },
          { w: "E", t: "And finally, cost. A green roof is more expensive to install, but the waterproof layer underneath is protected from ultraviolet light, which is what normally makes roofing materials crack. As a result, it lasts considerably longer." },
        ] },
        { lines: [
          { w: "E", t: "Now to our own study. We measured water and temperature, of course, but we also measured something people rarely think about: noise. Readers on the top floor of the library noticed that traffic and aircraft were much quieter after the roof was planted." },
          { w: "E", t: "We had expected frost to be the main danger, but the biggest setback came in the second year, when a long drought killed about a third of the plants." },
          { w: "E", t: "Most of the plants that died were imported species. We replaced them with native species, which have coped far better since then." },
        ] },
        { lines: [
          { w: "E", t: "Finally, the future. The city council discussed reducing taxes for building owners who install green roofs, but that idea was rejected. Instead, it's now planning to offer grants to help cover the cost of installation." },
          { w: "E", t: "That's all for today. Next week we'll look at living walls." },
        ] },
      ],
      groups: [
        { type: "notes", from: 31, to: 40, lim: "L1N", head: "GREEN ROOFS", instr: "Complete the notes below.",
          sections: [
            { h: "Types", from: 31, to: 32 }, { h: "Benefits", from: 33, to: 36 }, { h: "University library study", from: 37, to: 39 }, { h: "Future", from: 40, to: 40 },
          ],
          qs: [
            { n: 31, pre: "Extensive: soil under 15 cm; planted mainly with", post: "", kind: "word", a: ["succulents"], wrong: { mosses: "Мүк «sometimes added too» - негізгі өсімдік емес; «mainly» сөзі succulents-ке қатысты." }, key: [1, 0], trap: [1, 0], why: "«planted mainly with succulents», ал mosses - қосымша («sometimes added too»)." },
            { n: 32, pre: "Intensive: deep soil; the building's", post: "may need strengthening", kind: "word", a: ["structure"], key: [1, 1], trap: [1, 1], why: "«the structure of the building often has to be strengthened» → «the building's ___ may need strengthening» (парафраз)." },
            { n: 33, pre: "Water: in summer the roof kept up to", post: "% of rainfall", kind: "num", a: ["70"], wrong: { "25": "25% - қыстағы көрсеткіш. Жазбада «in summer» сөзіне назар аударыңыз.", "15": "15 - топырақ қалыңдығы (см)." }, key: [2, 0], trap: [2, 0], why: "«held back as much as 70 per cent of the rain that fell in summer»: held back = kept, as much as = up to." },
            { n: 34, pre: "Temperature: help to reduce the urban", post: "island effect", kind: "word", a: ["heat"], key: [2, 1], trap: [2, 1], why: "«the urban heat island effect» - дәл термин; бос орынға бір сөз ғана сыяды." },
            { n: 35, pre: "Wildlife: habitat especially for", post: "", kind: "word", a: ["insects"], wrong: { birds: "Құстар туралы: «birds mostly just visit to feed» - мекендемейді.", bees: "Аралар - мысал ғана («such as bees and beetles»); жазбада жалпы топ сұралады: insects." }, key: [2, 2], trap: [2, 2], why: "«especially for insects such as bees and beetles»." },
            { n: 36, pre: "Cost: waterproof layer lasts longer as it is protected from", post: "light", kind: "word", a: ["ultraviolet", "uv", "ultra-violet"], key: [2, 3], trap: [2, 3], why: "«protected from ultraviolet light, which is what normally makes roofing materials crack»." },
            { n: 37, pre: "The study also measured", post: "on the top floor", kind: "word", a: ["noise"], wrong: { temperature: "Температура мен су «of course» өлшенді; «also» - қосымша өлшенген нәрсе: noise.", water: "Температура мен су «of course» өлшенді; «also» - қосымша өлшенген нәрсе: noise.", traffic: "Көлік - шудың көзі, өлшенген шама емес." }, key: [3, 0], trap: [3, 0], why: "«we also measured something people rarely think about: noise»." },
            { n: 38, pre: "Year 2: about a third of the plants died in a long", post: "", kind: "word", a: ["drought"], wrong: { frost: "Аяз - күтілген қауіп («We had expected frost»), бірақ өсімдіктерді құрғақшылық құртты.", draught: "«draught» - басқа сөз (жел өтінді). Дұрысы: drought (құрғақшылық). Емле мағынаны өзгертеді." }, key: [3, 1], trap: [3, 1], why: "«We had expected frost..., but the biggest setback came... when a long drought killed about a third of the plants»." },
            { n: 39, pre: "Dead plants were replaced with", post: "species", kind: "word", a: ["native"], wrong: { imported: "Импортталғандары - ӨЛГЕН өсімдіктер; олар native species-пен алмастырылды." }, key: [3, 2], trap: [3, 2], why: "«We replaced them with native species»." },
            { n: 40, pre: "The city council plans to offer", post: "for installation", kind: "word", a: ["grants"], wrong: { taxes: "Салықты азайту «was rejected» - бас тартылған.", tax: "Салықты азайту «was rejected» - бас тартылған." }, key: [4, 0], trap: [4, 0], why: "«that idea was rejected. Instead, it's now planning to offer grants»." },
          ] },
      ],
    },
  ],
  outro: "That is the end of the listening test. You now have two minutes to check your answers.",
};
