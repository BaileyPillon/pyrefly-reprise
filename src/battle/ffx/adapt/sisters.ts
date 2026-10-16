/**
 * The Magus Sisters in the engine (re-parity lane FFX-K, row K4; **FFX only**): the seam between `kernel/sisters.ts`, `kernel/aeon-stats.ts#summonCtb`,
 * `kernel/aeon-party.ts` (through `adapt/aeon-party.ts`) and the engine's combatants and streams. Nothing here is a rule of its own.
 *
 * - **Three aeons at once** ({@link summonSisters}, {@link dismissSisters}): the summon hands the party kernel all three (list positions 0 to 2, each records
 *   the summoner); `state.aeonId` is Cindy and `state.aeonIds` lists the three. The aeon wipe is all three down (not "any one", which is right for a lone
 *   aeon only); the Dismiss command stands a fallen sister up at 1 HP.
 * - **The menu** ({@link sistersTurnStart}): at each sister's turn the game's menu builder runs once (its draws are on stream 18); the orders it offers wait
 *   in {@link SistersRuntime.menu} for `availableCommands`.
 * - **Combine powers** ({@link combineOrder}): the chance `200 + motivation`, the target search, the Delta Attack performed by Cindy, the other sisters' counters
 *   from `summonCtb`, all three paying the bar, motivation +10 or -10.
 * - **The other seven orders** are carried out by `./sister-orders.ts` (the target search and the sixteen handlers, proved on the game's own code and script VM:
 *   `research/re-ffx-zanmato-and-orders.md` Part 2); this module keeps what they share: the state ({@link SistersRuntime}, with each sister's private memory), the
 *   motivation and gauge bytes ({@link magusChrOf}).
 *
 * Not sourced, and so a build must say (`FFXPartyBuild.sisters`): each sister's motivation at the start of the battle. The standing order starts at 0 in every
 * battle (whether the game's survives into the next battle is the note's open question 6).
 */

import type { CombatantId, Command, FFXCombatant, FFXPartyBuild } from '../../common/types.ts';
import { aeonSpecialRequest, EventKind } from '../kernel/aeon-request.ts';
import { autoTargetMask } from '../kernel/legal-set.ts';
import { type SummonSlot, summonCtb } from '../kernel/aeon-stats.ts';
import {
  type CombineFacts,
  type MagusChr,
  DELTA_ATTACK,
  SISTER_REST,
  SisterOrder,
  afterAction,
  combineCount,
  combineEvent,
  increaseMotivation,
  magusRoll,
  positiveCaseTest,
  sisterMenu,
  storeStandingOrder,
} from '../kernel/sisters.ts';
import { type Ctx, abilityOf, canAct, has, onField, rankOf, rtOf, tryActor } from '../state.ts';
import { releaseThreatenLink } from './threaten.ts';
import { aeonGearOf } from '../aeon-gear.ts';
import { reviveActor } from '../hp.ts';
import { removeStatus } from '../statuses.ts';
import { setGauge } from '../overdrive.ts';
import { dismissGroupOutcome, summonGroupOutcome } from './aeon-party.ts';
import { charge, hasteCounter, slowCounter } from './ctb.ts';
import { FfxStream } from './streams.ts';
import { chainCommand, chainPick, chainWorld, idsOf } from './target-world.ts';
import { slotIfAny, unitOf } from './od-world.ts';
import { slotOf } from './slots.ts';

/** The three Sisters, in list order. */
export const SISTER_IDS: readonly CombatantId[] = ['cindy', 'sandy', 'mindy'];

/** The six bytes a sister's pending change of motivation and gauge lives in (`Chr+0x714`, `+0x715`, `+0x726` to `+0x729`). */
export interface SisterPair {
  f714: number;
  f715: number;
  b726: number;
  b727: number;
  b728: number;
  b729: number;
}

/**
 * One sister's private variables (the handlers' own, section 12 of the note): the last command she performed (0 at the start; the rest command counts), the repeat
 * flag, the class of the order she last took, and Mindy's stored spell list (two entries) with its count. Unproved: whether they survive into the next battle.
 */
