/**
 * **A format v1 rig draws exactly as it did before format v2** (2026-10-18): the real rigs on this disk (`D:/pyrefly-art-rigs/kimahri` and `lulu`, read only; the test is skipped where they are not), every
 * key of each, through the real `RigActor` (stand-in textures, no GPU). For each key a fresh actor is posed there at once and run for six seconds of 60 Hz frames (the idle sway and the lag chains
 * running, as in the game), and one hash is taken of everything the rig hands the GPU: every part mesh's skinned positions (float bits), its depth and its visibility, in draw order.
 *
 * The golden file (`tests/fixtures/rig/v1-geometry-golden.json`) was written by the SAME test run against the engine BEFORE format v2 (origin/rig 59c766ec0) with \`RIG_V1_GOLDEN=write\`; this run must
 * match it for all 26 keys. (A headless browser run of the same poses on both engines, with the pixel diff, is in docs/handoff/rig-v2-and-kit.md.)
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Texture } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { ROOT } from '../tools/pose-gate-fixtures.ts';

vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const { RigActor } = await import('../../../src/engine/rig/RigActor.ts');
const { readRig } = await import('../../../src/engine/rig/RigData.ts');
type Painted = import('../../../src/engine/PaintedArt.ts').PaintedTexture;
type RigActorT = import('../../../src/engine/rig/RigActor.ts').RigActor;

const GOLDEN = join(ROOT, 'tests', 'fixtures', 'rig', 'v1-geometry-golden.json');
const RIGS = ['kimahri', 'lulu'].filter((n) => existsSync(`D:/pyrefly-art-rigs/${n}/rig.json`));

/** FNV-1a over the float bits of what a rig hands the GPU. */
function hashFigure(a: RigActorT): string {
  let h = 2166136261 >>> 0;
  const f32 = new Float32Array(1);
  const u32 = new Uint32Array(f32.buffer);
  const mix = (n: number): void => {
    h = Math.imul(h ^ n, 16777619) >>> 0;
  };
  for (const m of a.figure.plane.children as unknown as Array<{ visible: boolean; position: { z: number }; geometry: { getAttribute(n: string): { array: Float32Array } } }>) {
    mix(m.visible ? 1 : 0);
    f32[0] = m.position.z;
    mix(u32[0]!);
    const pos = m.geometry.getAttribute('position').array;
    mix(pos.length);
    for (let i = 0; i < pos.length; i++) {
      f32[0] = pos[i]!;
      mix(u32[0]!);
    }
  }
  return h.toString(16);
}

async function hashes(name: string): Promise<Record<string, string>> {
  const raw = JSON.parse(readFileSync(`D:/pyrefly-art-rigs/${name}/rig.json`, 'utf8')) as { image: { w: number; h: number }; baselineY: number };
  const r = readRig(raw);
  if (!r.ok) throw new Error(r.reason);
  const out: Record<string, string> = {};
  for (const key of [...r.data.keys.keys()].sort()) {
    const idle: Painted = { texture: new Texture(), meta: { width: raw.image.w, height: raw.image.h, baselineY: raw.baselineY }, placeholder: false, url: `/art/characters/${name}/idle.png` };
    const a = await RigActor.createRigged({ name, worldHeight: 1.82, side: 'party', shadow: false }, { data: r.data, base: `/art/rigs/${name}`, idlePainting: idle, loadTexture: async () => new Texture() });
    a.setPose(key, { immediate: true });
    for (let i = 0; i < 360; i++) a.update(1 / 60);
    out[key] = hashFigure(a);
    a.dispose();
  }
  return out;
}

describe.skipIf(RIGS.length === 0)('the real v1 rigs through RigActor', () => {
  it.each(RIGS)('%s: every key hands the GPU the same positions, depth order and visibility as the engine before format v2', async (name) => {
    const now = await hashes(name);
    expect(Object.keys(now).length).toBeGreaterThanOrEqual(13);
    if (process.env['RIG_V1_GOLDEN'] === 'write') {
      const had = existsSync(GOLDEN) ? (JSON.parse(readFileSync(GOLDEN, 'utf8')) as Record<string, unknown>) : {};
      mkdirSync(dirname(GOLDEN), { recursive: true });
      writeFileSync(GOLDEN, `${JSON.stringify({ ...had, [name]: now }, null, 1)}\n`);
      return;
    }
    const golden = JSON.parse(readFileSync(GOLDEN, 'utf8')) as Record<string, Record<string, string>>;
    expect(golden[name], `no golden for ${name}: RIG_V1_GOLDEN=write on the engine before format v2`).toBeDefined();
    expect(now).toEqual(golden[name]);
  });
});
