import type { Object3D } from 'three';

// ---------------------------------------------------------------------------
// The Cavern's view of the staged figures (FFX only)
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]: Chapter IX's three enemy ids.
//
// A scene owns no actors (`src/scenes/types.ts`), and nothing in the scene
// contract tells a scene when the fight starts or ends. Chapter IX needs both
// (the sakura arrival at fight start, the pad lit after the victory, Bailey's
// O-4 pick), so the scene reads the figures the battle stage parents next to
// its own group, by the combatant id the stage names each `PaintedActor`
// after (`BattlePresenterStage.add`, `name: c.id`). Presentation only: it
// never touches battle state, and on any other chapter's field it finds
// nothing and does nothing.
//
// What it writes, and only on Chapter IX's own figures:
// - Yojimbo's and Daigoro's alpha during the arrival, and Yojimbo's step out
//   from the tree (restored exactly to where the stage put him);
// - **Daigoro's size.** The stage sizes every non-boss fiend at 0.7 of the
//   scene's boss height (`BattlePresenterArt.worldHeightFor`), which would
//   stand the dog as tall as Lulu. Picked O-2 B shows him at about 0.3 of
//   Yojimbo (INSTALLED.md: 0.73 against 2.55, the visual bible's `[estimate]`).
//   A per-combatant height belongs in the stage; until it has one, the scene
//   scales his figure (painting, shadow and ring together) about his feet.

export const CAVERN_IDS = { yojimbo: 'yojimbo', daigoro: 'daigoro', ginnem: 'ginnem' } as const;

/** The duck-typed part of a staged `PaintedActor` this module reads or writes. */
export interface StagedFigure extends Object3D {
  readonly alpha?: number;
  setAlpha?(a: number): void;
  readonly pose?: string;
  readonly lifeState?: string;
}

/** Staged figures under `root` (the three.js scene the stage parents actors in), by name. */
export function findFigure(root: Object3D | null, name: string): StagedFigure | null {
  if (!root) return null;
  for (const child of root.children) {
    const f = child as StagedFigure;
    if (child.name === name && typeof f.setAlpha === 'function') return f;
  }
  return null;
}

/** True when any staged figure under `root` has struck its victory pose (the presenter's victory beat). */
export function victoryStruck(root: Object3D | null): boolean {
  if (!root) return false;
  for (const child of root.children) {
    const f = child as StagedFigure;
    if (typeof f.setAlpha !== 'function') continue;
    if (f.pose === 'victory' || f.lifeState === 'victory') return true;
  }
  return false;
}

/** Scale a staged figure about its feet (its origin), once. */
export function scaleFigure(f: StagedFigure, k: number): void {
  if (Math.abs(f.scale.x - k) > 1e-6) f.scale.setScalar(k);
}
