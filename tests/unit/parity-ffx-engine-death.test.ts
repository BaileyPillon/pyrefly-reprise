/**
 * The FFX engine's KO rules against an independent oracle (re-parity RC5 lane FFX-D; **FFX only**; FFX-G02 sections 3.1, 3.2, 3.7 and 3.12).
 *
 * Four rules, each proved on generated multi-hit actions through the engine's own `resolveAbility`, and on a few hand-worked cases:
 *
 *  1. **A KO clears Zombie and Scan** (and everything else but Death; the answer to PR-0217 / D-214). The list of statuses that survive is checked against
 *     the KO-reset kernel for every status the engine can hold.
 *  2. **The death check runs after the target's last hit**, not at the first hit that reaches 0 HP: the KO event follows every damage event of its target,
 *     and the statuses stay on the body (Auto-Life included) until then.
 *  3. **Auto-Life is removed at the moment of death** and its revive is a quarter of the maximum the reset gives back (a Double HP pool is undone first);
 *     a cast Auto-Life is spent, a fayth's stays.
 *  4. **Overkill is the damage of the whole action**: a monster is overkilled when the action's HP damage to it reaches its threshold, even when no hit does.
 *
 * `helpers/ffxEngineDeath.ts` is the oracle; it imports nothing from the kernels, the adapters or `hp.ts`. The generated actions aim each target's HP at the
 * first hit, a middle hit, the last hit, exactly zero or a margin short of a hit, with the blow sometimes zombifying the target itself.
 */

import { describe, expect, it } from 'vitest';
import type { StatusId } from '../../src/battle/common/types.ts';
import { SURVIVES_KO } from '../../src/battle/ffx/statuses.ts';
import { BUFF_STATUS_BIT, EXTRA_STATUS_BIT, PERM_STATUS_IDS, STACK_STATUS_IDS, TEMPORAL_STATUS_IDS } from '../../src/battle/ffx/adapt/status.ts';
import { koReset, type KoChr } from '../../src/battle/ffx/kernel/death-check.ts';
import {
  WATCHED,
  aimedAt,
  amountsOf,
  buildRun,
  lcg,
  oracle,
  probe,
  randomScenario,
  runAction,
  type Scenario,
} from './helpers/ffxEngineDeath.ts';

const SCENARIOS = Number(process.env['PYREFLY_DEATH_SCENARIOS'] ?? 1200);

