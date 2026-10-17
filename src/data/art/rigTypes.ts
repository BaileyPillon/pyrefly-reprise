/**
 * **The rig file, format v1** (2026-10-17; both games; additive: nothing existing reads it).
 *
 * One painting per figure, cut into parts on a bone rig and posed, instead of one painting per pose swapped at each pose change (the pose continuity problem,
 * `docs/handoff/pose-continuity.md`). This file is the contract between three lanes: the cutting pipeline WRITES it, Kimahri's rig is the first DATA in it, and the
 * engine (`src/engine/rig/`) READS it. It is types and constants only (no `three`, no DOM), so a Node tool may import it.
 *
 * Where it lives: `<rig art root>/<subject>/rig.json` plus one PNG per part (and one rim-mask PNG per part), served at `/art/rigs/<subject>/` (dev: `D:/pyrefly-art-rigs`
 * through `tools/vite-rig-art.mjs`; never inside `public/art`). `<subject>` is the figure's art id (`kimahri`, `rikku-alchemist`, ...). Every `png`/`rim` below is a
 * file name relative to that folder.
 *
 * **Spaces and units** (the prototype's, kept):
 * - *Painting px* are pixels of the MASTER painting the rig was cut from (`image.w` x `image.h`), x right, **y DOWN**. Joints, vertices, boxes and offsets are all in them.
 *   The runtime maps them onto the figure's idle plane, so a rig is resolution-independent: whatever tier the game draws the idle at, the plane is the same.
 * - Angles are **degrees in the file, clockwise on screen** (a lean forward for a figure facing right is positive). The runtime converts to radians.
 * - A bone's transform in a key is a deviation from bind: `rot` about the bone's own joint, then `dx`/`dy` (painting px) added to its offset from the parent joint,
 *   scale `sx`/`sy` about the joint. Children inherit it (a normal 2D bone chain).
 */

/** The only version the runtime accepts. A file with another `version` is refused (the figure draws as the painting set). */
export const RIG_VERSION = 1;

/** One bone. Parents come BEFORE their children in `bones`; the first bone with `parent: -1` is the root (it normally sits on the baseline between the feet). */
export interface RigBone {
  name: string;
  /** Index into `bones` of the parent, -1 for a root. */
  parent: number;
  /** The joint (painting px, bind pose). */
  x: number;
  y: number;
}

/** A bone's deviation from bind inside a key. Every field is optional (absent = no deviation: rot 0, dx 0, dy 0, sx 1, sy 1). */
export interface RigBoneXform {
  /** Degrees, clockwise on screen, about the bone's joint. */
  rot?: number;
  /** Painting px, added to the bone's offset from its parent joint. */
  dx?: number;
  dy?: number;
  /** Scale about the joint. */
  sx?: number;
  sy?: number;
}

/**
 * One part: a textured triangle mesh in painting px with skin weights. At rest the parts stacked in `order` ARE the approved painting (defringed); every pose is the
 * same pixels bent.
 *
 * Geometry. `verts` is flat `[x0, y0, x1, y1, ...]` (painting px, bind pose). Without `triangles` the part is the quad of its `box` (so a rigid part is just
 * `{name, order, png, box, bone}`; `verts` then defaults to the four corners).
 *
 * Skinning, one of two forms (the prototype's two influences a vertex):
 * - `bone`: rigid, every vertex follows this bone (a name, or an index into `bones`);
 * - `bones` + `weights`: two influences per vertex, both flat with two entries a vertex: `bones[2i]`, `bones[2i+1]` are bone indices (`-1` = no second influence) and
 *   `weights[2i]`, `weights[2i+1]` their weights (they should sum to 1; the runtime does not renormalise).
 *
 * The prototype's own spellings are accepted by the loader as aliases: `uv` for `uvs`, `tris` for `triangles`.
 */
export interface RigPart {
  name: string;
  /** Draw order, low = behind. A key may not change it (a part that must change sides is two parts). */
  order: number;
  /** The part's PNG (RGBA, straight alpha), exactly its `box` of the master, cut with a margin of transparent pixels where the mesh needs it. */
  png: string;
  /**
   * The part's rim mask (an 8-bit grey PNG, same size as `png`): white along the PAINTING's own outline, black along a cut between two parts, so the rim light never
   * draws a seam. **Absent = no rim light on this part.**
   */
  rim?: string;
  /** `[x, y, w, h]` of `png` in the master (painting px). */
  box: [number, number, number, number];
  verts?: number[];
  /** Flat `[u0, v0, ...]` in 0..1 of the part PNG, **v up** (three.js `flipY`, the prototype's `uv`). Absent: planar from `verts` and `box`. */
  uvs?: number[];
  /** Flat triangle indices into `verts`. */
  triangles?: number[];
  bone?: string | number;
  bones?: number[];
  weights?: number[];
  /** True when the part must never take the rim light even if a `rim` is given. */
  noRim?: boolean;
}

/** A named point on the figure that follows a bone (painting px, bind pose): `head`, `feet`, `footN`, `hand`, `spearTip` ... */
export interface RigLandmark {
  /** The bone it follows: a name or an index into `bones`. */
  bone: string | number;
  x: number;
  y: number;
}

