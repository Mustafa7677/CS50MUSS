// CS50 SQL курсының демо дерекқорлары мен автотексерушісі. Деректер ойдан шығарылған; сұраулардың эталондары sqlite3-пен тексерілген.
window.CS50KZ_DB = Object.assign(window.CS50KZ_DB || {}, {"inject": "\nCREATE TABLE users (id INTEGER PRIMARY KEY, user TEXT NOT NULL UNIQUE, password TEXT NOT NULL);\nINSERT INTO users (id,user,password) VALUES (1,'Carter','password'),(2,'Aigerim','qwerty123'),(3,'Dauren','sunflower'),(4,'admin','S3cr3t!');\nCREATE TABLE accounts (id INTEGER PRIMARY KEY, name TEXT NOT NULL, balance INTEGER NOT NULL);\nINSERT INTO accounts VALUES (1,'Carter',120000),(2,'Aigerim',850000),(3,'Dauren',42000),(4,'Nurlan',1500000);\n", "mfa": "\nCREATE TABLE collections (id INTEGER PRIMARY KEY, title TEXT NOT NULL, accession_number TEXT NOT NULL UNIQUE, acquired TEXT, deleted INTEGER NOT NULL DEFAULT 0);\nINSERT INTO collections (id,title,accession_number,acquired) VALUES\n(1,'Profusion of flowers','56.257','1956-04-12'),\n(2,'Imaginative landscape','56.496','1956-04-12'),\n(3,'Farmers working at dawn','11.4021','1911-06-20'),\n(4,'Spring outing','14.76','1914-01-08'),\n(5,'Windswept Bluffs','2001.4','2001-03-15');\nCREATE TABLE transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, action TEXT NOT NULL CHECK(action IN ('bought','sold')));\n", "mbta6": "\nCREATE TABLE cards (id INTEGER PRIMARY KEY AUTOINCREMENT);\nCREATE TABLE stations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, line TEXT NOT NULL CHECK(line IN ('blue','green','orange','red')));\nCREATE TABLE swipes (id INTEGER PRIMARY KEY AUTOINCREMENT, card_id INTEGER, station_id INTEGER, type TEXT NOT NULL CHECK(type IN ('enter','exit','deposit')), datetime NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP, amount NUMERIC NOT NULL CHECK(amount != 0), FOREIGN KEY(station_id) REFERENCES stations(id), FOREIGN KEY(card_id) REFERENCES cards(id));\nINSERT INTO cards DEFAULT VALUES; INSERT INTO cards DEFAULT VALUES; INSERT INTO cards DEFAULT VALUES;\nINSERT INTO stations (name,line) VALUES ('Alewife','red'),('Harvard','red'),('Park Street','green'),('State','blue');\nINSERT INTO swipes (card_id,station_id,type,datetime,amount) VALUES\n(1,2,'enter','2024-01-08 08:10:00',-2.40),(1,NULL,'deposit','2024-01-08 08:00:00',10.00),(2,1,'enter','2024-01-08 08:12:30',-2.40),\n(3,3,'enter','2024-01-08 09:01:10',-2.40),(2,3,'exit','2024-01-08 08:40:00',0.01),(3,NULL,'deposit','2024-01-08 09:00:00',5.50);\n", "deep": "CREATE TABLE observations (id INTEGER PRIMARY KEY, ts TEXT NOT NULL UNIQUE, species TEXT NOT NULL, depth_m INTEGER NOT NULL);\nINSERT INTO observations (id,ts,species,depth_m) VALUES\n(1,'2023-11-01 00:00:01.020','viperfish',3111),\n(2,'2023-11-01 00:00:04.127','gulper eel',1815),\n(3,'2023-11-01 00:04:44.618','anglerfish',3040),\n(4,'2023-11-01 00:04:55.336','dumbo octopus',3561),\n(5,'2023-11-01 00:05:54.376','viperfish',2448),\n(6,'2023-11-01 00:06:12.932','viperfish',1082),\n(7,'2023-11-01 00:07:26.698','gulper eel',3083),\n(8,'2023-11-01 00:08:17.638','hatchetfish',2065),\n(9,'2023-11-01 00:08:31.584','gulper eel',1366),\n(10,'2023-11-01 00:13:34.592','viperfish',2454),\n(11,'2023-11-01 00:15:44.484','dumbo octopus',3007),\n(12,'2023-11-01 00:20:14.193','lanternfish',1307),\n(13,'2023-11-01 00:21:17.817','lanternfish',1014),\n(14,'2023-11-01 00:23:40.912','lanternfish',2130),\n(15,'2023-11-01 00:27:00.232','hatchetfish',2807),\n(16,'2023-11-01 00:27:40.091','dumbo octopus',2106),\n(17,'2023-11-01 00:28:17.927','giant squid',4104),\n(18,'2023-11-01 00:31:54.272','dumbo octopus',1819),\n(19,'2023-11-01 00:34:20.229','giant squid',1920),\n(20,'2023-11-01 00:34:31.437','dumbo octopus',1912),\n(21,'2023-11-01 00:34:52.690','anglerfish',3200),\n(22,'2023-11-01 00:38:57.622','hatchetfish',1656),\n(23,'2023-11-01 00:39:56.712','giant squid',1370),\n(24,'2023-11-01 00:40:50.989','dumbo octopus',3866),\n(25,'2023-11-01 00:43:35.087','sea cucumber',4033),\n(26,'2023-11-01 00:44:37.471','anglerfish',3897),\n(27,'2023-11-01 00:44:41.852','dumbo octopus',3196),\n(28,'2023-11-01 00:49:21.087','lanternfish',4191),\n(29,'2023-11-01 00:52:06.355','gulper eel',3630),\n(30,'2023-11-01 00:52:07.873','sea cucumber',1833),\n(31,'2023-11-01 00:52:21.812','hatchetfish',2500),\n(32,'2023-11-01 00:52:33.307','anglerfish',3049),\n(33,'2023-11-01 00:56:33.834','dumbo octopus',2925),\n(34,'2023-11-01 00:58:59.985','lanternfish',1544),\n(35,'2023-11-01 00:59:09.355','gulper eel',4055),\n(36,'2023-11-01 00:59:27.716','viperfish',2977),\n(37,'2023-11-01 03:00:57.601','giant squid',1025),\n(38,'2023-11-01 06:26:30.809','giant squid',1687),\n(39,'2023-11-01 07:14:10.743','hatchetfish',2082),\n(40,'2023-11-01 07:33:09.006','hatchetfish',3498),\n(41,'2023-11-01 07:41:53.551','lanternfish',1785),\n(42,'2023-11-01 08:40:33.048','anglerfish',2358),\n(43,'2023-11-01 09:41:15.698','anglerfish',1699),\n(44,'2023-11-01 09:53:08.262','lanternfish',1819),\n(45,'2023-11-01 12:33:26.476','gulper eel',1339),\n(46,'2023-11-01 13:03:49.797','hatchetfish',1392),\n(47,'2023-11-01 14:49:52.400','dumbo octopus',3882),\n(48,'2023-11-01 14:51:15.344','hatchetfish',1766),\n(49,'2023-11-01 15:05:25.124','gulper eel',2378),\n(50,'2023-11-01 16:04:28.683','sea cucumber',3428),\n(51,'2023-11-01 16:09:01.318','anglerfish',1322),\n(52,'2023-11-01 16:15:37.920','lanternfish',4027),\n(53,'2023-11-01 16:19:20.875','viperfish',2563),\n(54,'2023-11-01 16:21:59.924','anglerfish',1076),\n(55,'2023-11-01 17:00:10.135','sea cucumber',2850),\n(56,'2023-11-01 18:31:25.442','viperfish',2634),\n(57,'2023-11-01 20:44:37.027','lanternfish',3052),\n(58,'2023-11-01 21:01:11.512','hatchetfish',2788),\n(59,'2023-11-01 21:34:41.700','giant squid',2765),\n(60,'2023-11-01 22:12:59.114','lanternfish',4140),\n(61,'2023-11-01 23:05:19.163','lanternfish',1894);\n", "linkedin": "CREATE TABLE users (id INTEGER PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL);\nINSERT INTO users VALUES (1,'Айгерім','Садықова','aigerim','password'),(2,'Данияр','Нұрланов','daniyar','password'),(3,'Сәуле','Қасымова','saule','password'),(4,'Ерлан','Мәлікұлы','erlan','password'),(5,'Динара','Бекова','dinara','password'),(6,'Нұрсұлтан','Әбенов','nursultan','password'),(7,'Мадина','Ержанова','madina','password'),(8,'Бауыржан','Темірханов','bauyrzhan','password'),(9,'Асем','Оразбаева','assem','password'),(10,'Тимур','Жақсылықов','timur','password'),(11,'Гүлнар','Сейітова','gulnar','password'),(12,'Расул','Қалиев','rasul','password');\n\nCREATE TABLE schools (id INTEGER PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('Primary','Secondary','Higher Education')), location TEXT NOT NULL, founded INTEGER NOT NULL);\nINSERT INTO schools VALUES (1,'Алатау университеті','Higher Education','Алматы',1934),(2,'Сарыарқа политехникалық институты','Higher Education','Қарағанды',1953),(3,'Алматы №1 лицей','Secondary','Алматы',1989),(4,'Бөгенбай мектебі','Primary','Астана',1998);\nCREATE TABLE companies (id INTEGER PRIMARY KEY, name TEXT NOT NULL, industry TEXT NOT NULL CHECK(industry IN ('Technology','Education','Business')), location TEXT NOT NULL);\nINSERT INTO companies VALUES (1,'QazTech','Technology','Астана'),(2,'Дала Консалтинг','Business','Алматы'),(3,'Білім Орда','Education','Шымкент');\nCREATE TABLE connections (user_a INTEGER NOT NULL, user_b INTEGER NOT NULL, FOREIGN KEY(user_a) REFERENCES users(id), FOREIGN KEY(user_b) REFERENCES users(id), CHECK(user_a < user_b), PRIMARY KEY(user_a,user_b));\nINSERT INTO connections VALUES (1,2),(1,3),(1,5),(2,3),(2,6),(3,7),(4,5),(4,8),(5,9),(6,7),(6,10),(7,11),(8,12),(9,10),(10,11);\nCREATE TABLE school_affiliations (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, school_id INTEGER NOT NULL, start_date TEXT NOT NULL, end_date TEXT, degree TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(school_id) REFERENCES schools(id));\nINSERT INTO school_affiliations (user_id,school_id,start_date,end_date,degree) VALUES\n(1,1,'2010-09-01','2014-06-30','BA'),(1,1,'2014-09-01','2016-06-30','MA'),(2,1,'2011-09-01','2015-06-30','BA'),(3,2,'2012-09-01','2017-06-30','BA'),\n(4,1,'2005-09-01','2011-06-30','PhD'),(5,2,'2013-09-01','2015-06-30','MA'),(6,3,'2008-09-01','2011-06-30','HS'),(7,1,'2016-09-01','2020-06-30','BA'),\n(8,2,'2007-09-01','2013-06-30','PhD'),(9,1,'2019-09-01',NULL,'MA'),(10,4,'2003-09-01','2007-06-30','Primary'),(11,2,'2018-09-01','2022-06-30','BA');\nCREATE TABLE company_affiliations (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, company_id INTEGER NOT NULL, title TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(company_id) REFERENCES companies(id));\nINSERT INTO company_affiliations (user_id,company_id,title,start_date,end_date) VALUES\n(1,1,'Инженер','2016-08-01',NULL),(2,1,'Дизайнер','2015-09-01','2019-03-01'),(2,2,'Кеңесші','2019-04-01',NULL),(3,1,'Талдаушы','2017-08-15',NULL),\n(4,3,'Профессор','2011-09-01',NULL),(5,2,'Менеджер','2015-07-01','2021-12-31'),(6,2,'Директор','2012-01-10',NULL),(7,1,'Инженер','2020-08-01',NULL),\n(8,3,'Оқытушы','2013-09-01','2018-06-30'),(9,1,'Стажер','2023-06-01',NULL),(10,2,'Талдаушы','2014-03-01',NULL);\n"});
window.CS50KZ_SQLCHECKS = Object.assign(window.CS50KZ_SQLCHECKS || {}, {
 "sql6-deep": {
  "db": "deep",
  "note": "Бұл - сайттың өз жаттығуы, ресми тапсырма емес. «From the Deep» тапсырмасындағы ойды (қай қайыққа не түседі) нақты SQLite деректерінде сезінесіз: observations кестесінде 2023-11-01 күнгі бақылаулар, олардың көбі түн ортасынан кейінгі сағатта. (id, ts, species, depth_m).",
  "tasks": [
   {
    "f": "1.sql",
    "t": "2023-11-01 күні 00:00-ден 01:00-ге дейінгі (01:00 кірмейді) бақылаулардың ts және species бағандарын шығарыңыз. Бұл - сағат бойынша бөлуде тек бір қайыққа жіберілетін сұрау.",
    "ref": "SELECT ts, species FROM observations WHERE ts >= '2023-11-01 00:00:00' AND ts < '2023-11-01 01:00:00';"
   },
   {
    "f": "2.sql",
    "t": "Әр сағатта неше бақылау болды? Баған атаулары hour (мәтін, мысалы '00') және n; hour бойынша өсу ретімен.",
    "ref": "SELECT strftime('%H', ts) AS hour, COUNT(*) AS n FROM observations GROUP BY hour ORDER BY hour;"
   },
   {
    "f": "3.sql",
    "t": "«Сағат бойынша бөлу» схемасын модельдеңіз: сағат 0-7 - қайық 'A', 8-15 - 'B', 16-23 - 'C'. Әр қайыққа неше бақылау түседі? Бағандар: boat, n; boat бойынша өсу ретімен.",
    "ref": "SELECT CASE WHEN CAST(strftime('%H', ts) AS INTEGER) < 8 THEN 'A' WHEN CAST(strftime('%H', ts) AS INTEGER) < 16 THEN 'B' ELSE 'C' END AS boat, COUNT(*) AS n FROM observations GROUP BY boat ORDER BY boat;"
   },
   {
    "f": "4.sql",
    "t": "Үшінші сұрауды дамытыңыз: ең көп бақылау түсетін қайықты ғана (қызу нүкте, hotspot) шығарыңыз: бір жол, бағандар boat, n.",
    "ref": "SELECT CASE WHEN CAST(strftime('%H', ts) AS INTEGER) < 8 THEN 'A' WHEN CAST(strftime('%H', ts) AS INTEGER) < 16 THEN 'B' ELSE 'C' END AS boat, COUNT(*) AS n FROM observations GROUP BY boat ORDER BY n DESC LIMIT 1;"
   },
   {
    "f": "5.sql",
    "t": "«Хэш бойынша бөлуді» ең қарапайым түрде модельдеңіз: id % 3 мәні қайық нөмірі (shard) болсын. Әр шардта неше бақылау бар? Бағандар: shard, n; shard бойынша өсу ретімен.",
    "ref": "SELECT id % 3 AS shard, COUNT(*) AS n FROM observations GROUP BY shard ORDER BY shard;"
   },
   {
    "f": "6.sql",
    "t": "Нақты бір бақылауды табыңыз: ts дәл 2023-11-01 16:21:59.924. Барлық бағандарды (*) шығарыңыз.",
    "ref": "SELECT * FROM observations WHERE ts = '2023-11-01 16:21:59.924';"
   }
  ]
 },
 "sql6-linkedin": {
  "db": "linkedin",
  "note": "Бұл - сайттың өз жаттығуы, ресми тапсырма емес. «Happy to Connect» тапсырмасындағы схеманың (MySQL) SQLite-қа аударылған, деректері ойдан шығарылған нұсқасы: users, schools, companies, connections (өзара байланыс, user_a < user_b), school_affiliations, company_affiliations.",
  "tasks": [
   {
    "f": "1.sql",
    "t": "«Алатау университеті» түлектерінің (кез келген дәрежедегі) first_name және last_name бағандарын шығарыңыз. Бір адам екі рет болса, бір рет қана шығарыңыз.",
    "ref": "SELECT DISTINCT u.first_name, u.last_name FROM users u JOIN school_affiliations sa ON sa.user_id = u.id JOIN schools s ON s.id = sa.school_id WHERE s.name = 'Алатау университеті';"
   },
   {
    "f": "2.sql",
    "t": "QazTech компаниясының қазіргі қызметкерлерінің (end_date бос) username және title бағандарын шығарыңыз.",
    "ref": "SELECT u.username, ca.title FROM users u JOIN company_affiliations ca ON ca.user_id = u.id JOIN companies c ON c.id = ca.company_id WHERE c.name = 'QazTech' AND ca.end_date IS NULL;"
   },
   {
    "f": "3.sql",
    "t": "PhD дәрежесін алған (немесе алып жатқан) адамдардың username және мектебінің name бағандарын шығарыңыз.",
    "ref": "SELECT u.username, s.name FROM users u JOIN school_affiliations sa ON sa.user_id = u.id JOIN schools s ON s.id = sa.school_id WHERE sa.degree = 'PhD';"
   },
   {
    "f": "4.sql",
    "t": "Әр қолданушының неше байланысы бар? Байланыс connections кестесінде бір рет жазылған (user_a < user_b), сондықтан екі бағанды да ескеріңіз. Бағандар: username, n; тек байланысы барлар; n кему, сосын username өсу ретімен.",
    "ref": "SELECT u.username, COUNT(*) AS n FROM users u JOIN connections c ON u.id = c.user_a OR u.id = c.user_b GROUP BY u.id ORDER BY n DESC, u.username;"
   },
   {
    "f": "5.sql",
    "t": "Аты-жөні (first_name) бойынша: қазір бір де бір компанияда жұмыс істемейтін (немесе ешқашан істемеген) қолданушылар. «Қазір» = end_date IS NULL бар жазба жоқ.",
    "ref": "SELECT first_name FROM users WHERE id NOT IN (SELECT user_id FROM company_affiliations WHERE end_date IS NULL);"
   },
   {
    "f": "6.sql",
    "t": "Қай қалада орналасқан мектептерден қанша адам білім алған? Бағандар: location, n (school_affiliations жазбаларының саны); location өсу ретімен.",
    "ref": "SELECT s.location, COUNT(*) AS n FROM schools s JOIN school_affiliations sa ON sa.school_id = s.id GROUP BY s.location ORDER BY s.location;"
   }
  ]
 }
});
