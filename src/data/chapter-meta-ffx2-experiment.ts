/**
 * Pause-screen and prebattle-tab metadata — **The Experiment**, the hidden chapter (`./chapter-ffx2-experiment.ts`; FFX-2 only, Bailey 2026-10-10).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * - `title`, `subtitle`, `location` and `blurb` are the record's (one premise on the card and the prep).
 * - `numeral` is `EXP` like the other hidden chapter (the board has no card for it; the prep header and the pause screen say so).
 * - `handwritten` and `tip` are our own words over the sourced facts (`research/ffx2-experiment.md`): the three tracks, the parts decide what it does.
 * - `objectives`: the three that read the same at every level: bring it under three quarters, under half, and win.
 * - `heroArt` has no painting of its own yet: the card shows the figure's idle as `heroArtFallback` (PROVISIONAL, a stand-in until the art run's painting is installed).
 * - `snapshots`: the grounds' plate, the Experiment's idle and Rikku's FFX-2 portrait (approved).
 * - `musicKeys`: the field bed, the fight and the fanfare, as the record's.
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
  quote: { text: "It's looking at us.", speaker: 'Yuna' },
  handwritten: 'it does what its parts say',
  objectives: [
    { id: 'experiment-below-three-quarters', label: 'Bring the Experiment under three quarters', rule: { kind: 'boss-hp-below', fraction: 0.75 } },
    { id: 'experiment-below-half', label: 'Bring the Experiment under half', rule: { kind: 'boss-hp-below', fraction: 0.5 } },
    { id: 'defeat-experiment', label: 'Defeat the Experiment', rule: { kind: 'victory' } },
  ],
  tip:
    'Before the fight, choose its three parts on the EXPERIMENT tab: Attack, Defense and Special. ' +
    'Defense is armor and Attack is bite; Special decides which attacks it knows.',
  snapshots: [
    { image: `backdrops/${EXPERIMENT_GROUNDS_PLATE}.png`, caption: 'the machine faction at work' },
    { image: 'characters/ffx2-experiment/idle.png', caption: 'built from spare parts' },
    { image: 'portraits/rikku-x2.png', caption: 'is it a statue?' },
  ],
  focalCharacterId: 'yuna',
  musicKeys: ['scene-bevelle-underground', 'boss-vegnagun', 'victory-ffx2'],
};

export default EXPERIMENT_META;
