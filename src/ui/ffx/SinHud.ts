import './sin-hud.css';
import type { AtbSnapshot, BattleEvent, BattleState, TurnPreview } from '../../battle/common/types.ts';
import type { HudPort } from '../../engine/HudPort.ts';
import { escapeHtml } from '../common/html.ts';
import {
  FIN_CHARGED_TEXT,
  FIN_CHARGED_TEXT_PHONE,
  FIN_FAR_TEXT,
  sinClockView,
  sinFinPlateView,
  type SinClockView,
  type SinFinPlateView,
} from './sinHudModel.ts';

/**
 * **The Sin HUD** (Chapters XVII and XVIII): the link 4 clock, M1-A "the mouth
 * ring" with its stage chip, the S-1 estimate line and the Gaze pill; and the
 * Fins' plate, M4-B "range and charge" (links I and II).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Installed on the FFX HUD only
 * (`BattleScreenWiring.createHud`), hidden in every battle whose state carries
 * neither Sin's clock (`sin.turn`) nor a Fin at a range (`sinHudModel.ts`).
 *
 * Built from package M's recommended frames (`docs/concepts/chapters/
 * sin-2026-09-27/hud/`, `m1a-t8`, `m1a-t12`, `m4b`, `m4b-far`; the driver's
 * picks under D-279, not Bailey's words):
 *
 * - **Landscape.** The frames are 1600x900, this HUD's 640x360 grid at 2.5x.
 *   The frame below is that space scaled by 0.4 inside the letterboxed stage,
 *   the way `OmnisReadout.ts` places Chapter XII's strip, so each piece lands
 *   where the frame put it, with one shift: the clock column starts at x 500,
 *   not the frame's 420, because the command-help slab's reserved slot reaches
 *   x 490 at y 302 to 385 in the running game. The ring at (500, 30), 190
 *   across; the chip and the estimate under it; the Gaze pill at (500, 352);
 *   the Fin plate at (820, 56), at least 470 wide. The move advisor's card
 *   dodges all three (`hudAvoidSelectors.ADVISOR_PANEL_SELECTORS`).
 * - **Phone** (phone HUD B). One ink slab across the field at 250 (the ring at
 *   84 px, the chip, "GIGA-GRAVITON IN n", the estimate) with the Gaze pill
 *   under it at 352, and the Fin plate at 100. The frame's 68 to 70 for those
 *   two is the phone HUD's enemy-move line in the running game.
 *
 * Neither piece fades while an action plays (`.ffxhud--acting` does not list
 * them): the clock and the charge are what a player must read during a turn.
 */

const MOCK_W = 1600;
const MOCK_H = 900;
const GRID_W = 640;

export type SinHudMode = 'landscape' | 'phone';

const SEGMENT_FILL = { pull: '#f4f1e8', window: '#e3b94a', last: '#e8412e' } as const;
const GAP_DEG = 3.2;

function polar(cx: number, r: number, deg: number): string {
  const a = (deg * Math.PI) / 180;
  return `${(cx + r * Math.cos(a)).toFixed(2)},${(cx + r * Math.sin(a)).toFixed(2)}`;
}

/**
 * The ring (M1-A): `view.total` segments, pulls ivory, the window gold, the
 * last red; lit at opacity 1, unlit 0.26, the unlit last 0.6; the segment for
 * the turn Sin just took outlined white; the last one pulsing from one turn
 * left. `caption` adds "TURNS LEFT" under the numeral (the desk ring).
 */
