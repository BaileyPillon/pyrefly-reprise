/**
 * **The timing table of the animation prototype's three styles** (both games' plumbing; Lulu's authored clips; `docs/handoff/anim-proto.md`): every clip of every style as segments (the move's
 * length, its curve, its hold), its marks in ms and in frames at 60 fps, and its total, from the compiled clips themselves (so the table cannot drift from what plays).
 *
 *   node tools/rig/lane/anim-timings.mjs --rig D:/pyrefly-art-rigs/lulu-v2 [--fps 60] > timings.md
 */
import { normaliseRig, readRigFile } from '../rig-format.mjs';
import { clipRigOf } from './anim-rig.mjs';
import { buildLibrary } from '../../../src/engine/rig/anim/AnimLibrary.ts';
import { compileClip, frameOf } from '../../../src/engine/rig/anim/AnimClip.ts';
import { easeName } from '../../../src/engine/rig/anim/AnimEase.ts';
import { STYLES } from '../../../src/engine/rig/anim/AnimStyles.ts';
import { LULU_ACCENTS } from '../../../src/engine/rig/anim/LuluAnim.ts';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
const fps = Number(args.fps ?? 60);
const { raw, dir } = readRigFile(args.rig);
const { rt, problems } = normaliseRig(raw, { dir });
if (!rt) throw new Error(problems.map((p) => p.message).join('; '));
const rig = clipRigOf(rt);
const f = (ms) => `${Math.round(ms)} ms (frame ${frameOf(ms, fps)})`;

for (const style of Object.values(STYLES)) {
  const lib = buildLibrary(style, LULU_ACCENTS);
  console.log(`\n### Style ${style.id}: ${style.label}\n`);
  console.log(`${style.blurb}\n`);
  console.log('| clip | segments (move ms, curve, hold ms) | marks | total |');
  console.log('|---|---|---|---|');
  const defs = [lib.windup, lib.strike, lib.follow, lib.cast, lib.item, lib.hurt, lib.ko, lib.victory, lib.ready, lib.recover('attack'), lib.recover('cast'), lib.recover('ko')];
  for (const def of defs) {
    const c = compileClip(rig, def);
    const segs = def.segments.map((s, i) => `${Math.round(c.dur[i])} ${easeName(s.ease ?? 'quadInOut')}${c.hold[i] ? ` +${Math.round(c.hold[i])} hold` : ''}`).join(' / ');
    const marks = Object.entries(c.marks).map(([k, v]) => `${k} ${f(v)}`).join('; ');
    console.log(`| ${def.name} | ${segs} | ${marks || '-'} | ${f(c.total)} |`);
  }
  const L = lib.leads;
  const mk = (name) => compileClip(rig, lib[name]).marks;
  console.log(`\nLeads the presenter waits: attack wind-up ${style.attack.anticipation} ms (then the lunge; the strike's contact is placed on the lunge's apex), spell release at ${Math.round(mk('cast')[L.cast.mark] + L.cast.offsetMs)} ms, item landing at ${Math.round(mk('item')[L.item.mark] + L.item.offsetMs)} ms (throw release ${Math.round(mk('item').release)} ms + flight ${style.item.flight} ms). Hit-stop at contact: ${style.attack.hitStop} ms (first and last hit). Camera punch at contact ${style.camera.contact}, at a spell's release ${style.camera.release} (fraction of the subject distance, ${style.camera.ms} ms).`);
}
