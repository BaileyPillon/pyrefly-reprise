/**
 * THE AUDIO PASS TABLES (conference demo sound pass, 2026-10-22; Bailey, decision 184: "You choose all sound effects and music and voice overs for me for now please"; decision 178r: sound goes to
 * the same bar as the visuals, Expedition 33 and Hades). Every row is a pick made WITHOUT ears (AGENTS.md rule 13): the reason is a measurement of the shipped library, written beside it, and the
 * measuring tool (`tools/audio/pass-render.mjs`) reproduces every number. Bailey overturns a pick by ear on `docs/audio/audition.html` ("Delegated picks, 22 Oct").
 *
 * What the library's hits are, measured (`measure/library.json`): the recorded and v2 FFX hits are all body and sub (the v2 sword hit has 76 percent of its energy under 120 Hz, the v2 staff hit 96,
 * the first-bank hits 84 to 94) with 0.5 to 7 percent above 4 kHz, and no transient in their first 3 ms; the FFX-2 recorded hits are the opposite (dagger, greatsword and gun hits have 0 to 1 percent
 * of their energy under 500 Hz and 60 to 95 percent over 6 kHz). A hit with a crack and a body and a sub is the layering every action game uses; here each missing part is cut from a cue the library
 * already ships. No cue below is new audio.
 *
 * The rules the rows obey (checked by `tests/unit/audio-pass-recipes.test.ts` and, on the rendered sum, by `tools/audio/pass-render.mjs`):
 *  1. Only the party's and the bosses' blows of the two demo games get layers, each game its own weapons (rule 14: `Weapon` is game-tagged by `weapons.ts`).
 *  2. A layer never leads its base (`lagMs >= 0`) and is cut from its slice at its own first audible sample (`skipMs`), so the layer's onset lands on the base's: onsets within 1 ms.
 *  3. A texture or character layer peaks at least 6 dB under its base, a body layer at least 4 dB: the base stays the loudest part of an ordinary blow ("nothing louder than the hit layer except
 *     big moments"). A thump may peak up to 3 dB under the base's peak, on a big moment only.
 *  4. Pure data: no DOM, no Web Audio.
 */

import type { Weapon } from '../sfxV2/weapons.ts';
import type { BigKind, DipPlan, LayerSpec } from './passTypes.ts';

const L = (key: string, db: number, skipMs: number, trimMs: number, fadeMs: number, pitch = 1, lagMs = 0, pan = 0): LayerSpec => ({ key, db, pitch, skipMs, trimMs, fadeMs, lagMs, pan });

/** What one weapon's blow gets under its base cue: a crack (the transient the sub-heavy hits lack), or a body (what the crack-only hits lack). */
export interface WeaponRecipe {
  texture?: LayerSpec;
  body?: LayerSpec;
}

/**
 * Weapon recipes. FFX weapons (`sword`, `katana`, `spear`, `blitzball`, `staff`, `doll`, `claw`) are FFX only, FFX-2 weapons (`gun`, `dagger`, `greatsword`) FFX-2 only (`weapons.ts`).
 *
 * FFX rows add the crack: `v2:counter`'s first 70 ms (a steel-on-steel tick: 75 percent of its energy at 2 to 6 kHz, centroid 2.9 kHz, onset 0.2 ms) for the two blades, `first:pierce` for the spear
 * (77 percent at 500 to 2 kHz, 20 at 2 to 6), `first:od-hit-zone` for the blunt staff (99 percent at 500 to 2 kHz: a knock, not a ring), `first:claw` for the claw.
 * FFX-2 rows add the body: `v2:hit-2` (88 percent under 120 Hz, onset 2.2 ms) under the gun, `v2:hit-sword` pitched down under the greatsword, `v2:hit-2` pitched up under the daggers.
 */
