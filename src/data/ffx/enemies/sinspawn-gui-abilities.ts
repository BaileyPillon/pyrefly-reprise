/**
 * Sinspawn Gui's own command rows (FFX only; the hidden Sinspawn Gui chapter, `research/re-ffx-ai-gui.md` section 4, game build 25501027).
 *
 * Gui uses four commands. **Attack** is the monster plain Attack the possessed aeons already use (record 0x6000, accuracy 90, formula 1, power 16: `POSSESSED_PLAIN_ATTACK`);
 * **Thunder** and **Demi** are the party's own records (0x3043, 0x304e: `abilities/blackmagic-*.ts`), performed by the body; so the two rows below are the only new ones:
 *
 * - **Special 1** (0x6001): the head's whole turn. No formula, no hits, no damage: it names the body, and the body's `onTargeted` answers it (`ai/sinspawn-gui.ts`).
 *   `hits: 0` for the reason the other caption-style rows carry it: no hit record, so it can never run the body's `onHit`.
 * - **Venom** (0x6031): magic formula 3, power 24, always hits, damage type neither physical nor magical (Shell and Protect do not apply), **Poison 100 and Slow 100**, with Slow's duration
 *   byte 0, which the game writes as no counter at all: it strips Haste and slows no one (the game's own status step, `kernel/status-inflict.ts#temporalStep`, writes Slow's counter 0 and clears Haste's).
 *
 * Every number is the game's own record, read from its battle kernel tables; the record words are `[game table]`. Our names are the game's command names; the banner wording is ours.
 */

import type { AbilityDef, FFXCommandRecord } from '../../../battle/common/types.ts';

/** The head's relay, command 0x6001 "Special 1". */
export const GUI_SPECIAL_1_ID = 'gui-special-1';
/** Venom, command 0x6031. */
export const GUI_VENOM_ID = 'gui-venom';

export const guiSpecial1: AbilityDef = {
  id: GUI_SPECIAL_1_ID,
  name: 'Special 1',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // 0x6001 rank byte 3
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'single-ally', // the body: from the head's side, the one other thing on its own side
  hits: 0,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '', // the head's turn is a tell, not a banner: the body's Thunder or Venom prints its own
  extra: { guiRelay: true },
};

export const guiVenom: AbilityDef = {
  id: GUI_VENOM_ID,
  name: 'Venom',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // 0x6031 rank byte 3
  power: 24, // formula 3, power 24
  formula: 'magic',
  damageType: 'other', // damage flags 0: neither physical nor magical
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [
    { status: 'poison', chance: 100, duration: 254 },
    { status: 'slow', chance: 100, duration: 0 }, // Slow duration byte 0: strips Haste, slows no one
  ],
  removesStatuses: [],
  flags: [],
  canMiss: false, // hit calculation 0: always hits
  messageTemplate: '{user} uses {ability}',
  extra: { vfxKey: 'vfx-venom' },
};

/** The game's records for the two rows (`command-records/enemies.ts` merges them). */
export const COMMAND_RECORDS_GUI: Readonly<Record<string, FFXCommandRecord>> = {
  [GUI_SPECIAL_1_ID]: { id: 0x6001, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0, rank: 3 }, // Special 1 (rank byte 3)
  // Venom: rank byte 3; the chance bytes Poison 100 (status 3) and Slow 100 (status 24); Slow's DURATION byte is 0, so `durations` is empty (it lists non-zero bytes only) and the game's own status
  // step (`kernel/status-inflict.ts#temporalStep`) writes Slow's counter 0 and clears Haste's: it strips Haste and slows no one, with no rule of ours.
  [GUI_VENOM_ID]: { id: 0x6031, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 1, rank: 3, chances: [[3, 100], [24, 100]] }, // Venom
};

export const SINSPAWN_GUI_ABILITIES: Readonly<Record<string, AbilityDef>> = {
  [GUI_SPECIAL_1_ID]: guiSpecial1,
  [GUI_VENOM_ID]: guiVenom,
};
