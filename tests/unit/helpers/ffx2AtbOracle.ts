/**
 * The oracle for `parity-ffx2-engine-atb.test.ts`: the FFX-2 battle clock the way the GAME runs it.
 *
 * `oracleRun` plays one generated battle straight through the kernels in `src/battle/ffx2/kernel/` (`atb*.ts`,
 * `status-timers*.ts`), in the order of `pp_battle_logic_step` (research/re-ffx2-atb-status.md section 2): the ATB process,
 * the action dispatcher (the casts on the purple bar), the status process, then the answers to the characters the process
 * handed off (a girl's menu, a monster's script). Every kernel input is built from the scenario's own game-terms fields
 * (Agility byte, speed setting, status bytes); it imports nothing from the engine's `atb-engine.ts`, `atb-open.ts`,
 * `logic-step.ts`, `status-clock.ts`, `lookahead.ts` or `gauges.ts`, so a wrong translation of an engine fact into a kernel
 * input shows up as a difference. The engine side is `ffx2AtbRig.ts`.
 *
 * Draws: the oracle draws from the game's streams (`makeFfx2Rng`) with the engine's seed, in the order the game asks: one value per character at
 * the battle's start (the party first), two for a rolled preemptive / ambush result, 31 for its resets, one per knock-out.
 *
 * **Game case: FFX-2 only.**
 */

import { makeFfx2Rng } from '../../../src/battle/ffx2/adapt/streams.ts';
import {
  FFX2_CLOCK_OPEN,
  FFX2_ATB_SPEED_TABLE,
  Ffx2AtbState,
  activePartyCounts,
  applyAtbDamage,
  applyFirstAttack,
  atbInit,
  atbTick,
  averageAgi,
  chargeTick,
  chargeTime,
  commandComplete,
  firstAttackRoll,
  openingTrim,
  stopState,
  type Ffx2AtbUnit,
  type Ffx2FirstAttackChr,
  type Ffx2TrimChr,
} from '../../../src/battle/ffx2/kernel/atb.ts';
import { statusProcess, type Ffx2TimerChr } from '../../../src/battle/ffx2/kernel/status-timers.ts';
import type { Scenario, ScenarioWorld, Trace } from './ffx2AtbRig.ts';

/** Logic steps a second, written out again (60 fields a second, 1.001, two fields a step). */
const STEPS_PER_SECOND = 60 / 1.001 / 2;

/** Group 2 slots by status kind (research/re-ffx2-hit-status.md section 4). */
const G2 = { shell: 0, regen: 3, haste: 4, slow: 5, stop: 6, doom: 14 } as const;
/** Group 1 slot of Sleep and the status-word bit of Poison. */
const SLEEP = 2;
const POISON_BIT = 0x20;
const SLEEP_BIT = 0x4;
const SLEEP_TIMER = 150000;
const STEP_UNITS = { shell: 1500, regen: 1500, haste: 1500, slow: 1500, stop: 1500, doom: 10000 } as const;

interface OUnit {
  id: string;
  side: 'party' | 'enemy';
  slot: number;
  agi: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  // the gauge (Chr+0xe68, +0x9d8, +0x9dc, +0x9f4, +0x9e0)
  state: number;
  recovery: number;
  recoveryMax: number;
  thinking: number;
  carry: number;
  tick: number;
  speeds: { raw: number; awake: number; active: number };
  // the command in flight
  charge: { remaining: number; max: number } | null;
  executing: number;
  cmdCostAtb: number;
  turn: number;
  // statuses in the game's terms
  status1: number;
  sleepTimer: number;
  counters: number[];
  accumulators: number[];
  poisonAcc: number;
  regenAcc: number;
  /** Logic steps left of the hit reaction, and whether this unit's row exempts it. */
  hitReaction: number;
  exempt: boolean;
}

const throwDraw = (): number => {
  throw new Error('the thinking base is 0 in play: nothing draws');
};

