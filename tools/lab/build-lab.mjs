#!/usr/bin/env node
/**
 * CAMERA LAB: build the private playable page (a test harness, D-318; never the game's build).
 *
 *   node tools/lab/build-lab.mjs [--artifact]
 *
 * Without `--artifact` (the launcher's build): the two chapters' files at full resolution, the
 * music included; `serve-lab.mjs --public public` serves anything else from the worktree.
 * With `--artifact` (the private page): the paintings shrunk (`shrink_lab.py`), the music dropped
 * (the game's synth plays instead), the pause plates and title art left out, and the art and audio
 * manifests trimmed to what ships, so the page never asks for a file it lacks; the limits enforced.
 *
 * 1. `vite build --base ./` of `lab.html` (boots straight into the lab panel) into `dist-lab/`,
 *    with no `public/` copy (the game's public folder is ~1 GB).
 * 2. Copies ONLY the files Chapter I and Chapter IV load, listed in `tools/lab/lab-assets.txt`
 *    (recorded from real lab runs: art, the rear paintings, audio, fonts, fx).
 * 3. Writes `dist-lab/index.html` as a fragment the artifact publisher wraps: the title, the
 *    stylesheet links, the module script and the body content; no doctype/html/head/body, every
 *    URL relative. The page's inline style moves to `assets/lab-base.css`.
 * 4. Writes `dist-lab/MANIFEST.txt` and checks the limits: <= 250 files, <= 60 MB, no file > 15 MB.
 *
 * `dist-lab/` is never committed (the worktree's info/exclude) and never touches the shared `dist/`.
 */
