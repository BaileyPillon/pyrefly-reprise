/**
 * Spherimorph's script (FFX only; `src/battle/ffx/ai/spherimorph.ts`): the rules pinned to the interpreter's exact tallies in the note (`research/re-ffx-spherimorph.md` 4.1 to 4.3) and run on the real engine. The four
 * starting states and the state table, the Press line and its chance, the reply matrix cell by cell (17 commands in each of the four states, run through the real damage path so the heal-or-damage sign is the kernel's),
 * the shift distribution, and the gates (HP 0, Threaten, a counter not allowed, the Doublecast pair, Scan, the self-exclusion).
 */

import { describe, expect, it } from 'vitest';

import type { AbilityDef, FFXCombatant } from '../../../src/battle/common/types.ts';
import { resolveAbility } from '../../../src/battle/ffx/abilities.ts';
import { peekReactions, takeReaction } from '../../../src/battle/ffx/ai/hooks.ts';
import {
  PRESS_CHANCE_BELOW,
  SM_ELEMENTS,
  SM_ROWS,
  SM_STATES,
  WAKKA_RECORD_IDS,
  applyState,
  ensureState,
  hitBitsAtHit,
  isAbsorbed,
  pressLine,
  readHit,
} from '../../../src/battle/ffx/ai/spherimorph-rules.ts';
import { spherimorph } from '../../../src/data/ffx/enemies/spherimorph.ts';
import { SM, actor, ctxOf, flags, give, newEngine, setState, sm, stateOf } from '../helpers/spherimorphDrive.ts';

type Engine = ReturnType<typeof newEngine>;

/** What the script queued after one action on it: the row, who it is aimed at, and the state afterwards. */
interface Reply {
  readonly kind: 'none' | 'attacker' | 'front' | 'shift';
  readonly row?: string;
  readonly targets?: readonly string[];
  readonly state: number;
  readonly shifts: number;
}

function drain(engine: Engine): void {
  const ctx = ctxOf(engine);
  while (takeReaction(ctx) !== undefined);
}

/** Run one command on Spherimorph through the real damage path and read what the script asked for. */
function replyTo(engine: Engine, userId: string, def: AbilityDef): Reply {
  const ctx = ctxOf(engine);
  drain(engine);
  resolveAbility(ctx, actor(engine, userId), def, [SM]);
  const queued = peekReactions(ctx);
  const state = stateOf(engine);
  const shifts = (flags(engine)['sm.shifts'] as number) ?? 0;
  drain(engine);
  const first = queued.find((r) => r.kind === 'command'); // a hint banner (an 'emit') may be queued before the answer
  if (first === undefined || first.kind !== 'command') return { kind: 'none', state, shifts };
  const command = first.command as { id?: string; targets: string[] };
  const row = command.id;
  if (row === SM_ROWS.shift) return { kind: 'shift', row, state, shifts };
  const monsterSide = row !== undefined && row.startsWith('spherimorph-');
  return { kind: monsterSide ? 'front' : 'attacker', ...(row !== undefined ? { row } : {}), targets: command.targets, state, shifts };
}

const ability = (engine: Engine, id: string): AbilityDef => {
  const def = ctxOf(engine).content.ability(id);
  if (!def) throw new Error(`no ability ${id}`);
  return def;
};

/** State s: [the weakness element, the answer element]. */
const OPPOSITE: Readonly<Record<string, string>> = { fire: 'ice', ice: 'fire', lightning: 'water', water: 'lightning' };
/** The player's own spell that carries each element. */
const PLAYER_ROW: Readonly<Record<string, string>> = { fire: 'fire', ice: 'blizzard', lightning: 'thunder', water: 'water' };

