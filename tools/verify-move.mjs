// Proof helper for a pure move: the multiset of code lines an original file (or files) had at a git revision, against the files that now hold
// that code. For a pure move, "in the original, not in the new files" must be only moved-header lines (the class line, the imports) and
// "in the new files, not in the original" only imports, doc headers, class lines and visibility words (`private` -> `protected`).
//
// It is a LINE multiset: blind to order and to which member a line sits in. The review of the split branch (docs/handoff/split.md) also compared the two sets
// member by member on the parsed syntax tree; use this one as the quick first look, not as the whole proof.
//
// Usage (from anywhere inside the repo):
//   node tools/verify-move.mjs <rev> <origPath>[,<origPath>...] <newPath>[,<newPath>...]
// e.g. node tools/verify-move.mjs e2a84fbd3 src/engine/BattlePresenter.ts src/engine/BattlePresenter.ts,src/engine/BattlePresenterBase.ts
// <origPath>s are read with `git show <rev>:<path>`; <newPath>s are read from the working tree.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const [rev, origArg, newArg] = process.argv.slice(2);
if (!rev || !origArg || !newArg) {
  console.error('usage: node tools/verify-move.mjs <rev> <origPath>[,...] <newPath>[,...]');
  process.exit(2);
}
const root = execFileSync('git', ['rev-parse', '--show-toplevel']).toString('utf8').trim();
const original = (path) => execFileSync('git', ['show', `${rev}:${path}`], { cwd: root, maxBuffer: 1 << 28 }).toString('utf8');
/** The trimmed, non-blank, non-comment-only lines of a file's text. */
const norm = (text) => text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !/^(\/\/|\/?\*+\/?)\s*$/.test(line));
const bag = (lines) => { const counts = new Map(); for (const line of lines) counts.set(line, (counts.get(line) ?? 0) + 1); return counts; };

const orig = bag(origArg.split(',').flatMap((path) => norm(original(path))));
const next = bag(newArg.split(',').flatMap((path) => norm(readFileSync(join(root, path), 'utf8'))));
const lost = [];
const gained = [];
for (const [line, n] of orig) { const k = next.get(line) ?? 0; if (k < n) lost.push([n - k, line]); }
for (const [line, n] of next) { const k = orig.get(line) ?? 0; if (k < n) gained.push([n - k, line]); }
const show = (title, rows) => {
  console.log(`--- ${title} (${rows.reduce((sum, [n]) => sum + n, 0)} lines)`);
  for (const [n, line] of rows) console.log(`${n > 1 ? `${n}x ` : ''}${line.length > 170 ? `${line.slice(0, 170)}...` : line}`);
};
show('in the original, not in the new files', lost);
show('in the new files, not in the original', gained);
