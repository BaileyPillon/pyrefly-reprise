/**
 * GAMEPAD RUMBLE, AS PATTERNS (`?rumble=on`; `FeelSwitch.ts` has the switch; both games). Bailey, 2026-10-22: rumble "Light, big moments only": big hits dealt and taken,
 * Overdrives, Mega Flare, the win. Never on keyboard play, never under REDUCE MOTION (`app/gamepadRumble.ts` and `FeelHooks.ts` hold those two gates).
 *
 * A pattern is a few `dual-rumble` segments (the Gamepad API's `vibrationActuator.playEffect('dual-rumble', ...)`: a weak motor and a strong one, each 0 to 1, for a length, after
 * a delay). They are light on purpose: the strongest segment is 0.8 on the strong motor for 420 ms (Mega Flare's blow), a critical dealt is 0.35 for 110 ms. Every number is
 * `[ours]`: the sources give no rumble. Firefox and Safari have no `vibrationActuator`; the adapter guards every call, so there it is silence, not an error.
 *
 * Pure: no `three`, no DOM. The page-side sink (`app/gamepadRumble.ts`) is registered here, so the presenter's hooks (ports only) can reach the pad without importing the DOM.
 */

/** One `dual-rumble` segment. */
export interface RumbleSeg {
  /** Delay from the start of the pattern, ms. */
  atMs: number;
  ms: number;
  /** The weak (high-frequency) motor, 0 to 1. */
  weak: number;
  /** The strong (low-frequency) motor, 0 to 1. */
  strong: number;
}

export type RumblePattern = readonly RumbleSeg[];

/** What the pad-side sink takes. */
export type RumbleSink = (pattern: RumblePattern) => void;

let sink: RumbleSink | null = null;

/** The page registers the function that plays a pattern on a pad (`null` removes it). */
export function setRumbleSink(fn: RumbleSink | null): void {
  sink = fn;
}

/** Play a pattern on the registered sink; nothing when there is none or the pattern is null. */
export function sendRumble(pattern: RumblePattern | null): void {
  if (pattern && pattern.length > 0 && sink) sink(pattern);
}

/** What the rumble reads of one blow. */
export interface RumbleHitFacts {
  crit: boolean;
  /** Crit, overkill or capped. */
  heavy: boolean;
  /** The action is an Overdrive or a Special. */
  big: boolean;
  /** The action is a Special (Mega Flare). */
  special: boolean;
  last: boolean;
  /** A foe's headline move. */
  bossBig: boolean;
  /** The first blow of the action (a headline move that hits three targets rumbles once, as it stops and punches once: the first blow only). */
  first: boolean;
  /** The blow lands on the player's side (taken) rather than on a foe (dealt). */
  taken: boolean;
}

/** The longest any pattern runs, ms (the adapter trims longer ones). */
export const RUMBLE_MAX_MS = 600;

/**
 * The pattern for one blow, or null (most blows: nothing). A special's last blow (Mega Flare) is the longest and strongest; an Overdrive's last blow next; a boss's headline move
 * that lands on the party, then a critical or heavy blow taken, then dealt. The middle blows of an Overdrive's flurry are silent.
 */
export function rumbleForHit(f: RumbleHitFacts): RumblePattern | null {
  if (f.big) {
    if (!f.last) return null;
    return f.special ? [{ atMs: 0, ms: 420, weak: 0.5, strong: 0.8 }] : [{ atMs: 0, ms: 240, weak: 0.4, strong: 0.7 }];
  }
  if (f.bossBig) return f.first ? [{ atMs: 0, ms: f.taken ? 200 : 150, weak: 0.4, strong: f.taken ? 0.6 : 0.45 }] : null;
  if (f.crit || f.heavy) return f.taken ? [{ atMs: 0, ms: 160, weak: 0.3, strong: 0.5 }] : [{ atMs: 0, ms: 110, weak: 0.2, strong: 0.35 }];
  return null;
}

/** An Overdrive or Special opens (the splash slams in): a short soft thud. */
export function rumbleForOpen(kind: 'overdrive' | 'special' | 'other'): RumblePattern | null {
  return kind === 'other' ? null : [{ atMs: 0, ms: 140, weak: 0.15, strong: 0.3 }];
}

/** The win: a short pulse and a longer swell under the fanfare's first notes. */
export function rumbleForWin(): RumblePattern {
  return [
    { atMs: 0, ms: 160, weak: 0.25, strong: 0.35 },
    { atMs: 240, ms: 360, weak: 0.3, strong: 0.5 },
  ];
}

/** Total length of a pattern, ms. */
export function rumbleLength(p: RumblePattern): number {
  return p.reduce((m, s) => Math.max(m, s.atMs + s.ms), 0);
}
