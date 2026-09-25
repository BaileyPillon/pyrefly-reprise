/**
 * Enemy group — **Seymour Omnis** and the four **Mortiphasms**, the Garden of
 * Pain inside Sin (Chapter XII).
 *
 * Source: `research/ffx-seymour-omnis.md`. Omnis is `m131` / bestiary #178,
 * each disc `m106`; the formation `bosses.seymour_omnis` is
 * `[seymour_omnis, mortiphasm ×4]`, **no forced party** [§0 decompiled:
 * formations.json]. Boss rows live in `./seymour-omnis-abilities.ts`; the
 * discs, the affinity ladder, the attack counter, Dispel → Ultima and the
 * reset live in `src/battle/ffx/ai/seymour-omnis-rules.ts` and
 * `./seymour-omnis.ts` beside it.
 *
 * **Game case: FFX only** [AGENTS.md rule 14] (research §0.3).
 *
 * ## The design fact: a fresh Omnis shrugs off everything
 *
 * Defense 180 and Magic Defense 100 behind 80,000 HP (§3.3 `[derived]`: a
 * Strength-40 Attack does 297). Armor Break and Mental Break both land (§1.3),
 * and the Dispel window drops his Defense to 100. The danger is four -ga in one
 * turn and Ultima, not the attrition. **Never tuned** (rule 6, §5).
 *
 * ## Conflicts and gaps recorded rather than merged
 *
 * - **O-1 HP** — GameFAQs prints 60,000; the decompile, wiki, Jegged and the
 *   LP say **80,000** (4 to 1).
 * - **O-2 / B13 Threaten** — the byte reads 0 (landable), the wiki says
 *   Immune. `threatenChance: 0` means **immune** in this contract (Bailey,
 *   B13 = immune, the Natus N-3 precedent).
 * - **Rewards** — the drop's rare quantity (×2) and the Overkill quantities
 *   (×2 / ×4, `[single source: decompile]`) have no field in `EnemyRewards`,
 *   which carries one guaranteed list: the common Lv. 3 Key Sphere ×1 ships.
 *   The steal counts are not printed by any source; ×1 is the singular reading.
 * - **Slice** immunity has no `ImmunityFlag` (a Zanmato-resistance byte);
 *   `zanmatoLevel: 4` carries it (Yojimbo is not in this preset, B3 = a).
 * - **Accuracy / Evasion** 0 / 0 [decompiled] (the wiki prints accuracy 1);
 *   moot, he has no physical action.
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import {
  OMNIS_BLIZZAGA,
  OMNIS_BLIZZARA,
  OMNIS_DISPEL,
  OMNIS_FIRA,
  OMNIS_FIRAGA,
  OMNIS_THUNDAGA,
  OMNIS_THUNDARA,
  OMNIS_ULTIMA,
  OMNIS_VOLLEY,
  OMNIS_WATERA,
  OMNIS_WATERGA,
} from './seymour-omnis-abilities.ts';

/** Ids the engine, the tests and a future tactic key on. */
export const OMNIS_ID = 'seymour-omnis';
export const OMNIS_GROUP_ID = 'seymour-omnis';
/** The four discs, left to right as the party faces them (B12 = a reads them in this order). */
export const MORTIPHASM_IDS = ['mortiphasm-1', 'mortiphasm-2', 'mortiphasm-3', 'mortiphasm-4'] as const;

/** AI script ids, registered in `src/battle/ffx/ai/seymour-omnis.ts`. */
export const OMNIS_SCRIPT = 'seymour-omnis';
export const MORTIPHASM_SCRIPT = 'mortiphasm';

/**
 * Seymour Omnis — `m131` [§1, `[decompiled]` + wiki; HP verified: 4 sources,
 * Overkill / AP verified: 3]. The record is neutral to every element (§1.2);
 * the discs overwrite Fire, Ice, Thunder and Water from the first tick
 * (`seymour-omnis-rules.ts#applyOmnisSetup`). Holy is never touched.
 */
