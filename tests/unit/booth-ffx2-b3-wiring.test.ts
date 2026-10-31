/**
 * CHAPTER XIII THROUGH EVERY SWITCH AND EVERY MOUNT (release 71, branch `booth-ffx2-b3`; FFX-2 only; the plumbing is `booth-leblanc`'s). The same questions `booth-ffx2-b2-wiring.test.ts`, `booth-leblanc-wiring.test.ts` and `booth-treated-switches.test.ts` ask of Leblanc
 * and of batch 2, asked of Chapter XIII (Trema, Cloister 100): the pro layer mounts for it and for no other, the sound pass follows its run, every switch answers true but for the pieces `PIECE_HOLDS` names, and the lane-off words, a phone and `?treated=pack` still give release 62's,
 * or release 68's, frame in it. The three holds: the directed camera (Paragon's approved giants frame stays: the follower would undo it, `booth-ffx2-b3-follower.test.ts` pins the numbers; its row and its stand-down on the link rig wait behind the hold, `booth-ffx2-b3-seam.test.ts`),
 * the staged breath (no move of Trema's or Paragon's is a `StagingPort.BigMove`, and the pick of a tone is a mockup decision) and the moments piece (the knock-out's cut: no reading of the three dresses yet, `booth-ffx2-b3-rows.test.ts` pins the numbers behind the reason).
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

const B3 = ['ffx2-trema'] as const;
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

describe('the holds of batch 3', () => {
  it('Chapter XIII holds the directed camera, the staged breath and the moments piece and nothing else: the card, the ending and the opening play', () => {
    expect(Object.keys(PIECE_HOLDS['ffx2-trema']!).sort()).toEqual(['breath', 'cam', 'moments']);
    expect(treatedHold('ffx2-trema', 'cam')).toMatch(/giants/);
    expect(treatedHold('ffx2-trema', 'breath')).toMatch(/Meteor/);
    expect(treatedHold('ffx2-trema', 'breath')).toMatch(/Final Impact/);
    expect(treatedHold('ffx2-trema', 'moments')).toMatch(/ProneLay/);
  });
});

describe('the pro layer mounts for it, in its own game, and under `?treated=pack` not at all', () => {
  it('under all', () => {
    setTreatedScope('all');
    setStagingMode('pro');
    for (const id of B3) {
      expect(mount(id), id).not.toBeNull();
      expect(mounted.at(-1)!.game, id).toBe('ffx2');
    }
  });

  it('under pack (release 68) it does not mount', () => {
    setTreatedScope('pack');
    setStagingMode('pro');
    for (const id of B3) expect(mount(id), id).toBeNull();
  });
});

describe('the sound pass follows its run, in FFX-2, and gives itself back', () => {
  it('a run has the pass on in its game (the master makeup is asked for) and the run\'s end gives it back; under pack it stays off', () => {
    for (const id of B3) {
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

describe('every switch, in Chapter XIII, under all', () => {
  it('answers true but for the held pieces: the follower camera and its soft background, the moments piece and the staged breath', () => {
    allOn();
    setTreatedScope('all');
    for (const id of B3) {
      setDemoChapter(id);
      setPassChapter(id);
      setFeelChapter(id);
      expect(hudF1On(), `hud ${id}`).toBe(true);
      expect(proLookOn(), `look ${id}`).toBe(true);
      expect(partyRimOff(), `rim ${id}`).toBe(true);
      expect(bossCleanOn(), `boss ${id}`).toBe(true);
      expect(curvesOn(), `curves ${id}`).toBe(true);
      expect(momentsOn(), `moments ${id}`).toBe(false); // held: the knock-out is today's plain cross
      expect(smearOn(), `smear ${id}`).toBe(true);
      expect(proCamOn(), `camera ${id}`).toBe(false); // held: Paragon's approved giants frame stays as it is (and the soft background that rides on the camera with it)
      expect(proDofOn(), `camera dof ${id}`).toBe(false);
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

  it('under pack (release 68) every one of those answers today\'s', () => {
    allOn();
    setTreatedScope('pack');
    for (const id of B3) {
      setDemoChapter(id);
      setPassChapter(id);
      setFeelChapter(id);
      expect([hudF1On(), proLookOn(), partyRimOff(), bossCleanOn(), curvesOn(), momentsOn(), smearOn(), proCamOn(), stagingOn(), fxNewOn(), audioNewOn(), inFeelChapter()], id).toEqual(new Array(12).fill(false));
      expect(chapterLook(id), id).toBeNull();
    }
  });
});

describe("the lane-off words, ?pack=off and a phone give release 62's frame in it (the same readers as the booth pair; no per-chapter word)", () => {
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
  /** The expected twelve in Chapter XIII with the treatment on: the moments piece is the sixth and the follower camera the eighth, and both are held. */
  const full = (_id: string): boolean[] => new Array(12).fill(true).map((v, i) => (i === 5 || i === 7 ? false : v));

  it('on a desktop with no word the whole treatment plays (the held camera and moments aside)', () => {
    setTreatedScope('all');
    setPackScreen('desk');
    readFrom('');
    for (const id of B3) expect(readAll(id), id).toEqual(full(id));
  });

  it('?pack=off puts every piece back; a phone or a tablet has no pack by default, and ?pack=demo forces it on', () => {
    setTreatedScope('all');
    setPackScreen('desk');
    readFrom('?pack=off');
    for (const id of B3) expect(readAll(id), id).toEqual(new Array(12).fill(false));
    setPackScreen('phone');
    readFrom('');
    for (const id of B3) expect(readAll(id), id).toEqual(new Array(12).fill(false));
    readFrom('?pack=demo');
    for (const id of B3) expect(readAll(id), id).toEqual(full(id));
  });

  it('?pro=off takes the three pro lanes (look, camera, staging) back and leaves the rest; ?treated=pack takes the chapter back whole', () => {
    setTreatedScope('all');
    setPackScreen('desk');
    readFrom('?pro=off');
    for (const id of B3) {
      const [hud, look, rim, boss, curves, moments, smear, cam, staging, fx, audio] = readAll(id);
      expect([look, cam, staging], id).toEqual([false, false, false]);
      expect([hud, rim, boss, curves, smear, fx, audio], id).toEqual(new Array(7).fill(true));
      expect(moments, id).toBe(false); // held whatever the address says
      expect(cam, id).toBe(false);
    }
    readFrom('');
    setTreatedScope('pack');
    for (const id of B3) expect(readAll(id), id).toEqual(new Array(12).fill(false));
  });
});
