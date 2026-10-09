#!/usr/bin/env python3
"""7-аптаға арналған демо дерекқорлар (браузердегі SQLite үшін).

  python3 tools/make_demo_db.py   →   assets/data/db.js

favorites - лекциядағы Google Forms сауалнамасына ұқсас 272 жауап
            (сандары лекциямен бірдей: C 58, Python 190, Scratch 24).
shows     - IMDb дерекқорының шағын үлгісі (shows, ratings, genres,
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


def songs():
    """Songs тапсырмасына арналған ойдан шығарылған әншілер мен әндер."""
    artists = ["Dala Sazy", "Altyn Kun", "Kok Tobe Beats", "Aru Voice", "Nomad Echo", "Steppe Wind", "Qyzyl Tan"]
    titles = ["Steppe Morning", "Golden Road", "Night in Almaty", "Seven Rivers", "Blue Yurt", "Eagle Song",
              "Dombyra Dreams", "Silk Way", "Spring Rain", "Mountain Light", "Desert Stars", "City of Apples",
              "Wind of Sary-Arka", "First Snow", "Caspian Waves", "Summer Pasture", "Northern Lights", "Old Bazaar",
              "Shining Lake", "Long Way Home", "Morning Tea", "Hidden Valley", "Red Sunset", "Moonlit Steppe",
              "Fast Horses", "Quiet Village", "Endless Sky", "Dancing Flames"]
    rows = []
    for i, t in enumerate(titles, 1):
        a = rnd.randint(1, len(artists))
        if i in (5, 12, 19, 26):
            t += f" (feat. {artists[(a % len(artists))]})"
        rows.append((i, t, a, round(rnd.uniform(0.3, 0.95), 3), round(rnd.uniform(0.25, 0.95), 3), rnd.randint(0, 11),
                     round(rnd.uniform(-12, -3), 3), round(rnd.uniform(0.03, 0.4), 3), round(rnd.uniform(0.1, 0.95), 3),
                     round(rnd.uniform(70, 180), 3), rnd.randint(150000, 290000)))
    sql = """CREATE TABLE artists (id INTEGER, name TEXT, PRIMARY KEY(id));
CREATE TABLE songs (id INTEGER, name TEXT, artist_id INTEGER, danceability REAL, energy REAL, key INTEGER,
    loudness REAL, speechiness REAL, valence REAL, tempo REAL, duration_ms INTEGER);
