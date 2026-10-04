/**
 * Release 38 ("r38-bytes"), the re-check's B3: `tools/art-browser-load.mjs` loads EVERY art file a build ships in WebKit and in Chromium,
 * because a pick of 20 to 30 files cannot find two bad ones in 900 and a file the browser cannot decode still answers 200 and logs
 * nothing. The browsers are not started here (the `runEngine` seam is faked); what is tested is what makes the gate whole: the plan (every
 * master's shipped file with its master's size, every other image), the judging, the portrait plates, the server that hands the files over,
 * and the failure rules (a file, a size, a plate, an engine that cannot start, a build that does not match its record). The real engines
 * are run on real builds and recorded in docs/handoff/r38-bytes.md. Tiny synthetic images in a temporary folder; both games.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { applyPlan, planArtDerivation } from '../../tools/art-derive-lib.mjs';
import { DEFAULT_ENGINES, formatLoadReport, planLoads, platesOf, pngSize, problemOf, verifyArtLoads } from '../../tools/art-browser-load.mjs';
import type { LoadEngineRun, LoadItem, LoadRow } from '../../tools/art-browser-load.mjs';
import { makeBuild, makeStandardArt, makeWorld, png, putFile, removeWorld, sprite } from './helpers/artFixtures.ts';

let root = '';
let pub = '';
let cache = '';
beforeEach(() => {
  ({ root, pub, cache } = makeWorld());
});
afterEach(() => removeWorld(root));

const MANIFEST = { version: 1, master: [2688, 1536], plates: { paine: { parts: { 'eyeR-iris': {}, 'eyeR-catch': {} } } } };

/**
 * A build as the deploy would see it: the standard art plus two plates of one portrait (one part a fully transparent layer, like Paine's
 * catchlight, which ships as a PNG under the floor), the plate manifest, a lossy WebP the derivation does not touch (`art/pause/x.2x.webp`)
 * and a depth map.
 */
async function build(): Promise<{ out: string; plan: Awaited<ReturnType<typeof planArtDerivation>> }> {
  await makeStandardArt(pub);
  for (const scale of ['1x', '2x']) {
    putFile(pub, `art/portrait-parts/paine/${scale}/eyeR-iris.png`, await png(sprite(32, 32), 32, 32, 4));
    putFile(pub, `art/portrait-parts/paine/${scale}/eyeR-catch.png`, await png(Buffer.alloc(20 * 20 * 4), 20, 20, 4));
  }
  const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'exact', jobs: 2 });
  const out = makeBuild(pub, root, { 'art/portrait-parts/manifest.json': JSON.stringify(MANIFEST) });
  applyPlan(out, plan);
  mkdirSync(join(out, 'fx/room'), { recursive: true });
  writeFileSync(join(out, 'fx/room/depth.png'), await png(Buffer.alloc(16 * 16, 7), 16, 16, 1));
  return { out, plan };
}

const run = (engine: string, items: LoadItem[], tweak?: (engine: string, items: LoadItem[], rows: LoadRow[]) => Partial<LoadEngineRun> | void) => {
  const rows: LoadRow[] = items.map((it) => ({ ok: true, w: it.width ?? 10, h: it.height ?? 10 }));
  return { version: `${engine} 1.0`, rows, ms: 5, ...(tweak?.(engine, items, rows) ?? {}) } satisfies LoadEngineRun;
};

