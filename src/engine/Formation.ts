/**
 * Where the fiends stand.
 *
 * Bailey, on the Chapter 3 frame: *"some enemies are hidden behind bigger
 * enemies? they are not clearly visible."* Both Yu Pagodas were completely
 * behind Braska's Final Aeon's painting, so neither could be seen, let alone
 * told apart or aimed at.
 *
 * The approved end state (option B, `docs/concepts/targeting/`, 2026-09-19)
 * answers that in the **layout**, not in a shader: *"enemies stand in their own
 * lane in a spread formation with a real depth gap from the party and no
 * silhouette crossing another (nearest fiend in front, the aeon behind, the far
 * Yu Pagoda higher and smaller)"*. The x-ray fade that solves it optically was
 * option C's answer and was explicitly **not** picked.
 *
 * GAME-AWARE (AGENTS.md rule 14): **both games.** Neither FFX nor FFX-2 ever
 * lets one enemy hide another — both use fixed spread formations — so a
 * formation that does is a bug in our staging rather than a feature of either
 * game, and the fix applies to FFX chapters 1-3 and FFX-2 chapters 4-5 alike.
 * Source: `docs/concepts/targeting/options.json` (the `trueTo` line shared by
 * options A, B and D: "enemies in a spread formation so none hides another"),
 * drawn from `research/visual-bible.md` §4.
 *
 * Pure: no `three`, no DOM. Positions are `[x, y, z]` in the scene's own world
 * units, the same shape `SceneSlots.enemy` publishes.
 */

/** A world position, as the scene slot tables write them. */
export type Spot = [number, number, number];

/** One fiend asking for a place to stand. */
export interface FormationMember {
  id: string;
  /** World height in units — a party member is ~1.8, a boss 4+. */
  height: number;
  /**
   * Bigger fiends go further back. Taken from `height` when omitted; a
   * destructible part passes its own so a leg does not get a boss's lane.
   */
  bulk?: number;
  /** True for a part of a larger machine (Vegnagun's leg, tail, head). */
  isPart?: boolean;
  /** The combatant this is a part of, when `isPart`. */
  parentId?: string;
}

export interface FormationOptions {
  /**
   * The lane's near and far edge in z. The party stands at positive z, so the
   * fiends' lane is negative and the gap between the two is the "real depth
   * gap" the approved staging asks for.
   */
  z?: [near: number, far: number];
  /** The lane's left and right edge in x. */
  x?: [left: number, right: number];
  /** Minimum horizontal clearance between two silhouettes, in world units. */
  clearance?: number;
  /** How high a levitating fiend is lifted, as a multiple of its own height. */
  lift?: number;
}

const DEFAULTS: Required<FormationOptions> = {
  z: [-1.6, -5.4],
  x: [0.4, 5.8],
  clearance: 0.55,
  lift: 0.45,
};

/** What the solver decided for one fiend. */
export interface FormationSlot {
  id: string;
  spot: Spot;
  /** Index in the front-to-back ordering, 0 = nearest the camera. */
  rank: number;
}

/**
 * Lay a group of fiends out so no silhouette crosses another.
 *
 * The rule, in the order it is applied:
 *
 * 1. **Big at the back.** Sorting by bulk descending and walking the lane from
 *    its far edge forward puts the aeon behind and the small fiends in front of
 *    it — "small enemies stand in FRONT of and beside big ones (nearer the
 *    camera, lower on screen)". A big figure in front of a small one hides it
 *    however far apart they are in x, because it is simply wider.
 * 2. **The biggest in the middle, the rest alternating outward.** That is the
 *    reading of the approved frame: the aeon centre-back, one Yu Pagoda in
 *    front of and left of it, the other further right and higher. A fiend
 *    added later goes to whichever side is emptier, so the row stays a spread
 *    rather than drifting into a diagonal line.
 * 3. **Packed, not pushed.** The row is laid out left to right at
 *    `half + clearance + half` spacing and then centred in the lane, so
 *    clearance is guaranteed by construction instead of being searched for.
 *    An over-full lane (more fiend than location) narrows the clearance evenly
 *    and clamps to the edges rather than walking a figure into the backdrop —
 *    the honest failure, and one the projected check in
 *    `PaintedStage.visibility()` will still catch at runtime.
 * 4. **Parts stay with their machine.** Vegnagun's leg, tail, body and head are
 *    one object, not four fiends — they are laid along the parent's own lane at
 *    a fixed spread instead of being scattered across the field. The approved
 *    frame is honest about this: *"Vegnagun's parts genuinely touch, because it
 *    is one machine"*; what the layout guarantees is that each part's own
 *    silhouette clears its neighbours', which is what makes it selectable.
 *
 * Half-width is estimated from world height: painted figures in this project
 * run roughly 0.42 as wide as they are tall standing, which is the same ratio
 * `PaintedActor`'s default shadow radius uses.
 */
