/** Types for `tools/measure/setup.mjs`. */
export interface SetupStep { hp?: { who: string; set?: number; fraction?: number }; quiet?: string; eval?: string }
export declare const SLIVER_HP: number;
export declare function hpWarnings(step: { who: string; set?: number; fraction?: number }, result: unknown): string[];
export declare function applySetup(page: any, steps: SetupStep[] | undefined): Promise<Array<{ step: SetupStep; result: unknown; warnings: string[] }>>;
