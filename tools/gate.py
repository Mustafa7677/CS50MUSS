# © 2026 Sagid Mustafa. All Rights Reserved.
"""AO17 жабық платформа: жариялау нұсқасын (dist/) жасау және жабық мазмұнды Storage-қа жүктеу.

    python3 tools/gate.py build            # dist/ (жария) + dist-private/ (жабық) + dist-private/catalog.json
    python3 tools/gate.py upload           # dist-private/ -> Storage «ao-content», каталог -> ao_pages, ao_asset_refs
    python3 tools/gate.py check            # dist/ ішінде жабық мазмұн қалмағанын тексеру

upload үшін орта айнымалылары (ешқашан репозиторийге жазылмайды):
    SUPABASE_URL=https://<жоба>.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=<service_role кілті>   (Supabase -> Project Settings -> API)

Не жабылады (docs/PLATFORM.md):
  * лекциялар: lectures/*.html, <курс>/lectures/*.html;
  * курстың ішкі беттері: <курс>/*.html (index.html-ден басқа);
  * жаттығу, ойын, емтихан, сөздік беттері (TOOLS);
  * мазмұн дерек файлдары: assets/data/*.js (PUBLIC_DATA-дан басқа).
Басты бет, каталог, курс туралы беттер, кіру, кабинет - жария.
"""
import html
import json
import os
import re
import shutil
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
PRIV = ROOT / "dist-private"

COURSES = ["python", "sql", "ai", "web", "cpp", "java", "en", "math"]
# Жаттығу, ойын, емтихан т.б.: курс «tools» (мұғалім бір ауыстырғышпен не бет-бетімен ашады)
TOOLS = {"practice.html": "task", "exam.html": "test", "flashcards.html": "task", "games.html": "game",
         "detective.html": "game", "debug.html": "task", "playground.html": "task", "glossary.html": "page",
         "cheatsheet.html": "page", "viz.html": "page", "flask.html": "task"}
PROJECTS = {"projects.html": "task"}
ACADEMY_PUBLIC = {"academy/index.html", "academy/map.html", "academy/models.html", "academy/study.html"}
# IELTS, Digital SAT және CS зертханалары - ашық жаттығу орталары (деректері браузерде): жария
ACADEMY_PUBLIC_DIRS = ("academy/tracks/", "academy/ielts/", "academy/sat/", "academy/labs/")
# Курстың ішкі беттерінің түрі (атауы бойынша)
SUB_KIND = {"exam": "test", "ubt": "test", "placement": "test", "practice": "task", "vocab": "task",
            "grammar": "task", "phrasebank": "task", "skills": "task"}
# Жария дерек: каталог, басты беттің безендіруі
PUBLIC_DATA = {"lectures.js", "quotes.js", "portraits.js"}
# Жариялауға мүлде кірмейтін (әзірлеу) бумалар мен файлдар
EXCLUDE_DIRS = {".git", ".github", "tools", "tests", "test-results", "supabase", "qazaqcode", "node_modules",
                "dist", "dist-private", "sources", "licensing", ".claude", "__pycache__"}


def page_rule(rel):
    """rel -> (course, kind) жабық бет болса, әйтпесе None."""
    parts = rel.split("/")
    if len(parts) == 2 and parts[0] == "lectures" and rel.endswith(".html"):
        return "x", "lecture"
    if len(parts) == 3 and parts[0] in COURSES and parts[1] == "lectures" and rel.endswith(".html"):
        return parts[0], "lecture"
    if len(parts) == 2 and parts[0] in COURSES and parts[1].endswith(".html") and parts[1] != "index.html":
        return parts[0], SUB_KIND.get(parts[1][:-5], "page")
    # AO17 CS Universe: каталог (index) мен білім картасы жария; сабақтар мен зертхана - жабық, курс «academy»
    # Бағыт беттері (academy/tracks/*) - каталог, сондықтан жария
    if parts[0] == "academy" and rel.endswith(".html") and rel not in ACADEMY_PUBLIC and not rel.startswith(ACADEMY_PUBLIC_DIRS):
        return "academy", "task" if parts[-1] == "lab.html" else "lecture"
    if rel in TOOLS:
        return "tools", TOOLS[rel]
    if rel in PROJECTS:
        return "projects", PROJECTS[rel]
    return None


def data_rule(rel):
    """assets/data/*.js -> asset_refs 'page' мәні (жабық болса), әйтпесе None."""
    m = re.fullmatch(r"assets/data/([A-Za-z0-9_.-]+\.js)", rel)
    if not m or m.group(1) in PUBLIC_DATA:
        return None
    name = m.group(1)
    if name.startswith("math-"):
        return "course:math"
    if name.startswith("en-"):
        return "course:en"
    return "*"


