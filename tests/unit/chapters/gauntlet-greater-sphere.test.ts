/**
 * **The Greater Sphere against the game's bytecode** (`research/re-ffx-monster-arena-creations.md` 3.5, "RE n"; FFX only; the hidden Gauntlet chapter's act 5): its script
 * (`src/battle/ffx/ai/gauntlet-greater-sphere.ts`) pinned to the **interpreter's run of the real hook bytecode of `m281`** (the lane's `t-gsphere.out.txt`; the note had read it "in outline only"). The four starting states,
 * the turn's two draws (exact over all 65,536 values), the reply matrix cell by cell (20 commands in each of the four states, both signs of the damage, run through the real damage path), the aeon variant, the shift,
 * the gates, and the real engine on three seeds.
 */
import { describe, expect, it } from 'vitest';

import type { FFXCombatant } from '../../../src/battle/common/types.ts';
import { resolveAbility } from '../../../src/battle/ffx/abilities.ts';
import { chooseAiCommand } from '../../../src/battle/ffx/ai/index.ts';
import { peekReactions } from '../../../src/battle/ffx/ai/hooks.ts';
import {
  GS_COIN_MODULO, GS_PRESS_DRAW, GS_STATES, applySphereSetup, ensureSphereState, greaterSphereTurn, setNewState, sphereStateIndex,
} from '../../../src/battle/ffx/ai/gauntlet-greater-sphere.ts';
import { GAUNTLET_IDS, GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPTS, SPHERE_DOUBLECAST_FLAG, SPHERE_STATE_FLAG } from '../../../src/battle/ffx/ai/gauntlet-rules.ts';
import { PRESS_CHANCE_BELOW, SM_ELEMENTS, applyState, hitBitsAtHit, pressLine, readHit } from '../../../src/battle/ffx/ai/spherimorph-rules.ts';
import { FfxStream } from '../../../src/battle/ffx/adapt/streams.ts';
import { getAiScript } from '../../../src/battle/ffx/ai/types.ts';
import '../../../src/battle/ffx/ai/index.ts';
import { aiOf, bossOf, fakeArena, rowOf } from '../helpers/gauntletFake.ts';
import { actions, actor, careless, ctxOf, newEngine, nextInput, playOne, row, turnActions } from '../helpers/gauntletDrive.ts';
import { SPHERE_COMMANDS, SPHERE_MATRIX, SPHERE_WITH_AEON } from '../helpers/gauntletSphereMatrix.ts';
import { SPHERE, abilityOf, drain, replyTo, setState, shiftsOf, sphere, sphereEngine, stateOf } from '../helpers/gauntletSphere.ts';

const OPPOSITE: Readonly<Record<string, string>> = { fire: 'ice', ice: 'fire', lightning: 'water', water: 'lightning' };
const AGA_OF: Readonly<Record<string, string>> = { fire: ROW.firaga, ice: ROW.blizzaga, lightning: ROW.thundaga, water: ROW.waterga };

