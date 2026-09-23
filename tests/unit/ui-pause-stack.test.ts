/**
 * Guards the stacking-context fix in `ef9f0670` (see `pause-screen.css`'s own
 * comment on `.pause`'s `z-index: 999`, and `tests/unit/ui-enemy-intent.test.ts`'s
 * header for the half of this story a DOM test proves).
 *
 * The mechanism: `App.makeScreenRoot`'s `.screen` div (every screen's root,
 * including the pause screen's) carries no `z-index` of its own and opens no
 * stacking context, so it sits in `#ui`'s context at the auto/0 tier. Any
 * battle overlay anywhere in the tree with an explicit *positive* `z-index` —
 * `.eint`'s 2, `.mad`'s 4, a damage numeral's 3-40, `.coach-brief`'s 90 — is
 * promoted past that tier and paints over the pause screen, in DOM order or
 * not, because both compete in the same stacking context. Rather than chase
 * and suspend every overlay one at a time, the fix gives `.pause` itself an
 * explicit `z-index` higher than anything else in the codebase, so it wins
 * that same competition instead of losing it by default.
 *
 * That only holds as long as two things stay true, so this file checks both:
 *
 *  1. `.pause`'s `z-index` really is the highest explicit value anywhere in
 *     `src/` (and `index.html`) — the next overlay that picks a bigger number
 *     than 999 silently reopens the bug this commit closed.
 *  2. `.screen` (the pause root's parent) still opens no stacking context of
 *     its own — a `z-index`, `opacity`, `transform`, or any other
 *     context-opening property added there would put `.pause`'s 999 back
 *     inside a *new* context no longer competing with the overlays at all,
 *     which breaks the fix just as surely as a bigger number would.
 *
 * Both games share `pause-screen.css`, `App.ts`, `MoveAdvisor.ts`,
 * `EnemyIntent.ts` and `DamageNumbers.ts`, so this is a shared-plumbing test
 * (AGENTS.md rule 14): it applies to FFX and FFX-2 alike.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = join(HERE, '..', '..');
const PAUSE_CSS = join(REPO_ROOT, 'src', 'ui', 'common', 'pause-screen.css');
const APP_TS = join(REPO_ROOT, 'src', 'app', 'App.ts');

/** Block comments removed but line count preserved, so reported line numbers stay honest. */
function stripBlockComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ''));
}

