/** Types for `tools/art-sidecar-fields.mjs` (r47-rc, FOC46-06): the fields a shipped painting sidecar may carry. */

/** The only keys a shipped sidecar may carry: the ones the game reads. */
export const SIDECAR_FIELDS: readonly string[];
/** The JSON files under `art/` that are not painting sidecars (two manifests the game reads whole, and the build's own record). */
export const NON_SIDECAR_ART_JSON: readonly string[];
/** Is this site-relative path (`art/characters/yuna/idle.json`) a painting sidecar? */
export function isSidecarJson(rel: string): boolean;

export interface TopLevelMember {
  key: string;
  /** Offset of the key's opening quote in the text. */
  keyStart: number;
  valueStart: number;
  valueEnd: number;
}
/** The members of a JSON text's top-level object, in order. Throws a SyntaxError for text that is not JSON, a TypeError for JSON that is not an object. */
export function topLevelMembers(text: string): TopLevelMember[];

export interface SidecarProjection {
  /** The sidecar as the build writes it. */
  text: string;
  /** The keys kept, in the master's order. */
  kept: string[];
  /** The keys left out (names only, never values), in order of first appearance. */
  dropped: string[];
}
/** A sidecar's master text cut to the listed fields, each value the master's own text. Throws for text that is not a JSON object. */
export function projectSidecarText(text: string): SidecarProjection;
/** The top-level keys of a text that are not on the list, with the offset of each; `null` when the text is not a JSON object. */
export function keysOutsideList(text: string): { key: string; offset: number }[] | null;
