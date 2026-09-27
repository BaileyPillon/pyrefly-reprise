/**
 * Ixion at Djose Temple: the FFX-2 Chapter 3 finale, one link (our unlisted chapter "Ixion at Djose").
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the fallen aeons' action counter
 * (`research/ffx2-ixion-djose.md` §0: "Nothing here transfers to an FFX chapter"). The combatant id is
 * `x2-ixion` because the FFX data already uses `ixion` (the Chapter XI `x2-shiva` precedent).
 *
 * Bailey, 2026-09-27 ~13:40 EDT, "all your recommendations": **concept A** of
 * `docs/concepts/chapters/ixion-djose-2026-09-27/README.md` (the fight with the Recharge banner as the tell,
 * then the fall and a short Abyss cutscene ending on a playable four-whistle beat). Built **unlisted behind a
 * switch** (`src/data/chapter-ffx2-ixion-djose.ts`).
 *
 * **Placeholder art.** `spriteKey: 'ixion'` is the **FFX** Ixion painting (shipped by D-089), standing in
 * until Bailey picks the FFX-2 look (research Q6; the options are commit 247cb985). It is not a proposal.
 *
 * Every stat is §3.1 with its tag, carried verbatim (rule 6).
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import { STANDARD_AILMENT_IMMUNITY } from './vegnagun-shared.ts';

export const DJOSE_IXION = 'ffx2-djose-ixion';
export const IXION_ID = 'x2-ixion';
/** The placeholder painting: the FFX Ixion (D-089). Swap for the FFX-2 look once Bailey picks (Q6). */
export const IXION_PLACEHOLDER_SPRITE = 'ixion';

/**
 * §3.1's immunity list: Instant Death, Petrify, Sleep, Silence, Darkness, Poison, Confuse, Berserk, Curse,
 * Eject, Stop, Doom, Delay, Interrupt `[verified: 3 sources — SinirothX, wiki, Split_Infinity]`. **Not immune
 * to Slow or any Break** `[verified: 4 sources]`, so neither is listed. Zantetsu resistance 80 is not
 * modelled (no `zantetsu` status; the Leblanc precedent); §3.1 derives it lands 0 % for a Lv 30 Samurai.
 */
const IXION_IMMUNE: StatusImmunities = { ...STANDARD_AILMENT_IMMUNITY, stop: 255 };

/**
 * **Action time, OFF: Bailey's pick** (the Chapter XI and XIII switch; `src/battle/ffx2/action-time.ts`).
 * The rule is sourced `[verified: 2 sources]`, its length is not (`research/ffx2-trema.md` §12.4). The Road
 * (Chapter XI) and Cloister 100 (Chapter XIII) ship 3 s by Bailey's word; this chapter ships **without**
 * until Bailey says otherwise. `docs/plans/ixion-bench.md` measures both: with it off the preset almost never
 * wins at human pace. `true` turns it on at {@link DJOSE_ACTION_TIME_SECONDS}; no boss number moves either way.
 */
export const DJOSE_ACTION_TIME_ON: boolean = false;
/** **`[estimate]`**: the length the Road and the Cloister ship, measured here as the option. Unsourced (§12.4). */
export const DJOSE_ACTION_TIME_SECONDS = 3;
const actionTime = DJOSE_ACTION_TIME_ON ? { actionTimeSeconds: DJOSE_ACTION_TIME_SECONDS } : {};

/** "Aeons" plays in the fight `[single source: wiki OST]`; our original FFX-2 aeon cue stands in (rule 13). */
const AEON_CUE = [{ at: 'start' as const, track: 'boss-ffx2-aeon' as const, fadeMs: 800 }];

/** Ixion, story version, bestiary #180 (§3.1). */
export const x2Ixion: EnemyDef = {
  id: IXION_ID,
  name: 'Ixion',
  spriteKey: IXION_PLACEHOLDER_SPRITE, // PLACEHOLDER: the FFX painting (see the file header)
  slot: 0,
  stats: {
    hp: 12380, // [verified: 8 sources]
    mp: 9999, // [verified: 6 sources]
    maxHp: 12380,
    maxMp: 9999,
    str: 62, // STR / MAG / DEF / MDEF 62 / 21 / 106 / 82 [verified: 2 sources — SinirothX + wiki]
    mag: 21,
    def: 106,
    mdef: 82,
    agi: 138, // Agility / Evasion / Luck / Accuracy 138 / 35 / 4 / 0 [verified: 2 sources] (wiki has no Accuracy)
    eva: 35,
    luck: 4,
    acc: 0,
  },
  hp: 12380,
  mp: 9999,
  level: 28, // [verified: 2 sources]
  // Absorbs Lightning, weak to Water, immune to Gravity; Fire, Ice, Holy neutral [verified: 5 sources].
  affinities: { lightning: 'absorb', water: 'weak', gravity: 'immune' },
  immunities: IXION_IMMUNE,
  // "fractional damage" is on §3.1's immunity list [verified: 3 sources].
  immunityFlags: ['boss', 'immune-to-percentage-damage'],
  forms: [{ name: 'Ixion', spriteKey: IXION_PLACEHOLDER_SPRITE, hp: 12380 }],
  aiScriptId: 'x2-ixion',
  rewards: {
    ap: 15, // EXP / AP / Gil 2,600 / 15 / 1,800 [verified: 6 sources]
    apOverkill: 15,
    gil: 1800,
    stolenGil: 3000, // Pilfer gil [verified: 4 sources]; zero_six 2,330 (IX-9)
    exp: 2600,
    overkillThreshold: 0,
    drops: [{ itemId: 'soul-of-thamasa', count: 1 }], // drop and rare drop, 100 % [verified: 6 sources]
    steal: {
      baseChance: 50, // no source gives it (only the rate below): the house default, `[estimate]`
      stealRate: 128, // "about 50 %" [verified: 4 sources]; GamerGuides "rare: None" (IX-9)
      common: { itemId: 'sprint-shoes', count: 1 },
      rare: { itemId: 'sprint-shoes', count: 1 },
    },
    // Mission reward: the **Unwavering Guard** Garment Grid ("No Way Djose", IX-10) [verified: 5 sources].
    // Grids are not an `EnemyRewards` field; the results screen does not show it (the Chapter XI precedent).
    // Bribe: not possible (SinirothX, Split_Infinity, wiki), so there is no `bribe`.
  },
  abilityIds: ['x2-ixion-attack', 'x2-ixion-thundara', 'x2-ixion-aerospark', 'x2-ixion-recharge', 'x2-ixion-thors-hammer'],
  flags: { isBoss: true },
  sensorText: 'Water hurts him. Lightning feeds him. When he recharges, the hammer is next.',
  scanText: 'An aeon that once fought alongside Yuna.', // [SinirothX + zero_six]
};

/** The one link: `Djose Temple - Fayth - BOSS 229 Ixion 1`, Chapter 3 [SinirothX]. */
export const djoseIxionGroup: EnemyGroupDef = {
  id: DJOSE_IXION,
  game: 'ffx2',
  enemies: [x2Ixion],
  canEscape: false,
  musicCues: AEON_CUE,
  ...actionTime, // DJOSE_ACTION_TIME_ON: off until Bailey picks
};

export const ixionDjoseGroups: readonly EnemyGroupDef[] = [djoseIxionGroup];
