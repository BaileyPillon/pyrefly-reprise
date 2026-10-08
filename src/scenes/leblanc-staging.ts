import type { Spot } from '../engine/Formation.ts';
import { syndicateFigureHeights } from '../data/ffx2/syndicate-stature.ts';

// ---------------------------------------------------------------------------
// Chapter VI, the Syndicate's staging: how tall each fiend stands, where each stands in each act, and the room the move advisor leaves them
// ---------------------------------------------------------------------------
//
// Game case: FFX-2 only [AGENTS.md rule 14]. The hidden experimental Leblanc chapter plays Chapter VI's three acts by reference over the same
// room (`./exp-leblanc-last-room.ts`), so it stands the same fiends in the same places. Presentation only: nothing here reaches the engine.
//
// Bailey, 2026-10-07, from `docs/handoff/r3941-stage.md`'s options sheet: "Option 3: bosses forward" -- every fiend at its real size from the FFX-2 HD
// models, the fiends' lane brought closer to the party, the camera, lens and rigs unchanged (`./leblanc-last-room.ts`, `LEBLANC_LAST_ROOM_RIGS`).

/** The girls' standing height in this room (Yuna's, which the stage gives all three girls): the unit every fiend's real height is a ratio of. */
export const LEBLANC_PARTY_HEIGHT = 1.68;

/**
 * The world height each Syndicate combatant stands at: the girls' height times the model's ratio to the girls (`data/ffx2/syndicate-stature.ts`,
 * `research/ffx2-leblanc-syndicate.md` §20): Ormi 1.935, Logos 2.119, Leblanc 1.763, Dr. Goon 1.849, Fem-Goon 1.690. Every fiend of the three
 * acts is named, so the stage's own rule (a boss at the scene's boss height, any other fiend at 0.7 of it, `worldHeightFor`) is never used here:
 * the 0.7 that made the goons 1.16 against the girls' 1.68 is gone for this chapter.
 */
export const LEBLANC_FIGURE_HEIGHTS: Readonly<Record<string, number>> = syndicateFigureHeights(LEBLANC_PARTY_HEIGHT);

/**
 * Where each fiend stands, by combatant id (`SceneStaging.enemySpots`: the formation solver and the stage's relaxation leave a named fiend where
 * it is). Act I: Dr. Goon, Ormi and Fem-Goon; Act II: Ormi and Logos; Act III: Ormi, Leblanc and Logos. Our own staging, **not the game's**: the files
 * hold no stand position (`research/ffx2-leblanc-syndicate.md` §20.4).
 *
 * Why spots and not the solver's lane. The solver stands the biggest fiend furthest back, which at real sizes puts the tallest head highest in the frame,
 * and three HUD boxes then decide the rest. Measured in GPU Chromium, seed 1, at each act's first command menu at 1600x900 (every figure's numbers are in
 * `docs/handoff/r3941-stage.md`; `tests/unit/chapters/leblanc-enemy-lane.test.ts` pins them through the camera):
 *
 * 1. **The enemy-intent card** hangs from the acting fiend's head and is held under the top bar, so it can be 327 px tall (Fem-Goon's Blizzard on the whole
 *    party) with its bottom edge as high as y 409. A fiend's head above that line is covered whoever acts, and a head higher than the acting fiend's is
 *    covered when that one acts. So the heads stand level: in Act I (the one tall card) every head is at y 411 or lower; in Acts II and III (cards 216 px,
 *    bottom edge y 371 to 379) within 11 px of each other. A taller fiend therefore stands nearer, not further back, and the card covers no head (a graze of
 *    at most 9 percent of one when Leblanc's own card reaches Logos in Act III).
 * 2. **The move advisor's card** hangs from the bottom band, from y 651 at its full height, and the nearest feet reach y 722 (Ormi, Act I). Its cap
 *    ({@link LEBLANC_ADVISOR_CAP}) lowers its top to y 742, so it prints fewer lines and passes under their feet, as it passes under the girls'.
 * 3. **The command list** starts at x 1246 and the HUD rail is 0.72 of the canvas (x 1152): the right-most fiend's right edge is x 1094 (Act I), 1082 (Act II)
 *    and 1143 (Act III), 103 px or more from the list and inside the rail; the left-most stands 117 px or more from Paine.
 *
 * The sizes that result, over the girls' standing mean on screen: Act I Ormi 1.08, Dr. Goon 0.95, Fem-Goon 0.75 (live: 0.55, 0.44, 0.49); Act II Logos 1.13,
 * Ormi 0.88 (live: 0.56, 0.71); Act III Logos 1.13, Ormi 0.88, Leblanc 0.70 (live: 0.62, 0.71, 0.56). The shortest of each act stands furthest back so its head
 * is level with the others'. The spots are `[x, 0, z]` in the scene's world units; the camera is at about (0, 2.85, 9.25), the girls at z 1.45, 0.1 and -1.5.
 */
export const LEBLANC_ENEMY_SPOTS: Readonly<Record<string, Spot>> = {
  // Act I, the Chateau entrance
  'dr-goon': [0.74, 0, -1.05],
  'ormi-entrance': [1.46, 0, -0.15],
  'fem-goon': [2.82, 0, -2.6],
  // Act II, Logos' room
  'ormi-logos-room': [0.71, 0, -2.5],
  'logos-room': [1.8, 0, -0.7],
  // Act III, the Last Room
  ormi: [0.58, 0, -2.5],
  leblanc: [1.65, 0, -4.2],
  logos: [2.2, 0, -0.7],
};

/**
 * The scene's enemy slot table, in the order `leblanc-syndicate.ts` numbers the Last Room's trio (0 Leblanc, 1 Logos, 2 Ormi): Act III's spots. Every
 * fiend is pinned above, so these are the table a fiend added later would start from, and the pool under the trio reads them.
 */
export const LEBLANC_ENEMY_SLOTS: ReadonlyArray<Spot> = [LEBLANC_ENEMY_SPOTS['leblanc']!, LEBLANC_ENEMY_SPOTS['logos']!, LEBLANC_ENEMY_SPOTS['ormi']!];

/**
 * The enemy lane's x edges for a fiend with no spot of its own (none today: every fiend of the three acts has one): the span of the spots, which the
 * formation solver packs a new fiend into and the stage's relaxation may widen by 2.2 on the right. The lane's z is read off {@link LEBLANC_ENEMY_SLOTS}.
 */
export const LEBLANC_ENEMY_LANE_X: [number, number] = [0.5, 2.9];

/** Where the shared magenta pool lies under the trio: the middle of the fiends' spots (it used to follow Leblanc's old slot). `[x, z]`. */
export const LEBLANC_TRIO_POOL: [number, number] = [1.5, -1.9];

/**
 * `SceneStaging.advisorCap`: the most height, in HUD grid px, the FFX-2 move-advisor card may take in this room (the stylesheet's own is 104; the card is 74
 * at 1600x900 with its full text). 46 grid px is 115 px at 1600x900: the card's top stands at y 742 and its `N HIDE MOVES` tab above it, so the nearest fiend's
 * feet (y 723) are clear. The card keeps the head line (the move and its target), then prints what fits (`MoveAdvisor.fitCard`).
 */
export const LEBLANC_ADVISOR_CAP = 46;
