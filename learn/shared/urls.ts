/**
 * Where the learning sites get their art and fonts from.
 *
 * `public/art/` is gitignored on `main` and never copied into `dist-learn`
 * (`learn/vite.config.ts`'s `copyPublicDir: false` — 368 MB of art must never
 * enter a learning-site build). In dev, Vite's own `publicDir` (`../public`)
 * serves `/art/**` and `/fonts/**` directly, so a bare `/art/...` URL
 * resolves. In production the learning site has no local copy at all, so it
 * reads the same files straight off the game's own deployed origin — the
 * game and the learning sites are expected to share a domain (GitHub Pages
 * project site), so an absolute path rooted at the game's base still
 * resolves from any page on that domain.
 *
 * The production base defaults to the game's own `PROD_BASE`
 * (`vite.config.ts` at the repo root) but is overridable per deploy via
 * `VITE_ART_BASE`, without editing this file or the game's build.
 */

const DEFAULT_PROD_ART_BASE = '/pyrefly-reprise/';

function artBase(): string {
  if (import.meta.env.DEV) {
    return '/';
  }
  const configured = import.meta.env['VITE_ART_BASE'];
  return typeof configured === 'string' && configured.length > 0 ? configured : DEFAULT_PROD_ART_BASE;
}

/** `artUrl('characters/vegnagun-body/idle.png')` -> a URL under the game's `public/art/`. */
export function artUrl(path: string): string {
  return `${artBase()}art/${path}`;
}

/** `fontUrl('exo2/Exo2-Variable-wght.woff2')` -> a URL under the game's `public/fonts/`. */
export function fontUrl(path: string): string {
  return `${artBase()}fonts/${path}`;
}

interface FontFace {
  readonly family: string;
  readonly file: string;
  readonly weight: string;
  readonly style?: 'italic';
}

/**
 * The four Ink & Gold font families (`docs/handoff/presentation-ink-and-gold.md`),
 * every weight a theme actually sets. Local files only — no hosted fonts.
 */
const FONT_FACES: readonly FontFace[] = [
  { family: 'Cormorant Garamond', file: 'cormorant-garamond/CormorantGaramond-Variable-wght.woff2', weight: '300 700' },
  { family: 'Cormorant Garamond', file: 'cormorant-garamond/CormorantGaramond-Italic-Variable-wght.woff2', weight: '300 700', style: 'italic' },
  { family: 'Chakra Petch', file: 'chakra-petch/ChakraPetch-Regular-400.woff2', weight: '400' },
  { family: 'Chakra Petch', file: 'chakra-petch/ChakraPetch-Medium-500.woff2', weight: '500' },
  { family: 'Chakra Petch', file: 'chakra-petch/ChakraPetch-Bold-700.woff2', weight: '700' },
  { family: 'Rajdhani', file: 'rajdhani/Rajdhani-SemiBold-600.woff2', weight: '600' },
  { family: 'Rajdhani', file: 'rajdhani/Rajdhani-Bold-700.woff2', weight: '700' },
  { family: 'Exo 2', file: 'exo2/Exo2-Variable-wght.woff2', weight: '100 900' },
];

let installed = false;

/**
 * Injects `@font-face` rules for the four local families, with `src` URLs
 * built from {@link fontUrl} — so the theme CSS files never have to know the
 * deploy-dependent base themselves. Idempotent: a second call from another
 * site's `main.ts` on the same page is a no-op.
 */
export function installFonts(): void {
  if (installed) return;
  installed = true;

  const rules = FONT_FACES.map(
    (face) =>
      `@font-face { font-family: '${face.family}'; src: url('${fontUrl(face.file)}') format('woff2'); ` +
      `font-weight: ${face.weight}; font-style: ${face.style ?? 'normal'}; font-display: block; }`,
  );

  const style = document.createElement('style');
  style.setAttribute('data-pyx-fonts', '');
  style.textContent = rules.join('\n');
  document.head.appendChild(style);
}
