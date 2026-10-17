#!/usr/bin/env node
/**
 * **Install a set of paintings, register them, gate them** (pose continuity, W1; both games). The only install path for character art (AGENTS.md hard rule 16):
 * no painting ships without a pose record or a waiver that carries Bailey's own words, and this tool ends in the gate that checks it. Bailey, 2026-10-16:
 * "pose continuity is the strongest recurring issue we need a permanent fix for this please."
 *
 *   node tools/art-install.mjs --target D:/pyrefly-art-r51 --subject dark-sandy --from D:/work/dark-sandy-set [--poses idle,attack,hurt] [--dry]
 *   node tools/art-install.mjs --target D:/pyrefly-art-r51 --plan plan.json [--dry]       plan = { "items": [ { "subject", "from", "poses"? } ] }
 *   node tools/art-install.mjs --target D:/pyrefly-art-r51 --subject dark-sandy --register
 *                                      register only (the paintings are already in the target; the idle's face box is in tools/posescale/subjects.json now)
 *   --replace --backup <folder>        replace an installed painting: the old file is moved into <folder> first (never a file with more than one link)
 *   --root <repo>  --python <python.exe>   the repository whose tables and records are written (default this one); the interpreter with numpy, scipy, PIL
 *
 * --target is required and has no default: nothing is ever installed into `public/art` by accident. <from> holds `<pose>.png` and `<pose>.json` per pose.
 * Steps: (1) check everything, write nothing (hard links, existing files, the ten-field sidecar, paths, decoding, an idle); (2) copy each file under a temporary name,
 * rename it into place, compare sha256; (3) `measure.py measure <subjects> --write` with PYREFLY_ART_DIR set to the target; (4) `measure.py table`; (5)
 * `node tools/pose-gate.mjs --check --art <target> --subjects <subjects>`. A NEW subject has no face box yet: step 3 stops and says so; read the idle's face box
 * into tools/posescale/subjects.json (docs/handoff/r39-posescale.md), then run again with --register.
 *
 * Exit: 0 installed, registered and the gate passes; 1 installed but the gate refuses (or registering failed): the painting is NOT shippable; 2 usage; 3 refused
 * before writing anything. Commit what it changed: docs/target/pose-measure.json and src/data/art/poseRegistration*.ts. Then `npm run art:manifest` for the manifest.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { DEFAULT_PYTHON, ROOT, applyInstall, planInstall, register } from './art-install-lib.mjs';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const get = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};

async function main() {
  const target = get('--target');
  if (!target) { console.error('art-install: --target <the art folder> is required (and has no default: nothing is installed into public/art by accident). See the header of tools/art-install.mjs.'); return 2; }
  let items;
  if (get('--plan')) {
    try { items = JSON.parse(readFileSync(resolve(get('--plan')), 'utf8')).items; } catch (e) { console.error(`art-install: cannot read the plan: ${e instanceof Error ? e.message : String(e)}`); return 2; }
    if (!Array.isArray(items)) { console.error('art-install: the plan is { "items": [ { "subject", "from", "poses"? } ] }'); return 2; }
  } else if (get('--subject')) {
    items = [{ subject: get('--subject'), from: flag('--register') ? null : get('--from'), poses: get('--poses')?.split(',').filter(Boolean) }];
    if (!flag('--register') && !items[0].from) { console.error('art-install: --subject needs --from <folder of paintings>, or --register'); return 2; }
  } else { console.error('art-install: give --subject (with --from or --register) or --plan'); return 2; }
  const root = resolve(get('--root', ROOT));
  const python = get('--python', DEFAULT_PYTHON);

  const plan = await planInstall({ target, items, replace: flag('--replace'), backup: get('--backup', null) });
  for (const p of plan.problems) console.error(`REFUSED  ${p}`);
  if (!plan.ok) { console.error(`art-install: refused, ${plan.problems.length} problem(s); nothing was written`); return 3; }
  for (const w of plan.writes) console.log(`  ${w.subject}/${w.pose}  sha ${w.sha.slice(0, 12)}${w.replaces.length ? '  (replaces the installed file; it is moved aside first)' : ''}`);
  if (flag('--dry')) { console.log(`art-install: --dry, ${plan.writes.length} painting(s) checked, nothing written`); return 0; }

  const done = applyInstall(plan, { backup: get('--backup', null) });
  console.log(`art-install: installed ${done.length} painting(s) into ${resolve(target)}`);
  const subjects = [...new Set([...plan.writes.map((w) => w.subject), ...plan.registerOnly])];
  const r = register({ subjects, target, root, python });
  if (r.ok) {
    console.log('art-install: registered and the pose gate passes. Commit docs/target/pose-measure.json and src/data/art/poseRegistration*.ts with the art, then run npm run art:manifest.');
    return 0;
  }
  if (r.step === 'annotation') return 1; // the line above says which subject needs its entry in tools/posescale/subjects.json
  console.error(`art-install: the ${r.step} step failed. The paintings are installed but NOT shippable: ${r.step === 'gate' ? 'the pose gate refuses them (above). Repaint, hold or ask Bailey for a waiver in his own words.' : 'registration did not finish (a new subject needs its idle face box in tools/posescale/subjects.json, then rerun with --register).'}`);
  return 1;
}

process.exitCode = await main();
