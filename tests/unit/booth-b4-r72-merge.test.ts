/**
 * RELEASE 72's MERGED STATE, PINNED AS ONE TABLE (`r72`, 2026-11-01): the three lanes `r72-hud` (Chapters IX and XII back on the list, FFX only), `r72-sky` (Chapter XI plays sky grade C by default, FFX-2 only) and
 * `r72-motion` (Chapter III plays the real clips again, FFX only; the knock-out slide eases in, both games) merged onto the release 71 candidate (`booth-b4`), and the driver's decision on the other `real` holds.
 * A later edit to the list, a hold or the decision is a decision made here too. Presentation only: no number of a fight changes. Nothing deploys.
 *
 * The decision on the `real` holds (the driver's call, Bailey's word of 2026-10-31 23:40, "you make the executive decisions for the next few days"): the motion lane's fit scales a RETURN flip (Tidus, Yuna and
 * Kimahri have one in the real-snappy table; Wakka, Auron and Lulu have none) to at most Chapter I's 170 px of 900. Chapter III lifts (its hold asked for no teleport: the raw 275 px step at 462 px drawn is 165 fitted).
 * Chapters VIII, XVIII (off the list) and 27 keep theirs: their lift names no one-frame hop over 100 px, and the model of the scaled clip never reaches 100 px (Tidus 170 at every drawn size, Yuna 127 to 170, Kimahri
 * 101 to 170) and does not touch Wakka's attack-to-follow swaps (161 to 494 px) or the approach dashes (100 to 206.6 px).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CHAPTER_IDS, getChapter } from '../../src/data/encounters.ts';
import { PIECE_HOLDS, TREATED_CHAPTERS, isTreatedChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { skyGradeFor } from '../../src/engine/look/pro/SkyGrade.ts';
import { REFERENCE_CANVAS_PX, fitForStep, flipStepCap, flipStepShare, returnFitOf } from '../../src/engine/motion/FlipFit.ts';
import { realStrikeProfile } from '../../src/engine/motion/RealMotion.ts';
import { defaultPaceFactor } from '../../src/engine/motion/StrikeCurve.ts';
import { WITHDRAWN_R70 } from './booth-r70-withdrawn.ts';

beforeEach(() => setTreatedScope('all'));
afterEach(() => setTreatedScope(null));

/** The seventeen treated chapters of release 72 and the pieces each one holds (read), in the order of its row; the two not listed here (XVII, XVIII) are off. */
const MERGED: Readonly<Record<string, { readonly game: 'ffx' | 'ffx2'; readonly held: readonly string[] }>> = {
  'seymour-flux': { game: 'ffx', held: [] }, // I, the approved target
  yunalesca: { game: 'ffx', held: ['breath', 'cam', 'smear'] }, // II
  'braskas-final-aeon': { game: 'ffx', held: ['breath', 'moments'] }, // III: `real` LIFTED by r72-motion
  'ffx2-bahamut': { game: 'ffx2', held: [] }, // IV, the approved target
  'ffx2-vegnagun-shuyin': { game: 'ffx2', held: ['hd2d', 'arena', 'cam', 'breath', 'moments'] }, // V: today's sky
  'ffx2-leblanc': { game: 'ffx2', held: ['breath', 'cam', 'moments'] }, // VI
  'seymour-anima-macalania': { game: 'ffx', held: ['breath', 'cam', 'moments'] }, // VII
  'evrae-airship': { game: 'ffx', held: ['hd2d', 'arena', 'breath', 'cam', 'moments', 'real'] }, // VIII: real stays held
  'yojimbo-cavern': { game: 'ffx', held: ['breath', 'cam', 'moments'] }, // IX: back (r72-hud)
  'seymour-natus': { game: 'ffx', held: ['breath', 'cam', 'moments'] }, // X
  'ffx2-fallen-aeons': { game: 'ffx2', held: ['cam', 'breath', 'moments'] }, // XI: hd2d and arena LIFTED by r72-sky (grade C by default)
  'seymour-omnis': { game: 'ffx', held: ['hud', 'breath', 'cam', 'moments'] }, // XII: back (r72-hud), its F1 HUD held by the r72 review (J-HUD-5b)
  'ffx2-trema': { game: 'ffx2', held: ['cam', 'breath', 'moments'] }, // XIII
  'isaaru-via-purifico': { game: 'ffx', held: ['breath', 'cam', 'moments'] }, // XIV
  'ffx2-den-of-woe': { game: 'ffx2', held: ['cam', 'breath', 'moments'] }, // XV
  'ffx2-ixion-djose': { game: 'ffx2', held: ['hd2d', 'arena', 'breath', 'cam', 'moments', 'smear'] }, // XVI
  'sin-face': { game: 'ffx', held: ['card', 'breath', 'cam', 'moments', 'smear', 'real'] }, // XVIII: back on r73-fast; real stays held
  'mirror-aeons': { game: 'ffx', held: ['hd2d', 'arena', 'card', 'breath', 'cam', 'moments', 'real'] }, // 27: real stays held
  'sin-fins-core': { game: 'ffx', held: ['hd2d', 'arena', 'breath', 'cam', 'moments', 'real'] }, // XVII: joined in r74-fins (the nineteenth; the table was the release 72 merge's eighteen)
};