"""
    sql += inserts("artists", ["id", "name"], list(enumerate(artists, 1))) + "\n"
    sql += inserts("songs", ["id", "name", "artist_id", "danceability", "energy", "key", "loudness",
                             "speechiness", "valence", "tempo", "duration_ms"], rows) + "\n"
    return sql


def movies():
    """Movies тапсырмасына арналған ойдан шығарылған фильмдер базасы."""
    r = random.Random(77)
    first = ["Aidos", "Aiganym", "Alisher", "Amina", "Anuar", "Ardak", "Arman", "Asem", "Ayan", "Baurzhan", "Diana",
             "Dinara", "Elnur", "Inkar", "Kanat", "Karina", "Laura", "Maksat", "Nazerke", "Nursultan", "Olzhas",
             "Raushan", "Sanzhar", "Timur", "Ulan", "Yerlan", "Zhansaya", "Zhanibek"]
    last = ["Abdrakhmanov", "Beisenov", "Dosov", "Ermukhanov", "Galimov", "Kenzhebek", "Mamyrov", "Nurgaliev",
            "Ospanov", "Rakhimov", "Saparov", "Temirov", "Ualiev", "Zhakupov"]
    people, names = [], set()
    pid = 100
    while len(people) < 70:
        n = f"{r.choice(first)} {r.choice(last)}"
        if n in names or n == "Arman Saparov":
            continue
        names.add(n); pid += r.randint(1, 40)
        people.append([pid, n, r.randint(1950, 2005)])
    # аттас екі актер: туған жылы бойынша ажыратылады
    bacon = [9001, "Arman Saparov", 1958]; people.append(bacon); people.append([9002, "Arman Saparov", 1991])
    star_a = [9101, "Aiganym Dosova", 1985]; star_b = [9102, "Kanat Mamyrov", 1979]; lead = [9103, "Dinara Ospanova", 1990]
    people += [star_a, star_b, lead]
    titles = ["Golden Eagle", "Silent Steppe", "The Last Nomad", "Apple City", "Wind over Charyn", "Night Train to Aral",
              "Little Yurt Story", "Snow Leopard", "The Silk Merchant", "Two Rivers", "Blue Mountains", "The Dombyra Maker",
              "Endless Road", "Moonlight Bazaar", "The Falconer", "Desert Rose", "Spring in Medeu", "City Lights of Astana",
              "The Old Well", "Red Tulips", "Shepherd's Song", "Iron Horse", "The Lost Caravan", "Morning Over Balkhash",
              "The Clockmaker", "Paper Kites", "Summer of 1986", "Northern Wind", "The Glass Bridge", "Seven Stars"]
    movies, mid = [], 1000
    for t in titles:
        mid += r.randint(3, 50)
        movies.append([mid, t, r.choice([2004, 2008, 2010, 2010, 2012, 2012, 2015, 2018, 2019, 2021, 2023])])
    saga = []
    for k, y in enumerate([2001, 2003, 2006, 2009], 1):
        mid += 7; saga.append([mid, f"Dala Batyrlary {k}", y]); movies.append(saga[-1])
    ratings = {m[0]: [round(r.uniform(5.0, 9.4), 1), r.randint(500, 90000)] for m in movies}
    for m in movies[2:4]:
        ratings[m[0]][0] = 10.0
    for m in movies[5:8]:
        ratings[m[0]][0] = round(r.uniform(9.0, 9.6), 1)
    actors = [p for p in people if p[0] < 9000]
    stars, directors = [], []
    for m in movies:
        for p in r.sample(actors, 4):
            stars.append([m[0], p[0]])
        directors.append([m[0], r.choice(actors[:20])[0]])
    def add(mi, p):
        if [movies[mi][0], p[0]] not in stars:
            stars.append([movies[mi][0], p[0]])
    for mi in (1, 4, 9, 13, 20):
        add(mi, bacon)                      # «Arman Saparov» (1958)
    add(9, [9002]); add(22, [9002])         # аттасы (1991)
    for mi in (3, 11, 17):
        add(mi, star_a); add(mi, star_b)    # екеуі бірге ойнаған фильмдер
    add(14, star_a); add(25, star_b)
    for mi in (0, 2, 5, 8, 12, 19, 27):
        add(mi, lead)                       # Dinara Ospanova: ең жоғары рейтингті 5 фильм
    sql = """CREATE TABLE movies (id INTEGER, title TEXT NOT NULL, year NUMERIC, PRIMARY KEY(id));
CREATE TABLE people (id INTEGER, name TEXT NOT NULL, birth NUMERIC, PRIMARY KEY(id));
CREATE TABLE stars (movie_id INTEGER NOT NULL, person_id INTEGER NOT NULL);
CREATE TABLE directors (movie_id INTEGER NOT NULL, person_id INTEGER NOT NULL);
CREATE TABLE ratings (movie_id INTEGER NOT NULL, rating REAL NOT NULL, votes INTEGER NOT NULL);
"""
    sql += inserts("movies", ["id", "title", "year"], movies) + "\n"
    sql += inserts("people", ["id", "name", "birth"], people) + "\n"
    sql += inserts("stars", ["movie_id", "person_id"], stars) + "\n"
    sql += inserts("directors", ["movie_id", "person_id"], directors) + "\n"
    sql += inserts("ratings", ["movie_id", "rating", "votes"], [[k] + v for k, v in ratings.items()]) + "\n"
    return sql


data = {"favorites": favorites(), "shows": shows(), "songs": songs(), "movies": movies()}
(ROOT / "assets/data/db.js").write_text(
    "// tools/make_demo_db.py арқылы жасалған. Қолмен өзгертпеңіз.\nwindow.CS50KZ_DB = Object.assign(window.CS50KZ_DB || {}, " +
    json.dumps(data, ensure_ascii=False) + ");\n", encoding="utf-8")
print({k: len(v) for k, v in data.items()})
