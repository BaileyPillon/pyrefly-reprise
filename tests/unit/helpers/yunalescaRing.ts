/**
 * Chapter 2, Yunalesca: where her Form III cycle stands (measurement tooling for the RC6 ladder, not game code), read off what she has
 * already done in this fight (FFX only; the FFX-2 and FF7 engines never import this file).
 *
 * With no aeon on the field her Form III turns run a fixed ring: two ordinary turns (a Cura-family heal or
 * Regen, or Hellbiter), Mind Blast, one more ordinary turn, then **Mega Death**, and round again; an aeon on the
 * field does not advance the ring, it only pauses it where it stands (`research/re-ffx-ai-yunalesca-bfa.md` 2.7;
 * `research/ffx-yunalesca.md` 5.3, 10.6). What the player sees is the same thing: Mega Death comes two of her turns
 * after Mind Blast. This reads it from the battle log - her turns, her Mind Blast, her last Mega Death and the
 * summons - and never from the script's own counter, so a line that uses it knows nothing the screen did not show.
 *
 * The turn the form begins on is her scripted entry (Metamorphosis, then Mega Death) and is not part of the ring.
 */

import type { BattleEvent, CombatantId } from '../../../src/battle/common/types.ts';

/** Ordinary turns between one Mega Death and the next: the fifth is the Mega Death. */
const RING = 5;

export interface Ring {
  /** Her form (0, 1 or 2) when the log ended. */
  form: number;
  /** An aeon is on the field: the ring is paused where it stands. */
  aeonOut: boolean;
  /** Her ordinary turns taken since the form began or since her last Mega Death (0 to 4). */
  turns: number;
  /** Her next ordinary turn is Mega Death (Form III only; false while an aeon is out, the ring is paused). */
  megaDeathNext: boolean;
  /** Her ordinary turns left before the Mega Death that is due (0 = her next turn); null outside Form III. */
  megaDeathIn: number | null;
}

/** Read the ring off the log. `bossId` is her combatant id. */
export function readRing(log: readonly BattleEvent[], bossId: CombatantId): Ring {
  let form = 0;
  let aeonOut = false;
  let turns = 0;
  // After a form change her first turn is the scripted entry; it is not a ring step.
  let entry = false;
  let turnOpen = false;
  for (const e of log) {
    switch (e.type) {
      case 'form-change':
        if (e.enemyId === bossId) {
          form = e.formIndex;
          turns = 0;
          entry = true;
          turnOpen = false;
        }
        break;
      case 'summon':
        aeonOut = true;
        break;
      case 'dismiss':
        aeonOut = false;
        break;
      case 'turn-start':
        turnOpen = false;
        if (e.actorId === bossId) {
          if (entry) entry = false;
          else if (!aeonOut) turnOpen = true;
        }
        break;
      case 'action-start':
        if (turnOpen && e.actorId === bossId) {
          turnOpen = false;
          turns = e.abilityName === 'Mega Death' ? 0 : (turns + 1) % RING;
        }
        break;
      default:
        break;
    }
  }
  const inThree = form === 2;
  return {
    form,
    aeonOut,
    turns,
    megaDeathNext: inThree && !aeonOut && turns === RING - 1,
    megaDeathIn: inThree ? RING - 1 - turns : null,
  };
}
