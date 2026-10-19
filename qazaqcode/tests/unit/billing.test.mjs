// Шот есебі: ҚҚС дәлдігі, тиын дөңгелектеу, ақша пішімі/талдауы, шот нөмірлеу.
import { test } from "node:test";
import assert from "node:assert/strict";
import { vatSplit, formatMoney, parseAmountToTiyn, parsePercentToBp, formatPercent } from "../../src/lib/billing/money.ts";
import { formatInvoiceNo, parseInvoiceNo, nextInvoiceNo } from "../../src/lib/billing/invoice-no.ts";

test("ҚҚС: none/added/included негізгі жағдайлар", () => {
  assert.deepEqual(vatSplit(10000, "none", 0), { net: 10000, vat: 0, total: 10000 });
  assert.deepEqual(vatSplit(10000, "added", 1200), { net: 10000, vat: 1200, total: 11200 });
  assert.deepEqual(vatSplit(11200, "included", 1200), { net: 10000, vat: 1200, total: 11200 });
  assert.deepEqual(vatSplit(0, "added", 1200), { net: 0, vat: 0, total: 0 });
});

test("тиын дөңгелектеу: жартысынан жоғары (half up), шекаралар", () => {
  assert.equal(vatSplit(1, "added", 1200).vat, 0);      // 0,12
  assert.equal(vatSplit(4, "added", 1200).vat, 0);      // 0,48
  assert.equal(vatSplit(5, "added", 1200).vat, 1);      // 0,60
  assert.equal(vatSplit(4, "added", 1250).vat, 1);      // 0,50 -> жоғары
  assert.equal(vatSplit(3, "added", 1250).vat, 0);      // 0,375
  assert.equal(vatSplit(12, "added", 1250).vat, 2);     // 1,50 -> 2
  assert.equal(vatSplit(100, "included", 1200).vat, 11); // 10,714
  assert.equal(vatSplit(112, "included", 1200).vat, 12); // нақты 12
  assert.equal(vatSplit(1, "included", 1200).vat, 0);   // 0,107
  assert.equal(vatSplit(9, "included", 1200).vat, 1);   // 0,964
});

test("net + vat = total әрқашан; included-те total = баға, added-те net = баға (кең тексеру)", () => {
  for (const p of [1, 2, 3, 7, 99, 100, 101, 999, 12345, 99999999, 100000001, 999999999999])
    for (const bp of [1, 100, 500, 1200, 1250, 1600, 2000, 4999, 5000])
      for (const m of ["added", "included"]) {
        const r = vatSplit(p, m, bp);
        assert.equal(r.net + r.vat, r.total, `${p} ${m} ${bp}`);
        assert.ok(r.vat >= 0 && r.net >= 0);
        assert.equal(m === "included" ? r.total : r.net, p);
      }
});

test("ҚҚС: BigInt-пен үлкен соманың дәлдігі (float қатесі жоқ)", () => {
  // 0,1+0,2 типті float қателері жоқ: 33333333333 тиын x 12% = 3999999999,96 -> 4000000000
  assert.equal(vatSplit(33333333333, "added", 1200).vat, 4000000000);
  // 999 999 999 999 x 12% = 119 999 999 999,88 -> 120 000 000 000
  assert.deepEqual(vatSplit(999999999999, "added", 1200), { net: 999999999999, vat: 120000000000, total: 1119999999999 });
});

test("ҚҚС: жарамсыз кіріс RangeError береді", () => {
  assert.throws(() => vatSplit(-1, "none", 0), RangeError);
  assert.throws(() => vatSplit(1.5, "none", 0), RangeError);
  assert.throws(() => vatSplit(100, "added", 5001), RangeError);
  assert.throws(() => vatSplit(100, "added", -1), RangeError);
  assert.throws(() => vatSplit(100, "xxx", 0), RangeError);
  assert.throws(() => vatSplit(2_000_000_000_000, "none", 0), RangeError);
});

test("ақша пішімі: топтау, 2 ондық, валюта белгісі", () => {
  assert.equal(formatMoney(0), "0,00 ₸");
  assert.equal(formatMoney(5), "0,05 ₸");
  assert.equal(formatMoney(123456789, "KZT"), "1 234 567,89 ₸");
  assert.equal(formatMoney("100000000000", "USD"), "1 000 000 000,00 $");
  assert.equal(formatMoney(100, "KZT", { symbol: false }), "1,00 KZT");
  assert.equal(formatMoney(100, "XYZ"), "1,00 XYZ");
});

test("соманы талдау: үтір/нүкте, бос орын, қате пішімдер", () => {
  assert.equal(parseAmountToTiyn("1 250 000,00"), 125000000);
  assert.equal(parseAmountToTiyn("1250000.5"), 125000050);
  assert.equal(parseAmountToTiyn("0,01"), 1);
  assert.equal(parseAmountToTiyn("12"), 1200);
  for (const bad of ["", "0", "0,00", "-5", "1,234", "abc", "1e5", "1,2,3", "12 ₸", "99999999999999"]) assert.equal(parseAmountToTiyn(bad), null, bad);
});

test("ставканы талдау: 12 -> 1200, 12,5 -> 1250, шектер", () => {
  assert.equal(parsePercentToBp("12"), 1200);
  assert.equal(parsePercentToBp("12,5"), 1250);
  assert.equal(parsePercentToBp("12.25%"), 1225);
  assert.equal(parsePercentToBp("0"), 0);
  assert.equal(parsePercentToBp("50"), 5000);
  for (const bad of ["", "51", "-1", "1,234", "x", "100"]) assert.equal(parsePercentToBp(bad), null, bad);
  assert.equal(formatPercent(1200), "12%");
  assert.equal(formatPercent(1250), "12,5%");
});

test("шот нөмірлеу: пішім, талдау, дәйектілік, жыл ауысуы", () => {
  assert.equal(formatInvoiceNo(2026, 1), "2026-00001");
  assert.equal(formatInvoiceNo(2026, 99999), "2026-99999");
  assert.deepEqual(parseInvoiceNo("2026-00042"), { year: 2026, n: 42 });
  for (const bad of ["", "2026-1", "26-00001", "2026-000001", "2026/00001", "abcd-00001"]) assert.equal(parseInvoiceNo(bad), null, bad);
  assert.throws(() => formatInvoiceNo(2026, 0), RangeError);
  assert.throws(() => formatInvoiceNo(2026, 100000), RangeError);
  assert.equal(nextInvoiceNo(2026, null), "2026-00001");
  assert.equal(nextInvoiceNo(2026, { year: 2026, n: 41 }), "2026-00042");
  assert.equal(nextInvoiceNo(2027, { year: 2026, n: 41 }), "2027-00001", "жаңа жылда қайта басталады");
  // тізбек: қайталанбайды
  const seen = new Set(); let last = null;
  for (let i = 0; i < 500; i++) { const no = nextInvoiceNo(2026, last); assert.ok(!seen.has(no)); seen.add(no); last = parseInvoiceNo(no); }
});
