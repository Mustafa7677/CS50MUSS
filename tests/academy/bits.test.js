// © 2026 Sagid Mustafa. All Rights Reserved.
// AO17 екілік жүйе қозғалтқышының тесттері: node tests/academy/bits.test.js (JS ⇄ тәуелсіз Python салыстыру бар)
const B = require("../../assets/js/academy-bits.js");
const { execFileSync } = require("child_process");
const path = require("path");
let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("FAIL:", m)));
ok(B.convert("101101", 2, 10) === "45" && B.convert("255", 10, 16) === "FF" && B.convert("777", 8, 2) === "111111111" && B.convert("-1A", 16, 10) === "-26", "аударулар");
ok(B.toBase(2n ** 64n, 16) === "10000000000000000", "BigInt");
ok(B.expansion("1011", 2) === "1·2^3 + 0·2^2 + 1·2^1 + 1·2^0", "жайылу");
ok(B.twos(-5, 8) === "11111011" && B.twos(127, 8) === "01111111" && B.twos(-128, 8) === "10000000", "қосымша код");
ok(B.fromTwos("11111011") === -5n && B.fromTwos("0111") === 7n, "қосымша кодтан");
const ov = B.addBits("01111111", "00000001", 8);
ok(ov.overflow && ov.sum === "10000000" && ov.value === -128n, "асып кету: 127 + 1 = -128 (8 бит)");
ok(!B.addBits("11111011", "00000101", 8).overflow && B.addBits("11111011", "00000101", 8).value === 0n, "-5 + 5 = 0");
const f = B.float32(0.1);
ok(f.bits === "00111101110011001100110011001101" && f.unbiased === -4 && f.stored !== 0.1, "0.1 float32-де дәл емес");
ok(B.float32(-2).bits === "11000000000000000000000000000000" && B.float32(1 / 0).kind === "∞", "float32 шеткі");
ok(B.utf8Hex("A") === "41" && B.utf8Hex("ә") === "D3 99" && B.utf8Hex("Қ") === "D2 9A" && B.utf8Hex("€") === "E2 82 AC" && B.utf8Hex("😀") === "F0 9F 98 80", "UTF-8");
ok(B.utf8("Аә")[1].hex === "U+04D9", "код нүктесі");
ok(B.parity("1011") === "1" && B.parity("1001") === "0", "жұптық бит");
ok(B.bitExpr("0b1100 & 0b1010") === 8n && B.bitExpr("0b1100 | 0b1010") === 14n && B.bitExpr("0b1100 ^ 0b1010") === 6n && B.bitExpr("~0", 8) === 255n && B.bitExpr("1 << 7") === 128n && B.bitExpr("1 << 8") === 0n && B.bitExpr("0xF0 >> 4") === 15n, "биттік өрнектер");
ok(B.rle("AAABBC") === "3A2B1C" && B.rle("") === "", "RLE");
const th = (fn) => { try { fn(); return false; } catch (e) { return e instanceof B.BitsError; } };
ok(th(() => B.fromBase("102", 2)) && th(() => B.twos(200, 8)) && th(() => B.bitExpr("3 &")), "қате хабарлары");
// JS ⇄ Python
let seed = 11;
const rnd = (n) => ((seed = (seed * 1103515245 + 12345) % 2147483648), seed % n);
const cases = [];
for (let i = 0; i < 200; i++) cases.push({ v: rnd(1000000) - 500000, b: 2 + rnd(35), bits: 8 + rnd(3) * 8, f: (rnd(20000) - 10000) / 64 });
const texts = ["Алаш", "Қазақстан", "әіңғүұқөһ", "AO17 €😀", ""];
const exprs = ["0b1100 & 0b1010", "~0x0F & 0xFF", "(1 << 5) | 3", "0xAA ^ 0x55", "200 >> 3 << 1", "0b1011 + 0b0110", "1 << 2 + 1", "5 - 7", "0xFF + 1"];
const jsOut = { conv: cases.map((c) => B.toBase(c.v, c.b)), tw: cases.map((c) => { try { return B.twos(c.v % 100, c.bits); } catch (e) { return "ERR"; } }),
  fl: cases.map((c) => B.float32(c.f).bits), u8: texts.map(B.utf8Hex), bx: exprs.map((e) => String(B.bitExpr(e))), rl: texts.map(B.rle) };
const py = `import json,sys\nsys.path.insert(0,${JSON.stringify(path.resolve(__dirname, "../../tools/academy"))})\nimport pbits as B\nd=json.loads(sys.stdin.read())\ndef tw(v,b):\n    try: return B.twos(int(v),b)\n    except ValueError: return "ERR"\nprint(json.dumps({"conv":[B.to_base(c["v"],c["b"]) for c in d["cases"]],"tw":[tw(int(c["v"]) % 100 if c["v"]>=0 else -((-c["v"]) % 100),c["bits"]) for c in d["cases"]],"fl":[B.float32_bits(c["f"]) for c in d["cases"]],"u8":[B.utf8_hex(t) for t in d["texts"]],"bx":[str(B.bit_expr(e)) for e in d["exprs"]],"rl":[B.rle(t) for t in d["texts"]]}))`;
const pyOut = JSON.parse(execFileSync("python3", ["-I", "-c", py], { input: JSON.stringify({ cases, texts, exprs }), encoding: "utf8" }));
for (const k of Object.keys(jsOut)) jsOut[k].forEach((v, i) => ok(v === pyOut[k][i], `${k}[${i}] JS=${v} Python=${pyOut[k][i]}`));
console.log(`academy bits: ${pass} өтті, ${fail} өтпеді`);
process.exit(fail ? 1 : 0);
