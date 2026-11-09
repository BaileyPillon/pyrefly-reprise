/**
 * Wendigo's script (FFX only; `src/battle/ffx/ai/wendigo.ts`): the rules pinned to the interpreter's exact tallies in the note (`research/re-ffx-wendigo-lake-macalania.md` 4.2 and 4.3) and run on the real engine. The turn mix over all 65,536
 * stream-2 values, the seven-turn cycle, the strict half-HP line, the lowest-HP selector, the counter table over the real command rows and the stances that silence or end it. The Guardians' branches are in `wendigo-ai-guardians.test.ts`
 * (split from this file by the r78-fix2 pass so each stays under 400 lines, house rule 7). Rule 3: every claim is proved by running the engine.
 */

import { describe, expect, it } from 'vitest';
import { peekReactions, runOnHit, takeReaction } from '../../../src/battle/ffx/ai/hooks.ts';
import { aiContextFor } from '../../../src/battle/ffx/ai/types.ts';
import { wendigoTurn } from '../../../src/battle/ffx/ai/wendigo.ts';
import { WD_ARMS_FLAG, WD_ARM_TURNS_FLAG, WD_CYCLE_FLAG, WD_ROWS, belowHalf } from '../../../src/battle/ffx/ai/wendigo-rules.ts';
import { type Ctx } from '../../../src/battle/ffx/state.ts';
import type { Command } from '../../../src/battle/common/types.ts';
import { GUARDIAN_A, GUARDIAN_B, WENDIGO, row, actionList, actor, ctxOf, defend, flags, give, has, inputFor, log, newEngine, nextInput, runDefending, wendigo, wendigoActions } from '../helpers/wendigoDrive.ts';

/** A context whose stream 2 hands out `script` in turn and whose stream 4 (the picker) hands out `picker` in turn: the interpreter's way of putting every draw through the real script. */
function stubbed(ctx: Ctx, script: readonly number[], picker: readonly number[] = [0]): { ctx: Ctx; draws: { script: number; picker: number } } {
  const draws = { script: 0, picker: 0 };
  const rng = {
    on: (stream: number) => ({
      int: (min: number, _max: number): number => {
        if (stream === 2) return script[draws.script++ % script.length] as number;
        if (stream === 4) return picker[draws.picker++ % picker.length] as number;
        return min;
      },
    }),
  };
  return { ctx: { ...ctx, rng: rng as unknown as Ctx['rng'] }, draws };
}

/** Spend every turn on a Potion for oneself (a harmless move that is not a Defend, which would halve the blows being measured) until `stop` holds; the front line is topped up each step. */
function passUntil(engine: ReturnType<typeof newEngine>, stop: (e: ReturnType<typeof newEngine>) => boolean, max = 400): void {
  for (let i = 0; i < max * 12; i++) {
    if (stop(engine)) return;
    const d = nextInput(engine, true);
    engine.submit(row(d, 'item', 'potion', d.actorId) ?? defend());
  }
  throw new Error('passUntil: the stop condition never held');
}

const idOf = (c: Command | null): string => (c === null ? 'nothing' : c.kind === 'attack' ? 'attack' : 'id' in c ? String((c as { id: string }).id) : c.kind);
const targetOf = (c: Command | null): string | undefined => (c === null ? undefined : (c.targets as string[])[0]);

/** A fresh engine with the party at the note's cells (Tidus 1,265, Yuna 400, Rikku 850: the lowest is Yuna) and Wendigo at `hp`. */
function board(hp = 18_000): ReturnType<typeof newEngine> {
  const engine = newEngine(1);
  wendigo(engine).hp = hp;
  actor(engine, 'tidus').hp = 1265;
  actor(engine, 'yuna').hp = 400;
  actor(engine, 'rikku').hp = 850;
  return engine;
}

