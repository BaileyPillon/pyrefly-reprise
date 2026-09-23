/**
 * **How a beaten enemy leaves the field: the presenter's departure kinds.**
 *
 * Until now every enemy KO was the same beat: the fiend comes apart into
 * pyreflies and is sent (`ko()` in `BattlePresenterBeats.ts`). That is right
 * for fiends and wrong for two kinds of opponent the chapters now carry:
 *
 * - **`'falls-away'`, Evrae (FFX only; Bailey D-031, "yes Evrae falls out of
 *   the sky").** `research/ffx-evrae-airship.md` §12.5 beat 8 (line 889):
 *   "Evrae breaks and falls out of the sky, down through the cloud layer, gone.
 *   Not sent, not killed on screen". The creature lurches, then drops and
 *   recedes below the deck's edge. The cloud veil that passes over it is the
 *   scene's (`src/scenes/evrae-airship-fall.ts`, driven by the range director),
 *   because clouds are the location's, not the presenter's.
 * - **`'yields'`, Leblanc, Logos and Ormi (FFX-2 only; Bailey D-035).**
 *   `docs/plans/art-method-r3/METHOD-CHECK.md` §4 Decision 2: "the beaten figure
 *   stays standing in its hurt (or idle) plane, dims, and steps back out of
 *   frame". The source for why: `research/ffx2-leblanc-syndicate.md` §10 beat
 *   10 (line 762), "They lose and flee to warn Leblanc": living people who walk
 *   off, not fiends who are sent. Every act's copy of Logos and Ormi is listed
 *   (the act rosters, `src/data/ffx2/enemies/leblanc-syndicate-acts.ts`); the
 *   Goons are rank and file and keep the dissolve, as the decision names only
 *   the three.
 *
 * Everything else keeps `'dissolve'`. The kind is a presenter-side table keyed
 * by combatant id (an enemy's combatant id is its `EnemyDef.id`,
 * `src/battle/ffx2/setup.ts` `buildEnemy`), not an enemy-data field: it is a
 * presentation choice with no engine meaning, so no shared contract widens.
 *
 * **The budget.** Both departures are longer than the 620 ms dissolve (a fall
 * that took 620 ms would read as a blink), but the whole departure runs under
 * one guard sized to its full length ({@link departureMs}), so
 * the victory event queued behind the last KO is never held for more than the
 * animation plus one `ACTOR_ANIM_GRACE_MS`: the critic round 02 #01 rule (see
 * `ko()`). One deadline, not one per step: per-step guards let a hung fall hold
 * victory about 5.5 s against 2.6 s for a hung dissolve (fix10c verifier).
 *
 * Same rules as the other beat modules: no `three`, no DOM, ports only.
 * Game case per kind is above; the table and the dispatch are shared plumbing
 * (both games).
 */

import type { CombatantId } from '../battle/common/types.ts';
import type { ActorHandle, Point3 } from './BattlePresenterPorts.ts';
import { ACTOR_ANIM_GRACE_MS, type EventCtx } from './BattlePresenterEvents.ts';

export type DepartureKind = 'dissolve' | 'falls-away' | 'yields';

/** Who leaves the field some other way than being sent. Keyed by combatant id. */
export const DEPARTURE_KINDS: Readonly<Partial<Record<CombatantId, DepartureKind>>> = {
  // FFX, Chapter VIII: D-031, research/ffx-evrae-airship.md line 889.
  evrae: 'falls-away',
  // FFX-2, Chapter VI: D-035, research/ffx2-leblanc-syndicate.md line 762.
  leblanc: 'yields',
  logos: 'yields',
  ormi: 'yields',
  'ormi-entrance': 'yields',
  'ormi-logos-room': 'yields',
  'logos-room': 'yields',
};

export function departureKindOf(id: CombatantId): DepartureKind {
  return DEPARTURE_KINDS[id] ?? 'dissolve';
}

