import './omnis-readout.css';
import type { AtbSnapshot, BattleEvent, BattleState, TurnPreview } from '../../battle/common/types.ts';
import { MORTIPHASM_IDS, omnisAffinities, omnisDiscs, type Element4, type OmnisState } from '../../battle/ffx/ai/seymour-omnis-rules.ts';
import type { HudPort } from '../../engine/HudPort.ts';
import { escapeHtml } from '../common/html.ts';
import {
  COLOUR_ORDER_NOTE,
  ELEMENT_NAME,
  OMNIS_COMBATANT,
  hasOmnisDiscs,
  intentText,
  livingPartyOf,
  omnisReadoutView,
  omnisStateOf,
  weaknessOf,
  type OmnisReadoutView,
} from './omnisReadoutModel.ts';

/**
 * **Chapter XII — the disc strip (O-2 B) and the intent line (O-4 C) on the FFX HUD.**
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Installed on the FFX HUD only
 * (`BattleScreenWiring.createHud`), hidden in every battle whose state carries
 * no Omnis disc state (`omnis.discs`, set only by the Omnis formation).
 *
 * Drawn from the picked frames' own stylesheet (`docs/concepts/chapters/omnis/
 * scripts/gen_mock.py`, `.ds` / `.intent` and the phone `.pds` / `.pintent`):
 *
 * - **Landscape.** The frames are 1600x900, this HUD's 640x360 grid at 2.5x;
 *   the frame below is that space scaled by 0.4 inside the letterboxed stage,
 *   so every frame pixel lands where the frame put it at 1280x720, 1600x900
 *   and 2000x1012 alike. One change: the intent box is anchored by its
 *   **bottom** (the frame's 548 + its two-line height), so a three-line
 *   sentence grows up toward the empty band under the queue instead of down
 *   into the party rows.
 * - **Phone** (phone HUD B, `ui/common/phoneBattle.ts`). The frames' phone
 *   layout predates phone HUD B, so the two boxes keep their order and their
 *   place in the column: the strip at the top, in the enemy-move slot under the
 *   rail (the generic enemy-move line stands down while it is up, as in the
 *   frame, where only this line is shown), and the intent line at the foot of
 *   the field, above the party chips. Every label meets the phone HUD's 14 px
 *   floor (the frame's phone type was 12 px).
 *
 * One addition the brief asks for: **{@link COLOUR_ORDER_NOTE}** under the
 * strip, because the colours it reports after a turn or a reset come from the
 * ring and the cycle Bailey has not confirmed (B8).
 *
 * The strip moves on the beat that moved the disc (the `affinity-change` event
 * as the presenter plays it, like the painted discs, `engine/OmnisDiscTap.ts`);
 * `sync` reconciles to the engine's state after every step.
 */

/** The frames' authoring space and this HUD's grid. */
const MOCK_W = 1600;
const MOCK_H = 900;
const GRID_W = 640;

/** Clear space between the intent line and the party chips on the phone, CSS px. */
const PHONE_INTENT_GAP = 8;

/** Clear space the Sensor plate keeps above the intent line, grid px. */
export const SENSOR_GAP = 4;

/**
 * How far to lift the Sensor plate (grid px, negative is up) so it clears the
 * intent line; `0` when it already does or the two do not share a column.
 * Pure: every box in one space (viewport px), `scale` the letterbox factor.
 */
export function sensorLift(sensor: DOMRectReadOnly | null, intent: DOMRectReadOnly | null, scale: number, gap = SENSOR_GAP): number {
  if (!sensor || !intent || scale <= 0 || sensor.height <= 0 || intent.height <= 0) return 0;
  if (sensor.right <= intent.left || sensor.left >= intent.right) return 0;
  const over = sensor.bottom - (intent.top - gap * scale);
  return over > 0 ? -Math.ceil(over / scale) : 0;
}

/** The frames' chip colours and ink (`gen_mock.py` `COL` / `INKTXT`). */
export const DISC_COLOUR: Readonly<Record<Element4, { bg: string; ink: string }>> = {
  fire: { bg: '#f07622', ink: '#0b0a12' },
  water: { bg: '#2f7fe8', ink: '#fff' },
  ice: { bg: '#a06aeb', ink: '#fff' },
  lightning: { bg: '#f5d432', ink: '#0b0a12' },
};

