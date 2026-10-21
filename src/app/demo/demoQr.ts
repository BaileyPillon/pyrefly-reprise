/**
 * THE QR CODE (release 61, the conference demo; Bailey, 2026-10-21, decision 169o: "a QR code to echoesofspira.com, title corner in demo mode + a printable card"; both games, demo mode only).
 *
 * A small ivory plate with a QR code and the address, in a corner of the title and of the fight picker. The code is made in code from {@link BOOTH_URL} by `ui/demo/qr.ts` (no library, no file to ship), so
 * the address on the plate and the address in the code cannot differ. The printable card (`docs/booth/qr-card.png` and `.pdf`) is made from the same function by `tools/demo-qr-card.mjs`.
 *
 * Error correction is level M (a scratched or glared screen still reads), four light modules of quiet zone, dark modules in the interface's ink on the ivory of its paper: the same two colours as the
 * game's own slabs, which also gives the code the contrast a camera wants.
 */

import './demo.css';
import { encodeQr, type QrCode } from '../../ui/demo/qr.ts';
import { qrSvg } from '../../ui/demo/qrSvg.ts';
import { BOOTH_URL } from './demoFlow.ts';

/** The ink and paper of the plate (`ui/inkgold/tokens.css`: `--ig-ink`, `--ig-paper`), as literals because an SVG string cannot read the page's custom properties when it is also written to a file. */
export const QR_INK = '#0b0a12';
export const QR_PAPER = '#f4f1e8';

let cached: QrCode | null = null;

/** The booth address as a QR code (level M). Built once. */
export function boothQr(): QrCode {
  return (cached ??= encodeQr(BOOTH_URL, { ec: 'M' }));
}

/** The plate's SVG: the code alone, ink on paper, with its quiet zone. */
export function boothQrSvg(): string {
  return qrSvg(boothQr(), { dark: QR_INK, light: QR_PAPER, quiet: 4, attrs: 'role="img" aria-hidden="true" focusable="false"' });
}

/** The address as it is printed under the code. */
export function boothHost(): string {
  return BOOTH_URL.replace(/^https?:\/\//, '');
}

/**
 * Put the plate in `parent` and return it. `where` only names the corner's rule in the stylesheet (`demo.css`); the plate never takes input (`pointer-events: none`), so it cannot start a fight or hide a click.
 */
export function mountQrPlate(parent: HTMLElement, where: 'title' | 'picker'): HTMLElement {
  const el = document.createElement('div');
  el.className = `demo-qr demo-qr--${where}`;
  el.dataset['role'] = 'demo-qr';
  el.dataset['url'] = BOOTH_URL;
  el.setAttribute('role', 'img');
  el.style.setProperty('--fe-k', 'max(0.5px, min(100vw / 1440, 100vh / 810))'); // the front end's grid unit (`frontend.css`), for a plate that sits outside a `.fe` screen
  el.setAttribute('aria-label', `QR code. Scan it to play Echoes of Spira on your phone at ${boothHost()}.`);
  el.innerHTML = `<div class="demo-qr__code">${boothQrSvg()}</div><div class="demo-qr__cap"><b>Play it yourself</b><span>${boothHost()}</span></div>`;
  parent.appendChild(el);
  return el;
}
