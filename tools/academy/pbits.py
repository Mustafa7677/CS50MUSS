# © 2026 Sagid Mustafa. All Rights Reserved.
"""AO17: ақпарат және екілік жүйенің Python-дағы ТӘУЕЛСІЗ іске асырылуы (JS: assets/js/academy-bits.js)."""
import re
import struct

DIG = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def from_base(s, b):
    s = s.strip().upper().replace("_", "").replace(" ", "")
    return int(s, b)


def to_base(v, b):
    if v == 0:
        return "0"
    neg, v, out = v < 0, abs(v), ""
    while v:
        out = DIG[v % b] + out
        v //= b
    return ("-" if neg else "") + out


def convert(s, f, t):
    return to_base(from_base(s, f), t)


def twos(v, bits):
    lo, hi = -(1 << (bits - 1)), (1 << (bits - 1)) - 1
    if not lo <= v <= hi:
        raise ValueError("сыймайды")
    return format(v & ((1 << bits) - 1), f"0{bits}b")


def from_twos(s):
    u = int(s, 2)
    return u - (1 << len(s)) if s[0] == "1" else u


def float32_bits(x):
    return format(struct.unpack(">I", struct.pack(">f", x))[0], "032b")


def utf8_hex(text):
    return " ".join(f"{b:02X}" for b in text.encode("utf-8"))


def parity(s):
    return "1" if s.count("1") % 2 else "0"


def bit_expr(src, width=8):
    toks = re.findall(r"0b[01]+|0x[0-9a-fA-F]+|\d+|<<|>>|[&|^~()+-]", src)
    if "".join(toks) != re.sub(r"\s+", "", src):
        raise ValueError("түсініксіз")
    toks.append(None)
    mask = (1 << width) - 1
    prec = {"|": 1, "^": 2, "&": 3, "<<": 4, ">>": 4, "+": 5, "-": 5}
    k = [0]

    def prim():
        x = toks[k[0]]
        k[0] += 1
        if x is None:
            raise ValueError("толық емес")
        if x == "~":
            return ~prim() & mask
        if x == "(":
            v = ex(0)
            k[0] += 1
            return v
        return int(x, 0)

    def ex(mn):
        a = prim()
        while toks[k[0]] in prec and prec[toks[k[0]]] >= mn:
            op = toks[k[0]]
            k[0] += 1
            b = ex(prec[op] + 1)
            a = {"&": a & b, "|": a | b, "^": a ^ b, "<<": (a << b) & mask, ">>": a >> b, "+": (a + b) & mask, "-": (a - b) & mask}[op]
        return a

    v = ex(0)
    return v & mask


def rle(s):
    out, i = "", 0
    while i < len(s):
        j = i
        while j < len(s) and s[j] == s[i]:
            j += 1
        out += f"{j - i}{s[i]}"
        i = j
    return out
