/**
 * CHAPTER XVIII (SIN'S FACE, `sin-face`): OFF THE LIST FOR RELEASE 71 (`booth-b4`, 2026-11-01), BACK ON IT SINCE `r73-fast` (2026-11-01; FFX ONLY for the chapter, a presentation change, no number of a fight changes). The file keeps its name: it is the
 * chapter's guard, and it records both halves.
 *
 * The second focused review of the release 71 candidate (`critic/reviews/4c01379d4-focused`, bundle BZBJ5-uz) held the candidate (HOLD): Chapter VIII and the Mirror Aeons chapter were fixed by the real-clips hold (0 one-frame hops over 100 px, CHK-027 PASS),
 * but Chapter XVIII still drew 17 one-frame hops over 100 px (Auron's teleport 401 px, Auron's dashes 113 to 278 px, Wakka's about 115 px, all on damage or knock-out swaps) after the real hold, against 0 on `?treated=pack` and on live (R71-C1, major, introduced,
 * a regression against live). The driver took Sin's face off `TREATED_CHAPTERS` for release 71. **r73-sinface traced the cause** (`docs/handoff/r73-sinface.md`, `tests/unit/engine/r73-sinface-trace.test.ts`): the review's run played every action after Auron's Dragon
 * Fang at the `fast` playback speed (a sub-frame tap of R1, the Bushido sequence's chip, left it there), the house strike's travel and return are compressed by the speed to 5 and 8 frames and step 0.46 and 0.25 of the reach in one frame, and today's lunge ignores the
 * speed. **r73-fast** (`docs/handoff/r73-fast.md`, `tests/unit/engine/r73-fast-floor.test.ts`) keeps the two crossings at their normal length at every speed (`StrikeCurve.crossingFloors`) and puts the chapter back.
 *
 * Game case (AGENTS.md rule 14): FFX only for the chapter (the registry says ffx); the strike fix is shared plumbing, both games.
 *
 * **The guard at the end still fails if Chapter XVIII is on the list without its reason lifted:** the day it is on, the reason is gone from `WITHDRAWN_R70` AND the handoff note (`docs/handoff/booth-b4.md`) carries a `SIN-FACE LIFT:` line that names the traced cause, says
 * `?treated=pack`, and either names an existing CHK-027 report of a run (`critic/reviews/<sha>-focused|live|deep.json`, or a lift proof `critic/reviews/r<release>-<name>.json`: `REPORT_RE` of `tools/owed-lifts.mjs`) or says the run is OWED and names the job specs (`docs/handoff/r73-fast.md`, which must exist and carry them). Since r73-fast the line says OWED: no
 * browser ran in the lane, so the run against `?treated=pack` at normal AND fast speed is the next focused review's job; the day a report exists the line names it, and this guard then reads the file.
 *
 * **OWED is a state of the TREE, never of the CUT (r73 merge review, finding 1, 2026-11-02):** the chapter was release 71's HOLD cause, and "unknown on a critical is a HOLD". A report the line names must now read CHK-027 PASS for `sin-face`
 * (`liftReportVerdict`, not only exist), and `tools/deploy-pages.mjs`'s release gate refuses while the line still says OWED or names a report that does not read PASS (`tools/owed-lifts.mjs`; `tests/unit/r73-merge-review-fixes.test.ts`).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import { PIECE_HOLDS, TREATED_CHAPTERS, TREATED_PIECES, demoGameOf, isTreatedChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { CHAPTER_LOOKS, chapterLook } from '../../src/engine/look/LookConfig.ts';
import { setProMode } from '../../src/engine/look/pro/ProSwitch.ts';
import { CUT_ANCHOR_CHAPTERS } from '../../src/engine/motion/CutAnchor.ts';
import { SCOPE_EXCEPTIONS } from '../../src/engine/motion/SwapSwitch.ts';
import { WITHDRAWN_R70, isListed } from './booth-r70-withdrawn.ts';
import { REPORT_RE, liftReportVerdict } from '../../tools/owed-lifts.mjs';

const ID = 'sin-face';
const NOTE_PATH = 'docs/handoff/booth-b4.md';
const HOLDS = ['card', 'breath', 'cam', 'moments', 'smear', 'real'] as const;

beforeEach(() => {
  setTreatedScope('all');
  setProMode('pro');
});
afterEach(() => {
  setTreatedScope(null);
  setProMode(null);
});

describe('Chapter XVIII is back on the list (r73-fast): FFX only, with its six holds', () => {
  it('is on TREATED_CHAPTERS as an FFX chapter (the registry says ffx), since r71 (the batch it first joined in), plays FFX\'s layout and tables, and is reached by the treatment under all but not under pack (the booth pair only)', () => {
    expect(TREATED_CHAPTERS[ID]).toEqual({ game: 'ffx', since: 'r71' });
    expect(getChapter(ID)?.game).toBe('ffx');
    expect(demoGameOf(ID, 'ffx2')).toBe('ffx'); // treated: its own game, whatever the fallback says
    expect(isTreatedChapter(ID)).toBe(true);
    setTreatedScope('pack');
    expect(isTreatedChapter(ID)).toBe(false);
    for (const p of TREATED_PIECES) expect(isTreatedChapter(ID, p), `${ID} ${p} pack`).toBe(false);
  });

  it('under all it plays every piece but the six it holds (card, breath, cam, moments, smear, and the real clips, which stay held), each hold with its "Lifts when"', () => {
    expect(Object.keys(PIECE_HOLDS[ID]!)).toEqual([...HOLDS]);
    for (const p of TREATED_PIECES) expect(isTreatedChapter(ID, p), p).toBe(!(HOLDS as readonly string[]).includes(p));
    for (const p of HOLDS) expect(treatedHold(ID, p), p).toMatch(/Lifts when/);
    expect(treatedHold(ID, 'real')).toMatch(/R71-C1/); // the first review's finding stays in the row
  });

  it('all nineteen listed chapters are treated since r74-fins (12 FFX, 7 FFX-2; eighteen before, Chapter XVII (sin-fins-core) the one that was not); the real-clips hold still serves VIII and the Mirror Aeons chapter, which stay on the list (r73-fast measured them and left the holds: r73-fast.md section 5)', () => {
    const treated = Object.keys(TREATED_CHAPTERS);
    expect(treated).toHaveLength(19);
    expect(treated).toContain(ID);
    expect(treated).toContain('sin-fins-core'); // r74-fins
    expect(Object.values(TREATED_CHAPTERS).filter((e) => e.game === 'ffx')).toHaveLength(12);
    expect(Object.values(TREATED_CHAPTERS).filter((e) => e.game === 'ffx2')).toHaveLength(7);
    for (const id of ['evrae-airship', 'mirror-aeons']) {
      expect(treated, id).toContain(id);
      expect(treatedHold(id, 'real'), id).toBeDefined(); // R71-C2 and R71-C3: fixed by the hold (0 hops, CHK-027 PASS)
    }
  });
});

describe('the withdrawal is history: the table is empty and the chapter is in exactly one of the two', () => {
  it('WITHDRAWN_R70 holds nothing (Chapter XVIII was its last entry), and a chapter is listed XOR withdrawn', () => {
    expect(Object.keys(WITHDRAWN_R70)).toEqual([]);
    expect(WITHDRAWN_R70[ID]).toBeUndefined();
    expect(isListed(ID) === (WITHDRAWN_R70[ID] === undefined)).toBe(true);
  });
});

describe('the rows are the ones the withdrawal kept, unread, and now read', () => {
  it('the five holds of its lane and the real-clips hold of booth-b4, in order; the rows of the pieces it did not hold stay absent', () => {
    for (const p of TREATED_PIECES) if (!(HOLDS as readonly string[]).includes(p)) expect(treatedHold(ID, p), p).toBeUndefined();
  });

  it('the look row, the swap exception, the cut-anchor row and the HUD stylesheet', () => {
    expect(CHAPTER_LOOKS[ID]).toEqual({ name: 'hd2d', strength: 'bold' });
    expect(chapterLook(ID)).toEqual({ name: 'hd2d', strength: 'bold' }); // read now: the chapter is treated and does not hold hd2d
    expect(Object.keys(SCOPE_EXCEPTIONS)).toContain(ID);
    expect(CUT_ANCHOR_CHAPTERS[ID]).toBe('on');
    expect(existsSync(resolve('src/ui/ffx/sin-hud.css'))).toBe(true);
  });
});

describe('the handoff note carries both decisions (sections 14 and 15)', () => {
  const NOTE = readFileSync(resolve(NOTE_PATH), 'utf8').replace(/\r\n/g, '\n');

  it('section 14 (the withdrawal) names the review, the finding, the numbers, the game case and the fifteen', () => {
    expect(NOTE).toMatch(/## 14\. Chapter XVIII \(Sin's face\) is off the list for release 71/);
    const section = NOTE.slice(NOTE.indexOf('## 14.'), NOTE.indexOf('## 15.'));
    expect(section).toContain('critic/reviews/4c01379d4-focused');
    expect(section).toContain('R71-C1');
    expect(section).toMatch(/17 one-frame hops over 100 px/);
    expect(section).toMatch(/401 px/);
    expect(section).toMatch(/fifteen of the nineteen/);
    expect(section).toMatch(/FFX only/);
    expect(section).toMatch(/\?treated=pack/);
  });

  it('section 15 (the return) names the traced cause, the fix, the game case, the eighteen, the holds that stay and the run that is owed', () => {
    expect(NOTE).toMatch(/## 15\. Chapter XVIII \(Sin's face\) is back on the list \(r73-fast\)/);
    const section = NOTE.slice(NOTE.indexOf('## 15.'));
    expect(section).toContain('docs/handoff/r73-sinface.md');
    expect(section).toContain('docs/handoff/r73-fast.md');
    expect(section).toMatch(/fast playback speed/);
    expect(section).toMatch(/crossingFloors/);
    expect(section).toMatch(/FFX only for the chapter/);
    expect(section).toMatch(/both games/);
    expect(section).toMatch(/[Ee]ighteen of the nineteen/);
    expect(section).toMatch(/\?treated=pack/);
    expect(section).toMatch(/normal AND fast/);
  });
});

describe('Chapter XVIII does not stay on the list without its reason lifted', () => {
  it('the day it is on the list the reason is gone from WITHDRAWN_R70 and the handoff note carries a `SIN-FACE LIFT:` line that names the traced cause, says ?treated=pack and either names an existing CHK-027 report that reads PASS or says the run is OWED and names the job specs (the cut refuses the OWED form: tools/owed-lifts.mjs); a lift line with the chapter off the list is a half-made change', () => {
    const note = readFileSync(resolve(NOTE_PATH), 'utf8').replace(/\r\n/g, '\n');
    if (!isListed(ID)) {
      expect(WITHDRAWN_R70[ID]?.why).toMatch(/Lifts when the cause of the remaining hops is traced and a CHK-027 run against \?treated=pack shows no hop the control does not have$/);
      expect(note).not.toMatch(/^SIN-FACE LIFT:/m);
      return;
    }
    expect(WITHDRAWN_R70[ID], 'a listed chapter keeps no withdrawn reason').toBeUndefined();
    const lift = note.match(/^SIN-FACE LIFT: (.*)$/m);
    expect(lift, 'the handoff note needs a "SIN-FACE LIFT: cause <what was traced>; CHK-027 <report path | OWED: jobs ... docs/handoff/<lane>.md> against ?treated=pack" line').not.toBeNull();
    expect(lift![1]).toMatch(/cause /);
    expect(lift![1]).toMatch(/\?treated=pack/);
    const report = lift![1]!.match(REPORT_RE);
    if (report) {
      const verdict = liftReportVerdict(process.cwd(), report[0], ID, 'CHK-027'); // exists AND reads CHK-027 PASS for the chapter (a report that exists and says FAIL is not a lift)
      expect(verdict.state, verdict.detail).toBe('pass');
      return;
    }
    // no report yet: the line must say the run is owed and name the job specs, and the specs must exist
    const owed = lift![1]!.match(/OWED: jobs? ([A-Z]-\d(?: to [A-Z]-\d)?)[^;]*? (docs\/handoff\/[a-z0-9-]+\.md)/);
    expect(owed, 'the line names no report, so it must say "OWED: jobs <ids> ... docs/handoff/<lane>.md"').not.toBeNull();
    expect(lift![1]).toMatch(/normal AND fast/);
    const spec = resolve(owed![2]!);
    expect(existsSync(spec), `${owed![2]} exists`).toBe(true);
    const text = readFileSync(spec, 'utf8').replace(/\r\n/g, '\n');
    expect(text, 'the specs name the job ids').toContain(owed![1]!.split(' ')[0]!);
    expect(text).toMatch(/CHK-027/);
  });
});