export function ringSvg(view: SinClockView, size: number, caption: boolean): string {
  const cx = size / 2;
  const outer = size / 2 - 4;
  const inner = outer - size * 0.15;
  const span = 360 / view.total;
  let segs = '';
  for (const s of view.segments) {
    const a0 = -90 + (s.index - 1) * span + GAP_DEG / 2;
    const a1 = a0 + span - GAP_DEG;
    const op = s.lit ? 1 : s.kind === 'last' ? 0.6 : 0.26;
    const cls = ['ffx-sinclock__seg', `ffx-sinclock__seg--${s.kind}`, s.lit ? 'is-lit' : '', s.now ? 'is-now' : '', s.kind === 'last' && view.alarm ? 'is-alarm' : '']
      .filter(Boolean)
      .join(' ');
    const stroke = s.now ? ' stroke="#fff" stroke-width="3"' : '';
    segs +=
      `<path class="${cls}" data-turn="${s.index}" d="M${polar(cx, outer, a0)} A${outer},${outer} 0 0 1 ${polar(cx, outer, a1)} ` +
      `L${polar(cx, inner, a1)} A${inner},${inner} 0 0 0 ${polar(cx, inner, a0)} Z" fill="${SEGMENT_FILL[s.kind]}" opacity="${op}"${stroke}/>`;
  }
  const numeralCls = view.left <= 1 ? ' ffx-sinclock__num--alarm' : '';
  const numY = cx + size * (caption ? 0.09 : 0.14);
  const cap = caption ? `<text class="ffx-sinclock__cap" x="${cx}" y="${cx + size * 0.2}" text-anchor="middle">TURNS LEFT</text>` : '';
  return (
    `<svg class="ffx-sinclock__ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">` +
    `<circle cx="${cx}" cy="${cx}" r="${inner - 4}" fill="rgba(11,10,18,.84)"/>${segs}` +
    `<text class="ffx-sinclock__num${numeralCls}" x="${cx}" y="${numY}" text-anchor="middle" style="font-size:${size * (caption ? 0.34 : 0.4)}px">${view.left}</text>${cap}</svg>`
  );
}

export function gazeHtml(view: SinClockView): string {
  const g = view.gaze;
  let pips = '';
  for (let i = 0; i < g.threshold; i++) pips += `<i class="${i < g.count ? 'is-on' : ''}"></i>`;
  return `<b>Gaze in ${g.left}</b>${pips}`;
}

/** The clock's inner HTML for one layout. */
export function clockHtml(view: SinClockView, phone: boolean): string {
  const est = view.estimate ? escapeHtml(phone ? view.estimate.phone : view.estimate.desk).replace('our estimate', '<b>our estimate</b>') : '';
  if (phone) {
    return (
      `${ringSvg(view, 84, false)}<div class="ffx-sinclock__side">` +
      `<span class="ffx-sinhud__chip"><span>${escapeHtml(view.stageWordShort)}</span></span>` +
      `<div class="ffx-sinclock__in">GIGA-GRAVITON IN ${view.left}</div>` +
      (est ? `<div class="ffx-sinclock__est">${est}</div>` : '') +
      `</div>`
    );
  }
  return (
    `<div class="ffx-sinclock__ringbox">${ringSvg(view, 190, true)}</div>` +
    `<div class="ffx-sinclock__under"><span class="ffx-sinhud__chip"><span>${escapeHtml(view.stageWord)}</span></span>` +
    (est ? `<div class="ffx-sinclock__est">${est}</div>` : '') +
    `</div>`
  );
}

/** The Fin plate's inner HTML (M4-B). */
export function finPlateHtml(view: SinFinPlateView): string {
  const line =
    view.line === 'charged'
      ? `<div class="ffx-sinfin__charge"><i></i><span class="ffx-sinfin__lg">${escapeHtml(FIN_CHARGED_TEXT)}</span><span class="ffx-sinfin__sm">${escapeHtml(FIN_CHARGED_TEXT_PHONE)}</span></div>`
      : view.line === 'far'
        ? `<div class="ffx-sinfin__calm">${escapeHtml(FIN_FAR_TEXT)}</div>`
        : '';
  return (
    `<div class="ffx-sinfin__top"><span class="ffx-sinfin__name">${escapeHtml(view.name)}</span>` +
    `<span class="ffx-sinfin__range ffx-sinfin__range--${view.range}">${view.range === 'far' ? 'FAR' : 'NEAR'}</span></div>${line}`
  );
}