export interface SisterMemory {
  last: number;
  flag: number;
  cls: number;
  list: [number, number];
  count: number;
}

/** The Magus Sisters' state for one battle. */
export interface SistersRuntime {
  /** The standing order, a command id (0 when none stands). */
  order: number;
  /** Each sister's motivation, 0 to 100 (`Chr+0x6e1`). */
  motivation: Record<CombatantId, number>;
  /** Each sister's pending pair of changes. */
  pair: Record<CombatantId, SisterPair>;
  /** Actions each sister has parsed in this battle (`Chr+0x6df`, saturating at 255). */
  parsed: Record<CombatantId, number>;
  /** The orders the menu builder offered at the open turn, in the order it adds them (Dismiss last); `null` before the first sister's turn. */
  menu: { actorId: CombatantId; orders: number[] } | null;
  /** Each sister's private variables. */
  memory: Record<CombatantId, SisterMemory>;
}

/** The ability record of the Delta Attack. */
const DELTA_ABILITY_ID = 'delta-attack';

/** Does the build own all three Sisters? A build that lists only some is an error. */
export function ownsSisters(party: FFXPartyBuild): boolean {
  const have = SISTER_IDS.filter((id) => party.aeons.some((a) => a.id === id));
  if (have.length !== 0 && have.length !== SISTER_IDS.length) {
    throw new Error(`FFX engine: a build owns the Magus Sisters as three or not at all (it lists ${have.join(', ')})`);
  }
  return have.length === SISTER_IDS.length;
}

/** Set the Sisters up from the build, or throw when the build owns them and does not say how they start. Called by `buildBattle`; inert otherwise. */
export function initSisters(ctx: Ctx, party: FFXPartyBuild): void {
  if (!ownsSisters(party)) {
    if (party.sisters !== undefined) throw new Error('FFX engine: the build gives `sisters` but does not list the three Sisters in `aeons`');
    return;
  }
  if (party.sisters === undefined) {
    throw new Error("FFX engine: a build that owns the Magus Sisters must give `sisters: { motivation }` (the starting motivation has no default anywhere in src/battle)");
  }
  const motivation: Record<CombatantId, number> = {};
  const pair: Record<CombatantId, SisterPair> = {};
  const parsed: Record<CombatantId, number> = {};
  const memory: Record<CombatantId, SisterMemory> = {};
  for (const id of SISTER_IDS) {
    const m = party.sisters.motivation[id as 'cindy' | 'sandy' | 'mindy'];
    if (!Number.isInteger(m) || m < 0 || m > 100) throw new RangeError(`FFX engine: ${id}'s motivation must be a whole number from 0 to 100, not ${String(m)}`);
    motivation[id] = m;
    pair[id] = { f714: 0, f715: 0, b726: 0, b727: 0, b728: 0, b729: 0 };
    parsed[id] = 0;
    memory[id] = { last: 0, flag: 0, cls: 0, list: [0, 0], count: 0 };
  }
  ctx.rt.sisters = { order: 0, motivation, pair, parsed, menu: null, memory };
}

/** Is this combatant one of the Sisters under the game's rules? */
export function isSister(ctx: Ctx, c: FFXCombatant): boolean {
  return ctx.rt.sisters !== undefined && c.side === 'aeon' && SISTER_IDS.includes(c.id);
}

/** The three combatants, in list order. */
export function sistersOf(ctx: Ctx): FFXCombatant[] {
  return SISTER_IDS.map((id) => ctx.rt.aeonRoster.get(id)).filter((c): c is FFXCombatant => c !== undefined);
}

/** A sister's gauge in the aeon bar's points (a point is five percent). */
export const points = (c: FFXCombatant): number => Math.floor((c.overdrive?.gauge ?? 0) / unitOf(c));

// ---------------------------------------------------------------------------
// Summon and Dismiss (three aeons)
// ---------------------------------------------------------------------------

