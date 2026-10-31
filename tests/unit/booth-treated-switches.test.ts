/**
 * EVERY SWITCH THE TREATMENT RUNS THROUGH, chapter by chapter, under both scopes (release 69, branch `booth-leblanc`; Bailey 2026-10-30: the booth treatment for every listed chapter, Leblanc first; both games for the
 * plumbing, Leblanc FFX-2 only). Each switch is forced ON the way its own tests force it, then the running chapter is named and the answer read:
 *
 *  - under `pack` (release 68's reach, `?treated=pack`, and a unit test with no page) a switch answers true in the booth pair and false in EVERY other chapter, Leblanc included: byte for byte what release 68 played;
 *  - under `all` it answers true in the booth pair (no piece of the approved target is ever held) and in every chapter on `TREATED_CHAPTERS` (Leblanc, Chapter II, and batch 2's Chapters V, XV and XI), except for the pieces
 *    `PIECE_HOLDS` names for that chapter (every joined chapter holds the breath; Chapter II also the camera and the smear; Chapter V also the camera), and false in every other listed and hidden chapter.
 *
 * The browser has not been run for this (it is busy); the unit answers are the evidence that the gates moved and nothing else did.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { Object3D } from 'three';
import { CHAPTER_IDS } from '../../src/data/encounters.ts';
import { TREATED_CHAPTERS, setDemoChapter, setPackScreen, setTreatedScope, treatedHold, type TreatedPiece } from '../../src/engine/motion/DemoGate.ts';
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
// ONE mechanism for every treated chapter (the merge of `booth-ffx2-b2` and `booth-ffx-yunalesca`): the matrix reads the list and the holds from the source (`TREATED_CHAPTERS`, `PIECE_HOLDS`), so a chapter that joins, or a hold that
// lifts, needs no edit here; `booth-treated-chapters.test.ts` pins WHICH chapters are on the list and WHICH pieces each holds (its TREATED_NOW and HELD_NOW), so the two files cannot drift together unseen.
const GAME: Record<string, 'ffx' | 'ffx2'> = Object.fromEntries(Object.entries(TREATED_CHAPTERS).map(([id, e]) => [id, e.game]));

/** The chapters each scope reaches. */
const reached = (scope: 'pack' | 'all'): readonly string[] => (scope === 'pack' ? BOOTH : Object.keys(TREATED_CHAPTERS));

/** The chapters beyond the booth pair that the `all` scope adds (every one holds the staged breath: `PIECE_HOLDS`). */
const JOINED: readonly string[] = Object.keys(TREATED_CHAPTERS).filter((id) => !BOOTH.includes(id));

/** Is this piece played in this chapter under the scope (reached, and not held)? A held piece answers today's. */
const plays = (scope: 'pack' | 'all', id: string, piece: TreatedPiece): boolean => reached(scope).includes(id) && (BOOTH.includes(id) || treatedHold(id, piece) === undefined);

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
      expect(momentsOn(), `moments ${id}`).toBe(plays(scope, id, 'moments')); // Chapter XIII holds the knock-out's cut (batch 3): the moments piece reads the holds too
      const smear = plays(scope, id, 'smear'); // Chapter II's swap exception: no smear planner there
      expect(smearOn(), `smear ${id}`).toBe(smear);
      expect(smearStyleNow(), `smear style ${id}`).toBe(smear ? 'paint' : 'off');
      expect(newMotionOn(), `new motion ${id}`).toBe(on);
      const cam = plays(scope, id, 'cam'); // Chapter II holds the directed camera (PR-0307) and Chapter V the colossus camera: today's rig plays there, and with it the soft background that rides on the camera
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

describe('the one piece every joined chapter holds, the staged breath', () => {
  it('stays today for Leblanc and Chapter II and plays in the booth pair (the staging answers the piece, not only the chapter)', () => {
    allOn();
    setTreatedScope('all');
    for (const id of [...BOOTH, ...JOINED]) {
      setDemoChapter(id);
      expect(stagingPieceOn('breath'), id).toBe(BOOTH.includes(id));
      expect(stagingPieceOnFor('breath', id), id).toBe(BOOTH.includes(id));
      expect(stagingOn(), id).toBe(true); // the layer is still there for the card, the ending and the opening (Leblanc's Change plate, Chapter II's Overdrive opening)
    }
  });
});

describe('the chapter-wide switches still say no without their own word', () => {
  it('a switch left at today (no address word, no pack) answers false in Leblanc and Chapter II under all, as in the booth pair', () => {
    setTreatedScope('all');
    for (const id of [...BOOTH, ...JOINED]) {
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

  it('on a desktop with no word the whole treatment plays in Leblanc under all, as it does in the booth pair', () => {
    setTreatedScope('all');
    setPackScreen('desk');
    readFrom('');
    for (const id of [...BOOTH, 'ffx2-leblanc']) expect(readAll(id), id).toEqual(new Array(12).fill(true));
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
    for (const id of [...BOOTH, 'ffx2-leblanc']) expect(readAll(id), id).toEqual(new Array(12).fill(true));
  });

  it('?pro=off takes the three pro lanes (look, camera, staging) back and leaves the HUD, the motion, the effects and the sound as they were; ?treated=pack takes Leblanc back whole', () => {
    setTreatedScope('all');
    setPackScreen('desk');
    readFrom('?pro=off');
    const [hud, look, rim, boss, curves, moments, smear, cam, staging, fx, audio] = readAll('ffx2-leblanc');
    expect([look, cam, staging]).toEqual([false, false, false]);
    expect([hud, rim, boss, curves, moments, smear, fx, audio]).toEqual(new Array(8).fill(true));
    readFrom('');
    setTreatedScope('pack');
    expect(readAll('ffx2-leblanc')).toEqual(new Array(12).fill(false));
    expect(readAll('ffx2-bahamut')).toEqual(new Array(12).fill(true));
  });
});
