/**
 * Where the upright phone's field looks (option B "compact rail", Bailey
 * 2026-09-25; `phoneBattle.ts` has the layout and the sources).
 *
 * Game case (AGENTS.md rule 14): **both**. Shared presentation plumbing: no
 * camera, rig or number of either game changes; only which slice of the render
 * the phone shows.
 *
 * Why it exists. The phone's field is 390 x 520 (360 x 456 at 360 x 780) and
 * the scene cameras were framed for 16:9, so at the field's height a whole
 * fight is wider than the window. Cut to the window, the edge figures fell off
 * it: in Chapter V the acting girl, Yuna, stood wholly left of the frame; in
 * Chapters IV and VI the left girl was cut at 360; Lulu in Chapter IX. The
 * pixel scale is set by the field's height alone (a fixed vertical field of
 * view), so no crop can shrink the fight; what the phone can choose is which
 * slice of the 16:9 render it shows.
 *
 * So `phone-battle.css` draws the canvas at 16:9 of the field's height and
 * slides it (`--phud-left`), and this module picks the slide each time a
 * command menu is up (never while aiming, so the brackets stay on their
 * figures): the acting figure first, then the rest of the party, then the
 * largest enemy, then the others, and among equally good slides the one
 * closest to where the field sat before (its "home": FFX centred, FFX-2 the
 * sheet's left-anchored 0.93 frame).
 */

import type { BattleState, CombatantId } from '../../battle/common/types.ts';

/** A figure's horizontal extent on the canvas, and how much it matters. */
export interface FramedFigure {
  x: number;
  w: number;
  weight: number;
}

export interface FramingProblem {
  /** The window's width: the part of the canvas on screen. */
  view: number;
  /** The canvas's width; its left edge can sit anywhere in `[view - canvas, 0]`. */
  canvas: number;
  /** Where the left edge sits by default (the tie-break). */
  home: number;
  figures: readonly FramedFigure[];
}

/** Room kept between a figure and the window's edge, in CSS px. */
export const FRAME_MARGIN = 8;
/** Scores this close count as equal, and the slide nearest home wins. */
const TIE = 0.05;
/**
 * Weights: the acting figure above all, then each of the rest of the party and
 * the largest enemy alike, then every other enemy (a small one at the edge must
 * not push a girl out of the frame).
 */
export const FRAME_WEIGHTS = { focus: 40, actor: 10, party: 6, boss: 6, enemy: 1 } as const;

/** How much of a figure's width lies inside `[lo, hi]`, 0..1. */
function shown(f: FramedFigure, lo: number, hi: number): number {
  if (f.w <= 0) return lo <= f.x && f.x <= hi ? 1 : 0;
  return Math.max(0, Math.min(f.x + f.w, hi) - Math.max(f.x, lo)) / f.w;
}

/** The weighted share of the figures a left edge at `left` shows. */
export function frameScore(p: FramingProblem, left: number): number {
  const lo = -left + FRAME_MARGIN;
  const hi = -left + p.view - FRAME_MARGIN;
  return p.figures.reduce((s, f) => s + f.weight * shown(f, lo, hi), 0);
}

/** The canvas's best left edge: the highest score, ties to the one nearest home. */
export function bestLeft(p: FramingProblem): number {
  const min = Math.min(0, Math.round(p.view - p.canvas));
  const home = Math.min(0, Math.max(min, p.home));
  if (!p.figures.length || min === 0) return home;
  const scores: Array<[number, number]> = [];
  for (let left = min; left <= 0; left += 2) scores.push([left, frameScore(p, left)]);
  scores.push([0, frameScore(p, 0)], [home, frameScore(p, home)]);
  const top = Math.max(...scores.map(([, s]) => s));
  const good = scores.filter(([, s]) => s >= top - TIE).map(([left]) => left);
  return good.reduce((a, b) => (Math.abs(b - home) < Math.abs(a - home) ? b : a));
}

