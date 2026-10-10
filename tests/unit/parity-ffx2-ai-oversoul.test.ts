/**
 * Re-parity AI-FFX2-b, Chapter XIII link 1, the Oversoul Paragon (**FFX-2 only**): the game's own script `o152`
 * (`research/re-ffx2-ai-fallen-trema.md` section 6; rows O1 to O14). One decision table, run against the shipped script, the
 * shipped records and the real resolver [hard rule 3]; the exact outcome tables enumerate every class of `random() mod n`
 * (`helpers/ffx2ScriptTally.ts`), the way the note got its tallies from the compiled script.
 *
 * Interpreter facts reproduced: the HP rows are 32-bit float tests (with 210,000 HP "below 10 percent" is 20,999 or less, "below
 * 40 percent" 83,999 or less); HP row A is 1/8 each of Firaga, Thundaga, Blizzaga and Waterga and 1/2 Attack; HP row B casts Final
 * Impact once, then 1/5 each of Ultima, Holy, Judgment, Genesis, Big Bang (13,108 of 65,536 for the first); the MP-0 branch and the
 * idle branch (1/3 each of Judgment, Genesis, Big Bang) are the note's tables.
 *
 * Kept as Bailey decided (D-151, "it waits to be hit"), listed for him: rows 1 to 3 act only once it has a reason (a result has
 * landed, or the idle limit has passed; `OVERSOUL_ESTIMATES.lowHpActsEveryTurn`, false); after the first result the state the script
 * sets is never cleared by those rows, so under 40 percent he acts on every poll, as the script does. `lowHpActsEveryTurn = true`
 * is the game's own rule (it also acts untouched) and is tested too.
 *
 * Mutation-checked by hand (scratch, one line at a time, each caught here): the float test as a double; "below" as "at or below";
 * the answer made at once instead of next poll; the copy aimed at the girl's group; the Demi loop clearing its state; the Normal
 * Attack aimed at the attacker; Final Impact repeating; Final Impact not before the Ultima pool; the heal list without Life; a
 * drain not setting the "normal" state.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, AbilityCommand, Command } from '../../src/battle/common/types.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { aiScriptFor } from '../../src/battle/ffx2/ai/index.ts';
import { K, OS_COPY, OS_DEMI, OS_NORMAL, OVERSOUL_ESTIMATES, OVERSOUL_IDLE_POLLS, hpBelow, paragonOversoulScript as script } from '../../src/battle/ffx2/ai/paragon-oversoul.ts';
import { COPY_IDS, HEAL_BUFF_IDS, oversoulCommandClass } from '../../src/battle/ffx2/ai/oversoul-lists.ts';
import { TICK_RATE_BASE } from '../../src/battle/ffx2/constants.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { resolveAbility, type ResolveContext } from '../../src/battle/ffx2/resolve.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { paragonOversoul } from '../../src/data/ffx2/enemies/paragon-oversoul.ts';
import { boardOf, exactTally, girls, REGISTRY, scriptedRng, share, total } from './helpers/ffx2ScriptTally.ts';

const ab = (id: string): AbilityDef => data.ABILITIES[id] as AbilityDef;
const cmd = (c: Command | null): AbilityCommand => {
  expect(c, 'a command').not.toBeNull();
  return c as AbilityCommand;
};
const P = (count: number): number => count / 65536;
const IDLE = OVERSOUL_ESTIMATES.idleSeconds * TICK_RATE_BASE;
const MAX = 210000;

function os(memory: Record<string, number | string | boolean> = {}, hp = MAX): Ffx2Unit {
  const u = aiUnit('paragon', 'enemy', MAX, 0);
  u.enemy = { aiScriptId: 'paragon-oversoul', formIndex: 0, forms: [], rewards: paragonOversoul.rewards };
  u.hp = hp;
  u.mp = 9999;
  u.aiMemory = { [K.oversouled]: true, [K.quiet]: 0, ...memory };
  return u;
}

/** One poll of a fresh Oversoul over the three girls, `ticks` into the fight. */
function poll(memory: Record<string, number | string | boolean>, hp: number, ticks: number, rng: ReturnType<typeof scriptedRng>, tweak?: (u: Ffx2Unit, girls: Ffx2Unit[]) => void) {
  const u = os(memory, hp);
  const g = girls();
  tweak?.(u, g);
  const b = boardOf(u, [u, ...g], rng, ticks);
  return { c: script.decide(b.ctx), u, b };
}

