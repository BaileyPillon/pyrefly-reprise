/**
 * Pause-screen and prebattle-tab metadata for the hidden Sanctuary Keeper chapter (FFX only; `./chapter-sanctuary-keeper.ts`, 2026-11-06) [research/re-ffx-sanctuary-keeper.md, research/writing-bible.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The Keeper, the summit and the party's spells are FFX's.
 *
 * - `title`, `subtitle`, `blurb` and `location` are the chapter record's own (`SANCTUARY_KEEPER_TEXT`).
 * - `quote` is a line Auron speaks in the pre scene (`src/story/scripts/sanctuary-keeper.ts`, a draft for Bailey to read), our own words in his register (writing bible section 1.4: laconic, dry).
 * - `objectives` are ours, each a rule `src/ui/common/chapterObjectives.ts` already answers: bring it below three quarters, below a half, and the win.
 * - `tip` and `handwritten` are our own words over the research's sourced rules (RE sections 4 and 6): no number in them.
 * - `heroArt` is the pause plate `pause/ch39-sanctuary-keeper` (**not painted yet**); `heroArtFallback`, Chapter I's Gagazet plate, shows in its place. `snapshots`: the mountain's plate and two of the party's idles (stand-ins
 *   until the chapter's own paintings exist).
 * - `musicKeys` are the cues the chapter plays: the mountain's bed, the stand-in boss cue and the FFX fanfare.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { SANCTUARY_KEEPER_TEXT } from './chapter-sanctuary-keeper.ts';
import { SANCTUARY_KEEPER_CHAPTER_ID } from './ffx/sanctuary-keeper-ids.ts';

export const SANCTUARY_KEEPER_META: ChapterMeta = {
  id: SANCTUARY_KEEPER_CHAPTER_ID,
  gameLabel: 'FFX',
  numeral: 'EXP',
  ...SANCTUARY_KEEPER_TEXT,
  location: 'Mt. Gagazet — the summit',
  heroArt: 'pause/ch39-sanctuary-keeper',
  heroArtFallback: 'backdrops/gagazet.png',
  quote: { text: 'Then take the mending from it.', speaker: 'Auron' },
  handwritten: 'its own spell, back on it',
  objectives: [
    { id: 'three-quarters', label: 'Bring it below three quarters', rule: { kind: 'boss-hp-below', fraction: 0.75 } },
    { id: 'half', label: 'Bring it below half', rule: { kind: 'boss-hp-below', fraction: 0.5 } },
    { id: 'road-open', label: 'Open the road', rule: { kind: 'victory' } },
  ],
  tip: 'Plain blows cannot outrun its healing. Poison it, then Reflect it, and its own spell mends you. Shell before the breath.',
  snapshots: [
    { image: 'backdrops/gagazet.png', caption: 'the summit road' },
    { image: 'characters/yuna/idle.png', caption: 'its own spell, back on it' },
    { image: 'characters/auron/idle.png', caption: 'keep walking' },
  ],
  focalCharacterId: 'auron',
  musicKeys: ['scene-gagazet', 'boss-seymour', 'victory-ffx'],
};

export default SANCTUARY_KEEPER_META;
