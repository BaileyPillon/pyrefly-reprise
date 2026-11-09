/**
 * **The TRUST tab of the hidden Garik Ronso chapter's party prep** (FFX-2 only, 2026-11-08; the preflight's pick GA2, `docs/plans/ch-lionheart-review.md` section 2): the one place the chapter's one setting, **Ronso trust**,
 * is chosen (`../../../data/garik-ronso-trust.ts`). Low (the default) is the hostile fight, two Ronso Youths and Garik; high is the friendly bout, one Youth and Garik. The tooltip is the preflight's own line: "In the game this
 * follows how you answered the Ronso on Mt. Gagazet."
 *
 * It is registered like every other panel (`registerPrepPanel`) but is **visible for this chapter only** (`PrepPanel.visible`), so no other chapter's prep gains a tab. It is the first tab of the FFX-2 prep that is not
 * read-only (the others only display the loadout, `./panels.ts`), and it changes nothing about the build: the setting names a formation and nothing else. **A plain stand-in, to show Bailey** (rule 9: the screen gets
 * a mockup and his word before it is polished): two rows on the ivory sheet, a click or tap picks one, **Triangle** (a lone Shift tap or Q; pad Y; **not Tab, which is the browser's on this screen** and walks the focus to the two rows, where Enter presses the one focused) flips the choice from the keyboard or the pad. The choice is kept in a key of its own
 * (never the save), and takes effect when the battle opens.
 *
 * Game case: FFX-2 only (the chapter is FFX-2's); the prep shell is shared plumbing.
 */

import type { PrepPanel, PrepPanelContext } from '../../../app/screens/PartyPrepScreen.ts';
import { audio } from '../../../audio/index.ts';
import { GARIK_RONSO_ID } from '../../../data/garik-ronso-ids.ts';
import { RONSO_TRUST_TEXT, RONSO_TRUSTS, getRonsoTrust, otherRonsoTrust, setRonsoTrust, type RonsoTrust } from '../../../data/garik-ronso-trust.ts';
import { appendPhoneHost, isOpen, readOpen } from '../../common/prepPhoneFold.ts';
import { sectionHtml } from '../../common/prepPhoneKit.ts';
import './ronso-trust.css';

/** The panel's id (the tab's key). */
export const RONSO_TRUST_PANEL_ID = 'ronso-trust';

/** The `data-action` a row carries: `ronso:trust:low` or `ronso:trust:high`. */
export const RONSO_TRUST_ACTION = 'ronso:trust:';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** The panel's markup for the setting as it stands. */
export function ronsoTrustHtml(trust: RonsoTrust): string {
  const rows = RONSO_TRUSTS.map((value) => {
    const text = RONSO_TRUST_TEXT[value];
    const on = value === trust;
    return (
      `<div class="rtrust__opt" role="radio" aria-checked="${on}" tabindex="0" data-trust="${value}" data-action="${RONSO_TRUST_ACTION}${value}">` +
      `<span class="rtrust__name">${escapeHtml(text.name.toUpperCase())}</span>` +
      `<span class="rtrust__fight">${escapeHtml(text.fight)}${on ? ' &middot; chosen' : ''}</span>` +
      `<span class="rtrust__detail">${escapeHtml(text.detail)}</span>` +
      '</div>'
    );
  }).join('');
  return (
    '<div class="rtrust" role="radiogroup" aria-label="Ronso trust">' +
    `<div class="rtrust__head"><b>${escapeHtml(RONSO_TRUST_TEXT.label.toUpperCase())}</b><span class="rtrust__tip">${escapeHtml(RONSO_TRUST_TEXT.tooltip)}</span></div>` +
    rows +
    '</div>'
  );
}

/**
 * The phone page of the tab (the prep shell's one long page, `../../common/prepPhoneKit.ts`): one open section, the two rows as big tap targets (the Overdrive tab's shape: `prph-mode` rows and a blurb), and what the
 * chosen row means. The rows carry the same `data-action` as the desktop rows, so a tap is the same press.
 */
export function ronsoTrustPhoneHtml(trust: RonsoTrust, open: ReadonlyMap<string, boolean>): string {
  const rows = RONSO_TRUSTS.map((value) => {
    const text = RONSO_TRUST_TEXT[value];
    const on = value === trust;
    return (
      `<div class="prph-mode${on ? ' is-sel' : ''}" role="radio" aria-checked="${on}" tabindex="0" data-trust="${value}" data-action="${RONSO_TRUST_ACTION}${value}">` +
      `<span class="prph-mode__name">${escapeHtml(text.name.toUpperCase())} &middot; ${escapeHtml(text.fight.toUpperCase())}</span>${on ? '<span class="prph-mode__tag">CHOSEN</span>' : ''}</div>`
    );
  }).join('');
  const chosen = RONSO_TRUST_TEXT[trust];
  return sectionHtml({
    key: 'ronso-trust',
    label: RONSO_TRUST_TEXT.label.toUpperCase(),
    title: RONSO_TRUST_TEXT.tooltip,
    digest: `${chosen.name}: ${chosen.fight}`,
    open: isOpen(open, 'ronso-trust', true),
    body: `<div class="prph-modes" role="radiogroup" aria-label="Ronso trust">${rows}</div><p class="prph-blurb">${escapeHtml(chosen.detail)}</p>`,
  });
}

export function makeRonsoTrustPanel(): PrepPanel {
  let deskEl: HTMLElement | null = null;
  let phoneEl: HTMLElement | null = null; // the phone page, hidden above 599 px beside the desktop markup
  const draw = (): void => {
    if (deskEl) deskEl.innerHTML = ronsoTrustHtml(getRonsoTrust());
    if (phoneEl) phoneEl.innerHTML = ronsoTrustPhoneHtml(getRonsoTrust(), readOpen(phoneEl));
  };
  const choose = (value: RonsoTrust): void => {
    if (value === getRonsoTrust()) return;
    setRonsoTrust(value);
    audio.playSfx('cursor-move');
    draw();
  };
  return {
    id: RONSO_TRUST_PANEL_ID,
    label: 'Trust',
    game: 'ffx2',
    order: 60,
    fullScreen: false,
    visible: (chapter) => chapter.id === GARIK_RONSO_ID,
    mount(root: HTMLElement, _ctx: PrepPanelContext) {
      root.innerHTML = '<div class="rtrust-desk"></div>';
      deskEl = root.querySelector('.rtrust-desk');
      phoneEl = appendPhoneHost(root);
      draw();
    },
    unmount() {
      deskEl = null;
      phoneEl = null;
    },
    handleInput(input) {
      let consumed = false;
      for (const action of input.actions) {
        if (!action.startsWith(RONSO_TRUST_ACTION)) continue;
        const value = action.slice(RONSO_TRUST_ACTION.length);
        if (value === 'low' || value === 'high') choose(value);
        consumed = true;
      }
      if (input.justPressed('triangle')) {
        choose(otherRonsoTrust(getRonsoTrust()));
        consumed = true;
      }
      return consumed;
    },
    hint: () => ({ keys: 'Q', label: 'FLIPS THE TRUST', pad: 'Triangle' }),
  };
}