import { build } from 'vite';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const out = join(root, 'dist-lab');
const artifact = process.argv.includes('--artifact');
/** Left out of the private page: the music (synth fallback), the pause plates, the title art, other chapters' portraits. */
const ARTIFACT_SKIP = [/^audio\/music\//, /^art\/pause\//, /^art\/title\//, /^art\/portraits\/(leblanc|ormi)\./];
const LIMITS = { files: 250, bytes: 60 * 1024 * 1024, file: 15 * 1024 * 1024 };

await build({
  configFile: false,
  root,
  base: './',
  publicDir: false,
  cacheDir: join(root, '.vite-cache-lab'),
  logLevel: 'warn',
  build: {
    outDir: out,
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: false,
    assetsDir: 'assets',
    chunkSizeWarningLimit: 4000,
    rolldownOptions: { input: join(root, 'lab.html') },
  },
  worker: { format: 'es' },
});

// ---- the page fragment
const html = readFileSync(join(out, 'lab.html'), 'utf8');
const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
const bodyInner = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
const style = (head.match(/<style>([\s\S]*?)<\/style>/) ?? [])[1] ?? '';
writeFileSync(join(out, 'assets', 'lab-base.css'), `/* the page's own base styles (from lab.html) */\n${style.trim()}\n`);
const links = [...head.matchAll(/<link [^>]*>/g)].map((m) => m[0]).filter((l) => /rel="(stylesheet|modulepreload)"/.test(l));
const scripts = [...head.matchAll(/<script [^>]*><\/script>/g), ...bodyInner.matchAll(/<script [^>]*src=[^>]*><\/script>/g)].map((m) => m[0]);
const body = bodyInner.replace(/<script [^>]*src=[^>]*><\/script>/g, '').replace(/<noscript>[\s\S]*?<\/noscript>/g, '').trim();
const rel = (s) => s.replace(/(href|src)="\/(?!\/)/g, '$1="./');
const fragment = [
  '<title>Pyrefly Reprise · Camera Lab (test build)</title>',
  '<link rel="stylesheet" href="./assets/lab-base.css">',
  ...links.map(rel),
  ...scripts.map(rel),
  body,
  '',
].join('\n');
if (/<!doctype|<html|<head|<body/i.test(fragment)) throw new Error('the fragment still holds a document tag');
if (/(href|src)="\//.test(fragment)) throw new Error('the fragment holds a root-relative URL');
writeFileSync(join(out, 'index.html'), fragment);
rmSync(join(out, 'lab.html'));

// ---- the files the two chapters load
const listFile = join(root, 'tools', 'lab', 'lab-assets.txt');
const wanted = readFileSync(listFile, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
let copied = 0;
const missing = [];
for (const p of wanted) {
  if (artifact && ARTIFACT_SKIP.some((re) => re.test(p))) continue;
  const src = join(root, 'public', p);
  if (!existsSync(src)) {
    missing.push(p);
    continue;
  }
  const dst = join(out, p);
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  copied++;
}

// ---- root-relative URLs the build left in the CSS (the fonts): relative to assets/
for (const f of readdirSync(join(out, 'assets'))) {
  if (!f.endsWith('.css')) continue;
  const p = join(out, 'assets', f);
  const css = readFileSync(p, 'utf8');
  const fixed = css.replace(/url\((['"]?)\/(?!\/)/g, 'url($1../');
  if (fixed !== css) writeFileSync(p, fixed);
}

if (artifact) {
  // The paintings, shrunk as whole subjects (shrink_lab.py says why that keeps every figure's size).
  const py = spawnSync(process.platform === 'win32' ? 'python' : 'python3', [join(root, 'tools', 'lab', 'shrink_lab.py'), out], { stdio: 'inherit' });
  if (py.status !== 0) throw new Error('shrink_lab.py failed (it needs Python with Pillow)');
  // The manifests, trimmed to what ships: the game never asks for a file the page lacks.
  const has = (rel) => existsSync(join(out, rel));
  const artManifest = join(out, 'art', 'manifest.json');
  if (existsSync(artManifest)) {
    const m = JSON.parse(readFileSync(artManifest, 'utf8'));
    for (const [id, subj] of Object.entries(m.subjects ?? {})) {
      subj.states = (subj.states ?? []).filter((st) => has(`art/characters/${id}/${st}.png`));
      if ('portrait' in subj) subj.portrait = has(`art/portraits/${id}.png`);
    }
    for (const [key, folder, ext] of [['portraits', 'portraits', '.png'], ['backdrops', 'backdrops', '.png'], ['pause', 'pause', '.png'], ['pause2x', 'pause', '.2x.webp'], ['title', 'title', '.png'], ['title2x', 'title', '.2x.webp']]) {
      if (Array.isArray(m[key])) m[key] = m[key].filter((k) => has(`art/${folder}/${k}${ext}`));
    }
    writeFileSync(artManifest, JSON.stringify(m));
  }
  const audioManifest = join(out, 'audio', 'manifest.json');
  if (existsSync(audioManifest)) {
    const a = JSON.parse(readFileSync(audioManifest, 'utf8'));
    for (const [k, v] of Object.entries(a.music ?? {})) if (!has(`audio/${v.file}`)) delete a.music[k];
    for (const key of ['sfx', 'sfxV2']) if (a[key]?.file && !has(`audio/${a[key].file}`)) delete a[key];
    writeFileSync(audioManifest, JSON.stringify(a));
  }
}

// ---- the manifest and the limits
const files = [];
const walk = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else files.push({ path: relative(out, p).replace(/\\/g, '/'), bytes: statSync(p).size });
  }
};
walk(out);
files.sort((a, b) => a.path.localeCompare(b.path));
const total = files.reduce((s, f) => s + f.bytes, 0) + 4096; // + the manifest itself
const biggest = files.reduce((m, f) => (f.bytes > m.bytes ? f : m), { path: '', bytes: 0 });
const mb = (n) => (n / 1024 / 1024).toFixed(2);
const lines = [
  'Pyrefly Reprise camera lab: dist-lab/ (a test build, never the game; D-318)',
  `built ${new Date().toISOString()} from branch camera-lab${artifact ? ' for the private page: paintings shrunk (characters and rear paintings 0.6, portraits 0.5, backdrops 0.8), music dropped (the synth fallback plays), pause plates and title art left out, manifests trimmed' : ' for the launcher (full resolution, music included)'}`,
  `files ${files.length + 1} (limit ${LIMITS.files}), total ${mb(total)} MB (limit 60 MB), largest ${biggest.path} ${mb(biggest.bytes)} MB (limit 15 MB)`,
  `copied ${copied} public files from tools/lab/lab-assets.txt${missing.length ? `; missing ${missing.length}: ${missing.join(', ')}` : ''}`,
  '',
  ...files.map((f) => `${String(f.bytes).padStart(10)}  ${f.path}`),
  `${String(4096).padStart(10)}  MANIFEST.txt (approx.)`,
  '',
];
writeFileSync(join(out, 'MANIFEST.txt'), lines.join('\n'));
console.log(lines.slice(0, 4).join('\n'));
const over = files.length + 1 > LIMITS.files || total > LIMITS.bytes || biggest.bytes > LIMITS.file;
if (over && artifact) {
  console.error('OVER THE ARTIFACT LIMITS');
  process.exit(2);
}
if (over) console.log('(over the artifact limits: fine for the launcher; build the page with --artifact)');
