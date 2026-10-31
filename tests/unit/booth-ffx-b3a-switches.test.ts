/**
 * EVERY SWITCH THE TREATMENT RUNS THROUGH, in the three chapters of batch 3a (release 71, branch `booth-ffx-b3a`; Chapter VII `seymour-anima-macalania`, Chapter X `seymour-natus`, Chapter IX `yojimbo-cavern`; FFX only; Bailey 2026-10-30: the booth treatment for every listed chapter).
 * `booth-treated-switches` pins the matrix for every listed and hidden chapter under both scopes and `booth-b2-off-words` the off words for every joined chapter from the source; this file pins what is particular to these three: FFX's own layout, profile and tables
 * (hard rule 14), the smear that PLAYS (none is a swap exception, unlike Chapter II), the camera that plays in one and is held in two, the moments and the staged breath held in all, and the lane-off words, a phone and `?treated=pack` taking each back to release 68's frame.
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
import { proCamGame, proCamOn, proDofOn, resetProCamForTests, setProCam } from '../../src/engine/procam/ProCamSwitch.ts';
import { setStagingMode, stagingGame, stagingModeFromSearch, stagingOn, stagingPieceOn, stagingPieceOnFor, type StagingPiece } from '../../src/engine/pro/staging/StagingSwitch.ts';
import { fxGame, fxModeFromSearch, fxNewOn, setFxMode } from '../../src/engine/spellfx/FxSwitch.ts';
import { inFeelChapter, punchMode, resetFeelForTests, setFeelChapter } from '../../src/engine/feel/FeelSwitch.ts';
import { audioNewOn, passConfiguredBy, passGame, setAudioNew, setPassChapter } from '../../src/audio/pass/passSwitch.ts';
import { DemoGovernor } from '../../src/engine/governor/DemoGovernor.ts';
import { chapterLook } from '../../src/engine/look/LookConfig.ts';

/** The chapters and what each holds: [camera plays, moments play]. The staged breath is held in all three. */
const CHAPTERS: ReadonlyArray<{ id: string; cam: boolean; moments: boolean }> = [
  { id: 'seymour-anima-macalania', cam: false, moments: false },
  { id: 'seymour-natus', cam: true, moments: false },
  { id: 'yojimbo-cavern', cam: false, moments: false },
];

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

describe.each(CHAPTERS)('$id under the scope all: FFX\'s own game everywhere, every piece but the ones it holds', ({ id, cam, moments }) => {
  it('the HUD, the look, the arena, the rim, the curves with the real clips, the smear, the staging, the effects, the feel, the sound and the governor all play, in FFX', () => {
    allOn();
    setTreatedScope('all');
    setDemoChapter(id);
    setPassChapter(id);
    setFeelChapter(id);
    expect(hudF1On()).toBe(true);
    expect(hudF1Game()).toBe('ffx'); // the FFX layout (command block left, the three-slot turn strip, the Overdrive bars), never FFX-2's right-hand slab
    expect(proLookOn()).toBe(true);
    expect(proGame()).toBe('ffx');
    expect(proArenaFor(id, '')).toBe(true);
    expect(partyRimOff()).toBe(true);
    expect(bossCleanOn()).toBe(true); // the rim half only (no `BOSS_CLEAN_ARTS` row for any of their art ids): the foes are flagged by combatant id in `RimFigures.TREATED_RIM_FOES`
    expect(curvesOn()).toBe(true);
    expect(curvesGame()).toBe('ffx');
    expect(realKind()).toBe('snappy');
    expect(smearOn()).toBe(true); // none of the three is a swap exception: the planned smear and the stance and cause picks play, as in the booth pair
    expect(stagingOn()).toBe(true);
    expect(stagingGame()).toBe('ffx');
    for (const piece of ['card', 'ending', 'opening'] as StagingPiece[]) {
      expect(stagingPieceOn(piece), piece).toBe(true);
      expect(stagingPieceOnFor(piece, id), piece).toBe(true);
    }
    expect(fxNewOn()).toBe(true);
    expect(fxGame()).toBe('ffx');
    expect(inFeelChapter()).toBe(true);
    expect(punchMode()).toBe('new');
    expect(audioNewOn()).toBe(true);
    expect(passGame()).toBe('ffx');
    expect(new DemoGovernor().gate(true)).toBe(true);
    expect(chapterLook(id)).toEqual({ name: 'hd2d', strength: 'bold' });
    // the two pieces that differ by chapter: the directed camera (and the soft background that rides on it) and the moments
    expect(proCamOn()).toBe(cam);
    expect(proDofOn()).toBe(cam);
    expect(proCamGame()).toBe(cam ? 'ffx' : null);
    expect(momentsOn()).toBe(moments);
  });

  it("holds the staged breath (nothing of these fights is a BigMove: the candidate moves are named in the hold); the layer is still there for the card, the Overdrive opening and the ending; the booth pair next to it still plays the breath and the camera", () => {
    allOn();
    setTreatedScope('all');
    setDemoChapter(id);
    expect(stagingPieceOn('breath')).toBe(false);
    expect(stagingPieceOnFor('breath', id)).toBe(false);
    expect(stagingOn()).toBe(true);
    for (const booth of ['seymour-flux', 'ffx2-bahamut']) {
      setDemoChapter(booth);
      expect(proCamOn(), booth).toBe(true);
      expect(momentsOn(), booth).toBe(true);
      expect(stagingPieceOn('breath'), booth).toBe(true);
    }
  });

  it('under `?treated=pack` (release 68) every one of them answers today\'s in this chapter', () => {
    allOn();
    setTreatedScope('pack');
    setDemoChapter(id);
    setPassChapter(id);
    setFeelChapter(id);
    expect([hudF1On(), proLookOn(), partyRimOff(), bossCleanOn(), curvesOn(), momentsOn(), smearOn(), proCamOn(), stagingOn(), fxNewOn(), audioNewOn(), inFeelChapter()]).toEqual(new Array(12).fill(false));
    expect(chapterLook(id)).toBeNull();
    expect(new DemoGovernor().gate(true)).toBe(false);
  });
});

