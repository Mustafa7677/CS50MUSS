#!/usr/bin/env python3
"""7-аптаға арналған демо дерекқорлар (браузердегі SQLite үшін).

  python3 tools/make_demo_db.py   →   assets/data/db.js

favorites — лекциядағы Google Forms сауалнамасына ұқсас 272 жауап
            (сандары лекциямен бірдей: C 58, Python 190, Scratch 24).
shows     — IMDb дерекқорының шағын үлгісі (shows, ratings, genres,
            people, stars). Бұл оқуға арналған демо деректер, толық база емес.
"""
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
rnd = random.Random(50)


def q(v):
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def inserts(table, cols, rows):
    out = []
    for i in range(0, len(rows), 200):
        chunk = rows[i:i + 200]
        out.append(f"INSERT INTO {table} ({', '.join(cols)}) VALUES\n" +
                   ",\n".join("(" + ", ".join(q(v) for v in r) + ")" for r in chunk) + ";")
    return "\n".join(out)


def favorites():
    problems = {
        "C": ["Hello, World", "Mario", "Cash", "Credit", "Scrabble", "Readability", "Caesar",
              "Substitution", "Plurality", "Runoff", "Tideman", "Filter", "Recover", "Speller"],
        "Python": ["Hello, World", "Mario", "Cash", "Readability", "DNA", "Hello, It's Me",
                   "Sentimental", "Credit", "Filter", "Speller", "Tideman", "Recover"],
        "Scratch": ["Scratch", "Hello, World", "Mario"],
    }
    rows = []
    t = datetime(2026, 10, 27, 13, 30, 0)
    langs = ["C"] * 58 + ["Python"] * 190 + ["Scratch"] * 24
    rnd.shuffle(langs)
    for lang in langs:
        t += timedelta(seconds=rnd.randint(1, 9))
        rows.append((t.strftime("%m/%d/%Y %H:%M:%S"), lang, rnd.choice(problems[lang])))
    return ("CREATE TABLE favorites (\"Timestamp\" TEXT, language TEXT, problem TEXT);\n" +
            inserts("favorites", ["\"Timestamp\"", "language", "problem"], rows))


