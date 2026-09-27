/**
 * A-3, no cold black before the first fight (both games: shared loading
 * plumbing).
 *
 * On a first visit the battle can take 14 to 20 s to load behind the entry
 * transition, and the frame sat on the transition's ink the whole time
 * (`pres-audit/videos/ffx/action-sequence.webm`). Now, when the cover has
 * waited {@link LOADING_CARD_DELAY_MS} for the battle, the approved
 * battle-start card (`BattleStartBanner`, `docs/screenshots/mockups/A-battle-start.jpg`)
 * goes up over the ink with a thin Ink & Gold hairline running along its gold
 * strip while the paintings load. When the battle is ready the card stays
 * until the battle screen's own card is up (or {@link HANDOVER_MAX_MS} has
 * passed), so the one card carries on rather than blinking out and back.
 * A warm load that is ready inside the delay shows nothing new.
 *
 * The time from the cover to the card, and the card's time on screen, are
 * logged (`console.info`) and marked (`performance.mark`).
 */

import { BattleStartBanner, type BattleStartBannerOptions } from '../BattleStartBanner.ts';

/** How long the cover may sit on the ink before the card goes up. */
export const LOADING_CARD_DELAY_MS = 400;
/** The longest the loading card waits for the battle screen's own card. */
export const HANDOVER_MAX_MS = 900;
/** The card's own leave fade (`.bstart--leaving`). */
const LEAVE_MS = 300;

/** What the entry transition calls while its cover waits (see `swirl.ts`, `SwirlOptions.whileCovered`). */
export type CoverWait = (settled: Promise<unknown>) => Promise<void>;

/**
 * A cover wait that raises the battle-start card after the delay. `card`
 * builds the card's options when it is needed (the preload may only then know
 * the boss); while it returns null the ink stays, and it is asked again.
 */
export function loadingCardWait(
  root: HTMLElement,
  card: () => Omit<BattleStartBannerOptions, 'root'> | null,
  delayMs = LOADING_CARD_DELAY_MS,
): CoverWait {
  return async (settled) => {
    const t0 = performance.now();
    let ready = false;
    void settled.then(
      () => (ready = true),
      () => (ready = true),
    );
    await Promise.race([settled.catch(() => undefined), sleep(delayMs)]);
    if (ready) return;
    // The preload may still be opening the fight: ask again until it can name
    // the boss, or the battle is ready without it.
    let opts = card();
    while (!opts && !ready) {
      await Promise.race([settled.catch(() => undefined), sleep(100)]);
      opts = ready ? null : card();
    }
    if (!opts) return;
    const banner = new BattleStartBanner({ ...opts, root });
    const el = banner.el;
    el.classList.add('bstart--loading');
    el.dataset['role'] = 'battle-start-loading';
    const hair = root.ownerDocument.createElement('div');
    hair.className = 'bstart__load';
    hair.setAttribute('aria-hidden', 'true');
    el.appendChild(hair);
    root.appendChild(el);
    const up = performance.now();
    mark('pyrefly:entry-card', up - t0);
    console.info(`[entry] battle-start card over the ink after ${Math.round(up - t0)} ms`);
    await settled.catch(() => undefined);
    await handover(root);
    // Fade while the transition unwinds underneath, onto the battle's own card.
    el.classList.add('bstart--leaving');
    setTimeout(() => el.remove(), LEAVE_MS);
    console.info(`[entry] loading card handed over after ${Math.round(performance.now() - up)} ms`);
  };
}

/** Wait, a frame at a time, for the battle screen's own card (or give up). */
async function handover(root: HTMLElement): Promise<void> {
  const until = performance.now() + HANDOVER_MAX_MS;
  while (performance.now() < until) {
    if (root.ownerDocument.querySelector('[data-role="battle-start"]')) return;
    await sleep(16);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mark(name: string, ms: number): void {
  try {
    performance.mark(name, { detail: { ms: Math.round(ms) } });
  } catch {
    /* a browser without the detail form keeps the log line */
  }
}
