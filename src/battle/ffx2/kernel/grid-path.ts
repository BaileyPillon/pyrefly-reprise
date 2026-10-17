/**
 * FFX-2 Garment Grid layout rules: which dressphere node a girl can move to, which gate a move crosses, and what the commit of a move marks.
 *
 * **Game case: FFX-2 only** (FFX has no garment grids).  Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69); note `FFX2-G09` sections
 * 2, 3.2 to 3.4 and 4.  Pure, deterministic, no DOM, no engine types, no random draw (the grid rules draw nothing: G09 summary 11).
 *
 * Exe addresses (live build):
 * - 0x005eb2a0  gate number of a node (0 = a dressphere node)
 * - 0x005eb920  every dressphere node worn;  0x005eb7d0  which gates (1 to 4) and whether every gate node has been crossed
 * - 0x005eb080  the path finder: a direct join, or a route through exactly one gate node
 * - 0x005f51a0  the commit of a move (modes 0, 1, 2);  the gate abilities it then re-evaluates are `spherechange.ts#gateSlotsAfter`
 *
 * A grid is a list of nodes (a dressphere node has gate 0, a gate node has a gate number 1 to 4 and sits on its own between two dressphere nodes) and a
 * list of links (link id k joins the two nodes `links[k]`).  The card stores eight neighbour slots per node in ascending link id (checked on all 64 cards),
 * which is the order the path finder reads them in.  Visited nodes are a bit mask (bit i: node i), crossed links a bit mask (bit k: link k); the cards
 * hold at most 10 nodes and 13 links, so plain numbers hold both.  What this file does NOT cover, on purpose: the reach marking and the "selectable"
 * test (the grid scene's cursor, G09 section 2), the lit marks (the wheel's), and the Special form (X2-J).
 */

/** A grid as the cards hold it: `nodes[i] = [gate, x, y]` and `links[k] = [a, b]`.  `x` and `y` are drawing positions; no rule here reads them. */
export interface Ffx2GridLayout {
  readonly nodes: ReadonlyArray<readonly [gate: number, x: number, y: number]>;
  readonly links: ReadonlyArray<readonly [a: number, b: number]>;
}

type Slot = readonly [node: number, link: number];

const SLOTS = new WeakMap<Ffx2GridLayout, ReadonlyArray<readonly Slot[]>>();

/** Each node's neighbour slots, `[neighbour, link id]`, in ascending link id (the card's order). */
function slotsOf(layout: Ffx2GridLayout): ReadonlyArray<readonly Slot[]> {
  const cached = SLOTS.get(layout);
  if (cached) return cached;
  const out: Slot[][] = layout.nodes.map(() => []);
  layout.links.forEach(([a, b], k) => {
    out[a]?.push([b, k]);
    out[b]?.push([a, k]);
  });
  SLOTS.set(layout, out);
  return out;
}

/** The gate number of a node: 0 for a dressphere node and for a node the grid does not have (exe 0x005eb2a0). */
export function gateNumber(layout: Ffx2GridLayout, node: number): number {
  return layout.nodes[node]?.[0] ?? 0;
}

/** The dressphere nodes of a grid in the card's order (the engine numbers them along a ring instead: {@link ringOrder}). */
export function dressNodes(layout: Ffx2GridLayout): number[] {
  const out: number[] = [];
  layout.nodes.forEach(([gate], i) => {
    if (gate === 0) out.push(i);
  });
  return out;
}

const visitedBit = (visited: number, node: number): boolean => node >= 0 && node < 32 && ((visited >>> node) & 1) === 1;

/** Has every dressphere node been visited (exe 0x005eb920)?  Gate nodes and bits past the grid's nodes are ignored. */
export function allDressNodesVisited(layout: Ffx2GridLayout, visited: number): boolean {
  return layout.nodes.every(([gate], i) => gate !== 0 || visitedBit(visited, i));
}

/** Which gates (number 1 to 4 = index 0 to 3) have been crossed, and whether every gate node of the grid has been (exe 0x005eb7d0).  A gate is crossed when its node is visited. */
export function gateState(layout: Ffx2GridLayout, visited: number): { gates: [boolean, boolean, boolean, boolean]; allGates: boolean } {
  const gates: [boolean, boolean, boolean, boolean] = [false, false, false, false];
  let allGates = true;
  layout.nodes.forEach(([gate], i) => {
    if (gate === 0) return;
    if (visitedBit(visited, i)) {
      if (gate >= 1 && gate <= 4) gates[gate - 1] = true;
    } else allGates = false;
  });
  return { gates, allGates };
}

/** The path finder's answer (exe 0x005eb080).  `kind` 0 none, 1 direct, 2 through one gate node; `path` is `[from, gate node or destination, destination or -1]`, `links` the link ids crossed (-1 for none). */
export interface Ffx2GridPath {
  readonly kind: 0 | 1 | 2;
  readonly path: readonly [number, number, number];
  readonly links: readonly [number, number];
}

/**
 * The path finder (exe 0x005eb080), from node `from` to node `to`: first A's neighbour slots in order for `to` itself (direct); else, for each neighbour of A that is a
 * gate node, B's slots for that same node (through that gate).  Anything else is no path.  It does not check that `to` is a dressphere node (the grid scene never offers a gate
 * node), and a node to itself answers "through a gate" when it has a gate neighbour, exactly as the game's does (`FFX2-G09` 3.2).
 */
