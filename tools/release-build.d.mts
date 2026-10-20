export const BUILD_SHA_ENV: string;
export const ART_WEBP_ENV: string;
export const ART_THUMBS_ENV: string;
export const BASE_ENV: string;
export const INHERITED_BUILD_ENV: readonly string[];
export type BundleInputs = { base: string; release: string; buildSha: string; artWebp: string; artThumbs: string };
export function releaseBuildEnv(input: {
  release: string;
  host?: { base: string };
  sourceMapDir?: string | null;
  env?: NodeJS.ProcessEnv;
}): NodeJS.ProcessEnv;
export function releaseViteArgs(outDir: string): string[];
export function bundleInputs(env?: NodeJS.ProcessEnv): BundleInputs;
export function diffBundleInputs(a: BundleInputs, b: BundleInputs): { key: string; a: string; b: string }[];
export function formatBundleInputs(inputs: BundleInputs): string[];
export function inheritedBuildEnv(env?: NodeJS.ProcessEnv): string[];
