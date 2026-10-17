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
import { classifyReelLine } from './kernel/reel-line.ts';

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

/**
 * The numbers the game's line classifier works on (`./kernel/reel-line.ts`, `FFX-G01` section 7) for the symbols whose shot the command table fixes:
 * result 1 and 2 are the Fire shot, so symbol 0 is Fire, and likewise Ice 1, Water 2, Thunder 3, Havoc 7, Time 8, Break 9 and Aurochs 10 (result 15).
 * The Attack Reels symbols (1-hit, 2-hit, miss) are not in it: which numbers they carry is not established, so that strip keeps its own rule below.
 */
const SYMBOL_NUMBER: Readonly<Record<string, number>> = { fire: 0, ice: 1, water: 2, thunder: 3, skull: 7, 'egg-timer': 8, 'down-arrow': 9, aurochs: 10 };

/** The shot of each classifier result: 2n - 1 hits one enemy and 2n every enemy (Fire 1 and 2, Ice 3 and 4, Water 5 and 6, Thunder 7 and 8, Havoc 9 and 10, Time 11 and 12, Break 13 and 14); 15 is Aurochs. */
const SHOT_OF_RESULT: Readonly<Record<number, string>> = {
  1: 'fire-shot', 2: 'fire-shot', 3: 'ice-shot', 4: 'ice-shot', 5: 'water-shot', 6: 'water-shot', 7: 'thunder-shot', 8: 'thunder-shot',
  9: 'havoc-shot', 10: 'havoc-shot', 11: 'time-shot', 12: 'time-shot', 13: 'break-shot', 14: 'break-shot', 15: 'aurochs-shot',
};

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

  // The game's classifier decides the match when every symbol is one it knows (0x007B1710): a PAIR of Aurochs symbols is no match, so a Power Shot, and three of
  // them the Aurochs shot at every enemy; every other pair and three is as below.
  const numbers = symbols.map((s) => SYMBOL_NUMBER[s]);
  if (symbols.length === 3 && numbers.every((n) => n !== undefined)) {
    const line = classifyReelLine(numbers as [number, number, number]);
    const shot = SHOT_OF_RESULT[line.result];
    if (shot === undefined || !shots.includes(shot)) return fallback;
    return { shotId: shot, targeting: line.result === 15 || line.result % 2 === 0 ? 'all-enemies' : 'random-enemy' };
  }

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
