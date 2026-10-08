/**
 * FFX fiend stature: how tall the human-to-medium fiends of Chapters IX and XIV really stand, in the game's own models (r3942-stage, wave 1).
 *
 * **Game case: FFX only** (AGENTS.md rule 14). These models are FFX's: Yojimbo, Daigoro and Lady Ginnem of Chapter IX (the Cavern of the Stolen Fayth) and
 * Isaaru and his three aeons of Chapter XIV (the Via Purifico). Nothing here is read by an FFX-2 chapter (`data/ffx2/fiend-stature.ts` is that game's table),
 * and no giant is in `FFX_FIEND_STATURE`: Bahamut, Anima, Evrae, Omnis, Yunalesca and Sin's Fins and head keep their own framing, and the four chapters whose giants were
 * given real sizes in wave 2 (Flux, Braska's Final Aeon, Natus, Genais and the Core) have their own table at the foot of this file, `FFX_GIANT_STATURE`.
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
  // The three aeons: recorded, and applied by no scene but as a check (Chapter XIV keeps its aeons at 3.2 on both sides): Grothia's 31.2 agrees with that to 1 percent; Pterya's and
  // Spathi's are default-pose silhouettes with the wings spread, which the paintings do not stand in (`research/ffx-isaaru-bevelle.md` section 14.3).
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

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
// THE GIANTS (r3942-giants-ffx, wave 2; FFX only)
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * **A giant's size is what the live PS2 game draws, not the default pose of a model.** The wave-1 table above is `raw x C`, the HD mesh in its default pose, and it is
 * right for a figure that stands upright (Yojimbo, Ginnem). A giant spreads in that pose (Braska's Final Aeon reads 204.7 by the law and 92 on the PS2 screen; Genais
 * 80.3 and 49), so these rows are **silhouettes read off the PS2 game's own picture** (PCSX2 v2.8.2, the NTSC-U disc SLUS-20312, the sizes lane's second pass of
 * 2026-10-08: `D:/Tools/pcsx2-ffx/re/dumps/boss-sizes.json`, outside the repo): a ruler of Tidus markers at the part's own depth gives pixels per game unit, and the part's
 * silhouette gives rows over it, on the same scale as Tidus's 18.15. The static law (`raw x C x the script's scale vector`, `D:/Tools/rea/FINDINGS-sizes.md` section 4)
 * and the engine height field `E` stay in each row for comparison only; neither is drawn.
 * Tags: `[single source: own measurement]` for every `height` here (one lane, one disc, a handful of reloaded frames each) and `[datamined: FFX HD Remaster build 25501027,
 * bind pose, one reader]` for `staticLaw`. The method, the model ids, the ranges and what an independent check said of each are `research/ffx-seymour-flux.md` section 13,
 * `research/ffx-bfa-yu-yevon.md` section 9, `research/ffx-seymour-natus-highbridge.md` section 13 and `research/ffx-sin.md` section 13.
 *
 * **`share` is Bailey's pick** (2026-10-08, after the giants options study, "I'll go with all of your recommendations"): the share of the live height the build draws.
 * Flux 0.6 and Braska's Final Aeon with the two Yu Pagodas 0.75 (a whole figure in the frame, the party kept near its size); Natus and Sinspawn Genais and the Core 1 (real
 * size at today's spots). The Fins, Yunalesca, Evrae, Omnis, Overdrive Sin's head and Yojimbo are not here: no pick, nothing built.
 *
 * Presentation data, not battle data (hard rule 1): no engine reads it, no stat or hit rule depends on it.
 */
