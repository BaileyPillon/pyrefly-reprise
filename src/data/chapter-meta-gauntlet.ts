/**
 * Pause-screen and prebattle-tab metadata for the hidden Gauntlet chapter (FFX only; `./chapter-gauntlet.ts`, 2026-11-10) [research/re-ffx-monster-arena-creations.md, research/writing-bible.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The Monster Arena and its creations are FFX content.
 *
 * - `title`, `subtitle`, `blurb` and `location` are the chapter record's own (`GAUNTLET_TEXT`). **The two card lines of the preflight (GA7 and GA8) are the blurb's two sentences**: the game opens its creations by what
 *   you have caught and here every act is open; the stacked prize the game pays for a first win is not in this build (the chapter pays the file's drops only).
 * - `quote` is Auron's line in the pre scene (`src/story/scripts/gauntlet.ts`, a draft for Bailey to read), our own words.
 * - `objectives` are ours, each a rule `src/ui/common/chapterObjectives.ts` already answers: reach the second tier (the Earth Eater, the fourth act), reach the third (Th'uban, the seventh) and the win.
 * - `tip` and `handwritten` are our own words over the research's sourced rules (RE n 3): Neslug's shell turns every physical blow aside, the Ultima Buster's Arms gate its body, and the Greater Sphere answers a special with a
 *   Hydraulic Press; the line is the bench's (`docs/handoff/ch-gauntlet.md`).
 * - `heroArt` is the pause plate `pause/ch54-gauntlet` **(owed: no painting exists yet, GA10 and GA11 wait for Bailey's picks)**; `heroArtFallback`, the existing Dome plate that the fights stand on, shows until it lands.
 *   `snapshots` are that plate and two members of the party the line leans on (Lulu for the shell, Auron's Piercing for the armour); no creature's stand-in painting is shown, as none of them is the creature.
 * - `musicKeys` are the cues the chapter plays: the Dome's bed, the stand-in boss cues and the FFX fanfare.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { GAUNTLET_TEXT } from './chapter-gauntlet.ts';
import { GAUNTLET_CHAPTER_ID } from './ffx/gauntlet-ids.ts';

export const GAUNTLET_META: ChapterMeta = {
  id: GAUNTLET_CHAPTER_ID,
  gameLabel: 'FFX',
  numeral: 'EXP',
  ...GAUNTLET_TEXT,
  location: 'The Monster Arena, the Calm Lands',
  heroArt: 'pause/ch54-gauntlet',
  heroArtFallback: 'backdrops/zanarkand-dome.png',
  quote: { text: 'Smallest first. The worst last.', speaker: 'Auron' },
  handwritten: 'nine stalls, one afternoon',
  objectives: [
    { id: 'second-tier', label: 'Reach the Earth Eater', rule: { kind: 'link-reached', link: 4 } },
    { id: 'third-tier', label: "Reach Th'uban", rule: { kind: 'link-reached', link: 7 } },
    { id: 'gauntlet-done', label: 'Leave the last stall empty', rule: { kind: 'victory' } },
  ],
  tip: 'Steel opens most of them. Bring Lulu in for Neslug and the Ultima Buster, strike an Arm before its body, and spend no Overdrive on the Greater Sphere.',
  snapshots: [
    { image: 'backdrops/zanarkand-dome.png', caption: 'the arena floor' },
    { image: 'characters/lulu/idle.png', caption: 'the one who opens the shell' },
    { image: 'characters/auron/idle.png', caption: 'steel that pierces' },
  ],
  focalCharacterId: 'auron',
  musicKeys: ['scene-zanarkand-dome', 'boss-challenge', 'boss-yojimbo', 'victory-ffx'],
};

export default GAUNTLET_META;
