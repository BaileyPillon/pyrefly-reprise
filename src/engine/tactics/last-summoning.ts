/**
 * The hidden Last Summoning (hidden FFX chapter 28; **FFX only** [AGENTS.md rule 14]): the line it is played with. Registered under the FFX game in `./lookup.ts`, and found only on this chapter's own board
 * (`./lookup.ts#onLastSummoningBoard`: every battle of the chain carries the lock whose reason is "Taken by Yu Yevon"), so Chapter III, whose possessed aeons share the same ids, keeps its own line.
 *
 * ## What the line is: Chapter III's, with the three things this chapter adds
 *
 * The party is Chapter III's (`data/ffx/builds/last-summoning.ts`: Tidus, Yuna and Auron, the same gear, items and Auto-Life), and the fights are Chapter III's possession links and Yu Yevon (a possessed aeon at
 * the copy of the player's own stats, the two Yu Pagodas, nothing restored between links), so every ordinary party turn is **Chapter III's line, unchanged** (`./braskas-final-aeon.ts`: revive, repair, Protect, swing
 * at the twin; the Yu Yevon line: Candle of Life, the Pagodas down, then idle). What it adds, each from the RE session's note on the game's own files (`research/re-ffx-last-summoning.md`, "RE section n"):
 *
 * 1. **The Magus Sisters are one battle with three bodies**, and Cindy is the one that keeps it going: she mends (Curaga on a Sister at half HP or less) and drains (Drain whenever she is under two thirds of her own HP),
 *    and she throws the Delta Attack, which needs all three alive with their gauges full (RE section 6.2). So every swing goes at **Cindy while she stands, then at the Sister with the least HP left**: with Cindy down
 *    nothing but the Pagodas heals a Sister and the Delta Attack can never come, and a blow spread over the three charges all three gauges (10 to 19 a hit, RE section 6.2) instead of one. **Measured, not argued**: aimed
 *    at the weakest first (Mindy, then Sandy), the party left Cindy alone, draining as fast as it hurt her, and the fight stalled (`The battle cannot be won from here`) in 5 of 24 seeds with the Sisters last, 3 of 24 with
 *    them second; aimed at Cindy first it won 24 of 24 in both orders, in about a third of the turns (`tests/unit/chapters/last-summoning-bench.test.ts` has the whole table).
 * 2. **The player's Yojimbo pays to be good**: Pay is his whole menu (RE section 8, the aeon-side note). The motivation is `4n + compatibility div 10` with `n = floor(log2 gil) - 2`, and once it is 63 the roll can no
 *    longer fall below Wakizashi on all, whatever the monsters' Zanmato byte (RE section 8.1 point 4), so the line pays **the smallest power of two that reaches 63**, or the largest the purse allows. Every doubling of
 *    the payment adds 4, which is why a payment is always a power of two. [The hire answer is the build's, 1; the line is written for it.]
 * 3. **The player's Sisters: Combine when their menu offers it, else home.** Combine powers is the Delta Attack on every foe in reach, six hits on each (RE's follow-up: the possessed aeon and both Pagodas here), offered only
 *    while all three of the Sisters' own stored gauges are full (a Grand Summon's temporary gauge does not count), which the chapter's roster starts them at, as Chapter XXVII's does, and which Combine then spends. The engine carries
 *    out all eight of their orders since that follow-up and a player may give any of them; the line uses Combine and nothing else, so the bench does not rest on the other seven.
 *
 * 4. **Yuna calls an aeon when she has nothing urgent to do and the Grand Summon is ready** (not against Yu Yevon, whom no aeon hurts). A Grand Summon arrives with a full temporary gauge, so an aeon with an Overdrive
 *    opens with it (the Sisters and Yojimbo have no Overdrive row: their menus are Combine and Pay); then
 *    it hands the field back (Dismiss), because the party is parked while an aeon stands and three swords out-swing one aeon (Chapter III's note, `./braskas-final-aeon.ts#aeonTurn`, gives the same reason to keep an aeon's
 *    stay short). **Why this rule exists:** the roster is the chapter's whole point (Bahamut or Anima arriving on a full gauge open with a 9,999), and a line that never called one would leave the chapter's own aeons to
 *    the player alone. The order the aeons are called in is ours (the biggest Overdrive first, the ones that need a payment or all three gauges last), an `[estimate]`; it is a convenience of the line, not a promise of a win,
 *    and the bench (`tests/unit/chapters/last-summoning-bench.test.ts`) prints how often an aeon is standing when a link ends. Without rule 1's choice of Cindy, the Magus Sisters' fight stalled in about one chain in
 *    eight (the engine then calls `The battle cannot be won from here`) whatever was called; with it the line wins every chain the bench plays.
 *
 * Any other aeon of the player's plays itself as it does in Chapter III: its Overdrive, else it leaves.
 *
 * The tactic only picks among the rows the engine offers, and returns `null` (the generic ladder) when it has no opinion. **Nothing here changes a number of the fight**; the bench
 * (`tests/unit/chapters/last-summoning-bench.test.ts`) measures what it does.
 */

