/**
 * Bundle the app into one self-contained HTML file.
 *
 * The app normally runs as ES modules over HTTP. This inlines the CSS and every
 * module into a single page so it can be opened straight from disk, emailed to
 * yourself, or hosted anywhere that serves one file — useful for reviewing the
 * app without setting up a server.
 *
 * The service worker and manifest are deliberately left out: a single file
 * can't be an installable PWA, and offline support is the hosted build's job.
 *
 *   node scripts/build-single.mjs [outfile]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || resolvePath(root, 'dist/workout.html');

// Dependency order doesn't matter — __require resolves lazily — but keeping it
// roughly topological makes the output readable.
const MODULES = [
  'js/constants.js',
  'js/catalog.js',
  'js/template.js',
  'js/store.js',
  'js/ui.js',
  'js/sheet.js',
  'js/backup.js',
  'js/model.js',
  'js/views/cardio.js',
  'js/views/home.js',
  'js/views/day.js',
  'js/views/picker.js',
  'js/app.js',
];
const ENTRY = 'js/app.js';

/** Resolve a relative specifier against the importing module's directory. */
function resolveSpec(fromId, spec) {
  const base = dirname(fromId);
  const joined = spec.startsWith('.') ? resolvePath('/' + base, spec).slice(1) : spec;
  return joined;
}

/**
 * Rewrite an ES module into a factory body.
 *
 * Handles the subset this codebase uses: named imports, and `export` on
 * function/const/let/class declarations. No default exports, no re-exports,
 * no dynamic import.
 */
function transform(source, id) {
  const exported = new Set();
  let code = source;

  code = code.replace(
    /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"];?/g,
    (_m, names, spec) => {
      // `a as b` becomes `a: b` in the destructuring form.
      const bindings = names.replace(/\s+as\s+/g, ': ').trim();
      return `const { ${bindings} } = __require(${JSON.stringify(resolveSpec(id, spec))});`;
    },
  );

  code = code.replace(/export\s+(async\s+)?function\s+([A-Za-z0-9_$]+)/g, (_m, asyncKw, name) => {
    exported.add(name);
    return `${asyncKw || ''}function ${name}`;
  });
  code = code.replace(/export\s+(const|let|var)\s+([A-Za-z0-9_$]+)/g, (_m, kw, name) => {
    exported.add(name);
    return `${kw} ${name}`;
  });
  code = code.replace(/export\s+class\s+([A-Za-z0-9_$]+)/g, (_m, name) => {
    exported.add(name);
    return `class ${name}`;
  });

  if (/^\s*export\s/m.test(code)) {
    throw new Error(`${id}: unsupported export form left after transform`);
  }

  const tail = exported.size ? `\n  Object.assign(exports, { ${[...exported].join(', ')} });\n` : '';
  return `__define(${JSON.stringify(id)}, function (exports, __require) {\n${code}${tail}});`;
}

/**
 * Escape non-ASCII to \uXXXX so the bundle survives being served without a
 * charset header — otherwise the app's ·, — and curly quotes arrive mangled.
 * Valid inside JS strings, template literals, regexes and comments alike.
 */
function toAscii(js) {
  return js.replace(/[^\x00-\x7F]/g, (ch) =>
    `\\u${ch.codePointAt(0).toString(16).padStart(4, '0')}`);
}

const css = readFileSync(resolvePath(root, 'css/styles.css'), 'utf8');
const modules = MODULES.map((id) =>
  toAscii(transform(readFileSync(resolvePath(root, id), 'utf8'), id)));

// charset must land in the first 1024 bytes or the browser guesses, which
// mangles the app's ·, — and curly quotes.
const html = `<meta charset="utf-8">
<title>Workout</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="dark">

<style>
${css}
/* Single-file build: own the page background outside the app column too. */
:root { color-scheme: dark; }
html, body { background: var(--bg); }
</style>

<div class="app">
  <header class="topbar" id="topbar"></header>
  <main class="view" id="view"></main>
  <div class="dock" id="dock"></div>
</div>
<div class="sheet-host" id="sheet-host" hidden></div>
<div class="toast-host" id="toast-host" aria-live="polite"></div>

<script type="module">
// Minimal module registry so the app's ES modules can live in one file.
const __defs = {};
const __cache = {};
function __define(id, factory) { __defs[id] = factory; }
function __require(id) {
  if (__cache[id]) return __cache[id];
  const factory = __defs[id];
  if (!factory) throw new Error('module not bundled: ' + id);
  const exports = (__cache[id] = {});
  factory(exports, __require);
  return exports;
}

${modules.join('\n\n')}

__require(${JSON.stringify(ENTRY)});
</script>
`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`${out}  ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