describe('the four states (RE 4.1)', () => {
  it('the table: weak Fire, Ice, Thunder, Water; the answer is the opposite element, player-side on a plain hit, monster-side on magic', () => {
    expect(SM_STATES.map((s) => s.weak)).toEqual(['fire', 'ice', 'lightning', 'water']);
    expect(SM_STATES.map((s) => s.physical)).toEqual(['blizzard', 'fire', 'water', 'thunder']);
    expect(SM_STATES.map((s) => s.magic)).toEqual(['spherimorph-blizzard', 'spherimorph-fire', 'spherimorph-water', 'spherimorph-thunder']);
    for (const s of SM_STATES) expect(PLAYER_ROW[OPPOSITE[s.weak]!]).toBe(s.physical);
  });

  it('each state weakens one element and absorbs the other three and Holy (the record writes none of its own)', () => {
    const engine = newEngine(1);
    for (let s = 0; s < 4; s++) {
      applyState(sm(engine), s);
      const a = sm(engine).affinities;
      for (const e of SM_ELEMENTS) expect(a[e], `state ${s} ${e}`).toBe(e === SM_STATES[s]!.weak ? 'weak' : 'absorb');
      expect(a.holy).toBe('absorb');
    }
    expect(spherimorph().affinities).toEqual({}); // the data holds no affinity
  });

  it('the starting draw is `GetRandomValue() mod 4`: exactly 16,384 of 65,536 each', () => {
    const tally = [0, 0, 0, 0];
    for (let raw = 0; raw <= 0xffff; raw++) tally[raw % SM_STATES.length]!++;
    expect(tally).toEqual([16_384, 16_384, 16_384, 16_384]);
  });

  it('on the engine every seed starts in a state, with the affinities written, and the four states all occur over 200 seeds', () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const engine = newEngine(seed);
      const state = stateOf(engine);
      expect([0, 1, 2, 3]).toContain(state);
      seen.add(state);
      expect(sm(engine).affinities[SM_STATES[state]!.weak]).toBe('weak');
    }
    expect(seen.size).toBe(4);
  });

  it('is drawn once per battle: asking again returns the same state and leaves it alone', () => {
    const engine = newEngine(5);
    const first = stateOf(engine);
    ensureState(ctxOf(engine), sm(engine));
    expect(stateOf(engine)).toBe(first);
    expect(flags(engine)['sm.shifts']).toBe(0);
  });
});

describe('its turn (RE 4.2): Press below half, else an Attack', () => {
  it('the line is half the maximum HP, strictly below; the draw is modulo 100 below 50: 32,786 of 65,536 (50.027 percent)', () => {
    expect(pressLine(12_000)).toBe(6_000);
    expect(PRESS_CHANCE_BELOW).toBe(50);
    let n = 0;
    for (let raw = 0; raw <= 0xffff; raw++) if (raw % 100 < PRESS_CHANCE_BELOW) n++;
    expect(n).toBe(32_786);
    expect(Math.round((n / 65_536) * 100_000) / 1_000).toBe(50.027);
  });

  it('above half it only Attacks one living member; at exactly 6,000 it still does; below, about half its turns are Press on all three', () => {
    const counts = (hp: number): { attack: number; press: number; pressTargets: number } => {
      let attack = 0;
      let press = 0;
      let pressTargets = 0;
      for (let seed = 1; seed <= 60; seed++) {
        const engine = newEngine(seed);
        sm(engine).hp = hp;
        const ctx = ctxOf(engine);
        for (let i = 0; i < 6; i++) {
          const d = engine.nextDecision();
          if (d.kind === 'battle-over') break;
          if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
          sm(engine).hp = hp; // hold the line while the party defends
          for (const c of ctx.state.activeIds) (ctx.state.combatants[c] as FFXCombatant).hp = (ctx.state.combatants[c] as FFXCombatant).stats.maxHp;
        }
        for (const e of engine.state().log) {
          if (e.type !== 'action-start' || e.actorId !== SM) continue;
          if (e.abilityId === SM_ROWS.press) {
            press++;
            pressTargets += e.targets.length;
          } else if (e.command.kind === 'attack') attack++;
        }
      }
      return { attack, press, pressTargets };
    };
    expect(counts(12_000).press).toBe(0);
    expect(counts(6_000).press).toBe(0);
    const low = counts(5_999);
    expect(low.press).toBeGreaterThan(0);
    expect(low.attack).toBeGreaterThan(0);
    expect(low.press / (low.press + low.attack)).toBeGreaterThan(0.38);
    expect(low.press / (low.press + low.attack)).toBeLessThan(0.62);
    expect(low.pressTargets).toBe(low.press * 3);
  });

  it('never casts a spell on its own turn', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const engine = newEngine(seed);
      for (let i = 0; i < 40; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'player-input') {
          for (const id of engine.state().activeIds) (actor(engine, id)).hp = actor(engine, id).stats.maxHp;
          engine.submit({ kind: 'defend', targets: [] });
        }
      }
      const own = engine.state().log.filter((e) => e.type === 'action-start' && e.actorId === SM).map((e) => (e.type === 'action-start' ? (e.abilityId ?? e.command.kind) : ''));
      for (const a of own) expect(['attack', SM_ROWS.press, SM_ROWS.shift]).toContain(a);
    }
  });
});

