/**
 * **The Dark Aeons' rules, as numbers and tests** (FFX only; the hidden Mirror Aeons chapter; `research/re-ffx-dark-aeons.md`, "RE note section n"). The scripts themselves are `./dark-aeons.ts`; this file holds what they
 * read, so that both stay under the house limit [AGENTS.md hard rule 7] and so that every number has one home and one source. **Every number here is the note's** (rule 6): the five scripts of the game's own monster
 * files (m340 to m343 and the dog's m116), read from the bytes and run in the earlier lanes' interpreter ("[bytes] [run]" there). Nothing in this file is an estimate of ours.
 *
 * ## The two gauges
 *
 * | | Rule | Where in the note |
 * |---|---|---|
 * | The bar | shown, maximum 100, **start 0** for Dark Yojimbo and in every Sisters formation but the two trios (those write 100: `kino00_70` and `kino01_70`) | 4.1, 5.1, 2.5 |
 * | Dark Yojimbo, each own turn | + the tier's step (6, 10, 16, 20 or 26: `dark.gaugePerTurn`), **after every turn, Zanmato's included**, so the gauge restarts at the step and not at 0 | 4.2 rule 3, 4.5 |
 * | A Sister, each own turn | + 20 on a basic move; her Mega Graviton writes 0 and adds nothing; in the trio rule Cindy writes 0 to all three, Sandy and Mindy add 20 to a gauge already at 100 | 5.2 |
 * | A hit event | Dark Yojimbo + 2, a Sister + 5, once per player action that reaches them, **while the owner can counter** and the hit is not a reaction | 4.3, 5.3, section 3 |
 *
 * ## The draws (RE note section 7)
 *
 * `GetRandomValue()` is stream 2 (`./game-rolls.ts#gameMod`), the picker stream 4 (`./game-rolls.ts#randomLiving`: one draw only with two or more living, targetable members of the front line). Dark Yojimbo draws
 * once, modulo 3, on every turn but a Zanmato turn; a Sister draws once, modulo 2, on every turn but a Delta Attack turn of Cindy's and a Mega Graviton turn; each single-target move then draws one stream-4 value.
 */

/** The AI script ids and the combatant ids (copies of `src/data/ffx/mirror-aeons-ids.ts`: the battle layer imports no `src/data`; `tests/unit/chapters/mirror-aeons-ai.test.ts` pins the copies equal). */
export { DARK_IDS, DARK_SCRIPTS, DARK_BATTLE_ID_FLAG, DARK_GAUGE_PER_TURN_FLAG } from './dark-aeons-seams.ts';

/** Property 20 (the gauge's maximum) is written 100 in all four scripts (RE note 4.1, 5.1). */
export const DARK_GAUGE_FULL = 100;
/** A Sister's gauge after each basic move (RE note 5.2 rows 1 and 3). */
export const SISTER_GAUGE_PER_TURN = 20;
/** A Sister's gauge for each hit event (RE note 5.3). */
export const SISTER_GAUGE_PER_HIT = 5;
/** Dark Yojimbo's gauge for each hit event (RE note 4.3). */
export const YOJIMBO_GAUGE_PER_HIT = 2;
/** Dark Yojimbo's draw: `GetRandomValue() mod 3` (RE note 4.2 rule 2). */
export const YOJIMBO_DRAW_MODULO = 3;
/** A Sister's draw: `GetRandomValue() mod 2`, a fair coin (RE note 5.2). */
export const SISTER_DRAW_MODULO = 2;

/** The battle ids of the two trio formations, `kino00_70` and `kino01_70`: the only places the trio test runs (RE note 5.2, 5.4). */
export const TRIO_BATTLE_IDS: readonly number[] = [0x00dc0046, 0x00dd0046];

/** The move rows (ids of `src/data/ffx/enemies/dark-aeons-abilities.ts`; the note's section 6.1 names the game's rows). */
export const DARK_ROWS = {
  razzia: 'dark-razzia', // 0x4100, Sandy, coin 0
  camisade: 'dark-camisade', // 0x4101, Cindy, coin 0
  passado: 'dark-passado', // 0x4102, Mindy, coin 0
  calamity: 'dark-calamity', // 0x4104, Mindy, coin 1
  megaGraviton: 'dark-mega-graviton', // 0x4105, each Sister at her own full gauge, the whole front line
  deltaAttack: 'dark-delta-attack', // 0x4106, Cindy, the trio rule, the whole front line
  kozuka: 'dark-kozuka', // 0x4107, Dark Yojimbo, one random living front-line character
  wakizashiAll: 'dark-wakizashi-all', // 0x4109, Dark Yojimbo, the whole front line (the single 0x4108 is in his list and no branch queues it)
  zanmato: 'dark-zanmato', // 0x410A, Dark Yojimbo at a full gauge, the whole front line
  daigoroOrder: 'dark-daigoro-order', // 0x4086, aimed at the dog
  daigoroBite: 'dark-daigoro-bite', // 0x410B, the dog's, on a random living front-line character
  sandyAttack: 'dark-sandy-attack', // 0x4127, Sandy, coin 1
  cindyAttack: 'dark-cindy-attack', // 0x412B, Cindy, coin 1 (dispels the target's buffs)
} as const;

/** The two basic moves of each Sister, in the coin's order: residue 0 first (RE note 5.2 row 3). */
export const SISTER_BASIC_MOVES = {
  cindy: [DARK_ROWS.camisade, DARK_ROWS.cindyAttack],
  sandy: [DARK_ROWS.razzia, DARK_ROWS.sandyAttack],
  mindy: [DARK_ROWS.passado, DARK_ROWS.calamity],
} as const;

/** The three Sisters in the order of their actor numbers in the trio formations: Mindy 20, Sandy 21, Cindy 22 (RE note 1.1; the trio test reads them by number, 5.2 row 1). */
export const TRIO_ACTOR_ORDER = ['mindy', 'sandy', 'cindy'] as const;
export type SisterKey = 'cindy' | 'sandy' | 'mindy';
