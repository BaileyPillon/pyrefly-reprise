/**
 * Building the targets of an action the way the game does (re-parity RC4 lane FFX-G, slices G-a and G-b; **FFX only**).
 *
 * The game builds an action's targets **once**, before any hit resolves (`pp_BtlBuildTargetHits`, FFX.exe 0x0078ba70;
 * `kernel/target-builder.ts`): it deals the hits of a random-spread command over the action's whole target set (every pick first, stream
 * 5, a draw only with two or more candidates), hands each target of a physical single-target command to its best-scoring cover (Guard or
 * Sentinel, `kernel/cover.ts`), and sends a reflectable command back off every Reflecting target (the caster, for a holder on the
 * other side; a random member of the other side, stream 6, for a holder on the caster's own side). `research/re-ffx-targeting.md`
 * section 1. This module is the engine's seam to that function: {@link buildAction} maps the engine's targets onto the game's slots,
 * runs the kernel with the engine's streams, and gives back the targets and the hit count of each.
 *
 * **The cheap path.** When nothing in the action can change the targets (not a spread, no Guard or Sentinel holder for a physical single
 * blow, no Reflecting target for a reflectable command) the kernel would only hand every target the command's hit count, so the targets are
 * returned as they came, in their own order. When it does run, the targets come back in ascending slot order, the order the game visits them.
 */

import type { AbilityDef, CombatantId, FFXCombatant } from '../common/types.ts';
import { pickDrawn } from '../common/streams.ts';
import { buildTargetHits } from './kernel/target-builder.ts';
import { SLOT_COUNT } from './kernel/target-world.ts';
import { type Ctx, has, isAlive, targetable, tryActor } from './state.ts';
import { aimedTargetForHit } from './targeting.ts';
import { FfxStream } from './adapt/streams.ts';
import { inActorOrder } from './ai/script-random.ts';
import { bondOf, chainCommand, chainPick, chainSlotOf, chainWorld, damageKindOf } from './adapt/target-world.ts';
import { reflectableDef } from './statuses.ts';

/** A target of the built action and the hits it takes. */
export interface BuiltTarget {
  target: FFXCombatant;
  hits: number;
}

/** The targets of one action once built. */
export interface BuiltAction {
  /** Every target, with its hit count (a spread member no hit chose has 0). */
  targets: BuiltTarget[];
  /** Reflecting targets whose hits landed on someone else, and how many hits bounced off each. */
  bounced: Array<{ holder: FFXCombatant; hits: number }>;
  /** Reflecting targets whose hits found nobody legal to land on: those hits are lost. */
  lost: Array<{ holder: FFXCombatant; hits: number }>;
}

/** Is the command a single-target physical one, the only kind Cover intercepts? (The game's record decides: damage kind 1, target type single.) */
function isCoverable(def: AbilityDef, user: FFXCombatant): boolean {
  const single = def.targeting === 'single-enemy' || def.targeting === 'single-ally' || def.targeting === 'single-any';
  return single && damageKindOf(def, user) === 1;
}

/** Does anyone stand ready to cover? (A superset check: Guard, Sentinel, or a boss script's Guard mark.) */
function someoneCovers(ctx: Ctx): boolean {
  for (const c of Object.values(ctx.state.combatants)) {
    if (has(c, 'guard') || has(c, 'sentinel')) return true;
    if (ctx.rt.actors.get(c.id)?.guardMark === true) return true;
  }
  return false;
}

/** Can Cover or Reflect change anything about these targets? (A spread is always built by the kernel: it deals the hits.) */
function coverOrReflectMatters(ctx: Ctx, user: FFXCombatant, def: AbilityDef, raw: readonly FFXCombatant[]): boolean {
  if (isCoverable(def, user) && someoneCovers(ctx)) return true;
  return reflectableDef(def) && raw.some((t) => has(t, 'reflect'));
}

/**
 * Build the targets of one action. `raw` is the action's target set before Cover and Reflect (a spread's whole pool), `hits` the command's hit
 * count (for a spread, the number of hits to deal over the pool), `spread` whether the hits are dealt at random over the set.
 */
