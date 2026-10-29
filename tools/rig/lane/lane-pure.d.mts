/** Types for `tools/rig/lane/lane-pure.mjs` (the lane kit): the recorder's pure parts. */
export interface Args {
  _: string[];
  [key: string]: string | true | string[];
}
export function parseArgs(argv: string[]): Args;
export const MODES: readonly string[];
export const SUBJECT_FIELDS: Readonly<Record<string, string>>;
export interface SubjectSpec {
  actor: string;
  game?: string;
  chapter: { door: string; id: string };
  poses: string[];
  castKeys?: string[];
  track: { head: string; feet: string | string[]; centroid: string; hand?: string; tip?: string };
  labels?: Record<string, string>;
  sheets?: Array<[string, string[]]>;
  /** Words the recorder adds to the page address for this subject (rigs-v2: `partyrigs=v2`). */
  query?: string;
}
export function validateSubject(id: string, spec: unknown): string[];
export function subjectSpec(registry: { subjects?: Record<string, SubjectSpec> } | undefined, id: string): SubjectSpec;
export function resolvePoses(spec: SubjectSpec, arg: string | true | undefined, o?: { any?: boolean }): string[];
export function trackerPoints(spec: SubjectSpec): { head: string; feet: string[]; centroid: string; hand: string | null; tip: string | null };
export function viteConfigText(o: { cacheDir: string; rigsDir: string; aliases?: Record<string, string> }): string;
export function lockStatus(text: string | null | undefined, alive: (pid: number) => boolean): { state: 'free' | 'held' | 'stale'; why?: string; by?: { pid: number; what?: string } };
export const GUARD_DIR: string;
export function guards(exists: (path: string) => boolean, dir?: string): string[];
export function expectedOutputs(mode: string): string[];
export const FRAME_PATTERN: readonly number[];
export function frameMs(n: number): number;
export function laneQuery(env: string | undefined, query: string | undefined): string;
