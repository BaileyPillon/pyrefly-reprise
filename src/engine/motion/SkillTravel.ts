/**
 * **SKILL TRAVEL**, the presenter's half (r38-motion, D-354; both games): a spell, a skill or a shot visibly leaves
 * its caster, crosses the field on an arc and lands with an impact frame, and the blow's damage numeral and its
 * HP change wait for the landing, not before it. The look itself (colour, arc, trail, starburst) is the stage's
 * (`VfxPort.travel`, drawn in the spell layer's batch: `spellfx/FlightFx.ts`); the sources say nothing about spell
 * travel in either game, so it is **ours**, one rule, two skins (FFX gold and round motes, FFX-2 pink and
 * four-point sparkles; `research/ffx-vs-ffx2-presentation.md` section 9 row 2). Ports only: no `three`, no DOM.
 *
 * - **When it leaves: the release, not the start.** `action-start` plans the shot (`planSkill`); it flies at the
 *   action's *first blow on a foe*. In FFX the blow follows the opening at once; in FFX-2 `action-start` is the start
 *   of the CTIM charge and other girls' whole actions play before the damage lands (the trace of Rikku's Darkness
 *   holds Yuna's and Paine's moves), so a shot launched at the start would land seconds before its numeral.
 * - **What flies.** An `ability` that opens on the cast pose and has a foe among its targets, never a melee skill
 *   (a physical ability keeps today's lunge) and never a heal or a self buff (every target on the caster's side).
 *   A physical shot (FFX-2: a long-range dressphere fires from where she stands, `research/ffx2-combat-core.md`
 *   section 1) flies as a thin `tracer`; Darkness, a long dark line, as a `beam`; every other spell as an `orb`.
 *   The stage may decline (`canTravel`: LOW EFFECTS, REDUCE MOTION, a special that draws its own effect): then
 *   nothing flies and nothing is held. A spell with no blow on a foe (a pure status) has no release and no shot.
 * - **No added wait.** The flight starts with the spell's own effect (`BattlePresenterSpellFx.awaitSpellLanding`) and
 *   the stage sizes it to the effect's first mark minus a short lead, so the shot lands just before the strike and
 *   inside the wait that is already there (FFX Thunder stays 2.02 s). Only a mark shorter than the shot's minimum
 *   flight (the slash of Darkness, a gun's hit: 0.1 s) is stretched, by under 0.1 s.
 * - **The numeral waits (the critic's blocker).** The HUDs of both games raise a blow's numeral and move its HP
 *   row *before* the blow's beat plays, so today the number appears 0.4 s before the bolt. For a blow whose action
 *   has a shot the loop holds both (`blowHeld`) and the beat shows them with `revealBlow`, once the shot has landed
 *   and the effect's own clock has drawn its strike (the same frame).
 * - **Same gate as RUN-IN** (`MotionGate.ts`), asked at the release: BATTLE SPECTACLE, REDUCE MOTION, skip, and,
 *   FFX-2 only, nothing over an open command menu.
 */
import type { BattleEvent, CombatantId } from '../../battle/common/types.ts';
import type { EventCtx } from '../BattlePresenterEvents.ts';
import type { ActionStartEvent } from '../BattlePresenterMotion.ts';
import { actionOfBlow } from '../BattlePresenterSpellFx.ts';
import { motionAllowed } from './MotionGate.ts';

export type FlightKind = 'orb' | 'tracer' | 'beam';

/**
 * The longest each shot flies at normal speed, ms. The stage shortens it to land just before the spell's own strike
 * (`spellfx/SpellFxLayer.fly`), and its layer's clock runs at the playback speed's inverse, so a held fast-forward
 * shortens it as it shortens the waits.
 */
export const FLIGHT_MS: Readonly<Record<FlightKind, number>> = { orb: 480, tracer: 150, beam: 200 };

/** The longest a blow waits for its shot, at normal speed, ms: a guard against a stage that never lands it. */
export const FLIGHT_GUARD_MS = 900;