describe('the reply matrix: 17 commands in each of the four states (RE 4.3, the interpreter\'s table), through the real damage path', () => {
  /** A plain Attack by Tidus with a weapon of `element` (or none). */
  function attackWith(engine: Engine, element?: string): { user: string; def: AbilityDef } {
    const tidus = actor(engine, 'tidus');
    tidus.equipment!.weapon.autoAbilities = element === undefined ? ['strength-5'] : [`${element}strike` as never];
    return { user: 'tidus', def: ability(engine, 'attack') };
  }

  const CASES: ReadonlyArray<{ name: string; user: string; id?: string; weapon?: string | null; element?: string | null }> = [
    { name: 'Attack, no element', user: 'tidus', weapon: null },
    { name: 'Attack with a Fire weapon', user: 'tidus', weapon: 'fire', element: 'fire' },
    { name: 'Attack with an Ice weapon', user: 'tidus', weapon: 'ice', element: 'ice' },
    { name: 'Attack with a Thunder weapon', user: 'tidus', weapon: 'lightning', element: 'lightning' },
    { name: 'Attack with a Water weapon', user: 'tidus', weapon: 'water', element: 'water' },
    { name: 'Fire (Lulu)', user: 'lulu', id: 'fire', element: 'fire' },
    { name: 'Blizzard', user: 'lulu', id: 'blizzard', element: 'ice' },
    { name: 'Thunder', user: 'lulu', id: 'thunder', element: 'lightning' },
    { name: 'Water', user: 'lulu', id: 'water', element: 'water' },
    { name: 'Firaga', user: 'lulu', id: 'firaga', element: 'fire' },
    { name: 'Holy', user: 'lulu', id: 'holy', element: null },
    { name: 'Flare (no element)', user: 'lulu', id: 'flare', element: null },
    { name: 'Scan', user: 'yuna', id: 'scan', element: null },
    { name: 'Fire Shot (Wakka)', user: 'wakka', id: 'fire-shot', element: 'fire' },
    { name: 'Water Shot (Wakka)', user: 'wakka', id: 'water-shot', element: 'water' },
    { name: 'Element Reels (Wakka)', user: 'wakka', id: 'element-reels', element: null },
    { name: 'Power Shot (Wakka)', user: 'wakka', id: 'power-shot', element: null },
  ];

  /** The note's table, by rule: what the script asks for, from the state's weakness `W` and answer rows. */
  function expected(c: (typeof CASES)[number], state: number): { kind: Reply['kind']; row?: string } {
    const s = SM_STATES[state]!;
    const physical = c.name.startsWith('Attack');
    if (c.name === 'Scan') return { kind: 'front', row: s.magic };
    if (c.name === 'Flare (no element)' || c.name === 'Holy') return { kind: 'front', row: s.magic };
    if (c.name === 'Element Reels (Wakka)' || c.name === 'Power Shot (Wakka)') return { kind: 'attacker', row: s.physical }; // special, damaged, no element
    const matches = c.element === s.weak;
    if (matches) return { kind: 'shift' };
    if (physical) return { kind: 'attacker', row: s.physical }; // none, or an absorbed weapon element (healed): the player-side row on the attacker
    return { kind: 'front', row: s.magic };
  }

  for (const c of CASES) {
    it(`${c.name}: the same answer in all four states as the interpreter gave`, () => {
      for (let state = 0; state < 4; state++) {
        const engine = newEngine(11);
        setState(engine, state);
        let user = c.user;
        let def: AbilityDef;
        if (c.name.startsWith('Attack')) {
          const a = attackWith(engine, c.weapon === null ? undefined : (c.weapon ?? undefined));
          user = a.user;
          def = a.def;
        } else def = ability(engine, c.id!);
        // Element Reels is a minigame shell in this engine (no hit record of its own); its reading is tested below.
        if (c.name === 'Element Reels (Wakka)') continue;
        const got = replyTo(engine, user, def);
        const want = expected(c, state);
        expect(got.kind, `${c.name} / state ${state}`).toBe(want.kind);
        if (want.row !== undefined) expect(got.row, `${c.name} / state ${state}`).toBe(want.row);
        if (want.kind === 'attacker') expect(got.targets, `${c.name} / state ${state}`).toEqual([user]);
        if (want.kind === 'front') expect([...(got.targets ?? [])].sort(), `${c.name} / state ${state}`).toEqual(['lulu', 'tidus', 'yuna']);
        if (want.kind === 'shift') {
          expect(got.shifts, `${c.name} / state ${state}`).toBe(1);
          expect(sm(engine).affinities[SM_STATES[got.state]!.weak]).toBe('weak');
        } else {
          expect(got.state, `${c.name} / state ${state}: the state is unchanged unless the weakness was hit`).toBe(state);
          expect(got.shifts).toBe(0);
        }
      }
    });
  }

  it('Element Reels (a Wakka special with no element of its own) reads as an elemental-free special, even in the hands of an elemental weapon', () => {
    const engine = newEngine(11);
    const wakka = actor(engine, 'wakka');
    wakka.equipment!.weapon.autoAbilities = ['firestrike'];
    const def = ability(engine, 'element-reels');
    const facts = readHit(def, wakka);
    expect(facts.damageType).toBe(0);
    expect(hitBitsAtHit(def, wakka, facts)).toBe(0); // the script recomputes Wakka's commands without the weapon's element
    expect(WAKKA_RECORD_IDS.size).toBe(13);
  });

  it('a multi-element command that contains the weakness is not absorbed unless it also carries Holy (RE 4.3)', () => {
    const fire = { damageType: 2, affectsHp: true, fire: true, ice: false, thunder: false, water: false, holy: false, bits: 1 };
    expect(isAbsorbed(SM_STATES[0]!, { ...fire, ice: true, bits: 2 })).toBe(false);
    expect(isAbsorbed(SM_STATES[0]!, { ...fire, holy: true, bits: 2 })).toBe(true);
    expect(isAbsorbed(SM_STATES[1]!, { ...fire, ice: true, bits: 2 })).toBe(false);
    expect(isAbsorbed(SM_STATES[1]!, fire)).toBe(true);
    expect(isAbsorbed(SM_STATES[0]!, { ...fire, affectsHp: false })).toBe(false); // no HP class: never absorbed
    expect(isAbsorbed(SM_STATES[0]!, { ...fire, fire: false, bits: 0 })).toBe(false); // no element: never absorbed
  });

  it('a command that does not affect HP (Bio, Slow, Dispel, Haste) draws no answer', () => {
    for (const [user, id] of [['lulu', 'bio'], ['yuna', 'dispel'], ['tidus', 'haste']] as const) {
      const engine = newEngine(11);
      setState(engine, 0);
      const def = ability(engine, id);
      const got = replyTo(engine, user, def);
      expect(got.kind, id).toBe('none');
      expect(got.state).toBe(0);
    }
  });
});

