/**
 * The fixture of the KO fall and revive tests (`ko-fall-actor.test.ts`, `ko-revive-actor.test.ts`; FA-2 and FA-3; both games).
 *
 * The REAL `PaintedActor` (the head-lock fixture's: real pose records and registration rows, a real head lock) under the REAL `LivingFigure`, stepped
 * frame by frame the way the game steps it (the mix first, with the field dt and the real dt, then the stage's actor update and head lock), and read
 * the way the continuity harness reads it: every plane's fade and its four corners projected onto the 1600x900 canvas, then `analyzeSwap`,
 * `figureTrack` and `detectJerks` with the policy's own thresholds. The masks are synthetic (a standing bar and a lying bar; the approved paintings are
 * not in a worktree), at an overlap far below the worst real one, so a pass is not easier than a pass on the paintings.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Matrix4, Mesh, PerspectiveCamera, ShaderMaterial } from 'three';
import { H, PaintedActor, W, cameraAt, painting, slotsOf, viewOf, type Actor } from './head-lock-fixture.ts';
import { analyzeSwap, unitSquareToQuad } from '../../../critic/runner/lib/continuity-pure.mjs';
import { LivingFigure, type LifeCtx } from '../../../src/engine/fx/mix/living.ts';

export { analyzeSwap };
export const FRAME = 1000 / 60;
const POLICY = JSON.parse(readFileSync(resolve(__dirname, '..', '..', '..', 'critic', 'policy.json'), 'utf8')) as { continuity: Parameters<typeof analyzeSwap>[0]['cfg'] };
/** The continuity harness's own thresholds (`critic/policy.json`). */
export const CFG = POLICY.continuity;

/** A party figure in its hurt painting, ready to fall (or, for `ko`, already down). */
export function figure(subject: string, side: 'party' | 'enemy' = 'party', start: 'hurt' | 'ko' = 'hurt'): Actor {
  const a = new PaintedActor({ name: subject, worldHeight: 1.82, side, breathe: false, sway: false, shadow: false });
  a.adoptPoses({ idle: painting(subject, 'idle'), hurt: painting(subject, 'hurt'), ko: painting(subject, 'ko') }, 'idle');
  a.position.set(side === 'party' ? -2 : 2, 0, 0);
  a.setPose(start, { immediate: true, force: true });
  return a;
}

/** The probe's corners for a plane, projected onto the 1600x900 canvas (`continuity-probe.mjs`' order). */
export function corners(cam: PerspectiveCamera, world: Matrix4): number[] {
  const vp = viewOf(cam).elements;
  const m = world.elements;
  const q: number[] = [];
  for (const [lx, ly] of [[-0.5, 0.5], [0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]] as const) {
    const x = m[0]! * lx + m[4]! * ly + m[12]!;
    const y = m[1]! * lx + m[5]! * ly + m[13]!;
    const z = m[2]! * lx + m[6]! * ly + m[14]!;
    const cx = vp[0]! * x + vp[4]! * y + vp[8]! * z + vp[12]!;
    const cy = vp[1]! * x + vp[5]! * y + vp[9]! * z + vp[13]!;
    const cw = vp[3]! * x + vp[7]! * y + vp[11]! * z + vp[15]!;
    q.push(((cx / cw) * 0.5 + 0.5) * W, (-(cy / cw) * 0.5 + 0.5) * H);
  }
  return q;
}

export const ctxOf = (over: Partial<LifeCtx> = {}): LifeCtx => ({ dt: 0, game: 'ffx', breath: false, collapse: true, rm: false, grid: [4, 6], ...over });

export interface Rig {
  a: Actor;
  living: LivingFigure;
  cam: PerspectiveCamera;
  over: Partial<LifeCtx>;
  /** One frame of the game: the mix (field dt, real dt), the stage's actor update, the head lock, the world. `freeze` holds the field clock (a hit-stop). */
  frame(freeze?: boolean): void;
}

export function rig(subject: string, over: Partial<LifeCtx> = {}, side: 'party' | 'enemy' = 'party', start: 'hurt' | 'ko' = 'hurt'): Rig {
  const a = figure(subject, side, start);
  const living = new LivingFigure(a);
  const cam = cameraAt(3);
  const r: Rig = {
    a,
    living,
    cam,
    over,
    frame(freeze = false): void {
      const field = freeze ? 0 : FRAME;
      living.update(ctxOf({ dt: field / 1000, realDt: FRAME / 1000, ...over }));
      a.update(field / 1000, FRAME / 1000);
      a.holdHead(viewOf(cam));
      a.updateMatrixWorld(true);
    },
  };
  r.frame(); // the mix has seen the figure
  a.holdHead(viewOf(cam));
  return r;
}

