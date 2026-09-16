/**
 * Battle 3 — Vegnagun (Body/Core) + Right/Left Bulwark
 * [ffx2-vegnagun-shuyin.md §3.3]. Lv 43, the point of no return. SinirothX:
 * **Mag 42 / Def 98** — the wiki transposes these, and this is the one part
 * of the chain where the transposition materially changes the fight (see
 * the Memento Mori regression note in `vegnagun-abilities.ts`). Do not "fix"
 * this stat block against the wiki.
 *
 * The `Charge Core -> Memento Mori` countdown and the Bulwarks'
 * attack-type-mirroring retaliation are engine logic (`vegnagun-abilities.ts`
 * carries every constant they need); killing a Bulwark makes the Core waste
 * its next turn on Full-Life instead of charging.
 */

import type { EnemyDef, EnemyGroupDef } from '../../../battle/common/types.ts';
import { STANDARD_AILMENT_IMMUNITY, STAT_MOD_IMMUNITY_5 } from './vegnagun-shared.ts';

const LEG_LIKE_IMMUNITIES = {
  ...STANDARD_AILMENT_IMMUNITY,
  ...STAT_MOD_IMMUNITY_5,
  haste: 255,
  slow: 255,
  stop: 255,
  reflect: 255,
};

function bulwark(id: string, name: string, slot: number): EnemyDef {
  return {
    id,
    name,
    spriteKey: 'vegnagun-bulwark',
    slot,
    // §3.3 — verified: 2 sources, additionally cross-confirmed by GamerGuides (HP 3,000).
    stats: {
      hp: 3000,
      mp: 9999,
      str: 72,
      def: 58,
      mag: 48,
      mdef: 58,
      agi: 46,
      luck: 2,
      eva: 0,
      acc: 0,
      maxHp: 3000,
      maxMp: 9999,
    },
    hp: 3000,
    mp: 9999,
    level: 39, // Oversoul level 47 is what the wiki prints in its Level field; 39 is correct and unreachable
    affinities: { gravity: 'immune' },
    // §3.3 — Str/Mag/Def/MDef Up-Down ALL land; only Reflect and Accu/Eva/Luck Up-Down are blocked.
    immunities: { ...STANDARD_AILMENT_IMMUNITY, ...STAT_MOD_IMMUNITY_5, reflect: 255, haste: 255, slow: 255, stop: 255 },
    immunityFlags: [],
    forms: [{ name, spriteKey: 'vegnagun-bulwark', hp: 3000 }],
    aiScriptId: 'vegnagun-bulwark',
    rewards: {
      ap: 10,
      apOverkill: 10,
      gil: 150,
      overkillThreshold: 0,
      exp: 200,
      drops: [{ itemId: 'x2-mega-potion', count: 1, chance: 50 }, { itemId: 'x2-x-potion', count: 1, chance: 50 }],
      steal: {
        baseChance: 50,
        common: { itemId: 'x2-phoenix-down', count: 1 },
        rare: { itemId: 'x2-l-bomb', count: 1 },
      },
    },
    // Shared counter suite; which one fires and against whom is the retaliation-log mechanic in the engine.
    abilityIds: [
      'x2-bulwark-hostile-activity-detected', 'x2-bulwark-physical-attack-detected',
      'x2-bulwark-magical-attack-detected',
      ...(id === 'bulwark-r'
        ? ['x2-bulwark-right-regen', 'x2-bulwark-right-shell', 'x2-bulwark-right-protect']
        : ['x2-bulwark-left-break', 'x2-bulwark-left-bio', 'x2-bulwark-left-doom', 'x2-bulwark-left-dispel']),
    ],
    flags: { isPart: true, partOf: 'vegnagun-body' },
    scanText: "Vegnagun's foreleg. Attacks and casts support magic; built to retaliate against anyone who strikes the core.",
  };
}

export const vegnagunBodyGroup: EnemyGroupDef = {
  id: 'vegnagun-body',
  game: 'ffx2',
  canEscape: false,
  nextGroupId: 'vegnagun-head',
  enemies: [
    {
      id: 'vegnagun-body',
      name: 'Vegnagun',
      spriteKey: 'vegnagun-body',
      slot: 0,
      // §3.3 — SinirothX: Mag 42 / Def 98. The wiki has these swapped; see the Memento Mori regression note.
      stats: {
        hp: 33040,
        mp: 9999,
        str: 54,
        def: 98,
        mag: 42,
        mdef: 108,
        agi: 35,
        luck: 4,
        eva: 0,
        acc: 0,
        maxHp: 33040,
        maxMp: 9999,
      },
      hp: 33040,
      mp: 9999,
      level: 43,
      affinities: { gravity: 'immune' },
      // §3.3 — "as Leg, plus MDef Up/Down; Def Up/Down still lands" (Armor Break works, Mental Break does not).
      immunities: { ...LEG_LIKE_IMMUNITIES, 'mdef-up': 255, 'mdef-down': 255 },
      immunityFlags: ['boss'],
      forms: [{ name: 'Vegnagun', spriteKey: 'vegnagun-body', hp: 33040 }],
      aiScriptId: 'vegnagun-body',
      rewards: {
        ap: 10,
        apOverkill: 10,
        gil: 3000,
        overkillThreshold: 0,
        exp: 7000,
        drops: [{ itemId: 'x2-megalixir', count: 1 }],
        // §3.3 — only Turbo Ether is documented; both slots hold the same item (deterministic, as with the Tail).
        steal: { baseChance: 50, common: { itemId: 'x2-turbo-ether', count: 1 }, rare: { itemId: 'x2-turbo-ether', count: 1 } },
      },
      abilityIds: ['x2-vegnagun-charge-core', 'x2-vegnagun-memento-mori', 'x2-vegnagun-core-full-life'],
      flags: { isBoss: true },
      scanText:
        "Vegnagun's core. Charges energy, then unleashes a devastating attack; can also revive both Bulwarks — make it the primary target.",
    },
  ],
  parts: [bulwark('bulwark-r', 'Bulwark', 1), bulwark('bulwark-l', 'Bulwark', 2)],
  musicCues: [{ at: 'start', track: 'boss-vegnagun', fadeMs: 600 }],
};

export default vegnagunBodyGroup;
