/**
 * Battle 2 — Vegnagun (Leg) + Nodes A/B/C [ffx2-vegnagun-shuyin.md §3.2].
 * Lv 38. SinirothX: **Mag 18 / Def 13** — the wiki transposes these two
 * columns; do not "fix" this stat block against the wiki (§3 header). The
 * Nodes' 300,000 HP is intentional: they are not meant to be killed, only
 * the Leg (18,220 HP) is the win condition. Their colour-cycling state
 * machine (Red/Green/Yellow, Null Physical while Red, Null Magic while
 * Yellow) and the reach rule (only long-range abilities can target them) are
 * engine logic; see `vegnagun-abilities.ts` for the ability numbers.
 */

import type { EnemyDef, EnemyGroupDef } from '../../../battle/common/types.ts';
import {
  DEF_MDEF_MOD_IMMUNITY,
  STANDARD_AILMENT_IMMUNITY,
  STAT_MOD_IMMUNITY_5,
} from './vegnagun-shared.ts';

const LEG_IMMUNITIES = {
  ...STANDARD_AILMENT_IMMUNITY,
  ...STAT_MOD_IMMUNITY_5,
  haste: 255,
  slow: 255,
  stop: 255,
  reflect: 255, // §3.2 — "as Tail plus Reflect"
};

function node(id: string, slot: number): EnemyDef {
  return {
    id,
    name: 'Node',
    spriteKey: 'vegnagun-node',
    slot,
    // §3.2 — verified: 2 sources, additionally cross-confirmed by GamerGuides.
    stats: {
      hp: 300000,
      mp: 9999,
      str: 48,
      def: 244,
      mag: 16,
      mdef: 244,
      agi: 41,
      luck: 2,
      eva: 0,
      acc: 0,
      maxHp: 300000,
      maxMp: 9999,
    },
    hp: 300000,
    mp: 9999,
    level: 52,
    affinities: { gravity: 'immune' },
    // §3.2 — "as Leg plus Def Up/Down and MDef Up/Down": Armor Break and Mental Break do NOT land either.
    immunities: { ...LEG_IMMUNITIES, ...DEF_MDEF_MOD_IMMUNITY },
    immunityFlags: [],
    forms: [{ name: 'Node', spriteKey: 'vegnagun-node', hp: 300000 }],
    aiScriptId: 'vegnagun-node',
    rewards: {
      ap: 10,
      apOverkill: 10,
      gil: 3000,
      overkillThreshold: 0,
      exp: 8000,
      drops: [{ itemId: 'x2-megalixir', count: 1 }],
      steal: { baseChance: 50, common: { itemId: 'x2-megalixir', count: 1 }, rare: { itemId: 'x2-megalixir', count: 2 } },
    },
    abilityIds: [
      'x2-node-missile', 'x2-node-dies-irae', 'x2-node-firaga', 'x2-node-blizzaga', 'x2-node-thundaga',
      'x2-node-waterga', 'x2-node-flare', 'x2-node-cura', 'x2-node-regen', 'x2-node-shell', 'x2-node-protect',
    ],
    flags: { isPart: true, partOf: 'vegnagun-leg' },
    scanText: 'Cycles Red, Green and Yellow. Red nullifies physical; Yellow nullifies magic.',
  };
}

export const vegnagunLegGroup: EnemyGroupDef = {
  id: 'vegnagun-leg',
  game: 'ffx2',
  canEscape: false,
  nextGroupId: 'vegnagun-body',
  enemies: [
    {
      id: 'vegnagun-leg',
      name: 'Vegnagun',
      spriteKey: 'vegnagun-leg',
      slot: 0,
      // §3.2 — SinirothX: Mag 18 / Def 13 (the wiki transposes these).
      stats: {
        hp: 18220,
        mp: 9999,
        str: 13,
        def: 13,
        mag: 18,
        mdef: 17,
        agi: 34,
        luck: 3,
        eva: 0,
        acc: 0,
        maxHp: 18220,
        maxMp: 9999,
      },
      hp: 18220,
      mp: 9999,
      level: 38,
      affinities: { gravity: 'immune' },
      immunities: LEG_IMMUNITIES,
      immunityFlags: ['boss'],
      forms: [{ name: 'Vegnagun', spriteKey: 'vegnagun-leg', hp: 18220 }],
      aiScriptId: 'vegnagun-leg',
      rewards: {
        ap: 5,
        apOverkill: 5,
        gil: 3000,
        overkillThreshold: 0,
        exp: 6000,
        drops: [{ itemId: 'x2-mythril-bangle', count: 1 }],
        steal: { baseChance: 50, common: { itemId: 'x2-elixir', count: 1 }, rare: { itemId: 'x2-elixir', count: 2 } },
      },
      abilityIds: [
        'x2-vegnagun-vita-brevis', 'x2-vegnagun-leg-absorb', 'x2-vegnagun-leg-slow',
        'x2-vegnagun-leg-berserk', 'x2-vegnagun-leg-break',
      ],
      flags: { isBoss: true },
      scanText: 'The leg that carries it. Bring down the Nodes’ support first, or ignore them entirely — only the leg matters.',
    },
  ],
  parts: [node('node-a', 1), node('node-b', 2), node('node-c', 3)],
  musicCues: [{ at: 'start', track: 'boss-vegnagun', fadeMs: 600 }],
};

export default vegnagunLegGroup;
