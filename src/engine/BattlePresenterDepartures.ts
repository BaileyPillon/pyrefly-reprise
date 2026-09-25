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
 * - **`'dismissed'`, Yojimbo with Daigoro (FFX only; Bailey D-076).** An aeon
 *   is recalled, not killed: the idles dim and rise away together, no
 *   pyreflies. **Our reading**: no source describes how Yojimbo leaves
 *   (`docs/concepts/chapters/yojimbo/decisions/README.md`); the class is
 *   Anima's row, "present the departure as a recall, not a death"
 *   (`research/ffx-vs-ffx2-presentation.md` §3.2). `BattlePresenterRecall.ts`.
 * - **`'held'`, Paragon and Trema (FFX-2 only; Chapter XIII, O-2 yes).** Beaten, and left
 *   standing: `research/ffx2-trema.md` §2 step 2, Paragon falls and Trema "destroys Paragon"
 *   himself (the Cloister 100 scene plays that, `src/scenes/cloister-100-link.ts`); step 4,
 *   Trema is beaten, answers Yuna, and "fades away" (the post scene). Neither is sent at the
 *   blow: the figure takes its standing painting, dims, and stays.
 * - **`'returns'`, Mortibody (FFX only; Chapter X, O-2 A).** Sent like a fiend but kept on the
 *   stage until Mortibsorption's heal brings it back (`BattlePresenterReturns.ts`, the sources).
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
import { RECALL_MS, recall } from './BattlePresenterRecall.ts';
import { RETURN_MS, sendToReturn } from './BattlePresenterReturns.ts';

export type DepartureKind = 'dissolve' | 'falls-away' | 'yields' | 'body' | 'dismissed' | 'held' | 'returns';

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
  // FFX, Chapter VII: D-045 / D-046, research/ffx-vs-ffx2-presentation.md lines 140 and 142.
  'guado-guardian-a': 'yields',
  'guado-guardian-b': 'yields',
  'seymour-macalania': 'body',
  // FFX, Chapter IX: D-076, OUR READING (no source gives Yojimbo's exit; the
  // decision sheet: "Yojimbo himself: no source describes how he leaves").
  // Daigoro goes with him (`RECALL_COMPANIONS`); Lady Ginnem has no KO and stays.
  yojimbo: 'dismissed',
  // FFX-2, Chapter XIII: research/ffx2-trema.md §2 steps 2 and 4 (see the module note).
  paragon: 'held',
  trema: 'held',
  // FFX, Chapter X: research/ffx-seymour-natus-highbridge.md §4.4 and §4.5 (see the module note).
  mortibody: 'returns',
};

export function departureKindOf(id: CombatantId): DepartureKind {
  return DEPARTURE_KINDS[id] ?? 'dissolve';
}

/**
 * `poses` with no painted `ko` for a figure that leaves some other way than
 * being sent: `ko` points at its `hurt` painting (or `idle`), so a falls-away or
 * yields figure can only ever draw an approved standing state, and the `ko`
 * PNG is never even fetched. Evrae's `ko.png` sits outside the approved set
 * (`docs/target/approved-hashes.json` chapter:evrae:2026-09-23; D-031: "not
 * sent, not killed on screen"). A dissolving fiend keeps its map unchanged.
 */
