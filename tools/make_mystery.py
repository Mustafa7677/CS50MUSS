#!/usr/bin/env python3
"""«Алтын домбыраның құпиясы» — SQL детектив ойынының деректері.

Барлық кейіпкерлер, оқиғалар мен деректер ойдан шығарылған.
  python3 tools/make_mystery.py  →  assets/data/mystery.js
Генератор шешімнің біреу ғана екенін өзі тексереді.
"""
import hashlib
import json
import random
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
rnd = random.Random(321)
Y, M, D = 2026, 3, 21  # Наурыз мейрамы

FIRST = ["Aibek", "Aigerim", "Akzhol", "Alibek", "Almas", "Arman", "Aruzhan", "Asel", "Askar", "Ayala", "Azamat",
         "Baglan", "Bakhyt", "Bauyrzhan", "Dana", "Daniyar", "Dariga", "Dauren", "Dilnaz", "Erlan", "Ermek",
         "Gaukhar", "Gulnar", "Ilyas", "Kairat", "Kamila", "Madina", "Marat", "Meruert", "Nurlan", "Nurzhan",
         "Rustem", "Sabina", "Saule", "Serik", "Symbat", "Talgat", "Temirlan", "Tomiris", "Yerzhan", "Zarina", "Zhanar"]
LAST = ["Abenov", "Akhmetov", "Baimukhanov", "Dzhaksybekov", "Ermekov", "Iskakov", "Kassymov", "Mukanov",
        "Nurpeisov", "Omarov", "Sadykov", "Seitkali", "Taszhanov", "Utepov", "Zhumabayev"]

def plate():
    return f"{rnd.randint(100, 999)}{rnd.choice('ABCEHKMOPTXY')}{rnd.choice('ABCEHKMOPTXY')}{rnd.choice('ABCEHKMOPTXY')}{rnd.randint(1, 18):02d}"

# ---- адамдар
people, used = [], set()
for pid in range(1, 121):
    while True:
        name = f"{rnd.choice(FIRST)} {rnd.choice(LAST)}"
        if name not in used:
            used.add(name); break
    phone = f"+7 70{rnd.randint(0, 9)} {rnd.randint(100, 999)} {rnd.randint(10, 99)} {rnd.randint(10, 99)}"
    passport = rnd.randint(10_000_000, 99_999_999)
    people.append([pid, name, phone, passport, plate() if rnd.random() < 0.8 else None])
P = {p[0]: p for p in people}
car = [p for p in people if p[4]]

# ---- рөлдер
thief = car[7]; accomplice = people[63]
fake = car[12:20]            # тұрақтан сол уақытта шыққан басқалар
atm_fake = car[15:19] + [people[90], people[91], people[92]]  # банкоматтан ақша алған басқалар
call_fake = car[16:18]       # сол күні қысқа қоңырау шалған басқалар
flight_fake = [car[18], people[95], people[96], people[97]]   # ертеңгі ең ерте рейстегі басқалар (car[18] — үш сүзгіден өтетін «алдамшы» күдікті)

# ---- қылмыс есептері
streets = ["Abai Street", "Tole Bi Street", "Dostyk Avenue", "Satpayev Street", "Zhibek Zholy Street"]
crimes = [[1, Y, M, D, "Abai Street",
           "Алтын домбыра Абай көшесіндегі мұражайдан сағат 10:15-те ұрланды. Бүгін үш куәмен сұхбат алынды, үшеуі де мұражайды атап өтті."],
          [2, Y, M, D, "Dostyk Avenue", "Сағат 16:40-та Достық даңғылындағы кафеде тамақ ішілді, бірақ ақшасы төленбеді. Куә жоқ."]]
cid = 3
for _ in range(40):
    d = rnd.randint(1, 31); m = rnd.choice([1, 2, 3, 4])
    if (m, d) == (M, D) or (m == 2 and d > 28) or (m == 4 and d > 30):
        continue
    crimes.append([cid, Y, m, d, rnd.choice(streets), rnd.choice([
        "Велосипед ұрланды. Куә жоқ.", "Бақшадағы алма ағашы түнде сындырылды.", "Дүкеннің терезесі сынды. Куә жоқ.",
        "Жоғалған мысық табылды, иесі қуанышты.", "Көшедегі шамдар сөніп қалды. Электриктер шақырылды."])]); cid += 1

# ---- сұхбаттар
interviews = [
    [1, "Gulnar Omarova", Y, M, D, "Ұрлықтан кейін он минут ішінде ұрының мұражай тұрағындағы көлікке отырып кеткенін көрдім. Тұрақ камерасының жазбасын қарасаңыздар, сол уақытта шыққан көліктер көрінеді."],
    [2, "Askar Iskakov", Y, M, D, "Ұрыны танимын, бірақ атын білмеймін. Бүгін таңертең, мұражайға келерден бұрын, Төле би көшесіндегі банкоматтан ақша шешіп алып жатқанын көрдім."],
    [3, "Madina Sadykova", Y, M, D, "Ұры мұражайдан шығып бара жатып біреуге телефон соқты, бір минуттан аз сөйлесті. Ертең Алмалыдан ең ерте рейспен ұшатынын айтты да, телефондағы адамнан билет сатып алуды сұрады."],
    [4, "Dauren Kassymov", Y, M, D, "Мен тек наурыз көже ішкенім есімде. Ештеңе көрмедім, кешіріңіз!"],
    [5, "Saule Nurpeisova", Y, M, 14, "Кеше дүкенге барғанда терезенің сынып жатқанын көрдім."],
]

