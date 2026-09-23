/**
 * Enemy group — **Seymour + two Guado Guardians + Anima**, the antechamber of
 * the Chamber of the Fayth, Macalania Temple.
 *
 * Source: `research/ffx-seymour-anima-macalania.md`. Seymour is `m124` /
 * bestiary #077; the Guado Guardian is `m141` / #078 (the **Macalania Temple**
 * variant); Anima is `m125` / #079. Boss-only `AbilityDef`s live in
 * `./seymour-anima-macalania-abilities.ts`; the three acts live in
 * `src/battle/ffx/ai/seymour-anima-macalania.ts`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. FFX party, FFX CTB engine, FFX
 * aeons, FFX Nul spells. `tests/unit/chapters/macalania-engine.test.ts` carries
 * the absence test for the other game.
 *
 * ---
 *
 * ## The three acts, as data
 *
 * | Act | Entry | Exit |
 * |---|---|---|
 * | **1** | Both Guardians open Protected, Seymour opens Shelled (applied at setup, §5.2) | Seymour's HP reaches **3,000** → he summons Anima and **every living Guardian dies** |
 * | **2** | Anima arrives in slot 3 (M4); Seymour stays on the field and idles | Anima at 0 HP → "Seymour dismisses Anima!" and she is removed |
 * | **3** | Seymour returns to **6,000 HP** with **Magic 25 → 32** | Seymour dead |
 *
 * **He cannot be killed before he summons.** We ship the HD behaviour (our
 * declared baseline): every hit on him is clamped to **5,999** and his HP is
 * floored at **1** until the summon script has run [§5.2, verified: 2 sources].
 * The PS2 softlock is a bug; reproducing it would be an own goal.
 *
 * **There is no alternation guard here.** The "two turns in a row → no-op"
 * rule is specific to the Flux fight; §5.1 says explicitly not to copy it.
 *
 * ## Anima ships in `parts`, and that is load-bearing
 *
 * She is not a limb, but `EnemyGroupDef.parts` is the shipped mechanism for a
 * combatant that joins and leaves a formation without ending it, and it gives
 * three behaviours this encounter needs for free:
 * - `koActor` takes a part off the field on death and emits `part-destroyed` —
 *   which *is* act two's exit ("she is removed", §5.3);
 * - `engine.ts#checkEnd` scores victory on the **non-part** enemies, so an
 *   Anima who has not arrived yet never blocks victory and never grants a
 *   false one, and killing her in act two does not end the battle;
 * - `results.ts#collectRewards` still pays her AP, which is what **C-8** wants
 *   for the Guardians the summon kills too (worth 580 AP).
 *
 * `flags.hidden` is what keeps her off the field until the summon;
 * `setup.ts#enemyToCombatant` reads it as `removed: true`, and
 * `forms.ts#revealEnemy` clears both.
 *
 * ## Owner-approved assumptions carried by this file
 *
 * Each is **AUTHORED**, not canon, and each is one line from being flipped.
 * Bailey approved all four on 2026-09-21 ("Yes to all recommendations").
 *
 * | # | Assumption | Where the switch is |
 * |---|---|---|
 * | **C-2** | Seymour is **present but untargetable** while Anima is on the field | `SEYMOUR_UNTARGETABLE_IN_ACT_TWO` |
 * | **C-11** | Auto-Potion fires on **any** damage, not physical only | `AUTO_POTION_ON_ANY_DAMAGE` |
 * | **C-14** | The ice → lightning → water → fire order **persists into act three** | `ACT_THREE_KEEPS_ELEMENT_ORDER` |
 * | **C-4 / G-1** | Anima's gauge is **+10 % per turn taken, +5 % per targeting** | `ANIMA_GAUGE_PER_TURN` / `ANIMA_GAUGE_PER_TARGETING` |
 *
 * All four constants live in `src/battle/ffx/ai/seymour-anima-macalania.ts`.
 *
 * ## Conflicts recorded rather than merged
 *
 * - **C-1**: the Guardian's rare steal. The decompiled byte says **Ether**; the
 *   FF Wiki infobox says Hi-Potion. We ship the decompile. Cosmetic.
 * - **C-12**: the Guardians' branch **order** is *not* sourced — only the
 *   branch **set** is. The AI file follows the wiki's sentence order and says
 *   so; the two orders differ only when Seymour is simultaneously poisoned and
 *   under 4,800 HP.
 * - **C-13**: equipment ability-roll counts. Not modelled — this project has no
 *   equipment-drop roller.
 * - **G-8**: Anima's Tough / Heavy flags are `[single source]` and there is no
 *   `tough`/`heavy` member of `ImmunityFlag`. **Left out** rather than widening
 *   a contract union for an unverified property that changes no number.
 * - **G-10**: `blk-magic-sphere`, `special-sphere` and `ability-sphere` have no
 *   `ItemDef` row yet, so the Steal/Results banner prints the raw id
 *   (`steal.ts#itemName` falls back). Shipped anyway, exactly as Chapter 1
 *   already ships `lv-4-key-sphere`; the rows belong to the player-data agent.
 *
 * ## ⚠ Three Guado Guardians exist in the data — this is `m141`
 *
 * `m213` (Lake Macalania, HP 1,200) has a Berserk/Summon script and `m222`
 * (Home, HP 2,600) has a Silence/Confuse anti-Lulu script. **Ship neither
 * here** [§2, verified: 2 sources]. The three also split on the Threaten byte,
 * which is what proved the byte is a *chance*, not a resistance (§0.4).
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';

/** Ids the engine, the tactic and the tests all key on. */
export const SEYMOUR_MACALANIA_ID = 'seymour-macalania';
export const GUADO_GUARDIAN_A_ID = 'guado-guardian-a';
export const GUADO_GUARDIAN_B_ID = 'guado-guardian-b';
export const ANIMA_MACALANIA_ID = 'anima-macalania';
export const MACALANIA_GROUP_ID = 'seymour-anima-macalania';

