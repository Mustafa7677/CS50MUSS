/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* IELTS Speaking Studio - AO17 жазған сұрақтар банкі (емтихан жинақтарынан көшірілмеген). */
window.IELTS_SPEAKING = {
  part1: [
    { topic: "Your hometown", kk: "Туған қала", q: ["Where is your hometown, and what is it known for?", "What do you like most about living there?", "Has your hometown changed much since you were a child?", "Would you recommend it to a visitor? Why or why not?"] },
    { topic: "Studies or work", kk: "Оқу не жұмыс", q: ["Do you work or are you a student?", "What do you enjoy most about your studies or job?", "Is there anything you would like to change about it?", "What would you like to do in the future?"] },
    { topic: "Food", kk: "Тағам", q: ["What kind of food do you usually eat at home?", "Do you prefer cooking for yourself or eating out?", "Is there a dish from your country that you would recommend?", "Have your eating habits changed in recent years?"] },
    { topic: "Weekends", kk: "Демалыс күндері", q: ["What do you usually do at the weekend?", "Do you prefer to spend weekends at home or going out?", "What did you do last weekend?", "Are weekends in your country different from when your parents were young?"] },
    { topic: "Mobile phones", kk: "Ұялы телефон", q: ["How often do you use your phone each day?", "What do you mainly use it for?", "Could you live without a phone for a week?", "Do you think children should have their own phones?"] },
  ],
  part2: [
    { id: "skill", title: "Describe a useful skill you learned outside school.", say: ["what the skill is", "who helped you learn it", "how long it took you to learn it"], explain: "and explain why this skill is useful to you.",
      p3: ["Is it better to learn practical skills from family members or from professional teachers? Why?", "Which practical skills do you think schools should teach?", "How has technology changed the way people learn new skills?"] },
    { id: "place", title: "Describe a place in your town or city where you like to spend time.", say: ["where it is", "what it looks like", "what you do there"], explain: "and explain why you like spending time there.",
      p3: ["Why are public spaces such as parks important in cities?", "How could local authorities make public spaces more attractive to young people?", "Do you think people spend less time outdoors than in the past? Why?"] },
    { id: "help", title: "Describe a time when you helped someone.", say: ["who you helped", "what the problem was", "how you helped"], explain: "and explain how you felt about it.",
      p3: ["Why do some people choose to do volunteer work?", "Should schools require students to do community service?", "Do neighbours help each other less than they used to? Why might that be?"] },
    { id: "story", title: "Describe a book, film or series that made you think.", say: ["what it was", "when you read or watched it", "what it was about"], explain: "and explain why it made you think.",
      p3: ["Do you think reading books develops different skills from watching films?", "Should parents limit the amount of time children spend watching screens?", "Why do people in every culture tell stories?"] },
    { id: "object", title: "Describe an object you own that is important to you.", say: ["what the object is", "how you got it", "how often you use it"], explain: "and explain why it is important to you.",
      p3: ["Why do people keep objects that have no practical use?", "Do you think people today own too many things?", "How do the things people value change as they get older?"] },
  ],
  // Ережемен тексерілетін шағын тапсырмалар: ең жақсы дамытылған жауапты таңдау
  extend: [
    { part: 1, q: "Do you prefer cooking for yourself or eating out?", opts: [
      { t: "Cooking.", why: "Тым қысқа: сұраққа жауап бар, бірақ себеп те, мысал да жоқ. Part 1-де 2-3 сөйлеммен дамыту күтіледі." },
      { t: "I'd say cooking, mainly because it's cheaper and I can control what goes into my food. For example, on Sundays I usually make a big pot of soup for the whole week.", best: true, why: "Тікелей жауап + себеп (because) + нақты мысал. Табиғи әрі дамытылған." },
      { t: "Food is very important for all people in the world because without food we cannot live, and healthy food is a key to success in modern society.", why: "Жаттанды, жалпы сөйлемдер: сұраққа (сіз не қалайсыз?) жауап жоқ. Емтихан алушы жаттанды жауапты байқайды." },
    ] },
    { part: 1, q: "What did you do last weekend?", opts: [
      { t: "Last weekend I visit my grandmother and we cook together, it is very nice.", why: "Мазмұны бар, бірақ шақ қате: last weekend → өткен шақ (visited, cooked). Grammatical Range and Accuracy-ге әсер етеді." },
      { t: "I went to the cinema.", why: "Дұрыс, бірақ тым қысқа: не көрдіңіз? кіммен? ұнады ма?" },
      { t: "Actually, I had quite a quiet weekend. I visited my grandmother on Saturday, and we spent the afternoon baking bread together, which was surprisingly relaxing.", best: true, why: "Жауап + өткен шақ дұрыс + бөлшек + сезім. Fluency and Coherence мен грамматикаға жақсы мысал." },
    ] },
    { part: 3, q: "Should schools require students to do community service?", opts: [
      { t: "Yes, I think so, because it is good.", why: "Пікір бар, бірақ себеп бос («good» - неге?). Part 3-те ойды дамыту, мысал және салдар күтіледі." },
      { t: "To some extent, yes. Volunteering can teach teenagers responsibility, for instance by helping at a local food bank. However, if it's compulsory, some students might just do the minimum, so schools should probably offer a choice of projects.", best: true, why: "Пікір + себеп + мысал + қарсы көзқарас (However) + ұсыныс. Бұл - Part 3-тегі дамытылған жауап." },
      { t: "In my country there are many schools, and students study many subjects such as mathematics, history and English.", why: "Тақырыптан тыс: мектеп туралы, бірақ сұраққа (міндетті ме?) жауап жоқ." },
    ] },
    { part: 3, q: "Do you think people spend less time outdoors than in the past?", opts: [
      { t: "Probably, yes, especially in big cities. A lot of entertainment has moved onto screens, and many people work indoors all day. That said, I've noticed that cycling has become more popular recently, so the picture isn't completely negative.", best: true, why: "Пікір + екі себеп + қарсы мысал (That said...). Байланыстырғыштар табиғи." },
      { t: "Outdoors is nature. Nature is trees, rivers and mountains. Nature is very beautiful.", why: "Сұраққа (бұрынғымен салыстыру) жауап жоқ; бір құрылым қайталанады." },
      { t: "No.", why: "Жауап бар, бірақ мүлде дамытылмаған. Part 3 - пікірталас: неге екенін түсіндіріңіз." },
    ] },
  ],
  // Өзін-өзі бағалау: ресми критерийлер атауымен рефлексия сұрақтары (баға емес)
  criteria: [
    { c: "Fluency and Coherence", q: ["Ұзақ үзіліссіз, ойымды жалғастыра сөйледім бе?", "Идеяларым ретімен жүрді ме (бірінші, сонымен қатар, мысалы)?"] },
    { c: "Lexical Resource", q: ["Тақырыпқа сай сөздер қолдандым ба, бір сөзді қайталай бермедім бе?", "Сөзді білмегенде басқаша түсіндіре алдым ба?"] },
    { c: "Grammatical Range and Accuracy", q: ["Шақтарды дұрыс қолдандым ба (өткен оқиғаға - өткен шақ)?", "Тек қарапайым емес, күрделі сөйлемдер де болды ма (because, which, if)?"] },
    { c: "Pronunciation", q: ["Жазбаны тыңдағанда сөздерім анық естіле ме?", "Екпін мен интонация мағынаны көрсетті ме (сұрақ, тізім, маңызды сөз)?"] },
  ],
};
