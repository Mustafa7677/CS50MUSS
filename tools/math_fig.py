# © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама (LICENSE-PROPRIETARY.md, COPYRIGHT.md).
"""Математика сызбалары: ықшам сипаттамадан дәл SVG (tools/math_explain.py қолданады).

Координаталық сызба:
  Plot(x=(xmin, xmax), y=(ymin, ymax), items=[...], w=440, h=300, grid=True, xl="x", yl="y")
Элементтер (координаталар - математикалық, пиксель емес):
  fn("x**2", c=1, dom=(a, b), dash=False, label=None, lx=None)   - функция графигі (Python өрнегі, math модулімен)
  par("cos(t)", "sin(t)", (0, 2*pi), c=1)                           - параметрлік қисық
  pt(x, y, hollow=False, label=None, c=1)                           - нүкте (қуыс - «тесік»)
  seg(x1, y1, x2, y2, dash=False, c=0, arrow=False)                 - кесінді / нұсқар
  vline(x, dash=True, label=None) / hline(y, dash=True, label=None)  - тік / көлденең түзу
  band_y(y0, y1, label=None, c=2) / band_x(x0, x1, label=None, c=3) - жолақ (ε, δ маңайлары)
  area("f", a, b, g="0", c=1)                                       - f пен g арасындағы аудан
  rects("f", a, b, n, mode="left", c=2)                             - Риман тіктөртбұрыштары
  vec(x1, y1, x2, y2, label=None, c=1)                              - вектор
  poly([(x, y), ...], fill=True, c=1) / circ(x, y, r, c=1)
  txt(x, y, "мәтін", c=0, anchor="start")
Диаграмма (осьсіз):  Diagram(w, h, items=[node(x, y, "A"), edge("A", "B", label=None, arrow=False), ...])
Түстер: c=0 - мәтін түсі, 1..4 - пәннің түсі мен көмекші түстер (CSS: .mf-c1 ... .mf-c4).
"""
import html
import math

PAD_L, PAD_R, PAD_T, PAD_B = 34, 14, 14, 26


def _tick(span):
    raw = span / 6
    p = 10 ** math.floor(math.log10(raw))
    for m in (1, 2, 5, 10):
        if raw <= m * p:
            return m * p
    return 10 * p


def _num(v):
    s = f"{v:.4f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s.replace("-", "−").replace(".", ",")


def _f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


ENV = {k: getattr(math, k) for k in dir(math) if not k.startswith("_")}
ENV.update(abs=abs, min=min, max=max)


def _fun(expr, var="x"):
    code = compile(expr.replace("^", "**"), expr, "eval")

    def f(v):
        try:
            r = eval(code, {"__builtins__": {}}, dict(ENV, **{var: v}))
            r = float(r)
            return r if math.isfinite(r) else None
        except (ValueError, ZeroDivisionError, OverflowError, TypeError):
            return None
    return f


# ---------------------------------------------------------------- элементтер (сипаттама)
def fn(e, c=1, dom=None, dash=False, label=None, lx=None):
    return ("fn", dict(e=e, c=c, dom=dom, dash=dash, label=label, lx=lx))


def par(ex, ey, tr, c=1, dash=False):
    return ("par", dict(ex=ex, ey=ey, tr=tr, c=c, dash=dash))


def pt(x, y, hollow=False, label=None, c=1, pos="ne"):
    return ("pt", dict(x=x, y=y, hollow=hollow, label=label, c=c, pos=pos))


def seg(x1, y1, x2, y2, dash=False, c=0, arrow=False, label=None):
    return ("seg", dict(x1=x1, y1=y1, x2=x2, y2=y2, dash=dash, c=c, arrow=arrow, label=label))


def vline(x, dash=True, label=None, c=0):
    return ("vline", dict(x=x, dash=dash, label=label, c=c))


def hline(y, dash=True, label=None, c=0):
    return ("hline", dict(y=y, dash=dash, label=label, c=c))


def band_y(y0, y1, label=None, c=2):
    return ("band_y", dict(y0=y0, y1=y1, label=label, c=c))


def band_x(x0, x1, label=None, c=3):
    return ("band_x", dict(x0=x0, x1=x1, label=label, c=c))


