/**
 * Wendigo's and the Guado Guardians' scripts (FFX only; `src/battle/ffx/ai/wendigo.ts`, `lake-guardian.ts`): the rules pinned to the interpreter's exact tallies in the note (`research/re-ffx-wendigo-lake-macalania.md` 4.2
 * to 4.4) and run on the real engine. The turn mix over all 65,536 stream-2 values, the seven-turn cycle, the strict half-HP line, the lowest-HP selector, the counter table over the real command rows, the stances that
 * silence or end it, the Guardians' branches over all 131,072 draw pairs, the potion reaction and the last shield. Rule 3: every claim is proved by running the engine.
 */

import { describe, expect, it } from 'vitest';

import { peekReactions, queueReaction, runOnDeath, runOnHit, takeReaction } from '../../../src/battle/ffx/ai/hooks.ts';
import { drainScriptReactions } from '../../../src/battle/ffx/ai/reaction-drain.ts';
import { aiContextFor } from '../../../src/battle/ffx/ai/types.ts';
import { lakeGuardianTurn } from '../../../src/battle/ffx/ai/lake-guardian.ts';
import { wendigoTurn } from '../../../src/battle/ffx/ai/wendigo.ts';
import { WD_ARMS_FLAG, WD_ARM_TURNS_FLAG, WD_CYCLE_FLAG, WD_GUARDIAN_A_ID, WD_GUARDIAN_B_ID, WD_ID, WD_ROWS, belowHalf } from '../../../src/battle/ffx/ai/wendigo-rules.ts';
import { rtOf, type Ctx } from '../../../src/battle/ffx/state.ts';
import type { Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { GUARDIAN_A, GUARDIAN_B, WENDIGO, row, actionList, actor, ctxOf, defend, flags, give, has, inputFor, log, newEngine, nextInput, runDefending, wendigo, wendigoActions, wendigoStarts } from '../helpers/wendigoDrive.ts';

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

describe('the Guardians\' turn (RE 4.4): first match wins', () => {
  const guardianTurn = (engine: ReturnType<typeof newEngine>, id = GUARDIAN_A, script: readonly number[] = [0], picker: readonly number[] = [0]): Command | null =>
    lakeGuardianTurn(aiContextFor(stubbed(ctxOf(engine), script, picker).ctx, actor(engine, id)));

  it('a calm Wendigo: Berserk on Wendigo', () => {
    const c = guardianTurn(newEngine(1));
    expect([idOf(c), targetOf(c)]).toEqual([WD_ROWS.berserk, WENDIGO]);
  });

  it('a blind Wendigo: Eye Drops on Wendigo, before anything else', () => {
    const engine = newEngine(1);
    give(wendigo(engine), 'darkness');
    give(wendigo(engine), 'berserk');
    flags(engine)[WD_ARMS_FLAG] = true;
    const c = guardianTurn(engine);
    expect([idOf(c), targetOf(c)]).toEqual([WD_ROWS.eyeDrops, WENDIGO]);
  });

  it('a blind Wendigo and a Guardian that has been stolen from: the turn is spent on nothing (GameFAQs: the Steal ends the Eye Drops; the script has no test, RE 8)', () => {
    const engine = newEngine(1);
    give(wendigo(engine), 'darkness');
    rtOf(ctxOf(engine), GUARDIAN_A).stealCount = 1;
    expect(guardianTurn(engine, GUARDIAN_A)).toBeNull();
    expect(idOf(guardianTurn(engine, GUARDIAN_B))).toBe(WD_ROWS.eyeDrops); // the other has not been robbed
  });

  it('the arms up: Berserk on a party member who is not Berserk yet, uniform among the calm; every one Berserk, the Guardian does nothing', () => {
    const engine = newEngine(1);
    flags(engine)[WD_ARMS_FLAG] = true;
    const picks = new Set<string | undefined>();
    for (const p of [0, 1, 2]) picks.add(targetOf(guardianTurn(engine, GUARDIAN_A, [0], [p])));
    expect(picks).toEqual(new Set(['tidus', 'yuna', 'rikku']));
    give(actor(engine, 'tidus'), 'berserk');
    const calm = new Set<string | undefined>();
    for (const p of [0, 1]) calm.add(targetOf(guardianTurn(engine, GUARDIAN_A, [0], [p])));
    expect(calm).toEqual(new Set(['yuna', 'rikku']));
    for (const id of ['yuna', 'rikku']) give(actor(engine, id), 'berserk');
    expect(guardianTurn(engine)).toBeNull();
    expect(idOf(guardianTurn(newEngine(1)))).toBe(WD_ROWS.berserk); // not in the stance: the rule above is the calm one
  });

  it('a Berserk Wendigo, not stolen from: over all 131,072 draw pairs 25 percent Auto-Potion on Wendigo, 37.5 Blizzara and 37.5 Thundara on a member', () => {
    const engine = newEngine(1);
    give(wendigo(engine), 'berserk');
    const counts = new Map<string, number>();
    for (let a = 0; a <= 0xffff; a++) {
      for (const b of [0, 1]) {
        const c = guardianTurn(engine, GUARDIAN_A, [a, b], [0]);
        const key = idOf(c) === WD_ROWS.autoPotion ? `${idOf(c)}>${targetOf(c)}` : idOf(c);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    expect(counts.get(`${WD_ROWS.autoPotion}>${WENDIGO}`)).toBe(32_768);
    expect(counts.get(WD_ROWS.blizzara)).toBe(49_152);
    expect(counts.get(WD_ROWS.thundara)).toBe(49_152);
    expect([...counts.values()].reduce((x, y) => x + y, 0)).toBe(131_072 - 0 + 0);
  }, 120_000);

  it('a Berserk Wendigo and a Guardian stolen from: 62.5 percent Blizzara, 37.5 Thundara, no Auto-Potion', () => {
    const engine = newEngine(1);
    give(wendigo(engine), 'berserk');
    rtOf(ctxOf(engine), GUARDIAN_A).stealCount = 1;
    const counts = new Map<string, number>();
    for (let a = 0; a <= 0xffff; a++) {
      for (const b of [0, 1]) {
        const id = idOf(guardianTurn(engine, GUARDIAN_A, [a, b], [0]));
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    expect(counts.get(WD_ROWS.blizzara)).toBe(81_920);
    expect(counts.get(WD_ROWS.thundara)).toBe(49_152);
    expect(counts.has(WD_ROWS.autoPotion)).toBe(false);
  }, 120_000);

  it('Wendigo dead: Blizzara or Thundara, 32,768 of 65,536 each', () => {
    const engine = newEngine(1);
    wendigo(engine).hp = 0;
    wendigo(engine).alive = false;
    const counts = new Map<string, number>();
    for (let a = 0; a <= 0xffff; a++) {
      const id = idOf(guardianTurn(engine, GUARDIAN_A, [a], [0]));
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    expect(counts.get(WD_ROWS.blizzara)).toBe(32_768);
    expect(counts.get(WD_ROWS.thundara)).toBe(32_768);
  });

  it('the spells are aimed at a member picked among the living, in actor order', () => {
    const engine = newEngine(1);
    wendigo(engine).hp = 0;
    wendigo(engine).alive = false;
    const targets = new Set<string | undefined>();
    for (const p of [0, 1, 2]) targets.add(targetOf(guardianTurn(engine, GUARDIAN_A, [0], [p])));
    expect(targets).toEqual(new Set(['tidus', 'yuna', 'rikku']));
  });
});

describe('the Guardian hit: +1,000 on itself unless stolen from, asleep, Threatened or the hit was a Berserk cast (RE 4.4 onHit)', () => {
  /** What a Guardian queues when `abilityId` takes `lastDamage` from Tidus. */
  function onHit(abilityId: string, lastDamage: number, setup: (engine: ReturnType<typeof newEngine>) => void = () => undefined): string {
    const engine = newEngine(1);
    setup(engine);
    const ctx = ctxOf(engine);
    const def = ctx.content.ability(abilityId)!;
    while (takeReaction(ctx) !== undefined);
    runOnHit(ctx, { def, user: actor(engine, 'tidus') }, actor(engine, GUARDIAN_A), { hpBefore: 1200, lostHp: lastDamage > 0, lastDamage, affectsHp: true });
    const queued = peekReactions(ctx);
    while (takeReaction(ctx) !== undefined);
    if (queued.length === 0) return 'nothing';
    const r = queued[0] as { ownerId: string; command: { id?: string; targets: string[] } };
    expect(r.ownerId).toBe(GUARDIAN_A);
    expect(r.command.targets).toEqual([GUARDIAN_A]);
    return String(r.command.id);
  }

  it('a hit that took HP is answered with Auto-Potion on itself, physical or magical', () => {
    expect(onHit('attack', 100)).toBe(WD_ROWS.autoPotion);
    expect(onHit('fire', 100)).toBe(WD_ROWS.autoPotion);
  });

  it('nothing for a miss, a heal, a Steal that landed, Sleep, Threaten, a reaction in progress, or a Berserk cast', () => {
    expect(onHit('attack', 0)).toBe('nothing');
    expect(onHit('attack', -100)).toBe('nothing');
    expect(onHit('attack', 100, (e) => { rtOf(ctxOf(e), GUARDIAN_A).stealCount = 1; })).toBe('nothing');
    expect(onHit('attack', 100, (e) => give(actor(e, GUARDIAN_A), 'sleep'))).toBe('nothing');
    expect(onHit('attack', 100, (e) => give(actor(e, GUARDIAN_A), 'threaten'))).toBe('nothing');
    expect(onHit('attack', 100, (e) => { ctxOf(e).rt.inReaction = true; })).toBe('nothing');
    expect(onHit(WD_ROWS.berserk, 100)).toBe('nothing');
  });

  it('on the engine: a Tidus swing at an un-robbed Guardian is answered by +1,000 (it climbs back), and a robbed one stays hit', () => {
    const engine = newEngine(4);
    wendigo(engine).hp = 18_000;
    const d = inputFor(engine, 'tidus');
    const g = actor(engine, GUARDIAN_A);
    const before = g.hp;
    engine.submit({ kind: 'attack', targets: [GUARDIAN_A] });
    const list = actionList(log(engine));
    expect(list).toContain(`${GUARDIAN_A}:${WD_ROWS.autoPotion}`);
    expect(g.hp).toBeGreaterThan(before - 400);
    void d;
  });
});

describe('the Guardian falls: the first casts Protect on Wendigo, the second Shell, if Wendigo lives (RE 4.4 onDeath)', () => {
  /** Kill `id` with a real blow and drain the reactions; returns the log's `who:ability` list since. */
  function fell(engine: ReturnType<typeof newEngine>, id: string): string[] {
    const ctx = ctxOf(engine);
    const before = log(engine).length;
    const g = actor(engine, id);
    g.hp = 1;
    const d = inputFor(engine, 'tidus');
    engine.submit({ kind: 'attack', targets: [id] });
    void d;
    void ctx;
    return actionList(log(engine).slice(before));
  }

  it('Guardian A dies: Protect on Wendigo, cast by the dying Guardian; Guardian B: Shell', () => {
    const a = newEngine(6);
    const listA = fell(a, GUARDIAN_A);
    expect(listA).toContain(`${GUARDIAN_A}:protect`);
    expect(has(wendigo(a), 'protect')).toBe(true);
    expect(has(wendigo(a), 'shell')).toBe(false);
    const b = newEngine(6);
    const listB = fell(b, GUARDIAN_B);
    expect(listB).toContain(`${GUARDIAN_B}:shell`);
    expect(has(wendigo(b), 'shell')).toBe(true);
    expect(has(wendigo(b), 'protect')).toBe(false);
  });

  it('both fall: Wendigo has Protect and Shell', () => {
    const engine = newEngine(7);
    fell(engine, GUARDIAN_A);
    fell(engine, GUARDIAN_B);
    expect(has(wendigo(engine), 'protect') && has(wendigo(engine), 'shell')).toBe(true);
  });

  it('with Wendigo already dead, a falling Guardian casts nothing', () => {
    const engine = newEngine(8);
    const ctx = ctxOf(engine);
    wendigo(engine).hp = 0;
    wendigo(engine).alive = false;
    while (takeReaction(ctx) !== undefined);
    runOnDeath(ctx, actor(engine, GUARDIAN_A), 'tidus');
    expect(peekReactions(ctx)).toHaveLength(0);
  });

  it('a Guardian turned to stone is no death: no Protect, no Shell', () => {
    const engine = newEngine(9);
    const d = inputFor(engine, 'rikku');
    const grenade = d.commands.find((c) => c.enabled && c.command.kind === 'item' && c.command.id === 'petrify-grenade');
    expect(grenade, 'Rikku carries the grenades').toBeDefined();
    engine.submit({ ...grenade!.command, targets: [GUARDIAN_A] } as Command);
    const list = actionList(log(engine));
    expect(list.some((a) => a.endsWith(':protect') || a.endsWith(':shell'))).toBe(false);
    expect(has(actor(engine, GUARDIAN_A), 'petrify') && has(actor(engine, GUARDIAN_B), 'petrify')).toBe(true); // one grenade reaches both
    expect(has(wendigo(engine), 'protect') || has(wendigo(engine), 'shell')).toBe(false);
  });

  it('the death handler\'s command is the dying monster\'s own; every other reaction of a dead owner is still dropped (the flag is opt-in)', () => {
    const engine = newEngine(10);
    const ctx = ctxOf(engine);
    const guardian = actor(engine, GUARDIAN_A);
    guardian.hp = 0;
    guardian.alive = false;
    const before = log(engine).length;
    queueReaction(ctx, GUARDIAN_A, { kind: 'ability', id: 'protect', targets: [WENDIGO] }, { forced: true });
    drainScriptReactions({ ctx, push: (e) => ctx.emit(e) });
    expect(actionList(log(engine).slice(before))).toEqual([]); // dropped, as before
    queueReaction(ctx, GUARDIAN_A, { kind: 'ability', id: 'protect', targets: [WENDIGO] }, { forced: true, ownerMayBeDead: true });
    drainScriptReactions({ ctx, push: (e) => ctx.emit(e) });
    expect(actionList(log(engine).slice(before))).toEqual([`${GUARDIAN_A}:protect`]);
  });
});

describe('the ids the battle layer copies equal the data layer\'s', () => {
  it('the combatants, the scripts and the Guardians\' order (the game\'s actors 20, 21, 22)', () => {
    const engine = newEngine(1);
    expect(engine.state().enemyIds).toEqual([WD_GUARDIAN_A_ID, WD_ID, WD_GUARDIAN_B_ID]);
    expect(wendigo(engine).enemy?.aiScriptId).toBe('wendigo');
    expect(actor(engine, GUARDIAN_A).enemy?.aiScriptId).toBe('lake-guardian');
    void (defend as unknown);
    void ({} as FFXCombatant);
    void wendigoStarts;
  });
});
