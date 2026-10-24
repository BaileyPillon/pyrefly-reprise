/**
 * R63-PLAY, the overnight fix of the skeptic's m2 (the defeat card, both games: FFX blue and gold, FFX-2 plum and pink; demo mode's "quick retry" card that keeps the scene): at 2560 x 1440 the card was 480 x 175 px
 * with 16 to 18 px type; it is now 712 x 241 px with 28 px type (measured in the served build), and the glass is dense enough that every line reads at 4.5:1 or better even over a white scene.
 * This file pins the numbers in the stylesheet: the type's size at 1440p, the floor on a small screen, and the contrast of each line over the worst scene.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(__dirname, '..', '..', 'src/ui/common/proStage/proDefeat.css'), 'utf8').replace(/\r\n/g, '\n');

/** `clamp(14px, min(1.1vw, 1.95vh), 40px)` evaluated for a viewport. */
function typeSize(w: number, h: number): number {
  const m = /--pdf-text:\s*clamp\((\d+)px,\s*min\(([\d.]+)vw,\s*([\d.]+)vh\),\s*(\d+)px\)/.exec(css);
  expect(m).not.toBeNull();
  const [lo, vw, vh, hi] = [Number(m![1]), Number(m![2]), Number(m![3]), Number(m![4])];
  return Math.min(hi, Math.max(lo, Math.min((vw / 100) * w, (vh / 100) * h)));
}

const lin = (c: number): number => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const lum = (rgb: number[]): number => 0.2126 * lin(rgb[0]!) + 0.7152 * lin(rgb[1]!) + 0.0722 * lin(rgb[2]!);
const contrast = (a: number[], b: number[]): number => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const over = (fg: number[], alpha: number, bg: number[]): number[] => fg.map((v, i) => v * alpha + bg[i]! * (1 - alpha));
const rgba = (s: string): { rgb: number[]; a: number } => {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(s)!;
  return { rgb: [Number(m[1]), Number(m[2]), Number(m[3])], a: m[4] === undefined ? 1 : Number(m[4]) };
};

describe('the defeat card is readable at the booth', () => {
  it('the type is 28 px at 2560 x 1440, 21 px at 1080p and never under 14 px (CHK-003)', () => {
    expect(typeSize(2560, 1440)).toBeGreaterThanOrEqual(28);
    expect(typeSize(1920, 1080)).toBeGreaterThanOrEqual(21);
    expect(typeSize(1280, 720)).toBeGreaterThanOrEqual(14);
    expect(typeSize(640, 360)).toBe(14);
    expect(typeSize(7680, 4320)).toBeLessThanOrEqual(40);
  });

  it('every line of the card is set in that size, the cause, the meta line and both buttons', () => {
    for (const sel of ['\\.pdf__cause', '\\.pdf__meta', '\\.pdf__btn']) {
      const block = new RegExp(`${sel} \\{[^}]*\\}`).exec(css)![0];
      expect(block, sel).toContain('font-size: var(--pdf-text)');
    }
  });

  it('the cause (gold or pink) and the meta line (white) read at 4.5:1 over a white scene, in both skins', () => {
    const skins = [
      { name: 'FFX', glass: /--pdf-glass:\s*(rgba\([^)]*\))/.exec(css)![1]!, cause: [241, 205, 122] },
      { name: 'FFX-2', glass: /\.pdf\.ig--ffx2 \{[^}]*--pdf-glass:\s*(rgba\([^)]*\))/.exec(css)![1]!, cause: [255, 159, 208] },
    ];
    const meta = rgba(/\.pdf__meta \{[^}]*color:\s*(rgba\([^)]*\))/.exec(css)![1]!);
    for (const skin of skins) {
      const g = rgba(skin.glass);
      for (const scene of [[255, 255, 255], [128, 128, 128], [0, 0, 0]]) {
        const bg = over(g.rgb, g.a, scene);
        expect(contrast(skin.cause, bg), `${skin.name} cause over ${scene[0]}`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(over([255, 255, 255], meta.a, bg), bg), `${skin.name} meta over ${scene[0]}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
