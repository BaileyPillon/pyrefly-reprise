/**
 * Angra Mainyu at the Bikanel excavation camp (FFX-2 Chapter 5, the hidden chapter): the three scripts and the fight in the real engine. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `src/battle/ffx2/ai/angra-mainyu.ts` is **not the game's script** (none was read, `research/ffx2-angra-mainyu.md` §0.2): it is the written sources' description put in order (§4.1, `[inferred]`) with
 * estimated odds (§4.2). What this file pins is that the model does what the research says it does, so a verified script can replace it line for line:
 *
 * 1. **The decision table** (a stub context, exact draws): his first turn is Perdition's Flame and so is every seventh of his turns after the last, while both arms stand; a fallen arm is raised with
 *    Full-Life (Tawrich first) while he has the MP, and he drains a girl with Osmose while he lacks it; an arm down holds the Flame, and the revive turns count toward its clock; otherwise Demi, Flare
 *    or Curaga by `random() mod 3`, any he cannot pay for becoming Osmose; the arms' rolls (Tawrich one in three, Zarich one in five and the element by `random() mod 4`).
 * 2. **The real engine**: the Flame opens the fight and spreads its ten hits over the girls hit by hit; each hit is 3/16 of the girl's maximum HP times her chain, halved by Protect; Darkness reaches all
 *    three and passes both guards, while the plain Attack misses Zarich and Drain misses Tawrich as immune; a raised arm stands at full HP with its guard; Osmose is absorbed; with no arm falling the
 *    Flame keeps its clock exactly; no Flame is chosen with an arm down, and one chosen with both up goes off even if an arm falls during its charge; the battle ends when the body falls, whoever stands.
 */
import { describe, expect, it } from 'vitest';

