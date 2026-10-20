/**
 * Pass 3's KO (`?anim=proto&style=P3`; FFX Lulu; the knee's maths is plumbing for any rig): the fold. The skirt below the knee is bent about a hinge under the pelvis (`AnimBend.ts`), the clock is pass 2's (65
 * frames, the floor on frame 37), the knees give and the hem is planted from the kneel to the floor (pass 2 slid the body 0.35 world units while it rotated), the lowest point of the posed rig stays within a hand's
 * breadth of the floor while it folds, the body does not tip as a plank (the root turns a little at the slump; the spine and the skirt do the folding), and the last pose is the KO key exactly.
 * Measured with the gate's own skinning (`tools/rig/lane/anim-measure.mjs`), on Lulu's real rig where the disk has it.
 */
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Texture } from 'three';
import { PartBend, type BendSpec } from '../../../src/engine/rig/anim/AnimBend.ts';
import { compileClip, markTime, sampleClip, unwrapTargets } from '../../../src/engine/rig/anim/AnimClip.ts';
import { libraryFor } from '../../../src/engine/rig/anim/AnimLibrary2.ts';
import { frameMs } from '../../../src/engine/rig/anim/AnimRE.ts';
import { STYLE_P2, STYLE_P3 } from '../../../src/engine/rig/anim/AnimStyles.ts';
import { LULU, LULU_ACCENTS } from '../../../src/engine/rig/anim/LuluAnim.ts';
import { LULU_KNEE } from '../../../src/engine/rig/anim/LuluAnim3.ts';
import { measurer } from '../../../tools/rig/lane/anim-measure.mjs';
import { skinBent, toGatePose } from '../../../tools/rig/lane/anim-draw.mjs';
import { solve } from '../../../tools/rig/rig-pose.mjs';
import { HAVE_RIG, LULU_V2, near } from './anim-pass2-fixture.ts';

vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const SPEC: BendSpec = { parts: ['skirt'], carrier: 'pelvis', y0: 100, y1: 200, hx: 50, hy: 150, whole: 0.5, flat: 0.3, lift: 0 };

describe('the knee (AnimBend)', () => {
  /** A column of vertices at x 50 from y 0 to 400, and the identity skin matrix for the carrier (bone 0) and for another bone. */
  const verts = Float32Array.from(Array.from({ length: 9 }, (_, i) => [50, i * 50]).flat());
  const identity = (): Float64Array => Float64Array.from([1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0]);
  const run = (bend: number, k = identity()): Array<{ x: number; y: number }> => {
    const pb = new PartBend(verts, SPEC, 0);
    pb.prepare(k, bend);
    const o = { x: 0, y: 0 };
    return Array.from({ length: 9 }, (_, i) => {
      pb.at(i, verts[i * 2]!, verts[i * 2 + 1]!, o);
      return { ...o };
    });
  };
  it('does nothing at a bend of 0, bit for bit, and nothing above the knee at any bend', () => {
    const none = run(0);
    for (let i = 0; i < 9; i++) expect(none[i]).toEqual({ x: verts[i * 2], y: verts[i * 2 + 1] });
    const bent = run(1.2);
    for (let i = 0; i < 2; i++) expect(bent[i]).toEqual({ x: verts[i * 2], y: verts[i * 2 + 1] }); // y 0 and 50: above y0
  });
  it('turns what is below the knee back about the hinge: a quarter turn lays the lower skirt behind (to -x), flat', () => {
    const bent = run(Math.PI / 2);
    const last = bent[8]!; // bind (50, 400): 250 below the hinge at y 150
    expect(last.x).toBeLessThan(SPEC.hx - 200); // it lies to the left of the knee, as long as it was below it
    expect(Math.abs(last.y - SPEC.hy)).toBeLessThan(10); // on the knee's line
    expect(bent[8]!.x).toBeLessThan(bent[4]!.x); // the further down, the further back
  });
  it('is continuous: a vertex just below the ramp\'s start has hardly moved, and the bend grows smoothly with the angle', () => {
    const a = run(0.01)[2]!; // y 100 is the ramp's start
    near(a.x, 50, 0.01);
    near(a.y, 100, 0.01);
    const xs = [0, 0.2, 0.4, 0.8, 1.2, 1.5].map((b) => run(b)[8]!.x);
    for (let i = 1; i < xs.length; i++) expect(xs[i]!).toBeLessThanOrEqual(xs[i - 1]! + 1e-9);
  });
  it('is driven by the carrier\'s skin matrix: a pelvis that drops carries the knee down with it', () => {
    const drop = Float64Array.from([1, 0, 0, 1, 0, 300, 1, 0, 0, 1, 0, 0]); // the carrier moved 300 down
    const bent = run(1.0, drop);
    const plain = run(1.0);
    expect(bent[8]!.y).toBeGreaterThan(plain[8]!.y + 100); // the hinge dropped with the pelvis (a full leg's carry at this bend)
  });
});

