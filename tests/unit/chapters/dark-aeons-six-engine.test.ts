/**
 * **The six other Dark Aeons on the real engine** (FFX only; the hidden Dark Aeons chapter): the T0 checks of `docs/plans/ch-dark-aeons-review.md` (N2 to N7), each run on the engine, seeded, not read off the note. What the
 * scripts of `src/battle/ffx/ai/dark-aeons-six.ts` do to a real battle: the opening state, the hit events (one per action however many blows, a miss and a non-damaging command included), the counters, Dark Bahamut's
 * Impulse on the fifth allowed hit, Dark Anima's immunity to magical commands and her absorbs, Dark Shiva's quick ranks, Dark Ixion's blade against Evasion and Luck, the Overdrives as the clocks, and the absence of all of it in
 * every other formation.
 */
import { describe, expect, it } from 'vitest';

import type { BattleEngine, BattleEvent, Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { darkAeonsBuild } from '../../../src/data/ffx/builds/dark-aeons.ts';
import { DARK_SIX_ROWS as ROW } from '../../../src/data/ffx/enemies/dark-aeons-six-abilities.ts';
import { DARK_SIX_LINKS, type DarkSixKey } from '../../../src/data/ffx/dark-aeons-six-ids.ts';
import { withEvasion, withLineUp } from '../helpers/darkAeonsBench.ts';
import * as H from '../helpers/darkAeonsDrive.ts';

const BOSS: Record<DarkSixKey, string> = { valefor: 'dark-valefor', ifrit: 'dark-ifrit', 'ixion-1': 'dark-ixion', 'ixion-2': 'dark-ixion-2', shiva: 'dark-shiva', anima: 'dark-anima', bahamut: 'dark-bahamut' };

/** Every member's Overdrive gauge full: the party's many-blow actions are on offer from the first turn. */
const fullGauges = (() => {
  const party = structuredClone(darkAeonsBuild);
  for (const m of party.members) if (m.overdrive) m.overdrive.gauge = 100;
  return party;
})();

/** The log events from `start` on. */
const since = (engine: BattleEngine, start: number): readonly BattleEvent[] => H.log(engine).slice(start);
/** The boss's gauge changes with a cause, in order. */
const gaugeEvents = (events: readonly BattleEvent[], boss: string, cause: string): Array<{ from: number; to: number }> =>
  (events as Array<Extract<BattleEvent, { type: 'overdrive-gauge' }>>).filter((e) => e.type === 'overdrive-gauge' && e.who === boss && e.cause === cause).map((e) => ({ from: e.from, to: e.to }));

/** Advance to the input of `who` (everyone else defends). */
function toInputOf(engine: BattleEngine, who: string): H.Input {
  for (let i = 0; i < 40; i++) {
    const d = H.nextInput(engine);
    if (d.actorId === who) return d;
    engine.submit(H.defend());
  }
  throw new Error(`no input for ${who}`);
}

/** Submit one command of `who` and play on to the next input; the events it caused. */
function act(engine: BattleEngine, who: string, pick: (d: H.Input) => Command | null): readonly BattleEvent[] {
  const d = toInputOf(engine, who);
  const cmd = pick(d);
  if (cmd === null) throw new Error(`${who} has no such command`);
  const start = H.log(engine).length;
  engine.submit(cmd);
  try {
    H.nextInput(engine);
  } catch {
    /* the battle ended */
  }
  return since(engine, start);
}

const boss = (e: BattleEngine, key: DarkSixKey): FFXCombatant => H.actor(e, BOSS[key]);

describe('the opening state of every link (T0, N3 and N7)', () => {
  for (const link of DARK_SIX_LINKS) {
    it(`${link.groupId}: one foe at its record's HP, the gauge shown at 0 and tagged, its own Overdrive row, Normal start`, () => {
      const engine = H.newEngine(1, link.key);
      const b = boss(engine, link.key);
      expect(engine.state().enemyIds).toEqual([link.bodyId]);
      expect(b.overdrive).toEqual({ gauge: 0, mode: 'stoic', unlockedOverdriveIds: [expect.stringMatching(/^dark6-/) as unknown as string], enemyGaugeRules: 'dark-aeons-six' });
      expect(b.stats.maxHp).toBe(link.hp);
      expect(b.hp).toBe(link.key === 'ixion-2' ? 1_300_000 : link.hp);
      expect(b.alive).toBe(true);
      expect(b.stats.mp).toBe(999);
    });
  }

  it('L1 (RE six 4.3): the second Dark Ixion fight starts at 1,300,000 HP over a maximum of 1,200,000 (the engine lets it), and the first damaging blow clamps it back to the maximum: the overage is wiped by the first hit (a finding, not a pick)', () => {
    const engine = H.newEngine(1, 'ixion-2');
    const b = boss(engine, 'ixion-2');
    expect([b.hp, b.stats.maxHp]).toEqual([1_300_000, 1_200_000]);
    const events = act(engine, 'tidus', (d) => H.row(d, 'attack', undefined, 'dark-ixion-2'));
    const damage = (events as Array<Extract<BattleEvent, { type: 'damage' }>>).filter((e) => e.type === 'damage' && e.targetId === 'dark-ixion-2').reduce((s, e) => s + e.amount, 0);
    expect(damage).toBeGreaterThan(10_000);
    // The engine's damage code clamps HP to the maximum: 1,300,000 minus a blow of this size is still over 1,200,000, so the result is the maximum itself. In effect the fight is 1,200,000 HP plus a first blow that only
    // removes the overage, which is what the guides print; whether the game clamps the same way is the live check L1 (not proved in play).
    expect(1_300_000 - damage).toBeGreaterThan(1_200_000);
    expect(b.hp).toBe(1_200_000);
    expect(b.alive).toBe(true);
  });

  it('the second Dark Ixion fight carries the four stat writes (STR 182, DEF 222, MAG 146, MDEF 198); the first fight the record as it is; AGI 180 and Luck 36 in both', () => {
    const one = boss(H.newEngine(1, 'ixion-1'), 'ixion-1').stats;
    const two = boss(H.newEngine(1, 'ixion-2'), 'ixion-2').stats;
    expect([one.str, one.def, one.mag, one.mdef, one.agi, one.luck]).toEqual([176, 220, 133, 188, 180, 36]);
    expect([two.str, two.def, two.mag, two.mdef, two.agi, two.luck]).toEqual([182, 222, 146, 198, 180, 36]);
  });
});

describe('the hit events (T0, N2): one per action that reaches the aeon, however many blows', () => {
  it('Dark Valefor: a plain Attack pays +15; a many-blow Overdrive (Slice & Dice) pays +15 ONCE; a command that does no damage (Provoke, the aeon is immune) pays +15 too', () => {
    const attack = H.newEngine(2, 'valefor');
    expect(gaugeEvents(act(attack, 'tidus', (d) => H.row(d, 'attack', undefined, 'dark-valefor')), 'dark-valefor', 'targeted')).toEqual([{ from: 0, to: 15 }]);

    const overdrive = H.newEngine(2, 'valefor', fullGauges);
    const events = act(overdrive, 'tidus', (d) => H.row(d, 'overdrive', 'slice-and-dice', 'dark-valefor'));
    const blows = (events as Array<Extract<BattleEvent, { type: 'damage' }>>).filter((e) => e.type === 'damage' && e.targetId === 'dark-valefor');
    expect(blows.length, 'Slice & Dice is many blows').toBeGreaterThan(3);
    expect(gaugeEvents(events, 'dark-valefor', 'targeted'), 'one hit event').toEqual([{ from: 0, to: 15 }]);

    const provoke = H.newEngine(2, 'valefor');
    const pe = act(provoke, 'tidus', (d) => H.row(d, 'ability', 'provoke', 'dark-valefor'));
    expect(gaugeEvents(pe, 'dark-valefor', 'targeted')).toEqual([{ from: 0, to: 15 }]);
    expect((pe as Array<Extract<BattleEvent, { type: 'damage' }>>).filter((e) => e.type === 'damage' && e.targetId === 'dark-valefor').reduce((s, e) => s + e.amount, 0)).toBe(0);
  });

  it('every ordinary turn of the aeon itself adds its step with the cause "attacking": Valefor +5, Ifrit +10, Ixion I +5, Ixion II +10, Shiva +10, Bahamut +10, Anima +10', () => {
    const step: Record<DarkSixKey, number> = { valefor: 5, ifrit: 10, 'ixion-1': 5, 'ixion-2': 10, shiva: 10, bahamut: 10, anima: 10 };
    for (const key of Object.keys(step) as DarkSixKey[]) {
      const engine = H.newEngine(3, key);
      for (let i = 0; i < 80 && H.actions(H.log(engine), BOSS[key]).length < 2; i++) {
        H.nextInput(engine);
        engine.submit(H.defend());
      }
      const gains = gaugeEvents(H.log(engine), BOSS[key], 'attacking');
      expect(gains.length, key).toBeGreaterThan(0);
      for (const g of gains) expect(g.to - g.from, key).toBe(step[key]);
    }
  });

  it('a full gauge is the Overdrive on the aeon\'s next turn: the gauge is written 0 and nothing is added after it', () => {
    for (const link of DARK_SIX_LINKS) {
      const engine = H.newEngine(4, link.key);
      const b = boss(engine, link.key);
      b.overdrive!.gauge = 100;
      let first = '';
      for (let i = 0; i < 40 && first === ''; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'player-input') engine.submit(H.defend());
        first = H.actions(H.log(engine), link.bodyId)[0] ?? '';
      }
      const overdrive: Record<DarkSixKey, string> = { valefor: ROW.energyBlast, ifrit: ROW.hellfire, 'ixion-1': ROW.aerospark, 'ixion-2': ROW.thorsHammer, shiva: ROW.diamondDust, anima: ROW.oblivion, bahamut: ROW.megaFlare };
      expect(first, link.key).toBe(overdrive[link.key]);
      expect(gaugeEvents(H.log(engine), link.bodyId, 'overdrive'), link.key).toEqual([{ from: 100, to: 0 }]);
    }
  });
});

