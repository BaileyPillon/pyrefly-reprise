/**
 * The Leblanc Syndicate — Leblanc's own set, and the three No Love Lost stages.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Source:
 * `research/ffx2-leblanc-syndicate.md` §4.4, §4.5; spec
 * `docs/plans/chapter-leblanc-review.md` §2.4, §2.5.
 *
 * The shared conventions (Constant-type = `formula: 'multiple'` + `extra.flat`,
 * unreducible = `damageType: 'other'`, no `accuracy` byte because of gap G1)
 * are documented once in `leblanc-syndicate-abilities.ts`. Read that header
 * first.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';
import {
  CHARGE_VALUE_INSTANT,
  CHARGE_VALUE_LONG,
  CHARGE_VALUE_MEDIUM,
  CHARGE_VALUE_SHORT,
  ENEMY_ATTACK_CONSTANT,
} from '../../../battle/ffx2/constants.ts';

/**
 * **AUTHORED — no source publishes a number; gap G2.** Owner-approved
 * 2026-09-21. Interpolated inside the fight's own published Constant band
 * (24 / 50 / 106 / 200 / 300, §4.1), not chosen by feel. See
 * `leblanc-syndicate-abilities.ts::HAIL_OF_BULLETS_BASE` for the full argument.
 */
export const MACH_FAN_BASE = 106;

/**
 * The §2.6a "Status 1" **power byte** that reproduces Flash Bomb's and Hush
 * Grenade's published **50 %** landing chance against this chapter's party.
 *
 * `statuses.ts::statusChanceLinear` is
 * `userLevel * 5 + power - (targetLevel * 5 + resist)`. Leblanc is Lv 23 and
 * `chateauBuild` is Lv 20/21/22, so against the party's centre of mass (Lv 21,
 * resist 0) the realised chance is `115 + power - 105 = 10 + power`, and
 * `power = 40` gives exactly 50 %.
 *
 * `[derived]` — the **50 %** is published [§4.4, verified: 2 sources]; the byte
 * that produces it under the project's transcription of §2.6a is arithmetic,
 * not a source. It moves with the party's level by design, which is what the
 * level terms in §2.6a are for.
 */
export const FLASH_STATUS_POWER = 40;

/**
 * Not-So-Mighty Guard's and Love Tap's buff durations, in §2.8 duration units
 * (`seconds = value * 0.53`).
 *
 * `[derived from the script's own cadence]` — no source publishes a duration.
 *
 * The project's Gun Mage Mighty Guard ships 127 (-> 67.3 s) and that was this
 * file's first value; it is **wrong here**, and measuring is what showed it.
 * §4.4 says Not-So-Mighty Guard "fires on her turns 1 **and** 5 of the basic
 * loop, so it comes back roughly every 21 s". A 67 s buff recast every 21 s
 * would make two of Leblanc's six looped turns pure waste — which a
 * decompile-derived script does not do — and in play it means Protect + Shell
 * are simply *always* up, so the only counter-play the research names (Dispel)
 * becomes an unwinnable treadmill against a single-target strip and three
 * wearers. **40 -> 21.2 s** is one recast period: the buff is up almost all of
 * the time, exactly as §4.4 describes, and the window Dispel opens is real.
 *
 * Recorded as a reading, not a fact, and it is one line from being changed.
 * Love Tap takes the 50 -> 26.5 s the shared Haste row already uses.
 */
export const SYNDICATE_BUFF_DURATION = 40;
export const LOVE_TAP_HASTE_DURATION = 50;

