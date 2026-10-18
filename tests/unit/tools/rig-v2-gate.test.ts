/**
 * **The rig gate and format v2** (2026-10-18; both games): a key may show or hide a part and swap a part's image for a variant. On the same SVG puppet as `rig-gate.test.ts`: a swapped head
 * passes and is reported; a key that hides the figure is refused (`hidden-share`); dead parts and variants are refused; a v1 file may not carry v2 fields; the budget, the stamp and the digest
 * count every variant; and a joint whose parts are all hidden in a pose is not watched there, which is what lets a key hide a limb instead of burying it.
 */
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import { normaliseRig, partImages, rigDigest, rigSize } from '../../../tools/rig/rig-format.mjs';
import { gateRig, stampRig, type RigGateResult } from '../../../tools/rig/rig-gate-lib.mjs';
import { verifyShippableRig } from '../../../tools/rig/rig-ship.mjs';
import { TIER_DIR, rigImageNames, textureSizes, writeTiers } from '../../../tools/rig/rig-tiers.mjs';
import { SUBJECT, addRectPart, puppetWorld, tempDir, type RigJson } from './rig-gate-fixtures.ts';

vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const codes = (r: RigGateResult, pose?: string): string[] => r.failures.filter((x) => !pose || x.pose === pose).map((x) => x.code);

/** A second image of the head: the same rectangle, another colour (a repaint of the same part). */
async function headVariant(dir: string, name = 'head.alt.png', color: [number, number, number] = [60, 90, 200]): Promise<void> {
  const w = 50;
  const h = 66;
  const buf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) { buf[i * 4] = color[0]; buf[i * 4 + 1] = color[1]; buf[i * 4 + 2] = color[2]; buf[i * 4 + 3] = 255; }
  await sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(join(dir, name));
}

const swapHead = async (rig: RigJson, dir: string): Promise<void> => {
  await headVariant(dir);
  rig.version = 2;
  rig.parts.find((p: RigJson) => p.name === 'head').variants = { alt: { png: 'head.alt.png' } };
  rig.keys.hurt.parts = { head: { image: 'alt' } };
};

describe('format v2 on the puppet: a swapped head', () => {
  it('passes, is reported with its palette distance, and counts in the size, the stamp and the digest', async () => {
    const w = await puppetWorld({ patch: swapHead });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs });
    expect(r.failures).toEqual([]);
    expect(r.status).toBe('ok');
    expect(r.variants).toHaveLength(1);
    expect(r.variants[0]).toMatchObject({ part: 'head', variant: 'alt' });
    expect(r.variants[0]!.distance).toBeGreaterThan(0.9); // a blue head for a skin-coloured one: nothing in common
    expect(r.size.variants).toBe(1);
    const gate = stampRig(r.rigDir, r);
    expect(Object.keys(gate.textures).sort()).toEqual(['elbow', 'forearm', 'head', 'head:alt', 'legs', 'torso', 'upperarm']);
    expect(gate.textures['head:alt']!.map).toEqual([50, 66]);
  });

  it('the budget counts the variant (a texture, bytes) and the digest binds its file', async () => {
    const plain = await puppetWorld();
    const swapped = await puppetWorld({ patch: swapHead });
    const a = rigSize(JSON.parse(readFileSync(join(plain.rig, 'rig.json'), 'utf8')), plain.rig);
    const b = rigSize(JSON.parse(readFileSync(join(swapped.rig, 'rig.json'), 'utf8')), swapped.rig);
    expect(b.texels - a.texels).toBe(50 * 66);
    expect(b.bytes).toBeGreaterThan(a.bytes);
    expect(b.verts).toBe(a.verts); // it uses the part's mesh: no vertices more
    expect(b.variants).toBe(1);
    const raw = JSON.parse(readFileSync(join(swapped.rig, 'rig.json'), 'utf8'));
    const d0 = rigDigest(raw, swapped.rig);
    await headVariant(swapped.rig, 'head.alt.png', [10, 10, 10]); // the variant's pixels change: the stamp is stale
    expect(rigDigest(raw, swapped.rig)).not.toBe(d0);
    expect(partImages(raw).map((p) => p.png)).toContain('head.alt.png');
    expect(Object.keys(textureSizes(raw, swapped.rig))).toContain('head:alt');
  });

  it('a variant with a mesh of its own is rasterised with it and counted in the vertices', async () => {
    const w = await puppetWorld({
      patch: async (rig, dir) => {
        await headVariant(dir, 'head.big.png');
        rig.version = 2;
        rig.parts.find((p: RigJson) => p.name === 'head').variants = { big: { png: 'head.big.png', box: [170, 114, 60, 78], bone: 3 } };
        rig.keys.hurt.parts = { head: { image: 'big' } };
      },
    });
    const raw = JSON.parse(readFileSync(join(w.rig, 'rig.json'), 'utf8'));
    expect(rigSize(raw, w.rig).verts).toBe(rigSize({ ...raw, parts: raw.parts.map((p: RigJson) => ({ ...p, variants: undefined })) }, w.rig).verts + 4);
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(codes(r, 'hurt')).not.toContain('rig-part');
    const hurt = r.keys.find((k) => k.pose === 'hurt')!;
    expect(hurt.iou).toBeGreaterThan(0.6); // a head 20 percent bigger than the painted one: the overlap shows it
  });
});

