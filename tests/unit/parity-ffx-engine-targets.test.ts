/**
 * **Engine-level parity, the FFX target chain** (re-parity RC4 lane FFX-G, slices G-a and G-b; **FFX only**).
 *
 * The kernel tests (`parity-ffx-target-*.test.ts`) prove each function against the game's own machine code. This file proves the WIRING: it drives
 * the engine's own `resolveAbility` and `forcedTurn` on a few thousand generated boards and asserts that what the engine does equals an **independent
 * oracle** that restates `research/re-ffx-targeting.md` in its own terms (`helpers/ffxTargetBoard.ts`, which imports nothing from the kernels or the
 * adapters), draw for draw:
 *
 * 1. the target set, the random spread (every pick first, stream 5, a draw only with two or more candidates, every member a target), Cover (once per
 *    target, best score, Sentinel doubled, lowest slot on ties, can-act, the Guard mark of an enemy, the Tidus terms) and Reflect (back to the caster for
 *    a holder on the other side, stream 6 for one on the caster's own side, never twice, lost with nobody left): the hits each combatant takes;
 * 2. the streams 4, 5 and 6 the chain draws from, in the game's order, and no other draw from them;
 * 3. the turn start: Provoke first (a gone provoker clears the bit, a monster that keeps control ignores it), then Berserk (the opposite side), then
 *    Confuse (its own side, the actor included), one stream-4 draw with two or more candidates;
 * 4. the Tidus counters (+1 on a net heal of a party member by Tidus, -1 on a net loss, floored at 0).
 *
 * Mutants of the production code that this file and the kernel files must catch are listed in the lane handoff (`docs/handoff/re-parity-rc4-react.md`).
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleState, Command, FFXCombatant, StatusInstance } from '../../src/battle/common/types.ts';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { CORE_ABILITIES, resolveAbility } from '../../src/battle/ffx/index.ts';
import { forcedTurn } from '../../src/battle/ffx/forced-turn.ts';
import { buildAction } from '../../src/battle/ffx/target-build.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { reflectableDef } from '../../src/battle/ffx/statuses.ts';
import {
  type AbilitySpec,
  type Board,
  type Member,
  PARTY_IDS,
  abilityOfSpec,
  contextOfBoard,
  lcg,
  oracleAction,
  oracleForced,
  randomBoard,
} from './helpers/ffxTargetBoard.ts';
import { enemy, setup, stats } from './ffx-fixtures.test.ts';

const KINDS: AbilitySpec['kind'][] = ['attack', 'attack', 'gouge', 'sweep', 'fire', 'cure', 'slowga', 'hastega', 'dispel', 'fury', 'fury', 'mix'];
const CHAIN_STREAMS = new Set([4, 5, 6]);

/** Hits the engine put on each combatant: one `damage` event per connecting hit (these abilities never miss), a `miss`/nullified per hit lost. */
function engineHits(events: ReadonlyArray<Record<string, unknown>>): { hits: Record<string, number>; lost: Record<string, number> } {
  const hits: Record<string, number> = {};
  const lost: Record<string, number> = {};
  for (const e of events) {
    const id = e['targetId'] as string | undefined;
    if (id === undefined) continue;
    if (e['type'] === 'damage') hits[id] = (hits[id] ?? 0) + 1;
    else if (e['type'] === 'miss' && e['reason'] === 'nullified') lost[id] = (lost[id] ?? 0) + 1;
  }
  return { hits, lost };
}

