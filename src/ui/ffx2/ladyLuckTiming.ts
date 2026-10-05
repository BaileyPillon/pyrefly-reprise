/**
 * Lady Luck's timed reels: where each strip is, and which symbol the press picks.
 * **FFX-2 only** (Lady Luck is an X-2 dressphere; Wakka's Slots in FFX are a different machine).
 *
 * This is the whole rule of the timed reels, in one pure module (no DOM, no clock of its own, nothing random):
 *
 *   the symbol dead centre on the gold line at the instant of the press is the result.
 *
 * Bailey picked it on 2026-10-04 ("I'll go with pick A, the slow strip"): every reel is a strip of its six symbols in a
 * fixed order, running at a constant rate; the press stops the reel the pink arrow marks, on whatever symbol is on the
 * line at that instant, and the strip snaps the last fraction of a symbol onto it. It lives in the presentation layer on
 * purpose (AGENTS.md hard rule 1): `src/battle` never sees a time. The overlay turns a press into a symbol here, and the
 * symbol reaches the engine as the stop it always took (`ReelResult.symbols`), so the pay table, the Dud and the seeded
 * stream are untouched.
 *
 * ## What the sources say, and what is ours
 *
 * Sourced (`research/ffx2-combat-core.md` §3.12, `research/visual-bible.md` §4.10.2): three reels, a random stop order,
 * one press per reel, the pay table and the Dud, and (single source) that the reels can be lined up by pausing again and
 * again. Nothing in the sources gives Lady Luck's reels a speed or a timer.
 *
 * - **`REEL_RATE` is OUR ESTIMATE**: 5 symbols a second (200 ms a symbol). The options page called it "the pace of a
 *   clock hand" and noted Wakka's Slots at about 6 a second in our estimate (also unsourced).
 * - **`REEL_TIMER_MS` is OUR ESTIMATE**: 12 s, the safety timer. The old overlay's own default was 20 s.
 * - `REEL_SNAP_MS` is the page's 0.15 s ease; the visual bible's stop is "0.18 s ease-out decel, snap to symbol centre".
 *
 * ## Positions
 *
 * A reel's position is a real number of symbols. Symbol `k` (index into the strip, wrapping) is dead centre on the line
 * when the position is exactly `k`; the strip scrolls downward, so symbol `k + 1` sits above the line and arrives next.
 * The symbol "on the line" is the nearest one: `Math.round(position)`, wrapped. The tie, at exactly half a symbol, goes to
 * the symbol that is arriving (the next one): `Math.round` rounds a half up, which is what the pinned test says.
 */

/** Symbols a second the strips run at. OUR ESTIMATE: no source gives Lady Luck's reels a rate. */
export const REEL_RATE = 5;

/** The safety timer, in ms: when it runs out the remaining reels stop where they are. OUR ESTIMATE: no source gives a timer. */
export const REEL_TIMER_MS = 12_000;

/** How long the stopped strip takes to ease onto its symbol, in ms (the options page's 0.15 s; the bible says 0.18 s). */
export const REEL_SNAP_MS = 150;

/** The random half of a spin: which reel each press stops, and where each strip starts. Drawn once, from the seeded stream. */
export interface ReelLayout {
  /** Reel indices, 0 = left, in the order the three presses stop them (the pink arrow follows it). */
  readonly stopOrder: readonly [number, number, number];
  /** Where each reel's strip is at t = 0, in symbols; any real number, the strip wraps. */
  readonly phases: readonly [number, number, number];
}

/** A non-negative remainder (JavaScript's `%` keeps the sign of the dividend). */
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** Where a strip is `elapsedMs` after the spin started, in symbols. */
export function positionAt(phase: number, elapsedMs: number): number {
  return phase + (REEL_RATE * elapsedMs) / 1000;
}

/** The index into a strip of `count` symbols that is dead centre (or nearest the line) at `position`. */
export function indexOnLine(position: number, count: number): number {
  return mod(Math.round(position), count);
}

/** The symbol on the gold line `elapsedMs` into the spin: the symbol a press at that instant stops on. */
export function symbolOnLine(strip: readonly string[], phase: number, elapsedMs: number): string {
  return strip[indexOnLine(positionAt(phase, elapsedMs), strip.length)] ?? '';
}

/**
 * Milliseconds from `elapsedMs` until the strip's `symbol` is next dead centre on the line (0 when it is centred now).
 * `Infinity` when the strip does not hold the symbol. A player who wants a symbol presses a little before or after this;
 * the symbol is the one on the line for 200 ms either side of it (100 ms before and after, at 5 a second).
 */
export function msUntilCentred(strip: readonly string[], phase: number, symbol: string, elapsedMs: number): number {
  const at = strip.indexOf(symbol);
  if (at < 0) return Number.POSITIVE_INFINITY;
  const ahead = mod(at - positionAt(phase, elapsedMs), strip.length);
  return (ahead / REEL_RATE) * 1000;
}

/** Ease-out cubic: fast at first, settling onto the symbol. `u` is clamped to 0..1. */
export function easeOutCubic(u: number): number {
  const c = Math.min(1, Math.max(0, u));
  return 1 - (1 - c) ** 3;
}

/** The displayed position of a stopped strip `sinceMs` after its press: from where it was to the whole symbol it picked. */
export function snappedPosition(pressedAt: number, sinceMs: number): number {
  const target = Math.round(pressedAt);
  return pressedAt + (target - pressedAt) * easeOutCubic(sinceMs / REEL_SNAP_MS);
}

const isStopOrder = (v: unknown): v is [number, number, number] =>
  Array.isArray(v) && v.length === 3 && [0, 1, 2].every((i) => v.includes(i));

const isPhases = (v: unknown): v is [number, number, number] =>
  Array.isArray(v) && v.length === 3 && v.every((p) => typeof p === 'number' && Number.isFinite(p));

/**
 * The layout of one spin. The engine draws it from its seeded stream and puts it on the `minigame-request`
 * (`params.stopOrder`, `params.phases`, `src/battle/ffx2/minigames.ts`), which is what keeps the game deterministic for
 * everything except the player's timing. A caller with no layout (a unit test, a bare overlay) gets one from `rng`.
 */
export function layoutFrom(
  params: Readonly<Record<string, unknown>>,
  rng: () => number,
  count: number,
): ReelLayout {
  let stopOrder: [number, number, number];
  if (isStopOrder(params['stopOrder'])) {
    stopOrder = [params['stopOrder'][0], params['stopOrder'][1], params['stopOrder'][2]];
  } else {
    const order = [0, 1, 2];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = order[i]!;
      order[i] = order[j]!;
      order[j] = tmp;
    }
    stopOrder = order as [number, number, number];
  }
  const raw = params['phases'];
  const phases: [number, number, number] = isPhases(raw)
    ? [mod(raw[0], count), mod(raw[1], count), mod(raw[2], count)]
    : [rng() * count, rng() * count, rng() * count];
  return { stopOrder, phases };
}
