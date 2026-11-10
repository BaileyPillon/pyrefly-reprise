/**
 * The presenter's side of a Special dress-up: the runtime that follows a girl's form from event to event, the beat dispatcher and the guards (FFX-2 only in what is seen: the three Special
 * dresspheres exist only in FFX-2; the call-ins that reach this file are shared plumbing for both games, and every one is a SYNCHRONOUS function that returns `null` or `false` after one
 * `WeakMap` lookup while the switch `specialDressUp` is OFF, and does nothing else).
 *
 * The runtime lives in a module `WeakMap<EventCtx, SpecialRuntime>` (no field on `EventCtx`, which is over the cap). It is created by the first `spherechange` that carries `special` (when the
 * battle's state says the switch is on) or by `preSubmit` on the way in, and it is the only place a form's state is kept: the tracker (who is a part), the hold (what the HUD lists), the stage form
 * (what the stage drew) and the hit gate. The guards (`specialHolds`, `specialStatusHolds`) are plain functions on purpose: an `async` guard, an `await` or a promise made OFF would add a microtask
 * before every KO, hit and revive of both games (`tests/unit/special-switch-off.test.ts` scans for it). The beats themselves are `SpecialEntry.ts` and `SpecialExitFall.ts`.
 *
 * `[ours]` in this file: the part's status pacing (`TIMING.status * 0.4`), the part revive's kept numeral. No `three`, no DOM, ports only.
 */

import type { BattleEvent, BattleState, Command, CombatantId, FFX2Combatant } from '../battle/common/types.ts';
import { curseDim } from './BattlePresenterBossFx.ts';
import { cue, numeral, TIMING, type EventCtx } from './BattlePresenterEvents.ts';
import { runEntry } from './SpecialEntry.ts';
import { runExit, runFall } from './SpecialExitFall.ts';
import { entryKind } from './SpecialBeatPlans.ts';
import type { Girl } from './SpecialBeatPlans.ts';
import { createFormTracker, type FormBeat, type FormTracker } from './SpecialFormTracker.ts';
import { createPartyHold, type PartyHold } from './SpecialPartyHold.ts';
import { PYREFLY_GREEN } from './SpecialReactions.ts';
import { specialLook, type StageForm } from './SpecialStaging.ts';
import { idsBack } from './SummonStaging.ts';

/** What the presenter lends the runtime: the full HUD sync (never `syncVitals` while the hold is up), the Config's ATB mode, and whether playback was torn down. */
export interface SpecialHost {
  syncFullHud(): void;
  atbMode(): 'wait' | 'active';
  readonly isAborted: boolean;
}

export interface SpecialRuntime {
  readonly tracker: FormTracker;
  readonly hold: PartyHold;
  readonly host: SpecialHost;
  /** Actions seen since the runtime was made (a count for the tests and the handoff; the hit gate does not read it). */
  actionCount: number;
  /** A `damage` on the main or a part has played in this enemy action: the next one is gated (D-9, the figure hurts once per enemy action). */
  damageSeen: boolean;
  /** The form the stage has up, or null: `form.gate` is the hit gate of C1 rule 8. */
  form: StageForm | null;
  /** The beat the event now playing starts (`noteSpecial` names it, `specialBeat` takes it). */
  beat: FormBeat;
  /** The three girls' ids as the HUD listed them before the change (`preSubmit`), in party order; null until known. */
  girls: readonly CombatantId[] | null;
}

type Change = Extract<BattleEvent, { type: 'spherechange' }>;
type StatusEvent = Extract<BattleEvent, { type: 'status-add' | 'status-remove' }>;
type Revive = Extract<BattleEvent, { type: 'revive' }>;

const runtimes = new WeakMap<EventCtx, SpecialRuntime>();

/** The runtime of this battle's presenter, or undefined when no Special was ever entered (and always, with the switch OFF). */
export function runtimeOf(ctx: EventCtx): SpecialRuntime | undefined {
  return runtimes.get(ctx);
}

function create(ctx: EventCtx, host: SpecialHost): SpecialRuntime {
  const rt: SpecialRuntime = { tracker: createFormTracker(), hold: createPartyHold(ctx.deps.hud), host, actionCount: 0, damageSeen: false, form: null, beat: null, girls: null };
  runtimes.set(ctx, rt);
  return rt;
}

