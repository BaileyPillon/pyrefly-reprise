// @vitest-environment jsdom
/**
 * The head-crop table is right about the paintings that are actually on disk.
 *
 * This file exists because the round before it shipped a roster of mis-framed
 * faces and had a green test suite while it did. Auron's row put his eye line
 * on his mouth, Seymour's framed his ear with both eyes clipped off the left
 * edge of the tile, Yunalesca's was clamped against the right edge of her
 * painting, and the FFX-2 party rows drew Paine's greatsword where her face
 * belongs for the whole of Chapter 5. The acceptance test that missed all of
 * that was "no tile has bare frame on any edge" — which `cropStyle`'s own cover
 * clamp makes *impossible* to fail, so it measured nothing.
 *
 * What is checked here instead, and why each one can actually fail:
 *
 * 1. **The rows match the files.** Every row records the pixel size of the
 *    painting it was measured on; this reads the real PNG headers out of
 *    `public/art` and fails when one has moved. That is the exact mechanism
 *    that broke Auron — his row was measured against a 671x1216 file and the
 *    art fleet re-rolled every portrait at 832x1216 — and nothing in the build
 *    noticed. Now it does, loudly, at the moment of the re-roll.
 * 2. **The placement honours the row.** Running the shipped `faceCropStyle`
 *    and putting the row's own eye point through the resulting geometry must
 *    land the eyes on the house eye line at the house scale. A row the clamp
 *    has to fight — too big a blow-up, a focal point too near an edge — comes
 *    out of that arithmetic off the line and fails here rather than on screen.
 * 3. **Every reachable dressphere has a row.** The FFX-2 party rows fall back
 *    to a generic "figure is centred, head near the top" estimate, and the
 *    dressphere paintings are not centred figures. A sphere a chapter's build
 *    can reach must be measured, not estimated.
 * 4. **The named regressions stay fixed**, pinned by value with the evidence
 *    beside them, so a revert is a red test and not a re-report.
 *
 * What it does not check is whether a row's numbers are *the eyes* — no test
 * can read a painting. That is what the rig and the acceptance sheet are for:
 *   node tools/portraits/measure-face-crops.mjs accept <out.png>
 * renders every row through this same geometry with the eye line and the
 * eye-to-eye ticks drawn on it, and a row is right when the pupils sit on the
 * crosshair. The sheet for this round is
 * `docs/screenshots/fix3/ffx2-hud-prep/face-crops-acceptance*.png`.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  bodyCrop,
  bodyFaceImgHtml,
  faceCropStyle,
  faceImgHtml,
  measuredBodyIds,
  measuredFilePx,
  measuredPortraitIds,
  portraitCrop,
  refineFaceCropsIn,
} from '../../src/ui/common/portrait.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import faceCropData from '../../src/ui/common/face-crops.json';

/**
 * Rows marked `tight`: the painting is a closer close-up than the house framing,
 * so the tile cannot zoom out far enough and the cover clamp decides. The flag
 * is not an excuse — the test below proves the clamp really is pinning the tile.
 */
const TIGHT = new Set(
  Object.entries(faceCropData.portraits as Record<string, { tight?: boolean }>)
    .filter(([, row]) => row.tight === true)
    .map(([id]) => id),
);

const ROOT = resolve(__dirname, '../..');

/** The house targets, read from the same JSON the module reads. */
const TARGET_EYE_Y = 0.42;
const TARGET_IPD = 0.3;

/**
 * A PNG's dimensions from its header — the IHDR chunk is always the first one,
 * so width and height are two big-endian 32-bit integers at a fixed offset.
 * Done by hand so this suite depends on nothing but the files themselves.
 */
function pngSize(file: string): { w: number; h: number } {
  const head = readFileSync(file).subarray(0, 24);
  expect(head.subarray(1, 4).toString('latin1'), `${file} is a PNG`).toBe('PNG');
  return { w: head.readUInt32BE(16), h: head.readUInt32BE(20) };
}

const portraitFile = (id: string) => resolve(ROOT, 'public/art/portraits', `${id}.png`);
const bodyFile = (id: string) => resolve(ROOT, 'public/art/characters', id, 'idle.png');

/**
 * The geometry `cropStyle` produced, read back out of the style string it
 * emitted — i.e. the numbers the browser will actually lay out with, not a
 * second implementation of the same sum.
 *
 * `height` is `auto` in the markup, so the rendered height follows the source's
 * own aspect from the rendered width; that is why the real file size has to
 * come in from outside.
 */