export interface Slot {
  pose: string;
  fade: number;
  mesh: Mesh;
  material: ShaderMaterial;
  meta: { width: number; height: number; stanceX?: number; head?: [number, number, number, number] };
  scale: { anchorY: number; prone: boolean };
}
export const slots = (a: Actor): [Slot, Slot] => slotsOf(a) as unknown as [Slot, Slot];
export const standing = (a: Actor, pose = 'hurt'): Slot => slots(a).find((s) => s.pose === pose)!;
export const lying = (a: Actor): Slot => slots(a).find((s) => s.pose === 'ko')!;
export const index = (a: Actor, s: Slot): number => slots(a).indexOf(s);

/** The probe's record of the figure: `[k, fade, visible, ...q]` per plane. */
export function record(r: Rig): { i: number; a: number; act: number; s: number[][]; g: [number, number] } {
  const act = (r.a as unknown as { active: number }).active;
  return {
    i: 0,
    a: 1,
    act,
    s: slots(r.a).map((s, k) => [k, s.fade, s.fade > 0.001 ? 1 : 0, ...corners(r.cam, s.mesh.matrixWorld)]),
    g: [0, 0],
  };
}

const solidBar = (cols: [number, number], rows: [number, number], n = 16): { w: number; h: number; bits: Uint8Array } => {
  const bits = new Uint8Array(n * n);
  for (let y = rows[0]; y <= rows[1]; y++) for (let x = cols[0]; x <= cols[1]; x++) bits[y * n + x] = 1;
  return { w: n, h: n, bits };
};

/** The harness's anchors for the two planes: the registered head and stance, a synthetic mask (a standing bar, a lying bar). */
export function anchors(a: Actor): Array<Record<string, unknown>> {
  return slots(a).map((s) => {
    const m = s.meta;
    const lies = s.scale.prone;
    return {
      head: m.head ? { u0: m.head[0], t0: m.head[1], u1: m.head[2], t1: m.head[3] } : null,
      mass: 0.3,
      stance: !lies && m.stanceX !== undefined ? { u: m.stanceX / m.width, t: s.scale.anchorY / m.height } : null,
      stanceSrc: 'registration',
      mask: lies ? solidBar([0, 15], [10, 15]) : solidBar([6, 9], [0, 15]),
      prone: lies,
    };
  });
}

/** Knock the figure out and step `n` frames; the records of every frame, the one the KO was called in first. */
export function fall(r: Rig, n: number, freeze: (i: number) => boolean = () => false): Array<ReturnType<typeof record>> {
  r.a.setPose('ko');
  const out = [record(r)];
  for (let i = 0; i < n; i++) {
    r.frame(freeze(i));
    out.push(record(r));
  }
  return out;
}

/** Revive the figure and step `n` frames; the records of every frame, the one the revive was called in first. */
export function revive(r: Rig, n: number, pose = 'idle', freeze: (i: number) => boolean = () => false): Array<ReturnType<typeof record>> {
  r.a.setPose(pose);
  const out = [record(r)];
  for (let i = 0; i < n; i++) {
    r.frame(freeze(i));
    out.push(record(r));
  }
  return out;
}

const applyMap = (Hm: number[], u: number, t: number): [number, number] => {
  const w = Hm[6]! * u + Hm[7]! * t + Hm[8]!;
  return [(Hm[0]! * u + Hm[1]! * t + Hm[2]!) / w, (Hm[3]! * u + Hm[4]! * t + Hm[5]!) / w];
};

/** The screen x of the head's middle through a plane. */
export function headX(r: Rig, s: Slot): number {
  const m = s.meta as { head: [number, number, number, number] };
  const q = corners(r.cam, s.mesh.matrixWorld);
  const map = unitSquareToQuad(q);
  const [x] = applyMap(map as unknown as number[], (m.head[0] + m.head[2]) / 2, (m.head[1] + m.head[3]) / 2);
  return x;
}

/** The screen x of the middle of a plane's four corners. */
export function middleX(r: Rig, s: Slot): number {
  return corners(r.cam, s.mesh.matrixWorld).filter((_, i) => i % 2 === 0).reduce((x, y) => x + y, 0) / 4;
}
