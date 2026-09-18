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

// ------------------------------------------------- per-target burst layout
//
// Round 2, issue 2 of `docs/handoff/playability-round-1.md`: a multi-hit
// action piled ~8 numerals on one screen point (`53-ffx2-vegnagun.png`) and
// Yunalesca's AoE buried `2200` under `1850` (`50-yunalesca.png`). Three
// separate mechanisms fix that, and all three live here as pure math:
//
//   1. a **queue with a short stagger** per target, so hits that resolve in
//      one engine tick still appear in quick succession the way FFX shows a
//      multi-hit ({@link nextBurstSlot});
//   2. a **rising ladder that fans horizontally** once it has climbed its few
//      rungs, so hit 5 sits beside hit 1 rather than on top of it
//      ({@link burstSlot});
//   3. **per-target lanes**, so two actors whose chests project to nearly the
//      same x do not interleave their columns ({@link resolveLanes}).

/**
 * Rungs the ladder climbs on one target before the next hit starts a new fan
 * column. Three rungs is ~83 logical px of rise above the chest — as far up as
 * a numeral can go and still read as belonging to the actor under it.
 */
export const LADDER_RUNGS = 3;

/**
 * Horizontal step, in logical px, between two fan columns on the same target.
 * A 5-figure numeral at the 16px base size is ~44px wide, so 46 guarantees two
 * neighbouring columns cannot print through each other.
 */
export const FAN_STEP = 46;

/** Fan columns before the layout wraps back onto column 0 (20 numerals/target). */
export const FAN_COLUMNS = 5;

/** Minimum gap, in ms, between two numerals released on the same target. */
export const HIT_STAGGER_MS = 80;

/**
 * Quiet time on a target, in ms, after which its burst is over: the ladder
 * restarts at the chest and the fan is re-shaped for wherever the actor now
 * stands. Long enough to cover a slow multi-hit's own gaps, short enough that
 * the next action does not start three rungs up in dead air.
 */
export const BURST_GAP_MS = 800;

/**
 * Extra rung pitch, in logical px, that pays for the stagger.
 *
 * A numeral released {@link HIT_STAGGER_MS} later is that much earlier in its
 * own ballistic arc, and §3.6's arc rises about 10px in 80ms — so without this
 * the rung a hit climbs is very nearly cancelled out by the rise its
 * predecessor has already made, and two consecutive hits sit within a few
 * pixels of each other for the first third of a second. Which is the pile-up.
 */
const STAGGER_RISE = 11;

/**
 * A fan column's horizontal offset in logical px: column 0 sits on the target,
 * then the columns alternate right/left so the group stays centred on the
 * actor instead of marching off in one direction.
 */
export function fanOffset(column: number): number {
  const c = Math.max(0, Math.floor(column)) % FAN_COLUMNS;
  if (c === 0) return 0;
  const step = Math.ceil(c / 2);
  return (c % 2 === 1 ? 1 : -1) * step * FAN_STEP;
}

/** Room a target's fan has on each side of its anchor, in logical px. */
export interface FanRoom {
  left: number;
  right: number;
}

/** The symmetric fan, used whenever the room either side is not known or is ample. */
const FAN_SYMMETRIC: readonly number[] = Array.from({ length: FAN_COLUMNS }, (_, c) => fanOffset(c));

/**
 * The fan columns a target may actually open, ordered, given the room it has.
 *
 * {@link fanOffset} opens symmetrically and lets `placeInSafeArea` reflect
 * whatever leaves the rect. That is right for a target in open field and wrong
 * for one near a margin: reflection is one-to-one, but it folds column +2 back
 * to within a few px of column -1, so an actor 200px from the left edge ends up
 * with its outer columns bunched instead of fanned (the stress frame in
 * `r2-53-ffx2-chain-chip.png`). §5 of `docs/handoff/r2-damage-numbers-fan.md`.
 *
 * So the fan is made **asymmetric** before the fact: it opens only into the
 * room that exists, still alternating while both sides have room so the group
 * stays centred on the actor, and marching into the open side once the near
 * one is full. The result is always a set of distinct offsets `FAN_STEP` apart
 * that all fit — which is what the reflection could not promise.
 *
 * A target with room for nothing but column 0 gets `[0]`; its ladder then
 * separates its numerals vertically and its stagger separates them in time,
 * which is the honest degradation and not a pile-up.
 */
