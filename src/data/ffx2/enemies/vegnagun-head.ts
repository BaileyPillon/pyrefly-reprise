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
    // §13.2 S1 [verified: 2 sources] — both Redoubts: common Phoenix Down x1, rare Mega Phoenix x1, steal
    // byte 128 (50.2 %). FF Wiki *Redoubt* (rev 3990466) prints x1 for both slots; SinirothX prints
    // "Phoenix Down/Mega Phoenix (50%)" and writes a count only above 1. Closes §11/§13 row 17.
    // §13.2 S2 [verified: 2 sources] — Pilfer Gil 350 each.
    rewards: {
      ap: 10,
      apOverkill: 10,
      gil: 0,
      overkillThreshold: 0,
      exp: 0,
      drops: [],
      steal: {
        baseChance: 50,
        stealRate: 128,
        common: { itemId: 'x2-phoenix-down', count: 1 },
        rare: { itemId: 'x2-mega-phoenix', count: 1 },
      },
      stolenGil: 350,
    },
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
      rewards: {
        ap: 10,
        apOverkill: 10,
        gil: 0,
        stolenGil: 8000, // §3.4 line 385 "(Pilfer 8,000)"
        overkillThreshold: 0,
        exp: 0,
        drops: [],
        // §3.4 line 387 documents only "Megalixir ×1" — one item, no separate common/rare wording. The type
        // requires both slots, so both hold the same item, exactly as the Body's Turbo Ether does (§3.3 line
        // 310) and as the research's own "common and rare" rows do (Tail Drop, Leg Drop). [verified: 2 sources]
        // (line 392).
        steal: { baseChance: 50, common: { itemId: 'x2-megalixir', count: 1 }, rare: { itemId: 'x2-megalixir', count: 1 } },
      },
      abilityIds: [
        'x2-vegnagun-pallida-mors', 'x2-vegnagun-odi-et-amo', 'x2-vegnagun-mors-certa',
        'x2-vegnagun-nemo-ante-mortem-beatus', 'x2-vegnagun-acta-est-fabula',
      ],
      flags: { isBoss: true },
      scanText:
        'Can revive both Redoubts. Whenever its HP drops it uses Nemo Ante Mortem Beatus, its strongest ability.',
    },
  ],
// §13.2 S3 [verified: 2 sources] — the game names each part itself (SinirothX Monster's Name lines; FF Wiki infobox + bestiary
  // #253/#254, *Redoubt* rev 3990466), so no FFX-2 lettering is needed (PR-0013).
  parts: [redoubt('redoubt-r', 'Right Redoubt', 1, 133, 0), redoubt('redoubt-l', 'Left Redoubt', 2, 0, 133)],
  musicCues: [{ at: 'start', track: 'boss-vegnagun', fadeMs: 600 }],
};

export default vegnagunHeadGroup;