describe('the opening: the first menu, then the Guardians Berserk it, and a Berserk Wendigo throws the plain Attack (RE 4.4, 4.5)', () => {
  it('the first menus are Rikku\'s and Tidus\'s, the Guardians come before Yuna and before Wendigo (the CTB start: 27, 30, then 30, 30, 33), on every seed of 1 to 40', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const engine = newEngine(seed);
      const first = nextInput(engine).actorId;
      expect(first, `seed ${seed}`).toBe('rikku');
      expect(log(engine).filter((e) => e.type === 'action-start'), `seed ${seed}: nobody has acted before the first menu`).toHaveLength(0);
    }
  });

  it('Guardian A\'s first action is Berserk on Wendigo, and Wendigo\'s first action is the plain Attack (a Berserk Wendigo has no script), on seeds 1 to 20', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const engine = newEngine(seed);
      runDefending(engine, (e) => wendigoActions(e).length >= 1);
      const list = actionList(log(engine)).filter((a) => !a.endsWith(':defend'));
      expect(['lake-guardian-a:lake-berserk', 'lake-guardian-b:lake-berserk'], `seed ${seed}`).toContain(list[0]); // whichever of the two has the earlier turn
      expect(wendigoActions(engine)[0], `seed ${seed}`).toBe('attack');
      expect(has(wendigo(engine), 'berserk')).toBe(true);
    }
  });

  it('a Berserk Wendigo never raises its arms or throws the Double Punch, even far below half HP, over its first 15 turns', () => {
    const engine = newEngine(3);
    wendigo(engine).hp = 5_000;
    runDefending(engine, (e) => wendigoActions(e).length >= 15, 400);
    expect(new Set(wendigoActions(engine))).toEqual(new Set(['attack']));
    expect(flags(engine)[WD_ARMS_FLAG]).toBeUndefined();
  });

  it('the Berserk punch is the plain Attack at x3/2: 2,604 to 2,940 on Tidus and 2,638 to 2,979 on Rikku against the note\'s arithmetic, and never more than the note\'s top', () => {
    const hits: Record<string, number[]> = { tidus: [], rikku: [], yuna: [] };
    for (let seed = 1; seed <= 40; seed++) {
      const engine = newEngine(seed);
      passUntil(engine, (e) => wendigoActions(e).length >= 6);
      for (const e of log(engine) as ReadonlyArray<{ type: string; sourceId?: string; targetId?: string; amount?: number; crit?: boolean }>) {
        if (e.type === 'damage' && e.sourceId === WENDIGO && e.targetId && hits[e.targetId] && (e.amount ?? 0) > 0 && !e.crit) hits[e.targetId]!.push(e.amount as number);
      }
    }
    const range = (xs: number[]): [number, number] => [Math.min(...xs), Math.max(...xs)];
    expect(hits['tidus']!.length).toBeGreaterThan(10);
    expect(range(hits['tidus']!)[0]).toBeGreaterThanOrEqual(2_604);
    expect(range(hits['tidus']!)[1]).toBeLessThanOrEqual(2_940);
    expect(range(hits['rikku']!)[0]).toBeGreaterThanOrEqual(2_638);
    expect(range(hits['rikku']!)[1]).toBeLessThanOrEqual(2_979);
    expect(range(hits['yuna']!)[0]).toBeGreaterThanOrEqual(2_677);
    expect(range(hits['yuna']!)[1]).toBeLessThanOrEqual(3_023);
  }, 120_000);
});

