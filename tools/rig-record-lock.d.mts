export declare const RIG_RECORD: string;
/**
 * Wait for and take the review-browser lock; resolves to the function that gives it back (only if it is still this process's own). `file: null` takes nothing.
 * A lock or reservation is stale only when its process is not running or nobody has written to it for `staleMinutes` (its holder or waiter refreshes it every `heartbeatMs`); `ownPrefix` is accepted and changes nothing.
 */
export declare function takeRigRecord(
  who: string,
  opts?: { file?: string | null; maxMinutes?: number; staleMinutes?: number; pollMs?: number; heartbeatMs?: number; ownPrefix?: string | null; log?: (m: string) => void },
): Promise<() => void>;
