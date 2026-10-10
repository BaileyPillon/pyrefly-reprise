/**
 * The primitives the game's boss scripts are written in (re-parity, AI lane B; **FFX only**).
 *
 * `research/re-ffx-ai-yunalesca-bfa.md` section 1.2 and 1.3, read in FFX.exe and run in the note's interpreter:
 *
 * - `GetRandomValue()` is the battle generator's stream 2, `& 0xFFFF`; the scripts then take `mod 100`, `mod 3`, `mod 5`,
 *   `mod 2` or `mod 10` of it themselves. 65,536 is not a multiple of those numbers, so the odds are very slightly off
 *   the round figures (`mod 100`: residues 0 to 35 occur 656 times, 36 to 99 occur 655), and {@link gameMod} keeps that
 *   by drawing the 16 bits and reducing them the way the script does.
 * - `findMatchingChr(group, property, value, selector)` first keeps the **living**, then the **targetable** actors of
 *   the group; a selector then keeps the extreme ones (ties all kept); the pick among the survivors draws (stream 4)
 *   only when two or more remain, as `draw mod count` along the survivors in ascending actor order, and with none
 *   returns 255 (no target). {@link pickActor} is that pick.
 *
 * **The engine draws both from its one seeded stream** (`ctx.rng`, mulberry32); adopting the game's own generators and
 * their stream map is a separate decision for Bailey (`docs/plans/re-parity.md` P3), so a seed here replays this engine,
 * not the game. What matches the game is each roll's range and reduction, which rolls are taken and in what order.
 */

import type { CombatantId, FFXCombatant } from '../../common/types.ts';
import { type Ctx, canAct, friendlies, has, isAlive, targetable } from '../state.ts';

/**
 * The game's actor ids for the party and the aeons: party 0 to 7, aeons 8 to 17, monsters 20 and up in formation order
 * (section 1.4). The tie-break table of `turnQueue.ts` is the same order (`ffx-combat-core` section 1.6).
 */
const ACTOR_ID: Readonly<Record<string, number>> = {
  tidus: 0, yuna: 1, auron: 2, kimahri: 3, wakka: 4, lulu: 5, rikku: 6, seymour: 7,
  valefor: 8, ifrit: 9, ixion: 10, shiva: 11, bahamut: 12, anima: 13, yojimbo: 14, cindy: 15, sandy: 16, mindy: 17,
};

/** The game's actor id of a combatant, or a stable stand-in past the party for an id the game does not number. */
export function actorNumber(ctx: Ctx, id: CombatantId): number {
  const known = ACTOR_ID[id];
  if (known !== undefined) return known;
  const monster = ctx.state.enemyIds.indexOf(id);
  return monster >= 0 ? 20 + monster : 100;
}

/** `GetRandomValue()`: sixteen bits. */
export function gameRandom(ctx: Ctx): number {
  return ctx.rng.int(0, 0xffff);
}

/** `GetRandomValue() mod m`, the form every script uses it in. */
export function gameMod(ctx: Ctx, m: number): number {
  return gameRandom(ctx) % m;
}

/**
 * The tail of `findMatchingChr`: one of `pool`, in ascending actor order, by a draw only when there are two or more.
 * An empty pool answers `undefined` (the game's 255).
 */
export function pickActor(ctx: Ctx, pool: readonly FFXCombatant[]): FFXCombatant | undefined {
  if (pool.length === 0) return undefined;
  if (pool.length === 1) return pool[0];
  const ordered = [...pool].sort((a, b) => actorNumber(ctx, a.id) - actorNumber(ctx, b.id));
  return ordered[ctx.rng.int(0, ordered.length - 1)];
}

/** `-14 FrontlineChars`: every non-monster actor in the battle (the aeon alone while one holds the field). */
export function frontLine(ctx: Ctx): FFXCombatant[] {
  return friendlies(ctx);
}

/** The front line after `findMatchingChr`'s two filters: alive, then targetable. */
export function livingFrontLine(ctx: Ctx): FFXCombatant[] {
  return frontLine(ctx).filter((c) => isAlive(c) && targetable(c));
}

/** `findMatchingChr(front line, isAlive, 0, Any)`: a random living, targetable actor, drawn only if two or more qualify. */
export function randomLiving(ctx: Ctx): FFXCombatant | undefined {
  return pickActor(ctx, livingFrontLine(ctx));
}

/** `findMatchingChr(front line, HP, 0, Highest)`: the living actor with the most current HP; a tie is drawn. */
export function highestHpLiving(ctx: Ctx): FFXCombatant | undefined {
  const pool = livingFrontLine(ctx);
  const top = pool.reduce((best, c) => Math.max(best, c.hp), -1);
  return pickActor(ctx, pool.filter((c) => c.hp === top));
}

/** How many of Character #1 to #3 (the three front-line slots, KO'd or off the field or not) carry Zombie. */
export function zombieSlots(ctx: Ctx): number {
  let count = 0;
  for (const id of ctx.state.activeIds) {
    const c = ctx.state.combatants[id] as FFXCombatant | undefined;
    if (c !== undefined && has(c, 'zombie')) count += 1;
  }
  return count;
}

/** True when `performCommand` would queue for this actor (`pp_BtlCanAct`: not asleep, Threatened, Confused or Berserk). */
export function canQueue(actor: FFXCombatant): boolean {
  return canAct(actor) && !has(actor, 'confuse') && !has(actor, 'berserk');
}
