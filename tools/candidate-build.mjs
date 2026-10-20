#!/usr/bin/env node
/**
 * **The one way a review builds its production candidate** (both games; delivery and critic tooling, no gameplay; decision 134 of the release 55 live check, Bailey's rule that the
 * reviewed bundle is the deployed bundle; the base path and the checks below are the finding of the release 60 live check).
 *
 * The deploy builds with the release name of the newest player note (`npm run deploy -- --release=<name>` -> `PYREFLY_RELEASE`, `tools/build-stamp.mjs`) AND the base of the host it
 * publishes to (`BASE_PATH=/` for Cloudflare, `tools/deploy-host.mjs`); both are part of the bundle (the title's build number, every asset address). A candidate built with a bare
 * `vite build` carries neither, and one that carried only the release name (the first version of this tool) still had vite's own default base `/pyrefly-reprise/`, so release 60's
 * reviewed `index-CXbIrsG6.js` was not the deployed `index-DwCdr0nf.js` and its review could not settle. The environment of both builds now comes from one function
 * (`tools/release-build.mjs` `releaseBuildEnv`), so they cannot drift:
 *
 *   node tools/candidate-build.mjs [--root DIR] [--out dist-gate] [--release NAME] [--dry-run]
 *   node tools/candidate-build.mjs --serve [--root DIR] [--out dist-gate] --port 5420
 *
 *   --root     the candidate's tree (default: this repository); its newest player note names the release
 *   --out      the output folder, relative to the root (default `dist-gate`; the release step's smoke build uses `dist-smoke`)
 *   --release  optional; when given it must be the newest note's name, exactly as the deploy refuses otherwise
 *   --dry-run  print the release, the build inputs of this candidate and of the deploy, and the command; build nothing; exit 1 if the two would differ
 *   --serve    serve a built candidate with `vite preview` (BASE_PATH set for it, which a bare `vite preview` does not do, and which Git Bash turns into a Windows path), in the
 *              background: prints `pid` and `url`; stop it by that PID. Exits 1 if the page is not answering within 30 seconds.
 *   --port     the preview's port (required with --serve; the runners use 5400 to 5990)
 *
 * Before the build it checks that the art manifest is current (`tools/gen/manifest.mjs --check`; the deploy regenerates it, so a stale one would ship different art). After it runs the
 * checks the deploy runs on its own output: index.html is made for the host's base (`checkBuildBase`) and `public/fx` shipped intact (`tools/fx-assets.mjs verify`). It then
 * prints the bundle: **record that name as `build.bundle` in the review report**, so `critic-clear` can compare it with the deployed one.
 *
 * The runner scripts (`critic/runner/focused.js`, `deep.js`, `release.js`) and the runner's self-test call it instead of `vite build`; `tests/unit/candidate-build.test.ts` holds that.
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { RELEASE_ENV, isReleaseName } from './build-stamp.mjs';
import { DEFAULT_HOST, HOSTS, checkBuildBase } from './deploy-host.mjs';
import { loadReleaseNotes } from './release-notes.mjs';
import { bundleInputs, diffBundleInputs, formatBundleInputs, inheritedBuildEnv, releaseBuildEnv, releaseViteArgs } from './release-build.mjs';

/** The default output folder of a review candidate. */
export const CANDIDATE_OUT = 'dist-gate';

/** The host a candidate is built for: the default host, the one a production deploy goes to (and so the base it serves from). */
export const CANDIDATE_HOST = HOSTS[DEFAULT_HOST];

/** Where the deploy keeps the maps of a build; named here only so the comparison with the deploy's environment has the same shape. Neither changes a byte that ships. */
const DEPLOY_SOURCEMAP_FOLDER = 'D:/Tools/pyrefly-sourcemaps/<commit>';

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

/**
 * The environment a candidate build runs in: this one with the release name and the host's base set (an inherited `PYREFLY_RELEASE` or `BASE_PATH` never wins), and no
 * source-map folder. The same function the deploy calls, with the same host. Pure.
 */
export function candidateBuildEnv(release, env = process.env) {
  return releaseBuildEnv({ release, host: CANDIDATE_HOST, sourceMapDir: null, env });
}

/** The vite arguments of a candidate build. Pure. */
export function candidateViteArgs(out = CANDIDATE_OUT) {
  return releaseViteArgs(out);
}

/**
 * What the deploy would build with for this release, from the same shell: its environment through the same function, for the default host, with its source-map folder. Pure.
 * `tools/deploy-pages.mjs` calls `releaseBuildEnv` with exactly these arguments (`tests/unit/release-build.test.ts` reads its source to hold that).
 */
