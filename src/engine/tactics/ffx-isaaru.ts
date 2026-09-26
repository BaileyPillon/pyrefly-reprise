/**
 * Chapter XIV — Isaaru's contest of aeons, the last chamber of the Via Purifico: the line the
 * sources' clears use [research/ffx-isaaru-bevelle.md §5, §6.3].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. CTB, Yuna's aeons, Summon, Grand Summon, Shield
 * and the enemy aeons' Overdrive gauges; in FFX-2 Isaaru is a tour guide and nobody summons
 * (§0.3). Registered under the FFX game in `./lookup.ts`, so an FFX-2 board never reaches it
 * (FFX-2's `x2-*` aeons are other ids in any case).
 *
 * ## The line, and where each rule comes from
 *
 * It is the **intended** line of `tests/unit/chapters/isaaru-tactic-bench.test.ts`
 * (`docs/plans/isaaru-bench.md`), written as a tactic. It only picks among the rows the engine
 * offers (the duel greys the mirror aeon, the KO'd aeons and every non-aeon command), and returns
 * `null` (the generic ladder) when none of his three aeons is standing.
 *
 * **Yuna** summons, in the sources' order for each link, the first aeon the menu offers:
 * - Grothia: **Shiva** first (wiki + GameFAQs, `[verified: 2 sources]`), then Valefor ("his
 *   attack often misses her"), Ixion, Bahamut last ("save Bahamut for later").
 * - Pterya: **Bahamut** first, to take her hits and fill his gauge (`[verified: 2 sources]`),
 *   then Ixion (Jegged), Shiva, Ifrit.
 * - Spathi: **Ifrit or Ixion "with a full gauge"** (wiki), so the fuller of the two first, then
 *   the other, then Shiva (Jegged), Valefor last ("any aeon but Valefor", GameFAQs).
 *
 * Her first summon is a **Grand Summon** while her gauge is full (B5: she arrives full; Jegged
 * "fully charge" it), so the first aeon arrives with its Overdrive ready.
 *
 * **The aeon on the field:**
 * 1. **Shield** when his big move lands before this aeon acts again (§5.3, `[verified: 3
 *    sources]`: Shield quarters Hellfire and Mega Flare). "Before it acts again" is read off the
 *    CTB order the player sees (`predictTurnOrder`, the HUD's turn list), as GameFAQs' "Shield if
 *    Hellfire is coming next" and "Shield when the count reads 1" say it:
 *    - Grothia fires Hellfire when his gauge is full (§4.1): an action aimed at him adds 3, each
 *      of his attacks 5 (§4.1, the wiki's rates);
 *    - Spathi fires Mega Flare on the turn after his count reaches 0 (§4.3).
 *    Pterya's Energy Ray (DC 26) is not shielded: Bahamut tanks her, and a Shield would cost
 *    him the gauge he is there to fill (§6.3).
 * 2. **Its Overdrive** at his aeon when the gauge is full (§5.4: one Overdrive is worth three to
 *    eight turns).
 * 3. Otherwise **Attack** his aeon.
 *
 * **Rows the shipped build does not carry** (Chapter X's aeon rows: no NulBlaze, no Blizzara, no
 * Thundara) are used only when a build offers them, the Trema kit precedent: NulBlaze before
 * Hellfire instead of Shield (the wiki's "NulBlaze vs Hellfire" on Shiva), and Shiva's Blizzara /
 * Ixion's Thundara to heal themselves under half HP (Jegged) or else at his aeon (§5.4). The bench
 * measures those builds as options for Bailey; the shipped chapter never meets these branches.
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId, FFXCombatant } from '../../battle/common/types.ts';
import type { Tactic } from './common.ts';

/** His three aeons, one a link, in chain order (`src/data/ffx/enemies/isaaru.ts`). */
export const ISAARU_CHAPTER_BOSS_IDS: readonly CombatantId[] = ['grothia', 'pterya', 'spathi'];

