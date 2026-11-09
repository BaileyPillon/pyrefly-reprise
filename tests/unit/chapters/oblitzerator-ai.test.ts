/**
 * The Oblitzerator's and the crane's scripts (FFX only; `src/battle/ffx/ai/oblitzerator.ts`, `luca-crane.ts`): the rules pinned to the interpreter's exact tallies in the note (`research/re-ffx-oblitzerator-crane.md` 4.1 to
 * 4.5) and run on the stream-2 values: the Rush on the whole living front line, the counters by the formula byte of the command that hit it (21,846 of 65,536, a draw only for the bytes 1, 2 and 3), the speed-up lines at a
 * third and a twelfth of its HP and the one-step-per-hit rule, the lifted state, and the crane's count (two answers, power on the third Thunder or on one Thunder Fury). Rule 3: every claim is proved by running the engine.
 */

import { describe, expect, it } from 'vitest';

import { formulaByteOf } from '../../../src/battle/ffx/ai/command-formula.ts';
import { peekReactions, runOnHit, runOnTargeted, takeReaction } from '../../../src/battle/ffx/ai/hooks.ts';
import { aiContextFor } from '../../../src/battle/ffx/ai/types.ts';
import { ballFor, oblitzeratorTurn, speedUp } from '../../../src/battle/ffx/ai/oblitzerator.ts';
import { applyUseCrane, useCraneAvailable, useCraneOffered, useCraneRows } from '../../../src/battle/ffx/ai/luca-crane.ts';
import { COUNTER_MODULUS, OB_CALLOUTS, OB_CRANE_FLAG, OB_ENDED_FLAG, OB_PHASE_FLAG, OB_ROWS, OB_THUNDERS_FLAG } from '../../../src/battle/ffx/ai/oblitzerator-rules.ts';
import { type Ctx } from '../../../src/battle/ffx/state.ts';
import type { AbilityDef, Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { ALL_ABILITIES } from '../../../src/data/ffx/index.ts';
import { CRANE, OBLITZERATOR, actor, content, crane, ctxOf, flags, newEngine, oblitzerator } from '../helpers/oblitzeratorDrive.ts';
import { readFileSync } from 'node:fs';

/** A context whose stream 2 hands out `script` in turn: the interpreter's way of putting every draw through the real script. `draws` counts the draws taken. */
function stubbed(ctx: Ctx, script: readonly number[]): { ctx: Ctx; draws: { script: number } } {
  const draws = { script: 0 };
  const rng = {
    on: (stream: number) => ({
      int: (min: number, _max: number): number => {
        if (stream === 2) return script[draws.script++ % script.length] as number;
        return min;
      },
    }),
  };
  return { ctx: { ...ctx, rng: rng as unknown as Ctx['rng'] }, draws };
}

const def = (id: string): AbilityDef => {
  const d = content.ability(id) as AbilityDef | undefined; // the registry holds the generic Attack too, which the data barrel does not
  if (!d) throw new Error(`no ability ${id}`);
  return d;
};
const idOf = (c: Command | null): string => (c === null ? 'nothing' : c.kind === 'attack' ? 'attack' : 'id' in c ? String((c as { id: string }).id) : c.kind);
const report = { hpBefore: 0, lostHp: true, lastDamage: 100, affectsHp: true };

/** Run the Oblitzerator's `onHit` for `command` used by `user`, and say what the reaction queue then holds. */
function hit(ctx: Ctx, engine: ReturnType<typeof newEngine>, command: AbilityDef, userId = 'tidus'): string[] {
  while (takeReaction(ctx)) { /* start from an empty queue */ }
  runOnHit(ctx, { def: command, user: actor(engine, userId) }, oblitzerator(engine), report);
  const out: string[] = [];
  for (const r of peekReactions(ctx)) if (r.kind === 'command') out.push(`${r.ownerId}:${idOf(r.command)}->${(r.command.targets as string[]).join(',')}`);
  return out;
}

describe('its turn: Blitzball Rush on the whole living front line, nothing once lifted (RE 4.1)', () => {
  it('all three alive: the Rush, aimed at all three; the MAG write', () => {
    const engine = newEngine(1);
    const c = oblitzeratorTurn(aiContextFor(ctxOf(engine), oblitzerator(engine)));
    expect(idOf(c)).toBe(OB_ROWS.rush);
    expect((c!.targets as string[]).slice().sort()).toEqual(['kimahri', 'lulu', 'tidus']);
    expect(oblitzerator(engine).stats.mag).toBe(30);
  });

  it('Lulu down: the survivors only; only Tidus up: Tidus alone; all down: nothing', () => {
    const engine = newEngine(1);
    actor(engine, 'lulu').hp = 0;
    actor(engine, 'lulu').alive = false;
    expect((oblitzeratorTurn(aiContextFor(ctxOf(engine), oblitzerator(engine)))!.targets as string[]).slice().sort()).toEqual(['kimahri', 'tidus']);
    actor(engine, 'kimahri').hp = 0;
    actor(engine, 'kimahri').alive = false;
    expect(oblitzeratorTurn(aiContextFor(ctxOf(engine), oblitzerator(engine)))!.targets).toEqual(['tidus']);
    actor(engine, 'tidus').hp = 0;
    actor(engine, 'tidus').alive = false;
    expect(oblitzeratorTurn(aiContextFor(ctxOf(engine), oblitzerator(engine)))).toBeNull();
  });

  it('after the crane has lifted it (the game\'s v2 = 255) it queues nothing, ever', () => {
    const engine = newEngine(1);
    flags(engine)[OB_ENDED_FLAG] = true;
    expect(oblitzeratorTurn(aiContextFor(ctxOf(engine), oblitzerator(engine)))).toBeNull();
  });

  it('the Rush is ten balls spread at random over the set (a random-enemy row of 10 hits that names no hit\'s target)', () => {
    const rush = def(OB_ROWS.rush);
    expect([rush.targeting, rush.hits, rush.power]).toEqual(['random-enemy', 10, 4]);
    expect(rush.extra?.['scriptAims']).toBeUndefined();
  });
});

describe('the counters: the formula byte of the command that hit it decides, 21,846 of 65,536 (RE 4.2; the interpreter\'s tally over all 65,536 draws)', () => {
  const CASES: Array<[label: string, id: string, ball: string | undefined, userId: string]> = [
    ['Attack (formula 1)', 'attack', OB_ROWS.blind, 'tidus'],
    ['Thunder (formula 3)', 'thunder', OB_ROWS.mute, 'lulu'],
    ['Thunder Fury (formula 3, Overdrive)', 'thunder-fury', OB_ROWS.mute, 'lulu'],
    ['Scan (a status row whose record carries formula 3)', 'scan', OB_ROWS.mute, 'lulu'],
    ['Lancet (formula 3)', 'lancet', OB_ROWS.mute, 'kimahri'],
    ['Spiral Cut (an Overdrive, formula 1)', 'spiral-cut', OB_ROWS.blind, 'tidus'],
  ];

  for (const [label, id, ball, userId] of CASES) {
    it(`${label}: ${ball} on the attacker on 21,846 of the 65,536 draws, one draw each`, () => {
      const engine = newEngine(1);
      const command = def(id);
      let n = 0;
      let draws = 0;
      for (let raw = 0; raw <= 0xffff; raw++) {
        const { ctx, draws: d } = stubbed(ctxOf(engine), [raw]);
        const queued = hit(ctx, engine, command, userId);
        draws += d.script;
        if (queued.length > 0) {
          n += 1;
          expect(queued).toEqual([`${OBLITZERATOR}:${ball}->${userId}`]);
        }
      }
      expect(n).toBe(21_846);
      expect(n / 65_536).toBeCloseTo(1 / 3, 4);
      expect(draws, 'exactly one draw per hit').toBe(65_536);
    });
  }

  it('the draw is `mod 3 == 0` and no other residue answers', () => {
    expect(COUNTER_MODULUS).toBe(3);
    const engine = newEngine(1);
    for (const [raw, answers] of [[0, true], [1, false], [2, false], [3, true], [65_535, true], [65_534, false]] as const) {
      const queued = hit(stubbed(ctxOf(engine), [raw]).ctx, engine, def('attack'));
      expect(queued.length > 0, `raw ${raw}`).toBe(answers);
    }
  });

  it('a heal (formula 7) and a formula-0 command answer nothing and take NO draw', () => {
    const engine = newEngine(1);
    for (const id of ['cure', 'potion', 'defend']) {
      const command = ALL_ABILITIES.find((a) => a.id === id);
      if (!command) continue;
      const { ctx, draws } = stubbed(ctxOf(engine), [0]);
      expect(hit(ctx, engine, command, 'lulu'), id).toEqual([]);
      expect(draws.script, `${id} took a draw`).toBe(0);
    }
  });

  it('a command of formula byte 2 would answer with Doze Ball (the branch is in the code and the data)', () => {
    expect(ballFor(2)).toBe(OB_ROWS.doze);
    expect(ballFor(1)).toBe(OB_ROWS.blind);
    expect(ballFor(3)).toBe(OB_ROWS.mute);
    for (const byte of [0, 4, 5, 6, 7, 8, 9]) expect(ballFor(byte), String(byte)).toBeUndefined();
    const engine = newEngine(1);
    const synthetic: AbilityDef = { ...def('attack'), id: 'synthetic-formula-2', formula: 'piercing-strength', record: { id: 0xdead, type: 0, flagsMisc: 6, flagsDamage: 1, damageClass: 1 } };
    expect(formulaByteOf(synthetic, actor(engine, 'tidus'))).toBe(2);
    expect(hit(stubbed(ctxOf(engine), [0]).ctx, engine, synthetic)).toEqual([`${OBLITZERATOR}:${OB_ROWS.doze}->tidus`]);
  });

  it('DOZE BALL IS UNREACHABLE: no ability of the party\'s has formula byte 2 (RE 4.3; two guides say an Overdrive draws it, the files say not)', () => {
    const engine = newEngine(1);
    const party = actor(engine, 'tidus');
    const player = ALL_ABILITIES.filter((a) => a.category !== 'enemy' && a.record !== undefined && a.record.id >= 0x2000 && a.record.id < 0x4000);
    expect(player.length).toBeGreaterThan(300);
    const twos = player.filter((a) => formulaByteOf(a, party) === 2).map((a) => a.id);
    expect(twos).toEqual([]);
    const overdrives = player.filter((a) => a.category === 'overdrive');
    expect(overdrives.length).toBeGreaterThan(30);
    for (const a of overdrives) expect(formulaByteOf(a, party), a.id).not.toBe(2);
    // the physical Overdrives are formula 1 and the Furies formula 3 (RE 4.3); the table's own six formula-2 rows are all monster moves (ids from 0x4000)
    for (const id of ['slice-and-dice', 'spiral-cut', 'dragon-fang']) expect(formulaByteOf(def(id), party), id).toBe(1);
    for (const id of ['thunder-fury', 'fire-fury', 'water-fury']) expect(formulaByteOf(def(id), party), id).toBe(3);
    const table = JSON.parse(readFileSync(new URL('../../fixtures/parity/ffx/command_records.json', import.meta.url), 'utf8')) as { rows: number[][] };
    const gameTwos = table.rows.filter((r) => r[6] === 2).map((r) => r[0]!);
    expect(gameTwos).toHaveLength(6);
    expect(gameTwos.every((id) => id >= 0x4000)).toBe(true);
  });

  it('nothing answers once the crane has lifted it', () => {
    const engine = newEngine(1);
    flags(engine)[OB_ENDED_FLAG] = true;
    expect(hit(stubbed(ctxOf(engine), [0]).ctx, engine, def('attack'))).toEqual([]);
  });

  it('a hit while a reaction is resolving asks for nothing (the engine\'s one-counter rule), and a Mute Ball is aimed at the caster, never at Tidus', () => {
    const engine = newEngine(1);
    const ctx = stubbed(ctxOf(engine), [0]).ctx;
    ctx.rt.inReaction = true;
    expect(hit(ctx, engine, def('thunder'), 'lulu')).toEqual([]);
    ctx.rt.inReaction = false;
    expect(hit(stubbed(ctxOf(engine), [0]).ctx, engine, def('thunder'), 'lulu')).toEqual([`${OBLITZERATOR}:${OB_ROWS.mute}->lulu`]);
  });
});

describe('the speed-up: AGI + 15 under a third of its HP, + 10 under a twelfth, one step per hit (RE 4.2)', () => {
  it('the lines are exact: 4,001 and 2,000 change nothing, 1,999 steps to 16; 500 changes nothing, 499 steps to 26', () => {
    const engine = newEngine(1);
    const o = oblitzerator(engine);
    const rows: string[] = [];
    for (const hp of [4_001, 2_000, 1_999, 500, 499, 100, 0]) {
      o.hp = hp;
      speedUp(ctxOf(engine), o);
      rows.push(`HP ${hp}: AGI ${o.stats.agi} v3=${flags(engine)[OB_PHASE_FLAG]}`);
    }
    expect(rows).toEqual(['HP 4001: AGI 1 v3=0', 'HP 2000: AGI 1 v3=0', 'HP 1999: AGI 16 v3=1', 'HP 500: AGI 16 v3=1', 'HP 499: AGI 26 v3=2', 'HP 100: AGI 26 v3=2', 'HP 0: AGI 26 v3=2']);
  });

  it('a single hit that drops it from full straight to 400 HP moves ONE step (AGI 16); the next hit takes the other (AGI 26)', () => {
    const engine = newEngine(1);
    const o = oblitzerator(engine);
    o.hp = 400;
    runOnHit(stubbed(ctxOf(engine), [1]).ctx, { def: def('attack'), user: actor(engine, 'tidus') }, o, report);
    expect([o.stats.agi, flags(engine)[OB_PHASE_FLAG]]).toEqual([16, 1]);
    runOnHit(stubbed(ctxOf(engine), [1]).ctx, { def: def('attack'), user: actor(engine, 'tidus') }, o, report);
    expect([o.stats.agi, flags(engine)[OB_PHASE_FLAG]]).toEqual([26, 2]);
  });

  it('it goes on after the crane has lifted it (the script steps the speed before it tests the ended state)', () => {
    const engine = newEngine(1);
    flags(engine)[OB_ENDED_FLAG] = true;
    const o = oblitzerator(engine);
    o.hp = 375;
    runOnHit(stubbed(ctxOf(engine), [1]).ctx, { def: def(OB_ROWS.lift), user: crane(engine) }, o, report);
    expect(o.stats.agi).toBe(16);
  });

  it('the clock reads it: its recovery at AGI 1, 16 and 26 is 84, 36 and 27 ticks at rank 3 (the note\'s arithmetic)', async () => {
    const { delayForRank } = await import('../../../src/battle/ffx/kernel/ctb.ts');
    expect([1, 16, 26].map((agi) => delayForRank(agi, 3, 0, 0))).toEqual([84, 36, 27]);
  });
});

describe('lifted: the crane\'s row naming it ends its turns and counters, before any damage (RE 4.4)', () => {
  it('onTargeted with the Crane row sets the state and raises the callout once; any other row does nothing', () => {
    const engine = newEngine(1);
    const ctx = ctxOf(engine);
    while (takeReaction(ctx)) { /* empty */ }
    runOnTargeted(ctx, { def: def('attack'), user: actor(engine, 'tidus') }, [oblitzerator(engine)]);
    expect(flags(engine)[OB_ENDED_FLAG]).toBe(false);
    expect(peekReactions(ctx)).toHaveLength(0);
    runOnTargeted(ctx, { def: def(OB_ROWS.lift), user: crane(engine) }, [oblitzerator(engine)]);
    expect(flags(engine)[OB_ENDED_FLAG]).toBe(true);
    expect(peekReactions(ctx).filter((r) => r.kind === 'emit').map((r) => (r.kind === 'emit' ? (r.event as { name?: string }).name : ''))).toEqual([OB_CALLOUTS.lifted]);
  });
});

describe('the crane: two answers, power on the third Thunder or on one Thunder Fury (RE 4.5)', () => {
  const names = (ctx: Ctx): string[] => peekReactions(ctx).flatMap((r) => (r.kind === 'emit' ? [String((r.event as { name?: string }).name)] : []));
  const thunderAt = (engine: ReturnType<typeof newEngine>, id: string): void => {
    const ctx = ctxOf(engine);
    runOnHit(ctx, { def: def(id), user: actor(engine, 'lulu') }, crane(engine), report);
  };

  it('Thunder three times: the first two are answered (the count 1, 2), the third powers it; a fourth does nothing', () => {
    const engine = newEngine(1);
    const ctx = ctxOf(engine);
    while (takeReaction(ctx)) { /* empty */ }
    thunderAt(engine, 'thunder');
    expect([flags(engine)[OB_THUNDERS_FLAG], flags(engine)[OB_CRANE_FLAG]]).toEqual([1, 0]);
    thunderAt(engine, 'thunder');
    expect([flags(engine)[OB_THUNDERS_FLAG], flags(engine)[OB_CRANE_FLAG]]).toEqual([2, 0]);
    thunderAt(engine, 'thunder');
    expect(flags(engine)[OB_CRANE_FLAG]).toBe(1);
    expect(names(ctx)).toEqual([OB_CALLOUTS.responds1, OB_CALLOUTS.responds2, OB_CALLOUTS.powered]);
    thunderAt(engine, 'thunder');
    expect(names(ctx)).toHaveLength(3);
    expect(flags(engine)[OB_CRANE_FLAG]).toBe(1);
  });

  it('one Thunder Fury on a fresh crane powers it at once; one Thunder and then a Fury powers it too', () => {
    const engine = newEngine(1);
    thunderAt(engine, 'thunder-fury');
    expect([flags(engine)[OB_CRANE_FLAG], flags(engine)[OB_THUNDERS_FLAG]]).toEqual([1, 0]);
    const second = newEngine(1);
    thunderAt(second, 'thunder');
    thunderAt(second, 'thunder-fury');
    expect([flags(second)[OB_CRANE_FLAG], flags(second)[OB_THUNDERS_FLAG]]).toEqual([1, 1]);
  });

  it('Thundara, Thundaga, the other Furies, Fire, Blizzard and a plain blow do nothing', () => {
    const engine = newEngine(1);
    const ctx = ctxOf(engine);
    while (takeReaction(ctx)) { /* empty */ }
    for (const id of ['thundara', 'thundaga', 'fire-fury', 'blizzard-fury', 'water-fury', 'fire', 'blizzard', 'water', 'attack', 'scan']) {
      const d = ALL_ABILITIES.find((a) => a.id === id);
      if (d) runOnHit(ctx, { def: d, user: actor(engine, 'lulu') }, crane(engine), report);
    }
    expect([flags(engine)[OB_THUNDERS_FLAG], flags(engine)[OB_CRANE_FLAG]]).toEqual([0, 0]);
    expect(peekReactions(ctx)).toHaveLength(0);
  });

  it('a spent crane hears nothing (the game\'s v0 = 2 returns first)', () => {
    const engine = newEngine(1);
    flags(engine)[OB_CRANE_FLAG] = 2;
    thunderAt(engine, 'thunder-fury');
    expect(flags(engine)[OB_CRANE_FLAG]).toBe(2);
  });

  it('the rows the count reads are the player\'s own Thunder 0x3043 and Thunder Fury 0x307a', () => {
    expect(def('thunder').record?.id).toBe(0x3043);
    expect(def('thunder-fury').record?.id).toBe(0x307a);
  });
});

describe('Use crane: the trigger\'s handler does what the crane\'s onTargeted does (RE 4.5)', () => {
  const asTidus = (engine: ReturnType<typeof newEngine>): FFXCombatant => actor(engine, 'tidus');
  const use = { kind: 'trigger' as const, id: OB_ROWS.useCrane, targets: [CRANE] };

  it('before the crane has power: a line and nothing else (the turn is spent), the row stays on the menu', () => {
    const engine = newEngine(1);
    const ctx = ctxOf(engine);
    while (takeReaction(ctx)) { /* empty */ }
    expect(applyUseCrane(ctx, asTidus(engine), use)).toBe(true);
    expect(peekReactions(ctx).map((r) => (r.kind === 'emit' ? (r.event as { name?: string }).name : r.kind))).toEqual([OB_CALLOUTS.noPower]);
    expect(flags(engine)[OB_CRANE_FLAG]).toBe(0);
    expect(crane(engine).flags.untargetable).not.toBe(true);
    expect(useCraneRows(ctx, asTidus(engine))).toHaveLength(1);
  });

  it('with the crane powered: the Crane row is queued as the crane\'s own forced action on the Oblitzerator, the command is spent and the crane untargetable', () => {
    const engine = newEngine(1);
    const ctx = ctxOf(engine);
    while (takeReaction(ctx)) { /* empty */ }
    flags(engine)[OB_CRANE_FLAG] = 1;
    expect(useCraneRows(ctx, asTidus(engine))).toHaveLength(1);
    expect(applyUseCrane(ctx, asTidus(engine), use)).toBe(true);
    const queued = peekReactions(ctx);
    expect(queued).toHaveLength(1);
    expect(queued[0]).toMatchObject({ kind: 'command', ownerId: CRANE, forced: true, byId: OBLITZERATOR, requiresAlive: OBLITZERATOR, command: { kind: 'ability', id: OB_ROWS.lift, targets: [OBLITZERATOR] } });
    expect(flags(engine)[OB_CRANE_FLAG]).toBe(2);
    expect(crane(engine).flags.untargetable).toBe(true);
    expect(useCraneRows(ctx, asTidus(engine))).toEqual([]);
    expect(applyUseCrane(ctx, asTidus(engine), use)).toBe(false); // a second use is refused
  });

  it('it is Tidus\'s alone: nobody else is offered it, and it names the crane or nothing', () => {
    const engine = newEngine(1);
    const ctx = ctxOf(engine);
    for (const id of ['lulu', 'kimahri']) {
      expect(useCraneOffered(ctx, actor(engine, id)), id).toBe(false);
      expect(useCraneRows(ctx, actor(engine, id)), id).toEqual([]);
    }
    expect(useCraneOffered(ctx, asTidus(engine))).toBe(true);
    expect(useCraneAvailable(ctx, asTidus(engine))).toBe(true);
    expect(applyUseCrane(ctx, asTidus(engine), { kind: 'trigger', id: OB_ROWS.useCrane, targets: [OBLITZERATOR] })).toBe(false);
    expect(applyUseCrane(ctx, asTidus(engine), { kind: 'trigger', id: OB_ROWS.useCrane, targets: [] })).toBe(false);
  });

  it('the row is a trigger aimed at the crane: command kind trigger, label Use crane, one valid target', () => {
    const engine = newEngine(1);
    const [row] = useCraneRows(ctxOf(engine), asTidus(engine));
    expect(row).toMatchObject({ command: { kind: 'trigger', id: 'use-crane' }, label: 'Use crane', category: 'special', enabled: true, validTargets: [CRANE], targeting: 'single-enemy' });
  });
});
