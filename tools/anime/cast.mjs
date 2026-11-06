// cast.mjs : make the hidden anime chapter's three girls (part 2): the proportion pass over the Meshy toon LOD1 files, then the Wind Waker cast's upright idle and victory retargeted onto them.
// Free (no credits), pure node. The inputs are the LOD1 files as Meshy made them (kept in the models store, never modified); the outputs are the files the chapter loads
// (`public/models-exp/windwaker/anime/<id>.glb`, gitignored; `tools/ww-models.mjs record` then lists their size and sha256 in `tools/ww/ww-models.json`).
//
//   node tools/anime/cast.mjs --orig <dir with yuna.glb rikku.glb paine.glb> [--ww <public/models-exp/windwaker>] [--out <dir>] [--report]
//
// The recipes are driver picks (Bailey has not chosen the proportions): see docs/handoff/ch-anime.md, "Picks". `--report` prints the measures and writes nothing.
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readGlb, writeGlb } from './glbkit.mjs';
import { apply, proportion } from './proportion.mjs';
import { retargetClips } from './retarget.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The proportion recipe of each girl: the head's scale about the Head joint, the legs', spine's and (through the spine's share) arms' lengthening, a slimmer build, a longer neck. */
export const RECIPES = {
  yuna: { head: 0.78, leg: 1.1, spine: 1.02, arm: 1.5, slim: 0.97, neck: 1.1 },
  rikku: { head: 0.55, leg: 1.16, spine: 1.02, arm: 1.5, slim: 0.97, neck: 1.1 }, // r76: was head 0.8, leg 1.1 (4.2 heads by the tool's measure, chin to crown, her hair counted); now 5.6 (alternative: head 0.5, leg 1.22 = 6.1, the face smaller still)
  paine: { head: 0.75, leg: 1.1, spine: 1.02, arm: 1.5, slim: 0.97, neck: 1.1 }, // r76: was head 0.84, leg 1.08 (6.2 heads); now 6.9, Yuna's 7.0 (alternative: head 0.72, leg 1.12 = 7.2)
};

/** The Wind Waker cast clips copied onto the toon girls (source name: target name): the upright idle (it replaces the file's crouched, head-bowed one) and the victory (the files had none). */
export const CLIP_MAP = [['idle', 'idle'], ['victory', 'victory']];

/** Make one girl: returns `{ glb, measure, clips }` without writing. `p` overrides the recipe. */
export function makeGirl(id, origFile, wwFile, p = {}) {
  const recipe = { k: 1, ...RECIPES[id], ...p };
  const g = readGlb(origFile);
  const r = proportion(g, recipe);
  apply(g, r, recipe);
  const { reports } = retargetClips(g, readGlb(wwFile), CLIP_MAP);
  return { glb: g, measure: { total: r.total, headLength: r.headH, hips: r.hips }, clips: reports };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('cast.mjs')) {
  const argv = process.argv.slice(2);
  const opt = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const nxt = argv[i + 1];
    if (nxt === undefined || nxt.startsWith('--')) opt[argv[i].slice(2)] = true;
    else { opt[argv[i].slice(2)] = nxt; i++; }
  }
  if (typeof opt.orig !== 'string') { console.error('usage: node tools/anime/cast.mjs --orig <dir> [--ww <dir>] [--out <dir>] [--report]'); process.exit(2); }
  const ww = typeof opt.ww === 'string' ? opt.ww : join(ROOT, 'public', 'models-exp', 'windwaker');
  const out = typeof opt.out === 'string' ? opt.out : join(ww, 'anime');
  if (opt.report !== true) mkdirSync(out, { recursive: true });
  for (const id of Object.keys(RECIPES)) {
    const orig = join(opt.orig, `${id}.glb`);
    const wwFile = join(ww, `${id}.glb`);
    if (!existsSync(orig) || !existsSync(wwFile)) { console.error(`missing ${orig} or ${wwFile}`); process.exit(1); }
    const { glb, measure, clips } = makeGirl(id, orig, wwFile);
    console.log(id, JSON.stringify({ total: +measure.total.toFixed(4), headLength: +measure.headLength.toFixed(4) }), clips.map((c) => `${c.name} ${c.keys} keys lift ${c.lift.toFixed(3)}`).join('; '));
    if (opt.report !== true) writeGlb(join(out, `${id}.glb`), glb.json, glb.bin);
  }
}
