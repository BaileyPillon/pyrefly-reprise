/**
 * **The pose gate in `npm test`** (pose continuity, W1; both games). Bailey, 2026-10-16: "pose continuity is the strongest recurring issue we need a permanent
 * fix for this please." Two halves:
 *
 *  - the waiver ledger and the compiled tables, which need no art and run everywhere: the ledger obeys its ratchet (a row without `legacy` carries Bailey's own
 *    quoted words; a `legacy` row is one the bootstrap wrote) and every `waived` row of the tables has a ledger row bound to its sha, so a waiver typed into a
 *    table by hand fails on a clean checkout too;
 *  - the gate on the real art, which runs when `public/art` holds the characters (this tree's art is local: it is gitignored on main): no character painting
 *    without a fresh pose record or a waiver. About a minute for the 1,106 paintings of the r50 art. The ledger is also held to the one at the last deployed
 *    sha (`lastDeployedSha`, when git has it; `POSE_GATE_BASE=<git ref>` names another): no legacy row added since, and a ref git cannot read fails rather than skips.
 *
 * When this fails, run `node tools/pose-gate.mjs --check` for the same lines, and read `tools/pose-gate-lib.mjs` for what each code means.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lastDeployedSha } from '../../../tools/critic-plan.mjs';
import { loadDecisionWords, loadLedger, loadLedgerAtRef, validateLedger, waivedRowsWithoutLedger } from '../../../tools/pose-gate-ledger.mjs';
import { loadModelInputs } from '../../../tools/posescale/pose-model.mjs';
import { ROOT } from './pose-gate-fixtures.ts';

const haveArt = existsSync(join(ROOT, 'public', 'art', 'characters'));
/** The last deployed sha when this checkout has it (a shallow clone may not), else nothing: the ratchet then rests on the seal pinned in tools/pose-gate-ledger.mjs. */
function lastDeployed(): string | undefined {
  try {
    const sha = lastDeployedSha(ROOT);
    if (!sha) return undefined;
    execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], { cwd: ROOT, stdio: 'ignore' });
    return sha;
  } catch {
    return undefined;
  }
}
const BASE = process.env.POSE_GATE_BASE || lastDeployed();

describe('the waiver ledger and the compiled tables (no art needed)', () => {
  it('the ledger, when there is one, obeys its ratchet', () => {
    const L = loadLedger(ROOT);
    expect(L.error).toBeNull();
    if (!L.exists) return; // before the bootstrap: nothing is waived
    const at = BASE ? loadLedgerAtRef(ROOT, BASE) : null;
    expect(at?.message ?? null).toBeNull(); // a base git cannot read is a failure, not a skip
    expect(validateLedger(L.ledger, { base: at?.ledger ?? null, decisions: loadDecisionWords(ROOT) }).problems).toEqual([]);
  });

  it('every `waived` row of the registration tables has a ledger row bound to its painting\'s sha', async () => {
    const L = loadLedger(ROOT);
    const validated = L.exists ? validateLedger(L.ledger, { decisions: loadDecisionWords(ROOT) }) : { index: new Map() };
    const inputs = await loadModelInputs({ root: ROOT });
    expect(waivedRowsWithoutLedger(inputs.table, validated)).toEqual([]);
  });
});

// The gate runs in its own node process, not inside the test worker: the same code takes about a minute there and five under vitest's worker (large typed
// arrays and the image decoder's buffers pile up in a worker thread), and the command line is what the install and the deploy run.
describe.skipIf(!haveArt)('the pose gate on the real art (public/art)', () => {
  it("every character painting has a fresh pose record or a waiver that carries Bailey's own words", () => {
    const args = [join(ROOT, 'tools', 'pose-gate.mjs'), '--check', '--quiet', '--max', '40', ...(BASE ? ['--base', BASE] : [])];
    const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', timeout: 800_000, maxBuffer: 64 * 1024 * 1024 });
    const lines = r.stdout.split(/\r?\n/).filter((l) => l.startsWith('FAIL') || l.startsWith('...') || l.startsWith('pose-gate: FAIL'));
    expect({ status: r.status, stderr: r.stderr.trim(), failures: lines }).toEqual({ status: 0, stderr: '', failures: [] });
    expect(r.stdout).toMatch(/pose-gate: PASS/);
  }, 900_000);
});