const real = HAVE_RIG ? describe : describe.skip;

real("the KO that folds, on Lulu's real rig", () => {
  type Meas = Awaited<ReturnType<typeof measurer>>;
  type Clip = { c: ReturnType<typeof compileClip>; at: (t: number) => Float64Array };
  let m!: Meas;
  let p2!: Meas;
  let k3!: Clip;
  let k2!: Clip;
  let bones = 0;
  let skirt!: { verts: Float32Array | number[] };
  let kneeIdx = 0;
  const clip = (style: typeof STYLE_P3, ms: Meas): Clip => {
    const lib = libraryFor(style, LULU_ACCENTS, LULU.p2, undefined, LULU.p3);
    const c = compileClip(ms.rig, lib.ko);
    const from = ms.rig.keys.get('hurt')!;
    const targets = unwrapTargets(c, from);
    const at = (t: number): Float64Array => {
      const out = new Float64Array(ms.rig.channels);
      sampleClip(c, Math.min(t, c.total), from, out, undefined, targets, { alive: 1, sec: 1, seg: 0, e: 1 });
      return out;
    };
    return { c, at };
  };
  const kneeX = (ms: Meas, ch: Float64Array): number => {
    const gp = toGatePose(ch, ms.rt.bones.length);
    const { k } = solve(ms.rt, gp);
    const out = new Float64Array(skirt.verts.length);
    skinBent(ms.rt, skirt, k, gp, out);
    return out[kneeIdx * 2]!;
  };
  beforeAll(async () => {
    m = await measurer(LULU_V2, LULU_KNEE);
    p2 = await measurer(LULU_V2);
    k3 = clip(STYLE_P3, m);
    k2 = clip(STYLE_P2, p2);
    bones = m.rt.bones.length;
    skirt = m.rt.parts.find((p) => p.name === 'skirt')!;
    let d = Infinity;
    for (let i = 0; i < skirt.verts.length / 2; i++) {
      const e = Math.hypot(skirt.verts[i * 2]! - LULU_KNEE.hx, skirt.verts[i * 2 + 1]! - LULU_KNEE.hy);
      if (e < d) {
        d = e;
        kneeIdx = i;
      }
    }
  });

  it("keeps pass 2's clock: 65 frames, the floor on frame 37, and ends on the KO key exactly (no bend left in it)", () => {
    near(k3.c.total, frameMs(65), 0.5);
    near(markTime(k3.c, 'ground'), frameMs(37), 0.5);
    near(markTime(k3.c, 'end'), frameMs(65), 0.5);
    const end = k3.at(k3.c.total + 5);
    const ko = m.rig.keys.get('ko')!;
    for (let i = 0; i < ko.length; i++) near(end[i]!, ko[i]!, 1e-9);
    expect(end[bones * 5]).toBe(0);
  });
  it('the marks of the fold come in order: struck, knees, kneel, slump, tipping, ground, end', () => {
    const order = ['struck', 'knees', 'kneel', 'slump', 'tipping', 'ground', 'end'].map((n) => markTime(k3.c, n));
    for (let i = 1; i < order.length; i++) expect(order[i]!).toBeGreaterThan(order[i - 1]!);
  });
  it("FOLDS rather than tips: at the slump the root has turned 0.1 rad (pass 2's tip had it at 0.5) while the spine, chest and head have folded forward 1.3 rad between them and the skirt below the knee lies back", () => {
    const at = k3.at(markTime(k3.c, 'slump'));
    const idle = m.rig.keys.get('idle')!;
    const idx = (n: string): number => m.rig.boneIndex.get(n)! * 5;
    const rootBone = m.rig.roots[0]! * 5;
    expect(Math.abs(at[rootBone]!)).toBeLessThan(0.2);
    const fold = ['spine', 'chest', 'head'].reduce((sum, n) => sum + at[idx(n)]! - idle[idx(n)]!, 0);
    expect(fold).toBeGreaterThan(1.3);
    expect(at[bones * 5]!).toBeGreaterThan(1.3); // the knee's bend
    const p2at = k2.at(900); // pass 2's first half of the tip: the root has gone 0.5 rad over
    expect(Math.abs(p2at[rootBone]!)).toBeGreaterThan(0.4);
  });
  it("the hem is PLANTED: from the kneel to the floor the knee moves under 130 px (0.1 world unit); pass 2 slid more than 300", () => {
    const a = kneeX(m, k3.at(markTime(k3.c, 'kneel')));
    const b = kneeX(m, k3.at(markTime(k3.c, 'ground')));
    expect(Math.abs(a - b)).toBeLessThan(130);
    const a2 = kneeX(p2, k2.at(markTime(k2.c, 'ground') - frameMs(17)));
    const b2 = kneeX(p2, k2.at(markTime(k2.c, 'ground')));
    expect(Math.abs(a2 - b2)).toBeGreaterThan(300);
  });
  it('the lowest point of the posed rig stays within 50 px above and 45 below the floor from the first frame after the blow to the floor (every 50 ms)', () => {
    for (let t = 100; t <= 1233; t += 50) {
      const r = m.pose(k3.at(t));
      const above = m.baselineY - r.low;
      expect(above, `t ${t}`).toBeLessThanOrEqual(50);
      expect(above, `t ${t}`).toBeGreaterThanOrEqual(-45);
    }
  });
});