/** Darkness (FFX-2 Dark Knight) is a dark line, not an orb (`research/ffx2-combat-core.md` section 3.8: "long range"). */
const DARK = /darkness|dark-knight/;
/** At most this many shots per action (an all-foes spell sends one at each, up to this many). */
const MAX_SHOTS = 4;

type Blow = Extract<BattleEvent, { type: 'damage' | 'miss' }>;

interface Plan {
  readonly actorId: CombatantId;
  readonly kind: FlightKind;
  readonly abilityId: string | undefined;
  readonly foes: readonly CombatantId[];
  /** `planned` until the first blow on a foe decides: `go` (a shot will fly) or `off` (today's look). */
  state: 'planned' | 'go' | 'off';
  /** Set when the shots have been sent: when they have all landed. */
  flight?: { landed: boolean; done: Promise<void> };
}

const plans = new WeakMap<EventCtx, Map<CombatantId, Plan>>();
const held = new WeakSet<object>();

/** Which shot this action draws, or null for none (a melee blow, a heal, a pure self action). */
export function flightKind(ctx: EventCtx, event: ActionStartEvent, pose: string): FlightKind | null {
  const kind = event.command.kind;
  const shooter = ctx.deps.actionMotion?.longRange?.(event.actorId) === true; // FFX-2: fires from her place
  if (pose === 'attack') return kind === 'attack' && shooter ? 'tracer' : null;
  if (pose !== 'cast' || kind !== 'ability') return null;
  const id = event.abilityId ?? (event.command as { id?: string }).id;
  if (id && ctx.deps.abilityFacts?.(id)?.damageType === 'physical') return shooter ? 'tracer' : null;
  return id && DARK.test(id) ? 'beam' : 'orb';
}

/** The foes this action's shot goes to: the other team's targets, never the caster, never an aeon for a party caster. */
function foesOf(ctx: EventCtx, event: ActionStartEvent): CombatantId[] {
  const side = ctx.stage.sideOf(event.actorId);
  return (event.targets ?? []).filter((t) => {
    const s = ctx.stage.sideOf(t);
    return s !== undefined && s !== side && !(side !== 'enemy' && s === 'aeon') && t !== event.actorId;
  });
}

/** `action-start`: remember which shot this action would draw. Nothing is shown and nothing is asked of the stage yet. */
export function planSkill(ctx: EventCtx, event: ActionStartEvent, pose: string): void {
  let m = plans.get(ctx);
  if (!m) plans.set(ctx, (m = new Map()));
  m.delete(event.actorId);
  const kind = flightKind(ctx, event, pose);
  const foes = kind ? foesOf(ctx, event).slice(0, MAX_SHOTS) : [];
  if (!kind || !foes.length) return;
  m.set(event.actorId, { actorId: event.actorId, kind, abilityId: event.abilityId ?? (event.command as { id?: string }).id, foes, state: 'planned' });
}

/**
 * The plan of the action this blow belongs to (its striker's), whoever the blow lands on. Only a blow that names its striker
 * belongs to a plan: the engines set `sourceId` on every blow of an ability, and leave it off a cost (Darkness's HP) and a
 * status tick, which under FFX-2's ATB overlap `ctx.acting` would credit to whichever action opened last.
 */
function planOf(ctx: EventCtx, event: Blow): Plan | undefined {
  return event.sourceId ? plans.get(ctx)?.get(event.sourceId) : undefined;
}

/**
 * The loop asks before it shows a blow to the HUD: true when the blow lands on a foe of an action that sends a shot, so
 * the numeral and the HP row wait for `revealBlow` (which the blow's own beat calls once the shot has landed). The
 * action's first blow, on anyone, decides for the whole action, with the gate as it stands at the release. A blow on
 * someone else (Darkness's HP cost on its caster) shows at once, as today.
 */