function placed(style: string, aspect: number, crop: { fx: number; fy: number; ipd: number }) {
  const num = (prop: string): number => {
    const m = new RegExp(`(?:^|;)${prop}:(-?[\\d.]+)%`).exec(style);
    expect(m, `${prop} in ${style}`).not.toBeNull();
    return Number(m![1]);
  };
  const w = num('width');
  const left = num('left');
  const top = num('top');
  const h = w / aspect;
  return {
    w,
    h,
    left,
    top,
    /** Where the measured eye midpoint lands in the square frame, 0..1. */
    eyeX: (left + crop.fx * w) / 100,
    eyeY: (top + crop.fy * h) / 100,
    /** The rendered eye-to-eye distance as a fraction of the frame's width. */
    ipd: (crop.ipd * w) / 100,
    /** True when the painting still covers the frame — no bare edge anywhere. */
    covers: left <= 0.001 && top <= 0.001 && left + w >= 99.999 && top + h >= 99.999,
  };
}

describe('the face-crop table describes the paintings that are on disk', () => {
  it.each(measuredPortraitIds())('%s: the row was measured on the file that shipped', (id) => {
    const { w, h } = pngSize(portraitFile(id));
    // A re-roll that changes the canvas silently invalidates fx/fy/ipd, because
    // they are fractions *of this file*. Re-measure with
    // `node tools/portraits/measure-face-crops.mjs probe <id>` and update
    // src/ui/common/face-crops.json — do not just edit `px`.
    expect(measuredFilePx(id), `portraits/${id}.png is now ${w}x${h}`).toEqual([w, h]);
  });

  it.each(measuredBodyIds())('%s: the body row was measured on the file that shipped', (id) => {
    const { w, h } = pngSize(bodyFile(id));
    expect(measuredFilePx(id, 'body'), `characters/${id}/idle.png is now ${w}x${h}`).toEqual([w, h]);
  });
});

describe('every measured face lands on the house eye line', () => {
  it.each(measuredPortraitIds())('%s', (id) => {
    const crop = portraitCrop(id);
    const { w, h } = pngSize(portraitFile(id));
    const p = placed(faceCropStyle(id), w / h, crop);

    if (TIGHT.has(id)) {
      // The painting forces the miss, and only the painting: the tile is pinned
      // at its widest (the whole file's width) or against the file's top edge.
      const pinned = Math.abs(p.w - 100) < 0.01 || Math.abs(p.top) < 0.01;
      expect(pinned, `${id} is marked tight but nothing pins it: measure it properly`).toBe(true);
      // Still a face in the frame: eyes above the middle, head no bigger than a third over.
      expect(p.eyeY, `${id} eye line`).toBeGreaterThan(TARGET_EYE_Y - 0.07);
      expect(p.eyeY, `${id} eye line`).toBeLessThan(TARGET_EYE_Y + 0.005);
      expect(p.eyeX, `${id} eye midpoint x`).toBeGreaterThan(0.2);
      expect(p.eyeX, `${id} eye midpoint x`).toBeLessThan(0.8);
      expect(p.ipd, `${id} rendered eye separation`).toBeGreaterThan(TARGET_IPD - 0.04);
      expect(p.ipd, `${id} rendered eye separation`).toBeLessThan(TARGET_IPD + 0.1);
      expect(p.covers, `${id} leaves bare frame`).toBe(true);
      return;
    }

    // The eye line is the whole contract: a tile is a face at a shared scale
    // with its eyes on one line, or it is a crop of somebody's hair.
    expect(p.eyeY, `${id} eye line`).toBeCloseTo(TARGET_EYE_Y, 2);
    // Off-centre horizontally is survivable in a way the eye line is not — a
    // near-profile is *meant* to sit off centre — but the face must still be
    // inside the frame with room for a head around it.
    expect(p.eyeX, `${id} eye midpoint x`).toBeGreaterThan(0.2);
    expect(p.eyeX, `${id} eye midpoint x`).toBeLessThan(0.8);
    // One head scale across the roster, within a tolerance that admits the
    // human-equivalent values the one-eyed profiles are measured with.
    expect(p.ipd, `${id} rendered eye separation`).toBeGreaterThan(TARGET_IPD - 0.04);
    expect(p.ipd, `${id} rendered eye separation`).toBeLessThan(TARGET_IPD + 0.04);
    expect(p.covers, `${id} leaves bare frame`).toBe(true);
  });

  it.each(measuredBodyIds())('body %s', (id) => {
    const crop = bodyCrop(id);
    const { w, h } = pngSize(bodyFile(id));
    // Through the markup the FFX-2 party rows actually emit, not through a
    // second call to the geometry — a row that is right in the table and wrong
    // in the `<img>` is still a sword where a face should be.
    const q = placed(bodyStyleFor(id), w / h, crop);
    expect(q.eyeY, `${id} eye line`).toBeCloseTo(TARGET_EYE_Y, 2);
    expect(q.eyeX, `${id} eye midpoint x`).toBeGreaterThan(0.2);
    expect(q.eyeX, `${id} eye midpoint x`).toBeLessThan(0.8);
    expect(q.ipd, `${id} rendered eye separation`).toBeCloseTo(TARGET_IPD, 2);
    expect(q.covers, `${id} leaves bare frame`).toBe(true);
  });
});

