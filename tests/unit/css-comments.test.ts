/**
 * PR-0085: `npx vite build` exited 1 in lightningcss minify ("Invalid empty
 * selector") because `src/ui/ffx/ffx-hud.css` had a `/* 14 *\/`-style
 * example written as a *literal, unescaped* `/* ... *\/` pair inside the
 * body of an outer `/* ... *\/` doc comment (lines 809-822 as of d030d82).
 * CSS comments do not nest, so the inner `*\/` closed the outer comment
 * early and its remaining prose was parsed as CSS. The house convention is to
 * escape the inner example's closing slash as `*\/` (see `strategy-guide.css`,
 * `slabs.css`, `tokens.css`).
 *
 * **The check is the build's own minifier** (release 09 repair). The first
 * version of this file stripped comments by hand and looked for an unmatched
 * `)`. That caught PR-0085's exact shape and nothing else: a nested comment
 * whose leftover prose has no paren (`/* outer /* 14 *\/ prose *\/`) passed it,
 * while lightningcss rejects it ("Unexpected token Delim(/)") and the build
 * fails. So every `.css` file under `src/` now goes through
 * `lightningcss.transform({ minify: true })`, the call Vite 8 makes in
 * `minifyCSS` (node_modules/vite/dist/node/chunks/node.js) when it builds the
 * production bundle; lightningcss is a direct dependency of `vite`. A
 * control fixture of each failure shape proves the gate can see them.
 *
 * Both games: the sheets are shared plumbing (AGENTS.md rule 14, CHK-020).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'lightningcss';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = join(HERE, '..', '..', 'src');

function listCssFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listCssFiles(full));
    else if (entry.endsWith('.css')) out.push(full);
  }
  return out;
}

/**
 * What `vite build` would say about this sheet: lightningcss minify, as Vite's
 * `minifyCSS` calls it. `null` when it minifies; otherwise the message and
 * line the build would stop on.
 */
function minifyError(filename: string, source: string): string | null {
  try {
    transform({ filename, code: Buffer.from(source), minify: true });
    return null;
  } catch (e) {
    const err = e as { message?: string; loc?: { line?: number; column?: number } };
    return `${err.message ?? String(e)} at line ${err.loc?.line ?? '?'}:${err.loc?.column ?? '?'}`;
  }
}

describe('the gate sees every comment-nesting failure shape (controls)', () => {
  it('PR-0085 shape: an inner example closes the doc comment and leaves ") prose" as CSS', () => {
    const sheet = 'a { color: red; }\n/* sizes: 14 real px (/* 14 */), so 14 real px is 6.22 grid px. */\nb { color: blue; }\n';
    expect(minifyError('control-pr0085.css', sheet)).not.toBeNull();
  });

  it('no-paren shape: /* outer /* 14 */ prose */ — the case a paren count cannot see', () => {
    const sheet = 'a { color: red; }\n/* outer /* 14 */ prose here */\nb { color: blue; }\n';
    expect(minifyError('control-nested.css', sheet)).not.toBeNull();
  });

  it('the house escape (a backslash before the inner slash) minifies', () => {
    const sheet = String.raw`a { color: red; }
/* outer /* 14 *\/ prose here */
b { color: blue; }
`;
    expect(minifyError('control-escaped.css', sheet)).toBeNull();
  });
});

describe('every .css file under src/ minifies the way vite build minifies it', () => {
  const files = listCssFiles(SRC_ROOT);

  it('found the sheets to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const label = relative(SRC_ROOT, file);
    it(`${label}: lightningcss minify accepts it`, () => {
      const why = minifyError(label, readFileSync(file, 'utf8'));
      expect(
        why,
        why === null
          ? undefined
          : `${label}: ${why}. If a comment holds a literal /* ... */ example, escape its closing ` +
              String.raw`slash as *\/ (see strategy-guide.css` +
              ' or slabs.css): CSS comments do not nest.',
      ).toBeNull();
    });
  }
});
