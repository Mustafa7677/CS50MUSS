#!/usr/bin/env python3
"""«Байқоңыр құпиясы» - екінші SQL детектив ісінің деректері.

Барлық кейіпкерлер, ұйымдар мен оқиғалар ойдан шығарылған.
  python3 tools/make_mystery2.py  →  assets/data/mystery2.js
Генератор шешімнің біреу ғана екенін және әр із жеке алғанда
бірнеше күдікті қалдыратынын өзі тексереді.

Бірінші істен айырмашылығы - басқа SQL дағдылары керек:
JOIN, GROUP BY ... HAVING, LIKE / NOT LIKE, мәтін түріндегі күн-уақыт.
"""
import hashlib
import json
import random
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
rnd = random.Random(1961)  # Гагарин ұшқан жыл
DAY, NEXT = "2026-04-12", "2026-04-13"  # Ғарышкерлер күні

FIRST = ["Aidos", "Aisulu", "Alikhan", "Altynai", "Amina", "Ansar", "Assylzhan", "Ayan", "Aybolat", "Balnur",
         "Beibarys", "Dias", "Elnara", "Erasyl", "Inkar", "Kanat", "Karina", "Kuanysh", "Laura", "Miras",
         "Nazerke", "Nurbol", "Olzhas", "Raiymbek", "Sanzhar", "Shyngys", "Togzhan", "Ulpan", "Yernar", "Zhansaya"]
LAST = ["Amanov", "Baikenov", "Dosov", "Esenov", "Karimov", "Kuanyshev", "Moldabekov", "Orazov",
        "Rakhimov", "Sarsenov", "Tulegenov", "Zhakupov", "Abdrakhmanov", "Serikbayev"]
DEPTS = ["Design Bureau", "Telemetry", "Fuel Systems", "Mission Control", "Logistics", "Medical"]


def fname(first, last):
    # Әйел есімдеріне -а жалғауы
    fem = first in {"Aisulu", "Altynai", "Amina", "Assylzhan", "Balnur", "Elnara", "Inkar", "Karina", "Laura",
                    "Nazerke", "Togzhan", "Ulpan", "Zhansaya"}
    return f"{first} {last + 'a' if fem else last}"


used = set()
def new_name():
    while True:
        n = fname(rnd.choice(FIRST), rnd.choice(LAST))
        if n not in used:
            used.add(n)
            return n


def email_of(name, domain):
    f, l = name.lower().split()
    return f"{f}.{l}@{domain}"


# ---- қызметкерлер (космодром)
employees = []
for eid in range(1, 91):
    n = new_name()
    employees.append({"id": eid, "name": n, "department": rnd.choice(DEPTS), "badge_id": f"BK-{rnd.randint(1000, 9999)}",
                      "email": email_of(n, "baikonur.kz"), "passport_number": rnd.randint(10_000_000, 99_999_999)})
E = employees
design = [e for e in E if e["department"] == "Design Bureau"]

# ---- сырттағы адамдар
people = []
for pid in range(1, 61):
    n = new_name()
    people.append({"id": pid, "name": n, "email": email_of(n, rnd.choice(["mail.kz", "inbox.kz", "gmail.com", "post.kz"])),
                   "city": rnd.choice(["Almaty", "Astana", "Shymkent", "Kyzylorda", "Aktobe", "Taraz", "Turkistan"])})

# ---- рөлдер
thief = design[2]
accomplice = people[17]
others = [e for e in E if e is not thief]
rnd.shuffle(others)
archive_fake = others[0:6]      # архив есігінен кірген басқалар
printer_fake = others[3:9]      # B-2 принтерінде көп басып шығарғандар
email_fake = [others[1], others[3]] + others[5:10]  # сыртқа үлкен файл жібергендер
train_fake = [others[1], others[4], others[5], others[8], others[11], others[12]]  # ертеңгі бірінші пойыздағы басқалар
# others[5] - төрт іздің бәріне жақын «алдамшы» күдікті: архивке кірген, бірақ кеш шыққан.

# ---- оқиға есептері
reports = [
    [1, DAY, "Design Bureau", "Ғарышкерлер күні мерекесі кезінде, сағат 14:00 мен 15:00 аралығында, Конструкторлық бюроның сейфінен «Тұлпар-1» зымыранының құпия сызбалары жоғалды. Үш қызметкермен сұхбат алынды, үшеуі де бюроны атап өтті."],
    [2, DAY, "Canteen", "Асханада наурыз көже емес, бауырсақ таусылып қалды. Шағым түсті, куә жоқ."],
    [3, DAY, "Launch Pad 1", "Мерекелік салютқа арналған зеңбірек 12:00-де сынақтан сәтті өтті."],
]
rid = 4
for _ in range(30):
    m, d = rnd.choice([3, 4]), rnd.randint(1, 28)
    if (m, d) == (4, 12):
        continue
    reports.append([rid, f"2026-{m:02d}-{d:02d}", rnd.choice(["Telemetry", "Logistics", "Hangar 2", "Canteen", "Hotel Kosmonavt"]),
                    rnd.choice(["Жоғалған кілт табылды.", "Принтерде қағаз біткен.", "Кондиционер істен шықты.",
                                "Түйе космодром аумағына кіріп кетті, оны жайлап шығарып жіберді.",
                                "Телеметрия антеннасы тексерілді, ақау жоқ."])])
    rid += 1