/** The inline style `bodyFaceImgHtml` puts on its `<img>`. */
function bodyStyleFor(id: string): string {
  const html = bodyFaceImgHtml(id, '');
  const m = /style="([^"]+)"/.exec(html);
  expect(m, `style on ${html}`).not.toBeNull();
  return m![1]!;
}

describe('every dressphere a chapter can reach has a measured head', () => {
  it('Chapters 4 and 5, every owned sphere with a painting', () => {
    const measured = new Set(measuredBodyIds());
    const missing: string[] = [];
    for (const build of [bevelleBuild, farplaneBuild]) {
      for (const member of build.members) {
        // The row is drawn for whatever sphere she is wearing, and the
        // spherechange wheel can put her in any sphere she owns mid-battle.
        const spheres = new Set([member.currentDressphere, ...(member.owned ?? [])]);
        for (const sphere of spheres) {
          const id = `${member.id}-${sphere}`;
          // Only spheres the art fleet has actually painted can be measured;
          // an unpainted one draws the monogram, which is a different contract.
          let exists = true;
          try {
            pngSize(bodyFile(id));
          } catch {
            exists = false;
          }
          if (exists && !measured.has(id)) missing.push(id);
        }
      }
    }
    expect(missing, 'painted dresspheres with no measured head row').toEqual([]);
  });
});

describe('the regressions this round fixed stay fixed', () => {
  it("Auron's eye line is his eye, not his mouth", () => {
    // His one open amber eye is at (381, 461) of the 832x1216 painting;
    // docs/screenshots/fix3/ffx2-hud-prep/face-crops-acceptance-portraits-1.png
    // is the tile with the crosshair on it. The row this replaced said 0.4735,
    // which is his jaw, and put his crown 29 % of a tile above the frame.
    expect(portraitCrop('auron').fy).toBeCloseTo(461 / 1216, 2);
    expect(portraitCrop('auron').fy).toBeLessThan(0.42);
  });

  it("Seymour's tile is his face, not his ear", () => {
    // Eyes at (221, 392) and (353, 452). The old row's fx of 0.67 is his ear.
    expect(portraitCrop('seymour').fx).toBeCloseTo(287 / 832, 2);
    expect(portraitCrop('seymour').fx).toBeLessThan(0.5);
  });

  it("Yunalesca's tile is not clamped against the right edge of her painting", () => {
    const { w, h } = pngSize(portraitFile('yunalesca'));
    const p = placed(faceCropStyle('yunalesca'), w / h, portraitCrop('yunalesca'));
    // A clamped placement pins one edge exactly, which is how her face ended up
    // pushed a third of a tile off centre.
    expect(p.left).toBeGreaterThan(100 - p.w + 0.01);
  });

  it("Paine's Dark Knight row is her head, not her greatsword", () => {
    // Chapter 5's Paine. Her eyes are at (365, 246) and (397, 255) of a 609x1208
    // file; the generic estimate's fx 0.5 lands on the blade.
    const crop = bodyCrop('paine-dark-knight');
    expect(crop.fx).toBeGreaterThan(0.58);
    expect(crop.fy).toBeCloseTo(251 / 1208, 2);
    // And it must differ from the generic estimate, or nothing was fixed.
    expect(crop.fx).not.toBeCloseTo(bodyCrop('nobody-has-painted-this').fx, 3);
  });

  it('an unmeasured body id still gets the generic top-centre estimate', () => {
    const generic = bodyCrop('vegnagun-head');
    expect(generic.fx).toBe(0.5);
    expect(generic.fy).toBe(0.15);
  });
});

describe('the correction pass reaches portraits this module did not build', () => {
  it('adopts an untagged portrait img and leaves a body layer alone', () => {
    const host = document.createElement('div');
    // What `ui/ffx/portraits.ts` emits for the FFX HUD's CTB tile: the measured
    // style, but no `data-face-crop`, so the refinement pass never saw it.
    host.innerHTML =
      `<img src="/art/portraits/auron.png" data-role="portrait-img" style="${faceCropStyle('auron')};z-index:2" />` +
      `<img src="/art/characters/mortiorchis/idle.png" data-role="portrait-img" data-body-id="mortiorchis" />`;
    refineFaceCropsIn(host);
    const imgs = host.querySelectorAll('img');
    expect(imgs[0]!.getAttribute('data-face-crop')).toBe('auron');
    // The body layer is another module's to correct — it tightens that one from
    // `idle.json` itself — so adoption must not touch it.
    expect(imgs[1]!.hasAttribute('data-face-crop')).toBe(false);
  });

  it('faceImgHtml still tags its own output', () => {
    expect(faceImgHtml('tidus')).toContain('data-face-crop="tidus"');
  });
});
