/**
 * **The possessed aeons' own lock** (re-parity RC10, lane "FFX script command locks"; **FFX only**; numbers only; `docs/handoff/re-parity-rc10-ffx-script-command-locks.md`).
 *
 * Each possessed copy's init hook (the monster files m163 to m169 and m178 to m180, read from the install's own files) makes one call,
 * `setCommandDisabled(1, <the aeon's id>, 0)` (script call 0x703B, handler 0x007A6EF0): an id below 0x1000 is the setter's other branch (0x0079B470), which writes the flag
 * into the availability byte of that aeon's own character, and the summon menu's gate (0x0079A080, `aeonUnavailable` in `battle/ffx/kernel/aeon-party.ts`) reads the byte: 0 and the aeon
 * cannot be summoned. So the copy takes its own aeon away from Yuna for the whole battle. The ids below are the ones the ten scripts pass (the raw scan is
 * `tests/fixtures/parity/ffx/monster_command_disables.json`); they are the game's aeon slots (`battle/ffx/adapt/slots.ts#AEON_SLOT`), which the test pins to the same numbers.
 *
 * The same file carries the field event's half (re-parity RC11, lane "FFX Chapter III roster"; `docs/handoff/re-parity-rc11-ffx-ch3-roster.md`): `sins0700` removes the chosen aeon from the party before its link, so {@link possessedRosterKeys}
 * names the roster keys that go with a link (`EnemyGroupDef.rosterRemoved`, read by `battle/ffx/roster-removal.ts` only while `CH3_ROSTER_REMOVAL` is on, off).
 *
 * Read by `battle/ffx/formation-commands.ts` only while the switch `SCRIPT_COMMAND_DISABLES` is on (it is off). Chapter III's five links carry it
 * (`braskas-final-aeon.ts#possessedAeonBattle`); the hidden Last Summoning builds its groups on its own and models the same lock with `lockedAeons` ("Taken by Yu Yevon"), so it carries none of this.
 */

import type { FormationCommandOff } from '../../../battle/common/types.ts';

/** The aeon id each possessed copy's script passes (`setCommandDisabled(1, id, 0)`): its own aeon. */
export const POSSESSED_SCRIPT_LOCK_ID: Readonly<Record<string, number>> = {
  'possessed-valefor': 8, // m163
  'possessed-ifrit': 9, // m164
  'possessed-ixion': 10, // m165
  'possessed-shiva': 11, // m166
  'possessed-bahamut': 12, // m167
  'possessed-anima': 13, // m168
  'possessed-yojimbo': 14, // m169
  'possessed-cindy': 15, // m178
  'possessed-sandy': 16, // m179
  'possessed-mindy': 17, // m180
};

/** The group field for one possessed copy's battle: its script's one call (who is the script's actor 1, Yuna). `undefined` for any other id. */
export function possessedScriptDisables(possessedId: string): readonly FormationCommandOff[] | undefined {
  const command = POSSESSED_SCRIPT_LOCK_ID[possessedId];
  return command === undefined ? undefined : [{ who: 'yuna', command }];
}

/**
 * The roster keys the field event removes from the party when it launches this possessed body's link (`sins0700`, call 0xCB removePartyMember, before the battle): the aeon's own, and for a Magus Sister all three
 * Sisters together (the event removes Sandy and Mindy with the choice of Cindy). `[]` for any other id.
 */
export function possessedRosterKeys(possessedId: string): readonly string[] {
  if (POSSESSED_SCRIPT_LOCK_ID[possessedId] === undefined) return [];
  if (possessedId === 'possessed-cindy' || possessedId === 'possessed-sandy' || possessedId === 'possessed-mindy') return ['cindy', 'sandy', 'mindy'];
  return [possessedId.replace('possessed-', '')];
}
