/**
 * EVERY SWITCH THE TREATMENT RUNS THROUGH, chapter by chapter, under both scopes (release 69, branch `booth-leblanc`; Bailey 2026-10-30: the booth treatment for every listed chapter, Leblanc first; both games for the
 * plumbing, Leblanc FFX-2 only). Each switch is forced ON the way its own tests force it, then the running chapter is named and the answer read:
 *
 *  - under `pack` (release 68's reach, `?treated=pack`, and a unit test with no page) a switch answers true in the booth pair and false in EVERY other chapter, Leblanc included: byte for byte what release 68 played;
 *  - under `all` it answers true in the booth pair (no piece of the approved target is ever held) and in Leblanc, and false in every other listed and hidden chapter; the pieces Leblanc holds are the staged breath, the
 *    directed camera and the moments (`DemoGate.PIECE_HOLDS`, each with its written reason), which answer false for her and true in the booth pair.
 *
 * The browser has not been run for this (it is busy); the unit answers are the evidence that the gates moved and nothing else did.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { Object3D } from 'three';
import { CHAPTER_IDS } from '../../src/data/encounters.ts';
import { setDemoChapter, setPackScreen, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { hudF1Game, hudF1ModeFromSearch, hudF1On, setHudF1Mode } from '../../src/ui/hudf1/HudF1Switch.ts';
import { proArenaFor, proGame, proLookOn, proModeFromSearch, proPieceOn, setProMode, setProPiece } from '../../src/engine/look/pro/ProSwitch.ts';
import { partyRimFromSearch, partyRimOff, setPartyRim } from '../../src/engine/look/pro/PartyRimSwitch.ts';
import { bossCleanCard, bossCleanFromSearch, bossCleanOn, setBossClean } from '../../src/engine/look/pro/BossClean.ts';
import { rimSkipOf, tagRimFigure } from '../../src/engine/look/pro/RimFigures.ts';
import { curvesGame, curvesModeFromSearch, curvesOn, inDemoChapter, realKind, setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { momentsModeFromSearch, momentsOn, setMomentsMode } from '../../src/engine/motion/MomentsSwitch.ts';
import { smearOn, smearStyleFromSearch, smearStyleNow, setSmearStyle } from '../../src/engine/motion/SmearSwitch.ts';
import { newMotionOn } from '../../src/engine/motion/NewMotionGate.ts';
import { proCamGame, proCamOn, proDofOn, resetProCamForTests, setProCam } from '../../src/engine/procam/ProCamSwitch.ts';
import { setStagingMode, stagingGame, stagingModeFromSearch, stagingOn, stagingPieceOn, stagingPieceOnFor, type StagingPiece } from '../../src/engine/pro/staging/StagingSwitch.ts';
import { fxGame, fxModeFromSearch, fxNewOn, inFxDemoChapter, setFxMode } from '../../src/engine/spellfx/FxSwitch.ts';
import { inFeelChapter, motionSfxOn, punchMode, resetFeelForTests, rumbleOn, setFeelChapter, shadowFollows, stopMode } from '../../src/engine/feel/FeelSwitch.ts';
import { audioNewOn, passConfiguredBy, passGame, setAudioNew, setPassChapter } from '../../src/audio/pass/passSwitch.ts';
import { DemoGovernor } from '../../src/engine/governor/DemoGovernor.ts';
import { chapterLook } from '../../src/engine/look/LookConfig.ts';

const LISTED: readonly string[] = CHAPTER_IDS;
const HIDDEN = ['exp-leblanc', 'ff7-guard-scorpion', 'ffx2-masterpiece-theatre', 'sinspawn-gui', 'exp-fayth'];
const ALL = [...LISTED, ...HIDDEN];
const BOOTH = ['seymour-flux', 'ffx2-bahamut'];
const GAME: Record<string, 'ffx' | 'ffx2'> = { 'seymour-flux': 'ffx', 'ffx2-bahamut': 'ffx2', 'ffx2-leblanc': 'ffx2' };

/** The chapters each scope reaches. */
const reached = (scope: 'pack' | 'all'): readonly string[] => (scope === 'pack' ? BOOTH : [...BOOTH, 'ffx2-leblanc']);

