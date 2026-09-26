/**
 * The chapter half of `themes-audit.mjs` (PR-0099): reads THEMES.md and the
 * chapter registry, prints one line per chapter, returns the failures. Kept
 * apart because the audit itself is over the house line limit.
 *
 * Game case: both.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { auditChapterCueMap, parseChapterCueMap } from './chapter-cue-map.mjs';

const THEMES_MD = fileURLToPath(new URL('../../docs/audio/THEMES.md', import.meta.url));

/** @param {(line: string) => void} log */
export async function chapterCueMapReport(log) {
  const { CHAPTERS } = await import('../../src/data/encounters.ts');
  const rows = parseChapterCueMap(await readFile(THEMES_MD, 'utf8'));
  const failures = auditChapterCueMap(CHAPTERS, rows);
  const failed = new Map(failures.map((f) => [f.id, f.problem]));
  log('\nchapter cue map (THEMES.md "The chapter cue map")');
  for (const chapter of CHAPTERS) {
    const row = rows.find((r) => r.id === chapter.id);
    const problem = failed.get(chapter.id);
    const standIn = row && /stand-in|choice|borrow/i.test(row.status) ? '  [borrowed; owed: see the row]' : '';
    log(`${problem ? 'FAIL' : 'ok  '} ${String(chapter.number).padStart(2)} ${chapter.id.padEnd(26)}${problem ? ` ${problem}` : standIn}`);
  }
  for (const f of failures.filter((x) => !CHAPTERS.some((c) => c.id === x.id))) log(`FAIL    ${f.id.padEnd(26)} ${f.problem}`);
  log(`${failures.length} chapter(s) depart from the chapter cue map`);
  return failures;
}