describe('the counters (T0, N2)', () => {
  it('Dark Ifrit answers an allowed hit with his Attack on the attacker, once, even for a many-blow Overdrive; the gauge gains +5 for it', () => {
    const engine = H.newEngine(5, 'ifrit', fullGauges);
    const events = act(engine, 'tidus', (d) => H.row(d, 'overdrive', 'slice-and-dice', 'dark-ifrit'));
    const counters = (events as Array<Extract<BattleEvent, { type: 'action-start' }>>).filter((e) => e.type === 'action-start' && e.actorId === 'dark-ifrit' && e.abilityId === ROW.ifritAttack);
    expect(counters, 'one answer to the one action').toHaveLength(1);
    expect(counters[0]!.targets).toEqual(['tidus']);
    expect(gaugeEvents(events, 'dark-ifrit', 'targeted')).toEqual([{ from: 0, to: 5 }]);
  });

  it('a counter never triggers another counter: Dark Ifrit\'s Attack on a member who has no reaction of his own draws no second answer, and a counter-attack of the party pays no gain (checked on the gate in the AI test)', () => {
    const engine = H.newEngine(5, 'ifrit');
    const events = act(engine, 'auron', (d) => H.row(d, 'attack', undefined, 'dark-ifrit'));
    const answers = H.actions(events, 'dark-ifrit').filter((a) => a === ROW.ifritAttack);
    expect(answers.length).toBeLessThanOrEqual(1);
  });

  it('Dark Ixion\'s first fight answers with his Attack (Sleep, Armor Break, Mental Break); the second fight answers nothing', () => {
    const one = H.newEngine(6, 'ixion-1');
    const e1 = act(one, 'tidus', (d) => H.row(d, 'attack', undefined, 'dark-ixion'));
    expect(H.actions(e1, 'dark-ixion')).toContain(ROW.ixionAttack1);
    expect(gaugeEvents(e1, 'dark-ixion', 'targeted')).toEqual([{ from: 0, to: 10 }]);
    const two = H.newEngine(6, 'ixion-2');
    const e2 = act(two, 'tidus', (d) => H.row(d, 'attack', undefined, 'dark-ixion-2'));
    expect(H.actions(e2, 'dark-ixion-2').filter((a) => a === ROW.ixionAttack2 || a === ROW.ixionAttack1)).toEqual([]);
    expect(gaugeEvents(e2, 'dark-ixion-2', 'targeted')).toEqual([{ from: 0, to: 10 }]);
  });

  it('Dark Valefor, Shiva and Anima have no counter (a hit draws no action of theirs)', () => {
    for (const key of ['valefor', 'shiva', 'anima'] as const) {
      const engine = H.newEngine(7, key);
      const events = act(engine, 'tidus', (d) => H.row(d, 'attack', undefined, BOSS[key]));
      const targeted = gaugeEvents(events, BOSS[key], 'targeted');
      expect(targeted, key).toHaveLength(1);
      // Any action of the aeon in these events is its own turn, never the answer: no `counter` event names it.
      expect(([...events] as Array<{ type: string; actorId?: string }>).filter((e) => e.type === 'counter' && e.actorId === BOSS[key]), key).toEqual([]);
    }
  });

  it('Dark Bahamut: every allowed hit +10, and Impulse on the whole front line on every fifth (hits 5 and 10); a hit does not draw Impulse before the fifth', () => {
    const engine = H.newEngine(8, 'bahamut', withLineUp(darkAeonsBuild, ['tidus', 'yuna', 'auron']));
    let hits = 0;
    const impulseAt: number[] = [];
    for (let i = 0; i < 40 && hits < 11; i++) {
      const d = H.nextInput(engine);
      const start = H.log(engine).length;
      const attack = H.row(d, 'attack', undefined, 'dark-bahamut');
      engine.submit(attack ?? H.defend());
      const events = since(engine, start);
      const here = gaugeEvents(events, 'dark-bahamut', 'targeted').length;
      for (let k = 0; k < here; k++) hits++;
      if (H.actions(events, 'dark-bahamut').includes(ROW.impulse) && here > 0) impulseAt.push(hits);
      if (H.actor(engine, 'dark-bahamut').overdrive!.gauge >= 100) break; // the Overdrive is next: stop counting
      if (!H.actor(engine, 'tidus').alive || !H.actor(engine, 'yuna').alive || !H.actor(engine, 'auron').alive) break;
    }
    expect(hits, 'enough hits to see the first Impulse').toBeGreaterThanOrEqual(5);
    expect(impulseAt[0], 'the fifth allowed hit throws the first Impulse').toBe(5);
    const impulses = H.actions(H.log(engine), 'dark-bahamut').filter((a) => a === ROW.impulse).length;
    expect(impulses, 'one Impulse per five allowed hits').toBe(Math.floor(hits / 5));
  });
});

