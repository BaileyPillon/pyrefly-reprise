/**
 * FFX fiend stature: how tall the human-to-medium fiends of Chapters IX and XIV really stand, in the game's own models (r3942-stage, wave 1).
 *
 * **Game case: FFX only** (AGENTS.md rule 14). These models are FFX's: Yojimbo, Daigoro and Lady Ginnem of Chapter IX (the Cavern of the Stolen Fayth) and
 * Isaaru and his three aeons of Chapter XIV (the Via Purifico). Nothing here is read by an FFX-2 chapter (`data/ffx2/fiend-stature.ts` is that game's table),
 * and no giant is in it: Bahamut, Anima, Evrae, Braska's Final Aeon, Natus, Flux, Omnis, Yunalesca and Sin keep their own framing.
 *
 * **The scale law** (`D:/Tools/rea/FINDINGS-sizes.md` section 1, outside the repo): a model's world size is its mesh size in the HD files times the engine scale `C`
 * (a float in the model's `.chr` params block, +0x0C) times the AI script's scale vector (1 for every row here). So `height` below is `raw x C`, the default-pose
 * silhouette of the model, in the game's units, on the same scale as Tidus's 18.15 (`party-stature.ts` `TIDUS_TOP`). Yojimbo's 27.1 was checked against the live
 * PS2 game (his head point read 26.9 to 27.0 in PCSX2) and Daigoro's 8.0 and Lady Ginnem's 17.3 against the engine heights the game stores (8.0 and 16.0).
 * Tag: `[datamined: FFX HD Remaster build 25501027, bind pose, one reader; Yojimbo, Daigoro and Ginnem also checked in PCSX2]`; the method, the model ids and the
 * caveats are `research/ffx-yojimbo.md` section 12 and `research/ffx-isaaru-bevelle.md` section 14. No game file, model or code is in the repo: only these numbers.
 *
 * **What a height is used as.** Only ever a ratio to a hero on the same stage: the scene's party stands at one shared world height (`partyHeight`, Tidus's) and a
 * fiend stands at that height times its model's ratio to the reference model (Tidus's 18.15 in Chapter IX, Yuna's own 16.53 in Chapter XIV, whose scene gives her
 * her own height). The three aeons are the models of Ifrit (`s002`, Grothia), Valefor (`s001`, Pterya) and Bahamut (`s006`, Spathi): a creature that spreads in
 * its default pose reads taller and wider than it stands in battle (Bahamut's idle bones span 58, his mesh 87.8), so a stage that cannot show the full figure
 * says so and is not forced to (`docs/handoff/r3942-stage.md`).
 *
 * Presentation data, not battle data: no engine reads it (hard rule 1), and no stat, hit or damage rule depends on it.
 */

import { TIDUS_TOP } from './party-stature.ts';

/** One HD model and the number it was measured to. */
export interface FiendStature {
  /** The model: `sNNN` an aeon (summon) model, `mNNN` a monster mesh, `kNNN` a skeleton group (Isaaru, Lady Ginnem). */
  readonly model: string;
  /** What the model draws, for the reader. */
  readonly name: string;
  /** The mesh's default-pose height in the HD files, model units. */
  readonly raw: number;
  /** The engine scale `C` of the model (1 for a human-sized monster, 4 for an aeon). */
  readonly scale: number;
  /** `raw x scale`: the figure's height on the game's own scale (Tidus 18.15). The only field the stage reads. */
  readonly height: number;
  /** The engine height `E` the game stores for the monster (a design height), for comparison only: `height` is what is drawn. */
  readonly engine: number;
}

/**
 * The fiends of Chapters IX and XIV by combatant id (`data/ffx/enemies/yojimbo.ts`, `isaaru.ts`). Every row: `research/ffx-yojimbo.md` section 12 and
 * `research/ffx-isaaru-bevelle.md` section 14, tag `[datamined: FFX HD Remaster build 25501027, bind pose, one reader]`.
 */
export const FFX_FIEND_STATURE: Readonly<Record<string, FiendStature>> = {
  yojimbo: { model: 's008', name: 'Yojimbo', raw: 6.775, scale: 4, height: 27.101, engine: 29 },
  daigoro: { model: 's023', name: 'Daigoro', raw: 1.993, scale: 4, height: 7.972, engine: 8 },
  ginnem: { model: 'k014', name: 'Lady Ginnem (monster 249, mesh m249)', raw: 17.321, scale: 1, height: 17.321, engine: 16 },
  isaaru: { model: 'k004', name: 'Isaaru (monster 248, mesh m248)', raw: 18.68, scale: 1, height: 18.68, engine: 18 },
  grothia: { model: 's002', name: 'Grothia, Isaaru\'s Ifrit (the HD name "Fist")', raw: 7.799, scale: 4, height: 31.198, engine: 25 },
  pterya: { model: 's001', name: 'Pterya, Isaaru\'s Valefor (the HD name "Wing")', raw: 12.802, scale: 4, height: 51.209, engine: 36 },
  spathi: { model: 's006', name: 'Spathi, Isaaru\'s Bahamut (the HD name "Sword")', raw: 21.962, scale: 4, height: 87.848, engine: 55 },
};

/** A fiend's real height as a multiple of Tidus's (18.15): Yojimbo 1.49, Daigoro 0.44, Lady Ginnem 0.95. */
export function fiendOverTidus(id: string): number {
  const row = FFX_FIEND_STATURE[id];
  return row ? row.height / TIDUS_TOP : 1;
}

/**
 * The world height each named fiend stands at on a stage whose reference hero stands `partyHeight` tall: `partyHeight` times the fiend's model height over the
 * reference model's (`refTop`, Tidus's 18.15 by default), to the millimetre. A `SceneStaging.figureHeights` table, keyed by combatant id.
 */
export function fiendFigureHeights(ids: readonly string[], partyHeight: number, refTop: number = TIDUS_TOP): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of ids) {
    const row = FFX_FIEND_STATURE[id];
    if (row) out[id] = Math.round(partyHeight * (row.height / refTop) * 1000) / 1000;
  }
  return out;
}
