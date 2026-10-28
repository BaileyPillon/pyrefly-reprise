/** Types for `tools/lock-atomic.mjs`: the two atomic moves every writer of the review-browser lock uses. */
export declare const TAKEOVER_STALE_MS: number;
/** Create `file` holding `text` with an exclusive open: true when it is ours, false when it exists (or is busy); any other error throws. */
export declare function createExclusive(file: string, text: string): boolean;
/** The age in ms of a file by its own mtime (a lock nobody can read), or null when it is gone. */
export declare function unreadableAge(file: string): number | null;
/** Replace the lock at `file` with `text` in one rename, only if `stillStale()` still says so inside the takeover mutex; false when it is not stale, another taker is mid-move, or the move failed. */
export declare function replaceIfStale(file: string, text: string, stillStale: () => boolean): boolean;
