/**
 * **The rig gate, on fixtures** (the rig program; both games). Bailey, 2026-10-17: "start rigging for all chapters please. i want a permanent fix now."
 * A rig ships only when `tools/rig-gate.mjs` says ok. The control passes; each case that follows is a rig that LOOKS fine in the file (it loads, its mesh is sound) and
 * must be refused by the pixels: a key that does not make its painting (overlap 0.6), a foot that floats, a hole at the elbow half way between two keys, a costume that
 * is not the approved master, a rig over the budget, a stamp that outlived the rig it vouched for.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { gateRig, stampRig, verifyStamp, type RigGateResult } from '../../../tools/rig/rig-gate-lib.mjs';
import { POSES, SUBJECT, addRectPart, paintPuppetArt, puppetInputs, puppetWorld, tempDir, writePuppetRig, type RigJson } from './rig-gate-fixtures.ts';

vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const codes = (r: RigGateResult, pose?: string): string[] => r.failures.filter((x) => !pose || x.pose === pose).map((x) => x.code);

describe('the control: a sound puppet rig is ok', () => {
  it('passes every key and every blend', async () => {
    const w = await puppetWorld();
    const r = await gateRig({ rig: w.rig, inputs: w.inputs });
    expect(r.failures).toEqual([]);
    expect(r.status).toBe('ok');
    expect(r.keys.map((k) => k.pose).sort()).toEqual(Object.keys(POSES).sort());
    for (const k of r.keys) expect(k.iou).toBeGreaterThan(0.9);
    expect(r.rest?.iou).toBeGreaterThan(0.99);
    expect(r.holes?.rendered).toBeGreaterThan(20);
  });
});

describe('a key that does not make its painting', () => {
  it('fails `key-iou` at an overlap of about 0.6', async () => {
    const w = await puppetWorld({ patch: (rig) => { rig.keys.attack.root = { dx: 22 }; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(r.status).toBe('refused');
    expect(codes(r, 'attack')).toContain('key-iou');
    const k = r.keys.find((x) => x.pose === 'attack');
    expect(k?.iou).toBeGreaterThan(0.5);
    expect(k?.iou).toBeLessThan(0.7);
  });
});

describe('a foot that floats', () => {
  it('fails `key-feet-y` and nothing else when the rig is lifted 14 px off the ground', async () => {
    const w = await puppetWorld({ patch: (rig) => { rig.keys.hurt.root = { dy: -14 }; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(r.status).toBe('refused');
    expect(codes(r, 'hurt')).toEqual(['key-feet-y']);
    expect(r.keys.find((x) => x.pose === 'hurt')?.iou).toBeGreaterThan(0.85); // it still makes the painting: only the feet are wrong
  });
});

describe('a hole at the elbow half way between two keys', () => {
  it('passes with the underlap (a cap over the joint)', async () => {
    const w = await puppetWorld({ cap: true, overlap: 0 });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs });
    expect(codes(r)).toEqual([]);
  });
  it('fails `hole-blend`, and only that, for a cap that rides the elbow along a chord while the elbow swings along an arc', async () => {
    // the cap is a free bone moved by explicit offsets (a shoulder pad, a hand-authored fix): at the two keys it sits exactly on the elbow, half way between them the
    // linear blend of its offset is a chord and the elbow is on an arc, 12 px apart, more than the cap's reach
    const swing = -2;
    const w = await puppetWorld({
      cap: false,
      overlap: 0,
      patch: async (rig, dir) => {
        rig.bones.push({ name: 'pad', parent: 0, x: 235, y: 270 });
        await addRectPart(dir, rig as { parts: RigJson[] }, { name: 'padcap', x: 220, y: 255, w: 30, h: 30, bone: 6, color: [184, 138, 96] });
        rig.keys = {
          idle: { bones: {}, source: 'art/characters/zz-puppet/idle.png' },
          reacha: { bones: { forearm: { rot: -51.566 } }, source: 'authored' },
          reachb: { bones: { upperarm: { rot: (swing * 180) / Math.PI }, forearm: { rot: -51.566 }, pad: { dx: -70 * Math.sin(swing), dy: 70 * Math.cos(swing) - 70 } }, source: 'authored' },
        };
      },
    });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs });
    expect(r.failures.filter((x) => x.code !== 'hole-blend')).toEqual([]);
    const between = r.failures.filter((x) => x.code === 'hole-blend' && x.pose === 'reacha>reachb');
    expect(between.some((x) => x.message.includes('50 percent') && x.message.includes('forearm'))).toBe(true);
    expect(r.keys.every((k) => k.ok)).toBe(true); // both keys are sound; only the road between them is not
  });
});

describe('the costume is the approved master', () => {
  it('fails `costume-stale` when the painting was repainted after the rig was cut', async () => {
    const w = await puppetWorld();
    const idle = join(w.art, 'characters', SUBJECT, 'idle.png');
    const sharp = (await import('sharp')).default;
    const buf = await sharp(idle).modulate({ brightness: 1.05 }).png().toBuffer();
    writeFileSync(idle, buf);
    const r = await gateRig({ rig: w.rig, inputs: await puppetInputs(w.art), blends: false });
    expect(codes(r)).toContain('costume-stale');
  });
  it('fails `baseline` when the rig plants its soles on another row than the painting is registered on', async () => {
    const w = await puppetWorld({ patch: (rig) => { rig.baselineY = 430; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(codes(r)).toContain('baseline');
  });
});

describe('the budget', () => {
  it('fails `budget-parts` over 24 parts', async () => {
    const w = await puppetWorld({ patch: (rig) => { const p = rig.parts[0]; for (let i = 0; i < 25; i++) rig.parts.push({ ...p, name: `copy${i}`, order: 10 + i }); } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(codes(r)).toContain('budget-parts');
  });
});

describe('the file', () => {
  it('names what is wrong with a rig whose triangles index nothing', async () => {
    const w = await puppetWorld({ patch: (rig) => { rig.parts[0].triangles = [0, 1, 999]; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(r.status).toBe('refused');
    expect(codes(r)).toContain('rig-part');
  });
  it('refuses a key on a bone that is not there', async () => {
    const w = await puppetWorld({ patch: (rig) => { rig.keys.attack.bones.tail = { rot: 1 }; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(codes(r)).toContain('rig-key');
  });
});

describe('the stamp', () => {
  it('writes ok into rig.json, verifies, and dies with the content', async () => {
    const w = await puppetWorld();
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(verifyStamp(w.rig).ok).toBe(false); // no stamp yet
    const g = stampRig(w.rig, r);
    expect(g.status).toBe('ok');
    expect(verifyStamp(w.rig).ok).toBe(true);
    const raw = JSON.parse(readFileSync(join(w.rig, 'rig.json'), 'utf8')) as RigJson;
    raw.keys.attack.bones.upperarm.rot = -0.5; // a hand edit after the gate
    writeFileSync(join(w.rig, 'rig.json'), JSON.stringify(raw));
    expect(verifyStamp(w.rig)).toMatchObject({ ok: false, code: 'gate-stale' });
  });
  it('a refused rig is stamped blocked, never ok', async () => {
    const w = await puppetWorld({ patch: (rig) => { rig.keys.attack.root = { dx: 22 }; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(stampRig(w.rig, r).status).toBe('blocked');
    expect(verifyStamp(w.rig).ok).toBe(false);
  });
});

describe('the helpers agree with themselves', () => {
  it('paints the same art twice to the same bytes (so a stale sha is the test\'s doing)', async () => {
    const a = tempDir('rig-twice-a-');
    const b = tempDir('rig-twice-b-');
    await paintPuppetArt(a);
    await paintPuppetArt(b);
    expect(readFileSync(join(a, 'characters', SUBJECT, 'idle.png')).equals(readFileSync(join(b, 'characters', SUBJECT, 'idle.png')))).toBe(true);
    void writePuppetRig;
  });
});
