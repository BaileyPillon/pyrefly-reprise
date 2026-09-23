/**
 * The Leblanc Syndicate — Chateau Leblanc, FFX-2 Chapter 2, mission
 * "Faking and Entering". Three chained formations.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Every number comes from FFX-2
 * bestiary records #220 / #221 / #222 / #227 / #228 / #231; nothing here exists
 * in FFX.
 *
 * Source: `research/ffx2-leblanc-syndicate.md` (abbreviated `§`), built to the
 * paper preflight `docs/plans/chapter-leblanc-review.md`.
 *
 * **Not a registered chapter.** No scene, no story script, no art, no music, so
 * this formation is deliberately absent from `src/data/encounters.ts` and
 * `src/data/chapter-meta.ts`, and chapter select keeps showing it as *Coming*.
 * It is reachable from the unit suites and the `window.__pyrefly` debug API
 * through `ENEMY_GROUPS_BY_ID`, exactly as the Macalania and Evrae engine
 * tracks reach theirs.
 *
 * ---
 *
 * ## The stat-shape reading — §3.4, verbatim, because it is the whole encounter
 *
 * > **Three enemies, three different correct answers.**
 *
 * | | Defense | Magic Defense | Evasion | The lesson |
 * |---|---|---|---|---|
 * | **Ormi** | **84** (and 120-121 in Acts I-II) | **16** | 0 | A wall to physicals, paper to magic. |
 * | **Logos** | **4** | 18 | **40** | Nothing defends him — but you have to *hit* him. Long-range, high-Accuracy dresspheres only. |
 * | **Leblanc** | 10 | **62** | 22 | Hit her with a sword, not a spell. And she re-buffs herself. |
 *
 * This is not a reading imposed on the data; it is what the data says, and it
 * is why the fight is a legitimate tutorial for FFX-2's damage routing. No
 * other early boss group in the game puts all three defensive shapes on screen
 * simultaneously.
 *
 * **Power Break and Armor Break do nothing to Leblanc and work on the boys**
 * [§3.1] — the only place in the fight where the same Warrior skill is correct
 * on two targets and dead on the third. It belongs in the Sensor line and in
 * the guide.
 *
 * ---
 *
 * ## Do not mix records [§12]
 *
 * Acts I and II use the #220 / #221 / #227 blocks, Act III the #222 / #228 /
 * #231 blocks, and the Creature Creator versions are a different entity
 * entirely. **G8 is resolved**: Act III is Ormi **1,344** / Logos **989**, not
 * GamerGuides' 1,840 / 1,432 — that source repeated the previous fight's block.
 *
 * ## Accuracy ships as 0 on every record — gap G1
 *
 * The `accuracy` field is **blank on all six Syndicate records** while
 * populated for comparable enemies (Dr. Goon 3, Boris 3/4, Battlesnake 98), and
 * §2.6's decoded points race turns any near-zero enemy Accuracy into a 0 % hit
 * rate [§5.1, G1]. The project's existing answer is the one used here: the
 * blank field maps onto the "absent means 0" convention, no Syndicate action
 * carries a per-ability `accuracy` byte, and every enemy action therefore
 * routes to `src/battle/ffx2/constants.ts::ENEMY_BASE_ACCURACY`. §5.1's
 * `SYNDICATE_ACCURACY_TUNING = 110` is **deliberately not introduced** — a
 * second, conflicting, equally unsourced constant for the same quantity would
 * give us two places to fix when G1 closes.
 */

import type { EnemyDef, EnemyGroupDef, StatBlock, StatusId } from '../../../battle/common/types.ts';

/** Group ids, exported so the tests and the debug API do not spell them by hand. */
export const LEBLANC_ACT_I = 'ffx2-leblanc-entrance';
export const LEBLANC_ACT_II = 'ffx2-leblanc-logos-room';
export const LEBLANC_ACT_III = 'ffx2-leblanc-last-room';

/** The chain, in order. Act I -> Act II -> Act III, with no menu between. */
export const LEBLANC_CHAIN_ORDER = [LEBLANC_ACT_I, LEBLANC_ACT_II, LEBLANC_ACT_III] as const;

