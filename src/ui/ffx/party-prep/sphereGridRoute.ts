/**
 * The cheapest walk across the Sphere Grid, for AUTO-LEARN (option C) and for
 * the node preview and WALK AND ACTIVATE (option B, Bailey's pick D-295,
 * `docs/concepts/fb-0929/sphere/option-b-layout.jpg`). One search, so the two
 * can never price a walk differently.
 *
 * **Game case: FFX only.** The Sphere Grid is FFX's levelling board
 * [research/visual-bible.md §5.4, research/ffx-combat-core.md §10].
 *
 * Prices mirror {@link SphereGridModel.moveCost} exactly: a step onto new
 * ground costs 1 S.Lv; a step onto travelled ground costs 1 when no paid-for
 * travelled step is left (and that S.Lv then covers the next three), else 0.
 * The search tracks those paid steps (`q`, 0-3) as part of its state. It walks
 * only through open ground: a closed lock blocks everyone until it is opened
 * (the model's own `blocked` rule). It only *chooses*; nothing here spends
 * anything. Ties: least S.Lv, then fewest steps, then the lowest node id.
 */

import { NODE_BY_ID, neighboursOf, type GridNode } from './sphereGridData.ts';
import type { SphereGridModel } from './sphereGridModel.ts';

interface State {
  node: number;
  q: number;
  cost: number;
  steps: number;
}

function better(a: State, b: State): boolean {
  return a.cost !== b.cost ? a.cost < b.cost : a.steps !== b.steps ? a.steps < b.steps : a.node < b.node;
}

/** A small binary min-heap on {@link better}. */
class Heap {
  private readonly a: State[] = [];
  get size(): number {
    return this.a.length;
  }
  push(s: State): void {
    const a = this.a;
    a.push(s);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!better(a[i]!, a[p]!)) break;
      [a[i], a[p]] = [a[p]!, a[i]!];
      i = p;
    }
  }
  pop(): State {
    const a = this.a;
    const top = a[0]!;
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && better(a[l]!, a[m]!)) m = l;
        if (r < a.length && better(a[r]!, a[m]!)) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m]!, a[i]!];
        i = m;
      }
    }
    return top;
  }
}

/** How one step of a route is paid for, as the grid's step labels say it. */
export type StepKind = 'new' | 'pays4' | 'paid';

export interface RouteStep {
  node: number;
  /** S.Lv this step takes: 1 or 0. */
  cost: number;
  /** `new`: fresh ground, 1 S.Lv. `pays4`: travelled, 1 S.Lv that covers four steps. `paid`: travelled, already paid. */
  kind: StepKind;
}

export interface Route {
  /** The steps, in order; empty when the goal is where the character stands. */
  steps: RouteStep[];
  /** S.Lv the whole walk takes. */
  sLv: number;
}

/**
 * The cheapest walk from where `memberId` stands to the first node `goal`
 * accepts, within `budget` S.Lv (default: no limit), or null. The start
 * counts: if it already satisfies `goal`, the route is empty.
 */
export function cheapestRoute(
  model: SphereGridModel,
  memberId: string,
  goal: (node: GridNode) => boolean,
  budget = Number.POSITIVE_INFINITY,
): Route | null {
  const grid = model.gridFor(memberId);
  if (!grid) return null;
  const key = (node: number, q: number): number => node * 4 + q;
  const best = new Map<number, State>();
  const prev = new Map<number, number | null>();
  const heap = new Heap();
  const start: State = { node: grid.position, q: grid.quarterSteps, cost: 0, steps: 0 };
  best.set(key(start.node, start.q), start);
  prev.set(key(start.node, start.q), null);
  heap.push(start);
  const done = new Set<number>();
  let found: State | null = null;

  while (heap.size) {
    const cur = heap.pop();
    const k = key(cur.node, cur.q);
    if (done.has(k)) continue;
    done.add(k);
    const node = NODE_BY_ID.get(cur.node);
    // The first settled state that is a goal is the cheapest (the heap orders by cost, steps, node id).
    if (node && goal(node)) {
      found = cur;
      break;
    }
    for (const nb of [...neighboursOf(cur.node)].sort((x, y) => x - y)) {
      const next = NODE_BY_ID.get(nb);
      if (!next || (next.kind === 'lock' && !model.unlocked.has(nb))) continue;
      let cost = cur.cost;
      let q = cur.q;
      if (grid.visited.has(nb)) {
        if (q === 0) {
          cost += 1;
          q = 3;
        } else q -= 1;
      } else cost += 1;
      if (cost > budget) continue;
      const s: State = { node: nb, q, cost, steps: cur.steps + 1 };
      const nk = key(nb, q);
      const had = best.get(nk);
      if (had && !better(s, had)) continue;
      best.set(nk, s);
      prev.set(nk, k);
      heap.push(s);
    }
  }
  if (!found) return null;
  const keys: number[] = [];
  let k: number | null | undefined = key(found.node, found.q);
  while (k !== null && k !== undefined) {
    keys.push(k);
    k = prev.get(k);
  }
  keys.reverse();
  const steps: RouteStep[] = [];
  for (let i = 1; i < keys.length; i++) {
    const here = best.get(keys[i]!)!;
    const before = best.get(keys[i - 1]!)!;
    const cost = here.cost - before.cost;
    steps.push({ node: here.node, cost, kind: !grid.visited.has(here.node) ? 'new' : cost > 0 ? 'pays4' : 'paid' });
  }
  return { steps, sLv: found.cost };
}

/**
 * The walk that lets `memberId` act on `targetId`: onto the node itself, or,
 * for a closed lock (which nobody can stand on), onto the cheapest node beside
 * it, from where the model opens it. Null when no open path exists.
 */
export function routeTo(model: SphereGridModel, memberId: string, targetId: number): Route | null {
  const target = NODE_BY_ID.get(targetId);
  if (!target) return null;
  if (target.kind === 'lock' && !model.unlocked.has(targetId)) {
    const beside = new Set(neighboursOf(targetId));
    return cheapestRoute(model, memberId, (n) => beside.has(n.id));
  }
  return cheapestRoute(model, memberId, (n) => n.id === targetId);
}
