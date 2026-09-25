import './zanmato-gauge.css';
import type { BattleEvent, BattleState, CombatantId } from '../../battle/common/types.ts';
import {
  findZanmatoGaugeOwner,
  reachesFull,
  zanmatoBanner,
  zanmatoGaugeView,
  type ZanmatoGaugeView,
} from './zanmatoGaugeModel.ts';

/**
 * Yojimbo's Zanmato gauge on the FFX battle HUD — **FFX only, Chapter IX only.**
 *
 * Bailey's O-5 pick (2026-09-24): option A, the bar under his name with the
 * 25 / 50 / 80 bands, plus option C's one-shot "Zanmato" banner when the gauge
 * fills. Drawn from the picked mockups' own numbers:
 *
 * - **Landscape** (`a-mid.html`, `a-full.html`, `gauge.css`): the mockups are
 *   authored in the kit's 1440x810 space, which is this HUD's 640x360 grid at
 *   2.25x. The frame below is that 1440x810 space scaled by 1/2.25 inside the
 *   letterboxed stage, so every mockup pixel lands where the mockup put it at
 *   1280x720, 1600x900 and 2000x1012 alike.
 * - **Phone** (`a-{mid,full}-phone.html`, `phone.css`, 390x844): a portrait
 *   viewport letterboxes the grid into a band across the middle and leaves the
 *   top of the screen empty; the panel goes there, in CSS px, every label at
 *   least 12 px, and the banner under it.
 *
 * One deliberate difference from the mockups: **no HP line.** Yojimbo is
 * Sensor- and Scan-immune (`research/ffx-yojimbo.md` §2, "Scan and Sensor
 * show nothing"; `src/data/ffx/enemies/yojimbo.ts` `immunityFlags`), and the
 * HUD's own Sensor plate says "SENSOR FAILED" on the same screen, so printing
 * "HP 25,740 / 33,000" would hand the player what the fight hides. Reported
 * to Bailey as a question, not decided for him.
 *
 * Mounted by `FFXBattleHud` and inert in every battle whose state carries no
 * `enemyGaugeRules: 'yojimbo'` enemy (see `zanmatoGaugeModel.ts`).
 */

/** The mockups' authoring space and this HUD's grid, in the ratio both use. */
const MOCK_W = 1440;
const MOCK_H = 810;
const GRID_W = 640;
const GRID_H = 360;

/**
 * The phone layout needs this much empty band above the letterboxed grid:
 * the panel at `top: 30px` (`phone.css`) is about 170 px tall and the banner
 * under it about 90, and both must end above the grid, where the party rows
 * and the command stack are. 390x844 leaves 312.
 */
export const PHONE_BAND_MIN = 300;

/** How long the one-shot banner holds before it fades, ms. */
export const BANNER_HOLD_MS = 2600;
/** Its fade, ms; matches `zanmato-gauge.css`. */
const BANNER_FADE_MS = 260;
/** Clear space between the panel's bottom and the banner, in mockup px. */
const BANNER_GAP = 14;

export type ZanmatoGaugeMode = 'landscape' | 'phone';

