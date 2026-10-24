/**
 * THE BOOTH'S TWO CARDS IN THE ECHO LOOK (conference demo, lane "booth"; Bailey, 2026-10-22, decision 188b "Mixed read (Recommended)": "End card and attract card in the Echo painting look"; both games: the cards are
 * the shared front door and say nothing about either game; they are built from the mockups `options-book/booth-frame/endcard-A` and `attract-A`, which are the pictures he picked).
 *
 * END CARD ("The Echo, held"): the Echo painting (`art/title/echo.png`, 1682 x 932, the title's own plate) holds the frame and pushes in slowly; its painted lettering is the title. Words on the left ("An unofficial fan
 * tribute", the one-line pitch), the QR and the address on the right ("Scan to play"). Nothing else. It is the demo's "Thanks for playing" card after a won fight (`demoThanks.ts`), and the card the booth loop returns
 * to (`BoothCardScreen.ts`, `?card=end`).
 *
 * ATTRACT CARD ("Still water"): the same painting, still and breathing, above a black band: "Pick up the controller" in italic serif, the pad glyph with a ring that breathes out of its A button every 1.5 s,
 * "Press any button", and a small QR "Or play at home" (`boothAttract.ts`, started by the title's 60 s idle count, `demoTitle.ts`).
 *
 * Sizes are in the front end's grid unit (`--bk` = `--fe-k`: 1 px at 1440 x 810, 1.78 px at 2560 x 1440), so the card is the same picture at every window size. TEXT FLOOR: every word is at least 16 units, which is 28 px
 * at 2560 x 1440 (Bailey's floor); the mockups' 8 to 11 px labels (at 1280 wide) were raised to it. REDUCE MOTION: no push, no breathing, no ring, no drift (`boothCards.css`); the cards stand in their final state.
 *
 * This module is markup and a seeded scatter of pyreflies only: pure strings (so a test reads the words), plus two mount functions that put the strings on the page.
 */
import { artUrl } from '../../engine/PaintedArt.ts';
import { TITLE_ART_PLATES } from '../saveFrontend.ts';
import { boothHost, boothQrSvg } from './demoQr.ts';
import './boothCards.css';

/** The words of the end card, as the picked mockup sets them. */
export const END_EYEBROW = 'An unofficial fan tribute';
export const END_PITCH: readonly string[] = ['Play the boss fights of', 'Final Fantasy X and X-2,', 'reimagined.'];
export const END_SCAN = 'Scan to play';
export const END_FINE = 'Free, in your browser.';
/**
 * Decision 173h's words, kept when the end card is the card after a won fight (not when it is the booth loop's card): one line above the picked frame's own words, so the visitor who has just played is thanked.
 * The picked end-card frame has no such line (it was drawn for the trailer's last 9 s); this is the one addition, and `END_THANKS_ON_AFTER_FIGHT` takes it away.
 */
export const END_THANKS = 'Thanks for playing';
export const END_THANKS_ON_AFTER_FIGHT = true;

/** The words of the attract card. */
export const ATTRACT_PROMPT = 'Pick up the controller';
export const ATTRACT_PRESS = 'Press any button';
export const ATTRACT_HOME = 'Or play at home';

export interface EndCardOptions {
  /** The card after a won fight: the thanks line, and a shorter build-up (the card ends on a press or in 8 s). False for the booth loop's own card. */
  afterFight?: boolean;
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The Echo painting's URL as the game builds it (the master's name, or the shipped copy of it in a production build). */
export function echoPaintingUrl(): string {
  return artUrl(TITLE_ART_PLATES.echo);
}

/** A deterministic scatter (mulberry32), so a screenshot of the card is the same every time. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GlowRegion {
  /** The region in the mockup's 1280 x 720 design space. */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  n: number;
}

