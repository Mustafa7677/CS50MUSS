// Pyodide қажет ететін тесттер (баяу): Python сынақ алаңы мен Flask зертханасы.
const { test, expect } = require("@playwright/test");
const { routePyodide, blockFonts, collectErrors } = require("../support/helpers");

test.beforeEach(async ({ context }) => { await routePyodide(context); await blockFonts(context); });

test("сынақ алаңы: Python коды орындалады @slow", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("playground.html");
  await page.fill(".pg-editor", 'print(sum(range(101)))\nprint("сәлем, " + "әлем")');
  await page.click(".pg-run");
  await expect(page.locator(".pg-output")).toContainText("5050", { timeout: 60_000 });
  await expect(page.locator(".pg-output")).toContainText("сәлем, әлем");
  expect(errs).toEqual([]);
});

test("Flask зертханасы: мысалдар, форма, сессия, 4 тапсырма @slow", async ({ page }) => {
  test.setTimeout(180_000);
  const errs = collectErrors(page);
  await page.goto("flask.html");
  await page.click(".fl-run-big");
  const fr = page.frameLocator(".fl-frame");
  await fr.locator("text=Сәлем, әлем!").waitFor({ timeout: 90_000 });
  await fr.locator("a", { hasText: "Аружан" }).click();
  await fr.locator("text=Сәлем, Аружан!").waitFor();
  await expect(page.locator(".fl-url")).toHaveValue("/?name=Аружан");

  await page.click('.fl-examples button:has-text("Тіркелу")');
  await fr.locator("input[name=name]").fill("Аружан");
  await fr.locator('input[value="Тоғызқұмалақ"]').check();
  await fr.locator("button[type=submit]").click();
  await fr.locator("td", { hasText: "Тоғызқұмалақ" }).waitFor();
  await expect(page.locator(".fl-log")).toContainText('"POST /register HTTP/1.1" 302');

  await page.click('.fl-examples button:has-text("Кіру")');
  await fr.locator("a", { hasText: "Кіру" }).click();
  await fr.locator("input[name=name]").fill("Дәулет");
  await fr.locator("button[type=submit]").click();
  await fr.locator("text=Қош келдіңіз, Дәулет!").waitFor();

  const SOL = {
    hello: { "app.py": 'from flask import Flask, render_template, request\n\napp = Flask(__name__)\n\n\n@app.route("/")\ndef index():\n    return render_template("index.html", name=request.args.get("name", "әлем"))\n',
             "templates/index.html": "<!DOCTYPE html><html><head><title>x</title></head><body>Сәлем, {{ name }}!</body></html>" },
    add: { "app.py": 'from flask import Flask, abort, request\n\napp = Flask(__name__)\n\n\n@app.route("/add")\ndef add():\n    try:\n        a = int(request.args.get("a"))\n        b = int(request.args.get("b"))\n    except (TypeError, ValueError):\n        abort(400)\n    return str(a + b)\n' },
    froshims: { "app.py": 'from flask import Flask, redirect, render_template, request\n\napp = Flask(__name__)\nREGISTRANTS = {}\nSPORTS = ["Баскетбол", "Футбол", "Волейбол", "Тоғызқұмалақ"]\n\n\n@app.route("/")\ndef index():\n    return render_template("index.html", sports=SPORTS)\n\n\n@app.route("/register", methods=["POST"])\ndef register():\n    name = request.form.get("name")\n    sport = request.form.get("sport")\n    if not name or sport not in SPORTS:\n        return render_template("failure.html", message="жоқ")\n    REGISTRANTS[name] = sport\n    return redirect("/registrants")\n\n\n@app.route("/registrants")\ndef registrants():\n    return render_template("registrants.html", registrants=REGISTRANTS)\n' },
    counter: { "app.py": 'from flask import Flask, redirect, session\nfrom flask_session import Session\n\napp = Flask(__name__)\nSession(app)\n\n\n@app.route("/")\ndef index():\n    session["count"] = session.get("count", 0) + 1\n    return f"Сіз бұл бетті {session[\'count\']} рет аштыңыз"\n\n\n@app.route("/reset")\ndef reset():\n    session.clear()\n    return redirect("/")\n' },
  };
  for (const [id, files] of Object.entries(SOL)) {
    const card = page.locator(`.fl-task[data-id="${id}"]`);
    await card.locator(".fl-start").click();
    for (const [f, txt] of Object.entries(files)) { await page.click(`.we-tabs button[data-f="${f}"]`); await page.fill(".fl-code", txt); }
    await card.locator(".fl-test").click();
    await expect(card.locator("li.wait")).toHaveCount(0, { timeout: 60_000 });
    await expect(card.locator("li.bad")).toHaveCount(0);
  }
  expect(Object.keys(await page.evaluate(() => JSON.parse(localStorage.getItem("cs50kz:flask"))))).toHaveLength(4);
  expect(errs).toEqual([]);
});

test("автотексеруші жүргізушісі: sys.exit хабары, argv, файлдар мен модуль, seed, EOF @slow", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("playground.html");
  const r = await page.evaluate(async () => {
    const py = await window.CS50KZ.getPyodide();
    const run = py.globals.get("__cs50kz_run");
    const call = (src, inp = [], argv = null, files = null, seed = null) =>
      run(src, py.toPy(inp), argv && py.toPy(argv), files && py.toPy(files), 2000000, seed).toJs();
    return {
      exit: call('import sys\nsys.exit("Too few command-line arguments")'),
      argv: call("import sys\nprint(len(sys.argv), sys.argv[1])", [], ["x.py", "a.txt"]),
      // Әр тестте модульдің жаңа нұсқасы жүктеледі (кэште қалмайды)
      mod1: call("from m import f\nprint(f())", [], null, { "m.py": "def f(): return 1" }),
      mod2: call("from m import f\nprint(f())", [], null, { "m.py": "def f(): return 2" }),
      seed: [call("import random\nprint(random.randint(1, 100))", [], null, null, 7), call("import random\nprint(random.randint(1, 100))", [], null, null, 7)],
      eof: call("try:\n    while True: input()\nexcept EOFError:\n    print('done')", ["a", "b"]),
    };
  });
  expect(r.exit[0]).toBe("Too few command-line arguments\n");
  expect(r.argv[0]).toBe("2 a.txt\n");
  expect([r.mod1[0], r.mod2[0]]).toEqual(["1\n", "2\n"]);
  expect(r.seed[0][0]).toBe(r.seed[1][0]);
  expect(r.eof[0]).toBe("done\n");
});
