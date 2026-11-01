/**
 * Where a downed figure's body goes, so it never lies across a neighbour.
 *
 * A KO painting is a wide, low plane; centred on its owner's station it spills
 * half its length either way, and in Chapter 6 that put Leblanc's head behind
 * Logos (LEBLANC-KO-PLANE, from the art agent's in-battle check). The fix is
 * the one a stage director makes: the body lies from where she stood toward
 * the open floor. Once, when a figure goes down, this tries shifting the prone
 * plane along the floor by up to half its own length (so the station stays
 * under the body) and keeps the shift that overlaps the fewest standing
 * neighbours on screen, judged from the battle's resting framing (the `idle`
 * rig, where the field is seen between beats; the live camera when a scene has
 * no such rig) rather than from whatever close-up the KO beat happened to cut
 * to. Sliding out of frame costs the same as covering someone. The smallest
 * shift wins a tie, so a figure with room to lie stays centred.
 *
 * General, not a Leblanc special case: any prone painting, any side, both
 * games (AGENTS.md rule 14: the actor layer is shared by FFX chapters 1-3 and
 * FFX-2 chapters 4-6).
 *
 * **The slide eases in (r72-motion, both games; shared plumbing).** The shift is CHOSEN on the frame the figure goes down, but the body does not
 * start there: it slides from the station to the chosen place over {@link SLIDE_EASE_MS} (smootherstep, on the stage's real clock). The live gap pass
 * of release 70 found Isaaru's Ixion lying 355 px (0.9 of half its length) from its station at the cross from the toppled painting to the lying one,
 * a swap jerk of 89 to 91 px against CHK-027's allowance of 80 at 1600 wide, and the jerk is a quarter of the slide (250 px read 64, 340 read 86):
 * the fall is a pose change and a slide at once. The place the body comes to rest, and so every choice that depends on it (the neighbours it must
 * not cover, the HUD rows it must not hide, the frame it must not leave), is unchanged; only the path to it is. The old behaviour (the whole slide
 * on the first frame) is what a caller with no clock gets: `layProneFigures` without `dt`.
 */

import { PerspectiveCamera, Vector3 } from 'three';
import type { BattleCamera } from './BattleCamera.ts';
import type { PaintedActor } from './PaintedActor.ts';

/** The clock the stage hands {@link layProneFigures}: the real frame time where the slide eases in, undefined (release 71's whole slide at once) under REDUCE MOTION, in an untreated chapter or with an off word. */
export { slideEaseDt } from './motion/SlideEase.ts';

/** Candidate shifts, as fractions of half the body's length. */
const STEPS = [0, 0.25, -0.25, 0.5, -0.5, 0.75, -0.75, 1, -1];

/** World distance between stations inside which another figure counts as a neighbour. */
const NEIGHBOUR_RANGE = 4.5;

/** The rig that frames the whole field between beats. */
const RESTING_RIG = 'idle';

/**
 * r72-motion: how long a body takes to slide from its station to the place `layProne` chose, ms. The cross from the toppled painting to the lying one begins about 230 ms after the figure goes down and the
 * hold on the lying painting is long, so the slide is mostly seen after the fall: 700 ms puts about a quarter of it behind the cross and leaves the rest as a slow slide along the floor (the fastest frame is
 * 1.875 times the average: 355 px over 700 ms is 16 px at 60 Hz at its fastest). 0 gives the old behaviour back.
 */
export const SLIDE_EASE_MS = 700;

const smootherstep = (u: number): number => {
  const x = u < 0 ? 0 : u > 1 ? 1 : u;
  return x * x * x * (x * (x * 6 - 15) + 10);
};

interface Slide {
  /** The shift the stage chose, world units: where the body comes to rest. */
  to: number;
  /** Ms since the figure went down. */
  ms: number;
}

/** Bodies still sliding to the place chosen for them. */
const sliding = new WeakMap<PaintedActor, Slide>();

/** Where the body is on its way: nothing on the frame it goes down, exactly the chosen shift once {@link SLIDE_EASE_MS} has passed. */
const slideAt = (s: Slide): number => (s.ms <= 0 ? 0 : s.ms >= SLIDE_EASE_MS ? s.to : s.to * smootherstep(s.ms / SLIDE_EASE_MS));

