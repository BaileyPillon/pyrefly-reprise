/**
 * **Engine-level parity, the FFX counter chain** (re-parity RC9 lane FFX-G, slice G-c; **FFX only**).
 *
 * `parity-ffx-counter-kernel.test.ts` proves the three kernel functions against the game's own machine code. This file proves the WIRING: it drives the
 * engine's own `resolveAbility` and `afterAction` on generated boards and asserts that who answers a hit, with what and at whom, equals an **independent
 * oracle** that restates `research/re-ffx-targeting.md` section 7 in its own terms and imports nothing from `kernel/counter.ts` or `adapt/counter.ts`:
 *
 * 1. a hit arms its target's counter for every outcome but "no effect" (a hit, a miss, a forced miss, a Nul-nullified hit); the command must be single-target
 *    and harmful (a table test, not "does damage"); the attacker must not itself be running a reaction; never against itself;
 * 2. Counterattack and Evade and Counter answer a physical command, Magic Counter a magical one; nothing answers the other;
 * 3. the answer is once per command whatever its hit count, and only from a holder that can act after the hit (not asleep, Petrified, Confused, Berserk,
 *    Provoked, Threatened or Ejected) and is still standing when the action ends; it is the holder's own default attack at the attacker, a reaction that costs
 *    no turn and draws nothing.
 *
 * Mutants of the production code that this file and the kernel file must catch are listed in the lane handoff (`docs/handoff/re-parity-rc9-ffx-counters.md`).
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, AutoAbilityId, BattleEvent, FFXCombatant, StatusId, StatusInstance } from '../../src/battle/common/types.ts';
import { resolveAbility } from '../../src/battle/ffx/index.ts';
import { afterAction } from '../../src/battle/ffx/engine-end.ts';
import { takeCounters } from '../../src/battle/ffx/counter-chain.ts';
import { type Board, type Member, combatantOfMember, contextOfBoard, lcg, randomBoard } from './helpers/ffxTargetBoard.ts';

// ------------------------------------------------------------------ the abilities of this file, in the game's terms

/** What an attack is, as the oracle sees it. Declared here, never read back from the engine. */
interface AttackSpec {
  name: string;
  kind: 'physical' | 'magical' | 'other';
  single: boolean;
  harmful: boolean;
  /** The outcome the attack is built to have on a living, standing target. */
  outcome: 'hit' | 'rolled' | 'no-effect' | 'sleeps' | 'nullified';
  hits: number;
  /** A damaging attack big enough to kill a 1-HP target. */
  lethal?: boolean;
}

const SPECS: AttackSpec[] = [
  { name: 'blow', kind: 'physical', single: true, harmful: true, outcome: 'hit', hits: 1 },
  { name: 'triple-blow', kind: 'physical', single: true, harmful: true, outcome: 'hit', hits: 3 },
  { name: 'rolled-blow', kind: 'physical', single: true, harmful: true, outcome: 'rolled', hits: 1 },
  { name: 'bolt', kind: 'magical', single: true, harmful: true, outcome: 'hit', hits: 1 },
  { name: 'rolled-bolt', kind: 'magical', single: true, harmful: true, outcome: 'rolled', hits: 2 },
  { name: 'sweep', kind: 'physical', single: false, harmful: true, outcome: 'hit', hits: 1 },
  { name: 'storm', kind: 'magical', single: false, harmful: true, outcome: 'hit', hits: 1 },
  { name: 'dud-blow', kind: 'physical', single: true, harmful: true, outcome: 'no-effect', hits: 1 },
  { name: 'dud-bolt', kind: 'magical', single: true, harmful: true, outcome: 'no-effect', hits: 1 },
  { name: 'mend', kind: 'magical', single: true, harmful: false, outcome: 'hit', hits: 1 },
  { name: 'lull', kind: 'magical', single: true, harmful: true, outcome: 'sleeps', hits: 1 },
  { name: 'dim', kind: 'magical', single: true, harmful: true, outcome: 'hit', hits: 1 },
  { name: 'quicken', kind: 'magical', single: true, harmful: false, outcome: 'hit', hits: 1 },
  { name: 'scorch', kind: 'magical', single: true, harmful: true, outcome: 'nullified', hits: 1 },
  { name: 'killing-blow', kind: 'physical', single: true, harmful: true, outcome: 'hit', hits: 1, lethal: true },
  { name: 'doom-spell', kind: 'magical', single: true, harmful: true, outcome: 'hit', hits: 1 },
  { name: 'guard-spell', kind: 'magical', single: true, harmful: false, outcome: 'hit', hits: 1 },
];
const specOf = (name: string): AttackSpec => SPECS.find((s) => s.name === name) as AttackSpec;