export function fanSequence(room?: FanRoom | null): readonly number[] {
  if (!room) return FAN_SYMMETRIC;
  const slotsRight = Math.max(0, Math.floor(room.right / FAN_STEP));
  const slotsLeft = Math.max(0, Math.floor(room.left / FAN_STEP));
  if (slotsRight >= FAN_COLUMNS && slotsLeft >= FAN_COLUMNS) return FAN_SYMMETRIC;
  const out: number[] = [0];
  let right = 0;
  let left = 0;
  // Start right, matching `fanOffset`, so an unconstrained fan is unchanged.
  let preferRight = true;
  while (out.length < FAN_COLUMNS) {
    const canRight = right < slotsRight;
    const canLeft = left < slotsLeft;
    if (!canRight && !canLeft) break;
    if (canRight && (preferRight || !canLeft)) out.push(++right * FAN_STEP);
    else out.push(0 - ++left * FAN_STEP);
    preferRight = !preferRight;
  }
  return out;
}

/**
 * Which of a target's two fan tracks a numeral rides.
 *
 * A burst is normally one family of numeral and uses `'main'` alone. When a
 * *second* family lands on the same target inside one burst — a heal on an
 * actor who is being hit — it takes `'alt'`, which reads the same fan from the
 * far end, so the two families occupy disjoint columns. See {@link burstSlot}.
 */
export type BurstTrack = 'main' | 'alt';

/** The two numeral families that must not share a fan column. See {@link BurstTrack}. */
export type NumeralFamily = 'damage' | 'heal';

/**
 * Which family a numeral kind belongs to.
 *
 * Only healing is split out, and for a concrete reason: every other kind flies
 * the *same* ballistic arc, so the ladder alone keeps them apart, while a heal
 * floats straight up. Two different motions through one column cross — over
 * ~600ms a damage figure two rungs up meets a heal figure one rung up, which is
 * the last overlap left in §5 of `docs/handoff/r2-damage-numbers-fan.md`.
 */
export function familyFor(kind: DamageKind): NumeralFamily {
  return kind === 'heal' ? 'heal' : 'damage';
}

/** Where numeral `index` of a target's current burst sits, and how late it is released. */
export interface BurstSlot {
  /** Horizontal offset from the target's anchor, logical px. */
  dx: number;
  /** Vertical offset from the target's anchor, logical px (negative = up). */
  dy: number;
  /** Rung on the ladder, 0..{@link LADDER_RUNGS}-1. */
  rung: number;
  /** Fan column, 0..{@link FAN_COLUMNS}-1. */
  column: number;
}

/** How a target's fan is shaped for {@link burstSlot}. */
export interface BurstSlotOptions {
  /**
   * The columns this target may open, from {@link fanSequence}. Defaults to the
   * symmetric five, which is what a target in open field gets.
   */
  fan?: readonly number[];
  /** Which fan track this numeral rides. Default `'main'`. See {@link BurstTrack}. */
  track?: BurstTrack;
}

/**
 * Ladder-plus-fan position for the `index`-th numeral riding one target.
 *
 * Hits climb the ladder first (`rung = index % LADDER_RUNGS`), which is the
 * FFX read — a multi-hit is a column of figures rising off the target. Once
 * the ladder is full the next hit opens a **new column** beside it rather than
 * wrapping onto a rung that is still on screen, which is precisely the failure
 * in `53-ffx2-vegnagun.png`.
 *
 * §3.6's `(+4, -3) * i` diagonal survives as the intra-column drift.
 */
