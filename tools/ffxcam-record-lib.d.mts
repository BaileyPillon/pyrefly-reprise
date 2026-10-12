/** Types for `tools/ffxcam-record-lib.mjs` (the parts the unit tests use), so `tsc --noEmit` can type-check them. */

export declare const CAPS: { action: number; scene: number; victory: number; defeat: number; view: number };
export declare function lineupFor(actor: string, slot: number | string): string[];
export declare function targetKinds(side: 'party' | 'monster', targeting: string, slot: number | string): string[];
export declare function targetsOf(code: string, actor: string, lineup: readonly string[]): string[];
