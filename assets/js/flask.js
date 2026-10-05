// CS50 қазақша — Flask зертханасы: нағыз Flask (Pyodide) + жалған браузер + сервер логы + автотексеру.
// main.js .flask-lab бар бетте ғана жүктейді.

(function () {
  const K = window.CS50KZ;
  const esc = K.escapeHtml;
  const store = {
    get(key, def) { try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch (e) { return def; } },
    set(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} },
  };
  const ORIGIN = "http://127.0.0.1:5000";

  // ---------- Python жағы ----------
  const HARNESS = String.raw`
import sys, os, io, re, json, types, base64, importlib, traceback, contextlib
from datetime import datetime

APP_DIR = "/home/pyodide/flaskapp"
_state = {"app": None, "client": None}

# flask_session: курстағыдай Session(app) жазуға болсын (браузерде cookie-сессия)
_fs = types.ModuleType("flask_session")
class Session:
    def __init__(self, app=None):
        if app is not None:
            self.init_app(app)
    def init_app(self, app):
        if not app.secret_key:
            app.secret_key = "cs50kz-dev"
_fs.Session = Session
sys.modules["flask_session"] = _fs

# cs50.SQL: CS50 кітапханасындағыдай execute()
def _make_sql():
    import sqlite3
    class SQL:
        def __init__(self, url):
            path = re.sub(r"^sqlite:///", "", url)
            self._con = sqlite3.connect(path, isolation_level=None, check_same_thread=False)
            self._con.row_factory = sqlite3.Row
        def execute(self, sql, *args, **kwargs):
            if args and any(isinstance(a, (list, tuple)) for a in args):
                parts, flat = sql.split("?"), []
                out = parts[0]
                for k, a in enumerate(args):
                    if isinstance(a, (list, tuple)):
                        out += ", ".join("?" * len(a)); flat += list(a)
                    else:
                        out += "?"; flat.append(a)
                    out += parts[k + 1]
                sql, args = out, tuple(flat)
            try:
                cur = self._con.execute(sql, kwargs if kwargs else args)
            except sqlite3.IntegrityError as e:
                raise ValueError(str(e))
            verb = sql.lstrip().split(None, 1)[0].upper() if sql.strip() else ""
            if verb in ("SELECT", "WITH", "PRAGMA"):
                return [dict(r) for r in cur.fetchall()]
            if verb in ("INSERT", "REPLACE"):
                return cur.lastrowid
            if verb in ("UPDATE", "DELETE"):
                return cur.rowcount
            return True
    return SQL

import cs50 as _cs50
_cs50.SQL = lambda url: _make_sql()(url)


def _tb(e):
    lines = traceback.format_exception(type(e), e, e.__traceback__)
    keep = [l for l in lines if "/lib/python" not in l and "site-packages" not in l and "<exec>" not in l and "<frozen" not in l]
    return "".join(keep).rstrip()


def __flask_load(files, dbs=None):
    if os.path.isdir(APP_DIR):
        for root, dirs, names in os.walk(APP_DIR, topdown=False):
            for n in names:
                if not n.endswith(".db"):
                    os.remove(os.path.join(root, n))
    os.makedirs(APP_DIR, exist_ok=True)
    for name, text in dict(files).items():
        path = os.path.join(APP_DIR, name)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(text)
    for name, script in dict(dbs or {}).items():
        path = os.path.join(APP_DIR, name)
        if not os.path.exists(path):
            import sqlite3
            con = sqlite3.connect(path)
            con.executescript(script)
            con.commit()
            con.close()
    for m in list(sys.modules):
        f = getattr(sys.modules[m], "__file__", None) or ""
        if f.startswith(APP_DIR):
            del sys.modules[m]
    if APP_DIR not in sys.path:
        sys.path.insert(0, APP_DIR)
    importlib.invalidate_caches()
    os.chdir(APP_DIR)
    _state["app"] = _state["client"] = None
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            mod = importlib.import_module("app")
    except BaseException as e:
        return json.dumps({"ok": False, "log": buf.getvalue(), "error": _tb(e)})
    app = getattr(mod, "app", None)
    from flask import Flask
    if not isinstance(app, Flask):
        return json.dumps({"ok": False, "log": buf.getvalue(), "error": "app.py ішінде app = Flask(__name__) табылмады"})
    app.config["PROPAGATE_EXCEPTIONS"] = True
    _state["app"] = app
    _state["client"] = app.test_client()
    routes = sorted({r.rule for r in app.url_map.iter_rules() if r.endpoint != "static"})
    return json.dumps({"ok": True, "log": buf.getvalue(), "routes": routes})


_LOCAL = r'(?!https?:|data:|//)([^"\']+)'


def _inline(html, client):
    """Беттегі /static/... стильдері, скрипттері мен суреттерін iframe ішіне кірістіру."""
    def get(url):
        r = client.get(url if url.startswith("/") else "/" + url)
        return r if r.status_code == 200 else None
    def link(m):
        tag = m.group(0)
        h = re.search(r'href=["\']' + _LOCAL, tag, re.I)
        r = get(h.group(1)) if h and "stylesheet" in tag.lower() else None
        return f"<style>\n{r.get_data(as_text=True)}\n</style>" if r else tag
    def script(m):
        r = get(m.group(1))
        return f"<script>\n{r.get_data(as_text=True)}\n</script>" if r else m.group(0)
    def img(m):
        r = get(m.group(3))
        if not r:
            return m.group(0)
        return f'{m.group(1)}{m.group(2)}data:{r.mimetype};base64,{base64.b64encode(r.get_data()).decode()}{m.group(2)}'
    html = re.sub(r"<link\b[^>]*>", link, html, flags=re.I)
    html = re.sub(r'<script\b[^>]*src=["\']' + _LOCAL + r'["\'][^>]*>\s*</script>', script, html, flags=re.I)
    html = re.sub(r'(<img\b[^>]*src=)(["\'])' + _LOCAL + r'\2', img, html, flags=re.I)
    return html


def __flask_req(method, url, pairs=None, body=None, ctype=None, mode="view"):
    """mode: view — браузер (cookie сақталады); check-new — тексеру үшін жаңа клиент; check — сол клиент."""
    app = _state["app"]
    if app is None:
        return json.dumps({"status": 0})
    if mode == "check-new":
        _state["check"] = app.test_client()
    client = _state["check"] if mode.startswith("check") else _state["client"]
    from werkzeug.datastructures import MultiDict
    kw = {}
    if pairs is not None:
        kw["data"] = MultiDict([tuple(p) for p in pairs])
    elif body is not None:
        kw["data"] = body
        if ctype:
            kw["content_type"] = ctype
    buf = io.StringIO()
    err = None
    try:
        with contextlib.redirect_stdout(buf):
            r = client.open(url, method=method, **kw)
        status, mimetype, data = r.status_code, r.mimetype or "text/plain", r.get_data()
        loc = r.headers.get("Location")
    except BaseException as e:
        err = _tb(e)
        status, mimetype, loc = 500, "text/html", None
        data = ("<!doctype html><title>500 Internal Server Error</title><body style='font-family:system-ui;padding:24px'>"
                "<h1>Internal Server Error</h1><p>Серверде қате шықты. Толығын төмендегі логтан қараңыз.</p></body>").encode()
    text = mimetype.startswith("text/") or mimetype in ("application/json", "application/javascript")
    out = data.decode("utf-8", "replace") if text else base64.b64encode(data).decode()
    if mode == "view" and mimetype == "text/html" and status < 300:
        out = _inline(out, client)
    stamp = datetime.now().strftime("%d/%b/%Y %H:%M:%S")
    return json.dumps({"status": status, "mimetype": mimetype, "body": out, "text": text, "location": loc,
                       "log": buf.getvalue(), "error": err,
                       "line": f'127.0.0.1 - - [{stamp}] "{method} {url} HTTP/1.1" {status} -'})
`;

  let flaskReady = null;
  function getFlask() {
    if (!flaskReady) {
      flaskReady = (async () => {
        const py = await K.getPyodide();
        const res = await fetch(K.ROOT_URL + "assets/vendor/flask/flask-bundle.zip");
        if (!res.ok) throw new Error("Flask пакеті жүктелмеді");
        py.unpackArchive(await res.arrayBuffer(), "zip", { extractDir: "/lib/python3.12/site-packages" });
        py.runPython(HARNESS);
        return py;
      })();
      flaskReady.catch(() => (flaskReady = null));
    }
    return flaskReady;
  }

  // ---------- Мысалдар ----------
  const LAYOUT = (title, css = true) => `<!DOCTYPE html>
<html lang="kk">
    <head>
        <meta name="viewport" content="initial-scale=1, width=device-width">${css ? '\n        <link href="/static/styles.css" rel="stylesheet">' : ""}
        <title>${title}</title>
    </head>
    <body>
        {% block body %}{% endblock %}
    </body>
</html>
`;
  const CSS = `body {
    font-family: system-ui, sans-serif;
    max-width: 560px;
    margin: 40px auto;
    padding: 0 16px;
    color: #14213d;
}

h1 {
    color: #0a4c7a;
}

input, select, button {
    font: inherit;
    padding: 6px 10px;
}

button {
    background: #f2b705;
    border: 0;
    border-radius: 6px;
    cursor: pointer;
}
`;
  const EXAMPLES = {
    "👋 Сәлем": {
      "app.py": `from flask import Flask, render_template, request

app = Flask(__name__)


@app.route("/")
def index():
    name = request.args.get("name", "әлем")
    return render_template("index.html", name=name)
`,
      "templates/index.html": `<!DOCTYPE html>
<html lang="kk">
    <head>
        <meta name="viewport" content="initial-scale=1, width=device-width">
        <title>hello</title>
    </head>
    <body>
        <h1>Сәлем, {{ name }}!</h1>
        <p>Мекенжайға <code>?name=...</code> қосып көріңіз:</p>
        <a href="/?name=Аружан">Аружан</a> · <a href="/?name=Дәулет">Дәулет</a>
    </body>
</html>
`,
    },
    "📝 Форма": {
      "app.py": `from flask import Flask, render_template, request

app = Flask(__name__)


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        name = request.form.get("name", "әлем")
        return render_template("greet.html", name=name)
    return render_template("index.html")
`,
      "templates/layout.html": LAYOUT("greet"),
      "templates/index.html": `{% extends "layout.html" %}

{% block body %}
    <h1>Танысайық</h1>
    <form action="/" method="post">
        <input autocomplete="off" autofocus name="name" placeholder="Есіміңіз" type="text">
        <button type="submit">Жіберу</button>
    </form>
{% endblock %}
`,
      "templates/greet.html": `{% extends "layout.html" %}

{% block body %}
    <h1>Сәлем, {{ name }}!</h1>
    <a href="/">← Қайта</a>
{% endblock %}
`,
      "static/styles.css": CSS,
    },
    "🏅 Тіркелу": {
      "app.py": `from flask import Flask, redirect, render_template, request

app = Flask(__name__)

REGISTRANTS = {}

SPORTS = [
    "Баскетбол",
    "Футбол",
    "Волейбол",
    "Тоғызқұмалақ",
]


@app.route("/")
def index():
    return render_template("index.html", sports=SPORTS)


@app.route("/register", methods=["POST"])
def register():
    name = request.form.get("name")
    if not name:
        return render_template("failure.html", message="Есім жазылмады")
    sport = request.form.get("sport")
    if sport not in SPORTS:
        return render_template("failure.html", message="Спорт түрі дұрыс емес")

    REGISTRANTS[name] = sport
    print("Жаңа қатысушы:", name, "→", sport)
    return redirect("/registrants")


@app.route("/registrants")
def registrants():
    return render_template("registrants.html", registrants=REGISTRANTS)
`,
      "templates/layout.html": LAYOUT("froshims"),
      "templates/index.html": `{% extends "layout.html" %}

{% block body %}
    <h1>Жарысқа тіркелу</h1>
    <form action="/register" method="post">
        <input autocomplete="off" autofocus name="name" placeholder="Есім" type="text">
        {% for sport in sports %}
            <label><input name="sport" type="radio" value="{{ sport }}"> {{ sport }}</label>
        {% endfor %}
        <p><button type="submit">Тіркелу</button></p>
    </form>
{% endblock %}
`,
      "templates/failure.html": `{% extends "layout.html" %}

{% block body %}
    <h1>Қате</h1>
    <p>{{ message }}</p>
    <a href="/">← Қайта көру</a>
{% endblock %}
`,
      "templates/registrants.html": `{% extends "layout.html" %}

{% block body %}
    <h1>Қатысушылар</h1>
    <table>
        <thead><tr><th>Есім</th><th>Спорт</th></tr></thead>
        <tbody>
            {% for name in registrants %}
                <tr><td>{{ name }}</td><td>{{ registrants[name] }}</td></tr>
            {% endfor %}
        </tbody>
    </table>
    <a href="/">+ Тағы біреуді тіркеу</a>
{% endblock %}
`,
      "static/styles.css": CSS + `
label {
    display: block;
    margin: 6px 0;
}

table {
    border-collapse: collapse;
    margin: 12px 0;
}

td, th {
    border: 1px solid #ccc;
    padding: 6px 12px;
}
`,
    },
    "🔐 Кіру (сессия)": {
      "app.py": `from flask import Flask, redirect, render_template, request, session
from flask_session import Session

app = Flask(__name__)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)


@app.route("/")
def index():
    return render_template("index.html", name=session.get("name"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        session["name"] = request.form.get("name")
        return redirect("/")
    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")
`,
      "templates/layout.html": LAYOUT("login"),
      "templates/index.html": `{% extends "layout.html" %}

{% block body %}
    {% if name %}
        <h1>Қош келдіңіз, {{ name }}!</h1>
        <p>Бетті жаңартып көріңіз: сессия сізді «есте сақтайды».</p>
        <a href="/logout">Шығу</a>
    {% else %}
        <h1>Сіз жүйеге кірмегенсіз</h1>
        <a href="/login">Кіру</a>
    {% endif %}
{% endblock %}
`,
      "templates/login.html": `{% extends "layout.html" %}

{% block body %}
    <h1>Кіру</h1>
    <form action="/login" method="post">
        <input autocomplete="off" autofocus name="name" placeholder="Есім" type="text">
        <button type="submit">Кіру</button>
    </form>
{% endblock %}
`,
      "static/styles.css": CSS,
    },
    "📺 Шоулар (SQL + JS)": {
      "app.py": `from cs50 import SQL
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

db = SQL("sqlite:///shows.db")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/search")
def search():
    q = request.args.get("q")
    if q:
        shows = db.execute(
            "SELECT title, year FROM shows WHERE title LIKE ? ORDER BY title LIMIT 20",
            "%" + q + "%",
        )
    else:
        shows = []
    return jsonify(shows)
`,
      "templates/index.html": `<!DOCTYPE html>
<html lang="kk">
    <head>
        <meta name="viewport" content="initial-scale=1, width=device-width">
        <link href="/static/styles.css" rel="stylesheet">
        <title>shows</title>
    </head>
    <body>
        <h1>Сериал іздеу</h1>
        <input autocomplete="off" autofocus placeholder="Мысалы: the" type="search">
        <ul></ul>

        <script>
            let input = document.querySelector("input");
            input.addEventListener("input", async function() {
                let response = await fetch("/search?q=" + input.value);
                let shows = await response.json();
                let html = "";
                for (let show of shows) {
                    html += "<li>" + show.title + " (" + show.year + ")</li>";
                }
                document.querySelector("ul").innerHTML = html;
            });
        </script>
    </body>
</html>
`,
      "static/styles.css": CSS,
    },
  };

  // ---------- Тапсырмалар (автотексеру) ----------
  const TASKS = [
    {
      id: "hello", t: "Сәлем, есім!", lvl: "Оңай",
      d: "<code>/</code> маршруты <code>?name=</code> параметрін оқып, «Сәлем, Аружан!» деп шығарсын. Есім берілмесе — «Сәлем, әлем!». Есімді шаблон арқылы шығарыңыз: Jinja HTML-ді өзі экрандайды.",
      start: {
        "app.py": `from flask import Flask, render_template, request

app = Flask(__name__)


@app.route("/")
def index():
    # TODO: request.args ішінен name алыңыз (әдепкі мәні "әлем")
    return render_template("index.html")
`,
        "templates/index.html": `<!DOCTYPE html>
<html lang="kk">
    <head>
        <title>hello</title>
    </head>
    <body>
        <!-- TODO: Сәлем, ...! -->
    </body>
</html>
`,
      },
      steps: [
        { n: "/?name=Аружан → «Сәлем, Аружан!»", m: "GET", u: "/?name=Аружан", status: 200, has: ["Сәлем, Аружан!"] },
        { n: "/ → «Сәлем, әлем!»", m: "GET", u: "/", status: 200, has: ["Сәлем, әлем!"] },
        { n: "HTML экрандалады (XSS жоқ)", m: "GET", u: "/?name=%3Cb%3EX%3C%2Fb%3E", status: 200, not: ["<b>X</b>"], has: ["&lt;b&gt;X"] },
      ],
    },
    {
      id: "add", t: "Калькулятор", lvl: "Оңай",
      d: "<code>/add?a=2&amp;b=3</code> сұрауына жауап ретінде қосындыны (<code>5</code>) қайтарыңыз. a не b бүтін сан болмаса, <code>abort(400)</code> арқылы 400 қатесін қайтарыңыз.",
      start: {
        "app.py": `from flask import Flask, abort, request

app = Flask(__name__)


@app.route("/add")
def add():
    # TODO: a мен b-ны оқып, int-ке айналдырыңыз
    # TODO: сан болмаса — abort(400)
    return "?"
`,
      },
      steps: [
        { n: "/add?a=2&b=3 → 5", m: "GET", u: "/add?a=2&b=3", status: 200, re: "(^|\\D)5(\\D|$)" },
        { n: "/add?a=-7&b=10 → 3", m: "GET", u: "/add?a=-7&b=10", status: 200, re: "(^|[^\\d-])3(\\D|$)" },
        { n: "/add?a=1000&b=2026 → 3026", m: "GET", u: "/add?a=1000&b=2026", status: 200, re: "(^|\\D)3026(\\D|$)" },
        { n: "/add?a=бір&b=2 → 400", m: "GET", u: "/add?a=бір&b=2", status: 400 },
        { n: "/add (параметрсіз) → 400", m: "GET", u: "/add", status: 400 },
      ],
    },
    {
      id: "froshims", t: "Жарысқа тіркелу", lvl: "Орташа",
      d: "Мысалдағы «🏅 Тіркелу» сияқты қосымша жасаңыз: <code>/</code> бетінде форма, <code>POST /register</code> есім мен спортты тексеріп, дұрыс болса <code>/registrants</code>-ке бағыттайды (redirect). Қате болса бетте «Қате» сөзі тұрсын. Спорттар: Баскетбол, Футбол, Волейбол, Тоғызқұмалақ.",
      start: {
        "app.py": `from flask import Flask, redirect, render_template, request

app = Flask(__name__)

REGISTRANTS = {}

SPORTS = ["Баскетбол", "Футбол", "Волейбол", "Тоғызқұмалақ"]


@app.route("/")
def index():
    return render_template("index.html", sports=SPORTS)


@app.route("/register", methods=["POST"])
def register():
    # TODO: есім мен спортты тексеріңіз, қате болса failure.html
    # TODO: REGISTRANTS-ке қосып, /registrants-ке redirect
    return "TODO"


@app.route("/registrants")
def registrants():
    return render_template("registrants.html", registrants=REGISTRANTS)
`,
        "templates/index.html": `<!DOCTYPE html>
<html lang="kk">
    <head>
        <title>froshims</title>
    </head>
    <body>
        <h1>Жарысқа тіркелу</h1>
        <form action="/register" method="post">
            <input autocomplete="off" name="name" placeholder="Есім" type="text">
            <select name="sport">
                <option disabled selected value="">Спорт</option>
                {% for sport in sports %}
                    <option value="{{ sport }}">{{ sport }}</option>
                {% endfor %}
            </select>
            <button type="submit">Тіркелу</button>
        </form>
    </body>
</html>
`,
        "templates/failure.html": `<!DOCTYPE html>
<html lang="kk">
    <head>
        <title>Қате</title>
    </head>
    <body>
        <h1>Қате</h1>
        <p>{{ message }}</p>
    </body>
</html>
`,
        "templates/registrants.html": `<!DOCTYPE html>
<html lang="kk">
    <head>
        <title>Қатысушылар</title>
    </head>
    <body>
        <h1>Қатысушылар</h1>
        <ul>
            {% for name in registrants %}
                <li>{{ name }} — {{ registrants[name] }}</li>
            {% endfor %}
        </ul>
    </body>
</html>
`,
      },
      steps: [
        { n: "/ бетінде форма бар", m: "GET", u: "/", status: 200, has: ["<form"] },
        { n: "Есімсіз тіркелу → «Қате»", m: "POST", u: "/register", data: [["name", ""], ["sport", "Футбол"]], status: [200, 400], has: ["Қате"] },
        { n: "Жоқ спорт түрі → «Қате»", m: "POST", u: "/register", data: [["name", "Ерлан"], ["sport", "Хоккей"]], status: [200, 400], has: ["Қате"] },
        { n: "Дұрыс тіркелу → /registrants-ке redirect", m: "POST", u: "/register", data: [["name", "Аружан"], ["sport", "Тоғызқұмалақ"]], redirect: "/registrants" },
        { n: "/registrants ішінде Аружан бар", m: "GET", u: "/registrants", status: 200, has: ["Аружан", "Тоғызқұмалақ"] },
        { n: "Қате тіркелгендер тізімге кірмеген", m: "GET", u: "/registrants", status: 200, not: ["Ерлан", "Хоккей"] },
      ],
    },
    {
      id: "counter", t: "Санағыш (сессия)", lvl: "Қиын",
      d: "<code>/</code> бетін әр ашқан сайын санағыш өссін: «Сіз бұл бетті 3 рет аштыңыз». Санды <code>session</code>-да сақтаңыз (әр қолданушыға бөлек). <code>/reset</code> санағышты нөлдеп, <code>/</code>-ге бағыттасын.",
      start: {
        "app.py": `from flask import Flask, redirect, session
from flask_session import Session

app = Flask(__name__)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)


@app.route("/")
def index():
    # TODO: session["count"]-ты 1-ге арттырыңыз
    return "Сіз бұл бетті ? рет аштыңыз"


@app.route("/reset")
def reset():
    # TODO
    return redirect("/")
`,
      },
      steps: [
        { n: "1-ші ашу → 1 рет", m: "GET", u: "/", fresh: true, status: 200, re: "(^|\\D)1 рет" },
        { n: "2-ші ашу → 2 рет", m: "GET", u: "/", status: 200, re: "(^|\\D)2 рет" },
        { n: "3-ші ашу → 3 рет", m: "GET", u: "/", status: 200, re: "(^|\\D)3 рет" },
        { n: "Басқа қолданушыда санағыш бөлек", m: "GET", u: "/", fresh: true, status: 200, re: "(^|\\D)1 рет" },
        { n: "/reset → / бетіне redirect", m: "GET", u: "/reset", redirect: "/" },
        { n: "Нөлдегеннен кейін → 1 рет", m: "GET", u: "/", status: 200, re: "(^|\\D)1 рет" },
      ],
    },
  ];

  const NAV_SHIM = (path) => `<script>(function(){var P=${JSON.stringify(path)};
function go(m,u,d){parent.postMessage({cs50kzFlask:{method:m,url:u,data:d||null,from:P}},"*")}
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(!a)return;var h=a.getAttribute("href");if(/^#/.test(h))return;e.preventDefault();go("GET",h)});
document.addEventListener("submit",function(e){var f=e.target;e.preventDefault();var fd=new FormData(f,e.submitter||undefined),p=[];fd.forEach(function(v,k){p.push([k,String(v)])});
go(((e.submitter&&e.submitter.getAttribute("formmethod"))||f.getAttribute("method")||"GET").toUpperCase(),(e.submitter&&e.submitter.getAttribute("formaction"))||f.getAttribute("action")||P,p)});
var n=0,w={};window.fetch=function(u,o){o=o||{};var id=++n,hd=o.headers||{},ct=hd["Content-Type"]||hd["content-type"]||null;if(o.body instanceof URLSearchParams){ct="application/x-www-form-urlencoded"}
return new Promise(function(res){w[id]=res;parent.postMessage({cs50kzFetch:{id:id,url:String(u),method:(o.method||"GET").toUpperCase(),body:o.body!=null?String(o.body):null,ctype:ct,from:P}},"*")})};
addEventListener("message",function(e){var d=e.data&&e.data.cs50kzFetchRes;if(!d||!w[d.id])return;w[d.id](new Response(d.status===204?null:d.body,{status:d.status,headers:{"Content-Type":d.mimetype}}));delete w[d.id]});
})();<\/script>`;

  function flaskLab(el) {
    const KEY = "flask:files";
    let files = store.get(KEY, null) || JSON.parse(JSON.stringify(EXAMPLES["👋 Сәлем"]));
    let cur = "app.py", url = "/", hist = ["/"], hi = 0, timer = null, running = false, task = store.get("flask:task", null);
    el.innerHTML = `
      <div class="pg-examples fl-examples">${Object.keys(EXAMPLES).map((k) => `<button type="button">${esc(k)}</button>`).join("")}</div>
      <div class="fl-task-bar" hidden></div>
      <div class="we-grid fl-grid">
        <div class="we-edit">
          <div class="we-tabs"></div>
          <textarea class="pg-editor we-code fl-code" spellcheck="false" autocapitalize="off" aria-label="Файл мазмұны"></textarea>
        </div>
        <div class="we-view fl-view">
          <div class="we-bar fl-bar">
            <button type="button" class="fl-nav" data-go="-1" aria-label="Артқа">←</button>
            <button type="button" class="fl-nav" data-go="1" aria-label="Алға">→</button>
            <button type="button" class="fl-nav fl-reload" aria-label="Жаңарту">↻</button>
            <form class="fl-addr"><span>127.0.0.1:5000</span><input class="fl-url" aria-label="Мекенжай" spellcheck="false" autocapitalize="off" value="/"></form>
            <span class="fl-status"></span>
          </div>
          <div class="fl-screen">
            <iframe class="we-frame fl-frame" sandbox="allow-scripts allow-forms allow-modals" title="Flask қосымшасы"></iframe>
            <div class="fl-boot"><div><b>Flask қосымшасы әлі іске қосылмаған</b><p>Нағыз Flask браузеріңізде, Python (Pyodide) ішінде жұмыс істейді. Алғашқы іске қосу бірнеше секунд алады.</p><button type="button" class="btn gold fl-run-big">▶ flask run</button></div></div>
          </div>
        </div>
      </div>
      <div class="fl-actions">
        <button type="button" class="btn gold fl-run">▶ flask run</button>
        <span class="fl-routes"></span>
      </div>
      <div class="fl-term" role="log" aria-live="polite"><div class="fl-term-head"><span class="we-dots"><i></i><i></i><i></i></span>Терминал — сервер логы<button type="button" class="fl-clear">тазалау</button></div><pre class="fl-log"></pre></div>`;
    const $ = (s) => el.querySelector(s);
    const ed = $(".fl-code"), frame = $(".fl-frame"), log = $(".fl-log"), urlIn = $(".fl-url");
    const save = () => store.set(KEY, files);
    const order = (a, b) => (a === "app.py" ? -1 : b === "app.py" ? 1 : a.localeCompare(b));
    const tabs = () => {
      $(".we-tabs").innerHTML = Object.keys(files).sort(order).map((f) => `<button type="button" data-f="${esc(f)}" class="${f === cur ? "on" : ""}">${f.includes("/") ? `<small>${esc(f.slice(0, f.indexOf("/") + 1))}</small>${esc(f.slice(f.indexOf("/") + 1))}` : esc(f)}${f !== "app.py" ? `<span class="we-x" data-del="${esc(f)}" title="Өшіру">×</span>` : ""}</button>`).join("") +
        `<button type="button" class="we-add" title="Жаңа файл">+ файл</button>`;
    };
    const open = (f) => { cur = f; ed.value = files[f]; tabs(); };
    const write = (text, cls = "") => {
      const s = document.createElement("span");
      if (cls) s.className = cls;
      s.textContent = text.endsWith("\n") ? text : text + "\n";
      log.appendChild(s);
      while (log.childNodes.length > 300) log.firstChild.remove();
      log.scrollTop = log.scrollHeight;
    };
    const stCls = (s) => (s >= 500 ? "l-err" : s >= 400 ? "l-warn" : s >= 300 ? "l-redir" : "l-ok");

    function show(r, path) {
      const st = $(".fl-status");
      st.textContent = r.status;
      st.className = "fl-status " + stCls(r.status);
      let html;
      if (r.mimetype === "text/html") html = r.body;
      else if (!r.text && r.mimetype.startsWith("image/")) html = `<body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#222"><img src="data:${esc(r.mimetype)};base64,${r.body}"></body>`;
      else {
        let body = r.body;
        if (r.mimetype === "application/json") { try { body = JSON.stringify(JSON.parse(body), null, 2); } catch (e) {} }
        html = `<pre style="white-space:pre-wrap;word-break:break-word;font:13px/1.5 ui-monospace,monospace;margin:12px">${esc(body)}</pre>`;
      }
      const shim = NAV_SHIM(path);
      if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (m) => m + shim);
      else if (/<!doctype[^>]*>/i.test(html)) html = html.replace(/<!doctype[^>]*>/i, (m) => m + shim);
      else html = shim + html;
      frame.srcdoc = html;
    }

    const pretty = (u) => { try { return decodeURI(u); } catch (e) { return u; } };
    const resolve = (href, from) => {
      try {
        const u = new URL(href, ORIGIN + (from || url));
        if (u.origin !== ORIGIN) return null;
        return u.pathname + u.search;
      } catch (e) { return null; }
    };

    async function request(method, path, pairs, opts = {}) {
      const py = await getFlask();
      const fn = py.globals.get("__flask_req");
      let hops = 0, r;
      try {
        for (;;) {
          const pp = pairs ? py.toPy(pairs) : null;
          try { r = JSON.parse(fn(method, path, pp, opts.body ?? null, opts.ctype ?? null, "view")); } finally { pp && pp.destroy(); }
          if (r.status === 0) { write("Сервер іске қосылмаған. «▶ flask run» басыңыз.", "l-warn"); return null; }
          write(r.line, stCls(r.status));
          if (r.log) write(r.log.replace(/\n$/, ""), "l-print");
          if (r.error) write(r.error, "l-err");
          if (opts.fetch || r.status < 300 || r.status >= 400 || !r.location || hops++ >= 5) break;
          const next = resolve(r.location, path);
          if (next == null) break;
          method = "GET"; path = next; pairs = null; opts = {};
        }
      } finally { fn.destroy(); }
      return { r, path };
    }

    async function navigate(method, href, pairs, push = true) {
      const path = resolve(href);
      if (path == null) { window.open(href, "_blank", "noopener"); return; }
      let target = path;
      if (method === "GET" && pairs && pairs.length) {
        const u = new URL(ORIGIN + path);
        u.search = new URLSearchParams(pairs).toString();
        target = u.pathname + u.search;
        pairs = null;
      }
      const res = await request(method, target, method === "GET" ? null : pairs || []);
      if (!res) return;
      url = res.path;
      urlIn.value = pretty(url);
      if (push) { hist = hist.slice(0, hi + 1); hist.push(url); hi = hist.length - 1; }
      show(res.r, url);
      store.set("flask:url", url);
    }

    async function run(quiet) {
      if (running) return;
      running = true;
      const btns = el.querySelectorAll(".fl-run, .fl-run-big");
      btns.forEach((b) => { b.disabled = true; b.textContent = "⏳ Жүктелуде…"; });
      try {
        const first = !flaskReady;
        if (first) write("Python мен Flask жүктелуде (бір рет, ~5 МБ)…", "l-dim");
        const py = await getFlask();
        const src = Object.values(files).join("\n");
        const dbs = {};
        if (/\bSQL\s*\(|sqlite3/.test(src)) {
          await py.loadPackage("sqlite3");
          if (/shows\.db/.test(src)) {
            await K.loadScript("assets/data/db.js");
            if (window.CS50KZ_DB && window.CS50KZ_DB.shows) dbs["shows.db"] = window.CS50KZ_DB.shows;
          }
        }
        const fl = py.toPy(files), dd = py.toPy(dbs);
        const load = py.globals.get("__flask_load");
        const r = JSON.parse(load(fl, dd));
        load.destroy(); fl.destroy(); dd.destroy();
        if (!quiet) write("$ flask run", "l-cmd");
        if (r.log) write(r.log.replace(/\n$/, ""), "l-print");
        if (!r.ok) {
          write(r.error, "l-err");
          $(".fl-routes").innerHTML = "";
          $(".fl-status").textContent = "";
          frame.srcdoc = `<body style="font-family:system-ui;padding:24px;color:#9b1c1c"><h2>Қосымша іске қосылмады</h2><p>app.py ішіндегі қатені терминалдан қараңыз.</p></body>`;
        } else {
          if (!quiet) write(" * Serving Flask app 'app'\n * Running on http://127.0.0.1:5000", "l-dim");
          else write(" * Detected change, reloading", "l-dim");
          $(".fl-routes").innerHTML = "Маршруттар: " + r.routes.map((x) => `<button type="button" data-r="${esc(x)}">${esc(x)}</button>`).join("");
          $(".fl-boot").hidden = true;
          await navigate("GET", quiet ? url : urlIn.value || "/", null, !quiet);
          K.mark && K.mark("flask");
        }
      } catch (e) {
        write("Қате: " + (e.message || e) + "\nИнтернет байланысын тексеріп, қайта көріңіз.", "l-err");
      } finally {
        running = false;
        btns.forEach((b) => { b.disabled = false; b.textContent = b.classList.contains("fl-run") ? "↻ Қайта іске қосу" : "▶ flask run"; });
      }
    }

    // Файлдар
    $(".we-tabs").addEventListener("click", (e) => {
      const del = e.target.dataset.del;
      if (del) { if (confirm(`${del} файлын өшіру керек пе?`)) { delete files[del]; save(); open("app.py"); reload(); } return; }
      if (e.target.classList.contains("we-add")) {
        const n = (prompt("Файл аты:\n templates/about.html\n static/script.js\n helpers.py") || "").trim();
        if (!/^(templates\/[\w-]+\.html|static\/[\w-]+\.(css|js|svg|txt)|[\w]+\.py)$/.test(n)) { if (n) K.toast("Мысалы: templates/about.html, static/styles.css, helpers.py"); return; }
        if (files[n] == null) files[n] = n.startsWith("templates/") ? `{% extends "layout.html" %}\n\n{% block body %}\n    <h1>${n.slice(10, -5)}</h1>\n{% endblock %}\n` : "";
        save(); open(n); return;
      }
      const f = e.target.closest("button[data-f]");
      if (f) open(f.dataset.f);
    });
    const reload = () => { if (!$(".fl-boot").hidden) return; clearTimeout(timer); timer = setTimeout(() => run(true), 900); };
    ed.addEventListener("input", () => { files[cur] = ed.value; save(); reload(); });
    ed.addEventListener("keydown", (e) => { if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); ed.setRangeText("    ", ed.selectionStart, ed.selectionEnd, "end"); files[cur] = ed.value; save(); reload(); } });

    // Браузер
    el.querySelectorAll(".fl-run, .fl-run-big").forEach((b) => b.addEventListener("click", () => run(false)));
    $(".fl-addr").addEventListener("submit", (e) => { e.preventDefault(); if ($(".fl-boot").hidden) navigate("GET", urlIn.value.trim().replace(/^https?:\/\/[^/]+/, "") || "/"); else run(false); });
    $(".fl-reload").addEventListener("click", () => $(".fl-boot").hidden && navigate("GET", url, null, false));
    el.querySelectorAll(".fl-nav[data-go]").forEach((b) => b.addEventListener("click", () => {
      const j = hi + +b.dataset.go;
      if (j < 0 || j >= hist.length || !$(".fl-boot").hidden) return;
      hi = j; navigate("GET", hist[hi], null, false);
    }));
    $(".fl-routes").addEventListener("click", (e) => { const r = e.target.dataset.r; if (r) navigate("GET", r.replace(/<[^>]+>/g, "1")); });
    $(".fl-clear").addEventListener("click", () => (log.textContent = ""));
    window.addEventListener("message", async (e) => {
      if (e.source !== frame.contentWindow || !e.data) return;
      const nav = e.data.cs50kzFlask, f = e.data.cs50kzFetch;
      if (nav) navigate(nav.method, resolve(nav.url, nav.from) ?? nav.url, nav.data);
      if (f) {
        const path = resolve(f.url, f.from);
        const res = path == null ? null : await request(f.method, path, null, { fetch: true, body: f.body, ctype: f.ctype });
        const r = res ? res.r : { status: 502, body: "", mimetype: "text/plain" };
        frame.contentWindow && frame.contentWindow.postMessage({ cs50kzFetchRes: { id: f.id, status: r.status, body: r.body, mimetype: r.mimetype } }, "*");
      }
    });

    // Мысалдар
    $(".fl-examples").addEventListener("click", (e) => {
      if (e.target.tagName !== "BUTTON") return;
      files = JSON.parse(JSON.stringify(EXAMPLES[e.target.textContent]));
      setTask(null); save(); open("app.py");
      url = "/"; urlIn.value = "/"; hist = ["/"]; hi = 0;
      if ($(".fl-boot").hidden) run(true);
    });

    // Тапсырма
    function setTask(id) {
      task = id; store.set("flask:task", id);
      const bar = $(".fl-task-bar"), t = TASKS.find((x) => x.id === id);
      bar.hidden = !t;
      if (t) bar.innerHTML = `<span>🎯 Тапсырма: <b>${esc(t.t)}</b></span><button type="button" class="btn gold fl-check">✅ Тексеру</button><a href="#fl-tasks">Шарты ↓</a>`;
    }
    $(".fl-task-bar").addEventListener("click", (e) => { if (e.target.classList.contains("fl-check")) checkTask(task); });

    async function checkTask(id) {
      const t = TASKS.find((x) => x.id === id), card = document.querySelector(`.fl-task[data-id="${id}"]`);
      if (!t || !card) return;
      const list = card.querySelector(".ag-results"), score = card.querySelector(".ag-score");
      list.innerHTML = t.steps.map((s) => `<li class="wait"><span class="ag-ico">○</span>${esc(s.n)}</li>`).join("");
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      let py;
      try { py = await getFlask(); } catch (e) { score.textContent = "Python жүктелмеді — интернетті тексеріңіз"; return; }
      if (/\bSQL\s*\(|sqlite3/.test(Object.values(files).join("\n"))) await py.loadPackage("sqlite3");
      const fl = py.toPy(files), load = py.globals.get("__flask_load"), req = py.globals.get("__flask_req");
      const boot = JSON.parse(load(fl, null));
      fl.destroy(); load.destroy();
      let pass = 0;
      t.steps.forEach((s, i) => {
        const li = list.children[i];
        let ok = false, why = "";
        if (!boot.ok) why = boot.error;
        else {
          const pp = s.data ? py.toPy(s.data) : null;
          const r = JSON.parse(req(s.m, s.u, pp, null, null, i === 0 || s.fresh ? "check-new" : "check"));
          pp && pp.destroy();
          const body = r.text ? r.body : "";
          const st = Array.isArray(s.status) ? s.status : s.status != null ? [s.status] : null;
          if (r.error) why = r.error;
          else if (s.redirect && !(r.status >= 300 && r.status < 400 && resolve(r.location || "", s.u) === s.redirect)) why = `Күтілгені: ${s.redirect} бетіне redirect. Алынғаны: ${r.status}${r.location ? " → " + r.location : ""}`;
          else if (st && !st.includes(r.status)) why = `Күтілген статус: ${st.join(" не ")}, алынғаны: ${r.status}`;
          else if (s.has && s.has.some((x) => !body.includes(x))) why = `Жауапта «${s.has.find((x) => !body.includes(x))}» жоқ`;
          else if (s.not && s.not.some((x) => body.includes(x))) why = `Жауапта «${s.not.find((x) => body.includes(x))}» болмауы керек`;
          else if (s.re && !new RegExp(s.re).test(body.replace(/<[^>]+>/g, " "))) why = "Жауаптағы сан не мәтін күтілгендей емес";
          else ok = true;
          if (!ok && !r.error) why += `\n\nЖауап (${r.status}):\n` + body.replace(/\s+\n/g, "\n").slice(0, 400);
        }
        if (ok) pass++;
        li.className = ok ? "ok" : "bad";
        li.innerHTML = `<span class="ag-ico">${ok ? "✓" : "✗"}</span>${esc(s.n)}` + (ok ? "" : `<pre class="fl-why">${esc(why)}</pre>`);
      });
      req.destroy();
      // Зертханадағы браузер жаңа жүктелген қосымшамен жалғасады
      if (boot.ok && $(".fl-boot").hidden) navigate("GET", url, null, false);
      score.textContent = `${pass} / ${t.steps.length}`;
      if (pass === t.steps.length) {
        const done = store.get("cs50kz:flask", {});
        if (!done[id]) { done[id] = Date.now(); store.set("cs50kz:flask", done); }
        card.classList.add("done");
        K.celebrate(); K.toast("🎉 Тапсырма орындалды!");
        K.check && K.check();
        K.bump && K.bump("trainer");
      }
    }

    const tbox = document.querySelector(".fl-tasks");
    if (tbox) {
      const done = store.get("cs50kz:flask", {});
      tbox.innerHTML = TASKS.map((t, i) => `
        <div class="task fl-task ${done[t.id] ? "done" : ""}" data-id="${t.id}">
          <div class="task-head"><span class="badge ${i < 2 ? "easy" : i < 3 ? "medium" : "hard"}">${t.lvl}</span><h3>${i + 1}. ${esc(t.t)}</h3><span class="fl-done">✓ Орындалды</span></div>
          <p>${t.d}</p>
          <div class="pg-actions"><button type="button" class="btn secondary fl-start">✍️ Зертханада бастау</button><button type="button" class="btn gold fl-test">✅ Тексеру</button><span class="ag-score"></span></div>
          <ul class="ag-results"></ul>
        </div>`).join("");
      tbox.addEventListener("click", (e) => {
        const card = e.target.closest(".fl-task");
        if (!card) return;
        const t = TASKS.find((x) => x.id === card.dataset.id);
        if (e.target.classList.contains("fl-start")) {
          const saved = store.get("flask:task-files:" + t.id, null);
          files = saved || JSON.parse(JSON.stringify(t.start));
          setTask(t.id); save(); open("app.py");
          url = "/"; urlIn.value = "/"; hist = ["/"]; hi = 0;
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          if ($(".fl-boot").hidden) run(true);
        }
        if (e.target.classList.contains("fl-test")) {
          if (task !== t.id) { K.toast("Алдымен «Зертханада бастау» басыңыз — тексеру зертханадағы кодқа жасалады"); return; }
          checkTask(t.id);
        }
      });
    }
    // Тапсырма коды бөлек сақталады
    ed.addEventListener("input", () => { if (task) store.set("flask:task-files:" + task, files); });

    setTask(task);
    open(files["app.py"] != null ? "app.py" : Object.keys(files)[0]);
    url = store.get("flask:url", "/");
    urlIn.value = pretty(url);
  }

  document.querySelectorAll(".flask-lab").forEach(flaskLab);
})();
