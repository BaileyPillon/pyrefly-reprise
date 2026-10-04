/**
 * The Cloudflare half of `tools/deploy-pages.mjs --host=cloudflare`: the login check, the gate on
 * what would be uploaded, and the publish-then-verify step, for both kinds (Workers static assets
 * and Pages). The rest of the pipeline (build, hashing, decode checks, review plan, release gate,
 * owner override, the records) is deploy-pages.mjs itself and is the same for every host.
 *
 * Every side effect (running wrangler, reading files, fetching, sleeping, logging, exiting) goes
 * through `deps`, so tests/unit/deploy-cloudflare.test.ts drives the whole flow with fakes: no
 * network, no account, no wrangler. `deps.fail` must not return (the deploy's `fail` exits the
 * process; the tests' throws).
 *
 * What this file never does: run `wrangler login`, create or read a token, create an account, or
 * pass wrangler's `--temporary` flag (a throwaway account). A missing login stops the deploy
 * before wrangler is asked to deploy anything. wrangler is always spawned with stdin closed, so it
 * is never interactive: no prompt (a project, a workers.dev name, "install Cloudflare skills for
 * your coding agents") can appear or be answered by accident. Game case: both (delivery tooling).
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import { verifyLive } from './artifact-manifest.mjs';
import { HOSTS, checkUploadLimits, compareUploadSet, listUploadFiles, siteNameFor } from './deploy-host.mjs';
import {
  WRANGLER_STDIO,
  buildPagesDeployArgs,
  buildPagesProjectCreateArgs,
  buildWranglerDeployArgs,
  parsePagesProjectNames,
  parseWhoami,
  parseWranglerOutput,
  pickDeployEntry,
  pickDeployedUrls,
  resolveWranglerBin,
  wranglerEnv,
  wranglerMessage,
} from './deploy-wrangler.mjs';

const MIB = 1024 * 1024;
const BUNDLE_ATTEMPTS = 6;
const ARTIFACT_ATTEMPTS = 4;
const RETRY_WAIT_MS = 30_000;

export const NOT_LOGGED_IN =
  'there is no Cloudflare login. Bailey logs in himself, once: `npx wrangler login` in the repo root, then approving it in the browser. '
  + 'Agents never create an account, enter credentials or approve a login. (wrangler will offer a throwaway `--temporary` account when it is not logged in: that creates an account and is never used here.)';

/** The real dependencies, overridden one by one by `deps`. */
function withDeps(deps = {}) {
  return {
    spawnSync,
    existsSync,
    readFileSync,
    removeDir: (path) => rmSync(path, { recursive: true, force: true }),
    removeFile: (path) => rmSync(path, { force: true }),
    list: listUploadFiles,
    verifyLive,
    fetchImpl: fetch,
    env: process.env,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    tmpFile: () => join(tmpdir(), `pyrefly-wrangler-${process.pid}-${Date.now()}.ndjson`),
    log: (message) => console.log(`[deploy] ${message}`),
    fail: (message) => {
      console.error(`[deploy] FAIL: ${message}`);
      process.exit(1);
    },
    ...deps,
  };
}

/**
 * Before anything slow runs: is there a Cloudflare login? `wrangler whoami --json` exits non-zero
 * when there is none. Only the answer and the number of accounts are used; the email and account
 * ids in its output are never printed or kept.
 */
export function checkCloudflareLogin({ root, deps } = {}) {
  const d = withDeps(deps);
  const bin = resolveWranglerBin(root, d.existsSync, d.env);
  if (!bin.ok) return d.fail(bin.error);
  const res = d.spawnSync(process.execPath, [bin.bin, 'whoami', '--json'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: wranglerEnv(d.env),
    shell: false,
    timeout: 120_000,
  });
  if (res.error) return d.fail(`could not run wrangler: ${res.error.message}`);
  const who = parseWhoami(res.status, res.stdout);
  if (!who.loggedIn) return d.fail(NOT_LOGGED_IN);
  d.log(`Cloudflare login: ok (${who.accounts} account(s) visible)`);
  if (who.accounts > 1 && !d.env.CLOUDFLARE_ACCOUNT_ID) {
    d.log('WARNING: this login sees more than one account; if wrangler cannot choose one without a terminal, set CLOUDFLARE_ACCOUNT_ID to the account to deploy to');
  }
  return who;
}

