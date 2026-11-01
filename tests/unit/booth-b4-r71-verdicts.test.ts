/**
 * THE r71 VERDICTS ON `booth-b4` 016e54530 (2026-10-31; `docs/handoff/booth-b4.md` section 12). Two browser lanes (live release 70 as the control, headless Chromium on the GPU, seed 1, real keys) read the batch's chapters. The driver's rule for the verdicts
 * (the one of the r70 pass): a chapter that ships with holds gets each named hold (`PieceHolds.ts` / `PieceHoldsLast.ts`, the reason and its "Lifts when"); a chapter with a major defect the treatment introduced comes off `TREATED_CHAPTERS` (its rows stay,
 * unread); a small confirmed defect with an obvious fix is fixed with a test, otherwise the piece is held. The result, pinned here as one table so a later edit to the list or to a hold is a decision made in a second place:
 *
 *  - **FFX only, off the list again (a major each, regressions against live release 70): IX `yojimbo-cavern`** (job HUD-3: the advisor's one-row tip lands on the Zanmato gauge when Intel is open and the target cursor is up) and **XII `seymour-omnis`**
 *    (job HUD-1: the disc strip and its note are painted over the F1 turn strip under 1920 px wide; job HUD-3: the Sensor plate overlaps the target plate). Their rows, `hudf1-chapters.css` and `F1_TEXT_CEILING` stay, unread.
 *  - **FFX only, ships with two holds: VIII `evrae-airship` holds `hd2d` and `arena`** (job L1: mean luma 106.5 against 88.9 and 12.19 percent over 240 against 2.68 at 1600 x 900; the cone is a white halo and Wakka's head is bleached out: the class that held the same two pieces in V and XI).
 *  - **FFX only, ships as built: XVIII `sin-face`, 27 `mirror-aeons`, III `braskas-final-aeon`** (III's `real` hold works: the one-frame step of Tidus's painted rect is 66 px against live's 277 and 279). **The focused review of 10b426248 (HOLD) then found the same one-frame hops in VIII, XVIII and 27 (R71-C2, R71-C1, R71-C3) and each now holds `real` too (`booth-b4-real-hold-r71.test.ts`).**
 *  - **FFX-2 only, ships as built: V `ffx2-vegnagun-shuyin`, XI `ffx2-fallen-aeons`** (the held sky equals live's within 5 mean and 1 point; the XI band mean +5.4 to +7.3 is the F1 HUD's finish layer, `?hud=today` equals live), **XVI `ffx2-ixion-djose`** (job J-B passed: Ixion stays on the list).
 *
 * Game case (rule 14): IX, XII, VIII, XVIII, 27 and III are FFX only (their HUD panels, the airship's range game, the Mirror Aeons chapter are FFX's); V, XI and XVI are FFX-2 only. Shared plumbing is unchanged.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CHAPTER_IDS, getChapter } from '../../src/data/encounters.ts';
import { PIECE_HOLDS, TREATED_CHAPTERS, TREATED_PIECES, isTreatedChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { CHAPTER_LOOKS, chapterLook } from '../../src/engine/look/LookConfig.ts';
import { FFX_LAST_ARENA } from '../../src/engine/look/pro/ProGradeFfxLast.ts';
import { proArenaFor, setProMode } from '../../src/engine/look/pro/ProSwitch.ts';
import { F1_TEXT_CEILING } from '../../src/ui/hudf1/HudF1Switch.ts';
import { WITHDRAWN_R70 } from './booth-r70-withdrawn.ts';

beforeEach(() => {
  setTreatedScope('all');
  setProMode('pro');
});
afterEach(() => {
  setTreatedScope(null);
  setProMode(null);
});

/** The sixteen treated chapters after the r71 verdicts, each with the pieces it holds, in the order of its row. */
const AFTER_R71: Readonly<Record<string, { readonly game: 'ffx' | 'ffx2'; readonly held: readonly string[] }>> = {
  'seymour-flux': { game: 'ffx', held: [] }, // I, the approved target
  yunalesca: { game: 'ffx', held: ['cam', 'breath', 'smear'] }, // II
  'braskas-final-aeon': { game: 'ffx', held: ['breath', 'moments', 'real'] }, // III: `real` works (job III, the one-frame step 66 px against live's 277 and 279)
  'ffx2-bahamut': { game: 'ffx2', held: [] }, // IV, the approved target
  'ffx2-vegnagun-shuyin': { game: 'ffx2', held: ['hd2d', 'arena', 'cam', 'breath', 'moments'] }, // V: ships as built (the held sky equals live's)
  'ffx2-leblanc': { game: 'ffx2', held: ['breath', 'cam', 'moments'] }, // VI
  'seymour-anima-macalania': { game: 'ffx', held: ['breath', 'cam', 'moments'] }, // VII
  'evrae-airship': { game: 'ffx', held: ['hd2d', 'arena', 'breath', 'cam', 'moments', 'real'] }, // VIII: the r71 verdict added hd2d and arena; the focused review of 10b426248 added real (R71-C2)
  'seymour-natus': { game: 'ffx', held: ['breath', 'cam', 'moments'] }, // X
  'ffx2-fallen-aeons': { game: 'ffx2', held: ['hd2d', 'arena', 'cam', 'breath', 'moments'] }, // XI: ships as built
  'ffx2-trema': { game: 'ffx2', held: ['cam', 'breath', 'moments'] }, // XIII
  'isaaru-via-purifico': { game: 'ffx', held: ['breath', 'cam', 'moments'] }, // XIV
  'ffx2-den-of-woe': { game: 'ffx2', held: ['cam', 'breath', 'moments'] }, // XV
  'ffx2-ixion-djose': { game: 'ffx2', held: ['hd2d', 'arena', 'breath', 'cam', 'moments', 'smear'] }, // XVI: ships as built, Ixion stays (job J-B)
  'sin-face': { game: 'ffx', held: ['card', 'breath', 'cam', 'moments', 'smear', 'real'] }, // XVIII: ships as built; the focused review of 10b426248 added real (R71-C1)
  'mirror-aeons': { game: 'ffx', held: ['hd2d', 'arena', 'card', 'breath', 'cam', 'moments', 'real'] }, // 27: ships as built; the focused review of 10b426248 added real (R71-C3)
};

