/**
 * Chapter XV — the Den of Woe under Mushroom Rock Road: the three shades fought
 * back to back, Baralai → Gippal → Nooj.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2
 * status set (research `ffx2-gippal-den-of-woe.md` header). The shades are
 * illusions "fused with pyreflies" (scan texts, `[verified: 2 sources]`), so they
 * get their own ids (`shade-*`), never the men's: Chapter V's story names the
 * people, and the guide's per-chapter lookup must not match them.
 *
 * Bailey, 2026-09-25, "I'll go with all your recommendations"
 * (`docs/plans/chapter-gippal-review.md`):
 * - **GP1 b:** the three shades, in the sourced order, one encounter with no break
 *   `[verified: 4 sources]`; the possessed Rikku and Paine duels are not built.
 * - **GP3 a:** links 2 and 3 carry everything (`carriesFullPartyState`): HP, MP,
 *   KO, items, and the statuses, worn dressphere and grid progress `[derived]`.
 * - **GP4 c, built as a:** no Save Sphere and no checkpoint, so a loss on any link
 *   retries from Baralai (faithful, today's flow). The benches measure it first.
 * - **GP9:** the dump's values: Baralai HP 12,220 (G-1), Drill Shot at 8 (G-5),
 *   Nooj gil 30,000 (G-3), Gippal's drop Kaiser Knuckles (G-4).
 * - **GP12:** the formations' `Weapon[..]` entries (G-10) are props, not targets.
 * - **GP16 a, stand-in b:** the new cue `boss-den-of-woe` is not composed yet, so
 *   every link plays `boss-shuyin` (the plan's named stand-in) until it is.
 *
 * Every stat is §3 with its tag, carried verbatim (rule 6). Common to all three
 * (§3.2 row "Extra immunities"): Gravity, Death, Petrify, Sleep, Silence,
 * Darkness, Poison, Confuse, Berserk, Curse, Eject, Slow, Stop, Doom, Delay,
 * Interrupt and fractional damage; **the Breaks land** `[derived]`. "Cannot
 * escape" on all three (the wiki). Oversoul values are left out (§3).
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import { STANDARD_AILMENT_IMMUNITY } from './vegnagun-shared.ts';

export const DEN_BARALAI = 'ffx2-den-baralai';
export const DEN_GIPPAL = 'ffx2-den-gippal';
export const DEN_NOOJ = 'ffx2-den-nooj';
/** The three links in play order. */
export const DEN_OF_WOE_CHAIN_ORDER = [DEN_BARALAI, DEN_GIPPAL, DEN_NOOJ] as const;

/** The §3 list for every shade: the standard block plus Slow and Stop. */
export const SHADE_IMMUNITIES: StatusImmunities = { ...STANDARD_AILMENT_IMMUNITY, slow: 255, stop: 255 };

/** GP16's stand-in, on every link, until `boss-den-of-woe` is auditioned. */
const DEN_CUE = [{ at: 'start' as const, track: 'boss-shuyin' as const, fadeMs: 800 }];

