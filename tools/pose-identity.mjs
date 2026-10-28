#!/usr/bin/env node
/**
 * **Does a ready painting still show the same figure?** (PR-0517; method check section 3.5; pc-residues lane, 2026-10-28; both games.) The measure and why it is this one:
 * `tools/posescale/pose-identity-lib.mjs`. This reads the paintings (files only: no browser, no server, nothing written but what `--out` / `--write` name) and judges them.
 *
 *   node tools/pose-identity.mjs                       every figure's ready painting against its idle, the attack as the ceiling (a census; writes nothing)
 *   node tools/pose-identity.mjs --poses=ready,hurt    other poses (default: ready)
 *   node tools/pose-identity.mjs --subjects=a,b        only these art subjects (a costume is its own subject: `rikku-dark-knight`)
 *   node tools/pose-identity.mjs --out=F               the full numbers as JSON
 *   node tools/pose-identity.mjs --write               rewrite src/data/art/readyIdentity.ts: the ready paintings that fail, which the engine holds on the idle painting (PR-0517)
 *   node tools/pose-identity.mjs --check               exit 1 when that file is not what the paintings say now (a repaint changes a sha; a passing repaint clears its row)
 *
 * The art folder is `--art`, else PYREFLY_ART_DIR, else `public/art` (read only: it may be a mirror).
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { judgeIdentity, readRegions } from './posescale/pose-identity-lib.mjs';

sharp.cache(false);
sharp.concurrency(2);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = path.join(ROOT, 'src', 'data', 'art', 'readyIdentity.ts');
/** Paintings are read at this height (px): colour means do not need more, and two masters of different pixel sizes then compare alike. */
const READ_HEIGHT = 512;