/** What the pipeline measured when it fitted this key to its painting (the cut's own receipt; the runtime only reports it). */
export interface RigKeyFit {
  /** Overlap of the posed rig's silhouette with `source` (0..1). */
  iou: number;
  /** The posed figure's stature over the idle's (1 = same height). */
  stature: number;
  /** Distance, in painting px, between the posed feet and the baseline. */
  feetPx: number;
}

/**
 * A pose: a set of bone transforms. `idle` always exists; any other pose name the game asks for that has no key resolves down the game's own chain
 * (`BattlePresenterActors.resolvePoseName`: `attack` to `ready` to `idle`, ...) to the nearest key.
 */
export interface RigKey {
  bones: Record<string, RigBoneXform>;
  /** The whole figure about the root bone: `dx`, `dy` (painting px), `rot` (degrees). */
  root?: { dx?: number; dy?: number; rot?: number };
  /** The approved painting this key was fitted to (master path, e.g. `art/characters/kimahri/attack.png`). It is the pipeline's evidence; the runtime never loads it. */
  source: string;
  fit?: RigKeyFit;
  /**
   * Feet planted (default true). The validator and the unit tests require the lowest foot landmark of a planted key to stay on its bind row (the root offset aside);
   * set `false` on a key that is allowed to leave the floor (a KO that lies down, an airborne leap).
   */
  planted?: boolean;
  /** Milliseconds to move INTO this key (default: the actor's pose cross-fade, 120 ms party, 140 ms foes). */
  ms?: number;
}

/** A lag chain (tail, mane, sash, beard, hair): each bone's absolute angle chases its parent's through its own spring (`engine/rig/RigDynamics.ts`, `dyn.ts` ported). */
export interface RigChain {
  /** The chain's bones, root end first. */
  bones: string[];
  /** The bone whose absolute angle the first chain bone chases. */
  follow: string;
  /** Natural frequency of the first bone (Hz); each next bone is `fFalloff` times the one before (default 0.88). */
  f: number;
  /** Damping ratio (1 critical, below 1 rings; 0.4 to 0.5 for cloth and hair). */
  z: number;
  fFalloff?: number;
  /** Initial response (0 slow start, 1 immediate). Default 0. */
  r?: number;
  /** How much of the followed bone's tilt the chain refuses to follow, 0..1 (a tail keeps hanging down while the body leans). Default 0.15. */
  hang?: number;
  /** Largest angle of one chain bone from its parent, degrees. Default 70. */
  limit?: number;
  /** A constant extra angle per bone, degrees (the cloth's drift). */
  bias?: number[];
}

/** An idle: small sinusoids added on top of the current key. A rig WITHOUT `motion.idle` keeps the painted actor's whole-figure breathing and sway instead. */
export interface RigIdle {
  /** Cycles per second of the base period (every bone's term is a multiple of it; 0.5 = a two second loop). */
  hz: number;
  /** Per bone: amplitude `rot` (degrees) and optional `dx`/`dy` (painting px), with a phase (radians, default 0). */
  bones: Record<string, { rot?: number; dx?: number; dy?: number; phase?: number }>;
}

/** Secondary motion; both parts optional. */
export interface RigMotion {
  idle?: RigIdle;
  chains?: RigChain[];
}

/** The cutting pipeline's gate. The runtime draws a rig only when `status === 'ok'`; a file with no `gate` is treated as blocked. */
export interface RigGate {
  status: 'ok' | 'blocked';
  /** ISO date or timestamp of the verdict. */
  at: string;
  /** Who or what gave it (`rig-gate`, a checker's name). */
  by: string;
  /** Why, when blocked. */
  why?: string;
}

export interface RigFile {
  version: typeof RIG_VERSION;
  /** The subject (art id) this rig is for, e.g. `kimahri`. */
  name: string;
  /** The prototype's `scale` field: the master's resolution tier (2 = the cut is from a 2x master). Kept for the pipeline; the runtime does not use it. */
  scale: number;
  /** The master painting's size in px. */
  image: { w: number; h: number };
  /** The master's ground row (painting px, y down). */
  baselineY: number;
  /**
   * The costume: the ONE painting the parts were cut from. `painting` is its master path (`art/characters/kimahri/idle.png`; the `@2x` tier name or a `.webp` is
   * compared by its master's name); `sha` the first 16 hex of the master PNG's sha256. The runtime draws a rig only for a figure whose idle painting is this one, so a
   * repainted idle retires the rig until the pipeline cuts it again.
   */
  costume: { painting: string; sha: string };
  bones: RigBone[];
  parts: RigPart[];
  landmarks: Record<string, RigLandmark>;
  keys: Record<string, RigKey>;
  motion?: RigMotion;
  gate?: RigGate;
}

/** The pose names every rig must have a key for. */
export const RIG_REQUIRED_KEYS: readonly string[] = ['idle'];

/** Landmark names that count as "feet" for the planted-feet check (any landmark whose name starts with one of these). */
export const RIG_FOOT_LANDMARKS: readonly string[] = ['feet', 'foot', 'toe', 'heel', 'sole'];
