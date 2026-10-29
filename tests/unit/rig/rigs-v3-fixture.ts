/**
 * The fixture of the rigs-v3 tests (`rigs-v3-ko.test.ts`, `rigs-v3-return.test.ts`): a rig of Tidus's own idle painting (the plane, its registration, its head box and its underside are the game's) in which the `ko` key and a
 * `cast` key draw their own pieces (a rig drawn by pose), the real `RigActor`, and the real `LivingFigure` stepped the way the game steps it (the mix first, then the stage's actor update).
 */
import { Texture } from 'three';
import type { RigFile } from '../../../src/data/art/rigTypes.ts';
import { painting } from '../engine/head-lock-fixture.ts';
import { makeRigFile } from './rig-fixture.ts';

export const { RigActor } = await import('../../../src/engine/rig/RigActor.ts');
export const { readRig } = await import('../../../src/engine/rig/RigData.ts');
export const { LivingFigure } = await import('../../../src/engine/fx/mix/living.ts');
export type RigActorT = import('../../../src/engine/rig/RigActor.ts').RigActor;
export type LifeCtx = import('../../../src/engine/fx/mix/living.ts').LifeCtx;

export const FRAME = 1000 / 60;
export const ctxOf = (over: Partial<LifeCtx> = {}): LifeCtx => ({ dt: 0, game: 'ffx', breath: false, collapse: true, rm: false, grid: [4, 6], ...over });

/** A rig of Tidus's idle painting in which the `ko` key (and `cast`) draw their own pieces: the lying body's head is to the RIGHT of the feet (`headRight`) or to the left. */
export function poseDrawnRig(headRight = true, drawKo = true): RigFile {
  const idle = painting('tidus', 'idle').meta;
  const w = idle.width, h = idle.height, base = idle.baselineY ?? h * 0.97, sx = idle.stanceX ?? w / 2;
  const side = headRight ? 1 : -1;
  const parts = [
    { name: 'legs', order: 0, png: 'legs.png', box: [sx - 0.12 * w, base - 0.42 * h, 0.24 * w, 0.42 * h] as [number, number, number, number], bone: 'pelvis', variants: { ko: { png: 'legs.ko.png' }, cast: { png: 'legs.cast.png' } } },
    { name: 'body', order: 1, png: 'body.png', box: [sx - 0.14 * w, base - 0.78 * h, 0.28 * w, 0.4 * h] as [number, number, number, number], bone: 'chest', variants: { ko: { png: 'body.ko.png' }, cast: { png: 'body.cast.png' } } },
    { name: 'head', order: 2, png: 'head.png', box: [sx - 0.09 * w, base - 0.97 * h, 0.18 * w, 0.2 * h] as [number, number, number, number], bone: 'head', variants: { ko: { png: 'head.ko.png' }, cast: { png: 'head.cast.png' } } },
  ];
  const ko = { bones: { pelvis: { rot: side * 1.5, dx: side * 0.34 * w, dy: -0.06 * h } }, source: 'characters/tidus/ko', planted: false, ms: 420, parts: { legs: { image: 'ko' }, body: { image: 'ko' }, head: { image: 'ko' } } };
  const cast = { bones: { chest: { rot: 2.5 } }, source: 'characters/tidus/cast', ms: 150, parts: { legs: { image: 'cast' }, body: { image: 'cast' }, head: { image: 'cast' } } };
  const f = makeRigFile({
    version: 2,
    name: 'tidus',
    image: { w, h },
    baselineY: base,
    bones: [
      { name: 'root', parent: -1, x: sx, y: base },
      { name: 'pelvis', parent: 0, x: sx, y: base - 0.42 * h },
      { name: 'chest', parent: 1, x: sx, y: base - 0.55 * h },
      { name: 'head', parent: 2, x: sx, y: base - 0.85 * h },
    ],
    parts: parts.map((p) => (drawKo ? p : { ...p, variants: undefined })) as RigFile['parts'],
    landmarks: { head: { bone: 'head', x: sx, y: base - 0.87 * h }, feet: { bone: 'root', x: sx, y: base } },
    keys: { idle: { bones: {}, source: 'characters/tidus/idle' }, ...(drawKo ? { ko, cast } : { ko: { bones: { pelvis: { rot: side * 1.5 } }, source: 'characters/tidus/ko', planted: false } }) } as RigFile['keys'],
    motion: undefined,
    gate: {
      status: 'ok', at: '2026-10-29T00:00:00Z', by: 'test',
      silhouettes: { ko: { box: [sx - 0.1 * w, base - 0.25 * h, sx + 0.8 * w * side, base], feet: null, profile: { left: [0, 0], right: [1, 1] } } },
    },
  });
  return f;
}

export async function rigged(file: RigFile, side: 'party' | 'enemy' = 'party'): Promise<RigActorT> {
  const r = readRig(file);
  if (!r.ok) throw new Error(r.reason);
  const a = await RigActor.createRigged({ name: 'tidus', worldHeight: 1.82, side, shadow: false, breathe: false, sway: false }, { data: r.data, base: '/art/rigs/tidus', idlePainting: painting('tidus', 'idle'), loadTexture: async () => new Texture() });
  a.position.set(side === 'party' ? -2 : 2, 0, 0);
  a.setPose('idle', { immediate: true, force: true });
  return a;
}

export interface Stage { a: RigActorT; living: InstanceType<typeof LivingFigure>; frame(n?: number): void; roll(): number; key(): string; head(): number; over: Partial<LifeCtx> }
export function stage(a: RigActorT, over: Partial<LifeCtx> = {}): Stage {
  const living = new LivingFigure(a);
  const s: Stage = {
    a, living, over,
    frame(n = 1): void { for (let i = 0; i < n; i++) { living.update(ctxOf({ dt: FRAME / 1000, realDt: FRAME / 1000, ...s.over })); a.update(FRAME / 1000, FRAME / 1000); } },
    roll: () => ((a as unknown as { slots: Array<{ mesh: { rotation: { z: number } } }>; active: number }).slots[(a as unknown as { active: number }).active]!.mesh.rotation.z),
    key: () => a.pose,
    head: () => a.position.x + a.landmark('head')!.x,
  };
  s.frame(); // the mix has seen the figure
  return s;
}

