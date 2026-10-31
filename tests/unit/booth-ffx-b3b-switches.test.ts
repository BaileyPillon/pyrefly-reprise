/**
 * EVERY SWITCH THE TREATMENT RUNS THROUGH, in Chapters III, XII and XIV (release 71, branch `booth-ffx-b3b`; FFX only; Bailey 2026-10-30: the booth treatment for every listed chapter). `booth-treated-switches` pins the matrix over every listed and hidden
 * chapter under both scopes and `booth-b2-off-words` the lane-off words for every joined chapter; this file pins what is particular to these three: FFX's own layout, profile and tables (hard rule 14), the single hold (the staged breath), and that the directed
 * camera and the smear, which Chapter II holds, PLAY here (none is a swap-scope exception; the camera's offline read is no worse than the approved Chapter I's, `docs/handoff/booth-ffx-b3b.md` section 4).
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
import { setSwapScope, swapsInScope } from '../../src/engine/motion/SwapSwitch.ts';
import { proCamGame, proCamOn, proDofOn, resetProCamForTests, setProCam } from '../../src/engine/procam/ProCamSwitch.ts';
import { setStagingMode, stagingGame, stagingModeFromSearch, stagingOn, stagingPieceOn, stagingPieceOnFor, type StagingPiece } from '../../src/engine/pro/staging/StagingSwitch.ts';
import { fxGame, fxModeFromSearch, fxNewOn, setFxMode } from '../../src/engine/spellfx/FxSwitch.ts';
import { inFeelChapter, punchMode, resetFeelForTests, setFeelChapter } from '../../src/engine/feel/FeelSwitch.ts';
import { audioNewOn, passConfiguredBy, passGame, setAudioNew, setPassChapter } from '../../src/audio/pass/passSwitch.ts';
import { DemoGovernor } from '../../src/engine/governor/DemoGovernor.ts';
import { chapterLook } from '../../src/engine/look/LookConfig.ts';

const IDS = ['braskas-final-aeon', 'seymour-omnis', 'isaaru-via-purifico'] as const;

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
  setSwapScope(null);
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

describe.each(IDS)('%s under the scope all: FFX\'s own game everywhere, every piece but the staged breath', (ID) => {
  it('the HUD, the look, the arena, the rim, the curves with the real clips, the moments, the smear, the directed camera and its soft background, the staging, the effects, the feel, the sound and the governor all play, in FFX', () => {
    allOn();
    setTreatedScope('all');
    setSwapScope('wide'); // the page's default: under node there is no page and the scope would read `pack`
    setDemoChapter(ID);
    setPassChapter(ID);
    setFeelChapter(ID);
    expect(hudF1On()).toBe(true);
    expect(hudF1Game()).toBe('ffx'); // the FFX layout (command block left, the three-slot turn strip, the Overdrive bars), never FFX-2's right-hand slab
    expect(proLookOn()).toBe(true);
    expect(proGame()).toBe('ffx');
    expect(proArenaFor(ID, '')).toBe(true);
    expect(partyRimOff()).toBe(true);
    expect(bossCleanOn()).toBe(true); // the rim half only (no `BOSS_CLEAN_ARTS` row): the foes are flagged by combatant id in `RimFigures.TREATED_RIM_FOES`
    expect(curvesOn()).toBe(true);
    expect(curvesGame()).toBe('ffx');
    expect(realKind()).toBe('snappy');
    expect(momentsOn()).toBe(true);
    expect(swapsInScope()).toBe(true); // not a swap-scope exception: no `smear` hold is owed
    expect(smearOn()).toBe(true);
    expect(proCamOn()).toBe(true);
    expect(proDofOn()).toBe(true);
    expect(proCamGame()).toBe('ffx'); // the real FFX shots, never FFX-2's follower
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

  it('holds the staged breath and nothing else (nothing of the chapter is a BigMove; the layer is still there for the card, the Overdrive opening and the ending), with the booth pair next to it still playing it', () => {
    allOn();
    setTreatedScope('all');
    setDemoChapter(ID);
    expect(stagingPieceOn('breath')).toBe(false);
    expect(stagingPieceOnFor('breath', ID)).toBe(false);
    expect(stagingOn()).toBe(true);
    for (const booth of ['seymour-flux', 'ffx2-bahamut']) {
      setDemoChapter(booth);
      expect(proCamOn(), booth).toBe(true);
      expect(stagingPieceOn('breath'), booth).toBe(true);
    }
  });

  it("under `?treated=pack` (release 68) every one of them answers today's in the chapter", () => {
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

describe("the lane-off words, ?pack=off and a phone still give release 62's frame in the three chapters (the same readers as the booth pair; no per-chapter word)", () => {
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
  /** [hud, look, rim, boss, curves, moments, smear, camera, staging, fx, audio, feel]. */
  const readAll = (id: string): boolean[] => {
    setDemoChapter(id);
    setPassChapter(id);
    setFeelChapter(id);
    return [hudF1On(), proLookOn(), partyRimOff(), bossCleanOn(), curvesOn(), momentsOn(), smearOn(), proCamOn(), stagingOn(), fxNewOn(), audioNewOn(), inFeelChapter() && punchMode() === 'new'];
  };
  const ON = new Array(12).fill(true);
  const OFF = new Array(12).fill(false);

  it.each(IDS)('%s: on a desktop with no word the whole treatment plays (the breath is the one held piece and rides on the staging layer, which is on)', (id) => {
    setTreatedScope('all');
    setSwapScope('wide');
    setPackScreen('desk');
    readFrom('');
    expect(readAll(id)).toEqual(ON);
  });

  it.each(IDS)('%s: ?pack=off puts every piece back; a phone or a tablet has no pack by default; ?pack=demo (the booth address) forces it on', (id) => {
    setTreatedScope('all');
    setSwapScope('wide');
    setPackScreen('desk');
    readFrom('?pack=off');
    expect(readAll(id)).toEqual(OFF);
    setPackScreen('phone');
    readFrom('');
    expect(readAll(id)).toEqual(OFF);
    readFrom('?pack=demo');
    expect(readAll(id)).toEqual(ON);
  });

  it.each(IDS)('%s: ?pro=off takes the three pro lanes back and leaves the HUD, the motion, the effects and the sound as they were; ?treated=pack takes the chapter back whole', (id) => {
    setTreatedScope('all');
    setSwapScope('wide');
    setPackScreen('desk');
    readFrom('?pro=off');
    const [hud, look, rim, boss, curves, moments, smear, cam, staging, fx, audio] = readAll(id);
    expect([look, cam, staging]).toEqual([false, false, false]);
    expect([hud, rim, boss, curves, moments, smear, fx, audio]).toEqual(new Array(8).fill(true));
    readFrom('');
    setTreatedScope('pack');
    expect(readAll(id)).toEqual(OFF);
  });
});
