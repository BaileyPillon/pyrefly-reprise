/**
 * The "we've moved" note: one line on the title screen of the OLD address, and nowhere else.
 *
 * Echoes of Spira lives at https://echoesofspira.com/ since 2026-10-04 (Cloudflare; Bailey: "Yes I will go with
 * your recommendation"). The address it was first published at, GitHub Pages
 * (the host `baileypillon.github.io`, project folder `/pyrefly-reprise/`), stays up, and the note tells whoever lands there. A
 * browser keeps a game's saves per address, so saves made on the old one stay on it: that is Bailey's pick S0 of
 * `docs/handoff/r39-cloudflare.md` section 7 (nothing is moved, the page says so), and the note says so too.
 *
 * Shown only when the page is served from exactly `baileypillon.github.io`. Never on echoesofspira.com (or its
 * `www`), the workers.dev backup and preview addresses, localhost or any other copy: the same build ships to every
 * host, and the hostname decides at run time. The check is a pure function (`onOldAddress`), so the rule is tested
 * on its own; `titleMarkup` asks it for the page's own hostname unless a test names one.
 *
 * It reuses the vocabulary of the title card's hint row (`.fe-hint`: ink chip, gold left rule, tracked display
 * capitals, the gold bold for the part to act on) and sits on the strap's right margin, so it reads as part of the
 * card and stays clear of the slab, the painting and the "Press Enter" chip. It is a plain link, pointer and touch
 * only: Enter always belongs to the game (`TitleScreen.advance`), so it is not in the tab order, and it sits OUTSIDE
 * the plate's `data-action="confirm"` element, or a click on it would also start the game.
 *
 * Game case: both (hosting; the title screen is the front door to FFX and FFX-2 alike).
 */

import './moved-notice.css';

/** The host the game was first published on: the GitHub Pages user site of the repo's owner. */
export const OLD_ADDRESS_HOST = 'baileypillon.github.io';

/** Where the game lives now: the one permanent address (the Worker's Custom Domain; `tools/deploy-host.mjs` LIVE_URL). */
export const NEW_ADDRESS = 'https://echoesofspira.com/';

/** The words of the note, in one place so a test can pin them. */
export const MOVED_NOTICE_TEXT = Object.freeze({
  lead: 'Echoes of Spira has moved to',
  domain: 'echoesofspira.com',
  saves: 'Saves made here stay here',
});

/** True only for the old address's own host (any case, with or without a trailing dot); false for everything else, a lookalike included. */
export function onOldAddress(hostname: string | null | undefined): boolean {
  if (typeof hostname !== 'string') return false;
  return hostname.trim().toLowerCase().replace(/\.$/, '') === OLD_ADDRESS_HOST;
}

function currentHostname(): string {
  return typeof window === 'undefined' ? '' : window.location.hostname;
}

/**
 * The note, as markup for the title card: an empty string unless `hostname` (default: this page's own) is the old
 * address. `onclick="this.blur()"` keeps focus from lingering on the link after a click that opens another tab,
 * where a later Enter would otherwise activate it as well as start the game.
 */
export function movedNoticeHtml(hostname: string | null | undefined = currentHostname()): string {
  if (!onOldAddress(hostname)) return '';
  const { lead, domain, saves } = MOVED_NOTICE_TEXT;
  return (
    `<a class="fe-title__moved ui-interactive" href="${NEW_ADDRESS}" tabindex="-1" onclick="this.blur()" data-moved-notice>` +
    `<span class="fe-title__moved-lead">${lead} <b>${domain}</b></span> ` +
    `<span class="fe-title__moved-saves">${saves}</span></a>`
  );
}