describe('the engine builds an action\'s targets as the game does, on generated boards', () => {
  it('3000 boards: the same hits on the same combatants, the same lost hits, the same draws of streams 4, 5 and 6', () => {
    const r = lcg(20261011);
    const seen = { cover: 0, bounceBack: 0, bounceAcross: 0, lost: 0, spreadFull: 0, spreadZero: 0, multiReflect: 0, tidus: 0, guardMark: 0 };
    let ran = 0;
    for (let i = 0; i < 3000; i++) {
      const board = randomBoard(r);
      const alive = board.members.filter((m) => !m.dead);
      const usersOnBoard = alive.filter((m) => !m.untargetable);
      if (usersOnBoard.length === 0) continue;
      const user = r.pick(usersOnBoard);
      user.provokedBy = null; // a Provoked monster never reaches resolveAbility (its turn is the forced attack); the redirect of one that keeps control has its own tests
      // now and then the other side has been wiped out: a bounce off an ally then has nobody to land on, and the hits are lost
      if (r.chance(0.1)) for (const m of board.members) if (m.side !== user.side) Object.assign(m, { dead: true, hp: 0, reflect: false, sentinel: false, guard: false, guardMark: false });
      const spec: AbilitySpec = { kind: r.pick(KINDS), hits: r.int(1, 3) };
      if (spec.kind === 'fury') spec.hits = r.int(4, 9);
      const def = abilityOfSpec(spec);
      const side = user.side;
      // the chosen target of a single-target ability: a living member of the right side
      const legal = board.members.filter((m) => !m.dead && !m.untargetable && (def.targeting === 'single-ally' ? m.side === side : m.side !== side));
      if ((def.targeting === 'single-enemy' || def.targeting === 'single-ally') && legal.length === 0) continue;
      const chosen = def.targeting === 'single-enemy' || def.targeting === 'single-ally' ? r.pick(legal) : null;

      const seed = 1000 + i;
      const { ctx, events, rng, byId } = contextOfBoard(board, seed, board.members.filter((m) => m.side === 'party').map((m) => m.id).sort(() => r.next() - 0.5));
      const taps: number[] = [];
      rng.tap = (stream) => {
        if (CHAIN_STREAMS.has(stream)) taps.push(stream);
      };
      const mirror = contextOfBoard(board, seed).rng;
      const want = oracleAction(board, user.id, spec, chosen?.id ?? null, mirror);

      resolveAbility(ctx, byId.get(user.id)!, def, chosen ? [chosen.id] : []);
      const got = engineHits(events);
      const note = `board ${i}: ${spec.kind} x${spec.hits} by ${user.id} at ${chosen?.id ?? 'the set'}`;
      expect(got.hits, `${note}: hits`).toEqual(want.hits);
      expect(got.lost, `${note}: lost hits`).toEqual(want.lost);
      expect(taps, `${note}: chain draws`).toEqual(want.draws);
      ran++;
      if (Object.keys(want.lost).length > 0) seen.lost++;
      if (def.damageType === 'physical' && chosen && want.hits[chosen.id] === undefined && Object.keys(want.hits).length > 0) seen.cover++;
      if (want.draws.includes(6)) seen.bounceAcross++;
      if (def.flags.includes('reflectable') && want.hits[user.id] !== undefined && chosen && chosen.side !== side) seen.bounceBack++;
      if ((def.targeting === 'all-enemies' || def.targeting === 'all-allies') && want.draws.includes(6)) seen.multiReflect++;
      if (spec.kind === 'fury' && Object.keys(want.hits).length === 1 && spec.hits >= 4) seen.spreadFull++;
      if (user.id === 'tidus') seen.tidus++;
      if (board.members.some((m) => m.guardMark)) seen.guardMark++;
    }
    expect(ran).toBeGreaterThan(2500);
    // the generator really reaches each mechanism
    expect(seen.cover).toBeGreaterThan(120);
    expect(seen.bounceBack).toBeGreaterThan(30);
    expect(seen.bounceAcross).toBeGreaterThan(100);
    expect(seen.lost).toBeGreaterThan(20);
    expect(seen.multiReflect).toBeGreaterThan(50);
    expect(seen.tidus).toBeGreaterThan(100);
    expect(seen.guardMark).toBeGreaterThan(100);
  });

  it('two boards of one seed make the same draws (the chain is deterministic) and a different seed makes different picks', () => {
    const r = lcg(7);
    const board = randomBoard(r);
    board.members.filter((m) => m.side === 'enemy').forEach((m) => Object.assign(m, { dead: false, untargetable: false, hp: 5000, reflect: false, guard: false, sentinel: false, guardMark: false }));
    const runOnce = (seed: number): string => {
      const { ctx, events, byId } = contextOfBoard(board, seed);
      const user = board.members.find((m) => m.side === 'party' && !m.dead);
      if (!user) return '';
      resolveAbility(ctx, byId.get(user.id)!, abilityOfSpec({ kind: 'fury', hits: 9 }), []);
      return events.filter((e) => e['type'] === 'damage').map((e) => e['targetId']).join(',');
    };
    expect(runOnce(5)).toBe(runOnce(5));
    const many = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(runOnce));
    expect(many.size).toBeGreaterThan(1);
  });
});

