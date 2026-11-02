/**
 * r73-fit review fixes (the adversarial review of 486fcd4e5: 0 critical, 1 major, 9 minor; FFX only; the driver's call under Bailey's delegation of 2026-10-31, his to overturn).
 *
 *  - M1 (the major): the lane lifted the `real` rows of Chapter VIII (`evrae-airship`) and the Mirror Aeons (`mirror-aeons`) on a bar it changed. The removed rows said they lift when a CHK-027 run "shows no one-frame hop over 100 px that
 *    the control does not have"; the handoff's own predictions (RP-1, RP-2) say hops over 100 px remain (the fitted Tidus flip reads 178 to 185 px at the head, Chapter I's own size), the deep round 32b accepts "no dash over 150 px" (PR-0581)
 *    and asks that release 71 not widen the behaviour that causes them. In the Mirror Aeons the lift moves 3 of the 32 hops. So both rows are back, with the fit's status written in before the unchanged "Lifts when" clause, until a browser
 *    run (RP-1, RP-2) reads inside a bar the review brief states. Sin's face (off the list) keeps its row as before.
 *  - m1/m2/m3: the numbers the status lines quote are re-counted here from the review's own evidence (`critic/reviews/10b426248-focused`), which is tracked.
 *  - m4: the review said a rig has no `strike`; `RigActor extends PaintedActor` and inherits it, so Lulu's pace is not dead code (pinned).
 *  - m8: the lane's CONTRACT-CHANGES entry.
 *
 * Game case: FFX only (the rows are FFX chapters; rule 14). Nothing here changes a number of a fight.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import { PIECE_HOLDS, isTreatedChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { RigActor } from '../../src/engine/rig/RigActor.ts';

const ROOT = resolve(__dirname, '..', '..');
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');
afterEach(() => setTreatedScope(null));

const LIFT_CLAUSE = /Lifts when the real clips' one-frame steps are scaled to the figure's drawn size \(the release-72 motion lane\) and a CHK-027 run of the chapter against `\?treated=pack` shows no one-frame hop over 100 px that the control does not have\.$/;

describe('M1: Chapter VIII and the Mirror Aeons hold the real clips again', () => {
  it('exactly VIII, XVIII (off the list) and 27 have a `real` row, all FFX chapters; Chapter I and Chapter III play the real clips', () => {
    const holders = Object.entries(PIECE_HOLDS).filter(([, rows]) => rows.real !== undefined).map(([id]) => id).sort();
    expect(holders).toEqual(['evrae-airship', 'mirror-aeons', 'sin-face']);
    for (const id of holders) expect(getChapter(id)?.game, id).toBe('ffx');
    setTreatedScope('all');
    for (const id of ['evrae-airship', 'mirror-aeons', 'sin-face']) expect(isTreatedChapter(id, 'real'), id).toBe(false);
    for (const id of ['seymour-flux', 'braskas-final-aeon']) expect(isTreatedChapter(id, 'real'), id).toBe(true);
  });

  it('the rows keep the pieces the chapters held before them, in order, with `real` last (the earlier rows unmoved)', () => {
    expect(Object.keys(PIECE_HOLDS['evrae-airship']!)).toEqual(['hd2d', 'arena', 'breath', 'cam', 'moments', 'real']);
    expect(Object.keys(PIECE_HOLDS['mirror-aeons']!)).toEqual(['hd2d', 'arena', 'card', 'breath', 'cam', 'moments', 'real']);
  });

  it.each([
    ['evrae-airship', 'RP-1'],
    ['mirror-aeons', 'RP-2'],
  ] as const)('%s: the reason carries the r72 status, then the r73-fit status naming %s and PR-0581, then the unchanged lift clause; shipped text names no local path', (id, job) => {
    const why = treatedHold(id, 'real');
    expect(why, id).toBeDefined();
    expect(why!.indexOf('Status at release 72')).toBeGreaterThan(0);
    expect(why!.indexOf('Status at r73-fit')).toBeGreaterThan(why!.indexOf('Status at release 72'));
    expect(why!.indexOf('Lifts when')).toBeGreaterThan(why!.indexOf('Status at r73-fit'));
    expect(why).toMatch(LIFT_CLAUSE);
    expect(why).toContain(job);
    expect(why).toContain('PR-0581');
    expect(why).toMatch(/motion\/FlipFit\.ts/);
    expect(why).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(why).not.toMatch(/pyrefly-scratch|REVIEW-BROWSER/);
  });

  it("the Mirror Aeons status quotes the re-counted hops (21 of Tidus's 24 at Chapter I's own flip, the other 3, Yuna's 8) and the fit moves 3 of the 32; never '22 of'", () => {
    const why = treatedHold('mirror-aeons', 'real')!;
    expect(why).toMatch(/21 of Tidus.s 24 read 176\.4 to 178\.5 px/);
    expect(why).toMatch(/195\.1, 206\.3 and 206\.6 px/);
    expect(why).toMatch(/Yuna.s 8 \(117\.5 to 136 px\)/);
    expect(why).toMatch(/moves 3 of the 32/);
    expect(why).not.toMatch(/22 of/);
  });

  it("Chapter VIII's status quotes the model's reading of the fitted Tidus flip (164 feet, 185 head against Chapter I's 166 and 178) and Wakka's 494 px to 164", () => {
    const why = treatedHold('evrae-airship', 'real')!;
    expect(why).toMatch(/494 px to 164/);
    expect(why).toMatch(/164 px at the feet and 185 at the head \(Chapter I: 166 and 178\)/);
    expect(why).toMatch(/Status at release 72[\s\S]*Wakka has no return flip/); // the r72 sentence is kept as written
  });
});

describe('the evidence the status lines quote (the release 71 focused review of 10b426248, tracked in critic/reviews)', () => {
  const load = (chapter: string): Array<{ px: number; figure: string; kind: string; atSwap: boolean; relPx: number; part: string }> => {
    const rel = `critic/reviews/10b426248-focused/continuity/${chapter}-win-10b426248/continuity/continuity.json`;
    expect(existsSync(resolve(ROOT, rel)), rel).toBe(true);
    return (JSON.parse(read(rel)) as { jerks: Array<{ px: number; figure: string; kind: string; atSwap: boolean; relPx: number; part: string }> }).jerks;
  };

  it('Mirror Aeons: 32 dash hops of 100 px or more, 24 of Tidus (21 at 176.4 to 178.5, the other three at 195.1, 206.3 and 206.6) and 8 of Yuna (117.5 to 136)', () => {
    const dashes = load('mirror-aeons').filter((j) => j.px >= 100 && j.kind === 'dash');
    expect(dashes).toHaveLength(32);
    const tidus = dashes.filter((j) => j.figure === 'tidus').map((j) => j.px).sort((a, b) => a - b);
    const yuna = dashes.filter((j) => j.figure === 'yuna').map((j) => j.px).sort((a, b) => a - b);
    expect(tidus).toHaveLength(24);
    expect(tidus.filter((p) => p >= 176.4 && p <= 178.5)).toHaveLength(21);
    expect(tidus.filter((p) => p > 190)).toEqual([195.1, 206.3, 206.6]);
    expect(yuna).toHaveLength(8);
    expect(Math.min(...yuna)).toBe(117.5);
    expect(Math.max(...yuna)).toBe(136);
  });

  it("Chapter VIII: Tidus's 3 dashes (233.9 to 234.9 px, feet) are the flip; his swaps of 181.3, 180.2, 180.2 px and Kimahri's 123.9 and 115.5 px are pose-swap registration (relPx over 100: the figure's parts move against each other, where a rigid flip step reads under 10), not a return", () => {
    const jerks = load('evrae-airship').filter((j) => j.px >= 100);
    const dashes = jerks.filter((j) => j.figure === 'tidus' && j.kind === 'dash');
    expect(dashes.map((j) => j.px).sort()).toEqual([233.9, 234.8, 234.9]);
    for (const j of dashes) expect(j.relPx, `flip ${j.px}`).toBeLessThan(10);
    const swaps = jerks.filter((j) => j.atSwap && ((j.figure === 'tidus' && j.px > 180 && j.px < 182) || (j.figure === 'kimahri' && j.px > 115)));
    expect(swaps).toHaveLength(5);
    for (const j of swaps) expect(j.relPx, `${j.figure} ${j.px}`).toBeGreaterThan(100);
  });

  it("Wakka's 18 swap hops in Chapter VIII (493.9 down to 141.8 px) are the other half of the finding the pace answers", () => {
    const wakka = load('evrae-airship').filter((j) => j.px >= 100 && j.figure === 'wakka');
    expect(wakka).toHaveLength(18);
    expect(Math.max(...wakka.map((j) => j.px))).toBe(493.9);
    expect(wakka.every((j) => j.atSwap && j.kind === 'swap')).toBe(true);
  });
});

describe('m4: a rig inherits the strike (Lulu, a rig in all three chapters of the review, takes the pace when she attacks)', () => {
  it('RigActor does not define strike but inherits PaintedActor\'s, so CurveBeats.startAttackMove asks it for a strike with the plan\'s returnPace', () => {
    expect(Object.prototype.hasOwnProperty.call(RigActor.prototype, 'strike')).toBe(false);
    expect(typeof (RigActor.prototype as unknown as { strike?: unknown }).strike).toBe('function');
  });
});

describe('m8 and the handoff', () => {
  it("docs/CONTRACT-CHANGES.md carries the lane's entry, in the shape of r72's (returnPace, setReturnPace, FFX only, tests), above r72's", () => {
    const text = read('docs/CONTRACT-CHANGES.md');
    const at = text.indexOf('Lane r73-fit');
    expect(at).toBeGreaterThan(0);
    expect(at).toBeLessThan(text.indexOf('Lane r72 '));
    const entry = text.slice(at, text.indexOf('\n## ', at + 10));
    expect(entry).toContain('StrikePlan.returnPace');
    expect(entry).toContain('StrikeRun.setReturnPace');
    expect(entry).toMatch(/FFX only/);
    expect(entry).toContain('booth-b4-r73-review-fixes.test.ts');
  });

  it("the handoff has the review's section, counts the Mirror's Tidus hops as 21 plus 3 (never 22), and does not call Wakka's 494 px a measurement of the model", () => {
    const text = read('docs/handoff/r73-fit.md');
    expect(text).toMatch(/## 9\. The adversarial review/);
    expect(text).not.toMatch(/22 of (its|the) 24/);
    expect(text).toMatch(/21 of (its|the) 24/);
    expect(text).toMatch(/M1/);
    for (const m of ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9']) expect(text, m).toContain(`**${m}.`);
  });
});