/** Can the Sisters be summoned? All three must be summonable (the engine's reading of the summon menu's check for the aeon the command names). */
export function sistersSummonable(ctx: Ctx, summonable: (c: FFXCombatant) => boolean): boolean {
  const group = sistersOf(ctx);
  return group.length === SISTER_IDS.length && group.every(summonable);
}

/**
 * The summonable aeons with the Sisters folded into one: Cindy stands for the three and is kept only when all three are in the list, Sandy and Mindy
 * are dropped (they come with her).
 */
export function asOneSummon(list: readonly FFXCombatant[]): FFXCombatant[] {
  const all = SISTER_IDS.every((id) => list.some((c) => c.id === id));
  return list.filter((c) => !SISTER_IDS.includes(c.id) || (c.id === 'cindy' && all));
}

/** Put all three Sisters on the field. Returns Cindy, or `undefined` when they cannot come. */
export function summonSisters(ctx: Ctx, ownerId: CombatantId, grand: boolean): FFXCombatant | undefined {
  const group = sistersOf(ctx);
  if (group.length !== SISTER_IDS.length || group.some((c) => (c.aeon?.reviveCountdown ?? 0) > 0)) return undefined;
  const owner = tryActor(ctx, ownerId);
  const known = owner !== undefined && group.every((c) => slotIfAny(ctx, c) !== undefined) && slotIfAny(ctx, owner) !== undefined;
  const out = known ? summonGroupOutcome(ctx, group, owner, grand) : undefined;
  for (const f of out?.freed ?? []) {
    if (f.provoke) removeStatus(ctx, f.c, 'provoke', 'cured');
    if (f.threaten && has(f.c, 'threaten')) removeStatus(ctx, f.c, 'threaten', 'expired');
  }
  group.forEach((aeon, i) => {
    const m = out?.members[i];
    aeon.removed = false;
    aeon.alive = aeon.hp > 0;
    aeon.slot = i;
    if (aeon.aeon) {
      aeon.aeon.ownerId = ownerId;
      aeon.aeon.temporaryOverdrive = (m?.held ?? grand) ? 100 : null;
    }
    rtOf(ctx, aeon.id).ctb = m?.ctb ?? 0;
  });
  ctx.state.aeonId = group[0]!.id;
  ctx.state.aeonIds = group.map((c) => c.id);
  for (const aeon of group) {
    ctx.emit({ type: 'summon', aeonId: aeon.id, combatantId: aeon.id, ownerId });
    if (aeon.aeon?.temporaryOverdrive === 100) {
      ctx.emit({ type: 'overdrive-gauge', who: aeon.id, from: aeon.overdrive?.gauge ?? 0, to: 100, cause: 'grand-summon' });
    }
  }
  return group[0];
}

/**
 * The Sisters leave. A wipe (`reason` other than `'command'`; the engine asks for it when all three are down) leaves each at 0 HP with the recovery
 * count its record gives; the Dismiss command stands a fallen sister up at 1 HP.
 */
export function dismissSisters(ctx: Ctx, reason: 'command' | 'ko' | 'banished'): void {
  const group = (ctx.state.aeonIds ?? []).map((id) => tryActor(ctx, id)).filter((c): c is FFXCombatant => c !== undefined);
  if (group.length === 0) return;
  const wiped = reason !== 'command';
  const known = group.every((c) => slotIfAny(ctx, c) !== undefined);
  const out = known ? dismissGroupOutcome(ctx, group, wiped) : undefined;
  ctx.state.aeonId = null;
  delete ctx.state.aeonIds;
  group.forEach((aeon, i) => {
    const m = out?.[i];
    // A fallen sister the Dismiss stands up (it leaves with 1 HP; her counter is her stored base).
    if (!wiped && (m?.revived ?? false)) reviveActor(ctx, aeon, 1, 'dismiss');
    releaseThreatenLink(ctx, aeon);
    aeon.removed = true;
    if (aeon.aeon) aeon.aeon.temporaryOverdrive = null;
    if (wiped) {
      setGauge(ctx, aeon, 0, 'aeon-ko');
      if (aeon.aeon) aeon.aeon.reviveCountdown = m?.recover ?? aeonGearOf(aeon).recovery + 1;
    }
  });
  for (const aeon of group) ctx.emit({ type: 'dismiss', combatantId: aeon.id, reason });
}

