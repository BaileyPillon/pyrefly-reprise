/**
 * **Chapter XVII, link 3: Sinspawn Genais and Sin's Core** on the real FFX
 * engine (package G of `docs/plans/sin-two-chapters-plan.md` §2.4, with REVIEW
 * must-changes 1, 2 and 8 and the should-changes on Cura and the Reflect
 * bounce). Sources: `research/ffx-sin.md` §3.2, §3.3, §5.3. **FFX only.**
 *
 * Board set-ups (an HP value, a status) are written onto the live battle state
 * before a turn, then the engine plays the turn: every assertion reads what the
 * engine did (AGENTS.md hard rule 3).
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, BattleEvent, Command, Decision, FFXCombatant, FFXPartyBuild, StatusId, StatusInstance } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { sinFahrenheitBuild } from '../../../src/data/ffx/builds/sin-fahrenheit.ts';
import { SIN_CORE_ASSUMPTIONS } from '../../../src/battle/ffx/ai/sin-genais-core.ts';

const [G, C, V, T] = ['sinspawn-genais', 'sin-core', 'sin-genais-venom', 'sin-genais-thrashing'] as const;
type Input = Extract<Decision, { kind: 'player-input' }>;

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

/** The chapter's party with a chosen front line; test-only extras: Grenades, Valefor's gauge full, Fire on Ifrit. */
function party(active: FFXPartyBuild['activeSlots']): FFXPartyBuild {
  const b = structuredClone(sinFahrenheitBuild);
  b.activeSlots = active;
  b.reserve = b.members.map((m) => m.id).filter((id) => !(active as readonly string[]).includes(id));
  b.inventory = [...b.inventory, { itemId: 'grenade', count: 5 }];
  for (const a of b.aeons) {
    if (a.id === 'valefor') a.overdriveGauge = 100;
    if (a.id === 'ifrit') a.abilityIds = [...a.abilityIds, 'fire'];
  }
  return b;
}

function engine(seed: number, active: FFXPartyBuild['activeSlots'] = ['tidus', 'yuna', 'auron']): BattleEngine {
  const e = createFFXEngine({ content, autoResolveMinigames: true });
  e.init({ game: 'ffx', party: party(active), enemies: ENEMY_GROUPS_BY_ID['sin-genais-core']!, triggers: [], seed, condition: 'normal', canEscape: false });
  return e;
}

const live = (e: BattleEngine, id: string): FFXCombatant => e.state().combatants[id] as FFXCombatant;
const flags = (e: BattleEngine): Record<string, unknown> => e.state().flags as Record<string, unknown>;
const log = (e: BattleEngine): readonly BattleEvent[] => e.state().log;
const status = (id: StatusId, turns = 254): StatusInstance => ({ id, turnsRemaining: turns, ticksRemaining: null, charges: null, stacks: 0, permanent: false });
const defend: Command = { kind: 'defend', targets: [] };

/** Drive to `who`'s next menu (every other menu defends); `null` at the end. */
function turnOf(e: BattleEngine, who: string, max = 300): Input | null {
  for (let i = 0; i < max; i++) {
    const d = e.nextDecision();
    if (d.kind === 'battle-over') return null;
    if (d.kind !== 'player-input') continue;
    if (d.actorId === who) return d;
    e.submit(defend);
  }
  return null;
}

/** Drive until the enemy has taken `n` more turns (menus defend); an enemy turn resolves inside `nextDecision`. */
function enemyTurns(e: BattleEngine, who: string, n: number, max = 400): void {
  const count = (): number => log(e).filter((x) => x.type === 'turn-start' && x.actorId === who).length;
  const target = count() + n;
  for (let i = 0; i < max && count() < target; i++) {
    const d = e.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind === 'player-input') e.submit(defend);
  }
}

function row(d: Input, kind: Command['kind'], id?: string): AvailableCommand | undefined {
  return d.commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)));
}

/** Submit a row at `target` (or at every valid target for a party-wide row); throws when it is not offered. */
function act(e: BattleEngine, d: Input, kind: Command['kind'], id: string | undefined, target: string): number {
  const r = row(d, kind, id);
  if (!r) throw new Error(`${d.actorId} has no enabled ${kind} ${id ?? ''}`);
  if (kind !== 'summon' && !r.validTargets.includes(target)) throw new Error(`${d.actorId}'s ${kind} ${id ?? ''} cannot target ${target}`);
  const at = log(e).length;
  const all = r.command.kind === 'item' && id === 'grenade'; // party-wide: aim at every offered foe
  e.submit({ ...r.command, targets: kind === 'summon' ? [] : all ? [...r.validTargets] : [target] } as Command);
  return at;
}

