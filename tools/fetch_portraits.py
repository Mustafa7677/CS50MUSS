"""Алаш тұлғаларының портреттерін Wikimedia Commons-тан жүктейді (GitHub Actions-та іске қосылады).

Тек еркін лицензиялы суреттер алынады (Public domain, CC0, CC BY, CC BY-SA). Әр сурет үшін
авторы, лицензиясы және дерек көзі assets/data/portraits.js файлына жазылады.
Сурет бетті тауып (OpenCV), соның айналасынан 320×400 JPEG-ке кесіледі; маркалар мен ескерткіштер өткізілмейді.
"""
import io, json, re, sys, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/img/alash"
UA = {"User-Agent": "CS50-kazakh-site/1.0 (https://github.com/Mustafa7677/CS50MUSS)"}
PEOPLE = [  # (сайттағы аты, файл атауы, ru / en мақаласы)
    ("Әлихан Бөкейхан", "bokeikhan", "Букейханов, Алихан Нурмухамедович", "Alikhan Bukeikhanov"),
    ("Ахмет Байтұрсынұлы", "baitursynuly", "Байтурсынов, Ахмет", "Akhmet Baitursynuly"),
    ("Міржақып Дулатұлы", "dulatuly", "Дулатов, Миржакип", "Mirjaqip Dulatuli"),
    ("Мағжан Жұмабаев", "zhumabayev", "Жумабаев, Магжан", "Magzhan Zhumabayev"),
    ("Жүсіпбек Аймауытұлы", "aimauytuly", "Аймауытов, Жусупбек", "Zhusupbek Aimauytov"),
    ("Сұлтанмахмұт Торайғыров", "toraighyrov", "Торайгыров, Султанмахмут", "Sultanmahmut Toraighyrov"),
    ("Ыбырай Алтынсарин", "altynsarin", "Алтынсарин, Ибрай", "Ibrai Altynsarin"),
    ("Абай Құнанбайұлы", "abai", "Абай Кунанбаев", "Abai Qunanbaiuly"),
]
# Файл атауында тұлғаның аты болуы керек (мақаланың басты суретінен басқалары үшін)
TOKENS = {
    "bokeikhan": ["бөкейхан", "букейхан", "bukeikh", "bokeikh", "bukeyk", "bukeykh"],
    "baitursynuly": ["байтұрсын", "байтурсын", "baitursyn", "baytursyn"],
    "dulatuly": ["дулат", "dulat"],
    "zhumabayev": ["жұмабай", "жумабай", "zhumabai", "zhumabay", "jumabay", "magzhan", "мағжан", "магжан"],
    "aimauytuly": ["аймауыт", "аймаут", "aimauyt", "aimaut", "aymauyt"],
    "toraighyrov": ["торайғыр", "торайгыр", "toraig", "toraygir", "toraigyr"],
    "altynsarin": ["алтынсарин", "altynsarin", "altinsarin"],
    "abai": ["абай", "abai", "abay"],
}
# Портрет емес суреттер: марка, тиын, ескерткіш, мұражай т.б.
NOT_PORTRAIT = re.compile(r"stamp|марка|coin|монет|banknote|купюр|памятник|monument|statue|мүсін|grave|могил|зират|ескерткіш|mausoleum|мавзолей|кесене|museum|музей|мұражай|house|school|школ|мектеп|district|аудан|badge|знак|logo|book|кітап|жинағы|signature|подпись|autograph|\.svg$|\.pdf$|\.tif", re.I)
FREE = re.compile(r"public domain|^pd|cc0|cc[- ]by(-sa)?( |$|-)", re.I)


def get(url):
    import time, urllib.error
    for attempt in range(5):
        time.sleep(1.0)  # Wikimedia-ға сыпайы: секундына бір сұраныс
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 4:
                raise
            time.sleep(5 * (attempt + 1))


def api(host, **params):
    params.update(format="json", formatversion="2")
    return json.loads(get(f"https://{host}/w/api.php?" + urllib.parse.urlencode(params)))


