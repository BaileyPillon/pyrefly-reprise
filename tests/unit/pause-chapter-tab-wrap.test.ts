/**
 * **The CHAPTER tab never cuts an objective or a snapshot caption short.**
 *
 * Found on Evrae (Chapter 8, 2026-09-23, `shots2/05-pause-chapter-tab.png`):
 * the objective labels read "SURVIVE POIS…" and "CURE A PETRI…", and all three
 * snapshot captions were cut to a dozen letters ("the foredec…"). The labels
 * sit in the fixed key column the meters share and the captions under a
 * 72-130 px thumbnail, both `nowrap` with an ellipsis, so every chapter's
 * captions were cut the same way (Leblanc's "the Syndicate's real workplace",
 * Chapter 1's "unhurried, always unhurried"). An objective is the thing the
 * player opened the tab to read, and `panels.ts` already calls an ellipsis on
 * a menu row a defect: an objective now wraps, and so does a caption.
 *
 * **Both games**: the pause screen is shared chrome (CHK-020).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { columnsHtml, fromPanels } from '../../src/app/screens/pause/markup.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHEET = readFileSync(join(HERE, '..', '..', 'src', 'ui', 'common', 'pause-screen.css'), 'utf8');

/** The declarations of the first rule whose selector is exactly `selector`. */
function rule(selector: string): string {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(^|\\n)${esc}\\s*\\{([^}]*)\\}`).exec(SHEET);
  return m?.[2] ?? '';
}

describe('pause CHAPTER tab: nothing the player came to read is cut off', () => {
  it('marks objective rows so they can wrap', () => {
    const html = columnsHtml(
      fromPanels(
        [
          {
            id: 'detail',
            heading: 'This encounter',
            wide: true,
            rows: [
              { id: 'obj-a', label: '1. Survive Poison Breath', value: '—', ratio: null, selectable: false, obj: true },
              { id: 'play', label: 'Play time', value: '0:34', ratio: null, selectable: false },
            ],
          },
        ],
        null,
      ),
    );
    expect(html).toMatch(/class="[^"]*pause__row--obj[^"]*"[^>]*>[\s\S]*1\. Survive Poison Breath/);
    expect((html.match(/pause__row--obj/g) ?? []).length).toBe(1);
  });

  it('lets an objective label wrap onto a second line instead of an ellipsis', () => {
    const k = rule('.pause__row--obj .pause__k');
    expect(k).toMatch(/white-space:\s*normal/);
    expect(k).toMatch(/text-overflow:\s*clip/);
    expect(rule('.pause__row--obj')).toMatch(/height:\s*auto/);
  });

  it('lets a snapshot caption wrap instead of an ellipsis', () => {
    const cap = rule('.pause__snap figcaption');
    expect(cap).not.toMatch(/white-space:\s*nowrap/);
    expect(cap).not.toMatch(/text-overflow:\s*ellipsis/);
  });
});