/** Gippal (shade), bestiary #241 (§3.1). */
export const shadeGippal: EnemyDef = {
  id: 'shade-gippal',
  name: 'Gippal',
  spriteKey: 'gippal-shade', // the installed painting, `characters/gippal-shade/` (O-1 B)
  slot: 0,
  stats: {
    hp: 14800, // [verified: 5 sources]
    mp: 235, // [verified: 5 sources]
    maxHp: 14800,
    maxMp: 235,
    str: 73, // STR / MAG / DEF / MDEF [verified: 2 sources]
    mag: 55,
    def: 68,
    mdef: 33,
    agi: 118, // Agility / Evasion / Luck / Accuracy: SinirothX + wiki (wiki omits Accuracy)
    eva: 23,
    luck: 6,
    acc: 0,
  },
  hp: 14800,
  mp: 235,
  level: 56, // [verified: 2 sources]
  affinities: { gravity: 'immune' }, // all neutral otherwise
  immunities: SHADE_IMMUNITIES, // [verified: 3 sources]
  // Fractional: SinirothX + Split_Infinity (`%DMG`) [verified: 2 sources]; the wiki
  // infobox has no fractional row (plan Review item 4).
  immunityFlags: ['boss', 'immune-to-percentage-damage'],
  forms: [{ name: 'Gippal', spriteKey: 'gippal-shade', hp: 14800 }],
  aiScriptId: 'shade-gippal',
  rewards: {
    ap: 5, // EXP / AP / Gil / Pilfer gil [verified: 3 sources]
    apOverkill: 5,
    gil: 5000,
    stolenGil: 15000,
    exp: 1200,
    overkillThreshold: 0,
    drops: [{ itemId: 'kaiser-knuckles', count: 1 }], // drop and rare drop; G-4
    steal: {
      baseChance: 50, // no source gives it (only the rate below): the house default, `[estimate]`
      stealRate: 128, // White Lore (both), steal rate 128
      common: { itemId: 'white-lore', count: 1 },
      rare: { itemId: 'white-lore', count: 1 },
    },
  },
  abilityIds: [
    'x2-den-gippal-attack', 'x2-den-gippal-grinder', 'x2-den-gippal-bullseye', 'x2-den-gippal-mortar',
    'x2-den-gippal-potion-plus', 'x2-den-gippal-flash-bomb', 'x2-den-gippal-hush-grenade',
  ],
  flags: { isBoss: true },
  sensorText: 'Grinder, a kick, Grinder, a kick, then Bullseye. Below a third of his HP the order breaks, and Mortar joins it.',
  // Paraphrase of the scan [SinirothX + wiki]; our words (rule 8).
  scanText: 'His anger from two years ago, met by Shuyin\'s despair and fused with pyreflies.',
};

/** Baralai (shade), bestiary #240 (§3.2). */
export const shadeBaralai: EnemyDef = {
  id: 'shade-baralai',
  name: 'Baralai',
  spriteKey: 'baralai-shade', // the installed painting, `characters/baralai-shade/` (O-1 B)
  slot: 0,
  stats: {
    hp: 12220, // G-1: 12,220 [verified: 4 sources]; the wiki's 1,220 drops a digit
    mp: 720,
    maxHp: 12220,
    maxMp: 720,
    str: 68, // SinirothX + wiki [verified: 2 sources]
    mag: 67,
    def: 67,
    mdef: 26,
    agi: 112,
    eva: 12,
    luck: 6,
    acc: 0,
  },
  hp: 12220,
  mp: 720,
  level: 52,
  affinities: { gravity: 'immune' },
  immunities: SHADE_IMMUNITIES,
  immunityFlags: ['boss', 'immune-to-percentage-damage'],
  forms: [{ name: 'Baralai', spriteKey: 'baralai-shade', hp: 12220 }],
  aiScriptId: 'shade-baralai',
  rewards: {
    ap: 5, // EXP / AP / Gil / Pilfer gil [verified: 2 sources; 5 for HP, MP, EXP, AP, gil]
    apOverkill: 5,
    gil: 200,
    stolenGil: 300,
    exp: 1200,
    overkillThreshold: 0,
    drops: [{ itemId: 'crystal-ball', count: 1 }],
    steal: {
      baseChance: 50, // the house default, `[estimate]`; no steal byte is printed for him
      common: { itemId: 'natures-lore', count: 1 },
      rare: { itemId: 'natures-lore', count: 1 },
    },
  },
  abilityIds: [
    'x2-den-baralai-attack', 'x2-den-baralai-glint', 'x2-den-baralai-triple-attack',
    'x2-den-baralai-looming-glacier', 'x2-den-baralai-silence', 'x2-den-baralai-absorb',
    'x2-den-baralai-regen', 'x2-den-baralai-not-so-mighty-guard', 'x2-den-baralai-drill-shot',
  ],
  flags: { isBoss: true },
  sensorText: 'He counts every blow. At eight, the last girl to hit him loses three quarters of her maximum HP.',
  scanText: 'His sorrow from two years ago, met by Shuyin\'s despair and fused with pyreflies.',
};

