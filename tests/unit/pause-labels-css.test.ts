/**
 * The pause labels that were cut (iter2 B6), read as text:
 *
 * - accessibility review §7 step 1: the CONTROLS tab's four sentences cut at 1600x900, so the tab
 *   is laid out as `docs/concepts/accessibility-2026-09-26/desk-A-controls.jpg` draws it;
 * - PR-0117: the FFX-2 Garment Grid name ellipsised at 390x844.
 *
 * The widths themselves are measured on a production build (`docs/screenshots/iter2-b6/`).
 * Game case: CONTROLS both; the grid row FFX-2 only.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const CSS = readFileSync(join(ROOT, 'src', 'ui', 'common', 'pause-labels.css'), 'utf8');
const MARKUP = readFileSync(join(ROOT, 'src', 'app', 'screens', 'pause', 'markup.ts'), 'utf8');

function rule(selector: string, sheet = CSS): string {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`${esc}\\s*\\{([^}]*)\\}`).exec(sheet);
  expect(m, selector).not.toBeNull();
  return m![1]!;
}

describe('pause labels (iter2 B6)', () => {
  it('the sheet is loaded with the pause markup', () => {
    expect(MARKUP).toContain("import '../../../ui/common/pause-labels.css';");
  });

  it('CONTROLS: the label takes its own width and is never cut; the binding sits at the far edge', () => {
    const k = rule(".pause__body[data-tab='controls'] .pause__k");
    expect(k).toMatch(/width:\s*auto/);
    expect(k).toMatch(/overflow:\s*visible/);
    expect(rule(".pause__body[data-tab='controls'] .pause__bar")).toMatch(/display:\s*none/);
    expect(rule(".pause__body[data-tab='controls'] .pause__v")).toMatch(/flex:\s*none/);
  });

  it('on the phone a CONTROLS sentence wraps, the binding does not', () => {
    const phone = /@media \(max-width: 620px\) \{([\s\S]*)\}\s*$/.exec(CSS)![1]!;
    expect(rule(".pause__body[data-tab='controls'] .pause__k", phone)).toMatch(/white-space:\s*normal/);
  });

  it('PR-0117: on the phone the Garment Grid name wraps instead of ellipsising', () => {
    const phone = /@media \(max-width: 620px\) \{([\s\S]*)\}\s*$/.exec(CSS)![1]!;
    const v = rule(".pause__col .pause__row[data-row='grid'] .pause__v", phone);
    expect(v).toMatch(/white-space:\s*normal/);
    expect(v).toMatch(/text-overflow:\s*clip/);
    expect(rule(".pause__col .pause__row[data-row='grid']", phone)).toMatch(/height:\s*auto/);
  });
});
