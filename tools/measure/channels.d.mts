/** Types for `tools/measure/channels.mjs`. */
export declare const READ: () => any;
export declare const NEWLOG: (from: number) => any[];
export declare function installChannels(page: any): Promise<void>;
export declare function recordTick(stepper: { tick(read?: string): Promise<any>; ms: number }, page: any, acc: { frames: any[]; events: any[]; logLen: number; rec: boolean }): Promise<any>;
