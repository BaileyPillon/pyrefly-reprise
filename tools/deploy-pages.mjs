#!/usr/bin/env node
/**
 * Build and deploy Pyrefly Reprise to GitHub Pages, in one command.
 *
 *   node tools/deploy-pages.mjs [--skip-tests] [--allow-dirty] [--dry-run]
 *                              [--message="text"] [--owner-override="words"]
 *
 * Flags:
 *   --skip-tests   skip `npx tsc --noEmit` and `npx vitest run`
 *   --allow-dirty  allow deploying even when a build-relevant path is dirty
 *                  (the dirty files are still printed as a warning)
 *   --dry-run      stop right after the dirty-tree check, printing how every
 *                  dirty path was classified — nothing is built or pushed
 *   --message=     extra free-text appended to the gh-pages commit message
 *   --claim=milestone  this deploy asks for finished-milestone acceptance
 *   --minimum=deep     raise the planned review (nothing can lower it)
 *   --owner-override="<the owner's own words>"  ship past the "no passing
 *                  deep report" refusal below. Off by default; requires at
 *                  least 8 characters of the owner's own words (a bare flag
 *                  or a too-short value is refused before anything runs).
 *                  Nothing else is relaxed — tsc/vitest, the dirty-tree check,
 *                  the artifact manifest and the byte-for-byte live
 *                  verification all still run and can still fail the deploy.
 *                  Every review obligation stays pending: an override ships
 *                  the build, it never settles a review (critic/RUBRIC.md
 *                  section 10, "Owner override of the deploy gate"). An agent
 *                  never passes this flag on its own initiative.
 *
 * Pipeline: preflight -> `vite build` into dist-release/ -> hash and
 * decode-check every shipped file into `artifact-manifest.json` -> plan the
 * review this change needs (tools/critic-plan.mjs) and refuse if it needs deep
 * evidence before deploying and none is on record -> re-init dist-release as a
 * throwaway single-commit `gh-pages` git repo and force-push it -> kick a
 * Pages build and poll it to completion -> verify that the live URL serves
 * this exact artifact, byte for byte (tools/artifact-manifest.mjs) -> append a
 * line to docs/deploys.log -> leave a `critic/pending/<mainShortSha>.json`
 * marker listing the separate review obligations this build owes.
 *
 * Owner's rule (critic/RUBRIC.md, policy v2, 2026-09-20): every deployed build
 * is evaluated, and the depth of the review follows what changed. Every run
 * (--dry-run included) starts by printing what earlier live builds still owe
 * and the review this candidate needs. Only a validated report, applied by
 * tools/critic-clear.mjs, settles an obligation; a deep review still owed by
 * the build this one replaces moves to this build's marker.
 *
 * Safe to run repeatedly: dist-release's .git is deleted and recreated every
 * run, so gh-pages always ends up with exactly one commit.
 */

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { MANIFEST_NAME, buildManifest, diffManifests, verifyLive } from './artifact-manifest.mjs';
import { applyStoredReports } from './critic-clear.mjs';
import { classifyPorcelain } from './deploy-classify.mjs';
import {
  archiveMarker,
  buildPendingMarker,
  formatPendingWarningBlock,
  readPendingMarkers,
  supersedeMarkers,
  writePendingMarker,
} from './critic-pending.mjs';
import { lastDeployedSha, planForRepo, readLedger, writeLedger } from './critic-plan.mjs';
import { loadPolicy, validateReport } from './critic-policy.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist-release');
const GH_EXE = 'D:/Tools/GitHubCLI/gh.exe';
const REPO = 'BaileyPillon/pyrefly-reprise';
const REPO_URL = `https://github.com/${REPO}.git`;
const LIVE_URL = 'https://baileypillon.github.io/pyrefly-reprise/';
const LOG_PATH = join(ROOT, 'docs', 'deploys.log');
const PENDING_DIR = join(ROOT, 'critic', 'pending');
const CLEARED_DIR = join(ROOT, 'critic', 'cleared');
const ARTIFACTS_DIR = join(ROOT, 'critic', 'artifacts');

