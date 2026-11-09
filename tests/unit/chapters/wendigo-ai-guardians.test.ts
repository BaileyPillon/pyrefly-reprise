/**
 * The Guado Guardians' scripts (FFX only; `src/battle/ffx/ai/lake-guardian.ts`): the Guardians' branches over all 131,072 draw pairs, the potion reaction and the last shield, pinned to the interpreter's tallies in the note
 * (`research/re-ffx-wendigo-lake-macalania.md` 4.4) and run on the real engine. Split from `wendigo-ai.test.ts` by the r78-fix2 pass so each file stays under 400 lines (house rule 7); Wendigo's own script is there.
 * Rule 3: every claim is proved by running the engine.
 */

import { describe, expect, it } from 'vitest';
import { peekReactions, queueReaction, runOnDeath, runOnHit, takeReaction } from '../../../src/battle/ffx/ai/hooks.ts';
import { drainScriptReactions } from '../../../src/battle/ffx/ai/reaction-drain.ts';
import { aiContextFor } from '../../../src/battle/ffx/ai/types.ts';
import { lakeGuardianTurn } from '../../../src/battle/ffx/ai/lake-guardian.ts';
import { WD_ARMS_FLAG, WD_GUARDIAN_A_ID, WD_GUARDIAN_B_ID, WD_ID, WD_ROWS } from '../../../src/battle/ffx/ai/wendigo-rules.ts';
import { rtOf, type Ctx } from '../../../src/battle/ffx/state.ts';
import type { Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { GUARDIAN_A, GUARDIAN_B, WENDIGO, actionList, actor, ctxOf, defend, flags, give, has, inputFor, log, newEngine, wendigo, wendigoStarts } from '../helpers/wendigoDrive.ts';

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

const idOf = (c: Command | null): string => (c === null ? 'nothing' : c.kind === 'attack' ? 'attack' : 'id' in c ? String((c as { id: string }).id) : c.kind);
const targetOf = (c: Command | null): string | undefined => (c === null ? undefined : (c.targets as string[])[0]);

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
