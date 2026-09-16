/**
 * Battle 4 — Vegnagun (Head) + Right/Left Redoubt
 * [ffx2-vegnagun-shuyin.md §3.4]. Lv 57. SinirothX: **Mag 52 / Def 71** — the
 * wiki transposes these; do not "fix" this stat block against the wiki.
 *
 * Carries the real-time fail clock: once both Redoubts have been downed once
 * (Phase B), the Head speaks seven scripted lines and the seventh is
 * "Now, Vegnagun. Fire!" -> instant Game Over / bad ending
 * [§4.2, verified: 2 sources]. The clock, the Phase A/B gate, and the
 * Redoubts' asymmetric Def 133/MDef 0 vs Def 0/MDef 133 mirror (kill Right
 * with magic, Left with physicals) are all engine logic; every constant they
 * need (including the `FIRE_AT_TURN` / `LINE_INTERVAL` presets) is
 * documented in `research/ffx2-vegnagun-shuyin.md` §4.2.
 */

import type { EnemyDef, EnemyGroupDef } from '../../../battle/common/types.ts';
import { STANDARD_AILMENT_IMMUNITY } from './vegnagun-shared.ts';

/** All seven stats' Up AND Down, 255 each — no Break of any kind lands on the Head or the Redoubts. */
const ALL_STAT_MOD_IMMUNITY = {
  'str-up': 255, 'str-down': 255,
  'mag-up': 255, 'mag-down': 255,
  'accu-up': 255, 'accu-down': 255,
  'eva-up': 255, 'eva-down': 255,
  'luck-up': 255, 'luck-down': 255,
} as const;

const HEAD_IMMUNITIES = {
  ...STANDARD_AILMENT_IMMUNITY,
  ...ALL_STAT_MOD_IMMUNITY,
  'def-up': 255,
  'def-down': 255,
  'mdef-up': 255,
  'mdef-down': 255,
  reflect: 255,
  haste: 255,
  slow: 255,
  stop: 255,
};

/** Redoubts: as the Head, minus Def/MDef Up-Down — Armor Break and Mental Break both land [§3.4]. */
const REDOUBT_IMMUNITIES = { ...STANDARD_AILMENT_IMMUNITY, ...ALL_STAT_MOD_IMMUNITY, reflect: 255, haste: 255, slow: 255, stop: 255 };

function redoubt(id: string, name: string, slot: number, def: number, mdef: number): EnemyDef {
  return {
    id,
    name,
    spriteKey: 'vegnagun-redoubt',
    slot,
    // §3.4 — verified: 2 sources (SinirothX + FF Wiki Redoubt page, which matches every field). The Def/MDef
    // mirror is deliberate: Right is armoured with zero magic defense; Left is the exact inverse.
    stats: {
      hp: 2500,
      mp: 99999,
      str: 65,
      def,
      mag: 41,
      mdef,
      agi: 47,
      luck: 3,
      eva: 0,
      acc: 0,
      maxHp: 2500,
      maxMp: 99999,
    },
    hp: 2500,
    mp: 99999,
    level: 40,
    affinities: { gravity: 'immune' },
    immunities: REDOUBT_IMMUNITIES,
    immunityFlags: [],
    forms: [{ name, spriteKey: 'vegnagun-redoubt', hp: 2500 }],
    aiScriptId: 'vegnagun-redoubt',
    rewards: { ap: 10, apOverkill: 10, gil: 0, overkillThreshold: 0, exp: 0, drops: [] },
    abilityIds:
      id === 'redoubt-r'
        ? ['x2-redoubt-right-lacrimosa', 'x2-redoubt-right-blind', 'x2-redoubt-right-break', 'x2-redoubt-right-flare', 'x2-redoubt-full-life']
        : ['x2-redoubt-left-lacrimosa', 'x2-redoubt-left-slow', 'x2-redoubt-left-demi', 'x2-redoubt-left-dispel', 'x2-redoubt-full-life'],
    flags: { isPart: true, partOf: 'vegnagun-head' },
    scanText: 'One of Vegnagun’s last defences; can revive the other Redoubt.',
  };
}

export const vegnagunHeadGroup: EnemyGroupDef = {
  id: 'vegnagun-head',
  game: 'ffx2',
  canEscape: false,
  nextGroupId: 'shuyin',
  enemies: [
    {
      id: 'vegnagun-head',
      name: 'Vegnagun',
      spriteKey: 'vegnagun-head',
      slot: 0,
      // §3.4 — SinirothX: Mag 52 / Def 71 (the wiki transposes these).
      stats: {
        hp: 38420,
        mp: 9999,
        str: 56,
        def: 71,
        mag: 52,
        mdef: 59,
        agi: 36,
        luck: 4,
        eva: 0,
        acc: 0,
        maxHp: 38420,
        maxMp: 9999,
      },
      hp: 38420,
      mp: 9999,
      level: 57,
      affinities: { gravity: 'immune' },
      immunities: HEAD_IMMUNITIES,
      immunityFlags: ['boss'],
      forms: [{ name: 'Vegnagun', spriteKey: 'vegnagun-head', hp: 38420 }],
      aiScriptId: 'vegnagun-head', // includes the real-time fail clock; see this file's doc comment
      rewards: { ap: 10, apOverkill: 10, gil: 0, overkillThreshold: 0, exp: 0, drops: [] },
      abilityIds: [
        'x2-vegnagun-pallida-mors', 'x2-vegnagun-odi-et-amo', 'x2-vegnagun-mors-certa',
        'x2-vegnagun-nemo-ante-mortem-beatus', 'x2-vegnagun-acta-est-fabula',
      ],
      flags: { isBoss: true },
      scanText:
        'Can revive both Redoubts. Whenever its HP drops it uses Nemo Ante Mortem Beatus, its strongest ability.',
    },
  ],
  parts: [redoubt('redoubt-r', 'Redoubt', 1, 133, 0), redoubt('redoubt-l', 'Redoubt', 2, 0, 133)],
  musicCues: [{ at: 'start', track: 'boss-vegnagun', fadeMs: 600 }],
};

export default vegnagunHeadGroup;
