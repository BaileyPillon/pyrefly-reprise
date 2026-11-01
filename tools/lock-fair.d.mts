/** Types for `tools/lock-fair.mjs`: the fair stale rule for the review-browser lock and its reservation, and the heartbeat that keeps a live holder or waiter off it. */
export declare const STALE_MINUTES: number;
export interface LockRecord { who?: string; pid?: number; at?: string; since?: string; maxMinutes?: number; [k: string]: unknown }
/** Is there a process with this id? Anything that is not a positive integer is not a process. */
export declare function pidAlive(pid: unknown): boolean;
/** The lock file: its parsed record (null when unreadable or not a record) and its mtime; null when there is no file. */
export declare function readLockFile(file: string): { held: LockRecord | null; mtimeMs: number } | null;
/** Stale only when the record's pid is not running, or the file has not been written to for `staleMs` by its mtime. */
export declare function staleVerdict(o: { held: LockRecord | null; mtimeMs: number; now?: number; staleMs?: number; isAlive?: (pid: number) => boolean }): { stale: boolean; why: 'pid-gone' | 'no-heartbeat' | null; idleMs: number };
/** One beat: rewrite the file with a fresh `at`, only while it still names `record.pid`; false when it is another process's, gone, or a taker holds the mutex. */
export declare function refreshOwn(file: string, record: LockRecord & { pid: number }): boolean;
/** Beat the file every `everyMs` for at most `forMs`; returns the function that stops it. The timer does not keep the process alive. */
export declare function startHeartbeat(file: string, record: LockRecord & { pid: number }, o?: { everyMs?: number; forMs?: number }): () => void;