export function deployBuildEnvFor(release, env = process.env) {
  return releaseBuildEnv({ release, host: CANDIDATE_HOST, sourceMapDir: DEPLOY_SOURCEMAP_FOLDER, env });
}

/**
 * The inputs on which this candidate and the deploy would differ, and what this shell sets that only one of them could not match. Pure.
 * @returns {{ candidate: ReturnType<typeof bundleInputs>, deploy: ReturnType<typeof bundleInputs>, differences: { key: string, a: unknown, b: unknown }[], inherited: string[] }}
 */
export function compareWithDeploy(release, env = process.env) {
  const candidate = bundleInputs(candidateBuildEnv(release, env));
  const deploy = bundleInputs(deployBuildEnvFor(release, env));
  return { candidate, deploy, differences: diffBundleInputs(candidate, deploy), inherited: inheritedBuildEnv(env) };
}

/** The environment of a candidate's preview server: `vite preview` takes its base from `BASE_PATH` like the build, so it needs the build's. Pure. */
export function candidatePreviewEnv(env = process.env) {
  const out = { ...env, BASE_PATH: CANDIDATE_HOST.base };
  delete out[RELEASE_ENV];
  return out;
}

/** The vite arguments that serve a built candidate on `port`, on this machine only, failing rather than moving to another port. Pure. */
export function candidatePreviewArgs(outDir, port) {
  return ['preview', '--outDir', outDir, '--port', String(port), '--strictPort', '--host', '127.0.0.1'];
}

/** The address a served candidate answers on: the host's base under the preview's port. Pure. */
export function candidateUrl(port) {
  return `http://127.0.0.1:${port}${CANDIDATE_HOST.base}`;
}