export const WEAPON_RECIPES: Readonly<Record<Weapon, WeaponRecipe>> = {
  sword: { texture: L('v2:counter', -2, 0.2, 70, 40) },
  katana: { texture: L('v2:counter', -6, 0.2, 80, 45, 0.86) },
  spear: { texture: L('first:claw', 1, 0.5, 70, 40, 0.9) },
  blitzball: { texture: L('first:od-hit-zone', 8.5, 0.9, 60, 35, 0.8) },
  staff: { texture: L('first:od-hit-zone', 8.5, 0.9, 60, 35, 1) },
  doll: { texture: L('first:od-hit-zone', 9, 0.9, 50, 30, 1.25) },
  claw: { texture: L('first:claw', -0.5, 0.5, 70, 40) },
  gun: { body: L('v2:hit-2', -8.5, 2.2, 240, 140) },
  dagger: { body: L('v2:hit-2', -12, 2.2, 190, 110, 1.35) },
  greatsword: { body: L('v2:hit-sword', -9.5, 12.3, 280, 160, 0.8) },
};

/** An enemy's blow (a boss's plain attack): the claw's crack, pitched down, over the heavy-enemy base. */
export const ENEMY_RECIPE: WeaponRecipe = { texture: L('first:claw', -1.5, 0.5, 70, 40, 0.8) };

/**
 * The small per-character layer: a short accent (ornament, sleeve, bracer) so the party's blows are told apart by where their accent sits in the spectrum. Chosen by the accent cue's measured
 * centroid so that no two characters of one party share a slot: FFX Auron `v2:guard` (600 Hz), Kimahri `first:claw` pitched down (about 1.9 kHz), Tidus `first:chain-hit` (5.7 kHz), Yuna
 * `v2:status-applied` (4.4 kHz at +20 percent); FFX-2 Paine `v2:guard` pitched down, Rikku `first:dagger-flurry` (2.9 kHz), Yuna `first:chain-hit` (5.7 kHz). Level 14 to 20 dB under the base.
 */
export const CHARACTER_LAYERS: Readonly<Record<'ffx' | 'ffx2', Readonly<Record<string, LayerSpec>>>> = {
  ffx: {
    tidus: L('first:chain-hit', 2, 1.2, 90, 55, 1, 4),
    auron: L('v2:guard', -17, 12, 70, 40, 0.9, 2),
    kimahri: L('v2:swing-claw', -12.5, 0.8, 70, 40, 0.8, 3),
    yuna: L('v2:status-applied', 4.5, 9.2, 80, 50, 1.2, 4),
    lulu: L('first:chain-hit', 3.5, 1.2, 80, 50, 0.8, 5),
    wakka: L('v2:guard', -13, 12, 60, 35, 1.15, 2),
    rikku: L('first:dagger-flurry', -5.5, 0.8, 70, 40, 1.2, 3),
  },
  ffx2: {
    yuna: L('first:chain-hit', -2, 1.2, 90, 55, 1.2, 4),
    rikku: L('first:dagger-flurry', -11, 0.8, 70, 40, 1.3, 3),
    paine: L('v2:guard', -17.5, 12, 80, 45, 0.8, 2),
  },
};

/**
 * The low-end thump on a big blow (the dip before it is {@link DIPS}). A crit gets `first:footstep` pitched down (a 90 Hz tick with 93 percent of its energy under 120 Hz, onset 0.4 ms, 20 dB down by
 * 45 ms); an Overdrive finisher and a boss's headline blow get the first 380 ms of `v2:explosion` pitched down (98 percent under 120 Hz, centroid 49 Hz over the whole cue).
 */
export const THUMPS: Readonly<Record<BigKind, LayerSpec>> = {
  crit: L('first:footstep', -11.5, 0.4, 210, 130, 0.78),
  overdrive: L('v2:explosion', -5, 0.4, 380, 230, 0.85),
  boss: L('v2:explosion', -5, 0.4, 380, 230, 0.85),
};

/**
 * The dip of the music before a big blow (decision 184: "a short duck/silence of 60-120 ms just before big impacts"): the music bus only, never the effects or the voice. The blow is `leadMs`
 * ahead when the dip starts, the music is `depthDb` down for `holdMs`, and it comes back over `releaseMs` from the blow on.
 */
