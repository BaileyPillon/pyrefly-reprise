#!/usr/bin/env node
/**
 * node tools/continuity-id.mjs [--root <tree>] [--json] [--files]
 * node tools/continuity-id.mjs [--root <tree>] --check <continuity-summary.json | continuity.json | critic report .json>
 *
 * Prints the identity of the continuity harness in a tree (default: the tree this file is in): the blob id of every file the harness runs, the policy
 * block's hash, the probe version, the pose table's hash and the tree's HEAD. A review's brief says to run the harness from the RELEASE tree and to print this
 * line first; `--check` asks the question critic-clear asks, of one output file: was it read by this tree's harness, and is its pose table the build's own?
 * Exit 0 when the file's stamp is this tree's, 1 when it is not (with the reason), 2 when the file carries no stamp. Reads only; starts no browser.
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

export function main(argv, out = console.log) {
  const get = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const root = path.resolve(get('--root') ?? path.join(HERE, '..'));
  const mine = harnessIdentity(root);
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
  // reuse the report-level rule on a one-field report dated today, so the message is the one critic-clear prints
  const errors = harnessIdentityErrors(
    { date: new Date().toISOString(), continuity: { harness: stamp }, build: { mainSha: stamp.poseTable?.buildSha ?? undefined } },
    { continuity: { harnessIdentity: { requiredFrom: '1970-01-01' } } },
    { root, identity: mine },
  );
  if (errors.length) { for (const e of errors) out(`REFUSED: ${e}`); return 1; }
  out('OK: this is the release tree\'s own harness.');
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