/** A record id per attack, so each has a game-style record (the harmful test reads its chances and durations). */
let nextId = 0x6a00;

function abilityOf(spec: AttackSpec): AbilityDef {
  const id = nextId++;
  const damaging = !['mend', 'lull', 'dim', 'quicken', 'doom-spell', 'guard-spell'].includes(spec.name);
  const base = {
    id: `t-${spec.name}`,
    name: spec.name,
    game: 'ffx' as const,
    category: 'skill' as const,
    mpCost: 0,
    rank: 3,
    power: spec.lethal ? 9999 : 1,
    formula: damaging ? ('fixed-no-variance' as const) : ('none' as const),
    element: spec.name === 'scorch' ? (['fire'] as never) : [],
    hits: spec.hits,
    statusEffects: [],
    removesStatuses: [],
    canMiss: spec.outcome === 'rolled' ? undefined : false,
    ...(spec.outcome === 'rolled' ? { accuracy: 90 } : {}),
    damageType: spec.kind,
    targeting: spec.single ? ('single-enemy' as const) : ('all-enemies' as const),
    flags: spec.outcome === 'no-effect' ? (['misses-if-target-alive'] as never) : [],
  };
  // The game's record of each attack: the damage words and the status words the harmful test reads.
  const flagsDamage = (spec.kind === 'physical' ? 1 : spec.kind === 'magical' ? 2 : 0) | (spec.name === 'mend' ? 0x10 : 0);
  const record = {
    id,
    type: spec.kind === 'magical' ? 1 : 0,
    flagsMisc: spec.outcome === 'rolled' ? 2 << 3 : spec.outcome === 'no-effect' ? 0x800000 : 0,
    flagsDamage,
    damageClass: damaging ? 1 : 0,
    ...(spec.name === 'lull' ? { chances: [[12, 255]] as const, durations: [[0, 3]] as const } : {}),
    ...(spec.name === 'dim' ? { chances: [[14, 255]] as const, durations: [[2, 3]] as const } : {}),
    ...(spec.name === 'quicken' ? { chances: [[23, 255]] as const, durations: [[11, 3]] as const } : {}),
    ...(spec.name === 'doom-spell' ? { extra: 0x4000 } : {}),
    ...(spec.name === 'guard-spell' ? { extra: 0x1000 } : {}),
  };
  return { ...base, record } as unknown as AbilityDef;
}

// ------------------------------------------------------------------ the board of one case

interface Case {
  board: Board;
  attacker: string;
  holder: string;
  spec: AttackSpec;
  wears: AutoAbilityId[];
  inReaction: boolean;
  seed: number;
}

const COUNTER_ABILITIES: AutoAbilityId[] = ['counterattack', 'evade-and-counter', 'magic-counter'];

function makeCase(r: ReturnType<typeof lcg>, seed: number): Case | null {
  const board = randomBoard(r);
  // This file is about counters: no Cover, no Reflect, no hidden monsters, so the target of the hit is the holder.
  for (const m of board.members) Object.assign(m, { reflect: false, guard: false, sentinel: false, guardMark: false, untargetable: false });
  const party = board.members.filter((m) => m.side === 'party');
  const holderMember = r.pick(party);
  const others = board.members.filter((m) => m.id !== holderMember.id);
  const attackerMember = r.chance(0.85) ? r.pick(others.filter((m) => m.side === 'enemy')) : r.pick(others);
  if (attackerMember === undefined) return null;
  // The attacker acts: standing, awake, not Provoked (the engine's turn start would have made its turn a forced attack).
  Object.assign(attackerMember, { dead: false, petrified: false, sleep: false, confuse: false, berserk: false, threaten: false, provokedBy: null });
  const spec = r.pick(SPECS);
  if (spec.lethal) Object.assign(holderMember, { hp: 1, dead: false });
  else if (!holderMember.dead) holderMember.hp = Math.max(holderMember.hp, 1000);
  const wears = COUNTER_ABILITIES.filter(() => r.chance(0.5));
  return { board, attacker: attackerMember.id, holder: holderMember.id, spec, wears, inReaction: r.chance(0.15), seed };
}

