/**
 * Pause-screen and prebattle-tab metadata for the hidden Spectral Keeper chapter (FFX only; `./chapter-spectral-keeper.ts`, 2026-11-02) [research/re-ffx-spectral-keeper.md, research/writing-bible.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The Keeper, the glyphs and the Move command are FFX's.
 *
 * - `title`, `subtitle`, `blurb` and `location` are the chapter record's own (`SPECTRAL_KEEPER_TEXT`).
 * - `quote` is a line Auron speaks in the pre scene (`src/story/scripts/spectral-keeper.ts`, a draft for Bailey to read), our own words in his register (writing bible section 1.2: laconic, dry).
 * - `objectives` are ours, each a rule `src/ui/common/chapterObjectives.ts` already answers: wear it down by a third, bring it below a third, and the win.
 * - `tip` and `handwritten` are our own words over the research's sourced rules (RE sections 3 to 5).
 * - `heroArt` is not made yet (`pause/ch29-spectral-keeper`, so the pause screen shows the fallback): `heroArtFallback` is an existing approved plate of the Dome. `snapshots` are existing assets only.
 * - `musicKeys` are the cues the chapter plays: the Dome's bed, the stand-in boss cue and the FFX fanfare.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { SPECTRAL_KEEPER_TEXT } from './chapter-spectral-keeper.ts';
import { SPECTRAL_KEEPER_CHAPTER_ID } from './ffx/spectral-keeper-ids.ts';

export const SPECTRAL_KEEPER_META: ChapterMeta = {
  id: SPECTRAL_KEEPER_CHAPTER_ID,
  gameLabel: 'FFX',
  numeral: 'EXP',
  ...SPECTRAL_KEEPER_TEXT,
  location: 'Zanarkand Dome — the foot of the lift',
  heroArt: 'pause/ch29-spectral-keeper',
  heroArtFallback: 'backdrops/zanarkand-dome.png',
  quote: { text: 'It does not tire. It does not forget.', speaker: 'Auron' },
  handwritten: 'step off the lit glyph',
  objectives: [
    { id: 'a-third', label: 'Wear it down by a third', rule: { kind: 'boss-hp-below', fraction: 0.67 } },
    { id: 'below-a-third', label: 'Bring it below a third', rule: { kind: 'boss-hp-below', fraction: 0.33 } },
    { id: 'door-open', label: 'Open the door', rule: { kind: 'victory' } },
  ],
  tip: 'Every blow draws a sweep on three glyphs. Stand outside them, and step off a lit glyph before its turn comes up.',
  snapshots: [
    { image: 'backdrops/zanarkand-dome.png', caption: 'the dome' },
    { image: 'characters/yunalesca-1/idle.png', caption: 'what waits behind the door' },
    { image: 'characters/auron/idle.png', caption: 'keep walking' },
  ],
  focalCharacterId: 'auron',
  musicKeys: ['scene-zanarkand-dome', 'boss-challenge', 'victory-ffx'],
};

export default SPECTRAL_KEEPER_META;
