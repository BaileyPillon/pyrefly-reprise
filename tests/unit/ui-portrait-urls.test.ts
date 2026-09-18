// @vitest-environment jsdom
/**
 * Every art URL the UI emits goes through one base-aware helper, and every
 * layer of a portrait chip is positioned with an explicit `z-index`.
 *
 * Both halves come from the same live bug (docs/handoff/bp1-portrait-basepath.md):
 * the deployed site showed `T`/`K`/`Y` monograms where the party's faces
 * belong. The *class* of bug it looked like is a hand-written `/art/...`
 * string, which works at `npm run dev` (base `/`) and 404s on Pages (base
 * `/pyrefly-reprise/`). The actual cause was stacking — the monogram `<span>`
 * was positioned and the portrait `<img>` was not, so the letter painted on
 * top of a perfectly loaded PNG.
 *
 * These are the cheap unit-level guards for both. Under vitest
 * `import.meta.env.BASE_URL` is `/`, so nothing here can prove the deployed
 * base works end to end — that is `tests/e2e/portraits.spec.ts`, which runs
 * against a production build served under `/pyrefly-reprise/`. What this file
 * pins down is the shape every URL builder must have (relative path in, single
 * base-prefixed URL out, never a leading-slash literal) and the stacking
 * contract, neither of which needs a browser to check.
 */

import { describe, expect, it } from 'vitest';
import { artUrl } from '../../src/engine/PaintedArt.ts';
import { backdropImgHtml, faceCropStyle, faceImgHtml, portraitImgHtml } from '../../src/ui/common/portrait.ts';
import { portraitChipHtml, portraitUrl, resolvePortraitKey, tintFor } from '../../src/ui/ffx/portraits.ts';

/** The base vitest runs under. Read, not assumed, so this file follows a config change. */
const BASE = import.meta.env.BASE_URL || '/';

function parse(html: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host;
}

describe('art URLs are built from the Vite base', () => {
  it('artUrl prefixes the base exactly once, with or without a leading slash', () => {
    expect(artUrl('art/portraits/tidus.png')).toBe(`${BASE}art/portraits/tidus.png`);
    expect(artUrl('/art/portraits/tidus.png')).toBe(`${BASE}art/portraits/tidus.png`);
    // No `//` seam whatever the base's trailing slash does — that is the one
    // way a "correct" builder still emits a URL a static host will not serve.
    expect(artUrl('art/x.png')).not.toContain('//art');
  });

  it('every portrait and backdrop helper routes through it', () => {
    expect(portraitUrl('yuna')).toBe(artUrl('art/portraits/yuna.png'));

    const srcs = [
      portraitImgHtml('tidus'),
      backdropImgHtml('zanarkand-dome'),
      faceImgHtml('kimahri'),
      portraitChipHtml('auron', 'Auron', tintFor('party'), 'seymour-flux'),
    ].flatMap((html) => [...parse(html).querySelectorAll('img')].map((img) => img.getAttribute('src') ?? ''));

    expect(srcs.length).toBeGreaterThan(3);
    for (const src of srcs) {
      // `art/` starts exactly where the base ends: the URL is base + path and
      // nothing else. `toContain` alone would pass on a hand-written
      // `/art/...` literal under vitest's `/` base, which is precisely the
      // deployed bug in source form — on Pages that resolves at the origin
      // root, i.e. somebody else's project site.
      expect(src.indexOf('art/'), `"${src}" is not "${BASE}" + a relative art path`).toBe(BASE.length);
    }
  });

  it('keeps the one id/file mismatch in the alias table, not in a caller', () => {
    expect(resolvePortraitKey('seymour-flux')).toBe('seymour');
    expect(resolvePortraitKey('yunalesca')).toBe('yunalesca');
    expect(portraitUrl(resolvePortraitKey('seymour-flux'))).toBe(artUrl('art/portraits/seymour.png'));
  });
});

describe('a portrait chip stacks its layers in one fixed order', () => {
  it('paints the dedicated portrait above the body crop above the monogram', () => {
    const chip = parse(portraitChipHtml('seymour', 'Seymour Flux', tintFor('enemy'), 'seymour-flux'));

    const mono = chip.querySelector<HTMLElement>('.ffx-portrait-fallback');
    const imgs = [...chip.querySelectorAll<HTMLImageElement>('img')];
    expect(mono).not.toBeNull();
    expect(imgs).toHaveLength(2);

    const z = (el: HTMLElement): number => Number(el.style.zIndex);
    const body = imgs.find((i) => i.dataset['bodyId'])!;
    const face = imgs.find((i) => !i.dataset['bodyId'])!;

    expect(z(mono!)).toBe(0);
    expect(z(body)).toBe(1);
    expect(z(face)).toBe(2);
    expect(z(face)).toBeGreaterThan(z(mono!));
  });

  it('positions every layer, because a positioned sibling would otherwise win on paint order', () => {
    const chip = parse(portraitChipHtml('tidus', 'Tidus', tintFor('party')));
    const face = chip.querySelector<HTMLImageElement>('img[data-role="portrait-img"]')!;

    // The monogram is `position: absolute` in `ffx-hud.css`. An unpositioned
    // `<img>` loses to it whatever the DOM order says — the shipped bug.
    expect(face.style.position).toBe('absolute');
    expect(face.style.zIndex).toBe('2');
  });

  it('uses the measured head crop for the face layer, not the frame CSS cover', () => {
    const chip = parse(portraitChipHtml('kimahri', 'Kimahri', tintFor('party')));
    const face = chip.querySelector<HTMLImageElement>('img[data-role="portrait-img"]')!;

    // Same geometry `party-prep` and chapter select already use, so one
    // character's head is the same size in every frame in the game.
    expect(face.getAttribute('style')).toContain(faceCropStyle('kimahri'));
    // Kimahri's three-quarter muzzle is the row that proves the table is read
    // per-id rather than a constant: his crop is nowhere near centred.
    expect(faceCropStyle('kimahri')).not.toBe(faceCropStyle('tidus'));
  });

  it('still renders a monogram-only chip when there is no portrait key at all', () => {
    const chip = parse(portraitChipHtml(undefined, 'Mortiorchis', tintFor('enemy')));
    expect(chip.querySelectorAll('img')).toHaveLength(0);
    expect(chip.querySelector('.ffx-portrait-fallback')?.textContent).toBe('M');
  });
});