/** The order `readAll` answers in, and the pieces of it Leblanc holds (`DemoGate.PIECE_HOLDS`); every other piece plays for her. */
const READ_ORDER = ['hud', 'look', 'rim', 'boss', 'curves', 'moments', 'smear', 'cam', 'staging', 'fx', 'audio', 'feel'] as const;
const LEBLANC_HELD_READS: readonly string[] = ['cam', 'moments'];
/** What a desktop with no word reads in this chapter: all twelve for the booth pair, all but her held pieces for Leblanc. */
const wholeTreatment = (id: string): boolean[] => READ_ORDER.map((p) => !(id === 'ffx2-leblanc' && LEBLANC_HELD_READS.includes(p)));

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

describe.each(['pack', 'all'] as const)('with the scope %s', (scope) => {
  it('every switch answers for the chapters the scope reaches and for no other, listed or hidden', () => {
    allOn();
    setTreatedScope(scope);
    const yes = reached(scope);
    for (const id of ALL) {
      const on = yes.includes(id);
      setDemoChapter(id);
      setPassChapter(id);
      expect(hudF1On(), `hud ${id}`).toBe(on);
      expect(hudF1Game(), `hud game ${id}`).toBe(on ? GAME[id] : undefined);
      expect(proLookOn(), `look ${id}`).toBe(on);
      expect(proPieceOn('hits'), `look hits ${id}`).toBe(on);
      expect(proGame(), `look game ${id}`).toBe(on ? GAME[id] : undefined);
      expect(proArenaFor(id, ''), `arena ${id}`).toBe(on);
      expect(partyRimOff(), `rim ${id}`).toBe(on);
      expect(bossCleanOn(), `boss ${id}`).toBe(on);
      expect(curvesOn(), `curves ${id}`).toBe(on);
      expect(realKind(), `real ${id}`).toBe(on ? 'snappy' : null);
      expect(inDemoChapter(id), `curves gate ${id}`).toBe(on);
      expect(momentsOn(), `moments ${id}`).toBe(on && id !== 'ffx2-leblanc'); // one of her held pieces (the KO cut past the smear cap)
      expect(smearOn(), `smear ${id}`).toBe(on);
      expect(smearStyleNow(), `smear style ${id}`).toBe(on ? 'paint' : 'off');
      expect(newMotionOn(), `new motion ${id}`).toBe(on);
      const cam = on && id !== 'ffx2-leblanc'; // the directed camera is one of her held pieces (job J6: the follower crops Yuna at the left edge)
      expect(proCamOn(), `camera ${id}`).toBe(cam);
      expect(proDofOn(), `camera dof ${id}`).toBe(cam);
      expect(proCamGame(), `camera game ${id}`).toBe(cam ? GAME[id] : null);
      expect(stagingOn(), `staging ${id}`).toBe(on);
      for (const piece of ['card', 'ending', 'opening'] as StagingPiece[]) {
        expect(stagingPieceOn(piece), `staging ${piece} ${id}`).toBe(on);
        expect(stagingPieceOnFor(piece, id), `staging for ${piece} ${id}`).toBe(on);
      }
      expect(fxNewOn(), `fx ${id}`).toBe(on);
      expect(inFxDemoChapter(id), `fx gate ${id}`).toBe(on);
      expect(fxGame(), `fx game ${id}`).toBe(on ? GAME[id] : undefined);
      setFeelChapter(id);
      expect(inFeelChapter(), `feel ${id}`).toBe(on);
      expect([punchMode(), stopMode(), rumbleOn(), shadowFollows(), motionSfxOn()], `feel pieces ${id}`).toEqual(on ? ['new', 'short', true, true, true] : ['today', 'today', false, false, false]);
      expect(audioNewOn(), `audio ${id}`).toBe(on);
      expect(passGame(), `audio game ${id}`).toBe(on ? GAME[id] : null);
      expect(new DemoGovernor().gate(true), `governor ${id}`).toBe(on);
      expect(chapterLook(id) !== null, `hd2d ${id}`).toBe(on);
    }
  });

  it('the games read from the running chapter: FFX-2 in Chapter IV and Leblanc, FFX in Chapter I', () => {
    allOn();
    setTreatedScope(scope);
    for (const id of reached(scope)) {
      setDemoChapter(id);
      expect(curvesGame(), id).toBe(GAME[id]);
      expect(stagingGame(), id).toBe(GAME[id]);
    }
    setDemoChapter('ffx2-leblanc');
    expect(curvesGame()).toBe(scope === 'all' ? 'ffx2' : 'ffx'); // release 68: not a demo chapter, FFX is the fallback nothing reads
  });
});