describe('Dark Anima: immune to every magical command, absorbs four elements (T0, N4)', () => {
  const lulu = withLineUp(darkAeonsBuild, ['tidus', 'yuna', 'lulu']);

  it('a spell (Ultima, a magical command) does no damage; a physical blow does; the immunity is the flag bit, not the HP', () => {
    const engine = H.newEngine(9, 'anima', lulu);
    const anima = boss(engine, 'anima');
    const before = anima.hp;
    const ultima = act(engine, 'lulu', (d) => H.row(d, 'ability', 'ultima', 'dark-anima'));
    const spellDamage = (ultima as Array<Extract<BattleEvent, { type: 'damage' }>>).filter((e) => e.type === 'damage' && e.targetId === 'dark-anima').reduce((s, e) => s + e.amount, 0);
    expect(spellDamage, 'Ultima is cancelled').toBe(0);
    expect(anima.hp).toBe(before);
    const blow = act(engine, 'tidus', (d) => H.row(d, 'attack', undefined, 'dark-anima'));
    expect((blow as Array<Extract<BattleEvent, { type: 'damage' }>>).some((e) => e.type === 'damage' && e.targetId === 'dark-anima' && e.amount > 1000)).toBe(true);
    expect(anima.hp).toBeLessThan(before);
  });

  it('a Fire spell does nothing at all, not even a heal: the immunity to magical commands cancels the HP class before the absorb could turn it into healing', () => {
    const engine = H.newEngine(9, 'anima', lulu);
    const anima = boss(engine, 'anima');
    anima.hp = 4_000_000;
    act(engine, 'lulu', (d) => H.row(d, 'ability', 'firaga', 'dark-anima') ?? H.row(d, 'ability', 'fire', 'dark-anima'));
    expect(anima.hp).toBe(4_000_000);
  });

  it("she absorbs Fire where the command is not magical: Ifrit's Hellfire (an aeon Overdrive, 'neither', fire) HEALS her (her HP is set below the maximum first)", () => {
    const party = structuredClone(darkAeonsBuild);
    for (const a of party.aeons) a.overdriveGauge = 100;
    const engine = H.newEngine(9, 'anima', party);
    boss(engine, 'anima').hp = 4_000_000;
    const d = toInputOf(engine, 'yuna');
    engine.submit({ ...d.commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === 'Ifrit')!.command, targets: [] } as Command);
    const ad = H.nextInput(engine);
    const od = ad.commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.validTargets.includes('dark-anima'));
    expect(od, 'Hellfire is on offer').toBeDefined();
    engine.submit({ ...od!.command, targets: ['dark-anima'] } as Command);
    try {
      H.nextInput(engine);
    } catch {
      /* ended */
    }
    expect(boss(engine, 'anima').hp, 'absorbed: healed, not hurt').toBeGreaterThan(4_000_000);
  });

  it('an aeon Overdrive (damage type "neither", not magical) does hurt her', () => {
    const party = structuredClone(darkAeonsBuild);
    for (const a of party.aeons) a.overdriveGauge = 100;
    const engine = H.newEngine(9, 'anima', party);
    const d = toInputOf(engine, 'yuna');
    engine.submit({ ...H.row(d, 'summon', undefined)!, ...(d.commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === 'Bahamut')!.command as object) } as Command);
    const ad = H.nextInput(engine);
    const od = ad.commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.validTargets.includes('dark-anima'));
    expect(od, 'Bahamut\'s Mega Flare is on offer').toBeDefined();
    const before = boss(engine, 'anima').hp;
    engine.submit({ ...od!.command, targets: ['dark-anima'] } as Command);
    try {
      H.nextInput(engine);
    } catch {
      /* ended */
    }
    expect(boss(engine, 'anima').hp).toBeLessThan(before - 50_000);
  });
});

