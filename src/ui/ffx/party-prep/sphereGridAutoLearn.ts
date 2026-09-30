/**
 * AUTO-LEARN for the Sphere Grid tab (Bailey's pick D-290, option C of
 * `docs/concepts/fb-0929/sphere/`), with the snapshot its UNDO restores.
 *
 * **Game case: FFX only.** The Sphere Grid is FFX's levelling board
 * [research/visual-bible.md §5.4, research/ffx-combat-core.md §10].
 *
 * The planner only *chooses*. Every step and every activation goes through
 * {@link SphereGridModel.moveTo} and {@link SphereGridModel.activate}, so the
 * S.Lv prices, the pouch, the 255 cap and the pool rule are the model's and
 * cannot drift from what a player gets by clicking. What it chooses, and why
 * (`docs/plans/sphere-ac-review.md`):
 *
 * - the cheapest node it can pay for (S.Lv first, then steps, then node id),
 *   again, up to {@link AUTO_LEARN_BATCH} nodes a press or until nothing the
 *   pouch holds a sphere for is within the S.Lv left. Deterministic. The
 *   batch of four is the approved picture's (option C: "4 nodes along his own
 *   path", Tidus S.Lv 30 -> 23 in Chapter I, which this planner reproduces
 *   exactly); it is a choice of ours, not a game rule, and it keeps one press
 *   from emptying the pouch the whole party shares. Press again for four more;
 * - only the node the character stands on is activated, as the tab does
 *   today (whether FFX also activates next-door nodes is unsourced);
 * - it never opens a lock: keys are one shared pouch and an opened lock is
 *   open for everyone [ffx-combat-core §10.1], so that stays the player's
 *   call. It walks only through open ground;
 * - it skips a stat node whose stat already sits at the 255 cap, which would
 *   spend a sphere for nothing.
 */

import type { FFXMemberBuild, StatBlock } from '../../../battle/common/types.ts';
import { NODE_BY_ID, neighboursOf, sphereLabel, statField, type GridNode } from './sphereGridData.ts';
import type { SphereGridModel } from './sphereGridModel.ts';

// ------------------------------------------------------------- snapshot

/** Everything auto-learn can change, copied, so UNDO can put it back exactly. */
export interface GridSnapshot {
  memberId: string;
  stats: StatBlock;
  hp: number;
  mp: number;
  learnedAbilityIds: string[];
  sLv: number;
  position: string;
  activatedNodeIds: string[];
  pouch: Record<string, number>;
  gridPosition: number;
  activated: number[];
  visited: number[];
  quarterSteps: number;
  unlocked: number[];
}

export function snapshotGrid(model: SphereGridModel, memberId: string): GridSnapshot | null {
  const member = model.memberBuild(memberId);
  const grid = model.gridFor(memberId);
  if (!member || !grid) return null;
  return {
    memberId,
    stats: { ...member.stats },
    hp: member.hp,
    mp: member.mp,
    learnedAbilityIds: [...member.learnedAbilityIds],
    sLv: member.sphereGrid.sLv,
    position: member.sphereGrid.position,
    activatedNodeIds: [...member.sphereGrid.activatedNodeIds],
    pouch: { ...model.build.sphereInventory },
    gridPosition: grid.position,
    activated: [...grid.activated],
    visited: [...grid.visited],
    quarterSteps: grid.quarterSteps,
    unlocked: [...model.unlocked],
  };
}

function refill<T>(set: Set<T>, from: readonly T[]): void {
  set.clear();
  for (const v of from) set.add(v);
}

/** Put the build and the model back exactly as {@link snapshotGrid} saw them. In place: every holder keeps its reference. */
export function restoreGrid(model: SphereGridModel, snap: GridSnapshot): void {
  const member = model.memberBuild(snap.memberId);
  const grid = model.gridFor(snap.memberId);
  if (!member || !grid) return;
  Object.assign(member.stats, snap.stats);
  member.hp = snap.hp;
  member.mp = snap.mp;
  member.learnedAbilityIds.splice(0, member.learnedAbilityIds.length, ...(snap.learnedAbilityIds as FFXMemberBuild['learnedAbilityIds']));
  member.sphereGrid.sLv = snap.sLv;
  member.sphereGrid.position = snap.position;
  member.sphereGrid.activatedNodeIds = [...snap.activatedNodeIds];
  const pouch = model.build.sphereInventory;
  for (const id of Object.keys(pouch)) if (!(id in snap.pouch)) delete pouch[id];
  Object.assign(pouch, snap.pouch);
  grid.position = snap.gridPosition;
  refill(grid.activated, snap.activated);
  refill(grid.visited, snap.visited);
  grid.quarterSteps = snap.quarterSteps;
  const walk = model.walkRecord(snap.memberId);
  if (walk) {
    if (walk.visited !== grid.visited) refill(walk.visited, snap.visited);
    walk.quarterSteps = snap.quarterSteps;
  }
  refill(model.unlocked, snap.unlocked);
}