interviews = [
    [1, "Ainur Kassenova", DAY, "Ұрлықтан кейін бір сағат өтпей-ақ ұры бюроның архив есігінен шығып кетті. Ол түстен кейін сол есіктен кірген еді - пропуск сканерінің жазбаларын тексеріңіз."],
    [2, "Bolat Zhunusov", DAY, "Таңертең ұрының B-2 принтерінде өте көп парақ басып шығарғанын көрдім - бүкіл бір бума, елу парақтан артық. Бәрін бір-ақ рет басқан жоқ, бірнеше рет барды."],
    [3, "Dina Mukhtarova", DAY, "Ұры сызбаларды сканерлеп, космодромнан тыс біреуге үлкен файл жіберді (5 МБ-тан үлкен). Сосын телефонмен «ертең Төретамнан бірінші пойызбен кетемін» деді."],
    [4, "Yerbol Temirov", DAY, "Мен салютты көріп тұрдым. Әдемі болды! Басқа ештеңе байқамадым."],
    [5, "Gaukhar Seitova", "2026-04-10", "Кеше асханадағы бауырсақ өте дәмді болды."],
]

# ---- пропуск сканерлері
scans, sid = [], 1
def scan(e, building, door, t, direction):
    global sid
    scans.append([sid, e["badge_id"], building, door, f"{DAY} {t}", direction]); sid += 1
def hm(h, m):
    return f"{h:02d}:{m:02d}"
for e in E:  # таңертең бәрі кіреді
    scan(e, e["department"] if e["department"] != "Mission Control" else "Control Center", "main", hm(rnd.randint(7, 8), rnd.randint(0, 59)), "in")
scan(thief, "Design Bureau", "archive", hm(14, 7), "in")
scan(thief, "Design Bureau", "archive", hm(14, 52), "out")
for k, e in enumerate(archive_fake):
    t_in = hm(14, rnd.randint(1, 40))
    scan(e, "Design Bureau", "archive", t_in, "in")
    # төртеуі ұрлықтан кейін бір сағат ішінде шығады, қалғандары (соның ішінде алдамшы) - 16:00-ден кейін
    late = k in (0, 5)
    scan(e, "Design Bureau", "archive", hm(rnd.choice([16, 17]), rnd.randint(5, 59)) if late else hm(15, rnd.randint(5, 55)), "out")
for e in rnd.sample(E, 25):  # басқа есіктер мен ғимараттар
    scan(e, rnd.choice(["Design Bureau", "Telemetry", "Hangar 2"]), "main", hm(rnd.randint(13, 15), rnd.randint(0, 59)), rnd.choice(["in", "out"]))
for e in rnd.sample(E, 6):  # архив есігі, бірақ таңертең
    scan(e, "Design Bureau", "archive", hm(rnd.randint(9, 11), rnd.randint(0, 59)), "in")
scans.sort(key=lambda r: r[4])
for i, r in enumerate(scans, 1):
    r[0] = i

# ---- принтер
jobs, jid = [], 1
FILES = ["report.pdf", "menu.docx", "salut_plan.pdf", "telemetry_log.csv", "drawing_{}.dwg", "photo.jpg", "schedule.xlsx"]
def job(e, printer, t, pages, f):
    global jid
    jobs.append([jid, e["id"], f"{DAY} {t}", printer, pages, f]); jid += 1
for k in range(4):  # ұры: 4 рет, барлығы 50-ден көп
    job(thief, "B-2", hm(9, 10 + k * 7), rnd.randint(14, 19), FILES[4].format(k + 1))
for e in printer_fake:
    for k in range(rnd.randint(3, 5)):
        job(e, "B-2", hm(rnd.randint(8, 11), rnd.randint(0, 59)), rnd.randint(13, 22), rnd.choice(FILES).format(k))
for e in rnd.sample(E, 30):  # аз басып шығарғандар
    job(e, rnd.choice(["B-2", "A-1", "C-3"]), hm(rnd.randint(8, 16), rnd.randint(0, 59)), rnd.randint(1, 12), rnd.choice(FILES).format(1))
for e in rnd.sample(E, 5):  # бір-ақ рет көп басқан, бірақ басқа принтерде
    job(e, "A-1", hm(rnd.randint(8, 11), rnd.randint(0, 59)), rnd.randint(55, 80), "manual.pdf")
