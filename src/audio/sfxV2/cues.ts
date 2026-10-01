/**
 * SFX v2: the recorded, layered set (D-302), as the game names it.
 *
 * Bailey, 2026-09-30 ~14:25 EDT: "I'll go with all your recommendations" — the new 98-sound recorded
 * set with the full hookup (built in D:/Tools/pyrefly-scratch/audio-0930/sfx, its README says what
 * each cue is made of; two item-use cues were added for the hookup, `recipes_item.py` there). The set
 * ships as a second sprite, `public/audio/sfx/sprite-v2.mp3`, listed in the manifest as `sfxV2`
 * (`tools/audio/sfx-v2-sprite.py`). The first sprite stays exactly as it was: FF7, the title and
 * chapter select, the Overdrive minigames, the story ambiences and the victory fanfare still play it,
 * and it is the fallback for every v2 cue until the v2 sprite has decoded.
 *
 * A v2 cue is addressed as `v2:<name>` so it can never collide with a first-sprite key of the same
 * name (`hit-1`, `fire`, `cursor-move` exist in both). Each entry names:
 * - `game`: which game it belongs to (AGENTS.md rule 14), from the set's own tagging: `ffx`, `ffx2`
 *   (the `-x2` twins and the FFX-2 weapons) or `both`;
 * - `fallback`: the first-sprite cue that plays in its place before the v2 sprite has decoded (or on
 *   a browser that will not decode it), so a v2 cue is never silent.
 *
 * `tests/unit/audio-sfx-v2.test.ts` checks this table against the manifest both ways, and every
 * fallback against the first bank.
 */

export type V2Game = 'ffx' | 'ffx2' | 'both';

export interface V2Cue {
  game: V2Game;
  fallback: string;
}

const c = (game: V2Game, fallback: string): V2Cue => ({ game, fallback });

