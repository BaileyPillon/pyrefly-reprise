/**
 * BATCH 2 THROUGH EVERY SWITCH AND EVERY MOUNT (release 70, branch `booth-ffx2-b2`; FFX-2 only; the plumbing is `booth-leblanc`'s). The same questions `booth-leblanc-wiring.test.ts` and `booth-treated-switches.test.ts` ask of Leblanc, asked of
 * Chapter V (Vegnagun and Shuyin), Chapter XV (the Den of Woe) and Chapter XI (the Fallen Aeons): the pro layer mounts for them and for no other, the sound pass follows their run, every switch answers true but for the pieces `PIECE_HOLDS` names, and the
 * lane-off words, a phone and `?treated=pack` still give release 62's, or release 68's, frame in each. The holds: the staged breath in all three (no move of theirs is a `StagingPort.BigMove`, and the pick of a tone is a mockup decision) and the
 * follower camera in Chapter V alone (its approved colossus frame; `booth-ffx2-b2-rows.test.ts` pins the measure behind the reason).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mounted: Array<{ game: string }> = [];
vi.mock('../../src/ui/common/proStage/ProStageLayer.ts', () => ({
  ProStageLayer: class {
    constructor(o: { game: string }) {
      mounted.push(o);
    }
  },
}));

import { attachProStage } from '../../src/app/screens/battleProStage.ts';
import { sfxChapter } from '../../src/app/sfxGame.ts';
import { audio } from '../../src/audio/index.ts';
import { audioNewOn, passConfiguredBy, passGame, setAudioNew, setPassChapter } from '../../src/audio/pass/passSwitch.ts';
import { PIECE_HOLDS, setDemoChapter, setPackScreen, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { hudF1ModeFromSearch, hudF1On, setHudF1Mode } from '../../src/ui/hudf1/HudF1Switch.ts';
import { proLookOn, proModeFromSearch, setProMode, setProPiece } from '../../src/engine/look/pro/ProSwitch.ts';
import { partyRimFromSearch, partyRimOff, setPartyRim } from '../../src/engine/look/pro/PartyRimSwitch.ts';
import { bossCleanFromSearch, bossCleanOn, setBossClean } from '../../src/engine/look/pro/BossClean.ts';
import { curvesModeFromSearch, curvesOn, setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { momentsModeFromSearch, momentsOn, setMomentsMode } from '../../src/engine/motion/MomentsSwitch.ts';
import { smearOn, smearStyleFromSearch, setSmearStyle } from '../../src/engine/motion/SmearSwitch.ts';
import { proCamOn, proDofOn, resetProCamForTests, setProCam } from '../../src/engine/procam/ProCamSwitch.ts';
import { setStagingMode, stagingModeFromSearch, stagingOn, stagingPieceOn, stagingPieceOnFor } from '../../src/engine/pro/staging/StagingSwitch.ts';
import { fxModeFromSearch, fxNewOn, setFxMode } from '../../src/engine/spellfx/FxSwitch.ts';
import { inFeelChapter, punchMode, resetFeelForTests, setFeelChapter } from '../../src/engine/feel/FeelSwitch.ts';
import { DemoGovernor } from '../../src/engine/governor/DemoGovernor.ts';
import { chapterLook } from '../../src/engine/look/LookConfig.ts';

const B2 = ['ffx2-vegnagun-shuyin', 'ffx2-den-of-woe', 'ffx2-fallen-aeons'] as const;
/** Does the follower camera play in this chapter? Everywhere but Chapter V, which holds it. */
const camPlays = (id: string): boolean => id !== 'ffx2-vegnagun-shuyin';
const stage = { projectRect: () => null, project: () => null } as never;
const mount = (chapterId: string) => attachProStage({ root: {} as HTMLElement, chapterId, stage });

function allOn(): void {
  setHudF1Mode('f1');
  setProMode('pro');
  setPartyRim('off');
  setBossClean('clean');
  setCurvesMode('real-snappy');
  setMomentsMode('new');
  setSmearStyle('paint');
  setProCam(true);
  setStagingMode('pro');
  setFxMode('new');
  resetFeelForTests('?pack=demo');
  setAudioNew(true);
}

