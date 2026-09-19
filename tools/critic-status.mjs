#!/usr/bin/env node
/**
 * node tools/critic-status.mjs
 *
 * Prints every live build still waiting on a critic round — read from
 * `critic/pending/*.json`, written by `tools/deploy-pages.mjs` — and every
 * finished round found under `critic/rounds/*.json`. Exits `1` while any
 * marker is pending, `0` once the folder is clear.
 *
 * This is the tool `docs/DEV.md` and the deploy's own startup warning point
 * at: the owner's rule is that every build pushed live gets a full critic
 * round (see `critic/RUBRIC.md`, "The loop"), and this is how that gets
 * checked instead of trusted to memory.
 *
 * Node built-ins only, same as `deploy-classify.mjs` / `critic-pending.mjs`.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { readPendingMarkers } from './critic-pending.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PENDING_DIR = join(ROOT, 'critic', 'pending');
const ROUNDS_DIR = join(ROOT, 'critic', 'rounds');

/**
 * Round reports don't have a single fixed schema yet (see
 * `critic/RUBRIC.md`'s "Produce `critic/rounds/round-NN.md` (+ `.json`)"),
 * so this reads generously across the field names a round report is likely
 * to use rather than committing to one now and breaking on the first report
 * that guesses differently.
 */
function readRounds(dir) {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort();
  return files.map((file) => {
    const full = join(dir, file);
    const roundId = file.replace(/\.json$/, '');
    let data;
    try {
      data = JSON.parse(readFileSync(full, 'utf8'));
    } catch (err) {
      return { file, roundId, parseError: err instanceof Error ? err.message : String(err) };
    }
    const total = data.weightedTotal ?? data.weighted_total ?? data.total ?? data.score;
    const sha = data.mainSha ?? data.main_sha ?? data.buildSha ?? data.build_sha ?? data.sha;
    return { file, roundId, total, sha };
  });
}

function main() {
  const pending = readPendingMarkers(PENDING_DIR);
  const rounds = readRounds(ROUNDS_DIR);

  console.log('critic pending (critic/pending/):');
  if (!pending.length) {
    console.log('  none');
  } else {
    for (const marker of pending) {
      if (marker.parseError) {
        console.log(`  ${marker.file}  UNREADABLE (${marker.parseError})`);
        continue;
      }
      console.log(`  sha=${marker.mainSha}  bundle=${marker.bundle ?? '?'}  age=${marker.ageHours}h`);
    }
  }

  console.log('');
  console.log('critic rounds (critic/rounds/):');
  if (!rounds.length) {
    console.log('  none');
  } else {
    for (const round of rounds) {
      if (round.parseError) {
        console.log(`  ${round.file}  UNREADABLE (${round.parseError})`);
        continue;
      }
      const totalStr = round.total !== undefined ? String(round.total) : '(no total recorded)';
      const shaStr = round.sha !== undefined ? round.sha : '(no build sha recorded)';
      console.log(`  ${round.roundId}  total=${totalStr}  sha=${shaStr}`);
    }
  }

  console.log('');
  if (pending.length) {
    console.log(
      `critic:status FAIL — ${pending.length} live build(s) have not had a critic round yet (critic/RUBRIC.md, "The loop").`,
    );
    process.exitCode = 1;
    return;
  }
  console.log('critic:status OK — no live build is waiting on a critic round.');
  process.exitCode = 0;
}

main();
