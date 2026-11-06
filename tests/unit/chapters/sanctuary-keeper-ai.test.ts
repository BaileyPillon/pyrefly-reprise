/**
 * The Sanctuary Keeper's script (FFX only; `src/battle/ffx/ai/sanctuary-keeper.ts`): the rules pinned to the interpreter's exact tallies in the note (`research/re-ffx-sanctuary-keeper.md` 4.2 and 4.3) and run on the real engine.
 * The cycle order, the nine override cases of the support move, the sweep fuse's distribution (all 65,536 stream-2 values), the phase lines, the Slow answer and the self-attack exclusion.
 */

import { describe, expect, it } from 'vitest';

import {
  BREATH_MAG,
  CYCLE_LENGTH,
  SK_COUNT_FLAG,
  SK_CYCLE_FLAG,
  SK_PHASE_FLAG,
  SUPPORT_MAG,
  SWEEP_FUSE_BASE,
  SWEEP_FUSE_MODULUS,
  advancePhase,
  phaseLines,
  phaseOf,
  supportMoveOf,
} from '../../../src/battle/ffx/ai/sanctuary-keeper-rules.ts';
import { peekReactions, takeReaction } from '../../../src/battle/ffx/ai/hooks.ts';
import { runOnHit } from '../../../src/battle/ffx/ai/hooks.ts';
import { buildWith } from '../helpers/sanctuaryBot.ts';
import { KEEPER, actor, ctxOf, flags, give, has, inputFor, keeper, keeperActions, keeperStarts, newEngine, nextInput, runDefending, defend, row, swing } from '../helpers/sanctuaryDrive.ts';

const WITH_LULU = buildWith(['tidus', 'yuna', 'lulu']);

describe('the cycle is six turns with no randomness in its order (RE 4.2)', () => {
  it('Photon Wings, Attack, Attack, Mana Breath, then two support turns, twice over, from the very first turn', () => {
    const engine = newEngine(1);
    runDefending(engine, (e) => keeperActions(e).length >= 14);
    const acts = keeperActions(engine).slice(0, 14);
    const cycle = ['sanctuary-photon-wings', 'attack', 'attack', 'sanctuary-mana-breath', 'curaga', 'curaga'];
    expect(acts).toEqual([...cycle, ...cycle, ...cycle.slice(0, 2)]);
  });

  it('is the same for every seed (the order draws nothing; only the targets do)', () => {
    for (const seed of [2, 3, 4, 5, 6]) {
      const engine = newEngine(seed);
      runDefending(engine, (e) => keeperActions(e).length >= 6);
      expect(keeperActions(engine).slice(0, 6), `seed ${seed}`).toEqual(['sanctuary-photon-wings', 'attack', 'attack', 'sanctuary-mana-breath', 'curaga', 'curaga']);
    }
  });

  it('Photon Wings is aimed at the whole front line, the breath and the Attacks at one living member', () => {
    const engine = newEngine(2);
    runDefending(engine, (e) => keeperActions(e).length >= 4);
    const starts = keeperStarts(engine);
    expect([...starts[0]!.targets].sort()).toEqual(['auron', 'tidus', 'yuna']);
    for (const s of starts.slice(1, 4)) expect(s.targets, s.id).toHaveLength(1);
  });

  it('the first Attack goes to the member with the most HP', () => {
    const engine = newEngine(4);
    runDefending(engine, (e) => keeperActions(e).length >= 1); // Photon Wings is done
    // Yuna is the healthiest by a mile; the others are high enough to live through whatever comes. The party is no longer topped up, so the Keeper meets these numbers.
    for (const id of engine.state().activeIds) {
      const c = actor(engine, id);
      c.stats.maxHp = 99_999;
      c.hp = id === 'yuna' ? 99_999 : 40_000;
    }
    let guard = 0;
    while (keeperActions(engine).length < 2 && guard++ < 50) {
      nextInput(engine, false);
      engine.submit(defend());
    }
    expect(keeperStarts(engine)[1]).toMatchObject({ id: 'attack', targets: ['yuna'] });
  });

  it('MAG is 180 on a support turn and 40 on every other (RE 4.2): the Curaga heals 9,750 to 9,999 on every seed, and the record\'s MAG is 40', () => {
    expect(SUPPORT_MAG).toBe(180);
    expect(BREATH_MAG).toBe(40);
    const heals: number[] = [];
    for (let seed = 1; seed <= 24; seed++) {
      const engine = newEngine(seed);
      keeper(engine).hp = 20_000;
      runDefending(engine, (e) => keeperActions(e).length >= 5);
      const log = engine.state().log as ReadonlyArray<{ type: string; targetId?: string; amount?: number; sourceId?: string }>;
      for (const e of log) if (e.type === 'damage' && e.targetId === KEEPER && e.sourceId === KEEPER && (e.amount ?? 0) < 0) heals.push(-(e.amount as number));
      expect(keeper(engine).stats.mag === SUPPORT_MAG || keeper(engine).stats.mag === BREATH_MAG).toBe(true);
    }
    expect(heals.length).toBeGreaterThanOrEqual(24);
    expect(Math.min(...heals)).toBeGreaterThanOrEqual(9_750);
    expect(Math.max(...heals)).toBe(9_999);
  });

  it('wraps: the state flag counts 0 to 5 and the Keeper uses nothing else', () => {
    const engine = newEngine(7);
    runDefending(engine, (e) => keeperActions(e).length >= 13);
    expect(new Set(keeperActions(engine))).toEqual(new Set(['sanctuary-photon-wings', 'attack', 'sanctuary-mana-breath', 'curaga']));
    expect(flags(engine)[SK_CYCLE_FLAG]).toBe(keeperActions(engine).length % CYCLE_LENGTH);
  });
});