/** Play a scenario: the probe tells what each hit deals, the aim sets each target's HP and threshold, the real run is judged by the oracle. */
function play(s: Scenario): { problems: string[]; tally: Record<string, number> } {
  const problems: string[] = [];
  const tally: Record<string, number> = {};
  const bump = (k: string): void => {
    tally[k] = (tally[k] ?? 0) + 1;
  };
  const aim = aimedAt(s, probe(s));
  const run = buildRun(s, aim);
  const start = new Map(run.targets.map((c) => [c.id, c.hp] as const));
  runAction(run);
  const dealt = amountsOf(run);
  for (const t of s.targets) {
    const c = run.targets.find((x) => x.id === t.id)!;
    const hits = dealt[t.id] ?? [];
    const threshold = aim.thresholds[t.id] as number;
    const want = oracle(t, start.get(t.id) as number, hits, s.zombifyBlow, threshold);
    const label = `scenario seed ${s.seed} ${t.id} (${t.aim}@${t.aimHit}, ${hits.length} hits ${JSON.stringify(hits)}, hp0 ${start.get(t.id)}, threshold ${threshold}, auto-life ${t.statuses.autoLife}, double ${t.doubleHp})`;
    const mine = run.events.filter((e) => e['targetId'] === t.id);
    const lastDamage = Math.max(-1, ...mine.filter((e) => e['type'] === 'damage').map((e) => e['seq'] as number));
    const kos = mine.filter((e) => e['type'] === 'ko');
    const revives = mine.filter((e) => e['type'] === 'revive');
    const check = (ok: boolean, what: string): void => {
      if (!ok) problems.push(`${label}: ${what}`);
    };
    check(hits.length === s.hits, `expected ${s.hits} hits, saw ${hits.length}`);
    check(c.hp === want.hp, `hp ${c.hp}, wanted ${want.hp} (${want.fate})`);
    const watched = (Object.keys(c.statuses) as StatusId[]).filter((id) => WATCHED.includes(id)).sort();
    check(JSON.stringify(watched) === JSON.stringify([...want.statuses].sort()), `statuses ${JSON.stringify(watched)}, wanted ${JSON.stringify([...want.statuses].sort())}`);
    // nothing about the death may happen before the target's last hit
    const early = mine.filter(
      (e) =>
        (e['type'] === 'ko' || e['type'] === 'revive' || (e['type'] === 'status-remove' && (e['reason'] === 'ko' || e['reason'] === 'consumed'))) &&
        (e['seq'] as number) < lastDamage,
    );
    check(early.length === 0, `${early.map((e) => `${String(e['type'])}:${String(e['status'] ?? '')}`).join(',')} came before the last hit`);
    if (want.fate === 'alive') {
      check(c.alive && kos.length === 0 && revives.length === 0, 'a survivor was killed or revived');
    } else if (want.fate === 'dead') {
      check(!c.alive && kos.length === 1 && revives.length === 0, `dead: alive ${c.alive}, ko events ${kos.length}, revives ${revives.length}`);
      check(Object.keys(c.statuses).every((id) => id === 'ko' || id === 'eject'), `a corpse carries ${Object.keys(c.statuses).join(',')}`);
    } else {
      check(c.alive && kos.length === 0 && revives.length === 1, `revived: alive ${c.alive}, ko events ${kos.length}, revives ${revives.length}`);
      const cause = revives[0]?.['cause'];
      check(cause === (t.statuses.autoLife === 'fayth' ? 'fayth' : 'auto-life'), `revive cause ${String(cause)}`);
      // a cast Auto-Life is spent (the engine says "consumed"); a fayth's is wiped by the reset and put back by the revive
      const spent = mine.find((e) => e['type'] === 'status-remove' && e['status'] === 'auto-life');
      if (t.statuses.autoLife === 'cast') check(spent?.['reason'] === 'consumed', `a cast Auto-Life was removed as ${String(spent?.['reason'])}, not consumed`);
      check((c.statuses['critical'] !== undefined) === want.critical, `critical ${c.statuses['critical'] !== undefined}, wanted ${String(want.critical)}`);
    }
    if (t.side === 'enemy') {
      check(run.ctx.rt.overkilled.includes(t.id) === want.overkilled, `overkilled ${run.ctx.rt.overkilled.includes(t.id)}, wanted ${want.overkilled}`);
      const flagged = mine.filter((e) => e['type'] === 'damage').map((e, i) => (e['overkill'] === true ? i : -1)).filter((i) => i >= 0);
      check(JSON.stringify(flagged) === JSON.stringify(want.overkillHit === null ? [] : [want.overkillHit]), `overkill-flagged hits ${JSON.stringify(flagged)}, wanted ${String(want.overkillHit)}`);
    }
    // what the sample reached
    bump(want.fate);
    if (want.fate !== 'alive' && hits.length > 1) {
      const cum = (n: number): number => hits.slice(0, n).reduce((a, b) => a + b, 0);
      if ((start.get(t.id) as number) - cum(hits.length - 1) <= 0) bump('died-before-the-last-hit');
    }
    if (want.fate === 'dead' && (t.statuses.zombie || t.statuses.scan || s.zombifyBlow)) bump('corpse-had-zombie-or-scan');
    if (want.fate === 'revived' && t.doubleHp) bump('revived-from-double-hp');
    if (want.overkilled) {
      bump('overkilled');
      if (hits.every((h) => h < threshold)) bump('overkilled-by-the-sum-only');
    }
    if (t.side === 'enemy' && want.fate === 'dead' && !want.overkilled) bump('monster-killed-not-overkilled');
  }
  return { problems, tally };
}

describe('the engine against the oracle, on generated actions', () => {
  it(`${SCENARIOS} actions: KO timing, Zombie and Scan, Auto-Life and Overkill all equal the oracle's`, () => {
    const r = lcg(20261012);
    const problems: string[] = [];
    const tally: Record<string, number> = {};
    for (let i = 0; i < SCENARIOS; i++) {
      const out = play(randomScenario(r, i));
      problems.push(...out.problems);
      for (const [k, v] of Object.entries(out.tally)) tally[k] = (tally[k] ?? 0) + v;
    }
    expect(problems.slice(0, 5)).toEqual([]);
    // the sample must reach each branch or the replay proves less than it says
    expect(tally['alive']).toBeGreaterThan(100);
    expect(tally['dead']).toBeGreaterThan(100);
    expect(tally['revived']).toBeGreaterThan(50);
    expect(tally['died-before-the-last-hit']).toBeGreaterThan(50);
    expect(tally['corpse-had-zombie-or-scan']).toBeGreaterThan(50);
    expect(tally['revived-from-double-hp']).toBeGreaterThan(5);
    expect(tally['overkilled']).toBeGreaterThan(30);
    expect(tally['overkilled-by-the-sum-only']).toBeGreaterThan(5);
    expect(tally['monster-killed-not-overkilled']).toBeGreaterThan(30);
  }, 300_000);
});

