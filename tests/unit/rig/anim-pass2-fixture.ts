/**
 * Shared by the pass-2 tests (`anim-pass2.test.ts`, `anim-pass2-play.test.ts`): the synthetic rig with the keys the clips need, an animator on it, and Lulu's real rig where the disk has it.
 */
import { existsSync, readFileSync } from 'node:fs';
import { expect } from 'vitest';
import type { ClipRig } from '../../../src/engine/rig/anim/AnimClip.ts';
import { RigAnimator, type AnimFrame } from '../../../src/engine/rig/anim/RigAnimator.ts';
import { STYLE_P2 } from '../../../src/engine/rig/anim/AnimStyles.ts';
import type { Subject } from '../../../src/engine/rig/anim/AnimLibrary.ts';
import { readRig } from '../../../src/engine/rig/RigData.ts';
import { compileKeys } from '../../../src/engine/rig/RigKeys.ts';
import { RigSkeleton } from '../../../src/engine/rig/RigSkeleton.ts';
import { normaliseRig } from '../../../tools/rig/rig-format.mjs';
import { clipRigOf } from '../../../tools/rig/lane/anim-rig.mjs';
import { makeRigFile } from './rig-fixture.ts';

export const LULU_V2 = 'D:/pyrefly-art-rigs/lulu-v2';
export const HAVE_RIG = existsSync(`${LULU_V2}/rig.json`);
export const near = (a: number, b: number, tol = 0.6): void => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);

/** The synthetic rig with the keys the clips need (a different arm angle each). */
export function fixture() {
  const f = makeRigFile();
  f.keys['follow'] = { bones: { chest: { rot: 0.5 } }, source: 'authored' };
  f.keys['cast'] = { bones: { arm: { rot: -2.4 } }, source: 'authored' };
  f.keys['item'] = { bones: { arm: { rot: -1.9 } }, source: 'authored' };
  f.keys['victory'] = { bones: { arm: { rot: -2.8 } }, source: 'authored' };
  f.keys['attack'] = { bones: { arm: { rot: 0.8 } }, source: 'authored' };
  f.keys['hurt'] = { bones: { chest: { rot: -0.4 } }, source: 'authored' };
  f.keys['ko'] = { bones: { pelvis: { rot: 1.4 } }, source: 'authored' };
  const r = readRig(f);
  if (!r.ok) throw new Error(r.reason);
  return r.data;
}
export const SUBJECT: Subject = { accents: {}, idle: { breath: {}, shift: {} }, secondary: () => ({ rots: [], points: [] }), hand: 'hand' };
export function animator(style = STYLE_P2) {
  const d = fixture();
  const keys = compileKeys(d);
  const an = new RigAnimator({ boneIndex: d.boneIndex, roots: d.roots, keys, channels: d.bones.length * 5, bones: d.bones, skeleton: new RigSkeleton(d) }, style, SUBJECT, 1280);
  return { an, keys, work: Float64Array.from(keys.get('idle')!), vel: new Float64Array(d.bones.length * 5) };
}
export const frame = (dt = 1 / 60): AnimFrame => ({ dt, rate: 1, forward: 0, calm: false });
/** Step `ms` of the animator's clock in 60 Hz frames; the events come back in order. */
export function run(a: ReturnType<typeof animator>, ms: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < Math.round((ms * 60) / 1000); i++) {
    a.an.step(frame(), a.work, a.vel);
    out.push(...a.an.drain());
  }
  return out;
}

export function luluRig(): ClipRig & { bones: unknown } {
  const { rt } = normaliseRig(JSON.parse(readFileSync(`${LULU_V2}/rig.json`, 'utf8')), { dir: LULU_V2 });
  return clipRigOf(rt) as ClipRig & { bones: unknown };
}

