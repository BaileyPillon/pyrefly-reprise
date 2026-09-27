/**
 * A-15 / PR-0157, the FFX-2 half: an advisory card steps back while an action plays over the
 * figures it covers.
 *
 * The FFX-2 HUD keeps its advisory cards up through the ATB clock (the move advisor, the strategy
 * guide, the enemy-intent card), and an action's camera and effect play on whichever figures are
 * under them. B2 built the signal (`HudPort.setActing`, `engine/ActingState.ts`: `action-start`
 * with the actor and targets, then `action-end` or `cancel`); this module is the fade the HUD
 * does with it. While an action plays, any card whose box meets the acting figure, or the upper
 * two thirds of a target (the face and the body the hit lands on), fades out; it comes back when
 * the action ends. Cards clear of both stay exactly as they are.
 *
 * Game case: FFX-2 only (the ATB HUD). FFX's CTB HUD has its own fade (B5, PR-0157).
 */

import type { ActingSignal } from '../../engine/HudPort.ts';
import type { CombatantId } from '../../battle/common/types.ts';
import './action-fade.css';

export interface FadeBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The class a stepped-back card carries (`action-fade.css`). */
export const ACTION_FADE_CLASS = 'ffx2-actfade';

/** The part of a target the fade protects: its upper two thirds. */
export function upperTwoThirds(b: FadeBox): FadeBox {
  return { x: b.x, y: b.y, w: b.w, h: (b.h * 2) / 3 };
}

/** Whether a card's box meets a zone, by more than a hairline. */
export function meets(card: FadeBox, zone: FadeBox): boolean {
  const w = Math.min(card.x + card.w, zone.x + zone.w) - Math.max(card.x, zone.x);
  const h = Math.min(card.y + card.h, zone.y + zone.h) - Math.max(card.y, zone.y);
  return w > 1 && h > 1;
}

/** The zones an action on screen protects: the actor whole, each target's upper two thirds. */
export function actionZones(
  acting: { actorId: CombatantId; targets: readonly CombatantId[] },
  rect: (id: CombatantId) => FadeBox | null,
): FadeBox[] {
  const zones: FadeBox[] = [];
  const actor = rect(acting.actorId);
  if (actor) zones.push(actor);
  for (const id of acting.targets) {
    if (id === acting.actorId) continue;
    const t = rect(id);
    if (t) zones.push(upperTwoThirds(t));
  }
  return zones;
}

export interface ActionFadeOptions {
  /** The advisory cards, looked up each frame (a card may be re-mounted). */
  cards: () => ReadonlyArray<HTMLElement | null | undefined>;
  /** A combatant's painted silhouette on screen (`TargetingPort.rect`). */
  rect: (id: CombatantId) => FadeBox | null;
}

export class ActionFade {
  private acting: { actorId: CombatantId; targets: readonly CombatantId[] } | null = null;

  constructor(private readonly opts: ActionFadeOptions) {}

  /** `HudPort.setActing`. */
  signal(s: ActingSignal): void {
    if (s.phase === 'action-start') this.acting = { actorId: s.actorId, targets: [...s.targets] };
    else this.acting = null;
    this.apply();
  }

  /** Per frame while an action plays: the camera and the figures move. */
  update(): void {
    if (this.acting) this.apply();
  }

  /** Every card back, and nothing acting (the HUD unmounted, the battle ended). */
  reset(): void {
    this.acting = null;
    this.apply();
  }

  get active(): boolean {
    return this.acting !== null;
  }

  private apply(): void {
    const zones = this.acting ? actionZones(this.acting, this.opts.rect) : [];
    for (const card of this.opts.cards()) {
      if (!card) continue;
      let hit = false;
      if (zones.length > 0) {
        const r = card.getBoundingClientRect();
        const box = { x: r.left, y: r.top, w: r.width, h: r.height };
        hit = box.w > 0 && box.h > 0 && zones.some((z) => meets(box, z));
      }
      card.classList.toggle(ACTION_FADE_CLASS, hit);
    }
  }
}
