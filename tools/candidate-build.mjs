#!/usr/bin/env node
/**
 * **The one way a review builds its production candidate** (both games; delivery and critic tooling, no gameplay; decision 134 of the release 55 live check, Bailey's rule that the
 * reviewed bundle is the deployed bundle).
 *
 * The deploy stamps its build with the release name of the newest player note (`npm run deploy -- --release=<name>` -> `PYREFLY_RELEASE`, `tools/build-stamp.mjs`), and the stamp is part of
 * the bundle (the title's build number, the changelog panel). A candidate a reviewer builds with a bare `vite build` carries no release name, so the bundle it reviews is not byte-for-byte
 * the one the deploy publishes, and the review's "exact artifact" claim stops at the stamp. This tool builds the candidate the way the deploy does:
 *
 *   node tools/candidate-build.mjs [--root DIR] [--out dist-gate] [--release NAME] [--dry-run]
 *
 *   --root     the candidate's tree (default: this repository); its newest player note names the release
 *   --out      the output folder, relative to the root (default `dist-gate`; the release step's smoke build uses `dist-smoke`)
 *   --release  optional; when given it must be the newest note's name, exactly as the deploy refuses otherwise
 *   --dry-run  print the release, the environment variable and the command; build nothing
 *
 * The runner scripts (`critic/runner/focused.js`, `deep.js`, `release.js`) and the runner's self-test call it instead of `vite build`; `tests/unit/candidate-build.test.ts` holds that.
 */

import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { RELEASE_ENV, isReleaseName } from './build-stamp.mjs';
import { loadReleaseNotes } from './release-notes.mjs';

/** The default output folder of a review candidate. */
export const CANDIDATE_OUT = 'dist-gate';

/**
 * The release name a candidate is stamped with: the newest player note's. Pure.
 * @param {{ newest: string | null, requested?: unknown }} input
 * @returns {{ ok: true, release: string } | { ok: false, error: string }}
 */
export function decideCandidateRelease({ newest, requested }) {
  if (!newest || !isReleaseName(newest)) return { ok: false, error: `the newest player note names no release (${JSON.stringify(newest)}): write the note first, as the deploy requires` };
  if (typeof requested === 'string' && requested.trim() !== '' && requested.trim() !== newest) {
    return { ok: false, error: `--release=${requested.trim()} is not the newest player note (${newest}): the deploy would refuse it, so a candidate must not carry it` };
  }
  return { ok: true, release: newest };
}

/** The environment a candidate build runs in: this one with the release name set (an inherited `PYREFLY_RELEASE` never wins over the note). Pure. */
export function candidateBuildEnv(release, env = process.env) {
  return { ...env, [RELEASE_ENV]: release };
}

/** The vite arguments of a candidate build. Pure. */
export function candidateViteArgs(out = CANDIDATE_OUT) {
  return ['build', '--outDir', out, '--emptyOutDir'];
}

/** The newest note's release name of a source tree. */
export async function newestReleaseOf(root) {
  const mod = await loadReleaseNotes(root);
  return mod.newestRelease(mod.RELEASE_NOTES);
}

function arg(argv, name, fallback) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
}

async function main(argv) {
  const root = resolve(arg(argv, '--root', resolve(fileURLToPath(new URL('..', import.meta.url)))));
  const out = arg(argv, '--out', CANDIDATE_OUT);
  const decided = decideCandidateRelease({ newest: await newestReleaseOf(root), requested: arg(argv, '--release') });
  if (!decided.ok) {
    console.error(`candidate-build: ${decided.error}`);
    return 1;
  }
  const bin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  const args = candidateViteArgs(out);
  console.log(`candidate-build: release ${decided.release} (the newest player note), ${RELEASE_ENV}=${decided.release} node ${bin} ${args.join(' ')} in ${root}`);
  if (argv.includes('--dry-run')) return 0;
  const built = spawnSync(process.execPath, [bin, ...args], { cwd: root, env: candidateBuildEnv(decided.release), stdio: 'inherit' });
  return built.status ?? 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (err) => {
    console.error(`candidate-build: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
