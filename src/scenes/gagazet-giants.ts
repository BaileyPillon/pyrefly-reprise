/**
 * Chapter I's giants: the party height they are read against and the staging that stands Seymour Flux and Mortiorchis at the sizes Bailey picked (r3942-giants-ffx, FFX only).
 *
 * Moved out of `gagazet.ts` (repair of 2026-10-08, after the independent check): house style is every source file under 400 lines, that scene was 876 lines before this branch and
 * 908 with it, and this block is data that has nothing to do with painting the mountain. `gagazet.ts` re-exports both names, so every importer is unchanged.
 */

import { giantFigureHeights } from '../data/ffx/fiend-stature.ts';

// R13-02 (FFX only): the bosses pinned where live e3b8c2a3's relax stood them (measured 1600x900 and 2000x1012), so Mortiorchis's
// bracket leaves the NEXT BEST MOVE card its band. A pin is never prone-slid, so Mortiorchis's spot carries his old -1.52 slide.
// (r3942-giants-ffx: at his new size Mortiorchis no longer leaves the card that band, on any desktop shape: the card is the one-row tip there, `ui/ffx/advisorTip.ts`.)
type Spot3 = [number, number, number];

/**
 * The party's shared world height on this stage: Tidus's 1.82, the stage's own default (this scene publishes no `partyHeight`: `resolveSceneHeights`), which the giants' heights
 * are read against (`giantFigureHeights`: a fiend stands at the party's height times its game height over Tidus's 18.15).
 */
export const GAGAZET_PARTY_HEIGHT = 1.82;

/**
 * r3942-giants-ffx (Bailey, 2026-10-08, "all of your recommendations"; FFX only, Chapter I): **Seymour Flux stands at 0.6 of his real height** (the live PS2 game draws him 100 units
 * tall, 5.29 times the party; `data/ffx/fiend-stature.ts` `FFX_GIANT_STATURE`, `research/ffx-seymour-flux.md` section 13): 6.017 units against the 4.1 he stood at, and **Mortiorchis
 * grows with him** (3.309 against 2.255: the model has no mesh to measure, so it keeps its 0.55 of him). The camera backs off for him (`RIGS.idle` in `gagazet.ts`). The spots move with the size:
 * Flux stays where live pinned him; Mortiorchis keeps its place against him, so its offset from him (2.51 left, 1.01 up) grows by the same 1.47 times: (1.03, 1.01) to (-0.143, 1.482),
 * and 0.22 further back, to z -7.82: **no boss or part stands nearer the party than on live** (Bailey, 2026-10-08, "original spacing, real sizes"), and the step left alone would have put
 * it 0.19 nearer Kimahri (6.57 against 6.75 units); at z -7.82 it is 6.79.
 */
export const GAGAZET_STAGING = {
  holdParty: true,
  enemySpots: { 'seymour-flux': [3.54, 0, -7.6] as Spot3, mortiorchis: [-0.143, 1.482, -7.82] as Spot3 },
  figureHeights: giantFigureHeights(['seymour-flux', 'mortiorchis'], GAGAZET_PARTY_HEIGHT),
  // r3943-int (FFX only; Bailey's "A2", 2026-10-09): the fight starts with the guide folded and the full NEXT BEST MOVE card in its place; G opens the guide and the card is the tip while it is open.
  guideFolded: true as const,
};
