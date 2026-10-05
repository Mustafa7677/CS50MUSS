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
};
