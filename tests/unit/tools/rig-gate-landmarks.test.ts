/**
 * **The rig gate's pose-intent rule** (the Kimahri lane, 2026-10-17; both games, shared plumbing; the driver's words). A key passes when BOTH hold: its silhouette overlaps the approved
 * painting of its pose by 0.75 or more (it was 0.85), AND its landmarks (`key.expect`, rig landmark name to a point in the approved painting's own 1x pixels, marked once per pose) are
 * each within 0.06 of the idle's height of the painting's. A painted key that names no landmarks fails; a key that cannot reach the overlap may be `source: "authored"` when its
 * landmarks agree, and is listed in `result.authored`, never passed silently; a painting that faces the other way from the rig is read turned (`turn: true`); a rig file may tighten
 * the bars, never loosen them. On the same puppet the other gate tests use (a head at (200, 150), a foot at (200, 450) in the idle painting).
 */
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import { gateRig, RIG_BANDS, type RigGateResult } from '../../../tools/rig/rig-gate-lib.mjs';
import { buildTargets } from '../../../tools/rig/rig-targets.mjs';
import { paintedHand, puppetWorld, SUBJECT } from './rig-gate-fixtures.ts';

vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const codes = (r: RigGateResult, pose?: string): string[] => r.failures.filter((x) => !pose || x.pose === pose).map((x) => x.code);