/**
 * The hit gate (C1 rule 8): set for the event about to play. `action-start`, `action-end` and `turn-start` open it again; a `damage` on the main or a part is gated when an earlier one
 * played in this enemy action; every other event leaves it open (a heal, a miss and the fall beat are never gated). The playback loop plays one event at a time, so the flag is stable
 * for the whole beat of one event.
 */
function gate(rt: SpecialRuntime, event: BattleEvent): void {
  if (event.type === 'action-start') rt.actionCount++;
  const open = event.type === 'action-start' || event.type === 'action-end' || event.type === 'turn-start';
  if (open) rt.damageSeen = false;
  const g = rt.form?.gate;
  if (!g) return;
  if (open) g.blocked = false;
  else if (event.type === 'damage' && rt.tracker.of(event.targetId) !== undefined) {
    g.blocked = rt.damageSeen;
    rt.damageSeen = true;
  } else g.blocked = false;
}

/** The girls in party order: the form's girl and the two parked, by the slot the state gives them (the tracker's order when the state is unknown). */
function girlsOf(girl: CombatantId, parked: readonly CombatantId[], state: BattleState | null): readonly CombatantId[] {
  const all = [girl, ...parked];
  if (!state) return all;
  return [...all].sort((a, b) => (state.combatants[a]?.slot ?? 0) - (state.combatants[b]?.slot ?? 0));
}

/**
 * Called once per event by the playback loop, before `playEvent`. Returns at once (one `WeakMap.get` and one `event.type` test) unless a runtime exists or the event is a `spherechange`
 * with `special` set while `state.flags.specialDressUp` is true. Then it feeds the tracker, keeps the beat the event starts for `specialBeat`, and sets the hit gate.
 */
export function noteSpecial(ctx: EventCtx, event: BattleEvent, state: BattleState | null, host: SpecialHost): void {
  let rt = runtimes.get(ctx);
  if (!rt) {
    if (event.type !== 'spherechange' || event.special === undefined || state?.flags?.['specialDressUp'] !== true) return; // `flags?.`: a state double without the field is OFF, as it was before this look
    rt = create(ctx, host);
  }
  rt.beat = rt.tracker.see(event, state);
  if (rt.beat === 'enter') {
    const form = rt.tracker.form((event as Change).who);
    if (form && !rt.girls) rt.girls = girlsOf(form.girl, form.parked, state);
  }
  gate(rt, event);
}

/**
 * Called by `BattlePresenterCommands.submit` before `engine.submit`. When the switch is on and the command is the Special Dress Up (`extra.specialDressUp`) or the main's way out of a form that
 * is already up, the runtime is made and the HUD keeps today's list while the engine, which mutates `activeIds` inside `submit`, runs ("as early as the presenter knows", PRE 590 R-15).
 */
export function preSubmit(ctx: EventCtx, state: BattleState | null, command: Command, host: SpecialHost): void {
  if (command.kind !== 'spherechange' || state?.flags?.['specialDressUp'] !== true) return;
  const inForm = state.activeIds.some((id) => (state.combatants[id] as FFX2Combatant | undefined)?.dresspheres?.special !== undefined);
  if (command.extra.specialDressUp !== true && !inForm) return; // an ordinary Change
  const rt = runtimes.get(ctx) ?? create(ctx, host);
  if (command.extra.specialDressUp === true) rt.girls = [...state.activeIds];
  rt.hold.rows([...state.activeIds]);
}

/** The beat this `spherechange` starts, or null (an ordinary Change: the call-in then runs today's lines). A plain function, not `async`. */
export function specialBeat(ctx: EventCtx, event: Change): Promise<void> | null {
  const rt = runtimes.get(ctx);
  const beat = rt?.beat;
  if (!rt || !beat) return null;
  rt.beat = null;
  if (beat === 'enter') return runEntry(ctx, rt, event, entryKind(ctx.deps.specialSeen, event.who as Girl, event.special!, specialLook().hold));
  return beat === 'exit' ? runExit(ctx, rt, event) : runFall(ctx, rt, event);
}

// ------------------------------------------------------------------ the guards (plain functions)