def title_of(text, rel):
    m = re.search(r"<h1[^>]*>(.*?)</h1>", text, re.S)
    t = m.group(1) if m else (re.search(r"<title>(.*?)</title>", text, re.S) or [None, rel])[1]
    t = html.unescape(re.sub(r"<[^>]+>", " ", t))
    t = re.sub(r"\s+", " ", t).strip()
    return re.sub(r"\s+-\s+AO17$", "", t)[:200] or rel


def sort_of(rel):
    m = re.fullmatch(r"academy/m(\d+)/l(\d+)\.html", rel)
    if m:
        return int(m.group(1)) * 100 + int(m.group(2))
    m = re.search(r"week-(\d+)\.html$", rel)
    return int(m.group(1)) if m else (900 if rel.endswith("ai.html") else 1000)


def site_files():
    for p in sorted(ROOT.rglob("*")):
        rel = p.relative_to(ROOT)
        if not p.is_file() or rel.parts[0] in EXCLUDE_DIRS or any(x == "__pycache__" for x in rel.parts):
            continue
        yield rel.as_posix(), p


def shell(rel, title):
    pre = "../" * rel.count("/")
    t = html.escape(title)
    return f"""<!DOCTYPE html>
<html lang="kk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>{t} - AO17</title>
  <link rel="icon" href="{pre}assets/img/icon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="{pre}assets/fonts/fonts.css">
  <link rel="stylesheet" href="{pre}assets/css/style.css">
  <script src="{pre}assets/js/ao.js" defer></script>
  <script src="{pre}assets/js/ao-gate.js" data-path="{html.escape(rel)}" defer></script>
</head>
<body>
  <main class="ao-gate-msg"><h1>{t}</h1><p>Жүктелуде…</p><noscript>Бұл бетке JavaScript керек.</noscript></main>
</body>
</html>
"""


def build():
    for d in (DIST, PRIV):
        shutil.rmtree(d, ignore_errors=True)
        d.mkdir()
    pages, assets = [], []
    for rel, p in site_files():
        rule = page_rule(rel)
        aref = data_rule(rel)
        if rule:
            text = p.read_text(encoding="utf-8")
            title = title_of(text, rel)
            pages.append({"path": rel, "course": rule[0], "kind": rule[1], "title": title, "sort": sort_of(rel)})
            out = PRIV / rel
            out.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, out)
            dst = DIST / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_text(shell(rel, title), encoding="utf-8")
        elif aref:
            assets.append({"asset": rel, "page": aref})
            out = PRIV / rel
            out.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, out)
        else:
            dst = DIST / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, dst)
    gated = sorted(a["asset"] for a in assets)
    prelude = "window.AO_GATED=" + json.dumps(gated, separators=(",", ":")) + ";\n"
    for js in ("assets/js/main.js", "assets/js/ao-gate.js"):
        f = DIST / js
        f.write_text(prelude + f.read_text(encoding="utf-8"), encoding="utf-8")
    # sw.js: жабық дерек файлдары Pages-те жоқ - офлайн кэш тізімінен алып тастаймыз (addAll құламасын)
    sw = DIST / "sw.js"
    if sw.exists():
        s = sw.read_text(encoding="utf-8")
        for g in gated:
            s = s.replace(f'"{g}", ', "").replace(f', "{g}"', "").replace(f'"{g}"', "")
        sw.write_text(s, encoding="utf-8")
    # Pages: Jekyll өңдемесін
    (DIST / ".nojekyll").write_text("", encoding="utf-8")
    catalog = {"pages": pages, "assets": assets}
    (PRIV / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"gate: {len(pages)} жабық бет, {len(assets)} жабық дерек файлы -> dist-private/; жария нұсқа -> dist/")
    return catalog


def check():
    """dist/ ішінде жабық мазмұн жоқ: жабық беттер - тек қабық, жабық дерек файлдары - жоқ."""
    cat = json.loads((PRIV / "catalog.json").read_text(encoding="utf-8"))
    bad = []
    for pg in cat["pages"]:
        t = (DIST / pg["path"]).read_text(encoding="utf-8")
        if "ao-gate.js" not in t or len(t) > 2000:
            bad.append(pg["path"])
    for a in cat["assets"]:
        if (DIST / a["asset"]).exists():
            bad.append(a["asset"])
    if bad:
        print("gate check: жабық мазмұн dist/ ішінде қалды:", *bad[:20], sep="\n  ")
        sys.exit(1)
    if not cat["pages"]:
        print("gate check: жабық бет табылмады")
        sys.exit(1)
    print(f"gate check: OK ({len(cat['pages'])} бет, {len(cat['assets'])} дерек файлы жабық)")