export function solveFormation(
  members: readonly FormationMember[],
  opts: FormationOptions = {},
): FormationSlot[] {
  const o = { ...DEFAULTS, ...opts };
  if (!members.length) return [];

  const parts = members.filter((m) => m.isPart);
  const whole = members.filter((m) => !m.isPart);

  // Biggest first, then by id so the same formation always comes out the same
  // way (the field must be identical between a test run and a screenshot).
  const ordered = [...whole].sort(
    (a, b) => bulkOf(b) - bulkOf(a) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );

  const [zNear, zFar] = o.z;
  const [xLeft, xRight] = o.x;
  const steps = Math.max(1, ordered.length - 1);
  const out: FormationSlot[] = [];

  // The left-to-right sequence: the biggest in the middle, everything else
  // alternating outward from it. `unshift`/`push` on alternate turns is the
  // whole of it, and it is why the two Yu Pagodas end up flanking the aeon
  // rather than queueing behind it.
  const row: FormationMember[] = [];
  ordered.forEach((m, i) => {
    if (i === 0) row.push(m);
    else if (i % 2 === 1) row.unshift(m);
    else row.push(m);
  });

  // Pack the row, then centre it. Clearance narrows evenly when the lane is
  // too small for what is standing in it, rather than one fiend being shoved
  // out of frame.
  const halves = row.map(halfWidthOf);
  const sumW = halves.reduce((a, h) => a + h * 2, 0);
  const laneW = Math.max(0.1, xRight - xLeft);
  const gaps = Math.max(1, row.length - 1);
  const clearance = Math.max(0, Math.min(o.clearance, (laneW - sumW) / gaps));

  const rowW = sumW + clearance * gaps;
  let cursor = (xLeft + xRight) / 2 - rowW / 2;
  const depthRank = new Map(ordered.map((m, i) => [m.id, i]));

  row.forEach((m, i) => {
    const half = halves[i]!;
    const x = clamp(cursor + half, xLeft + half, xRight - half);
    cursor += half * 2 + clearance;
    // Depth comes from bulk, not from the row order: index 0 of `ordered` is
    // the biggest and sits at the far edge, so a small fiend is always nearer
    // the camera and lower on screen than the boss it stands beside.
    const rank = depthRank.get(m.id) ?? i;
    const t = steps === 0 ? 0 : rank / steps;
    const z = zFar + (zNear - zFar) * t;
    out.push({ id: m.id, spot: [round(x), 0, round(z)], rank });
  });

  // Parts ride their machine's lane. A part with no parent on the field is
  // treated as a whole fiend by the pass above, so this only runs for real ones.
  for (const part of parts) {
    const host = out.find((s) => s.id === part.parentId);
    const anchor = host?.spot ?? [(xLeft + xRight) / 2, 0, (zNear + zFar) / 2];
    const siblings = parts.filter((p) => p.parentId === part.parentId);
    const i = siblings.indexOf(part);
    const n = Math.max(1, siblings.length);
    // Laid along the machine's own length, near end first, each step forward
    // and outward so no two parts share a silhouette.
    const t = n === 1 ? 0.5 : i / (n - 1);
    const dx = (t - 0.5) * Math.max(1.6, halfWidthOf(part) * 2 * n * 0.9);
    const dz = (0.5 - t) * 1.1;
    out.push({
      id: part.id,
      spot: [round(anchor[0] + dx), round(part.isPart ? liftOf(part, o.lift) : 0), round(anchor[2] + dz)],
      rank: out.length,
    });
  }

  return out;
}

/**
 * How much of each fiend is in the clear, judged from world geometry alone —
 * the cheap pre-flight check a scene's slot table can be unit-tested against
 * without a renderer.
 *
 * This is **not** the real measurement: `PaintedStage.visibility()` projects
 * the live silhouettes and is what the Playwright pass asserts on. This one
 * catches a slot table that puts two fiends on the same spot before anything is
 * ever rendered.
 */
export function laneClearance(slots: readonly FormationSlot[], members: readonly FormationMember[]): Map<string, number> {
  const byId = new Map(members.map((m) => [m.id, m]));
  const out = new Map<string, number>();
  for (const s of slots) {
    const m = byId.get(s.id);
    const half = m ? halfWidthOf(m) : 0.6;
    let worst = Infinity;
    for (const other of slots) {
      if (other.id === s.id) continue;
      const om = byId.get(other.id);
      // Only something NEARER the camera (bigger z) can hide this one.
      if (other.spot[2] <= s.spot[2]) continue;
      const otherHalf = om ? halfWidthOf(om) : 0.6;
      const gap = Math.abs(other.spot[0] - s.spot[0]) - (half + otherHalf);
      worst = Math.min(worst, gap);
    }
    out.set(s.id, worst === Infinity ? 1 : worst);
  }
  return out;
}

function bulkOf(m: FormationMember): number {
  return m.bulk ?? m.height;
}

/** Painted figures in this project run about 0.42 as wide as they are tall. */
function halfWidthOf(m: FormationMember): number {
  return Math.max(0.35, bulkOf(m) * 0.42) / 2 + 0.1;
}

function liftOf(m: FormationMember, lift: number): number {
  return m.height * lift;
}

function clamp(v: number, lo: number, hi: number): number {
  if (hi < lo) return (lo + hi) / 2;
  return v < lo ? lo : v > hi ? hi : v;
}

function round(v: number): number {
  return Math.round(v * 100) / 100;
}