describe('the HP rows are 32-bit float tests, strictly (O3)', () => {
  it('with 210,000 HP: below 10 percent is 20,999 or less, below 40 percent 83,999 or less; exactly 21,000 and 84,000 are not below', () => {
    const at = (hp: number) => os({}, hp);
    expect([20999, 21000].map((hp) => hpBelow(at(hp), OVERSOUL_ESTIMATES.finalBelow))).toEqual([true, false]);
    expect([83999, 84000].map((hp) => hpBelow(at(hp), OVERSOUL_ESTIMATES.magicBelow))).toEqual([true, false]);
  });
});

describe('the reaction entry: every result sets the answer state, by who caused it (6.2, O7, O8, O9)', () => {
  const react = (source: Ffx2Unit, id: string) => {
    const u = os();
    const b = boardOf(u, [u, ...girls()], scriptedRng([]), 777);
    script.onResult!(b.ctx, source, ab(id));
    return u.aiMemory!;
  };
  const yuna = girls()[0]!;

  it('a girl\'s heal or buff command -> Demi (3); Life and Full-Life are on the list', () => {
    expect(HEAL_BUFF_IDS.size).toBe(11);
    for (const id of HEAL_BUFF_IDS) expect(react(yuna, id)[K.state], id).toBe(OS_DEMI);
    expect(react(yuna, 'x2-white-mage-life')[K.state]).toBe(OS_DEMI);
    expect(react(yuna, 'x2-white-mage-full-life')[K.state]).toBe(OS_DEMI);
  });

  it('a girl\'s command on the copy list -> copy (1), the girl and the command remembered', () => {
    const m = react(girls()[1]!, 'x2-dark-knight-break');
    expect(m).toMatchObject({ [K.state]: OS_COPY, [K.attacker]: 'rikku', [K.command]: 'x2-dark-knight-break' });
    for (const id of ['x2-shared-osmose', 'x2-shared-sleep', 'x2-shared-blind', 'x2-berserker-berserk']) {
      expect(oversoulCommandClass(id), id).toBe('copy'); // the four the first build missed
    }
    expect(COPY_IDS.size).toBe(31); // the game's 32, Silence having no ability of ours
    expect(oversoulCommandClass('x2-dark-knight-black-sky')).toBe('other'); // "Black Sky is not on it"
  });

  it('any other command of a girl (Attack, an ability, an item, Darkness, Scan) -> normal (2)', () => {
    for (const id of ['x2-dark-knight-attack', 'x2-dark-knight-darkness', 'x2-gun-mage-scan', 'x2-item-megalixir', 'x2-warrior-power-break']) {
      expect(react(yuna, id)[K.state], id).toBe(OS_NORMAL);
    }
  });

  it('anyone else (a monster, Paragon himself) -> normal with no girl; every result also sets the idle clock back', () => {
    const itself = os();
    const m = react(itself, 'x2-black-mage-mp-absorb');
    expect(m).toMatchObject({ [K.state]: OS_NORMAL, [K.attacker]: '', [K.quiet]: 777 });
  });

  it('only the LAST result before the next poll counts', () => {
    const u = os();
    const b = boardOf(u, [u, ...girls()], scriptedRng([]), 5);
    script.onResult!(b.ctx, yuna, ab('x2-dark-knight-break'));
    script.onResult!(b.ctx, yuna, ab('x2-white-mage-cure'));
    expect(u.aiMemory?.[K.state]).toBe(OS_DEMI);
    script.onResult!(b.ctx, yuna, ab('x2-dark-knight-attack'));
    expect(u.aiMemory?.[K.state]).toBe(OS_NORMAL);
  });
});