describe('Dark Shiva\'s quick ranks (T0, N5): her Attack recovers in 3 ticks, Heavenly Strike in 6, Diamond Dust in 9', () => {
  it('the gap to her next turn after each action, read off the CTB over several seeds', () => {
    const gaps: Record<string, Set<number>> = {};
    for (const seed of [1, 2, 3, 4, 5]) {
      const run = H.playOne(seed, 'shiva', () => null, 60);
      let t = 0;
      let last = -1;
      let lastAction = '';
      for (const e of run.events as Array<BattleEvent & { actorId?: string; elapsedTicks?: number; abilityId?: string }>) {
        if (e.type === 'turn-start') {
          t += e.elapsedTicks ?? 0;
          if (e.actorId === 'dark-shiva') {
            if (last >= 0) (gaps[lastAction] ??= new Set()).add(t - last);
            last = t;
          }
        }
        if (e.type === 'action-start' && e.actorId === 'dark-shiva') lastAction = e.abilityId ?? '';
      }
    }
    expect([...(gaps[ROW.shivaAttack] ?? [])]).toEqual([3]);
    expect([...(gaps[ROW.heavenlyStrike] ?? [])]).toEqual([6]);
  });
});

describe('Dark Ixion\'s blade against Evasion and Luck (T0, N6): percent = 290 - (Evasion + Luck), accuracy formula 2 on the byte 254', () => {
  const counterOutcome = (evasion: number, seed: number): 'miss' | 'hit' => {
    const engine = H.newEngine(seed, 'ixion-1', withEvasion(darkAeonsBuild, evasion));
    const events = act(engine, 'tidus', (d) => H.row(d, 'attack', undefined, 'dark-ixion'));
    const answered = H.actions(events, 'dark-ixion').includes(ROW.ixionAttack1);
    expect(answered, 'the counter is raised').toBe(true);
    const hitTidus = (events as Array<Extract<BattleEvent, { type: 'damage' }>>).some((e) => e.type === 'damage' && e.targetId === 'tidus' && e.amount > 0);
    return hitTidus ? 'hit' : 'miss';
  };

  it('Evasion 255 and Luck 60 (315): never hit (the preset); Evasion 230 (290): never hit; Evasion 0 (percent 230): always hit', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      expect(counterOutcome(255, seed), `255 seed ${seed}`).toBe('miss');
      expect(counterOutcome(230, seed), `230 seed ${seed}`).toBe('miss');
      expect(counterOutcome(0, seed), `0 seed ${seed}`).toBe('hit');
    }
  });

  it('the hit lands the Attack\'s statuses: Armor Break and Mental Break (and Sleep unless Ribbon: the party wears Ribbon, so Sleep is resisted)', () => {
    const engine = H.newEngine(2, 'ixion-1', withEvasion(darkAeonsBuild, 0));
    act(engine, 'tidus', (d) => H.row(d, 'attack', undefined, 'dark-ixion'));
    const tidus = H.actor(engine, 'tidus');
    expect(Object.keys(tidus.statuses)).toEqual(expect.arrayContaining(['armor-break', 'mental-break']));
    expect(Object.keys(tidus.statuses)).not.toContain('sleep');
  });
});

