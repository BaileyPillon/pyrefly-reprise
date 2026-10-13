/**
 * Rig for `parity-ffx-engine-death.test.ts` (re-parity RC5 lane FFX-D; **FFX only**): generated multi-hit actions against party members and monsters
 * with the statuses a KO touches, a real engine context built around them, and an **independent oracle** of what the game's death check does.
 *
 * The oracle restates `FFX-G02` sections 3.1, 3.2, 3.7 and 3.12 in its own terms (plain arrays of hit amounts and sets of status ids) and imports
 * nothing from `src/battle/ffx/kernel/`, `adapt/` or the engine's `hp.ts`: it works from the facts of the run (the damage events the engine emitted,
 * hit by hit) and decides what the target must look like afterwards and WHEN the KO may happen. Damage itself is not the oracle's business; a probe
 * run of the same action on the same seed against a target that cannot die tells the generator what each hit deals, so it can aim a target's HP at
 * the first hit, the last hit, exactly zero, or short of it.
 */

import type { AbilityDef, BattleState, FFXCombatant, StatusId, StatusInstance } from '../../../src/battle/common/types.ts';
import { makeFfxRng } from '../../../src/battle/ffx/adapt/streams.ts';
import { FFXContentRegistry } from '../../../src/battle/ffx/registry.ts';
import { resolveAbility } from '../../../src/battle/ffx/index.ts';
import { makeActorRuntime, type Ctx, type FFXRuntime } from '../../../src/battle/ffx/state.ts';
import type { SeededRng } from '../../../src/battle/common/rng.ts';
import { abilityOfSpec, lcg } from './ffxTargetBoard.ts';

export { lcg };

/** The statuses the oracle follows (the rest of the engine's statuses are not part of this rule). */
export const WATCHED: readonly StatusId[] = ['zombie', 'scan', 'poison', 'regen', 'haste', 'auto-life'];

export interface TargetSpec {
  id: string;
  side: 'party' | 'enemy';
  /** Which hit the target's HP is aimed at (1 to the action's hit count), and how: it dies exactly on it, with a margin, or survives them all. */
  aim: 'survive' | 'exact' | 'margin';
  aimHit: number;
  margin: number;
  /** Statuses the target starts with. */
  statuses: { zombie: boolean; scan: boolean; poison: boolean; regen: boolean; haste: boolean; autoLife: 'none' | 'cast' | 'fayth' };
  /** Double HP: the base maximum, doubled while it is on. */
  doubleHp: boolean;
  baseMax: number;
  /** A monster's overkill threshold, as a multiple of the first hit's value (0.5 to 6). */
  thresholdMul: number;
}

export interface Scenario {
  seed: number;
  power: number;
  hits: number;
  /** One target (an attack) or every enemy of the attacker (a sweep). */
  kind: 'attack' | 'sweep';
  /** The blow also inflicts Zombie (derived from its own statuses). */
  zombifyBlow: boolean;
  /** A target is the user's enemy: a party member for a monster attacker, a monster for a party attacker. */
  targetsAreMonsters: boolean;
  targets: TargetSpec[];
}

/** A random scenario. */
export function randomScenario(r: ReturnType<typeof lcg>, i: number): Scenario {
  const monsters = r.chance(0.4);
  const count = r.chance(0.35) ? r.int(2, 3) : 1;
  const targets: TargetSpec[] = [];
  for (let k = 0; k < count; k++) {
    const aim = r.pick(['survive', 'exact', 'exact', 'margin', 'margin', 'margin'] as const);
    targets.push({
      id: monsters ? `monster${k}` : (['yuna', 'auron', 'kimahri'] as const)[k]!,
      side: monsters ? 'enemy' : 'party',
      aim,
      aimHit: 0, // set by the generator once the hits are known
      margin: r.int(0, 400),
      statuses: {
        zombie: r.chance(0.35),
        scan: r.chance(0.3),
        poison: r.chance(0.2),
        regen: r.chance(0.2),
        haste: r.chance(0.2),
        autoLife: monsters ? 'none' : r.pick(['none', 'none', 'cast', 'cast', 'fayth'] as const),
      },
      doubleHp: !monsters && r.chance(0.3),
      baseMax: r.pick([900, 1200, 2000, 3000, 4800] as const),
      thresholdMul: r.pick([0.5, 1, 1.5, 2, 3, 6] as const),
    });
  }
  const hits = r.pick([1, 2, 3, 4, 6, 9] as const);
  for (const t of targets) t.aimHit = r.int(1, hits);
  return {
    seed: 1000 + i,
    power: r.pick([1, 2, 5, 10, 25, 60] as const),
    hits,
    kind: count > 1 ? 'sweep' : 'attack',
    zombifyBlow: r.chance(0.25),
    targetsAreMonsters: monsters,
    targets,
  };
}

function instance(id: StatusId, over: Partial<StatusInstance> = {}): StatusInstance {
  return { id, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false, ...over };
}

export interface Run {
  ctx: Ctx;
  user: FFXCombatant;
  targets: FFXCombatant[];
  events: Array<Record<string, unknown>>;
  def: AbilityDef;
  chosen: string[];
}

