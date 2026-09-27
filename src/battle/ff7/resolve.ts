/**
 * Turns: an enemy committing its action at the fill, one queued action
 * executing, the counters it sets off, and the end check.
 *
 * Event order for one turn: `turn-start`, `action-start`, (`form-change`), (the
 * lock-on `message`), per target `miss` / `damage` / `revive` / `limit-gauge` /
 * `ko`, `action-end`, (the script's lines), then each counter as `counter`,
 * `action-start`, its effects, `action-end`, and last `victory` or `defeat`.
 *
 * Queue model [core §2.6, **our estimate**]: one action resolves at a time; an
 * enemy commits at its fill, a party member when the player confirms; the Turn
 * Timer resets when the action executes; a KO'd actor's queued action is dropped.
 * Counters jump the queue and never touch the counterer's gauge [core §12, estimate].
 *
 * Pure (AGENTS.md rule 1). Game case: **FF7 only.**
 */

import type { CombatantId, Command, Ff7Combatant } from '../common/types.ts';
import { FF7_AI_SCRIPTS } from './ai/index.ts';
import { makeAiApi, type Ff7AiApi, type Ff7AiPlan, type Ff7AiScript } from './ai/script.ts';
import { executionTargets } from './commands.ts';
import type { Ff7AbilityDef } from './defs.ts';
import { abilityDef, isParty, living, opponentSide, unit, type Ff7Env, type Ff7QueuedAction } from './internal.ts';
import { emitLimit, performAbility, type Ff7TargetOutcome } from './perform.ts';
import { settleBattle } from './results.ts';
import { canPayMp, payMp } from './stats.ts';

/** The script for an enemy, if it has one. */
export function scriptFor(c: Ff7Combatant): Ff7AiScript | undefined {
  const id = c.ff7.aiScriptId;
  return id ? FF7_AI_SCRIPTS[id] : undefined;
}

export function aiApi(env: Ff7Env, c: Ff7Combatant): Ff7AiApi {
  return makeAiApi(env.state, c, env.rng, (e) => env.emit(e), () => living(env.state, opponentSide(c)));
}

/** Run every enemy's Setup section once, at battle start [core §12]. */
export function runSetups(env: Ff7Env): void {
  for (const c of living(env.state, 'enemy')) scriptFor(c)?.setup?.(aiApi(env, c));
}

/** An enemy's gauge filled: its Main section chooses and commits at once [core §2.4]. */
export function commitEnemyTurn(env: Ff7Env, enemy: Ff7Combatant): void {
  const script = scriptFor(enemy);
  const plan: Ff7AiPlan = script ? script.main(aiApi(env, enemy)) : { kind: 'pass' };
  if (plan.kind === 'pass') {
    env.rt.actions.push({ actorId: enemy.id, command: null, abilityId: null, pass: true, plan });
    return;
  }
  env.rt.actions.push({
    actorId: enemy.id,
    command: { kind: 'ability', id: plan.abilityId, targets: [...plan.targets] },
    abilityId: plan.abilityId,
    plan,
  });
}

/** A form change from Raise Tail / Drop Tail: the enemy's Def and MDf follow its form (`formStats`) [gs §2.1]. */
function changeForm(env: Ff7Env, c: Ff7Combatant, formIndex: number): void {
  c.ff7.formIndex = formIndex;
  const form = env.rt.forms[c.id]?.[formIndex];
  if (form) {
    c.spriteKey = form.spriteKey;
    c.name = form.name;
  }
  env.emit({ type: 'form-change', enemyId: c.id, formIndex, name: c.name, spriteKey: c.spriteKey });
}

/** `turn-start`: the counter, the elapsed ticks, the Turn Timer back to 0, Defend over [core §2.3, §5.2]. */
function beginTurn(env: Ff7Env, actor: Ff7Combatant): void {
  const s = env.state;
  s.turn += 1;
  env.emit({ type: 'turn-start', actorId: actor.id, turn: s.turn, elapsedTicks: s.ticks - env.rt.lastTurnTick });
  env.rt.lastTurnTick = s.ticks;
  actor.ff7.atb.turnTimer = 0;
  actor.ff7.atb.ready = false;
  actor.ff7.defending = false;
}

/** One ability with its wrapper events; returns what each target took. */
function useAbility(env: Ff7Env, actor: Ff7Combatant, ability: Ff7AbilityDef, targets: Ff7Combatant[], command: Ff7QueuedAction['command']): Ff7TargetOutcome[] {
  const ids = targets.map((t) => t.id);
  const cmd = (command ? { ...command, targets: ids } : { kind: 'ability', id: ability.id, targets: ids }) as Command;
  env.emit({ type: 'action-start', actorId: actor.id, command: cmd, abilityId: ability.id, abilityName: ability.name, targets: ids });
  if (ability.toForm !== undefined) changeForm(env, actor, ability.toForm);
  const first = targets[0];
  if (ability.lockOn && first) env.emit({ type: 'message', text: ability.lockOn, kind: 'system', ff7: { kind: 'lock-on', targetId: first.id } });
  const out = performAbility(env, actor, ability, targets);
  env.emit({ type: 'action-end', actorId: actor.id });
  return out;
}

