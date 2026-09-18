#!/usr/bin/env node
/**
 * Build and deploy Pyrefly Reprise to GitHub Pages, in one command.
 *
 *   node tools/deploy-pages.mjs [--skip-tests] [--allow-dirty] [--message="text"]
 *
 * Flags:
 *   --skip-tests   skip `npx tsc --noEmit` and `npx vitest run`
 *   --allow-dirty  allow deploying with uncommitted changes in the main repo
 *                  (the dirty files are still printed as a warning)
 *   --message=     extra free-text appended to the gh-pages commit message
 *
 * Pipeline: preflight -> `vite build` into dist-release/ -> re-init
 * dist-release as a throwaway single-commit `gh-pages` git repo and force-push
 * it -> kick a Pages build and poll it to completion -> verify the live site
 * serves the same bundle and that art assets resolve -> append a line to
 * docs/deploys.log.
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

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist-release');
const GH_EXE = 'D:/Tools/GitHubCLI/gh.exe';
const REPO = 'BaileyPillon/pyrefly-reprise';
const REPO_URL = `https://github.com/${REPO}.git`;
const LIVE_URL = 'https://baileypillon.github.io/pyrefly-reprise/';
const LOG_PATH = join(ROOT, 'docs', 'deploys.log');

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
const EXTRA_MESSAGE = typeof args.message === 'string' ? args.message : '';

function log(msg) {
  console.log(`[deploy] ${msg}`);
}

function fail(msg) {
  console.error(`[deploy] FAIL: ${msg}`);
  process.exit(1);
}

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

  const porcelain = capture('git', ['status', '--porcelain'], { cwd: ROOT });
  if (porcelain) {
    log('main repo has uncommitted changes:');
    for (const line of porcelain.split('\n')) log(`  ${line}`);
    if (!ALLOW_DIRTY) {
      fail('refusing to deploy a dirty tree (pass --allow-dirty to override)');
    }
    log('--allow-dirty set: continuing despite the above');
  }

  const mainSha = capture('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT });
  log(`main repo at ${mainSha}`);

  // ---- 2. Build -----------------------------------------------------------
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

  const artUrl = `${LIVE_URL}art/characters/tidus/idle.png`;
  const artRes = await fetch(artUrl);
  if (artRes.status !== 200) {
    fail(`${artUrl} returned ${artRes.status}, expected 200`);
  }
  log('art asset check ok: art/characters/tidus/idle.png -> 200');

  const commitCount = Number(
    ghApi(['repos/' + REPO + '/commits?sha=gh-pages', '--jq', 'length']),
  );
  if (commitCount !== 1) {
    fail(`expected gh-pages to have exactly 1 commit, found ${commitCount}`);
  }
  log('gh-pages branch has exactly 1 commit');

  // ---- 6. Log and summarize ---------------------------------------------
  const status = 'ok';
  const logLine = `${isoNow}\tmain=${mainSha}\tbundle=${bundleHash}\tartFiles=${artFileCount}\tstatus=${status}\n`;
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
}

main().catch((err) => {
  fail(err.stack || err.message || String(err));
});