/**
 * Pyreflies: soft golden lights that drift up and twinkle (the mockup's own scatter, the same seeds). Placed by percent of the frame and sized in grid units; the drift and twinkle are CSS animations
 * (`boothCards.css`), so REDUCE MOTION stops them with one rule and they stand still at their base opacity.
 */
export function glowsMarkup(regions: readonly GlowRegion[], seed: number, minD: number, maxD: number): string {
  const rnd = rng(seed);
  const out: string[] = [];
  for (const r of regions) {
    for (let i = 0; i < r.n; i++) {
      const d = minD + Math.pow(rnd(), 2.2) * (maxD - minD);
      const dur = 7 + rnd() * 9;
      const o0 = (0.25 + rnd() * 0.4).toFixed(2);
      const o1 = (0.55 + rnd() * 0.45).toFixed(2);
      const x = r.x0 + rnd() * (r.x1 - r.x0);
      const y = r.y0 + rnd() * (r.y1 - r.y0);
      const dx = ((rnd() - 0.5) * 36 * 1.125).toFixed(1);
      const dy = ((-6 - rnd() * 22) * 1.125).toFixed(1);
      const dd = (d * 1.125).toFixed(2);
      const twinkle = (2.4 + rnd() * 3.4).toFixed(2);
      out.push(
        `<i class="booth-glow" style="left:${((x / 1280) * 100).toFixed(2)}%;top:${((y / 720) * 100).toFixed(2)}%;width:calc(${dd} * var(--bk));height:calc(${dd} * var(--bk));` +
          `--dx:calc(${dx} * var(--bk));--dy:calc(${dy} * var(--bk));--o0:${o0};--o1:${o1};` +
          `animation:booth-drift ${dur.toFixed(2)}s ease-in-out ${(-rnd() * dur).toFixed(2)}s infinite alternate,booth-twinkle ${twinkle}s ease-in-out ${(-rnd() * 4).toFixed(2)}s infinite"></i>`,
      );
    }
  }
  return `<div class="booth-glows" aria-hidden="true">${out.join('')}</div>`;
}

/** The generic pad glyph (a drawing of no console's own): body, two sticks, d-pad and the four face buttons, the A button in gold. The ring breathes out of the A button. */
export function padGlyphMarkup(): string {
  return (
    `<span class="booth-pad" aria-hidden="true"><i class="booth-pad__ring"></i>` +
    `<svg viewBox="0 0 100 66" fill="none" stroke="rgba(244,241,232,0.9)" stroke-width="2.6" stroke-linejoin="round" focusable="false">` +
    `<path d="M22 8h56c8 0 13 5 16 17l5 24c1.7 8.5-3.4 14.500-11 14.500-5 0-8-2.500-11-7-2-3-4-5-8-5H31c-4 0-6 2-8 5-3 4.500-6 7-11 7-7.600 0-12.700-6-11-14.500l5-24C9 13 14 8 22 8z" fill="rgba(11,10,18,0.55)"/>` +
    `<circle cx="27" cy="25" r="6.500" stroke-width="2.200"/><circle cx="60" cy="43" r="6.500" stroke-width="2.200"/>` +
    `<path d="M40 36v14M33 43h14" stroke-width="3.600"/>` +
    `<circle cx="76" cy="20" r="3.800" fill="rgba(244,241,232,0.55)" stroke="none"/><circle cx="76" cy="34" r="3.800" fill="#e3b94a" stroke="none"/>` +
    `<circle cx="69" cy="27" r="3.800" fill="rgba(244,241,232,0.55)" stroke="none"/><circle cx="83" cy="27" r="3.800" fill="rgba(244,241,232,0.55)" stroke="none"/>` +
    `</svg></span>`
  );
}

const qrAria = (): string => `QR code. Scan it to play Echoes of Spira on your phone at ${boothHost()}.`;

