/**
 * THE FFX-2 ATB BARS THAT RUN (MF-07 / TB-03, motion-fluidity pass lane L3; game case: FFX-2 only: the ATB HUD; FFX has no clock under a menu; look change, so behind `?atbbars=`).
 *
 * Today: while a command menu is open the presenter's Active pump hands the HUD a fresh snapshot 20 times a second and the HUD rewrites BOTH columns with `innerHTML` each time. The element
 * is replaced, so no CSS transition can run on it (the pump's comment promises a ~100 ms one; there is none), and the bar ratchets about 4 px (2 percent of 183 px) every 62 ms, the same at
 * any display rate (9 drawn frames apart at 144 Hz); every CSS animation inside a rebuilt row (the ready shimmer) starts again with each rebuild.
 *
 * `?atbbars=smooth`:
 *  1. a column is rebuilt only when its STRUCTURE changed (an HP or MP figure, a status, who is acting, a bar's state or ready flag, a charge appearing: {@link structure}), never because a
 *     bar moved;
 *  2. each bar is `width:100%` scaled by `transform: scaleX(f)` on its existing element, and {@link AtbLive.tick} (called by `FFX2BattleHud.update(dt)`, every drawn frame) writes the fill
 *     it should show NOW: the last snapshot's fill plus the rate it was filling at (from the last two snapshots' engine clock), for at most {@link AGE_CAP_MS} (a held clock, Wait mode
 *     under a menu, sends no snapshots; the bar must not run on). A fill never steps back for a snapshot that landed a hair behind the extrapolation; a drop (an action spent it) snaps.
 *  3. the ready shimmer takes the page-clock phase `rowMarkStyle` gives the low-HP pulse, so a rebuild for another reason does not restart it.
 *
 * The game's own gauge is 29.97 logic steps a second (`battle/ffx2`): the engine does not change; only what is drawn between its steps does. Pure helpers plus one small class: no `three`.
 */

import type { AtbSnapshot, CombatantId } from '../../battle/common/types.ts';

type Bar = AtbSnapshot['bars'][number];

/** `?atbbars=smooth` puts the running bars on; anything else, and no word, is today's ratcheting bars. */
export function atbBarsSmooth(search: string | undefined = globalThis.location?.search): boolean {
  if (forced !== null) return forced;
  try {
    return new URLSearchParams(search ?? '').get('atbbars')?.trim().toLowerCase() === 'smooth';
  } catch {
    return false;
  }
}

let forced: boolean | null = null;
/** Tests and tools: force the switch (`null` reads the address again). */
export function setAtbBarsSmooth(on: boolean | null): void {
  forced = on;
}

/** The longest a fill is carried past the snapshot it came from, ms: one pump step (50 ms) and a frame or two of slack. */
export const AGE_CAP_MS = 80;
/** A snapshot that lands behind the extrapolation by no more than this is not drawn as a step back. */
export const HOLD_BACK = 0.03;
/** Snapshots further apart than this on the engine clock are not a rate (a pause, a burst of play). */
const MAX_PAIR_MS = 500;

const DYNAMIC = /transform:scaleX\([^)]*\);?|;?--pro-phase:-\d+ms|;?animation-delay:-\d+ms/g;

/** The markup of a column without what moves every frame or every rebuild: equal structure = the same DOM, so the column is left alone. */
export function structure(html: string): string {
  return html.replace(DYNAMIC, '');
}

/** The inline style of a fill that is a scaled full-width bar. */
export function scaleStyle(f01: number): string {
  return `width:100%;transform:scaleX(${f01.toFixed(4)});transform-origin:0 50%`;
}

/** The shimmer's phase from the page clock, ms into its 250 ms cycle, as the delay that makes a rebuilt track pick it up where the last one stopped. */
export function shimmerDelay(nowMs: number = typeof performance === 'undefined' ? 0 : performance.now()): string {
  return `;animation-delay:-${Math.round(((nowMs % 250) + 250) % 250)}ms`;
}

/** One value that fills at a rate: shown now = the snapshot's value plus rate x age, never more than the cap of age, never above 1. */
export class Running {
  private truth = 0;
  private engineAt: number | null = null;
  private rate = 0; // per ms of the engine clock
  private at = 0; // this clock, ms, when the value was fed
  private floor = 0;

