/**
 * Pause faces, option B (both games): Bailey, 24 Sep 2026, "All your
 * recommendations" (`docs/concepts/layout/pause-faces/README.md`). When no
 * legal framing clears a face, the plate slides past its edge on the chrome
 * side, under the falloff, and shrinks only as far as the far edge demands.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { clearFace, FACE_BOXES, FACE_MARGIN, faceInFrame, faceOverlap, faceRectOn, PUSH_SCALE, type Rect } from '../../src/app/screens/pause/faceClear.ts';
import { emptyEdges, frameFace, SLIDE_MIN_SCALE, slideFace, slideFeather, slideMask } from '../../src/app/screens/pause/faceSlide.ts';
import { FaceFramer } from '../../src/app/screens/pause/faceFramer.ts';
import { framePlate, PLATE_FRAMING, type PlateBox } from '../../src/app/screens/pause/plates.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (...p: string[]): string => readFileSync(join(HERE, '..', '..', ...p), 'utf8');

/** The member chrome as Chromium laid it out at 1280x960 (chapter 1, Tidus's tab), left side. */
const LEFT_1280: Rect[] = [
  { left: 51, right: 344, top: 317, bottom: 553 }, // BATTLE STATS
  { left: 383, right: 700, top: 317, bottom: 553 }, // IN THIS FIGHT
  { left: 51, right: 473, top: 28, bottom: 46 }, // brand
  { left: 51, right: 571, top: 749, bottom: 767 }, // eyebrow
  { left: 51, right: 580, top: 780, bottom: 853 }, // objective
  { left: 51, right: 922, top: 58, bottom: 100 }, // the tab strip, as one box
  { left: 1175, right: 1229, top: 74, bottom: 100 }, // R1 / E
  { left: 1087, right: 1229, top: 882, bottom: 904 }, // ESC RESUME
  { left: 1084, right: 1229, top: 914, bottom: 932 }, // H HIDE PANELS
];

/** The two columns and the objective at 1600x900, left side (as `pause-face-clear.test.ts`). */
const LEFT_1600: Rect[] = [
  { left: 62, right: 372, top: 296, bottom: 520 },
  { left: 416, right: 866, top: 296, bottom: 520 },
  { left: 62, right: 564, top: 732, bottom: 780 },
];

/** The same chrome stood on the other side of a frame (a mirrored plate). */
const mirror = (blocks: Rect[], w: number): Rect[] => blocks.map((b) => ({ ...b, left: w - b.right, right: w - b.left }));

/** Clear at zero margin and the whole face on screen, at rest and through the push-in. */
function clears(box: PlateBox, id: string, w: number, h: number, blocks: Rect[]): boolean {
  const face = FACE_BOXES[id]!;
  return faceOverlap(faceRectOn(box, face), blocks, 0) === 0 && faceInFrame(box, face, w, h);
}

describe('the floor', () => {
  it("is the sheet's 0.8x as seen at the end of the push-in", () => {
    expect(SLIDE_MIN_SCALE * PUSH_SCALE).toBeCloseTo(0.8, 6);
  });
});

