// SQL тапсырмаларына арналған автотексеруші. Деректер ойдан шығарылған (tools/make_demo_db.py → songs).
window.CS50KZ_SQLCHECKS = {
  songs: {
    db: "songs",
    note: "Демо базадағы әншілер мен әндер ойдан шығарылған. Ресми тапсырмадағы әншілердің орнына мұнда Dala Sazy және Qyzyl Tan қолданылады, бірақ сұрау құрылымы бірдей.",
    tasks: [
      { f: "1.sql", t: "Барлық әннің атауы", ref: "SELECT name FROM songs;" },
      { f: "2.sql", t: "Барлық әннің атауы tempo бойынша өсу ретімен", ref: "SELECT name FROM songs ORDER BY tempo;" },
      { f: "3.sql", t: "Ең ұзын 5 әннің атауы (ұзақтығы бойынша кему ретімен)", ref: "SELECT name FROM songs ORDER BY duration_ms DESC LIMIT 5;" },
      { f: "4.sql", t: "danceability, energy және valence мәндерінің бәрі 0.75-тен жоғары әндердің атауы", ref: "SELECT name FROM songs WHERE danceability > 0.75 AND energy > 0.75 AND valence > 0.75;" },
      { f: "5.sql", t: "Барлық әннің орташа energy мәні", ref: "SELECT AVG(energy) FROM songs;" },
      { f: "6.sql", t: "«Dala Sazy» әншісінің әндері (ID-ді қолмен жазбаңыз!)", ref: "SELECT name FROM songs WHERE artist_id = (SELECT id FROM artists WHERE name = 'Dala Sazy');" },
      { f: "7.sql", t: "«Qyzyl Tan» әншісі әндерінің орташа energy мәні", ref: "SELECT AVG(energy) FROM songs WHERE artist_id = (SELECT id FROM artists WHERE name = 'Qyzyl Tan');" },
      { f: "8.sql", t: "Басқа әншілер қатысқан әндердің атауы (атауында «feat.» бар)", ref: "SELECT name FROM songs WHERE name LIKE '%feat.%';" },
    ],
  },
  movies: {
    db: "movies",
    note: "Демо базадағы фильмдер, актерлер мен режиссерлер ойдан шығарылған. Ресми тапсырмадағы атаулардың орнына: «Little Yurt Story», «Dala Batyrlary» сериясы, Aiganym Dosova, Kanat Mamyrov, Dinara Ospanova және аттас екі Arman Saparov (1958 және 1991).",
    tasks: [
      { f: "1.sql", t: "2008 жылы шыққан фильмдердің атаулары", ref: "SELECT title FROM movies WHERE year = 2008;" },
      { f: "2.sql", t: "Aiganym Dosova-ның туған жылы", ref: "SELECT birth FROM people WHERE name = 'Aiganym Dosova';" },
      { f: "3.sql", t: "2018 жылдан бастап (2018-ді қоса) шыққан фильмдер, әліпби ретімен", ref: "SELECT title FROM movies WHERE year >= 2018 ORDER BY title;" },
      { f: "4.sql", t: "Рейтингі 10.0 фильмдер саны", ref: "SELECT COUNT(*) FROM ratings WHERE rating = 10.0;" },
      { f: "5.sql", t: "«Dala Batyrlary» сериясының атаулары мен жылдары, жыл бойынша", ref: "SELECT title, year FROM movies WHERE title LIKE 'Dala Batyrlary%' ORDER BY year;" },
      { f: "6.sql", t: "2012 жылғы фильмдердің орташа рейтингі", ref: "SELECT AVG(rating) FROM ratings WHERE movie_id IN (SELECT id FROM movies WHERE year = 2012);" },
      { f: "7.sql", t: "2010 жылғы фильмдер мен рейтингтері: рейтинг бойынша кему ретімен, тең болса атауы бойынша", ref: "SELECT title, rating FROM movies JOIN ratings ON movies.id = ratings.movie_id WHERE year = 2010 ORDER BY rating DESC, title;" },
      { f: "8.sql", t: "«Little Yurt Story» фильмінде ойнаған адамдардың аттары", ref: "SELECT name FROM people WHERE id IN (SELECT person_id FROM stars WHERE movie_id = (SELECT id FROM movies WHERE title = 'Little Yurt Story'));" },
      { f: "9.sql", t: "2004 жылғы фильмдерде ойнаған адамдар, туған жылы бойынша (әр адам бір рет)", ref: "SELECT name FROM people WHERE id IN (SELECT DISTINCT person_id FROM stars WHERE movie_id IN (SELECT id FROM movies WHERE year = 2004)) ORDER BY birth;" },
      { f: "10.sql", t: "Рейтингі 9.0 және одан жоғары фильмдердің режиссерлері", ref: "SELECT name FROM people WHERE id IN (SELECT person_id FROM directors WHERE movie_id IN (SELECT movie_id FROM ratings WHERE rating >= 9.0));" },
      { f: "11.sql", t: "Dinara Ospanova ойнаған ең жоғары рейтингті 5 фильм", ref: "SELECT title FROM movies JOIN stars ON movies.id = stars.movie_id JOIN people ON people.id = stars.person_id JOIN ratings ON movies.id = ratings.movie_id WHERE name = 'Dinara Ospanova' ORDER BY rating DESC LIMIT 5;" },
      { f: "12.sql", t: "Aiganym Dosova мен Kanat Mamyrov бірге ойнаған фильмдер", ref: "SELECT title FROM movies WHERE id IN (SELECT movie_id FROM stars WHERE person_id = (SELECT id FROM people WHERE name = 'Aiganym Dosova')) AND id IN (SELECT movie_id FROM stars WHERE person_id = (SELECT id FROM people WHERE name = 'Kanat Mamyrov'));" },
      { f: "13.sql", t: "Arman Saparov (1958 ж.т.) бірге ойнаған адамдар (өзінен басқа)", ref: "SELECT DISTINCT name FROM people WHERE id IN (SELECT person_id FROM stars WHERE movie_id IN (SELECT movie_id FROM stars WHERE person_id = (SELECT id FROM people WHERE name = 'Arman Saparov' AND birth = 1958))) AND id != (SELECT id FROM people WHERE name = 'Arman Saparov' AND birth = 1958);" },
    ],
  },
};
