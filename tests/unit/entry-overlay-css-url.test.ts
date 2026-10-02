import { describe, expect, it } from 'vitest';

import { firstCssUrl } from '../../src/ui/common/transitions/entryOverlay.ts';

/** LIVE-R34-01 / F2: the grain overlays' data URIs contain a `url(%23n)` of their own. */
describe('firstCssUrl reads a computed background-image the way CSS does', () => {
  it('a plain painted backdrop', () => {
    expect(firstCssUrl('url("http://127.0.0.1/pyrefly-reprise/art/scenes/gagazet.png")')).toBe(
      'http://127.0.0.1/pyrefly-reprise/art/scenes/gagazet.png',
    );
    expect(firstCssUrl("url('a.png')")).toBe('a.png');
    expect(firstCssUrl('url(a.png)')).toBe('a.png');
  });

  it('the grain data URI is one URL, not a url(%23n) found inside it', () => {
    const grain =
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise'/></filter><rect width='180' height='180' filter='url(%23n)'/></svg>\")";
    const got = firstCssUrl(grain);
    expect(got).not.toBe('%23n');
    expect(got?.startsWith('data:image/svg+xml;utf8,<svg')).toBe(true);
    expect(got?.endsWith('</svg>')).toBe(true);
  });

  it('the first of several layers, and none', () => {
    expect(firstCssUrl('url("a.png"), url("b.png")')).toBe('a.png');
    expect(firstCssUrl('linear-gradient(red, blue), url("b.png")')).toBe('b.png');
    expect(firstCssUrl('none')).toBeNull();
    expect(firstCssUrl('')).toBeNull();
  });
});