/**
 * The oracle: does the holder answer this attack? Everything it reads is a fact of the case, none of the engine's, except `landed`: whether a damaging blow
 * connected (a rolled attack may miss), which decides only whether a sleeping holder was woken by it (a physical hit that lands clears Sleep in the hit record,
 * `adapt/reactions.ts`'s `woke`; magic does not).
 */
function oracleAnswers(c: Case, landed: boolean): boolean {
  const holder = c.board.members.find((m) => m.id === c.holder) as Member;
  const spec = c.spec;
  if (!spec.single || c.inReaction || c.attacker === c.holder) return false;
  const answersPhysical = c.wears.includes('counterattack') || c.wears.includes('evade-and-counter');
  const answersMagical = c.wears.includes('magic-counter');
  if (spec.kind === 'physical' && !answersPhysical) return false;
  if (spec.kind === 'magical' && !answersMagical) return false;
  if (spec.kind === 'other') return false;
  if (!spec.harmful) return false;
  if (spec.outcome === 'no-effect' && !holder.dead) return false; // a dud against a living target does nothing at all
  // The hit is applied to a target that is there to be hit: a dead holder is never aimed at.
  if (holder.dead) return false;
  // Can-act after the hit.
  const woken = holder.sleep && spec.kind === 'physical' && spec.outcome !== 'no-effect' && landed;
  if (holder.petrified || holder.confuse || holder.berserk || (holder.sleep && !woken) || holder.threaten || holder.provokedBy !== null) return false;
  if (spec.outcome === 'sleeps') return false; // the Sleep it inflicts (chance 255) lands first
  if (spec.lethal) return false; // a 1-HP holder dies of it
  return true;
}

function equip(c: FFXCombatant, autos: AutoAbilityId[]): void {
  c.equipment = {
    weapon: { name: 'Sword', slots: 3, autoAbilities: [...autos] },
    armor: { name: 'Armour', slots: 3, autoAbilities: [] },
  };
}

/** Build the context of a case, give the holder its gear, give the nullified attack its Nul, and run the attack. */
function runCase(c: Case): { events: Array<Record<string, unknown>>; queued: ReturnType<typeof takeCounters>; holder: FFXCombatant; ctx: ReturnType<typeof contextOfBoard>['ctx'] } {
  const { ctx, events, byId } = contextOfBoard(c.board, c.seed);
  const holder = byId.get(c.holder) as FFXCombatant;
  equip(holder, c.wears);
  if (c.spec.outcome === 'nullified') {
    holder.statuses['nulblaze' as StatusId] = { id: 'nulblaze' as StatusId, turnsRemaining: 254, ticksRemaining: null, charges: 3, stacks: 0, permanent: false } satisfies StatusInstance;
  }
  ctx.rt.inReaction = c.inReaction;
  const attacker = byId.get(c.attacker) as FFXCombatant;
  const def = abilityOf(c.spec);
  resolveAbility(ctx, attacker, def, [c.holder]);
  return { events, queued: takeCounters(ctx), holder, ctx };
}