describe.each(CHAPTERS)("$id: the lane-off words, ?pack=off and a phone still give release 62's frame (the same readers as the booth pair; no per-chapter word)", ({ id, cam, moments }) => {
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
  const readAll = (chapter: string): boolean[] => {
    setDemoChapter(chapter);
    setPassChapter(chapter);
    setFeelChapter(chapter);
    return [hudF1On(), proLookOn(), partyRimOff(), bossCleanOn(), curvesOn(), momentsOn(), smearOn(), proCamOn(), stagingOn(), fxNewOn(), audioNewOn(), inFeelChapter() && punchMode() === 'new'];
  };
  const PLAYS = [true, true, true, true, true, moments, true, cam, true, true, true, true];

  it('on a desktop with no word the whole treatment plays but the pieces the chapter holds; the booth pair plays all of it', () => {
    setTreatedScope('all');
    setPackScreen('desk');
    readFrom('');
    expect(readAll(id)).toEqual(PLAYS);
    expect(readAll('seymour-flux')).toEqual(new Array(12).fill(true));
  });

  it('?pack=off puts every piece back', () => {
    setTreatedScope('all');
    setPackScreen('desk');
    readFrom('?pack=off');
    expect(readAll(id)).toEqual(new Array(12).fill(false));
  });

  it("a phone or a tablet has no pack by default, so the chapter plays release 62's frame there; ?pack=demo (the booth address) forces it on", () => {
    setTreatedScope('all');
    setPackScreen('phone');
    readFrom('');
    expect(readAll(id)).toEqual(new Array(12).fill(false));
    readFrom('?pack=demo');
    expect(readAll(id)).toEqual(PLAYS);
  });

  it('?pro=off takes the three pro lanes back and leaves the HUD, the motion, the effects and the sound as they were; ?treated=pack takes the chapter back whole', () => {
    setTreatedScope('all');
    setPackScreen('desk');
    readFrom('?pro=off');
    const [hud, look, rim, boss, curves, mom, smear, camera, staging, fx, audio] = readAll(id);
    expect([look, camera, staging]).toEqual([false, false, false]);
    expect([hud, rim, boss, curves, smear, fx, audio]).toEqual(new Array(7).fill(true));
    expect(mom).toBe(moments);
    readFrom('');
    setTreatedScope('pack');
    expect(readAll(id)).toEqual(new Array(12).fill(false));
  });
});
