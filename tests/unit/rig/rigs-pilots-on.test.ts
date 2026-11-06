/**
 * Pilots on (2026-11-06; Tidus FFX only, Rikku's Dark Knight FFX-2 only; the switch and the loader are shared plumbing, both games): with NO address word Tidus draws as a rig in Chapter I (`seymour-flux`)
 * and Rikku's Dark Knight in Chapter IV (`ffx2-bahamut`); `?partyrigs=off` gives the painting set back; every other chapter and every other figure is exactly what it was.
 *
 * "Exactly what it was" is proved, not asserted: for every chapter the game has (listed, unlisted and experimental) and every art id the pose registrations know (plus the rigged bosses), the stage's question
 * `partyRigAllowed(artId)` has the same answer under the new default as under `?partyrigs=off` (which is what the default was before today), except for the two pilot pairs.
 */
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
const { clearRigCache, rigBaseUrl, rigReport } = await import('../../../src/engine/rig/RigLoad.ts');
const { PARTY_RIGS_DEFAULT, PARTY_RIG_SUBJECTS, partyRigAllowed, partyRigFolder, partyRigsMode, setPartyRigsMode } = await import('../../../src/engine/motion/PartyRigsSwitch.ts');
const { DEMO_CHAPTERS, setDemoChapter } = await import('../../../src/engine/motion/DemoGate.ts');
const { CHAPTERS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS } = await import('../../../src/data/encounters.ts');
const { POSE_REGISTRATION_FFX } = await import('../../../src/data/art/poseRegistrationFfx.ts');
const { POSE_REGISTRATION_FFX2 } = await import('../../../src/data/art/poseRegistrationFfx2.ts');
const { POSE_REGISTRATION_EXP } = await import('../../../src/data/art/poseRegistrationExp.ts');
const { POSE_REGISTRATION_FOES } = await import('../../../src/data/art/poseRegistrationFoes.ts');
const { switchOfCode } = await import('../../../src/app/demo/switchboardModel.ts');
type RigFile = import('../../../src/data/art/rigTypes.ts').RigFile;

/** The two pairs the new default changes, and nothing else. */
const PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['seymour-flux', 'tidus'],
  ['ffx2-bahamut', 'rikku-dark-knight'],
];
const isPair = (chapter: string | undefined, art: string): boolean => PAIRS.some(([c, a]) => c === chapter && a === art);

const chapterIds = (): string[] => [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS].map((c) => c.id);
const artIds = (): string[] =>
  [...new Set([...Object.keys(POSE_REGISTRATION_FFX), ...Object.keys(POSE_REGISTRATION_FFX2), ...Object.keys(POSE_REGISTRATION_EXP), ...Object.keys(POSE_REGISTRATION_FOES), 'seymour-flux-body', 'ffx2-bahamut', 'valefor', 'ifrit', 'pterya', 'lulu', 'tidus', 'rikku-dark-knight'])].sort();

/** The address the page would have: `partyRigsMode()` reads `globalThis.location.search` (null = read it again). */
function address(search: string | null): void {
  setPartyRigsMode(null);
  if (search === null) vi.stubGlobal('location', undefined);
  else vi.stubGlobal('location', { search });
}

const hooksFor = (idle: string): { idlePainting: never; loadTexture: () => Promise<Texture> } => ({
  idlePainting: { texture: new Texture(), meta: { width: 400, height: 800, baselineY: 780 }, placeholder: false, url: idle } as never,
  loadTexture: async (): Promise<Texture> => new Texture(),
});

/** A pilot's rig file: the fixture's parts and keys under the pilot's name and costume. */
function pilotFile(name: string): RigFile {
  const f = makeRigFile() as unknown as RigFile & { name: string; costume: { painting: string; sha: string } };
  f.name = name;
  f.costume = { painting: `characters/${name}/idle`, sha: '' };
  return f;
}

/** A fetch that answers `rigs/<folder>/rig.json` for the folders named, and records every URL asked. */
function serve(files: Record<string, RigFile>): { asked: string[] } {
  const asked: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      asked.push(String(url));
      const m = /\/art\/rigs\/([^/]+)\/rig\.json$/.exec(String(url));
      const file = m ? files[m[1]!] : undefined;
      return file ? { ok: true, status: 200, text: async () => JSON.stringify(file) } : { ok: false, status: 404, text: async () => '' };
    }),
  );
  return { asked };
}

