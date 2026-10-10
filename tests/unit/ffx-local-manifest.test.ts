/**
 * **The manifest of Bailey's converted FFX files, and how the probe treats it** (`src/engine/ffx3d/localAssets.ts`; the hidden Fayth chapter's local `ffx` skin, `docs/plans/fayth-3d.md`).
 *
 * The converter lane writes `manifest.json` to the root of the folder the dev route serves (`/__ffx-local/manifest.json`); the shape was fixed by the coordinator on 2026-10-10:
 * `{ version: 1, encounter, upAxis: "y", units: "ffx", stage: { file }, actors: { <combatant id>: { file, rawHeight } }, source }`, every `file` relative to the manifest. What this file pins:
 *
 * 1. **The exact shape is accepted** and comes back typed; unknown extra fields are ignored and not passed on.
 * 2. **Anything malformed is refused**: the wrong version or conventions, a missing or mistyped field, a path that is absolute, has a scheme, a drive letter, a backslash, a parent step or a URL
 *    metacharacter. {@link checkFfxLocalManifest} names the first thing wrong, in the warning.
 * 3. **The probe is quiet when there is nothing and loud, once, when there is something wrong**: no server, a 404 and a fetch that throws are plain `null`; a found manifest that is not JSON, or
 *    of the wrong shape, is `null` with exactly one `console.warn`.
 *
 * Game case: FFX only (the files are FFX's). Pure parsing; the probe runs under a stubbed `fetch`.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { checkFfxLocalManifest, parseFfxLocalManifest, probeFfxLocal, type FfxLocalManifest } from '../../src/engine/ffx3d/localAssets.ts';

const good = (): Record<string, unknown> => ({
  version: 1,
  encounter: 'evrae-airship',
  upAxis: 'y',
  units: 'ffx',
  stage: { file: 'evrae/stage.glb' },
  actors: {
    evrae: { file: 'evrae/evrae.glb', rawHeight: 612.5 },
    tidus: { file: 'evrae/tidus.glb', rawHeight: 183 },
    wakka: { file: 'evrae/wakka.glb', rawHeight: 190.25 },
    rikku: { file: 'evrae/rikku.glb', rawHeight: 160 },
  },
  source: 'the Steam HD Remaster of FFX, converted on this PC',
});

/** `good()` with `edit` applied to a copy. */
const with_ = (edit: (m: Record<string, any>) => void): unknown => {
  const m = good() as Record<string, any>;
  edit(m);
  return m;
};