jobs.sort(key=lambda r: r[2])
for i, r in enumerate(jobs, 1):
    r[0] = i

# ---- электрондық пошта
mails, mid = [], 1
def mail(frm, to, t, subject, kb, day=DAY):
    global mid
    mails.append([mid, frm, to, f"{day} {t}", subject, kb]); mid += 1
mail(thief["email"], accomplice["email"], hm(15, 4), "Әжемнің бауырсақ рецепті", 18_400)
for e in email_fake:
    mail(e["email"], rnd.choice(people)["email"], hm(rnd.randint(13, 17), rnd.randint(0, 59)),
         rnd.choice(["Мерекелік фотолар", "Салют видеосы", "Отбасылық альбом"]), rnd.randint(6_000, 40_000))
for _ in range(50):  # ішкі хаттар (үлкен де, кіші де)
    a, b = rnd.sample(E, 2)
    mail(a["email"], b["email"], hm(rnd.randint(8, 18), rnd.randint(0, 59)),
         rnd.choice(["Кездесу", "Телеметрия есебі", "Түскі ас?", "Сызба нұсқасы", "Салют жоспары"]), rnd.randint(5, 30_000))
for _ in range(25):  # сыртқа кіші хаттар
    a = rnd.choice(E)
    mail(a["email"], rnd.choice(people)["email"], hm(rnd.randint(8, 18), rnd.randint(0, 59)),
         rnd.choice(["Мерекеңмен!", "Сәлем", "Кешке кездесейік"]), rnd.randint(2, 900))
for _ in range(15):  # басқа күндердегі үлкен хаттар
    a = rnd.choice(E)
    mail(a["email"], rnd.choice(people)["email"], hm(rnd.randint(8, 18), rnd.randint(0, 59)), "Фотолар", rnd.randint(6_000, 30_000),
         day=rnd.choice(["2026-04-11", "2026-04-13"]))
mails.sort(key=lambda r: r[3])
for i, r in enumerate(mails, 1):
    r[0] = i

# ---- станциялар мен пойыздар
stations = [[1, "Toretam", "Baikonur"], [2, "Kyzylorda", "Kyzylorda"], [3, "Aral Tenizi", "Aralsk"],
            [4, "Almaty-2", "Almaty"], [5, "Nurly Zhol", "Astana"], [6, "Aktobe-1", "Aktobe"], [7, "Turkistan", "Turkistan"]]
trains = [[1, "Т-82", 1, 3, f"{NEXT} 05:40"], [2, "Т-11", 1, 2, f"{NEXT} 07:15"], [3, "Т-35", 1, 5, f"{NEXT} 11:20"],
          [4, "Т-70", 1, 4, f"{NEXT} 18:05"], [5, "Т-09", 2, 1, f"{NEXT} 06:30"], [6, "Т-44", 1, 6, f"{DAY} 21:50"],
          [7, "Т-12", 1, 7, "2026-04-14 05:10"]]
tickets = []
for e in [thief] + train_fake:
    tickets.append([1, e["passport_number"], rnd.randint(1, 12), rnd.randint(1, 54)])
taken = {e["id"] for e in [thief] + train_fake}
for tid in range(2, 8):
    for e in rnd.sample([x for x in E if x["id"] not in taken], 7):
        tickets.append([tid, e["passport_number"], rnd.randint(1, 12), rnd.randint(1, 54)])

SCHEMA = """CREATE TABLE incident_reports (id INTEGER, date TEXT, building TEXT, description TEXT, PRIMARY KEY(id));
CREATE TABLE interviews (id INTEGER, name TEXT, date TEXT, transcript TEXT, PRIMARY KEY(id));
CREATE TABLE employees (id INTEGER, name TEXT, department TEXT, badge_id TEXT, email TEXT, passport_number INTEGER, PRIMARY KEY(id));
CREATE TABLE badge_scans (id INTEGER, badge_id TEXT, building TEXT, door TEXT, time TEXT, direction TEXT, PRIMARY KEY(id));
CREATE TABLE printer_jobs (id INTEGER, employee_id INTEGER, time TEXT, printer TEXT, pages INTEGER, file_name TEXT, PRIMARY KEY(id), FOREIGN KEY(employee_id) REFERENCES employees(id));
CREATE TABLE emails (id INTEGER, sender TEXT, recipient TEXT, time TEXT, subject TEXT, size_kb INTEGER, PRIMARY KEY(id));
CREATE TABLE people (id INTEGER, name TEXT, email TEXT, city TEXT, PRIMARY KEY(id));
CREATE TABLE stations (id INTEGER, name TEXT, city TEXT, PRIMARY KEY(id));
CREATE TABLE trains (id INTEGER, number TEXT, from_station_id INTEGER, to_station_id INTEGER, departure TEXT, PRIMARY KEY(id), FOREIGN KEY(from_station_id) REFERENCES stations(id), FOREIGN KEY(to_station_id) REFERENCES stations(id));
CREATE TABLE tickets (train_id INTEGER, passport_number INTEGER, car INTEGER, seat INTEGER, FOREIGN KEY(train_id) REFERENCES trains(id));
"""


