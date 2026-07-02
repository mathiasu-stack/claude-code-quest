// smoke.cjs — repo-wide "does it even parse / does it even exist" checks.
//
// Each audit prints one PASS/FAIL line and contributes its failure
// count to the script's exit code (capped at 254). Dependency-free.
//
// Audits implemented:
//   3.1  Every .js file in the repo passes `node --check` (syntax).
//        ES-module files (import/export/top-level await) are retried
//        with --input-type=module before counting as failures.
//   3.2  Every script referenced by index.html exists on disk — both the
//        static <script src="…"> tags and the dynamic document.write
//        block's `var files = [...]` list (data/-prefixed).
//   3.3  Every character manifest entry with available:true has its GLB
//        on disk under play/assets/characters/.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

// Directory names / repo-relative paths never descended into. play/vendor
// (three.js builds) and play/assets (binary payloads + third-party JS) are
// path-scoped; the rest are excluded wherever they appear.
const EXCLUDED_DIR_NAMES = new Set([
  'node_modules', '.git', '.claude', 'logs', 'tts-cache',
  '__pycache__', '@eaDir', '_originals',
]);
const EXCLUDED_REL_PATHS = new Set([
  'play/vendor',
  'play/assets',
]);

const findings = [];
function pass(id, summary)          { findings.push({ id, status: 'PASS', summary }); }
function fail(id, summary, details) { findings.push({ id, status: 'FAIL', summary, details }); }

function main() {
  audit_3_1_js_syntax();
  audit_3_2_index_script_refs();
  audit_3_3_character_manifest();
  report();
}

// ── Helpers ──────────────────────────────────────────────────────────

function walkJsFiles(dir, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const ent of entries) {
    const abs = path.join(dir, ent.name);
    const rel = path.relative(REPO_ROOT, abs).split(path.sep).join('/');
    if (ent.isDirectory()) {
      if (EXCLUDED_DIR_NAMES.has(ent.name)) continue;
      if (EXCLUDED_REL_PATHS.has(rel)) continue;
      walkJsFiles(abs, out);
    } else if (ent.isFile() && ent.name.endsWith('.js')) {
      out.push(abs);
    }
  }
  return out;
}

// ── Audits ───────────────────────────────────────────────────────────

function audit_3_1_js_syntax() {
  const files = walkJsFiles(REPO_ROOT, []);
  const bad = [];
  const ESM_HINT = /Cannot use import statement|Unexpected token 'export'|await is only valid/;
  for (const file of files) {
    const rel = path.relative(REPO_ROOT, file).split(path.sep).join('/');
    const res = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (res.status === 0) continue;
    const stderr = res.stderr || '';
    if (ESM_HINT.test(stderr)) {
      // Plain-script check tripped on module syntax — re-check as ESM.
      const retry = spawnSync(
        process.execPath, ['--input-type=module', '--check'],
        { input: fs.readFileSync(file), encoding: 'utf8' },
      );
      if (retry.status === 0) continue;
      const line = (retry.stderr || '').split('\n').find(l => l.trim()) || 'unknown error';
      bad.push(`${rel} → ${line.trim()}`);
      continue;
    }
    const line = stderr.split('\n').find(l => l.trim()) || `exit ${res.status}`;
    bad.push(`${rel} → ${line.trim()}`);
  }
  if (bad.length === 0) pass('3.1', `All .js files parse (${files.length} checked via node --check)`);
  else fail('3.1', `${bad.length} .js file(s) fail node --check`, bad);
}

function audit_3_2_index_script_refs() {
  const indexPath = path.join(REPO_ROOT, 'index.html');
  let html;
  try { html = fs.readFileSync(indexPath, 'utf8'); }
  catch (e) {
    fail('3.2', `index.html unreadable — ${e.message}`);
    return;
  }
  const refs = [];
  // (a) Static <script … src="path"> tags. Strip ?v= / ?t= cache-busters.
  const tagRe = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    let src = m[1].split('?')[0];
    if (/^(https?:)?\/\//i.test(src)) continue; // external URL
    if (src.startsWith('/')) src = src.slice(1);
    refs.push(src);
  }
  // (b) The dynamic document.write block: var files = [ 'rooms.js', … ]
  // — quoted *.js names, loaded with a data/ prefix.
  const filesBlock = html.match(/var\s+files\s*=\s*\[([\s\S]*?)\]/);
  if (filesBlock) {
    const nameRe = /['"]([^'"]+\.js)['"]/g;
    while ((m = nameRe.exec(filesBlock[1])) !== null) {
      refs.push(`data/${m[1]}`);
    }
  }
  const missing = [];
  for (const ref of refs) {
    if (!fs.existsSync(path.join(REPO_ROOT, ref))) missing.push(ref);
  }
  if (refs.length === 0) {
    fail('3.2', 'No script references found in index.html — parser broken?');
  } else if (missing.length === 0) {
    pass('3.2', `All index.html script refs exist (${refs.length} checked)`);
  } else {
    fail('3.2', `${missing.length} index.html script ref(s) missing on disk`, missing);
  }
}

function audit_3_3_character_manifest() {
  const dir = path.join(REPO_ROOT, 'play', 'assets', 'characters');
  const manifestPath = path.join(dir, 'manifest.json');
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); }
  catch (e) {
    fail('3.3', `characters/manifest.json unreadable — ${e.message}`);
    return;
  }
  const chars = Array.isArray(manifest.characters) ? manifest.characters : [];
  const missing = [];
  let checked = 0;
  for (const c of chars) {
    if (!c || c.available !== true) continue; // available:false = known placeholder
    checked++;
    if (!c.file || !fs.existsSync(path.join(dir, c.file))) {
      missing.push(`${c.id || '?'} → ${c.file || '(no file field)'}`);
    }
  }
  if (missing.length === 0) pass('3.3', `All available:true character GLBs on disk (${checked} of ${chars.length} entries checked)`);
  else fail('3.3', `${missing.length} available:true character(s) missing their GLB`, missing);
}

// ── Reporter ─────────────────────────────────────────────────────────

function report() {
  console.log('\n=== SMOKE ===');
  for (const f of findings) {
    const marker = f.status === 'PASS' ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
    console.log(`${marker} smoke::${f.id.padEnd(5)} ${f.summary}`);
    if (f.details) {
      for (const d of f.details.slice(0, 6)) console.log(`         · ${d}`);
      if (f.details.length > 6) console.log(`         · … ${f.details.length - 6} more`);
    }
  }
  const fails = findings.filter(f => f.status === 'FAIL').length;
  console.log(`\n${fails === 0 ? '\x1b[32mAll passed\x1b[0m' : `\x1b[31m${fails} audit(s) failed\x1b[0m`}.\n`);
  process.exit(Math.min(254, fails));
}

main();