describe('registered under the id the data names; the four states (the interpreter\'s init)', () => {
  it('the AI script and the hooks', () => {
    expect(getAiScript(GAUNTLET_SCRIPTS.greaterSphere)).toBeDefined();
    expect(GAUNTLET_IDS.greaterSphere).toBe('greater-sphere');
  });

  it('weak Fire, Ice, Thunder, Water; the player-side row is the -aga of the OPPOSITE element (Spherimorph\'s pairing), the monster-side row is Ultima 0x40F3 in all four', () => {
    expect(GS_STATES.map((s) => s.weak)).toEqual(['fire', 'ice', 'lightning', 'water']);
    expect(GS_STATES.map((s) => s.physical)).toEqual([ROW.blizzaga, ROW.firaga, ROW.waterga, ROW.thundaga]); // v7 = 12362, 12361, 12364, 12363
    for (const s of GS_STATES) expect(s.physical).toBe(AGA_OF[OPPOSITE[s.weak]!]);
    expect(GS_STATES.map((s) => s.magic)).toEqual([ROW.ultima, ROW.ultima, ROW.ultima, ROW.ultima]); // v8 = 16627
    expect(ROW.ultima).toBe('gauntlet-ultima');
  });

  it('each state weakens one element and absorbs the other three and Holy', () => {
    const engine = sphereEngine(1);
    for (let s = 0; s < 4; s++) {
      applyState(sphere(engine), s);
      const a = sphere(engine).affinities;
      for (const e of SM_ELEMENTS) expect(a[e], `state ${s} ${e}`).toBe(e === GS_STATES[s]!.weak ? 'weak' : 'absorb');
      expect(a.holy).toBe('absorb');
    }
  });

  it('the starting draw is `GetRandomValue() mod 4`: exactly 16,384 of 65,536 each (the interpreter\'s init tally)', () => {
    const tally = [0, 0, 0, 0];
    for (let raw = 0; raw <= 0xffff; raw++) {
      const f = fakeArena({ boss: SPHERE, raw });
      const self = bossOf(f, SPHERE);
      self.affinities = {};
      tally[setNewState(f.ctx, self)]!++;
      expect(f.ctx.state.flags[SPHERE_STATE_FLAG]).toBe(raw % 4);
    }
    expect(tally).toEqual([16_384, 16_384, 16_384, 16_384]);
  });

  it('on the engine every seed starts in a state with the affinities written, all four states occur over 200 seeds, and the half-HP line is 750,000', () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const engine = sphereEngine(seed);
      const s = stateOf(engine);
      expect(sphereStateIndex(ctxOf(engine)), `seed ${seed}`).toBe(s);
      expect(sphere(engine).affinities[GS_STATES[s]!.weak]).toBe('weak');
      expect(sphere(engine).affinities.holy).toBe('absorb');
      seen.add(s);
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
    expect(pressLine(sphere(sphereEngine(1)).stats.maxHp)).toBe(750_000);
  });

  it('the set-up draws once and is a no-op on a battle of another creature; a second call keeps the state', () => {
    const engine = sphereEngine(5);
    const before = stateOf(engine);
    applySphereSetup(ctxOf(engine), SPHERE);
    expect(stateOf(engine)).toBe(before);
    const king = newEngine(5, 'cactuar-king');
    applySphereSetup(ctxOf(king), 'cactuar-king');
    expect(ctxOf(king).state.flags[SPHERE_STATE_FLAG]).toBeUndefined();
    expect(ensureSphereState(ctxOf(engine), sphere(engine))).toBe(before);
  });
});