/** The frames' element marks (`gen_mock.py` `ICON`). */
const ICON: Readonly<Record<Element4, string>> = {
  fire: '<svg viewBox="-1 -1 2 2" aria-hidden="true"><polygon points="-0.55,0.85 -0.62,0.1 -0.38,-0.45 -0.22,0 0,-1 0.22,0 0.4,-0.5 0.62,0.1 0.55,0.85"/></svg>',
  water: '<svg viewBox="-1 -1 2 2" aria-hidden="true"><path d="M0,-1 C0.3,-0.4 0.65,0 0.65,0.3 A0.65,0.65 0 1 1 -0.65,0.3 C-0.65,0 -0.3,-0.4 0,-1Z"/></svg>',
  ice: '<svg viewBox="-1 -1 2 2" aria-hidden="true"><g stroke-width="0.26" stroke-linecap="round"><line x1="-0.9" y1="0" x2="0.9" y2="0"/><line x1="-0.45" y1="-0.78" x2="0.45" y2="0.78"/><line x1="-0.45" y1="0.78" x2="0.45" y2="-0.78"/></g></svg>',
  lightning: '<svg viewBox="-1 -1 2 2" aria-hidden="true"><polygon points="0.25,-1 -0.5,0.1 -0.02,0.1 -0.25,1 0.5,-0.15 0.02,-0.15"/></svg>',
};

export type OmnisReadoutMode = 'landscape' | 'phone';

function tag(e: Element4, text: string, cls: string): string {
  const c = DISC_COLOUR[e];
  return `<${cls === 'em' ? 'em' : 'span'} class="${cls === 'em' ? 'ffx-omr__el' : cls}" data-element="${e}" style="background:${c.bg};color:${c.ink}">${cls === 'em' ? '' : ICON[e]}${escapeHtml(text)}</${cls === 'em' ? 'em' : 'span'}>`;
}

/** The strip's inner HTML (the frame's `.ds`). */
export function stripHtml(v: OmnisReadoutView, phone: boolean): string {
  const [ul, ur, ll, lr] = v.chips.map((c) => tag(c.element, c.name, `ffx-omr__chip${c.turned ? ' ffx-omr__chip--turned' : ''}`));
  const grid = `<div class="ffx-omr__grid">${ul ?? ''}<span class="ffx-omr__mid"></span>${ur ?? ''}${ll ?? ''}${lr ?? ''}</div>`;
  const rows = v.affinity
    .map((r) => `<span class="ffx-omr__row"><i>${escapeHtml(r.label)}</i>${r.elements.map((e) => tag(e, ELEMENT_NAME[e], 'em')).join('')}</span>`)
    .join('');
  const head = phone ? '<h4>Discs facing him</h4>' : '<h4>Discs<br>facing him</h4>';
  return `${head}${grid}<div class="ffx-omr__aff">${rows}</div><small class="ffx-omr__note">${escapeHtml(COLOUR_ORDER_NOTE)}</small>`;
}

/** The intent box's inner HTML (the frame's `.intent`). */
export function intentHtml(v: OmnisReadoutView): string {
  const p = v.intent.map((r) => (r.bold ? `<b>${escapeHtml(r.text)}</b>` : escapeHtml(r.text))).join('');
  return `<h4>Enemy intent</h4><p>${p}</p>`;
}

