/**
 * Pause-screen and prebattle-tab metadata - **The Luca Opener**, the hidden chapter (`./chapter-ffx2-luca-opener.ts`; FFX-2 only, 2026-11-09).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * - `title`, `subtitle`, `location` and `blurb` are the record's (one premise on the card and the prep).
 * - `numeral` is `EXP` like the other hidden chapters (the board has no card for it; the prep header and the pause screen say so).
 * - `handwritten` and `tip` are our own words over the sourced facts (`research/re-ffx2-luca-opener.md` §3): Ormi strikes twice and then throws his shield at the farthest girl; Logos shoots, with one Potion for Ormi when he is
 *   nearly gone; Leblanc strikes three times and then casts Thunder on the girl with the most HP; Yuna is the Songstress in the second fight and Darkness Dance is her one command. The tip is one short form that fits the prep
 *   card's band (no entry in `./chapter-prep-tips.ts`).
 * - `quote` is Paine's line from the first seam (`../story/scripts/ffx2-luca-opener.ts`), our own.
 * - `objectives`: get past Logos and Ormi (act 2 reached), survive Leblanc's first swing, the win. (A `survived-ability` row on her Thunder was the first draft. It was dropped on a bench run before the 2026-11-09 fix of the stat table below Lv 20, which had her cast it in 6 percent of the runs at bench speed, 3 at Wait split and 41 at Active 1.5 s, because she fell
 *   before her fourth action, so it was nearly unreachable. **Re-measured on 2026-11-10 under the fixed table, she casts it in 98, 100 and 100 percent of the shipped advisor runs (92 to 100 percent on every shipped line and pace), so that reason no longer holds for the shipped party**;
 *   the row stays on her Attack until Bailey picks (handoff section 13). Her Attack is the move every run meets, and the rule matches by the hyphen-delimited suffix `leblanc-attack`, which Ormi's `x2-luca-ormi-attack` never does.)
 * - `heroArt` is the chapter's own pause plate `pause/ffx2-luca-opener` when it is painted; Chapter VI's plate (`pause/leblanc`, the same three people) is today's stand-in, with Leblanc's portrait behind that.
 * - `snapshots`: the Leblanc stage (the stand-in for the docks), Ormi's idle and Leblanc's idle (the Syndicate's approved paintings).
 * - `musicKeys`: the Syndicate's field bed and boss cue (flagged stand-ins) and the fanfare, as the record's.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { LUCA_OPENER_ID, LUCA_OPENER_TEXT } from './chapter-ffx2-luca-opener.ts';
import { LUCA_OPENER_SCENE } from './luca-opener-ids.ts';

export const LUCA_OPENER_META: ChapterMeta = {
  id: LUCA_OPENER_ID,
  gameLabel: 'FFX-2',
  numeral: 'EXP',
  ...LUCA_OPENER_TEXT,
  bossLine: 'Logos, Ormi and Leblanc',
  heroArt: 'pause/leblanc', // the same three people: Chapter VI's plate stands in until the chapter's own is painted (`pause/ffx2-luca-opener`)
  heroArtFallback: 'portraits/leblanc.png',
  quote: { text: 'Same gown. Smaller stage.', speaker: 'Paine' },
  handwritten: 'steal first, apologise never',
  objectives: [
    { id: 'get-past-logos-and-ormi', label: 'Get past Logos and Ormi', rule: { kind: 'link-reached', link: 2 } },
    { id: 'survive-leblancs-swing', label: 'Survive Leblanc’s first swing', rule: { kind: 'survived-ability', ability: 'leblanc-attack' } },
    { id: 'defeat-leblanc', label: 'Defeat Leblanc', rule: { kind: 'victory' } },
  ],
  tip:
    'Rikku steals from all three. Ormi’s shield goes to whoever stands farthest; Leblanc’s Thunder to the healthiest girl. Yuna sings.',
  snapshots: [
    { image: `backdrops/${LUCA_OPENER_SCENE}.png`, caption: 'the quay, borrowed' },
    { image: 'characters/ormi/idle.png', caption: 'a wall with a shield' },
    { image: 'characters/leblanc/idle.png', caption: 'in a borrowed gown' },
  ],
  focalCharacterId: 'paine',
  musicKeys: ['scene-chateau-leblanc', 'boss-leblanc', 'victory-ffx2'],
};

export default LUCA_OPENER_META;