export class SinHud {
  readonly el: HTMLElement;
  readonly clockEl: HTMLElement;
  readonly gazeEl: HTMLElement;
  readonly finEl: HTMLElement;
  private readonly frame: HTMLElement;
  private stage: HTMLElement | null = null;
  private host: HTMLElement | null = null;
  private mode: SinHudMode = 'landscape';
  private clock: SinClockView | null = null;
  private fin: SinFinPlateView | null = null;
  private painted = '';
  private readonly onResize = (): void => this.paint();

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ffx-sinhud';
    this.el.dataset['role'] = 'sin-hud';
    this.el.hidden = true;
    this.frame = document.createElement('div');
    this.frame.className = 'ffx-sinhud__frame';
    this.clockEl = document.createElement('div');
    this.clockEl.className = 'ffx-sinclock';
    this.clockEl.setAttribute('role', 'status');
    this.gazeEl = document.createElement('div');
    this.gazeEl.className = 'ffx-sinhud__gaze';
    this.finEl = document.createElement('div');
    this.finEl.className = 'ffx-sinfin';
    this.finEl.setAttribute('role', 'status');
    this.frame.append(this.clockEl, this.gazeEl, this.finEl);
    this.el.append(this.frame);
  }

  /** The letterboxed grid (`stage`) for landscape, the viewport-sized HUD root (`host`) for the phone. */
  mount(stage: HTMLElement, host: HTMLElement): void {
    this.stage = stage;
    this.host = host;
    window.addEventListener('resize', this.onResize, { passive: true });
    this.paint();
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.host?.removeAttribute('data-sin-hud');
    this.el.remove();
    this.clock = null;
    this.fin = null;
    this.painted = '';
  }

  /** `avoidIntent`'s last value and read time. */
  private under = 0;
  private underAt = 0;

  get layoutMode(): SinHudMode {
    return this.mode;
  }

  /** What the HUD shows now (tests, the debug snapshot). */
  view(): { clock: SinClockView | null; fin: SinFinPlateView | null } {
    return { clock: this.clock, fin: this.fin };
  }

  sync(state: Readonly<BattleState> | null): void {
    this.clock = sinClockView(state);
    this.fin = sinFinPlateView(state);
    this.paint();
  }

  /**
   * Mid-burst: follow the flags as they change, but never take a piece away while its burst plays (the killing
   * blow's result, a Fin torn away): that waits for the full {@link sync} after the burst, as it always did.
   */
  syncLive(state: Readonly<BattleState>): void {
    const clock = sinClockView(state);
    const fin = sinFinPlateView(state);
    if ((this.clock && !clock) || (this.fin && !fin)) return;
    this.clock = clock;
    this.fin = fin;
    this.paint();
  }

  private paint(): void {
    const live = this.clock !== null || this.fin !== null;
    this.el.hidden = !live;
    if (!live) {
      this.host?.removeAttribute('data-sin-hud');
      this.painted = '';
      return;
    }
    this.place();
    this.host?.setAttribute('data-sin-hud', '');
    const phone = this.mode === 'phone';
    const key = `${this.mode}|${JSON.stringify(this.clock)}|${JSON.stringify(this.fin)}`;
    if (key === this.painted) return;
    this.painted = key;
    this.clockEl.hidden = !this.clock;
    this.gazeEl.hidden = !this.clock;
    this.finEl.hidden = !this.fin;
    if (this.clock) {
      this.clockEl.innerHTML = clockHtml(this.clock, phone);
      this.clockEl.setAttribute('aria-label', `Giga-Graviton in ${this.clock.left} of Sin's turns. ${this.clock.stageWord}.`);
      this.gazeEl.innerHTML = gazeHtml(this.clock);
    } else {
      this.clockEl.innerHTML = '';
      this.gazeEl.innerHTML = '';
    }
    this.finEl.innerHTML = this.fin ? finPlateHtml(this.fin) : '';
  }

  /**
   * U5 (PR-0296, FFX phone only): the Fin plate and the Gaze pill sit under the enemy-move card wherever it ends. Their
   * CSS top (100 px, the frame's) assumed a one-line card; in Chapter XVII the card ran to y 116 and the plate (to y 166)
   * overlapped it by 5,920 px2 at 390x844. `--sin-under` is the card's bottom plus a gap, read four times a second.
   */
  avoidIntent(): void {
    const now = performance.now();
    if (this.mode !== 'phone' || !this.host || this.el.hidden || now - this.underAt < 250) return;
    this.underAt = now;
    const panel = this.host.querySelector<HTMLElement>('.eint__panel');
    const r = panel && !panel.hidden ? panel.getBoundingClientRect() : null;
    const under = r && r.height > 0 ? Math.ceil(r.bottom - this.host.getBoundingClientRect().top + 6) : 0;
    if (under === this.under) return;
    this.under = under;
    this.el.style.setProperty('--sin-under', `${under}px`);
  }

  /** Re-parent and scale for the current layout. */
  private place(): void {
    if (!this.stage || !this.host) return;
    const mode: SinHudMode = document.documentElement.dataset['phoneBattle'] === 'ffx' ? 'phone' : 'landscape';
    const parent = mode === 'phone' ? this.host : this.stage;
    if (this.el.parentElement !== parent) parent.append(this.el);
    if (mode !== this.mode) this.painted = '';
    this.mode = mode;
    this.el.classList.toggle('ffx-sinhud--phone', mode === 'phone');
    this.frame.style.transform = mode === 'phone' ? '' : `scale(${GRID_W / MOCK_W})`;
    this.frame.style.width = mode === 'phone' ? '' : `${MOCK_W}px`;
    this.frame.style.height = mode === 'phone' ? '' : `${MOCK_H}px`;
  }
}

