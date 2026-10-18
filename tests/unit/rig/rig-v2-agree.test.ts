/**
 * The gate and the runtime cannot disagree about which parts a pose shows (format v2): the same vectors go to the runtime's `RigPartState` (`partStateAt`, `keyState`) and to the gate's
 * `rig-pose.mjs` (`stateAt`, `keyState`), for every key and every pair of keys at every blend step the game can be at, and the two must name the same state. The gate's raster must also
 * draw what the state says (a hidden part leaves no pixels; a swapped variant's pixels replace the part's).
 */
import { describe, expect, it } from 'vitest';
import { readRig } from '../../../src/engine/rig/RigData.ts';
import { compileStates, describeState, keyState as runtimeKeyState, partStateAt, restState as runtimeRest } from '../../../src/engine/rig/RigPartState.ts';
import { normaliseRig } from '../../../tools/rig/rig-format.mjs';
import { keyState as gateKeyState, restState as gateRest, stateAt, visualOf } from '../../../tools/rig/rig-pose.mjs';
import { BLEND_STEPS } from '../../../tools/rig/rig-holes.mjs';
import { makeRigFileV2 } from './rig-v2-fixture.ts';

const file = makeRigFileV2();
const runtime = (() => {
  const r = readRig(file);
  if (!r.ok) throw new Error(r.reason);
  return r.data;
})();
const gate = (() => {
  const g = normaliseRig(JSON.parse(JSON.stringify(file)));
  if (!g.rt) throw new Error(JSON.stringify(g.problems));
  return g.rt;
})();

/** every step the gate samples, the ends, and a fine sweep around the flip */
const STEPS = [0, ...BLEND_STEPS, 1, 0.1, 0.2, 0.3, 0.4, 0.45, 0.49, 0.4999, 0.5, 0.5001, 0.51, 0.6, 0.7, 0.8, 0.9, 0.95];

describe('the gate and the runtime read the same state', () => {
  const names = Object.keys(file.keys);

  it('the rest state is the same, part for part', () => {
    expect(describeState(runtime, runtimeRest(runtime))).toEqual(gateRest(gate));
  });

  it('every key describes the same state (shown or hidden, which image)', () => {
    for (const n of names) {
      expect(describeState(runtime, runtimeKeyState(runtime, runtime.keys.get(n))), n).toEqual(gateKeyState(gate, gate.keys[n]));
    }
  });

  it('every move from one key to another is in the same state at every step, including either side of 0.5', () => {
    const states = compileStates(runtime);
    let checked = 0;
    for (const a of names) {
      for (const b of names) {
        for (const t of STEPS) {
          const r = describeState(runtime, partStateAt(states.get(a)!, states.get(b)!, t));
          const g = stateAt(gateKeyState(gate, gate.keys[a]), gateKeyState(gate, gate.keys[b]), t);
          expect(r, `${a} to ${b} at ${t}`).toEqual(g);
          checked++;
        }
      }
    }
    expect(checked).toBe(names.length * names.length * STEPS.length);
  });

  it('what the gate draws is what the state says: a hidden part is not drawn, a variant stands in for its part (its own mesh if it has one)', () => {
    const head = gate.parts.find((p: { name: string }) => p.name === 'head');
    expect(visualOf(head, gateKeyState(gate, gate.keys['attack']))).toBe(head.variants['back']);
    expect(visualOf(head, gateKeyState(gate, gate.keys['hurt']))).toBe(head.variants['wide']);
    expect(visualOf(head, gateRest(gate))).toBe(head);
    expect(head.variants['back'].verts).toBe(head.verts); // the same mesh
    expect(head.variants['wide'].verts).not.toBe(head.verts);
    const scar = gate.parts.find((p: { name: string }) => p.name === 'scar');
    expect(visualOf(scar, gateRest(gate))).toBeNull();
    expect(visualOf(scar, gateKeyState(gate, gate.keys['attack']))).toBe(scar);
    expect(visualOf(scar, undefined)).toBeNull(); // no state given: the rest state
    const arm = gate.parts.find((p: { name: string }) => p.name === 'arm');
    expect(visualOf(arm, gateKeyState(gate, gate.keys['hurt']))).toBeNull();
  });
});
