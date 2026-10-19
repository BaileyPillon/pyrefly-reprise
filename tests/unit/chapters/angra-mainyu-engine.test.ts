/**
 * Angra Mainyu, Zarich and Tawrich (FFX-2 Chapter 5, the hidden chapter) in the real engine. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `angra-mainyu-ai.test.ts` pins each script on a stub context; this file runs them inside `FFX2Engine` with the chapter's own rows, to see that the pieces meet:
 *
 * 1. **The scripts on their own clocks.** Against an *immortal* party that only defends (a measurement rig, not a chapter: the girls carry Invincible and are topped up at every decision, because Perdition's Flame takes
 *    3/16 of a girl's maximum HP ten times over and no level survives that unaided) the body's 1st, 8th, 23rd, 38th and 53rd action are Perdition's Flame; Zarich opens with Glimmer of Despair and goes round her spells; Tawrich
 *    throws seven Punches and a Bloody Breath.
 * 2. **Perdition's Flame** [RE row 268 and move 0x412d]: ten hits (`percent-total`, power 3) on girls who are up; the first hit on a girl is 3/16 of her maximum HP and later hits ride the chain; Protect halves it, Shell does not.
 * 3. **Glimmer of Despair** [move 0x412a]: MP only, then Strength and Magic down by 1 and Defence and Magic Defence down by 2, on all three girls.
 * 4. **Osmose** [move 0x406d]: 3/16 of each living girl's current MP, which the body drinks; and the body reaches for it as its second action when its own MP is under 200.
 * 5. **The cadence.** The steps from the start of one turn to the start of the next, per move, with the 3 s window (kept by precedent, awaiting Bailey's pick) and without it. They follow from the move rows' costs and each body's
 *    agility (68, 82, 113); the window adds exactly 3 s (90 steps) to every turn.
 */
import { describe, expect, it } from 'vitest';

