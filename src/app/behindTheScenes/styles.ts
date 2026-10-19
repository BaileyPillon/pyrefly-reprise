/**
 * The BEHIND THE SCENES page's two stylesheets, as text, put into the document the first time the page opens. They are
 * imported `?inline` (a string, never a `<link>` the build would emit on its own), so a build with the page's switch off,
 * where nothing imports this module, carries no sheet for it either.
 */

import shell from './behind-the-scenes.css?inline';
import story from './behind-the-scenes-story.css?inline';

const STYLE_ID = 'bts-styles';

/** Install both sheets once. */
export function installBehindTheScenesStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `${shell}\n${story}`;
  document.head.appendChild(el);
}
