/**
 * Enemy group — **Seymour Natus** and **Mortibody**, the north end of the
 * Highbridge of Bevelle, before the Main Gate (Chapter X).
 *
 * Source: `research/ffx-seymour-natus-highbridge.md`. Natus is `m126` /
 * bestiary #116, Mortibody `m127` / #117; the formation `bosses.seymour_natus`
 * is `[seymour_natus, mortibody]` [§0 decompiled: formations.json]. Boss rows
 * live in `./seymour-natus-abilities.ts`; the three-phase script, the combo,
 * Desperado's trigger, the Talk table and the drain hook live in
 * `src/battle/ffx/ai/seymour-natus.ts` and `./seymour-natus-rules.ts`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. FFX-2 has no Natus, no
 * Mortibody and no Highbridge boss (research §0.3).
 *
 * **Not Chapter I's pair.** Mortibody has no Full-Life and Total Annihilation
 * is not in this fight (research §0.4, both corrections carried by the plan).
 * The three Seymour fights keep their own companion tables.
 *
 * ---
 *
 * ## The design fact: Defense 0, Magic Defense 0, behind 36,000 HP
 *
 * Every point lands at full value (research §1.1 `[derived]`). The wall is the
 * HP pool, Mortibody's Cura, the drain and the phase changes, not his
 * defences.
 *
 * ## Conflicts recorded rather than merged
 *
 * - **N-3 Threaten** — the byte reads 0 (landable), the wiki says Immune.
 *   `threatenChance: 0` means **immune** in this contract (B10, the Evrae C-4
 *   and Yojimbo Y-3 precedent) until a source settles it.
 * - **N-4 Mortibody's Luck** — decompile 20, wiki 15. The decompile wins.
 * - **Rewards** — the drop is **Lv. 2 Key Sphere ×2** (×4 on Overkill,
 *   `[single source]`) [§1.4, verified: 4 sources for ×2], but no
 *   `lv-2-key-sphere` item record exists in `src/data/ffx/items/`, and the
 *   reward-resolve test refuses an id that does not resolve. **Not shipped**;
 *   the item record belongs to the items owner (said in the track's report).
 * - **Slice** immunity has no `ImmunityFlag` (a Zanmato-resistance byte, as in
 *   `yojimbo.ts`); it is moot, Yuna does not own Yojimbo here.
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import {
  MORTIBODY_BLIZZARD,
  MORTIBODY_CURA,
  MORTIBODY_DESPERADO,
  MORTIBODY_FIRE,
  MORTIBODY_SHATTERING_CLAW,
  MORTIBODY_THUNDER,
  MORTIBODY_WATER,
  NATUS_BREAK,
  NATUS_FLARE,
  NATUS_MULTI_BLIZZARA,
  NATUS_MULTI_FIRA,
  NATUS_MULTI_THUNDARA,
  NATUS_MULTI_WATERA,
} from './seymour-natus-abilities.ts';

/** Ids the engine, a future tactic and the tests all key on. */
export const NATUS_ID = 'seymour-natus';
export const MORTIBODY_ID = 'mortibody';
export const NATUS_GROUP_ID = 'seymour-natus';

/** AI script ids, registered in `src/battle/ffx/ai/seymour-natus.ts`. */
export const NATUS_SCRIPT = 'seymour-natus';
export const MORTIBODY_SCRIPT = 'mortibody';

/**
 * Seymour Natus — `m126` [§1, `[decompiled]` + wiki; HP verified: 4 sources,
 * Overkill / AP verified: 3]. Neutral to every element (§1.2).
 */