/** `ko` and `revive`: the tracker knows the id (a part, or the main while her form is up). */
export function specialHolds(ctx: EventCtx, id: CombatantId): boolean {
  return runtimes.get(ctx)?.tracker.of(id) !== undefined;
}

/** `status-add` / `status-remove`: a status on a PART, `petrify` on the main (add or remove), `auto-life` added to the main. Every other status on the main plays today's lines. */
export function specialStatusHolds(ctx: EventCtx, event: StatusEvent): boolean {
  const hit = runtimes.get(ctx)?.tracker.of(event.targetId);
  if (!hit) return false;
  if (hit.role !== 'main') return true;
  return event.status === 'petrify' || (event.type === 'status-add' && event.status === 'auto-life');
}

/** A part (or the main, inside her form) is knocked out: the cue and the beat's time, no pose change, no lie-down, no flash. The main's fall shows only after the lead-in of the fall beat. */
export async function partKo(ctx: EventCtx, _id: CombatantId): Promise<void> {
  cue(ctx, 'ko');
  await ctx.sleep(TIMING.ko);
}

/** A raise: a part gets the heal cue and its numeral (at the part's number point, which is the figure's, `[ours]`) and nothing on the figure; the main (Auto-Life) gets the revive flash in the pyrefly green. */
export async function formRevive(ctx: EventCtx, event: Revive): Promise<void> {
  const role = runtimes.get(ctx)?.tracker.of(event.targetId)?.role;
  if (role === 'main') ctx.stage.actor(event.targetId)?.flash(PYREFLY_GREEN, 520, 0.9);
  numeral(ctx, event.targetId, { kind: 'heal', amount: event.hp });
  cue(ctx, 'heal');
  await ctx.sleep(TIMING.revive);
}

/** The three statuses `specialStatusHolds` routes. It never calls `statusAdded` or any body of it (no recursion), and never `statusFxLanding` (no stale ability's effect may land on the figure at the entry). */
export async function formStatus(ctx: EventCtx, event: StatusEvent): Promise<void> {
  const role = runtimes.get(ctx)?.tracker.of(event.targetId)?.role;
  if (role !== 'main') return ctx.sleep(TIMING.status * 0.4); // a status on a part shows on its plate: nothing on the figure (`[ours]` pacing)
  if (event.status === 'petrify') return ctx.sleep(TIMING.status); // the figure stones only when all three parts are Petrified and the Ribbon wards it: not built
  const a = ctx.stage.actor(event.targetId); // auto-life added to the main: today's violet flash, cue and sleep, without the status effect's landing
  a?.noteStatus?.(event.status, true);
  curseDim(ctx, event.status, event.targetId, true, event.type === 'status-add' ? event.sourceId : undefined);
  a?.flash(0xc9a6ff, 260, 0.5);
  cue(ctx, 'status', { volume: 0.5 });
  return ctx.sleep(TIMING.status);
}

/** The girls a form (up, or begun and not yet revealed) has parked off the field: the stage form's list, else the tracker's for the girls it knows. */
function parkedOf(rt: SpecialRuntime): readonly CombatantId[] {
  const ids = new Set<CombatantId>(rt.form?.parked ?? []);
  for (const girl of rt.girls ?? []) for (const id of rt.tracker.form(girl)?.parked ?? []) ids.add(id);
  return [...ids];
}

/**
 * Let go of everything, once: the held list, the chip, the stage form, the girls it parked (back on the field at once, and out of the held-off map the x-ray and the strike reach read, even when the release
 * comes before the reveal), the tracker. Idempotent; safe from a `finally`, from `abort()` and from the start of a link.
 */
export function releaseSpecial(ctx: EventCtx): void {
  const rt = runtimes.get(ctx);
  if (!rt) return;
  const parked = parkedOf(rt);
  rt.hold.release(rt.host.atbMode(), () => rt.host.syncFullHud());
  if (parked.length > 0) void idsBack(ctx.stage, parked, 0);
  if (rt.form) {
    rt.form = null;
    ctx.stage.setForm?.(null);
  }
  rt.tracker.reset();
  rt.beat = null;
  rt.girls = null;
  rt.damageSeen = false;
}
