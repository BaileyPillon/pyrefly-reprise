/**
 * Pure math for `DamageNumbers` — multi-hit stacking and per-variant timing,
 * kept out of the DOM class so it is unit-testable
 * (`tests/unit/ui-common-damage-ladder.test.ts`).
 *
 * All values from `research/visual-bible.md` §3.6 ("Damage, healing and miss
 * numerals"); `[estimate]` there, cited verbatim in the comments below.
 */

/** One damage-number's classification, driving colour/size/behaviour. */
export type DamageKind = 'damage' | 'critical' | 'heal' | 'mp' | 'miss' | 'immune' | 'absorbed';

export interface DamageEventInput {
  /** Damage/heal amount. Negative = healing. Omit for a miss. */
  amount?: number;
  /** `BattleEvent`'s affinity result, when the action was elemental. */
  affinity?: 'immune' | 'absorb' | string;
  /** True when this numeral is against an MP pool rather than HP. */
  isMp?: boolean;
  critical?: boolean;
  /** `BattleEvent`'s own spelling of `critical`. Either one promotes the numeral. */
  crit?: boolean;
  /** Whether the hit connected at all; false renders MISS regardless of `amount`. */
  hit?: boolean;
}

/** Classify a damage/heal/miss event into a numeral variant. */
export function classifyDamageEvent(input: DamageEventInput): DamageKind {
  if (input.hit === false) return 'miss';
  if (input.affinity === 'immune') return 'immune';
  if (input.affinity === 'absorb') return 'absorbed';
  if (input.amount === undefined) return 'miss';
  if (input.isMp) return 'mp';
  if (input.amount < 0) return 'heal';
  return input.critical || input.crit ? 'critical' : 'damage';
}

export interface HitOffset {
  /** Horizontal offset in logical px, relative to the base spawn point. */
  dx: number;
  /** Vertical offset in logical px (negative = further up the ladder). */
  dy: number;
  /** How long after the first hit this one should spawn, in ms. */
  delayMs: number;
}

/**
 * Multi-hit ladder offset for hit `hitIndex` of `hitCount` (both 0-based/absolute
 * counts as carried on `BattleEvent`). "spawn each numeral 0.08s apart and
 * offset each by `(+4, -3) * i`... a rising diagonal ladder" [§3.6].
 */
export function computeHitOffset(hitIndex: number): HitOffset {
  const i = Math.max(0, Math.floor(hitIndex));
  // `0 - 3*i` rather than `-3*i` so hit 0 reports +0, not -0.
  return { dx: 4 * i, dy: 0 - 3 * i, delayMs: 80 * i };
}

/**
 * Vertical pitch, in logical px, between two numerals stacked on the *same*
 * target — one glyph height plus a little air.
 *
 * §3.6's `(+4, -3) * i` diagonal alone is a sub-glyph step: two figures that
 * land together print through each other (`docs/screenshots/polish/47-boss-attack.png`
 * shows a MISS struck across an `11500` on Yuna, and `48-overdrive.png` two
 * figures sharing Tidus). The ladder therefore steps by this pitch vertically
 * and keeps §3.6's diagonal as the horizontal drift, which is also what the
 * game's own multi-hit ladders read like.
 */
export function ladderPitch(kind: DamageKind): number {
  // Just under a glyph height: with `computeHitOffset`'s own `-3` per rung this
  // comes to a hair over one line, which separates the figures without walking
  // a five-hit ladder off the top of the screen above a tall enemy.
  return fontSizeFor(kind) * 0.85;
}

/** `+/-6px` random x jitter so simultaneous hits on different targets don't overlap [§3.6]. */
export function jitterX(rng: () => number = Math.random): number {
  return (rng() * 2 - 1) * 6;
}

/** Total lifetime in ms for a numeral of the given kind [§3.6]. */
export function lifetimeMsFor(kind: DamageKind): number {
  switch (kind) {
    case 'heal':
      return 1000;
    case 'miss':
      return 500;
    case 'immune':
      return 700;
    case 'absorbed':
      return 900;
    default:
      return 900;
  }
}

/** Base font size in logical px for the numeral [§3.6]. */
export function fontSizeFor(kind: DamageKind): number {
  switch (kind) {
    case 'critical':
      return 24;
    case 'miss':
      return 14;
    case 'immune':
      return 12;
    case 'mp':
      return 14;
    default:
      return 16;
  }
}

