/**
 * **Routes for the shot table** (FFX only; `tools/ffxcam-table-build.mjs` uses it): from the recorded beats (one record per ability, actor, slot, target kind and range, each with its branches already
 * turned into shot ids) to the table's `rows` and `routes`. Pure, so `tests/unit/ffxcam-table-routes.test.ts` runs it on made-up records.
 *
 * - **A cell** is one context: `<range><slot><target>` (`n0e`: near, slot 0, Evrae targeted). Its value is the branches `[shot, weight]` of the beat in that context.
 * - **One record per cell.** An ability several characters have (Use, Flee...) is recorded for each; the cell keeps the one by the slot's own occupant when there is one, else the first.
 * - **Collapsing.** A dimension a route does not depend on becomes `*`: the target first, then the slot, then the range; each only when every value the route was recorded for gives the same
 *   branches. A route recorded for one kind of target only collapses it, so a context nobody recorded still finds the shot (the table director tries the exact cell, then each `*` form).
 * - **Routes are shared.** Abilities whose cells come out the same share one route id.
 *
 * Game case: FFX only.
 */

const ACTIVE = ['tidus', 'wakka', 'rikku'];

/** `[['a', 3], ['b', 1]]` as one string, for comparing. */
const signature = (branches) => branches.map(([s, w]) => `${s}:${w}`).join('|');

/** Merge branches that name the same shot and order them by shot id. */
export function mergeBranches(list) {
  const by = new Map();
  for (const [shot, w] of list) by.set(shot, (by.get(shot) ?? 0) + w);
  return [...by.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).map(([s, w]) => [s, w]);
}

/** The records of one (row, phase) reduced to one per cell. `records` carry `{ actor, slot, tgt, range, branches }`. */
export function cellsOf(records) {
  const chosen = new Map();
  for (const r of records) {
    const cell = `${r.range}${r.slot}${r.tgt}`;
    const have = chosen.get(cell);
    const own = typeof r.slot === 'number' && r.actor === ACTIVE[r.slot];
    if (!have || (own && !have.own)) chosen.set(cell, { branches: mergeBranches(r.branches), own });
  }
  return new Map([...chosen].map(([cell, v]) => [cell, v.branches]));
}

/** The cell keys the table director tries for a context, in its order (`src/engine/ffxcam/tableRoutes.ts`'s `cellOf`): the exact one, then each form with a `*` for what the route does not depend on. */
export const lookupOrder = (r, s, t) => [`${r}${s}${t}`, `${r}${s}*`, `${r}*${t}`, `*${s}${t}`, `${r}**`, `*${s}*`, `**${t}`, '***'];

/** The branches a context finds in `cells` (a plain object or a Map), as the director would find them. */
export function resolve(cells, r, s, t) {
  const get = cells instanceof Map ? (k) => cells.get(k) : (k) => (Object.hasOwn(cells, k) ? cells[k] : undefined);
  for (const k of lookupOrder(r, s, t)) {
    const found = get(k);
    if (found) return found;
  }
  return undefined;
}

/**
 * Collapse the dimensions a route does not depend on. `cells` is a Map of cell key to branches; the result is a plain object with `*` in the collapsed positions. The target is the tail of the
 * key (one or two characters after range and slot).
 *
 * **A collapse is kept only if every recorded cell still finds its own branches** under the director's lookup order (`lookupOrder`). Without that a group that was alone on a dimension (the FAR cells of a
 * route that was already merged over its slots) could collapse into a `*` cell that a more specific cell of the other group then shadowed: the near shots would play at FAR. A recorded cell that
 * would find something else keeps its cells as they were.
 */
export function collapse(cells) {
  const original = [...cells].map(([k, b]) => ({ range: k[0], slot: k[1], tgt: k.slice(2), sig: signature(b) }));
  let rows = [...cells].map(([k, b]) => ({ range: k[0], slot: k[1], tgt: k.slice(2), b }));
  const holds = (candidate) => {
    const map = new Map(candidate.map((r) => [`${r.range}${r.slot}${r.tgt}`, signature(r.b)]));
    return original.every((o) => {
      for (const k of lookupOrder(o.range, o.slot, o.tgt)) if (map.has(k)) return map.get(k) === o.sig;
      return false;
    });
  };
  for (const dim of ['tgt', 'slot', 'range']) {
    const others = (r) => (dim === 'tgt' ? `${r.range}${r.slot}` : dim === 'slot' ? `${r.range}|${r.tgt}` : `${r.slot}|${r.tgt}`);
    const groups = new Map();
    for (const r of rows) (groups.get(others(r)) ?? groups.set(others(r), []).get(others(r))).push(r);
    for (const g of groups.values()) {
      const first = g[0];
      if (!g.every((r) => signature(r.b) === signature(first.b))) continue;
      const trial = [...rows.filter((r) => !g.includes(r)), { ...first, [dim]: '*' }];
      if (holds(trial)) rows = trial;
    }
  }
  return Object.fromEntries(rows.sort((a, b) => `${a.range}${a.slot}${a.tgt}`.localeCompare(`${b.range}${b.slot}${b.tgt}`)).map((r) => [`${r.range}${r.slot}${r.tgt}`, r.b]));
}

/** True when a route does nothing: every cell leaves the camera as it is. */
export const isNoop = (cells) => Object.values(cells).every((b) => b.every(([s]) => s === ''));

/**
 * The table's `rows` and `routes` from the recorded beats. `beats` is a list of `{ phase: 'open' | 'launch', row, actor, slot, tgt, range, branches }`.
 */
export function buildRows(beats) {
  const byRow = new Map();
  for (const b of beats) {
    if (b.phase !== 'open' && b.phase !== 'launch') continue;
    const entry = byRow.get(b.row) ?? byRow.set(b.row, { open: [], launch: [] }).get(b.row);
    entry[b.phase].push(b);
  }
  const routes = {};
  const idOf = new Map();
  const rows = {};
  for (const row of [...byRow.keys()].sort()) {
    const entry = byRow.get(row);
    const out = {};
    for (const phase of ['open', 'launch']) {
      if (entry[phase].length === 0) continue;
      const recorded = cellsOf(entry[phase]);
      const cells = collapse(recorded);
      for (const [k, b] of recorded) {
        const got = resolve(cells, k[0], k[1], k.slice(2));
        if (!got || JSON.stringify(got) !== JSON.stringify(b)) throw new Error(`${row} ${phase}: the cell ${k} would find ${JSON.stringify(got)}, not ${JSON.stringify(b)}`);
      }
      if (isNoop(cells)) continue;
      const sig = JSON.stringify(cells);
      if (!idOf.has(sig)) {
        const id = `r${String(idOf.size + 1).padStart(3, '0')}`;
        idOf.set(sig, id);
        routes[id] = cells;
      }
      out[phase] = idOf.get(sig);
    }
    if (out.open || out.launch) rows[row] = out;
  }
  return { rows, routes };
}