import type { AvailableCommand, BattleEngine, CombatantId, Command, FFXCombatant } from '../../battle/common/types.ts';
import { PAY_ABILITY_ID } from '../../battle/ffx/aeon-commands.ts';
import { SISTERS_SUMMON_LABEL } from '../../battle/ffx/aeon-duel.ts';
import { BRASKAS_FINAL_AEON_CHAIN_IDS, braskasFinalAeon } from './braskas-final-aeon.ts';
import { type Tactic, aim, row } from './common.ts';

/** Every enemy id the chain fields: the same eleven Chapter III's chain does (the twins carry the ids of the aeons they copy). Registered ahead of Chapter III's, behind `onLastSummoningBoard`. */
export const LAST_SUMMONING_BOSS_IDS: readonly CombatantId[] = BRASKAS_FINAL_AEON_CHAIN_IDS;

/** The three Sisters' possessed bodies: Cindy, who is felled first, and then the order a tie is broken in. */
export const SISTER_BODY_IDS: readonly CombatantId[] = ['possessed-cindy', 'possessed-sandy', 'possessed-mindy'];

/** The motivation at which Yojimbo's second roll can no longer fall below Wakizashi on all (RE section 8.1, point 4). */
export const SURE_WAKIZASHI = 63;

/**
 * The aeons Yuna calls, first choice first (the Summon rows' labels): `[estimate]`, the biggest Overdrive first; Yojimbo last, because he needs a payment and the Sisters need all three gauges. **The Sisters' one Summon row is
 * "Magus Sisters"** (the game's own label, `SISTERS_SUMMON_LABEL`, shared with Chapter XXVII: one row stands for the three), so the list says that.
 */
export const AEON_CALL_ORDER: readonly string[] = ['Bahamut', 'Anima', SISTERS_SUMMON_LABEL, 'Ixion', 'Shiva', 'Ifrit', 'Valefor', 'Yojimbo'];

/** The ability id Combine powers carries (`battle/ffx/aeon-commands.ts#ORDERS`). The line finds the row by this id, not by its label: the menu shows the order under a shorter name (`ui/ffx/aeonRowText.ts`). */
export const COMBINE_ID = 'sister-order-combine';

const living = (engine: BattleEngine, id: CombatantId): FFXCombatant | undefined => {
  const c = engine.state().combatants[id] as FFXCombatant | undefined;
  return c !== undefined && c.side === 'enemy' && c.alive && c.hp > 0 && !c.removed ? c : undefined;
};

/** The Sisters' bodies still standing. */
export function standingSisters(engine: BattleEngine): FFXCombatant[] {
  return SISTER_BODY_IDS.map((id) => living(engine, id)).filter((c): c is FFXCombatant => c !== undefined);
}

/**
 * What Yojimbo should be paid: the smallest power of two whose motivation (`4n + compatibility div 10`, `n = floor(log2 paid) - 2`) is at least {@link SURE_WAKIZASHI}; the largest power of two the purse holds when
 * it cannot reach that; everything it holds below eight gil (where `n` is 0). 0 only for an empty purse (which the game reads as "pay nothing", and he leaves).
 */
export function paymentFor(gil: number, compatibility: number): number {
  const purse = Math.max(0, Math.trunc(gil));
  if (purse === 0) return 0;
  if (purse < 8) return purse;
  const base = Math.floor(compatibility / 10);
  const n = Math.max(0, Math.ceil((SURE_WAKIZASHI - base) / 4));
  const wanted = 2 ** (n + 2);
  if (purse >= wanted) return wanted;
  return 2 ** Math.floor(Math.log2(purse));
}

const flagNumber = (engine: BattleEngine, key: string): number => {
  const v = engine.state().flags[key];
  return typeof v === 'number' ? v : 0;
};

/** The foe an aeon should hit: in the Sisters' fight Cindy while she stands, then the Sister with the least HP ({@link sisterToFell}), else the first enemy standing that is not a Pagoda. */
function foeFor(engine: BattleEngine): FFXCombatant | undefined {
  const sisters = standingSisters(engine);
  if (sisters.length > 0) return sisterToFell(sisters);
  return Object.values(engine.state().combatants).find((c): c is FFXCombatant => c.side === 'enemy' && !c.flags.isPart && c.alive && c.hp > 0 && !c.removed) as FFXCombatant | undefined;
}

function lowestHp(bodies: readonly FFXCombatant[]): FFXCombatant {
  return bodies.reduce((best, c) => (c.hp < best.hp ? c : best));
}

