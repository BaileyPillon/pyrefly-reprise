/**
 * The head lock of a rig: the size of the head part is the idle's in every key (PR-0534, r74-lulu; FFX only: the one rig that needs it is Lulu's). Pure TypeScript: no `three`, no DOM.
 *
 * A painted figure's head is held to the idle's by the engine's head lock (D-420); a rig has no plane to lock, and the pipeline's other rigs keep their head bone at scale 1 so the head part is drawn at
 * 1.0000 by construction (Ifrit, Valefor, Pterya, Bahamut and Seymour's body read 0.0 to 0.7 percent across their keys). Lulu's does not: her head part hangs on a shell bone (`headS`) under the head, the chest
 * and the SPINE, and the fitter scales her spine (0.95 to 1.1, to reach each painting's stature), so the head took the spine's scale with it: 1.0966 of the idle's in `cast` and `item`, 1.0523 in `critical`, 0.95 in
 * `ready` and `victory`, 0.88 in `ko`. The rig gate's band for a real head is 0.85 to 1.15, so every key passed it, while the continuity check (CHK-026) holds a head to 3 percent between two keys: 397 of round
 * 33b's 415 head failures were this (cast to idle 0.912 and ready to cast 1.154 are the commonest). Her rig cannot be re-fitted or re-stamped in this release (the gate refuses it today for four reasons that
 * have nothing to do with the head: `docs/handoff/r74-lulu.md`), so the lock is applied where the keys are compiled instead: the shell bone's own scale is set to the inverse of the scale it inherits, and the
 * head part is drawn at the idle key's own size in every key (1.0000 for her: her idle inherits no scale). Only the head, and the braid that hangs from it, stop growing with the spine; the body keeps its fitted stretch.
 *
 * What it leaves alone: the idle (the rest); a key that hides the part (format v2); a key that already puts its own scale on the shell bone (Lulu's version 1 `defend` and `od-fury` shrink it to 0.8 to tuck the
 * side head behind a front-view upper body: that is another head, which the continuity harness reads as a variant); a rig not in `RIG_HEAD_HOLD`; a part that is not rigid on one bone.
 * A rig file that carries the counter-scale in its own keys (a re-fit) is left alone the same way.
 *
 * Game case: FFX only (Lulu is an FFX figure; no other rig is listed).
 */
import type { RigData } from './RigData.ts';
import { C_SX, C_SY, CH, RigSkeleton } from './RigSkeleton.ts';

/** The rigs whose head part is held at the idle's size, by rig name: the part to hold. Lulu's only (PR-0534). */
export const RIG_HEAD_HOLD: Readonly<Record<string, string>> = Object.freeze({ lulu: 'head' });

export interface HeadHoldRow {
  key: string;
  /** `held`: the shell bone's scale was set; `unchanged`: the head already read 1; `idle`, `hidden` (the key hides the part) and `explicit` (the key scales the shell itself): left alone. */
  action: 'held' | 'unchanged' | 'idle' | 'hidden' | 'explicit';
  /** The part's linear size over the idle key's before the lock and after it (1 is the idle's own). */
  before: number;
  after: number;
}

/** The one bone a part is rigid on (every vertex, one influence), or -1 when it is on more than one or the rig has no such part. */
export function shellBoneOf(data: RigData, partName: string): number {
  const part = data.parts.find((p) => p.name === partName);
  if (!part) return -1;
  let bone = -2;
  for (let i = 0; i < part.boneA.length; i++) {
    const influences = part.boneB[i]! >= 0 && part.wB[i]! > 0 ? [part.boneA[i]!, part.boneB[i]!] : [part.boneA[i]!];
    for (const b of influences) {
      if (bone === -2) bone = b;
      else if (bone !== b) return -1;
    }
  }
  return bone < 0 ? -1 : bone;
}

/**
 * Set the shell bone's scale in every compiled key so the part is drawn at the idle KEY's size (the bind pose's only when the rig has no idle key; the two agree for Lulu, whose idle inherits no scale, and
 * a rig whose idle does carry a scale is held to that scale and not to 1). Changes `compiled` in place; returns what it did to each key.
 * @param compiled the rig's keys as channels (`compileKeys`, before the lock)
 */
export function holdPartSize(data: RigData, compiled: Map<string, Float64Array>, partName: string): HeadHoldRow[] {
  const shell = shellBoneOf(data, partName);
  if (shell < 0) return [];
  const part = data.parts.find((p) => p.name === partName)!;
  const sk = new RigSkeleton(data);
  /** The linear size the shell bone gives its part in a pose: the square root of the determinant of its world matrix. */
  const sizeIn = (pose: Float64Array): number => {
    sk.solve(pose);
    const q = shell * 6;
    return Math.sqrt(Math.abs(sk.m[q]! * sk.m[q + 3]! - sk.m[q + 1]! * sk.m[q + 2]!));
  };
  const rows: HeadHoldRow[] = [];
  const idlePose = compiled.get('idle');
  const target = idlePose ? sizeIn(idlePose) : 1;
  if (!(target > 0)) return [];
  for (const [name, pose] of compiled) {
    const before = sizeIn(pose);
    const row = (action: HeadHoldRow['action'], after = before): void => { rows.push({ key: name, action, before: before / target, after: after / target }); };
    if (name === 'idle') { row('idle'); continue; }
    const named = data.keys.get(name)?.parts?.[partName];
    if (named ? named.show === false : part.hidden) { row('hidden'); continue; }
    const o = shell * CH;
    if (pose[o + C_SX] !== 1 || pose[o + C_SY] !== 1) { row('explicit'); continue; }
    if (!(before > 0) || Math.abs(before / target - 1) < 5e-5) { row('unchanged'); continue; }
    const local = target / before;
    if (!(local > 0 && local <= 4)) { row('unchanged'); continue; } // out of the format's range (0, 4]: leave the key as the file has it
    pose[o + C_SX] = local;
    pose[o + C_SY] = local;
    row('held', sizeIn(pose));
  }
  return rows;
}
