/**
 * THE WIRING OF THE TREATED LIST, for the last five listed chapters (release 71, branch `booth-b4-last`; Chapters VIII, XVIII and the Mirror Aeons chapter are FFX only, Chapter XVI is FFX-2 only). `booth-yunalesca-wiring` and `booth-ffx-b3b-wiring` pin the four places that ask the list on a page: the
 * pro layer's mount (`battleProStage.attachProStage`), the chapter run's sound pass (`sfxGame.sfxChapter` -> `passSwitch`: each game's makeup and victory cue), the playtest board's gate, and the debug word `__pyrefly.treated()`. This pins the same four for the four chapters that joined, and that Chapter XVII
 * (not treated) gets none of them.
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

const IDS = ['evrae-airship', 'sin-face', 'mirror-aeons', 'ffx2-ixion-djose'] as const;
const GAME: Record<(typeof IDS)[number], 'ffx' | 'ffx2'> = { 'evrae-airship': 'ffx', 'sin-face': 'ffx', 'mirror-aeons': 'ffx', 'ffx2-ixion-djose': 'ffx2' };
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

for (const id of IDS) {
  describe(`the pro layer mounts for ${id}, in ${GAME[id].toUpperCase()}'s game`, () => {
    it("under all it gets the layer with its own game's skin; under `?treated=pack` (release 68) it gets none; the booth pair keep theirs either way", () => {
      setTreatedScope('all');
      expect(mount(id)).not.toBeNull();
      expect(mounted.at(-1)!.game).toBe(GAME[id]);
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
}

describe("Chapter XVII (Sin's Fins and Core) is not treated: no layer, no sound pass, not on the list", () => {
  it('the layer does not mount under all, and the sound pass stays off for its run', () => {
    setTreatedScope('all');
    expect(mount('sin-fins-core')).toBeNull();
    setAudioNew(true);
    const done = sfxChapter('sin-fins-core', () => undefined);
    expect(audioNewOn()).toBe(false);
    done();
  });
});

describe('the sound pass follows the chapter run', () => {
  for (const id of IDS) {
    it(`a ${id} run has the pass on in ${GAME[id].toUpperCase()} (the master makeup is asked for, and the victory cue is the pass's own), and the run's end gives it back`, () => {
      setTreatedScope('all');
      setAudioNew(true);
      const makeup = vi.spyOn(audio, 'setPassMakeup');
      const done = sfxChapter(id, () => undefined);
      expect(audioNewOn()).toBe(true);
      expect(passGame()).toBe(GAME[id]);
      expect(makeup.mock.calls.at(-1)![0]).toBeGreaterThan(0);
      if (GAME[id] === 'ffx') expect(passVictoryCue()).toBe(getChapter(id)!.music.victory); // FFX: the chapter's own `victory-ffx` starts at the last blow and the sting is dropped
      done();
      expect(audioNewOn()).toBe(false);
      expect(passGame()).toBeNull();
      expect(passVictoryCue()).toBeNull();
      expect(makeup.mock.calls.at(-1)![0]).toBe(0);
      makeup.mockRestore();
    });

    it(`under \`?treated=pack\` the pass stays off in ${id}, as in release 68`, () => {
      setAudioNew(true);
      setTreatedScope('pack');
      const done = sfxChapter(id, () => undefined);
      expect(audioNewOn()).toBe(false);
      done();
    });
  }

  it("the FFX chapters' victory cue is `victory-ffx`, the one fanfare the three share", () => {
    for (const id of ['evrae-airship', 'sin-face', 'mirror-aeons']) expect(getChapter(id)!.music.victory, id).toBe('victory-ffx');
  });
});

describe('`__pyrefly.treated()` knows them', () => {
  it("lists the four with their holds in the table's order, never Chapter XVII, and says whether the running chapter is reached", () => {
    const api: Record<string, unknown> = {};
    installProDebug(api);
    const treated = api['treated'] as (scope?: 'all' | 'pack' | null) => { scope: string; chapters: string[]; holds: Record<string, string[]>; running: string | null; reaches: boolean };
    const all = treated('all');
    for (const id of IDS) {
      expect(all.chapters, id).toContain(id);
      expect(all.holds[id], id).toEqual(Object.keys(PIECE_HOLDS[id]!));
      expect(TREATED_CHAPTERS[id]!.game, id).toBe(GAME[id]);
    }
    expect(all.chapters).not.toContain('sin-fins-core');
    expect(all.holds['sin-fins-core']).toBeUndefined();
    for (const id of IDS) {
      setDemoChapter(id);
      expect(treated().reaches, id).toBe(true);
      expect(treated('pack').reaches, id).toBe(false);
      treated('all');
    }
    setDemoChapter('sin-fins-core');
    expect(treated().reaches).toBe(false);
    treated(null);
  });
});