/** `state.flags` key of Spathi's count, mirrored from `src/battle/ffx/ai/isaaru-rules.ts` (`SPATHI_COUNT_FLAG`). */
const SPATHI_COUNT_FLAG = 'isaaru.count';
/** §4.3 [verified: 2 sources]: the count starts at 5 (mirrors `SPATHI_COUNT_START`). */
const SPATHI_COUNT_START = 5;
/** §4.1, the wiki's rates (mirrors `GROTHIA_GAUGE_PER_TARGETING` / `_PER_ATTACK`). */
const GROTHIA_PER_TARGETING = 3;
const GROTHIA_PER_ATTACK = 5;
const GAUGE_FULL = 100;

/** Yuna's order per link (see the header), and the two reading choices the bench compares. */
export interface IsaaruLine {
  order: Readonly<Record<string, readonly string[]>>;
  /** Link 3: put the fuller of Ifrit and Ixion first (the wiki's "with a full gauge"). */
  spathiFullerFirst: boolean;
  /** Read the CTB order for Shield (`true`), or shield only at the last count / a full gauge (`false`). */
  forecastShield: boolean;
}

export const ISAARU_INTENDED_LINE: IsaaruLine = {
  order: {
    grothia: ['shiva', 'valefor', 'ixion', 'bahamut'],
    pterya: ['bahamut', 'ixion', 'shiva', 'ifrit'],
    spathi: ['ixion', 'ifrit', 'shiva', 'valefor'],
  },
  spathiFullerFirst: true,
  forecastShield: true,
};

type FFXEngineLike = BattleEngine & { predictTurnOrder?: (n: number, preview?: Command) => { actorId: CombatantId }[] };

/** How many turns `foe` takes before `me` acts again, if `me` Shields now (FFX's CTB forecast). */
function foeTurnsFirst(engine: BattleEngine, me: CombatantId, foe: CombatantId): number {
  const ffx = engine as FFXEngineLike;
  if (typeof ffx.predictTurnOrder !== 'function') return 1;
  const order = ffx.predictTurnOrder(16, { kind: 'ability', id: 'shield', targets: [me] });
  let n = 0;
  for (let i = 1; i < order.length; i++) {
    const id = order[i]!.actorId;
    if (id === me) break;
    if (id === foe) n++;
  }
  return n;
}

function gaugeOf(c: AnyCombatant | undefined): number {
  return (c as FFXCombatant | undefined)?.overdrive?.gauge ?? 0;
}

/** True when his big move lands before `me` acts again. */
function bigMoveDue(line: IsaaruLine, engine: BattleEngine, me: CombatantId, foe: AnyCombatant): boolean {
  const state = engine.state();
  const raw = state.flags[SPATHI_COUNT_FLAG];
  const count = typeof raw === 'number' ? raw : SPATHI_COUNT_START;
  const gauge = gaugeOf(foe);
  if (!line.forecastShield) {
    if (foe.id === 'spathi') return count === 0;
    if (foe.id === 'grothia') return gauge + GROTHIA_PER_TARGETING >= GAUGE_FULL;
    return false;
  }
  const n = foeTurnsFirst(engine, me, foe.id);
  if (n === 0) return false;
  if (foe.id === 'spathi') return n >= count + 1;
  if (foe.id === 'grothia') {
    return gauge + GROTHIA_PER_TARGETING >= GAUGE_FULL || (n >= 2 && gauge + GROTHIA_PER_TARGETING + GROTHIA_PER_ATTACK >= GAUGE_FULL);
  }
  return false;
}

function offered(commands: AvailableCommand[], kind: string, id?: string): AvailableCommand | undefined {
  return commands.find(
    (c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && (c.command as { id: string }).id === id)),
  );
}

/**
 * Spells the aeon heals itself with, when its row carries them (the shipped build's rows do not:
 * Chapter X's aeons). Shiva absorbs Ice and Ixion Lightning (§2.3's Eater note); Jegged heals Shiva
 * with Blizzara and Ixion with Thundara (§6.3, `[single source]`).
 */
