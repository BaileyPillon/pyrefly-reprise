/**
 * CHAPTER XVIII (SIN'S FACE, `sin-face`) IS OFF THE LIST FOR RELEASE 71 (`booth-b4`, 2026-11-01; FFX ONLY, a presentation change, no number of a fight changes).
 *
 * The second focused review of the release 71 candidate (`critic/reviews/4c01379d4-focused`, bundle BZBJ5-uz) held the candidate again (HOLD): Chapter VIII and the Mirror Aeons chapter were fixed by the real-clips hold (0 one-frame hops over 100 px, CHK-027 PASS),
 * but Chapter XVIII still draws 17 one-frame hops over 100 px (Auron's teleport 401 px, Auron's dashes 113 to 278 px, Wakka's about 115 px, all on damage or knock-out swaps) after the real hold, against 0 on `?treated=pack` and on live (R71-C1, major, introduced,
 * a regression against live). The real clips are not the cause, and the cause is not traced. The driver's call: take Sin's face OFF `TREATED_CHAPTERS` for release 71 (release 71 treats FIFTEEN of the nineteen listed chapters). Its rows, holds and `sin-hud.css` stay, unread.
 *
 * Game case (AGENTS.md rule 14): FFX only. Chapter XVIII is an FFX chapter (the registry says so); no FFX-2 chapter or file changes.
 *
 * **This file also fails if Chapter XVIII is put back on the list without its reason being lifted** (the guard test at the end): while it is off, the withdrawn table must carry the reason and its lift clause as written; the day it is on, the reason is gone from that table
 * AND the handoff note carries a `SIN-FACE LIFT:` line that names the traced cause and an existing CHK-027 report of a run against `?treated=pack` that shows no hop the control does not have. Adding the line to `TREATED_CHAPTERS` alone fails here, in
 * `booth-treated-chapters.test.ts` (NOT_YET) and in the three tables that list the treated chapters.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import { PIECE_HOLDS, TREATED_CHAPTERS, TREATED_PIECES, demoGameOf, isTreatedChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { CHAPTER_LOOKS, chapterLook } from '../../src/engine/look/LookConfig.ts';
import { proArenaFor, setProMode } from '../../src/engine/look/pro/ProSwitch.ts';
import { CUT_ANCHOR_CHAPTERS } from '../../src/engine/motion/CutAnchor.ts';
import { SCOPE_EXCEPTIONS } from '../../src/engine/motion/SwapSwitch.ts';
import { WITHDRAWN_R70, isListed } from './booth-r70-withdrawn.ts';

const ID = 'sin-face';
const NOTE_PATH = 'docs/handoff/booth-b4.md';

beforeEach(() => {
  setTreatedScope('all');
  setProMode('pro');
});
afterEach(() => {
  setTreatedScope(null);
  setProMode(null);
});

describe('Chapter XVIII is off the list: release 68 plays there, under either scope', () => {
  it('is not on TREATED_CHAPTERS, answers no piece under the scope all or pack, plays no look or arena grade, and takes the caller\'s fallback for the game (not treated)', () => {
    expect(Object.keys(TREATED_CHAPTERS)).not.toContain(ID);
    for (const scope of ['all', 'pack'] as const) {
      setTreatedScope(scope);
      expect(isTreatedChapter(ID), `${ID} ${scope}`).toBe(false);
      for (const p of TREATED_PIECES) expect(isTreatedChapter(ID, p), `${ID} ${p} ${scope}`).toBe(false);
    }
    setTreatedScope('all');
    expect(chapterLook(ID)).toBeNull();
    expect(proArenaFor(ID, '')).toBe(false);
    expect(demoGameOf(ID, 'ffx2')).toBe('ffx2');
    expect(demoGameOf(ID, 'ffx')).toBe('ffx');
  });

  it('release 71 treats fifteen of the nineteen listed chapters (8 FFX, 7 FFX-2); the real-clips hold still serves the two fixed chapters of the same review, VIII and the Mirror Aeons chapter, which stay on the list', () => {
    const treated = Object.keys(TREATED_CHAPTERS);
    expect(treated).toHaveLength(15);
    expect(Object.values(TREATED_CHAPTERS).filter((e) => e.game === 'ffx')).toHaveLength(8);
    expect(Object.values(TREATED_CHAPTERS).filter((e) => e.game === 'ffx2')).toHaveLength(7);
    for (const id of ['evrae-airship', 'mirror-aeons']) {
      expect(treated, id).toContain(id);
      expect(treatedHold(id, 'real'), id).toBeDefined(); // R71-C2 and R71-C3: fixed by the hold (0 hops, CHK-027 PASS)
    }
  });
});

describe('the withdrawal is written down: the reason, the numbers and what lifts it', () => {
  const w = WITHDRAWN_R70[ID];

  it('Chapter XVIII is in WITHDRAWN_R70 as an FFX chapter (rule 14: the registry says ffx), and nothing else changed game', () => {
    expect(w).toBeDefined();
    expect(w!.game).toBe('ffx');
    expect(getChapter(ID)?.game).toBe('ffx');
    expect(Object.keys(WITHDRAWN_R70)).toEqual(['yojimbo-cavern', 'seymour-omnis', ID]);
  });

  it('the reason names the review, the finding, the measured hops, the control and the lift, in the form the NOT_YET table reads', () => {
    const why = w!.why;
    expect(why).toMatch(/^FFX: out of release 71 \(r71 verdict, the second focused review of 4c01379d4, R71-C1\): /);
    expect(why).toMatch(/with the real clips held, 17 one-frame hops over 100 px remain on the deck/);
    expect(why).toMatch(/Auron's teleport 401 px/);
    expect(why).toMatch(/Auron's dashes 113 to 278 px/);
    expect(why).toMatch(/Wakka's about 115 px/);
    expect(why).toMatch(/on damage or knock-out swaps/);
    expect(why).toMatch(/against 0 on `\?treated=pack` and on live/);
    expect(why).toMatch(/a major, introduced, a regression against live/);
    expect(why).toMatch(/the real clips are not the cause and the cause is not traced/);
    expect(why).toMatch(/its rows and holds stay, unread/);
    expect(why).toMatch(/Lifts when the cause of the remaining hops is traced and a CHK-027 run against \?treated=pack shows no hop the control does not have$/);
  });
});

describe('the rows stay in the tree, unread, so one line on the list puts the chapter back', () => {
  it('the five holds of its lane and the real-clips hold of booth-b4 stay in PIECE_HOLDS, in order, each with its "Lifts when"; the rows of the pieces it did not hold stay absent', () => {
    expect(Object.keys(PIECE_HOLDS[ID]!)).toEqual(['card', 'breath', 'cam', 'moments', 'smear', 'real']);
    for (const p of ['card', 'breath', 'cam', 'moments', 'smear', 'real'] as const) expect(treatedHold(ID, p), p).toMatch(/Lifts when/);
    for (const p of TREATED_PIECES) if (!['card', 'breath', 'cam', 'moments', 'smear', 'real'].includes(p)) expect(treatedHold(ID, p), p).toBeUndefined();
    expect(treatedHold(ID, 'real')).toMatch(/R71-C1/); // the first review's finding stays in the row; the second review's is in the withdrawn table
  });

  it('the look row, the swap exception, the cut-anchor row and the HUD stylesheet stay', () => {
    expect(CHAPTER_LOOKS[ID]).toEqual({ name: 'hd2d', strength: 'bold' });
    expect(Object.keys(SCOPE_EXCEPTIONS)).toContain(ID);
    expect(CUT_ANCHOR_CHAPTERS[ID]).toBe('on');
    expect(existsSync(resolve('src/ui/ffx/sin-hud.css'))).toBe(true);
  });
});

describe('the handoff note carries the decision (section 14)', () => {
  const NOTE = readFileSync(resolve(NOTE_PATH), 'utf8').replace(/\r\n/g, '\n');

  it('names the review, the finding, the numbers, the game case and the fifteen', () => {
    expect(NOTE).toMatch(/## 14\. Chapter XVIII \(Sin's face\) is off the list for release 71/);
    const section = NOTE.slice(NOTE.indexOf('## 14.'));
    expect(section).toContain('critic/reviews/4c01379d4-focused');
    expect(section).toContain('R71-C1');
    expect(section).toMatch(/17 one-frame hops over 100 px/);
    expect(section).toMatch(/401 px/);
    expect(section).toMatch(/fifteen of the nineteen/);
    expect(section).toMatch(/FFX only/);
    expect(section).toMatch(/\?treated=pack/);
  });
});

describe('Chapter XVIII does not come back without its reason lifted', () => {
  it('while it is off the list the reason stands as written; the day it is on the list the reason is gone from WITHDRAWN_R70 and the handoff note carries a `SIN-FACE LIFT:` line that names the traced cause and an existing CHK-027 report against ?treated=pack', () => {
    const note = readFileSync(resolve(NOTE_PATH), 'utf8').replace(/\r\n/g, '\n');
    if (!isListed(ID)) {
      expect(WITHDRAWN_R70[ID]?.why).toMatch(/Lifts when the cause of the remaining hops is traced and a CHK-027 run against \?treated=pack shows no hop the control does not have$/);
      expect(note).not.toMatch(/^SIN-FACE LIFT:/m); // a lift line with the chapter still off the list is a half-made change
      return;
    }
    expect(WITHDRAWN_R70[ID], 'a listed chapter keeps no withdrawn reason').toBeUndefined();
    const lift = note.match(/^SIN-FACE LIFT: (.*)$/m);
    expect(lift, 'the handoff note needs a "SIN-FACE LIFT: cause <what was traced>; CHK-027 critic/reviews/<sha>-focused.json against ?treated=pack, 0 hops the control lacks" line').not.toBeNull();
    expect(lift![1]).toMatch(/cause /);
    expect(lift![1]).toMatch(/\?treated=pack/);
    const report = lift![1]!.match(/critic\/reviews\/[0-9a-f]{7,40}-(?:focused|live|deep)\.json/);
    expect(report, 'the line names the report').not.toBeNull();
    expect(existsSync(resolve(report![0])), `${report![0]} exists`).toBe(true);
  });

  it('the guard reads the live list: removing the chapter from WITHDRAWN_R70 while it is off, or adding it to TREATED_CHAPTERS while it is withdrawn, is a failure of this file or of booth-treated-chapters.test.ts', () => {
    expect(isListed(ID) === (WITHDRAWN_R70[ID] === undefined)).toBe(true); // listed XOR withdrawn: exactly one table holds it
  });
});