export function burstSlot(index: number, kind: DamageKind = 'damage', opts: BurstSlotOptions = {}): BurstSlot {
  // `kind` no longer changes the geometry — see the `dy` comment below — but it
  // stays in the signature on purpose. Callers pass the numeral's kind, and the
  // guarantee they are relying on is precisely that it makes no difference:
  // every rung of a target's ladder is at one height, so a MISS and a crit that
  // the queue gave different slots cannot land on each other.
  void kind;
  const i = Math.max(0, Math.floor(index));
  const fan = opts.fan && opts.fan.length > 0 ? opts.fan : FAN_SYMMETRIC;
  const rung = i % LADDER_RUNGS;
  const step = Math.floor(i / LADDER_RUNGS) % fan.length;
  // The alt track reads the same fan from the far end, so the family that
  // arrived second on this target cannot land in a column the first is using
  // until the first has opened every column there is room for.
  const column = opts.track === 'alt' ? fan.length - 1 - step : step;
  return {
    dx: (fan[column] ?? 0) + 4 * rung,
    // `0 - x` rather than `-x` so rung 0 reports +0, not -0.
    //
    // The pitch is deliberately **not** `ladderPitch(kind)`. A ladder is a
    // property of the *target*, not of the numeral climbing it: when the pitch
    // came from each numeral's own kind, rung 2 of a MISS sat 17px below rung 2
    // of a crit, so two numerals that the queue had given different slots on
    // one actor could still land on each other. Every rung is now at the same
    // height whatever kind takes it, and the height is the one the common case
    // already used, so nothing about a plain multi-hit moves.
    dy: 0 - (LADDER_PITCH + 3 + STAGGER_RISE) * rung,
    rung,
    column,
  };
}

/**
 * The one rung height, in logical px, shared by every kind of numeral — see
 * {@link burstSlot}. A crit's larger glyph still clears it (24px tall against a
 * 27.6px step), and a `kind` that needed a taller rung would be better served
 * by a fan column than by breaking the ladder for everything else.
 */
const LADDER_PITCH = ladderPitch('damage');

/** Per-target queue state carried between {@link nextBurstSlot} calls. */
export interface BurstState {
  /** Slot index the next numeral on this target's `'main'` track takes. */
  next: number;
  /**
   * Slot index the next `'alt'`-track numeral takes — its own ladder, because
   * the two tracks are two columns. Absent until a second family arrives.
   */
  nextAlt?: number;
  /**
   * The family that opened this burst, and therefore owns the `'main'` track.
   * Anything else landing on this target before the burst ends takes `'alt'`.
   */
  family?: NumeralFamily;
  /** Clock time, in ms, of the most recent spawn on this target. */
  lastSpawnMs: number;
  /** Earliest clock time, in ms, at which the next numeral may become visible. */
  nextFreeAt: number;
}

export interface BurstOptions {
  /** Minimum spacing between two releases on one target. Default {@link HIT_STAGGER_MS}. */
  staggerMs?: number;
  /** Cap on how long one numeral may be held back, so a 16-hit reel still ends. Default 720. */
  maxDelayMs?: number;
  /** Quiet time after which the target's burst is over and the ladder restarts. Default {@link BURST_GAP_MS}. */
  gapMs?: number;
  /**
   * The numeral's family, from {@link familyFor}. The first family to spawn in
   * a burst keeps the `'main'` track; a different one arriving before the burst
   * ends is put on `'alt'`, with its own ladder index, so the two never share a
   * fan column. Default `'damage'`.
   */
  family?: NumeralFamily;
}

/**
 * Take the next slot in a target's queue.
 *
 * The delay is *relative to the previous release on that target*, not to the
 * first hit of the action: a presenter that already paces its hits gets no
 * extra delay at all, while eight hits resolved in a single engine tick go out
 * 80ms apart. That is what "quick succession" means in FFX — the numerals
 * arrive one after another, each rising and fading on its own clock.
 *
 * `hitIndex` (the engine's own 0-based index within a multi-hit action) wins
 * when it is ahead of the running counter, so a caller that knows its hit
 * number keeps its ladder even if some of its numerals never spawned.
 *
 * The returned `track` says which fan column family this numeral belongs in —
 * see {@link BurstOptions.family} — and is passed straight to
 * {@link burstSlot}.
 */
