// @vitest-environment jsdom
/**
 * The title card's motion — `src/app/screens/frontend/parallax.ts` and
 * `motes.ts`, plus the markup in `titleMarkup.ts`.
 *
 * Approved end state: docs/concepts/polish/showpiece-frontend/after.png and
 * its motion.webm. The facts pinned here are the ones the card names as its
 * risk and the ones the brief makes conditions: the drift is slow, it only
 * ever writes transforms, and reduced motion is the **still** composition —
 * which is after.png itself.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { MoteField } from '../../src/app/screens/frontend/motes.ts';
import { ParallaxField, normalisePointer } from '../../src/app/screens/frontend/parallax.ts';
import {
  TITLE_PLATE,
  titleMarkup,
  titlePlateSizes,
  upgradeTitlePlanes,
} from '../../src/app/screens/frontend/titleMarkup.ts';
import {
  resetArtManifest,
  setArtManifest,
  type ArtManifest,
} from '../../src/engine/ArtManifest.ts';
import { artUrl } from '../../src/engine/PaintedArt.ts';

function layer(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

function translateX(el: HTMLElement): number {
  const m = /translate3d\((-?[\d.]+)px/.exec(el.style.transform);
  return m ? Number(m[1]) : NaN;
}

describe('ParallaxField', () => {
  it('writes only a transform — never a property that costs a layout', () => {
    const el = layer();
    const field = new ParallaxField({ layers: [{ el, depth: 1, scale: 1.11 }] });
    field.setPointer(1, 1);
    for (let i = 0; i < 60; i++) field.update(1 / 60);
    expect(el.style.transform).toMatch(/^translate3d\(/);
    // `style` holds exactly one declaration, and it is the transform.
    expect(Array.from(el.style)).toEqual(['transform']);
  });

  it('moves a near plane further than a far one, in the direction of the pointer', () => {
    const far = layer();
    const near = layer();
    const field = new ParallaxField({
      layers: [
        { el: far, depth: 0.35, scale: 1.045 },
        { el: near, depth: 1, scale: 1.11 },
      ],
    });
    field.setPointer(1, 0);
    for (let i = 0; i < 120; i++) field.update(1 / 60);
    expect(translateX(near)).toBeLessThan(0);
    expect(Math.abs(translateX(near))).toBeGreaterThan(Math.abs(translateX(far)));
  });

  it('is slow: unattended, the front plane never travels 4px in any second of a full cycle', () => {
    const el = layer();
    const field = new ParallaxField({ layers: [{ el, depth: 1 }] });
    field.update(1 / 60);
    // A full 26-second drift cycle, measured a second at a time. The steepest
    // second is the budget the card's risk line asks for: "slow enough not to
    // fight the serif".
    let worst = 0;
    for (let s = 0; s < 27; s++) {
      const start = translateX(el);
      for (let i = 0; i < 60; i++) field.update(1 / 60);
      worst = Math.max(worst, Math.abs(translateX(el) - start));
    }
    expect(worst).toBeLessThan(4);
    // ...and it really is moving, rather than passing by standing still.
    expect(worst).toBeGreaterThan(0.5);
  });

  it('keeps the composition still under reduced motion, however hard it is driven', () => {
    const el = layer();
    const field = new ParallaxField({ layers: [{ el, depth: 1, scale: 1.11 }], reduceMotion: true });
    const still = el.style.transform;
    field.setPointer(-1, 1);
    field.setStick(1, -1);
    for (let i = 0; i < 300; i++) field.update(1 / 60);
    expect(el.style.transform).toBe(still);
    expect(translateX(el)).toBe(0);
  });

  it('ignores a resting stick but follows a pushed one', () => {
    const el = layer();
    const field = new ParallaxField({ layers: [{ el, depth: 1 }] });
    field.setStick(0.05, -0.05);
    for (let i = 0; i < 60; i++) field.update(1 / 60);
    expect(Math.abs(field.offset().x)).toBeLessThan(0.02);
    field.setStick(-1, 0);
    for (let i = 0; i < 180; i++) field.update(1 / 60);
    expect(field.offset().x).toBeLessThan(-0.5);
  });

  it('maps a pointer to -1..1 from the centre of the window', () => {
    expect(normalisePointer(800, 450, 1600, 900)).toEqual({ x: 0, y: 0 });
    expect(normalisePointer(0, 0, 1600, 900)).toEqual({ x: -1, y: -1 });
    expect(normalisePointer(9999, 9999, 1600, 900)).toEqual({ x: 1, y: 1 });
  });
});

describe('MoteField', () => {
  it('builds the concept’s sixteen pyreflies and animates them with transforms', () => {
    const host = layer();
    const motes = new MoteField(host, {});
    expect(motes.size).toBe(16);
    const first = host.querySelector('.fe-mote') as HTMLElement;
    // Base position is a one-time left/top; the motion is transform only.
    expect(first.style.left).not.toBe('');
    const before = first.style.top;
    motes.update(1);
    expect(first.style.transform).toMatch(/^translate3d\(/);
    expect(first.style.top).toBe(before);
  });

  it('is the still frame under reduced motion', () => {
    const host = layer();
    const motes = new MoteField(host, { reduceMotion: true });
    const first = host.querySelector('.fe-mote') as HTMLElement;
    for (let i = 0; i < 120; i++) motes.update(1 / 60);
    expect(first.style.transform).toBe('');
  });

  it('thins the field for the low-effects tier and cleans up after itself', () => {
    const host = layer();
    const motes = new MoteField(host, { count: 8 });
    expect(host.querySelectorAll('.fe-mote')).toHaveLength(8);
    motes.dispose();
    expect(host.querySelectorAll('.fe-mote')).toHaveLength(0);
  });
});

describe('titleMarkup', () => {
  const html = titleMarkup({ briefingChip: false });

  it('splits one approved painting into two planes and never asks for a second file', () => {
    const far = html.match(/fe-title__plane--far/g) ?? [];
    const near = html.match(/fe-title__plane--near/g) ?? [];
    expect(far).toHaveLength(1);
    expect(near).toHaveLength(1);
    const sources = new Set(Array.from(html.matchAll(/src="([^"]+art\/title\/[^"]+)"/g), (m) => m[1]));
    expect(sources.size).toBe(1);
  });

  it('is the key art after.png was composited from, not a stand-in backdrop', () => {
    expect(TITLE_PLATE).toBe('art/title/keyart.png');
    expect(html).toContain('art/title/keyart.png');
    // The first build reached for backdrops/title.png; nothing may again.
    expect(html).not.toContain('backdrops/title.png');
  });

  it('gives a plane whose painting 404s a marker the stylesheet can fall back on', () => {
    const planes = Array.from(html.matchAll(/class="fe-title__plane fe-title__plane--\w+"><img[^>]*>/g));
    expect(planes).toHaveLength(2);
    for (const [tag] of planes) expect(tag).toContain("data-art','missing'");
  });

  it('puts the two on the shore in as approved paintings, drawn as silhouettes', () => {
    expect(html).toContain('art/characters/tidus/idle.png');
    expect(html).toContain('art/characters/yuna/idle.png');
    // Two figures and their two reflections, every one of them an ink shape.
    expect(html.match(/class="fe-sil"/g) ?? []).toHaveLength(4);
  });

  it('keeps the approved slab copy and the Press Enter chip as a real button', () => {
    expect(html).toContain('An unofficial fan tribute');
    expect(html).toContain('Pyrefly');
    expect(html).toContain('Reprise');
    expect(html).toContain('data-action="confirm"');
  });

  it('shows the briefing chip only when onboarding is live', () => {
    expect(html).not.toContain('title:briefing');
    expect(titleMarkup({ briefingChip: true })).toContain('title:briefing');
  });

  /**
   * FE-002 (round 07 focused review, build 8f48237): on touch only the chip
   * advanced, the rest of the plate did nothing, and the chip always read
   * "Press Enter". `Input.onClick` resolves any click through
   * `closest('[data-action]')`, so the whole plate now carries the attribute
   * too — a tap anywhere reaches the same action the chip already did.
   */
  it('makes the whole plate a tap target, not only the chip', () => {
    const tapWrapper = /<div class="fe-title__tap" data-action="confirm">/.exec(html);
    expect(tapWrapper).not.toBeNull();
    // Everything else this function builds is inside that one wrapper.
    expect(html.trim().startsWith('<div class="fe-title__tap" data-action="confirm">')).toBe(true);
    expect(html).toContain('class="fe-title__chip" data-action="confirm"');
  });

  it('names the input it is actually talking to, for both the chip and the hint row', () => {
    expect(html).toContain('fe-title__chip-label--key">Press Enter<');
    expect(html).toContain('fe-title__chip-label--tap">Tap to begin<');
    expect(html).toContain('class="fe-hint__tap"><b>Tap</b> begin</span>');
    // Three keyboard hints (move / confirm / cancel), each tagged so CSS can
    // hide them on `pointer: coarse` without hiding the tap-only one too.
    expect(html.match(/class="fe-hint__key"/g) ?? []).toHaveLength(3);
  });

  /**
   * FE-003 (round 07 focused review): the first build rounded the cast's
   * geometry and the two figures ended up bigger and further right than
   * `after.png`. The fix reads the numbers straight off
   * `docs/concepts/polish/showpiece-frontend/after.html`'s own 1440x810
   * stage — Tidus `left:948 top:494 height:208`, Yuna `left:1068 top:512
   * height:194` — and this pins those exact fractions so a future edit
   * cannot round them again without this test failing first.
   */
  it('places the cast at after.html’s own pixel geometry, not a rounded guess', () => {
    const boxes = Array.from(
      html.matchAll(/class="fe-figure" style="left:([\d.]+)%;bottom:([\d.]+)%;height:([\d.]+)%"/g),
    );
    expect(boxes).toHaveLength(2);
    const [tidus, yuna] = boxes;
    expect(Number(tidus![1])).toBeCloseTo((948 / 1440) * 100, 2);
    expect(Number(tidus![2])).toBeCloseTo((1 - (494 + 208) / 810) * 100, 2);
    expect(Number(tidus![3])).toBeCloseTo((208 / 810) * 100, 2);
    expect(Number(yuna![1])).toBeCloseTo((1068 / 1440) * 100, 2);
    expect(Number(yuna![2])).toBeCloseTo((1 - (512 + 194) / 810) * 100, 2);
    expect(Number(yuna![3])).toBeCloseTo((194 / 810) * 100, 2);
  });

  /**
   * The reflection's box starts at the figure's feet and the image inside it is
   * the whole figure — the two numbers the stylesheet divides by `--fe-refl`.
   * The first build sized the image to the box, and `scaleY(-1)` about
   * `top center` then put every pixel of it above the box: no reflection at all.
   */
  it('hangs each reflection from its figure’s feet and hands CSS the ratio', () => {
    const boxes = Array.from(
      html.matchAll(/class="fe-figure fe-figure--refl" style="([^"]+)"/g),
      (m) => m[1]!,
    );
    expect(boxes).toHaveLength(2);
    for (const style of boxes) {
      const ratio = Number(/--fe-refl:([\d.]+)/.exec(style)![1]);
      const bottom = Number(/bottom:(-?[\d.]+)%/.exec(style)![1]) / 100;
      const height = Number(/height:([\d.]+)%/.exec(style)![1]) / 100;
      expect(ratio).toBeGreaterThan(0.5);
      expect(ratio).toBeLessThan(0.7);
      // Its top edge — bottom + height — is where the figure's feet are.
      const feet = bottom + height;
      expect(feet).toBeGreaterThan(0.12);
      expect(feet).toBeLessThan(0.14);
      // And the band is `ratio` of the figure it doubles.
      expect(height / ratio).toBeGreaterThan(0.2);
    }
  });
});

