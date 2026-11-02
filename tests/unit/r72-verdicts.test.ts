/**
 * THE BROWSER VERDICTS ON THE RELEASE 72 CANDIDATE (`origin/r72` 2f9c91791; 2026-11-01; the FFX lane and the FFX-2 lane, headless Chromium on the GPU, seed 1, real keys).
 *
 * The verdicts, applied under the driver's rule (ship with holds: add each hold row with a test; do not ship: take the chapter off the list; a small confirmed defect with an obvious fix: fix it with a test; else hold the piece):
 *  - **FFX lane: ship with holds. One hold: Chapter XII's F1 HUD** (`PIECE_HOLDS['seymour-omnis'].hud`; job J-HUD-5b: the target flag overlaps the Move advisor card in 34 of 232 cursor stops at TEXT SIZE 100). The fix the lane
 *    names (steer the advisor card against the flag's dock boxes) is not small or obvious and needs its own browser read, so the piece is held, not fixed. Chapter XII stays on the list and plays every other piece (the real clips,
 *    the flip fit, the slide ease, the look, the feel, the sound). FFX only (rule 14).
 *  - Chapters IX, III, VII, XIV, I, II and X: ship, no new hold (IX met the hold condition: 0 overlapping pairs; III's `real` hold stays lifted: 0 teleports against 3).
 *  - **FFX-2 lane: ship, no hold row.** Chapter XI plays grade C by default (`hd2d` and `arena` stay lifted), Chapter V and Chapter IV are unchanged.
 *
 * What this file pins: the one new hold, who holds the F1 HUD (Chapter XII alone), that no verdict took a chapter off the list or added a hold anywhere else, and that the handoff note records the verdicts (`docs/handoff/r72.md` section 10).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import { PIECE_HOLDS, TREATED_CHAPTERS, TREATED_PIECES, isTreatedChapter, setTreatedScope, treatedHold, treatedHolds } from '../../src/engine/motion/DemoGate.ts';
import { findLocalPaths } from '../../tools/dist-local-paths.mjs';

afterEach(() => {
  setTreatedScope(null);
});

const OMNIS = 'seymour-omnis';
const note = (): string => readFileSync(resolve('docs/handoff/r72.md'), 'utf8').replace(/\r\n/g, '\n');

describe('Chapter XII holds the F1 HUD (FFX only; r72 review, job J-HUD-5b) and plays every other piece it played', () => {
  it('is on the list, FFX in the registry and in the table, and holds hud first, then the three it held', () => {
    expect(getChapter(OMNIS)?.game).toBe('ffx');
    expect(TREATED_CHAPTERS[OMNIS]).toEqual({ game: 'ffx', since: 'r71' });
    expect(Object.keys(PIECE_HOLDS[OMNIS]!)).toEqual(['hud', 'breath', 'cam', 'moments']);
    expect(treatedHolds(OMNIS)).toEqual(['hud', 'breath', 'cam', 'moments']);
  });

  it('the reason carries the measured numbers, says what the hold costs and what plays on, names no folder of the build machine, and ends in its "Lifts when"', () => {
    const why = treatedHold(OMNIS, 'hud')!;
    expect(why.length).toBeGreaterThan(600);
    for (const w of [/232 stops/, /34 of them/, /1600 x 900 in 5 of 29/, /1366 x 768 in 2/, /1440 x 810 in 9/, /1536 x 864 in 6/, /1920 x 1080 in 11/, /15\.3 grid px/, /1\.7 grid px/, /2560 and 3440 wide and TEXT SIZE 115 read 0/, /no text is covered/, /87 of 87/, /41 of 87/, /0 teleports/]) {
      expect(why, String(w)).toMatch(w);
    }
    expect(why).toMatch(/the real clips, the flip fit, the slide ease and the look play/);
    expect(why).toMatch(/Lifts when the advisor card is steered against the flag's dock boxes, or hidden while the cursor is up at those widths, and the 29-stop cursor walk reads 0 overlapping pairs at 1280, 1366, 1440, 1536, 1600, 1920 and 2560 wide at TEXT SIZE 100 and 115 with 0 console errors\.$/);
    expect(findLocalPaths(why), 'a drive-letter or user-profile path').toEqual([]);
    expect(/pyrefly-scratch/i.test(why)).toBe(false);
  });

  it('under all it plays every piece but the four it holds; under `?treated=pack` (release 68) none', () => {
    setTreatedScope('all');
    expect(isTreatedChapter(OMNIS)).toBe(true);
    for (const p of TREATED_PIECES) expect(isTreatedChapter(OMNIS, p), p).toBe(!['hud', 'breath', 'cam', 'moments'].includes(p));
    setTreatedScope('pack');
    expect(isTreatedChapter(OMNIS)).toBe(false);
    for (const p of TREATED_PIECES) expect(isTreatedChapter(OMNIS, p), `${p} pack`).toBe(false);
  });
});

describe('nothing else changed: no other chapter holds the F1 HUD, no verdict took a chapter off the list, and the other hold sets are the merge\'s', () => {
  it('Chapter XII is the only chapter that holds hud', () => {
    for (const [id, rows] of Object.entries(PIECE_HOLDS)) expect(Object.prototype.hasOwnProperty.call(rows, 'hud'), id).toBe(id === OMNIS);
  });

  it('seventeen of the nineteen listed chapters stay treated (10 FFX, 7 FFX-2); Chapters XVII and XVIII stay off', () => {
    expect(Object.keys(TREATED_CHAPTERS)).toHaveLength(17);
    expect(Object.values(TREATED_CHAPTERS).filter((e) => e.game === 'ffx')).toHaveLength(10);
    expect(Object.values(TREATED_CHAPTERS).filter((e) => e.game === 'ffx2')).toHaveLength(7);
    for (const id of ['sin-fins-core', 'sin-face']) expect(Object.keys(TREATED_CHAPTERS), id).not.toContain(id);
  });

  it('Chapter IX plays its F1 HUD (the hold condition is met: 0 overlapping pairs) and holds the three it held; Chapter III holds no real, Chapter XI no look piece, Chapter V both', () => {
    expect(Object.keys(PIECE_HOLDS['yojimbo-cavern']!)).toEqual(['breath', 'cam', 'moments']);
    expect(treatedHold('yojimbo-cavern', 'hud')).toBeUndefined();
    expect(Object.keys(PIECE_HOLDS['braskas-final-aeon']!)).toEqual(['breath', 'moments']);
    expect(Object.keys(PIECE_HOLDS['ffx2-fallen-aeons']!)).toEqual(['cam', 'breath', 'moments']);
    expect(treatedHold('ffx2-fallen-aeons', 'hd2d')).toBeUndefined();
    expect(treatedHold('ffx2-fallen-aeons', 'arena')).toBeUndefined();
    expect(Object.keys(PIECE_HOLDS['ffx2-vegnagun-shuyin']!)).toEqual(['hd2d', 'arena', 'cam', 'breath', 'moments']);
  });
});

describe('the handoff note records the verdicts (docs/handoff/r72.md section 10)', () => {
  it('carries the two lanes\' verdicts, the hold row with its lift, what was not run, and the alternative for the driver', () => {
    const n = note();
    const at = n.indexOf('## 10. ');
    expect(at, 'section 10').toBeGreaterThan(0);
    const s = n.slice(at);
    for (const w of ['ship with holds', 'J-HUD-5b', '34 of 232', OMNIS, 'hud', 'Lifts when', 'Not run', 'FFX only', 'FFX-2 only', 'yojimbo-cavern', 'braskas-final-aeon', 'ffx2-fallen-aeons', 'SHIP']) {
      expect(s, w).toContain(w);
    }
    expect(s).toMatch(/delete the `hud` row/);
  });

  it('the hold condition at the top says how the read came out (IX met it, XII did not and is held)', () => {
    const top = note().slice(0, note().indexOf('## 1. '));
    expect(top).toMatch(/Status after the browser read/);
    expect(top).toMatch(/Chapter IX met it/);
    expect(top).toMatch(/Chapter XII did not/);
  });
});
