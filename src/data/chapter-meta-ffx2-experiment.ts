/**
 * Pause-screen and prebattle-tab metadata — **The Experiment**, the hidden chapter (`./chapter-ffx2-experiment.ts`; FFX-2 only, Bailey 2026-10-10).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * - `title`, `subtitle`, `location` and `blurb` are the record's (one premise on the card and the prep).
 * - `numeral` is `EXP` like the other hidden chapters (the board has no card for it; the prep header and the pause screen say so).
 * - `handwritten` and `tip` are our own words over the sourced facts (`research/ffx2-experiment.md`): Act I is the first test, Act II the full weapon; Protect first; the Defense that stops
 *   plain swings; a Phoenix Down for Lifeslicer. The prep CHAPTER tab is read-only text, so the levels' readout (Attack 1, Defense 1, Special 1, then 5, 5, 5) is told here and in the story,
 *   never as a control: **there is no upgrade menu and no prep tab for it** (the driver's concept pick B: the game has none).
 * - `objectives`: reach the rebuilt machine (win Act I), bring the full weapon under half, win.
 * - `heroArt` has no painting of its own yet: the card shows the Overbuilt's idle as `heroArtFallback` (PROVISIONAL until the art run's painting is installed).
 * - `snapshots`: the hall's plate, the Experiment's idle and Rikku's FFX-2 portrait (approved).
 * - `musicKeys`: the field bed, Act I's cue, Act II's cue and the fanfare, as the record's.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { EXPERIMENT_ID, EXPERIMENT_TEXT } from './chapter-ffx2-experiment.ts';
import { EXPERIMENT_GROUNDS_PLATE } from './experiment-plates.ts';

export const EXPERIMENT_META: ChapterMeta = {
  id: EXPERIMENT_ID,
  gameLabel: 'FFX-2',
  numeral: 'EXP',
  ...EXPERIMENT_TEXT,
  heroArt: 'pause/ffx2-experiment', // no painting yet: the fallback below shows
  heroArtFallback: 'characters/ffx2-experiment/idle.png',
  quote: { text: 'Is it a statue? Please tell me it is a statue.', speaker: 'Rikku' },
  handwritten: 'protect first. then something armor cannot stop',
  objectives: [
    { id: 'reach-the-rebuilt-machine', label: 'Break the first test and meet the rebuilt machine', rule: { kind: 'link-reached', link: 2 } },
    { id: 'experiment-below-half', label: 'Bring the full weapon under half', rule: { kind: 'boss-hp-below', fraction: 0.5 } },
    { id: 'defeat-experiment', label: 'Defeat the Experiment', rule: { kind: 'victory' } },
  ],
  tip:
    'Act I is only a first test: put Protect up and find your healing rhythm. ' +
    'Act II is the full weapon. Plain swings barely scratch its armor, so use what ignores it, and keep a Phoenix Down ready for Lifeslicer.',
  snapshots: [
    { image: `backdrops/${EXPERIMENT_GROUNDS_PLATE}.png`, caption: 'the faction at work' },
    { image: 'characters/ffx2-experiment/idle.png', caption: 'souped up past stopping' },
    { image: 'portraits/rikku-x2.png', caption: 'is it a statue?' },
  ],
  focalCharacterId: 'yuna',
  musicKeys: ['scene-bevelle-underground', 'boss-ffx2-aeon', 'boss-vegnagun', 'victory-ffx2'],
};

export default EXPERIMENT_META;
