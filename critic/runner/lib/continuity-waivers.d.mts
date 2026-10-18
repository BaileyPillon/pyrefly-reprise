/** Types for `critic/runner/lib/continuity-waivers.mjs`, so the unit tests can import it. */
export interface WaiverRow { subject: string; pose: string; sha?: string; reason?: string; words?: string; date?: string; legacy?: boolean }
export interface PoseWaivers { path: string; count: number; rows: Map<string, WaiverRow[]> }
export interface Waiver { reason: string; words: string; date: string | null; legacy: boolean; shaChecked: boolean }
export declare function loadPoseWaivers(path: string | null | undefined): PoseWaivers | { path: string; error: string } | null;
export declare function waiverFor(waivers: PoseWaivers | { path: string; error: string } | null | undefined, anchors: { subject?: string | null; pose?: string | null; sha?: string | null } | null | undefined): Waiver | null;
