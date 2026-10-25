/**
 * THE FIELD'S KO MARKS (conference demo, lane "pro-look"; Bailey 2026-10-22, markers "Classic, calm, clear": a grey wash and a KO mark; options book K1 A and K4 A). One small DOM layer in each HUD's overlay (both
 * games, the same class), beside the damage numerals: for every party member who is down, a soft grey wash settles on the floor round the body from the floor impact of the real fall (`proMarkers.KO_FLOOR_MS`), and a
 * small red KO mark pops over it 120 ms later; both stay while the member is down and go the moment she is stood up. The member's row has its own KO pill (`proMarkers.rowMarkHtml`).
 *
 * FFX-2's rule D-357 holds (pro-look review M1): nothing new plays over an open command menu (`engine/motion/MenuHold.ts`, the same question every other added look asks). A member who falls while a menu
 * is open gets her wash and mark the moment the menu closes, settling over their own 450 ms from the floor impact instead of popping in; marks already up stay up when a menu opens. FFX has no such hold (its
 * `menuHolds` is false). REDUCE MOTION (the game's own row or the OS) takes the mark's pop away (pro-look review M4); the wash only fades.
 *
 * It reads the battle state through `sync(state)` (the HUD already hands its states to its other panels) and places itself from the HUD's own projector; it has no clock of its own but `update(dt)`, so it
 * freezes with the rest of the game. With the pro look's `markers` piece off (the default) it draws nothing and holds nothing.
 *
 * Game case (rule 14): both games; the shapes follow each game's chrome (a cool grey on navy for FFX, a plum-grey for FFX-2). Presentation only. [ours]
 */
import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import './pro-markers.css';
import { menuHolds } from '../../engine/motion/MenuHold.ts';
import { prefersReducedMotion } from './transitions/reduceMotion.ts';
import { KO_FLOOR_MS, koPlan, proMarkersOn } from './proMarkers.ts';

export type FieldProjector = (id: CombatantId, anchor?: 'head' | 'chest' | 'feet') => { x: number; y: number } | null;

/** The field's own picture of a figure, from the HUD's targeting port (`HudPort.TargetingPort`): its painted silhouette on screen and how much of it can be seen. */
export interface FieldFigures {
  rect(id: CombatantId): { x: number; y: number; w: number; h: number } | null;
  visibility(id: CombatantId): number;
}

/** Below this share of a downed figure's own sprite in view, the KO mark is not drawn: it would sit on whoever stands in front of her. The row's KO pill and the wash still say it. */
export const KO_MARK_MIN_VISIBLE = 0.12;

/** Where, across her own width, the mark may stand when the point it would take is under a figure in front of her, in the order tried (shares of her silhouette's width). */
const MARK_SHIFTS: readonly number[] = [0, -0.3, 0.3, -0.6, 0.6];

/**
 * Where a downed member's KO mark stands (r63-play, the overnight fix of the skeptic's finding: in Chapter I the mark of a downed Kimahri, who lies behind Tidus, read as sitting on Tidus). The mark belongs on the
 * member's OWN sprite: `at` is the point of her own body it would take (her actor's feet, raised), and when another STANDING figure's silhouette covers that point it moves along her own width to the first point
 * no standing figure covers. Null when every point is covered (she lies wholly behind the others: no mark rather than a mark on someone else; the row's KO pill and the wash still say it). A lying body is
 * not in the standing silhouettes' boxes, so her own box is never the test, only the figures that stand. Pure.
 */
export function markSpot(
  at: { x: number; y: number },
  ownW: number,
  others: ReadonlyArray<{ x: number; y: number; w: number; h: number }>,
  pad = 6,
): { x: number; y: number } | null {
  for (const k of MARK_SHIFTS) {
    const x = at.x + ownW * k;
    const covered = others.some((o) => x >= o.x - pad && x <= o.x + o.w + pad && at.y >= o.y - pad && at.y <= o.y + o.h + pad);
    if (!covered) return { x, y: at.y };
  }
  return null;
}

interface Down {
  sinceMs: number;
  /** False while a command menu held the first appearance back (FFX-2); the timeline starts when it lets go. */
  started: boolean;
  wash: HTMLElement;
  mark: HTMLElement;
}