const heldOf = (id: string): string[] => Object.keys(PIECE_HOLDS[id] ?? {}).filter((p) => treatedHold(id, p as never) !== undefined);

describe('the merged list: seventeen of the nineteen at the merge (eighteen since r73-fast put Sin\'s face back), each with the pieces it holds', () => {
  it('is exactly the table, in the game the registry says (rule 14): 12 FFX and 7 FFX-2; every listed chapter is treated since r74-fins (Chapter XVII was the one that was not)', () => {
    expect(Object.keys(TREATED_CHAPTERS).sort()).toEqual(Object.keys(MERGED).sort());
    for (const [id, m] of Object.entries(MERGED)) {
      expect(TREATED_CHAPTERS[id]!.game, id).toBe(m.game);
      expect(getChapter(id)?.game, id).toBe(m.game);
      expect(heldOf(id), id).toEqual(m.held);
    }
    expect(Object.values(TREATED_CHAPTERS).filter((e) => e.game === 'ffx')).toHaveLength(12);
    expect(Object.values(TREATED_CHAPTERS).filter((e) => e.game === 'ffx2')).toHaveLength(7);
    expect(CHAPTER_IDS.filter((id) => !(id in TREATED_CHAPTERS)).sort()).toEqual([]);
    expect(Object.keys(WITHDRAWN_R70)).toEqual([]); // nothing is withdrawn
  });

  it('Chapters IX and XII (r72-hud, FFX only) are on the list since r71 and Chapters III and XI play the pieces the lanes lifted (the real clips; the HD-2D look and the pro arena under grade C)', () => {
    for (const id of ['yojimbo-cavern', 'seymour-omnis']) expect(TREATED_CHAPTERS[id], id).toEqual({ game: 'ffx', since: 'r71' });
    expect(isTreatedChapter('braskas-final-aeon', 'real')).toBe(true);
    expect(treatedHold('braskas-final-aeon', 'real')).toBeUndefined();
    expect(isTreatedChapter('ffx2-fallen-aeons', 'hd2d')).toBe(true);
    expect(isTreatedChapter('ffx2-fallen-aeons', 'arena')).toBe(true);
    expect(skyGradeFor('ffx2-fallen-aeons')).toBe('c');
    expect(skyGradeFor('ffx2-vegnagun-shuyin')).toBeNull(); // Chapter V keeps today's sky
  });
});