/** `zIndex` / `mixBlendMode` -> the CSS property spelling: `z-index` / `mix-blend-mode`. */
function kebab(camel: string): string {
  return camel.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/** `.pause { ... }` (exactly that selector, not `.pause__x` / `.pause--x`). */
function pauseBlock(sheet: string): string {
  const clean = stripBlockComments(sheet);
  const bodies = [...clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((m) => m[1]!.trim().replace(/\s+/g, ' ') === '.pause')
    .map((m) => m[2]!);
  expect(bodies.length, 'no rule block with selector exactly .pause').toBeGreaterThan(0);
  return bodies.join('\n');
}

interface ZHit {
  readonly file: string;
  readonly line: number;
  readonly value: number;
}

/** Every `*.css` / `*.ts` file under `src/`, walked recursively. */
function collectSourceFiles(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectSourceFiles(full, out);
    else if (entry.name.endsWith('.css') || entry.name.endsWith('.ts')) out.push(full);
  }
}

/** Every explicit numeric z-index (CSS, CSS-in-template-string, or an inline `zIndex=`) in one file. */
function zHitsInFile(path: string): ZHit[] {
  const raw = readFileSync(path, 'utf8');
  let clean = stripBlockComments(raw);
  if (path.endsWith('.ts')) clean = clean.replace(/\/\/.*$/gm, '');
  const rel = path.slice(REPO_ROOT.length + 1).replace(/\\/g, '/');
  const hits: ZHit[] = [];
  clean.split('\n').forEach((lineText, i) => {
    for (const m of lineText.matchAll(/z-index\s*:\s*(-?\d+)/g)) {
      hits.push({ file: rel, line: i + 1, value: Number.parseInt(m[1]!, 10) });
    }
    for (const m of lineText.matchAll(/zIndex\s*=\s*['"]?(-?\d+)/g)) {
      hits.push({ file: rel, line: i + 1, value: Number.parseInt(m[1]!, 10) });
    }
    // Object-literal style, e.g. `Object.assign(el.style, { zIndex: '40' })`.
    for (const m of lineText.matchAll(/zIndex\s*:\s*['"]?(-?\d+)/g)) {
      hits.push({ file: rel, line: i + 1, value: Number.parseInt(m[1]!, 10) });
    }
    // `el.style.setProperty('z-index', '40')`.
    for (const m of lineText.matchAll(/setProperty\(\s*['"]z-index['"]\s*,\s*['"]?(-?\d+)/g)) {
      hits.push({ file: rel, line: i + 1, value: Number.parseInt(m[1]!, 10) });
    }
  });
  return hits;
}

function fullInventory(): ZHit[] {
  const files: string[] = [];
  collectSourceFiles(join(REPO_ROOT, 'src'), files);
  files.push(join(REPO_ROOT, 'index.html'));
  return files.flatMap((f) => zHitsInFile(f));
}

/**
 * `makeScreenRoot`'s body, found by a brace-depth walk (no nested-brace parser
 * needed for one method). Matches the *definition* — `name(...): ReturnType {`
 * — rather than the first textual occurrence of `name(`, because `App.ts`
 * calls `this.makeScreenRoot(screen.name)` from `push()` well before the
 * method is declared further down the file; a plain `indexOf` would read the
 * call site's own enclosing method instead.
 */
function methodBody(source: string, name: string): string {
  const defRe = new RegExp(`${name}\\s*\\([^)]*\\)\\s*:\\s*[^{;]+\\{`);
  const match = defRe.exec(source);
  expect(match, `could not find a ${name}(...): ReturnType { definition`).not.toBeNull();
  const braceStart = match!.index + match![0].length - 1;
  let depth = 0;
  let i = braceStart;
  for (; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  return source.slice(braceStart + 1, i);
}

const PAUSE_SHEET = readFileSync(PAUSE_CSS, 'utf8');
const APP_SOURCE = readFileSync(APP_TS, 'utf8');

describe('the pause root sits above every other z-index in the codebase', () => {
  const pauseBody = pauseBlock(PAUSE_SHEET);

  it('.pause declares position: fixed, pointer-events: auto, and a numeric z-index', () => {
    expect(pauseBody).toMatch(/position:\s*fixed;/);
    expect(pauseBody).toMatch(/pointer-events:\s*auto;/);
    expect(pauseBody).toMatch(/z-index:\s*-?\d+;/);
  });

  const pauseZMatch = pauseBody.match(/z-index:\s*(-?\d+);/);
  const pauseZ = Number.parseInt(pauseZMatch?.[1] ?? 'NaN', 10);

  it('finds a real, non-trivial inventory of z-index declarations to compare against', () => {
    const inventory = fullInventory();
    expect(inventory.length).toBeGreaterThan(30);
    const anchor = (file: string, value: number) =>
      inventory.some((h) => h.file.endsWith(file) && h.value === value);
    expect(anchor('src/ui/common/move-advisor.css', 4), 'move-advisor.css z-index: 4').toBe(true);
    expect(anchor('src/ui/coach/coach.css', 90), 'coach.css z-index: 90').toBe(true);
  });

  it('pauseZ beats every other explicit z-index in src/ and index.html', () => {
    const inventory = fullInventory().filter(
      (h) => !(h.file.endsWith('src/ui/common/pause-screen.css') && h.value === pauseZ),
    );
    const offenders = inventory
      .filter((h) => h.value >= pauseZ)
      .map((h) => `${h.file}:${h.line} = ${h.value}`);
    expect(offenders, 'the pause z-index must be strictly higher than every other one').toEqual([]);
  });
});

describe('the .screen root opens no stacking context of its own', () => {
  const body = methodBody(APP_SOURCE, 'makeScreenRoot');

  // Any of these, set on the `.screen` div, would open a NEW stacking context
  // around `.pause`'s z-index: 999 instead of leaving it to compete directly
  // inside #ui's context against the battle overlays. See the file header.
  const FORBIDDEN_STYLE_PROPS = [
    'zIndex',
    'opacity',
    'transform',
    'filter',
    'backdropFilter',
    'isolation',
    'willChange',
    'contain',
    'mixBlendMode',
    'perspective',
    'clipPath',
    'mask',
  ];

  it('the .screen root must not open a stacking context, or .pause\'s z-index stops competing in #ui\'s context and the battle overlays paint over the pause again (see pause-screen.css)', () => {
    const offenders: string[] = [];

    for (const prop of FORBIDDEN_STYLE_PROPS) {
      if (new RegExp(`\\.style\\.${prop}\\s*=`).test(body)) offenders.push(`style.${prop}`);
    }
    if (body.includes('.animate(')) offenders.push('.animate(');

    for (const call of body.matchAll(/classList\.add\(([^)]*)\)/g)) {
      for (const rawArg of call[1]!.split(',')) {
        const arg = rawArg.trim().replace(/^['"]|['"]$/g, '');
        if (arg && arg !== 'screen') offenders.push(`classList.add('${arg}')`);
      }
    }
    for (const assign of body.matchAll(/\.className\s*=\s*([^;]+);/g)) {
      const value = assign[1]!.trim().replace(/^['"]|['"]$/g, '');
      if (value !== 'screen') offenders.push(`className = ${assign[1]!.trim()}`);
    }

    expect(offenders).toEqual([]);
  });

  it('reads the right method: it still sets position and inset', () => {
    expect(body).toMatch(/\.style\.position\s*=/);
    expect(body).toMatch(/\.style\.inset\s*=/);
  });

  // The inline-style guard above cannot see a CSS rule aimed at the same
  // element: a stylesheet selector matching `.screen` (or a `[data-screen]`
  // attribute on it) could open the identical stacking context from outside
  // `App.ts` entirely. Today nothing in the codebase targets `.screen` at
  // all — every screen styles its own content class, never the shared root —
  // so this scan's own offender list is expected to come back empty; it is
  // here so the day something *does* target `.screen`, it is held to the
  // same no-stacking-context rule `makeScreenRoot` itself is held to.
  it('no CSS rule targeting the .screen root opens a stacking context either', () => {
    const cssFiles: string[] = [];
    collectSourceFiles(join(REPO_ROOT, 'src'), cssFiles);
    const sheets = cssFiles.filter((f) => f.endsWith('.css'));
    sheets.push(join(REPO_ROOT, 'index.html'));
    expect(sheets.length, 'the CSS scan must look at a real number of stylesheets').toBeGreaterThanOrEqual(20);

    const targetsScreen = (selector: string): boolean =>
      /\.screen(?![\w-])/.test(selector) || selector.includes('[data-screen');
    const lineOf = (text: string, idx: number): number => 1 + (text.slice(0, idx).match(/\n/g) ?? []).length;

    const offenders: string[] = [];
    for (const sheet of sheets) {
      const clean = stripBlockComments(readFileSync(sheet, 'utf8'));
      const rel = sheet.slice(REPO_ROOT.length + 1).replace(/\\/g, '/');
      for (const block of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const selector = block[1]!.trim().replace(/\s+/g, ' ');
        if (!targetsScreen(selector)) continue;
        const bodyStart = block.index! + block[1]!.length + 1;
        for (const prop of FORBIDDEN_STYLE_PROPS.map(kebab)) {
          for (const m of block[2]!.matchAll(new RegExp(`(?<![\\w-])${prop}\\s*:`, 'g'))) {
            offenders.push(`${rel}:${lineOf(clean, bodyStart + m.index!)} ${selector} -> ${prop}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