describe('the list after the r71 verdicts: sixteen of the nineteen', () => {
  it('is exactly the table above, with the game the registry says (rule 14), and 9 FFX and 7 FFX-2', () => {
    expect(Object.keys(TREATED_CHAPTERS).sort()).toEqual(Object.keys(AFTER_R71).sort());
    for (const [id, a] of Object.entries(AFTER_R71)) {
      expect(TREATED_CHAPTERS[id]!.game, id).toBe(a.game);
      expect(getChapter(id)?.game, id).toBe(a.game);
      expect(Object.keys(PIECE_HOLDS[id] ?? {}).sort(), id).toEqual([...a.held].sort()); // the set of pieces held (the order of a row is its lane's; Evrae's order is pinned below)
    }
    expect(Object.values(AFTER_R71).filter((a) => a.game === 'ffx')).toHaveLength(9);
    expect(Object.values(AFTER_R71).filter((a) => a.game === 'ffx2')).toHaveLength(7);
  });

  it('the three listed chapters that are not treated are IX, XII and XVII, and the first two are WITHDRAWN_R70 (FFX only) while XVII is the lane\'s NOT_YET', () => {
    const notTreated = CHAPTER_IDS.filter((id) => !Object.prototype.hasOwnProperty.call(TREATED_CHAPTERS, id)).sort();
    expect(CHAPTER_IDS).toHaveLength(19);
    expect(notTreated).toEqual(['seymour-omnis', 'sin-fins-core', 'yojimbo-cavern']);
    expect(Object.keys(WITHDRAWN_R70).sort()).toEqual(['seymour-omnis', 'yojimbo-cavern']);
  });
});