beforeEach(() => {
  mounted.length = 0;
});
afterEach(() => {
  setTreatedScope(null);
  setPackScreen(null);
  setDemoChapter(undefined);
  setHudF1Mode(null);
  setProMode(null);
  setProPiece(null);
  setPartyRim(null);
  setBossClean(null);
  setCurvesMode(null);
  setMomentsMode(null);
  setSmearStyle(null);
  resetProCamForTests();
  setStagingMode(null);
  setFxMode(null);
  resetFeelForTests();
  setAudioNew(null);
  setPassChapter(undefined);
  vi.unstubAllGlobals();
});

describe('the holds of batch 2', () => {
  it('Chapter V holds the follower camera and the staged breath; Chapters XV and XI hold the staged breath only; every other piece plays', () => {
    expect(Object.keys(PIECE_HOLDS['ffx2-vegnagun-shuyin']!).sort()).toEqual(['breath', 'cam']);
    expect(Object.keys(PIECE_HOLDS['ffx2-den-of-woe']!)).toEqual(['breath']);
    expect(Object.keys(PIECE_HOLDS['ffx2-fallen-aeons']!)).toEqual(['breath']);
    expect(treatedHold('ffx2-vegnagun-shuyin', 'cam')).toMatch(/colossus/);
    expect(treatedHold('ffx2-vegnagun-shuyin', 'cam')).toMatch(/D-228/);
    expect(treatedHold('ffx2-vegnagun-shuyin', 'breath')).toMatch(/Memento Mori/);
    expect(treatedHold('ffx2-den-of-woe', 'breath')).toMatch(/Lightfall/);
    expect(treatedHold('ffx2-fallen-aeons', 'breath')).toMatch(/Diamond Dust/);
    expect(treatedHold('ffx2-fallen-aeons', 'breath')).toMatch(/Delta Attack/);
    expect(treatedHold('ffx2-fallen-aeons', 'breath')).toMatch(/Oblivion/);
  });
});

describe('the pro layer mounts for them, in their own game, and under `?treated=pack` for none of them', () => {
  it('under all', () => {
    setTreatedScope('all');
    setStagingMode('pro');
    for (const id of B2) {
      expect(mount(id), id).not.toBeNull();
      expect(mounted.at(-1)!.game, id).toBe('ffx2');
    }
  });

  it('under pack (release 68) none of the three mounts it', () => {
    setTreatedScope('pack');
    setStagingMode('pro');
    for (const id of B2) expect(mount(id), id).toBeNull();
  });
});

describe('the sound pass follows their run, in FFX-2, and gives itself back', () => {
  it('a run of each has the pass on in its game (the master makeup is asked for) and the run\'s end gives it back; under pack it stays off', () => {
    for (const id of B2) {
      setTreatedScope('all');
      setAudioNew(true);
      const makeup = vi.spyOn(audio, 'setPassMakeup');
      const done = sfxChapter(id, () => undefined);
      expect(audioNewOn(), id).toBe(true);
      expect(passGame(), id).toBe('ffx2');
      expect(makeup.mock.calls.at(-1)![0], id).toBeGreaterThan(0);
      done();
      expect(audioNewOn(), id).toBe(false);
      expect(makeup.mock.calls.at(-1)![0], id).toBe(0);
      makeup.mockRestore();
      setTreatedScope('pack');
      const off = sfxChapter(id, () => undefined);
      expect(audioNewOn(), `pack ${id}`).toBe(false);
      off();
    }
  });
});

