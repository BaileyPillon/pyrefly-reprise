/**
 * REG-keycol (t1-b3b check, 2026-09-26): the key-column floors in the pause
 * sheets, read as text.
 *
 * PR-0151 needed "MASTER VOLUME" / "SOUND EFFECTS" / "STRATEGY GUIDE" (135 to
 * 140 px at 14 px type) to fit in the OPTIONS tab's settings column. Raising
 * the floor of *every* wide key column from 118 to 150 px did that, but also
 * squeezed the value cells of the CHAPTER tab ("MT. GA…" at 1024x768) and the
 * CONTROLS tab (key bindings cut at 390x844), and PR-0189 making THE PARTY
 * column wide squeezed the party values on the phone. So the 150 px floor is
 * scoped to the settings column alone, the generic wide floor stays at 118,
 * and THE PARTY keeps its plain key column (FFX-2's DRESSPHERE is already
 * fitted by FOC16-03's own rule in `pause-chapter.css`, which gives the width
 * back from the bar cell).
 *
 * Game case: both (shared pause chrome).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const CSS_DIR = join(HERE, '..', '..', 'src', 'ui', 'common');
const SCREEN = readFileSync(join(CSS_DIR, 'pause-screen.css'), 'utf8');
const CHAPTER = readFileSync(join(CSS_DIR, 'pause-chapter.css'), 'utf8');

/** The `width:` a rule with exactly this selector sets, or undefined. */
function widthOf(sheet: string, selector: string): string | undefined {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|\\n|\\})\\s*${esc}\\s*\\{([^}]*)\\}`).exec(sheet);
  if (!m) return undefined;
  const w = /width:\s*([^;]+);/.exec(m[1]!);
  return w ? w[1]!.trim() : undefined;
}

describe('pause key-column floors (REG-keycol)', () => {
  it('the generic wide key column keeps its 118 px floor', () => {
    expect(widthOf(SCREEN, '.pause__col--wide .pause__k')).toBe('clamp(118px, 9.5vw, 190px)');
  });

  it('only the OPTIONS settings column gets the 150 px floor (PR-0151)', () => {
    expect(widthOf(SCREEN, ".pause__col--wide[data-col='settings'] .pause__k")).toBe('clamp(150px, 9.5vw, 190px)');
    // No other selector raises a wide key column to 150.
    const hits = SCREEN.match(/clamp\(150px/g) ?? [];
    expect(hits.length).toBe(1);
  });

  it("FFX-2's DRESSPHERE key is fitted by the gear column's own rule, not by a wide flag", () => {
    expect(CHAPTER).toContain(".pause__col[data-col='gear']:has(.pause__row[data-row$='-dress']) .pause__k");
    expect(widthOf(CHAPTER, ".pause__col[data-col='gear']:has(.pause__row[data-row$='-dress']) .pause__k")).toBe(
      'var(--pu-gear-key)',
    );
  });
});
