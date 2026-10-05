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
 * the action ends. Cards clear of both stay exactly as they are. While a command menu is open no
 * card fades (`menuOpen`, round 19 PR-0312): the player is reading them to choose.
 *
 * Game case: FFX-2 only (the ATB HUD). FFX's CTB HUD has its own fade (B5, PR-0157).
 */

import type { ActingSignal } from '../../engine/HudPort.ts';
import type { BattleEvent, CombatantId } from '../../battle/common/types.ts';
import './action-fade.css';

export interface FadeBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Is the FFX-2 command list up and shown (the player is choosing)? Read from the DOM, as the mix's `menuOpen` does. */
export function commandMenuUp(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.querySelector<HTMLElement>('.ffx2hud__command');
  if (!el || el.hidden || el.closest('[hidden]')) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 20 && !!el.querySelector('.ig-cmd, [role="menuitem"], button, li');
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
  /** A clock in ms (tests); `performance.now` by default. */
  now?: () => number;
  /**
   * Is a command menu up? While the player is choosing, the cards stay as they are (round 19, PR-0312: under the MAX mix's
   * larger boss the intent and advisor cards took the fade at opacity 0 for 0.55 to 0.6 s on every Bahamut action with a menu
   * open, which hid the very advice and intent the player was reading). Default: the HUD's command list is up and shown.
   */
  menuOpen?: () => boolean;
}

/** An open action whose end never came is dropped after this long (an interrupted burst). */
export const OPEN_ACTION_TTL_MS = 10_000;

interface OpenAction {
  actorId: CombatantId;
  targets: readonly CombatantId[];
  at: number;
}

/**
 * FFX-2's ATB actions overlap: a cast's action-start, then another girl's whole action, then the
 * cast's own damage or heal and its action-end (measured live, Chapter IV). The presenter's signal
 * holds one action at a time and cancels the cast when the second starts, so the fade also reads
 * the event stream the HUD hears first (`observe`), keeps every action still open, and protects
 * the figures of all of them (a blow can land inside a later action's start). The presenter also cancels at every burst's end, and an
 * FFX-2 cast can span two bursts, so once the stream is heard a cancel ends nothing: the action's
 * own action-end does, or victory, defeat, the HUD's unmount, or {@link OPEN_ACTION_TTL_MS}.
 */
export class ActionFade {
  private open: OpenAction[] = [];
  private lastEvent: string | null = null;
  private readonly now: () => number;

  constructor(private readonly opts: ActionFadeOptions) {
    this.now = opts.now ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
  }

  /** `HudPort.onEvent`: every event, heard just before it plays. */
  observe(event: BattleEvent): void {
    this.lastEvent = event.type;
    if (event.type === 'action-start') this.push(event.actorId, event.targets ?? []);
    else if (event.type === 'action-end') this.drop(event.actorId);
    else if (event.type === 'victory' || event.type === 'defeat') this.open = [];
    else return;
    this.apply();
  }

  /** `HudPort.setActing`. */
  signal(s: ActingSignal): void {
    if (s.phase === 'action-start') {
      if (this.lastEvent !== 'action-start') this.push(s.actorId, s.targets);
    } else if (s.phase === 'action-end') {
      if (this.lastEvent !== 'action-end') this.drop(s.actorId);
    } else if (this.lastEvent === null) {
      // A cancel: with no event stream (a test double) it clears. With one it is the presenter's
      // one slot letting go (a second action started, a turn started, or the burst ended with the
      // cast still going: it resumes in the next burst), and the stream's action-end, victory or
      // defeat, or the stale timer, ends it instead.
      this.open = [];
    }
    this.apply();
  }

  /** Per frame while an action plays: the camera and the figures move. */
  update(): void {
    if (!this.open.length) return;
    const t = this.now();
    const live = this.open.filter((a) => t - a.at <= OPEN_ACTION_TTL_MS);
    if (live.length !== this.open.length) this.open = live;
    this.apply();
  }

  /** Every card back, and nothing acting (the HUD unmounted, the battle ended). */
  reset(): void {
    this.open = [];
    this.lastEvent = null;
    this.apply();
  }

  get active(): boolean {
    return this.open.length > 0;
  }

  private push(actorId: CombatantId, targets: readonly CombatantId[]): void {
    this.open.push({ actorId, targets: [...targets], at: this.now() });
  }

  private drop(actorId: CombatantId): void {
    for (let i = this.open.length - 1; i >= 0; i--) {
      if (this.open[i]!.actorId === actorId) {
        this.open.splice(i, 1);
        return;
      }
    }
  }

  private apply(): void {
    // Every open action's figures: a blow can land inside a later action's start (Bahamut's Attack
    // hit after Yuna's Cure began), so no one of them is safely "the" action on screen.
    // A menu open holds every card up: nothing is faded while the player is choosing (PR-0312).
    const zones = (this.opts.menuOpen ?? commandMenuUp)() ? [] : this.open.flatMap((a) => actionZones(a, this.opts.rect));
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