def q(v):
    return "NULL" if v is None else str(v) if isinstance(v, (int, float)) else "'" + str(v).replace("'", "''") + "'"


def ins(t, rows):
    return "".join(f"INSERT INTO {t} VALUES ({', '.join(q(v) for v in r)});\n" for r in rows)


emp_rows = [[e["id"], e["name"], e["department"], e["badge_id"], e["email"], e["passport_number"]] for e in E]
ppl_rows = [[p["id"], p["name"], p["email"], p["city"]] for p in people]
sql = SCHEMA + ins("incident_reports", reports) + ins("interviews", interviews) + ins("employees", emp_rows) + \
      ins("badge_scans", scans) + ins("printer_jobs", jobs) + ins("emails", mails) + ins("people", ppl_rows) + \
      ins("stations", stations) + ins("trains", trains) + ins("tickets", tickets)

# ---- шешімді тексеру
db = sqlite3.connect(":memory:")
db.executescript(sql)
F = {
    "архив (кіру 14–15, шығу 16:00-ге дейін)": """id IN (SELECT e.id FROM employees e JOIN badge_scans i ON i.badge_id = e.badge_id
            JOIN badge_scans o ON o.badge_id = e.badge_id
            WHERE i.door = 'archive' AND i.direction = 'in' AND i.time BETWEEN '2026-04-12 14:00' AND '2026-04-12 15:00'
              AND o.door = 'archive' AND o.direction = 'out' AND o.time BETWEEN '2026-04-12 14:00' AND '2026-04-12 16:00')""",
    "принтер B-2 > 50 парақ": """id IN (SELECT employee_id FROM printer_jobs WHERE printer = 'B-2' AND time LIKE '2026-04-12%'
            GROUP BY employee_id HAVING SUM(pages) > 50)""",
    "сыртқа > 5 МБ хат": """email IN (SELECT sender FROM emails WHERE time LIKE '2026-04-12%' AND size_kb > 5000
            AND recipient NOT LIKE '%@baikonur.kz')""",
    "ертеңгі бірінші пойыз": """passport_number IN (SELECT passport_number FROM tickets WHERE train_id =
            (SELECT t.id FROM trains t JOIN stations s ON s.id = t.from_station_id
             WHERE s.name = 'Toretam' AND t.departure LIKE '2026-04-13%' ORDER BY t.departure LIMIT 1))""",
}
for label, cond in F.items():
    n = db.execute(f"SELECT COUNT(*) FROM employees WHERE {cond}").fetchone()[0]
    print(f"{label}: {n} күдікті")
    assert n >= 3, label
rows = db.execute("SELECT name FROM employees WHERE " + " AND ".join(F.values())).fetchall()
assert rows == [(thief["name"],)], rows
# Кез келген үш із бір адамнан көп қалдыруы керек (бір ізді өткізіп жіберуге болмайды)
from itertools import combinations
for combo in combinations(F, 3):
    n = db.execute("SELECT COUNT(*) FROM employees WHERE " + " AND ".join(F[k] for k in combo)).fetchone()[0]
    print("  ", " + ".join(c.split(" ")[0] for c in combo), "→", n)
    assert n >= 2, combo
city = db.execute("""SELECT s.city FROM trains t JOIN stations s ON s.id = t.to_station_id
                     WHERE t.from_station_id = 1 AND t.departure LIKE '2026-04-13%' ORDER BY t.departure LIMIT 1""").fetchone()[0]
acc = db.execute("""SELECT p.name FROM people p JOIN emails m ON m.recipient = p.email
                    WHERE m.sender = ? AND m.time LIKE '2026-04-12%' AND m.size_kb > 5000""", (thief["email"],)).fetchall()
assert acc == [(accomplice["name"],)], acc


def h(s):
    return hashlib.sha256(s.strip().lower().encode()).hexdigest()


out = {"sql": sql, "answers": {"thief": h(thief["name"]), "city": h(city), "accomplice": h(accomplice["name"])}}
(ROOT / "assets/data/mystery2.js").write_text(
    "// tools/make_mystery2.py арқылы жасалған. Барлық деректер ойдан шығарылған.\nwindow.CS50KZ_MYSTERY2 = " +
    json.dumps(out, ensure_ascii=False) + ";\n", encoding="utf-8")
print("Шешім тексерілді: бір ұры, бір қала, бір сыбайлас.", len(sql), "байт")
print("(жасырын)", thief["name"], "→", city, "| сыбайлас:", accomplice["name"])
