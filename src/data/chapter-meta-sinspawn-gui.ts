/**
 * Pause-screen and prebattle-tab metadata for the hidden Sinspawn Gui chapter (FFX only; `./chapter-sinspawn-gui.ts`, Bailey 2026-10-10)
 * [research/ffx-sinspawn-gui.md, research/re-ffx-ai-gui.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The Ridge, Operation Mi'ihen and Seymour's one fight at the party's side are FFX's.
 *
 * - `title`, `subtitle`, `blurb` and `location` are the chapter record's own (`SINSPAWN_GUI_TEXT`).
 * - `quote` is the line Seymour speaks in the pre scene (`src/story/scripts/sinspawn-gui.ts`), our own words in his register (writing bible section 1.9: long balanced clauses, courtesy).
 * - `objectives` are ours (the plan names none), each a rule `src/ui/common/chapterObjectives.ts` already answers, and none a number of the party's (the party at the Ridge is an estimate): bring both
 *   arms down (research section 4.5, the arms' shield), reach the second fight, and the win.
 * - `tip` and `handwritten` are our own words over the research's sourced rules (section 4.3 the head's cancel, section 4.5 the shield, section 5.2 Seymour's spells).
 * - `heroArt` is not made yet (`pause/ch21-sinspawn-gui`, so the pause screen shows the fallback): `heroArtFallback` is Seymour's approved portrait, the chapter's hook. `snapshots` are existing
 *   assets only: the Ridge plate (a provisional one until the overnight pick is installed), the body's provisional painting, Seymour's approved cast.
 * - `musicKeys` are the cues the chapter plays, all existing: `scene-gagazet` under the narration, `boss-dread` for the Ridge, `boss-seymour` for the guest hour (stand-ins for the game's own
 *   two, named in `docs/audio/THEMES.md`), and the shared `victory-ffx`.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { SINSPAWN_GUI_TEXT } from './chapter-sinspawn-gui.ts';
import { MUSHROOM_ROCK_SCENE, SINSPAWN_GUI_ID } from './ffx/sinspawn-gui-ids.ts';

export const SINSPAWN_GUI_META: ChapterMeta = {
  id: SINSPAWN_GUI_ID,
  gameLabel: 'FFX',
  numeral: 'EXP',
  ...SINSPAWN_GUI_TEXT,
  location: "Mushroom Rock Road — Operation Mi'ihen",
  heroArt: 'pause/ch21-sinspawn-gui',
  heroArtFallback: 'portraits/seymour-macalania.png',
  quote: { text: 'Hope is a kind of courage, Lady Yuna.', speaker: 'Seymour' },
  handwritten: 'the arms first, then the body',
  objectives: [
    { id: 'arms-down', label: "Bring both of Gui's arms down", rule: { kind: 'parts-downed', targetIds: ['sinspawn-gui-arm-left', 'sinspawn-gui-arm-right'] } },
    { id: 'guest-hour', label: 'Reach the second fight', rule: { kind: 'link-reached', link: 2 } },
    { id: 'defeat-gui', label: 'Defeat Sinspawn Gui', rule: { kind: 'victory' } },
  ],
  tip: "Bring Auron: his Power Break halves the body's blows. The arms turn every blade aside, so bring them down first, and strike the head when it starts to shake.",
  snapshots: [
    { image: `backdrops/${MUSHROOM_ROCK_SCENE}.png`, caption: 'the Ridge' },
    { image: 'characters/sinspawn-gui/idle.png', caption: 'guarded by its arms' },
    { image: 'characters/seymour-macalania/cast.png', caption: 'a guest at your side' },
  ],
  focalCharacterId: 'seymour',
  musicKeys: ['scene-gagazet', 'boss-dread', 'boss-seymour', 'victory-ffx'],
};

export default SINSPAWN_GUI_META;
