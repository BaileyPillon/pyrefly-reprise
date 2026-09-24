// @vitest-environment jsdom
/**
 * Live bug, 2026-09-24 (Bailey's screenshot): on the pause CHAPTER tab of
 * Chapter II, the snapshot "it isn't over" is `portraits/auron.png`. The
 * shared face-crop adopter in `ui/common/portrait.ts` tagged that <img> and
 * gave it an absolute 125 %-wide crop meant for a positioned, clipped frame.
 * `.pause__snap` is neither, so Auron drew across the whole pause screen.
 *
 * Game case: both (the pause and the portrait plumbing are shared).
 */
import { describe, expect, it } from 'vitest';
import { columnsHtml } from '../../src/app/screens/pause/markup.ts';
import { refineFaceCropsIn } from '../../src/ui/common/portrait.ts';
import { canHostCrop } from '../../src/ui/common/portraitHost.ts';

const COLUMN = {
  id: 'chapter',
  heading: 'This encounter',
  rows: [],
  snaps: [
    { image: 'backdrops/zanarkand-dome.png', caption: 'the dome' },
    { image: 'portraits/auron.png', caption: "it isn't over" },
  ],
};

describe('pause snapshots are never face-cropped', () => {
  it('marks every snapshot <img> as manually framed', () => {
    const html = columnsHtml([COLUMN]);
    const imgs = html.match(/<img[^>]*>/g) ?? [];
    expect(imgs).toHaveLength(2);
    for (const tag of imgs) expect(tag).toContain('data-face-crop-manual="1"');
  });

  it('the adopter leaves a portrait snapshot untouched', () => {
    const root = document.createElement('div');
    root.innerHTML = columnsHtml([COLUMN]);
    document.body.appendChild(root);
    refineFaceCropsIn(root);
    const auron = root.querySelector<HTMLImageElement>('img[src*="/art/portraits/auron.png"]');
    expect(auron).not.toBeNull();
    expect(auron!.hasAttribute('data-face-crop')).toBe(false);
    expect(auron!.getAttribute('style')).toBeNull();
    root.remove();
  });

  it('an untagged portrait under a static parent is not adoptable; under a positioned one it is', () => {
    const staticBox = document.createElement('figure');
    const img = document.createElement('img');
    staticBox.appendChild(img);
    document.body.appendChild(staticBox);
    expect(canHostCrop(img)).toBe(false);
    staticBox.style.position = 'relative';
    expect(canHostCrop(img)).toBe(true);
    staticBox.remove();
  });
});