/** A validated deep or milestone report for this commit whose changed area passed. */
function deepEvidenceFor(mainSha) {
  const policy = loadPolicy(ROOT);
  for (const dir of ['reviews', 'rounds']) {
    const full = join(ROOT, 'critic', dir);
    if (!existsSync(full)) continue;
    for (const f of readdirSync(full).filter((n) => n.endsWith('.json'))) {
      let report;
      try { report = JSON.parse(readFileSync(join(full, f), 'utf8')); } catch { continue; }
      const sha = report.build?.mainSha;
      if (!sha || !(sha.startsWith(mainSha) || mainSha.startsWith(sha))) continue;
      if (!['deep', 'milestone'].includes(report.review) || report.verdicts?.changedArea !== 'PASS') continue;
      if (validateReport(report, policy).length === 0) return `critic/${dir}/${f}`;
    }
  }
  return null;
}

/**
 * The newest deep or milestone report on record for this commit, whatever its
 * verdict — informational only, used to annotate an owner override with what
 * the critic actually found. Never used to decide whether the override
 * applies: `resolveDeepGate` decides that from `deepEvidenceFor`, which
 * requires a validated PASS. Pure given the filesystem it reads.
 */
export function latestDeepReportFor(root, mainSha) {
  let best = null;
  for (const dir of ['reviews', 'rounds']) {
    const full = join(root, 'critic', dir);
    if (!existsSync(full)) continue;
    for (const f of readdirSync(full).filter((n) => n.endsWith('.json'))) {
      let report;
      try { report = JSON.parse(readFileSync(join(full, f), 'utf8')); } catch { continue; }
      const sha = report.build?.mainSha;
      if (!sha || !(sha.startsWith(mainSha) || mainSha.startsWith(sha))) continue;
      if (!['deep', 'milestone'].includes(report.review)) continue;
      const date = report.date ?? '';
      if (!best || date > best.date) best = { path: `critic/${dir}/${f}`, changedArea: report.verdicts?.changedArea ?? null, date };
    }
  }
  return best ? { path: best.path, changedArea: best.changedArea } : null;
}

const OWNER_OVERRIDE_MIN_LENGTH = 8;

/**
 * Validate the raw `--owner-override` flag value from `parseArgs`. Absent
 * means no override was requested (`words: null`). A bare flag (no value) or
 * fewer than `OWNER_OVERRIDE_MIN_LENGTH` characters after trimming is
 * refused: only the owner's own words authorise shipping past the deep-review
 * gate (critic/RUBRIC.md section 10, "Owner override of the deploy gate").
 */
export function parseOwnerOverride(raw) {
  if (raw === undefined) return { ok: true, words: null };
  if (raw === true || typeof raw !== 'string') {
    return { ok: false, error: '--owner-override requires the owner\'s own words as its value (e.g. --owner-override="Bailey: ship it now"), not a bare flag' };
  }
  const words = raw.trim();
  if (words.length < OWNER_OVERRIDE_MIN_LENGTH) {
    return { ok: false, error: `--owner-override needs at least ${OWNER_OVERRIDE_MIN_LENGTH} characters of the owner's own words, got ${JSON.stringify(raw)}` };
  }
  return { ok: true, words };
}

/**
 * What to do when a shared-system change has no validated deep report with a
 * passing changed area for this commit. Pure: the caller does the actual
 * fail()/log() side effects. Without `ownerOverrideWords` this is always a
 * hard refusal — nothing here can settle a review, it only decides whether
 * the deploy is allowed to continue past the refusal.
 */