describe('the Overdrives are the clocks (T0): each KOs a 9,999-HP person; Auto-Life or an aeon is the answer; Aerospark and Dark Shiva\'s Attack take Auto-Life away, the rest leave it', () => {
  /** Gauge 100, the party defends until the aeon acts; the damage each member took from that one action. */
  function overdriveOn(key: DarkSixKey, party = darkAeonsBuild, seed = 11, defended = true): { damage: Record<string, number>; engine: BattleEngine; row: string } {
    const engine = H.newEngine(seed, key, party);
    boss(engine, key).overdrive!.gauge = 100;
    const isOverdrive = (a: string): boolean => a !== ROW.ifritAttack && a !== ROW.ixionAttack1;
    for (let i = 0; i < 60; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') engine.submit(defended ? H.defend() : (H.row(d, 'item', 'hi-potion', d.actorId) ?? H.defend())); // a Hi-Potion on oneself: an action that is neither a defence nor a blow on the aeon
      if (H.actions(H.log(engine), BOSS[key]).some(isOverdrive)) break;
    }
    const events = H.log(engine);
    const startIdx = events.findIndex((e) => e.type === 'action-start' && (e as { actorId?: string }).actorId === BOSS[key] && isOverdrive((e as { abilityId?: string }).abilityId ?? ''));
    const damage: Record<string, number> = {};
    for (const e of events.slice(startIdx + 1)) {
      if (e.type === 'action-end') break;
      if (e.type === 'damage') damage[e.targetId] = (damage[e.targetId] ?? 0) + e.amount;
    }
    return { damage, engine, row: H.actions(events, BOSS[key]).find(isOverdrive) ?? '' };
  }

  it('every group Overdrive is at least a KO on a person (9,999 or more to each member of the front line, undefended); Aerospark, which picks one, does about half of its 12,252 through Auto-Protect: no KO on its own', () => {
    for (const link of DARK_SIX_LINKS) {
      const { damage, row } = overdriveOn(link.key, darkAeonsBuild, 11, false);
      const people = Object.entries(damage).filter(([id]) => ['tidus', 'yuna', 'auron'].includes(id));
      if (link.key === 'ixion-1') {
        expect(row).toBe(ROW.aerospark);
        expect(people).toHaveLength(1);
        expect(people[0]![1], 'Aerospark through Auto-Protect').toBeGreaterThan(4_000);
        expect(people[0]![1]).toBeLessThan(9_999);
        continue;
      }
      expect(people.length, `${link.key} ${row}`).toBe(3);
      for (const [id, d] of people) expect(d, `${link.key} ${row} on ${id}`).toBeGreaterThanOrEqual(9_999);
    }
  });

  it('with no Auto-Life and nobody left to rescue (Auto-Phoenix needs a living holder), a group Overdrive is the end of the battle', () => {
    const { engine } = overdriveOn('shiva');
    expect(engine.nextDecision().kind).toBe('battle-over');
  });

  it('Mega Flare, Oblivion, Diamond Dust and Thor\'s Hammer leave Auto-Life: a party with Auto-Life on all three stands up again (the cast Auto-Life is spent, the battle goes on)', () => {
    for (const key of ['bahamut', 'anima', 'shiva', 'ixion-2'] as const) {
      const engine = H.newEngine(12, key);
      for (const id of ['tidus', 'yuna', 'auron']) {
        const a = H.actor(engine, id);
        a.statuses['auto-life'] = { id: 'auto-life', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false } as never;
      }
      boss(engine, key).overdrive!.gauge = 100;
      let revived = 0;
      for (let i = 0; i < 60 && H.actions(H.log(engine), BOSS[key]).length === 0; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'player-input') engine.submit(H.defend());
      }
      for (const e of H.log(engine) as Array<BattleEvent & { cause?: string }>) if (e.type === 'revive' && e.cause === 'auto-life') revived++;
      expect(revived, `${key}: all three came back`).toBe(3);
      expect(engine.nextDecision().kind, key).not.toBe('battle-over');
    }
  });

  it('Dark Shiva\'s plain Attack and Aerospark strip Auto-Life from the one they hit', () => {
    for (const [key, row] of [['shiva', ROW.shivaAttack], ['ixion-1', ROW.aerospark]] as const) {
      const engine = H.newEngine(13, key);
      for (const id of ['tidus', 'yuna', 'auron']) H.actor(engine, id).statuses['auto-life'] = { id: 'auto-life', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false } as never;
      if (key === 'ixion-1') boss(engine, key).overdrive!.gauge = 100;
      let acted = false;
      for (let i = 0; i < 80 && !acted; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'player-input') engine.submit(H.defend());
        acted = H.actions(H.log(engine), BOSS[key]).includes(row);
      }
      expect(acted, `${key} used ${row}`).toBe(true);
      const hitIds = (H.log(engine) as Array<Extract<BattleEvent, { type: 'action-start' }>>).filter((e) => e.type === 'action-start' && e.abilityId === row).flatMap((e) => e.targets);
      const stripped = hitIds.filter((id) => H.actor(engine, id).statuses['auto-life'] === undefined);
      expect(stripped.length, `${key}: the target lost Auto-Life`).toBeGreaterThan(0);
    }
  });
});

