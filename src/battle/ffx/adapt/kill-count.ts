/**
 * **The two target fields formula 0x16 reads** (FFX only; the hidden Gauntlet chapter's Don Tonberry, 2026-11-09): the target's actor number and its save counter, the game's per-character **kill count**
 * (`research/re-ffx-damage.md` formula 22: `kills x power` for an actor number below 0x12, else the fallback; `kernel/damage.ts` case 0x16). Karma is the only row that has the formula
 * (`data/ffx/enemies/gauntlet-abilities.ts`), so no other ability reads either field.
 *
 * Until this module the adapter fed the kernel `id: 0xff, saveCounter: 0` for every target, which is what it still feeds **every target that carries no kill count**: a combatant has one only when its
 * build says so (`FFXMemberBuild.kills`, set by the Gauntlet's party and by nothing else), so every other battle's input is the same bytes as before.
 */

import type { FFXCombatant } from '../../common/types.ts';

/** The game's actor numbers of the party (0 to 6): below 0x12, which is what formula 0x16 tests. Aeons and everyone else keep 0xff (they have no kill counter in our builds). */
const PARTY_ACTOR_NUMBER: Readonly<Record<string, number>> = { tidus: 0, yuna: 1, auron: 2, kimahri: 3, wakka: 4, lulu: 5, rikku: 6 };

/** What `hitInputOf` puts in the target's `id` and `saveCounter`: the party member's number and kill count when the combatant has one, else the old constants. */
export function killCountInput(target: FFXCombatant): { id: number; saveCounter: number } {
  if (target.kills === undefined) return { id: 0xff, saveCounter: 0 };
  return { id: PARTY_ACTOR_NUMBER[target.id] ?? 0xff, saveCounter: target.kills };
}
