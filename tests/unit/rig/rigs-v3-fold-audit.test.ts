/**
 * rigs-v3 (2026-10-29; both games, tooling only): `tools/rig/lane/party/fold_audit.mjs`, the offline audit that reads FOLDED PIECES (a visible piece drawn more than 35 degrees off the angle of the key its image was
 * painted in) where `move_audit.py` reads silhouettes. It imports the engine's own `RigTransition`, `partStateAt`, `RigSkeleton`, `foldMs` and `shortestWay`, so it cannot drift from what `RigActor.moveKey` plays; this
 * runs it on the synthetic pose-drawn rig of the rigs-v3 fixture (idle and a `cast` key whose chest turns 143 degrees) and reads what it says of the move, rule off and on.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { poseDrawnRig } from './rigs-v3-fixture.ts';

const ROOT = resolve(__dirname, '..', '..', '..');
const SCRIPT = join(ROOT, 'tools', 'rig', 'lane', 'party', 'fold_audit.mjs');

const made: string[] = [];
afterAll(() => { for (const d of made) rmSync(d, { recursive: true, force: true }); });

function audit(rule: 'on' | 'off', file: string): { summary: Record<string, number | string | boolean>; rows: Array<{ pair: string; keyMs: number; ms: number; frames: number; foldFrames: number; worstDeg: number; headStep: number }> } {
  const folder = mkdtempSync(join(tmpdir(), 'fold-audit-'));
  made.push(folder);
  const out = join(folder, `${rule}.json`);
  const r = spawnSync(process.execPath, ['--experimental-transform-types', '--no-warnings', SCRIPT, file, '--game', 'ffx2', '--rule', rule, '--out', out], { encoding: 'utf8', timeout: 60_000 });
  expect(r.status, r.stderr).toBe(0);
  return JSON.parse(readFileSync(out, 'utf8'));
}

describe('fold_audit.mjs on a pose-drawn rig', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fold-rig-'));
  made.push(dir);
  const file = join(dir, 'rig.json');
  writeFileSync(file, JSON.stringify(poseDrawnRig(true)));

  it('plays idle > cast and back as the engine does: the key\'s own 150 ms at x1.1 with the rule off (9 frames), 3 frames with it on', () => {
    const off = audit('off', file);
    const on = audit('on', file);
    expect(off.rows.map((r) => r.pair).sort()).toEqual(['cast>idle', 'idle>cast']); // the ko key is left out: it has its own run
    const a = off.rows.find((r) => r.pair === 'idle>cast')!;
    const b = on.rows.find((r) => r.pair === 'idle>cast')!;
    expect([a.keyMs, a.ms, a.frames]).toEqual([150, 150, 9]);
    expect([b.keyMs, b.ms, b.frames]).toEqual([150, 50, 3]);
    expect(b.foldFrames, 'a short move leaves fewer folded pieces on screen').toBeLessThan(a.foldFrames);
    expect(b.worstDeg).toBeLessThan(a.worstDeg);
    expect(on.summary['rule']).toBe(true);
    expect(off.summary['rule']).toBe(false);
  });

  it('reads a piece the audit can see turn: with the rule off a body turned 143 degrees shows frames more than 35 degrees off both drawings', () => {
    const off = audit('off', file);
    const a = off.rows.find((r) => r.pair === 'idle>cast')!;
    expect(a.foldFrames).toBeGreaterThanOrEqual(2);
    expect(a.worstDeg).toBeGreaterThan(60);
    expect(a.headStep).toBeGreaterThan(0);
  });
});
