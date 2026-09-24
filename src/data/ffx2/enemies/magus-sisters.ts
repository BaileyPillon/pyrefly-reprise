/**
 * The Magus Sisters — link 2 of the Road to the Farplane (Chapter XI).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Formation
 * `Farplane - BOSS 228 Mindy 1 Sandy 1 Cindy 1` `[SinirothX]`. Every number is
 * `research/ffx2-fallen-aeons.md` §3.2 with that file's tags (rule 6).
 *
 * **One shared script for three bodies.** The FFX-2 setup never reads
 * `EnemyGroupDef.aiScriptId` (plan Review R2, 4.1 #2 refuted: only the FFX
 * setup applies it), so each sister ships the same per-enemy `aiScriptId:
 * 'magus-sisters'` and `src/battle/ffx2/ai/magus-sisters.ts` branches on her id —
 * the Vegnagun Redoubt precedent.
 *
 * **Thinking Period.** SinirothX lists 30 for each sister (0 on every other
 * aeon); its meaning is undocumented (F-10). The engine's field exists but
 * nothing reads it into `thinkingTicks`, so it is left unset: today's behaviour,
 * "acts immediately" (plan Review R2). Never implement it until it is understood.
 *
 * Staging (visual bible §1.22.6, `[estimate]` there): Sandy back left, Cindy
 * front, Mindy hovering on the right. Slots 0 / 1 / 2 in that order.
 */

import type { EnemyDef, StatusImmunities } from '../../../battle/common/types.ts';
import { STANDARD_AILMENT_IMMUNITY, STAT_MOD_IMMUNITY_5, DEF_MDEF_MOD_IMMUNITY } from './vegnagun-shared.ts';

/**
 * §3 common list plus §3.2's extras: Gravity is an element row; Stop is on the
 * common list; "Slow and every stat modifier (the Breaks do not land), Reflect"
 * `[SinirothX + wiki + Split_Infinity]`.
 */
export const SISTER_IMMUNITIES: StatusImmunities = {
  ...STANDARD_AILMENT_IMMUNITY,
  stop: 255,
  slow: 255,
  reflect: 255,
  ...STAT_MOD_IMMUNITY_5,
  ...DEF_MDEF_MOD_IMMUNITY,
};

/** The shared script id (`src/battle/ffx2/ai/magus-sisters.ts`). */
export const MAGUS_SISTERS_SCRIPT = 'magus-sisters';

interface SisterRow {
  id: 'sandy' | 'cindy' | 'mindy';
  name: string;
  slot: number;
  level: number;
  hp: number;
  str: number;
  mag: number;
  def: number;
  mdef: number;
  agi: number;
  eva: number;
  drop: string;
  /** Kept for the record; not shipped (see `drops`). */
  rareDrop: string;
  steal: string;
  abilityIds: string[];
  scan: string;
}

function sister(row: SisterRow): EnemyDef {
  return {
    id: row.id,
    name: row.name,
    spriteKey: row.id,
    slot: row.slot,
    // §3.2 [SinirothX + wiki]; HP [verified: 5 sources]. MP 9,999 and Accuracy 0 are
    // the §3 common block. Luck 4 each.
    stats: {
      hp: row.hp, mp: 9999, maxHp: row.hp, maxMp: 9999,
      str: row.str, mag: row.mag, def: row.def, mdef: row.mdef,
      agi: row.agi, eva: row.eva, luck: 4, acc: 0,
    },
    hp: row.hp,
    mp: 9999,
    level: row.level,
    affinities: { gravity: 'immune' }, // neutral to every other element (all sources)
    immunities: SISTER_IMMUNITIES,
    // "fract damage = Immune" on each sister's wiki infobox (plan Review R1) + SinirothX.
    immunityFlags: ['boss', 'immune-to-percentage-damage'],
    forms: [{ name: row.name, spriteKey: row.id, hp: row.hp }],
    aiScriptId: MAGUS_SISTERS_SCRIPT,
    rewards: {
      // F-4 [conflict]: AP 8 each (wiki, GamerGuides, Split_Infinity) against 15
      // (SinirothX). Three sources say 8.
      ap: 8,
      apOverkill: 8,
      gil: 1000, // EXP / gil / pilfer gil 3,000 / 1,000 / 3,000 each [verified: 3 sources]
      stolenGil: 3000,
      exp: 3000,
      overkillThreshold: 0,
      // Drop / rare drop [SinirothX + wiki + GamerGuides]. Only the common drop is
      // listed, the Bahamut precedent: no rare-drop rate is published.
      drops: [{ itemId: row.drop, count: 1 }],
      steal: {
        baseChance: 50, // no steal byte published for the Sisters: the house default, `[estimate]`
        common: { itemId: row.steal, count: 1 },
        rare: { itemId: row.steal, count: 1 },
      },
    },
    abilityIds: row.abilityIds,
    flags: { isBoss: true },
    // Our own in-world advice (writing-bible §5.3: Sensor text may be wrong); no
    // Scan copy for the Sisters is in the research, so none is invented.
    sensorText: row.scan,
  };
}

/** Sandy (mantis): tall, red. Evasion 33. */
export const sandy: EnemyDef = sister({
  id: 'sandy', name: 'Sandy', slot: 0, level: 45, hp: 10330,
  str: 40, mag: 17, def: 83, mdef: 84, agi: 83, eva: 33,
  drop: 'pixie-dust', rareDrop: 'crystal-gloves', steal: 'potpourri',
  abilityIds: ['x2-sandy-attack', 'x2-sandy-razzia', 'x2-magus-delta-attack'],
  scan: 'Evasion 33. Kill any one sister and Delta Attack is gone for good.',
});

/** Cindy (ladybug): rotund, blue with red spots. DEF 172 / MDEF 133. */
export const cindy: EnemyDef = sister({
  id: 'cindy', name: 'Cindy', slot: 1, level: 46, hp: 12240,
  str: 38, mag: 9, def: 172, mdef: 133, agi: 72, eva: 4,
  drop: 'faerie-earrings', rareDrop: 'pixie-dust', steal: 'white-cape',
  abilityIds: [
    'x2-cindy-camisade', 'x2-cindy-absorb', 'x2-cindy-demi', 'x2-cindy-regen',
    'x2-cindy-not-so-mighty-guard', 'x2-cindy-white-highwind', 'x2-magus-delta-attack',
  ],
  scan: 'Guards her sisters on her first turn. Dispel undoes it.',
});

/** Mindy (bee): the smallest, orange, hovers. Evasion 76, the lowest HP. */
export const mindy: EnemyDef = sister({
  id: 'mindy', name: 'Mindy', slot: 2, level: 44, hp: 9788,
  str: 28, mag: 8, def: 72, mdef: 121, agi: 89, eva: 76,
  drop: 'faerie-earrings', rareDrop: 'faerie-earrings', steal: 'x2-chaos-shock',
  abilityIds: [
    'x2-mindy-passado', 'x2-mindy-firaga', 'x2-mindy-blizzaga', 'x2-mindy-thundaga',
    'x2-mindy-waterga', 'x2-magus-delta-attack',
  ],
  scan: 'Evasion 76, the lowest HP of the three.',
});
