export const CANDIDATE_OUT: string;
export const CANDIDATE_HOST: { readonly name: string; readonly label: string; readonly base: string };
export function decideCandidateRelease(input: { newest: string | null; requested?: unknown }): { ok: true; release: string } | { ok: false; error: string };
export function candidateBuildEnv(release: string, env?: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
export function candidateViteArgs(out?: string): string[];
export function deployBuildEnvFor(release: string, env?: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
export function compareWithDeploy(
  release: string,
  env?: NodeJS.ProcessEnv,
): {
  candidate: Record<string, string>;
  deploy: Record<string, string>;
  differences: { key: string; a: unknown; b: unknown }[];
  inherited: string[];
};
export function candidatePreviewEnv(env?: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
export function candidatePreviewArgs(outDir: string, port: number | string): string[];
export function candidateUrl(port: number | string): string;
export function bundleOfIndexHtml(html: string): string | null;
export function newestReleaseOf(root: string): Promise<string | null>;