/** The registration records (docs/target/pose-measure.json): `subjects[s].poses[p]` = { head: [x0, y0, x1, y1] px, stance: { row }, size: [w, h] } for the geometry of the regions only. */
function loadRecords() {
  const file = path.join(ROOT, 'docs', 'target', 'pose-measure.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).subjects ?? {} : {};
}

/** The poses that stand and show the costume: what the figure's own ceiling is made of (a laid-down KO or sleep painting shows a lying body, a twirl is a costume change). */
const CEILING_POSES = ['attack', 'hurt', 'follow', 'cast', 'item', 'critical', 'defend', 'victory'];

/** One painting's regions (and its sha, the first 16 hex characters of the master's sha256, as the pose table writes it), or null when the file is not there. */
export async function readPainting(file, record = null) {
  if (!fs.existsSync(file)) return null;
  const buf = fs.readFileSync(file);
  const sha = createHash('sha256').update(buf).digest('hex').slice(0, 16);
  const meta = await sharp(buf).metadata();
  const { data, info } = await sharp(buf).ensureAlpha().resize({ height: READ_HEIGHT, fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
  const k = info.height / meta.height; // the record's pixels are the master's; this image is smaller
  const geometry = record?.head && record?.stance?.row ? { head: record.head.map((v) => v * k), feetRow: record.stance.row * k } : null;
  return { sha, regions: readRegions({ data, w: info.width, h: info.height }, geometry) };
}

/** The subjects under `<art>/characters` that have an idle painting (a twirl or a hidden-chapter copy is a subject like any other). */
export function listSubjects(artDir) {
  const dir = path.join(artDir, 'characters');
  return fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(path.join(dir, d.name, 'idle.png'))).map((d) => d.name).sort();
}

/**
 * Measure `poses` of `subjects`.
 * @returns {Promise<Record<string, Record<string, object>>>} `{subject: {pose: {sha, distance, ceiling, ceilingAttack, over, overAttack, pass, unread}}}`
 */
export async function measure({ artDir, subjects, poses }) {
  const records = loadRecords();
  const out = {};
  for (const subject of subjects) {
    const base = path.join(artDir, 'characters', subject);
    const rec = (pose) => records[subject]?.poses?.[pose] ?? null;
    const idle = await readPainting(path.join(base, 'idle.png'), rec('idle'));
    if (!idle) continue;
    const refs = {};
    for (const name of CEILING_POSES) refs[name] = await readPainting(path.join(base, `${name}.png`), rec(name));
    for (const pose of poses) {
      const p = await readPainting(path.join(base, `${pose}.png`), rec(pose));
      if (!p) continue;
      const others = CEILING_POSES.filter((n) => n !== 'attack' && n !== pose && refs[n]).map((n) => refs[n].regions);
      (out[subject] ??= {})[pose] = { sha: p.sha, by: p.regions.by, ...judgeIdentity({ idle: idle.regions, pose: p.regions, attack: refs.attack?.regions ?? null, others }), hasAttack: Boolean(refs.attack), others: others.length };
    }
  }
  return out;
}

/** The text of `src/data/art/readyIdentity.ts` for the failing ready paintings. */
export function renderData(fails) {
  const rows = Object.keys(fails).sort().map((s) => {
    const f = fails[s];
    return `  '${s}': { sha: '${f.sha}', worst: ${f.distance.worst}, ratio: ${f.ratio}, over: [${f.over.map((b) => `'${b}'`).join(', ')}] },`;
  });
  return [
    "/**",
    " * The ready paintings that fail the identity measure (PR-0517; `tools/pose-identity.mjs`, `tools/posescale/pose-identity-lib.mjs`): a figure whose ready painting reads as another figure",
    " * (a different costume, a hood up against a hood down) than its own idle, against its attack as the ceiling. The engine holds such a figure on the IDLE painting through the menu and the wind-up (the ready",
    " * STATE, its lean and ring, stays), `src/engine/motion/ReadyIdentity.ts`, until a repaint passes and `node tools/pose-identity.mjs --write` clears its row. Both games; the rows are FFX-2 costumes (a figure is its dress: `paine-warrior`).",
    " * Generated by `node tools/pose-identity.mjs --write`; do not edit by hand. `sha`: the first 16 hex characters of the painting master's sha256 the numbers describe.",
    " */",
    "export interface ReadyIdentityFail {",
    "  readonly sha: string;",
    "  /** The worst region's distance (a delta-E-sized number). */",
    "  readonly worst: number;",
    "  /** The worst region's distance over its ceiling (the attack's distance, floored). */",
    "  readonly ratio: number;",
    "  /** The regions over their ceilings: `head`, `body`, `legs`. */",
    "  readonly over: readonly string[];",
    "}",
    "",
    "export const READY_IDENTITY_FAILS: Readonly<Record<string, ReadyIdentityFail>> = {",
    ...rows,
    "};",
    "",
  ].join('\n');
}

/** The rows now in the data file: `{subject: sha}` (read back from the text, so `--check` needs no TypeScript). */
export function currentRows() {
  if (!fs.existsSync(DATA_FILE)) return {};
  const rows = {};
  for (const m of fs.readFileSync(DATA_FILE, 'utf8').matchAll(/^\s+'([a-z0-9-]+)': \{ sha: '([0-9a-f]{16})'/gm)) rows[m[1]] = m[2];
  return rows;
}

async function main(argv) {
  const get = (n, d) => { const a = argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
  const artDir = path.resolve(get('art', process.env.PYREFLY_ART_DIR ?? path.join(ROOT, 'public', 'art')));
  const subjects = get('subjects') ? get('subjects').split(',').filter(Boolean) : listSubjects(artDir);
  const poses = get('poses', 'ready').split(',').filter(Boolean);
  const res = await measure({ artDir, subjects, poses });
  const f = (v) => (v === null || v === undefined ? '  - ' : v.toFixed(1).padStart(5));
  let fails = 0;
  for (const subject of Object.keys(res)) {
    for (const pose of Object.keys(res[subject])) {
      const r = res[subject][pose];
      if (r.verdict === 'fail') fails++;
      const d = r.distance.per, c = r.ceiling;
      console.log(`${(`${subject}/${pose}`).padEnd(34)} ${r.verdict === 'fail' ? 'FAIL ' : r.verdict === 'unread' ? 'UNREAD' : r.verdict === 'watch' ? 'watch' : 'pass '}  head ${f(d.head)}/${f(c.head)}  body ${f(d.body)}/${f(c.body)}  legs ${f(d.legs)}/${f(c.legs)}  whole ${f(d.whole)}  x${r.ratio === null ? '-' : r.ratio.toFixed(2)} (${r.by ?? '-'}${r.hasAttack ? '' : ', no attack'})${r.over.length ? `  over: ${r.over.join(',')}` : ''}`);
    }
  }
  console.log(`pose-identity: ${Object.values(res).reduce((n, p) => n + Object.keys(p).length, 0)} paintings read, ${fails} fail (the rest pass or watch)`);
  if (get('out')) fs.writeFileSync(path.resolve(get('out')), JSON.stringify({ schema: 'pose-identity/1', artDir, poses, results: res }, null, 1));
  const failing = {};
  for (const subject of Object.keys(res)) if (res[subject].ready && res[subject].ready.verdict === 'fail') failing[subject] = res[subject].ready;
  if (argv.includes('--write')) {
    if (get('subjects') || poses.join() !== 'ready') throw new Error('--write needs the whole census of ready paintings (no --subjects, no --poses)');
    fs.writeFileSync(DATA_FILE, renderData(failing));
    console.log(`wrote ${path.relative(ROOT, DATA_FILE)}: ${Object.keys(failing).length} row(s)`);
  }
  if (argv.includes('--check')) {
    const have = currentRows();
    const problems = [];
    for (const s of Object.keys(failing)) {
      if (!have[s]) problems.push(`${s}: ready fails the identity measure and is not in the data file`);
      else if (have[s] !== failing[s].sha) problems.push(`${s}: the ready painting changed (sha ${have[s]} listed, ${failing[s].sha} now) and still fails: re-run --write`);
    }
    for (const s of Object.keys(have)) if (!failing[s]) problems.push(`${s}: listed but its ready painting passes now (or is gone): re-run --write`);
    for (const p of problems) console.log(`FAIL  ${p}`);
    console.log(problems.length ? `pose-identity --check: FAIL, ${problems.length} row(s)` : `pose-identity --check: PASS, ${Object.keys(have).length} listed, ${Object.keys(failing).length} failing`);
    return problems.length ? 1 : 0;
  }
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then((c) => { process.exitCode = c; }, (e) => { console.error(String(e?.stack ?? e)); process.exitCode = 2; });
}
