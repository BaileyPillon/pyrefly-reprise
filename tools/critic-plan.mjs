#!/usr/bin/env node
/**
 * node tools/critic-plan.mjs [--since <sha>] [--head <sha>] [--paths a,b,c]
 *                            [--manifest <next.json> --previous-manifest <prev.json>]
 *                            [--claim milestone] [--minimum deep] [--json]
 *
 * Says which review the candidate needs under critic policy v2 and why: the
 * changed paths (git, plus shipped art and audio from the artifact manifests,
 * because public/art is not in git), the systems and chapters they touch, the
 * checks selected for them, whether deep evidence is required BEFORE deploying,
 * and the obligations the deploy will record. The release workflow and
 * `tools/deploy-pages.mjs` both call `planForRepo`, so they cannot disagree.
 *
 * With no `--since`, the previous build is the last line of docs/deploys.log.
 * If the change set cannot be established the plan is a deep review.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { diffManifests, shippedToRepoPaths } from './artifact-manifest.mjs';
import { readPendingMarkers } from './critic-pending.mjs';
import { loadPolicy, planReview } from './critic-policy.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const git = (root, args) => {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
};

/** The last successfully deployed main sha, from docs/deploys.log. */
export function lastDeployedSha(root) {
  const log = join(root, 'docs', 'deploys.log');
  if (!existsSync(log)) return null;
  const ok = readFileSync(log, 'utf8').trim().split('\n').filter((l) => /\tstatus=ok/.test(l));
  const m = ok.length ? ok[ok.length - 1].match(/\tmain=([0-9a-f]+)/) : null;
  return m ? m[1] : null;
}

export function readLedger(root, policy) {
  const file = join(root, 'critic', 'ledger.json');
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  return { lastDeep: { sha: policy.baseline.mainSha, date: policy.baseline.date, source: `${policy.baseline.round} (rubric v${policy.baseline.rubricVersion}, evidence baseline only)` }, deploysSinceDeep: [] };
}

export function writeLedger(root, ledger) {
  writeFileSync(join(root, 'critic', 'ledger.json'), `${JSON.stringify(ledger, null, 2)}\n`);
}

/** Distinct days with commits to shipped source since the last deep review; null if git cannot say. */
function activeDaysSince(root, sha, head) {
  const out = git(root, ['log', `${sha}..${head}`, '--format=%cs', '--', 'src', 'public', 'index.html']);
  return out === null ? null : new Set(out.split('\n').filter(Boolean)).size;
}

export function planForRepo({ root = ROOT, since = null, head = 'HEAD', paths = null, manifest = null, previousManifest = null, claim = null, minimum = null, extraPaths = [] } = {}) {
  const policy = loadPolicy(root);
  const ledger = readLedger(root, policy);
  const previous = since ?? lastDeployedSha(root);
  let changed = paths;
  if (!changed && previous) {
    const diff = git(root, ['diff', '--name-only', `${previous}..${head}`]);
    changed = diff === null ? null : diff.split('\n').filter(Boolean);
  }
  // Uncommitted build-relevant files ship with an --allow-dirty deploy, so they are part of the change.
  if (changed && extraPaths.length) changed = [...new Set([...changed, ...extraPaths])];
  if (changed && manifest) {
    const d = diffManifests(previousManifest, manifest);
    changed = [...new Set([...changed, ...shippedToRepoPaths([...d.added, ...d.changed, ...d.removed])])];
  }
  const carriedDeep = readPendingMarkers(join(root, 'critic', 'pending'))
    .filter((m) => (m.obligations ?? []).some((o) => (o.kind === 'deep' || o.kind === 'milestone') && o.status === 'pending'))
    .map((m) => m.mainSha);
  const activeDays = ledger.lastDeep?.sha ? activeDaysSince(root, ledger.lastDeep.sha, head) : null;
  const plan = planReview({
    paths: changed, policy, carriedDeep, claim, minimum,
    ledger: { substantialSinceDeep: ledger.deploysSinceDeep.filter((d) => d.substantial).length, activeDaysSinceDeep: activeDays ?? 0 },
  });
  if (manifest && !previousManifest) plan.reasons.push('no artifact manifest exists for the previous build, so changed art and audio could not be listed: treat shipped media as unverified until the live check');
  return { previousBuild: previous, head: git(root, ['rev-parse', '--short', head]), lastDeep: ledger.lastDeep, ...plan };
}

function main(argv) {
  const opt = (name) => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
  const read = (f) => (f ? JSON.parse(readFileSync(resolve(f), 'utf8')) : null);
  const plan = planForRepo({
    since: opt('--since'), head: opt('--head') ?? 'HEAD', paths: opt('--paths') ? opt('--paths').split(',') : null,
    manifest: read(opt('--manifest')), previousManifest: read(opt('--previous-manifest')), claim: opt('--claim'), minimum: opt('--minimum'),
  });
  if (argv.includes('--json')) { console.log(JSON.stringify(plan, null, 1)); return; }
  console.log(`critic plan for ${plan.head} (previous build ${plan.previousBuild ?? 'unknown'})`);
  console.log(`  review:       ${plan.review.toUpperCase()}`);
  // The owner's release rules (2026-09-21): focused before the deploy, deep after it,
  // except the save-data class and a milestone claim.
  console.log(`  before deploy: ${plan.deepBeforeDeploy ? 'DEEP review of the production candidate (save-data class or milestone claim)' : plan.focusedBeforeDeploy ? 'FOCUSED review of the production candidate' : 'nothing: no shipped file changed'}`);
  console.log(`  after deploy:  live verification${plan.deepAfterDeploy ? ', then the DEEP review on the live build (this build owes it)' : ''}`);
  console.log(`  obligations:  ${plan.obligations.join(' + ')}`);
  for (const r of plan.reasons) console.log(`  because:      ${r}`);
  console.log(`  systems:      ${plan.systems.join('; ') || 'none'}`);
  console.log(`  games:        ${plan.games}   chapters: ${plan.chapters.join(', ') || 'none'}`);
  console.log(`  checks:       ${plan.checks.join(' ')}`);
  console.log(`  targets:      ${plan.targetGroups.join(', ') || 'none'}${plan.dataAudit ? '   + audit every changed data value against research/' : ''}${plan.approvedArtCheck ? '   + approved-art hash check' : ''}`);
  console.log(`  files:        ${plan.productPaths.length} shipped, ${plan.ignoredPaths.length} with no product effect`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