const omnis: EnemyDef = {
  id: OMNIS_ID,
  name: 'Seymour Omnis',
  spriteKey: 'seymour-omnis', // no art yet (O-1 picked, not painted); the stage falls back without it
  slot: 0,
  stats: {
    hp: 80_000, // §1.1 [verified: 4 sources] — O-1
    mp: 999, // §1.1 [decompiled] + wiki
    str: 20, // §1.1 — no Strength-formula action uses it (§3.1)
    def: 180, // §1.1 [decompiled] + wiki — 100 after each Dispel, 150 after each Ultima (the AI script)
    mag: 35, // §1.1 [decompiled] + wiki
    mdef: 100, // §1.1 [decompiled] + wiki
    agi: 40, // §1.1 [decompiled] + wiki — base CTB 7 ticks [derived]
    luck: 20, // §1.1 [decompiled] + wiki
    eva: 0, // §1.1 [decompiled]
    acc: 0, // §1.1 [decompiled] (the wiki prints 1); moot, no physical action
    maxHp: 80_000,
    maxMp: 999,
  },
  hp: 80_000,
  mp: 999,
  affinities: {}, // §1.2 [decompiled] — the discs set the four elements at setup
  // §1.3 [decompiled] + wiki immunity list [verified: 2 sources]. Armor Break
  // and Mental Break are byte 0 and omitted (landable, §1.3 verified: 4
  // sources); so are Shell/Protect/Reflect/Nul/Regen/Haste. Threaten: B13.
  immunities: {
    ko: 255,
    zombie: 255,
    petrify: 255,
    poison: 255,
    'power-break': 255,
    'magic-break': 255,
    confuse: 255,
    berserk: 255,
    provoke: 255,
    sleep: 255,
    silence: 255,
    darkness: 255,
    slow: 255,
    eject: 255,
    'auto-life': 255,
    doom: 255,
  } satisfies StatusImmunities,
  // §1.3 flags [decompiled] + wiki ("demi / delay / bribe = Immune"): Demi and
  // Gravity do nothing, Life and Phoenix Down do nothing, Delay fails, Bribe
  // fails. Not Scan- or Sensor-immune. `boss` blocks Flee (§1.1 "the party
  // cannot escape", single source: wiki; the group sets `canEscape: false`).
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-life', 'immune-to-delay', 'immune-to-bribe'],
  forms: [{ name: 'Seymour Omnis', spriteKey: 'seymour-omnis', hp: 80_000 }],
  aiScriptId: OMNIS_SCRIPT,
  rewards: {
    ap: 24_000, // §1.1 [verified: 3 sources]
    apOverkill: 36_000, // §1.1 [verified: 3 sources]
    gil: 12_000, // §1.1 [decompiled] + wiki + GameFAQs
    overkillThreshold: 15_000, // §1.1 [verified: 3 sources]
    drops: [{ itemId: 'lv-3-key-sphere', count: 1 }], // §1.4 [verified: 3 sources] — the common ×1; see the header
    steal: {
      baseChance: 100, // §1.4 [decompiled byte 255, clamped to the contract's 0-100]
      common: { itemId: 'shining-gem', count: 1 }, // §1.4 [verified: 4 sources]; count: the singular reading
      rare: { itemId: 'supreme-gem', count: 1 }, // §1.4 [verified: 4 sources]; count: the singular reading
    },
    // §1.4 [decompiled] — the record holds a Potion ×1 that can never be bribed.
    bribe: { item: { itemId: 'potion', count: 1 }, immune: true },
  },
  abilityIds: [
    OMNIS_VOLLEY, // the four disc spells as one turn (the engine's seam, not a game row)
    OMNIS_FIRA, // §3.1 3:69
    OMNIS_BLIZZARA, // §3.1 3:70
    OMNIS_THUNDARA, // §3.1 3:71
    OMNIS_WATERA, // §3.1 3:72
    OMNIS_FIRAGA, // §3.1 3:73
    OMNIS_BLIZZAGA, // §3.1 3:74
    OMNIS_THUNDAGA, // §3.1 3:75
    OMNIS_WATERGA, // §3.1 3:76
    OMNIS_DISPEL, // §3.1 3:61
    OMNIS_ULTIMA, // §3.1 6:240
  ],
  flags: { isBoss: true },
  // §1.5, in our own words (the game's wording is never copied).
  sensorText: 'The four discs behind him feed his magic.',
  scanText:
    'He casts only what the discs point at him, and they decide what hurts him. A blow turns a disc left, a spell turns it right.',
  zanmatoLevel: 4, // §1.1 [verified: 2 sources] — byte 3, 0-based
  threatenChance: 0, // O-2 / B13 — 0 means IMMUNE in this contract
};

