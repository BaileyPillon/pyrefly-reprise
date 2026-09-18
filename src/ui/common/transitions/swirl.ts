/**
 * The battle-start swirl.
 *
 * FFX does not cut into a battle — the field spins away behind a wipe and the
 * encounter spins in behind the same motion. `src/ui/inkgold/wipe.ts` already
 * owns the flat diagonal ivory wipe the spec asks for on *menu* changes
 * ("Motion & camera": "every screen change is a diagonal ivory wipe at 19deg");
 * this is the one transition that is not a menu change, and it is the only
 * place in the game that spins.
 *
 * Shape: two counter-rotating conic layers, each covering the two quadrants the
 * other leaves open, expanding from the centre. When both reach full scale the
 * frame is covered — that is the instant {@link SwirlOptions.onCover} fires and
 * the caller swaps screens — and the same motion carried on unwinds them again.
 * A gold seam rides the leading edge (Ink & Gold's one accent).
 *
 * Pure DOM + CSS: the geometry and the keyframes live in `transitions.css`, and
 * the only thing this module does at runtime is set two custom properties and
 * time the halves. No `three`, no engine imports — so it is unit-testable and a
 * scene debug screen can play it without a battle.
 */

import './transitions.css';
import { prefersReducedMotion } from '../../inkgold/wipe.ts';

export interface SwirlOptions {
  /**
   * Total cover + clear duration in ms. The spec quotes no figure for this
   * transition (only the cut-in and the damage pop carry millisecond numbers),
   * so {@link DEFAULT_SWIRL_MS} is this module's own choice.
   */
  durationMs?: number;
  /**
   * Fired the instant the frame is fully covered — swap screens here.
   *
   * May return a promise, in which case the swirl stays closed until it
   * settles. That is what keeps the unwind from playing over a battle screen
   * whose diorama and art are still loading.
   */
  onCover?: () => void | Promise<void>;
  /** Ink colour of the blades. Defaults to the Ink & Gold ink token. */
  ink?: string;
  /** Accent of the seam that rides the leading edge. */
  gold?: string;
  /**
   * Skip the animation and fire `onCover` on the next tick. Playback at
   * `'skip'` passes this, as does anything else that must not spend real time.
   */
  instant?: boolean;
}

/** Not specified by the spec; split evenly between the cover and clear halves. */
export const DEFAULT_SWIRL_MS = 620;

const DEFAULT_INK = '#0b0a12';
const DEFAULT_GOLD = '#e3b94a';

interface ResolvedSwirl {
  durationMs: number;
  ink: string;
  gold: string;
  instant: boolean;
  onCover?: (() => void | Promise<void>) | undefined;
}

/** Fills in every optional field. Exported so its defaults are testable. */
export function resolveSwirlOptions(opts: SwirlOptions = {}): ResolvedSwirl {
  return {
    durationMs: opts.durationMs ?? DEFAULT_SWIRL_MS,
    ink: opts.ink ?? DEFAULT_INK,
    gold: opts.gold ?? DEFAULT_GOLD,
    // Reduced motion gets the instant path for the same reason the ivory wipe
    // does: the transition carries no information, only motion.
    instant: opts.instant ?? prefersReducedMotion(),
    onCover: opts.onCover,
  };
}

/**
 * Build the swirl's markup without mounting or animating it. Split out so the
 * structure can be asserted in a unit test (and so a mock screen can show a
 * frozen swirl for a capture).
 */
export function buildSwirl(doc: Document, opts: { ink?: string; gold?: string; durationMs?: number } = {}): HTMLElement {
  const root = doc.createElement('div');
  root.className = 'pf-swirl';
  root.style.setProperty('--pf-swirl-ink', opts.ink ?? DEFAULT_INK);
  root.style.setProperty('--pf-swirl-gold', opts.gold ?? DEFAULT_GOLD);
  root.style.setProperty('--pf-swirl-ms', `${opts.durationMs ?? DEFAULT_SWIRL_MS}ms`);

  for (const side of ['a', 'b'] as const) {
    const blade = doc.createElement('div');
    blade.className = `pf-swirl__blade pf-swirl__blade--${side}`;
    root.appendChild(blade);
  }
  const ring = doc.createElement('div');
  ring.className = 'pf-swirl__ring';
  root.appendChild(ring);
  return root;
}

/**
 * Play the swirl over `root` and resolve once it has fully unwound.
 *
 * `onCover` fires at the halfway point, with the frame completely covered, so
 * the caller can swap screens inside it without a visible seam — the same
 * contract `playWipe` offers.
 */
export function playBattleSwirl(root: HTMLElement, opts: SwirlOptions = {}): Promise<void> {
  const o = resolveSwirlOptions(opts);

  if (o.instant) {
    return new Promise<void>((resolve) => {
      window.setTimeout(() => {
        void Promise.resolve(o.onCover?.()).then(resolve, resolve);
      }, 0);
    });
  }

  const el = buildSwirl(root.ownerDocument, o);
  root.appendChild(el);
  const half = o.durationMs / 2;

  return new Promise<void>((resolve) => {
    const done = (): void => {
      el.remove();
      resolve();
    };
    const layers = (): HTMLElement[] => [
      ...el.querySelectorAll<HTMLElement>('.pf-swirl__blade, .pf-swirl__ring'),
    ];

    window.setTimeout(() => {
      // Freeze on the covering pose. Without this the CSS keyframes would keep
      // running while the new screen loads its diorama, and the swirl would
      // have unwound over a black frame before the battle appeared.
      for (const layer of layers()) layer.style.animationPlayState = 'paused';

      // `onCover` rejecting is the caller's problem, not the transition's —
      // the swirl still has to come back off the screen either way.
      void Promise.resolve(o.onCover?.())
        .catch(() => undefined)
        .then(() => {
          for (const layer of layers()) layer.style.animationPlayState = 'running';
          window.setTimeout(done, half);
        });
    }, half);
  });
}
