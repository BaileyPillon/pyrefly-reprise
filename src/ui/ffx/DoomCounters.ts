import './doom-counter.css';
import type { BattleEvent, BattleState, CombatantId } from '../../battle/common/types.ts';
import type { NumeralRect } from '../common/damageLadder.ts';
import type { Projector } from './DamageNumbers.ts';

/**
 * Doom's countdown, drawn over the doomed figure's head.
 *
 * `research/ffx-combat-core.md` §4 (the status table), row **Doom**:
 * "Countdown shown over the head; decrements on the victim's turn (even
 * asleep/skipped). At 0 → instant KO." The engine already runs that clock
 * (`battle/ffx/ticks.ts`: a `status-tick` with `remaining` on each of the
 * victim's own turns, then `status-remove` + `ko` at 0), and until now the HUD
 * showed nothing but a red dot on the CTB tile: Chapter IX's end-to-end found
 * Yojimbo doomed with no way to see how many of his turns were left
 * (`docs/concepts/chapters/yojimbo/e2e/1280-04-no-doom-countdown.jpg`).
 *
 * One number per doomed combatant, white on a dark outline like the damage
 * numerals it lives beside, a little above the projected head point. It is
 * placed by the same projector as the numerals, re-projected every frame, and
 * pushed below any opaque HUD panel it would otherwise print across (the
 * enemy-move slab hangs over the boss). Hidden while the projector cannot
 * answer (the figure is off the frame), and for the whole field once the
 * battle has a result, because the results screen fades up over this layer.
 *
 * Driven by events for timing (the count changes at the tick, not at the end
 * of the burst) and reconciled against state on every full `sync`, so a
 * Retry, a revive or a missed event can never leave a stale number up.
 *
 * FFX only: the FFX HUD's numerals layer owns it (`DamageNumbers.ts`). FFX-2's
 * Doom presentation is not this one and is not touched.
 */

/** How far above the head point the number's baseline sits, in grid px. */
const HEAD_GAP = 5;
/** Font size on the 640x360 grid; the damage numeral's plain size is 16. */
const GRID_FONT = 15;
/** Clear space kept under a panel the number is pushed below, in grid px. */
const PANEL_GAP = 3;
/**
 * The smallest the number is drawn, in CSS px. At 390x844 the grid's scale is
 * about 0.6 and 15 grid px came out 9 px tall, unreadable; the project's type
 * floor is 14 px and a count is read at a glance, so it never goes under 16.
 */
const MIN_CSS_PX = 16;

interface Counter {
  el: HTMLElement;
  n: number;
}

export interface DoomCounterOptions {
  project: () => Projector | null;
  /** The letterbox scale of the 640x360 grid. */
  scale: () => number;
  /** Opaque HUD panels, in viewport px. */
  avoid: () => NumeralRect[];
}

/** The count a combatant's Doom shows, or `null` when it is not doomed. Pure. */
export function doomCountOf(c: { statuses?: Partial<Record<string, { turnsRemaining?: number | null } | undefined>> } | undefined): number | null {
  const n = c?.statuses?.['doom']?.turnsRemaining;
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, n) : null;
}

/** The target plate's one-line note for a doomed combatant ("Doom 3"), or `undefined`. */
export function doomNoteOf(c: Parameters<typeof doomCountOf>[0]): string | undefined {
  const n = doomCountOf(c);
  return n === null ? undefined : `Doom ${n}`;
}

export class DoomCounters {
  readonly el: HTMLElement;
  private readonly counters = new Map<CombatantId, Counter>();

  constructor(private readonly opts: DoomCounterOptions) {
    this.el = document.createElement('div');
    this.el.className = 'ffx-doom-layer';
    this.el.dataset['role'] = 'doom-counters';
  }

  /** The ids with a number up, and the number, for tests and the debug snapshot. */
  snapshot(): Record<CombatantId, number> {
    const out: Record<CombatantId, number> = {};
    for (const [id, c] of this.counters) out[id] = c.n;
    return out;
  }

  onEvent(event: BattleEvent): void {
    switch (event.type) {
      case 'status-add':
        if (event.status === 'doom') this.set(event.targetId, event.instance.turnsRemaining);
        return;
      case 'status-tick':
        if (event.status === 'doom') this.set(event.targetId, event.remaining);
        return;
      case 'status-remove':
        if (event.status === 'doom') this.drop(event.targetId);
        return;
      case 'ko':
        this.drop(event.targetId);
        return;
      default:
        return;
    }
  }

  /** Reconcile with the engine's own state: what it says is doomed, and nothing else. */
  sync(state: BattleState): void {
    const live = new Set<CombatantId>();
    if (!state.result) {
      for (const [id, c] of Object.entries(state.combatants)) {
        if (!c || !c.alive || c.removed || c.flags.hidden) continue;
        const n = doomCountOf(c);
        if (n === null) continue;
        live.add(id);
        this.set(id, n);
      }
    }
    for (const id of [...this.counters.keys()]) if (!live.has(id)) this.drop(id);
  }

  /** Per frame: follow each doomed head. */
  update(): void {
    if (this.counters.size === 0) return;
    const project = this.opts.project();
    const layer = this.el.getBoundingClientRect();
    const scale = this.opts.scale() || 1;
    const panels = this.opts.avoid();
    for (const [id, c] of this.counters) {
      const head = project?.(id, 'head') ?? null;
      if (!head) {
        c.el.hidden = true;
        continue;
      }
      c.el.hidden = false;
      const size = Math.max(MIN_CSS_PX, GRID_FONT * scale);
      c.el.style.fontSize = `${size.toFixed(1)}px`;
      const w = c.el.offsetWidth || size * 0.7 * String(c.n).length;
      const h = c.el.offsetHeight || size * 1.1;
      let top = head.y - HEAD_GAP * scale - h;
      const left = head.x - w / 2;
      // Pushed under a panel it would print across, never over it.
      for (let pass = 0; pass < 3; pass++) {
        const hit = panels.find((p) => left < p.right && left + w > p.left && top < p.bottom && top + h > p.top);
        if (!hit) break;
        top = hit.bottom + PANEL_GAP * scale;
      }
      c.el.style.left = `${(left - layer.left).toFixed(1)}px`;
      c.el.style.top = `${(top - layer.top).toFixed(1)}px`;
    }
  }

  clear(): void {
    for (const c of this.counters.values()) c.el.remove();
    this.counters.clear();
  }

  private set(id: CombatantId, n: number | null): void {
    if (n === null || !Number.isFinite(n)) {
      this.drop(id);
      return;
    }
    const count = Math.max(0, Math.round(n));
    let c = this.counters.get(id);
    if (!c) {
      const el = document.createElement('div');
      el.className = 'ffx-doom';
      el.dataset['actor'] = id;
      el.hidden = true;
      this.el.appendChild(el);
      c = { el, n: -1 };
      this.counters.set(id, c);
    }
    if (c.n !== count) {
      c.n = count;
      c.el.textContent = String(count);
      c.el.setAttribute('aria-label', `Doom ${count}`);
      // A fresh tick pulses once, the way the count changing is the news.
      c.el.classList.remove('ffx-doom--tick');
      void c.el.offsetWidth;
      c.el.classList.add('ffx-doom--tick');
    }
    this.update();
  }

  private drop(id: CombatantId): void {
    const c = this.counters.get(id);
    if (!c) return;
    c.el.remove();
    this.counters.delete(id);
  }
}
