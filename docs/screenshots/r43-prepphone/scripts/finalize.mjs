// Assemble docs/screenshots/r43-prepphone/ from the proof runs: JPEGs of every capture, the side-by-side frames (today | target | build),
// the desktop identity table and one summary.json. Run after run-final.sh.
//   node finalize.mjs --sha=<commit> [--dest=D:/pyrefly-r43-prepphone/docs/screenshots/r43-prepphone]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { launch, sharp, OUT_ROOT } from './lib.mjs';

const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const SHA = String(args.sha ?? 'unknown');
const DEST = String(args.dest ?? process.env.PREP_DEST ?? 'docs/screenshots/r43-prepphone');
const PROOF = path.join(OUT_ROOT, 'proof');
const DESKTOP = path.join(OUT_ROOT, 'desktop');
const TARGET_DIR = process.env.PREP_TARGET ?? 'critic/scratch/prep-phone-options-2026-10-12/shots'; // the PREP-A options page's frames (the driver's main tree)
const Q = 90;
const mk = (p) => fs.mkdirSync(p, { recursive: true });
const rd = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const jpg = async (src, dst, q = Q) => { mk(path.dirname(dst)); await sharp(src).flatten({ background: '#04060b' }).jpeg({ quality: q, mozjpeg: true }).toFile(dst); };
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');

fs.rmSync(DEST, { recursive: true, force: true });
mk(DEST);

// ---------------------------------------------------------------- 1. JPEG copies of every capture
const sets = [
  ['now/390x844', 'build-390x844', true],
  ['now/430x932', 'build-430x932', true],
  ['today/390x844', 'base-390x844', true],
  ['today/430x932', 'base-430x932', true],
  ['webkit/390x844', 'webkit-390x844', true],
  ['small/360x740', 'build-360x740', false],
  ['small/320x640', 'build-320x640', false],
];
const copied = {};
for (const [dst, src, all] of sets) {
  const dir = path.join(PROOF, src);
  if (!fs.existsSync(dir)) { console.log('missing', dir); continue; }
  copied[dst] = [];
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort()) {
    if (!all && !/stats\.png$|dresspheres\.png$/.test(f)) continue; // the small sizes: the two densest tabs of each game are enough to look at
    await jpg(path.join(dir, f), path.join(DEST, dst, f.replace('.png', '.jpg')));
    copied[dst].push(f.replace('.png', '.jpg'));
  }
}
// The input proof's own captures (the Overdrive change).
for (const [w, h] of [[390, 844], [430, 932]]) {
  const dir = path.join(PROOF, `input-${w}x${h}`);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.png'))) await jpg(path.join(dir, f), path.join(DEST, `now/${w}x${h}`, f.replace('.png', '.jpg')));
}
// The PREP-A target frames.
const targets = ['A-ffx-stats', 'A-ffx-equipment', 'A-x2-stats', 'A-x2-stats-scrolled', 'A-x2-accessories'];
for (const t of targets) await jpg(path.join(TARGET_DIR, `${t}.png`), path.join(DEST, 'target', `${t}.jpg`), 92);

