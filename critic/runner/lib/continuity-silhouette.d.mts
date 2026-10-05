/** Types for `critic/runner/lib/continuity-silhouette.mjs`, so the unit tests can import it. */
import type { Anchors, Mask } from './continuity-pure.mjs';

export interface DecodedMask extends Mask { srcW: number; srcH: number }
export interface PoseMeasure { path: string; sha256: string; subjects: Record<string, { poses: Record<string, { head?: number[]; size?: number[]; stance?: { x: number; row: number }; prone?: boolean; standing?: boolean }> }>; count: number }
export declare function decodeMask(buffer: Buffer, maxSide?: number): Promise<DecodedMask>;
export declare function bboxRows(m: Mask): { top: number; bottom: number } | null;
export declare function openMask(m: Mask, r: number): Mask;
export declare function estimateStance(m: Mask): { u: number; t: number } | null;
export declare function estimateMass(m: Mask): number | null;
export declare function loadPoseMeasure(path: string | null | undefined): PoseMeasure | null;
export declare function subjectPoseOf(url: string): { subject: string; pose: string } | null;
export declare function anchorsFor(o: { url: string; mask: DecodedMask; measure: PoseMeasure | null | undefined }): Anchors & { subject: string | null; pose: string | null };
