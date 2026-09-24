/**
 * PR-0012 repair (FFX-2 only; FFX's slab, `src/ui/ffx/commandHelp.ts`, is a
 * separate component and untouched). The independent check of 3fc3a931 found
 * the new top-of-screen help band:
 *
 * - printing a Change row's raw dressphere id (`black-mage`) as its label;
 * - printing "White Magic Lv. 2" as the Lv. 2 passive's own description;
 * - reading buffs as "Inflicts Shell";
 * - under the PAUSE chip at 1280x720 / 1600x900, and unreadable (text under
 *   4 px) at 390x844.
 *
 * Each is pinned here; the layout ones as the pure geometry the HUD applies
 * (jsdom has no layout), the real-screen proof is the GPU acceptance under
 * `docs/screenshots/picks/`.
 */
import { describe, expect, it } from 'vitest';
import type { AvailableCommand } from '../../src/battle/common/types.ts';
import { helpLabel } from '../../src/ui/ffx2/CommandMenu.ts';
import { commandEffectText } from '../../src/ui/ffx2/commandHelp.ts';
import { BAND_GRID_TEXT, MIN_TEXT_PX, bandBarRect, bandGeometry, bandReserve } from '../../src/ui/ffx2/commandHelpBand.ts';

function ability(id: string, label: string): AvailableCommand {
  return { command: { kind: 'ability', id, targets: [] }, label, category: 'whitemagic', mpCost: 0, enabled: true, validTargets: [] } as unknown as AvailableCommand;
}

describe('FFX-2 help band: labels', () => {
  it('names a Change row by the dressphere name the row shows, not the raw id', () => {
    const row = {
      command: { kind: 'spherechange', targets: [], extra: { toDressphere: 'black-mage', toNode: 3, gatesCrossed: [] } },
      label: 'black-mage',
      category: 'dressphere',
      mpCost: 0,
      enabled: true,
      validTargets: [],
    } as unknown as AvailableCommand;
    expect(helpLabel(row)).toBe('Black Mage');
  });

  it('leaves an ordinary row\'s label alone', () => {
    expect(helpLabel(ability('x2-white-mage-cure', 'Cure'))).toBe('Cure');
  });
});

describe('FFX-2 help band: descriptions', () => {
  it('describes the Lv. 2 / Lv. 3 passives from their record, not by their own name', () => {
    expect(commandEffectText(ability('x2-white-mage-lv2', 'White Magic Lv. 2'))).toBe('Passive: White Magic charge time −30%');
    expect(commandEffectText(ability('x2-white-mage-lv3', 'White Magic Lv. 3'))).toBe('Passive: White Magic charge time −50%');
  });

  it('says party buffs are granted, not inflicted', () => {
    expect(commandEffectText(ability('x2-white-mage-shell', 'Shell'))).toBe('Grants Shell to the party');
    expect(commandEffectText(ability('x2-white-mage-protect', 'Protect'))).toBe('Grants Protect to the party');
    expect(commandEffectText(ability('x2-white-mage-reflect', 'Reflect'))).toBe('Grants Reflect to the party');
    expect(commandEffectText(ability('x2-white-mage-regen', 'Regen'))).toMatch(/^Grants Regen/);
    for (const id of ['shell', 'protect', 'reflect', 'regen']) {
      expect(commandEffectText(ability(`x2-white-mage-${id}`, id))).not.toMatch(/inflicts/i);
    }
  });

  it('keeps the other White Magic rows as they were', () => {
    expect(commandEffectText(ability('x2-white-mage-cure', 'Cure'))).toMatch(/^Restores HP/);
  });
});

describe('FFX-2 help band: geometry', () => {
  it('starts to the right of the PAUSE chip when the chip shares its row (1280x720)', () => {
    const input = { scale: 2, stageX: 0, stageY: 0, pauseChip: { left: 22, top: 18, right: 94, bottom: 40 } };
    const g = bandGeometry(input);
    expect(g.mode).toBe('stage');
    expect(g.left * 2).toBeGreaterThan(94);
    expect(bandReserve(g, input)).toBeCloseTo(17.33 * 2);
  });

  it('stays full width when there is no chip on its row', () => {
    const g = bandGeometry({ scale: 2.5, stageX: 0, stageY: 0, pauseChip: null });
    expect(g).toEqual({ mode: 'stage', left: 0, zoom: 1 });
  });

  it('moves into the bar above a portrait letterbox and zooms to a readable size (390x844)', () => {
    const scale = Math.min(390 / 640, 844 / 360);
    const input = { scale, stageX: 0, stageY: (844 - 360 * scale) / 2, pauseChip: { left: 22, top: 18, right: 94, bottom: 40 } };
    const g = bandGeometry(input);
    expect(g.mode).toBe('bar');
    expect(BAND_GRID_TEXT * scale * g.zoom).toBeGreaterThanOrEqual(MIN_TEXT_PX - 1e-6);
    expect(bandReserve(g, input)).toBe(0);
    const bar = bandBarRect(g, input, 40);
    expect(bar?.bottom).toBeCloseTo(input.stageY);
    // The PAUSE chip (top 18..40) is far above the bar.
    expect(bar!.top).toBeGreaterThan(40);
  });
});
