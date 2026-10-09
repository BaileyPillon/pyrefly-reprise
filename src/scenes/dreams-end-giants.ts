/**
 * Chapter III's giants: Braska's Final Aeon and the two Yu Pagodas at the sizes and in the arrangement Bailey picked (r3942-giants-ffx, FFX only).
 *
 * Moved out of `dreams-end.ts` (repair of 2026-10-08, after the independent check): house style is every source file under 400 lines, that scene was 1,701 lines before this branch and
 * 1,763 with it, and this block is data that has nothing to do with painting the burning sky. `dreams-end.ts` re-exports the four names, so every importer is unchanged.
 */

import { giantFigureHeights, giantStand } from '../data/ffx/fiend-stature.ts';

/**
 * The party's shared world height on this stage: Tidus's 1.82, the stage's own default (this scene publishes no `partyHeight`: `resolveSceneHeights`). The giants' heights are read against
 * it (`giantFigureHeights`: a fiend stands at the party's height times its game height over Tidus's 18.15).
 */
export const DREAMS_END_PARTY_HEIGHT = 1.82;

/**
 * **r3942-giants-ffx (Bailey, 2026-10-08, "all of your recommendations"; FFX only, Chapter III, and every link that has the Yu Pagodas): Braska's Final Aeon stands at 0.75 of his real
 * height with the two Yu Pagodas at 0.75 of theirs, in the game's own arrangement behind him.** The live PS2 game draws him about 92 units tall (a floor: his top ran under the frame's
 * HELP banner), 5.11 times the party, and the pagodas 75.8 and 83.9 (floors too), 60 units either side of him and 70 behind (`data/ffx/fiend-stature.ts` `FFX_GIANT_STATURE`,
 * `research/ffx-bfa-yu-yevon.md` section 9). The build drew him at 4.1 world units and the pagodas at 2.255, in front of him. At 0.75 of real, over the party's 1.82: 6.919 and 5.701 and
 * 6.31 (the options study's picture 4), the whole group scaled together (spacing included: 4.51 either side and 5.26 behind), so it reads as the game's group at three quarters.
 *
 * **Where they stand is a pin** (`enemySpots`), because the formation solver spreads figures by their heights and a taller group would be re-laid in front of him. CHAPTER FRAMING's row for this
 * chapter (`fx/mix/stageTable.ts` CHAPTER_III, option 1, 2026-10-04) then moves each figure on a desktop with CHAPTER FRAMING on, as it always did: the aeon (2.612, -0.915), the left pagoda
 * (1.095, -2.247) and the right one (2.377, -2.028), world x and z along the screen's own axes from today's resting rig (these are for the `idle` rig in `dreams-end.ts`; the row reads the rig's yaw).
 * The pins carry those shifts off, so that on a desktop the group ends in the game's arrangement, the aeon at (4.753, -8.947), and the picture is the study's; on a phone, where the row does
 * not play, the pins are where the figures stand.
 * `tests/unit/ffx-giant-stature.test.ts` reads the row and the rig and fails if either moves under these numbers.
 */
export const DREAMS_END_ROW_SHIFT = {
  'braskas-final-aeon': [2.723, -0.497],
  'yu-pagoda-left': [1.095, -2.247],
  'yu-pagoda-right': [2.377, -2.028],
} as const;

/**
 * The aeon's own pin: its spot before the row's shift. Live stood him at (4.642, -8.915) on a desktop (the solver's (2.03, -8.0) plus the row's move of that day, 2.612 and -0.915) and at
 * (2.386, -8.0) on a phone. **He stands no nearer the party than that** (Bailey, 2026-10-08, "original spacing, real sizes"): at (2.03, -8.45) he is 9.55 from Auron on a desktop
 * (live 9.42) and 7.97 on a phone (live 7.69), and the party's centre 11.0 and 9.6 away (live 10.85 and 9.24).
 */
export const DREAMS_END_BFA_PIN: [number, number, number] = [2.03, 0, -8.45];

/** A pagoda's pin: the aeon's final place, the game's stand behind it, less what the row will add to that pagoda. */
function pagodaPin(id: 'yu-pagoda-left' | 'yu-pagoda-right'): [number, number, number] {
  const stand = giantStand(id, DREAMS_END_PARTY_HEIGHT)!;
  const boss = DREAMS_END_ROW_SHIFT['braskas-final-aeon'];
  const row = DREAMS_END_ROW_SHIFT[id];
  const round = (v: number): number => Math.round(v * 1000) / 1000;
  return [round(DREAMS_END_BFA_PIN[0] + boss[0] - row[0] + stand.dx), stand.dy, round(DREAMS_END_BFA_PIN[2] + boss[1] - row[1] - stand.dz)];
}

/** What this scene stages: the party held on its slots (PR-0002 A, D-041) and, from the table, the aeon and the pagodas (heights and pins). */
export const DREAMS_END_STAGING = {
  holdParty: true,
  enemySpots: {
    'braskas-final-aeon': DREAMS_END_BFA_PIN,
    'yu-pagoda-left': pagodaPin('yu-pagoda-left'),
    'yu-pagoda-right': pagodaPin('yu-pagoda-right'),
  },
  figureHeights: giantFigureHeights(['braskas-final-aeon', 'yu-pagoda-left', 'yu-pagoda-right'], DREAMS_END_PARTY_HEIGHT),
};