export const leblancAbilities: AbilityDef[] = [
  {
    // §4.4 — base 74.51 from step 1's `(23+33)x23x33/1024 + 33` at Lv 23 /
    // Str 33. Goes through Defense; Protect halves it.
    id: 'x2-leblanc-fan-slap',
    name: 'Fan Slap',
    game: 'ffx2',
    category: 'attack',
    mpCost: 0,
    power: ENEMY_ATTACK_CONSTANT,
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'affected-by-darkness'],
    chargeTicks: CHARGE_VALUE_INSTANT, // §5.2 [estimate — G6]
    messageTemplate: 'Leblanc slaps {target} with her fan',
  },

  // §4.4 — the four Lv.2 elements, 1/4 each on her turn 3. Base
  // `23 x 2 + 32 = 78` at step 1, then step 2's `C^2/64` with **C = 13**, the
  // published Lv.2 tier constant [ffx2-combat-core §3.6, single source:
  // pbirdman calculator] -> ~206 before the MDef term. Halved by Shell, scaled
  // by Magic Break, and the only damage in the fight the MDef gradient touches.
  ...(
    [
      ['fire', 'Fira'],
      ['ice', 'Blizzara'],
      ['lightning', 'Thundara'],
      ['water', 'Watera'],
    ] as const
  ).map(([element, name]): AbilityDef => ({
    id: `x2-leblanc-${name.toLowerCase()}`,
    name,
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 13,
    formula: 'magic',
    damageType: 'magical',
    element: [element],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    chargeTicks: CHARGE_VALUE_SHORT, // §5.2 [estimate — G6]
    messageTemplate: `Leblanc casts ${name} on {target}`,
  })),

  {
    // §4.4 — the upgraded Sonic Fan: moderate non-elemental damage to the whole
    // party plus a weak Delay. Magnitude AUTHORED, gap G2 — {@link MACH_FAN_BASE}.
    // The `weak-delay` flag is carried for provenance only; gap G4, and the
    // FFX-2 engine has no reader for it today.
    id: 'x2-leblanc-mach-fan',
    name: 'Mach Fan',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 0,
    formula: 'multiple',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['weak-delay'],
    canMiss: false,
    chargeTicks: CHARGE_VALUE_MEDIUM, // §5.2 [estimate — G6]
    extra: { flat: MACH_FAN_BASE },
    messageTemplate: 'Leblanc uses Mach Fan',
  },
  {
    // §4.4 — base 50 -> 46~52 to the party, **50 % Darkness**.
    //
    // **Leblanc's ability is Flash *Bomb*.** Flash *Grenade* is Logos' Djose
    // Highroad record and is a different row in the enemy-ability master list;
    // G11 was withdrawn because the two were being matched on identical effect
    // text rather than on the enemy column. Do not merge them.
    id: 'x2-leblanc-flash-bomb',
    name: 'Flash Bomb',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 0,
    formula: 'multiple',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [{ status: 'darkness', chance: FLASH_STATUS_POWER, duration: 0 }],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    chargeTicks: CHARGE_VALUE_SHORT, // §5.2 [estimate — G6]
    extra: { flat: 50 },
    messageTemplate: 'Leblanc throws a Flash Bomb',
  },
  {
    // §4.4 — base 50 -> 46~52 to the party, **50 % Silence**. Silence blocks
    // White Magic, Black Magic, Arcana **and both Songstress commands**, so
    // against a Darkness-Dance line this is her only real answer.
    id: 'x2-leblanc-hush-grenade',
    name: 'Hush Grenade',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 0,
    formula: 'multiple',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [{ status: 'silence', chance: FLASH_STATUS_POWER, duration: 0 }],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    chargeTicks: CHARGE_VALUE_SHORT, // §5.2 [estimate — G6]
    extra: { flat: 50 },
    messageTemplate: 'Leblanc throws a Hush Grenade',
  },
  {
    // §4.4 — Haste on whichever henchman is alive. ATB tick rate x1.05 and
    // animations sped up. Modest, and it is her *characterising* move: she
    // buffs the boys, never herself.
    //
    // `alliesOf()` is side-relative, so `single-ally` from an enemy actor means
    // the enemy team with no engine change [preflight E9].
    id: 'x2-leblanc-love-tap',
    name: 'Love Tap',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-ally',
    hits: 1,
    statusEffects: [{ status: 'haste', chance: 254, duration: LOVE_TAP_HASTE_DURATION }],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    chargeTicks: CHARGE_VALUE_INSTANT, // §5.2 [estimate — G6]
    messageTemplate: 'Leblanc gives {target} a Love Tap',
  },
  {
    // §4.4 — Protect + Shell + Regen on the whole Syndicate, on her turns 1
    // and 5 of the basic loop. **Dispel removes all three**: `DISPEL_REMOVES`
    // already lists protect/shell/regen/haste, so the player's answer works
    // with no engine change [preflight E9].
    id: 'x2-leblanc-not-so-mighty-guard',
    name: 'Not-So-Mighty Guard',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [
      { status: 'protect', chance: 254, duration: SYNDICATE_BUFF_DURATION },
      { status: 'shell', chance: 254, duration: SYNDICATE_BUFF_DURATION },
      { status: 'regen', chance: 254, duration: SYNDICATE_BUFF_DURATION },
    ],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    chargeTicks: CHARGE_VALUE_MEDIUM, // §5.2 [estimate — G6]
    messageTemplate: 'Leblanc casts Not-So-Mighty Guard',
  },
  {
    // §4.4 — restores **1/8 of max HP** to the enemy party and cures all their
    // negative statuses. `percent-total` takes sixteenths, so `power: 2`.
    // Only used when the relevant henchman is dead — **this is what un-blinds
    // the trio**, because it wipes the party's Darkness off them.
    id: 'x2-leblanc-white-wind',
    name: 'White Wind',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 2,
    formula: 'percent-total',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [],
    // §2.8's blanket-cure list, which is what "cures all their negative
    // statuses" means in this engine's vocabulary.
    removesStatuses: [
      'berserk', 'confuse', 'curse', 'darkness', 'itchy', 'petrify',
      'pointless', 'poison', 'silence', 'sleep', 'slow', 'stop',
      'str-down', 'mag-down', 'def-down', 'mdef-down', 'accu-down', 'eva-down', 'luck-down',
    ],
    flags: ['heals', 'removes-statuses'],
    canMiss: false,
    chargeTicks: CHARGE_VALUE_MEDIUM, // §5.2 [estimate — G6]
    messageTemplate: 'Leblanc casts White Wind',
  },
  {
    // §4.4 — drains MP from a character to restore her own, gated on her having
    // **<= 14 MP**. She starts on 460, so in a normal-length fight the branch is
    // effectively dead code; gap G5 (enemy MP costs are unpublished) means it
    // cannot be reached deterministically at all. Implemented anyway, because a
    // half-transcribed script is worse than a branch that never fires.
    id: 'x2-leblanc-osmose',
    name: 'Osmose',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 8,
    formula: 'magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['drains-mp'],
    canMiss: false,
    chargeTicks: CHARGE_VALUE_SHORT, // §5.2 [estimate — G6]
    extra: { mpOnly: true },
    messageTemplate: 'Leblanc casts Osmose on {target}',
  },

  // -------------------------------------------------------------------------
  // No Love Lost — one action, three stages. §4.5
  // -------------------------------------------------------------------------
  //
  // `extra.sequence` is the documented one-off key that makes
  // `resolve.ts::resolveAbility` resolve the named abilities in order from the
  // same user, once, immediately after the first stage
  // (`docs/CONTRACTS.md`: one-off scripted rules live in `AbilityDef.extra`,
  // documented in the data file that sets them). A `sequence` on a sequenced
  // ability is ignored, so it cannot recurse.
  //
  // **All three stages resolve from Leblanc.** §4.5 attributes beat 1 to Logos
  // and beat 3 to Ormi, and the *presentation* should too — but the arithmetic
  // is user-independent in all three (two flat constants and a fraction of the
  // target's own remaining HP), so resolving them from the acting unit is
  // numerically identical and avoids inventing a way for one enemy's turn to
  // spend two other enemies' turns. Recorded rather than buried.
  //
  // It does **not** one-shot any standard dressphere from full at Lv 22
  // (§4.5's worked example: a 648-HP Songstress ends on 145). The design read
  // to build the presentation around is *a spectacle, not an execution*, and it
  // is switched off the instant either henchman falls.
  {
    // Stage 1 — Logos empties both revolvers: **8 hits on random characters**,
    // base 24 each, self-chaining when they land on the same girl. Published as
    // 22~25 per hit "for a maximum total of 267~304" — see §4.1 for why that
    // published total is an editorially assembled figure and not a band any
    // single base can emit, and why no arithmetic should be expected to hit it.
    id: 'x2-nll-1',
    name: 'No Love Lost',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 0,
    formula: 'multiple',
    damageType: 'other',
    element: ['none'],
    targeting: 'random-enemy',
    hits: 8,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    chargeTicks: CHARGE_VALUE_LONG, // §5.2: the longest charge in the fight, so the telegraph has room
    extra: { flat: 24, sequence: ['x2-nll-2', 'x2-nll-3'] },
    messageTemplate: 'No Love Lost!',
  },
  {
    // Stage 2 — the party is knocked off its feet: base 106 -> 99~112 each.
    id: 'x2-nll-2',
    name: 'No Love Lost',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 0,
    formula: 'multiple',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    chargeTicks: CHARGE_VALUE_INSTANT,
    extra: { flat: 106 },
    messageTemplate: 'The Syndicate knocks the party off its feet',
  },
  {
    // Stage 3 — Ormi finishes one character: **3/8 of that character's
    // *remaining* HP**. `percent-current` takes sixteenths, so `power: 6`.
    id: 'x2-nll-3',
    name: 'No Love Lost',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 6,
    formula: 'percent-current',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    chargeTicks: CHARGE_VALUE_INSTANT,
    messageTemplate: 'Ormi finishes {target}',
  },
];

export default leblancAbilities;
