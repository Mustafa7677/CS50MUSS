"""Алаш тұлғаларының портреттерін Wikimedia Commons-тан жүктейді (GitHub Actions-та іске қосылады).

Тек еркін лицензиялы суреттер алынады (Public domain, CC0, CC BY, CC BY-SA). Әр сурет үшін
авторы, лицензиясы және дерек көзі assets/data/portraits.js файлына жазылады.
Сурет 320×400 JPEG-ке кесіледі (бет жоғарғы жағында болғандықтан, жоғарыдан қиылады).
"""
import io, json, re, sys, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/img/alash"
UA = {"User-Agent": "CS50-kazakh-site/1.0 (https://github.com/Mustafa7677/CS50MUSS)"}
PEOPLE = [  # (сайттағы аты, файл атауы, ru.wikipedia мақаласы)
    ("Әлихан Бөкейхан", "bokeikhan", "Букейханов, Алихан Нурмухамедович"),
    ("Ахмет Байтұрсынұлы", "baitursynuly", "Байтурсынов, Ахмет"),
    ("Міржақып Дулатұлы", "dulatuly", "Дулатов, Миржакип"),
    ("Мағжан Жұмабаев", "zhumabayev", "Жумабаев, Магжан"),
    ("Жүсіпбек Аймауытұлы", "aimauytuly", "Аймауытов, Жусипбек"),
    ("Сұлтанмахмұт Торайғыров", "toraighyrov", "Торайгыров, Султанмахмут"),
    ("Ыбырай Алтынсарин", "altynsarin", "Алтынсарин, Ибрай"),
    ("Абай Құнанбайұлы", "abai", "Абай Кунанбаев"),
]
FREE = re.compile(r"public domain|^pd|cc0|cc[- ]by(-sa)?( |$|-)", re.I)


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return r.read()


def api(host, **params):
    params.update(format="json", formatversion="2")
    return json.loads(get(f"https://{host}/w/api.php?" + urllib.parse.urlencode(params)))


def page_image(title):
    for p in api("ru.wikipedia.org", action="query", titles=title, redirects=1, prop="pageimages", piprop="name")["query"]["pages"]:
        if p.get("pageimage"):
            return p["pageimage"]
    hits = api("ru.wikipedia.org", action="query", generator="search", gsrsearch=title, gsrlimit=1, prop="pageimages", piprop="name")
    for p in hits.get("query", {}).get("pages", []):
        if p.get("pageimage"):
            return p["pageimage"]
    return None


def strip(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html or "")).strip()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}
    for name, slug, title in PEOPLE:
        try:
            fname = page_image(title)
            if not fname:
                print(f"✗ {name}: сурет жоқ"); continue
            info = api("commons.wikimedia.org", action="query", titles="File:" + fname, prop="imageinfo",
                       iiprop="url|extmetadata", iiurlwidth="480")["query"]["pages"][0]
            if "imageinfo" not in info:  # Commons-та емес (жергілікті, еркін емес болуы мүмкін)
                print(f"✗ {name}: {fname} Commons-та жоқ"); continue
            ii = info["imageinfo"][0]
            em = ii.get("extmetadata", {})
            lic = strip(em.get("LicenseShortName", {}).get("value", ""))
            if not FREE.search(lic):
                print(f"✗ {name}: лицензия еркін емес ({lic})"); continue
            img = Image.open(io.BytesIO(get(ii.get("thumburl") or ii["url"]))).convert("RGB")
            w, h = img.size
            tw = min(w, int(h * 0.8))  # 4:5 пропорция, жоғарыдан
            th = int(tw / 0.8)
            img = img.crop(((w - tw) // 2, 0, (w - tw) // 2 + tw, min(h, th))).resize((320, 400), Image.LANCZOS)
            img.save(OUT / f"{slug}.jpg", "JPEG", quality=82, optimize=True, progressive=True)
            meta[name] = {
                "img": f"assets/img/alash/{slug}.jpg",
                "license": lic,
                "artist": strip(em.get("Artist", {}).get("value", ""))[:120] or "белгісіз",
                "src": ii.get("descriptionurl", ""),
            }
            print(f"✓ {name}: {fname} ({lic})")
        except Exception as e:  # бір тұлға үшін қате — қалғандарын жалғастырамыз
            print(f"✗ {name}: {e}")
    (ROOT / "assets/data/portraits.js").write_text(
        "// tools/fetch_portraits.py жасаған (Wikimedia Commons, еркін лицензиялар). Қолмен өзгертпеңіз.\n"
        "window.CS50KZ_PORTRAITS = " + json.dumps(meta, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(f"{len(meta)} / {len(PEOPLE)} портрет")
    return 0 if meta else 1


if __name__ == "__main__":
    sys.exit(main())
