/**
 * Chapter I's giants: the party height they are read against and the staging that stands Seymour Flux and Mortiorchis at the sizes Bailey picked (r3942-giants-ffx, FFX only).
 *
 * Moved out of `gagazet.ts` (repair of 2026-10-08, after the independent check): house style is every source file under 400 lines, that scene was 876 lines before this branch and
 * 908 with it, and this block is data that has nothing to do with painting the mountain. `gagazet.ts` re-exports both names, so every importer is unchanged.
 */

import { giantFigureHeights } from '../data/ffx/fiend-stature.ts';
import { ffxPartyStature } from '../data/ffx/party-stature.ts';

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
/**
 * The hidden Biran and Yenke chapter (FFX only, 2026-10-15; `research/ffx-biran-yenke.md` §6, §9) fights on this plate, the provisional stand-in for the mountain gate. Its two Ronso are
 * painted from Kimahri's own approved paintings (a provisional stand-in), so they stand at **Kimahri's applied stature** (`data/ffx/party-stature.ts`: 1.304 of the party height, his body
 * at his datamined 1.211 with the spear tip above it), the Ronso's own model heights being unread (`[estimate]`). Biran takes the boss's ground spot (slot 0, solved against the HUD rail);
 * Yenke stands beside him, a step left and back, so neither covers the other: "side by side" (§4.4). Inert in Chapter I, which has no Ronso.
 */
export const RONSO_FIGURE_HEIGHT = GAGAZET_PARTY_HEIGHT * ffxPartyStature('kimahri');

export const GAGAZET_STAGING = {
  holdParty: true,
  enemySpots: {
    'seymour-flux': [3.54, 0, -7.6] as Spot3,
    mortiorchis: [-0.143, 1.482, -7.82] as Spot3,
    'biran-ronso': [1.95, 0, -2.45] as Spot3,
    'yenke-ronso': [0.85, 0, -3.6] as Spot3,
  },
  figureHeights: { ...giantFigureHeights(['seymour-flux', 'mortiorchis'], GAGAZET_PARTY_HEIGHT), 'biran-ronso': RONSO_FIGURE_HEIGHT, 'yenke-ronso': RONSO_FIGURE_HEIGHT },
  // r3943-int (FFX only; Bailey's "A2", 2026-10-09): the fight starts with the guide folded and the full NEXT BEST MOVE card in its place; G opens the guide and the card is the tip while it is open.
  guideFolded: true as const,
};
