export const CANDIDATE_OUT: string;
export function decideCandidateRelease(input: { newest: string | null; requested?: unknown }): { ok: true; release: string } | { ok: false; error: string };
export function candidateBuildEnv(release: string, env?: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
export function candidateViteArgs(out?: string): string[];
export function newestReleaseOf(root: string): Promise<string | null>;
