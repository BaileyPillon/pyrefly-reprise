// @vitest-environment jsdom
/**
 * A-16 (both games): the title's first frame is never black. The plate is
 * preloaded by `index.html`, a 32 px copy sits under the far plane, and every
 * layer is held until it has decoded (or a cap passes). The aborted keyart
 * request (t1-b2b) came from re-setting a srcset the markup already carried.
 *
 * The frame-by-frame luma check at 1600x900 and 390x844 is in
 * `docs/handoff/iter2-b4.md`.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { resetArtManifest, setArtManifest } from '../../src/engine/ArtManifest.ts';
import { castHtml, titleMarkup, titlePlateSizes, upgradeTitlePlanes } from '../../src/app/screens/frontend/titleMarkup.ts';
import { TITLE_PLACEHOLDER, revealTitleWhenDecoded, titleLayers } from '../../src/app/screens/frontend/titleReveal.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (...p: string[]): string => readFileSync(join(HERE, '..', '..', ...p), 'utf8');

function mount(): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = titleMarkup({ briefingChip: false });
  document.body.appendChild(host);
  return host;
}

afterEach(() => {
  resetArtManifest();
  document.body.innerHTML = '';
});

describe('the placeholder', () => {
  it('is a 32 px inline WebP of the plate, small enough to live in the bundle', () => {
    expect(TITLE_PLACEHOLDER.startsWith('data:image/webp;base64,')).toBe(true);
    expect(TITLE_PLACEHOLDER.length).toBeLessThan(1024);
  });

  /** The Gullwings plate's 32 x 18 copy (2026-10-05): a lossy VP8 WebP whose header says 32 x 18, not the old plate's. */
  it('is a 32 x 18 lossy WebP (the header says so)', () => {
    const bytes = Buffer.from(TITLE_PLACEHOLDER.slice('data:image/webp;base64,'.length), 'base64');
    expect(bytes.subarray(0, 4).toString('latin1')).toBe('RIFF');
    expect(bytes.subarray(8, 12).toString('latin1')).toBe('WEBP');
    expect(bytes.subarray(12, 16).toString('latin1')).toBe('VP8 ');
    // The key frame's start code, then the 14-bit width and height.
    expect([...bytes.subarray(23, 26)]).toEqual([0x9d, 0x01, 0x2a]);
    expect(bytes.readUInt16LE(26) & 0x3fff).toBe(32);
    expect(bytes.readUInt16LE(28) & 0x3fff).toBe(18);
  });

  it('is drawn under the far plane, graded like it, and gives way to the dusk fallback on a 404', () => {
    const css = read('src', 'app', 'screens', 'frontend', 'title-reveal.css');
    expect(css).toMatch(/\.fe-title__plane--far::before \{[^}]*z-index: -1;[^}]*var\(--fe-title-ph/);
    expect(css).toMatch(/\[data-art='missing'\]::before \{[^}]*display: none/);
  });
});

describe('the reveal waits for every layer to decode', () => {
  it('holds both planes, then shows them together', async () => {
    const host = mount();
    // The two on the shore are not drawn since the Gullwings key art (TITLE_CAST_ON): the planes are the whole reveal.
    expect(titleLayers(host)).toHaveLength(2);
    const decoded: Array<() => void> = [];
    for (const img of titleLayers(host)) {
      img.decode = () => new Promise<void>((r) => decoded.push(r));
    }
    let capped = (): void => {};
    const done = revealTitleWhenDecoded(host, { wait: () => new Promise<void>((r) => (capped = r)) });
    expect(host.classList.contains('fe-title--decoding')).toBe(true);
    expect(host.style.getPropertyValue('--fe-title-ph')).toContain(TITLE_PLACEHOLDER);
    for (const r of decoded.slice(0, -1)) r();
    await Promise.resolve();
    expect(host.classList.contains('fe-title--decoding')).toBe(true);
    decoded[decoded.length - 1]!();
    expect(await done).toBe('decoded');
    expect(host.classList.contains('fe-title--decoding')).toBe(false);
    expect(host.dataset['titleReveal']).toBe('decoded');
    capped();
  });

  it('would hold the two on the shore as well, if they were switched back on', () => {
    const host = mount();
    host.insertAdjacentHTML('beforeend', `<div class="fe-title__cast">${castHtml(true)}</div>`);
    expect(titleLayers(host)).toHaveLength(2 + 4);
  });

  it('shows the layers anyway when one never decodes, once the cap passes', async () => {
    const host = mount();
    for (const img of titleLayers(host)) img.decode = () => new Promise<void>(() => {});
    expect(await revealTitleWhenDecoded(host, { wait: () => Promise.resolve() })).toBe('capped');
    expect(host.classList.contains('fe-title--decoded')).toBe(true);
  });

  it('counts a failed image as settled: its plane falls back to the dusk gradient', async () => {
    const host = mount();
    for (const img of titleLayers(host)) img.decode = () => Promise.reject(new Error('EncodingError'));
    expect(await revealTitleWhenDecoded(host, { wait: () => new Promise<void>(() => {}) })).toBe('decoded');
  });
});