describe('the engine arms and queues counters as the game does, on generated boards', () => {
  it('4000 boards: the same holders answer the same attackers, with the same cause, once per command', () => {
    const r = lcg(20261015);
    const seen = { answered: 0, silent: 0, miss: 0, multi: 0, reaction: 0, cannot: 0, magical: 0, evade: 0, nullified: 0, noEffect: 0, harmless: 0, group: 0, lethal: 0 };
    let ran = 0;
    for (let i = 0; i < 4000; i++) {
      const c = makeCase(r, 5000 + i);
      if (c === null) continue;
      const holderMember = c.board.members.find((m) => m.id === c.holder) as Member;
      if (holderMember.dead && c.spec.outcome !== 'no-effect') continue; // a dead target is never aimed at
      const got = runCase(c);
      const want = oracleAnswers(c, got.events.some((e) => e['type'] === 'damage' && e['targetId'] === c.holder));
      const answers = got.queued; // takeCounters already drops a counter whose holder died
      const note = `case ${i}: ${c.spec.name} by ${c.attacker} at ${c.holder} wearing [${c.wears.join(', ')}]${c.inReaction ? ' in a reaction' : ''}`;
      expect(answers.length, `${note}: answers`).toBe(want ? 1 : 0);
      if (want) {
        const one = answers[0]!;
        expect([one.holderId, one.attackerId], note).toEqual([c.holder, c.attacker]);
        expect(one.cause, note).toBe(c.spec.kind === 'magical' ? 'magic-counter' : 'counterattack');
      }
      ran++;
      if (want) seen.answered++;
      else seen.silent++;
      if (want && c.spec.outcome === 'rolled') seen.miss++;
      if (want && c.spec.hits > 1) seen.multi++;
      if (c.inReaction && c.wears.length > 0) seen.reaction++;
      if (!want && c.wears.length > 0 && (holderMember.sleep || holderMember.petrified || holderMember.confuse || holderMember.berserk || holderMember.threaten || holderMember.provokedBy !== null)) seen.cannot++;
      if (want && c.spec.kind === 'magical') seen.magical++;
      if (want && c.wears.includes('evade-and-counter') && c.spec.kind === 'physical') seen.evade++;
      if (want && c.spec.outcome === 'nullified') seen.nullified++;
      if (!want && c.spec.outcome === 'no-effect' && c.wears.length > 0) seen.noEffect++;
      if (!want && !c.spec.harmful && c.wears.length > 0) seen.harmless++;
      if (!want && !c.spec.single && c.wears.length > 0) seen.group++;
      if (c.spec.lethal && c.wears.length > 0) seen.lethal++;
    }
    expect(ran).toBeGreaterThan(3500);
    // the generator really reaches each mechanism
    expect(seen.answered).toBeGreaterThan(400);
    expect(seen.miss).toBeGreaterThan(30);
    expect(seen.multi).toBeGreaterThan(60);
    expect(seen.reaction).toBeGreaterThan(100);
    expect(seen.cannot).toBeGreaterThan(80);
    expect(seen.magical).toBeGreaterThan(100);
    expect(seen.evade).toBeGreaterThan(60);
    expect(seen.nullified).toBeGreaterThan(10);
    expect(seen.noEffect).toBeGreaterThan(20);
    expect(seen.harmless).toBeGreaterThan(40);
    expect(seen.group).toBeGreaterThan(40);
    expect(seen.lethal).toBeGreaterThan(40);
  });
});

// ------------------------------------------------------------------ named cases, in words

function room(): Board {
  const mk = (id: string, side: 'party' | 'enemy', slot: number): Member => ({
    id, side, slot, hp: 5000, dead: false, petrified: false, sleep: false, confuse: false, berserk: false, threaten: false, provokedBy: null,
    reflect: false, guard: false, sentinel: false, guardMark: false, untargetable: false, keeps: false,
  });
  return { members: [mk('tidus', 'party', 0), mk('auron', 'party', 2), mk('m0', 'enemy', 0x14), mk('m1', 'enemy', 0x15)], bond: [0, 0, 0, 0, 0, 0, 0, 0] };
}

const status = (id: StatusId): StatusInstance => ({ id, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false });

function named(attack: string, wears: AutoAbilityId[], over: Partial<Case> = {}, seed = 9): ReturnType<typeof runCase> {
  return runCase({ board: room(), attacker: 'm0', holder: 'tidus', spec: specOf(attack), wears, inReaction: false, seed, ...over });
}

