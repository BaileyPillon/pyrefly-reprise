/**
 * Figures built before their battle asks for them (lane "prebuild", 2026-10-24; both games, shared presentation plumbing; the conference demo's fights only, behind `?pack=demo`, off with `?prebuild=off`).
 *
 * Measured on the served r63-play build (headless GPU Chromium, 2560 x 1440, the stage warm finished): even with the diorama built and compiled behind the picker, the first 9 s of each fight lost 0.6 to 2 s of
 * frame time, in frames of 100 to 530 ms, and the biggest part was the FIGURES: each is built at the battle's entry (`PaintedActor.create`: the pose textures, the extents reads), its painting uploaded on the
 * frame that first draws it (17 to 80 ms a figure, 223 MB in the first 2.4 s of Chapter I), and its programs linked on the first draw. `PaintedStage.add` is the one place a figure is made, so the demo's warm makes
 * them there ahead of time: this file is where a made figure waits.
 *
 * A figure is parked with the fingerprint of the question it answers (`StageFigureRequest.ts`); `add` takes it only when its own question has the same fingerprint, so a figure built for a different party, a
 * different height or a different rig switch is never used. A figure nobody takes is disposed with everything it holds (`dropParked`). The pose textures are uploaded where it was parked (the warm's offscreen
 * draws), so the battle finds them resident.
 *
 * No DOM here and no three import: a parked figure is the object `PaintedActor` made, held by reference.
 */
import type { PaintedActor } from './PaintedActor.ts';
import type { BuiltFigure } from './rig/RigStage.ts';
import { unregisterRigUse } from './rig/RigLoad.ts';

export interface Parked {
  readonly id: string;
  readonly fingerprint: string;
  readonly built: BuiltFigure;
  /** Who it was made for: the scene's key (a figure of one chapter's room is never offered to another's). */
  readonly scope: string;
  /** The page's clock when it was parked, for the probe. */
  readonly at: number;
}

const parked = new Map<string, Parked>();

/** What the battle found: figures taken, a parked figure for another question (disposed), asks with nothing parked. The probe reads it as `window.__prebuildStats`. */
const stats = { parked: 0, taken: 0, mismatched: 0, absent: 0 };
if (typeof window !== 'undefined') (window as unknown as Record<string, unknown>)['__prebuildStats'] = stats;

const keyOf = (scope: string, id: string): string => `${scope}|${id}`;

function release(p: Parked): void {
  try {
    unregisterRigUse(p.id);
  } catch {
    /* no rig registered */
  }
  try {
    p.built.actor.dispose();
  } catch {
    /* already gone */
  }
}

/** Park a built figure. A figure already parked for the same scope and id is disposed (the newer answers the newer question). */
export function parkFigure(scope: string, id: string, fingerprint: string, built: BuiltFigure): void {
  const key = keyOf(scope, id);
  const old = parked.get(key);
  if (old) release(old);
  parked.set(key, { id, fingerprint, built, scope, at: typeof performance !== 'undefined' ? performance.now() : 0 });
  stats.parked++;
}

/** Is a figure parked for this scope and id that answers `fingerprint`? (Does not take it.) */
export function hasParked(scope: string, id: string, fingerprint?: string): boolean {
  const p = parked.get(keyOf(scope, id));
  return !!p && (fingerprint === undefined || p.fingerprint === fingerprint);
}

/**
 * The figure parked for this scope and id when it answers `fingerprint`, no longer parked here (the stage owns it now). A figure parked for another question is disposed and nothing is returned: the stage
 * builds its own, as it always did.
 */
export function takeParkedFigure(scope: string | undefined, id: string, fingerprint: string): BuiltFigure | null {
  if (scope === undefined) return null;
  const key = keyOf(scope, id);
  const p = parked.get(key);
  if (!p) {
    stats.absent++;
    return null;
  }
  parked.delete(key);
  if (p.fingerprint !== fingerprint) {
    stats.mismatched++;
    release(p);
    return null;
  }
  stats.taken++;
  return p.built;
}

/** Dispose every figure parked for `scope` (all scopes without it). Returns how many. */
export function dropParked(scope?: string): number {
  let n = 0;
  for (const [key, p] of [...parked]) {
    if (scope !== undefined && p.scope !== scope) continue;
    parked.delete(key);
    release(p);
    n++;
  }
  return n;
}

/** The parked actors of a scope, in the order they were parked (the warm draws them to build their programs). */
export function parkedActors(scope: string): PaintedActor[] {
  const out: PaintedActor[] = [];
  for (const p of parked.values()) if (p.scope === scope) out.push(p.built.actor);
  return out;
}

/** How many figures are parked, and for which scopes (the probe and the tests). */
export function parkedSummary(): { count: number; ids: string[] } {
  return { count: parked.size, ids: [...parked.values()].map((p) => `${p.scope}:${p.id}`) };
}
