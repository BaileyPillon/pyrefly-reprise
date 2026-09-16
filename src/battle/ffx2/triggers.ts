/**
 * Mid-battle story triggers.
 *
 * The engine evaluates every registered trigger after each resolved action and
 * emits `{ type: 'script-trigger', name, payload }` when one fires. The
 * presenter pauses playback, runs the named script, then resumes. `once: true`
 * disarms it and the engine records the id in `state.firedTriggerIds`
 * (`docs/CONTRACTS.md`, "Mid-battle story triggers").
 */

import type { BattleState, MidBattleTrigger } from '../common/types.ts';
import type { Emit, Ffx2Unit } from './internal.ts';

/** What just happened, so the event-shaped conditions can be matched. */
export interface TriggerSignal {
  /** Ability the actor just used. */
  abilityUsed?: { who: string; ability: string };
  /** Units that were KO'd during the action just resolved. */
  koed?: string[];
  /** Enemies that changed form. */
  formChanged?: Array<{ who: string; form: number }>;
  /** Statuses applied during the action just resolved. */
  statusApplied?: Array<{ who: string; status: string }>;
  /** An enemy began a telegraphed charge. */
  chargeStarted?: string[];
}

function matches(
  trigger: MidBattleTrigger,
  state: BattleState,
  units: readonly Ffx2Unit[],
  signal: TriggerSignal,
): boolean {
  const when = trigger.when;
  switch (when.type) {
    case 'hp-below': {
      const unit = units.find((u) => u.id === when.who);
      if (!unit) return false;
      return unit.hp <= unit.stats.maxHp * when.fraction;
    }
    case 'form-change':
      return (signal.formChanged ?? []).some((f) => f.who === when.who && f.form === when.form);
    case 'status-applied':
      return (signal.statusApplied ?? []).some((s) => s.who === when.who && s.status === when.status);
    case 'turn':
      return state.turn >= when.n;
    case 'ability-used':
      return signal.abilityUsed?.who === when.who && signal.abilityUsed.ability === when.ability;
    case 'ko':
      return (signal.koed ?? []).includes(when.who);
    case 'overdrive':
      // X-2 has no Overdrive gauge; the condition can never fire here.
      return false;
    case 'charge-started':
      return when.who
        ? (signal.chargeStarted ?? []).includes(when.who)
        : (signal.chargeStarted ?? []).length > 0;
    default:
      return false;
  }
}

/**
 * Fire every armed trigger whose condition now holds. Mutates
 * `state.firedTriggerIds` for `once` triggers.
 */
export function evaluateTriggers(
  state: BattleState,
  units: readonly Ffx2Unit[],
  signal: TriggerSignal,
  emit: Emit,
): void {
  for (const trigger of state.triggers) {
    if (state.firedTriggerIds.includes(trigger.id)) continue;
    if (!matches(trigger, state, units, signal)) continue;
    if (trigger.once) state.firedTriggerIds.push(trigger.id);
    emit({ type: 'script-trigger', name: trigger.id, payload: { script: trigger.script } });
  }
}

/** Collect a `TriggerSignal` from the events one action produced. */
export function signalFromEvents(events: readonly { type: string; [k: string]: unknown }[]): TriggerSignal {
  const signal: TriggerSignal = { koed: [], statusApplied: [], chargeStarted: [], formChanged: [] };
  for (const event of events) {
    if (event.type === 'ko' && typeof event['targetId'] === 'string') {
      signal.koed?.push(event['targetId']);
    } else if (event.type === 'status-add') {
      const who = event['targetId'];
      const status = event['status'];
      if (typeof who === 'string' && typeof status === 'string') {
        signal.statusApplied?.push({ who, status });
      }
    } else if (event.type === 'charge' && typeof event['enemyId'] === 'string') {
      signal.chargeStarted?.push(event['enemyId']);
    } else if (event.type === 'form-change') {
      const who = event['enemyId'];
      const form = event['formIndex'];
      if (typeof who === 'string' && typeof form === 'number') {
        signal.formChanged?.push({ who, form });
      }
    } else if (event.type === 'action-start') {
      const who = event['actorId'];
      const ability = event['abilityId'];
      if (typeof who === 'string' && typeof ability === 'string') {
        signal.abilityUsed = { who, ability };
      }
    }
  }
  return signal;
}
