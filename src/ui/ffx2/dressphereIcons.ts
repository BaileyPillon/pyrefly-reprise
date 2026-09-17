/**
 * Shared visual vocabulary for FFX-2 dressphere icons and character portraits,
 * used by {@link FFX2BattleHud}, `SpherechangeWheel` and `PartyPrep` so the
 * three surfaces agree on colour and fallback behaviour.
 *
 * Job colours are verbatim from `research/visual-bible.md` §4.4. Real emblem
 * art does not exist yet, so the "sphere-emblem" style (§4.4 Style A) is
 * approximated with a radial-gradient disc plus the dressphere's own initial —
 * swap in real 10x10 emblem art later without touching call sites.
 *
 * Character art ids follow the orchestrator's naming: `<girl>-<dressphere>`
 * under `public/art/characters/<id>/`, portraits at
 * `public/art/portraits/{yuna,rikku,paine}.png`. None of the X-2 portraits
 * exist on disk yet, so every portrait renders an initial-letter fallback chip
 * behind an `<img onerror>` that never fires until the real art lands.
 */
import { artUrl } from '../../engine/PaintedArt.ts';

/** `research/visual-bible.md` §4.4 job colour table. */
export const DRESSPHERE_COLOURS: Record<string, string> = {
  gunner: '#F7B6D9',
  warrior: '#C93A42',
  thief: '#75913A',
  'white-mage': '#F4F1E8',
  'black-mage': '#5E3C7E',
  'dark-knight': '#2E2E5E',
  samurai: '#A9762E',
  songstress: '#3A78BE',
  alchemist: '#4FB05E',
  'gun-mage': '#3E9E96',
  berserker: '#E0742E',
  trainer: '#8E6A3E',
  'lady-luck': '#E3B94A',
  mascot: '#F49BB8',
  festivalist: '#F2712E',
  psychic: '#7A5AB8',
  'floral-fallal': '#F7B6D9',
  'machina-maw': '#3E9E96',
  'full-throttle': '#C93A42',
};

const DEFAULT_COLOUR = '#8E6A3E';

/**
 * Two-letter monogram per dressphere, authored rather than sliced.
 *
 * `id.charAt(0)` collides on every pair the roster actually fields: Warrior and
 * White Mage are both `W` (Yuna and Paine drew the same tile in
 * `docs/screenshots/52-ffx2-bahamut.png`), Gunner and Gun Mage are both `G`,
 * Samurai and Songstress both `S`, Thief and Trainer both `T`, Mascot and
 * Machina Maw both `M`. One letter cannot name sixteen jobs, so the tile takes
 * two — the same reason `statusChips.ts` stopped slicing status ids.
 */
const ABBR: Record<string, string> = {
  gunner: 'GN',
  warrior: 'WR',
  thief: 'TH',
  'white-mage': 'WM',
  'black-mage': 'BM',
  'dark-knight': 'DK',
  samurai: 'SM',
  songstress: 'SG',
  alchemist: 'AL',
  'gun-mage': 'GM',
  berserker: 'BS',
  trainer: 'TR',
  'lady-luck': 'LL',
  mascot: 'MA',
  festivalist: 'FE',
  psychic: 'PS',
  'floral-fallal': 'FF',
  'machina-maw': 'MW',
  'full-throttle': 'FT',
};

/**
 * The monogram for a dressphere tile. Falls back to the first letter of each
 * hyphenated word, then to the first two letters — which is only reached by a
 * dressphere this table has not caught up with.
 */
export function dressphereAbbr(id: string): string {
  const known = ABBR[id];
  if (known) return known;
  const words = id.split('-').filter(Boolean);
  if (words.length > 1) return (words[0]!.charAt(0) + words[1]!.charAt(0)).toUpperCase();
  return (id.slice(0, 2) || '?').toUpperCase();
}

/** Best-effort display label from a kebab-case dressphere id. */
export function dressphereLabel(id: string): string {
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function dressphereColour(id: string): string {
  return DRESSPHERE_COLOURS[id] ?? DEFAULT_COLOUR;
}

/** `public/art/characters/<girl>-<dressphere>/idle.png` */
export function dressphereArtUrl(characterId: string, dressphereId: string): string {
  return artUrl(`art/characters/${characterId}-${dressphereId}/idle.png`);
}

/** `public/art/portraits/<characterId>.png` */
export function portraitArtUrl(characterId: string): string {
  return artUrl(`art/portraits/${characterId}.png`);
}

/**
 * A 24x24 (or `size`) "sphere-emblem" dressphere icon: radial gradient in the
 * job colour to a dark rim, a specular fleck, and the dressphere's initial.
 * `ring` draws the state ring (worn/reachable/unreachable) around it.
 */
export function dressphereIconHtml(
  dressphereId: string,
  opts: { size?: number; ringClass?: string } = {},
): string {
  const size = opts.size ?? 24;
  const colour = dressphereColour(dressphereId);
  const monogram = dressphereAbbr(dressphereId);
  const ring = opts.ringClass ? ` ${opts.ringClass}` : '';
  // No `data-dressphere` attribute here on purpose: callers (PartyPrep's
  // dressphere list, CommandMenu) put their own `data-*` click hooks on the
  // *row*, and a duplicate attribute on this inner icon would double-match
  // any `[data-dressphere]`/`[data-node]`-style query.
  return `<span class="ffx2-icon${ring}" style="width:${size}px;height:${size}px;--ffx2-job:${colour}"
    title="${dressphereLabel(dressphereId)}">
    <span class="ffx2-icon__glyph">${monogram}</span>
  </span>`;
}

/**
 * A round portrait with an initial-letter fallback chip behind it. The `<img>`
 * sits on top and hides itself on error, revealing the fallback that was
 * already there — no script wiring beyond the inline handler, matching the
 * pattern `HudMock` already uses for FFX portraits.
 */
export function portraitHtml(characterId: string, name: string, size = 24): string {
  const initial = (name.trim().charAt(0) || '?').toUpperCase();
  const url = portraitArtUrl(characterId);
  return `<span class="ffx2-portrait" style="width:${size}px;height:${size}px">
    <span class="ffx2-portrait__fallback">${initial}</span>
    <img src="${url}" alt="" width="${size}" height="${size}"
      onerror="this.style.display='none'" />
  </span>`;
}