// ---------------------------------------------------------------- 2. side by side (Chromium draws the labels, so the fonts are real)
const dataUri = async (p) => `data:image/jpeg;base64,${(await sharp(p).flatten({ background: '#04060b' }).jpeg({ quality: 93 }).toBuffer()).toString('base64')}`;
const dim = (id, W, H) => ({ id, W, H });
const row = (title, panels, W, H, note) => ({ title, panels, W, H, note });
const B = (w, h, f) => path.join(PROOF, `build-${w}x${h}`, f);
const T = (w, h, f) => path.join(PROOF, `base-${w}x${h}`, f);
const frames390 = [
  ['A-ffx-stats', 'FFX Stats (Tidus)', [['TODAY · origin/main 2868c195', T(390, 844, 'seymour-flux-01-stats.png')], ['TARGET · PREP-A frame', path.join(TARGET_DIR, 'A-ffx-stats.png')], [`BUILD · r43-prepphone ${SHA}`, B(390, 844, 'seymour-flux-01-stats.png')]]],
  ['A-ffx-equipment', 'FFX Equipment (Tidus)', [['TODAY · origin/main 2868c195', T(390, 844, 'seymour-flux-03-equipment.png')], ['TARGET · PREP-A frame', path.join(TARGET_DIR, 'A-ffx-equipment.png')], [`BUILD · r43-prepphone ${SHA}`, B(390, 844, 'seymour-flux-03-equipment.png')]]],
  ['A-x2-stats', 'FFX-2 Stats (Yuna)', [['TODAY · origin/main 2868c195', T(390, 844, 'ffx2-bahamut-02-stats.png')], ['TARGET · PREP-A frame', path.join(TARGET_DIR, 'A-x2-stats.png')], [`BUILD · r43-prepphone ${SHA}`, B(390, 844, 'ffx2-bahamut-02-stats.png')]]],
  ['A-x2-stats-scrolled', 'FFX-2 Stats, Gunner unfolded, scrolled to about 230 px (Yuna)', [['TARGET · PREP-A frame', path.join(TARGET_DIR, 'A-x2-stats-scrolled.png')], [`BUILD · r43-prepphone ${SHA} (touch drag, rests at 227)`, B(390, 844, 'ffx2-bahamut-02-stats-gunner-scrolled.png')]]],
  ['A-x2-accessories', 'FFX-2 Accessories (Yuna)', [['TODAY · origin/main 2868c195', T(390, 844, 'ffx2-bahamut-03-accessories.png')], ['TARGET · PREP-A frame', path.join(TARGET_DIR, 'A-x2-accessories.png')], [`BUILD · r43-prepphone ${SHA}`, B(390, 844, 'ffx2-bahamut-03-accessories.png')]]],
  ['ffx-items', 'FFX Items (no PREP-A frame: built in the same recipe)', [['TODAY · origin/main 2868c195', T(390, 844, 'seymour-flux-04-items.png')], [`BUILD · r43-prepphone ${SHA}`, B(390, 844, 'seymour-flux-04-items.png')], [`BUILD · scrolled to the end`, B(390, 844, 'seymour-flux-04-items-end.png')]]],
  ['ffx-overdrive', 'FFX Overdrive (no PREP-A frame: built in the same recipe)', [['TODAY · origin/main 2868c195', T(390, 844, 'seymour-flux-05-overdrive.png')], [`BUILD · r43-prepphone ${SHA}`, B(390, 844, 'seymour-flux-05-overdrive.png')], ['BUILD · after a tap on STOIC', path.join(PROOF, 'input-390x844', 'seymour-flux-overdrive-changed.png')]]],
  ['x2-dresspheres', 'FFX-2 Dresspheres (no PREP-A frame: built in the same recipe)', [['TODAY · origin/main 2868c195', T(390, 844, 'ffx2-bahamut-01-dresspheres.png')], [`BUILD · r43-prepphone ${SHA}`, B(390, 844, 'ffx2-bahamut-01-dresspheres.png')], ['BUILD · GARMENT GRID and ALSO OWNED unfolded by touch', B(390, 844, 'ffx2-bahamut-01-dresspheres-all-open.png')]]],
  ['x2-items', 'FFX-2 Items (no PREP-A frame: built in the same recipe)', [['TODAY · origin/main 2868c195', T(390, 844, 'ffx2-bahamut-04-items.png')], [`BUILD · r43-prepphone ${SHA}`, B(390, 844, 'ffx2-bahamut-04-items.png')]]],
];
const frames430 = [
  ['ffx-stats', 'FFX Stats', 'seymour-flux-01-stats.png'], ['ffx-equipment', 'FFX Equipment', 'seymour-flux-03-equipment.png'], ['ffx-items', 'FFX Items', 'seymour-flux-04-items.png'], ['ffx-overdrive', 'FFX Overdrive', 'seymour-flux-05-overdrive.png'],
  ['x2-dresspheres', 'FFX-2 Dresspheres', 'ffx2-bahamut-01-dresspheres.png'], ['x2-stats', 'FFX-2 Stats', 'ffx2-bahamut-02-stats.png'], ['x2-accessories', 'FFX-2 Accessories', 'ffx2-bahamut-03-accessories.png'], ['x2-items', 'FFX-2 Items', 'ffx2-bahamut-04-items.png'],
].map(([name, title, f]) => [name, `${title} at 430x932`, [['TODAY · origin/main 2868c195', T(430, 932, f)], [`BUILD · r43-prepphone ${SHA}`, B(430, 932, f)]]]);

