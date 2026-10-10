/**
 * The game's character slots, for the engine's combatants (re-parity W2; **FFX only**).
 *
 * The CTB and status kernels are keyed by the battle character array the exe keeps: ids 0 to 7 are the party in the
 * game's order, 8 to 0x11 the ten aeon slots, 0x14 to 0x1b the eight monster slots (`research/re-ffx-ctb-status.md`
 * section 0). The id picks the random stream (a party member's own, every aeon's shared one, a monster's `id + 8`), the
 * order of the opening draws, the tie-break at equal CTB and whether a character counts as a monster. The engine keeps
 * its combatants by string id and a formation list; this module is the one place that maps one to the other.
 *
 * - Party: Tidus 0, Yuna 1, Auron 2, Kimahri 3, Wakka 4, Lulu 5, Rikku 6, and Seymour 7: the game's eighth party slot, whose
 *   one user in our chapters is the hidden Sinspawn Gui chapter's guest hour (his row of the party table is actor 7,
 *   `research/re-ffx-ai-gui.md` section 5.7).
 * - Aeons, in the game's order: Valefor 8, Ifrit 9, Ixion 0xa, Shiva 0xb, Bahamut 0xc, Anima 0xd, Yojimbo 0xe, and the
 *   three Magus Sisters Cindy 0xf, Sandy 0x10, Mindy 0x11 (the death handler of the exe names 0xf to 0x11 as the sisters).
 * - Monsters: `0x14 + the index in the formation` (`BattleState.enemyIds`, which lists the enemies and then the parts).
 *   The formation order is taken to be the game's monster slot order; it decides ties between enemies only.
 *
 * A combatant with no slot (an id this table does not know, a ninth enemy) is an ERROR: nothing is guessed.
 */

import type { CombatantId, FFXCombatant } from '../../common/types.ts';
import type { Ctx } from '../state.ts';

/** Slots of the party, by engine id. */
export const PARTY_SLOT: Readonly<Record<string, number>> = {
  tidus: 0,
  yuna: 1,
  auron: 2,
  kimahri: 3,
  wakka: 4,
  lulu: 5,
  rikku: 6,
  seymour: 7, // the guest of the hidden Sinspawn Gui chapter (FFX only): the game's party actor 7
};

/** Slots of the aeons, by engine id. */
export const AEON_SLOT: Readonly<Record<string, number>> = {
  valefor: 8,
  ifrit: 9,
  ixion: 10,
  shiva: 11,
  bahamut: 12,
  anima: 13,
  yojimbo: 14,
  cindy: 15,
  sandy: 16,
  mindy: 17,
};

/** The first monster slot and how many there are. */
export const MONSTER_SLOT_FIRST = 0x14;
export const MONSTER_SLOT_COUNT = 8;
/** The number of slots the exe walks. */
export const SLOT_COUNT = 31;

/** The game slot of a combatant. */
export function slotOf(ctx: Ctx, c: FFXCombatant): number {
  if (c.side === 'party') {
    const slot = PARTY_SLOT[c.id];
    if (slot === undefined) throw new Error(`FFX engine: party member '${c.id}' has no game slot (adapt/slots.ts)`);
    return slot;
  }
  if (c.side === 'aeon') {
    const slot = AEON_SLOT[c.id];
    if (slot === undefined) throw new Error(`FFX engine: aeon '${c.id}' has no game slot (adapt/slots.ts)`);
    return slot;
  }
  const index = ctx.state.enemyIds.indexOf(c.id);
  if (index < 0) throw new Error(`FFX engine: enemy '${c.id}' is not in the formation, so it has no monster slot`);
  if (index >= MONSTER_SLOT_COUNT) {
    throw new Error(`FFX engine: enemy '${c.id}' is formation entry ${index}, but the game has ${MONSTER_SLOT_COUNT} monster slots`);
  }
  return MONSTER_SLOT_FIRST + index;
}

/** Is this slot one of the aeon slots? (The stream of every aeon is the same one.) */
export function isAeonSlot(slot: number): boolean {
  return slot >= 8 && slot <= 0x11;
}

/** The combatant standing in a game slot, or undefined when the slot is empty in this battle. */
export function combatantAtSlot(ctx: Ctx, slot: number): FFXCombatant | undefined {
  let id: CombatantId | undefined;
  if (slot >= MONSTER_SLOT_FIRST && slot < MONSTER_SLOT_FIRST + MONSTER_SLOT_COUNT) {
    id = ctx.state.enemyIds[slot - MONSTER_SLOT_FIRST];
  } else {
    for (const table of [PARTY_SLOT, AEON_SLOT]) {
      const found = Object.entries(table).find(([, s]) => s === slot);
      if (found) id = found[0];
    }
  }
  return id === undefined ? undefined : (ctx.state.combatants[id] as FFXCombatant | undefined);
}
