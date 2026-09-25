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
