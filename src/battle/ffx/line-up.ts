/**
 * **A link that changes the line-up** (`EnemyGroupDef.lineUp`; **FFX only**). The hidden Sinspawn Gui chapter's second fight is the first user (`research/re-ffx-ai-gui.md` section 2.1).
 *
 * The party build is the chapter's: the one the player prepared and the earlier links fought with. The link's formation then does what the game's field event does. The members who join (a
 * guest, `FFXGuestSpec`) are added to the roster, the opening three are forced, and with `noSwitch` everyone else leaves the field for good (the forced trio has no bench).
 *
 * Two entry points read the same rule so they cannot disagree: {@link applyLinkLineUp} (the engine, on its own copy when a battle is built) and {@link partyForLink} (a pure view, for the
 * app's hopeless-entry test in `app/screens/BattleChainCheckpoint.ts`, which must count the three who really stand in the fight and not the six who are not in it).
 */

import type { EnemyGroupDef, FFXPartyBuild } from '../common/types.ts';

/** The party a link fights with: `party` unchanged without a `lineUp`, else a copy whose roster, opening three and bench are the link's. Pure. */
export function partyForLink(party: FFXPartyBuild, lineUp: EnemyGroupDef['lineUp']): FFXPartyBuild {
  if (!lineUp) return party;
  const joins = lineUp.joins ?? [];
  let members = [...party.members.filter((m) => !joins.some((j) => j.id === m.id)), ...joins];
  if (lineUp.noSwitch === true) members = members.filter((m) => lineUp.activeSlots.includes(m.id));
  return { ...party, members, activeSlots: lineUp.activeSlots, reserve: members.map((m) => m.id).filter((id) => !lineUp.activeSlots.includes(id)) };
}

/** Apply a link's line-up to the battle's own copy of the party (mutates `party`). */
export function applyLinkLineUp(party: FFXPartyBuild, group: { lineUp?: EnemyGroupDef['lineUp'] }): void {
  const linked = partyForLink(party, group.lineUp);
  party.members = linked.members;
  party.activeSlots = linked.activeSlots;
  party.reserve = linked.reserve;
}

/**
 * **A retry that opens with the Save Sphere's rule** (`EnemyGroupDef.restoresPartyOnEntry`, set on a retry's setup by `app/screens/BattleChainCheckpoint.ts#resumeSetup` when the entry was
 * hopeless; FFX-2's engine has had this since Chapter XI): every member is on his feet at full HP and MP with no status. Mutates the battle's own copy.
 */
export function restorePartyOnEntry(party: FFXPartyBuild): void {
  for (const m of party.members) {
    m.hp = m.stats.maxHp;
    m.mp = m.stats.maxMp;
    delete m.statuses;
  }
}