describe('the turn: a draw modulo 100 every turn, a second modulo 2 only when the first test fails (the interpreter\'s onTurn)', () => {
  const turn = (hp: number, seq: number[], living = 3): { row: string; targets: readonly string[]; draws: number } => {
    const f = fakeArena({ boss: SPHERE, raw: seq, bossHp: hp, living });
    f.ctx.state.flags[SPHERE_STATE_FLAG] = 0;
    const c = greaterSphereTurn(aiOf(f, SPHERE));
    return { row: rowOf(c), targets: c?.targets ?? [], draws: f.draws.filter(([s]) => s === FfxStream.Script).length };
  };

  it('the interpreter\'s sequences: above half the first draw is taken and only the second decides; at HP 750,000-equivalent (the line, not below) the same; below, a first draw under 50 presses without a second draw', () => {
    // fake maxHp is 1000: the line is 500
    expect(turn(1000, [0, 0])).toMatchObject({ row: ROW.hydraulicPress, draws: 2 });
    expect(turn(1000, [0, 1])).toMatchObject({ row: ROW.attack, draws: 2 });
    expect(turn(1000, [49, 1])).toMatchObject({ row: ROW.attack, draws: 2 });
    expect(turn(1000, [50, 0])).toMatchObject({ row: ROW.hydraulicPress, draws: 2 });
    expect(turn(500, [0, 1])).toMatchObject({ row: ROW.attack, draws: 2 }); // exactly the line: not below it
    expect(turn(499, [0, 0])).toMatchObject({ row: ROW.hydraulicPress, draws: 1 });
    expect(turn(499, [0, 1])).toMatchObject({ row: ROW.hydraulicPress, draws: 1 });
    expect(turn(499, [49, 1])).toMatchObject({ row: ROW.hydraulicPress, draws: 1 });
    expect(turn(499, [50, 0])).toMatchObject({ row: ROW.hydraulicPress, draws: 2 });
    expect(turn(499, [50, 1])).toMatchObject({ row: ROW.attack, draws: 2 });
    expect(turn(499, [99, 1])).toMatchObject({ row: ROW.attack, draws: 2 });
    expect([GS_COIN_MODULO, GS_PRESS_DRAW, PRESS_CHANCE_BELOW]).toEqual([2, 0, 50]);
  });

  it('exact shares over the draws: above half Press 65,536 of 131,072 (50.00 percent); below half 98,322 of 131,072 (75.01 percent, the interpreter\'s 3,221,815,296 of 2^32)', () => {
    const count = (hp: number): number => {
      let press = 0;
      for (let a = 0; a < 0x10000; a++) for (const b of [0, 1]) if (turn(hp, [a, b]).row === ROW.hydraulicPress) press++;
      return press;
    };
    expect(count(1000)).toBe(65_536);
    expect(count(499)).toBe(98_322);
    expect(98_322 * 32_768).toBe(3_221_815_296);
  });

  it('Press is aimed at the whole living front line, the Attack at one random living member (one picker draw with two or more standing, none with one)', () => {
    expect(turn(1000, [0, 0]).targets).toEqual(['m0', 'm1', 'm2']);
    expect(turn(1000, [0, 0], 2).targets).toEqual(['m0', 'm1']);
    const attack = (living: number): ReturnType<typeof fakeArena> => {
      const f = fakeArena({ boss: SPHERE, raw: [0, 1], living, pick: 1 });
      f.ctx.state.flags[SPHERE_STATE_FLAG] = 0;
      greaterSphereTurn(aiOf(f, SPHERE));
      return f;
    };
    expect(attack(3).draws).toEqual([[FfxStream.Script, 0xffff], [FfxStream.Script, 0xffff], [FfxStream.Picker, 2]]);
    expect(attack(1).draws).toEqual([[FfxStream.Script, 0xffff], [FfxStream.Script, 0xffff]]);
    const f = fakeArena({ boss: SPHERE, raw: [0, 1], living: 0 });
    f.ctx.state.flags[SPHERE_STATE_FLAG] = 0;
    expect(greaterSphereTurn(aiOf(f, SPHERE))).toBeNull();
  });

  it('it never casts on its own turn (a real battle): its own turns are the Attack and Hydraulic Press only', () => {
    for (const seed of [1, 2, 3]) {
      const run = playOne(seed, 'greater-sphere', careless);
      for (const a of turnActions(run.events, SPHERE)) expect(['attack', ROW.attack, ROW.hydraulicPress], `seed ${seed}: ${a}`).toContain(a);
    }
  });
});

