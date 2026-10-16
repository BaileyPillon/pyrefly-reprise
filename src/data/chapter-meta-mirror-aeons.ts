/**
 * Pause-screen and prebattle-tab metadata for the Mirror Aeons chapter (Chapter XXVII, FFX only, listed 2026-10-15; `./chapter-mirror-aeons.ts`, Bailey 2026-10-15; scaffolded the same day)
 * [research/ffx-mirror-aeons.md, research/re-ffx-yojimbo-sisters-feasibility.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The Dark Aeons and Yuna's Yojimbo and Magus Sisters are FFX's.
 *
 * - `title`, `subtitle`, `blurb` and `location` are the chapter record's own (`MIRROR_AEONS_TEXT`).
 * - `quote` is Yuna's one line in the pre scene (`src/story/scripts/mirror-aeons.ts`), our own words.
 * - `objectives` are ours, each a rule `src/ui/common/chapterObjectives.ts` already answers, and none a number of the fight's: send both sisters home (Act I), reach the cavern (Act II opens), win.
 * - `tip` and `handwritten` are our own words over the guides' common ground (`research/ffx-mirror-aeons.md`): the pair has no joint attack, so heal early (every fallen member costs a Phoenix Down) and spell Mindy; Dark Yojimbo's Overdrive cannot be turned by Auto-Life, so Yuna's Yojimbo goes in before his blade is full.
 * - `heroArt` is not made yet (`pause/ch27-mirror-aeons`, so the pause screen shows the fallback): `heroArtFallback` is Yuna's approved portrait. `snapshots` are existing assets only: Mushroom Rock Road's plate, Cindy's
 *   painting and Yojimbo's (the Dark ones draw the aeons' own, the possessed aeons' precedent).
 * - `musicKeys` are the cues the chapter plays: the mountain's bed under the scenes, `boss-challenge` for Act I, `boss-yojimbo` for Act II and the shared `victory-ffx`.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { MIRROR_AEONS_TEXT } from './chapter-mirror-aeons.ts';
import { DARK_MINDY_ID, DARK_SANDY_ID, MIRROR_ACT_I_PLATE, MIRROR_AEONS_ID } from './ffx/mirror-aeons-ids.ts';

export const MIRROR_AEONS_META: ChapterMeta = {
  id: MIRROR_AEONS_ID,
  gameLabel: 'FFX',
  numeral: 'XXVII',
  ...MIRROR_AEONS_TEXT,
  location: 'Mushroom Rock Road, and the Cavern of the Stolen Fayth',
  heroArt: 'pause/ch27-mirror-aeons',
  heroArtFallback: 'portraits/yuna.png',
  quote: { text: 'Sandy and Mindy. Wearing the wrong colours.', speaker: 'Yuna' },
  handwritten: 'heal early; spells for Mindy',
  objectives: [
    { id: 'sisters-down', label: 'Send both sisters home', rule: { kind: 'parts-downed', targetIds: [DARK_SANDY_ID, DARK_MINDY_ID] } },
    { id: 'the-cavern', label: 'Reach the cavern', rule: { kind: 'link-reached', link: 2 } },
    { id: 'send-the-blade', label: 'Send the dark blade home', rule: { kind: 'victory' } },
  ],
  tip: "Two sisters, no joint attack, and every fallen member costs a Phoenix Down: heal early, and use spells on Mindy, whom no blade can find. In the cavern, Cheer first and call Yuna's Yojimbo in before his blade is full.",
  snapshots: [
    { image: `backdrops/${MIRROR_ACT_I_PLATE}.png`, caption: 'the road' },
    { image: 'characters/cindy/idle.png', caption: 'three in the wrong colours' },
    { image: 'characters/yojimbo/idle.png', caption: 'the blade below' },
  ],
  focalCharacterId: 'yuna',
  musicKeys: ['scene-gagazet', 'boss-challenge', 'boss-yojimbo', 'victory-ffx'],
};

export default MIRROR_AEONS_META;
