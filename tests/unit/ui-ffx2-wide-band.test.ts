// @vitest-environment jsdom
/**
 * At a wider-than-16:9 window the FFX-2 frame is full-bleed: the grain and
 * vignette cover the viewport, and the command-help band runs edge to edge
 * (critic round 13 PR-0135).
 *
 * Before: both lived inside the 640x360 stage, letterboxed into a 16:9 box, so
 * at 2000x1012 and 2560x1080 the vignette stopped in a hard vertical edge
 * (a flat strip either side of the field) and the band stopped short of both
 * edges.
 *
 * **Game case: FFX-2 only** (the FFX-2 HUD). FFX's `ig-surface` is mounted by
 * `ui/ffx/FFXBattleHud.ts`, another batch's file.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { bandGeometry } from '../../src/ui/ffx2/commandHelpBand.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHEET = readFileSync(join(HERE, '..', '..', 'src', 'ui', 'ffx2', 'ffx2-hud.css'), 'utf8');

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FFX-2 full-bleed frame (PR-0135)', () => {
  it('mounts the grain and vignette on the HUD root, not inside the 16:9 stage', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const hud = new FFX2BattleHud();
    hud.mount(root);
    const surface = root.querySelector('.ig-surface');
    expect(surface).not.toBeNull();
    expect(surface!.closest('.ffx2hud__stage')).toBeNull();
    expect(surface!.parentElement?.classList.contains('ffx2hud')).toBe(true);
    hud.unmount();
  });

  it('the band reaches into both pillars at a wide window, and still clears the PAUSE chip', () => {
    // 2560x1080: scale 3, the stage is 1920 wide, 320 px of pillar a side (106.67 grid units).
    const scale = 3;
    const noChip = bandGeometry({ scale, stageX: 320, stageY: 0, hostLeft: 0 });
    expect(noChip.mode).toBe('stage');
    expect(noChip.left).toBeCloseTo(-320 / scale, 1);
    expect(noChip.pillar).toBeCloseTo(320 / scale, 1);
    const chip = bandGeometry({ scale, stageX: 320, stageY: 0, hostLeft: 0, pauseChip: { left: 0, top: 0, right: 60, bottom: 20 } });
    expect(chip.left * scale + 320).toBeGreaterThan(60); // starts right of the chip
    expect(chip.left).toBeLessThan(0); // but still out in the pillar
  });

  it('a 16:9 window is unchanged: no pillar, band from the chip', () => {
    const g = bandGeometry({ scale: 2.5, stageX: 0, stageY: 0, hostLeft: 0 });
    expect(g.left).toBe(0);
    expect(g.pillar).toBe(0);
  });

  it('the stylesheet extends the band right by the pillar', () => {
    expect(SHEET).toMatch(/\.ffx2-cmd-info \{[^}]*right:\s*calc\(-1 \* var\(--band-pillar, 0px\)\)/);
  });
});