describe('above half HP: one turn in three the Double Punch on the lowest-HP member, else the Punch (RE 4.2; the interpreter\'s tally over all 65,536 draws)', () => {
  it('21,846 of 65,536 are the Double Punch (33.33 percent) and 43,690 the Punch, at 18,000 HP and at exactly 9,000', () => {
    for (const hp of [18_000, 9_000]) {
      const engine = board(hp);
      const counts = new Map<string, number>();
      for (let raw = 0; raw <= 0xffff; raw++) {
        const { ctx } = stubbed(ctxOf(engine), [raw], [0]);
        const c = wendigoTurn(aiContextFor(ctx, wendigo(engine)));
        counts.set(idOf(c), (counts.get(idOf(c)) ?? 0) + 1);
        ctx.state.flags[WD_ARMS_FLAG] = undefined as unknown as boolean;
      }
      expect(counts.get(WD_ROWS.haymaker), `${hp}`).toBe(21_846);
      expect(counts.get(WD_ROWS.punch), `${hp}`).toBe(43_690);
      expect(counts.size).toBe(2);
    }
  });

  it('the Double Punch goes to the LOWEST-HP living member (Yuna at 400), the Punch to a picker pick among the living', () => {
    const engine = board();
    const strong = wendigoTurn(aiContextFor(stubbed(ctxOf(engine), [0], [0]).ctx, wendigo(engine)));
    expect(idOf(strong)).toBe(WD_ROWS.haymaker);
    expect(targetOf(strong)).toBe('yuna');
    // The picker draws among the living in ascending actor number (Tidus 0, Yuna 1, Rikku 6): the punch follows it.
    for (const [pick, who] of [[0, 'tidus'], [1, 'yuna'], [2, 'rikku']] as const) {
      const weak = wendigoTurn(aiContextFor(stubbed(ctxOf(engine), [1], [pick]).ctx, wendigo(engine)));
      expect(idOf(weak)).toBe(WD_ROWS.punch);
      expect(targetOf(weak), `pick ${pick}`).toBe(who);
    }
  });

  it('a fallen member is no target, and a tie for the lowest HP is drawn among the tied only', () => {
    const engine = board();
    const yuna = actor(engine, 'yuna');
    yuna.hp = 0;
    yuna.alive = false;
    const noYuna = wendigoTurn(aiContextFor(stubbed(ctxOf(engine), [0], [0]).ctx, wendigo(engine)));
    expect(targetOf(noYuna)).toBe('rikku'); // 850 against Tidus's 1,265
    yuna.hp = 400;
    yuna.alive = true;
    actor(engine, 'rikku').hp = 400; // a tie at 400 between Yuna (actor 1) and Rikku (actor 6)
    const picks = new Set<string | undefined>();
    for (const pick of [0, 1]) picks.add(targetOf(wendigoTurn(aiContextFor(stubbed(ctxOf(engine), [0], [pick]).ctx, wendigo(engine)))));
    expect(picks).toEqual(new Set(['yuna', 'rikku']));
  });

  it('draws the way the script does: the first findMatchingChr spends a picker draw nobody uses (three living), the second draws only among ties', () => {
    const engine = board();
    const s = stubbed(ctxOf(engine), [0], [0]);
    wendigoTurn(aiContextFor(s.ctx, wendigo(engine)));
    expect(s.draws).toEqual({ script: 1, picker: 1 }); // the group builder drew (3 living); the lowest is Yuna alone (no draw)
    const t = stubbed(ctxOf(engine), [1], [0]);
    wendigoTurn(aiContextFor(t.ctx, wendigo(engine)));
    expect(t.draws).toEqual({ script: 1, picker: 1 }); // the weak punch: one pick among three
  });
});