import type { Command } from '../../../src/battle/common/types.ts';
import type { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { ANGRA_ABILITY as A } from '../../../src/battle/ffx2/ai/angra-mainyu.ts';
import { ABILITIES } from '../../../src/data/ffx2/index.ts';
import { ANGRA_MAINYU_ACTION_TIME_SECONDS } from '../../../src/data/ffx2/enemies/angra-mainyu.ts';
import { X2_ANGRA_MAINYU_ID as BODY } from '../../../src/data/angra-mainyu-ids.ts';
import { commandOf, driveAngra, logOf, nextInput, openAngra, playAngra, startsOf, topUp, type AngraEv, type AngraInput } from '../helpers/angraMainyuDrive.ts';
import { withActionSpanKnobs } from '../../../src/battle/ffx2/action-span.ts';

const GIRLS = ['yuna', 'rikku', 'paine'];
const SPELLS: string[] = [A.firaga, A.waterga, A.thundaga, A.blizzaga];
const ROLL_MOVES: string[] = [A.flare, A.curaga, A.bio, A.demi];
const STEPS_PER_SECOND = 30;

const maxHpOf = (engine: FFX2Engine, id: string): number => (engine.state().combatants[id] as unknown as { stats: { maxHp: number } }).stats.maxHp;
const mpOf = (engine: FFX2Engine, id: string): number => (engine.state().combatants[id] as unknown as { mp: number }).mp;
const isAlive = (engine: FFX2Engine, id: string): boolean => (engine.state().combatants[id] as unknown as { alive: boolean }).alive;

// ------------------------------------------------------------------ 1. the scripts on their own clocks

describe('the three scripts in the real engine, against an immortal party that only defends [RE §9.5, §9.7, §9.8]', () => {
  const runs = [1, 2, 3, 4].map((seed) => driveAngra('defend', seed, { immortal: true, stopWhen: (e) => startsOf(e, BODY) >= 60, maxDecisions: 200_000 }));

  it('the fight is still on after 60 body actions, and nothing stalled on the way', () => {
    for (const run of runs) {
      expect(run.outcome).toBeUndefined();
      expect(run.order.length).toBeGreaterThanOrEqual(60);
    }
  });

  it('the body opens with Perdition\'s Flame and Flames again on its 8th, 23rd, 38th and 53rd action; every other action is one of the roll\'s four moves (no Osmose, Full-Life or Dispel)', () => {
    for (const run of runs) {
      const body = run.order.slice(0, 60);
      expect(body.flatMap((id, i) => (id === A.flame ? [i + 1] : []))).toEqual([1, 8, 23, 38, 53]);
      for (const id of body.filter((m) => m !== A.flame)) expect(ROLL_MOVES).toContain(id);
      expect(new Set(body.filter((m) => m !== A.flame)).size, 'the roll reaches all four moves in 55 turns').toBe(4);
    }
  });

  it('Zarich opens with Glimmer of Despair, then six spells in the rotation Firaga, Waterga, Thundaga, Blizzaga (from the start draw) and Glimmer again', () => {
    const starts = new Set<number>();
    for (const run of runs) {
      const hers = run.zarichOrder;
      expect(hers.length).toBeGreaterThanOrEqual(40);
      expect(hers[0]).toBe(A.glimmer);
      const start = SPELLS.indexOf(hers[1]!);
      expect(start, 'the first spell is one of the four').toBeGreaterThanOrEqual(0);
      starts.add(start);
      let spell = 0;
      hers.forEach((id, i) => {
        if (i % 7 === 0) expect(id, `Zarich's action ${i + 1}`).toBe(A.glimmer);
        else expect(id, `Zarich's action ${i + 1}`).toBe(SPELLS[(start + spell++) % 4]);
      });
    }
    expect(starts.size, 'the start draw differs from seed to seed').toBeGreaterThanOrEqual(2);
  });

  it('Tawrich throws seven Punches and then a Bloody Breath, over and over', () => {
    for (const run of runs) {
      const his = run.tawrichOrder;
      expect(his.length).toBeGreaterThanOrEqual(60);
      his.forEach((id, i) => expect(id, `Tawrich's action ${i + 1}`).toBe(i % 8 === 7 ? A.bloodyBreath : A.punch));
    }
  });
});

// ------------------------------------------------------------------ 2. Perdition's Flame

/** The events of the body's first action (the opening Flame), from its start to its end. */
function firstFlame(engine: FFX2Engine): AngraEv[] {
  const log = logOf(engine);
  const start = log.findIndex((e) => e.type === 'action-start' && e.actorId === BODY);
  const end = log.findIndex((e, i) => i > start && e.type === 'action-end' && e.actorId === BODY);
  return start < 0 || end < 0 ? [] : log.slice(start, end + 1);
}

/** Let the girls answer with `first` once (a curtain, say), then defend, until the opening Flame has landed. */
function openingFlame(seed: number, first?: (d: AngraInput) => Command | null): { engine: FFX2Engine; flame: AngraEv[] } {
  const engine = openAngra(seed);
  let used = false;
  const turn = (d: AngraInput): Command | null => {
    if (used || !first) return null;
    used = true;
    return first(d);
  };
  playAngra(engine, turn, (e) => firstFlame(e).length > 0);
  return { engine, flame: firstFlame(engine) };
}

/** Each hit of the Flame with the girl's maximum HP, the 3/16 of it and the chain multiplier the engine rode it on. */
function flameHits(engine: FFX2Engine, flame: AngraEv[]): Array<{ target: string; amount: number; base: number; multiplier: number; chain: number }> {
  const chains = new Map<string, AngraEv>();
  const out: Array<{ target: string; amount: number; base: number; multiplier: number; chain: number }> = [];
  for (const e of flame) {
    if (e.type === 'chain' && e.targetId) chains.set(e.targetId, e);
    if (e.type === 'damage' && e.hitCount === 10 && e.targetId) {
      const c = chains.get(e.targetId);
      out.push({ target: e.targetId, amount: e.amount ?? 0, base: (maxHpOf(engine, e.targetId) * 3) / 16, multiplier: c?.multiplier ?? 1, chain: c?.count ?? 0 });
    }
  }
  return out;
}

describe('Perdition\'s Flame in the real engine [RE row 268 and move 0x412d: ten hits, percent-total, power 3]', () => {
  it('ten hits are planned (the game picks a girl for each, then strikes round the planned girls); every one lands on a girl who is up, and the strikes stop early only when the girls they were for have fallen', () => {
    for (const seed of [1, 2, 3]) {
      const { flame } = openingFlame(seed);
      expect(flame[0]).toMatchObject({ type: 'action-start', abilityId: A.flame, targets: [] });
      const hits = flame.filter((e) => e.type === 'damage' && e.hitCount === 10);
      expect(hits.map((h) => h.hitIndex), `seed ${seed}`).toEqual(hits.map((_, i) => i));
      expect(hits.length, `seed ${seed}`).toBeLessThanOrEqual(10);
      if (hits.length < 10) expect(flame.filter((e) => e.type === 'ko').length, `seed ${seed}: fewer than ten strikes means a girl fell`).toBeGreaterThanOrEqual(1);
      const down = new Set<string>();
      for (const e of flame) {
        if (e.type === 'ko' && e.targetId) down.add(e.targetId);
        if (e.type === 'damage' && e.hitCount === 10) {
          expect(GIRLS, `seed ${seed}`).toContain(e.targetId);
          expect(down.has(e.targetId!), `seed ${seed}: a hit on ${e.targetId} after the girl fell`).toBe(false);
        }
      }
    }
  });

  it('the first hit on a girl is 3/16 of her maximum HP, and a later hit on her is that times the chain the engine rides (1.45, 1.5, 1.55 on the 2nd, 3rd and 4th)', () => {
    let later = 0;
    for (const seed of [1, 2, 3]) {
      const { engine, flame } = openingFlame(seed);
      const seen = new Set<string>();
      for (const hit of flameHits(engine, flame)) {
        const first = !seen.has(hit.target);
        seen.add(hit.target);
        expect(Math.abs(hit.amount - hit.base * hit.multiplier), `seed ${seed}: ${hit.target} chain ${hit.chain} (${hit.amount} against ${hit.base} x ${hit.multiplier})`).toBeLessThanOrEqual(2);
        if (first) expect(hit.multiplier).toBe(1);
        else {
          later += 1;
          expect(hit.multiplier).toBeCloseTo((hit.chain + 28) / 20, 6);
        }
      }
    }
    expect(later, 'ten planned hits on at most three girls: most are later hits').toBeGreaterThanOrEqual(15);
  });

  it('Protect halves it (a Light Curtain from the first girl to act) and Shell does not (a Lunar Curtain): the Flame is physical', () => {
    const curtain = (id: string) => (d: AngraInput): Command | null => commandOf(d, 'item', id, []);
    for (const seed of [1, 2]) {
      const half = openingFlame(seed, curtain('x2-light-curtain'));
      const shelled = openingFlame(seed, curtain('x2-lunar-curtain'));
      const plain = openingFlame(seed);
      expect(flameHits(half.engine, half.flame).length).toBe(10);
      for (const [label, run, ratio] of [['Protect', half, 0.5], ['Shell', shelled, 1], ['nothing', plain, 1]] as const) {
        const firsts = new Map<string, number>();
        for (const hit of flameHits(run.engine, run.flame)) if (!firsts.has(hit.target)) firsts.set(hit.target, hit.amount / hit.base);
        expect(firsts.size, `seed ${seed} ${label}`).toBeGreaterThanOrEqual(2);
        for (const [girl, got] of firsts) expect(got, `seed ${seed} ${label}: ${girl}'s first hit`).toBeCloseTo(ratio, 1);
      }
    }
  });
});

// ------------------------------------------------------------------ 3. Glimmer of Despair

describe('Glimmer of Despair in the real engine [move 0x412a: magic power 8, MP only, then the four stage drops]', () => {
  it('Zarich\'s first action takes MP from each of the three girls, never HP, and leaves Strength and Magic down by 1 and Defence and Magic Defence down by 2', () => {
    for (const seed of [1, 2, 3]) {
      const engine = openAngra(seed);
      playAngra(engine, () => null, (e) => logOf(e).some((x) => x.type === 'action-end' && x.actorId === 'x2-zarich'));
      const log = logOf(engine);
      const start = log.findIndex((e) => e.type === 'action-start' && e.actorId === 'x2-zarich');
      const end = log.findIndex((e, i) => i > start && e.type === 'action-end' && e.actorId === 'x2-zarich');
      const action = log.slice(start, end + 1).filter((e) => e.sourceId === undefined || e.sourceId === 'x2-zarich');
      expect(action[0]).toMatchObject({ abilityId: A.glimmer, targets: [] });
      expect(action.filter((e) => e.type === 'damage'), `seed ${seed}: no HP damage`).toEqual([]);
      const mp = action.filter((e) => e.type === 'mp-damage');
      expect(mp.map((e) => e.targetId), `seed ${seed}`).toEqual(GIRLS);
      for (const e of mp) expect(e.amount!, `seed ${seed}`).toBeGreaterThan(0);
      for (const girl of GIRLS) {
        const stages = action.filter((e) => e.type === 'status-add' && e.targetId === girl);
        expect(stages.map((e) => [e.status, e.instance?.stacks]), `seed ${seed}: ${girl}`).toEqual([['str-down', 1], ['mag-down', 1], ['def-down', 2], ['mdef-down', 2]]);
      }
    }
  });
});

// ------------------------------------------------------------------ 4. Osmose

interface OsmoseRun {
  order: string[];
  alive: string[];
  before: Record<string, number>;
  after: Record<string, number>;
  bodyBefore: number;
  bodyAfter: number;
  drained: Record<string, number>;
  /** Nothing else touched a girl's MP between the start of Osmose and its end. */
  clean: boolean;
}

/** One fight with the body's MP at 150 and a party that defends, stepped tick by tick until Osmose has resolved. */
function osmoseRun(seed: number): OsmoseRun | null {
  const engine = openAngra(seed);
  (engine.state().combatants[BODY] as unknown as { mp: number }).mp = 150;
  const snap = (): Record<string, number> => Object.fromEntries(GIRLS.map((id) => [id, mpOf(engine, id)]));
  let seen = 0;
  let from = -1;
  let run: OsmoseRun | null = null;
  let done = false;
  const scan = (): void => {
    const log = logOf(engine);
    for (; seen < log.length && !done; seen++) {
      const e = log[seen]!;
      if (e.type === 'action-start' && e.actorId === BODY && e.abilityId === A.osmose && from < 0) {
        from = seen;
        run = { order: [], alive: GIRLS.filter((id) => isAlive(engine, id)), before: snap(), after: {}, bodyBefore: mpOf(engine, BODY), bodyAfter: 0, drained: {}, clean: true };
        run.after = run.before;
      } else if (e.type === 'action-end' && e.actorId === BODY && from >= 0 && run) {
        const mine = log.slice(from, seen + 1).filter((x) => x.type === 'mp-damage');
        run.after = snap();
        run.bodyAfter = mpOf(engine, BODY);
        for (const x of mine) if (x.sourceId === BODY && x.targetId) run.drained[x.targetId] = x.amount ?? 0;
        run.clean = mine.every((x) => x.sourceId === BODY);
        run.order = log.filter((x) => x.type === 'action-start' && x.actorId === BODY).map((x) => x.abilityId!);
        done = true;
        return;
      }
    }
  };
  for (let i = 0; i < 20_000; i++) {
    const d = engine.nextDecision();
    scan();
    if (done || d.kind === 'battle-over') break;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      scan();
      if (done) break;
      continue;
    }
    if (d.kind !== 'player-input') continue;
    engine.submit({ kind: 'defend', targets: [] });
    scan();
    if (done) break;
  }
  return run;
}

