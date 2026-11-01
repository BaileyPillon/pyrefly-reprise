/**
 * THE r71 VERDICTS ON `booth-b4` 016e54530 (2026-10-31; `docs/handoff/booth-b4.md` section 12). Two browser lanes (live release 70 as the control, headless Chromium on the GPU, seed 1, real keys) read the batch's chapters. The driver's rule for the verdicts
 * (the one of the r70 pass): a chapter that ships with holds gets each named hold (`PieceHolds.ts` / `PieceHoldsLast.ts`, the reason and its "Lifts when"); a chapter with a major defect the treatment introduced comes off `TREATED_CHAPTERS` (its rows stay,
 * unread); a small confirmed defect with an obvious fix is fixed with a test, otherwise the piece is held. The result, pinned here as one table so a later edit to the list or to a hold is a decision made in a second place:
 *
 *  - **FFX only, off the list again (a major each, regressions against live release 70): IX `yojimbo-cavern`** (job HUD-3: the advisor's one-row tip lands on the Zanmato gauge when Intel is open and the target cursor is up) and **XII `seymour-omnis`**
 *    (job HUD-1: the disc strip and its note are painted over the F1 turn strip under 1920 px wide; job HUD-3: the Sensor plate overlaps the target plate). Their rows, `hudf1-chapters.css` and `F1_TEXT_CEILING` stay, unread.
 *  - **FFX only, ships with two holds: VIII `evrae-airship` holds `hd2d` and `arena`** (job L1: mean luma 106.5 against 88.9 and 12.19 percent over 240 against 2.68 at 1600 x 900; the cone is a white halo and Wakka's head is bleached out: the class that held the same two pieces in V and XI).
 *  - **FFX only, ships as built: XVIII `sin-face`, 27 `mirror-aeons`, III `braskas-final-aeon`** (III's `real` hold works: the one-frame step of Tidus's painted rect is 66 px against live's 277 and 279).
 *  - **FFX-2 only, ships as built: V `ffx2-vegnagun-shuyin`, XI `ffx2-fallen-aeons`** (the held sky equals live's within 5 mean and 1 point; the XI band mean +5.4 to +7.3 is the F1 HUD's finish layer, `?hud=today` equals live), **XVI `ffx2-ixion-djose`** (job J-B passed: Ixion stays on the list).
 *
 * **r72-hud (2026-11-01, `docs/handoff/r72-hud.md`) put IX and XII back** (the two majors were layout: the advisor's tip over the gauge, the disc strip over the turn strip and the Sensor card over the target flag; each fixed in `hudf1-chapters.css` and `hudAvoidSelectors.f1RibbonEls`, pinned in `r72-hud-layout.test.ts`), so the list is EIGHTEEN again and the cases below that pinned the pair OFF the list now pin the pair's rows and place on it.
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

/** The eighteen treated chapters after the r71 verdicts and r72-hud (the sixteen of the r71 verdicts, and IX and XII back), each with the pieces it holds, in the order of its row. */
const AFTER_R71: Readonly<Record<string, { readonly game: 'ffx' | 'ffx2'; readonly held: readonly string[] }>> = {
  'seymour-flux': { game: 'ffx', held: [] }, // I, the approved target
  yunalesca: { game: 'ffx', held: ['cam', 'breath', 'smear'] }, // II
  'yojimbo-cavern': { game: 'ffx', held: ['breath', 'cam', 'moments'] }, // IX: back in r72-hud (the tip is solved against the ribbon and not slid)
  'braskas-final-aeon': { game: 'ffx', held: ['breath', 'moments', 'real'] }, // III: `real` works (job III, the one-frame step 66 px against live's 277 and 279)
  'ffx2-bahamut': { game: 'ffx2', held: [] }, // IV, the approved target
  'ffx2-vegnagun-shuyin': { game: 'ffx2', held: ['hd2d', 'arena', 'cam', 'breath', 'moments'] }, // V: ships as built (the held sky equals live's)
  'ffx2-leblanc': { game: 'ffx2', held: ['breath', 'cam', 'moments'] }, // VI
  'seymour-anima-macalania': { game: 'ffx', held: ['breath', 'cam', 'moments'] }, // VII
  'evrae-airship': { game: 'ffx', held: ['hd2d', 'arena', 'breath', 'cam', 'moments'] }, // VIII: the r71 verdict added hd2d and arena
  'seymour-omnis': { game: 'ffx', held: ['breath', 'cam', 'moments'] }, // XII: back in r72-hud (the strip right-anchored, the Sensor card under the strip, the ribbon known to the solver)
  'seymour-natus': { game: 'ffx', held: ['breath', 'cam', 'moments'] }, // X
  'ffx2-fallen-aeons': { game: 'ffx2', held: ['hd2d', 'arena', 'cam', 'breath', 'moments'] }, // XI: ships as built
  'ffx2-trema': { game: 'ffx2', held: ['cam', 'breath', 'moments'] }, // XIII
  'isaaru-via-purifico': { game: 'ffx', held: ['breath', 'cam', 'moments'] }, // XIV
  'ffx2-den-of-woe': { game: 'ffx2', held: ['cam', 'breath', 'moments'] }, // XV
  'ffx2-ixion-djose': { game: 'ffx2', held: ['hd2d', 'arena', 'breath', 'cam', 'moments', 'smear'] }, // XVI: ships as built, Ixion stays (job J-B)
  'sin-face': { game: 'ffx', held: ['card', 'breath', 'cam', 'moments', 'smear'] }, // XVIII: ships as built
  'mirror-aeons': { game: 'ffx', held: ['hd2d', 'arena', 'card', 'breath', 'cam', 'moments'] }, // 27: ships as built
};

