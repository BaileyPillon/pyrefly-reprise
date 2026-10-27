#!/usr/bin/env node
/**
 * node tools/continuity-id.mjs [--root <tree>] [--json] [--files]
 * node tools/continuity-id.mjs [--root <tree>] --check <continuity-summary.json | continuity.json | critic report .json>
 * node tools/continuity-id.mjs [--root <tree>] --embed <continuity-summary.json> --into <critic report .json>
 *
 * Prints the identity of the continuity harness in a tree (default: the tree this file is in): the blob id of every file the harness runs, the policy
 * block's hash, the probe version, the pose table's hash and the tree's HEAD. A review's brief says to run the harness from the RELEASE tree and to print this
 * line first; `--check` asks the question critic-clear asks, of one output file: was it read by this tree's harness, and is its pose table the build's own?
 * Exit 0 when the file's stamp is this tree's, 1 when it is not (with the reason), 2 when the file carries no stamp. `--embed` copies a summary into a report's
 * `continuity` (the numbers and the 3.5 KB `harness` stamp, verbatim, so nobody retypes either) and then asks the same question of the report: exit 0 when it is
 * accepted, 1 when it is refused (the report is still written, so the refusal can be read from it). Reads only (`--embed` writes the one report); starts no browser.
 *
 * Game case: both (shared critic plumbing).
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { describeIdentity, harnessIdentity, harnessIdentityErrors, verifyStamp } from './critic-harness-identity.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** The stamp inside a summary (`harness`), a per-chapter continuity.json (`harness`) or a critic report (`continuity.harness`). */
export function stampOf(json) {
  return json?.harness ?? json?.continuity?.harness ?? null;
}

/** The report-level rule, asked of one stamp as if it sat in a report dated today (so the message is the one critic-clear prints). `continuity` is the object that carries the numbers. */
function askRule(stamp, continuity, root, mine, chapterStamp) {
  return harnessIdentityErrors(
    { date: new Date().toISOString(), continuity: { ...continuity, harness: stamp }, build: { mainSha: stamp.poseTable?.buildSha ?? undefined } },
    { continuity: { harnessIdentity: { requiredFrom: '1970-01-01' } } },
    { root, identity: mine, chapterStamp },
  );
}

export function main(argv, out = console.log) {
  const get = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const root = path.resolve(get('--root') ?? path.join(HERE, '..'));
  const mine = harnessIdentity(root);
  const embed = get('--embed');
  if (embed) {
    const into = get('--into');
    if (!into) { out('usage: node tools/continuity-id.mjs --embed <continuity-summary.json> --into <critic report .json>'); return 64; }
    const summary = JSON.parse(fs.readFileSync(path.resolve(embed), 'utf8'));
    if (!summary.harness) { out(`${embed}: no harness stamp (a run made before the stamp existed): nothing to embed. Run the harness again from the release tree. This tree: ${describeIdentity(mine)}`); return 2; }
    const reportPath = path.resolve(into);
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    report.continuity = { ...(report.continuity && typeof report.continuity === 'object' ? report.continuity : {}), ...summary };
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    out(`${into}: continuity now holds ${embed} unchanged, read by ${describeIdentity(summary.harness)}`);
    const errors = verifyStamp(summary.harness).length ? verifyStamp(summary.harness) : askRule(summary.harness, report.continuity, root, mine, false);
    if (errors.length) { for (const e of errors) out(`REFUSED: ${e}`); return 1; }
    out("OK: the report's continuity is the summary of this tree's own harness.");
    return 0;
  }
  const check = get('--check');
  if (!check) {
    if (argv.includes('--json')) out(JSON.stringify(mine, null, 1));
    else {
      out(describeIdentity(mine));
      if (mine.tree.dirty?.length) out(`modified since HEAD: ${mine.tree.dirty.join(', ')}`);
      if (argv.includes('--files')) for (const [f, b] of Object.entries(mine.files)) out(`  ${b.slice(0, 12)}  ${f}`);
    }
    return 0;
  }
  const json = JSON.parse(fs.readFileSync(path.resolve(check), 'utf8'));
  const stamp = stampOf(json);
  if (!stamp) { out(`${check}: no harness stamp (a run made before the stamp existed, or a report that dropped it). This tree: ${describeIdentity(mine)}`); return 2; }
  const problems = verifyStamp(stamp);
  if (problems.length) { out(`${check}: the stamp is not consistent: ${problems.join('; ')}`); return 1; }
  out(`${check}: read by ${describeIdentity(stamp)}`);
  out(`this tree: ${describeIdentity(mine)}`);
  // a summary's stamp (it names the chapters it was made from) carries the digest of its numbers; a single chapter's continuity.json does not
  const errors = askRule(stamp, json.continuity ?? json, root, mine, !Array.isArray(stamp.chapterIds));
  if (errors.length) { for (const e of errors) out(`REFUSED: ${e}`); return 1; }
  out("OK: this is the release tree's own harness.");
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
