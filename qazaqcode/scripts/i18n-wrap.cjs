// Қалған қазақша жолдарды t("...") шақыруына орайтын құрал (docs/I18N.md). Қолдану: node scripts/i18n-wrap.cjs <файл...>; кейін npx tsc --noEmit.
// i18n codemod: node codemod.cjs <file...>  (writes in place; prints report)
const ts = require("typescript");
const fs = require("fs");
const CYR = /[Ѐ-ӿ]/;
const LABELS = new Set("STATUS_LABEL,KIND_LABEL,DIFFICULTY_LABEL,ROLE_LABEL,PLAN_LABEL,LICENSE_STATE_LABEL,LEAD_STATUS_LABEL,LEAD_ROLE_LABEL,LEAD_TYPE_LABEL".split(",").concat((process.env.LABELS||"").split(",")));
const SKIP_ATTR = new Set(["className", "href", "id", "value", "htmlFor", "key", "type", "pattern", "src", "role", "action", "method", "autoComplete", "inputMode", "target", "rel", "style", "variant", "tone", "kind", "icon", "lang", "dir"]);
const ENT = { nbsp: " ", laquo: "«", raquo: "»", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", mdash: "—", ndash: "–", hellip: "…", middot: "·", times: "×", rarr: "→", larr: "←", copy: "©" };
const decodeEnt = (s) => s.replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (m, e) => e[0] === "#" ? String.fromCodePoint(e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : (ENT[e] ?? m));

function cookJsxText(raw) {
  const lines = raw.split(/\r\n|\n|\r/);
  let out = "";
  const last = lines.length - 1;
  let first = true;
  const parts = [];
  lines.forEach((l, i) => {
    let s = l.replace(/\t/g, " ");
    if (i !== 0) s = s.replace(/^[ ]+/, "");
    if (i !== last) s = s.replace(/[ ]+$/, "");
    if (s) parts.push(s);
  });
  return decodeEnt(parts.join(" "));
}

function run(file) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const isClient = /^\s*(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*["']use client["']/.test(src);
  const report = [];
  let needStatusLabel = false;
  const topFns = new Map(); // fn node -> true
  const moduleVars = new Map(); // VariableStatement -> {decl names}
  const T_BINDINGS = [];
  (function findT(n) { if ((ts.isParameter(n) || ts.isVariableDeclaration(n) || ts.isBindingElement(n)) && ts.isIdentifier(n.name) && n.name.text === "t") T_BINDINGS.push(n); ts.forEachChild(n, findT); })(sf);
  const isFn = (n) => ts.isFunctionDeclaration(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isMethodDeclaration(n);

  function topOf(node) {
    let fn = null, cur = node.parent;
    let moduleStmt = null;
    while (cur && cur.kind !== ts.SyntaxKind.SourceFile) {
      if (isFn(cur)) fn = cur;
      if (cur.parent && cur.parent.kind === ts.SyntaxKind.SourceFile) moduleStmt = cur;
      cur = cur.parent;
    }
    return { fn, moduleStmt };
  }
  function record(node) {
    const { fn, moduleStmt } = topOf(node);
    if (fn) topFns.set(fn, true);
    else if (moduleStmt) moduleVars.set(moduleStmt, true);
  }
  const q = (s) => JSON.stringify(s);
  const SIMPLE_PARAM = (e) => {
    let hasJsx = false;
    (function w(n) { if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n)) hasJsx = true; ts.forEachChild(n, w); })(e);
    return !hasJsx;
  };
  function nameFor(e, used) {
    let base = "v";
    let x = e;
    while (ts.isNonNullExpression(x) || ts.isParenthesizedExpression(x) || ts.isAsExpression(x)) x = x.expression;
    if (ts.isIdentifier(x)) base = x.text;
    else if (ts.isPropertyAccessExpression(x)) base = x.name.text;
    else if (ts.isCallExpression(x)) { const c = x.expression; base = ts.isIdentifier(c) ? c.text : ts.isPropertyAccessExpression(c) ? c.name.text : "v"; }
    else if (ts.isElementAccessExpression(x)) base = ts.isIdentifier(x.expression) ? x.expression.text : "v";
    base = base.replace(/[^A-Za-z0-9_]/g, "") || "v";
    if (!/^[A-Za-z_]/.test(base)) base = "v" + base;
    let n = base, i = 2;
    while (used.has(n)) n = base + i++;
    used.add(n);
    return n;
  }
  function applySlice(start, end, edits) {
    const es = edits.filter((e) => e.start >= start && e.end <= end).sort((a, b) => a.start - b.start);
    let out = "", p = start;
    for (const e of es) { out += src.slice(p, e.start) + e.text; p = e.end; }
    return out + src.slice(p, end);
  }
  const callT = (key, params) => `t(${q(key)}${params ? ", " + params : ""})`;

  function skipStringCtx(n) {
    const p = n.parent;
    if (!p) return true;
    if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p)) return true;
    if (ts.isLiteralTypeNode(p) || ts.isTypeNode(p)) return true;
    if ((ts.isPropertyAssignment(p) || ts.isPropertySignature(p) || ts.isEnumMember(p) || ts.isMethodDeclaration(p)) && p.name === n) return true;
    if (ts.isElementAccessExpression(p) && p.argumentExpression === n) return true;
    if (ts.isCallExpression(p)) {
      const c = p.expression;
      const nm = ts.isIdentifier(c) ? c.text : ts.isPropertyAccessExpression(c) ? c.name.text : "";
      const obj = ts.isPropertyAccessExpression(c) && ts.isIdentifier(c.expression) ? c.expression.text : "";
      if (obj === "console") return true;
      if (["q", "query", "withUser", "raw", "N", "t", "require", "RegExp"].includes(nm) && (nm !== "t" ? true : true)) return true;
    }
    if (ts.isTaggedTemplateExpression(p)) return true;
    if (ts.isCaseClause(p) && p.expression === n) report.push(`case-literal @${lineOf(n)}`);
    return false;
  }
  const lineOf = (n) => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;

  function collect(node, edits) {
    // JSX children grouping
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      const kids = node.children;
      let i = 0;
      while (i < kids.length) {
        // find group start
        let j = i, group = [], hasCyr = false;
        const okKid = (k) => ts.isJsxText(k) || (ts.isJsxExpression(k) && k.expression && !k.dotDotDotToken && SIMPLE_PARAM(k.expression));
        while (j < kids.length && okKid(kids[j])) {
          const k = kids[j];
          if (ts.isJsxText(k)) { if (CYR.test(cookJsxText(src.slice(k.pos, k.end)))) hasCyr = true; }
          group.push(k); j++;
        }
        if (group.length && hasCyr) {
          // trim non-cyr expression kids from group edges? keep leading/trailing expressions only if adjacent to text; strip edge expressions
          let a = 0, b = group.length;
          while (a < b && !ts.isJsxText(group[a])) a++;
          while (b > a && !ts.isJsxText(group[b - 1])) b--;
          // leading/trailing exprs outside group are left alone but must still be collected
          for (let x = 0; x < a; x++) collect(group[x], edits);
          for (let x = b; x < group.length; x++) collect(group[x], edits);
          const g = group.slice(a, b);
          // split group into sub-groups where text pieces w/o cyrillic and only whitespace? keep as single
          const used = new Set();
          let text = "", params = [];
          let simple = true;
          for (const k of g) {
            if (ts.isJsxText(k)) text += cookJsxText(src.slice(k.pos, k.end));
            else {
              const ex = k.expression;
              if (ts.isStringLiteral(ex) && !CYR.test(ex.text) && /^\s*$/.test(ex.text)) { text += ex.text; continue; }
              if (ts.isStringLiteral(ex) || ts.isNoSubstitutionTemplateLiteral(ex)) { text += ex.text; continue; }
              const nm = nameFor(ex, used);
              const sub = []; collect(ex, sub);
              params.push([nm, applySlice(ex.getStart(), ex.end, sub)]);
              text += `{${nm}}`;
            }
          }
          const lead = /^\s*/.exec(text)[0], trail = /\s*$/.exec(text)[0];
          const core = text.slice(lead.length, text.length - trail.length);
          if (core && CYR.test(core)) {
            const ps = params.length ? `{ ${params.map(([n, v]) => (n === v ? n : `${n}: ${v}`)).join(", ")} }` : undefined;
            if (/[{}]/.test(core.replace(/\{\w+\}/g, ""))) report.push(`brace-in-text @${lineOf(g[0])}`);
            let out = "";
            if (lead) out += `{${q(lead)}}`;
            out += `{${callT(core, ps)}}`;
            if (trail) out += `{${q(trail)}}`;
            const start = g[0].getFullStart() === g[0].getStart() ? g[0].getStart() : g[0].getStart();
            let sIdx = ts.isJsxText(g[0]) ? g[0].pos : g[0].getStart(), eIdx = g[g.length - 1].end;
            if (!lead && ts.isJsxText(g[0])) { const raw = src.slice(g[0].pos, g[0].end); sIdx += raw.length - raw.replace(/^\s+/, "").length; }
            if (!trail && ts.isJsxText(g[g.length - 1])) { const raw = src.slice(g[g.length - 1].pos, g[g.length - 1].end); eIdx -= raw.length - raw.replace(/\s+$/, "").length; }
            edits.push({ start: sIdx, end: eIdx, text: out });
            record(g[0]);
          } else for (const k of g) collect(k, edits);
          i = j;
          continue;
        }
        // no group: collect first kid normally
        if (j === i) { collect(kids[i], edits); i++; } else { for (let x = i; x < j; x++) collect(kids[x], edits); i = j; }
      }
      // also opening/closing elements attributes
      if (ts.isJsxElement(node)) collect(node.openingElement, edits);
      return;
    }
    if ((ts.isElementAccessExpression(node) || ts.isPropertyAccessExpression(node)) && ts.isIdentifier(node.expression) && LABELS.has(node.expression.text)) {
      const p = node.parent;
      if (!(ts.isCallExpression(p) && p.expression.getText() === "t")) {
        let target = node;
        if (ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken && p.left === node) target = p;
        const sub = []; ts.forEachChild(target, (c) => { if (c === node) ts.forEachChild(node, (cc) => collect(cc, sub)); else collect(c, sub); });
        edits.push({ start: target.getStart(), end: target.end, text: `t(${applySlice(target.getStart(), target.end, sub)})` });
        record(node);
        return;
      }
    }
    if ((ts.isJsxSelfClosingElement(node)) && node.tagName.getText() === "StatusBadge" && !node.attributes.properties.some((a) => ts.isJsxAttribute(a) && a.name.getText() === "label")) {
      const sa = node.attributes.properties.find((a) => ts.isJsxAttribute(a) && a.name.getText() === "status");
      if (sa && sa.initializer) {
        const e = ts.isJsxExpression(sa.initializer) ? sa.initializer.expression.getText() : sa.initializer.getText();
        edits.push({ start: node.end - 2, end: node.end - 2, text: ` label={t(STATUS_LABEL[${e}] ?? ${e})}` });
        record(node); needStatusLabel = true;
      }
    }
    if (ts.isJsxAttribute(node)) {
      const nm = node.name.getText();
      const init = node.initializer;
      if (init && ts.isStringLiteral(init) && CYR.test(init.text) && (SKIP_ATTR.has(nm) || nm.startsWith("data-"))) { report.push(`skipped-attr ${nm} @${lineOf(node)}`); return; }
      if (init && ts.isStringLiteral(init) && CYR.test(init.text) && !SKIP_ATTR.has(nm) && !nm.startsWith("data-")) {
        edits.push({ start: init.getStart(), end: init.end, text: `{${callT(decodeEnt(init.text))}}` });
        record(node);
        return;
      }
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (CYR.test(node.text) && !skipStringCtx(node)) {
        if ((ts.isBindingElement(node.parent) || ts.isParameter(node.parent)) && node.parent.initializer === node) { report.push(`param-default @${lineOf(node)}`); return; }
        const p = node.parent;
        if (ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.PlusToken) report.push(`concat @${lineOf(node)}`);
        const inJsxAttr = ts.isJsxAttribute(p);
        { const tx = node.text; const ld = /^\s*/.exec(tx)[0], tr = /\s*$/.exec(tx)[0]; const core = tx.slice(ld.length, tx.length - tr.length);
          const call = core && ld.length + tr.length ? `(${ld ? q(ld) + " + " : ""}${callT(core)}${tr ? " + " + q(tr) : ""})` : callT(tx);
          edits.push({ start: node.getStart(), end: node.end, text: call }); }
        record(node);
      }
      return;
    }
    if (ts.isTemplateExpression(node)) {
      const full = node.head.text + node.templateSpans.map((s) => s.literal.text).join("");
      if (CYR.test(full) && !ts.isTaggedTemplateExpression(node.parent) && !(ts.isCallExpression(node.parent) && /^(q|query|raw)$/.test(node.parent.expression.getText()))) {
        const used = new Set();
        let key = node.head.text, params = [];
        for (const sp of node.templateSpans) {
          const nm = nameFor(sp.expression, used);
          const sub = []; collect(sp.expression, sub);
          params.push([nm, applySlice(sp.expression.getStart(), sp.expression.end, sub)]);
          key += `{${nm}}` + sp.literal.text;
        }
        edits.push({ start: node.getStart(), end: node.end, text: callT(key, `{ ${params.map(([n, v]) => (n === v ? n : `${n}: ${v}`)).join(", ")} }`) });
        record(node);
        return;
      }
    }
    ts.forEachChild(node, (c) => collect(c, edits));
  }

  const edits = [];
  ts.forEachChild(sf, (c) => {
    if (ts.isImportDeclaration(c)) return;
    if (ts.isVariableStatement(c) && c.declarationList.declarations.some((d) => d.name.getText() === "metadata")) return;
    collect(c, edits);
  });
  if (!edits.length) return { file, n: 0, report };

  // top-level function handling
  const inserts = [];
  const body_edits = [];
  const needT = new Set();
  const moduleConsts = [];
  const exportedMod = [];
  // iterate module vars => convert to functions of t
  const converted = new Map(); // name -> true
  const importsNeeded = new Set();
  for (const stmt of moduleVars.keys()) {
    if (ts.isVariableStatement(stmt)) {
      const exported = (ts.getCombinedModifierFlags(stmt.declarationList.declarations[0]) & ts.ModifierFlags.Export) !== 0 || (stmt.modifiers || []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      if (exported) {
        report.push(`exported-module-const->N() ${stmt.declarationList.declarations.map((d) => d.name.getText()).join(",")} @${lineOf(stmt)}`);
        for (const e of edits) if (e.start >= stmt.getStart() && e.end <= stmt.end) { if (e.text.startsWith("t(") && !e.text.includes("{ ")) e.text = "N(" + e.text.slice(2); else report.push("  complex-module-edit " + e.text.slice(0, 60)); }
        importsNeeded.add("N");
        continue;
      }
      for (const d of stmt.declarationList.declarations) {
        if (!d.initializer) continue;
        if (!edits.some((e) => e.start >= d.initializer.getStart() && e.end <= d.initializer.end)) continue;
        converted.set(d.name.getText(), d);
      }
    } else report.push(`module-level-stmt kind ${ts.SyntaxKind[stmt.kind]} @${lineOf(stmt)}`);
  }
  // find references to converted consts
  const refEdits = [];
  if (converted.size) {
    (function w(n) {
      if (ts.isIdentifier(n) && converted.has(n.text)) {
        const p = n.parent;
        const isDecl = converted.get(n.text).name === n;
        const isProp = (ts.isPropertyAccessExpression(p) && p.name === n) || (ts.isPropertyAssignment(p) && p.name === n);
        if (!isDecl && !isProp) {
          if (ts.isShorthandPropertyAssignment(p)) report.push(`shorthand ref ${n.text} @${lineOf(n)}`);
          else { refEdits.push({ start: n.getStart(), end: n.end, text: `${n.text}(t)` }); record(n); }
        }
      }
      ts.forEachChild(n, w);
    })(sf);
    for (const [name, d] of converted) {
      const ann = d.type ? `: ${d.type.getText()}` : "";
      const initStart = d.initializer.getStart();
      // replace "name[: type] = " prefix
      edits.push({ start: d.name.getStart(), end: initStart, text: `${name} = (t: TFn)${ann} => ` });
      // wrap object literal in parens
      if (ts.isObjectLiteralExpression(d.initializer)) { edits.push({ start: initStart, end: initStart, text: "(" }); edits.push({ start: d.initializer.end, end: d.initializer.end, text: ")" }); }
    }
  }
  // determine functions needing t
  const fnsNeeding = new Set(topFns.keys());
  // refs to converted consts located in functions: topOf already recorded in topFns via record(n)
  // (record executed in loop above after topFns snapshot? re-snapshot)
  for (const f of topFns.keys()) fnsNeeding.add(f);
  // functions inside converted module consts do not need own t (param)
  for (const fn of fnsNeeding) {
    // skip functions nested inside converted initializers (t is param)
    let inConv = false;
    for (const [, d] of converted) if (fn.pos >= d.initializer.pos && fn.end <= d.initializer.end) inConv = true;
    if (inConv) continue;
    // nested fn whose outer top fn needs: only handle top-most: topOf semantic gave outermost already
    const name = ts.isFunctionDeclaration(fn) ? (fn.name ? fn.name.text : "default") : (ts.isVariableDeclaration(fn.parent) ? fn.parent.name.getText() : "");
    const isComp = /^[A-Z]/.test(name) || name === "default" || /^use[A-Z]/.test(name);
    const isAsync = (fn.modifiers || []).some((m) => m.kind === ts.SyntaxKind.AsyncKeyword);
    if (!fn.body) continue;
    const bodyIsBlock = ts.isBlock(fn.body);
    let decl;
    if (isClient) {
      if (!isComp) { report.push(`client-helper-needs-t ${name || "(anon)"} @${lineOf(fn)}`); continue; }
      decl = "const t = useT();"; importsNeeded.add("useT");
    } else {
      if (!isAsync && !isComp) { report.push(`server-helper-needs-t ${name || "(anon)"} @${lineOf(fn)}`); continue; }
      decl = "const t = await getT();"; importsNeeded.add("getT");
      if (!isAsync) {
        // insert async keyword
        if (ts.isArrowFunction(fn)) body_edits.push({ start: fn.getStart(), end: fn.getStart(), text: "async " });
        else if (ts.isFunctionDeclaration(fn)) {
          const kw = fn.getChildren().find((c) => c.kind === ts.SyntaxKind.FunctionKeyword);
          body_edits.push({ start: kw.getStart(), end: kw.getStart(), text: "async " });
        } else if (ts.isFunctionExpression(fn)) body_edits.push({ start: fn.getStart(), end: fn.getStart(), text: "async " });
        report.push(`made-async ${name} @${lineOf(fn)}`);
      }
    }
    if (T_BINDINGS.some((b) => b.pos >= fn.pos && b.end <= fn.end)) report.push(`t-binding-conflict in ${name} @${lineOf(fn)}`);
    if (bodyIsBlock) {
      let pos = fn.body.getStart() + 1;
      // after directive prologue
      let last = null;
      for (const st of fn.body.statements) { if (ts.isExpressionStatement(st) && ts.isStringLiteral(st.expression)) last = st; else break; }
      if (last) pos = last.end;
      inserts.push({ start: pos, end: pos, text: ` ${decl}` });
    } else {
      // expression body
      let e = fn.body; 
      const s = e.getStart(), en = e.end;
      const wrapped = ts.isParenthesizedExpression(e) ? e.expression.getText() : e.getText();
      inserts.push({ start: s, end: en, text: `{ ${decl} return (${src.slice(s, en)}); }` , wrapBody: true });
    }
  }
  if (converted.size) importsNeeded.add("TFn");
  // merge: for wrapBody inserts, nested edits need applying inside
  const all = edits.concat(refEdits, body_edits);
  const wraps = inserts.filter((i) => i.wrapBody);
  const plain = inserts.filter((i) => !i.wrapBody);
  for (const w of wraps) {
    // apply inner edits to slice
    const inner = all.filter((e) => e.start >= w.start && e.end <= w.end);
    const sliceTxt = applySlice(w.start, w.end, inner);
    const m = /^\{ (.*?) return \(/.exec(w.text);
    w.text = `{ ${/^\{ (const t = [^;]+;) return/.exec(w.text)[1]} return (${sliceTxt}); }`;
    for (const e of inner) all.splice(all.indexOf(e), 1);
  }
  const finalEdits = all.concat(plain, wraps);
  // import insertion
  const imports = sf.statements.filter(ts.isImportDeclaration);
  let impPos = imports.length ? imports[imports.length - 1].end : (() => { let p = 0; const st = sf.statements[0]; if (st && ts.isExpressionStatement(st) && ts.isStringLiteral(st.expression)) p = st.end; return p; })();
  let impText = "";
  if (importsNeeded.has("getT") && !/import \{[^}]*\bgetT\b/.test(src)) impText += `\nimport { getT } from "@/lib/i18n";`;
  if (importsNeeded.has("useT") && !/import \{[^}]*\buseT\b/.test(src)) impText += `\nimport { useT } from "@/lib/i18n/client";`;
  if (needStatusLabel && !/import[^;]*\bSTATUS_LABEL\b/.test(src)) impText += `\nimport { STATUS_LABEL } from "@/lib/format";`;
  if (importsNeeded.has("N") && !/import[^;]*\bN\b[^;]*core/.test(src)) impText += `\nimport { N } from "@/lib/i18n/core";`;
  if (importsNeeded.has("TFn") && !/import[^;]*\bTFn\b/.test(src)) impText += `\nimport type { TFn } from "@/lib/i18n/core";`;
  finalEdits.push({ start: impPos, end: impPos, text: impText });
  finalEdits.sort((a, b) => a.start - b.start || a.end - b.end);
  // overlap check
  for (let i = 1; i < finalEdits.length; i++) if (finalEdits[i].start < finalEdits[i - 1].end) { report.push(`OVERLAP at ${finalEdits[i].start}`); }
  let out = "", p = 0;
  for (const e of finalEdits) { if (e.start < p) continue; out += src.slice(p, e.start) + e.text; p = e.end; }
  out += src.slice(p);
  fs.writeFileSync(file, out);
  return { file, n: edits.length, report };
}
for (const f of process.argv.slice(2)) {
  try { const r = run(f); console.log(`${r.file}: ${r.n} edits`); for (const x of r.report) console.log("   !", x); } catch (e) { console.log(f, "ERR", e.stack); }
}