describe('Osmose in the real engine [move 0x406d: magic power 3, MP only, absorbed]', () => {
  const runs = [1, 2, 3, 4, 5, 6].map(osmoseRun);

  it('with the body\'s MP under 200 the opening Flame is followed by Osmose, which drains every living girl', () => {
    for (const [i, run] of runs.entries()) {
      expect(run, `seed ${i + 1}`).not.toBeNull();
      expect(run!.order.slice(0, 2), `seed ${i + 1}`).toEqual([A.flame, A.osmose]);
      expect(run!.alive.length, `seed ${i + 1}: someone is left to drain`).toBeGreaterThanOrEqual(1);
      expect(Object.keys(run!.drained).sort(), `seed ${i + 1}`).toEqual([...run!.alive].sort());
    }
  });

  it('each living girl loses 3/16 of her current MP (rounded down) and the body drinks the sum; the move costs it nothing', () => {
    expect(ABILITIES[A.osmose]?.mpCost ?? 0).toBe(0);
    let checked = 0;
    for (const [i, run] of runs.entries()) {
      if (!run!.clean) continue;
      let total = 0;
      for (const girl of run!.alive) {
        const want = Math.floor((run!.before[girl]! * 3) / 16);
        expect(run!.drained[girl], `seed ${i + 1}: ${girl} had ${run!.before[girl]}`).toBe(want);
        expect(run!.after[girl], `seed ${i + 1}: ${girl}`).toBe(run!.before[girl]! - want);
        total += want;
        checked += 1;
      }
      expect(run!.bodyAfter, `seed ${i + 1}`).toBe(run!.bodyBefore + total);
    }
    expect(checked, 'at least five girl-drains were checked exactly').toBeGreaterThanOrEqual(5);
  });
});