describe('the support move: the nine override cases (RE 4.2 step 2, each later rule beating the one before)', () => {
  /** The pending support move after `setup` has put the Keeper and the party in a state. */
  function pending(setup: (engine: ReturnType<typeof newEngine>) => void): { id: string; targets: string[] } {
    const engine = newEngine(3);
    setup(engine);
    const move = supportMoveOf(ctxOf(engine), keeper(engine));
    return { id: move.id, targets: [...move.targets] };
  }

  it('1. nothing wrong: Curaga on itself', () => {
    expect(pending(() => undefined)).toEqual({ id: 'curaga', targets: [KEEPER] });
  });

  it('2. under a quarter and no Regen: Regen on itself; with Regen already on it, Curaga', () => {
    expect(pending((e) => { ctxOf(e).state.flags[SK_PHASE_FLAG] = 3; })).toEqual({ id: 'regen', targets: [KEEPER] });
    expect(pending((e) => { ctxOf(e).state.flags[SK_PHASE_FLAG] = 3; give(keeper(e), 'regen'); })).toEqual({ id: 'curaga', targets: [KEEPER] });
    expect(pending((e) => { ctxOf(e).state.flags[SK_PHASE_FLAG] = 2; }).id).toBe('curaga'); // under a half is not under a quarter
  });

  it('3. Poison on it: Esuna on itself (and Darkness does the same)', () => {
    expect(pending((e) => give(keeper(e), 'poison'))).toEqual({ id: 'esuna', targets: [KEEPER] });
    expect(pending((e) => give(keeper(e), 'darkness'))).toEqual({ id: 'esuna', targets: [KEEPER] });
  });

  it('4. Esuna beats Regen: poisoned under a quarter, it cures first', () => {
    expect(pending((e) => { ctxOf(e).state.flags[SK_PHASE_FLAG] = 3; give(keeper(e), 'poison'); }).id).toBe('esuna');
  });

  it('5. Armor Break on it and no Protect: Protect on itself; with Protect already on it, the move before (Curaga)', () => {
    expect(pending((e) => give(keeper(e), 'armor-break'))).toEqual({ id: 'protect', targets: [KEEPER] });
    expect(pending((e) => { give(keeper(e), 'armor-break'); give(keeper(e), 'protect'); }).id).toBe('curaga');
  });

  it('6. Protect beats Esuna and Regen', () => {
    expect(pending((e) => { ctxOf(e).state.flags[SK_PHASE_FLAG] = 3; give(keeper(e), 'poison'); give(keeper(e), 'armor-break'); }).id).toBe('protect');
  });

  it('7. Reflect on it, a half or less, and a front-line member holding Reflect: the pending move is aimed at THAT member (so it bounces off), whatever the move is', () => {
    const base = (e: ReturnType<typeof newEngine>): void => { give(keeper(e), 'reflect'); give(actor(e, 'yuna'), 'reflect'); ctxOf(e).state.flags[SK_PHASE_FLAG] = 2; };
    expect(pending(base)).toEqual({ id: 'curaga', targets: ['yuna'] });
    expect(pending((e) => { base(e); give(keeper(e), 'poison'); })).toEqual({ id: 'esuna', targets: ['yuna'] });
    expect(pending((e) => { base(e); give(keeper(e), 'armor-break'); })).toEqual({ id: 'protect', targets: ['yuna'] });
    expect(pending((e) => { base(e); ctxOf(e).state.flags[SK_PHASE_FLAG] = 3; })).toEqual({ id: 'regen', targets: ['yuna'] });
  });

  it('8. Reflect on it, a half or less, and nobody holding Reflect: Reflect on the lowest-HP front-line member', () => {
    const m = pending((e) => { give(keeper(e), 'reflect'); ctxOf(e).state.flags[SK_PHASE_FLAG] = 2; actor(e, 'tidus').hp = 900; });
    expect(m).toEqual({ id: 'reflect', targets: ['tidus'] });
    const n = pending((e) => { give(keeper(e), 'reflect'); ctxOf(e).state.flags[SK_PHASE_FLAG] = 3; give(keeper(e), 'poison'); actor(e, 'auron').hp = 100; });
    expect(n).toEqual({ id: 'reflect', targets: ['auron'] });
  });

  it('9. Reflect on it above a half does nothing special: the Curaga bounces on its own (the engine\'s target builder), the script does not aim it', () => {
    expect(pending((e) => { give(keeper(e), 'reflect'); give(actor(e, 'yuna'), 'reflect'); ctxOf(e).state.flags[SK_PHASE_FLAG] = 1; })).toEqual({ id: 'curaga', targets: [KEEPER] });
    expect(pending((e) => { give(actor(e, 'yuna'), 'reflect'); ctxOf(e).state.flags[SK_PHASE_FLAG] = 3; }).targets).toEqual([KEEPER]); // the holder alone, without Reflect on the Keeper, changes nothing (Regen on itself)
  });
});

