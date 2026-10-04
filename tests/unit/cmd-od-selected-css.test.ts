/**
 * PR-0325 (round 19, CHK-010; game case: both): a selected Overdrive-styled command row takes the selected face.
 *
 * `.ig-cmd--overdrive` is declared after `.ig-cmd--selected` in `inkgold/slabs.css`, so on the row the cursor was
 * on it won the cascade and kept its ink face. Browser proof (1600x900, real keys, Kimahri's OVERDRIVE list in
 * Chapter I, FFX-2's CHANGE row in Chapter IV): `docs/handoff/r37-ui-floor.md`. This pins the sheet's text: the
 * rule exists, it is excluded on the phone (which draws its own selection), it is loaded by both HUDs, and the gold
 * marks inside the row turn ink so they do not vanish into the fill.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');
const SHEET = readFileSync(join(SRC, 'ui', 'common', 'cmd-od-selected.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const SLABS = readFileSync(join(SRC, 'ui', 'inkgold', 'slabs.css'), 'utf8');

describe('cmd-od-selected.css', () => {
  it('gives the selected overdrive row the accent fill and an ink label, off the phone', () => {
    expect(SHEET).toMatch(/html:not\(\[data-phone-battle\]\) \.ig-cmd--overdrive\.ig-cmd--selected\s*\{\s*background:\s*var\(--ig-accent\);\s*color:\s*var\(--ig-ink\);/);
  });

  it('turns the FFX gold marks inside that row ink (chevron, cost chip, READY), and only under .ffxhud', () => {
    for (const sel of ['.ffx-cmd__chev', '.ffx-cmd__badge', '.ffx-cmd__badge--ready', '.ig-cmd__ready']) {
      expect(SHEET).toContain(`.ffxhud .ig-cmd--overdrive.ig-cmd--selected ${sel}`);
    }
    expect(SHEET).not.toContain('.ffx2hud');
  });

  it('is what the shared sheet needs: slabs.css declares .ig-cmd--overdrive after .ig-cmd--selected, with the same weight', () => {
    expect(SLABS.indexOf('.ig-cmd--selected {')).toBeGreaterThan(-1);
    expect(SLABS.indexOf('.ig-cmd--overdrive {')).toBeGreaterThan(SLABS.indexOf('.ig-cmd--selected {'));
  });

  it('is loaded by both battle HUDs', () => {
    for (const f of [join('ui', 'ffx', 'FFXBattleHud.ts'), join('ui', 'ffx2', 'FFX2BattleHud.ts')]) {
      expect(readFileSync(join(SRC, f), 'utf8')).toMatch(/import '\.\.\/common\/cmd-od-selected\.css';/);
    }
  });
});
