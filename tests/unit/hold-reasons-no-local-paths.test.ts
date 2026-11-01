/**
 * THE HOLD REASONS CARRY NO LOCAL PATH (release 71, after the build privacy gate refused the deploy of 0804dc482; both games, shared plumbing;
 * tests only).
 *
 * `PieceHolds.PIECE_HOLDS` and `PieceHoldsLast.LAST_HOLDS` are runtime strings, not comments: `treatedHold` returns each reason, so the text is
 * bundled into the production build (`EyeCandy-*.js`, `worker-*.js`) and served from a public site. Braska's `real` reason named the folder of the
 * live gap pass on the build PC (a drive-letter path), and `tools/dist-local-paths.mjs --dir dist-release` refused the build for it. A comment
 * is stripped by the minifier and may name a folder; a reason may not. This reads every reason of both tables and fails on
 *   - a drive-letter path or a user-profile path (the gate's own rule, `findLocalPaths`, so the two never disagree about what a path is),
 *   - the build PC's scratch folder by name (`pyrefly-scratch`), which a reason can name without a drive letter in front of it,
 *   - a link to claude.ai (`findPrivateLinks`, the gate's `link` kind).
 * A reason points at a handoff note under `docs/` or a test, never at a folder outside the repository.
 */
import { describe, expect, it } from 'vitest';
import { PIECE_HOLDS } from '../../src/engine/motion/PieceHolds.ts';
import { LAST_HOLDS } from '../../src/engine/motion/PieceHoldsLast.ts';
import { findLocalPaths, findPrivateLinks } from '../../tools/dist-local-paths.mjs';

type Table = Readonly<Record<string, Readonly<Partial<Record<string, string>>>>>;

/** Every `[chapter id, piece, reason]` of a table. */
const rowsOf = (table: Table): [string, string, string][] =>
  Object.entries(table).flatMap(([id, pieces]) =>
    Object.entries(pieces).map(([piece, reason]): [string, string, string] => [id, piece, reason ?? '']),
  );

/** What is wrong with a reason, as short kinds (never the matched text, so a failure message does not repeat a path). */
function problemsOf(reason: string): string[] {
  const out: string[] = [];
  for (const hit of findLocalPaths(reason)) out.push(hit.kind);
  for (const hit of findLocalPaths(reason, { code: true })) out.push(`${hit.kind}-in-code`);
  if (/pyrefly-scratch/i.test(reason)) out.push('scratch-folder');
  if (findPrivateLinks(reason).length > 0) out.push('link');
  return [...new Set(out)];
}

describe('the written hold reasons are shipped text and name no folder of the build machine', () => {
  it('the guard sees what the gate refused: a drive path, the scratch folder by name and a claude.ai link', () => {
    expect(problemsOf('(live gap pass of release 70, D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps2/). Lifts when')).toEqual(
      expect.arrayContaining(['drive', 'scratch-folder']),
    );
    expect(problemsOf('see C:\\Users\\someone\\notes')).toContain('drive');
    expect(problemsOf('kept in pyrefly-scratch/2026-10-31')).toEqual(['scratch-folder']);
    expect(problemsOf('the page at https://claude.ai/artifact/abc')).toEqual(['link']);
    expect(problemsOf('(the live gap pass of release 70). Lifts when the flip is scaled; see docs/handoff/booth-b4.md section 12')).toEqual([]);
  });

  it('PIECE_HOLDS (which spreads LAST_HOLDS in) has reasons to check, and none names a local path, the scratch folder or claude.ai', () => {
    const rows = rowsOf(PIECE_HOLDS);
    expect(rows.length).toBeGreaterThan(20);
    const bad = rows.map(([id, piece, reason]) => ({ id, piece, problems: problemsOf(reason) })).filter((r) => r.problems.length > 0);
    expect(bad, `reasons that would ship a local path: ${JSON.stringify(bad)}`).toEqual([]);
  });

  it('LAST_HOLDS (the last five listed chapters, PieceHoldsLast.ts) on its own: none names a local path, the scratch folder or claude.ai', () => {
    const rows = rowsOf(LAST_HOLDS);
    expect(rows.length).toBeGreaterThan(5);
    const bad = rows.map(([id, piece, reason]) => ({ id, piece, problems: problemsOf(reason) })).filter((r) => r.problems.length > 0);
    expect(bad, `reasons that would ship a local path: ${JSON.stringify(bad)}`).toEqual([]);
  });

  it("the `real` reason of Braska's chapter (the one the gate refused; braskas-final-aeon, FFX only) cites the pass without a folder", () => {
    const reason = PIECE_HOLDS['braskas-final-aeon']?.real ?? '';
    expect(reason).toMatch(/\(the live gap pass of release 70\)\. Lifts when the flip is scaled to the figure/);
    expect(problemsOf(reason)).toEqual([]);
  });
});