/**
 * One Mortiphasm — `m106` [§2, `[decompiled]` + wiki]. A **part** of Omnis
 * (`isPart`): it is immune to all damage, never dies and never counts toward
 * victory (§4.6 `[derived]`). It owns **no turn** (B22 = a, our estimate: the
 * decompile lists no actions; `applyOmnisSetup` marks it `ordersOnly`). It is
 * **out of melee reach** (only Wakka, Valefor, Anima and Mindy reach it
 * physically, §2 verified: 4 sources) and **never a random pick** (§2, single
 * source: GameFAQs).
 */
function mortiphasm(id: string, slot: number): EnemyDef {
  return {
    id,
    name: 'Mortiphasm',
    spriteKey: 'mortiphasm', // no art yet (O-2 picked, not painted)
    slot,
    // §2 [decompiled]: HP / MP and every stat 1; Defense, Magic Defense and
    // Agility 0 in the record (the wiki prints 1). Moot: immune to damage, no turns.
    stats: { hp: 1, mp: 1, str: 1, def: 0, mag: 1, mdef: 0, agi: 0, luck: 1, eva: 1, acc: 1, maxHp: 1, maxMp: 1 },
    hp: 1,
    mp: 1,
    affinities: {},
    // §2 [decompiled] + wiki: immune to every status that matters (255).
    immunities: {
      ko: 255,
      zombie: 255,
      petrify: 255,
      poison: 255,
      silence: 255,
      sleep: 255,
      darkness: 255,
      slow: 255,
      haste: 255,
      berserk: 255,
      confuse: 255,
      doom: 255,
      curse: 255,
      provoke: 255,
      protect: 255,
      shell: 255,
      reflect: 255,
      regen: 255,
      nulblaze: 255,
      nulfrost: 255,
      nulshock: 255,
      nultide: 255,
      'auto-life': 255,
      eject: 255,
      'power-break': 255,
      'magic-break': 255,
      'armor-break': 255,
      'mental-break': 255,
    } satisfies StatusImmunities,
    // §2 [verified: 2 sources]: immune to all damage, to Scan and to Sensor.
    immunityFlags: ['immune-to-damage', 'immune-to-scan', 'immune-to-sensor', 'immune-to-life'],
    forms: [{ name: 'Mortiphasm', spriteKey: 'mortiphasm', hp: 1 }],
    aiScriptId: MORTIPHASM_SCRIPT,
    rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 1, drops: [] }, // §2 [decompiled] + wiki: none
    abilityIds: [], // Turns Left / Turns Right are reactions, not rows (B22 = a)
    flags: {
      isPart: true,
      partOf: OMNIS_ID,
      outOfMeleeReach: true, // §2 [verified: 4 sources]
      neverRandomTarget: true, // §2 [single source: GameFAQs]
      hideHpBar: true, // our estimate: a 1-HP bar on an unkillable disc says nothing true
    },
    threatenChance: 0, // §2: Threaten byte 0, wiki Immune — immune, as B13 for Omnis
  };
}

export const seymourOmnisGroup: EnemyGroupDef = {
  id: OMNIS_GROUP_ID,
  game: 'ffx',
  // §1.1 [single source: wiki infobox]: the party cannot escape.
  canEscape: false,
  enemies: [omnis, ...MORTIPHASM_IDS.map((id, i) => mortiphasm(id, i + 1))],
  // No `musicCues`: the chapter's cue (B18 = a) is not composed, so the
  // chapter record's placeholder routing applies.
};

export default seymourOmnisGroup;
