/**
 * The advisor solver's boards for Chapters IX and XII, rebuilt from the r71 browser reads (lane r72-hud, 2026-11-01; FFX only): the harness's panel boxes (`D:/Tools/pyrefly-scratch/2026-10-31/r71/ffx/evidence/hud3-*.json`, grid px) with
 * the cast's painted silhouettes. A helper for `r72-hud-solver.test.ts`, not a test file.
 */
import { SKEW, STAGE, type AdvisorZone, type AdvisorZoneInput, type Rect } from '../../../src/ui/ffx/hudSafeZones.ts';
import { TIP_BADGE, TIP_HEIGHT } from '../../../src/ui/ffx/advisorTip.ts';

const R = (left: number, top: number, right: number, bottom: number): Rect => ({ left, top, right, bottom });

export interface Board {
  cmdArea: Rect;
  partyStatus: Rect;
  guide: Rect | null;
  sensor: Rect | null;
  ctb: Rect;
  ribbon: Rect;
  sprites: Rect[];
  enemies: Rect[];
  /** The chapter's own ink: IX the gauge; XII the disc strip, its note and the Enemy Intent card. */
  ink: Rect[];
  /** Where the r71 read had the advisor (its card, or its tip before the slide). */
  was: Rect;
}
/** The first menu with Intel (G) open (`intel`) and with the target cursor up as well (`intel+target`), from the r71 sheets, by chapter, TEXT SIZE and window. 16:9 windows only: the stage is the window, 1 grid px = lb px. */
export const BOARDS: Record<string, Board> = {
  'IX 100 1600x900 intel': { cmdArea: R(28, 196, 207, 314), partyStatus: R(415, 251, 615, 342), guide: R(21, 66, 154, 137), sensor: null, ctb: R(465, 22, 626, 67), ribbon: R(25, 12, 191, 38), sprites: [R(216, 232, 260, 320), R(256, 196, 332, 312), R(324, 240, 392, 320)], enemies: [R(356, 124, 428, 232), R(336, 200, 364, 228)], ink: [R(220, 4, 425, 64)], was: R(445, 132, 631, 206) },
  'IX 100 1600x900 intel+target': { cmdArea: R(28, 196, 207, 314), partyStatus: R(427, 251, 627, 342), guide: R(21, 66, 154, 137), sensor: R(431, 143, 541, 191), ctb: R(465, 22, 626, 67), ribbon: R(25, 12, 191, 38), sprites: [R(216, 232, 260, 320), R(252, 200, 332, 312), R(324, 236, 392, 320)], enemies: [R(356, 128, 428, 228), R(336, 200, 364, 228)], ink: [R(220, 4, 425, 64)], was: R(200, 16, 380, 30) },
  'IX 100 2560x1440 intel': { cmdArea: R(28, 196, 207, 314), partyStatus: R(415, 251, 615, 342), guide: R(21, 66, 154, 137), sensor: null, ctb: R(465, 22, 626, 67), ribbon: R(25, 12, 191, 38), sprites: [R(220, 232, 260, 320), R(256, 196, 336, 312), R(328, 240, 392, 320)], enemies: [R(356, 128, 428, 228), R(336, 200, 364, 228)], ink: [R(220, 4, 425, 64)], was: R(446, 146, 630, 206) },
  'IX 100 2560x1440 intel+target': { cmdArea: R(28, 196, 207, 314), partyStatus: R(427, 251, 627, 342), guide: R(21, 66, 154, 137), sensor: R(431, 144, 541, 190), ctb: R(465, 22, 626, 67), ribbon: R(25, 12, 191, 38), sprites: [R(220, 232, 260, 320), R(260, 200, 336, 312), R(328, 236, 396, 320)], enemies: [R(356, 128, 428, 232), R(336, 200, 364, 228)], ink: [R(220, 4, 425, 64)], was: R(200, 12, 380, 26) },
  'IX 100 1280x720 intel': { cmdArea: R(28, 196, 207, 314), partyStatus: R(415, 251, 615, 342), guide: R(21, 66, 154, 137), sensor: null, ctb: R(465, 22, 626, 67), ribbon: R(25, 12, 191, 38), sprites: [R(220, 232, 260, 320), R(256, 196, 332, 312), R(328, 236, 392, 320)], enemies: [R(356, 128, 428, 232), R(336, 200, 364, 228)], ink: [R(220, 4, 425, 65)], was: R(444, 122, 632, 206) },
  'IX 100 1280x720 intel+target': { cmdArea: R(28, 196, 207, 314), partyStatus: R(427, 251, 627, 342), guide: R(21, 66, 154, 137), sensor: R(430, 131, 542, 181), ctb: R(465, 22, 626, 67), ribbon: R(25, 12, 191, 38), sprites: [R(220, 232, 260, 320), R(256, 200, 336, 312), R(328, 240, 392, 320)], enemies: [R(356, 124, 428, 228), R(336, 200, 364, 228)], ink: [R(220, 4, 425, 65)], was: R(200, 16, 380, 30) },
  'IX 115 1600x900 intel': { cmdArea: R(28, 178, 234, 314), partyStatus: R(385, 237, 615, 342), guide: R(21, 69, 174, 141), sensor: null, ctb: R(440, 22, 626, 74), ribbon: R(24, 12, 216, 42), sprites: [R(220, 232, 260, 320), R(260, 196, 336, 312), R(328, 240, 392, 320)], enemies: [R(356, 124, 428, 232), R(336, 200, 364, 228)], ink: [R(220, 4, 425, 64)], was: R(444, 126, 632, 206) },
  'IX 115 1600x900 intel+target': { cmdArea: R(28, 178, 234, 314), partyStatus: R(398, 237, 629, 342), guide: R(21, 69, 174, 141), sensor: R(421, 136, 548, 191), ctb: R(440, 22, 626, 74), ribbon: R(24, 12, 216, 42), sprites: [R(220, 232, 260, 320), R(256, 200, 336, 312), R(328, 236, 392, 320)], enemies: [R(356, 128, 428, 228), R(336, 200, 364, 228)], ink: [R(220, 4, 425, 64)], was: R(224, 16, 404, 30) },
  'IX 115 2560x1440 intel': { cmdArea: R(28, 178, 234, 314), partyStatus: R(385, 237, 615, 342), guide: R(21, 69, 174, 141), sensor: null, ctb: R(440, 22, 626, 74), ribbon: R(24, 12, 216, 42), sprites: [R(220, 232, 260, 320), R(256, 200, 332, 312), R(324, 236, 388, 320)], enemies: [R(356, 124, 428, 228), R(336, 200, 364, 228)], ink: [R(220, 4, 425, 64)], was: R(446, 146, 630, 206) },
  'IX 115 2560x1440 intel+target': { cmdArea: R(28, 178, 234, 314), partyStatus: R(398, 237, 629, 342), guide: R(21, 69, 174, 141), sensor: R(421, 137, 548, 190), ctb: R(440, 22, 626, 74), ribbon: R(24, 12, 216, 42), sprites: [R(220, 232, 260, 320), R(256, 200, 332, 312), R(324, 240, 392, 320)], enemies: [R(356, 128, 428, 228), R(336, 200, 364, 228)], ink: [R(220, 4, 425, 64)], was: R(224, 12, 404, 26) },
  'XII 100 1600x900 intel': { cmdArea: R(28, 196, 207, 314), partyStatus: R(415, 251, 615, 342), guide: R(21, 66, 154, 137), sensor: null, ctb: R(465, 22, 626, 67), ribbon: R(25, 12, 191, 38), sprites: [R(208, 192, 284, 300), R(344, 200, 416, 296), R(288, 172, 348, 260)], enemies: [R(372, 104, 480, 252), R(308, 100, 388, 180), R(320, 164, 400, 244), R(448, 164, 528, 240), R(460, 100, 540, 176)], ink: [R(272, 5, 469, 36), R(344, 35, 457, 44), R(429, 205, 622, 245)], was: R(203, 74, 305, 162) },
  'XII 100 1600x900 intel+target': { cmdArea: R(28, 196, 207, 314), partyStatus: R(427, 251, 627, 342), guide: R(21, 66, 154, 137), sensor: R(427, 122, 545, 201), ctb: R(465, 22, 626, 67), ribbon: R(25, 12, 191, 38), sprites: [R(212, 196, 284, 300), R(348, 200, 420, 296), R(288, 172, 348, 260)], enemies: [R(372, 104, 480, 252), R(308, 100, 384, 180), R(320, 164, 396, 244), R(448, 164, 524, 240), R(460, 100, 536, 176)], ink: [R(272, 5, 469, 36), R(344, 35, 457, 44), R(429, 205, 622, 245)], was: R(161, 27, 265, 115) },
  'XII 100 2560x1440 intel': { cmdArea: R(28, 196, 207, 314), partyStatus: R(415, 251, 615, 342), guide: R(21, 66, 154, 137), sensor: null, ctb: R(465, 22, 626, 67), ribbon: R(25, 12, 191, 38), sprites: [R(196, 192, 272, 300), R(332, 200, 408, 300), R(280, 172, 340, 264)], enemies: [R(368, 104, 476, 256), R(300, 100, 380, 180), R(312, 164, 392, 244), R(444, 164, 524, 244), R(456, 100, 536, 180)], ink: [R(272, 5, 464, 36), R(354, 35, 452, 44), R(429, 205, 622, 245)], was: R(162, 39, 264, 115) },
  'XII 100 2560x1440 intel+target': { cmdArea: R(28, 196, 207, 314), partyStatus: R(427, 251, 627, 342), guide: R(21, 66, 154, 137), sensor: R(428, 126, 544, 201), ctb: R(465, 22, 626, 67), ribbon: R(25, 12, 191, 38), sprites: [R(196, 192, 268, 300), R(332, 200, 408, 300), R(280, 176, 340, 264)], enemies: [R(368, 100, 476, 256), R(300, 100, 380, 180), R(316, 168, 396, 244), R(444, 164, 528, 244), R(460, 100, 540, 180)], ink: [R(272, 5, 464, 36), R(354, 35, 452, 44), R(429, 205, 622, 245)], was: R(162, 39, 264, 115) },
  'XII 100 1280x720 intel': { cmdArea: R(28, 196, 207, 314), partyStatus: R(415, 251, 615, 342), guide: R(21, 66, 154, 137), sensor: null, ctb: R(465, 22, 626, 67), ribbon: R(25, 12, 191, 38), sprites: [R(212, 196, 284, 300), R(348, 200, 424, 300), R(300, 172, 360, 264)], enemies: [R(388, 100, 496, 256), R(320, 100, 400, 180), R(336, 164, 416, 244), R(468, 164, 548, 240), R(480, 96, 560, 176)], ink: [R(272, 5, 495, 37), R(343, 36, 482, 48), R(429, 203, 622, 245)], was: R(202, 62, 314, 163) },
  'XII 100 1280x720 intel+target': { cmdArea: R(28, 196, 207, 314), partyStatus: R(427, 251, 627, 342), guide: R(21, 66, 154, 137), sensor: R(427, 117, 545, 199), ctb: R(465, 22, 626, 67), ribbon: R(25, 12, 191, 38), sprites: [R(208, 192, 284, 304), R(348, 204, 424, 300), R(296, 172, 360, 264)], enemies: [R(384, 100, 496, 252), R(320, 100, 400, 180), R(332, 164, 412, 244), R(464, 164, 544, 240), R(476, 96, 560, 176)], ink: [R(272, 5, 495, 37), R(343, 36, 482, 48), R(429, 203, 622, 245)], was: R(202, 62, 314, 163) },
  'XII 115 1600x900 intel': { cmdArea: R(28, 178, 234, 314), partyStatus: R(385, 237, 615, 342), guide: R(21, 69, 174, 141), sensor: null, ctb: R(440, 22, 626, 74), ribbon: R(24, 12, 216, 42), sprites: [R(208, 192, 280, 300), R(344, 200, 416, 296), R(288, 172, 348, 260)], enemies: [R(372, 104, 480, 252), R(308, 100, 388, 180), R(324, 164, 400, 244), R(448, 164, 528, 240), R(464, 100, 540, 180)], ink: [R(248, 5, 445, 36), R(320, 35, 433, 44), R(406, 185, 628, 232)], was: R(224, 14, 432, 29) },
  'XII 115 2560x1440 intel': { cmdArea: R(28, 178, 234, 314), partyStatus: R(385, 237, 615, 342), guide: R(21, 69, 174, 141), sensor: null, ctb: R(440, 22, 626, 74), ribbon: R(24, 12, 216, 42), sprites: [R(200, 192, 272, 300), R(336, 200, 412, 300), R(280, 172, 340, 260)], enemies: [R(360, 104, 468, 252), R(296, 100, 376, 180), R(312, 164, 388, 244), R(440, 164, 516, 240), R(452, 100, 532, 176)], ink: [R(248, 5, 439, 36), R(330, 35, 428, 44), R(406, 185, 628, 232)], was: R(534, 97, 634, 179) },
  'XII 115 1280x720 intel': { cmdArea: R(28, 178, 234, 314), partyStatus: R(385, 237, 615, 342), guide: R(21, 69, 174, 141), sensor: null, ctb: R(440, 22, 626, 74), ribbon: R(24, 12, 216, 42), sprites: [R(212, 192, 288, 300), R(352, 200, 424, 300), R(296, 172, 356, 264)], enemies: [R(384, 104, 492, 256), R(316, 100, 396, 180), R(332, 168, 408, 244), R(460, 164, 540, 244), R(472, 100, 552, 180)], ink: [R(248, 5, 471, 37), R(319, 36, 458, 48), R(406, 183, 628, 232)], was: R(224, 13, 432, 30) },
};

