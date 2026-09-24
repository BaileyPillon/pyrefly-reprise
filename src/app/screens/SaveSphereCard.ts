/**
 * The Save Sphere between two links of Chapter XI (Fallen Aeons).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Bailey picked O-4 option C,
 * "a fade to white on a Save Sphere, with 'HP and MP restored'"
 * (`docs/target/decisions.json` D-120, answering
 * `docs/concepts/chapters/fallen-aeons/README.md` question 4; the picked frame
 * is `docs/concepts/chapters/fallen-aeons/o4-transitions/c-2.jpg`). It plays
 * only where the next formation carries `restoresPartyOnEntry` (FA2 = b, the
 * Sisters and Anima), so no other chapter ever meets it.
 *
 * What c-2 draws, and so what this builds:
 * - the whole frame, HUD included, washed to a pale lilac white;
 * - a glowing blue sphere above the party, centre frame;
 * - an ink card under it, a gold bar on its left edge, `SAVE SPHERE` in gold
 *   small capitals over `HP and MP restored` in paper white.
 *
 * The engine already restores (`src/battle/ffx2/setup.ts`
 * `restoreAtSaveSphere`); this is presentation only. The swap to the next
 * formation happens **under the wash**, so the next link and its refilled HUD
 * are what the fade reveals. The sphere is drawn in CSS: the concept sheet's
 * own sphere is "a drawn placeholder" (fallen-aeons README), and no sourced
 * Save Sphere art exists in the project. Statuses are not named on the card:
 * whether a Save Sphere clears them is unsourced (D-120's open question).
 *
 * Instant (no DOM at all) for a run nobody watches, the same rule the
 * battle-start card keeps. Reduced-motion safe: the card still shows (it is
 * information), the pulse does not.
 */

import './save-sphere-card.css';

export interface SaveSphereCardOptions {
  /** The battle screen's root; the card covers it and everything in it. */
  root: HTMLElement;
  /** Re-stage the next link. Called once, while the wash covers the field. */
  swap: () => Promise<void>;
  /** The screen's clock (the pause gate), so the pause menu holds the card too. */
  sleep?: (ms: number) => Promise<void>;
  /** `speed: 'skip'`: swap and return, draw nothing. */
  instant?: boolean;
}

/** The card's words, exactly as c-2 draws them. */
export const SAVE_SPHERE_LABEL = 'SAVE SPHERE';
export const SAVE_SPHERE_LINE = 'HP and MP restored';

/** Beat lengths, ms. The wash and the lift match the CSS transitions. */
export const SAVE_SPHERE_TIMING = { washIn: 520, hold: 1700, washOut: 620 } as const;

const defaultSleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Build the overlay, not yet shown. Exported for tests. */
export function buildSaveSphereCard(doc: Document = document): HTMLElement {
  const el = doc.createElement('div');
  el.className = 'ssphere';
  el.dataset['testid'] = 'save-sphere';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.innerHTML =
    '<div class="ssphere__wash"></div>' +
    '<div class="ssphere__orb" aria-hidden="true"><div class="ssphere__glint"></div></div>' +
    '<div class="ssphere__card">' +
    `<div class="ssphere__label">${SAVE_SPHERE_LABEL}</div>` +
    `<div class="ssphere__line">${SAVE_SPHERE_LINE}</div>` +
    '</div>';
  return el;
}

/**
 * Wash in, swap the link under the cover, hold the card, wash out.
 *
 * Always resolves, and always calls `swap` exactly once: a torn-down root only
 * cuts the show short, never the fight.
 */
export async function playSaveSphereCard(opts: SaveSphereCardOptions): Promise<void> {
  if (opts.instant) {
    await opts.swap();
    return;
  }
  const sleep = opts.sleep ?? defaultSleep;
  const el = buildSaveSphereCard(opts.root.ownerDocument);
  opts.root.appendChild(el);
  try {
    // One frame at opacity 0 first, so the transition has a start to run from.
    void el.offsetWidth;
    el.classList.add('ssphere--in');
    await sleep(SAVE_SPHERE_TIMING.washIn);
    await opts.swap();
    el.classList.add('ssphere--card');
    await sleep(SAVE_SPHERE_TIMING.hold);
    el.classList.remove('ssphere--in');
    el.classList.add('ssphere--out');
    await sleep(SAVE_SPHERE_TIMING.washOut);
  } finally {
    el.remove();
  }
}
