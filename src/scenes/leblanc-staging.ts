import type { Spot } from '../engine/Formation.ts';
import { syndicateFigureHeights } from '../data/ffx2/syndicate-stature.ts';

// ---------------------------------------------------------------------------
// Chapter VI, the Syndicate's staging: how tall each fiend stands, and where each stands in each act
// ---------------------------------------------------------------------------
//
// Game case: FFX-2 only [AGENTS.md rule 14]. The hidden experimental Leblanc chapter plays Chapter VI's three acts by reference over the same
// room (`./exp-leblanc-last-room.ts`), so it stands the same fiends in the same places. Presentation only: nothing here reaches the engine.
//
// Bailey, 2026-10-08, on 39.4.1's "bosses forward" lane: "The way the battles are framed now being right next to each other is kinda dumb in the
// Leblanc chapter it looked way better before". Asked how the chapter should look he picked "Old spacing, real sizes": the gap and the camera exactly as
// 39.4 had them, the Syndicate at their real size (Option 1 of the 2026-10-07 options sheet, `docs/handoff/r3941-stage.md`). So this file
// is two things kept apart: the heights are 39.4.1's (the real-size table below), and the places the fiends stand are 39.4's again.

/** The girls' standing height in this room (Yuna's, which the stage gives all three girls): the unit every fiend's real height is a ratio of. */
export const LEBLANC_PARTY_HEIGHT = 1.68;

/**
 * The world height each Syndicate combatant stands at: the girls' height times the model's ratio to the girls (`data/ffx2/syndicate-stature.ts`,
 * `research/ffx2-leblanc-syndicate.md` §20): Ormi 1.935, Logos 2.119, Leblanc 1.763, Dr. Goon 1.849, Fem-Goon 1.690. Every fiend of the three
 * acts is named, so the stage's own rule (a boss at the scene's boss height, any other fiend at 0.7 of it, `worldHeightFor`) is never used here:
 * the 0.7 that made the goons 1.16 against the girls' 1.68 is gone for this chapter. **Kept from 39.4.1.**
 */
export const LEBLANC_FIGURE_HEIGHTS: Readonly<Record<string, number>> = syndicateFigureHeights(LEBLANC_PARTY_HEIGHT);

/**
 * Where each fiend stands, by combatant id (`SceneStaging.enemySpots`: the formation solver and the stage's relaxation leave a named fiend where it
 * is). Act I: Dr. Goon, Ormi and Fem-Goon; Act II: Ormi and Logos; Act III: Ormi, Leblanc and Logos. Our own staging, **not the game's**: the files hold
 * no stand position (`research/ffx2-leblanc-syndicate.md` §20.4).
 *
 * **These are the places release 39.4 (55db51dd) stood them, to the hundredth.** 39.4 did not pin its fiends: the formation solver (`engine/Formation.ts`)
 * laid each act out in the lane below, the bigger fiend further back (the bosses of an act stood at one height, so their order was the ids'), and the
 * stage's relaxation (`engine/StageRelax.ts`) pushed two of Act III's silhouettes a little apart on screen. Those are the numbers measured in the 39.4
 * build at each act's first command menu at 1600x900 (GPU Chromium, seed 1, `?coach=off`, 2026-10-08), written down as spots. Pinning them keeps the places
 * independent of the fiends' heights: the solver sorts and spaces by height, so at the real sizes it would have turned Act III around (Logos, the tallest,
 * to the very back and Leblanc to the front) and packed three figures wider than the lane into it.
 *
 * What the spots keep is the **gap**: every fiend stands 4.7 to 8.3 units behind the party's front girl (z 1.45) and 1.7 to 5.3 behind its back girl
 * (z -1.5), as in 39.4; 39.4.1's lane (z -0.15 to -2.6) had brought them level with the girls, "right next to each other". They stand in three ranks,
 * z -3.2, -5.0 and -6.8 (the first and the last in Act II), as 39.4's solver ranked them.
 *
 * Measured at the real sizes (the table above), over the girls' standing mean at 1600x900, with 39.4's own in brackets: Act I Ormi 0.65 (0.56), Dr. Goon
 * 0.70 (0.44), Fem-Goon 0.72 (0.49); Act II Ormi 0.83 (0.71), Logos 0.71 (0.56); Act III Ormi 0.83 (0.70), Logos 0.80 (0.62), Leblanc 0.59 (0.56; her raised
 * fan is not counted) -- see `docs/handoff/r3941-spacing.md` for the pictures and the HUD boxes. The spots are `[x, 0, z]` in the scene's world units; the
 * camera is at about (0, 2.85, 9.25), the girls at z 1.45, 0.1 and -1.5.
 */