describe('Chapters IX and XII are off the list again (FFX only): a major each, their rows stay and are unread', () => {
  for (const id of ['yojimbo-cavern', 'seymour-omnis'] as const) {
    it(`${id}: not treated under either scope for any piece, FFX in the registry and in WITHDRAWN_R70, and the reason names the r71 verdict and a regression against release 70`, () => {
      expect(getChapter(id)?.game).toBe('ffx');
      expect(WITHDRAWN_R70[id]!.game).toBe('ffx');
      expect(WITHDRAWN_R70[id]!.why).toMatch(/r71 verdict/);
      expect(WITHDRAWN_R70[id]!.why).toMatch(/regressions? against release 70/);
      for (const scope of ['all', 'pack'] as const) {
        setTreatedScope(scope);
        expect(isTreatedChapter(id), `${id} ${scope}`).toBe(false);
        for (const p of TREATED_PIECES) expect(isTreatedChapter(id, p), `${id} ${p} ${scope}`).toBe(false);
      }
      setTreatedScope('all');
      expect(chapterLook(id), id).toBeNull();
      expect(proArenaFor(id, ''), id).toBe(false);
    });

    it(`${id}: the rows stay in their tables (the three holds, the look row, the text-size ceiling), so one line on the list puts the chapter back`, () => {
      expect(Object.keys(PIECE_HOLDS[id]!)).toEqual(['breath', 'cam', 'moments']);
      for (const p of ['breath', 'cam', 'moments'] as const) expect(treatedHold(id, p), `${id} ${p}`).toMatch(/Lifts when/);
      expect(CHAPTER_LOOKS[id]).toEqual({ name: 'hd2d', strength: 'bold' });
      expect(F1_TEXT_CEILING[id]).toBe(115);
    });
  }

  it('the stylesheet that lays the gauge and the read-out stays in the tree (it reaches nothing while both chapters are off the list: every selector hangs from .ffxhud.hud-f1)', () => {
    const css = resolve('src/ui/hudf1/hudf1-chapters.css');
    expect(existsSync(css)).toBe(true);
    expect(readFileSync(css, 'utf8')).toMatch(/\.ffxhud\.hud-f1/);
  });

  it('the reasons carry the measured overlaps (job HUD-3 for IX; jobs HUD-1 and HUD-3 for XII), so the lift is a number to beat', () => {
    expect(WITHDRAWN_R70['yojimbo-cavern']!.why).toMatch(/634 x 53 px at 2560 x 1440/);
    expect(WITHDRAWN_R70['yojimbo-cavern']!.why).toMatch(/live reads 0/);
    expect(WITHDRAWN_R70['seymour-omnis']!.why).toMatch(/58\.7 x 29\.6 px at 1280 x 720/);
    expect(WITHDRAWN_R70['seymour-omnis']!.why).toMatch(/71\.6 x 78 px at 1600 x 900/);
  });
});