export interface GiantStature {
  /** The PS2 model(s): `mNNN` a monster mesh. */
  readonly model: string;
  readonly name: string;
  /** The live silhouette, game units on the scale where Tidus is 18.15: the number `share` is a share of. */
  readonly height: number;
  /** The lowest and the highest height the reads covered, game units (what the figure does as it moves, and the reads' own spread). */
  readonly read: readonly [low: number, high: number];
  /** True: a floor, not a measure. The silhouette ran into the frame's edge (the HELP banner over the top, the command panel under the bottom), so the figure is at least this tall. */
  readonly lowerBound: boolean;
  /** `raw x C x script scale`, the default-pose silhouette of the HD mesh (comparison only), or null where the lane records none. */
  readonly staticLaw: number | null;
  /** The engine height field `E` (a design height; comparison only). */
  readonly engine: number;
  /** How sure the live number is. */
  readonly confidence: 'medium' | 'medium-low' | 'low-medium';
  /** Bailey's pick: the share of `height` the build draws (1 = the real size). */
  readonly share: number;
  /** Where the game stands it against another giant of the fight, game units (a part that stands behind its figure: the Yu Pagodas behind the aeon). */
  readonly stand?: { readonly of: string; readonly dx: number; readonly dy: number; readonly dz: number };
}

/** The giants of Chapters I, III, X and XVII by combatant id (`data/ffx/enemies/*.ts`). */
export const FFX_GIANT_STATURE: Readonly<Record<string, GiantStature>> = {
  // Chapter I. The figure breathes: 91.1 to 103 in the five reloaded frames (100.6, 103, 100, 93.7, 91.1), up to 132 with the lance raised. The scale (4.55 to 4.6 px per unit) is
  // read off Tidus alone and an independent check judged it shaky, 10 percent or more: medium-low. The static law 100.5 agrees with the typical pose; the idle bones span 86.
  'seymour-flux': { model: 'm142', name: 'Seymour Flux', height: 100, read: [91.1, 103], lowerBound: false, staticLaw: 100.5, engine: 45, confidence: 'medium-low', share: 0.6 },
  // Chapter III. Braska's Final Aeon: three live methods give 79 to 96 (94.4 at 6.58 px per unit with its top row under the HELP banner, so a floor; 79 to 85 when the part is moved
  // 12 units and its scale re-read; the first pass 96.2). The static law 204.7 is more than twice too big (the model is read with its parts spread); E 90 agrees with the live number.
  'braskas-final-aeon': { model: 'm132', name: "Braska's Final Aeon", height: 92, read: [79, 95], lowerBound: true, staticLaw: 204.7, engine: 90, confidence: 'medium', share: 0.75 },
  // The two Yu Pagodas stand behind him in the game's own formation: 60 units either side of him and 70 behind (boss (0, 0, 40), pagodas (-60, 0, 110) and (60, 0, 110)), hung off the
  // floor. Left (the game's x -60) is m174, right (+60) is m173; the twins differ by 10 percent. Read by moving each part 12 units (the move method reads about 5 percent high on a part
  // that drifts back) with the top and the bottom of both near the frame's edges, so both are floors; no Tidus marker can be put at their depth. `dy` (12.8) is the options study's hang
  // above the floor (the game's own roots stand 45 above it, the aeon's 20): ours, not read.
  'yu-pagoda-left': { model: 'm174', name: "Yu Pagoda, left (the game's x -60)", height: 75.8, read: [75.2, 76.3], lowerBound: true, staticLaw: 34.7, engine: 90, confidence: 'low-medium', share: 0.75, stand: { of: 'braskas-final-aeon', dx: -60, dy: 12.8, dz: 70 } },
  'yu-pagoda-right': { model: 'm173', name: "Yu Pagoda, right (the game's x +60)", height: 83.9, read: [82.3, 85.6], lowerBound: true, staticLaw: 50.2, engine: 90, confidence: 'low-medium', share: 0.75, stand: { of: 'braskas-final-aeon', dx: 60, dy: 12.8, dz: 70 } },
  // Chapter X. Seymour Natus: the silhouette of the body reads 46.2 (N = 20 only, where the thin scythe and chain tip is a separate blob); with the tip the median is 52.2 (50.6 to 57.1, three frames,
  // 8.25 px per unit from Tidus markers 45 units either side). The static law says 42.0 (raw 10.5 x C 4; width 34) and E 40; the idle bones give only 12.5, not trusted. m127 adds nothing to the silhouette.
  'seymour-natus': { model: 'm126', name: 'Seymour Natus', height: 46.2, read: [46.2, 52.2], lowerBound: false, staticLaw: 42.0, engine: 40, confidence: 'medium', share: 1 },
  // Chapter XVII, link 3 (Sin's back). Sinspawn Genais: the silhouette over its animation, four reloaded shots (50.1, 52.0, 47.5, 44.2 at 9.3 px per unit, Tidus 55 units either side, the camera
  // pulling out 9.6 to 7.9 across them; the claws spread to 100 wide late in the cycle). The static law 80.3 is the default pose (raw 25.1 x C 4 x script scale 0.8, mesh m102) and the lane's
  // first number, 77.6, was the maximum of one joint over the loop: both are withdrawn. The joint's mean over the loop (52.7) and E (40) bracket the silhouette.
  'sinspawn-genais': { model: 'm139', name: 'Sinspawn Genais', height: 49, read: [44.2, 52], lowerBound: false, staticLaw: 80.3, engine: 40, confidence: 'medium', share: 1 },
  // The Core (m138, "Sin" in the monster table): the shell with its spikes, three shots (30.2, 30.9, 31.7 at 8.7 px per unit, the scale raised 5 percent for the left and right gradient seen
  // at Genais's depth because Tidus could be put on one side only). It floats: the joints run 30 to 57 above the floor, a bone span of 27, not a height above the floor. Static law 27.2, E 16.
  'sin-core': { model: 'm138', name: "Sin's Core (the shell)", height: 30, read: [28.7, 31.7], lowerBound: false, staticLaw: 27.2, engine: 16, confidence: 'medium', share: 1 },
};

