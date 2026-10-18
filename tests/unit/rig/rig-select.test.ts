import { Texture } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRigFile } from './rig-fixture.ts';

vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const { PaintedActor } = await import('../../../src/engine/PaintedActor.ts');
const { RigActor } = await import('../../../src/engine/rig/RigActor.ts');
const { buildFigure } = await import('../../../src/engine/rig/RigStage.ts');
const { chooseRig, clearRigCache, rigFromQuery, rigReport, rigSwitch } = await import('../../../src/engine/rig/RigLoad.ts');
const { parseArtManifest, resetArtManifest, setArtManifest } = await import('../../../src/engine/ArtManifest.ts');
type RigFile = import('../../../src/data/art/rigTypes.ts').RigFile;

const IDLE = '/art/characters/testfig/idle.png';
const hooks = {
  idlePainting: { texture: new Texture(), meta: { width: 400, height: 800, baselineY: 780 }, placeholder: false, url: IDLE },
  loadTexture: async (): Promise<Texture> => new Texture(),
};

/** A fetch that answers `/art/rigs/testfig/rig.json` with `body` (a file, or a Response-like), and counts. */
function serve(body: RigFile | { status: number; text?: string } | null): ReturnType<typeof vi.fn> {
  const f = vi.fn(async (url: string) => {
    if (!String(url).endsWith('/art/rigs/testfig/rig.json') || body === null) return { ok: false, status: 404, text: async () => '' };
    if ('status' in body) return { ok: body.status < 400, status: body.status, text: async () => body.text ?? '' };
    return { ok: true, status: 200, text: async () => JSON.stringify(body) };
  });
  vi.stubGlobal('fetch', f);
  return f;
}

const request = (over: Record<string, unknown> = {}): Parameters<typeof buildFigure>[0] => ({
  id: 'testfig',
  artId: 'testfig',
  poses: { idle: IDLE, attack: '/art/characters/testfig/attack.png' },
  opts: { name: 'testfig', worldHeight: 1.82, side: 'party', shadow: false },
  hooks,
  listed: async () => true,
  ...over,
});

let info: ReturnType<typeof vi.spyOn>;
let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  clearRigCache();
  info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const lastReason = (): string => rigReport().find((r) => r.subject === 'testfig')!.reason;

describe('the switch', () => {
  it('?rig=on and ?rig=off read; anything else is nothing', () => {
    expect(rigFromQuery('?rig=on')).toBe(true);
    expect(rigFromQuery('?x=1&rig=off')).toBe(false);
    expect(rigFromQuery('?rig=maybe')).toBeNull();
    expect(rigFromQuery('')).toBeNull();
  });

  it('the query beats the setting; the setting beats the default; the default is on', () => {
    expect(rigSwitch(undefined, '')).toEqual({ on: true, reason: 'default' });
    expect(rigSwitch(() => false, '')).toEqual({ on: false, reason: 'the fxRig setting is off' });
    expect(rigSwitch(() => true, '')).toEqual({ on: true, reason: 'default' });
    expect(rigSwitch(() => false, '?rig=on').on).toBe(true);
    expect(rigSwitch(() => true, '?rig=off').on).toBe(false);
  });
});