const since = (e: BattleEngine, at: number): readonly BattleEvent[] => log(e).slice(at);
const counters = (events: readonly BattleEvent[], actorId: string): string[] =>
  events.flatMap((x) => (x.type === 'counter' && x.actorId === actorId ? [x.abilityId] : []));
const moves = (e: BattleEngine, actorId: string): string[] =>
  log(e).flatMap((x) => (x.type === 'action-start' && x.actorId === actorId && x.abilityId ? [x.abilityId] : []));
/** Where the counter's own damage landed: the damage events `from` sends after the counter event. */
function counterHits(events: readonly BattleEvent[], from: string, ability: string): string[] {
  const k = events.findIndex((x) => x.type === 'counter' && x.actorId === from && x.abilityId === ability);
  const out: string[] = [];
  if (k < 0) return out;
  for (const x of events.slice(k + 1)) {
    if (x.type === 'counter' || x.type === 'turn-start') break;
    if (x.type === 'damage' && x.sourceId === from) out.push(x.targetId);
  }
  return out;
}

/** Put Genais in its shell through its own turn (§5.3.1 item 3). */
function shell(e: BattleEngine): void {
  live(e, G).hp = 9_000;
  enemyTurns(e, G, 1);
  expect(flags(e)['sin.genais.shelled']).toBe(true);
}

describe('Genais out of its shell [§5.3.1 item 1, verified: 4 sources]', () => {
  it('runs Venom, Venom, Thrashing and repeats; Venom\'s single target is the seed\'s pick', () => {
    const targets = new Set<string>();
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const e = engine(seed);
      enemyTurns(e, G, 6);
      expect(moves(e, G).slice(0, 6), `seed ${seed}`).toEqual([V, V, T, V, V, T]);
      const first = log(e).find((x) => x.type === 'action-start' && x.actorId === G && x.abilityId === V);
      const hit = log(e).find((x, k) => first && k > log(e).indexOf(first) && x.type === 'damage' && x.sourceId === G);
      if (hit && hit.type === 'damage') targets.add(hit.targetId);
    }
    expect(targets.size).toBeGreaterThan(1);
  });

  it('Venom is physical: Protect halves it (same seed, same roll)', () => {
    const venomOn = (protect: boolean): { target: string; amount: number } => {
      const e = engine(7);
      if (protect) for (const id of ['tidus', 'yuna', 'auron']) live(e, id).statuses['protect'] = status('protect');
      enemyTurns(e, G, 1);
      const k = log(e).findIndex((x) => x.type === 'action-start' && x.actorId === G && x.abilityId === V);
      const hit = log(e).slice(k).find((x) => x.type === 'damage' && x.sourceId === G);
      if (!hit || hit.type !== 'damage') throw new Error('no Venom damage');
      return { target: hit.targetId, amount: hit.amount };
    };
    const bare = venomOn(false);
    const guarded = venomOn(true);
    expect(guarded.target).toBe(bare.target);
    expect(guarded.amount).toBeLessThanOrEqual(Math.ceil(bare.amount / 2));
    expect(guarded.amount).toBeGreaterThan(0);
  });
});