const SELF_HEAL: Readonly<Record<string, string>> = { shiva: 'blizzara', ixion: 'thundara' };
const SELF_HEAL_UNDER = 0.5;

function aeonTurn(line: IsaaruLine, engine: BattleEngine, me: CombatantId, commands: AvailableCommand[], foe: AnyCombatant): Command | null {
  const self = engine.state().combatants[me];
  const due = bigMoveDue(line, engine, me, foe);
  // NulBlaze cancels Hellfire (§2.3 table, the wiki's "NulBlaze vs Hellfire" on Shiva); only a row the build carries.
  const nulBlazed = !!self && (self.statuses as Record<string, unknown>)['nulblaze'] !== undefined;
  if (due && foe.id === 'grothia') {
    const nul = nulBlazed ? undefined : offered(commands, 'ability', 'nulblaze');
    if (nul && nul.validTargets.includes(me)) return { ...nul.command, targets: [me] } as Command;
  }
  const shield = offered(commands, 'ability', 'shield');
  if (shield && due && !(foe.id === 'grothia' && nulBlazed)) return { ...shield.command, targets: [me] } as Command;
  const heal = SELF_HEAL[me] ? offered(commands, 'ability', SELF_HEAL[me]) : undefined;
  if (heal && self && self.hp < self.stats.maxHp * SELF_HEAL_UNDER && heal.validTargets.includes(me)) {
    return { ...heal.command, targets: [me] } as Command;
  }
  const od = offered(commands, 'overdrive');
  if (od) return { ...od.command, targets: od.validTargets.includes(foe.id) ? [foe.id] : [] } as Command;
  // The same spell at his aeon: tier-2 magic out-hits these aeons' Attacks (§5.4: Shiva 1,573 against 449).
  if (heal && heal.validTargets.includes(foe.id)) return { ...heal.command, targets: [foe.id] } as Command;
  const attack = offered(commands, 'attack');
  return attack && attack.validTargets.includes(foe.id) ? ({ ...attack.command, targets: [foe.id] } as Command) : null;
}

function yunaOrder(line: IsaaruLine, engine: BattleEngine, foe: AnyCombatant): readonly string[] {
  const base = line.order[foe.id] ?? [];
  if (foe.id !== 'spathi' || !line.spathiFullerFirst) return base;
  const state = engine.state();
  const [a, b] = ['ifrit', 'ixion'].sort((x, y) => gaugeOf(state.combatants[y]) - gaugeOf(state.combatants[x]));
  return [a!, b!, ...base.filter((id) => id !== 'ifrit' && id !== 'ixion')];
}

function yunaTurn(line: IsaaruLine, engine: BattleEngine, commands: AvailableCommand[], foe: AnyCombatant): Command | null {
  const grand = offered(commands, 'overdrive', 'grand-summon');
  for (const id of yunaOrder(line, engine, foe)) {
    const summon = offered(commands, 'summon', id);
    if (!summon) continue;
    if (grand) {
      return { ...grand.command, targets: [], extra: { kind: 'yuna-grand-summon', grandSummon: { aeonId: id } } } as Command;
    }
    return { ...summon.command, targets: [] } as Command;
  }
  return null;
}

/** The tactic for one line (the bench measures variants; the chapter ships {@link ISAARU_INTENDED_LINE}). */
export function isaaruTactic(line: IsaaruLine = ISAARU_INTENDED_LINE): Tactic {
  return (actorId, commands, engine) => {
    const state = engine.state();
    const foe = ISAARU_CHAPTER_BOSS_IDS.map((id) => state.combatants[id]).find(
      (c): c is AnyCombatant => !!c && c.side === 'enemy' && c.alive,
    );
    if (!foe) return null;
    if (state.aeonId === actorId) return aeonTurn(line, engine, actorId, commands, foe);
    if (actorId === 'yuna') return yunaTurn(line, engine, commands, foe);
    return null;
  };
}

export const isaaruViaPurifico: Tactic = isaaruTactic();

export default isaaruViaPurifico;
