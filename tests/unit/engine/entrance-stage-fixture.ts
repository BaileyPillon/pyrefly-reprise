/**
 * The rig of the entrance seam's tests (`entrance-stage.test.ts`, `entrance-stage-modes.test.ts`; decision 61e; both games): the REAL `PaintedActor`, headless (the head-lock fixture), a
 * fake host that records the motes, the hush and the comfort flags, and a `step` that runs a frame the way the stage does (the actor first, then the entrances).
 */
import { PaintedActor, painting, type Actor } from './head-lock-fixture.ts';
import { StageEntrances, type EntranceHost } from '../../../src/engine/entrance/StageEntrances.ts';
import type { GatherMote } from '../../../src/engine/entrance/entranceLook.ts';

export { reset } from './head-lock-fixture.ts';
export type { Actor };

export const FRAME = 1000 / 60;
export const DT = FRAME / 1000;

export interface Rig {
  ent: StageEntrances;
  motes: GatherMote[];
  hushed: Set<unknown>;
  tracked: Set<string>;
  comfort: { reduceMotion: boolean; lowEffects: boolean };
  flags: { reduceFlashes: boolean; tier: 'full' | 'phone' | 'low' };
  /** One frame of the stage: the actor, then the entrances. */
  step(n?: number): void;
  figure(id: string): Actor;
}

export function rig(): Rig {
  const motes: GatherMote[] = [];
  const hushed = new Set<unknown>();
  const tracked = new Set<string>();
  const comfort = { reduceMotion: false, lowEffects: false };
  const flags = { reduceFlashes: false, tier: 'full' as 'full' | 'phone' | 'low' };
  const host: EntranceHost = {
    spawn: (m) => (motes.push(m), true),
    hush: (a, on) => void (on ? hushed.add(a) : hushed.delete(a)),
    tracked: (id) => tracked.has(id),
    comfort: () => comfort,
    reduceFlashes: () => flags.reduceFlashes,
    cameraAt: () => ({ x: 0, y: 3, z: 14 }),
    tier: () => flags.tier,
  };
  const ent = new StageEntrances(host);
  const figures: Actor[] = [];
  const r: Rig = {
    ent,
    motes,
    hushed,
    tracked,
    comfort,
    flags,
    step(n = 1): void {
      for (let i = 0; i < n; i++) {
        for (const a of figures) a.update(DT, DT);
        ent.update(DT);
        for (const a of figures) a.updateMatrixWorld(true);
      }
    },
    figure(id: string): Actor {
      // a boss: the idle painting of any subject the pose record has, stood where a boss stands
      const a = new PaintedActor({ name: id, worldHeight: 4.1, side: 'enemy', breathe: false, sway: false, shadow: false });
      a.adoptPoses({ idle: painting('yuna', 'idle') }, 'idle');
      a.position.set(3, 0, -4);
      a.updateMatrixWorld(true);
      figures.push(a);
      return a;
    },
  };
  return r;
}

/** Whole stage frames until `ms` of stage clock have passed. */
export const frames = (ms: number): number => Math.round(ms / FRAME);

