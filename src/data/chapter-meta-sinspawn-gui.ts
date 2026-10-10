/**
 * Pause-screen and prebattle-tab metadata for the hidden Sinspawn Gui chapter (FFX only; `./chapter-sinspawn-gui.ts`, Bailey 2026-10-10).
 * PLACEHOLDER-GUI: the objectives, quote and tip are written from the research once it lands.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { SINSPAWN_GUI_ID, SINSPAWN_GUI_TEXT, MUSHROOM_ROCK_SCENE } from './chapter-sinspawn-gui.ts';

export const SINSPAWN_GUI_META: ChapterMeta = {
  id: SINSPAWN_GUI_ID,
  gameLabel: 'FFX',
  numeral: 'EXP',
  ...SINSPAWN_GUI_TEXT,
  location: "Mushroom Rock Road — Operation Mi'ihen",
  heroArt: 'pause/ch19-sinspawn-gui',
  heroArtFallback: 'portraits/seymour-macalania.png',
  quote: { text: 'PLACEHOLDER-GUI', speaker: 'Seymour' },
  handwritten: 'PLACEHOLDER-GUI',
  objectives: [
    { id: 'halve-gui', label: 'Bring Sinspawn Gui below half', rule: { kind: 'boss-hp-below', fraction: 0.5 } },
    { id: 'halve-gui-2', label: 'PLACEHOLDER-GUI', rule: { kind: 'boss-hp-below', fraction: 0.25 } },
    { id: 'defeat-gui', label: 'Defeat Sinspawn Gui', rule: { kind: 'victory' } },
  ],
  tip: 'PLACEHOLDER-GUI',
  snapshots: [
    { image: `backdrops/${MUSHROOM_ROCK_SCENE}.png`, caption: 'PLACEHOLDER-GUI' },
    { image: 'characters/seymour-macalania/idle.png', caption: 'PLACEHOLDER-GUI' },
    { image: 'characters/seymour-macalania/cast.png', caption: 'PLACEHOLDER-GUI' },
  ],
  focalCharacterId: 'seymour',
  musicKeys: ['scene-gagazet', 'battle-ffx', 'victory-ffx'],
};

export default SINSPAWN_GUI_META;
