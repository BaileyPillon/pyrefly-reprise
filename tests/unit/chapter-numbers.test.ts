/**
 * **No two chapters share a number** (the coordinator's check of 2026-10-10, after the hidden Leblanc preview and a second hidden experiment both took 19).
 *
 * `Chapter.number` is the board's display order and, for the hidden experiments, the only number they have (their card says EXP): two chapters on one number are
 * indistinguishable wherever the number is the key (the entry card's `chapterNumber`, the phone prep's "FFX · n"). The rule, over EVERY registered chapter (the listed
 * eighteen, the unlisted FF7 experiment, the hidden experiments):
 *
 * - the listed chapters are 1 to 18, in `CHAPTERS` order, one each;
 * - 0 means "no place on the board" and only the unlisted FF7 experiment wears it;
 * - the hidden experiments are above the eighteen and each has its own: 19 the Leblanc preview, 20 the FFX-2 Experiment, 21 Sinspawn Gui, 22 Fayth (Evrae with FFX's camera), 23 the Tourist Trap, 24 Valefor at Besaid,
 *   25 Biran and Yenke and 26 Angra Mainyu (both 2026-10-15);
 * - every number is within the type's union (`Chapter.number`), so a typo fails `tsc` before it fails here.
 *
 * **Game case: both** (shared registry plumbing).
 */
import { describe, expect, it } from 'vitest';
import { CHAPTERS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS, type Chapter } from '../../src/data/encounters.ts';

const ALL: readonly Chapter[] = [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS];

describe('chapter numbers', () => {
  it('no two registered chapters share a number (0, "no place on the board", is the one value held by the unlisted FF7 experiment alone)', () => {
    const byNumber = new Map<number, string[]>();
    for (const c of ALL) byNumber.set(c.number, [...(byNumber.get(c.number) ?? []), c.id]);
    for (const [n, ids] of byNumber) {
      if (n === 0) {
        expect(ids.sort(), 'number 0 is the FF7 experiment\'s alone').toEqual(UNLISTED_CHAPTERS.map((c) => c.id as string).sort());
      } else {
        expect(ids, `chapters on number ${n}`).toHaveLength(1);
      }
    }
  });

  it('the listed chapters are 1 to 18 in board order, and every hidden experiment is above them', () => {
    expect(CHAPTERS.map((c) => c.number)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
    for (const c of EXPERIMENT_CHAPTERS) {
      expect(c.experimental, c.id).toBe(true);
      expect(c.number, c.id).toBeGreaterThan(18);
    }
  });

  it('the known experiments keep their numbers: Leblanc 19, the FFX-2 Experiment 20, Sinspawn Gui 21, Fayth 22, the Tourist Trap 23, Valefor at Besaid 24, Biran and Yenke 25, Angra Mainyu 26', () => {
    const number = (id: string): number | undefined => EXPERIMENT_CHAPTERS.find((c) => c.id === id)?.number;
    expect(number('exp-leblanc')).toBe(19);
    expect(number('ffx2-masterpiece-theatre')).toBe(20);
    expect(number('sinspawn-gui')).toBe(21);
    expect(number('exp-fayth')).toBe(22);
    expect(number('ffx2-tourist-trap')).toBe(23);
    expect(number('ffx2-valefor-besaid')).toBe(24);
    expect(number('biran-yenke')).toBe(25);
    expect(number('ffx2-angra-mainyu')).toBe(26);
    expect(EXPERIMENT_CHAPTERS.map((c) => c.number)).not.toContain(0);
  });
});
