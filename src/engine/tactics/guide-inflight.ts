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
 * on her charge bar, aimed at the same ally or at the party. The panel then shows no NEXT line
 * rather than new words (a line such as "Mega-Potion on the way" needs options first, rule 9).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: only FFX-2's ATB opens a menu while another
 * command charges [research/ffx2-combat-core.md §1.1]; FFX's CTB resolves a command before the
 * next turn, so {@link inFlight} is empty on every FFX board and this is always false there.
 * Behind `ADVISOR_V3`, like the rest of v3.
 */

import type { BattleState, CombatantId, Command } from '../../battle/common/types.ts';
import { inFlight } from './advisor-inflight.ts';
import { ADVISOR_V3 } from './advisor-v3.ts';
import { targetingFor } from './targetLabel.ts';

const idOf = (c: Command): string => ('id' in c ? String((c as { id?: unknown }).id ?? '') : '');
const aimOf = (c: Command): string => (c.targets as readonly CombatantId[]).join(',');

/** True when `command` repeats a support move another girl already has charging (see the note). */
export function chosenAlready(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  command: Command,
  enabled: boolean = ADVISOR_V3,
): boolean {
  if (!enabled || state.game !== 'ffx2') return false;
  if (command.kind !== 'item' && command.kind !== 'ability') return false;
  const targeting = targetingFor(state.game, command);
  if (targeting === undefined || targeting.includes('enem') || targeting === 'all') return false;
  const aimed = command.targets as readonly CombatantId[];
  if (aimed.some((t) => state.combatants[t]?.side === 'enemy')) return false;
  const id = idOf(command);
  return inFlight(state, actorId, []).some(
    (p) => p.command.kind === command.kind && idOf(p.command) === id &&
      (targeting === 'all-allies' || aimOf(p.command) === aimOf(command)),
  );
}
