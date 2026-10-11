/**
 * The two command lists the Oversoul Paragon's reaction entry reads (`o152.src:286-335`; `research/re-ffx2-ai-fallen-trema.md`
 * 6.2), as our ability ids. **FFX-2 only.** In our own words: the lists are the game's, 11 and 32 commands, not the first
 * build's guesses (rows O8 and O9).
 *
 * - **Heal and buff** (11): Cure, Cura, Curaga, Full-Cure, Regen, Esuna, Life, Full-Life, Shell, Protect, Reflect. A girl's cast of
 *   one of these that lands **on Paragon** starts the Demi loop.
 * - **Copy** (32): Fire, Fira, Firaga, Blizzard, Blizzara, Blizzaga, Thunder, Thundara, Thundaga, Water, Watera, Waterga, Flare,
 *   Ultima, Holy, Demi, Confuse, Silence, Sleep, Blind, Berserk, Bio, Break, Doom, Death, Drain, MP Absorb, Osmose, Dispel,
 *   Haste, Hastega, Supernova. Black Sky is not on it. A copied spell goes back at its caster alone.
 *
 * Any other command a girl puts a result on him with (Attack, an ability, an item, Darkness, Charon, Scan, a Warrior's Break,
 * a Gun Mage's Absorb) is the "normal" answer. Silence (command row 0x3179) has no ability in our catalog that is that row, so
 * it is on the game's list and not on ours; no dressphere of Chapter XIII teaches it.
 */

/** The 11 heal and buff commands (`o152.src:286-301`), by our ability id. */
export const HEAL_BUFF_IDS: ReadonlySet<string> = new Set([
  'x2-white-mage-cure',
  'x2-white-mage-cura',
  'x2-white-mage-curaga',
  'x2-white-mage-full-cure',
  'x2-white-mage-regen',
  'x2-white-mage-esuna',
  'x2-white-mage-life',
  'x2-white-mage-full-life',
  'x2-white-mage-shell',
  'x2-white-mage-protect',
  'x2-white-mage-reflect',
]);

/** The 32 copied commands (`o152.src:302-335`), by our ability id; 31 of them have an ability here (Silence has none). */
export const COPY_IDS: ReadonlySet<string> = new Set([
  'x2-black-mage-fire',
  'x2-black-mage-fira',
  'x2-black-mage-firaga',
  'x2-black-mage-blizzard',
  'x2-black-mage-blizzara',
  'x2-black-mage-blizzaga',
  'x2-black-mage-thunder',
  'x2-black-mage-thundara',
  'x2-black-mage-thundaga',
  'x2-black-mage-water',
  'x2-black-mage-watera',
  'x2-black-mage-waterga',
  'x2-shared-flare',
  'x2-shared-ultima',
  'x2-shared-holy',
  'x2-dark-knight-demi',
  'x2-dark-knight-confuse',
  'x2-shared-sleep',
  'x2-shared-blind',
  'x2-berserker-berserk',
  'x2-dark-knight-bio',
  'x2-dark-knight-break',
  'x2-dark-knight-doom',
  'x2-dark-knight-death',
  'x2-dark-knight-drain',
  'x2-black-mage-mp-absorb',
  'x2-shared-osmose',
  'x2-white-mage-dispel',
  'x2-shared-haste',
  'x2-shared-hastega',
  'x2-gun-mage-supernova',
]);

/** Which of the game's two lists a command is on. */
export function oversoulCommandClass(abilityId: string): 'heal-buff' | 'copy' | 'other' {
  if (HEAL_BUFF_IDS.has(abilityId)) return 'heal-buff';
  if (COPY_IDS.has(abilityId)) return 'copy';
  return 'other';
}