export function blowHeld(ctx: EventCtx, event: BattleEvent): boolean {
  if (event.type !== 'damage' && event.type !== 'miss') return false;
  const plan = planOf(ctx, event);
  if (!plan) return false;
  if (plan.state === 'planned') {
    const vfx = ctx.stage.vfx;
    plan.state = ctx.reveal && vfx.travel && vfx.canTravel?.(plan.abilityId, plan.actorId) !== false && motionAllowed(ctx, 'skilltravel') ? 'go' : 'off';
  }
  if (plan.state !== 'go' || !plan.foes.includes(event.targetId)) return false;
  held.add(event);
  return true;
}

/**
 * The action's first blow's beat opens: the shot(s) leave the caster now. For a spell that is the blow on its foe, so the
 * shot flies in step with the spell's own effect; Darkness's first blow is the HP cost on its caster, so its beam crosses
 * during that beat and has landed when the blow on the foe begins.
 */
export function launchShot(ctx: EventCtx, event: Blow): void {
  const plan = planOf(ctx, event);
  if (!plan || plan.state !== 'go' || plan.flight) return;
  const vfx = ctx.stage.vfx;
  const sent: Array<Promise<void>> = [];
  for (const to of plan.foes) {
    const r = vfx.travel!.call(vfx, plan.actorId, to, { ...(plan.abilityId ? { abilityId: plan.abilityId } : {}), kind: plan.kind, ms: FLIGHT_MS[plan.kind] });
    if (r.ms > 0) sent.push(r.landed);
  }
  const flight = { landed: sent.length === 0, done: Promise.all(sent).then(() => void (flight.landed = true)) };
  plan.flight = flight;
}

/** After the spell's own wait: what is left of the flight, for a blow on a foe (nothing without a shot, and rarely any with one), capped. */
export function landFlight(ctx: EventCtx, event: Blow): Promise<unknown> | undefined {
  const plan = planOf(ctx, event);
  const f = plan?.foes.includes(event.targetId) ? plan.flight : undefined;
  return !f || f.landed ? undefined : Promise.race([f.done, ctx.sleep(FLIGHT_GUARD_MS)]);
}

/**
 * The blow has landed: show its numeral and move its HP row, once (a no-op for a blow that was not held). The spell's own
 * wait ended on the presenter's clock; this also waits for the effect's clock to have drawn the strike (a few frames on a
 * slow device), so the number and the bolt are the same frame.
 */
export async function revealBlow(ctx: EventCtx, event: BattleEvent): Promise<void> {
  if (!held.delete(event)) return;
  if (event.type === 'damage' || event.type === 'miss') await drawnStrike(ctx, event);
  await ctx.reveal?.(event);
}

/** Wait (polled, capped at `MARK_POLLS` x `MARK_POLL_MS`) until the effect's own clock has reached this blow's mark. */
async function drawnStrike(ctx: EventCtx, event: Blow): Promise<void> {
  const markIn = ctx.stage.vfx.markIn;
  const action = markIn ? actionOfBlow(ctx, event.sourceId) : undefined;
  if (!markIn || !action) return;
  for (let i = 0, left = markIn.call(ctx.stage.vfx, event.targetId, action.serial); left > 0 && i < MARK_POLLS; i++) {
    await ctx.sleep(Math.min(left, MARK_POLL_MS));
    left = markIn.call(ctx.stage.vfx, event.targetId, action.serial);
  }
}

/** The drawn-strike poll: every 40 ms, at most 30 times (1.2 s, a guard). */
const MARK_POLL_MS = 40;
const MARK_POLLS = 30;

/** `action-end`: the plan is over; a shot still in the air (only a very short action gets here with one) lands first. */
export function settleFlight(ctx: EventCtx, actorId: CombatantId | null | undefined): Promise<unknown> | undefined {
  const m = actorId ? plans.get(ctx) : undefined;
  const p = actorId ? m?.get(actorId) : undefined;
  if (!p) return undefined;
  m!.delete(actorId!);
  const f = p.flight;
  return !f || f.landed ? undefined : Promise.race([f.done, ctx.sleep(FLIGHT_GUARD_MS)]);
}
