/**
 * **The shape of the Evrae fight's shot table** (`./evrae-shots.ts`; the hidden Fayth chapter's website camera; FFX only): our own keyframes, not FFX's camera programs.
 *
 * A **shot** is a short track of keyframes in FFX's own units and axes (Y down; the eye and the look-at in the stage's frame, the roll in degrees, the lens as the game states it). Time is in **logic
 * steps** (1/29.97 s), counted from the beat that started the shot. A key says where the camera is at its step and **how it arrives there from the previous key**:
 *
 * - `0`: a **cut**. The camera holds the previous key until this key's step, then jumps.
 * - `1`: a **linear** blend (a straight line in every channel).
 * - `2`: a **cosine** blend (starts and ends at rest).
 * - `[3, a, b, c, d]`: a **trapezoid** blend of `a + b + c` steps (speeding up for `a`, steady for `b`, slowing for `c`; `d` is a base-speed divisor, 0 for none). The same curve as the game's
 *   accelerated move, so a table that was fitted to it plays it back to a fraction of a unit.
 *
 * What a shot holds is **numbers only**: poses and the curves between them. No instruction, no script, no condition: how the numbers were found is `research/ffx-battle-camera-evrae.md`.
 *
 * Game case: FFX only.
 */

/** A point or vector in FFX's frame (Y down). */
export type Vec3 = readonly [number, number, number];

/** How a key is reached from the previous one (see the file header). */
export type Shape = 0 | 1 | 2 | readonly [3, number, number, number, number];

/** `[step, eye, look-at, roll in degrees, lens, how it is reached]`. The lens is the game's screen depth: the vertical field of view is `2 * atan(240 / lens)`, 1024 being 26.38 degrees. */
export type ShotKey = readonly [step: number, eye: Vec3, ref: Vec3, roll: number, lens: number, shape: Shape];

/**
 * What a shot is a view of, which decides whom the tracking net expects in frame while it plays: the **default views**, **scenes**, **victory** and **defeat** are views of the whole fight
 * (the party and Evrae); an **action** shot is a view of its actor and its targets.
 */
export type ShotKind = 'default' | 'scene' | 'victory' | 'defeat' | 'action';

export interface ShotDef {
  readonly kind: ShotKind;
  /** The steps the shot is "playing" for: from the beat to the step its last motion lands (the camera is `busy` until then). 0 for a hard cut with nothing after it. */
  readonly len: number;
  readonly keys: readonly ShotKey[];
}

/** One way a route can go: a shot (`''` is "leave the camera as it is") and its weight among the branches. */
export type Branch = readonly [shot: string, weight: number];

/**
 * A route's cells: the branches for a context. A cell key is `<range><slot><target>`: the airship's range (`n` near, `f` far), the acting party member's slot (`0` to `2`, nearest the near camera
 * first, `m` for a monster) and who is targeted (`e` Evrae, `s` the actor itself, `a0` to `a2` one other party member by slot, `p` two or more party members, `x` a mix of sides). A `*` in
 * a position says the route does not depend on it.
 */
export type Cells = Readonly<Record<string, readonly Branch[]>>;

/** An ability's (or item's) routes: the shot at its opening (command accepted and the cast's start) and at its launch (the effect fires). Both are route ids. */
export interface RowRoute {
  readonly open?: string;
  readonly launch?: string;
}

export interface EvraeShotTable {
  /** Written by `tools/ffxcam-table-build.mjs`; the header comment of the data file says where it came from. */
  readonly format: 'echoes-evrae-shots/1';
  readonly shots: Readonly<Record<string, ShotDef>>;
  /** The routes, by id: shared by every ability whose shots came out the same. */
  readonly routes: Readonly<Record<string, Cells>>;
  /** By ability id, item id, or `@attack.party` / `@attack.monster` for the plain Attack of a side. */
  readonly rows: Readonly<Record<string, RowRoute>>;
  /** The default view of each range: Enter, Select (a turn's start) and Normal (an action's end) all play it. */
  readonly views: Readonly<Record<'near' | 'far', string>>;
  /** The airship scenes (Cid's Pull back and Move in). */
  readonly scenes: Readonly<Record<'pullBack' | 'moveIn', readonly Branch[]>>;
  /** The victory camera by range (`n`, `f`). */
  readonly victory: Readonly<Record<'n' | 'f', readonly Branch[]>>;
  /** The defeat camera by range and the party member that fell last: `<range><slot>` (`n0` to `f2`). */
  readonly defeat: Readonly<Record<string, readonly Branch[]>>;
}