export class ProFieldMarks {
  readonly el: HTMLElement;
  private readonly down = new Map<CombatantId, Down>();
  private project: FieldProjector | null = null;
  /** The field's silhouettes, once the targeting port is wired (the HUD mocks have none: the mark then stands where it always did). */
  private figures: FieldFigures | null = null;
  /** Who stands, from the last state: the figures a mark must keep clear of. */
  private standing: CombatantId[] = [];
  private nowMs = 0;
  /** REDUCE MOTION, read at most twice a second (the pause row or the OS preference). */
  private reduced = false;
  private reducedAtMs = -1e9;
  /** An aeon is out (FFX): the party is held off the stage (`BattlePresenterStage`, PR-0181), so a downed member has no body on the field to mark; her actor's feet are where the aeon stands. */
  private partyOffStage = false;

  constructor(private readonly game: 'ffx' | 'ffx2') {
    this.el = document.createElement('div');
    this.el.className = 'pro-field-marks';
    this.el.dataset['role'] = 'pro-field-marks';
    this.el.setAttribute('aria-hidden', 'true');
  }

  setProjector(project: FieldProjector): void {
    this.project = project;
  }

  setFigures(figures: FieldFigures): void {
    this.figures = figures;
  }

  /** The battle's state: who is down in the party now. */
  sync(state: BattleState): void {
    if (!proMarkersOn()) {
      if (this.down.size) this.clear();
      return;
    }
    this.partyOffStage = !!state.aeonId || (state.aeonIds?.length ?? 0) > 0;
    const live = new Set<CombatantId>();
    this.standing = state.activeIds.filter((id) => state.combatants[id]?.alive === true);
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
      this.down.set(id, { sinceMs: this.nowMs, started: false, wash, mark });
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
    if (this.nowMs - this.reducedAtMs > 500) {
      this.reduced = prefersReducedMotion();
      this.reducedAtMs = this.nowMs;
    }
    for (const [id, d] of this.down) {
      if (this.partyOffStage) {
        // r63-play (the KO chip found on the aeon's feet in a steered Chapter I fight): while an aeon is out the party's figures are not drawn, and a hidden actor still projects to its slot, which is
        // where the aeon stands. The wash and the mark are not drawn, and are there again when the party is (a member still down gets her mark back, settling again).
        d.wash.style.opacity = '0';
        d.mark.style.opacity = '0';
        d.started = false; // when the party returns the wash settles over its 450 ms again, it does not pop in
        continue;
      }
      const feet = this.project?.(id, 'feet') ?? null;
      if (!d.started) {
        if (menuHolds()) {
          d.wash.style.opacity = '0';
          d.mark.style.opacity = '0';
          continue;
        }
        d.started = true;
        // the fall played behind the menu: the wash settles over its own 450 ms from here, it does not pop in at full
        if (this.nowMs - d.sinceMs > KO_FLOOR_MS[this.game]) d.sinceMs = this.nowMs - KO_FLOOR_MS[this.game];
      }
      const plan = koPlan(this.game, this.nowMs - d.sinceMs);
      if (this.reduced) plan.markScale = plan.mark > 0 ? 1 : 0; // no pop
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
      // The mark stands on the member's own sprite and keeps clear of the figures in front of her (`markSpot`); hidden when her sprite is not on the stage or is all but covered.
      let mx = x;
      let my = y - wide * 0.2;
      let markShown = true;
      if (this.figures) {
        const own = this.figures.rect(id);
        if (!own || this.figures.visibility(id) < KO_MARK_MIN_VISIBLE) {
          markShown = false;
        } else {
          const others = this.standing.filter((o) => o !== id).map((o) => this.figures!.rect(o)).filter((r): r is { x: number; y: number; w: number; h: number } => r !== null);
          const spot = markSpot({ x: feet.x, y: feet.y - wide * 0.2 }, own.w, others);
          if (spot) {
            mx = spot.x - layer.left;
            my = spot.y - layer.top;
          } else markShown = false;
        }
      }
      d.mark.style.fontSize = `${Math.max(13, wide * 0.115).toFixed(1)}px`;
      d.mark.style.transform = `translate(-50%, -50%) translate(${mx.toFixed(1)}px, ${my.toFixed(1)}px) scale(${plan.markScale.toFixed(3)})`;
      d.mark.style.opacity = markShown ? plan.mark.toFixed(3) : '0';
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
