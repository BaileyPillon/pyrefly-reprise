// @vitest-environment jsdom
/**
 * Release 39.1, B10 (both games): at 4K the pause painting (3369x1925, the plate never magnifies a master past 1.25x) gets a blurred, darkened
 * extension behind it so it fills the window with no new art. Only while the plate leaves page uncovered and is not slid.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyExtension, extensionAnchor } from '../../src/app/screens/pause/extension.ts';
import { emptyEdges } from '../../src/app/screens/pause/faceSlide.ts';
import { PLATE_FRAMING, framePlate } from '../../src/app/screens/pause/plates.ts';

const ROOT = join(__dirname, '..', '..');

function plate(src: string): HTMLImageElement {
  const img = document.createElement('img');
  img.setAttribute('src', src);
  return img;
}

describe('where the extension is anchored', () => {
  it('on the side the plate is pinned to: left and top at 4K (the empty strip is right and below), the right when the page shows on the left, the middle on both', () => {
    expect(extensionAnchor({ left: 0, top: 0, width: 3360, height: 1920 }, 3840, 2160)).toEqual({ x: 0, y: 0 });
    expect(extensionAnchor({ left: 100, top: 0, width: 1500, height: 900 }, 1600, 900)).toEqual({ x: 100, y: 50 });
    expect(extensionAnchor({ left: 40, top: 30, width: 1000, height: 600 }, 1100, 700)).toEqual({ x: 50, y: 50 });
    expect(extensionAnchor({ left: 0, top: 0, width: 1600, height: 900 }, 1600, 900)).toEqual({ x: 50, y: 50 });
  });
});

describe('turning it on and off for the live plate', () => {
  it('sets the class and the two properties from the plate that is up, and clears them when the plate covers the window', () => {
    const root = document.createElement('div');
    const img = plate('/art/pause/tidus.2x.webp');
    applyExtension(root, img, true, { left: 0, top: 0, width: 3360, height: 1920 }, 3840, 2160);
    expect(root.classList.contains('pause__art--extended')).toBe(true);
    expect(root.style.getPropertyValue('--pu-ext-url')).toBe('url("/art/pause/tidus.2x.webp")');
    expect(root.style.getPropertyValue('--pu-ext-pos')).toBe('0% 0%');
    applyExtension(root, img, false, { left: 0, top: 0, width: 1600, height: 900 }, 1600, 900);
    expect(root.classList.contains('pause__art--extended')).toBe(false);
    expect(root.style.getPropertyValue('--pu-ext-url')).toBe('');
    expect(root.style.getPropertyValue('--pu-ext-pos')).toBe('');
  });

  it('does nothing while the plate has no file yet, and escapes a quote in the address', () => {
    const root = document.createElement('div');
    applyExtension(root, document.createElement('img'), true, { left: 0, top: 0, width: 3360, height: 1920 }, 3840, 2160);
    expect(root.classList.contains('pause__art--extended')).toBe(false);
    applyExtension(root, plate('/a"b.png'), true, { left: 0, top: 0, width: 3360, height: 1920 }, 3840, 2160);
    expect(root.style.getPropertyValue('--pu-ext-url')).toBe('url("/a%22b.png")');
  });
});

describe('which windows get it (the real framing of every shipped plate)', () => {
  it('3840x2160 and 3440x1440 leave page past the plate; every window up to 3,360 px wide does not', () => {
    const wants = (w: number, h: number): boolean[] =>
      Object.values(PLATE_FRAMING).map((f) => {
        const box = framePlate(f, w, h);
        return Object.values(emptyEdges(box, w, h)).some((v) => v > 0);
      });
    expect(wants(3840, 2160).every(Boolean)).toBe(true);
    expect(wants(3440, 1440).every(Boolean)).toBe(true);
    for (const [w, h] of [[1280, 720], [1600, 900], [1920, 1080], [2560, 1080], [2560, 1440], [3200, 1800]] as const) expect(wants(w, h).some(Boolean), `${w}x${h}`).toBe(false);
  });

  it('the plate at 4K is the 3360x1920 the review measured (3369x1925 with the push-in), pinned top left', () => {
    const box = framePlate(PLATE_FRAMING['tidus']!, 3840, 2160);
    expect(Math.round(box.width)).toBe(3360);
    expect(Math.round(box.height)).toBe(1920);
    expect(box.left).toBe(0);
    expect(box.top).toBe(0);
  });
});

describe('the stylesheet', () => {
  const css = readFileSync(join(ROOT, 'src/ui/common/pause-slide.css'), 'utf8');
  const stage = readFileSync(join(ROOT, 'src/app/screens/pause/PortraitStage.ts'), 'utf8');

  it('paints the copy on a pseudo-element of the art container, blurred and darker than the plate, never on the master', () => {
    const rule = /\.pause__art--extended::before\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(rule).toContain('var(--pu-ext-url)');
    expect(rule).toMatch(/blur\(/);
    expect(Number(/brightness\(([0-9.]+)\)/.exec(rule)?.[1])).toBeLessThan(0.66); // darker than the plate's own 0.66
    expect(rule).toContain('pointer-events: none');
  });

  it('is applied by the stage to the live plate only, and only for a capped (not slid) one', () => {
    expect(stage).toMatch(/if \(live\) applyExtension\(this\.root, img, capped, box, w, h\)/);
    expect(stage).toMatch(/const capped = !box\.slid &&/);
  });
});
