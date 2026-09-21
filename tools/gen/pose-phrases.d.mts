/**
 * Types for `tools/gen/pose-phrases.mjs`.
 *
 * Same arrangement as `black-frame.d.mts`. This file declares the module's
 * whole public surface — if you add an export over there, add it here too.
 */

export declare const CANON_POSE_PHRASES: Readonly<Record<string, string>>;
export declare const CANON_POSES: readonly string[];
export declare function canonPosePhrase(pose: string): string | null;
