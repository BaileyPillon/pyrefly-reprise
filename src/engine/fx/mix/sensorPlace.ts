import { boxesOf, type Field } from './clearance.ts';
import { cameraAt, coverShare, type Box, type Fig, type Mask, type Pose } from './geometry.ts';

/**
 * OPT-RESTAGE PROTOTYPE, option N (FFX only, Ch X Natus; PR-0331; behind `?stage=N`, never merged into main).
 * Round 19b: the fail-closed gates took the D-316 colossus master away from Natus because FFX's Sensor card, pinned in
 * the lane the enemies stand in, covered 34.5 % of him. The card is only a read-out that opens on a reveal, so instead of
 * holding the master it is steered to the nearest place off every boss part, the party and the HUD's panels: the same idea
 * as `ui/ffx/sensorSteer.ts` (which steers the card off the one fiend the cursor is on), as a sibling module because
 * `FFXBattleHud.ts` may not grow. `framing.ts` asks `placeSensor` per candidate pose (a pose with no place for the card
 * is held, as before) and `SensorSteer` writes the CSS `translate` of `.ffx-sensor` to the chosen place.
 *
 * Pure geometry here (field px); the DOM writer is the class at the bottom. Presentation only (rule 1).
 */

/** The painted share of an enemy (its silhouette cells) a card at `c` would cover; with no mask, the box share. */
function coverOfPainted(e: Box, mask: Mask | undefined, c: Box): number {
  if (!mask) return coverShare(e, c);
  let solid = 0;
  let under = 0;
  for (let i = 0; i < 10; i++)
    for (let j = 0; j < 14; j++) {
      const fx = (i + 0.5) / 10;
      const fy = (j + 0.5) / 14;
      if (mask.at(fx, fy) < 0.35) continue;
      solid++;
      const x = e.l + fx * (e.r - e.l);
      const y = e.t + fy * (e.b - e.t);
      if (x >= c.l && x <= c.r && y >= c.t && y <= c.b) under++;
    }
  return solid ? under / solid : 0;
}

const hits = (a: Box, b: Box): boolean => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

/** The most of a boss part's painted pixels, or of a party member's box, the steered card may cover. */
export const STEER_COVER_MAX = 0.02;

/**
 * The card's place: the spot nearest `home` (same size) that is inside the field with a margin, clear of every panel,
 * covers at most 2 % of any boss part's painted pixels or any member's box. Null when there is none.
 */
export function placeSensor(boxes: readonly Box[], figs: readonly Fig[], panels: readonly Box[], W: number, H: number, home: Box): Box | null {
  const w = home.r - home.l;
  const h = home.b - home.t;
  const m = 0.012 * W;
  const free = (c: Box): boolean => !panels.some((p) => hits(p, c)) && figs.every((f, k) => (f.enemy ? coverOfPainted(boxes[k]!, f.mask, c) : coverShare(boxes[k]!, c)) <= STEER_COVER_MAX);
  if (free(home)) return home; // nothing under the pinned place: the card stays where the stylesheet put it
  let best: Box | null = null;
  let bestD = Infinity;
  const nx = 36;
  const ny = 24;
  for (let i = 0; i <= nx; i++)
    for (let j = 0; j <= ny; j++) {
      const l = m + (i / nx) * (W - w - 2 * m);
      const t = m + (j / ny) * (H - h - 2 * m);
      const c: Box = { l, r: l + w, t, b: t + h };
      const d = Math.hypot(l - home.l, t - home.t);
      if (d >= bestD) continue;
      if (panels.some((p) => hits(p, c))) continue;
      let over = false;
      for (let k = 0; k < figs.length && !over; k++) {
        const f = figs[k]!;
        over = (f.enemy ? coverOfPainted(boxes[k]!, f.mask, c) : coverShare(boxes[k]!, c)) > STEER_COVER_MAX;
      }
      if (over) continue;
      best = c;
      bestD = d;
    }
  return best;
}

/**
 * The card's place for a chosen pose, in viewport px (what `SensorSteer` writes): the boxes the pose and its lens shift give,
 * the field's panels, the pinned place `home` (field px) as the starting point; null when there is none.
 */
export function sensorTarget(pose: Pose, lens: readonly [number, number], figs: readonly Fig[], field: Field, home: Box, canvas: { left: number; top: number }): Box | null {
  const boxes = boxesOf(cameraAt(pose, field.W / field.H), figs, field).map((b) => ({ l: b.l + lens[0], r: b.r + lens[0], t: b.t + lens[1], b: b.b + lens[1] }));
  const c = placeSensor(boxes, figs, field.panels, field.W, field.H, home);
  return c && { l: c.l + canvas.left, r: c.r + canvas.left, t: c.t + canvas.top, b: c.b + canvas.top };
}

/**
 * Writes the card's steer: the CSS `translate` that moves `.ffx-sensor` from where the HUD lays it out to `target` (viewport
 * px), on the 640x360 stage's scale. The HUD's own steer (`--ffx-sensor-dx`) is left alone: the offset is measured from the
 * card as it stands now minus this class's last write, so the two add.
 */
export class SensorSteer {
  private tx = 0;
  private ty = 0;
  /** What the last write did (checks only). */
  last: { box: number[]; to: number[] } | null = null;

  update(target: Box | null): void {
    if (typeof document === 'undefined') return;
    const el = document.querySelector<HTMLElement>('.ffx-sensor');
    if (!el) return;
    if (!target) return this.clear(el);
    const r = el.getBoundingClientRect();
    if (r.width < 2) return;
    const s = Math.min(window.innerWidth / 640, window.innerHeight / 360);
    const dx = target.l - (r.left - this.tx);
    const dy = target.t - (r.top - this.ty);
    this.tx = dx;
    this.ty = dy;
    el.style.setProperty('translate', `${(dx / s).toFixed(1)}px ${(dy / s).toFixed(1)}px`);
    this.last = { box: [r.left, r.top, r.width, r.height].map(Math.round), to: [Math.round(target.l), Math.round(target.t)] };
  }

  private clear(el: HTMLElement): void {
    if (this.tx || this.ty) el.style.removeProperty('translate');
    this.tx = 0;
    this.ty = 0;
  }

  dispose(): void {
    if (typeof document === 'undefined') return;
    const el = document.querySelector<HTMLElement>('.ffx-sensor');
    if (el) this.clear(el);
  }
}