describe('The shell [§5.3.1 items 3-5; S-2 default]', () => {
  it('shells on its own turn at 10,000 HP or less, not at 10,001', () => {
    const e = engine(3);
    live(e, G).hp = 10_001;
    enemyTurns(e, G, 1);
    expect(moves(e, G).at(-1)).toBe(V);
    expect(flags(e)['sin.genais.shelled']).toBe(false);
    live(e, G).hp = 10_000;
    enemyTurns(e, G, 1);
    expect(moves(e, G).at(-1)).toBe('sin-genais-shell-in');
    expect(flags(e)['sin.genais.shelled']).toBe(true);
    expect(live(e, G).immunityFlags).toEqual(expect.arrayContaining(['armored', 'immune-to-percentage-damage']));
    expect(flags(e)['sin.core.state']).toBe('charging');
    enemyTurns(e, G, 1);
    expect(moves(e, G).at(-1)).toBe('sin-genais-sigh');
  });

  it('in the shell, Cura answers each action that hits it, once per action (a status-only action draws none); out at 12,000+', () => {
    const e = engine(4, ['tidus', 'wakka', 'auron']);
    shell(e);
    for (let n = 0; n < 2; n++) {
      const d = turnOf(e, 'wakka')!;
      delete live(e, 'wakka').statuses['darkness']; // Sigh's Darkness makes a swing miss, and a miss is not a hit
      const at = act(e, d, 'attack', undefined, G); // `submit` resolves the action and its counters
      expect(counters(since(e, at), G)).toEqual(['sin-genais-cura']);
      const k = since(e, at).findIndex((x) => x.type === 'counter' && x.abilityId === 'sin-genais-cura');
      const heal = since(e, at).slice(k).find((x) => x.type === 'damage' && x.targetId === G);
      expect(heal && heal.type === 'damage' ? heal.amount : 0).toBeLessThan(0); // on itself, a heal
    }
    expect(counters(since(e, act(e, turnOf(e, 'tidus')!, 'ability', 'slow', G)), G)).toEqual([]);
    live(e, G).hp = 12_000;
    enemyTurns(e, G, 1);
    expect(moves(e, G).at(-1)).toBe('sin-genais-shell-out');
    expect(flags(e)['sin.genais.shelled']).toBe(false);
    expect(live(e, G).immunityFlags).not.toContain('armored');
    expect(live(e, G).immunityFlags).not.toContain('immune-to-percentage-damage');
  });
});

describe('Waterga on the caster [§3.2 "the caster", verified: 4 sources; REVIEW must-change 1]', () => {
  it("answers Lulu's Fire on Genais by landing on Lulu, on every seed; Auron's Attack draws nothing", () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const e = engine(seed, ['lulu', 'wakka', 'auron']);
      const at = act(e, turnOf(e, 'lulu')!, 'ability', 'fire', G);
      turnOf(e, 'auron');
      expect(counters(since(e, at), G), `seed ${seed}`).toEqual(['sin-genais-waterga']);
      expect(counterHits(since(e, at), G, 'sin-genais-waterga'), `seed ${seed}`).toEqual(['lulu']);
      const at2 = act(e, turnOf(e, 'auron')!, 'attack', undefined, G);
      turnOf(e, 'lulu');
      expect(counters(since(e, at2), G), `seed ${seed}`).toEqual([]);
    }
  });

  it('lands on an aeon caster too (Ifrit, Fire)', () => {
    for (const seed of [1, 2, 3, 4]) {
      const e = engine(seed, ['yuna', 'wakka', 'auron']);
      act(e, turnOf(e, 'yuna')!, 'summon', 'ifrit', 'yuna');
      const at = act(e, turnOf(e, 'ifrit')!, 'ability', 'fire', G);
      turnOf(e, 'ifrit');
      expect(counterHits(since(e, at), G, 'sin-genais-waterga'), `seed ${seed}`).toEqual(['ifrit']);
    }
  });

  it('a Waterga bounced off a Reflected caster lands on Genais (absorbed) or the Core (0 while Genais lives), by seed', () => {
    const seen = new Set<string>();
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      const e = engine(seed, ['lulu', 'wakka', 'auron']);
      live(e, 'lulu').statuses['reflect'] = status('reflect');
      const d = turnOf(e, 'lulu')!;
      const core = live(e, C).hp;
      const at = act(e, d, 'ability', 'fire', G);
      turnOf(e, 'auron');
      const landed = counterHits(since(e, at), G, 'sin-genais-waterga');
      expect(landed).toHaveLength(1);
      expect([G, C]).toContain(landed[0]);
      seen.add(landed[0]!);
      if (landed[0] === C) expect(live(e, C).hp).toBe(core);
      // The bounce is not "aimed at" either of them: nothing answers it (label `reflect-bounce`).
      expect(counters(since(e, at), C)).toEqual([]);
    }
    expect(seen).toEqual(new Set([G, C]));
  });
});