describe('no aborted keyart request', () => {
  it('leaves a srcset the markup already carried alone (re-setting it restarts the fetch)', async () => {
    setArtManifest({ version: 1, generatedAt: '', subjects: {}, portraits: [], backdrops: [], pause: [], pause2x: [], title: ['keyart'], title2x: ['keyart'] });
    const host = mount();
    const writes: string[] = [];
    for (const img of host.querySelectorAll<HTMLImageElement>('.fe-title__plane img')) {
      const set = img.setAttribute.bind(img);
      img.setAttribute = (n: string, v: string) => {
        writes.push(n);
        set(n, v);
      };
      Object.defineProperty(img, 'srcset', { set: () => writes.push('srcset'), get: () => img.getAttribute('srcset') ?? '' });
    }
    await upgradeTitlePlanes(host);
    expect(writes).toEqual([]);
  });

  it('offers the preload\'s candidates before the manifest lands, and takes them back if the master is not on disk', async () => {
    setArtManifest(null); // a cold, slow first visit: nothing known yet
    const host = mount();
    for (const img of host.querySelectorAll<HTMLImageElement>('.fe-title__plane img')) {
      expect(img.getAttribute('srcset')).toMatch(/keyart\.png 1344w, .*keyart\.2x\.webp 2688w$/);
    }
    await upgradeTitlePlanes(host); // the manifest never arrives here: no master to promise
    for (const img of host.querySelectorAll<HTMLImageElement>('.fe-title__plane img')) {
      expect(img.hasAttribute('srcset')).toBe(false);
      expect(img.getAttribute('src')).toContain('art/title/keyart.png');
    }
  });

  it('index.html preloads the plate with the same candidates and sizes the planes offer', () => {
    // The page names its art through Vite's BASE_URL variable, which a build fills in from the base the site is served under (a
    // root-absolute name stays at the server root when Vite does not find the file in public/: tests/unit/art-url-base.test.ts).
    // Filled in with this run's base, the preload must be exactly what the planes carry.
    setArtManifest({ version: 1, generatedAt: '', subjects: {}, portraits: [], backdrops: [], pause: [], pause2x: [], title: ['keyart'], title2x: ['keyart'] });
    const html = read('index.html');
    const preload = /<link rel="preload" as="image"[^>]*>/.exec(html)?.[0] ?? '';
    expect(preload).toContain('href="%BASE_URL%art/title/keyart.png"');
    expect(preload).toContain('imagesrcset="%BASE_URL%art/title/keyart.png 1344w, %BASE_URL%art/title/keyart.2x.webp 2688w"');
    const filled = preload.replaceAll('%BASE_URL%', import.meta.env.BASE_URL);
    const plane = mount().querySelector('.fe-title__plane img');
    expect(filled).toContain(`href="${plane?.getAttribute('src')}"`);
    expect(filled).toContain(`imagesrcset="${plane?.getAttribute('srcset')}"`);
    expect(filled).toContain(`imagesizes="${plane?.getAttribute('sizes')}"`);
    expect(html).toContain(`imagesizes="${titlePlateSizes()}"`);
  });
});
