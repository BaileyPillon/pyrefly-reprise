// @vitest-environment jsdom
/**
 * The pause CHAPTER tab honours `ChapterMeta.heroArtFallback`, as the chapter
 * card (`ui/common/chapterPanel.ts`) always has.
 *
 * Before: `PauseView.renderPlate` called `portrait.show(heroArt)` with no
 * fallback, so Chapter XIII (`heroArt: 'pause/ch13-trema'`, not painted yet)
 * asked for `art/pause/ch13-trema.png`, its `.json` sidecar and then
 * `art/portraits/ch13-trema.png`: three misses and a blank tab.
 *
 * **Game case: both** (shared pause plumbing; a chapter whose plate exists, or
 * a call with no `fallbackArt`, renders exactly as before).
 */

import { afterEach, describe, expect, it } from 'vitest';
import { PortraitStage } from '../../src/app/screens/pause/PortraitStage.ts';
import { resetArtManifest, setArtManifest, type ArtManifest } from '../../src/engine/ArtManifest.ts';

const MANIFEST: ArtManifest = {
  version: 1,
  generatedAt: 'test',
  subjects: {},
  portraits: ['yuna-x2'],
  backdrops: [],
  pause: ['ch4-ffx2-bahamut'],
  pause2x: [],
  title: [],
  title2x: [],
};

function stage(): PortraitStage {
  const root = document.createElement('div');
  document.body.appendChild(root);
  return new PortraitStage({ root, reduceMotion: true });
}

afterEach(() => {
  resetArtManifest();
  document.body.innerHTML = '';
});

/** Runs `body` with the window sized to `w`x`h`, restoring the previous size after. */
function atWindowSize<T>(w: number, h: number, body: () => T): T {
  const prevW = window.innerWidth;
  const prevH = window.innerHeight;
  Object.defineProperty(window, 'innerWidth', { value: w, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: h, configurable: true });
  try {
    return body();
  } finally {
    Object.defineProperty(window, 'innerWidth', { value: prevW, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: prevH, configurable: true });
  }
}

describe('PR-0121: the pause plate is feathered rather than cut short at 3840x2160', () => {
  it('a member plate at the 3840x2160 magnify cap gets the capped-feather mask, not a hard edge', () => {
    atWindowSize(3840, 2160, () => {
      const s = stage();
      s.show('tidus');
      const img = s.plate!;
      expect(img.classList.contains('pause__plate--capped')).toBe(true);
      expect(img.style.getPropertyValue('--pu-slide-mask')).not.toBe('');
      // The box itself is still short of the frame (the cap, not a cover fix) —
      // it is the feather, not the geometry, that removes the hard edge.
      const width = Number.parseFloat(img.style.width);
      expect(width).toBeLessThan(3840);
    });
  });

  it('2560x1440 is unchanged: no cap applies, so no capped class', () => {
    atWindowSize(2560, 1440, () => {
      const s = stage();
      s.show('tidus');
      const img = s.plate!;
      expect(img.classList.contains('pause__plate--capped')).toBe(false);
      expect(img.style.getPropertyValue('--pu-slide-mask')).toBe('');
    });
  });
});

describe('the pause CHAPTER plate falls back to heroArtFallback (both games)', () => {
  it('a plate the manifest denies goes straight to the fallback, with no request for the plate', () => {
    setArtManifest(MANIFEST);
    const s = stage();
    s.show('ch13-trema', undefined, 'portraits/yuna-x2.png');
    const img = s.plate!;
    expect(img.getAttribute('src')).toMatch(/art\/portraits\/yuna-x2\.png$/);
    expect(img.dataset['art']).toBe('fallback');
    expect(img.getAttribute('srcset')).toBeNull();
    // Shown whole by the stylesheet, so the global portrait face-crop must not adopt it.
    expect(img.hasAttribute('data-face-crop-manual')).toBe(true);
  });

  it('a plate that exists is shown as before, even with a fallback given', () => {
    setArtManifest(MANIFEST);
    const s = stage();
    s.show('ch4-ffx2-bahamut', undefined, 'portraits/yuna-x2.png');
    expect(s.plate!.getAttribute('src')).toMatch(/art\/pause\/ch4-ffx2-bahamut\.png$/);
    expect(s.plate!.dataset['art']).toBe('plate');
  });

  it('with no manifest yet, a plate that fails to load walks to heroArtFallback, not portraits/<plate>', () => {
    setArtManifest(null);
    const s = stage();
    s.show('ch13-trema', undefined, 'portraits/yuna-x2.png');
    const img = s.plate!;
    expect(img.getAttribute('src')).toMatch(/art\/pause\/ch13-trema\.png$/);
    img.dispatchEvent(new Event('error'));
    expect(img.getAttribute('src')).toMatch(/art\/portraits\/yuna-x2\.png$/);
    expect(img.dataset['art']).toBe('fallback');
  });

  it('with no fallbackArt the chain is unchanged: plate, then portraits/<fallbackId ?? plate>', () => {
    setArtManifest(MANIFEST);
    const s = stage();
    s.show('ch13-trema');
    const img = s.plate!;
    expect(img.getAttribute('src')).toMatch(/art\/pause\/ch13-trema\.png$/);
    img.dispatchEvent(new Event('error'));
    expect(img.getAttribute('src')).toMatch(/art\/portraits\/ch13-trema\.png$/);
    expect(img.hasAttribute('data-face-crop-manual')).toBe(false);
  });
});
