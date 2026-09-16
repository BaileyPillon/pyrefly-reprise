/**
 * FFX Overdrive Mode catalog — all 17 modes.
 *
 * Source: `research/ffx-combat-core.md` §5.1 `[verified: 2 sources]` for the
 * whole table below (fill triggers, increment formulas, and per-character
 * learn-turn counts).
 *
 * There is no `OverdriveModeDef` catalog type in the shared contract —
 * `OverdriveModeId` in `battle/common/types.ts` is only the string-literal
 * union of the 17 ids. This file defines its own local descriptor type so the
 * gauge-fill rules and unlock pacing have somewhere to live; the engine agent
 * decides how to consume it.
 *
 * `learnTurnsByCharacter` is the number of turns (using that mode) needed to
 * permanently unlock it for that character, in the source's own column order
 * Tidus/Yuna/Auron/Kimahri/Wakka/Lulu/Rikku. `stoic` is the default starting
 * mode for everyone, not something anyone "learns", so its counts are all 0.
 */

import type { OverdriveModeId } from '../../../battle/common/types.ts';

/** Local descriptor for one Overdrive mode. Not part of the shared contract. */
export interface OverdriveModeDef {
  id: OverdriveModeId;
  /** Display name as it appears in the Overdrive Mode select menu. */
  name: string;
  /** Plain-English description of what triggers gauge gain. */
  fillTrigger: string;
  /**
   * Plain-English formula for the gauge increment, e.g.
   * `"damageReceived * 30 / maxHP"` (percentage points), or a flat percent
   * like `"16"`.
   */
  incrementFormula: string;
  /** Hard cap on a single increment, in percentage points. Only Warrior has one (16). */
  incrementCapPercent?: number;
  /**
   * Turns spent actively in this mode before it is permanently unlocked,
   * per character, in Tidus/Yuna/Auron/Kimahri/Wakka/Lulu/Rikku order
   * [ffx-combat-core §5.1].
   */
  learnTurnsByCharacter: {
    tidus: number;
    yuna: number;
    auron: number;
    kimahri: number;
    wakka: number;
    lulu: number;
    rikku: number;
  };
  /** Free-form notes: statuses counted, PS2/JP discrepancies, etc. */
  notes?: string;
}

/**
 * Statuses that count toward Tactician's "inflicts a status ailment on an
 * enemy" trigger [ffx-combat-core §5.1].
 */
export const TACTICIAN_STATUSES = [
  'sleep',
  'silence',
  'darkness',
  'poison',
  'petrify',
  'slow',
  'zombie',
  'power-break',
  'magic-break',
  'armor-break',
  'mental-break',
  'threaten',
  'provoke',
  'doom',
] as const;

/**
 * Statuses that count toward Victim's "an enemy inflicts a status ailment on
 * the user" trigger and Sufferer's "afflicted" check [ffx-combat-core §5.1].
 */
export const VICTIM_SUFFERER_STATUSES = [
  'silence',
  'sleep',
  'doom',
  'darkness',
  'slow',
  'poison',
  'zombie',
  'confuse',
] as const;

