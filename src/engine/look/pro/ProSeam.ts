/**
 * THE CHAPTER IV SEAM, THE NUMBERS (conference demo, lane "pro-look"; Bailey 2026-10-22, "Fix the seam in Chapter IV"; options book gap G15). Pure data (no `three`, no DOM).
 *
 * What the seam is. The book's mockup called it the plate's edge: a straight vertical seam at 93 to 97 percent of the frame's width with a dark band beyond it, and two horizontal steps in the polished
 * floor. Measured in the engine (2026-10-23): the painting's own right edge is NOT in the 16:9 frame (the map from the frame to the painting puts the dark band's edge at u 0.867 of the plate, well inside
 * it, and the painted wings fill everything past the plate's edge); the dark band is the near foreground CONDUIT, the pillar at world x 8.9, z -6.8 (`bevelle-underground.ts`, `BEVELLE_CONDUITS`), a flat
 * dark slab whose inner edge stands at 91.8 percent of the frame at the idle rig. With that pipe hidden the frame is all painting, edge to edge (`evidence/b2-ch4-pro-nopipe.png`).
 *
 * The fix, with no plate and no wing file edited: (1) under the pro look the right conduit and its lamps stand {@link SEAM_PIPE_OUT} further out, so the plate and its painted wing fill the 16:9 frame and the
 * pipe is cut by the frame's edge as the code always meant it to be (`frameBracket.ts`); the left pipe, which no rig of the fight shows, stays. (2) The two floor steps get a short vertical blur in the
 * bold pass (`LookBoldShader.ts`, term 0), so the floor reads as one polished surface; the figures stay sharp through the frame's alpha mask.
 *
 * Game case (rule 14): FFX-2 only (Chapter IV's Bevelle underground; the FFX plates use the side fog and have no such seam). Every number is [ours], tuned against the engine's frames; none is game data.
 */

/** World units the right conduit (and its lamps) stand further out under the pro look: the inner edge leaves the 16:9 frame at the idle rig (it stood 1.4 units inside it) with margin for the action rigs. [ours] */
export const SEAM_PIPE_OUT = 3;

export interface ProSeam {
  /** The two floor steps, in the plate's own v (0 bottom .. 1 top; 0 = none), the blur's half width (frame uv) and its amount (0..1). */
  floors: readonly [number, number];
  floorHalf: number;
  floorAmount: number;
}

/** Per room (`LookRoom.key`): only the Bevelle underground has a seam. Floor steps measured on a CLASSIC frame at 2560x1440 (rows 1002 and 1054, plate v 0.412 and 0.382). [ours] */
export const PRO_SEAM: Readonly<Record<string, ProSeam>> = {
  'bevelle-underground': { floors: [0.412, 0.382], floorHalf: 0.02, floorAmount: 0.8 },
};

export const proSeam = (key: string): ProSeam | undefined => PRO_SEAM[key];