describe('The Core while Genais lives [§5.3.1 item 7, verified: 4 sources]', () => {
  it("Lulu's Firaga at the Core deals 0 and shows \"Magic absorbed.\"; it lands once Genais is dead", () => {
    const e = engine(5, ['lulu', 'wakka', 'auron']);
    const hp = live(e, C).hp;
    const at = act(e, turnOf(e, 'lulu')!, 'ability', 'firaga', C);
    turnOf(e, 'wakka');
    expect(live(e, C).hp).toBe(hp);
    expect(counters(since(e, at), G)).toContain('sin-magic-absorbed');
    live(e, G).hp = 1;
    act(e, turnOf(e, 'wakka')!, 'attack', undefined, G);
    const d = turnOf(e, 'lulu')!;
    expect(live(e, G).alive).toBe(false);
    const at2 = act(e, d, 'ability', 'firaga', C);
    turnOf(e, 'wakka');
    expect(live(e, C).hp).toBeLessThan(hp);
    expect(counters(since(e, at2), G)).toEqual([]);
  });

  it("Auron's Attack cannot target the Core while Genais lives, Wakka's can; after Genais dies Auron's can", () => {
    const e = engine(6, ['tidus', 'wakka', 'auron']);
    const a = turnOf(e, 'auron')!;
    expect(row(a, 'attack')!.validTargets).not.toContain(C);
    e.submit(defend);
    const w = turnOf(e, 'wakka')!;
    expect(row(w, 'attack')!.validTargets).toContain(C);
    live(e, G).hp = 1;
    act(e, w, 'attack', undefined, G);
    expect(row(turnOf(e, 'auron')!, 'attack')!.validTargets).toContain(C);
  });
});

describe("The Core's turns and counters [§5.3.2]", () => {
  it('is inactive while Genais is out; gathers then Gravija while it is shelled', () => {
    const e = engine(2);
    enemyTurns(e, C, 2);
    expect(moves(e, C).slice(0, 2)).toEqual(['sin-core-inactive', 'sin-core-inactive']);
    shell(e);
    enemyTurns(e, C, 2);
    expect(moves(e, C).slice(-2)).toEqual(['sin-core-gathers', 'sin-core-gravija']);
  });

  it('a charged Gravija hurts an unshelled Genais and never the Core (S-14)', () => {
    const e = engine(8);
    flags(e)['sin.core.state'] = 'ready';
    const [g, c] = [live(e, G).hp, live(e, C).hp];
    enemyTurns(e, C, 1);
    expect(moves(e, C).at(-1)).toBe('sin-core-gravija');
    expect(live(e, G).hp).toBe(g - Math.floor((g * 12) / 16));
    expect(live(e, C).hp).toBe(c);
    expect(flags(e)['sin.core.state']).toBe('inactive');
  });

  it('counters Negation first when it rolls, otherwise Fire, Blizzard, Thunder, Water, cycling', () => {
    const e = engine(9, ['tidus', 'wakka', 'auron']);
    const seen: string[] = [];
    for (let n = 0; n < 6; n++) {
      const d = turnOf(e, 'wakka')!;
      // Board set-up: the party kept standing (not this test's subject), the Core's chance pinned for this targeting.
      for (const id of ['tidus', 'wakka', 'auron']) {
        live(e, id).hp = live(e, id).stats.maxHp;
        delete live(e, id).statuses['poison'];
      }
      flags(e)['sin.core.negationChance'] = n === 0 ? 1 : 0;
      seen.push(...counters(since(e, act(e, d, 'attack', undefined, C)), C));
    }
    expect(seen).toEqual(['sin-core-negation', 'sin-core-fire', 'sin-core-blizzard', 'sin-core-thunder', 'sin-core-water', 'sin-core-fire']);
    expect(typeof flags(e)['sin.negation.lastTaken']).toBe('string'); // JSON: flags hold scalars
  });

  it("recalculates Negation's chance on its turn (S-12, labelled): both Breaks on the Core read 3/8", () => {
    const e = engine(10);
    for (const s of ['armor-break', 'mental-break'] as const) live(e, C).statuses[s] = status(s);
    enemyTurns(e, C, 1);
    expect(flags(e)['sin.core.negationChance']).toBeCloseTo(3 / 8);
  });

  it('carries every estimate as data', () => {
    const ids = SIN_CORE_ASSUMPTIONS.map((a) => a.id);
    for (const id of ['S-2', 'S-12', 'S-13-before', 'S-13-after', 'absorbed-draws-counter', 'cura-per-action', 'reflect-bounce', 'S-15']) {
      expect(ids).toContain(id);
    }
  });
});

