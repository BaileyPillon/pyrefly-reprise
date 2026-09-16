/**
 * Chapter 4 enemy group — Bahamut (Bevelle Underground).
 *
 * Source: `research/ffx2-bahamut.md`. Bestiary #182.
 *
 * Verified headline numbers [§1.1]: Lv 20, HP 8 400, MP 9 999, STR 71,
 * MAG 86, DEF 160, MDEF 10, AGI 86, ACC 0 (absent from the record, meaning
 * 0 — see §1.1's resolution), EVA 0, LUCK 3, EXP 1 300, AP 15, gil 1 000
 * (stealable via Pilfer Gil 2 200).
 *
 * The design fact to keep in a code comment [§1.2]:
 * **Defense 160 is enormous; Magic Defense 10 is almost nothing.** Raw physical
 * attacks are near-worthless; anything that ignores Defense or routes through
 * Magic is dominant. Every "correct" strategy in §3 is an expression of that.
 *
 * Elements [§1.3]: all five damage elements are **Neutral** — Holy is **NOT** a
 * weakness (conflict resolved against GamerGuides using a third, explicitly
 * populated source, Jegged.com) — and **Gravity is Immune**. In X-2 a weakness
 * is x2.0, so "no weakness" matters more here than it would in FFX.
 *
 * AI script, ability data and the resolved Mega Flare/Impulse/Attack formulas
 * live in `bahamut-abilities.ts`.
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
      // §1.4 — verified: 2 sources, by comparison against Anima's and the Fiend Arena Bahamut's entries, which
      // explicitly flag these rows and this one does not. Modelled as StatusApplication resistance (blocks
      // instant/status-application effects only; does not block ordinary 0-HP combat death).
      immunities: {
        ko: 255, // Death
        petrify: 255,
        sleep: 255,
        silence: 255,
        darkness: 255,
        poison: 255,
        confuse: 255,
        berserk: 255,
        curse: 255,
        eject: 255,
        stop: 255,
        doom: 255,
        'action-cancel': 255, // Interrupt
        'delay-effect': 255, // Delay
      },
      immunityFlags: ['boss'],
      // NOT immune [§1.4, §1.5]: Slow, and all four stat Up/Down levels (Power/Armor/Magic/Mental Break all
      // land — this is the deliberate design contrast with Anima and the Fiend Arena Bahamut, both of which
      // are flagged immune to every stat modifier).
      forms: [{ name: 'Bahamut', spriteKey: 'ffx2-bahamut', hp: 8400 }],
      aiScriptId: 'ffx2-bahamut', // fixed 12-action loop, see bahamut-abilities.ts's doc comment for the script
      rewards: {
        ap: 15,
        apOverkill: 15, // X-2 has no overkill; kept equal for schema uniformity.
        gil: 1000,
        overkillThreshold: 0,
        exp: 1300,
        // §1.6 — drop is guaranteed, both slots hold the same item (deterministic).
        drops: [{ itemId: 'gris-gris-bag', count: 1 }],
        // §1.6 — steal byte 128/255 ~= 50.2% total; split 87.5% common / 12.5% rare, both slots are Mute
        // Shock (Str -5, Mag +3, adds/casts Silence — to which Bahamut himself is immune). Not modelled as a
        // consumable ItemDef since it is an accessory; tracked here as a loot id only.
        steal: {
          baseChance: 50,
          common: { itemId: 'x2-mute-shock', count: 1 },
          rare: { itemId: 'x2-mute-shock', count: 1 },
        },
        // No bribe entry exists in the source record and it is not flagged immune either [§1.6, gap].
      },
      abilityIds: [
        'x2-bahamut-curse',
        'x2-bahamut-attack',
        'x2-bahamut-impulse',
        'x2-bahamut-countdown',
        'x2-bahamut-mega-flare',
      ],
      flags: { isBoss: true },
      sensorText: 'An aeon that once fought alongside Yuna.',
      scanText: 'An aeon that once fought alongside Yuna.', // §1.1 — this is the full published Scan copy; no longer variant exists in the research
      thinkingPeriod: 0,
    },
  ],
  musicCues: [
    // "Yuna's Ballad" — the only aeon fight with its own leitmotif instead of a boss theme; deliberately
    // sorrowful, not triumphant. No victory cue: Chapter 4 suppresses the whole flourish (silent Results
    // screen), handled by `ResultsStep.silent`, not here [ffx2-bahamut §1.7, §5.4; CONTRACT-CHANGES §8].
    { at: 'start', track: 'boss-ffx2-aeon', fadeMs: 800 },
  ],
};

export default bahamutGroup;
