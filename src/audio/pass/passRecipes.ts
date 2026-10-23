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
 * The rules the rows obey (checked by `tests/unit/audio-pass.test.ts` and, on the rendered sum, by `tools/audio/pass-render.mjs`):
 *  1. Only the party's and the bosses' blows of the two demo games get layers, each game its own weapons AND its own cues (rule 14: `Weapon` is game-tagged by `weapons.ts`; a layer's cue is tagged for the
 *     game it plays in or for both: a `v2:` key by `sfxV2/cues.ts` `game`, a first-bank key by the game of the v2 cues it is the fallback of; `audio-pass.test.ts` checks every layer of every table).
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
 * FFX-2 rows add the body: `v2:hit-2` (a both-game cue: 88 percent under 120 Hz, onset 2.2 ms) under the gun, pitched down to 0.8 under the greatsword (measured: 99 percent under 500 Hz in its first 40 ms, centroid
 * 132 Hz; the FFX-only `v2:hit-sword` it replaced was a rule 14 slip, audio-pass review M3) and pitched up under the daggers.
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
  greatsword: { body: L('v2:hit-2', -9.5, 2.2, 280, 160, 0.8) },
};

/**
 * An enemy's blow (a boss's plain attack): a crack, pitched down, over the heavy-enemy base, each game its own. FFX: the first bank's claw (a cue only FFX's claws fall back to). FFX-2 (Bahamut): the steel tick
 * of `v2:counter` (a both-game cue: 75 percent of its energy at 2 to 6 kHz, onset 0.2 ms), pitched to 0.8; the claw was an FFX cue in Chapter IV (audio-pass review M3). Its level is the FFX-2 base's: the
 * recorded FFX-2 heavy-enemy base peaks 3.9 dB under FFX's, so the layer sits 3.9 dB lower (`pass-render.mjs tune`).
 */
export const ENEMY_RECIPES: Readonly<Record<'ffx' | 'ffx2', WeaponRecipe>> = {
  ffx: { texture: L('first:claw', -1.5, 0.5, 70, 40, 0.8) },
  ffx2: { texture: L('v2:counter', -5, 0.2, 70, 40, 0.8) },
};

/**
 * The small per-character layer: a short accent (ornament, sleeve, bracer) so the party's blows are told apart by where their accent sits in the spectrum. Chosen by the accent cue's measured
 * centroid so that no two characters of one party share a slot: FFX Auron `v2:guard` (600 Hz), Kimahri `first:claw` pitched down (about 1.9 kHz), Tidus `first:chain-hit` (5.7 kHz), Yuna
 * `v2:status-applied` (4.4 kHz at +20 percent); FFX-2 Paine `v2:guard` pitched down, Rikku `first:dagger-flurry` (2.9 kHz), Yuna `first:chain-hit` (5.7 kHz). Level 14 to 20 dB under the base.
 * FFX's Rikku (not in the demo party) takes the neutral `first:od-hit-zone` pitched up (a free slot) and not `dagger-flurry`, which is the first-bank fallback of FFX-2's `swing-dagger` (rule 14).
 */
export const CHARACTER_LAYERS: Readonly<Record<'ffx' | 'ffx2', Readonly<Record<string, LayerSpec>>>> = {
  ffx: {
    tidus: L('first:chain-hit', 2, 1.2, 90, 55, 1, 4),
    auron: L('v2:guard', -17, 12, 70, 40, 0.9, 2),
    kimahri: L('v2:swing-claw', -12.5, 0.8, 70, 40, 0.8, 3),
    yuna: L('v2:status-applied', 4.5, 9.2, 80, 50, 1.2, 4),
    lulu: L('first:chain-hit', 3.5, 1.2, 80, 50, 0.8, 5),
    wakka: L('v2:guard', -13, 12, 60, 35, 1.15, 2),
    rikku: L('first:od-hit-zone', -1.5, 0.9, 70, 40, 1.3, 3),
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
 *
 * Which dips are SCHEDULED (`engine/PassBeats.ts`): a critical's, from the swing (`attackBeat`), and a boss's headline blow's, from its landing wait (`landingBeat`), when the blow is still ahead of the effect's mark
 * at the moment it is asked. Not scheduled, by design: a blow whose mark has already passed when the presenter asks (the dip has no lead to be before; the thump still plays), and an Overdrive's finisher (the
 * last blow of a flurry whose timing nothing here knows: it gets its thump only). `overdrive` is therefore a plan the planner can name and no beat schedules; it is kept so the thump table and this one agree by kind.
 */
export const DIPS: Readonly<Record<BigKind, DipPlan>> = {
  crit: { leadMs: 90, holdMs: 70, depthDb: -9, releaseMs: 240 },
  overdrive: { leadMs: 120, holdMs: 100, depthDb: -14, releaseMs: 380 },
  boss: { leadMs: 120, holdMs: 100, depthDb: -12, releaseMs: 420 },
};

/**
 * The boss moves that are headline blows, and which of their hits is the big one. Only a blow that is still AHEAD of its effect's mark when the presenter asks can have a dip before it, and in a multi-hit move that is
 * the first blow alone: the later blows are asked at their marks (measured, stepped at 60 Hz: all three of Mega Flare's, `markIn` 0, 209 ms apart), so a dip on a later blow never fires.
 *
 * Cross Cleave: its first blow (the presenter's claim, `engine/BattlePresenterBossFx.ts` `BIG_BLOWS`). Total Annihilation: its FIRST blow, where feel's own rules stop and pulse it (50 ms, `engine/feel/HitStopShort.ts`;
 * the presenter's table says the fifth, but it does not claim the move, `FEEL_STOPS_IT`), so sound and picture agree (the pass first put it on the fifth, with no dip: audio-pass review minor 3). Mega Flare: its FIRST
 * landing, the explosion (`flare`), which is the moment the move is heard; feel stops and pulses its LAST blow, 0.42 s later on three girls, and nothing can dip the music before that blow, so the picture's stop
 * follows the dip and the thump by the length of the move (disclosed; a second table entry for the last blow was tried and lost the dip).
 */
export const HEADLINE_BLOWS: Readonly<Record<string, 'first' | 'last'>> = {
  'total-annihilation': 'first',
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