# ---- тұрақ журналы
parking, lid = [], 1
def log(h, m, act, pl):
    global lid
    parking.append([lid, Y, M, D, h, m, act, pl]); lid += 1
for p in car[:40]:
    h = rnd.randint(7, 9); log(h, rnd.randint(0, 59), "entrance", p[4])
for p in [thief] + fake:
    log(rnd.randint(8, 9), rnd.randint(0, 59), "entrance", p[4])
log(10, 16, "exit", thief[4])
for k, p in enumerate(fake):
    log(10, rnd.randint(15, 25), "exit", p[4])
for p in car[:40]:
    if p not in fake and p is not thief:
        log(rnd.choice([11, 12, 13, 14, 15, 16]), rnd.randint(0, 59), "exit", p[4])
parking.sort(key=lambda r: (r[4], r[5]))
for i, r in enumerate(parking, 1):
    r[0] = i

# ---- банк шоттары және банкомат
accounts = {p[0]: rnd.randint(10_000_000, 99_999_999) for p in people}
bank = [[accounts[pid], pid, rnd.randint(2008, 2025)] for pid in accounts]
atm, aid = [], 1
for p in [thief] + atm_fake:
    atm.append([aid, accounts[p[0]], Y, M, D, "Tole Bi Street", "withdraw", rnd.randint(5, 80) * 1000]); aid += 1
for p in rnd.sample(people, 30):
    if p in [thief] + atm_fake:
        continue
    atm.append([aid, accounts[p[0]], Y, M, D, rnd.choice(["Tole Bi Street", "Abai Street", "Dostyk Avenue"]),
                "deposit" if rnd.random() < 0.6 else "withdraw", rnd.randint(1, 50) * 1000]); aid += 1
for p in rnd.sample(people, 30):
    atm.append([aid, accounts[p[0]], Y, M, rnd.choice([19, 20, 22]), "Tole Bi Street", "withdraw", rnd.randint(1, 50) * 1000]); aid += 1
# ---- қоңыраулар
calls, qid = [], 1
calls.append([qid, thief[2], accomplice[2], Y, M, D, 43]); qid += 1
for p in call_fake:
    calls.append([qid, p[2], rnd.choice(people)[2], Y, M, D, rnd.randint(20, 58)]); qid += 1
for _ in range(60):
    a, b = rnd.sample(people, 2)
    calls.append([qid, a[2], b[2], Y, M, rnd.choice([D, D, 20, 22]), rnd.randint(61, 600)]); qid += 1
for _ in range(10):
    a, b = rnd.sample(people, 2)
    calls.append([qid, a[2], b[2], Y, M, 20, rnd.randint(10, 59)]); qid += 1

# ---- әуежайлар мен рейстер
airports = [[1, "AML", "Almaly Regional Airport", "Almaly"], [2, "NQZ", "Astana International Airport", "Astana"],
            [3, "CIT", "Shymkent International Airport", "Shymkent"], [4, "SCO", "Aktau International Airport", "Aktau"],
            [5, "IST", "Istanbul Airport", "Istanbul"], [6, "TAS", "Tashkent International Airport", "Tashkent"],
            [7, "GUW", "Atyrau Airport", "Atyrau"]]
flights = [[1, 1, 4, Y, M, 22, 7, 45], [2, 1, 2, Y, M, 22, 9, 30], [3, 1, 5, Y, M, 22, 13, 10], [4, 1, 3, Y, M, 22, 16, 0],
           [5, 2, 1, Y, M, 22, 8, 20], [6, 1, 6, Y, M, 21, 18, 30], [7, 1, 2, Y, M, 23, 6, 50], [8, 7, 1, Y, M, 22, 11, 15]]
passengers = []
def seat():
    return f"{rnd.randint(1, 30)}{rnd.choice('ABCDEF')}"
for p in [thief] + flight_fake:
    passengers.append([1, p[3], seat()])
taken = {p[0] for p in [thief] + flight_fake}
for fid in range(2, 9):
    for p in rnd.sample([x for x in people if x[0] not in taken], 6):
        passengers.append([fid, p[3], seat()])

