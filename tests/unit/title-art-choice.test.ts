// @vitest-environment jsdom
/**
 * Release 39.5, the title screen choice (Bailey, 2026-10-07): "go with this as a new selectable title screen, and once
 * selected it hides echoes of spira since it's already in the image itself. it will look neater that way. current title
 * screen is still the default."
 *
 * `Settings.titleArt` is `'farplane'` (today's Gullwings painting; the default) or `'echo'` (The Echo, Yuna in still water,
 * `public/art/title/echo.png`, with its own painted lettering). This pins what the choice changes on screen and what it does
 * not: the Farplane markup is exactly what it was; The Echo draws its own plate as one plane, never offers it a 2x master
 * it does not have, leaves the HTML wordmark out and says the words in the picture's `alt`; the screen reads the setting
 * every time it is shown; the chrome that stays (eyebrow, chip, strap, hint row, tap target) stays; and the layout rules
 * that keep Yuna and the painted lettering clear exist for each window shape.
 *
 * Game case: both games (the title is the front door to both; the picture shows Yuna in her FFX dress and is shared).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { App } from '../../src/app/App.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { TITLE_ART_PLATES } from '../../src/app/saveFrontend.ts';
import { TitleScreen } from '../../src/app/screens/TitleScreen.ts';
import { TITLE_PLATE, titleMarkup } from '../../src/app/screens/frontend/titleMarkup.ts';
import { TITLE_PLACEHOLDER, TITLE_PLACEHOLDERS, TITLE_PLACEHOLDER_ECHO } from '../../src/app/screens/frontend/titleReveal.ts';
import { artUrl } from '../../src/engine/PaintedArt.ts';
import { resetArtManifest, setArtManifest, type ArtManifest } from '../../src/engine/ArtManifest.ts';

const REPO = resolve(__dirname, '..', '..');
const read = (p: string): string => readFileSync(resolve(REPO, p), 'utf8');

const MANIFEST: ArtManifest = {
  version: 1,
  generatedAt: '',
  subjects: {},
  portraits: [],
  backdrops: [],
  pause: [],
  pause2x: [],
  title: ['echo', 'keyart'],
  title2x: ['keyart'],
};

const parse = (html: string): HTMLElement => {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host;
};

beforeEach(() => setArtManifest(MANIFEST));
afterEach(() => {
  resetArtManifest();
  document.body.innerHTML = '';
});

describe('the Farplane screen is what it was', () => {
  it('is the default of the markup, with its wordmark, its two planes and its scrim', () => {
    const plain = parse(titleMarkup({ briefingChip: false }));
    const farplane = parse(titleMarkup({ briefingChip: false, art: 'farplane' }));
    expect(farplane.innerHTML).toBe(plain.innerHTML);
    expect(plain.querySelectorAll('.fe-title__name')).toHaveLength(2);
    expect([...plain.querySelectorAll('.fe-title__name')].map((n) => n.textContent)).toEqual(['Echoes', 'of Spira']);
    expect(plain.querySelectorAll('.fe-title__plane')).toHaveLength(2);
    expect(plain.querySelector('.fe-title__grade')).not.toBeNull();
    expect(plain.querySelector('[data-title-art]')).toBeNull();
    for (const img of plain.querySelectorAll('.fe-title__plane img')) {
      expect(img.getAttribute('src')).toContain(TITLE_PLATE);
      expect(img.getAttribute('alt')).toBe('');
      expect(img.getAttribute('srcset')).toContain('keyart.2x.webp');
    }
  });
});

describe('The Echo', () => {
  const echo = (): HTMLElement => parse(titleMarkup({ briefingChip: true, art: 'echo' }));

  it('draws its own plate, once, and never the Farplane one', () => {
    const imgs = [...echo().querySelectorAll('.fe-title__plane img')];
    expect(imgs).toHaveLength(1);
    expect(echo().querySelector('.fe-title__plane--far')).not.toBeNull();
    expect(echo().querySelector('.fe-title__plane--near')).toBeNull();
    expect(imgs[0]!.getAttribute('src')).toBe(artUrl(TITLE_ART_PLATES.echo));
    expect(imgs[0]!.getAttribute('src')).toContain('echo');
    expect(echo().innerHTML).not.toContain('keyart');
    expect(TITLE_ART_PLATES.echo).toBe('art/title/echo.png');
    expect(TITLE_ART_PLATES.farplane).toBe(TITLE_PLATE);
  });

  it('is offered no 2x master: it has none, and a candidate for a missing file is a 404 on the one image the screen is', () => {
    const img = echo().querySelector('.fe-title__plane img')!;
    expect(img.hasAttribute('srcset')).toBe(false);
    expect(img.hasAttribute('sizes')).toBe(false);
    // not even before the manifest has loaded, when the Farplane markup offers the master blind (A-16)
    resetArtManifest();
    const cold = parse(titleMarkup({ briefingChip: false, art: 'echo' })).querySelector('.fe-title__plane img')!;
    expect(cold.hasAttribute('srcset')).toBe(false);
    expect(parse(titleMarkup({ briefingChip: false })).querySelector('.fe-title__plane img')!.getAttribute('srcset')).toContain('2x.webp');
  });

  it('hides "Echoes of Spira": no wordmark element, no title lettering in the HTML, the words only in the picture\u2019s alt', () => {
    const root = echo();
    expect(root.querySelectorAll('.fe-title__name')).toHaveLength(0);
    const visibleText = (root.textContent ?? '').replace(/\s+/g, ' ');
    expect(visibleText).not.toMatch(/Echoes/);
    expect(visibleText).not.toMatch(/of Spira/);
    expect(root.querySelector('.fe-title__plane img')!.getAttribute('alt')).toBe('Echoes of Spira');
  });

  it('keeps the rest of the chrome: eyebrow, rule, chip, strap, hint row, briefing chip, and a tap target over the whole plate', () => {
    const root = echo();
    expect(root.querySelector('.fe-title__eyebrow')?.textContent).toBe('An unofficial fan tribute');
    expect(root.querySelector('.fe-title__rule')).not.toBeNull();
    expect(root.querySelector('.fe-title__chip[data-action="confirm"]')).not.toBeNull();
    expect(root.querySelector('.fe-title__strap')?.textContent).toBe('Final Fantasy X and X-2');
    expect(root.querySelector('.fe-hint')).not.toBeNull();
    expect(root.querySelector('[data-action="title:briefing"]')).not.toBeNull();
    expect(root.querySelector('.fe-title__tap[data-action="confirm"][data-title-art="echo"]')).not.toBeNull();
    expect(root.querySelector('.fe-title__motes')).not.toBeNull();
  });

  it('has a placeholder of its own: a 32 x 18 WebP that is almost black, not the Farplane picture', () => {
    expect(TITLE_PLACEHOLDERS.farplane).toBe(TITLE_PLACEHOLDER);
    expect(TITLE_PLACEHOLDERS.echo).toBe(TITLE_PLACEHOLDER_ECHO);
    expect(TITLE_PLACEHOLDER_ECHO).not.toBe(TITLE_PLACEHOLDER);
    expect(TITLE_PLACEHOLDER_ECHO).toMatch(/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/);
    const bytes = Buffer.from(TITLE_PLACEHOLDER_ECHO.split(',')[1]!, 'base64');
    expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(bytes.subarray(8, 12).toString('ascii')).toBe('WEBP');
    expect(bytes.length).toBeLessThan(600);
  });
});

// ---------------------------------------------------------- the screen reads the setting

class FakeApp {
  readonly uiRoot = document.body.appendChild(document.createElement('div'));
  readonly save: SaveStore;
  constructor(art?: string) {
    const slot = new Map<string, string>();
    if (art !== undefined) slot.set(SAVE_KEY, JSON.stringify({ version: 1, updatedAt: 1, chapters: {}, unlocked: [], settings: { titleArt: art, reduceMotion: true }, seenCoach: [], flags: {} }));
    else slot.set(SAVE_KEY, JSON.stringify({ version: 1, updatedAt: 1, chapters: {}, unlocked: [], settings: { reduceMotion: true }, seenCoach: [], flags: {} }));
    this.save = new SaveStore(SAVE_KEY, { getItem: (k) => slot.get(k) ?? null, setItem: (k, v) => void slot.set(k, v), removeItem: (k) => void slot.delete(k) });
  }
  fade(): Promise<void> {
    return Promise.resolve();
  }
}

async function showTitle(art?: string): Promise<{ screen: TitleScreen; root: HTMLElement }> {
  const app = new FakeApp(art);
  const screen = new TitleScreen();
  screen.app = app as unknown as App;
  screen.root = document.body.appendChild(document.createElement('div'));
  await screen.enter();
  return { screen, root: screen.root };
}

describe('TitleScreen reads Settings.titleArt every time it is shown', () => {
  it('draws the Farplane screen for a save with no choice (an older save), and for a bad value', async () => {
    for (const art of [undefined, 'nonsense', 'Echo']) {
      const { screen, root } = await showTitle(art);
      expect(root.classList.contains('fe-title--echo'), String(art)).toBe(false);
      expect(root.querySelectorAll('.fe-title__name')).toHaveLength(2);
      expect(root.querySelectorAll('.fe-title__plane')).toHaveLength(2);
      expect(screen.snapshot()['art']).toBe('farplane');
      screen.exit();
    }
  });

  it('draws The Echo when it is chosen: its class on the root, one plane, no wordmark', async () => {
    const { screen, root } = await showTitle('echo');
    expect(root.classList.contains('fe-title--echo')).toBe(true);
    expect(root.classList.contains('fe')).toBe(true);
    expect(root.querySelectorAll('.fe-title__plane')).toHaveLength(1);
    expect(root.querySelector('.fe-title__plane img')!.getAttribute('src')).toContain('echo');
    expect(root.querySelectorAll('.fe-title__name')).toHaveLength(0);
    expect(root.style.getPropertyValue('--fe-title-ph')).toContain(TITLE_PLACEHOLDER_ECHO);
    expect(screen.snapshot()['art']).toBe('echo');
    screen.exit();
  });

  it('draws the Farplane screen again when the choice goes back (a second enter on the same screen object)', async () => {
    const app = new FakeApp('echo');
    const screen = new TitleScreen();
    screen.app = app as unknown as App;
    screen.root = document.body.appendChild(document.createElement('div'));
    await screen.enter();
    expect(screen.root.classList.contains('fe-title--echo')).toBe(true);
    screen.exit();
    app.save.setSettings({ titleArt: 'farplane' });
    await screen.enter();
    expect(screen.root.classList.contains('fe-title--echo')).toBe(false);
    expect(screen.root.querySelectorAll('.fe-title__name')).toHaveLength(2);
    expect(screen.root.style.getPropertyValue('--fe-title-ph')).toContain(TITLE_PLACEHOLDER);
    screen.exit();
  });
});

// ---------------------------------------------------------- the layout keeps Yuna and the lettering clear

describe('title-echo.css: the layout rules', () => {
  const css = read('src/app/screens/frontend/title-echo.css');
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');

  it('puts every rule under .fe-title--echo, so the Farplane screen cannot be touched by it', () => {
    const selectors = [...code.matchAll(/([^{}]+)\{/g)].map((m) => m[1]!.trim()).filter((s) => !s.startsWith('@media'));
    expect(selectors.length).toBeGreaterThan(3);
    for (const sel of selectors) for (const part of sel.split(',')) expect(part.trim(), sel).toContain('.fe-title--echo');
  });

  it('crops by cover only where the picture’s figure and lettering survive it, and shows the whole picture elsewhere', () => {
    // default: cover, anchored 50 % across and 65 % down (the lettering is at v 0.85 to 0.92, Yuna’s head at v 0.10)
    expect(code).toMatch(/--fe-art-x:\s*50%/);
    expect(code).toMatch(/--fe-art-y:\s*65%/);
    expect(code).toMatch(/\.fe-title--echo \.fe-title__plane img\s*\{\s*object-fit:\s*cover/);
    // 1.9:1 and wider: contain (a cover beyond that takes more of the height than the lettering and Yuna's hair allow)
    expect(code).toMatch(/@media \(min-aspect-ratio: 19 \/ 10\)\s*\{[^}]*object-fit:\s*contain/);
  });

  it('keeps the crop of a cover fit inside what the picture can lose, at every window shape cover is used for', () => {
    // Where the picture's lettering (v 0.85 to 0.92, rule at 0.923) and Yuna's head (v 0.10) stand, from the sidecar's measurements.
    const aspect = 1682 / 932;
    for (const win of [0.8, 1, 4 / 3, 1.5, 1.6, 16 / 9, 1.85, 1.89]) {
      // cover: the picture is scaled to fill the window; the part that does not fit is lost (anchor 50 % across, 65 % down)
      const lostH = win >= aspect ? 1 - aspect / win : 0; // share of the picture's HEIGHT lost
      const lostTop = lostH * 0.65;
      const lostBottom = lostH * 0.35;
      expect(lostTop, `window ${win}: Yuna's head (v 0.10) is kept`).toBeLessThan(0.05);
      expect(lostBottom, `window ${win}: the painted rule (v 0.923) and the lettering (to 0.92) are kept`).toBeLessThan(0.03);
      // across: the lettering spans u 0.31 to 0.70 and Yuna u 0.31 to 0.61; the visible share of the width, centred, holds them
      const shown = win >= aspect ? 1 : win / aspect;
      expect(0.5 - shown / 2, `window ${win}: the lettering's left edge is kept`).toBeLessThan(0.31);
      expect(0.5 + shown / 2, `window ${win}: the lettering's right edge is kept`).toBeGreaterThan(0.70);
    }
  });

  it('puts the hint row under the painted rule: lowered, so the lettering is never under it', () => {
    expect(code).toMatch(/\.fe-title--echo \.fe-hint\s*\{\s*bottom:\s*calc\(12 \* var\(--fe-k\)\)/);
    // the Farplane value is 26 grid units (frontend.css); 12 is the lowest that keeps the row's text clear of the frame's foot
    expect(read('src/app/screens/frontend/frontend.css')).toMatch(/\.fe-hint\s*\{[^}]*bottom:\s*calc\(26 \* var\(--fe-k\)\)/);
  });

  it('hides the vertical strap where the painted city would be under it (narrower than 3:2), as the phone already does', () => {
    expect(code).toMatch(/@media \(max-aspect-ratio: 3 \/ 2\)\s*\{[^}]*\.fe-title--echo \.fe-title__strap[^}]*display:\s*none/);
  });

  it('fades the placeholder out once the picture has decoded, and draws it the way the picture is drawn', () => {
    expect(code).toMatch(/\.fe-title--echo\.fe-title--decoded \.fe-title__plane--far::before\s*\{\s*opacity:\s*0/);
    expect(code).toMatch(/@media \(min-aspect-ratio: 19 \/ 10\)\s*\{[\s\S]*?::before\s*\{\s*background-size:\s*contain/);
  });

  it('draws the picture in a box of its own aspect on a portrait window: 192 vw on a phone, 140 vw on a tablet', () => {
    // 1682 / 932, the picture's own ratio
    expect(1682 / 932).toBeCloseTo(1.8047, 4);
    const portrait = /@media \(max-aspect-ratio: 4 \/ 5\)\s*\{([\s\S]*?)\n\}\n@media/.exec(code)?.[1] ?? '';
    expect(portrait).toContain('--echo-w: 140vw');
    expect(portrait).toMatch(/left:\s*calc\(50% - var\(--echo-w\) \/ 2\)/);
    expect(portrait).toMatch(/height:\s*calc\(var\(--echo-w\) \/ 1\.8047\)/);
    expect(portrait).toMatch(/top:\s*calc\(50% - var\(--echo-w\) \/ 3\.6094\)/);
    expect(portrait).toMatch(/mask-image:\s*linear-gradient\(to bottom, transparent 0/);
    expect(3.6094).toBeCloseTo(2 * 1.8047, 4); // half the box's height
    const phone = /@media \(max-aspect-ratio: 4 \/ 5\) and \(max-width: 760px\)\s*\{([\s\S]*)\}\s*$/.exec(code)?.[1] ?? '';
    expect(phone).toContain('--echo-w: 192vw');
    // Yuna spans u 0.31 to 0.61 and the lettering u 0.31 to 0.70 of the picture; a phone's 192 vw shows u 0.24 to 0.76, a tablet's 140 vw u 0.14 to 0.86
    for (const vw of [192, 140]) {
      const shown = 100 / vw;
      expect(0.5 - shown / 2, `${vw} vw: the left of the lettering is kept`).toBeLessThan(0.31);
      expect(0.5 + shown / 2, `${vw} vw: the right of the lettering is kept`).toBeGreaterThan(0.7);
    }
  });

  // public/art is local only (gitignored): a checkout without it cannot read the sidecar, and says so by skipping.
  it.skipIf(!existsSync(resolve(REPO, 'public/art/title/echo.json')))('measures the picture it describes: 1682 x 932, from the sidecar', () => {
    const side = JSON.parse(read('public/art/title/echo.json')) as { canvas: { width: number; height: number }; id: string };
    expect(side.id).toBe('title/echo');
    expect(side.canvas).toEqual({ width: 1682, height: 932 });
  });
});

describe('the placeholder module and the markup agree on who draws what', () => {
  it('lists exactly the choices Settings.titleArt can hold', () => {
    expect(Object.keys(TITLE_PLACEHOLDERS).sort()).toEqual(['echo', 'farplane']);
    expect(Object.keys(TITLE_ART_PLATES).sort()).toEqual(['echo', 'farplane']);
  });
});