describe('the phase lines (RE 4.3 step 3)', () => {
  it('are 30,000, 20,000 and 10,000 of 40,000, strictly below', () => {
    expect(phaseLines(40_000)).toEqual([30_000, 20_000, 10_000]);
    const engine = newEngine(1);
    const k = keeper(engine);
    const at = (hp: number): number => { k.hp = hp; return advancePhase(ctxOf(engine), k); };
    expect(at(40_000)).toBe(0);
    expect(at(30_000)).toBe(0); // equal is not below
    expect(at(29_999)).toBe(1);
    expect(at(20_000)).toBe(1);
    expect(at(19_999)).toBe(2);
    expect(at(10_000)).toBe(2);
    expect(at(9_999)).toBe(3);
  });

  it('one hit can run several blocks (30,001 to 19,999 is phase 2), and the phase never falls when it is healed', () => {
    const engine = newEngine(1);
    const k = keeper(engine);
    k.hp = 19_999;
    expect(advancePhase(ctxOf(engine), k)).toBe(2);
    k.hp = 40_000;
    expect(advancePhase(ctxOf(engine), k)).toBe(2);
    k.hp = 9_999;
    expect(advancePhase(ctxOf(engine), k)).toBe(3);
    k.hp = 40_000;
    expect(advancePhase(ctxOf(engine), k)).toBe(3);
  });

  it('on the engine: the phase flag follows the Keeper\'s HP at its own turn start (Poison moves it) and after a hit', () => {
    const engine = newEngine(5);
    keeper(engine).hp = 25_000;
    runDefending(engine, (e) => keeperActions(e).length >= 1);
    expect(phaseOf(ctxOf(engine))).toBe(1); // preTurn ran the phase moves
    const d = inputFor(engine, 'tidus');
    keeper(engine).hp = 20_050;
    engine.submit(swing(d)!);
    nextInput(engine);
    expect(phaseOf(ctxOf(engine))).toBeGreaterThanOrEqual(1);
  });
});

