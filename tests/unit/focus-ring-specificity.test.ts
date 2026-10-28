/**
 * The Ink & Gold focus ring must never out-rank the rules that switch it off (review of 62ff4feca, lane ui-input, major M1).
 *
 * `:is()` and `:not()` take the specificity of their most specific argument, so the first build's ring (a type list containing `a[href]`
 * inside `:is()`) was [0,3,1] and the "cursor has no ring" rule was [0,3,0]: the ring won and every arrow press drew a gold ring on the
 * cursor card, the open prep tab, the open pause tab and the pause pages' selected rows. Vitest cannot run the cascade, so this computes
 * the selectors' specificity from the real stylesheets (selectors level 4: `:where()` counts for nothing, `:is()`, `:not()` and `:has()`
 * for their most specific argument) and checks the order the contract needs.
 *
 * Game case: both (shared UI; no battle code).
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

type Spec = [number, number, number];

const css = (path: string): string => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Split on `sep` outside parentheses, brackets and quotes. */
function splitTop(text: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote = '';
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i] as string;
    if (quote) {
      if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === sep && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

const cmp = (a: Spec, b: Spec): number => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

function specOfComplex(sel: string): Spec {
  const spec: Spec = [0, 0, 0];
  let i = 0;
  const ident = (from: number): number => {
    let j = from;
    while (j < sel.length && /[\w-]/.test(sel[j] as string)) j++;
    return j;
  };
  while (i < sel.length) {
    const c = sel[i] as string;
    if (c === '[') {
      let q = '';
      let j = i + 1;
      for (; j < sel.length; j++) {
        const d = sel[j] as string;
        if (q) {
          if (d === q) q = '';
        } else if (d === '"' || d === "'") q = d;
        else if (d === ']') break;
      }
      spec[1]++;
      i = j + 1;
    } else if (c === '.' || c === '#') {
      spec[c === '#' ? 0 : 1]++;
      i = ident(i + 1);
    } else if (c === ':') {
      const element = sel[i + 1] === ':';
      const nameEnd = ident(i + (element ? 2 : 1));
      const name = sel.slice(i + (element ? 2 : 1), nameEnd).toLowerCase();
      i = nameEnd;
      let inner: string | null = null;
      if (sel[i] === '(') {
        let depth = 0;
        let j = i;
        for (; j < sel.length; j++) {
          if (sel[j] === '(') depth++;
          else if (sel[j] === ')' && --depth === 0) break;
        }
        inner = sel.slice(i + 1, j);
        i = j + 1;
      }
      if (element) spec[2]++;
      else if (name === 'where') continue;
      else if (inner !== null && (name === 'is' || name === 'not' || name === 'has' || name === 'matches')) {
        const best = splitTop(inner, ',').map(specOfComplex).sort(cmp).pop() ?? [0, 0, 0];
        spec[0] += best[0];
        spec[1] += best[1];
        spec[2] += best[2];
      } else spec[1]++;
    } else if (/[a-zA-Z*]/.test(c)) {
      const end = ident(i);
      if (sel.slice(i, end) !== '*') spec[2]++;
      i = end;
    } else i++;
  }
  return spec;
}

/** The highest specificity among the selectors of the rule whose body matches. */
function ruleSpec(source: string, bodyHas: string): { selector: string; spec: Spec } {
  for (const m of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!(m[2] as string).includes(bodyHas)) continue;
    const selector = (m[1] as string).trim();
    const spec = splitTop(selector, ',').map(specOfComplex).sort(cmp).pop() as Spec;
    return { selector, spec };
  }
  throw new Error(`no rule with a body containing "${bodyHas}"`);
}

/** The specificity of one named selector of a rule in a file. */
function selectorSpec(source: string, selector: string): Spec {
  for (const m of source.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
    for (const part of splitTop((m[1] as string).trim(), ',')) {
      if (part.replace(/\s+/g, ' ') === selector) return specOfComplex(part);
    }
  }
  throw new Error(`selector not found: ${selector}`);
}

const focusCss = css('src/ui/inkgold/focus.css');
const ring = ruleSpec(focusCss, 'outline: 2px solid');
const cursorOff = ruleSpec(focusCss, 'outline: none');

describe('the specificity calculator', () => {
  it('counts the way selectors level 4 does', () => {
    expect(specOfComplex('a[href]')).toEqual([0, 1, 1]);
    expect(specOfComplex(':is(.a, a[href]):focus-visible')).toEqual([0, 2, 1]);
    expect(specOfComplex(':where(.a, #b) button:focus-visible')).toEqual([0, 1, 1]);
    expect(specOfComplex('.x .y:not([data-z])')).toEqual([0, 3, 0]);
    expect(specOfComplex(":is([data-screen='a'], [data-screen='b']) [data-cursor]:focus-visible")).toEqual([0, 3, 0]);
    expect(specOfComplex('.pause__col .pause__row[data-row=\'eyeCandy\']:focus')).toEqual([0, 4, 0]);
  });
});

describe('focus.css', () => {
  it('draws the ring with :where() so it carries no specificity but :focus-visible\'s own', () => {
    expect(ring.selector.match(/:where\(/g)?.length, ring.selector).toBeGreaterThanOrEqual(3);
    expect(ring.spec, ring.selector).toEqual([0, 1, 0]);
  });

  it('keeps the ring off the cursor in the ring\'s own selector and again in a stronger rule', () => {
    expect(ring.selector).toContain(':not([data-cursor])');
    expect(cursorOff.selector).toContain('[data-cursor]:focus-visible');
    expect(cmp(cursorOff.spec, ring.spec), 'the cursor rule out-ranks the ring').toBeGreaterThan(0);
  });

  it('is beaten by every outline: none the screens already had (no tie to settle by source order)', () => {
    const frontend = css('src/app/screens/frontend/frontend.css');
    const eyeCandy = css('src/ui/common/pause-eye-candy.css');
    const own: Array<[string, Spec]> = [
      ['.fe-card:focus-visible', selectorSpec(frontend, '.fe-card:focus-visible')],
      ['.pause__ec-col .pause__ec-row:focus', selectorSpec(eyeCandy, '.pause__ec-col .pause__ec-row:focus')],
      ["pause eyeCandy row", selectorSpec(eyeCandy, ".pause__col .pause__row[data-row='eyeCandy']:focus")],
      ['pause presentation row', selectorSpec(eyeCandy, ".pause__col .pause__row[data-row='presentation']:focus")],
    ];
    for (const [name, spec] of own) expect(cmp(spec, ring.spec), `${name} ${spec.join(',')} vs ring ${ring.spec.join(',')}`).toBeGreaterThan(0);
  });
});
