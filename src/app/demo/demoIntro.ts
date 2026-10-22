/**
 * THE SHORT VOICED INTRO (release 62, the conference demo; Bailey, 2026-10-22 ~00:00 EDT, decision 173f: "Keep a short voiced intro (Recommended)": demo mode plays the 2-3 best voiced lines of the pre-fight scene,
 * about 10 seconds, skippable with A, so every visitor hears the cast). **FFX only: Chapter I, Seymour Flux.** FFX-2's Bahamut has no recorded lines (`story/voice/voiceManifest.ts#GAMES_WITH_VOICE` lists FFX only;
 * Bailey has not picked FFX-2 voices), so its fight keeps skipping its scene exactly as release 61 does.
 *
 * Release 61's demo skips both story scenes (`demoFlow.ts#demoRunDefaults`), which also took away the only place a visitor hears the three recorded voices (Tidus, Yuna, Auron: Fish Audio, `public/audio/voice/`).
 * This puts back three lines of the real pre-battle scene (`story/scripts/seymour-flux.ts`, `pre`), word for word, so each one finds its own recording (the manifest is keyed by speaker and text):
 *
 *   Tidus  "That's not comfort. That's a pile of bodies."   (`seymour-flux.pre.008`, 3.6 s)
 *   Yuna   "You don't get to hand me a reason."             (`seymour-flux.pre.018`, 2.1 s)
 *   Auron  "Enough talk. Move."                             (`seymour-flux.pre.026`, 1.9 s)
 *
 * Seymour's own lines are not recorded and are left out; the three that are, one voice each, are in the order the scene has them, and the last one is the scene's own cue into the fight (the Mortiorchis unfolds,
 * the boss theme takes over, then `battleStart`). With the lines' 7.6 s of speech, a short beat of wind and the 0.35 s holds after each line, the whole thing runs about 10 seconds.
 *
 * It is the game's own `CutsceneScreen` on a trimmed script, so everything a story scene does holds: the dialogue box and portraits, the voice and its duck, A / Enter advances a line, holding A / Enter skips the
 * rest, B / Esc opens the pause. It plays once per fight picked from the picker (not on TRY AGAIN, not on RESTART ENCOUNTER) and only where `GameFlow` has a factory for it
 * (`ui/common/registerFlowScreens.ts`), so a harness with none, and every run outside demo mode, see exactly the flow they saw before.
 */

import { demoModeOn } from '../demoMode.ts';
import { battleStart, camera, fade, fx, music, say, shake, sfx, showActor, wait, type StoryScript } from '../../story/dsl.ts';
import { isDemoFight } from './demoFlow.ts';

/** How long each line holds after its recording ends, ms (a spoken line is never cut by its own timer: `DialogueBox.update`). */
const HOLD_MS = 350;

/** Chapter I's intro. Every `say` is a line of the real `pre` script, word for word. */
export const SEYMOUR_FLUX_INTRO: StoryScript = [
  music('scene-gagazet', 900),
  camera('idle', 0),
  fade('clear', 500),
  sfx('wind-high-altitude'),
  showActor('seymour', { at: { slot: 0, side: 'enemy' }, ms: 500, facing: -1 }),
  wait(600),
  say('tidus', "That's not comfort. That's a pile of bodies.", { emotion: 'angry', auto: HOLD_MS }),
  say('yuna', "You don't get to hand me a reason.", { auto: HOLD_MS }),
  // The scene turns: the Mortiorchis unfolds out of the snow beneath him and the boss theme takes over (the real script's own ending).
  music('boss-seymour', 900),
  fx('mortiorchis-unfold', 'seymour'),
  shake(10, 700),
  camera('action', 500),
  say('auron', 'Enough talk. Move.', { auto: HOLD_MS }),
  battleStart(),
];

/** The intro of a demo fight, or null for one that has none (FFX-2's Bahamut: no recorded lines). */
export const DEMO_INTROS: Readonly<Record<string, StoryScript>> = {
  'seymour-flux': SEYMOUR_FLUX_INTRO,
};

/** What a run asked for, as far as the intro cares. */
export interface IntroRun {
  auto?: unknown;
  speed?: string;
  pilgrim?: unknown;
  restart?: boolean;
  skipResults?: boolean;
}

/**
 * The intro to play before this demo fight, or null. Demo mode, a chapter with an intro, a run a person started: not an automated one (`auto`, `speed: 'skip'`, `skipResults`: the debug API, the critic, a spec), not a
 * Pilgrimage fight, not a RESTART ENCOUNTER. The caller plays it only on a fresh pick (attempt 0): TRY AGAIN goes straight back in.
 */
export function demoIntroFor(chapterId: string, run: IntroRun): StoryScript | null {
  if (!demoModeOn() || !isDemoFight(chapterId)) return null;
  if (run.auto || run.speed === 'skip' || run.skipResults || run.pilgrim !== undefined || run.restart === true) return null;
  return Object.prototype.hasOwnProperty.call(DEMO_INTROS, chapterId) ? DEMO_INTROS[chapterId]! : null;
}