export function nextBurstSlot(
  prev: BurstState | undefined,
  nowMs: number,
  hitIndex = 0,
  opts: BurstOptions = {},
): { index: number; delayMs: number; track: BurstTrack; state: BurstState } {
  const staggerMs = opts.staggerMs ?? HIT_STAGGER_MS;
  const maxDelayMs = opts.maxDelayMs ?? 720;
  const gapMs = opts.gapMs ?? BURST_GAP_MS;
  const family = opts.family ?? 'damage';
  const hit = Math.max(0, Math.floor(hitIndex));
  const fresh = !prev || nowMs - prev.lastSpawnMs > gapMs;
  // The *stagger* is shared by both tracks — two families landing on one actor
  // in one tick should still arrive one after the other — but the ladder index
  // is per track, so a heal joining a multi-hit starts at that column's foot
  // rather than three rungs up in dead air.
  const owner = fresh ? family : (prev?.family ?? family);
  const track: BurstTrack = owner === family ? 'main' : 'alt';
  const prevIndex = fresh ? 0 : track === 'alt' ? (prev?.nextAlt ?? 0) : (prev?.next ?? 0);
  const index = fresh ? hit : Math.max(prevIndex, hit);
  const delayMs = fresh ? 0 : Math.min(maxDelayMs, Math.max(0, prev!.nextFreeAt - nowMs));
  const state: BurstState = {
    next: track === 'main' ? index + 1 : fresh ? 0 : (prev?.next ?? 0),
    lastSpawnMs: nowMs,
    nextFreeAt: nowMs + delayMs + staggerMs,
    family: owner,
  };
  const alt = track === 'alt' ? index + 1 : fresh ? 0 : (prev?.nextAlt ?? 0);
  if (alt > 0) state.nextAlt = alt;
  return { index, delayMs, track, state };
}

// ------------------------------------------------------------ target lanes

/** One target competing for horizontal room, in layer pixels. */
export interface LaneInput {
  id: string;
  /** Projected anchor x. */
  x: number;
  /** Half-width of everything this target wants to draw around `x`. */
  halfWidth: number;
}

export interface LaneOptions {
  /**
   * The horizontal room the lanes actually have, in layer px — normally the
   * safe rect. Without it the sweep below is unbounded: seven targets each
   * asking for 540px of exclusive room in a 1600px frame got shifts of
   * -1204 and +971, which put two of them a thousand pixels off the edge of
   * the screen. With it, the demand is squeezed to fit before the sweep runs.
   */
  bounds?: { left: number; right: number };
  /**
   * Furthest a lane may sit from the anchor it belongs to, in layer px.
   *
   * This is the rule that outranks separation: a numeral 300px from the actor
   * it belongs to has stopped being that actor's numeral, and two figures that
   * slightly overlap on the right character read better than two clean figures
   * floating in dead air. When the cap binds, targets may still overlap — the
   * per-target stagger and ladder are what keep them legible then.
   *
   * Keep it below `SAFE_SLACK` (the distance outside the safe rect at which
   * `placeInSafeArea` gives up and draws over the HUD), so a lane push can
   * never on its own make a numeral think its target is buried under the
   * chrome. `FAN_STEP` < `SAFE_SLACK`, which is why it is the default.
   */
  maxShift?: number;
}

/**
 * Give every target its own horizontal lane.
 *
 * An AoE that lands on three party members standing shoulder to shoulder
 * projects three anchors a few pixels apart, and their ladders interleave —
 * `50-yunalesca.png`'s `2200` under `1850`. This sweeps the anchors left to
 * right, pushes any that overlap far enough apart to clear, then re-centres
 * the whole group on its original centroid so the fan stays visually attached
 * to the formation rather than drifting to one side.
 *
 * Returns an x *offset* per id (0 when the target needed no push). Ties on x
 * break by id, so the result is stable frame to frame.
 *
 * The sweep is greedy and only ever pushes right, so on its own it is
 * unbounded — it will happily ask for more width than the screen has and post
 * anchors off both edges, where every one of them is clamped flat against the
 * frame and piles up again. Two bounds keep it honest, and both are in
 * {@link LaneOptions}: the demand is **squeezed** to the room available before
 * the sweep, and each resulting shift is **capped** so a numeral never leaves
 * the actor it belongs to.
 */