// ---------------------------------------------------------------------------
// The menu
// ---------------------------------------------------------------------------

function facts(ctx: Ctx, c: FFXCombatant): CombineFacts {
  return {
    id: slotOf(ctx, c),
    gauge: points(c),
    gaugeMax: 100 / unitOf(c),
    debugReady: false,
    dead: !c.alive || has(c, 'ko'),
    cursed: has(c, 'curse'),
    canAct: onField(c) && canAct(c) && !has(c, 'threaten') && !has(c, 'provoke') && !has(c, 'confuse') && !has(c, 'berserk'),
  };
}

/** One draw of the Sisters' stream, the 31-bit value. */
const draw18 = (ctx: Ctx) => (): number => ctx.rng.on(FfxStream.Magus).int(0, 0x7fffffff);

/**
 * A sister's turn opens: the game's menu builder runs (event 12) and the orders it offers are kept for the menu. Its draws come first, on stream 18, in the
 * order the script takes them. A no-op for anyone else.
 */
export function sistersTurnStart(ctx: Ctx, actor: FFXCombatant): void {
  if (!isSister(ctx, actor)) return;
  const s = ctx.rt.sisters!;
  const group = sistersOf(ctx);
  const orders: number[] = [];
  const draw = draw18(ctx);
  sisterMenu(
    slotOf(ctx, actor),
    {
      debug: 0,
      turns: s.parsed[actor.id] ?? 0,
      motivation: s.motivation[actor.id] ?? 0,
      hp: actor.hp,
      mp: actor.mp,
      maxHp: Math.max(1, actor.stats.maxHp),
      maxMp: Math.max(1, actor.stats.maxMp),
      // property 281 over the front line: how many have HP below half of the maximum (an unsigned compare against the maximum shifted right once)
      nearDeath: group.filter((c) => c.hp < Math.floor(c.stats.maxHp / 2)).length,
      // property 282 over the front line (read from the getter, [R]): how many are ready to Combine
      combineReady: combineCount(group.map((c) => facts(ctx, c))),
    },
    {
      clear: () => void (orders.length = 0),
      add: (c) => void orders.push(c),
      roll: (threshold) => (threshold < 0 ? true : magusRoll(0, threshold, s.order, draw).value === 1),
    },
  );
  s.menu = { actorId: actor.id, orders };
}

// ---------------------------------------------------------------------------
// Combine powers
// ---------------------------------------------------------------------------

/** What an action the engine ran gave back (the part this module reads of `execute.ts#ExecutionResult`). */
export interface OrderRun {
  rank: number;
  damageDealt: number;
}

/** The orders whose handlers are built: all eight (Combine powers here, the other seven in `./sister-orders.ts`). */
export const BUILT_ORDERS: ReadonlySet<number> = new Set(Object.values(SisterOrder));

/** The motivation and gauge bytes of a sister as the kernels read them. */
export function magusChrOf(ctx: Ctx, c: FFXCombatant): MagusChr {
  const s = ctx.rt.sisters!;
  const p = s.pair[c.id]!;
  return { motivation: s.motivation[c.id] ?? 0, gauge: points(c), gaugeMax: 100 / unitOf(c), ...p };
}

/** Carry the kernels' changes back onto the sister: her motivation, her pending pair and her gauge. */
export function storeMagusChr(ctx: Ctx, c: FFXCombatant, m: MagusChr): void {
  const s = ctx.rt.sisters!;
  s.motivation[c.id] = m.motivation;
  s.pair[c.id] = { f714: m.f714, f715: m.f715, b726: m.b726, b727: m.b727, b728: m.b728, b729: m.b729 };
  setGauge(ctx, c, m.gauge * unitOf(c), 'sister-order');
}