describe('which statuses a KO keeps, for every status the engine can hold', () => {
  // The kernel is the game's reset; only two engine markers are not words of it: `ko` (the check sets Death again) and `eject` (the separate ejected flag).
  const MARKERS: readonly StatusId[] = ['ko', 'eject'];

  function kept(set: (c: { perm: number; counters: number[]; extra: number; stacks: number[]; buff: number }) => void): boolean {
    const c = { perm: 0, counters: new Array<number>(13).fill(0), extra: 0, stacks: new Array<number>(6).fill(0), buff: 0 };
    set(c);
    const chr: KoChr = { ...c, hp: 0, mp: 0, maxHp: 100, maxMp: 100, baseHp: 100, baseMp: 100, autoB: 0 };
    const after = koReset(chr, 0);
    return after.perm !== 0 || after.extra !== 0 || after.counters.some((x) => x !== 0) || after.stacks.some((x) => x !== 0) || after.buff !== 0;
  }

  const every: Array<[StatusId, boolean]> = [];
  PERM_STATUS_IDS.forEach((id, i) => every.push([id, kept((c) => (c.perm = 1 << i))]));
  TEMPORAL_STATUS_IDS.forEach((id, i) => every.push([id, kept((c) => (c.counters[i] = 255))]));
  for (const [id, bit] of Object.entries(EXTRA_STATUS_BIT) as Array<[StatusId, number]>) every.push([id, kept((c) => (c.extra = bit))]);
  STACK_STATUS_IDS.forEach((id, i) => every.push([id, kept((c) => (c.stacks[i] = 3))]));
  for (const [id, bit] of Object.entries(BUFF_STATUS_BIT) as Array<[StatusId, number]>) every.push([id, kept((c) => (c.buff = bit))]);

  it('the kernel keeps nothing but the Death bit the check sets again', () => {
    // Death itself (permanent bit 0) is cleared by the reset and put back by the check; every other word is cleared.
    for (const [id, keeps] of every) expect(keeps, id).toBe(false);
    expect(every.length).toBeGreaterThan(40);
  });

  it('SURVIVES_KO is the two markers and nothing else: Zombie and Scan are cleared like the rest', () => {
    expect([...SURVIVES_KO].sort()).toEqual([...MARKERS].sort());
    expect(SURVIVES_KO).not.toContain('zombie');
    expect(SURVIVES_KO).not.toContain('scan');
    for (const [id] of every) expect(SURVIVES_KO.includes(id), id).toBe(MARKERS.includes(id));
  });
});