describe('the reply matrix: 20 commands in each of the four states (the interpreter\'s table), through the real damage path', () => {
  const CASES: ReadonlyArray<{ name: string; user: string; id?: string; weapon?: string }> = [
    { name: 'Attack, no element', user: 'tidus' },
    { name: 'Attack with a Fire weapon', user: 'tidus', weapon: 'fire' },
    { name: 'Attack with an Ice weapon', user: 'tidus', weapon: 'ice' },
    { name: 'Attack with a Thunder weapon', user: 'tidus', weapon: 'lightning' },
    { name: 'Attack with a Water weapon', user: 'tidus', weapon: 'water' },
    { name: 'Fire (Lulu)', user: 'lulu', id: 'fire' },
    { name: 'Blizzard', user: 'lulu', id: 'blizzard' },
    { name: 'Thunder', user: 'lulu', id: 'thunder' },
    { name: 'Water', user: 'lulu', id: 'water' },
    { name: 'Firaga', user: 'lulu', id: 'firaga' },
    { name: 'Blizzaga', user: 'lulu', id: 'blizzaga' },
    { name: 'Thundaga', user: 'lulu', id: 'thundaga' },
    { name: 'Waterga', user: 'lulu', id: 'waterga' },
    { name: 'Holy', user: 'lulu', id: 'holy' },
    { name: 'Flare (no element)', user: 'lulu', id: 'flare' },
    { name: 'Scan', user: 'yuna', id: 'scan' },
    { name: 'Fire Shot (Wakka)', user: 'wakka', id: 'fire-shot' },
    { name: 'Water Shot (Wakka)', user: 'wakka', id: 'water-shot' },
    { name: 'Element Reels (Wakka)', user: 'wakka', id: 'element-reels' },
    { name: 'Power Shot (Wakka)', user: 'wakka', id: 'power-shot' },
  ];

  const definition = (engine: ReturnType<typeof sphereEngine>, c: (typeof CASES)[number]) => {
    if (c.id === undefined) {
      actor(engine, 'tidus').equipment!.weapon.autoAbilities = c.weapon === undefined ? ['strength-5'] : [`${c.weapon}strike` as never];
      return abilityOf(engine, 'attack');
    }
    return abilityOf(engine, c.id);
  };

  it("the cases are the interpreter's 20 commands in its order", () => {
    expect(CASES.map((c) => c.name)).toEqual([...SPHERE_COMMANDS]);
    expect(SPHERE_MATRIX.map(([name]) => name)).toEqual([...SPHERE_COMMANDS]);
  });

  for (const c of CASES) {
    it(`${c.name}: the same reply in all four states as the bytecode gave, for the sign of the damage the kernel produced`, () => {
      const wanted = SPHERE_MATRIX.find(([n]) => n === c.name)![1];
      for (let state = 0; state < 4; state++) {
        const engine = sphereEngine(11);
        setState(engine, state);
        const def = definition(engine, c);
        const got = replyTo(engine, c.user, def);
        // The interpreter's input is the sign of LastDamageTakenHP: +100 damage, -100 healed; a command with no HP event (Scan) reads as 0, and Element Reels is a minigame shell here (no hit record), so only its reading is tested below.
        const cell = wanted[state]!;
        const expected = got.sign === '-' ? cell[1] : got.sign === '+' ? cell[0] : cell[2];
        if (c.name === 'Element Reels (Wakka)') continue;
        expect(got.reply, `${c.name} / state ${state} (the hit ${got.sign})`).toBe(expected);
        if (expected === 'ultima:front' || expected === 'press:front') expect([...(got.targets ?? [])].sort(), c.name).toEqual(['auron', 'tidus', 'yuna']);
        if (expected === 'flare:one') expect(got.targets, c.name).toHaveLength(1);
        if (expected === 'shift') {
          expect(got.shifts, c.name).toBe(1);
          expect(sphere(engine).affinities[GS_STATES[got.state]!.weak]).toBe('weak');
        } else {
          expect(got.state, `${c.name} / state ${state}: unchanged unless the weakness was hit`).toBe(state);
          expect(got.shifts).toBe(0);
        }
      }
    });
  }

  it('the signs the kernel gives are the ones the table needs: a weakness hit and a plain blow take HP, an absorbed element gives it', () => {
    const engine = sphereEngine(11);
    setState(engine, 0);
    expect(replyTo(engine, 'lulu', abilityOf(engine, 'fire')).sign).toBe('+');
    expect(replyTo(engine, 'lulu', abilityOf(engine, 'blizzard')).sign).toBe('-');
    expect(replyTo(engine, 'lulu', abilityOf(engine, 'flare')).sign).toBe('+');
    expect(replyTo(engine, 'yuna', abilityOf(engine, 'scan')).sign).toBe('0');
    engine.state().combatants[SPHERE]!.hp = sphere(engine).stats.maxHp;
  });

  it('a physical hit never shifts it: even with the weakness on the weapon it answers Hydraulic Press, not a new element (the 20 x 4 table has no shift in the Attack rows)', () => {
    for (const [name, per] of SPHERE_MATRIX) if (name.startsWith('Attack')) for (const state of per) for (const cell of state) expect(cell, name).not.toBe('shift');
  });

  it('with an aeon in the front line an absorbed magic hit is answered by the player-side -aga on the front line, which is the aeon alone; other cells are unchanged', () => {
    for (const [state, name, expected] of SPHERE_WITH_AEON) {
      const engine = sphereEngine(11);
      const valefor = actor(engine, 'valefor'); // summoned by hand: on the field, alive, alone in the front line
      valefor.alive = true;
      valefor.removed = false;
      valefor.hp = valefor.stats.maxHp;
      delete (valefor.statuses as Record<string, unknown>)['ko'];
      ctxOf(engine).state.aeonId = 'valefor';
      setState(engine, state);
      const c = CASES.find((x) => x.name === name)!;
      const got = replyTo(engine, c.user, definition(engine, c));
      const want = expected.endsWith(':front') && expected !== 'ultima:front' ? `${GS_STATES[state]!.physical}:front` : expected;
      expect(got.reply, `${name} / state ${state}`).toBe(want);
      if (want.endsWith(':front')) expect(got.targets, name).toEqual(['valefor']);
    }
  });

  it('Element Reels (a Wakka special with no element of its own) is read as an elemental-free special even in the hands of an elemental weapon, so it draws Hydraulic Press and never a shift (the interpreter\'s row)', () => {
    const engine = sphereEngine(11);
    const wakka = actor(engine, 'wakka');
    wakka.equipment!.weapon.autoAbilities = ['firestrike'];
    const def = abilityOf(engine, 'element-reels');
    const facts = readHit(def, wakka);
    expect(facts.damageType).toBe(0);
    expect(hitBitsAtHit(def, wakka, facts)).toBe(0); // the script recomputes Wakka's commands without the weapon's element
    for (const state of SPHERE_MATRIX.find(([n]) => n === 'Element Reels (Wakka)')![1]) expect([state[0], state[1]]).toEqual(['press:front', 'flare:one']);
  });

  it('a command that does not affect HP (Bio, Dispel, Haste) draws no answer', () => {
    for (const [user, id] of [['lulu', 'bio'], ['yuna', 'dispel'], ['tidus', 'haste']] as const) {
      const engine = sphereEngine(11);
      setState(engine, 0);
      const got = replyTo(engine, user, abilityOf(engine, id));
      expect(got.reply, id).toBe('none');
      expect(got.state).toBe(0);
    }
  });
});

