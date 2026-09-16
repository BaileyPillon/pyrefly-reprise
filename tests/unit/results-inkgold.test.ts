// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { itemLabel } from '../../src/ui/common/resultsMath.ts';

const CSS = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../src/ui/common/results.css'),
  'utf8',
);

describe('itemLabel', () => {
  it('reads the FFX registry', () => {
    expect(itemLabel('elixir')).toBe('Elixir');
    expect(itemLabel('phoenix-down')).toBe('Phoenix Down');
  });

  it('title-cases an id no registry knows, rather than printing the slug', () => {
    expect(itemLabel('level-3-key-sphere')).toBe('Level 3 Key Sphere');
  });
});

describe('results.css follows the approved mockup', () => {
  it('cuts the ink wedge and its gold stripe on the mockup polygons', () => {
    expect(CSS).toContain('polygon(62% 0, 100% 0, 100% 100%, 48% 100%)');
    expect(CSS).toContain('polygon(60.6% 0, 62% 0, 48% 100%, 46.6% 100%)');
  });

  it('converts the 1440 grid onto the 640x360 stage (spec / 2.25)', () => {
    expect(CSS).toContain('font-size: 88.89px'); // Victory, 200 @1440
    expect(CSS).toContain('width: 133.33px'); // gold underline, 300
    expect(CSS).toContain('height: 2.67px'); // gold underline, 6
    expect(CSS).toContain('width: 66.67px'); // ledger key column, 150
    expect(CSS).toContain('font-size: 24px'); // ledger value, 54
    expect(CSS).toContain('left: 364.44px'); // standing portrait, 820
    expect(CSS).toContain('height: 400px'); // standing portrait, 900
  });

  it('sets ledger labels in the on-paper accent, not the bright one', () => {
    expect(CSS).toMatch(/\.rres__k \{[^}]*var\(--ig-accent-on-paper/);
  });

  it('keeps the party list clear of the ledger above it', () => {
    // ledger top 146.67 + 3 lines (36.44 + 36.44 + 25.77) must end above the
    // party list, which is bottom-anchored at 24.89 and 74.66 tall.
    const ledgerBottom = 146.67 + 36.44 + 36.44 + 25.77;
    const partyTop = 360 - 24.89 - (3 * 21.33 + 2 * 5.33);
    expect(ledgerBottom).toBeLessThan(partyTop);
  });

  it('mutes every accent in the Chapter 4 silent variant', () => {
    for (const rule of ['.rres--silent .rres__stripe', '.rres--silent .rres__rule', '.rres--silent .rres__k']) {
      expect(CSS).toContain(rule);
    }
    expect(CSS).not.toMatch(/\.rres--silent[^}]*#e3b94a/);
  });
});

describe('tokens.css', () => {
  const tokens = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../../src/ui/inkgold/tokens.css'),
    'utf8',
  );

  it('exposes an on-paper accent that FFX-2 repoints along with the bright one', () => {
    expect(tokens).toMatch(/\.ig \{[\s\S]*--ig-accent-on-paper: var\(--ig-gold-on-paper\)/);
    expect(tokens).toMatch(/\.ig--ffx2 \{[\s\S]*--ig-accent-on-paper: #b8437e/);
  });
});
