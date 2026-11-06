/**
 * Pause-screen and prebattle-tab metadata for the hidden Penance chapter (FFX only; `./chapter-penance.ts`, 2026-11-06) [research/re-ffx-penance.md, research/writing-bible.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Penance, its hands and the Celestial weapons are FFX's.
 *
 * - `title`, `subtitle`, `blurb` and `location` are the chapter record's own (`PENANCE_TEXT`).
 * - `quote` is a line Auron speaks in the pre scene (`src/story/scripts/penance.ts`, a draft for Bailey to read), our own words in his register (writing bible section 1.4: laconic, dry).
 * - `objectives` are ours, each a rule `src/ui/common/chapterObjectives.ts` already answers: take it past the change (a quarter of its life), bring it below half, and the win.
 * - `tip` and `handwritten` are our own words over the research's sourced rules (RE sections 4 to 6). **The tip teaches the public guides' winning line** (Jegged's Penance page; played on the real engine by `docs/handoff/ch-penance.md` section 5.1):
 *   Three Stars first so Quick Hit, Dispel and Esuna cost nothing once the MP is gone; keep one hand down at every one of Penance's turns, holding a hand's last blow until just before it acts; Dispel Penance's Regen and whoever Immolation breaks.
 *   166 characters, five lines at 1600 x 900 by the line model (`tests/unit/helpers/prepTipBand.ts`: room for 5.1), so no short form and no row in the overflow table are needed. The card and the page say the same at length (`data/guides/penance.ts`, `data/guides/docs/penance.ts`).
 * - `heroArt` is the pause plate `pause/ch35-penance` (painted for this chapter, r76 art install: Chapter VIII's deck plate graded, with the disc and the two arms over the sky and the hull; the driver's pick under Bailey's delegation, `docs/handoff/r76-art-install.md`);
 *   `heroArtFallback`, Chapter VIII's deck plate, shows while a tree has not got it. `snapshots`: the deck's plate, the disc itself and the Right Arm (the chapter's own idles; Tidus's idle stood in for "one hand down" until they existed).
 * - `musicKeys` are the cues the chapter plays: the Fahrenheit's bed, the stand-in boss cue and the FFX fanfare.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { PENANCE_TEXT } from './chapter-penance.ts';
import { PENANCE_CHAPTER_ID } from './ffx/penance-ids.ts';

export const PENANCE_META: ChapterMeta = {
  id: PENANCE_CHAPTER_ID,
  gameLabel: 'FFX',
  numeral: 'EXP',
  ...PENANCE_TEXT,
  location: 'The Fahrenheit — the deck',
  heroArt: 'pause/ch35-penance',
  heroArtFallback: 'backdrops/evrae-airship-deck.png',
  quote: { text: 'Cut a hand down and it grows back.', speaker: 'Auron' },
  handwritten: 'one hand always down',
  objectives: [
    { id: 'the-split', label: 'Make it split', rule: { kind: 'boss-hp-below', fraction: 0.75 } },
    { id: 'half', label: 'Bring it below half', rule: { kind: 'boss-hp-below', fraction: 0.5 } },
    { id: 'penance-done', label: 'Lay it to rest', rule: { kind: 'victory' } },
  ],
  tip: 'Three Stars first, then Quick Hit. Keep a hand down at every Penance turn: hold its last blow till just before it acts. Dispel its Regen and anyone Immolation breaks.',
  snapshots: [
    { image: 'backdrops/evrae-airship-deck.png', caption: 'the deck' },
    { image: 'characters/penance/idle.png', caption: 'what hangs over the bow' },
    { image: 'characters/penance-arm-right/idle.png', caption: 'one hand down' },
  ],
  focalCharacterId: 'auron',
  musicKeys: ['scene-fahrenheit', 'boss-challenge', 'victory-ffx'],
};

export default PENANCE_META;
