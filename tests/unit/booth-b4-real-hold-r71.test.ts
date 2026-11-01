/**
 * THE REAL-CLIPS HOLD OF CHAPTERS VIII, XVIII AND THE MIRROR AEONS (`booth-b4`, 2026-11-01; FFX only, a presentation hold, no number of a fight changes).
 *
 * The focused review of the release 71 candidate 10b426248 (`critic/reviews/10b426248-focused`) held the candidate (HOLD) for one-frame figure hops over 100 px that `?treated=pack` does not have:
 *   R71-C1 Chapter XVIII (`sin-face`): 28 hops of 166 to 530 px (Auron's attack-to-follow swaps, Wakka's and Auron's dashes);
 *   R71-C2 Chapter VIII (`evrae-airship`): 13 Wakka attack-to-follow swap hops of 161 to 494 px, one on a knock-out;
 *   R71-C3 the Mirror Aeons chapter (`mirror-aeons`): 32 Tidus and Yuna dash hops of 100 to 206.6 px.
 * Chapter III was fixed by holding `real` (the real-clip piece read by `CurvesSwitch.realKind()`, `booth-b4-real-hold.test.ts`); the same row is appended to these three. The house curves play there, which is what
 * `?curves=new` plays (`curvesOn()` stays true); Chapter I keeps its real clips. R71-C4 (Chapter XVI, FFX-2, two polish hops of 114 and 134 px) is not held: it is disclosed, and this file pins that no FFX-2 chapter holds `real`.
 *
 * Game case (AGENTS.md rule 14): FFX only. All three are FFX chapters (the registry and `TREATED_CHAPTERS` say so); FFX-2's Chapter IV is the approved target and Chapter XVI plays its real clips as before.
 *
 * Each test fails without the rows: take `real` out of a chapter's hold and its first case answers true.
 *
 * **Chapter XVIII (`sin-face`) was then taken OFF the list for release 71** (the second focused review, `critic/reviews/4c01379d4-focused`, R71-C1: 17 hops over 100 px remain after the hold, against 0 on `?treated=pack`; `booth-b4-r71-sin-face-off.test.ts`). Its row stays, unread: the cases that
 * need the chapter on the list (`itIf`) skip while it is off and turn on, with no edit, the day one line puts it back; the row's own text is still pinned.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { PIECE_HOLDS, TREATED_CHAPTERS, isTreatedChapter, setDemoChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { curvesOn, inDemoChapter, realKind, setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { realProfileOf, realRecoilMs } from '../../src/engine/motion/RealBeats.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { WITHDRAWN_R70, isListed, itIf } from './booth-r70-withdrawn.ts';

const I = 'seymour-flux';
const IV = 'ffx2-bahamut';
const XVI = 'ffx2-ixion-djose';

/** The three chapters, with the finding each row answers, the numbers its reason carries and the pieces the chapter held before the row (the row is appended after them). */
const HELD: ReadonlyArray<{ id: string; chapter: string; finding: string; numbers: readonly RegExp[]; before: readonly string[] }> = [
  { id: 'evrae-airship', chapter: 'Chapter VIII \\(Evrae\\)', finding: 'R71-C2', numbers: [/13 one-frame Wakka attack-to-follow swap hops of 161 to 494 px/, /feet at 490\.7 px/], before: ['hd2d', 'arena', 'breath', 'cam', 'moments'] },
  { id: 'sin-face', chapter: "Chapter XVIII \\(Sin's face\\)", finding: 'R71-C1', numbers: [/28 one-frame hops of 166 to 530 px/, /530\.5, 486 and 461 px/, /167 to 292 px/, /195 to 241 px/], before: ['card', 'breath', 'cam', 'moments', 'smear'] },
  { id: 'mirror-aeons', chapter: 'Chapter 27 \\(Mirror Aeons\\)', finding: 'R71-C3', numbers: [/32 one-frame dash hops of 100 to 206\.6 px/, /24 of Tidus/, /8 of Yuna/], before: ['hd2d', 'arena', 'card', 'breath', 'cam', 'moments'] },
];

/** The slice of the presenter's stage the real answers read: the art id of a combatant (Tidus, in every chapter here). */
const ctx = { stage: { artOf: (id: string) => id } } as never;

afterEach(() => {
  setTreatedScope(null);
  setDemoChapter(undefined);
  setCurvesMode(null);
});