/**
 * The fall, in milliseconds at timeScale 1: a lurch as it breaks, then the
 * drop: two KO beats (`TIMING.ko` 620) end to end, so the anticlimax has time
 * to read. Literals, not `TIMING.ko * 2`: this module and
 * `BattlePresenterEvents.ts` import each other (through the beats), and a
 * module-level read of `TIMING` here would run before it is initialised.
 */
export const FALL_MS = { lurch: 220, drop: 1240 } as const;
/** How far the fall carries Evrae, world units: down past the deck's edge and away. */
export const FALL_OFFSET = { x: 0.8, y: -7.5, z: -5 } as const;
/**
 * How much of its size Evrae keeps by the time it is gone (research
 * `ffx-evrae-airship.md` line 889: "a shape getting smaller"). Chapter VIII
 * e2e (commit 7119762f) caught the fall keeping full size the whole way down
 * — this is what the six-frame capture now shows shrinking instead.
 */
export const FALL_SHRINK_TO = 0.22;
/** Steps the shrink is quantised to, spread evenly across {@link FALL_MS}.drop. */
const FALL_SHRINK_STEPS = 12;

/** Yielding, in milliseconds at timeScale 1: the dim, then the step back. */
export const YIELD_MS = { dim: 360, step: 1000 } as const;
/** How dim a yielding figure gets before it steps back (brightness multiplier). */
export const YIELD_DIM = 0.45;
/** The step back, world units: away from the party and deeper into the room. */
export const YIELD_STEP = { x: 3.2, z: -2.4 } as const;

const at = (p: Point3): Point3 => ({ x: p.x, y: p.y, z: p.z });

/**
 * One guard for a whole departure: every actor animation in the beat races the
 * same deadline (its full length plus `ACTOR_ANIM_GRACE_MS`), and once that has
 * passed the beat's own pauses collapse, so a hung animation holds the victory
 * behind the KO for one grace, not one per step. At `speed: 'skip'` the
 * deadline is 0 and the beat runs straight through, as the dissolve does.
 */
function budget(ctx: EventCtx, ms: number) {
  let expired = false;
  let warned = false;
  const startedAt = Date.now();
  const deadline = ctx.sleep(ms + ACTOR_ANIM_GRACE_MS).then(() => {
    expired = true;
  });
  const overran = (): void => {
    if (warned || Date.now() - startedAt < 50) return;
    warned = true;
    console.warn(`[presenter] a departure did not finish within ${ms + ACTOR_ANIM_GRACE_MS}ms; carrying on`);
  };
  return {
    guard: async (p: void | Promise<void>): Promise<void> => {
      if (!p || expired) return;
      const won = await Promise.race([p.then(() => true), deadline.then(() => false)]);
      if (!won) overran();
    },
    sleep: (wait: number): Promise<void> => (expired ? Promise.resolve() : Promise.race([ctx.sleep(wait), deadline])),
  };
}
type Budget = ReturnType<typeof budget>;

/**
 * `actor`'s uniform scale, read structurally so this file stays on the
 * headless side of the `three` line [AGENTS.md hard rule 1] — the same trick
 * `evrae-airship-director.ts#rimOf` uses to reach a `PaintedActor` field
 * `ActorHandle` does not declare. `null` for a fake/test handle with none.
 */
function scaleOf(actor: ActorHandle): { x: number; setScalar(v: number): void } | null {
  return (actor as unknown as { scale?: { x: number; setScalar(v: number): void } }).scale ?? null;
}

/**
 * Shrink `actor` toward {@link FALL_SHRINK_TO} of its starting size, in
 * {@link FALL_SHRINK_STEPS} steps spread over `ms` — "a shape getting
 * smaller" (`research/ffx-evrae-airship.md` line 889), run alongside the drop
 * rather than after it. Every wait is `b.sleep`, which already races the
 * departure's own deadline, so a hung shrink cannot hold the beat past what
 * `moveTo`/`fadeTo` already guard for.
 */