/**
 * Common to all three of the trio [§3.1-3.3, verified: 2 sources]: Death,
 * Petrify, Sleep, Silence, Confuse, Berserk, Curse, Eject, Stop, Doom,
 * gravity/fractional, Multi-Attack and Bribe.
 *
 * `applyRiders()` reads `target.immunities[status] ?? 0` and skips at `>= 255`,
 * which is how `bahamut.ts` models a boss's immunity list.
 *
 * **G12 is deliberately unimplemented**: `multi attack = Immune` appears on all
 * six records and is explained by no source, and §13's instruction is to
 * implement no behaviour for it.
 */
const TRIO_IMMUNITIES: Partial<Record<StatusId, number>> = {
  ko: 255, // Death
  petrify: 255,
  sleep: 255,
  silence: 255,
  confuse: 255,
  berserk: 255,
  curse: 255,
  eject: 255,
  stop: 255,
  doom: 255,
};

/**
 * `landChance = 100 - resistNumber` for §2.6a's linear "Status 1" path, subject
 * to its level terms — which is exactly what `statuses.ts::statusChanceLinear`
 * implements. The scale is resolved [§3.2, verified: 2 sources]: the numbers in
 * the source template are **percent resistance**, not percent chance to land.
 * That is why `poison` is entered below as the published resist number.
 *
 * **`zantetsu` is published for all three (Leblanc 60, the boys 50) and is
 * deliberately not modelled.** There is no `zantetsu` member of `StatusId`, and
 * the only thing that would read it is the **Samurai**, which §7.2 says is a
 * Chapter 3 dressphere and is **not owned** at this point in the game. Widening
 * a contract union for a resistance nothing in this chapter can test is the
 * wrong trade; the numbers are recorded here and in the handoff instead.
 */

/** A full `StatBlock` from the published six, with the two derived pool fields. */
export function statsOf(s: Omit<StatBlock, 'maxHp' | 'maxMp'>): StatBlock {
  return { ...s, maxHp: s.hp, maxMp: s.mp };
}

// ---------------------------------------------------------------------------
// Act III — the three-on-three. §3.1-3.3
// ---------------------------------------------------------------------------

