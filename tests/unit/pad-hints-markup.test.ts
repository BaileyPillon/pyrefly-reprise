// @vitest-environment jsdom
/**
 * Release 61, the conference demo (decision 169); both games, presentation plumbing.
 *
 * The hint chips written as markup (the title's hint row and Press chip, the party prep's strip, the target plates' legend, the Defend tab) carry BOTH halves, the key and the pad's
 * button, and the stylesheets show the one in use by `html[data-input]`. jsdom does not apply the stylesheets, so this pins the markup and the rules' text.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { titleMarkup } from '../../src/app/screens/frontend/titleMarkup.ts';
import { changelogEntryHtml } from '../../src/app/screens/frontend/titleInfoHtml.ts';

function dom(html: string): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el;
}

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('the title', () => {
  const root = dom(titleMarkup({ briefingChip: false, art: 'farplane' }));

  it('the Press chip says Enter for a key and the bottom face button for a pad', () => {
    const chip = root.querySelector('.fe-title__chip-label--key')!;
    expect(chip.querySelector('.kh-k')?.textContent).toBe('Enter');
    expect(chip.querySelector('.kh-p .pg')?.getAttribute('data-pg')).toBe('cross');
  });

  it('the hint row names move, confirm and cancel on the d-pad, the bottom face button and the right one', () => {
    const row = root.querySelector('.fe-hint')!;
    const keys = [...row.querySelectorAll('.fe-hint__key .kh-k')].map((e) => e.textContent);
    expect(keys).toEqual(['Arrows / WASD', 'Enter', 'Esc']);
    const pads = [...row.querySelectorAll('.fe-hint__key .kh-p .pg')].map((e) => e.getAttribute('data-pg'));
    expect(pads).toEqual(['dpad', 'cross', 'circle']);
  });

  it('the entries with no pad button (CHANGELOG) carry no `data-has-pad`, so a pad player is not shown them', () => {
    const entry = dom(changelogEntryHtml()).querySelector('.fe-hint__entry')!;
    expect(entry.hasAttribute('data-has-pad')).toBe(false);
    expect(read('../../src/app/screens/frontend/frontend.css')).toMatch(/html\[data-input='gamepad'\] \.fe-hint__entry:not\(\[data-has-pad\]\)/);
  });
});

describe('the stylesheet that draws the chips', () => {
  const css = read('../../src/ui/common/pad-glyphs.css');

  it('shows the key until the last input was a pad, then the pad half', () => {
    expect(css).toMatch(/\.kh-p\s*\{\s*display:\s*none/);
    expect(css).toMatch(/html\[data-input='gamepad'\] \.kh-k\s*\{\s*display:\s*none/);
    expect(css).toMatch(/html\[data-input='gamepad'\] \.kh-p\s*\{\s*display:\s*inline-flex/);
  });

  it('labels a glyph by the pad family on <html>, from the markup\'s own attributes', () => {
    expect(css).toMatch(/html\[data-pad='xbox'\] \.pg::before[^{]*\{\s*content:\s*attr\(data-x\)/);
    expect(css).toMatch(/html\[data-pad='playstation'\] \.pg::before\s*\{\s*content:\s*attr\(data-p\)/);
    expect(css).toMatch(/html\[data-pad='nintendo'\] \.pg::before\s*\{\s*content:\s*attr\(data-n\)/);
  });

  it('draws the Xbox face buttons in their four colours and the PlayStation ones as ink discs', () => {
    for (const token of ['cross', 'circle', 'square', 'triangle']) {
      expect(css).toContain(`.pg[data-pg='${token}']`);
    }
    expect(css).toMatch(/#78c96f/); // A green
    expect(css).toMatch(/#ec6e63/); // B red
    expect(css).toMatch(/#67a3ee/); // X blue
    expect(css).toMatch(/#efc84f/); // Y yellow
  });
});

describe('the strip that the cutscene and results screens share grows with the window (1440p)', () => {
  const css = read('../../src/ui/common/controls-hint.css');
  it('is sized off the viewport, not a flat 12px, and every other measure is in em', () => {
    expect(css).toMatch(/font-size:\s*max\(12px, 0\.78vw\)/);
    const block = css.slice(css.indexOf('.chint {'), css.indexOf('.chint[hidden]'));
    expect(block).not.toMatch(/(bottom|gap|padding):[^;]*\dpx/);
  });
});
