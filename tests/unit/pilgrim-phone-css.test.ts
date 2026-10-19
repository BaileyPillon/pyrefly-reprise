/**
 * **The Pilgrimage at phone width keeps its promises** (PR-0465, round 26 of release 55; hidden prototype, FFX only). The real check is the headless run at 390x844
 * (`docs/screenshots/r56-fixes/pilgrim-390x844-after/`: no text under 14 px, no truncated name, the tag inside its card, every target 44 px or more, the primary button in view
 * without scrolling); this file holds the stylesheet's side of it so a later edit cannot quietly undo it: the phone blocks never set a font under 14 px, the names wrap instead of
 * ending in an ellipsis, the foot lets the button pin, and the RUN tab of party prep takes the CHAPTER tab's phone recipe.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const read = (rel: string): string => readFileSync(`${ROOT}${rel}`, 'utf8');

/** The text of the `@media` block that starts at `header` (balanced braces). */
function mediaBlock(css: string, header: string): string {
  const at = css.indexOf(header);
  if (at < 0) throw new Error(`no ${header}`);
  let depth = 0;
  for (let i = css.indexOf('{', at); i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(at, i + 1);
  }
  throw new Error('unbalanced');
}

/** Every `font-size` declaration in `css` that is a plain px value, as numbers. */
const pxFontSizes = (css: string): number[] => [...css.matchAll(/font-size:\s*([0-9.]+)px/g)].map((m) => Number(m[1]));

describe('the road, the boon pick and the run-over page at phone width', () => {
  const phone = mediaBlock(read('src/app/pilgrim/pilgrim.css'), '@media (max-width: 760px), (max-aspect-ratio: 3 / 4)');

  it('never set a font under 14 px, and set the size tokens to 14', () => {
    for (const px of pxFontSizes(phone)) expect(px).toBeGreaterThanOrEqual(14);
    for (const token of ['--fs-s', '--fs-m']) expect(phone).toMatch(new RegExp(`${token}:\\s*14px`));
  });

  it('let a place name and a tag wrap whole instead of ending in an ellipsis or past the card', () => {
    expect(phone).toMatch(/\.pgx-node__sub \{[^}]*white-space: normal/);
    expect(phone).toMatch(/\.pgx-node__name \{[^}]*white-space: normal/);
    expect(phone).toMatch(/\.pgx-tag \{[^}]*white-space: normal[^}]*max-width: calc\(100% - 16px\)/);
    expect(phone).toMatch(/\.pgx-node \{[^}]*height: auto/); // the card grows with its caption: a fixed 128 px card was what cut it
  });

  it('pin the primary button to the bottom edge while the page runs (the foot stops being a box so sticky has the whole page)', () => {
    expect(phone).toMatch(/\.pgx-foot \{ display: contents; \}/);
    expect(phone).toMatch(/\.pgx-foot > \.pgx-btn, \.pgx-main > \.pgx-btn, \.pgx-over__btns \{ position: sticky; bottom: 12px;/);
    expect(phone).toMatch(/\.pgx-btn \{ height: 52px;/); // a target well over 44 px
    expect(phone).toMatch(/\.pgx-btn--wait \{ background: #[0-9a-f]{6};/i); // solid, so it never shows the page through itself
    expect(phone).toMatch(/\.pgx-over \{[^}]*overflow: visible/); // a scroll box of its own would stop the button sticking
  });
});

describe('the RUN tab of party prep at phone width', () => {
  const prep = read('src/app/pilgrim/pilgrim-prep.css');
  const phone = mediaBlock(prep, '@media (max-width: 599px)');

  it('takes the CHAPTER tab\'s stacked page: every rule of that recipe is keyed on both tabs, and no rule is keyed on the CHAPTER tab alone', () => {
    const recipe = read('src/ui/common/party-prep-phone.css');
    expect(recipe).not.toMatch(/\.prep\[data-tab='chapter'\]/);
    const keyed = recipe.match(/\.prep:is\(\[data-tab='chapter'\], \[data-tab='pilgrim-run'\]\)/g) ?? [];
    expect(keyed.length).toBeGreaterThan(30);
    const pager = read('src/app/screens/party-prep/phonePrep.ts');
    expect(pager).toContain("prep.dataset['tab'] === 'pilgrim-run'");
  });

  it('never sets a font under 14 px and keeps the tabs 44 px targets', () => {
    for (const px of pxFontSizes(phone)) expect(px).toBeGreaterThanOrEqual(14);
    expect(phone).toMatch(/\.prep__tab \{ min-height: 44px; min-width: 44px;/);
  });

  it('places the strip and the chips as rows of the page, not on the 640x360 board', () => {
    expect(phone).toMatch(/\.pgx-strip \{ position: static;/);
    expect(phone).toMatch(/\.pgx-chipsbar \{ position: static;/);
  });
});