describe('the engine\'s forced turns are the game\'s, on generated boards', () => {
  it('2500 boards: Provoke, then Berserk, then Confuse; the same targets, the same stream-4 draws, the same cleared Provoke', () => {
    const r = lcg(424242);
    const seen = { provokeForced: 0, provokeCleared: 0, keeps: 0, berserk: 0, confuse: 0, dropped: 0, drawn: 0, none: 0 };
    let ran = 0;
    for (let i = 0; i < 2500; i++) {
      const board = randomBoard(r);
      const alive = board.members.filter((m) => !m.dead && !m.petrified);
      if (alive.length === 0) continue;
      const actor = r.pick(alive);
      // a forced turn needs its status; most boards give the actor one or two
      actor.berserk = r.chance(0.3);
      actor.confuse = r.chance(0.35);
      if (r.chance(0.45)) {
        const others = board.members.filter((m) => m.id !== actor.id);
        actor.provokedBy = others.length > 0 && r.chance(0.9) ? r.pick(others).id : null;
        actor.keeps = actor.side === 'enemy' && r.chance(0.2);
      }
      const seed = 5000 + i;
      const { ctx, rng, byId } = contextOfBoard(board, seed);
      const taps: number[] = [];
      rng.tap = (stream) => {
        if (CHAIN_STREAMS.has(stream)) taps.push(stream);
      };
      const want = oracleForced(board, actor.id, contextOfBoard(board, seed).rng);
      const who = byId.get(actor.id)!;
      const hadProvoke = who.statuses['provoke'] !== undefined;
      const got = forcedTurn(ctx, who);
      const note = `board ${i}: ${actor.id} (provoked by ${actor.provokedBy}, keeps ${actor.keeps}, berserk ${actor.berserk}, confuse ${actor.confuse})`;
      expect(got.kind, `${note}: kind`).toBe(want.kind);
      if (got.kind === 'attack') expect(got.targets, `${note}: targets`).toEqual(want.targets);
      expect(taps, `${note}: draws`).toEqual(want.draws);
      expect(hadProvoke && who.statuses['provoke'] === undefined, `${note}: Provoke cleared`).toBe(want.cleared);
      ran++;
      if (want.kind === 'attack' && actor.provokedBy !== null && !want.cleared && !actor.keeps) seen.provokeForced++;
      if (want.cleared) seen.provokeCleared++;
      if (actor.keeps && actor.provokedBy !== null) seen.keeps++;
      if (want.kind === 'dropped') seen.dropped++;
      if (want.draws.length > 0) seen.drawn++;
      if (want.kind === 'none') seen.none++;
      if (actor.berserk) seen.berserk++;
      if (actor.confuse) seen.confuse++;
    }
    expect(ran).toBeGreaterThan(2000);
    expect(seen.provokeForced).toBeGreaterThan(150);
    expect(seen.provokeCleared).toBeGreaterThan(30);
    expect(seen.keeps).toBeGreaterThan(30);
    expect(seen.dropped).toBeGreaterThan(20);
    expect(seen.drawn).toBeGreaterThan(100);
    expect(seen.none).toBeGreaterThan(100);
  });
});

