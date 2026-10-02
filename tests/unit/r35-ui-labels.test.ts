// @vitest-environment jsdom
/**
 * Release 35 interface lane, U6: clipped labels. The measured proof (scrollWidth against clientWidth at the sizes
 * the issues name) is in docs/handoff/r35-fix-ui.md; this pins the rules.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { cardHtml } from '../../src/app/screens/frontend/chapterCards.ts';
import type { ChapterTile } from '../../src/app/screens/frontend/chapterGrid.ts';
import { tagCentreX } from '../../src/scenes/macalania-temple-arrival-battle.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p: string): string => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

const tile = (title: string): ChapterTile =>
  ({ kind: 'chapter', id: 'x', game: 'ffx', number: 17, numeral: 'XVII', title, location: '', sceneKey: null, silhouetteKeys: [], cleared: false, playable: true, chapter: null }) as unknown as ChapterTile;

describe('chapter board labels (PR-0275, both games)', () => {
  it('a long title takes the one-step-down size; a short one does not', () => {
    expect(cardHtml(tile('Sin: the Fins and the Core'), 0, false)).toContain('fe-card__name--long');
    expect(cardHtml(tile("Braska's Final Aeon"), 0, false)).not.toContain('fe-card__name--long');
    expect(cardHtml(tile('Seymour Flux'), 0, false)).not.toContain('fe-card__name--long');
  });

  it('the pips pad their numerals clear of the slanted ends', () => {
    const css = read('src/app/screens/frontend/chapter-select-c.css');
    const pip = css.match(/\.cs-pip \{([^}]*)\}/)![1]!;
    expect(pip).toMatch(/padding:\s*0 calc\(2\.2 \* var\(--fe-k\)\)/);
    expect(pip).toMatch(/polygon\(calc\(3\.5 \* var\(--fe-k\)\) 0/);
  });
});

describe('Chapter VII tags stay inside the window (FFX only)', () => {
  it('clamps a tag centre so the whole plate is on screen, and leaves a tag that fits alone', () => {
    expect(tagCentreX(300, 258, 390)).toBe(390 - 129 - 6); // 'Cannot be targeted' at the right edge
    expect(tagCentreX(10, 122, 390)).toBe(61 + 6); // 'Anima' at the left edge
    expect(tagCentreX(200, 122, 390)).toBe(200); // fits: untouched
    expect(tagCentreX(100, 500, 390)).toBe(256); // wider than the window: centred, never negative
  });
});

describe('phone labels wrap instead of ending in an ellipsis (PR-0246, PR-0288)', () => {
  const css = read('src/ui/common/phone-battle.css');
  it('the foot help line clamps to two lines at 14 px', () => {
    const foot = css.match(/\.phud-foot \{([^}]*)\}/)![1]!;
    expect(foot).toMatch(/-webkit-line-clamp:\s*2/);
    expect(foot).not.toMatch(/white-space:\s*nowrap/);
    expect(foot).toMatch(/font-size:\s*14px/);
  });
  it('the target confirm button wraps and no longer ellipsises', () => {
    const go = css.match(/\.phud-target__go \{\s*flex: 1;([^}]*)\}/)![1]!;
    expect(go).toMatch(/white-space:\s*normal/);
    expect(go).not.toMatch(/text-overflow:\s*ellipsis/);
  });
});

describe('FFX-2 item list header and the phone results caption (PR-0276, PR-0275)', () => {
  it('the command window header is sticky, with the up-fold mark under it', () => {
    const css = read('src/ui/ffx2/ffx2-hud.css');
    expect(css.match(/\.ffx2cmd__title \{([^}]*)\}/)![1]).toMatch(/position:\s*sticky;\s*top:\s*0/);
    expect(css).toMatch(/\.ffx2hud__command:has\(\.ffx2cmd__title\) \.ffx2cmd__fold--up/);
  });
  it('the phone caption lets the location wrap into more columns', () => {
    const css = read('src/ui/common/results-phone.css');
    const rule = css.match(/\.rres--phone \.rresp__caption \.rres__cap-loc \{([^}]*)\}/)![1]!;
    expect(rule).toMatch(/white-space:\s*normal/);
    expect(rule).toMatch(/text-overflow:\s*clip/);
  });
});