export const OVERDRIVE_MODES: Record<OverdriveModeId, OverdriveModeDef> = {
  stoic: {
    id: 'stoic',
    name: 'Stoic',
    fillTrigger: 'user takes damage from an enemy',
    incrementFormula: 'damageReceived * 30 / maxHP',
    learnTurnsByCharacter: { tidus: 0, yuna: 0, auron: 0, kimahri: 0, wakka: 0, lulu: 0, rikku: 0 },
    notes: 'Default mode for every character — everyone starts here, so it is not "learned" like the other 16.',
  },

  warrior: {
    id: 'warrior',
    name: 'Warrior',
    fillTrigger: 'user damages an enemy (not via items or Overdrives)',
    incrementFormula: 'damageInflicted * 10 / estimatedDamage, capped at 16',
    incrementCapPercent: 16,
    learnTurnsByCharacter: { tidus: 150, yuna: 200, auron: 100, kimahri: 120, wakka: 160, lulu: 300, rikku: 140 },
  },

  comrade: {
    id: 'comrade',
    name: 'Comrade',
    fillTrigger: "an ally takes damage",
    incrementFormula: 'damageReceived * 20 / target.maxHP',
    learnTurnsByCharacter: { tidus: 300, yuna: 240, auron: 220, kimahri: 100, wakka: 100, lulu: 100, rikku: 100 },
    notes: 'Strongest mode against multi-target bosses since every hit on any ally fills it.',
  },

  healer: {
    id: 'healer',
    name: 'Healer',
    fillTrigger: "user restores an ally's HP (counts even at full HP)",
    incrementFormula: 'healedAmount * 16 / target.maxHP',
    learnTurnsByCharacter: { tidus: 80, yuna: 60, auron: 200, kimahri: 100, wakka: 110, lulu: 170, rikku: 70 },
  },

  tactician: {
    id: 'tactician',
    name: 'Tactician',
    fillTrigger: 'user inflicts a status ailment on an enemy',
    incrementFormula: '16',
    learnTurnsByCharacter: { tidus: 75, yuna: 100, auron: 110, kimahri: 60, wakka: 80, lulu: 75, rikku: 90 },
    notes: `Counted statuses: ${TACTICIAN_STATUSES.join(', ')}.`,
  },

  victim: {
    id: 'victim',
    name: 'Victim',
    fillTrigger: 'an enemy inflicts a status ailment on the user',
    incrementFormula: '16',
    learnTurnsByCharacter: { tidus: 120, yuna: 100, auron: 160, kimahri: 100, wakka: 110, lulu: 130, rikku: 125 },
    notes: `Counted statuses: ${VICTIM_SUFFERER_STATUSES.join(', ')}.`,
  },

  dancer: {
    id: 'dancer',
    name: 'Dancer',
    fillTrigger: 'user evades an enemy attack',
    incrementFormula: '16',
    learnTurnsByCharacter: { tidus: 250, yuna: 200, auron: 200, kimahri: 130, wakka: 200, lulu: 300, rikku: 200 },
  },

  avenger: {
    id: 'avenger',
    name: 'Avenger',
    fillTrigger: 'an enemy KOs an ally',
    incrementFormula: '30',
    learnTurnsByCharacter: { tidus: 100, yuna: 80, auron: 120, kimahri: 100, wakka: 100, lulu: 150, rikku: 90 },
  },

  slayer: {
    id: 'slayer',
    name: 'Slayer',
    fillTrigger: 'user kills an enemy',
    incrementFormula: '20',
    learnTurnsByCharacter: { tidus: 100, yuna: 110, auron: 80, kimahri: 120, wakka: 90, lulu: 130, rikku: 100 },
    notes: '40 instead of 20 when the kill is made with a Warrior Monk/Fallen Monk weapon — not relevant to the playable party.',
  },

  hero: {
    id: 'hero',
    name: 'Hero',
    fillTrigger: 'user kills an enemy with >= 10000 HP or >= 20x the estimated damage',
    incrementFormula: '20',
    learnTurnsByCharacter: { tidus: 50, yuna: 50, auron: 40, kimahri: 45, wakka: 50, lulu: 70, rikku: 50 },
  },

  rook: {
    id: 'rook',
    name: 'Rook',
    fillTrigger: 'user reduces or nullifies enemy damage via Nul/Protect/Shell/Reflect',
    incrementFormula: '10',
    learnTurnsByCharacter: { tidus: 120, yuna: 110, auron: 120, kimahri: 120, wakka: 120, lulu: 120, rikku: 120 },
  },

  victor: {
    id: 'victor',
    name: 'Victor',
    fillTrigger: 'user is in the active party when the battle is won',
    incrementFormula: '20',
    learnTurnsByCharacter: { tidus: 120, yuna: 150, auron: 200, kimahri: 120, wakka: 160, lulu: 200, rikku: 140 },
  },

  coward: {
    id: 'coward',
    name: 'Coward',
    fillTrigger: 'user Escapes (a Flee by anyone also counts)',
    incrementFormula: '10',
    learnTurnsByCharacter: { tidus: 600, yuna: 900, auron: 1000, kimahri: 700, wakka: 400, lulu: 980, rikku: 450 },
  },

  ally: {
    id: 'ally',
    name: 'Ally',
    fillTrigger: "start of the user's turn",
    incrementFormula: '3',
    learnTurnsByCharacter: { tidus: 600, yuna: 500, auron: 450, kimahri: 300, wakka: 350, lulu: 480, rikku: 320 },
    notes: '3% here (our baseline); the original JP PS2 release uses 4%. A field-grinding mode, not a boss mode.',
  },

  sufferer: {
    id: 'sufferer',
    name: 'Sufferer',
    fillTrigger: "start of the user's turn while afflicted",
    incrementFormula: '16',
    learnTurnsByCharacter: { tidus: 100, yuna: 80, auron: 120, kimahri: 130, wakka: 100, lulu: 110, rikku: 90 },
    notes: `Counted statuses: ${VICTIM_SUFFERER_STATUSES.join(', ')}.`,
  },

  daredevil: {
    id: 'daredevil',
    name: 'Daredevil',
    fillTrigger: "start of the user's turn while in Critical status",
    incrementFormula: '5',
    learnTurnsByCharacter: { tidus: 170, yuna: 90, auron: 260, kimahri: 200, wakka: 140, lulu: 150, rikku: 110 },
    notes: '5% here (our baseline); the original JP PS2 release uses 16%.',
  },

  loner: {
    id: 'loner',
    name: 'Loner',
    fillTrigger: "start of the user's turn while the sole surviving/active member",
    incrementFormula: '16',
    learnTurnsByCharacter: { tidus: 60, yuna: 180, auron: 35, kimahri: 90, wakka: 110, lulu: 45, rikku: 170 },
  },
};
