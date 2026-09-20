/**
 * What the party row is allowed to say *while a burst is still playing*.
 *
 * ## The bug this exists for
 *
 * Critic round 03 #9 (BLOCKER): "the party row shows a dead character alive at
 * 711/1500 for 2.1 s, and lags ordinary damage by 4.5 s". Measured live on
 * Build A (`critic/rounds/round-03/ko2.json`, sampled every 200 ms): the engine
 * had logged `{type:'ko', targetId:'yuna'}` while the rendered row still read
 * `Yuna 711 / 1500` in living colours for **2145 ms**, and the 789 numeral was
 * on screen at 1901 ms while the row still read 1500/1500 — it did not reach
 * 711 until 6395 ms.
 *
 * The cause is not a backlogged queue and not a hold time: `BattlePresenter`
 * has no queue. It is that `syncHud()` was only ever called **after a whole
 * burst of events had finished animating** (`BattlePresenter.run`, cases
 * `resolved` / `waiting`, and `submit`). One command produces
 * `action-start → damage → ko → action-end → message …`, each awaited in turn,
 * so the numbers on the HUD were the numbers from *before the command* for the
 * entire ~2–6 s the command took to play. The numerals were never late; the
 * rows were, by exactly the length of the rest of the burst.
 *
 * ## The fix
 *
 * The engine has already resolved the whole burst by the time the presenter
 * plays it, so `engine.state()` during playback holds the **end** of the burst
 * — syncing from it per event would show a character dead before the blow
 * lands, which is the same lie pointing the other way. Instead the presenter
 * keeps a snapshot of the values it has actually *shown*, rolls one event's
 * effect into it as that event's animation starts, and hands the HUD a state
 * with those values spliced in. At the end of the burst the ordinary full
 * `syncHud` runs and re-seeds the snapshot from the engine, so this can never
 * drift: every burst begins from the engine's own numbers.
 *
 * Pure: no DOM, no `three`, no timers (AGENTS.md hard rule 1). Only the fields
 * a status row draws are projected — hp, mp, alive, statuses and the Overdrive
 * gauge. Everything structural (who is on the field, whose turn it is, the log)
 * is shared by reference with the live state and is correct by construction.
 *
 * **Game case: both.** The defect is in shared playback plumbing that FFX's CTB
 * and FFX-2's ATB both run through (AGENTS.md rule 14, `critic/CHECKS.md`
 * CHK-020), so the same projection applies to both games.
 */

import type {
  AnyCombatant,
  BattleEvent,
  BattleState,
  CombatantId,
  StatusId,
  StatusInstance,
} from '../battle/common/types.ts';

/** The mutable numbers a status row draws, as the player has been shown them. */
export interface Vitals {
  hp: number;
  mp: number;
  alive: boolean;
  statuses: Partial<Record<StatusId, StatusInstance>>;
  /** Overdrive / ATB-independent gauge, or `null` for a combatant that has none. */
  gauge: number | null;
}

export type VitalsMap = Map<CombatantId, Vitals>;

/** A combatant with an Overdrive block, without importing either game's union. */
type WithOverdrive = AnyCombatant & { overdrive?: { gauge: number } };

/**
 * Snapshot every combatant's displayable numbers from live engine state.
 *
 * Called once per full `syncHud`, which is once per burst — so the projection
 * always starts the next burst from the engine's own truth and a missed event
 * self-corrects within one command.
 */
export function captureVitals(state: BattleState): VitalsMap {
  const out: VitalsMap = new Map();
  for (const id of Object.keys(state.combatants) as CombatantId[]) {
    const c = state.combatants[id] as WithOverdrive | undefined;
    if (!c) continue;
    out.set(id, {
      hp: c.hp,
      mp: c.mp,
      alive: c.alive,
      statuses: { ...c.statuses },
      gauge: c.overdrive ? c.overdrive.gauge : null,
    });
  }
  return out;
}

/**
 * Roll one event into the shown values.
 *
 * Returns `true` when something a row draws actually moved, so the presenter
 * can skip a re-render for the events that change nothing visible
 * (`turn-start`, `action-start`, `camera`, `sfx`, …). `false` for an unknown
 * combatant too: a summon or a chained form arrives mid-burst and is simply
 * left to the full sync at the end of it.
 */