/** The literal text drawn for a numeral, given the classified kind and amount. */
export function textFor(kind: DamageKind, amount?: number): string {
  switch (kind) {
    case 'miss':
      return 'MISS';
    case 'immune':
      return 'IMMUNE';
    case 'absorbed':
      return 'ABSORBED';
    default: {
      const n = Math.abs(Math.round(amount ?? 0));
      const sign = kind === 'heal' ? '+' : '';
      return `${sign}${n}`;
    }
  }
}

/**
 * Ballistic bounce position at time `tMs` since spawn, per §3.6: initial
 * velocity `(rand(-18,18), -140) px/s`, gravity `+520 px/s^2`, one bounce at
 * 45% restitution off a floor 18px below the spawn point. Healing numerals
 * float straight up with no bounce.
 *
 * Returns an offset in logical px from the spawn point; +y is downward, to
 * match DOM `top` conventions.
 */
export function bouncePosition(
  tMs: number,
  kind: DamageKind,
  vx: number,
): { x: number; y: number } {
  const t = Math.max(0, tMs) / 1000;
  if (kind === 'heal') {
    // Straight up, easing out — no gravity, no bounce.
    const life = lifetimeMsFor(kind) / 1000;
    const p = Math.min(1, t / life);
    // `0 - x` rather than `-x` so a p=0 spawn reports +0, not -0 (Object.is
    // matters to some test assertions and this keeps the sign predictable).
    return { x: 0, y: 0 - 24 * easeOutCubic(p) };
  }
  if (kind === 'miss') {
    const life = lifetimeMsFor(kind) / 1000;
    const p = Math.min(1, t / life);
    return { x: 14 * p, y: 0 };
  }

  const g = 520;
  const vy0 = -140;
  const floor = 18;
  // Position under constant gravity from a launch at the origin.
  let y = vy0 * t + 0.5 * g * t * t;
  if (y > floor) {
    // One bounce at 45% restitution: reflect the impact velocity and replay
    // the remaining time from the floor.
    const impactT = solveImpactTime(vy0, g, floor);
    const remaining = t - impactT;
    const vyImpact = vy0 + g * impactT;
    const vyBounce = -vyImpact * 0.45;
    y = floor + vyBounce * remaining + 0.5 * g * remaining * remaining;
    y = Math.min(y, floor + 40); // never sink further than a small settle
  }
  return { x: vx * t, y };
}

function solveImpactTime(vy0: number, g: number, floor: number): number {
  // Solve vy0*t + 0.5*g*t^2 = floor for the positive root.
  const a = 0.5 * g;
  const b = vy0;
  const c = -floor;
  const disc = Math.max(0, b * b - 4 * a * c);
  return (-b + Math.sqrt(disc)) / (2 * a);
}

function easeOutCubic(t: number): number {
  const p = Math.min(1, Math.max(0, t));
  return 1 - (1 - p) ** 3;
}

/** Opacity curve: full until the final 0.25s (or 0.5 for a miss), then fades to 0. */
export function opacityAt(tMs: number, kind: DamageKind): number {
  const life = lifetimeMsFor(kind);
  const fadeMs = kind === 'miss' ? 500 : 250;
  const remaining = life - tMs;
  if (remaining >= fadeMs) return 1;
  return Math.max(0, remaining / fadeMs);
}

/** Scale-pop curve: spawns oversized and eases to 1x over 0.12s [§3.6]. */
export function scaleAt(tMs: number, kind: DamageKind): number {
  const pop = kind === 'critical' ? 1.7 : 1.35;
  const durationMs = 120;
  if (tMs >= durationMs) return 1;
  const p = Math.max(0, tMs) / durationMs;
  return pop + (1 - pop) * easeOutCubic(p);
}

// ---------------------------------------------------------------- HUD dodging

/** A screen-space box, in the same pixel space as the numeral layer. */
export interface NumeralRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface Push {
  dx: number;
  dy: number;
  cost: number;
}

function overlaps(
  cx: number,
  cy: number,
  half: { w: number; h: number },
  r: NumeralRect,
  margin: number,
): boolean {
  return !(
    cx + half.w <= r.left - margin ||
    cx - half.w >= r.right + margin ||
    cy + half.h <= r.top - margin ||
    cy - half.h >= r.bottom + margin
  );
}

