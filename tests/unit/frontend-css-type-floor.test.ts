/**
 * `frontend.css`'s type floor — PR-0066 / FE-001 (round 07 deep review and its
 * focused pre-deploy pass, build 8f48237): every `.fe-*` label on the title
 * and the chapter select scaled off `--fe-k` alone, and at 390x844 that put
 * eight title elements and forty-three board elements under 14 effective CSS
 * px, down to 9.54. `--fe-k` cannot simply be raised on the phone — it also
 * drives the slab, the rail and the card geometry the same breakpoint depends
 * on — so the fix is a floor on TYPE only: every `font-size` in this sheet is
 * `max(var(--fe-fs-floor), calc(N * var(--fe-k)))`, and `--fe-fs-floor` is
 * 14px on a desktop window and 12px on the phone (the same two numbers
 * `pause-screen.css` / `tests/unit/pause-remake-css.test.ts` floor at).
 *
 * This file evaluates that arithmetic the way a browser would, at the five
 * viewports the brief names, and fails if any `.fe-*` label can still compute
 * under its floor.
 *
 * No jsdom: `--fe-k` and the floor are custom-property arithmetic a browser
 * does at layout time, not something jsdom's `getComputedStyle` resolves —
 * this is arithmetic on the sheet's own text, the same approach
 * `pause-remake-css.test.ts` uses for exactly this reason.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHEET = readFileSync(
  join(HERE, '..', '..', 'src', 'app', 'screens', 'frontend', 'frontend.css'),
  'utf8',
);

const VIEWPORTS = [
  [390, 844],
  [1280, 720],
  [1600, 900],
  [2000, 1012],
  [2560, 1080],
] as const;

/** Matches frontend.css's own narrow-window query. */
function isPhone(w: number, h: number): boolean {
  return w <= 760 || w / h <= 3 / 4;
}

/** `--fe-k` as frontend.css defines it, for a window of this shape. */
function feK(w: number, h: number): number {
  const [gw, gh] = isPhone(w, h) ? [430, 1150] : [1440, 810];
  return Math.max(0.5, Math.min(w / gw, h / gh));
}

/** `--fe-fs-floor` as frontend.css defines it: 14px desktop, 12px phone. */
function fsFloor(w: number, h: number): number {
  return isPhone(w, h) ? 12 : 14;
}

const PHONE_QUERY = '@media (max-width: 760px), (max-aspect-ratio: 3 / 4)';
const baseSheet = SHEET.slice(0, SHEET.indexOf(PHONE_QUERY));
const phoneSheet = SHEET.slice(SHEET.indexOf(PHONE_QUERY));

/** Every selector block containing a `.fe-*` font-size, base sheet first. */
interface Token {
  selector: string;
  coefficient: number;
}

function extractTokens(slice: string): Token[] {
  const out: Token[] = [];
  // A selector block: `.some-selector, .another {\n ... \n}` (no nested braces
  // anywhere in this sheet's flat rule bodies).
  const blockRe = /([^{}]+)\{([^{}]*)\}/g;
  for (const m of slice.matchAll(blockRe)) {
    const selector = m[1]!.trim();
    const body = m[2]!;
    const fs = /font-size:\s*max\(var\(--fe-fs-floor\),\s*calc\((\d+(?:\.\d+)?)\s*\*\s*var\(--fe-k\)\)\);/.exec(
      body,
    );
    if (fs) out.push({ selector, coefficient: Number(fs[1]) });
  }
  return out;
}

describe('every .fe-* font-size is wrapped in the floor', () => {
  it('declares no bare font-size calc() a player could hit under the floor', () => {
    // Anything still of the shape `font-size: calc(N * var(--fe-k));` (no
    // `max(var(--fe-fs-floor), ...)` around it) is exactly PR-0066's bug.
    const bare = [...SHEET.matchAll(/font-size:\s*calc\([^)]*var\(--fe-k\)[^)]*\);/g)];
    expect(bare.map((m) => m[0])).toEqual([]);
  });

  it('finds at least the title and the board among the wrapped tokens', () => {
    const base = extractTokens(baseSheet);
    const selectors = base.map((t) => t.selector);
    expect(selectors.some((s) => s.includes('.fe-title__eyebrow'))).toBe(true);
    expect(selectors.some((s) => s.includes('.fe-card__name'))).toBe(true);
    expect(selectors.some((s) => s.includes('.fe-rail__group'))).toBe(true);
    expect(base.length).toBeGreaterThan(15);
  });
});

describe('nothing on a desktop window can compute below 14px', () => {
  const base = extractTokens(baseSheet);

  for (const [w, h] of VIEWPORTS.filter(([w, h]) => !isPhone(w, h))) {
    it(`holds the 14px floor at ${w}x${h}`, () => {
      const k = feK(w, h);
      const floor = fsFloor(w, h);
      expect(floor).toBe(14);
      for (const { selector, coefficient } of base) {
        const px = Math.max(floor, coefficient * k);
        expect(px, `${selector} at ${w}x${h}`).toBeGreaterThanOrEqual(14);
      }
    });
  }
});

describe('the phone runs at a 12px floor and nowhere lower', () => {
  // At the phone breakpoint a selector may be re-declared in the phone block;
  // where it is, that coefficient wins (the cascade), and `--fe-fs-floor` is
  // 12px there either way because it is redeclared on `.fe` itself.
  const base = extractTokens(baseSheet);
  const phoneOverrides = new Map(extractTokens(phoneSheet).map((t) => [t.selector, t.coefficient]));

  for (const [w, h] of VIEWPORTS.filter(([w, h]) => isPhone(w, h))) {
    it(`holds the 12px floor at ${w}x${h}`, () => {
      const k = feK(w, h);
      const floor = fsFloor(w, h);
      expect(floor).toBe(12);
      for (const { selector, coefficient } of base) {
        const effective = phoneOverrides.get(selector) ?? coefficient;
        const px = Math.max(floor, effective * k);
        expect(px, `${selector} at ${w}x${h}`).toBeGreaterThanOrEqual(12);
      }
      // And the phone block's own re-declarations, which are not necessarily
      // present in the base list at all (e.g. `.fe-title__name` restates a
      // different coefficient here).
      for (const [selector, coefficient] of phoneOverrides) {
        const px = Math.max(floor, coefficient * k);
        expect(px, `${selector} (phone override) at ${w}x${h}`).toBeGreaterThanOrEqual(12);
      }
    });
  }
});

describe('the floor variable itself', () => {
  it('is 14px on the base sheet and 12px inside the phone query', () => {
    const baseFloor = /--fe-fs-floor:\s*(\d+)px;/.exec(baseSheet);
    const phoneFloor = /--fe-fs-floor:\s*(\d+)px;/.exec(phoneSheet);
    expect(baseFloor?.[1]).toBe('14');
    expect(phoneFloor?.[1]).toBe('12');
  });
});