const natus: EnemyDef = {
  id: NATUS_ID,
  name: 'Seymour Natus',
  spriteKey: 'seymour-natus', // no art exists (research §9); the stage falls back until O-1's pick is painted
  slot: 0, // M1 — Mortibody's Cura and Mortibsorption rows target slot M1 = Natus [§3.2]
  stats: {
    hp: 36_000, // §1.1 [verified: 4 sources]
    mp: 200, // §1.1 [decompiled] + wiki
    str: 30, // §1.1 — no Strength-formula action uses it (§3.1)
    def: 0, // §1.1 [decompiled] — the formula floors it to 1; the wiki prints 1
    mag: 25, // §1.1 [decompiled] + wiki
    mdef: 0, // §1.1 [decompiled] — floored to 1; the wiki prints 1
    agi: 21, // §1.1 [decompiled] + wiki — base CTB 10 ticks [derived]
    luck: 15,
    eva: 0,
    acc: 100,
    maxHp: 36_000,
    maxMp: 200,
  },
  hp: 36_000,
  mp: 200,
  affinities: {}, // §1.2 [decompiled] — neutral to fire, ice, thunder, water and holy
  // §1.3 [decompiled] + wiki immunity list [verified: 2 sources]. Poison is a
  // resistance of 50, landable at a reduced chance; Provoke, Power Break,
  // Shell/Protect/Reflect/Nul/Regen/Haste are byte 0 and omitted (landable).
  immunities: {
    poison: 50,
    ko: 255,
    zombie: 255,
    petrify: 255,
    'magic-break': 255,
    'armor-break': 255,
    'mental-break': 255,
    confuse: 255,
    berserk: 255,
    sleep: 255,
    silence: 255,
    darkness: 255,
    slow: 255,
    eject: 255,
    'auto-life': 255,
    doom: 255,
  } satisfies StatusImmunities,
  // §1.3 flags [decompiled] + wiki ("demi", "delay", "bribe" Immune):
  // Demi and Gravity do nothing, Life and Phoenix Down do nothing, Delay
  // fails, Bribe fails. Not Scan- or Sensor-immune. `boss` blocks Flee.
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-life', 'immune-to-delay', 'immune-to-bribe'],
  forms: [{ name: 'Seymour Natus', spriteKey: 'seymour-natus', hp: 36_000 }],
  aiScriptId: NATUS_SCRIPT,
  rewards: {
    ap: 6_300, // §1.1 [verified: 3 sources]
    apOverkill: 9_450, // §1.1 [verified: 3 sources]
    gil: 3_500, // §1.1 [decompiled] + wiki + GameFAQs
    overkillThreshold: 3_500, // §1.1 [verified: 3 sources]
    drops: [], // Lv. 2 Key Sphere ×2 is sourced but has no item record — see the file header
    steal: {
      baseChance: 100, // §1.4 [decompiled byte 255, clamped to the contract's 0-100]
      common: { itemId: 'tetra-elemental', count: 2 }, // §1.4 [verified: 4 sources]
      rare: { itemId: 'tetra-elemental', count: 3 }, // §1.4 [verified: 4 sources]
    },
    // §1.4 [decompiled] — the record holds a Potion ×1 that can never be bribed.
    bribe: { item: { itemId: 'potion', count: 1 }, immune: true },
  },
  abilityIds: [
    NATUS_MULTI_FIRA, // §3.1 6:171
    NATUS_MULTI_BLIZZARA, // §3.1 6:173
    NATUS_MULTI_THUNDARA, // §3.1 6:175
    NATUS_MULTI_WATERA, // §3.1 6:177
    NATUS_BREAK, // §3.1 6:79
    NATUS_FLARE, // §3.1 3:82
    'banish', // §3.1 6:80 — Chapter I's record, the same row
    'protect', // §3.1 3:59 — the 24,000 counter, the shared player row
  ],
  flags: { isBoss: true },
  // §1.5, in our own words (the game's wording is never copied).
  sensorText: 'Casts elemental magic, then Break, then Flare.',
  scanText:
    'Doubles the elemental spell his body has just cast. Wounded, he turns people to stone with Break, then casts Flare. Banishes aeons.',
  poisonTickPercent: 4, // §1.1 [verified: 3 sources] — 4 % of 36,000 = 1,440 a tick
  doomTurns: 30, // §1.1 [decompiled] byte — Doom-immune anyway
  zanmatoLevel: 4, // §1.1 [verified: 2 sources] — moot, no Yojimbo yet
  threatenChance: 0, // N-3 / B10 — 0 means IMMUNE in this contract
};

