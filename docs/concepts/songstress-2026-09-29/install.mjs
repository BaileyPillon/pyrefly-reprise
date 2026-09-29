#!/usr/bin/env node
/**
 * Songstress install (FFX-2 only; D-281, the driver's pick delegated by Bailey).
 *
 *   node docs/concepts/songstress-2026-09-29/install.mjs stage <dir>   # build <dir>/characters/<id>/<slot>.png|.json
 *   node docs/concepts/songstress-2026-09-29/install.mjs apply          # install into public/art (NEW folders only)
 *
 * stage: copies each pick byte for byte from the candidates folder and writes its sidecar (size and
 * baselineY from the cut-out, the scale and facing from picks.json, the generation record from the
 * candidate's .prov.json). apply: refuses if the release gate file is missing or any target file
 * already exists; copies the staged files into public/art/characters/, backs every file up to
 * D:/Tools/pyrefly-art-backup/approved/2026-09-29-songstress/installed/, and prints the hash list
 * for docs/target/approved-hashes.json. It never overwrites and never deletes.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CAND = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-29-songstress';
const ART = 'D:/Final Fantasy/public/art/characters';
const BACKUP = 'D:/Tools/pyrefly-art-backup/approved/2026-09-29-songstress';
const GATE = 'D:/Tools/pyrefly-scratch/overnight-0929/rel29-deployed.done';
const STAGE_DEFAULT = 'D:/Tools/pyrefly-scratch/overnight-0929/songstress/install-stage';
const picks = JSON.parse(readFileSync(join(HERE, 'picks.json'), 'utf8'));
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const DECISION = 'D-281';
const STATUS = 'DRIVER PICK (D-281, delegated by Bailey 2026-09-28 "Your pick (Recommended)"; not Bailey\'s own approval), installed 2026-09-29, locked in docs/target/approved-hashes.json set "driver:2026-09-29-songstress (D-281, delegated by Bailey)"';

function stage(dir) {
  for (const [id, slots] of Object.entries(picks)) {
    if (id === 'note') continue;
    mkdirSync(join(dir, 'characters', id), { recursive: true });
    for (const [slot, p] of Object.entries(slots)) {
      const src = join(CAND, p.from);
      const prov = JSON.parse(readFileSync(src.replace(/\.png$/, '.prov.json'), 'utf8'));
      const c = prov.cutout;
      const side = {
        width: c.width, height: c.height, baselineY: c.baselineY,
        ...(p.scale != null ? { scale: p.scale, scaleNote: 'Head match against this dressphere\'s own idle, read by eye beside the idle on one baseline at 1.0 / 1.15 / 1.3 (docs/concepts/songstress-2026-09-29/scale-check-*.jpg), checked against the feet-to-eye-line stature ratio (measure.py).' } : {}),
        facing: p.facing,
        seed: prov.seed, prompt: prov.positive, negative: prov.negative, cropBox: c.cropBox, source: { width: c.sourceWidth, height: c.sourceHeight },
        model: prov.model, steps: prov.steps, cfg: prov.cfg, sampler: prov.sampler, scheduler: prov.scheduler,
        pose: slot, composition: prov.composition, canvas: { width: prov.width, height: prov.height },
        ...(prov.controlnet ? { controlnet: prov.controlnet } : {}), ipadapter: prov.ipadapter,
        sources: 'costume: research/visual-bible.md section 1.24 (FF Wiki Songstress revid 3972937, victory poses revid 3955034); identity: the shipped idle sidecars rikku-thief/idle.json and paine-warrior/idle.json; no retail image used as input, reference or IP-Adapter',
        game: 'ffx2',
        status: STATUS, look: p.look, candidateOf: src.replace(/\\/g, '/'), sha256: sha(src), generatedAt: prov.generatedAt, decision: DECISION,
      };
      copyFileSync(src, join(dir, 'characters', id, `${slot}.png`));
      writeFileSync(join(dir, 'characters', id, `${slot}.json`), JSON.stringify(side, null, 2) + '\n');
      console.log('staged', id, slot, c.width + 'x' + c.height, p.scale ?? '-', p.facing);
    }
  }
}

function apply(dir) {
  if (!existsSync(GATE)) throw new Error(`public/art gate closed: ${GATE} does not exist`);
  const files = [];
  for (const id of readdirSync(join(dir, 'characters'))) {
    for (const f of readdirSync(join(dir, 'characters', id))) files.push([id, f]);
  }
  const clash = files.filter(([id, f]) => existsSync(join(ART, id, f)));
  if (clash.length) throw new Error(`refusing: would overwrite ${clash.map((x) => x.join('/')).join(', ')}`);
  const set = {};
  for (const [id, f] of files) {
    const from = join(dir, 'characters', id, f);
    mkdirSync(join(ART, id), { recursive: true });
    mkdirSync(join(BACKUP, 'installed', id), { recursive: true });
    copyFileSync(from, join(ART, id, f));
    copyFileSync(from, join(BACKUP, 'installed', id, f));
    if (f.endsWith('.png')) set[`public/art/characters/${id}/${f}`] = { sha256: sha(join(ART, id, f)), mtime: new Date().toISOString(), approved: '2026-09-29' };
    console.log('installed', `${id}/${f}`);
  }
  mkdirSync(join(BACKUP, 'replaced'), { recursive: true });
  writeFileSync(join(BACKUP, 'replaced', 'NOTE.txt'), 'Nothing was replaced: rikku-songstress and paine-songstress are new folders (2026-09-29).\n');
  writeFileSync(join(BACKUP, 'hashes.json'), JSON.stringify(set, null, 1));
  console.log(JSON.stringify(set, null, 1));
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'stage') stage(arg || STAGE_DEFAULT);
else if (cmd === 'apply') apply(arg || STAGE_DEFAULT);
else console.log('usage: stage [dir] | apply [dir]');
