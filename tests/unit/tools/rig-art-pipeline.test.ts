/**
 * **The rig's art goes through the art pipeline like any other art** (the rig program, 2026-10-17; both games, shared plumbing). A rig's part PNGs, rim masks and 1x twins live under
 * `public/art/rigs/<subject>/` of a release art mirror, so `tools/art-derive-lib.mjs` plans them as masters, `art-verify` proves what ships is their pixels, the reference audit and
 * `art-browser-load` see them, `artifact-manifest` hashes them, the privacy gate scans their `rig.json`, and the engine asks for exactly the file the build holds.
 * One fixture build is made once (the puppet's art, its rig with a soft-edged part, a flat rim mask, the 1x tier), and each gate is run over it.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import sharp from 'sharp';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { auditArtReferences, verifyShippedArt, verifyShippedSidecars } from '../../../tools/art-verify.mjs';
import { applyPlan, listMasterPngs, planArtDerivation, shippedList, webpName } from '../../../tools/art-derive-lib.mjs';
import { redactBuildSidecars } from '../../../tools/art-sidecar-redact.mjs';
import { planLoads } from '../../../tools/art-browser-load.mjs';
import { buildManifest as buildArtifactManifest } from '../../../tools/artifact-manifest.mjs';
import { scanBuildForLocalPaths } from '../../../tools/dist-local-paths.mjs';
import { writeManifest } from '../../../tools/gen/manifest.mjs';
import { gateRig, stampRig } from '../../../tools/rig/rig-gate-lib.mjs';
import { enforceBuiltRigs, enforceShippedRigs } from '../../../tools/rig/rig-ship.mjs';
import { writeTiers } from '../../../tools/rig/rig-tiers.mjs';
import { SUBJECT, puppetWorld, tempDir } from './rig-gate-fixtures.ts';

vi.setConfig({ testTimeout: 240_000, hookTimeout: 240_000 });

let pub: string;
let dist: string;
let plan: Awaited<ReturnType<typeof planArtDerivation>>;

const walk = (root: string): string[] => {
  const out: string[] = [];
  const go = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) go(join(d, e.name));
      else out.push(relative(root, join(d, e.name)).split(sep).join('/'));
    }
  };
  go(root);
  return out.sort();
};

beforeAll(async () => {
  // a rig whose torso has a soft edge (partly transparent texels: a PNG ships, recompressed, never a WebP) and whose elbow cap has a flat rim mask
  const w = await puppetWorld({
    patch: async (rig, dir) => {
      for (const part of rig.parts as Array<{ png: string; box: number[] }>) {
        const [w, h] = [part.box[2]!, part.box[3]!];
        const g = Buffer.alloc(w * h * 4);
        for (let i = 0; i < w * h; i++) { g[i * 4] = (i % w) * 3 % 256; g[i * 4 + 1] = Math.floor(i / w) * 2 % 256; g[i * 4 + 2] = 90; g[i * 4 + 3] = 255; }
        await sharp(g, { raw: { width: w, height: h, channels: 4 } }).png().toFile(join(dir, part.png));
      }
      const f = join(dir, 'torso.png');
      const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (x === 0 || y === 0 || x === info.width - 1 || y === info.height - 1) data[(y * info.width + x) * 4 + 3] = 200;
      await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(`${f}.tmp`);
      renameSync(`${f}.tmp`, f);
    },
  });
  const rigJson = join(w.rig, 'rig.json');
  const raw = JSON.parse(readFileSync(rigJson, 'utf8')) as { parts: Array<{ name: string; rim?: string }> };
  const elbow = raw.parts.find((p) => p.name === 'elbow')!;
  elbow.rim = 'elbow.rim.png';
  await sharp({ create: { width: 30, height: 30, channels: 3, background: { r: 255, g: 255, b: 255 } } }).png().toFile(join(w.rig, 'elbow.rim.png')); // flat white, 8-bit RGB
  const head = raw.parts.find((p) => p.name === 'head')!;
  head.rim = 'head.rim.png';
  const ramp = Buffer.alloc(50 * 66);
  for (let i = 0; i < ramp.length; i++) ramp[i] = (i * 7) % 256;
  await sharp(ramp, { raw: { width: 50, height: 66, channels: 1 } }).png().toFile(join(w.rig, 'head.rim.png')); // an 8-bit grey mask with a shape
  writeFileSync(rigJson, JSON.stringify(raw));
  stampRig(w.rig, await gateRig({ rig: w.rig, inputs: w.inputs, blends: false }));
  await writeTiers(w.rig);
  pub = tempDir('rig-art-pub-');
  cpSync(w.art, join(pub, 'art'), { recursive: true });
  cpSync(w.rig, join(pub, 'art', 'rigs', SUBJECT), { recursive: true });
  writeManifest(join(pub, 'art'), { now: '2026-10-17T00:00:00.000Z' } as never);
  // the build: a copy of public/ (the bundle is not part of this), the plan applied, the sidecars written
  dist = tempDir('rig-art-dist-');
  cpSync(join(pub), dist, { recursive: true });
  plan = await planArtDerivation({ publicDir: pub, cacheDir: tempDir('rig-art-cache-'), scope: 'exact', jobs: 2 });
  applyPlan(dist, plan);
  redactBuildSidecars(dist);
});

describe('the rig\'s files are art masters', () => {
  it('listMasterPngs finds every part PNG, rim mask and 1x twin under art/rigs, and nothing from outside', () => {
    const rels = listMasterPngs(pub).map((m) => m.rel).filter((r) => r.startsWith('art/rigs/'));
    expect(rels).toContain(`art/rigs/${SUBJECT}/head.png`);
    expect(rels).toContain(`art/rigs/${SUBJECT}/head.rim.png`);
    expect(rels).toContain(`art/rigs/${SUBJECT}/1x/head.png`);
    expect(rels).toContain(`art/rigs/${SUBJECT}/1x/head.rim.png`);
    expect(rels.length).toBe(2 * (6 + 2)); // six parts (the cap over the elbow included) and two rim masks, each at both tiers
  });
  it('plans them under the default scope: an opaque one as a lossless WebP, one with partly transparent texels as a recompressed PNG, nothing larger than its master', () => {
    const by = new Map(plan.entries.map((e) => [e.rel, e]));
    const torso = by.get(`art/rigs/${SUBJECT}/torso.png`)!;
    expect(torso.alpha).toBe('translucent');
    expect(torso.kind).not.toBe('webp');
    const legs = by.get(`art/rigs/${SUBJECT}/legs.png`)!;
    expect(legs.alpha).toBe('opaque');
    for (const e of plan.entries.filter((x) => x.rel.startsWith('art/rigs/'))) expect(e.shippedBytes, e.rel).toBeLessThanOrEqual(e.masterBytes);
  });
});

describe('the gates over the build', () => {
  it('art-derive verify: every shipped file is its master\'s pixels (a WebP only for a master every decoder draws the same), and the sidecar rule leaves rig.json alone', async () => {
    const r = await verifyShippedArt({ distDir: dist, publicDir: pub, listFile: join(pub, 'none.json') });
    expect(r.problems).toEqual([]);
    expect(r.ok).toBe(true);
    const sc = verifyShippedSidecars({ distDir: dist, publicDir: pub });
    expect(sc.problems).toEqual([]);
    expect(readFileSync(join(dist, 'art', 'rigs', SUBJECT, 'rig.json'))).toEqual(readFileSync(join(pub, 'art', 'rigs', SUBJECT, 'rig.json')));
  });
  it('the reference audit: nothing names an art file the build does not hold, with the rig\'s JSON in the build', () => {
    const a = auditArtReferences(dist);
    expect(a.problems).toEqual([]);
  });
  it('the privacy gate reads rig.json and finds no local path, no link, and no sidecar key to cut', () => {
    const r = scanBuildForLocalPaths(dist);
    expect(r.hits).toEqual([]);
    expect(r.scanned).toBeGreaterThan(0);
  });
  it('art-browser-load plans every rig file, as the file that ships for it, at its master\'s size', () => {
    const p = planLoads({ distDir: dist, publicDir: pub });
    expect(p.problems).toEqual([]);
    const rig = p.art.filter((a) => a.master?.startsWith('art/rigs/'));
    expect(rig).toHaveLength(16);
    for (const a of rig) {
      expect(existsSync(join(dist, a.rel)), a.rel).toBe(true);
      expect(a.width ?? 0, a.master ?? '').toBeGreaterThan(0);
    }
    expect(rig.some((a) => a.kind === 'webp')).toBe(true);
    expect(rig.some((a) => a.kind !== 'webp')).toBe(true);
  });
  it('the artifact manifest hashes and decode-checks them; a flat rim mask is a mask, a flat part is a blank picture', async () => {
    const m = await buildArtifactManifest(dist);
    expect(m.problems).toEqual([]);
    expect(Object.keys(m.files).filter((f) => f.startsWith(`art/rigs/${SUBJECT}/`))).toHaveLength(17); // sixteen images and rig.json
    // the flat white elbow mask shipped (as a WebP or a PNG) and passed
    expect(Object.keys(m.files).some((f) => /elbow\.rim\.(png|webp)$/.test(f))).toBe(true);
    // a blank PART is still refused
    const bad = tempDir('rig-flat-');
    mkdirSync(join(bad, 'art', 'rigs', SUBJECT), { recursive: true });
    await sharp({ create: { width: 8, height: 8, channels: 4, background: { r: 9, g: 9, b: 9, alpha: 1 } } }).png().toFile(join(bad, 'art', 'rigs', SUBJECT, 'head.png'));
    await sharp({ create: { width: 8, height: 8, channels: 3, background: { r: 255, g: 255, b: 255 } } }).png().toFile(join(bad, 'art', 'rigs', SUBJECT, 'head.rim.png'));
    const flat = await buildArtifactManifest(bad);
    expect(flat.problems).toEqual([`art/rigs/${SUBJECT}/head.png: decodes to a single flat colour`]);
  });
});

describe('the deploy\'s rig gate over the build, and the engine against it', () => {
  it('passes the build that holds exactly the verified rig, a derived WebP included', async () => {
    const verified = await enforceShippedRigs({ publicDir: pub, log: () => {}, fail: (m: string) => { throw new Error(m); } });
    const copy = tempDir('rig-art-dist2-');
    cpSync(dist, copy, { recursive: true });
    const manifest = JSON.parse(readFileSync(join(pub, 'art', 'manifest.json'), 'utf8')) as { rigs?: string[]; rigTiers?: object };
    expect(manifest.rigs).toEqual([SUBJECT]);
    expect(manifest.rigTiers).toEqual({ [SUBJECT]: [1, 2] });
    const out = enforceBuiltRigs({ dist: copy, publicDir: pub, verified, log: () => {}, fail: (m: string) => { throw new Error(m); } });
    expect(out.rigs).toEqual([SUBJECT]);
    expect(out.files).toBe(17);
  });
  it('the file the engine asks for is the file the build holds: for every part, rim and tier, rigFileUrl (with the build\'s derived list) names a file of the build', async () => {
    const { rigFileUrl } = await import('../../../src/engine/rig/RigTier.ts');
    const { setShippedArt } = await import('../../../src/engine/ArtShipped.ts');
    setShippedArt(shippedList(plan));
    try {
      const rig = JSON.parse(readFileSync(join(pub, 'art', 'rigs', SUBJECT, 'rig.json'), 'utf8')) as { parts: Array<{ png: string; rim?: string }> };
      const files = new Set(walk(dist));
      let webp = 0;
      let checked = 0;
      for (const p of rig.parts) {
        for (const [name, scales] of [[p.png, [1, 2]], [p.rim, [1]]] as const) {
          if (!name) continue;
          for (const scale of scales) {
            const url = rigFileUrl('/art/rigs/' + SUBJECT, name, scale as 1 | 2);
            expect(files.has(url.slice(1)), url).toBe(true);
            checked++;
            if (url.endsWith('.webp')) webp++;
          }
        }
      }
      expect(checked).toBe(14); // six parts at both tiers, two rim masks at 1x
      expect(webp).toBeGreaterThan(0);
      for (const e of plan.entries.filter((x) => x.rel.startsWith('art/rigs/'))) expect(files.has(e.kind === 'webp' ? webpName(e.rel) : e.rel), e.rel).toBe(true);
    } finally {
      setShippedArt(undefined);
    }
  });
  it('the build\'s art folder holds nothing the source did not (no stray file came from the redaction or the derivation)', () => {
    const src = new Set(walk(pub));
    for (const f of walk(dist)) {
      if (f === 'art/derived.json') continue;
      const master = src.has(f) ? f : f.endsWith('.webp') ? `${f.slice(0, -5)}.png` : null;
      expect(master !== null && src.has(master), f).toBe(true);
    }
    expect(statSync(join(dist, 'art', 'derived.json')).size).toBeGreaterThan(0);
  });
});