describe('Chapter VIII (Evrae, FFX only) ships with the HD-2D look and the arena grade held', () => {
  it('holds hd2d and arena first, then the three it held, each with the measured numbers and a "Lifts when"; every other piece plays', () => {
    expect(Object.keys(PIECE_HOLDS['evrae-airship']!)).toEqual(['hd2d', 'arena', 'breath', 'cam', 'moments', 'real']); // `real` appended after the focused review of 10b426248 (R71-C2)
    for (const p of ['hd2d', 'arena'] as const) {
      const why = treatedHold('evrae-airship', p)!;
      expect(why.length, p).toBeGreaterThan(300);
      expect(why, p).toMatch(/Lifts when .*\.$/);
      expect(why, p).toMatch(/still pair/);
      expect(why, p).not.toMatch(/\.json\b/);
    }
    expect(treatedHold('evrae-airship', 'hd2d')).toMatch(/106\.5 and 105\.6 against 88\.9 and 88\.7/);
    expect(treatedHold('evrae-airship', 'hd2d')).toMatch(/12\.19 and 12\.30 percent against 2\.68 and 2\.57/);
    expect(treatedHold('evrae-airship', 'hd2d')).toMatch(/20\.05 percent against 0\.97/);
    expect(treatedHold('evrae-airship', 'hd2d')).toMatch(/no more than 3 points over/);
    expect(treatedHold('evrae-airship', 'hd2d')).toMatch(/1\.29 and 1\.20 percent of pixels over 240 and a sky band at 1\.38 and 0\.88 percent/); // the held frame, read in the apply pass (predicted at most 3.7 and 3)
    expect(treatedHold('evrae-airship', 'arena')).toMatch(/evrae-airship-deck/);
    for (const p of TREATED_PIECES) expect(isTreatedChapter('evrae-airship', p), p).toBe(!['hd2d', 'arena', 'breath', 'cam', 'moments', 'real'].includes(p));
  });

  it('the plate draws as release 68 draws it: no look, no arena grade, while the rows stay in their tables (unread) and the pro look, HUD and rim play', () => {
    expect(chapterLook('evrae-airship')).toBeNull();
    expect(proArenaFor('evrae-airship', '')).toBe(false);
    expect(CHAPTER_LOOKS['evrae-airship']).toEqual({ name: 'hd2d', strength: 'bold' });
    expect(FFX_LAST_ARENA['evrae-airship-deck']).toBeDefined();
    for (const p of ['hud', 'look', 'rim', 'boss', 'ending', 'opening', 'curves', 'feel', 'fx', 'audio', 'governor'] as const) expect(isTreatedChapter('evrae-airship', p), p).toBe(true);
    expect(isTreatedChapter('evrae-airship', 'real')).toBe(false); // held after the focused review of 10b426248 (R71-C2): the house curves play
  });

  it('the camera hold no longer says the look\'s tilt-shift band stays (the look is held too); Sin\'s face, which keeps the look, still says it', () => {
    expect(treatedHold('evrae-airship', 'cam')).toMatch(/held too: see the hd2d hold/);
    expect(treatedHold('evrae-airship', 'cam')).not.toMatch(/tilt-shift band stays/);
    expect(treatedHold('sin-face', 'cam')).toMatch(/tilt-shift band stays/);
  });

  it('Sin\'s face (the same deck, FFX only) keeps the look and the arena: no hold was added there (job L1: the sun glare is the design, the party reads)', () => {
    expect(chapterLook('sin-face')).toEqual({ name: 'hd2d', strength: 'bold' });
    expect(proArenaFor('sin-face', '')).toBe(true);
    expect(treatedHold('sin-face', 'hd2d')).toBeUndefined();
    expect(treatedHold('sin-face', 'arena')).toBeUndefined();
  });
});

describe('the chapters that ship as built hold nothing new', () => {
  it('the Farplane\'s two (V and XI) keep hd2d and arena held and play the rest; Ixion keeps the room looks held; the Mirror Aeons chapter keeps its card and looks held; Braska\'s chapter holds `real` and Chapter I plays it', () => {
    for (const id of ['ffx2-vegnagun-shuyin', 'ffx2-fallen-aeons']) {
      expect(chapterLook(id), id).toBeNull();
      expect(proArenaFor(id, ''), id).toBe(false);
      expect(isTreatedChapter(id, 'hud'), id).toBe(true);
    }
    expect(isTreatedChapter('ffx2-ixion-djose', 'hd2d')).toBe(false);
    expect(isTreatedChapter('mirror-aeons', 'card')).toBe(false);
    for (const id of ['evrae-airship', 'sin-face', 'mirror-aeons']) expect(isTreatedChapter(id, 'real'), id).toBe(false); // the focused review of 10b426248 (R71-C2, R71-C1, R71-C3) held the real clips in the three
    expect(isTreatedChapter('braskas-final-aeon', 'real')).toBe(false);
    expect(isTreatedChapter('seymour-flux', 'real')).toBe(true);
  });
});

describe('the handoff note carries the result (section 12), where the release plan reads it', () => {
  const NOTE = readFileSync(resolve('docs/handoff/booth-b4.md'), 'utf8').replace(/\r\n/g, '\n');

  it('names each chapter\'s verdict and the numbers the verdict stands on', () => {
    expect(NOTE).toMatch(/## 12\. The r71 verdicts/);
    for (const id of ['yojimbo-cavern', 'seymour-omnis', 'evrae-airship', 'sin-face', 'mirror-aeons', 'braskas-final-aeon', 'ffx2-vegnagun-shuyin', 'ffx2-fallen-aeons', 'ffx2-ixion-djose']) expect(NOTE, id).toContain(id);
    expect(NOTE).toMatch(/634 x 53 px/);
    expect(NOTE).toMatch(/58\.7 x 29\.6 px/);
    expect(NOTE).toMatch(/12\.19/);
    expect(NOTE).toMatch(/1\.29/);
    expect(NOTE).toMatch(/sixteen of the nineteen/);
  });
});
