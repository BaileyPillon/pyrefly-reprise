/**
 * Test 12 of the FFX-2 Special look (step D1; game case: FFX-2 only: the three Special dresspheres exist only in FFX-2): the part tile is a crop of the figure's idle painting, cut at
 * the part's own region, and no placeholder face ever draws as the final face (CHK-012).
 *
 * `partCropOf` is the one reader of the generated parts table (`data/art/specialParts.ts`, `poses.idle.<role>.crop`, fractions of the painting). The measured boxes below are the
 * preflight's (Appendix A, `preflight/layers.json`), given as fractions of the WHOLE figure; the table's `whole.box` (painting pixels) turns them into painting fractions.
 *
 * Removal check: delete a part's `idle` row and `partCropOf` returns `undefined` (the first case fails); swap the two roles' boxes and the region case fails.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SPECIAL_PARTS, type SpecialPartsId } from '../../src/data/art/specialParts.ts';
import { partCropOf, partCropStyle, type PartCrop } from '../../src/ui/ffx2/partCrop.ts';

const SPECIALS: SpecialPartsId[] = ['floral-fallal', 'machina-maw', 'full-throttle'];
type Box = readonly [number, number, number, number];

/** The preflight's idle-1 boxes of each part, as fractions of the whole figure. */
const MEASURED: Record<SpecialPartsId, { right: Box; left: Box }> = {
  'floral-fallal': { right: [0.15, 0.524, 0.541, 0.859], left: [0.588, 0.47, 0.999, 0.789] },
  'machina-maw': { right: [0.014, 0.336, 0.544, 0.998], left: [0.33, 0.177, 0.891, 0.872] },
  'full-throttle': { right: [0.073, 0.235, 0.554, 0.828], left: [0.573, 0.17, 0.96, 0.759] },
};

/** A figure-fraction box as painting fractions, through the table's `whole.box` (painting pixels). */
function inPainting(special: SpecialPartsId, b: Box): Box {
  const idle = SPECIAL_PARTS[special].poses['idle']!;
  const [wx0, wy0, wx1, wy1] = idle.whole.box;
  const { width, height } = idle.paint;
  const [x0, y0, x1, y1] = b;
  return [(wx0 + x0 * (wx1 - wx0)) / width, (wy0 + y0 * (wy1 - wy0)) / height, (wx0 + x1 * (wx1 - wx0)) / width, (wy0 + y1 * (wy1 - wy0)) / height];
}

const centre = (b: Box): [number, number] => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
const within = (p: [number, number], b: Box, slack: number): boolean => p[0] >= b[0] - slack && p[0] <= b[2] + slack && p[1] >= b[1] - slack && p[1] <= b[3] + slack;

describe('the six crops of the three Specials', () => {
  for (const special of SPECIALS) {
    for (const role of ['right', 'left'] as const) {
      const other = role === 'right' ? 'left' : 'right';

      it(`${special} ${role}: a box inside the painting, and different from the other part's`, () => {
        const c = partCropOf(special, role);
        expect(c, 'the table has an idle row').toBeDefined();
        const [x0, y0, x1, y1] = c!.box;
        expect(0 <= x0 && x0 < x1 && x1 <= 1, `x ${x0} ${x1}`).toBe(true);
        expect(0 <= y0 && y0 < y1 && y1 <= 1, `y ${y0} ${y1}`).toBe(true);
        expect(c!.box).not.toEqual(partCropOf(special, other)!.box);
        expect(c!.art).toBe(SPECIAL_PARTS[special].artId);
        expect([c!.paintW, c!.paintH]).toEqual([SPECIAL_PARTS[special].poses['idle']!.paint.width, SPECIAL_PARTS[special].poses['idle']!.paint.height]);
      });

      it(`${special} ${role}: the crop's centre lies in the part's own measured region and outside the other part's`, () => {
        const c = partCropOf(special, role)!;
        const mine = inPainting(special, MEASURED[special][role]);
        const theirs = inPainting(special, MEASURED[special][other]);
        const at = centre(c.box);
        expect(within(at, mine, 0.05), `centre ${at} within 0.05 of [${mine}]`).toBe(true);
        expect(within(at, theirs, 0), `centre ${at} outside [${theirs}]`).toBe(false);
      });
    }
  }

  it('an unknown Special, or a Special without an idle row, has no crop (the tile then shows only its monogram floor)', () => {
    expect(partCropOf('no-such-special', 'right')).toBeUndefined();
  });
});

describe('partCropStyle', () => {
  it('a square box in a square painting: width = 100 / w, left = -100 x0 / w, top = -100 y0 / w', () => {
    const c: PartCrop = { art: 'a', paintW: 1000, paintH: 1000, box: [0.25, 0.5, 0.5, 0.75] };
    expect(partCropStyle(c)).toBe('position:absolute;left:-100.00%;top:-200.00%;width:400.00%;height:400.00%;max-width:none;object-fit:fill;z-index:2');
  });

  it('a non-square box: the smaller side fills the tile, the box stays centred', () => {
    // box 0.5 wide and 0.25 tall in a 1000 x 1000 painting: the tall side is the smaller, so the scale is 1 / 250 px
    const c: PartCrop = { art: 'a', paintW: 1000, paintH: 1000, box: [0, 0.25, 0.5, 0.5] };
    // width = 100 * 1000 / 250 = 400 %; the box centre is x = 0.25 -> left = 50 - 100 * 0.25 * 1000 / 250 = -50; y centre 0.375 -> top = 50 - 100 * 0.375 * 4 = -100
    expect(partCropStyle(c)).toBe('position:absolute;left:-50.00%;top:-100.00%;width:400.00%;height:400.00%;max-width:none;object-fit:fill;z-index:2');
  });

  it('a painting that is not square keeps both axes honest', () => {
    const c: PartCrop = { art: 'a', paintW: 2000, paintH: 1000, box: [0.5, 0, 0.75, 0.5] };
    // cw = 500 px, ch = 500 px -> s = 1/500; width = 100 * 2000 / 500 = 400, height = 100 * 1000 / 500 = 200; left = 50 - 100 * 0.625 * 2000 / 500 = -200; top = 50 - 100 * 0.25 * 1000 / 500 = 0
    expect(partCropStyle(c)).toBe('position:absolute;left:-200.00%;top:0.00%;width:400.00%;height:200.00%;max-width:none;object-fit:fill;z-index:2');
  });

  it('refuses a box that is not inside the painting', () => {
    for (const box of [[0.5, 0, 0.5, 1], [-0.1, 0, 0.5, 1], [0, 0, 1.2, 1], [0.6, 0.1, 0.5, 0.9]] as const) {
      expect(() => partCropStyle({ art: 'a', paintW: 10, paintH: 10, box })).toThrow();
    }
  });
});

describe('the portraits spec and the atb-live test are untouched, and the painted layer sits above the monogram floor', () => {
  it('the painted layer\'s z-index is greater than the monogram floor\'s', () => {
    const css = readFileSync(resolve(__dirname, '..', '..', 'src', 'ui', 'ffx2', 'ffx2-hud.css'), 'utf8');
    const mono = /\.ffx2stat__mono\s*\{[^}]*z-index:\s*(\d+)/.exec(css);
    expect(mono, 'the monogram floor has a z-index').not.toBeNull();
    const style = partCropStyle(partCropOf('floral-fallal', 'right')!);
    const img = /z-index:(\d+)/.exec(style);
    expect(Number(img![1])).toBeGreaterThan(Number(mono![1]));
  });
});