export class OmnisReadout {
  readonly el: HTMLElement;
  readonly stripEl: HTMLElement;
  readonly intentEl: HTMLElement;
  private readonly frame: HTMLElement;
  private stage: HTMLElement | null = null;
  private host: HTMLElement | null = null;
  private mode: OmnisReadoutMode = 'landscape';
  private discs: Element4[] = [];
  private state: OmnisState = 'normal';
  private living = 3;
  private turned: number[] = [];
  private weakBefore: Element4 | null = null;
  private live = false;
  private painted = '';
  private sensorFrame = 0;
  /** The Sensor plate opens and folds without a battle event (a target cursor resting on a fiend). */
  private sensorWatch: ResizeObserver | null = null;
  private readonly onResize = (): void => {
    this.place();
    this.queueSensor();
  };

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ffx-omr';
    this.el.dataset['role'] = 'omnis-readout';
    this.el.hidden = true;
    this.frame = document.createElement('div');
    this.frame.className = 'ffx-omr__frame';
    this.stripEl = document.createElement('div');
    this.stripEl.className = 'ffx-omr__strip';
    this.stripEl.dataset['phoneUnderRail'] = '';
    this.intentEl = document.createElement('div');
    this.intentEl.className = 'ffx-omr__intent';
    this.intentEl.setAttribute('role', 'status');
    this.frame.append(this.stripEl, this.intentEl);
    this.el.append(this.frame);
  }

  /** The letterboxed grid (`stage`) for landscape, the viewport-sized HUD root (`host`) for the phone. */
  mount(stage: HTMLElement, host: HTMLElement): void {
    this.stage = stage;
    this.host = host;
    window.addEventListener('resize', this.onResize, { passive: true });
    this.place();
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    cancelAnimationFrame(this.sensorFrame);
    this.sensorWatch?.disconnect();
    this.sensorWatch = null;
    this.sensorEl()?.style.removeProperty('--ffx-sensor-dy');
    this.host?.removeAttribute('data-omnis-readout');
    this.el.remove();
    this.live = false;
    this.painted = '';
  }

  get layoutMode(): OmnisReadoutMode {
    return this.mode;
  }

  /** What the two boxes say now (tests, the debug snapshot). */
  view(): OmnisReadoutView | null {
    return this.live ? omnisReadoutView(this.input()) : null;
  }

  sync(state: Readonly<BattleState>): void {
    if (state.result || !hasOmnisDiscs(state)) {
      this.live = false;
      this.el.hidden = true;
      this.host?.removeAttribute('data-omnis-readout');
      this.queueSensor();
      return;
    }
    const discs = omnisDiscs(state);
    if (!this.live) this.weakBefore = weaknessOf(omnisAffinities(discs));
    this.live = true;
    this.discs = discs;
    this.state = omnisStateOf(state);
    this.living = livingPartyOf(state);
    this.paint();
  }

  onEvent(event: BattleEvent): void {
    if (!this.live) return;
    if (event.type === 'affinity-change' && event.facings) {
      this.discs = MORTIPHASM_IDS.map((id, i) => (event.facings?.[id] as Element4 | undefined) ?? this.discs[i] ?? 'fire');
      const index = event.partId ? MORTIPHASM_IDS.indexOf(event.partId) : -1;
      if (event.cause === 'reset') this.clearTurned();
      else if (index >= 0) this.turned = [...this.turned.filter((i) => i !== index), index];
    } else if (event.type === 'action-start' && event.actorId === OMNIS_COMBATANT) {
      this.clearTurned();
    } else if (event.type === 'message' && event.kind === 'telegraph' && /glows red/i.test(event.text)) {
      this.state = 'red'; // the moment the counter fills, before the step's sync
    } else {
      this.queueSensor(); // a Sensor read opens the plate on this event, after this tap has run
      return;
    }
    this.paint();
  }

  private clearTurned(): void {
    this.turned = [];
    this.weakBefore = weaknessOf(omnisAffinities(this.discs));
  }

  private input(): Parameters<typeof omnisReadoutView>[0] {
    return { discs: this.discs, state: this.state, living: this.living, turned: this.turned, weakBefore: this.weakBefore };
  }

  private paint(): void {
    this.place();
    const view = omnisReadoutView(this.input());
    const phone = this.mode === 'phone';
    const key = `${this.mode}|${JSON.stringify(view)}`;
    this.el.hidden = false;
    this.host?.setAttribute('data-omnis-readout', '');
    if (key !== this.painted) {
      this.painted = key;
      this.stripEl.innerHTML = stripHtml(view, phone);
      this.intentEl.innerHTML = intentHtml(view);
      this.intentEl.setAttribute('aria-label', intentText(view.intent));
      this.el.classList.toggle('ffx-omr--glow', view.glow);
    }
    this.placeIntent();
    this.queueSensor();
  }

  private sensorEl(): HTMLElement | null {
    return this.stage?.querySelector<HTMLElement>('.ffx-sensor') ?? null;
  }

  /** Next frame, once the HUD has drawn this step: lift the Sensor plate clear of the intent line. */
  private queueSensor(): void {
    if (!this.stage) return;
    const sensor = this.sensorEl();
    if (this.live && sensor && !this.sensorWatch && typeof ResizeObserver !== 'undefined') {
      this.sensorWatch = new ResizeObserver(() => this.queueSensor());
      this.sensorWatch.observe(sensor);
    }
    if (this.sensorFrame) return;
    this.sensorFrame = requestAnimationFrame(() => {
      this.sensorFrame = 0;
      this.clearSensor();
    });
  }

  /** Landscape only (the phone parks the plate by the tip line). */
  clearSensor(): void {
    const sensor = this.sensorEl();
    if (!sensor) return;
    sensor.style.removeProperty('--ffx-sensor-dy');
    if (!this.live || this.mode !== 'landscape' || sensor.hidden) return;
    const scale = (this.stage?.getBoundingClientRect().width ?? 0) / GRID_W;
    const dy = sensorLift(sensor.getBoundingClientRect(), this.intentEl.getBoundingClientRect(), scale);
    if (dy) sensor.style.setProperty('--ffx-sensor-dy', `${dy}px`);
  }

  /** Re-parent for the current layout. */
  private place(): void {
    if (!this.stage || !this.host) return;
    const mode: OmnisReadoutMode = document.documentElement.dataset['phoneBattle'] === 'ffx' ? 'phone' : 'landscape';
    const parent = mode === 'phone' ? this.host : this.stage;
    if (this.el.parentElement !== parent) parent.append(this.el);
    if (mode !== this.mode) this.painted = '';
    this.mode = mode;
    this.el.classList.toggle('ffx-omr--phone', mode === 'phone');
    this.frame.style.transform = mode === 'phone' ? '' : `scale(${GRID_W / MOCK_W})`;
    this.frame.style.width = mode === 'phone' ? '' : `${MOCK_W}px`;
    this.frame.style.height = mode === 'phone' ? '' : `${MOCK_H}px`;
    this.placeIntent();
  }

  /** Phone only: the intent line's foot sits {@link PHONE_INTENT_GAP} above the party chips. */
  private placeIntent(): void {
    if (this.mode !== 'phone' || !this.host) {
      this.intentEl.style.bottom = '';
      return;
    }
    const chips = this.host.querySelector<HTMLElement>('.ig-stat-list');
    const host = this.host.getBoundingClientRect();
    const top = chips?.getBoundingClientRect().top ?? 0;
    this.intentEl.style.bottom = top > 0 ? `${Math.round(host.bottom - top + PHONE_INTENT_GAP)}px` : '';
  }
}

