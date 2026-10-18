/** Types for `tools/rig/rig-pose.mjs` (the rig program): keys, blends, skin, and (format v2) part states. */
export interface PartShow {
  shown: boolean;
  /** A variant's name, or null for the part's own image. */
  image: string | null;
}
/** A part state: `{ <part>: { shown, image } }` for every part. */
export type PartStates = Record<string, PartShow>;
export const STATE_FLIP: number;
export function restState(rt: Record<string, any>): PartStates;
export function keyState(rt: Record<string, any>, key: unknown): PartStates;
export function stateAt(a: PartStates, b: PartStates, t: number): PartStates;
export function sameState(a: PartStates, b: PartStates): boolean;
export function visualOf(part: Record<string, any>, state?: PartStates): Record<string, any> | null;
export const POSE_STRIDE: number;
export interface Pose {
  bones: Float64Array;
  root: number[];
}
export function restPose(rt: Record<string, any>): Pose;
export function keyPose(rt: Record<string, any>, key: unknown): Pose;
export function blendPose(a: Pose, b: Pose, t: number): Pose;
export function solve(rt: Record<string, any>, pose: Pose): { k: Float64Array; joints: Float64Array };
export function through(k: Float64Array, bone: number, x: number, y: number): [number, number];
export function skinPart(part: Record<string, any>, k: Float64Array, out: Float64Array): void;
export function boneScale(k: Float64Array, bone: number): number;