describe('the answers are made on the NEXT poll, never at once (6.1 rows 5 to 8; O6, O10, O12)', () => {
  const FULL = MAX;

  it('normal (2): back to 0 and an Attack on a UNIFORM girl, not the one who hit him', () => {
    const tally = exactTally((rng) => {
      const { c, u } = poll({ [K.state]: OS_NORMAL, [K.attacker]: 'yuna' }, FULL, 0, rng);
      return `${cmd(c).id}:${cmd(c).targets[0]}|state=${u.aiMemory?.[K.state]}`;
    }, 6);
    for (const who of ['yuna', 'rikku', 'paine']) expect(share(tally, `paragon-os-attack:${who}|state=0`)).toBeCloseTo(1 / 3, 12);
  });

  it('Demi (3): Demi on the whole party every poll, and the state STAYS until another result lands', () => {
    const u = os({ [K.state]: OS_DEMI });
    const b = boardOf(u, [u, ...girls()], scriptedRng([]), 0);
    for (let i = 0; i < 4; i++) expect(script.decide(b.ctx)).toEqual({ kind: 'ability', id: 'paragon-os-demi', targets: [] });
    expect(u.aiMemory?.[K.state]).toBe(OS_DEMI);
  });

  it('copy (1): the remembered command at the remembered girl ALONE (an all-party spell too), state back to 0', () => {
    const { c, u } = poll({ [K.state]: OS_COPY, [K.attacker]: 'rikku', [K.command]: 'x2-dark-knight-demi' }, FULL, 0, scriptedRng([]));
    expect(c).toEqual({ kind: 'ability', id: 'x2-dark-knight-demi', targets: ['rikku'], exactTargets: true });
    expect(u.aiMemory?.[K.state]).toBe(0);
  });

  it('copy with no remembered girl is a Normal Attack (row 7)', () => {
    const { c } = poll({ [K.state]: OS_COPY, [K.attacker]: '', [K.command]: '' }, FULL, 0, scriptedRng([0]));
    expect(cmd(c).id).toBe('paragon-os-attack');
  });

  it('a copied drain hands its transfer back to him as a result of his own: he answers himself with a free Attack on a random girl (6.2)', () => {
    const u = os();
    const g = girls();
    const units: Ffx2Unit[] = [u, ...g];
    const ctxOf = boardOf(u, units, scriptedRng([]), 0).ctx;
    const resolveCtx: ResolveContext = {
      units, abilities: REGISTRY, rng: new SeededRng(3), emit: () => undefined, breaksDamageLimit: () => false,
      onResult: (target, source, ability) => {
        if (target.side === 'enemy') aiScriptFor(target.enemy?.aiScriptId).onResult?.({ ...ctxOf, self: target }, source, ability);
      },
    };
    resolveAbility(resolveCtx, u, ab('x2-black-mage-mp-absorb'), ['yuna'], { exactTargets: true });
    expect(u.aiMemory).toMatchObject({ [K.state]: OS_NORMAL, [K.attacker]: '' });
    expect(cmd(script.decide(ctxOf)).id).toBe('paragon-os-attack');
  });
});

describe('HP row A (below 40 percent): Reflect, MP 0, then mod 8 (6.1)', () => {
  const LOW = 80000;

  it('1/8 each of Firaga, Thundaga, Blizzaga, Waterga (in that order, on the party) and 1/2 Attack on a girl, exactly', () => {
    const tally = exactTally((rng) => cmd(poll({}, LOW, IDLE, rng).c).id, 120);
    for (const spell of ['firaga', 'thundaga', 'blizzaga', 'waterga']) expect(share(tally, `paragon-os-${spell}`)).toBeCloseTo(P(8192), 12);
    expect(share(tally, 'paragon-os-attack')).toBeCloseTo(0.5, 12);
    expect(total(tally)).toBeCloseTo(1, 12);
    expect(cmd(poll({}, LOW, IDLE, scriptedRng([1])).c)).toEqual({ kind: 'ability', id: 'paragon-os-thundaga', targets: [] });
  });

  it('a Reflect on any girl -> Dispel on the party, before any roll', () => {
    const rng = scriptedRng([]);
    rng.int = () => {
      throw new Error('Dispel must not roll');
    };
    const { c } = poll({}, LOW, IDLE, rng, (_u, g) => {
      g[2]!.statuses.reflect = { ticksRemaining: null } as never;
    });
    expect(c).toEqual({ kind: 'ability', id: 'paragon-os-dispel', targets: [] });
  });

  it('MP 0 -> the MP-0 branch (row 3): mod 2, 0 Osmose, 1 Attack, each on a uniform girl', () => {
    const tally = exactTally((rng) => cmd(poll({}, LOW, IDLE, rng, (u) => (u.mp = 0)).c).id, 120);
    expect(share(tally, 'x2-shared-osmose')).toBeCloseTo(0.5, 12);
    expect(share(tally, 'paragon-os-attack')).toBeCloseTo(0.5, 12);
  });
});