/**
 * Mortibody — `m127` [§2, `[decompiled]` + wiki; HP / Def / Agi / Overkill
 * verified: 3 sources]. A part of Natus (`isPart`), like Chapter I's
 * Mortiorchis: it has no death state of its own, it drains him and comes back
 * (`ai/seymour-natus-rules.ts#runNatusMortibsorption`), and the battle ends
 * when **Natus** dies (§4.5, N-10 `[derived]`).
 */
const mortibody: EnemyDef = {
  id: MORTIBODY_ID,
  name: 'Mortibody',
  spriteKey: 'mortibody', // no art exists (research §9)
  slot: 1, // M2 [§0 formations.json]
  stats: {
    hp: 4_000, // §2.1 [verified: 3 sources]
    mp: 50, // §2.1 [decompiled] + wiki
    str: 22, // §2.1 — the Strength Shattering Claw uses
    def: 50, // §2.1 [verified: 3 sources]
    mag: 20, // §2.1 — the Magic its spells and Cura use
    mdef: 0, // §2.1 [decompiled]; the wiki prints 1
    agi: 28, // §2.1 [verified: 3 sources] — base CTB 9 ticks: it acts slightly more often [derived]
    luck: 20, // §2.1 [decompiled]; the wiki says 15 (N-4, the decompile wins)
    eva: 0,
    acc: 100,
    maxHp: 4_000,
    maxMp: 50,
  },
  hp: 4_000,
  mp: 50,
  affinities: {},
  // §2.2 [decompiled] + wiki [verified: 2 sources]. Armor Break is a
  // resistance of 50; Power Break, Threaten, Delay and the buffs are byte 0
  // and omitted (landable) — Power Break halves Shattering Claw (§2.2).
  immunities: {
    'armor-break': 50,
    ko: 255,
    zombie: 255,
    petrify: 255,
    poison: 255,
    'magic-break': 255,
    'mental-break': 255,
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
  // §2.2 flags [decompiled] + wiki. Delay is landable here (GameFAQs lists it
  // as a vulnerability), which is the whole difference from Natus.
  immunityFlags: ['immune-to-percentage-damage', 'immune-to-life', 'immune-to-bribe'],
  forms: [{ name: 'Mortibody', spriteKey: 'mortibody', hp: 4_000 }],
  aiScriptId: MORTIBODY_SCRIPT,
  // §2.1 [verified: 3 sources] — no AP, gil, steal or drop; Overkill 36,000
  // (it effectively cannot be Overkilled).
  rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 36_000, drops: [] },
  abilityIds: [
    MORTIBODY_FIRE, // §3.2 6:57
    MORTIBODY_BLIZZARD, // §3.2 6:58
    MORTIBODY_THUNDER, // §3.2 6:59
    MORTIBODY_WATER, // §3.2 6:60
    MORTIBODY_SHATTERING_CLAW, // §3.2 6:118
    MORTIBODY_DESPERADO, // §3.2 6:94
    MORTIBODY_CURA, // §3.2 3:44
    'mortibsorption', // §3.2 6:169 — the reaction; resolved by `scripted.ts#mortibsorption`, never scheduled
  ],
  flags: { isPart: true, partOf: NATUS_ID },
  // §2.3, in our own words.
  sensorText: 'Watch what it casts: its master answers in kind.',
  scanText: 'Shattering Claw breaks petrified people apart. Desperado hurts everyone and strips their protective magic.',
  poisonTickPercent: 25, // §2.1 [decompiled] — Poison-immune anyway
};

export const seymourNatusGroup: EnemyGroupDef = {
  id: NATUS_GROUP_ID,
  game: 'ffx',
  // §4.5 `[single source: wiki infobox]`: the party cannot escape. The FFX
  // engine reads `rt.canEscape`, which this sets false.
  canEscape: false,
  enemies: [natus, mortibody],
  // No `musicCues`: the chapter's own cue (B15, O-6) is not composed yet, so
  // the chapter record's placeholder routing applies.
};

export default seymourNatusGroup;
