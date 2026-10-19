/* QazaqCode: оқушының ӨЗ браузеріндегі Python «жеке тексеру» worker-і (Pyodide / WebAssembly).
 * Бұл серверде орындау емес: код осы браузердің ішінде ғана жұмыс істейді. Нәтиже серверге жіберілмейді.
 * Протокол (docs/SELFCHECK.md):
 *   main -> worker : {type:"run", cases:[{input:string}], code:string}
 *   worker -> main : {type:"loading"} {type:"ready"} {type:"case", index, stdout, stderr, error, ms, truncated} {type:"done"} {type:"fatal", message}
 * Таймаутты main ағыны қадағалайды (шексіз цикл worker-ді қатырады): мерзімі өтсе main worker-ді terminate етеді.
 */
"use strict";
var MAX_OUT = 64 * 1024; // stdout/stderr шегі (символ), әрқайсысы бөлек
var py = null;
var busy = false;

function post(m) { self.postMessage(m); }

// Желі/сыртқы шығуды жабу: Pyodide жүктелгеннен кейін, оқушы коды іске қосылмай тұрып.
// Толық кепілдік емес (docs/SELFCHECK.md «Шектеулер»): қосымша қабат ретінде қолданылады, негізгі шектеу - CSP (connect-src 'self').
function lockdown() {
  var names = ["fetch", "XMLHttpRequest", "WebSocket", "EventSource", "Worker", "SharedWorker", "importScripts",
    "indexedDB", "caches", "BroadcastChannel", "WebTransport", "RTCPeerConnection"];
  var protos = [self, Object.getPrototypeOf(self), Object.getPrototypeOf(Object.getPrototypeOf(self))];
  names.forEach(function (n) {
    protos.forEach(function (o) {
      if (!o) return;
      try { delete o[n]; } catch (e) { /* ignore */ }
      try { if (n in o) Object.defineProperty(o, n, { value: undefined, configurable: false, writable: false }); } catch (e) { /* ignore */ }
    });
  });
  try { if (self.navigator) Object.defineProperty(Object.getPrototypeOf(self.navigator), "sendBeacon", { value: undefined }); } catch (e) { /* ignore */ }
}

async function init() {
  post({ type: "loading" });
  importScripts("/vendor/pyodide/pyodide.js");
  py = await self.loadPyodide({ indexURL: "/vendor/pyodide/", fullStdLib: false });
  // Python жағынан js/pyodide_js модульдерін импорттауды қиындату (бұғат емес, тек кедергі)
  py.runPython("import sys\nfor _m in ('js', 'pyodide_js'):\n    sys.modules[_m] = None\ndel _m");
  lockdown();
  post({ type: "ready" });
}

function clip(state, s) {
  if (state.len >= MAX_OUT) { state.truncated = true; return; }
  var room = MAX_OUT - state.len;
  if (s.length > room) { s = s.slice(0, room); state.truncated = true; }
  state.parts.push(s); state.len += s.length;
}

function runCase(code, input, index) {
  var out = { parts: [], len: 0, truncated: false }, err = { parts: [], len: 0, truncated: false };
  var lines = String(input).split("\n"), pos = 0;
  var hasInput = String(input) !== "";
  py.setStdin({ stdin: function () { if (!hasInput || pos >= lines.length) return null; return lines[pos++]; } });
  py.setStdout({ batched: function (s) { clip(out, s + "\n"); } });
  py.setStderr({ batched: function (s) { clip(err, s + "\n"); } });
  var t0 = performance.now(), error = null;
  var ns = null;
  try {
    ns = py.globals.get("dict")(); // әр іске қосуда таза namespace
    ns.set("__name__", "__main__");
    py.runPython(code, { globals: ns, filename: "<сіздің_код>" });
  } catch (e) {
    error = String((e && e.message) || e);
    // Pyodide traceback-ін қысқарту: тек соңғы жолдар (оқушыға түсінікті)
    var ls = error.trim().split("\n"); error = ls.slice(-8).join("\n");
  } finally {
    try { if (ns) ns.destroy(); } catch (e) { /* ignore */ }
  }
  post({ type: "case", index: index, stdout: out.parts.join(""), stderr: err.parts.join(""), error: error, ms: Math.round(performance.now() - t0), truncated: out.truncated || err.truncated });
}

self.onmessage = function (ev) {
  var m = ev.data || {};
  if (m.type !== "run" || busy || !py) return; // бір мезгілде 1 жұмыс
  if (typeof m.code !== "string" || !Array.isArray(m.cases)) return;
  busy = true;
  try {
    for (var i = 0; i < m.cases.length; i++) runCase(m.code, typeof m.cases[i].input === "string" ? m.cases[i].input : "", i);
    post({ type: "done" });
  } catch (e) {
    post({ type: "fatal", message: String((e && e.message) || e) });
  } finally { busy = false; }
};

init().catch(function (e) { post({ type: "fatal", message: "Pyodide жүктелмеді: " + String((e && e.message) || e) }); });