function fits(cx: number, cy: number, half: { w: number; h: number }, b: NumeralRect | null): boolean {
  if (!b) return true;
  return cx - half.w >= b.left && cx + half.w <= b.right && cy - half.h >= b.top && cy + half.h <= b.bottom;
}

/**
 * Slide a numeral out of any opaque HUD panel it would otherwise be swallowed
 * by — the FFX command menu, the CTB column, the party-status list.
 *
 * The projected chest point of a party member standing behind the command
 * stack lands *inside* that stack, which is what made a hit on Yuna print
 * "789" across the ATTACK row (`docs/screenshots/46-attack.png`). Rather than
 * clamping to an arbitrary corner, this picks the cheapest single-axis push
 * that clears the panel and still fits in `bounds`, so the numeral stays as
 * close to its target as it can while remaining readable.
 *
 * Costs are weighted, not raw distances: up is slightly preferred (numerals
 * rise anyway) and down is heavily penalised (down is where the party-status
 * slabs live). `margin` keeps a little air between the glyph and the panel
 * edge. Runs a few passes so a push out of one panel that lands in another
 * resolves; if nothing fits the bounds, the cheapest push wins anyway and the
 * result is clamped.
 */
export function deflectFromRects(
  point: { x: number; y: number },
  half: { w: number; h: number },
  rects: readonly NumeralRect[],
  bounds: NumeralRect | null = null,
  margin = 6,
): { x: number; y: number } {
  let x = point.x;
  let y = point.y;
  if (rects.length === 0) return clampToBounds(x, y, half, bounds);

  for (let pass = 0; pass < 3; pass++) {
    let moved = false;
    for (const r of rects) {
      if (!overlaps(x, y, half, r, margin)) continue;
      const candidates: Push[] = [
        { dx: r.left - margin - (x + half.w), dy: 0, cost: 0 },
        { dx: r.right + margin - (x - half.w), dy: 0, cost: 0 },
        { dx: 0, dy: r.top - margin - (y + half.h), cost: 0 },
        { dx: 0, dy: r.bottom + margin - (y - half.h), cost: 0 },
      ];
      candidates[0]!.cost = Math.abs(candidates[0]!.dx);
      candidates[1]!.cost = Math.abs(candidates[1]!.dx);
      candidates[2]!.cost = Math.abs(candidates[2]!.dy) * 0.9;
      candidates[3]!.cost = Math.abs(candidates[3]!.dy) * 2.2;

      const inside = candidates.filter((c) => fits(x + c.dx, y + c.dy, half, bounds));
      const pool = inside.length > 0 ? inside : candidates;
      const best = pool.reduce((a, b) => (b.cost < a.cost ? b : a));
      x += best.dx;
      y += best.dy;
      moved = true;
    }
    if (!moved) break;
  }

  // Panels packed closer together than the numeral is wide have no gap to sit
  // in, so the per-rect pushes above can shuttle it from one into the next.
  // When that happens, clear the whole cluster at once: above it by
  // preference, below it otherwise.
  const stuck = rects.filter((r) => overlaps(x, y, half, r, margin));
  if (stuck.length > 0) {
    const top = Math.min(...stuck.map((r) => r.top));
    const bottom = Math.max(...stuck.map((r) => r.bottom));
    const above = top - margin - half.h;
    const below = bottom + margin + half.h;
    y = fits(x, above, half, bounds) || !fits(x, below, half, bounds) ? above : below;
  }

  return clampToBounds(x, y, half, bounds);
}

function clampToBounds(
  x: number,
  y: number,
  half: { w: number; h: number },
  b: NumeralRect | null,
): { x: number; y: number } {
  if (!b) return { x, y };
  const minX = b.left + half.w;
  const maxX = b.right - half.w;
  const minY = b.top + half.h;
  const maxY = b.bottom - half.h;
  return {
    x: maxX >= minX ? Math.min(maxX, Math.max(minX, x)) : (b.left + b.right) / 2,
    y: maxY >= minY ? Math.min(maxY, Math.max(minY, y)) : (b.top + b.bottom) / 2,
  };
}
