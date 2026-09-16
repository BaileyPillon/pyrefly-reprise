import '../../inkgold/index.ts';
import './overdrive-minigames.css';

export interface OverlayOpenOptions {
  /** The specific move's name, e.g. "Slice &amp; Dice". */
  title: string;
  /** The mechanic name, e.g. "SWORDPLAY". */
  mechanic: string;
  /** The input hint, e.g. "CONFIRM IN THE GOLD ZONE". */
  instruction: string;
  /** Total timer length in ms; omit for an untimed picker (Mix, Ronso Rage, Grand Summon). */
  timerMs?: number;
  /** Show the `+NN%` timing-bonus readout under the ring (Tidus/Auron/Wakka only). */
  showBonus?: boolean;
}

const RING_RADIUS = 21;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * The shared Overdrive overlay shell, restyled onto Ink & Gold's
 * `.ig-minigame` (`src/ui/inkgold/screens.css`, spec "Screens" > round-2 >
 * "Swordplay overlay", quoted verbatim in `docs/handoff/ink-and-gold/
 * Swordplay.dc.html`): a 720px-wide ivory slab holding the move name, the
 * mechanic/instruction subtitle, the depleting timer ring (doubling as the
 * §5.2 damage-timing bonus display) and each minigame's own body markup.
 */
export class OverdriveOverlay {
  readonly el: HTMLElement;
  readonly bodyEl: HTMLElement;
  private readonly titleEl: HTMLElement;
  private readonly subtitleEl: HTMLElement;
  private readonly ringEl: HTMLElement;
  private readonly ringArcEl: SVGCircleElement;
  private readonly ringTextEl: SVGTextElement;
  private readonly bonusEl: HTMLElement;

  private timerMs = 0;
  private startedAt = 0;
  private rafId = 0;
  private onExpire: (() => void) | null = null;
  private showBonus = false;

  constructor() {
    this.el = document.createElement('div');
    // `ffx-mg` is this file's own marker: every `.ig-*` rule we write must be
    // scoped by it, because `.ig-minigame` is a shared namespace the FFX-2
    // overlays render too [docs/CONTRACT-CHANGES.md decision 10].
    this.el.className = 'ig-minigame ffx-mg';
    this.el.innerHTML = `
      <div class="ig-minigame__head">
        <div class="ig-minigame__title" data-role="title"></div>
        <div class="ig-minigame__subtitle" data-role="subtitle"></div>
        <div class="ig-minigame__meter">
          <div class="ig-minigame__ring" data-role="ring" hidden>
            <svg width="52" height="52" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
              <circle cx="26" cy="26" r="${RING_RADIUS}" fill="none" stroke="#0B0A12" stroke-opacity="0.15" stroke-width="5"></circle>
              <circle data-role="arc" cx="26" cy="26" r="${RING_RADIUS}" fill="none" stroke="#E3B94A" stroke-width="5"
                stroke-dasharray="${RING_CIRCUMFERENCE.toFixed(2)}" stroke-dashoffset="0" stroke-linecap="butt"
                transform="rotate(-90 26 26)"></circle>
              <text data-role="ring-text" x="26" y="31" text-anchor="middle" font-family="Rajdhani, sans-serif" font-size="17" font-weight="700" fill="#0B0A12"></text>
            </svg>
          </div>
          <div class="ig-minigame__bonus" data-role="bonus" hidden></div>
        </div>
      </div>
      <div data-role="body"></div>
    `;
    this.titleEl = this.el.querySelector('[data-role="title"]')!;
    this.subtitleEl = this.el.querySelector('[data-role="subtitle"]')!;
    this.ringEl = this.el.querySelector('[data-role="ring"]')!;
    this.ringArcEl = this.el.querySelector('[data-role="arc"]')!;
    this.ringTextEl = this.el.querySelector('[data-role="ring-text"]')!;
    this.bonusEl = this.el.querySelector('[data-role="bonus"]')!;
    this.bodyEl = this.el.querySelector('[data-role="body"]')!;
  }

  open(opts: OverlayOpenOptions): void {
    this.titleEl.textContent = opts.title;
    this.subtitleEl.textContent = `${opts.mechanic.toUpperCase()} · ${opts.instruction.toUpperCase()}`;
    this.showBonus = opts.showBonus ?? false;
    this.ringEl.hidden = opts.timerMs === undefined;
    this.bonusEl.hidden = !this.showBonus;
    requestAnimationFrame(() => this.el.classList.add('ffx-mg--open'));
  }

  /** Starts the depleting ring; calls `onExpire` once when time runs out. */
  startTimer(totalMs: number, onExpire: () => void): void {
    this.timerMs = totalMs;
    this.startedAt = performance.now();
    this.onExpire = onExpire;
    const step = (): void => {
      const remaining = this.remainingMs();
      const frac = this.timerMs > 0 ? remaining / this.timerMs : 0;
      this.ringArcEl.setAttribute('stroke-dashoffset', (RING_CIRCUMFERENCE * (1 - frac)).toFixed(2));
      this.ringTextEl.textContent = remaining >= 10000 ? `${Math.ceil(remaining / 1000)}` : (remaining / 1000).toFixed(1);
      if (this.showBonus) this.bonusEl.textContent = `+${Math.round((frac / 2) * 100)}%`;
      if (remaining <= 0) {
        this.onExpire?.();
        this.onExpire = null;
        return;
      }
      this.rafId = requestAnimationFrame(step);
    };
    step();
  }

  remainingMs(now: number = performance.now()): number {
    return Math.max(0, this.timerMs - (now - this.startedAt));
  }

  elapsedMs(now: number = performance.now()): number {
    return now - this.startedAt;
  }

  stopTimer(): void {
    cancelAnimationFrame(this.rafId);
    this.onExpire = null;
  }

  async flashSuccess(): Promise<void> {
    this.stopTimer();
    this.el.classList.add('ffx-mg--success');
    await wait(240);
  }

  async flashFail(): Promise<void> {
    this.stopTimer();
    this.el.classList.add('ffx-mg--fail');
    await wait(240);
  }

  async close(): Promise<void> {
    this.el.classList.add('ffx-mg--close');
    await wait(160);
    this.el.remove();
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