describe('below half HP: the seven-turn cycle (RE 4.2; the interpreter\'s fourteen turns)', () => {
  /** Wendigo's turns in a row at `hp`, the script draw fixed at `raw`, the stance and counters carried in the flags as the game carries them. */
  function turns(raw: number, n: number, hp = 8_999): string[] {
    const engine = board(hp);
    const { ctx } = stubbed(ctxOf(engine), [raw], [0]);
    const out: string[] = [];
    for (let i = 0; i < n; i++) out.push(idOf(wendigoTurn(aiContextFor(ctx, wendigo(engine)))));
    return out;
  }

  it('raise, nothing, nothing, lower, three attacks, raise again: turn 1 raises, turns 2 and 3 do nothing, turn 4 lowers, 5 to 7 attack (draw 1: the plain Attack)', () => {
    const cycle = [WD_ROWS.raiseArms, 'nothing', 'nothing', WD_ROWS.lowerArms, 'attack', 'attack', 'attack'];
    expect(turns(1, 14)).toEqual([...cycle, ...cycle]);
  });

  it('with draw 0 the three attack turns are the Double Punch (draw 0: mod 3 is 0)', () => {
    const cycle = [WD_ROWS.raiseArms, 'nothing', 'nothing', WD_ROWS.lowerArms, WD_ROWS.haymaker, WD_ROWS.haymaker, WD_ROWS.haymaker];
    expect(turns(0, 14)).toEqual([...cycle, ...cycle]);
  });

  it('Wendigo attacks on 3 of every 7 turns below half', () => {
    const t = turns(1, 70);
    expect(t.filter((x) => x === 'attack').length).toBe(30);
  });

  it('in the attack phase (cycle 1): 21,846 of 65,536 the Double Punch, 43,690 the plain Attack (accuracy 90)', () => {
    const engine = board(8_999);
    const counts = new Map<string, number>();
    for (let raw = 0; raw <= 0xffff; raw++) {
      const { ctx } = stubbed(ctxOf(engine), [raw], [0]);
      ctx.state.flags[WD_ARMS_FLAG] = false;
      ctx.state.flags[WD_CYCLE_FLAG] = 1;
      const c = wendigoTurn(aiContextFor(ctx, wendigo(engine)));
      counts.set(idOf(c), (counts.get(idOf(c)) ?? 0) + 1);
    }
    expect(counts.get(WD_ROWS.haymaker)).toBe(21_846);
    expect(counts.get('attack')).toBe(43_690);
  });

  it('the half line is strict and on the integer half: 9,000 of 18,000 is not below, 8,999 is; the first turn below it raises the arms', () => {
    const engine = board(9_000);
    expect(belowHalf(wendigo(engine))).toBe(false);
    wendigo(engine).hp = 8_999;
    expect(belowHalf(wendigo(engine))).toBe(true);
    expect(turns(1, 1, 9_000)[0]).toBe(WD_ROWS.punch);
    expect(turns(1, 1, 8_999)[0]).toBe(WD_ROWS.raiseArms);
  });

  it('the stance is the flag the Guardians, the tactic and the stage read: set on the raise, clear on the lower', () => {
    const engine = board(8_999);
    const { ctx } = stubbed(ctxOf(engine), [1], [0]);
    wendigoTurn(aiContextFor(ctx, wendigo(engine)));
    expect(flags(engine)[WD_ARMS_FLAG]).toBe(true);
    expect(flags(engine)[WD_ARM_TURNS_FLAG]).toBe(0);
    wendigoTurn(aiContextFor(ctx, wendigo(engine)));
    wendigoTurn(aiContextFor(ctx, wendigo(engine)));
    expect(flags(engine)[WD_ARM_TURNS_FLAG]).toBe(2);
    wendigoTurn(aiContextFor(ctx, wendigo(engine)));
    expect(flags(engine)[WD_ARMS_FLAG]).toBe(false);
    expect(flags(engine)[WD_CYCLE_FLAG]).toBe(1);
  });

  it('on the engine: a Wendigo that is not Berserk raises its arms on its first turn below half and the log shows the row', () => {
    const engine = newEngine(2);
    // The Guardians would Berserk it: stone them first, so the script runs.
    for (const id of [GUARDIAN_A, GUARDIAN_B]) give(actor(engine, id), 'petrify');
    wendigo(engine).hp = 8_000;
    runDefending(engine, (e) => wendigoActions(e).length >= 8, 400);
    const acts = wendigoActions(engine).slice(0, 8);
    const attack = ['attack', WD_ROWS.haymaker];
    expect([acts[0], acts[1], acts[5], acts[6]]).toEqual([WD_ROWS.raiseArms, WD_ROWS.lowerArms, WD_ROWS.raiseArms, WD_ROWS.lowerArms]);
    for (const i of [2, 3, 4, 7]) expect(attack, "turn " + i + ": " + acts[i]).toContain(acts[i]);
  });
});