describe('the three cases Bailey picked B for', () => {
  it('FFX Tidus at 1280x960: slides right under the falloff, face clear and on screen', () => {
    const f = PLATE_FRAMING['tidus']!;
    const base = framePlate(f, 1280, 960);
    expect(clearFace(base, f, FACE_BOXES['tidus'], 1280, 960, LEFT_1280)).toBe(base);
    const box = frameFace(base, f, FACE_BOXES['tidus'], 1280, 960, LEFT_1280);
    expect(box).not.toBe(base);
    expect(clears(box, 'tidus', 1280, 960, LEFT_1280)).toBe(true);
    expect(box.left).toBeGreaterThan(0); // page shows on the chrome side, under the columns
    expect(box.left + box.width).toBeGreaterThanOrEqual(1280); // never on the far side
    expect(box.width).toBeGreaterThanOrEqual(base.width * SLIDE_MIN_SCALE - 0.5);
    expect(box.width).toBeLessThanOrEqual(base.width + 0.5);
  });

  it('FFX Auron at 1280x960 (the chapter eyebrow case) clears', () => {
    const f = PLATE_FRAMING['auron']!;
    const base = framePlate(f, 1280, 960);
    const box = frameFace(base, f, FACE_BOXES['auron'], 1280, 960, LEFT_1280);
    expect(box).not.toBe(base);
    expect(clears(box, 'auron', 1280, 960, LEFT_1280)).toBe(true);
  });

  it('FFX-2 Rikku at 1600x900 slides without shrinking, keeping the full margin', () => {
    const f = PLATE_FRAMING['rikku-ffx2']!;
    const face = FACE_BOXES['rikku-ffx2']!;
    const base = framePlate(f, 1600, 900);
    const box = frameFace(base, f, face, 1600, 900, LEFT_1600);
    expect(box.width).toBeCloseTo(base.width, 3);
    expect(box.left).toBeGreaterThan(0);
    expect(faceOverlap(faceRectOn(box, face), LEFT_1600, FACE_MARGIN)).toBe(0);
    expect(faceInFrame(box, face, 1600, 900)).toBe(true);
    // The shortest slide that clears: the face sits a margin past IN THIS FIGHT, no further.
    expect(faceRectOn(box, face).left - FACE_MARGIN - 866).toBeLessThan(1);
  });

  it('FFX-2 Rikku at 1280x960 clears too', () => {
    const f = PLATE_FRAMING['rikku-ffx2']!;
    const box = frameFace(framePlate(f, 1280, 960), f, FACE_BOXES['rikku-ffx2'], 1280, 960, LEFT_1280);
    expect(clears(box, 'rikku-ffx2', 1280, 960, LEFT_1280)).toBe(true);
  });
});

describe('one rule for every plate', () => {
  const sizes: [number, number][] = [[1280, 960], [1600, 900], [2000, 1012]];

  it('keeps the search framing wherever the search already clears (the four plates that cleared)', () => {
    for (const [id, f] of Object.entries(PLATE_FRAMING)) {
      for (const [w, h] of sizes) {
        const chrome = f.side === 'left' ? scaleTo(LEFT_1280, w, h) : mirror(scaleTo(LEFT_1280, w, h), w);
        const base = framePlate(f, w, h);
        const searched = clearFace(base, f, FACE_BOXES[id], w, h, chrome);
        const framed = frameFace(base, f, FACE_BOXES[id], w, h, chrome);
        const searchClears = faceOverlap(faceRectOn(searched, FACE_BOXES[id]!), chrome) === 0 && faceInFrame(searched, FACE_BOXES[id]!, w, h);
        if (searchClears) expect(framed, `${id} ${w}x${h}`).toEqual(searched);
        else if (framed !== base) expect(clears(framed, id, w, h, chrome), `${id} ${w}x${h}`).toBe(true);
      }
    }
  });

  it('slides a mirrored plate left, leaving the page on the right', () => {
    const f = PLATE_FRAMING['kimahri']!;
    expect(f.side).toBe('right');
    const wide: Rect[] = [{ left: 500, right: 1240, top: 200, bottom: 700 }];
    const base = framePlate(f, 1280, 960);
    expect(clearFace(base, f, FACE_BOXES['kimahri'], 1280, 960, wide)).toBe(base);
    const box = frameFace(base, f, FACE_BOXES['kimahri'], 1280, 960, wide);
    expect(box).not.toBe(base);
    expect(box.left).toBeLessThanOrEqual(0);
    expect(box.left + box.width).toBeLessThan(1280);
    expect(clears(box, 'kimahri', 1280, 960, wide)).toBe(true);
    expect(slideMask(box, 1280, 960)).toContain('to left');
  });

  it('FFX-2 Paine at 1280x960 in chapter 5 (wide IN THIS FIGHT): slides left, below cover but within its 0.8x', () => {
    // Chromium's layout of chapter 5's mirrored chrome: IN THIS FIGHT reaches 481 px from the left.
    const right: Rect[] = [
      { left: 936, right: 1229, top: 317, bottom: 553 },
      { left: 481, right: 897, top: 317, bottom: 553 },
      { left: 675, right: 1229, top: 749, bottom: 785 },
      { left: 845, right: 1229, top: 798, bottom: 871 },
      { left: 51, right: 895, top: 58, bottom: 100 },
      { left: 51, right: 196, top: 882, bottom: 932 },
    ];
    const f = PLATE_FRAMING['paine']!;
    const base = framePlate(f, 1280, 960);
    expect(clearFace(base, f, FACE_BOXES['paine'], 1280, 960, right)).toBe(base);
    const box = frameFace(base, f, FACE_BOXES['paine'], 1280, 960, right);
    expect(clears(box, 'paine', 1280, 960, right)).toBe(true);
    const cover = 960 * (2688 / 1536);
    expect(box.width).toBeGreaterThanOrEqual(cover * SLIDE_MIN_SCALE - 0.5);
    expect(box.left + box.width).toBeLessThan(1280);
  });

  it('keeps the approved framing when not even the slide can clear', () => {
    const f = PLATE_FRAMING['tidus']!;
    const base = framePlate(f, 1280, 960);
    const wall: Rect[] = [{ left: 0, right: 1100, top: 0, bottom: 960 }];
    expect(slideFace(base, f, FACE_BOXES['tidus']!, 1280, 960, wall)).toBeNull();
    expect(frameFace(base, f, FACE_BOXES['tidus'], 1280, 960, wall)).toBe(base);
  });

  it('never slides the phone (portrait frame f)', () => {
    const f = PLATE_FRAMING['rikku-ffx2']!;
    const base = framePlate(f, 390, 844);
    const all: Rect[] = [{ left: 0, right: 390, top: 300, bottom: 600 }];
    expect(frameFace(base, f, FACE_BOXES['rikku-ffx2'], 390, 844, all)).toBe(base);
    expect(slideMask(base, 390, 844)).toBe('');
  });

  it('the FaceFramer the stage uses applies the slide', () => {
    const f = PLATE_FRAMING['rikku-ffx2']!;
    const framed = new FaceFramer().frame('rikku-ffx2', framePlate(f, 1600, 900), f, 1600, 900, LEFT_1600);
    expect(framed.box.left).toBeGreaterThan(0);
  });
});

