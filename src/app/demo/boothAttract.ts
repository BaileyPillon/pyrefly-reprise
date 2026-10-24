/**
 * THE ATTRACT CARD, RUNNING (conference demo, lane "booth"; Bailey, 2026-10-22, decision 188b: the attract card in the Echo painting look, "Pick up the controller"; both games, demo mode only; `boothCards.ts` draws it).
 *
 * The title's 60 s idle count (`demoTitle.ts`, release 61's FLOW lane) used to start the self-playing reel (`demoAttract.ts`, decision 169n). With the booth screens on (`boothSwitch.ts`) it puts this card over the title
 * instead: the Echo painting, "Pick up the controller", "Press any button". The title stays alive underneath (its music, its state), so there is nothing to load and nothing to come back to.
 *
 * What wakes it: any key, click, tap, wheel, a mouse that has really moved ({@link POINTER_ACTIVE_PX}), a pad button, a stick pushed past its rest ({@link padActive}). Same rule as the reel's wake and the idle clock's.
 *
 * What it never does: it never lets the press that wakes it also start the game from the title behind it. A key or press is swallowed in the capture phase (the game's `Input` never hears it), the click and release that
 * follow a swallowed press are swallowed for {@link SWALLOW_MS}, and the title ignores its own input while {@link AttractCard.holding} (a pad button raises no DOM event, so the title is told to stand still instead).
 * It writes nothing: no save, no run, no counter.
 */
import { padActive, POINTER_ACTIVE_PX } from './demoIdle.ts';
import { mountAttractCard } from './boothCards.ts';

/** After the card goes, how long the press that woke it (its click, its release, a held pad button) is still taken instead of reaching the title. */
export const SWALLOW_MS = 450;
/** How often the pads are looked at while the card is up (a pad button raises no DOM event). */
export const PAD_POLL_MS = 50;
/** The card's fade out, ms (the page removes it after this; REDUCE MOTION removes it at once). */
export const CARD_OUT_MS = 200;

type PadSource = () => ArrayLike<Gamepad | null> | null;

export class AttractCard {
  private el: HTMLElement | null = null;
  private stops: Array<() => void> = [];
  private over = false;
  private heldUntil = 0;
  private resolve!: () => void;
  /** Resolves when something wakes the card (or it is disposed). The card may still be fading out. */
  readonly done: Promise<void> = new Promise<void>((r) => (this.resolve = r));

  constructor(
    private readonly parent: HTMLElement,
    private readonly win: Window = window,
    private readonly pads: PadSource = () => navigator.getGamepads?.() ?? null,
    private readonly now: () => number = () => performance.now(),
  ) {}

  /** Is the card on the screen and waiting? */
  get up(): boolean {
    return this.el !== null && !this.over;
  }

  /** True while the card is up and for {@link SWALLOW_MS} after it goes: the title does nothing with its input in that time. */
  holding(): boolean {
    return this.up || this.now() < this.heldUntil;
  }

  show(): void {
    if (this.el || this.over) return;
    this.el = mountAttractCard(this.parent);
    const press = ['keydown', 'pointerdown', 'mousedown', 'touchstart', 'wheel', 'click'] as const;
    const onPress = (e: Event): void => {
      this.wake();
      e.stopImmediatePropagation();
    };
    let from: { x: number; y: number } | null = null;
    const onMove = (e: Event): void => {
      const p = e as PointerEvent;
      if (typeof p.clientX !== 'number') return;
      from ??= { x: p.clientX, y: p.clientY };
      if (Math.hypot(p.clientX - from.x, p.clientY - from.y) >= POINTER_ACTIVE_PX) this.wake();
    };
    for (const type of press) this.win.addEventListener(type, onPress, true);
    this.win.addEventListener('pointermove', onMove, true);
    const poll = this.win.setInterval(() => {
      if (padActive(this.pads())) this.wake();
    }, PAD_POLL_MS);
    this.stops.push(() => {
      for (const type of press) this.win.removeEventListener(type, onPress, true);
      this.win.removeEventListener('pointermove', onMove, true);
      this.win.clearInterval(poll);
    });
  }

  /**
   * Look at the pads now. The title calls this on every frame while the card is up, so a pad press (even a short tap) wakes the card on the frame it happens; the {@link PAD_POLL_MS} timer below is the backstop for a
   * page whose frames are not running (a hidden tab).
   */
  pollPads(): void {
    if (this.up && padActive(this.pads())) this.wake();
  }

  /** Something happened: take the card away, and take the rest of that press. */
  wake(): void {
    if (this.over) return;
    this.over = true;
    this.heldUntil = this.now() + SWALLOW_MS;
    this.release();
    // The click and the release that follow a swallowed press must not reach the title's tap plate either.
    const after = ['click', 'pointerup', 'mouseup', 'touchend'] as const;
    const eat = (e: Event): void => {
      e.stopImmediatePropagation();
      if (e.cancelable) e.preventDefault();
    };
    for (const type of after) this.win.addEventListener(type, eat, true);
    this.win.setTimeout(() => {
      for (const type of after) this.win.removeEventListener(type, eat, true);
    }, SWALLOW_MS);
    this.fadeOut();
    this.resolve();
  }

  /** The title is leaving or the page is going: take the card away at once, nothing swallowed. */
  dispose(): void {
    if (!this.over) {
      this.over = true;
      this.heldUntil = 0;
      this.release();
      this.resolve();
    }
    this.el?.remove();
    this.el = null;
  }

  private release(): void {
    for (const stop of this.stops.splice(0)) stop();
  }

  private fadeOut(): void {
    const el = this.el;
    if (!el) return;
    const reduced = typeof document !== 'undefined' && document.documentElement.hasAttribute('data-reduce-motion');
    if (reduced) {
      el.remove();
      this.el = null;
      return;
    }
    el.classList.add('booth-card--out'); // an animation holds the card's opacity, so the way out is one too (`boothCards.css`)
    this.win.setTimeout(() => {
      el.remove();
      if (this.el === el) this.el = null;
    }, CARD_OUT_MS);
  }
}