export function findPath(layout: Ffx2GridLayout, from: number, to: number): Ffx2GridPath {
  const slots = slotsOf(layout);
  const mine = slots[from];
  const none: Ffx2GridPath = { kind: 0, path: [from, -1, -1], links: [-1, -1] };
  if (!mine || !slots[to]) return none;
  for (const [node, link] of mine) if (node === to) return { kind: 1, path: [from, to, -1], links: [link, -1] };
  for (const [gate, link] of mine) {
    if (gateNumber(layout, gate) === 0) continue;
    for (const [node, theirs] of slots[to] ?? []) if (node === gate) return { kind: 2, path: [from, gate, to], links: [link, theirs] };
  }
  return none;
}

/** One pair of dressphere nodes a move can join (`a` < `b`, card node ids), and the gate node it passes (`null`: a direct join). */
export interface Ffx2GridMove {
  readonly a: number;
  readonly b: number;
  readonly gateNode: number | null;
}

/**
 * Every pair of dressphere nodes a move can use, in ascending (a, b), each with the gate node it crosses: the path finder over all unordered pairs of dressphere nodes.  The game's
 * relation is symmetric and a pair is never both direct and through a gate (checked on all 64 cards), so one direction answers for both.
 */
export function movePairs(layout: Ffx2GridLayout): Ffx2GridMove[] {
  const dress = dressNodes(layout);
  const out: Ffx2GridMove[] = [];
  for (const a of dress) {
    for (const b of dress) {
      if (b <= a) continue;
      const p = findPath(layout, a, b);
      if (p.kind === 1) out.push({ a, b, gateNode: null });
      else if (p.kind === 2) out.push({ a, b, gateNode: p.path[1] });
    }
  }
  return out;
}

/**
 * The order the engine numbers a grid's dressphere nodes in (card node ids): **along a ring through all of them**, each joined to the next by a move and the last to the first, starting at the
 * card's first dressphere node and taking the lowest card node at every step.  A grid of one or two nodes, and a grid with no such ring, keep the card's order.
 *
 * This is OUR numbering, not the game's: the game numbers nodes as the card does, has no "node 0", and leaves it to the player to put a dressphere on each node.  The shipped builds place their
 * dresspheres for a ring (node i beside node i+1, node 0 beside the last: `setup.ts#gridNodeContents`), and a ring through the real grid keeps every join they were written for: the real grid has
 * the joins of that ring and more (a hub, a direct join), never fewer.  62 of the 64 cards have such a ring, every grid our data covers among them; plates 33 and 63, which our data does not name, have none
 * and keep the card's order (`parity-ffx2-grid-path.test.ts`).
 */
export function ringOrder(layout: Ffx2GridLayout): number[] {
  const dress = dressNodes(layout);
  const first = dress[0];
  if (first === undefined || dress.length <= 2) return dress;
  const next = new Map<number, number[]>(dress.map((n) => [n, []]));
  for (const { a, b } of movePairs(layout)) {
    next.get(a)?.push(b);
    next.get(b)?.push(a);
  }
  for (const list of next.values()) list.sort((x, y) => x - y);
  const path: number[] = [first];
  const walk = (): boolean => {
    const last = path[path.length - 1] ?? first;
    if (path.length === dress.length) return (next.get(last) ?? []).includes(first);
    for (const n of next.get(last) ?? []) {
      if (path.includes(n)) continue;
      path.push(n);
      if (walk()) return true;
      path.pop();
    }
    return false;
  };
  return walk() ? path : dress;
}

/** A girl's walk on one grid: the node she stands on, the nodes she has visited and the links she has crossed (bit masks), in this battle. */
export interface Ffx2GridWalk {
  readonly cur: number;
  readonly visited: number;
  readonly crossed: number;
}

/** The pending-change record the commit reads: `[mode, dress, destination, link 1, link 2, origin, node 1, node 2]` (-1: none). */
export type Ffx2MoveRecord = readonly [mode: number, dress: number, node: number, link1: number, link2: number, from: number, node1: number, node2: number];

/**
 * The record of an ordinary move (mode 0) along a path.  The scene's own builder is read, not run (`FFX2-G09` 3.4): a direct path carries the destination as node 1 and -1 as
 * node 2, a path through a gate carries the gate node and then the destination.  Both are marked visited by the commit, so the gate is crossed when the move lands.
 */
export function moveRecord(path: Ffx2GridPath, dress: number): Ffx2MoveRecord {
  return [0, dress, path.path[2] === -1 ? path.path[1] : path.path[2], path.links[0], path.links[1], path.path[0], path.path[1], path.path[2]];
}

/**
 * The commit of a move (exe 0x005f51a0): mode 0 stands her on the destination, marks the link or links crossed and the node or nodes of the route as visited; mode 1 (entering a Special)
 * wipes her walk (every visited node, every crossed link) and does not move her; mode 2 (leaving a Special) does nothing.  The gate abilities are re-evaluated after a mode 0 by the
 * caller (`spherechange.ts#gateSlotsAfter`); a mode 1 also empties her eight gate-ability slots.
 */
export function commitMove(walk: Ffx2GridWalk, rec: Ffx2MoveRecord): Ffx2GridWalk {
  const [mode, , node, link1, link2, , node1, node2] = rec;
  if (mode === 2) return walk;
  if (mode === 1) return { cur: walk.cur, visited: 0, crossed: 0 };
  let visited = walk.visited | (1 << node1);
  let crossed = walk.crossed | (1 << link1);
  if (node2 !== -1) visited |= 1 << node2;
  if (link2 !== -1) crossed |= 1 << link2;
  return { cur: node, visited: visited >>> 0, crossed: crossed >>> 0 };
}