# ---------------------------------------------------------------- Supabase-ке жүктеу
def _env():
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        sys.exit("SUPABASE_URL мен SUPABASE_SERVICE_ROLE_KEY орта айнымалылары керек (docs/PLATFORM.md)")
    return url, key


def _req(method, url, key, body=None, ctype="application/json", extra=None):
    h = {"apikey": key, "Content-Type": ctype}
    if key.startswith("eyJ"):   # ескі service_role JWT; жаңа sb_secret_ кілті тек apikey тақырыбымен жүреді
        h["Authorization"] = "Bearer " + key
    h.update(extra or {})
    data = body if isinstance(body, (bytes, type(None))) else json.dumps(body).encode()
    import time
    for attempt in range(4):   # 5xx (мысалы Cloudflare 520) және желі үзілісі - уақытша: 2, 4, 8 с кейін қайталау
        r = urllib.request.Request(url, data=data, method=method, headers=h)
        try:
            with urllib.request.urlopen(r, timeout=60) as res:
                return res.status, res.read()
        except urllib.error.HTTPError as e:
            if e.code >= 500 and attempt < 3:
                time.sleep(2 ** (attempt + 1))
                continue
            raise SystemExit(f"{method} {url.split('?')[0]} -> {e.code}: {e.read()[:300].decode('utf-8', 'replace')}")
        except (urllib.error.URLError, TimeoutError) as e:
            if attempt < 3:
                time.sleep(2 ** (attempt + 1))
                continue
            raise SystemExit(f"{method} {url.split('?')[0]} -> желі қатесі: {e}")


def _key_role(key):
    """JWT кілттің рөлі (anon / service_role); sb_secret_ - service_role; басқасы - None."""
    if key.startswith("sb_secret_"):
        return "service_role"
    if key.startswith("eyJ") and key.count(".") == 2:
        import base64
        part = key.split(".")[1]
        try:
            return json.loads(base64.urlsafe_b64decode(part + "=" * (-len(part) % 4))).get("role")
        except ValueError:
            return None
    return None


def upload():
    url, key = _env()
    role = _key_role(key)
    if role != "service_role":
        sys.exit(f"SUPABASE_SERVICE_ROLE_KEY - service_role кілті емес (табылған рөл: {role or 'белгісіз'}). "
                 "Supabase -> Settings -> API Keys -> Legacy -> service_role (secret) кілтін қойыңыз.")
    cat = json.loads((PRIV / "catalog.json").read_text(encoding="utf-8"))
    files = [p["path"] for p in cat["pages"]] + [a["asset"] for a in cat["assets"]]
    for i, rel in enumerate(files, 1):
        ctype = "text/html; charset=utf-8" if rel.endswith(".html") else "text/javascript; charset=utf-8"
        _req("POST", f"{url}/storage/v1/object/ao-content/{urllib.parse.quote(rel)}", key,
             (PRIV / rel).read_bytes(), ctype, {"x-upsert": "true", "cache-control": "no-store"})
        if i % 50 == 0:
            print(f"  {i}/{len(files)}")
    rest = url + "/rest/v1/"
    up = {"Prefer": "resolution=merge-duplicates,return=minimal"}
    _req("POST", rest + "ao_pages?on_conflict=path", key, cat["pages"], extra=up)
    # каталогтан түскен беттер: олардың рұқсаттары әсер етпейді, жазбасын өшіреміз
    _, raw = _req("GET", rest + "ao_pages?select=path", key)
    keep = {p["path"] for p in cat["pages"]}
    stale = [r["path"] for r in json.loads(raw) if r["path"] not in keep]
    for i in range(0, len(stale), 50):
        q = ",".join('"' + s + '"' for s in stale[i:i + 50])
        _req("DELETE", rest + "ao_pages?path=in.(" + urllib.parse.quote(q) + ")", key)
    _req("DELETE", rest + "ao_asset_refs?asset=like.assets*", key)
    _req("POST", rest + "ao_asset_refs", key, cat["assets"], extra=up)
    print(f"upload: {len(files)} файл Storage-та; ao_pages={len(cat['pages'])}, ao_asset_refs={len(cat['assets'])}, өшірілген={len(stale)}")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "build"
    if cmd == "build":
        build()
        check()
    elif cmd == "check":
        check()
    elif cmd == "upload":
        upload()
    else:
        sys.exit(__doc__)
