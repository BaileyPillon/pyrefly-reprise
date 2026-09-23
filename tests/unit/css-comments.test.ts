/**
 * PR-0085: `npx vite build` exited 1 in lightningcss minify ("Invalid empty
 * selector") because `src/ui/ffx/ffx-hud.css` had a `/* 14 *\/`-style
 * example written as a *literal, unescaped* `/* ... *\/` pair inside the
 * body of an outer `/* ... *\/` doc comment (lines 809-822 as of d030d82).
 *
 * CSS comments do not nest: the lexer opens a comment at `/*` and closes it
 * at the very next `*\/`, full stop. So the inner example's own closing
 * `*\/` ended the OUTER comment early, and the outer comment's remaining
 * prose (`), so 14 real px is 6.22 grid px. Both sizes below clear it. *\/`)
 * was left to be parsed as real CSS — which is not valid CSS, hence the
 * build failure. The codebase's existing convention for exactly this
 * situation (see `strategy-guide.css`, `slabs.css`, `tokens.css`) is to
 * escape the inner example's closing slash as `*\/` (backslash before the
 * slash) so it never forms a real `*\/` token.
 *
 * This test reproduces the lexer's own real (non-nesting) comment-stripping
 * rule — open at `/*`, close at the first `*\/` after that, no nesting —
 * against every `.css` file under `src/`, then checks that what is left
 * over as "real CSS" never contains an unmatched closing paren. A comment
 * that closed early because of an embedded literal example reliably leaves
 * behind stray punctuation like the `)` in PR-0085's `), so 14 real px...`
 * fragment: valid CSS never has an unmatched `)` at the top level, so a
 * negative paren-depth anywhere in the "outside comment" text is exactly
 * the PR-0085 failure class, however it gets introduced.
 *
 * No jsdom, no CSS parser: this is the same lexical, string-level approach
 * `ffx-hud-css-type-floor.test.ts` and `pause-remake-css.test.ts` use for
 * their own sheet-arithmetic checks, and deliberately mirrors the real
 * lexer's own (dumb, non-nesting) comment rule rather than reimplementing a
 * parser.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = join(HERE, '..', '..', 'src');

function listCssFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const info = statSync(full);
    if (info.isDirectory()) {
      out.push(...listCssFiles(full));
    } else if (entry.endsWith('.css')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Strips comments the way a real CSS lexer does: `/*` opens, the very next
 * `*\/` closes, no nesting. Returns the concatenation of everything that
 * lexes as real code (comments themselves are dropped, but a placeholder
 * space is kept so line numbers stay meaningful for callers that care).
 */
function stripCommentsLikeARealLexer(source: string): string {
  let out = '';
  let i = 0;
  while (i < source.length) {
    if (source.startsWith('/*', i)) {
      const close = source.indexOf('*/', i + 2);
      if (close === -1) {
        // Unterminated comment: nothing after it is code.
        break;
      }
      // Drop the comment, but keep newlines so line numbers stay aligned.
      out += source.slice(i, close + 2).replace(/[^\n]/g, ' ');
      i = close + 2;
      continue;
    }
    out += source[i];
    i += 1;
  }
  return out;
}

/**
 * Finds the line (1-based) of the first unmatched closing paren in `code`
 * (comments already stripped). A real, valid CSS file never has one: every
 * `)` pairs with an earlier `(`. A comment that closed early because of an
 * embedded literal `/* ... *\/` example reliably leaves one behind, because
 * the intended-to-stay-commented prose lands in the code stream.
 */
function findUnmatchedClosingParenLine(code: string): number | null {
  let depth = 0;
  let line = 1;
  for (const ch of code) {
    if (ch === '\n') line += 1;
    else if (ch === '(') depth += 1;
    else if (ch === ')') {
      depth -= 1;
      if (depth < 0) return line;
    }
  }
  return null;
}

describe('every .css file under src/ survives real comment lexing without a stray unmatched )', () => {
  const files = listCssFiles(SRC_ROOT);

  it('found at least one .css file to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const label = relative(SRC_ROOT, file);
    it(`${label}: no comment closes early and leaves an unmatched ")" in real CSS`, () => {
      const source = readFileSync(file, 'utf8');
      const code = stripCommentsLikeARealLexer(source);
      const offenderLine = findUnmatchedClosingParenLine(code);
      expect(
        offenderLine,
        offenderLine === null
          ? undefined
          : `${label}:${offenderLine} has an unmatched ")" once comments are stripped the way a real ` +
              'CSS lexer strips them (open at /*, close at the very next */, no nesting) — this is the ' +
              'PR-0085 failure class: a literal, unescaped /* ... */ example written inside a comment ' +
              "closed that comment early, so the comment's own remaining prose became real CSS. Escape " +
              'the inner example\'s closing slash as *\\/ instead (see strategy-guide.css or slabs.css).',
      ).toBeNull();
    });
  }
});