describe('HP row B (below 10 percent): Final Impact once, then mod 5 (6.1)', () => {
  const LOW = 10000;

  it('the first time: Final Impact on the party, and the script\'s macro draws one target search and throws it away', () => {
    const draws: number[] = [];
    const rng = scriptedRng([4]);
    const real = rng.int;
    rng.int = (a: number, b: number) => (draws.push(b), real(a, b));
    const { c, u } = poll({}, LOW, IDLE, rng);
    expect(c).toEqual({ kind: 'ability', id: 'paragon-os-final-impact', targets: [] });
    expect(draws).toEqual([0x7fffffff]); // the discarded pick (three girls alive), no roll
    expect(u.aiMemory?.[K.finalUsed]).toBe(true);
  });

  it('afterwards: Ultima 13,108, Holy 13,107, Judgment 13,107, Genesis 13,107, Big Bang 13,107 of 65,536; Final Impact never again', () => {
    const tally = exactTally((rng) => cmd(poll({ [K.finalUsed]: true }, LOW, IDLE, rng).c).id, 120);
    expect(share(tally, 'paragon-os-ultima')).toBeCloseTo(P(13108), 12);
    for (const id of ['paragon-os-holy', 'paragon-os-judgement', 'paragon-genesis', 'paragon-big-bang']) expect(share(tally, id)).toBeCloseTo(P(13107), 12);
    expect(share(tally, 'paragon-os-final-impact')).toBe(0);
  });

  it('with a Reflect up, Dispel goes first and Final Impact waits for a poll with none (and MP above 0)', () => {
    const reflected = poll({}, LOW, IDLE, scriptedRng([]), (_u, g) => {
      g[0]!.statuses.reflect = { ticksRemaining: null } as never;
    });
    expect(reflected.c).toEqual({ kind: 'ability', id: 'paragon-os-dispel', targets: [] });
    expect(reflected.u.aiMemory?.[K.finalUsed]).toBeUndefined();
    const drained = poll({}, LOW, IDLE, scriptedRng([0, 0]), (u) => (u.mp = 0));
    expect(['x2-shared-osmose', 'paragon-os-attack']).toContain(cmd(drained.c).id);
    expect(drained.u.aiMemory?.[K.finalUsed]).toBeUndefined();
  });

  it('the HP rows come before the answer states: below 40 percent a pending answer is never reached', () => {
    const { c, u } = poll({ [K.state]: OS_DEMI }, 80000, 0, scriptedRng([5, 0]));
    expect(cmd(c).id).toBe('paragon-os-attack');
    expect(u.aiMemory?.[K.state]).toBe(OS_DEMI);
  });

  it('and nothing in rows 1 to 3 clears the state, as in the script: after ONE result under 40 percent he acts on every poll (D-151 governs only the time before the first hit)', () => {
    const u = os({ [K.state]: OS_NORMAL }, 80000);
    const b = boardOf(u, [u, ...girls()], scriptedRng([1, 2, 3]), 0);
    expect(cmd(script.decide(b.ctx)).id).toBe('paragon-os-thundaga');
    expect(cmd(script.decide(b.ctx)).id).toBe('paragon-os-blizzaga');
    expect(cmd(script.decide(b.ctx)).id).toBe('paragon-os-waterga');
    expect(u.aiMemory?.[K.state]).toBe(OS_NORMAL);
  });
});

