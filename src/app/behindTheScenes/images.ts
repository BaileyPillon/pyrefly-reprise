/**
 * Where the BEHIND THE SCENES page's pictures live: `public/bts/`, served at `<base>bts/<file>`.
 *
 * They are plain files in `public/`, not imports, because an imported picture is emitted by the build whether or not the
 * code that names it survives, and the page's switch must keep every trace of the page out of a public build
 * (`changelog/behindTheScenes.ts`). While the switch is off, `tools/dist-filter.mjs` prunes `bts/` from every build and the
 * deploy refuses one that still carries it, so the pictures cost a public build nothing and cannot be fetched from it.
 * Each is a screenshot or a painting made for this project (none is a frame from the games), checked by eye for anything
 * that should not be public: no address bar, no name, no path, nothing from a hidden chapter.
 */

/** The folder under the site's base that holds them (`tools/dist-filter.mjs` names the same one). */
export const BTS_IMAGE_DIR = 'bts';

/** The address of one picture: the site's own base (`/` on echoesofspira.com), then `bts/`, then the file. */
export function btsImageUrl(file: string): string {
  const base = (typeof import.meta.env !== 'undefined' && import.meta.env.BASE_URL) || '/';
  return `${base.replace(/\/+$/, '')}/${BTS_IMAGE_DIR}/${file}`;
}