/** Run an enemy's counter plan: it jumps the queue and leaves the gauge alone [core §12, estimate]. */
function runCounter(env: Ff7Env, enemy: Ff7Combatant, plan: Ff7AiPlan, attackerId: CombatantId): void {
  if (plan.kind !== 'ability') return;
  const ability = abilityDef(env, plan.abilityId);
  env.emit({ type: 'counter', actorId: enemy.id, targetId: attackerId, abilityId: ability.id, cause: 'script' });
  const targets = plan.targets.map((id) => unit(env.state, id));
  useAbility(env, enemy, ability, targets, { kind: 'ability', id: ability.id, targets: [...plan.targets] });
}

/**
 * The counters a party action sets off: every enemy it targeted, hit or miss
 * (gs §5.5 G6, **our estimate**: unreachable with the canon party), runs its
 * Counter - Death section if the action killed it, else Counter - General.
 */
function runCounters(env: Ff7Env, attacker: Ff7Combatant, targets: Ff7Combatant[], outcomes: Ff7TargetOutcome[]): void {
  if (!isParty(attacker)) return;
  const seen = new Set<CombatantId>();
  for (const t of targets) {
    if (t.side !== 'enemy' || seen.has(t.id)) continue;
    seen.add(t.id);
    const script = scriptFor(t);
    if (!script) continue;
    const killed = outcomes.some((o) => o.targetId === t.id && o.killed);
    const api = aiApi(env, t);
    const plan = killed ? script.counterDeath?.(api, attacker.id) : t.alive ? script.counterGeneral?.(api, attacker.id) : null;
    if (plan) runCounter(env, t, plan, attacker.id);
    if (living(env.state, 'party').length === 0) return;
  }
}

/** Spend what the command costs as it executes: MP, the item, a full Limit gauge [core §7.2, §8.5, §8.6]. */
function payFor(env: Ff7Env, actor: Ff7Combatant, action: Ff7QueuedAction, ability: Ff7AbilityDef): boolean {
  const cmd = action.command;
  if (ability.mpCost > 0) {
    if (!canPayMp(actor.mp, ability.mpCost)) {
      env.emit({ type: 'message', text: 'Not enough MP', kind: 'system' });
      return false;
    }
    actor.mp = payMp(actor.mp, ability.mpCost);
  }
  if (cmd?.kind === 'item') {
    const left = env.rt.inventory[cmd.id] ?? 0;
    if (left <= 0) return false;
    env.rt.inventory[cmd.id] = left - 1;
  }
  if (cmd?.kind === 'limit' && actor.ff7.limit) {
    const before = actor.ff7.limit.gauge;
    actor.ff7.limit.gauge = 0; // using a Limit empties the gauge [core §7.2]
    emitLimit(env, actor, before);
  }
  return true;
}

/** Execute one queued action, then its counters, then the end check. */
export function executeAction(env: Ff7Env, action: Ff7QueuedAction): void {
  const actor = unit(env.state, action.actorId);
  if (!actor.alive || actor.removed || env.state.result) return; // dropped [core §2.6, estimate]
  beginTurn(env, actor);

  if (action.pass) {
    if (action.plan) scriptFor(actor)?.afterAction?.(aiApi(env, actor), action.plan);
    settleBattle(env);
    return;
  }
  if (action.command?.kind === 'defend') {
    env.emit({ type: 'action-start', actorId: actor.id, command: action.command, targets: [] });
    actor.ff7.defending = true;
    env.emit({ type: 'action-end', actorId: actor.id });
    settleBattle(env);
    return;
  }

  const ability = abilityDef(env, action.abilityId ?? '');
  if (!payFor(env, actor, action, ability)) {
    settleBattle(env);
    return;
  }
  const targets = executionTargets(env, actor, ability, action.command?.targets ?? []);
  const outcomes = useAbility(env, actor, ability, targets, action.command);
  if (action.plan) scriptFor(actor)?.afterAction?.(aiApi(env, actor), action.plan);
  runCounters(env, actor, targets, outcomes);
  settleBattle(env);
}

/** Execute the head of the queue. Returns false when the queue was empty. */
export function executeNext(env: Ff7Env): boolean {
  const next = env.rt.actions.shift();
  if (!next) return false;
  executeAction(env, next);
  return true;
}
