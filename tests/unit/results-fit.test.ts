/**
 * PR-0172 and PR-0120 (both games; the results page is shared): the vertical
 * caption ends above the button row, shortening the location and never the
 * ending; a window wider than 16:9 carries the wedge's ink to the right edge.
 * The browser measurements at 1600x900 and 2000x1012 are in
 * `docs/handoff/iter2-b4.md`.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { resultsCaptionHtml } from '../../src/ui/common/resultsPage.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const css = (f: string): string => readFileSync(join(HERE, '..', '..', 'src', 'ui', 'common', f), 'utf8');
const num = (sheet: string, rule: string, prop: string): number => {
  const start = sheet.indexOf(`\n${rule} {`);
  const block = start < 0 ? '' : sheet.slice(start, sheet.indexOf('}', start));
  const line = block.split('\n').find((l) => l.trim().startsWith(`${prop}:`)) ?? '';
  return parseFloat(line.split(':')[1] ?? 'NaN');
};

describe('PR-0172: the caption ends above the buttons', () => {
  it('is two spans, so only the location can give way', () => {
    expect(resultsCaptionHtml('Deck of the Fahrenheit — the approach to Bevelle', false)).toBe(
      '<span class="rres__cap-loc">DECK OF THE FAHRENHEIT — THE APPROACH TO BEVELLE</span>' +
        '<span class="rres__cap-end"> &middot; FELL</span>',
    );
    expect(resultsCaptionHtml('Road to the Farplane', true)).toContain('&middot; CLEARED</span>');
    expect(resultsCaptionHtml('A <b>', true)).toContain('A &lt;B&gt;');
  });

  it('its run down the page stops 8 grid px above the top of the button row', () => {
    const base = css('results.css');
    const fit = css('results-fit.css');
    const top = num(base, '.rres__caption', 'top');
    const bottom = num(base, '.rres__actions', 'bottom');
    const run = num(fit, '.rres__caption', 'width');
    const buttons = 20; // 5.33 x 2 padding + a 6.22 px line + 0.89 x 2 border, rounded up
    expect(top + run).toBeLessThanOrEqual(360 - bottom - buttons - 8 + 0.5);
    expect(fit).toMatch(/\.rres__cap-loc \{[^}]*text-overflow: ellipsis/);
    expect(fit).toMatch(/\.rres__cap-end \{[^}]*flex: none/);
  });
});

describe('PR-0120: no paper strip right of the wedge on a wide window', () => {
  it('paints the right gutter in ink, beside the stage, only wider than 16:9 and never on the phone page', () => {
    const fit = css('results-fit.css');
    expect(fit).toMatch(/@media \(min-aspect-ratio: 16\/9\)/);
    expect(fit).toMatch(/\.rres:not\(\.rres--phone\)::before \{[^}]*right: 0;[^}]*width: calc\(\(100% - 177\.7778vh\) \/ 2 \+ 1px\)/);
    expect(fit).toMatch(/\.rres--defeat:not\(\.rres--phone\)::before \{[^}]*#08070d/);
  });
});