/** The ability of a scenario: a physical blow of `hits` hits, optionally also inflicting Zombie. */
function abilityOf(s: Scenario): AbilityDef {
  const base = abilityOfSpec({ kind: s.kind, hits: s.hits });
  return { ...base, power: s.power, statusEffects: s.zombifyBlow ? [{ status: 'zombie', chance: 254, duration: 254 }] : [] } as AbilityDef;
}

/** What the generator aims a run with: each target's HP and each monster's overkill threshold, by target id. */
export interface Aim {
  hps: Record<string, number>;
  thresholds: Record<string, number>;
}

/**
 * A context around a scenario. The user is on the other side from the targets; a bystander keeps the party non-empty when the targets are monsters' victims.
 */
export function buildRun(s: Scenario, aim: Partial<Aim> = {}): Run {
  const rng = makeFfxRng(s.seed);
  const fighters: FFXCombatant[] = [];
  const mk = (id: string, side: 'party' | 'enemy', over: Partial<FFXCombatant> & { maxHp: number }): FFXCombatant => {
    const { maxHp, ...rest } = over;
    return {
      id,
      name: id,
      side,
      spriteKey: id,
      hp: maxHp,
      mp: 100,
      stats: { hp: maxHp, mp: 100, str: 20, def: 20, mag: 20, mdef: 20, agi: 20, luck: 20, eva: 0, acc: 100, maxHp, maxMp: 100 },
      statuses: {},
      affinities: {},
      immunities: {},
      immunityFlags: [],
      controller: side === 'party' ? 'player' : 'ai',
      alive: true,
      removed: false,
      slot: 0,
      flags: {},
      learnedAbilityIds: [],
      ...rest,
    } as FFXCombatant;
  };
  const userSide = s.targetsAreMonsters ? 'party' : 'enemy';
  const user = mk(s.targetsAreMonsters ? 'tidus' : 'boss', userSide, { maxHp: 9999 }); // a party member needs one of the game's slots
  fighters.push(user);
  const targets: FFXCombatant[] = [];
  const poolBase = new Map<string, number>();
  for (const t of s.targets) {
    const max = t.doubleHp ? t.baseMax * 2 : t.baseMax;
    const c = mk(t.id, t.side, { maxHp: max });
    c.hp = aim.hps?.[t.id] ?? max;
    if (t.side === 'enemy') {
      c.enemy = {
        aiScriptId: 'none',
        forms: [],
        formIndex: 0,
        rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: aim.thresholds?.[t.id] ?? 0x7fffffff, drops: [] },
      } as never;
    }
    const st = t.statuses;
    if (st.zombie) c.statuses['zombie'] = instance('zombie');
    if (st.scan) c.statuses['scan'] = instance('scan');
    if (st.poison) c.statuses['poison'] = instance('poison');
    if (st.regen) c.statuses['regen'] = instance('regen', { turnsRemaining: 5 });
    if (st.haste) c.statuses['haste'] = instance('haste', { turnsRemaining: 5 });
    if (st.autoLife === 'cast') c.statuses['auto-life'] = instance('auto-life');
    if (st.autoLife === 'fayth') c.statuses['auto-life'] = instance('auto-life', { permanent: true, turnsRemaining: 255 });
    if (t.doubleHp) {
      c.statuses['max-hp-x2'] = instance('max-hp-x2');
      poolBase.set(c.id, t.baseMax);
    }
    targets.push(c);
    fighters.push(c);
  }
  if (!s.targetsAreMonsters) fighters.push(mk('wakka', 'party', { maxHp: 5000 }));
  const party = fighters.filter((c) => c.side === 'party');
  const state: BattleState = {
    game: 'ffx',
    combatants: Object.fromEntries(fighters.map((c) => [c.id, c])),
    activeIds: party.map((c) => c.id),
    reserveIds: [],
    enemyIds: fighters.filter((c) => c.side === 'enemy').map((c) => c.id),
    aeonId: null, turn: 1, ticks: 0, log: [], nextSeq: 0, triggers: [], firedTriggerIds: [], result: null, seed: s.seed, flags: {},
  };
  const rt: FFXRuntime = {
    actors: new Map(), currentActorId: null, elapsedTicks: 0, lastEnemyActorId: null, pendingMinigame: null, elapsedMs: 0,
    finished: false, aeonStoredGauge: new Map(), frozenPartyCtb: new Map(), aeonRoster: new Map(), inventory: new Map(), gil: 0,
    chained: false, overkilled: [], canEscape: false, sensedIds: new Set(), pendingPartRevivals: [], progress: { bestEnemyHp: 0, atTurn: 0 },
    coverBond: [0, 0, 0, 0, 0, 0, 0, 0],
  };
  for (const c of fighters) {
    const a = makeActorRuntime(c);
    if (poolBase.has(c.id)) a.poolBaseHp = poolBase.get(c.id) as number;
    rt.actors.set(c.id, a);
  }
  const events: Array<Record<string, unknown>> = [];
  const ctx: Ctx = {
    state,
    rt,
    rng: rng as unknown as SeededRng,
    content: new FFXContentRegistry(),
    emit: (event) => {
      const full = { ...event, seq: state.nextSeq++ };
      state.log.push(full as never);
      events.push(full as never);
    },
  };
  return { ctx, user, targets, events, def: abilityOf(s), chosen: s.kind === 'attack' ? [targets[0]!.id] : [] };
}

