/**
 * **The strategy guide's NEXT line, in-flight aware** (advisor v3, FFX-2 only).
 *
 * Bailey, 2026-09-27: *"if i select mega potion for example and executed that command then it
 * needs to know that the mega potion is in progress so it shouldn't still tell me to mega
 * potion."* The card stopped saying it (`./advisor-v3.ts#repeatsInFlight`), but the guide rail
 * beside it read the chapter's line on the board as it stands, so in the same frame it still
 * said "NEXT Yuna: Mega-Potion -> the party" while Rikku's Mega-Potion charged (adversarial
 * check FM5, docs/handoff/advisor-v3.md). Bailey reads the two panels together.
 *
 * The rule is the card's, read without an engine or registries (the panel has neither; the
 * targeting comes off the always-loaded data tables, `./targetLabel.ts#targetingFor`): the
 * line's pick is dropped from NEXT when another active girl already has **the same support move**
 * on her charge bar **or held by the engine for a chain lock** (`FFX2Engine.heldCommand()`, handed
 * in by the caller exactly as the card gets it; the second check, C2-B1, measured 38 of 686 held
 * decisions where the rail named the held move), aimed at the same ally or at the party. The panel then shows no NEXT line
 * rather than new words (a line such as "Mega-Potion on the way" needs options first, rule 9).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: only FFX-2's ATB opens a menu while another
 * command charges [research/ffx2-combat-core.md §1.1]; FFX's CTB resolves a command before the
 * next turn, so {@link inFlight} is empty on every FFX board and this is always false there.
 * Behind `ADVISOR_V3`, like the rest of v3.
 */

import type { AbilityDef, BattleState, CombatantId, Command, GameId, ItemDef } from '../../battle/common/types.ts';
import { ABILITIES as FFX2_ABILITIES, ITEMS as FFX2_ITEMS } from '../../data/ffx2/index.ts';
import type { QueuedCommand } from './advisor-committed.ts';
export type { QueuedCommand };
import { inFlight } from './advisor-inflight.ts';
import { ADVISOR_V3 } from './advisor-v3.ts';
import { targetingFor } from './targetLabel.ts';

const idOf = (c: Command): string => ('id' in c ? String((c as { id?: unknown }).id ?? '') : '');
const aimOf = (c: Command): string => (c.targets as readonly CombatantId[]).join(',');

/** True when `command` repeats a support move another girl already has charging or held (see the note). */
export function chosenAlready(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  command: Command,
  held: readonly QueuedCommand[] = [],
  enabled: boolean = ADVISOR_V3,
): boolean {
  if (!enabled || state.game !== 'ffx2') return false;
  if (command.kind !== 'item' && command.kind !== 'ability') return false;
  const targeting = targetingFor(state.game, command);
  if (targeting === undefined || targeting.includes('enem') || targeting === 'all') return false;
  const aimed = command.targets as readonly CombatantId[];
  if (aimed.some((t) => state.combatants[t]?.side === 'enemy')) return false;
  const id = idOf(command);
  return inFlight(state, actorId, held).some(
    (p) => p.command.kind === command.kind && idOf(p.command) === id &&
      (targeting === 'all-allies' || aimOf(p.command) === aimOf(command)),
  );
}

/** True for a move that puts HP back (Cura, Pray, a Potion): the `heals` flag on a formula that yields HP, not CTB/Haste. */
function restoresHp(game: GameId, command: Command): boolean {
  if (game !== 'ffx2' || (command.kind !== 'item' && command.kind !== 'ability')) return false;
  const abilities: Record<string, AbilityDef> = FFX2_ABILITIES;
  const items: Record<string, ItemDef> = FFX2_ITEMS;
  let def: AbilityDef | undefined;
  if (command.kind === 'ability') def = abilities[command.id];
  else {
    const effect = items[command.id]?.effect;
    def = typeof effect === 'string' ? abilities[effect] : effect;
  }
  return !!def && def.flags.includes('heals') && def.formula !== 'ctb' && def.formula !== 'none' && def.formula !== 'multiple';
}

/**
 * PR-0239 (FFX-2 only, the rail is shared with the card): the line's pick is a heal while another
 * girl already has a heal on her charge bar (or held) that covers the party or the same ally. The
 * card ranks on the board after that heal lands (`./advisor-inflight.ts#projectBoard`), so it may
 * say something else (Pray while Mega-Potion charges); the rail reads the board as it stands and
 * would name a Cura for HP the charging Mega-Potion is about to give. Like {@link chosenAlready}
 * the rail defers (no NEXT) rather than print a line the card contradicts; the reason is FFX-2's
 * ATB opening a menu while a command charges [research/ffx2-combat-core.md 1.1].
 */
export function healInbound(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  command: Command,
  held: readonly QueuedCommand[] = [],
  enabled: boolean = ADVISOR_V3,
): boolean {
  if (!enabled || state.game !== 'ffx2' || !restoresHp(state.game, command)) return false;
  return inFlight(state, actorId, held).some(
    (p) => restoresHp(state.game, p.command) &&
      (targetingFor(state.game, p.command) === 'all-allies' || aimOf(p.command) === aimOf(command)),
  );
}
