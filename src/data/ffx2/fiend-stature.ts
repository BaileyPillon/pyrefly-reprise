/**
 * FFX-2 fiend stature: how tall the human-to-medium fiends of Chapters XI, XIII, XV and XVI really stand, in the game's own models (r3942-stage, wave 1).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. These are FFX-2's models: Shiva and the Magus Sisters of Chapter XI (the Road to the Farplane), Trema of Chapter XIII
 * (the Via Infinito), the shades of Gippal, Baralai and Nooj of Chapter XV (the Den of Woe) and Ixion of Chapter XVI (Djose). Nothing here is read by an FFX
 * chapter (`data/ffx/fiend-stature.ts` is that game's table), and no giant is in it: Bahamut, Anima, Paragon and Oversoul, Vegnagun and its parts keep their own framing.
 *
 * Source: `research/ffx2-fallen-aeons.md` §12, `research/ffx2-trema.md` §14, `research/ffx2-gippal-den-of-woe.md` §12 and `research/ffx2-ixion-djose.md` §12 (the method, the
 * table, the caveats and what was not found; the lane's own report is `D:/Tools/rea/FINDINGS-sizes.md`, outside the repo). In short: the engine scale law read from the
 * game's model loader, **world size = the model's mesh size in the FFX-2 HD Remaster's files (Steam build 25501027) times the engine scale `C` times the AI script's scale
 * (1 for all of these)**, `C` being a float in the model's `.chr` params block (4 for an aeon or a summoned beast, 1 for a human-sized monster). `height` below is `raw x C`,
 * the default-pose silhouette, in the game's units. The girls' side is the mean of the three dresspheres each chapter's party wears (the lane's table of 32 jobs x 3 girls,
 * decoded from the game's own job table), so a ratio here is "a fiend against the girls as that chapter dresses them".
 *
 * Confidence: `[single source: own measurement]`: one reader, one build of the HD files, good to about 5 percent (a figure that spreads in its default pose, Shiva and Ixion,
 * reads taller or wider than it stands in battle: the research sections say by how much). A ratio here is "a head taller than the girls", not an exact figure.
 *
 * What was **not** found (so nothing here claims it): the battle camera and the distance a fiend stands from the girls on screen (the game's formation positions are in the
 * research sections, and say nothing of the lens), and an idle-pose height for Trema, the shades and the Sisters. A height is only ever used as a **ratio to the girls' mean**:
 * the stage's party figures stand at one world height (`partyHeight`) and every fiend stands at that height times its ratio.
 *
 * Presentation data, not battle data: no engine reads it (hard rule 1), and no stat, hit or damage rule depends on it.
 */

/** One HD model and the number it was measured to. */
export interface Ffx2FiendStature {
  /** The model: `m<id>`, the monster's mesh (in FFX-2 the model number equals the monster id for almost every boss). */
  readonly model: string;
  /** What the model draws, for the reader. */
  readonly name: string;
  /** The mesh's default-pose height in the HD files, model units. */
  readonly raw: number;
  /** The engine scale `C` (1 for a human-sized monster, 4 for an aeon or a summoned beast). */
  readonly scale: number;
  /** `raw x scale`: the figure's height on the game's own scale. The only field the stage reads. */
  readonly height: number;
  /** The engine height `E` the game stores for the monster (a design height), for comparison only. */
  readonly engine: number;
}

/**
 * The fiends of Chapters XI, XIII, XV and XVI by combatant id (`data/ffx2/enemies/{fallen-aeons-road,magus-sisters,trema,den-of-woe,ixion-djose}.ts`).
 * Every row: `[single source: own measurement]` (see the file header).
 */
export const FFX2_FIEND_STATURE: Readonly<Record<string, Ffx2FiendStature>> = {
  'x2-shiva': { model: 'm167', name: 'Shiva', raw: 8.596, scale: 4, height: 34.384, engine: 20 },
  sandy: { model: 'm172', name: 'Sandy', raw: 5.719, scale: 4, height: 22.876, engine: 18 },
  cindy: { model: 'm171', name: 'Cindy', raw: 3.686, scale: 4, height: 14.744, engine: 13 },
  mindy: { model: 'm173', name: 'Mindy', raw: 3.136, scale: 4, height: 12.544, engine: 16 },
  trema: { model: 'm295', name: 'Trema', raw: 17.808, scale: 1, height: 17.808, engine: 17 },
  'shade-gippal': { model: 'm177', name: 'Gippal (shade)', raw: 19.414, scale: 1, height: 19.414, engine: 18 },
  'shade-baralai': { model: 'm176', name: 'Baralai (shade)', raw: 19.349, scale: 1, height: 19.349, engine: 16 },
  'shade-nooj': { model: 'm258', name: 'Nooj (shade)', raw: 20.913, scale: 1, height: 20.913, engine: 19 },
  'x2-ixion': { model: 'm166', name: 'Ixion', raw: 7.905, scale: 4, height: 31.62, engine: 32 },
};

/**
 * The girls' mean height in the HD files, by chapter id: the mean of the three dresspheres that chapter's party wears (`data/ffx2/builds/`), each girl's model height from
 * the game's job table. Chapters XI, XV and XVI: White Mage Yuna (c018, 16.77), Dark Knight Rikku (c033, 18.54) and Dark Knight Paine (c053, 17.87), 17.73; Chapter XIII:
 * Dark Knight Yuna (c013, 17.07), Alchemist Rikku (c023, 17.46) and Dark Knight Paine (c053, 17.87), 17.47. `[single source: own measurement]`
 */
export const FFX2_GIRLS_MEAN: Readonly<Record<string, number>> = {
  'ffx2-fallen-aeons': 17.727,
  'ffx2-trema': 17.467,
  'ffx2-den-of-woe': 17.727,
  'ffx2-ixion-djose': 17.727,
};

/** A fiend's real height over the girls' mean in a chapter: Shiva 1.94, Ixion 1.78, Trema 1.02, the shades 1.09 / 1.09 / 1.18, Sandy 1.29, Cindy 0.83, Mindy 0.71. */
export function fiendOverGirls(id: string, chapter: string): number {
  const row = FFX2_FIEND_STATURE[id];
  const girls = FFX2_GIRLS_MEAN[chapter];
  return row && girls ? row.height / girls : 1;
}

/**
 * The world height each named fiend stands at on a stage whose girls stand `partyHeight` tall in `chapter`: `partyHeight` times the fiend's ratio to the girls, to the
 * millimetre. A `SceneStaging.figureHeights` table, keyed by combatant id; an id this table does not know is left out.
 */
export function ffx2FiendFigureHeights(ids: readonly string[], chapter: string, partyHeight: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of ids) {
    if (FFX2_FIEND_STATURE[id]) out[id] = Math.round(partyHeight * fiendOverGirls(id, chapter) * 1000) / 1000;
  }
  return out;
}