export function departurePoses(id: CombatantId, poses: Record<string, string>): Record<string, string> {
  const standing = poses['hurt'] ?? poses['idle'];
  const kind = departureKindOf(id);
  // A body keeps whatever `ko` it has: lying down is exactly what it is for.
  if (kind === 'dissolve' || kind === 'body' || !('ko' in poses) || !standing) return poses;
  return { ...poses, ko: standing };
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
/** Falling and staying down, in milliseconds at timeScale 1: one KO beat (`TIMING.ko` 620). */
export const BODY_MS = 620;
/** The roll onto his back inside {@link BODY_MS}; the rest is the landing. */
export const BODY_LIE_MS = 460;
/**
 * How long the shot stays on the body once it is down, before the victory
 * beat takes the camera. Chapter VII e2e (commit 06338dbc) caught the whole of
 * "falls and stays down" lasting about 1.5 s, most of it the roll, so the
 * stillness that makes it a body never registered. The body itself is never
 * lifted again: it lies there through the victory pose and the results
 * transition (`PaintedActor.lieDown`, and `'stays'` below).
 */
export const BODY_HOLD_MS = 1400;

/**
 * The shot the body beat cuts to: a rig registered at run time around where
 * the body actually lies (the field's relaxation moves his station per
 * viewport, so no fixed scene rig can frame it). Repair-pass verifier: held on
 * the killing blow's `enemy` framing, at 1280x960 his head sat behind the
 * Tidus row of the party panel for the whole hold, and a flat body seen from
 * that near-level camera is a sliver. This one looks down on him at about 25
 * degrees, so the body reads as a body on the floor, with it left of centre in
 * the band between the guide and the party panel, clear of the turn list
 * (measured in `tests/unit/ch7-presentation-fixes.test.ts` at 16:9, 4:3 and
 * 21:9). Offsets from the body's middle, world units; the camera sits on the
 * party's side of him. Only a camera that can take a rig at run time
 * (`CameraPort.addRig`) moves; otherwise the blow's framing stays, as before.
 * Presenter plumbing, both games; only FFX's Seymour at Macalania has a body.
 */
export const BODY_SHOT = {
  from: [-1.2, 4.6, 10.4] as [number, number, number],
  at: [0.35, -0.1, 0.3] as [number, number, number],
  fov: 32,
  sway: 0.4,
} as const;
/** The rig name {@link BODY_SHOT} is registered under. */
export const BODY_RIG = 'body';
/** The move onto {@link BODY_RIG}, ms at timeScale 1: under the roll, so the hold is all stillness. */
export const BODY_RIG_MS = 520;

/** Register {@link BODY_SHOT} around `actor`, or `null` when the camera cannot take it or is held. */
function bodyShot(ctx: EventCtx, actor: ActorHandle): string | null {
  const cam = ctx.stage.camera;
  if (!cam.addRig || cam.holding) return null;
  const p = actor.position;
  const plus = (d: readonly [number, number, number]): [number, number, number] => [p.x + d[0], d[1], p.z + d[2]];
  cam.addRig(BODY_RIG, { position: plus(BODY_SHOT.from), lookAt: plus(BODY_SHOT.at), fov: BODY_SHOT.fov, sway: BODY_SHOT.sway });
  return BODY_RIG;
}

/** Held, in milliseconds at timeScale 1: the dim where it stands. Ours, like every timing here. */
export const HELD_MS = 480;
/** How dim a held figure stays (brightness multiplier): beaten, still there. */
export const HELD_DIM = 0.55;

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
 * The mark a held figure carries, read structurally (the `scaleOf` trick: this file stays on the
 * headless side of the `three` line) off a `PaintedActor`'s `userData`. A scene keys a beat on it:
 * Cloister 100 breaks a held Paragon only once it has really been beaten.
 */
export const HELD_MARK = 'departure:held';

/** Beaten and left standing: the standing painting, a pale flash, a dim, and it stays. */
async function held(actor: ActorHandle, b: Budget): Promise<void> {
  const data = (actor as unknown as { userData?: Record<string, unknown> }).userData;
  if (data) data[HELD_MARK] = true;
  actor.setPose('hurt', { force: true });
  actor.flash(0xdfe8ff, 260, 0.5);
  const steps = 6;
  for (let i = 1; i <= steps; i++) {
    actor.setBrightness(1 - (1 - HELD_DIM) * (i / steps));
    await b.sleep(HELD_MS / steps);
  }
}

/**
 * Seymour falls and stays down: the KO state at his own station (the actor's
 * life layer drops the body, `PaintedActor.fall`), the plane rolled onto its
 * back (`lieDown`, he has no painted `ko`), a dark flash as a downed party
 * member gets, and no pyreflies. The roll races the departure's own budget.
 */
async function body(ctx: EventCtx, actor: ActorHandle, b: Budget): Promise<void> {
  const rig = bodyShot(ctx, actor);
  if (rig) {
    void ctx.stage.camera.release?.(ctx.moments.ms(BODY_RIG_MS));
    void b.guard(ctx.moments.moveToRig(rig, BODY_RIG_MS));
  }
  actor.setPose('ko', { force: true });
  actor.flash(0x4a5a78, 320, 0.7);
  actor.shake(0.12, 200);
  // With no painted `ko` (D-045 option A), the standing plane itself goes over.
  await Promise.all([b.guard(actor.lieDown?.(BODY_LIE_MS)), b.sleep(BODY_MS)]);
  await b.sleep(BODY_HOLD_MS);
}

/**
 * What a departure leaves behind: `'dissolve'` means none was played (the
 * caller plays the send), `'removed'` that the figure has left and the caller
 * removes the combatant, `'stays'` that a body lies on the field and stays.
 */
export type DepartureOutcome = 'dissolve' | 'removed' | 'stays';

/** Play `id`'s departure, if it has one other than the dissolve. */
export async function depart(
  ctx: EventCtx,
  id: CombatantId,
  actor: ActorHandle | undefined,
): Promise<DepartureOutcome> {
  const kind = departureKindOf(id);
  if (kind === 'dissolve') return 'dissolve';
  if (kind === 'dismissed') {
    await recall(ctx, id, actor, budget(ctx, departureMs(kind)));
    return 'removed';
  }
  if (!actor) return kind === 'body' || kind === 'held' || kind === 'returns' ? 'stays' : 'removed';
  const b = budget(ctx, departureMs(kind));
  if (kind === 'held') {
    await held(actor, b);
    return 'stays';
  }
  if (kind === 'returns') {
    await sendToReturn(actor, b.guard);
    return 'stays';
  }
  if (kind === 'body') {
    await body(ctx, actor, b);
    return 'stays';
  }
  if (kind === 'falls-away') await fallsAway(actor, b);
  else await yields(ctx, actor, b);
  return 'removed';
}

/** A departure's full length at timeScale 1, the outer guard's budget. */
export function departureMs(kind: Exclude<DepartureKind, 'dissolve'>): number {
  if (kind === 'body') return BODY_MS + BODY_HOLD_MS;
  if (kind === 'held') return HELD_MS;
  if (kind === 'returns') return RETURN_MS;
  if (kind === 'dismissed') return RECALL_MS.dim + RECALL_MS.rise;
  return kind === 'falls-away' ? FALL_MS.lurch + FALL_MS.drop : YIELD_MS.dim + YIELD_MS.step;
}
