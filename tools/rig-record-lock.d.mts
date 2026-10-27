export declare const RIG_RECORD: string;
/** Wait for and take the review-browser lock; resolves to the function that gives it back (only if it is still this process's own). `file: null` takes nothing. */
export declare function takeRigRecord(
  who: string,
  opts?: { file?: string | null; maxMinutes?: number; staleMinutes?: number; pollMs?: number; ownPrefix?: string | null; log?: (m: string) => void },
): Promise<() => void>;