// -------------------------------------------------------------- planner

const STAT_CAP = 255;

/** Would activating `node` now do something the model allows and the pouch can pay for? */
function worthActivating(model: SphereGridModel, member: FFXMemberBuild, activated: ReadonlySet<number>, node: GridNode): boolean {
  if (node.kind !== 'stat' && node.kind !== 'ability') return false;
  if (activated.has(node.id) || model.spheresHeld(node.sphere) < 1) return false;
  const field = statField(node.stat);
  if (node.kind === 'stat' && field && field !== 'maxHp' && field !== 'maxMp' && member.stats[field] >= STAT_CAP) return false;
  return true;
}

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

/**
 * The steps to the cheapest node worth activating, or null. Prices mirror
 * {@link SphereGridModel.moveCost}: a step onto new ground costs 1 S.Lv; a
 * step onto travelled ground costs 1 when no paid-for travelled step is left
 * (and then covers the next three), else 0. `q` is those paid steps.
 */
export function nextTarget(model: SphereGridModel, memberId: string): number[] | null {
  const grid = model.gridFor(memberId);
  const member = model.memberBuild(memberId);
  if (!grid || !member) return null;
  const budget = member.sphereGrid.sLv;
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
    // The first settled state that is worth activating is the cheapest (the heap orders by cost, steps, node id).
    if (node && worthActivating(model, member, grid.activated, node)) {
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
  const path: number[] = [];
  let k: number | null | undefined = key(found.node, found.q);
  while (k !== null && k !== undefined) {
    path.push(Math.floor(k / 4));
    k = prev.get(k);
  }
  path.reverse();
  return path.slice(1);
}

// -------------------------------------------------------------- the run

/** One stat's before and after, for the result card's gains row. */
export interface StatGain {
  label: string;
  before: number;
  after: number;
}

export interface AutoLearnResult {
  memberId: string;
  name: string;
  /** Nodes activated, in order. */
  activated: number[];
  steps: number;
  sLvBefore: number;
  sLvAfter: number;
  /** Sphere family label (`'Power'`) -> how many were spent, in pouch order. */
  spent: { label: string; count: number }[];
  gains: StatGain[];
  /** Display names of abilities learned. */
  learned: string[];
  snapshot: GridSnapshot;
}

const GAIN_ORDER: ReadonlyArray<[keyof StatBlock, string]> = [
  ['str', 'STR'],
  ['def', 'DEF'],
  ['mag', 'MAG'],
  ['mdef', 'MDF'],
  ['agi', 'AGI'],
  ['acc', 'ACC'],
  ['eva', 'EVA'],
  ['luck', 'LCK'],
  ['maxHp', 'MAX HP'],
  ['maxMp', 'MAX MP'],
];

const SPHERE_ORDER = ['power', 'speed', 'mana', 'ability', 'fortune'];

/** Nodes one press activates at most (see the file header). */
export const AUTO_LEARN_BATCH = 4;

/**
 * Walk and activate for one character. Returns null when nothing could be
 * paid for (the build and the model are then untouched).
 */
export function autoLearn(model: SphereGridModel, memberId: string, batch = AUTO_LEARN_BATCH): AutoLearnResult | null {
  const member = model.memberBuild(memberId);
  const snapshot = snapshotGrid(model, memberId);
  if (!member || !snapshot) return null;
  const activated: number[] = [];
  const learned: string[] = [];
  let steps = 0;

  while (activated.length < batch) {
    const path = nextTarget(model, memberId);
    if (!path) break;
    let walked = true;
    for (const id of path) {
      if (!model.moveTo(memberId, id).ok) {
        walked = false;
        break;
      }
      steps++;
    }
    const here = model.gridFor(memberId)!.position;
    if (!walked || !model.activate(memberId, here).ok) break;
    activated.push(here);
    const node = NODE_BY_ID.get(here);
    if (node?.kind === 'ability') learned.push(node.name);
  }

  if (!activated.length) {
    restoreGrid(model, snapshot);
    return null;
  }
  const pouch = model.build.sphereInventory;
  const spent = SPHERE_ORDER.map((family) => {
    const id = `${family}-sphere`;
    return { label: sphereLabel(family).replace(/ Sphere$/, ''), count: (snapshot.pouch[id] ?? 0) - (pouch[id] ?? 0) };
  }).filter((s) => s.count > 0);
  const gains = GAIN_ORDER.filter(([f]) => member.stats[f] !== snapshot.stats[f]).map(([f, label]) => ({
    label,
    before: snapshot.stats[f],
    after: member.stats[f],
  }));
  return {
    memberId,
    name: member.name,
    activated,
    steps,
    sLvBefore: snapshot.sLv,
    sLvAfter: member.sphereGrid.sLv,
    spent,
    gains,
    learned,
    snapshot,
  };
}