SCHEMA = """CREATE TABLE crime_scene_reports (id INTEGER, year INTEGER, month INTEGER, day INTEGER, street TEXT, description TEXT, PRIMARY KEY(id));
CREATE TABLE interviews (id INTEGER, name TEXT, year INTEGER, month INTEGER, day INTEGER, transcript TEXT, PRIMARY KEY(id));
CREATE TABLE museum_parking_logs (id INTEGER, year INTEGER, month INTEGER, day INTEGER, hour INTEGER, minute INTEGER, activity TEXT, license_plate TEXT, PRIMARY KEY(id));
CREATE TABLE atm_transactions (id INTEGER, account_number INTEGER, year INTEGER, month INTEGER, day INTEGER, atm_location TEXT, transaction_type TEXT, amount INTEGER, PRIMARY KEY(id));
CREATE TABLE bank_accounts (account_number INTEGER, person_id INTEGER, creation_year INTEGER, FOREIGN KEY(person_id) REFERENCES people(id));
CREATE TABLE phone_calls (id INTEGER, caller TEXT, receiver TEXT, year INTEGER, month INTEGER, day INTEGER, duration INTEGER, PRIMARY KEY(id));
CREATE TABLE people (id INTEGER, name TEXT, phone_number TEXT, passport_number INTEGER, license_plate TEXT, PRIMARY KEY(id));
CREATE TABLE airports (id INTEGER, abbreviation TEXT, full_name TEXT, city TEXT, PRIMARY KEY(id));
CREATE TABLE flights (id INTEGER, origin_airport_id INTEGER, destination_airport_id INTEGER, year INTEGER, month INTEGER, day INTEGER, hour INTEGER, minute INTEGER, PRIMARY KEY(id));
CREATE TABLE passengers (flight_id INTEGER, passport_number INTEGER, seat TEXT, FOREIGN KEY(flight_id) REFERENCES flights(id));
"""

def q(v):
    return "NULL" if v is None else str(v) if isinstance(v, (int, float)) else "'" + str(v).replace("'", "''") + "'"

def ins(t, rows):
    return "".join(f"INSERT INTO {t} VALUES ({', '.join(q(v) for v in r)});\n" for r in rows)

sql = SCHEMA + ins("crime_scene_reports", crimes) + ins("interviews", interviews) + ins("museum_parking_logs", parking) + \
      ins("atm_transactions", atm) + ins("bank_accounts", bank) + ins("phone_calls", calls) + ins("people", people) + \
      ins("airports", airports) + ins("flights", flights) + ins("passengers", passengers)

# ---- шешімді тексеру: тек бір адам қалуы керек
db = sqlite3.connect(":memory:"); db.executescript(sql)
rows = db.execute("""
SELECT name FROM people
WHERE license_plate IN (SELECT license_plate FROM museum_parking_logs WHERE year=2026 AND month=3 AND day=21
                         AND hour=10 AND minute BETWEEN 15 AND 25 AND activity='exit')
AND id IN (SELECT person_id FROM bank_accounts WHERE account_number IN
           (SELECT account_number FROM atm_transactions WHERE year=2026 AND month=3 AND day=21
            AND atm_location='Tole Bi Street' AND transaction_type='withdraw'))
AND phone_number IN (SELECT caller FROM phone_calls WHERE year=2026 AND month=3 AND day=21 AND duration < 60)
AND passport_number IN (SELECT passport_number FROM passengers WHERE flight_id =
           (SELECT id FROM flights WHERE year=2026 AND month=3 AND day=22 AND origin_airport_id =
              (SELECT id FROM airports WHERE city='Almaly') ORDER BY hour, minute LIMIT 1))""").fetchall()
assert rows == [(thief[1],)], rows
city = db.execute("SELECT city FROM airports WHERE id = (SELECT destination_airport_id FROM flights WHERE id = 1)").fetchone()[0]
acc = db.execute("SELECT name FROM people WHERE phone_number = (SELECT receiver FROM phone_calls WHERE caller = ? AND day = 21 AND duration < 60)", (thief[2],)).fetchall()
assert acc == [(accomplice[1],)], acc
# әр сүзгі жеке-жеке бірнеше күдікті қалдыруы керек (ойын қызық болуы үшін)
for label, cond in [("тұрақ", "license_plate IN (SELECT license_plate FROM museum_parking_logs WHERE day=21 AND hour=10 AND minute BETWEEN 15 AND 25 AND activity='exit')"),
                    ("банкомат", "id IN (SELECT person_id FROM bank_accounts WHERE account_number IN (SELECT account_number FROM atm_transactions WHERE day=21 AND atm_location='Tole Bi Street' AND transaction_type='withdraw'))")]:
    print(label, db.execute(f"SELECT COUNT(*) FROM people WHERE {cond}").fetchone()[0], "күдікті")

def h(s):
    return hashlib.sha256(s.strip().lower().encode()).hexdigest()

out = {"sql": sql, "answers": {"thief": h(thief[1]), "city": h(city), "accomplice": h(accomplice[1])}}
(ROOT / "assets/data/mystery.js").write_text(
    "// tools/make_mystery.py арқылы жасалған. Барлық деректер ойдан шығарылған.\nwindow.CS50KZ_MYSTERY = " +
    json.dumps(out, ensure_ascii=False) + ";\n", encoding="utf-8")
print("Шешім тексерілді: бір ұры, бір қала, бір сыбайлас.", len(sql), "байт")
print("(жасырын) ", thief[1], "→", city, "| сыбайлас:", accomplice[1])
