/**
 * **The website's Fayth scene: the painted skin at FFX's staging with FFX's camera timing and framing, from our own shot table** (FFX only; `docs/plans/fayth-3d.md` phase 6, Bailey's pick 2026-10-11: painted
 * variant B). It is what the deck scene (`./exp-fayth-deck.ts`) publishes wherever FFX's own camera programs are not there: the website, production, every test and a dev server without Bailey's local folder.
 * It reads no local file and holds no program: the shots are `../data/ffx/camera/evrae-shots.ts`, derived by replaying FFX's programs on Bailey's PC and simplified to keyframes (`research/ffx-battle-camera-evrae.md`).
 *
 * - **The staging** is `./exp-fayth-stage.ts`'s: the party on FFX's three slots, Evrae on his NEAR and FAR spots, the deck laid under them, the sky plate behind, the rigs, and Evrae drawn as tall as the game frames him.
 * - **The camera** is the table camera (`../engine/ffxcam/tableCamera.ts`): the table director plays a shot on each of the presenter's beats, the launch fallback, the airship's range scenes, the defeat and the
 *   tracking net are the same code as the dev server's FFX camera (`../engine/ffxcam/cameraCore.ts`). The pose goes through the painted B's filter (the eye's azimuth within 35 degrees of the near default view's,
 *   the look direction's pitch inside the plate's height, and the frame on the painting: `../engine/ffxcam/plateFit.ts`) and is written at the head of the render (`../engine/ffxcam/latch.ts`), after the
 *   battle camera and the MAX mix have had their say; the sink clears the mix's view offset, as the dev server's does.
 * - **A dev server** can force it with `?ffxcam=table` (even with Bailey's folder there), to compare it with FFX's own programs shot for shot; the handle `__ffxtable` is left on `globalThis` for captures and
 *   checks. `?ffxseed=n` seeds the camera's own dice (default 1). None of this is in a production build.
 *
 * Game case: FFX only.
 */

import { Scene, type PerspectiveCamera } from 'three';
import { EVRAE_SHOTS } from '../data/ffx/camera/evrae-shots.ts';
import { PoseLatch, hookBeforeRender } from '../engine/ffxcam/latch.ts';
import { paintedBFilter } from '../engine/ffxcam/plateFit.ts';
import { ThreeCameraSink } from '../engine/ffxcam/sink.ts';
import { TableCamera } from '../engine/ffxcam/tableCamera.ts';
import { FFX_FAR_VIEW, FFX_NEAR_VIEW, ffxFaythStaging } from '../engine/ffx3d/ffxStaging.ts';
import { ffxWorldMatrix } from '../engine/ffx3d/ffxWorld.ts';
import { airshipRangeDirectorOf } from './evrae-airship-director.ts';
import { derive, faythRigs, flatBillboards, layPainted, paintedParts, sizeEvrae } from './exp-fayth-stage.ts';
import { worldOf } from './exp-fayth-world.ts';
import type { SceneBuild } from './types.ts';

/** What the debug handle `globalThis.__ffxtable` holds (dev server only). */
export interface FaythTableHandle {
  readonly camera: TableCamera;
  readonly net: TableCamera['net'];
  readonly latch: PoseLatch;
  /** The three.js camera the pose is written on, once the battle camera is bound. */
  readonly target: () => PerspectiveCamera | null;
  /** Every shot the director has started: `[id, logic step, beat]`. */
  readonly starts: Array<readonly [string, number, string]>;
}

/** The query that forces the table camera on a dev server (`?ffxcam=table`). */
export function tableForced(search: string): boolean {
  return new URLSearchParams(search).get('ffxcam')?.toLowerCase() === 'table';
}

/** The seed of the camera's own dice: `?ffxseed=n` on a dev server, else 1 (the same fight plays the same shots). */
function seedOf(search: string): number {
  const n = Number.parseInt(new URLSearchParams(search).get('ffxseed') ?? '', 10);
  return import.meta.env.DEV && Number.isFinite(n) ? n : 1;
}

/**
 * The website's scene: Chapter VIII's deck (`base`, with the stub director on it) staged as the painted skin at FFX's staging, with the table camera published as its shot director. A derived build: new rigs,
 * slots and pins, the camera hook, and an `update` and `dispose` that run the camera's. Chapter VIII's own tables (its `RIGS`, its slot arrays) are never written.
 */
export async function stageFaythTable(base: SceneBuild): Promise<SceneBuild> {
  const search = typeof location === 'undefined' ? '' : location.search;
  const staging = ffxFaythStaging();
  const { near, far } = staging.views;
  const range = airshipRangeDirectorOf(base.group);
  if (range) {
    range.staging = {
      near: { evrae: staging.spots.near, rigs: { idle: near, action: near, enemy: near } },
      far: { evrae: staging.spots.far, rigs: { idle: far, action: far, enemy: far } },
    };
  }
  layPainted(paintedParts(base), staging, base.particles);
  const flat = flatBillboards();
  const evrae = sizeEvrae();

  let target: PerspectiveCamera | null = null;
  const aspect = (): number => target?.aspect ?? 16 / 9;
  const latch = new PoseLatch(paintedBFilter(FFX_NEAR_VIEW.thetaDeg, aspect));
  const starts: Array<readonly [string, number, string]> = [];
  const camera = new TableCamera({
    table: EVRAE_SHOTS,
    sink: latch,
    world: worldOf(base, null, aspect),
    seed: seedOf(search),
    homes: { near: FFX_NEAR_VIEW, far: FFX_FAR_VIEW },
    ...(import.meta.env.DEV ? { onStart: (id: string, step: number, why: string) => void starts.push([id, step, why] as const) } : {}),
  });
  let unhook: (() => void) | null = null;
  const unbind = (): void => {
    unhook?.();
    unhook = null;
    latch.bind(null);
    target = null;
  };
  if (import.meta.env.DEV) {
    (globalThis as { __ffxtable?: FaythTableHandle }).__ffxtable = { camera, net: camera.net, latch, target: () => target, starts };
  }

  return derive(base, {
    rigs: faythRigs(staging) as SceneBuild['rigs'],
    partySlots: staging.partySlots,
    enemySlots: staging.enemySlots,
    enemySpots: staging.enemySpots,
    sideFacing: { party: -1, enemy: 1 },
    shotDirector: camera.shotDirector,
    bindCamera(c) {
      base.bindCamera?.(c);
      unbind();
      const scene = base.group.parent;
      if (!c || !(scene instanceof Scene)) return;
      target = c.camera;
      latch.bind(new ThreeCameraSink(c.camera, ffxWorldMatrix(), { clearViewOffset: true }));
      unhook = hookBeforeRender(scene, c.camera, () => latch.present());
    },
    update(dt: number): void {
      base.update(dt);
      flat(base.group);
      evrae(base.group);
      camera.update(dt);
    },
    dispose(): void {
      camera.dispose();
      unbind();
      if (import.meta.env.DEV) {
        const g = globalThis as { __ffxtable?: FaythTableHandle };
        if (g.__ffxtable?.camera === camera) delete g.__ffxtable; // not a newer scene's handle (a retry builds the next scene before the last one is disposed)
      }
      base.dispose();
    },
  });
}