/** AI script ids, registered in `src/battle/ffx/ai/seymour-anima-macalania.ts`. */
export const SEYMOUR_MACALANIA_SCRIPT = 'seymour-macalania';
export const GUADO_GUARDIAN_SCRIPT = 'guado-guardian-macalania';
export const ANIMA_MACALANIA_SCRIPT = 'anima-macalania';

/** §5.2 [verified: 2 sources] — he summons at exactly half his bar. */
export const SUMMON_HP_THRESHOLD = 3000;

/** §5.4 [verified: 2 sources] — his Magic rises when Anima is dismissed. */
export const ACT_THREE_MAGIC = 32;

/**
 * Seymour — `m124`, bestiary #077.
 *
 * Every element **neutral** (§1.2 [decompiled]): there is no elemental puzzle
 * *on* Seymour. The elemental content of this fight is his rotation hitting
 * *the party*, which is the opposite shape and is what makes it a good
 * teaching fight for Nul spells.
 *
 * `spriteKey: 'seymour-macalania'` — the installed art folder is
 * `public/art/characters/seymour-macalania/`, distinct from Chapter 1's
 * `seymour-flux`/`seymour-flux-body`. The bare `'seymour'` key this fight
 * used to give him has no manifest subject at all, so he was found through
 * `PaintedActor`'s fallback path instead of his real painting.
 */
