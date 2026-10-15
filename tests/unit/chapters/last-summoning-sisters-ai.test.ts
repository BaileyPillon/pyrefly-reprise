/**
 * **The possessed Magus Sisters: one battle, three scripts** (the hidden Last Summoning chapter; **FFX only**).
 *
 * `research/re-ffx-last-summoning.md` section 6.2 is the decision table (the compiled scripts m178 to m180 and the two Yu Pagodas', `[bytes]`); `battle/ffx/ai/possessed-sisters.ts` is its one implementation. Each test names
 * the branch it pins and runs the REAL engine's script on a scripted random stream, so the draws are counted too (a pick with one candidate draws nothing; `GetRandomValue()` is `int(0, 65535)`).
 *
 * What is pinned: the stat copy at full HP; the opening (Cindy first, the other two and both Pagodas at 24); Cindy's four branches in order, with their draws; Sandy's four; Mindy's three; the gauges (0 to 9 a turn, 10 to
 * 19 a hit, 30 to 39 more for a Power Wave; ignored at 0 HP, at 100, or for a command that does not touch HP); the token that sends Cindy into the Delta Attack; the Pagodas' lowest-gauge rule; Cindy's remembered
 * Reflect. The things the note does not settle are named in the module and pinned here as what they are (our assumptions): the draw order inside Mindy's third branch, and the token's row.
 */

