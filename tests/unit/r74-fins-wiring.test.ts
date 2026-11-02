/**
 * THE WIRING OF THE TREATED LIST FOR CHAPTER XVII (r74-fins, 2026-11-02; FFX only, rule 14). `booth-b4-last-wiring` pins the four places that ask the list on a page for the four chapters of the last batch; this pins the same four for the
 * chapter that joined after them: the pro layer's mount (`battleProStage.attachProStage`), the chapter run's sound pass (`sfxGame.sfxChapter` -> `passSwitch`: FFX's makeup and the chapter's own `victory-ffx`), the playtest board's gate, and the
 * debug word `__pyrefly.treated()` (with the new hold row). Under `?treated=pack` (release 68) none of them reaches the chapter, as before.
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
import { getChapter } from '../../src/data/encounters.ts';
import { PIECE_HOLDS, TREATED_CHAPTERS, setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { setStagingMode } from '../../src/engine/pro/staging/StagingSwitch.ts';

const ID = 'sin-fins-core';
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

describe(`the pro layer mounts for ${ID}, in FFX's game`, () => {
  it("under all it gets the layer with FFX's skin; under `?treated=pack` (release 68) it gets none; the booth pair keep theirs either way", () => {
    setTreatedScope('all');
    expect(mount(ID)).not.toBeNull();
    expect(mounted.at(-1)!.game).toBe('ffx');
    setTreatedScope('pack');
    const built = mounted.length;
    expect(mount(ID)).toBeNull();
    expect(mounted.length).toBe(built);
    expect(mount('seymour-flux')).not.toBeNull();
    expect(mount('ffx2-bahamut')).not.toBeNull();
  });

  it("with the staging at today's nothing mounts (a public address), unless the playtest board asks for the layer", () => {
    setTreatedScope('all');
    setStagingMode('today');
    expect(mount(ID)).toBeNull();
    vi.stubGlobal('location', { search: '?pack=demo&switchboard=1' });
    expect(mount(ID)).not.toBeNull();
  });
});

describe('the sound pass follows the chapter run', () => {
  it("a run has the pass on in FFX (the master makeup is asked for, and the victory cue is the chapter's own `victory-ffx`, which starts at the last blow), and the run's end gives it back", () => {
    setTreatedScope('all');
    setAudioNew(true);
    const makeup = vi.spyOn(audio, 'setPassMakeup');
    const done = sfxChapter(ID, () => undefined);
    expect(audioNewOn()).toBe(true);
    expect(passGame()).toBe('ffx');
    expect(makeup.mock.calls.at(-1)![0]).toBeGreaterThan(0);
    expect(passVictoryCue()).toBe(getChapter(ID)!.music.victory);
    expect(getChapter(ID)!.music.victory).toBe('victory-ffx'); // the one fanfare the FFX chapters share
    done();
    expect(audioNewOn()).toBe(false);
    expect(passGame()).toBeNull();
    expect(passVictoryCue()).toBeNull();
    expect(makeup.mock.calls.at(-1)![0]).toBe(0);
    makeup.mockRestore();
  });

  it('under `?treated=pack` the pass stays off, as in release 68', () => {
    setAudioNew(true);
    setTreatedScope('pack');
    const done = sfxChapter(ID, () => undefined);
    expect(audioNewOn()).toBe(false);
    done();
  });
});

describe('`__pyrefly.treated()` knows the chapter', () => {
  it('lists it with its six holds in the row\'s order, in FFX\'s game, and says whether the running chapter is reached', () => {
    const api: Record<string, unknown> = {};
    installProDebug(api);
    const treated = api['treated'] as (scope?: 'all' | 'pack' | null) => { scope: string; chapters: string[]; holds: Record<string, string[]>; running: string | null; reaches: boolean };
    const all = treated('all');
    expect(all.chapters).toContain(ID);
    expect(all.holds[ID]).toEqual(['hd2d', 'arena', 'breath', 'cam', 'moments', 'real']);
    expect(all.holds[ID]).toEqual(Object.keys(PIECE_HOLDS[ID]!));
    expect(TREATED_CHAPTERS[ID]!.game).toBe('ffx');
    setDemoChapter(ID);
    expect(treated().reaches).toBe(true);
    expect(treated('pack').reaches).toBe(false);
    treated('all');
    treated(null);
  });
});