describe('the pieces Leblanc holds: the staged breath, the directed camera and the moments', () => {
  it('the breath stays today for her and plays in nobody else (the staging answers the piece, not only the chapter)', () => {
    allOn();
    setTreatedScope('all');
    for (const id of [...BOOTH, 'ffx2-leblanc']) {
      setDemoChapter(id);
      expect(stagingPieceOn('breath'), id).toBe(id !== 'ffx2-leblanc');
      expect(stagingPieceOnFor('breath', id), id).toBe(id !== 'ffx2-leblanc');
      expect(stagingOn(), id).toBe(true); // the layer is still there for her card, her ending and her Change plate
    }
  });

  it('the directed camera (and its soft background) stays the resting camera of release 68 for her and plays in both booth chapters; ?treated=pack and every other chapter are unchanged', () => {
    allOn();
    setTreatedScope('all');
    for (const id of [...BOOTH, 'ffx2-leblanc']) {
      setDemoChapter(id);
      const held = id === 'ffx2-leblanc';
      expect([proCamOn(), proDofOn(), proCamGame()], id).toEqual(held ? [false, false, null] : [true, true, GAME[id]]);
      expect(newMotionOn(), id).toBe(true); // the rest of the treatment still reaches her: the camera is one piece
      expect(stagingOn(), id).toBe(true);
    }
    setDemoChapter('exp-leblanc');
    expect(proCamOn()).toBe(false);
  });

  it('the moments (the KO cut and its rebound, the victory cheer) stay release 68 for her and play in the booth pair; the smear and the curves, which they only share a gate with, still reach her', () => {
    allOn();
    setTreatedScope('all');
    for (const id of [...BOOTH, 'ffx2-leblanc']) {
      setDemoChapter(id);
      const held = id === 'ffx2-leblanc';
      expect([momentsOn(), smearOn(), curvesOn(), newMotionOn()], id).toEqual([!held, true, true, true]);
    }
    setTreatedScope('pack');
    setDemoChapter('ffx2-leblanc');
    expect(momentsOn()).toBe(false);
  });
});

describe('the chapter-wide switches still say no without their own word', () => {
  it('a switch left at today (no address word, no pack) answers false in Leblanc under all, as in the booth pair', () => {
    setTreatedScope('all');
    for (const id of [...BOOTH, 'ffx2-leblanc']) {
      setDemoChapter(id);
      setPassChapter(id);
      expect([hudF1On(), proLookOn(), partyRimOff(), bossCleanOn(), curvesOn(), momentsOn(), smearOn(), proCamOn(), stagingOn(), fxNewOn(), audioNewOn()], id).toEqual(new Array(11).fill(false));
    }
  });
});

