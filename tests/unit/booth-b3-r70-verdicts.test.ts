/**
 * THE r70 VERDICT PASS ON `booth-b3` (2026-10-31; both games for the plumbing: IX and XII FFX only, V and XI FFX-2 only; `docs/handoff/booth-b3.md` section 12).
 *
 * The browser jobs of the two lanes (live release 69 as the control, headless Chromium on the GPU, seed 1) read the fourteen chapters of `booth-b3`. The driver's rule for the verdicts: a chapter that ships with holds gets each named hold
 * (`PieceHolds.ts`, the reason and its "Lifts when"); a chapter with a major defect the treatment introduced comes off `TREATED_CHAPTERS` (its rows stay, unread); a small confirmed defect with an obvious fix is fixed with a test, otherwise the
 * piece is held. The result: TEN chapters are treated in release 70, FOUR are off the list, and two chapters gained a `cam` hold. This file pins that result as one table, so a later edit to the list or to a hold is a decision made here too.
 *
 * Cases for a withdrawn chapter that the lanes wrote are not deleted: they are gated with `itIf` / `describeIf` (`booth-r70-withdrawn.ts`) and run again, with no edit, the day one line puts the chapter back.
 *
 * **`booth-ffx2-b4-sky` (FFX-2 only, `docs/handoff/booth-ffx2-b4-sky.md`) put Chapters V and XI back with the look held, so the list is TWELVE: release 70's ten plus the two that returned (`RETURNED_R71`). The first three tests pin both halves.**
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import {
  PIECE_HOLDS,
  TREATED_CHAPTERS,
  TREATED_PIECES,
  demoGameOf,
  isTreatedChapter,
  setTreatedScope,
  treatedHold,
  type TreatedPiece,
} from '../../src/engine/motion/DemoGate.ts';
import { CHAPTER_LOOKS, chapterLook } from '../../src/engine/look/LookConfig.ts';
import { SCRIPTED_RIGS } from '../../src/engine/procam/ProAutoStage.ts';
import { RETURNED_R71, WITHDRAWN_R70 } from './booth-r70-withdrawn.ts';

afterEach(() => setTreatedScope(null));

/** What release 70 treats and what each chapter holds, in the table's own order (the booth pair holds nothing: the approved target). */
const RELEASE_70: Readonly<Record<string, readonly TreatedPiece[]>> = {
  'seymour-flux': [], // Chapter I, FFX
  yunalesca: ['breath', 'cam', 'smear'], // Chapter II, FFX
  'braskas-final-aeon': ['breath', 'moments'], // Chapter III, FFX
  'ffx2-bahamut': [], // Chapter IV, FFX-2
  'ffx2-leblanc': ['breath', 'cam', 'moments'], // Chapter VI, FFX-2
  'seymour-anima-macalania': ['breath', 'cam', 'moments'], // Chapter VII, FFX
  'seymour-natus': ['breath', 'cam', 'moments'], // Chapter X, FFX: `cam` added by the r70 verdict
  'ffx2-trema': ['cam', 'breath', 'moments'], // Chapter XIII, FFX-2
  'isaaru-via-purifico': ['breath', 'cam', 'moments'], // Chapter XIV, FFX
  'ffx2-den-of-woe': ['cam', 'breath', 'moments'], // Chapter XV, FFX-2: `cam` added by the r70 verdict
};

describe('the result of the r70 verdicts: ten treated, four off the list, two cam holds added; two of the four came back in booth-ffx2-b4-sky', () => {
  it('the list is release 70\'s ten chapters, each with the holds the table gives, plus the two that returned (V and XI, FFX-2 only, with the look held)', () => {
    expect(Object.keys(TREATED_CHAPTERS).sort()).toEqual([...Object.keys(RELEASE_70), ...Object.keys(RETURNED_R71)].sort());
    for (const [id, r] of Object.entries(RETURNED_R71)) {
      expect(Object.keys(PIECE_HOLDS[id] ?? {}).sort(), id).toEqual([...r.held].sort());
      expect(TREATED_CHAPTERS[id], id).toEqual({ game: 'ffx2', since: 'r71' });
      expect(getChapter(id)?.game, id).toBe(r.game); // rule 14: the game the registry says
    }
    for (const [id, held] of Object.entries(RELEASE_70)) {
      expect(Object.keys(PIECE_HOLDS[id] ?? {}), id).toEqual([...held]);
      expect(getChapter(id)?.game, id).toBe(TREATED_CHAPTERS[id]!.game); // rule 14: the game the registry says
    }
  });

  it('the games of the twelve: FFX is Chapters I, II, III, VII, X and XIV; FFX-2 is Chapters IV, V, VI, XI, XIII and XV', () => {
    const ffx = Object.entries(TREATED_CHAPTERS).filter(([, e]) => e.game === 'ffx').map(([id]) => id).sort();
    const ffx2 = Object.entries(TREATED_CHAPTERS).filter(([, e]) => e.game === 'ffx2').map(([id]) => id).sort();
    expect(ffx).toEqual(['braskas-final-aeon', 'isaaru-via-purifico', 'seymour-anima-macalania', 'seymour-flux', 'seymour-natus', 'yunalesca']);
    expect(ffx2).toEqual(['ffx2-bahamut', 'ffx2-den-of-woe', 'ffx2-fallen-aeons', 'ffx2-leblanc', 'ffx2-trema', 'ffx2-vegnagun-shuyin']);
  });

  it('the two chapters still withdrawn (IX and XII) answer release 68 for every piece under both scopes, in the game the registry says, and keep their rows (look, holds) in the tables', () => {
    for (const [id, w] of Object.entries(WITHDRAWN_R70)) {
      for (const scope of ['all', 'pack'] as const) {
        setTreatedScope(scope);
        expect(isTreatedChapter(id), `${id} ${scope}`).toBe(false);
        for (const p of TREATED_PIECES) expect(isTreatedChapter(id, p), `${id} ${p} ${scope}`).toBe(false);
      }
      setTreatedScope('all');
      expect(chapterLook(id), id).toBeNull(); // the look row stays (next line) and is unread
      expect(CHAPTER_LOOKS[id], id).toEqual({ name: 'hd2d', strength: 'bold' });
      expect(PIECE_HOLDS[id], id).toBeDefined();
      expect(demoGameOf(id, w.game === 'ffx' ? 'ffx2' : 'ffx'), id).toBe(w.game === 'ffx' ? 'ffx2' : 'ffx'); // not treated: the caller's fallback
      expect(getChapter(id)?.game, id).toBe(w.game);
    }
  });

  it("Chapter XI's follower row (`SCRIPTED_RIGS`, the stand-down at the Shiva seam) stays in the table, unread: the chapter is back on the list but holds the camera (its follower crops Yuna), so no follower runs there", () => {
    expect(Object.keys(SCRIPTED_RIGS)).toEqual(['ffx2-fallen-aeons', 'ffx2-trema']);
    expect(Object.keys(TREATED_CHAPTERS)).toContain('ffx2-fallen-aeons');
    setTreatedScope('all');
    expect(isTreatedChapter('ffx2-fallen-aeons', 'cam')).toBe(false);
    expect(isTreatedChapter('ffx2-fallen-aeons', 'hud')).toBe(true);
  });
});

