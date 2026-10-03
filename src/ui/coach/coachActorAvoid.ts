/**
 * PR-0237 (critic round 15): a first-time coach line must not cover a fighter's
 * face or weapon (CHK-008). Both games: the coach layer is shared, and the
 * round saw it in each. FFX, Chapter I at 2000x1012: Auron's line, already
 * stepped off the intent slab (`coachIntentAvoid.ts`), landed over Kimahri's
 * and Yuna's heads. FFX-2, Chapter XI at 1600x900: Rikku's gauge line sat on
 * Paine's sword.
 *
 * The line's placement already dodges HUD panels (the advisor card, the slab,
 * the one-chapter panels), but no fighter was ever an input. Here every living
 * fighter's painted silhouette (`TargetingPort.rect`, the tight alpha box the
 * target bracket is drawn on) is one: the top third of it, where the face is,
 * counts four times as much as the rest, which is where the weapons are. There
 * is no per-painting face and weapon table except Vegnagun's
 * (`engine/keyFeatures.ts`), so the whole figure is the honest box.
 *
 * The search is small and pure: candidate corners from every edge on the board,
 * `gap` clear; a candidate may not touch any HUD panel; the winner covers the
 * least fighter (head-weighted), then moves least. It is taken only when it is
 * strictly better than where the line is, so a per-frame caller settles, and
 * the line never lands on a panel to get off a fighter. Desktop only: the phone
 * layout centres the line in its own band (`coach.css`), which this does not
 * second-guess.
 */

import type { BattleState, CombatantId, GameId } from '../../battle/common/types.ts';
import type { TargetingPort } from '../../engine/HudPort.ts';
import { CHAPTER_PANEL_SELECTORS, INTENT_AVOID_SELECTORS, rectsOf } from '../ffx/hudAvoidSelectors.ts';
import { overlaps, type Rect } from './coachAvoid.ts';
import { keepMarkInStage, keepMarkOffIntent, markBox } from './coachIntentAvoid.ts';

/** The panels a coach line may never sit on, both games (solid children only, never an `inset: 0` wrapper). */
export const COACH_PANEL_SELECTORS: readonly string[] = [
  ...INTENT_AVOID_SELECTORS.filter((s) => s !== '.ig-reticle'),
  ...CHAPTER_PANEL_SELECTORS,
  '.eint__panel',
  '.eint__toggle',
  // FFX-2's board (`ffx2/intentBoard.ts`), and its help band.
  '.ffx2hud__enemies',
  '.ffx2hud__party',
  '.ffx2hud__command',
  '.ffx2hud__telegraph',
  '.ffx2-chain-chip',
  '.battle-pause-chip',
];

/** Clear air kept round a panel and a fighter, in px. */
export const ACTOR_GAP = 10;
/** The face band: the top third of a silhouette, weighted over the rest. */
const HEAD_SHARE = 1 / 3;
const HEAD_WEIGHT = 4;

function shared(a: Rect, b: Rect): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

/** How much of the fighters `r` covers, the face band counted {@link HEAD_WEIGHT} times. */
export function actorCost(r: Rect, actors: readonly Rect[]): number {
  let cost = 0;
  for (const a of actors) {
    const head = { ...a, bottom: a.top + (a.bottom - a.top) * HEAD_SHARE };
    cost += shared(r, a) + (HEAD_WEIGHT - 1) * shared(r, head);
  }
  return cost;
}

/**
 * Where `mark` should go: clear of every `panel` by `gap`, inside `stage`,
 * covering the least of `actors`; `null` when it already covers none, or when
 * no panel-clear place covers less than it does now.
 */