describe.each(HELD)('$id holds the real clips (booth-b4, $finding)', ({ id, chapter, finding, numbers, before }) => {
  itIf(id)('under the scope all the chapter answers real=false and Chapter I real=true; the other pieces it did not hold still play', () => {
    setTreatedScope('all');
    expect(isTreatedChapter(id, 'real')).toBe(false);
    expect(isTreatedChapter(I, 'real')).toBe(true);
    expect(treatedHold(id, 'real')).toBeDefined();
    expect(treatedHold(I, 'real')).toBeUndefined();
    expect(inDemoChapter(id, 'real')).toBe(false);
    expect(inDemoChapter(I, 'real')).toBe(true);
    for (const p of ['hud', 'look', 'rim', 'boss', 'curves', 'feel', 'fx', 'audio', 'governor'] as const) expect(isTreatedChapter(id, p), `${id} ${p}`).toBe(!before.includes(p));
  });

  it('the row is appended after the pieces the chapter held (the earlier rows unmoved) and the chapter is an FFX one (rule 14)', () => {
    expect(Object.keys(PIECE_HOLDS[id]!)).toEqual([...before, 'real']);
    expect(getChapter(id)?.game).toBe('ffx');
    if (isListed(id)) expect(TREATED_CHAPTERS[id]).toEqual({ game: 'ffx', since: 'r71' });
    else expect(WITHDRAWN_R70[id]?.game, `${id} is off the list: withdrawn, FFX only`).toBe('ffx');
  });

  it('the reason names the finding, the measured hops, the review, the control and what lifts it, in the house shape (80 characters or more, ends in its "Lifts when" clause, no .json or .png)', () => {
    const why = treatedHold(id, 'real')!;
    expect(why.length).toBeGreaterThanOrEqual(80);
    expect(why).toMatch(new RegExp(`^FFX, ${chapter}: `));
    expect(why).toContain(finding);
    expect(why).toContain('CHK-027');
    expect(why).toContain('10b426248');
    expect(why).toContain('critic/reviews/10b426248-focused');
    expect(why).toMatch(/\?treated=pack/);
    expect(why).toMatch(/which reads 0/);
    for (const n of numbers) expect(why).toMatch(n);
    expect(why).toMatch(/Lifts when the real clips' one-frame steps are scaled to the figure's drawn size \(the release-72 motion lane\) and a CHK-027 run of the chapter against `\?treated=pack` shows no one-frame hop over 100 px that the control does not have\.$/);
    expect(why).not.toMatch(/\.json/);
    expect(why).not.toMatch(/\.png/);
  });

  itIf(id)('with the pack\'s default mode (real-snappy) the chapter plays the house curves: the curves are on, no real kind, no real profile for Tidus, no real recoil; Chapter I plays the real clip', () => {
    setTreatedScope('all');
    setCurvesMode('real-snappy');

    setDemoChapter(id);
    expect(curvesOn()).toBe(true); // `curves` is not held: what `?curves=new` plays
    expect(realKind()).toBeNull();
    expect(realProfileOf(ctx, 'tidus' as never)).toBeUndefined();
    expect(realRecoilMs(ctx, 'tidus' as never, 321)).toBe(321); // the fallback: the house recoil

    setDemoChapter(I);
    expect(curvesOn()).toBe(true);
    expect(realKind()).toBe('snappy');
    expect(realProfileOf(ctx, 'tidus' as never)).toBeDefined(); // Chapter I keeps its real clips
  });

  itIf(id)('an explicit ?curves=real is held here too, and ?curves=new answers the same as the hold: no real kind, the house curves', () => {
    setTreatedScope('all');
    setDemoChapter(id);
    setCurvesMode('real');
    expect(realKind()).toBeNull();
    expect(curvesOn()).toBe(true);
    setCurvesMode('new');
    expect(realKind()).toBeNull();
    expect(curvesOn()).toBe(true);
  });

  it('under `?treated=pack` (release 68) the chapter answers no piece at all, as before; the hold changes nothing there', () => {
    setTreatedScope('pack');
    setCurvesMode('real-snappy');
    setDemoChapter(id);
    expect(isTreatedChapter(id, 'real')).toBe(false);
    expect(curvesOn()).toBe(false);
    expect(realKind()).toBeNull();
    setDemoChapter(I);
    expect(realKind()).toBe('snappy');
  });
});

describe('only these three FFX chapters hold real', () => {
  it('the three of this file are the whole table (Chapter III held it until r72-motion lifted it: booth-b4-real-hold.test.ts); no FFX-2 chapter holds real (R71-C4, Chapter XVI, is disclosed and not held), and the booth pair plays its real clips', () => {
    const holders = Object.entries(PIECE_HOLDS).filter(([, rows]) => rows.real !== undefined).map(([id]) => id).sort();
    expect(holders).toEqual([...HELD.map((h) => h.id)].sort());
    for (const id of holders) expect(getChapter(id)?.game, id).toBe('ffx');
    setTreatedScope('all');
    expect(isTreatedChapter(XVI, 'real')).toBe(true);
    expect(isTreatedChapter(IV, 'real')).toBe(true);
    expect(isTreatedChapter(I, 'real')).toBe(true);
  });
});
