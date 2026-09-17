/**
 * FFX Aeon actions — the five *mandatory* aeons: Valefor, Ifrit, Ixion,
 * Shiva, Bahamut. Attack, Special and Overdrive(s) for each. This file
 * covers Valefor, Ifrit and Ixion; **Shiva and Bahamut continue in
 * `aeons/abilities-core-2.ts`**, split to stay under this project's
 * ~380-line data file guideline (both files merge into one logical
 * "core aeons" ability set — combine both `ABILITIES` records when
 * building the registry).
 * Source: `research/ffx-combat-core.md` §6.3 `[verified: 2 sources]` unless
 * an individual entry says otherwise.
 *
 * Sibling file `aeons/abilities-optional.ts` covers Anima, Yojimbo, the
 * Magus Sisters, and the three shared sub-commands (Shield/Boost/Dismiss).
 * `aeons/index.ts` owns the 8 aeon catalog records, the stat-scaling
 * coefficients and the per-encounter canonical stat blocks that reference
 * the ids defined here.
 *
 * Shared rules applied throughout, quoted from §6.3 and its preamble
 * `[verified: 2 sources]`:
 * - "All five core aeon specials use the Strength formula against the
 *   target's Defense — Ignores Armored is not the same as ignores Defense."
 *   So every Special below is `formula: 'strength'` and mitigated by the
 *   target's Defense stat, regardless of its `damageType`.
 * - Attack: `formula: 'strength'`, `damageType: 'physical'`,
 *   `targeting: 'single-enemy'`, `flags: ['crit-eligible', 'piercing']`
 *   *except* Valefor's Attack, which has **no** `'piercing'` flag — per
 *   §7 preamble / §6.3 notes, "aeon weapons [carry Piercing] except
 *   Valefor". `power` is each aeon's Attack DmgCon from the §6.3 table.
 * - There is no dedicated ACC-multiplier field on `AbilityDef`, so each
 *   core Attack's ACC×2.5 / ACC×1.5 multiplier lives at
 *   `extra.accuracyMultiplier`, and `accuracy` itself is left undefined
 *   (no explicit action-owned accuracy byte is given in §6.3).
 * - Special: `flags: ['crit-eligible']` plus whatever rider flags/status
 *   applications are listed per-aeon, `damageType: 'physical'` *except*
 *   Ifrit's Meteor Strike, which §6.3 states explicitly is `'other'`
 *   despite using the Strength formula ("Ignores Armored is NOT the same
 *   as ignores Defense" — Meteor Strike is simply typed Other for the
 *   purposes of Protect/Shell/Strength+%/Magic+%/breaks).
 * - Overdrive: "All aeon Overdrives are Special Magic: cubic Magic
 *   scaling, MDef treated as 0, damage type Other." So every Overdrive
 *   below is `category: 'overdrive'`, `formula: 'special-magic'`,
 *   `damageType: 'other'`, `flags: ['crit-eligible']` plus any extra flag
 *   noted. "Only Bahamut's Mega Flare and Anima's Oblivion innately break
 *   the 9999 limit. Valefor is the only aeon with two Overdrives."
 *   §6.3 does not restate each Overdrive's targeting beyond its DmgCon, so
 *   `targeting: 'single-enemy'` is used for every Overdrive here and is
 *   marked `[estimate]` inline.
 * - Attack's `rank` is not itemized in §6.3's table (only DmgCon/ACC are
 *   given); every Attack below ships `rank: 1` `[estimate: standard FFX
 *   base-Attack CTB rank]`, matching the real game's cheapest command.
 * - `minigame: null` on every entry — aeon abilities never open a minigame.
 *
 * ACCURACY DECISION (2026-09-16, closing the review that already settled
 * `overdrive-tidus.ts` / `overdrive-auron.ts` / `overdrive-kimahri-*.ts`):
 * `research/ffx-bfa-yu-yevon.md` §1.3 (lines 101, 107, 108) decompiles three
 * enemy Overdrives — `Other` damage type, `category: 'overdrive'` — all
 * flagged "always hits", regardless of their underlying formula. Every
 * Overdrive here (Energy Ray, Energy Blast, Hellfire, Thor's Hammer) is
 * `formula: 'special-magic'`, `damageType: 'other'`, `category:
 * 'overdrive'`, matching that signature on the damage-type/category axis.
 * `canMiss: false` is set explicitly on all 4, citing ffx-bfa-yu-yevon.md
 * §1.3 `[verified: 2 sources]` for the pattern, `[estimate]` for extending
 * it from Strength-formula rows to `special-magic`. This does NOT extend to
 * Attack or Special (`category: 'aeon'`) above — those roll accuracy
 * normally via their ACC×2.5/1.5 multiplier (why the multiplier exists at
 * all), including Ifrit's Meteor Strike, which is `damageType: 'other'` but
 * `category: 'aeon'`, not `'overdrive'` — outside the evidence this
 * decision covers.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  // ---------------------------------------------------------------------
  // Valefor — Besaid aeon. ACCx2.5 Attack. The only aeon with two
  // Overdrives (Energy Ray / Energy Blast). No elemental absorb.
  // ---------------------------------------------------------------------

  'valefor-attack': {
    id: 'valefor-attack',
    name: 'Attack',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 1, // [estimate] — see file header.
    power: 14, // DmgCon 14 [ffx-combat-core §6.3, verified: 2 sources]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    // No 'piercing' — Valefor is the one aeon-weapon exception (§6.3 notes).
    flags: ['crit-eligible'],
    animationKey: 'aeon-attack',
    sfxKey: 'sfx-aeon-attack',
    messageTemplate: '{user} attacks {target}',
    minigame: null,
    extra: { accuracyMultiplier: 2.5, vfxKey: 'vfx-valefor-attack' },
  },

  'sonic-wings': {
    id: 'sonic-wings',
    name: 'Sonic Wings',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 2,
    power: 8, // DmgCon 8
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    // Rider: weak-delay is a flag, not a status [ffx-combat-core §1.5].
    flags: ['crit-eligible', 'weak-delay'],
    animationKey: 'aeon-special-valefor',
    sfxKey: 'sfx-sonic-wings',
    messageTemplate: '{user} uses Sonic Wings on {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-sonic-wings' },
  },

  'energy-ray': {
    id: 'energy-ray',
    name: 'Energy Ray',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 8,
    power: 55, // DmgCon 55
    formula: 'special-magic',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy', // [estimate] — see file header.
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources]/[estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    animationKey: 'aeon-overdrive-valefor',
    sfxKey: 'sfx-energy-ray',
    messageTemplate: '{user} uses Energy Ray on {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-energy-ray' },
  },

  'energy-blast': {
    id: 'energy-blast',
    name: 'Energy Blast',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 9,
    power: 75, // DmgCon 75
    formula: 'special-magic',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy', // [estimate] — see file header.
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources]/[estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    animationKey: 'aeon-overdrive-valefor',
    sfxKey: 'sfx-energy-blast',
    messageTemplate: '{user} uses Energy Blast on {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-energy-blast' },
  },

  // ---------------------------------------------------------------------
  // Ifrit — Kilika aeon. Absorbs Fire. ACCx1.5 Attack. Meteor Strike is
  // damageType 'other' despite using the Strength formula.
  // ---------------------------------------------------------------------

  'ifrit-attack': {
    id: 'ifrit-attack',
    name: 'Attack',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 1, // [estimate] — see file header.
    power: 16, // DmgCon 16
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'piercing'],
    animationKey: 'aeon-attack',
    sfxKey: 'sfx-aeon-attack',
    messageTemplate: '{user} attacks {target}',
    minigame: null,
    extra: { accuracyMultiplier: 1.5, vfxKey: 'vfx-ifrit-attack' },
  },

  'meteor-strike': {
    id: 'meteor-strike',
    name: 'Meteor Strike',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 4,
    power: 17, // DmgCon 17
    formula: 'strength',
    // Explicit exception per §6.3: Strength formula, but damageType 'other'.
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    animationKey: 'aeon-special-ifrit',
    sfxKey: 'sfx-meteor-strike',
    messageTemplate: '{user} uses Meteor Strike on {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-meteor-strike' },
  },

  hellfire: {
    id: 'hellfire',
    name: 'Hellfire',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 8,
    power: 58, // DmgCon 58
    formula: 'special-magic',
    damageType: 'other',
    element: ['fire'],
    targeting: 'single-enemy', // [estimate] — see file header.
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources]/[estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    animationKey: 'aeon-overdrive-ifrit',
    sfxKey: 'sfx-hellfire',
    messageTemplate: '{user} uses Hellfire on {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-hellfire' },
  },

  // ---------------------------------------------------------------------
  // Ixion — Djose aeon. Absorbs Lightning. ACCx1.5 Attack. Aerospark
  // strips Shell/Protect/Reflect/all four Nuls/Regen/Haste from the target.
  // ---------------------------------------------------------------------

  'ixion-attack': {
    id: 'ixion-attack',
    name: 'Attack',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 1, // [estimate] — see file header.
    power: 16, // DmgCon 16
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'piercing'],
    animationKey: 'aeon-attack',
    sfxKey: 'sfx-aeon-attack',
    messageTemplate: '{user} attacks {target}',
    minigame: null,
    extra: { accuracyMultiplier: 1.5, vfxKey: 'vfx-ixion-attack' },
  },

  aerospark: {
    id: 'aerospark',
    name: 'Aerospark',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 4,
    power: 16, // DmgCon 16
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    // Rider: strips these buffs/nuls from the target (removal, not a status roll).
    removesStatuses: [
      'shell', 'protect', 'reflect',
      'nulblaze', 'nulfrost', 'nulshock', 'nultide',
      'regen', 'haste',
    ],
    flags: ['crit-eligible', 'removes-statuses'],
    animationKey: 'aeon-special-ixion',
    sfxKey: 'sfx-aerospark',
    messageTemplate: '{user} uses Aerospark on {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-aerospark' },
  },

  'thors-hammer': {
    id: 'thors-hammer',
    name: "Thor's Hammer",
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 8,
    power: 60, // DmgCon 60
    formula: 'special-magic',
    damageType: 'other',
    element: ['lightning'],
    targeting: 'single-enemy', // [estimate] — see file header.
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources]/[estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    animationKey: 'aeon-overdrive-ixion',
    sfxKey: 'sfx-thors-hammer',
    messageTemplate: "{user} uses Thor's Hammer on {target}",
    minigame: null,
    extra: { vfxKey: 'vfx-thors-hammer' },
  },
};

export default ABILITIES;