describe('the list after the r71 verdicts and r72-hud: eighteen of the nineteen', () => {
  it('is exactly the table above, with the game the registry says (rule 14), and 11 FFX and 7 FFX-2', () => {
    expect(Object.keys(TREATED_CHAPTERS).sort()).toEqual(Object.keys(AFTER_R71).sort());
    for (const [id, a] of Object.entries(AFTER_R71)) {
      expect(TREATED_CHAPTERS[id]!.game, id).toBe(a.game);
      expect(getChapter(id)?.game, id).toBe(a.game);
      expect(Object.keys(PIECE_HOLDS[id] ?? {}).sort(), id).toEqual([...a.held].sort()); // the set of pieces held (the order of a row is its lane's; Evrae's order is pinned below)
    }
    expect(Object.values(AFTER_R71).filter((a) => a.game === 'ffx')).toHaveLength(11);
    expect(Object.values(AFTER_R71).filter((a) => a.game === 'ffx2')).toHaveLength(7);
  });

  it('the one listed chapter that is not treated is XVII (the lane\'s NOT_YET); nothing is withdrawn (WITHDRAWN_R70 is empty: IX and XII came back in r72-hud)', () => {
    const notTreated = CHAPTER_IDS.filter((id) => !Object.prototype.hasOwnProperty.call(TREATED_CHAPTERS, id)).sort();
    expect(CHAPTER_IDS).toHaveLength(19);
    expect(notTreated).toEqual(['sin-fins-core']);
    expect(Object.keys(WITHDRAWN_R70)).toEqual([]);
  });
});