real('the actor plays the fold: the knee turns on through the clip and is wound out at its end', () => {
  const make = async (style: typeof STYLE_P3 | null) => {
    const { RigActor } = await import('../../../src/engine/rig/RigActor.ts');
    const { readRig } = await import('../../../src/engine/rig/RigData.ts');
    const r = readRig(JSON.parse(readFileSync(`${LULU_V2}/rig.json`, 'utf8')));
    if (!r.ok) throw new Error(r.reason);
    return RigActor.createRigged({ name: 'lulu', worldHeight: 1.82, side: 'party', shadow: false }, { data: r.data, base: '/art/rigs/lulu', idlePainting: { texture: new Texture(), meta: { width: r.data.image.w, height: r.data.image.h, baselineY: r.data.baselineY }, placeholder: false, url: '/art/characters/lulu/idle.png' }, loadTexture: async () => new Texture(), anim: style });
  };
  it('P3: skin() is asked for a bend that rises past 1.3 rad and ends at 0; P2 and no style never bend', async () => {
    const a = await make(STYLE_P3);
    const spy = vi.spyOn(a.figure, 'skin');
    a.setPose('hurt');
    for (let i = 0; i < 30; i++) a.update(1 / 60);
    a.setPose('ko');
    for (let i = 0; i < 200; i++) a.update(1 / 60);
    const bends = spy.mock.calls.map((c) => c[0] ?? 0);
    expect(Math.max(...bends)).toBeGreaterThan(1.3);
    expect(bends.at(-1)).toBe(0);
    const b = await make(STYLE_P2);
    const spy2 = vi.spyOn(b.figure, 'skin');
    b.setPose('ko');
    for (let i = 0; i < 100; i++) b.update(1 / 60);
    expect(Math.max(...spy2.mock.calls.map((c) => c[0] ?? 0))).toBe(0);
    const c = await make(null);
    const spy3 = vi.spyOn(c.figure, 'skin');
    c.setPose('ko');
    for (let i = 0; i < 60; i++) c.update(1 / 60);
    expect(Math.max(...spy3.mock.calls.map((x) => x[0] ?? 0))).toBe(0);
  });
});
