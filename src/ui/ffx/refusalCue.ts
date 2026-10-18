/**
 * The refusal cue of the FFX command menu (re-parity RC11, `MENU_DRAW_PARITY` item f; **FFX only**): the original plays its menu sound 3 (0x00886BA0) when a confirm lands on a row the resolver refuses
 * (0x0089C900, 0x0089CCF5). Our FFX menu set has an `error` cue (`src/audio/sfxV2/cues.ts`); it is the nearest stand-in, chosen by name and not heard (Bailey judges audio by ear, AGENTS.md rule 13).
 * A missing audio context or an unregistered cue costs a sound, never the menu.
 */

import { audio } from '../../audio/index.ts';

export function playRefusal(): void {
  try {
    audio.playSfx('error');
  } catch {
    /* no audio context, or the cue is not registered: the shake alone stands */
  }
}