export function applyEventToVitals(vitals: VitalsMap, event: BattleEvent): boolean {
  switch (event.type) {
    case 'damage': {
      const v = vitals.get(event.targetId);
      if (!v) return false;
      // Rule 5 of the playback protocol: a `heals`-flagged action is negative
      // damage, not a `heal` event, so this one line covers both directions.
      v.hp = clampHp(v.hp - event.amount);
      return true;
    }
    case 'heal': {
      const v = vitals.get(event.targetId);
      if (!v) return false;
      v.hp = clampHp(v.hp + event.amount);
      return true;
    }
    case 'mp-damage': {
      const v = vitals.get(event.targetId);
      if (!v) return false;
      v.mp = Math.max(0, v.mp - event.amount);
      return true;
    }
    case 'mp-heal': {
      const v = vitals.get(event.targetId);
      if (!v) return false;
      v.mp = Math.max(0, v.mp + event.amount);
      return true;
    }
    case 'ko': {
      const v = vitals.get(event.targetId);
      if (!v) return false;
      v.alive = false;
      v.hp = 0;
      return true;
    }
    case 'revive': {
      const v = vitals.get(event.targetId);
      if (!v) return false;
      v.alive = true;
      v.hp = clampHp(event.hp);
      return true;
    }
    case 'status-add': {
      const v = vitals.get(event.targetId);
      if (!v) return false;
      v.statuses = { ...v.statuses, [event.status]: event.instance };
      return true;
    }
    case 'status-remove': {
      const v = vitals.get(event.targetId);
      if (!v || v.statuses[event.status] === undefined) return false;
      const next = { ...v.statuses };
      delete next[event.status];
      v.statuses = next;
      return true;
    }
    case 'status-tick': {
      const v = vitals.get(event.targetId);
      const inst = v?.statuses[event.status];
      if (!v || !inst) return false;
      // `remaining` is turns in FFX and ATB ticks in FFX-2 (types.ts), and the
      // instance carries the two in separate fields. Whichever the engine that
      // emitted this is counting in is the one that is non-null.
      const patched: StatusInstance =
        inst.ticksRemaining !== null
          ? { ...inst, ticksRemaining: event.remaining }
          : { ...inst, turnsRemaining: event.remaining };
      v.statuses = { ...v.statuses, [event.status]: patched };
      return true;
    }
    case 'overdrive-gauge': {
      const v = vitals.get(event.who);
      if (!v || v.gauge === null) return false;
      v.gauge = event.to;
      return true;
    }
    default:
      return false;
  }
}

/**
 * The live state with the shown numbers spliced over it.
 *
 * Shallow throughout: one new `state`, one new `combatants` record and one new
 * object per combatant whose numbers differ from the engine's. Everything else
 * — stats, the log, `activeIds`, the enemy's AI memory — is the same object the
 * engine owns, so a HUD that reads any of it reads the truth. The result is
 * read-only by contract; nothing mutates it.
 */
export function projectState(state: BattleState, vitals: VitalsMap): BattleState {
  let changed = false;
  const combatants: Record<CombatantId, AnyCombatant> = {};
  for (const id of Object.keys(state.combatants) as CombatantId[]) {
    const c = state.combatants[id] as WithOverdrive | undefined;
    if (!c) continue;
    const v = vitals.get(id);
    if (!v || !differs(c, v)) {
      combatants[id] = c;
      continue;
    }
    changed = true;
    const next = { ...c, hp: v.hp, mp: v.mp, alive: v.alive, statuses: v.statuses } as WithOverdrive;
    if (c.overdrive && v.gauge !== null) next.overdrive = { ...c.overdrive, gauge: v.gauge };
    combatants[id] = next as AnyCombatant;
  }
  return changed ? { ...state, combatants } : state;
}

function differs(c: WithOverdrive, v: Vitals): boolean {
  if (c.hp !== v.hp || c.mp !== v.mp || c.alive !== v.alive) return true;
  if (c.overdrive && v.gauge !== null && c.overdrive.gauge !== v.gauge) return true;
  return !sameStatuses(c.statuses, v.statuses);
}

function sameStatuses(
  a: Partial<Record<StatusId, StatusInstance>>,
  b: Partial<Record<StatusId, StatusInstance>>,
): boolean {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    const ia = a[k as StatusId];
    const ib = b[k as StatusId];
    if (!ia || !ib) return false;
    if (
      ia.turnsRemaining !== ib.turnsRemaining ||
      ia.ticksRemaining !== ib.ticksRemaining ||
      ia.charges !== ib.charges ||
      ia.stacks !== ib.stacks
    ) {
      return false;
    }
  }
  return true;
}

function clampHp(n: number): number {
  return Math.max(0, Math.round(n));
}