describe('the counter chain, named', () => {
  it('Counterattack answers a blow with the holder\'s own Attack at the attacker, and Magic Counter does not', () => {
    const a = named('blow', ['counterattack']);
    expect(a.queued).toEqual([{ holderId: 'tidus', attackerId: 'm0', cause: 'counterattack', lost: false }]);
    expect(named('blow', ['magic-counter']).queued).toEqual([]);
    expect(named('bolt', ['magic-counter']).queued).toEqual([{ holderId: 'tidus', attackerId: 'm0', cause: 'magic-counter', lost: false }]);
    expect(named('bolt', ['counterattack', 'evade-and-counter']).queued).toEqual([]);
  });

  it('a miss counts: Evade and Counter forces a rolled blow to miss and still answers (the old engine answered only damage)', () => {
    const r = named('rolled-blow', ['evade-and-counter']);
    expect(r.events.filter((e) => e['type'] === 'miss')).toHaveLength(1);
    expect(r.events.filter((e) => e['type'] === 'damage')).toHaveLength(0);
    expect(r.queued).toHaveLength(1);
  });

  it('Evade and Counter forces a rolled blow to miss on a turn, but not when the attacker is itself running a reaction (its reaction byte is non-zero)', () => {
    const tally = { turn: { hit: 0, miss: 0 }, reaction: { hit: 0, miss: 0 } };
    for (let seed = 1; seed <= 40; seed++) {
      for (const inReaction of [false, true]) {
        const r = named('rolled-blow', ['evade-and-counter'], { inReaction }, seed);
        const hit = r.events.some((e) => e['type'] === 'damage');
        tally[inReaction ? 'reaction' : 'turn'][hit ? 'hit' : 'miss'] += 1;
      }
    }
    expect(tally.turn).toEqual({ hit: 0, miss: 40 });
    expect(tally.reaction.hit).toBeGreaterThan(10);
  });

  it('a Nul-nullified hit counts too; a "no effect" outcome does not', () => {
    expect(named('scorch', ['magic-counter']).queued).toHaveLength(1);
    expect(named('dud-blow', ['counterattack']).queued).toEqual([]);
  });

  it('a three-hit blow is answered once, not three times', () => {
    const r = named('triple-blow', ['counterattack']);
    expect(r.events.filter((e) => e['type'] === 'damage')).toHaveLength(3);
    expect(r.queued).toHaveLength(1);
  });

  it('a command that is not single-target meets no counter, even when it hits the holder', () => {
    const r = named('sweep', ['counterattack', 'evade-and-counter', 'magic-counter']);
    expect(r.events.filter((e) => e['type'] === 'damage').map((e) => e['targetId'])).toContain('tidus');
    expect(r.queued).toEqual([]);
    expect(named('storm', ['magic-counter']).queued).toEqual([]);
  });

  it('harmful is a table test: Sleep and Darkness with a duration are, Haste and a cure are not', () => {
    expect(named('dim', ['magic-counter']).queued).toHaveLength(1);
    expect(named('quicken', ['magic-counter']).queued).toEqual([]);
    expect(named('mend', ['magic-counter']).queued).toEqual([]);
  });

  it('a holder that falls asleep of the hit, or is already unable to act, forgets the counter; one that can act answers', () => {
    expect(named('lull', ['magic-counter']).queued).toEqual([]);
    for (const state of ['petrified', 'confuse', 'berserk', 'threaten'] as const) {
      const board = room();
      Object.assign(board.members[0] as Member, { [state]: true });
      expect(runCase({ board, attacker: 'm0', holder: 'tidus', spec: specOf('blow'), wears: ['counterattack'], inReaction: false, seed: 3 }).queued, state).toEqual([]);
    }
    // A sleeper stays asleep under magic, and a physical hit that lands wakes it, so it can answer that one.
    const asleep = room();
    (asleep.members[0] as Member).sleep = true;
    expect(runCase({ board: asleep, attacker: 'm0', holder: 'tidus', spec: specOf('bolt'), wears: ['magic-counter'], inReaction: false, seed: 3 }).queued).toEqual([]);
    expect(runCase({ board: asleep, attacker: 'm0', holder: 'tidus', spec: specOf('blow'), wears: ['counterattack'], inReaction: false, seed: 3 }).queued).toHaveLength(1);
    const provoked = room();
    (provoked.members[0] as Member).provokedBy = 'm1';
    expect(runCase({ board: provoked, attacker: 'm0', holder: 'tidus', spec: specOf('blow'), wears: ['counterattack'], inReaction: false, seed: 3 }).queued).toEqual([]);
    expect(named('blow', ['counterattack']).queued).toHaveLength(1);
  });

  it('an attacker that is itself running a reaction is never countered, and a holder that dies of the blow does not answer', () => {
    expect(named('blow', ['counterattack'], { inReaction: true }).queued).toEqual([]);
    const killed = named('killing-blow', ['counterattack']);
    expect(killed.queued).toEqual([]);
  });

  it('a holder that died earlier in the same action (and stood up again) answers nothing: the death check removed its queued actions', () => {
    const board = room();
    const { ctx, byId } = contextOfBoard(board, 4);
    equip(byId.get('tidus') as FFXCombatant, ['counterattack']);
    ctx.rt.reactionDeaths = new Set(['tidus']);
    resolveAbility(ctx, byId.get('m0') as FFXCombatant, abilityOf(specOf('blow')), ['tidus']);
    expect(takeCounters(ctx)).toEqual([]);
  });

  it('a party member that strikes itself is not countered by itself', () => {
    const r = named('blow', ['counterattack'], { attacker: 'tidus' });
    expect(r.queued).toEqual([]);
  });

  it('nobody answers for itself: a party member that strikes an ally holds the counter against it, not against itself', () => {
    const r = named('blow', ['counterattack'], { attacker: 'auron' });
    expect(r.queued).toEqual([{ holderId: 'tidus', attackerId: 'auron', cause: 'counterattack', lost: false }]);
  });

  it('the answer is run by the end of the action: a counter event, then the holder\'s Attack at the attacker, a reaction that draws nothing', () => {
    const { ctx, events, byId } = contextOfBoard(room(), 21);
    equip(byId.get('tidus') as FFXCombatant, ['counterattack']);
    const attacker = byId.get('m0') as FFXCombatant;
    const holderHp = (byId.get('m0') as FFXCombatant).hp;
    resolveAbility(ctx, attacker, abilityOf(specOf('blow')), ['tidus']);
    const start = events.length;
    afterAction({ ctx, push: (e) => ctx.emit(e), buffer: ctx.state.log as readonly BattleEvent[], nextGroupId: undefined }, attacker, events as never, { kind: 'attack', targets: ['tidus'] });
    const after = events.slice(start);
    const counter = after.find((e) => e['type'] === 'counter');
    expect(counter).toMatchObject({ type: 'counter', actorId: 'tidus', targetId: 'm0', cause: 'counterattack' });
    expect(after.filter((e) => e['type'] === 'damage' && e['sourceId'] === 'tidus' && e['targetId'] === 'm0').length).toBeGreaterThan(0);
    expect((byId.get('m0') as FFXCombatant).hp).toBeLessThan(holderHp);
    // and the queue is empty afterwards
    expect(ctx.rt.counters ?? []).toEqual([]);
  });

  it('an attacker that is gone when the answer comes is not answered: the holder swings at nobody', () => {
    const { ctx, events, byId } = contextOfBoard(room(), 22);
    equip(byId.get('tidus') as FFXCombatant, ['counterattack']);
    const attacker = byId.get('m0') as FFXCombatant;
    resolveAbility(ctx, attacker, abilityOf(specOf('blow')), ['tidus']);
    expect(ctx.rt.counters).toHaveLength(1);
    attacker.hp = 0;
    attacker.alive = false;
    attacker.statuses['ko' as StatusId] = status('ko' as StatusId) as never;
    const start = events.length;
    afterAction({ ctx, push: (e) => ctx.emit(e), buffer: ctx.state.log as readonly BattleEvent[], nextGroupId: undefined }, attacker, events as never, { kind: 'attack', targets: ['tidus'] });
    expect(events.slice(start).filter((e) => e['type'] === 'counter' || (e['type'] === 'damage' && e['sourceId'] === 'tidus'))).toEqual([]);
  });

  it('every ability the party can hold is a possible holder; the engine\'s monsters hold none (no gear, no bit)', () => {
    const m = combatantOfMember((room().members[2]) as Member);
    expect(m.equipment).toBeUndefined();
    const r = named('blow', [], {});
    expect(r.queued).toEqual([]);
  });
});