/** The pieces of the FFX HUD the Sin HUD mounts into. */
interface FfxHudShape extends HudPort {
  readonly el: HTMLElement;
}

/**
 * Tap an FFX HUD for the Sin HUD, the way `withOmnisReadout` does: the
 * instance's own `mount`, `unmount`, `sync` and `onEvent` are wrapped and the
 * same object returned. Kept out of `FFXBattleHud.ts`, which is over the
 * 400-line house limit and must not grow. Inert in every battle without Sin's
 * flags (the element stays `hidden` and nothing else on the HUD is touched).
 */
export function withSinHud<T extends FfxHudShape>(hud: T): T {
  const sinHud = new SinHud();
  const mount = hud.mount.bind(hud);
  const unmount = hud.unmount.bind(hud);
  const sync = hud.sync.bind(hud);
  let live: BattleState | null = null;
  hud.mount = (root: HTMLElement): void => {
    mount(root);
    const stage = hud.el.querySelector<HTMLElement>('.ffxhud__stage') ?? hud.el;
    sinHud.mount(stage, hud.el);
  };
  hud.unmount = (): void => {
    live = null;
    sinHud.dispose();
    unmount();
  };
  // C4-5 / C4 note: the full `sync` comes after a burst has played, so the ring read "13 turns left" through all of
  // Sin's first turn while `sin.turnsLeft` already said 12, and a Fin's plate read "NEAR" through the turn its core
  // charged. The engine's state is one live object (the engines mutate `ctx.state`), so every event of the burst
  // re-reads the flags from the state the last sync handed over: the clock and the plate change on the turn the
  // flag does, as that turn starts to play. Cheap (the widget repaints only when its view changes).
  hud.sync = (state: BattleState, preview: TurnPreview[] | AtbSnapshot): void => {
    live = state;
    sinHud.sync(state);
    sync(state, preview);
  };
  const onEvent = hud.onEvent.bind(hud);
  hud.onEvent = (event: BattleEvent): Promise<void> | void => {
    if (live) sinHud.syncLive(live);
    return onEvent(event);
  };
  const update = hud.update?.bind(hud);
  hud.update = (dt: number): void => {
    sinHud.avoidIntent();
    update?.(dt);
  };
  (hud as T & { sinHud?: SinHud }).sinHud = sinHud;
  return hud;
}
