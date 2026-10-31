/**
 * THE WIRING OF THE TREATED LIST (release 69, branch `booth-leblanc`; Chapter VI, `ffx2-leblanc`, FFX-2 only; the plumbing is both games). The review of `2b314637b` (m4a) found that nothing reached the four places that
 * ask the list on a page: the pro layer's mount (`battleProStage.attachProStage`), the playtest switchboard's gate, the chapter run's sound pass (`sfxGame.sfxChapter` -> `passSwitch`) and the debug word
 * `__pyrefly.treated()`. Reverting `attachProStage` to the booth pair's test would have left every other test green while Leblanc lost its title card, its ending and its opening.
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

describe('the pro layer mounts for every treated chapter and no other', () => {
  it('Leblanc gets the layer, in her own game; the booth pair keep theirs; the hidden experiment and the untreated get none', () => {
    setTreatedScope('all');
    expect(mount('ffx2-leblanc')).not.toBeNull();
    expect(mounted.at(-1)!.game).toBe('ffx2');
    expect(mount('ffx2-bahamut')).not.toBeNull();
    expect(mounted.at(-1)!.game).toBe('ffx2');
    expect(mount('seymour-flux')).not.toBeNull();
    expect(mounted.at(-1)!.game).toBe('ffx');
    const built = mounted.length;
    expect(mount('exp-leblanc')).toBeNull(); // hidden: never listed
    expect(mount('ffx-gagazet-undefined')).toBeNull();
    expect(mounted.length).toBe(built);
  });

  it('`?treated=pack` (release 68\'s reach) takes Leblanc\'s layer back and leaves the booth pair\'s', () => {
    setTreatedScope('pack');
    expect(mount('ffx2-leblanc')).toBeNull();
    expect(mount('ffx2-bahamut')).not.toBeNull();
    expect(mount('seymour-flux')).not.toBeNull();
  });

  it('with the staging at today\'s nothing mounts (a public address), unless the playtest board asks for the layer', () => {
    setTreatedScope('all');
    setStagingMode('today');
    expect(mount('ffx2-leblanc')).toBeNull();
    vi.stubGlobal('location', { search: '?pack=demo&switchboard=1' });
    expect(mount('ffx2-leblanc')).not.toBeNull(); // the board can flip the staging on, so the layer is there with its cues still no-ops
  });
});

describe('the sound pass follows the chapter run', () => {
  it('a Leblanc run has the pass on in her game (the master makeup is asked for), and the run\'s end gives it back', () => {
    setTreatedScope('all');
    setAudioNew(true);
    const makeup = vi.spyOn(audio, 'setPassMakeup');
    const done = sfxChapter('ffx2-leblanc', () => undefined);
    expect(audioNewOn()).toBe(true);
    expect(passGame()).toBe('ffx2');
    expect(makeup.mock.calls.at(-1)![0]).toBeGreaterThan(0);
    done();
    expect(audioNewOn()).toBe(false);
    expect(passGame()).toBeNull();
    expect(makeup.mock.calls.at(-1)![0]).toBe(0);
    makeup.mockRestore();
  });

  it('under `?treated=pack` and in the hidden experiment the pass stays off', () => {
    setAudioNew(true);
    for (const [scope, id] of [['pack', 'ffx2-leblanc'], ['all', 'exp-leblanc']] as const) {
      setTreatedScope(scope);
      const done = sfxChapter(id, () => undefined);
      expect(audioNewOn(), `${scope} ${id}`).toBe(false);
      done();
    }
    setTreatedScope('pack');
    const done = sfxChapter('ffx2-bahamut', () => undefined);
    expect(audioNewOn()).toBe(true); // the booth pair, whatever the scope
    done();
  });
});

describe('`__pyrefly.treated()`', () => {
  it('reads the scope, the list, the holds and whether the running chapter is reached; sets the scope; null reads the address again', () => {
    const api: Record<string, unknown> = {};
    installProDebug(api);
    const treated = api['treated'] as (scope?: 'all' | 'pack' | null) => { scope: string; chapters: string[]; holds: Record<string, string[]>; running: string | null; reaches: boolean };
    const all = treated('all');
    expect(all.scope).toBe('all');
    expect(all.chapters).toEqual(['seymour-flux', 'yunalesca', 'braskas-final-aeon', 'seymour-omnis', 'isaaru-via-purifico', 'ffx2-bahamut', 'ffx2-leblanc', 'ffx2-vegnagun-shuyin', 'ffx2-den-of-woe', 'ffx2-fallen-aeons']);
    expect(all.holds).toEqual({
      yunalesca: ['breath', 'cam', 'smear'],
      'braskas-final-aeon': ['breath'],
      'seymour-omnis': ['breath'],
      'isaaru-via-purifico': ['breath'],
      'ffx2-leblanc': ['breath'],
      'ffx2-vegnagun-shuyin': ['cam', 'breath'],
      'ffx2-den-of-woe': ['breath'],
      'ffx2-fallen-aeons': ['breath'],
    });
    expect(all.running).toBeNull();
    expect(all.reaches).toBe(false);
    setDemoChapter('ffx2-leblanc');
    expect(treated().reaches).toBe(true);
    expect(treated('pack').scope).toBe('pack');
    expect(treated().reaches).toBe(false); // the running Leblanc is no longer reached
    expect(treated(null).scope).toBe('pack'); // no page in a unit test: the address reads `pack`
  });
});