/**
 * A fiend that has no model of its own to measure and so grows with the boss it belongs to, at the share of the boss's drawn height it stood at in the build before:
 * Mortiorchis, Flux's mount (the game's `m143` has no mesh), 0.55 of him, and Mortibody, Natus's, 0.43.
 */
export const FFX_GIANT_FOLLOWER: Readonly<Record<string, { readonly of: string; readonly share: number }>> = {
  mortiorchis: { of: 'seymour-flux', share: 0.55 },
  // Mortibody (m127, which adds nothing to his silhouette) has no size of its own: it keeps the 0.43 of Natus it stood at on a desktop before (1.7 against the 3.96 BOSS SCALE gave him).
  mortibody: { of: 'seymour-natus', share: 0.4293 },
};

const mm = (v: number): number => Math.round(v * 1000) / 1000;

/** The world height of a giant (or of a follower) on a stage whose reference hero stands `partyHeight` tall: `partyHeight x height x share / refTop`, to the millimetre; undefined for any other id. */
export function giantHeight(id: string, partyHeight: number, refTop: number = TIDUS_TOP): number | undefined {
  const row = FFX_GIANT_STATURE[id];
  if (row) return mm(partyHeight * ((row.height * row.share) / refTop));
  const follow = FFX_GIANT_FOLLOWER[id];
  const boss = follow && FFX_GIANT_STATURE[follow.of];
  return follow && boss ? mm(partyHeight * ((boss.height * boss.share) / refTop) * follow.share) : undefined;
}

/**
 * Where the game stands a part against the figure it stands behind, in world units on a stage whose reference hero is `partyHeight` tall, at the part's own share: `dx` to the screen's
 * right, `dy` up from the floor, `dz` away from the party (behind the figure). Null for any id with no stand (Braska's Yu Pagodas have one).
 */
export function giantStand(id: string, partyHeight: number, refTop: number = TIDUS_TOP): { dx: number; dy: number; dz: number } | null {
  const row = FFX_GIANT_STATURE[id];
  const s = row?.stand;
  if (!row || !s) return null;
  const k = (partyHeight * row.share) / refTop;
  return { dx: mm(s.dx * k), dy: mm(s.dy * k), dz: mm(s.dz * k) };
}

/** A `SceneStaging.figureHeights` table for the giants named in `ids` (an id this table does not know is left out). */
export function giantFigureHeights(ids: readonly string[], partyHeight: number, refTop: number = TIDUS_TOP): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of ids) {
    const h = giantHeight(id, partyHeight, refTop);
    if (h !== undefined) out[id] = h;
  }
  return out;
}