// **Fix pass, 2026-09-22 (verifier CRITICAL):** `spriteKey` on this trio (and
// on the Act I/II earlier-record instances built from them, below) used to
// carry an unnecessary `ffx2-` prefix (`'ffx2-leblanc'` etc.). Nothing in
// `ART_ID_OVERRIDES`/`FFX2_PREFIXED` mapped that id, and the art track only
// ever installed files at the un-prefixed `public/art/characters/{leblanc,
// ormi,logos}/`, so every requested texture 404'd and every combatant drew
// as a procedural placeholder in all three acts. `bahamut` genuinely needs
// the prefix (it collides with an FFX id) and has files under both names;
// Leblanc's trio does not collide with anything and should have matched its
// folders exactly, the way Chapter 5's Vegnagun spriteKeys already do.
// Regression test: `tests/unit/chapters/leblanc-art.test.ts`.
export const leblancAct3: EnemyDef = {
  id: 'leblanc',
  name: 'Leblanc',
  spriteKey: 'leblanc',
  slot: 0,
  // §3.1 — Lv/HP/MP/EXP/gil [verified: 2 sources]; Str/Mag/Def/MDef/Agi/Eva/
  // Luck [single source]; `acc: 0` is the blank-field convention, gap G1.
  stats: statsOf({ hp: 1380, mp: 460, str: 33, def: 10, mag: 32, mdef: 62, agi: 53, luck: 16, eva: 22, acc: 0 }),
  hp: 1380,
  mp: 460,
  level: 23,
  // §3.1 — gravity Immune, every other element neutral x1.0 [verified: 2
  // sources by the omission-comparison method]. Only the non-neutral row is
  // listed, matching `bahamut.ts`'s convention and the source template's.
  affinities: { gravity: 'immune' },
  immunities: {
    ...TRIO_IMMUNITIES,
    poison: 100, // -> functionally Poison-immune under `landChance = 100 - resist`
    // §3.1 — hers alone, and the reason Power Break and Armor Break are dead on
    // her while both work on the boys.
    'str-down': 255,
    'def-down': 255,
    'luck-down': 255,
  },
  immunityFlags: ['boss', 'immune-to-percentage-damage'],
  // NOT immune [§3.1]: Darkness, Slow, Delay, MAG Down, MDEF Down. Mental Break
  // is the answer to MDef 62 and Magic Break scales her four spells and Mach Fan.
  forms: [{ name: 'Leblanc', spriteKey: 'leblanc', hp: 1380 }],
  aiScriptId: 'ffx2-leblanc',
  rewards: {
    ap: 2,
    apOverkill: 2, // X-2 has no overkill; kept equal for schema uniformity.
    gil: 300,
    overkillThreshold: 0,
    exp: 380,
    // §3.1 — the story drop, deterministic in both slots.
    drops: [{ itemId: 'reassembled-sphere', count: 1 }],
    // §3.1 — steal byte 192/255 ~= 75.3 %; both slots hold an Elixir, so the
    // common/rare split is cosmetic. Bribe is flagged **Immune**.
    steal: {
      baseChance: 75,
      stealRate: 192,
      common: { itemId: 'x2-elixir', count: 1 },
      rare: { itemId: 'x2-elixir', count: 1 },
    },
    stolenGil: 1500, // §3.1 "Gil (stealable) 1,500" [single source]; §6.3
  },
  abilityIds: [
    'x2-leblanc-fan-slap',
    'x2-leblanc-fira',
    'x2-leblanc-blizzara',
    'x2-leblanc-thundara',
    'x2-leblanc-watera',
    'x2-leblanc-mach-fan',
    'x2-leblanc-flash-bomb',
    'x2-leblanc-hush-grenade',
    'x2-leblanc-love-tap',
    'x2-leblanc-not-so-mighty-guard',
    'x2-leblanc-white-wind',
    'x2-leblanc-osmose',
    'x2-nll-1',
    'x2-nll-2',
    'x2-nll-3',
  ],
  flags: { isBoss: true },
  // §3.1 — a paraphrase of the published Scan copy, in our own words. No
  // transcripts [§9.4].
  sensorText: 'Hit her with a sword, not a spell — and strip the guard she keeps putting back up.',
  scanText: 'Furious that a sphere she recovered for Nooj has been tampered with. She hits every one of you at once, and she fights alongside the boys.',
  thinkingPeriod: 0,
};

export const logosAct3: EnemyDef = {
  id: 'logos',
  name: 'Logos',
  spriteKey: 'logos',
  slot: 1,
  // §3.2 — HP 989, the lowest of the three, and Def 4, the lowest in the fight;
  // Eva 40 is the highest. Nothing defends him, but you have to hit him.
  stats: statsOf({ hp: 989, mp: 70, str: 17, def: 4, mag: 28, mdef: 18, agi: 49, luck: 10, eva: 40, acc: 0 }),
  hp: 989,
  mp: 70,
  level: 21,
  affinities: { gravity: 'immune' },
  immunities: {
    ...TRIO_IMMUNITIES,
    poison: 40, // -> 60 % land
  },
  immunityFlags: ['boss', 'immune-to-percentage-damage'],
  // NOT immune [§3.2]: Darkness, Poison, Slow, Delay, **all four Breaks** — his
  // Lv 17 Djose entry carried STR Down immunity, this one does not.
  forms: [{ name: 'Logos', spriteKey: 'logos', hp: 989 }],
  aiScriptId: 'ffx2-leblanc-logos',
  rewards: {
    ap: 2,
    apOverkill: 2,
    gil: 240,
    overkillThreshold: 0,
    exp: 260,
    drops: [{ itemId: 'charm-bangle', count: 1 }],
    steal: {
      baseChance: 75,
      stealRate: 192, // §3.2 "Steal rate 192 / 255" [single source]
      common: { itemId: 'x2-mega-potion', count: 1 },
      rare: { itemId: 'x2-elixir', count: 1 },
    },
    stolenGil: 640, // §3.2 "Gil (stealable) 640" [single source]; §6.3
  },
  abilityIds: ['x2-logos-double-shot', 'x2-logos-russian-roulette', 'x2-logos-hail-of-bullets'],
  flags: { isBoss: true },
  sensorText: 'Almost nothing defends him. Long range or Perfect Pitch — and kill him first.',
  scanText: 'Nervous about fouling up in front of Leblanc. His defence and his health are poor; what he is good at is not being where you swung.',
  thinkingPeriod: 0,
};