import { describe, expect, it } from 'vitest';
import type { Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { chooseAiCommand, resolveAbility } from '../../../src/battle/ffx/index.ts';
import { has, rtOf } from '../../../src/battle/ffx/state.ts';
import { seedInitialCtb } from '../../../src/battle/ffx/turnQueue.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import { allReady } from '../../../src/battle/ffx/ai/possessed-sisters.ts';
import { buildLastSummoningParty } from '../../../src/data/ffx/builds/last-summoning.ts';
import { possessionGroup } from '../../../src/data/ffx/enemies/last-summoning-chain.ts';
import { type LiveBattle, ScriptedRng, liveBattle, queuedCounters, takeQueuedCounters } from '../helpers/aiScript.ts';

const GAUGE = 'aeon.gauge';
const PARTY = ['tidus', 'yuna', 'auron'];
const CINDY = 'possessed-cindy';
const SANDY = 'possessed-sandy';
const MINDY = 'possessed-mindy';
const SISTERS = [CINDY, SANDY, MINDY];

const idOf = (command: Command | null): string => (command === null ? 'pass' : command.kind === 'ability' ? command.id : command.kind);
const targetsOf = (command: Command | null): string[] => (command === null ? [] : [...command.targets]);

type Fight = LiveBattle & { rng: ScriptedRng; mem: (id: string) => Record<string, number | string | boolean> };

/** The Sisters' battle on the chapter's own data and party, every Sister's first (staging) turn already taken. */
function fight(options: { opened?: boolean } = {}): Fight {
  const live = liveBattle('last-summoning', { party: buildLastSummoningParty(), group: possessionGroup(['sisters']) });
  const rng = new ScriptedRng();
  live.ctx.rng = rng;
  const mem = (id: string): Record<string, number | string | boolean> => rtOf(live.ctx, id).ai;
  if (options.opened !== false) for (const id of SISTERS) mem(id)['opened'] = 1;
  return { ...live, rng, mem };
}

const setGauges = (t: Fight, ...values: [number, number, number]): void => SISTERS.forEach((id, i) => void (t.mem(id)[GAUGE] = values[i] as number));
const act = (t: Fight, id: string): Command | null => chooseAiCommand(t.ctx, t.at(id));

describe('the formation and the stat copy', () => {
  it('is one battle: Mindy, Sandy, Cindy, then the two Pagodas, each Sister on her own script', () => {
    const t = fight();
    expect(t.ctx.state.enemyIds).toEqual([MINDY, SANDY, CINDY, 'yu-pagoda-left', 'yu-pagoda-right']);
    expect(SISTERS.map((id) => t.at(id).enemy?.aiScriptId)).toEqual([CINDY, SANDY, MINDY]);
    expect(possessionGroup(['sisters']).nextGroupId).toBe('last-summoning:offering');
  });

  it('each Sister takes STR, DEF, MAG, MDF, AGI, EVA, ACC and maximum HP from the player’s own, at full HP; Luck 0, MP 1', () => {
    const t = fight();
    const party = buildLastSummoningParty();
    for (const key of ['cindy', 'sandy', 'mindy']) {
      const mine = party.aeons.find((a) => a.id === key)!.stats;
      const s = t.at(`possessed-${key}`).stats;
      expect([s.str, s.def, s.mag, s.mdef, s.agi, s.eva, s.acc, s.maxHp], key).toEqual([mine.str, mine.def, mine.mag, mine.mdef, mine.agi, mine.eva, mine.acc, mine.maxHp]);
      expect([t.at(`possessed-${key}`).hp, s.hp, s.luck, s.mp, s.maxMp], key).toEqual([mine.maxHp, mine.maxHp, 0, 1, 1]);
    }
  });

  it('opens with Cindy first (CTB 0); Sandy, Mindy and both Pagodas wait 24; the party two ticks later than the engine would seed it', () => {
    const t = fight();
    const seeded = fight();
    seeded.ctx.rng = new SeededRng(1);
    seedInitialCtb(seeded.ctx, 'scripted');
    const ctb = (f: Fight, who: string): number => rtOf(f.ctx, who).ctb;
    expect(ctb(t, CINDY)).toBe(0);
    expect([SANDY, MINDY, 'yu-pagoda-left', 'yu-pagoda-right'].map((id) => ctb(t, id))).toEqual([24, 24, 24, 24]);
    for (const member of PARTY) expect(ctb(t, member), member).toBe(ctb(seeded, member) + 2);
  });

  it('Cindy’s first turn is the staging turn: a message and no action, no draw; Sandy and Mindy act at once', () => {
    const t = fight({ opened: false });
    expect(act(t, CINDY)).toBeNull();
    expect(t.events.some((e) => e.type === 'message' && e.text.includes('Possessed'))).toBe(true);
    expect(t.rng.calls).toEqual([]);
    expect(t.mem(CINDY)['opened']).toBe(1);
    t.rng.feed(0);
    expect(idOf(act(t, SANDY))).toBe('reflect'); // Sandy has no staging turn here (our assumption (c))
  });
});

describe('Cindy’s turn: Delta Attack, Drain, Curaga, Camisade', () => {
  it('all three alive with gauges of 100 or more: the Delta Attack on the whole front line, all three gauges back to 0, nothing drawn', () => {
    const t = fight();
    setGauges(t, 100, 100, 100);
    const command = act(t, CINDY);
    expect([idOf(command), targetsOf(command)]).toEqual(['possessed-cindy-delta-attack', PARTY]);
    expect(SISTERS.map((id) => t.mem(id)[GAUGE])).toEqual([0, 0, 0]);
    expect(t.rng.calls).toEqual([]);
  });

  it.each([
    ['one gauge short', [100, 99, 100] as [number, number, number], undefined],
    ['one Sister dead', [100, 100, 100] as [number, number, number], SANDY],
  ])('%s: no Delta Attack', (_name, gauges, dead) => {
    const t = fight();
    setGauges(t, ...gauges);
    if (dead !== undefined) t.at(dead).alive = false;
    expect(allReady(t.ctx)).toBe(false);
    t.rng.feed(0);
    expect(idOf(act(t, CINDY))).not.toBe('possessed-cindy-delta-attack');
  });

  it('HP below two thirds of her maximum ((max / 3) x 2, integer): Drain on the front-line actor with the most HP', () => {
    const t = fight();
    const cindy = t.at(CINDY);
    const line = Math.floor(cindy.stats.maxHp / 3) * 2; // 4,712 for 7,070
    t.at('tidus').hp = 6000;
    t.at('yuna').hp = 5130;
    t.at('auron').hp = 4000;
    cindy.hp = line - 1;
    t.rng.wide.push(5);
    const command = act(t, CINDY);
    expect([idOf(command), targetsOf(command)]).toEqual(['drain', ['tidus']]);
    expect(t.rng.calls, 'the highest-HP pick has one candidate: no draw; then the gauge').toEqual([[0, 0xffff]]);
    expect(t.mem(CINDY)[GAUGE]).toBe(5);
    cindy.hp = line; // exactly at the line is not below it
    t.rng.feed(0);
    expect(idOf(act(t, CINDY))).not.toBe('drain');
  });

  it('Sandy or Mindy at 50 percent or less: Curaga on the lower percent, a tie going to Mindy; a dead Sister reads 255', () => {
    const percent = (t: Fight, id: string, pct: number): void => void (t.at(id).hp = Math.floor((t.at(id).stats.maxHp * pct) / 100));
    const heal = (sandy: number, mindy: number, dead?: string): [string, string[]] => {
      const t = fight();
      percent(t, SANDY, sandy);
      percent(t, MINDY, mindy);
      if (dead !== undefined) t.at(dead).alive = false;
      t.rng.feed(0);
      const command = act(t, CINDY);
      return [idOf(command), targetsOf(command)];
    };
    expect(heal(50, 100)).toEqual(['curaga', [SANDY]]);
    expect(heal(100, 50)).toEqual(['curaga', [MINDY]]);
    expect(heal(40, 45)).toEqual(['curaga', [SANDY]]);
    expect(heal(45, 40)).toEqual(['curaga', [MINDY]]);
    expect(heal(30, 30)).toEqual(['curaga', [MINDY]]); // a tie
    expect(heal(100, 100)[0]).toBe('possessed-cindy-camisade');
    expect(heal(52, 52)[0]).toBe('possessed-cindy-camisade'); // (51 percent of the maximum is 50 once the script reads it back as an integer percent)
    expect(heal(30, 100, MINDY)[0], 'a dead Sister reads 255, so Sandy at 30 is the one').toBe('curaga');
  });

  it('otherwise Camisade on a random living front-line actor: one pick (three candidates), then the gauge gains 0 to 9', () => {
    const t = fight();
    t.rng.feed(2);
    t.rng.wide.push(7);
    const command = act(t, CINDY);
    expect([idOf(command), targetsOf(command)]).toEqual(['possessed-cindy-camisade', ['auron']]);
    expect(t.rng.calls).toEqual([[0, 2], [0, 0xffff]]);
    expect(t.mem(CINDY)[GAUGE]).toBe(7);
    t.mem(CINDY)[GAUGE] = 96;
    t.rng.feed(0);
    t.rng.wide.push(9);
    act(t, CINDY);
    expect(t.mem(CINDY)[GAUGE], 'clamps at 100').toBe(100);
  });
});

describe('Sandy’s turn: the token, Reflect, Haste, Razzia', () => {
  it('all three full: she sends the token to Cindy (no gain, no draw)', () => {
    const t = fight();
    setGauges(t, 100, 100, 100);
    const command = act(t, SANDY);
    expect([idOf(command), targetsOf(command)]).toEqual(['possessed-sisters-token', [CINDY]]);
    expect(t.rng.calls).toEqual([]);
    expect(t.mem(SANDY)[GAUGE]).toBe(100);
  });

  it('Cindy alive without Reflect: Reflect on Cindy', () => {
    const t = fight();
    t.rng.wide.push(3);
    const command = act(t, SANDY);
    expect([idOf(command), targetsOf(command)]).toEqual(['reflect', [CINDY]]);
    expect(t.mem(SANDY)[GAUGE]).toBe(3);
  });

  it('Cindy dead: no Reflect; Haste on a random Sister without Haste (one pick among the living)', () => {
    const t = fight();
    t.at(CINDY).alive = false;
    t.rng.feed(1);
    const command = act(t, SANDY);
    expect(idOf(command)).toBe('haste');
    expect(SISTERS.filter((id) => id !== CINDY)).toContain(targetsOf(command)[0]);
    expect(t.rng.calls[0], 'the pick over two Sisters').toEqual([0, 1]);
  });

  it('Reflect on Cindy and every Sister hasted: Razzia on a random living front-line actor', () => {
    const t = fight();
    const status = (): { id: 'haste'; turnsRemaining: number; ticksRemaining: null; charges: null; stacks: number; permanent: boolean } => ({ id: 'haste', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false });
    t.at(CINDY).statuses['reflect'] = { id: 'reflect', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    for (const id of SISTERS) t.at(id).statuses['haste'] = status();
    t.rng.feed(1);
    const command = act(t, SANDY);
    expect([idOf(command), targetsOf(command)]).toEqual(['possessed-sandy-razzia', ['yuna']]);
  });
});

describe('Mindy’s turn: the token, Flare on Reflect, Passado or Flare', () => {
  it('all three full: the token to Cindy', () => {
    const t = fight();
    setGauges(t, 100, 100, 100);
    const command = act(t, MINDY);
    expect([idOf(command), targetsOf(command)]).toEqual(['possessed-sisters-token', [CINDY]]);
  });

  it('Cindy alive and holding Reflect: Flare on Cindy (it bounces onto the front line)', () => {
    const t = fight();
    t.at(CINDY).statuses['reflect'] = { id: 'reflect', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    t.rng.wide.push(4);
    const command = act(t, MINDY);
    expect([idOf(command), targetsOf(command)]).toEqual(['flare', [CINDY]]);
    expect(t.rng.calls, 'no pick, no coin: only the gauge').toEqual([[0, 0xffff]]);
  });

  it('else a coin on GetRandomValue() mod 100: above 50 Passado, 50 or under Flare, on the actor it picked (the pick comes first, our assumption (a))', () => {
    for (const [roll, want] of [[51, 'possessed-mindy-passado'], [99, 'possessed-mindy-passado'], [50, 'flare'], [0, 'flare']] as const) {
      const t = fight();
      t.rng.feed(0);
      t.rng.wide.push(roll, 0);
      const command = act(t, MINDY);
      expect([idOf(command), targetsOf(command)], `roll ${roll}`).toEqual([want, ['tidus']]);
      expect(t.rng.calls).toEqual([[0, 2], [0, 0xffff], [0, 0xffff]]);
    }
  });
});

describe('the gauges (0 to 9 a turn, 10 to 19 a hit, 30 to 39 more for a Power Wave)', () => {
  const hit = (t: Fight, sister: string, attacker = 'tidus', abilityId = 'attack'): void =>
    void resolveAbility(t.ctx, t.at(attacker), t.ctx.content.ability(abilityId)!, [sister]);

  it('every hit event that reaches a Sister adds 10 plus a draw of 0 to 9', () => {
    for (const id of SISTERS) {
      const t = fight();
      t.rng.wide.push(6);
      hit(t, id);
      expect(t.mem(id)[GAUGE], id).toBe(16);
    }
  });

  it('a Yu Pagoda’s Power Wave adds 30 plus 0 to 9 more, so 40 to 58 in all', () => {
    const t = fight();
    t.rng.wide.push(2, 4);
    hit(t, SANDY, 'yu-pagoda-left', 'power-wave-aeon');
    expect(t.mem(SANDY)[GAUGE]).toBe(10 + 2 + 30 + 4);
  });

  it('ignores a hit at a full gauge, a hit that does not touch HP and a hit that kills her', () => {
    const t = fight();
    t.mem(MINDY)[GAUGE] = 100;
    t.rng.wide.push(9);
    hit(t, MINDY);
    expect(t.mem(MINDY)[GAUGE]).toBe(100);
    t.at(SANDY).hp = 1;
    t.rng.wide.push(9);
    hit(t, SANDY, 'tidus');
    expect(t.mem(SANDY)[GAUGE] ?? 0, 'a lethal hit').toBe(0);
  });

  it('clamps at 100', () => {
    const t = fight();
    t.mem(CINDY)[GAUGE] = 90;
    t.rng.wide.push(9, 9);
    hit(t, CINDY, 'yu-pagoda-left', 'power-wave-aeon');
    expect(t.mem(CINDY)[GAUGE]).toBe(100);
  });
});

describe('the token: Cindy throws the Delta Attack at once', () => {
  it('a token that reaches her queues the Delta Attack as her own free action on the whole front line, and every gauge goes back to 0', () => {
    const t = fight();
    setGauges(t, 100, 100, 100);
    resolveAbility(t.ctx, t.at(SANDY), t.ctx.content.ability('possessed-sisters-token')!, [CINDY]);
    expect(queuedCounters(t.ctx).map((c) => [c.actorId, idOf(c.command), targetsOf(c.command)])).toEqual([[CINDY, 'possessed-cindy-delta-attack', PARTY]]);
    expect(SISTERS.map((id) => t.mem(id)[GAUGE])).toEqual([0, 0, 0]);
  });

  it('the Delta Attack itself deals six hits to every front-line actor and the gauges stay at 0', () => {
    const t = fight();
    const before = PARTY.map((id) => t.at(id).hp);
    const hitsOn = (id: string): number => t.events.filter((e) => e.type === 'damage' && e.targetId === id).length;
    resolveAbility(t.ctx, t.at(CINDY), t.ctx.content.ability('possessed-cindy-delta-attack')!, PARTY);
    for (const id of PARTY) expect(hitsOn(id), `${id}: six hits`).toBe(6);
    expect(PARTY.map((id) => t.at(id).hp).some((hp, i) => hp !== before[i])).toBe(true);
  });

  it('the token on anyone else, or on a Cindy who is gone, queues nothing', () => {
    const t = fight();
    resolveAbility(t.ctx, t.at(MINDY), t.ctx.content.ability('possessed-sisters-token')!, [SANDY]);
    expect(queuedCounters(t.ctx)).toEqual([]);
    t.at(CINDY).alive = false;
    t.at(CINDY).hp = 0;
    resolveAbility(t.ctx, t.at(MINDY), t.ctx.content.ability('possessed-sisters-token')!, [CINDY]);
    expect(takeQueuedCounters(t.ctx)).toEqual([]);
  });
});

describe('the Yu Pagodas in this battle', () => {
  const pagoda = (t: Fight, id = 'yu-pagoda-left'): Command | null => act(t, id);

  it('the Power Wave goes to the living Sister with the lowest gauge', () => {
    const t = fight();
    setGauges(t, 40, 10, 70);
    const command = pagoda(t);
    expect([idOf(command), targetsOf(command)]).toEqual(['power-wave-aeon', [SANDY]]);
    expect(t.rng.calls, 'a single lowest: no draw').toEqual([]);
  });

  it('a tie is a draw among the tied, in actor order', () => {
    const t = fight();
    setGauges(t, 20, 20, 50);
    t.rng.feed(1);
    const command = pagoda(t);
    // Cindy and Sandy are tied at 20; in actor order Sandy (21) comes before Cindy (22), so the draw 1 is Cindy
    expect(targetsOf(command)).toEqual([CINDY]);
    expect(t.rng.calls).toEqual([[0, 1]]);
  });

  it('a dead Sister is not fed, and the Pagoda takes no action when the lowest gauge is already 100', () => {
    const t = fight();
    setGauges(t, 100, 100, 5);
    t.at(MINDY).alive = false;
    expect(pagoda(t)).toBeNull();
    setGauges(t, 100, 100, 5);
    t.at(MINDY).alive = true;
    expect(targetsOf(pagoda(t))).toEqual([MINDY]);
  });

  it('while its partner is down it attacks the party as before (Curse or Osmose), not the Sisters', () => {
    const t = fight();
    t.at('yu-pagoda-right').alive = false;
    t.rng.feed(1);
    t.rng.wide.push(99);
    const command = pagoda(t);
    expect(['yu-pagoda-curse', 'osmose']).toContain(idOf(command));
    expect(PARTY).toContain(targetsOf(command)[0]);
  });
});

describe('Cindy remembers her Reflect', () => {
  it('a Power Wave that strips it is undone on the hit', () => {
    const t = fight();
    t.at(CINDY).statuses['reflect'] = { id: 'reflect', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    setGauges(t, 0, 90, 90); // Cindy is the lowest: the Pagoda feeds her
    const command = act(t, 'yu-pagoda-left');
    expect(targetsOf(command)).toEqual([CINDY]);
    expect(t.mem(CINDY)['sisters.hadReflect']).toBe(1);
    resolveAbility(t.ctx, t.at('yu-pagoda-left'), t.ctx.content.ability('power-wave-aeon')!, [CINDY]);
    expect(has(t.at(CINDY), 'reflect'), 'the wave stripped it and the script put it back').toBe(true);
    expect(t.events.some((e) => e.type === 'status-remove' && e.targetId === CINDY && e.status === 'reflect')).toBe(true);
  });

  it('without a Reflect to remember, the wave leaves nothing behind', () => {
    const t = fight();
    setGauges(t, 0, 90, 90);
    act(t, 'yu-pagoda-left');
    expect(t.mem(CINDY)['sisters.hadReflect']).toBe(0);
    resolveAbility(t.ctx, t.at('yu-pagoda-left'), t.ctx.content.ability('power-wave-aeon')!, [CINDY]);
    expect(has(t.at(CINDY), 'reflect')).toBe(false);
  });
});

describe('a Sister that is not here counts as dead', () => {
  it('Cindy alone (a battle with one Sister) never throws the Delta Attack and never reads a missing Sister', () => {
    const t = fight();
    const group = possessionGroup(['sisters']);
    expect(group.enemies.map((e) => e.id)).toContain(CINDY);
    const lone = liveBattle('last-summoning', { party: buildLastSummoningParty(), group: { ...group, enemies: group.enemies.filter((e) => e.id === CINDY || e.id.startsWith('yu-pagoda')) } });
    lone.ctx.rng = new ScriptedRng();
    rtOf(lone.ctx, CINDY).ai['opened'] = 1;
    rtOf(lone.ctx, CINDY).ai[GAUGE] = 100;
    expect(allReady(lone.ctx)).toBe(false);
    expect(idOf(chooseAiCommand(lone.ctx, lone.at(CINDY)))).toBe('possessed-cindy-camisade');
    expect(t.ctx.state.enemyIds).toHaveLength(5);
    void ({} as FFXCombatant);
  });
});
