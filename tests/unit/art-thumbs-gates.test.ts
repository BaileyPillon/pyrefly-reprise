/**
 * r44-thumbs (both games, shared build plumbing): the deploy's art checks cover the strip thumbnails. `verifyShippedArt` (what
 * `node tools/art-derive.mjs verify` and the deploy run) proves each one decodes to its master resized again by the rule, and that the build
 * holds exactly the ones its record lists, for every master of the strip list; `auditArtReferences` proves the bundle and the record
 * name the same shipped files; `planLoads` makes the browser load gate load each at the size the record gives. Tampered builds, each
 * failing for its own reason. Synthetic pictures (`helpers/thumbFixtures.ts`): no real art, no real cache.
 */
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DERIVED_REPORT, applyPlan, planArtDerivation } from '../../tools/art-derive-lib.mjs';
import { formatLoadReport, planLoads, problemOf, verifyArtLoads } from '../../tools/art-browser-load.mjs';
import { planThumbs, referenceThumb } from '../../tools/art-thumbs.mjs';
import { auditArtReferences, formatAudit, verifyShippedArt } from '../../tools/art-verify.mjs';
import { verifyShippedThumbs } from '../../tools/art-thumb-verify.mjs';
import { makeBuild, makeWorld, removeWorld } from './helpers/artFixtures.ts';
import { flatWebp, makeStripArt, writeStripList } from './helpers/thumbFixtures.ts';

let root = '';
let pub = '';
let cache = '';
let listFile = '';
let good = ''; // a build with its thumbnails, as the plugin leaves it
let turn = 0;

/** The map the bundle would carry, as the minifier leaves it: one object literal. */
const MAP = '{"art/backdrops/dusk.png":"art/backdrops/dusk.thumb.webp","art/backdrops/wide.png":"art/backdrops/wide.thumb.webp","art/characters/boss/idle.png":"art/characters/boss/idle.thumb.png"}';

beforeAll(async () => {
  ({ root, pub, cache } = makeWorld());
  await makeStripArt(pub);
  listFile = writeStripList(root);
  const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'off', jobs: 2 });
  plan.thumbs = await planThumbs({ publicDir: pub, cacheDir: cache, listFile, jobs: 2 });
  good = makeBuild(pub, root, { 'assets/index-abcd1234.js': `export const m=${MAP};` });
  applyPlan(good, plan);
}, 120_000);
afterAll(() => removeWorld(root));

/** A copy of the good build to tamper with. */
function copyOfGood(): string {
  const to = join(root, `copy-${++turn}`);
  cpSync(good, to, { recursive: true });
  return to;
}
const readRecord = (dir: string): { thumbs?: { enabled: boolean; reason?: string; files?: Array<Record<string, unknown>> } } & Record<string, unknown> => JSON.parse(readFileSync(join(dir, DERIVED_REPORT), 'utf8'));
const writeRecord = (dir: string, record: unknown): void => writeFileSync(join(dir, DERIVED_REPORT), JSON.stringify(record));
const problems = async (dir: string): Promise<string> => (await verifyShippedArt({ distDir: dir, publicDir: pub, jobs: 2, listFile })).problems.join('\n');

describe('verify: the thumbnails of a good build', () => {
  it('passes, and says what it checked: each thumbnail decoded and compared with its master resized by the rule', async () => {
    const v = await verifyShippedArt({ distDir: good, publicDir: pub, jobs: 2, listFile });
    expect(v.problems).toEqual([]);
    expect(v).toMatchObject({ ok: true, thumbs: { checked: 6, webp: 2, png: 1, none: 3, enabled: true } });
    const direct = await verifyShippedThumbs({ distDir: good, publicDir: pub, listFile, jobs: 2 });
    expect(direct).toMatchObject({ problems: [], checked: 6, webp: 2, png: 1, none: 3 });
  });

  it('is not asked about thumbnails by a build that has no strip list beside it (the old tests), and passes it', async () => {
    const v = await verifyShippedArt({ distDir: good, publicDir: pub, jobs: 2, listFile: join(root, 'no-such-list.json') });
    expect(v.ok).toBe(true);
  });
});

