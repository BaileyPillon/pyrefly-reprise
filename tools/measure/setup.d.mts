/** Types for `tools/measure/setup.mjs`. */
export interface SetupStep { hp?: { who: string; set?: number; fraction?: number }; eval?: string }
export declare function applySetup(page: any, steps: SetupStep[] | undefined): Promise<Array<{ step: SetupStep; result: unknown }>>;