describe('the sweep fuse: the exact distribution (RE 4.3 and the note\'s tally over all 65,536 stream-2 values)', () => {
  /** P(the sweep fires first at counted hit k): the count must exceed BASE + (draw mod MODULUS), a fresh draw each hit. */
  function firstFireDistribution(): number[] {
    const fires = (hit: number): number => {
      let n = 0;
      for (let raw = 0; raw <= 0xffff; raw++) if (hit > SWEEP_FUSE_BASE + (raw % SWEEP_FUSE_MODULUS)) n++;
      return n / 65_536;
    };
    const out: number[] = [];
    let alive = 1;
    for (let hit = 1; hit <= 8; hit++) {
      const q = fires(hit);
      out.push(alive * q);
      alive *= 1 - q;
    }
    return out;
  }

  it('never before the 3rd counted hit, then 20.00, 32.00, 28.80, 15.36 and 3.84 percent on the 3rd to the 7th, never after the 7th', () => {
    const p = firstFireDistribution();
    expect(p[0]).toBe(0);
    expect(p[1]).toBe(0);
    expect(p.slice(2, 7).map((x) => Math.round(x * 10_000) / 100)).toEqual([20, 32, 28.8, 15.36, 3.84]);
    expect(p[7]).toBe(0);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it('the mean is 4.51 counted hits', () => {
    const p = firstFireDistribution();
    const mean = p.reduce((a, x, i) => a + x * (i + 1), 0);
    expect(Math.round(mean * 100) / 100).toBe(4.51);
  });

  it('on the engine hook: the sweep is queued on the 3rd to the 7th counted action, in the right shares over 4,000 trials, and the count is 0 after each', () => {
    const engine = newEngine(1);
    const ctx = ctxOf(engine);
    const k = keeper(engine);
    const tidus = actor(engine, 'tidus');
    const swingDef = ctx.content.ability('attack')!;
    const used = { def: swingDef, user: tidus };
    const report = { hpBefore: 40_000, lostHp: true, lastDamage: 100, affectsHp: true };
    const fires = new Map<number, number>();
    const trials = 4_000;
    for (let trial = 0; trial < trials; trial++) {
      let calls = 0;
      for (;;) {
        calls++;
        runOnHit(ctx, used, k, report);
        const queued = peekReactions(ctx);
        if (queued.length > 0) {
          expect(queued).toHaveLength(1);
          expect((queued[0] as { command: { id?: string } }).command.id).toBe('sanctuary-tail-sweep');
          while (takeReaction(ctx) !== undefined);
          break;
        }
        expect(calls).toBeLessThan(8); // never after the 7th
      }
      expect(flags(engine)[SK_COUNT_FLAG]).toBe(0);
      fires.set(calls, (fires.get(calls) ?? 0) + 1);
    }
    for (const calls of fires.keys()) expect(calls).toBeGreaterThanOrEqual(3);
    const share = (n: number): number => ((fires.get(n) ?? 0) / trials) * 100;
    expect(share(3)).toBeGreaterThan(17);
    expect(share(3)).toBeLessThan(23);
    expect(share(4)).toBeGreaterThan(29);
    expect(share(4)).toBeLessThan(35);
    expect(share(5)).toBeGreaterThan(26);
    expect(share(5)).toBeLessThan(32);
    expect(share(6)).toBeGreaterThan(13);
    expect(share(6)).toBeLessThan(18);
    expect(share(7)).toBeGreaterThan(2);
    expect(share(7)).toBeLessThan(6);
  });
});

describe('what counts toward the fuse (RE 4.3 item 4: the command\'s damage class includes HP) and what does not', () => {
  const count = (engine: ReturnType<typeof newEngine>): number => (typeof flags(engine)[SK_COUNT_FLAG] === 'number' ? (flags(engine)[SK_COUNT_FLAG] as number) : 0);

  it('an Attack counts; Cheer, Reflect and Scan (no HP in their class) do not; Bio does not (the note: casting Bio, Reflect, Protect, Slow counts for nothing)', () => {
    const engine = newEngine(11, WITH_LULU);
    // Lulu first: Scan, then Bio, with the party kept up and nothing cured, then the others.
    let d = inputFor(engine, 'lulu');
    const scan = row(d, 'ability', 'scan', KEEPER);
    if (scan) { engine.submit(scan); nextInput(engine); }
    expect(count(engine)).toBe(0);
    d = inputFor(engine, 'lulu');
    const bio = row(d, 'ability', 'bio', KEEPER);
    if (bio) { engine.submit(bio); nextInput(engine); }
    expect(count(engine)).toBe(0);
    d = inputFor(engine, 'tidus');
    engine.submit(swing(d)!);
    nextInput(engine);
    expect(count(engine)).toBe(1);
  });

  it('a heal counts as well (the class includes HP): a Phoenix Down thrown at nothing does not, but the Keeper\'s own Curaga is excluded by the self rule', () => {
    const engine = newEngine(12);
    keeper(engine).hp = 30_000;
    runDefending(engine, (e) => keeperActions(e).length >= 6);
    expect(keeperActions(engine).filter((a) => a === 'curaga').length).toBe(2);
    expect(count(engine)).toBe(0); // its own Curaga, twice: no count
  });
});

describe('Slow is answered with Haste (RE 4.3 item 2)', () => {
  it('Slow on it: it casts Haste on itself as a counter, before it acts again', () => {
    const engine = newEngine(6);
    const d = inputFor(engine, 'tidus');
    const slow = row(d, 'ability', 'slow', KEEPER);
    expect(slow).not.toBeNull();
    engine.submit(slow!);
    nextInput(engine);
    expect(has(keeper(engine), 'slow')).toBe(false); // Haste took the Slow off
    expect(has(keeper(engine), 'haste')).toBe(true);
    const log = engine.state().log as ReadonlyArray<{ type: string; abilityId?: string; actorId?: string; targets?: string[] }>;
    const haste = log.find((e) => e.type === 'action-start' && e.actorId === KEEPER && e.abilityId === 'haste');
    expect(haste?.targets).toEqual([KEEPER]);
  });

  it('with a Reflect holder in the front line the Haste is aimed at him and bounces onto the Keeper (the guides\' trick)', () => {
    const engine = newEngine(6);
    give(actor(engine, 'yuna'), 'reflect');
    const d = inputFor(engine, 'tidus');
    engine.submit(row(d, 'ability', 'slow', KEEPER)!);
    nextInput(engine);
    const log = engine.state().log as ReadonlyArray<{ type: string; abilityId?: string; actorId?: string; targets?: string[] }>;
    const haste = log.find((e) => e.type === 'action-start' && e.actorId === KEEPER && e.abilityId === 'haste');
    expect(haste?.targets).toEqual(['yuna']);
    expect(has(keeper(engine), 'haste')).toBe(true); // it bounced back to its caster
  });

  it('with no Slow on it, no Haste', () => {
    const engine = newEngine(6);
    runDefending(engine, (e) => keeperActions(e).length >= 6);
    expect(keeperActions(engine)).not.toContain('haste');
  });
});

describe('its own spells are not counted (RE 4.3 item 1)', () => {
  it('Curaga, Regen and the Haste it casts leave the count and the sweep alone', () => {
    const engine = newEngine(8);
    keeper(engine).hp = 5_000; // phase 3: Regen first
    runDefending(engine, (e) => keeperActions(e).length >= 6);
    expect(keeperActions(engine).slice(4, 6)).toEqual(['regen', 'curaga']);
    expect(flags(engine)[SK_COUNT_FLAG] ?? 0).toBe(0);
    expect(keeperActions(engine)).not.toContain('sanctuary-tail-sweep');
  });
});
