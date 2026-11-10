/**
 * Almighty Shinra and the Major Numerus on the real engine (the hidden FFX-2 chapter 53): the T0 checks of the paper preflight (`docs/plans/ch-fiend-superbosses-review.md` section 9), each by a number the engine produced and not
 * by the research note, with the enemies' scripts swapped for a QUEUE of commands (`forced`) against the Lv 99 line. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The scripts have their own files (a later stage of the lane); the data has its own (`fiend-superbosses-data.test.ts`). This file pins what the ENGINE does with the rows and the formation:
 *
 * (a) **The seven-actor formation.** The engine holds the Numerus as four enemies and three hidden parts (ten combatants with the girls). The party's menu offers the four heads and no part; a move at all enemies, and an enemy-side
 *     move at all allies, reach the four heads and no part; the parts' idle turns cost nothing. The HUD for four bars and the stage for four heads are the presentation lane's (stage 3), not this file's.
 * (b) **The death rule.** The game's rule (the last of the four heads to die sets the body and the pod to 0 HP) is the engine's standing rule for parts (`battle/ffx2/results.ts`: a part never gates victory): the fight goes on
 *     while any head stands, and ends in a victory the moment the last falls, in either order, with the three parts still at 1 HP.
 * (c) **The 99,999 bit.** The four Commands deal far more than the 9,999 cap (Fulmen 99,999 on the Alchemist), **are not touched by Protect or Shell** (their damage flags carry neither the physical nor the magical bit; the research
 *     note's "halved by Protect" is wrong for the engine and for the row), and are stopped only by Invincible. At the Lv 99 line's real HP every Command that hits a girl puts her down.
 * (d) **The status layer.** The heads are Lv 99 and so are the girls, so a status lands on the chance byte alone (the level term of `kernel/statusGroup1.ts` is zero): the 254 rows land on nearly every cast, the 75 to 130 rows
 *     on about a third of them or fewer. Measured below.
 * (e) **Miracle Drink.** Its recipe, ingredients and duration in our data.
 */
import { describe, expect, it } from 'vitest';

import { FS_ABILITY as A, NUMERUS_HEAD_IDS, NUMERUS_PART_IDS, X2_ALMIGHTY_SHINRA_ID } from '../../../src/data/fiend-superbosses-ids.ts';
import {
  GIRLS,
  attackOf,
  bigHp,
  damageOn,
  forcedAct,
  girlsOf,
  give,
  lv99Build,
  logOf,
  move,
  nextInput,
  openAct,
  playUntilActed,
  topUp,
  unit,
  type Act,
} from '../helpers/fiendSuperbossDrive.ts';

const T = 'x2-numerus-';
const HEADS = [...NUMERUS_HEAD_IDS];
const PARTS = [...NUMERUS_PART_IDS];

/** One cast of `abilityId` by `head` (forced script), the girls defending, with the HP rig and any extra rig applied; the damage on each girl. */
function castOnce(act: Act, head: string, abilityId: string, targets: string[], rig?: (e: ReturnType<typeof openAct>) => void, seed = 1, big = true) {
  const { group, queues } = forcedAct(act);
  const engine = openAct(act, seed, {
    group,
    setup: (e) => {
      if (big) bigHp(e);
      rig?.(e);
    },
  });
  queues[head]!.push(move(abilityId, targets));
  expect(playUntilActed(engine, head, 1)).toBe(true);
  const damage: Record<string, number[]> = {};
  for (const g of GIRLS) damage[g] = damageOn(engine, g).map((e) => e.amount ?? 0);
  return { engine, damage };
}

