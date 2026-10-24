/**
 * THE SOUND TEST TITLES (PC-11 of the audio pass; Bailey's decision D-830 answered "as proposed" by D-932 P4, proposal `docs/handoff/r46-audio2.md` part 4, FOC45-03): the 17 music cues the pause
 * jukebox can list for FFX and FFX-2 chapters that had no composed title and showed their id with spaces ("Boss Bahamut"). Two to three words each, written from each cue's brief, none a retail track
 * name. They show while the sound pass is on (Chapter I and IV with `?audio=new` / `?pack=demo`), so the demo's jukebox reads like a soundtrack and the live game's does not change before Bailey hears them
 * (the picks are a "for now": he renames any of them on the audition page's notes). Chapter IV's results cue is silent under the pass; `victory-bahamut` stays listed because the jukebox plays any cue.
 *
 * Pure data; no DOM, no Web Audio.
 */

import { audioNewOn } from './passSwitch.ts';

export const PASS_TITLES: Readonly<Record<string, string>> = {
  'boss-bahamut': 'Mercy Withheld',
  'victory-bahamut': 'Quiet Reckoning',
  'boss-leblanc': 'Brass Bravado',
  'scene-chateau-leblanc': 'Strut in Velvet',
  'boss-ffx2-fallen-aeons': 'Gilded Requiem',
  'boss-trema': 'Cold Liturgy',
  'boss-den-of-woe': 'Hollow Reunion',
  'boss-experiment': 'Rogue Prototype',
  'defeat-ffx2': 'Falling, Gently',
  'boss-challenge': 'Unhearing Cold',
  'boss-seymour-natus': 'Lord Unmade',
  'boss-seymour-omnis': 'Past All Courtesy',
  'boss-isaaru': 'The Gods Answer',
  'boss-sin-assault': 'Skyward Siege',
  'boss-sin-countdown': 'Borrowed Seconds',
  'boss-gui': 'Camp Under Shadow',
  'defeat-ffx': 'One Bell Tolled',
};

/** The composed title a cue takes while the pass is on, or null. */
export function passTitleOf(name: string): string | null {
  return audioNewOn() ? (PASS_TITLES[name] ?? null) : null;
}
