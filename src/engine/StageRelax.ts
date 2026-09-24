/**
 * The field's lanes and the measured relaxation that settles them against the
 * camera — `PaintedStage.relaxFormation`'s body, split out of
 * `BattlePresenterStage.ts` to keep that file from growing (house rule 7).
 *
 * No DOM. Three.js only for the projection. GAME-AWARE (AGENTS.md rule 14):
 * **both** games; the two per-scene switches (`SceneSlots.holdParty`,
 * `SceneSlots.enemySpots`) are inert wherever a scene does not set them.
 */

import { Vector3, type Camera } from 'three';
import type { CombatantId } from '../battle/common/types.ts';
import type { SceneSlots } from '../scenes/index.ts';
import {
  occludersOf,
  visibleFraction,
  visibilityOf,
  worstPanelFor,
  type DepthRect,
  type ScreenRect,
} from './ScreenRects.ts';

/**
 * How much of a combatant has to be in the clear before the field stops
 * shuffling.
 *
 * A little above the 0.75 the targeting checks assert, so a figure that only
 * just passes today does not fail tomorrow on a frame where the camera has
 * eased a few pixels further in.
 */
const CLEAR_ENOUGH = 0.8;

/**
 * How much of a **targetable enemy** has to be clear of the HUD's own panels.
 *
 * The task's requirement B(1) caps panel coverage at 25%; this is 22%, so the
 * lane settles with a little margin rather than exactly on the line. Measured
 * live before this clause existed, `yu-pagoda-right` sat 36% under the turn
 * list at 1280x720 and 40% at 2000x1000 — the gold bracket, the hand and the
 * name plate all drawn beneath the queue's tiles.
 */
const PANEL_CLEAR = 0.78;

/** How far a destructible part may stray from its machine, in world units. */
const PART_LEASH = 3.2;

/** What the relaxation needs to know about one staged figure. */
export interface RelaxActor {
  kind: 'party' | 'enemy';
  actor: { position: Vector3 };
  parentId?: CombatantId;
  /** Figure-less (`PartAnchors.ts`) or pinned (`SceneSlots.enemySpots`): never moved, never measured. */
  fixed?: boolean;
}

export interface RelaxField {
  actors: ReadonlyMap<CombatantId, RelaxActor>;
  /** The live projected rectangles (`PaintedStage.screenRects`). */
  rects: () => Map<CombatantId, DepthRect>;
  panels: readonly ScreenRect[];
  camera: Camera;
  canvasW: number;
  slots: SceneSlots;
}

type Lanes = { enemy: { x: [number, number] }; party: { x: [number, number] } };

/**
 * Push the fiends apart until their **projected** silhouettes clear.
 *
 * `applyFormation` lays the lane out in world space, and world space is
 * not what the player sees. Measured live in Chapter 3, the world-space
 * layout put Braska's Final Aeon at x 2.03, z -8 and the two Yu Pagodas at
 * x 1.27 and x 3.33 — a clean spread on the ground, and on screen the aeon's
 * rectangle ran 771..1152 while the Pagodas sat at 838..989 and 1035..1176,
 * both inside it. The aeon is four units tall and three back; the Pagodas are
 * two units tall and three forward. Perspective undoes in the frame what the
 * ground plan got right.
 *
 * So finish the job against the camera. Each pass measures the real screen
 * rectangles, finds the pairs that still overlap horizontally, and pushes
 * both along **world x** by the deficit converted back through that actor's
 * own screen-pixels-per-world-unit — which is what makes a near fiend move a
 * little and a far one move a lot, exactly as it should. It converges in a
 * handful of passes and then stops.
 *
 * A scene that sets `holdParty` (Chapters 1-3, PR-0002 A, D-041) keeps its
 * party arc exactly where its slot table puts it: no party member moves, and a
 * party member overlapping a fiend moves neither of them — that slot table is
 * solved against the fiends' settled places, and this pass runs while the
 * opening camera is still moving, so pushes taken in that frame used to walk
 * the arc under the command stack.
 *
 * Returns true only when the field is **settled**: nothing moved on this call.
 */
