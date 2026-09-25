/**
 * Enemy group — **Yojimbo**, summoned by the unsent **Lady Ginnem**, with
 * **Daigoro**, in the last chamber of the Cavern of the Stolen Fayth.
 *
 * Source: `research/ffx-yojimbo.md` (candidate A, the recommendation of §1.2,
 * built on the driver's assumption B1). Yojimbo is `m288` / bestiary #141;
 * Daigoro is `m266` "Koma Inu"; Lady Ginnem is `m249` "Mira". The formation is
 * `[mira, yojimbo, koma_inu]`, forced condition *normal*, no forced party
 * [§2.5, decompiled: formations.json]. Boss rows live in
 * `./yojimbo-abilities.ts`; the gauge, its bands and the rotation live in
 * `src/battle/ffx/ai/yojimbo-rules.ts` and `./yojimbo.ts` beside it.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. An FFX CTB fight with aeons, an
 * enemy Overdrive gauge and Ronso Rage Doom. The FFX-2 Yojimbo ("Tourist
 * Trap", §8.2) is a different record with different rows and belongs to the
 * planned FFX-2 fallen-aeons chapter; nothing here may be reused for it.
 *
 * ---
 *
 * ## The design fact: Defense 80, Magic Defense 0
 *
 * Mitigation is 381 against Defense 80 and 725 against Magic Defense 1, so a
 * physical hit lands at about 52 % of what it does to a Defense-1 target and a
 * spell lands at full value (§2.1, §3.3 `[derived]`; the review recomputed
 * 381 / 725 = 0.526). Piercing does not help: he is not Armored, and Armor
 * Break is immune. **Lulu is the best attacker in her own fight.**
 *
 * ## The two bystanders (assumption B3, our estimate)
 *
 * No source says whether Lady Ginnem (HP 10) or Daigoro (HP 1) can be targeted
 * (§9 Y-5, Y-10). Killing either would be an unsourced shortcut past a
 * 33,000-HP boss, so both ship **untargetable** (`flags.untargetable`, which
 * `predicates.ts#targetable` and every AoE honour), with no HP bar, and the
 * setup hook marks both `nonCombatant` (never a victory condition) and
 * `ordersOnly` (no CTB turn of their own). Daigoro acts only on Yojimbo's
 * "Daigoro" order (`src/battle/ffx/orders.ts`); Ginnem never acts.
 *
 * ## Conflicts recorded rather than merged
 *
 * - **Y-3 Threaten** — the byte reads 0 (landable), the wiki says Immune.
 *   `threatenChance: 0` means **immune** in this contract: the Evrae C-4
 *   precedent and assumption B9, until a source settles it.
 * - **Immunities** — the review found the wiki infobox has no Confuse row and
 *   lists neither Auto-Life nor Slice; those three are `[decompiled]` only.
 *   We ship the decompile. Slice has no `ImmunityFlag` in the engine (it is a
 *   Zanmato-resistance byte, moot here).
 * - **Accuracy** — decompiled 0, the wiki prints 1. Unread: enemy actions use
 *   their own accuracy byte or always hit (`accuracy.ts`).
 * - **Zanmato level** — byte 402 = 0, level 1 under the 0-based rule; the
 *   wiki's "level 3" belongs to the possessed record `m169` (§2.1). Moot:
 *   Yuna does not own Yojimbo in this fight.
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import {
  DAIGORO_ATTACK,
  YOJIMBO_DAIGORO_ORDER,
  YOJIMBO_KOZUKA,
  YOJIMBO_WAKIZASHI,
  YOJIMBO_ZANMATO,
} from './yojimbo-abilities.ts';

/** Ids the engine, a future tactic and the tests all key on. */
export const YOJIMBO_ID = 'yojimbo';
export const DAIGORO_ID = 'daigoro';
export const GINNEM_ID = 'ginnem';
export const YOJIMBO_GROUP_ID = 'yojimbo-cavern';

/** AI script ids, registered in `src/battle/ffx/ai/yojimbo.ts`. */
export const YOJIMBO_SCRIPT = 'yojimbo-cavern';
export const YOJIMBO_BYSTANDER_SCRIPT = 'yojimbo-bystander';

