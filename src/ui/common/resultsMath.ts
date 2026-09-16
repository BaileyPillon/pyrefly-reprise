/**
 * Pure formatting/selection helpers for `ResultsScreen`, kept DOM-free so they
 * are unit-testable (`tests/unit/ui-common-results.test.ts`).
 */

import { ITEMS as FFX_ITEMS } from '../../data/ffx/index.ts';
import { ITEMS as FFX2_ITEMS } from '../../data/ffx2/index.ts';

/** `mm:ss` clear time, per the results-panel convention in `visual-bible.md` §3.8. */
export function formatClearTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Tabular-figure-friendly thousands separator for gil/AP counters. */
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/**
 * Chapters whose Results screen must suppress the light victory-quip register
 * [writing-bible §5.4]: E1, E2 and E4 (Bahamut, chapter 4, suppresses the
 * *entire* flourish — see {@link isSilentResultsChapter} — this set also
 * covers it so a caller checking "should this feel grim" gets one answer).
 */
export const GRIM_CHAPTER_IDS: ReadonlySet<string> = new Set([
  'seymour-flux',
  'yunalesca',
  'ffx2-bahamut',
]);

export function isGrimChapter(chapterId: string): boolean {
  return GRIM_CHAPTER_IDS.has(chapterId);
}

/**
 * Chapter 4 (Bahamut) uniquely suppresses the entire results flourish — no
 * victory pose, no fanfare, no quips [writing-bible §5.4, `dsl.ts` `ResultsStep.silent`].
 */
export function isSilentResultsChapter(chapterId: string): boolean {
  return chapterId === 'ffx2-bahamut';
}

/**
 * Pick one line from a chapter's `victoryQuips[memberId]` list. Deterministic
 * by default (index 0) so the screenshot tool and e2e stay byte-stable;
 * pass a different `index` (e.g. a battle-seeded roll) for variety.
 */
export function pickVictoryQuip(lines: readonly string[] | undefined, index = 0): string | undefined {
  if (!lines || lines.length === 0) return undefined;
  const i = ((index % lines.length) + lines.length) % lines.length;
  return lines[i];
}

/** Whether `timeMs` beats the previously recorded best (or there was none). */
export function isNewBest(previousBestMs: number | null, timeMs: number): boolean {
  return previousBestMs === null || timeMs < previousBestMs;
}

/**
 * FFX credits full AP to every active party member on a win, not a split of
 * a pool [visual-bible §3.8's results-panel example: every row reads the same
 * `AP +36`]. This just fans `result.ap` out to the given member ids.
 */
export function apPerMember(totalAp: number, memberIds: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of memberIds) out[id] = totalAp;
  return out;
}

/**
 * A drop's display name: the registries first (both games'), then a
 * title-cased id. The results ledger sets these as a printed list
 * ("Elixir, Level 3 Key Sphere"), so a raw `level-3-key-sphere` would show.
 */
export function itemLabel(itemId: string): string {
  const def = FFX_ITEMS[itemId] ?? FFX2_ITEMS[itemId];
  if (def) return def.name;
  return itemId
    .split('-')
    .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}