describe('the manifest shape', () => {
  it('accepts the exact shape and returns it typed, for the four actors of the first encounter and for later ones', () => {
    const manifest: FfxLocalManifest = parseFfxLocalManifest(good())!;
    expect(manifest).toEqual(good());
    expect(manifest.version).toBe(1);
    expect(Object.keys(manifest.actors)).toEqual(['evrae', 'tidus', 'wakka', 'rikku']);
    const later = with_((m) => {
      for (const id of ['lulu', 'auron', 'kimahri']) m['actors'][id] = { file: `evrae/${id}.glb`, rawHeight: 175 };
    });
    expect(Object.keys(parseFfxLocalManifest(later)!.actors)).toEqual(['evrae', 'tidus', 'wakka', 'rikku', 'lulu', 'auron', 'kimahri']);
    expect(parseFfxLocalManifest(with_((m) => (m['actors'] = {})))!.actors).toEqual({}); // no actor yet is a manifest, not a malformed one
    expect(parseFfxLocalManifest(with_((m) => (m['source'] = '')))).toMatchObject({ source: '' });
  });

  it('ignores a field it does not know and does not pass it on', () => {
    const extra = with_((m) => {
      m['converter'] = 'v2';
      m['actors']['tidus']['animations'] = ['idle'];
      m['stage']['lights'] = 3;
    });
    expect(parseFfxLocalManifest(extra)).toEqual(good());
  });

  it('refuses a wrong version or wrong conventions: a model that is not Y-up in the game\'s units would be drawn sideways or at the wrong size', () => {
    for (const [what, edit, problem] of [
      ['version 2', (m: Record<string, any>) => (m['version'] = 2), /version is 2, not 1/],
      ['version as text', (m: Record<string, any>) => (m['version'] = '1'), /version is "1", not 1/],
      ['no version', (m: Record<string, any>) => delete m['version'], /version is undefined, not 1/],
      ['upAxis z', (m: Record<string, any>) => (m['upAxis'] = 'z'), /upAxis is "z", not "y"/],
      ['no upAxis', (m: Record<string, any>) => delete m['upAxis'], /upAxis/],
      ['units in metres', (m: Record<string, any>) => (m['units'] = 'm'), /units is "m", not "ffx"/],
      ['no units', (m: Record<string, any>) => delete m['units'], /units/],
    ] as const) {
      const checked = checkFfxLocalManifest(with_(edit));
      expect('problem' in checked, what).toBe(true);
      expect((checked as { problem: string }).problem, what).toMatch(problem);
      expect(parseFfxLocalManifest(with_(edit)), what).toBeNull();
    }
  });

  it('refuses a missing or mistyped field', () => {
    for (const [what, edit] of [
      ['an empty encounter', (m: Record<string, any>) => (m['encounter'] = '')],
      ['a numeric encounter', (m: Record<string, any>) => (m['encounter'] = 8)],
      ['no stage', (m: Record<string, any>) => delete m['stage']],
      ['a stage that is a path, not an object', (m: Record<string, any>) => (m['stage'] = 'evrae/stage.glb')],
      ['a stage with no file', (m: Record<string, any>) => (m['stage'] = {})],
      ['no actors', (m: Record<string, any>) => delete m['actors']],
      ['actors as a list', (m: Record<string, any>) => (m['actors'] = [{ file: 'a.glb', rawHeight: 1 }])],
      ['an actor that is a path', (m: Record<string, any>) => (m['actors']['tidus'] = 'evrae/tidus.glb')],
      ['an actor with no file', (m: Record<string, any>) => delete m['actors']['tidus']['file']],
      ['an actor with no rawHeight', (m: Record<string, any>) => delete m['actors']['tidus']['rawHeight']],
      ['a rawHeight of 0', (m: Record<string, any>) => (m['actors']['tidus']['rawHeight'] = 0)],
      ['a negative rawHeight', (m: Record<string, any>) => (m['actors']['tidus']['rawHeight'] = -183)],
      ['a rawHeight that is not finite', (m: Record<string, any>) => (m['actors']['tidus']['rawHeight'] = Number.POSITIVE_INFINITY)],
      ['a rawHeight that is text', (m: Record<string, any>) => (m['actors']['tidus']['rawHeight'] = '183')],
      ['a source that is not text', (m: Record<string, any>) => (m['source'] = 3)],
      ['no source', (m: Record<string, any>) => delete m['source']],
    ] as const) {
      expect(parseFfxLocalManifest(with_(edit)), what).toBeNull();
    }
    for (const raw of [null, undefined, [], 'x', 1, true]) expect(parseFfxLocalManifest(raw), String(raw)).toBeNull();
  });

  it('refuses a path that is not relative to the manifest: absolute, a scheme, a drive letter, a backslash, a parent step, an empty step, a URL metacharacter', () => {
    const bad = [
      '', '/evrae/stage.glb', 'evrae/', 'evrae//stage.glb', './stage.glb', '../stage.glb', 'evrae/../../stage.glb', 'evrae/./stage.glb',
      'C:/Users/me/stage.glb', 'C:stage.glb', 'https://example.test/stage.glb', 'file:///etc/passwd', 'evrae\\stage.glb', '\\\\host\\share\\stage.glb',
      'evrae/stage.glb?x=1', 'evrae/stage.glb#top', 'evrae/%2e%2e/stage.glb', 'evrae/stage\0.glb', 'a'.repeat(300) + '.glb',
    ];
    for (const path of bad) {
      expect(parseFfxLocalManifest(with_((m) => (m['stage']['file'] = path))), `stage ${JSON.stringify(path)}`).toBeNull();
      expect(parseFfxLocalManifest(with_((m) => (m['actors']['evrae']['file'] = path))), `actor ${JSON.stringify(path)}`).toBeNull();
    }
    for (const path of ['stage.glb', 'evrae/stage.glb', 'evrae/textures/tidus body.png', 'a/b/c/d.glb', 'tidus_body-2.v1.glb']) {
      expect(parseFfxLocalManifest(with_((m) => (m['stage']['file'] = path))), path).not.toBeNull();
    }
  });

  it('names the first thing wrong, with the actor it is about', () => {
    const problem = (edit: (m: Record<string, any>) => void): string => (checkFfxLocalManifest(with_(edit)) as { problem: string }).problem;
    expect(problem((m) => (m['actors']['wakka']['rawHeight'] = 0))).toBe('actors.wakka.rawHeight is not a positive number');
    expect(problem((m) => (m['actors']['rikku']['file'] = '../rikku.glb'))).toBe('actors.rikku.file is not a relative path inside the folder');
    expect(problem((m) => (m['stage']['file'] = '/stage.glb'))).toBe('stage.file is not a relative path inside the folder');
  });
});