export function resolveDeepGate({ deepBeforeDeploy, evidence, ownerOverrideWords }) {
  if (!deepBeforeDeploy || evidence) return { action: 'proceed' };
  if (!ownerOverrideWords) {
    return {
      action: 'fail',
      message: 'this change touches a shared system, so it needs a deep review of the production candidate BEFORE it goes public, and no validated deep report with a passing changed area exists under critic/reviews/ or critic/rounds/ (critic/RUBRIC.md, "When the critic runs")',
    };
  }
  return { action: 'proceed-with-warning', warningLines: formatOwnerOverrideWarning(ownerOverrideWords) };
}

/** The loud warning block printed (and, on --dry-run, previewed) for an owner override. */
export function formatOwnerOverrideWarning(words) {
  const bar = '!'.repeat(78);
  return [
    bar,
    'WARNING: OWNER OVERRIDE of the deploy gate',
    `  "${words}"`,
    '  No validated deep report with a passing changed area exists for this commit.',
    '  The owner has chosen to ship anyway. Nothing else is relaxed, and this does',
    '  not settle any review: every obligation (live, focused, deep, milestone)',
    '  stays PENDING, and the next candidate still has to address the open',
    '  changed-area issues.',
    bar,
  ];
}

/**
 * The `docs/deploys.log` line for one run. `overrideUsed` appends a trailing
 * `override=owner` field so a build shipped past the deep-review gate is
 * visible in the log itself, not only in `critic/pending/<sha>.json`.
 */
export function formatDeployLogLine({ isoNow, mainSha, bundleHash, artFileCount, status, overrideUsed = false }) {
  const base = `${isoNow}\tmain=${mainSha}\tbundle=${bundleHash}\tartFiles=${artFileCount}\tstatus=${status}`;
  return `${overrideUsed ? `${base}\toverride=owner` : base}\n`;
}

