/** Types for `tools/rig/lane/lane-lock.mjs`: the rig lane recorder's lock, taken atomically. */
export declare function takeLaneLock(o: { lock: string; text: string; pid?: number; ppid?: number; isAlive?: (pid: number) => boolean; graceMs?: number; tries?: number }): void;