// ------------------------------------------------------------------ 5. the cadence

/** Steps from the start of one turn to the start of the next, per body and per move that opened the interval (single-valued in an uninterrupted run). */
function cadence(window: boolean): Record<string, number[]> {
  const engine = openAngra(5, { immortal: true, engine: window ? {} : { actionTimeSeconds: 0 } });
  playAngra(engine, () => null, (e) => startsOf(e, BODY) >= 80, { immortal: true, maxDecisions: 100_000 });
  const turns: Array<{ actor: string; tick: number; ability?: string }> = [];
  for (const e of logOf(engine)) {
    if (e.type === 'turn-start' && e.actorId?.startsWith('x2-')) turns.push({ actor: e.actorId, tick: e.elapsedTicks ?? 0 });
    else if (e.type === 'action-start' && e.actorId?.startsWith('x2-')) {
      const t = [...turns].reverse().find((x) => x.actor === e.actorId && x.ability === undefined);
      if (t) t.ability = e.abilityId;
    }
  }
  const by: Record<string, number[]> = {};
  const last: Record<string, { tick: number; ability?: string }> = {};
  for (const t of turns) {
    const prev = last[t.actor];
    if (prev?.ability) (by[prev.ability] ??= []).push(t.tick - prev.tick);
    last[t.actor] = t;
  }
  return by;
}