describe('The Core falls: victory with Genais standing [§5.3.2 item 5, verified: 2 sources; REVIEW must-change 2]', () => {
  const finish = (e: BattleEngine): void => { for (let i = 0; i < 50 && e.nextDecision().kind !== 'battle-over'; i++) e.submit(defend); };

  const expectCoreOnlyVictory = (e: BattleEngine, at: number): void => {
    finish(e);
    const r = e.state().result!;
    expect([r.outcome, live(e, G).alive]).toEqual(['victory', true]);
    expect(r.gil).toBe(10_000); // the Core's, not Genais's
    expect([18_000, 27_000]).toContain(r.ap);
    expect(r.drops.map((x) => x.itemId)).not.toContain('return-sphere');
    expect(since(e, at).filter((x) => x.type === 'turn-start' && x.actorId === G)).toHaveLength(0);
    expect(flags(e)['sin.core.down']).toBe(true);
  };

  it('by Attack (Wakka)', () => {
    const e = engine(11, ['tidus', 'wakka', 'auron']);
    const d = turnOf(e, 'wakka')!;
    live(e, C).hp = 1;
    expectCoreOnlyVictory(e, act(e, d, 'attack', undefined, C));
  });

  it("by an ability (Wakka's Dark Attack)", () => {
    const e = engine(12, ['tidus', 'wakka', 'auron']);
    const d = turnOf(e, 'wakka')!;
    live(e, C).hp = 1;
    expectCoreOnlyVictory(e, act(e, d, 'ability', 'dark-attack', C));
  });

  it('by an item (a Grenade over both)', () => {
    const e = engine(13, ['tidus', 'wakka', 'auron']);
    const d = turnOf(e, 'tidus')!;
    live(e, C).hp = 1;
    expectCoreOnlyVictory(e, act(e, d, 'item', 'grenade', C));
  });

  it("by an Overdrive (Valefor's Energy Ray)", () => {
    const e = engine(14, ['yuna', 'wakka', 'auron']);
    act(e, turnOf(e, 'yuna')!, 'summon', 'valefor', 'yuna');
    const d = turnOf(e, 'valefor')!;
    live(e, C).hp = 1;
    expectCoreOnlyVictory(e, act(e, d, 'overdrive', 'energy-ray', C));
  });
});

describe('Genais dies off the player-side path: the liveness hook (REVIEW must-change 2)', () => {
  it('Doom on Genais at the start of its turn frees the Core', () => {
    const e = engine(15, ['tidus', 'wakka', 'auron']);
    live(e, G).statuses['doom'] = status('doom', 1);
    enemyTurns(e, G, 1);
    const d = turnOf(e, 'auron')!;
    expect(live(e, G).alive).toBe(false);
    expect(live(e, C).flags.outOfMeleeReach).not.toBe(true);
    expect(live(e, C).immunityFlags).not.toContain('immune-to-magical-damage');
    expect(['free', 'ready']).toContain(flags(e)['sin.core.state']); // free, or already gathering on its own turn since
    expect(row(d, 'attack')!.validTargets).toContain(C);
    expect(e.state().result ?? null).toBeNull();
  });

  it('Zombie + its own Cura kills Genais; the Core is freed by the next action and the Core then runs free', () => {
    const e = engine(16, ['tidus', 'wakka', 'auron']);
    shell(e);
    live(e, G).statuses['zombie'] = status('zombie');
    live(e, G).hp = 1_000; // a Grenade (fixed 350) leaves it standing; its own Cura then kills it
    const at = act(e, turnOf(e, 'tidus')!, 'item', 'grenade', G);
    expect(counters(since(e, at), G)).toContain('sin-genais-cura');
    expect(live(e, G).alive).toBe(false);
    enemyTurns(e, C, 1);
    expect(live(e, C).flags.outOfMeleeReach).not.toBe(true);
    expect(live(e, C).immunityFlags).not.toContain('immune-to-magical-damage');
    expect(['free', 'ready']).toContain(flags(e)['sin.core.state']);
    expect(e.state().result ?? null).toBeNull();
  });

  it('is deterministic: the same seed and inputs give the same log', () => {
    const run = (): string => {
      const e = engine(17, ['lulu', 'wakka', 'auron']);
      for (let i = 0; i < 12; i++) {
        const d = turnOf(e, 'lulu');
        if (!d) break;
        act(e, d, 'ability', 'fire', i % 2 === 0 ? G : C);
      }
      return JSON.stringify(log(e));
    };
    expect(run()).toBe(run());
  });
});