def candidates(slug, name, ru, en):
    """Мақалалардың басты суреті (тұлғаның өзі) және атауында тұлғаның аты бар суреттер."""
    lead, named = [], []
    toks = TOKENS[slug]
    for host, title in (("kk.wikipedia.org", name), ("ru.wikipedia.org", ru), ("en.wikipedia.org", en)):
        try:
            q = api(host, action="query", titles=title, redirects=1, prop="pageimages|images", piprop="name", imlimit=50)
            for p in q["query"]["pages"]:
                if p.get("pageimage") and p["pageimage"] not in lead:
                    lead.append(p["pageimage"])
                for im in p.get("images", []):
                    f = im["title"].split(":", 1)[1]
                    if any(t in f.lower() for t in toks) and f not in named:
                        named.append(f)
        except Exception as e:
            print(f"  {host}: {e}")
    ok = lambda f: re.search(r"\.(jpe?g|png)$", f, re.I) and not NOT_PORTRAIT.search(f)
    return [f for f in lead if ok(f)] + [f for f in named if ok(f) and f not in lead]


_cascade = None
def face_crop(img):
    """Ең үлкен бетті тауып, 4:5 кадрды соның айналасынан қияды (бет жоғарғы үштен бірде)."""
    global _cascade
    import numpy as np, cv2
    if _cascade is None:
        _cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    g = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2GRAY)
    faces = _cascade.detectMultiScale(g, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
    if not len(faces):
        return None
    W, H = img.size
    # Ең үлкен әрі ортаға жақын бет (топтық суретте басты кейіпкер әдетте ортада)
    x, y, fw, fh = max(faces, key=lambda f: f[2] * f[3] * (1.5 - abs((f[0] + f[2] / 2) / W - 0.5)))
    ch = min(H, int(fh * 3.2)); cw = int(ch * 0.8)
    if cw > W:
        cw = W; ch = int(cw / 0.8)
    cx, cy = x + fw / 2, y + fh / 2
    left = int(min(max(cx - cw / 2, 0), W - cw))
    top = int(min(max(cy - ch * 0.4, 0), max(H - ch, 0)))
    return img.crop((left, top, left + cw, top + ch))


def strip(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html or "")).strip()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    meta, prev = {}, {}
    pj = ROOT / "assets/data/portraits.js"
    if pj.exists():
        m = re.search(r"=\s*(\{.*\});", pj.read_text(encoding="utf-8"), re.S)
        prev = json.loads(m.group(1)) if m else {}
    for name, slug, ru, en in PEOPLE:
        done = False
        for fname in candidates(slug, name, ru, en)[:12]:
            try:
                info = api("commons.wikimedia.org", action="query", titles="File:" + fname, prop="imageinfo",
                           iiprop="url|extmetadata|size", iiurlwidth="800")["query"]["pages"][0]
                if "imageinfo" not in info:
                    print(f"  – {fname}: Commons-та жоқ"); continue
                ii = info["imageinfo"][0]
                em = ii.get("extmetadata", {})
                lic = strip(em.get("LicenseShortName", {}).get("value", ""))
                if not FREE.search(lic):
                    print(f"  – {fname}: лицензия еркін емес ({lic})"); continue
                img = Image.open(io.BytesIO(get(ii.get("thumburl") or ii["url"]))).convert("RGB")
                crop = face_crop(img)
                if crop is None:
                    print(f"  – {fname}: бет табылмады"); continue
                crop.resize((320, 400), Image.LANCZOS).save(OUT / f"{slug}.jpg", "JPEG", quality=84, optimize=True, progressive=True)
                artist = strip(em.get("Artist", {}).get("value", ""))
                artist = re.sub(r"^(Unknown \w+)\1?$", r"\1", artist.replace("Unknown authorUnknown author", "Unknown author"))[:120]
                meta[name] = {"img": f"assets/img/alash/{slug}.jpg", "license": lic, "artist": artist or "белгісіз", "src": ii.get("descriptionurl", "")}
                print(f"✓ {name}: {fname} ({lic})")
                done = True
                break
            except Exception as e:
                print(f"  – {fname}: {e}")
        if not done:
            print(f"✗ {name}: еркін лицензиялы портрет табылмады")
            old = prev.get(name)
            if old and (OUT / f"{slug}.jpg").exists() and not NOT_PORTRAIT.search(urllib.parse.unquote(old.get("src", ""))):
                meta[name] = old  # бұрынғы жақсы сурет қалады
            else:
                (OUT / f"{slug}.jpg").unlink(missing_ok=True)
    (ROOT / "assets/data/portraits.js").write_text(
        "// tools/fetch_portraits.py жасаған (Wikimedia Commons, еркін лицензиялар). Қолмен өзгертпеңіз.\n"
        "window.CS50KZ_PORTRAITS = " + json.dumps(meta, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(f"{len(meta)} / {len(PEOPLE)} портрет")
    return 0 if meta else 1


if __name__ == "__main__":
    sys.exit(main())
