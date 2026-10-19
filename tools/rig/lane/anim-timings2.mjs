/**
 * **The timing table of pass 2** (`?anim=proto&style=P2`; Lulu, FFX; `docs/handoff/anim-proto.md`): every clip's phases in the GAME'S frames (30 fps) and in seconds, next to the frame counts of the
 * game's own motion data (`research/re-ffx-party-motion-timing.md`), from the compiled clips themselves (so the table cannot drift from what plays). Times are base ms; the game's default pace
 * ("steady", x1.2 on FFX) lengthens every one of them by 20 percent on screen.
 *
 *   node tools/rig/lane/anim-timings2.mjs --rig D:/pyrefly-art-rigs/lulu-v2 > timings-p2.md
 */
import { normaliseRig, readRigFile } from '../rig-format.mjs';
import { clipRigOf } from './anim-rig.mjs';
import { libraryFor } from '../../../src/engine/rig/anim/AnimLibrary2.ts';
import { compileClip } from '../../../src/engine/rig/anim/AnimClip.ts';
import { easeName } from '../../../src/engine/rig/anim/AnimEase.ts';
import { STYLE_P2 } from '../../../src/engine/rig/anim/AnimStyles.ts';
import { LULU, LULU_ACCENTS } from '../../../src/engine/rig/anim/LuluAnim.ts';
import { LULU_CAST } from '../../../src/engine/rig/anim/AnimRE.ts';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
const { raw, dir } = readRigFile(args.rig);
const { rt, problems } = normaliseRig(raw, { dir });
if (!rt) throw new Error(problems.map((p) => p.message).join('; '));
const rig = clipRigOf(rt);
const fr = (ms) => Math.round((ms * 30) / 100) / 10; // frames at 30 fps, one decimal
const f = (ms) => `${fr(ms)} f / ${(ms / 1000).toFixed(2)} s`;

console.log('# Pass 2 (P2): every clip in the game\'s frames (30 fps) and seconds (base time; x1.2 on screen at the default pace)\n');
console.log(`Style P2 = B's look on the game's clock. Hold stays: cast ${STYLE_P2.p2.castDwell} ms, item ${STYLE_P2.p2.itemDwell} ms (the game's own hold length is set by the effect). Hit-stop ${STYLE_P2.p2.hitStopWeak} ms weak / ${STYLE_P2.p2.hitStopStrong} ms strong.\n`);

function table(title, lib, names) {
  console.log(`## ${title}\n`);
  console.log('| clip | segments (move ms, curve, +stay) | marks | total |');
  console.log('|---|---|---|---|');
  for (const def of names.map((n) => lib[n] ?? lib.extra?.[n] ?? (n.startsWith('recover:') ? lib.recover(n.slice(8)) : null)).filter(Boolean)) {
    const c = compileClip(rig, def);
    const segs = def.segments.map((s, i) => `${Math.round(c.dur[i])} ${easeName(s.ease ?? 'quadInOut')}${c.hold[i] ? ` +${Math.round(c.hold[i])}${s.sustain ? ' LOOP' : ''}` : ''}`).join(' / ');
    const marks = Object.entries(c.marks).sort((a, b) => a[1] - b[1]).map(([k, v]) => `${k} ${f(v)}`).join('; ');
    console.log(`| ${def.name} | ${segs} | ${marks || '-'} | ${f(c.total)} |`);
  }
  console.log('');
}

const lib = libraryFor(STYLE_P2, LULU_ACCENTS, LULU.p2);
table('The clips', lib, ['windup', 'strike', 'cast', 'item', 'itemSelf', 'hurt', 'ko', 'victory', 'recover:attack', 'recover:hurt', 'recover:ko']);
table('The other two cast types (`?cast=2`, `?cast=3`)', lib, ['castType2', 'castType3']);

const w = compileClip(rig, lib.windup);
const s = compileClip(rig, lib.strike);
console.log('## Against the game\'s own frames\n');
console.log('| what | the game (frames at 30 fps) | P2 plays |');
console.log('|---|---|---|');
console.log(`| attack: start to the hit | 20 | ${fr(w.marks.coiled + s.marks.contact)} |`);
console.log(`| attack: hit to the end signal | 34 | ${fr(s.marks.end - s.marks.contact)} |`);
console.log(`| attack: end signal to idle | 6 | ${fr(compileClip(rig, lib.recover('attack')).total)} |`);
LULU_CAST.forEach((c, i) => {
  const k = compileClip(rig, i === 0 ? lib.cast : lib.extra[`castType${i + 1}`]);
  console.log(`| cast type ${i + 1}: start clip / hit in the release clip / release clip end | ${c.start} / ${c.hit} / ${c.end} | start ${fr(k.marks.hold)} / hit ${fr(k.marks.release - k.marks.hold - STYLE_P2.p2.castDwell)} after the hold's ${fr(STYLE_P2.p2.castDwell)} stay / end ${fr(k.marks.end - k.marks.release)} after the hit |`);
});
const a = compileClip(rig, lib.item);
const u = compileClip(rig, lib.itemSelf);
console.log(`| item, ally: start / hit / end of the release clip | 22 / 37 / 64 | ${fr(a.marks.hold)} / ${fr(a.marks.release - a.marks.hold - STYLE_P2.p2.itemDwell)} after the ${fr(STYLE_P2.p2.itemDwell)} stay / ${fr(a.marks.end - a.marks.release)} after the hit |`);
console.log(`| item, user: start / hit / end of the release clip | 22 / 33 / 56 | ${fr(u.marks.hold)} / ${fr(u.marks.release - u.marks.hold - STYLE_P2.p2.itemDwell)} after the ${fr(STYLE_P2.p2.itemDwell)} stay / ${fr(u.marks.end - u.marks.release)} after the hit |`);
console.log(`| KO: clip / floor | 65 / 37 | ${fr(compileClip(rig, lib.ko).total)} / ${fr(compileClip(rig, lib.ko).marks.ground)} |`);
console.log(`| hurt: clip | 50 | ${fr(compileClip(rig, lib.hurt).total)} to the bent pose + ${fr(compileClip(rig, lib.recover('hurt')).total)} getting up |`);
console.log(`| victory: cheer / loop | 118 / 30 | ${fr(compileClip(rig, lib.victory).total)} / ${fr(lib.victory.segments.at(-1).sustain.period)} |`);
