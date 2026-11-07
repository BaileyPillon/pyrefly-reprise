/**
 * The ids and the shared parts of the abilities of the hidden chapter "The Youth League Tournament" (Yaibal, Lucil, Elma and the five League fighter types, `monster.bin` rows 183, 184, 279, 210, 211, 193, 214 and 215).
 * **FFX-2 only** [AGENTS.md rule 14].
 *
 * The ability definitions are in `./youth-league-abilities.ts` (the League types' and Elma's, and the catalog list of all) and `./youth-league-abilities-named.ts` (Yaibal's and Lucil's); the game's own rows are
 * `../command-records/youth-league.ts` (`research/re-ffx2-youth-league-tournament.md` section 6; confidence: [verified: the game's own tables, decoded by a script and pinned by
 * `tests/unit/chapters/youth-league-data.test.ts`]). This file holds what both halves share, so neither imports the other (the source files stay under 400 lines, house rule 7).
 */

export const base = {
  game: 'ffx2' as const,
  category: 'enemy' as const,
  mpCost: 0,
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false as const, // rule 5: set to `true` below only where the row's accuracy formula is not 0
};

/** The ability ids (the AI scripts and the tests name these, never a literal). */
export const YL_ABILITY = {
  // The League types' (and Yaibal's Attack)
  attack: 'x2-league-attack',
  criticalAttack: 'x2-league-critical-attack',
  flashBomb: 'x2-league-flash-bomb',
  hiPotion: 'x2-league-hi-potion',
  demi: 'x2-league-demi',
  confuse: 'x2-league-confuse',
  fira: 'x2-league-fira',
  blizzara: 'x2-league-blizzara',
  thundara: 'x2-league-thundara',
  watera: 'x2-league-watera',
  firaParty: 'x2-league-fira-party',
  blizzaraParty: 'x2-league-blizzara-party',
  thundaraParty: 'x2-league-thundara-party',
  wateraParty: 'x2-league-watera-party',
  // Yaibal
  sorry: 'x2-yaibal-sorry',
  phoenixDown: 'x2-yaibal-phoenix-down',
  yaibalHiPotion: 'x2-yaibal-hi-potion',
  // Lucil
  lucilAttack: 'x2-lucil-attack',
  harbinger: 'x2-lucil-harbinger',
  lucilHiPotion: 'x2-lucil-hi-potion',
  lunarCurtain: 'x2-lucil-lunar-curtain',
  lightCurtain: 'x2-lucil-light-curtain',
  fireGem: 'x2-lucil-fire-gem',
  iceGem: 'x2-lucil-ice-gem',
  lightningGem: 'x2-lucil-lightning-gem',
  waterGem: 'x2-lucil-water-gem',
  goldHourglass: 'x2-lucil-gold-hourglass',
  // Elma
  elmaAttack: 'x2-elma-attack',
  guard: 'x2-elma-not-so-mighty-guard',
  osmose: 'x2-elma-osmose',
  sleep: 'x2-elma-sleep',
  hushGrenade: 'x2-elma-hush-grenade',
  dispel: 'x2-elma-dispel',
} as const;

/** What Dispel strips (the row's status words: Shell, Protect, Reflect, Regen and Haste, and the four "always" statuses, of which the engine has Spellspring and Auto-Life) [row 0x30b8]. */
export const DISPEL_STRIPS = ['auto-life', 'shell', 'protect', 'reflect', 'regen', 'haste', 'spellspring'] as const;
