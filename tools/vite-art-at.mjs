/**
 * The dev and preview servers answer an art URL written `idle%402x.png` (release 39, the live check's finding LV-2).
 *
 * The game asks for a hi-res master with its `@` percent-encoded (`src/engine/ArtShipped.ts`), because Cloudflare answers the
 * raw `idle@2x.png` with a 307 to the encoded path and only that path with a 200. The files are named `idle@2x.png`. Cloudflare
 * and GitHub Pages decode the path before they look the file up. Vite's own static middleware (dev server and `vite preview`
 * both use sirv) decodes with `decodeURI`, which leaves `%40` alone, so without this the request finds no file, falls through to
 * the single-page fallback and is answered 200 with index.html: an image request that "succeeds" with a page, the trap of
 * critic check CHK-017. This plugin writes `@` back into the path of an `/art/` request before Vite's middleware sees it.
 * A production build is untouched (nothing here runs in `vite build`; the host decodes). Both games: shared plumbing.
 */

/** `url` with every `%40` in the path of an `art/` URL written back as `@`; the query, the hash and every other URL are returned as they are. */
export function atSignInArtPath(url) {
  const at = url.search(/[?#]/);
  const path = at < 0 ? url : url.slice(0, at);
  const rest = at < 0 ? '' : url.slice(at);
  return /(?:^|\/)art\//.test(path) ? `${path.replace(/%40/gi, '@')}${rest}` : url;
}

/** The Vite plugin: a middleware ahead of Vite's own, for the dev server and for `vite preview`. */
export function pyreflyArtAtSign() {
  const rewrite = (req, _res, next) => {
    if (typeof req.url === 'string') req.url = atSignInArtPath(req.url);
    next();
  };
  return {
    name: 'pyrefly-art-at-sign',
    apply: 'serve', // the dev server and `vite preview` (which also runs as the 'serve' command); never `vite build`
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}