/**
 * The gate on what would be uploaded, run on the finished dist-release (after `artifact-manifest.json`
 * is written into it). The throwaway `dist-release/.git` (Vite keeps it, the GitHub deploy recreates
 * it) is removed first: a Workers upload would send it, proved with a 26 MiB file hidden there. Then
 * the files wrangler would send for this kind must fit the limits and equal the artifact manifest
 * exactly, or the live byte check could never match. Returns the limits report; fails the deploy
 * otherwise.
 */
export function prepareCloudflareUpload({ dist, manifest, manifestName, kind = 'workers', deps } = {}) {
  const d = withDeps(deps);
  const gitDir = join(dist, '.git');
  if (d.existsSync(gitDir)) {
    d.log('removing dist-release/.git, the throwaway repo the GitHub deploy leaves (a Workers upload would send it)');
    d.removeDir(gitDir);
  }
  const { files, configFiles } = d.list(dist, kind);
  const problems = [];
  if (configFiles.length) {
    problems.push(`dist-release holds ${configFiles.join(', ')}: Cloudflare reads those as configuration and never serves them, so the live check could not match them (not supported yet)`);
  }
  const limits = checkUploadLimits(files);
  problems.push(...limits.problems);
  const { unlisted, missing } = compareUploadSet(files, manifest.files, manifestName);
  if (unlisted.length) problems.push(`${unlisted.length} file(s) would be uploaded that the artifact manifest does not list, e.g. ${unlisted.slice(0, 3).join(', ')}`);
  if (missing.length) problems.push(`${missing.length} file(s) the artifact manifest lists would not be uploaded, e.g. ${missing.slice(0, 3).join(', ')}`);
  if (problems.length) {
    for (const problem of problems) d.log(`  ${problem}`);
    return d.fail(`dist-release is not fit for the Cloudflare upload (${problems.length} problem(s) above); nothing was uploaded`);
  }
  const top = limits.largest[0];
  d.log(`upload set ok: ${limits.fileCount} files, ${(limits.totalBytes / MIB).toFixed(1)} MiB, largest ${top ? `${top.path} at ${(top.bytes / MIB).toFixed(2)} MiB` : 'none'}`);
  return limits;
}

/** Wait until the address serves the index.html of THIS build (the bundle name in it matches). */
async function waitForBundle(d, url, bundleHash) {
  let lastHash = null;
  let lastStatus = null;
  for (let attempt = 1; attempt <= BUNDLE_ATTEMPTS; attempt++) {
    try {
      const res = await d.fetchImpl(url, { redirect: 'follow' });
      lastStatus = res.status;
      const match = (await res.text()).match(/assets\/index-([\w-]+)\.js/);
      lastHash = match ? match[1] : null;
      if (res.status === 200 && lastHash === bundleHash) return;
    } catch (err) {
      d.log(`fetch attempt ${attempt} failed: ${err.message}`);
    }
    d.log(`attempt ${attempt}/${BUNDLE_ATTEMPTS}: ${url} serves bundle ${lastHash ?? '(none)'} vs local ${bundleHash}${attempt < BUNDLE_ATTEMPTS ? ', retrying in 30s' : ''}`);
    if (attempt < BUNDLE_ATTEMPTS) await d.sleep(RETRY_WAIT_MS);
  }
  return d.fail(`${url} never served the built bundle (local ${bundleHash}, last seen ${lastHash}, last http status ${lastStatus})`);
}

