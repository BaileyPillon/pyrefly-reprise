/**
 * MF-12 on a RIG (review F-5, 2026-10-27; both games: Seymour Flux and Bahamut are rigs): the plan's own rig measure, "boss-rig flutters (an idle key between two hurt keys under 100 ms): 7 to 0".
 * The REAL `RigActor` over the synthetic rig of the rig tests, a string of four blows `spacing` ms apart (the engine's round-robin spacing for a party-wide multi-hit is 450 to 570 ms per target), the
 * keys it shows counted. `?hurtstring=hold` holds the hurt key through the string and ends on the key today ends on.
 */
import { Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeRigFile } from './rig-fixture.ts';

vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const { RigActor } = await import('../../../src/engine/rig/RigActor.ts');
const { readRig } = await import('../../../src/engine/rig/RigData.ts');
const { STRING_HOLD_MS } = await import('../../../src/engine/motion/HitBeat.ts');
const { setPace, setPaceGame } = await import('../../../src/engine/pace.ts');
type Painted = import('../../../src/engine/PaintedArt.ts').PaintedTexture;
type RigActorT = import('../../../src/engine/rig/RigActor.ts').RigActor;

afterEach(() => {
  setPaceGame('other');
  setPace('steady');
});

const idlePainting = (): Painted => ({ texture: new Texture(), meta: { width: 400, height: 800, baselineY: 780 }, placeholder: false, url: '/art/characters/testfig/idle.png' });

async function boss(): Promise<RigActorT> {
  const r = readRig(makeRigFile());
  if (!r.ok) throw new Error(r.reason);
  const a = await RigActor.createRigged({ name: 'testfig', worldHeight: 1.82, side: 'enemy', shadow: false }, { data: r.data, base: '/art/rigs/testfig', idlePainting: idlePainting(), loadTexture: async () => new Texture() });
  a.position.set(2, 0, 0);
  a.setPose('idle', { immediate: true, force: true });
  for (let i = 0; i < 30; i++) a.update(1 / 60);
  return a;
}

/** The keys the rig shows over a string of `blows` blows `spacing` ms apart: [ms, key] at every change, and the idle-between-two-hurts count (under 100 ms, the plan's flutter). */
async function string(hold: boolean, spacing: number, hz = 120, blows = 4): Promise<{ keys: Array<[number, string]>; flutters: number; end: string }> {
  setPaceGame('ffx');
  const a = await boss();
  const dt = 1000 / hz;
  const keys: Array<[number, string]> = [];
  let last = '';
  const at = Array.from({ length: blows }, (_, i) => 100 + i * spacing);
  for (let t = 0; t < 100 + blows * spacing + 3500; t += dt) {
    at.forEach((when, i) => {
      if (t >= when && t < when + dt) void a.recoil(360, 0.22, undefined, hold && i < blows - 1 ? STRING_HOLD_MS : undefined);
    });
    a.update(dt / 1000);
    if (a.pose !== last) {
      keys.push([Math.round(t), a.pose]);
      last = a.pose;
    }
  }
  let flutters = 0;
  for (let i = 1; i + 1 < keys.length; i++) if (keys[i]![1] === 'idle' && keys[i - 1]![1] === 'hurt' && keys[i + 1]![1] === 'hurt' && keys[i + 1]![0] - keys[i]![0] < 100) flutters++;
  return { keys, flutters, end: last };
}

describe('MF-12 on a rig boss: no idle key between two hurt keys', () => {
  for (const spacing of [450, 520]) {
    for (const hz of [60, 120]) {
      it(`four blows ${spacing} ms apart at ${hz} Hz: today flutters, the hold does not, and both end on the same key`, async () => {
        const today = await string(false, spacing, hz);
        const held = await string(true, spacing, hz);
        if (process.env.MF_LOG) console.log('MF12-rig', spacing, hz, 'today flutters', today.flutters, 'hold flutters', held.flutters, 'ends', today.end, held.end, JSON.stringify(held.keys));
        expect(held.flutters).toBe(0);
        expect(held.end).toBe(today.end);
        expect(held.keys.filter(([, k]) => k === 'hurt').length).toBe(1); // one stay in hurt from the first blow to the last
      });
    }
  }
  it('today the string flutters at the engine\'s spacing (the plan\'s 7 are the Chapter I run, here a four-blow string)', async () => {
    const today = await string(false, 450);
    expect(today.flutters).toBeGreaterThanOrEqual(1);
  });
});
