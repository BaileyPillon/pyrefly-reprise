/**
 * The title's parallax planes against the Gullwings key art (2026-10-05, both games: the title is shared).
 *
 * The near plane is the same painting drawn again, larger and moved further by the pointer, and masked in CSS to the
 * foreground flower band. If that band reached up over Yuna, Rikku or Paine, the lower half of a hero would be drawn from the
 * near copy (a different size and offset) and the upper half from the far one: a figure split between two planes, which Bailey's
 * brief names as a defect. This reads the shipped stylesheet and checks, on the numbers, that it cannot happen:
 *
 * - the mask is a picture registered with the painting (`mask-size: cover`, the same anchor as the <img>'s `object-position`),
 *   not a gradient on the box, so it stays on the painting in every window shape (at 2560x1080 a box gradient lands on the faces);
 * - the mask is nothing over every hero's lowest pixel plus the worst-case slide of the near plane against the far one;
 * - it is soft (no hard edge) and full at the bottom.
 *
 * No browser: the stylesheet's own text and the parallax constants are the inputs. The pictures (docs/screenshots/title-gullwings-*.png)
 * were checked by eye at both parallax extremes; this keeps a later edit from undoing that without a failing test.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', '..', 'src', 'app', 'screens');
const SHEET = readFileSync(join(SRC, 'frontend', 'frontend.css'), 'utf8').replace(/\r\n/g, '\n');
const REVEAL_CSS = readFileSync(join(SRC, 'frontend', 'title-reveal.css'), 'utf8').replace(/\r\n/g, '\n');
const TITLE_SCREEN = readFileSync(join(SRC, 'TitleScreen.ts'), 'utf8').replace(/\r\n/g, '\n');
const PARALLAX = readFileSync(join(SRC, 'frontend', 'parallax.ts'), 'utf8').replace(/\r\n/g, '\n');

/** The three heroes of `public/art/title/keyart.png`, as fractions of the painting (u across, v down); `bottom` is the lowest pixel (Paine's sword tip is the lowest of all). */
const HEROES = [
  { name: 'Yuna', u0: 0.1, u1: 0.2, bottom: 0.745 },
  { name: 'Rikku', u0: 0.2, u1: 0.295, bottom: 0.77 },
  { name: 'Paine (and his sword)', u0: 0.29, u1: 0.415, bottom: 0.825 },
] as const;

function nearBlock(): string {
  const m = /\.fe-title__plane--near\s*\{([^}]*)\}/.exec(SHEET);
  expect(m, 'the .fe-title__plane--near rule').not.toBeNull();
  return m![1]!;
}

/** The mask's gradient stops, in painting height: `offset` is v, `opacity` the mask's alpha there. */
function maskStops(): Array<{ v: number; alpha: number }> {
  const svg = /--fe-near-mask:\s*url\("data:image\/svg\+xml;utf8,([^"]+)"\)/.exec(nearBlock());
  expect(svg, 'the near plane declares --fe-near-mask as an SVG picture').not.toBeNull();
  const stops = [...svg![1]!.matchAll(/<stop offset='([\d.]+)' stop-color='[^']*' stop-opacity='([\d.]+)'\/>/g)].map((m) => ({
    v: Number(m[1]),
    alpha: Number(m[2]),
  }));
  expect(stops.length).toBeGreaterThanOrEqual(5);
  return stops;
}

/** The SVG gradient at painting height `v`: linear between stops, padded with the first and last. */
function alphaAt(stops: Array<{ v: number; alpha: number }>, v: number): number {
  if (v <= stops[0]!.v) return stops[0]!.alpha;
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1]!;
    const b = stops[i]!;
    if (v <= b.v) return a.alpha + ((b.alpha - a.alpha) * (v - a.v)) / (b.v - a.v);
  }
  return stops[stops.length - 1]!.alpha;
}

