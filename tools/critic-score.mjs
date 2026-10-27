#!/usr/bin/env node
/**
 * node tools/critic-score.mjs --report <deep or milestone report .json>
 *
 * The arithmetic and the gates, done by code instead of by the chief critic:
 * the single weighted score (unrounded against 9.60), the categories under the
 * 9.0 floor, whether the report is valid evidence, and for a milestone review
 * every reason acceptance is refused. A continuity aggregate that this tree's
 * harness did not read (or that carries no stamp of which one did) is refused
 * before any score is printed (post-conference motion plan, step 0;
 * tools/critic-harness-identity.mjs); `--harness-tree <dir>` names another
 * release tree to match. The chief writes the category scores;
 * this says what they add up to. Exit 0 when the report is valid (accepted or
 * not), 1 when it is not valid evidence.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { loadPolicy, milestoneVerdict, validateReport, weightedTotal } from './critic-policy.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--report');
if (i < 0 || !process.argv[i + 1]) {
  console.log('usage: node tools/critic-score.mjs --report <report.json>');
  process.exit(64);
}
const policy = loadPolicy(ROOT);
const report = JSON.parse(readFileSync(resolve(process.argv[i + 1]), 'utf8'));
const h = process.argv.indexOf('--harness-tree');
const harnessTree = h >= 0 && process.argv[h + 1] ? resolve(process.argv[h + 1]) : undefined;
if (harnessTree) console.log(`critic:score NOTE: the continuity harness is matched against ${harnessTree}, not against this tree (${ROOT}); that is for a release tree that is behind the one that ran the harness`);
const errors = validateReport(report, policy, { root: ROOT, harnessTree });
const identity = errors.filter((e) => e.startsWith('continuity harness identity'));
if (identity.length) {
  console.log('critic:score REFUSED the continuity evidence: a number read by a tool that is not the release tree\'s own certifies nothing, so no score is printed');
  for (const e of identity) console.log(`  - ${e}`);
  process.exit(1);
}
const score = weightedTotal(report.categories, policy);
console.log(score.provisional
  ? `score: PROVISIONAL — no verified score for ${score.missing.join(', ')} (never averaged away, never zero)`
  : `score: ${score.display} (unrounded ${score.total}); 9.60 ${score.meetsTotal ? 'reached' : 'not reached'}`);
if (score.belowFloor.length) console.log(`below the ${policy.acceptance.categoryFloor} floor: ${score.belowFloor.join(', ')}`);
const verdict = milestoneVerdict(report, policy);
console.log(`milestone: ${verdict.accepted ? 'ACCEPTED' : 'not accepted'}`);
for (const r of verdict.reasons) console.log(`  - ${r}`);
console.log(errors.length ? 'report: NOT valid evidence' : 'report: valid evidence');
for (const e of errors) console.log(`  - ${e}`);
process.exitCode = errors.length ? 1 : 0;
