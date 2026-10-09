/**
 * The random numbers an FFX boss script draws, in the shapes the game's scripts use them
 * (`research/re-ffx-ai-seymour.md` section 1.3). **FFX only** [AGENTS.md rule 14].
 *
 * The scripts have exactly two sources of chance, and the engine's single seeded stream feeds
 * both of them (adopting the game's own stream map is a separate decision of Bailey's, plan
 * P3; nothing here assumes it):
 *
 * | Script call | Shape | Helper |
 * |---|---|---|
 * | `GetRandomValue()` | `rng & 0xFFFF`, then the script's own `mod` and compare | {@link scriptValue}, {@link scriptMod}, {@link scriptCoin} |
 * | `findMatchingChr(...)` (the random actor picker) | the raw 31-bit value `mod` the number of candidates, indexing the candidates in **ascending actor number**; **no draw at all** with fewer than 2 candidates | {@link pickMatching} |
 *
 * A script's `mod 100 > 50` is therefore **not** a 50 % coin: the residues 51 to 99 of a 16-bit
 * value come up 32,095 times in 65,536, which is 48.97 % ({@link COIN_TRUE_COUNT}). The tests
 * enumerate all 65,536 values through {@link rawCoin} and pin that count.
 */

import type { FFXCombatant } from '../../common/types.ts';
import type { Ctx } from '../state.ts';

/** The values `GetRandomValue()` can return: `rng & 0xFFFF`. */
export const SCRIPT_VALUES = 0x10000;

/** How many of the {@link SCRIPT_VALUES} make `mod 100 > 50` true: residues 51 to 99. */
export const COIN_TRUE_COUNT = 32_095;

/** A raw draw of the picker: the engine's 31-bit value. */
const PICKER_RANGE_MAX = 0x7fffffff;

/** `GetRandomValue()`: one draw of the shared stream, 0 to 0xFFFF. */
export function scriptValue(ctx: Pick<Ctx, 'rng'>): number {
  return ctx.rng.int(0, 0xffff);
}

/** `GetRandomValue() mod n`, one draw. */
export function scriptMod(ctx: Pick<Ctx, 'rng'>, n: number): number {
  return scriptValue(ctx) % n;
}

/** The script's coin on a given raw value: `mod 100 > 50`, true for 48.97 % of the 65,536 values. */
export function rawCoin(raw: number): boolean {
  return raw % 100 > 50;
}

/** `GetRandomValue() mod 100 > 50`, one draw. */
export function scriptCoin(ctx: Pick<Ctx, 'rng'>): boolean {
  return rawCoin(scriptValue(ctx));
}

/**
 * The game's actor number of a combatant, which orders the picker's candidates: the party
 * Tidus 0 .. Rikku 6, the aeons from 8, the monsters 20 and up in formation order.
 * (`research/re-ffx-ai-seymour.md` section 1.2.)
 */
const PARTY_ORDER: readonly string[] = ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'rikku'];
const AEON_ORDER: readonly string[] = [
  'valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo', 'cindy', 'sandy', 'mindy',
];

export function actorNumber(ctx: Pick<Ctx, 'state'>, c: FFXCombatant): number {
  const party = PARTY_ORDER.indexOf(c.id);
  if (party >= 0) return party;
  const aeon = AEON_ORDER.indexOf(c.id);
  if (aeon >= 0) return 8 + aeon;
  const enemy = ctx.state.enemyIds.indexOf(c.id);
  if (enemy >= 0) return 20 + enemy;
  return 100 + c.slot;
}

/** The candidates in the order the picker indexes them: ascending actor number. */
export function inActorOrder<T extends FFXCombatant>(ctx: Pick<Ctx, 'state'>, candidates: readonly T[]): T[] {
  return [...candidates].sort((a, b) => actorNumber(ctx, a) - actorNumber(ctx, b));
}

/** The picker's index for a raw 31-bit draw over `count` candidates. */
export function pickerIndex(raw: number, count: number): number {
  return raw % count;
}

/**
 * A `findMatchingChr` whose result the script throws away still draws: the call that builds the
 * `MatchingGroup` mask (Seymour in Macalania, Natus) spends one picker draw whenever it has two or more
 * candidates. Spend it, and return nothing.
 */
export function drawPicker(ctx: Pick<Ctx, 'rng'>, candidateCount: number): void {
  if (candidateCount >= 2) ctx.rng.int(0, PICKER_RANGE_MAX);
}

/**
 * `findMatchingChr`: a random one of `candidates` (already filtered to the alive, targetable
 * actors that have the property the script asked for). The raw 31-bit draw `mod` the count picks
 * from the candidates in ascending actor number; **with 0 or 1 candidate nothing is drawn**.
 * `undefined` for no candidate (the game's 0xff).
 */
export function pickMatching<T extends FFXCombatant>(ctx: Pick<Ctx, 'rng' | 'state'>, candidates: readonly T[]): T | undefined {
  if (candidates.length === 0) return undefined;
  const ordered = inActorOrder(ctx, candidates);
  if (ordered.length === 1) return ordered[0];
  return ordered[pickerIndex(ctx.rng.int(0, PICKER_RANGE_MAX), ordered.length)];
}
