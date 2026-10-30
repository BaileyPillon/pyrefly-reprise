/**
 * EVERY SWITCH THE TREATMENT RUNS THROUGH, in Chapter II (release 69, branch `booth-ffx-yunalesca`; `yunalesca`, FFX only; Bailey 2026-10-30: the booth treatment for every listed chapter). `booth-treated-switches` pins the matrix for every listed and
 * hidden chapter under both scopes; this file pins what is particular to the first FFX chapter beyond Chapter I: FFX's own layout, profile and tables (hard rule 14), the three holds (the directed camera with its soft background, the staged breath, and the smear planner that her swap exception keeps off), and
 * the lane-off words, a phone and `?treated=pack` taking her back to release 68's frame exactly as they do for the booth pair and Leblanc.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDemoChapter, setPackScreen, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { hudF1Game, hudF1ModeFromSearch, hudF1On, setHudF1Mode } from '../../src/ui/hudf1/HudF1Switch.ts';
import { proArenaFor, proGame, proLookOn, proModeFromSearch, setProMode, setProPiece } from '../../src/engine/look/pro/ProSwitch.ts';
import { partyRimFromSearch, partyRimOff, setPartyRim } from '../../src/engine/look/pro/PartyRimSwitch.ts';
import { bossCleanFromSearch, bossCleanOn, setBossClean } from '../../src/engine/look/pro/BossClean.ts';
import { curvesGame, curvesModeFromSearch, curvesOn, realKind, setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { momentsModeFromSearch, momentsOn, setMomentsMode } from '../../src/engine/motion/MomentsSwitch.ts';
import { smearOn, smearStyleFromSearch, setSmearStyle } from '../../src/engine/motion/SmearSwitch.ts';
import { swapsInScope } from '../../src/engine/motion/SwapSwitch.ts';
import { proCamGame, proCamOn, proDofOn, resetProCamForTests, setProCam } from '../../src/engine/procam/ProCamSwitch.ts';
import { setStagingMode, stagingGame, stagingModeFromSearch, stagingOn, stagingPieceOn, stagingPieceOnFor, type StagingPiece } from '../../src/engine/pro/staging/StagingSwitch.ts';
import { fxGame, fxModeFromSearch, fxNewOn, setFxMode } from '../../src/engine/spellfx/FxSwitch.ts';
import { inFeelChapter, punchMode, resetFeelForTests, setFeelChapter } from '../../src/engine/feel/FeelSwitch.ts';
import { audioNewOn, passConfiguredBy, passGame, setAudioNew, setPassChapter } from '../../src/audio/pass/passSwitch.ts';
import { DemoGovernor } from '../../src/engine/governor/DemoGovernor.ts';
import { chapterLook } from '../../src/engine/look/LookConfig.ts';

const ID = 'yunalesca';

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
});

describe('Chapter II under the scope all: FFX\'s own game everywhere, every piece but the three it holds', () => {
  it('the HUD, the look, the arena, the rim, the curves with the real clips, the moments, the staging, the effects, the feel, the sound and the governor all play, in FFX; the smear does not', () => {
    allOn();
    setTreatedScope('all');
    setDemoChapter(ID);
    setPassChapter(ID);
    setFeelChapter(ID);
    expect(hudF1On()).toBe(true);
    expect(hudF1Game()).toBe('ffx'); // the FFX layout (command block left, the three-slot turn strip, the Overdrive bars), never FFX-2's right-hand slab
    expect(proLookOn()).toBe(true);
    expect(proGame()).toBe('ffx');
    expect(proArenaFor(ID, '')).toBe(true);
    expect(partyRimOff()).toBe(true);
    expect(bossCleanOn()).toBe(true); // the rim half only (no `BOSS_CLEAN_ARTS` row for her art ids): the foe is flagged by combatant id in `RimFigures.TREATED_RIM_FOES`
    expect(curvesOn()).toBe(true);
    expect(curvesGame()).toBe('ffx');
    expect(realKind()).toBe('snappy');
    expect(momentsOn()).toBe(true);
    expect(smearOn()).toBe(false); // her swap exception (`SwapSwitch.SCOPE_EXCEPTIONS`) keeps release 67's swap look: the smear planner would cut the swaps it holds back
    expect(swapsInScope()).toBe(false);
    expect(stagingOn()).toBe(true);
    expect(stagingGame()).toBe('ffx');
    for (const piece of ['card', 'ending', 'opening'] as StagingPiece[]) {
      expect(stagingPieceOn(piece), piece).toBe(true);
      expect(stagingPieceOnFor(piece, ID), piece).toBe(true);
    }
    expect(fxNewOn()).toBe(true);
    expect(fxGame()).toBe('ffx');
    expect(inFeelChapter()).toBe(true);
    expect(punchMode()).toBe('new');
    expect(audioNewOn()).toBe(true);
    expect(passGame()).toBe('ffx');
    expect(new DemoGovernor().gate(true)).toBe(true);
    expect(chapterLook(ID)).toEqual({ name: 'hd2d', strength: 'bold' });
  });

  it("holds the directed camera and its soft background (PR-0307: today's rig plays), the staged breath (nothing of hers is a BigMove) and the smear (her swap exception): the layer is still there for the card, the Overdrive opening and the ending", () => {
    allOn();
    setTreatedScope('all');
    setDemoChapter(ID);
    expect(proCamOn()).toBe(false);
    expect(proDofOn()).toBe(false);
    expect(proCamGame()).toBeNull();
    expect(smearOn()).toBe(false);
    expect(stagingPieceOn('breath')).toBe(false);
    expect(stagingPieceOnFor('breath', ID)).toBe(false);
    expect(stagingOn()).toBe(true);
    // and the booth pair next to her still plays both (the approved target is never held)
    for (const booth of ['seymour-flux', 'ffx2-bahamut']) {
      setDemoChapter(booth);
      expect(proCamOn(), booth).toBe(true);
      expect(stagingPieceOn('breath'), booth).toBe(true);
    }
  });

  it('under `?treated=pack` (release 68) every one of them answers today\'s in her chapter', () => {
    allOn();
    setTreatedScope('pack');
    setDemoChapter(ID);
    setPassChapter(ID);
    setFeelChapter(ID);
    expect([hudF1On(), proLookOn(), partyRimOff(), bossCleanOn(), curvesOn(), momentsOn(), smearOn(), proCamOn(), stagingOn(), fxNewOn(), audioNewOn(), inFeelChapter()]).toEqual(new Array(12).fill(false));
    expect(chapterLook(ID)).toBeNull();
    expect(new DemoGovernor().gate(true)).toBe(false);
  });
});

describe("the lane-off words, ?pack=off and a phone still give release 62's frame in Chapter II (the same readers as the booth pair; no per-chapter word)", () => {
  /** Force every switch the way the page would read it from this address (the screen class is the page's, set by the caller). */
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
  /** [hud, look, rim, boss, curves, moments, smear, camera, staging, fx, audio, feel]: the smear (index 6) and the camera (index 7) are the held pieces. */
  const readAll = (id: string): boolean[] => {
    setDemoChapter(id);
    setPassChapter(id);
    setFeelChapter(id);
    return [hudF1On(), proLookOn(), partyRimOff(), bossCleanOn(), curvesOn(), momentsOn(), smearOn(), proCamOn(), stagingOn(), fxNewOn(), audioNewOn(), inFeelChapter() && punchMode() === 'new'];
  };
  const PLAYS = [true, true, true, true, true, true, false, false, true, true, true, true];

  it('on a desktop with no word the whole treatment plays but the smear and the camera, which her chapter holds; the booth pair plays all of it', () => {
    setTreatedScope('all');
    setPackScreen('desk');
    readFrom('');
    expect(readAll(ID)).toEqual(PLAYS);
    expect(readAll('seymour-flux')).toEqual(new Array(12).fill(true));
  });

  it('?pack=off puts every piece back', () => {
    setTreatedScope('all');
    setPackScreen('desk');
    readFrom('?pack=off');
    expect(readAll(ID)).toEqual(new Array(12).fill(false));
  });

  it("a phone or a tablet has no pack by default, so Chapter II plays release 62's frame there; ?pack=demo (the booth address) forces it on", () => {
    setTreatedScope('all');
    setPackScreen('phone');
    readFrom('');
    expect(readAll(ID)).toEqual(new Array(12).fill(false));
    readFrom('?pack=demo');
    expect(readAll(ID)).toEqual(PLAYS);
  });

  it('?pro=off takes the three pro lanes back and leaves the HUD, the motion, the effects and the sound as they were; ?treated=pack takes the chapter back whole', () => {
    setTreatedScope('all');
    setPackScreen('desk');
    readFrom('?pro=off');
    const [hud, look, rim, boss, curves, moments, smear, cam, staging, fx, audio] = readAll(ID);
    expect([look, cam, staging]).toEqual([false, false, false]);
    expect([hud, rim, boss, curves, moments, fx, audio]).toEqual(new Array(7).fill(true));
    expect(smear).toBe(false);
    readFrom('');
    setTreatedScope('pack');
    expect(readAll(ID)).toEqual(new Array(12).fill(false));
  });
});