/** What each hit dealt to each target (the generator's probe: full HP, an overkill threshold nothing reaches), by target id. */
export function probe(s: Scenario): Record<string, number[]> {
  const run = buildRun(s);
  runAction(run);
  return amountsOf(run);
}

export function runAction(run: Run): void {
  resolveAbility(run.ctx, run.user, run.def, run.chosen);
}

export function amountsOf(run: Run): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const t of run.targets) out[t.id] = [];
  for (const e of run.events) if (e['type'] === 'damage' && out[e['targetId'] as string] !== undefined) (out[e['targetId'] as string] as number[]).push(e['amount'] as number);
  return out;
}

/** Aim every target's HP and threshold using the probe's hit values: HP dies exactly on `aimHit`, with a margin inside that hit, or survives. */
export function aimedAt(s: Scenario, hitsDealt: Record<string, number[]>): Aim {
  const hps: Record<string, number> = {};
  const thresholds: Record<string, number> = {};
  for (const t of s.targets) {
    thresholds[t.id] = Math.max(1, Math.round(t.thresholdMul * ((hitsDealt[t.id] ?? [])[0] ?? 100)));
    const a = hitsDealt[t.id] ?? [];
    const max = t.doubleHp ? t.baseMax * 2 : t.baseMax;
    const total = a.reduce((x, y) => x + y, 0);
    if (a.length === 0 || t.aim === 'survive') {
      hps[t.id] = Math.min(max, Math.max(1, total + 1 + t.margin));
      continue;
    }
    const j = Math.min(t.aimHit, a.length);
    const cum = a.slice(0, j).reduce((x, y) => x + y, 0);
    const back = t.aim === 'exact' ? 0 : Math.min(t.margin, Math.max(0, (a[j - 1] as number) - 1));
    hps[t.id] = Math.min(max, Math.max(1, cum - back));
  }
  return { hps, thresholds };
}

// ---------------------------------------------------------------------------------------------------- the oracle

export interface Expect {
  /** The target ends the action dead / revived by Auto-Life / alive and untouched by death. */
  fate: 'alive' | 'dead' | 'revived';
  hp: number;
  /** The watched statuses it ends with. */
  statuses: StatusId[];
  /** Whether Critical must be on (a revived target at a quarter of its maximum). */
  critical: boolean | null;
  /** The monster is marked overkilled. */
  overkilled: boolean;
  /** The index of the one damage event that must carry the Overkill flag, or null for none. */
  overkillHit: number | null;
}

/**
 * What the game's death check leaves, from the facts of the run: the hits' values on this target in order, its HP before the action, the statuses it started
 * with, and the blow's riders. Restates FFX-G02 3.1, 3.2, 3.7 and 3.12.
 */
export function oracle(t: TargetSpec, hp0: number, hits: readonly number[], blowZombifies: boolean, threshold: number): Expect {
  const cum: number[] = [];
  let run = 0;
  for (const h of hits) cum.push((run += h));
  const total = run;
  const monster = t.side === 'enemy';
  const dies = hp0 - total <= 0;
  // The first hit after which the target is at 0 HP with the action's running total at the threshold (the event that carries the Overkill flag).
  let overkillHit: number | null = null;
  if (monster) {
    for (let j = 0; j < hits.length; j++) {
      const atZero = hp0 - (cum[j] as number) <= 0;
      if (!atZero || (cum[j] as number) < threshold) continue;
      const earlier = j > 0 && hp0 - (cum[j - 1] as number) <= 0 && (cum[j - 1] as number) >= threshold;
      if (!earlier && (hits[j] as number) > 0) {
        overkillHit = j;
        break;
      }
    }
  }
  const startWith: StatusId[] = [];
  if (t.statuses.zombie || blowZombifies) startWith.push('zombie');
  if (t.statuses.scan) startWith.push('scan');
  if (t.statuses.poison) startWith.push('poison');
  if (t.statuses.regen) startWith.push('regen');
  if (t.statuses.haste) startWith.push('haste');
  if (t.statuses.autoLife !== 'none') startWith.push('auto-life');
  if (!dies) {
    const left = hp0 - total;
    return { fate: 'alive', hp: left, statuses: startWith, critical: null, overkilled: false, overkillHit: null };
  }
  const overkilled = monster && total >= threshold;
  if (t.statuses.autoLife === 'none') return { fate: 'dead', hp: 0, statuses: [], critical: false, overkilled, overkillHit };
  const base = t.baseMax; // the quarter is taken from the maximum the reset gives back: the base, not the doubled pool
  const hp = Math.max(1, Math.floor(base / 4));
  return {
    fate: 'revived',
    hp,
    statuses: t.statuses.autoLife === 'fayth' ? ['auto-life'] : [],
    critical: hp * 2 < base,
    overkilled: false,
    overkillHit: null,
  };
}