describe('the two holds the verdicts added (written to be lifted)', () => {
  it("Chapter X holds the directed camera: the victory close-up is Kimahri's when Tidus lands the last blow, and it crops him at the top edge (gate G5)", () => {
    const why = treatedHold('seymour-natus', 'cam')!;
    expect(why).toMatch(/Kimahri/);
    expect(why).toMatch(/top edge/);
    expect(why).toMatch(/4 of 4 runs/);
    expect(why).toMatch(/Lifts when the victory close-up is fitted/);
    expect(why).toMatch(/at 16:9, 21:9 and 4:3/);
    expect(why.length).toBeGreaterThan(80);
    expect(isTreatedChapter('seymour-natus', 'cam')).toBe(false); // under pack only the booth pair answers, so ask under all:
    setTreatedScope('all');
    expect(isTreatedChapter('seymour-natus', 'cam')).toBe(false);
    expect(isTreatedChapter('seymour-natus', 'hud')).toBe(true); // every other piece plays
    expect(isTreatedChapter('seymour-natus', 'ending')).toBe(true);
  });

  it('Chapter XV holds the directed camera: the follower crops Yuna twice as often as release 69 (5.4 against 2.8 percent of frames at 2560 x 1440), the same hold as Leblanc', () => {
    const why = treatedHold('ffx2-den-of-woe', 'cam')!;
    expect(why).toMatch(/107 of 1,968/);
    expect(why).toMatch(/55 of 1,980/);
    expect(why).toMatch(/40 of 1,971/);
    expect(why).toMatch(/Lifts when `ProAutoStage` re-scores/);
    expect(treatedHold('ffx2-leblanc', 'cam')).toMatch(/Lifts when `ProAutoStage` re-scores/); // the same lift, so the two follower chapters are lifted by one piece of work
    setTreatedScope('all');
    expect(isTreatedChapter('ffx2-den-of-woe', 'cam')).toBe(false);
    expect(isTreatedChapter('ffx2-den-of-woe', 'hud')).toBe(true);
    expect(isTreatedChapter('ffx2-den-of-woe', 'rim')).toBe(true);
  });

  it('no hold string names a bare job number or an art JSON (the two source guards of the booth tests)', () => {
    const src = readFileSync(resolve('src/engine/motion/PieceHolds.ts'), 'utf8');
    for (const m of src.matchAll(/\bJ\d{1,2}\b/g)) {
      const near = src.slice(Math.max(0, (m.index ?? 0) - 150), (m.index ?? 0) + 150);
      expect(near, `${m[0]} names its note`).toMatch(/booth-[a-z0-9-]+\.md/);
    }
    expect(src).not.toMatch(/\.json/);
  });
});

describe('the handoff note carries the result (section 12), where the release plan reads it', () => {
  const NOTE = readFileSync(resolve('docs/handoff/booth-b3.md'), 'utf8');

  it('names the ten treated chapters, the four withdrawn with their defects, and the two added holds', () => {
    expect(NOTE).toMatch(/## 12\. The r70 verdicts/);
    for (const id of Object.keys(WITHDRAWN_R70)) expect(NOTE, id).toContain(id);
    for (const id of Object.keys(RELEASE_70)) expect(NOTE, id).toContain(id);
    expect(NOTE).toMatch(/Zanmato gauge/);
    expect(NOTE).toMatch(/Enemy Intent card/);
    expect(NOTE).toMatch(/flat white halo/);
    expect(NOTE).toMatch(/Kimahri/);
  });
});
