// A card's SETUP: what is done to the game once the first command menu is open and before the clock is paused (motion-fluidity pass, lane L5; both games, tooling; review M5).
//
// The plan's clips need states the first turn does not give: a boss at a sliver of hit points so the first blow is its last (CP-06), a party member at 1 HP under the enemy's next strike (CP-06b), a debug-API
// call that stages a beat the routes never reach (CP-13). A spec lists steps, run in order, the same for every variant, and the result is written into the capture's `rec.json` (`setup`), so a clip never
// hides that the game's state was touched:
//   { "hp": { "who": "enemy" | "party" | "<figure id>", "set": 1 }  or  { "hp": { "who": ..., "fraction": 0.05 } }   a figure's hit points (a fraction of its maximum, at least 1)
//   { "eval": "window.__pyrefly.trigger('...')" }                                                                 one expression through the page's debug API
// `hp` writes the combatant's `hp` in the battle state the debug API hands out (the way the whole-fight play heals the party); nothing else is written.

/** In the page: set hit points on the matching combatants; returns the ids it set. */
const SET_HP = (a) => {
  const q = window.__pyrefly.battleState();
  const l = Array.isArray(q.combatants) ? q.combatants : Object.values(q.combatants);
  const done = [];
  for (const c of l) {
    const match = a.who === 'party' ? c.side === 'party' : a.who === 'enemy' ? c.side !== 'party' : c.id === a.who;
    if (!match || !c.stats) continue;
    c.hp = Number.isFinite(a.set) ? a.set : Math.max(1, Math.round(c.stats.maxHp * a.fraction));
    done.push({ id: c.id, hp: c.hp });
  }
  return done;
};

/**
 * Run a card's setup steps on a page that has the first command menu open.
 * @param {any} page
 * @param {Array<{hp?: {who: string, set?: number, fraction?: number}, eval?: string}>|undefined} steps
 * @returns {Promise<Array<{step: object, result: unknown}>>}
 */
export async function applySetup(page, steps) {
  const out = [];
  for (const step of steps ?? []) {
    if (step.hp) out.push({ step, result: await page.evaluate(SET_HP, step.hp) });
    else if (typeof step.eval === 'string') out.push({ step, result: await page.evaluate(step.eval) ?? null });
  }
  return out;
}