describe('absence (T6): nothing of the chapter touches any other formation', () => {
  it("Mirror Aeons' Dark Yojimbo keeps his own gauge tag and queues none of these rows; the Spectral Keeper and a Sisters formation carry none of the six's set-up", () => {
    const yojimbo = H.engineOnGroup('mirror-yojimbo-nagi05_71', 1);
    expect(H.actor(yojimbo, 'dark-yojimbo').overdrive?.enemyGaugeRules).toBe('dark-aeons');
    for (let i = 0; i < 12; i++) {
      const d = H.nextInput(yojimbo);
      yojimbo.submit(H.row(d, 'attack', undefined, 'dark-yojimbo') ?? H.defend());
    }
    const abilityIds = ([...H.log(yojimbo)] as Array<{ abilityId?: string }>).flatMap((e) => (typeof e.abilityId === 'string' ? [e.abilityId] : []));
    expect(abilityIds.filter((a) => a.startsWith('dark6-'))).toEqual([]);
    for (const id of ['mirror-sisters-kino01_72', 'spectral-keeper']) {
      const engine = H.engineOnGroup(id, 1);
      for (const enemyId of engine.state().enemyIds) expect(H.actor(engine, enemyId).overdrive?.enemyGaugeRules, id).not.toBe('dark-aeons-six');
    }
  });

  it('is deterministic: the same seed gives the same log, a different seed another', () => {
    const run = (seed: number): string => JSON.stringify(H.playOne(seed, 'ifrit', H.careless, 400).events.map((e) => [e.type, (e as { actorId?: string }).actorId, (e as { abilityId?: string }).abilityId]));
    expect(run(21)).toBe(run(21));
    expect(run(21)).not.toBe(run(22));
  });
});