describe('the real holds after the fit: III lifted, VIII and 27 kept (XVIII off), no FFX-2 chapter holds it', () => {
  it('exactly VIII, XVIII (rows unread) and 27 hold real; each reason keeps its numbers and its lift clause and now carries the status of the fit before it', () => {
    const holders = Object.entries(PIECE_HOLDS).filter(([, rows]) => rows.real !== undefined).map(([id]) => id).sort();
    expect(holders).toEqual(['evrae-airship', 'mirror-aeons', 'sin-face', 'sin-fins-core']); // r74-fins: Chapter XVII holds it too (the same deck as VIII and XVIII)
    for (const id of holders) expect(getChapter(id)?.game, id).toBe('ffx');
    for (const id of ['evrae-airship', 'mirror-aeons']) expect(isTreatedChapter(id, 'real'), id).toBe(false);
    for (const id of holders) {
      const why = PIECE_HOLDS[id]!.real!;
      expect(why, id).toMatch(/Status at release 72 \(the merge of the motion lane, 2026-11-01\)/);
      expect(why, id).toMatch(/motion\/FlipFit\.ts/);
      expect(why, id).toMatch(/Lifts when the real clips' one-frame steps are scaled to the figure's drawn size \(the release-72 motion lane\) and a CHK-027 run of the chapter against `\?treated=pack` shows no one-frame hop over 100 px that the control does not have\.$/);
      expect(why.indexOf('Status at release 72'), id).toBeLessThan(why.indexOf('Lifts when'));
      expect(why, id).not.toMatch(/[A-Za-z]:[\\/]/); // shipped text names no local path (hold-reasons-no-local-paths)
    }
    expect(PIECE_HOLDS['evrae-airship']!.real).toMatch(/Wakka has no return flip/);
    expect(PIECE_HOLDS['mirror-aeons']!.real).toMatch(/170 px for Tidus at every drawn size from 280 to 520 px and 127 to 170 px for Yuna/);
    for (const id of Object.keys(PIECE_HOLDS)) if (getChapter(id)?.game === 'ffx2') expect(PIECE_HOLDS[id]!.real, id).toBeUndefined();
  });

  it('the offline model of the scaled clip (the numbers the status sentences quote): Tidus 170 px of 900 at every drawn size from 280 to 520, Yuna 127 to 170, Kimahri 101 to 170, never at or under 100; Wakka, Auron and Lulu have no return flip, so the fit answers undefined', () => {
    const rate = 1 / defaultPaceFactor('ffx');
    const cap = flipStepCap();
    expect(cap * REFERENCE_CANVAS_PX).toBeCloseTo(169.8, 0);
    const fitted = (artId: string, drawn: number): number => {
      const share = flipStepShare(realStrikeProfile('ffx', artId, 'snappy')!, 1, 0, rate);
      return share * drawn * fitForStep((share * drawn) / REFERENCE_CANVAS_PX, cap);
    };
    for (const d of [280, 330, 368, 420, 462, 520]) expect(fitted('tidus', d), `tidus ${d}`).toBeCloseTo(169.8, 0);
    expect(fitted('yuna', 280)).toBeCloseTo(127, 0);
    expect(fitted('yuna', 520)).toBeCloseTo(169.8, 0);
    expect(fitted('kimahri', 280)).toBeCloseTo(101, 0);
    expect(fitted('kimahri', 520)).toBeCloseTo(169.8, 0);
    for (const art of ['tidus', 'yuna', 'kimahri']) for (const d of [280, 330, 368, 420, 462, 520]) expect(fitted(art, d), `${art} ${d}`).toBeGreaterThan(100);
    for (const art of ['wakka', 'auron', 'lulu']) {
      const profile = realStrikeProfile('ffx', art, 'snappy')!;
      expect(profile.real?.returnProfile, art).toBeUndefined();
      expect(flipStepShare(profile, 1, 0, rate), art).toBe(0);
      expect(returnFitOf({ stage: {} as never }, art as never, profile, 1), art).toBeUndefined();
    }
  });
});

describe('the handoff note carries the merged state, the decision, the one browser list and the changelog lines (docs/handoff/r72.md)', () => {
  const PATH = resolve('docs/handoff/r72.md');
  const NOTE = existsSync(PATH) ? readFileSync(PATH, 'utf8').replace(/\r\n/g, '\n') : '';

  it('names the seventeen, the real-hold decision with its numbers, the job families and the game case of every line', () => {
    expect(existsSync(PATH)).toBe(true);
    for (const id of Object.keys(MERGED)) expect(NOTE, id).toContain(id);
    for (const id of ['sin-face', 'sin-fins-core']) expect(NOTE, id).toContain(id);
    expect(NOTE).toMatch(/seventeen of the nineteen/);
    for (const family of ['J-HUD', 'J-SKY', 'J-MOT', 'J-CHK', 'J-ONE']) expect(NOTE, family).toContain(family);
    for (const fact of ['169.8', '161 to 494', '100 to 206.6', 'FFX only', 'FFX-2 only', 'Both games', 'HOLD CONDITION']) expect(NOTE, fact).toContain(fact);
    expect(NOTE).not.toMatch(/[A-Za-z]:[\\/]Users/); // no local profile path
  });
});