export function resolveLanes(
  targets: readonly LaneInput[],
  gap = 10,
  opts: LaneOptions = {},
): Map<string, number> {
  const out = new Map<string, number>();
  if (targets.length === 0) return out;
  if (targets.length === 1) {
    out.set(targets[0]!.id, 0);
    return out;
  }

  const sorted = [...targets].sort((a, b) => (a.x === b.x ? (a.id < b.id ? -1 : 1) : a.x - b.x));

  // Squeeze the demand into the room there is. Every target asking for its
  // full exclusive width is only satisfiable when the widths happen to fit;
  // when they do not, shrinking them all by the same factor keeps the
  // *ordering* and the relative spacing the sweep is for, and gives up only
  // the absolute gaps — which the vertical ladder and the stagger already
  // cover. Scaling here rather than after the sweep matters: the sweep is what
  // amplifies an over-demand into a thousand-pixel shift.
  const avail = opts.bounds ? opts.bounds.right - opts.bounds.left : Number.POSITIVE_INFINITY;
  const demand = sorted.reduce((s, t) => s + 2 * Math.max(0, t.halfWidth), 0) + gap * (sorted.length - 1);
  const squeeze = demand > avail && demand > 0 ? avail / demand : 1;
  const laneGap = gap * squeeze;

  const placed: { id: string; x: number; shift: number }[] = [];
  let cursor = Number.NEGATIVE_INFINITY;
  for (const t of sorted) {
    const half = Math.max(0, t.halfWidth) * squeeze;
    const wanted = t.x - half;
    const x = wanted < cursor + laneGap ? cursor + laneGap + half : t.x;
    cursor = x + half;
    placed.push({ id: t.id, x: t.x, shift: x - t.x });
  }

  // Everything above only ever pushes right, which walks a crowded formation
  // toward the HUD. Re-centre by the mean push so the spread is symmetric.
  const mean = placed.reduce((sum, p) => sum + p.shift, 0) / placed.length;
  const maxShift = Math.max(0, opts.maxShift ?? Number.POSITIVE_INFINITY);
  for (const p of placed) {
    let shift = p.shift - mean;
    // Never post a lane outside the room — outside it the numeral is clamped
    // flat against the frame, which is the pile-up this module exists to stop.
    //
    // Only for a target that *started* inside, though. This clamp is here to
    // stop the sweep from carrying an anchor out of the room; a target that was
    // already outside it (an enemy standing behind the CTB column) is not the
    // sweep's doing, and dragging it to the edge would both detach its numerals
    // from it and hide the fact that it is buried — which is the one case
    // `placeInSafeArea` is allowed to draw over the HUD for.
    if (opts.bounds && p.x >= opts.bounds.left && p.x <= opts.bounds.right) {
      if (p.x + shift < opts.bounds.left) shift = opts.bounds.left - p.x;
      else if (p.x + shift > opts.bounds.right) shift = opts.bounds.right - p.x;
    }
    if (shift > maxShift) shift = maxShift;
    else if (shift < -maxShift) shift = -maxShift;
    out.set(p.id, shift);
  }
  return out;
}

// -------------------------------------------------------------- safe area

export interface SafeAreaOptions {
  /** How close to an edge (as a fraction of the bounds) a panel must sit to count as hugging it. Default 0.08. */
  edgeTolerance?: number;
  /** How much of that edge the panel must span before the whole edge is inset. Default 0.22. */
  minCoverage?: number;
  /**
   * Widest band the left or right edge may give up, as a fraction of the
   * bounds. Default 0.22 — enough for the FFX CTB column (~13% of a 16:9
   * frame) and deliberately *not* enough for the command stack (~23%), which
   * is only up while the menu is open and is better dodged than designed
   * around. A panel whose band would exceed this is left to
   * {@link deflectFromRects}.
   */
  maxInsetX?: number;
  /** Same, for the top and bottom edges. Default 0.34 — the party-status windows are ~32% of the height. */
  maxInsetY?: number;
  /** Extra air, in px, between the safe rect and the panel. Default 6. */
  margin?: number;
}