export const LEBLANC_ENEMY_SPOTS: Readonly<Record<string, Spot>> = {
  // Act I, the Chateau entrance
  'dr-goon': [1.34, 0, -5.0],
  'ormi-entrance': [2.0, 0, -6.8],
  'fem-goon': [2.66, 0, -3.2],
  // Act II, Logos' room
  'ormi-logos-room': [1.45, 0, -3.2],
  'logos-room': [2.55, 0, -6.8],
  // Act III, the Last Room
  ormi: [2.55, 0, -3.2],
  logos: [1.26, 0, -5.0],
  leblanc: [2.21, 0, -6.8],
};

/**
 * The scene's enemy slot table, in the order `leblanc-syndicate.ts` numbers the Last Room's trio (0 Leblanc, 1 Logos, 2 Ormi), **as in 39.4**: Leblanc
 * centre-back, Ormi and Logos flanking, Ormi closer to the camera. Every fiend is pinned above, so these slots are not where anyone stands; they are the
 * table the stage derives the enemy lane's depth from (`laneFrom`) and the one a fiend added later would start from.
 */
export const LEBLANC_ENEMY_SLOTS: ReadonlyArray<Spot> = [
  [1.1, 0, -5.0], // Leblanc: centre-back, the fight's focal point
  [2.2, 0, -6.2], // Logos: flanks right and further back
  [-0.3, 0, -3.8], // Ormi: flanks left and closer to camera
];

/**
 * The enemy lane's x edges, **as in 39.4** (PR-0136, round 13: the lane at 1.0 to 3.0 keeps the opposing sides apart across the floor). Nothing stands in it
 * today (every fiend of the three acts has a spot); it is the lane the formation solver packs a fiend added later into, and the stage's relaxation may
 * widen it by 2.2 on the right.
 */
export const LEBLANC_ENEMY_LANE_X: [number, number] = [1.0, 3.0];

/** Where the shared magenta pool lies under the trio, **as in 39.4**: Leblanc's slot, a unit nearer the camera. `[x, z]`. */
export const LEBLANC_TRIO_POOL: [number, number] = [1.1, -4.0];

/**
 * `SceneStaging.intentRoof`: the enemy-intent slab hangs over the **highest** living fiend's head, not the acting one's, and folds its body to the room above it
 * (FFX-2 only; `FFX2BattleHud.intentHead` and `intentMaxHeight`, `EnemyIntentMountOptions.maxHeight`). The fiends stand in three ranks (z -3.2, -5.0, -6.8) at their
 * real heights, so the far, tall ones (Logos 2.119, Ormi 1.935) hold their heads higher on the screen than the near, shorter one (Fem-Goon 1.690, Ormi in Act II) and a
 * slab hung over a near fiend's head lay across a far one's (Act III's first card, Leblanc's, cut Logos's cap; Act II's, with Ormi next, covered 68 percent of Logos's
 * head at 1600x900); and a tall slab held under the top bar reached them all (Act I's Blizzard card hid Ormi's head and half of Dr. Goon's, as in 39.4; at 1280x720 every
 * card is clamped there, Act II's hid Ormi's head, 31 percent at 39.4). Measured on the real HUD at 1280x720, 1600x900 and 1920x1080 the slab covers no head in any act,
 * whichever fiend acts; its text folds (the MORE row: Act I's Blizzard card prints its damage to Yuna and Rikku and folds Paine's row and the odds, `J` holds it open).
 * Bailey, 2026-10-08: "fix it with the card, not by moving the fiends".
 */
export const LEBLANC_INTENT_ROOF = true;
