/**
 * THE WIRING OF THE TREATED LIST, for Chapters III, XII and XIV (release 71, branch `booth-ffx-b3b`; FFX only). `booth-yunalesca-wiring` pins the four places that ask the list on a page for Chapter II; this pins the same four for the three of batch 3b: the pro layer's
 * mount (in FFX's game, `battleProStage.attachProStage`), the chapter run's sound pass (`sfxGame.sfxChapter` -> `passSwitch`: FFX's makeup, FFX's victory cue: each of the three plays the chapter's own `music.victory`, `victory-ffx`), the playtest board's gate, and the
 * debug word `__pyrefly.treated()`.
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
import { setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { setStagingMode } from '../../src/engine/pro/staging/StagingSwitch.ts';
import { describeIf, isListed, itIf } from './booth-r70-withdrawn.ts';

// Chapter XII (`seymour-omnis`) left the treated list in the r70 verdicts: its cases are skipped while it is off the list and run again with the line; `__pyrefly.treated()` neither lists it nor reports its holds meanwhile.
const IDS = ['braskas-final-aeon', 'seymour-omnis', 'isaaru-via-purifico'] as const;
/** The pieces each of the three holds, in the table's order: the breath, and from the first review the moments (III, XII) and the camera (XII, XIV), and from the review of booth-b3 (M1) the moments of XIV too. */
const HOLDS: Record<(typeof IDS)[number], string[]> = { 'braskas-final-aeon': ['breath', 'moments'], 'seymour-omnis': ['breath', 'cam', 'moments'], 'isaaru-via-purifico': ['breath', 'cam', 'moments'] };
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

for (const id of IDS) describeIf(id)(`the pro layer mounts for ${id}, in FFX's game`, () => {
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

describe('the sound pass follows the chapter run', () => {
  for (const id of IDS) itIf(id)(`a ${id} run has the pass on in FFX (the master makeup is asked for, and the chapter's own results cue is the one the pass starts at the last blow: the \`pose\` kind plays the sting's place), and the run's end gives it back`, () => {
    setTreatedScope('all');
    setAudioNew(true);
    const makeup = vi.spyOn(audio, 'setPassMakeup');
    const done = sfxChapter(id, () => undefined);
    expect(audioNewOn()).toBe(true);
    expect(passGame()).toBe('ffx');
    expect(makeup.mock.calls.at(-1)![0]).toBeGreaterThan(0);
    expect(passVictoryCue()).toBe(getChapter(id)!.music.victory);
    expect(passVictoryCue()).toBe('victory-ffx');
    done();
    expect(audioNewOn()).toBe(false);
    expect(passGame()).toBeNull();
    expect(passVictoryCue()).toBeNull();
    expect(makeup.mock.calls.at(-1)![0]).toBe(0);
    makeup.mockRestore();
  });

  for (const id of IDS) it(`under \`?treated=pack\` the pass stays off in ${id}, as in release 68`, () => {
    setAudioNew(true);
    setTreatedScope('pack');
    const done = sfxChapter(id, () => undefined);
    expect(audioNewOn()).toBe(false);
    done();
  });
});

describe('`__pyrefly.treated()` knows them', () => {
  it('lists the three, names each one\'s holds (the breath; with the review\'s pieces III, XII and XIV also the moments, XII and XIV the camera) and says whether the running chapter is reached', () => {
    const api: Record<string, unknown> = {};
    installProDebug(api);
    const treated = api['treated'] as (scope?: 'all' | 'pack' | null) => { scope: string; chapters: string[]; holds: Record<string, string[]>; running: string | null; reaches: boolean };
    const all = treated('all');
    for (const id of IDS) {
      expect(all.chapters.includes(id), id).toBe(isListed(id));
      expect(all.holds[id], id).toEqual(isListed(id) ? HOLDS[id] : undefined); // a withdrawn chapter's rows stay in the table, unread and unreported
    }
    for (const id of IDS) {
      setDemoChapter(id);
      expect(treated().reaches, id).toBe(isListed(id));
      expect(treated('pack').reaches, id).toBe(false);
      treated('all');
    }
    treated(null);
  });
});