  feed(value: number, engineMs: number, nowMs: number): void {
    const v = Math.min(1, Math.max(0, value));
    const prev = this.engineAt;
    if (prev !== null && engineMs === prev && v === this.truth) return; // the same snapshot again (a vitals redraw): keep the running estimate
    const dEng = prev === null ? 0 : engineMs - prev;
    if (prev !== null && dEng > 0 && dEng <= MAX_PAIR_MS && v >= this.truth) {
      const shown = this.shown(nowMs);
      this.rate = (v - this.truth) / dEng;
      this.floor = shown > v && shown - v <= HOLD_BACK ? shown : 0; // a snapshot a hair behind what is drawn is not drawn as a step back
    } else {
      this.rate = 0; // the first snapshot, a pause or a burst of play between two, a drop (the action spent the bar), or another value at the same engine moment: no rate to carry
      this.floor = 0;
    }
    this.truth = v;
    this.engineAt = engineMs;
    this.at = nowMs;
  }

  shown(nowMs: number): number {
    const age = Math.min(Math.max(0, nowMs - this.at), AGE_CAP_MS);
    return Math.min(1, Math.max(this.floor, this.truth + this.rate * age));
  }

  /** Forget everything (a new fight). */
  reset(): void {
    this.truth = this.rate = this.at = this.floor = 0;
    this.engineAt = null;
  }
}

interface Entry {
  fill: Running;
  charge: Running;
  fillEl: HTMLElement | null;
  chargeEl: HTMLElement | null;
  lastFill: number;
  lastCharge: number;
  hasCharge: boolean;
}

/** The party column's bars: the models fed by the snapshots, the elements they are drawn on, and the per-frame write. */
export class AtbLive {
  private readonly entries = new Map<CombatantId, Entry>();
  private nowMs = 0;
  private partySig = '';
  private enemySig = '';

  /** The HUD's frame clock, ms (the animation dt it is ticked with). */
  get clock(): number {
    return this.nowMs;
  }

  private entry(id: CombatantId): Entry {
    let e = this.entries.get(id);
    if (!e) this.entries.set(id, (e = { fill: new Running(), charge: new Running(), fillEl: null, chargeEl: null, lastFill: -1, lastCharge: -1, hasCharge: false }));
    return e;
  }

  /** A bar as the HUD is about to draw it (`bar` null = no bar). */
  feed(id: CombatantId, bar: Bar | null, engineMs: number): void {
    const e = this.entry(id);
    e.fill.feed(bar ? (bar.ready ? 1 : bar.fill) : 0, engineMs, this.nowMs);
    e.hasCharge = bar?.charge != null;
    e.charge.feed(bar?.charge ?? 0, engineMs, this.nowMs);
  }

  /** The fill (0 to 1) the bar should be drawn at right now; the markup uses it for a row it builds. */
  fillNow(id: CombatantId, fallback: number): number {
    const e = this.entries.get(id);
    return e ? e.fill.shown(this.nowMs) : fallback;
  }

  /** True when the column's structure is what it was (leave the DOM alone); otherwise remembers it and says false (rebuild, then {@link bind}). */
  keep(which: 'party' | 'enemy', html: string): boolean {
    const sig = structure(html);
    const same = which === 'party' ? sig === this.partySig : sig === this.enemySig;
    if (!same) {
      if (which === 'party') this.partySig = sig;
      else this.enemySig = sig;
    }
    return same;
  }

  /** The party column was rebuilt: find each row's fill and charge elements again. */
  bind(partyEl: HTMLElement): void {
    for (const e of this.entries.values()) {
      e.fillEl = null;
      e.chargeEl = null;
      e.lastFill = e.lastCharge = -1;
    }
    for (const row of partyEl.querySelectorAll<HTMLElement>('.ig-stat[data-actor-id]')) {
      const e = this.entries.get(row.dataset['actorId'] ?? '');
      if (!e) continue;
      e.fillEl = row.querySelector<HTMLElement>('.ffx2atb__fill');
      e.chargeEl = row.querySelector<HTMLElement>('.ffx2atb__charge');
    }
    this.write();
  }

  /** One drawn frame: `dt` seconds of the animation clock. */
  tick(dt: number): void {
    if (!(dt > 0)) return;
    this.nowMs += dt * 1000;
    this.write();
  }

  private write(): void {
    for (const e of this.entries.values()) {
      if (e.fillEl) {
        const f = e.fill.shown(this.nowMs);
        if (Math.abs(f - e.lastFill) >= 1e-4) {
          e.lastFill = f;
          e.fillEl.style.transform = `scaleX(${f.toFixed(4)})`;
        }
      }
      if (e.chargeEl && e.hasCharge) {
        const c = e.charge.shown(this.nowMs);
        if (Math.abs(c - e.lastCharge) >= 1e-4) {
          e.lastCharge = c;
          e.chargeEl.style.transform = `scaleX(${c.toFixed(4)})`;
        }
      }
    }
  }
}