describe('(a) the seven-actor formation [T0 a]', () => {
  it('the engine holds the Numerus: four enemies and three parts beside the three girls (ten combatants), on the engine\'s slots 0 to 6, and starts without a throw', () => {
    const engine = openAct(2, 1);
    const state = engine.state();
    expect(Object.keys(state.combatants)).toHaveLength(10);
    expect(state.enemyIds).toEqual([...HEADS, ...PARTS]);
    expect(state.activeIds).toEqual([...GIRLS]);
    expect(Object.values(state.combatants).filter((c) => c.side === 'enemy').map((c) => c.slot)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    for (const id of PARTS) expect(unit(engine, id).flags).toMatchObject({ isPart: true, hidden: true, untargetable: true });
    for (const id of HEADS) expect(unit(engine, id).flags.isPart).toBeUndefined();
  });

  it('a girl\'s menu offers the four heads and no part, for the plain attack and for a move at all enemies', () => {
    const engine = openAct(2, 1);
    const d = nextInput(engine)!;
    expect(d).not.toBeNull();
    expect(d.commands.find((c) => c.command.kind === 'attack')!.validTargets).toEqual(HEADS);
    // Yuna's Darkness (all enemies) is offered with the same four
    let darkness: string[] | undefined;
    for (let i = 0; i < 40 && darkness === undefined; i++) {
      const input = i === 0 ? d : nextInput(engine);
      if (input === null) break;
      darkness = input.commands.find((c) => c.command.kind === 'ability' && 'id' in c.command && c.command.id === 'x2-dark-knight-darkness')?.validTargets;
      engine.submit({ kind: 'defend', targets: [] });
    }
    expect(darkness).toEqual(HEADS);
  });

  it('Yuna\'s Darkness (all enemies) hits each of the four heads once (between 5,000 and 8,000 a hit at Lv 99 against their Defense) and no part; the parts stay at 1 HP, alive', () => {
    const { group } = forcedAct(2);
    const engine = openAct(2, 1, { group, immortal: true });
    let submitted = false;
    for (let i = 0; i < 4000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
      else if (d.kind === 'player-input') {
        if (d.actorId === 'yuna' && !submitted) {
          submitted = true;
          const row = d.commands.find((c) => c.command.kind === 'ability' && 'id' in c.command && c.command.id === 'x2-dark-knight-darkness')!;
          engine.submit({ ...row.command, targets: [] });
        } else engine.submit({ kind: 'defend', targets: [] });
      } else if (d.kind === 'battle-over') break;
      if (submitted && logOf(engine).filter((e) => e.type === 'action-end' && e.actorId === 'yuna').length >= 2) break;
    }
    const hits = logOf(engine).filter((e) => e.type === 'damage' && e.sourceId === 'yuna');
    expect(hits.map((e) => e.targetId)).toEqual(HEADS);
    for (const hit of hits) {
      expect(hit.amount, hit.targetId).toBeGreaterThan(5_000);
      expect(hit.amount, hit.targetId).toBeLessThan(8_000);
    }
    for (const id of PARTS) expect([unit(engine, id).hp, unit(engine, id).alive], id).toEqual([1, true]);
  });

  it('an enemy-side move at all allies (Unum\'s Shell and Protect) lays the status on the four heads and on no part: the monster-side search of the script sees four monsters, not seven', () => {
    const { group, queues } = forcedAct(2);
    const engine = openAct(2, 1, { group, immortal: true });
    queues[`${T}unum`]!.push(move(A.shell), move(A.protect));
    expect(playUntilActed(engine, `${T}unum`, 2, () => null, { immortal: true })).toBe(true);
    for (const id of HEADS) expect(Object.keys(unit(engine, id).statuses).sort(), id).toEqual(['protect', 'shell', 'spellspring']);
    for (const id of PARTS) expect(Object.keys(unit(engine, id).statuses), id).toEqual([]);
  });

  it('the hidden parts cost nothing: 150 seconds of a quiet Numerus take about 1,200 steps and each part has about eight idle turns (Agility 1); act 1 takes about 760 steps in the same time', () => {
    for (const [act, bound] of [[2, 2_500], [1, 1_500]] as const) {
      const { group } = forcedAct(act);
      const engine = openAct(act, 1, { group, immortal: true });
      let steps = 0;
      while (engine.state().ticks < 150 * 60 && steps < 20_000) {
        steps += 1;
        const d = engine.nextDecision();
        if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
        else if (d.kind === 'player-input') {
          topUp(engine);
          engine.submit({ kind: 'defend', targets: [] });
        } else if (d.kind === 'battle-over') break;
      }
      expect(steps, `act ${act}`).toBeLessThan(bound);
      if (act === 2) {
        for (const id of PARTS) {
          const turns = logOf(engine).filter((e) => e.type === 'turn-start' && e.actorId === id).length;
          expect(turns, id).toBeLessThanOrEqual(12);
        }
      }
    }
  });
});

describe('(b) the death rule [T0 b]', () => {
  for (const [label, order] of [['Unum, Duo, Tria, Quattour', HEADS], ['Quattour, Tria, Duo, Unum', [...HEADS].reverse()]] as const) {
    it(`heads taken down one by one (${label}): the fight goes on after the first three and ends in a victory when the last falls; the body, pod and tail are still at 1 HP and nothing was paid for them`, () => {
      const { group } = forcedAct(2);
      const engine = openAct(2, 3, { group, immortal: true });
      let over: { outcome: string; exp: number; gil: number; ap: number; drops: unknown[] } | null = null;
      const verdicts: string[] = [];
      for (const target of order) {
        unit(engine, target).hp = 1;
        for (let i = 0; i < 3000 && unit(engine, target).alive; i++) {
          const d = engine.nextDecision();
          if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
          else if (d.kind === 'player-input') engine.submit(attackOf(d, target));
          else if (d.kind === 'battle-over') {
            over = d.result as never;
            break;
          }
        }
        // ask the engine whether the fight is over now (it commits the end only after the commit window)
        for (let i = 0; i < 200 && over === null; i++) {
          const d = engine.nextDecision();
          if (d.kind === 'battle-over') over = d.result as never;
          if (d.kind === 'player-input') break;
          if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
        }
        verdicts.push(`${target}:${unit(engine, target).alive ? 'alive' : 'down'}:${over === null ? 'on' : 'over'}`);
        if (over !== null) break;
      }
      expect(verdicts).toEqual(order.map((id, i) => `${id}:down:${i === 3 ? 'over' : 'on'}`));
      expect(over!.outcome).toBe('victory');
      for (const id of PARTS) expect([unit(engine, id).hp, unit(engine, id).alive], id).toEqual([1, true]);
      // the four heads pay their rows (EXP 6,000, Gil 5,000, AP 1 each); the parts pay nothing; the heads' item slots are 0 in our tables (the drops are named gaps)
      expect([over!.exp, over!.gil, over!.ap, over!.drops]).toEqual([24_000, 20_000, 4, []]);
      const kos = logOf(engine).filter((e) => e.type === 'ko').map((e) => e.targetId);
      expect(kos).toEqual([...order]);
    });
  }
});

describe('(c) the 99,999 bit on the four Commands [T0 c]', () => {
  it('bare, at 900,000 HP: Radis 28,643 on one girl (the same on the Alchemist: formula 1 ignores Defense), Venam about 14,500 each, Fulmen about 58,000 and 62,000 on the Dark Knights and 99,999 (the cap) on the Alchemist, Mortis about 19,000: every Command is far past the 9,999 of an ordinary blow', () => {
    const radisYuna = castOnce(2, `${T}unum`, A.radisCommand, ['yuna']).damage;
    const radisRikku = castOnce(2, `${T}unum`, A.radisCommand, ['rikku']).damage;
    expect(radisYuna['yuna']).toHaveLength(1);
    expect(radisYuna['yuna']![0]).toBeGreaterThan(26_000);
    expect(radisYuna['yuna']![0]).toBeLessThan(31_500);
    expect(radisRikku['rikku']![0], 'formula 1 ignores Defense: the same number on the Alchemist').toBe(radisYuna['yuna']![0]);
    expect([radisYuna['rikku'], radisYuna['paine']], 'single target: nobody else is touched').toEqual([[], []]);

    const venam = castOnce(2, `${T}duo`, A.venamCommand, []).damage;
    for (const g of GIRLS) {
      expect(venam[g], g).toHaveLength(1);
      expect(venam[g]![0], g).toBeGreaterThan(13_000);
      expect(venam[g]![0], g).toBeLessThan(16_000);
    }

    const fulmen = castOnce(2, `${T}tria`, A.fulmenCommand, []).damage;
    for (const g of ['yuna', 'paine']) {
      expect(fulmen[g], g).toHaveLength(1);
      expect(fulmen[g]![0], g).toBeGreaterThan(52_000);
      expect(fulmen[g]![0], g).toBeLessThan(68_000);
    }
    expect(fulmen['rikku'], 'the Alchemist takes the cap: 99,999').toEqual([99_999]);

    const mortis = castOnce(2, `${T}quattour`, A.mortisCommand, []).damage;
    for (const g of GIRLS) {
      expect(mortis[g], g).toHaveLength(1);
      expect(mortis[g]![0], g).toBeGreaterThan(17_000);
      expect(mortis[g]![0], g).toBeLessThan(21_000);
    }

    // For contrast, the same HP rig: a plain Ultima (power 70) and an Absorb stay at the 9,999 cap; the Commands' bit is what lifts it.
    const ultima = castOnce(2, `${T}duo`, A.ultima, []).damage;
    for (const g of GIRLS) expect(ultima[g], g).toEqual([9_999]);
  });

  it('Protect and Shell change nothing: the same four numbers with both on all three girls (the Commands carry neither the physical nor the magical bit)', () => {
    const guard = (e: ReturnType<typeof openAct>): void => {
      for (const g of girlsOf(e)) {
        give(g, 'protect');
        give(g, 'shell');
      }
    };
    const cases: Array<[string, string, string[]]> = [
      [`${T}unum`, A.radisCommand, ['yuna']],
      [`${T}duo`, A.venamCommand, []],
      [`${T}tria`, A.fulmenCommand, []],
      [`${T}quattour`, A.mortisCommand, []],
    ];
    for (const [head, id, targets] of cases) {
      const bare = castOnce(2, head, id, targets).damage;
      const guarded = castOnce(2, head, id, targets, guard).damage;
      expect(guarded, id).toEqual(bare);
    }
  });

  it('Invincible (the Miracle Drink status) is the answer: a Fulmen and a Venam do nothing to girls who carry it', () => {
    const inv = (e: ReturnType<typeof openAct>): void => {
      for (const g of girlsOf(e)) give(g, 'invincible');
    };
    for (const [head, id] of [[`${T}tria`, A.fulmenCommand], [`${T}duo`, A.venamCommand]] as const) {
      const { damage } = castOnce(2, head, id, [], inv);
      for (const g of GIRLS) expect(damage[g], `${id} on ${g}`).toEqual([]);
    }
  });

  it('Fulmen is Thunder (element 4): its damage events carry the element, and the girls have no protection from it in the engine: their affinities are empty and no accessory sets one (NulShock-type gear is not modelled: a named seam for the Thunder-proof kit what-if of the preflight)', () => {
    const { engine } = castOnce(2, `${T}tria`, A.fulmenCommand, []);
    const hits = logOf(engine).filter((e) => e.type === 'damage' && e.sourceId === `${T}tria`);
    expect(hits.map((e) => e.targetId)).toEqual([...GIRLS]);
    expect(hits.map((e) => e.element)).toEqual(['lightning', 'lightning', 'lightning']);
    expect(hits.map((e) => e.affinity)).toEqual(['normal', 'normal', 'normal']);
    for (const g of GIRLS) expect(unit(engine, g).affinities, g).toEqual({});
  });

  it('at the Lv 99 line\'s real HP (10,710, 5,106 and 10,710) every Command that hits a girl puts her down: Fulmen, Venam and Mortis on all three, Radis on the one it names', () => {
    for (const [head, id, targets, down] of [
      [`${T}tria`, A.fulmenCommand, [], ['yuna', 'rikku', 'paine']],
      [`${T}duo`, A.venamCommand, [], ['yuna', 'rikku', 'paine']],
      [`${T}quattour`, A.mortisCommand, [], ['yuna', 'rikku', 'paine']],
      [`${T}unum`, A.radisCommand, ['paine'], ['paine']],
    ] as const) {
      const { engine } = castOnce(2, head, id, [...targets], undefined, 1, false);
      expect(GIRLS.filter((g) => !unit(engine, g).alive), id).toEqual([...down]);
    }
  });
});

describe('(d) the status layer against the Lv 99 line [T0 d]', () => {
  const SEEDS = Array.from({ length: 12 }, (_, i) => i + 1);
  const landed = (head: string, id: string, status: string, aimAtYuna: boolean): number => {
    let n = 0;
    for (const seed of SEEDS) {
      const { engine } = castOnce(2, head, id, aimAtYuna ? ['yuna'] : [], undefined, seed);
      if (unit(engine, 'yuna').statuses[status as 'petrify'] !== undefined) n += 1;
    }
    return n;
  };

  it('the heads are Lv 99 and so are the girls, so the level term of the roll is zero and the roll is `draw % 101` against the chance byte: nothing in the build as given (no Ribbon, no status-proof auto-ability) stops a status', () => {
    const engine = openAct(2, 1);
    expect(HEADS.map((id) => unit(engine, id).level)).toEqual([99, 99, 99, 99]);
    expect(GIRLS.map((id) => unit(engine, id).level)).toEqual([99, 99, 99]);
  });

  it('chance 100 and above always lands (12 of 12 seeds on Yuna): Bio\'s Poison 100, Confuse 100, Slowga\'s Slow 130, Venam Command\'s Poison 254', () => {
    expect(landed(`${T}duo`, A.bio, 'poison', false)).toBe(12);
    expect(landed(`${T}duo`, A.confuse, 'confuse', true)).toBe(12);
    expect(landed(`${T}duo`, A.slowga, 'slow', false)).toBe(12);
    expect(landed(`${T}duo`, A.venamCommand, 'poison', false)).toBe(12);
  });

  it('chance 75 and 80 lands on about three casts in four (between 8 and 12 of 12 seeds): Sleep, Berserk, Blind, Silence at 75 and Break\'s Petrify at 80', () => {
    for (const [id, status] of [[A.sleep, 'sleep'], [A.berserk, 'berserk'], [A.blind, 'darkness'], [A.silence, 'silence'], [A.break, 'petrify']] as const) {
      const n = landed(`${T}duo`, id, status, true);
      expect(n, id).toBeGreaterThanOrEqual(8);
      expect(n, id).toBeLessThanOrEqual(12);
    }
  });

  it('a Ribbon (modelled: a blanket immunity to Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Itchy, Slow and Stop) stops every status Duo throws, Venam\'s Poison included, on all 12 seeds', () => {
    const ribbonBuild = (): ReturnType<typeof lv99Build> => {
      const build = lv99Build();
      for (const m of build.members) m.accessories = ['ribbon', ...m.accessories.slice(1)];
      return build;
    };
    for (const [id, status] of [[A.bio, 'poison'], [A.confuse, 'confuse'], [A.slowga, 'slow'], [A.sleep, 'sleep'], [A.berserk, 'berserk'], [A.blind, 'darkness'], [A.silence, 'silence'], [A.break, 'petrify'], [A.venamCommand, 'poison']] as const) {
      for (const seed of SEEDS) {
        const { group, queues } = forcedAct(2);
        const engine = openAct(2, seed, { group, build: ribbonBuild(), setup: (e) => bigHp(e) });
        queues[`${T}duo`]!.push(move(id, ['yuna']));
        expect(playUntilActed(engine, `${T}duo`, 1)).toBe(true);
        expect(unit(engine, 'yuna').statuses[status as 'petrify'], `${id} seed ${seed}`).toBeUndefined();
      }
    }
  });

  it('Dispel (Unum) strips Shell, Protect and Haste from the girl it names, and only from her', () => {
    const { engine } = castOnce(2, `${T}unum`, A.dispel, ['yuna'], (e) => {
      for (const g of girlsOf(e)) {
        give(g, 'shell');
        give(g, 'protect');
        give(g, 'haste');
      }
    });
    expect(Object.keys(unit(engine, 'yuna').statuses).filter((s) => ['shell', 'protect', 'haste'].includes(s))).toEqual([]);
    for (const id of ['rikku', 'paine']) expect(Object.keys(unit(engine, id).statuses).filter((s) => ['shell', 'protect', 'haste'].includes(s)).sort(), id).toEqual(['haste', 'protect', 'shell']);
  });
});

describe('(e) Miracle Drink [T0 e]', () => {
  it('the recipe in our data: 130 ordered pairs of the 68 items make it, and every one has Dark Matter in a slot (Dark Matter + any of the 68, and 63 items + Dark Matter); the order matters (Megalixir + Dark Matter is a Final Elixir)', async () => {
    const { MIX_ITEM_IDS } = await import('../../../src/battle/ffx2/adapt/mix.ts');
    const { mixRecipe } = await import('../../../src/battle/ffx2/kernel/mix-recipe.ts');
    const dm = MIX_ITEM_IDS.indexOf('x2-dark-matter');
    const mega = MIX_ITEM_IDS.indexOf('x2-megalixir');
    const pairs: Array<[number, number]> = [];
    for (let a = 0; a < MIX_ITEM_IDS.length; a++) for (let b = 0; b < MIX_ITEM_IDS.length; b++) if (mixRecipe(0x2000 + a, 0x2000 + b) === 0x31b8) pairs.push([a, b]);
    expect(pairs).toHaveLength(130);
    expect(pairs.every(([a, b]) => a === dm || b === dm)).toBe(true);
    expect(pairs.filter(([a]) => a === dm)).toHaveLength(68);
    expect(pairs.filter(([, b]) => b === dm)).toHaveLength(63);
    expect(mixRecipe(0x2000 + dm, 0x2000 + mega)).toBe(0x31b8);
    expect(mixRecipe(0x2000 + mega, 0x2000 + dm)).toBe(0x31ac);
  });

  it('the Lv 99 line\'s bag as built (ten Megalixirs, Light and Lunar Curtains, Remedies) has no Dark Matter, so it can make no Miracle Drink; Rikku\'s menu has no Mix row yet (the picker is a later step of the Mix lane: a headless run submits the command directly)', () => {
    const build = lv99Build();
    expect((build.inventory ?? []).map((i) => i.itemId).sort()).toEqual(['x2-light-curtain', 'x2-lunar-curtain', 'x2-megalixir', 'x2-remedy']);
    const engine = openAct(2, 1);
    for (let i = 0; i < 12; i++) {
      const d = nextInput(engine)!;
      if (d.actorId === 'rikku') {
        expect(d.commands.some((c) => c.command.kind === 'ability' && 'id' in c.command && c.command.id === 'x2-alchemist-mix')).toBe(false);
        break;
      }
      engine.submit({ kind: 'defend', targets: [] });
    }
  });

  it('with Dark Matter and a Potion in the bag, Rikku\'s Mix (Dark Matter first) makes the Miracle Drink: all three girls become Invincible for about 3.9 seconds (236 ticks at 60 a second), the same for each; two items are spent', () => {
    const build = lv99Build();
    build.inventory = [...(build.inventory ?? []), { itemId: 'x2-dark-matter', count: 3 }, { itemId: 'x2-potion', count: 3 }];
    const { group } = forcedAct(2);
    const engine = openAct(2, 1, { group, build });
    let submitted = false;
    const appliedAt: Record<string, number> = {};
    const goneAt: Record<string, number> = {};
    for (let i = 0; i < 40_000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'player-input') {
        if (d.actorId === 'rikku' && !submitted) {
          submitted = true;
          engine.submit({ kind: 'ability', id: 'x2-alchemist-mix', targets: [], extra: { kind: 'rikku-mix', mix: { ingredients: ['x2-dark-matter', 'x2-potion'], resultAbilityId: null } } } as never);
          continue;
        }
        engine.submit({ kind: 'defend', targets: [] });
      } else if (d.kind === 'waiting') engine.tick(Math.max(1, Math.min(d.nextEventMs, 6)));
      else if (d.kind === 'battle-over') break;
      const now = engine.state().ticks;
      for (const g of GIRLS) {
        const has = unit(engine, g).statuses['invincible'] !== undefined;
        if (has && appliedAt[g] === undefined) appliedAt[g] = now;
        if (!has && appliedAt[g] !== undefined && goneAt[g] === undefined) goneAt[g] = now;
      }
      if (submitted && GIRLS.every((g) => goneAt[g] !== undefined)) break;
    }
    expect(logOf(engine).some((e) => e.type === 'action-start' && e.abilityId === 'x2-mix-miracle-drink')).toBe(true);
    const lasted = GIRLS.map((g) => goneAt[g]! - appliedAt[g]!);
    for (const ticks of lasted) {
      expect(ticks).toBeGreaterThan(210);
      expect(ticks).toBeLessThan(260);
    }
    expect(new Set(lasted).size, 'the same for each girl').toBe(1);
    expect(engine.state().flags['inventory:x2-dark-matter']).toBe(2);
    expect(engine.state().flags['inventory:x2-potion']).toBe(2);
  });
});