/**
 * The Combine powers order of sister `actor` (event 18): the handler clears the standing order, tries the Delta Attack at `200 + motivation` with a target
 * search, writes motivation +10 (or -10), and when it queued the Delta Attack the joint action runs as Cindy's: the actor's counter becomes 0, each other
 * sister's `HasteSlow(tick(Agility) x rank)`, all three pay the bar. `run` carries out a command through the engine's executor.
 *
 * Returns the turn's result for `actor`: rank 0 when the Delta Attack ran (Cindy's own counter was charged here), a rank-3 pass otherwise (the rest command
 * on herself; its own rank is not in our data).
 */
export function combineOrder(ctx: Ctx, actor: FFXCombatant, run: (who: FFXCombatant, command: Command) => OrderRun): OrderRun {
  const s = ctx.rt.sisters!;
  const request = aeonSpecialRequest(slotOf(ctx, actor), 0, [SisterOrder.Combine, 0xffff]);
  if (request === null || request.kind !== EventKind.FirstOrder + 5) throw new Error('FFX engine: the requester no longer maps Combine powers to event 18');
  s.parsed[actor.id] = Math.min(255, (s.parsed[actor.id] ?? 0) + 1);
  const def = abilityOf(ctx, DELTA_ABILITY_ID);
  if (def === undefined) throw new Error("FFX engine: the Delta Attack ('delta-attack') is not registered");
  const cindy = ctx.rt.aeonRoster.get('cindy')!;
  const draw = draw18(ctx);

  s.order = storeStandingOrder(0);
  let targets: CombatantId[] = [];
  let mask = 0;
  const outcome = combineEvent(s.motivation[actor.id] ?? 0, {
    roll: (threshold) => magusRoll(DELTA_ATTACK, threshold, s.order, draw).value === 1,
    target: () => {
      const world = chainWorld(ctx, actor, def, false);
      mask = autoTargetMask(world.slots, slotOf(ctx, actor), DELTA_ATTACK, 0, chainCommand(actor, def, 1, false), chainPick(ctx, world));
      targets = idsOf(world, mask);
      return mask !== 0;
    },
  });

  // Nothing queued: she performs the rest command on herself, which is her last command (a pass sets none; `kernel/sister-orders.ts`, the proven handler).
  if (!outcome.queued) s.memory[actor.id]!.last = SISTER_REST;
  const mine = magusChrOf(ctx, actor);
  increaseMotivation(mine, s.order, 0, outcome.motivationChange);
  storeMagusChr(ctx, actor, mine); // the pair waits for the end of the action

  let result: OrderRun = { rank: 3, damageDealt: 0 };
  if (outcome.queued) {
    // The joint action starts (kind 8): the actor's counter is 0, each other sister's the recovery of the action's rank for her.
    const group = sistersOf(ctx);
    const slots = new Map<number, SummonSlot>();
    for (const c of group) {
      slots.set(slotOf(ctx, c), {
        ctb: rtOf(ctx, c.id).ctb,
        agi: c.stats.agi,
        haste: hasteCounter(c),
        slow: slowCounter(c),
        targetMask: mask,
        flag451: 0,
        flag5c0: 0,
        mpUsed: 0,
        odUsed: 100 / unitOf(c),
        rank: rankOf(def),
      });
    }
    summonCtb(group.map((c) => slotOf(ctx, c)), slotOf(ctx, cindy), slots);
    for (const c of group) rtOf(ctx, c.id).ctb = slots.get(slotOf(ctx, c))!.ctb;

    const joint = run(cindy, { kind: 'overdrive', id: DELTA_ABILITY_ID, targets });
    // All three paid the 20-point bar: Cindy's executor spent hers, the other two pay here.
    for (const c of group) if (c.id !== cindy.id) setGauge(ctx, c, Math.max(0, (c.overdrive?.gauge ?? 0) - 100), 'delta-attack');
    charge(ctx, cindy, joint.rank);
    result = { rank: 0, damageDealt: joint.damageDealt };
  }

  // The action is done: the positive-case test decides the column, then the end-of-action step applies the pair.
  const done = magusChrOf(ctx, actor);
  positiveCaseTest(done, 0, [result.damageDealt, 0, 0], 0);
  afterAction(done);
  storeMagusChr(ctx, actor, done);
  return result;
}
