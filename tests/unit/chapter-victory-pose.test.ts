import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { CHAPTER_META, getChapterMeta } from '../../src/data/chapter-meta.ts';

/**
 * A-4 values (iteration 2 B5): the chapters where the sources withhold the
 * victory pose hold the battle stance instead.
 *
 * - FFX II Yunalesca (Zanarkand): "no one will pose" (research/ffx-vs-ffx2-presentation.md §2.1).
 * - FFX-2 IV Bahamut and V Shuyin: no pose after either (§2.2).
 * - FFX-2 XIII Trema: Via Infinito special boss on a first fight, our estimate (D-226, §2.2).
 *
 * Every other chapter keeps today's pose (I and IX named in the acceptance).
 */
const HOLD = new Set(['yunalesca', 'ffx2-bahamut', 'ffx2-vegnagun-shuyin', 'ffx2-trema']);

describe('A-4: victoryPose per chapter', () => {
  it('II, IV, V and XIII hold; every other chapter poses', () => {
    for (const m of CHAPTER_META) {
      expect(m.victoryPose ?? 'pose', m.id).toBe(HOLD.has(m.id) ? 'hold' : 'pose');
    }
  });

  it('I and IX still pose', () => {
    expect(getChapterMeta('seymour-flux')?.victoryPose ?? 'pose').toBe('pose');
    const ix = CHAPTER_META.find((m) => m.numeral === 'IX')!;
    expect(ix.victoryPose ?? 'pose').toBe('pose');
  });

  it('the battle screen passes the chapter value to the presenter', () => {
    const src = readFileSync('src/app/screens/BattleScreen.ts', 'utf8');
    expect(src).toMatch(/victoryPose:\s*getChapterMeta\(chapter\.id\)\?\.victoryPose/);
  });
});
