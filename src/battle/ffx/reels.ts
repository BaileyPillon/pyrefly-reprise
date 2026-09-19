/**
 * Wakka's Slots: turning three stopped symbols into the shot that fires
 * [ffx-combat-core §5.6].
 *
 * A reel-set command (`element-reels`, `attack-reels`, `status-reels`,
 * `aurochs-reels`) is a **wrapper**: `formula: 'none'`, `power: 0`, `hits: 0`,
 * and `minigame: 'wakka-reels'`. It deals nothing itself. Its `extra` names the
 * strip (`reelSymbols`), the shots it may resolve to (`resolvesToShots`) and
 * the no-match row (`noMatchFallback`), and until this module existed **no code
 * anywhere read those three keys** — so every Slots Overdrive spent a full
 * gauge and did literally nothing. Measured on the real Chapter-1 board, taking
 * the row exactly as offered: `bossHP 70000 -> 70000`, `damage: []`,
 * `gauge 100 -> 0`.
 *
 * §5.6's matching rule, identical for all four sets:
 *
 * | Match | Result |
 * |---|---|
 * | 3 of a kind | the matched effect hits **every** enemy |
 * | 2 of a kind | the matched effect hits **one random** enemy |
 * | no match | one non-elemental **Power Shot** on one random enemy |
 *
 * **Attack Reels is the exception** and has no fallback row: every combination
 * resolves to the same `attack-reels-hit` and only the hit count changes —
 * `n = sum(symbols)` with Miss 0 / 1 Hit 1 / 2 Hit 2, doubled when all three
 * match, so 12 (a perfect 2-2-2) is the true maximum and Miss/Miss/Miss is a
 * real, canonical **zero-hit** outcome rather than a bug.
 *
 * Slots never crits, and the resolved shots always hit — both are settled in
 * the data files' own headers, not here.
 */

import type { AbilityDef, ReelResult, Targeting } from '../common/types.ts';

/** What one spin resolves to. */
export interface ReelOutcome {
  /** The shot ability id to resolve instead of the wrapper. */
  shotId: string;
  /** §5.6's match rule, applied over the shot's own targeting. */
  targeting: Targeting;
  /** Attack Reels only: the computed hit count. `undefined` leaves the shot's own. */
  hits?: number;
}

/**
 * Symbol -> shot, straight off §5.6's two tables.
 *
 * The Element and Aurochs rows are named after their symbol; the three Status
 * Reels rows are not, and §5.6's "Status Reels — per-symbol effects" table is
 * the only place that pairing is written down: **Skull -> Havoc Shot**,
 * **Down-Arrow -> Break Shot**, **Egg-timer -> Time Shot**. The data files can
 * still veto any of it, because a resolved id must appear in the wrapper's own
 * `resolvesToShots`.
 */
const SHOT_FOR_SYMBOL: Readonly<Record<string, string>> = {
  fire: 'fire-shot',
  ice: 'ice-shot',
  water: 'water-shot',
  thunder: 'thunder-shot',
  skull: 'havoc-shot',
  'down-arrow': 'break-shot',
  'egg-timer': 'time-shot',
  aurochs: 'aurochs-shot',
};

/**
 * One spelling per symbol.
 *
 * The data files write `'1-hit'`, `'down-arrow'`, `'egg-timer'`; `types.ts`
 * documents the UI's payload as `'1hit'`, `'arrow'`, `'timer'`. Both are in the
 * tree and both are legitimate, so the engine accepts either rather than
 * silently reading a live spin as a no-match.
 */
const ALIASES: Readonly<Record<string, string>> = {
  '1hit': '1-hit',
  '2hit': '2-hit',
  arrow: 'down-arrow',
  timer: 'egg-timer',
  lightning: 'thunder',
};

function normalise(symbol: string): string {
  const key = symbol.trim().toLowerCase();
  return ALIASES[key] ?? key;
}

/** Miss 0, "1 Hit" 1, "2 Hit" 2 — the only three symbols that carry a value. */
const HIT_VALUE: Readonly<Record<string, number>> = { miss: 0, '1-hit': 1, '2-hit': 2 };

/** True for the Attack Reels strip, whose whole rule is the hit count. */
function isAttackStrip(symbols: readonly string[]): boolean {
  return symbols.length > 0 && symbols.every((s) => s in HIT_VALUE);
}

function extraList(def: AbilityDef, key: string): string[] {
  const raw = def.extra?.[key];
  return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];
}

/**
 * `n = sum of the three stopped symbols; if all three are identical, n *= 2`
 * [§5.6, "Attack Reels — the hit-count rule, fully specified"].
 *
 * 12 is not a clamp: it is `6 x 2`, the largest the rule can produce.
 */
export function attackReelHits(symbols: readonly string[]): number {
  const values = symbols.map((s) => HIT_VALUE[normalise(s)] ?? 0);
  const raw = values.reduce((sum, v) => sum + v, 0);
  const allSame = symbols.length === 3 && new Set(symbols.map(normalise)).size === 1;
  return allSame ? raw * 2 : raw;
}

/**
 * Resolve one spin of `def` into the shot that actually fires.
 *
 * Returns `null` only when the wrapper declares no shots at all, which is a
 * data error rather than a game outcome; the caller then leaves the wrapper
 * alone so the failure is visible instead of silent.
 */
export function resolveReelSpin(def: AbilityDef, reels: ReelResult): ReelOutcome | null {
  const shots = extraList(def, 'resolvesToShots');
  if (shots.length === 0) return null;

  const symbols = reels.symbols.map(normalise);
  const strip = extraList(def, 'reelSymbols').map(normalise);

  // Attack Reels: one shot, variable `n`, no fallback row. §5.6.
  if (isAttackStrip(strip.length > 0 ? strip : symbols)) {
    return { shotId: shots[0]!, targeting: 'random-enemy', hits: attackReelHits(reels.symbols) };
  }

  const fallbackId = typeof def.extra?.['noMatchFallback'] === 'string' ? (def.extra['noMatchFallback'] as string) : undefined;
  const fallback: ReelOutcome | null = fallbackId
    ? { shotId: fallbackId, targeting: 'random-enemy' }
    : { shotId: shots[shots.length - 1]!, targeting: 'random-enemy' };

  // Which symbol, if any, the player lined up. Three of a kind beats a pair.
  const three = symbols.length === 3 && symbols[0] === symbols[1] && symbols[1] === symbols[2];
  let matched: string | undefined;
  if (three) {
    matched = symbols[0];
  } else {
    matched = symbols.find((s, i) => symbols.indexOf(s) !== i);
  }
  if (matched === undefined) return fallback;

  const shotId = SHOT_FOR_SYMBOL[matched];
  // The wrapper's own list is authoritative about what it can produce: a symbol
  // the data did not wire up is a no-match, not an invented shot.
  if (shotId === undefined || !shots.includes(shotId)) return fallback;

  return { shotId, targeting: three ? 'all-enemies' : 'random-enemy' };
}