describe('the shift: a uniform draw over all four, the old state included', () => {
  it('is `GetRandomValue() mod 4` from every state (the interpreter\'s tally: 16,384 each of 65,536)', () => {
    for (let from = 0; from < 4; from++) {
      const tally = [0, 0, 0, 0];
      for (let raw = 0; raw <= 0xffff; raw++) tally[raw % GS_STATES.length]!++;
      expect(tally, `from state ${from}`).toEqual([16_384, 16_384, 16_384, 16_384]);
    }
  });

  it('on the engine 600 weakness hits move the state to each of the four about a quarter of the time, the old state among them; the new state is written at once, before the shift action runs', () => {
    const into = [0, 0, 0, 0];
    let same = 0;
    const engine = sphereEngine(2);
    for (let i = 0; i < 600; i++) {
      const before = stateOf(engine);
      const weakId = ['fire', 'blizzard', 'thunder', 'water'][before]!;
      const got = replyTo(engine, 'lulu', abilityOf(engine, weakId));
      expect(got.reply).toBe('shift');
      expect(sphere(engine).affinities[GS_STATES[got.state]!.weak]).toBe('weak');
      into[got.state]!++;
      if (got.state === before) same++;
      sphere(engine).hp = sphere(engine).stats.maxHp;
    }
    for (const k of into) {
      expect(k / 600).toBeGreaterThan(0.19);
      expect(k / 600).toBeLessThan(0.31);
    }
    expect(same).toBeGreaterThan(0);
    expect(shiftsOf(engine)).toBe(600);
  });

  it('the Elemental Shift it asks for is aimed at itself', () => {
    const engine = sphereEngine(3);
    setState(engine, 0);
    const ctx = ctxOf(engine);
    drain(engine);
    resolveAbility(ctx, actor(engine, 'lulu'), abilityOf(engine, 'fire'), [SPHERE]);
    const queued = peekReactions(ctx).filter((r) => r.kind === 'command');
    expect(queued).toHaveLength(1);
    expect((queued[0] as { command: { id: string; targets: string[] } }).command).toMatchObject({ id: ROW.elementalShift, targets: [SPHERE] });
  });
});