describe('the cadence in the real engine: steps from one turn\'s start to the next, per move', () => {
  // Pinned as measured. They follow from each move row\'s costs (charge and recovery, `command-records/angra-mainyu.ts`) and the body\'s agility (68; Zarich 82; Tawrich 113).
  const WITHOUT: Record<string, number> = {
    [A.punch]: 93,
    [A.bloodyBreath]: 185,
    [A.glimmer]: 255,
    [A.firaga]: 90,
    [A.waterga]: 90,
    [A.thundaga]: 90,
    [A.blizzaga]: 90,
    [A.flame]: 337,
    [A.curaga]: 93,
    [A.demi]: 124,
    [A.bio]: 124,
    [A.flare]: 154,
  };

  it('without the animation window every move has one length, whenever it is used', () => {
    const by = cadence(false);
    for (const [ability, steps] of Object.entries(WITHOUT)) {
      expect(by[ability]?.length ?? 0, ability).toBeGreaterThanOrEqual(2);
      expect(new Set(by[ability]), ability).toEqual(new Set([steps]));
    }
  });

  // OLD timeline (r55): this test pins the flat 3 s / no-action-time world, so it runs with the per-command span put back off; the rest of the file runs on production.
  it('with the 3 s window (kept by precedent, awaiting Bailey\'s pick) every turn is exactly 90 steps longer', () => withActionSpanKnobs({ perCommand: false }, () => {
    const window = ANGRA_MAINYU_ACTION_TIME_SECONDS * STEPS_PER_SECOND;
    expect(window).toBe(90);
    const by = cadence(true);
    for (const [ability, steps] of Object.entries(WITHOUT)) {
      expect(by[ability]?.length ?? 0, ability).toBeGreaterThanOrEqual(2);
      expect(new Set(by[ability]), ability).toEqual(new Set([steps + window]));
    }
  }));
});

void nextInput;
void topUp;
