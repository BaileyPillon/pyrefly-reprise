/** Types for `tools/ffxcam-table-routes.mjs`, so the unit tests (type-checked by `tsc --noEmit`) can import it. */

export type Branch = [string, number];

export interface Beat {
  phase: 'open' | 'launch';
  row: string;
  actor: string;
  slot: number | string;
  tgt: string;
  range: string;
  branches: Branch[];
}

export declare function mergeBranches(list: Branch[]): Branch[];
export declare function cellsOf(records: Array<Pick<Beat, 'actor' | 'slot' | 'tgt' | 'range' | 'branches'>>): Map<string, Branch[]>;
export declare function collapse(cells: Map<string, Branch[]>): Record<string, Branch[]>;
export declare const lookupOrder: (range: string, slot: string, target: string) => string[];
export declare function resolve(cells: Map<string, Branch[]> | Record<string, Branch[]>, range: string, slot: string, target: string): Branch[] | undefined;
export declare function isNoop(cells: Record<string, Branch[]>): boolean;
export declare function buildRows(beats: Beat[]): { rows: Record<string, { open?: string; launch?: string }>; routes: Record<string, Record<string, Branch[]>> };
