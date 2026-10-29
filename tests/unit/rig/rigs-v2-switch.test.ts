/**
 * rigs-v2 (2026-10-29; Tidus FFX only, Rikku Dark Knight FFX-2 only; the loader and the actor change is shared plumbing: both games): `?partyrigs=v2` reads the NEW pilots from `rigs/<subject>-v2/`
 * and leaves the old ones (`on`, `rigs/<subject>/`) alone; a rig honours the stance look's `paint` (the ready STATE on the idle painting) the way the painting set does.
 */
import { Texture } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRigFile } from './rig-fixture.ts';

vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const { RigActor } = await import('../../../src/engine/rig/RigActor.ts');
const { carrierOf } = await import('../../../src/engine/rig/RigCarrier.ts');
const { readRig } = await import('../../../src/engine/rig/RigData.ts');
const { chooseRig, clearRigCache, rigBaseUrl, rigReport } = await import('../../../src/engine/rig/RigLoad.ts');
const { PARTY_RIG_SUBJECTS, partyRigAllowed, partyRigFolder, partyRigsModeFromSearch, setPartyRigsMode } = await import('../../../src/engine/motion/PartyRigsSwitch.ts');
const { setDemoChapter } = await import('../../../src/engine/motion/DemoGate.ts');
type Painted = import('../../../src/engine/PaintedArt.ts').PaintedTexture;
type RigFile = import('../../../src/data/art/rigTypes.ts').RigFile;
type RigActorT = import('../../../src/engine/rig/RigActor.ts').RigActor;

const IDLE = '/art/characters/tidus/idle.png';
const hooks = {
  idlePainting: { texture: new Texture(), meta: { width: 400, height: 800, baselineY: 780 }, placeholder: false, url: IDLE } as Painted,
  loadTexture: async (): Promise<Texture> => new Texture(),
};

/** A rig file that says it is Tidus's, cut from his idle: the fixture's own parts and keys. */
function tidusFile(): RigFile {
  const f = makeRigFile() as unknown as RigFile & { name: string; costume: { painting: string; sha: string } };
  f.name = 'tidus';
  f.costume = { painting: 'characters/tidus/idle', sha: '' };
  return f;
}

/** A fetch that answers only the folders named, and records every URL asked. */
function serve(folders: string[]): { asked: string[] } {
  const asked: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      asked.push(String(url));
      const ok = folders.some((f) => String(url).endsWith(`/art/rigs/${f}/rig.json`));
      return ok ? { ok: true, status: 200, text: async () => JSON.stringify(tidusFile()) } : { ok: false, status: 404, text: async () => '' };
    }),
  );
  return { asked };
}

beforeEach(() => {
  clearRigCache();
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  setPartyRigsMode(null);
  setDemoChapter(undefined);
});

describe('?partyrigs=v2', () => {
  it('is asked by the address only; off by default; on and v2 are two different words', () => {
    expect(partyRigsModeFromSearch(undefined)).toBe('off');
    expect(partyRigsModeFromSearch('?pack=demo')).toBe('off');
    expect(partyRigsModeFromSearch('?partyrigs=on')).toBe('on');
    expect(partyRigsModeFromSearch('?partyrigs=v2')).toBe('v2');
    expect(partyRigsModeFromSearch('?pack=demo&partyrigs=V2')).toBe('v2');
    expect(partyRigsModeFromSearch('?partyrigs=v3')).toBe('off');
    expect(partyRigsModeFromSearch('?partyrigs=2')).toBe('off');
  });

  it('lets a pilot draw in its own chapter only, exactly as `on` does; nothing else is this switch\'s', () => {
    expect(Object.keys(PARTY_RIG_SUBJECTS).sort()).toEqual(['rikku-dark-knight', 'tidus']);
    setPartyRigsMode('v2');
    setDemoChapter('seymour-flux');
    expect(partyRigAllowed('tidus')).toBe(true);
    expect(partyRigAllowed('rikku-dark-knight')).toBe(false); // FFX-2's pilot in an FFX chapter
    setDemoChapter('ffx2-bahamut');
    expect(partyRigAllowed('rikku-dark-knight')).toBe(true);
    expect(partyRigAllowed('tidus')).toBe(false); // FFX's pilot in an FFX-2 chapter
    setDemoChapter('yunalesca');
    expect(partyRigAllowed('tidus')).toBe(false);
    expect(partyRigAllowed('valefor')).toBe(true); // a boss: the rig engine's own rules
    setPartyRigsMode('off');
    setDemoChapter('seymour-flux');
    expect(partyRigAllowed('tidus')).toBe(false);
  });

  it('names the folder: <subject>-v2 for a pilot under v2, the subject itself in every other case', () => {
    expect(partyRigFolder('tidus', 'v2')).toBe('tidus-v2');
    expect(partyRigFolder('rikku-dark-knight', 'v2')).toBe('rikku-dark-knight-v2');
    expect(partyRigFolder('tidus', 'on')).toBe('tidus');
    expect(partyRigFolder('tidus', 'off')).toBe('tidus');
    expect(partyRigFolder('seymour-flux-body', 'v2')).toBe('seymour-flux-body'); // a boss rig never moves
    expect(partyRigFolder('lulu', 'v2')).toBe('lulu');
    setPartyRigsMode('v2');
    expect(rigBaseUrl('tidus')).toMatch(/art\/rigs\/tidus-v2$/);
    expect(rigBaseUrl('valefor')).toMatch(/art\/rigs\/valefor$/);
    setPartyRigsMode('on');
    expect(rigBaseUrl('tidus')).toMatch(/art\/rigs\/tidus$/);
  });
});