describe('Almighty Shinra [T0 sizes and Regen]', () => {
  const S = X2_ALMIGHTY_SHINRA_ID;

  it('he stands with Regen and Spellspring from the first moment; his Regen heals 1/32 of his maximum HP (8,593) every 2.8 seconds (about 3,000 HP a second) at his Agility of 255', () => {
    const { group } = forcedAct(1);
    const engine = openAct(1, 1, { group, immortal: true });
    expect(Object.keys(unit(engine, S).statuses).sort()).toEqual(['regen', 'spellspring']);
    unit(engine, S).hp = 100_000;
    const marks: Array<[number, number]> = [];
    let last = 100_000;
    const start = engine.state().ticks;
    for (let i = 0; i < 20_000 && engine.state().ticks - start < 60 * 60; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
      else if (d.kind === 'player-input') {
        topUp(engine);
        engine.submit({ kind: 'defend', targets: [] });
      } else if (d.kind === 'battle-over') break;
      const hp = unit(engine, S).hp;
      if (hp !== last) {
        marks.push([engine.state().ticks - start, hp - last]);
        last = hp;
      }
    }
    expect(marks.slice(0, 6).map(([, amount]) => amount)).toEqual([8_593, 8_593, 8_593, 8_593, 8_593, 8_593]);
    const gaps = marks.slice(1, 8).map(([tick], i) => tick - marks[i]![0]);
    for (const gap of gaps) expect(Math.abs(gap - 169)).toBeLessThanOrEqual(2);
    expect(unit(engine, S).hp, 'a minute of quiet restores him from 100,000 to full').toBe(275_000);
  });

  it('his moves on the Lv 99 line, one at a time at 900,000 HP: Clione is ten hits in all spread over the girls; Haste lands on himself; Ultima is one hit each, capped at 9,999; the Attack and Fireworks are mostly evaded by the Luck 111 of Rabite\'s Foot (accuracy formula 2)', () => {
    const clione = castOnce(1, S, A.clione, []).damage;
    expect(GIRLS.reduce((n, g) => n + clione[g]!.length, 0)).toBe(10);
    const haste = castOnce(1, S, A.haste, []).engine;
    expect(Object.keys(unit(haste, S).statuses).sort()).toEqual(['haste', 'regen', 'spellspring']);
    const ultima = castOnce(1, S, A.ultimaShinra, []).damage;
    for (const g of GIRLS) {
      expect(ultima[g], g).toHaveLength(1);
      expect(ultima[g]![0], g).toBeGreaterThan(6_000);
      expect(ultima[g]![0], g).toBeLessThanOrEqual(9_999);
    }
    // The Attack and Fireworks roll against Luck (accuracy formula 2): 12 seeds, hits on Yuna at the Luck of Rabite's Foot (111).
    let attackHits = 0;
    let fireworksHits = 0;
    for (let seed = 1; seed <= 12; seed++) {
      if (castOnce(1, S, A.attack, ['yuna'], undefined, seed).damage['yuna']!.length > 0) attackHits += 1;
      if (castOnce(1, S, A.fireworks, [], undefined, seed).damage['yuna']!.length > 0) fireworksHits += 1;
    }
    // measured: the Attack connects on Yuna in 5 of 12 seeds, Fireworks in 5 (Rikku, Luck 61 lower, 9; Paine 6)
    expect(attackHits, 'the Attack on Yuna in 12 seeds').toBeLessThanOrEqual(8);
    expect(fireworksHits, 'Fireworks on Yuna in 12 seeds').toBeLessThanOrEqual(8);
  });

  it('the Regen race: the base line (Yuna and Paine on Darkness, Rikku on Attack, immortal) deals about 600,000 in two minutes against his idle self and his Regen heals back about 350,000 of it, so he ends the two minutes under 60,000 HP: the line out-damages the Regen, by about 2,000 HP a second net', () => {
    for (const seed of [1, 2, 3]) {
      const { group } = forcedAct(1);
      const engine = openAct(1, seed, { group, immortal: true });
      let dealt = 0;
      let healed = 0;
      let last = unit(engine, S).hp;
      for (let i = 0; i < 100_000 && engine.state().ticks < 120 * 60; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
        else if (d.kind === 'player-input') {
          topUp(engine);
          const row = d.actorId === 'rikku' ? undefined : d.commands.find((c) => c.command.kind === 'ability' && 'id' in c.command && c.command.id === 'x2-dark-knight-darkness');
          engine.submit(row ? ({ ...row.command, targets: [] } as never) : attackOf(d, S));
        } else if (d.kind === 'battle-over') break;
        const hp = unit(engine, S).hp;
        if (hp < last) dealt += last - hp;
        else healed += hp - last;
        last = hp;
      }
      expect(dealt, `seed ${seed}`).toBeGreaterThan(500_000);
      expect(dealt, `seed ${seed}`).toBeLessThan(700_000);
      expect(healed, `seed ${seed}`).toBeGreaterThan(300_000);
      expect(healed, `seed ${seed}`).toBeLessThan(400_000);
      expect(unit(engine, S).hp, `seed ${seed}`).toBeLessThan(60_000);
    }
  });

  it('Final Impact is fourteen hits in all (a hit is an eighth of the girl\'s MAXIMUM HP and MP, so it is capped at 99,999 under the 900,000 rig); at the real HP one Impact leaves the Lv 99 girls alive but under a third of their HP', () => {
    const rigged = castOnce(1, S, A.finalImpact, []).damage;
    expect(GIRLS.reduce((n, g) => n + rigged[g]!.length, 0)).toBe(14);
    const { engine } = castOnce(1, S, A.finalImpact, [], undefined, 1, false);
    for (const g of GIRLS) expect(unit(engine, g).alive, g).toBe(true);
    expect(GIRLS.map((g) => unit(engine, g).hp / unit(engine, g).stats.maxHp).every((fraction) => fraction < 0.35)).toBe(true);
  });

  it('only blows that ignore Defense work on him (Defense 255): Darkness does 5,000 to 9,999 a hit, a plain Attack under 1,000', () => {
    const run = (seed: number, darkness: boolean): number[] => {
      const { group } = forcedAct(1);
      const engine = openAct(1, seed, { group, immortal: true });
      for (let i = 0; i < 3000 && logOf(engine).filter((e) => e.type === 'damage' && e.targetId === S).length < 8; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
        else if (d.kind === 'player-input') {
          topUp(engine);
          const row = darkness && d.actorId !== 'rikku' ? d.commands.find((c) => c.command.kind === 'ability' && 'id' in c.command && c.command.id === 'x2-dark-knight-darkness') : undefined;
          engine.submit(row ? ({ ...row.command, targets: [] } as never) : attackOf(d, S));
        } else if (d.kind === 'battle-over') break;
      }
      return logOf(engine).filter((e) => e.type === 'damage' && e.targetId === S && e.sourceId !== undefined).map((e) => e.amount ?? 0);
    };
    const attacks = run(3, false);
    expect(attacks.length).toBeGreaterThan(0);
    expect(Math.max(...attacks)).toBeLessThan(1_000);
    const dark = run(1, true).filter((amount) => amount > 3_000); // Rikku's attacks in the same run are the small ones
    expect(dark.length).toBeGreaterThan(0);
    for (const amount of dark) {
      expect(amount).toBeGreaterThan(5_000);
      expect(amount).toBeLessThanOrEqual(9_999);
    }
  });
});