describe('the gates (the first lines of the bytecode\'s onHit)', () => {
  it('HP 0: nothing; Threaten on it: nothing; a counter not allowed (a reaction is resolving): nothing; asleep: the whole handler stands down and the state does not move', () => {
    const setups: Array<(e: ReturnType<typeof sphereEngine>) => void> = [
      (e) => { sphere(e).hp = 1; },
      (e) => { (sphere(e).statuses as Record<string, unknown>)['threaten'] = { id: 'threaten' }; },
      (e) => { ctxOf(e).rt.inReaction = true; },
      (e) => { (sphere(e).statuses as Record<string, unknown>)['sleep'] = { id: 'sleep' }; },
    ];
    for (const [i, setup] of setups.entries()) {
      const engine = sphereEngine(4);
      setState(engine, 0);
      setup(engine);
      const got = replyTo(engine, 'lulu', abilityOf(engine, 'fire')); // would shift
      expect(got.reply, `gate ${i}`).toBe('none');
      expect(got.shifts, `gate ${i}`).toBe(0);
      expect(got.state, `gate ${i}`).toBe(0);
    }
  });

  it('Doublecast: the first spell of a pair is ignored (the gate is armed), the second answers, the next pair starts again (the interpreter: nothing, Ultima, nothing)', () => {
    const engine = sphereEngine(6);
    setState(engine, 0);
    const ctx = ctxOf(engine);
    const blizzard = abilityOf(engine, 'blizzard'); // absorbed in state 0
    ctx.rt.doublecasting = true;
    const out: string[] = [];
    for (let i = 0; i < 3; i++) out.push(replyTo(engine, 'lulu', blizzard).reply);
    expect(out).toEqual(['none', 'ultima:front', 'none']);
    ctx.rt.doublecasting = false;
    expect(replyTo(engine, 'lulu', blizzard).reply).toBe('ultima:front');
    expect(ctx.state.flags[SPHERE_DOUBLECAST_FLAG]).toBe(false);
  });

  it('a second reaction of the same owner in one action is dropped by the engine: one answer per action', () => {
    const engine = sphereEngine(7);
    setState(engine, 0);
    const ctx = ctxOf(engine);
    drain(engine);
    resolveAbility(ctx, actor(engine, 'lulu'), abilityOf(engine, 'blizzard'), [SPHERE]);
    resolveAbility(ctx, actor(engine, 'lulu'), abilityOf(engine, 'blizzard'), [SPHERE]);
    expect(peekReactions(ctx).filter((r) => r.kind === 'command')).toHaveLength(1);
  });

  it('a preview of its next move (the advisor\'s dry run on a copy) does not move the real battle: the state and the stream stay', () => {
    const engine = sphereEngine(8);
    const ctx = ctxOf(engine);
    const before = stateOf(engine);
    const c = chooseAiCommand(ctx, sphere(engine) as FFXCombatant);
    expect(c === null || c.kind === 'ability' || c.kind === 'attack').toBe(true);
    expect(stateOf(engine)).toBe(before);
  });
});

describe('the real engine: what a party that hits it plainly pays, and three seeds', () => {
  it('a plain Attack by Tidus (no element) is answered by Ultima on the whole front line: a `counter` event by the Sphere and a damage event on each of the three members', () => {
    const engine = sphereEngine(21);
    const d = nextInput(engine);
    const target = d.commands.find((c) => c.enabled && c.command.kind === 'attack')!;
    const mine = engine.state().log.length;
    engine.submit({ ...target.command, targets: [SPHERE] } as never);
    nextInput(engine);
    const events = engine.state().log.slice(mine);
    const counter = events.find((e) => e.type === 'counter' && e.actorId === SPHERE && e.abilityId === ROW.ultima);
    expect(counter, 'Ultima follows the first plain blow').toBeDefined();
    const hit = new Set(events.flatMap((e) => (e.type === 'damage' && e.sourceId === SPHERE && e.amount > 0 ? [e.targetId] : [])));
    expect([...hit].sort()).toEqual(['auron', 'tidus', 'yuna']);
    expect(actions(events, SPHERE).filter((a) => a === ROW.ultima).length).toBeGreaterThan(0);
  });

  it('seeds 1, 2 and 3 with the careless line end in a victory or a defeat; replaying a seed gives the same log', () => {
    const digests: string[] = [];
    for (const seed of [1, 2, 3]) {
      const a = playOne(seed, 'greater-sphere', careless);
      const b = playOne(seed, 'greater-sphere', careless);
      expect(['victory', 'defeat'], `seed ${seed}`).toContain(a.outcome);
      expect(a.digest, `seed ${seed} replays`).toBe(b.digest);
      digests.push(a.digest);
    }
    expect(new Set(digests).size).toBeGreaterThan(1);
  });

  it('the formation puts the Greater Sphere alone on the field with its script and its state drawn', () => {
    const engine = sphereEngine(9);
    expect(engine.state().enemyIds).toEqual([SPHERE]);
    expect(row(nextInput(engine), 'attack', undefined, SPHERE)).not.toBeNull();
  });
});