/** Put every sliding body where its clock says (with `snap`, at the place chosen for it: a caller that gave no clock) and retire the ones that have arrived. */
function placeSliding(actors: readonly PaintedActor[], snap: boolean): void {
  for (const a of actors) {
    const s = sliding.get(a);
    if (!s) continue;
    a.setProneShift(snap ? s.to : slideAt(s));
    if (snap || s.ms >= SLIDE_EASE_MS) sliding.delete(a);
  }
}

/** While a figure's place is chosen, every body still sliding stands at ITS chosen place, as the old call had it, so the new body is laid against where its neighbours will lie (review M2). */
function parkSliding(actors: readonly PaintedActor[]): void {
  for (const a of actors) {
    const s = sliding.get(a);
    if (s) a.setProneShift(s.to);
  }
}

export interface NdcBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const scratch: [Vector3, Vector3, Vector3, Vector3] = [
  new Vector3(),
  new Vector3(),
  new Vector3(),
  new Vector3(),
];

function ndcBox(actor: PaintedActor, cam: PerspectiveCamera): NdcBox {
  const q = actor.contentQuad(scratch);
  const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const c of q) {
    c.project(cam);
    box.x0 = Math.min(box.x0, c.x);
    box.x1 = Math.max(box.x1, c.x);
    box.y0 = Math.min(box.y0, c.y);
    box.y1 = Math.max(box.y1, c.y);
  }
  return box;
}

/** The visible frame, in NDC. */
const FRAME: NdcBox = { x0: -1, y0: -1, x1: 1, y1: 1 };

/**
 * Screen areas a body should not lie behind (the HUD's status rows, in NDC of the frame the shot is judged in), read
 * when a figure goes down. Set by the MAX mix (round 19, PR-0318: Chapter I's Yuna fell behind the Tidus row, nothing
 * of her showing); null with no mix. Counts like a standing neighbour: an area covered is an area lost.
 */
let avoid: (() => readonly NdcBox[]) | null = null;

/** Register (or clear, with null) the provider of screen areas a downed body should lie clear of. */
export function setProneAvoid(fn: (() => readonly NdcBox[]) | null): void {
  avoid = fn;
}

function overlap(a: NdcBox, b: NdcBox): number {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return w > 0 && h > 0 ? w * h : 0;
}

/** A clone of the live camera parked at the resting rig, or the live camera itself. */
export function layCameras(live: PerspectiveCamera, rigs?: BattleCamera): PerspectiveCamera[] {
  const rig = rigs?.getRig(RESTING_RIG);
  if (!rig) return [live];
  const cam = live.clone();
  cam.position.copy(rig.position as Vector3);
  cam.lookAt(rig.lookAt as Vector3);
  if (rig.fov !== undefined) cam.fov = rig.fov;
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
  return [cam];
}

/**
 * Choose and apply the prone shift for `target`. Returns the shift (world
 * units) and the overlap it leaves, summed over cameras (NDC area; 0 = clear).
 */
export function layProne(
  target: PaintedActor,
  neighbours: readonly PaintedActor[],
  cams: readonly PerspectiveCamera[],
): { shift: number; overlap: number } {
  target.setProneShift(0);
  const [w] = target.poseSize;
  const half = (w ?? 0) / 2;
  // Only figures sharing her patch of floor: a boss across the field that the
  // body happens to cover on screen is depth, not a collision.
  const standing = neighbours.filter(
    (n) =>
      n !== target &&
      n.visible &&
      n.alpha > 0.05 &&
      n.position.distanceTo(target.position) < NEIGHBOUR_RANGE,
  );
  const panels = avoid?.() ?? [];
  const boxes = cams.map((cam) => [...standing.map((n) => ndcBox(n, cam)), ...panels]);
  let best = { shift: 0, overlap: Infinity };
  for (const step of STEPS) {
    const shift = step * half * 0.9;
    target.setProneShift(shift);
    let sum = 0;
    cams.forEach((cam, i) => {
      const mine = ndcBox(target, cam);
      for (const b of boxes[i]!) sum += overlap(mine, b);
      // Whatever part of the body the frame would cut off.
      const area = (mine.x1 - mine.x0) * (mine.y1 - mine.y0);
      sum += Math.max(0, area - overlap(mine, FRAME));
    });
    // Strictly better only, so the smallest shift (the order of STEPS) wins ties.
    if (sum < best.overlap - 1e-9) best = { shift, overlap: sum };
    if (best.overlap === 0) break;
  }
  target.setProneShift(best.shift);
  return best;
}