const request = (art: string, over: Record<string, unknown> = {}): Parameters<typeof buildFigure>[0] => ({
  id: `${art}-1`,
  artId: art,
  poses: { idle: `/art/characters/${art}/idle.png`, attack: `/art/characters/${art}/attack.png` },
  opts: { name: art, worldHeight: 1.82, side: 'party', shadow: false },
  hooks: hooksFor(`/art/characters/${art}/idle.png`),
  listed: async () => true,
  ...over,
});

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

describe('the default: the pilots are on with no address word', () => {
  it('the constant says on, and a page with no search, an empty one, ?pack=demo alone or a word the switch does not know reads it', () => {
    expect(PARTY_RIGS_DEFAULT).toBe('on');
    for (const search of [null, '', '?pack=demo', '?chapter=seymour-flux', '?partyrigs=maybe']) {
      address(search);
      expect(partyRigsMode(), String(search)).toBe('on');
    }
  });

  it('?partyrigs=off is the only way back to the paintings, whatever else the address says', () => {
    for (const search of ['?partyrigs=off', '?pack=demo&partyrigs=off', '?partyrigs=OFF&pro=on']) {
      address(search);
      expect(partyRigsMode(), search).toBe('off');
    }
    address('?partyrigs=v2');
    expect(partyRigsMode()).toBe('v2'); // the dev-only side-by-side is still its own word
  });

  it('the rig is read from rigs/<subject>/ (what the art mirror ships), never from a -v2 folder, with no address word', () => {
    address('');
    expect(partyRigFolder('tidus')).toBe('tidus');
    expect(partyRigFolder('rikku-dark-knight')).toBe('rikku-dark-knight');
    expect(rigBaseUrl('tidus')).toMatch(/art\/rigs\/tidus$/);
    expect(rigBaseUrl('rikku-dark-knight')).toMatch(/art\/rigs\/rikku-dark-knight$/);
  });

  it('the switchboard\'s period key reads on at the start and flips off and on', () => {
    address('');
    const row = switchOfCode('Period')!;
    expect(row.read()).toBe('on');
    expect(row.flip!()).toBe('off');
    expect(partyRigAllowed('tidus')).toBe(false);
    expect(row.flip!()).toBe('on');
  });
});

describe('nothing else changed: the stage\'s question has the same answer as before for every chapter and every figure but the two pairs', () => {
  it('knows the chapters and the figures it sweeps (the sweep is not empty)', () => {
    expect(chapterIds().length).toBeGreaterThanOrEqual(19);
    expect(chapterIds()).toEqual(expect.arrayContaining(['seymour-flux', 'ffx2-bahamut', 'yunalesca', 'ffx2-leblanc', 'evrae-airship', 'sin-face', 'mirror-aeons']));
    expect(artIds().length).toBeGreaterThan(60);
    expect(artIds()).toEqual(expect.arrayContaining(['tidus', 'rikku-dark-knight', 'valefor', 'seymour-flux-body', 'auron', 'yuna']));
    expect(Object.keys(DEMO_CHAPTERS).sort()).toEqual(['ffx2-bahamut', 'seymour-flux']);
    expect(PARTY_RIG_SUBJECTS).toEqual({ tidus: 'ffx', 'rikku-dark-knight': 'ffx2' });
  });

  it('every (chapter, figure): default = ?partyrigs=off, except Tidus in Chapter I and Rikku\'s Dark Knight in Chapter IV', () => {
    const changed: string[] = [];
    let swept = 0;
    for (const chapter of [...chapterIds(), undefined]) {
      for (const art of artIds()) {
        setDemoChapter(chapter);
        address('');
        const now = partyRigAllowed(art);
        address('?partyrigs=off');
        const before = partyRigAllowed(art);
        swept++;
        if (now !== before) changed.push(`${chapter}/${art}`);
        if (!isPair(chapter, art)) expect(now, `${chapter}/${art}`).toBe(before);
      }
    }
    expect(swept).toBeGreaterThan(1000);
    expect(changed.sort()).toEqual(['ffx2-bahamut/rikku-dark-knight', 'seymour-flux/tidus']);
  });

  it('the two pairs: on by default, off with ?partyrigs=off, and each pilot only in its own chapter', () => {
    setDemoChapter('seymour-flux');
    address('');
    expect(partyRigAllowed('tidus')).toBe(true);
    expect(partyRigAllowed('rikku-dark-knight')).toBe(false); // FFX-2's pilot in an FFX chapter
    address('?partyrigs=off');
    expect(partyRigAllowed('tidus')).toBe(false);
    setDemoChapter('ffx2-bahamut');
    address('');
    expect(partyRigAllowed('rikku-dark-knight')).toBe(true);
    expect(partyRigAllowed('tidus')).toBe(false); // FFX's pilot in an FFX-2 chapter
    address('?partyrigs=off');
    expect(partyRigAllowed('rikku-dark-knight')).toBe(false);
  });

  it('every figure that is not a pilot is not this switch\'s in any mode (the rig engine\'s own rules decide it)', () => {
    for (const mode of ['', '?partyrigs=off', '?partyrigs=on', '?partyrigs=v2']) {
      address(mode);
      for (const chapter of [...chapterIds(), undefined]) {
        setDemoChapter(chapter);
        for (const art of artIds()) if (!(art in PARTY_RIG_SUBJECTS)) expect(partyRigAllowed(art), `${mode} ${chapter}/${art}`).toBe(true);
      }
    }
  });
});

