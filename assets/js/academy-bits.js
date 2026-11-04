/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
// AO17 CS Universe: ақпарат және екілік жүйе қозғалтқышы.
// Санау жүйелері (2-36, BigInt), қосымша код (n бит), IEEE 754 float32 бөлшектеу, UTF-8, жұптық бит, биттік өрнектер, RLE.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.AOBits = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  class BitsError extends Error {}
  const DIG = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  function fromBase(str, base) {
    const s = String(str).trim().toUpperCase().replace(/[\s_]/g, "");
    if (!s) throw new BitsError("Сан бос");
    let neg = false, t = s;
    if (t[0] === "-") { neg = true; t = t.slice(1); }
    if (!t) throw new BitsError("Сан толық емес");
    let v = 0n;
    for (const ch of t) {
      const d = DIG.indexOf(ch);
      if (d < 0 || d >= base) throw new BitsError(`«${ch}» цифры ${base}-лік жүйеде жоқ (рұқсат: ${DIG.slice(0, base)})`);
      v = v * BigInt(base) + BigInt(d);
    }
    return neg ? -v : v;
  }
  function toBase(v, base) {
    v = BigInt(v);
    if (base < 2 || base > 36) throw new BitsError("Жүйе негізі 2..36");
    if (v === 0n) return "0";
    const neg = v < 0n;
    if (neg) v = -v;
    let s = "";
    while (v > 0n) { s = DIG[Number(v % BigInt(base))] + s; v /= BigInt(base); }
    return (neg ? "-" : "") + s;
  }
  const convert = (str, from, to) => toBase(fromBase(str, from), to);
  // Позициялық жайылу: 1011₂ = 1·2³ + 0·2² + 1·2¹ + 1·2⁰
  function expansion(str, base) {
    const s = String(str).trim().toUpperCase();
    fromBase(s, base);
    const n = s.length;
    return [...s].map((ch, i) => `${DIG.indexOf(ch)}·${base}^${n - 1 - i}`).join(" + ");
  }
  // Қосымша код: n бит
  function twos(v, bits) {
    v = BigInt(v);
    const lo = -(1n << BigInt(bits - 1)), hi = (1n << BigInt(bits - 1)) - 1n;
    if (v < lo || v > hi) throw new BitsError(`${bits} битке ${lo}..${hi} аралығы ғана сыяды`);
    const u = v < 0n ? (1n << BigInt(bits)) + v : v;
    return toBase(u, 2).padStart(bits, "0");
  }
  function fromTwos(bitsStr) {
    const s = String(bitsStr).trim();
    if (!/^[01]+$/.test(s)) throw new BitsError("Тек 0 мен 1");
    const u = BigInt("0b" + s);
    return s[0] === "1" ? u - (1n << BigInt(s.length)) : u;
  }
  // Қосу (n бит, асып кетуді тексеру)
  function addBits(a, b, bits) {
    const x = fromTwos(a), y = fromTwos(b), s = x + y;
    const lo = -(1n << BigInt(bits - 1)), hi = (1n << BigInt(bits - 1)) - 1n;
    const wrapped = ((s - lo) % (1n << BigInt(bits)) + (1n << BigInt(bits))) % (1n << BigInt(bits)) + lo;
    return { sum: twos(wrapped, bits), value: wrapped, overflow: s < lo || s > hi, exact: s };
  }
  // IEEE 754 float32
  function float32(x) {
    const buf = new DataView(new ArrayBuffer(4));
    buf.setFloat32(0, Number(x));
    const u = buf.getUint32(0);
    const bits = u.toString(2).padStart(32, "0");
    const sign = bits[0], exp = bits.slice(1, 9), man = bits.slice(9);
    const e = parseInt(exp, 2);
    return { bits, sign, exponent: exp, mantissa: man, stored: buf.getFloat32(0), e, unbiased: e - 127, kind: e === 255 ? (parseInt(man, 2) ? "NaN" : "∞") : e === 0 ? (parseInt(man, 2) ? "субнормал" : "нөл") : "қалыпты" };
  }
  // UTF-8
  function utf8(text) {
    return [...String(text)].map((ch) => {
      const cp = ch.codePointAt(0);
      const bytes = [...new TextEncoder().encode(ch)];
      return { ch, cp, hex: "U+" + cp.toString(16).toUpperCase().padStart(4, "0"), bytes, bytesHex: bytes.map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ") };
    });
  }
  const utf8Hex = (text) => [...new TextEncoder().encode(String(text))].map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
  // Жұптық бит (жұп жұптылық): бірліктер саны жұп болатындай
  const parity = (bitsStr) => ([...String(bitsStr)].filter((c) => c === "1").length % 2 ? "1" : "0");
  // Биттік өрнек: сандар (ондық, 0b..., 0x...), & | ^ ~ << >> және жақша; нәтиже теріс емес бүтін
  function bitExpr(src, width) {
    const s = String(src);
    const t = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      const m = /^(0b[01]+|0x[0-9a-fA-F]+|\d+)/.exec(s.slice(i));
      if (m) { t.push({ t: "num", v: BigInt(m[1]) }); i += m[1].length; continue; }
      if (s.substr(i, 2) === "<<" || s.substr(i, 2) === ">>") { t.push({ t: s.substr(i, 2) }); i += 2; continue; }
      if ("&|^~()+-".includes(c)) { t.push({ t: c }); i++; continue; }
      throw new BitsError(`Түсініксіз таңба «${c}»`);
    }
    t.push({ t: "end" });
    let k = 0;
    const W = BigInt(width || 8), MASK = (1n << W) - 1n;
    const PREC = { "|": 1, "^": 2, "&": 3, "<<": 4, ">>": 4, "+": 5, "-": 5 };   // C тіліндегі басымдық
    function prim() {
      const x = t[k++];
      if (x.t === "num") return x.v;
      if (x.t === "~") return ~prim() & MASK;
      if (x.t === "(") { const v = ex(0); if (t[k++].t !== ")") throw new BitsError("Жақша жабылмаған"); return v; }
      throw new BitsError("Өрнек толық емес");
    }
    function ex(min) {
      let a = prim();
      while (t[k].t in PREC && PREC[t[k].t] >= min) {
        const op = t[k++].t, b = ex(PREC[op] + 1);
        a = op === "&" ? a & b : op === "|" ? a | b : op === "^" ? a ^ b : op === "<<" ? (a << b) & MASK : op === ">>" ? a >> b : op === "+" ? (a + b) & MASK : (a - b) & MASK;
      }
      return a;
    }
    const v = ex(0);
    if (t[k].t !== "end") throw new BitsError("Өрнектің соңы түсініксіз");
    return v & MASK;
  }
  // Ұзындық бойынша кодтау (RLE): "AAAB" -> "3A1B"
  function rle(text) {
    const s = [...String(text)];   // код нүктелері бойынша (эмодзи екіге бөлінбесін)
    let out = "";
    for (let i = 0; i < s.length;) { let j = i; while (j < s.length && s[j] === s[i]) j++; out += (j - i) + s[i]; i = j; }
    return out;
  }
  return { fromBase, toBase, convert, expansion, twos, fromTwos, addBits, float32, utf8, utf8Hex, parity, bitExpr, rle, BitsError };
});