export function buildAction(ctx: Ctx, user: FFXCombatant, def: AbilityDef, raw: readonly FFXCombatant[], hits: number, spread: boolean): BuiltAction {
  const userSlot = chainSlotOf(ctx, user);
  if (userSlot === undefined) {
    // A user the game has no slot for (a test rig's) has no chain to run: its spread is dealt by hand, anything else is as named.
    return { targets: spread ? dealUnslotted(ctx, raw, hits) : raw.map((target) => ({ target, hits })), bounced: [], lost: [] };
  }
  if (!spread && !coverOrReflectMatters(ctx, user, def, raw)) {
    return { targets: raw.map((target) => ({ target, hits })), bounced: [], lost: [] };
  }
  const world = chainWorld(ctx, user, def, true);
  let mask = 0;
  const outside: FFXCombatant[] = [];
  for (const t of raw) {
    const slot = chainSlotOf(ctx, t);
    if (slot !== undefined && world.at.get(slot) === t) mask |= 1 << slot;
    else outside.push(t);
  }
  const cmd = chainCommand(user, def, hits, spread);
  const built = buildTargetHits(world.slots, bondOf(ctx), userSlot, commandIdOf(def), mask >>> 0, 0, cmd, chainPick(ctx, world));
  const targets: BuiltTarget[] = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    if ((built.targeted[i] ?? 0) === 0) continue;
    const target = world.at.get(i);
    if (target !== undefined) targets.push({ target, hits: built.hits[i] ?? 0 });
  }
  for (const target of outside) targets.push({ target, hits }); // a combatant with no game slot passes through untouched
  const bounced: BuiltAction['bounced'] = [];
  const lost: BuiltAction['lost'] = [];
  for (const b of built.bounces) {
    const holder = world.at.get(b.holder);
    if (holder === undefined) continue;
    (b.landing === 0xff ? lost : bounced).push({ holder, hits: b.hits });
  }
  return { targets, bounced, lost };
}

/** The command id the legal set's class test compares against; every engine combatant is class 0, so only its presence matters. */
function commandIdOf(def: AbilityDef): number {
  return def.record?.id ?? 0x3000;
}

/** A spread by a user the game has no slot for (a test rig's): the hits are dealt one pick at a time over the pool, as the builder does, on stream 5. */
function dealUnslotted(ctx: Ctx, pool: readonly FFXCombatant[], hits: number): BuiltTarget[] {
  const ordered = inActorOrder(ctx, pool);
  const dealt = new Map<CombatantId, number>();
  for (let n = 0; n < hits; n++) {
    const pick = pickDrawn(ctx.rng.on(FfxStream.RandomTarget), ordered);
    if (pick !== undefined) dealt.set(pick.id, (dealt.get(pick.id) ?? 0) + 1);
  }
  return ordered.map((target) => ({ target, hits: dealt.get(target.id) ?? 0 }));
}

/**
 * Build the targets of a **script-aimed** row (`AbilityDef.extra.scriptAims`): the game queues one command per named target, so each hit is its
 * own build, in the script's order. Hits on the same target add up; targets come back in the order they were first named.
 */
export function buildAimedAction(ctx: Ctx, user: FFXCombatant, def: AbilityDef, chosen: readonly CombatantId[], hitCount: number): BuiltAction {
  const order: FFXCombatant[] = [];
  const hitsOf = new Map<CombatantId, number>();
  const bounced = new Map<CombatantId, { holder: FFXCombatant; hits: number }>();
  const lost = new Map<CombatantId, { holder: FFXCombatant; hits: number }>();
  for (let h = 0; h < hitCount; h++) {
    const aimed = aimedTargetForHit(ctx, def, chosen, h);
    if (aimed.length === 0) continue;
    const one = buildAction(ctx, user, def, aimed, 1, false);
    for (const { target, hits } of one.targets) {
      if (!hitsOf.has(target.id)) order.push(target);
      hitsOf.set(target.id, (hitsOf.get(target.id) ?? 0) + hits);
    }
    for (const [from, into] of [[one.bounced, bounced], [one.lost, lost]] as const) {
      for (const b of from) into.set(b.holder.id, { holder: b.holder, hits: (into.get(b.holder.id)?.hits ?? 0) + b.hits });
    }
  }
  return {
    targets: order.map((target) => ({ target, hits: hitsOf.get(target.id) ?? 0 })),
    bounced: [...bounced.values()],
    lost: [...lost.values()],
  };
}

/**
 * **Provoke, for a monster that keeps control of its script** (research/re-ffx-ai-yunalesca-bfa.md section 3.4 step 3: "if Provoked and the target is a
 * single actor, the target becomes the provoker"; Natus's offensive rows go to the provoker, forced). Every other Provoked monster never reaches here:
 * its whole turn is the forced attack of `forced-turn.ts`. Returns the provoker in place of the aim when the user is a Provoked monster, the row
 * is aimed at one actor per hit and the provoker is still there to be hit; otherwise `raw` unchanged.
 */
export function provokedAim(ctx: Ctx, user: FFXCombatant, def: AbilityDef, raw: readonly FFXCombatant[]): readonly FFXCombatant[] {
  if (user.side !== 'enemy' || !has(user, 'provoke')) return raw;
  if (def.targeting !== 'single-enemy' && def.targeting !== 'single-any' && def.targeting !== 'random-enemy') return raw;
  const source = user.statuses['provoke']?.sourceId;
  const provoker = source === undefined ? undefined : tryActor(ctx, source);
  if (!provoker || !isAlive(provoker) || !targetable(provoker)) return raw;
  return raw.map((t) => (t.id === user.id ? t : provoker)).filter((t, i, all) => all.indexOf(t) === i);
}