// --------------------------------------------------------------- the plate

const MANIFEST: ArtManifest = {
  version: 1,
  generatedAt: '',
  subjects: {},
  portraits: [],
  backdrops: [],
  pause: [],
  pause2x: [],
  title: ['keyart'],
  title2x: ['keyart'],
};

function mountTitle(): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = titleMarkup({ briefingChip: false });
  document.body.appendChild(host);
  return host;
}

function planeImgs(host: HTMLElement): HTMLImageElement[] {
  return Array.from(host.querySelectorAll('.fe-title__plane img'));
}

describe('the title plate', () => {
  afterEach(() => {
    resetArtManifest();
    document.body.innerHTML = '';
  });

  it('asks for art/title/keyart.png, and only that', () => {
    const imgs = planeImgs(mountTitle());
    expect(imgs).toHaveLength(2);
    for (const img of imgs) expect(img.getAttribute('src')).toContain(TITLE_PLATE);
  });

  /**
   * Measured in the browser: emitting `src` alone and adding `srcset` a tick
   * later makes Chromium start the 1x plate and abort it — a wasted megabyte
   * and a failed request in the panel. The manifest is prefetched at bundle
   * init, so by the time the title mounts it is normally already in hand.
   */
  it('puts the candidate list in the markup when the manifest is already in hand', () => {
    setArtManifest(MANIFEST);
    for (const img of planeImgs(mountTitle())) {
      expect(img.getAttribute('srcset')).toContain('keyart.2x.webp 2688w');
      expect(img.getAttribute('sizes')).toBe(titlePlateSizes());
    }
  });

  it('offers the 2688px master once the manifest says it is on disk', async () => {
    setArtManifest(MANIFEST);
    const host = mountTitle();
    await upgradeTitlePlanes(host);
    const url = artUrl(TITLE_PLATE);
    for (const img of planeImgs(host)) {
      expect(img.getAttribute('srcset')).toBe(
        `${url} 1344w, ${url.replace(/\.png$/, '.2x.webp')} 2688w`,
      );
      expect(img.getAttribute('sizes')).toBe(titlePlateSizes());
    }
  });

  it('offers nothing when the master is not listed — never a 404 on the one image the screen is', async () => {
    setArtManifest({ ...MANIFEST, title2x: [] });
    const host = mountTitle();
    await upgradeTitlePlanes(host);
    for (const img of planeImgs(host)) expect(img.hasAttribute('srcset')).toBe(false);
  });

  it('falls back gracefully with no manifest at all, and again when the painting 404s', async () => {
    setArtManifest(null);
    const host = mountTitle();
    await upgradeTitlePlanes(host);
    for (const img of planeImgs(host)) {
      expect(img.hasAttribute('srcset')).toBe(false);
      // The plate is still requested; the screen is correct without a manifest.
      expect(img.getAttribute('src')).toContain(TITLE_PLATE);
      // And when it fails, the plane says so instead of leaving a broken glyph.
      img.dispatchEvent(new Event('error'));
    }
    const planes = Array.from(host.querySelectorAll('.fe-title__plane'));
    expect(planes.map((p) => p.getAttribute('data-art'))).toEqual(['missing', 'missing']);
  });

  it('hints a cover width, not 100vw: a tall window crops far more image than its own width', () => {
    const sizes = titlePlateSizes();
    expect(sizes).toContain('100vw');
    expect(sizes).toContain('100vh');
    expect(sizes.startsWith('calc(')).toBe(true);
  });
});
