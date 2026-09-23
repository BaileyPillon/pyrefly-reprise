/**
 * Battle 5 — Shuyin, the finale [ffx2-vegnagun-shuyin.md §3.5,
 * verified: 2 sources]. Lv 58, HP 23,850 (not ~30,000). Str 47 / Def 132 /
 * Mag 42 / MDef 92, triangulated three ways and in agreement with the wiki
 * (no transposition here). Almost
 * entirely physical — only Force Rain is magic — so Protect is the party's
 * real mitigation, and Terror of Zanarkand ignores Defense entirely, so no
 * amount of armour stops it [§1.2]. Biased toward targeting Yuna on the
 * original PS2 release; targets anyone on International/HD/Remaster — an
 * engine-level toggle, not data.
 */

import type { EnemyGroupDef } from '../../../battle/common/types.ts';
import { STANDARD_AILMENT_IMMUNITY } from './vegnagun-shared.ts';

export const shuyinGroup: EnemyGroupDef = {
  id: 'shuyin',
  game: 'ffx2',
  canEscape: false,
  enemies: [
    {
      id: 'shuyin',
      name: 'Shuyin',
      spriteKey: 'shuyin',
      slot: 0,
      // §3.5 — Str 47 / Def 132 / Mag 42 / MDef 92, triangulated three ways; agrees with the wiki (no
      // transposition on this row).
      stats: {
        hp: 23850,
        mp: 210,
        str: 47,
        def: 132,
        mag: 42,
        mdef: 92,
        agi: 133, // highest in the chain — acts roughly 4x as often as the Head
        luck: 14,
        eva: 22,
        acc: 0,
        maxHp: 23850,
        maxMp: 210,
      },
      hp: 23850,
      mp: 210,
      level: 58,
      affinities: { gravity: 'immune' },
      // §3.5 — NOT immune to Haste or Reflect, unlike every Vegnagun part. All stat Up/Down land as immune;
      // no Break of any kind works.
      immunities: {
        ...STANDARD_AILMENT_IMMUNITY,
        slow: 255,
        stop: 255,
        'str-up': 255, 'str-down': 255,
        'mag-up': 255, 'mag-down': 255,
        'def-up': 255, 'def-down': 255,
        'mdef-up': 255, 'mdef-down': 255,
        'accu-up': 255, 'accu-down': 255,
        'eva-up': 255, 'eva-down': 255,
        'luck-up': 255, 'luck-down': 255,
      },
      immunityFlags: ['boss'],
      forms: [{ name: 'Shuyin', spriteKey: 'shuyin', hp: 23850 }],
      aiScriptId: 'shuyin', // the eight-turn cycle in ffx2-vegnagun-shuyin.md §5.5
      rewards: {
        ap: 20,
        apOverkill: 20,
        gil: 0,
        stolenGil: 10000, // ffx2-vegnagun-shuyin §3.5 line 435 "(Pilfer 10,000)"
        overkillThreshold: 0,
        exp: 0,
        drops: [],
        // §3.5 — CONFLICT recorded: SinirothX/FF Wiki give a flat 12.5% for both slots; jegged.com gives
        // 11% common / 1.6% rare. Per this project's source-ranking policy, SinirothX is authoritative on
        // conflict; implementing 12.5% here.
        steal: {
          baseChance: 12.5,
          common: { itemId: 'x2-hero-drink', count: 1 },
          rare: { itemId: 'x2-hero-drink', count: 1 },
        },
      },
      abilityIds: [
        'x2-shuyin-attack', 'x2-shuyin-spin-cut', 'x2-shuyin-run-and-slash',
        'x2-shuyin-force-rain', 'x2-shuyin-terror-of-zanarkand',
      ],
      flags: { isBoss: true },
      sensorText: 'Fights like someone you loved. He is not.',
      scanText:
        'A thousand-year shadow. His techniques mirror a stranger’s, learned by grief rather than practice. Nine strikes come at once and armour means nothing to them.',
      thinkingPeriod: 0,
    },
  ],
  musicCues: [{ at: 'start', track: 'boss-shuyin', fadeMs: 600 }],
};

export default shuyinGroup;