/**
 * Lady Ginnem — `m249` "Mira" [§2.5, `[decompiled]` + wiki "Ginnem (boss)",
 * verified: 2 sources]. Internally an enemy, like other summoners.
 *
 * The research gives HP 10, Strength 7, Accuracy 10, Evasion 2, Luck 15, the
 * three status bytes and Doom 3. **Every other stat below is 0 and not
 * sourced**: none is ever read, because she owns no turn and cannot be
 * targeted. Not invented values; placeholders the contract requires.
 */
const ginnem: EnemyDef = {
  id: GINNEM_ID,
  name: 'Lady Ginnem',
  spriteKey: 'ginnem',
  slot: 0, // M1 — Yojimbo's Summon row (4:144) targets slot M1 [§3.1]
  stats: {
    hp: 10,
    mp: 0, // not in the research; unread
    str: 7,
    def: 0, // not in the research; unread
    mag: 0, // not in the research; unread
    mdef: 0, // not in the research; unread
    agi: 0, // not in the research; unread (no CTB turn)
    luck: 15,
    eva: 2,
    acc: 10,
    maxHp: 10,
    maxMp: 0,
  },
  hp: 10,
  mp: 0,
  affinities: {},
  // §2.5 [decompiled] — Sleep, Silence and Dark at 20; everything else 0.
  immunities: { sleep: 20, silence: 20, darkness: 20 } satisfies StatusImmunities,
  // Review, wiki "Ginnem (boss)" infobox — Sensor, Scan and Bribe immune (and
  // Threaten, which `threatenChance: 0` below carries).
  immunityFlags: ['immune-to-sensor', 'immune-to-scan', 'immune-to-bribe'],
  forms: [{ name: 'Lady Ginnem', spriteKey: 'ginnem', hp: 10 }],
  aiScriptId: YOJIMBO_BYSTANDER_SCRIPT,
  rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 1, drops: [] },
  abilityIds: [],
  // B3 (our estimate): scenery the party cannot touch.
  flags: { untargetable: true, hideHpBar: true },
  doomTurns: 3, // §2.5 [decompiled]
  threatenChance: 0, // review — the wiki infobox lists Threaten immune
};

/**
 * Yojimbo — `m288`, bestiary #141 [§2.1, `[decompiled]` + wiki; HP and the
 * overkill threshold verified: 3 sources]. Neutral to every element (§2.2).
 */
const yojimbo: EnemyDef = {
  id: YOJIMBO_ID,
  name: 'Yojimbo',
  spriteKey: 'yojimbo',
  slot: 1, // M2 [§2.5]
  stats: {
    hp: 33_000, // §2.1 [verified: 3 sources]
    mp: 2_000,
    str: 34,
    def: 80, // §2.1 [verified: 2 sources] — the design fact of the fight
    mag: 35,
    mdef: 0, // §2.1 [decompiled] — the formula clamps it to 1; the wiki prints 1
    agi: 32,
    luck: 15,
    eva: 0,
    acc: 0, // §2.1 [decompiled]; the wiki prints 1. Unread (see file header)
    maxHp: 33_000,
    maxMp: 2_000,
  },
  hp: 33_000,
  mp: 2_000,
  affinities: {}, // §2.2 [decompiled] — neutral to fire, ice, lightning, water and holy
  // §2.3 [decompiled] + wiki immunity list [verified: 2 sources, except
  // confuse and auto-life: decompiled only]. Doom is byte 0 and deliberately
  // OMITTED — **landable**, the sourced shortcut (§2.3, verified: 4 sources).
  // Shell, Protect, Reflect, Regen and Haste are byte 0 too: all landable.
  immunities: {
    ko: 255,
    zombie: 255,
    petrify: 255,
    poison: 255,
    'power-break': 255,
    'magic-break': 255,
    'armor-break': 255,
    'mental-break': 255,
    confuse: 255,
    berserk: 255,
    provoke: 255,
    sleep: 255,
    silence: 255,
    darkness: 255,
    slow: 255,
    scan: 255,
    eject: 255,
    'auto-life': 255,
  } satisfies StatusImmunities,
  // §2.3 [decompiled] + wiki [verified: 2 sources] — Demi and Gravity do
  // nothing, Sensor and Scan show nothing ("No Scan text exists"), Delay and
  // Bribe fail.
  immunityFlags: [
    'immune-to-percentage-damage',
    'immune-to-sensor',
    'immune-to-scan',
    'immune-to-delay',
    'immune-to-bribe',
  ],
  forms: [{ name: 'Yojimbo', spriteKey: 'yojimbo', hp: 33_000 }],
  aiScriptId: YOJIMBO_SCRIPT,
  // §2.4 [decompiled] + GameFAQs [verified: 2 sources] — no AP, no gil, no
  // drop, no steal. The real reward is the Chamber of the Fayth (§2.4, §7).
  rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 4_060, drops: [] },
  abilityIds: [YOJIMBO_DAIGORO_ORDER, YOJIMBO_KOZUKA, YOJIMBO_WAKIZASHI, YOJIMBO_ZANMATO],
  flags: { isBoss: true },
  poisonTickPercent: 25, // §2.1 [decompiled] — Poison-immune anyway
  doomTurns: 5, // §2.1 [decompiled] byte 119 [verified: 4 sources]
  zanmatoLevel: 1, // §2.1 [decompiled] byte 402 = 0 -> level 1 (moot)
  threatenChance: 0, // Y-3 / B9 — 0 means IMMUNE in this contract
};

