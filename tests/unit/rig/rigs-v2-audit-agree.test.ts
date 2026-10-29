/**
 * rigs-v2 (2026-10-29; both games, shared plumbing): `tools/rig/lane/party/move_audit.py` replays a key change with the engine's own numbers, so the engine and the audit must agree on them. Pinned here from the engine's side
 * (the audit's side is two lines of Python: `ease` and `n = ceil(ms / dt)`, `u = min(1, i * dt / ms)`): a settled figure moving into a key over `ms` ms takes one step a frame, its channel is `ease(u)` of the way at every frame, the frame
 * that reaches `u = 1` is the key itself, and the part state of the key it moves into takes over at progress 0.5 (`fadeMs` 0: a cut).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RigTransition } from '../../../src/engine/rig/RigKeys.ts';
import { partStateAt, STATE_FLIP } from '../../../src/engine/rig/RigPartState.ts';
import { ROOT } from '../tools/pose-gate-fixtures.ts';

const DT = 1 / 60;
const ease = (u: number): number => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) ** 2); // move_audit.py's `ease`
const audit = readFileSync(join(ROOT, 'tools/rig/lane/party/move_audit.py'), 'utf8');

describe('the audit and the engine agree on a key change', () => {
  it.each([33, 60, 70, 90, 110, 120, 140, 150, 220, 260, 420])('a settled move of %i ms: ease(i * dt / ms) every frame, the last one is the key, the frame count is ceil(ms / dt)', (ms) => {
    const t = new RigTransition(1, Float64Array.of(0));
    t.retarget(Float64Array.of(1), ms);
    const n = Math.ceil((ms / 1000) / DT - 1e-9);
    let frames = 0;
    while (t.busy && frames < 200) {
      frames++;
      t.step(DT);
      const u = Math.min(1, (frames * DT) / (ms / 1000));
      expect(t.current[0], `frame ${frames}`).toBeCloseTo(ease(u), 9);
    }
    expect(frames).toBe(n);
    expect(t.current[0]).toBe(1);
    expect(t.velocity[0]).toBe(0);
  });

  it('the part state is the old key\'s below progress 0.5 and the new key\'s from it (the flip the audit draws)', () => {
    const from = Int16Array.of(-1, 3);
    const to = Int16Array.of(2, -2);
    expect(STATE_FLIP).toBe(0.5);
    expect(partStateAt(from, to, 0.499, STATE_FLIP)).toBe(from);
    expect(partStateAt(from, to, 0.5, STATE_FLIP)).toBe(to);
    expect(partStateAt(from, to, 1, STATE_FLIP)).toBe(to);
  });

  it('the audit says it uses those numbers (a change to either side is a change to both)', () => {
    expect(audit).toContain('return 2 * u * u if u < 0.5 else 1 - 2 * (1 - u) ** 2');
    expect(audit).toContain('math.ceil(ms / DT - 1e-9)');
    expect(audit).toContain('u = min(1.0, i * DT / ms)');
    expect(audit).toContain('float(opt("--flip", 0.5))');
  });
});
