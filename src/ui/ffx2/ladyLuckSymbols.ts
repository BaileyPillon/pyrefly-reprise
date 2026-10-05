/**
 * The nine symbols on Lady Luck's reels, drawn as pictures [`visual-bible.md` §4.10.2: "Red 7, BAR, Cherry, plus the three
 * per-reel-set symbols (Sword/Helmet/Paw for Attack; Skull/Hat/Staff for Magic)"; the symbol *sets* are
 * `[verified: 2 sources]`, the art is `[estimate]`]. **FFX-2 only.**
 *
 * **Original drawings only** (AGENTS.md hard rule 8): plain SVG shapes in the Ink & Gold palette, authored here on a 40 x 40
 * grid, nothing traced from a retail game. The first six are the options page's drawings (Bailey picked that page);
 * the Red 7 and the BAR plate are redrawn as shapes, not text, so a late web font cannot change them; Skull, Hat and Staff
 * are drawn to match for the Magic Reels, which the page left as letters.
 *
 * Colours are the bible's: Red 7 `#D0343C`, BAR `#FBEAF4` on `#2A1A30`, Cherry `#D0343C` with a `#4FB05E` stem; steel,
 * gold `#E3B94A` and the pink-magenta of the FFX-2 chrome for the rest.
 */

const CREAM = '#fbeaf4';
const DARK = '#2a1a30';
const RED = '#d0343c';
const GOLD = '#e3b94a';
const MAGENTA = '#b0489e';
const PINK = '#f7b6d9';
const STEEL = '#c8d4e4';
const STEEL_DARK = '#9aa8bc';

/** What each symbol is called, for the reel's accessible name once it has stopped. */
export const SYMBOL_LABELS: Readonly<Record<string, string>> = {
  red7: 'Red 7',
  bar: 'BAR',
  cherry: 'Cherry',
  sword: 'Sword',
  helmet: 'Helmet',
  paw: 'Paw',
  skull: 'Skull',
  hat: 'Hat',
  staff: 'Staff',
};

