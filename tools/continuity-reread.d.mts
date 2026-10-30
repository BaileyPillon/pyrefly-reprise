/** Types for `tools/continuity-reread.mjs` (held-chapters lane: the two pure readers, so the unit tests can import them). */
export interface RereadJerk { n: number; px: number; part: string; figure: string; fi: number; atSwap: boolean; commonMode?: boolean; covered?: boolean; smeared?: unknown; stagedExcused?: boolean; dissolveTravel?: unknown }
export interface RereadSwap { fi: number; fromPose: string; toPose: string; n: number; startFrame: number; smear?: unknown; hardCut?: boolean; blendFrames?: number; figurePx?: number | null }
export interface RereadResult { jerks: RereadJerk[]; swaps: RereadSwap[]; summary?: { battleSeconds?: number } }
export declare function gatedSwapJerks(res: Pick<RereadResult, 'jerks'>): RereadJerk[];
export declare function plannedCutJerks(res: RereadResult, min?: number): { rows: Array<{ jerk: RereadJerk; swap: RereadSwap; excused: boolean }>; perMinute: number | null };
export declare function folderFetcher(artDir: string): (url: string) => Promise<Buffer>;
export declare function reread(rawFile: string, opt?: Record<string, unknown>): Promise<{ meta: unknown; records: unknown[]; res: RereadResult & Record<string, unknown>; notes: string[]; cfg: unknown; measure: unknown }>;