describe('hand-worked cases', () => {
  const base: Omit<Scenario, 'targets'> = { seed: 4242, power: 25, hits: 4, kind: 'attack', zombifyBlow: false, targetsAreMonsters: false };
  const ally = (over: Partial<Scenario['targets'][number]> = {}): Scenario['targets'][number] => ({
    id: 'yuna',
    side: 'party',
    aim: 'exact',
    aimHit: 1,
    margin: 0,
    statuses: { zombie: false, scan: false, poison: false, regen: false, haste: false, autoLife: 'none' },
    doubleHp: false,
    baseMax: 2000,
    thresholdMul: 1,
    ...over,
  });

  it('a target that reaches 0 HP on the first of four hits is still on its feet for the other three, then dies once', () => {
    const s: Scenario = { ...base, targets: [ally({ aim: 'exact', aimHit: 1, statuses: { zombie: true, scan: true, poison: false, regen: false, haste: false, autoLife: 'none' } })] };
    const aim = aimedAt(s, probe(s));
    const run = buildRun(s, aim);
    runAction(run);
    const dmg = run.events.filter((e) => e['type'] === 'damage');
    const ko = run.events.filter((e) => e['type'] === 'ko');
    expect(dmg.length).toBe(4);
    expect(ko.length).toBe(1);
    expect(ko[0]!['seq'] as number).toBeGreaterThan(dmg[3]!['seq'] as number);
    const c = run.targets[0]!;
    expect(c.alive).toBe(false);
    expect(c.statuses['zombie']).toBeUndefined();
    expect(c.statuses['scan']).toBeUndefined();
    expect(c.statuses['ko']).toBeDefined();
  });

  it('Auto-Life stays on the body until the last hit, then the revive is a quarter of the maximum, from the base when Double HP is undone', () => {
    // base 2000 doubled to 4000: the quarter is 500 (of the base), not 1000 (of the doubled pool)
    const s: Scenario = { ...base, targets: [ally({ aim: 'exact', aimHit: 1, doubleHp: true, baseMax: 2000, statuses: { zombie: false, scan: false, poison: false, regen: false, haste: false, autoLife: 'cast' } })] };
    const aim = aimedAt(s, probe(s));
    const run = buildRun(s, aim);
    runAction(run);
    const dmg = run.events.filter((e) => e['type'] === 'damage');
    const spent = run.events.find((e) => e['type'] === 'status-remove' && e['status'] === 'auto-life');
    const revive = run.events.find((e) => e['type'] === 'revive');
    expect(dmg.length).toBe(4);
    expect(spent!['seq'] as number).toBeGreaterThan(dmg[3]!['seq'] as number);
    expect(revive!['seq'] as number).toBeGreaterThan(dmg[3]!['seq'] as number);
    const c = run.targets[0]!;
    expect(c.hp).toBe(500);
    expect(c.stats.maxHp).toBe(2000);
    expect(c.statuses['auto-life']).toBeUndefined();
    expect(c.statuses['max-hp-x2']).toBeUndefined();
    expect(c.alive).toBe(true);
  });

  it('a fayth\'s permanent Auto-Life survives the revive; a cast one does not', () => {
    for (const [kind, stays] of [['fayth', true], ['cast', false]] as const) {
      const s: Scenario = { ...base, targets: [ally({ aim: 'exact', aimHit: 2, statuses: { zombie: true, scan: false, poison: false, regen: false, haste: false, autoLife: kind } })] };
      const run = buildRun(s, aimedAt(s, probe(s)));
      runAction(run);
      const c = run.targets[0]!;
      expect(c.alive, kind).toBe(true);
      expect(c.statuses['auto-life'] !== undefined, kind).toBe(stays);
      expect(c.statuses['zombie'], kind).toBeUndefined();
    }
  });

  it('a monster is overkilled by the action\'s total when no single hit reaches the threshold, and not when the total falls short', () => {
    const mon = (thresholdMul: number): Scenario => ({
      ...base,
      targetsAreMonsters: true,
      hits: 4,
      targets: [ally({ id: 'monster0', side: 'enemy', aim: 'exact', aimHit: 4, thresholdMul })],
    });
    // threshold = first hit x thresholdMul: 3 x the first hit is reached by hits 1..3 together and by no one hit
    const s3 = mon(3);
    const dealt = probe(s3)['monster0']!;
    expect(Math.max(...dealt)).toBeLessThan(3 * dealt[0]!);
    const run = buildRun(s3, aimedAt(s3, { monster0: dealt }));
    runAction(run);
    expect(run.ctx.rt.overkilled).toContain('monster0');
    const flagged = run.events.filter((e) => e['type'] === 'damage').map((e) => e['overkill'] === true);
    expect(flagged.filter(Boolean).length).toBe(1);
    // a threshold above the whole action's damage: dead, not overkilled
    const sBig = mon(60);
    const runBig = buildRun(sBig, aimedAt(sBig, { monster0: dealt }));
    runAction(runBig);
    expect(runBig.targets[0]!.alive).toBe(false);
    expect(runBig.ctx.rt.overkilled).not.toContain('monster0');
  });

  it('a single-hit action still kills at the one hit', () => {
    const s: Scenario = { ...base, hits: 1, targets: [ally({ aim: 'exact', aimHit: 1 })] };
    const run = buildRun(s, aimedAt(s, probe(s)));
    runAction(run);
    expect(run.events.filter((e) => e['type'] === 'ko').length).toBe(1);
    expect(run.targets[0]!.alive).toBe(false);
  });
});
