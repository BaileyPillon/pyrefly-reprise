/**
 * rigs-v2, the review's finding m4 (2026-10-29, adversarial review of `5ef7d052d`): four of twelve mutations survived, so these tests run the pieces the first file stubbed out.
 * (1) `chooseRig` with its OWN `manifestLists` / `manifestTiers` (no injected `listed`, no `ctx.tiers`): the art manifest is asked about the FOLDER, so a v2 rig that is installed (`rigs/tidus-v2` listed, its
 * tiers under that name) is found and one that is not is the painting set. (2) The switchboard's `.` key: it flips `on` and `off`, a `v2` from the address goes to `off`, and `v2` counts as new.
 * Game case: Tidus FFX only, Rikku Dark Knight FFX-2 only (folder names, nothing else); the loader and the switchboard are shared plumbing, both games.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRigFile } from './rig-fixture.ts';

vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const { chooseRig, clearRigCache } = await import('../../../src/engine/rig/RigLoad.ts');
const { parseArtManifest, resetArtManifest, setArtManifest } = await import('../../../src/engine/ArtManifest.ts');
const { setPartyRigsMode } = await import('../../../src/engine/motion/PartyRigsSwitch.ts');
const { switchOfCode, boardState } = await import('../../../src/app/demo/switchboardModel.ts');
type RigFile = import('../../../src/data/art/rigTypes.ts').RigFile;

const IDLE = '/art/characters/tidus/idle.png';

function tidusFile(): RigFile {
  const f = makeRigFile() as unknown as RigFile & { name: string; costume: { painting: string; sha: string } };
  f.name = 'tidus';
  f.costume = { painting: 'characters/tidus/idle', sha: '' };
  return f;
}

/** A fetch that answers every rig folder with the same Tidus rig and records the URLs. */
function serveRigs(): { asked: string[] } {
  const asked: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      asked.push(String(url));
      return { ok: true, status: 200, text: async () => JSON.stringify(tidusFile()) };
    }),
  );
  return { asked };
}

/** An art manifest that lists exactly these rig folders (with these tiers). */
function manifestWith(rigs: string[], rigTiers: Record<string, number[]> = {}): void {
  setArtManifest(parseArtManifest({ version: 1, generatedAt: '', subjects: {}, rigs, rigTiers }));
}

beforeEach(() => {
  clearRigCache();
  resetArtManifest();
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  resetArtManifest();
  setPartyRigsMode(null);
});

describe('the loader asks the art manifest about the FOLDER (its own manifestLists and manifestTiers)', () => {
  it('v2: a manifest that lists rigs/tidus-v2 lets the pilot through; one that lists only rigs/tidus does not, and says which folder', async () => {
    setPartyRigsMode('v2');
    const net = serveRigs();
    manifestWith(['tidus-v2']);
    const found = await chooseRig('tidus', IDLE, { on: true, reason: 'default' }, false, undefined, {});
    expect(found.reason).not.toMatch(/no rig listed/);
    expect(net.asked.length).toBe(1);
    expect(net.asked[0]).toMatch(/\/art\/rigs\/tidus-v2\/rig\.json$/);

    clearRigCache();
    net.asked.length = 0;
    manifestWith(['tidus']); // only the 2026-10-22 pilot is installed
    const refused = await chooseRig('tidus', IDLE, { on: true, reason: 'default' }, false, undefined, {});
    expect(refused.on).toBe(false);
    expect(refused.reason).toBe('no rig listed in the art manifest (rigs/tidus-v2)');
    expect(net.asked.length).toBe(0); // never even asked for the file
  });

  it('on: the other way round, rigs/tidus must be listed and rigs/tidus-v2 does not count', async () => {
    setPartyRigsMode('on');
    const net = serveRigs();
    manifestWith(['tidus-v2']);
    const refused = await chooseRig('tidus', IDLE, { on: true, reason: 'default' }, false, undefined, {});
    expect(refused.reason).toBe('no rig listed in the art manifest');
    expect(net.asked.length).toBe(0);

    clearRigCache();
    manifestWith(['tidus']);
    const found = await chooseRig('tidus', IDLE, { on: true, reason: 'default' }, false, undefined, {});
    expect(found.reason).not.toMatch(/no rig listed/);
    expect(net.asked[0]).toMatch(/\/art\/rigs\/tidus\/rig\.json$/);
  });

  it('a figure that is not a pilot is listed by its own name under every mode (a boss rig never moves)', async () => {
    serveRigs();
    for (const mode of ['off', 'on', 'v2'] as const) {
      setPartyRigsMode(mode);
      clearRigCache();
      manifestWith(['valefor-v2']); // a look-alike name must not satisfy valefor
      expect((await chooseRig('valefor', '/art/characters/valefor/idle.png', { on: true, reason: 'default' }, false, undefined, {})).reason).toBe('no rig listed in the art manifest');
      clearRigCache();
      manifestWith(['valefor']);
      expect((await chooseRig('valefor', '/art/characters/valefor/idle.png', { on: true, reason: 'default' }, false, undefined, {})).reason).not.toMatch(/no rig listed/);
    }
  });

  it('the tiers are the FOLDER\'s: the v2 rig gets the tiers listed under tidus-v2, the old pilot those under tidus', async () => {
    serveRigs();
    manifestWith(['tidus', 'tidus-v2'], { tidus: [1], 'tidus-v2': [1, 2] });
    setPartyRigsMode('v2');
    const v2 = await chooseRig('tidus', IDLE, { on: true, reason: 'default' }, false, undefined, {});
    expect(v2.on).toBe(true);
    expect(v2.asset?.tiers).toEqual([1, 2]);

    clearRigCache();
    setPartyRigsMode('on');
    const old = await chooseRig('tidus', IDLE, { on: true, reason: 'default' }, false, undefined, {});
    expect(old.on).toBe(true);
    expect(old.asset?.tiers).toEqual([1]);
  });
});

describe('the switchboard\'s `.` key and the v2 word', () => {
  it('a flip from v2 (asked by the address only) goes to off; off goes to on; on goes to off', () => {
    const key = switchOfCode('Period')!;
    setPartyRigsMode('v2');
    expect(key.read()).toBe('v2');
    expect(key.flip!()).toBe('off');
    expect(key.read()).toBe('off');
    expect(key.flip!()).toBe('on');
    expect(key.flip!()).toBe('off');
  });

  it('v2 counts as new (the board marks it), like on; off does not', () => {
    const key = switchOfCode('Period')!;
    setPartyRigsMode('off');
    expect(key.isNew()).toBe(false);
    setPartyRigsMode('on');
    expect(key.isNew()).toBe(true);
    setPartyRigsMode('v2');
    expect(key.isNew()).toBe(true);
    const row = boardState().find((r) => r.name === 'party rigs');
    expect(row).toEqual(expect.objectContaining({ key: '.', value: 'v2', isNew: true }));
  });
});
