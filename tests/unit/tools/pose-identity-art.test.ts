/**
 * **The ready-identity list is what the paintings say** (PR-0517; `tools/pose-identity.mjs`). Two halves, as the pose gate's tests are:
 *  - no art needed: every row of `src/data/art/readyIdentity.ts` names a ready painting of the FFX-2 table, and the sha it measured is that painting's sha (a repaint changes the sha: the row is then stale);
 *  - on the real art (this tree's art is local, `public/art` is gitignored on main): `node tools/pose-identity.mjs --check` passes, i.e. the paintings that fail the measure are exactly the rows.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { READY_IDENTITY_FAILS } from '../../../src/data/art/readyIdentity.ts';
import { POSE_REGISTRATION_FFX2 } from '../../../src/data/art/poseRegistrationFfx2.ts';
import { ROOT } from './pose-gate-fixtures.ts';

describe('the list against the pose table (no art needed)', () => {
  it('every row is a dress that has a ready painting in the FFX-2 table, measured at the sha the table has', () => {
    for (const [subject, row] of Object.entries(READY_IDENTITY_FAILS)) {
      const ready = POSE_REGISTRATION_FFX2[subject]?.['ready'];
      expect(ready, `${subject} has no ready row in the FFX-2 table`).toBeDefined();
      expect(ready!.sha?.slice(0, 16), `${subject}: the ready painting was changed since the identity measure read it: run node tools/pose-identity.mjs --write`).toBe(row.sha);
    }
  });
});

const haveArt = existsSync(join(ROOT, 'public', 'art', 'characters'));

describe.skipIf(!haveArt)('the list against the paintings (needs the art; about a minute)', () => {
  it('node tools/pose-identity.mjs --check passes', () => {
    const run = spawnSync(process.execPath, ['tools/pose-identity.mjs', '--check'], { cwd: ROOT, encoding: 'utf8', timeout: 240_000 });
    const tail = (run.stdout ?? '').split('\n').filter((l) => /^FAIL|pose-identity --check/.test(l)).join('\n');
    expect(run.status, tail || run.stderr).toBe(0);
  }, 250_000);
});
