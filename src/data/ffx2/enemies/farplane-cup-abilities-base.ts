/**
 * The ids and the shared parts of the abilities of the three duelists of the hidden chapter "The Farplane Cup" (Auron, Tidus and Seymour, `monster.bin` rows 311, 317 and 319). **FFX-2 only** [AGENTS.md rule 14].
 *
 * The ability definitions are in `./farplane-cup-abilities.ts` (Auron and Tidus, and the catalog list of all three) and `./farplane-cup-abilities-seymour.ts` (Seymour); the game's own rows are
 * `../command-records/farplane-cup.ts` (`research/re-ffx2-farplane-cup.md` §7; confidence: [verified: the game's own tables, decoded by a script and pinned by `tests/unit/chapters/farplane-cup-data.test.ts`]). This file holds what both halves share, so neither imports the other (the source files stay under 400 lines, house rule 7).
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
export const CUP_ABILITY = {
  // Auron
  auronAttack: 'x2-auron-attack',
  shootingStar: 'x2-auron-shooting-star',
  dragonFang: 'x2-auron-dragon-fang',
  fullBreak: 'x2-auron-full-break',
  shinZantetsu: 'x2-auron-shin-zantetsu',
  auronMegaPotion: 'x2-auron-mega-potion',
  auronXPotion: 'x2-auron-x-potion',
  // Tidus
  tidusAttack: 'x2-tidus-attack',
  blitzAce: 'x2-tidus-blitz-ace',
  spiralCut: 'x2-tidus-spiral-cut',
  delayBuster: 'x2-tidus-delay-buster',
  hastega: 'x2-tidus-hastega',
  tidusMegaPotion: 'x2-tidus-mega-potion',
  heroDrink: 'x2-tidus-hero-drink',
  dispelTonic: 'x2-tidus-dispel-tonic',
  // Seymour
  seymourAttack: 'x2-seymour-attack',
  demi: 'x2-seymour-demi',
  curaga: 'x2-seymour-curaga',
  dispel: 'x2-seymour-dispel',
  dispelSelf: 'x2-seymour-dispel-self',
  criticalAttack: 'x2-seymour-critical-attack',
  drainAttack: 'x2-seymour-drain-attack',
  blackSky: 'x2-seymour-black-sky',
  absorb: 'x2-seymour-absorb',
  meteor: 'x2-seymour-meteor',
  shell: 'x2-seymour-shell',
  protect: 'x2-seymour-protect',
  break: 'x2-seymour-break',
  magicUp: 'x2-seymour-magic-up',
  strengthUp: 'x2-seymour-strength-up',
  confuse: 'x2-seymour-confuse',
  slowga: 'x2-seymour-slowga',
  ultima: 'x2-seymour-ultima',
} as const;

/** The four stat stages Full Break lowers, two stages each at chance 100 [row 0x4206]. */
export const FULL_BREAK_STAGES = (['str-down', 'mag-down', 'def-down', 'mdef-down'] as const).map((status) => ({ status, chance: 100, duration: 255, stacks: 2 }));

/** What Dispel strips (the row's status words: Shell, Protect, Reflect, Regen and Haste, and the four "always" statuses, of which the engine has Spellspring and Auto-Life) [row 0x30b8 and the item row 0x2038]. */
export const DISPEL_STRIPS = ['auto-life', 'shell', 'protect', 'reflect', 'regen', 'haste', 'spellspring'] as const;
