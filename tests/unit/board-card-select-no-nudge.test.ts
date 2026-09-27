/**
 * FOC18-04 (release 18 focused review): selecting a board card nudged every card below it by 2 px.
 * The selected card drew its heavier gold rule as a 2k border, which takes width out of the rail's
 * flex share; it is now the card's own 1 px border plus an outline, which costs no layout.
 * Measured on a production build (card-move probe, `docs/screenshots/iter2-b6/`).
 *
 * Game case: both (the shared board).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHEET = readFileSync(join(HERE, '..', '..', 'src', 'app', 'screens', 'frontend', 'chapter-select-c.css'), 'utf8');

describe('FOC18-04: the selected board card costs no layout', () => {
  const m = /\n\.fe-card--sel \{([^}]*)\}/.exec(SHEET);

  it('draws the heavier rule with an outline, not a wider border', () => {
    expect(m).not.toBeNull();
    const body = m![1]!;
    expect(body).not.toMatch(/(^|\s)border:\s*calc/);
    expect(body).not.toMatch(/border-width/);
    expect(body).toMatch(/outline:\s*max\(0px, calc\(2 \* var\(--fe-k\) - 1px\)\) solid var\(--fe-accent\)/);
    expect(body).toMatch(/border-color:\s*var\(--fe-accent\)/);
  });
});