const css = `html,body{margin:0;background:#07060d;color:#f4f1e8;font-family:'Segoe UI',system-ui,sans-serif}
.wrap{display:inline-block;padding:20px 24px 22px;background:#07060d}
h1{margin:0 0 4px;font-size:22px;font-weight:600;letter-spacing:.02em}
.sub{margin:0 0 16px;font-size:13px;color:rgba(244,241,232,.62)}
.row{display:flex;gap:22px;align-items:flex-start}
figure{margin:0}
figcaption{margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#e3b94a}
figure.today figcaption{color:rgba(244,241,232,.55)}
figure.target figcaption{color:#7fc6e8}
img{display:block;border:1px solid rgba(244,241,232,.18)}`;

const browser = await launch();
try {
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 1300 }, deviceScaleFactor: 1 })).newPage();
  const make = async (dir, name, title, panels, W, H) => {
    const avail = panels.filter(([, p]) => fs.existsSync(p));
    if (avail.length !== panels.length) { console.log('skip (missing image)', name, panels.filter(([, p]) => !fs.existsSync(p)).map(([, p]) => p)); return; }
    const figs = [];
    for (const [label, p] of panels) {
      const cls = /^TODAY/.test(label) ? 'today' : /^TARGET/.test(label) ? 'target' : 'build';
      figs.push(`<figure class="${cls}"><figcaption>${label}</figcaption><img src="${await dataUri(p)}" width="${W}" height="${H}"></figure>`);
    }
    await page.setContent(`<style>${css}</style><div class="wrap" id="w"><h1>${title}</h1><p class="sub">${W}x${H} CSS px, headless Chromium with a touch screen, seed 1, first-run guide skipped. PR-0295, PREP-A.</p><div class="row">${figs.join('')}</div></div>`);
    await page.waitForTimeout(150);
    const box = await page.locator('#w').boundingBox();
    mk(path.join(DEST, 'side-by-side', dir));
    await page.screenshot({ path: path.join(DEST, 'side-by-side', dir, `${name}.jpg`), type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: Math.ceil(box.width), height: Math.ceil(box.height) } });
    console.log('side-by-side', dir, name);
  };
  for (const [name, title, panels] of frames390) await make('390x844', name, title, panels, 390, 844);
  for (const [name, title, panels] of frames430) await make('430x932', name, title, panels, 430, 932);
} finally {
  await browser.close().catch(() => {});
}