describe('what the gate loads', () => {
  it('reads the size of a PNG from its header, and refuses what is not one', async () => {
    putFile(pub, 'a.png', await png(Buffer.alloc(7 * 5 * 4), 7, 5, 4));
    putFile(pub, 'b.bin', 'not a png at all, but longer than twenty-four bytes');
    putFile(pub, 'c.bin', 'short');
    expect(pngSize(join(pub, 'a.png'))).toEqual({ width: 7, height: 5 });
    expect(pngSize(join(pub, 'b.bin'))).toBeNull();
    expect(pngSize(join(pub, 'c.bin'))).toBeNull();
  });

  it('plans every master of the record as the file that ships for it, at its master\'s size, and every other image of the build', async () => {
    const { out, plan } = await build();
    const p = planLoads({ distDir: out, publicDir: pub });
    expect(p.problems).toEqual([]);
    expect(p.art).toHaveLength(plan.entries.length);
    expect(p.art.map((a) => `${a.rel}:${a.width}x${a.height}`).sort()).toEqual([
      'art/backdrops/sky.webp:96x54',
      'art/characters/hero/idle.png:64x96',
      'art/characters/hero/idle@2x.png:128x192',
      'art/pause/x.png:60x34',
      'art/portrait-parts/paine/1x/eyeR-catch.png:20x20',
      'art/portrait-parts/paine/1x/eyeR-iris.png:32x32',
      'art/portrait-parts/paine/2x/eyeR-catch.png:20x20',
      'art/portrait-parts/paine/2x/eyeR-iris.png:32x32',
      'art/portraits/grey.webp:40x40',
    ]);
    expect(p.art.filter((a) => a.kind === 'webp').map((a) => a.master)).toEqual(['art/backdrops/sky.png', 'art/portraits/grey.png']);
    for (const a of p.art) expect(existsSync(join(out, a.rel)), a.rel).toBe(true);
    // The blank layers are not a WebP: they sit under the floor (this is B3), so the PNG is what the browsers are asked to load.
    expect(p.art.filter((a) => a.rel.includes('eyeR-catch')).every((a) => a.rel.endsWith('.png'))).toBe(true);
    // Not derived, still shipped, so still loaded: the lossy 2x plate and the depth map; and nothing that is not an image.
    expect(p.others.map((o) => o.rel)).toEqual(['art/pause/x.2x.webp', 'fx/room/depth.png']);
    expect(p.others.every((o) => o.width === null && o.master === null)).toBe(true);
  });

  it('reports a build that does not match its record: no record, a missing file, a master with no entry, an entry with no master', async () => {
    const { out } = await build();
    expect(planLoads({ distDir: join(root, 'nowhere'), publicDir: pub }).problems).toEqual([expect.stringMatching(/art\/derived\.json is missing from the build/)]);
    rmSync(join(out, 'art/backdrops/sky.webp'));
    putFile(pub, 'art/portraits/new.png', await png(sprite(8, 8), 8, 8, 4));
    rmSync(join(pub, 'art/pause/x.png'));
    const text = planLoads({ distDir: out, publicDir: pub }).problems.join('\n');
    expect(text).toMatch(/art\/backdrops\/sky\.webp: art\/derived\.json says this file ships for art\/backdrops\/sky\.png, and the build does not hold it/);
    expect(text).toMatch(/art\/portraits\/new\.png: art\/derived\.json has no entry for it/);
    expect(text).toMatch(/art\/pause\/x\.png: art\/derived\.json lists a master that is not in public\/art/);
  });

  it('knows each portrait plate at both scales, with the file that ships for each part (none for a part the build lacks)', async () => {
    const { out } = await build();
    const plates = platesOf(out, planLoads({ distDir: out, publicDir: pub }).art);
    expect(plates.map((p) => `${p.plate}@${p.scale}`)).toEqual(['paine@1x', 'paine@2x']);
    expect(plates[0]!.parts).toEqual([
      { name: 'eyeR-iris', rel: 'art/portrait-parts/paine/1x/eyeR-iris.png' },
      { name: 'eyeR-catch', rel: 'art/portrait-parts/paine/1x/eyeR-catch.png' },
    ]);
    writeFileSync(join(out, 'art/portrait-parts/manifest.json'), JSON.stringify({ ...MANIFEST, plates: { ...MANIFEST.plates, ghost: { parts: { 'eyeR-iris': {} } } } }));
    const ghost = platesOf(out, planLoads({ distDir: out, publicDir: pub }).art).find((p) => p.plate === 'ghost' && p.scale === '2x')!;
    expect(ghost.parts).toEqual([{ name: 'eyeR-iris', rel: null }]);
    expect(platesOf(join(root, 'nowhere'), [])).toEqual([]);
  });
});

