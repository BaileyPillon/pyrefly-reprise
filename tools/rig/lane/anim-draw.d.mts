/** Types for `anim-draw.mjs` (the animation prototype's drawing helpers; the tests import `carrySkeleton`, `toGatePose` and `skinBent`). */
export interface GatePose {
  bones: Float64Array;
  root: [number, number, number];
  /** The knee's bend (radians) when the channel array is one pseudo-bone longer than the rig (pass 3). */
  bend: number;
}
export function toGatePose(ch: ArrayLike<number>, nb?: number): GatePose;
export function bendsOf(rt: Record<string, any>): Map<string, { prepare(k: Float64Array, angle: number): void; active: boolean; at(i: number, x: number, y: number, out: { x: number; y: number }): void }> | null;
export function skinBent(rt: Record<string, any>, part: Record<string, any>, k: Float64Array, pose: GatePose, out: Float64Array): void;
export function carrySkeleton(rt: unknown): {
  m: Float64Array;
  solve(pose: Float64Array): void;
  landmark(name: string, out?: { x: number; y: number }): { x: number; y: number } | null;
};
export function loadTextures(rt: unknown, dir: string): Promise<void>;
export function render(rt: unknown, pose: GatePose, frame: { W: number; H: number; sx: number; sy: number; ox: number; oy: number }): Buffer;