/**
 * Daigoro — `m266` "Koma Inu" [§2.5, `[decompiled]`]. HP 1, **Strength 25**,
 * Luck 15, Sleep/Silence/Dark 20, Doom 5; immune to percentage damage, delay,
 * Sensor and Scan. Only action: row 4:177.
 *
 * Every stat the research does not give is 0 and unread (no CTB turn, no
 * targeting); Agility especially is moot, because the dog acts on Yojimbo's
 * turn, never its own.
 */
const daigoro: EnemyDef = {
  id: DAIGORO_ID,
  name: 'Daigoro',
  spriteKey: 'daigoro',
  slot: 2, // M3 — the slot Yojimbo's "Daigoro" row orders [§3.1]
  stats: {
    hp: 1,
    mp: 0, // not in the research; unread
    str: 25, // §2.5 [decompiled] — the Strength every Daigoro bite uses
    def: 0, // not in the research; unread
    mag: 0, // not in the research; unread
    mdef: 0, // not in the research; unread
    agi: 0, // not in the research; unread (no CTB turn)
    luck: 15,
    eva: 0, // not in the research; unread
    acc: 0, // not in the research; unread (enemy accuracy is never read)
    maxHp: 1,
    maxMp: 0,
  },
  hp: 1,
  mp: 0,
  affinities: {},
  immunities: { sleep: 20, silence: 20, darkness: 20 } satisfies StatusImmunities,
  immunityFlags: ['immune-to-percentage-damage', 'immune-to-delay', 'immune-to-sensor', 'immune-to-scan'],
  forms: [{ name: 'Daigoro', spriteKey: 'daigoro', hp: 1 }],
  aiScriptId: YOJIMBO_BYSTANDER_SCRIPT,
  rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 1, drops: [] },
  abilityIds: [DAIGORO_ATTACK],
  // B3 (our estimate): the dog is never a target.
  flags: { untargetable: true, hideHpBar: true },
  doomTurns: 5, // §2.5 [decompiled]
  threatenChance: 0, // untargetable anyway
};

export const yojimboGroup: EnemyGroupDef = {
  id: YOJIMBO_GROUP_ID,
  game: 'ffx',
  // §4.3 `[single source: wiki infobox]`, confirmed by the review: cannot
  // flee. The FFX engine reads `rt.canEscape`, which this sets false.
  canEscape: false,
  // Boss first, the house order (`turnQueue.ts#tieBreakRank`: "boss-first then
  // numbered ascending"), so every "first visible enemy" reader — the
  // battle-start card's headline, the chapter card's art — names Yojimbo, not
  // Lady Ginnem. The formation slots M1-M3 stay on each record's `slot`, which
  // is what the stage places by and what the Daigoro row orders (§3.1).
  enemies: [yojimbo, ginnem, daigoro],
  musicCues: [
    // The chapter's own battle cue in the "Lulu's Theme" slot (research §6.4
    // [verified: 2 sources]): "The Summoner's Sorrow", O-6 sketch A, Bailey's
    // pick (D-063). The pre scene starts it when Ginnem appears, so the battle
    // carries it on rather than restarting it. FFX only.
    { at: 'start', track: 'boss-yojimbo', fadeMs: 800 },
  ],
};

export default yojimboGroup;