def area(f, a, b, g="0", c=1):
    return ("area", dict(f=f, g=g, a=a, b=b, c=c))


def rects(f, a, b, n, mode="left", c=2):
    return ("rects", dict(f=f, a=a, b=b, n=n, mode=mode, c=c))


def vec(x1, y1, x2, y2, label=None, c=1):
    return ("seg", dict(x1=x1, y1=y1, x2=x2, y2=y2, dash=False, c=c, arrow=True, label=label, w=2.4))


def poly(ps, fill=True, c=1):
    return ("poly", dict(ps=ps, fill=fill, c=c))


def circ(x, y, r, c=1, fill=False):
    return ("circ", dict(x=x, y=y, r=r, c=c, fill=fill))


def txt(x, y, s, c=0, anchor="start"):
    return ("txt", dict(x=x, y=y, s=s, c=c, anchor=anchor))


def node(x, y, name, label=None, c=1):
    return ("node", dict(x=x, y=y, name=name, label=label if label is not None else name, c=c))


def edge(a, b, label=None, arrow=False, c=0, bend=0):
    return ("edge", dict(a=a, b=b, label=label, arrow=arrow, c=c, bend=bend))


def Plot(x, y, items, w=440, h=300, grid=True, xl="x", yl="y", ticks=True, legend=None, eq=False, axes=True):
    """axes=False - жазық осьтер салынбайды (мысалы, кеңістіктің қиғаш проекциясында осьтерді өзіміз саламыз).
    legend: None - қисық атаулары қисықтың жанында; "tl" / "br" - атаулар бұрыштағы шартты белгілер тізімінде.
    eq=True - осьтердің масштабы бірдей (шеңбер шеңбер болып көрінеді): биіктік енге қарай есептеледі."""
    if eq:
        h = round(PAD_T + PAD_B + (y[1] - y[0]) * (w - PAD_L - PAD_R) / (x[1] - x[0]))
    return dict(type="plot", x=x, y=y, items=items, w=w, h=h, grid=grid, xl=xl, yl=yl, ticks=ticks, legend=legend, axes=axes)


def Diagram(w, h, items):
    return dict(type="diagram", w=w, h=h, items=items)


# ---------------------------------------------------------------- SVG
def _arrowdefs(uid):
    return (f'<defs><marker id="ah{uid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M0 0L10 5L0 10z" class="mf-ahead"/></marker></defs>')


_W = [440]  # ағымдағы сызбаның ені: жазу шетке шығып кетпесін


def _label(x, y, s, cls="mf-lab", anchor="start", dy=0):
    tw = 6.9 * len(s) + 4  # мәтін енінің бағасы (12,5px қаріп)
    W = _W[0]
    if anchor == "start" and x + tw > W - 2:
        x, anchor = W - 2, "end"
    elif anchor == "end" and x - tw < 2:
        x, anchor = 2, "start"
    elif anchor == "middle":
        x = min(max(x, 2 + tw / 2), W - 2 - tw / 2)
    return f'<text x="{_f(x)}" y="{_f(y + dy)}" class="{cls}" text-anchor="{anchor}">{html.escape(s)}</text>'