/** Per-actor memo: laid once when the figure goes down, cleared when it rises. */
const laid = new WeakMap<PaintedActor, boolean>();

/**
 * Figures that have stood up but whose slide is being held: a revive makes the standing plane the active one at once (`isProne` is false from that frame), while the lying plane is still on
 * screen fading out. Clearing the slide that frame moved the lying body by the whole slide (0.74 units, 80 to 108 px at 1600 wide) under the figure getting up; it is let go once the lying
 * plane has faded. Both games (the actor layer is shared).
 */
const held = new WeakSet<PaintedActor>();

/**
 * Called every frame by the stage. Cheap: it only does work on the frame a
 * figure's shown pose turns prone (or stops being prone).
 *
 * `pinned` figures (a scene's `enemySpots`) are never slid: their spot is the
 * composition, measured where the painting is drawn. A wide standing painting
 * (Vegnagun's body, Chapter 5) counts as prone by its shape, and a slide picked
 * from whichever neighbours stand near it would move it off that spot.
 *
 * `dt` (seconds of the stage's real clock; r72-motion): with it a body eases to the place it was laid over {@link SLIDE_EASE_MS}; without it
 * (a caller with no clock, the tests of the old behaviour, and the stage under REDUCE MOTION, in an untreated chapter or with an off word: `motion/SlideEase.ts`) the whole slide lands on the frame the
 * figure goes down, as before, and a body that was part-way when the clock was withdrawn is put at its place at once.
 *
 * **The choices are the old call's** (review M2, r72): a figure's place is chosen against the places its neighbours will LIE at, not where they stand now. Every figure that goes down on a frame is laid first and
 * stays at its chosen place until all of them are (so three bodies down on one frame see each other), and every body still sliding from an earlier frame is parked at its chosen place while the choice is made;
 * only then does each go back to where its clock has it (the station, for the figures just laid).
 */
export function layProneFigures(
  actors: readonly PaintedActor[],
  live: PerspectiveCamera,
  rigs?: BattleCamera,
  pinned?: ReadonlySet<PaintedActor>,
  dt?: number,
): void {
  let parked = false;
  for (const a of actors) {
    if (pinned?.has(a)) continue;
    const prone = a.isProne;
    if (prone === (laid.get(a) ?? false)) {
      if (held.has(a) && !a.proneLingers) { // the lying plane has faded out: the slide goes with it, unseen
        held.delete(a);
        sliding.delete(a);
        a.setProneShift(0);
      } else if (prone && dt !== undefined) { // still easing to the place it was laid: the clock moves here, the body is placed once every choice of the frame is made (below)
        const s = sliding.get(a);
        if (s) s.ms += Math.max(0, dt) * 1000;
      }
      continue;
    }
    laid.set(a, prone);
    if (!prone) {
      const s = sliding.get(a);
      if (s) { a.setProneShift(slideAt(s)); sliding.delete(a); } // a revive stops the slide where it is (not where a neighbour's choice parked it this frame): the held body keeps lying there while it fades (see `held`)
      if (a.proneLingers) held.add(a); // a revive: the body keeps lying where it lay while it fades (see `held`)
      else a.setProneShift(0);
      continue;
    }
    held.delete(a);
    if (!parked) { parkSliding(actors); parked = true; } // a no-op unless a body is still sliding
    const lay = layProne(a, actors, layCameras(live, rigs));
    if (dt !== undefined && SLIDE_EASE_MS > 0 && lay.shift !== 0) sliding.set(a, { to: lay.shift, ms: 0 }); // r72-motion: the choice is made now (and stays put until every choice of the frame is made), the body gets there over the fall
    else sliding.delete(a);
  }
  placeSliding(actors, dt === undefined);
}