describe('a spread deals its hits over the whole set and every member is a target', () => {
  it('one hit over three enemies leaves two of them targets with no hit; the single hit goes to the one the stream-5 value picks', () => {
    const r = lcg(11);
    const board = randomBoard(r);
    const proto = board.members[0] as Member;
    const heroes: Member[] = ['tidus', 'yuna'].map((id) => ({ ...proto, id, side: 'party', slot: PARTY_IDS.indexOf(id as never) }));
    const monsters: Member[] = ['m0', 'm1', 'm2'].map((id, i) => ({ ...proto, id, side: 'enemy', slot: 0x14 + i }));
    board.members = [...heroes, ...monsters];
    for (const m of board.members) Object.assign(m, { dead: false, petrified: false, sleep: false, confuse: false, berserk: false, threaten: false, reflect: false, guard: false, sentinel: false, guardMark: false, untargetable: false, provokedBy: null, hp: 5000 });
    const { ctx, byId, rng } = contextOfBoard(board, 21);
    const mirror = contextOfBoard(board, 21).rng;
    const def = abilityOfSpec({ kind: 'fury', hits: 1 });
    const pool = ['m0', 'm1', 'm2'].map((id) => byId.get(id)!);
    const built = buildAction(ctx, byId.get('tidus')!, def, pool, 1, true);
    expect(built.targets.map((t) => t.target.id)).toEqual(['m0', 'm1', 'm2']);
    const chosen = ['m0', 'm1', 'm2'][mirror.draw(5) % 3];
    expect(built.targets.map((t) => [t.target.id, t.hits])).toEqual(['m0', 'm1', 'm2'].map((id) => [id, id === chosen ? 1 : 0]));
    void rng;
  });
});

