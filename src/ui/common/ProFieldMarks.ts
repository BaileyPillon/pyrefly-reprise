/**
 * THE FIELD'S KO MARKS (conference demo, lane "pro-look"; Bailey 2026-10-22, markers "Classic, calm, clear": a grey wash and a KO mark; options book K1 A and K4 A). One small DOM layer in each HUD's overlay (both
 * games, the same class), beside the damage numerals: for every party member who is down, a soft grey wash settles on the floor round the body from the floor impact of the real fall (`proMarkers.KO_FLOOR_MS`), and a
 * small red KO mark pops over it 120 ms later; both stay while the member is down and go the moment she is stood up. The member's row has its own KO pill (`proMarkers.rowMarkHtml`).
 *
 * It reads the battle state through `sync(state)` (the HUD already hands its states to its other panels) and places itself from the HUD's own projector; it has no clock of its own but `update(dt)`, so it
 * freezes with the rest of the game. With the pro look's `markers` piece off (the default) it draws nothing and holds nothing.
 *
 * Game case (rule 14): both games; the shapes follow each game's chrome (a cool grey on navy for FFX, a plum-grey for FFX-2). Presentation only. [ours]
 */
import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import './pro-markers.css';
import { koPlan, proMarkersOn } from './proMarkers.ts';

export type FieldProjector = (id: CombatantId, anchor?: 'head' | 'chest' | 'feet') => { x: number; y: number } | null;

interface Down {
  sinceMs: number;
  wash: HTMLElement;
  mark: HTMLElement;
}

export class ProFieldMarks {
  readonly el: HTMLElement;
  private readonly down = new Map<CombatantId, Down>();
  private project: FieldProjector | null = null;
  private nowMs = 0;

  constructor(private readonly game: 'ffx' | 'ffx2') {
    this.el = document.createElement('div');
    this.el.className = 'pro-field-marks';
    this.el.dataset['role'] = 'pro-field-marks';
    this.el.setAttribute('aria-hidden', 'true');
  }

  setProjector(project: FieldProjector): void {
    this.project = project;
  }

  /** The battle's state: who is down in the party now. */
  sync(state: BattleState): void {
    if (!proMarkersOn()) {
      if (this.down.size) this.clear();
      return;
    }
    const live = new Set<CombatantId>();
    for (const id of state.activeIds) {
      const c = state.combatants[id];
      if (!c || c.alive) continue;
      live.add(id);
      if (this.down.has(id)) continue;
      const wash = document.createElement('div');
      wash.className = 'pro-ko-wash';
      const mark = document.createElement('div');
      mark.className = 'pro-ko-mark';
      mark.textContent = 'KO';
      this.el.append(wash, mark);
      this.down.set(id, { sinceMs: this.nowMs, wash, mark });
    }
    for (const [id, d] of [...this.down]) {
      if (live.has(id)) continue;
      d.wash.remove();
      d.mark.remove();
      this.down.delete(id);
    }
  }

  /** @param dt seconds, from the HUD's own tick */
  update(dt: number): void {
    this.nowMs += dt * 1000;
    if (!this.down.size) return;
    const layer = this.el.getBoundingClientRect();
    const wide = Math.max(140, (typeof window === 'undefined' ? 1600 : window.innerWidth) * 0.09);
    for (const [id, d] of this.down) {
      const feet = this.project?.(id, 'feet') ?? null;
      const plan = koPlan(this.game, this.nowMs - d.sinceMs);
      if (!feet) {
        d.wash.style.opacity = '0';
        d.mark.style.opacity = '0';
        continue;
      }
      const x = feet.x - layer.left;
      const y = feet.y - layer.top;
      d.wash.style.width = `${wide.toFixed(0)}px`;
      d.wash.style.height = `${(wide * 0.34).toFixed(0)}px`;
      d.wash.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${(y - wide * 0.04).toFixed(1)}px)`;
      d.wash.style.opacity = plan.wash.toFixed(3);
      d.mark.style.fontSize = `${Math.max(13, wide * 0.115).toFixed(1)}px`;
      d.mark.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${(y - wide * 0.2).toFixed(1)}px) scale(${plan.markScale.toFixed(3)})`;
      d.mark.style.opacity = plan.mark.toFixed(3);
    }
  }

  clear(): void {
    for (const d of this.down.values()) {
      d.wash.remove();
      d.mark.remove();
    }
    this.down.clear();
  }

  /** In-flight KO marks, for tests and the debug API. */
  get count(): number {
    return this.down.size;
  }
}