describe('the loader under v2', () => {
  it('reads rigs/tidus-v2/ and never the old folder; the rig file inside still says it is Tidus\'s', async () => {
    setPartyRigsMode('v2');
    const net = serve(['tidus-v2', 'tidus']);
    const c = await chooseRig('tidus', IDLE, { on: true, reason: 'default' }, false, async () => true, {});
    expect(net.asked.length).toBe(1);
    expect(net.asked[0]).toMatch(/\/art\/rigs\/tidus-v2\/rig\.json$/);
    expect(c.asset?.base).toMatch(/\/art\/rigs\/tidus-v2$/);
    expect(c.on).toBe(true); // the fixture's own gate is ok: the folder is the point
  });

  it('a missing v2 folder is the painting set with the folder named, not the old pilots', async () => {
    setPartyRigsMode('v2');
    const net = serve(['tidus']); // only the 2026-10-22 pilot is there
    const c = await chooseRig('tidus', IDLE, { on: true, reason: 'default' }, false, async () => true, {});
    expect(c.on).toBe(false);
    expect(c.reason).toBe('no rig.json in rigs/tidus-v2');
    expect(net.asked.every((u) => u.endsWith('/art/rigs/tidus-v2/rig.json'))).toBe(true);
  });

  it('the manifest is asked about the FOLDER: v2 needs rigs/tidus-v2 listed, and `on` still needs `tidus`', async () => {
    serve(['tidus-v2', 'tidus']);
    setPartyRigsMode('on');
    const asked: string[] = [];
    const only = (folderListed: string): ((s: string) => Promise<boolean>) => async (s) => (asked.push(s), partyRigFolder(s) === folderListed);
    expect((await chooseRig('tidus', IDLE, { on: true, reason: 'default' }, false, only('tidus-v2'), {})).reason).toBe('no rig listed in the art manifest');
    setPartyRigsMode('v2');
    expect((await chooseRig('tidus', IDLE, { on: true, reason: 'default' }, false, only('tidus'), {})).reason).toBe('no rig listed in the art manifest (rigs/tidus-v2)');
    expect(rigReport().find((r) => r.subject === 'tidus')?.on).toBe(false);
  });

  it('a flip between on and v2 does not hand one pilot the other\'s file (the read is kept per folder)', async () => {
    const net = serve(['tidus-v2', 'tidus']);
    setPartyRigsMode('on');
    await chooseRig('tidus', IDLE, { on: true, reason: 'default' }, false, async () => true, {});
    setPartyRigsMode('v2');
    await chooseRig('tidus', IDLE, { on: true, reason: 'default' }, false, async () => true, {});
    expect(net.asked.map((u) => u.split('/art/rigs/')[1])).toEqual(['tidus/rig.json', 'tidus-v2/rig.json']);
  });
});

describe('a rig honours `paint` (the stance look: the menu is the ready STATE on the idle painting)', () => {
  async function rigged(): Promise<RigActorT> {
    const r = readRig(makeRigFile());
    if (!r.ok) throw new Error(r.reason);
    return RigActor.createRigged({ name: 'testfig', worldHeight: 1.82, side: 'party', shadow: false }, { data: r.data, base: '/art/rigs/testfig', idlePainting: { ...hooks.idlePainting, url: '/art/characters/testfig/idle.png' } as Painted, loadTexture: hooks.loadTexture });
  }

  it('setPose(ready, { paint: idle }) is the ready state on the idle KEY; setPose(ready) is the ready key', async () => {
    const a = await rigged();
    a.setPose('ready', { paint: 'idle' });
    expect(a.pose).toBe('idle');
    expect(carrierOf(a).life?.state).toBe('ready');
    a.setPose('ready');
    expect(a.pose).toBe('ready');
    a.setPose('idle');
    expect(a.pose).toBe('idle');
  });

  it('a paint the rig has no key for falls down the game\'s own chain, and no paint changes nothing about any other pose', async () => {
    const a = await rigged();
    a.setPose('attack');
    expect(a.pose).toBe('attack');
    a.setPose('hurt', { paint: 'hurt' });
    expect(a.pose).toBe('hurt');
    a.setPose('ko', { immediate: true });
    expect(a.pose).toBe('ko');
  });
});