function printPlan(plan) {
  log(`critic plan: ${plan.review.toUpperCase()} review; this build will owe ${plan.obligations.join(' + ')}`);
  for (const reason of plan.reasons) log(`  because: ${reason}`);
  log(`  systems: ${plan.systems.join('; ') || 'none'} | chapters: ${plan.chapters.join(', ') || 'none'}`);
  log(`  checks: ${plan.checks.join(' ')}`);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const eq = a.indexOf('=');
    if (eq !== -1) {
      out[a.slice(2, eq)] = a.slice(eq + 1);
      continue;
    }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      out[key] = next;
      i++;
    } else {
      out[key] = true;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const SKIP_TESTS = Boolean(args['skip-tests']);
const ALLOW_DIRTY = Boolean(args['allow-dirty']);
const DRY_RUN = Boolean(args['dry-run']);
const EXTRA_MESSAGE = typeof args.message === 'string' ? args.message : '';
const CLAIM = typeof args.claim === 'string' ? args.claim : null;
const MINIMUM = typeof args.minimum === 'string' ? args.minimum : null;

function log(msg) {
  console.log(`[deploy] ${msg}`);
}

function fail(msg) {
  console.error(`[deploy] FAIL: ${msg}`);
  process.exit(1);
}

const OWNER_OVERRIDE_PARSE = parseOwnerOverride(args['owner-override']);
if (!OWNER_OVERRIDE_PARSE.ok) fail(OWNER_OVERRIDE_PARSE.error);
const OWNER_OVERRIDE_WORDS = OWNER_OVERRIDE_PARSE.words;

/** Run a real executable (git.exe, gh.exe) with an argv array — no shell, so
 * arguments with spaces/colons (commit messages) don't need escaping. */
function run(cmd, cmdArgs, opts = {}) {
  const res = spawnSync(cmd, cmdArgs, {
    cwd: opts.cwd ?? ROOT,
    stdio: opts.capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
    shell: false,
    env: opts.env ?? process.env,
  });
  if (res.error) fail(`could not run ${cmd}: ${res.error.message}`);
  return res;
}

/** Run an npm-installed CLI via npx — a .cmd shim on Windows, so this one
 * needs the shell. Only ever called with fixed, space-free arguments; the
 * command is passed as a single string (not an argv array) to avoid Node's
 * shell-argv-escaping warning, since nothing here is untrusted input. */
function runNpx(npxArgs, opts = {}) {
  const res = spawnSync(`npx ${npxArgs.join(' ')}`, {
    cwd: opts.cwd ?? ROOT,
    stdio: 'inherit',
    encoding: 'utf8',
    shell: true,
    env: opts.env ?? process.env,
  });
  if (res.error) fail(`could not run npx ${npxArgs.join(' ')}: ${res.error.message}`);
  return res;
}

function capture(cmd, cmdArgs, opts = {}) {
  const res = run(cmd, cmdArgs, { ...opts, capture: true });
  if (res.status !== 0 && !opts.allowFail) {
    fail(
      `${cmd} ${cmdArgs.join(' ')} failed (exit ${res.status}): ${(res.stderr || res.stdout || '').trim()}`,
    );
  }
  return (res.stdout || '').trim();
}

function ghApi(apiArgs) {
  return capture(GH_EXE, ['api', ...apiArgs]);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function countFiles(dir) {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(full);
    else count += 1;
  }
  return count;
}

async function main() {
  if (!existsSync(GH_EXE)) fail(`gh CLI not found at ${GH_EXE}`);

  // ---- 0. Warn about live builds still waiting on a critic round ---------
  // Printed at the start of every run, --dry-run included: hotfixes must
  // still ship even with the critic behind on rounds, so this never refuses
  // the deploy — it just makes the debt impossible to miss. The owner's rule
  // (critic/RUBRIC.md, "The loop"): every build pushed live gets a full
  // critic round before the release counts as finished.
  for (const line of formatPendingWarningBlock(readPendingMarkers(PENDING_DIR))) log(line);

  // ---- 1. Preflight -----------------------------------------------------
  if (!SKIP_TESTS) {
    log('preflight: npx tsc --noEmit');
    if (runNpx(['tsc', '--noEmit']).status !== 0) {
      fail('type check failed (npx tsc --noEmit) — see output above');
    }
    log('preflight: npx vitest run');
    if (runNpx(['vitest', 'run']).status !== 0) {
      fail('unit tests failed (npx vitest run) — see output above');
    }
  } else {
    log('preflight: skipping tsc/vitest (--skip-tests)');
  }

  // Only paths that can change what `vite build` emits stop the release. The
  // art fleet writes docs/screenshots, docs/handoff and tools/gen/sheet-*.json
  // while this script runs, and a blanket dirty check turned every one of
  // those into a lost release — see tools/deploy-classify.mjs.
  const porcelain = capture('git', ['status', '--porcelain'], { cwd: ROOT });
  const dirty = classifyPorcelain(porcelain);
  if (dirty.fleetNoise.length) {
    log(`ignoring ${dirty.fleetNoise.length} dirty fleet path(s) — these cannot change the build:`);
    for (const entry of dirty.fleetNoise) log(`  ${entry.raw}  [${entry.rule}]`);
  }
  if (dirty.buildRelevant.length) {
    log(`${dirty.buildRelevant.length} build-relevant path(s) are dirty:`);
    for (const entry of dirty.buildRelevant) log(`  ${entry.raw}  [${entry.rule}]`);
    if (!ALLOW_DIRTY) {
      fail(
        'refusing to deploy: the paths above feed the build, so the bundle would not match HEAD (pass --allow-dirty to override)',
      );
    }
    log('--allow-dirty set: continuing despite the above');
  } else if (dirty.entries.length) {
    log('no build-relevant path is dirty — continuing');
  } else {
    log('working tree clean');
  }

  // With --allow-dirty the uncommitted build-relevant files ship too, so the review plan has to see them.
  const dirtyShipped = dirty.buildRelevant.flatMap((entry) => entry.paths ?? []);
  const mainSha = capture('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT });
  log(`main repo at ${mainSha}`);

  if (DRY_RUN) {
    // Tracked files only: the shipped art and audio are compared once the
    // build exists, so the real plan can only be deeper than this one.
    const dryPlan = planForRepo({ root: ROOT, claim: CLAIM, minimum: MINIMUM, extraPaths: dirtyShipped });
    printPlan(dryPlan);
    if (dryPlan.deepBeforeDeploy) {
      const evidence = deepEvidenceFor(mainSha);
      const gate = resolveDeepGate({ deepBeforeDeploy: true, evidence, ownerOverrideWords: OWNER_OVERRIDE_WORDS });
      if (gate.action === 'fail') {
        log(`DRY RUN: would refuse to deploy — ${gate.message}`);
      } else if (gate.action === 'proceed-with-warning') {
        for (const line of gate.warningLines) log(line);
        log('DRY RUN: would proceed under the owner override above');
      } else {
        log(`DRY RUN: deep evidence on record for this candidate: ${evidence}`);
      }
    }
    log(
      `--dry-run: stopping after the dirty-tree check (${dirty.buildRelevant.length} build-relevant, ${dirty.fleetNoise.length} fleet-noise). Nothing was built, pushed or deployed.`,
    );
    return;
  }

  // ---- 2. Build -----------------------------------------------------------
  // The art index has to be regenerated from whatever the fleet finished since
  // the last release, *before* vite copies public/ — otherwise the shipped
  // manifest is stale and the site hides art that is sitting right there.
  log('building: node tools/gen/manifest.mjs');
  if (run(process.execPath, [join(ROOT, 'tools', 'gen', 'manifest.mjs')]).status !== 0) {
    fail('art manifest generation failed — see output above');
  }
  log('building: npx vite build --outDir dist-release --emptyOutDir');
  if (runNpx(['vite', 'build', '--outDir', 'dist-release', '--emptyOutDir']).status !== 0) {
    fail('vite build failed — see output above');
  }

  const indexPath = join(DIST, 'index.html');
  const artCharactersDir = join(DIST, 'art', 'characters');
  if (!existsSync(indexPath)) fail(`build did not produce ${indexPath}`);
  if (!existsSync(artCharactersDir) || !statSync(artCharactersDir).isDirectory()) {
    fail(`build did not produce ${artCharactersDir}`);
  }
  const artFileCount = countFiles(artCharactersDir);
  log(`build ok: index.html present, ${artFileCount} files under art/characters`);

  const indexHtml = readFileSync(indexPath, 'utf8');
  const bundleMatch = indexHtml.match(/assets\/index-([\w-]+)\.js/);
  if (!bundleMatch) fail(`could not find an assets/index-*.js reference in ${indexPath}`);
  const bundleHash = bundleMatch[1];
  log(`bundle hash: ${bundleHash}`);

  // ---- 2b. Identity of the whole artifact, and the review it needs ---------
  // The bundle name says nothing about the art and audio that ship beside it,
  // so the build's identity is a manifest of every shipped file. Media that
  // does not decode, or decodes to one flat colour, never ships as a pass.
  writeFileSync(join(DIST, '.nojekyll'), '');
  log('hashing and decode-checking every shipped file');
  const manifest = await buildManifest(DIST);
  const flatOk = new Set(loadPolicy(ROOT).intentionalFlatImages ?? []);
  const problems = manifest.problems.filter((p) => !flatOk.has(p.split(':')[0]));
  if (problems.length) {
    for (const p of problems) log(`  ${p}`);
    fail(`${problems.length} shipped file(s) are empty, undecodable or blank — fix them, or list a deliberate flat image under "intentionalFlatImages" in critic/policy.json`);
  }
  if (manifest.audioUnverified) log(`WARNING: ${manifest.audioUnverified} audio file(s) could not be decode-checked (no ffprobe): CHK-019 stays UNVERIFIED for them`);
  writeFileSync(join(DIST, MANIFEST_NAME), `${JSON.stringify(manifest)}\n`);
  log(`artifact ${manifest.artifactHash.slice(0, 16)}: ${manifest.count} files, ${(manifest.totalBytes / 1048576).toFixed(1)} MB`);

  const previousSha = lastDeployedSha(ROOT);
  const previousManifestPath = previousSha ? join(ARTIFACTS_DIR, `${previousSha}.json`) : null;
  const previousManifest = previousManifestPath && existsSync(previousManifestPath)
    ? JSON.parse(readFileSync(previousManifestPath, 'utf8'))
    : null;
  const plan = planForRepo({ root: ROOT, manifest, previousManifest, claim: CLAIM, minimum: MINIMUM, extraPaths: dirtyShipped });
  printPlan(plan);
  let ownerOverrideUsed = false;
  let ownerOverrideReportPath = null;
  let ownerOverrideChangedArea = null;
  if (plan.deepBeforeDeploy) {
    const evidence = deepEvidenceFor(mainSha);
    const gate = resolveDeepGate({ deepBeforeDeploy: true, evidence, ownerOverrideWords: OWNER_OVERRIDE_WORDS });
    if (gate.action === 'fail') {
      fail(`${gate.message} for ${mainSha}`);
    } else if (gate.action === 'proceed-with-warning') {
      for (const line of gate.warningLines) log(line);
      const latest = latestDeepReportFor(ROOT, mainSha);
      ownerOverrideUsed = true;
      ownerOverrideReportPath = latest ? latest.path : null;
      ownerOverrideChangedArea = latest ? latest.changedArea : null;
      log(
        latest
          ? `nearest report on record for ${mainSha}: ${latest.path} (changed area ${latest.changedArea ?? 'missing'}) — proceeding under owner override`
          : `no deep or milestone report at all exists for ${mainSha} — proceeding under owner override`,
      );
    } else {
      log(`deep evidence on record for this candidate: ${evidence}`);
    }
  } else if (OWNER_OVERRIDE_WORDS) {
    log('--owner-override was set but this candidate does not need deep evidence before deploying: nothing to override');
  }

  // ---- 3. Publish dist-release as a fresh gh-pages repo --------------------
  writeFileSync(join(DIST, '.nojekyll'), '');

  const distGit = join(DIST, '.git');
  if (existsSync(distGit)) {
    log('removing existing dist-release/.git');
    rmSync(distGit, { recursive: true, force: true });
  }

  log('publishing dist-release to gh-pages');
  run('git', ['init', '-b', 'gh-pages'], { cwd: DIST });
  run('git', ['config', 'core.safecrlf', 'false'], { cwd: DIST });
  run('git', ['config', 'core.autocrlf', 'false'], { cwd: DIST });
  run('git', ['config', 'user.name', 'Bailey Pillon'], { cwd: DIST });
  run('git', ['config', 'user.email', 'baileypillon@gmail.com'], { cwd: DIST });
  run('git', ['add', '-A'], { cwd: DIST });

  const isoNow = new Date().toISOString();
  let commitMessage = `Pages build ${isoNow} from main ${mainSha}`;
  if (EXTRA_MESSAGE) commitMessage += `: ${EXTRA_MESSAGE}`;
  const commitRes = run('git', ['commit', '-m', commitMessage], { cwd: DIST });
  if (commitRes.status !== 0) fail('git commit in dist-release failed — see output above');

  const pushRes = run('git', ['push', '-f', REPO_URL, 'gh-pages:gh-pages'], { cwd: DIST });
  if (pushRes.status !== 0) fail('git push to gh-pages failed — see output above');

  // ---- 4. Kick a Pages build and poll it ------------------------------------
  log('kicking a Pages build');
  ghApi(['-X', 'POST', `repos/${REPO}/pages/builds`]);

  const POLL_INTERVAL_MS = 15_000;
  const POLL_TIMEOUT_MS = 6 * 60_000;
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let pagesStatus = '';
  while (Date.now() < deadline) {
    pagesStatus = ghApi(['repos/' + REPO + '/pages/builds/latest', '--jq', '.status']);
    log(`pages build status: ${pagesStatus}`);
    if (pagesStatus === 'built') break;
    if (pagesStatus === 'errored') {
      const errMsg = ghApi(['repos/' + REPO + '/pages/builds/latest', '--jq', '.error.message']);
      fail(`Pages build errored: ${errMsg}`);
    }
    await sleep(POLL_INTERVAL_MS);
  }
  if (pagesStatus !== 'built') {
    fail(`Pages build did not report "built" within ${POLL_TIMEOUT_MS / 60000} minutes (last status: ${pagesStatus})`);
  }

  // ---- 5. Verify the live site ----------------------------------------------
  log('verifying live site');
  let liveMatched = false;
  let lastLiveHash = null;
  let lastLiveStatus = null;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const res = await fetch(LIVE_URL, { redirect: 'follow' });
      lastLiveStatus = res.status;
      const text = await res.text();
      const m = text.match(/assets\/index-([\w-]+)\.js/);
      lastLiveHash = m ? m[1] : null;
      if (res.status === 200 && lastLiveHash === bundleHash) {
        liveMatched = true;
        break;
      }
    } catch (err) {
      log(`fetch attempt ${attempt} failed: ${err.message}`);
    }
    log(`attempt ${attempt}/6: live bundle ${lastLiveHash ?? '(none)'} vs local ${bundleHash} — retrying in 30s`);
    if (attempt < 6) await sleep(30_000);
  }
  if (!liveMatched) {
    fail(
      `live site never matched the built bundle (local ${bundleHash}, last seen live ${lastLiveHash}, last http status ${lastLiveStatus})`,
    );
  }
  log(`live site matches bundle ${bundleHash}`);

  // The same bundle name is not the same artifact: download the page, all the
  // code, every file that changed and an even sample of the rest from the real
  // URL and compare bytes (CHK-017). A 200 is not a pass; identical bytes are.
  const changedShipped = (() => {
    const d = diffManifests(previousManifest, manifest);
    return previousManifest ? [...d.added, ...d.changed] : [];
  })();
  let liveArtifact = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    liveArtifact = await verifyLive(manifest, LIVE_URL, { changed: changedShipped });
    log(`live artifact check ${attempt}/4: ${liveArtifact.result} (${liveArtifact.checked} files compared, manifest ${liveArtifact.liveManifest})`);
    if (liveArtifact.result === 'PASS') break;
    if (attempt < 4) await sleep(30_000);
  }
  if (liveArtifact.result !== 'PASS') {
    for (const p of [...liveArtifact.mismatched, ...liveArtifact.missing, ...liveArtifact.wrongType, ...liveArtifact.errors].slice(0, 20)) log(`  ${p}`);
    fail(`the live URL does not serve this exact artifact (${liveArtifact.result}): see the files above`);
  }
  log(`live site serves artifact ${manifest.artifactHash.slice(0, 16)} byte for byte (${liveArtifact.checked} files compared)`);

  const commitCount = Number(
    ghApi(['repos/' + REPO + '/commits?sha=gh-pages', '--jq', 'length']),
  );
  if (commitCount !== 1) {
    fail(`expected gh-pages to have exactly 1 commit, found ${commitCount}`);
  }
  log('gh-pages branch has exactly 1 commit');

  // ---- 6. Log and summarize ---------------------------------------------
  const status = 'ok';
  const logLine = formatDeployLogLine({ isoNow, mainSha, bundleHash, artFileCount, status, overrideUsed: ownerOverrideUsed });
  mkdirSync(dirname(LOG_PATH), { recursive: true });
  if (!existsSync(LOG_PATH)) {
    writeFileSync(
      LOG_PATH,
      'datetime\tmain_sha\tbundle_hash\tart_file_count\tstatus\n',
    );
  }
  writeFileSync(LOG_PATH, logLine, { flag: 'a' });

  const summary = `Deployed main ${mainSha} (bundle ${bundleHash}, ${artFileCount} art files) to ${LIVE_URL} at ${isoNow}`;
  log(summary);
  console.log(summary);

  // ---- 7. Record what this build owes the critic ------------------------
  // The build this one replaces can no longer be verified live. A deep review
  // it still owed moves here; its other open obligations are recorded as never
  // verified. Nothing is deleted: closed markers move to critic/cleared/.
  mkdirSync(ARTIFACTS_DIR, { recursive: true });
  writeFileSync(join(ARTIFACTS_DIR, `${mainSha}.json`), `${JSON.stringify(manifest)}\n`);
  const older = readPendingMarkers(PENDING_DIR).filter((m) => !m.parseError);
  const { carriedDeep, closed } = supersedeMarkers(older, mainSha, isoNow);
  for (const m of closed) {
    const { file: _file, ageHours: _age, ...content } = m;
    archiveMarker(PENDING_DIR, CLEARED_DIR, content);
    log(`build ${m.mainSha} was replaced: its marker moved to critic/cleared/ with what was never verified`);
  }
  const baseMarker = buildPendingMarker({
    mainSha,
    bundle: bundleHash,
    deployedAt: isoNow,
    liveUrl: LIVE_URL,
    artFiles: artFileCount,
    artifactHash: manifest.artifactHash,
    plan,
    carriedDeep,
    liveArtifact: { result: liveArtifact.result, checked: liveArtifact.checked, at: isoNow },
  });
  // An override ships the build, it never settles a review: every obligation
  // above stays exactly as planned. This only records, on the marker itself,
  // that the owner's own words shipped it past the deep-review refusal.
  const marker = ownerOverrideUsed
    ? { ...baseMarker, ownerOverride: { words: OWNER_OVERRIDE_WORDS, date: isoNow, report: ownerOverrideReportPath, changedArea: ownerOverrideChangedArea } }
    : baseMarker;
  const markerPath = writePendingMarker(PENDING_DIR, marker);
  log(`critic-pending marker written: ${markerPath}`);
  // A focused or deep review made on the production candidate before this
  // deploy counts now that the build it reviewed is the one that is live.
  for (const r of applyStoredReports(ROOT, mainSha)) {
    for (const s of r.settled) log(`  ${r.report} settled ${s.kind}: ${s.result}`);
  }
  const ledger = readLedger(ROOT, loadPolicy(ROOT));
  writeLedger(ROOT, { ...ledger, deploysSinceDeep: [...ledger.deploysSinceDeep, { sha: mainSha, date: isoNow, substantial: plan.review !== 'live' }] });

  const owed = (readPendingMarkers(PENDING_DIR).find((m) => m.mainSha === mainSha)?.obligations ?? [])
    .filter((o) => o.status === 'pending').map((o) => o.kind);
  const banner = owed.length
    ? `REVIEW OWED for main ${mainSha} bundle ${bundleHash}: ${owed.join(' + ')} (planned review: ${plan.review}). A release is not finished until these are settled: npm run critic:status`
    : `main ${mainSha} bundle ${bundleHash}: every review obligation is already settled`;
  const rule = '='.repeat(Math.min(banner.length, 160));
  console.log('');
  console.log(rule);
  console.log(banner);
  console.log(rule);
}

// Guarded so tests can import this module's pure helper functions (parseOwnerOverride,
// resolveDeepGate, formatOwnerOverrideWarning, formatDeployLogLine, latestDeepReportFor)
// without triggering a real deploy — same pattern as critic-status.mjs / critic-plan.mjs.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    fail(err.stack || err.message || String(err));
  });
}
