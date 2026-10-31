/**
 * THE OFF WORDS IN EVERY TREATED CHAPTER (release 70, review of `booth-b2`, finding m2; both games: the list is read from source, so each chapter is judged under its own game).
 *
 * `booth-treated-switches` pins `?pack=off`, a phone and `?treated=pack` for the booth pair and Leblanc. After the merge seven chapters are treated, and the five that joined beyond the booth pair (Leblanc, Chapter II,
 * V, XV, XI) must give release 68's frame under each off word. Here each is read against an UNTREATED control of its own game (`braskas-final-aeon` for FFX, `ffx2-trema` for FFX-2): the two must answer
 * identically on every switch the pack gates. The list is `TREATED_CHAPTERS` itself, so a chapter that joins later is covered with no edit here, and the hidden and untreated chapters are checked never to answer treated.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { CHAPTER_IDS } from '../../src/data/encounters.ts';
import { TREATED_CHAPTERS, TREATED_PIECES, isTreatedChapter, setDemoChapter, setPackScreen, setTreatedScope, treatedHold, type TreatedPiece } from '../../src/engine/motion/DemoGate.ts';
import { hudF1ModeFromSearch, hudF1On, setHudF1Mode } from '../../src/ui/hudf1/HudF1Switch.ts';
import { proArenaFor, proLookOn, proModeFromSearch, setProMode, setProPiece } from '../../src/engine/look/pro/ProSwitch.ts';
import { partyRimFromSearch, partyRimOff, setPartyRim } from '../../src/engine/look/pro/PartyRimSwitch.ts';
import { bossCleanFromSearch, bossCleanOn, setBossClean } from '../../src/engine/look/pro/BossClean.ts';
import { curvesModeFromSearch, curvesOn, realKind, setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { momentsModeFromSearch, momentsOn, setMomentsMode } from '../../src/engine/motion/MomentsSwitch.ts';
import { smearOn, smearStyleFromSearch, setSmearStyle } from '../../src/engine/motion/SmearSwitch.ts';
import { proCamGame, proCamOn, proDofOn, resetProCamForTests } from '../../src/engine/procam/ProCamSwitch.ts';
import { setStagingMode, stagingModeFromSearch, stagingOn, stagingPieceOn } from '../../src/engine/pro/staging/StagingSwitch.ts';
import { fxModeFromSearch, fxNewOn, setFxMode } from '../../src/engine/spellfx/FxSwitch.ts';
import { inFeelChapter, punchMode, resetFeelForTests, setFeelChapter } from '../../src/engine/feel/FeelSwitch.ts';
import { audioNewOn, passConfiguredBy, setAudioNew, setPassChapter } from '../../src/audio/pass/passSwitch.ts';
import { DemoGovernor } from '../../src/engine/governor/DemoGovernor.ts';
import { chapterLook } from '../../src/engine/look/LookConfig.ts';
import { scopeExcepted, swapsInScope, setSwapScope } from '../../src/engine/motion/SwapSwitch.ts';

const BOOTH = ['seymour-flux', 'ffx2-bahamut'];
const TREATED = Object.keys(TREATED_CHAPTERS);
const JOINED = TREATED.filter((id) => !BOOTH.includes(id));
const CONTROL: Record<'ffx' | 'ffx2', string> = { ffx: 'braskas-final-aeon', ffx2: 'ffx2-trema' };
const NAMES = ['hud', 'look', 'rim', 'boss', 'curves', 'moments', 'smear', 'cam', 'camdof', 'camgame', 'staging', 'stagingBreath', 'stagingCard', 'stagingEnding', 'stagingOpening', 'fx', 'audio', 'feel', 'governor', 'arena', 'hd2d', 'real', 'swapScope'] as const;
type Name = (typeof NAMES)[number];

/** Read every switch from the address the way `main` does at start. */
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

/** What every switch answers in the named chapter (the vector the off words must make equal to the control's). */
function readAll(id: string): Record<Name, unknown> {
  setDemoChapter(id);
  setPassChapter(id);
  setFeelChapter(id);
  return {
    hud: hudF1On(),
    look: proLookOn(),
    rim: partyRimOff(),
    boss: bossCleanOn(),
    curves: curvesOn(),
    moments: momentsOn(),
    smear: smearOn(),
    cam: proCamOn(),
    camdof: proDofOn(),
    camgame: proCamOn() ? proCamGame() : null,
    staging: stagingOn(),
    stagingBreath: stagingPieceOn('breath'),
    stagingCard: stagingPieceOn('card'),
    stagingEnding: stagingPieceOn('ending'),
    stagingOpening: stagingPieceOn('opening'),
    fx: fxNewOn(),
    audio: audioNewOn(),
    feel: inFeelChapter() && punchMode() === 'new',
    governor: new DemoGovernor().gate(proLookOn() || proCamOn()),
    arena: proArenaFor(id, ''),
    hd2d: chapterLook(id) !== null,
    real: realKind(),
    swapScope: swapsInScope() || scopeExcepted(id),
  };
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
  setSwapScope(null);
});