/** Download from the address and compare bytes with the manifest (critic check CHK-017). A 200 is not a pass; identical bytes are. */
async function waitForArtifact(d, manifest, url, { changed, full }) {
  let result = null;
  for (let attempt = 1; attempt <= ARTIFACT_ATTEMPTS; attempt++) {
    result = await d.verifyLive(manifest, url, { changed, full });
    d.log(`live artifact check ${attempt}/${ARTIFACT_ATTEMPTS} at ${url}: ${result.result} (${result.checked} files compared, manifest ${result.liveManifest})`);
    if (result.result === 'PASS') return result;
    if (attempt < ARTIFACT_ATTEMPTS) await d.sleep(RETRY_WAIT_MS);
  }
  const bad = [...result.mismatched, ...result.missing, ...result.wrongType, ...result.errors].slice(0, 20);
  for (const line of bad) d.log(`  ${line}`);
  return d.fail(`${url} does not serve this exact artifact (${result.result}): see the files above`);
}

/**
 * Pages only: the project has to exist before the first deploy (a non-interactive wrangler will not
 * create it). Lists the account's projects; when it is missing, creates it only with
 * `--create-project`, else stops and says how. The create call carries the hidden `--force`, which
 * keeps an agent-run wrangler from converting it into a Workers deploy of this directory.
 */
function ensurePagesProject(d, { run, project, productionBranch, create }) {
  const listed = run(['pages', 'project', 'list', '--json'], { capture: true });
  if (listed.error) return d.fail(`could not run wrangler: ${listed.error.message}`);
  if (listed.status !== 0) return d.fail(`could not list the Pages projects (exit ${listed.status}); is the Cloudflare login still good? (npx wrangler whoami)`);
  const names = parsePagesProjectNames(listed.stdout);
  if (names === null) return d.fail('could not read the list of Pages projects from wrangler');
  if (names.includes(project)) {
    d.log(`Pages project ${project} exists`);
    return;
  }
  if (!create) {
    return d.fail(`the Pages project ${project} does not exist in this account yet. Run the same command with --create-project to create it (wrangler pages project create ${project} --production-branch ${productionBranch} --force), or create it yourself once`);
  }
  d.log(`creating the Pages project ${project} (production branch ${productionBranch})`);
  const created = run(buildPagesProjectCreateArgs({ projectName: project, productionBranch }));
  if (created.error) return d.fail(`could not run wrangler: ${created.error.message}`);
  if (created.status !== 0) return d.fail(`creating the Pages project ${project} failed (exit ${created.status}) — see output above; nothing was uploaded`);
}

/**
 * Upload dist-release to Cloudflare, then prove the address serves this exact artifact.
 *   workers  wrangler's own local check (`deploy --dry-run`), then the real `deploy` of the
 *            assets-only Worker named for the run (the preview Worker for a preview).
 *   pages    the project is ensured first, then `pages deploy` to its production branch, or to the
 *            preview branch for a preview.
 * The output file wrangler writes names the address(es); each is checked for this build's bundle and
 * then byte for byte. Returns `{ kind, siteName, versionId, urls, liveUrl, liveArtifact }`; every
 * failure goes through `fail`.
 */
