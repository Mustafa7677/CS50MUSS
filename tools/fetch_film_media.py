#!/usr/bin/env python3
# © 2026 Sagid Mustafa. All Rights Reserved.
"""«Шақыру» фильміне архивтік суреттерді Wikimedia Commons-тан алады (GitHub Actions-та іске қосылады).

Екі кезең:
  search  film/media/queries.json -> әр тақырып бойынша үміткер суреттер (қарауға арналған 1000 px), out/<тақырып>/ және
          out/index.json (атауы, лицензиясы, авторы, дерек көзі, түпнұсқа өлшемі). Нәтиже бөлек тармаққа жіберіледі.
  get     film/media/picks.json -> таңдалған файлдар үлкен өлшемде assets/img/film/ ішіне, дерек көздері
          assets/data/film-media.json ішіне.
Тек еркін лицензия: Public domain, CC0, CC BY, CC BY-SA. Басқасы өткізіледі.
"""
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "AO17-film/1.0 (https://github.com/Mustafa7677/CS50MUSS; educational, Kazakh-language)"}
FREE = re.compile(r"public domain|^pd\b|^pd-|cc0|cc[- ]by(-sa)?([- ]\d|$| )", re.I)


def get(url, binary=False):
    for attempt in range(5):
        time.sleep(0.8)   # Commons-қа сыпайы
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                data = r.read()
                return data if binary else json.loads(data)
        except urllib.error.HTTPError as e:
            if e.code not in (429, 503) or attempt == 4:
                raise
            time.sleep(5 * (attempt + 1))


def clean(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()


def info_for(pages):
    out = []
    for p in pages:
        ii = (p.get("imageinfo") or [{}])[0]
        md = ii.get("extmetadata") or {}
        lic = clean((md.get("LicenseShortName") or {}).get("value"))
        if not FREE.search(lic or "") or ii.get("mime") not in ("image/jpeg", "image/png", "image/tiff", "image/webp"):
            continue
        out.append({
            "title": p["title"], "license": lic, "artist": clean((md.get("Artist") or {}).get("value"))[:160],
            "credit": clean((md.get("Credit") or {}).get("value"))[:160], "date": clean((md.get("DateTimeOriginal") or {}).get("value"))[:60],
            "desc": clean((md.get("ImageDescription") or {}).get("value"))[:300], "page": ii.get("descriptionurl"),
            "width": ii.get("width"), "height": ii.get("height"), "thumb": ii.get("thumburl"),
        })
    return out


def query(params):
    base = {"action": "query", "format": "json", "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata"}
    base.update(params)
    data = get(API + "?" + urllib.parse.urlencode(base))
    return list((data.get("query") or {}).get("pages", {}).values())


def search(out_dir):
    topics = json.loads((ROOT / "film/media/queries.json").read_text(encoding="utf8"))
    out_dir.mkdir(parents=True, exist_ok=True)
    index = {}
    for topic, qs in topics.items():
        seen, items = set(), []
        for q in qs:
            try:
                pages = query({"generator": "search", "gsrsearch": q, "gsrnamespace": 6, "gsrlimit": 12, "iiurlwidth": 1000})
            except Exception as e:  # бір сұраныс құласа, қалғаны жалғасады
                print("ҚАТЕ", topic, q, e, file=sys.stderr)
                continue
            for it in info_for(sorted(pages, key=lambda p: p.get("index", 99))):
                if it["title"] in seen or not it["thumb"]:
                    continue
                seen.add(it["title"])
                items.append(it)
        items = items[:10]
        d = out_dir / topic
        d.mkdir(exist_ok=True)
        for i, it in enumerate(items):
            fn = f"{i:02d}.jpg"
            try:
                (d / fn).write_bytes(get(it["thumb"], binary=True))
                it["file"] = f"{topic}/{fn}"
            except Exception as e:
                print("ҚАТЕ", it["title"], e, file=sys.stderr)
        index[topic] = [it for it in items if it.get("file")]
        print(topic, len(index[topic]))
    (out_dir / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf8")


def pick():
    picks = json.loads((ROOT / "film/media/picks.json").read_text(encoding="utf8"))
    out = ROOT / "assets/img/film"
    out.mkdir(parents=True, exist_ok=True)
    credits = {}
    for key, spec in picks.items():
        width = spec.get("width", 2000)
        pages = query({"titles": spec["title"], "iiurlwidth": width})
        items = info_for(pages)
        if not items:
            print("ӨТКІЗІЛДІ (лицензия не файл жоқ):", spec["title"], file=sys.stderr)
            continue
        it = items[0]
        url = it["thumb"] if (it["width"] or 0) > width else get(API + "?" + urllib.parse.urlencode({"action": "query", "format": "json", "titles": spec["title"], "prop": "imageinfo", "iiprop": "url"}))["query"]["pages"].popitem()[1]["imageinfo"][0]["url"]
        data = get(url, binary=True)
        ext = ".png" if data[:4] == b"\x89PNG" else ".jpg"
        (out / (key + ext)).write_bytes(data)
        credits[key] = {k: it[k] for k in ("title", "license", "artist", "credit", "date", "page")} | {"file": f"assets/img/film/{key}{ext}", "use": spec.get("use", "")}
        print(key, it["width"], "x", it["height"], it["license"])
    (ROOT / "assets/data/film-media.json").write_text(json.dumps(credits, ensure_ascii=False, indent=1), encoding="utf8")


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "search"
    if mode == "search":
        search(Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "film-media-candidates")
    else:
        pick()