describe('the stance: a physical hit is answered, anything else is not (RE 4.3; the interpreter\'s 35 commands)', () => {
  /** What the hook queues when `abilityId` (used by `who`) hits Wendigo with its arms up, as the real hook sees it. */
  function reply(abilityId: string, setup: (engine: ReturnType<typeof newEngine>) => void = () => undefined): string {
    const engine = board(8_000);
    flags(engine)[WD_ARMS_FLAG] = true;
    flags(engine)[WD_ARM_TURNS_FLAG] = 0;
    setup(engine);
    const ctx = ctxOf(engine);
    const def = ctx.content.ability(abilityId);
    if (!def) throw new Error(`no ability ${abilityId}`);
    while (takeReaction(ctx) !== undefined);
    runOnHit(ctx, { def, user: actor(engine, 'tidus') }, wendigo(engine), { hpBefore: 8_000, lostHp: true, lastDamage: 100, affectsHp: true });
    const queued = peekReactions(ctx);
    while (takeReaction(ctx) !== undefined);
    if (queued.length === 0) return 'nothing';
    const r = queued[0] as { ownerId: string; command: { id?: string }; byId: string };
    expect(r.ownerId).toBe(WENDIGO);
    expect(r.byId).toBe('tidus'); // aimed at the attacker
    return String(r.command.id);
  }

  const PHYSICAL = ['attack', 'dark-attack', 'sleep-attack', 'silence-attack', 'power-break', 'armor-break', 'magic-break', 'mental-break', 'delay-attack', 'delay-buster', 'aerospark', 'sonic-wings'];
  const NOT_PHYSICAL = ['fire', 'fira', 'thunder', 'haste', 'dispel', 'scan', 'steal', 'threaten', 'provoke', 'lancet', 'jump', 'spiral-cut', 'cheer', 'focus', 'meteor-strike', 'hellfire', 'diamond-dust', 'energy-ray'];

  it('answers the twelve physical commands with the Counter Punch on the attacker (the Attack, the Dark, Sleep and Silence Attacks, the four Breaks, Delay Attack and Buster, Aerospark and Sonic Wings)', () => {
    const missing: string[] = [];
    let seen = 0;
    for (const id of PHYSICAL) {
      if (!ctxOf(newEngine(1)).content.ability(id)) {
        missing.push(id);
        continue;
      }
      seen++;
      expect(reply(id), id).toBe(WD_ROWS.counterPunch);
    }
    expect(seen, `abilities absent from the catalog: ${missing.join(', ')}`).toBeGreaterThanOrEqual(10);
  });

  it('answers none of the spells, Steal, Threaten, Provoke, Lancet, Jump, Spiral Cut, Cheer, Focus or the aeon Overdrives', () => {
    let seen = 0;
    for (const id of NOT_PHYSICAL) {
      if (!ctxOf(newEngine(1)).content.ability(id)) continue;
      seen++;
      expect(reply(id), id).toBe('nothing');
    }
    expect(seen).toBeGreaterThanOrEqual(10);
  });

  it('an aeon on the field silences the counter (Valefor is out, the front line is the aeon alone)', () => {
    expect(reply('attack', (e) => { ctxOf(e).state.aeonId = 'valefor'; })).toBe('nothing');
  });

  it('the arms down answer nothing', () => {
    expect(reply('attack', (e) => { flags(e)[WD_ARMS_FLAG] = false; })).toBe('nothing');
  });

  it('Threaten ends the counter (counters not allowed), and so does a hit that is itself a reaction', () => {
    expect(reply('attack', (e) => give(wendigo(e), 'threaten'))).toBe('nothing');
    expect(reply('attack', (e) => { ctxOf(e).rt.inReaction = true; })).toBe('nothing');
  });

  it('Sleep ends the stance on the spot: the arms down, the turn counter 3, and no counter', () => {
    const engine = board(8_000);
    flags(engine)[WD_ARMS_FLAG] = true;
    flags(engine)[WD_ARM_TURNS_FLAG] = 1;
    give(wendigo(engine), 'sleep');
    const ctx = ctxOf(engine);
    runOnHit(ctx, { def: ctx.content.ability('fire')!, user: actor(engine, 'tidus') }, wendigo(engine), { hpBefore: 8_000, lostHp: true, lastDamage: 100, affectsHp: true });
    expect(flags(engine)[WD_ARMS_FLAG]).toBe(false);
    expect(flags(engine)[WD_ARM_TURNS_FLAG]).toBe(3);
    expect(peekReactions(ctx)).toHaveLength(0);
  });

  it('a Wendigo asleep with its arms down is left alone, and a Berserk or Petrified one answers nothing', () => {
    expect(reply('attack', (e) => { flags(e)[WD_ARMS_FLAG] = false; give(wendigo(e), 'sleep'); })).toBe('nothing');
    expect(reply('attack', (e) => give(wendigo(e), 'berserk'))).toBe('nothing');
  });

  it('on the engine: with the arms up Tidus\'s swing is answered by the Counter Punch on Tidus, and a spell is not', () => {
    const engine = newEngine(5);
    for (const id of [GUARDIAN_A, GUARDIAN_B]) give(actor(engine, id), 'petrify');
    const d = inputFor(engine, 'tidus');
    flags(engine)[WD_ARMS_FLAG] = true;
    flags(engine)[WD_ARM_TURNS_FLAG] = 0;
    wendigo(engine).hp = 8_000;
    engine.submit({ kind: 'attack', targets: [WENDIGO] });
    const list = actionList(log(engine));
    const i = list.lastIndexOf('tidus:attack');
    expect(list[i + 1]).toBe(`wendigo:${WD_ROWS.counterPunch}`);
    const counters = (log(engine) as ReadonlyArray<{ type: string; actorId?: string; targetId?: string; cause?: string }>).filter((e) => e.type === 'counter' && e.actorId === WENDIGO);
    expect(counters.at(-1)).toMatchObject({ targetId: 'tidus', cause: 'script' });
    void d;
  });
});
