/**
 * THE WIRING OF THE TREATED LIST, for the three chapters of batch 3a (release 71, branch `booth-ffx-b3a`; Chapter VII `seymour-anima-macalania`, Chapter X `seymour-natus`, Chapter IX `yojimbo-cavern`; FFX only). `booth-leblanc-wiring` pins the four places that ask the list on a page for
 * Chapter VI and `booth-yunalesca-wiring` the same for Chapter II; this pins them for the three: the pro layer's mount (in the `ffx` skin, `battleProStage.attachProStage`), the chapter run's sound pass (`sfxGame.sfxChapter` -> `passSwitch`: FFX's makeup and victory cue), and the debug word.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mounted: Array<{ game: string; nameOf?: unknown }> = [];
vi.mock('../../src/ui/common/proStage/ProStageLayer.ts', () => ({
  ProStageLayer: class {
    constructor(o: { game: string; nameOf?: unknown }) {
      mounted.push(o);
    }
  },
}));

import { attachProStage } from '../../src/app/screens/battleProStage.ts';
import { sfxChapter } from '../../src/app/sfxGame.ts';
import { audio } from '../../src/audio/index.ts';
import { audioNewOn, passGame, setAudioNew } from '../../src/audio/pass/passSwitch.ts';
import { passVictoryCue } from '../../src/audio/pass/passResults.ts';
import { installProDebug } from '../../src/debug/proApi.ts';
import { setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { setStagingMode } from '../../src/engine/pro/staging/StagingSwitch.ts';
import { getChapter } from '../../src/data/encounters.ts';

const IDS = ['seymour-anima-macalania', 'seymour-natus', 'yojimbo-cavern'] as const;
const HOLDS: Record<string, string[]> = { 'seymour-anima-macalania': ['breath', 'cam', 'moments'], 'seymour-natus': ['breath', 'moments'], 'yojimbo-cavern': ['breath', 'cam', 'moments'] };

const stage = { projectRect: () => null, project: () => null } as never;
const mount = (chapterId: string) => attachProStage({ root: {} as HTMLElement, chapterId, stage });

beforeEach(() => {
  mounted.length = 0;
  setStagingMode('pro');
});
afterEach(() => {
  setTreatedScope(null);
  setStagingMode(null);
  setDemoChapter(undefined);
  setAudioNew(null);
  vi.unstubAllGlobals();
});

describe.each(IDS)('the pro layer mounts for %s, in FFX\'s game', (id) => {
  it('under all it gets the layer with the ffx skin; under `?treated=pack` (release 68) it gets none; the booth pair keep theirs either way', () => {
    setTreatedScope('all');
    expect(mount(id)).not.toBeNull();
    expect(mounted.at(-1)!.game).toBe('ffx');
    setTreatedScope('pack');
    const built = mounted.length;
    expect(mount(id)).toBeNull();
    expect(mounted.length).toBe(built);
    expect(mount('seymour-flux')).not.toBeNull();
    expect(mount('ffx2-bahamut')).not.toBeNull();
  });

  it("with the staging at today's nothing mounts (a public address), unless the playtest board asks for the layer", () => {
    setTreatedScope('all');
    setStagingMode('today');
    expect(mount(id)).toBeNull();
    vi.stubGlobal('location', { search: '?pack=demo&switchboard=1' });
    expect(mount(id)).not.toBeNull();
  });
});

describe.each(IDS)('the sound pass follows the %s run', (id) => {
  it("the run has the pass on in FFX (the master makeup is asked for, and the chapter's own results cue is the one the pass starts at the last blow: the cheer path), and the run's end gives it back", () => {
    setTreatedScope('all');
    setAudioNew(true);
    const makeup = vi.spyOn(audio, 'setPassMakeup');
    const done = sfxChapter(id, () => undefined);
    expect(audioNewOn()).toBe(true);
    expect(passGame()).toBe('ffx');
    expect(makeup.mock.calls.at(-1)![0]).toBeGreaterThan(0);
    expect(passVictoryCue()).toBe(getChapter(id)!.music.victory); // `victory-ffx`: FFX's chapter cue starts at the last blow and the sting is dropped (T26: the cheer path, unlike Zanarkand)
    done();
    expect(audioNewOn()).toBe(false);
    expect(passGame()).toBeNull();
    expect(passVictoryCue()).toBeNull();
    expect(makeup.mock.calls.at(-1)![0]).toBe(0);
    makeup.mockRestore();
  });

  it('under `?treated=pack` the pass stays off in the chapter, as in release 68', () => {
    setAudioNew(true);
    setTreatedScope('pack');
    const done = sfxChapter(id, () => undefined);
    expect(audioNewOn()).toBe(false);
    done();
  });
});

describe('`__pyrefly.treated()` knows them', () => {
  it('lists the three, names each chapter\'s holds and says whether the running chapter is reached', () => {
    const api: Record<string, unknown> = {};
    installProDebug(api);
    const treated = api['treated'] as (scope?: 'all' | 'pack' | null) => { scope: string; chapters: string[]; holds: Record<string, string[]>; running: string | null; reaches: boolean };
    const all = treated('all');
    for (const id of IDS) {
      expect(all.chapters).toContain(id);
      expect(all.holds[id]).toEqual(HOLDS[id]);
      setDemoChapter(id);
      expect(treated().reaches, id).toBe(true);
      expect(treated('pack').reaches, id).toBe(false);
      treated('all');
    }
    treated(null);
  });
});
