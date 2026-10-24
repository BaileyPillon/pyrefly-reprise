/**
 * A scene built before its battle asks for it (release 62, PR-0481; demo mode only today; both games, shared presentation plumbing).
 *
 * `BattleScreen.enter` used to call `loadScene` as its first act, and on a cold page that one call is 0.8 s of one main-thread task (the backdrop's layer canvases: `fillRect`, `getImageData`,
 * `drawImage`; measured under the entry's swirl on the booth plan, round 28's deep review of release 61, PR-0481) and the diorama's programs then build on the first draw, 1.0 to 1.5 s more.
 * The conference demo has two fights and a picker that stands for seconds, so `app/demo/demoWarm.ts` builds each fight's scene behind the title and the picker, compiles it and draws it once
 * into an offscreen buffer; the battle then TAKES that scene instead of building one. Nothing about the scene differs: it is the same `loadScene(key, camera)` call, made earlier, once, and
 * used once (a taken scene is no longer held here, so it is disposed by the battle exactly as a freshly built one is).
 *
 * One scene per key at a time. A scene nobody takes is disposed when it is replaced (`dropPrebuilt`, or a second `prebuildScene` for the key after the first was taken). Where nothing was
 * prebuilt (every non-demo battle, the first press before the warm finished) `takeScene` is `loadScene`.
 */

import type { PerspectiveCamera } from 'three';
import { loadScene, type LoadedScene } from './index.ts';

const held = new Map<string, Promise<LoadedScene>>();

/** Build the scene for `key` now and hold it for the battle that will take it. Idempotent while one is held; resolves with the scene (or rejects as `loadScene` does, and then holds nothing). */
export function prebuildScene(key: string, camera: PerspectiveCamera): Promise<LoadedScene> {
  const known = held.get(key);
  if (known) return known;
  const made = loadScene(key, camera);
  held.set(key, made);
  made.catch(() => {
    if (held.get(key) === made) held.delete(key);
  });
  return made;
}

/** Is a scene being held for `key` (built or still building)? */
export function hasPrebuilt(key: string): boolean {
  return held.has(key);
}

/** The scene for `key`: the one held (built before, handed over now and no longer held here), else a fresh `loadScene`. */
export function takeScene(key: string, camera: PerspectiveCamera): Promise<LoadedScene> {
  const made = held.get(key);
  if (!made) return loadScene(key, camera);
  held.delete(key);
  return made.catch(() => loadScene(key, camera)); // a held build that failed is built again, as it would have been
}

/** Dispose every scene held and not taken. */
export function dropPrebuilt(): void {
  for (const made of held.values()) void made.then((s) => s.dispose(), () => undefined);
  held.clear();
}
