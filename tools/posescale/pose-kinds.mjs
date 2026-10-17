/**
 * What kind of figure a painted subject is, which game it belongs to, and which class each of its poses is in
 * (pose continuity, W0/W1; both games). Pure: no file, no pixel.
 *
 * This is the classification angle 1 of the 2026-10-16 pose-continuity survey used (`D:/Tools/pyrefly-scratch/2026-10-16/pose-continuity/work/measure_all.py`
 * and `final_csv.py`), moved into the repository so that the gate, the census and the critic read the same answer. A subject is classed by its art id; the
 * game comes from the subject's own sidecar (`game`), else from the kind, else from the registration table it sits in, else from the data folder that names its
 * art id (`GAME_FALLBACK`, hard rule 14: FFX chapters are 1 to 3 and the FFX party, FFX-2 chapters are 4 and 5 and the dresspheres).
 */

export const PARTY = new Set(['tidus', 'yuna', 'auron', 'wakka', 'lulu', 'kimahri', 'rikku']);
export const AEONS = new Set([
  'valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo', 'yojimbo-cavern', 'sandy', 'mindy', 'cindy',
  'x2-ixion', 'x2-shiva', 'x2-anima', 'braskas-final-aeon-1', 'braskas-final-aeon-2',
]);
export const DARK_AEONS = new Set(['dark-sandy', 'dark-mindy', 'dark-cindy', 'dark-yojimbo']);
/** Hulls, fins, limbs: not standing figures. A part is judged on its stance only. */
export const PARTS = new Set([
  'vegnagun-body', 'vegnagun-head', 'vegnagun-leg', 'vegnagun-tail', 'sin-core', 'sin-left-fin', 'sin-right-fin',
  'sinspawn-gui-arm-left', 'sinspawn-gui-arm-right', 'sinspawn-gui-head', 'sinspawn-gui-head-2', 'seymour-flux-body',
  'mortibody', 'seymour-natus-ring', 'mortiphasm-facing',
]);
const DRESS = /^(yuna|rikku|paine)-(black-mage|white-mage|gunner|thief|warrior|songstress|dark-knight|lady-luck|alchemist|berserker|samurai)$/;

/**
 * Subjects whose own sidecar and registration table do not name a game, by which data folder (`src/data/ffx` or `src/data/ffx2`) names their art id
 * (Jecht and Lenne by name only). From angle 1's `final_csv.py` `GAME_FIX`.
 */
export const GAME_FALLBACK = Object.freeze({
  ...Object.fromEntries(
    ('anima bahamut biran-ronso braskas-final-aeon-1 braskas-final-aeon-2 dark-cindy dark-mindy dark-sandy dark-yojimbo guado-guardian ifrit ixion ' +
      'mortiorchis seymour-flux seymour-flux-body seymour-guest seymour-macalania shiva sinspawn-gui sinspawn-gui-2 yenke-ronso yojimbo yu-pagoda ' +
      'yunalesca-1 yunalesca-3 jecht').split(' ').map((s) => [s, 'FFX']),
  ),
  ...Object.fromEntries('logos ormi shuyin vegnagun-body vegnagun-head vegnagun-leg vegnagun-tail lenne'.split(' ').map((s) => [s, 'FFX-2'])),
});

/** `party-ffx | dressphere-ffx2 | aeon | dark-aeon | part | boss-foe | exp-leblanc | ff7`. */
export function subjectKind(subject) {
  if (subject.startsWith('exp-leblanc-')) return 'exp-leblanc';
  if (subject.startsWith('ff7-')) return 'ff7';
  if (PARTY.has(subject)) return 'party-ffx';
  if (DRESS.test(subject)) return 'dressphere-ffx2';
  if (AEONS.has(subject)) return 'aeon';
  if (DARK_AEONS.has(subject)) return 'dark-aeon';
  if (PARTS.has(subject)) return 'part';
  return 'boss-foe';
}

/**
 * `FFX | FFX-2 | FF7 | unknown`. `sidecarGame` is the subject's idle sidecar `game` field; `tableSource` is which generated table the subject sits in
 * (`ffx | ffx2 | foes | exp`) or undefined.
 */
export function gameOf(subject, sidecarGame, tableSource) {
  const t = String(sidecarGame ?? '').toLowerCase();
  if (t.startsWith('ffx-2') || t === 'ffx2') return 'FFX-2';
  if (t.startsWith('ffx only') || t === 'ffx') return 'FFX';
  const kind = subjectKind(subject);
  if (kind === 'dressphere-ffx2' || /^(x2-|ffx2-|exp-leblanc)/.test(subject)) return 'FFX-2';
  if (kind === 'party-ffx') return 'FFX';
  if (kind === 'ff7') return 'FF7';
  if (tableSource === 'ffx') return 'FFX';
  if (tableSource === 'ffx2') return 'FFX-2';
  return GAME_FALLBACK[subject] ?? 'unknown';
}

