/** Types for `tools/measure/lock.mjs`. */
export declare const SCRATCH: string;
export declare const LOCK: string;
export declare const NEXT: string;
export declare function sleep(ms: number): Promise<void>;
export interface LockRecord { who?: string; pid?: number; what?: string; at?: string; maxMinutes?: number }
export declare function heldBy(rec: LockRecord | null, o?: { pid?: number; now?: number; isAlive?: (pid: number) => boolean }): LockRecord | null;
export declare function reservedBy(rec: LockRecord | null, o?: { pid?: number; now?: number; isAlive?: (pid: number) => boolean }): LockRecord | null;
export declare function takeBrowserLock(o: { who: string; what: string; maxMinutes?: number; maxWaitMs?: number; log?: (...a: unknown[]) => void; watchdog?: boolean }): Promise<() => void>;
