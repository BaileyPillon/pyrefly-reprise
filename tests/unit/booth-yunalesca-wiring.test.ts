/**
 * THE WIRING OF THE TREATED LIST, for Chapter II (release 69, branch `booth-ffx-yunalesca`; `yunalesca`, FFX only). `booth-leblanc-wiring` pins the four places that ask the list on a page for Chapter VI; this pins the same four for the first FFX chapter
 * beyond Chapter I: the pro layer's mount (in FFX's game, `battleProStage.attachProStage`), the chapter run's sound pass (`sfxGame.sfxChapter` -> `passSwitch`: FFX's makeup, FFX's victory cue), the playtest board's gate, and the debug word.
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

describe('the pro layer mounts for Chapter II, in FFX\'s game', () => {
  it('under all it gets the layer with the ffx skin; under `?treated=pack` (release 68) it gets none; the booth pair keep theirs either way', () => {
    setTreatedScope('all');
    expect(mount('yunalesca')).not.toBeNull();
    expect(mounted.at(-1)!.game).toBe('ffx');
    setTreatedScope('pack');
    const built = mounted.length;
    expect(mount('yunalesca')).toBeNull();
    expect(mounted.length).toBe(built);
    expect(mount('seymour-flux')).not.toBeNull();
    expect(mount('ffx2-bahamut')).not.toBeNull();
  });

  it("with the staging at today's nothing mounts (a public address), unless the playtest board asks for the layer", () => {
    setTreatedScope('all');
    setStagingMode('today');
    expect(mount('yunalesca')).toBeNull();
    vi.stubGlobal('location', { search: '?pack=demo&switchboard=1' });
    expect(mount('yunalesca')).not.toBeNull();
  });
});

describe('the sound pass follows the chapter run', () => {
  it("a Chapter II run has the pass on in FFX (the master makeup is asked for, and the chapter's own results cue is the one the pass would start), and the run's end gives it back", () => {
    setTreatedScope('all');
    setAudioNew(true);
    const makeup = vi.spyOn(audio, 'setPassMakeup');
    const done = sfxChapter('yunalesca', () => undefined);
    expect(audioNewOn()).toBe(true);
    expect(passGame()).toBe('ffx');
    expect(makeup.mock.calls.at(-1)![0]).toBeGreaterThan(0);
    expect(passVictoryCue()).toBe('victory-ffx'); // read only by `passEarlyVictory`, which the `hold` victory never reaches (no sting and no early cue at Zanarkand: nobody poses, no fanfare flourish)
    done();
    expect(audioNewOn()).toBe(false);
    expect(passGame()).toBeNull();
    expect(passVictoryCue()).toBeNull();
    expect(makeup.mock.calls.at(-1)![0]).toBe(0);
    makeup.mockRestore();
  });

  it('under `?treated=pack` the pass stays off in her chapter, as in release 68', () => {
    setAudioNew(true);
    setTreatedScope('pack');
    const done = sfxChapter('yunalesca', () => undefined);
    expect(audioNewOn()).toBe(false);
    done();
  });
});

describe('`__pyrefly.treated()` knows her', () => {
  it('lists her, names her three holds and says whether the running chapter is reached', () => {
    const api: Record<string, unknown> = {};
    installProDebug(api);
    const treated = api['treated'] as (scope?: 'all' | 'pack' | null) => { scope: string; chapters: string[]; holds: Record<string, string[]>; running: string | null; reaches: boolean };
    const all = treated('all');
    expect(all.chapters).toContain('yunalesca');
    expect([...all.holds['yunalesca']!].sort()).toEqual(['breath', 'cam', 'smear']);
    setDemoChapter('yunalesca');
    expect(treated().reaches).toBe(true);
    expect(treated('pack').reaches).toBe(false);
    treated(null);
  });
});