/** The set, by name (without the `v2:` prefix). */
export const V2_CUES: Readonly<Record<string, V2Cue>> = {
  // Weapons: swings (class weapon).
  'swing-sword': c('ffx', 'sword-slash-1'),
  'swing-katana': c('ffx', 'sword-slash-2'),
  'swing-spear': c('ffx', 'pierce'),
  'swing-blitzball': c('ffx', 'sword-slash-1'),
  'swing-staff': c('ffx', 'slash-light'),
  'swing-doll': c('ffx', 'slash-light'),
  'swing-claw': c('ffx', 'claw'),
  'shot-gun': c('ffx2', 'gunshot'),
  'gun-burst': c('ffx2', 'gun-burst'),
  'swing-dagger': c('ffx2', 'dagger-flurry'),
  'swing-greatsword': c('ffx2', 'slash-heavy'),
  whiff: c('both', 'whiff'),
  'item-use': c('ffx', 'item-use'),
  'item-use-x2': c('ffx2', 'item-use'),
  // Impacts.
  'hit-sword': c('ffx', 'hit-1'),
  'hit-katana': c('ffx', 'hit-1'),
  'hit-spear': c('ffx', 'hit-1'),
  'hit-blitzball': c('ffx', 'ball-hit'),
  'hit-staff': c('ffx', 'hit-2'),
  'hit-doll': c('ffx', 'hit-2'),
  'hit-claw': c('ffx', 'claw'),
  'hit-gun': c('ffx2', 'hit-2'),
  'hit-dagger': c('ffx2', 'hit-1'),
  'hit-greatsword': c('ffx2', 'hit-1'),
  'hit-1': c('both', 'hit-1'),
  'hit-2': c('both', 'hit-2'),
  'hit-heavy-enemy': c('both', 'hit-1'),
  critical: c('both', 'critical'),
  guard: c('both', 'guard'),
  counter: c('both', 'counter'),
  'ko-fall': c('both', 'ko-fall'),
  'dissolve-pyreflies': c('ffx', 'dissolve-pyreflies'),
  'machina-destroy': c('ffx2', 'machina-destroy'),
  explosion: c('both', 'explosion'),
  'petrify-shatter': c('both', 'petrify-shatter'),
  // Spells, heals, statuses.
  life: c('ffx', 'life'),
  'life-x2': c('ffx2', 'life'),
  'phoenix-down': c('both', 'phoenix-down'),
  fire: c('ffx', 'fire'),
  'fire-x2': c('ffx2', 'fire'),
  ice: c('ffx', 'ice'),
  'ice-x2': c('ffx2', 'ice'),
  thunder: c('ffx', 'thunder'),
  'thunder-x2': c('ffx2', 'thunder'),
  water: c('ffx', 'water'),
  'water-x2': c('ffx2', 'water'),
  holy: c('ffx', 'holy'),
  'holy-x2': c('ffx2', 'holy'),
  flare: c('ffx', 'flare'),
  'flare-x2': c('ffx2', 'flare'),
  'magic-charge': c('ffx', 'magic-charge'),
  'magic-charge-x2': c('ffx2', 'magic-charge'),
  cure: c('ffx', 'cure'),
  'cure-x2': c('ffx2', 'cure'),
  'cure-3': c('ffx', 'cure-3'),
  'cure-3-x2': c('ffx2', 'cure-3'),
  'buff-generic': c('ffx', 'buff-generic'),
  'buff-generic-x2': c('ffx2', 'buff-generic'),
  protect: c('both', 'protect'),
  shell: c('both', 'shell'),
  haste: c('both', 'haste'),
  slow: c('both', 'slow'),
  'debuff-generic': c('ffx', 'debuff-generic'),
  'debuff-generic-x2': c('ffx2', 'debuff-generic'),
  'status-applied': c('both', 'status-applied'),
  poison: c('both', 'poison'),
  sleep: c('both', 'sleep'),
  silence: c('both', 'silence'),
  stop: c('both', 'stop'),
  // Flourishes and stingers.
  'overdrive-stinger': c('ffx', 'overdrive-full'),
  'special-stinger': c('ffx2', 'overdrive-full'),
  summon: c('ffx', 'summon'),
  'overdrive-full': c('ffx', 'overdrive-full'),
  'overdrive-full-x2': c('ffx2', 'overdrive-full'),
  spherechange: c('ffx2', 'spherechange'),
  'battle-start': c('both', 'battle-start'),
  'boss-roar': c('ffx', 'boss-roar'),
  'boss-roar-aeon': c('ffx2', 'boss-roar'),
  'machina-roar': c('ffx2', 'boss-roar'),
  'breath-attack': c('both', 'breath-attack'),
  'laser-charge': c('ffx2', 'laser-charge'),
  'laser-fire': c('ffx2', 'laser-fire'),
  'boss-phase-shift': c('both', 'boss-phase-shift'),
  'boss-overdrive-warning': c('both', 'boss-overdrive-warning'),
  // The menu set: glass and bell (FFX), soft FM tine (FFX-2).
  'cursor-move': c('ffx', 'cursor-move'),
  confirm: c('ffx', 'confirm'),
  cancel: c('ffx', 'cancel'),
  error: c('ffx', 'error'),
  'menu-open': c('ffx', 'menu-open'),
  'menu-close': c('ffx', 'menu-close'),
  'menu-page': c('ffx', 'menu-page'),
  'turn-ready': c('ffx', 'turn-ready'),
  'cursor-move-x2': c('ffx2', 'cursor-move'),
  'confirm-x2': c('ffx2', 'confirm'),
  'cancel-x2': c('ffx2', 'cancel'),
  'error-x2': c('ffx2', 'error'),
  'menu-open-x2': c('ffx2', 'menu-open'),
  'menu-close-x2': c('ffx2', 'menu-close'),
  'menu-page-x2': c('ffx2', 'menu-page'),
  'turn-ready-x2': c('ffx2', 'turn-ready'),
};

export const V2_PREFIX = 'v2:';

export function isV2Key(key: string): boolean {
  return key.startsWith(V2_PREFIX);
}

/** `v2:fire-x2` -> `fire-x2`. */
export function v2Name(key: string): string {
  return isV2Key(key) ? key.slice(V2_PREFIX.length) : key;
}

/** The first-sprite cue that stands in for a v2 key; the key itself when it is not a v2 key. */
export function v2Fallback(key: string): string {
  if (!isV2Key(key)) return key;
  return V2_CUES[v2Name(key)]?.fallback ?? 'hit-1';
}

/**
 * The cue a game plays for a base name, or `null` when that game has none (rule 14: an FFX-only cue
 * never plays in FFX-2, and the reverse). FFX-2 takes the `-x2` twin when there is one.
 */
export function twin(base: string, game: 'ffx' | 'ffx2'): string | null {
  if (game === 'ffx2') {
    const x2 = V2_CUES[`${base}-x2`];
    if (x2) return `${V2_PREFIX}${base}-x2`;
  }
  const cue = V2_CUES[base];
  if (!cue) return null;
  return cue.game === 'both' || cue.game === game ? `${V2_PREFIX}${base}` : null;
}