export const grow = (r: Rect, d: number): Rect => ({ left: r.left - d, top: r.top - d, right: r.right + d, bottom: r.bottom + d });
export const tsOf = (key: string): number => Number(key.split(' ')[1]) / 100;
export const chOf = (key: string): 'IX' | 'XII' => key.split(' ')[0] as 'IX' | 'XII';
/** The solver's input as `FFXBattleHud.solveAdvisorPlacement` builds it for these chapters: the F1 ribbon is `keepOff` (the tip) in both, and ink (`enemies`, the designed card) in XII only, when `ribbon` is on. */
export function inputOf(key: string, ribbon: boolean): AdvisorZoneInput {
  const b = BOARDS[key]!;
  const ts = tsOf(key);
  const g = b.guide!;
  const chips = [R(g.left, g.top - 11, g.left + 61, g.top), R(g.left + 61, g.top - 11, g.left + 112, g.top)];
  const rib = ribbon ? [b.ribbon] : [];
  return {
    cmdArea: b.cmdArea,
    cmdInfo: R(24, 121, 24 + 172 * ts, 121 + 33 * ts),
    partyStatus: b.partyStatus,
    guide: b.guide,
    sensor: b.sensor,
    intent: null,
    ctb: b.ctb,
    sprites: b.sprites.map((r) => grow(r, 4)),
    enemies: [...b.enemies.map((r) => grow(r, 8)), ...b.ink, ...(chOf(key) === 'XII' ? rib : [])],
    keepOff: [...chips, ...rib],
  };
}
export const apart = (a: Rect, b: Rect): number => Math.max(a.left - b.right, b.left - a.right, a.top - b.bottom, b.top - a.bottom);
export const hits = (a: Rect, b: Rect): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
/** The bar the tip paints (its card's box with the shear's reach on each side), at the `slide` the stylesheet adds, and the badge on its left (the chip, which is not slid). */
export function bar(z: AdvisorZone, slide = 0): Rect {
  const reach = (SKEW * TIP_HEIGHT) / 2;
  const y1 = STAGE.height - z.bottom;
  return { left: z.left + slide - reach, right: z.left + z.width + slide + reach, top: y1 - TIP_HEIGHT, bottom: y1 };
}
export function badge(z: AdvisorZone): Rect {
  const y1 = STAGE.height - z.bottom;
  return { left: z.left - TIP_BADGE, right: z.left, top: y1 - TIP_HEIGHT, bottom: y1 };
}
/** What F1's stylesheet adds to the bar's left in Chapter I's way (`hudf1.css`, `hudf1-textsize.css`): 166 at 100, 6 + 160 x scale at 115. */
export const slideOf = (ts: number): number => (ts === 1 ? 166 : 6 + 160 * ts);
/** Every box the solver was given (the ribbon, when on, among them), for the clearance sums. */
export const everything = (input: AdvisorZoneInput): Rect[] => [input.cmdArea, input.cmdInfo ?? input.cmdArea, input.partyStatus, ...(input.guide ? [input.guide] : []), ...(input.sensor ? [input.sensor] : []), ...(input.ctb ? [input.ctb] : []), ...input.sprites, ...(input.enemies ?? []), ...(input.keepOff ?? [])];

