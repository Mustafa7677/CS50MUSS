"""Flask зертханасы үшін таза Python пакеттерін бір zip-ке жинайды.

Pyodide браузерде осы архивті site-packages ішіне ашады, сондықтан Flask
ешқандай сыртқы пакет серверінсіз жұмыс істейді.

Қолдану:  python3 tools/make_flask_bundle.py <wheel-дер мен markupsafe sdist жатқан қалта>
(pip download --no-deps flask werkzeug itsdangerous blinker jinja2 click;
 pip download --no-deps --no-binary :all: markupsafe)
"""
import io, pathlib, sys, tarfile, zipfile

SRC = pathlib.Path(sys.argv[1])
OUT = pathlib.Path(__file__).resolve().parent.parent / "assets/vendor/flask/flask-bundle.zip"
SKIP_EXT = (".pyi", "py.typed", ".c", ".so")


def keep(name):
    return "/debug/shared/" not in name and not name.endswith(SKIP_EXT) and ".dist-info/" not in name


with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as out:
    for whl in sorted(SRC.glob("*.whl")):
        with zipfile.ZipFile(whl) as z:
            for n in z.namelist():
                if keep(n) or n.endswith(".dist-info/METADATA"):
                    out.writestr(n, z.read(n))
                elif ".dist-info/" in n and "LICENSE" in n.upper().split("/")[-1]:
                    out.writestr("licenses/" + whl.name.split("-")[0] + "-LICENSE.txt", z.read(n))
    for tgz in SRC.glob("markupsafe-*.tar.gz"):
        with tarfile.open(tgz) as t:
            for m in t.getmembers():
                if m.isfile() and "/src/markupsafe/" in m.name and keep(m.name):
                    out.writestr("markupsafe/" + m.name.split("/src/markupsafe/")[1], t.extractfile(m).read())
                elif m.isfile() and m.name.count("/") == 1 and m.name.endswith("/PKG-INFO"):
                    ver = m.name.split("/")[0].split("-")[1]
                    out.writestr(f"markupsafe-{ver}.dist-info/METADATA", t.extractfile(m).read())
                elif m.isfile() and m.name.endswith("/LICENSE.txt"):
                    out.writestr("licenses/markupsafe-LICENSE.txt", t.extractfile(m).read())
print(OUT, OUT.stat().st_size // 1024, "KB")
