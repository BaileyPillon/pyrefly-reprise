#!/usr/bin/env node
/**
 * Install one Logos round-2 pick as a CANDIDATE (FFX-2 only). Never approves anything:
 * docs/target/approved-hashes.json is not touched.
 *
 *   node install-r2.mjs <state> <renderTag> [--fix <fixTag>] [--scale 0.93] [--scaleNote "..."]
 *                       [--score 7] [--bar "..."] [--note "..."]
 *
 * renderTag = renders/<renderTag>.json from render-r2.mjs (e.g. attack.99103.r2); --fix a,b names a
 * chain of fixes (fix2.mjs outputs or pixel edits), each made on the previous file; the last is
 * the installed file and every link goes in the sidecar's `fixes`.
 * 1. Backs up the installed <state>.png + .json to
 *    D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/logos/replaced/<state>.<sha8>.*
 *    (never overwritten).
 * 2. Copies the pick to public/art/characters/logos/<state>.png and writes the sidecar in the
 *    installed format + status CANDIDATE, candidateOf, method 'lora-r2+openpose', seed, loraStep.
 * 3. Copies the pick's cutout, raw frame and provenance to the backup's picks/ folder.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..', '..', '..', '..');
const BACKUP = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/logos';
const REL = 'docs/concepts/chapters/leblanc/lora/logos/round2';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

const argv = process.argv.slice(2);
const [state, tag] = argv;
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
if (!state || !tag) { console.log('usage: node install-r2.mjs <state> <renderTag> [--fix t] [--scale x] [--score n] [--bar s]'); process.exit(1); }
const R = join(HERE, 'renders');
const meta = JSON.parse(readFileSync(join(R, `${tag}.json`), 'utf8'));
if (meta.cutoutGuard && meta.cutoutGuard.ok === false) throw new Error(`${tag}: the cut-out guard failed it: ${meta.cutoutGuard.reasons.join('; ')}`);
// --fix a,b,c: a chain; each fix must have been made on the previous file (the render first)
const chain = opt('fix') ? opt('fix').split(',') : [];
const fixes = chain.map((t) => ({ t, j: JSON.parse(readFileSync(join(R, `${t}.json`), 'utf8')) }));
let prev = join(R, `${tag}.png`);
for (const { t, j } of fixes) {
  if (j.baseSha256 !== sha(prev)) throw new Error(`${t} was not made on ${prev}`);
  prev = join(R, `${t}.png`);
}
const fixTag = chain.length ? chain[chain.length - 1] : null;
const fix = fixes.length ? fixes[fixes.length - 1].j : null;
const pickPng = join(R, `${fixTag || tag}.png`);
const cut = meta.cutout;

const art = join(REPO, 'public/art/characters/logos');
mkdirSync(join(BACKUP, 'replaced'), { recursive: true });
mkdirSync(join(BACKUP, 'picks'), { recursive: true });
if (existsSync(join(art, `${state}.png`))) {
  const h8 = sha(join(art, `${state}.png`)).slice(0, 8);
  for (const ext of ['png', 'json']) {
    const to = join(BACKUP, 'replaced', `${state}.${h8}.${ext}`);
    if (existsSync(join(art, `${state}.${ext}`)) && !existsSync(to)) copyFileSync(join(art, `${state}.${ext}`), to);
  }
}
for (const f of [`${tag}.png`, `${tag}.raw.png`, `${tag}.json`, ...chain.flatMap((t) => [`${t}.png`, `${t}.json`, `${t}.flat.png`, `${t}.diff.png`])]) {
  if (existsSync(join(R, f))) copyFileSync(join(R, f), join(BACKUP, 'picks', f));
}

copyFileSync(pickPng, join(art, `${state}.png`));
const scale = opt('scale') ? Number(opt('scale')) : undefined;
const side = {
  width: cut.width,
  height: cut.height,
  baselineY: cut.baselineY,
  seed: meta.seed,
  renderTag: fixTag || tag,
  prompt: meta.positive,
  negative: meta.negative,
  cropBox: cut.cropBox,
  source: { width: meta.width, height: meta.height },
  model: meta.model,
  steps: meta.steps,
  cfg: meta.cfg,
  sampler: meta.sampler,
  scheduler: meta.scheduler,
  pose: state,
  composition: meta.composition,
  facing: 'left',
  canvas: { width: meta.width, height: meta.height },
  lora: meta.lora,
  loraStep: meta.lora.step,
  controlnet: meta.controlnet,
  ipadapter: meta.ipadapter,
  ...(fixes.length ? { fixes: fixes.map(({ t, j }) => ({ tag: t, seed: j.seed, judge: j.judge, method: j.method, lora: j.lora, passes: j.passes, proof: j.proof })) } : {}),
  status: 'CANDIDATE',
  candidateOf: `${REL}/renders/${fixTag || tag}.png`,
  method: fix ? 'lora-r2+openpose, then local fixes (masked lora-r2 repaint or pixel edit, see fixes)' : 'lora-r2+openpose',
  ...(opt('score') ? { selfScore: Number(opt('score')) } : {}),
  ...(opt('bar') ? { bar: opt('bar') } : {}),
  cutout: cut,
  cutoutGuard: meta.cutoutGuard ? { ok: meta.cutoutGuard.ok, reasons: meta.cutoutGuard.reasons } : null,
  generatedAt: meta.generatedAt,
  installedAt: new Date().toISOString(),
  ...(scale ? { scale, scaleNote: opt('scaleNote') || 'Set so the head (helmet diameter) matches idle\'s on screen within 5 percent, measured in a running battle (round2/ingame-after.json), 2026-09-23.' } : {}),
  ...(opt('note') ? { notes: opt('note') } : {}),
  sha256: sha(pickPng),
};
writeFileSync(join(art, `${state}.json`), JSON.stringify(side, null, 2) + '\n');
console.log(`installed ${fixTag || tag} -> public/art/characters/logos/${state}.png (CANDIDATE)${scale ? `, scale ${scale}` : ''}`);