def render(spec, uid, alt):
    _W[0] = spec["w"]
    if spec["type"] == "diagram":
        return _diagram(spec, uid, alt)
    W, H = spec["w"], spec["h"]
    (x0, x1), (y0, y1) = spec["x"], spec["y"]
    sx = (W - PAD_L - PAD_R) / (x1 - x0)
    sy = (H - PAD_T - PAD_B) / (y1 - y0)
    X = lambda v: PAD_L + (v - x0) * sx  # noqa: E731
    Y = lambda v: H - PAD_B - (v - y0) * sy  # noqa: E731
    clip = f'<clipPath id="cp{uid}"><rect x="{PAD_L}" y="{PAD_T}" width="{_f(W - PAD_L - PAD_R)}" height="{_f(H - PAD_T - PAD_B)}"/></clipPath>'
    out = [f'<svg class="mf" viewBox="0 0 {W} {H}" role="img" aria-label="{html.escape(alt)}">', _arrowdefs(uid), f"<defs>{clip}</defs>"]
    tx, ty = _tick(x1 - x0), _tick(y1 - y0)
    if spec["grid"]:
        g = []
        v = math.ceil(x0 / tx) * tx
        while v <= x1 + 1e-9:
            g.append(f"M{_f(X(v))} {PAD_T}V{_f(H - PAD_B)}")
            v += tx
        v = math.ceil(y0 / ty) * ty
        while v <= y1 + 1e-9:
            g.append(f"M{PAD_L} {_f(Y(v))}H{_f(W - PAD_R)}")
            v += ty
        out.append(f'<path class="mf-grid" d="{"".join(g)}"/>')
    ax = Y(0) if y0 <= 0 <= y1 else H - PAD_B
    ay = X(0) if x0 <= 0 <= x1 else PAD_L
    body, top = [], []
    for kind, o in spec["items"]:
        cls = f'mf-c{o.get("c", 1)}'
        if kind in ("band_y", "band_x"):
            if kind == "band_y":
                body.append(f'<rect class="mf-band {cls}" x="{PAD_L}" y="{_f(Y(o["y1"]))}" width="{_f(W - PAD_L - PAD_R)}" height="{_f(Y(o["y0"]) - Y(o["y1"]))}"/>')
                if o["label"]:
                    top.append(_label(W - PAD_R - 4, Y(o["y1"]) - 4, o["label"], f"mf-lab {cls}", "end"))
            else:
                body.append(f'<rect class="mf-band {cls}" x="{_f(X(o["x0"]))}" y="{PAD_T}" width="{_f(X(o["x1"]) - X(o["x0"]))}" height="{_f(H - PAD_T - PAD_B)}"/>')
                if o["label"]:
                    top.append(_label((X(o["x0"]) + X(o["x1"])) / 2, PAD_T + 12, o["label"], f"mf-lab {cls}", "middle"))
        elif kind == "area":
            f, g = _fun(o["f"]), _fun(o["g"])
            n = 120
            xs = [o["a"] + (o["b"] - o["a"]) * i / n for i in range(n + 1)]
            up = [(X(v), Y(f(v) or 0)) for v in xs]
            dn = [(X(v), Y(g(v) or 0)) for v in reversed(xs)]
            d = "M" + "L".join(f"{_f(a)} {_f(b)}" for a, b in up + dn) + "Z"
            body.append(f'<path class="mf-area {cls}" d="{d}" clip-path="url(#cp{uid})"/>')
        elif kind == "rects":
            f = _fun(o["f"])
            hgt = (o["b"] - o["a"]) / o["n"]
            for i in range(o["n"]):
                xa = o["a"] + i * hgt
                xm = {"left": xa, "right": xa + hgt, "mid": xa + hgt / 2}[o["mode"]]
                v = f(xm) or 0
                yt, yb = (Y(v), Y(0)) if v >= 0 else (Y(0), Y(v))
                body.append(f'<rect class="mf-rect {cls}" x="{_f(X(xa))}" y="{_f(yt)}" width="{_f(hgt * sx)}" height="{_f(yb - yt)}"/>')
        elif kind == "poly":
            d = "M" + "L".join(f"{_f(X(a))} {_f(Y(b))}" for a, b in o["ps"]) + "Z"
            body.append(f'<path class="{"mf-area" if o["fill"] else "mf-line"} {cls}" d="{d}"/>')
    out += body
    if spec["axes"]:
        out.append(f'<path class="mf-axis" d="M{PAD_L} {_f(ax)}H{W - PAD_R + 6}" marker-end="url(#ah{uid})"/>')
        out.append(f'<path class="mf-axis" d="M{_f(ay)} {H - PAD_B}V{PAD_T - 6}" marker-end="url(#ah{uid})"/>')
    if spec["ticks"]:
        t = []
        v = math.ceil(x0 / tx) * tx
        while v <= x1 + 1e-9:
            if abs(v) > 1e-9:
                t.append(_label(X(v), ax + 15, _num(v), "mf-tick", "middle"))
            v += tx
        v = math.ceil(y0 / ty) * ty
        while v <= y1 + 1e-9:
            if abs(v) > 1e-9:
                t.append(_label(ay - 5, Y(v) + 4, _num(v), "mf-tick", "end"))
            v += ty
        out += t
        if x0 <= 0 <= x1 and y0 <= 0 <= y1:
            out.append(_label(ay - 5, ax + 15, "0", "mf-tick", "end"))
    if spec["axes"]:
        out.append(_label(W - PAD_R + 2, ax - 6, spec["xl"], "mf-axl", "end"))
        out.append(_label(ay + 7, PAD_T + 4, spec["yl"], "mf-axl"))
    legend = []
    for kind, o in spec["items"]:
        cls = f'mf-c{o.get("c", 1)}'
        dash = " mf-dash" if o.get("dash") else ""
        if kind in ("fn", "par"):
            if kind == "fn":
                f = _fun(o["e"])
                a, b = o["dom"] or (x0, x1)
                n = 400
                ps = [(a + (b - a) * i / n,) for i in range(n + 1)]
                ps = [(v[0], f(v[0])) for v in ps]
            else:
                fx, fy = _fun(o["ex"], "t"), _fun(o["ey"], "t")
                a, b = o["tr"]
                n = 400
                ps = [(fx(a + (b - a) * i / n), fy(a + (b - a) * i / n)) for i in range(n + 1)]
            segs, cur, lim = [], [], (y1 - y0) * 3
            for xv, yv in ps:
                if xv is None or yv is None or abs(yv) > abs(y0) + abs(y1) + lim:
                    if len(cur) > 1:
                        segs.append(cur)
                    cur = []
                    continue
                if cur and abs(yv - cur[-1][1]) > (y1 - y0) * 0.9:  # үзіліс (тік асимптота)
                    segs.append(cur)
                    cur = []
                cur.append((xv, yv))
            if len(cur) > 1:
                segs.append(cur)
            d = "".join("M" + "L".join(f"{_f(X(p[0]))} {_f(Y(p[1]))}" for p in s) for s in segs)
            out.append(f'<path class="mf-fn {cls}{dash}" d="{d}" clip-path="url(#cp{uid})"/>')
            if kind == "fn" and o["label"] and spec.get("legend"):
                legend.append((cls, dash, o["label"]))
            elif kind == "fn" and o["label"]:
                lx = o["lx"] if o["lx"] is not None else a + (b - a) * 0.85
                ly = f(lx)
                if ly is not None:
                    out.append(_label(X(lx) + 6, max(PAD_T + 10, min(H - PAD_B - 4, Y(ly) - 8)), o["label"], f"mf-lab {cls}"))
        elif kind == "vline":
            out.append(f'<path class="mf-line {cls}{" mf-dash" if o["dash"] else ""}" d="M{_f(X(o["x"]))} {PAD_T}V{H - PAD_B}"/>')
            if o["label"]:
                out.append(_label(X(o["x"]), H - PAD_B + 15 if not (y0 <= 0 <= y1) else ax + 15, o["label"], f"mf-lab {cls}", "middle"))
        elif kind == "hline":
            out.append(f'<path class="mf-line {cls}{" mf-dash" if o["dash"] else ""}" d="M{PAD_L} {_f(Y(o["y"]))}H{W - PAD_R}"/>')
            if o["label"]:
                out.append(_label(ay - 5 if x0 <= 0 <= x1 else PAD_L - 4, Y(o["y"]) + 4, o["label"], f"mf-lab {cls}", "end"))
        elif kind == "seg":
            m = f' marker-end="url(#ah{uid})"' if o["arrow"] else ""
            sw = f' style="stroke-width:{o["w"]}"' if o.get("w") else ""
            out.append(f'<path class="mf-line {cls}{dash}" d="M{_f(X(o["x1"]))} {_f(Y(o["y1"]))}L{_f(X(o["x2"]))} {_f(Y(o["y2"]))}"{m}{sw}/>')
            if o["label"]:
                out.append(_label((X(o["x1"]) + X(o["x2"])) / 2 + 6, (Y(o["y1"]) + Y(o["y2"])) / 2 - 6, o["label"], f"mf-lab {cls}"))
        elif kind == "circ":
            out.append(f'<ellipse class="{"mf-area" if o["fill"] else "mf-fn"} {cls}" cx="{_f(X(o["x"]))}" cy="{_f(Y(o["y"]))}" rx="{_f(o["r"] * sx)}" ry="{_f(o["r"] * sy)}"/>')
        elif kind == "pt":
            out.append(f'<circle class="mf-pt {cls}{" mf-hole" if o["hollow"] else ""}" cx="{_f(X(o["x"]))}" cy="{_f(Y(o["y"]))}" r="4.2"/>')
            if o["label"]:
                dx, dy, anc = {"ne": (7, -8, "start"), "nw": (-7, -8, "end"), "se": (7, 16, "start"), "sw": (-7, 16, "end"), "n": (0, -10, "middle"), "s": (0, 18, "middle")}[o["pos"]]
                out.append(_label(X(o["x"]) + dx, Y(o["y"]) + dy, o["label"], f"mf-lab {cls}", anc))
        elif kind == "txt":
            out.append(_label(X(o["x"]), Y(o["y"]), o["s"], f"mf-lab {cls}", o["anchor"]))
    out += top
    if legend:
        lw = 26 + 7.2 * max(len(t) for _, _, t in legend)
        lx = PAD_L + 8 if spec["legend"] == "tl" else W - PAD_R - 8 - lw
        ly = PAD_T + 8 if spec["legend"] == "tl" else H - PAD_B - 8 - 17 * len(legend) - 6
        out.append(f'<rect class="mf-legend" x="{_f(lx)}" y="{_f(ly)}" width="{_f(lw)}" height="{17 * len(legend) + 6}" rx="6"/>')
        for i, (cls, dash, t) in enumerate(legend):
            yy = ly + 14 + 17 * i
            out.append(f'<path class="mf-fn {cls}{dash}" d="M{_f(lx + 7)} {_f(yy - 4)}h16"/>')
            out.append(_label(lx + 28, yy, t, "mf-lab"))
    out.append("</svg>")
    return "".join(out)