/** Who is on the field and how much each one matters, from the engine's state. */
export function framedIds(state: BattleState, actor: CombatantId | null): Array<[CombatantId, number]> {
  const out: Array<[CombatantId, number]> = [];
  // A summoned aeon stands in for the party (FFX); the party has left the field.
  const party = state.aeonId ? [state.aeonId] : state.activeIds;
  for (const id of party) out.push([id, id === actor ? FRAME_WEIGHTS.actor : FRAME_WEIGHTS.party]);
  for (const id of state.enemyIds) {
    const c = state.combatants[id] as { hp?: number } | undefined;
    if (c && typeof c.hp === 'number' && c.hp <= 0) continue;
    out.push([id, FRAME_WEIGHTS.enemy]);
  }
  return out;
}

type RectOf = (id: CombatantId) => { x: number; y: number; w: number; h: number } | null;

/** Moves under this many px are camera sway, not a new framing (gliding; aiming jumps, so it waits for more). */
const HYSTERESIS = { glide: 4, jump: 16 } as const;

export interface PhoneField {
  /** The field's silhouette boxes (`TargetingPort.rect`). */
  setRects(rect: RectOf): void;
  setState(state: BattleState): void;
  setActor(id: CombatantId | null): void;
  /**
   * Pick the slide for the figures as they stand now. With a menu up it glides
   * there; while aiming, `focus` is the aimed figure, kept whole above all, and
   * the slide jumps, carrying the drawn brackets with it (below).
   */
  frame(homeAspect: number, focus?: readonly CombatantId[]): void;
  /** Back to the stylesheet's default slide. */
  reset(): void;
}

/**
 * The live half: reads the figures through the targeting port, measures the
 * canvas, and writes `--phud-left` on `<html>` (the stylesheet's `#game` reads it).
 */
export function createPhoneField(doc: Document = document): PhoneField {
  let rectOf: RectOf | null = null;
  let state: BattleState | null = null;
  let actor: CombatantId | null = null;
  let applied: number | null = null;
  const html = doc.documentElement;
  // The brackets, the hand, the flower and the plate are drawn once per aim
  // (`TargetCursor.reposition`) against the canvas where it stood. A jump while
  // aiming shifts their layer by the same amount, until the cursor redraws them
  // against the new canvas rect, which puts the layer back.
  const carried = new WeakMap<HTMLElement, number>();
  const carry = (dx: number): void => {
    for (const layer of doc.querySelectorAll<HTMLElement>('.ffx-targeting')) {
      if (!carried.has(layer)) {
        new MutationObserver(() => {
          carried.set(layer, 0);
          layer.style.removeProperty('transform');
        }).observe(layer, { childList: true });
      }
      const x = (carried.get(layer) ?? 0) + dx;
      carried.set(layer, x);
      layer.style.transform = `translateX(${x}px)`;
    }
  };
  return {
    setRects(rect) {
      rectOf = rect;
    },
    setState(s) {
      state = s;
    },
    setActor(id) {
      actor = id;
    },
    frame(homeAspect, focus = []) {
      const game = doc.getElementById('game');
      const view = doc.defaultView?.innerWidth ?? 0;
      if (!game || !rectOf || !state || view <= 0) return;
      const box = game.getBoundingClientRect();
      if (box.width <= view + 1) return;
      const figures: FramedFigure[] = [];
      let boss: FramedFigure | null = null;
      let bossArea = 0;
      for (const [id, w] of framedIds(state, actor)) {
        const weight = focus.includes(id) ? FRAME_WEIGHTS.focus : w;
        const r = rectOf(id);
        if (!r || !Number.isFinite(r.x) || !Number.isFinite(r.w)) continue;
        const f = { x: r.x - box.left, w: r.w, weight };
        figures.push(f);
        if (weight === FRAME_WEIGHTS.enemy && r.w * r.h > bossArea) {
          bossArea = r.w * r.h;
          boss = f;
        }
      }
      if (boss) boss.weight = FRAME_WEIGHTS.boss;
      const home = -(box.width - Math.max(view, box.height * homeAspect)) / 2;
      const left = bestLeft({ view, canvas: box.width, home, figures });
      const jump = focus.length > 0;
      if (applied !== null && Math.abs(left - applied) < HYSTERESIS[jump ? 'jump' : 'glide']) return;
      applied = left;
      html.style.setProperty('--phud-pan-time', jump ? '0s' : '0.35s');
      html.style.setProperty('--phud-left', `${left}px`);
      if (jump) carry(left - box.left);
    },
    reset() {
      applied = null;
      html.style.removeProperty('--phud-left');
      html.style.removeProperty('--phud-pan-time');
    },
  };
}