describe('the probe', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const stubbed = (answer: () => Promise<Response>) => {
    vi.stubEnv('DEV', true);
    vi.stubGlobal('fetch', vi.fn(answer));
    return vi.spyOn(console, 'warn').mockImplementation(() => {});
  };

  it('returns the manifest, silently, when the dev server has it', async () => {
    const warn = stubbed(async () => json(good()));
    expect(await probeFfxLocal()).toEqual(good());
    expect(warn).not.toHaveBeenCalled();
  });

  it('is plain null, with nothing logged, when there is nothing: a 404, any other error status, a fetch that throws', async () => {
    for (const answer of [async () => json({ error: 'no' }, 404), async () => json({}, 500), async () => { throw new TypeError('network down'); }]) {
      const warn = stubbed(answer);
      expect(await probeFfxLocal()).toBeNull();
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    }
  });

  it('is null with exactly one console.warn when a manifest is found and malformed: not JSON, a page, or the wrong shape', async () => {
    for (const [what, answer] of [
      ['a page instead of JSON', async () => new Response('<!doctype html><title>the dev page</title>', { status: 200, headers: { 'Content-Type': 'text/html' } })],
      ['half a file', async () => new Response('{"version":1,"encounter":"evrae', { status: 200, headers: { 'Content-Type': 'application/json' } })],
      ['an empty list', async () => json([])],
      ['version 2', async () => json({ ...good(), version: 2 })],
      ['an actor with no rawHeight', async () => json(with_((m) => delete m['actors']['evrae']['rawHeight']))],
      ['an absolute path', async () => json(with_((m) => (m['stage']['file'] = '/etc/passwd')))],
    ] as const) {
      const warn = stubbed(answer);
      expect(await probeFfxLocal(), what).toBeNull();
      expect(warn, what).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]?.[0]), what).toMatch(/^\[ffx-local\] ignoring __ffx-local\/manifest\.json: .+\. The chapter plays with its painted art\.$/);
      warn.mockRestore();
    }
  });

  it('puts the reason in its one warning', async () => {
    let warn = stubbed(async () => json({ ...good(), upAxis: 'z' }));
    await probeFfxLocal();
    expect(String(warn.mock.calls[0]?.[0])).toContain('upAxis is "z", not "y"');
    warn.mockRestore();
    warn = stubbed(async () => new Response('not json', { status: 200 }));
    await probeFfxLocal();
    expect(String(warn.mock.calls[0]?.[0])).toContain('it is not valid JSON');
  });
});