/**
 * The HUD-free rectangle numerals should live in.
 *
 * Issue 3 of `docs/handoff/playability-round-1.md`: `604`, `571` and `578`
 * printed across the right-hand CTB column in `47-boss-attack.png`. Dodging a
 * panel only once a numeral already overlaps it is too late — by then several
 * numerals have been shoved to the same free edge and pile up again. Instead
 * the layer works out, once per frame, the band each edge-anchored HUD slab
 * eats (the FFX CTB column on the right, the party-status windows along the
 * bottom, the FFX-2 boss strip along the top) and spawns inside what is left.
 *
 * A slab that hugs two edges — the bottom-right party window is both — is
 * charged to the **cheaper** edge only, so a corner panel costs a 290px bottom
 * band rather than swallowing the right half of the screen.
 */
export function safeAreaFrom(
  bounds: NumeralRect,
  panels: readonly NumeralRect[],
  opts: SafeAreaOptions = {},
): NumeralRect {
  const w = bounds.right - bounds.left;
  const h = bounds.bottom - bounds.top;
  if (!(w > 0 && h > 0)) return bounds;

  const tol = opts.edgeTolerance ?? 0.08;
  const minCoverage = opts.minCoverage ?? 0.22;
  const capX = w * (opts.maxInsetX ?? 0.22);
  const capY = h * (opts.maxInsetY ?? 0.34);
  const margin = opts.margin ?? 6;
  const tolX = w * tol;
  const tolY = h * tol;

  const inset = { left: 0, top: 0, right: 0, bottom: 0 };

  for (const raw of panels) {
    const left = Math.max(raw.left, bounds.left);
    const top = Math.max(raw.top, bounds.top);
    const right = Math.min(raw.right, bounds.right);
    const bottom = Math.min(raw.bottom, bounds.bottom);
    if (right <= left || bottom <= top) continue;

    const spanX = (right - left) / w;
    const spanY = (bottom - top) / h;
    const candidates: { edge: 'left' | 'top' | 'right' | 'bottom'; amount: number }[] = [];
    if (left <= bounds.left + tolX && spanY >= minCoverage) {
      candidates.push({ edge: 'left', amount: right - bounds.left + margin });
    }
    if (right >= bounds.right - tolX && spanY >= minCoverage) {
      candidates.push({ edge: 'right', amount: bounds.right - left + margin });
    }
    if (top <= bounds.top + tolY && spanX >= minCoverage) {
      candidates.push({ edge: 'top', amount: bottom - bounds.top + margin });
    }
    if (bottom >= bounds.bottom - tolY && spanX >= minCoverage) {
      candidates.push({ edge: 'bottom', amount: bounds.bottom - top + margin });
    }
    // A band wider than its cap is not worth designing around — it would cost
    // more field than the panel occupies. Drop it and let the deflector deal.
    const affordable = candidates.filter((c) =>
      c.edge === 'left' || c.edge === 'right' ? c.amount <= capX : c.amount <= capY,
    );
    if (affordable.length === 0) continue;

    // Cheapest edge only: a corner slab is a band along its short side.
    const best = affordable.reduce((a, b) => (b.amount < a.amount ? b : a));
    inset[best.edge] = Math.max(inset[best.edge], best.amount);
  }

  const rect: NumeralRect = {
    left: bounds.left + inset.left,
    top: bounds.top + inset.top,
    right: bounds.right - inset.right,
    bottom: bounds.bottom - inset.bottom,
  };
  if (rect.right <= rect.left || rect.bottom <= rect.top) return bounds;
  return rect;
}

/** Where a numeral ended up, and whether it had to be drawn over the HUD to get there. */
export interface SafePlacement {
  x: number;
  y: number;
  /** True when the target sits so deep under the HUD that no in-safe-area placement still reads as its own. */
  overHud: boolean;
}