describe('the idle branch, its limit, and what the owner decided (D-151)', () => {
  it('untouched and inside the idle limit it does nothing, whatever its HP or MP (it waits to be hit)', () => {
    for (const [hp, mp] of [[MAX, 9999], [80000, 9999], [10000, 9999], [MAX, 0]] as const) {
      const { c } = poll({}, hp, IDLE - 1, scriptedRng([0, 0]), (u) => (u.mp = mp));
      expect(c, `hp ${hp} mp ${mp}`).toBeNull();
    }
  });

  it('past the limit it acts once and the count starts again: Dispel if anyone is Reflected, else mod 3: Judgment, Genesis, Big Bang', () => {
    const tally = exactTally((rng) => cmd(poll({}, MAX, IDLE, rng).c).id, 120);
    expect(share(tally, 'paragon-os-judgement')).toBeCloseTo(P(21846), 12);
    expect(share(tally, 'paragon-genesis')).toBeCloseTo(P(21845), 12);
    expect(share(tally, 'paragon-big-bang')).toBeCloseTo(P(21845), 12);
    const acted = poll({}, MAX, IDLE, scriptedRng([2]));
    expect(acted.u.aiMemory?.[K.quiet]).toBe(IDLE);
    const reflected = poll({}, MAX, IDLE, scriptedRng([]), (_u, g) => {
      g[1]!.statuses.reflect = { ticksRemaining: null } as never;
    });
    expect(reflected.c).toEqual({ kind: 'ability', id: 'paragon-os-dispel', targets: [] });
  });

  it('any result sets the clock back: hit just before the limit, it waits another full limit', () => {
    const u = os();
    const g = girls();
    const b = boardOf(u, [u, ...g], scriptedRng([]), IDLE - 1);
    script.onResult!(b.ctx, g[0]!, ab('x2-dark-knight-darkness'));
    expect(u.aiMemory?.[K.quiet]).toBe(IDLE - 1);
    const later = boardOf(u, [u, ...g], scriptedRng([0, 0]), IDLE - 1 + IDLE - 1);
    expect(cmd(script.decide(later.ctx)).id).toBe('paragon-os-attack'); // the pending answer (normal), not an idle action
  });

  it('O4 and O12 are the game\'s rule behind one switch: with lowHpActsEveryTurn he acts on his HP and MP every poll, hit or not', () => {
    OVERSOUL_ESTIMATES.lowHpActsEveryTurn = true;
    try {
      expect(cmd(poll({}, 80000, 0, scriptedRng([0])).c).id).toBe('paragon-os-firaga');
      expect(cmd(poll({}, 10000, 0, scriptedRng([0, 1])).c).id).toBe('paragon-os-final-impact');
      expect(['x2-shared-osmose', 'paragon-os-attack']).toContain(cmd(poll({}, MAX, 0, scriptedRng([0, 0]), (u) => (u.mp = 0)).c).id);
      expect(poll({}, MAX, 0, scriptedRng([0, 0])).c).toBeNull(); // healthy, MP up, untouched: the idle branch still waits
    } finally {
      OVERSOUL_ESTIMATES.lowHpActsEveryTurn = false;
    }
  });
});

describe('the first poll (O14) and the data', () => {
  it('the first poll plays the "Paragon oversouls!" line and goes on: it costs no turn', () => {
    const u = os({ [K.oversouled]: false, [K.state]: OS_NORMAL });
    const b = boardOf(u, [u, ...girls()], scriptedRng([0, 0]), 100);
    expect(cmd(script.decide(b.ctx)).id).toBe('paragon-os-attack'); // a pending answer is made on this very poll
    expect(b.events.filter((e) => e.type === 'message' && /oversouls/.test(String((e as { text?: string }).text)))).toHaveLength(1);
    script.decide(b.ctx);
    expect(b.events.filter((e) => e.type === 'message')).toHaveLength(1); // once
    const idle = os({ [K.oversouled]: false });
    const b2 = boardOf(idle, [idle, ...girls()], scriptedRng([]), 100);
    expect(script.decide(b2.ctx)).toBeNull();
    expect(idle.aiMemory?.[K.quiet]).toBe(100); // the idle count starts at his first poll
  });

  it('the rows the game gives: Attack carries no status, Final Impact is physical (Protect halves it), 14 hits, Osmose is a row of his own list', () => {
    expect(ab('paragon-os-attack').statusEffects).toEqual([]);
    expect(ab('paragon-os-final-impact')).toMatchObject({ damageType: 'physical', hits: 14 });
    expect(paragonOversoul.abilityIds).toContain('x2-shared-osmose');
    expect(ab('x2-shared-osmose').ffx2Record).toMatchObject({ id: 0x317b, damageClass: 2, formula: 9, power: 6 });
    expect(OVERSOUL_ESTIMATES).toMatchObject({ finalImpactReducible: true, attackItchy: false, idleSeconds: 20, lowHpActsEveryTurn: false });
    // O2, structural: the game's limit is 1,200 idle polls = 40.04 s at 29.97 steps a second; the build's is 20 s. The conversion the handoff quotes:
    expect(OVERSOUL_IDLE_POLLS * 0.033367).toBeCloseTo(40.04, 2);
  });
});
