/**
 * **The minigame layer paints above the guide and the advisor** (critic FOC37-01, release 37). FFX-2 only.
 *
 * Once a player could reach Lady Luck's reels (`ffx2-lady-luck-grid.test.ts`, D-361), the overlay turned out to open
 * on the strategy guide's own corner (top-left, `left: 24.89`, `top: 56`, `width: 320` grid px): at 1600x900 the
 * guide card, `z-index: 3`, was painted over reel 1 and half of the DUD warning, because the minigame layer
 * (`.ffx2hud__minigame`) had no z-index at all. Reel 1 decides the Cherry tier, so it is the one a player most needs.
 *
 * This file parses the sheets (the way `strategy-guide-chip-and-type.test.ts` does) and pins the order the three
 * layers share inside the HUD stage: the guide, then the advisor, then the minigame, then the damage numerals (which
 * stay on top of everything a player is reading). The real-input check at 1600x900, 2000x1012 and 390x844 is in
 * `docs/handoff/r38-lady-luck-grid.md`; the guide and the advisor themselves are untouched.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(resolve(process.cwd(), path), 'utf8');

/** The `z-index` of the (last) rule whose selector is exactly `selector`, or `null` when it sets none. */
function zIndexOf(css: string, selector: string): number | null {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = new RegExp(`(?:^|[}\\s])${escaped}\\s*\\{([^}]*)\\}`, 'g');
  let z: number | null = null;
  for (const m of stripped.matchAll(rule)) {
    const found = /z-index:\s*(-?\d+)/.exec(m[1] ?? '');
    if (found) z = Number(found[1]);
  }
  return z;
}

describe('the FFX-2 minigame layer (Lady Luck reels, Trigger Happy) is above the guide and the advisor', () => {
  const guide = zIndexOf(read('src/ui/common/strategy-guide.css'), '.sgd');
  const advisor = zIndexOf(read('src/ui/common/move-advisor.css'), '.mad');
  const numerals = zIndexOf(read('src/ui/common/damage-numbers.css'), '.dnum-layer');
  const minigame = zIndexOf(read('src/ui/ffx2/ffx2-hud.css'), '.ffx2hud__minigame');

  it('reads the four layers (a renamed selector fails here, not silently)', () => {
    expect([guide, advisor, numerals]).toEqual([3, 4, 6]);
    expect(minigame).not.toBeNull();
  });

  it('the minigame layer sits above the guide card and the advisor card, and below the damage numerals', () => {
    expect(minigame!).toBeGreaterThan(guide!);
    expect(minigame!).toBeGreaterThan(advisor!);
    expect(minigame!).toBeLessThan(numerals!);
  });
});
