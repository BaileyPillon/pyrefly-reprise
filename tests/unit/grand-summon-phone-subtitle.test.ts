/**
 * FOC28-P02 (focused review of 6ea8528f, carried by round 15), FFX only: on a
 * 390x844 phone the Grand Summon subtitle ran 11 px past the panel (box right
 * 373 against the panel's 362) at 5.33 px, and the selected row's x2 was
 * gold-on-paper on the gold accent. Measured after: the subtitle wraps inside
 * the panel at 14 px (box right 342, panel right 366) and the x2 reads in ink.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/ui/ffx/minigames/overdrive-minigames.css', 'utf8');

describe('Grand Summon picker on a phone (FOC28-P02)', () => {
  it('lets the subtitle wrap at the 14 px floor on the FFX phone layout only', () => {
    const rule = /html\[data-phone-battle='ffx'\] \.ffx-mg \.ig-minigame__subtitle \{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(rule).toContain('white-space: normal');
    expect(rule).toContain('font-size: 14px');
  });

  it("inks the selected row's x2 chip", () => {
    expect(css).toMatch(/\.ffx-mg-list__row--selected \.ffx-mg-list__qty \{ color: var\(--ig-ink\); \}/);
  });
});