export const DIPS: Readonly<Record<BigKind, DipPlan>> = {
  crit: { leadMs: 90, holdMs: 70, depthDb: -9, releaseMs: 240 },
  overdrive: { leadMs: 120, holdMs: 100, depthDb: -14, releaseMs: 380 },
  boss: { leadMs: 120, holdMs: 100, depthDb: -12, releaseMs: 420 },
};

/** The boss moves that are headline blows, and which of their hits is the big one (mirrors `engine/BattlePresenterBossFx.ts` `BIG_BLOWS`; Total Annihilation's is the fifth). */
export const HEADLINE_BLOWS: Readonly<Record<string, 'first' | 'last'>> = {
  'total-annihilation': 'last',
  'cross-cleave': 'first',
  'mega-flare': 'first',
  'x2-bahamut-mega-flare': 'first',
};

/** One menu cue of the family: gain on whatever plays (dB), and the length it is cut to. */
export interface UiRow {
  gainDb: number;
  trimMs: number;
  fadeMs: number;
}

/**
 * THE MENU FAMILY (decision 178r, "UI clicks" to the same bar): one set of levels and lengths for the cues a player meets while moving, confirming, backing out, opening and closing, so that no
 * menu sound is louder than a hit and none lingers. Today the menu cues peak anywhere from -7.4 dBFS (the error) to -22.3 (turn-ready) at the master, run 235 to 700 ms and the open, close and
 * page cues are the v2 sprite's 700 ms slices. The family cuts each to 110 to 260 ms with a fade of 40 percent of it and sets the peak at the master (before the pass's makeup) by what the cue is for:
 * the cursor tick, which repeats most, -22 dBFS; page -24; open -21; close -22; back -20; turn-ready -19 (the one that must be noticed while the fight runs); error -16 (the only menu sound that
 * warns). Measured on the cue that plays: the game's recorded original when its core pack has one, else the v2 slice (`tools/audio/pass-render.mjs ui`). The gain is per game because the banks
 * differ: FFX plays the v2 slices for open, close, page and turn-ready, FFX-2 plays recorded originals for all but turn-ready. Keys are the cue's base name (`cursor-move`, not `cursor-move-x2`).
 * Confirm is the cursor tick in both games (decision 52k: one retail sound), so it takes the tick's row.
 */
export const UI_FAMILY: Readonly<Record<'ffx' | 'ffx2', Readonly<Record<string, UiRow>>>> = {
  ffx: {
    'cursor-move': { gainDb: -7, trimMs: 110, fadeMs: 45 },
    cancel: { gainDb: -3, trimMs: 160, fadeMs: 70 },
    error: { gainDb: -8.5, trimMs: 260, fadeMs: 110 },
    'menu-open': { gainDb: -5, trimMs: 210, fadeMs: 90 },
    'menu-close': { gainDb: -3.5, trimMs: 190, fadeMs: 85 },
    'menu-page': { gainDb: -7.5, trimMs: 140, fadeMs: 60 },
    'turn-ready': { gainDb: 3.5, trimMs: 230, fadeMs: 100 },
  },
  ffx2: {
    'cursor-move': { gainDb: -7, trimMs: 110, fadeMs: 45 },
    cancel: { gainDb: -3, trimMs: 160, fadeMs: 70 },
    error: { gainDb: -8.5, trimMs: 260, fadeMs: 110 },
    'menu-open': { gainDb: -1, trimMs: 210, fadeMs: 90 },
    'menu-close': { gainDb: -4, trimMs: 190, fadeMs: 85 },
    'menu-page': { gainDb: -3.5, trimMs: 140, fadeMs: 60 },
    'turn-ready': { gainDb: 3, trimMs: 230, fadeMs: 100 },
  },
};

/** The family row for a cue the mixer is about to play (`v2:cursor-move-x2`, `v2:menu-open`, a plain `cancel`), or null when it is not a menu cue. */
export function uiRowFor(game: 'ffx' | 'ffx2', cue: string): UiRow | null {
  const bare = cue.replace(/^v2:/, '').replace(/-x2$/, '');
  const row = UI_FAMILY[game][bare === 'confirm' ? 'cursor-move' : bare];
  return row ?? null;
}