export async function publishToCloudflare({
  root, dist = join(root, 'dist-release'), kind = HOSTS.cloudflare.kind, preview = false, createProject = false,
  mainSha, bundleHash, isoNow, extraMessage = '', manifest, changedShipped = [], fullVerify = false,
  host = HOSTS.cloudflare, deps,
} = {}) {
  const d = withDeps(deps);
  const bin = resolveWranglerBin(root, d.existsSync, d.env);
  if (!bin.ok) return d.fail(bin.error);
  const site = siteNameFor(host, kind, preview);
  const message = wranglerMessage({ mainSha, isoNow, preview, extra: extraMessage });
  const run = (args, { outputFile = null, capture = false } = {}) => d.spawnSync(process.execPath, [bin.bin, ...args], {
    cwd: root,
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : WRANGLER_STDIO,
    encoding: 'utf8',
    env: wranglerEnv(d.env, { outputFile }),
    shell: false,
  });

  let deployArgs;
  let where;
  if (kind === 'pages') {
    const branch = preview ? host.pagesPreviewBranch : host.pagesProductionBranch;
    ensurePagesProject(d, { run, project: site, productionBranch: host.pagesProductionBranch, create: createProject });
    deployArgs = buildPagesDeployArgs({ dist, projectName: site, branch, commitHash: mainSha, commitMessage: message });
    where = `the Cloudflare Pages project ${site}, branch ${branch}`;
  } else {
    deployArgs = buildWranglerDeployArgs({
      configPath: join(root, ...host.wranglerConfig.split('/')), workerName: site, message, tag: mainSha,
    });
    d.log("wrangler's own local check of dist-release (deploy --dry-run: nothing is uploaded)");
    const dry = run([...deployArgs, '--dry-run']);
    if (dry.error) return d.fail(`could not run wrangler: ${dry.error.message}`);
    if (dry.status !== 0) return d.fail(`wrangler's local check failed (exit ${dry.status}) — see output above; nothing was uploaded`);
    where = `the Cloudflare worker ${site}`;
  }

  const outputFile = d.tmpFile();
  d.log(`publishing dist-release to ${where}${preview ? ' (PREVIEW)' : ''}`);
  const res = run(deployArgs, { outputFile });
  if (res.error) return d.fail(`could not run wrangler: ${res.error.message}`);
  if (res.status !== 0) {
    return d.fail(
      `wrangler ${kind === 'pages' ? 'pages deploy' : 'deploy'} failed (exit ${res.status}) — see output above; nothing was verified or recorded. `
      + (kind === 'pages' ? '' : 'A new account has to register its workers.dev name once in the dashboard (wrangler prints the link). ')
      + 'An interrupted upload is safe to repeat: wrangler skips the files Cloudflare already holds.',
    );
  }

  let text;
  try {
    text = d.readFileSync(outputFile, 'utf8');
  } catch (err) {
    return d.fail(`wrangler finished but left no output file (${outputFile}): ${err.message}`);
  }
  d.removeFile(outputFile);
  const { entries, malformed } = parseWranglerOutput(text);
  if (malformed) d.log(`note: ${malformed} unreadable line(s) in wrangler's output file were skipped`);
  const entry = pickDeployEntry(entries, site, kind);
  if (!entry) return d.fail(`wrangler's output file has no deploy entry for ${site}, so the deploy cannot be verified`);
  const urls = pickDeployedUrls(entry);
  if (!urls.length) {
    return d.fail(`wrangler reported no address for ${site} (${JSON.stringify(entry.targets ?? entry.url ?? null)}); ${kind === 'pages' ? 'the project has no .pages.dev address' : `the workers.dev address must be on (workers_dev in ${host.wranglerConfig})`}`);
  }
  const versionId = entry.version_id ?? entry.deployment_id ?? null;
  d.log(`deployed ${site}${versionId ? ` (${versionId})` : ''} at ${urls.join(', ')}`);

  let liveArtifact = null;
  for (const url of urls) {
    d.log(`verifying ${url}`);
    await waitForBundle(d, url, bundleHash);
    d.log(`${url} matches bundle ${bundleHash}`);
    liveArtifact = await waitForArtifact(d, manifest, url, { changed: changedShipped, full: fullVerify });
    d.log(`${url} serves artifact ${manifest.artifactHash.slice(0, 16)} byte for byte (${liveArtifact.checked} files compared)`);
  }
  // Pages lists this exact deployment first and its stable .pages.dev alias last: the alias is the address people use.
  return { kind, siteName: site, versionId, urls, liveUrl: kind === 'pages' ? urls[urls.length - 1] : urls[0], liveArtifact };
}