describe('the near plane is cut to the foreground flowers, registered with the painting', () => {
  it('draws the mask as a picture sized and anchored like the <img>, not as a gradient on the box', () => {
    const block = nearBlock();
    expect(block).toMatch(/mask-image:\s*var\(--fe-near-mask\);/);
    expect(block).toMatch(/mask-size:\s*cover;/);
    expect(block).toMatch(/mask-position:\s*var\(--fe-art-x\)\s+var\(--fe-art-y\);/);
    expect(block).toMatch(/mask-repeat:\s*no-repeat;/);
    // A `linear-gradient` mask is measured against the box and slides down the heroes on every window that is not 16:9.
    expect(block).not.toMatch(/mask-image:\s*linear-gradient/);
    // The <img> is cropped at the same anchor, or the mask and the painting would part company in a window of another shape.
    expect(SHEET).toMatch(/\.fe-title__plane img \{[^}]*object-position:\s*var\(--fe-art-x\)\s+var\(--fe-art-y\);/);
    // The placeholder under the far plane is cropped like it too.
    expect(REVEAL_CSS).toMatch(
      /background:\s*var\(--fe-title-ph, none\)\s+var\(--fe-art-x, 50%\)\s+var\(--fe-art-y, 50%\)\s*\/\s*cover/,
    );
  });

  it('is the 1344x768 plate: the SVG has the painting’s own ratio, so `cover` crops it exactly like the <img>', () => {
    const svg = /--fe-near-mask:\s*url\("data:image\/svg\+xml;utf8,([^"]+)"\)/.exec(nearBlock())![1]!;
    expect(svg).toContain("viewBox='0 0 1344 768'");
    expect(svg).toContain("preserveAspectRatio='none'");
  });

  it('is nothing over any hero, the slide of the near plane against the far one included', () => {
    const stops = maskStops();
    // The pointer moves the near plane `depth * ampY` px and the far one `depth * ampY`: the gap is how far the band can rise over the feet.
    const ampY = Number(/this\.ampY = opts\.amplitudeY \?\? (\d+(?:\.\d+)?)/.exec(PARALLAX)![1]);
    const far = /\{ el: far, depth: ([\d.]+), scale: ([\d.]+) \}/.exec(TITLE_SCREEN)!;
    const near = /\{ el: near, depth: ([\d.]+), scale: ([\d.]+) \}/.exec(TITLE_SCREEN)!;
    const slidePx = ampY * (Number(near[1]) - Number(far[1]));
    // The smallest window the title is shown in (a short phone is 640 high; 600 leaves room); the slide is a fixed number of px, so the shortest window is the worst case.
    const slideV = slidePx / 600;
    expect(slideV).toBeLessThan(0.02);
    // The near plane is held larger than the far one, which pushes its band DOWN on screen (the band is below the centre), never up.
    expect(Number(near[2])).toBeGreaterThanOrEqual(Number(far[2]));
    for (const hero of HEROES) {
      const where = alphaAt(stops, hero.bottom + slideV);
      expect(where, `${hero.name}: the mask at ${(hero.bottom + slideV).toFixed(3)} of the painting's height`).toBeLessThanOrEqual(0.005);
    }
  });

  it('is soft, and full at the bottom edge', () => {
    const stops = maskStops();
    expect(stops[0]!.alpha).toBe(0);
    expect(alphaAt(stops, 1)).toBe(1);
    let maxStep = 0;
    for (let i = 1; i < stops.length; i++) maxStep = Math.max(maxStep, stops[i]!.alpha - stops[i - 1]!.alpha);
    // No stop jumps by more than 0.3: two copies of crisp blossoms never line up, so a hard edge would show the seam.
    expect(maxStep).toBeLessThanOrEqual(0.3);
    // And the ramp does not stretch out over the lower third: it is the foreground band, not a wash over the field.
    const startsAt = stops.find((s) => s.alpha > 0)!.v;
    expect(startsAt).toBeGreaterThan(0.84);
    expect(alphaAt(stops, 0.94)).toBe(1);
  });

  it('keeps the heroes on screen when a window is narrower than the painting', () => {
    // --fe-art-x anchors the cover crop. At a window `a` times as wide as it is tall, the visible fraction of the painting's width
    // is vf = a / 1.75, and its left edge is x * (1 - vf). The three heroes (u 0.10 to 0.415) must be inside down to 4:3.
    const desktop = Number(/\.fe-title \{\s*--fe-art-x:\s*(\d+)%;/.exec(SHEET)![1]) / 100;
    const vf43 = 4 / 3 / 1.75;
    const left43 = desktop * (1 - vf43);
    expect(left43).toBeLessThanOrEqual(0.1);
    expect(left43 + vf43).toBeGreaterThanOrEqual(0.415);
    // The phone block moves the anchor so that all three HEADS stay in frame in a 390x844 window (heads u 0.128 to 0.357).
    const phoneBlock = SHEET.slice(SHEET.indexOf('@media (max-width: 760px), (max-aspect-ratio: 3 / 4)'));
    const phone = Number(/\.fe-title \{\s*--fe-art-x:\s*(\d+)%;/.exec(phoneBlock)![1]) / 100;
    const vfPhone = 390 / 844 / 1.75;
    const leftPhone = phone * (1 - vfPhone);
    expect(leftPhone).toBeLessThanOrEqual(0.128);
    expect(leftPhone + vfPhone).toBeGreaterThanOrEqual(0.357);
  });
});

describe('the far plane and its 32 px placeholder are graded by one value', () => {
  it('declares --fe-title-grade once and uses it in both places', () => {
    expect(SHEET.match(/--fe-title-grade:/g) ?? []).toHaveLength(1);
    expect(SHEET).toMatch(/\.fe-title__plane--far img \{\s*filter:\s*var\(--fe-title-grade\);/);
    expect(REVEAL_CSS).toMatch(/filter:\s*var\(--fe-title-grade, saturate\(1\)\)\s+blur\(10px\);/);
  });
});