describe('the boss re-cut and the rim, in Leblanc', () => {
  it("her trio and the goons draw no screen-space rim in her chapter under all, the party draws none, and the re-cut art ids stay the booth bosses' two", () => {
    allOn();
    setTreatedScope('all');
    setDemoChapter('ffx2-leblanc');
    const foes = ['leblanc', 'logos', 'logos-room', 'ormi', 'ormi-logos-room', 'ormi-entrance', 'dr-goon', 'fem-goon'];
    for (const id of foes) {
      const o = new Object3D();
      tagRimFigure(o, id, 'enemy');
      expect(rimSkipOf(o), id).toBe(true);
    }
    const girl = new Object3D();
    tagRimFigure(girl, 'yuna', 'party');
    expect(rimSkipOf(girl)).toBe(true);
    const other = new Object3D();
    tagRimFigure(other, 'ghost', 'enemy');
    expect(rimSkipOf(other)).toBe(false);
    for (const art of ['leblanc', 'ormi', 'logos', 'ffx2-dr-goon', 'ffx2-fem-goon']) {
      expect(bossCleanOn(art), art).toBe(false); // no re-cut art, no footprint row: only the rim half
      expect(bossCleanCard(art), art).toBe(false);
    }
  });

  it("under pack, and in the hidden experiment that plays the same ids, her trio keeps its rim", () => {
    allOn();
    for (const [scope, chapter] of [['pack', 'ffx2-leblanc'], ['all', 'exp-leblanc']] as const) {
      setTreatedScope(scope);
      setDemoChapter(chapter);
      for (const id of ['leblanc', 'ormi', 'logos']) {
        const o = new Object3D();
        tagRimFigure(o, id, 'enemy');
        expect(rimSkipOf(o), `${scope} ${chapter} ${id}`).toBe(false);
      }
    }
  });
});

describe("the lane-off words, ?pack=off and a phone still give release 62's frame in Leblanc (the same readers as the booth pair; no per-chapter word)", () => {
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
  const readAll = (id: string): boolean[] => {
    setDemoChapter(id);
    setPassChapter(id);
    setFeelChapter(id);
    return [hudF1On(), proLookOn(), partyRimOff(), bossCleanOn(), curvesOn(), momentsOn(), smearOn(), proCamOn(), stagingOn(), fxNewOn(), audioNewOn(), inFeelChapter() && punchMode() === 'new'];
  };

  it('on a desktop with no word the treatment plays in Leblanc under all, as it does in the booth pair, but for the pieces she holds', () => {
    setTreatedScope('all');
    setPackScreen('desk');
    readFrom('');
    for (const id of [...BOOTH, 'ffx2-leblanc']) expect(readAll(id), id).toEqual(wholeTreatment(id));
  });

  it('?pack=off puts every piece back, in Leblanc and in the booth pair alike (the HD-2D look, which no pack word ever gated, follows ?look=off and OPTIONS > VISUAL STYLE)', () => {
    setTreatedScope('all');
    setPackScreen('desk');
    readFrom('?pack=off');
    for (const id of [...BOOTH, 'ffx2-leblanc']) expect(readAll(id), id).toEqual(new Array(12).fill(false));
  });

  it('a phone or a tablet (the page opened narrow or touch-first) has no pack by default, so Leblanc plays release 62\'s frame there too', () => {
    setTreatedScope('all');
    setPackScreen('phone');
    readFrom('');
    for (const id of [...BOOTH, 'ffx2-leblanc']) expect(readAll(id), id).toEqual(new Array(12).fill(false));
    readFrom('?pack=demo'); // the booth address forces it on anywhere
    for (const id of [...BOOTH, 'ffx2-leblanc']) expect(readAll(id), id).toEqual(wholeTreatment(id));
  });

  it('?pro=off takes the three pro lanes (look, camera, staging) back and leaves the HUD, the motion, the effects and the sound as they were; ?treated=pack takes Leblanc back whole', () => {
    setTreatedScope('all');
    setPackScreen('desk');
    readFrom('?pro=off');
    const [hud, look, rim, boss, curves, moments, smear, cam, staging, fx, audio] = readAll('ffx2-leblanc');
    expect([look, cam, staging]).toEqual([false, false, false]);
    expect([hud, rim, boss, curves, smear, fx, audio]).toEqual(new Array(7).fill(true));
    expect(moments).toBe(false); // held for her, with or without a word
    readFrom('');
    setTreatedScope('pack');
    expect(readAll('ffx2-leblanc')).toEqual(new Array(12).fill(false));
    expect(readAll('ffx2-bahamut')).toEqual(new Array(12).fill(true));
  });
});