export function oracleRun(sc: Scenario, world: ScenarioWorld): Trace {
  const rng = makeFfx2Rng(sc.seed); // the game's own streams: each draw is on the stream the kernel names
  const base = FFX2_ATB_SPEED_TABLE[{ slow: 0, normal: 1, fast: 2 }[sc.speed]] as number;
  const units: OUnit[] = world.units
    .map(
      (w): OUnit => ({
        id: w.id, side: w.side, slot: w.slot, agi: w.agi, hp: w.hp, maxHp: w.maxHp, alive: true,
        state: Ffx2AtbState.Idle, recovery: 0, recoveryMax: 0, thinking: 0, carry: 0, tick: 0, speeds: { raw: 0, awake: 0, active: 0 },
        charge: null, executing: 0, cmdCostAtb: 70, turn: 0,
        status1: 0, sleepTimer: 0, counters: new Array<number>(24).fill(0), accumulators: new Array<number>(24).fill(0), poisonAcc: 0, regenAcc: 0,
        hitReaction: 0, exempt: w.exempt,
      }),
    )
    .sort((a, b) => a.slot - b.slot);
  const byId = new Map(units.map((u) => [u.id, u]));
  const girls = units.filter((u) => u.side === 'party');
  const monsters = units.filter((u) => u.side === 'enemy');
  const actingSteps = sc.actionSeconds > 0 ? Math.round(sc.actionSeconds * STEPS_PER_SECOND) : 0;

  const partyCounts = (): { count: number; standing: number } =>
    activePartyCounts(girls.slice(0, 3).map((g) => ({ slot: g.slot, inBattle: true, hidden: false, dead: !g.alive, petrified: false })));

  // ---- the battle's start ---------------------------------------------------------------------------------------------
  for (const u of units) {
    const counts = partyCounts();
    const r = atbInit(
      {
        chrId: u.slot, agi: u.agi, costAtb: 70, carry: 0, randomStart: sc.condition !== 'scripted', deadOrStone: false, lead: false,
        isMonster: u.side === 'enemy', aided: false, thinkingBaseArg: 0, thinking: { baseBefore: 0, partyCount: counts.count, partyStanding: counts.standing },
      },
      (stream) => rng.on(stream).int(0, 63),
    );
    u.recovery = r.start;
    u.recoveryMax = r.full;
    u.thinking = r.thinking;
  }
  if (sc.condition !== 'scripted') {
    const preset = sc.condition === 'preemptive' ? 1 : sc.condition === 'ambush' ? 2 : 0;
    if (preset !== 0 || sc.roll) {
      const roll = firstAttackRoll(
        { preset, firstStrikeCount: 0, partyAgi: averageAgi(girls.map((g) => g.agi)), monsterAgi: averageAgi(monsters.map((m) => m.agi)) },
        (stream) => rng.on(stream).int(0, 255),
      );
      if (roll.result === 1 || roll.result === 2) {
        const chrs: Ffx2FirstAttackChr[] = Array.from({ length: 31 }, (_, id) => {
          const u = units.find((x) => x.slot === id);
          return u === undefined ? { full: 0, lead: false, deadOrStone: false, recovery: 0 } : { full: u.recoveryMax, lead: false, deadOrStone: false, recovery: u.recovery };
        });
        const next = applyFirstAttack(roll.result, chrs, (stream) => rng.on(stream).int(0, 15));
        for (const u of units) u.recovery = next[u.slot] as number;
      }
    }
    const trimIn: Ffx2TrimChr[] = Array.from({ length: 31 }, (_, id) => {
      const u = units.find((x) => x.slot === id);
      return u === undefined ? { atbEnabled: false, inBattle: false, dead: true, petrified: false, recovery: 0 } : { atbEnabled: true, inBattle: true, dead: !u.alive, petrified: false, recovery: u.recovery };
    });
    const trimmed = openingTrim(trimIn);
    for (const u of units) u.recovery = trimmed.recovery[u.slot] as number;
  }

  // ---- helpers ------------------------------------------------------------------------------------------------------------
  const stopOf = (u: OUnit): number => stopState({ status1: u.status1, stopStage: (u.counters[G2.stop] as number) > 0 ? 1 : 0, condemned: false });
  const complete = (u: OUnit, costAtb: number): void => {
    u.executing = 0;
    u.state = Ffx2AtbState.Idle;
    const counts = partyCounts();
    const r = commandComplete(
      { dead: !u.alive, costAtb, agi: u.agi, carry: u.carry, thinking: { chrId: u.slot, base: 0, isMonster: u.side === 'enemy', partyCount: counts.count, partyStanding: counts.standing } },
      throwDraw,
    );
    if (r.recovery === null) return;
    u.recovery = r.recovery;
    u.recoveryMax = r.recovery;
    u.thinking = r.thinking ?? 0;
    u.carry = r.carry ?? 0;
  };
  const finish = (u: OUnit, costAtb: number): void => {
    u.cmdCostAtb = costAtb;
    if (actingSteps > 0) {
      u.executing = actingSteps;
      u.state = Ffx2AtbState.Executing;
    } else {
      complete(u, costAtb);
    }
  };
  const start = (u: OUnit, spec: { costAtb: number; costCast: number }): void => {
    u.state = Ffx2AtbState.Executing;
    u.cmdCostAtb = spec.costAtb;
    if (spec.costCast > 0) {
      const time = chargeTime(u.agi, 0, { costCast: spec.costCast, menuFlags: 0, subMenu: 0 }, [], () => ({ menuFlags: 0, category: 0 }));
      if (time > 0) {
        u.charge = { remaining: time, max: time };
        return;
      }
    }
    finish(u, spec.costAtb);
  };
  const knockOut = (u: OUnit): void => {
    u.alive = false;
    u.hp = 0;
    u.charge = null;
    u.executing = 0;
    u.hitReaction = 0;
    const counts = partyCounts();
    const r = atbInit(
      {
        chrId: u.slot, agi: u.agi, costAtb: 70, carry: u.carry, randomStart: false, deadOrStone: false, lead: false, isMonster: u.side === 'enemy', aided: false,
        thinkingBaseArg: -1, thinking: { baseBefore: 0, partyCount: counts.count, partyStanding: counts.standing },
      },
      (stream) => rng.on(stream).int(0, 63),
    );
    u.recovery = r.start;
    u.recoveryMax = r.full;
    u.thinking = r.thinking;
    u.carry = r.carry;
    u.state = Ffx2AtbState.Idle;
  };

  const trace: Trace = { steps: [], events: [] };
  const snapshot = (events: string[]): void => {
    trace.steps.push(units.map((u) => unitLine(u)));
    trace.events.push(events);
  };
  snapshot([]);

  // ---- the steps -------------------------------------------------------------------------------------------------------------
  for (let step = 1; step <= sc.steps; step++) {
    const events: string[] = [];
    // The scenario's own happenings, between steps.
    for (const ev of sc.events.filter((e) => e.step === step)) {
      const u = byId.get(ev.unit);
      if (u === undefined) continue;
      applyEvent(u, ev, events);
    }

    // 1. the ATB process
    const kunits: Ffx2AtbUnit[] = units.map((u) => ({
      id: u.slot,
      chr: { atbEnabled: true, condemned: false, inBattle: true, dead: !u.alive, held: false, state: u.state, recovery: u.recovery, tick: 0, thinking: u.thinking, thinkingTick: 1, pendingAnimation: false, motion: false },
      speed: { hasted: (u.counters[G2.haste] as number) > 0, slowed: (u.counters[G2.slow] as number) > 0, stopState: stopOf(u), charging: false, hitReaction: u.hitReaction > 0, hitReactionExempt: u.exempt },
      mode: u.side === 'party' ? 1 : 2,
      confused: false,
      berserk: false,
    }));
    const res = atbTick(kunits, FFX2_CLOCK_OPEN, { baseSpeed: base, thinkingTick: 1 }, { ready: () => false, poll: (_id, s) => s });
    units.forEach((u, i) => {
      const k = res.units[i] as Ffx2AtbUnit;
      const sp = res.speeds[i] as { raw: number; awake: number; active: number; tick: number };
      u.state = k.chr.state;
      u.recovery = k.chr.recovery;
      u.thinking = k.chr.thinking;
      u.tick = sp.tick;
      u.speeds = { raw: sp.raw, awake: sp.awake, active: sp.active };
      if (u.hitReaction > 0) u.hitReaction -= 1;
    });

    // 2. the action dispatcher: a command in its action time counts down, then the casts on the purple bar
    for (const u of units) {
      if (u.executing > 0 && u.charge === null && u.state === Ffx2AtbState.Executing) {
        u.executing -= 1;
        if (u.executing <= 0) complete(u, u.cmdCostAtb);
      }
    }
    for (const u of units) {
      if (u.charge === null || u.charge.remaining <= 0) continue;
      const next = chargeTick(u.charge, u.tick, true, false, stopOf(u));
      u.charge = next;
      if (next.remaining <= 0) {
        u.charge = null;
        finish(u, u.cmdCostAtb);
      }
    }

    // 3. the status process
    for (const u of units) {
      const poison = (u.status1 & POISON_BIT) !== 0;
      const regen = (u.counters[G2.regen] as number) > 0;
      const timed = u.counters.some((c) => c > 0) || u.sleepTimer > 0;
      if (!poison && !regen && !timed) continue;
      const chr: Ffx2TimerChr = {
        inBattle: true, hidden: false, hp: u.hp, dead: !u.alive, status1: u.status1, applied: u.sleepTimer > 0 ? SLEEP_BIT : 0,
        timers: Array.from({ length: 24 }, (_, i) => (i === SLEEP ? u.sleepTimer : 0)),
        counters: [...u.counters], accumulators: [...u.accumulators],
        regenByte: u.counters[G2.regen] as number, poisonAcc: u.poisonAcc, regenAcc: u.regenAcc,
        poisonPeriod: 16000, regenPeriod: 16000, poisonDamage: 8, regenDamage: 8, maxHp: u.maxHp,
        speeds: u.speeds, stopState: stopOf(u), condemned: false,
      };
      const out = statusProcess([{ id: u.slot, chr }], FFX2_CLOCK_OPEN)[0];
      if (out === undefined) continue;
      u.counters = [...out.chr.counters];
      u.accumulators = [...out.chr.accumulators];
      u.poisonAcc = out.chr.poisonAcc;
      u.regenAcc = out.chr.regenAcc;
      u.sleepTimer = out.chr.timers[SLEEP] as number;
      for (const i of out.events.expiredGroup1) {
        if (i === SLEEP) {
          u.status1 &= ~SLEEP_BIT;
          events.push(`expire:${u.id}:sleep`);
        }
      }
      const expired = new Set<number>();
      for (const { index } of out.events.expiredGroup2) {
        expired.add(index);
        // The game leaves a Doom counter at its floor of 1 (it never counts again); the victim is KO'd, and nothing the engine
        // shows depends on the stale byte, so the engine drops the status when it runs out and the oracle follows.
        u.counters[index] = 0;
        u.accumulators[index] = 0;
        const kind = (Object.entries(G2).find(([, v]) => v === index) ?? ['?'])[0];
        events.push(`expire:${u.id}:${kind}`);
      }
      // a count lost by a status that is still on is announced (an expiry says so itself)
      for (const [kind, idx] of Object.entries(G2)) {
        const was = chr.counters[idx] as number;
        const now = u.counters[idx] as number;
        if (was > 0 && now !== was && !expired.has(idx)) events.push(`tick:${u.id}:${kind}`);
      }
      const tick = out.events.tick;
      if (tick !== null && tick.amount !== 0) {
        if (tick.kind === 'poison') {
          events.push(`poison:${u.id}:${tick.amount}`);
          u.hp = Math.max(0, u.hp - tick.amount);
          if (u.hp === 0 && u.alive) {
            events.push(`ko:${u.id}`);
            knockOut(u);
          }
        } else {
          const gained = Math.min(u.maxHp, u.hp - tick.amount) - u.hp;
          u.hp += gained;
          if (gained > 0) events.push(`regen:${u.id}:${gained}`);
        }
      }
      if (out.events.doom && u.alive) {
        events.push(`ko:${u.id}`);
        knockOut(u);
      }
    }

    // 4. the gauge states follow the statuses (a menu closes on Sleep and Stop; a Stopped unit loses its command in flight)
    for (const u of units) {
      const asleep = (u.status1 & SLEEP_BIT) !== 0;
      const stopped = (u.counters[G2.stop] as number) > 0;
      if (u.state === Ffx2AtbState.WaitCommand && (!u.alive || asleep || stopped)) u.state = Ffx2AtbState.Idle;
      if (u.charge !== null && stopped) {
        u.charge = null;
        u.executing = 0;
        if (u.state === Ffx2AtbState.Executing) u.state = Ffx2AtbState.Idle;
      }
    }

    // 5. the answers to the characters handed off: girls first (their menus), then the monsters' scripts
    for (const u of [...girls, ...monsters]) {
      const asleep = (u.status1 & SLEEP_BIT) !== 0;
      const stopped = (u.counters[G2.stop] as number) > 0;
      const canAct = u.alive && !asleep && !stopped;
      if (!canAct) continue;
      if (u.side === 'party' && u.state === Ffx2AtbState.WaitCommand) {
        start(u, (sc.girlScripts[u.id] ?? [])[u.turn++ % (sc.girlScripts[u.id] ?? []).length] as { costAtb: number; costCast: number });
      } else if (u.side === 'enemy' && u.state === Ffx2AtbState.ScriptRequest) {
        const list = sc.monsterScripts[u.id] ?? [];
        const spec = list[u.turn++ % list.length] ?? null;
        if (spec === null) complete(u, 70);
        else start(u, spec);
      }
    }
    snapshot(events);
  }
  return trace;

  // ---- scripted happenings ---------------------------------------------------------------------------------------------------
  function applyEvent(u: OUnit, ev: Scenario['events'][number], events: string[]): void {
    const has = (kind: string): boolean => (kind === 'poison' ? (u.status1 & POISON_BIT) !== 0 : kind === 'sleep' ? (u.status1 & SLEEP_BIT) !== 0 : (u.counters[G2[kind as keyof typeof G2]] as number) > 0);
    const stopped = (u.counters[G2.stop] as number) > 0;
    if (ev.type === 'hit') {
      if (u.alive) u.hitReaction = 15;
      return;
    }
    if (ev.type === 'delay') {
      if (!u.alive) return;
      const r = applyAtbDamage(
        { state: u.state, recovery: u.recovery, recoveryMax: u.recoveryMax, carry: u.carry, charging: u.charge !== null, chargeRemaining: u.charge?.remaining ?? 0, chargeMax: u.charge?.max ?? 0, chargeReleased: 0 },
        ev.amount,
      );
      u.state = r.state; u.recovery = r.recovery; u.recoveryMax = r.recoveryMax; u.carry = r.carry;
      if (u.charge !== null) u.charge = { remaining: r.chargeRemaining, max: r.chargeMax };
      events.push(`delay:${u.id}:${ev.amount}`);
      return;
    }
    if (ev.type === 'cure') {
      if (!has(ev.kind)) return;
      if (ev.kind === 'poison') u.status1 &= ~POISON_BIT;
      else if (ev.kind === 'sleep') { u.status1 &= ~SLEEP_BIT; u.sleepTimer = 0; }
      else { const idx = G2[ev.kind as keyof typeof G2]; u.counters[idx] = 0; u.accumulators[idx] = 0; }
      return;
    }
    // inflict
    if (!u.alive || has(ev.kind)) return;
    const hasted = (u.counters[G2.haste] as number) > 0;
    const slowed = (u.counters[G2.slow] as number) > 0;
    if (ev.kind === 'haste') { if (stopped) return; if (slowed) { u.counters[G2.slow] = 0; u.accumulators[G2.slow] = 0; } }
    if (ev.kind === 'slow') { if (stopped) return; if (hasted) { u.counters[G2.haste] = 0; u.accumulators[G2.haste] = 0; } }
    if (ev.kind === 'stop') { if (hasted || slowed || (u.status1 & SLEEP_BIT) !== 0) return; }
    if (ev.kind === 'sleep' && stopped) return;
    if (ev.kind === 'poison') { u.status1 |= POISON_BIT; u.poisonAcc = ev.phase; }
    else if (ev.kind === 'sleep') { u.status1 |= SLEEP_BIT; u.sleepTimer = SLEEP_TIMER; }
    else {
      const idx = G2[ev.kind];
      u.counters[idx] = ev.amount;
      u.accumulators[idx] = 0;
      if (ev.kind === 'regen') u.regenAcc = ev.phase;
      void STEP_UNITS;
    }
  }
}

/** One unit's line of the trace. */
function unitLine(u: OUnit): string {
  const st: string[] = [];
  for (const [kind, idx] of Object.entries(G2)) {
    const c = u.counters[idx] as number;
    if (c > 0) st.push(`${kind}=${c}/${u.accumulators[idx]}`);
  }
  if (u.sleepTimer > 0 || (u.status1 & SLEEP_BIT) !== 0) st.push(`sleep=${u.sleepTimer}`);
  if ((u.status1 & POISON_BIT) !== 0) st.push('poison');
  return [
    u.id, `s${u.state}`, `r${u.recovery}/${u.recoveryMax}`, `t${u.thinking}`, `c${u.carry}`, `k${u.tick}`, `f${u.hitReaction}`,
    u.charge === null ? 'ch-' : `ch${u.charge.remaining}/${u.charge.max}`, `x${u.executing}`, `h${u.hp}${u.alive ? '' : 'X'}`,
    `p${u.poisonAcc}`, `g${u.regenAcc}`, st.sort().join(','),
  ].join('|');
}