describe('the feather', () => {
  it('is empty for a plate that covers the frame', () => {
    const base = framePlate(PLATE_FRAMING['tidus']!, 1600, 900);
    expect(emptyEdges(base, 1600, 900)).toEqual({ left: 0, right: 0, top: 0, bottom: 0 });
    expect(slideMask(base, 1600, 900)).toBe('');
  });

  it('fades the uncovered chrome-side edge in over the sheet feather', () => {
    const box = { left: 200, top: 0, width: 1600, height: 960 };
    expect(slideFeather(1280)).toBe(179);
    expect(slideMask(box, 1280, 960)).toBe('linear-gradient(to right, transparent 0px, #000 179px)');
  });

  it('feathers a short plate at the bottom as well, so no hard line shows', () => {
    const box = { left: 200, top: 0, width: 1540, height: 880 };
    const mask = slideMask(box, 1280, 960);
    expect(mask).toContain('to right');
    expect(mask).toContain('to top');
  });

  it('is drawn by its own stylesheet, which the stage imports', () => {
    const css = read('src', 'ui', 'common', 'pause-slide.css');
    expect(css).toMatch(/\.pause__plate--slid\s*\{[^}]*mask-image:\s*var\(--pu-slide-mask\)/);
    expect(css).toMatch(/mask-composite:\s*intersect/);
    const stage = read('src', 'app', 'screens', 'pause', 'PortraitStage.ts');
    expect(stage).toContain("import '../../../ui/common/pause-slide.css';");
    expect(stage).toContain('slideMask(box, w, h)');
  });
});

function scaleTo(blocks: Rect[], w: number, h: number): Rect[] {
  // The columns keep pixel floors, so only the right-hand prompts follow the width.
  return blocks.map((b) => (b.left > 1000 ? { ...b, left: b.left + (w - 1280), right: b.right + (w - 1280) } : b)).map((b) =>
    b.top > 700 ? { ...b, top: b.top + (h - 960), bottom: b.bottom + (h - 960) } : b,
  );
}
