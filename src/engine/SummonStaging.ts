/**
 * PR-0181: the summoned aeon replaces the whole party on the field.
 *
 * `research/ffx-combat-core.md` §6.1 `[verified: 2 sources]`: "The summoned
 * aeon replaces the entire active party; the party members are removed from
 * the field", and dismissal or the aeon's KO "returns the party". The engine
 * already does it (`battle/ffx/aeons.ts` freezeParty / thawParty, every exit
 * emitting `dismiss`); the stage kept the three figures standing in front of
 * the aeon, so Bahamut read at party height behind Tidus and Yuna (rounds 12
 * and 13). Method check `docs/plans/pr-0181-method-check.md`: restored canon,
 * no new look.
 *
 * The party is faded out, not removed, so it comes back on its own slots with
 * its own poses; the aeon stays on the middle slot the engine gives it.
 *
 * GAME-AWARE (AGENTS.md rule 14): **FFX only** (FFX-2 has no summons). No
 * `three`, no DOM: ports only (AGENTS.md rule 1).
 */
import type { CombatantId } from '../battle/common/types.ts';
import type { BattleStage } from './BattlePresenterPorts.ts';

/** The party's fade, in step with the aeon's own 620 ms arrival. */
export const PARTY_SWAP_MS = 620;

/** The staged party figures (not the aeon, not the enemies). */
export function partyOnStage(stage: BattleStage, except?: CombatantId): CombatantId[] {
  return stage.staged().filter((id) => id !== except && stage.sideOf(id) === 'party');
}

/** Who is held off the field on each stage, so no other fade (the target x-ray) brings them back. */
const held = new WeakMap<object, Set<CombatantId>>();

/** The figures a summon has taken off `stage`'s field (empty when no aeon is out). */
export function heldOffStage(stage: object): ReadonlySet<CombatantId> {
  return held.get(stage) ?? new Set();
}

/** Fade the party off the field as the aeon arrives. Resolves when the fades do. */
export async function partyOffStage(stage: BattleStage, aeonId: CombatantId, ms = PARTY_SWAP_MS): Promise<void> {
  const ids = partyOnStage(stage, aeonId);
  held.set(stage, new Set(ids));
  await Promise.all(ids.map((id) => stage.actor(id)?.fadeTo(0, ms)));
}

/** Bring the party back once the aeon has gone (command, KO or Banish). */
export async function partyBack(stage: BattleStage, ms = PARTY_SWAP_MS): Promise<void> {
  held.delete(stage);
  await Promise.all(partyOnStage(stage).map((id) => stage.actor(id)?.fadeTo(1, ms)));
}
