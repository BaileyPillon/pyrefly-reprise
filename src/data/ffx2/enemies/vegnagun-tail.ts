/**
 * Battle 1 — Vegnagun (Tail) [ffx2-vegnagun-shuyin.md §3.1]. Lv 41,
 * HP 34,200. Gravity immune; Armor Break and Mental Break DO land (only the
 * Def/MDef axis is left open on the Tail and Leg). The simplest boss in the
 * chain — a fixed script with one HP trigger; see `vegnagun-abilities.ts`
 * §5.1 for the AI the engine implements.
 */

import type { EnemyGroupDef } from '../../../battle/common/types.ts';
import { STANDARD_AILMENT_IMMUNITY, STAT_MOD_IMMUNITY_5 } from './vegnagun-shared.ts';

export const vegnagunTailGroup: EnemyGroupDef = {
  id: 'vegnagun-tail',
  game: 'ffx2',
  canEscape: false,
  nextGroupId: 'vegnagun-leg',
  enemies: [
    {
      id: 'vegnagun-tail',
      name: 'Vegnagun',
      spriteKey: 'vegnagun-tail',
      slot: 0,
      // §3.1 — verified.
      stats: {
        hp: 34200,
        mp: 9999,
        str: 77,
        def: 82,
        mag: 72,
        mdef: 76,
        agi: 115,
        luck: 3,
        eva: 0,
        acc: 0,
        maxHp: 34200,
        maxMp: 9999,
      },
      hp: 34200,
      mp: 9999,
      level: 41,
      affinities: { gravity: 'immune' },
      // §3.1 — NOT immune to Reflect or Def/MDef Up-Down (Armor Break and Mental Break both land).
      immunities: { ...STANDARD_AILMENT_IMMUNITY, ...STAT_MOD_IMMUNITY_5, haste: 255, slow: 255, stop: 255 },
      immunityFlags: ['boss'],
      forms: [{ name: 'Vegnagun', spriteKey: 'vegnagun-tail', hp: 34200 }],
      aiScriptId: 'vegnagun-tail',
      rewards: {
        ap: 5,
        apOverkill: 5,
        gil: 3000,
        stolenGil: 3000, // §3.1 line 203 "(Pilfer Gil 3,000)"
        overkillThreshold: 0,
        exp: 5000,
        drops: [{ itemId: 'x2-megalixir', count: 1 }],
        // §3.1 line 205 — Steal (50%): X-Potion ×4 / rare X-Potion ×6. [verified: 2 sources] (line 212).
        steal: { baseChance: 50, common: { itemId: 'x2-x-potion', count: 4 }, rare: { itemId: 'x2-x-potion', count: 6 } },
      },
      abilityIds: ['x2-vegnagun-tail-beam', 'x2-vegnagun-noli-me-tangere'],
      flags: { isBoss: true },
      sensorText: 'Kill the arms before you look it in the face.',
      scanText:
        'Ancient machina. Its bulwarks regenerate unless destroyed together. Its magic strikes everything at once.',
      thinkingPeriod: 0,
    },
  ],
  musicCues: [{ at: 'start', track: 'boss-vegnagun', fadeMs: 600 }],
};

export default vegnagunTailGroup;
