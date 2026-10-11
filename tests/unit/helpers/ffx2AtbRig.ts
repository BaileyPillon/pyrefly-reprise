/**
 * Rig for `parity-ffx2-engine-atb.test.ts`: generated FFX-2 battles written in the GAME's terms (the Agility byte, the Config
 * speed, ATB and cast costs, status counters), and the real engine driven through them one logic step at a time.
 * The oracle (`ffx2AtbOracle.ts`) plays the same scenario straight through the kernels by an independent route.
 *
 * What a scenario holds: three girls on a real build at a chosen level (the engine derives their stats; the rig READS
 * them back, it does not set them), one to three monsters with a chosen Agility, a script of commands for every
 * character (each command is a pair of costs: the ATB cost that sets the wait after it, the cast cost that sets the charge
 * before it), the opening, the Config speed, an action time, and a list of happenings between steps (a status lands or is
 * cured, a Delay hits). The commands deal no damage, so nothing but the clock moves.
 *
 * **Game case: FFX-2 only.**
 */

import { SeededRng } from '../../../src/battle/common/rng.ts';
import type { AbilityDef, Command, Decision, StatusId } from '../../../src/battle/common/types.ts';
import { FFX2Engine, STEP_MS } from '../../../src/battle/ffx2/index.ts';
import { applyDelay } from '../../../src/battle/ffx2/atb-engine.ts';
import { enemy, group, setup } from '../../../src/battle/ffx2/fixtures.ts';
import { mem, setMem, type AbilityRegistry, type AiScript, type EventDraft, type Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { registerAiScript } from '../../../src/battle/ffx2/ai/index.ts';
import { applyStatus, removeStatus } from '../../../src/battle/ffx2/statuses.ts';

/** A command in the game's terms: the cost that sets the recovery after it and the cost that sets the cast before it. */
export interface CmdSpec {
  costAtb: number;
  costCast: number;
}

export type StatusKind = 'shell' | 'regen' | 'haste' | 'slow' | 'stop' | 'doom' | 'poison' | 'sleep';

export type ScenarioEvent =
  | { type: 'inflict'; step: number; unit: string; kind: StatusKind; amount: number; phase: number }
  | { type: 'cure'; step: number; unit: string; kind: StatusKind }
  | { type: 'delay'; step: number; unit: string; amount: number }
  /** A damaging hit lands on the unit: it flinches (the game's hit reaction, which halves its tick for a while). */
  | { type: 'hit'; step: number; unit: string };

export interface Scenario {
  seed: number;
  speed: 'slow' | 'normal' | 'fast';
  condition: 'normal' | 'preemptive' | 'ambush' | 'scripted';
  /** Roll the preemptive / ambush result for a `'normal'` opening (`Ffx2EngineOptions.rollFirstAttack`). */
  roll: boolean;
  /** Seconds a command stays executing before it completes (the E4 estimate); 0 is off. */
  actionSeconds: number;
  steps: number;
  /** The girls' level (the engine derives their stats). */
  level: number;
  /** The monsters' Agility, in slot order (ids `m0`, `m1`, ...). */
  monsterAgis: number[];
  /** Per monster: its row says hit reactions do not slow it (special-flag word bit 1, every boss). */
  monsterExempt: boolean[];
  monsterScripts: Record<string, Array<CmdSpec | null>>;
  girlScripts: Record<string, CmdSpec[]>;
  events: ScenarioEvent[];
}

/** What the oracle needs of the engine's units: ids, sides, kernel slots (by the game's rule), the stats the engine derived. */
export interface ScenarioWorld {
  units: Array<{ id: string; side: 'party' | 'enemy'; slot: number; agi: number; hp: number; maxHp: number; exempt: boolean }>;
}

/** A run, step by step: one line per unit and the events of the step. */
export interface Trace {
  steps: string[][];
  events: string[][];
}

export const GIRLS = ['yuna', 'rikku', 'paine'] as const;

// ---------------------------------------------------------------------------------------------------------------------
// synthetic content
// ---------------------------------------------------------------------------------------------------------------------

/** The id of the no-damage command with these costs. */
export const abilityIdOf = (c: CmdSpec): string => `zz-w4-${c.costAtb}-${c.costCast}`;

function noop(costAtb: number, costCast: number): AbilityDef {
  return {
    id: `zz-w4-${costAtb}-${costCast}`,
    name: `W4 ${costAtb}/${costCast}`,
    game: 'ffx2',
    category: 'skill',
    mpCost: 0,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    ffx2Record: {
      id: 0x7000, costAtb, costCast, category: 0, flagsTarget: 0x33, flagsMisc: 0, flagsDamage: 0, damageClass: 0, formula: 0,
      critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0,
    },
  };
}

const registry: AbilityRegistry = {
  get(id) {
    const m = /^zz-w4-(\d+)-(\d+)$/.exec(id);
    return m === null ? undefined : noop(Number(m[1]), Number(m[2]));
  },
};

/** The monsters' scripts of the scenario being played (the AI script below reads them). */
let currentScripts: Record<string, Array<CmdSpec | null>> = {};

const cycleScript: AiScript = {
  id: 'zz-w4-cycle',
  decide(ctx) {
    const list = currentScripts[ctx.self.id] ?? [];
    const turn = mem(ctx.self, 'zz-turn');
    setMem(ctx.self, 'zz-turn', turn + 1);
    const spec = list.length === 0 ? null : (list[turn % list.length] ?? null);
    const target = ctx.party()[0];
    if (spec === null || target === undefined) return null;
    return { kind: 'ability', id: abilityIdOf(spec), targets: [target.id] };
  },
};
registerAiScript(cycleScript);

// ---------------------------------------------------------------------------------------------------------------------
// the scenario generator
// ---------------------------------------------------------------------------------------------------------------------

const COST_ATB = [0, 40, 50, 60, 70, 80, 100, 120, 200];
const COST_CAST = [0, 0, 0, 20, 40, 60, 70, 100, 140];
const KINDS: StatusKind[] = ['shell', 'regen', 'haste', 'slow', 'stop', 'doom', 'poison', 'sleep'];

export function makeScenario(index: number): Scenario {
  const rng = new SeededRng(index * 7919 + 13);
  const pick = <T>(xs: readonly T[]): T => rng.pick(xs);
  const spec = (): CmdSpec => ({ costAtb: pick(COST_ATB), costCast: pick(COST_CAST) });
  const monsterCount = rng.int(1, 3);
  const monsterAgis = Array.from({ length: monsterCount }, () => rng.int(5, 255));
  const monsterExempt = Array.from({ length: monsterCount }, () => rng.next() < 0.6);
  const condition = pick(['normal', 'normal', 'normal', 'scripted', 'preemptive', 'ambush'] as const);
  const steps = rng.int(400, 1200);
  const girlScripts: Record<string, CmdSpec[]> = {};
  for (const g of GIRLS) girlScripts[g] = Array.from({ length: rng.int(1, 4) }, spec);
  const monsterScripts: Record<string, Array<CmdSpec | null>> = {};
  for (let i = 0; i < monsterCount; i++) monsterScripts[`m${i}`] = Array.from({ length: rng.int(1, 4) }, () => (rng.next() < 0.12 ? null : spec()));

  const units = [...GIRLS, ...monsterAgis.map((_, i) => `m${i}`)];
  const events: ScenarioEvent[] = [];
  let doomUsed = false;
  const count = rng.next() < 0.25 ? 0 : rng.int(1, 9);
  for (let n = 0; n < count; n++) {
    const step = rng.int(1, steps - 1);
    const roll = rng.next();
    if (roll < 0.12) {
      events.push({ type: 'delay', step, unit: pick(units), amount: pick([4000, 8000]) });
    } else if (roll < 0.22) {
      events.push({ type: 'hit', step, unit: pick(units) });
    } else if (roll < 0.34) {
      events.push({ type: 'cure', step, unit: pick(units), kind: pick(KINDS.filter((k) => k !== 'doom')) });
    } else {
      let kind = pick(KINDS);
      let unit = pick(units);
      if (kind === 'doom') {
        // One Doom a battle, on the first girl or (with a second monster to fight) the first monster, never on the last one standing.
        if (doomUsed) kind = 'shell';
        else {
          doomUsed = true;
          unit = monsterCount > 1 && rng.next() < 0.4 ? 'm0' : GIRLS[0];
        }
      }
      const amount = kind === 'doom' ? rng.int(2, 8) : rng.int(1, kind === 'haste' || kind === 'slow' || kind === 'stop' ? 40 : 125);
      events.push({ type: 'inflict', step, unit, kind, amount, phase: rng.int(0, 4000) });
    }
  }
  events.sort((a, b) => a.step - b.step);
  return {
    seed: index + 1,
    speed: pick(['slow', 'normal', 'normal', 'fast'] as const),
    condition,
    roll: condition === 'normal' && rng.next() < 0.3,
    actionSeconds: pick([0, 0, 0, 1.5, 3]),
    steps,
    level: rng.int(10, 99),
    monsterAgis,
    monsterExempt,
    monsterScripts,
    girlScripts,
    events,
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// the engine side
// ---------------------------------------------------------------------------------------------------------------------

const G2_KINDS = ['shell', 'regen', 'haste', 'slow', 'stop', 'doom'] as const;

/** One unit's line of the trace, read off the engine's own fields. */
function engineLine(u: Ffx2Unit): string {
  const st: string[] = [];
  for (const kind of G2_KINDS) {
    const inst = u.statuses[kind as StatusId];
    if (inst !== undefined && inst.counter !== undefined) st.push(`${kind}=${inst.counter}/${inst.accumulator ?? 0}`);
  }
  const sleep = u.statuses['sleep'];
  if (sleep !== undefined) st.push(`sleep=${sleep.ticksRemaining ?? 0}`);
  if (u.statuses['poison'] !== undefined) st.push('poison');
  const c = u.atb.charging;
  return [
    u.id, `s${u.gauge.state}`, `r${u.atb.recovery}/${u.gauge.recoveryMax}`, `t${u.gauge.thinking}`, `c${u.gauge.carry}`, `k${u.gauge.speeds.tick}`, `f${u.gauge.hitReaction}`,
    c === null ? 'ch-' : `ch${c.remainingTicks}/${c.totalTicks}`, `x${u.gauge.executing}`, `h${u.hp}${u.alive ? '' : 'X'}`,
    `p${u.gauge.poisonAcc}`, `g${u.gauge.regenAcc}`, st.sort().join(','),
  ].join('|');
}

/** The events of a step that the clocks make, as tokens the oracle also writes. */
function tokens(events: readonly EventDraft[]): string[] {
  const out: string[] = [];
  for (const e of events) {
    if (e.type === 'status-remove' && e.reason === 'expired') out.push(`expire:${e.targetId}:${e.status}`);
    else if (e.type === 'status-tick') out.push(`tick:${e.targetId}:${e.status}`);
    else if (e.type === 'damage' && e.sourceId === undefined && e.element === 'none') out.push(`poison:${e.targetId}:${e.amount}`);
    else if (e.type === 'heal' && e.cause === 'regen') out.push(`regen:${e.targetId}:${e.amount}`);
    else if (e.type === 'ko') out.push(`ko:${e.targetId}`);
  }
  return out;
}

/** The scenario's own happenings, applied to the engine's units between two steps (the oracle applies the same rules to its own). */
function applyEvent(engine: FFX2Engine, ev: ScenarioEvent, out: string[]): void {
  const u = (engine.state().combatants as Record<string, Ffx2Unit | undefined>)[ev.unit];
  if (u === undefined) return;
  if (ev.type === 'delay') {
    if (!u.alive) return;
    applyDelay(u, ev.amount);
    out.push(`delay:${u.id}:${ev.amount}`);
    return;
  }
  if (ev.type === 'hit') {
    if (u.alive) u.gauge.hitReaction = 15;
    return;
  }
  const kind = ev.kind as StatusId;
  if (ev.type === 'cure') {
    removeStatus(u, kind);
    return;
  }
  const has = (k: StatusId): boolean => u.statuses[k] !== undefined;
  if (!u.alive || has(kind)) return;
  if ((ev.kind === 'haste' || ev.kind === 'slow') && has('stop')) return;
  if (ev.kind === 'stop' && (has('haste') || has('slow') || has('sleep'))) return;
  if (ev.kind === 'sleep' && has('stop')) return;
  applyStatus(u, { status: kind, chance: 255, duration: ev.kind === 'poison' || ev.kind === 'sleep' ? 0 : ev.amount }, u.id);
  if (ev.kind === 'poison') u.gauge.poisonAcc = ev.phase;
  if (ev.kind === 'regen') u.gauge.regenAcc = ev.phase;
}

/**
 * Play the scenario through the real engine, one logic step at a time; return the trace and the world the oracle needs.
 * `observe` is called at the end of every step, when the engine would be asked how long it can wait (the lookahead test reads it).
 */
export function engineRun(sc: Scenario, observe?: (engine: FFX2Engine, step: number) => void): { trace: Trace; world: ScenarioWorld } {
  currentScripts = sc.monsterScripts;
  const enemies = sc.monsterAgis.map((agi, i) =>
    enemy(`m${i}`, `Monster ${i}`, 'zz-w4-cycle', { agi, hp: 99_999_999, maxHp: 99_999_999 }, {
      slot: i, immunityFlags: [], flags: {},
      // the row's special-flag word: bit 1 = hit reactions do not slow it
      ffx2Record: { row: 0, table: 1, acc: 95, resist1: {}, resist2: {}, special: sc.monsterExempt[i] ? 2 : 0, species: 0, zantetsu: 0, stealByte: 0, stealGil: 0, steal: [0, 0, 0, 0], bribe: [0, 0, 0, 0] },
    }),
  );
  const battle = { ...setup(group('zz-w4', enemies), { seed: sc.seed, level: sc.level }), condition: sc.condition };
  const engine = new FFX2Engine({
    abilities: registry,
    atbSpeed: sc.speed,
    minigames: false,
    ...(sc.roll ? { rollFirstAttack: true } : {}),
    ...(sc.actionSeconds > 0 ? { actionTimeSeconds: sc.actionSeconds } : {}),
  });
  engine.init(battle);
  const state = engine.state();
  const unitOf = (id: string): Ffx2Unit => (state.combatants as Record<string, Ffx2Unit>)[id] as Ffx2Unit;
  const order = [...GIRLS, ...sc.monsterAgis.map((_, i) => `m${i}`)];
  const world: ScenarioWorld = {
    units: order.map((id, i) => {
      const u = unitOf(id);
      return {
        id, side: u.side === 'party' ? 'party' as const : 'enemy' as const, slot: i < GIRLS.length ? i : 15 + (i - GIRLS.length), agi: Math.max(0, Math.min(255, Math.round(u.stats.agi))),
        hp: u.hp, maxHp: u.stats.maxHp, exempt: u.side === 'enemy' && (sc.monsterExempt[i - GIRLS.length] ?? false),
      };
    }),
  };
  const lines = (): string[] => order.map((id) => engineLine(unitOf(id)));
  const trace: Trace = { steps: [lines()], events: [[]] };
  const turns: Record<string, number> = {};

  for (let step = 1; step <= sc.steps; step++) {
    const events: string[] = [];
    for (const ev of sc.events) if (ev.step === step) applyEvent(engine, ev, events);
    const drafts: EventDraft[] = [...engine.tick(STEP_MS)];
    // Answer everyone the step handed off: the girls' menus (in the game's order), then the monsters, which the engine plays itself.
    for (let guard = 0; guard < 64; guard++) {
      const d: Decision = engine.nextDecision();
      if (d.kind === 'resolved') {
        drafts.push(...d.events);
        continue;
      }
      if (d.kind === 'player-input') {
        const list = sc.girlScripts[d.actorId] ?? [];
        const turn = turns[d.actorId] ?? 0;
        turns[d.actorId] = turn + 1;
        const target = sc.monsterAgis.map((_, i) => `m${i}`).find((id) => unitOf(id).alive) ?? 'm0';
        const command: Command = { kind: 'ability', id: abilityIdOf(list[turn % list.length] as CmdSpec), targets: [target] };
        drafts.push(...engine.submit(command));
        continue;
      }
      break;
    }
    trace.steps.push(lines());
    trace.events.push([...events, ...tokens(drafts)]);
    observe?.(engine, step); // read-only: the decision loop above ended on a 'waiting' (or the battle is over)
  }
  return { trace, world };
}
