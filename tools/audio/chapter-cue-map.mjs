/**
 * The chapter cue map in `docs/audio/THEMES.md` ("## The chapter cue map"),
 * read and checked against the chapters' `music` records (PR-0099).
 *
 * The cue map above it is per cue; this one is per chapter, so a chapter that
 * borrows another chapter's cue is written down as a stand-in or a choice,
 * with the cue it is owed and the decision that owes it (D-209: a stand-in
 * never counts as finished). `themes-audit.mjs` fails a chapter with no row,
 * or whose Scene, Battle or Victory cells differ from `src/data`.
 *
 * Game case: both (rows for the chapters of both games; each row names its game).
 */

const HEADING = '## The chapter cue map';

/** Backticked names in a cell, in order. `none` (unticked) reads as an empty list. */
function ticks(cell) {
  return [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
}

/**
 * @param {string} markdown THEMES.md
 * @returns {Array<{ numeral: string, id: string, game: string, scene: string[], battle: string[], victory: string[], status: string, owed: string }>}
 */
export function parseChapterCueMap(markdown) {
  const start = markdown.indexOf(HEADING);
  if (start < 0) return [];
  const after = markdown.slice(start + HEADING.length);
  const end = after.search(/\n## /);
  const section = end < 0 ? after : after.slice(0, end);
  const rows = [];
  for (const line of section.split(/\r?\n/)) {
    if (!line.startsWith('|') || /^\|\s*-/.test(line) || /^\|\s*Ch\s*\|/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 8) continue;
    const [numeral, chapter, game, scene, battle, victory, status, owed] = cells;
    const id = ticks(chapter)[0];
    if (!id) continue;
    rows.push({
      numeral,
      id,
      game,
      scene: ticks(scene),
      battle: ticks(battle),
      victory: ticks(victory),
      status,
      owed,
    });
  }
  return rows;
}

const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * @param {ReadonlyArray<{ id: string, game: string, music: { scene?: string, battle?: string, phase2?: string, victory?: string } }>} chapters
 * @param {ReturnType<typeof parseChapterCueMap>} rows
 * @returns {Array<{ id: string, problem: string }>}
 */
export function auditChapterCueMap(chapters, rows) {
  const failures = [];
  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const chapter of chapters) {
    const row = byId.get(chapter.id);
    if (!row) {
      failures.push({ id: chapter.id, problem: 'no row in THEMES.md "The chapter cue map"' });
      continue;
    }
    const m = chapter.music ?? {};
    const want = {
      scene: m.scene ? [m.scene] : [],
      battle: [m.battle, m.phase2].filter(Boolean),
      victory: m.victory ? [m.victory] : [],
    };
    const wrong = [];
    for (const key of /** @type {const} */ (['scene', 'battle', 'victory'])) {
      if (!same(row[key], want[key])) wrong.push(`${key}: map says ${row[key].join(', ') || 'none'}, the chapter plays ${want[key].join(', ') || 'none'}`);
    }
    const game = chapter.game === 'ffx2' ? 'FFX-2' : 'FFX';
    if (row.game !== game) wrong.push(`game: map says ${row.game}, the chapter is ${game}`);
    if (wrong.length) failures.push({ id: chapter.id, problem: wrong.join('; ') });
  }
  const known = new Set(chapters.map((c) => c.id));
  for (const row of rows) {
    if (!known.has(row.id)) failures.push({ id: row.id, problem: 'row for a chapter that is not listed' });
  }
  return failures;
}