describe('the shift (RE 4.3 item 8): a uniform draw over all four, the old state included', () => {
  it('is `GetRandomValue() mod 4` from every state: 16,384 each of 65,536', () => {
    for (let from = 0; from < 4; from++) {
      const tally = [0, 0, 0, 0];
      for (let raw = 0; raw <= 0xffff; raw++) tally[raw % 4]!++;
      expect(tally, `from state ${from}`).toEqual([16_384, 16_384, 16_384, 16_384]);
    }
  });

  it('on the engine: 600 weakness hits move the state to each of the four about a quarter of the time, and the old state is among them', () => {
    const into = [0, 0, 0, 0];
    let same = 0;
    let n = 0;
    const engine = newEngine(2);
    const lulu = actor(engine, 'lulu');
    for (let i = 0; i < 600; i++) {
      const before = stateOf(engine);
      const weakId = ['fire', 'blizzard', 'thunder', 'water'][before]!;
      const got = replyTo(engine, lulu.id, ability(engine, weakId));
      expect(got.kind).toBe('shift');
      into[got.state]!++;
      if (got.state === before) same++;
      n++;
      sm(engine).hp = sm(engine).stats.maxHp; // keep it alive
    }
    for (const k of into) {
      expect(k / n).toBeGreaterThan(0.19);
      expect(k / n).toBeLessThan(0.31);
    }
    expect(same).toBeGreaterThan(0); // a quarter of the time the same one
    expect(same / n).toBeLessThan(0.34);
  });

  it('the new state is written at once (flags, affinities and the rows), before the Elemental Shift action runs', () => {
    const engine = newEngine(3);
    setState(engine, 0);
    const ctx = ctxOf(engine);
    resolveAbility(ctx, actor(engine, 'lulu'), ability(engine, 'fire'), [SM]);
    const queued = peekReactions(ctx);
    expect(queued).toHaveLength(1);
    expect((queued[0] as { command: { id: string; targets: string[] } }).command).toMatchObject({ id: SM_ROWS.shift, targets: [SM] });
    expect(sm(engine).affinities[SM_STATES[stateOf(engine)]!.weak]).toBe('weak'); // already rewritten, the queue still holds the action
  });
});