def _diagram(spec, uid, alt):
    W, H = spec["w"], spec["h"]
    nodes = {o["name"]: o for k, o in spec["items"] if k == "node"}
    out = [f'<svg class="mf" viewBox="0 0 {W} {H}" role="img" aria-label="{html.escape(alt)}">', _arrowdefs(uid)]
    R = 17
    for kind, o in spec["items"]:
        if kind == "edge":
            a, b = nodes[o["a"]], nodes[o["b"]]
            dx, dy = b["x"] - a["x"], b["y"] - a["y"]
            L = math.hypot(dx, dy) or 1
            ux, uy = dx / L, dy / L
            xa, ya, xb, yb = a["x"] + ux * R, a["y"] + uy * R, b["x"] - ux * (R + (3 if o["arrow"] else 0)), b["y"] - uy * (R + (3 if o["arrow"] else 0))
            m = f' marker-end="url(#ah{uid})"' if o["arrow"] else ""
            if o["bend"]:
                cx, cy = (xa + xb) / 2 - uy * o["bend"], (ya + yb) / 2 + ux * o["bend"]
                out.append(f'<path class="mf-line mf-c{o["c"]}" d="M{_f(xa)} {_f(ya)}Q{_f(cx)} {_f(cy)} {_f(xb)} {_f(yb)}"{m}/>')
                lx, ly = cx, cy
            else:
                out.append(f'<path class="mf-line mf-c{o["c"]}" d="M{_f(xa)} {_f(ya)}L{_f(xb)} {_f(yb)}"{m}/>')
                lx, ly = (xa + xb) / 2 - uy * 10, (ya + yb) / 2 + ux * 10
            if o["label"]:
                out.append(_label(lx, ly + 4, o["label"], "mf-lab mf-c0", "middle"))
    for kind, o in spec["items"]:
        if kind == "node":
            out.append(f'<circle class="mf-node mf-c{o["c"]}" cx="{o["x"]}" cy="{o["y"]}" r="{R}"/>')
            out.append(_label(o["x"], o["y"] + 5, o["label"], "mf-nlab", "middle"))
        elif kind == "txt":
            out.append(_label(o["x"], o["y"], o["s"], f'mf-lab mf-c{o["c"]}', o["anchor"]))
    out.append("</svg>")
    return "".join(out)