/** The bundle a built index.html loads (`index-<hash>.js`), as the deploy reads it; null if it loads none. */
export function bundleOfIndexHtml(html) {
  const match = html.match(/assets\/(index-[\w-]+\.js)/);
  return match ? match[1] : null;
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

/**
 * A tool of the candidate's tree, run by its real path (a junction or link would make the tool think it was imported, not run). A tree that has no such tool is skipped:
 * the deploy of that tree would not run it either.
 */
function runTool(root, rel, toolArgs) {
  const script = join(root, rel);
  if (!existsSync(script)) return { status: 0, skipped: rel };
  return spawnSync(process.execPath, [realpathSync(script), ...toolArgs], { cwd: root, encoding: 'utf8' });
}

async function serve(root, out, port) {
  if (!/^[0-9]{2,5}$/.test(String(port))) {
    console.error('candidate-build: --serve needs --port <number> (the runners use 5400 to 5990)');
    return 1;
  }
  const dir = resolve(root, out);
  const indexPath = join(dir, 'index.html');
  if (!existsSync(indexPath)) {
    console.error(`candidate-build: nothing to serve: ${indexPath} does not exist (build it first: node tools/candidate-build.mjs --out ${out})`);
    return 1;
  }
  const html = readFileSync(indexPath, 'utf8');
  const problems = checkBuildBase(html, CANDIDATE_HOST.base);
  if (problems.length) {
    for (const p of problems) console.error(`candidate-build: ${p}`);
    console.error(`candidate-build: ${dir} is not built for ${CANDIDATE_HOST.label} (base ${CANDIDATE_HOST.base}): rebuild it with this tool before serving it`);
    return 1;
  }
  const bundle = bundleOfIndexHtml(html);
  const bin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  const child = spawn(process.execPath, [bin, ...candidatePreviewArgs(dir, port)], { cwd: root, env: candidatePreviewEnv(), detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  let exited = false;
  child.on('exit', () => { exited = true; });
  const url = candidateUrl(port);
  const until = Date.now() + 30000;
  while (Date.now() < until && !exited) {
    try {
      const res = await fetch(url);
      const text = res.status === 200 ? await res.text() : '';
      // the answer must be this candidate's page: a strictPort refusal leaves the port to whoever held it
      if (res.status === 200 && bundleOfIndexHtml(text) === bundle) {
        console.log(`candidate-build: serving ${dir} (bundle ${bundle}) with BASE_PATH=${CANDIDATE_HOST.base}`);
        console.log(`candidate-build: url ${url}`);
        console.log(`candidate-build: pid ${child.pid} (stop it by this PID, never by image name; confirm the port is closed afterwards)`);
        return 0;
      }
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  if (!exited && child.pid) {
    try { process.kill(child.pid); } catch { /* already gone */ }
  }
  console.error(`candidate-build: ${url} did not answer with this candidate's page within 30 s (port ${port} may be taken; pick another)`);
  return 1;
}

async function main(argv) {
  const root = resolve(arg(argv, '--root', resolve(fileURLToPath(new URL('..', import.meta.url)))));
  const out = arg(argv, '--out', CANDIDATE_OUT);
  if (argv.includes('--serve')) return serve(root, out, arg(argv, '--port', ''));
  const decided = decideCandidateRelease({ newest: await newestReleaseOf(root), requested: arg(argv, '--release') });
  if (!decided.ok) {
    console.error(`candidate-build: ${decided.error}`);
    return 1;
  }
  const bin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  const args = candidateViteArgs(out);
  const compared = compareWithDeploy(decided.release);
  console.log(`candidate-build: release ${decided.release} (the newest player note), ${RELEASE_ENV}=${decided.release} BASE_PATH=${CANDIDATE_HOST.base} node ${bin} ${args.join(' ')} in ${root}`);
  console.log(`candidate-build: build inputs of this candidate: ${formatBundleInputs(compared.candidate).join('; ')}`);
  if (compared.differences.length) {
    for (const d of compared.differences) console.error(`candidate-build: DIFFERS from the deploy in ${d.key}: candidate ${JSON.stringify(d.a)}, deploy ${JSON.stringify(d.b)}`);
    console.error('candidate-build: this candidate would not be the bundle the deploy publishes; fix tools/release-build.mjs before reviewing anything');
    return 1;
  }
  console.log(`candidate-build: the deploy (${CANDIDATE_HOST.label}, base ${CANDIDATE_HOST.base}) builds with the same inputs`);
  for (const set of compared.inherited) {
    console.warn(`candidate-build: WARNING ${set} is set in this shell. The deploy reads it from ITS shell, so the two match only if that shell sets the same value; the review report should say so`);
  }
  if (argv.includes('--dry-run')) return 0;

  // What the deploy does to the art before it builds, read-only: it regenerates the manifest, so a stale one would ship different art than this candidate.
  const manifest = runTool(root, join('tools', 'gen', 'manifest.mjs'), ['--check', '--quiet', '--root', join(root, 'public', 'art')]);
  if (manifest.status !== 0) {
    console.error(`candidate-build: the art manifest is not current (${(manifest.stderr || manifest.stdout || '').trim()}): the deploy regenerates it (node tools/gen/manifest.mjs) and would ship different art than this candidate`);
    return 1;
  }

  const built = spawnSync(process.execPath, [bin, ...args], { cwd: root, env: candidateBuildEnv(decided.release), stdio: 'inherit' });
  if (built.status !== 0) return built.status ?? 1;

  // The checks the deploy runs on its own output, so a candidate that fails one is not the build the deploy would publish.
  const dist = resolve(root, out);
  const indexPath = join(dist, 'index.html');
  if (!existsSync(indexPath)) {
    console.error(`candidate-build: the build did not produce ${indexPath}`);
    return 1;
  }
  const html = readFileSync(indexPath, 'utf8');
  const problems = checkBuildBase(html, CANDIDATE_HOST.base);
  if (problems.length) {
    for (const p of problems) console.error(`candidate-build: ${p}`);
    console.error(`candidate-build: the build is not made for the base ${CANDIDATE_HOST.base} that ${CANDIDATE_HOST.label} serves from`);
    return 1;
  }
  const fx = runTool(root, join('tools', 'fx-assets.mjs'), ['verify', '--dir', join(dist, 'fx')]);
  if (fx.status !== 0) {
    console.error(`candidate-build: public/fx did not ship intact (${(fx.stderr || fx.stdout || '').trim()}): the deploy restores it from the backup first, so this candidate is not the build it would publish`);
    return 1;
  }
  const bundle = bundleOfIndexHtml(html);
  const skipped = [manifest.skipped, fx.skipped].filter(Boolean);
  console.log(`candidate-build: base ok (index.html loads ${CANDIDATE_HOST.base}assets/index-*.js), ${fx.skipped ? 'public/fx not checked' : 'public/fx intact'}, ${manifest.skipped ? 'art manifest not checked' : 'art manifest current'}${skipped.length ? ` (this tree has no ${skipped.join(' or ')})` : ''}`);
  console.log(`candidate-build: bundle ${bundle ?? '(none found)'}: record it as build.bundle in the review report; critic-clear compares it with the deployed bundle`);
  return bundle ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (err) => {
    console.error(`candidate-build: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