export const ormiAct3: EnemyDef = {
  id: 'ormi',
  name: 'Ormi',
  spriteKey: 'ormi',
  slot: 2,
  // §3.3 — the largest pool in the fight and the slowest unit on the field.
  // **Evasion is absent from the record -> implement as 0** [single source for
  // the absence].
  stats: statsOf({ hp: 1344, mp: 45, str: 53, def: 84, mag: 26, mdef: 16, agi: 42, luck: 4, eva: 0, acc: 0 }),
  hp: 1344,
  mp: 45,
  level: 19,
  affinities: { gravity: 'immune' },
  immunities: {
    ...TRIO_IMMUNITIES,
    poison: 30, // -> 70 % land
  },
  immunityFlags: ['boss', 'immune-to-percentage-damage'],
  // NOT immune [§3.3]: Darkness, Poison, Slow, Delay, all four Breaks. Armor
  // Break on Ormi is the single best Break use in the fight [§7.3].
  forms: [{ name: 'Ormi', spriteKey: 'ormi', hp: 1344 }],
  aiScriptId: 'ffx2-leblanc-ormi',
  rewards: {
    ap: 2,
    apOverkill: 2,
    gil: 240,
    overkillThreshold: 0,
    exp: 260,
    drops: [{ itemId: 'twist-headband', count: 1 }],
    steal: {
      baseChance: 75,
      stealRate: 192, // §6.3: all three steals "at a 75.3 % steal rate" (192/255); §3.3's table prints no rate row
      common: { itemId: 'x2-x-potion', count: 1 },
      rare: { itemId: 'x2-elixir', count: 1 },
    },
    stolenGil: 600, // §3.3 "Gil (stealable) 600" [single source]; §6.3
  },
  abilityIds: [
    'x2-ormi-shield-bash',
    'x2-ormi-supercollider',
    'x2-ormi-huggles',
    'x2-ormi-concussive-blast',
  ],
  flags: { isBoss: true },
  sensorText: 'A wall to swords and paper to magic. Leave him alive until Leblanc is nearly down — alone, he hugs.',
  scanText: 'Beaten twice already and now hiding behind Leblanc. High defence, a lot of health: grinding him down takes time you may not have.',
  thinkingPeriod: 0,
};

/**
 * Act III — the Last Room. 3,713 HP across the three.
 *
 * Teaches target priority, enemy buff-stripping, the trio combo and the Chain
 * system [§2]. **The derived correct order is Logos -> Ormi -> Leblanc** [§5.4]:
 * Logos first to stop Russian Roulette and disarm No Love Lost; Ormi second
 * *while Leblanc is still alive* so he never reaches the Huggles branch;
 * Leblanc last, when she is reduced to self-buffing and a single-target spell.
 */
export const leblancLastRoomGroup: EnemyGroupDef = {
  id: LEBLANC_ACT_III,
  game: 'ffx2',
  canEscape: false,
  enemies: [leblancAct3, logosAct3, ormiAct3],
  // §0 A7 / §10.3 — the tonal inverse of Chapter 4: let them celebrate, loudly.
  // The music keys are the integrator's to add to `MUSIC_KEYS`; until then this
  // group ships no `musicCues` rather than naming a key the registry lacks.
  musicCues: [],
};

export default leblancLastRoomGroup;