/** Which layout a host of this size takes. Pure. */
export function zanmatoGaugeMode(width: number, height: number): ZanmatoGaugeMode {
  if (!width || !height) return 'landscape';
  const scale = Math.min(width / GRID_W, height / GRID_H);
  const band = (height - GRID_H * scale) / 2;
  return band >= PHONE_BAND_MIN ? 'phone' : 'landscape';
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

/** The landscape panel, `a-mid.html` / `a-full.html` minus the HP line. */
function landscapeHtml(v: ZanmatoGaugeView): string {
  const right = v.full
    ? `<span class="ffx-zg__chip" data-role="chip">${esc(v.chipText)}</span>`
    : `<span class="ffx-zg__pct" data-role="pct">${esc(v.pctText)}</span>`;
  const segs = v.segments
    .map(
      (s) =>
        `<i class="ffx-zg__seg" style="left:${s.from}%;width:${s.to - s.from}%"><b style="width:${pct(s.fill)}"></b><span>${esc(s.label)}</span></i>`,
    )
    .join('');
  return `<div class="ffx-zg__top"><span class="ffx-zg__name">${esc(v.name)}</span>${right}</div>
<div class="ffx-zg__bar">${segs}</div>
<div class="ffx-zg__now" data-role="next">${esc(v.nextText)}</div>`;
}

/** The phone panel, `a-mid-phone.html` / `a-full-phone.html` minus the HP line. */
function phoneHtml(v: ZanmatoGaugeView): string {
  const right = v.full
    ? `<span class="ffx-zg__chip" data-role="chip">${esc(v.chipText)}</span>`
    : `<span class="ffx-zg__pct" data-role="pct">${esc(v.pctText)}</span>`;
  const edges = v.segments.slice(1).map((s) => `<span style="left:${s.from}%">${s.from}</span>`).join('');
  const segs = v.segments
    .map((s) => `<i class="ffx-zg__seg" style="left:${s.from}%;width:${s.to - s.from}%"><b style="width:${pct(s.fill)}"></b></i>`)
    .join('');
  // `phone.css` nudges the second and third labels half a percent past each
  // edge (25.5 %, 51 %) so they clear the segment border.
  const labels = v.segments
    .filter((s) => s.label)
    .map((s, i) => `<span style="left:${s.from === 0 ? '0' : `${s.from + (i === 1 ? 0.5 : 1)}%`}">${esc(s.label)}</span>`)
    .join('');
  return `<div class="ffx-zg__top"><span class="ffx-zg__name">${esc(v.name)}</span>${right}</div>
<div class="ffx-zg__nums">${edges}</div>
<div class="ffx-zg__bar">${segs}</div>
<div class="ffx-zg__labels">${labels}</div>
<div class="ffx-zg__now" data-role="next">${esc(v.nextText)}</div>`;
}

export class ZanmatoGauge {
  /** The root; `hidden` in every battle without Yojimbo's gauge. */
  readonly el: HTMLElement;
  /** The bar-under-his-name panel. An obstacle for the advisor and the intent slab. */
  readonly panelEl: HTMLElement;
  /** The one-shot banner. An obstacle while it is up. */
  readonly bannerEl: HTMLElement;
  private readonly frame: HTMLElement;
  private stage: HTMLElement | null = null;
  private host: HTMLElement | null = null;
  private mode: ZanmatoGaugeMode = 'landscape';
  private ownerId: CombatantId | null = null;
  private name = '';
  private gauge: number | null = null;
  private painted = '';
  private holdTimer = 0;
  private fadeTimer = 0;
  private readonly onResize = (): void => this.place();

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ffx-zg';
    this.el.dataset['role'] = 'zanmato-gauge';
    this.el.hidden = true;
    this.frame = document.createElement('div');
    this.frame.className = 'ffx-zg__frame';
    this.panelEl = document.createElement('div');
    this.panelEl.className = 'ffx-zg__panel';
    this.bannerEl = document.createElement('div');
    this.bannerEl.className = 'ffx-zg__banner';
    this.bannerEl.hidden = true;
    this.frame.append(this.panelEl, this.bannerEl);
    this.el.append(this.frame);
  }

  /**
   * Give the widget its two parents: the letterboxed grid (`stage`) for the
   * landscape layout and the viewport-sized HUD root (`host`) for the phone one.
   */
  mount(stage: HTMLElement, host: HTMLElement): void {
    this.stage = stage;
    this.host = host;
    window.addEventListener('resize', this.onResize, { passive: true });
    this.place();
  }

  /** Take everything down: listeners, timers, the element. */
  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.clearBanner();
    this.el.remove();
    this.ownerId = null;
    this.gauge = null;
    this.painted = '';
  }

  /** The engine's state after a step. Finds the owner and paints its gauge. */
  sync(state: Readonly<BattleState>): void {
    const owner = state.result ? null : findZanmatoGaugeOwner(state);
    if (!owner) {
      this.ownerId = null;
      this.gauge = null;
      this.clearBanner();
      this.el.hidden = true;
      return;
    }
    this.ownerId = owner.id;
    this.name = owner.name;
    this.setGauge(owner.overdrive?.gauge ?? 0);
  }

  /** The `overdrive-gauge` event, so the bar moves on the beat that moved it. */
  onEvent(event: BattleEvent): void {
    if (event.type !== 'overdrive-gauge' || event.who !== this.ownerId) return;
    this.setGauge(event.to);
  }

  /** The current layout, for tests and the acceptance run. */
  get layoutMode(): ZanmatoGaugeMode {
    return this.mode;
  }

  /** Solid boxes other panels must avoid: the panel, and the banner while it is up. */
  obstacleEls(): HTMLElement[] {
    if (this.el.hidden) return [];
    return this.bannerEl.hidden ? [this.panelEl] : [this.panelEl, this.bannerEl];
  }

  private setGauge(raw: number): void {
    const prev = this.gauge;
    const view = zanmatoGaugeView(this.name, raw);
    this.gauge = view.gauge;
    this.el.hidden = false;
    this.paint(view);
    if (reachesFull(prev, view.gauge)) this.showBanner();
    else if (!view.full) this.clearBanner();
  }

  private paint(view: ZanmatoGaugeView): void {
    const html = this.mode === 'phone' ? phoneHtml(view) : landscapeHtml(view);
    const key = `${this.mode}|${html}`;
    if (key === this.painted) return;
    this.painted = key;
    this.panelEl.innerHTML = html;
    this.panelEl.classList.toggle('ffx-zg__panel--full', view.full);
    this.panelEl.dataset['gauge'] = String(view.gauge);
    this.panelEl.dataset['band'] = view.band;
    const banner = zanmatoBanner(view.name);
    this.bannerEl.innerHTML = `<span>${esc(banner.title)}</span><small>${esc(banner.line)}</small>`;
    this.placeBanner();
  }

  /** Re-parent and re-lay out for the host's current size. */
  private place(): void {
    if (!this.stage || !this.host) return;
    const r = this.host.getBoundingClientRect();
    // The upright-phone battle HUD (`ui/common/phoneBattle.ts`) has no letterbox
    // band at all, so its gauge is always the phone one, at 360x780 too.
    const phoneHud = document.documentElement.dataset['phoneBattle'] === 'ffx';
    const mode = phoneHud ? 'phone' : zanmatoGaugeMode(r.width || window.innerWidth, r.height || window.innerHeight);
    const parent = mode === 'phone' ? this.host : this.stage;
    if (this.el.parentElement !== parent) parent.append(this.el);
    this.mode = mode;
    this.el.classList.toggle('ffx-zg--phone', mode === 'phone');
    this.frame.style.transform = mode === 'phone' ? '' : `scale(${GRID_W / MOCK_W})`;
    this.frame.style.width = mode === 'phone' ? '' : `${MOCK_W}px`;
    this.frame.style.height = mode === 'phone' ? '' : `${MOCK_H}px`;
    if (this.gauge !== null) this.paint(zanmatoGaugeView(this.name, this.gauge));
  }

  /** Landscape only: the banner sits under the panel (in the phone column it simply follows it). */
  private placeBanner(): void {
    if (this.mode === 'phone') {
      this.bannerEl.style.top = '';
      return;
    }
    const bottom = this.panelEl.offsetTop + this.panelEl.offsetHeight;
    this.bannerEl.style.top = `${bottom > 0 ? bottom + BANNER_GAP : 190}px`;
  }

  private showBanner(): void {
    this.clearBanner();
    this.bannerEl.hidden = false;
    this.placeBanner();
    // Next frame, so the fade-in runs from opacity 0.
    requestAnimationFrame(() => this.bannerEl.classList.add('ffx-zg__banner--on'));
    this.holdTimer = window.setTimeout(() => {
      this.bannerEl.classList.remove('ffx-zg__banner--on');
      this.fadeTimer = window.setTimeout(() => {
        this.bannerEl.hidden = true;
      }, BANNER_FADE_MS);
    }, BANNER_HOLD_MS);
  }

  private clearBanner(): void {
    window.clearTimeout(this.holdTimer);
    window.clearTimeout(this.fadeTimer);
    this.bannerEl.classList.remove('ffx-zg__banner--on');
    this.bannerEl.hidden = true;
  }
}