describe('landmark agreement', () => {
  it('passes a key whose landmarks are where the approved painting has them, and reports each as a share of the idle height', async () => {
    const w = await puppetWorld({ patch: (rig) => { rig.keys.idle.expect = { head: [200, 150], feet: [200, 450] }; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(r.failures).toEqual([]);
    const idle = r.keys.find((k) => k.pose === 'idle');
    expect(Object.keys(idle?.landmarks ?? {}).sort()).toEqual(['feet', 'head']);
    expect(idle?.landmarkMax).toBeLessThan(0.01);
    expect(r.acceptance).toEqual({ iou: 0.75, landmarkPct: 0.06 });
    expect(RIG_BANDS.iou).toBe(0.75);
    expect(RIG_BANDS.landmarkPct).toBe(0.06);
  });

  it('fails `key-landmark`, and only that, when a landmark is 40 px (about 0.12 of the height) off the painting\'s', async () => {
    const w = await puppetWorld({ patch: (rig) => { rig.keys.idle.expect = { head: [240, 150] }; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(r.status).toBe('refused');
    expect(codes(r)).toEqual(['key-landmark']);
    const f = r.failures[0]!;
    expect(f.pose).toBe('idle');
    expect(f.message).toContain('head is');
  });

  it('refuses a mark for a landmark the rig does not have', async () => {
    const w = await puppetWorld({ patch: (rig) => { rig.keys.idle.expect = { tail: [10, 10] }; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(codes(r, 'idle')).toEqual(['key-landmark']);
  });

  it('refuses a painted key that names no landmarks (`key-landmark-unmarked`): the overlap alone is not the rule', async () => {
    const w = await puppetWorld({ patch: (rig) => { delete rig.keys.attack.expect; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(r.status).toBe('refused');
    expect(codes(r)).toEqual(['key-landmark-unmarked']);
    expect(r.failures[0]?.pose).toBe('attack');
  });

  it('the costume\'s own rest pose needs no marks (it is the painting)', async () => {
    const w = await puppetWorld();
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(r.failures).toEqual([]);
    expect(r.keys.find((k) => k.pose === 'idle')?.landmarks).toBeUndefined();
  });
});

describe('the overlap bar is 0.75, and a rig file may tighten it, never loosen it', () => {
  it('holds a key at an overlap between 0.75 and 0.85, which the old bar refused, when its landmarks agree', async () => {
    const w = await puppetWorld({ patch: (rig) => { rig.keys.attack.root = { dx: 7 }; rig.keys.attack.expect = { head: [207, 150], feet: [207, 450] }; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    const attack = r.keys.find((k) => k.pose === 'attack');
    expect(attack?.iou).toBeGreaterThanOrEqual(0.75);
    expect(attack?.iou).toBeLessThan(0.85);
    expect(codes(r, 'attack')).not.toContain('key-iou');
  });

  it('a rig that says 0.5 and 0.5 is still held to 0.75 and 0.06; one that says 0.99 is held to 0.99', async () => {
    const loose = await puppetWorld({ patch: (rig) => { rig.keys.attack.root = { dx: 22 }; rig.acceptance = { iou: 0.5, landmarkPct: 0.5 }; } });
    const a = await gateRig({ rig: loose.rig, inputs: loose.inputs, blends: false });
    expect(codes(a, 'attack')).toContain('key-iou'); // about 0.6: under the gate's 0.75, whatever the file says
    expect(codes(a, 'attack')).toContain('key-landmark'); // 22 px off the painting's marks: 0.067 of the height, over 0.06
    expect(a.acceptance).toEqual({ iou: 0.75, landmarkPct: 0.06 });
    const tight = await puppetWorld({ patch: (rig) => { rig.acceptance = { iou: 0.99, landmarkPct: 0.01 }; } });
    const b = await gateRig({ rig: tight.rig, inputs: tight.inputs, blends: false });
    expect(b.acceptance).toEqual({ iou: 0.99, landmarkPct: 0.01 });
    expect(codes(b, 'attack')).toContain('key-iou'); // the painter's wobble keeps the puppet under 0.99
  });

  it('a rig that asks for a looser landmark tolerance (0.2) is still held to 0.06', async () => {
    const w = await puppetWorld({ patch: (rig) => { rig.keys.idle.expect = { head: [240, 150] }; rig.acceptance = { landmarkPct: 0.2 }; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(codes(r)).toEqual(['key-landmark']);
    expect(r.acceptance?.landmarkPct).toBe(0.06);
  });
});

describe('authored keys', () => {
  it('waive the overlap, demand the landmarks, and are listed (never silent)', async () => {
    // the idle key moved 15 px sideways: the silhouette no longer makes the painting (overlap about 0.7), the head is still 0.045 of the height from where the painting has it
    const w = await puppetWorld({ patch: (rig) => { rig.keys.idle = { bones: {}, root: { dx: 15 }, source: 'authored', expect: { head: [200, 150] } }; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(r.failures).toEqual([]);
    expect(r.authored).toEqual(['idle']);
    const idle = r.keys.find((k) => k.pose === 'idle');
    expect(idle?.authored).toBe(true);
    expect(idle?.iou).toBeLessThan(RIG_BANDS.iou); // the overlap bar is not met, and an authored key says so
    expect(idle?.landmarks?.head).toBeGreaterThan(0.03);
    expect(idle?.landmarks?.head).toBeLessThan(0.06);
  });

  it('are refused when they name no landmarks: nothing would say they are the pose', async () => {
    const w = await puppetWorld({ patch: (rig) => { rig.keys.idle = { bones: {}, root: { dx: 15 }, source: 'authored' }; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(r.status).toBe('refused');
    expect(codes(r, 'idle')).toEqual(['key-authored-unverified']);
  });

  it('are refused when their landmarks are off', async () => {
    const w = await puppetWorld({ patch: (rig) => { rig.keys.idle = { bones: {}, root: { dx: 40 }, source: 'authored', expect: { head: [200, 150] } }; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(codes(r, 'idle')).toEqual(['key-landmark']);
  });

  it('a painted key keeps its overlap bar: `source` of a painting is not a way round it', async () => {
    const w = await puppetWorld({ patch: (rig) => { rig.keys.attack.root = { dx: 22 }; rig.keys.attack.expect = { head: [200, 150] }; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(codes(r, 'attack')).toContain('key-iou');
    expect(r.authored).toEqual([]);
  });
});

describe('a painting that faces the other way from the rig (`turn: true`)', () => {
  /** The puppet's attack painting drawn the other way (its file flipped about the stance), and a hand landmark on the forearm: marks stay the painting's own pixels. */
  async function flippedWorld(turn: boolean) {
    const w = await puppetWorld({
      patch: (rig) => {
        rig.landmarks.hand = { bone: 5, x: 235, y: 335 };
        const [hx, hy] = paintedHand('attack');
        const marks = rig.keys.attack.expect as Record<string, [number, number]>;
        rig.keys.attack.expect = { head: [400 - marks.head![0], marks.head![1]], feet: [400 - marks.feet![0], marks.feet![1]], hand: [400 - hx, hy] }; // the painting's own px: flipped
        if (turn) rig.keys.attack.turn = true;
        rig.keys.idle.expect = undefined;
      },
    });
    const file = join(w.art, 'characters', SUBJECT, 'attack.png');
    const flipped = await sharp(file).flop().png().toBuffer();
    await sharp(flipped).toFile(file);
    return w;
  }

  it('is read against the painting turned about its stance: the same overlap and the same marks as the painting the right way round', async () => {
    const plain = await puppetWorld({ patch: (rig) => { const [hx, hy] = paintedHand('attack'); rig.landmarks.hand = { bone: 5, x: 235, y: 335 }; rig.keys.attack.expect = { ...rig.keys.attack.expect, hand: [hx, hy] }; } });
    const right = await gateRig({ rig: plain.rig, inputs: plain.inputs, blends: false });
    const w = await flippedWorld(true);
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(r.turned).toEqual(['attack']);
    expect(r.keys.find((k) => k.pose === 'attack')?.turned).toBe(true);
    const a = right.keys.find((k) => k.pose === 'attack')!;
    const b = r.keys.find((k) => k.pose === 'attack')!;
    expect(Math.abs((b.iou as number) - (a.iou as number))).toBeLessThan(0.02);
    expect(Math.abs((b.landmarks?.hand as number) - (a.landmarks?.hand as number))).toBeLessThan(0.01);
    expect(codes(r, 'attack')).toEqual([]);
  });

  it('is judged on the file as it is when the key does not say `turn`: the marks and the overlap read as the other way round', async () => {
    const w = await flippedWorld(false);
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(r.turned).toEqual([]);
    expect(codes(r, 'attack')).toContain('key-landmark'); // the hand is far from where the unturned flip has it
  });
});

describe('a target turned about its stance (rig-targets `turn`, the fitter\'s side of the same rule)', () => {
  it('is the same painting registered the other way: the same size, `place` with the mirror turned, its centre of mass reflected about the stance', async () => {
    const w = await puppetWorld();
    const plain = await buildTargets({ inputs: w.inputs, subject: SUBJECT, scale: 1 });
    const turned = await buildTargets({ inputs: w.inputs, subject: SUBJECT, scale: 1, turn: ['attack'] });
    expect(turned.info.poses.attack?.mirroredTarget).toBe(true);
    expect(turned.info.poses.hurt?.mirroredTarget).toBeUndefined();
    const pp = plain.info.poses.attack!.place;
    expect(turned.info.poses.attack?.place).toEqual({ ...pp, mirror: -pp.mirror }); // a mark is the painting's own px, read through the placement of the turned painting, as the gate reads it
    expect(turned.info.poses.hurt?.place).toEqual(plain.info.poses.hurt?.place);
    expect(turned.masks.hurt).toEqual(plain.masks.hurt); // a pose not named is untouched
    const { GS, GW, GU0 } = plain.info.grid;
    const centre = (m: Uint8Array): { x: number; n: number } => { let sx = 0; let n = 0; m.forEach((v, i) => { if (v) { sx += i % GW; n++; } }); return { x: sx / n, n }; };
    const a = centre(plain.masks.attack!);
    const b = centre(turned.masks.attack!);
    expect(b.n / a.n).toBeGreaterThan(0.98);
    expect(b.n / a.n).toBeLessThan(1.02);
    const p = plain.info.poses.attack!;
    const stanceX = ((p.feetPx!.x - p.place.W / 2) * p.place.upp * p.place.mirror + p.place.shift - GU0) * GS; // the stance on the grid
    expect(Math.abs(b.x + a.x - 2 * stanceX)).toBeLessThan(2); // reflected about it, to a cell or two (the model rounds the stance and the painting to cells)
    expect(Math.abs(b.x - a.x)).toBeGreaterThan(2); // and not the same mask
  });
});