describe('every switch, in each of the three, under all', () => {
  it('answers true but for the held pieces: the follower in Chapter V (and its soft background with it), the staged breath in all three', () => {
    allOn();
    setTreatedScope('all');
    for (const id of B2) {
      setDemoChapter(id);
      setPassChapter(id);
      setFeelChapter(id);
      expect(hudF1On(), `hud ${id}`).toBe(true);
      expect(proLookOn(), `look ${id}`).toBe(true);
      expect(partyRimOff(), `rim ${id}`).toBe(true);
      expect(bossCleanOn(), `boss ${id}`).toBe(true);
      expect(curvesOn(), `curves ${id}`).toBe(true);
      expect(momentsOn(), `moments ${id}`).toBe(true);
      expect(smearOn(), `smear ${id}`).toBe(true);
      expect(proCamOn(), `camera ${id}`).toBe(camPlays(id));
      expect(proDofOn(), `camera dof ${id}`).toBe(camPlays(id));
      expect(stagingOn(), `staging ${id}`).toBe(true);
      for (const piece of ['card', 'ending', 'opening'] as const) {
        expect(stagingPieceOn(piece), `${piece} ${id}`).toBe(true);
        expect(stagingPieceOnFor(piece, id), `${piece} for ${id}`).toBe(true);
      }
      expect(stagingPieceOn('breath'), `breath ${id}`).toBe(false);
      expect(stagingPieceOnFor('breath', id), `breath for ${id}`).toBe(false);
      expect(fxNewOn(), `fx ${id}`).toBe(true);
      expect(inFeelChapter(), `feel ${id}`).toBe(true);
      expect(punchMode(), `feel punch ${id}`).toBe('new');
      expect(audioNewOn(), `audio ${id}`).toBe(true);
      expect(new DemoGovernor().gate(true), `governor ${id}`).toBe(true);
      expect(chapterLook(id), `hd2d ${id}`).toEqual({ name: 'hd2d', strength: 'bold' });
    }
  });

  it('under pack (release 68) every one of those answers today\'s in all three', () => {
    allOn();
    setTreatedScope('pack');
    for (const id of B2) {
      setDemoChapter(id);
      setPassChapter(id);
      setFeelChapter(id);
      expect([hudF1On(), proLookOn(), partyRimOff(), bossCleanOn(), curvesOn(), momentsOn(), smearOn(), proCamOn(), stagingOn(), fxNewOn(), audioNewOn(), inFeelChapter()], id).toEqual(new Array(12).fill(false));
      expect(chapterLook(id), id).toBeNull();
    }
  });
});

describe("the lane-off words, ?pack=off and a phone give release 62's frame in each (the same readers as the booth pair; no per-chapter word)", () => {
  function readFrom(search: string): void {
    setHudF1Mode(hudF1ModeFromSearch(search));
    setProMode(proModeFromSearch(search));
    setPartyRim(partyRimFromSearch(search));
    setBossClean(bossCleanFromSearch(search));
    setCurvesMode(curvesModeFromSearch(search));
    setMomentsMode(momentsModeFromSearch(search));
    setSmearStyle(smearStyleFromSearch(search));
    resetProCamForTests(search);
    setStagingMode(stagingModeFromSearch(search));
    setFxMode(fxModeFromSearch(search));
    resetFeelForTests(search);
    setAudioNew(passConfiguredBy(search));
  }
  const readAll = (id: string): boolean[] => {
    setDemoChapter(id);
    setPassChapter(id);
    setFeelChapter(id);
    return [hudF1On(), proLookOn(), partyRimOff(), bossCleanOn(), curvesOn(), momentsOn(), smearOn(), proCamOn(), stagingOn(), fxNewOn(), audioNewOn(), inFeelChapter() && punchMode() === 'new'];
  };
  /** The expected twelve in a chapter with the whole treatment on: the follower is the eighth, and Chapter V holds it. */
  const full = (id: string): boolean[] => new Array(12).fill(true).map((v, i) => (i === 7 ? camPlays(id) : v));

  it('on a desktop with no word the whole treatment plays in each (the held follower aside)', () => {
    setTreatedScope('all');
    setPackScreen('desk');
    readFrom('');
    for (const id of B2) expect(readAll(id), id).toEqual(full(id));
  });

  it('?pack=off puts every piece back; a phone or a tablet has no pack by default, and ?pack=demo forces it on', () => {
    setTreatedScope('all');
    setPackScreen('desk');
    readFrom('?pack=off');
    for (const id of B2) expect(readAll(id), id).toEqual(new Array(12).fill(false));
    setPackScreen('phone');
    readFrom('');
    for (const id of B2) expect(readAll(id), id).toEqual(new Array(12).fill(false));
    readFrom('?pack=demo');
    for (const id of B2) expect(readAll(id), id).toEqual(full(id));
  });

  it('?pro=off takes the three pro lanes (look, camera, staging) back and leaves the rest; ?treated=pack takes the chapter back whole', () => {
    setTreatedScope('all');
    setPackScreen('desk');
    readFrom('?pro=off');
    for (const id of B2) {
      const [hud, look, rim, boss, curves, moments, smear, cam, staging, fx, audio] = readAll(id);
      expect([look, cam, staging], id).toEqual([false, false, false]);
      expect([hud, rim, boss, curves, moments, smear, fx, audio], id).toEqual(new Array(8).fill(true));
    }
    readFrom('');
    setTreatedScope('pack');
    for (const id of B2) expect(readAll(id), id).toEqual(new Array(12).fill(false));
  });
});
