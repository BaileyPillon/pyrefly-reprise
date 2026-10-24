// @vitest-environment jsdom
/**
 * THE BOOTH'S TWO CARDS IN THE ECHO LOOK (conference demo, lane "booth"; Bailey, 2026-10-22, decision 188b; both games; `src/app/demo/boothCards.ts`, `boothCards.css`).
 *
 * Claims: the end card and the attract card say what the picked mockups (endcard-A, attract-A) say, with the booth's own QR and the Echo painting; the card after a fight adds Bailey's "Thanks for playing" (173h) and the
 * booth loop's card does not; the pyreflies are the same every time; every word on both cards is at least 16 grid units (28 px at 2560 x 1440, Bailey's floor); REDUCE MOTION stills every animation, by the game's
 * option and by the system's.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ATTRACT_HOME,
  ATTRACT_PRESS,
  ATTRACT_PROMPT,
  END_EYEBROW,
  END_FINE,
  END_PITCH,
  END_SCAN,
  END_THANKS,
  attractCardMarkup,
  echoPaintingUrl,
  endCardMarkup,
  glowsMarkup,
  mountAttractCard,
  mountEndCard,
} from '../../src/app/demo/boothCards.ts';
import { boothHost, boothQrSvg } from '../../src/app/demo/demoQr.ts';

const textOf = (html: string): string => {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent ?? '';
};

describe('the end card', () => {
  it("says the picked frame's words: the fan tribute, the pitch, scan to play, the address", () => {
    const text = textOf(endCardMarkup());
    expect(text).toContain('An unofficial fan tribute');
    expect(text).toContain('Play the boss fights ofFinal Fantasy X and X-2,reimagined.');
    expect(text).toContain('Scan to play');
    expect(text).toContain('echoesofspira.com');
    expect(END_EYEBROW + END_PITCH.join('') + END_SCAN + END_FINE).toContain('Free, in your browser.');
  });

  it('draws the Echo painting and the booth\'s own QR code', () => {
    const html = endCardMarkup();
    expect(html).toContain(`src="${echoPaintingUrl()}"`);
    expect(echoPaintingUrl()).toMatch(/art\/title\/echo\.(png|webp)$/);
    expect(html).toContain(boothQrSvg());
    expect(html).toContain(boothHost());
  });

  it('thanks the visitor only after a fight (decision 173h), never on the booth loop card', () => {
    expect(textOf(endCardMarkup({ afterFight: true }))).toContain(END_THANKS);
    expect(textOf(endCardMarkup())).not.toContain(END_THANKS);
    expect(END_THANKS).toBe('Thanks for playing');
  });

  it('builds up in 42 percent of the time after a fight and at full length on the loop card', () => {
    expect(endCardMarkup({ afterFight: true })).toContain('--bt:0.42');
    expect(endCardMarkup()).toContain('--bt:1');
  });

  it('puts the QR under an accessible name and the painting under a description', () => {
    const d = document.createElement('div');
    d.innerHTML = endCardMarkup();
    expect(d.querySelector('[role="img"]')?.getAttribute('aria-label')).toMatch(/QR code.*echoesofspira\.com/);
    expect(d.querySelector('img')?.getAttribute('alt')).toMatch(/Yuna kneeling in still water/);
  });
});

describe('the attract card', () => {
  it('says "Pick up the controller", "Press any button" and where to play at home', () => {
    const text = textOf(attractCardMarkup());
    expect(text).toContain(ATTRACT_PROMPT);
    expect(ATTRACT_PROMPT).toBe('Pick up the controller');
    expect(text).toContain(ATTRACT_PRESS);
    expect(ATTRACT_PRESS).toBe('Press any button');
    expect(text).toContain(ATTRACT_HOME);
    expect(text).toContain('An unofficial fan tribute');
    expect(text).toContain('echoesofspira.com');
  });

  it('draws the Echo painting, the QR code and a pad glyph with a ring on its A button', () => {
    const html = attractCardMarkup();
    expect(html).toContain(echoPaintingUrl());
    expect(html).toContain(boothQrSvg());
    expect(html).toContain('booth-pad__ring');
    expect(html).toContain('fill="#e3b94a"'); // the A button, in gold
  });
});

describe('the mounts', () => {
  it('put one card in the parent and return it', () => {
    const parent = document.createElement('div');
    const end = mountEndCard(parent, { afterFight: true });
    expect(parent.children).toHaveLength(1);
    expect(end.dataset['role']).toBe('booth-end');
    const attract = mountAttractCard(parent);
    expect(parent.children).toHaveLength(2);
    expect(attract.dataset['role']).toBe('booth-attract');
  });
});

describe('the pyreflies', () => {
  const regions = [{ x0: 0, x1: 1280, y0: 20, y1: 260, n: 22 }];
  it('are the same scatter every time, and a different one for another seed', () => {
    expect(glowsMarkup(regions, 90210, 3, 10)).toBe(glowsMarkup(regions, 90210, 3, 10));
    expect(glowsMarkup(regions, 90210, 3, 10)).not.toBe(glowsMarkup(regions, 7, 3, 10));
  });

  it('are as many as asked, hidden from a screen reader, and sized in grid units', () => {
    const html = glowsMarkup(regions, 1, 3, 10);
    expect(html.match(/class="booth-glow"/g)).toHaveLength(22);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('var(--bk)');
  });
});

describe('the style sheet', () => {
  const css = readFileSync(resolve('src/app/demo/boothCards.css'), 'utf8');

  it('sets every word at 16 grid units or more: 28 px at 2560 x 1440 (the text floor)', () => {
    const sizes = [...css.matchAll(/font-size:\s*calc\(\s*([0-9.]+)\s*\*\s*var\(--bk\)\s*\)/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThanOrEqual(9);
    for (const s of sizes) expect(s).toBeGreaterThanOrEqual(16);
    expect(css).not.toMatch(/font-size:\s*[0-9.]+px/); // no fixed-pixel type that would not scale with the window
    expect(css).not.toMatch(/font:\s*[^;]*\b[0-9.]+px/);
    expect(16 * (1440 / 810)).toBeGreaterThanOrEqual(28); // the unit at 2560 x 1440 is 1.78 px
  });

  it('stills every animation under REDUCE MOTION, the game\'s option and the system\'s', () => {
    expect(css).toMatch(/html\[data-reduce-motion\] \.booth-card \*[\s\S]*?animation:\s*none\s*!important/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation:\s*none\s*!important/);
  });

  it('uses the front end\'s own grid unit and the painting\'s own black ground', () => {
    expect(css).toContain('--bk: max(0.5px, min(100vw / 1440, 100vh / 810))');
    expect(css).toContain('#050402');
  });
});
