/**
 * THE PICKER'S CONTROLS CARD (release 62, the conference demo; Bailey, 2026-10-22 ~00:00 EDT, decision 173d: "A 3-line controls card on the picker (Recommended)" with pad glyphs; both games, demo mode only).
 *
 * Three lines under the two fight cards, in the interface's own hand (ink plate, gold edge, the r61 pad glyphs), for a visitor who has never held this game's controls:
 *
 *   1. the d-pad chooses a fight, A starts it;
 *   2. B goes back to the title, Y swaps the title's picture (the pad's Y does what T does there, `TitleScreen.ts`);
 *   3. "Follow the NEXT tip to win": the advisor's one line in the fight, headed NEXT (`demoHud.ts`). Bailey's words were "the gold tip"; it is gold in FFX and pyre pink in FFX-2 (the interface's one accent per game),
 *      so the line names the word on the tip, and is set in the card's own accent, which follows the highlighted fight the same way.
 *
 * Each key is written once with the pad's button beside it (`keyHint`, `ui/common/padGlyphs.ts`): `html[data-input]` shows the key or the button by the device the visitor touched last, with nothing re-rendered,
 * so a booth that starts on the pad's words (`inputDevice.ts`) reads "A / B / Y" and a keyboard press turns it into "Enter / Esc / T". It replaces the strip under the cards in demo mode (`demo.css` hides
 * that one): the same facts, once, larger, and with the one line a first-timer needs.
 *
 * Y only does something on the TITLE (it swaps the title's art; the picker has no art to swap), so the line says so in its words ("its art") rather than promise a button that does nothing here.
 */

import { keyHint } from '../../ui/common/padGlyphs.ts';
import './demo.css';

/** The words of the three lines, so a test (and Bailey's copy edit) has one place. */
export const CONTROLS_TEXT = {
  choose: 'choose',
  fight: 'fight',
  back: 'back to the title',
  art: 'swap its art',
  tip: 'Follow the NEXT tip to win',
} as const;

/** The card's markup: three rows, every key chip carrying both the key and the pad's button. */
export function controlsCardHtml(): string {
  const chip = (key: string, pad: string): string => `<b>${keyHint(key, pad)}</b>`;
  return `
    <div class="demo-controls__row">${chip('◀ ▶', 'D-pad')} ${CONTROLS_TEXT.choose}<i></i>${chip('Enter', 'Cross')} ${CONTROLS_TEXT.fight}</div>
    <div class="demo-controls__row">${chip('Esc', 'Circle')} ${CONTROLS_TEXT.back}<i></i>${chip('T', 'Triangle')} ${CONTROLS_TEXT.art}</div>
    <div class="demo-controls__tip">${CONTROLS_TEXT.tip}</div>`;
}

/** Put the card in `parent` and return it. It never takes input (`pointer-events: none`). */
export function mountControlsCard(parent: HTMLElement): HTMLElement {
  const el = document.createElement('div');
  el.className = 'demo-controls';
  el.dataset['role'] = 'demo-controls';
  el.style.setProperty('--fe-k', 'max(0.5px, min(100vw / 1440, 100vh / 810))'); // the front end's grid unit (`frontend.css`)
  el.innerHTML = controlsCardHtml();
  parent.appendChild(el);
  return el;
}
