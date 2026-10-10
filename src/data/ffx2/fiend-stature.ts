/**
 * FFX-2 fiend stature: how tall the fiends of Chapters IV, XI, XIII, XV and XVI really stand, in the game's own models (r3942-stage, waves 1 and 2).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. These are FFX-2's models: Bahamut of Chapter IV (Bevelle Underground), Shiva, the Magus Sisters and Anima of Chapter XI (the Road
 * to the Farplane), Paragon (and Oversoul, one model) and Trema of Chapter XIII (the Via Infinito), the shades of Gippal, Baralai and Nooj of Chapter XV (the Den of Woe) and
 * Ixion of Chapter XVI (Djose). Nothing here is read by an FFX chapter (`data/ffx/fiend-stature.ts` is that game's table), and Vegnagun and its parts are not in it (one union
 * mesh, low confidence: they keep the approved staging of `scenes/farplane-colossus.ts`). **The three giants of wave 2 (Bahamut, Paragon and Anima) are in it with the rest, but
 * the stage does not stand them at these heights unasked**: how much of the real height each plays at, on a desktop and on a phone, is Bailey's pick ({@link FFX2_GIANT_SHARE},
 * 2026-10-08) and the camera that holds them is `engine/fx/mix/giants.ts`.
 *
 * Source: `research/ffx2-bahamut.md` §9, `research/ffx2-fallen-aeons.md` §12 and §13, `research/ffx2-trema.md` §14 and §15, `research/ffx2-gippal-den-of-woe.md` §12 and `research/ffx2-ixion-djose.md` §12 (the method, the
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
  // Wave 2, the giants (research `ffx2-bahamut.md` §9, `ffx2-fallen-aeons.md` §13, `ffx2-trema.md` §15). Raw is the lane's table read to its two decimals (`real_H` / C), so each is good to 0.01 of 4.
  // Default pose, wings and limbs spread: Bahamut's idle-pose bones span about 58 (not 87.8), which the picks below take into account (medium confidence; Anima and Paragon: high).
  bahamut: { model: 'm168', name: 'Bahamut', raw: 21.963, scale: 4, height: 87.852, engine: 55 },
  paragon: { model: 'm152', name: 'Paragon and Oversoul', raw: 23.573, scale: 4, height: 94.292, engine: 90 },
  'x2-anima': { model: 'm169', name: 'Anima', raw: 34.148, scale: 4, height: 136.592, engine: 138 },
};

/**
 * The girls' mean height in the HD files, by chapter id: the mean of the three dresspheres that chapter's party wears (`data/ffx2/builds/`), each girl's model height from
 * the game's job table. Chapters XI, XV and XVI: White Mage Yuna (c018, 16.77), Dark Knight Rikku (c033, 18.54) and Dark Knight Paine (c053, 17.87), 17.73; Chapter XIII:
 * Dark Knight Yuna (c013, 17.07), Alchemist Rikku (c023, 17.46) and Dark Knight Paine (c053, 17.87), 17.47; Chapter IV: White Mage Yuna (c018, 16.77), Dark Knight
 * Rikku (c033, 18.54) and Warrior Paine (c051, 17.13), 17.48. `[single source: own measurement]`
 */
export const FFX2_GIRLS_MEAN: Readonly<Record<string, number>> = {
  'ffx2-bahamut': 17.48,
  'ffx2-fallen-aeons': 17.727,
  'ffx2-trema': 17.467,
  'ffx2-den-of-woe': 17.727,
  'ffx2-ixion-djose': 17.727,
};

/**
 * A fiend's real height over the girls' mean in a chapter: Shiva 1.94, Ixion 1.78, Trema 1.02, the shades 1.09 / 1.09 / 1.18, Sandy 1.29, Cindy 0.83, Mindy 0.71 and the giants
 * Bahamut 5.03 (Chapter IV), Paragon 5.40 (XIII) and Anima 7.71 (XI).
 */
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

/**
 * **The giants' picks (Bailey, 2026-10-08, "go with your recommendations": `docs/handoff/r3942-stage.md`, the giants options sheet `giants-options-sheet.jpg`).** How much of its real
 * height each giant stands at, on a desktop window and on the upright phone. Bahamut (Chapter IV) and Paragon (Chapter XIII) stand at their real height on a desktop, framed by
 * the colossus camera of `engine/fx/mix/giants.ts` (option 3 of the options sheet), and at 0.7 of it on the phone (option 4: the phone cannot hold the girls smaller, and 0.7 is
 * also Bahamut's idle-bone height: 58 of 87.8, 0.66); Anima (Chapter XI) stands at 0.7 of her real height everywhere (option 4). `1` is the real height, so a share is
 * a fraction of the table's own figure, never an invented one. Presentation: no rule reads it. `[single source: own measurement]` for the real height; the share is a
 * staging pick.
 */
export const FFX2_GIANT_SHARE: Readonly<Record<string, { readonly desktop: number; readonly phone: number }>> = {
  bahamut: { desktop: 1, phone: 0.7 },
  paragon: { desktop: 1, phone: 0.7 },
  'x2-anima': { desktop: 0.7, phone: 0.7 },
};

/**
 * A giant's world height on a stage whose girls stand `partyHeight` tall in `chapter`: the real height ({@link ffx2FiendFigureHeights}) times its pick
 * ({@link FFX2_GIANT_SHARE}) for this window, to the millimetre; null for an id that is no giant of this table.
 */
export function ffx2GiantHeight(id: string, chapter: string, partyHeight: number, phone: boolean): number | null {
  const share = FFX2_GIANT_SHARE[id];
  const real = FFX2_GIRLS_MEAN[chapter] ? ffx2FiendFigureHeights([id], chapter, partyHeight)[id] : undefined; // a chapter the table does not know has no girls to read the ratio over
  return share && real !== undefined ? Math.round(real * (phone ? share.phone : share.desktop) * 1000) / 1000 : null;
}