describe('what counts as loaded', () => {
  const art: LoadItem = { rel: 'art/a.webp', master: 'art/a.png', kind: 'webp', width: 64, height: 96 };
  const other: LoadItem = { rel: 'fx/depth.png', master: null, kind: 'other', width: null, height: null };

  it('passes a file that decoded at its master\'s size, and says why for every other outcome', () => {
    expect(problemOf(art, { ok: true, w: 64, h: 96 })).toBeNull();
    expect(problemOf(art, { ok: false, why: 'decode() rejected: EncodingError: Loading error.' })).toBe('decode() rejected: EncodingError: Loading error.');
    expect(problemOf(art, { ok: true, w: 96, h: 64 })).toBe('loaded at 96x64, but its master is 64x96');
    expect(problemOf(art, { ok: true, w: 0, h: 0 })).toBe('decoded to 0x0');
    expect(problemOf(art, null)).toMatch(/was never loaded/);
    expect(problemOf(art, undefined)).toMatch(/was never loaded/);
    // An image that is not a master has no size to match: it only has to decode to something.
    expect(problemOf(other, { ok: true, w: 3, h: 4 })).toBeNull();
    expect(problemOf(other, { ok: true, w: 0, h: 4 })).toBe('decoded to 0x4');
  });
});

describe('the gate, with the browsers faked', () => {
  it('hands every file to every engine, with no sample, over a server that serves the build and nothing outside it', async () => {
    const { out } = await build();
    const seen: Record<string, string[]> = {};
    const result = await verifyArtLoads({
      distDir: out,
      publicDir: pub,
      engines: ['chromium', 'webkit'],
      runEngine: async (spec) => {
        seen[spec.engine] = spec.items.map((i) => i.rel);
        if (spec.engine === 'chromium') {
          const first = spec.items.find((i) => i.rel.endsWith('.webp'))!;
          const hit = await fetch(`${spec.baseUrl}/${first.rel}`);
          expect([hit.status, hit.headers.get('content-type')]).toEqual([200, 'image/webp']);
          expect((await hit.arrayBuffer()).byteLength).toBe(readFileSync(join(out, first.rel)).length);
          const png1 = await fetch(`${spec.baseUrl}/${encodeURI('art/characters/hero/idle@2x.png')}`);
          expect([png1.status, png1.headers.get('content-type')]).toEqual([200, 'image/png']);
          await png1.arrayBuffer();
          const blank = await fetch(`${spec.baseUrl}/__blank.html`);
          expect([blank.status, blank.headers.get('content-type')]).toEqual([200, 'text/html']);
          await blank.arrayBuffer();
          for (const bad of ['/art/nope.png', '/..%2f..%2fpackage.json', '/art/', '/%E0%A4%A']) {
            const r = await fetch(`${spec.baseUrl}${bad}`);
            expect(r.status, bad).toBeGreaterThanOrEqual(400);
            await r.arrayBuffer();
          }
        }
        return run(spec.engine, spec.items);
      },
    });
    expect(result.ok).toBe(true);
    expect(result.problems).toEqual([]);
    expect(result.checked).toMatchObject({ art: 9, others: 2, webp: 2 });
    expect(result.checked.png + result.checked.copy).toBe(7);
    expect(Object.keys(seen)).toEqual(['chromium', 'webkit']);
    expect(seen['chromium']).toHaveLength(11);
    expect(seen['webkit']).toEqual(seen['chromium']);
    expect(result.engines['webkit']).toMatchObject({ ok: true, version: 'webkit 1.0', files: 11, loaded: 11, failed: 0, plates: { total: 2, living: 2 } });
    expect(formatLoadReport(result)).toMatch(/^art-browser-load: PASS: 9 art file\(s\) \(2 WebP, \d+ recompressed PNG, \d+ PNG as shipped\) and 2 other image\(s\) in chromium and webkit/);
    expect(DEFAULT_ENGINES).toEqual(['chromium', 'webkit']);
  });

  it('fails the run, naming the engine and the file, when one engine cannot load one file, and the plate that file keeps still (B3)', async () => {
    const { out } = await build();
    const bad = 'art/portrait-parts/paine/1x/eyeR-catch.png';
    const result = await verifyArtLoads({
      distDir: out,
      publicDir: pub,
      runEngine: async (spec) => run(spec.engine, spec.items, (engine, items, rows) => {
        if (engine === 'webkit') rows[items.findIndex((i) => i.rel === bad)] = { ok: false, why: 'decode() rejected: EncodingError: Loading error.' };
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.problems).toEqual([
      `[webkit] ${bad}: decode() rejected: EncodingError: Loading error.`,
      '[webkit] the portrait plate paine@1x would stay a still picture (the loader returns null unless every part loads): eyeR-catch did not',
    ]);
    expect(result.engines['chromium']).toMatchObject({ ok: true, failed: 0, plates: { total: 2, living: 2 } });
    expect(result.engines['webkit']).toMatchObject({ ok: false, failed: 1, loaded: 10, plates: { total: 2, living: 1 } });
    const text = formatLoadReport(result);
    expect(text).toMatch(/^art-browser-load: FAIL/);
    expect(text).toMatch(/webkit webkit 1\.0: 10 of 11 loaded and decoded at the master's size, 1 failed; portrait plates living 1 of 2/);
  });

  it('fails a file that loads at another size than its master, and a page that stopped before the end', async () => {
    const { out } = await build();
    const result = await verifyArtLoads({
      distDir: out,
      publicDir: pub,
      engines: ['webkit'],
      runEngine: async (spec) => run(spec.engine, spec.items, (_e, items, rows) => {
        rows[items.findIndex((i) => i.rel === 'art/backdrops/sky.webp')] = { ok: true, w: 54, h: 96 };
        for (let k = items.length - 2; k < items.length; k++) (rows as Array<LoadRow | null>)[k] = null;
        return { error: 'the page stopped: Target closed' };
      }),
    });
    expect(result.ok).toBe(false);
    const text = result.problems.join('\n');
    expect(text).toMatch(/\[webkit\] art\/backdrops\/sky\.webp: loaded at 54x96, but its master is 96x54/);
    expect(text).toMatch(/\[webkit\] 2 file\(s\) were never loaded \(the page stopped before them\), the first 2: art\/pause\/x\.2x\.webp, fx\/room\/depth\.png/);
    expect(result.problems[0], 'the cause comes first').toBe('[webkit] the page stopped: Target closed');
  });

  it('fails when an engine cannot start (a load that was never run is not a pass), and still runs the engine that can', async () => {
    const { out } = await build();
    const result = await verifyArtLoads({
      distDir: out,
      publicDir: pub,
      runEngine: async (spec) => (spec.engine === 'webkit' ? { unavailable: "Executable doesn't exist at C:/x/webkit" } : run(spec.engine, spec.items)),
    });
    expect(result.ok).toBe(false);
    expect(result.problems).toEqual(["[webkit] could not start: Executable doesn't exist at C:/x/webkit (a load that was never run is not a pass)"]);
    expect(result.engines['webkit']).toEqual({ ok: false, unavailable: "Executable doesn't exist at C:/x/webkit" });
    expect(result.engines['chromium']).toMatchObject({ ok: true, loaded: 11 });
    expect(formatLoadReport(result)).toMatch(/webkit: NOT RUN \(Executable doesn't exist/);
  });

  it('fails a plate whose manifest names a part the build does not ship, though every file that is there loads', async () => {
    const { out } = await build();
    writeFileSync(join(out, 'art/portrait-parts/manifest.json'), JSON.stringify({ ...MANIFEST, plates: { paine: { parts: { 'eyeR-iris': {}, 'eyeR-catch': {}, 'mouth-open': {} } } } }));
    const result = await verifyArtLoads({ distDir: out, publicDir: pub, engines: ['chromium'], runEngine: async (spec) => run(spec.engine, spec.items) });
    expect(result.problems).toEqual([
      '[chromium] the portrait plate paine@1x would stay a still picture (the loader returns null unless every part loads): mouth-open did not',
      '[chromium] the portrait plate paine@2x would stay a still picture (the loader returns null unless every part loads): mouth-open did not',
    ]);
  });

  it('serves a file whose name needs escaping, and loads it as one of the other images', async () => {
    const { out } = await build();
    const odd = 'art/odd #name 1.png';
    writeFileSync(join(out, odd), await png(Buffer.alloc(4 * 4 * 4, 9), 4, 4, 4));
    let status = 0;
    const result = await verifyArtLoads({
      distDir: out,
      publicDir: pub,
      engines: ['chromium'],
      runEngine: async (spec) => {
        expect(spec.items.map((i) => i.rel)).toContain(odd);
        const r = await fetch(`${spec.baseUrl}/${odd.split('/').map(encodeURIComponent).join('/')}`);
        status = r.status;
        await r.arrayBuffer();
        return run(spec.engine, spec.items);
      },
    });
    expect(status).toBe(200);
    expect(result.ok).toBe(true);
  });

  it('is wired into the deploy, after the other art gates and before the manifest, with the default engines and no way round it', () => {
    const deploy = readFileSync(join(__dirname, '..', '..', 'tools', 'deploy-pages.mjs'), 'utf8');
    expect(deploy).toContain("import { formatLoadReport, verifyArtLoads } from './art-browser-load.mjs';");
    const at = (s: string): number => deploy.indexOf(s);
    expect(at('await verifyShippedArt(')).toBeGreaterThan(0);
    expect(at('auditArtReferences(DIST)')).toBeGreaterThan(at('await verifyShippedArt('));
    expect(at('await verifyArtLoads(')).toBeGreaterThan(at('auditArtReferences(DIST)'));
    expect(at('await buildManifest(DIST)')).toBeGreaterThan(at('await verifyArtLoads('));
    expect(deploy).toContain("await verifyArtLoads({ distDir: DIST, publicDir: join(ROOT, 'public') })"); // no `engines`, so WebKit and Chromium; no subset
    expect(deploy).toMatch(/if \(!artLoad\.ok\) fail\(/);
  });

  it('fails a build that does not match its record without starting a browser, and refuses an engine it does not know', async () => {
    const { out } = await build();
    rmSync(join(out, 'art/portraits/grey.webp'));
    let started = 0;
    const result = await verifyArtLoads({ distDir: out, publicDir: pub, runEngine: async (spec) => (started++, run(spec.engine, spec.items)) });
    expect(result.ok).toBe(false);
    expect(result.problems.join('\n')).toMatch(/art\/portraits\/grey\.webp: art\/derived\.json says this file ships for art\/portraits\/grey\.png, and the build does not hold it/);
    const none = await verifyArtLoads({ distDir: join(root, 'nowhere'), publicDir: pub, runEngine: async (spec) => (started++, run(spec.engine, spec.items)) });
    expect(none.ok).toBe(false);
    expect(none.problems).toEqual([expect.stringMatching(/art\/derived\.json is missing/)]);
    expect(started, 'no engine runs for a build with no record').toBe(2); // the first call ran both engines on the 8 files that are there; the second ran none
    await expect(verifyArtLoads({ distDir: out, publicDir: pub, engines: ['netscape' as 'chromium'] })).rejects.toThrow(/unknown engine netscape/);
  });
});