def shows():
    S = [  # id, title, year, episodes, rating, votes, genres
        (386676, "The Office", 2005, 188, 9.0, 760000, ["Comedy"]),
        (290978, "The Office", 2001, 14, 8.5, 175000, ["Comedy"]),
        (63881, "Catweazle", 1970, 26, 7.8, 900, ["Adventure", "Comedy", "Family"]),
        (108778, "Friends", 1994, 235, 8.9, 1100000, ["Comedy", "Romance"]),
        (903747, "Breaking Bad", 2008, 62, 9.5, 2200000, ["Crime", "Drama", "Thriller"]),
        (944947, "Game of Thrones", 2011, 73, 9.2, 2300000, ["Action", "Adventure", "Drama"]),
        (96697, "The Simpsons", 1989, 780, 8.7, 430000, ["Animation", "Comedy"]),
        (1475582, "Sherlock", 2010, 15, 9.1, 990000, ["Crime", "Drama", "Mystery"]),
        (4574334, "Stranger Things", 2016, 42, 8.7, 1400000, ["Drama", "Fantasy", "Horror"]),
        (2861424, "Rick and Morty", 2013, 81, 9.1, 610000, ["Animation", "Adventure", "Comedy"]),
        (1266020, "Parks and Recreation", 2009, 125, 8.6, 300000, ["Comedy"]),
        (2467372, "Brooklyn Nine-Nine", 2013, 153, 8.4, 360000, ["Comedy", "Crime"]),
        (1520211, "The Walking Dead", 2010, 177, 8.1, 1100000, ["Drama", "Horror", "Thriller"]),
        (98904, "Seinfeld", 1989, 173, 8.9, 350000, ["Comedy"]),
        (7366338, "Chernobyl", 2019, 5, 9.3, 900000, ["Drama", "History", "Thriller"]),
        (5753856, "Dark", 2017, 26, 8.7, 470000, ["Crime", "Drama", "Mystery"]),
        (2442560, "Peaky Blinders", 2013, 36, 8.8, 690000, ["Crime", "Drama"]),
        (475784, "Westworld", 2016, 36, 8.5, 530000, ["Drama", "Mystery", "Sci-Fi"]),
        (3032476, "Better Call Saul", 2015, 63, 9.0, 650000, ["Crime", "Drama"]),
        (106179, "The X-Files", 1993, 218, 8.6, 230000, ["Crime", "Drama", "Mystery"]),
        (1439629, "Community", 2009, 110, 8.5, 270000, ["Comedy"]),
        (3398228, "BoJack Horseman", 2014, 77, 8.8, 190000, ["Animation", "Comedy", "Drama"]),
        (412142, "House", 2004, 177, 8.7, 500000, ["Drama", "Mystery"]),
        (9140554, "Loki", 2021, 12, 8.2, 380000, ["Action", "Adventure", "Fantasy"]),
    ]
    P = [  # id, name, birth
        (136797, "Steve Carell", 1962), (933988, "Rainn Wilson", 1966), (1024677, "John Krasinski", 1979),
        (278979, "Jenna Fischer", 1974), (1069213, "Mindy Kaling", 1979), (1250791, "Ed Helms", 1974),
        (5491, "Ricky Gervais", 1961), (293509, "Martin Freeman", 1971), (552975, "Mackenzie Crook", 1971),
        (1734, "Jennifer Aniston", 1969), (1002, "Matthew Perry", 1969), (1612, "Courteney Cox", 1964),
        (186505, "Bryan Cranston", 1956), (348152, "Aaron Paul", 1979), (606487, "Bob Odenkirk", 1962),
        (3592338, "Emilia Clarke", 1986), (227759, "Peter Dinklage", 1969), (1983, "Kit Harington", 1986),
        (1212722, "Benedict Cumberbatch", 1976), (4880, "Dan Castellaneta", 1957), (4044, "Julie Kavner", 1950),
        (1065, "Jerry Seinfeld", 1954), (1055, "Julia Louis-Dreyfus", 1961), (2, "Amy Poehler", 1971),
        (3, "Nick Offerman", 1970), (4, "Andy Samberg", 1978), (5, "Andre Braugher", 1962),
        (6, "Millie Bobby Brown", 2004), (7, "David Harbour", 1975), (8, "Justin Roiland", 1980),
        (9, "Andrew Lincoln", 1973), (10, "Jared Harris", 1961), (11, "Louis Hofmann", 1997),
        (12, "Cillian Murphy", 1976), (13, "Evan Rachel Wood", 1987), (14, "David Duchovny", 1960),
        (15, "Gillian Anderson", 1968), (16, "Joel McHale", 1971), (17, "Will Arnett", 1970),
        (18, "Hugh Laurie", 1959), (19, "Tom Hiddleston", 1981), (20, "Owen Wilson", 1968),
        (21, "Kevin Bacon", 1958), (22, "Chris Pratt", 1979),
    ]
    C = {  # show id -> people ids
        386676: [136797, 933988, 1024677, 278979, 1069213, 1250791],
        290978: [5491, 293509, 552975],
        108778: [1734, 1002, 1612], 903747: [186505, 348152, 606487],
        944947: [3592338, 227759, 1983], 96697: [4880, 4044], 1475582: [1212722, 293509],
        4574334: [6, 7], 2861424: [8], 1266020: [2, 3, 22], 2467372: [4, 5],
        1520211: [9], 98904: [1065, 1055], 7366338: [10], 5753856: [11], 2442560: [12],
        475784: [13], 3032476: [606487], 106179: [14, 15], 1439629: [16],
        3398228: [17], 412142: [18], 9140554: [19, 20],
    }
    sql = """CREATE TABLE shows (
    id INTEGER,
    title TEXT NOT NULL,
    year NUMERIC,
    episodes INTEGER,
    PRIMARY KEY(id)
);
CREATE TABLE ratings (
    show_id INTEGER NOT NULL UNIQUE,
    rating REAL NOT NULL,
    votes INTEGER NOT NULL,
    FOREIGN KEY(show_id) REFERENCES shows(id)
);
CREATE TABLE genres (
    show_id INTEGER NOT NULL,
    genre TEXT NOT NULL,
    FOREIGN KEY(show_id) REFERENCES shows(id)
);
CREATE TABLE people (
    id INTEGER,
    name TEXT NOT NULL,
    birth NUMERIC,
    PRIMARY KEY(id)
);
CREATE TABLE stars (
    show_id INTEGER NOT NULL,
    person_id INTEGER NOT NULL,
    FOREIGN KEY(show_id) REFERENCES shows(id),
    FOREIGN KEY(person_id) REFERENCES people(id)
);
"""
    sql += inserts("shows", ["id", "title", "year", "episodes"], [s[:4] for s in S]) + "\n"
    sql += inserts("ratings", ["show_id", "rating", "votes"], [(s[0], s[4], s[5]) for s in S]) + "\n"
    sql += inserts("genres", ["show_id", "genre"], [(s[0], g) for s in S for g in s[6]]) + "\n"
    sql += inserts("people", ["id", "name", "birth"], P) + "\n"
    sql += inserts("stars", ["show_id", "person_id"], [(k, p) for k, v in C.items() for p in v]) + "\n"
    return sql


data = {"favorites": favorites(), "shows": shows()}
(ROOT / "assets/data/db.js").write_text(
    "// tools/make_demo_db.py арқылы жасалған. Қолмен өзгертпеңіз.\nwindow.CS50KZ_DB = " +
    json.dumps(data, ensure_ascii=False) + ";\n", encoding="utf-8")
print({k: len(v) for k, v in data.items()})