const DRAWINGS: Readonly<Record<string, string>> = {
  red7: `<path d="M8.5 6.5H31.5L32 11.6L18.3 34.5H11.6L24.4 12.2H8.7Z" fill="${RED}" stroke="${CREAM}" stroke-width="1.7" stroke-linejoin="round"/>
<path d="M11 8.6H29.6" stroke="${CREAM}" stroke-opacity=".45" stroke-width="1.2" stroke-linecap="round"/>`,

  bar: `<rect x="3" y="11" width="34" height="18" rx="2" fill="${DARK}" stroke="${CREAM}" stroke-width="1.6"/>
<text x="20" y="25" text-anchor="middle" font-weight="700" font-size="12.5" letter-spacing="1.4" fill="${CREAM}" style="font-family:'Chakra Petch','Bahnschrift','Segoe UI',sans-serif">BAR</text>`,

  cherry: `<path d="M20 6C17 14 13 20 11 27M20 6C22 14 26 20 29 27" stroke="#4fb05e" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M20 6q6-3.5 11 1" stroke="#4fb05e" stroke-width="2" fill="none" stroke-linecap="round"/>
<circle cx="11" cy="29" r="7.5" fill="${RED}"/><circle cx="29" cy="29" r="7.5" fill="${RED}"/>
<circle cx="8.7" cy="26.4" r="2" fill="${CREAM}" opacity=".55"/><circle cx="26.7" cy="26.4" r="2" fill="${CREAM}" opacity=".55"/>`,

  sword: `<path d="M20 2.5L23.4 24.5H16.6Z" fill="#dfe6ee"/><path d="M20 2.5V24.5" stroke="${STEEL_DARK}" stroke-width="1"/>
<rect x="10.5" y="24.5" width="19" height="3.4" rx="1" fill="${GOLD}"/>
<rect x="18.4" y="27.9" width="3.2" height="8" fill="${MAGENTA}"/><circle cx="20" cy="37.2" r="2.1" fill="${GOLD}"/>`,

  helmet: `<path d="M7 28V20C7 11 13 6 20 6C27 6 33 11 33 20V28Z" fill="${STEEL}"/>
<rect x="7" y="19.5" width="26" height="4.8" fill="${DARK}"/><rect x="18.5" y="6" width="3" height="13.5" fill="${GOLD}"/>
<path d="M7 28H33V33.5H7Z" fill="${STEEL_DARK}"/>`,

  paw: `<ellipse cx="20" cy="27.5" rx="9.5" ry="7.8" fill="${CREAM}"/>
<ellipse cx="9" cy="18.5" rx="3.7" ry="4.8" fill="${CREAM}"/><ellipse cx="15.8" cy="11.5" rx="3.7" ry="4.8" fill="${CREAM}"/>
<ellipse cx="24.2" cy="11.5" rx="3.7" ry="4.8" fill="${CREAM}"/><ellipse cx="31" cy="18.5" rx="3.7" ry="4.8" fill="${CREAM}"/>`,

  skull: `<path d="M20 4.5C12.2 4.5 7.6 10 7.6 16.8C7.6 21 9.4 23.9 12 25.5V30C12 31.1 12.9 32 14 32H26C27.1 32 28 31.1 28 30V25.5C30.6 23.9 32.4 21 32.4 16.8C32.4 10 27.8 4.5 20 4.5Z" fill="${CREAM}"/>
<ellipse cx="14.6" cy="17.8" rx="3.7" ry="4.3" fill="${DARK}"/><ellipse cx="25.4" cy="17.8" rx="3.7" ry="4.3" fill="${DARK}"/>
<path d="M20 21.4L17.8 25.4H22.2Z" fill="${DARK}"/>
<path d="M16.4 28V32M20 28V32M23.6 28V32" stroke="${DARK}" stroke-width="1.2"/>
<path d="M10.4 34.5L29.6 38M29.6 34.5L10.4 38" stroke="${CREAM}" stroke-width="2.2" stroke-linecap="round"/>`,

  hat: `<ellipse cx="20" cy="30" rx="16.5" ry="4.8" fill="#7a2f6e" stroke="${CREAM}" stroke-width="1.2"/>
<path d="M11.2 29C13 20.5 16 12.5 21.4 4.6C25 7.4 25.4 11.6 26.5 15.8C27.8 20.4 28.8 24.8 28.8 29C25 31.4 15 31.4 11.2 29Z" fill="${MAGENTA}" stroke="${CREAM}" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M12.2 25.4C16.2 27.6 24.4 27.6 28.4 25.4L28.8 29C25 31.4 15 31.4 11.2 29Z" fill="${GOLD}"/>
<path d="M20.6 13L21.6 15.6L24.2 15.8L22.2 17.4L22.9 20L20.6 18.5L18.3 20L19 17.4L17 15.8L19.6 15.6Z" fill="${PINK}"/>`,

  staff: `<rect x="18.2" y="14" width="3.6" height="23.5" rx="1.5" fill="${STEEL}"/>
<rect x="16.4" y="22.5" width="7.2" height="2.6" rx="1" fill="${GOLD}"/>
<path d="M12.6 11.8C13.2 15.8 16.2 17.6 20 17.6C23.8 17.6 26.8 15.8 27.4 11.8" stroke="${GOLD}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<circle cx="20" cy="9.2" r="6.6" fill="${PINK}" stroke="${MAGENTA}" stroke-width="1.4"/>
<circle cx="17.8" cy="6.9" r="2.1" fill="#fff" opacity=".75"/>`,
};

/** The fallback for a symbol this file has no drawing for: a plate with its name, so a strip is never blank. */
function plate(id: string): string {
  const text = id.replace(/[^A-Za-z0-9 ]/g, '').slice(0, 5).toUpperCase();
  return `<rect x="4" y="9" width="32" height="22" rx="3" fill="${DARK}" stroke="${CREAM}" stroke-width="1.4"/>
<text x="20" y="24.4" text-anchor="middle" font-weight="700" font-size="9.5" fill="${CREAM}" style="font-family:'Chakra Petch','Bahnschrift','Segoe UI',sans-serif">${text}</text>`;
}

/** One symbol as an inline SVG (40 x 40 grid, decorative: the reel carries the accessible name). */
export function symbolSvg(id: string): string {
  return `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">${DRAWINGS[id] ?? plate(id)}</svg>`;
}

/** The name a screen reader says for a symbol. */
export function symbolLabel(id: string): string {
  return SYMBOL_LABELS[id] ?? id;
}
