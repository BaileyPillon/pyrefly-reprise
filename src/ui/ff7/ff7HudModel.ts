/**
 * What the FF7 party band shows, computed from engine state (FF7 only).
 *
 * Pure: no DOM. The band draws one row per active party slot (FF7 has three;
 * the Guard Scorpion slice fills two) with the name, a Barrier / MBarrier box,
 * HP as `cur/ max`, MP as the current value only, and the LIMIT and TIME
 * gauges [spec §3.2, §5.4]. Game data comes from the state the engine sends,
 * never from here (rule 6).
 */

import type { AnyCombatant, AtbSnapshot, BattleState, CombatantId, TurnPreview } from '../../battle/common/types.ts';
import type { Ff7Combatant } from '../../battle/common/types-ff7.ts';

/** FF7's Limit gauge is full at 255 [ff7-battle-core §7]. */
export const LIMIT_FULL = 255;
/** FF7's Turn Timer is full at 65,535 [ff7-battle-core §2.3]. */
export const TURN_TIMER_FULL = 65_535;

export type LimitMode = 'normal' | 'fury' | 'sadness';

export interface Ff7RowView {
  id: CombatantId;
  name: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  /** HP digits yellow at or below 1/4 of max [spec §3.3, verified: 2 sources]. */
  hpLow: boolean;
  /** 0–1. */
  limit: number;
  /** Full: the gauge blinks and Limit replaces Attack [spec §3.4, §3.5]. */
  limitReady: boolean;
  /** Fury draws the gauge red, Sadness blue [spec §3.4, verified: S1, S3]. */
  limitMode: LimitMode;
  /** 0–1: the TIME (ATB) gauge. */
  time: number;
  timeFull: boolean;
  /** 0–1 each; empty when the status is off (the Guard Scorpion slice never raises them). */
  barrier: number;
  mbarrier: number;
}

/** A Limit gauge value the HUD heard from a `limit-gauge` event before the next sync. */
export interface LimitNote {
  value: number;
  ready: boolean;
}

function isFf7(c: AnyCombatant): c is Ff7Combatant {
  return 'ff7' in c && typeof (c as Ff7Combatant).ff7 === 'object';
}

function has(c: AnyCombatant, status: string): boolean {
  return (c.statuses as Record<string, unknown>)[status] !== undefined;
}

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);

/** The ATB bars from a sync's preview, when it is an {@link AtbSnapshot}. */
export function snapshotOf(preview: TurnPreview[] | AtbSnapshot | null | undefined): AtbSnapshot | null {
  return preview && !Array.isArray(preview) && Array.isArray((preview as AtbSnapshot).bars) ? (preview as AtbSnapshot) : null;
}

/**
 * One row per active party slot, in slot order. `gauges` (the engine's
 * snapshot) wins over the combatant's own Turn Timer for TIME; `limits`
 * (heard from events) wins over the combatant's gauge until the next sync.
 */
export function partyRows(
  state: BattleState,
  gauges: AtbSnapshot | null,
  limits: ReadonlyMap<CombatantId, LimitNote> = new Map(),
): Ff7RowView[] {
  const out: Ff7RowView[] = [];
  for (const id of state.activeIds.slice(0, 3)) {
    const c = state.combatants[id];
    if (!c || c.side !== 'party') continue;
    const f = isFf7(c) ? c.ff7 : null;
    const bar = gauges?.bars.find((b) => b.actorId === id);
    const timerFill = f ? f.atb.turnTimer / TURN_TIMER_FULL : 0;
    const time = clamp01(bar ? bar.fill : timerFill);
    const timeFull = bar ? bar.ready || bar.fill >= 1 : f ? f.atb.ready || timerFill >= 1 : false;
    const note = limits.get(id);
    const gauge = note ? note.value : f?.limit?.gauge ?? 0;
    const maxHp = Math.max(1, c.stats.maxHp);
    out.push({
      id,
      name: c.name,
      hp: c.hp,
      maxHp: c.stats.maxHp,
      mp: c.mp,
      maxMp: c.stats.maxMp,
      hpLow: c.hp * 4 <= maxHp,
      limit: clamp01(gauge / LIMIT_FULL),
      limitReady: note ? note.ready : gauge >= LIMIT_FULL,
      limitMode: has(c, 'fury') ? 'fury' : has(c, 'sadness') ? 'sadness' : 'normal',
      time: timeFull ? 1 : time,
      timeFull,
      barrier: 0,
      mbarrier: 0,
    });
  }
  return out;
}

/** Update only the TIME gauges from a fresh snapshot (the cheap `syncGauges` path). */
export function withGauges(rows: readonly Ff7RowView[], snapshot: AtbSnapshot): Ff7RowView[] {
  return rows.map((r) => {
    const bar = snapshot.bars.find((b) => b.actorId === r.id);
    if (!bar) return r;
    const timeFull = bar.ready || bar.fill >= 1;
    return { ...r, time: timeFull ? 1 : clamp01(bar.fill), timeFull };
  });
}

/** Update one row's Limit gauge from a `limit-gauge` event. */
export function withLimit(rows: readonly Ff7RowView[], id: CombatantId, note: LimitNote): Ff7RowView[] {
  return rows.map((r) => (r.id === id ? { ...r, limit: clamp01(note.value / LIMIT_FULL), limitReady: note.ready } : r));
}