describe('through the stage (the real buildFigure and RigActor, a fake rig file under the pilot\'s name)', () => {
  it('Tidus in Chapter I: a RigActor from rigs/tidus/rig.json, one read, with no address word', async () => {
    address('');
    setDemoChapter('seymour-flux');
    const net = serve({ tidus: pilotFile('tidus') });
    const built = await buildFigure(request('tidus'));
    expect(built.actor).toBeInstanceOf(RigActor);
    expect(built.rig).not.toBeNull();
    expect(net.asked.map((u) => u.split('/art/rigs/')[1])).toEqual(['tidus/rig.json']);
    expect(rigReport().find((r) => r.subject === 'tidus')?.on).toBe(true);
  });

  it('Rikku\'s Dark Knight in Chapter IV: a RigActor from rigs/rikku-dark-knight/rig.json', async () => {
    address('');
    setDemoChapter('ffx2-bahamut');
    const net = serve({ 'rikku-dark-knight': pilotFile('rikku-dark-knight') });
    const built = await buildFigure(request('rikku-dark-knight'));
    expect(built.actor).toBeInstanceOf(RigActor);
    expect(net.asked.map((u) => u.split('/art/rigs/')[1])).toEqual(['rikku-dark-knight/rig.json']);
  });

  it('?partyrigs=off: the painting set in both chapters, and the rig is not even fetched', async () => {
    address('?partyrigs=off');
    const net = serve({ tidus: pilotFile('tidus'), 'rikku-dark-knight': pilotFile('rikku-dark-knight') });
    setDemoChapter('seymour-flux');
    const t = await buildFigure(request('tidus'));
    expect(t.actor).toBeInstanceOf(PaintedActor);
    expect(t.actor).not.toBeInstanceOf(RigActor);
    expect(t.rig).toBeNull();
    setDemoChapter('ffx2-bahamut');
    const r = await buildFigure(request('rikku-dark-knight'));
    expect(r.rig).toBeNull();
    expect(net.asked).toEqual([]);
  });

  it('a pilot in any other chapter, or the other pilot in this one: the painting set and no read, with the default on', async () => {
    address('');
    const net = serve({ tidus: pilotFile('tidus'), 'rikku-dark-knight': pilotFile('rikku-dark-knight') });
    for (const [chapter, art] of [['yunalesca', 'tidus'], ['braskas-final-aeon', 'tidus'], ['ffx2-leblanc', 'rikku-dark-knight'], ['seymour-flux', 'rikku-dark-knight'], ['ffx2-bahamut', 'tidus']] as const) {
      setDemoChapter(chapter);
      const built = await buildFigure(request(art));
      expect(built.rig, `${chapter}/${art}`).toBeNull();
    }
    expect(net.asked).toEqual([]);
  });

  it('a gated figure that is not a pilot reads exactly as before, default or off (Valefor in Chapter I asks for its own rig either way)', async () => {
    const asks: string[][] = [];
    for (const search of ['', '?partyrigs=off']) {
      address(search);
      clearRigCache();
      setDemoChapter('seymour-flux');
      const net = serve({ valefor: pilotFile('valefor') });
      const built = await buildFigure(request('valefor'));
      expect(built.rig, search).not.toBeNull();
      asks.push(net.asked.map((u) => u.split('/art/rigs/')[1]!));
    }
    expect(asks[0]).toEqual(['valefor/rig.json']);
    expect(asks[1]).toEqual(asks[0]);
  });

  it('a pilot whose rig is not in the mirror is the painting set with the reason on record (the install is what makes it a rig)', async () => {
    address('');
    setDemoChapter('seymour-flux');
    serve({});
    const built = await buildFigure(request('tidus'));
    expect(built.actor).toBeInstanceOf(PaintedActor);
    expect(rigReport().find((r) => r.subject === 'tidus')).toMatchObject({ on: false, reason: 'no rig.json' });
  });
});
