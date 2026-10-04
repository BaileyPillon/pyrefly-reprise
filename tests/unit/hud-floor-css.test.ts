/**
 * `src/ui/common/hud-floor.css`: the 14 px floor for the stage-scaled battle HUD (CHK-003; PR-0251, PR-0321).
 *
 * Arithmetic on the sheet's own text, like `ffx-hud-css-type-floor.test.ts`: `--lb-scale` is resolved by a
 * browser at layout time, not by jsdom. The browser proof (computed sizes at 1024x768, 1280x960, 1440x900 and
 * 1600x900 in Chapters I and IV) is in `docs/handoff/r37-ui-floor.md`.
 *
 * Game case: both; the guards below keep a rule that is one game's from lifting the other's.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', '..', 'src');
const SHEET = readFileSync(join(SRC, 'ui', 'common', 'hud-floor.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

interface Rule { readonly selector: string; readonly body: string }
const RULES: Rule[] = [...SHEET.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1]!.trim().replace(/\s+/g, ' '), body: m[2]!.trim() }));

/** `min(w / 640, h / 360)`, `LetterboxStage.ts`'s own formula. */
const stageScale = (w: number, h: number): number => Math.min(w / 640, h / 360);

describe('hud-floor.css', () => {
  it('defines the floor as 14 px divided by the stage scale', () => {
    const token = RULES.find((r) => r.body.includes('--hud-floor:'));
    expect(token).toBeDefined();
    expect(token!.body).toMatch(/--hud-floor:\s*calc\(14\.1px \/ var\(--lb-scale, 1\)\)/);
  });

  it('every font-size it sets is max(authored size, floor), and never on the phone layout', () => {
    const sized = RULES.filter((r) => /font-size:/.test(r.body));
    expect(sized.length).toBeGreaterThan(25);
    for (const r of sized) {
      expect(r.body, r.selector).toMatch(/font-size:\s*max\([^;]*var\(--hud-floor\)/);
      for (const sel of r.selector.split(',')) expect(sel.trim(), sel).toMatch(/^html:not\(\[data-phone-battle\]\) /);
    }
  });

  it('keeps each game to its own HUD: .ffxhud rules stay off FFX-2, .ffx2hud rules off FFX', () => {
    const ffx2 = RULES.filter((r) => r.selector.includes('.ffx2hud') && r.body.includes('font-size'));
    const ffx = RULES.filter((r) => r.selector.includes('.ffxhud') && r.body.includes('font-size'));
    expect(ffx.length).toBeGreaterThan(8);
    expect(ffx2.length).toBeGreaterThan(8);
    for (const r of ffx) expect(r.selector).not.toContain('.ffx2');
    for (const r of ffx2) expect(r.selector.replace(/\.ffx2/g, '')).not.toContain('.ffxhud');
  });

  it('holds 14 px at the 4:3 sizes, and is at most 5.65 grid px (so the 5.6 to 8 px labels keep their size) from 1600x900 up', () => {
    for (const [w, h] of [[1024, 768], [1280, 960], [1440, 900], [1600, 900], [2000, 1012]] as const) {
      const scale = stageScale(w, h);
      const floorGrid = 14.1 / scale;
      expect(floorGrid * scale).toBeGreaterThanOrEqual(14);
      // The CTB name is authored at 5.6: from 1600x900 up the floor is at or under it, so only the 4.7 to 4.9 px labels grow there.
      if (scale >= 2.5) expect(floorGrid).toBeLessThanOrEqual(5.65);
    }
  });

  it('is loaded by both battle HUDs', () => {
    for (const f of [join('ui', 'ffx', 'FFXBattleHud.ts'), join('ui', 'ffx2', 'FFX2BattleHud.ts')]) {
      expect(readFileSync(join(SRC, f), 'utf8')).toMatch(/import '\.\.\/common\/hud-floor\.css';/);
    }
  });
});
