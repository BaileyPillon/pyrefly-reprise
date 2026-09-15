/**
 * Chapter 4 enemy group — Bahamut (Bevelle Underground).
 *
 * Source: `research/ffx2-bahamut.md`. Bestiary #182.
 *
 * Verified headline numbers [§1.1]: Lv 20, HP 8 400, MP 9 999, STR 71,
 * MAG 86, DEF 160, MDEF 10, AGI 86, ACC 0 (absent from the record), EVA 0,
 * LUCK 3, EXP 1 300, AP 15, gil 1 000 (stealable 2 200).
 *
 * The design fact to keep in a code comment [§1.2]:
 * **Defense 160 is enormous; Magic Defense 10 is almost nothing.** Raw physical
 * attacks are near-worthless; anything that ignores Defense or routes through
 * Magic is dominant. Every "correct" strategy in §3 is an expression of that.
 *
 * Elements [§1.3]: all five damage elements are **Neutral** — Holy is **NOT** a
 * weakness (conflict resolved against GamerGuides) — and **Gravity is Immune**.
 * In X-2 a weakness is x2.0, so "no weakness" matters more here than it would
 * in FFX.
 *
 * TODO(data-agent): transcribe the full record.
 *   - §2 AI script.
 *   - §1.1 status immunities as raw bytes.
 *   - `ffx2-combat-core.md` §2.9 for the ability Power/DmCon table.
 *   - Bahamut's EVA 0 means the party never misses him physically; his ACC 0
 *     means Thief's EVA 19 is a real, visible defence. Route his normal Attack
 *     through the standard hit model, do not special-case it.
 *   - **Chapter 4 suppresses the entire victory flourish** — no pose, no
 *     fanfare, no quips, silent Results screen [writing-bible §5.4]. That is
 *     handled by `ResultsStep.silent`, not here, but the music cue must not
 *     queue a victory track.
 */

import type { EnemyGroupDef } from '../../../battle/common/types.ts';

export const bahamutGroup: EnemyGroupDef = {
  id: 'ffx2-bahamut',
  game: 'ffx2',
  canEscape: false,
  enemies: [
    {
      id: 'bahamut',
      name: 'Bahamut',
      spriteKey: 'ffx2-bahamut',
      slot: 0,
      // §1.1 — verified.
      stats: {
        hp: 8400,
        mp: 9999,
        str: 71,
        def: 160,
        mag: 86,
        mdef: 10,
        agi: 86,
        luck: 3,
        eva: 0,
        acc: 0,
        maxHp: 8400,
        maxMp: 9999,
      },
      hp: 8400,
      mp: 9999,
      level: 20,
      // §1.3 — only the non-neutral entry is listed, which is how the source
      // bestiaries behave. Holy is deliberately absent: it is NOT a weakness.
      affinities: { gravity: 'immune' },
      immunities: {}, // TODO(data-agent): §1.1
      immunityFlags: ['boss'],
      forms: [{ name: 'Bahamut', spriteKey: 'ffx2-bahamut', hp: 8400 }],
      aiScriptId: 'ffx2-bahamut', // TODO(data-agent): §2
      rewards: {
        ap: 15,
        apOverkill: 15, // X-2 has no overkill; kept equal for schema uniformity.
        gil: 1000,
        overkillThreshold: 0,
        exp: 1300,
        drops: [], // TODO(data-agent)
        steal: {
          baseChance: 100, // TODO(data-agent): confirm against §1.1
          common: { itemId: 'gil-2200', count: 1 },
          rare: { itemId: 'gil-2200', count: 1 },
        },
      },
      abilityIds: [], // TODO(data-agent): §2
      flags: { isBoss: true },
      sensorText: 'An aeon that once fought alongside Yuna.',
      scanText: 'An aeon that once fought alongside Yuna.', // TODO(data-agent): original longer copy
    },
  ],
  musicCues: [
    // TODO(data-agent): original composition. No victory track — the fight is
    // uniquely un-celebrated.
    { at: 'start', track: 'boss-dread', fadeMs: 800 },
  ],
};

export default bahamutGroup;