describe('the turn loop: a Provoked, Berserk or Confused actor\'s turn is the game\'s forced attack', () => {
  const stateOf = (id: string, over: Partial<StatusInstance> = {}): StatusInstance => ({ id: id as StatusInstance['id'], turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false, ...over });
  const defend = (): Command => ({ kind: 'defend', targets: [] });

  /** An engine with Tidus, Yuna and Auron against two dummies; `ready` may afflict them before the first turn. */
  function engineWith(seed: number, ready: (state: BattleState) => void) {
    const reg = new FFXContentRegistry();
    reg.addAbilities([...CORE_ABILITIES]);
    const dummy = (id: string) => enemy({ id, stats: stats({ hp: 99999, maxHp: 99999, agi: 5 }) });
    const e = createFFXEngine({ content: reg });
    e.init(setup({ seed, enemies: { id: 'pair', game: 'ffx', enemies: [dummy('e1'), dummy('e2')], canEscape: false } }));
    ready(e.state() as BattleState);
    return e;
  }

  /** The first action of `who`: its command and targets, taken from the events (the party defends on every menu). */
  function firstAction(e: ReturnType<typeof engineWith>, who: string): { abilityId?: string; targets: string[]; menus: number } {
    let menus = 0;
    for (let i = 0; i < 400; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      const events = d.kind === 'resolved' ? d.events : d.kind === 'player-input' ? [] : [];
      for (const ev of events) {
        if (ev.type === 'action-start' && ev.actorId === who) return { ...(ev.abilityId !== undefined ? { abilityId: ev.abilityId } : {}), targets: [...ev.targets], menus };
      }
      if (d.kind === 'player-input') {
        if (d.actorId === who) menus += 1;
        for (const ev of e.submit(defend())) {
          if (ev.type === 'action-start' && ev.actorId === who) return { ...(ev.abilityId !== undefined ? { abilityId: ev.abilityId } : {}), targets: [...ev.targets], menus };
        }
      }
    }
    throw new Error(`${who} never acted`);
  }

  it('a Berserk party member swings at an enemy without opening a menu, and a Confused one at its own side, itself included', () => {
    const seenSelf = new Set<string>();
    for (let seed = 1; seed <= 24; seed++) {
      const berserk = engineWith(seed, (s) => { s.combatants['tidus']!.statuses['berserk'] = stateOf('berserk'); });
      const b = firstAction(berserk, 'tidus');
      expect(b.menus, `seed ${seed}: Berserk opens no menu`).toBe(0);
      expect(['e1', 'e2'], `seed ${seed}`).toContain(b.targets[0]);
      const confused = engineWith(seed, (s) => { s.combatants['yuna']!.statuses['confuse'] = stateOf('confuse'); });
      const c = firstAction(confused, 'yuna');
      expect(c.menus, `seed ${seed}: Confuse opens no menu`).toBe(0);
      expect(['tidus', 'yuna', 'auron'], `seed ${seed}: its own side`).toContain(c.targets[0]);
      seenSelf.add(c.targets[0] as string);
    }
    expect(seenSelf, 'over 24 seeds a Confused Yuna swings at herself and at both friends').toEqual(new Set(['tidus', 'yuna', 'auron']));
  });

  it('a Provoked monster spends its turn attacking the provoker, whatever its script would have picked, and the Provoke of a dead provoker is cleared', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const provoked = engineWith(seed, (s) => { s.combatants['e1']!.statuses['provoke'] = stateOf('provoke', { sourceId: 'auron' }); });
      expect(firstAction(provoked, 'e1').targets, `seed ${seed}`).toEqual(['auron']);
    }
    const hits = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      const gone = engineWith(seed, (s) => {
        const auron = s.combatants['auron'] as FFXCombatant;
        auron.alive = false;
        auron.hp = 0;
        auron.statuses['ko'] = stateOf('ko');
        s.combatants['e1']!.statuses['provoke'] = stateOf('provoke', { sourceId: 'auron' });
      });
      const a = firstAction(gone, 'e1');
      hits.add(a.targets[0] as string);
      expect(gone.state().combatants['e1']!.statuses['provoke'], `seed ${seed}: the bit is cleared`).toBeUndefined();
    }
    expect([...hits].sort(), 'with the provoker gone the monster acts as it would have: at a living member').toEqual(['tidus', 'yuna']);
  });

  it('Provoke first, then Berserk: a Provoked Berserk monster goes for the provoker, not for the pick Berserk would have made', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const e = engineWith(seed, (s) => {
        s.combatants['e1']!.statuses['provoke'] = stateOf('provoke', { sourceId: 'yuna' });
        s.combatants['e1']!.statuses['berserk'] = stateOf('berserk');
      });
      expect(firstAction(e, 'e1').targets, `seed ${seed}`).toEqual(['yuna']);
    }
  });
});

