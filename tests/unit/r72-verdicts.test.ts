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
 * What this file pins: that no verdict took a chapter off the list or added a hold anywhere else, and that the handoff note records the verdicts (`docs/handoff/r72.md` section 10).
 *
 * **r74-omnis (2026-11-02, FFX only) LIFTED the one hold these verdicts added** (Chapter XII's `hud` row): the advisor card, its chip and the tip are steered clear of the target flag (`ui/ffx/flagSteer.ts`), so the F1 HUD plays in XII again. The row's text,
 * with its numbers and its "Lifts when", is kept in `docs/handoff/r74-omnis.md` section 8 and pinned by `r74-omnis-lift.test.ts`; the first block below says what the table is now.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import { PIECE_HOLDS, TREATED_CHAPTERS, TREATED_PIECES, isTreatedChapter, setTreatedScope, treatedHold, treatedHolds } from '../../src/engine/motion/DemoGate.ts';

afterEach(() => {
  setTreatedScope(null);
});

const OMNIS = 'seymour-omnis';
const note = (): string => readFileSync(resolve('docs/handoff/r72.md'), 'utf8').replace(/\r\n/g, '\n');

describe('Chapter XII holds the three pieces it held before the r72 review and plays the F1 HUD again (FFX only; the hud row of the r72 review, job J-HUD-5b, was lifted in r74-omnis)', () => {
  it('is on the list, FFX in the registry and in the table, and holds breath, cam and moments: no hud row', () => {
    expect(getChapter(OMNIS)?.game).toBe('ffx');
    expect(TREATED_CHAPTERS[OMNIS]).toEqual({ game: 'ffx', since: 'r71' });
    expect(Object.keys(PIECE_HOLDS[OMNIS]!)).toEqual(['breath', 'cam', 'moments']);
    expect(treatedHolds(OMNIS)).toEqual(['breath', 'cam', 'moments']);
    expect(treatedHold(OMNIS, 'hud')).toBeUndefined();
  });

  it('under all it plays every piece but the three it holds, the hud piece among those that play; under `?treated=pack` (release 68) none', () => {
    setTreatedScope('all');
    expect(isTreatedChapter(OMNIS)).toBe(true);
    expect(isTreatedChapter(OMNIS, 'hud')).toBe(true);
    for (const p of TREATED_PIECES) expect(isTreatedChapter(OMNIS, p), p).toBe(!['breath', 'cam', 'moments'].includes(p));
    setTreatedScope('pack');
    expect(isTreatedChapter(OMNIS)).toBe(false);
    for (const p of TREATED_PIECES) expect(isTreatedChapter(OMNIS, p), `${p} pack`).toBe(false);
  });
});

describe('nothing else changed: no chapter holds the F1 HUD now, no verdict took a chapter off the list, and the other hold sets are the merge\'s', () => {
  it("no chapter holds hud (r74-omnis lifted the only one, Chapter XII's)", () => {
    for (const [id, rows] of Object.entries(PIECE_HOLDS)) expect(Object.prototype.hasOwnProperty.call(rows, 'hud'), id).toBe(false);
  });

  it('eighteen of the nineteen listed chapters are treated at release 73 (11 FFX, 7 FFX-2): no r72 verdict took a chapter off, r73-fast put Chapter XVIII back (release 72 had seventeen, 10 FFX), and Chapter XVII stays off', () => {
    expect(Object.keys(TREATED_CHAPTERS)).toHaveLength(18);
    expect(Object.values(TREATED_CHAPTERS).filter((e) => e.game === 'ffx')).toHaveLength(11);
    expect(Object.values(TREATED_CHAPTERS).filter((e) => e.game === 'ffx2')).toHaveLength(7);
    expect(Object.keys(TREATED_CHAPTERS)).not.toContain('sin-fins-core');
    expect(Object.keys(TREATED_CHAPTERS)).toContain('sin-face'); // r73-fast (docs/handoff/r73-fast.md): the house strike's crossings keep their length at fast, so the chapter's hops are gone in the model; the CHK-027 run is owed (docs/handoff/r73.md)
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