const seymour: EnemyDef = {
  id: SEYMOUR_MACALANIA_ID,
  name: 'Seymour',
  spriteKey: 'seymour-macalania',
  slot: 1, // M2 — the Guardians flank him [§4.2's Hi-Potion row targets "M2"]
  // §1.1 [verified: 2 sources] — decompile + wiki + GamerGuides agree.
  stats: {
    hp: 6000,
    mp: 100,
    str: 20,
    def: 0, // §1.1 [decompiled] — the formula clamps; the wiki prints 1
    mag: 25, // §1.1 [decompiled]; act three raises it to 32 (§5.4)
    mdef: 25,
    agi: 20,
    luck: 15,
    eva: 0,
    acc: 100,
    maxHp: 6000,
    maxMp: 100,
  },
  hp: 6000,
  mp: 100,
  affinities: {}, // §1.2 [decompiled] — all five elements neutral
  // §1.3 [decompiled]. Raw 0-255 bytes; a missing key is 0 = fully landable.
  immunities: {
    poison: 40, // §1.3 — landable; Poison Fang (chance 254) always lands, 600/turn
    'magic-break': 50, // §1.3 — Banishing Blade (254) bypasses this entirely
    // armor-break, mental-break and slow are byte 0 and deliberately OMITTED:
    // all three are fully landable, and `slow` being landable is stated in the
    // wiki's own prose [§1.3, verified: 2 sources].
    ko: 255,
    zombie: 255,
    petrify: 255,
    'power-break': 255,
    confuse: 255,
    berserk: 255,
    provoke: 255,
    sleep: 255,
    silence: 255,
    darkness: 255,
    eject: 255,
    'auto-life': 255,
    doom: 255,
  } satisfies StatusImmunities,
  // §1.3 [decompiled] + wiki [verified: 2 sources]. `immune_to_life` is set in
  // the data but is flavour only — he is `ko`-immune anyway, same note as
  // Seymour Flux's file.
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'],
  forms: [{ name: 'Seymour', spriteKey: 'seymour-macalania', hp: 6000 }],
  aiScriptId: SEYMOUR_MACALANIA_SCRIPT,
  rewards: {
    ap: 2000, // §1.1 [verified: 2 sources]
    apOverkill: 3000, // §1.1 [verified: 2 sources]
    gil: 5000, // §1.1
    overkillThreshold: 1400, // §1.1 [verified: 2 sources]
    // §1.4 [verified: 2 sources]. `blk-magic-sphere` has no ItemDef row yet —
    // see G-10 in the file header.
    drops: [{ itemId: 'blk-magic-sphere', count: 1 }],
    steal: {
      baseChance: 100, // §1.4 [decompiled byte 255 = guaranteed, clamped to the 0-100 contract range]
      common: { itemId: 'turbo-ether', count: 1 },
      rare: { itemId: 'elixir', count: 1 },
    },
    bribe: { item: { itemId: 'elixir', count: 1 }, immune: true }, // §1.4 [decompiled]
  },
  abilityIds: [
    'shell', // §4.1 chance 254, the opening move — applied at setup, see the group's AI note
    'mac-blizzara',
    'mac-thundara',
    'mac-watera',
    'mac-fira',
    'mac-blizzaga',
    'mac-thundaga',
    'mac-waterga',
    'mac-firaga',
    'mac-multi-blizzara',
    'mac-multi-thundara',
    'mac-multi-watera',
    'mac-multi-fira',
    'mac-seymour-idle',
  ],
  flags: { isBoss: true },
  sensorText: 'Ice, lightning, water, fire. In that order, every time. He is telling you on purpose.',
  scanText:
    'Maester. Cycles the four elements in a fixed order — the matching Nul spell reduces a turn to nothing. Shielded by his retainers against anything swung at him. When cornered, he calls for help.',
  poisonTickPercent: 10, // §1.1 [verified: 2 sources] — 600/turn on a 6,000 bar
  doomTurns: 3, // §1.1 [decompiled]
  zanmatoLevel: 4, // §1.1 / §12 C-6 [verified: 2 sources] — byte 402 is 0-based, so byte 3 + 1
  threatenChance: 0, // §0.4 [verified: 2 sources] — 0 means IMMUNE, not "never resisted"
};

/**
 * One Guado Guardian — `m141`, bestiary #078.
 *
 * **Its overkill threshold equals its whole HP bar**, so it can only be
 * overkilled by a single hit of 2,000 or more — i.e. by killing it outright
 * from full (§2.1). That is a real overkill lesson at exactly the power level
 * where the player's best single hit is about to cross 2,000.
 */