describe('format v2 on the puppet: what the gate refuses', () => {
  it('a key that hides the whole figure fails `hidden-share` (hiding is not a way to pass)', async () => {
    const all = Object.fromEntries(['legs', 'torso', 'head', 'upperarm', 'forearm', 'elbow'].map((n) => [n, { show: false }]));
    const w = await puppetWorld({ patch: (rig) => { rig.version = 2; rig.keys.hurt.parts = all; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(r.status).toBe('refused');
    expect(codes(r, 'hurt')).toContain('hidden-share');
    expect(r.keys.find((k) => k.pose === 'hurt')!.hiddenShare).toBeGreaterThan(0.9);
    expect(codes(r, 'hurt')).toContain('key-iou'); // and the overlap still judges the figure as drawn
  });

  it('a key that hides one arm is not refused for hiding it', async () => {
    const w = await puppetWorld({ patch: (rig) => { rig.version = 2; rig.keys.item.parts = { upperarm: { show: false }, forearm: { show: false }, elbow: { show: false } }; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(codes(r, 'item')).not.toContain('hidden-share');
    const share = r.keys.find((k) => k.pose === 'item')!.hiddenShare ?? 0;
    expect(share).toBeGreaterThan(0.05);
    expect(share).toBeLessThan(0.6);
  });

  it('dead data: a hidden part no key shows, and a variant no key uses', async () => {
    const w = await puppetWorld({
      patch: async (rig, dir) => {
        await addRectPart(dir, rig as { parts: RigJson[] }, { name: 'scar', x: 175, y: 200, w: 20, h: 20, bone: 2, color: [200, 30, 30] });
        rig.version = 2;
        rig.parts.find((p: RigJson) => p.name === 'scar').hidden = true;
        await headVariant(dir);
        rig.parts.find((p: RigJson) => p.name === 'head').variants = { alt: { png: 'head.alt.png' } };
      },
    });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(r.status).toBe('refused');
    expect(codes(r)).toEqual(expect.arrayContaining(['part-never-shown', 'variant-unused']));
    expect(r.failures.find((f) => f.code === 'part-never-shown')!.message).toContain('scar');
  });

  it('a hidden part a key shows is fine, and the rest figure still reproduces the painting without it', async () => {
    const w = await puppetWorld({
      patch: async (rig, dir) => {
        await addRectPart(dir, rig as { parts: RigJson[] }, { name: 'scar', x: 175, y: 200, w: 20, h: 20, bone: 2, color: [200, 30, 30] });
        rig.version = 2;
        rig.parts.find((p: RigJson) => p.name === 'scar').hidden = true;
        rig.keys.attack.parts = { scar: {} };
      },
    });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs });
    expect(r.failures).toEqual([]);
    expect(r.rest?.iou).toBeGreaterThan(0.99);
  });

  it('a key that swaps in a variant the part does not have is `variant-missing`', async () => {
    const w = await puppetWorld({ patch: (rig) => { rig.version = 2; rig.keys.hurt.parts = { head: { image: 'nope' } }; } });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(r.status).toBe('refused');
    expect(codes(r)).toContain('variant-missing');
  });

  it('a file that says version 1 and carries a v2 field is refused; the same file at version 2 is read', async () => {
    const w = await puppetWorld({ patch: swapHead });
    const raw = JSON.parse(readFileSync(join(w.rig, 'rig.json'), 'utf8'));
    expect(normaliseRig({ ...raw, version: 1 }, { dir: w.rig }).problems.map((p) => p.code)).toContain('rig-version');
    expect(normaliseRig(raw, { dir: w.rig }).problems).toEqual([]);
    expect(normaliseRig({ ...raw, version: 3 }, { dir: w.rig }).problems.map((p) => p.code)).toContain('rig-version');
  });

  it('a variant whose PNG is missing is refused as a missing file', async () => {
    const w = await puppetWorld({ patch: swapHead });
    const raw = JSON.parse(readFileSync(join(w.rig, 'rig.json'), 'utf8'));
    raw.parts.find((p: RigJson) => p.name === 'head').variants.alt.png = 'nothing.png';
    writeFileSync(join(w.rig, 'rig.json'), JSON.stringify(raw));
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(codes(r)).toContain('rig-file');
  });
});

describe('format v2 and the hole scan', () => {
  const bare = { cap: false, overlap: 0 }; // the elbow's tubes abut with no underlap: half way through a fold the joint opens

  it('a joint none of whose parts is shown in a pose is not watched there: keys that hide the arm owe nothing at the elbow between them (and still owe it on the way from and to a key that shows it)', async () => {
    const between = (f: { code: string; pose?: string }): boolean => f.code === 'hole-blend' && /^(attack|hurt|item)>(attack|hurt|item)$/.test(f.pose ?? '');
    const open = await puppetWorld({ ...bare });
    const a = await gateRig({ rig: open.rig, inputs: open.inputs });
    expect(a.failures.filter(between).length).toBeGreaterThan(0); // the control: the bare elbow does open (a fold half way)
    const arm = { upperarm: { show: false }, forearm: { show: false } };
    const shut = await puppetWorld({ ...bare, patch: (rig) => { rig.version = 2; for (const k of ['attack', 'hurt', 'item']) rig.keys[k].parts = arm; } });
    const b = await gateRig({ rig: shut.rig, inputs: shut.inputs });
    expect(b.failures.filter(between)).toEqual([]);
    // the arm comes back at half way through the move to the idle (and goes at half way from it): a joint is still owed there, so the hole shows
    expect(b.failures.some((f) => f.code === 'hole-blend' && /^(idle>(attack|hurt|item)|(attack|hurt|item)>idle)$/.test(f.pose ?? ''))).toBe(true);
    expect(b.failures.filter((f) => f.code === 'hole-key')).toEqual([]);
  });

  it('a blend is scanned in the state the move is in: at exactly 50 percent between keys whose states differ both are scanned', async () => {
    const same = await puppetWorld();
    const s = await gateRig({ rig: same.rig, inputs: same.inputs });
    const swapped = await puppetWorld({ patch: swapHead });
    const t = await gateRig({ rig: swapped.rig, inputs: swapped.inputs });
    // hurt differs in state from the three other keys (idle, attack, item): one extra raster each at 50 percent
    expect((t.holes?.rendered ?? 0) - (s.holes?.rendered ?? 0)).toBe(3);
  });
});

describe('a format v2 rig ships: the 1x tier, the folder listing and the deploy check know the variants', () => {
  it('lists the variant among the image files, writes and proves its 1x twin, and refuses a stray file or a missing twin', async () => {
    const w = await puppetWorld({ patch: swapHead });
    const r = await gateRig({ rig: w.rig, inputs: w.inputs, blends: false });
    expect(r.failures).toEqual([]);
    stampRig(w.rig, r);
    await writeTiers(w.rig);
    const raw = JSON.parse(readFileSync(join(w.rig, 'rig.json'), 'utf8'));
    expect(rigImageNames(raw)).toContain('head.alt.png');
    expect(existsSync(join(w.rig, TIER_DIR, 'head.alt.png'))).toBe(true);
    const pub = tempDir('rig-pub-');
    cpSync(w.art, join(pub, 'art'), { recursive: true });
    cpSync(w.rig, join(pub, 'art', 'rigs', SUBJECT), { recursive: true });
    const dir = join(pub, 'art', 'rigs', SUBJECT);
    const check = async (): Promise<string[]> => (await verifyShippableRig({ dir, artDir: join(pub, 'art') })).problems.map((p) => p.code);
    expect(await check()).toEqual([]);
    rmSync(join(dir, TIER_DIR, 'head.alt.png'));
    expect((await check()).length).toBeGreaterThan(0); // the variant's twin is owed like any part's
  });
});