// ---------------------------------------------------------------- 3. the desktop identity table (pixels, not bytes)
const decode = async (p) => { const { data, info } = await sharp(p).raw().toBuffer({ resolveWithObject: true }); return { data, info }; };
async function identity(a, b, filter = null) {
  const rows = [];
  if (!fs.existsSync(a) || !fs.existsSync(b)) return rows;
  for (const f of fs.readdirSync(a).filter((f) => f.endsWith('.png') && (!filter || filter.test(f))).sort()) {
    const pb = path.join(b, f);
    if (!fs.existsSync(pb)) { rows.push({ file: f, status: 'missing' }); continue; }
    const x = await decode(path.join(a, f));
    const y = await decode(pb);
    if (x.info.width !== y.info.width || x.info.height !== y.info.height) { rows.push({ file: f, status: 'size differs' }); continue; }
    let n = 0, max = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    const ch = x.info.channels;
    for (let i = 0, p = 0; i < x.data.length; i += ch, p++) {
      let d = 0;
      for (let c = 0; c < ch; c++) d = Math.max(d, Math.abs(x.data[i + c] - y.data[i + c]));
      if (d) { n++; if (d > max) max = d; const px = p % x.info.width, py = (p / x.info.width) | 0; if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
    }
    rows.push({ file: f, status: n ? 'differs' : 'identical', pixels: n, maxChannelDelta: max, bbox: n ? [x0, y0, x1, y1] : null, sha256Before: sha256(x.data), sha256After: sha256(y.data) });
  }
  return rows;
}
const idr = {};
idr['1600x900'] = { vs: 'base-a vs after-final', rows: await identity(path.join(DESKTOP, 'base-a-1600x900'), path.join(DESKTOP, 'after-final-1600x900')) };
idr['1600x900-control-base-a-vs-base-b'] = { vs: 'the same pristine build twice', rows: await identity(path.join(DESKTOP, 'base-a-1600x900'), path.join(DESKTOP, 'base-b-1600x900')) };
idr['1600x900-control-after-a-vs-after-final'] = { vs: 'this build twice', rows: await identity(path.join(DESKTOP, 'after-a-1600x900'), path.join(DESKTOP, 'after-final-1600x900')) };
idr['600x900'] = { vs: 'base vs build', rows: await identity(path.join(DESKTOP, 'base-600-600x900'), path.join(DESKTOP, 'after-600-600x900')) };
idr['1280x720'] = { vs: 'base vs build', rows: await identity(path.join(DESKTOP, 'base-1280-1280x720'), path.join(DESKTOP, 'after-1280-1280x720')) };
const own = /-00-chapter.png$|-02-sphere-grid.png$|-00-chapter.png$/;
idr['phone-390x844-chapter-and-sphere-grid'] = { vs: 'origin/main vs build, the two tabs that keep their own phone pages', rows: await identity(path.join(PROOF, 'base-390x844'), path.join(PROOF, 'build-390x844'), own) };
idr['phone-430x932-chapter-and-sphere-grid'] = { vs: 'origin/main vs build, the two tabs that keep their own phone pages', rows: await identity(path.join(PROOF, 'base-430x932'), path.join(PROOF, 'build-430x932'), own) };
idr['phone-390x844-control-origin-main-twice'] = { vs: 'origin/main against itself (a second capture), the same two tabs', rows: await identity(path.join(PROOF, 'base-390x844'), path.join(PROOF, 'base2-390x844'), own) };
fs.writeFileSync(path.join(DEST, 'identity.json'), JSON.stringify(idr, null, 1));
for (const [k, v] of Object.entries(idr)) console.log(k, v.rows.filter((r) => r.status === 'identical').length, 'of', v.rows.length, 'identical', v.rows.filter((r) => r.status !== 'identical').map((r) => `${r.file}:${r.pixels}px@${JSON.stringify(r.bbox)}`).join(' '));

// The desktop pairs as JPEGs (1600x900): before = origin/main, after = this build.
for (const [set, dst] of [['base-a-1600x900', 'desktop/1600x900/before'], ['after-final-1600x900', 'desktop/1600x900/after']]) {
  const dir = path.join(DESKTOP, set);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort()) await jpg(path.join(dir, f), path.join(DEST, dst, f.replace('.png', '.jpg')), 88);
}

// ---------------------------------------------------------------- 4. one summary
const sums = {};
for (const d of ['build-390x844', 'build-430x932', 'build-360x740', 'build-320x640', 'build-599x900', 'base-320x640', 'base-390x844', 'base-430x932', 'input-390x844', 'input-430x932', 'webkit-390x844', 'sphere-build-390x844', 'sphere-base-390x844', 'desktop-input-1600x900']) {
  const p = path.join(PROOF, d, 'summary.json');
  if (fs.existsSync(p)) {
    const j = rd(p);
    sums[d] = { ...j, rows: j.rows?.map((r) => ({ game: r.game, tab: r.tab, texts: r.nText, minPx: r.minEff, under14: r.under, overlaps: r.overlaps, overlapsUnderDock: r.overlapsUnderDock, cut: r.cut, underList: r.underList, scrollHeight: r.state?.sh, clientHeight: r.state?.ch, scrollW: r.state?.prepScrollW, clientW: r.state?.prepClientW })) };
  }
}
fs.writeFileSync(path.join(DEST, 'summary.json'), JSON.stringify({ sha: SHA, generated: new Date().toISOString(), runs: sums }, null, 1));
console.log('done', DEST);
process.exit(0);