describe('verify: a thumbnail that is not what the rule gives', () => {
  it('fails a different picture under the right name, a lossy copy of the right one, and a wrong size', async () => {
    const dir = copyOfGood();
    // 1. a different picture, the right size
    writeFileSync(join(dir, 'art/backdrops/dusk.thumb.webp'), await flatWebp(768, 432));
    // 2. the right picture and the right size, lossy (close, not equal)
    const ref = await referenceThumb(join(pub, 'art/backdrops/wide.png'), 'art/backdrops/wide.png');
    writeFileSync(join(dir, 'art/backdrops/wide.thumb.webp'), await sharp(ref.data, { raw: { width: ref.width, height: ref.height, channels: 4 } }).removeAlpha().webp({ quality: 92 }).toBuffer());
    // 3. the right picture, a smaller size
    writeFileSync(join(dir, 'art/characters/boss/idle.thumb.png'), await sharp(join(pub, 'art/characters/boss/idle.png')).resize(200, 360).png().toBuffer());
    const text = await problems(dir);
    expect(text).toMatch(/art\/backdrops\/dusk\.thumb\.webp: does not decode to the master resized by the rule/);
    expect(text).toMatch(/art\/backdrops\/wide\.thumb\.webp: does not decode to the master resized by the rule/);
    expect(text).toMatch(/art\/characters\/boss\/idle\.thumb\.png: is 200x360, the rule gives 320x576/);
    expect(text).toMatch(/art\/backdrops\/dusk\.thumb\.webp: the record says \d+ bytes, the file is \d+/);
  });

  it('fails a missing file, a second file for one master, a file the record does not list, and a master the record forgot', async () => {
    const dir = copyOfGood();
    rmSync(join(dir, 'art/backdrops/wide.thumb.webp'));
    cpSync(join(dir, 'art/characters/boss/idle.thumb.png'), join(dir, 'art/characters/boss/idle.thumb.webp'));
    cpSync(join(dir, 'art/backdrops/dusk.thumb.webp'), join(dir, 'art/backdrops/stray.thumb.webp'));
    const record = readRecord(dir);
    record.thumbs!.files = record.thumbs!.files!.filter((f) => f.path !== 'art/backdrops/dusk.png');
    writeRecord(dir, record);
    const text = await problems(dir);
    expect(text).toMatch(/art\/backdrops\/wide\.thumb\.webp: the record says it ships for art\/backdrops\/wide\.png, and the build does not hold it/);
    expect(text).toMatch(/art\/characters\/boss\/idle\.thumb\.webp: in the build beside art\/characters\/boss\/idle\.thumb\.png: exactly one thumbnail per master/);
    expect(text).toMatch(/art\/backdrops\/stray\.thumb\.webp: a strip thumbnail the record does not list/);
    expect(text).toMatch(/art\/backdrops\/dusk\.png: art\/derived\.json has no thumbnail entry for it/);
    expect(text).toMatch(/art\/backdrops\/dusk\.thumb\.webp: a strip thumbnail the record does not list/);
  });

  it('fails a record that lies: pixels that are not the rule\'s, a size that is not, a name that is not, a thumbnail for a master the list does not name', async () => {
    const dir = copyOfGood();
    const record = readRecord(dir);
    const dusk = record.thumbs!.files!.find((f) => f.path === 'art/backdrops/dusk.png')!;
    dusk['rgba'] = 'f'.repeat(64);
    dusk['width'] = 767;
    const boss = record.thumbs!.files!.find((f) => f.path === 'art/characters/boss/idle.png')!;
    boss['thumb'] = 'art/characters/boss/idle.small.png';
    record.thumbs!.files!.push({ path: 'art/backdrops/elsewhere.png', kind: 'none', master: 1, note: 'invented' });
    writeRecord(dir, record);
    const text = await problems(dir);
    expect(text).toMatch(/dusk\.thumb\.webp: art\/derived\.json records pixels that are not the rule's/);
    expect(text).toMatch(/dusk\.thumb\.webp: art\/derived\.json records 767x432, the rule gives 768x432/);
    expect(text).toMatch(/art\/characters\/boss\/idle\.png: the record names the thumbnail art\/characters\/boss\/idle\.small\.png, the rule names art\/characters\/boss\/idle\.thumb\.png/);
    expect(text).toMatch(/art\/backdrops\/elsewhere\.png: art\/derived\.json lists a thumbnail for a master that is not in the strip list/);
  });

  it('fails a WebP thumbnail of a picture with soft edges (a decoder that premultiplies would draw it differently), and a thumbnail that is no reduction', async () => {
    const dir = copyOfGood();
    const ref = await referenceThumb(join(pub, 'art/characters/boss/idle.png'), 'art/characters/boss/idle.png');
    const asWebp = await sharp(ref.data, { raw: { width: ref.width, height: ref.height, channels: 4 } }).webp({ lossless: true, quality: 100, exact: true }).toBuffer();
    rmSync(join(dir, 'art/characters/boss/idle.thumb.png'));
    writeFileSync(join(dir, 'art/characters/boss/idle.thumb.webp'), asWebp);
    const record = readRecord(dir);
    Object.assign(record.thumbs!.files!.find((f) => f.path === 'art/characters/boss/idle.png')!, { kind: 'webp', thumb: 'art/characters/boss/idle.thumb.webp', bytes: asWebp.length });
    // A thumbnail recorded for a master already no larger than one.
    cpSync(join(pub, 'art/characters/tiny/idle.png'), join(dir, 'art/characters/tiny/idle.thumb.png'));
    const tiny = record.thumbs!.files!.find((f) => f.path === 'art/characters/tiny/idle.png')!;
    Object.assign(tiny, { kind: 'png', thumb: 'art/characters/tiny/idle.thumb.png', width: 300, height: 400, bytes: readFileSync(join(dir, 'art/characters/tiny/idle.thumb.png')).length });
    delete tiny['note'];
    writeRecord(dir, record);
    const text = await problems(dir);
    expect(text).toMatch(/art\/characters\/boss\/idle\.thumb\.webp: shipped as a WebP, but the picture has partly transparent pixels/);
    expect(text).toMatch(/art\/characters\/tiny\/idle\.thumb\.png: the master is no larger than a thumbnail would be/);
    expect(text).toMatch(/art\/characters\/tiny\/idle\.thumb\.png: is not smaller than its master/);
  });

  it('fails a master the record says has no thumbnail but the build holds one for', async () => {
    const dir = copyOfGood();
    cpSync(join(dir, 'art/backdrops/dusk.thumb.webp'), join(dir, 'art/backdrops/gamma.thumb.webp'));
    const text = await problems(dir);
    expect(text).toMatch(/art\/backdrops\/gamma\.thumb\.webp: in the build, but the record says art\/backdrops\/gamma\.png has no thumbnail/);
    expect(text).toMatch(/art\/backdrops\/gamma\.thumb\.webp: a strip thumbnail the record does not list/);
  });
});

describe('verify: a build made without thumbnails', () => {
  it('fails a record with no thumbs section beside a strip list whose masters are there, but passes one that says it was told to make none', async () => {
    const dir = copyOfGood();
    const record = readRecord(dir);
    delete record.thumbs;
    for (const rel of ['art/backdrops/dusk.thumb.webp', 'art/backdrops/wide.thumb.webp', 'art/characters/boss/idle.thumb.png']) rmSync(join(dir, rel));
    writeRecord(dir, record);
    expect(await problems(dir)).toMatch(/art\/derived\.json has no thumbs section, but 5 master\(s\) of the strip list are in public\/art/);
    writeRecord(dir, { ...record, thumbs: { enabled: false, reason: 'PYREFLY_ART_THUMBS=off' } });
    const v = await verifyShippedArt({ distDir: dir, publicDir: pub, jobs: 2, listFile });
    expect(v.problems).toEqual([]);
    expect(v.thumbs).toMatchObject({ enabled: false, checked: 0 });
    // ...but not while the files are still there.
    cpSync(join(good, 'art/backdrops/dusk.thumb.webp'), join(dir, 'art/backdrops/dusk.thumb.webp'));
    expect(await problems(dir)).toMatch(/a strip thumbnail in a build whose record says none were made \(PYREFLY_ART_THUMBS=off\)/);
  });
});

describe('audit: the bundle and the record name the same shipped thumbnails', () => {
  it('passes a build whose bundle carries the map and whose record lists the same files, and counts them', () => {
    const r = auditArtReferences(good);
    expect(r.problems).toEqual([]);
    expect(r.stats).toMatchObject({ thumbRecorded: 3, thumbNames: 3 });
    expect(formatAudit(r)).toMatch(/strip thumbnails: 3 in the record, 3 name\(s\) in the bundle; each a shipped file and each in both: yes/);
  });

  it('fails a thumbnail the bundle names that is not shipped, one it names that the record does not list, and one the record lists that no bundle names', () => {
    const dir = copyOfGood();
    const js = join(dir, 'assets/index-abcd1234.js');
    writeFileSync(js, `export const m=${MAP.replace('}', ',"art/backdrops/gamma.png":"art/backdrops/gamma.thumb.webp"}')};export const n="art/backdrops/ghost.thumb.webp";`);
    cpSync(join(good, 'art/backdrops/dusk.thumb.webp'), join(dir, 'art/backdrops/gamma.thumb.webp')); // shipped, but not in the record
    const text = auditArtReferences(dir).problems.join('\n');
    expect(text).toMatch(/names the strip thumbnail art\/backdrops\/ghost\.thumb\.webp, which is not in the build/);
    expect(text).toMatch(/names the strip thumbnail art\/backdrops\/gamma\.thumb\.webp, which art\/derived\.json does not list/);
    const dir2 = copyOfGood();
    writeFileSync(join(dir2, 'assets/index-abcd1234.js'), 'export const m={"art/backdrops/dusk.png":"art/backdrops/dusk.thumb.webp"};');
    expect(auditArtReferences(dir2).problems.join('\n')).toMatch(/art\/derived\.json: lists the strip thumbnail art\/backdrops\/wide\.thumb\.webp, and no bundle names it/);
  });

  it('fails a record that lists a thumbnail the build does not hold, and does not demand a bundle from a build that has none', () => {
    const dir = copyOfGood();
    rmSync(join(dir, 'art/backdrops/wide.thumb.webp'));
    expect(auditArtReferences(dir).problems.join('\n')).toMatch(/art\/derived\.json: lists the strip thumbnail art\/backdrops\/wide\.thumb\.webp, which is not in the build/);
    const dir2 = copyOfGood();
    rmSync(join(dir2, 'assets'), { recursive: true });
    expect(auditArtReferences(dir2).problems).toEqual([]);
  });
});

describe('the browser load gate loads each thumbnail at the size the record gives', () => {
  it('plans them as their own kind, with the recorded size, and not again among the other images', () => {
    const p = planLoads({ distDir: good, publicDir: pub });
    expect(p.problems).toEqual([]);
    expect(p.thumbs.map((t) => `${t.rel}:${t.width}x${t.height}:${t.kind}:${t.master}`)).toEqual([
      'art/backdrops/dusk.thumb.webp:768x432:thumb:art/backdrops/dusk.png',
      'art/backdrops/wide.thumb.webp:768x512:thumb:art/backdrops/wide.png',
      'art/characters/boss/idle.thumb.png:320x576:thumb:art/characters/boss/idle.png',
    ]);
    expect(p.others.some((o) => o.rel.includes('.thumb.'))).toBe(false);
    expect(problemOf(p.thumbs[0]!, { ok: true, w: 768, h: 432 })).toBeNull();
    expect(problemOf(p.thumbs[0]!, { ok: true, w: 768, h: 439 })).toBe('loaded at 768x439, but its record says 768x432');
  });

  it('reports a thumbnail the record lists and the build lacks, loads the rest in every engine, and fails one that decodes at the wrong size', async () => {
    const dir = copyOfGood();
    rmSync(join(dir, 'art/backdrops/wide.thumb.webp'));
    expect(planLoads({ distDir: dir, publicDir: pub }).problems).toEqual(['art/backdrops/wide.thumb.webp: art/derived.json says this thumbnail ships for art/backdrops/wide.png, and the build does not hold it']);
    const result = await verifyArtLoads({
      distDir: good,
      publicDir: pub,
      engines: ['chromium', 'webkit'],
      runEngine: async (spec) => ({
        version: `${spec.engine} 1.0`,
        ms: 1,
        rows: spec.items.map((it) => (it.rel === 'art/backdrops/dusk.thumb.webp' && spec.engine === 'webkit' ? { ok: true, w: 384, h: 216 } : { ok: true, w: it.width ?? 10, h: it.height ?? 10 })),
      }),
    });
    expect(result.checked).toMatchObject({ thumbs: 3 });
    expect(result.problems).toEqual(['[webkit] art/backdrops/dusk.thumb.webp: loaded at 384x216, but its record says 768x432']);
    expect(formatLoadReport(result)).toMatch(/3 strip thumbnail\(s\) and /);
  });
});

describe('the deploy runs these checks', () => {
  it('proves the thumbnails in the same call as the pixel-identity gate (no way round it), and logs what it proved', () => {
    const deploy = readFileSync(join(__dirname, '..', '..', 'tools', 'deploy-pages.mjs'), 'utf8');
    expect(deploy).toContain("await verifyShippedArt({ distDir: DIST, publicDir: join(ROOT, 'public') })");
    expect(deploy).toMatch(/if \(!artIdentity\.ok\) \{/);
    expect(deploy).toContain('artIdentity.thumbs');
    expect(deploy).toContain('strip thumbnails:');
    expect(deploy.indexOf('artIdentity.thumbs')).toBeLessThan(deploy.indexOf('auditArtReferences(DIST)'));
  });
});
