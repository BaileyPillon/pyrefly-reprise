/**
 * Chapter XIII, link 1 — Paragon, Lord Zaon's fiend form, on Cloister 100 of the Via Infinito.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Source: `research/ffx2-trema.md` §3.2 and
 * §4.1; every number carries that file's tag (rule 6).
 *
 * Bailey, 2026-09-25 ("I'll go with all your recommendations", plan
 * `docs/plans/chapter-trema-review.md` with its Review corrections):
 * - **TR1 = a**: Paragon, then Trema, the party carried between them.
 * - **TR7**: the **Normal** form (Big Bang counter), not the Oversoul one.
 * - **TR8 = a**: SinirothX's Magic 244 / Defense 88 / Magic Defense 88, `[conflict]` T-6. The
 *   plan Review settled Magic on two lines (the wiki's own Big Bang figure, 23,803 to 26,877
 *   at MDEF 255, is exactly Magic 244 by the §2.1 steps, `[derived]`); Defense is still open.
 * - **TR12 = b**: Big Bang is an immediate counter (`AiScript.counter`, `engineHooks.ts`).
 *
 * **Not in the research:** Paragon's Evasion (no source row prints it). It is 0 here, the
 * engine's value for "no stat", and flagged to Bailey; nothing was invented to fill it.
 */

import type { EnemyDef, StatusImmunities } from '../../../battle/common/types.ts';
import { STANDARD_AILMENT_IMMUNITY, STAT_MOD_IMMUNITY_5, DEF_MDEF_MOD_IMMUNITY } from './vegnagun-shared.ts';

/**
 * Trema's status list minus Reflect [ffx2-trema §3.2, SinirothX + wiki + Split_Infinity]:
 * Instant Death, Petrify, Sleep, Silence, Darkness, Poison, Confuse, Berserk, Curse, Eject,
 * Slow, Stop, every stat Up/Down, Doom, Delay, Interrupt; Zantetsu 255 (`ko`).
 */
export const CLOISTER_BOSS_IMMUNITY: StatusImmunities = {
  ...STANDARD_AILMENT_IMMUNITY,
  slow: 255,
  stop: 255,
  ...STAT_MOD_IMMUNITY_5,
  ...DEF_MDEF_MOD_IMMUNITY,
};

/** Paragon (normal form), bestiary #119 on the wiki. */
export const paragon: EnemyDef = {
  id: 'paragon',
  name: 'Paragon',
  spriteKey: 'paragon', // not painted yet (O-2 picked A; plan §6); TR18: the chapter stays unlisted
  slot: 0,
  stats: {
    hp: 200000, // [verified: 4 sources]
    mp: 9999,
    maxHp: 200000,
    maxMp: 9999,
    str: 244, // [SinirothX + wiki]
    mag: 244, // TR8 = a [SinirothX]; wiki 88, `[conflict]` T-6 (Magic settled by the Review's derivation)
    def: 88, // TR8 = a [SinirothX]; wiki 244, `[conflict]` T-6, still open
    mdef: 88, // TR8 = a [SinirothX]; wiki 89
    agi: 188, // [SinirothX + wiki]
    eva: 0, // NOT IN THE RESEARCH: no source row prints Paragon's Evasion (see the file header)
    luck: 13, // SinirothX (the wiki's "Accuracy 13" is this field mislabelled, research §3.2)
    acc: 0, // SinirothX
  },
  hp: 200000,
  mp: 9999,
  level: 99, // [SinirothX + wiki]
  affinities: { gravity: 'immune' }, // neutral to every element; Gravity immune (all sources)
  immunities: CLOISTER_BOSS_IMMUNITY,
  immunityFlags: ['boss', 'immune-to-percentage-damage'], // "fractional damage" on the list
  forms: [{ name: 'Paragon', spriteKey: 'paragon', hp: 200000 }],
  aiScriptId: 'paragon',
  rewards: {
    ap: 1, // EXP / AP / Gil [verified: 4 sources]
    apOverkill: 1,
    gil: 3000,
    stolenGil: 4000, // T-11: SinirothX + wiki 4,000 (zero_six 3,000)
    exp: 9000,
    overkillThreshold: 0,
    drops: [{ itemId: 'x2-supreme-gem', count: 1 }], // rare: Dark Matter [SinirothX, wiki, GamerGuides, zero_six]
    steal: {
      baseChance: 50, // no source gives it (only the rate below): the house default, `[estimate]`
      stealRate: 64, // Supreme Gem / x2 at 25 % [SinirothX + wiki]; 64 from 25 % on the 128 = 50 % scale, `[derived]`
      common: { itemId: 'x2-supreme-gem', count: 1 },
      rare: { itemId: 'x2-supreme-gem', count: 2 },
    },
  },
  abilityIds: [
    'paragon-attack-poison', 'paragon-attack-itchy', 'paragon-attack-confuse',
    'paragon-attack-pierce', 'paragon-attack-drain', 'paragon-genesis', 'paragon-big-bang',
  ],
  flags: { isBoss: true },
  // Our words over research §4.1 (the counter rule); not a game line.
  sensorText: 'Anything its guard cannot soften, it answers with everything it has.',
};