/** +1: the party side (the art must face right); -1: the enemy side (the art must face left). Only the mirror reads it. */
export function sideOf(subject) {
  const kind = subjectKind(subject);
  const party = kind === 'party-ffx' || kind === 'dressphere-ffx2' || kind === 'aeon' || kind === 'exp-leblanc';
  return party && !/^exp-leblanc-(ffx2-|leblanc|logos|ormi)/.test(subject) ? 1 : -1;
}

/** A sidecar's `facing`, normalised (`right | left | front | auto`), or null. */
export function parseFacing(v) {
  if (typeof v !== 'string') return null;
  const alias = { none: 'front', straight: 'front', 'straight-on': 'front', center: 'front', centre: 'front', camera: 'front', r: 'right', l: 'left' };
  const s = v.trim().toLowerCase();
  const f = alias[s] ?? s;
  return ['right', 'left', 'front', 'auto'].includes(f) ? f : null;
}

/** The mirror (`1 | -1`) the engine draws a painting with, given the way its art faces and the side its subject stands on. */
export function mirrorFor(artFacing, want) {
  if (artFacing === 'right') return want === 1 ? 1 : -1;
  if (artFacing === 'left') return want === -1 ? 1 : -1;
  return 1;
}

/**
 * The paintings the staged costume change owns (`twirl-*`, exempt as today): the five keys, and only on the dresspheres and the hidden chapter's copies of them.
 * (Pose continuity, 2026-10-17: it used to be any pose called `twirl...` on any subject, so a swapped `tidus/twirl-strike.png` was never read.)
 */
export const TWIRL_KEYS = /^twirl-(start|forming|going|mid|end)$/;
const STAGED_KINDS = new Set(['dressphere-ffx2', 'exp-leblanc']);

/** Poses the engine lays low (`critical | sleep | weak | kneel | low`), judged against the low band, not the standing one. */
export const LOW_POSES = new Set(['critical', 'sleep', 'weak', 'kneel', 'low']);

/**
 * The class of one pose, which decides the band it is judged in (`pose-bands.mjs`):
 * `idle` the reference itself; `staged` a dressphere `twirl-*` painting (the staged costume change: listed, never judged, but never empty);
 * `part` any pose of a hull, fin, limb or film still; `ko` a knock-out; `wide` wider than tall and not a KO (the engine's aspect test lays it
 * down unless the table marks it `upright`); `low` critical, sleep, kneel; `standing` everything else (idle excepted).
 * @param {{pose: string, isRef: boolean, prone: boolean, kind: string}} o `prone`: wider than tall by the engine's 1.15 aspect test and not marked `upright`.
 */
export function poseClassOf({ pose, isRef, prone, kind }) {
  if (isRef) return 'idle';
  if (kind === 'part' || kind === 'ff7') return 'part'; // a hull, a fin, a film still: not a standing figure, whatever the pose is called
  if (STAGED_KINDS.has(kind) && TWIRL_KEYS.test(pose)) return 'staged';
  if (pose === 'ko' || pose.startsWith('ko-')) return 'ko';
  if (prone) return 'wide';
  if (LOW_POSES.has(pose)) return 'low';
  return 'standing';
}

/**
 * **Props-out poses** (the W3 sizing rule, 2026-10-17; both games): a pose in which a raised sword or staff stands above the head, so the silhouette's box counts the prop
 * as height. These are measured HEAD TO SOLES (`bodyStature`: the registered head box's top to the planted row, over the idle's), both for the HEIGHT scale the ruler
 * sizes them by (`pose-ruler.mjs`) and for the stature band they are judged in (`pose-bands.mjs`). From the plan's "strike (head to soles, props out)" and the release
 * driver's pick of 2026-10-17 (item 89e): Tidus's victory and Yuna's Defend, drawn by the box, stood at 1.26 of the idle's height with the body exactly the idle's size.
 *
 * Only `victory` and `defend`. A strike (`attack`) is read by its box, as r50.1 drew it: head to soles would move Auron's attack from 0.90 to 1.00 of the idle's box
 * and his head from x1.29 to x1.43, Yuna's from 0.94 to 1.04 and Rikku's by 0.03, and the FFX holds are to come out as they were (measured: `docs/handoff/pose-continuity.md`,
 * "The W3 sizing rule"). Add `attack` here to read strikes head to soles too; nothing else needs to change.
 */
export const PROPS_OUT_POSES = new Set(['victory', 'defend']);

/** Is this pose measured head to soles? (Only a standing or low pose has a body to measure; a KO or a laid-down plane is read by its length.) */
export const isPropsOut = (pose) => PROPS_OUT_POSES.has(pose);