/** Nooj (shade), bestiary #242 (§3.2). */
export const shadeNooj: EnemyDef = {
  id: 'shade-nooj',
  name: 'Nooj',
  spriteKey: 'nooj-shade', // the installed idle, `characters/nooj-shade/` (D-182: every pose on the idle)
  slot: 0,
  stats: {
    hp: 23800, // [verified: 5 sources]
    mp: 720,
    maxHp: 23800,
    maxMp: 720,
    str: 75, // SinirothX + wiki [verified: 2 sources]
    mag: 101,
    def: 144,
    mdef: 103,
    agi: 121,
    eva: 0,
    luck: 8,
    acc: 0,
  },
  hp: 23800,
  mp: 720,
  level: 63,
  affinities: { gravity: 'immune' },
  immunities: SHADE_IMMUNITIES,
  immunityFlags: ['boss', 'immune-to-percentage-damage'],
  forms: [{ name: 'Nooj', spriteKey: 'nooj-shade', hp: 23800 }],
  aiScriptId: 'shade-nooj',
  rewards: {
    ap: 10,
    apOverkill: 10,
    gil: 30000, // G-3: 30,000 [4 sources] against the wiki's 3,000
    stolenGil: 20000,
    exp: 1800,
    overkillThreshold: 0,
    drops: [{ itemId: 'magical-dances-vol-1', count: 1 }],
    steal: {
      baseChance: 50, // the house default, `[estimate]`
      common: { itemId: 'arcane-lore', count: 1 },
      rare: { itemId: 'arcane-lore', count: 1 },
    },
    // Reward of note for clearing the Den: the Supreme Light Garment Grid [verified: 2
    // sources]. Grids are not an `EnemyRewards` field; the results screen does not show it.
  },
  abilityIds: ['x2-den-nooj-attack', 'x2-den-nooj-rippling-chroma', 'x2-den-nooj-greedy-aura', 'x2-den-nooj-lightfall'],
  flags: { isBoss: true },
  sensorText: 'Defense 144, Magic Defense 103. Once, near the end, Lightfall: 5,000 to everyone.',
  scanText: 'His despair from two years ago, met by Shuyin\'s and fused with pyreflies.',
};

/** Link 1: Baralai. `Sealed Cave - BOSS 227 Baralai` [SinirothX]. */
export const denBaralaiGroup: EnemyGroupDef = {
  id: DEN_BARALAI,
  game: 'ffx2',
  enemies: [shadeBaralai],
  canEscape: false,
  nextGroupId: DEN_GIPPAL,
  musicCues: DEN_CUE,
};

/**
 * **GP4, OFF: where a retry starts.** `false` is the build of Bailey's GP4 c ("measure first, then
 * ask once", with a as the build): a loss anywhere retries from Baralai, as the game's own reload
 * does. `true` is GP4 b: a loss on Gippal or Nooj retries that link from the state the party entered
 * it on, through the checkpoint seam Chapter XIII's Trema uses (`checkpointOnEntry`,
 * `app/screens/BattleChainCheckpoint.ts`). Numbers: `docs/plans/den-of-woe-options-2026-09-25.md`.
 * Change only on Bailey's word.
 */
export const DEN_OF_WOE_RETRY_FROM_LINK: boolean = false;

/** `group` as a retry checkpoint (GP4 b). */
export function withRetryFromLink(group: EnemyGroupDef): EnemyGroupDef {
  return { ...group, checkpointOnEntry: true };
}

/** Link 2: Gippal. `Sealed Cave - BOSS 226 Gippal` [SinirothX]. */
const denGippalLink: EnemyGroupDef = {
  id: DEN_GIPPAL,
  game: 'ffx2',
  enemies: [shadeGippal],
  canEscape: false,
  nextGroupId: DEN_NOOJ,
  musicCues: DEN_CUE,
  carriesFullPartyState: true, // GP3 a
};

/** Link 2 as the chapter registers it: a retry checkpoint only under GP4 b. */
export const denGippalGroup: EnemyGroupDef = DEN_OF_WOE_RETRY_FROM_LINK ? withRetryFromLink(denGippalLink) : denGippalLink;

/** Link 3: Nooj. `Sealed Cave - BOSS 225 Nooj` [SinirothX]. */
const denNoojLink: EnemyGroupDef = {
  id: DEN_NOOJ,
  game: 'ffx2',
  enemies: [shadeNooj],
  canEscape: false,
  musicCues: DEN_CUE,
  carriesFullPartyState: true, // GP3 a
};

/** Link 3 as the chapter registers it: a retry checkpoint only under GP4 b. */
export const denNoojGroup: EnemyGroupDef = DEN_OF_WOE_RETRY_FROM_LINK ? withRetryFromLink(denNoojLink) : denNoojLink;

export const denOfWoeGroups: readonly EnemyGroupDef[] = [denBaralaiGroup, denGippalGroup, denNoojGroup];