describe('the gates (RE 4.3 items 1 to 3)', () => {
  it('HP 0: nothing; Threaten on it: nothing; a counter not allowed (a reaction is resolving): nothing', () => {
    for (const setup of [
      (e: Engine) => { sm(e).hp = 1; },
      (e: Engine) => { give(sm(e), 'threaten'); },
      (e: Engine) => { ctxOf(e).rt.inReaction = true; },
    ]) {
      const engine = newEngine(4);
      setState(engine, 0);
      setup(engine);
      const got = replyTo(engine, 'lulu', ability(engine, 'fire')); // would shift
      expect(got.kind).toBe('none');
      expect(got.shifts).toBe(0);
      expect(got.state).toBe(0);
    }
  });

  it('when it cannot act (asleep, forced onto it) the whole handler stands down: the state does not move either (isCounterattackAllowed is the first test, RE 4.3 item 1)', () => {
    const engine = newEngine(4);
    setState(engine, 0);
    give(sm(engine), 'sleep');
    const ctx = ctxOf(engine);
    resolveAbility(ctx, actor(engine, 'lulu'), ability(engine, 'fire'), [SM]);
    expect(flags(engine)['sm.shifts']).toBe(0);
    expect(stateOf(engine)).toBe(0);
    expect(peekReactions(ctx).filter((r) => r.kind === 'command')).toHaveLength(0);
  });

  it('Doublecast: the first spell of a pair is ignored (the gate is armed), the second is handled normally', () => {
    const engine = newEngine(6);
    setState(engine, 0);
    const ctx = ctxOf(engine);
    const fire = ability(engine, 'fire');
    ctx.rt.doublecasting = true;
    const first = replyTo(engine, 'lulu', fire);
    expect(first.kind).toBe('none');
    expect(first.shifts).toBe(0);
    expect(flags(engine)['sm.doublecast']).toBe(true);
    const second = replyTo(engine, 'lulu', fire);
    expect(second.kind).toBe('shift');
    expect(flags(engine)['sm.doublecast']).toBe(false);
    ctx.rt.doublecasting = false;
    // a plain cast after it is handled as ever
    setState(engine, 0);
    expect(replyTo(engine, 'lulu', fire).kind).toBe('shift');
  });

  it('Scan answers with the monster-side spell on the whole front line (RE 4.3 item 3)', () => {
    const engine = newEngine(7);
    setState(engine, 2);
    const got = replyTo(engine, 'yuna', ability(engine, 'scan'));
    expect(got.row).toBe('spherimorph-water');
    expect([...(got.targets ?? [])].sort()).toEqual(['lulu', 'tidus', 'yuna']);
  });

  it('its own spell bounced back at it is not an event of the script (no shift, no answer)', () => {
    const engine = newEngine(8);
    setState(engine, 0);
    const ctx = ctxOf(engine);
    drain(engine);
    resolveAbility(ctx, sm(engine), ability(engine, SM_ROWS.fire), [SM]);
    expect(peekReactions(ctx)).toHaveLength(0);
    expect(stateOf(engine)).toBe(0);
  });
});