export function placeOffActors(mark: Rect, actors: readonly Rect[], panels: readonly Rect[], stage: Rect, gap = ACTOR_GAP): Rect | null {
  const now = actorCost(mark, actors);
  if (now === 0) return null;
  const w = mark.right - mark.left;
  const h = mark.bottom - mark.top;
  const edges = [...panels, ...actors];
  const lefts = new Set([mark.left, stage.left + gap, stage.right - gap - w, ...edges.flatMap((e) => [e.right + gap, e.left - gap - w])]);
  const tops = new Set([mark.top, stage.top + gap, stage.bottom - gap - h, ...edges.flatMap((e) => [e.bottom + gap, e.top - gap - h])]);
  const grown = panels.map((p) => ({ left: p.left - gap + 1, top: p.top - gap + 1, right: p.right + gap - 1, bottom: p.bottom + gap - 1 }));
  let best: { rect: Rect; cost: number; move: number } | null = null;
  for (const left of lefts) {
    if (left < stage.left || left + w > stage.right) continue;
    for (const top of tops) {
      if (top < stage.top || top + h > stage.bottom) continue;
      const rect = { left, top, right: left + w, bottom: top + h };
      if (grown.some((p) => overlaps(rect, p))) continue;
      const cost = actorCost(rect, actors);
      const move = Math.hypot(left - mark.left, top - mark.top);
      if (!best || cost < best.cost || (cost === best.cost && move < best.move)) best = { rect, cost, move };
    }
  }
  return best && best.cost < now ? best.rect : null;
}

/** The fighters' silhouettes, from the field's targeting port and the last synced state. */
export class ActorRects {
  port: TargetingPort | null = null;
  /** fb2-0929 camera comfort: silhouettes where the camera's shot rests, so the line does not drift with a camera move. */
  rest: TargetingPort['rect'] | null = null;
  private ids: CombatantId[] = [];

  track(state: BattleState): void {
    this.ids = Object.keys(state.combatants).filter((id) => state.combatants[id]?.alive !== false);
  }

  rects(): Rect[] {
    const out: Rect[] = [];
    for (const id of this.ids) {
      const r = this.rest ? this.rest(id) : this.port?.rect(id);
      if (r && r.w > 1 && r.h > 1) out.push({ left: r.x, top: r.y, right: r.x + r.w, bottom: r.y + r.h });
    }
    return out;
  }
}

/**
 * Every frame a line is up (`CoachLayer.update`): FFX's line off the intent slab
 * first (t1-b3a), then, on the desktop layout, either game's line off the
 * fighters. Deltas on the computed position, as `CoachMark` moves it.
 */
export function keepMarkClear(game: GameId, mark: HTMLElement, host: HTMLElement, actors: ActorRects): void {
  if (mark.dataset['guide']) return; // the first-run guide places its own line (`firstRunGuide.ts`, O2)
  const phone = !!document.documentElement.dataset['phoneBattle'];
  // U5 (PR-0237 sibling, FFX-2 phone): the phone's centred line (`coach.css`, top 8%) covered the intent strip at the
  // top of the field (21,080 px2 at 390x844 in Chapters IV and XVI); FFX's own line was already stepped off it.
  if (game === 'ffx' || phone) keepMarkOffIntent(mark, host);
  if (!phone) placeMarkOffActors(mark, host, actors);
  // r37-ui-floor, third attempt: whichever solver moved it, the line's whole box (badge included) ends inside the stage.
  keepMarkInStage(mark, host);
}

/** Desktop: the least-covering, panel-clear place for the line's whole box (the FFX-2 badge hangs 28 px above it and runs wider). */
function placeMarkOffActors(mark: HTMLElement, host: HTMLElement, actors: ActorRects): void {
  if (mark.getBoundingClientRect().width === 0) return;
  // Solved on the slab alone, the badge hung off the top and the right of the window (r37-ui-floor, blocker 1): the box is `markBox`.
  const box = markBox(mark);
  const s = host.getBoundingClientRect();
  const moved = placeOffActors(box, actors.rects(), rectsOf(host.ownerDocument.body, COACH_PANEL_SELECTORS), { left: s.left, top: s.top, right: s.right, bottom: s.bottom });
  if (!moved) return;
  const style = getComputedStyle(mark);
  mark.style.top = `${(parseFloat(style.top) || 0) + moved.top - box.top}px`;
  mark.style.left = `${(parseFloat(style.left) || 0) + moved.left - box.left}px`;
}