/** The pieces of the FFX HUD the read-out mounts into. */
interface FfxHudShape extends HudPort {
  readonly el: HTMLElement;
}

/**
 * Tap an FFX HUD for the read-out, the way `engine/OmnisDiscTap.ts` taps it for
 * the painted discs: the instance's own `mount`, `unmount`, `sync` and
 * `onEvent` are wrapped and the same object returned. Kept out of
 * `FFXBattleHud.ts`, which is over the 400-line house limit and must not grow.
 */
export function withOmnisReadout<T extends FfxHudShape>(hud: T): T {
  const readout = new OmnisReadout();
  const mount = hud.mount.bind(hud);
  const unmount = hud.unmount.bind(hud);
  const sync = hud.sync.bind(hud);
  const onEvent = hud.onEvent.bind(hud);
  hud.mount = (root: HTMLElement): void => {
    mount(root);
    const stage = hud.el.querySelector<HTMLElement>('.ffxhud__stage') ?? hud.el;
    readout.mount(stage, hud.el);
  };
  hud.unmount = (): void => {
    readout.dispose();
    unmount();
  };
  hud.sync = (state: BattleState, preview: TurnPreview[] | AtbSnapshot): void => {
    readout.sync(state);
    sync(state, preview);
  };
  hud.onEvent = (event: BattleEvent): Promise<void> | void => {
    readout.onEvent(event);
    return onEvent(event);
  };
  (hud as T & { omnisReadout?: OmnisReadout }).omnisReadout = readout;
  return hud;
}