async function shrinkFall(actor: ActorHandle, ms: number, b: Budget): Promise<void> {
  const scale = scaleOf(actor);
  if (!scale) return;
  const start = scale.x || 1;
  for (let i = 1; i <= FALL_SHRINK_STEPS; i++) {
    const t = i / FALL_SHRINK_STEPS;
    scale.setScalar(start * (1 - t * (1 - FALL_SHRINK_TO)));
    await b.sleep(ms / FALL_SHRINK_STEPS);
  }
}

/** Evrae breaks, then falls out of the sky: down and away, fading as it goes. */
async function fallsAway(actor: ActorHandle, b: Budget): Promise<void> {
  const from = at(actor.position);
  actor.setPose('hurt', { force: true });
  actor.shake(0.22, FALL_MS.lurch + 120);
  actor.flash(0x8a8f9c, FALL_MS.lurch + 160, 0.55);
  await b.guard(actor.moveTo({ x: from.x, y: from.y + 0.35, z: from.z }, FALL_MS.lurch));
  const to = { x: from.x + FALL_OFFSET.x, y: from.y + FALL_OFFSET.y, z: from.z + FALL_OFFSET.z };
  const drop = actor.moveTo(to, FALL_MS.drop);
  // The last third fades, so it is gone even where no deck edge or cloud covers it.
  const fade = (async () => {
    await b.sleep(FALL_MS.drop * 0.62);
    await b.guard(actor.fadeTo(0, FALL_MS.drop * 0.38));
  })();
  const shrink = shrinkFall(actor, FALL_MS.drop, b);
  await Promise.all([b.guard(drop), fade, shrink]);
}

/** Where the party stands, on average, or `null` with nobody staged. */
function partyCentre(ctx: EventCtx): Point3 | null {
  let n = 0;
  const c = { x: 0, y: 0, z: 0 };
  for (const id of ctx.stage.staged()) {
    if (ctx.stage.sideOf(id) !== 'party') continue;
    const p = ctx.stage.actor(id)?.position;
    if (!p) continue;
    c.x += p.x;
    c.z += p.z;
    n++;
  }
  return n ? { x: c.x / n, y: 0, z: c.z / n } : null;
}

/** A living opponent gives up: stays on its feet, dims, and steps back out of frame. */
async function yields(ctx: EventCtx, actor: ActorHandle, b: Budget): Promise<void> {
  const from = at(actor.position);
  actor.setPose('idle', { force: true });
  const steps = 6;
  for (let i = 1; i <= steps; i++) {
    actor.setBrightness(1 - (1 - YIELD_DIM) * (i / steps));
    await b.sleep(YIELD_MS.dim / steps);
  }
  const party = partyCentre(ctx);
  const sx = party && from.x < party.x ? -1 : 1;
  const to = { x: from.x + sx * YIELD_STEP.x, y: from.y, z: from.z + YIELD_STEP.z };
  await Promise.all([b.guard(actor.moveTo(to, YIELD_MS.step)), b.guard(actor.fadeTo(0, YIELD_MS.step))]);
}

/**
 * Play `id`'s departure, if it has one other than the dissolve. Resolves
 * `false` for `'dissolve'` (the caller plays the send), `true` once a
 * falls-away or yields beat has finished (the caller removes the combatant).
 */
export async function depart(ctx: EventCtx, id: CombatantId, actor: ActorHandle | undefined): Promise<boolean> {
  const kind = departureKindOf(id);
  if (kind === 'dissolve') return false;
  if (!actor) return true;
  const b = budget(ctx, departureMs(kind));
  if (kind === 'falls-away') await fallsAway(actor, b);
  else await yields(ctx, actor, b);
  return true;
}

/** A departure's full length at timeScale 1, the outer guard's budget. */
export function departureMs(kind: Exclude<DepartureKind, 'dissolve'>): number {
  return kind === 'falls-away' ? FALL_MS.lurch + FALL_MS.drop : YIELD_MS.dim + YIELD_MS.step;
}