const gameOf = (id: string): 'ffx' | 'ffx2' => TREATED_CHAPTERS[id]!.game;
/** Which treated piece each switch of the vector is. */
const PIECE_OF: Partial<Record<Name, TreatedPiece>> = {
  hud: 'hud', look: 'look', rim: 'rim', boss: 'boss', curves: 'curves', moments: 'moments', smear: 'smear', cam: 'cam', camdof: 'cam', fx: 'fx', audio: 'audio', feel: 'feel', governor: 'governor', arena: 'arena', hd2d: 'hd2d',
  stagingBreath: 'breath', stagingCard: 'card', stagingEnding: 'ending', stagingOpening: 'opening', real: 'real',
};

describe('every treated chapter, desktop, scope all, no word', () => {
  it.each(TREATED)('%s: each piece plays unless the chapter holds it (the booth pair holds none)', (id) => {
    setTreatedScope('all');
    setPackScreen('desk');
    setSwapScope('wide');
    readFrom('');
    const got = readAll(id);
    for (const [name, piece] of Object.entries(PIECE_OF) as Array<[Name, TreatedPiece]>) {
      const plays = BOOTH.includes(id) || treatedHold(id, piece) === undefined;
      if (name === 'real') expect(got.real !== null, `${id} ${name}`).toBe(plays);
      else expect(got[name], `${id} ${name}`).toBe(plays);
    }
  });
});

describe('the off words, chapter by chapter (every joined chapter reads as the untreated control of its own game)', () => {
  it.each(JOINED)("%s: ?pack=off gives the control's answers on every switch the pack gates (the HD-2D look rides on its own words)", (id) => {
    setTreatedScope('all');
    setPackScreen('desk');
    setSwapScope('wide');
    readFrom('?pack=off');
    const got = readAll(id);
    readFrom('?pack=off');
    const ctl = readAll(CONTROL[gameOf(id)]);
    for (const n of NAMES) {
      if (n === 'hd2d') continue; // no pack word ever gated the HD-2D look
      expect(got[n], `${id} ${n}`).toEqual(ctl[n]);
    }
  });

  it.each(JOINED)('%s: ?treated=pack is release 68 whole: identical to the control of its game, the HD-2D look and the arena too, and no piece answers treated', (id) => {
    setTreatedScope('pack');
    setPackScreen('desk');
    setSwapScope('wide');
    readFrom('');
    const got = readAll(id);
    const ctl = readAll(CONTROL[gameOf(id)]);
    expect(got).toEqual(ctl);
    for (const p of TREATED_PIECES) expect(isTreatedChapter(id, p), `${id} ${p}`).toBe(false);
  });

  it.each(JOINED)('%s: ?pro=off takes the look, the camera, the staging and the arena back and leaves the rest as the chapter plays them', (id) => {
    setTreatedScope('all');
    setPackScreen('desk');
    setSwapScope('wide');
    readFrom('');
    const base = readAll(id);
    readFrom('?pro=off');
    const got = readAll(id);
    const taken: Name[] = ['look', 'cam', 'camdof', 'staging', 'stagingBreath', 'stagingCard', 'stagingEnding', 'stagingOpening', 'arena'];
    for (const n of taken) expect(got[n], `${id} ${n}`).toBe(false);
    expect(got.camgame, id).toBeNull();
    for (const n of NAMES) {
      if (taken.includes(n) || n === 'camgame' || n === 'governor') continue;
      expect(got[n], `${id} ${n}`).toEqual(base[n]);
    }
  });

  it.each(JOINED)("%s: a phone (no pack by default) gives the control's answers too", (id) => {
    setTreatedScope('all');
    setPackScreen('phone');
    setSwapScope('wide');
    readFrom('');
    const got = readAll(id);
    const ctl = readAll(CONTROL[gameOf(id)]);
    for (const n of NAMES) {
      if (n === 'hd2d') continue;
      expect(got[n], `${id} ${n}`).toEqual(ctl[n]);
    }
  });
});

describe('the untreated and hidden chapters are never answered treated, under every address', () => {
  const OTHERS = [...CHAPTER_IDS, 'exp-leblanc', 'ff7-guard-scorpion', 'ffx2-masterpiece-theatre', 'sinspawn-gui', 'exp-fayth', 'ffx2-tourist-trap', 'ffx2-valefor-besaid', 'biran-yenke', 'ffx2-angra-mainyu', 'last-summoning'].filter((id) => !TREATED.includes(id));
  it.each(['', '?pack=demo', '?pro=on', '?treated=all'])('address %j under scope all: no piece and no switch answers true for any other chapter', (search) => {
    setTreatedScope('all');
    setPackScreen('desk');
    setSwapScope('wide');
    readFrom(search);
    for (const id of OTHERS) {
      const got = readAll(id);
      for (const n of NAMES) {
        if (n === 'swapScope') continue; // the wide scope's own list, not the treatment's
        const v = got[n];
        expect(v === false || v === null || v === undefined, `${id} ${n} under ${search}: ${String(v)}`).toBe(true);
      }
    }
  });
});