import type { BattleEvent, Command } from '../../../src/battle/common/types.ts';
import type { Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { mem, setMem } from '../../../src/battle/ffx2/internal.ts';
import { ANGRA_MP, FLAME_EVERY, SINCE_FLAME } from '../../../src/battle/ffx2/ai/angra-mainyu.ts';
import { ANGRA_ABILITY, ANGRA_ID, ANGRA_SCRIPT, TAWRICH_ABILITY, TAWRICH_ID, TAWRICH_SCRIPT, ZARICH_ABILITY, ZARICH_ID, ZARICH_SCRIPT } from '../../../src/data/angra-mainyu-ids.ts';
import { ANGRA_HP, ARM_HP } from '../../../src/data/ffx2/enemies/angra-mainyu.ts';
import { bench, enemy, type Bench } from '../helpers/ffx2ScriptRig.ts';
import { driveAngra, type Input } from '../helpers/angraDrive.ts';
import { chainBefore } from '../../../src/battle/ffx2/chain.ts';
import type { FFX2Combatant } from '../../../src/battle/common/types.ts';

type Ev = BattleEvent & { targetId?: string; sourceId?: string; amount?: number; hitIndex?: number; hitCount?: number; multiplier?: number; status?: string; partId?: string; name?: string; reason?: string; actorId?: string; abilityId?: string; cause?: string };
const GIRLS = ['yuna', 'rikku', 'paine'];
const FLAME = ANGRA_ABILITY.perditionsFlame;

function board(): { b: Bench; tawrich: Ffx2Unit; zarich: Ffx2Unit } {
  const tawrich = enemy(TAWRICH_ID, ARM_HP, { mp: 9999, slot: 1 });
  const zarich = enemy(ZARICH_ID, ARM_HP, { mp: 9999, slot: 2 });
  return { b: bench(enemy(ANGRA_ID, ANGRA_HP, { mp: 9999 }), ANGRA_SCRIPT, [tawrich, zarich]), tawrich, zarich };
}
const down = (u: Ffx2Unit): void => void Object.assign(u, { alive: false, hp: 0 });
const up = (u: Ffx2Unit): void => void Object.assign(u, { alive: true, hp: u.stats.maxHp });
const act = (b: Bench, ...values: number[]): [string | null, string[]] => {
  const c = b.poll(...values);
  return [b.id(c), b.targets(c)];
};

describe('his turn (a stub context, exact draws)', () => {
  it('his first turn is Perdition\'s Flame with both arms up: no draw, the callout as it is chosen, the clock back to nothing', () => {
    const { b } = board();
    expect(act(b)).toEqual([FLAME, []]);
    expect(b.rng.calls).toHaveLength(0);
    expect(mem(b.self, SINCE_FLAME)).toBe(0);
    expect(b.events).toEqual([{ type: 'charge', enemyId: ANGRA_ID, name: "Perdition's Flame", turnsLeft: 0, stage: 2 }]);
  });

  it('then Demi, Flare or Curaga by random() mod 3 (Flare draws its girl; Demi takes every girl, Curaga himself), and the Flame again on the seventh turn after the last', () => {
    const { b } = board();
    act(b);
    const seen: Array<[string | null, string[]]> = [];
    const draws: number[] = [];
    for (const values of [[0], [1, 2], [2], [3], [4, 0], [5]]) {
      const before = b.rng.calls.length;
      seen.push(act(b, ...values));
      draws.push(b.rng.calls.length - before);
    }
    expect(seen).toEqual([
      [ANGRA_ABILITY.demi, []], [ANGRA_ABILITY.flare, ['paine']], [ANGRA_ABILITY.curaga, [ANGRA_ID]],
      [ANGRA_ABILITY.demi, []], [ANGRA_ABILITY.flare, ['yuna']], [ANGRA_ABILITY.curaga, [ANGRA_ID]],
    ]);
    expect(draws).toEqual([1, 2, 1, 1, 2, 1]);
    expect(FLAME_EVERY).toBe(7);
    expect(act(b)).toEqual([FLAME, []]);
  });

  it('a fallen arm is raised with Full-Life, Tawrich first when both are down, with no draw; short of the MP he drains a girl with Osmose instead', () => {
    const { b, tawrich, zarich } = board();
    setMem(b.self, SINCE_FLAME, 0);
    down(tawrich);
    down(zarich);
    expect(act(b)).toEqual([ANGRA_ABILITY.fullLife, [TAWRICH_ID]]);
    expect(b.rng.calls).toHaveLength(0);
    up(tawrich);
    expect(act(b)).toEqual([ANGRA_ABILITY.fullLife, [ZARICH_ID]]);
    b.self.mp = ANGRA_MP.fullLife - 1;
    expect(act(b, 1)).toEqual([ANGRA_ABILITY.osmose, ['rikku']]);
    b.self.mp = ANGRA_MP.fullLife;
    expect(act(b)).toEqual([ANGRA_ABILITY.fullLife, [ZARICH_ID]]);
  });

  it('an arm down holds the Flame even when it is due; every revive turn counts toward its clock, so it comes on the first turn both arms stand again', () => {
    const { b, zarich } = board();
    act(b);
    down(zarich);
    for (let turn = 1; turn <= FLAME_EVERY + 1; turn++) expect(act(b)[0], `turn ${turn}`).toBe(ANGRA_ABILITY.fullLife); // nothing resolves in the stub: the arm stays down
    expect(mem(b.self, SINCE_FLAME)).toBe(FLAME_EVERY + 1);
    up(zarich);
    expect(act(b)).toEqual([FLAME, []]);
    expect(mem(b.self, SINCE_FLAME)).toBe(0);
  });

  it('a spell he cannot pay for becomes Osmose on a random girl (Demi 10 MP, Flare 54, Curaga 20); with exactly the cost he casts it', () => {
    for (const [roll, cost, spell] of [[0, ANGRA_MP.demi, ANGRA_ABILITY.demi], [1, ANGRA_MP.flare, ANGRA_ABILITY.flare], [2, ANGRA_MP.curaga, ANGRA_ABILITY.curaga]] as const) {
      const short = board().b;
      setMem(short.self, SINCE_FLAME, 0);
      short.self.mp = cost - 1;
      expect(act(short, roll, 2), spell).toEqual([ANGRA_ABILITY.osmose, ['paine']]);
      const paid = board().b;
      setMem(paid.self, SINCE_FLAME, 0);
      paid.self.mp = cost;
      expect(act(paid, roll, 2)[0], spell).toBe(spell);
    }
  });
});

describe('the arms\' turns (a stub context, exact draws)', () => {
  it('Tawrich: Bloody Breath on every girl when random() mod 3 is 0, else Punch on a random girl', () => {
    const t = bench(enemy(TAWRICH_ID, ARM_HP, { mp: 9999, slot: 1 }), TAWRICH_SCRIPT);
    expect([act(t, 0), act(t, 1, 2), act(t, 3), act(t, 5, 0)]).toEqual([
      [TAWRICH_ABILITY.bloodyBreath, []], [TAWRICH_ABILITY.punch, ['paine']], [TAWRICH_ABILITY.bloodyBreath, []], [TAWRICH_ABILITY.punch, ['yuna']],
    ]);
  });

  it('Zarich: Glimmer of Despair on every girl when random() mod 5 is 0; 1 or 2 an -ara spell, 3 or 4 an -aga spell, the element by random() mod 4, on a random girl', () => {
    const z = bench(enemy(ZARICH_ID, ARM_HP, { mp: 9999, slot: 2 }), ZARICH_SCRIPT);
    expect([act(z, 0), act(z, 1, 0, 1), act(z, 2, 3, 2), act(z, 3, 1, 0), act(z, 4, 6, 1), act(z, 5)]).toEqual([
      [ZARICH_ABILITY.glimmer, []], [ZARICH_ABILITY.ara[0], ['rikku']], [ZARICH_ABILITY.ara[3], ['paine']], [ZARICH_ABILITY.aga[1], ['yuna']], [ZARICH_ABILITY.aga[2], ['rikku']], [ZARICH_ABILITY.glimmer, []],
    ]);
  });

  it('no living girl, no move, for all three', () => {
    for (const b of [board().b, bench(enemy(TAWRICH_ID, ARM_HP, { slot: 1 }), TAWRICH_SCRIPT), bench(enemy(ZARICH_ID, ARM_HP, { slot: 2 }), ZARICH_SCRIPT)]) {
      for (const g of b.girls) g.alive = false;
      expect(b.poll()).toBeNull();
    }
  });
});

/** Every Flame of a log, as its ten (or fewer) damage events. */
function flames(log: readonly Ev[]): Ev[][] {
  const out: Ev[][] = [];
  for (const e of log) {
    if (e.type !== 'damage' || e.sourceId !== ANGRA_ID || e.hitCount !== 10) continue;
    if (e.hitIndex === 0) out.push([]);
    out.at(-1)?.push(e);
  }
  return out;
}
/** His second action has begun, so his first (the opening Flame) has resolved in full. */
const firstFlameDone = (engine: { state(): { log: readonly BattleEvent[] } }): boolean =>
  (engine.state().log as readonly Ev[]).filter((e) => e.type === 'action-start' && e.actorId === ANGRA_ID).length >= 2;

describe('the fight in the real engine', () => {
  it('opens on Perdition\'s Flame, called out as it is chosen: ten hits planned over the girls, the split drawn hit by hit; a girl who falls takes no more of hers', () => {
    const splits = new Set<string>();
    let whole = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const r = driveAngra('advisor', seed, { until: firstFlameDone });
      const log = r.log as readonly Ev[];
      expect(r.order[0], `seed ${seed}`).toBe(FLAME);
      expect(log.findIndex((e) => e.type === 'charge' && e.name === "Perdition's Flame")).toBeLessThan(log.findIndex((e) => e.type === 'action-start' && e.actorId === ANGRA_ID));
      const hits = flames(log)[0]!;
      const indices = hits.map((h) => h.hitIndex!);
      expect(indices.every((n, k) => n >= 0 && n < 10 && (k === 0 || n > indices[k - 1]!)), `seed ${seed}: ${indices.join(',')}`).toBe(true);
      expect(hits.every((h) => GIRLS.includes(h.targetId!))).toBe(true);
      if (hits.length === 10) whole += 1;
      else {
        const from = log.indexOf(hits[0]!);
        const to = log.findIndex((e, i) => i > from && e.type === 'action-start' && e.actorId === ANGRA_ID);
        expect(log.slice(from, to).some((e) => e.type === 'ko' && GIRLS.includes(e.targetId!)), `seed ${seed}: ${hits.length} hits, and no girl fell`).toBe(true);
      }
      splits.add(GIRLS.map((g) => hits.filter((h) => h.targetId === g).length).join('/'));
    }
    expect(whole).toBeGreaterThan(0);
    expect(splits.size, [...splits].join(' ')).toBeGreaterThan(1);
  });

  it('each hit is 3/16 of the girl\'s maximum HP times her chain, halved by Protect: pinned on every hit at chain x1, with Protect up and without, and her later hits never land lighter', () => {
    const checked = { protect: 0, bare: 0 };
    for (const [line, seed] of [['advisor', 3], ['advisor', 1], ['naive', 5], ['naive', 2]] as const) {
      const r = driveAngra(line, seed, { until: firstFlameDone });
      const log = r.log as readonly Ev[];
      const protect = new Set<string>();
      for (let i = 0; i < log.length; i++) {
        const e = log[i]!;
        if (e.type === 'status-add' && e.status === 'protect') protect.add(e.targetId!);
        if (e.type === 'status-remove' && e.status === 'protect') protect.delete(e.targetId!);
        if (e.type !== 'damage' || e.sourceId !== ANGRA_ID || e.hitCount !== 10) continue;
        const chain = log[i - 1]!;
        expect([chain.type, chain.targetId]).toEqual(['chain', e.targetId]);
        if (chain.multiplier !== 1) continue;
        const base = Math.floor((r.engine.state().combatants[e.targetId!]!.stats.maxHp * 3) / 16);
        const on = protect.has(e.targetId!);
        expect(e.amount, `${line} ${seed} ${e.targetId} hit ${e.hitIndex}`).toBe(on ? Math.floor(base / 2) : base);
        checked[on ? 'protect' : 'bare'] += 1;
      }
      for (const g of GIRLS) {
        const amounts = flames(log)[0]!.filter((h) => h.targetId === g).map((h) => h.amount!);
        for (let k = 1; k < amounts.length; k++) expect(amounts[k]!, `${line} ${seed} ${g}`).toBeGreaterThanOrEqual(amounts[k - 1]!);
      }
    }
    expect(checked.protect).toBeGreaterThan(0);
    expect(checked.bare).toBeGreaterThan(0);
  });

  it('Darkness reaches all three and passes both guards; the plain Attack misses Zarich and Drain misses Tawrich as immune, and each lands on the other arm', () => {
    const aim = (d: Input, kind: string, id: string | null, target: string): Command | null => {
      const row = d.commands.find((c) => c.enabled && c.command.kind === kind && (id === null || ('id' in c.command && c.command.id === id)) && c.validTargets.includes(target));
      return row ? ({ ...row.command, targets: [target] } as Command) : null;
    };
    const turns = { rikku: 0, paine: 0 };
    const plan = (d: Input): Command | null => {
      if (d.actorId !== 'rikku' && d.actorId !== 'paine') return null;
      const n = turns[d.actorId]++;
      if (d.actorId === 'rikku') return n === 0 ? aim(d, 'ability', 'x2-dark-knight-drain', TAWRICH_ID) : n === 1 ? aim(d, 'ability', 'x2-dark-knight-drain', ZARICH_ID) : null;
      return n === 0 ? aim(d, 'attack', null, ZARICH_ID) : n === 1 ? aim(d, 'attack', null, TAWRICH_ID) : null;
    };
    /** The targets the first Darkness struck: its caster's hits after it began. */
    const darknessStruck = (log: readonly Ev[]): Set<string> => {
      const at = log.findIndex((e) => e.type === 'action-start' && e.abilityId === 'x2-dark-knight-darkness');
      if (at < 0) return new Set();
      const by = log[at]!.actorId!;
      const end = log.findIndex((e, i) => i > at && e.type === 'action-start' && e.actorId === by);
      return new Set(log.slice(at, end < 0 ? undefined : end).filter((e) => e.type === 'damage' && e.sourceId === by && (e.amount ?? 0) > 0).map((e) => e.targetId!));
    };
    const r = driveAngra('advisor', 7, { plan, until: (e) => turns.rikku >= 3 && turns.paine >= 3 && darknessStruck(e.state().log as readonly Ev[]).size === 3 });
    const log = r.log as readonly Ev[];
    const immune = log.filter((e) => e.type === 'miss' && e.reason === 'immune').map((e) => `${e.sourceId}>${e.targetId}`);
    expect(immune).toEqual(expect.arrayContaining([`rikku>${TAWRICH_ID}`, `paine>${ZARICH_ID}`]));
    const landed = (src: string, target: string): boolean => log.some((e) => e.type === 'damage' && e.sourceId === src && e.targetId === target && (e.amount ?? 0) > 0);
    expect(landed('rikku', ZARICH_ID), 'Drain lands on Zarich').toBe(true);
    expect(landed('paine', TAWRICH_ID), 'the Attack lands on Tawrich').toBe(true);
    expect(darknessStruck(log)).toEqual(new Set([ANGRA_ID, TAWRICH_ID, ZARICH_ID]));
  });

  it('a raised arm stands at full HP with its guard: the guard outlives the fall, and only his Full-Life raises it', () => {
    const r = driveAngra('advisor', 3, { until: (e) => (e.state().log as readonly Ev[]).some((x) => x.type === 'part-restored') });
    const log = r.log as readonly Ev[];
    const restored = log.find((e) => e.type === 'part-restored')!;
    const revive = log.find((e) => e.type === 'revive' && e.targetId === restored.partId)!;
    expect(revive.cause).toBe(ANGRA_ABILITY.fullLife);
    const arm = r.engine.state().combatants[restored.partId!]!;
    expect([arm.alive, arm.hp]).toEqual([true, ARM_HP]);
    const guard = arm.id === TAWRICH_ID ? 'null-magic' : 'null-physical';
    expect(Object.keys(arm.statuses)).toEqual([guard]);
  });

  it('with no MP he drains the girls with Osmose, absorbed (her loss is his gain), until he can pay for Full-Life', () => {
    const r = driveAngra('advisor', 2, { bodyMp: 0, until: (e) => (e.state().log as readonly Ev[]).some((x) => x.type === 'action-start' && x.abilityId === ANGRA_ABILITY.fullLife) });
    expect(r.order[0]).toBe(FLAME);
    expect(r.order[1]).toBe(ANGRA_ABILITY.osmose);
    expect(r.order.at(-1)).toBe(ANGRA_ABILITY.fullLife);
    const log = r.log as readonly Ev[];
    const drained = log.flatMap((e, i) => (e.type === 'mp-damage' && e.sourceId === ANGRA_ID ? [[e, log[i + 1]!] as const] : []));
    expect(drained.length).toBeGreaterThan(0);
    for (const [loss, gain] of drained) expect([gain.type, gain.targetId, gain.amount]).toEqual(['mp-heal', ANGRA_ID, loss.amount]);
    expect(drained.reduce((n, [loss]) => n + loss.amount!, 0)).toBeGreaterThanOrEqual(ANGRA_MP.fullLife);
  });

  it('with no arm falling (the girls swing at the body) the Flame keeps its clock exactly: his 1st, 8th, 15th... turns, and no Full-Life', () => {
    let longest = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const r = driveAngra('swing', seed);
      expect(r.armFalls, `seed ${seed}`).toBe(0);
      const at = r.order.flatMap((id, i) => (id === FLAME ? [i] : []));
      expect(at, `seed ${seed}`).toEqual(at.map((_, k) => k * FLAME_EVERY));
      expect(r.moves[ANGRA_ABILITY.fullLife] ?? 0).toBe(0);
      longest = Math.max(longest, at.length);
    }
    expect(longest).toBeGreaterThanOrEqual(3);
  });

  it('no Flame is chosen while an arm is down; one chosen with both up goes off even if an arm falls during its charge (research §4.1, the poster\'s reading)', () => {
    let fellDuringCharge = 0;
    let charges = 0;
    for (let seed = 1; seed <= 8; seed++) {
      const down = new Set<string>();
      let charging = false;
      let fell = false;
      for (const e of driveAngra('advisor', seed).log as readonly Ev[]) {
        if (e.type === 'part-destroyed') {
          down.add(e.partId!);
          if (charging) fell = true;
        }
        if (e.type === 'part-restored') down.delete(e.partId!);
        if (e.type === 'charge' && e.name === "Perdition's Flame") {
          expect(down.size, `seed ${seed}: chosen with an arm down`).toBe(0);
          charges += 1;
          charging = true;
          fell = false;
        }
        if (e.type === 'damage' && e.sourceId === ANGRA_ID && e.hitCount === 10 && e.hitIndex === 0) {
          if (fell) fellDuringCharge += 1;
          charging = false;
        }
      }
    }
    expect(charges).toBeGreaterThan(8);
    expect(fellDuringCharge).toBeGreaterThan(0);
  });

  it('the move preview shows each girl what ONE hit of Perdition\'s Flame does to her (3/16 of her maximum HP, halved by Protect), not the volley divided back, which stopped at her HP', () => {
    type Row = { targetId: string; amount: number };
    type Probe = { moveName: string; randomTarget?: { rows: Row[]; perHit: boolean; hits: number } | null };
    const probe = (e: { intent(): unknown }): Probe | null => e.intent() as Probe | null;
    const r = driveAngra('swing', 1, { until: (e) => probe(e)?.moveName === "Perdition's Flame" });
    const intent = probe(r.engine)!;
    expect(intent.moveName).toBe("Perdition's Flame");
    expect([intent.randomTarget?.perHit, intent.randomTarget?.hits]).toEqual([true, 10]);
    const rows = intent.randomTarget!.rows;
    expect(rows.map((x) => x.targetId).sort()).toEqual([...GIRLS].sort());
    let exact = 0;
    for (const row of rows) {
      const girl = r.engine.state().combatants[row.targetId] as FFX2Combatant;
      if (chainBefore(girl) !== 0) continue; // a girl still in a chain takes more: pinned below for the rest
      const base = Math.floor((girl.stats.maxHp * 3) / 16);
      expect(row.amount, row.targetId).toBe(girl.statuses['protect'] !== undefined ? Math.floor(base / 2) : base);
      exact += 1;
    }
    expect(exact).toBeGreaterThan(0);
  });

  it('the battle ends when the body falls, whoever stands: victory with both arms up, and his rewards paid (5,000 EXP, 30 AP, 5,000 gil, the Ribbon)', () => {
    const r = driveAngra('advisor', 4, { bodyHp: 2_500 });
    expect(r.outcome).toBe('victory');
    const c = r.engine.state().combatants;
    expect([c[ANGRA_ID]!.hp, c[TAWRICH_ID]!.alive, c[ZARICH_ID]!.alive]).toEqual([0, true, true]);
    expect(r.result).toMatchObject({ exp: 5_000, ap: 30, gil: 5_000, drops: [{ itemId: 'ribbon', count: 1 }] });
  });
});