export function relaxField(f: RelaxField, passes: number): boolean {
  const { slots } = f;
  const lanes: Lanes = {
    // A pinned lane keeps its left edge nearly shut: that edge is the party side.
    enemy: slots.enemyLaneX
      ? { x: [slots.enemyLaneX[0] - 0.3, slots.enemyLaneX[1] + 2.2] }
      : widen(laneFrom(slots.enemy), 2.2),
    party: widen(laneFrom(slots.party), 0.9),
  };
  const isParty = (id: CombatantId): boolean => f.actors.get(id)?.kind === 'party';

  for (let pass = 0; pass < passes; pass++) {
    const rects = f.rects();
    // A figure-less part has no silhouette to clear, and neither it nor a pinned fiend may be shoved off its spot.
    for (const [rid, staged] of f.actors) if (staged.fixed) rects.delete(rid);
    if (rects.size < 2) return false;
    // Panels included: the lane has to be clear of the turn list and the
    // command stack, not only of the other fiends.
    const vis = visibilityOf(rects, f.panels);

    let moved = false;
    for (const [id, fraction] of vis) {
      if (fraction >= CLEAR_ENOUGH) continue;
      const mine = rects.get(id);
      if (!mine) continue;
      for (const otherId of occludersOf(id, rects)) {
        const theirs = rects.get(otherId);
        if (!theirs) continue;
        if (slots.holdParty && (isParty(id) || isParty(otherId))) continue;
        // How far they have to come apart horizontally to stop overlapping,
        // taken a third at a time so the pass converges instead of
        // oscillating between two figures shoving each other.
        const overlap = Math.min(mine.x + mine.w, theirs.x + theirs.w) - Math.max(mine.x, theirs.x);
        if (overlap <= 0) continue;
        const step = overlap * 0.34 + 3;
        const dir = mine.x + mine.w / 2 <= theirs.x + theirs.w / 2 ? -1 : 1;
        if (nudgeIn(f, id, (dir * step) / 2, lanes)) moved = true;
        if (nudgeIn(f, otherId, (-dir * step) / 2, lanes)) moved = true;
      }
    }

    // Second clause: the HUD's own panels.
    //
    // `occludersOf` above only knows about combatants, so a fiend standing
    // squarely under the turn list would find no combatant to move away from.
    //
    // Enemies only, deliberately. The approved frame
    // `docs/concepts/targeting/b-ring-and-dim/s1.png` draws the command list
    // across the party's legs on purpose, so the party arc is the picked look
    // and is not restaged here. Requirement B(1)'s 25% cap is about targetable
    // enemies, and that is what this enforces.
    if (f.panels.length) {
      for (const [id, mine] of rects) {
        if (f.actors.get(id)?.kind !== 'enemy') continue;
        if (visibleFraction(mine, f.panels) >= PANEL_CLEAR) continue;
        const worst = worstPanelFor(mine, f.panels);
        if (!worst) continue;
        const overlap = Math.min(mine.x + mine.w, worst.x + worst.w) - Math.max(mine.x, worst.x);
        if (overlap <= 0) continue;
        // Away from the panel, along the axis the lane actually allows.
        const dir = mine.x + mine.w / 2 <= worst.x + worst.w / 2 ? -1 : 1;
        if (nudgeIn(f, id, dir * (overlap * 0.4 + 3), lanes)) moved = true;
      }
    }

    if (!moved) return true;
  }
  // Ran out of passes with figures still moving: not settled yet.
  return false;
}

/** {@link nudge}, into whichever lane this combatant belongs to. */
function nudgeIn(f: RelaxField, id: CombatantId, dxPx: number, lanes: Lanes): boolean {
  const staged = f.actors.get(id);
  if (!staged || staged.fixed) return false;
  if (staged.kind === 'party' && f.slots.holdParty) return false;
  const lane = staged.kind === 'enemy' ? lanes.enemy : lanes.party;
  let lo = lane.x[0];
  let hi = lane.x[1];
  // A part stays on its machine. Vegnagun's leg may shuffle clear of its own
  // tail; it may not walk across the field and stand beside the party.
  const host = staged.parentId ? f.actors.get(staged.parentId) : undefined;
  if (host) {
    lo = Math.max(lo, host.actor.position.x - PART_LEASH);
    hi = Math.min(hi, host.actor.position.x + PART_LEASH);
  }
  return nudge(staged.actor.position, dxPx, lo, hi, f.camera, f.canvasW);
}

const here = new Vector3();
const there = new Vector3();

/**
 * Move one position `dxPx` screen pixels along world x, clamped to the lane.
 *
 * The conversion is measured rather than assumed: project the actor's
 * position and the same point one world unit to the right, and the distance
 * between them is this actor's own pixels-per-unit at its own depth.
 */
function nudge(p: Vector3, dxPx: number, xLo: number, xHi: number, camera: Camera, canvasW: number): boolean {
  const hx = here.copy(p).project(camera).x;
  const tx = there.set(p.x + 1, p.y, p.z).project(camera).x;
  // NDC spans 2 across the canvas, so `(there - here) / 2 * width` is pixels.
  const pxPerUnit = ((tx - hx) / 2) * canvasW;
  if (!Number.isFinite(pxPerUnit) || Math.abs(pxPerUnit) < 1) return false;
  const next = Math.max(xLo, Math.min(xHi, p.x + dxPx / pxPerUnit));
  if (Math.abs(next - p.x) < 0.01) return false;
  p.x = next;
  return true;
}

/** A lane with `pad` world units of extra room on each side. */
export function widen(lane: { x: [number, number]; z: [number, number] }, pad: number): { x: [number, number] } {
  return { x: [lane.x[0] - pad, lane.x[1] + pad] };
}

/**
 * The lane a scene's own enemy slots describe — its x and z extent, widened a
 * little so the solver may spread past the exact spots the table lists.
 *
 * Reading it off the table rather than hard-coding one keeps each location in
 * charge of where its fiends may stand: Dream's End's plain is wide and the
 * Farplane's is not, and a formation solver that ignored that would walk
 * figures into the backdrop.
 */
export function laneFrom(spots: readonly [number, number, number][]): {
  x: [number, number];
  z: [number, number];
} {
  if (!spots.length) return { x: [0.4, 5.8], z: [-1.6, -5.4] };
  const xs = spots.map((s) => s[0]);
  const zs = spots.map((s) => s[2]);
  const xLo = Math.min(...xs);
  const xHi = Math.max(...xs);
  const zLo = Math.min(...zs);
  const zHi = Math.max(...zs);
  // A one-slot table gives a degenerate lane; give it room either side rather
  // than piling every fiend on one spot.
  const padX = Math.max(1.4, (xHi - xLo) * 0.22);
  const padZ = Math.max(0.6, (zHi - zLo) * 0.12);
  return { x: [xLo - padX, xHi + padX], z: [zHi + padZ, zLo - padZ] };
}