/**
 * Put `anchor + offset` inside `safe`, preferring a mirror to a clamp.
 *
 * Clamping is what makes numerals pile up: every figure that overshoots an
 * edge lands on the *same* clamped coordinate. So an offset that would leave
 * the safe rect is first **reflected** — the fan flips to the other side of
 * its target, which preserves the spacing the fan was there to provide — and
 * only clamped if the mirror does not fit either.
 *
 * `slack` is how far outside the safe rect a target may stand and still have
 * its numerals pulled back inside: a party member whose chest is a little
 * below the status windows reads fine with the figure just above them, but an
 * enemy wholly behind the CTB column does not, and that is the one case where
 * `overHud` comes back true and the caller lifts the glyph over the chrome.
 */
export function placeInSafeArea(
  anchor: { x: number; y: number },
  offset: { x: number; y: number },
  half: { w: number; h: number },
  safe: NumeralRect | null,
  slack = 0,
  group?: { w: number; h: number },
): SafePlacement {
  const ideal = { x: anchor.x + offset.x, y: anchor.y + offset.y };
  if (!safe) return { x: ideal.x, y: ideal.y, overHud: false };

  const roomX = safe.right - safe.left;
  const roomY = safe.bottom - safe.top;
  if (roomX < half.w * 2 || roomY < half.h * 2) {
    return { x: ideal.x, y: ideal.y, overHud: true };
  }

  const outside =
    Math.max(safe.left - anchor.x, anchor.x - safe.right, 0) > slack ||
    Math.max(safe.top - anchor.y, anchor.y - safe.bottom, 0) > slack;
  if (outside) return { x: ideal.x, y: ideal.y, overHud: true };

  // Move the *anchor* first, by up to one `slack`, so the whole fan has room
  // rather than each figure being clamped on its own. Clamping figure by figure
  // is what turned Mortiorchis's fan back into a stack: every column of a
  // target parked against the CTB column landed on the same
  // `safe.right - halfWidth`, which is precisely the pile issue 2 is about.
  //
  // Only on the axis where the anchor has actually left the rect, though: a
  // target standing in open field keeps the exact x its lane gave it, so the
  // nudge cannot undo `resolveLanes` by pulling two neighbouring actors back
  // onto the same column.
  const g = group ?? half;
  const ax =
    anchor.x < safe.left || anchor.x > safe.right
      ? nudgeInto(anchor.x, safe.left + g.w, safe.right - g.w, slack)
      : anchor.x;
  const ay =
    anchor.y < safe.top || anchor.y > safe.bottom
      ? nudgeInto(anchor.y, safe.top + g.h, safe.bottom - g.h, slack)
      : anchor.y;

  // Reflect what still overshoots back off the boundary rather than clamping
  // it flat against it. Reflection is one-to-one, so two fan columns that both
  // overshoot stay two positions; a clamp maps every overshoot onto the *same*
  // coordinate, which is the pile-up this whole module exists to stop. It also
  // beats mirroring about the target: the fan is symmetric, so column 3
  // mirrored lands exactly on column 4.
  return {
    x: reflectAxis(ax + offset.x, safe.left + half.w, safe.right - half.w),
    y: reflectAxis(ay + offset.y, safe.top + half.h, safe.bottom - half.h),
    overHud: false,
  };
}

/** Fold `v` back into `[lo, hi]` off whichever bound it crossed; clamps if it folds past the other. */
function reflectAxis(v: number, lo: number, hi: number): number {
  if (hi < lo) return (lo + hi) / 2;
  if (v < lo) return Math.min(hi, 2 * lo - v);
  if (v > hi) return Math.max(lo, 2 * hi - v);
  return v;
}

/**
 * Pull `v` toward `[lo, hi]`, but never further than `maxMove` — so a group
 * whose actor stands under the chrome drifts toward open space without
 * detaching from the actor it belongs to. An inverted range (a group wider
 * than the safe rect) aims at its middle.
 */
function nudgeInto(v: number, lo: number, hi: number, maxMove: number): number {
  const target = hi >= lo ? Math.min(hi, Math.max(lo, v)) : (lo + hi) / 2;
  const delta = target - v;
  if (Math.abs(delta) <= maxMove) return target;
  return v + Math.sign(delta) * maxMove;
}