describe('the Tidus counters', () => {
  /** A board with Tidus, Yuna and Auron against one monster, nobody guarding. */
  function plain(): Board {
    const r = lcg(1);
    const board = randomBoard(r);
    const monster = board.members.find((m) => m.side === 'enemy') as Member;
    const heroes: Member[] = ['tidus', 'yuna', 'auron'].map((id) => ({ ...monster, id, side: 'party', slot: PARTY_IDS.indexOf(id as never) }));
    board.members = [monster, ...heroes];
    for (const m of board.members) Object.assign(m, { dead: false, petrified: false, sleep: false, confuse: false, berserk: false, threaten: false, reflect: false, guard: false, sentinel: false, guardMark: false, untargetable: false, hp: 2000, provokedBy: null });
    board.bond = [0, 0, 0, 0, 0, 0, 0, 0];
    return board;
  }
  const heal: AbilityDef = { ...abilityOfSpec({ kind: 'cure', hits: 1 }), flags: ['heals'], power: 5 };
  const hurt = abilityOfSpec({ kind: 'cure', hits: 1 });

  it('Tidus healing a party member adds one to that member\'s counter, and hurting one takes one off (not below 0)', () => {
    const board = plain();
    const { ctx, byId } = contextOfBoard(board, 3);
    const tidus = byId.get('tidus')!;
    byId.get('yuna')!.hp = 500;
    resolveAbility(ctx, tidus, heal, ['yuna']);
    expect(ctx.rt.coverBond).toEqual([0, 1, 0, 0, 0, 0, 0, 0]);
    resolveAbility(ctx, tidus, hurt, ['auron']);
    expect(ctx.rt.coverBond).toEqual([0, 1, 0, 0, 0, 0, 0, 0]); // Auron's counter was 0: it stays 0
    resolveAbility(ctx, tidus, hurt, ['yuna']);
    expect(ctx.rt.coverBond).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('only Tidus\'s own actions feed it, and never the counter of slot 0', () => {
    const board = plain();
    const { ctx, byId } = contextOfBoard(board, 4);
    byId.get('yuna')!.hp = 500;
    resolveAbility(ctx, byId.get('auron')!, heal, ['yuna']);
    resolveAbility(ctx, byId.get('tidus')!, heal, ['tidus']);
    expect(ctx.rt.coverBond).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });
});

describe('which commands bounce is the record\'s bit, per target (G2)', () => {
  const byId = (id: string): AbilityDef => ALL_ABILITIES.find((a) => a.id === id) as AbilityDef;

  it('the multi-target spells the record flags bounce, and so do Scan, Life and Full-Life; Dispel, Auto-Life, Demi, Ultima and the Furies do not', () => {
    for (const id of ['hastega', 'slowga', 'nulblaze', 'nulfrost', 'nulshock', 'nultide', 'scan', 'life', 'full-life-spell', 'fire', 'cure', 'thundaga', 'death']) {
      const def = byId(id);
      if (def === undefined) continue; // the data carries the ids it carries
      expect(reflectableDef(def), id).toBe(true);
    }
    for (const id of ['dispel', 'auto-life', 'demi', 'ultima', 'fire-fury', 'ultra-cure', 'pray', 'potion']) {
      const def = byId(id);
      if (def === undefined) continue;
      expect(reflectableDef(def), id).toBe(false);
    }
    // the ids this lane relies on exist in the data
    for (const id of ['hastega', 'slowga', 'scan', 'dispel']) expect(byId(id), id).toBeDefined();
  });

  it('an all-allies spell cast at a party that holds Reflect bounces off the holder only, to a random monster (Hastega on a Reflecting Rikku)', () => {
    const r = lcg(3);
    const board = randomBoard(r);
    const proto = board.members[0] as Member;
    const heroes: Member[] = ['tidus', 'rikku'].map((id, i) => ({ ...proto, id, side: 'party', slot: PARTY_IDS.indexOf(id as never), hp: 2000 + i }));
    const monsters: Member[] = ['m0', 'm1'].map((id, i) => ({ ...proto, id, side: 'enemy', slot: 0x14 + i, hp: 3000 }));
    board.members = [...heroes, ...monsters];
    for (const m of board.members) Object.assign(m, { dead: false, petrified: false, sleep: false, confuse: false, berserk: false, threaten: false, reflect: false, guard: false, sentinel: false, guardMark: false, untargetable: false, provokedBy: null });
    board.members[1]!.reflect = true; // Rikku
    const { ctx, events, byId: ids } = contextOfBoard(board, 9);
    const hastega = byId('hastega');
    resolveAbility(ctx, ids.get('tidus')!, hastega, []);
    const touched = events.filter((e) => e['targetId'] !== undefined).map((e) => e['targetId']);
    // Tidus is hasted, Rikku's own is turned back at an enemy: the spell reached an enemy and not Rikku
    expect(touched).toContain('tidus');
    expect(touched).not.toContain('rikku');
    expect(touched.some((t) => t === 'm0' || t === 'm1')).toBe(true);
  });
});
