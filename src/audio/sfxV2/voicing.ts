/**
 * Which game's voice the effects speak in right now, and the keys that change voice with it.
 *
 * Set by the screens of a chapter (`src/app/sfxGame.ts`): an FFX chapter's party prep, battle,
 * pause and results speak FFX; an FFX-2 chapter's speak FFX-2. The title, chapter select and every
 * FF7 screen set nothing (`null`) and keep the first sprite's cues exactly as before: the set is an
 * FFX / FFX-2 set, and THEMES.md assigns the title and menus to neither game (AGENTS.md rule 14).
 *
 * `voiceKey` is what `AudioManager.playSfx` applies to every key it is handed, so the menu set
 * reaches every menu without touching the call sites: `cursor-move` is the FFX glass-and-bell step in
 * an FFX chapter and the FFX-2 FM tine in an FFX-2 chapter. Battle cues are chosen by the presenter
 * (`battleVoice.ts`), which knows who acts; only keys whose meaning does not depend on the actor are
 * listed here.
 *
 * Pure module state, like the pacing's game (`src/engine/pace.ts`): no DOM, no Web Audio.
 */

import { twin } from './cues.ts';

export type SfxGame = 'ffx' | 'ffx2';

let game: SfxGame | null = null;

/** A chapter's game id as the effects see it: FFX and FFX-2 have a voice, anything else keeps the first sprite. */
export function setSfxGame(g: string | null): void {
  game = g === 'ffx' || g === 'ffx2' ? g : null;
}

export function sfxGame(): SfxGame | null {
  return game;
}

/** First-sprite keys that take the game's v2 twin whoever plays them: the menu set and the "a status landed" bell. */
const AUTO: Readonly<Record<string, string>> = {
  'cursor-move': 'cursor-move',
  confirm: 'confirm',
  cancel: 'cancel',
  error: 'error',
  'menu-open': 'menu-open',
  'menu-close': 'menu-close',
  'menu-page': 'menu-page',
  'turn-ready': 'turn-ready',
  'status-applied': 'status-applied',
};

/** The Overdrive (FFX) / Special (FFX-2) stinger, for the moment the Overdrive shot opens (`BattleMoments.overdriveStart`). */
export function stingerFor(g: SfxGame | null): string | null {
  if (g === 'ffx') return 'v2:overdrive-stinger';
  if (g === 'ffx2') return 'v2:special-stinger';
  return null;
}

/** The key to play for `key` under game `g`: its v2 twin when it has one there, else `key` unchanged. */
export function voiceKey(key: string, g: SfxGame | null = game): string {
  if (!g) return key;
  const base = AUTO[key];
  if (base === undefined) return key;
  return twin(base, g) ?? key;
}
