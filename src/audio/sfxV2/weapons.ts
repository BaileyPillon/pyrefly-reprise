/**
 * Who swings what, and which enemies roar as an aeon or as a machina: the tables the recorded set's
 * hookup reads (D-302). Presentation only, and every row is read from data or research that already
 * exists; nothing here is new game data (AGENTS.md rule 6).
 *
 * **FFX (rule 14: FFX only).** Each character's `weaponType` is already in the data
 * (`src/data/ffx/characters/index.ts`: sword, staff, blade, blitzball, doll, spear, claws); the set
 * has one swing and one hit per weapon. Auron's `blade` is his katana (the set's `swing-katana`).
 *
 * **FFX-2 (rule 14: FFX-2 only).** The data has no weapon field; what it has is the dressphere worn
 * (`FFX2Combatant.dresspheres.current`) and each dressphere's own name and commands
 * (`src/data/ffx2/dresspheres/*.ts`). Where those name a weapon, the dressphere decides: Gunner
 * ("Gunner", "Gunplay") and Gun Mage ("Gun Mage") fire a gun; Warrior ("Swordplay") swings a sword,
 * which in this set is the greatsword. Every other dressphere takes the girl's own weapon, the one of
 * her default dressphere (research/ffx2-combat-core.md §3.1 "Gunner — Yuna's default", §3.2 "Thief —
 * Rikku's default", §3.3 "Warrior — Paine's default"): Yuna a gun, Paine a sword. Rikku's Thief names
 * no weapon; her daggers are the set's proposal, accepted by Bailey with the rest (2026-09-30).
 *
 * **Enemy voices (FFX-2).** Dark aeons roar as aeons: the FFX-2 aeon list is "Valefor, Ifrit, Ixion,
 * Shiva, Bahamut, Anima, Yojimbo, and the Magus Sisters" (research/ffx2-fallen-aeons.md line 35,
 * [verified: 2 sources]). Vegnagun and its parts are machina, "No pyreflies"
 * (research/ffx-vs-ffx2-presentation.md line 135), so they cry and break as machina. An FFX-2 enemy
 * in neither list (the Syndicate, Shuyin, Trema, Paragon, the Den's shades) keeps today's cue.
 */

export type Weapon =
  | 'sword'
  | 'katana'
  | 'spear'
  | 'blitzball'
  | 'staff'
  | 'doll'
  | 'claw'
  | 'gun'
  | 'dagger'
  | 'greatsword';

/** FFX: the data's `weaponType` -> the set's weapon. */
export const FFX_WEAPON_TYPES: Readonly<Record<string, Weapon>> = {
  sword: 'sword',
  staff: 'staff',
  blade: 'katana',
  blitzball: 'blitzball',
  doll: 'doll',
  spear: 'spear',
  claws: 'claw',
};

/** FFX-2: dresspheres whose own name or commands name a weapon. */
export const FFX2_DRESSPHERE_WEAPONS: Readonly<Record<string, Weapon>> = {
  gunner: 'gun',
  'gun-mage': 'gun',
  warrior: 'greatsword',
};

/** FFX-2: each girl's own weapon, the weapon of her default dressphere (see the header). */
export const FFX2_DEFAULT_WEAPONS: Readonly<Record<string, Weapon>> = {
  yuna: 'gun',
  rikku: 'dagger',
  paine: 'greatsword',
};

/** The set's swing and hit for each weapon. */
export const WEAPON_CUES: Readonly<Record<Weapon, { swing: string; hit: string }>> = {
  sword: { swing: 'swing-sword', hit: 'hit-sword' },
  katana: { swing: 'swing-katana', hit: 'hit-katana' },
  spear: { swing: 'swing-spear', hit: 'hit-spear' },
  blitzball: { swing: 'swing-blitzball', hit: 'hit-blitzball' },
  staff: { swing: 'swing-staff', hit: 'hit-staff' },
  doll: { swing: 'swing-doll', hit: 'hit-doll' },
  claw: { swing: 'swing-claw', hit: 'hit-claw' },
  gun: { swing: 'shot-gun', hit: 'hit-gun' },
  dagger: { swing: 'swing-dagger', hit: 'hit-dagger' },
  greatsword: { swing: 'swing-greatsword', hit: 'hit-greatsword' },
};

/** FFX-2 weapon for a girl in a dressphere; `null` for anyone else. */
export function ffx2Weapon(characterId: string, dressphere: string | null | undefined): Weapon | null {
  const own = FFX2_DEFAULT_WEAPONS[characterId];
  if (!own) return null;
  return (dressphere ? FFX2_DRESSPHERE_WEAPONS[dressphere] : undefined) ?? own;
}

export type EnemyVoice = 'aeon' | 'machina';

/** FFX-2 enemy combatant ids by voice (see the header for the sources). */
export const FFX2_ENEMY_VOICES: Readonly<Record<string, EnemyVoice>> = {
  bahamut: 'aeon',
  'ffx2-bahamut': 'aeon',
  'x2-ixion': 'aeon',
  'x2-shiva': 'aeon',
  'x2-anima': 'aeon',
  sandy: 'aeon',
  cindy: 'aeon',
  mindy: 'aeon',
  'vegnagun-tail': 'machina',
  'vegnagun-leg': 'machina',
  'vegnagun-body': 'machina',
  'vegnagun-head': 'machina',
  'node-a': 'machina',
  'node-b': 'machina',
  'node-c': 'machina',
  'bulwark-r': 'machina',
  'bulwark-l': 'machina',
  'redoubt-r': 'machina',
  'redoubt-l': 'machina',
};

/**
 * The roar for a boss reveal or a charge: FFX's roar for every FFX enemy (the cue today's build plays
 * for all of them); in FFX-2 the aeon or machina cry, or `null` (keep today's cue) for anyone else.
 */
export function roarFor(game: 'ffx' | 'ffx2', enemyId: string): string | null {
  if (game === 'ffx') return 'v2:boss-roar';
  const voice = FFX2_ENEMY_VOICES[enemyId];
  if (voice === 'aeon') return 'v2:boss-roar-aeon';
  if (voice === 'machina') return 'v2:machina-roar';
  return null;
}