function guardian(id: string, slot: number, suffix: string): EnemyDef {
  return {
    id,
    name: `Guado Guardian ${suffix}`,
    spriteKey: 'guado-guardian',
    slot,
    // §2.1 [verified: 2 sources].
    stats: {
      hp: 2000,
      mp: 10,
      str: 10,
      def: 0,
      mag: 15,
      mdef: 0,
      agi: 12, // slower than almost everyone — the punching bag whose turns you out-pace
      luck: 15,
      eva: 0,
      acc: 100,
      maxHp: 2000,
      maxMp: 10,
    },
    hp: 2000,
    mp: 10,
    affinities: {},
    // §2.2 [decompiled]. `petrify` is byte 0 and deliberately OMITTED — fully
    // landable, and it is the fight's shortcut: Kimahri's Stone Breath and
    // Rikku's Petrify Grenade both shatter a Guardian outright, at the cost of
    // the overkill AP.
    immunities: {
      ko: 10, // §2.2 — landable at 90/101 from a chance-100 source
      silence: 20, // §2.2 — silencing one makes it Remedy itself, which wastes its turn
      confuse: 255,
      berserk: 255,
      provoke: 255,
      sleep: 255,
      'auto-life': 255,
      doom: 255,
    } satisfies StatusImmunities,
    // §2.2 [decompiled] — NOT immune to percentage damage, Delay, Slice or Bribe.
    immunityFlags: [],
    forms: [{ name: `Guado Guardian ${suffix}`, spriteKey: 'guado-guardian', hp: 2000 }],
    aiScriptId: GUADO_GUARDIAN_SCRIPT,
    rewards: {
      ap: 290, // §2.1 [verified: 2 sources]
      apOverkill: 435, // §2.1 [verified: 2 sources]
      gil: 300, // §2.1
      overkillThreshold: 2000, // §2.1 [verified: 2 sources] — equal to full HP
      drops: [{ itemId: 'ability-sphere', count: 1 }], // §2.5
      steal: {
        baseChance: 100, // §2.4 [decompiled byte 255]
        common: { itemId: 'hi-potion', count: 1 }, // §2.4 [verified: 2 sources]
        // §2.4 C-1: the decompile says Ether, the wiki infobox says Hi-Potion.
        // We ship the decompile and record the conflict. Cosmetic.
        rare: { itemId: 'ether', count: 1 },
      },
      // §2.4 [verified: 2 sources] — Ether x10 at a max cost of 50,000 gil,
      // which is exactly `maxHP * 25` and is what the engine already computes
      // from the HP pool, so there is no cost field to set.
      bribe: { item: { itemId: 'ether', count: 10 }, immune: false },
    },
    abilityIds: [
      'protect', // §4.2 chance 254, the opening move — applied at setup
      'guardian-blizzard',
      'guardian-thunder',
      'guardian-auto-potion',
      'guardian-hi-potion',
      'guardian-remedy',
      'guardian-remedy-self',
      'guardian-shremedy',
    ],
    flags: {},
    sensorText: 'Carries potions. Steps in front of anything swung at his master.',
    scanText:
      'Retainer. Intercepts physical blows aimed at Seymour; magic goes around him. Heals himself the instant he is hurt, and heals his master when the bar drops — until somebody takes the pouch.',
    poisonTickPercent: 25, // §2.1 [decompiled] — 500/turn
    doomTurns: 1, // §2.1 [decompiled]
    zanmatoLevel: 4, // §2.1 [verified: 2 sources]
    threatenChance: 100, // §0.4 [verified: 2 sources] — the default tier; Threaten genuinely locks them
  };
}

/**
 * Anima — `m125`, bestiary #079. Arrives mid-battle; see the file header for
 * why she ships in `parts` and what `flags.hidden` does.
 *
 * She is **not** `immune-to-percentage-damage` and that is deliberate: §3.2
 * says she is explicitly vulnerable to it (Demi can kill her, because Boost's
 * ×1.5 lands immediately before the damage cap). Do not block it by accident.
 *
 * `poisonTickPercent` is omitted rather than written as 25 — she is
 * Poison-immune, so the byte is moot and writing it would imply a behaviour
 * that can never happen.
 */
