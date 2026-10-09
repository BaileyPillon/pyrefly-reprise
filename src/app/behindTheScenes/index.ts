/**
 * BEHIND THE SCENES: how Echoes of Spira was made, as a page of the title screen (Bailey, 2026-10-08).
 *
 * "Also include a behind the screens button of how the game was made but I need to approve of it before it is public
 * facing and is actually included in the game." So this folder is BUILT and its switch is OFF: `changelog/behindTheScenes.ts`
 * (`BTS_LIVE = false`). The title reaches it from exactly one place, one dynamic import in `screens/frontend/titleInfo.ts`
 * behind that switch, so with the switch off nothing here is in the build; and its pictures, in `public/bts/`, are
 * pruned from every build while it is off (`tools/dist-filter.mjs`).
 *
 * The format is Bailey's pick: option A, a story in six chapters, opening with option C's five cards as the two-minute
 * summary (`content.ts`). The critic's real scores, the AI tools by name and the community sources are on it (`facts.ts`);
 * where it says something was measured it says `MEASURED_WORDING`; none of Bailey's own words are quoted. Its name is
 * settled (`BTS_TITLE`: "Scenes not screens", Bailey, 2026-10-09). What he has not decided is which of his own quotes, if
 * any, may appear.
 *
 * Game case: both.
 */

import { installBehindTheScenesStyles } from './styles.ts';
import { mountBehindTheScenes as mount, type BehindTheScenesHooks, type BehindTheScenesPage } from './page.ts';

export { behindTheScenesHtml } from './html.ts';
export type { BehindTheScenesHooks, BehindTheScenesPage } from './page.ts';

/** Bring the page to life inside the overlay that holds its markup: install its sheets, then bind its tabs, cards and scroll. */
export function mountBehindTheScenes(overlay: HTMLElement, hooks: BehindTheScenesHooks): BehindTheScenesPage {
  installBehindTheScenesStyles();
  overlay.querySelector('.bts')?.classList.toggle('bts--still', hooks.reduceMotion());
  return mount(overlay, hooks);
}