describe('Chapters IX and XII are back on the list (r72-hud, FFX only), `since` r71 as the first lane wrote it, with the rows they had', () => {
  for (const id of ['yojimbo-cavern', 'seymour-omnis'] as const) {
    it(`${id}: treated under all for every piece but the three it holds, and not at all under pack (release 68's chapters); FFX in the registry and on the list`, () => {
      expect(getChapter(id)?.game).toBe('ffx');
      expect(TREATED_CHAPTERS[id]).toEqual({ game: 'ffx', since: 'r71' }); // the batch's release number, as the first lane wrote it (the driver's to renumber)
      setTreatedScope('all');
      expect(isTreatedChapter(id)).toBe(true);
      for (const p of TREATED_PIECES) expect(isTreatedChapter(id, p), `${id} ${p}`).toBe(!['breath', 'cam', 'moments'].includes(p));
      setTreatedScope('pack');
      expect(isTreatedChapter(id), `${id} pack`).toBe(false);
      for (const p of TREATED_PIECES) expect(isTreatedChapter(id, p), `${id} ${p} pack`).toBe(false);
    });

    it(`${id}: the rows are the ones the lanes wrote (the three holds with a "Lifts when", the look row, the text-size ceiling that hands today's HUD over at 130), and the look and the arena play`, () => {
      setTreatedScope('all');
      expect(Object.keys(PIECE_HOLDS[id]!)).toEqual(['breath', 'cam', 'moments']);
      for (const p of ['breath', 'cam', 'moments'] as const) expect(treatedHold(id, p), `${id} ${p}`).toMatch(/Lifts when/);
      expect(CHAPTER_LOOKS[id]).toEqual({ name: 'hd2d', strength: 'bold' });
      expect(chapterLook(id)).toEqual({ name: 'hd2d', strength: 'bold' });
      expect(proArenaFor(id, '')).toBe(true);
      expect(F1_TEXT_CEILING[id]).toBe(115);
    });
  }

  it('the stylesheet that lays the gauge, the read-out, the Sensor card and the tip is in the tree and every selector of it hangs from .ffxhud.hud-f1', () => {
    const css = resolve('src/ui/hudf1/hudf1-chapters.css');
    expect(existsSync(css)).toBe(true);
    expect(readFileSync(css, 'utf8')).toMatch(/\.ffxhud\.hud-f1/);
  });

  it('the r72 handoff note carries the chapters, the jobs with their predictions and the game case (docs/handoff/r72-hud.md)', () => {
    const note = readFileSync(resolve('docs/handoff/r72-hud.md'), 'utf8').replace(/\r\n/g, '\n');
    for (const id of ['yojimbo-cavern', 'seymour-omnis']) expect(note, id).toContain(id);
    for (const job of ['HUD-1', 'HUD-2', 'HUD-3', 'HUD-4', 'HUD-5', 'HUD-6', 'HUD-7']) expect(note, job).toContain(job);
    // the review's additions (m5, m6) and the hold condition: the two lines are back on offline proof only, so the note must keep saying which reads are owed
    for (const job of ['HUD-3b', 'HUD-3c', 'HUD-3d', 'HUD-5b', 'HUD-5c', 'HUD-5d', 'HUD-6b', 'HUD-9']) expect(note, job).toContain(job);
    expect(note).toContain('HOLD CONDITION');
    expect(note).toMatch(/FFX only/);
    expect(note).toMatch(/Prediction/i);
  });
});

describe('Chapter VIII (Evrae, FFX only) ships with the HD-2D look and the arena grade held', () => {
  it('holds hd2d and arena first, then the three it held, each with the measured numbers and a "Lifts when"; every other piece plays', () => {
    expect(Object.keys(PIECE_HOLDS['evrae-airship']!)).toEqual(['hd2d', 'arena', 'breath', 'cam', 'moments']);
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
    for (const p of TREATED_PIECES) expect(isTreatedChapter('evrae-airship', p), p).toBe(!['hd2d', 'arena', 'breath', 'cam', 'moments'].includes(p));
  });

  it('the plate draws as release 68 draws it: no look, no arena grade, while the rows stay in their tables (unread) and the pro look, HUD and rim play', () => {
    expect(chapterLook('evrae-airship')).toBeNull();
    expect(proArenaFor('evrae-airship', '')).toBe(false);
    expect(CHAPTER_LOOKS['evrae-airship']).toEqual({ name: 'hd2d', strength: 'bold' });
    expect(FFX_LAST_ARENA['evrae-airship-deck']).toBeDefined();
    for (const p of ['hud', 'look', 'rim', 'boss', 'ending', 'opening', 'curves', 'real', 'feel', 'fx', 'audio', 'governor'] as const) expect(isTreatedChapter('evrae-airship', p), p).toBe(true);
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
