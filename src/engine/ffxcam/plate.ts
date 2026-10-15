/**
 * **The painted plate and deck of the website's Fayth scene, as numbers** (FFX only; `../../scenes/exp-fayth-stage.ts` lays them, `./plateFit.ts` measures a camera against them, `tools/ffxcam-plate.mjs` reports):
 * where the sky plate stands and how big it is, where the deck is, in the world the painted skin builds at FFX's staging. Pure numbers and three.js-free vector math, so a tool can say what the camera can see
 * of the painting without building the scene.
 *
 * - **The plate** is Chapter VIII's painting of the airship (`public/art/backdrops/evrae-airship-deck.png`, 2688 x 1536 pixels): a rectangle {@link PLATE.width} world units wide at scale 1, rolled
 *   {@link PLATE.roll} radians about its own centre so the painted rail lies level (`../../scenes/evrae-airship-deck.ts`'s `BACKDROP`). The painted skin stands it {@link PLATE.distance} world units down the
 *   near default camera's view line, facing the camera's position (a turn about the vertical axis only: the plate stays upright), at scale {@link PLATE.scale}, so that it fills the frame at 16:9 with its roll.
 * - **The deck** is the geometry under the party (`../../scenes/evrae-airship-sky.ts`, `DECK` in `../../scenes/evrae-airship-range.ts`): a floor {@link DECK.halfWidth} either side of its middle and from
 *   {@link DECK.edgeZ} to {@link DECK.nearZ} along it, turned a quarter so its length runs along the party's column and set on the floor the party stands on.
 * - **Beyond them there is nothing**: the scene's background colour, a deep navy. A camera that looks past the plate's edge and the deck's shows it, which is what the painted B's limits keep out of the picture.
 *
 * `tests/unit/ffxcam-plate.test.ts` pins these numbers against the scene's own constants.
 *
 * Game case: FFX only.
 */

/** The plate's numbers (the pixel size is the installed art's; the rest are `BACKDROP` and `layPainted`'s). */
export const PLATE = {
  /** The plate's width at scale 1 (`BACKDROP.width`). */
  width: 90,
  /** Pixels of the painting: 2688 wide, 1536 tall (the height is the width over this ratio). */
  aspect: 2688 / 1536,
  /** Radians about the plate's own centre (`BACKDROP.roll`). */
  roll: -0.2025,
  /** World units from the near camera along its view line to the plate's centre. */
  distance: 80,
  /** The scale the painted skin gives the plate: 90 wide becomes 162, enough to fill the frame at 16:9 with the roll. */
  scale: 1.8,
} as const;

/** The deck's numbers (`DECK` in `../../scenes/evrae-airship-range.ts`): the floor's half width and its two ends along its length. */
export const DECK = { edgeZ: -2.7, nearZ: 16, halfWidth: 26 } as const;

export type V3 = readonly [number, number, number];

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const unit = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** A rectangle in the world: its centre, its two in-plane unit axes (`u` along the width, `v` up the height), its unit normal and its half sizes. */
export interface WorldRect {
  readonly centre: V3;
  readonly u: V3;
  readonly v: V3;
  readonly n: V3;
  readonly halfW: number;
  readonly halfH: number;
}

/**
 * Where the painted skin stands the plate, from the near default camera's position and look-at in the world (`layPainted`'s arithmetic): 80 units down the view line, a turn about the vertical axis to face
 * the camera's position (`atan2(cam.x - at.x, cam.z - at.z)`), the roll in its own plane, scale 1.8.
 */
export function plateRect(cam: V3, look: V3): WorldRect {
  const aim = unit(sub(look, cam));
  const centre: V3 = [cam[0] + aim[0] * PLATE.distance, cam[1] + aim[1] * PLATE.distance, cam[2] + aim[2] * PLATE.distance];
  const yaw = Math.atan2(cam[0] - centre[0], cam[2] - centre[2]);
  const [cy, sy] = [Math.cos(yaw), Math.sin(yaw)];
  const [cz, sz] = [Math.cos(PLATE.roll), Math.sin(PLATE.roll)];
  // three.js's Euler XYZ with x = 0 is the roll about z first, then the turn about y. Local x (1,0,0) -> (cz, sz, 0) and local y (0,1,0) -> (-sz, cz, 0), each then turned about y; local z is only turned.
  const turn = (x: number, y: number, z: number): V3 => [x * cy + z * sy, y, -x * sy + z * cy];
  return {
    centre,
    u: turn(cz, sz, 0),
    v: turn(-sz, cz, 0),
    n: turn(0, 0, 1),
    halfW: (PLATE.width * PLATE.scale) / 2,
    halfH: (PLATE.width * PLATE.scale) / PLATE.aspect / 2,
  };
}

/**
 * Where the painted skin lays the deck, from the party's three slots in the world (`layPainted`'s arithmetic): its near edge stands 0.5 beyond the nearest slot's x, on the floor the party stands on (their mean
 * y), centred on their mean z, turned a quarter so its length runs along x. The rectangle is horizontal (its normal is up), `u` along the world's x and `v` along its z.
 */
export function deckRect(slots: readonly V3[]): WorldRect {
  const n = slots.length;
  const nearest = Math.min(...slots.map((s) => s[0]));
  const y = slots.reduce((s, p) => s + p[1], 0) / n;
  const z = slots.reduce((s, p) => s + p[2], 0) / n;
  const x0 = nearest + 0.5;
  // Under the quarter turn local (x, z) is world (z, -x): the length (local z, from edgeZ to nearZ) lies along world x, the width (local x) along world z.
  const lo = x0 + DECK.edgeZ;
  const hi = x0 + DECK.nearZ;
  return { centre: [(lo + hi) / 2, y, z], u: [1, 0, 0], v: [0, 0, 1], n: [0, 1, 0], halfW: (hi - lo) / 2, halfH: DECK.halfWidth };
}
