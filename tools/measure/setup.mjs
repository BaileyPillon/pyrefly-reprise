// A card's SETUP: what is done to the game once the first command menu is open and before the clock is paused (motion-fluidity pass, lane L5; both games, tooling; review M5 and round 2 R2-M3).
//
// The plan's clips need states the first turn does not give: a boss at a sliver of hit points so the first blow is its last (CP-06), a party member at 1 HP under the enemy's next strike (CP-06b), a debug-API
// call that stages a beat the routes never reach (CP-13). A spec lists steps, run in order, the same for every variant, and the result is written into the capture's `rec.json` (`setup`), so a clip never
// hides that the game's state was touched:
//   { "hp": { "who": W, "set": 1 } }  or  { "hp": { "who": W, "fraction": 0.05 } }     a figure's hit points (`fraction` of its maximum, at least 1)
//   { "quiet": W }                                                                      mark the chapter's own hit-point-threshold scripts about W as already played (see below)
//   { "eval": "window.__pyrefly.trigger('...')" }                                       one expression through the page's debug API
// W (who) is "party" (the party's side only), "enemy" (every enemy: the boss AND its guardians, never the aeons), "boss" (the one enemy with the most hit points), "aeon" (the summon reserve), or a figure id
// ("seymour-flux"). REVIEW ROUND 2 (R2-M3): `enemy` used to be "everyone not on the party's side", which set five of the party's own aeons to 2 percent of their hit points as well.
// `hp` writes the combatant's `hp` in the live battle state the debug API hands out (the way the whole-fight play heals the party); `quiet` pushes the ids of the `hp-below` triggers about W into the state's
// `firedTriggerIds`, which is what a `once` trigger does itself when it fires (src/battle/ffx/triggers.ts): LOWERING a boss below a threshold otherwise runs the chapter's own script at the next action (Chapter I:
// `seymour-half`, a scripted exchange that held the menu for 15 s). Nothing else is written.
// A step that cannot do what it says LEAVES A WARNING in its result (no figure matched; a `fraction` that leaves more hit points than one blow takes: Chapter I's first blow is 778, the figure is 70,000, so
// `fraction: 0.02` is 1,400 and the first blow is not the last), and tools/ab-clip.mjs prints it and writes it to the card's KEY.json.

/** About what one blow takes in these chapters (Chapter I: 778): a `fraction` that leaves a figure above this is not a sliver. A WARNING level, not a rule. */
export const SLIVER_HP = 1000;

/** In the page: set hit points on the matching combatants; returns what it set (and the maximum, the side). */
const SET_HP = (a) => {
  const q = window.__pyrefly.battleState();
  const l = Array.isArray(q.combatants) ? q.combatants : Object.values(q.combatants);
  const enemies = l.filter((c) => c.side === 'enemy' && c.stats);
  const boss = enemies.reduce((m, c) => (!m || c.stats.maxHp > m.stats.maxHp ? c : m), null);
  const done = [];
  for (const c of l) {
    const match = a.who === 'party' ? c.side === 'party' : a.who === 'enemy' ? c.side === 'enemy' : a.who === 'aeon' ? c.side === 'aeon' : a.who === 'boss' ? c === boss : c.id === a.who;
    if (!match || !c.stats) continue;
    c.hp = Number.isFinite(a.set) ? Math.max(1, Math.min(a.set, c.stats.maxHp)) : Math.max(1, Math.round(c.stats.maxHp * a.fraction));
    done.push({ id: c.id, side: c.side, hp: c.hp, maxHp: c.stats.maxHp });
  }
  return done;
};

/** In the page: mark the `hp-below` triggers about the matching figures as fired; returns their ids. */
const QUIET = (who) => {
  const s = window.__pyrefly.battleState();
  const l = Array.isArray(s.combatants) ? s.combatants : Object.values(s.combatants);
  const enemies = l.filter((c) => c.side === 'enemy' && c.stats);
  const boss = enemies.reduce((m, c) => (!m || c.stats.maxHp > m.stats.maxHp ? c : m), null);
  const ids = new Set(l.filter((c) => (who === 'party' ? c.side === 'party' : who === 'enemy' ? c.side === 'enemy' : who === 'aeon' ? c.side === 'aeon' : who === 'boss' ? c === boss : c.id === who)).map((c) => c.id));
  const fired = [];
  for (const t of s.triggers ?? []) {
    if (t.when?.type === 'hp-below' && ids.has(t.when.who) && !(s.firedTriggerIds ?? []).includes(t.id)) { s.firedTriggerIds.push(t.id); fired.push(t.id); }
  }
  return { figures: [...ids], fired };
};

/** What is wrong with the result of an `hp` step (empty: nothing). Pure. */
export function hpWarnings(step, result) {
  const w = [];
  if (!Array.isArray(result) || !result.length) return [`hp: "${step.who}" matched no figure (a figure id, "party", "enemy", "boss" or "aeon"; "enemy" is the enemy side only)`];
  if (step.fraction !== undefined) for (const r of result) if (r.hp > SLIVER_HP) w.push(`hp: ${r.id} is left at ${r.hp} of ${r.maxHp} hit points; one blow takes about ${SLIVER_HP} here (Chapter I: 778), so the first blow is not its last: use { "set": 1 } for a sliver`);
  return w;
}

/**
 * Run a card's setup steps on a page that has the first command menu open.
 * @param {any} page
 * @param {Array<{hp?: {who: string, set?: number, fraction?: number}, quiet?: string, eval?: string}>|undefined} steps
 * @returns {Promise<Array<{step: object, result: unknown, warnings: string[]}>>}
 */
export async function applySetup(page, steps) {
  const out = [];
  for (const step of steps ?? []) {
    if (step.hp) { const result = await page.evaluate(SET_HP, step.hp); out.push({ step, result, warnings: hpWarnings(step.hp, result) }); }
    else if (typeof step.quiet === 'string') {
      const result = await page.evaluate(QUIET, step.quiet);
      out.push({ step, result, warnings: result.figures.length ? [] : [`quiet: "${step.quiet}" matched no figure`] });
    } else if (typeof step.eval === 'string') out.push({ step, result: (await page.evaluate(step.eval)) ?? null, warnings: [] });
  }
  return out;
}