describe('the stage draws a RigActor only for a gated rig whose costume is the figure idle painting and whose switch is on; everything else is the painting set', () => {
  it('a gated rig, switch on: a RigActor, logged once, listed by rigs()', async () => {
    const f = serve(makeRigFile());
    const a = await buildFigure(request());
    expect(a.actor).toBeInstanceOf(RigActor);
    expect(a.rig).not.toBeNull();
    expect(f).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith(expect.stringMatching(/^\[rig\] testfig on \(gate ok, 6 parts, 11 bones, 5 keys\)$/));
    // a second figure of the subject reads nothing again and logs nothing again
    const b = await buildFigure(request({ id: 'testfig-2' }));
    expect(b.rig).not.toBeNull();
    expect(f).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledTimes(1);
    const rep = rigReport().find((r) => r.subject === 'testfig')!;
    expect(rep).toMatchObject({ on: true, ids: ['testfig', 'testfig-2'] });
    expect(rep.info).toMatchObject({ name: 'testfig', parts: 6, bones: 11 });
  });

  it('a planted key whose sole leaves the floor does not stop the rig (the pipeline gate does that) but is a warning, listed by rigs()', async () => {
    const f = makeRigFile();
    f.keys['attack']!.bones['thighN'] = { rot: 0.9 };
    f.keys['attack']!.bones['thighF'] = { rot: 0.9 };
    serve(f);
    const a = await buildFigure(request());
    expect(a.rig).not.toBeNull();
    expect(lastReason()).toMatch(/, 1 feet warning\(s\)$/);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^\[rig\] testfig: key attack: the lowest foot/));
    expect(rigReport().find((r) => r.subject === 'testfig')!.warnings).toHaveLength(1);
  });

  it('no rig.json (404, or index.html answered with a 200): the painting set, and it says so', async () => {
    serve(null);
    const a = await buildFigure(request());
    expect(a.actor).toBeInstanceOf(PaintedActor);
    expect(a.actor).not.toBeInstanceOf(RigActor);
    expect(a.rig).toBeNull();
    expect(lastReason()).toBe('no rig.json');
    expect(info).toHaveBeenCalledWith('[rig] testfig off (no rig.json)');
    clearRigCache();
    serve({ status: 200, text: '<!doctype html><html></html>' });
    expect((await buildFigure(request())).rig).toBeNull();
    expect(lastReason()).toBe('no rig.json');
  });

  it('gate refused, no gate, or blocked: the painting set', async () => {
    for (const gate of [{ status: 'refused' as const, at: 'x', by: 'y' }, { status: 'blocked' as const, at: 'x', by: 'y', why: 'holes' }, undefined]) {
      clearRigCache();
      serve(makeRigFile({ gate }));
      const a = await buildFigure(request());
      expect(a.actor, String(gate?.status)).not.toBeInstanceOf(RigActor);
      expect(lastReason()).toMatch(gate ? /^gate (refused|blocked)/ : /^no gate$/);
    }
  });

  it('switch off (?rig=off, or the setting): the painting set, and the rig is not even fetched', async () => {
    const f = serve(makeRigFile());
    const a = await buildFigure(request({ setting: () => false }));
    expect(a.actor).not.toBeInstanceOf(RigActor);
    expect(f).not.toHaveBeenCalled();
    expect(lastReason()).toMatch(/^switch off/);
  });

  it('a costume that is not this figure idle painting, a rig for another subject, an invalid file: the painting set', async () => {
    serve(makeRigFile({ costume: { painting: 'characters/testfig/ready', sha: 'a' } }));
    expect((await buildFigure(request())).rig).toBeNull();
    expect(lastReason()).toMatch(/costume .* is not this figure's idle painting/);
    clearRigCache();
    serve(makeRigFile({ name: 'someone-else' }));
    expect((await buildFigure(request())).rig).toBeNull();
    expect(lastReason()).toBe('the rig is for "someone-else"');
    clearRigCache();
    serve(makeRigFile({ version: 3 as never }));
    expect((await buildFigure(request())).rig).toBeNull();
    expect(lastReason()).toMatch(/^invalid rig.json: version 3/);
  });

  it('a rig that fails to build (a texture will not load, the idle is the wrong shape) is the painting set, with the reason, and warns', async () => {
    serve(makeRigFile());
    const bad = { ...hooks, loadTexture: async (): Promise<Texture> => { throw new Error('404 body.png'); } };
    const a = await buildFigure(request({ hooks: bad }));
    expect(a.actor).toBeInstanceOf(PaintedActor);
    expect(a.actor).not.toBeInstanceOf(RigActor);
    expect(lastReason()).toBe('build failed: 404 body.png');
    expect(warn).toHaveBeenCalledWith('[rig] testfig off (build failed: 404 body.png)');
    clearRigCache();
    serve(makeRigFile());
    const wide = { ...hooks, idlePainting: { ...hooks.idlePainting, meta: { width: 900, height: 800, baselineY: 780 } } };
    expect((await buildFigure(request({ hooks: wide }))).rig).toBeNull();
    expect(lastReason()).toMatch(/was cut from 400x800/);
  });

  it('a figure-less part never gets a rig', async () => {
    const f = serve(makeRigFile());
    const a = await buildFigure(request({ opts: { name: 'ring', figure: false, shadow: false } }));
    expect(a.actor).not.toBeInstanceOf(RigActor);
    expect(f).not.toHaveBeenCalled();
  });

  it('no request at all for a subject the art manifest does not list (a 404 a figure would be a console error); ?rig=on asks anyway', async () => {
    const f = serve(makeRigFile());
    const a = await buildFigure(request({ listed: async () => false }));
    expect(a.rig).toBeNull();
    expect(f).not.toHaveBeenCalled();
    expect(lastReason()).toBe('no rig listed in the art manifest');
    clearRigCache();
    const b = await buildFigure(request({ listed: async () => false, search: '?rig=on' }));
    expect(b.rig).not.toBeNull();
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('the art manifest is the list: a subject named in its rigs is asked for, one that is not is not, and a manifest with none lists none', async () => {
    const f = serve(makeRigFile());
    setArtManifest(parseArtManifest({ subjects: {}, rigs: ['testfig', 7] }));
    expect((await buildFigure(request({ listed: undefined }))).rig).not.toBeNull();
    expect(f).toHaveBeenCalledTimes(1);
    clearRigCache();
    setArtManifest(parseArtManifest({ subjects: {}, rigs: ['someone'] }));
    expect((await buildFigure(request({ listed: undefined }))).rig).toBeNull();
    expect(f).toHaveBeenCalledTimes(1);
    setArtManifest(parseArtManifest({ subjects: {} }));
    expect(parseArtManifest({ subjects: {} })).not.toHaveProperty('rigs');
    expect(parseArtManifest({ subjects: {}, rigs: ['a', 3] })!.rigs).toEqual(['a']);
    expect((await buildFigure(request({ listed: undefined }))).rig).toBeNull();
    expect(f).toHaveBeenCalledTimes(1);
    resetArtManifest();
  });

  it('chooseRig never rejects, whatever the network does', async () => {
    vi.stubGlobal('fetch', async () => { throw new TypeError('offline'); });
    const c = await chooseRig('testfig', IDLE, { on: true, reason: '?rig=on' });
    expect(c).toMatchObject({ on: false, reason: 'no rig.json' });
  });
});