/** The end card's markup. */
export function endCardMarkup(opts: EndCardOptions = {}): string {
  const after = opts.afterFight === true;
  const thanks = after && END_THANKS_ON_AFTER_FIGHT ? `<div class="booth-end__thanks booth-rise" style="--s:1700ms">${esc(END_THANKS)}</div>` : '';
  return (
    `<div class="booth-card booth-end${after ? ' booth-end--after' : ''}" data-role="booth-end" style="--bt:${after ? 0.42 : 1}">` +
    `<div class="booth-end__art"><img class="booth-end__img" src="${esc(echoPaintingUrl())}" alt="Echoes of Spira: Yuna kneeling in still water at night, the crystal city far off" draggable="false"></div>` +
    glowsMarkup(
      [
        { x0: 0, x1: 1280, y0: 20, y1: 260, n: 22 },
        { x0: 60, x1: 1220, y0: 380, y1: 600, n: 26 },
      ],
      90210,
      3,
      10,
    ) +
    `<div class="booth-end__left">${thanks}` +
    `<div class="booth-eyebrow booth-rise" style="--s:2100ms">${esc(END_EYEBROW)}</div>` +
    `<p class="booth-tagline booth-rise" style="--s:2300ms">${END_PITCH.map((l) => `<span>${esc(l)}</span>`).join('')}</p>` +
    `</div>` +
    `<div class="booth-end__right">` +
    `<div class="booth-qr booth-fade" style="--s:2900ms;--d:700ms" role="img" aria-label="${esc(qrAria())}">${boothQrSvg()}</div>` +
    `<span class="booth-scan booth-rise" style="--s:3100ms">${esc(END_SCAN)}</span>` +
    `<span class="booth-host booth-rise" style="--s:3250ms">${esc(boothHost())}</span>` +
    `<span class="booth-fine booth-rise" style="--s:3400ms">${esc(END_FINE)}</span>` +
    `</div></div>`
  );
}

/** The attract card's markup. */
export function attractCardMarkup(): string {
  return (
    `<div class="booth-card booth-attract" data-role="booth-attract">` +
    `<div class="booth-attract__art"><img class="booth-attract__img" src="${esc(echoPaintingUrl())}" alt="Echoes of Spira: Yuna kneeling in still water at night, the crystal city far off" draggable="false"></div>` +
    glowsMarkup(
      [
        { x0: 0, x1: 1280, y0: 20, y1: 250, n: 22 },
        { x0: 60, x1: 1220, y0: 360, y1: 560, n: 22 },
        { x0: 200, x1: 1080, y0: 570, y1: 700, n: 8 },
      ],
      777,
      3,
      9,
    ) +
    `<div class="booth-attract__prompt">${esc(ATTRACT_PROMPT)}</div>` +
    `<div class="booth-attract__press">${padGlyphMarkup()}<span class="booth-scan booth-scan--wide">${esc(ATTRACT_PRESS)}</span></div>` +
    `<div class="booth-eyebrow booth-attract__fan">${esc(END_EYEBROW)}</div>` +
    `<div class="booth-attract__qr"><div class="booth-attract__qrtext"><span class="booth-scan">${esc(ATTRACT_HOME)}</span><span class="booth-host">${esc(boothHost())}</span></div>` +
    `<div class="booth-qr" role="img" aria-label="${esc(qrAria())}">${boothQrSvg()}</div></div>` +
    `</div>`
  );
}

/** The card's own element, set on the page's UI layer (or any parent) and returned. The card never takes input; whoever mounts it listens for the press. */
function mount(parent: HTMLElement, html: string): HTMLElement {
  const holder = document.createElement('div');
  holder.innerHTML = html;
  const el = holder.firstElementChild as HTMLElement;
  parent.appendChild(el);
  return el;
}

/** Put the end card in `parent`. */
export function mountEndCard(parent: HTMLElement, opts: EndCardOptions = {}): HTMLElement {
  return mount(parent, endCardMarkup(opts));
}

/** Put the attract card in `parent`. */
export function mountAttractCard(parent: HTMLElement): HTMLElement {
  return mount(parent, attractCardMarkup());
}