const anima: EnemyDef = {
  id: ANIMA_MACALANIA_ID,
  name: 'Anima',
  spriteKey: 'anima',
  slot: 3, // M4 — Seymour's idle no-op is aimed at this slot [§4.1 decompiled]
  // §3.1 [verified: 2 sources].
  stats: {
    hp: 18000,
    mp: 50,
    str: 25,
    def: 0,
    mag: 20,
    mdef: 0,
    agi: 25, // faster than everything the player owns, Shiva included [§5.1]
    luck: 20,
    eva: 0,
    acc: 30,
    maxHp: 18000,
    maxMp: 50,
  },
  hp: 18000,
  mp: 50,
  affinities: {},
  // §3.2 [verified: 2 sources].
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
    doom: 255,
  } satisfies StatusImmunities,
  // §3.2 [decompiled]. NOT `immune-to-percentage-damage` — see the doc comment.
  // Tough/Heavy are omitted: see G-8 in the group's file header.
  immunityFlags: ['boss', 'immune-to-scan', 'immune-to-delay', 'immune-to-bribe'],
  forms: [{ name: 'Anima', spriteKey: 'anima', hp: 18000 }],
  aiScriptId: ANIMA_MACALANIA_SCRIPT,
  rewards: {
    ap: 2500, // §3.1 [verified: 2 sources]
    apOverkill: 3750, // §3.1 [verified: 2 sources]
    gil: 3000, // §3.1
    overkillThreshold: 1400, // §3.1 [verified: 2 sources]
    drops: [{ itemId: 'ability-sphere', count: 1 }], // §3.3
    steal: {
      baseChance: 100, // §3.3 [decompiled byte 255]
      common: { itemId: 'silence-grenade', count: 3 }, // §3.3 [verified: 2 sources]
      rare: { itemId: 'farplane-shadow', count: 1 }, // §3.3 [verified: 2 sources]
    },
    bribe: { item: { itemId: 'farplane-shadow', count: 1 }, immune: true }, // §3.3
  },
  abilityIds: ['anima-boost', 'anima-pain-boss', 'anima-oblivion'],
  // `hidden` is what keeps her off the field until the summon: `setup.ts`
  // reads it as `removed: true`, and `predicates.ts#targetable` already
  // honours it. `isPart` is the mechanism, not a claim that she is a limb —
  // see the file header.
  flags: { isPart: true, partOf: SEYMOUR_MACALANIA_ID, hidden: true },
  sensorText: 'Bound. Her own son called her up out of the floor.',
  scanText:
    'Aeon. Her strike carries death itself — lethal to anyone who can be killed, and merely painful to anything that cannot. She hands you a window every other turn. Something is filling while you use it.',
  doomTurns: 3, // §3.1 [decompiled]
  zanmatoLevel: 4, // §3.1 [verified: 2 sources]
  threatenChance: 0, // §3.2 / §0.4 — immune
};

export const seymourAnimaMacalaniaGroup: EnemyGroupDef = {
  id: MACALANIA_GROUP_ID,
  game: 'ffx',
  canEscape: false, // §3.2 "the party cannot escape"
  enemies: [guardian(GUADO_GUARDIAN_A_ID, 0, 'A'), seymour, guardian(GUADO_GUARDIAN_B_ID, 2, 'B')],
  parts: [anima],
  musicCues: [
    // STOPGAP: §9.8 wants its OWN cue (`boss-seymour-macalania`, unbuilt), NOT the
    // Flux chapter's `boss-seymour` [docs/handoff/chapter-macalania.md]; swap when it lands.
    { at: 'start', track: 'boss-seymour', fadeMs: 800 },
  ],
};

export default seymourAnimaMacalaniaGroup;