/** The Sister to hit: Cindy while she stands (she mends, drains and calls the Delta Attack), then the one with the least HP left. */
export function sisterToFell(bodies: readonly FFXCombatant[]): FFXCombatant {
  return bodies.find((c) => c.id === 'possessed-cindy') ?? lowestHp(bodies);
}

/** An aeon of the player's on the field, on its own turn. */
function aeonTurn(actorId: CombatantId, commands: AvailableCommand[], engine: BattleEngine): Command | null {
  // Yojimbo: pay (his whole menu is Pay and Dismiss).
  const pay = commands.find((c) => c.enabled && c.command.kind === 'ability' && c.command.id === PAY_ABILITY_ID);
  if (pay !== undefined) {
    const gilSpent = paymentFor(flagNumber(engine, 'yojimbo:gil'), flagNumber(engine, 'yojimbo:compatibility'));
    return { ...pay.command, targets: [], gilSpent } as Command;
  }
  // The Sisters: the Delta Attack when the game's menu offers it, else the one row left.
  const combine = commands.find((c) => c.enabled && c.command.kind === 'ability' && c.command.id === COMBINE_ID);
  if (combine !== undefined) return aim(combine);
  const foe = foeFor(engine);
  const od = commands.find((c) => c.enabled && c.command.kind === 'overdrive' && (foe === undefined || c.validTargets.includes(foe.id)));
  if (od !== undefined) return aim(od, foe?.id);
  // Its Overdrive is spent: hand the field back (the party is parked while an aeon stands). With no way to leave, swing.
  const leave = commands.find((c) => c.enabled && c.command.kind === 'dismiss');
  if (leave !== undefined) return aim(leave);
  const attack = commands.find((c) => c.enabled && c.command.kind === 'attack' && (foe === undefined || c.validTargets.includes(foe.id)));
  void actorId;
  return attack !== undefined ? aim(attack, foe?.id) : null;
}

/** The same command (kind and id) as the one Chapter III's line chose, so its row can say which targets are legal. */
function sameCommand(a: Command, b: Command): boolean {
  const idOf = (c: Command): string | undefined => ('id' in c ? (c as { id?: string }).id : undefined);
  return a.kind === b.kind && idOf(a) === idOf(b);
}

/**
 * In the Sisters' fight, aim a swing Chapter III's line made at one Sister at **Cindy while she stands, then the one with the least HP** instead ({@link sisterToFell}). Anything else, and any fight with fewer than two Sisters
 * standing (where there is nothing to choose), is left as it is.
 */
function refocus(chosen: Command, commands: AvailableCommand[], engine: BattleEngine): Command {
  const sisters = standingSisters(engine);
  if (sisters.length < 2) return chosen;
  const ids = new Set(sisters.map((c) => c.id));
  if (chosen.targets.length !== 1 || !ids.has(chosen.targets[0]!)) return chosen;
  const offered = commands.find((c) => c.enabled && sameCommand(c.command, chosen));
  if (offered === undefined) return chosen;
  const focus = sisterToFell(sisters);
  return offered.validTargets.includes(focus.id) ? aim(offered, focus.id) : chosen;
}

/** A turn Chapter III's line spent on a swing or a Defend: nothing urgent (no revive, no heal, no cure), so Yuna's turn is free for an aeon. */
const isIdle = (c: Command): boolean => c.kind === 'attack' || c.kind === 'defend';

/** The Grand Summon of the aeon on {@link AEON_CALL_ORDER} that is still held, or `null` when the gauge is not full or nothing is held. */
function callAeon(commands: AvailableCommand[]): Command | null {
  const grand = commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.label === 'Grand Summon');
  if (grand === undefined) return null;
  const pick = row(commands, AEON_CALL_ORDER.filter((l) => commands.some((c) => c.label === l && c.command.kind === 'summon')));
  if (pick === undefined || pick.command.kind !== 'summon') return null;
  return { ...grand.command, targets: [], extra: { kind: 'yuna-grand-summon', grandSummon: { aeonId: pick.command.id } } } as Command;
}

export const lastSummoning: Tactic = (actorId, commands, engine) => {
  const state = engine.state();
  const out = state.aeonIds ?? (state.aeonId !== null ? [state.aeonId] : []);
  if (out.includes(actorId)) return aeonTurn(actorId, commands, engine);
  const chosen = braskasFinalAeon === null ? null : braskasFinalAeon(actorId, commands, engine);
  if (chosen === null) return null;
  // 4. Nothing urgent, Yuna holds a full Grand Summon, and the fight is not Yu Yevon's: call an aeon.
  if (actorId === 'yuna' && isIdle(chosen) && living(engine, 'yu-yevon') === undefined) {
    const call = callAeon(commands);
    if (call !== null) return call;
  }
  return refocus(chosen, commands, engine);
};

export default lastSummoning;
