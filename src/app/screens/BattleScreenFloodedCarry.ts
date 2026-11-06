/**
 * **What the Via Purifico's area chain carries across a seam beyond the ordinary chain carry** (FFX only; the hidden Flooded Ways chapter, number 36; `research/re-ffx-geosgaeno-evrae-altana.md` 4.3):
 *
 * - **The boss's HP** (`EnemyGroupDef.carriesBossHp`): Evrae Altana's HP rides a persistent script variable from area to area in the game (the formation's battle-end handler stores it when the area ended by the locks),
 *   so each area opens with the HP the last one left it. {@link carriedEnemyGroup} writes the previous link's live HP into the first enemy's starting HP when the chain re-inits.
 * - **The shattered members** (`EnemyGroupDef.returnsShattered`): a member the water broke (Eject) stands again in the next area ({@link returnShattered}: 1 HP, the driver's call; the files give no number). A member who was
 *   only knocked out stays knocked out, as in every chain.
 * - **A spent link is skipped** ({@link skipSpentLinks}): if the boss fell in an earlier area its cell holds 0 and no further area comes (RE 4.3).
 *
 * Pure: data in, data out. `app/screens/BattleScreenSetup.ts#setupForNextLink` and `BattleEncounterChain.ts` call these; a group without the flags comes back untouched, so no other chain changes.
 */

import type { BattleState, EnemyGroupDef, FFXCombatant, FFX2PartyBuild, FFXPartyBuild } from '../../battle/common/types.ts';

/** The next link with the boss at the HP the last link left it (`carriesBossHp`); the group itself when it does not say so or the boss is not in the last link's state. */
export function carriedEnemyGroup(next: EnemyGroupDef, state: BattleState): EnemyGroupDef {
  if (next.carriesBossHp !== true) return next;
  const boss = next.enemies[0];
  const live = boss === undefined ? undefined : (state.combatants[boss.id] as FFXCombatant | undefined);
  if (boss === undefined || live === undefined) return next;
  const hp = Math.min(boss.stats.maxHp, Math.max(0, live.hp));
  return { ...next, enemies: [{ ...boss, hp }, ...next.enemies.slice(1)] };
}

/** The members the last link shattered come back on their feet with 1 HP (`returnsShattered`). */
export function returnShattered<T extends FFXPartyBuild | FFX2PartyBuild>(party: T, state: BattleState, next: EnemyGroupDef): T {
  if (next.returnsShattered !== true || party.game !== 'ffx') return party;
  const build = party as FFXPartyBuild;
  const members = build.members.map((m) => {
    const live = state.combatants[m.id] as FFXCombatant | undefined;
    const shattered = live !== undefined && live.statuses['eject'] !== undefined && live.hp <= 0;
    return shattered ? { ...m, hp: Math.max(1, m.hp) } : m;
  });
  return { ...build, members } as T;
}

/**
 * Skip the links whose carried boss is already dead (`carriesBossHp`): the chain goes on from the first link after them. `skipped` is how many it passed over, so the chain can count them as passed (they are formations
 * of the chain even though they were never fought): the pause screen's "battle n of m", the objectives' `link-reached` rule, the seeds and a retry checkpoint all read the chain position, not the number of fights played.
 */
export async function skipSpentLinksCounted(
  group: EnemyGroupDef,
  state: BattleState,
  find: (id: string) => Promise<EnemyGroupDef | null>,
): Promise<{ group: EnemyGroupDef; skipped: number }> {
  let current = group;
  let skipped = 0;
  for (let guard = 0; guard < 8 && current.carriesBossHp === true && current.nextGroupId !== undefined; guard++) {
    const boss = current.enemies[0];
    const live = boss === undefined ? undefined : (state.combatants[boss.id] as FFXCombatant | undefined);
    if (live === undefined || live.hp > 0) break;
    const next = await find(current.nextGroupId);
    if (next === null) break;
    current = next;
    skipped++;
  }
  return { group: current, skipped };
}

/** The group the chain goes on with after the skip (see {@link skipSpentLinksCounted}, which also counts the links passed over). */
export async function skipSpentLinks(
  group: EnemyGroupDef,
  state: BattleState,
  find: (id: string) => Promise<EnemyGroupDef | null>,
): Promise<EnemyGroupDef> {
  return (await skipSpentLinksCounted(group, state, find)).group;
}
